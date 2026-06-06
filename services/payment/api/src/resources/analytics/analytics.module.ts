import { Module } from '@nestjs/common';
import { AnalyticsController } from '@/resources/analytics/analytics.controller';
import { AnalyticsService } from '@/resources/analytics/analytics.service';
import { PrismaModule } from '@/prisma/prisma.module';

@Module({
    imports: [PrismaModule],
    controllers: [AnalyticsController],
    providers: [AnalyticsService],
})
export class AnalyticsModule { }
