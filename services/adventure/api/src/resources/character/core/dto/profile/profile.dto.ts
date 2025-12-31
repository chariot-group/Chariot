import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class ProfileDto {

  @ApiProperty({ example: 'A brave warrior from the north' })
  @IsOptional()
  @IsString()
  alignment?: string;
}
