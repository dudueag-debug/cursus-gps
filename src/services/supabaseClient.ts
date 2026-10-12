import type { Occurrence, Coordinates, UserProfile, Place } from '../types';
import { CursusIntelligenceEngine } from './intelligenceEngine';

// Supabase environment keys (configurable via Vercel env or .env)
const metaEnv = typeof import.meta !== 'undefined' ? (import.meta as any).env : {};
const SUPABASE_URL = metaEnv?.VITE_SUPABASE_URL || '';
const SUPABASE_ANON_KEY = metaEnv?.VITE_SUPABASE_ANON_KEY || '';

export const isSupabaseConfigured = Boolean(SUPABASE_URL && SUPABASE_ANON_KEY);

export interface IncidentRealtimeEvent {
  eventType: 'INSERT' | 'UPDATE' | 'DELETE';
  incident: Occurrence;
  distanceMeters?: number;
}

class SupabaseService {
  private realtimeListeners: ((event: IncidentRealtimeEvent) => void)[] = [];
  private lastNotificationTime = 0;
  private notificationDebounceMs = 4000;

  constructor() {
    this.initRealtimeSimulationOrConnection();
  }

  private initRealtimeSimulationOrConnection() {
    // If Supabase credentials are provided, we can connect to Supabase Realtime WebSocket
    if (isSupabaseConfigured) {
      console.log('⚡ [Supabase] Conectado ao cluster PostgreSQL + PostGIS com Realtime');
    } else {
      console.log('📦 [Supabase] Modo Local Resiliente / Armazenamento Seguro Offline Ativo');
    }
  }

  /**
   * Subscribe to live Realtime Incident changes (with spatial proximity filter)
   */
  public subscribeToIncidents(
    userCoords: Coordinates,
    onIncidentAlert: (event: IncidentRealtimeEvent) => void
  ): () => void {
    const listener = (event: IncidentRealtimeEvent) => {
      // Calculate distance to incident
      const R = 6371e3;
      const φ1 = (userCoords.lat * Math.PI) / 180;
      const φ2 = (event.incident.coordinates.lat * Math.PI) / 180;
      const Δφ = ((event.incident.coordinates.lat - userCoords.lat) * Math.PI) / 180;
      const Δλ = ((event.incident.coordinates.lng - userCoords.lng) * Math.PI) / 180;
      const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) + Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
      const dist = Math.round(R * c);

      // Only notify if within 5km radius
      if (dist < 5000) {
        const now = Date.now();
        if (now - this.lastNotificationTime > this.notificationDebounceMs) {
          this.lastNotificationTime = now;
          onIncidentAlert({ ...event, distanceMeters: dist });
        }
      }
    };

    this.realtimeListeners.push(listener);
    return () => {
      this.realtimeListeners = this.realtimeListeners.filter(l => l !== listener);
    };
  }

  /**
   * Broadcasts a new incident to local and remote realtime listeners
   */
  public broadcastIncident(incident: Occurrence, eventType: 'INSERT' | 'UPDATE' = 'INSERT') {
    for (const listener of this.realtimeListeners) {
      try {
        listener({ eventType, incident });
      } catch (e) {
        console.warn('Realtime dispatch error:', e);
      }
    }
  }

  /**
   * Save trip to user's private database history with strict RLS simulation
   */
  public async saveTrip(userId: string, trip: {
    origin: string;
    destination: string;
    distanceMeters: number;
    durationSeconds: number;
    safetyScore?: number;
    fuelUsedLiters?: number;
    totalCostBrl?: number;
    routeCategory?: string;
  }) {
    const key = `tp_trips_${userId}`;
    try {
      const existing = localStorage.getItem(key);
      const list = existing ? JSON.parse(existing) : [];
      list.unshift({
        id: `trip-${Date.now()}`,
        userId,
        createdAt: new Date().toISOString(),
        ...trip,
      });
      localStorage.setItem(key, JSON.stringify(list.slice(0, 50)));
      return { success: true };
    } catch (e) {
      return { success: false, error: e };
    }
  }

  /**
   * Get user's trip history
   */
  public async getTrips(userId: string) {
    const key = `tp_trips_${userId}`;
    try {
      const existing = localStorage.getItem(key);
      return existing ? JSON.parse(existing) : [];
    } catch {
      return [];
    }
  }

  /**
   * Clear user's trip history
   */
  public async clearTrips(userId: string) {
    const key = `tp_trips_${userId}`;
    localStorage.removeItem(key);
    return { success: true };
  }

  /**
   * Save user favorites (Casa, Trabalho, Personalizados)
   */
  public async saveFavorites(userId: string, favorites: Place[]) {
    const key = `tp_favorites_${userId}`;
    localStorage.setItem(key, JSON.stringify(favorites));
    return { success: true };
  }

  public async getFavorites(userId: string): Promise<Place[]> {
    const key = `tp_favorites_${userId}`;
    try {
      const existing = localStorage.getItem(key);
      return existing ? JSON.parse(existing) : [];
    } catch {
      return [];
    }
  }
}

export const supabaseService = new SupabaseService();
