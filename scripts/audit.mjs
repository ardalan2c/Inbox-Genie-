#!/usr/bin/env node

import { readFileSync, writeFileSync } from 'fs'
import { dirname, join } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))

// Configuration
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'
const TIMEOUT_MS = 10000

// Color utilities
const colors = {
  red: (text) => `\x1b[31m${text}\x1b[0m`,
  green: (text) => `\x1b[32m${text}\x1b[0m`,
  yellow: (text) => `\x1b[33m${text}\x1b[0m`,
  blue: (text) => `\x1b[34m${text}\x1b[0m`,
  bold: (text) => `\x1b[1m${text}\x1b[0m`,
  dim: (text) => `\x1b[2m${text}\x1b[0m`
}

// Audit results collection
const results = {
  health: {},
  keys: {},
  availability: {},
  booking: {},
  revive: {},
  idempotency: {},
  summary: {
    passed: 0,
    warned: 0,
    failed: 0,
    total: 0
  }
}

// HTTP client with timeout
async function httpRequest(url, options = {}) {
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), TIMEOUT_MS)
  
  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers
      }
    })
    clearTimeout(timeoutId)
    return response
  } catch (error) {
    clearTimeout(timeoutId)
    if (error.name === 'AbortError') {
      throw new Error(`Request timeout after ${TIMEOUT_MS}ms`)
    }
    throw error
  }
}

// Test result logging
function logTest(name, status, message = '', fix = '') {
  results.summary.total++
  const statusIcon = status === 'PASS' ? '✅' : status === 'WARN' ? '⚠️' : '❌'
  const statusColor = status === 'PASS' ? colors.green : status === 'WARN' ? colors.yellow : colors.red
  
  console.log(`${statusIcon} ${colors.bold(name)}: ${statusColor(status)}`)
  if (message) console.log(`   ${colors.dim(message)}`)
  if (fix) console.log(`   ${colors.blue('Fix:')} ${fix}`)
  
  if (status === 'PASS') results.summary.passed++
  else if (status === 'WARN') results.summary.warned++
  else results.summary.failed++
  
  console.log()
}

// Health checks
async function testHealth() {
  console.log(colors.bold('\n🏥 Health Checks'))
  console.log('='.repeat(50))
  
  try {
    // Liveness check
    try {
      const response = await httpRequest(`${API_BASE_URL}/health/liveness`)
      if (response.ok) {
        const data = await response.json()
        results.health.liveness = data
        logTest('Liveness Check', 'PASS', `Status: ${data.status}`)
      } else {
        results.health.liveness = { error: `HTTP ${response.status}` }
        logTest('Liveness Check', 'FAIL', `HTTP ${response.status}`, 'Check API server is running')
      }
    } catch (error) {
      results.health.liveness = { error: error.message }
      logTest('Liveness Check', 'FAIL', error.message, 'Start API server: pnpm --filter @inbox-genie/api start:dev')
    }

    // Readiness check
    try {
      const response = await httpRequest(`${API_BASE_URL}/health/readiness`)
      if (response.ok) {
        const data = await response.json()
        results.health.readiness = data
        logTest('Readiness Check', 'PASS', `Database: ${data.database}, Redis: ${data.redis}`)
      } else {
        results.health.readiness = { error: `HTTP ${response.status}` }
        logTest('Readiness Check', 'FAIL', `HTTP ${response.status}`, 'Check database and Redis connections')
      }
    } catch (error) {
      results.health.readiness = { error: error.message }
      logTest('Readiness Check', 'FAIL', error.message, 'Check DATABASE_URL and REDIS_URL')
    }

    // Keys check
    try {
      const response = await httpRequest(`${API_BASE_URL}/health/keys`)
      if (response.ok) {
        const data = await response.json()
        results.keys = data
        const missing = Object.entries(data).filter(([k, v]) => !v).map(([k]) => k)
        if (missing.length === 0) {
          logTest('Environment Keys', 'PASS', 'All provider keys configured')
        } else {
          logTest('Environment Keys', 'WARN', 
            `Missing: ${missing.join(', ')}`, 
            'Add missing environment variables to .env')
        }
      } else {
        results.keys = { error: `HTTP ${response.status}` }
        logTest('Environment Keys', 'FAIL', `HTTP ${response.status}`)
      }
    } catch (error) {
      results.keys = { error: error.message }
      logTest('Environment Keys', 'FAIL', error.message)
    }
  } catch (error) {
    logTest('Health Tests', 'FAIL', error.message)
  }
}

