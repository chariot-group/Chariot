import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Types } from 'mongoose';
import { Group } from '@/resources/group/schemas/group.schema';
import mongoose from 'mongoose';

@Schema()
export class Groups {
  @Prop({
    type: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Group' }],
    default: [],
    required: true,
  })
  main: Group[];

  @Prop({
    type: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Group' }],
    default: [],
    required: true,
  })
  npc: Group[];

  @Prop({
    type: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Group' }],
    default: [],
    required: true,
  })
  archived: Group[];
}

export const GroupsSchema = SchemaFactory.createForClass(Groups);
