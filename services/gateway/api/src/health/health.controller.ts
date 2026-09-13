import { Controller, Get, Logger, Res } from "@nestjs/common";
import { SkipThrottle } from "@nestjs/throttler";
import { Response } from "express";
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
  async checkReadiness(@Res({ passthrough: true }) res: Response) {
    this.logger.debug("Readiness check requested");
    const readiness = await this.healthService.getReadiness();
    if (readiness.status !== "ready") {
      res.status(503);
    }
    return readiness;
  }
}
