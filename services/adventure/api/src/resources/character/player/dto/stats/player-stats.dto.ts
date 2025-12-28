import { IsNumber, IsOptional, ValidateNested } from 'class-validator';
import { StatsDto } from '@/resources/character/core/dto/stats/stats.dto';
import { Type } from 'class-transformer';
import { MasteryDto } from '@/resources/character/player/dto/stats/player-masteries.dto';
import { MasteriesAbilityDto } from '@/resources/character/player/dto/stats/player-masteriesAbility.dto';

export class PlayerStatsDto extends StatsDto {
  @IsOptional()
  @IsNumber()
  proficiencyBonus?: number;

  @ValidateNested()
  @IsOptional()
  @Type(() => MasteryDto)
  masteries?: MasteryDto;

  @ValidateNested()
  @IsOptional()
  @Type(() => MasteriesAbilityDto)
  masteriesAbility?: MasteriesAbilityDto;
}
