import { Module } from '@nestjs/common'
import { WebhooksController } from './webhooks.controller'
import { PrismaService } from '../../services/prisma.service'
import { FubService } from '../../services/fub.service'
import { OutboxService } from '../../services/outbox.service'

@Module({ controllers: [WebhooksController], providers: [PrismaService, FubService, OutboxService] })
export class WebhooksModule {}
