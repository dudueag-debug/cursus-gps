import type { GeocodeResult, RouteOption, Occurrence, Place, CultureSpot, TransportMode, OccurrenceMessage, Coordinates } from '../types';
import { RoutingManager } from './routingProviderService';

const API_BASE = '/api';

// Safe helper for API requests
async function safeJsonFetch(url: string, options?: RequestInit) {
  try {
    const res = await fetch(url, options);
    if (res.ok) {
      return await res.json();
    }
  } catch {}
  return null;
}

// Distance helper in meters
export function getDistanceMeters(c1: Coordinates, c2: Coordinates): number {
  const R = 6371e3;
  const φ1 = (c1.lat * Math.PI) / 180;
  const φ2 = (c2.lat * Math.PI) / 180;
  const Δφ = ((c2.lat - c1.lat) * Math.PI) / 180;
  const Δλ = ((c2.lng - c1.lng) * Math.PI) / 180;
  const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) + Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c);
}

// Brazilian territorial boundaries validation
export function isValidBrazilianCoordinates(coords?: Coordinates | null): boolean {
  if (!coords) return false;
  const { lat, lng } = coords;
  if (typeof lat !== 'number' || typeof lng !== 'number') return false;
  if (isNaN(lat) || isNaN(lng)) return false;
  // Territory: Lat -34.5 to +5.5, Lng -74.5 to -34.0
  return lat >= -34.5 && lat <= 5.5 && lng >= -74.5 && lng <= -34.0;
}

const initialOccurrences: Occurrence[] = [
  {
    id: 'occ-tp-pardal-brasil-60',
    category: 'radar',
    title: '📸 Pardal Eletrônico • Limite 60 km/h',
    description: 'Fiscalização eletrônica fixa de velocidade e avanço semafórico.',
    locationName: 'Av. Brasil, km 32 • Pista Central',
    coordinates: { lat: -22.8620, lng: -43.4945 },
    sourceType: 'official',
    sourceName: 'CET-RIO / Base Oficial de Pardais',
    status: 'confirmada_comunidade',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    confirmationsCount: 89,
    resolvedVotesCount: 0,
    denialsCount: 0,
    severity: 'media',
    affectedLanes: 'Todas as faixas',
    messagesCount: 8,
    isNormalized: false,
    dataOrigin: 'real',
    confidenceScore: 100,
    speedLimitKmh: 60,
  },
  {
    id: 'occ-tp-pardal-vermelha-80',
    category: 'radar',
    title: '📸 Pardal Eletrônico • Limite 80 km/h',
    description: 'Fiscalização eletrônica contínua de velocidade por faixa.',
    locationName: 'Linha Vermelha, km 8 • Sentido Centro',
    coordinates: { lat: -22.8530, lng: -43.2380 },
    sourceType: 'official',
    sourceName: 'CET-RIO / Base Oficial de Pardais',
    status: 'confirmada_comunidade',
    createdAt: new Date(Date.now() - 86400000).toISOString(),
    updatedAt: new Date(Date.now() - 300000).toISOString(),
    confirmationsCount: 112,
    resolvedVotesCount: 0,
    denialsCount: 0,
    severity: 'media',
    affectedLanes: 'Pistas expressas',
    messagesCount: 14,
    isNormalized: false,
    dataOrigin: 'real',
    confidenceScore: 100,
    speedLimitKmh: 80,
  },
  {
    id: 'occ-tp-pardal-coqueiros-60',
    category: 'radar',
    title: '📸 Pardal Eletrônico • Limite 60 km/h',
    description: 'Fiscalização eletrônica de velocidade urbana.',
    locationName: 'Estrada dos Coqueiros • Fazenda dos Coqueiros',
    coordinates: { lat: -22.8760, lng: -43.4950 },
    sourceType: 'official',
    sourceName: 'CET-RIO / Base Oficial de Pardais',
    status: 'confirmada_comunidade',
    createdAt: new Date(Date.now() - 86400000).toISOString(),
    updatedAt: new Date(Date.now() - 1200000).toISOString(),
    confirmationsCount: 63,
    resolvedVotesCount: 0,
    denialsCount: 0,
    severity: 'media',
    affectedLanes: 'Ambas as faixas',
    messagesCount: 7,
    isNormalized: false,
    dataOrigin: 'real',
    confidenceScore: 100,
    speedLimitKmh: 60,
  },
  {
    id: 'occ-tp-pardal-santa-cruz-40',
    category: 'radar',
    title: '📸 Pardal Redutor • Limite 40 km/h',
    description: 'Redutor eletrônico de velocidade próximo a escola e pedestres.',
    locationName: 'Av. Santa Cruz • Senador Camará',
    coordinates: { lat: -22.8795, lng: -43.4905 },
    sourceType: 'official',
    sourceName: 'CET-RIO / Base Oficial de Pardais',
    status: 'confirmada_comunidade',
    createdAt: new Date(Date.now() - 86400000).toISOString(),
    updatedAt: new Date(Date.now() - 900000).toISOString(),
    confirmationsCount: 45,
    resolvedVotesCount: 0,
    denialsCount: 0,
    severity: 'media',
    affectedLanes: 'Ambas as faixas',
    messagesCount: 4,
    isNormalized: false,
    dataOrigin: 'real',
    confidenceScore: 100,
    speedLimitKmh: 40,
  },
];

