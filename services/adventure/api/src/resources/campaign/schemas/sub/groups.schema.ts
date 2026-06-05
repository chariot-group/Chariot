import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose from 'mongoose';
import { ApiProperty } from '@nestjs/swagger';

@Schema()
export class Groups {
  @ApiProperty({ type: [String], example: ['507f1f77bcf86cd799439011'] })
  @Prop({
    type: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Group' }],
    default: [],
    required: true,
  })
  active: mongoose.Types.ObjectId[];

  @ApiProperty({ type: [String], example: ['507f1f77bcf86cd799439013'] })
  @Prop({
    type: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Group' }],
    default: [],
    required: true,
  })
  archived: mongoose.Types.ObjectId[];
}

export const GroupsSchema = SchemaFactory.createForClass(Groups);
