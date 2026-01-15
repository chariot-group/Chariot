import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, IsOptional, IsString } from 'class-validator';

export class AppearanceDto {

  @ApiProperty({ example: 25 })
  @IsOptional()
  @IsNumber()
  age?: number;

  @ApiProperty({ example: 180 })
  @IsOptional()
  @IsNumber()
  height?: number;

  @ApiProperty({ example: 75 })
  @IsOptional()
  @IsNumber()
  weight?: number;

  @ApiProperty({ example: 'Blue' })
  @IsOptional()
  @IsString()
  eyes?: string;

  @ApiProperty({ example: 'Light' })
  @IsOptional()
  @IsString()
  skin?: string;

  @ApiProperty({ example: 'Brown' })
  @IsOptional()
  @IsString()
  hair?: string;

  @ApiProperty({ example: 'Athletic build with a friendly face.' })
  @IsOptional()
  @IsString()
  description?: string;
}
