import { Prop, Schema } from '@nestjs/mongoose';
import { SchemaFactory } from '@nestjs/mongoose';
import { EffectType } from '@/resources/character/core/constants/effect-types.constant';
import { ApiProperty } from '@nestjs/swagger';

@Schema({ _id: false })
export class Spell {

  @ApiProperty({ example: 'Fireball' })
  @Prop()
  name?: string;

  @ApiProperty({ example: 3 })
  @Prop()
  level?: number;

  @ApiProperty({ example: 'Evocation' })
  @Prop()
  school?: string;

  @ApiProperty({ example: 'A bright streak flashes from your pointing finger to a point you choose within range...' })
  @Prop()
  description?: string;

  @ApiProperty({ example: ['V', 'S', 'M'] })
  @Prop({ default: [] })
  components: string[];

  @ApiProperty({ example: '1 action' })
  @Prop()
  castingTime?: string;

  @ApiProperty({ example: '1 minute' })
  @Prop()
  duration?: string;

  @ApiProperty({ example: '60 feet' })
  @Prop()
  range?: string;

  @ApiProperty({ example: 'attack', enum: ['attack', 'heal', 'utility'] })
  @Prop()
  effectType?: EffectType;

  @ApiProperty({ example: '8d6' })
  @Prop()
  damage?: string;

  @ApiProperty({ example: '4d8' })
  @Prop()
  healing?: string;
}

export const SpellSchema = SchemaFactory.createForClass(Spell);
