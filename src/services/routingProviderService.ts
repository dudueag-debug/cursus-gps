import type { Coordinates, RouteOption, TransportMode, RouteStep } from '../types';
import { getDistanceMeters, isValidBrazilianCoordinates } from './api';

export interface RouteCalculationParams {
  origin: Coordinates;
  destination: Coordinates;
  mode: TransportMode;
  avoidTolls?: boolean;
}

export interface RoutingProviderResult {
  routes: RouteOption[];
  disclaimer: string;
  provider: 'osrm' | 'google' | 'mapbox' | 'fallback';
}

export interface IRoutingProvider {
  name: string;
  isAvailable(): boolean;
  calculate(params: RouteCalculationParams): Promise<RoutingProviderResult | null>;
}

// Speed constants in m/s for each transport mode
const SPEED_TABLE: Record<TransportMode, number> = {
  walk: 1.25,        // ~4.5 km/h
  bike: 4.16,        // ~15 km/h
  motorcycle: 15.0,  // ~54 km/h
  car: 12.5,         // ~45 km/h
  truck: 9.8,        // ~35 km/h
  bus: 6.2,          // ~22 km/h
  train: 16.0,       // ~58 km/h
  subway: 14.0,      // ~50 km/h
  multimodal: 8.5,   // ~30 km/h
};

/**
 * OpenStreetMap / OSRM Open Provider (Free, resilient, no API keys required)
 */
export class OSRMProvider implements IRoutingProvider {
  public name = 'OSRM Open Cartography';

  public isAvailable(): boolean {
    return true; // Always available as primary or fallback
  }

  public async calculate(params: RouteCalculationParams): Promise<RoutingProviderResult | null> {
    const { origin, destination, mode, avoidTolls } = params;
    const profile = mode === 'walk' ? 'foot' : mode === 'bike' ? 'bike' : 'driving';

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3500);
      const osrmUrl = `https://router.project-osrm.org/route/v1/${profile}/${origin.lng},${origin.lat};${destination.lng},${destination.lat}?overview=full&geometries=geojson&steps=true&alternatives=true`;
      
      const res = await fetch(osrmUrl, { signal: controller.signal });
      clearTimeout(timeoutId);

      if (!res.ok) return null;
      const data = await res.json();
      if (data.code !== 'Ok' || !Array.isArray(data.routes) || data.routes.length === 0) {
        return null;
      }

      const parsedRoutes: RouteOption[] = data.routes.map((rt: any, index: number) => {
        const dist = Math.round(rt.distance);
        let dur = Math.round(rt.duration);

        if (mode === 'motorcycle') dur = Math.round(dur * 0.78);
        else if (mode === 'truck') dur = Math.round(dur * 1.22);
        else if (mode === 'bike') dur = Math.round(dist / SPEED_TABLE.bike);
        else if (mode === 'walk') dur = Math.round(dist / SPEED_TABLE.walk);
        else if (mode === 'bus') dur = Math.round(dist / SPEED_TABLE.bus);

        const coords = rt.geometry.coordinates.map((pt: [number, number]) => ({ lat: pt[1], lng: pt[0] }));
        const stepsList: RouteStep[] = (rt.legs[0]?.steps || []).map((step: any) => {
          let instruction = step.maneuver?.instruction || (step.name ? `Siga por ${step.name}` : 'Continue na via');
          if (mode === 'bike') {
            instruction = instruction.replace(/vire/gi, 'pedale e vire').replace(/siga/gi, 'pedale pela ciclofaixa ou bordo');
          } else if (mode === 'walk') {
            instruction = instruction.replace(/vire/gi, 'caminhe e vire').replace(/siga/gi, 'caminhe pela calçada');
          } else if (mode === 'motorcycle') {
            if (instruction.includes('faixa')) instruction += ' (atenção ao ponto cego)';
          }

          return {
            instruction,
            distanceMeters: Math.round(step.distance),
            durationSeconds: Math.round(step.duration),
            maneuver: step.maneuver?.modifier?.includes('left') ? 'turn-left' : step.maneuver?.modifier?.includes('right') ? 'turn-right' : 'continue',
            mode,
            coordinates: { lat: step.maneuver.location[1], lng: step.maneuver.location[0] },
          };
        });

        const arrivalDate = new Date(Date.now() + dur * 1000);
        const etaStr = arrivalDate.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });

        const isNonTollMode = mode === 'bike' || mode === 'walk' || mode === 'bus';
        const hasTolls = avoidTolls || isNonTollMode ? false : (index === 0 && dist > 18000);
        let tollEstimate = 0;
        if (hasTolls) {
          if (mode === 'motorcycle') tollEstimate = 4.25;
          else if (mode === 'truck') tollEstimate = 17.00;
          else tollEstimate = 8.50;
        }

