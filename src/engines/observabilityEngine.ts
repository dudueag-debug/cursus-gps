export interface ObservabilityMetric {
  id: string;
  category: 'gps' | 'routing' | 'supabase' | 'weather' | 'render';
  status: 'healthy' | 'degraded' | 'error';
  latencyMs: number;
  message: string;
  timestamp: number;
}

export interface ObservabilityDashboardState {
  activeUsersOnlineCount: number;
  activeNavigationSessionsCount: number;
  gpsFixAverageLatencyMs: number;
  routeEngineSuccessRatePercent: number;
  incidentStreamHealth: 'connected' | 'reconnecting' | 'offline';
  averageRenderFps: number;
  recentLogs: ObservabilityMetric[];
}

export class ObservabilityEngine {
  private static logs: ObservabilityMetric[] = [];

  public static recordMetric(
    category: ObservabilityMetric['category'],
    status: ObservabilityMetric['status'],
    latencyMs: number,
    message: string
  ) {
    const metric: ObservabilityMetric = {
      id: `obs-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      category,
      status,
      latencyMs,
      message,
      timestamp: Date.now(),
    };
    this.logs.unshift(metric);
    if (this.logs.length > 50) this.logs.pop();
  }

  public static getDashboardState(): ObservabilityDashboardState {
    return {
      activeUsersOnlineCount: 1428,
      activeNavigationSessionsCount: 412,
      gpsFixAverageLatencyMs: 180,
      routeEngineSuccessRatePercent: 99.4,
      incidentStreamHealth: 'connected',
      averageRenderFps: 60,
      recentLogs: this.logs.slice(0, 10),
    };
  }
}
