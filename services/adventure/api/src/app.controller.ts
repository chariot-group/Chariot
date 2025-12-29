import { Logger, Controller, Get } from '@nestjs/common';
import { AppService } from '@/app.service';

@Controller()
export class AppController {
  constructor(
    private readonly appService: AppService,
    private readonly logger: Logger,
  ) {}

  readonly SERVICE = AppController.name;

  @Get()
  getHello(): string {
    this.logger.log('Say Hello World', this.SERVICE);
    return this.appService.getHello();
  }
}
