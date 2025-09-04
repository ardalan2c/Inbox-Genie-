import { Injectable } from '@nestjs/common'

@Injectable()
export class FubService {
  private base = 'https://api.followupboss.com/v1'
  private headers() {
    const key = process.env.FUB_API_KEY
    if (!key) return null
    const auth = Buffer.from(`${key}:`).toString('base64')
    return { 'Content-Type': 'application/json', 'Authorization': `Basic ${auth}` }
  }

  async upsertLead(lead: { firstName?: string; lastName?: string; emails?: string[]; phones?: string[] }) {
    const headers = this.headers()
    if (!headers) return { ok: false, gated: true }
    const res = await fetch(`${this.base}/people`, { method: 'POST', headers, body: JSON.stringify(lead) })
    const data = await res.json().catch(() => ({}))
    return { ok: res.ok, data }
  }

  async addNote(personId: number, text: string) {
    const headers = this.headers()
    if (!headers) return { ok: false, gated: true }
    const res = await fetch(`${this.base}/notes`, { method: 'POST', headers, body: JSON.stringify({ personId, text }) })
    const data = await res.json().catch(() => ({}))
    return { ok: res.ok, data }
  }

  async createTask(personId: number, subject: string) {
    const headers = this.headers()
    if (!headers) return { ok: false, gated: true }
    const dueDate = new Date().toISOString().slice(0, 10)
    const res = await fetch(`${this.base}/tasks`, { method: 'POST', headers, body: JSON.stringify({ personId, subject, dueDate }) })
    const data = await res.json().catch(() => ({}))
    return { ok: res.ok, data }
  }
}

