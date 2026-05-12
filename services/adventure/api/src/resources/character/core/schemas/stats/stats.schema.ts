import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Speed } from '@/resources/character/core/schemas/stats/sub/speed.schema';
import { AbilityScores } from '@/resources/character/core/schemas/stats/sub/abilityScores.schema';
import { SavingThrows } from '@/resources/character/core/schemas/stats/sub/savingThrows.schema';
import { Skills } from '@/resources/character/core/schemas/stats/sub/skill.schema';
import {
  SIZES,
  Size,
} from '@/resources/character/core/constants/sizes.constant';
import { Sense } from '@/resources/character/core/schemas/stats/sub/sense';
import { ApiProperty } from '@nestjs/swagger';

@Schema({ _id: false })
export class Stats {
  @ApiProperty({ example: 'Medium' })
  @Prop({
    type: String,
    required: true,
    enum: SIZES,
  })
  size: Size;

  @ApiProperty({ example: 100 })
  @Prop({ default: 0 })
  maxHitPoints: number;

  @ApiProperty({ example: 100 })
  @Prop({
    default: function (this: { maxHitPoints: number }) {
      return this.maxHitPoints;
    },
  })
  currentHitPoints: number;

  @ApiProperty({ example: 0 })
  @Prop({ default: 0 })
  tempHitPoints: number;

  @ApiProperty({ example: 15 })
  @Prop({ default: 0 })
  armorClass: number;

  @ApiProperty({ example: 3 })
  @Prop({ default: 0 })
  initiative: number;

  @ApiProperty({ type: Speed })
  @Prop({ type: Speed, default: {} })
  speed: Speed;

  @ApiProperty({ type: AbilityScores })
  @Prop({ type: AbilityScores, default: {} })
  abilityScores: AbilityScores;

  @ApiProperty({ example: ['Common', 'Elvish'] })
  @Prop({ type: [String], default: [] })
  languages: string[];

  @ApiProperty({ example: 10 })
  @Prop({ default: 0 })
  passivePerception: number;

  @ApiProperty({ type: SavingThrows })
  @Prop({ type: SavingThrows, default: {} })
  savingThrows: SavingThrows;

  @ApiProperty({ type: Skills })
  @Prop({ type: Skills, default: {} })
  skills: Skills;

  @ApiProperty({ type: [Sense] })
  @Prop({ type: [Sense], default: [] })
  senses: Sense[];
}

export const StatsSchema = SchemaFactory.createForClass(Stats);
