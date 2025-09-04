import { Module } from '@nestjs/common'
import { OauthController } from './oauth.controller'
import { PrismaService } from '../../services/prisma.service'
import { CalendarService } from '../../services/calendar.service'

@Module({ controllers: [OauthController], providers: [PrismaService, CalendarService] })
export class OauthModule {}

