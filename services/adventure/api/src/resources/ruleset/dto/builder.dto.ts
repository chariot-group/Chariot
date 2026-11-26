import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ArrayNotEmpty,
  IsArray,
  IsBoolean,
  IsIn,
  IsInt,
  IsNotEmpty,
  IsObject,
  IsOptional,
  IsString,
  Matches,
  ValidateNested,
} from 'class-validator';
import {
  ABILITY_ALLOCATION_METHODS,
  AbilityAllocationMethod,
  BUILDER_MODES,
  BuilderMode,
  FIELD_TYPES,
  FieldType,
  IDENTIFIER_PATTERN,
  KEBAB_CASE_PATTERN,
} from '@/resources/ruleset/constants/ruleset.constant';
import { TranslatedLabel } from '@/resources/ruleset/schemas/sub/translated-label.schema';
import {
  IsJsonLogic,
  IsTranslatedLabel,
} from '@/resources/ruleset/validation/validators.decorator';

/** @see FR-ruleset-character-builder — rulesets collection */

export class EntrySourceDto {
  @ApiProperty({ example: 'race' })
  @Matches(KEBAB_CASE_PATTERN)
  readonly type: string;

  @ApiPropertyOptional({ example: 'elf' })
  @IsOptional()
  @Matches(KEBAB_CASE_PATTERN)
  readonly parentKey?: string;
}

export class SpellFilterDto {
  @ApiPropertyOptional({ description: 'JSON Logic' })
  @IsOptional()
  @IsJsonLogic()
  readonly className?: unknown;

  @ApiPropertyOptional({ description: 'JSON Logic or number' })
  @IsOptional()
  @IsJsonLogic()
  readonly minLevel?: unknown;

  @ApiPropertyOptional({ description: 'JSON Logic or number' })
  @IsOptional()
  @IsJsonLogic()
  readonly maxLevel?: unknown;
}

export class BuilderFieldDto {
  @ApiProperty({ example: 'race' })
  @Matches(IDENTIFIER_PATTERN)
  readonly id: string;

  @ApiProperty({ enum: FIELD_TYPES })
  @IsIn(FIELD_TYPES)
  readonly type: FieldType;

  @ApiProperty({ type: TranslatedLabel })
  @IsTranslatedLabel()
  readonly label: TranslatedLabel;

  @ApiPropertyOptional({ type: TranslatedLabel })
  @IsOptional()
  @IsTranslatedLabel()
  readonly help?: TranslatedLabel;

  @ApiPropertyOptional({ type: EntrySourceDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => EntrySourceDto)
  readonly source?: EntrySourceDto;

  @ApiPropertyOptional({ description: 'JSON Logic or number' })
  @IsOptional()
  @IsJsonLogic()
  readonly count?: unknown;

  @ApiPropertyOptional({ example: 'race' })
  @IsOptional()
  @Matches(IDENTIFIER_PATTERN)
  readonly from?: string;

  @ApiPropertyOptional({ enum: ABILITY_ALLOCATION_METHODS, isArray: true })
  @IsOptional()
  @IsArray()
  @IsIn(ABILITY_ALLOCATION_METHODS, { each: true })
  readonly methods?: AbilityAllocationMethod[];

  @ApiPropertyOptional({ type: SpellFilterDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => SpellFilterDto)
  readonly spellFilter?: SpellFilterDto;

  @ApiPropertyOptional({ example: false })
  @IsOptional()
  @IsBoolean()
  readonly locked?: boolean;

  @ApiPropertyOptional({ description: 'JSON Logic' })
  @IsOptional()
  @IsJsonLogic()
  readonly formula?: unknown;

  @ApiPropertyOptional({ description: 'JSON Logic' })
  @IsOptional()
  @IsJsonLogic()
  readonly visibleWhen?: unknown;

  @ApiPropertyOptional({ description: 'JSON Logic' })
  @IsOptional()
  @IsJsonLogic()
  readonly requiredWhen?: unknown;

  @ApiPropertyOptional({ description: 'JSON Logic' })
  @IsOptional()
  @IsJsonLogic()
  readonly default?: unknown;

  @ApiPropertyOptional({ description: 'JSON Logic' })
  @IsOptional()
  @IsJsonLogic()
  readonly optionsFilter?: unknown;

  @ApiPropertyOptional({ description: 'JSON Logic' })
  @IsOptional()
  @IsJsonLogic()
  readonly validation?: unknown;

  @ApiPropertyOptional({ description: 'Type-specific parameters' })
  @IsOptional()
  @IsObject()
  readonly config?: Record<string, unknown>;
}

export class StepRepeatDto {
  @ApiProperty({ description: 'JSON Logic or number' })
  @IsJsonLogic()
  readonly from: unknown;

  @ApiProperty({ description: 'JSON Logic or number' })
  @IsJsonLogic()
  readonly to: unknown;
}

export class BuilderStepDto {
  @ApiProperty({ example: 'race' })
  @Matches(IDENTIFIER_PATTERN)
  readonly id: string;

  @ApiProperty({ example: 1 })
  @IsInt()
  readonly order: number;

  @ApiProperty({ type: TranslatedLabel })
  @IsTranslatedLabel()
  readonly title: TranslatedLabel;

  @ApiProperty({ type: TranslatedLabel })
  @IsTranslatedLabel()
  readonly breadcrumb: TranslatedLabel;

  @ApiPropertyOptional({ type: TranslatedLabel })
  @IsOptional()
  @IsTranslatedLabel()
  readonly description?: TranslatedLabel;

  @ApiProperty({ enum: BUILDER_MODES, isArray: true })
  @IsArray()
  @ArrayNotEmpty()
  @IsIn(BUILDER_MODES, { each: true })
  readonly modes: BuilderMode[];

  @ApiPropertyOptional({ description: 'JSON Logic' })
  @IsOptional()
  @IsJsonLogic()
  readonly visibleWhen?: unknown;

  @ApiPropertyOptional({ type: StepRepeatDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => StepRepeatDto)
  readonly repeat?: StepRepeatDto;

  @ApiProperty({ type: [BuilderFieldDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => BuilderFieldDto)
  readonly fields: BuilderFieldDto[];
}

export class RulesetFlowDto {
  @ApiProperty({ type: [BuilderStepDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => BuilderStepDto)
  readonly steps: BuilderStepDto[];
}

export class RulesetFormulaDto {
  @ApiProperty({ example: 'dexModifier' })
  @Matches(IDENTIFIER_PATTERN)
  readonly id: string;

  @ApiProperty({ description: 'JSON Logic' })
  @IsJsonLogic()
  readonly expression: unknown;
}

export class RulesetProjectionDto {
  @ApiProperty({ description: 'JSON Logic' })
  @IsJsonLogic()
  readonly source: unknown;

  @ApiProperty({ example: 'stats.abilityScores.dex' })
  @IsString()
  @IsNotEmpty()
  readonly target: string;
}
