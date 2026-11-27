import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { ApiProperty } from '@nestjs/swagger';
import mongoose, { Document, Types } from 'mongoose';
import { BaseSchema } from '@/common/schemas/base-schema';
import {
  TranslatedLabel,
  TranslatedLabelSchema,
} from '@/resources/ruleset/schemas/sub/translated-label.schema';
import {
  EntryEffect,
  EntryEffectSchema,
  EntryGrant,
  EntryGrantSchema,
} from '@/resources/ruleset/schemas/sub/entry-effect.schema';

export type RulesetEntryDocument = RulesetEntry & Document;

/** Catalog item of a ruleset (race, class, feature, spell, …). @see FR-ruleset-character-builder */
@Schema({ timestamps: true, collection: 'ruleset_entries' })
export class RulesetEntry extends BaseSchema {
  @ApiProperty({ example: '507f1f77bcf86cd799439011' })
  @Prop({ type: mongoose.Schema.Types.ObjectId, auto: true })
  _id: Types.ObjectId;

  @ApiProperty({ example: '507f1f77bcf86cd799439011' })
  @Prop({
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Ruleset',
    required: true,
  })
  rulesetId: Types.ObjectId;

  @ApiProperty({ example: 'race' })
  @Prop({ required: true })
  type: string;

  @ApiProperty({ example: 'elf' })
  @Prop({ required: true })
  key: string;

  @ApiProperty({ example: null, required: false })
  @Prop({ default: null })
  parentKey?: string | null;

  @ApiProperty({ type: TranslatedLabel })
  @Prop({ type: TranslatedLabelSchema, required: true })
  label: TranslatedLabel;

  @ApiProperty({ type: TranslatedLabel, required: false })
  @Prop({ type: TranslatedLabelSchema })
  description?: TranslatedLabel;

  @ApiProperty({ example: null, required: false })
  @Prop({ default: null })
  level?: number | null;

  @ApiProperty({ example: ['srd'] })
  @Prop({ type: [String], default: [] })
  tags: string[];

  @ApiProperty({
    example: { size: 'Medium' },
    description: 'System-specific data',
  })
  @Prop({ type: mongoose.Schema.Types.Mixed, default: {} })
  data: Record<string, unknown>;

  @ApiProperty({
    example: { multiclassAllowed: { '>=': [{ var: 'strength' }, 13] } },
    description:
      'Named JSON Logic expressions evaluated with `self` = the entry',
  })
  @Prop({ type: mongoose.Schema.Types.Mixed, default: {} })
  values: Record<string, unknown>;

  @ApiProperty({ type: [EntryEffect] })
  @Prop({ type: [EntryEffectSchema], default: [] })
  effects: EntryEffect[];

  @ApiProperty({ type: [EntryGrant] })
  @Prop({ type: [EntryGrantSchema], default: [] })
  grants: EntryGrant[];
}

export const RulesetEntrySchema = SchemaFactory.createForClass(RulesetEntry);

RulesetEntrySchema.index({ rulesetId: 1, type: 1, key: 1 }, { unique: true });
RulesetEntrySchema.index({ rulesetId: 1, type: 1, parentKey: 1 });
