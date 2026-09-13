import { Module } from '@nestjs/common';
import { HealthController } from '@/health/health.controller';
import { MediaModule } from '@/resources/media/media.module';

@Module({
  imports: [MediaModule],
  controllers: [HealthController],
})
export class HealthModule {}
