import {
  IsString,
  IsNotEmpty,
  MaxLength,
  IsUrl,
  IsOptional,
  IsBoolean,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateQuickLinkDto {
  @ApiProperty({ example: 'Link', required: false })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  readonly icon?: string;

  @ApiProperty({ example: 'https://example.com', required: false })
  @IsOptional()
  @IsUrl({ protocols: ['http', 'https'], require_protocol: true })
  readonly url?: string;

  @ApiProperty({ example: 'Mon lien', required: false })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @MaxLength(60)
  readonly label?: string;

  @ApiProperty({ example: false, required: false })
  @IsOptional()
  @IsBoolean()
  readonly visibleInAllCampaigns?: boolean;

  @ApiProperty({ example: false, required: false })
  @IsOptional()
  @IsBoolean()
  readonly visibleInPlayerSpace?: boolean;
}
