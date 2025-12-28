import { Stats } from '@/resources/character/core/schemas/stats/stats.schema';
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Masteries } from '@/resources/character/player/schemas/stats/player-masteries.schema';
import { MasteriesAbility } from '@/resources/character/player/schemas/stats/player-masteriesAbility';

@Schema({ _id: false })
export class PlayerStats extends Stats {
  @Prop({ default: 0 })
  proficiencyBonus: number;

  @Prop({ type: Masteries, default: {} })
  masteries: Masteries;

  @Prop({ type: MasteriesAbility, default: {} })
  masteriesAbility: MasteriesAbility;
}

export const PlayerStatsSchema = SchemaFactory.createForClass(PlayerStats);
