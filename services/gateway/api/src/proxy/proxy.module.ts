import { Module } from "@nestjs/common";
import { HttpModule } from "@nestjs/axios";
import { ProxyController, SessionProxyController } from "@/proxy/proxy.controller";
import { ProxyService } from "@/proxy/proxy.service";

@Module({
  imports: [
    HttpModule.register({
      timeout: 30000,
      maxRedirects: 5,
    }),
  ],
  controllers: [ProxyController, SessionProxyController],
  providers: [ProxyService],
})
export class ProxyModule {}
