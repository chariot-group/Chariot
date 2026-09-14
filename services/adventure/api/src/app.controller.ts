import { Logger, Controller, Get, Res } from '@nestjs/common';
import { InjectConnection } from '@nestjs/mongoose';
import { AppService } from '@/app.service';
import { Public } from '@/common/decorators/public.decorator';
import { ApiExcludeController } from '@nestjs/swagger';
import { Response } from 'express';
import { Connection } from 'mongoose';
import { storeFailLine } from '@/observability/store-log';

@ApiExcludeController()
@Controller()
export class AppController {
  constructor(
    private readonly appService: AppService,
    private readonly logger: Logger,
    @InjectConnection() private readonly mongoConnection: Connection,
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

  @Public()
  @Get('ready')
  getReadiness(@Res({ passthrough: true }) res: Response) {
    const mongo = this.mongoConnection.readyState === 1;
    if (!mongo) {
      res.status(503);
      this.logger.warn(
        storeFailLine('mongo', 'ready', 'not_connected'),
        this.SERVICE,
      );
    }
    return {
      status: mongo ? 'ready' : 'not_ready',
      timestamp: new Date().toISOString(),
      service: 'chariot-adventure',
      checks: { mongo },
    };
  }
}
