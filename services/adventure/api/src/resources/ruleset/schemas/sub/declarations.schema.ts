import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { ApiProperty } from '@nestjs/swagger';
import mongoose from 'mongoose';

/** Declarative primitives of the builder engine. @see FR-ruleset-character-builder — Declarative primitives */

@Schema({ _id: false })
export class RulesetLevel {
  @ApiProperty({ example: 'class' })
  @Prop({ required: true })
  type: string;

  @ApiProperty({ description: 'JSON Logic, `self` = the entry' })
  @Prop({ type: mongoose.Schema.Types.Mixed, required: true })
  expression: unknown;
}

export const RulesetLevelSchema = SchemaFactory.createForClass(RulesetLevel);

@Schema({ _id: false })
export class RulesetAttachment {
  @ApiProperty({ example: 'class-feature' })
  @Prop({ required: true })
  childType: string;

  @ApiProperty({ example: 'class' })
  @Prop({ required: true })
  parentType: string;

  @ApiProperty({
    required: false,
    description: 'JSON Logic, `self` = the child',
  })
  @Prop({ type: mongoose.Schema.Types.Mixed })
  when?: unknown;
}

export const RulesetAttachmentSchema =
  SchemaFactory.createForClass(RulesetAttachment);

@Schema({ _id: false })
export class RulesetCounter {
  @ApiProperty({ example: 'classes' })
  @Prop({ required: true })
  id: string;

  @ApiProperty({ example: ['class', 'levelClass'] })
  @Prop({ type: [String], required: true })
  fields: string[];
}

export const RulesetCounterSchema =
  SchemaFactory.createForClass(RulesetCounter);

@Schema({ _id: false })
export class CollectionSource {
  @ApiProperty({ example: ['class-feature'], required: false })
  @Prop({ type: [String], default: undefined })
  types?: string[];

  @ApiProperty({ example: 'equipment', required: false })
  @Prop()
  path?: string;
}

export const CollectionSourceSchema =
  SchemaFactory.createForClass(CollectionSource);

@Schema({ _id: false })
export class RulesetCollection {
  @ApiProperty({ example: 'sheetAbilities' })
  @Prop({ required: true })
  id: string;

  @ApiProperty({ type: CollectionSource })
  @Prop({ type: CollectionSourceSchema, required: true })
  from: CollectionSource;

  @ApiProperty({
    required: false,
    description: 'JSON Logic, `item` = the element',
  })
  @Prop({ type: mongoose.Schema.Types.Mixed })
  where?: unknown;

  @ApiProperty({ required: false, description: 'JSON Logic sort key' })
  @Prop({ type: mongoose.Schema.Types.Mixed })
  sort?: unknown;

  @ApiProperty({ description: 'Dotted target path → JSON Logic' })
  @Prop({ type: mongoose.Schema.Types.Mixed, required: true })
  item: Record<string, unknown>;
}

export const RulesetCollectionSchema =
  SchemaFactory.createForClass(RulesetCollection);
