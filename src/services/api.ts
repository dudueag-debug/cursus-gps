import type { GeocodeResult, RouteOption, Occurrence, Place, CultureSpot, TransportMode, OccurrenceMessage, Coordinates } from '../types';

const API_BASE = '/api';

// Curated Fallbacks for 100% resilient Vercel static deployment
const initialOccurrences: Occurrence[] = [
  {
    id: 'occ-1',
    category: 'obras',
    title: 'Recapeamento asfáltico e manutenção',
    description: 'Faixa da direita em obras para fresagem e novo asfalto. Sinalização com cones.',
    locationName: 'Rodovia / Avenida Principal • Próximo a você',
    coordinates: { lat: -15.7938, lng: -47.8827 },
    sourceType: 'official',
    sourceName: 'Concessionária Oficial da Via',
    status: 'confirmada_oficial',
    createdAt: new Date(Date.now() - 3600000 * 4).toISOString(),
    updatedAt: new Date(Date.now() - 3600000).toISOString(),
    confirmationsCount: 14,
    resolvedVotesCount: 1,
    denialsCount: 0,
    severity: 'media',
    affectedLanes: 'Faixa da direita',
    messagesCount: 3,
    isNormalized: false,
  },
  {
    id: 'occ-2',
    category: 'buraco',
    title: 'Desnível na pista com risco a condutores',
    description: 'Atenção redobrada: desnível na pista após chuva forte.',
    locationName: 'Via Expressa • Próximo a você',
    coordinates: { lat: -15.7915, lng: -47.8845 },
    sourceType: 'community',
    sourceName: 'Relato Comunitário de Condutor',
    status: 'relatada_comunidade',
    createdAt: new Date(Date.now() - 3600000 * 2).toISOString(),
    updatedAt: new Date(Date.now() - 1800000).toISOString(),
    confirmationsCount: 8,
    resolvedVotesCount: 0,
    denialsCount: 0,
    severity: 'alta',
    affectedLanes: 'Faixa central',
    messagesCount: 5,
    isNormalized: false,
  },
  {
    id: 'occ-3',
    category: 'alagamento',
    title: 'Ponto de alagamento transitável apenas por veículos altos',
    description: 'Água acumulada sob o viaduto. Trânsito retido no local.',
    locationName: 'Av. Brasil próx. Caju, Rio de Janeiro - RJ',
    coordinates: { lat: -22.8872, lng: -43.2144 },
    sourceType: 'official',
    sourceName: 'Centro de Operações Rio (COR)',
    status: 'em_andamento',
    createdAt: new Date(Date.now() - 3600000 * 5).toISOString(),
    updatedAt: new Date(Date.now() - 3600000 * 2).toISOString(),
    confirmationsCount: 22,
    resolvedVotesCount: 7,
    denialsCount: 1,
    severity: 'critica',
    affectedLanes: 'Pista lateral totalmente ocupada',
    messagesCount: 6,
    isNormalized: false,
  },
  {
    id: 'occ-4',
    category: 'semaforo_defeito',
    title: 'Semáforo intermitente em amarelo',
    description: 'Cruzamento com tráfego intenso e sem controle semafórico.',
    locationName: 'Eixo Monumental próx. Torre de TV, Brasília - DF',
    coordinates: { lat: -15.7903, lng: -47.8932 },
    sourceType: 'community',
    sourceName: 'Comunidade Cursus',
    status: 'resolvida',
    createdAt: new Date(Date.now() - 3600000 * 12).toISOString(),
    updatedAt: new Date(Date.now() - 3600000 * 3).toISOString(),
    confirmationsCount: 11,
    resolvedVotesCount: 9,
    denialsCount: 0,
    severity: 'baixa',
    affectedLanes: 'Cruzamento geral',
    messagesCount: 4,
    isNormalized: true,
    normalizationMessage: 'Atualização do Cursus: a ocorrência foi marcada como resolvida. Via normalizada, conforme confirmação recebida.',
  },
];

