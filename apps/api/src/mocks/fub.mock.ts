export class MockFubService {
  private apiKey?: string

  constructor(apiKey?: string) {
    this.apiKey = apiKey
  }

  async upsertLead(data: { firstName: string; phones: string[] }) {
    console.log('🎭 MOCK FUB: Upserting lead', {
      name: data.firstName,
      phones: data.phones
    })

    const personId = Math.floor(Math.random() * 10000) + 1000

    return {
      success: true,
      data: {
        id: personId,
        firstName: data.firstName,
        phones: data.phones,
        created: new Date().toISOString(),
        source: 'demo-api'
      }
    }
  }

  async createNote(personId: number, text: string) {
    console.log('🎭 MOCK FUB: Creating note', {
      personId,
      text: text.substring(0, 50) + '...',
      length: text.length
    })

    return {
      success: true,
      data: {
        id: Math.floor(Math.random() * 10000),
        personId,
        body: text,
        created: new Date().toISOString()
      }
    }
  }

  async createTask(personId: number, subject: string) {
    console.log('🎭 MOCK FUB: Creating task', {
      personId,
      subject
    })

    return {
      success: true,
      data: {
        id: Math.floor(Math.random() * 10000),
        personId,
        subject,
        dueDate: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        created: new Date().toISOString()
      }
    }
  }

  static create(apiKey?: string) {
    if (apiKey && apiKey.length > 10) {
      // In a real implementation, we'd return the actual FubService
      // For demo, we'll still return mock but note that real key was provided
      console.log('🎭 MOCK FUB: Using mock service (real FUB key detected but mock for demo safety)')
    }
    
    return new MockFubService(apiKey)
  }
}