import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, IsOptional, IsString } from 'class-validator';
import { CLASS, Class } from '@/resources/character/player/constants/class.constant';
import { Prop } from '@nestjs/mongoose';

export class ClassDto {

  @ApiProperty({ example: 'Fighter' })
  @Prop({
    type: String,
    required: true,
    enum: CLASS,
  })
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
