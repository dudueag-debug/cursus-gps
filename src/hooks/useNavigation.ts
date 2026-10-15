import { useState, useEffect, useCallback, useRef } from 'react';
import type { Coordinates, RouteOption, RouteStep, TransportMode } from '../types';
import { MapMatchingService, type MapMatchingResult } from '../services/mapMatchingService';
import { routeService } from '../services/routeService';
import type { RerouteOpportunity } from '../engines/aiPredictionEngine';

export interface NavigationHookState {
  isNavigating: boolean;
  activeRoute: RouteOption | null;
  matchResult: MapMatchingResult | null;
  isRecalculating: boolean;
  remainingDistanceMeters: number;
  currentStreetName: string;
  isDeadReckoning: boolean;
  rerouteOpportunity: RerouteOpportunity | null;
  startNavigation: (route: RouteOption) => void;
  stopNavigation: () => void;
  acceptReroute: (newRoute: RouteOption) => void;
  dismissReroute: () => void;
  recalculateRoute: (currentCoords: Coordinates, mode?: TransportMode) => Promise<void>;
}

const STORAGE_KEY = 'tp_saved_navigation_state';

export function useNavigation(
  currentCoords: Coordinates,
  enableVoiceInstructions: boolean = true
): NavigationHookState {
  const [isNavigating, setIsNavigating] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        // Only restore if saved less than 90 minutes ago
        if (parsed?.timestamp && Date.now() - parsed.timestamp < 90 * 60 * 1000) {
          return true;
        }
      }
    } catch {}
    return false;
  });

  const [activeRoute, setActiveRoute] = useState<RouteOption | null>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed?.route && Date.now() - parsed.timestamp < 90 * 60 * 1000) {
          return parsed.route;
        }
      }
    } catch {}
    return null;
  });

  const [matchResult, setMatchResult] = useState<MapMatchingResult | null>(null);
  const [isRecalculating, setIsRecalculating] = useState<boolean>(false);
  const [remainingDistanceMeters, setRemainingDistanceMeters] = useState<number>(0);
  const [currentStreetName, setCurrentStreetName] = useState<string>('Via Principal');
  const [rerouteOpportunity, setRerouteOpportunity] = useState<RerouteOpportunity | null>(null);

  // Set of dismissed alternative route IDs to respect user choice
  const dismissedRerouteIdsRef = useRef<Set<string>>(new Set());
  const lastAlternativeCheckRef = useRef<number>(0);

  // Helper to announce voice guidance
  const speakVoiceAdvisory = useCallback((text: string) => {
    if (!enableVoiceInstructions || typeof window === 'undefined' || !('speechSynthesis' in window)) return;
    try {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'pt-BR';
      utterance.rate = 1.05;
      window.speechSynthesis.speak(utterance);
    } catch {}
  }, [enableVoiceInstructions]);

  // Save active route to localStorage to survive tab switches / app minimizes
  useEffect(() => {
    if (isNavigating && activeRoute) {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify({
          route: activeRoute,
          timestamp: Date.now(),
        }));
      } catch {}
    } else {
      try {
        localStorage.removeItem(STORAGE_KEY);
      } catch {}
    }
  }, [isNavigating, activeRoute]);

  // Automatic reroute execution ONLY when true off-route deviation happens
  const handleAutoRecalculate = useCallback(async () => {
    if (!activeRoute || isRecalculating) return;
    setIsRecalculating(true);
    speakVoiceAdvisory('Recalculando rota para corrigir desvio...');

    try {
      const destCoords = activeRoute.coordinates[activeRoute.coordinates.length - 1];
      const result = await routeService.calculateRoutes(currentCoords, destCoords, activeRoute.mode);
      if (result.routes && result.routes.length > 0) {
        const bestRoute = result.routes[0];
        setActiveRoute(bestRoute);
        MapMatchingService.resetOffRouteCounter();
        speakVoiceAdvisory(`Nova rota traçada via ${bestRoute.title || 'avenida principal'}.`);
      }
    } catch (e) {
      console.warn('Auto recalculate notice:', e);
    } finally {
      setTimeout(() => setIsRecalculating(false), 1200);
    }
  }, [activeRoute, currentCoords, isRecalculating, speakVoiceAdvisory]);

  // Periodic Intelligent Background Alternative Evaluation (Every 35 seconds during navigation)
  useEffect(() => {
    if (!isNavigating || !activeRoute || isRecalculating) return;

    const now = Date.now();
    if (now - lastAlternativeCheckRef.current < 35000) return;
    lastAlternativeCheckRef.current = now;

    // Evaluate alternative if current route has delay or incident count
    if (activeRoute.incidentCount > 0 || activeRoute.totalDurationSeconds > 600) {
      const destCoords = activeRoute.coordinates[activeRoute.coordinates.length - 1];
      routeService.calculateRoutes(currentCoords, destCoords, activeRoute.mode).then(res => {
        if (res.routes && res.routes.length > 1) {
          const alternative = res.routes[1];
          const timeSaved = activeRoute.totalDurationSeconds - alternative.totalDurationSeconds;

          // Check if alternative saves at least 180s (3 minutes) and hasn't been dismissed
          if (timeSaved >= 180 && !dismissedRerouteIdsRef.current.has(alternative.id)) {
            const timeSavedMinutes = Math.max(1, Math.round(timeSaved / 60));
            const distanceDeltaKm = Number(((alternative.totalDistanceMeters - activeRoute.totalDistanceMeters) / 1000).toFixed(1));
            const opp: RerouteOpportunity = {
              isBetterRouteAvailable: true,
              alternativeRoute: alternative,
              timeSavedMinutes,
              distanceDeltaKm,
              timeSavedSeconds: timeSaved,
              distanceDiffMeters: alternative.totalDistanceMeters - activeRoute.totalDistanceMeters,
              reason: 'Congestionamento relevante à frente na rota atual',
              promptTitle: 'Alternativa mais rápida disponível',
              promptDescription: `Economize cerca de ${timeSavedMinutes} min (${distanceDeltaKm > 0 ? `+${distanceDeltaKm} km` : `${distanceDeltaKm} km`})`,
            };
            setRerouteOpportunity(opp);
            speakVoiceAdvisory(`Alternativa mais rápida disponível economizando cerca de ${timeSavedMinutes} minutos.`);
          }
        }
      }).catch(() => {});
    }
  }, [currentCoords, isNavigating, activeRoute, isRecalculating, speakVoiceAdvisory]);

  // Map Matching and Off-Route tracking
  useEffect(() => {
    if (!isNavigating || !activeRoute) return;

    const match = MapMatchingService.matchPosition(currentCoords, activeRoute);
    setMatchResult(match);
    if (match.streetName) setCurrentStreetName(match.streetName);
    setRemainingDistanceMeters(match.remainingDistanceMeters);

    // Only auto-recalculate when deviation is confirmed
    if (match.needsRecalculation && !isRecalculating) {
      handleAutoRecalculate();
    }
  }, [currentCoords, isNavigating, activeRoute, isRecalculating, handleAutoRecalculate]);

  const startNavigation = useCallback((route: RouteOption) => {
    setActiveRoute(route);
    setIsNavigating(true);
    setRerouteOpportunity(null);
    dismissedRerouteIdsRef.current.clear();
    MapMatchingService.resetOffRouteCounter();
  }, []);

  const stopNavigation = useCallback(() => {
    setIsNavigating(false);
    setActiveRoute(null);
    setMatchResult(null);
    setRerouteOpportunity(null);
    dismissedRerouteIdsRef.current.clear();
    MapMatchingService.resetOffRouteCounter();
  }, []);

  const acceptReroute = useCallback((newRoute: RouteOption) => {
    setActiveRoute(newRoute);
    setRerouteOpportunity(null);
    MapMatchingService.resetOffRouteCounter();
    speakVoiceAdvisory(`Rota alternativa ativada via ${newRoute.title}.`);
  }, [speakVoiceAdvisory]);

  const dismissReroute = useCallback(() => {
    if (rerouteOpportunity) {
      // Respect user's explicit choice and avoid nagging repeatedly
      dismissedRerouteIdsRef.current.add(rerouteOpportunity.alternativeRoute.id);
    }
    setRerouteOpportunity(null);
    speakVoiceAdvisory('Rota atual mantida conforme sua escolha.');
  }, [rerouteOpportunity, speakVoiceAdvisory]);

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
    rerouteOpportunity,
    startNavigation,
    stopNavigation,
    acceptReroute,
    dismissReroute,
    recalculateRoute,
  };
}
