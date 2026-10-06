import type { RegionHistoryData, Coordinates } from '../types';

export const HISTORICAL_REGIONS_DATABASE: RegionHistoryData[] = [
  {
    id: 'reg-campo-grande',
    regionName: 'Campo Grande',
    city: 'Rio de Janeiro',
    state: 'RJ',
    coordinates: { lat: -22.9035, lng: -43.5593 },
    category: 'bairro',
    foundationYear: 1603,
    originStory: 'Campo Grande tem suas raízes no século XVII, com o desbravamento das sesmarias e a presença das antigas fazendas jesuíticas e canavieiras. Era um polo agrário fundamental para o abastecimento da capital.',
    urbanEvolution: 'A inauguração da Estrada de Ferro D. Pedro II (atual SuperVia) em 1878 transformou Campo Grande no maior centro comercial e econômico da Zona Oeste carioca, com forte malha de transportes e vida urbana vibrante.',
    culturalHeritage: 'Igreja de Nossa Senhora do Desterro (erguida no século XVII), Praça dos Palmares, Parque Estadual da Pedra Branca e forte tradição gastronômica e musical.',
    populationInfo: 'Mais de 330 mil habitantes (um dos bairros mais populosos do Brasil).',
    importantEvents: [
      '1603: Primeiras concessões de sesmarias aos colonizadores.',
      '1673: Construção da capela primitiva de Nossa Senhora do Desterro.',
      '1878: Chegada da linha férrea impulsionando o comércio e a urbanização.',
      '1968: Criação de grandes áreas industriais e expansão comercial.'
    ],
    notableFigures: ['Famílias pioneiras de agricultores e comerciantes da Zona Oeste'],
    curiosities: [
      'Foi o maior produtor de laranjas do Brasil no início do século XX, conhecido como a "Capital da Laranja".',
      'Possui o Calçadão de Campo Grande, um dos polos de comércio a céu aberto mais movimentados da América Latina.'
    ],
    transportOverview: 'Terminal Rodoviário, Estação de Trem SuperVia e BRT TransOeste.',
    publicFacilities: 'Hospital Estadual Rocha Faria, UPA 24h, Parque Pedra Branca, Miécimo da Silva.',
    sources: ['Instituto Pereira Passos (IPP)', 'Arquivo Geral da Cidade do Rio de Janeiro', 'IBGE'],
    dataOrigin: 'historical'
  },
  {
    id: 'reg-bangu',
    regionName: 'Bangu',
    city: 'Rio de Janeiro',
    state: 'RJ',
    coordinates: { lat: -22.8800, lng: -43.4660 },
    category: 'bairro',
    foundationYear: 1673,
    originStory: 'Originado de antigos engenhos de cana-de-açúcar coloniais. Ganhou projeção nacional com a fundação da Companhia Progresso Industrial do Brasil (Fábrica de Tecidos Bangu) em 1889.',
    urbanEvolution: 'Planejado como uma vila operária de influência arquitetônica britânica com vilas residenciais, clube, teatro e hospital privativo para os trabalhadores.',
    culturalHeritage: 'Edifício histórico da antiga Fábrica de Tecidos Bangu (atual Bangu Shopping), Bangu Atlético Clube (fundado em 1904) e o tradicional calçadão.',
    populationInfo: 'Aprox. 240 mil habitantes.',
    importantEvents: [
      '1889: Fundação da Fábrica de Tecidos Bangu.',
      '1904: Thomas Donohoe introduz a primeira partida de futebol documentada no Brasil em Bangu.',
      '1966: Conquista do Campeonato Carioca pelo Bangu Atlético Clube.'
    ],
    notableFigures: ['Thomas Donohoe (pioneiro do futebol brasileiro)', 'Zizinho (mestre do futebol)'],
    curiosities: [
      'Berço operário do futebol no Brasil com a primeira bola trazida por trabalhadores escoceses da fábrica.',
      'Famoso pela hospitalidade e pelo clima quente e alegre.'
    ],
    transportOverview: 'Estação de Trem SuperVia Bangu, Terminal Rodoviário e ciclovias integradas.',
    publicFacilities: 'Hospital Municipal Albert Schweitzer, UPA Bangu, Areninha Cultural Hermeto Pascoal.',
    sources: ['Histórico do Futebol Carioca', 'Arquivo Geral da Cidade do Rio de Janeiro'],
    dataOrigin: 'historical'
  },
  {
    id: 'reg-centro-rj',
    regionName: 'Centro',
    city: 'Rio de Janeiro',
    state: 'RJ',
    coordinates: { lat: -22.9068, lng: -43.1729 },
    category: 'bairro',
    foundationYear: 1565,
    originStory: 'Fundado por Estácio de Sá em 1º de março de 1565 entre o Morro Cara de Cão e o Pão de Açúcar, posteriormente transferido para o Morro do Castelo para melhor defesa.',
    urbanEvolution: 'Tornou-se capital da Colônia em 1763, sede do Império em 1808 com a chegada da Família Real, e capital da República até 1960. Passou por reformas urbanas icônicas de Pereira Passos no início do séc. XX e pelo projeto Porto Maravilha.',
    culturalHeritage: 'Paço Imperial, Theatro Municipal, Museu do Amanhã, MAR, Candelária, Mosteiro de São Bento, Confeitaria Colombo e Arcos da Lapa.',
    populationInfo: 'Centro nevrálgico financeiro, cultural e histórico.',
    importantEvents: [
      '1565: Fundação da Cidade de São Sebastião do Rio de Janeiro.',
      '1808: Desembarque de D. João VI e transferência da Corte Real.',
      '1822: Dia do Fico no Paço Imperial e Proclamação da Independência.',
      '1888: Assinatura da Lei Áurea no Paço Imperial.'
    ],
    notableFigures: ['Estácio de Sá', 'Machado de Assis', 'Chiquinha Gonzaga', 'D. João VI', 'Mestre Valentim'],
    curiosities: [
      'A Confeitaria Colombo mantém os espelhos belgas e arquitetura Belle Époque original desde 1894.',
      'O Mosteiro de São Bento abriga obras barrocas em talha dourada de valor inestimável.'
    ],
    transportOverview: 'Hub central com VLT Carioca, MetrôRio (Linhas 1 e 2), Barcas Praça XV e Terminal Central do Brasil.',
    publicFacilities: 'Hospital Municipal Souza Aguiar, INCA, Theatro Municipal, Biblioteca Nacional.',
    sources: ['IPHAN', 'Arquivo Nacional', 'Biblioteca Nacional'],
    dataOrigin: 'historical'
  },
  {
    id: 'reg-copacabana',
    regionName: 'Copacabana',
    city: 'Rio de Janeiro',
    state: 'RJ',
    coordinates: { lat: -22.9698, lng: -43.1868 },
    category: 'bairro',
    foundationYear: 1892,
    originStory: 'Originalmente chamada de Sacopenapã ("caminho dos socós"), recebeu o nome de Copacabana no século XVIII com a construção de uma capela em homenagem a Nossa Senhora de Copacabana, padroeira da Bolívia.',
    urbanEvolution: 'A abertura do Túnel Velho (Túnel Alaor Prata) em 1892 e a inauguração do Copacabana Palace em 1923 transformaram a orla no símbolo cosmopolita mundial do Rio.',
    culturalHeritage: 'Calçadão de pedras portuguesas com ondas desenhadas por Burle Marx, Hotel Copacabana Palace, Forte de Copacabana e berço da Bossa Nova.',
    populationInfo: 'Aprox. 150 mil habitantes.',
    importantEvents: [
      '1892: Abertura do Túnel Velho interligando Botafogo a Copacabana.',
      '1922: A Revolta dos 18 do Forte de Copacabana.',
      '1923: Inauguração do lendário Copacabana Palace.',
      '1958: Encontros em apartamentos e bares de Copacabana que deram origem à Bossa Nova.'
    ],
    notableFigures: ['Tom Jobim', 'Vinicius de Moraes', 'Dorival Caymmi', 'Elis Regina'],
    curiosities: [
      'O calçadão icônico de ondas pretas e brancas foi inspirado na Praça do Rossio em Lisboa.',
      'O Réveillon de Copacabana é a maior festa de virada de ano a céu aberto do planeta.'
    ],
    transportOverview: 'Três estações de metrô (Cardeal Arcoverde, Siqueira Campos, Cantagalo), ciclovia à beira-mar e linhas de ônibus troncais.',
    publicFacilities: 'CER Leblon/Copacabana, Forte de Copacabana, Parque Estadual da Chacrinha.',
    sources: ['IPHAN', 'Prefeitura do Rio', 'Riotur'],
    dataOrigin: 'historical'
  },
  {
    id: 'reg-rocinha',
    regionName: 'Rocinha',
    city: 'Rio de Janeiro',
    state: 'RJ',
    coordinates: { lat: -22.9880, lng: -43.2480 },
    category: 'comunidade',
    foundationYear: 1920,
    originStory: 'Surgiu a partir do parcelamento da antiga Fazenda Quebra-Cangalha na década de 1920. Moradores plantavam pequenas hortas ("rocinhas") e vendiam hortaliças nas feiras da Zona Sul, batizando o local.',
    urbanEvolution: 'Consolidou-se com migrantes de todas as partes do Brasil, especialmente do Nordeste, construindo com engenho próprio uma cidade vibrante, com forte rede associativa, comércio autônomo e rica efervescência cultural.',
    culturalHeritage: 'Acadêmicos da Rocinha (Escola de Samba), Rádio Comunitária Rocinha FM, Teatro da Rocinha, Casa de Cultura e rico artesanato local.',
    populationInfo: 'Aprox. 100 mil habitantes (reconhecida como a maior comunidade urbana da América Latina).',
    importantEvents: [
      '1930: Primeiras feiras livres onde os produtores vendiam as verduras das "rocinhas".',
      '1970: Criação da União Pró-Melhoramentos dos Moradores da Rocinha (UPMMR).',
      '1988: Fundação do G.R.E.S. Acadêmicos da Rocinha.',
      '2010: Inauguração da passarela de Oscar Niemeyer na Autoestrada Lagoa-Barra.'
    ],
    notableFigures: ['Lideranças comunitárias históricas', 'Mestres de bateria e artistas plásticos da Rocinha'],
    curiosities: [
      'Possui um comércio de rua hiperativo com bancos, galerias comerciais e restaurantes funcionando 24h.',
      'A passarela projetada por Oscar Niemeyer integra a comunidade a São Conrado.'
    ],
    transportOverview: 'Estação de Metrô São Conrado/Rocinha, vans comunitárias e linhas de ônibus pela Autoestrada.',
    publicFacilities: 'UPA Rocinha 24h, Clínica da Família Maria do Socorro, Biblioteca Parque da Rocinha, Complexo Esportivo.',
    sources: ['União Pró-Melhoramentos da Rocinha', 'Dicionário de Favelas Marielle Franco', 'IBGE'],
    dataOrigin: 'historical'
  },
  {
    id: 'reg-madureira',
    regionName: 'Madureira',
    city: 'Rio de Janeiro',
    state: 'RJ',
    coordinates: { lat: -22.8732, lng: -43.3392 },
    category: 'bairro',
    foundationYear: 1890,
    originStory: 'O nome homenageia o boiadeiro Lourenço Madureira, que arrendava terras na região no século XIX. Com a ferrovia, tornou-se o coração comercial e cultural do subúrbio carioca.',
    urbanEvolution: 'Evoluiu para a capital cultural do samba carioca e grande entroncamento ferroviário e rodoviário, abrigando o Mercadão de Madureira e o Parque Madureira.',
    culturalHeritage: 'G.R.E.S. Portela, G.R.E.S. Império Serrano, Baile Charme do Viaduto de Madureira e Mercadão de Madureira (Patrimônio Imaterial do Estado).',
    populationInfo: 'Aprox. 60 mil habitantes diretos e milhões de frequentadores semanais.',
    importantEvents: [
      '1923: Fundação do conjunto musical que daria origem à Portela (a maior campeã do Carnaval).',
      '1947: Fundação do G.R.E.S. Império Serrano no Morro da Serrinha (berço do Jongo).',
      '1959: Inauguração oficial do Mercadão de Madureira.',
      '2012: Inauguração do Parque Madureira Mestre Monarco.'
    ],
    notableFigures: ['Monarco da Portela', 'Dona Ivone Lara', 'Clara Nunes', 'Candeia', 'Silas de Oliveira'],
    curiosities: [
      'O Viaduto de Madureira é palco do Baile Charme mais famoso do Brasil desde a década de 1990.',
      'O Morro da Serrinha é o guardião sagrado do Jongo, raiz ancestral do samba carioca.'
    ],
    transportOverview: 'Estação Madureira (SuperVia ramais Deodoro, Santa Cruz e Japeri), BRT TransCarioca e Terminal Rodoviário.',
    publicFacilities: 'Parque Madureira, Hospital Central da Aeronáutica, UPA Madureira, Centros Culturais da Portela e Império.',
    sources: ['Arquivo Geral do Rio', 'Dicionário da Música Popular Brasileira', 'IPHAN'],
    dataOrigin: 'historical'
  },
  {
    id: 'reg-santa-cruz',
    regionName: 'Santa Cruz',
    city: 'Rio de Janeiro',
    state: 'RJ',
    coordinates: { lat: -22.9189, lng: -43.6853 },
    category: 'bairro',
    foundationYear: 1567,
    originStory: 'Surgiu com a histórica Fazenda Real de Santa Cruz, administrada pelos Jesuítas a partir de 1567 e posteriormente refúgio imperial de veraneio da Família Real Portuguesa e dos Imperadores D. Pedro I e D. Pedro II.',
    urbanEvolution: 'Passou de fazenda imperial a grande polo industrial, siderúrgico e militar, abrigando a Base Aérea de Santa Cruz e a Usina Siderúrgica Ternium.',
    culturalHeritage: 'Palacete Princesa Isabel, Ponte dos Jesuítas (construída em 1752, marco da engenharia hidráulica colonial tombada pelo IPHAN) e Hangar do Zeppelin.',
    populationInfo: 'Aprox. 220 mil habitantes.',
    importantEvents: [
      '1567: Instalação da Fazenda dos Jesuítas.',
      '1752: Conclusão da Ponte dos Jesuítas para controle das cheias dos rios Guandu e Guandu-Mirim.',
      '1808: Transformação em Real Fazenda de Santa Cruz pela Família Real.',
      '1936: Construção do gigantesco Hangar do dirigível Zeppelin.'
    ],
    notableFigures: ['Padre José de Anchieta', 'D. Pedro I', 'Princesa Isabel'],
    curiosities: [
      'O Hangar do Zeppelin na Base Aérea de Santa Cruz é o único exemplar completo e preservado no mundo original dos dirigíveis.',
      'A Ponte dos Jesuítas foi a primeira grande obra de barragem e canalização do Brasil colonial.'
    ],
    transportOverview: 'Terminal de Trem SuperVia Ramal Santa Cruz e Terminal BRT TransOeste.',
    publicFacilities: 'Hospital Municipal Pedro II, Policlínica Santa Cruz, Base Aérea de Santa Cruz, Batalhão de Polícia.',
    sources: ['IPHAN', 'História Militar Brasileira', 'Arquivo Geral da Cidade'],
    dataOrigin: 'historical'
  },
  {
    id: 'reg-tijuca',
    regionName: 'Tijuca',
    city: 'Rio de Janeiro',
    state: 'RJ',
    coordinates: { lat: -22.9328, lng: -43.2383 },
    category: 'bairro',
    foundationYear: 1759,
    originStory: 'O nome Tijuca vem do tupi e significa "água podre" ou "charco", referindo-se aos manguezais da região da Lagoa da Tijuca. Foi área de cultivo de cana e depois de café no séc. XIX.',
    urbanEvolution: 'No século XIX, o reflorestamento pioneiro da Floresta da Tijuca ordenado por D. Pedro II e a primeira linha de bondes de tração animal do país (1859) transformaram a Tijuca em um bairro nobre e tradicional.',
    culturalHeritage: 'Floresta da Tijuca (maior floresta urbana replantada do mundo), Praça Saens Peña, G.R.E.S. Acadêmicos do Salgueiro, G.R.E.S. Unidos da Tijuca e Estádio do Maracanã (vizinho).',
    populationInfo: 'Aprox. 170 mil habitantes.',
    importantEvents: [
      '1859: Primeira linha de transporte sobre trilhos do Rio conectando o Centro à Tijuca.',
      '1861: Início do histórico reflorestamento da Floresta da Tijuca sob comando de Major Archer.',
      '1950: Construção do Complexo Esportivo do Maracanã nas proximidades.',
      '1953: Fundação do G.R.E.S. Acadêmicos do Salgueiro.'
    ],
    notableFigures: ['Major Archer', 'Tim Maia', 'Erasmo Carlos', 'Aldir Blanc'],
    curiosities: [
      'A Praça Saens Peña já foi chamada de "Cinelândia da Zona Norte" por abrigar mais de 10 grandes cinemas de rua nas décadas de 50 e 60.',
      'A Floresta da Tijuca possui mais de 3 milhões de árvores replantadas manualmente.'
    ],
    transportOverview: 'MetrôRio Linha 1 (estações Afonso Pena, São Francisco Xavier, Saens Peña, Uruguai) e corredores de ônibus.',
    publicFacilities: 'Hospital Municipal Souza Aguiar/Andaraí, UPA Tijuca, Parque Nacional da Tijuca.',
    sources: ['Parque Nacional da Tijuca / ICMBio', 'Arquivo Geral do Rio de Janeiro'],
    dataOrigin: 'historical'
  },
  {
    id: 'reg-sao-paulo-centro',
    regionName: 'São Paulo (Centro Histórico)',
    city: 'São Paulo',
    state: 'SP',
    coordinates: { lat: -23.5505, lng: -46.6333 },
    category: 'cidade',
    foundationYear: 1554,
    originStory: 'Fundada em 25 de janeiro de 1554 com a celebração da primeira missa no Colégio dos Jesuítas no Pátio do Colégio pelos padres Manuel da Nóbrega e José de Anchieta.',
    urbanEvolution: 'De vila bandeirante a maior metrópole financeira e cultural do Hemisfério Sul, impulsionada pelo ciclo do café no século XIX e a industrialização do século XX.',
    culturalHeritage: 'Pátio do Colégio, Catedral da Sé, Theatro Municipal de São Paulo, Mosteiro de São Bento, Farol Santander, Mercado Municipal e Edifício Copan.',
    populationInfo: 'Mais de 12 milhões de habitantes na capital paulista.',
    importantEvents: [
      '1554: Fundação de São Paulo de Piratininga no Pátio do Colégio.',
      '1822: Grito da Independência do Brasil no Ipiranga por D. Pedro I.',
      '1922: Semana de Arte Moderna no Theatro Municipal.',
      '1954: Construção do Parque Ibirapuera no IV Centenário.'
    ],
    notableFigures: ['Padre José de Anchieta', 'Tarsila do Amaral', 'Mário de Andrade', 'Oscar Niemeyer'],
    curiosities: [
      'O Mercado Municipal Paulistano (Mercadão) consome toneladas de frutas exóticas e serve o famoso sanduíche de mortadela e pastel de bacalhau.',
      'A Avenida Paulista foi inaugurada em 1891 como residência dos barões do café e hoje é o coração financeiro do Brasil.'
    ],
    transportOverview: 'Maior malha sobre trilhos do país com Metrô de SP e CPTM (linhas 1, 2, 3, 4, 7, 8, 9, 10, 11).',
    publicFacilities: 'Hospital das Clínicas da USP, Santa Casa de São Paulo, SAMU 192, Poupatempo Sé.',
    sources: ['Museu da Cidade de São Paulo', 'Arquivo Histórico Municipal', 'IBGE'],
    dataOrigin: 'historical'
  }
];

