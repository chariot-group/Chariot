import { PartialType } from '@nestjs/mapped-types';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsOptional } from 'class-validator';
import { CreateAffiliationDto } from '@/resources/affiliation/dto/create-affiliation.dto';

export class UpdateAffiliationDto extends PartialType(CreateAffiliationDto) {
    @ApiPropertyOptional({
        description: "Activer ou désactiver le programme d'affiliation",
        example: true,
    })
    @IsOptional()
    @IsBoolean()
    isActive?: boolean;
}
