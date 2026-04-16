import { Logger, Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { AppController } from '@/app.controller';
import { AppService } from '@/app.service';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from '@/prisma/prisma.module';
import { RedisModule } from '@/redis/redis.module';
import { MetricsModule } from '@/metrics/metrics.module';
import { PrometheusModule } from '@willsoto/nestjs-prometheus';
import { KeycloakAuthGuard } from '@/common/guards/keycloak-auth.guard';
import { SessionModule } from '@/resources/session/session.module';

@Module({
    imports: [
        ConfigModule.forRoot({
            isGlobal: true,
            cache: true,
        }),
        PrismaModule,
        RedisModule,
        SessionModule,
        MetricsModule,
        PrometheusModule.register(),
    ],
    controllers: [AppController],
    providers: [
        AppService,
        Logger,
        {
            provide: APP_GUARD,
            useClass: KeycloakAuthGuard,
        },
    ],
})
export class AppModule { }
