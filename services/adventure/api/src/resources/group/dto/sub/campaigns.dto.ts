import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsMongoId, IsNotEmpty } from 'class-validator';

export class CampaignGroupDto {

  @ApiProperty({ example: '507f1f77bcf86cd799439011' })
  @IsMongoId()
  @IsNotEmpty()
  readonly idCampaign: string;

  @ApiProperty({ example: 'active', enum: ['active', 'archived'] })
  @IsEnum(['active', 'archived'], {
    message: "type must be one of 'active' or 'archived'",
  })
  readonly type: 'active' | 'archived';
}
