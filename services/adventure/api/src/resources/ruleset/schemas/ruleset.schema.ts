import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { ApiProperty } from '@nestjs/swagger';
import mongoose, { Document, Types } from 'mongoose';
import { BaseSchema } from '@/common/schemas/base-schema';
import {
  GAME_SYSTEMS,
  GameSystem,
} from '@/common/constants/game-system.constant';
import {
  RULESET_STATUSES,
  RulesetStatus,
} from '@/resources/ruleset/constants/ruleset.constant';
import {
  TranslatedLabel,
  TranslatedLabelSchema,
} from '@/resources/ruleset/schemas/sub/translated-label.schema';
import {
  BuilderStep,
  BuilderStepSchema,
} from '@/resources/ruleset/schemas/sub/builder-step.schema';
import {
  RulesetFormula,
  RulesetFormulaSchema,
  RulesetProjection,
  RulesetProjectionSchema,
} from '@/resources/ruleset/schemas/sub/formula.schema';
import {
  RulesetAttachment,
  RulesetAttachmentSchema,
  RulesetCollection,
  RulesetCollectionSchema,
  RulesetCounter,
  RulesetCounterSchema,
  RulesetLevel,
  RulesetLevelSchema,
} from '@/resources/ruleset/schemas/sub/declarations.schema';

export type RulesetDocument = Ruleset & Document;

@Schema({ _id: false })
export class RulesetFlow {
  @ApiProperty({ type: [BuilderStep] })
  @Prop({ type: [BuilderStepSchema], default: [] })
  steps: BuilderStep[];
}

export const RulesetFlowSchema = SchemaFactory.createForClass(RulesetFlow);

/** @see FR-ruleset-character-builder */
@Schema({ timestamps: true, collection: 'rulesets' })
export class Ruleset extends BaseSchema {
  @ApiProperty({ example: '507f1f77bcf86cd799439011' })
  @Prop({ type: mongoose.Schema.Types.ObjectId, auto: true })
  _id: Types.ObjectId;

  @ApiProperty({ example: 'dnd5e-2014' })
  @Prop({ required: true })
  key: string;

  @ApiProperty({ enum: GAME_SYSTEMS, example: 'DND_5E' })
  @Prop({ type: String, enum: GAME_SYSTEMS, required: true })
  gameSystem: GameSystem;

  @ApiProperty({ example: 1 })
  @Prop({ required: true, min: 1 })
  version: number;

  @ApiProperty({ enum: RULESET_STATUSES, example: 'draft' })
  @Prop({ type: String, enum: RULESET_STATUSES, default: 'draft' })
  status: RulesetStatus;

  @ApiProperty({ type: TranslatedLabel })
  @Prop({ type: TranslatedLabelSchema, required: true })
  name: TranslatedLabel;

  @ApiProperty({ type: TranslatedLabel, required: false })
  @Prop({ type: TranslatedLabelSchema })
  description?: TranslatedLabel;

  @ApiProperty({ type: RulesetFlow })
  @Prop({ type: RulesetFlowSchema, default: { steps: [] } })
  flow: RulesetFlow;

  @ApiProperty({ type: [RulesetFormula] })
  @Prop({ type: [RulesetFormulaSchema], default: [] })
  formulas: RulesetFormula[];

  @ApiProperty({ type: [RulesetProjection] })
  @Prop({ type: [RulesetProjectionSchema], default: [] })
  projection: RulesetProjection[];

  @ApiProperty({
    example: { experienceByLevel: [0, 300, 900] },
    description: 'Static data readable in expressions as `ruleset.data.*`',
  })
  @Prop({ type: mongoose.Schema.Types.Mixed, default: {} })
  data: Record<string, unknown>;

  @ApiProperty({ type: [RulesetLevel] })
  @Prop({ type: [RulesetLevelSchema], default: [] })
  levels: RulesetLevel[];

  @ApiProperty({ type: [RulesetAttachment] })
  @Prop({ type: [RulesetAttachmentSchema], default: [] })
  attachments: RulesetAttachment[];

  @ApiProperty({ type: [RulesetCounter] })
  @Prop({ type: [RulesetCounterSchema], default: [] })
  counters: RulesetCounter[];

  @ApiProperty({ type: [RulesetCollection] })
  @Prop({ type: [RulesetCollectionSchema], default: [] })
  collections: RulesetCollection[];

  @ApiProperty({ example: null, required: false })
  @Prop({ default: null })
  publishedAt?: Date;

  /** SHA-256 of the seed content, set by the seed import only. */
  @ApiProperty({ example: null, required: false })
  @Prop({ default: null })
  contentHash?: string | null;
}

export const RulesetSchema = SchemaFactory.createForClass(Ruleset);

RulesetSchema.index({ key: 1, version: 1 }, { unique: true });
// At most one published version per key.
RulesetSchema.index(
  { key: 1 },
  {
    unique: true,
    partialFilterExpression: { status: 'published' },
    name: 'key_published_unique',
  },
);
RulesetSchema.index({ gameSystem: 1, status: 1 });