// Availability tests
async function testAvailability() {
  console.log(colors.bold('\n📅 Availability Tests'))
  console.log('='.repeat(50))
  
  try {
    const response = await httpRequest(`${API_BASE_URL}/availability?durationMin=30&count=3`)
    if (response.ok) {
      const data = await response.json()
      results.availability = data
      if (Array.isArray(data) && data.length === 3) {
        logTest('Availability Slots', 'PASS', `Generated ${data.length} slots for 30min duration`)
      } else {
        logTest('Availability Slots', 'WARN', 
          `Expected 3 slots, got ${Array.isArray(data) ? data.length : 'invalid response'}`,
          'Check availability service logic')
      }
    } else {
      results.availability = { error: `HTTP ${response.status}` }
      logTest('Availability Slots', 'FAIL', `HTTP ${response.status}`)
    }
  } catch (error) {
    results.availability = { error: error.message }
    logTest('Availability Slots', 'FAIL', error.message)
  }
}

// Booking tests
async function testBooking() {
  console.log(colors.bold('\n📞 Booking Tests'))
  console.log('='.repeat(50))
  
  try {
    // Create a slot 1 hour in the future
    const futureTime = new Date(Date.now() + 60 * 60 * 1000).toISOString()
    
    // Test hold creation
    try {
      const holdResponse = await httpRequest(`${API_BASE_URL}/booking/hold`, {
        method: 'POST',
        body: JSON.stringify({
          slotStart: futureTime,
          durationMin: 30
        })
      })
      
      if (holdResponse.ok) {
        const holdData = await holdResponse.json()
        results.booking.hold = holdData
        if (holdData.held === true) {
          logTest('Booking Hold', 'PASS', `Hold created with ID: ${holdData.id}`)
          
          // Test booking confirmation with dry run
          try {
            const confirmResponse = await httpRequest(`${API_BASE_URL}/booking/confirm`, {
              method: 'POST',
              body: JSON.stringify({
                id: holdData.id,
                name: 'Test User',
                phone: process.env.DRY_RUN_TO || '+15551234567'
              })
            })
            
            if (confirmResponse.ok) {
              const confirmData = await confirmResponse.json()
              results.booking.confirm = confirmData
              if (process.env.DRY_RUN_TO) {
                logTest('Booking Confirm', 'PASS', 'Dry run confirmation successful')
              } else if (confirmResponse.status === 501) {
                logTest('Booking Confirm', 'WARN', 'Expected 501 - Twilio not configured', 'Set TWILIO_* environment variables')
              } else {
                logTest('Booking Confirm', 'PASS', 'Confirmation processed')
              }
            } else if (confirmResponse.status === 501) {
              logTest('Booking Confirm', 'WARN', 'Twilio not configured (501)', 'Set TWILIO_* environment variables')
            } else {
              results.booking.confirm = { error: `HTTP ${confirmResponse.status}` }
              logTest('Booking Confirm', 'FAIL', `HTTP ${confirmResponse.status}`)
            }
          } catch (error) {
            results.booking.confirm = { error: error.message }
            logTest('Booking Confirm', 'FAIL', error.message)
          }
          
        } else {
          logTest('Booking Hold', 'FAIL', 'Hold not created - held property is false')
        }
      } else {
        results.booking.hold = { error: `HTTP ${holdResponse.status}` }
        logTest('Booking Hold', 'FAIL', `HTTP ${holdResponse.status}`)
      }
    } catch (error) {
      results.booking.hold = { error: error.message }
      logTest('Booking Hold', 'FAIL', error.message)
    }
  } catch (error) {
    logTest('Booking Tests', 'FAIL', error.message)
  }
}

