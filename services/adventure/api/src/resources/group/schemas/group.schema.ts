import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import mongoose from 'mongoose';
import { Campaign } from '@/resources/campaign/schemas/campaign.schema';
import { BaseSchema } from '@/common/schemas/base-schema';
import { Character } from '@/resources/character/core/schemas/character.schema';

export type GroupDocument = Group & Document;

@Schema({ timestamps: true })
export class Group extends BaseSchema {
  @Prop({ type: mongoose.Schema.Types.ObjectId, auto: true })
  _id: mongoose.Schema.Types.ObjectId;

  @Prop({ required: true })
  label: string;

  @Prop({ required: false })
  description: string;

  @Prop({
    type: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Character' }],
    default: [],
    required: true,
  })
  characters: Character[];

  @Prop({
    type: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Campaign' }],
    default: [],
    required: true,
  })
  campaigns: Campaign[];

  @Prop({ default: null })
  deletedAt?: Date;
}

export const GroupSchema = SchemaFactory.createForClass(Group);
