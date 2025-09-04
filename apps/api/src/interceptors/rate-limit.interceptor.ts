import { CallHandler, ExecutionContext, Injectable, NestInterceptor, HttpException, HttpStatus, Inject } from '@nestjs/common'
import { Observable } from 'rxjs'

@Injectable()
export class RateLimitInterceptor implements NestInterceptor {
  private ipLimit = Number(process.env.RATE_LIMIT_IP_PER_MIN || 60)
  private webhookLimit = Number(process.env.RATE_LIMIT_TENANT_PER_MIN || 600)
  constructor(
    @Inject('REDIS_MODE') private readonly mode: 'real' | 'null',
    @Inject('REDIS_CLIENT') private readonly redis: any
  ) {}
  async intercept(context: ExecutionContext, next: CallHandler): Promise<Observable<any>> {
    const ctx = context.switchToHttp()
    const req: any = ctx.getRequest()
    const ip: string = (req.headers['x-forwarded-for'] || req.ip || 'unknown').toString().split(',')[0].trim()
    const path: string = req.url || ''
    const window = Math.floor(Date.now() / 60000)
    const key = `rate:${path.startsWith('/webhooks') ? 'wh' : 'ip'}:${path.startsWith('/webhooks') ? 'global' : ip}:${window}`
    const limit = path.startsWith('/webhooks') ? this.webhookLimit : this.ipLimit
    if (this.mode === 'null') {
      // No-op in demo/null mode
      return next.handle()
    }
    const count = await this.redis.incr?.(key)
    if (count === 1) await this.redis.expire?.(key, 60)
    if (count > limit) {
      throw new HttpException('Rate limit exceeded', HttpStatus.TOO_MANY_REQUESTS)
    }
    return next.handle()
  }
}
