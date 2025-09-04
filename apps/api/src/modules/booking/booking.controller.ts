import { Body, Controller, Get, HttpException, HttpStatus, Post, Query } from '@nestjs/common'
import { PrismaService } from '../../services/prisma.service'
import { CalendarService } from '../../services/calendar.service'
import { FubService } from '../../services/fub.service'
import { OutboxService } from '../../services/outbox.service'
import { UsageService } from '../../services/usage.service'
import { ApiBody, ApiQuery, ApiResponse, ApiTags } from '@nestjs/swagger'
import { AvailabilityQueryDto } from '../../dto/availability.dto'
import { BookingHoldDto, BookingConfirmDto } from '../../dto/booking.dto'
import { Inject } from '@nestjs/common'

@ApiTags('booking')
@Controller()
export class BookingController {
  constructor(
    private prisma: PrismaService,
    private calendar: CalendarService,
    private fub: FubService,
    private outbox: OutboxService,
    private usage: UsageService,
    @Inject('HOLD_SERVICE') private readonly holds: any,
    @Inject('REDIS_MODE') private readonly redisMode: 'real' | 'null'
  ) {}

  @Get('availability')
  @ApiResponse({ status: 200, description: 'Available slots' })
  async availability(@Query() query: AvailabilityQueryDto) {
    try {
      const { durationMin, count = 3 } = query
      const now = new Date()
      const googleSlots = await this.calendar.freeBusy('demo-tenant', durationMin, count)
      const slots = (googleSlots && googleSlots.length) ? googleSlots : Array.from({ length: count }).map((_, i) => {
        const start = new Date(now.getTime() + (i + 1) * 60 * 60 * 1000)
        const end = new Date(start.getTime() + durationMin * 60 * 1000)
        return { start: start.toISOString(), end: end.toISOString() }
      })
      return { slots }
    } catch (e) {
      const durationMin = Number((query as any)?.durationMin ?? 30)
      const count = Number((query as any)?.count ?? 3)
      const now = new Date()
      const fallback = Array.from({ length: count }).map((_, i) => {
        const start = new Date(now.getTime() + (i + 1) * 60 * 60 * 1000)
        const end = new Date(start.getTime() + durationMin * 60 * 1000)
        return { start: start.toISOString(), end: end.toISOString() }
      })
      return { slots: fallback }
    }
  }

  @Post('booking/hold')
  async hold(@Body() holdDto: BookingHoldDto) {
    const requireRedis = (process.env.REQUIRE_REDIS || 'false').toLowerCase() === 'true'
    if (requireRedis && this.redisMode === 'null') {
      throw new HttpException({ reason: 'redis_unavailable' }, 501)
    }
    const key = `hold:${holdDto.tenantId}:${holdDto.slotIso}`
    const res = await this.holds.hold(key, 180)
    return { held: !!res.held }
  }

  @Post('booking/confirm')
  async confirm(@Body() confirmDto: BookingConfirmDto) {
    const requireRedis = (process.env.REQUIRE_REDIS || 'false').toLowerCase() === 'true'
    if (requireRedis && this.redisMode === 'null') {
      throw new HttpException({ reason: 'redis_unavailable' }, 501)
    }
    const { tenantId, slotIso, lead, staff } = confirmDto
    
    // Create lead record if doesn't exist
    let leadRecord = await this.prisma.lead.findFirst({ where: { phone: lead.phone } })
    if (!leadRecord) {
      leadRecord = await this.prisma.lead.create({
        data: {
          tenantId,
          name: lead.name,
          phone: lead.phone
        }
      })
    }

    // Create booking
    const startTime = new Date(slotIso)
    const endTime = new Date(startTime.getTime() + 30 * 60 * 1000) // Default 30min
    const booking = await this.prisma.booking.create({ 
      data: { 
        tenantId, 
        leadId: leadRecord.id, 
        start: startTime, 
        end: endTime, 
        status: 'confirmed' 
      } 
    })
    
    // FUB note
    if (process.env.FUB_API_KEY) {
      try {
        const u = await this.fub.upsertLead({ firstName: lead.name, phones: [lead.phone] })
        const personId = (u.data?.id as number) || 0
        if (personId) await this.outbox.enqueue('fub.note', { personId, text: `Booking confirmed for ${startTime.toISOString()}` })
      } catch {}
    }
    
    // Outbound SMS via Twilio Messaging Service if available
    if (!process.env.TWILIO_AUTH_TOKEN || !process.env.TWILIO_ACCOUNT_SID || !process.env.TWILIO_MESSAGING_SERVICE_SID) {
      throw new HttpException('Twilio not configured', HttpStatus.NOT_IMPLEMENTED)
    }
    
    const to = process.env.DRY_RUN_TO || lead.phone
    if (!to) return { booking }
    
    // Enforce SMS caps before sending
    await this.usage.incrementSms(tenantId, 1)
    
    const { default: Twilio } = await import('twilio')
    const tw = Twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN)
    const msg = `Confirmed: ${startTime.toLocaleString()} — Reply 2 to reschedule.`
    await tw.messages.create({ to, messagingServiceSid: process.env.TWILIO_MESSAGING_SERVICE_SID!, body: msg })
    
    // Release hold if present
    try { await this.holds.release(`hold:${tenantId}:${slotIso}`) } catch {}
    return { booking, sms: 'sent' }
  }

  @Post('booking/test-sms')
  @ApiBody({ schema: { properties: { to: { type: 'string' }, durationMin: { type: 'number', example: 30 }, count: { type: 'number', example: 3 } } } })
  async testSms(@Body() body: any) {
    if (!process.env.TWILIO_AUTH_TOKEN || !process.env.TWILIO_ACCOUNT_SID || !process.env.TWILIO_MESSAGING_SERVICE_SID) {
      throw new HttpException('Twilio not configured', HttpStatus.NOT_IMPLEMENTED)
    }
    const to = process.env.DRY_RUN_TO || body.to
    if (!to) throw new HttpException('Missing to', HttpStatus.BAD_REQUEST)
    const slots = (await this.availability({
      durationMin: Number(body?.durationMin ?? 30),
      count: Number(body?.count ?? 3)
    } as any)).slots
    const text = `3 slots: 1) ${new Date(slots[0].start).toLocaleTimeString()} 2) ${new Date(slots[1].start).toLocaleTimeString()} 3) ${new Date(slots[2].start).toLocaleTimeString()} — Reply 1/2/3`
    const { default: Twilio } = await import('twilio')
    const tw = Twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN)
    await tw.messages.create({ to, messagingServiceSid: process.env.TWILIO_MESSAGING_SERVICE_SID!, body: text })
    return { ok: true }
  }
}
