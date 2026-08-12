import { Request, Response, NextFunction } from 'express';

/**
 * Protects GET /metrics with HTTP Basic Auth.
 * If METRICS_BASIC_AUTH_USER/PASSWORD are unset, allows access only outside production/integ.
 */
export function metricsBasicAuthMiddleware(
  req: Request,
  res: Response,
  next: NextFunction,
): void {
  const path = req.path || req.url?.split('?')[0] || '';
  if (path !== '/metrics') {
    next();
    return;
  }

  const user = process.env.METRICS_BASIC_AUTH_USER;
  const pass = process.env.METRICS_BASIC_AUTH_PASSWORD;
  const env = process.env.NODE_ENV || 'development';

  if (!user || !pass) {
    if (env === 'production' || env === 'integ') {
      res.status(503).send('Metrics authentication is not configured');
      return;
    }
    next();
    return;
  }

  const header = req.headers.authorization;
  if (!header?.startsWith('Basic ')) {
    res.setHeader('WWW-Authenticate', 'Basic realm="metrics"');
    res.status(401).send('Unauthorized');
    return;
  }

  const decoded = Buffer.from(header.slice(6), 'base64').toString('utf8');
  const sep = decoded.indexOf(':');
  const providedUser = sep >= 0 ? decoded.slice(0, sep) : '';
  const providedPass = sep >= 0 ? decoded.slice(sep + 1) : '';

  if (providedUser !== user || providedPass !== pass) {
    res.setHeader('WWW-Authenticate', 'Basic realm="metrics"');
    res.status(401).send('Unauthorized');
    return;
  }

  next();
}
