import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsInt, IsOptional, IsString, Max, Min, MinLength } from 'class-validator';

export class UpdatePaymentIntentDto {
    @ApiPropertyOptional({ example: 2, description: 'Nouvelle quantité (1–10)', default: 1 })
    @IsOptional()
    @IsInt()
    @Min(1)
    @Max(10)
    readonly quantity?: number;

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
}
