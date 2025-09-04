import { Module } from '@nestjs/common'
import { ReviveController } from './revive.controller'
import { PrismaService } from '../../services/prisma.service'
import { ComplianceService } from '../../services/compliance.service'

@Module({ controllers: [ReviveController], providers: [PrismaService, ComplianceService] })
export class ReviveModule {}

