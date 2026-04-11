import { IsInt, IsOptional, Max, Min } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class DeathSavesDto {
  @ApiProperty({
    example: 0,
    description: 'Number of successful death saving throws (0-3)',
    minimum: 0,
    maximum: 3,
    required: false,
  })
  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(3)
  successes?: number;

  @ApiProperty({
    example: 0,
    description:
      'Number of failed death saving throws (0-3). Three failures means death.',
    minimum: 0,
    maximum: 3,
    required: false,
  })
  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(3)
  failures?: number;
}
