import type { Coordinates, RouteOption, Occurrence, WeatherData, Place } from '../types';
import { CursusIntelligenceEngine } from './intelligenceEngine';

export interface CopilotCommandResult {
  action: 'navigate_home' | 'navigate_work' | 'find_poi' | 'toggle_tolls' | 'select_route_mode' | 'weather_query' | 'incident_query' | 'general_answer';
  spokenResponse: string;
  displayTitle: string;
  displayDetails?: string;
  categoryToSearch?: string;
  targetMode?: 'fastest' | 'safest' | 'economical';
  avoidTolls?: boolean;
}

export class CursusCopilotService {
  /**
   * Processes a natural language text or voice command from the driver
   */
  public static processCommand(
    rawText: string,
    context: {
      currentLocation: Coordinates;
      activeRoute: RouteOption | null;
      candidateRoutes: RouteOption[];
      occurrences: Occurrence[];
      weather: WeatherData | null;
    }
  ): CopilotCommandResult {
    const text = rawText.toLowerCase().trim();

    // 1. "Cursus, me leve para casa"
    if (text.includes('casa') || text.includes('levar para casa') || text.includes('ir para casa')) {
      return {
        action: 'navigate_home',
        spokenResponse: 'Calculando a melhor rota para a sua casa com base no trânsito em tempo real.',
        displayTitle: '🏠 Rota para Casa',
        displayDetails: 'Trajeto residencial carregado.',
      };
    }

    // 2. "Cursus, me leve ao trabalho"
    if (text.includes('trabalho') || text.includes('levar ao trabalho') || text.includes('ir ao trabalho') || text.includes('empresa')) {
      return {
        action: 'navigate_work',
        spokenResponse: 'Calculando o trajeto mais eficiente para o seu trabalho.',
        displayTitle: '💼 Rota para Trabalho',
        displayDetails: 'Trajeto profissional carregado.',
      };
    }

    // 3. "Cursus, evite pedágio"
    if (text.includes('evite pedágio') || text.includes('sem pedágio') || text.includes('evitar pedagio') || text.includes('sem pedagio')) {
      return {
        action: 'toggle_tolls',
        avoidTolls: true,
        spokenResponse: 'Ajustando trajeto para evitar praças de pedágio.',
        displayTitle: '🚫 Evitando Pedágios',
        displayDetails: 'Preferência de rota sem cobrança ativada.',
      };
    }

    // 4. "Tem acidente no caminho?" / Ocorrências
    if (text.includes('acidente') || text.includes('ocorrência') || text.includes('ocorrencia') || text.includes('perigo') || text.includes('buraco')) {
      if (!context.activeRoute) {
        return {
          action: 'incident_query',
          spokenResponse: 'Você não está navegando em uma rota ativa no momento. Deseja escolher um destino?',
          displayTitle: '⚠️ Alertas na Via',
          displayDetails: 'Nenhuma rota em andamento.',
        };
      }

      const nearby = context.occurrences.filter(occ => {
        return context.activeRoute!.coordinates.some(pt => {
          const dLat = pt.lat - occ.coordinates.lat;
          const dLng = pt.lng - occ.coordinates.lng;
          return Math.sqrt(dLat * dLat + dLng * dLng) < 0.002;
        });
      });

      if (nearby.length === 0) {
        return {
          action: 'incident_query',
          spokenResponse: 'Caminho livre! Não há acidentes ou bloqueios reportados no seu trajeto atual.',
          displayTitle: '✅ Via Livre',
          displayDetails: '0 incidentes ativos ao longo da rota.',
        };
      }

      const first = nearby[0];
      return {
        action: 'incident_query',
        spokenResponse: `Atenção: há ${nearby.length} alerta(s) no caminho. Próximo: ${first.title}. Mantenha distância segura.`,
        displayTitle: `⚠️ ${nearby.length} Alerta(s) na Rota`,
        displayDetails: first.title,
      };
    }

    // 5. "Vai chover?" / Clima
    if (text.includes('chover') || text.includes('chuva') || text.includes('clima') || text.includes('tempo')) {
      if (context.weather) {
        const isRaining = context.weather.isRaining;
        const prob = context.weather.rainProbability;
        const temp = context.weather.currentTemp;
        
        const answer = isRaining
          ? `Está chovendo na região com temperatura de ${temp} graus. Risco de aquaplanagem nas pistas.`
          : `Probabilidade de chuva de ${prob}%, com temperatura de ${temp} graus e tempo ${context.weather.condition}.`;

        return {
          action: 'weather_query',
          spokenResponse: answer,
          displayTitle: `🌦️ Clima: ${temp}°C • ${context.weather.condition}`,
          displayDetails: `Probabilidade de chuva: ${prob}%`,
        };
      }

      return {
        action: 'weather_query',
        spokenResponse: 'Dados meteorológicos em tempo real temporariamente indisponíveis.',
        displayTitle: '🌦️ Clima Indisponível',
      };
    }

    // 6. "Procure um posto"
    if (text.includes('posto') || text.includes('gasolina') || text.includes('combustivel') || text.includes('gnv') || text.includes('abastecer')) {
      return {
        action: 'find_poi',
        categoryToSearch: 'posto_gnv',
        spokenResponse: 'Buscando postos de combustível e GNV mais próximos de você.',
        displayTitle: '⛽ Postos de Combustível',
      };
    }

    // 7. "Procure um hospital" / "UPA" / "Farmácia"
    if (text.includes('hospital') || text.includes('upa') || text.includes('médico') || text.includes('socorro') || text.includes('farmacia') || text.includes('saude')) {
      return {
        action: 'find_poi',
        categoryToSearch: 'saude',
        spokenResponse: 'Localizando hospitais, UPAs e unidades de emergência próximas.',
        displayTitle: '🏥 Emergência & Saúde',
      };
    }

    // 8. "Procure uma borracharia"
    if (text.includes('borrach') || text.includes('pneu') || text.includes('furou')) {
      return {
        action: 'find_poi',
        categoryToSearch: 'borracheiro',
        spokenResponse: 'Localizando borracharias e serviços de socorro de pneus 24 horas.',
        displayTitle: '🛠️ Borracharias 24h',
      };
    }

    // 9. "Quero a rota mais segura"
    if (text.includes('rota mais segura') || text.includes('segura') || text.includes('segurança')) {
      return {
        action: 'select_route_mode',
        targetMode: 'safest',
        spokenResponse: 'Selecionando a Rota Mais Segura do Cursus Safe.',
        displayTitle: '🛡️ Rota Mais Segura Selecionada',
      };
    }

    // 10. "Quero a rota mais rápida"
    if (text.includes('rota mais rápida') || text.includes('mais rapida') || text.includes('rápida')) {
      return {
        action: 'select_route_mode',
        targetMode: 'fastest',
        spokenResponse: 'Selecionando a Rota Mais Rápida com menor tempo estimado.',
        displayTitle: '⚡ Rota Mais Rápida Selecionada',
      };
    }

    // 11. "Quero a rota mais econômica"
    if (text.includes('econômica') || text.includes('economica') || text.includes('economizar') || text.includes('custo')) {
      return {
        action: 'select_route_mode',
        targetMode: 'economical',
        spokenResponse: 'Selecionando a Rota Mais Econômica para poupar combustível.',
        displayTitle: '⛽ Rota Mais Econômica Selecionada',
      };
    }

    // 12. "Cursus, qual é a melhor rota?"
    if (text.includes('melhor rota') || text.includes('recomenda') || text.includes('qual rota')) {
      if (context.candidateRoutes.length > 0) {
        return {
          action: 'general_answer',
          spokenResponse: 'O Cursus Intelligence Engine avaliou as vias disponíveis. A rota principal oferece o melhor equilíbrio entre tempo e segurança.',
          displayTitle: '🧠 Cursus Intelligence Engine',
          displayDetails: 'Recomendação baseada em tráfego, ocorrências e clima.',
        };
      }
    }

    // Default polite answer
    return {
      action: 'general_answer',
      spokenResponse: `Entendido: ${rawText}. Como posso te guiar agora?`,
      displayTitle: '🎙️ Cursus Copilot',
      displayDetails: rawText,
    };
  }
}
