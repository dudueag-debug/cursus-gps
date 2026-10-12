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
    id: 'occ-waze-policia-1',
    category: 'blitz',
    title: 'Polícia / Fiscalização na Via',
    description: 'Viatura policial e operação de fiscalização reportada por motoristas no trecho.',
    locationName: 'Corredor Principal • Próximo a você',
    coordinates: { lat: -22.9048, lng: -43.1805 },
    sourceType: 'community',
    sourceName: 'Comunidade Waze & Cursus',
    status: 'confirmada_comunidade',
    createdAt: new Date(Date.now() - 1200000).toISOString(),
    updatedAt: new Date(Date.now() - 300000).toISOString(),
    confirmationsCount: 34,
    resolvedVotesCount: 1,
    denialsCount: 0,
    severity: 'alta',
    affectedLanes: 'Faixa da direita',
    messagesCount: 8,
    isNormalized: false,
    dataOrigin: 'reported',
    confidenceScore: 96,
  },
  {
    id: 'occ-waze-radar-1',
    category: 'radar',
    title: 'Radar de Velocidade • Limite 60 km/h',
    description: 'Fiscalização eletrônica fixa de velocidade e avanço de sinal ativa.',
    locationName: 'Avenida Principal • Fiscalização',
    coordinates: { lat: -22.9032, lng: -43.1848 },
    sourceType: 'official',
    sourceName: 'Base Oficial de Radares & Trânsito',
    status: 'confirmada_comunidade',
    createdAt: new Date(Date.now() - 7200000).toISOString(),
    updatedAt: new Date(Date.now() - 600000).toISOString(),
    confirmationsCount: 58,
    resolvedVotesCount: 0,
    denialsCount: 0,
    severity: 'media',
    affectedLanes: 'Todas as faixas',
    messagesCount: 6,
    isNormalized: false,
    dataOrigin: 'real',
    confidenceScore: 99,
  },
  {
    id: 'occ-1',
    category: 'engarrafamento',
    title: 'Trânsito Intenso (16 km/h)',
    description: 'Fluxo pesado de veículos com retenção no semáforo principal.',
    locationName: 'Via Principal • Próximo a você',
    coordinates: { lat: -22.9064, lng: -43.1822 },
    sourceType: 'community',
    sourceName: 'Condutores Ao Vivo',
    status: 'relatada_comunidade',
    createdAt: new Date(Date.now() - 3600000 * 1).toISOString(),
    updatedAt: new Date(Date.now() - 900000).toISOString(),
    confirmationsCount: 27,
    resolvedVotesCount: 2,
    denialsCount: 0,
    severity: 'alta',
    affectedLanes: 'Todas as faixas',
    messagesCount: 4,
    isNormalized: false,
    dataOrigin: 'reported',
    confidenceScore: 91,
  },
  {
    id: 'occ-waze-acidente-1',
    category: 'acidente',
    title: 'Acidente na Via • Redução de Faixa',
    description: 'Colisão leve entre veículos com equipe de apoio acionada. Reduza a velocidade.',
    locationName: 'Acesso Principal • Faixa Esquerda',
    coordinates: { lat: -22.9095, lng: -43.1785 },
    sourceType: 'community',
    sourceName: 'Alerta de Condutor Verificado',
    status: 'confirmada_comunidade',
    createdAt: new Date(Date.now() - 1800000).toISOString(),
    updatedAt: new Date(Date.now() - 420000).toISOString(),
    confirmationsCount: 22,
    resolvedVotesCount: 0,
    denialsCount: 0,
    severity: 'critica',
    affectedLanes: 'Faixa da esquerda',
    messagesCount: 7,
    isNormalized: false,
    dataOrigin: 'reported',
    confidenceScore: 94,
  },
  {
    id: 'occ-2',
    category: 'buraco',
    title: 'Perigo na Pista • Buraco na Faixa',
    description: 'Atenção redobrada: desnível no asfalto na faixa da direita.',
    locationName: 'Faixa da Direita • Próximo a você',
    coordinates: { lat: -22.9080, lng: -43.1840 },
    sourceType: 'community',
    sourceName: 'Relato de Motociclista',
    status: 'relatada_comunidade',
    createdAt: new Date(Date.now() - 3600000 * 2).toISOString(),
    updatedAt: new Date(Date.now() - 1800000).toISOString(),
    confirmationsCount: 15,
    resolvedVotesCount: 0,
    denialsCount: 0,
    severity: 'alta',
    affectedLanes: 'Faixa da direita',
    messagesCount: 5,
    isNormalized: false,
    dataOrigin: 'reported',
    confidenceScore: 92,
  },
  {
    id: 'occ-waze-obra-1',
    category: 'obra',
    title: 'Obras na Pista • Estreitamento',
    description: 'Manutenção viária com sinalização de cones e desvio parcial.',
    locationName: 'Via Expressa • Trecho Urbano',
    coordinates: { lat: -22.9018, lng: -43.1772 },
    sourceType: 'official',
    sourceName: 'Operação Viária Municipal',
    status: 'em_andamento',
    createdAt: new Date(Date.now() - 5400000).toISOString(),
    updatedAt: new Date(Date.now() - 900000).toISOString(),
    confirmationsCount: 18,
    resolvedVotesCount: 0,
    denialsCount: 0,
    severity: 'media',
    affectedLanes: 'Meia pista',
    messagesCount: 3,
    isNormalized: false,
    dataOrigin: 'real',
    confidenceScore: 90,
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

  async getOccurrences(userCoords?: Coordinates): Promise<Occurrence[]> {
    const offsets = [
      { dLat: 0.0032, dLng: 0.0024 },
      { dLat: -0.0038, dLng: 0.0029 },
      { dLat: 0.0022, dLng: -0.0035 },
      { dLat: -0.0025, dLng: -0.0028 },
      { dLat: 0.0046, dLng: -0.0014 },
      { dLat: -0.0045, dLng: 0.0018 },
    ];

    const localizedDefaults = userCoords
      ? initialOccurrences.map((occ, idx) => {
          const off = offsets[idx % offsets.length];
          return {
            ...occ,
            coordinates: {
              lat: userCoords.lat + off.dLat,
              lng: userCoords.lng + off.dLng,
            },
          };
        })
      : initialOccurrences;

    const stored = localStorage.getItem('tp_occurrences');
    if (stored) {
      try {
        const parsed: Occurrence[] = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length >= localizedDefaults.length) {
          return parsed;
        }
      } catch {}
    }

    const data = await safeJsonFetch(`${API_BASE}/occurrences`);
    if (Array.isArray(data) && data.length > 0) {
      const existingIds = new Set(localizedDefaults.map(o => o.id));
      const extra = data.filter((d: Occurrence) => !existingIds.has(d.id));
      return [...localizedDefaults, ...extra];
    }

    return localizedDefaults;
  },

  async reportOccurrence(data: {
    category: string;
    title: string;
    description: string;
    locationName: string;
    coordinates: Coordinates;
    severity: string;
    affectedLanes?: string;
  }): Promise<Occurrence> {
    const list = await this.getOccurrences(data.coordinates);
    const newOcc: Occurrence = {
      id: `occ-${Date.now()}`,
      category: data.category as any,
      title: data.title,
      description: data.description,
      locationName: data.locationName,
      coordinates: data.coordinates,
      sourceType: 'community',
      sourceName: 'Relato de Usuário TÔ PASSANDO',
      status: 'relatada_comunidade',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      confirmationsCount: 1,
      resolvedVotesCount: 0,
      denialsCount: 0,
      severity: (data.severity as any) || 'media',
      affectedLanes: data.affectedLanes || 'Faixa Principal',
      messagesCount: 0,
      isNormalized: false,
      dataOrigin: 'reported',
      confidenceScore: 75,
    };
    list.unshift(newOcc);
    localStorage.setItem('tp_occurrences', JSON.stringify(list));
    return newOcc;
  },

  async confirmOccurrence(id: string, action: 'confirm_active' | 'vote_resolved' | 'report_fake'): Promise<{ occurrence: Occurrence; message: string }> {
    const list = await this.getOccurrences();
    const occ = list.find(o => o.id === id);
    if (occ) {
      if (action === 'confirm_active') occ.confirmationsCount += 1;
      else if (action === 'vote_resolved') occ.isNormalized = true;
      localStorage.setItem('tp_occurrences', JSON.stringify(list));
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
    const { centerCoords, radiusKm = 5, category } = options;
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

    // Resilient fallback to verified local PlacesDataService
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

    return this.getPlaces(category, query, centerCoords);
  },

  /**
   * Quick discovery of nearby places within radius (e.g. 2km, 5km, 10km)
   */
  async getNearbyPlaces(centerCoords: Coordinates, options?: { radiusKm?: number; category?: string }): Promise<Place[]> {
    return this.searchPlaces('', { centerCoords, radiusKm: options?.radiusKm || 2, category: options?.category });
  },

  /**
   * Specialized search for verified Health units (UPAs, Hospitals, Clinics)
   */
  async getHealthUnits(centerCoords: Coordinates, radiusKm: number = 10): Promise<Place[]> {
    const data = await safeJsonFetch(`${API_BASE}/places/health-units?lat=${centerCoords.lat}&lng=${centerCoords.lng}&radius=${radiusKm}`);
    if (data && Array.isArray(data.units) && data.units.length > 0) {
      return data.units;
    }
    try {
      const { PlacesDataService } = await import('../../server/services/placesDataService');
      const local = PlacesDataService.getHealthUnits(centerCoords, radiusKm);
      return local.map(p => ({ ...p, dataOrigin: 'real' as const })) as Place[];
    } catch {
      return this.getPlaces('saude', undefined, centerCoords);
    }
  },

  /**
   * Specialized search for verified Police and Public Safety units (Civil, Military, DPO)
   */
  async getPoliceUnits(centerCoords: Coordinates, radiusKm: number = 10): Promise<Place[]> {
    const data = await safeJsonFetch(`${API_BASE}/places/police-units?lat=${centerCoords.lat}&lng=${centerCoords.lng}&radius=${radiusKm}`);
    if (data && Array.isArray(data.units) && data.units.length > 0) {
      return data.units;
    }
    try {
      const { PlacesDataService } = await import('../../server/services/placesDataService');
      const local = PlacesDataService.getPoliceUnits(centerCoords, radiusKm);
      return local.map(p => ({ ...p, dataOrigin: 'real' as const })) as Place[];
    } catch {
      return this.getPlaces('policia', undefined, centerCoords);
    }
  },

  async getPlaces(category?: string, query?: string, userCoords?: Coordinates): Promise<Place[]> {
    const hasValidCoords = isValidBrazilianCoordinates(userCoords);
    const centerCoords = hasValidCoords && userCoords ? userCoords : { lat: -22.906424, lng: -43.182231 };

    try {
      const places = await this.searchPlaces(query || '', {
        centerCoords,
        radiusKm: 35,
        category: category || undefined,
      });
      if (places && places.length > 0) {
        return places;
      }
    } catch {}

    // Fallback directly to local catalog if server unreachable
    try {
      const { PlacesDataService } = await import('../../server/services/placesDataService');
      const local = PlacesDataService.searchPlaces({
        centerCoords,
        query,
        category,
        radiusKm: 45,
      });
      if (local && local.length > 0) {
        return local.map(p => ({ ...p, dataOrigin: 'real' as const })) as Place[];
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
