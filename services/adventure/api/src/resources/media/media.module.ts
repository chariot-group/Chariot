import { forwardRef, Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import {
  Character,
  CharacterSchema,
} from '@/resources/character/core/schemas/character.schema';
import { SessionAccessModule } from '@/common/session/session-access.module';
import { UserModule } from '@/resources/user/user.module';
import { MediaController } from '@/resources/media/media.controller';
import { MediaService } from '@/resources/media/media.service';
import { MediaAccessService } from '@/resources/media/media-access.service';
import { MinioService } from '@/resources/media/minio.service';
import { ImageProcessorService } from '@/resources/media/image-processor.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Character.name, schema: CharacterSchema },
    ]),
    SessionAccessModule,
    forwardRef(() => UserModule),
  ],
  controllers: [MediaController],
  providers: [
    MediaService,
    MediaAccessService,
    MinioService,
    ImageProcessorService,
  ],
  exports: [MediaService, MinioService],
})
export class MediaModule {}
