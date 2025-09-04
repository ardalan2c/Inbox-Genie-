#!/usr/bin/env node

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function seedDemoData() {
  console.log('🌱 Seeding demo data...')
  
  let created = {
    tenants: 0,
    businessProfiles: 0,
    leads: 0,
    calls: 0,
    bookings: 0,
    suppressions: 0,
    reviveLeads: 0,
    auditLogs: 0
  }

  try {
    // 1. Demo tenant
    const tenant = await prisma.tenant.upsert({
      where: { id: 'demo-tenant' },
      create: {
        id: 'demo-tenant',
        name: 'Acme Property Group',
        timezone: 'America/Toronto',
        concurrencyCap: 3
      },
      update: {
        name: 'Acme Property Group'
      }
    })
    created.tenants++

    // 2. Business Profile
    const businessProfile = {
      companyName: 'Acme Property Group',
      services: ['Property Viewing', 'Rental Inquiry', 'Maintenance Request'],
      hours: {
        monday: { open: '09:00', close: '18:00' },
        tuesday: { open: '09:00', close: '18:00' },
        wednesday: { open: '09:00', close: '18:00' },
        thursday: { open: '09:00', close: '18:00' },
        friday: { open: '09:00', close: '18:00' },
        saturday: { open: '10:00', close: '16:00' },
        sunday: { closed: true }
      },
      staff: [
        { name: 'Sarah Johnson', role: 'Leasing Agent', email: 'sarah@acme.com' },
        { name: 'Mike Chen', role: 'Property Manager', email: 'mike@acme.com' }
      ],
      address: '123 Main St, Toronto, ON M5V 3A8'
    }

    await prisma.businessProfile.upsert({
      where: { id: 'demo-profile' },
      create: {
        id: 'demo-profile',
        tenantId: tenant.id,
        json: businessProfile
      },
      update: {
        json: businessProfile
      }
    })
    created.businessProfiles++

    // 3. Demo leads across stages
    const leadData = [
      { name: 'Emma Wilson', phone: '+15551234567', stage: 'hot', days: 2 },
      { name: 'John Smith', phone: '+15551234568', stage: 'hot', days: 1 },
      { name: 'Lisa Brown', phone: '+15551234569', stage: 'hot', days: 3 },
      { name: 'David Kim', phone: '+15551234570', stage: 'warm', days: 7 },
      { name: 'Sarah Jones', phone: '+15551234571', stage: 'warm', days: 5 },
      { name: 'Mike Davis', phone: '+15551234572', stage: 'warm', days: 10 },
      { name: 'Anna Taylor', phone: '+15551234573', stage: 'warm', days: 8 },
      { name: 'Chris Wilson', phone: '+15551234574', stage: 'warm', days: 12 },
      { name: 'Jessica Lee', phone: '+15551234575', stage: 'cold', days: 20 },
      { name: 'Tom Anderson', phone: '+15551234576', stage: 'cold', days: 25 },
      { name: 'Katie White', phone: '+15551234577', stage: 'cold', days: 18 },
      { name: 'Ryan Garcia', phone: '+15551234578', stage: 'cold', days: 22 },
      { name: 'Amy Martinez', phone: '+15551234579', stage: 'cold', days: 28 },
      { name: 'Steve Clark', phone: '+15551234580', stage: 'nurture', days: 35 },
      { name: 'Nicole Rodriguez', phone: '+15551234581', stage: 'nurture', days: 40 },
      { name: 'Kevin Lewis', phone: '+15551234582', stage: 'nurture', days: 45 },
      { name: 'Helen Walker', phone: '+15551234583', stage: 'nurture', days: 32 },
      { name: 'Alex Hall', phone: '+15551234584', stage: 'nurture', days: 38 },
      { name: 'Grace Young', phone: '+15551234585', stage: 'nurture', days: 42 },
      { name: 'Ben King', phone: '+15551234586', stage: 'nurture', days: 36 },
      { name: 'Olivia Wright', phone: '+15551234587', stage: 'cold', days: 15 },
      { name: 'Nathan Scott', phone: '+15551234588', stage: 'warm', days: 6 },
      { name: 'Sophia Green', phone: '+15551234589', stage: 'hot', days: 1 },
      { name: 'Ethan Adams', phone: '+15551234590', stage: 'cold', days: 24 },
      { name: 'Zoe Baker', phone: '+15551234591', stage: 'warm', days: 9 }
    ]

    for (const lead of leadData) {
      const lastActivityAt = new Date(Date.now() - lead.days * 24 * 60 * 60 * 1000)
      
      await prisma.lead.upsert({
        where: { phone: lead.phone },
        create: {
          tenantId: tenant.id,
          name: lead.name,
          phone: lead.phone,
          tags: [lead.stage],
          timezone: 'America/Toronto',
          lastActivityAt
        },
        update: {
          name: lead.name,
          tags: [lead.stage],
          lastActivityAt
        }
      })
      created.leads++
    }

    // 4. Demo calls (mix of answered/missed)
    const callScenarios = [
      { from: '+15551234567', to: '+14165551234', status: 'ended', summary: 'Interested in 2-bedroom unit. Wants to schedule viewing for this weekend. Hot lead!' },
      { from: '+15551234568', to: '+14165551234', status: 'ended', summary: 'Asked about pet policy. Has a small dog. Needs pet-friendly unit.' },
      { from: '+15551234569', to: '+14165551234', status: 'missed' },
      { from: '+15551234570', to: '+14165551234', status: 'ended', summary: 'Price shopping. Wants to know about current specials and move-in incentives.' },
      { from: '+15551234571', to: '+14165551234', status: 'missed' },
      { from: '+15551234572', to: '+14165551234', status: 'ended', summary: 'Moving from Vancouver. Needs virtual tour options. Timeline is flexible.' },
      { from: '+15551234573', to: '+14165551234', status: 'missed' },
      { from: '+15551234574', to: '+14165551234', status: 'ended', summary: 'First-time renter. Needs guidance on application process and required documents.' },
      { from: '+15551234575', to: '+14165551234', status: 'missed' },
      { from: '+15551234576', to: '+14165551234', status: 'ended', summary: 'Corporate relocation. Company will cover deposits. Urgent move-in needed.' },
      { from: '+15551234577', to: '+14165551234', status: 'missed' },
      { from: '+15551234578', to: '+14165551234', status: 'ended', summary: 'Budget concerns. Looking for studio or 1-bedroom under $2000/month.' }
    ]

    for (const [index, call] of callScenarios.entries()) {
      const callId = `demo-call-${index + 1}`
      const startedAt = new Date(Date.now() - (index + 1) * 3600000) // Spread over last 12 hours
      const endedAt = call.status === 'ended' ? new Date(startedAt.getTime() + 180000) : null // 3 min calls
      
      await prisma.call.upsert({
        where: { id: callId },
        create: {
          id: callId,
          tenantId: tenant.id,
          from: call.from,
          to: call.to,
          status: call.status,
          startedAt,
          endedAt,
          summary: call.summary || null
        },
        update: {
          status: call.status,
          summary: call.summary || null
        }
      })

      // Add call turns for ended calls
      if (call.status === 'ended' && call.summary) {
        await prisma.callTurn.createMany({
          data: [
            { callId, role: 'user', text: 'Hi, I\'m calling about the apartment listing I saw online.' },
            { callId, role: 'ai', text: 'Hello! Thank you for calling Acme Property Group. I\'d be happy to help you with information about our available units.' },
            { callId, role: 'user', text: 'Great! I\'m looking for a 2-bedroom apartment. What do you have available?' }
          ],
          skipDuplicates: true
        })
      }

      created.calls++
    }

    // 5. Demo bookings
    const bookingScenarios = [
      { leadPhone: '+15551234567', status: 'confirmed', hoursFromNow: 48 },
      { leadPhone: '+15551234568', status: 'confirmed', hoursFromNow: 72 },
      { leadPhone: '+15551234570', status: 'pending', hoursFromNow: 24 },
      { leadPhone: '+15551234572', status: 'confirmed', hoursFromNow: 120 },
      { leadPhone: '+15551234574', status: 'confirmed', hoursFromNow: 96 },
      { leadPhone: '+15551234576', status: 'completed', hoursFromNow: -24 },
      { leadPhone: '+15551234578', status: 'completed', hoursFromNow: -48 },
      { leadPhone: '+15551234580', status: 'cancelled', hoursFromNow: -12 }
    ]

    for (const [index, booking] of bookingScenarios.entries()) {
      const lead = await prisma.lead.findFirst({ where: { phone: booking.leadPhone } })
      if (lead) {
        const startTime = new Date(Date.now() + booking.hoursFromNow * 3600000)
        const endTime = new Date(startTime.getTime() + 1800000) // 30 min appointments

        await prisma.booking.create({
          data: {
            tenantId: tenant.id,
            leadId: lead.id,
            start: startTime,
            end: endTime,
            status: booking.status
          }
        })
        created.bookings++
      }
    }

    // 6. DNC/Suppression samples
    const suppressionData = [
      { phone: '+15551111111', reason: 'STOP' },
      { phone: '+15551111112', reason: 'DNC_LIST' },
      { phone: '+15551111113', reason: 'STOP' }
    ]

    for (const suppression of suppressionData) {
      await prisma.suppression.upsert({
        where: { phone: suppression.phone },
        create: {
          tenantId: tenant.id,
          phone: suppression.phone,
          reason: suppression.reason
        },
        update: {
          reason: suppression.reason
        }
      })
      created.suppressions++
    }

    // 7. Revive leads (dormant prospects)
    const reviveLeadPhones = ['+15551234580', '+15551234581', '+15551234582', '+15551234583', '+15551234584']
    
    for (const phone of reviveLeadPhones) {
      const lead = await prisma.lead.findFirst({ where: { phone } })
      if (lead) {
        await prisma.reviveLead.create({
          data: {
            tenantId: tenant.id,
            leadId: lead.id,
            stage: 'queued',
            lastAttempt: new Date(Date.now() - Math.random() * 7 * 24 * 3600000) // Random in last week
          }
        })
        created.reviveLeads++
      }
    }

    // 8. Sample audit logs
    const auditEvents = [
      { type: 'lead.created', data: { leadId: 'demo-1', source: 'website_form' } },
      { type: 'call.missed', data: { from: '+15551234569', attempts: 1 } },
      { type: 'booking.confirmed', data: { bookingId: 'demo-1', leadPhone: '+15551234567' } },
      { type: 'usage.warning', data: { voiceUtilization: 85, smsUtilization: 45 } },
      { type: 'sms.sent', data: { to: '+15551234567', message: 'Booking confirmed' } }
    ]

    for (const event of auditEvents) {
      await prisma.auditLog.create({
        data: {
          type: event.type,
          data: event.data
        }
      })
      created.auditLogs++
    }

    // Summary
    console.log('✅ Demo data seeded successfully!')
    console.log(`📊 Created:`)
    console.log(`   • ${created.tenants} tenant`)
    console.log(`   • ${created.businessProfiles} business profile`)
    console.log(`   • ${created.leads} leads`)
    console.log(`   • ${created.calls} calls`)
    console.log(`   • ${created.bookings} bookings`)
    console.log(`   • ${created.suppressions} suppression entries`)
    console.log(`   • ${created.reviveLeads} revive leads`)
    console.log(`   • ${created.auditLogs} audit log entries`)
    console.log(`   📈 Total: ${Object.values(created).reduce((a, b) => a + b, 0)} records`)

    return created

  } catch (error) {
    console.error('❌ Error seeding demo data:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  seedDemoData()
    .then(() => process.exit(0))
    .catch(() => process.exit(1))
}

export { seedDemoData }