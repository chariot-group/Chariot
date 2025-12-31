import { Prop, Schema } from '@nestjs/mongoose';
import { SchemaFactory } from '@nestjs/mongoose';
import { ApiProperty } from '@nestjs/swagger';

@Schema({ _id: false })
export class Appearance {

  @ApiProperty({ example: 25 })
  @Prop()
  age?: number;

  @ApiProperty({ example: 180 })
  @Prop()
  height?: number;

  @ApiProperty({ example: 75 })
  @Prop()
  weight?: number;

  @ApiProperty({ example: 'Blue' })
  @Prop()
  eyes?: string;

  @ApiProperty({ example: 'Light' })
  @Prop()
  skin?: string;

  @ApiProperty({ example: 'Brown' })
  @Prop()
  hair?: string;

  @ApiProperty({ example: 'Athletic build with a friendly face.' })
  @Prop()
  description?: string;
}

export const AppearanceSchema = SchemaFactory.createForClass(Appearance);
