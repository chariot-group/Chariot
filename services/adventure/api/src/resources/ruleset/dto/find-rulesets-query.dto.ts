import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsIn, IsOptional } from 'class-validator';
import {
  GAME_SYSTEMS,
  GameSystem,
} from '@/common/constants/game-system.constant';

export class FindRulesetsQueryDto {
  @ApiPropertyOptional({ enum: GAME_SYSTEMS, example: 'DND_5E' })
  @IsOptional()
  @IsIn(GAME_SYSTEMS)
  readonly gameSystem?: GameSystem;
}
