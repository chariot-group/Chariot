import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { ApiProperty } from '@nestjs/swagger';

@Schema({ _id: false })
export class Ability {

  @ApiProperty({ example: 'Stealth' })
  @Prop()
  name: string;

  @ApiProperty({ example: 'Allows the character to move unseen and unheard' })
  @Prop()
  description: string;
}

export const AbilitySchema = SchemaFactory.createForClass(Ability);
