import {
    Controller,
    Get,
    Post,
    Body,
    Logger,
    Req,
    Query,
    ParseIntPipe,
    DefaultValuePipe,
} from '@nestjs/common';
import {
    ApiTags,
    ApiOperation,
    ApiResponse,
    ApiQuery,
} from '@nestjs/swagger';
import { ReferralService } from '@/resources/referral/referral.service';
import { InitReferralDto } from '@/resources/referral/dto/init-referral.dto';
import { IsAdmin } from '@/common/decorators/is-admin.decorator';

@ApiTags('Referral (Parrainage)')
@Controller('referral')
export class ReferralController {
    constructor(private readonly referralService: ReferralService) { }

    private readonly CONTROLLER_NAME = ReferralController.name;
    private readonly logger = new Logger(this.CONTROLLER_NAME);

    // ─────────────────────────────────────────────────────────────────
    // User endpoints (authenticated)
    // ─────────────────────────────────────────────────────────────────

    @Post('init')
    @ApiOperation({
        summary: 'Initialiser le code de parrainage de l\'utilisateur (appel au 1er login)',
        description: 'Crée le code de parrainage de l\'utilisateur s\'il n\'existe pas encore. Si un code de parrainage est fourni, lie l\'utilisateur comme filleul du parrain correspondant.',
    })
    @ApiResponse({ status: 201, description: 'Parrainage initialisé avec succès' })
    @ApiResponse({ status: 400, description: 'Code invalide ou utilisation du propre code' })
    @ApiResponse({ status: 404, description: 'Code de parrainage introuvable' })
    @ApiResponse({ status: 409, description: 'Utilisateur déjà inscrit via parrainage' })
    async init(@Req() request, @Body() dto: InitReferralDto) {
        return this.referralService.initForUser(request.user.keycloakId, dto.referralCode);
    }

    @Get('me')
    @ApiOperation({
        summary: 'Obtenir mon code de parrainage et l\'état de mes paliers',
        description: 'Retourne le code de parrainage de l\'utilisateur, le nombre de filleuls, le palier de réduction actuel (parrain), et le statut de sa réduction filleul s\'il en a une.',
    })
    @ApiResponse({ status: 200, description: 'Informations de parrainage récupérées' })
    @ApiResponse({ status: 404, description: 'Aucun code de parrainage trouvé' })
    async getMyReferral(@Req() request) {
        return this.referralService.getMyReferral(request.user.keycloakId);
    }

    // ─────────────────────────────────────────────────────────────────
    // Admin endpoints
    // ─────────────────────────────────────────────────────────────────

    @Get()
    @IsAdmin()
    @ApiOperation({ summary: '[Admin] Lister tous les parrainages avec statistiques' })
    @ApiQuery({ name: 'page', required: false, type: Number, example: 1 })
    @ApiQuery({ name: 'limit', required: false, type: Number, example: 20 })
    @ApiResponse({ status: 200, description: 'Liste des parrainages avec statistiques' })
    async findAll(
        @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
        @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit: number,
    ) {
        return this.referralService.findAll(page, limit);
    }

    @Get('payments')
    @IsAdmin()
    @ApiOperation({ summary: '[Admin] Lister tous les paiements effectués avec une réduction de parrainage' })
    @ApiQuery({ name: 'page', required: false, type: Number, example: 1 })
    @ApiQuery({ name: 'limit', required: false, type: Number, example: 20 })
    @ApiResponse({ status: 200, description: 'Liste des paiements avec réduction de parrainage' })
    async findAllPayments(
        @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
        @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit: number,
    ) {
        return this.referralService.findAllPayments(page, limit);
    }
}
