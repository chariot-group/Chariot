import { Controller, Get, Res } from '@nestjs/common';
import { Public } from '@/common/decorators/public.decorator';
import { MinioService } from '@/resources/media/minio.service';
import { Response } from 'express';

@Controller()
export class HealthController {
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
    }
    return {
      status: minio ? 'ready' : 'not_ready',
      timestamp: new Date().toISOString(),
      service: 'chariot-media',
      checks: { minio },
    };
  }
}