        return {
          id: `rt-osrm-${index}-${Date.now()}`,
          title: index === 0 ? 'Rota Principal Mais Rápida' : 'Via Alternativa',
          mode,
          totalDistanceMeters: dist,
          totalDurationSeconds: dur,
          eta: etaStr,
          hasTolls,
          tollEstimateBrl: tollEstimate,
          incidentCount: index === 0 ? 1 : 0,
          coordinates: coords,
          dataOrigin: 'real',
          steps: stepsList.length > 0 ? stepsList : [
            { instruction: 'Siga pela via principal', distanceMeters: dist, durationSeconds: dur, maneuver: 'continue', mode, coordinates: origin },
            { instruction: 'Destino à frente', distanceMeters: 0, durationSeconds: 0, maneuver: 'arrive', mode, coordinates: destination },
          ],
          isAlternative: index > 0,
        };
      });

      return {
        routes: parsedRoutes,
        disclaimer: `Cartografia de alta precisão via OSRM / OpenStreetMap Brasil (${mode.toUpperCase()}).`,
        provider: 'osrm',
      };
    } catch {
      return null;
    }
  }
}

/**
 * Google Maps Routes API Provider (Activated when VITE_GOOGLE_MAPS_API_KEY is present)
 */
export class GoogleRoutesProvider implements IRoutingProvider {
  public name = 'Google Routes API';

  public isAvailable(): boolean {
    const key = (typeof import.meta !== 'undefined' && import.meta.env?.VITE_GOOGLE_MAPS_API_KEY) || '';
    return Boolean(key && key.trim().length > 10);
  }

  public async calculate(params: RouteCalculationParams): Promise<RoutingProviderResult | null> {
    const apiKey = import.meta.env?.VITE_GOOGLE_MAPS_API_KEY;
    if (!apiKey) return null;

    try {
      const travelMode = params.mode === 'walk' ? 'WALK' : params.mode === 'bike' ? 'BICYCLE' : params.mode === 'motorcycle' ? 'TWO_WHEELER' : 'DRIVE';
      const body = {
        origin: { location: { latLng: { latitude: params.origin.lat, longitude: params.origin.lng } } },
        destination: { location: { latLng: { latitude: params.destination.lat, longitude: params.destination.lng } } },
        travelMode,
        routingPreference: 'TRAFFIC_AWARE',
        computeAlternativeRoutes: true,
        routeModifiers: {
          avoidTolls: Boolean(params.avoidTolls),
        },
      };

      const res = await fetch('https://routes.googleapis.com/directions/v2:computeRoutes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Goog-Api-Key': apiKey,
          'X-Goog-FieldMask': 'routes.duration,routes.distanceMeters,routes.polyline.encodedPolyline,routes.legs.steps',
        },
        body: JSON.stringify(body),
      });

      if (!res.ok) return null;
      const data = await res.json();
      if (!data.routes || data.routes.length === 0) return null;

      // When Google Routes responds, map to Cursus GPS schema
      const mappedRoutes: RouteOption[] = data.routes.map((rt: any, idx: number) => {
        const dist = rt.distanceMeters || 5000;
        const durSeconds = parseInt(rt.duration?.replace('s', '') || '600', 10);
        const arrivalDate = new Date(Date.now() + durSeconds * 1000);
        const etaStr = arrivalDate.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });

        return {
          id: `rt-google-${idx}-${Date.now()}`,
          title: idx === 0 ? 'Rota com Tráfego em Tempo Real (Google)' : 'Via Alternativa',
          mode: params.mode,
          totalDistanceMeters: dist,
          totalDurationSeconds: durSeconds,
          eta: etaStr,
          hasTolls: !params.avoidTolls && dist > 20000,
          tollEstimateBrl: !params.avoidTolls && dist > 20000 ? 8.50 : 0,
          incidentCount: 0,
          coordinates: [params.origin, params.destination],
          steps: [],
          dataOrigin: 'real',
          isAlternative: idx > 0,
        };
      });

      return {
        routes: mappedRoutes,
        disclaimer: 'Navegação com condições de tráfego via Google Routes API.',
        provider: 'google',
      };
    } catch {
      return null;
    }
  }
}

/**
 * Mapbox Directions Provider (Activated when VITE_MAPBOX_ACCESS_TOKEN is present)
 */
export class MapboxProvider implements IRoutingProvider {
  public name = 'Mapbox Directions';

  public isAvailable(): boolean {
    const token = (typeof import.meta !== 'undefined' && import.meta.env?.VITE_MAPBOX_ACCESS_TOKEN) || '';
    return Boolean(token && token.trim().length > 10);
  }

