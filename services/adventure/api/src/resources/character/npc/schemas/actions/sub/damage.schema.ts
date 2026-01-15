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
}

export const DamageSchema = SchemaFactory.createForClass(Damage);
