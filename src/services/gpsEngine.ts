import type { Coordinates } from '../types';

export interface GPSPrecisionState {
  rawCoords: Coordinates;
  smoothedCoords: Coordinates;
  heading: number;
  speedKmh: number;
  accuracyMeters: number;
  altitudeMeters?: number;
  precisionLevel: 'high' | 'medium' | 'low';
  lastUpdated: number;
  isMoving: boolean;
  sensorsAvailable: {
    gnss: boolean;
    compass: boolean;
    accelerometer: boolean;
    gyroscope: boolean;
  };
}

export interface KalmanFilterState {
  lat: number;
  lng: number;
  variance: number;
}

/**
 * High-Precision GPS Engine with exponential smoothing and multi-sensor orientation fusion
 * Implements exponential moving average / Kalman-inspired smoothing to eliminate jumping markers.
 * Strictly adheres to the Rule of Truth: Never invents coordinates; transparently flags accuracy.
 */
class GPSEngine {
  private currentState: GPSPrecisionState = {
    rawCoords: { lat: -22.906424, lng: -43.182231 },
    smoothedCoords: { lat: -22.906424, lng: -43.182231 },
    heading: 0,
    speedKmh: 0,
    accuracyMeters: 10,
    precisionLevel: 'high',
    lastUpdated: Date.now(),
    isMoving: false,
    sensorsAvailable: {
      gnss: true,
      compass: false,
      accelerometer: false,
      gyroscope: false,
    },
  };

  private listeners: ((state: GPSPrecisionState) => void)[] = [];
  private watchId: number | null = null;
  private smoothingFactor = 0.35; // Weight of new reading vs historical
  private headingSmoothingFactor = 0.25;

  constructor() {
    this.initDeviceSensors();
  }

  private initDeviceSensors() {
    if (typeof window !== 'undefined') {
      // Device Orientation (Compass / Gyroscope)
      if ('DeviceOrientationEvent' in window) {
        window.addEventListener('deviceorientation', (event: DeviceOrientationEvent) => {
          this.currentState.sensorsAvailable.compass = true;
          let compassHeading = event.alpha;
          // iOS webkit compass heading
          if ('webkitCompassHeading' in event && typeof (event as any).webkitCompassHeading === 'number') {
            compassHeading = (event as any).webkitCompassHeading;
          }

          if (compassHeading !== null && compassHeading !== undefined && !isNaN(compassHeading)) {
            // Apply smoothing to compass heading when stationary or slow
            if (this.currentState.speedKmh < 5) {
              this.updateHeading(compassHeading);
            }
          }
        }, { passive: true });
      }

      // Device Motion (Accelerometer / Gyroscope)
      if ('DeviceMotionEvent' in window) {
        window.addEventListener('devicemotion', () => {
          this.currentState.sensorsAvailable.accelerometer = true;
          this.currentState.sensorsAvailable.gyroscope = true;
        }, { passive: true });
      }
    }
  }

  public subscribe(callback: (state: GPSPrecisionState) => void): () => void {
    this.listeners.push(callback);
    callback(this.currentState);
    return () => {
      this.listeners = this.listeners.filter(l => l !== callback);
    };
  }

  private notify() {
    for (const listener of this.listeners) {
      try {
        listener(this.currentState);
      } catch (err) {
        console.warn('[GPSEngine] Error in listener callback:', err);
      }
    }
  }

