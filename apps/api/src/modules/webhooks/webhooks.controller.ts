import { Body, Controller, Headers, HttpCode, HttpException, HttpStatus, Post, Req } from '@nestjs/common'
import type { FastifyRequest } from 'fastify'
import { PrismaService } from '../../services/prisma.service'
import crypto from 'crypto'
import Stripe from 'stripe'
import { ApiBody, ApiTags } from '@nestjs/swagger'
import { FubService } from '../../services/fub.service'
import { OutboxService } from '../../services/outbox.service'
import { UsageService } from '../../services/usage.service'

@ApiTags('webhooks')
@Controller('webhooks')
export class WebhooksController {
  constructor(private prisma: PrismaService, private fub: FubService, private usage: UsageService, private outbox: OutboxService) {}

  @Post('voice')
  @HttpCode(200)
  @ApiBody({ description: 'Retell webhook events', schema: { properties: { type: { type: 'string' }, call_id: { type: 'string' } } } })
  async voice(@Body() body: any) {
    const event = body?.type || body?.event || 'unknown'
    const callId = body?.call_id || body?.id || body?.callId || 'unknown'
    const eventId: string = body?.event_id || `${callId}:${event}:${body?.turn_id || body?.timestamp || Date.now()}`
    const dup = await this.prisma.processedEvent.findUnique({ where: { id: eventId } })
    if (dup) return { ok: true, duplicate: true }
    await this.prisma.processedEvent.create({ data: { id: eventId, kind: 'retell' } })
    if (event === 'call.started') {
      await this.prisma.call.upsert({
        where: { id: callId },
        create: { id: callId, tenantId: 'demo-tenant', from: body?.from || '', to: body?.to || '', status: 'started' },
        update: { status: 'started' }
      })
    }
    if (event === 'user.turn' || event === 'ai.turn') {
      await this.prisma.callTurn.create({ data: { callId, role: event.startsWith('user') ? 'user' : 'ai', text: body?.text || '' } })
    }
    if (event === 'summary.ready') {
      await this.prisma.call.update({ where: { id: callId }, data: { summary: body?.summary || body } })
      // write-back to CRM if configured
      if (process.env.FUB_API_KEY) {
        const phone = body?.caller?.phone || ''
        const summaryText = JSON.stringify(body?.summary || body)
        const u = await this.fub.upsertLead({ firstName: 'Caller', phones: [phone] })
        const personId = (u.data?.id as number) || 0
        if (personId) {
          await this.outbox.enqueue('fub.note', { personId, text: `Voice summary: ${summaryText}` })
          if ((body?.summary?.disposition || '').toUpperCase() === 'HOT') {
            await this.outbox.enqueue('fub.task', { personId, subject: 'Follow up HOT lead today' })
          }
        }
      }
    }
    if (event === 'call.ended') {
      const ended = new Date()
      const call = await this.prisma.call.update({ where: { id: callId }, data: { status: 'ended', endedAt: ended } })
      const mins = call.startedAt ? Math.ceil(((ended.getTime() - new Date(call.startedAt).getTime()) / 60000)) : 0
      if (mins > 0) await this.usage.incrementVoiceMinutes(call.tenantId, mins)
    }
    return { ok: true }
  }

  @Post('sms')
  @HttpCode(200)
  async sms(@Req() req: FastifyRequest, @Body() body: any, @Headers('x-twilio-signature') sig?: string) {
    const token = process.env.TWILIO_AUTH_TOKEN
    if (!token) throw new HttpException('Twilio not configured', HttpStatus.NOT_IMPLEMENTED)
    const url = `${process.env.APP_BASE_URL}/webhooks/sms`
    const valid = this.verifyTwilioSignature(url, body, token, sig || '')
    if (!valid) throw new HttpException('Invalid signature', HttpStatus.UNAUTHORIZED)

    const from = body.From
    const to = body.To
    const text = (body.Body || '').trim()
    const eventId = body.MessageSid || `${from}:${to}:${text}`
    const dup = await this.prisma.processedEvent.findUnique({ where: { id: eventId } })
    if (dup) return { ok: true, duplicate: true }
    await this.prisma.processedEvent.create({ data: { id: eventId, kind: 'twilio' } })
    await this.prisma.message.create({ data: { tenantId: 'demo-tenant', to, from, body: text, direction: 'inbound' } })

    if (/^stop$/i.test(text)) {
      await this.prisma.suppression.create({ data: { tenantId: 'demo-tenant', phone: from, reason: 'STOP' } })
      try {
        const { default: Twilio } = await import('twilio')
        const tw = Twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN)
        await tw.messages.create({ to: from, messagingServiceSid: process.env.TWILIO_MESSAGING_SERVICE_SID!, body: 'You have been opted out. Reply START to opt in.' })
      } catch {}
      return { ok: true, action: 'suppressed' }
    }
    if (["1","2","3"].includes(text)) {
      return { ok: true, action: 'booking-response', choice: Number(text) }
    }
    return { ok: true }
  }

  @Post('billing')
  @HttpCode(200)
  async billing(@Req() req: any, @Headers('stripe-signature') signature?: string) {
    const secret = process.env.STRIPE_WEBHOOK_SECRET
    const key = process.env.STRIPE_SECRET_KEY
    if (!secret || !key) throw new HttpException('Stripe not configured', HttpStatus.NOT_IMPLEMENTED)
    const stripe = new Stripe(key, { apiVersion: '2024-06-20' })
    const buf: Buffer = req.rawBody || Buffer.from(await req.rawBody, 'utf8')
    let event: Stripe.Event
    try {
      event = stripe.webhooks.constructEvent(buf, signature as string, secret)
    } catch (err: any) {
      throw new HttpException(`Stripe signature error: ${err.message}`, HttpStatus.BAD_REQUEST)
    }
    const dup = await this.prisma.processedEvent.findUnique({ where: { id: event.id } })
    if (dup) return { received: true, duplicate: true }
    await this.prisma.processedEvent.create({ data: { id: event.id, kind: 'stripe' } })
    switch (event.type) {
      case 'checkout.session.completed':
        try {
          const s = event.data.object as any
          const tenantId = 'demo-tenant'
          await this.prisma.tenant.update({ where: { id: tenantId }, data: { stripeCustomerId: s.customer as string, stripeSubscriptionId: s.subscription as string } })
          await this.prisma.auditLog.create({ data: { type: 'stripe.checkout.completed', data: event as any } })
        } catch {}
        break
      case 'invoice.paid':
      case 'invoice.payment_failed':
        await this.prisma.auditLog.create({ data: { type: 'stripe.' + event.type, data: event as any } })
        try {
          const inv = event.data.object as any
          await this.prisma.invoice.upsert({
            where: { id: inv.id },
            create: { id: inv.id, tenantId: 'demo-tenant', status: inv.status, totalCents: inv.amount_due },
            update: { status: inv.status, totalCents: inv.amount_due }
          })
        } catch {}
        break
    }
    return { received: true }
  }

  private verifyTwilioSignature(url: string, params: Record<string, any>, token: string, signature: string) {
    const sorted = Object.keys(params)
      .sort()
      .map((k) => k + params[k])
      .join('')
    const str = url + sorted
    const digest = crypto.createHmac('sha1', token).update(Buffer.from(str, 'utf-8')).digest('base64')
    return crypto.timingSafeEqual(Buffer.from(digest), Buffer.from(signature || '', 'utf-8'))
  }
}
