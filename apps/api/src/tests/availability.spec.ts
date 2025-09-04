import { describe, it, expect } from 'vitest'
import { BookingController } from '../modules/booking/booking.controller'

// Minimal fakes matching controller deps
const prisma: any = {}
const calendar: any = { freeBusy: async () => [] }
const fub: any = { upsertLead: async () => ({ data: { id: 0 } }) }
const outbox: any = { enqueue: async () => {} }
const usage: any = { incrementSms: async () => {} }
const holds: any = { hold: async () => ({ held: true }), release: async () => {} }

describe('availability', () => {
  const ctl = new BookingController(prisma, calendar, fub, outbox, usage, holds, 'null')
  it('returns 3 fallback slots', async () => {
    const res: any = await ctl.availability({ durationMin: 30, count: 3 } as any)
    expect(res.slots).toHaveLength(3)
  })
})
