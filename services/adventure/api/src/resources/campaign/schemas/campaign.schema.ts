import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose, { Document } from 'mongoose';
import { Groups } from '@/resources/campaign/schemas/sub/groups.schema';
import { BaseSchema } from '@/common/schemas/base-schema';
import { ApiProperty } from '@nestjs/swagger';

export type CampaignDocument = Campaign & Document;

@Schema({ timestamps: true })
export class Campaign extends BaseSchema {
  @ApiProperty({ example: '507f1f77bcf86cd799439011' })
  @Prop({ type: mongoose.Schema.Types.ObjectId, auto: true })
  _id: mongoose.Schema.Types.ObjectId;

  @ApiProperty({ example: 'Summer Campaign' })
  @Prop({ required: true })
  label: string;

  @ApiProperty({ type: Groups })
  @Prop({ type: Groups, required: true })
  groups: Groups;

  @ApiProperty({ example: null })
  @Prop({ default: null })
  deletedAt?: Date;
}

export const CampaignSchema = SchemaFactory.createForClass(Campaign);
