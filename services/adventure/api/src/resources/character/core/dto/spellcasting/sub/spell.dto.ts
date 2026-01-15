import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, IsOptional, IsString } from 'class-validator';

export class SpellDto {

  @ApiProperty({ example: 'Fireball' })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiProperty({ example: 3 })
  @IsOptional()
  @IsNumber()
  level?: number;

  @ApiProperty({ example: 'Evocation' })
  @IsOptional()
  @IsString()
  school?: string;

  @ApiProperty({ example: 'A bright streak flashes from your pointing finger to a point you choose within range...' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ example: ['V', 'S', 'M'] })
  @IsOptional()
  @IsString({ each: true })
  components?: string[];

  @ApiProperty({ example: '1 action' })
  @IsOptional()
  @IsString()
  castingTime?: string;

  @ApiProperty({ example: 'Instantaneous' })
  @IsOptional()
  @IsString()
  duration?: string;

  @ApiProperty({ example: '150 feet' })
  @IsOptional()
  @IsString()
  range?: string;

  @ApiProperty({ example: 'attack', enum: ['attack', 'heal', 'utility'] })
  @IsOptional()
  @IsString()
  effectType?: 'attack' | 'heal' | 'utility';

  @ApiProperty({ example: '8d6' })
  @IsOptional()
  @IsString()
  damage?: string;

  @ApiProperty({ example: '4d8' })
  @IsOptional()
  @IsString()
  healing?: string;
}
