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

export class CreateGroupDto {
  @IsString()
  @MinLength(1)
  @MaxLength(50)
  readonly label: string;

  @IsString()
  @IsOptional()
  readonly description?: string;

  @IsArray()
  @IsOptional()
  @IsMongoId({ each: true })
  readonly characters?: string[];

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CampaignGroupDto)
  readonly campaigns: CampaignGroupDto[];
}
