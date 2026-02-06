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
import { ApiProperty } from '@nestjs/swagger';

export class StatsDto {

  @ApiProperty({ example: 'Medium' })
  @IsOptional()
  @IsString()
  size: Size[number];

  @ApiProperty({ example: 100 })
  @IsOptional()
  @IsNumber()
  maxHitPoints?: number;

  @ApiProperty({ example: 75 })
  @IsOptional()
  @IsNumber()
  currentHitPoints?: number;

  @ApiProperty({ example: 10 })
  @IsOptional()
  @IsNumber()
  tempHitPoints?: number;

  @ApiProperty({ example: 15 })
  @IsOptional()
  @IsNumber()
  armorClass?: number;

  @ApiProperty({ example: 3 })
  @IsOptional()
  @IsNumber()
  initiative?: number;

  @ApiProperty({ example: 12 })
  @IsOptional()
  @IsNumber()
  passivePerception?: number;

  @ApiProperty({ example: ['Common', 'Elvish'] })
  @IsOptional()
  @IsString({ each: true })
  languages?: string[];

  @ApiProperty({ type: AbilityScoresDto })
  @ValidateNested()
  @IsOptional()
  @Type(() => AbilityScoresDto)
  abilityScores?: AbilityScoresDto;

  @ApiProperty({ type: SavingThrowsDto })
  @ValidateNested()
  @IsOptional()
  @Type(() => SavingThrowsDto)
  savingThrows?: SavingThrowsDto;

  @ApiProperty({ type: SpeedDto })
  @ValidateNested()
  @IsOptional()
  @Type(() => SpeedDto)
  speed?: SpeedDto;

  @ApiProperty({ type: SkillDto })
  @ValidateNested()
  @IsOptional()
  @Type(() => SkillDto)
  skills?: SkillDto;

  @ApiProperty({ type: [SenseDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SenseDto)
  senses: SenseDto[];
}
