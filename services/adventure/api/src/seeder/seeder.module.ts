import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import {
  Campaign,
  CampaignSchema,
} from '@/resources/campaign/schemas/campaign.schema';
import { Group, GroupSchema } from '@/resources/group/schemas/group.schema';
import { SeederService } from '@/seeder/seeder.service';
import {
  Character,
  CharacterSchema,
} from '@/resources/character/core/schemas/character.schema';
import { KeycloakAdminService } from '@/seeder/keycloak-admin.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Campaign.name, schema: CampaignSchema },
      { name: Character.name, schema: CharacterSchema },
      { name: Group.name, schema: GroupSchema },
    ]),
  ],
  providers: [SeederService, KeycloakAdminService],
  exports: [SeederService],
})
export class SeederModule { }
