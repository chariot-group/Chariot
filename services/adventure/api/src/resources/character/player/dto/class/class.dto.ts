import { IsNumber, IsOptional, IsString } from 'class-validator';

export class ClassDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  subclass?: number;

  @IsOptional()
  @IsNumber()
  level?: number;

  @IsOptional()
  @IsNumber()
  hitDice?: number;
}
