import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsOptional } from 'class-validator';

export class AffinitiesDto {

  @ApiProperty({ example: ['Fire', 'Water'] })
  @IsOptional()
  @IsArray()
  resistances: string[];

  @ApiProperty({ example: ['Ice', 'Poison'] })
  @IsOptional()
  @IsArray()
  immunities: string[];

  @ApiProperty({ example: ['Earth', 'Lightning'] })
  @IsOptional()
  @IsArray()
  vulnerabilities: string[];
}
