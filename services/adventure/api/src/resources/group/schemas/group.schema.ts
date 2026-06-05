import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import mongoose from 'mongoose';
import { BaseSchema } from '@/common/schemas/base-schema';
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

  @ApiProperty({
    example: ['507f1f77bcf86cd799439011', '507f1f77bcf86cd799439012'],
  })
  @Prop({
    type: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Character' }],
    default: [],
    required: true,
  })
  characters: mongoose.Types.ObjectId[];

  @ApiProperty({
    example: ['507f1f77bcf86cd799439011', '507f1f77bcf86cd799439012'],
  })
  @Prop({
    type: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Campaign' }],
    default: [],
    required: true,
  })
  campaigns: mongoose.Types.ObjectId[];

  @ApiProperty({ example: null })
  @Prop({ default: null })
  deletedAt?: Date;
}

export const GroupSchema = SchemaFactory.createForClass(Group);
