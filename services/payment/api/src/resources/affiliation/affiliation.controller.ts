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
import { AffiliationService } from '@/resources/affiliation/affiliation.service';
import { CreateAffiliationDto } from '@/resources/affiliation/dto/create-affiliation.dto';
import { UpdateAffiliationDto } from '@/resources/affiliation/dto/update-affiliation.dto';
import { IsAdmin } from '@/common/decorators/is-admin.decorator';

@ApiTags('Affiliations (Admin)')
@IsAdmin()
@Controller('affiliations')
export class AffiliationController {
    constructor(private readonly affiliationService: AffiliationService) { }

    private readonly CONTROLLER_NAME = AffiliationController.name;
    private readonly logger = new Logger(this.CONTROLLER_NAME);

    @Post()
    @ApiOperation({ summary: "[Admin] Créer un nouveau programme d'affiliation" })
    @ApiResponse({ status: 201, description: 'Affiliation créée avec succès' })
    @ApiResponse({ status: 400, description: 'Données invalides' })
    @ApiResponse({ status: 401, description: 'Non authentifié' })
    @ApiResponse({ status: 403, description: 'Accès admin requis' })
    @ApiResponse({ status: 409, description: 'Code d\'affiliation déjà existant' })
    async create(@Body() dto: CreateAffiliationDto) {
        return this.affiliationService.create(dto);
    }

    @Get()
    @ApiOperation({ summary: '[Admin] Lister toutes les affiliations' })
    @ApiQuery({ name: 'page', required: false, type: Number, example: 1 })
    @ApiQuery({ name: 'limit', required: false, type: Number, example: 20 })
    @ApiQuery({
        name: 'includeInactive',
        required: false,
        type: Boolean,
        example: false,
    })
    @ApiResponse({ status: 200, description: 'Liste des affiliations avec statistiques' })
    async findAll(
        @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
        @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit: number,
        @Query('includeInactive', new DefaultValuePipe(false), ParseBoolPipe)
        includeInactive: boolean,
    ) {
        return this.affiliationService.findAll(page, limit, includeInactive);
    }

    @Get(':id')
    @ApiOperation({ summary: "[Admin] Obtenir une affiliation par ID (avec stats)" })
    @ApiParam({ name: 'id', description: "UUID de l'affiliation" })
    @ApiResponse({ status: 200, description: 'Affiliation trouvée' })
    @ApiResponse({ status: 404, description: 'Affiliation introuvable' })
    async findOne(@Param('id') id: string) {
        return this.affiliationService.findOne(id);
    }

    @Get(':id/usages')
    @ApiOperation({ summary: "[Admin] Lister les utilisations d'une affiliation" })
    @ApiParam({ name: 'id', description: "UUID de l'affiliation" })
    @ApiQuery({ name: 'page', required: false, type: Number, example: 1 })
    @ApiQuery({ name: 'limit', required: false, type: Number, example: 20 })
    @ApiResponse({ status: 200, description: 'Liste des utilisations' })
    @ApiResponse({ status: 404, description: 'Affiliation introuvable' })
    async getUsages(
        @Param('id') id: string,
        @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
        @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit: number,
    ) {
        return this.affiliationService.getUsages(id, page, limit);
    }

    @Patch(':id')
    @ApiOperation({ summary: "[Admin] Modifier une affiliation" })
    @ApiParam({ name: 'id', description: "UUID de l'affiliation" })
    @ApiResponse({ status: 200, description: 'Affiliation mise à jour' })
    @ApiResponse({ status: 404, description: 'Affiliation introuvable' })
    @ApiResponse({ status: 409, description: 'Code déjà utilisé par une autre affiliation' })
    async update(@Param('id') id: string, @Body() dto: UpdateAffiliationDto) {
        return this.affiliationService.update(id, dto);
    }

    @Patch(':id/deactivate')
    @ApiOperation({ summary: "[Admin] Résilier (désactiver) une affiliation" })
    @ApiParam({ name: 'id', description: "UUID de l'affiliation" })
    @ApiResponse({ status: 200, description: 'Affiliation désactivée' })
    @ApiResponse({ status: 400, description: 'Affiliation déjà inactive' })
    @ApiResponse({ status: 404, description: 'Affiliation introuvable' })
    async deactivate(@Param('id') id: string) {
        return this.affiliationService.deactivate(id);
    }

    @Delete(':id')
    @ApiOperation({ summary: "[Admin] Supprimer définitivement une affiliation (soft delete)" })
    @ApiParam({ name: 'id', description: "UUID de l'affiliation" })
    @ApiResponse({ status: 200, description: 'Affiliation supprimée' })
    @ApiResponse({ status: 404, description: 'Affiliation introuvable' })
    async remove(@Param('id') id: string) {
        return this.affiliationService.remove(id);
    }
}
