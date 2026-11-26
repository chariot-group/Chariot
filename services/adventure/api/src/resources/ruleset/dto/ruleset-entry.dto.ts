import {
  ApiProperty,
  ApiPropertyOptional,
  OmitType,
  PartialType,
} from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import {
  IsArray,
  IsIn,
  IsInt,
  IsObject,
  IsOptional,
  IsString,
  IsNotEmpty,
  Matches,
  Min,
  ValidateNested,
} from 'class-validator';
import {
  EFFECT_OPS,
  EffectOp,
  GRANT_KINDS,
  GrantKind,
  IDENTIFIER_PATTERN,
  KEBAB_CASE_PATTERN,
} from '@/resources/ruleset/constants/ruleset.constant';
import { TranslatedLabel } from '@/resources/ruleset/schemas/sub/translated-label.schema';
import {
  IsJsonLogic,
  IsTranslatedLabel,
} from '@/resources/ruleset/validation/validators.decorator';
import { Pagination } from '@/common/dtos/pagination.dto';

/** @see FR-ruleset-character-builder — ruleset_entries collection */

export class EntryEffectDto {
  @ApiProperty({ enum: EFFECT_OPS })
  @IsIn(EFFECT_OPS)
  readonly op: EffectOp;

  @ApiProperty({ example: 'abilities.dex' })
  @IsString()
  @IsNotEmpty()
  readonly target: string;

  @ApiPropertyOptional({ example: 2 })
  @IsOptional()
  readonly value?: unknown;

  @ApiPropertyOptional({ description: 'JSON Logic' })
  @IsOptional()
  @IsJsonLogic()
  readonly when?: unknown;
}

export class GrantSourceDto {
  @ApiProperty({ example: 'subrace' })
  @Matches(KEBAB_CASE_PATTERN)
  readonly type: string;

  @ApiPropertyOptional({ example: 'elf' })
  @IsOptional()
  @Matches(KEBAB_CASE_PATTERN)
  readonly parentKey?: string;

  @ApiPropertyOptional({ example: ['athletics'] })
  @IsOptional()
  @IsArray()
  @Matches(KEBAB_CASE_PATTERN, { each: true })
  readonly keys?: string[];
}

export class EntryGrantDto {
  @ApiProperty({ example: 'elf-subrace' })
  @Matches(IDENTIFIER_PATTERN)
  readonly id: string;

  @ApiProperty({ enum: GRANT_KINDS })
  @IsIn(GRANT_KINDS)
  readonly kind: GrantKind;

  @ApiProperty({ type: GrantSourceDto })
  @ValidateNested()
  @Type(() => GrantSourceDto)
  readonly from: GrantSourceDto;

  @ApiProperty({ example: 1, description: 'JSON Logic or number' })
  @IsJsonLogic()
  readonly count: unknown;

  @ApiPropertyOptional({ example: 1 })
  @IsOptional()
  @IsInt()
  @Min(1)
  readonly level?: number;

  @ApiPropertyOptional({ description: 'JSON Logic' })
  @IsOptional()
  @IsJsonLogic()
  readonly when?: unknown;

  @ApiPropertyOptional({
    type: () => [EntryEffectDto],
    description: 'Applied per chosen option ("{key}" placeholder)',
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => EntryEffectDto)
  readonly effects?: EntryEffectDto[];
}

export class CreateRulesetEntryDto {
  @ApiProperty({ example: 'race' })
  @Matches(KEBAB_CASE_PATTERN, { message: 'type must be kebab-case' })
  readonly type: string;

  @ApiProperty({ example: 'elf' })
  @Matches(KEBAB_CASE_PATTERN, { message: 'key must be kebab-case' })
  readonly key: string;

  @ApiPropertyOptional({ example: null })
  @IsOptional()
  @Matches(KEBAB_CASE_PATTERN)
  readonly parentKey?: string;

  @ApiProperty({ type: TranslatedLabel })
  @IsTranslatedLabel()
  readonly label: TranslatedLabel;

  @ApiPropertyOptional({ type: TranslatedLabel })
  @IsOptional()
  @IsTranslatedLabel()
  readonly description?: TranslatedLabel;

  @ApiPropertyOptional({ example: 3 })
  @IsOptional()
  @IsInt()
  @Min(0)
  readonly level?: number;

  @ApiPropertyOptional({ example: ['srd'] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  readonly tags?: string[];

  @ApiPropertyOptional({ example: { size: 'Medium' } })
  @IsOptional()
  @IsObject()
  readonly data?: Record<string, unknown>;

  @ApiPropertyOptional({ type: [EntryEffectDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => EntryEffectDto)
  readonly effects?: EntryEffectDto[];

  @ApiPropertyOptional({ type: [EntryGrantDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => EntryGrantDto)
  readonly grants?: EntryGrantDto[];
}

/** type and key identify the entry and are not editable. */
export class UpdateRulesetEntryDto extends PartialType(
  OmitType(CreateRulesetEntryDto, ['type', 'key'] as const),
) {}

export class FindRulesetEntriesQueryDto extends Pagination {
  @ApiPropertyOptional({ example: 'subrace' })
  @IsOptional()
  @Matches(KEBAB_CASE_PATTERN)
  readonly type?: string;

  @ApiPropertyOptional({ example: 'elf' })
  @IsOptional()
  @Matches(KEBAB_CASE_PATTERN)
  readonly parentKey?: string;

  @ApiPropertyOptional({ example: 3 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  readonly level?: number;

  @ApiPropertyOptional({
    example: 'srd,core',
    description: 'Comma-separated; entries must have all tags',
  })
  @IsOptional()
  @Transform(({ value }) =>
    (Array.isArray(value) ? value : String(value).split(','))
      .map((tag: string) => tag.trim())
      .filter(Boolean),
  )
  @IsArray()
  @IsString({ each: true })
  readonly tags?: string[];
}
