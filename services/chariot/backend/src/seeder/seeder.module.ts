import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import {
  Campaign,
  CampaignSchema,
} from '@/resources/campaign/schemas/campaign.schema';
import { Group, GroupSchema } from '@/resources/group/schemas/group.schema';
import { User, UserSchema } from '@/resources/user/schemas/user.schema';
import { SeederService } from '@/seeder/seeder.service';
import {
  Character,
  CharacterSchema,
} from '@/resources/character/core/schemas/character.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Campaign.name, schema: CampaignSchema },
      { name: Character.name, schema: CharacterSchema },
      { name: Group.name, schema: GroupSchema },
      { name: User.name, schema: UserSchema },
    ]),
  ],
  providers: [SeederService],
  exports: [SeederService],
})
export class SeederModule {}
