import {
  IsNumber,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';
import { StatsDto } from '@/resources/character/core/dto/stats/stats.dto';
import { Type } from 'class-transformer';
import { MasteryDto } from '@/resources/character/player/dto/stats/player-masteries.dto';
import { MasteriesAbilityDto } from '@/resources/character/player/dto/stats/player-masteriesAbility.dto';
import { ApiProperty } from '@nestjs/swagger';

export class PlayerStatsDto extends StatsDto {
  @ApiProperty({ example: 2 })
  @IsOptional()
  @IsNumber()
  proficiencyBonus?: number;

  @ApiProperty({ example: ['Leather', 'Chainmail'] })
  @IsOptional()
  @IsString({ each: true })
  armors?: string[];

  @ApiProperty({ example: ["Thieves' Tools", "Smith's Tools"] })
  @IsOptional()
  @IsString({ each: true })
  tools?: string[];

  @ApiProperty({ example: ['Shortsword', 'Longbow'] })
  @IsOptional()
  @IsString({ each: true })
  weapons?: string[];

  @ApiProperty({ type: MasteryDto })
  @ValidateNested()
  @Type(() => MasteryDto)
  masteries?: MasteryDto;

  @ApiProperty({ type: MasteriesAbilityDto })
  @ValidateNested()
  @IsOptional()
  @Type(() => MasteriesAbilityDto)
  masteriesAbility?: MasteriesAbilityDto;
}
