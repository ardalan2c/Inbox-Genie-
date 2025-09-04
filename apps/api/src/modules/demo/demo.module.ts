import { Module } from '@nestjs/common'
import { DemoController } from './demo.controller'
import { PrismaService } from '../../services/prisma.service'
import { UsageService } from '../../services/usage.service'

@Module({
  controllers: [DemoController],
  providers: [PrismaService, UsageService]
})
export class DemoModule {}