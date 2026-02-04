import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, IsOptional, IsString } from 'class-validator';

export class TreasureDto {

  @ApiProperty({ example: 150 })
  @IsOptional()
  @IsNumber()
  cp?: number; // Copper Pieces

  @ApiProperty({ example: 75 })
  @IsOptional()
  @IsNumber()
  sp?: number; // Silver Pieces

  @ApiProperty({ example: 200 })
  @IsOptional()
  @IsNumber()
  ep?: number; // Electrum Pieces

  @ApiProperty({ example: 500 })
  @IsOptional()
  @IsNumber()
  gp?: number; // Gold Pieces

  @ApiProperty({ example: 20 })
  @IsOptional()
  @IsNumber()
  pp?: number; // Platinum Pieces

  @ApiProperty({ example: 'Found in a hidden chest behind the waterfall.' })
  @IsOptional()
  @IsString()
  treasure?: string;

  @ApiProperty({ example: 'Sword, shield, and leather armor.' })
  @IsOptional()
  @IsString()
  equipment?: string;
}
