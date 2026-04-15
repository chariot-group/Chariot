import { Logger, Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { AppController } from '@/app.controller';
import { AppService } from '@/app.service';
import { ConfigModule } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { GroupModule } from '@/resources/group/group.module';
import { CampaignModule } from '@/resources/campaign/campaign.module';
import { MaillingService } from '@/mailling/mailling.service';
import { MaillingModule } from '@/mailling/mailling.module';
import { CharacterModule } from '@/resources/character/character.module';
import { MetricsModule } from '@/metrics/metrics.module';
import { PrometheusModule } from '@willsoto/nestjs-prometheus';
import { SeederModule } from '@/seeder/seeder.module';
import { UserModule } from '@/resources/user/user.module';
import { KeycloakAuthGuard } from '@/common/guards/keycloak-auth.guard';
import { StripeModule } from '@/resources/stripe/stripe.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      cache: true,
    }),
    MongooseModule.forRoot(process.env.CHARIOT_MONGO_URL),
    CharacterModule,
    GroupModule,
    CampaignModule,
    MaillingModule,
    MetricsModule,
    SeederModule,
    PrometheusModule.register(),
    UserModule,
    StripeModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    Logger,
    MaillingService,
    {
      provide: APP_GUARD,
      useClass: KeycloakAuthGuard,
    },
  ],
})
export class AppModule {}
