import { CreateCharacterDto } from '@/resources/character/core/dto/create-character.dto';
import { Type } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsOptional,
  ValidateNested,
} from 'class-validator';
import { ProgressionDto } from '@/resources/character/player/dto/progression/progression.dto';
import { ClassDto } from '@/resources/character/player/dto/class/class.dto';
import { PlayerProfileDto } from '@/resources/character/player/dto/profile/player-profile.dto';
import { PlayerStatsDto } from '@/resources/character/player/dto/stats/player-stats.dto';
import { ApiProperty } from '@nestjs/swagger';

export class CreatePlayerDto extends CreateCharacterDto {

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
}
