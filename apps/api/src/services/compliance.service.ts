import { Injectable } from '@nestjs/common'

export type ComplianceInput = {
  tenant: { timezone: string }
  lead: { phone: string; tags?: string[]; timezone?: string; lastActivityAt?: Date | null }
  now?: Date
}

@Injectable()
export class ComplianceService {
  private inQuietHours(now: Date, tz?: string): boolean {
    try {
      const fmt = new Intl.DateTimeFormat('en-US', { hour: 'numeric', hour12: false, timeZone: tz || 'UTC' })
      const parts = fmt.formatToParts(now)
      const hour = Number(parts.find((p) => p.type === 'hour')?.value || '0')
      return hour < 9 || hour >= 20
    } catch {
      const h = now.getUTCHours()
      return h < 9 || h >= 20
    }
  }

  async check(input: ComplianceInput): Promise<{ allowed: boolean; reason?: string }> {
    const paused = process.env.OUTREACH_PAUSED === 'true'
    if (paused) return { allowed: false, reason: 'OUTREACH_PAUSED' }

    const now = input.now || new Date()
    const tz = input.lead.timezone || input.tenant.timezone
    if (this.inQuietHours(now, tz)) return { allowed: false, reason: 'QUIET_HOURS' }

    // Suppressions/DNC would be DB lookups; leave to controller for brevity
    return { allowed: true }
  }
}

