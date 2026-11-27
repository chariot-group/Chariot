import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { ApiProperty } from '@nestjs/swagger';
import mongoose from 'mongoose';
import {
  BUILDER_MODES,
  BuilderMode,
} from '@/resources/ruleset/constants/ruleset.constant';
import {
  TranslatedLabel,
  TranslatedLabelSchema,
} from '@/resources/ruleset/schemas/sub/translated-label.schema';
import {
  BuilderField,
  BuilderFieldSchema,
} from '@/resources/ruleset/schemas/sub/builder-field.schema';

/** Repeats a step once per integer in [from, to]; the index is `repeat.index`. */
@Schema({ _id: false })
export class StepRepeat {
  @ApiProperty({ example: 2, description: 'JSON Logic or number' })
  @Prop({ type: mongoose.Schema.Types.Mixed, required: true })
  from: unknown;

  @ApiProperty({ example: { var: 'targetLevel' }, description: 'JSON Logic' })
  @Prop({ type: mongoose.Schema.Types.Mixed, required: true })
  to: unknown;
}

export const StepRepeatSchema = SchemaFactory.createForClass(StepRepeat);

/** Card grouping fields of a step under one title. @see FR-ruleset-character-builder — Flow */
@Schema({ _id: false })
export class StepCard {
  @ApiProperty({ example: 'identity' })
  @Prop({ required: true })
  id: string;

  @ApiProperty({ type: TranslatedLabel })
  @Prop({ type: TranslatedLabelSchema, required: true })
  title: TranslatedLabel;

  @ApiProperty({ type: TranslatedLabel, required: false })
  @Prop({ type: TranslatedLabelSchema })
  description?: TranslatedLabel;

  @ApiProperty({ example: ['firstname', 'lastname'] })
  @Prop({ type: [String], required: true })
  fields: string[];
}

export const StepCardSchema = SchemaFactory.createForClass(StepCard);

@Schema({ _id: false })
export class BuilderStep {
  @ApiProperty({ example: 'race' })
  @Prop({ required: true })
  id: string;

  @ApiProperty({ example: 1 })
  @Prop({ required: true })
  order: number;

  @ApiProperty({ type: TranslatedLabel })
  @Prop({ type: TranslatedLabelSchema, required: true })
  title: TranslatedLabel;

  @ApiProperty({ type: TranslatedLabel })
  @Prop({ type: TranslatedLabelSchema, required: true })
  breadcrumb: TranslatedLabel;

  @ApiProperty({ type: TranslatedLabel, required: false })
  @Prop({ type: TranslatedLabelSchema })
  description?: TranslatedLabel;

  @ApiProperty({ enum: BUILDER_MODES, isArray: true })
  @Prop({ type: [String], enum: BUILDER_MODES, required: true })
  modes: BuilderMode[];

  @ApiProperty({ required: false, description: 'JSON Logic' })
  @Prop({ type: mongoose.Schema.Types.Mixed })
  visibleWhen?: unknown;

  @ApiProperty({ type: StepRepeat, required: false })
  @Prop({ type: StepRepeatSchema })
  repeat?: StepRepeat;

  @ApiProperty({ type: [BuilderField] })
  @Prop({ type: [BuilderFieldSchema], default: [] })
  fields: BuilderField[];

  @ApiProperty({ type: [StepCard], required: false })
  @Prop({ type: [StepCardSchema], default: undefined })
  cards?: StepCard[];
}

export const BuilderStepSchema = SchemaFactory.createForClass(BuilderStep);
