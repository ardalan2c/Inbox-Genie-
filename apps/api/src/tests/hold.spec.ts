import { describe, it, expect } from 'vitest'
import { BookingController } from '../modules/booking/booking.controller'

const prisma: any = {}
const calendar: any = { freeBusy: async () => [] }
const fub: any = { upsertLead: async () => ({ data: { id: 0 } }) }
const outbox: any = { enqueue: async () => {} }
const usage: any = { incrementSms: async () => {} }
const holds: any = { hold: async () => ({ held: true }), release: async () => {} }

describe('booking hold', () => {
  const ctl = new BookingController(prisma, calendar, fub, outbox, usage, holds, 'null')
  it('creates a TTL hold', async () => {
    const res: any = await ctl.hold({ slotIso: new Date().toISOString(), tenantId: 'x' } as any)
    expect(res.held).toBe(true)
  })
})
