import {
    BadRequestException,
    Body,
    Controller,
    Get,
    Headers,
    HttpCode,
    Logger,
    Param,
    Post,
    Req,
} from '@nestjs/common';
import type { RawBodyRequest } from '@nestjs/common';
import {
    ApiBody,
    ApiHeader,
    ApiOperation,
    ApiParam,
    ApiResponse,
    ApiTags,
    getSchemaPath,
} from '@nestjs/swagger';
import { StripeService } from '@/resources/stripe/stripe.service';
import { CheckoutDto } from '@/resources/stripe/dto/checkout.dto';
import { Public } from '@/common/decorators/public.decorator';
import { IResponse } from '@/common/dtos/response.dto';
import type { ResolvedCode, StripeProductWithPrices } from '@/resources/stripe/types/stripe.type';

@ApiTags('Stripe')
@Controller('stripe')
export class StripeController {
    constructor(private readonly stripeService: StripeService) { }

    private readonly CONTROLLER_NAME = StripeController.name;
    private readonly logger = new Logger(this.CONTROLLER_NAME);

    @Post('checkout')
    @ApiOperation({ summary: 'Create a Stripe checkout session for the authenticated user' })
    @ApiBody({ type: CheckoutDto })
    @ApiResponse({ status: 201, description: 'Checkout session created successfully' })
    @ApiResponse({ status: 400, description: 'Invalid checkout request payload' })
    @ApiResponse({ status: 401, description: 'User not authenticated' })
    @ApiResponse({ status: 500, description: 'Internal error while creating Stripe session' })
    async createCheckout(@Req() request, @Body() dto: CheckoutDto) {
        return this.stripeService.createCheckoutSession(dto, request.user.keycloakId);
    }

    @Post('webhook')
    @Public()
    @HttpCode(200)
    @ApiOperation({ summary: 'Stripe webhook endpoint (public, verified by Stripe signature)' })
    @ApiHeader({
        name: 'stripe-signature',
        required: true,
        description: 'Stripe signature used to validate webhook authenticity',
    })
    @ApiResponse({ status: 200, description: 'Webhook event handled successfully' })
    @ApiResponse({ status: 400, description: 'Invalid webhook payload/signature or missing raw body' })
    async handleWebhook(
        @Req() req: RawBodyRequest<Request>,
        @Headers('stripe-signature') signature: string,
    ) {
        if (!req.rawBody) {
            const errorMessage = 'Stripe webhook request body is missing';
            this.logger.error(errorMessage, null, this.CONTROLLER_NAME);
            throw new BadRequestException(errorMessage);
        }
        return this.stripeService.handleWebhook(req.rawBody, signature);
    }

    @Get('products')
    @Public()
    @ApiOperation({ summary: 'Fetch all active Stripe products with prices' })
    @ApiResponse({
        status: 200,
        description: 'Products fetched successfully',
        schema: { allOf: [{ $ref: getSchemaPath(IResponse) }] },
    })
    async getProducts(): Promise<IResponse<StripeProductWithPrices[]>> {
        return this.stripeService.getAllProducts();
    }

    @Get('resolve-code/:code')
    @ApiOperation({ summary: 'Resolve a promo or affiliation code and return its discount info' })
    @ApiParam({ name: 'code', description: 'The promo or affiliation code to resolve' })
    @ApiResponse({ status: 200, description: 'Code resolved successfully' })
    @ApiResponse({ status: 404, description: 'Code not found or inactive' })
    async resolveCode(@Param('code') code: string): Promise<IResponse<ResolvedCode>> {
        return this.stripeService.resolveCode(code);
    }
}
