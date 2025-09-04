import { Module } from '@nestjs/common'
import { OutboxController } from './outbox.controller'
import { PrismaService } from '../../services/prisma.service'
import { OutboxService } from '../../services/outbox.service'
import { FubService } from '../../services/fub.service'

@Module({ controllers: [OutboxController], providers: [PrismaService, OutboxService, FubService] })
export class OutboxModule {}

