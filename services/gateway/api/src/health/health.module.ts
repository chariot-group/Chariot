import { Module } from "@nestjs/common";
import { HttpModule } from "@nestjs/axios";
import { HealthController } from "./health.controller";
import { HealthService } from "./health.service";
import { ServicesConfigModule } from "@/proxy/services.config.module";

@Module({
  imports: [HttpModule, ServicesConfigModule],
  controllers: [HealthController],
  providers: [HealthService],
})
export class HealthModule {}
