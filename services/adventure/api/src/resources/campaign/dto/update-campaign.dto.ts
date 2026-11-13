import { PartialType, OmitType } from '@nestjs/mapped-types';
import { CreateCampaignDto } from '@/resources/campaign/dto/create-campaign.dto';
import { IsOptional, IsString, MaxLength, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { NAME_LABEL_MAX_LENGTH } from '@/common/constants/label.constant';

export class UpdateCampaignDto extends PartialType(
  OmitType(CreateCampaignDto, ['label', 'gameSystem'] as const),
) {
  /** @see FR-form-field-validation — same 1..50 limit as on creation */
  @ApiProperty({ example: 'Epic Adventure', required: false })
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(NAME_LABEL_MAX_LENGTH)
  readonly label?: string;
}