export function getNearestRegionHistory(coords: Coordinates): RegionHistoryData {
  if (!coords) return HISTORICAL_REGIONS_DATABASE[0];

  let nearest = HISTORICAL_REGIONS_DATABASE[0];
  let minDistance = Number.MAX_VALUE;

  for (const region of HISTORICAL_REGIONS_DATABASE) {
    const d = calculateDistanceKm(coords, region.coordinates);
    if (d < minDistance) {
      minDistance = d;
      nearest = region;
    }
  }

  return nearest;
}

export function searchRegionHistory(query: string): RegionHistoryData[] {
  if (!query || query.trim().length === 0) return HISTORICAL_REGIONS_DATABASE;
  const q = query.toLowerCase().trim();

  return HISTORICAL_REGIONS_DATABASE.filter(item => 
    item.regionName.toLowerCase().includes(q) ||
    item.city.toLowerCase().includes(q) ||
    item.originStory.toLowerCase().includes(q) ||
    item.culturalHeritage.toLowerCase().includes(q) ||
    item.curiosities.some(c => c.toLowerCase().includes(q))
  );
}

function calculateDistanceKm(c1: Coordinates, c2: Coordinates): number {
  const R = 6371;
  const dLat = ((c2.lat - c1.lat) * Math.PI) / 180;
  const dLon = ((c2.lng - c1.lng) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((c1.lat * Math.PI) / 180) *
      Math.cos((c2.lat * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}