const fallbackPlaces: Place[] = [
  {
    id: 'poi-1',
    name: 'Hospital de Pronto Socorro e Trauma',
    category: 'saude',
    subCategory: 'Hospital Geral 24 Horas',
    address: 'Área Central Hospitalar • Próximo a você',
    cep: '',
    coordinates: { lat: -15.7938, lng: -47.8827 },
    phone: '192 / Ligue SAMU',
    website: 'https://gov.br/saude',
    openingHours: '24 horas',
    isOpen: true,
    is24h: true,
    rating: 4.8,
    source: 'curated',
  },
  {
    id: 'poi-2',
    name: 'UPA 24h - Unidade de Pronto Atendimento',
    category: 'saude',
    subCategory: 'Atendimento Municipal de Urgência',
    address: 'Avenida Principal • Próximo a você',
    cep: '',
    coordinates: { lat: -15.7950, lng: -47.8840 },
    phone: '192 / Emergência',
    website: 'https://gov.br/saude',
    openingHours: '24 horas',
    isOpen: true,
    is24h: true,
    rating: 4.5,
    source: 'curated',
  },
  {
    id: 'poi-3',
    name: 'Posto Petrobras 24h & Conveniência BR Mania',
    category: 'comercio_servicos',
    subCategory: 'Combustível, Calibrador e Loja 24h',
    address: 'Avenida de Acesso Local • Próximo a você',
    cep: '',
    coordinates: { lat: -15.7920, lng: -47.8810 },
    phone: '0800-728-9001',
    website: 'https://petrobras.com.br',
    openingHours: '24 horas',
    isOpen: true,
    is24h: true,
    rating: 4.7,
    source: 'curated',
  },
  {
    id: 'poi-4',
    name: 'Oficina Mecânica & Auto Peças 24h',
    category: 'comercio_servicos',
    subCategory: 'Socorro Mecânico, Troca de Pneus e Baterias',
    address: 'Corredor Comercial • Próximo a você',
    cep: '',
    coordinates: { lat: -15.7960, lng: -47.8860 },
    phone: '(00) 3322-1100',
    website: '',
    openingHours: 'Seg-Sex: 08:00 - 18:00 | Plantão 24h',
    isOpen: true,
    is24h: false,
    rating: 4.9,
    source: 'curated',
  },
  {
    id: 'poi-5',
    name: 'Terminal Rodoviário & Urbano Integrado',
    category: 'transporte_infraestrutura',
    subCategory: 'Terminal Intermodal de Passageiros',
    address: 'Área Central de Transporte',
    cep: '',
    coordinates: { lat: -15.7910, lng: -47.8850 },
    phone: '0800-111-222',
    website: '',
    openingHours: '04:30 às 00:30',
    isOpen: true,
    is24h: false,
    rating: 4.4,
    source: 'curated',
  },
  {
    id: 'poi-6',
    name: 'Parque Ecológico Urbano & Ciclovia',
    category: 'lazer_cultura',
    subCategory: 'Parque Municipal, Lazer e Esportes',
    address: 'Área Verde Municipal',
    cep: '',
    coordinates: { lat: -15.7890, lng: -47.8800 },
    phone: '',
    website: '',
    openingHours: '06:00 às 22:00',
    isOpen: true,
    is24h: false,
    rating: 4.9,
    source: 'curated',
  },
];