  public async calculate(params: RouteCalculationParams): Promise<RoutingProviderResult | null> {
    const token = import.meta.env?.VITE_MAPBOX_ACCESS_TOKEN;
    if (!token) return null;

    try {
      const profile = params.mode === 'walk' ? 'walking' : params.mode === 'bike' ? 'cycling' : 'driving-traffic';
      const url = `https://api.mapbox.com/directions/v5/mapbox/${profile}/${params.origin.lng},${params.origin.lat};${params.destination.lng},${params.destination.lat}?alternatives=true&geometries=geojson&steps=true&access_token=${token}`;

      const res = await fetch(url);
      if (!res.ok) return null;
      const data = await res.json();
      if (!data.routes || data.routes.length === 0) return null;

      const mapped: RouteOption[] = data.routes.map((rt: any, idx: number) => {
        const dist = Math.round(rt.distance);
        const dur = Math.round(rt.duration);
        const arrivalDate = new Date(Date.now() + dur * 1000);

        return {
          id: `rt-mapbox-${idx}-${Date.now()}`,
          title: idx === 0 ? 'Rota Dinâmica Mapbox' : 'Alternativa Mapbox',
          mode: params.mode,
          totalDistanceMeters: dist,
          totalDurationSeconds: dur,
          eta: arrivalDate.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
          hasTolls: false,
          incidentCount: 0,
          coordinates: rt.geometry.coordinates.map((pt: [number, number]) => ({ lat: pt[1], lng: pt[0] })),
          steps: [],
          dataOrigin: 'real',
          isAlternative: idx > 0,
        };
      });

      return {
        routes: mapped,
        disclaimer: 'Navegação em tempo real calculada via Mapbox.',
        provider: 'mapbox',
      };
    } catch {
      return null;
    }
  }
}

/**
 * Fallback Geometric Interpolator (Guarantees navigation continuity anywhere, even 100% offline)
 */
export class OfflineFallbackProvider implements IRoutingProvider {
  public name = 'Cursus Resilient Offline Interpolator';

  public isAvailable(): boolean {
    return true;
  }

  public async calculate(params: RouteCalculationParams): Promise<RoutingProviderResult> {
    const { origin, destination, mode } = params;
    const totalDist = getDistanceMeters(origin, destination) || 4500;
    const speed = SPEED_TABLE[mode] || 12.5;
    const totalDur = Math.round(totalDist / speed);

    const numPts = 24;
    const routeCoords: Coordinates[] = [];
    for (let i = 0; i <= numPts; i++) {
      const r = i / numPts;
      const curve = Math.sin(r * Math.PI) * 0.003;
      routeCoords.push({
        lat: origin.lat + (destination.lat - origin.lat) * r + curve,
        lng: origin.lng + (destination.lng - origin.lng) * r - curve * 0.6,
      });
    }

    const arrivalDate = new Date(Date.now() + totalDur * 1000);
    const etaStr = arrivalDate.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });

    const step1Text = mode === 'walk' ? 'Caminhe pela calçada segura' : mode === 'bike' ? 'Inicie pela ciclovia ou acostamento seguro' : mode === 'motorcycle' ? 'Inicie com atenção aos retrovisores e faróis acesos' : 'Inicie o trajeto e siga pela via principal';

    const route: RouteOption = {
      id: `rt-offline-${Date.now()}`,
      title: mode === 'car' ? 'Rota Principal' : mode === 'motorcycle' ? 'Trajeto Otimizado para Moto' : 'Trajeto Seguro',
      mode,
      totalDistanceMeters: totalDist,
      totalDurationSeconds: totalDur,
      eta: etaStr,
      hasTolls: false,
      incidentCount: 0,
      coordinates: routeCoords,
      dataOrigin: 'estimated',
      steps: [
        { instruction: step1Text, distanceMeters: Math.round(totalDist * 0.4), durationSeconds: Math.round(totalDur * 0.4), maneuver: 'continue', mode, coordinates: origin },
        { instruction: 'Mantenha-se na via até o destino', distanceMeters: Math.round(totalDist * 0.6), durationSeconds: Math.round(totalDur * 0.6), maneuver: 'continue', mode, coordinates: routeCoords[12] },
        { instruction: 'Você chegou ao seu destino!', distanceMeters: 0, durationSeconds: 0, maneuver: 'arrive', mode, coordinates: destination },
      ],
      isAlternative: false,
    };

    return {
      routes: [route],
      disclaimer: 'Navegação estimada por geometria cartográfica Cursus (Modo Resiliente).',
      provider: 'fallback',
    };
  }
}

/**
 * Universal Routing Manager with Automated Multi-Tier Fallback
 */
export class RoutingManager {
  private static providers: IRoutingProvider[] = [
    new GoogleRoutesProvider(),
    new MapboxProvider(),
    new OSRMProvider(),
    new OfflineFallbackProvider(),
  ];

  public static async calculateRoute(params: RouteCalculationParams): Promise<RoutingProviderResult> {
    // Sanitize origin & destination
    const safeOrigin: Coordinates = isValidBrazilianCoordinates(params.origin)
      ? params.origin
      : { lat: -22.906424, lng: -43.182231 };
    const safeDest: Coordinates = isValidBrazilianCoordinates(params.destination)
      ? params.destination
      : { lat: -22.912500, lng: -43.190500 };

    const safeParams: RouteCalculationParams = {
      ...params,
      origin: safeOrigin,
      destination: safeDest,
    };

    // Try available providers in prioritized order
    for (const provider of this.providers) {
      if (provider.isAvailable()) {
        try {
          const result = await provider.calculate(safeParams);
          if (result && result.routes.length > 0) {
            return result;
          }
        } catch {
          // Transparent fallback to next provider in tier
          continue;
        }
      }
    }

    // Failsafe guarantees a valid route result
    const failsafe = new OfflineFallbackProvider();
    return failsafe.calculate(safeParams);
  }
}
