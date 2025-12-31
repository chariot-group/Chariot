import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, IsOptional, IsString } from 'class-validator';

export class ClassDto {

  @ApiProperty({ example: 'Warrior' })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiProperty({ example: 1 })
  @IsOptional()
  @IsString()
  subclass?: number;

  @ApiProperty({ example: 5 })
  @IsOptional()
  @IsNumber()
  level?: number;

  @ApiProperty({ example: 10 })
  @IsOptional()
  @IsNumber()
  hitDice?: number;
}
