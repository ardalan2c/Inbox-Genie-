export type RedisMode = 'real' | 'null'

export interface RedisLike {
  get?: (...args: any[]) => Promise<any>
  set?: (...args: any[]) => Promise<any>
  del?: (...args: any[]) => Promise<any>
  expire?: (...args: any[]) => Promise<any>
  ttl?: (...args: any[]) => Promise<any>
  incr?: (...args: any[]) => Promise<any>
  ping?: (...args: any[]) => Promise<any>
  publish?: (...args: any[]) => Promise<any>
  subscribe?: (...args: any[]) => Promise<any>
  on?: (...args: any[]) => any
}

export function createRedis(): { client: RedisLike; mode: RedisMode; connected: boolean } {
  const requireRedis = (process.env.REQUIRE_REDIS || 'false').toLowerCase() === 'true'
  const url = process.env.REDIS_URL
  const demo = (process.env.DEMO_MODE || 'false').toLowerCase() === 'true'

  // If no URL or demo mode and not strictly required → null
  if (!url || (demo && !requireRedis)) {
    return { client: createNullRedis(), mode: 'null', connected: false }
  }

  // Real Redis with safe connection options (no boot blocking)
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const { default: IORedis } = require('ioredis') as any
  const client = new IORedis(url, {
    lazyConnect: true,
    enableOfflineQueue: false,
    connectTimeout: 2000,
    maxRetriesPerRequest: 1,
    retryStrategy: (times: number) => Math.min(times * 200, 1000)
  }) as unknown as RedisLike

  return { client, mode: 'real', connected: false }
}

function createNullRedis(): RedisLike {
  const noop = async (..._args: any[]) => undefined
  const onNoop = () => undefined
  return {
    get: noop,
    set: noop,
    del: noop,
    expire: noop,
    ttl: noop,
    incr: async () => 1,
    ping: async () => 'PONG',
    publish: noop,
    subscribe: noop,
    on: onNoop
  } as RedisLike
}

