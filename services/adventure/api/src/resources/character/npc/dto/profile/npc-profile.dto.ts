import { IsOptional, IsString } from 'class-validator';
import { ProfileDto } from '@/resources/character/core/dto/profile/profile.dto';

export class NPCProfileDto extends ProfileDto {
  @IsOptional()
  @IsString()
  type?: string;

  @IsOptional()
  @IsString()
  subtype?: string;
}
