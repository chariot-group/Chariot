import { Prop, Schema } from '@nestjs/mongoose';
import { SchemaFactory } from '@nestjs/mongoose';
import { ApiProperty } from '@nestjs/swagger';
import { ALIGNMENT, Alignment } from '@/resources/character/core/constants/alignment.constant';

@Schema({ _id: false })
export class Profile {

  @ApiProperty({ example: 'Chaotic Good' })
  @Prop({
    type: String,
    required: true,
    enum: ALIGNMENT,
  })
  alignment: Alignment;
}

export const ProfileSchema = SchemaFactory.createForClass(Profile);
