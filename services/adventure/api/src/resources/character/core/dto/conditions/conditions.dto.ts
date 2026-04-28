import { IsBoolean, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ConditionsDto {
  @ApiProperty({
    example: false,
    description: 'Character is blinded',
    required: false,
  })
  @IsOptional()
  @IsBoolean()
  blinded?: boolean;

  @ApiProperty({
    example: false,
    description: 'Character is charmed',
    required: false,
  })
  @IsOptional()
  @IsBoolean()
  charmed?: boolean;

  @ApiProperty({
    example: false,
    description: 'Character is deafened',
    required: false,
  })
  @IsOptional()
  @IsBoolean()
  deafened?: boolean;

  @ApiProperty({
    example: false,
    description: 'Character is frightened',
    required: false,
  })
  @IsOptional()
  @IsBoolean()
  frightened?: boolean;

  @ApiProperty({
    example: false,
    description: 'Character is grappled',
    required: false,
  })
  @IsOptional()
  @IsBoolean()
  grappled?: boolean;

  @ApiProperty({
    example: false,
    description: 'Character is incapacitated',
    required: false,
  })
  @IsOptional()
  @IsBoolean()
  incapacitated?: boolean;

  @ApiProperty({
    example: false,
    description: 'Character is invisible',
    required: false,
  })
  @IsOptional()
  @IsBoolean()
  invisible?: boolean;

  @ApiProperty({
    example: false,
    description: 'Character is paralyzed',
    required: false,
  })
  @IsOptional()
  @IsBoolean()
  paralyzed?: boolean;

  @ApiProperty({
    example: false,
    description: 'Character is petrified',
    required: false,
  })
  @IsOptional()
  @IsBoolean()
  petrified?: boolean;

  @ApiProperty({
    example: false,
    description: 'Character is poisoned',
    required: false,
  })
  @IsOptional()
  @IsBoolean()
  poisoned?: boolean;

  @ApiProperty({
    example: false,
    description: 'Character is prone',
    required: false,
  })
  @IsOptional()
  @IsBoolean()
  prone?: boolean;

  @ApiProperty({
    example: false,
    description: 'Character is restrained',
    required: false,
  })
  @IsOptional()
  @IsBoolean()
  restrained?: boolean;

  @ApiProperty({
    example: false,
    description: 'Character is stunned',
    required: false,
  })
  @IsOptional()
  @IsBoolean()
  stunned?: boolean;

  @ApiProperty({
    example: false,
    description: 'Character is unconscious',
    required: false,
  })
  @IsOptional()
  @IsBoolean()
  unconscious?: boolean;
}
