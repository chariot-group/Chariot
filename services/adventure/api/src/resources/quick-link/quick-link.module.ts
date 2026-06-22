import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import {
  QuickLink,
  QuickLinkSchema,
} from '@/resources/quick-link/schemas/quick-link.schema';
import { QuickLinkService } from '@/resources/quick-link/quick-link.service';
import { QuickLinkController } from '@/resources/quick-link/quick-link.controller';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: QuickLink.name, schema: QuickLinkSchema },
    ]),
  ],
  controllers: [QuickLinkController],
  providers: [QuickLinkService],
})
export class QuickLinkModule {}
