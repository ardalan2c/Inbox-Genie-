import { Controller, Post, HttpException, HttpStatus, UseGuards } from '@nestjs/common'
import { ApiTags, ApiResponse } from '@nestjs/swagger'
import { PrismaService } from '../../services/prisma.service'
import { UsageService } from '../../services/usage.service'
import { MockRetellProvider } from '../../mocks/retell.mock'
import { MockFubService } from '../../mocks/fub.mock'
import createMockTwilio from '../../mocks/twilio.mock'

@ApiTags('demo')
@Controller('demo')
export class DemoController {
  constructor(
    private prisma: PrismaService,
    private usage: UsageService
  ) {}

  private isDemoMode(): boolean {
    return process.env.DEMO_MODE === 'true'
  }

  private ensureDemoMode() {
    if (!this.isDemoMode()) {
      throw new HttpException('Demo endpoints only available in DEMO_MODE', HttpStatus.NOT_FOUND)
    }
  }

  @Post('seed')
  @ApiResponse({ status: 200, description: 'Demo data seeded' })
  async seed() {
    this.ensureDemoMode()
    
    try {
      // @ts-ignore
      const { seedDemoData } = await import('../../../scripts/demo.seed.mjs')
      const results = await seedDemoData()
      
      return {
        success: true,
        message: 'Demo data seeded successfully',
        created: results
      }
    } catch (error: any) {
      throw new HttpException(`Failed to seed demo data: ${error?.message || String(error)}`, HttpStatus.INTERNAL_SERVER_ERROR)
    }
  }

