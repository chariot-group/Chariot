import {
  IsArray,
  IsMongoId,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
  ValidateNested,
} from 'class-validator';
import { CampaignGroupDto } from '@/resources/group/dto/sub/campaigns.dto';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

export class CreateGroupDto {

  @ApiProperty({ example: 'Adventurers' })
  @IsString()
  @MinLength(1)
  @MaxLength(50)
  readonly label: string;

  @ApiProperty({ example: 'A group of brave adventurers.' })
  @IsString()
  @IsOptional()
  readonly description?: string;

  @ApiProperty({ example: ['507f1f77bcf86cd799439011', '507f1f77bcf86cd799439012'] })
  @IsArray()
  @IsOptional()
  @IsMongoId({ each: true })
  readonly characters?: string[];

  @ApiProperty({ type: [CampaignGroupDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CampaignGroupDto)
  readonly campaigns: CampaignGroupDto[];
}
