import { Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';

@Injectable()
export class HealthService {
  private readonly logger = new Logger(HealthService.name);
  private readonly adventureServiceUrl: string;

  constructor(private readonly httpService: HttpService) {
    this.adventureServiceUrl =
      process.env.ADVENTURE_SERVICE_URL || 'http://chariot-adventure:9000';
  }

  async getHealth() {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      service: 'chariot-gateway',
      version: '1.0.0',
    };
  }

  async getReadiness() {
    const checks = {
      gateway: true,
      adventure: false,
    };

    // Check adventure service connectivity
    try {
      const response = await firstValueFrom(
        this.httpService.get(`${this.adventureServiceUrl}/`, {
          timeout: 5000,
        }),
      );
      checks.adventure = response.status === 200;
    } catch (error) {
      this.logger.warn(`Adventure service health check failed: ${error.message}`);
      checks.adventure = false;
    }

    const isReady = Object.values(checks).every(check => check === true);

    return {
      status: isReady ? 'ready' : 'not_ready',
      timestamp: new Date().toISOString(),
      checks,
    };
  }
}
