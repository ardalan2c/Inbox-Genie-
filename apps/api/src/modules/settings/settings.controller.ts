import { Body, Controller, Get, HttpException, HttpStatus, Post } from '@nestjs/common'
import { PrismaService } from '../../services/prisma.service'
import { CalendarService } from '../../services/calendar.service'
import { UsageService } from '../../services/usage.service'

@Controller('settings')
export class SettingsController {
  constructor(private prisma: PrismaService, private calendar: CalendarService, private usage: UsageService) {}

  @Get('business-profile')
  async getBusinessProfile() {
    const bp = await this.prisma.businessProfile.findFirst({ where: { tenantId: 'demo-tenant' } })
    return { profile: bp?.json || { name: 'Demo Business', industry: 'clinic' } }
  }

  @Post('business-profile')
  async setBusinessProfile(@Body() body: any) {
    const json = body?.profile
    if (!json) throw new HttpException('Missing profile', HttpStatus.BAD_REQUEST)
    const bp = await this.prisma.businessProfile.upsert({ where: { id: 'demo-bp' }, create: { id: 'demo-bp', tenantId: 'demo-tenant', json }, update: { json } })
    return { ok: true, profile: bp.json }
  }

  @Get('integrations/state')
  async integrationsState() {
    const google = await this.calendar.hasConnection('demo-tenant')
    return {
      google,
      fub: !!process.env.FUB_API_KEY,
      twilio: !!process.env.TWILIO_AUTH_TOKEN && !!process.env.TWILIO_MESSAGING_SERVICE_SID,
      stripe: !!process.env.STRIPE_SECRET_KEY
    }
  }

  @Post('compliance/dnc/upload')
  async dncUpload(@Body() body: any) {
    const csv: string = body?.csv || ''
    const raw = csv.split(/[\,\n\r\s]+/).map((n) => n.trim()).filter(Boolean)
    const norm = Array.from(new Set(raw.map(normalizePhone).filter(Boolean) as string[]))
    for (const phone of norm) {
      await this.prisma.dnc.create({ data: { tenantId: 'demo-tenant', phone } })
    }
    return { inserted: norm.length }
  }

  @Get('billing/summary')
  async billingSummary() {
    const t = await this.prisma.tenant.findUnique({ where: { id: 'demo-tenant' } })
    const invoices = await this.prisma.invoice.findMany({ where: { tenantId: 'demo-tenant' }, orderBy: { createdAt: 'desc' } })
    return { customerId: t?.stripeCustomerId, subscriptionId: t?.stripeSubscriptionId, invoices }
  }

  @Get('usage/summary')
  async usageSummary() {
    // Assume starter plan unless subscription stored
    const plan: any = 'starter'
    const { usage, caps, overage } = await this.usage.checkOverage('demo-tenant', plan)
    return { usage, caps, overage }
  }

  @Get('audit/logs')
  async auditLogs() {
    const logs = await this.prisma.auditLog.findMany({ orderBy: { createdAt: 'desc' }, take: 50 })
    return { logs }
  }
}

function normalizePhone(n: string): string | null {
  const digits = n.replace(/\D/g, '')
  if (digits.length === 10) return '+1' + digits
  if (digits.length === 11 && digits.startsWith('1')) return '+' + digits
  if (n.startsWith('+') && digits.length >= 8) return '+' + digits
  return null
}
