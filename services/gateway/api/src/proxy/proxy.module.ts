import { Module } from "@nestjs/common";
import { HttpModule } from "@nestjs/axios";
import {
  ProxyController,
  SessionProxyController,
  PaymentProxyController,
  MediaProxyController,
} from "@/proxy/proxy.controller";
import { ProxyService } from "@/proxy/proxy.service";
import { ServicesConfigModule } from "@/proxy/services.config.module";
import { MetricsModule } from "@/metrics/metrics.module";

@Module({
  imports: [
    HttpModule.register({
      timeout: 30000,
      maxRedirects: 5,
    }),
    ServicesConfigModule,
    MetricsModule,
  ],
  controllers: [MediaProxyController, ProxyController, SessionProxyController, PaymentProxyController],
  providers: [ProxyService],
})
export class ProxyModule {}
