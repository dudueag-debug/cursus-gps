import type { Coordinates } from '../types';

/**
 * Contracts and interfaces prepared for future hardware and platform expansions
 * (AR Navigation, Dashcam AI, Android Auto, Apple CarPlay, Mecânica 4.0 IA, Wearables).
 */

// 1. AR Navigation Contract
export interface ARNavigationFrame {
  timestamp: number;
  cameraAvailable: boolean;
  fovHorizontalDeg: number;
  nextManeuverOverlay?: {
    type: 'turn-left' | 'turn-right' | 'forward';
    distanceMeters: number;
    projectedScreenX: number;
    projectedScreenY: number;
    arrowScale: number;
  };
}

// 2. Dashcam & Vision AI Contract
export interface DashcamTelemetry {
  isRecording: boolean;
  resolution: '1080p' | '4k';
  fps: number;
  detectedLanes: boolean;
  detectedVehiclesCount: number;
  forwardCollisionWarning: boolean;
  laneDepartureWarning: boolean;
}

// 3. Automotive Projection Interface (CarPlay / Android Auto)
export interface AutomotiveHeadUnitBridge {
  connectedPlatform: 'none' | 'carplay' | 'android_auto';
  screenResolution: { width: number; height: number };
  touchInputSupported: boolean;
  rotaryControllerSupported: boolean;
  audioDuckingActive: boolean;
  sendNavigationInstruction: (maneuver: string, distanceMeters: number, iconType: string) => void;
}

// 4. Mecânica 4.0 IA Integration Contract
export interface Mecanica40TelemetrySync {
  obdConnected: boolean;
  engineRpm: number;
  coolantTempCelsius: number;
  fuelLevelPercent: number;
  dtcErrorCodes: string[];
  batteryVoltage: number;
  tirePressurePsi?: {
    frontLeft: number;
    frontRight: number;
    rearLeft: number;
    rearRight: number;
  };
  recommendation?: string;
}

export class FutureIntegrationRegistry {
  public static getMecanica40Status(): Mecanica40TelemetrySync {
    return {
      obdConnected: false,
      engineRpm: 0,
      coolantTempCelsius: 88,
      fuelLevelPercent: 78,
      dtcErrorCodes: [],
      batteryVoltage: 12.6,
      recommendation: 'Sistema pronto para pareamento com scanner OBD-II e Mecânica 4.0 IA.',
    };
  }

  public static getHeadUnitStatus(): AutomotiveHeadUnitBridge {
    return {
      connectedPlatform: 'none',
      screenResolution: { width: 1920, height: 1080 },
      touchInputSupported: true,
      rotaryControllerSupported: false,
      audioDuckingActive: false,
      sendNavigationInstruction: (maneuver, distance, icon) => {
        console.log(`[HeadUnit] Instrução despachada: ${maneuver} (${distance}m, ${icon})`);
      },
    };
  }
}
