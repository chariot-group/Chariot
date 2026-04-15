import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, IsOptional } from 'class-validator';

export class SavingThrowsDto {
  @ApiProperty({ example: 16 })
  @IsOptional()
  @IsNumber()
  strength?: number;

  @ApiProperty({ example: 14 })
  @IsOptional()
  @IsNumber()
  dexterity?: number;

  @ApiProperty({ example: 15 })
  @IsOptional()
  @IsNumber()
  constitution?: number;

  @ApiProperty({ example: 12 })
  @IsOptional()
  @IsNumber()
  intelligence?: number;

  @ApiProperty({ example: 13 })
  @IsOptional()
  @IsNumber()
  wisdom?: number;

  @ApiProperty({ example: 10 })
  @IsOptional()
  @IsNumber()
  charisma?: number;
}
