import { IsNumber, IsOptional, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class DifficultyClassDto {

  @ApiProperty({ example: 'wis', description: 'Ability score type for the saving throw' })
  @IsOptional()
  @IsString()
  dcType?: string;

  @ApiProperty({ example: 18, description: 'DC value to beat' })
  @IsOptional()
  @IsNumber()
  dcValue?: number;

  @ApiProperty({ example: 'none', description: 'Effect on successful save' })
  @IsOptional()
  @IsString()
  successType?: string;
}
