import { Global, Module } from '@nestjs/common'
import { createRedis } from '../../lib/redis-factory'
import { InMemoryHoldService } from '../../services/hold/in-memory-hold.service'
import { RedisHoldService } from '../../services/hold/redis-hold.service'

@Global()
@Module({
  providers: [
    {
      provide: 'REDIS_FACTORY_RESULT',
      useFactory: () => createRedis()
    },
    {
      provide: 'REDIS_CLIENT',
      useFactory: (r: { client: any }) => r.client,
      inject: ['REDIS_FACTORY_RESULT']
    },
    {
      provide: 'REDIS_MODE',
      useFactory: (r: { mode: 'real' | 'null' }) => r.mode,
      inject: ['REDIS_FACTORY_RESULT']
    },
    {
      // HOLD service uses Redis when mode=real; in-memory otherwise
      provide: 'HOLD_SERVICE',
      useFactory: (mode: 'real' | 'null', client: any) => {
        const requireRedis = (process.env.REQUIRE_REDIS || 'false').toLowerCase() === 'true'
        if (mode === 'real') return new RedisHoldService(client)
        if (requireRedis && mode === 'null') return new InMemoryHoldService()
        return new InMemoryHoldService()
      },
      inject: ['REDIS_MODE', 'REDIS_CLIENT']
    }
  ],
  exports: ['REDIS_CLIENT', 'REDIS_MODE', 'HOLD_SERVICE']
})
export class InfraModule {}
