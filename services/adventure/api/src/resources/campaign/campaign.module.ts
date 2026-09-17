import { Module } from '@nestjs/common';
import { CampaignService } from '@/resources/campaign/campaign.service';
import { CampaignController } from '@/resources/campaign/campaign.controller';
import { MongooseModule } from '@nestjs/mongoose';
import {
  Campaign,
  CampaignSchema,
} from '@/resources/campaign/schemas/campaign.schema';
import { Logger } from 'winston';
import {
  Groups,
  GroupsSchema,
} from '@/resources/campaign/schemas/sub/groups.schema';
import { GroupModule } from '@/resources/group/group.module';
import { Group, GroupSchema } from '@/resources/group/schemas/group.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Campaign.name, schema: CampaignSchema },
      { name: Groups.name, schema: GroupsSchema },
      { name: Group.name, schema: GroupSchema },
    ]),
    GroupModule,
  ],
  exports: [
    MongooseModule.forFeature([
      { name: Campaign.name, schema: CampaignSchema },
    ]),
  ],
  controllers: [CampaignController],
  providers: [CampaignService, Logger],
})
export class CampaignModule {}
