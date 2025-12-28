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

export class CreateCharacterDto {
  @IsString()
  name: string;

  @IsMongoId({ each: true })
  @IsArray()
  @IsOptional()
  groups?: string[];

  @ValidateNested()
  @IsOptional()
  @Type(() => StatsDto)
  stats: StatsDto;

  @ValidateNested()
  @IsOptional()
  @Type(() => AffinitiesDto)
  affinities: AffinitiesDto;

  @ValidateNested({ each: true })
  @IsArray()
  @IsOptional()
  @Type(() => AbilityDto)
  abilities: AbilityDto[];

  @ValidateNested({ each: true })
  @IsArray()
  @IsOptional()
  @Type(() => SpellcastingDto)
  spellcasting: SpellcastingDto[];
}
