import { Controller, All, Req, Res, Logger, HttpException, HttpStatus } from "@nestjs/common";
import { Request, Response } from "express";
import { ProxyService } from "./proxy.service";

type RawBodyRequest = Request & { rawBody?: Buffer };

const CORS_HEADERS = [
  "access-control-allow-origin",
  "access-control-allow-credentials",
  "access-control-allow-methods",
  "access-control-allow-headers",
  "access-control-expose-headers",
  "access-control-max-age",
];

async function handleProxy(
  req: Request,
  res: Response,
  serviceName: string,
  urlPrefix: RegExp,
  proxyService: ProxyService,
  logger: Logger,
): Promise<void> {
  try {
    if (req.method === "OPTIONS") {
      res.status(204).end();
      return;
    }

    const strippedPath = req.originalUrl.replace(urlPrefix, "") || "/";
    const fullTargetPath = strippedPath.startsWith("/") ? strippedPath : `/${strippedPath}`;

    logger.debug(`Proxying ${req.method} ${req.originalUrl} → ${serviceName}:${fullTargetPath}`);

    const requestBody = (req as RawBodyRequest).rawBody ?? req.body;

    const response = await proxyService.forward(
      serviceName,
      req.method,
      fullTargetPath,
      requestBody,
      req.headers as Record<string, string>,
    );

    Object.entries(response.headers).forEach(([key, value]) => {
      const lowerKey = key.toLowerCase();
      if (lowerKey !== "transfer-encoding" && !CORS_HEADERS.includes(lowerKey)) {
        res.setHeader(key, value as string);
      }
    });

    res.status(response.status).send(response.data);
  } catch (error: unknown) {
    const proxiedError = error as {
      response?: { status: number; data: unknown };
      status?: number;
      message?: string;
      name?: string;
    };
    const errorMessage = error instanceof Error ? error.message : proxiedError.message || "Unknown proxy error";
    const errorStack = error instanceof Error ? error.stack : undefined;

    logger.error(`Proxy error: ${errorMessage}`, errorStack);

    if (proxiedError.response) {
      res.status(proxiedError.response.status).send(proxiedError.response.data);
    } else if (typeof proxiedError.status === "number") {
      res.status(proxiedError.status).json({
        statusCode: proxiedError.status,
        message: errorMessage,
        error: proxiedError.name || "Error",
      });
    } else {
      throw new HttpException("Service temporarily unavailable", HttpStatus.SERVICE_UNAVAILABLE);
    }
  }
}

@Controller("api")
export class ProxyController {
  private readonly logger = new Logger(ProxyController.name);

  constructor(private readonly proxyService: ProxyService) {}

  @All("*")
  async proxyRequest(@Req() req: Request, @Res() res: Response): Promise<void> {
    await handleProxy(req, res, "adventure", /^\/api/, this.proxyService, this.logger);
  }
}

@Controller("session")
export class SessionProxyController {
  private readonly logger = new Logger(SessionProxyController.name);

  constructor(private readonly proxyService: ProxyService) {}

  @All("*")
  async proxyRequest(@Req() req: Request, @Res() res: Response): Promise<void> {
    await handleProxy(req, res, "session", /^\/session/, this.proxyService, this.logger);
  }
}

@Controller("payment")
export class PaymentProxyController {
  private readonly logger = new Logger(PaymentProxyController.name);

  constructor(private readonly proxyService: ProxyService) {}

  @All("*")
  async proxyRequest(@Req() req: Request, @Res() res: Response): Promise<void> {
    await handleProxy(req, res, "payment", /^\/payment/, this.proxyService, this.logger);
  }
}

@Controller("api/media")
export class MediaProxyController {
  private readonly logger = new Logger(MediaProxyController.name);

  constructor(private readonly proxyService: ProxyService) {}

  @All("*")
  async proxyRequest(@Req() req: Request, @Res() res: Response): Promise<void> {
    await handleProxy(req, res, "media", /^\/api/, this.proxyService, this.logger);
  }
}
