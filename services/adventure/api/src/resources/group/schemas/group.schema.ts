import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import mongoose from 'mongoose';
import { Campaign } from '@/resources/campaign/schemas/campaign.schema';
import { BaseSchema } from '@/common/schemas/base-schema';
import { Character } from '@/resources/character/core/schemas/character.schema';
import { ApiProperty } from '@nestjs/swagger';

export type GroupDocument = Group & Document;

@Schema({ timestamps: true })
export class Group extends BaseSchema {

  @ApiProperty({ example: '507f1f77bcf86cd799439011' })
  @Prop({ type: mongoose.Schema.Types.ObjectId, auto: true })
  _id: mongoose.Schema.Types.ObjectId;

  @ApiProperty({ example: 'Adventurers' })
  @Prop({ required: true })
  label: string;

  @ApiProperty({ example: 'A group of brave adventurers.' })
  @Prop({ required: false })
  description: string;

  @ApiProperty({ example: ['507f1f77bcf86cd799439011', '507f1f77bcf86cd799439012'] })
  @Prop({
    type: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Character' }],
    default: [],
    required: true,
  })
  characters: Character[];

  @ApiProperty({ example: ['507f1f77bcf86cd799439011', '507f1f77bcf86cd799439012'] })
  @Prop({
    type: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Campaign' }],
    default: [],
    required: true,
  })
  campaigns: Campaign[];

  @ApiProperty({ example: null })
  @Prop({ default: null })
  deletedAt?: Date;
}

export const GroupSchema = SchemaFactory.createForClass(Group);
