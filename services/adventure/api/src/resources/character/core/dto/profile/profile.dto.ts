import { Prop } from '@nestjs/mongoose';
import { ApiProperty } from '@nestjs/swagger';
import { Alignment, ALIGNMENT } from '@/resources/character/core/constants/alignment.constant';

export class ProfileDto {

  @ApiProperty({ example: 'Lawful Good' })
  @Prop({
    type: String,
    required: true,
    enum: ALIGNMENT,
  })
  alignment: Alignment;

}
