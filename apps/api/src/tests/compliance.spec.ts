import { describe, it, expect } from 'vitest'
import { ComplianceService } from '../services/compliance.service'

describe('ComplianceService', () => {
  const svc = new ComplianceService()
  it('blocks quiet hours', async () => {
    const res = await svc.check({ tenant: { timezone: 'America/Toronto' }, lead: { phone: '+1' }, now: new Date('2020-01-01T03:00:00Z') })
    expect(res.allowed).toBe(false)
  })
  it('allows daytime', async () => {
    const res = await svc.check({ tenant: { timezone: 'America/Toronto' }, lead: { phone: '+1' }, now: new Date('2020-01-01T16:00:00Z') })
    expect(res.allowed).toBe(true)
  })
})

