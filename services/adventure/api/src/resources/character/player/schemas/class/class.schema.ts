import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { ApiProperty } from '@nestjs/swagger';

@Schema({ _id: false })
export class Class {

  @ApiProperty({ example: 'Warrior' })
  @Prop()
  name?: string;

  @ApiProperty({ example: 'Berserker' })
  @Prop()
  subclass?: string;

  @ApiProperty({ example: 1 })
  @Prop({ default: 1 })
  level: number;

  @ApiProperty({ example: 10 })
  @Prop()
  hitDice?: number;
}

export const ClassSchema = SchemaFactory.createForClass(Class);
