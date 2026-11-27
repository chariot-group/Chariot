import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsIn, IsMongoId, IsOptional } from 'class-validator';
import {
  GAME_SYSTEMS,
  GameSystem,
} from '@/common/constants/game-system.constant';

/** @see FR-game-system — Ruleset reference */
export class ResolveRulesetQueryDto {
  @ApiPropertyOptional({ example: '507f1f77bcf86cd799439011' })
  @IsOptional()
  @IsMongoId()
  readonly rulesetId?: string;

  @ApiPropertyOptional({ enum: GAME_SYSTEMS, example: 'DND_5E' })
  @IsOptional()
  @IsIn(GAME_SYSTEMS)
  readonly gameSystem?: GameSystem;
}
