import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, IsOptional } from 'class-validator';

export class SpeedDto {
  @ApiProperty({ example: 30 })
  @IsOptional()
  @IsNumber()
  walk?: number;

  @ApiProperty({ example: 15 })
  @IsOptional()
  @IsNumber()
  climb?: number;

  @ApiProperty({ example: 20 })
  @IsOptional()
  @IsNumber()
  swim?: number;

  @ApiProperty({ example: 60 })
  @IsOptional()
  @IsNumber()
  fly?: number;

  @ApiProperty({ example: 10 })
  @IsOptional()
  @IsNumber()
  burrow?: number;
}
