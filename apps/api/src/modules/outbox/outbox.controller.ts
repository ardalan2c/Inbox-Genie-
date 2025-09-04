import { Controller, Post } from '@nestjs/common'
import { OutboxService } from '../../services/outbox.service'

@Controller('outbox')
export class OutboxController {
  constructor(private outbox: OutboxService) {}

  @Post('flush')
  async flush() { return this.outbox.flush() }
}

