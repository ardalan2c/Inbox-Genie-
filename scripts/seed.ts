import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  const tenant = await prisma.tenant.upsert({
    where: { id: 'demo-tenant' },
    update: {},
    create: { id: 'demo-tenant', name: 'Demo Tenant', timezone: process.env.TZ || 'America/Toronto' }
  })

  await prisma.numberRecord.upsert({
    where: { id: 'demo-number' },
    update: {},
    create: { id: 'demo-number', tenantId: tenant.id, phone: '+15005550006', provider: 'twilio' }
  })

  const lead = await prisma.lead.create({ data: { tenantId: tenant.id, name: 'Alex Demo', phone: '+14165550123', tags: [] } })
  await prisma.booking.create({ data: { tenantId: tenant.id, leadId: lead.id, start: new Date(Date.now() + 3600_000), end: new Date(Date.now() + 5400_000), status: 'confirmed' } })

  await prisma.businessProfile.create({ data: { tenantId: tenant.id, json: { name: 'Demo Clinic', industry: 'clinic' } as any } })

  // Revive templates
  await prisma.reviveLead.createMany({ data: [
    { tenantId: tenant.id, phone: '+14165550111', stage: 'Nurture', timezone: tenant.timezone },
    { tenantId: tenant.id, phone: '+14165550112', stage: 'Watch', timezone: tenant.timezone }
  ] })

  console.log('Seed complete')
}

main().catch((e) => { console.error(e); process.exit(1) }).finally(() => prisma.$disconnect())

