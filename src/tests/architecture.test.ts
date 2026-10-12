import { describe, it, expect } from 'vitest';
import { routeService } from '../services/routeService';
import { authMiddleware } from '../../server/middleware/auth';
import { createRateLimiter } from '../../server/middleware/rateLimit';
import { UsageLimiter } from '../../server/services/usageLimiter';

describe('CURSUS GPS Architecture & Services Unit Tests', () => {
  it('should estimate expenses correctly across transport modes in routeService', () => {
    // Car 20km trip with tolls
    const carExpenses = routeService.estimateExpenses(20000, 'car', true);
    expect(carExpenses.fuelCostBrl).toBe(11.00); // 20 * 0.55
    expect(carExpenses.tollCostBrl).toBe(8.50);
    expect(carExpenses.totalCostBrl).toBe(19.50);

    // Bike 10km trip (zero fuel, zero tolls)
    const bikeExpenses = routeService.estimateExpenses(10000, 'bike', true);
    expect(bikeExpenses.fuelCostBrl).toBe(0);
    expect(bikeExpenses.tollCostBrl).toBe(0);
    expect(bikeExpenses.totalCostBrl).toBe(0);

    // Motorcycle trip (half toll)
    const motoExpenses = routeService.estimateExpenses(15000, 'motorcycle', true);
    expect(motoExpenses.tollCostBrl).toBe(4.25);
    expect(motoExpenses.fuelCostBrl).toBe(3.00);
  });

  it('should calculate route via routeService.calculateRoutes', async () => {
    const result = await routeService.calculateRoutes(
      { lat: -22.9068, lng: -43.1729 },
      { lat: -22.9711, lng: -43.1822 },
      'car'
    );

    expect(result).toBeDefined();
    expect(result.routes.length).toBeGreaterThan(0);
    expect(result.provider).toBeDefined();
  });

  it('should authenticate guest and bearer sessions in server authMiddleware', () => {
    let nextCalled = false;
    const req: any = { headers: {} };
    const res: any = {};
    const next = () => { nextCalled = true; };

    // 1. Guest fallback
    authMiddleware(req, res, next);
    expect(nextCalled).toBe(true);
    expect(req.user.isGuest).toBe(true);
    expect(req.user.role).toBe('guest');

    // 2. Bearer token
    nextCalled = false;
    const authReq: any = { headers: { authorization: 'Bearer usr_123456789' } };
    authMiddleware(authReq, res, next);
    expect(nextCalled).toBe(true);
    expect(authReq.user.isGuest).toBe(false);
    expect(authReq.user.id).toBe('usr_123456789');
  });

  it('should enforce rate limits and track usage in UsageLimiter', () => {
    const stats = UsageLimiter.getUsageStats();
    expect(stats.dailyGoogleQuota).toBeGreaterThan(0);
    expect(stats.remainingGoogleCalls).toBeGreaterThanOrEqual(0);

    const limiter = createRateLimiter(2, 60000);
    const req: any = { ip: '127.0.0.1' };
    let statusSet = 200;
    const res: any = {
      setHeader: () => {},
      status: (code: number) => { statusSet = code; return res; },
      json: () => {},
    };
    const next = () => {};

    limiter(req, res, next); // 1st
    limiter(req, res, next); // 2nd
    limiter(req, res, next); // 3rd (exceeded)
    expect(statusSet).toBe(429);
  });
});
