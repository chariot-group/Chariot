import { IsNumber, IsOptional, IsString } from 'class-validator';

export class SpellDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsNumber()
  level?: number;

  @IsOptional()
  @IsString()
  school?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString({ each: true })
  components?: string[];

  @IsOptional()
  @IsString()
  castingTime?: string;

  @IsOptional()
  @IsString()
  duration?: string;

  @IsOptional()
  @IsString()
  range?: string;

  @IsOptional()
  @IsString()
  effectType?: 'attack' | 'heal' | 'utility';

  @IsOptional()
  @IsString()
  damage?: string;

  @IsOptional()
  @IsString()
  healing?: string;
}
