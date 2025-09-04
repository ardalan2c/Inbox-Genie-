import { Injectable } from '@nestjs/common'
import { createRedis } from '../lib/redis-factory'

@Injectable()
export class RedisService {
  client: any
  mode: 'real' | 'null'
  constructor() {
    const { client, mode } = createRedis()
    this.client = client
    this.mode = mode
  }
}
