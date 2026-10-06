import type { Coordinates } from '../types';

export interface LocationDetectionResult {
  coordinates: Coordinates;
  city: string;
  state: string;
  country: string;
  road?: string;
  suburb?: string;
  source: 'gps' | 'ip' | 'fallback' | 'cached';
  accuracyMeters?: number;
  formatted: string;
}

// Default baseline coordinates (Brazil center if nothing else available)
const DEFAULT_COORDS: Coordinates = {
  lat: -22.906424,
  lng: -43.182231,
};

export const locationService = {
  /**
   * Get cached user location from localStorage if available
   */
  getCachedLocation(): LocationDetectionResult | null {
    try {
      const cached = localStorage.getItem('tp_user_location');
      if (cached) {
        const parsed = JSON.parse(cached);
        if (parsed && parsed.coordinates && typeof parsed.coordinates.lat === 'number') {
          return { ...parsed, source: 'cached' };
        }
      }
    } catch {}
    return null;
  },

  /**
   * Automatically detect user's current live location anywhere in Brazil via GPS hardware or IP
   * Fires onUpdate immediately whenever a faster or more precise tier resolves!
   */
  async detectUserLocation(onUpdate?: (res: LocationDetectionResult) => void): Promise<LocationDetectionResult> {
    const cached = this.getCachedLocation();
    if (cached && onUpdate) {
      onUpdate(cached);
    }

    // Fast IP Geolocation Stream
    const fetchIpLocation = async (): Promise<LocationDetectionResult | null> => {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 3500);
        const res = await fetch('https://ipwho.is/?lang=pt-BR', { signal: controller.signal });
        clearTimeout(timeoutId);
        if (res.ok) {
          const data = await res.json();
          if (data && data.success && data.latitude && data.longitude) {
            const cityName = data.city || 'Sua Cidade';
            const stateCode = data.region_code || data.region || 'BR';
            const result: LocationDetectionResult = {
              coordinates: { lat: data.latitude, lng: data.longitude },
              city: cityName,
              state: stateCode,
              country: data.country || 'Brasil',
              source: 'ip',
              formatted: `${cityName} - ${stateCode}`,
            };
            return result;
          }
        }
      } catch {}

      try {
        const controller2 = new AbortController();
        const timeoutId2 = setTimeout(() => controller2.abort(), 3500);
        const res2 = await fetch('https://get.geojs.io/v1/ip/geo.json', { signal: controller2.signal });
        clearTimeout(timeoutId2);
        if (res2.ok) {
          const data2 = await res2.json();
          if (data2 && data2.latitude && data2.longitude) {
            const cityName = data2.city || 'Sua Cidade';
            const stateCode = data2.region || 'BR';
            const result: LocationDetectionResult = {
              coordinates: { lat: parseFloat(data2.latitude), lng: parseFloat(data2.longitude) },
              city: cityName,
              state: stateCode,
              country: data2.country || 'Brasil',
              source: 'ip',
              formatted: `${cityName} - ${stateCode}`,
            };
            return result;
          }
        }
      } catch {}

      return null;
    };

    // Fast Hardware GPS Stream
    const fetchGpsPosition = (): Promise<{ coords: Coordinates; accuracy?: number }> => {
      return new Promise((resolve, reject) => {
        if (typeof navigator === 'undefined' || !navigator.geolocation) {
          return reject(new Error('Geolocation API não disponível'));
        }

        navigator.geolocation.getCurrentPosition(
          pos => {
            if (pos && pos.coords && typeof pos.coords.latitude === 'number' && typeof pos.coords.longitude === 'number') {
              resolve({
                coords: {
                  lat: pos.coords.latitude,
                  lng: pos.coords.longitude,
                },
                accuracy: pos.coords.accuracy,
              });
            } else {
              reject(new Error('Coordenadas vazias retornadas'));
            }
          },
          err => reject(err),
          {
            enableHighAccuracy: true,
            timeout: 5000,
            maximumAge: 0,
          }
        );
      });
    };

    let hasGpsResolved = false;

    // Launch IP stream in background for ultra-fast response (100-300ms)
    const ipPromise = fetchIpLocation().then(ipRes => {
      if (ipRes && !hasGpsResolved) {
        if (onUpdate) onUpdate(ipRes);
        localStorage.setItem('tp_user_location', JSON.stringify(ipRes));
      }
      return ipRes;
    }).catch(() => null);

    // Launch GPS stream in parallel
    try {
      const gpsResult = await fetchGpsPosition();
      if (gpsResult && gpsResult.coords) {
        hasGpsResolved = true;
        const result: LocationDetectionResult = {
          coordinates: gpsResult.coords,
          city: cached?.city || 'Sua Cidade',
          state: cached?.state || 'BR',
          country: 'Brasil',
          source: 'gps',
          accuracyMeters: gpsResult.accuracy,
          formatted: 'Sua Localização Exata • GPS Ao Vivo',
        };

        if (onUpdate) onUpdate(result);
        localStorage.setItem('tp_user_location', JSON.stringify(result));
        localStorage.setItem('tp_confirmed_gps_coords', JSON.stringify(gpsResult.coords));

        // Background reverse geocode for exact Brazilian street and neighborhood
        this.reverseGeocode(gpsResult.coords).then(rev => {
          const displayName = rev.road 
            ? `${rev.road}, ${rev.city}` 
            : `${rev.city} - ${rev.state}`;
          const enrichedResult: LocationDetectionResult = {
            ...result,
            city: rev.city,
            state: rev.state,
            road: rev.road,
            suburb: rev.suburb,
            formatted: displayName,
          };
          if (onUpdate) onUpdate(enrichedResult);
          localStorage.setItem('tp_user_location', JSON.stringify(enrichedResult));
        }).catch(() => {});

        return result;
      }
    } catch (e) {
      console.warn('GPS hardware direct acquisition note:', e);
    }

    // If GPS did not resolve, check IP stream result
    const ipRes = await ipPromise;
    if (ipRes) {
      return ipRes;
    }

    if (cached) {
      return cached;
    }

    // Default baseline coordinates
    const fallbackResult: LocationDetectionResult = {
      coordinates: DEFAULT_COORDS,
      city: 'Brasil',
      state: 'GPS',
      country: 'Brasil',
      source: 'fallback',
      formatted: 'Sua Localização • GPS',
    };
    if (onUpdate) onUpdate(fallbackResult);
    return fallbackResult;
  },

  /**
   * Reverse geocode coordinates to Brazilian Street, Neighborhood, City and State
   */
  async reverseGeocode(coords: Coordinates): Promise<{ city: string; state: string; road?: string; suburb?: string }> {
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${coords.lat}&lon=${coords.lng}&addressdetails=1`
      );
      if (res.ok) {
        const data = await res.json();
        const addr = data.address || {};
        const city = addr.city || addr.town || addr.municipality || addr.village || addr.county || 'Sua Cidade';
        const state = addr.state_code || addr.state || 'BR';
        const road = addr.road || addr.pedestrian || addr.street;
        const suburb = addr.suburb || addr.neighbourhood || addr.quarter || addr.city_district;
        return { city, state, road, suburb };
      }
    } catch (e) {
      console.warn('Reverse geocode notice:', e);
    }
    return { city: 'Minha Localização', state: 'Brasil' };
  },
};

