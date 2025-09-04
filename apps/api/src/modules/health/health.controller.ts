import { Controller, Get, Inject } from '@nestjs/common'
import { PrismaService } from '../../services/prisma.service'

@Controller('health')
export class HealthController {
  constructor(
    private prisma: PrismaService,
    @Inject('REDIS_MODE') private readonly redisMode: 'real' | 'null',
    @Inject('REDIS_CLIENT') private readonly redis: any
  ) {}
  @Get('keys')
  keys() {
    const required = [
      'RETELL_API_KEY',
      'TWILIO_ACCOUNT_SID',
      'TWILIO_AUTH_TOKEN',
      'TWILIO_MESSAGING_SERVICE_SID',
      'STRIPE_SECRET_KEY',
      'STRIPE_PUBLISHABLE_KEY',
      'STRIPE_WEBHOOK_SECRET',
      'FUB_API_KEY',
      'GOOGLE_CLIENT_ID',
      'GOOGLE_CLIENT_SECRET'
    ]
    const keys: Record<string, boolean> = {}
    for (const k of required) keys[k] = !!process.env[k]
    // Derived provider flags for UI
    const retell = !!process.env.RETELL_API_KEY
    const twilio = !!process.env.TWILIO_ACCOUNT_SID && !!process.env.TWILIO_AUTH_TOKEN && !!process.env.TWILIO_MESSAGING_SERVICE_SID
    const stripe = !!process.env.STRIPE_SECRET_KEY && !!process.env.STRIPE_PUBLISHABLE_KEY && !!process.env.STRIPE_WEBHOOK_SECRET
    const fub = !!process.env.FUB_API_KEY
    const google = !!process.env.GOOGLE_CLIENT_ID && !!process.env.GOOGLE_CLIENT_SECRET
    const demoMode = process.env.DEMO_MODE === 'true'
    return { ok: true, keys, demoMode, retell, twilio, stripe, fub, google }
  }

  @Get('liveness')
  liveness() { return { ok: true } }

  @Get('readiness')
  async readiness() {
    let dbConnected = false;
    try {
      await this.prisma.$queryRaw`SELECT 1`; // works on Postgres
      dbConnected = true;
    } catch {
      dbConnected = false;
    }

    let redisConnected = false;
    if (this.redisMode === 'real' && this.redis?.ping) {
      try { 
        await this.redis.ping(); 
        redisConnected = true; 
      } catch { 
        redisConnected = false; 
      }
    }

    const security = {
      cors: true,
      helmet: true,
      validationPipe: true,
      capsEnforced: process.env.ENFORCE_CAPS === 'true'
    }

    return {
      ok: dbConnected, // legacy flag
      ready: dbConnected && (this.redisMode === 'null' || redisConnected),
      db: { connected: dbConnected },
      redis: { mode: this.redisMode, connected: redisConnected },
      security
    }
  }
}
