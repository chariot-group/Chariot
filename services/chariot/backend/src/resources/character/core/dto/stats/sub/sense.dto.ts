import { IsNumber, IsOptional, IsString } from 'class-validator';

export class SenseDto {
  @IsOptional()
  @IsString()
  name: string;

  @IsOptional()
  @IsNumber()
  value: number;
}
