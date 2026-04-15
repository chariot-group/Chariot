import { IsOptional, IsString } from 'class-validator';
import { ProfileDto } from '@/resources/character/core/dto/profile/profile.dto';
import { ApiProperty } from '@nestjs/swagger';

export class NPCProfileDto extends ProfileDto {
  @ApiProperty({ example: 'Goblin' })
  @IsOptional()
  @IsString()
  type?: string;

  @ApiProperty({ example: 'Humanoid' })
  @IsOptional()
  @IsString()
  subtype?: string;
}
