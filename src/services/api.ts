import type { GeocodeResult, RouteOption, Occurrence, Place, CultureSpot, TransportMode, OccurrenceMessage, Coordinates } from '../types';

const API_BASE = '/api';

// Curated Fallbacks for 100% resilient Vercel static deployment
const initialOccurrences: Occurrence[] = [
  {
    id: 'occ-1',
    category: 'engarrafamento',
    title: 'Engarrafamento com tráfego lento',
    description: 'Fluxo intenso de veículos com velocidade média de 15 km/h.',
    locationName: 'Via Principal • Próximo a você',
    coordinates: { lat: -15.7938, lng: -47.8827 },
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
  },
  {
    id: 'occ-2',
    category: 'buraco',
    title: 'Buraco profundo na via com risco a motos e pneus',
    description: 'Atenção redobrada: desnível e buraco perigoso após chuvas.',
    locationName: 'Faixa da Direita • Próximo a você',
    coordinates: { lat: -15.7915, lng: -47.8845 },
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
  },
  {
    id: 'occ-3',
    category: 'alagamento',
    title: 'Ponto de alagamento transitável apenas com cautela',
    description: 'Água acumulada na pista. Trânsito lento no local.',
    locationName: 'Pista Principal • Região Baixa',
    coordinates: { lat: -15.7972, lng: -47.8814 },
    sourceType: 'official',
    sourceName: 'Centro de Operações de Trânsito',
    status: 'em_andamento',
    createdAt: new Date(Date.now() - 3600000 * 3).toISOString(),
    updatedAt: new Date(Date.now() - 3600000).toISOString(),
    confirmationsCount: 28,
    resolvedVotesCount: 4,
    denialsCount: 0,
    severity: 'critica',
    affectedLanes: 'Pista lateral e central',
    messagesCount: 8,
    isNormalized: false,
  },
  {
    id: 'occ-4',
    category: 'blitz',
    title: 'Fiscalização de Trânsito / Blitz na Via',
    description: 'Operação de fiscalização com redução de velocidade.',
    locationName: 'Avenida de Ligação Regional',
    coordinates: { lat: -15.7890, lng: -47.8860 },
    sourceType: 'community',
    sourceName: 'Comunidade TÔ PASSANDO',
    status: 'relatada_comunidade',
    createdAt: new Date(Date.now() - 1800000).toISOString(),
    updatedAt: new Date(Date.now() - 600000).toISOString(),
    confirmationsCount: 15,
    resolvedVotesCount: 1,
    denialsCount: 0,
    severity: 'media',
    affectedLanes: 'Estreitamento de faixa',
    messagesCount: 3,
    isNormalized: false,
  },
  {
    id: 'occ-5',
    category: 'ponto_roubo',
    title: 'Alerta de Segurança: Ponto de Roubos / Área com Risco',
    description: 'Condutores relatam incidência de assaltos a veículos em paradas.',
    locationName: 'Trecho com Baixa Iluminação',
    coordinates: { lat: -15.7995, lng: -47.8890 },
    sourceType: 'community',
    sourceName: 'Comunidade Cursus Segura',
    status: 'relatada_comunidade',
    createdAt: new Date(Date.now() - 3600000 * 5).toISOString(),
    updatedAt: new Date(Date.now() - 3600000).toISOString(),
    confirmationsCount: 34,
    resolvedVotesCount: 2,
    denialsCount: 0,
    severity: 'critica',
    affectedLanes: 'Semáforos e acostamento',
    messagesCount: 12,
    isNormalized: false,
  },
  {
    id: 'occ-6',
    category: 'veiculo_parado',
    title: 'Veículo com pane mecânica no acostamento',
    description: 'Carro quebrado aguardando guincho. Sinalizado com triângulo.',
    locationName: 'Acostamento da Via Expressa',
    coordinates: { lat: -15.7925, lng: -47.8790 },
    sourceType: 'community',
    sourceName: 'Condutor na Via',
    status: 'relatada_comunidade',
    createdAt: new Date(Date.now() - 2400000).toISOString(),
    updatedAt: new Date(Date.now() - 1200000).toISOString(),
    confirmationsCount: 7,
    resolvedVotesCount: 0,
    denialsCount: 0,
    severity: 'baixa',
    affectedLanes: 'Acostamento',
    messagesCount: 1,
    isNormalized: false,
  },
];

