import { Request, Response, NextFunction } from 'express';

interface RateLimitRecord {
  count: number;
  resetTime: number;
}

const ipHits = new Map<string, RateLimitRecord>();

/**
 * In-memory IP rate limiter middleware
 */
export function createRateLimiter(maxRequests: number = 100, windowMs: number = 60000) {
  return (req: Request, res: Response, next: NextFunction) => {
    const ip = req.ip || req.socket.remoteAddress || 'unknown-client';
    const now = Date.now();

    const record = ipHits.get(ip);
    if (!record || now > record.resetTime) {
      ipHits.set(ip, { count: 1, resetTime: now + windowMs });
      return next();
    }

    record.count++;
    if (record.count > maxRequests) {
      const retryAfter = Math.ceil((record.resetTime - now) / 1000);
      res.setHeader('Retry-After', retryAfter);
      return res.status(429).json({
        error: 'Limite de requisições excedido. Aguarde alguns segundos.',
        retryAfterSeconds: retryAfter,
      });
    }

    return next();
  };
}

export const standardRateLimit = createRateLimiter(120, 60000); // 120 req/min
export const strictRoutingRateLimit = createRateLimiter(60, 60000); // 60 routes/min
