import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsOptional } from 'class-validator';

export class MasteriesAbilityDto {
  @ApiProperty({ example: true })
  @IsOptional()
  @IsBoolean()
  strength?: boolean;

  @ApiProperty({ example: false })
  @IsOptional()
  @IsBoolean()
  dexterity?: boolean;

  @ApiProperty({ example: true })
  @IsOptional()
  @IsBoolean()
  constitution?: boolean;

  @ApiProperty({ example: false })
  @IsOptional()
  @IsBoolean()
  intelligence?: boolean;

  @ApiProperty({ example: true })
  @IsOptional()
  @IsBoolean()
  wisdom?: boolean;

  @ApiProperty({ example: false })
  @IsOptional()
  @IsBoolean()
  charisma?: boolean;
}
