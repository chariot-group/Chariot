import { Module } from '@nestjs/common';
import { AnalyticsController } from '@/resources/analytics/analytics.controller';
import { AnalyticsService } from '@/resources/analytics/analytics.service';
import { UserModule } from '@/resources/user/user.module';
import { CampaignModule } from '@/resources/campaign/campaign.module';
import { CharacterModule } from '@/resources/character/character.module';

@Module({
  imports: [UserModule, CampaignModule, CharacterModule],
  controllers: [AnalyticsController],
  providers: [AnalyticsService],
})
export class AnalyticsModule {}
