import { Module, Logger } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { APP_INTERCEPTOR } from "@nestjs/core";
import { HttpModule } from "@nestjs/axios";
import { PrometheusModule } from "@willsoto/nestjs-prometheus";
import { AppController } from "@/app.controller";
import { AppService } from "@/app.service";
import { ProxyModule } from "@/proxy/proxy.module";
import { HealthModule } from "@/health/health.module";
import { LoggingInterceptor } from "@/common/interceptors/logging.interceptor";
import { MetricsModule } from "@/metrics/metrics.module";
import { MetricsInterceptor } from "@/metrics/metrics.interceptor";

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ".env",
    }),
    PrometheusModule.register({
      path: "/metrics",
      defaultMetrics: {
        enabled: true,
      },
      defaultLabels: {
        app: "chariot",
        service: "gateway",
      },
    }),
    MetricsModule,
    HttpModule,
    ProxyModule,
    HealthModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    Logger,
    {
      provide: APP_INTERCEPTOR,
      useClass: LoggingInterceptor,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: MetricsInterceptor,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: MetricsInterceptor,
    },
  ],
})
export class AppModule {}
