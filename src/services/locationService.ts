import type { Coordinates } from '../types';

export interface LocationDetectionResult {
  coordinates: Coordinates;
  city: string;
  state: string;
  country: string;
  source: 'gps' | 'ip' | 'fallback';
  formatted: string;
}

// Fallback to Brasília / Central Brasil if completely offline
const DEFAULT_COORDS: Coordinates = {
  lat: -15.793889,
  lng: -47.882778,
};

export const locationService = {
  /**
   * Automatically detect user's current location in Brazil via GPS or IP
   */
  async detectUserLocation(): Promise<LocationDetectionResult> {
    // 1. Check if user already had a saved location from previous session
    const cached = localStorage.getItem('tp_user_location');
    let fallbackResult: LocationDetectionResult = {
      coordinates: DEFAULT_COORDS,
      city: 'Sua Localização',
      state: 'Brasil',
      country: 'Brasil',
      source: 'fallback',
      formatted: 'Localização Atual • GPS',
    };

    if (cached) {
      try {
        fallbackResult = JSON.parse(cached);
      } catch {}
    }

    // 2. Race GPS and Online IP detection
    const gpsPromise = new Promise<Coordinates>((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error('Geolocation não suportada'));
        return;
      }

      navigator.geolocation.getCurrentPosition(
        pos => {
          resolve({
            lat: pos.coords.latitude,
            lng: pos.coords.longitude,
          });
        },
        err => reject(err),
        {
          enableHighAccuracy: true,
          timeout: 4000,
          maximumAge: 60000,
        }
      );
    });

    const ipPromise = (async (): Promise<LocationDetectionResult | null> => {
      try {
        // Option A: ipwho.is (fast, HTTPS, CORS open, no token required)
        const res = await fetch('https://ipwho.is/?lang=pt-BR');
        if (res.ok) {
          const data = await res.json();
          if (data && data.success && data.latitude && data.longitude) {
            return {
              coordinates: { lat: data.latitude, lng: data.longitude },
              city: data.city || 'Sua Cidade',
              state: data.region_code || data.region || 'BR',
              country: data.country || 'Brasil',
              source: 'ip',
              formatted: `${data.city || 'Sua Cidade'} - ${data.region_code || data.region || 'BR'}`,
            };
          }
        }
      } catch {}

      try {
        // Option B: geojs.io fallback
        const res2 = await fetch('https://get.geojs.io/v1/ip/geo.json');
        if (res2.ok) {
          const data2 = await res2.json();
          if (data2 && data2.latitude && data2.longitude) {
            return {
              coordinates: { lat: parseFloat(data2.latitude), lng: parseFloat(data2.longitude) },
              city: data2.city || 'Brasil',
              state: data2.region || 'BR',
              country: data2.country || 'Brasil',
              source: 'ip',
              formatted: `${data2.city || 'Localidade'} - ${data2.region || 'BR'}`,
            };
          }
        }
      } catch {}

      return null;
    })();

    try {
      // Try GPS first
      const gpsCoords = await Promise.race([
        gpsPromise,
        new Promise<null>((_, reject) => setTimeout(() => reject(new Error('Timeout GPS')), 4500)),
      ]);

      if (gpsCoords) {
        // Reverse geocode with Nominatim to obtain Brazilian State and City
        const reverseInfo = await this.reverseGeocode(gpsCoords);
        const result: LocationDetectionResult = {
          coordinates: gpsCoords,
          city: reverseInfo.city,
          state: reverseInfo.state,
          country: 'Brasil',
          source: 'gps',
          formatted: `${reverseInfo.city} - ${reverseInfo.state}`,
        };
        localStorage.setItem('tp_user_location', JSON.stringify(result));
        return result;
      }
    } catch {
      // GPS timed out or denied, wait for IP geolocation
    }

    try {
      const ipResult = await ipPromise;
      if (ipResult) {
        // App is Brazil-first: if IP is outside BR, use Brasília so map/data stay consistent
        const country = (ipResult.country || '').toLowerCase();
        const isBrazil =
          country.includes('brasil') ||
          country.includes('brazil') ||
          country === 'br' ||
          (ipResult.coordinates.lat < 5 &&
            ipResult.coordinates.lat > -34 &&
            ipResult.coordinates.lng < -30 &&
            ipResult.coordinates.lng > -75);

        if (!isBrazil) {
          const brFallback: LocationDetectionResult = {
            coordinates: DEFAULT_COORDS,
            city: 'Brasília',
            state: 'DF',
            country: 'Brasil',
            source: 'fallback',
            formatted: 'Brasília - DF',
          };
          localStorage.setItem('tp_user_location', JSON.stringify(brFallback));
          return brFallback;
        }

        localStorage.setItem('tp_user_location', JSON.stringify(ipResult));
        return ipResult;
      }
    } catch {}

    return fallbackResult;
  },

  /**
   * Reverse geocode coordinates to Brazilian City and State
   */
  async reverseGeocode(coords: Coordinates): Promise<{ city: string; state: string; road?: string }> {
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${coords.lat}&lon=${coords.lng}&addressdetails=1`
      );
      if (res.ok) {
        const data = await res.json();
        const addr = data.address || {};
        const city = addr.city || addr.town || addr.municipality || addr.village || 'Sua Cidade';
        const state = addr.state_code || addr.state || 'BR';
        const road = addr.road || addr.pedestrian || addr.suburb;
        return { city, state, road };
      }
    } catch (e) {
      console.warn('Reverse geocode error:', e);
    }
    return { city: 'Localização Atual', state: 'Brasil' };
  },
};
