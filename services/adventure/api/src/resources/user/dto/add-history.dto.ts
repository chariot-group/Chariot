import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsNumber, IsString } from 'class-validator';

export class AddHistoryDto {
  @ApiProperty({ example: 'Summer Campaign' })
  @IsNotEmpty()
  @IsString()
  campaignName: string;

  @ApiProperty({ example: 100 })
  @IsNotEmpty()
  @IsNumber()
  value: number;
}
