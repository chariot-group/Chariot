import { IsNumber, IsOptional } from 'class-validator';

export class SavingThrowsDto {
  @IsOptional()
  @IsNumber()
  strength?: number;

  @IsOptional()
  @IsNumber()
  dexterity?: number;

  @IsOptional()
  @IsNumber()
  constitution?: number;

  @IsOptional()
  @IsNumber()
  intelligence?: number;

  @IsOptional()
  @IsNumber()
  wisdom?: number;

  @IsOptional()
  @IsNumber()
  charisma?: number;
}
