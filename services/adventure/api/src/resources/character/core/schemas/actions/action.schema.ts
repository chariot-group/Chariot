import { Prop } from '@nestjs/mongoose';
import { Damage } from '@/resources/character/core/schemas/actions/damage.schema';
import { Schema } from '@nestjs/mongoose';
import { ApiProperty } from '@nestjs/swagger';
@Schema({ _id: false })
export class Action {

  @ApiProperty({ example: 'Bite' })
  @Prop()
  name?: string;

  @ApiProperty({ example: 'Melee Weapon Attack' })
  @Prop()
  type?: string;

  @ApiProperty({ example: 5 })
  @Prop()
  attackBonus?: number;

  @ApiProperty({ type: Damage })
  @Prop({ type: Damage, default: {} })
  damage: Damage;

  @ApiProperty({ example: '5 ft.' })
  @Prop()
  range?: string;
}
