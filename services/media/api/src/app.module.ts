import { Logger, Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { ConfigModule } from '@nestjs/config';
import { MediaModule } from '@/resources/media/media.module';
import { HealthModule } from '@/health/health.module';
import { KeycloakAuthGuard } from '@/common/guards/keycloak-auth.guard';
import { MetricsModule } from '@/metrics/metrics.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      cache: true,
    }),
    MediaModule,
    HealthModule,
    MetricsModule,
  ],
  providers: [
    Logger,
    {
      provide: APP_GUARD,
      useClass: KeycloakAuthGuard,
    },
  ],
})
export class AppModule {}