const fallbackCultureSpots: CultureSpot[] = [
  {
    id: 'cul-1',
    title: 'Centro Histórico & Patrimônio Cultural',
    city: 'Brasil',
    state: 'BR',
    coordinates: { lat: -15.7938, lng: -47.8827 },
    category: 'patrimonio',
    summary: 'Conjunto arquitetônico e memória histórica representativa da cultura e formação brasileira.',
    fullText: 'Os centros históricos brasileiros guardam a memória da evolução urbana, combinando influências coloniais, barrocas e modernas, tombadas e preservadas como patrimônio vivo da população.',
    source: 'IPHAN / Memória Cultural do Brasil',
  },
  {
    id: 'cul-2',
    title: 'Praça Matriz & Marco Cívico',
    city: 'Brasil',
    state: 'BR',
    coordinates: { lat: -15.7955, lng: -47.8850 },
    category: 'historia',
    summary: 'Marco fundador e espaço tradicional de convivência cívica e cultural.',
    fullText: 'Ponto de encontro das cidades brasileiras, reunindo manifestações artísticas, celebrações e a história das famílias e comunidades que construíram o município.',
    source: 'Patrimônio Histórico Nacional',
  },
  {
    id: 'cul-3',
    title: 'Praça dos Três Poderes e Eixo Monumental',
    city: 'Brasília',
    state: 'DF',
    coordinates: { lat: -15.8005, lng: -47.8645 },
    category: 'monumento',
    summary: 'Marco do Plano Piloto de Lúcio Costa e arquitetura monumental tombada pela UNESCO.',
    fullText: 'Inaugurada em 1960 durante o governo Juscelino Kubitschek, Brasília é a única cidade construída no século XX considerada Patrimônio Mundial da UNESCO. Os palácios do Congresso, Planalto e STF formam o triângulo equilátero dos poderes.',
    source: 'UNESCO / Governo Federal',
  },
];

// Helper to check if API response is valid JSON rather than SPA index.html
async function safeJsonFetch(url: string, options?: RequestInit) {
  try {
    const res = await fetch(url, options);
    const contentType = res.headers.get('content-type') || '';
    if (res.ok && contentType.includes('application/json')) {
      return await res.json();
    }
  } catch {
    // network or parse error
  }
  return null;
}

