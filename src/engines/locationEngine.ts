import type { Coordinates } from '../types';

export interface LocationState {
  rawCoords: Coordinates;
  filteredCoords: Coordinates;
  speedKmh: number;
  headingDeg: number;
  altitudeMeters: number | null;
  accuracyMeters: number;
  movementStatus: 'stationary' | 'accelerating' | 'cruising' | 'decelerating';
  isGpsLost: boolean;
  gpsLossDurationSec: number;
  lastFixTimestamp: number;
  deadReckoningActive: boolean;
  precisionRating: 'high' | 'medium' | 'low';
}

/**
 * 2D Kalman Filter for Geographic Coordinates
 */
class GeoKalmanFilter {
  private lat: number = 0;
  private lng: number = 0;
  private variance: number = -1; // -1 indicates uninitialized
  private q: number = 0.000008; // Process noise covariance

  public process(lat: number, lng: number, accuracy: number, timestampMs: number): Coordinates {
    const r = accuracy * accuracy * 0.000001; // Measurement noise covariance

    if (this.variance < 0) {
      this.lat = lat;
      this.lng = lng;
      this.variance = r;
      return { lat, lng };
    }

    // Time-based variance increase
    this.variance += this.q;

    // Kalman gain
    const k = this.variance / (this.variance + r);

    // Measurement update
    this.lat += k * (lat - this.lat);
    this.lng += k * (lng - this.lng);
    this.variance = (1 - k) * this.variance;

    return { lat: this.lat, lng: this.lng };
  }

  public predict(speedMps: number, headingDeg: number, deltaSec: number): Coordinates {
    if (this.variance < 0 || speedMps <= 0.1) {
      return { lat: this.lat, lng: this.lng };
    }

    const distMeters = speedMps * deltaSec;
    const radHeading = (headingDeg * Math.PI) / 180;
    const deltaLat = (distMeters * Math.cos(radHeading)) / 111320;
    const deltaLng = (distMeters * Math.sin(radHeading)) / (111320 * Math.cos((this.lat * Math.PI) / 180));

    this.lat += deltaLat;
    this.lng += deltaLng;
    this.variance += this.q * 2;

    return { lat: this.lat, lng: this.lng };
  }
}

export class LocationEngine {
  private kalman = new GeoKalmanFilter();
  private state: LocationState = {
    rawCoords: { lat: -22.906424, lng: -43.182231 },
    filteredCoords: { lat: -22.906424, lng: -43.182231 },
    speedKmh: 0,
    headingDeg: 0,
    altitudeMeters: null,
    accuracyMeters: 10,
    movementStatus: 'stationary',
    isGpsLost: false,
    gpsLossDurationSec: 0,
    lastFixTimestamp: Date.now(),
    deadReckoningActive: false,
    precisionRating: 'high',
  };

  private listeners: ((state: LocationState) => void)[] = [];
  private deadReckoningTimer: any = null;
  private watchId: number | null = null;
  private previousSpeeds: number[] = [];

  constructor() {
    this.startDeadReckoningLoop();
  }

  public subscribe(callback: (state: LocationState) => void): () => void {
    this.listeners.push(callback);
    callback(this.state);
    return () => {
      this.listeners = this.listeners.filter(l => l !== callback);
    };
  }

  private notify() {
    for (const listener of this.listeners) {
      try {
        listener(this.state);
      } catch (e) {
        console.warn('[LocationEngine] Notification error:', e);
      }
    }
  }

  /**
   * Continuous Dead-Reckoning Loop to maintain smooth continuity in tunnels and underpasses
   */
  private startDeadReckoningLoop() {
    if (typeof window === 'undefined') return;

    this.deadReckoningTimer = setInterval(() => {
      const now = Date.now();
      const elapsedSec = (now - this.state.lastFixTimestamp) / 1000;

      // If no GPS fix for > 3.5 seconds and was previously moving, activate Dead Reckoning extrapolation
      if (elapsedSec > 3.5 && this.state.speedKmh > 5 && elapsedSec < 15) {
        const speedMps = (this.state.speedKmh * 1000) / 3600;
        const predicted = this.kalman.predict(speedMps, this.state.headingDeg, 0.5);

        this.state = {
          ...this.state,
          filteredCoords: predicted,
          isGpsLost: true,
          gpsLossDurationSec: Math.round(elapsedSec),
          deadReckoningActive: true,
          precisionRating: 'medium',
        };
        this.notify();
      } else if (elapsedSec >= 15 && this.state.deadReckoningActive) {
        // After 15s without fix, stop dead reckoning to avoid excessive drift
        this.state = {
          ...this.state,
          deadReckoningActive: false,
          isGpsLost: true,
          precisionRating: 'low',
        };
        this.notify();
      }
    }, 500);
  }

