import type { Coordinates, RouteOption, RouteStep } from '../types';

export interface MapMatchingResult {
  snappedCoords: Coordinates;
  isSnapped: boolean;
  distanceToRouteMeters: number;
  nearestSegmentIndex: number;
  currentStep: RouteStep | null;
  currentStepIndex: number;
  remainingDistanceMeters: number;
  isOffRoute: boolean;
  needsRecalculation: boolean;
  streetName: string;
  isDeadReckoningActive?: boolean;
  tunnelNotice?: string;
}

/**
 * Calculates Euclidean projection of point P onto segment AB in geographic coordinates
 */
function projectPointOnSegment(p: Coordinates, a: Coordinates, b: Coordinates): { point: Coordinates; t: number; distMeters: number } {
  const dx = b.lng - a.lng;
  const dy = b.lat - a.lat;
  const lenSq = dx * dx + dy * dy;

  if (lenSq === 0) {
    const dist = getDistanceMeters(p, a);
    return { point: { ...a }, t: 0, distMeters: dist };
  }

  // Projection parameter t in [0, 1]
  let t = ((p.lng - a.lng) * dx + (p.lat - a.lat) * dy) / lenSq;
  t = Math.max(0, Math.min(1, t));

  const projLng = a.lng + t * dx;
  const projLat = a.lat + t * dy;
  const projPoint: Coordinates = { lat: projLat, lng: projLng };

  const distMeters = getDistanceMeters(p, projPoint);
  return { point: projPoint, t, distMeters };
}

function getDistanceMeters(c1: Coordinates, c2: Coordinates): number {
  const R = 6371e3;
  const φ1 = (c1.lat * Math.PI) / 180;
  const φ2 = (c2.lat * Math.PI) / 180;
  const Δφ = ((c2.lat - c1.lat) * Math.PI) / 180;
  const Δλ = ((c2.lng - c1.lng) * Math.PI) / 180;
  const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) + Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c);
}

export class MapMatchingService {
  private static readonly SNAP_THRESHOLD_METERS = 35; // Maximum distance to snap to road
  private static readonly OFF_ROUTE_THRESHOLD_METERS = 50; // Threshold to trigger recalculation
  private static consecutiveOffRouteCount = 0;

  /**
   * Matches current GPS coordinate against active route geometry
   */
  public static matchPosition(
    gpsCoords: Coordinates,
    route: RouteOption | null
  ): MapMatchingResult {
    if (!route || !route.coordinates || route.coordinates.length < 2) {
      return {
        snappedCoords: gpsCoords,
        isSnapped: false,
        distanceToRouteMeters: 0,
        nearestSegmentIndex: 0,
        currentStep: null,
        currentStepIndex: 0,
        remainingDistanceMeters: 0,
        isOffRoute: false,
        needsRecalculation: false,
        streetName: 'Via Atual',
      };
    }

    const coords = route.coordinates;
    let minDistance = Infinity;
    let bestPoint = gpsCoords;
    let bestSegmentIndex = 0;

    // Scan segments
    for (let i = 0; i < coords.length - 1; i++) {
      const segStart = coords[i];
      const segEnd = coords[i + 1];
      const proj = projectPointOnSegment(gpsCoords, segStart, segEnd);

      if (proj.distMeters < minDistance) {
        minDistance = proj.distMeters;
        bestPoint = proj.point;
        bestSegmentIndex = i;
      }
    }

    const isWithinSnap = minDistance <= this.SNAP_THRESHOLD_METERS;
    const isOffRoute = minDistance > this.OFF_ROUTE_THRESHOLD_METERS;

    if (isOffRoute) {
      this.consecutiveOffRouteCount++;
    } else {
      this.consecutiveOffRouteCount = 0;
    }

    // Trigger recalculation only if confirmed off route for 3 or more consecutive updates (deadband stability)
    const needsRecalculation = this.consecutiveOffRouteCount >= 3;

    // Determine current navigation step
    let currentStep: RouteStep | null = null;
    let currentStepIndex = 0;

    if (route.steps && route.steps.length > 0) {
      // Find closest step
      let stepMinDist = Infinity;
      for (let s = 0; s < route.steps.length; s++) {
        const step = route.steps[s];
        const d = getDistanceMeters(bestPoint, step.coordinates);
        if (d < stepMinDist) {
          stepMinDist = d;
          currentStepIndex = s;
          currentStep = step;
        }
      }
    }

    // Calculate remaining distance along route from matched segment
    let remainingDistance = 0;
    if (bestSegmentIndex < coords.length - 1) {
      remainingDistance += getDistanceMeters(bestPoint, coords[bestSegmentIndex + 1]);
      for (let j = bestSegmentIndex + 1; j < coords.length - 1; j++) {
        remainingDistance += getDistanceMeters(coords[j], coords[j + 1]);
      }
    }

    const streetName = currentStep?.streetName || currentStep?.instruction || 'Via Principal';

    return {
      snappedCoords: isWithinSnap ? bestPoint : gpsCoords,
      isSnapped: isWithinSnap,
      distanceToRouteMeters: minDistance,
      nearestSegmentIndex: bestSegmentIndex,
      currentStep,
      currentStepIndex,
      remainingDistanceMeters: remainingDistance,
      isOffRoute,
      needsRecalculation,
      streetName,
    };
  }

  private static lastMatchTime = 0;
  private static lastMatchedCoords: Coordinates | null = null;
  private static lastEstimatedSpeedMps = 13.8; // Default ~50 km/h

  /**
   * Checks if an instruction refers to a tunnel or underground passage
   */
  public static isTunnelWay(text?: string): boolean {
    if (!text) return false;
    const lower = text.toLowerCase();
    return lower.includes('túnel') || lower.includes('tunel') || lower.includes('subterrâneo') || lower.includes('passagem');
  }

  /**
   * Projects user position along route during GPS dropouts (Dead Reckoning)
   */
  public static projectTunnelPosition(
    route: RouteOption,
    elapsedSeconds: number
  ): Coordinates {
    if (!route.coordinates || route.coordinates.length < 2) {
      return this.lastMatchedCoords || { lat: -22.906424, lng: -43.182231 };
    }

    const currentCoords = this.lastMatchedCoords || route.coordinates[0];
    const match = this.matchPosition(currentCoords, route);
    const advanceMeters = this.lastEstimatedSpeedMps * Math.min(elapsedSeconds, 5.0);

    const coords = route.coordinates;
    let accumulated = 0;
    for (let i = match.nearestSegmentIndex; i < coords.length - 1; i++) {
      const segDist = getDistanceMeters(coords[i], coords[i + 1]);
      if (accumulated + segDist >= advanceMeters) {
        const remaining = advanceMeters - accumulated;
        const ratio = segDist > 0 ? remaining / segDist : 0;
        const projected: Coordinates = {
          lat: coords[i].lat + (coords[i + 1].lat - coords[i].lat) * ratio,
          lng: coords[i].lng + (coords[i + 1].lng - coords[i].lng) * ratio,
        };
        this.lastMatchedCoords = projected;
        return projected;
      }
      accumulated += segDist;
    }

    return coords[coords.length - 1];
  }

  public static resetOffRouteCounter() {
    this.consecutiveOffRouteCount = 0;
    this.lastMatchTime = 0;
    this.lastMatchedCoords = null;
  }
}
