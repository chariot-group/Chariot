import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, IsOptional } from 'class-validator';

export class SkillDto {

  @ApiProperty({ example: 5 })
  @IsOptional()
  @IsNumber()
  athletics?: number;

  @ApiProperty({ example: 3 })
  @IsOptional()
  @IsNumber()
  acrobatics?: number;

  @ApiProperty({ example: 4 })
  @IsOptional()
  @IsNumber()
  sleightHand?: number;

  @ApiProperty({ example: 2 })
  @IsOptional()
  @IsNumber()
  stealth?: number;

  @ApiProperty({ example: 6 })
  @IsOptional()
  @IsNumber()
  arcana?: number;

  @ApiProperty({ example: 1 })
  @IsOptional()
  @IsNumber()
  history?: number;

  @ApiProperty({ example: 2 })
  @IsOptional()
  @IsNumber()
  investigation?: number;

  @ApiProperty({ example: 3 })
  @IsOptional()
  @IsNumber()
  nature?: number;

  @ApiProperty({ example: 4 })
  @IsOptional()
  @IsNumber()
  religion?: number;

  @ApiProperty({ example: 5 })
  @IsOptional()
  @IsNumber()
  animalHandling?: number;

  @ApiProperty({ example: 6 })
  @IsOptional()
  @IsNumber()
  insight?: number;

  @ApiProperty({ example: 4 })
  @IsOptional()
  @IsNumber()
  medicine?: number;

  @ApiProperty({ example: 7 })
  @IsOptional()
  @IsNumber()
  perception?: number;

  @ApiProperty({ example: 3 })
  @IsOptional()
  @IsNumber()
  survival?: number;

  @ApiProperty({ example: 2 })
  @IsOptional()
  @IsNumber()
  deception?: number;

  @ApiProperty({ example: 5 })
  @IsOptional()
  @IsNumber()
  intimidation?: number;

  @ApiProperty({ example: 4 })
  @IsOptional()
  @IsNumber()
  performance?: number;

  @ApiProperty({ example: 6 })
  @IsOptional()
  @IsNumber()
  persuasion?: number;
}
