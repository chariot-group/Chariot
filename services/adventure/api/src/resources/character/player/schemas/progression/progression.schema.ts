import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { ApiProperty } from '@nestjs/swagger';

@Schema({ _id: false })
export class Progression {

  @ApiProperty({ example: 1 })
  @Prop({ default: 1 })
  level: number;

  @ApiProperty({ example: 0 })
  @Prop({ default: 0 })
  experience: number;
}

export const ProgressionSchema = SchemaFactory.createForClass(Progression);
