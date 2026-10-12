import { Router, Request, Response } from 'express';
import { UsageLimiter } from '../services/usageLimiter';

const router = Router();
const startTime = Date.now();

router.get('/', (_req: Request, res: Response) => {
  const uptimeSeconds = Math.floor((Date.now() - startTime) / 1000);
  const memoryUsage = process.memoryUsage();

  res.json({
    status: 'ok',
    service: 'CURSUS GPS Backend Engine',
    uptimeSeconds,
    memoryMb: Math.round(memoryUsage.rss / 1024 / 1024),
    timestamp: new Date().toISOString(),
    apiUsage: UsageLimiter.getUsageStats(),
  });
});

export default router;
