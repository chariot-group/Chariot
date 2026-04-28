import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { ApiProperty } from '@nestjs/swagger';
import { CLASS } from '@/resources/character/player/constants/class.constant';

@Schema({ _id: false })
export class Class {
  @ApiProperty({ example: 'Warrior' })
  @Prop({
    type: String,
    required: true,
    enum: CLASS,
  })
  name: Class;

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
