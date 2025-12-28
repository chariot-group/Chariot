import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose, { Document } from 'mongoose';
import { Affinities } from '@/resources/character/core/schemas/affinities/affinities.schema';
import { Group } from '@/resources/group/schemas/group.schema';
import { BaseSchema } from '@/common/schemas/base-schema';
import { Ability } from '@/resources/character/core/schemas/ability/ability.schema';
import { Spellcasting } from '@/resources/character/core/schemas/spellcasting/spellcasting.schema';
import { Stats } from '@/resources/character/core/schemas/stats/stats.schema';

export type CharacterDocument = Character & Document;

@Schema({ timestamps: true, discriminatorKey: 'kind' })
export class Character extends BaseSchema {
  @Prop({ type: mongoose.Schema.Types.ObjectId, auto: true })
  _id: mongoose.Schema.Types.ObjectId;

  @Prop({ required: true })
  name: string;

  @Prop({ type: Stats, default: {} })
  stats: Stats;

  @Prop({ type: Affinities, default: {} })
  affinities: Affinities;

  @Prop({ type: [Ability], default: [] })
  abilities: Ability[];

  @Prop({ type: [Spellcasting], default: [] })
  spellcasting: Spellcasting[];

  @Prop({
    type: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Group' }],
    default: [],
    required: true,
  })
  groups: Group[];

  @Prop({ default: null })
  deletedAt?: Date;
}

export const CharacterSchema = SchemaFactory.createForClass(Character);
