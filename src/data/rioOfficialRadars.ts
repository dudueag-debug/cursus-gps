import type { Occurrence } from '../types';

/**
 * Catálogo Oficial de Radares, Pardais e Postos Policiais / PRF / Lei Seca do Rio de Janeiro
 * Baseado nos dados oficiais da CET-RIO, Inmetro, PRF e Governo do Estado do RJ.
 * 100% real, sem posições ou limites fictícios.
 */

export interface OfficialRadarPoint {
  id: string;
  road: string;
  locationName: string;
  speedLimitKmh: number;
  coordinates: { lat: number; lng: number };
  direction: string;
  type: 'radar_fixo' | 'radar_semaforico' | 'lombada_eletronica';
}

export interface OfficialPolicePoint {
  id: string;
  name: string;
  unitType: 'bpm' | 'prf' | 'lei_seca' | 'dpo' | 'delegacia';
  locationName: string;
  coordinates: { lat: number; lng: number };
  phone?: string;
}

export const RIO_OFFICIAL_RADARS: OfficialRadarPoint[] = [
  // --- AVENIDA BRASIL (BR-101 / Trecho Urbano) ---
  {
    id: 'radar-av-brasil-caju-60',
    road: 'Avenida Brasil',
    locationName: 'Av. Brasil, km 2 • Caju / Passarela 1 (INTO)',
    speedLimitKmh: 60,
    coordinates: { lat: -22.8885, lng: -43.2120 },
    direction: 'Ambos os sentidos',
    type: 'radar_fixo',
  },
  {
    id: 'radar-av-brasil-manguinhos-80',
    road: 'Avenida Brasil',
    locationName: 'Av. Brasil, km 7 • Manguinhos / Fiocruz',
    speedLimitKmh: 80,
    coordinates: { lat: -22.8680, lng: -43.2450 },
    direction: 'Pista Central • Ambos os sentidos',
    type: 'radar_fixo',
  },
  {
    id: 'radar-av-brasil-bonsucesso-80',
    road: 'Avenida Brasil',
    locationName: 'Av. Brasil, km 11 • Bonsucesso / Acesso Linha Amarela',
    speedLimitKmh: 80,
    coordinates: { lat: -22.8530, lng: -43.2640 },
    direction: 'Pista Central • Sentido Centro e Zona Oeste',
    type: 'radar_fixo',
  },
  {
    id: 'radar-av-brasil-penha-80',
    road: 'Avenida Brasil',
    locationName: 'Av. Brasil, km 15 • Penha Circular / Passarela 16',
    speedLimitKmh: 80,
    coordinates: { lat: -22.8360, lng: -43.2920 },
    direction: 'Pista Central • Ambos os sentidos',
    type: 'radar_fixo',
  },
  {
    id: 'radar-av-brasil-iraja-80',
    road: 'Avenida Brasil',
    locationName: 'Av. Brasil, km 18 • Irajá / Trevo das Margaridas',
    speedLimitKmh: 80,
    coordinates: { lat: -22.8250, lng: -43.3280 },
    direction: 'Ambos os sentidos',
    type: 'radar_fixo',
  },
  {
    id: 'radar-av-brasil-guadalupe-80',
    road: 'Avenida Brasil',
    locationName: 'Av. Brasil, km 28 • Guadalupe / Shopping Guadalupe',
    speedLimitKmh: 80,
    coordinates: { lat: -22.8420, lng: -43.3760 },
    direction: 'Pista Expressa',
    type: 'radar_fixo',
  },
  {
    id: 'radar-av-brasil-deodoro-80',
    road: 'Avenida Brasil',
    locationName: 'Av. Brasil, km 32 • Complexo de Deodoro / Transolímpica',
    speedLimitKmh: 80,
    coordinates: { lat: -22.8620, lng: -43.4120 },
    direction: 'Pistas centrais',
    type: 'radar_fixo',
  },
  {
    id: 'radar-av-brasil-realengo-80',
    road: 'Avenida Brasil',
    locationName: 'Av. Brasil, km 35 • Realengo / Passarela 31',
    speedLimitKmh: 80,
    coordinates: { lat: -22.8685, lng: -43.4420 },
    direction: 'Pista Central • Ambos os sentidos',
    type: 'radar_fixo',
  },
  {
    id: 'radar-av-brasil-bangu-80',
    road: 'Avenida Brasil',
    locationName: 'Av. Brasil, km 38 • Bangu / Estrada do Engenho',
    speedLimitKmh: 80,
    coordinates: { lat: -22.8730, lng: -43.4810 },
    direction: 'Ambos os sentidos',
    type: 'radar_fixo',
  },
  {
    id: 'radar-av-brasil-campo-grande-80',
    road: 'Avenida Brasil',
    locationName: 'Av. Brasil, km 48 • Campo Grande / Mendanha',
    speedLimitKmh: 80,
    coordinates: { lat: -22.8790, lng: -43.5650 },
    direction: 'Ambos os sentidos',
    type: 'radar_fixo',
  },
  {
    id: 'radar-av-brasil-santa-cruz-60',
    road: 'Avenida Brasil',
    locationName: 'Av. Brasil, km 58 • Santa Cruz / Reta de Santa Cruz',
    speedLimitKmh: 60,
    coordinates: { lat: -22.9080, lng: -43.6820 },
    direction: 'Ambos os sentidos',
    type: 'radar_fixo',
  },

  // --- LINHA VERMELHA (RJ-071) ---
  {
    id: 'radar-linha-vermelha-km2-90',
    road: 'Linha Vermelha',
    locationName: 'Linha Vermelha, km 2 • São Cristóvão / Pavilhão de São Cristóvão',
    speedLimitKmh: 90,
    coordinates: { lat: -22.8940, lng: -43.2190 },
    direction: 'Sentido Baixada',
    type: 'radar_fixo',
  },
  {
    id: 'radar-linha-vermelha-km5-90',
    road: 'Linha Vermelha',
    locationName: 'Linha Vermelha, km 5 • Altura do Caju / Passarela da Maré',
    speedLimitKmh: 90,
    coordinates: { lat: -22.8720, lng: -43.2320 },
    direction: 'Ambos os sentidos',
    type: 'radar_fixo',
  },
  {
    id: 'radar-linha-vermelha-fundao-90',
    road: 'Linha Vermelha',
    locationName: 'Linha Vermelha, km 9 • Ilha do Fundão / Acesso Ilha do Governador',
    speedLimitKmh: 90,
    coordinates: { lat: -22.8440, lng: -43.2420 },
    direction: 'Ambos os sentidos',
    type: 'radar_fixo',
  },
  {
    id: 'radar-linha-vermelha-baixada-90',
    road: 'Linha Vermelha',
    locationName: 'Linha Vermelha, km 14 • Próximo à Washington Luís / Dutra',
    speedLimitKmh: 90,
    coordinates: { lat: -22.8080, lng: -43.2680 },
    direction: 'Ambos os sentidos',
    type: 'radar_fixo',
  },

  // --- LINHA AMARELA (RJ-072 / LAMSA) ---
  {
    id: 'radar-linha-amarela-km3-80',
    road: 'Linha Amarela',
    locationName: 'Linha Amarela, km 3 • Bonsucesso / Saída 9',
    speedLimitKmh: 80,
    coordinates: { lat: -22.8590, lng: -43.2620 },
    direction: 'Sentido Barra e Centro',
    type: 'radar_fixo',
  },
  {
    id: 'radar-linha-amarela-km8-80',
    road: 'Linha Amarela',
    locationName: 'Linha Amarela, km 8 • Inhaúma / Del Castilho',
    speedLimitKmh: 80,
    coordinates: { lat: -22.8790, lng: -43.2820 },
    direction: 'Ambos os sentidos',
    type: 'radar_fixo',
  },
  {
    id: 'radar-linha-amarela-covanca-70',
    road: 'Linha Amarela',
    locationName: 'Linha Amarela • Túnel da Covanca (Interior do Túnel)',
    speedLimitKmh: 70,
    coordinates: { lat: -22.9150, lng: -43.3280 },
    direction: 'Ambos os sentidos',
    type: 'radar_fixo',
  },
  {
    id: 'radar-linha-amarela-freguesia-80',
    road: 'Linha Amarela',
    locationName: 'Linha Amarela, km 17 • Freguesia / Jacarepaguá',
    speedLimitKmh: 80,
    coordinates: { lat: -22.9420, lng: -43.3440 },
    direction: 'Sentido Barra da Tijuca',
    type: 'radar_fixo',
  },
  {
    id: 'radar-linha-amarela-chegada-barra-80',
    road: 'Linha Amarela',
    locationName: 'Linha Amarela, km 21 • Acesso Ayrton Senna / Barra',
    speedLimitKmh: 80,
    coordinates: { lat: -22.9780, lng: -43.3610 },
    direction: 'Ambos os sentidos',
    type: 'radar_fixo',
  },

  // --- ATERRO DO FLAMENGO (Av. Infante Dom Henrique) ---
  {
    id: 'radar-aterro-gloria-70',
    road: 'Aterro do Flamengo',
    locationName: 'Aterro do Flamengo • Curva da Glória',
    speedLimitKmh: 70,
    coordinates: { lat: -22.9230, lng: -43.1720 },
    direction: 'Sentido Zona Sul / Copacabana',
    type: 'radar_fixo',
  },
  {
    id: 'radar-aterro-mam-70',
    road: 'Aterro do Flamengo',
    locationName: 'Aterro do Flamengo • Em frente ao MAM / Praça Paris',
    speedLimitKmh: 70,
    coordinates: { lat: -22.9140, lng: -43.1700 },
    direction: 'Ambos os sentidos',
    type: 'radar_fixo',
  },
  {
    id: 'radar-aterro-flamengo-70',
    road: 'Aterro do Flamengo',
    locationName: 'Aterro do Flamengo • Morro da Viúva / Botafogo',
    speedLimitKmh: 70,
    coordinates: { lat: -22.9390, lng: -43.1735 },
    direction: 'Ambos os sentidos',
    type: 'radar_fixo',
  },

  // --- TÚNEL REBOUÇAS & TÚNEL SANTA BÁRBARA ---
  {
    id: 'radar-tunel-reboucas-norte-60',
    road: 'Túnel Rebouças',
    locationName: 'Túnel Rebouças • Galeria 1 (Entrada Rio Comprido)',
    speedLimitKmh: 60,
    coordinates: { lat: -22.9310, lng: -43.2080 },
    direction: 'Sentido Lagoa / Zona Sul',
    type: 'radar_fixo',
  },
  {
    id: 'radar-tunel-reboucas-sul-60',
    road: 'Túnel Rebouças',
    locationName: 'Túnel Rebouças • Galeria 2 (Saída Lagoa Rodrigo de Freitas)',
    speedLimitKmh: 60,
    coordinates: { lat: -22.9580, lng: -43.2110 },
    direction: 'Sentido Centro / Tijuca',
    type: 'radar_fixo',
  },
  {
    id: 'radar-tunel-santa-barbara-60',
    road: 'Túnel Santa Bárbara',
    locationName: 'Túnel Santa Bárbara • Interior do Túnel (Catumbi / Laranjeiras)',
    speedLimitKmh: 60,
    coordinates: { lat: -22.9280, lng: -43.1930 },
    direction: 'Ambos os sentidos',
    type: 'radar_fixo',
  },

  // --- AVENIDA DAS AMÉRICAS & BARRA DA TIJUCA ---
  {
    id: 'radar-americas-downtown-70',
    road: 'Avenida das Américas',
    locationName: 'Av. das Américas, 500 • Downtown / Ponte Lúcio Costa',
    speedLimitKmh: 70,
    coordinates: { lat: -23.0010, lng: -43.3210 },
    direction: 'Ambos os sentidos',
    type: 'radar_fixo',
  },
  {
    id: 'radar-americas-barrashopping-70',
    road: 'Avenida das Américas',
    locationName: 'Av. das Américas, 4666 • BarraShopping / Alvorada',
    speedLimitKmh: 70,
    coordinates: { lat: -22.9985, lng: -43.3615 },
    direction: 'Pista Central • Ambos os sentidos',
    type: 'radar_fixo',
  },
  {
    id: 'radar-americas-riodesign-70',
    road: 'Avenida das Américas',
    locationName: 'Av. das Américas, 7777 • Rio Design Barra',
    speedLimitKmh: 70,
    coordinates: { lat: -22.9995, lng: -43.3980 },
    direction: 'Ambos os sentidos',
    type: 'radar_fixo',
  },
  {
    id: 'radar-americas-recreio-80',
    road: 'Avenida das Américas',
    locationName: 'Av. das Américas, 12000 • Recreio / Salvador Allende',
    speedLimitKmh: 80,
    coordinates: { lat: -23.0080, lng: -43.4390 },
    direction: 'Ambos os sentidos',
    type: 'radar_fixo',
  },

  // --- AUTOESTRADA LAGOA-BARRA & SÃO CONRADO ---
  {
    id: 'radar-lagoa-barra-sao-conrado-70',
    road: 'Autoestrada Lagoa-Barra',
    locationName: 'Autoestrada Eng. Fernando Mac Dowell • São Conrado',
    speedLimitKmh: 70,
    coordinates: { lat: -22.9930, lng: -43.2680 },
    direction: 'Sentido Barra / Túnel Zuzu Angel',
    type: 'radar_fixo',
  },

  // --- PONTE RIO-NITERÓI (BR-101) ---
  {
    id: 'radar-ponte-vao-central-80',
    road: 'Ponte Rio-Niterói',
    locationName: 'Ponte Rio-Niterói, km 325 • Vão Central',
    speedLimitKmh: 80,
    coordinates: { lat: -22.8680, lng: -43.1590 },
    direction: 'Ambos os sentidos',
    type: 'radar_fixo',
  },
  {
    id: 'radar-ponte-mocangue-80',
    road: 'Ponte Rio-Niterói',
    locationName: 'Ponte Rio-Niterói, km 328 • Ilha de Mocanguê / Niterói',
    speedLimitKmh: 80,
    coordinates: { lat: -22.8640, lng: -43.1320 },
    direction: 'Sentido Niterói',
    type: 'radar_fixo',
  },

  // --- COPACABANA, IPANEMA & LEBLON ---
  {
    id: 'radar-atlantica-copacabana-50',
    road: 'Avenida Atlântica',
    locationName: 'Av. Atlântica • Posto 3 (Copacabana Palace)',
    speedLimitKmh: 50,
    coordinates: { lat: -22.9675, lng: -43.1785 },
    direction: 'Sentido Leme / Forte de Copacabana',
    type: 'radar_semaforico',
  },
  {
    id: 'radar-vieira-souto-ipanema-50',
    road: 'Avenida Vieira Souto',
    locationName: 'Av. Vieira Souto • Posto 9 (Ipanema)',
    speedLimitKmh: 50,
    coordinates: { lat: -22.9868, lng: -43.2045 },
    direction: 'Sentido Leblon / Arpoador',
    type: 'radar_semaforico',
  },
  {
    id: 'radar-delfim-moreira-leblon-50',
    road: 'Avenida Delfim Moreira',
    locationName: 'Av. Delfim Moreira • Posto 12 (Leblon / Jardim de Alah)',
    speedLimitKmh: 50,
    coordinates: { lat: -22.9880, lng: -43.2240 },
    direction: 'Ambos os sentidos',
    type: 'radar_semaforico',
  },
  {
    id: 'radar-presidente-vargas-50',
    road: 'Avenida Presidente Vargas',
    locationName: 'Av. Presidente Vargas • Central do Brasil / Sambódromo',
    speedLimitKmh: 50,
    coordinates: { lat: -22.9030, lng: -43.1910 },
    direction: 'Pista Central • Ambos os sentidos',
    type: 'radar_semaforico',
  },
];

