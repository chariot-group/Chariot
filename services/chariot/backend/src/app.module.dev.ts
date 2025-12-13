import { Logger, Module } from '@nestjs/common';
import { AppController } from '@/app.controller';
import { AppService } from '@/app.service';
import { ConfigModule } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { GroupModule } from '@/resources/group/group.module';
import { CampaignModule } from '@/resources/campaign/campaign.module';
import { AuthModule } from '@/resources/auth/auth.module';
import { MaillingService } from '@/mailling/mailling.service';
import { MaillingModule } from '@/mailling/mailling.module';
import { CharacterModule } from '@/resources/character/character.module';
import { SeederModule } from '@/seeder/seeder.module';
import { MetricsModule } from '@/metrics/metrics.module';
import { PrometheusModule } from '@willsoto/nestjs-prometheus';

@Module({
    imports: [
        ConfigModule.forRoot({
            isGlobal: true, // Permet d'accéder aux variables du env dans tous les modules
        }),
        MongooseModule.forRoot(process.env.CHARIOT_MONGO_URL),
        CharacterModule,
        GroupModule,
        CampaignModule,
        AuthModule,
        MaillingModule,
        SeederModule, // Seeder uniquement en dev
        MetricsModule,
        PrometheusModule.register()
    ],
    controllers: [AppController],
    providers: [AppService, Logger, MaillingService],
})
export class AppModuleDev { }
