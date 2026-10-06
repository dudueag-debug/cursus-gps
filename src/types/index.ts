export type TransportMode = 'car' | 'motorcycle' | 'bus' | 'train' | 'subway' | 'walk' | 'multimodal';

export type VehicleModel = 'sport' | 'sedan' | 'suv' | 'motorcycle_sport' | 'motorcycle_scooter' | 'van' | 'walker';

export type VehicleColor = 'lime' | 'electric_blue' | 'cyber_yellow' | 'ruby_red' | 'silver' | 'stealth_dark';

export type MapLayerType = 'streets' | 'satellite' | 'topo' | 'dark';

// 8 Live Map Feature Layers (Mapa Vivo)
export interface ActiveMapLayers {
  traffic: boolean;      // 🚗 Trânsito (congestionamentos, fluxo lento, acidentes)
  safety: boolean;       // 🚨 Segurança (polícia, DPO, delegacias, pontos perigosos)
  health: boolean;       // 🏥 Saúde (hospitais, UPAs, postos, farmácias)
  automotive: boolean;   // ⛽ Automotivo (postos, GNV, oficinas, borracheiros)
  transit: boolean;      // 🚌 Transporte (pontos de ônibus, terminais, metrô, trem, BRT)
  commerce: boolean;     // 🛒 Comércio (mercados, supermercados, restaurantes, bancos, shoppings)
  sports: boolean;       // 🏟️ Esportes & Lazer (campos de futebol, quadras, parques, praças, praias)
  tourism: boolean;      // 🏛️ Turismo & Cultura (pontos turísticos, monumentos, museus, patrimônios)
}

// Fundamental Data Precision Classification
export type DataOriginType = 'real' | 'estimated' | 'reported' | 'historical';

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
  isFollowPositionLocked?: boolean;
  themeMode?: 'dark' | 'light';
  detectedState?: string;
  detectedCity?: string;
  privacy: {
    shareLocationWithCommunity: boolean;
    saveRouteHistory: boolean;
    anonymousReports: boolean;
    locationPermissionGranted: boolean;
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
  type: 'address' | 'cep' | 'poi' | 'city' | 'history' | 'sport';
  provider: 'viacep' | 'nominatim' | 'internal';
  dataOrigin?: DataOriginType;
}

export interface RouteStep {
  instruction: string;
  distanceMeters: number;
  durationSeconds: number;
  maneuver: 'depart' | 'turn-left' | 'turn-right' | 'continue' | 'roundabout' | 'merge' | 'arrive' | 'transit-board' | 'transit-alight';
  mode: TransportMode;
  streetName?: string;
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
  dataOrigin: DataOriginType;
  multimodalSegments?: {
    mode: TransportMode;
    label: string;
    durationMinutes: number;
    distanceMeters: number;
    icon: string;
  }[];
}

// 12 Explicit Highway Warning Types
export type OccurrenceCategory = 
  | 'engarrafamento'
  | 'alagamento'
  | 'buraco'
  | 'objeto_via'
  | 'veiculo_parado'
  | 'acidente'
  | 'blitz'
  | 'via_parcialmente_interditada'
  | 'via_interditada'
  | 'acesso_fechado'
  | 'ponto_roubo'
  | 'local_perigoso'
  | 'obras'
  | 'recapeamento'
  | 'oleo_pista'
  | 'areia_lama'
  | 'arvore_caida'
  | 'semaforo_defeito'
  | 'baixa_visibilidade'
  | 'evento_via';

export type OccurrenceStatus = 
  | 'reportada'         // 🟡 Reportada (amarelo)
  | 'confirmada'        // 🟢 Confirmada (verde)
  | 'alta_relevancia'   // 🔴 Alta Relevância (vermelho)
  | 'expirada'          // ⚪ Expirada (cinza/resolvida)
  | 'planejada'
  | 'em_andamento'
  | 'relatada_comunidade'
  | 'aguardando_confirmacao'
  | 'confirmada_oficial'
  | 'resolvida'
  | 'cancelada';

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
  dataOrigin: DataOriginType;
  confidenceScore: number; // 0 - 100%
}

