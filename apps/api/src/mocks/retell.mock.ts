export class MockRetellProvider {
  private apiKey?: string
  private webhookUrl: string

  constructor(opts: { apiKey?: string; baseUrl?: string; webhookUrl: string }) {
    this.apiKey = opts.apiKey
    this.webhookUrl = opts.webhookUrl
  }

  async createCall(opts: { phoneNumber: string; prompt?: string }) {
    const callId = `demo-call-${Date.now()}`
    
    console.log('🎭 MOCK Retell: Creating call', {
      to: opts.phoneNumber,
      callId,
      webhookUrl: this.webhookUrl
    })

    // Simulate call creation
    return {
      id: callId,
      status: 'created',
      to: opts.phoneNumber,
      from: '+14165551234',
      created_at: new Date().toISOString()
    }
  }

  async getCall(callId: string) {
    console.log('🎭 MOCK Retell: Getting call', callId)
    
    return {
      id: callId,
      status: 'completed',
      duration: 180, // 3 minutes
      transcript: 'Mock call transcript - customer interested in property viewing'
    }
  }

  // Method to simulate webhook events
  static async simulateWebhookEvent(webhookUrl: string, eventType: string, callId: string, data: any = {}) {
    const event = {
      type: eventType,
      call_id: callId,
      event_id: `demo-event-${Date.now()}`,
      timestamp: new Date().toISOString(),
      ...data
    }

    console.log('🎭 MOCK Retell: Simulating webhook event', {
      type: eventType,
      callId,
      webhookUrl
    })

    return event
  }
}