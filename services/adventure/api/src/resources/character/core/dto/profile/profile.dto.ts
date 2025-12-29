import { IsOptional, IsString } from 'class-validator';

export class ProfileDto {
  @IsOptional()
  @IsString()
  alignment?: string;
}