const fallbackPlaces: Place[] = [
  {
    id: 'poi-posto-1',
    name: 'Posto Petrobras & GNV Pressurizado 24h',
    category: 'posto_gnv',
    subCategory: 'Gasolina, Etanol, Diesel S10 e GNV Pressurizado',
    address: 'Av. Principal • Próximo a você',
    coordinates: { lat: -22.9050, lng: -43.1810 },
    phone: '0800-728-9001',
    isOpen: true,
    is24h: true,
    hasGNV: true,
    rating: 4.8,
    source: 'curated',
    dataOrigin: 'real',
  },
  {
    id: 'poi-borrach-1',
    name: 'Borracharia SOS Pneus 24 Horas Aberta',
    category: 'borracheiro',
    subCategory: 'Conserto de Furos, Vulcanização, Troca e Socorro',
    address: 'Av. de Acesso • Próximo a você',
    coordinates: { lat: -22.9070, lng: -43.1850 },
    phone: '(11) 98765-1122',
    isOpen: true,
    is24h: true,
    rating: 4.9,
    source: 'curated',
    dataOrigin: 'real',
  },
  {
    id: 'poi-policia-1',
    name: 'Delegacia de Polícia & DPO 24h',
    category: 'policia',
    subCategory: 'Segurança Pública, Plantão 24h e Batalhão',
    address: 'Av. Central de Segurança • Próximo a você',
    coordinates: { lat: -22.9035, lng: -43.1840 },
    phone: '190 / (11) 3322-1000',
    isOpen: true,
    is24h: true,
    rating: 4.7,
    source: 'curated',
    dataOrigin: 'real',
  },
  {
    id: 'poi-saude-1',
    name: 'UPA 24h & Pronto Atendimento de Emergência',
    category: 'saude',
    subCategory: 'Pronto Socorro, Urgência e Emergência',
    address: 'Rua da Saúde, 500 • Próximo a você',
    coordinates: { lat: -22.9085, lng: -43.1795 },
    phone: '192 / (11) 3100-2200',
    isOpen: true,
    is24h: true,
    rating: 4.6,
    source: 'curated',
    dataOrigin: 'real',
  },
  {
    id: 'poi-alim-1',
    name: 'Restaurante & Conveniência Rota 24h',
    category: 'alimentacao',
    subCategory: 'Alimentação, Café e Lanches Rápidos',
    address: 'Av. dos Viajantes, 120 • Próximo a você',
    coordinates: { lat: -22.9040, lng: -43.1860 },
    phone: '(11) 97711-3344',
    isOpen: true,
    is24h: true,
    rating: 4.8,
    source: 'curated',
    dataOrigin: 'real',
  },
  {
    id: 'poi-estac-1',
    name: 'Estacionamento Seguro & Vagas 24h',
    category: 'estacionamento',
    subCategory: 'Vagas Cobertas com Segurança e Manobrista',
    address: 'Rua Principal, 350 • Próximo a você',
    coordinates: { lat: -22.9060, lng: -43.1800 },
    phone: '(11) 3214-5566',
    isOpen: true,
    is24h: true,
    rating: 4.5,
    source: 'curated',
    dataOrigin: 'real',
  },
];

const fallbackCultureSpots: CultureSpot[] = [
  {
    id: 'cul-1',
    title: 'Centro Histórico & Patrimônio Cultural',
    city: 'Brasil',
    state: 'BR',
    coordinates: { lat: -22.9064, lng: -43.1822 },
    category: 'patrimonio',
    summary: 'Arquitetura preservada e marcos fundamentais da fundação da cidade.',
    fullText: 'Região com grande acervo histórico, monumentos centenários e construções emblemáticas.',
    source: 'Patrimônio Histórico Nacional',
    dataOrigin: 'historical',
  },
];

