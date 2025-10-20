import { Controller, Get } from '@nestjs/common';

@Controller()
export class HealthController {
  @Get('health')
  health() {
    return { status: 'ok', timestamp: new Date().toISOString() };
  }

  @Get('config/cors')
  cors() {
    return { cors: process.env.CORS_ORIGIN || '*' };
  }
}
