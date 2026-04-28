import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, IsOptional, IsString } from 'class-validator';

export class DamageDetailsDto {
  @ApiProperty({ example: 8, description: 'Nombre de dés' })
  @IsOptional()
  @IsNumber()
  diceCount?: number;

  @ApiProperty({
    example: 'd6',
    description: 'Type de dé',
    enum: ['d4', 'd6', 'd8', 'd10', 'd12', 'd20', 'd100'],
  })
  @IsOptional()
  @IsString()
  diceType?: string;

  @ApiProperty({ example: 3, description: 'Bonus aux dégâts' })
  @IsOptional()
  @IsNumber()
  bonus?: number;

  @ApiProperty({ example: 'Feu', description: 'Type de dégâts' })
  @IsOptional()
  @IsString()
  damageType?: string;
}

export class HealingDetailsDto {
  @ApiProperty({ example: 4, description: 'Nombre de dés' })
  @IsOptional()
  @IsNumber()
  diceCount?: number;

  @ApiProperty({
    example: 'd8',
    description: 'Type de dé',
    enum: ['d4', 'd6', 'd8', 'd10', 'd12', 'd20', 'd100'],
  })
  @IsOptional()
  @IsString()
  diceType?: string;

  @ApiProperty({ example: 3, description: 'Bonus aux soins' })
  @IsOptional()
  @IsNumber()
  bonus?: number;
}
