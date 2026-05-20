import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsInt, IsOptional, IsString, Min, MinLength } from 'class-validator';

export class CompletePaymentDto {
    @ApiProperty({
        description: 'Keycloak ID de l\'utilisateur',
        example: '123e4567-e89b-12d3-a456-426614174000',
    })
    @IsString()
    @MinLength(1)
    userId: string;

    @ApiProperty({
        description: 'Montant payé en centimes',
        example: 2900,
    })
    @IsInt()
    @Min(0)
    amount: number;

    @ApiProperty({
        description: 'Devise',
        example: 'eur',
    })
    @IsString()
    currency: string;

    @ApiPropertyOptional({
        description: 'Stripe Session ID',
        example: 'cs_test_...',
    })
    @IsOptional()
    @IsString()
    stripeSessionId?: string;

    @ApiPropertyOptional({
        description: 'Stripe Payment Intent ID',
        example: 'pi_test_...',
    })
    @IsOptional()
    @IsString()
    stripePaymentIntentId?: string;

    @ApiPropertyOptional({
        description: 'Nombre total de tokens achetés',
        example: 1000,
    })
    @IsOptional()
    @IsInt()
    @Min(0)
    tokenCount?: number;
}
