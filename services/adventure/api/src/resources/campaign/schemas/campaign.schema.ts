import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose, { Document } from 'mongoose';
import { Groups } from '@/resources/campaign/schemas/sub/groups.schema';
import { BaseSchema } from '@/common/schemas/base-schema';

export type CampaignDocument = Campaign & Document;

@Schema({ timestamps: true })
export class Campaign extends BaseSchema {
  @Prop({ type: mongoose.Schema.Types.ObjectId, auto: true })
  _id: mongoose.Schema.Types.ObjectId;

  @Prop({ required: true })
  label: string;

  @Prop({ required: false })
  description: string;

  @Prop({ type: Groups, required: true })
  groups: Groups;

  @Prop({ default: null })
  deletedAt?: Date;
}

export const CampaignSchema = SchemaFactory.createForClass(Campaign);
