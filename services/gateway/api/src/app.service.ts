import { Injectable, Logger } from "@nestjs/common";

@Injectable()
export class AppService {
  private readonly logger = new Logger(AppService.name);

  getGatewayInfo() {
    return {
      name: "Chariot API Gateway",
      version: "1.0.0",
      description: "Centralized API Gateway for Chariot microservices",
      environment: process.env.NODE_ENV,
      endpoints: {
        health: "/health",
        ready: "/ready",
        metrics: "/metrics",
        adventure: "/api/{*path}",
      },
    };
  }
}
