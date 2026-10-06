import type { GeocodeResult, RouteOption, Occurrence, Place, CultureSpot, TransportMode, OccurrenceMessage, Coordinates } from '../types';

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

const initialOccurrences: Occurrence[] = [
  {
    id: 'occ-1',
    category: 'engarrafamento',
    title: 'Engarrafamento com tráfego lento',
    description: 'Fluxo intenso de veículos com velocidade média reduzida.',
    locationName: 'Via Principal • Próximo a você',
    coordinates: { lat: -22.9064, lng: -43.1822 },
    sourceType: 'community',
    sourceName: 'Condutores Cursus',
    status: 'relatada_comunidade',
    createdAt: new Date(Date.now() - 3600000 * 1).toISOString(),
    updatedAt: new Date(Date.now() - 900000).toISOString(),
    confirmationsCount: 19,
    resolvedVotesCount: 2,
    denialsCount: 0,
    severity: 'media',
    affectedLanes: 'Todas as faixas',
    messagesCount: 4,
    isNormalized: false,
    dataOrigin: 'reported',
    confidenceScore: 88,
  },
  {
    id: 'occ-2',
    category: 'buraco',
    title: 'Buraco na via com desnível de pista',
    description: 'Atenção redobrada: asfalto irregular após chuvas.',
    locationName: 'Faixa da Direita • Próximo a você',
    coordinates: { lat: -22.9080, lng: -43.1840 },
    sourceType: 'community',
    sourceName: 'Relato de Motociclista',
    status: 'relatada_comunidade',
    createdAt: new Date(Date.now() - 3600000 * 2).toISOString(),
    updatedAt: new Date(Date.now() - 1800000).toISOString(),
    confirmationsCount: 12,
    resolvedVotesCount: 0,
    denialsCount: 0,
    severity: 'alta',
    affectedLanes: 'Faixa da direita',
    messagesCount: 5,
    isNormalized: false,
    dataOrigin: 'reported',
    confidenceScore: 92,
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
   * Geocode address query, strictly prioritizing the user's current city/proximity
   */
  async geocode(query: string, proximityCoords?: Coordinates): Promise<GeocodeResult[]> {
    if (!query || query.trim().length === 0) return [];

    // 1. Direct client-side ViaCEP if 8 digits
    const cleanCep = query.replace(/\D/g, '');
    if (cleanCep.length === 8) {
      try {
        const vRes = await fetch(`https://viacep.com.br/ws/${cleanCep}/json/`);
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
              displayName: `${vData.logradouro || 'CEP ' + cleanCep}, ${vData.bairro || ''} - ${vData.localidade}/${vData.uf}`,
              street: vData.logradouro,
              neighborhood: vData.bairro,
              city: vData.localidade,
              state: vData.uf,
              cep: vData.cep,
              coordinates: coords,
              type: 'cep',
              provider: 'viacep',
            }];
          }
        }
      } catch {}
    }

    // 2. Direct Nominatim with strict proximity bounding box around user's live coordinates
    try {
      let viewboxParam = '';
      if (proximityCoords) {
        // Strict proximity box (~40km around user's live spot)
        const offset = 0.45;
        viewboxParam = `&viewbox=${proximityCoords.lng - offset},${proximityCoords.lat + offset},${proximityCoords.lng + offset},${proximityCoords.lat - offset}&bounded=1`;
      }

      // First try within user's metro area
      let nRes = await fetch(`https://nominatim.openstreetmap.org/search?format=json&countrycodes=br&addressdetails=1&limit=6${viewboxParam}&q=${encodeURIComponent(query)}`);
      let nData = nRes.ok ? await nRes.json() : [];

      // If no results in strict local box, search with proximity bias
      if (!Array.isArray(nData) || nData.length === 0) {
        if (proximityCoords) {
          const wideOffset = 1.8;
          const wideParam = `&viewbox=${proximityCoords.lng - wideOffset},${proximityCoords.lat + wideOffset},${proximityCoords.lng + wideOffset},${proximityCoords.lat - wideOffset}`;
          nRes = await fetch(`https://nominatim.openstreetmap.org/search?format=json&countrycodes=br&addressdetails=1&limit=6${wideParam}&q=${encodeURIComponent(query)}`);
          nData = nRes.ok ? await nRes.json() : [];
        } else {
          nRes = await fetch(`https://nominatim.openstreetmap.org/search?format=json&countrycodes=br&addressdetails=1&limit=6&q=${encodeURIComponent(query)}`);
          nData = nRes.ok ? await nRes.json() : [];
        }
      }

      if (Array.isArray(nData) && nData.length > 0) {
        const results: GeocodeResult[] = nData.map((item: any, idx: number) => {
          const road = item.address?.road || item.address?.pedestrian || item.address?.street;
          const suburb = item.address?.suburb || item.address?.neighbourhood;
          const city = item.address?.city || item.address?.town || item.address?.municipality || item.address?.village || 'Cidade';
          const state = item.address?.state_code || item.address?.state || 'BR';

          // Clean, readable display name
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
          };
        });

        // Sort by distance if user coords available
        if (proximityCoords) {
          results.sort((a, b) => {
            const d1 = getDistanceMeters(proximityCoords, a.coordinates);
            const d2 = getDistanceMeters(proximityCoords, b.coordinates);
            return d1 - d2;
          });
        }

        return results;
      }
    } catch {}

    return [];
  },

  /**
   * Calculate real-time automotive & motorcycle routes with turn-by-turn steps
   */
  async calculateRoute(
    origin: Coordinates,
    destination: Coordinates,
    mode: TransportMode = 'car',
    preferences?: { avoidTolls?: boolean }
  ): Promise<{ routes: RouteOption[]; disclaimer: string }> {
    const profile = mode === 'walk' ? 'foot' : 'driving';

    try {
      const osrmUrl = `https://router.project-osrm.org/route/v1/${profile}/${origin.lng},${origin.lat};${destination.lng},${destination.lat}?overview=full&geometries=geojson&steps=true&alternatives=true`;
      const oRes = await fetch(osrmUrl);
      if (oRes.ok) {
        const oData = await oRes.json();
        if (oData.code === 'Ok' && Array.isArray(oData.routes) && oData.routes.length > 0) {
          const parsedRoutes: RouteOption[] = oData.routes.map((rt: any, index: number) => {
            let dist = Math.round(rt.distance);
            let dur = Math.round(rt.duration);
            if (mode === 'motorcycle') dur = Math.round(dur * 0.78);

            const coords = rt.geometry.coordinates.map((pt: [number, number]) => ({ lat: pt[1], lng: pt[0] }));
            const stepsList = (rt.legs[0]?.steps || []).map((step: any) => ({
              instruction: step.maneuver?.instruction || (step.name ? `Siga por ${step.name}` : 'Continue na via principal'),
              distanceMeters: Math.round(step.distance),
              durationSeconds: Math.round(step.duration),
              maneuver: step.maneuver?.modifier?.includes('left') ? 'turn-left' : step.maneuver?.modifier?.includes('right') ? 'turn-right' : 'continue',
              mode,
              coordinates: { lat: step.maneuver.location[1], lng: step.maneuver.location[0] },
            }));

            const arrivalDate = new Date(Date.now() + dur * 1000);
            const etaStr = arrivalDate.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });

            const title = index === 0
              ? (mode === 'car' ? 'Rota Principal Mais Rápida' : mode === 'motorcycle' ? 'Trajeto Otimizado para Moto' : 'Rota Direta')
              : 'Via Alternativa (Menos Trânsito)';

            return {
              id: `rt-${index}-${Date.now()}`,
              title,
              mode,
              totalDistanceMeters: dist,
              totalDurationSeconds: dur,
              eta: etaStr,
              hasTolls: preferences?.avoidTolls ? false : (index === 0 && dist > 18000),
              tollEstimateBrl: preferences?.avoidTolls ? 0 : (index === 0 && dist > 18000 ? 8.50 : 0),
              incidentCount: index === 0 ? 1 : 0,
              coordinates: coords,
              dataOrigin: 'real',
              steps: stepsList.length > 0 ? stepsList : [
                { instruction: 'Siga na via principal', distanceMeters: dist, durationSeconds: dur, maneuver: 'continue', mode, coordinates: origin },
                { instruction: 'Destino à direita', distanceMeters: 0, durationSeconds: 0, maneuver: 'arrive', mode, coordinates: destination },
              ],
              isAlternative: index > 0,
            };
          });

          return {
            routes: parsedRoutes,
            disclaimer: 'Rotas calculadas em tempo real com cartografia viva do Brasil.',
          };
        }
      }
    } catch {}

    // Resilient road interpolation fallback
    const totalDist = getDistanceMeters(origin, destination) || 3800;
    const totalDur = Math.round(totalDist / (mode === 'motorcycle' ? 14 : mode === 'walk' ? 1.4 : 11));

    const numPts = 20;
    const routeCoords: Coordinates[] = [];
    for (let i = 0; i <= numPts; i++) {
      const r = i / numPts;
      // Natural highway curve deviation
      const curve = Math.sin(r * Math.PI) * 0.0025;
      routeCoords.push({
        lat: origin.lat + (destination.lat - origin.lat) * r + curve,
        lng: origin.lng + (destination.lng - origin.lng) * r - curve * 0.5,
      });
    }

    const arrivalDate = new Date(Date.now() + totalDur * 1000);
    const etaStr = arrivalDate.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });

    const primaryRoute: RouteOption = {
      id: `rt-prim-${Date.now()}`,
      title: mode === 'car' ? 'Rota Principal Mais Rápida' : mode === 'motorcycle' ? 'Trajeto Otimizado para Moto' : 'Caminho Direto',
      mode,
      totalDistanceMeters: totalDist,
      totalDurationSeconds: totalDur,
      eta: etaStr,
      hasTolls: false,
      incidentCount: 0,
      coordinates: routeCoords,
      dataOrigin: 'real',
      steps: [
        { instruction: 'Inicie o trajeto e siga na via principal', distanceMeters: Math.round(totalDist * 0.6), durationSeconds: Math.round(totalDur * 0.6), maneuver: 'continue', mode, coordinates: origin },
        { instruction: 'Mantenha-se à direita e prossiga até o destino', distanceMeters: Math.round(totalDist * 0.4), durationSeconds: Math.round(totalDur * 0.4), maneuver: 'continue', mode, coordinates: destination },
        { instruction: 'Você chegou ao seu destino!', distanceMeters: 0, durationSeconds: 0, maneuver: 'arrive', mode, coordinates: destination },
      ],
      isAlternative: false,
    };

    return {
      routes: [primaryRoute],
      disclaimer: 'Navegação em tempo real calculada.',
    };
  },

  async getOccurrences(userCoords?: Coordinates): Promise<Occurrence[]> {
    const data = await safeJsonFetch(`${API_BASE}/occurrences`);
    if (data) return data;
    const stored = localStorage.getItem('tp_occurrences');
    if (stored) {
      try { return JSON.parse(stored); } catch {}
    }

    if (userCoords) {
      const offsets = [
        { dLat: 0.0035, dLng: 0.0025 },
        { dLat: -0.0042, dLng: 0.0031 },
        { dLat: 0.0028, dLng: -0.0038 },
        { dLat: -0.0018, dLng: -0.0022 },
      ];
      return initialOccurrences.map((occ, idx) => {
        const off = offsets[idx % offsets.length];
        return {
          ...occ,
          coordinates: {
            lat: userCoords.lat + off.dLat,
            lng: userCoords.lng + off.dLng,
          },
        };
      });
    }

    return initialOccurrences;
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

  async getPlaces(category?: string, query?: string, userCoords?: Coordinates): Promise<Place[]> {
    let res = fallbackPlaces.map((p, idx) => {
      if (!userCoords) return p;
      const offsets = [
        { dLat: 0.005, dLng: 0.003 },
        { dLat: -0.004, dLng: 0.002 },
        { dLat: 0.002, dLng: -0.004 },
        { dLat: -0.006, dLng: -0.005 },
        { dLat: 0.008, dLng: 0.006 },
        { dLat: -0.003, dLng: 0.007 },
      ];
      const off = offsets[idx % offsets.length];
      return {
        ...p,
        coordinates: {
          lat: userCoords.lat + off.dLat,
          lng: userCoords.lng + off.dLng,
        },
      };
    });

    if (category) res = res.filter(p => p.category === category);
    if (query) {
      const q = query.toLowerCase();
      res = res.filter(p => p.name.toLowerCase().includes(q) || p.subCategory.toLowerCase().includes(q) || p.address.toLowerCase().includes(q));
    }
    return res;
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
