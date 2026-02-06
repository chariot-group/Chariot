import { CreateCharacterDto } from '@/resources/character/core/dto/create-character.dto';
import { Type } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsInt,
  IsOptional,
  Max,
  Min,
  ValidateNested,
} from 'class-validator';
import { ProgressionDto } from '@/resources/character/player/dto/progression/progression.dto';
import { ClassDto } from '@/resources/character/player/dto/class/class.dto';
import { PlayerProfileDto } from '@/resources/character/player/dto/profile/player-profile.dto';
import { PlayerStatsDto } from '@/resources/character/player/dto/stats/player-stats.dto';
import { DeathSavesDto } from '@/resources/character/player/dto/stats/death-saves.dto';
import { ActionDto } from '@/resources/character/core/dto/actions/action.dto';
import { ApiProperty } from '@nestjs/swagger';

export class CreatePlayerDto extends CreateCharacterDto {

  @ApiProperty({ type: [ActionDto] })
  @ValidateNested({ each: true })
  @IsArray()
  @IsOptional()
  @Type(() => ActionDto)
  actions: ActionDto[];

  @ApiProperty({ example: false })
  @IsOptional()
  @IsBoolean()
  inspiration: boolean;

  @ApiProperty({ type: ProgressionDto })
  @ValidateNested()
  @IsOptional()
  @Type(() => ProgressionDto)
  progression: ProgressionDto;

  @ApiProperty({ type: [ClassDto] })
  @ValidateNested({ each: true })
  @IsArray()
  @IsOptional()
  @Type(() => ClassDto)
  class: ClassDto[];

  @ApiProperty({ type: PlayerProfileDto })
  @ValidateNested()
  @IsOptional()
  @Type(() => PlayerProfileDto)
  profile: PlayerProfileDto;

  @ApiProperty({ type: PlayerStatsDto })
  @ValidateNested()
  @IsOptional()
  @Type(() => PlayerStatsDto)
  stats: PlayerStatsDto;

  @ApiProperty({
    example: 0,
    description: 'Exhaustion level (0-6): 0=None, 1=Disadvantage on ability checks, 2=Speed halved, 3=Disadvantage on attack rolls and saving throws, 4=Hit point maximum halved, 5=Speed reduced to 0, 6=Death',
    minimum: 0,
    maximum: 6,
    required: false
  })
  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(6)
  exhaustionLevel?: number;

  @ApiProperty({ type: DeathSavesDto })
  @ValidateNested()
  @IsOptional()
  @Type(() => DeathSavesDto)
  deathSaves?: DeathSavesDto;
}
