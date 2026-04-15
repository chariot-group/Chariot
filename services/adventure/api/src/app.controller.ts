import { Logger, Controller, Get } from '@nestjs/common';
import { AppService } from '@/app.service';
import { Public } from '@/common/decorators/public.decorator';
import { ApiExcludeController } from '@nestjs/swagger';

@ApiExcludeController()
@Controller()
export class AppController {
  constructor(
    private readonly appService: AppService,
    private readonly logger: Logger,
  ) {}

  readonly SERVICE = AppController.name;

  @Public()
  @Get()
  getHealth() {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      service: 'chariot-adventure',
    };
  }
}
