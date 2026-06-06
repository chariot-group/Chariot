import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString } from 'class-validator';
import { PaymentStatus } from '@prisma/client';

export class UpdatePaymentStatusDto {
    @ApiProperty({
        enum: PaymentStatus,
        description: 'Nouveau statut du paiement',
        example: 'COMPLETED',
    })
    @IsEnum(PaymentStatus)
    status: PaymentStatus;

    @ApiProperty({
        description: 'Stripe Payment Intent ID (optionnel, pour lier après webhooks)',
        required: false,
        example: 'pi_test_123',
    })
    @IsOptional()
    @IsString()
    stripePaymentIntentId?: string;
}
