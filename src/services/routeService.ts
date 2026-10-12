import type { Coordinates, RouteOption, TransportMode } from '../types';
import { RoutingManager, type RouteCalculationParams, type RoutingProviderResult } from './routingProviderService';
import { api } from './api';

export interface RoutePreferences {
  avoidTolls?: boolean;
  avoidHighways?: boolean;
  prioritizeSafety?: boolean;
}

export const routeService = {
  /**
   * Calculates routes using the hybrid routing architecture (OSRM, Google, Mapbox, Offline)
   */
  async calculateRoutes(
    origin: Coordinates,
    destination: Coordinates,
    mode: TransportMode = 'car',
    preferences?: RoutePreferences
  ): Promise<RoutingProviderResult> {
    const params: RouteCalculationParams = {
      origin,
      destination,
      mode,
      avoidTolls: preferences?.avoidTolls,
    };

    return RoutingManager.calculateRoute(params);
  },

  /**
   * Quick shortcut to get fastest single route
   */
  async getBestRoute(
    origin: Coordinates,
    destination: Coordinates,
    mode: TransportMode = 'car',
    preferences?: RoutePreferences
  ): Promise<RouteOption | null> {
    const result = await this.calculateRoutes(origin, destination, mode, preferences);
    return result.routes && result.routes.length > 0 ? result.routes[0] : null;
  },

  /**
   * Estimate toll and fuel expenses for a route
   */
  estimateExpenses(distanceMeters: number, mode: TransportMode, hasTolls: boolean): { fuelCostBrl: number; tollCostBrl: number; totalCostBrl: number } {
    const km = distanceMeters / 1000;
    let fuelPerKm = 0.55; // Average ~11 km/L at R$ 6.00/L

    if (mode === 'motorcycle') fuelPerKm = 0.20; // ~30 km/L
    else if (mode === 'truck') fuelPerKm = 1.80; // ~3.5 km/L diesel
    else if (mode === 'bike' || mode === 'walk') fuelPerKm = 0;

    const fuelCostBrl = Number((km * fuelPerKm).toFixed(2));
    const isNonTollMode = mode === 'bike' || mode === 'walk';
    const tollCostBrl = hasTolls && !isNonTollMode ? (mode === 'motorcycle' ? 4.25 : mode === 'truck' ? 17.00 : 8.50) : 0;
    const totalCostBrl = Number((fuelCostBrl + tollCostBrl).toFixed(2));

    return { fuelCostBrl, tollCostBrl, totalCostBrl };
  },
};
