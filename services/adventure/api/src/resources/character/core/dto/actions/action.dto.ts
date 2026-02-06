import { Type } from 'class-transformer';
import {
    IsNumber,
    IsOptional,
    IsString,
    ValidateNested,
} from 'class-validator';
import { DamageDto } from '@/resources/character/core/dto/actions/damage.dto';
import { ApiProperty } from '@nestjs/swagger';

export class ActionDto {

    @ApiProperty({ example: 'Fireball' })
    @IsOptional()
    @IsString()
    name?: string;

    @ApiProperty({ example: 'Melee Weapon Attack' })
    @IsOptional()
    @IsString()
    type?: string;

    @ApiProperty({ example: 5 })
    @IsOptional()
    @IsNumber()
    attackBonus?: number;

    @ApiProperty({ type: DamageDto })
    @ValidateNested()
    @IsOptional()
    @Type(() => DamageDto)
    damage?: DamageDto;

    @ApiProperty({ example: '30 feet' })
    @IsOptional()
    @IsString()
    range?: string;
}
