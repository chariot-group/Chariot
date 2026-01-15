import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, IsOptional, IsString } from 'class-validator';

export class SenseDto {

  @ApiProperty({ example: 'Darkvision' })
  @IsOptional()
  @IsString()
  name: string;

  @ApiProperty({ example: 60 })
  @IsOptional()
  @IsNumber()
  value: number;
}
