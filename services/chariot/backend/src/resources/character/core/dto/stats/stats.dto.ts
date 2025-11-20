import {
  IsArray,
  IsNumber,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';
import { Size } from '@/resources/character/core/constants/sizes.constant';
import { AbilityScoresDto } from './sub/abilityScores.dto';
import { Type } from 'class-transformer';
import { SavingThrowsDto } from '@/resources/character/core/dto/stats/sub/savingThrows.dto';
import { SpeedDto } from '@/resources/character/core/dto/stats/sub/speed.dto';
import { SkillDto } from '@/resources/character/core/dto/stats/sub/skill.dto';
import { SenseDto } from '@/resources/character/core/dto/stats/sub/sense.dto';

export class StatsDto {
  @IsOptional()
  @IsString()
  size: Size[number];

  @IsOptional()
  @IsNumber()
  maxHitPoints?: number;

  @IsOptional()
  @IsNumber()
  currentHitPoints?: number;

  @IsOptional()
  @IsNumber()
  tempHitPoints?: number;

  @IsOptional()
  @IsNumber()
  armorClass?: number;

  @IsOptional()
  @IsNumber()
  passivePerception?: number;

  @IsOptional()
  @IsString({ each: true })
  languages?: string[];

  @ValidateNested()
  @IsOptional()
  @Type(() => AbilityScoresDto)
  abilityScores?: AbilityScoresDto;

  @ValidateNested()
  @IsOptional()
  @Type(() => SavingThrowsDto)
  savingThrows?: SavingThrowsDto;

  @ValidateNested()
  @IsOptional()
  @Type(() => SpeedDto)
  speed?: SpeedDto;

  @ValidateNested()
  @IsOptional()
  @Type(() => SkillDto)
  skills?: SkillDto;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SenseDto)
  senses: SenseDto[];
}
