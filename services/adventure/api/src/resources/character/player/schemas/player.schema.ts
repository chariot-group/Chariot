import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import { Character } from '@/resources/character/core/schemas/character.schema';
import { Progression } from '@/resources/character/player/schemas/progression/progression.schema';
import { Class } from '@/resources/character/player/schemas/class/class.schema';
import { PlayerProfile } from '@/resources/character/player/schemas/profile/player-profile.schema';
import { PlayerStats } from '@/resources/character/player/schemas/stats/player-stats.schema';
import { ApiProperty } from '@nestjs/swagger';

export type PlayerDocument = Player & Document;

@Schema()
export class Player extends Character {

  @ApiProperty({ example: true })
  @Prop({ required: true })
  inspiration: boolean;

  @ApiProperty({ type: Progression })
  @Prop({ type: Progression, default: {} })
  progression: Progression;

  @ApiProperty({ type: [Class] })
  @Prop({ type: [Class], default: [] })
  class: Class[];

  @ApiProperty({ type: PlayerProfile })
  @Prop({ type: PlayerProfile, default: {} })
  profile: PlayerProfile;

  @ApiProperty({ type: PlayerStats })
  @Prop({ type: PlayerStats, default: {} })
  stats: PlayerStats;
}

export const PlayerSchema = SchemaFactory.createForClass(Player);
