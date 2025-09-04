import type { RedisLike } from '../../lib/redis-factory'

export class RedisHoldService {
  constructor(private redis: RedisLike) {}

  async hold(key: string, ttlSec: number) {
    const res = await this.redis.set?.(key, '1', 'NX', 'EX', ttlSec)
    const ok = res === 'OK'
    return { held: ok }
  }

  async release(key: string) {
    await this.redis.del?.(key)
    return { released: true }
  }
}

