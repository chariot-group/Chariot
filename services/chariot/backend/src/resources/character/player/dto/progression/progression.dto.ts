import { IsNumber, IsOptional } from 'class-validator';

export class ProgressionDto {
  @IsOptional()
  @IsNumber()
  level: number;

  @IsOptional()
  @IsNumber()
  experience: number;
}
