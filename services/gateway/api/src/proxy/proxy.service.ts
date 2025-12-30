import { Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { AxiosResponse } from 'axios';
import { firstValueFrom } from 'rxjs';

@Injectable()
export class ProxyService {
  private readonly logger = new Logger(ProxyService.name);
  private readonly adventureServiceUrl: string;

  constructor(private readonly httpService: HttpService) {
    this.adventureServiceUrl =
      process.env.ADVENTURE_SERVICE_URL || 'http://chariot-adventure:9000';
    this.logger.log(`Adventure service URL: ${this.adventureServiceUrl}`);
  }

  async forwardToAdventure(
    method: string,
    path: string,
    body?: any,
    headers?: Record<string, string>,
  ): Promise<AxiosResponse> {
    const url = `${this.adventureServiceUrl}${path}`;

    // Clean headers - remove host and connection headers
    const cleanHeaders = { ...headers };
    delete cleanHeaders['host'];
    delete cleanHeaders['connection'];
    delete cleanHeaders['content-length'];

    this.logger.debug(`Forwarding ${method} request to ${url}`);

    try {
      const observable = this.httpService.request({
        method: method.toLowerCase(),
        url,
        data: body,
        headers: cleanHeaders,
        validateStatus: () => true, // Accept all status codes
      });

      const response = await firstValueFrom(observable);

      this.logger.debug(`Received response from adventure: ${response.status}`);
      return response;
    } catch (error) {
      this.logger.error(`Error forwarding to adventure: ${error.message}`, error.stack);
      throw error;
    }
  }
}
