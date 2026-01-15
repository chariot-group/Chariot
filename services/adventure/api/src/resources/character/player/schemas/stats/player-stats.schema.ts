import { Stats } from '@/resources/character/core/schemas/stats/stats.schema';
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Masteries } from '@/resources/character/player/schemas/stats/player-masteries.schema';
import { MasteriesAbility } from '@/resources/character/player/schemas/stats/player-masteriesAbility';
import { ApiProperty } from '@nestjs/swagger';

@Schema({ _id: false })
export class PlayerStats extends Stats {

  @ApiProperty({ example: 0 })
  @Prop({ default: 0 })
  proficiencyBonus: number;

  @ApiProperty({ type: Masteries })
  @Prop({ type: Masteries, default: {} })
  masteries: Masteries;

  @ApiProperty({ type: MasteriesAbility })
  @Prop({ type: MasteriesAbility, default: {} })
  masteriesAbility: MasteriesAbility;
}

export const PlayerStatsSchema = SchemaFactory.createForClass(PlayerStats);
