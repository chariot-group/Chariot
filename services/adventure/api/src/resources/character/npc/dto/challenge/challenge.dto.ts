import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, IsOptional } from 'class-validator';

export class ChallengeDto {

  @ApiProperty({ example: 3 })
  @IsOptional()
  @IsNumber()
  challengeRating?: number;

  @ApiProperty({ example: 700 })
  @IsOptional()
  @IsNumber()
  experiencePoints?: number;
}