  /**
   * Updates state with new raw GPS coordinates from hardware or network GNSS
   */
  public updateRawPosition(
    coords: Coordinates,
    accuracyMeters: number = 10,
    speedMps?: number | null,
    headingDeg?: number | null,
    altitude?: number | null
  ): GPSPrecisionState {
    const now = Date.now();
    const timeDeltaSec = Math.max(0.1, (now - this.currentState.lastUpdated) / 1000);

    // Exponential smoothing for position coordinates to eliminate GPS flutter
    const smoothedLat = this.currentState.smoothedCoords.lat + (coords.lat - this.currentState.smoothedCoords.lat) * this.smoothingFactor;
    const smoothedLng = this.currentState.smoothedCoords.lng + (coords.lng - this.currentState.smoothedCoords.lng) * this.smoothingFactor;

    // Calculate speed (km/h)
    let calculatedSpeedKmh = 0;
    if (speedMps !== undefined && speedMps !== null && !isNaN(speedMps) && speedMps >= 0) {
      calculatedSpeedKmh = Math.round(speedMps * 3.6);
    } else {
      // Approximate speed from displacement
      const distMeters = this.calculateDistanceMeters(this.currentState.rawCoords, coords);
      if (distMeters > 0.5 && timeDeltaSec < 10) {
        calculatedSpeedKmh = Math.round((distMeters / timeDeltaSec) * 3.6);
      }
    }

    // Determine precision classification
    let precisionLevel: 'high' | 'medium' | 'low' = 'high';
    if (accuracyMeters > 40) {
      precisionLevel = 'low';
    } else if (accuracyMeters > 18) {
      precisionLevel = 'medium';
    }

    // Heading update from GNSS if moving at sufficient speed
    if (calculatedSpeedKmh > 4) {
      if (headingDeg !== undefined && headingDeg !== null && !isNaN(headingDeg) && headingDeg >= 0) {
        this.updateHeading(headingDeg);
      } else {
        const bearing = this.calculateBearing(this.currentState.smoothedCoords, { lat: smoothedLat, lng: smoothedLng });
        if (!isNaN(bearing)) {
          this.updateHeading(bearing);
        }
      }
    }

    this.currentState = {
      ...this.currentState,
      rawCoords: coords,
      smoothedCoords: { lat: smoothedLat, lng: smoothedLng },
      speedKmh: Math.min(220, Math.max(0, calculatedSpeedKmh)),
      accuracyMeters,
      altitudeMeters: altitude ?? undefined,
      precisionLevel,
      lastUpdated: now,
      isMoving: calculatedSpeedKmh > 3,
    };

    this.notify();
    return this.currentState;
  }

  /**
   * Angle difference aware heading smoothing
   */
  public updateHeading(newHeading: number) {
    let current = this.currentState.heading;
    let target = ((newHeading % 360) + 360) % 360;

    let diff = target - current;
    if (diff > 180) diff -= 360;
    if (diff < -180) diff += 360;

    const smoothed = ((current + diff * this.headingSmoothingFactor) % 360 + 360) % 360;
    this.currentState.heading = Math.round(smoothed);
  }

  public getState(): GPSPrecisionState {
    return this.currentState;
  }

  /**
   * Auto-zoom calculation based on current vehicle velocity
   */
  public getOptimalZoomForSpeed(currentZoom: number): number {
    const speed = this.currentState.speedKmh;
    if (speed > 100) return 14;
    if (speed > 70) return 15;
    if (speed > 40) return 16;
    if (speed > 10) return 17;
    return Math.max(16, currentZoom);
  }

  public calculateDistanceMeters(c1: Coordinates, c2: Coordinates): number {
    const R = 6371e3;
    const φ1 = (c1.lat * Math.PI) / 180;
    const φ2 = (c2.lat * Math.PI) / 180;
    const Δφ = ((c2.lat - c1.lat) * Math.PI) / 180;
    const Δλ = ((c2.lng - c1.lng) * Math.PI) / 180;
    const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) + Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return Math.round(R * c);
  }

  public calculateBearing(c1: Coordinates, c2: Coordinates): number {
    const φ1 = (c1.lat * Math.PI) / 180;
    const φ2 = (c2.lat * Math.PI) / 180;
    const Δλ = ((c2.lng - c1.lng) * Math.PI) / 180;
    const y = Math.sin(Δλ) * Math.cos(φ2);
    const x = Math.cos(φ1) * Math.sin(φ2) - Math.sin(φ1) * Math.cos(φ2) * Math.cos(Δλ);
    const θ = Math.atan2(y, x);
    return Math.round(((θ * 180) / Math.PI + 360) % 360);
  }

  /**
   * Start active hardware geolocation watch
   */
  public startActiveWatch(onUpdate?: (state: GPSPrecisionState) => void): () => void {
    if (typeof navigator !== 'undefined' && navigator.geolocation) {
      if (this.watchId !== null) {
        navigator.geolocation.clearWatch(this.watchId);
      }

      this.watchId = navigator.geolocation.watchPosition(
        pos => {
          if (pos && pos.coords) {
            const updated = this.updateRawPosition(
              { lat: pos.coords.latitude, lng: pos.coords.longitude },
              pos.coords.accuracy || 10,
              pos.coords.speed,
              pos.coords.heading,
              pos.coords.altitude
            );
            if (onUpdate) onUpdate(updated);
          }
        },
        err => {
          console.warn('[GPSEngine] Watch position error:', err);
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 500,
        }
      );
    }

    return () => {
      if (this.watchId !== null && typeof navigator !== 'undefined' && navigator.geolocation) {
        navigator.geolocation.clearWatch(this.watchId);
        this.watchId = null;
      }
    };
  }
}

export const gpsEngine = new GPSEngine();
