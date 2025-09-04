const keys = [
  'RETELL_API_KEY',
  'TWILIO_ACCOUNT_SID',
  'TWILIO_AUTH_TOKEN',
  'STRIPE_SECRET_KEY',
  'STRIPE_WEBHOOK_SECRET'
]
const missing = keys.filter((k) => !process.env[k])
console.log('Dev keys check:')
if (missing.length) {
  console.log('Missing:', missing.join(', '))
} else {
  console.log('All set!')
}

