import { Controller, Get, HttpException, HttpStatus, Query, Res } from '@nestjs/common'
import type { FastifyReply } from 'fastify'
import { CalendarService } from '../../services/calendar.service'
import { PrismaService } from '../../services/prisma.service'

@Controller('oauth')
export class OauthController {
  constructor(private calendar: CalendarService, private prisma: PrismaService) {}

  @Get('google/start')
  async start(@Res() res: FastifyReply) {
    const auth = await this.calendar.getGoogleAuth()
    if (!auth) throw new HttpException('Google OAuth not configured', HttpStatus.NOT_IMPLEMENTED)
    const url = auth.generateAuthUrl({ scope: ['https://www.googleapis.com/auth/calendar.readonly', 'openid', 'email', 'profile'], access_type: 'offline', prompt: 'consent' })
    res.redirect(url)
  }

  @Get('google/callback')
  async callback(@Query('code') code: string) {
    const auth = await this.calendar.getGoogleAuth()
    if (!auth) throw new HttpException('Google OAuth not configured', HttpStatus.NOT_IMPLEMENTED)
    const { tokens } = await auth.getToken(code)
    const tenantId = 'demo-tenant'
    if (!tokens.access_token || !tokens.refresh_token || !tokens.expiry_date) throw new HttpException('Missing tokens', HttpStatus.BAD_REQUEST)
    await this.prisma.calendarConnection.upsert({
      where: { id: tenantId + '_google' },
      create: { id: tenantId + '_google', tenantId, provider: 'google', accessToken: tokens.access_token, refreshToken: tokens.refresh_token, expiryDate: new Date(tokens.expiry_date) },
      update: { accessToken: tokens.access_token, refreshToken: tokens.refresh_token, expiryDate: new Date(tokens.expiry_date) }
    })
    return { connected: true }
  }
}

