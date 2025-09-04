#!/usr/bin/env node
/*
  Tiny smoke test for local API.
  - Does not send real SMS/calls.
  - Skips booking/confirm unless DRY_RUN_TO is set.
*/

const API_BASE = (process.env.API_BASE || 'http://localhost:3001').replace(/\/$/, '')

const results = []
function record(name, status, info) {
  results.push({ name, status, info })
  const label = status === 'PASS' ? 'PASS' : status === 'WARN' ? 'WARN' : 'FAIL'
  console.log(`${name}: ${label}${info ? ` ${info}` : ''}`)
}

async function http(method, path, body) {
  const res = await fetch(`${API_BASE}${path}`, {
    method,
    headers: body ? { 'Content-Type': 'application/json' } : undefined,
    body: body ? JSON.stringify(body) : undefined,
  })
  const text = await res.text()
  let json
  try { json = JSON.parse(text) } catch { json = text }
  return { ok: res.ok, status: res.status, json, text }
}

function roundUpToNextHour(date) {
  const d = new Date(date)
  d.setMinutes(0, 0, 0)
  d.setHours(d.getHours() + 1)
  return d
}

;(async () => {
  try {
    // Liveness
    const live = await http('GET', '/health/liveness')
    if (live.ok) record('liveness', 'PASS', String(live.status))
    else record('liveness', 'FAIL', String(live.status))

    // Readiness
    const ready = await http('GET', '/health/readiness')
    if (ready.ok) record('readiness', 'PASS', JSON.stringify({
      db: ready.json?.db?.connected,
      redis: { mode: ready.json?.redis?.mode, connected: ready.json?.redis?.connected }
    }))
    else record('readiness', 'FAIL', String(ready.status))

    // Availability
    const avail = await http('GET', '/availability?durationMin=30&count=3')
    if (avail.ok && Array.isArray(avail.json?.slots) && avail.json.slots.length === 3) {
      record('availability', 'PASS', '3 slots')
    } else {
      record('availability', 'FAIL', JSON.stringify(avail.json))
      throw new Error('availability failed')
    }

    // Hold
    const nextHour = roundUpToNextHour(new Date())
    const slotIso = nextHour.toISOString()
    const hold = await http('POST', '/booking/hold', { tenantId: 'demo-tenant', slotIso })
    if (hold.ok && hold.json?.held) record('hold', 'PASS')
    else record('hold', 'FAIL', JSON.stringify(hold.json))

    // Confirm (only in dry-run mode)
    if (process.env.DRY_RUN_TO) {
      const confirm = await http('POST', '/booking/confirm', {
        tenantId: 'demo-tenant',
        slotIso,
        lead: { name: 'Smoke Test', phone: process.env.DRY_RUN_TO },
      })
      if (confirm.ok) record('confirm', 'PASS')
      else record('confirm', 'FAIL', String(confirm.status))
    } else {
      record('confirm', 'WARN', '(skipped; set DRY_RUN_TO to enable)')
    }

  } catch (err) {
    // Ensure we always print a summary
    console.error('Smoke error:', err?.message || err)
  } finally {
    // Summary
    const counts = results.reduce((acc, r) => { acc[r.status] = (acc[r.status]||0)+1; return acc }, {})
    console.log('---')
    console.log('Summary:', counts)
    const overall = results.some(r => r.status === 'FAIL') ? 'FAIL' : (results.some(r => r.status === 'WARN') ? 'WARN' : 'PASS')
    console.log('Overall:', overall)
    if (overall === 'FAIL') process.exitCode = 1
  }
})()

