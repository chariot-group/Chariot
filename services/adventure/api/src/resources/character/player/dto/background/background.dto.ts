import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class BackgroundDto {

  @ApiProperty({ example: 'Brave and cunning.' })
  @IsOptional()
  @IsString()
  personalityTraits?: string;

  @ApiProperty({ example: 'To protect my loved ones at all costs.' })
  @IsOptional()
  @IsString()
  ideals?: string;

  @ApiProperty({ example: 'My family is everything to me.' })
  @IsOptional()
  @IsString()
  bonds?: string;

  @ApiProperty({ example: 'I have a quick temper and a tendency to act before thinking.' })
  @IsOptional()
  @IsString()
  flaws?: string;

  @ApiProperty({ example: 'Member of the Silver Hand organization.' })
  @IsOptional()
  @IsString()
  alliesAndOrgs?: string;

  @ApiProperty({ example: 'Born in a small village, I was trained as a warrior from a young age...' })
  @IsOptional()
  @IsString()
  backstory?: string;
}
