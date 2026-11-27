import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { ApiProperty } from '@nestjs/swagger';
import mongoose from 'mongoose';
import {
  TranslatedLabel,
  TranslatedLabelSchema,
} from '@/resources/ruleset/schemas/sub/translated-label.schema';
import {
  EFFECT_OPS,
  EffectOp,
  GRANT_KINDS,
  GrantKind,
} from '@/resources/ruleset/constants/ruleset.constant';

@Schema({ _id: false })
export class EntryEffect {
  @ApiProperty({ enum: EFFECT_OPS, example: 'add' })
  @Prop({ type: String, enum: EFFECT_OPS, required: true })
  op: EffectOp;

  @ApiProperty({ example: 'abilities.dex', description: 'Builder state path' })
  @Prop({ required: true })
  target: string;

  @ApiProperty({ example: 2 })
  @Prop({ type: mongoose.Schema.Types.Mixed })
  value?: unknown;

  @ApiProperty({ required: false, description: 'JSON Logic' })
  @Prop({ type: mongoose.Schema.Types.Mixed })
  when?: unknown;
}

export const EntryEffectSchema = SchemaFactory.createForClass(EntryEffect);

@Schema({ _id: false })
export class GrantSource {
  @ApiProperty({ example: 'subrace' })
  @Prop({ required: true })
  type: string;

  @ApiProperty({ example: 'elf', required: false })
  @Prop()
  parentKey?: string;

  @ApiProperty({ example: ['athletics', 'perception'], required: false })
  @Prop({ type: [String], default: undefined })
  keys?: string[];
}

export const GrantSourceSchema = SchemaFactory.createForClass(GrantSource);

@Schema({ _id: false })
export class EntryGrant {
  @ApiProperty({ example: 'elf-subrace' })
  @Prop({ required: true })
  id: string;

  @ApiProperty({ enum: GRANT_KINDS, example: 'choose' })
  @Prop({ type: String, enum: GRANT_KINDS, required: true })
  kind: GrantKind;

  @ApiProperty({ type: GrantSource })
  @Prop({ type: GrantSourceSchema, required: true })
  from: GrantSource;

  @ApiProperty({ example: 1, description: 'JSON Logic or number' })
  @Prop({ type: mongoose.Schema.Types.Mixed, required: true })
  count: unknown;

  @ApiProperty({ type: TranslatedLabel, required: false })
  @Prop({ type: TranslatedLabelSchema })
  label?: TranslatedLabel;

  @ApiProperty({
    type: TranslatedLabel,
    required: false,
    description: 'What the choice is and what it implies',
  })
  @Prop({ type: TranslatedLabelSchema })
  description?: TranslatedLabel;

  @ApiProperty({
    required: false,
    description: 'Suggested option keys, or JSON Logic giving them',
  })
  @Prop({ type: mongoose.Schema.Types.Mixed })
  default?: unknown;

  @ApiProperty({ example: 1, required: false })
  @Prop()
  level?: number;

  @ApiProperty({ required: false, description: 'JSON Logic' })
  @Prop({ type: mongoose.Schema.Types.Mixed })
  when?: unknown;

  @ApiProperty({
    type: [EntryEffect],
    required: false,
    description:
      'Applied once per chosen option; "{key}" in target or string values is replaced by the option key',
  })
  @Prop({ type: [EntryEffectSchema], default: undefined })
  effects?: EntryEffect[];
}

export const EntryGrantSchema = SchemaFactory.createForClass(EntryGrant);
