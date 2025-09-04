import { Module } from '@nestjs/common'
import { HealthModule } from './health/health.module'
import { BookingModule } from './booking/booking.module'
import { WebhooksModule } from './webhooks/webhooks.module'
import { ReviveModule } from './revive/revive.module'
import { DemoModule } from './demo/demo.module'
import { PrismaService } from '../services/prisma.service'
import { ComplianceService } from '../services/compliance.service'
import { BillingModule } from './billing/billing.module'
import { OauthModule } from './oauth/oauth.module'
import { SettingsModule } from './settings/settings.module'
import { UsageService } from '../services/usage.service'
import { OutboxModule } from './outbox/outbox.module'
import { InfraModule } from './infra/infra.module'
import { RateLimitInterceptor } from '../interceptors/rate-limit.interceptor'

@Module({
  imports: [InfraModule, HealthModule, BookingModule, WebhooksModule, ReviveModule, DemoModule, BillingModule, OauthModule, SettingsModule, OutboxModule],
  providers: [PrismaService, ComplianceService, UsageService, RateLimitInterceptor]
})
export class AppModule {}