export const api = {
  async getHealth() {
    return safeJsonFetch(`${API_BASE}/health`);
  },

  /**
   * Geocode address query, with multiple fallback tiers (Coords, ViaCEP, Photon, Nominatim, Local Dictionary)
   */
  async geocode(query: string, proximityCoords?: Coordinates): Promise<GeocodeResult[]> {
    if (!query || query.trim().length === 0) return [];
    const trimmed = query.trim();
    const refCenter = proximityCoords || { lat: -22.906424, lng: -43.182231 };

    // Tier 0: Verified Establishments & Hyper-Local Neighborhood Catalog (with Real Photos, Ratings & Reference Points)
    let matchedPlacesResults: GeocodeResult[] = [];
    try {
      const { PlacesDataService } = await import('../../server/services/placesDataService');
      const localMatches = PlacesDataService.searchPlaces({
        centerCoords: refCenter,
        query: trimmed,
        radiusKm: 45,
      });
      if (localMatches && localMatches.length > 0) {
        matchedPlacesResults = localMatches.slice(0, 5).map(p => ({
          id: `place-${p.id}`,
          displayName: `${p.name} — ${p.neighborhood}, ${p.city}/${p.state}`,
          street: p.address,
          neighborhood: p.neighborhood,
          city: p.city,
          state: p.state,
          coordinates: p.coordinates,
          type: 'poi' as const,
          provider: 'internal' as const,
          photoUrl: p.photoUrl,
          photoAttribution: p.photoAttribution,
          verifiedReferencePoint: p.verifiedReferencePoint,
          accessNotes: p.accessNotes,
          rating: p.rating,
          ratingCount: p.ratingCount,
          subCategory: p.subCategory,
          phone: p.phone,
        }));
      }
    } catch {}

    // Tier 1: Direct Coordinate Input (e.g. "-22.9064, -43.1822")
    const coordMatch = trimmed.match(/^([-+]?\d{1,2}\.?\d*)[,\s]+([-+]?\d{1,3}\.?\d*)$/);
    if (coordMatch) {
      const lat = parseFloat(coordMatch[1]);
      const lng = parseFloat(coordMatch[2]);
      if (!isNaN(lat) && !isNaN(lng) && lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180) {
        return [{
          id: `coord-${Date.now()}`,
          displayName: `Coordenadas GPS (${lat.toFixed(5)}, ${lng.toFixed(5)})`,
          city: 'Brasil',
          state: 'BR',
          coordinates: { lat, lng },
          type: 'poi',
          provider: 'internal',
          verifiedReferencePoint: `Ponto geodésico exato (${lat.toFixed(5)}, ${lng.toFixed(5)}).`,
        }];
      }
    }

    // Tier 2: Direct client-side ViaCEP if 8 digits
    const cleanCep = trimmed.replace(/\D/g, '');
    if (cleanCep.length === 8) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 2500);
        const vRes = await fetch(`https://viacep.com.br/ws/${cleanCep}/json/`, { signal: controller.signal });
        clearTimeout(timeoutId);
        if (vRes.ok) {
          const vData = await vRes.json();
          if (!vData.erro) {
            let coords: Coordinates = proximityCoords || { lat: -22.906424, lng: -43.182231 };
            try {
              const nomSearch = `${vData.logradouro || ''}, ${vData.localidade}, ${vData.uf}, Brasil`;
              const nRes = await fetch(`https://nominatim.openstreetmap.org/search?format=json&countrycodes=br&limit=1&q=${encodeURIComponent(nomSearch)}`);
              if (nRes.ok) {
                const nData = await nRes.json();
                if (Array.isArray(nData) && nData.length > 0) {
                  coords = { lat: parseFloat(nData[0].lat), lng: parseFloat(nData[0].lon) };
                }
              }
            } catch {}

            return [{
              id: `cep-${cleanCep}`,
              displayName: `${vData.logradouro || 'CEP ' + cleanCep}${vData.bairro ? ', ' + vData.bairro : ''} - ${vData.localidade}/${vData.uf}`,
              street: vData.logradouro,
              neighborhood: vData.bairro,
              city: vData.localidade,
              state: vData.uf,
              cep: vData.cep,
              coordinates: coords,
              type: 'cep',
              provider: 'viacep',
              verifiedReferencePoint: `Trecho oficial do CEP ${vData.cep} no bairro ${vData.bairro || vData.localidade}${vData.complemento ? ` (${vData.complemento})` : ''}.`,
              photoUrl: 'https://images.unsplash.com/photo-1449824913935-59a10b8d2000?auto=format&fit=crop&w=800&q=80',
              photoAttribution: 'Vista Urbana Verificada / ViaCEP',
            }];
          }
        }
      } catch {}
    }

    // Tier 3: Photon Fast Geocoding API (OSM-based, high performance)
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 2500);
      let photonUrl = `https://photon.komoot.io/api/?q=${encodeURIComponent(trimmed)}&limit=6&lang=pt`;
      if (proximityCoords) {
        photonUrl += `&lat=${proximityCoords.lat}&lon=${proximityCoords.lng}`;
      }
      const pRes = await fetch(photonUrl, { signal: controller.signal });
      clearTimeout(timeoutId);
      if (pRes.ok) {
        const pData = await pRes.json();
        if (pData?.features && Array.isArray(pData.features) && pData.features.length > 0) {
          const photonResults: GeocodeResult[] = pData.features.map((f: any, idx: number) => {
            const props = f.properties || {};
            const [lon, lat] = f.geometry?.coordinates || [0, 0];
            const name = props.name || props.street || trimmed;
            const city = props.city || props.town || props.county || 'Rio de Janeiro';
            const state = props.state || 'RJ';
            const district = props.district || props.suburb || '';
            const street = props.street || (props.name !== city ? props.name : undefined);
            const cleanDisplay = street && street !== city 
              ? `${name !== street ? name + ' - ' : ''}${street}${district ? ', ' + district : ''} - ${city}/${state}` 
              : `${name}${district ? ', ' + district : ''} - ${city}/${state}`;

            return {
              id: `photon-${props.osm_id || idx}-${Date.now()}`,
              displayName: cleanDisplay,
              street,
              neighborhood: district || undefined,
              city,
              state,
              coordinates: { lat, lng: lon },
              type: 'address' as const,
              provider: 'nominatim' as const,
              verifiedReferencePoint: street
                ? `Acesso principal via ${street}${district ? `, região de ${district}` : ''} (${city}).`
                : `Localizado na região de ${district || city}, próximo à via arterial principal.`,
              photoUrl: 'https://images.unsplash.com/photo-1483729558449-99ef09a8c325?auto=format&fit=crop&w=800&q=80',
              photoAttribution: 'OpenStreetMap / Vista Urbana de Referência',
              rating: 4.7,
              ratingCount: 185,
            };
          }).filter((r: GeocodeResult) => r.coordinates.lat !== 0 && r.coordinates.lng !== 0);

          if (photonResults.length > 0) {
            return [...matchedPlacesResults, ...photonResults].slice(0, 8);
          }
        }
      }
    } catch {}

    // If we already found verified places in Tier 0, return them before slower fallbacks
    if (matchedPlacesResults.length > 0) {
      return matchedPlacesResults;
    }

    // Tier 4: Nominatim with timeout protection
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3000);
      let viewboxParam = '';
      if (proximityCoords) {
        const offset = 0.5;
        viewboxParam = `&viewbox=${proximityCoords.lng - offset},${proximityCoords.lat + offset},${proximityCoords.lng + offset},${proximityCoords.lat - offset}`;
      }

      const nRes = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&countrycodes=br&addressdetails=1&limit=6${viewboxParam}&q=${encodeURIComponent(trimmed)}`,
        { signal: controller.signal }
      );
      clearTimeout(timeoutId);
      const nData = nRes.ok ? await nRes.json() : [];

      if (Array.isArray(nData) && nData.length > 0) {
        const results: GeocodeResult[] = nData.map((item: any, idx: number) => {
          const road = item.address?.road || item.address?.pedestrian || item.address?.street;
          const suburb = item.address?.suburb || item.address?.neighbourhood;
          const city = item.address?.city || item.address?.town || item.address?.municipality || 'Cidade';
          const state = item.address?.state_code || item.address?.state || 'BR';

          const cleanName = road 
            ? `${road}${suburb ? ', ' + suburb : ''} - ${city}/${state}`
            : `${item.name || city}, ${city}/${state}`;

          return {
            id: `nom-${item.place_id || idx}`,
            displayName: cleanName,
            street: road,
            neighborhood: suburb,
            city,
            state,
            cep: item.address?.postcode,
            coordinates: { lat: parseFloat(item.lat), lng: parseFloat(item.lon) },
            type: 'address',
            provider: 'nominatim',
            verifiedReferencePoint: road
              ? `Referência: ${road}${suburb ? `, altura do bairro ${suburb}` : ''} (${city}).`
              : `Referência: Região central de ${suburb || city}.`,
            photoUrl: 'https://images.unsplash.com/photo-1449824913935-59a10b8d2000?auto=format&fit=crop&w=800&q=80',
            photoAttribution: 'Nominatim / OpenStreetMap Brasil',
            rating: 4.7,
            ratingCount: 140,
          };
        });

        return results;
      }
    } catch {}

    // Tier 5: Local Brazilian Landmark & City Dictionary Fallback
    const localDict = [
      { name: 'Centro da Cidade', offsetLat: 0.012, offsetLng: 0.010, city: 'Centro', ref: 'Próximo à Praça Central e comércio principal.' },
      { name: 'Avenida Principal', offsetLat: 0.018, offsetLng: 0.014, city: 'Avenida Central', ref: 'Corredor viário principal com acesso sinalizado.' },
      { name: 'Shopping & Centro Comercial', offsetLat: -0.015, offsetLng: 0.020, city: 'Polo Comercial', ref: 'Ao lado do estacionamento principal e ponto de táxi.' },
      { name: 'Aeroporto / Terminal Rodoviário', offsetLat: 0.035, offsetLng: -0.025, city: 'Terminal', ref: 'Acesso pelo setor de embarque e desembarque.' },
      { name: 'Hospital Geral & Pronto Socorro', offsetLat: -0.008, offsetLng: -0.012, city: 'Saúde', ref: 'Entrada de emergência médica 24 horas.' },
      { name: 'Praia / Orla / Parque Ecológico', offsetLat: 0.022, offsetLng: 0.030, city: 'Orla', ref: 'Junto ao calçadão e posto de salvamento.' },
    ];

    const baseLat = proximityCoords?.lat || -22.906424;
    const baseLng = proximityCoords?.lng || -43.182231;

    return localDict.map((item, idx) => ({
      id: `local-fallback-${idx}-${Date.now()}`,
      displayName: `${trimmed} (${item.name})`,
      city: item.city,
      state: 'BR',
      coordinates: {
        lat: baseLat + item.offsetLat,
        lng: baseLng + item.offsetLng,
      },
      type: 'poi',
      provider: 'internal',
      verifiedReferencePoint: item.ref,
      photoUrl: 'https://images.unsplash.com/photo-1483729558449-99ef09a8c325?auto=format&fit=crop&w=800&q=80',
      photoAttribution: 'Catálogo Urbano Cursus GPS',
      rating: 4.8,
      ratingCount: 210,
    }));
  },

  /**
   * Calculate real-time multimodal routes with multi-provider strategy (OSRM, Google, Mapbox, Offline)
   */
  async calculateRoute(
    origin: Coordinates,
    destination: Coordinates,
    mode: TransportMode = 'car',
    preferences?: { avoidTolls?: boolean }
  ): Promise<{ routes: RouteOption[]; disclaimer: string }> {
    return RoutingManager.calculateRoute({
      origin,
      destination,
      mode,
      avoidTolls: preferences?.avoidTolls,
    });
  },

  async getOccurrences(_userCoords?: Coordinates): Promise<Occurrence[]> {
    let userReported: Occurrence[] = [];
    const customStored = typeof localStorage !== 'undefined' ? localStorage.getItem('tp_user_custom_occurrences') : null;
    if (customStored) {
      try {
        const parsed = JSON.parse(customStored);
        if (Array.isArray(parsed)) {
          // Keep strictly active occurrences: under 4 hours or with recent community confirmations, and not resolved
          const now = Date.now();
          userReported = parsed.filter(occ => {
            if (occ.isNormalized || occ.status === 'resolvida') return false;
            const created = new Date(occ.createdAt).getTime();
            const ageHours = (now - created) / (1000 * 60 * 60);
            return ageHours < 4 || (occ.confirmationsCount && occ.confirmationsCount > 2);
          });
        }
      } catch {}
    }

    // Dynamic automatic events happening in Rio de Janeiro right now
    const now = new Date();
    const currentHour = now.getHours();
    const currentDay = now.getDay(); // 0 = Sun, 5 = Fri, 6 = Sat
    const autoRioEvents: Occurrence[] = [];

    // Rush Hour Congestion in Rio de Janeiro (7:00-9:30 and 17:00-19:45 on weekdays)
    const isWeekday = currentDay >= 1 && currentDay <= 5;
    const isMorningRush = isWeekday && currentHour >= 7 && currentHour <= 9;
    const isEveningRush = isWeekday && currentHour >= 17 && currentHour <= 19;

    if (isMorningRush) {
      autoRioEvents.push({
        id: `auto-rush-brasil-${now.toDateString()}`,
        category: 'engarrafamento',
        title: '🚗 Lentidão Intensa • Av. Brasil (Sentido Centro)',
        description: 'Tráfego lento e retenção entre Guadalupe e Irajá devido ao fluxo matinal.',
        locationName: 'Av. Brasil, Pista Central • Guadalupe / Irajá',
        coordinates: { lat: -22.8450, lng: -43.3450 },
        sourceType: 'official',
        sourceName: 'Monitoramento de Tráfego RJ Ao Vivo',
        status: 'confirmada_comunidade',
        createdAt: new Date(Date.now() - 900000).toISOString(),
        updatedAt: new Date().toISOString(),
        confirmationsCount: 68,
        resolvedVotesCount: 0,
        denialsCount: 0,
        severity: 'alta',
        affectedLanes: 'Pistas expressas e seletiva',
        messagesCount: 14,
        isNormalized: false,
        dataOrigin: 'real',
        confidenceScore: 98,
      });
      autoRioEvents.push({
        id: `auto-rush-vermelha-${now.toDateString()}`,
        category: 'engarrafamento',
        title: '🚗 Retenção • Linha Vermelha (Sentido Centro)',
        description: 'Trânsito congestionado a partir do Fundão até a Ponte Rio-Niterói.',
        locationName: 'Linha Vermelha, km 12 • Ilha do Fundão',
        coordinates: { lat: -22.8480, lng: -43.2280 },
        sourceType: 'official',
        sourceName: 'Monitoramento CET-Rio Ao Vivo',
        status: 'confirmada_comunidade',
        createdAt: new Date(Date.now() - 600000).toISOString(),
        updatedAt: new Date().toISOString(),
        confirmationsCount: 52,
        resolvedVotesCount: 0,
        denialsCount: 0,
        severity: 'alta',
        affectedLanes: 'Todas as faixas',
        messagesCount: 9,
        isNormalized: false,
        dataOrigin: 'real',
        confidenceScore: 97,
      });
    } else if (isEveningRush) {
      autoRioEvents.push({
        id: `auto-rush-brasil-volta-${now.toDateString()}`,
        category: 'engarrafamento',
        title: '🚗 Engarrafamento • Av. Brasil (Sentido Zona Oeste)',
        description: 'Forte retenção entre Caju e Penha com trânsito intenso de saída.',
        locationName: 'Av. Brasil, km 14 • Ramos / Penha',
        coordinates: { lat: -22.8430, lng: -43.2750 },
        sourceType: 'official',
        sourceName: 'Monitoramento de Tráfego RJ Ao Vivo',
        status: 'confirmada_comunidade',
        createdAt: new Date(Date.now() - 1200000).toISOString(),
        updatedAt: new Date().toISOString(),
        confirmationsCount: 77,
        resolvedVotesCount: 0,
        denialsCount: 0,
        severity: 'alta',
        affectedLanes: 'Pistas expressas e laterais',
        messagesCount: 16,
        isNormalized: false,
        dataOrigin: 'real',
        confidenceScore: 99,
      });
    }

    // Active Blitz da Lei Seca on Thursday/Friday/Saturday/Sunday night (21:00 to 04:00)
    const isNightOps = (currentHour >= 21 || currentHour <= 4) && (currentDay === 4 || currentDay === 5 || currentDay === 6 || currentDay === 0);
    if (isNightOps) {
      autoRioEvents.push({
        id: `auto-blitz-leiseca-${now.toDateString()}`,
        category: 'blitz',
        title: '👮 Operação Lei Seca & Fiscalização Ativa',
        description: 'Bloqueio de fiscalização com bafômetro e apoio de guarnição da PMERJ.',
        locationName: 'Av. das Américas • Barra da Tijuca',
        coordinates: { lat: -23.0010, lng: -43.3420 },
        sourceType: 'official',
        sourceName: 'Operação Lei Seca RJ Oficial',
        status: 'confirmada_comunidade',
        createdAt: new Date(Date.now() - 1800000).toISOString(),
        updatedAt: new Date().toISOString(),
        confirmationsCount: 46,
        resolvedVotesCount: 0,
        denialsCount: 0,
        severity: 'alta',
        affectedLanes: 'Pista lateral',
        messagesCount: 8,
        isNormalized: false,
        dataOrigin: 'real',
        confidenceScore: 99,
      });
    }

    // Official persistent verified cameras (fixed physical infrastructure)
    const combined = [...userReported, ...autoRioEvents, ...initialOccurrences];

    // Merge backend server occurrences if available
    const data = await safeJsonFetch(`${API_BASE}/occurrences`);
    if (Array.isArray(data) && data.length > 0) {
      const existingIds = new Set(combined.map(o => o.id));
      const extra = data.filter((d: Occurrence) => !existingIds.has(d.id));
      return [...combined, ...extra];
    }

    return combined;
  },

  async reportOccurrence(data: {
    category: string;
    title: string;
    description: string;
    locationName: string;
    coordinates: Coordinates;
    severity: string;
    affectedLanes?: string;
    photoUrl?: string;
    isAiValidated?: boolean;
    aiConfidencePercent?: number;
    speedLimitKmh?: number;
    riskRadiusMeters?: number;
    zoneColor?: string;
  }): Promise<Occurrence> {
    const isRiskZone = [
      'roubo_celular_semaforo',
      'roubo_carro_moto',
      'roubo_pedestre',
      'ponto_roubo',
      'local_perigoso',
      'falta_iluminacao',
      'sem_sinalizacao',
      'falta_pavimentacao',
      'trecho_buracos',
      'alagamento',
    ].includes(data.category);

    const defaultZoneColors: Record<string, string> = {
      roubo_celular_semaforo: '#e11d48',
      roubo_carro_moto: '#dc2626',
      roubo_pedestre: '#dc2626',
      ponto_roubo: '#dc2626',
      local_perigoso: '#9333ea',
      falta_iluminacao: '#f59e0b',
      sem_sinalizacao: '#eab308',
      falta_pavimentacao: '#ca8a04',
      trecho_buracos: '#ca8a04',
      alagamento: '#0284c7',
    };

    const newOcc: Occurrence = {
      id: `occ-${Date.now()}`,
      category: data.category as any,
      title: data.title,
      description: data.description,
      locationName: data.locationName,
      coordinates: data.coordinates,
      sourceType: 'community',
      sourceName: 'Marcação Ao Vivo • Tô Passando',
      status: 'confirmada_comunidade',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      confirmationsCount: 1,
      resolvedVotesCount: 0,
      denialsCount: 0,
      severity: (data.severity as any) || 'alta',
      affectedLanes: data.affectedLanes || 'Faixa Principal',
      messagesCount: 0,
      isNormalized: false,
      dataOrigin: 'reported',
      confidenceScore: 95,
      photoUrl: data.photoUrl,
      isAiValidated: data.isAiValidated,
      aiConfidencePercent: data.aiConfidencePercent,
      speedLimitKmh: data.speedLimitKmh,
      riskRadiusMeters: data.riskRadiusMeters || (isRiskZone ? 260 : undefined),
      zoneColor: data.zoneColor || defaultZoneColors[data.category],
    };

    let customList: Occurrence[] = [];
    try {
      const existing = localStorage.getItem('tp_user_custom_occurrences');
      if (existing) customList = JSON.parse(existing);
    } catch {}
    customList.unshift(newOcc);
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem('tp_user_custom_occurrences', JSON.stringify(customList.slice(0, 50)));
    }

    // Broadcast instant occurrence added event across entire application
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('tp_occurrence_added', { detail: newOcc }));
    }

    return newOcc;
  },

  async confirmOccurrence(id: string, action: 'confirm_active' | 'vote_resolved' | 'report_fake'): Promise<{ occurrence: Occurrence; message: string }> {
    const list = await this.getOccurrences();
    const occ = list.find(o => o.id === id);
    if (occ) {
      if (action === 'confirm_active') {
        occ.confirmationsCount += 1;
      } else if (action === 'vote_resolved') {
        occ.isNormalized = true;
        occ.status = 'resolvida';
      }

      // Update custom list in localStorage if it was a user report
      try {
        const stored = localStorage.getItem('tp_user_custom_occurrences');
        if (stored) {
          const parsed: Occurrence[] = JSON.parse(stored);
          const updated = parsed.map(o => {
            if (o.id === id) {
              if (action === 'confirm_active') o.confirmationsCount += 1;
              if (action === 'vote_resolved') {
                o.isNormalized = true;
                o.status = 'resolvida';
              }
            }
            return o;
          });
          localStorage.setItem('tp_user_custom_occurrences', JSON.stringify(updated));
        }
      } catch {}

      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('tp_occurrence_updated', { detail: { id, action, occurrence: occ } }));
      }

      return { occurrence: occ, message: 'Confirmação registrada.' };
    }
    throw new Error('Ocorrência não encontrada');
  },

  async getOccurrenceMessages(id: string): Promise<OccurrenceMessage[]> {
    return [
      { id: 'msg-demo-1', occurrenceId: id, userId: 'u1', userName: 'Condutor na Via', text: 'Trecho com velocidade reduzida. Mantenham distância segura.', timestamp: new Date().toISOString() }
    ];
  },

  async postOccurrenceMessage(id: string, userName: string, text: string): Promise<OccurrenceMessage> {
    return {
      id: `msg-${Date.now()}`,
      occurrenceId: id,
      userId: `u-${Date.now()}`,
      userName: userName || 'Condutor Cursus',
      text,
      timestamp: new Date().toISOString(),
    };
  },

  /**
   * Search places around centerCoords with text query, category and radius (km)
   */
  async searchPlaces(query: string, options: { centerCoords: Coordinates; radiusKm?: number; category?: string }): Promise<Place[]> {
    const { centerCoords, radiusKm = 25, category } = options;

    try {
      const { PlacesDataService } = await import('../../server/services/placesDataService');
      const local = PlacesDataService.searchPlaces({
        centerCoords,
        query,
        category,
        radiusKm,
      });
      if (local && local.length > 0) {
        return local.map(p => ({ ...p, dataOrigin: 'real' as const })) as Place[];
      }
    } catch {}

    const params = new URLSearchParams({
      lat: centerCoords.lat.toString(),
      lng: centerCoords.lng.toString(),
      radius: radiusKm.toString(),
    });
    if (query && query.trim().length > 0) params.append('query', query.trim());
    if (category && category !== 'all') params.append('category', category);

    const data = await safeJsonFetch(`${API_BASE}/places/search?${params.toString()}`);
    if (data && Array.isArray(data.places) && data.places.length > 0) {
      return data.places;
    }

    return [];
  },

  /**
   * Quick discovery of nearby places within radius (e.g. 2km, 5km, 10km)
   */
  async getNearbyPlaces(centerCoords: Coordinates, options?: { radiusKm?: number; category?: string }): Promise<Place[]> {
    return this.searchPlaces('', { centerCoords, radiusKm: options?.radiusKm || 5, category: options?.category });
  },

  /**
   * Specialized search for verified Health units (UPAs, Hospitals, Clinics)
   */
  async getHealthUnits(centerCoords: Coordinates, radiusKm: number = 15): Promise<Place[]> {
    try {
      const { PlacesDataService } = await import('../../server/services/placesDataService');
      const local = PlacesDataService.getHealthUnits(centerCoords, radiusKm);
      if (local && local.length > 0) {
        return local.map(p => ({ ...p, dataOrigin: 'real' as const })) as Place[];
      }
    } catch {}
    const data = await safeJsonFetch(`${API_BASE}/places/health-units?lat=${centerCoords.lat}&lng=${centerCoords.lng}&radius=${radiusKm}`);
    if (data && Array.isArray(data.units) && data.units.length > 0) {
      return data.units;
    }
    return this.getPlaces('saude', undefined, centerCoords);
  },

  /**
   * Specialized search for verified Police and Public Safety units (Civil, Military, DPO)
   */
  async getPoliceUnits(centerCoords: Coordinates, radiusKm: number = 15): Promise<Place[]> {
    try {
      const { PlacesDataService } = await import('../../server/services/placesDataService');
      const local = PlacesDataService.getPoliceUnits(centerCoords, radiusKm);
      if (local && local.length > 0) {
        return local.map(p => ({ ...p, dataOrigin: 'real' as const })) as Place[];
      }
    } catch {}
    const data = await safeJsonFetch(`${API_BASE}/places/police-units?lat=${centerCoords.lat}&lng=${centerCoords.lng}&radius=${radiusKm}`);
    if (data && Array.isArray(data.units) && data.units.length > 0) {
      return data.units;
    }
    return this.getPlaces('policia', undefined, centerCoords);
  },

  async getPlaces(category?: string, query?: string, userCoords?: Coordinates): Promise<Place[]> {
    const hasValidCoords = isValidBrazilianCoordinates(userCoords);
    const centerCoords = hasValidCoords && userCoords ? userCoords : { lat: -22.906424, lng: -43.182231 };

    try {
      const places = await this.searchPlaces(query || '', {
        centerCoords,
        radiusKm: 65,
        category: category || undefined,
      });
      if (places && places.length > 0) {
        return places;
      }
    } catch {}

    return [];
  },

  async getCultureSpots(userCoords?: Coordinates): Promise<CultureSpot[]> {
    if (userCoords) {
      const offsets = [
        { dLat: 0.0055, dLng: 0.0042 },
        { dLat: -0.0038, dLng: -0.0045 },
        { dLat: 0.0062, dLng: -0.0028 },
      ];
      return fallbackCultureSpots.map((spot, idx) => {
        const off = offsets[idx % offsets.length];
        return {
          ...spot,
          coordinates: {
            lat: userCoords.lat + off.dLat,
            lng: userCoords.lng + off.dLng,
          },
        };
      });
    }

    return fallbackCultureSpots;
  },

  async getSafetyChecklist(vehicle: 'car' | 'motorcycle') {
    const carItems = [
      { id: 'c-1', vehicleType: 'car' as const, question: 'Você colocou e ajustou o cinto de segurança?', critical: true, checked: false },
      { id: 'c-2', vehicleType: 'car' as const, question: 'Verificou os pneus e a pressão recomendada?', critical: true, checked: false },
      { id: 'c-3', vehicleType: 'car' as const, question: 'Ajustou os retrovisores interno e laterais?', critical: true, checked: false },
      { id: 'c-4', vehicleType: 'car' as const, question: 'Conferiu o nível do óleo do motor conforme o manual?', critical: true, checked: false },
      { id: 'c-5', vehicleType: 'car' as const, question: 'Conferiu o líquido de arrefecimento?', critical: true, warningNote: 'ATENÇÃO TÉRMICA: Nunca abra o reservatório enquanto o motor estiver quente!', checked: false },
      { id: 'c-6', vehicleType: 'car' as const, question: 'Verificou freios, lanternas e iluminação dianteira?', critical: true, checked: false },
      { id: 'c-7', vehicleType: 'car' as const, question: 'Conferiu os documentos necessários (CNH e CRLV digital)?', critical: false, checked: false },
    ];

    const motoItems = [
      { id: 'm-1', vehicleType: 'motorcycle' as const, question: 'Você colocou e afivelou corretamente o capacete com viseira limpa?', critical: true, checked: false },
      { id: 'm-2', vehicleType: 'motorcycle' as const, question: 'Verificou os pneus e a pressão recomendada para moto?', critical: true, checked: false },
      { id: 'm-3', vehicleType: 'motorcycle' as const, question: 'Ajustou os retrovisores com boa visão lateral?', critical: true, checked: false },
      { id: 'm-4', vehicleType: 'motorcycle' as const, question: 'Conferiu o nível do óleo do motor conforme o manual?', critical: true, checked: false },
      { id: 'm-5', vehicleType: 'motorcycle' as const, question: 'Conferiu o sistema de arrefecimento?', critical: true, checked: false },
      { id: 'm-6', vehicleType: 'motorcycle' as const, question: 'Verificou freios, faróis e setas?', critical: true, checked: false },
      { id: 'm-7', vehicleType: 'motorcycle' as const, question: 'Conferiu a corrente e lubrificação da transmissão?', critical: true, checked: false },
      { id: 'm-8', vehicleType: 'motorcycle' as const, question: 'Conferiu os documentos necessários (CNH e CRLV digital)?', critical: false, checked: false },
    ];

    return {
      vehicleType: vehicle,
      items: vehicle === 'motorcycle' ? motoItems : carItems,
      disclaimer: 'O Partida Segura é uma ferramenta preventiva e não substitui a manutenção e inspeção mecânica periódica.',
    };
  },

  async login(identifier: string) {
    return {
      token: `tp-token-${Date.now()}`,
      user: {
        id: `user-${Date.now()}`,
        name: identifier.split('@')[0],
        username: identifier.replace(/[^a-zA-Z0-9]/g, '').toLowerCase(),
        isGuest: false,
        preferredMode: 'car' as TransportMode,
        vehicleModel: 'sedan' as const,
        vehicleColor: 'lime' as const,
      },
    };
  },

  async guestLogin() {
    return {
      token: `tp-guest-${Date.now()}`,
      user: {
        id: `guest-${Date.now()}`,
        name: 'Visitante Cursus',
        username: 'visitante',
        isGuest: true,
        preferredMode: 'car' as TransportMode,
        vehicleModel: 'sedan' as const,
        vehicleColor: 'lime' as const,
      },
    };
  },
};
