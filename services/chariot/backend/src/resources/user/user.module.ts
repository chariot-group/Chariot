import { Module } from '@nestjs/common';
import { UserService } from '@/resources/user/user.service';
import { UserController } from '@/resources/user/user.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { User, UserSchema } from '@/resources/user/schemas/user.schema';
import { CampaignModule } from '@/resources/campaign/campaign.module';
import {
  Campaign,
  CampaignSchema,
} from '@/resources/campaign/schemas/campaign.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: User.name, schema: UserSchema },
      { name: Campaign.name, schema: CampaignSchema },
    ]),
    CampaignModule,
  ],
  controllers: [UserController],
  providers: [UserService, UserController],
  exports: [
    MongooseModule.forFeature([{ name: User.name, schema: UserSchema }]),
    UserService,
    UserController,
  ],
})
export class UserModule { }
