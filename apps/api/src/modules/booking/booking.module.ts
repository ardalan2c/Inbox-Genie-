import { Module } from '@nestjs/common'
import { BookingController } from './booking.controller'
import { PrismaService } from '../../services/prisma.service'
import { CalendarService } from '../../services/calendar.service'
import { FubService } from '../../services/fub.service'
import { OutboxService } from '../../services/outbox.service'

@Module({ controllers: [BookingController], providers: [PrismaService, CalendarService, FubService, OutboxService] })
export class BookingModule {}
