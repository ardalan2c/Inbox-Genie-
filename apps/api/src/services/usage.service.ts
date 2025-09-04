import { Injectable, HttpException, HttpStatus } from '@nestjs/common'
import { PrismaService } from './prisma.service'
import { PLANS, OVERAGE, PlanKey } from '@inbox-genie/core'

export interface UsageDelta {
  minutesDelta?: number
  smsDelta?: number
}

export interface CapEnforcementResult {
  allowed: boolean
  warning?: string
  overageEstimate?: number
  remainingMinutes?: number
  remainingSms?: number
}

@Injectable()
export class UsageService {
  constructor(private prisma: PrismaService) {}

  private getEnforcementSettings() {
    return {
      enforceCaps: process.env.ENFORCE_CAPS === 'true',
      overageMode: (process.env.OVERAGE_MODE || 'soft') as 'soft' | 'hard',
      warnThreshold: parseFloat(process.env.USAGE_WARN_THRESHOLD || '0.9')
    }
  }

  async getTenantPlan(tenantId: string): Promise<PlanKey> {
    // For now, default to 'starter'. In a real implementation,
    // this would look up the tenant's subscription plan from the database
    return 'starter'
  }

  async enforceCaps(tenantId: string, delta: UsageDelta): Promise<CapEnforcementResult> {
    const settings = this.getEnforcementSettings()
    
    if (!settings.enforceCaps) {
      return { allowed: true }
    }

    const currentUsage = await this.getMonthlyUsage(tenantId)
    const planKey = await this.getTenantPlan(tenantId)
    const plan = PLANS.find(p => p.key === planKey)

    if (!plan) {
      throw new HttpException(`Invalid plan: ${planKey}`, HttpStatus.INTERNAL_SERVER_ERROR)
    }

    const newVoiceTotal = currentUsage.voice + (delta.minutesDelta || 0)
    const newSmsTotal = currentUsage.sms + (delta.smsDelta || 0)

    const voiceUtilization = newVoiceTotal / plan.minutes
    const smsUtilization = newSmsTotal / plan.sms

    const result: CapEnforcementResult = {
      allowed: true,
      remainingMinutes: Math.max(0, plan.minutes - newVoiceTotal),
      remainingSms: Math.max(0, plan.sms - newSmsTotal)
    }

    // Warning threshold check
    if (voiceUtilization >= settings.warnThreshold || smsUtilization >= settings.warnThreshold) {
      const voicePercent = Math.round(voiceUtilization * 100)
      const smsPercent = Math.round(smsUtilization * 100)
      result.warning = `Usage approaching limits: Voice ${voicePercent}%, SMS ${smsPercent}%`
      
      // Store warning in audit log
      await this.prisma.auditLog.create({
        data: {
          type: 'usage.warning',
          data: {
            tenantId,
            voiceUtilization: voicePercent,
            smsUtilization: smsPercent,
            plan: planKey
          } as any
        }
      })
    }

    // Hard limit enforcement
    if (newVoiceTotal > plan.minutes || newSmsTotal > plan.sms) {
      const voiceOverage = Math.max(0, newVoiceTotal - plan.minutes)
      const smsOverage = Math.max(0, newSmsTotal - plan.sms)
      
      result.overageEstimate = Math.round((voiceOverage * OVERAGE.perMinute * 100) + (smsOverage * 0.02 * 100))

      if (settings.overageMode === 'hard') {
        result.allowed = false
        
        // Log the blocked attempt
        await this.prisma.auditLog.create({
          data: {
            type: 'usage.blocked',
            data: {
              tenantId,
              delta,
              currentUsage,
              plan: planKey,
              overageEstimate: result.overageEstimate
            } as any
          }
        })

        throw new HttpException(
          {
            message: 'Plan limits exceeded',
            details: `Your ${plan.name} plan limits have been reached. Voice: ${newVoiceTotal}/${plan.minutes} minutes, SMS: ${newSmsTotal}/${plan.sms} messages. Upgrade your plan or enable overage billing to continue.`,
            code: 'USAGE_LIMIT_EXCEEDED',
            overageEstimate: result.overageEstimate
          },
          HttpStatus.PAYMENT_REQUIRED
        )
      } else {
        // Soft mode: allow but log overage
        await this.prisma.auditLog.create({
          data: {
            type: 'usage.overage',
            data: {
              tenantId,
              delta,
              currentUsage,
              plan: planKey,
              overageEstimate: result.overageEstimate
            } as any
          }
        })
      }
    }

    return result
  }

