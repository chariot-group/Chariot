import { Prop } from '@nestjs/mongoose';
import { Damage } from '@/resources/character/core/schemas/actions/damage.schema';
import { DifficultyClass } from '@/resources/character/core/schemas/actions/difficulty-class.schema';
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

  @ApiProperty({
    example: 'action',
    enum: ['action', 'bonus_action', 'reaction'],
  })
  @Prop()
  usageType?: string;

  @ApiProperty({
    example: 'strength',
    enum: [
      'strength',
      'dexterity',
      'constitution',
      'intelligence',
      'wisdom',
      'charisma',
    ],
  })
  @Prop()
  attackAbility?: string;

  @ApiProperty({
    example:
      'The target must succeed on a DC 18 Constitution saving throw or be paralyzed for 1 minute.',
  })
  @Prop()
  description?: string;

  @ApiProperty({ example: 5 })
  @Prop()
  attackBonus?: number;

  @ApiProperty({ type: [Damage] })
  @Prop({ type: [Damage], default: [] })
  damage?: Damage[];

  @ApiProperty({ example: '5 ft.' })
  @Prop()
  range?: string;

  @ApiProperty({ type: DifficultyClass })
  @Prop({ type: DifficultyClass, default: null })
  dc?: DifficultyClass;

  @ApiProperty({
    example: 2,
    description: 'Cost of the action (for legendary actions)',
  })
  @Prop()
  cost?: number;
}
