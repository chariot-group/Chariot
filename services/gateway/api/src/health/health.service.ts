import { Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { ServicesConfig } from '@/proxy/services.config';

@Injectable()
export class HealthService {
  private readonly logger = new Logger(HealthService.name);
  private readonly servicesConfig: ServicesConfig;

  constructor(private readonly httpService: HttpService) {
    this.servicesConfig = new ServicesConfig();
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
    const checks: Record<string, boolean> = {
      gateway: true,
    };

    // Check all configured services connectivity
    const services = this.servicesConfig.getEnabledServices();

    await Promise.all(
      services.map(async (service) => {
        try {
          const response = await firstValueFrom(
            this.httpService.get(`${service.url}/`, {
              timeout: 5000,
            }),
          );
          checks[service.name] = response.status === 200;
        } catch (error) {
          this.logger.warn(
            `${service.name} service health check failed: ${error.message}`,
          );
          checks[service.name] = false;
        }
      }),
    );

    const isReady = Object.values(checks).every((check) => check === true);

    return {
      status: isReady ? 'ready' : 'not_ready',
      timestamp: new Date().toISOString(),
      checks,
    };
  }
}
