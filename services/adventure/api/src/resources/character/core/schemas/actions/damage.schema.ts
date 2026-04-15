import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { ApiProperty } from '@nestjs/swagger';

@Schema({ _id: false })
export class Damage {
  @ApiProperty({ example: '1d6+2' })
  @Prop()
  dice?: string;

  @ApiProperty({ example: 'slashing' })
  @Prop()
  type?: string;

  @ApiProperty({
    example: true,
    description:
      'Automatically applies ability modifier to this damage dice expression.',
  })
  @Prop()
  applyAbilityBonus?: boolean;
}

export const DamageSchema = SchemaFactory.createForClass(Damage);
