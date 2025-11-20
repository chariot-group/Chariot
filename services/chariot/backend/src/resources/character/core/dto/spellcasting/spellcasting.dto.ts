import {
  IsArray,
  IsNumber,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';
import { SpellDto } from '@/resources/character/core/dto/spellcasting/sub/spell.dto';
import { Type } from 'class-transformer';

export class SpellcastingDto {
  @IsOptional()
  @IsString()
  ability?: string;

  @IsOptional()
  @IsNumber()
  saveDC?: number;

  @IsOptional()
  @IsNumber()
  attackBonus?: number;

  @IsOptional()
  spellSlotsByLevel?: Map<number, { total?: number; used?: number }>;

  @IsOptional()
  @IsNumber()
  totalSlots?: number;

  @ValidateNested({ each: true })
  @IsArray()
  @IsOptional()
  @Type(() => SpellDto)
  spells: SpellDto;
}
