import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty } from 'class-validator';
import {
  Alignment,
  ALIGNMENT,
} from '@/resources/character/core/constants/alignment.constant';

export class ProfileDto {
  @ApiProperty({ example: 'Lawful Good', enum: ALIGNMENT })
  @IsNotEmpty()
  @IsEnum(ALIGNMENT, { message: 'alignment must be a valid alignment' })
  alignment: Alignment;
}
