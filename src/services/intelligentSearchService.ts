import type { Coordinates, PlaceCategory } from '../types';

export interface IntelligentSearchIntent {
  rawQuery: string;
  intentType: 'category_search' | 'history_lookup' | 'signal_action' | 'what_is_here' | 'weather_lookup' | 'address_search';
  categoryFilter?: PlaceCategory;
  searchTerm?: string;
  is24hRequired?: boolean;
  hasGnvRequired?: boolean;
  targetRegionName?: string;
  matchedAction?: string;
  explanation: string;
}

export function parseNaturalLanguageQuery(query: string, _userCoords?: Coordinates): IntelligentSearchIntent {
  const normalized = query.toLowerCase().trim();

  // 1. "O que tem aqui" / "ao redor"
  if (
    normalized.includes('o que tem aqui') ||
    normalized.includes('o que tem por aqui') ||
    normalized.includes('ao meu redor') ||
    normalized.includes('estabelecimentos proximos')
  ) {
    return {
      rawQuery: query,
      intentType: 'what_is_here',
      explanation: 'Verificando estabelecimentos e serviços ao seu redor em raio de 500m e 2km.'
    };
  }

  // 2. Clima / Tempo
  if (
    normalized.includes('clima') ||
    normalized.includes('previsao do tempo') ||
    normalized.includes('vai chover') ||
    normalized.includes('temperatura')
  ) {
    return {
      rawQuery: query,
      intentType: 'weather_lookup',
      explanation: 'Consultando previsão meteorológica e alerta de pista em tempo real.'
    };
  }

  // 3. História de Local / Bairro / Cidade
  if (
    normalized.startsWith('história de') ||
    normalized.startsWith('historia de') ||
    normalized.includes('conheca este lugar') ||
    normalized.includes('conheça este lugar') ||
    normalized.includes('historia da regiao') ||
    normalized.includes('história da região') ||
    normalized.includes('pontos turisticos') ||
    normalized.includes('pontos turísticos')
  ) {
    const regionName = normalized
      .replace(/história de|historia de|conheça este lugar|conheca este lugar|história da região|historia da regiao|quais pontos turísticos existem em|pontos turísticos em|pontos turisticos em/gi, '')
      .trim();

    return {
      rawQuery: query,
      intentType: 'history_lookup',
      targetRegionName: regionName || undefined,
      explanation: regionName 
        ? `Consultando história e patrimônio cultural de ${regionName}.`
        : 'Consultando história e pontos turísticos da sua localização atual.'
    };
  }

  // 4. Sinalizar ocorrência
  if (
    normalized.startsWith('sinalizar') ||
    normalized.startsWith('reportar') ||
    normalized.startsWith('avisar ') ||
    normalized.includes('tem buraco') ||
    normalized.includes('tem blitz') ||
    normalized.includes('tem transito') ||
    normalized.includes('tem engarrafamento')
  ) {
    return {
      rawQuery: query,
      intentType: 'signal_action',
      matchedAction: 'open_signal_modal',
      explanation: 'Abrindo painel instantâneo para sinalização de ocorrência na via.'
    };
  }

  // 5. Posto de Combustível / GNV
  if (
    normalized.includes('posto') ||
    normalized.includes('gasolina') ||
    normalized.includes('gnv') ||
    normalized.includes('abastecer') ||
    normalized.includes('combustivel') ||
    normalized.includes('combustível')
  ) {
    const isGnv = normalized.includes('gnv');
    const is24h = normalized.includes('24h') || normalized.includes('24 horas') || normalized.includes('aberto');
    return {
      rawQuery: query,
      intentType: 'category_search',
      categoryFilter: 'posto_gnv',
      hasGnvRequired: isGnv,
      is24hRequired: is24h,
      explanation: isGnv 
        ? 'Localizando postos com GNV pressurizado mais próximos de você.'
        : 'Localizando postos de combustível mais próximos.'
    };
  }

  // 6. Borracheiro / Pneus
  if (
    normalized.includes('borracheiro') ||
    normalized.includes('borracharia') ||
    normalized.includes('pneu furado') ||
    normalized.includes('trocar pneu') ||
    normalized.includes('vulcanizacao')
  ) {
    const is24h = normalized.includes('24h') || normalized.includes('24 horas') || normalized.includes('aberto');
    return {
      rawQuery: query,
      intentType: 'category_search',
      categoryFilter: 'borracheiro',
      is24hRequired: is24h,
      explanation: is24h 
        ? 'Buscando borracheiro 24 horas aberto mais próximo.'
        : 'Buscando borracheiros e serviços de pneus mais próximos.'
    };
  }

  // 7. Polícia / Segurança / DPO / Delegacia
  if (
    normalized.includes('policia') ||
    normalized.includes('polícia') ||
    normalized.includes('delegacia') ||
    normalized.includes('dpo') ||
    normalized.includes('batalhao') ||
    normalized.includes('batalhão') ||
    normalized.includes('seguranca')
  ) {
    return {
      rawQuery: query,
      intentType: 'category_search',
      categoryFilter: 'policia',
      explanation: 'Localizando unidades de segurança pública, DPO e delegacias próximas.'
    };
  }

  // 8. Saúde / Hospital / UPA / Pronto Atendimento / Farmácia
  if (
    normalized.includes('hospital') ||
    normalized.includes('upa') ||
    normalized.includes('posto de saude') ||
    normalized.includes('posto de saúde') ||
    normalized.includes('pronto socorro') ||
    normalized.includes('emergencia') ||
    normalized.includes('emergência') ||
    normalized.includes('clinica') ||
    normalized.includes('clínica') ||
    normalized.includes('farmacia') ||
    normalized.includes('farmácia')
  ) {
    return {
      rawQuery: query,
      intentType: 'category_search',
      categoryFilter: 'saude',
      explanation: 'Localizando hospitais, UPAs e unidades de saúde 24h mais próximas.'
    };
  }

  // 9. Mercado / Supermercado / Comércio
  if (
    normalized.includes('mercado') ||
    normalized.includes('supermercado') ||
    normalized.includes('compras') ||
    normalized.includes('hipermercado') ||
    normalized.includes('restaurante') ||
    normalized.includes('banco')
  ) {
    return {
      rawQuery: query,
      intentType: 'category_search',
      categoryFilter: 'mercado',
      explanation: 'Localizando mercados, supermercados e conveniências próximas.'
    };
  }

  // 10. Esportes / Campo de Futebol / Quadra
  if (
    normalized.includes('futebol') ||
    normalized.includes('campo') ||
    normalized.includes('estadio') ||
    normalized.includes('estádio') ||
    normalized.includes('quadra') ||
    normalized.includes('academia')
  ) {
    return {
      rawQuery: query,
      intentType: 'category_search',
      categoryFilter: 'esporte',
      explanation: 'Localizando campos de futebol, quadras e centros esportivos.'
    };
  }

  // 11. Turismo & Museus
  if (
    normalized.includes('museu') ||
    normalized.includes('monumento') ||
    normalized.includes('turismo') ||
    normalized.includes('atracao') ||
    normalized.includes('atração')
  ) {
    return {
      rawQuery: query,
      intentType: 'category_search',
      categoryFilter: 'turismo',
      explanation: 'Localizando pontos turísticos, museus e atrações culturais.'
    };
  }

  // Default: Direct address / place geocoding search
  return {
    rawQuery: query,
    intentType: 'address_search',
    searchTerm: query,
    explanation: `Buscando endereço ou ponto de interesse para "${query}".`
  };
}
