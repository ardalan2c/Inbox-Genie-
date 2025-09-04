import { Injectable } from '@nestjs/common'
import { google } from 'googleapis'
import { PrismaService } from './prisma.service'

@Injectable()
export class CalendarService {
  constructor(private prisma: PrismaService) {}

  async getGoogleAuth() {
    const clientId = process.env.GOOGLE_CLIENT_ID
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET
    const redirectUri = `${process.env.APP_BASE_URL?.replace('3001', '3002')}/oauth/google/callback`
    if (!clientId || !clientSecret) return null
    return new google.auth.OAuth2(clientId, clientSecret, redirectUri)
  }

  async hasConnection(tenantId: string) {
    const c = await this.prisma.calendarConnection.findFirst({ where: { tenantId, provider: 'google' } })
    return !!c
  }

  async freeBusy(tenantId: string, durationMin: number, count: number) {
    let conn: any = null
    try {
      conn = await this.prisma.calendarConnection.findFirst({ where: { tenantId, provider: 'google' } })
    } catch {
      // DB unavailable; fall back to null to trigger demo slots
      return null
    }
    if (!conn) return null
    const auth = await this.getGoogleAuth()
    if (!auth) return null
    auth.setCredentials({ access_token: conn.accessToken, refresh_token: conn.refreshToken, expiry_date: conn.expiryDate.getTime() })
    const calendar = google.calendar({ version: 'v3', auth })
    const now = new Date()
    const timeMin = now.toISOString()
    const timeMax = new Date(now.getTime() + 1000 * 60 * 60 * 24).toISOString()
    const fb = await calendar.freebusy.query({ requestBody: { timeMin, timeMax, items: [{ id: 'primary' }] } })
    const busy = fb.data.calendars?.primary?.busy || []
    const slots: { start: string; end: string }[] = []
    let cursor = new Date(now.getTime() + 60 * 60 * 1000)
    while (slots.length < count) {
      const end = new Date(cursor.getTime() + durationMin * 60 * 1000)
      const overlaps = busy.some((b) => new Date(b.start!) < end && new Date(b.end!) > cursor)
      if (!overlaps) slots.push({ start: cursor.toISOString(), end: end.toISOString() })
      cursor = new Date(cursor.getTime() + 60 * 60 * 1000) // try next hour
    }
    return slots
  }
}
