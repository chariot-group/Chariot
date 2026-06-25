import { Controller, Get } from '@nestjs/common';
import { Public } from '@/common/decorators/public.decorator';

@Controller()
export class HealthController {
  @Get('health')
  @Public()
  checkHealth() {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      service: 'chariot-media',
    };
  }

  @Get('ready')
  @Public()
  checkReadiness() {
    return {
      status: 'ready',
      timestamp: new Date().toISOString(),
      service: 'chariot-media',
    };
  }
}
