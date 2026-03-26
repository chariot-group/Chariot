import {
  IsArray,
  IsNumber,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';
import { SpellDto } from '@/resources/character/core/dto/spellcasting/sub/spell.dto';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

export class SpellcastingDto {

  @ApiProperty({ example: 'Wizard' })
  @IsOptional()
  @IsString()
  className?: string;

  @ApiProperty({ example: 'Intelligence' })
  @IsOptional()
  @IsString()
  ability?: string;

  @ApiProperty({ example: 15 })
  @IsOptional()
  @IsNumber()
  saveDC?: number;

  @ApiProperty({ example: 7 })
  @IsOptional()
  @IsNumber()
  attackBonus?: number;

  @ApiProperty({ example: { 1: { total: 4, used: 1 }, 2: { total: 3, used: 0 } } })
  @IsOptional()
  spellSlotsByLevel?: Map<number, { total?: number; used?: number }>;

  @ApiProperty({ description: 'NPC only — uses per day tracker', example: { 2: { used: 1, total: 2 } } })
  @IsOptional()
  spellSlotsByUses?: Map<number, { used?: number; total?: number }>;

  @ApiProperty({ example: 10 })
  @IsOptional()
  @IsNumber()
  totalSlots?: number;

  @ApiProperty({ type: [SpellDto] })
  @ValidateNested({ each: true })
  @IsArray()
  @IsOptional()
  @Type(() => SpellDto)
  spells: SpellDto;
}
