import {
  IsArray,
  IsEnum,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class PresignedReadItemDto {
  @ApiProperty({ enum: ['character', 'user'] })
  @IsEnum(['character', 'user'])
  scope: 'character' | 'user';

  @ApiProperty({ example: '507f1f77bcf86cd799439011' })
  @IsString()
  id: string;

  @ApiProperty({ enum: ['main', 'thumb'], default: 'main' })
  @IsEnum(['main', 'thumb'])
  variant: 'main' | 'thumb';
}

export class PresignedReadDto {
  @ApiProperty({ type: [PresignedReadItemDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PresignedReadItemDto)
  requests: PresignedReadItemDto[];

  @ApiPropertyOptional({
    description: 'Session OTP code for roster-based character access',
  })
  @IsOptional()
  @IsString()
  sessionCode?: string;
}

export class PresignedUrlResultDto {
  @ApiProperty({ nullable: true })
  url: string | null;

  @ApiProperty({ nullable: true })
  expiresAt: string | null;

  @ApiProperty({ enum: ['external', 'presigned', 'missing'] })
  source: 'external' | 'presigned' | 'missing';
}
