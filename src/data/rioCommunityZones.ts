import type { Coordinates } from '../types';

export interface RioCommunityRiskZone {
  id: string;
  name: string;
  complexName: string;
  neighborhood: string;
  coordinates: Coordinates;
  radiusMeters: number;
  riskLevel: 'extremo';
  advice: string;
}

export const RIO_COMMUNITY_ZONES: RioCommunityRiskZone[] = [
  {
    id: 'com-vila-kennedy',
    name: 'Vila Kennedy / Quafá',
    complexName: 'Comunidade da Vila Kennedy',
    neighborhood: 'Bangu / Vila Kennedy',
    coordinates: { lat: -22.8580, lng: -43.4980 },
    radiusMeters: 650,
    riskLevel: 'extremo',
    advice: 'Mantenha vidros fechados, atenção redobrada, velocidade moderada e não use farol alto.',
  },
  {
    id: 'com-senador-camara',
    name: 'Vila Aliança & Coreia',
    complexName: 'Complexo de Senador Camará',
    neighborhood: 'Senador Camará / Bangu',
    coordinates: { lat: -22.8710, lng: -43.4910 },
    radiusMeters: 700,
    riskLevel: 'extremo',
    advice: 'Área de extremo risco. Evite paradas na via, mantenha vidros levantados e luz baixa.',
  },
  {
    id: 'com-mare',
    name: 'Complexo da Maré / Parque União',
    complexName: 'Complexo da Maré (Av. Brasil / Linha Vermelha)',
    neighborhood: 'Bonsucesso / Maré',
    coordinates: { lat: -22.8590, lng: -43.2450 },
    radiusMeters: 750,
    riskLevel: 'extremo',
    advice: 'Atenção aos acessos na Av. Brasil e Linha Vermelha. Siga pela pista central e mantenha vidros fechados.',
  },
  {
    id: 'com-alemao',
    name: 'Complexo do Alemão / Fazendinha',
    complexName: 'Complexo do Alemão',
    neighborhood: 'Ramos / Bonsucesso / Inhaúma',
    coordinates: { lat: -22.8570, lng: -43.2720 },
    radiusMeters: 800,
    riskLevel: 'extremo',
    advice: 'Área de alta periculosidade. Não entre em vias secundárias desconhecidas.',
  },
  {
    id: 'com-jacarezinho',
    name: 'Jacarezinho / Manguinhos',
    complexName: 'Complexo do Jacarezinho',
    neighborhood: 'Zona Norte',
    coordinates: { lat: -22.8890, lng: -43.2570 },
    radiusMeters: 600,
    riskLevel: 'extremo',
    advice: 'Atenção ao redor da Av. Dom Hélder Câmara. Vidros fechados e velocidade constante.',
  },
  {
    id: 'com-chapadao',
    name: 'Complexo do Chapadão',
    complexName: 'Chapadão / Costa Barros',
    neighborhood: 'Pavuna / Costa Barros',
    coordinates: { lat: -22.8250, lng: -43.3660 },
    radiusMeters: 800,
    riskLevel: 'extremo',
    advice: 'Área com alto índice de ocorrências. Evite paradas na Estrada do Camboatá e acessos.',
  },
  {
    id: 'com-pedreira',
    name: 'Complexo da Pedreira',
    complexName: 'Pedreira / Costa Barros',
    neighborhood: 'Pavuna / Costa Barros',
    coordinates: { lat: -22.8180, lng: -43.3550 },
    radiusMeters: 750,
    riskLevel: 'extremo',
    advice: 'Extremo risco de segurança. Mantenha fluxo contínuo e vidros levantados.',
  },
  {
    id: 'com-cidade-de-deus',
    name: 'Cidade de Deus',
    complexName: 'Comunidade da Cidade de Deus',
    neighborhood: 'Jacarepaguá / Linha Amarela',
    coordinates: { lat: -22.9480, lng: -43.3620 },
    radiusMeters: 700,
    riskLevel: 'extremo',
    advice: 'Atenção no entroncamento da Estrada dos Bandeirantes com a Linha Amarela.',
  },
  {
    id: 'com-penha',
    name: 'Complexo da Penha / Vila Cruzeiro',
    complexName: 'Complexo da Penha',
    neighborhood: 'Penha / Vila Cruzeiro',
    coordinates: { lat: -22.8420, lng: -43.2840 },
    radiusMeters: 700,
    riskLevel: 'extremo',
    advice: 'Área de extremo risco. Não adentre ruas de comunidade sem autorização local.',
  },
  {
    id: 'com-juramento',
    name: 'Morro do Juramento',
    complexName: 'Comunidade do Juramento',
    neighborhood: 'Vicente de Carvalho',
    coordinates: { lat: -22.8550, lng: -43.3150 },
    radiusMeters: 550,
    riskLevel: 'extremo',
    advice: 'Atenção na Av. Automóvel Clube e imediações do metrô Vicente de Carvalho.',
  },
  {
    id: 'com-providencia',
    name: 'Morro da Providência',
    complexName: 'Comunidade da Providência',
    neighborhood: 'Santo Cristo / Gamboa / Centro',
    coordinates: { lat: -22.8980, lng: -43.1950 },
    radiusMeters: 500,
    riskLevel: 'extremo',
    advice: 'Atenção nas subidas próximas à Cidade do Samba e Central do Brasil.',
  },
  {
    id: 'com-rocinha',
    name: 'Rocinha / Vidigal',
    complexName: 'Complexo da Rocinha',
    neighborhood: 'São Conrado / Gávea',
    coordinates: { lat: -22.9880, lng: -43.2480 },
    radiusMeters: 750,
    riskLevel: 'extremo',
    advice: 'Atenção na Autoestrada Lagoa-Barra. Mantenha vidros fechados e faróis baixos.',
  },
];
