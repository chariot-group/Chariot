import { ApiProperty } from '@nestjs/swagger';
import {
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
} from 'class-validator';
import {
  CLASS,
  Class,
} from '@/resources/character/player/constants/class.constant';

export class ClassDto {
  @ApiProperty({ example: 'Fighter', enum: CLASS })
  @IsNotEmpty()
  @IsEnum(CLASS, { message: 'name must be a valid class' })
  name: Class;

  @ApiProperty({ example: 'Champion' })
  @IsOptional()
  @IsString()
  subclass?: string;

  @ApiProperty({ example: 5 })
  @IsOptional()
  @IsNumber()
  level?: number;

  @ApiProperty({ example: 10 })
  @IsOptional()
  @IsNumber()
  hitDice?: number;
}
