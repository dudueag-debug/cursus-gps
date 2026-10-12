import type { Coordinates, RouteOption, Occurrence, WeatherData } from '../types';

export interface RerouteOpportunity {
  isBetterRouteAvailable: boolean;
  alternativeRoute: RouteOption;
  timeSavedMinutes: number;
  distanceDeltaKm: number;
  reason: string;
  promptTitle: string;
  promptDescription: string;
}

export interface TrafficForecastAlert {
  willWorsen: boolean;
  predictedDelayMinutes: number;
  timeHorizonMinutes: number;
  alertMessage: string;
}

export class AIPredictionEngine {
  private static lastRerouteCheckTimestamp = 0;
  private static readonly MIN_REROUTE_INTERVAL_MS = 60000; // Check max once per minute to avoid flapping
  private static readonly SIGNIFICANT_TIME_SAVING_SEC = 240; // 4 minutes minimum saving threshold

  /**
   * Forecasts future traffic buildup based on current hour, weekday, active incidents and weather
   */
  public static forecastTrafficTrend(
    currentRoute: RouteOption,
    occurrences: Occurrence[],
    weather: WeatherData | null
  ): TrafficForecastAlert {
    const hour = new Date().getHours();
    const isRushHour = (hour >= 7 && hour <= 9) || (hour >= 17 && hour <= 19);

    let willWorsen = false;
    let predictedDelayMinutes = 0;
    let message = 'Trânsito estável ao longo de toda a rota.';

    if (isRushHour && currentRoute.totalDistanceMeters > 8000) {
      willWorsen = true;
      predictedDelayMinutes = 8;
      message = 'Trânsito provavelmente aumentará nos próximos 20 minutos devido ao horário de pico.';
    }

    if (weather?.isRaining) {
      willWorsen = true;
      predictedDelayMinutes += 5;
      message = 'Chuva no trecho pode desacelerar o fluxo em aproximadamente 12 minutos.';
    }

    return {
      willWorsen,
      predictedDelayMinutes,
      timeHorizonMinutes: 20,
      alertMessage: message,
    };
  }

  /**
   * Smart Rerouting Monitor (Section 9)
   * Detects if an alternative candidate route saves significant time without user getting trapped.
   */
  public static evaluateSmartRerouting(
    activeRoute: RouteOption,
    candidateRoutes: RouteOption[]
  ): RerouteOpportunity | null {
    const now = Date.now();
    if (now - this.lastRerouteCheckTimestamp < this.MIN_REROUTE_INTERVAL_MS) {
      return null;
    }
    this.lastRerouteCheckTimestamp = now;

    if (!candidateRoutes || candidateRoutes.length <= 1) return null;

    // Search for alternative that saves at least SIGNIFICANT_TIME_SAVING_SEC
    for (const alt of candidateRoutes) {
      if (alt.id === activeRoute.id) continue;

      const timeDiff = activeRoute.totalDurationSeconds - alt.totalDurationSeconds;
      if (timeDiff >= this.SIGNIFICANT_TIME_SAVING_SEC) {
        const timeSavedMinutes = Math.round(timeDiff / 60);
        const distanceDeltaKm = parseFloat(((alt.totalDistanceMeters - activeRoute.totalDistanceMeters) / 1000).toFixed(1));

        return {
          isBetterRouteAvailable: true,
          alternativeRoute: alt,
          timeSavedMinutes,
          distanceDeltaKm,
          reason: `Desvio de retenção de tráfego detectado na via principal.`,
          promptTitle: 'Nova Rota Mais Rápida Disponível',
          promptDescription: `Economiza aproximadamente ${timeSavedMinutes} minutos (${alt.title}).`,
        };
      }
    }

    return null;
  }
}
