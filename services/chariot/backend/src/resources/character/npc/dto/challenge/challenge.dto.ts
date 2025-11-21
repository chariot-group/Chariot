import { IsNumber, IsOptional } from 'class-validator';

export class ChallengeDto {
  @IsOptional()
  @IsNumber()
  challengeRating?: number;

  @IsOptional()
  @IsNumber()
  experiencePoints?: number;
}
