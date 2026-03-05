import { Controller, Get, Logger } from "@nestjs/common";
import { AppService } from "@/app.service";
import { SkipThrottle } from "@nestjs/throttler";

@Controller()
export class AppController {
  private readonly logger = new Logger(AppController.name);

  constructor(private readonly appService: AppService) {}

  @Get()
  @SkipThrottle()
  getInfo() {
    this.logger.log("Gateway info requested");
    return this.appService.getGatewayInfo();
  }
}
