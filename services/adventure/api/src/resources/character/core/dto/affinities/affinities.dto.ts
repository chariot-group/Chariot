import { IsArray, IsOptional } from 'class-validator';

export class AffinitiesDto {
  @IsOptional()
  @IsArray()
  resistances: string[];

  @IsOptional()
  @IsArray()
  immunities: string[];

  @IsOptional()
  @IsArray()
  vulnerabilities: string[];
}
