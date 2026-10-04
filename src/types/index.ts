export type TransportMode = 'car' | 'motorcycle' | 'bus' | 'train' | 'subway' | 'walk' | 'multimodal';

export type VehicleModel = 'sport' | 'sedan' | 'suv' | 'motorcycle_sport' | 'motorcycle_scooter' | 'van' | 'walker';

export type VehicleColor = 'lime' | 'electric_blue' | 'cyber_yellow' | 'ruby_red' | 'silver' | 'stealth_dark';

export type MapLayerType = 'streets' | 'satellite' | 'topo' | 'dark';

export interface UserProfile {
  id: string;
  name: string;
  username: string;
  email?: string;
  phone?: string;
  avatarUrl?: string;
  isGuest: boolean;
  preferredMode: TransportMode;
  vehicleModel: VehicleModel;
  vehicleColor: VehicleColor;
  enableWindEffect: boolean;
  enableVoiceInstructions: boolean;
  enableCultureAudio: boolean;
  selectedVoiceURI?: string;
  voiceRate?: number;
  voicePitch?: number;
  mapLayerType?: MapLayerType;
  is3DMode?: boolean;
  detectedState?: string;
  detectedCity?: string;
  privacy: {
    shareLocationWithCommunity: boolean;
    saveRouteHistory: boolean;
    anonymousReports: boolean;
  };
  accessibility: {
    highContrast: boolean;
    reducedMotion: boolean;
    largerText: boolean;
  };
}

export interface Coordinates {
  lat: number;
  lng: number;
}

export interface GeocodeResult {
  id: string;
  displayName: string;
  street?: string;
  neighborhood?: string;
  city?: string;
  state?: string;
  cep?: string;
  coordinates: Coordinates;
  type: 'address' | 'cep' | 'poi' | 'city';
  provider: 'viacep' | 'nominatim' | 'internal';
}

export interface RouteStep {
  instruction: string;
  distanceMeters: number;
  durationSeconds: number;
  maneuver: 'depart' | 'turn-left' | 'turn-right' | 'continue' | 'roundabout' | 'merge' | 'arrive' | 'transit-board' | 'transit-alight';
  mode: TransportMode;
  transitLineName?: string;
  transitStationName?: string;
  coordinates: Coordinates;
}

export interface RouteOption {
  id: string;
  title: string;
  mode: TransportMode;
  totalDistanceMeters: number;
  totalDurationSeconds: number;
  eta: string;
  hasTolls: boolean;
  tollEstimateBrl?: number;
  incidentCount: number;
  coordinates: Coordinates[];
  steps: RouteStep[];
  isAlternative?: boolean;
  multimodalSegments?: {
    mode: TransportMode;
    label: string;
    durationMinutes: number;
    distanceMeters: number;
    icon: string;
  }[];
}

export type OccurrenceCategory = 
  | 'obras'
  | 'recapeamento'
  | 'acidente'
  | 'congestionamento'
  | 'alagamento'
  | 'buraco'
  | 'oleo_pista'
  | 'areia_lama'
  | 'arvore_caida'
  | 'semaforo_defeito'
  | 'baixa_visibilidade'
  | 'evento_via';

export type OccurrenceStatus = 
  | 'planejada'
  | 'em_andamento'
  | 'relatada_comunidade'
  | 'aguardando_confirmacao'
  | 'confirmada_oficial'
  | 'resolvida'
  | 'cancelada'
  | 'expirada';

export interface OccurrenceMessage {
  id: string;
  occurrenceId: string;
  userId: string;
  userName: string;
  text: string;
  timestamp: string;
  isOfficial?: boolean;
}

export interface Occurrence {
  id: string;
  category: OccurrenceCategory;
  title: string;
  description: string;
  locationName: string;
  coordinates: Coordinates;
  sourceType: 'official' | 'community';
  sourceName: string;
  status: OccurrenceStatus;
  createdAt: string;
  updatedAt: string;
  confirmationsCount: number;
  resolvedVotesCount: number;
  denialsCount: number;
  severity: 'baixa' | 'media' | 'alta' | 'critica';
  affectedLanes?: string;
  messagesCount: number;
  isNormalized?: boolean;
  normalizationMessage?: string;
}

export type PlaceCategory = 
  | 'saude'
  | 'comercio_servicos'
  | 'lazer_cultura'
  | 'transporte_infraestrutura';

export interface Place {
  id: string;
  name: string;
  category: PlaceCategory;
  subCategory: string;
  address: string;
  cep?: string;
  coordinates: Coordinates;
  phone?: string;
  website?: string;
  openingHours?: string;
  isOpen?: boolean;
  is24h?: boolean;
  rating?: number;
  source: 'openstreetmap' | 'curated' | 'demo';
  distanceMeters?: number;
}

export interface SafetyChecklistItem {
  id: string;
  vehicleType: 'car' | 'motorcycle';
  question: string;
  critical: boolean;
  warningNote?: string;
  checked: boolean;
}

export interface CultureSpot {
  id: string;
  title: string;
  city: string;
  state: string;
  coordinates: Coordinates;
  category: 'historia' | 'patrimonio' | 'curiosidade' | 'monumento';
  summary: string;
  fullText: string;
  source: string;
}
