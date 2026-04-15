import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Group } from '@/resources/group/schemas/group.schema';
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
  active: Group[];

  @ApiProperty({ type: [String], example: ['507f1f77bcf86cd799439013'] })
  @Prop({
    type: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Group' }],
    default: [],
    required: true,
  })
  archived: Group[];
}

export const GroupsSchema = SchemaFactory.createForClass(Groups);
