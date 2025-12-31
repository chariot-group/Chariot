import {
  IsString,
  IsOptional,
  IsMongoId,
  ValidateNested,
  IsArray,
} from 'class-validator';
import { Type } from 'class-transformer';
import { StatsDto } from '@/resources/character/core/dto/stats/stats.dto';
import { AffinitiesDto } from '@/resources/character/core/dto/affinities/affinities.dto';
import { AbilityDto } from '@/resources/character/core/dto/ability/ability.dto';
import { SpellcastingDto } from '@/resources/character/core/dto/spellcasting/spellcasting.dto';
import { ApiProperty } from '@nestjs/swagger';

export class CreateCharacterDto {

  @ApiProperty({ example: 'Aragorn' })
  @IsString()
  name: string;

  @ApiProperty({ example: '60f7c2ab4f1a256e1c8b4567' })
  @IsMongoId({ each: true })
  @IsArray()
  @IsOptional()
  groups?: string[];

  @ApiProperty({ type: StatsDto })
  @ValidateNested()
  @IsOptional()
  @Type(() => StatsDto)
  stats: StatsDto;

  @ApiProperty({ type: AffinitiesDto })
  @ValidateNested()
  @IsOptional()
  @Type(() => AffinitiesDto)
  affinities: AffinitiesDto;

  @ApiProperty({ type: [AbilityDto] })
  @ValidateNested({ each: true })
  @IsArray()
  @IsOptional()
  @Type(() => AbilityDto)
  abilities: AbilityDto[];

  @ApiProperty({ type: [SpellcastingDto] })
  @ValidateNested({ each: true })
  @IsArray()
  @IsOptional()
  @Type(() => SpellcastingDto)
  spellcasting: SpellcastingDto[];
}
