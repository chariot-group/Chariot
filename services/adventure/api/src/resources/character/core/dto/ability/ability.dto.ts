import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class AbilityDto {

  @ApiProperty({ example: 'Fireball' })
  @IsOptional()
  @IsString()
  name: string;

  @ApiProperty({ example: 'A powerful fire-based attack that deals area damage' })
  @IsOptional()
  @IsString()
  description: string;
}
