import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, IsOptional } from 'class-validator';

export class ProgressionDto {
  @ApiProperty({ example: 3 })
  @IsOptional()
  @IsNumber()
  level: number;

  @ApiProperty({ example: 4500 })
  @IsOptional()
  @IsNumber()
  experience: number;
}
