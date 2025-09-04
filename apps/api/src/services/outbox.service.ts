import { Injectable } from '@nestjs/common'
import { PrismaService } from './prisma.service'
import { FubService } from './fub.service'

@Injectable()
export class OutboxService {
  constructor(private prisma: PrismaService, private fub: FubService) {}

  async enqueue(kind: string, payload: any) {
    await this.prisma.webhookOutbox.create({ data: { kind, payload } })
  }

  async flush(limit = 20) {
    const items = await this.prisma.webhookOutbox.findMany({ where: { deliveredAt: null, nextAttemptAt: { lte: new Date() } }, take: limit })
    for (const it of items) {
      try {
        if (it.kind === 'fub.note') {
          const { personId, text } = it.payload as any
          const r = await this.fub.addNote(personId, text)
          if (!r.ok && r.gated) throw new Error('FUB gated')
        } else if (it.kind === 'fub.task') {
          const { personId, subject } = it.payload as any
          const r = await this.fub.createTask(personId, subject)
          if (!r.ok && r.gated) throw new Error('FUB gated')
        }
        await this.prisma.webhookOutbox.update({ where: { id: it.id }, data: { deliveredAt: new Date() } })
      } catch (err) {
        const backoffSec = Math.min(60 * 10, Math.pow(2, it.tryCount) * 5)
        await this.prisma.webhookOutbox.update({ where: { id: it.id }, data: { tryCount: { increment: 1 }, nextAttemptAt: new Date(Date.now() + backoffSec * 1000) } })
      }
    }
    return { processed: items.length }
  }
}

