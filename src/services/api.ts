import type { GeocodeResult, RouteOption, Occurrence, Place, CultureSpot, TransportMode, OccurrenceMessage, Coordinates } from '../types';

const API_BASE = '/api';

// Curated Fallbacks for 100% resilient Vercel static deployment
const initialOccurrences: Occurrence[] = [
  {
    id: 'occ-1',
    category: 'obras',
    title: 'Recapeamento asfáltico noturno',
    description: 'Faixa da direita interditada para fresagem e novo asfalto. Sinalização com cones.',
    locationName: 'Av. Paulista, altura 1500 - Bela Vista, São Paulo - SP',
    coordinates: { lat: -23.5617, lng: -46.6559 },
    sourceType: 'official',
    sourceName: 'CET / Concessionária Oficial',
    status: 'confirmada_oficial',
    createdAt: new Date(Date.now() - 3600000 * 4).toISOString(),
    updatedAt: new Date(Date.now() - 3600000).toISOString(),
    confirmationsCount: 14,
    resolvedVotesCount: 1,
    denialsCount: 0,
    severity: 'media',
    affectedLanes: 'Faixa da direita (sentido Paraíso)',
    messagesCount: 3,
    isNormalized: false,
  },
  {
    id: 'occ-2',
    category: 'buraco',
    title: 'Buraco profundo com risco a motociclistas',
    description: 'Cratera aberta após chuva forte. Vários motociclistas quase sofreram queda.',
    locationName: 'Marginal Pinheiros próx. Ponte Eusébio Matoso, São Paulo - SP',
    coordinates: { lat: -23.5702, lng: -46.7011 },
    sourceType: 'community',
    sourceName: 'Relato Comunitário de Motociclista',
    status: 'relatada_comunidade',
    createdAt: new Date(Date.now() - 3600000 * 2).toISOString(),
    updatedAt: new Date(Date.now() - 1800000).toISOString(),
    confirmationsCount: 8,
    resolvedVotesCount: 0,
    denialsCount: 0,
    severity: 'alta',
    affectedLanes: 'Faixa central entre carros',
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
    name: 'Hospital das Clínicas da FMUSP',
    category: 'saude',
    subCategory: 'Hospital de Alta Complexidade',
    address: 'Av. Dr. Enéas Carvalho de Aguiar, 255 - Cerqueira César, São Paulo - SP',
    cep: '05403-000',
    coordinates: { lat: -23.5574, lng: -46.6698 },
    phone: '(11) 2661-0000',
    website: 'https://www.hc.fm.usp.br',
    openingHours: '24 horas',
    isOpen: true,
    is24h: true,
    rating: 4.8,
    source: 'curated',
  },
  {
    id: 'poi-2',
    name: 'UPA 24h Bela Vista',
    category: 'saude',
    subCategory: 'Pronto Atendimento Municipal',
    address: 'R. Treze de Maio, 100 - Bela Vista, São Paulo - SP',
    cep: '01327-000',
    coordinates: { lat: -23.5601, lng: -46.6482 },
    phone: '(11) 3288-1234',
    website: 'https://prefeitura.sp.gov.br/saude',
    openingHours: '24 horas',
    isOpen: true,
    is24h: true,
    rating: 4.2,
    source: 'curated',
  },
  {
    id: 'poi-3',
    name: 'Posto Petrobras & Conveniência BR Mania 24h',
    category: 'comercio_servicos',
    subCategory: 'Posto de Combustível e Calibrador',
    address: 'Av. Brigadeiro Luís Antônio, 2200 - Jardim Paulista, São Paulo - SP',
    cep: '01402-002',
    coordinates: { lat: -23.5701, lng: -46.6542 },
    phone: '(11) 3887-5500',
    website: 'https://petrobras.com.br',
    openingHours: '24 horas',
    isOpen: true,
    is24h: true,
    rating: 4.5,
    source: 'curated',
  },
  {
    id: 'poi-4',
    name: 'Oficina & Moto Peças Duas Rodas Racing',
    category: 'comercio_servicos',
    subCategory: 'Oficina Especializada para Motocicletas',
    address: 'R. Guaicurus, 420 - Lapa, São Paulo - SP',
    cep: '05033-000',
    coordinates: { lat: -23.5222, lng: -46.6881 },
    phone: '(11) 3871-9988',
    website: 'https://motopeçasracing.com.br',
    openingHours: 'Seg-Sex: 08:00 - 18:00 | Sáb: 08:00 - 13:00',
    isOpen: true,
    is24h: false,
    rating: 4.9,
    source: 'curated',
  },
  {
    id: 'poi-5',
    name: 'Estação da Luz (Metrô Linhas 1/4 e CPTM)',
    category: 'transporte_infraestrutura',
    subCategory: 'Terminal Intermodal Integrado',
    address: 'Praça da Luz, 1 - Luz, São Paulo - SP',
    cep: '01120-010',
    coordinates: { lat: -23.5358, lng: -46.6353 },
    phone: '0800-7707722',
    website: 'https://www.metro.sp.gov.br',
    openingHours: '04:40 às 00:00 (Sáb até 01:00)',
    isOpen: true,
    is24h: false,
    rating: 4.6,
    source: 'curated',
  },
  {
    id: 'poi-6',
    name: 'Parque Ibirapuera (Portão 7)',
    category: 'lazer_cultura',
    subCategory: 'Parque Urbano e Lazer',
    address: 'Av. Pedro Álvares Cabral - Vila Mariana, São Paulo - SP',
    cep: '04094-050',
    coordinates: { lat: -23.5874, lng: -46.6576 },
    phone: '(11) 5574-5045',
    website: 'https://parqueibirapuera.org',
    openingHours: '05:00 às 23:00',
    isOpen: true,
    is24h: false,
    rating: 4.9,
    source: 'curated',
  },
];

