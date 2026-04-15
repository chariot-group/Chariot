import { Injectable, Logger, BadRequestException } from "@nestjs/common";
import { HttpService } from "@nestjs/axios";
import { AxiosResponse } from "axios";
import { firstValueFrom } from "rxjs";
import { ServicesConfig } from "./services.config";

@Injectable()
export class ProxyService {
  private readonly logger = new Logger(ProxyService.name);
  private readonly servicesConfig: ServicesConfig;

  constructor(private readonly httpService: HttpService) {
    this.servicesConfig = new ServicesConfig();
  }

  /**
   * Forward request to the specified service
   * @param serviceName - Name of the target service (e.g., 'adventure', 'users')
   * @param method - HTTP method
   * @param path - Request path (without service prefix)
   * @param body - Request body
   * @param headers - Request headers
   * @returns Axios response
   */
  async forward(
    serviceName: string,
    method: string,
    path: string,
    body?: unknown,
    headers?: Record<string, string>,
  ): Promise<AxiosResponse> {
    // Validate service exists
    if (!this.servicesConfig.hasService(serviceName)) {
      this.logger.warn(`Attempt to access unconfigured service: ${serviceName}`);
      throw new BadRequestException(`Service '${serviceName}' is not available`);
    }

    const service = this.servicesConfig.getService(serviceName);
    const url = `${service.url}${path}`;

    // Clean headers - remove host and connection headers
    const cleanHeaders = { ...headers };
    delete cleanHeaders["host"];
    delete cleanHeaders["connection"];
    delete cleanHeaders["content-length"];

    this.logger.debug(`Forwarding ${method} request to ${serviceName}: ${url}`);

    try {
      const observable = this.httpService.request({
        method: method.toLowerCase(),
        url,
        data: body,
        headers: cleanHeaders,
        validateStatus: () => true, // Accept all status codes
      });

      const response = await firstValueFrom(observable);

      this.logger.debug(`Received response from ${serviceName}: ${response.status}`);
      return response;
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : "Unknown forwarding error";
      const errorStack = error instanceof Error ? error.stack : undefined;
      this.logger.error(`Error forwarding to ${serviceName}: ${errorMessage}`, errorStack);
      throw error;
    }
  }

  /**
   * Legacy method for backward compatibility
   * @deprecated Use forward('adventure', ...) instead
   */
  async forwardToAdventure(
    method: string,
    path: string,
    body?: unknown,
    headers?: Record<string, string>,
  ): Promise<AxiosResponse> {
    return this.forward("adventure", method, path, body, headers);
  }

  /**
   * Check if a service is configured and available
   */
  hasService(serviceName: string): boolean {
    return this.servicesConfig.hasService(serviceName);
  }

  /**
   * Get all configured services
   */
  getAvailableServices(): string[] {
    return this.servicesConfig.getEnabledServices().map((service) => service.name);
  }
}
