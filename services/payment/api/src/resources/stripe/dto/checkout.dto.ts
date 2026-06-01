import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsInt, IsOptional, IsString, Max, Min, MinLength } from 'class-validator';

export class CheckoutDto {
    @ApiProperty({ example: '507f1f77bcf86cd799439012' })
    @IsString()
    @MinLength(1)
    readonly packId: string;

    @ApiProperty({ example: 'Starter Pack' })
    @IsString()
    @MinLength(1)
    readonly displayName: string;

    @ApiPropertyOptional({ example: 'PROMO10', description: 'Code promo à appliquer' })
    @IsOptional()
    @IsString()
    @MinLength(1)
    readonly promoCode?: string;

    @ApiPropertyOptional({ example: 'AFFIL123', description: "Code d'affiliation à appliquer" })
    @IsOptional()
    @IsString()
    @MinLength(1)
    readonly affiliationCode?: string;

    @ApiPropertyOptional({ example: 2, description: 'Quantité de packs à acheter (1–10)', default: 1 })
    @IsOptional()
    @IsInt()
    @Min(1)
    @Max(10)
    readonly quantity?: number;
}
