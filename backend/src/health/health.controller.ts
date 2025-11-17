import { Controller, Get } from '@nestjs/common';

@Controller()
export class HealthController {
  @Get('health')
  health() {
    // This will be available at /api/health due to global prefix
    return { status: 'ok', timestamp: new Date().toISOString() };
  }

  @Get('config/cors')
  cors() {
    return { cors: process.env.CORS_ORIGIN || '*' };
  }
}
