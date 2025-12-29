import { IsNumber, IsOptional } from 'class-validator';

export class SpeedDto {
  @IsOptional()
  @IsNumber()
  walk?: number;

  @IsOptional()
  @IsNumber()
  climb?: number;

  @IsOptional()
  @IsNumber()
  swim?: number;

  @IsOptional()
  @IsNumber()
  fly?: number;

  @IsOptional()
  @IsNumber()
  burrow?: number;
}
