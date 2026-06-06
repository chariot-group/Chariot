import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
    IsString,
    IsInt,
    IsOptional,
    IsBoolean,
    Min,
    MinLength,
} from 'class-validator';

export class CreatePaymentDto {
    @ApiProperty({
        description: 'Keycloak ID de l\'utilisateur qui effectue le paiement',
        example: '123e4567-e89b-12d3-a456-426614174000',
    })
    @IsString()
    @MinLength(1)
    userId: string;

    @ApiProperty({
        description: 'Montant total de la commande en centimes (avant réduction)',
        example: 5000,
    })
    @IsInt()
    @Min(0)
    amount: number;

    @ApiProperty({
        description: 'Devise de la commande',
        example: 'eur',
        default: 'eur',
    })
    @IsString()
    @MinLength(3)
    currency: string;

    @ApiPropertyOptional({
        description: 'Code promo à appliquer (optionnel)',
        example: 'SUMMER20',
    })
    @IsOptional()
    @IsString()
    promoCode?: string;

    @ApiPropertyOptional({
        description: "Code d'affiliation à appliquer (optionnel)",
        example: 'CREATOR123',
    })
    @IsOptional()
    @IsString()
    affiliationCode?: string;

    @ApiPropertyOptional({
        description:
            "Indique si c'est la première commande de l'utilisateur (pour les codes promo 'Première commande')",
        example: false,
        default: false,
    })
    @IsOptional()
    @IsBoolean()
    isFirstOrder?: boolean;

    @ApiPropertyOptional({
        description: 'Stripe session ID (renseigné après création de la session Stripe)',
        example: 'cs_test_123',
    })
    @IsOptional()
    @IsString()
    stripeSessionId?: string;
}
