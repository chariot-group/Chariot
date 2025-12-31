import { Type } from 'class-transformer';
import {
  IsNumber,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';
import { DamageDto } from '@/resources/character/npc/dto/actions/sub/damage.dto';
import { ApiProperty } from '@nestjs/swagger';

export class ActionDto {

  @ApiProperty({ example: 'Fireball' })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiProperty({ example: 'A ball of fire that explodes upon impact.' })
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
