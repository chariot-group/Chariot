import { IsNumber, IsOptional } from 'class-validator';

export class SkillDto {
  @IsOptional()
  @IsNumber()
  athletics?: number;

  @IsOptional()
  @IsNumber()
  acrobatics?: number;

  @IsOptional()
  @IsNumber()
  sleightHand?: number;

  @IsOptional()
  @IsNumber()
  stealth?: number;

  @IsOptional()
  @IsNumber()
  arcana?: number;

  @IsOptional()
  @IsNumber()
  history?: number;

  @IsOptional()
  @IsNumber()
  investigation?: number;

  @IsOptional()
  @IsNumber()
  nature?: number;

  @IsOptional()
  @IsNumber()
  religion?: number;

  @IsOptional()
  @IsNumber()
  animalHandling?: number;

  @IsOptional()
  @IsNumber()
  insight?: number;

  @IsOptional()
  @IsNumber()
  medicine?: number;

  @IsOptional()
  @IsNumber()
  perception?: number;

  @IsOptional()
  @IsNumber()
  survival?: number;

  @IsOptional()
  @IsNumber()
  deception?: number;

  @IsOptional()
  @IsNumber()
  intimidation?: number;

  @IsOptional()
  @IsNumber()
  performance?: number;

  @IsOptional()
  @IsNumber()
  persuasion?: number;
}
