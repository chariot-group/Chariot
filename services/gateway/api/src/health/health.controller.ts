import { Controller, Get, Logger } from "@nestjs/common";
import { SkipThrottle } from "@nestjs/throttler";
import { HealthService } from "./health.service";

@Controller()
export class HealthController {
  private readonly logger = new Logger(HealthController.name);

  constructor(private readonly healthService: HealthService) {}

  @Get("health")
  @SkipThrottle()
  async checkHealth() {
    this.logger.debug("Health check requested");
    return this.healthService.getHealth();
  }

  @Get("ready")
  @SkipThrottle()
  async checkReadiness() {
    this.logger.debug("Readiness check requested");
    return this.healthService.getReadiness();
  }
}
