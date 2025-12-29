import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import { Character } from '@/resources/character/core/schemas/character.schema';
import { Progression } from '@/resources/character/player/schemas/progression/progression.schema';
import { Class } from '@/resources/character/player/schemas/class/class.schema';
import { PlayerProfile } from '@/resources/character/player/schemas/profile/player-profile.schema';
import { Appearance } from '@/resources/character/player/schemas/appearance/appearance.schema';
import { Background } from '@/resources/character/player/schemas/background/background.schema';
import { Treasure } from '@/resources/character/player/schemas/treasure/treasure.schema';
import { PlayerStats } from '@/resources/character/player/schemas/stats/player-stats.schema';

export type PlayerDocument = Player & Document;

@Schema()
export class Player extends Character {
  @Prop({ required: true })
  inspiration: boolean;

  @Prop({ type: Progression, default: {} })
  progression: Progression;

  @Prop({ type: [Class], default: [] })
  class: Class[];

  @Prop({ type: PlayerProfile, default: {} })
  profile: PlayerProfile;

  @Prop({ type: Appearance, default: {} })
  appearance: Appearance;

  @Prop({ type: Background, default: {} })
  background: Background;

  @Prop({ type: Treasure, default: {} })
  treasure: Treasure;

  @Prop({ type: PlayerStats, default: {} })
  stats: PlayerStats;
}

export const PlayerSchema = SchemaFactory.createForClass(Player);
