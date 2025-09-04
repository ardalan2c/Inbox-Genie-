import { Body, Controller, HttpException, HttpStatus, Post } from '@nestjs/common'
import { PrismaService } from '../../services/prisma.service'
import { ComplianceService } from '../../services/compliance.service'
import { RetellProvider } from '@inbox-genie/core'

@Controller('revive')
export class ReviveController {
  constructor(private prisma: PrismaService, private compliance: ComplianceService) {}

  @Post('fetch')
  async fetch(@Body() body: any) {
    if (!process.env.FUB_API_KEY) throw new HttpException('FUB not configured', HttpStatus.NOT_IMPLEMENTED)
    const count = body.count ?? 5
    const leads = Array.from({ length: count }).map((_, i) => ({ phone: '+14165550' + (100 + i), stage: 'Nurture' }))
    for (const l of leads) {
      await this.prisma.reviveLead.create({ data: { tenantId: 'demo-tenant', phone: l.phone, stage: l.stage, timezone: 'America/Toronto' } })
    }
    return { ok: true, inserted: leads.length }
  }

  @Post('enqueue')
  async enqueue() {
    const leads = await this.prisma.reviveLead.findMany({ where: { tenantId: 'demo-tenant' }, take: 10 })
    let created = 0
    for (const rl of leads) {
      await this.prisma.outreachJob.create({ data: { tenantId: 'demo-tenant', reviveLeadId: rl.id, runAt: new Date(Date.now() + 1000) } })
      created++
    }
    return { created }
  }

  @Post('pause')
  async pause() { process.env.OUTREACH_PAUSED = 'true'; return { paused: true } }
  @Post('resume')
  async resume() { process.env.OUTREACH_PAUSED = 'false'; return { paused: false } }

  // Lightweight worker tick endpoint to process a single job (can be cron'd)
  @Post('tick')
  async tick() {
    const job = await this.prisma.outreachJob.findFirst({ where: { status: 'queued', runAt: { lte: new Date() } } })
    if (!job) return { processed: 0 }
    const rl = await this.prisma.reviveLead.findUnique({ where: { id: job.reviveLeadId } })
    if (!rl) return { processed: 0 }
    const check = await this.compliance.check({ tenant: { timezone: 'America/Toronto' }, lead: { phone: rl.phone, timezone: rl.timezone || undefined } })
    if (!check.allowed) {
      await this.prisma.outreachJob.update({ where: { id: job.id }, data: { status: 'skipped', lastError: check.reason || '' } })
      await this.prisma.outreachAttempt.create({ data: { jobId: job.id, outcome: 'skipped', meta: { reason: check.reason } as any } })
      return { processed: 1, skipped: true }
    }
    // Concurrency cap
    const running = await this.prisma.call.count({ where: { tenantId: 'demo-tenant', status: 'started', endedAt: null } })
    const cap = (await this.prisma.tenant.findUnique({ where: { id: 'demo-tenant' } }))?.concurrencyCap ?? 3
    if (running >= cap) {
      await this.prisma.outreachJob.update({ where: { id: job.id }, data: { status: 'queued', runAt: new Date(Date.now() + 60_000) } })
      return { processed: 0, deferred: true }
    }
    if (!process.env.RETELL_API_KEY) throw new HttpException('Retell not configured', HttpStatus.NOT_IMPLEMENTED)
    const provider = new RetellProvider({ apiKey: process.env.RETELL_API_KEY, webhookUrl: `${process.env.APP_BASE_URL}/webhooks/voice` })
    const { agentId } = await provider.configureAgent({ name: 'Revive Agent', industry: 'other' })
    await provider.startCall({ to: rl.phone, from: '+15005550006', agentId })
    await this.prisma.outreachAttempt.create({ data: { jobId: job.id, outcome: 'dialed' } })
    await this.prisma.outreachJob.update({ where: { id: job.id }, data: { status: 'running', attempts: { increment: 1 } } })
    return { processed: 1 }
  }
}
