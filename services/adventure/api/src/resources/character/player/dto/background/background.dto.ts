import { IsOptional, IsString } from 'class-validator';

export class BackgroundDto {
  @IsOptional()
  @IsString()
  personalityTraits?: string;

  @IsOptional()
  @IsString()
  ideals?: string;

  @IsOptional()
  @IsString()
  bonds?: string;

  @IsOptional()
  @IsString()
  flaws?: string;

  @IsOptional()
  @IsString()
  alliesAndOrgs?: string;

  @IsOptional()
  @IsString()
  backstory?: string;
}
