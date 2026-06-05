import { PartialType } from '@nestjs/mapped-types';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsOptional } from 'class-validator';
import { CreatePromoCodeDto } from '@/resources/promo-code/dto/create-promo-code.dto';

export class UpdatePromoCodeDto extends PartialType(CreatePromoCodeDto) {
    @ApiPropertyOptional({
        description: 'Activer ou désactiver le code promo',
        example: true,
    })
    @IsOptional()
    @IsBoolean()
    isActive?: boolean;
}