  /**
   * Process raw hardware/network position
   */
  public ingestRawFix(
    coords: Coordinates,
    accuracyMeters: number = 10,
    speedMps?: number | null,
    headingDeg?: number | null,
    altitude?: number | null
  ): LocationState {
    const now = Date.now();
    const filtered = this.kalman.process(coords.lat, coords.lng, accuracyMeters, now);

    let speedKmh = 0;
    if (speedMps !== undefined && speedMps !== null && !isNaN(speedMps) && speedMps >= 0) {
      speedKmh = Math.round(speedMps * 3.6);
    } else {
      // Calculate speed from distance
      const dist = this.distanceMeters(this.state.filteredCoords, filtered);
      const dt = (now - this.state.lastFixTimestamp) / 1000;
      if (dt > 0.1 && dt < 8) {
        speedKmh = Math.min(220, Math.round((dist / dt) * 3.6));
      }
    }

    // Determine movement acceleration/deceleration status
    this.previousSpeeds.push(speedKmh);
    if (this.previousSpeeds.length > 4) this.previousSpeeds.shift();
    
    let movementStatus: LocationState['movementStatus'] = 'stationary';
    if (speedKmh <= 2) {
      movementStatus = 'stationary';
    } else if (this.previousSpeeds.length >= 2) {
      const delta = speedKmh - this.previousSpeeds[0];
      if (delta > 4) movementStatus = 'accelerating';
      else if (delta < -4) movementStatus = 'decelerating';
      else movementStatus = 'cruising';
    }

    // Heading update with angle smoothing
    let resolvedHeading = this.state.headingDeg;
    if (headingDeg !== undefined && headingDeg !== null && !isNaN(headingDeg) && headingDeg >= 0) {
      resolvedHeading = Math.round(headingDeg);
    } else if (speedKmh > 4) {
      const calcBearing = this.calculateBearing(this.state.filteredCoords, filtered);
      if (!isNaN(calcBearing)) resolvedHeading = calcBearing;
    }

    const precisionRating: LocationState['precisionRating'] = 
      accuracyMeters <= 12 ? 'high' : accuracyMeters <= 30 ? 'medium' : 'low';

    this.state = {
      rawCoords: coords,
      filteredCoords: filtered,
      speedKmh,
      headingDeg: resolvedHeading,
      altitudeMeters: altitude ?? null,
      accuracyMeters,
      movementStatus,
      isGpsLost: false,
      gpsLossDurationSec: 0,
      lastFixTimestamp: now,
      deadReckoningActive: false,
      precisionRating,
    };

    this.notify();
    return this.state;
  }

  public getState(): LocationState {
    return this.state;
  }

  private distanceMeters(c1: Coordinates, c2: Coordinates): number {
    const R = 6371e3;
    const φ1 = (c1.lat * Math.PI) / 180;
    const φ2 = (c2.lat * Math.PI) / 180;
    const Δφ = ((c2.lat - c1.lat) * Math.PI) / 180;
    const Δλ = ((c2.lng - c1.lng) * Math.PI) / 180;
    const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) + Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return Math.round(R * c);
  }

  private calculateBearing(c1: Coordinates, c2: Coordinates): number {
    const φ1 = (c1.lat * Math.PI) / 180;
    const φ2 = (c2.lat * Math.PI) / 180;
    const Δλ = ((c2.lng - c1.lng) * Math.PI) / 180;
    const y = Math.sin(Δλ) * Math.cos(φ2);
    const x = Math.cos(φ1) * Math.sin(φ2) - Math.sin(φ1) * Math.cos(φ2) * Math.cos(Δλ);
    const θ = Math.atan2(y, x);
    return Math.round(((θ * 180) / Math.PI + 360) % 360);
  }
}

export const locationEngine = new LocationEngine();
