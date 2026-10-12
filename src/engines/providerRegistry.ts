import type { Coordinates, GeocodeResult, RouteOption, WeatherData } from '../types';

/**
 * CURSUS GPS - Provider Abstraction Architecture (Section 25)
 * Allows seamlessly plugging, swapping, or combining different providers without altering core engines.
 */

// 1. Map Tile Provider Interface
export interface IMapProvider {
  name: string;
  type: 'streets' | 'satellite' | 'topo' | 'dark' | 'traffic';
  getTileUrl: (x: number, y: number, z: number) => string;
  attribution: string;
  maxZoom: number;
}

// 2. Routing Provider Interface
export interface IRoutingProvider {
  name: string;
  calculateRoute: (
    origin: Coordinates,
    destination: Coordinates,
    mode: string,
    options?: {
      avoidTolls?: boolean;
      avoidHighways?: boolean;
      avoidDirtRoads?: boolean;
      vehicleRestrictions?: {
        heightMeters?: number;
        weightTons?: number;
        lengthMeters?: number;
      };
    }
  ) => Promise<{ routes: RouteOption[]; rawPayload?: any }>;
}

// 3. Traffic Provider Interface
export interface ITrafficProvider {
  name: string;
  getTrafficSegments: (bbox: [number, number, number, number]) => Promise<any[]>;
}

// 4. Weather Provider Interface
export interface IWeatherProvider {
  name: string;
  getWeather: (coords: Coordinates, city?: string, state?: string) => Promise<WeatherData>;
}

// 5. Geocoding Provider Interface
export interface IGeocodingProvider {
  name: string;
  geocode: (query: string, proximity?: Coordinates) => Promise<GeocodeResult[]>;
  reverseGeocode: (coords: Coordinates) => Promise<{ city: string; state: string; road?: string; suburb?: string }>;
}

export class ProviderRegistry {
  private static mapProviders: Map<string, IMapProvider> = new Map();
  private static routingProviders: Map<string, IRoutingProvider> = new Map();
  private static geocodingProviders: Map<string, IGeocodingProvider> = new Map();
  private static weatherProviders: Map<string, IWeatherProvider> = new Map();

  private static activeMapProvider = 'osm';
  private static activeRoutingProvider = 'osrm';
  private static activeGeocodingProvider = 'nominatim';
  private static activeWeatherProvider = 'openmeteo';

  public static registerMapProvider(id: string, provider: IMapProvider) {
    this.mapProviders.set(id, provider);
  }

  public static registerRoutingProvider(id: string, provider: IRoutingProvider) {
    this.routingProviders.set(id, provider);
  }

  public static registerGeocodingProvider(id: string, provider: IGeocodingProvider) {
    this.geocodingProviders.set(id, provider);
  }

  public static registerWeatherProvider(id: string, provider: IWeatherProvider) {
    this.weatherProviders.set(id, provider);
  }

  public static getMapProvider(id: string = this.activeMapProvider): IMapProvider | undefined {
    return this.mapProviders.get(id);
  }

  public static getRoutingProvider(id: string = this.activeRoutingProvider): IRoutingProvider | undefined {
    return this.routingProviders.get(id);
  }

  public static getGeocodingProvider(id: string = this.activeGeocodingProvider): IGeocodingProvider | undefined {
    return this.geocodingProviders.get(id);
  }

  public static getWeatherProvider(id: string = this.activeWeatherProvider): IWeatherProvider | undefined {
    return this.weatherProviders.get(id);
  }
}
