import { useState, useEffect, useCallback } from 'react';
import type { Coordinates, RouteOption, RouteStep, TransportMode } from '../types';
import { MapMatchingService, type MapMatchingResult } from '../services/mapMatchingService';
import { routeService } from '../services/routeService';

export interface NavigationHookState {
  isNavigating: boolean;
  activeRoute: RouteOption | null;
  matchResult: MapMatchingResult | null;
  isRecalculating: boolean;
  remainingDistanceMeters: number;
  currentStreetName: string;
  isDeadReckoning: boolean;
  startNavigation: (route: RouteOption) => void;
  stopNavigation: () => void;
  recalculateRoute: (currentCoords: Coordinates, mode?: TransportMode) => Promise<void>;
}

export function useNavigation(currentCoords: Coordinates): NavigationHookState {
  const [isNavigating, setIsNavigating] = useState<boolean>(false);
  const [activeRoute, setActiveRoute] = useState<RouteOption | null>(null);
  const [matchResult, setMatchResult] = useState<MapMatchingResult | null>(null);
  const [isRecalculating, setIsRecalculating] = useState<boolean>(false);
  const [remainingDistanceMeters, setRemainingDistanceMeters] = useState<number>(0);
  const [currentStreetName, setCurrentStreetName] = useState<string>('Via Principal');

  // Map Matching and Off-Route tracking
  useEffect(() => {
    if (!isNavigating || !activeRoute) return;

    const match = MapMatchingService.matchPosition(currentCoords, activeRoute);
    setMatchResult(match);
    if (match.streetName) setCurrentStreetName(match.streetName);
    setRemainingDistanceMeters(match.remainingDistanceMeters);

    if (match.needsRecalculation && !isRecalculating) {
      handleAutoRecalculate();
    }
  }, [currentCoords, isNavigating, activeRoute, isRecalculating]);

  const handleAutoRecalculate = useCallback(async () => {
    if (!activeRoute || isRecalculating) return;
    setIsRecalculating(true);
    try {
      const destCoords = activeRoute.coordinates[activeRoute.coordinates.length - 1];
      const result = await routeService.calculateRoutes(currentCoords, destCoords, activeRoute.mode);
      if (result.routes && result.routes.length > 0) {
        setActiveRoute(result.routes[0]);
        MapMatchingService.resetOffRouteCounter();
      }
    } catch (e) {
      console.warn('Auto recalculate notice:', e);
    } finally {
      setTimeout(() => setIsRecalculating(false), 1200);
    }
  }, [activeRoute, currentCoords, isRecalculating]);

  const startNavigation = useCallback((route: RouteOption) => {
    setActiveRoute(route);
    setIsNavigating(true);
    MapMatchingService.resetOffRouteCounter();
  }, []);

  const stopNavigation = useCallback(() => {
    setIsNavigating(false);
    setActiveRoute(null);
    setMatchResult(null);
    MapMatchingService.resetOffRouteCounter();
  }, []);

  const recalculateRoute = useCallback(async (coords: Coordinates, mode?: TransportMode) => {
    if (!activeRoute) return;
    setIsRecalculating(true);
    try {
      const destCoords = activeRoute.coordinates[activeRoute.coordinates.length - 1];
      const result = await routeService.calculateRoutes(coords, destCoords, mode || activeRoute.mode);
      if (result.routes && result.routes.length > 0) {
        setActiveRoute(result.routes[0]);
        MapMatchingService.resetOffRouteCounter();
      }
    } finally {
      setIsRecalculating(false);
    }
  }, [activeRoute]);

  const isDeadReckoning = Boolean(
    isNavigating && MapMatchingService.isTunnelWay(currentStreetName)
  );

  return {
    isNavigating,
    activeRoute,
    matchResult,
    isRecalculating,
    remainingDistanceMeters,
    currentStreetName,
    isDeadReckoning,
    startNavigation,
    stopNavigation,
    recalculateRoute,
  };
}
