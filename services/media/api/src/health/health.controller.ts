import { Controller, Get, Logger, Res } from '@nestjs/common';
import { Public } from '@/common/decorators/public.decorator';
import { MinioService } from '@/resources/media/minio.service';
import { Response } from 'express';
import { storeFailLine } from '@/observability/store-log';

@Controller()
export class HealthController {
  private readonly logger = new Logger(HealthController.name);

  constructor(private readonly minioService: MinioService) {}

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
  async checkReadiness(@Res({ passthrough: true }) res: Response) {
    const minio = await this.minioService.isReady();
    if (!minio) {
      res.status(503);
      this.logger.warn(storeFailLine('minio', 'ready', 'unreachable'));
    }
    return {
      status: minio ? 'ready' : 'not_ready',
      timestamp: new Date().toISOString(),
      service: 'chariot-media',
      checks: { minio },
    };
  }
}