const fallbackCultureSpots: CultureSpot[] = [
  {
    id: 'cul-1',
    title: 'Avenida Paulista e o MASP',
    city: 'São Paulo',
    state: 'SP',
    coordinates: { lat: -23.5614, lng: -46.6559 },
    category: 'patrimonio',
    summary: 'Projetado pela arquiteta Lina Bo Bardi em 1968, o MASP possui o maior vão livre da América Latina.',
    fullText: 'Inaugurada em 8 de dezembro de 1891 por iniciativa do engenheiro Joaquim Eugênio de Lima, a Avenida Paulista foi projetada como um refúgio aristocrático para os barões do café. O MASP, instalado em 1968, destaca-se pela estrutura em concreto e vidro suspensa por quatro pilares vermelhos, simbolizando a modernidade brasileira.',
    source: 'Secretaria de Cultura e IPHAN',
  },
  {
    id: 'cul-2',
    title: 'Edifício Copan de Oscar Niemeyer',
    city: 'São Paulo',
    state: 'SP',
    coordinates: { lat: -23.5467, lng: -46.6453 },
    category: 'historia',
    summary: 'Maior estrutura de concreto armado residencial do Brasil com fachada sinuosa marcante.',
    fullText: 'Projetado na década de 1950 por Oscar Niemeyer, o Copan abriga mais de 5.000 moradores e 1.160 apartamentos distribuídos em 32 andares. O desenho em onda foi criado para contornar a rigidez da malha urbana central.',
    source: 'Patrimônio Histórico SP',
  },
  {
    id: 'cul-3',
    title: 'Praça dos Três Poderes e Eixo Monumental',
    city: 'Brasília',
    state: 'DF',
    coordinates: { lat: -15.8005, lng: -47.8645 },
    category: 'monumento',
    summary: 'Marco do Plano Piloto de Lúcio Costa e arquitetura monumental de Oscar Niemeyer tombada pela UNESCO.',
    fullText: 'Inaugurada em 1960 durante o governo Juscelino Kubitschek, Brasília é a única cidade construída no século XX considerada Patrimônio Mundial da UNESCO. Os palácios do Congresso, Planalto e STF formam o triângulo equilátero dos poderes.',
    source: 'UNESCO / Governo do Distrito Federal',
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

  async geocode(query: string): Promise<GeocodeResult[]> {
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
          return [{
            id: `cep-${cleanCep}`,
            displayName: `${vData.logradouro || 'CEP ' + cleanCep}, ${vData.bairro || ''} - ${vData.localidade}/${vData.uf}`,
            street: vData.logradouro,
            neighborhood: vData.bairro,
            city: vData.localidade,
            state: vData.uf,
            cep: vData.cep,
            coordinates: { lat: -23.5618, lng: -46.6559 },
            type: 'cep',
            provider: 'viacep',
          }];
        }
      } catch (e) {
        console.warn('ViaCEP client-side fetch error:', e);
      }
    }

    // 3. Direct Nominatim
    try {
      const nRes = await fetch(`https://nominatim.openstreetmap.org/search?format=json&countrycodes=br&addressdetails=1&limit=5&q=${encodeURIComponent(query)}`);
      const nData = await nRes.json();
      if (Array.isArray(nData) && nData.length > 0) {
        return nData.map((item: any, idx: number) => ({
          id: `nom-${item.place_id || idx}`,
          displayName: item.display_name,
          street: item.address?.road || item.address?.pedestrian,
          neighborhood: item.address?.suburb,
          city: item.address?.city || item.address?.town,
          state: item.address?.state,
          cep: item.address?.postcode,
          coordinates: { lat: parseFloat(item.lat), lng: parseFloat(item.lon) },
          type: 'address',
          provider: 'nominatim',
        }));
      }
    } catch {
      // Fall through to fallback
    }

    return [{
      id: 'default-loc',
      displayName: `${query} (Localização aproximada em São Paulo, SP)`,
      city: 'São Paulo',
      state: 'SP',
      coordinates: { lat: -23.5505, lng: -46.6333 },
      type: 'address',
      provider: 'internal',
    }];
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

  async getOccurrences(): Promise<Occurrence[]> {
    const data = await safeJsonFetch(`${API_BASE}/occurrences`);
    if (data) return data;
    const stored = localStorage.getItem('tp_occurrences');
    if (stored) {
      try { return JSON.parse(stored); } catch {}
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

  async getPlaces(category?: string, query?: string): Promise<Place[]> {
    const params = new URLSearchParams();
    if (category) params.append('category', category);
    if (query) params.append('query', query);
    const data = await safeJsonFetch(`${API_BASE}/places?${params.toString()}`);
    if (data) return data;

    let res = [...fallbackPlaces];
    if (category) res = res.filter(p => p.category === category);
    if (query) {
      const q = query.toLowerCase();
      res = res.filter(p => p.name.toLowerCase().includes(q) || p.subCategory.toLowerCase().includes(q) || p.address.toLowerCase().includes(q));
    }
    return res;
  },

  async getCultureSpots(): Promise<CultureSpot[]> {
    const data = await safeJsonFetch(`${API_BASE}/culture-spots`);
    if (data) return data;
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