export type PlaceCategory = 
  | 'saude'
  | 'posto_gnv'
  | 'borracheiro'
  | 'policia'
  | 'reboque_socorro'
  | 'bateria_auto'
  | 'comercio_servicos'
  | 'mercado'
  | 'lazer_cultura'
  | 'transporte_infraestrutura'
  | 'esporte'
  | 'turismo'
  | 'alimentacao'
  | 'hospedagem'
  | 'estacionamento';

export interface Place {
  id: string;
  name: string;
  category: PlaceCategory;
  subCategory: string;
  address: string;
  cep?: string;
  coordinates: Coordinates;
  phone?: string;
  whatsapp?: string;
  website?: string;
  openingHours?: string;
  isOpen?: boolean;
  is24h?: boolean;
  hasGNV?: boolean;
  rating?: number;
  source: 'openstreetmap' | 'curated' | 'community' | 'official';
  distanceMeters?: number;
  dataOrigin: DataOriginType;
  photoUrl?: string;
  entryPrice?: string;
  description?: string;
}

// "O Que Tem Aqui?" Region Scanner breakdown
export interface SurroundingsSummary {
  radius500m: {
    category: PlaceCategory;
    count: number;
    label: string;
    icon: string;
    items: Place[];
  }[];
  radius2km: {
    category: PlaceCategory;
    count: number;
    label: string;
    icon: string;
    items: Place[];
  }[];
  totalNearby: number;
  scannedAt: string;
}

// Region & Community Verified Historical Profile
export interface RegionHistoryData {
  id: string;
  regionName: string;
  city: string;
  state: string;
  coordinates: Coordinates;
  category: 'cidade' | 'bairro' | 'comunidade' | 'patrimonio' | 'monumento';
  foundationYear?: number | string;
  originStory: string;
  urbanEvolution: string;
  culturalHeritage: string;
  populationInfo?: string;
  importantEvents: string[];
  notableFigures: string[];
  curiosities: string[];
  transportOverview?: string;
  publicFacilities?: string;
  sources: string[];
  dataOrigin: 'historical';
}

export interface RoadsideAssistanceRequest {
  serviceType: 'reboque' | 'bateria' | 'pneu' | 'combustivel';
  vehicleType: string;
  driverName: string;
  driverPhone: string;
  userCoordinates: Coordinates;
  userAddress: string;
  notes?: string;
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
  category: 'historia' | 'patrimonio' | 'curiosidade' | 'monumento' | 'turismo';
  summary: string;
  fullText: string;
  source: string;
  openingHours?: string;
  entryPrice?: string;
  photoUrl?: string;
  rating?: number;
  dataOrigin: 'historical';
}

export type WeatherRainRisk = 'nenhum' | 'leve' | 'moderada' | 'forte' | 'tempestade';

export interface WeatherDayForecast {
  date: string; // YYYY-MM-DD
  dayName: string; // Seg, Ter, Qua...
  dayMonth: string; // 04/10
  tempMin: number;
  tempMax: number;
  condition: string;
  icon: string;
  rainProbability: number; // 0 - 100%
  precipitationMm: number;
  riskLevel: WeatherRainRisk;
  carAlert?: string;
  motorcycleAlert?: string;
}

export interface WeatherMonthSummary {
  monthName: string;
  year: number;
  avgTempMax: number;
  avgTempMin: number;
  rainyDaysCount: number;
  totalPrecipitationMm: number;
  summary: string;
  generalAdvice: string;
  motorcycleAdvice: string;
  carAdvice: string;
  criticalWeeks: string[];
}

export interface WeatherData {
  city: string;
  state: string;
  currentTemp: number;
  feelsLikeTemp: number;
  tempMin: number;
  tempMax: number;
  condition: string;
  conditionCode: number;
  icon: string;
  humidity: number;
  windSpeedKmh: number;
  precipitationMm: number;
  rainProbability: number;
  uvIndex: number;
  isRaining: boolean;
  rainRisk: WeatherRainRisk;
  alertTitle?: string;
  alertMessage?: string;
  roadDrivingCondition: 'boa' | 'atencao' | 'perigo_aquaplanagem';
  dataOrigin: 'real';
  driverAdvice: {
    car: string[];
    motorcycle: string[];
  };
  hourlyForecast: {
    time: string;
    temp: number;
    condition: string;
    rainProb: number;
    icon: string;
  }[];
  weeklyForecast: WeatherDayForecast[];
  monthlySummary: WeatherMonthSummary;
}