// Revive tests
async function testRevive() {
  console.log(colors.bold('\n🔄 Revive Tests'))
  console.log('='.repeat(50))
  
  try {
    // Test fetch (dry run)
    try {
      const fetchResponse = await httpRequest(`${API_BASE_URL}/revive/fetch`, {
        method: 'POST',
        body: JSON.stringify({ dryRun: true })
      })
      
      if (fetchResponse.ok) {
        const fetchData = await fetchResponse.json()
        results.revive.fetch = fetchData
        logTest('Revive Fetch', 'PASS', `Queued count: ${fetchData.queued || 0}`)
      } else {
        results.revive.fetch = { error: `HTTP ${fetchResponse.status}` }
        logTest('Revive Fetch', 'FAIL', `HTTP ${fetchResponse.status}`)
      }
    } catch (error) {
      results.revive.fetch = { error: error.message }
      logTest('Revive Fetch', 'FAIL', error.message)
    }

    // Test enqueue
    try {
      const enqueueResponse = await httpRequest(`${API_BASE_URL}/revive/enqueue`, {
        method: 'POST'
      })
      
      if (enqueueResponse.ok) {
        const enqueueData = await enqueueResponse.json()
        results.revive.enqueue = enqueueData
        logTest('Revive Enqueue', 'PASS', 'Enqueue operation successful')
      } else {
        results.revive.enqueue = { error: `HTTP ${enqueueResponse.status}` }
        logTest('Revive Enqueue', 'FAIL', `HTTP ${enqueueResponse.status}`)
      }
    } catch (error) {
      results.revive.enqueue = { error: error.message }
      logTest('Revive Enqueue', 'FAIL', error.message)
    }

    // Test pause
    try {
      const pauseResponse = await httpRequest(`${API_BASE_URL}/revive/pause`, {
        method: 'POST'
      })
      
      if (pauseResponse.ok) {
        results.revive.pause = await pauseResponse.json()
        logTest('Revive Pause', 'PASS', 'Pause operation successful')
      } else {
        results.revive.pause = { error: `HTTP ${pauseResponse.status}` }
        logTest('Revive Pause', 'FAIL', `HTTP ${pauseResponse.status}`)
      }
    } catch (error) {
      results.revive.pause = { error: error.message }
      logTest('Revive Pause', 'FAIL', error.message)
    }

    // Test resume
    try {
      const resumeResponse = await httpRequest(`${API_BASE_URL}/revive/resume`, {
        method: 'POST'
      })
      
      if (resumeResponse.ok) {
        results.revive.resume = await resumeResponse.json()
        logTest('Revive Resume', 'PASS', 'Resume operation successful')
      } else {
        results.revive.resume = { error: `HTTP ${resumeResponse.status}` }
        logTest('Revive Resume', 'FAIL', `HTTP ${resumeResponse.status}`)
      }
    } catch (error) {
      results.revive.resume = { error: error.message }
      logTest('Revive Resume', 'FAIL', error.message)
    }
  } catch (error) {
    logTest('Revive Tests', 'FAIL', error.message)
  }
}