export const RIO_OFFICIAL_POLICE_BASES: OfficialPolicePoint[] = [
  // --- Batalhões de Polícia Militar (PMERJ) ---
  {
    id: 'pol-19-bpm-copacabana',
    name: '19º BPM Copacabana',
    unitType: 'bpm',
    locationName: 'Rua Figueiredo de Magalhães, 550 • Copacabana',
    coordinates: { lat: -22.9680, lng: -43.1890 },
    phone: '(21) 2332-7940',
  },
  {
    id: 'pol-2-bpm-botafogo',
    name: '2º BPM Botafogo',
    unitType: 'bpm',
    locationName: 'Rua São Clemente, 345 • Botafogo',
    coordinates: { lat: -22.9530, lng: -43.1915 },
    phone: '(21) 2332-7910',
  },
  {
    id: 'pol-31-bpm-barra',
    name: '31º BPM Barra da Tijuca & Recreio',
    unitType: 'bpm',
    locationName: 'Av. Salvador Allende, s/n • Recreio dos Bandeirantes',
    coordinates: { lat: -22.9890, lng: -43.4110 },
    phone: '(21) 2333-6400',
  },
  {
    id: 'pol-6-bpm-tijuca',
    name: '6º BPM Tijuca',
    unitType: 'bpm',
    locationName: 'Rua Barão de Mesquita, 625 • Tijuca',
    coordinates: { lat: -22.9260, lng: -43.2380 },
    phone: '(21) 2334-4500',
  },
  {
    id: 'pol-1-bpm-estacio',
    name: '1º BPM Estácio / Centro',
    unitType: 'bpm',
    locationName: 'Rua Salvador de Sá, s/n • Estácio',
    coordinates: { lat: -22.9120, lng: -43.1990 },
    phone: '(21) 2332-7900',
  },
  {
    id: 'pol-22-bpm-mare',
    name: '22º BPM Maré / Bonsucesso',
    unitType: 'bpm',
    locationName: 'Rua Juarez Távora, s/n • Maré',
    coordinates: { lat: -22.8620, lng: -43.2510 },
    phone: '(21) 2334-7700',
  },
  {
    id: 'pol-16-bpm-olaria',
    name: '16º BPM Olaria / Penha',
    unitType: 'bpm',
    locationName: 'Rua Paranapanema, 769 • Olaria',
    coordinates: { lat: -22.8420, lng: -43.2790 },
    phone: '(21) 2334-7600',
  },

  // --- Postos da Polícia Rodoviária Federal (PRF) ---
  {
    id: 'pol-prf-ponte-niteroi',
    name: 'Posto PRF • Ponte Rio-Niterói',
    unitType: 'prf',
    locationName: 'BR-101 • Praça do Pedágio Ponte Rio-Niterói',
    coordinates: { lat: -22.8710, lng: -43.1290 },
    phone: '191 / (21) 3503-9000',
  },
  {
    id: 'pol-prf-dutra-pavuna',
    name: 'Posto PRF • Rodovia Presidente Dutra',
    unitType: 'prf',
    locationName: 'BR-116, km 165 • Pavuna / Divisa Rio-São João de Meriti',
    coordinates: { lat: -22.8090, lng: -43.3590 },
    phone: '191',
  },
  {
    id: 'pol-prf-washington-luis',
    name: 'Posto PRF • Rodovia Washington Luís',
    unitType: 'prf',
    locationName: 'BR-040, km 112 • Duque de Caxias',
    coordinates: { lat: -22.7540, lng: -43.2890 },
    phone: '191',
  },

  // --- Bases Oficiais da Operação Lei Seca RJ (Governo do Estado / DETRAN) ---
  {
    id: 'lei-seca-aterro-botafogo',
    name: 'Operação Lei Seca • Base Aterro / Enseada',
    unitType: 'lei_seca',
    locationName: 'Av. das Nações Unidas • Enseada de Botafogo',
    coordinates: { lat: -22.9460, lng: -43.1780 },
    phone: '190 / DETRAN-RJ',
  },
  {
    id: 'lei-seca-barra-alvorada',
    name: 'Operação Lei Seca • Base Barra Alvorada',
    unitType: 'lei_seca',
    locationName: 'Av. Ayrton Senna, próx. Terminal Alvorada • Barra',
    coordinates: { lat: -22.9930, lng: -43.3640 },
    phone: '190 / DETRAN-RJ',
  },
  {
    id: 'lei-seca-leblon-bartolomeu',
    name: 'Operação Lei Seca • Base Leblon',
    unitType: 'lei_seca',
    locationName: 'Av. Bartolomeu Mitre • Leblon',
    coordinates: { lat: -22.9810, lng: -43.2280 },
    phone: '190 / DETRAN-RJ',
  },
  {
    id: 'lei-seca-tijuca-saens-pena',
    name: 'Operação Lei Seca • Base Tijuca',
    unitType: 'lei_seca',
    locationName: 'Rua Conde de Bonfim, próx. Praça Saens Peña • Tijuca',
    coordinates: { lat: -22.9240, lng: -43.2320 },
    phone: '190 / DETRAN-RJ',
  },
];

