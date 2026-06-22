import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose, { Document, Types } from 'mongoose';
import { BaseSchema } from '@/common/schemas/base-schema';
import { ApiProperty } from '@nestjs/swagger';

export type QuickLinkDocument = QuickLink & Document;

@Schema({ timestamps: true })
export class QuickLink extends BaseSchema {
  @ApiProperty({ example: '507f1f77bcf86cd799439011' })
  @Prop({ type: mongoose.Schema.Types.ObjectId, auto: true })
  _id: Types.ObjectId;

  @ApiProperty({ example: 'Link' })
  @Prop({ required: true })
  icon: string;

  @ApiProperty({ example: 'https://example.com' })
  @Prop({ required: true })
  url: string;

  @ApiProperty({ example: 'Mon lien' })
  @Prop({ required: true })
  label: string;

  @ApiProperty({ example: '507f1f77bcf86cd799439011', nullable: true })
  @Prop({ type: mongoose.Schema.Types.ObjectId, default: null })
  campaignId: Types.ObjectId | null;

  @ApiProperty({ example: null })
  @Prop({ default: null })
  deletedAt?: Date;
}

export const QuickLinkSchema = SchemaFactory.createForClass(QuickLink);
