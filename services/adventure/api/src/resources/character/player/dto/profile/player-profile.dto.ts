import { IsOptional, IsString } from 'class-validator';
import { ProfileDto } from '@/resources/character/core/dto/profile/profile.dto';
import { ApiProperty } from '@nestjs/swagger';

export class PlayerProfileDto extends ProfileDto {

  @ApiProperty({ example: 'Elf' })
  @IsOptional()
  @IsString()
  race?: string;

  @ApiProperty({ example: 'High Elf' })
  @IsOptional()
  @IsString()
  subrace?: string;

  @ApiProperty({ example: 'A skilled archer from the northern forests.' })
  @IsOptional()
  @IsString()
  history?: string;
}