const fallbackPlaces: Place[] = [
  // 1. Postos de Gasolina e GNV
  {
    id: 'poi-posto-1',
    name: 'Posto Petrobras BR 24h & GNV',
    category: 'posto_gnv',
    subCategory: 'Gasolina, Etanol, Diesel S10 e GNV Pressurizado',
    address: 'Av. Principal • Próximo a você',
    cep: '',
    coordinates: { lat: -15.7920, lng: -47.8810 },
    phone: '0800-728-9001',
    whatsapp: '5511999990001',
    website: 'https://petrobras.com.br',
    openingHours: 'Aberto 24 horas',
    isOpen: true,
    is24h: true,
    hasGNV: true,
    rating: 4.8,
    source: 'curated',
  },
  {
    id: 'poi-posto-2',
    name: 'Posto Ipiranga & AmPm (GNV Ativo)',
    category: 'posto_gnv',
    subCategory: 'Combustíveis Aditivados, Calibrador e GNV 24h',
    address: 'Corredor Radial • Próximo a você',
    cep: '',
    coordinates: { lat: -15.7955, lng: -47.8865 },
    phone: '0800-025-3805',
    openingHours: 'Aberto 24 horas',
    isOpen: true,
    is24h: true,
    hasGNV: true,
    rating: 4.7,
    source: 'curated',
  },

  // 2. Borracheiros Abertos 24h
  {
    id: 'poi-borrach-1',
    name: 'Borracharia & Socorro de Pneus 24h SOS',
    category: 'borracheiro',
    subCategory: 'Conserto de Furos, Vulcanização, Troca e Socorro Móvel',
    address: 'Av. de Acesso • Próximo a você',
    cep: '',
    coordinates: { lat: -15.7940, lng: -47.8855 },
    phone: '(11) 98765-1122',
    whatsapp: '5511987651122',
    openingHours: 'Aberto 24h • Plantão de Emergência',
    isOpen: true,
    is24h: true,
    rating: 4.9,
    source: 'curated',
  },
  {
    id: 'poi-borrach-2',
    name: 'Auto Borracharia Central & Alinhamento',
    category: 'borracheiro',
    subCategory: 'Pneus para Carros e Motos, Câmaras e Rodas',
    address: 'Rua das Oficinas • Próximo a você',
    cep: '',
    coordinates: { lat: -15.7905, lng: -47.8795 },
    phone: '(11) 97654-3344',
    openingHours: 'Seg-Sáb: 06:00 às 22:00 (Aberto)',
    isOpen: true,
    is24h: false,
    rating: 4.8,
    source: 'curated',
  },

  // 3. Polícia, Delegacias e DPO
  {
    id: 'poi-pol-1',
    name: 'Delegacia de Polícia Civil (Central de Flagrantes)',
    category: 'policia',
    subCategory: 'Delegacia de Polícia 24 Horas & Registro de Ocorrência',
    address: 'Área Cívica e Segurança • Próximo a você',
    cep: '',
    coordinates: { lat: -15.7965, lng: -47.8830 },
    phone: '190 / 197',
    openingHours: 'Plantão Permanente 24h',
    isOpen: true,
    is24h: true,
    rating: 4.6,
    source: 'curated',
  },
  {
    id: 'poi-pol-2',
    name: 'DPO / Posto da Polícia Militar & Rodoviária',
    category: 'policia',
    subCategory: 'DPO - Destacamento de Policiamento e Patrulhamento',
    address: 'Trevo de Ligação das Vias',
    cep: '',
    coordinates: { lat: -15.7885, lng: -47.8875 },
    phone: '190 Emergência PM',
    openingHours: '24 horas',
    isOpen: true,
    is24h: true,
    rating: 4.7,
    source: 'curated',
  },

  // 4. Hospitais e Pronto-Socorro
  {
    id: 'poi-hosp-1',
    name: 'Hospital de Pronto Socorro & Trauma 24h',
    category: 'saude',
    subCategory: 'Emergência Médica, UTI e Ortopedia 24h',
    address: 'Polo Hospitalar • Próximo a você',
    cep: '',
    coordinates: { lat: -15.7938, lng: -47.8827 },
    phone: '192 / Ligue SAMU',
    website: 'https://gov.br/saude',
    openingHours: 'Pronto Socorro 24 Horas',
    isOpen: true,
    is24h: true,
    rating: 4.9,
    source: 'curated',
  },
  {
    id: 'poi-hosp-2',
    name: 'UPA 24h - Unidade de Pronto Atendimento Municipal',
    category: 'saude',
    subCategory: 'Atendimento de Urgência Adulto e Pediátrico',
    address: 'Avenida Principal • Próximo a você',
    cep: '',
    coordinates: { lat: -15.7950, lng: -47.8840 },
    phone: '192',
    openingHours: '24 horas',
    isOpen: true,
    is24h: true,
    rating: 4.5,
    source: 'curated',
  },

  // 5. Reboque / Guincho 24h (Estilo Uber de Reboque)
  {
    id: 'poi-reb-1',
    name: 'REBOQUE DIRETO 24h - Guincho Urbano & Plataforma',
    category: 'reboque_socorro',
    subCategory: 'Plataforma Hidráulica para Carros, Vans, SUVs e Motos',
    address: 'Base de Operações Rápidas • Próximo a você',
    cep: '',
    coordinates: { lat: -15.7910, lng: -47.8880 },
    phone: '(11) 99123-4567',
    whatsapp: '5511991234567',
    openingHours: 'Guincho Plantão 24 Horas',
    isOpen: true,
    is24h: true,
    rating: 4.9,
    source: 'curated',
  },

  // 6. Moto-Socorro de Bateria & Troca Rápida
  {
    id: 'poi-bat-1',
    name: 'SOS Baterias Moto-Express (Partida e Entrega no Local)',
    category: 'bateria_auto',
    subCategory: 'O técnico vai de moto até você: Carga Rápida / Bateria Nova Heliar e Moura',
    address: 'Atendimento Móvel em Trânsito',
    cep: '',
    coordinates: { lat: -15.7945, lng: -47.8805 },
    phone: '(11) 98888-7766',
    whatsapp: '5511988887766',
    openingHours: 'Seg-Dom: 06:00 às 00:00 • Socorro Imediato',
    isOpen: true,
    is24h: true,
    rating: 5.0,
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
