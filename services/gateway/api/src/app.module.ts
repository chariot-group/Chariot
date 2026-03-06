import { Module, Logger } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { ThrottlerModule, ThrottlerGuard } from "@nestjs/throttler";
import { APP_GUARD, APP_INTERCEPTOR } from "@nestjs/core";
import { HttpModule } from "@nestjs/axios";
import { PrometheusModule } from "@willsoto/nestjs-prometheus";
import { AppController } from "@/app.controller";
import { AppService } from "@/app.service";
import { ProxyModule } from "@/proxy/proxy.module";
import { HealthModule } from "@/health/health.module";
import { LoggingInterceptor } from "@/common/interceptors/logging.interceptor";
import { MetricsModule } from "@/metrics/metrics.module";

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ".env",
    }),
    ThrottlerModule.forRoot([
      {
        name: "default",
        ttl: parseInt(process.env.GATEWAY_RATE_LIMIT_WINDOW || "60000", 10),
        limit: parseInt(process.env.GATEWAY_RATE_LIMIT_MAX || "100", 10),
      },
    ]),
    PrometheusModule.register({
      path: "/metrics",
      defaultMetrics: {
        enabled: true,
      },
    }),
    HttpModule,
    MetricsModule,
    ProxyModule,
    HealthModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    Logger,
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: LoggingInterceptor,
    },
  ],
})
export class AppModule {}
