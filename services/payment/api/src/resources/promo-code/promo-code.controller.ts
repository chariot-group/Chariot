import {
    Controller,
    Get,
    Post,
    Patch,
    Delete,
    Body,
    Param,
    Query,
    Logger,
    ParseIntPipe,
    DefaultValuePipe,
    ParseBoolPipe,
} from '@nestjs/common';
import {
    ApiTags,
    ApiOperation,
    ApiResponse,
    ApiParam,
    ApiQuery,
} from '@nestjs/swagger';
import { PromoCodeService } from '@/resources/promo-code/promo-code.service';
import { CreatePromoCodeDto } from '@/resources/promo-code/dto/create-promo-code.dto';
import { UpdatePromoCodeDto } from '@/resources/promo-code/dto/update-promo-code.dto';
import { IsAdmin } from '@/common/decorators/is-admin.decorator';

@ApiTags('Promo Codes (Admin)')
@IsAdmin()
@Controller('promo-codes')
export class PromoCodeController {
    constructor(private readonly promoCodeService: PromoCodeService) { }

    private readonly CONTROLLER_NAME = PromoCodeController.name;
    private readonly logger = new Logger(this.CONTROLLER_NAME);

    @Post()
    @ApiOperation({ summary: '[Admin] Créer un nouveau code promo' })
    @ApiResponse({ status: 201, description: 'Code promo créé avec succès' })
    @ApiResponse({ status: 400, description: 'Données invalides' })
    @ApiResponse({ status: 401, description: 'Non authentifié' })
    @ApiResponse({ status: 403, description: 'Accès admin requis' })
    @ApiResponse({ status: 409, description: 'Code promo déjà existant' })
    async create(@Body() dto: CreatePromoCodeDto) {
        return this.promoCodeService.create(dto);
    }

    @Get()
    @ApiOperation({ summary: '[Admin] Lister tous les codes promo' })
    @ApiQuery({ name: 'page', required: false, type: Number, example: 1 })
    @ApiQuery({ name: 'limit', required: false, type: Number, example: 20 })
    @ApiQuery({
        name: 'includeInactive',
        required: false,
        type: Boolean,
        example: false,
    })
    @ApiResponse({ status: 200, description: 'Liste des codes promo' })
    async findAll(
        @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
        @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit: number,
        @Query('includeInactive', new DefaultValuePipe(false), ParseBoolPipe)
        includeInactive: boolean,
    ) {
        return this.promoCodeService.findAll(page, limit, includeInactive);
    }

    @Get(':id')
    @ApiOperation({ summary: '[Admin] Obtenir un code promo par ID' })
    @ApiParam({ name: 'id', description: 'UUID du code promo' })
    @ApiResponse({ status: 200, description: 'Code promo trouvé' })
    @ApiResponse({ status: 404, description: 'Code promo introuvable' })
    async findOne(@Param('id') id: string) {
        return this.promoCodeService.findOne(id);
    }

    @Patch(':id')
    @ApiOperation({ summary: '[Admin] Modifier un code promo' })
    @ApiParam({ name: 'id', description: 'UUID du code promo' })
    @ApiResponse({ status: 200, description: 'Code promo mis à jour' })
    @ApiResponse({ status: 404, description: 'Code promo introuvable' })
    @ApiResponse({ status: 409, description: 'Code déjà utilisé par un autre promo' })
    async update(@Param('id') id: string, @Body() dto: UpdatePromoCodeDto) {
        return this.promoCodeService.update(id, dto);
    }

    @Patch(':id/deactivate')
    @ApiOperation({ summary: '[Admin] Résilier (désactiver) un code promo' })
    @ApiParam({ name: 'id', description: 'UUID du code promo' })
    @ApiResponse({ status: 200, description: 'Code promo désactivé' })
    @ApiResponse({ status: 400, description: 'Code déjà inactif' })
    @ApiResponse({ status: 404, description: 'Code promo introuvable' })
    async deactivate(@Param('id') id: string) {
        return this.promoCodeService.deactivate(id);
    }

    @Delete(':id')
    @ApiOperation({ summary: '[Admin] Supprimer définitivement un code promo (soft delete)' })
    @ApiParam({ name: 'id', description: 'UUID du code promo' })
    @ApiResponse({ status: 200, description: 'Code promo supprimé' })
    @ApiResponse({ status: 404, description: 'Code promo introuvable' })
    async remove(@Param('id') id: string) {
        return this.promoCodeService.remove(id);
    }
}
