import { Controller, Get } from '@nestjs/common';
import { HealthService } from './health.service.js';

@Controller('health')
export class HealthController {
  constructor(private readonly service: HealthService) {}

  @Get('live') live(): { status: 'ok' } {
    return { status: 'ok' };
  }

  @Get('ready') async ready(): Promise<{ status: 'ok' }> {
    await this.service.checkReadiness();
    return { status: 'ok' };
  }
}
