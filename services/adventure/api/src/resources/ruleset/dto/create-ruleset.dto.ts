import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsArray,
  IsIn,
  IsOptional,
  Matches,
  ValidateNested,
} from 'class-validator';
import {
  GAME_SYSTEMS,
  GameSystem,
} from '@/common/constants/game-system.constant';
import { KEBAB_CASE_PATTERN } from '@/resources/ruleset/constants/ruleset.constant';
import { TranslatedLabel } from '@/resources/ruleset/schemas/sub/translated-label.schema';
import { IsTranslatedLabel } from '@/resources/ruleset/validation/validators.decorator';
import {
  RulesetFlowDto,
  RulesetFormulaDto,
  RulesetProjectionDto,
} from '@/resources/ruleset/dto/builder.dto';

/** Creates version 1 of a new ruleset key, as a draft. @see FR-ruleset-character-builder */
export class CreateRulesetDto {
  @ApiProperty({ example: 'dnd5e-2014' })
  @Matches(KEBAB_CASE_PATTERN, { message: 'key must be kebab-case' })
  readonly key: string;

  @ApiProperty({ enum: GAME_SYSTEMS, example: 'DND_5E' })
  @IsIn(GAME_SYSTEMS)
  readonly gameSystem: GameSystem;

  @ApiProperty({ type: TranslatedLabel })
  @IsTranslatedLabel()
  readonly name: TranslatedLabel;

  @ApiPropertyOptional({ type: TranslatedLabel })
  @IsOptional()
  @IsTranslatedLabel()
  readonly description?: TranslatedLabel;

  @ApiPropertyOptional({ type: RulesetFlowDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => RulesetFlowDto)
  readonly flow?: RulesetFlowDto;

  @ApiPropertyOptional({ type: [RulesetFormulaDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => RulesetFormulaDto)
  readonly formulas?: RulesetFormulaDto[];

  @ApiPropertyOptional({ type: [RulesetProjectionDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => RulesetProjectionDto)
  readonly projection?: RulesetProjectionDto[];
}
