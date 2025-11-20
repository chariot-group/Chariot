import { IsNumber, IsOptional, IsString } from 'class-validator';

export class TreasureDto {
  @IsOptional()
  @IsNumber()
  cp?: number; // Copper Pieces

  @IsOptional()
  @IsNumber()
  sp?: number; // Silver Pieces

  @IsOptional()
  @IsNumber()
  ep?: number; // Electrum Pieces

  @IsOptional()
  @IsNumber()
  gp?: number; // Gold Pieces

  @IsOptional()
  @IsNumber()
  pp?: number; // Platinum Pieces

  @IsOptional()
  @IsString()
  notes?: string;
}
