import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { ApiProperty } from '@nestjs/swagger';
import mongoose from 'mongoose';
import {
  ABILITY_ALLOCATION_METHODS,
  AbilityAllocationMethod,
  FIELD_TYPES,
  FieldType,
} from '@/resources/ruleset/constants/ruleset.constant';
import {
  TranslatedLabel,
  TranslatedLabelSchema,
} from '@/resources/ruleset/schemas/sub/translated-label.schema';

@Schema({ _id: false })
export class EntrySource {
  @ApiProperty({ example: 'race', description: 'Entry type to choose from' })
  @Prop({ required: true })
  type: string;

  @ApiProperty({ example: 'elf', required: false })
  @Prop()
  parentKey?: string;
}

export const EntrySourceSchema = SchemaFactory.createForClass(EntrySource);

/** spellSelect: Codex search filters computed by the ruleset (manual entry always allowed). */
@Schema({ _id: false })
export class SpellFilter {
  @ApiProperty({
    required: false,
    example: { var: 'class' },
    description: 'JSON Logic: class key whose spell list is searched',
  })
  @Prop({ type: mongoose.Schema.Types.Mixed })
  className?: unknown;

  @ApiProperty({
    required: false,
    example: 0,
    description: 'JSON Logic or number',
  })
  @Prop({ type: mongoose.Schema.Types.Mixed })
  minLevel?: unknown;

  @ApiProperty({
    required: false,
    example: 1,
    description: 'JSON Logic or number',
  })
  @Prop({ type: mongoose.Schema.Types.Mixed })
  maxLevel?: unknown;
}

export const SpellFilterSchema = SchemaFactory.createForClass(SpellFilter);

@Schema({ _id: false })
export class BuilderField {
  @ApiProperty({ example: 'race' })
  @Prop({ required: true })
  id: string;

  @ApiProperty({ enum: FIELD_TYPES, example: 'entitySelect' })
  @Prop({ type: String, enum: FIELD_TYPES, required: true })
  type: FieldType;

  @ApiProperty({ type: TranslatedLabel })
  @Prop({ type: TranslatedLabelSchema, required: true })
  label: TranslatedLabel;

  @ApiProperty({ type: TranslatedLabel, required: false })
  @Prop({ type: TranslatedLabelSchema })
  help?: TranslatedLabel;

  @ApiProperty({ type: EntrySource, required: false })
  @Prop({ type: EntrySourceSchema })
  source?: EntrySource;

  @ApiProperty({
    required: false,
    description: 'Number of choices (JSON Logic or number), multiSelect only',
  })
  @Prop({ type: mongoose.Schema.Types.Mixed })
  count?: unknown;

  @ApiProperty({
    required: false,
    example: 'race',
    description: 'grantedChoices: id of the select field whose grants to show',
  })
  @Prop()
  from?: string;

  @ApiProperty({
    enum: ABILITY_ALLOCATION_METHODS,
    isArray: true,
    required: false,
  })
  @Prop({
    type: [String],
    enum: ABILITY_ALLOCATION_METHODS,
    default: undefined,
  })
  methods?: AbilityAllocationMethod[];

  @ApiProperty({ type: SpellFilter, required: false })
  @Prop({ type: SpellFilterSchema })
  spellFilter?: SpellFilter;

  @ApiProperty({
    required: false,
    example: false,
    description:
      'When true, the suggested value cannot be changed by the player',
  })
  @Prop({ default: undefined })
  locked?: boolean;

  @ApiProperty({ required: false, description: 'computed: JSON Logic formula' })
  @Prop({ type: mongoose.Schema.Types.Mixed })
  formula?: unknown;

  @ApiProperty({ required: false, description: 'JSON Logic' })
  @Prop({ type: mongoose.Schema.Types.Mixed })
  visibleWhen?: unknown;

  @ApiProperty({ required: false, description: 'JSON Logic' })
  @Prop({ type: mongoose.Schema.Types.Mixed })
  requiredWhen?: unknown;

  @ApiProperty({ required: false, description: 'JSON Logic' })
  @Prop({ type: mongoose.Schema.Types.Mixed })
  default?: unknown;

  @ApiProperty({ required: false, description: 'JSON Logic' })
  @Prop({ type: mongoose.Schema.Types.Mixed })
  optionsFilter?: unknown;

  @ApiProperty({ required: false, description: 'JSON Logic' })
  @Prop({ type: mongoose.Schema.Types.Mixed })
  validation?: unknown;

  @ApiProperty({
    required: false,
    description: 'Type-specific parameters (e.g. point-buy budget)',
  })
  @Prop({ type: mongoose.Schema.Types.Mixed })
  config?: Record<string, unknown>;
}

export const BuilderFieldSchema = SchemaFactory.createForClass(BuilderField);
