import { IsString, MaxLength, ValidateNested } from 'class-validator';
import { CreateGroupIdsDto } from '@/resources/campaign/dto/sub/create-group-ids.dto';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

export class CreateCampaignDto {

  @ApiProperty({ example: "Epic Adventure" })
  @IsString()
  @MaxLength(50)
  readonly label: string;

  @ApiProperty({ type: CreateGroupIdsDto })
  @ValidateNested()
  @Type(() => CreateGroupIdsDto)
  groups: CreateGroupIdsDto;
}
