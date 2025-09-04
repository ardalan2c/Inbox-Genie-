import { Module } from '@nestjs/common'
import { BillingController } from './billing.controller'
import { PrismaService } from '../../services/prisma.service'

@Module({ controllers: [BillingController], providers: [PrismaService] })
export class BillingModule {}