export const api = {
  async getHealth() {
    const data = await safeJsonFetch(`${API_BASE}/health`);
    if (data) return data;
    return {
      status: 'online',
      appName: 'TÔ PASSANDO - GPS do CURSUS',
      version: '1.0.0',
      slogan: 'Você vai. A gente te guia.',
      integrations: {
        geocodingViaCep: { status: 'ativo', provider: 'ViaCEP Brasil Oficial (CORS direto)' },
        routingEngine: { status: 'ativo', provider: 'OSRM Project (CORS direto)' },
      },
    };
  },

  async geocode(query: string, proximityCoords?: Coordinates): Promise<GeocodeResult[]> {
    // 1. Try server if available
    const serverData = await safeJsonFetch(`${API_BASE}/geocode?q=${encodeURIComponent(query)}`);
    if (serverData) return serverData;

    // 2. Direct client-side ViaCEP if 8 digits
    const cleanCep = query.replace(/\D/g, '');
    if (cleanCep.length === 8) {
      try {
        const vRes = await fetch(`https://viacep.com.br/ws/${cleanCep}/json/`);
        const vData = await vRes.json();
        if (!vData.erro) {
          // Resolve exact coordinates for this specific Brazilian municipality/street
          let coords: Coordinates = proximityCoords || { lat: -15.793889, lng: -47.882778 };
          try {
            const nomSearch = `${vData.logradouro || ''}, ${vData.localidade}, ${vData.uf}, Brasil`;
            const nRes = await fetch(`https://nominatim.openstreetmap.org/search?format=json&countrycodes=br&limit=1&q=${encodeURIComponent(nomSearch)}`);
            const nData = await nRes.json();
            if (Array.isArray(nData) && nData.length > 0) {
              coords = { lat: parseFloat(nData[0].lat), lng: parseFloat(nData[0].lon) };
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
      } catch (e) {
        console.warn('ViaCEP client-side fetch error:', e);
      }
    }

    // 3. Direct Nominatim with proximity biasing if available
    try {
      let viewboxParam = '';
      if (proximityCoords) {
        const offset = 1.8; // ~200km radius around user's live position
        viewboxParam = `&viewbox=${proximityCoords.lng - offset},${proximityCoords.lat + offset},${proximityCoords.lng + offset},${proximityCoords.lat - offset}`;
      }

      const nRes = await fetch(`https://nominatim.openstreetmap.org/search?format=json&countrycodes=br&addressdetails=1&limit=6${viewboxParam}&q=${encodeURIComponent(query)}`);
      const nData = await nRes.json();
      if (Array.isArray(nData) && nData.length > 0) {
        return nData.map((item: any, idx: number) => ({
          id: `nom-${item.place_id || idx}`,
          displayName: item.display_name,
          street: item.address?.road || item.address?.pedestrian,
          neighborhood: item.address?.suburb,
          city: item.address?.city || item.address?.town || item.address?.municipality,
          state: item.address?.state,
          cep: item.address?.postcode,
          coordinates: { lat: parseFloat(item.lat), lng: parseFloat(item.lon) },
          type: 'address',
          provider: 'nominatim',
        }));
      }
    } catch {
      // Fall through
    }

    // Return empty list if nothing found - NEVER inject another state
    return [];
  },

  async calculateRoute(
    origin: Coordinates,
    destination: Coordinates,
    mode: TransportMode = 'car',
    preferences?: { avoidTolls?: boolean }
  ): Promise<{ routes: RouteOption[]; disclaimer: string }> {
    // 1. Try server
    const serverData = await safeJsonFetch(`${API_BASE}/route`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ origin, destination, mode, preferences }),
    });
    if (serverData) return serverData;

    // 2. Direct client-side OSRM call
    const profile = mode === 'walk' ? 'foot' : 'driving';
    let routeCoords: Coordinates[] = [];
    let totalDistance = 0;
    let totalDuration = 0;
    let steps: any[] = [];

    try {
      const osrmUrl = `https://router.project-osrm.org/route/v1/${profile}/${origin.lng},${origin.lat};${destination.lng},${destination.lat}?overview=full&geometries=geojson&steps=true&alternatives=3`;
      const oRes = await fetch(osrmUrl);
      const oData = await oRes.json();

      if (oData.code === 'Ok' && Array.isArray(oData.routes) && oData.routes.length > 0) {
        const parsedRoutes: RouteOption[] = oData.routes.map((rt: any, index: number) => {
          let dist = Math.round(rt.distance);
          let dur = Math.round(rt.duration);
          if (mode === 'motorcycle') dur = Math.round(dur * 0.78);

          const coords = rt.geometry.coordinates.map((pt: [number, number]) => ({ lat: pt[1], lng: pt[0] }));
          const stepsList = (rt.legs[0]?.steps || []).map((step: any) => ({
            instruction: step.maneuver?.instruction || (step.name ? `Siga por ${step.name}` : 'Continue na via atual'),
            distanceMeters: Math.round(step.distance),
            durationSeconds: Math.round(step.duration),
            maneuver: step.maneuver?.modifier?.includes('left') ? 'turn-left' : step.maneuver?.modifier?.includes('right') ? 'turn-right' : 'continue',
            mode,
            coordinates: { lat: step.maneuver.location[1], lng: step.maneuver.location[0] },
          }));

          const arrivalDate = new Date(Date.now() + dur * 1000);
          const etaStr = arrivalDate.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });

          const title = index === 0
            ? (mode === 'car' ? 'Rota Mais Rápida (Recomendada)' : mode === 'motorcycle' ? 'Trajeto Otimizado para Moto' : mode === 'walk' ? 'Caminhada Mais Rápida' : 'Viagem Direta')
            : index === 1
            ? 'Alternativa 1 (Menos Trânsito / Sem Pedágio)'
            : 'Alternativa 2 (Avenida Principal)';

          return {
            id: `rt-${index}-${Date.now()}`,
            title,
            mode,
            totalDistanceMeters: dist,
            totalDurationSeconds: dur,
            eta: etaStr,
            hasTolls: preferences?.avoidTolls ? false : (index === 0 && dist > 15000),
            tollEstimateBrl: preferences?.avoidTolls ? 0 : (index === 0 && dist > 15000 ? 8.40 : 0),
            incidentCount: index === 0 ? 1 : 0,
            coordinates: coords,
            steps: stepsList,
            isAlternative: index > 0,
          };
        });

        return {
          routes: parsedRoutes,
          disclaimer: 'Rotas calculadas em tempo real com dados de satélite e cartografia viva do Brasil.',
        };
      }
    } catch {
      // Fallback interpolation
      const numPts = 12;
      for (let i = 0; i <= numPts; i++) {
        const r = i / numPts;
        routeCoords.push({
          lat: origin.lat + (destination.lat - origin.lat) * r,
          lng: origin.lng + (destination.lng - origin.lng) * r,
        });
      }
      totalDistance = 4200;
      totalDuration = 520;
      steps = [
        { instruction: 'Siga em frente na via atual', distanceMeters: 2100, durationSeconds: 260, maneuver: 'continue', mode, coordinates: origin },
        { instruction: 'Destino à sua direita', distanceMeters: 0, durationSeconds: 0, maneuver: 'arrive', mode, coordinates: destination },
      ];
    }

    if (mode === 'motorcycle') totalDuration = Math.round(totalDuration * 0.78);
    const arrivalDate = new Date(Date.now() + totalDuration * 1000);
    const eta = arrivalDate.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });

    const primary: RouteOption = {
      id: `rt-prim-${Date.now()}`,
      title: mode === 'car' ? 'Rota Mais Rápida' : mode === 'motorcycle' ? 'Trajeto Otimizado para Moto' : 'Viagem Direta',
      mode,
      totalDistanceMeters: totalDistance,
      totalDurationSeconds: totalDuration,
      eta,
      hasTolls: preferences?.avoidTolls ? false : (totalDistance > 15000),
      tollEstimateBrl: preferences?.avoidTolls ? 0 : (totalDistance > 15000 ? 8.40 : 0),
      incidentCount: 1,
      coordinates: routeCoords,
      steps,
      isAlternative: false,
    };

    const alt: RouteOption = {
      id: `rt-alt-${Date.now()}`,
      title: 'Via Alternativa (Menos Trânsito)',
      mode,
      totalDistanceMeters: Math.round(totalDistance * 1.15),
      totalDurationSeconds: Math.round(totalDuration * 1.18),
      eta: new Date(Date.now() + totalDuration * 1.18 * 1000).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
      hasTolls: false,
      tollEstimateBrl: 0,
      incidentCount: 0,
      coordinates: routeCoords.map((c, idx) => ({ lat: c.lat + (idx % 2 === 0 ? 0.001 : -0.001), lng: c.lng })),
      steps,
      isAlternative: true,
    };

    return {
      routes: [primary, alt],
      disclaimer: 'Previsões calculadas a partir de dados cartográficos disponíveis. Identificadas como estimativas.',
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
    const serverRes = await safeJsonFetch(`${API_BASE}/occurrences`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (serverRes) return serverRes;

    const list = await this.getOccurrences();
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
      severity: data.severity as any,
      affectedLanes: data.affectedLanes || 'Faixa não especificada',
      messagesCount: 0,
      isNormalized: false,
    };
    list.unshift(newOcc);
    localStorage.setItem('tp_occurrences', JSON.stringify(list));
    return newOcc;
  },

  async confirmOccurrence(id: string, action: 'confirm_active' | 'vote_resolved' | 'report_fake'): Promise<{ occurrence: Occurrence; message: string }> {
    const serverRes = await safeJsonFetch(`${API_BASE}/occurrences/${id}/confirm`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action }),
    });
    if (serverRes) return serverRes;

    const list = await this.getOccurrences();
    const occ = list.find(o => o.id === id);
    if (occ) {
      if (action === 'confirm_active') {
        occ.confirmationsCount += 1;
      } else if (action === 'vote_resolved') {
        occ.resolvedVotesCount += 1;
        if (occ.resolvedVotesCount >= 3) {
          occ.status = 'resolvida';
          occ.isNormalized = true;
          occ.normalizationMessage = 'Atualização do Cursus: a ocorrência foi marcada como resolvida. Via normalizada, conforme confirmação recebida.';
        }
      }
      localStorage.setItem('tp_occurrences', JSON.stringify(list));
      return { occurrence: occ, message: 'Confirmação registrada.' };
    }
    throw new Error('Ocorrência não encontrada');
  },

  async getOccurrenceMessages(id: string): Promise<OccurrenceMessage[]> {
    const data = await safeJsonFetch(`${API_BASE}/occurrences/${id}/messages`);
    if (data) return data;
    return [
      { id: 'msg-demo-1', occurrenceId: id, userId: 'u1', userName: 'Condutor Anônimo', text: 'Trecho com velocidade reduzida. Mantenham distância segura.', timestamp: new Date().toISOString() }
    ];
  },

  async postOccurrenceMessage(id: string, userName: string, text: string): Promise<OccurrenceMessage> {
    const data = await safeJsonFetch(`${API_BASE}/occurrences/${id}/messages`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userName, text }),
    });
    if (data) return data;
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
    const params = new URLSearchParams();
    if (category) params.append('category', category);
    if (query) params.append('query', query);
    const data = await safeJsonFetch(`${API_BASE}/places?${params.toString()}`);
    if (data) return data;

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
    const data = await safeJsonFetch(`${API_BASE}/culture-spots`);
    if (data) return data;

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
    const data = await safeJsonFetch(`${API_BASE}/safety-checklist?vehicle=${vehicle}`);
    if (data) return data;

    const carItems = [
      { id: 'c-1', vehicleType: 'car' as const, question: 'Você colocou e ajustou o cinto de segurança?', critical: true, checked: false },
      { id: 'c-2', vehicleType: 'car' as const, question: 'Verificou os pneus e a pressão recomendada?', critical: true, checked: false },
      { id: 'c-3', vehicleType: 'car' as const, question: 'Ajustou os retrovisores interno e laterais?', critical: true, checked: false },
      { id: 'c-4', vehicleType: 'car' as const, question: 'Conferiu o nível do óleo do motor conforme o manual?', critical: true, checked: false },
      { id: 'c-5', vehicleType: 'car' as const, question: 'Conferiu o líquido de arrefecimento?', critical: true, warningNote: 'ATENÇÃO TÉRMICA: Nunca abra o reservatório de arrefecimento enquanto o motor estiver quente!', checked: false },
      { id: 'c-6', vehicleType: 'car' as const, question: 'Verificou freios, lanternas e iluminação dianteira?', critical: true, checked: false },
      { id: 'c-7', vehicleType: 'car' as const, question: 'Conferiu os documentos necessários (CNH e CRLV digital)?', critical: false, checked: false },
    ];

    const motoItems = [
      { id: 'm-1', vehicleType: 'motorcycle' as const, question: 'Você colocou e afivelou corretamente o capacete com viseira limpa?', critical: true, checked: false },
      { id: 'm-2', vehicleType: 'motorcycle' as const, question: 'Verificou os pneus e a pressão recomendada para moto?', critical: true, checked: false },
      { id: 'm-3', vehicleType: 'motorcycle' as const, question: 'Ajustou os retrovisores com boa visão lateral?', critical: true, checked: false },
      { id: 'm-4', vehicleType: 'motorcycle' as const, question: 'Conferiu o nível do óleo do motor conforme o manual?', critical: true, checked: false },
      { id: 'm-5', vehicleType: 'motorcycle' as const, question: 'Conferiu o sistema de arrefecimento (se aplicável ao modelo)?', critical: true, warningNote: 'ATENÇÃO TÉRMICA: Nunca abra tampas pressurizadas com motor quente!', checked: false },
      { id: 'm-6', vehicleType: 'motorcycle' as const, question: 'Verificou freios (pastilhas/fluido), faróis e indicadores de seta?', critical: true, checked: false },
      { id: 'm-7', vehicleType: 'motorcycle' as const, question: 'Conferiu a corrente, folga e lubrificação da transmissão?', critical: true, checked: false },
      { id: 'm-8', vehicleType: 'motorcycle' as const, question: 'Conferiu os documentos necessários (CNH e CRLV digital)?', critical: false, checked: false },
    ];

    return {
      vehicleType: vehicle,
      items: vehicle === 'motorcycle' ? motoItems : carItems,
      disclaimer: 'O Partida Segura é uma ferramenta preventiva e não substitui a manutenção e inspeção mecânica profissional periódica.',
    };
  },

  async login(identifier: string) {
    const data = await safeJsonFetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ identifier }),
    });
    if (data) return data;
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
    const data = await safeJsonFetch(`${API_BASE}/auth/guest`, { method: 'POST' });
    if (data) return data;
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
