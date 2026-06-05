import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
    IsEnum,
    IsInt,
    IsString,
    MinLength,
    MaxLength,
    Min,
    Max,
    IsBoolean,
    IsOptional,
    IsDateString,
    Matches,
} from 'class-validator';
import { DiscountType } from '@prisma/client';

export class CreatePromoCodeDto {
    @ApiProperty({
        description: 'Code promo unique (lettres majuscules, chiffres, tirets)',
        example: 'SUMMER20',
    })
    @IsString()
    @MinLength(3)
    @MaxLength(32)
    @Matches(/^[A-Z0-9_-]+$/, {
        message: 'code must contain only uppercase letters, digits, underscores or dashes',
    })
    code: string;

    @ApiProperty({ description: 'Nom descriptif du code promo', example: 'Promo été 2025' })
    @IsString()
    @MinLength(2)
    @MaxLength(100)
    name: string;

    @ApiProperty({
        enum: DiscountType,
        description: 'Type de réduction: PERCENTAGE (0-100) ou FIXED (centimes)',
        example: 'PERCENTAGE',
    })
    @IsEnum(DiscountType)
    discountType: DiscountType;

    @ApiProperty({
        description:
            'Valeur de la réduction. En % (0-100) si PERCENTAGE, en centimes si FIXED.',
        example: 20,
    })
    @IsInt()
    @Min(1)
    @Max(1000000)
    discountValue: number;

    // Options

    @ApiPropertyOptional({
        description: "Option 'Première commande': ne s'applique que lors du premier achat",
        example: false,
        default: false,
    })
    @IsOptional()
    @IsBoolean()
    isFirstOrderOnly?: boolean;

    @ApiPropertyOptional({
        description:
            "Option 'Dès Y euro d'achat': montant minimum du panier en centimes (ex: 5000 = 50€)",
        example: 5000,
    })
    @IsOptional()
    @IsInt()
    @Min(1)
    minOrderAmount?: number;

    @ApiPropertyOptional({
        description: "Option 'Jusqu'au': date d'expiration du code promo (ISO 8601)",
        example: '2025-12-31T23:59:59.000Z',
    })
    @IsOptional()
    @IsDateString()
    expiresAt?: string;

    @ApiPropertyOptional({
        description:
            "Option 'N premiers': nombre maximum d'utilisations totales du code",
        example: 100,
    })
    @IsOptional()
    @IsInt()
    @Min(1)
    maxTotalUses?: number;

    @ApiPropertyOptional({
        description:
            "Option 'Y fois': nombre maximum d'utilisations par utilisateur (1 par défaut)",
        example: 1,
        default: 1,
    })
    @IsOptional()
    @IsInt()
    @Min(1)
    maxUsesPerUser?: number;
}