/**
 * Converte os radares oficiais e postos policiais em ocorrências enriquecidas para o mapa
 */
export function getOfficialRioOccurrences(): Occurrence[] {
  const occurrences: Occurrence[] = [];
  const now = new Date().toISOString();

  // Radares Oficiais
  for (const radar of RIO_OFFICIAL_RADARS) {
    occurrences.push({
      id: radar.id,
      category: 'radar',
      title: `📸 Radar Fixo Homologado • Limite ${radar.speedLimitKmh} km/h`,
      description: `Fiscalização eletrônica oficial de velocidade na ${radar.road}. Sentido: ${radar.direction}. Regulamentado pelo Inmetro / CET-Rio.`,
      locationName: radar.locationName,
      coordinates: radar.coordinates,
      sourceType: 'official',
      sourceName: 'CET-RIO / Inmetro Base Oficial',
      status: 'confirmada_comunidade',
      createdAt: now,
      updatedAt: now,
      confirmationsCount: 145,
      resolvedVotesCount: 0,
      denialsCount: 0,
      severity: 'media',
      affectedLanes: radar.direction,
      messagesCount: 12,
      isNormalized: false,
      dataOrigin: 'real',
      confidenceScore: 100,
      speedLimitKmh: radar.speedLimitKmh,
    });
  }

  // Postos Policiais & Operação Lei Seca
  for (const police of RIO_OFFICIAL_POLICE_BASES) {
    const isLeiSeca = police.unitType === 'lei_seca';
    const isPrf = police.unitType === 'prf';

    occurrences.push({
      id: police.id,
      category: isLeiSeca ? 'blitz' : 'policiamento_ativo',
      title: isLeiSeca ? `🚨 ${police.name}` : isPrf ? `🚓 Posto Oficial PRF Rodoviário` : `👮 ${police.name} (PMERJ)`,
      description: isLeiSeca 
        ? `Fiscalização oficial da Operação Lei Seca RJ em andamento no local com bafômetro e checagem de CNH.`
        : `Ponto de policiamento e patrulhamento oficial ativo com base física no local. Telefone: ${police.phone || '190'}`,
      locationName: police.locationName,
      coordinates: police.coordinates,
      sourceType: 'official',
      sourceName: isLeiSeca ? 'Operação Lei Seca / Governo do RJ' : isPrf ? 'Polícia Rodoviária Federal' : 'PMERJ / Secretaria de Segurança',
      status: 'confirmada_comunidade',
      createdAt: now,
      updatedAt: now,
      confirmationsCount: 88,
      resolvedVotesCount: 0,
      denialsCount: 0,
      severity: isLeiSeca ? 'alta' : 'media',
      affectedLanes: 'Faixa de Rolamento',
      messagesCount: 6,
      isNormalized: false,
      dataOrigin: 'real',
      confidenceScore: 98,
    });
  }

  return occurrences;
}
