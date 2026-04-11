import { Controller, All, Req, Res, Logger, HttpException, HttpStatus } from "@nestjs/common";
import { Request, Response } from "express";
import { ProxyService } from "@/proxy/proxy.service";

@Controller("api")
export class ProxyController {
  private readonly logger = new Logger(ProxyController.name);

  constructor(private readonly proxyService: ProxyService) { }

  @All("*")
  async proxyRequest(@Req() req: Request, @Res() res: Response) {
    try {
      // Handle OPTIONS preflight requests locally (CORS)
      // Do not forward to backend services
      if (req.method === "OPTIONS") {
        return res.status(204).end();
      }

      // Extract service name and path from URL
      // Expected format: /api/{service}/{path}
      const urlWithoutPrefix = req.originalUrl.replace(/^\/api/, "");
      const segments = urlWithoutPrefix.split("/").filter(Boolean);

      if (segments.length === 0) {
        // No service specified - return available services
        const services = this.proxyService.getAvailableServices();
        return res.status(200).json({
          message: "API Gateway",
          available_services: services,
        });
      }

      // Check if first segment is a configured service
      const potentialService = segments[0];
      let serviceName: string;
      let targetPath: string;

      if (this.proxyService.hasService(potentialService)) {
        // First segment is a service name: /api/{service}/{path}
        serviceName = potentialService;
        targetPath = "/" + segments.slice(1).join("/");
      } else {
        // No service specified in path, cannot route
        this.logger.warn(`No service specified for path: ${req.originalUrl}`);
        return res.status(404).json({
          message: "Not Found",
          error: `No service specified in the URL. Please use /api/{service-name}/{path}.`,
          available_services: this.proxyService.getAvailableServices(),
        });
      }

      // Preserve query string if present
      const queryString = req.originalUrl.includes("?") ? "?" + req.originalUrl.split("?")[1] : "";
      const fullTargetPath = targetPath + queryString;

      this.logger.debug(`Proxying request to ${serviceName} service: ${req.method} ${fullTargetPath}`);

      const requestBody = (req as any).rawBody ?? req.body;

      const response = await this.proxyService.forward(
        serviceName,
        req.method,
        fullTargetPath,
        requestBody,
        req.headers as Record<string, string>,
      );

      // Forward response headers but filter out CORS headers
      // CORS is managed at gateway level only
      const corsHeaders = [
        "access-control-allow-origin",
        "access-control-allow-credentials",
        "access-control-allow-methods",
        "access-control-allow-headers",
        "access-control-expose-headers",
        "access-control-max-age",
      ];

      Object.entries(response.headers).forEach(([key, value]) => {
        const lowerKey = key.toLowerCase();
        if (lowerKey !== "transfer-encoding" && !corsHeaders.includes(lowerKey)) {
          res.setHeader(key, value as string);
        }
      });

      res.status(response.status).send(response.data);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.logger.error(`Proxy error: ${errorMessage}`, error instanceof Error ? error.stack : undefined);

      if (error instanceof HttpException) {
        res.status(error.getStatus()).json(error.getResponse());
      } else if (error && typeof error === "object" && "response" in error) {
        const errorResponse = error.response as { status?: number; data?: any };
        res.status(errorResponse.status || 500).send(errorResponse.data);
      } else {
        throw new HttpException("Service temporarily unavailable", HttpStatus.SERVICE_UNAVAILABLE);
      }
    }
  }
}
