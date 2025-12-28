import { IsString, MaxLength, ValidateNested } from 'class-validator';
import { CreateGroupIdsDto } from '@/resources/campaign/dto/sub/create-group-ids.dto';
import { Type } from 'class-transformer';

export class CreateCampaignDto {
  @IsString()
  @MaxLength(50)
  readonly label: string;

  @IsString()
  readonly description: string;

  @ValidateNested()
  @Type(() => CreateGroupIdsDto)
  groups: CreateGroupIdsDto;
}
