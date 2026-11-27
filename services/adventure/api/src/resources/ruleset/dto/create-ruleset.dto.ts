import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsArray,
  IsIn,
  IsObject,
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
  RulesetAttachmentDto,
  RulesetCollectionDto,
  RulesetCounterDto,
  RulesetFlowDto,
  RulesetLevelDto,
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

  @ApiPropertyOptional({
    example: { experienceByLevel: [0, 300, 900] },
    description: 'Static data readable in expressions as `ruleset.data.*`',
  })
  @IsOptional()
  @IsObject()
  readonly data?: Record<string, unknown>;

  @ApiPropertyOptional({ type: [RulesetLevelDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => RulesetLevelDto)
  readonly levels?: RulesetLevelDto[];

  @ApiPropertyOptional({ type: [RulesetAttachmentDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => RulesetAttachmentDto)
  readonly attachments?: RulesetAttachmentDto[];

  @ApiPropertyOptional({ type: [RulesetCounterDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => RulesetCounterDto)
  readonly counters?: RulesetCounterDto[];

  @ApiPropertyOptional({ type: [RulesetCollectionDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => RulesetCollectionDto)
  readonly collections?: RulesetCollectionDto[];
}
