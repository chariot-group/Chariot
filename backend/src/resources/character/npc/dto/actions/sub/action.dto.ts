import { Type } from 'class-transformer';
import {
  IsNumber,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';
import { DamageDto } from '@/resources/character/npc/dto/actions/sub/damage.dto';

export class ActionDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  type?: string;

  @IsOptional()
  @IsNumber()
  attackBonus?: number;

  @ValidateNested()
  @IsOptional()
  @Type(() => DamageDto)
  damage?: DamageDto;

  @IsOptional()
  @IsString()
  range?: string;
}
