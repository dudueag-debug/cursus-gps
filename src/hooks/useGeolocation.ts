import { useState, useEffect, useRef } from 'react';
import type { Coordinates } from '../types';
import { locationService } from '../services/locationService';
import { isValidBrazilianCoordinates } from '../services/api';

export interface GeolocationState {
  coordinates: Coordinates;
  accuracy: number | null;
  heading: number | null;
  speedKmh: number;
  isSearching: boolean;
  isOnline: boolean;
  error: string | null;
}

export function useGeolocation(initialCoords?: Coordinates): GeolocationState {
  const [coordinates, setCoordinates] = useState<Coordinates>(
    initialCoords || { lat: -22.906424, lng: -43.182231 }
  );
  const [accuracy, setAccuracy] = useState<number | null>(null);
  const [heading, setHeading] = useState<number | null>(null);
  const [speedKmh, setSpeedKmh] = useState<number>(0);
  const [isSearching, setIsSearching] = useState<boolean>(true);
  const [isOnline, setIsOnline] = useState<boolean>(
    typeof navigator !== 'undefined' ? navigator.onLine : true
  );
  const [error, setError] = useState<string | null>(null);

  const watchIdRef = useRef<number | null>(null);

  useEffect(() => {
    // 1. Initial fast detection (IP or Cache)
    locationService.detectUserLocation().then((res: any) => {
      if (res && isValidBrazilianCoordinates(res.coordinates)) {
        setCoordinates(res.coordinates);
        setIsSearching(false);
      }
    }).catch(() => {
      setIsSearching(false);
    });

    // 2. Hardware GPS tracking with high accuracy
    if (typeof navigator !== 'undefined' && 'geolocation' in navigator) {
      try {
        watchIdRef.current = navigator.geolocation.watchPosition(
          pos => {
            const lat = pos.coords.latitude;
            const lng = pos.coords.longitude;
            if (typeof lat === 'number' && typeof lng === 'number') {
              setCoordinates({ lat, lng });
              setAccuracy(pos.coords.accuracy ? Math.round(pos.coords.accuracy) : null);
              if (pos.coords.heading !== null && !isNaN(pos.coords.heading)) {
                setHeading(pos.coords.heading);
              }
              if (pos.coords.speed !== null && !isNaN(pos.coords.speed)) {
                setSpeedKmh(Math.round(pos.coords.speed * 3.6));
              }
              setIsSearching(false);
              setError(null);
            }
          },
          err => {
            setError(err.message);
            setIsSearching(false);
          },
          {
            enableHighAccuracy: true,
            maximumAge: 0,
            timeout: 12000,
          }
        );
      } catch (e: any) {
        setError(e?.message || 'Falha ao iniciar GPS');
      }
    }

    // 3. Compass / Orientation listener
    let handleOrientation: ((e: DeviceOrientationEvent) => void) | null = null;
    if (typeof window !== 'undefined' && 'DeviceOrientationEvent' in window) {
      handleOrientation = (e: DeviceOrientationEvent) => {
        if (e.alpha !== null && !isNaN(e.alpha)) {
          setHeading(360 - e.alpha);
        }
      };
      window.addEventListener('deviceorientation', handleOrientation);
    }

    // 4. Online / Offline connectivity listener
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      if (watchIdRef.current !== null && typeof navigator !== 'undefined') {
        navigator.geolocation.clearWatch(watchIdRef.current);
      }
      if (handleOrientation) {
        window.removeEventListener('deviceorientation', handleOrientation);
      }
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return {
    coordinates,
    accuracy,
    heading,
    speedKmh,
    isSearching,
    isOnline,
    error,
  };
}
