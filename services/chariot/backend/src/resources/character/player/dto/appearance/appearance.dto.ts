import { IsNumber, IsOptional, IsString } from 'class-validator';

export class AppearanceDto {
  @IsOptional()
  @IsNumber()
  age?: number;

  @IsOptional()
  @IsNumber()
  height?: number;

  @IsOptional()
  @IsNumber()
  weight?: number;

  @IsOptional()
  @IsString()
  eyes?: string;

  @IsOptional()
  @IsString()
  skin?: string;

  @IsOptional()
  @IsString()
  hair?: string;

  @IsOptional()
  @IsString()
  description?: string;
}
