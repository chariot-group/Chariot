import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsOptional, IsString } from 'class-validator';

export class DamageDto {

  @ApiProperty({ example: '2d6+3' })
  @IsOptional()
  @IsString()
  dice?: string;

  @ApiProperty({ example: 'fire' })
  @IsOptional()
  @IsString()
  type?: string;

  @ApiProperty({ example: true, description: 'Automatically applies ability modifier to this damage dice expression.' })
  @IsOptional()
  @IsBoolean()
  applyAbilityBonus?: boolean;
}