// Idempotency tests
async function testIdempotency() {
  console.log(colors.bold('\n🔁 Idempotency Tests'))
  console.log('='.repeat(50))
  
  try {
    // Load test fixtures
    const fixturePath = join(__dirname, 'fixtures')
    
    // Test Retell webhook idempotency
    try {
      const retellFixture = JSON.parse(readFileSync(join(fixturePath, 'retell.summary.ready.json'), 'utf8'))
      
      // Send same webhook twice
      const response1 = await httpRequest(`${API_BASE_URL}/webhooks/voice`, {
        method: 'POST',
        body: JSON.stringify(retellFixture)
      })
      
      const response2 = await httpRequest(`${API_BASE_URL}/webhooks/voice`, {
        method: 'POST',
        body: JSON.stringify(retellFixture)
      })
      
      if (response1.ok && response2.ok) {
        const data1 = await response1.json()
        const data2 = await response2.json()
        
        if (data2.duplicate === true) {
          logTest('Retell Idempotency', 'PASS', 'Duplicate event detected on replay')
        } else {
          logTest('Retell Idempotency', 'FAIL', 'Duplicate not detected - events processed twice')
        }
      } else {
        logTest('Retell Idempotency', 'FAIL', `HTTP errors: ${response1.status}, ${response2.status}`)
      }
    } catch (error) {
      logTest('Retell Idempotency', 'WARN', `Could not test: ${error.message}`, 'Check fixtures/retell.summary.ready.json exists')
    }

    // Test Twilio webhook idempotency (skip signature check in test mode)
    try {
      const twilioFixture = JSON.parse(readFileSync(join(fixturePath, 'twilio.sms.inbound.json'), 'utf8'))
      
      // Note: This would normally fail signature validation, but we'll test the structure
      logTest('Twilio Idempotency', 'WARN', 'Skipped - requires signature bypass for testing', 
        'Implement test mode signature bypass')
    } catch (error) {
      logTest('Twilio Idempotency', 'WARN', `Could not test: ${error.message}`, 'Check fixtures/twilio.sms.inbound.json exists')
    }

    // Test Stripe webhook idempotency
    try {
      const stripeSecret = process.env.STRIPE_WEBHOOK_SECRET
      if (stripeSecret) {
        const stripeFixture = JSON.parse(readFileSync(join(fixturePath, 'stripe.checkout.session.completed.json'), 'utf8'))
        logTest('Stripe Idempotency', 'WARN', 'Requires proper signature for testing', 
          'Implement signed webhook testing')
      } else {
        logTest('Stripe Idempotency', 'WARN', 'Skipped - STRIPE_WEBHOOK_SECRET not set')
      }
    } catch (error) {
      logTest('Stripe Idempotency', 'WARN', `Could not test: ${error.message}`, 'Check fixtures/stripe.checkout.session.completed.json exists')
    }
    
  } catch (error) {
    logTest('Idempotency Tests', 'FAIL', error.message)
  }
}

// Print summary
function printSummary() {
  console.log(colors.bold('\n📊 Audit Summary'))
  console.log('='.repeat(50))
  
  const { passed, warned, failed, total } = results.summary
  
  console.log(`${colors.green('✅ Passed:')} ${passed}/${total}`)
  console.log(`${colors.yellow('⚠️  Warned:')} ${warned}/${total}`)
  console.log(`${colors.red('❌ Failed:')} ${failed}/${total}`)
  
  const score = Math.round((passed / total) * 100)
  console.log(`${colors.bold('Overall Score:')} ${score}%`)
  
  if (failed === 0 && warned === 0) {
    console.log(`\n${colors.green('🎉 All systems operational!')}\n`)
  } else if (failed === 0) {
    console.log(`\n${colors.yellow('⚠️  System functional with warnings')}\n`)
  } else {
    console.log(`\n${colors.red('❌ System has failures - investigate before production deployment')}\n`)
  }
  
  console.log(colors.dim(`Results saved to: audit-results.json`))
  console.log(colors.dim(`API tested: ${API_BASE_URL}`))
}

// Main execution
async function main() {
  console.log(colors.bold('🔍 Inbox Genie Runtime Audit'))
  console.log('='.repeat(50))
  console.log(`${colors.dim('API Base URL:')} ${API_BASE_URL}`)
  console.log(`${colors.dim('Timeout:')} ${TIMEOUT_MS}ms`)
  
  await testHealth()
  await testAvailability()
  await testBooking()
  await testRevive()
  await testIdempotency()
  
  printSummary()
  
  // Save results to file
  writeFileSync('audit-results.json', JSON.stringify(results, null, 2))
}

// Run the audit
main().catch(error => {
  console.error(colors.red(`\n❌ Audit failed: ${error.message}`))
  process.exit(1)
})