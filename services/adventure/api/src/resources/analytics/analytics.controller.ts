import { Controller, Get, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiQuery } from '@nestjs/swagger';
import { AnalyticsService } from '@/resources/analytics/analytics.service';
import { Period } from '@/resources/analytics/analytics.types';
import { IsAdmin } from '@/common/decorators/is-admin.decorator';

@ApiTags('Analytics (Admin)')
@IsAdmin()
@Controller('analytics')
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  @Get('business')
  @ApiOperation({
    summary:
      '[Admin] KPIs business Adventure (funnel acquisition, économie wheels, contenu)',
  })
  @ApiQuery({
    name: 'period',
    required: false,
    enum: ['daily', 'weekly', 'monthly'],
    example: 'daily',
  })
  @ApiQuery({
    name: 'from',
    required: false,
    type: String,
    example: '2025-01-01',
  })
  @ApiQuery({
    name: 'to',
    required: false,
    type: String,
    example: '2025-12-31',
  })
  @ApiResponse({ status: 200, description: 'KPIs Adventure' })
  @ApiResponse({ status: 401, description: 'Non authentifié' })
  @ApiResponse({ status: 403, description: 'Accès admin requis' })
  async getBusiness(
    @Query('period') period: Period = 'daily',
    @Query('from') from?: string,
    @Query('to') to?: string,
  ) {
    const fromDate = from ? new Date(from) : undefined;
    const toDate = to ? new Date(`${to}T23:59:59.999Z`) : undefined;
    return this.analyticsService.getBusiness(period, fromDate, toDate);
  }
}
