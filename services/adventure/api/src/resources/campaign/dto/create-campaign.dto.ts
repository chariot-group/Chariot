import {
  IsString,
  MaxLength,
  ValidateNested,
  IsEnum,
  IsOptional,
} from 'class-validator';
import { CreateGroupIdsDto } from '@/resources/campaign/dto/sub/create-group-ids.dto';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';
import {
  DEFAULT_GAME_SYSTEM,
  GAME_SYSTEMS,
  GameSystem,
} from '@/common/constants/game-system.constant';

export class CreateCampaignDto {
  @ApiProperty({ example: 'Epic Adventure' })
  @IsString()
  @MaxLength(50)
  readonly label: string;

  @ApiProperty({
    example: DEFAULT_GAME_SYSTEM,
    enum: GAME_SYSTEMS,
    default: DEFAULT_GAME_SYSTEM,
    required: false,
  })
  @IsOptional()
  @IsEnum(GAME_SYSTEMS, { message: 'gameSystem must be a valid game system' })
  readonly gameSystem?: GameSystem;

  @ApiProperty({ type: CreateGroupIdsDto })
  @ValidateNested()
  @Type(() => CreateGroupIdsDto)
  groups: CreateGroupIdsDto;
}
