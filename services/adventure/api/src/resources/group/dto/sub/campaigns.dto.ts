import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsMongoId, IsNotEmpty } from 'class-validator';

export class CampaignGroupDto {

  @ApiProperty({ example: '507f1f77bcf86cd799439011' })
  @IsMongoId()
  @IsNotEmpty()
  readonly idCampaign: string;

  @ApiProperty({ example: 'main', enum: ['main', 'npc', 'archived'] })
  @IsEnum(['main', 'npc', 'archived'], {
    message: "type must be one of 'npc', 'pc', or 'archived'",
  })
  readonly type: 'main' | 'npc' | 'archived';
}
