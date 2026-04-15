import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsDate, IsNotEmpty, IsNumber, IsString } from 'class-validator';

export class HistoryDto {
  @ApiProperty({ example: '2024-01-15T10:30:00Z' })
  @IsNotEmpty()
  @IsDate()
  @Type(() => Date)
  date: Date;

  @ApiProperty({ example: 'Summer Campaign' })
  @IsNotEmpty()
  @IsString()
  campaignName: string;

  @ApiProperty({ example: 100 })
  @IsNotEmpty()
  @IsNumber()
  value: number;
}
