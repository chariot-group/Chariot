import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose, { Document } from 'mongoose';
import {
  Affinities,
  AffinitiesSchema,
} from '@/resources/character/core/schemas/affinities/affinities.schema';
import { BaseSchema } from '@/common/schemas/base-schema';
import { Ability } from '@/resources/character/core/schemas/ability/ability.schema';
import { Spellcasting } from '@/resources/character/core/schemas/spellcasting/spellcasting.schema';
import { Stats } from '@/resources/character/core/schemas/stats/stats.schema';
import { ApiProperty } from '@nestjs/swagger';
import { Appearance } from '@/resources/character/player/schemas/appearance/appearance.schema';
import { Background } from '@/resources/character/player/schemas/background/background.schema';
import { Treasure } from '@/resources/character/core/schemas/treasure/treasure.schema';
import { Conditions } from '@/resources/character/core/schemas/conditions/conditions.schema';
import {
  DEFAULT_GAME_SYSTEM,
  GAME_SYSTEMS,
  GameSystem,
} from '@/common/constants/game-system.constant';

export type CharacterDocument = Character & Document;

@Schema({ timestamps: true, discriminatorKey: 'kind' })
export class Character extends BaseSchema {
  @ApiProperty({ example: '60d21b4667d0d8992e610c85' })
  @Prop({ type: mongoose.Schema.Types.ObjectId, auto: true })
  _id: mongoose.Schema.Types.ObjectId;

  @ApiProperty({ example: 'Aragorn' })
  @Prop({ required: true })
  firstname: string;

  @ApiProperty({ example: 'Elessar' })
  @Prop({ required: false })
  lastname: string;

  @ApiProperty({ example: "Fils d'Arathorn" })
  @Prop({ required: false })
  surname: string;

  @ApiProperty({ example: 'http://example.com/avatar.png' })
  @Prop({ required: false })
  avatar: string;

  @ApiProperty({
    example: DEFAULT_GAME_SYSTEM,
    enum: GAME_SYSTEMS,
    default: DEFAULT_GAME_SYSTEM,
  })
  @Prop({
    type: String,
    enum: GAME_SYSTEMS,
    required: true,
    default: DEFAULT_GAME_SYSTEM,
  })
  gameSystem: GameSystem;

  @ApiProperty({ type: Stats })
  @Prop({ type: Stats, default: {} })
  stats: Stats;

  @ApiProperty({ type: Affinities })
  @Prop({ type: AffinitiesSchema, default: {} })
  affinities: Affinities;

  @ApiProperty({ type: [Ability] })
  @Prop({ type: [Ability], default: [] })
  abilities: Ability[];

  @ApiProperty({ type: [Spellcasting] })
  @Prop({ type: [Spellcasting], default: [] })
  spellcasting: Spellcasting[];

  @ApiProperty({ type: Appearance })
  @Prop({ type: Appearance, default: {} })
  appearance: Appearance;

  @ApiProperty({ type: Background })
  @Prop({ type: Background, default: {} })
  background: Background;

  @ApiProperty({ type: Treasure })
  @Prop({ type: Treasure, default: {} })
  treasure: Treasure;

  @ApiProperty({ type: Conditions })
  @Prop({ type: Conditions, default: {} })
  conditions: Conditions;

  @ApiProperty({
    type: [String],
    example: ['507f1f77bcf86cd799439011'],
  })
  @Prop({
    type: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Group' }],
    default: [],
    required: false,
  })
  groups: mongoose.Types.ObjectId[];

  @ApiProperty({ example: null })
  @Prop({ default: null })
  deletedAt?: Date;
}

export const CharacterSchema = SchemaFactory.createForClass(Character);

CharacterSchema.set('toJSON', {
  transform(_doc, ret) {
    if (ret.gameSystem == null) {
      ret.gameSystem = DEFAULT_GAME_SYSTEM;
    }
    return ret;
  },
});
