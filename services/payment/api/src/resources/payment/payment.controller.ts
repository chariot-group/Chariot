import {
    Controller,
    Get,
    Post,
    Patch,
    Body,
    Param,
    Query,
    Logger,
    ParseIntPipe,
    DefaultValuePipe,
} from '@nestjs/common';
import {
    ApiTags,
    ApiOperation,
    ApiResponse,
    ApiParam,
    ApiQuery,
} from '@nestjs/swagger';
import { PaymentService } from '@/resources/payment/payment.service';
import { CreatePaymentDto } from '@/resources/payment/dto/create-payment.dto';
import { UpdatePaymentStatusDto } from '@/resources/payment/dto/update-payment-status.dto';
import { IsAdmin } from '@/common/decorators/is-admin.decorator';

@ApiTags('Payments (Admin)')
@IsAdmin()
@Controller('payments')
export class PaymentController {
    constructor(private readonly paymentService: PaymentService) { }

    private readonly CONTROLLER_NAME = PaymentController.name;
    private readonly logger = new Logger(this.CONTROLLER_NAME);

    @Post()
    @ApiOperation({
        summary:
            '[Admin] Créer un paiement (calcule et applique les réductions promo/affiliation)',
    })
    @ApiResponse({ status: 201, description: 'Paiement créé avec les réductions appliquées' })
    @ApiResponse({ status: 400, description: 'Code promo invalide ou conditions non remplies' })
    @ApiResponse({ status: 401, description: 'Non authentifié' })
    @ApiResponse({ status: 403, description: 'Accès admin requis' })
    async create(@Body() dto: CreatePaymentDto) {
        return this.paymentService.create(dto);
    }

    @Get()
    @ApiOperation({ summary: '[Admin] Lister tous les paiements' })
    @ApiQuery({ name: 'page', required: false, type: Number, example: 1 })
    @ApiQuery({ name: 'limit', required: false, type: Number, example: 20 })
    @ApiQuery({
        name: 'userId',
        required: false,
        type: String,
        description: 'Filtrer par Keycloak ID utilisateur',
    })
    @ApiQuery({
        name: 'status',
        required: false,
        type: String,
        enum: ['PENDING', 'COMPLETED', 'FAILED', 'REFUNDED'],
    })
    @ApiResponse({ status: 200, description: 'Liste des paiements' })
    async findAll(
        @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
        @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit: number,
        @Query('userId') userId?: string,
        @Query('status') status?: string,
    ) {
        return this.paymentService.findAll(page, limit, userId, status);
    }

    @Get(':id')
    @ApiOperation({ summary: '[Admin] Obtenir un paiement par ID' })
    @ApiParam({ name: 'id', description: 'UUID du paiement' })
    @ApiResponse({ status: 200, description: 'Paiement trouvé' })
    @ApiResponse({ status: 404, description: 'Paiement introuvable' })
    async findOne(@Param('id') id: string) {
        return this.paymentService.findOne(id);
    }

    @Get('stripe-session/:sessionId')
    @ApiOperation({ summary: '[Admin] Obtenir un paiement par Stripe Session ID' })
    @ApiParam({ name: 'sessionId', description: 'Stripe Session ID' })
    @ApiResponse({ status: 200, description: 'Paiement trouvé' })
    @ApiResponse({ status: 404, description: 'Paiement introuvable' })
    async findByStripeSession(@Param('sessionId') sessionId: string) {
        return this.paymentService.findByStripeSession(sessionId);
    }

    @Patch(':id/status')
    @ApiOperation({
        summary:
            '[Admin] Mettre à jour le statut d\'un paiement (enregistre les usages si COMPLETED)',
    })
    @ApiParam({ name: 'id', description: 'UUID du paiement' })
    @ApiResponse({
        status: 200,
        description:
            'Statut mis à jour. Si COMPLETED, les usages promo/affiliation sont enregistrés.',
    })
    @ApiResponse({ status: 404, description: 'Paiement introuvable' })
    async updateStatus(
        @Param('id') id: string,
        @Body() dto: UpdatePaymentStatusDto,
    ) {
        return this.paymentService.updateStatus(id, dto);
    }
}
