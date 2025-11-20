import { IsOptional, IsString } from 'class-validator';

export class AbilityDto {
  @IsOptional()
  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  description: string;
}
