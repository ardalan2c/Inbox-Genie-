export class MockTwilio {
  private accountSid: string
  private authToken: string

  constructor(accountSid: string, authToken: string) {
    this.accountSid = accountSid
    this.authToken = authToken
  }

  messages = {
    create: async (opts: {
      to: string
      from?: string
      messagingServiceSid?: string
      body: string
    }) => {
      console.log('🎭 MOCK Twilio SMS:', {
        to: opts.to,
        from: opts.from || opts.messagingServiceSid,
        body: opts.body,
        length: opts.body.length
      })

      return {
        sid: `demo-sms-${Date.now()}`,
        to: opts.to,
        from: opts.from || '+14165551234',
        body: opts.body,
        status: 'queued',
        dateCreated: new Date().toISOString(),
        price: null,
        priceUnit: 'USD'
      }
    }
  }

  calls = {
    create: async (opts: {
      to: string
      from: string
      url: string
      method?: string
    }) => {
      console.log('🎭 MOCK Twilio Call:', {
        to: opts.to,
        from: opts.from,
        url: opts.url
      })

      return {
        sid: `demo-call-${Date.now()}`,
        to: opts.to,
        from: opts.from,
        status: 'queued',
        dateCreated: new Date().toISOString()
      }
    }
  }

  // Static method for creating mock instance
  static create(accountSid?: string, authToken?: string) {
    if (accountSid && authToken) {
      // Use real Twilio if credentials provided
      return import('twilio').then(({ default: Twilio }) => Twilio(accountSid, authToken))
    }
    
    // Return mock
    return Promise.resolve(new MockTwilio('demo-account', 'demo-token'))
  }
}

// Export as default to match Twilio's export pattern
export default function createMockTwilio(accountSid?: string, authToken?: string) {
  return new MockTwilio(accountSid || 'demo-account', authToken || 'demo-token')
}