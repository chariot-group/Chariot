import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class DamageDto {

  @ApiProperty({ example: '2d6+3' })
  @IsOptional()
  @IsString()
  dice?: string;

  @ApiProperty({ example: 'fire' })
  @IsOptional()
  @IsString()
  type?: string;
}
