import { IsEnum, IsMongoId, IsNotEmpty } from 'class-validator';

export class CampaignGroupDto {
  @IsMongoId()
  @IsNotEmpty()
  readonly idCampaign: string;

  @IsEnum(['main', 'npc', 'archived'], {
    message: "type must be one of 'npc', 'pc', or 'archived'",
  })
  readonly type: 'main' | 'npc' | 'archived';
}
