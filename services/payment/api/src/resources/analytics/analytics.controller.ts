import {
    Controller,
    Get,
    Query,
    Logger,
} from '@nestjs/common';
import {
    ApiTags,
    ApiOperation,
    ApiResponse,
    ApiQuery,
} from '@nestjs/swagger';
import { AnalyticsService, Period } from '@/resources/analytics/analytics.service';
import { IsAdmin } from '@/common/decorators/is-admin.decorator';

@ApiTags('Analytics (Admin)')
@IsAdmin()
@Controller('analytics')
export class AnalyticsController {
    constructor(private readonly analyticsService: AnalyticsService) { }

    private readonly logger = new Logger(AnalyticsController.name);

    @Get('dashboard')
    @ApiOperation({ summary: '[Admin] Données du tableau de bord (KPIs, revenus, affiliations, promos)' })
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
        description: 'Date de début ISO 8601 (ex: 2025-01-01)',
        example: '2025-01-01',
    })
    @ApiQuery({
        name: 'to',
        required: false,
        type: String,
        description: 'Date de fin ISO 8601 (ex: 2025-12-31)',
        example: '2025-12-31',
    })
    @ApiResponse({ status: 200, description: 'Données du dashboard' })
    @ApiResponse({ status: 401, description: 'Non authentifié' })
    @ApiResponse({ status: 403, description: 'Accès admin requis' })
    async getDashboard(
        @Query('period') period: Period = 'daily',
        @Query('from') from?: string,
        @Query('to') to?: string,
    ) {
        const fromDate = from ? new Date(from) : undefined;
        const toDate = to ? new Date(to) : undefined;
        return this.analyticsService.getDashboard(period, fromDate, toDate);
    }
}
