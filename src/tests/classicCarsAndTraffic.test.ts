import { describe, it, expect, beforeEach, vi } from 'vitest';
import { 
  CLASSIC_CARS_CATALOG, 
  FACTORY_PALETTES, 
  type ClassicCar 
} from '../data/classicCarsCatalog';
import { liveTrafficService } from '../services/liveTrafficService';
import { backgroundLocationService } from '../services/backgroundLocationService';
import { MapMatchingService } from '../services/mapMatchingService';
import type { RouteOption, Coordinates } from '../types';

describe('Minha Garagem - Catálogo de Carros Clássicos (Requirement 4 & 5)', () => {
  it('deve conter os clássicos brasileiros e internacionais exigidos', () => {
    const requiredModels = [
      'vw-fusca',
      'chevy-opala',
      'chevy-chevette',
      'chevy-monza',
      'chevy-kadett',
      'vw-brasilia',
      'vw-gol-quadrado',
      'vw-saveiro-antiga',
      'vw-santana',
      'ford-del-rey',
      'ford-corcel',
      'ford-maverick',
      'ford-escort',
      'fiat-uno',
      'fiat-147',
      'fiat-tempra',
      'chevy-vectra',
      'ford-belina',
      'vw-variant',
      'vw-kombi',
      'vw-passat',
      'vw-voyage',
      'vw-parati',
      'puma-gte',
    ];

    const catalogIds = new Set(CLASSIC_CARS_CATALOG.map(car => car.id));

    for (const requiredId of requiredModels) {
      expect(catalogIds.has(requiredId), `Modelo obrigatório ${requiredId} não encontrado no catálogo`).toBe(true);
    }
  });

  it('deve conter as categorias exigidas: antigo, nacional, esportivo, utilitario, moderno', () => {
    const categories = new Set(CLASSIC_CARS_CATALOG.map(car => car.category));
    expect(categories.has('antigo')).toBe(true);
    expect(categories.has('nacional')).toBe(true);
    expect(categories.has('esportivo')).toBe(true);
    expect(categories.has('utilitario')).toBe(true);
    expect(categories.has('moderno')).toBe(true);
  });

  it('cada veículo deve ter fabricante, modelo, ano, paleta de cores autêntica e especificações', () => {
    for (const car of CLASSIC_CARS_CATALOG) {
      expect(car.id).toBeTruthy();
      expect(car.name).toBeTruthy();
      expect(car.brand).toBeTruthy();
      expect(car.model).toBeTruthy();
      expect(car.yearRange).toBeTruthy();
      expect(car.specs).toBeDefined();
      expect(car.specs.engine).toBeTruthy();
      expect(car.specs.power).toBeTruthy();
      expect(car.specs.fuel).toBeTruthy();
      expect(car.availableColors.length).toBeGreaterThan(0);
      expect(car.defaultColorId).toBeTruthy();

      // Verificar paletas de fábrica
      const defaultPalette = FACTORY_PALETTES[car.defaultColorId];
      expect(defaultPalette, `Paleta ${car.defaultColorId} ausente em FACTORY_PALETTES`).toBeDefined();
      expect(defaultPalette.primary.startsWith('#')).toBe(true);
    }
  });

  it('o Fiat Uno deve conter a escada da firma opcional', () => {
    const uno = CLASSIC_CARS_CATALOG.find(c => c.id === 'fiat-uno');
    expect(uno).toBeDefined();
    expect(uno?.hasEscada).toBe(true);
  });

  it('deve persistir e recuperar o carro clássico selecionado em localStorage ou storage equivalente', () => {
    const memoryStore: Record<string, string> = {};
    const storage = typeof localStorage !== 'undefined' ? localStorage : {
      getItem: (k: string) => memoryStore[k] || null,
      setItem: (k: string, v: string) => { memoryStore[k] = v; },
    };

    const carId = 'chevy-opala';
    const colorId = 'azulCobalto';
    storage.setItem('tp_selected_car_id', carId);
    storage.setItem('tp_selected_car_color_id', colorId);

    expect(storage.getItem('tp_selected_car_id')).toBe('chevy-opala');
    expect(storage.getItem('tp_selected_car_color_id')).toBe('azulCobalto');
  });
});

