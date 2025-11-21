import { IsOptional, IsString } from 'class-validator';

export class DamageDto {
  @IsOptional()
  @IsString()
  dice?: string;

  @IsOptional()
  @IsString()
  type?: string;
}
