import { Logger, Module } from '@nestjs/common';
import { AppController } from '@/app.controller';
import { AppService } from '@/app.service';
import { ConfigModule } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { UserModule } from '@/resources/user/user.module';
import { GroupModule } from '@/resources/group/group.module';
import { CampaignModule } from '@/resources/campaign/campaign.module';
import { SeederModule } from '@/seeder/seeder.module';
import { AuthModule } from '@/resources/auth/auth.module';
import { MaillingService } from '@/mailling/mailling.service';
import { MaillingModule } from '@/mailling/mailling.module';
import { CharacterModule } from '@/resources/character/character.module';
import { StripeModule } from '@/resources/stripe/stripe.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true, // Permet d'accéder aux variables du env dans tous les modules
    }),
    MongooseModule.forRoot(process.env.MONGO_URL),
    UserModule,
    CharacterModule,
    GroupModule,
    CampaignModule,
    SeederModule,
    AuthModule,
    MaillingModule,
    StripeModule,
  ],
  controllers: [AppController],
  providers: [AppService, Logger, MaillingService],
})
export class AppModule { }
