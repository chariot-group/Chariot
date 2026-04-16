import { Logger } from "@nestjs/common";

/**
 * Service configuration interface
 */
export interface ServiceConfig {
  name: string;
  url: string;
  enabled: boolean;
}

/**
 * Services registry configuration
 * Maps service names to their backend URLs based on environment variables
 */
export class ServicesConfig {
  private readonly logger = new Logger(ServicesConfig.name);
  private readonly services: Map<string, ServiceConfig>;

  constructor() {
    this.services = new Map();
    this.loadServicesFromEnv();
  }

  /**
   * Load service configurations from environment variables
   * Expected format: {SERVICE_NAME}_SERVICE_URL
   */
  private loadServicesFromEnv(): void {
    // Scan for services with pattern {NAME}_SERVICE_URL
    Object.keys(process.env).forEach((key) => {
      if (key.endsWith("_SERVICE_URL")) {
        const serviceName = key.replace("_SERVICE_URL", "").toLowerCase().replace(/_/g, "-");
        const serviceUrl = process.env[key];
        if (serviceUrl) {
          this.registerService(serviceName, serviceUrl);
        }
      }
    });

    this.logger.log(`Loaded ${this.services.size} service(s): ${Array.from(this.services.keys()).join(", ")}`);
  }

  /**
   * Register a service in the configuration
   */
  private registerService(name: string, url: string): void {
    this.services.set(name, {
      name,
      url,
      enabled: true,
    });
    this.logger.debug(`Registered service: ${name} -> ${url}`);
  }

  /**
   * Get service configuration by name
   * @throws Error if service is not found
   */
  getService(name: string): ServiceConfig {
    const service = this.services.get(name);
    if (!service) {
      throw new Error(`Service '${name}' is not configured`);
    }
    if (!service.enabled) {
      throw new Error(`Service '${name}' is disabled`);
    }
    return service;
  }

  /**
   * Check if a service exists and is enabled
   */
  hasService(name: string): boolean {
    const service = this.services.get(name);
    return service !== undefined && service.enabled;
  }

  /**
   * Get all registered services
   */
  getAllServices(): ServiceConfig[] {
    return Array.from(this.services.values());
  }

  /**
   * Get all enabled services
   */
  getEnabledServices(): ServiceConfig[] {
    return this.getAllServices().filter((service) => service.enabled);
  }
}
