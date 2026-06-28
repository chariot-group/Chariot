import { PartialType, OmitType } from '@nestjs/mapped-types';
import { CreateCampaignDto } from '@/resources/campaign/dto/create-campaign.dto';
import { IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateCampaignDto extends PartialType(
  OmitType(CreateCampaignDto, ['label', 'gameSystem'] as const),
) {
  @ApiProperty({ example: 'Epic Adventure' })
  @IsOptional()
  readonly label?: string;
}