  @Post('missed-call')
  @ApiResponse({ status: 200, description: 'Simulated missed call and SMS flow' })
  async missedCall() {
    this.ensureDemoMode()

    const tenantId = 'demo-tenant'
    const callerPhone = '+15551234999'
    const businessPhone = '+14165551234'
    
    try {
      // 1. Create missed call record
      const callId = `demo-missed-${Date.now()}`
      await this.prisma.call.create({
        data: {
          id: callId,
          tenantId,
          from: callerPhone,
          to: businessPhone,
          status: 'missed',
          startedAt: new Date()
        }
      })

      // 2. Find or create lead
      let lead = await this.prisma.lead.findFirst({ where: { phone: callerPhone } })
      if (!lead) {
        lead = await this.prisma.lead.create({
          data: {
            tenantId,
            name: 'Demo Caller',
            phone: callerPhone,
            tags: ['warm'],
            timezone: 'America/Toronto'
          }
        })
      }

      // 3. Generate SMS with 3 booking slots
      const now = new Date()
      const slots = [
        new Date(now.getTime() + 24 * 3600000), // Tomorrow
        new Date(now.getTime() + 48 * 3600000), // Day after
        new Date(now.getTime() + 72 * 3600000)  // 3 days out
      ]

      const smsBody = `Hi! You called Acme Property Group. Here are 3 available slots:\n1) ${slots[0].toLocaleDateString()} at ${slots[0].toLocaleTimeString('en', { hour: '2-digit', minute: '2-digit' })}\n2) ${slots[1].toLocaleDateString()} at ${slots[1].toLocaleTimeString('en', { hour: '2-digit', minute: '2-digit' })}\n3) ${slots[2].toLocaleDateString()} at ${slots[2].toLocaleTimeString('en', { hour: '2-digit', minute: '2-digit' })}\nReply with 1, 2, or 3 to book!`

      // 4. Send SMS (mock or real)
      let smsResult
      if (process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN) {
        const { default: Twilio } = await import('twilio')
        const twilio = Twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN)
        const to = process.env.DRY_RUN_TO || callerPhone
        
        smsResult = await twilio.messages.create({
          to,
          messagingServiceSid: process.env.TWILIO_MESSAGING_SERVICE_SID!,
          body: smsBody
        })
      } else {
        const mockTwilio = createMockTwilio()
        smsResult = await mockTwilio.messages.create({
          to: callerPhone,
          messagingServiceSid: 'demo-service',
          body: smsBody
        })
      }

      // 5. Track usage
      await this.usage.incrementSms(tenantId, 1)

      // 6. Create audit log
      await this.prisma.auditLog.create({
        data: {
          type: 'demo.missed_call_flow',
          data: {
            callId,
            leadId: lead.id,
            smsId: smsResult.sid,
            slotsOffered: slots.map(s => s.toISOString())
          } as any
        }
      })

      return {
        success: true,
        message: 'Missed call flow simulated',
        data: {
          callId,
          leadId: lead.id,
          smsId: smsResult.sid,
          smsBody: smsBody.substring(0, 100) + '...',
          slotsOffered: slots.length,
          provider: process.env.TWILIO_ACCOUNT_SID ? 'real_twilio' : 'mock_twilio'
        }
      }

    } catch (error: any) {
      throw new HttpException(`Failed to simulate missed call: ${error?.message || String(error)}`, HttpStatus.INTERNAL_SERVER_ERROR)
    }
  }

  @Post('revive')
  @ApiResponse({ status: 200, description: 'Simulated revive campaign' })
  async revive() {
    this.ensureDemoMode()

    const tenantId = 'demo-tenant'

    try {
      // 1. Get dormant leads (older than 30 days)
      const dormantLeads = await this.prisma.lead.findMany({
        where: {
          tenantId,
          tags: { has: 'nurture' },
          lastActivityAt: {
            lt: new Date(Date.now() - 30 * 24 * 3600000)
          }
        },
        take: 5
      })

      const results = []

      for (const lead of dormantLeads) {
        // 2. Ensure revive lead record exists (by tenantId + phone)
        const existing = await this.prisma.reviveLead.findFirst({ where: { tenantId, phone: lead.phone } })
        if (!existing) {
          await this.prisma.reviveLead.create({
            data: {
              tenantId,
              phone: lead.phone,
              stage: 'queued',
              timezone: lead.timezone || null
            }
          })
        } else {
          await this.prisma.reviveLead.update({ where: { id: existing.id }, data: { stage: 'queued' } })
        }

        // 3. Simulate call attempt
        const callId = `demo-revive-${lead.id}-${Date.now()}`
        let callResult: any

        if (process.env.RETELL_API_KEY) {
          // Use real Retell (but still log as demo)
          console.log('🎭 DEMO: Would create real Retell call for', lead.phone)
          callResult = { id: callId, status: 'demo_mode_skip', provider: 'real_retell' }
        } else {
          // Use mock
          const mockRetell = new MockRetellProvider({
            webhookUrl: `${process.env.APP_BASE_URL}/webhooks/voice`
          })
          callResult = await mockRetell.createCall({
            phoneNumber: lead.phone,
            prompt: `Call ${lead.name} about our property listings. They haven't responded in a while.`
          })
          callResult.provider = 'mock_retell'
        }

        // 4. Create call record
        await this.prisma.call.create({
          data: {
            id: callId,
            tenantId,
            from: '+14165551234',
            to: lead.phone,
            status: 'queued'
          }
        })

        results.push({
          leadId: lead.id,
          leadName: lead.name,
          leadPhone: lead.phone,
          callId,
          provider: callResult.provider
        })
      }

      // 5. Create audit log
      await this.prisma.auditLog.create({
        data: {
          type: 'demo.revive_campaign',
          data: {
            leadsTargeted: results.length,
            callIds: results.map(r => r.callId)
          } as any
        }
      })

      return {
        success: true,
        message: `Revive campaign started for ${results.length} dormant leads`,
        data: {
          leadsTargeted: results.length,
          results,
          provider: process.env.RETELL_API_KEY ? 'real_retell' : 'mock_retell'
        }
      }

    } catch (error: any) {
      throw new HttpException(`Failed to simulate revive: ${error?.message || String(error)}`, HttpStatus.INTERNAL_SERVER_ERROR)
    }
  }

  @Post('voice/summary')
  @ApiResponse({ status: 200, description: 'Simulated voice summary webhook' })
  async voiceSummary() {
    this.ensureDemoMode()

    const tenantId = 'demo-tenant'
    const callId = `demo-summary-${Date.now()}`

    try {
      // 1. Create call record
      const call = await this.prisma.call.create({
        data: {
          id: callId,
          tenantId,
          from: '+15559876543',
          to: '+14165551234',
          status: 'ended',
          startedAt: new Date(Date.now() - 300000), // 5 minutes ago
          endedAt: new Date()
        }
      })

      // 2. Generate mock summary
      const summaryData = {
        disposition: 'HOT',
        notes: 'Customer is very interested in our 2-bedroom units. Wants to schedule a viewing this weekend. Has pre-approval for $2500/month. Moving from Vancouver, needs possession by end of month.',
        follow_up_required: true,
        lead_quality: 'high',
        next_steps: 'Schedule property viewing within 48 hours',
        caller_intent: 'rental_inquiry',
        budget_mentioned: '$2500/month',
        timeline: 'end_of_month'
      }

      // 3. Update call with summary
      await this.prisma.call.update({
        where: { id: callId },
        data: { summary: summaryData }
      })

      // 4. Create call turns
      await this.prisma.callTurn.createMany({
        data: [
          { callId, role: 'user', text: 'Hi, I\'m calling about your 2-bedroom apartment listings.' },
          { callId, role: 'ai', text: 'Hello! Thank you for calling Acme Property Group. I\'d be happy to help you with our 2-bedroom units.' },
          { callId, role: 'user', text: 'Great! I need to move by the end of the month and my budget is around $2500. What do you have available?' },
          { callId, role: 'ai', text: 'Perfect! We have several 2-bedroom units in your price range. Would you like to schedule a viewing this weekend?' },
          { callId, role: 'user', text: 'Yes, that would be perfect. I\'m moving from Vancouver so I\'d love to see them soon.' }
        ]
      })

      // 5. Simulate FUB integration
      let fubResult
      if (process.env.FUB_API_KEY) {
        console.log('🎭 DEMO: Would sync to real FUB CRM')
        fubResult = { provider: 'real_fub', personId: 'demo_skip' }
      } else {
        const mockFub = MockFubService.create()
        const upsertResult = await mockFub.upsertLead({
          firstName: 'Demo Caller',
          phones: ['+15559876543']
        })
        
        await mockFub.createNote(upsertResult.data.id, `Voice summary: ${JSON.stringify(summaryData)}`)
        
        if (summaryData.disposition === 'HOT') {
          await mockFub.createTask(upsertResult.data.id, 'Follow up HOT lead today')
        }
        
        fubResult = { provider: 'mock_fub', personId: upsertResult.data.id }
      }

      // 6. Track usage
      const durationMinutes = 3
      await this.usage.incrementVoiceMinutes(tenantId, durationMinutes)

      // 7. Create audit log
      await this.prisma.auditLog.create({
        data: {
          type: 'demo.voice_summary',
          data: {
            callId,
            disposition: summaryData.disposition,
            fubPersonId: fubResult.personId,
            durationMinutes
          } as any
        }
      })

      return {
        success: true,
        message: 'Voice summary processed and synced to CRM',
        data: {
          callId,
          duration: `${durationMinutes} minutes`,
          disposition: summaryData.disposition,
          summary: summaryData.notes.substring(0, 100) + '...',
          fubSync: fubResult.provider,
          usageTracked: true,
          nextSteps: summaryData.next_steps
        }
      }

    } catch (error: any) {
      throw new HttpException(`Failed to process voice summary: ${error?.message || String(error)}`, HttpStatus.INTERNAL_SERVER_ERROR)
    }
  }
}