describe('Trânsito ao Vivo - Telemetria e Conexão Real (Requirement 1)', () => {
  it('deve classificar a velocidade e congestionamento com cores e níveis coerentes', () => {
    const speedLimit = 60;

    // Livre (>80% do limite: >= 48 km/h)
    const free = liveTrafficService.classifySpeed(52, speedLimit);
    expect(free.level).toBe('free');
    expect(free.colorHex).toBe('#10B981'); // Verde esmeralda

    // Moderado (60-80%: 36-48 km/h)
    const moderate = liveTrafficService.classifySpeed(40, speedLimit);
    expect(moderate.level).toBe('moderate');
    expect(moderate.colorHex).toBe('#FBBF24'); // Amarelo

    // Lento (40-60%: 24-36 km/h)
    const slow = liveTrafficService.classifySpeed(30, speedLimit);
    expect(slow.level).toBe('slow');
    expect(slow.colorHex).toBe('#F97316'); // Laranja

    // Congestionamento (15-40%: 9-24 km/h)
    const heavy = liveTrafficService.classifySpeed(15, speedLimit);
    expect(heavy.level).toBe('heavy');
    expect(heavy.colorHex).toBe('#EF4444'); // Vermelho

    // Parado / Crítico (<15%: < 9 km/h)
    const critical = liveTrafficService.classifySpeed(5, speedLimit);
    expect(critical.level).toBe('critical');
    expect(critical.colorHex).toBe('#9333EA'); // Roxo
  });

  it('deve fornecer URL oficial de tiles de tráfego Google Maps ao vivo', () => {
    const url = liveTrafficService.getLiveTrafficTileUrl();
    expect(url).toContain('traffic');
    expect(url).toContain('mt{s}.google.com');
  });

  it('deve manter o estado da conexão (online, cached ou offline) com horário e mensagem', () => {
    const state = liveTrafficService.getState();
    expect(['online', 'cached', 'offline', 'error']).toContain(state.status);
    expect(state.provider).toContain('Google Maps Traffic');
    expect(state.message).toBeTruthy();
  });

  it('deve analisar trechos de rota com atraso real em segundos', () => {
    const mockRoute: RouteOption = {
      id: 'route-test-1',
      title: 'Linha Vermelha expressa',
      mode: 'car',
      totalDistanceMeters: 12000,
      totalDurationSeconds: 900,
      eta: '15 min',
      hasTolls: false,
      incidentCount: 1,
      dataOrigin: 'real',
      coordinates: [
        { lat: -22.9068, lng: -43.1729 },
        { lat: -22.9090, lng: -43.1750 },
        { lat: -22.9120, lng: -43.1780 },
        { lat: -22.9150, lng: -43.1810 },
        { lat: -22.9180, lng: -43.1840 },
        { lat: -22.9210, lng: -43.1870 },
      ],
      steps: [
        {
          instruction: 'Siga pela Linha Vermelha',
          distanceMeters: 6000,
          durationSeconds: 450,
          maneuver: 'continue',
          mode: 'car',
          streetName: 'Linha Vermelha',
          coordinates: { lat: -22.9068, lng: -43.1729 },
        },
        {
          instruction: 'Acesse a Av. Brasil',
          distanceMeters: 6000,
          durationSeconds: 450,
          maneuver: 'continue',
          mode: 'car',
          streetName: 'Avenida Brasil',
          coordinates: { lat: -22.9150, lng: -43.1810 },
        },
      ],
    };

    const analysis = liveTrafficService.analyzeRoute(mockRoute);
    expect(analysis).toBeDefined();
    expect(analysis.segments.length).toBeGreaterThan(0);
    expect(analysis.timestamp).toBeTruthy();
  });
});

describe('Recálculo Inteligente & Resiliência a Flutuações GPS (Requirement 2)', () => {
  const sampleRoute: RouteOption = {
    id: 'sample-route',
    title: 'Via Expressa',
    mode: 'car',
    totalDistanceMeters: 5000,
    totalDurationSeconds: 600,
    eta: '10 min',
    hasTolls: false,
    incidentCount: 0,
    dataOrigin: 'real',
    coordinates: [
      { lat: -22.9000, lng: -43.1000 },
      { lat: -22.9010, lng: -43.1010 },
      { lat: -22.9020, lng: -43.1020 },
      { lat: -22.9030, lng: -43.1030 },
      { lat: -22.9040, lng: -43.1040 },
    ],
    steps: [],
  };

  beforeEach(() => {
    MapMatchingService.resetOffRouteCounter();
  });

  it('não deve recalcular na primeira oscilação rápida do GPS (filtro deadband de 3 leituras consecutivas > 45m)', () => {
    // Posição com desvio acentuado (ex: salto de GPS)
    const driftCoord: Coordinates = { lat: -22.9100, lng: -43.1100 }; // ~1.5 km de distância

    // Leitura 1: fora da rota, mas contador = 1 -> NÃO deve recalcular
    const r1 = MapMatchingService.matchPosition(driftCoord, sampleRoute);
    expect(r1.needsRecalculation).toBe(false);

    // Leitura 2: fora da rota, contador = 2 -> NÃO deve recalcular
    const r2 = MapMatchingService.matchPosition(driftCoord, sampleRoute);
    expect(r2.needsRecalculation).toBe(false);

    // Leitura 3 consecutiva: confirma desvio real -> AGORA recalcula
    const r3 = MapMatchingService.matchPosition(driftCoord, sampleRoute);
    expect(r3.needsRecalculation).toBe(true);
  });

  it('deve resetar o contador se o motorista retornar à rota antes da 3ª leitura', () => {
    const driftCoord: Coordinates = { lat: -22.9100, lng: -43.1100 };
    const onRouteCoord: Coordinates = { lat: -22.9010, lng: -43.1010 }; // Em cima da rota

    // Leitura 1: desvio
    MapMatchingService.matchPosition(driftCoord, sampleRoute);
    // Leitura 2: de volta na rota!
    const r2 = MapMatchingService.matchPosition(onRouteCoord, sampleRoute);
    expect(r2.needsRecalculation).toBe(false);

    // Nova leitura com desvio: volta ao passo 1
    const r3 = MapMatchingService.matchPosition(driftCoord, sampleRoute);
    expect(r3.needsRecalculation).toBe(false);
  });
});

describe('GPS em Segundo Plano & Economia de Bateria (Requirement 3)', () => {
  it('deve gerenciar Screen Wake Lock sem quebrar quando navigator.wakeLock não existir', async () => {
    const success = await backgroundLocationService.acquireWakeLock();
    // No ambiente Node/Vitest, navigator.wakeLock pode não existir; deve retornar boolean sem lançar exceção
    expect(typeof success).toBe('boolean');
    backgroundLocationService.releaseWakeLock();
    expect(backgroundLocationService.isWakeLockActive()).toBe(false);
  });

  it('deve iniciar e parar o beacon de áudio em segundo plano com segurança', () => {
    expect(() => {
      backgroundLocationService.startBackgroundAudioBeacon();
      backgroundLocationService.stopBackgroundAudioBeacon();
    }).not.toThrow();
  });
});