  async incrementVoiceMinutes(tenantId: string, minutes: number) {
    // Enforce caps before incrementing
    await this.enforceCaps(tenantId, { minutesDelta: minutes })
    
    await this.prisma.usage.create({ 
      data: { 
        tenantId, 
        kind: 'voice_minutes', 
        amount: minutes, 
        periodStart: new Date(), 
        periodEnd: new Date() 
      } 
    })
  }

  async incrementSms(tenantId: string, count = 1) {
    // Enforce caps before incrementing
    await this.enforceCaps(tenantId, { smsDelta: count })
    
    await this.prisma.usage.create({ 
      data: { 
        tenantId, 
        kind: 'sms', 
        amount: count, 
        periodStart: new Date(), 
        periodEnd: new Date() 
      } 
    })
  }

  async getMonthlyUsage(tenantId: string) {
    const start = new Date()
    start.setDate(1); start.setHours(0,0,0,0)
    const end = new Date(start); end.setMonth(end.getMonth()+1)
    const usages = await this.prisma.usage.findMany({ where: { tenantId, periodStart: { gte: start }, periodEnd: { lte: end } } })
    const voice = usages.filter(u => u.kind==='voice_minutes').reduce((s,u)=>s+u.amount,0)
    const sms = usages.filter(u => u.kind==='sms').reduce((s,u)=>s+u.amount,0)
    return { voice, sms }
  }

  getPlanCaps(planKey: 'starter'|'pro'|'team10') {
    const plan = PLANS.find(p=>p.key===planKey) || PLANS[0]
    return { minutes: plan.minutes, sms: plan.sms }
  }

  async checkOverage(tenantId: string, planKey: 'starter'|'pro'|'team10') {
    const usage = await this.getMonthlyUsage(tenantId)
    const caps = this.getPlanCaps(planKey)
    const overMinutes = Math.max(0, usage.voice - caps.minutes)
    const overSms = Math.max(0, usage.sms - caps.sms)
    const overage = { minutes: overMinutes, sms: overSms, estimateCents: Math.round(overMinutes * 12 + overSms * 2) }
    if (overage.minutes>0 || overSms>0) {
      await this.prisma.auditLog.create({
        data: {
          type: 'usage.overage.calculated',
          data: { tenantId, overage, usage, caps, planKey } as any
        }
      })
    }
    return { usage, caps, overage }
  }

  async concurrencyAllowed(tenantId: string) {
    const tenant = await this.prisma.tenant.findUnique({ where: { id: tenantId } })
    const cap = tenant?.concurrencyCap ?? 3
    const running = await this.prisma.call.count({ where: { tenantId, status: 'started', endedAt: null } })
    return running < cap
  }

  async getUsageSummary(tenantId: string) {
    const currentUsage = await this.getMonthlyUsage(tenantId)
    const planKey = await this.getTenantPlan(tenantId)
    const plan = PLANS.find(p => p.key === planKey)

    if (!plan) {
      return { error: 'Invalid plan configuration' }
    }

    const voiceUtilization = currentUsage.voice / plan.minutes
    const smsUtilization = currentUsage.sms / plan.sms

    return {
      plan: plan.name,
      planKey,
      current: currentUsage,
      limits: {
        voiceMinutes: plan.minutes,
        smsCount: plan.sms
      },
      utilization: {
        voice: Math.round(voiceUtilization * 100),
        sms: Math.round(smsUtilization * 100)
      },
      remaining: {
        voiceMinutes: Math.max(0, plan.minutes - currentUsage.voice),
        smsCount: Math.max(0, plan.sms - currentUsage.sms)
      }
    }
  }
}

