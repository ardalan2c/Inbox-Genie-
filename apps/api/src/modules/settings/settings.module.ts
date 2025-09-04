import { Module } from '@nestjs/common'
import { SettingsController } from './settings.controller'
import { PrismaService } from '../../services/prisma.service'
import { CalendarService } from '../../services/calendar.service'
import { UsageService } from '../../services/usage.service'

@Module({ controllers: [SettingsController], providers: [PrismaService, CalendarService, UsageService] })
export class SettingsModule {}
