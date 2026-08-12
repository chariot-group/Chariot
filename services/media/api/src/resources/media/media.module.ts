import { Module } from '@nestjs/common';
import { MediaController } from '@/resources/media/media.controller';
import { MediaService } from '@/resources/media/media.service';
import { MediaAccessService } from '@/resources/media/media-access.service';
import { MinioService } from '@/resources/media/minio.service';
import { ImageProcessorService } from '@/resources/media/image-processor.service';
import { MetricsModule } from '@/metrics/metrics.module';

@Module({
  imports: [MetricsModule],
  controllers: [MediaController],
  providers: [
    MediaService,
    MediaAccessService,
    MinioService,
    ImageProcessorService,
  ],
})
export class MediaModule {}
