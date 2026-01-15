import { Prop, Schema } from '@nestjs/mongoose';
import { SchemaFactory } from '@nestjs/mongoose';
import { ApiProperty } from '@nestjs/swagger';

@Schema({ _id: false })
export class Profile {

  @ApiProperty({ example: 'A brave warrior from the north' })
  @Prop()
  alignment?: string;
}

export const ProfileSchema = SchemaFactory.createForClass(Profile);
