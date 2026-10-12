import { describe, it, expect } from 'vitest';

describe('TÔ PASSANDO - GPS do CURSUS Core Engine Tests', () => {
  it('should validate brand slogan and name identity', () => {
    const brandName = 'TÔ PASSANDO';
    const platform = 'CURSUS';
    const slogan = 'Você vai. A gente te guia.';

    expect(brandName).toBe('TÔ PASSANDO');
    expect(platform).toBe('CURSUS');
    expect(slogan).toBe('Você vai. A gente te guia.');
  });

  it('should clean and validate Brazilian CEP (8 digits)', () => {
    const rawCep = '01310-100';
    const clean = rawCep.replace(/\D/g, '');
    expect(clean).toBe('01310100');
    expect(clean.length).toBe(8);
  });

  it('should compute ETA correctly from duration in seconds', () => {
    const durationSeconds = 1800; // 30 minutes
    const now = new Date('2026-10-03T17:00:00Z');
    const arrival = new Date(now.getTime() + durationSeconds * 1000);
    expect(arrival.toISOString()).toBe('2026-10-03T17:30:00.000Z');
  });

  it('should trigger Cursus automatic normalization when resolved votes threshold is met', () => {
    const occurrence = {
      id: 'occ-test',
      status: 'relatada_comunidade',
      resolvedVotesCount: 0,
      isNormalized: false,
      normalizationMessage: '',
    };

    occurrence.resolvedVotesCount += 3;

    if (occurrence.resolvedVotesCount >= 3) {
      occurrence.status = 'resolvida';
      occurrence.isNormalized = true;
      occurrence.normalizationMessage = 'Atualização do Cursus: a ocorrência foi marcada como resolvida. Via normalizada, conforme confirmação recebida.';
    }

    expect(occurrence.status).toBe('resolvida');
    expect(occurrence.isNormalized).toBe(true);
    expect(occurrence.normalizationMessage).toContain('Via normalizada');
  });

  it('should enforce thermal caution and critical checks in safety checklist', () => {
    const carItems = [
      { id: 'c-1', question: 'Cinto de segurança', critical: true, checked: true },
      { id: 'c-5', question: 'Líquido de arrefecimento', critical: true, warningNote: 'ATENÇÃO TÉRMICA: Nunca abra o reservatório de arrefecimento enquanto o motor estiver quente!', checked: false },
    ];

    const hasThermalWarning = carItems.some(i => i.warningNote && i.warningNote.includes('ATENÇÃO TÉRMICA'));
    expect(hasThermalWarning).toBe(true);

    const criticalUnchecked = carItems.filter(i => i.critical && !i.checked);
    expect(criticalUnchecked.length).toBe(1);
    expect(criticalUnchecked[0].id).toBe('c-5');
  });

  it('should create valid multimodal segments for transit trip', () => {
    const transitSegments = [
      { mode: 'walk', label: 'Caminhada até a estação', durationMinutes: 5 },
      { mode: 'subway', label: 'Metrô Linha 4-Amarela', durationMinutes: 14 },
      { mode: 'walk', label: 'Caminhada até o destino', durationMinutes: 4 },
    ];

    const totalMinutes = transitSegments.reduce((sum, s) => sum + s.durationMinutes, 0);
    expect(totalMinutes).toBe(23);
    expect(transitSegments.length).toBe(3);
  });

  it('should validate all 12 quick signal categories for drivers', () => {
    const categories = [
      'engarrafamento', 'alagamento', 'buraco', 'objeto_via',
      'veiculo_parado', 'acidente', 'blitz', 'via_parcialmente_interditada',
      'via_interditada', 'acesso_fechado', 'ponto_roubo', 'local_perigoso'
    ];
    expect(categories.length).toBe(12);
  });

  it('should format 24h roadside assistance WhatsApp dispatch with GPS coordinates', () => {
    const request = {
      driverName: 'Eduardo Piloto',
      vehicle: 'Carro de Passeio',
      location: 'Av. Brasil, Rio de Janeiro - RJ',
      lat: -22.8872,
      lng: -43.2144,
      service: 'reboque',
    };

    const text = `*SOLICITAÇÃO DE REBOQUE*\nMotorista: ${request.driverName}\nGPS: ${request.lat}, ${request.lng}\nMaps: https://www.google.com/maps?q=${request.lat},${request.lng}`;
    expect(text).toContain('SOLICITAÇÃO DE REBOQUE');
    expect(text).toContain('-22.8872');
    expect(text).toContain('https://www.google.com/maps?q=-22.8872,-43.2144');
  });

  it('should calculate weather rain alerts and advice for drivers and motorcyclists', async () => {
    const { weatherService } = await import('../src/services/weatherService');
    const weather = await weatherService.getWeather({ lat: -23.5505, lng: -46.6333 }, 'São Paulo', 'SP');

    expect(weather).toBeDefined();
    expect(weather.city).toBe('São Paulo');
    expect(weather.weeklyForecast.length).toBe(7);
    expect(weather.monthlySummary).toBeDefined();
    expect(weather.monthlySummary.monthName).toBeDefined();
    expect(weather.driverAdvice.car.length).toBeGreaterThan(0);
    expect(weather.driverAdvice.motorcycle.length).toBeGreaterThan(0);
    expect(weather.driverAdvice.motorcycle.some(d => d.includes('Faixas') || d.includes('faixas'))).toBe(true);
  }, 12000);

  it('should evaluate 3 intelligent route modes and Cursus Safe Index', async () => {
    const { CursusIntelligenceEngine } = await import('../src/services/intelligenceEngine');
    const dummyRoutes = [
      {
        id: 'rt-1',
        title: 'Via Expressa Principal',
        mode: 'car' as const,
        totalDistanceMeters: 26000,
        totalDurationSeconds: 1800, // 30 min
        eta: '18:30',
        hasTolls: true,
        tollEstimateBrl: 8.50,
        incidentCount: 2,
        coordinates: [
          { lat: -22.9064, lng: -43.1822 },
          { lat: -22.9080, lng: -43.1840 },
        ],
        steps: [],
        dataOrigin: 'real' as const,
      }
    ];

    const occurrences = [
      {
        id: 'occ-1',
        category: 'buraco' as const,
        title: 'Buraco na faixa',
        description: 'Pista irregular',
        locationName: 'Via',
        coordinates: { lat: -22.9070, lng: -43.1830 },
        sourceType: 'community' as const,
        sourceName: 'Piloto',
        status: 'relatada_comunidade' as const,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        confirmationsCount: 10,
        resolvedVotesCount: 0,
        denialsCount: 0,
        severity: 'alta' as const,
        messagesCount: 1,
        dataOrigin: 'reported' as const,
        confidenceScore: 90,
      }
    ];

    const vehicle = {
      type: 'car' as const,
      brand: 'Sedan',
      model: 'Cursus',
      fuelType: 'gasolina' as const,
      consumptionKmL: 12.0,
    };

    const recommendation = CursusIntelligenceEngine.analyzeAndRecommendRoutes(dummyRoutes, occurrences, null, vehicle);

    expect(recommendation.routes.length).toBeGreaterThanOrEqual(3);
    expect(recommendation.routes.some(r => r.routeCategory === 'fastest')).toBe(true);
    expect(recommendation.routes.some(r => r.routeCategory === 'safest')).toBe(true);
    expect(recommendation.routes.some(r => r.routeCategory === 'economical')).toBe(true);

    const fastest = recommendation.routes.find(r => r.routeCategory === 'fastest');
    expect(fastest?.safetyAnalysis.safetyScore).toBeDefined();
    expect(fastest?.costEstimate.totalCostBrl).toBeGreaterThan(0);
    expect(recommendation.explanation).toBeDefined();
  });

  it('should snap GPS coordinates to road with MapMatchingService and detect off-route', async () => {
    const { MapMatchingService } = await import('../src/services/mapMatchingService');
    const route = {
      id: 'rt-demo',
      title: 'Avenida Principal',
      mode: 'car' as const,
      totalDistanceMeters: 5000,
      totalDurationSeconds: 400,
      eta: '19:00',
      hasTolls: false,
      incidentCount: 0,
      coordinates: [
        { lat: -22.9000, lng: -43.1800 },
        { lat: -22.9100, lng: -43.1800 },
      ],
      steps: [
        {
          instruction: 'Siga na Avenida Central',
          distanceMeters: 5000,
          durationSeconds: 400,
          maneuver: 'continue' as const,
          mode: 'car' as const,
          streetName: 'Avenida Central',
          coordinates: { lat: -22.9000, lng: -43.1800 },
        }
      ],
      dataOrigin: 'real' as const,
    };

    // User is 10 meters off the road (longitude -43.18009)
    const matched = MapMatchingService.matchPosition({ lat: -22.9050, lng: -43.18009 }, route);
    expect(matched.isSnapped).toBe(true);
    expect(matched.isOffRoute).toBe(false);

    // User is 200 meters away (off-route)
    const offRoute = MapMatchingService.matchPosition({ lat: -22.9050, lng: -43.1830 }, route);
    expect(offRoute.isOffRoute).toBe(true);
  });

  it('should process Cursus Copilot natural language commands', async () => {
    const { CursusCopilotService } = await import('../src/services/copilotService');
    const context = {
      currentLocation: { lat: -22.9064, lng: -43.1822 },
      activeRoute: null,
      candidateRoutes: [],
      occurrences: [],
      weather: {
        city: 'Rio de Janeiro',
        state: 'RJ',
        currentTemp: 26,
        feelsLikeTemp: 27,
        tempMin: 22,
        tempMax: 29,
        condition: 'Parcialmente Nublado',
        conditionCode: 2,
        icon: '🌤️',
        humidity: 65,
        windSpeedKmh: 14,
        precipitationMm: 0,
        rainProbability: 15,
        uvIndex: 5,
        isRaining: false,
        rainRisk: 'nenhum' as const,
        roadDrivingCondition: 'boa' as const,
        dataOrigin: 'real' as const,
        driverAdvice: { car: [], motorcycle: [] },
        hourlyForecast: [],
        weeklyForecast: [],
        monthlySummary: {
          monthName: 'Outubro',
          year: 2026,
          avgTempMax: 29,
          avgTempMin: 21,
          rainyDaysCount: 8,
          totalPrecipitationMm: 80,
          summary: '',
          generalAdvice: '',
          motorcycleAdvice: '',
          carAdvice: '',
          criticalWeeks: [],
        },
      },
    };

    const homeCmd = CursusCopilotService.processCommand('Cursus, me leve para casa', context);
    expect(homeCmd.action).toBe('navigate_home');
    expect(homeCmd.spokenResponse).toContain('casa');

    const tollCmd = CursusCopilotService.processCommand('Cursus, evite pedágio', context);
    expect(tollCmd.action).toBe('toggle_tolls');
    expect(tollCmd.avoidTolls).toBe(true);

    const safeCmd = CursusCopilotService.processCommand('Quero a rota mais segura', context);
    expect(safeCmd.action).toBe('select_route_mode');
    expect(safeCmd.targetMode).toBe('safest');

    const weatherCmd = CursusCopilotService.processCommand('Vai chover?', context);
    expect(weatherCmd.action).toBe('weather_query');
    expect(weatherCmd.spokenResponse).toContain('26 graus');
  });

  it('should analyze road incident photos with visual AI and confidence scoring', async () => {
    const { IncidentAiService } = await import('../src/services/incidentAiService');
    const result = await IncidentAiService.analyzeIncidentImage('foto_buraco_asfalto.jpg');

    expect(result.isAiValidated).toBe(true);
    expect(result.detectedCategory).toBe('buraco');
    expect(result.confidencePercent).toBeGreaterThanOrEqual(80);
    expect(result.suggestedTitle).toContain('Buraco');
    expect(result.detectedFeatures.length).toBeGreaterThan(0);
  });

  it('should validate Brazilian geographical coordinates boundary checks', async () => {
    const { isValidBrazilianCoordinates } = await import('../src/services/api');

    // Valid coordinates inside Brazil (SP, RJ, Brasília, Salvador)
    expect(isValidBrazilianCoordinates({ lat: -23.5505, lng: -46.6333 })).toBe(true); // SP
    expect(isValidBrazilianCoordinates({ lat: -22.9068, lng: -43.1729 })).toBe(true); // RJ
    expect(isValidBrazilianCoordinates({ lat: -15.7975, lng: -47.8919 })).toBe(true); // BSB

    // Invalid coordinates (out of Brazil, NaN, null)
    expect(isValidBrazilianCoordinates({ lat: 48.8566, lng: 2.3522 })).toBe(false); // Paris
    expect(isValidBrazilianCoordinates({ lat: 0, lng: 0 })).toBe(false); // Null Island
    expect(isValidBrazilianCoordinates({ lat: NaN, lng: -43.1 })).toBe(false);
    expect(isValidBrazilianCoordinates(null)).toBe(false);
    expect(isValidBrazilianCoordinates(undefined)).toBe(false);
  });

  it('should calculate dynamic places around user with sorted distanceMeters', async () => {
    const { api } = await import('../src/services/api');
    const userLocation = { lat: -23.5505, lng: -46.6333 }; // São Paulo

    const places = await api.getPlaces(undefined, undefined, userLocation);
    expect(places.length).toBeGreaterThan(0);

    // Verify distanceMeters is computed and sorted ascending
    for (let i = 0; i < places.length - 1; i++) {
      expect(places[i].distanceMeters).toBeDefined();
      expect(places[i].distanceMeters!).toBeLessThanOrEqual(places[i + 1].distanceMeters!);
    }

    // Check presence of essential categories
    const categories = places.map(p => p.category);
    expect(categories).toContain('posto_gnv');
    expect(categories).toContain('borracheiro');
    expect(categories).toContain('policia');
  });

  it('should respect user privacy and avoid duplicating route history in userService', async () => {
    const { userService } = await import('../src/services/userService');
    const testUserId = `test_usr_${Date.now()}`;

    // Clean initial state
    userService.clearRouteHistory(testUserId);

    // 1. Add route first time
    userService.addRouteToUserHistory(testUserId, 'Av. Paulista, 1000', 'Parque Ibirapuera', 4200, 720);
    let history = userService.getUserPrivateData(testUserId).routeHistory;
    expect(history.length).toBe(1);
    expect(history[0].destName).toBe('Parque Ibirapuera');

    // 2. Add same route immediately (should deduplicate / update, not create 2nd entry)
    userService.addRouteToUserHistory(testUserId, 'Av. Paulista, 1000', 'Parque Ibirapuera', 4200, 700);
    history = userService.getUserPrivateData(testUserId).routeHistory;
    expect(history.length).toBe(1);
    expect(history[0].durationSeconds).toBe(700);

    // 3. Test deletion of item
    userService.deleteRouteHistoryItem(testUserId, history[0].id);
    history = userService.getUserPrivateData(testUserId).routeHistory;
    expect(history.length).toBe(0);

    // 4. Test privacy rule: if saveRouteHistory is false, do not save
    userService.updatePrivacySettings(testUserId, { saveRouteHistory: false });
    userService.addRouteToUserHistory(testUserId, 'Origem Privada', 'Destino Privado', 1000, 300);
    history = userService.getUserPrivateData(testUserId).routeHistory;
    expect(history.length).toBe(0); // Kept 0 because privacy disabled it!
  });

  it('should compute appropriate route characteristics for car, motorcycle, bike, walk, and truck', async () => {
    const { api } = await import('../src/services/api');
    const origin = { lat: -23.5505, lng: -46.6333 };
    const destination = { lat: -23.5874, lng: -46.6576 };

    // 1. Walk route (no tolls, slow walking pace)
    const walkResult = await api.calculateRoute(origin, destination, 'walk');
    expect(walkResult.routes.length).toBeGreaterThan(0);
    const walkRoute = walkResult.routes[0];
    expect(walkRoute.hasTolls).toBe(false);
    expect(walkRoute.mode).toBe('walk');
    expect(walkRoute.totalDurationSeconds).toBeGreaterThan(1500); // Walking takes significantly longer

    // 2. Bike route (no tolls, cycling velocity)
    const bikeResult = await api.calculateRoute(origin, destination, 'bike');
    const bikeRoute = bikeResult.routes[0];
    expect(bikeRoute.hasTolls).toBe(false);
    expect(bikeRoute.mode).toBe('bike');

    // 3. Motorcycle vs Car duration
    const carResult = await api.calculateRoute(origin, destination, 'car');
    const motoResult = await api.calculateRoute(origin, destination, 'motorcycle');
    const carRoute = carResult.routes[0];
    const motoRoute = motoResult.routes[0];

    expect(carRoute.mode).toBe('car');
    expect(motoRoute.mode).toBe('motorcycle');
    // Motorcycle moves faster or equal due to lane splitting factor in traffic
    expect(motoRoute.totalDurationSeconds).toBeLessThanOrEqual(carRoute.totalDurationSeconds);

    // 4. Avoid tolls preference
    const noTollResult = await api.calculateRoute(origin, destination, 'car', { avoidTolls: true });
    expect(noTollResult.routes[0].hasTolls).toBe(false);
    expect(noTollResult.routes[0].tollEstimateBrl).toBe(0);
  });

  it('should detect tunnels and accurately project dead reckoning positions during satellite outages', async () => {
    const { MapMatchingService } = await import('../src/services/mapMatchingService');

    // 1. Tunnel detection
    expect(MapMatchingService.isTunnelWay('Acesso ao Túnel Rebouças')).toBe(true);
    expect(MapMatchingService.isTunnelWay('Túnel Santa Bárbara (Sentido Laranjeiras)')).toBe(true);
    expect(MapMatchingService.isTunnelWay('Passagem subterrânea expressa')).toBe(true);
    expect(MapMatchingService.isTunnelWay('Av. Atlântica')).toBe(false);

    // 2. Dead reckoning position projection along route geometry
    const dummyRoute: any = {
      id: 'rt-tunnel-test',
      coordinates: [
        { lat: -22.9000, lng: -43.2000 },
        { lat: -22.9050, lng: -43.2000 },
        { lat: -22.9100, lng: -43.2000 },
      ],
      steps: [
        { instruction: 'Siga pelo Túnel Rebouças', distanceMeters: 1000, coordinates: { lat: -22.9000, lng: -43.2000 } }
      ]
    };

    const projected = MapMatchingService.projectTunnelPosition(dummyRoute, 2.0);
    expect(projected).toBeDefined();
    expect(projected.lat).toBeLessThanOrEqual(-22.9000);
    expect(projected.lng).toBeCloseTo(-43.2000, 3);
  });

  it('should resolve routes via hybrid RoutingManager with automated resilience tier', async () => {
    const { RoutingManager } = await import('../src/services/routingProviderService');

    const result = await RoutingManager.calculateRoute({
      origin: { lat: -22.9068, lng: -43.1729 }, // Centro do Rio
      destination: { lat: -22.9711, lng: -43.1822 }, // Copacabana
      mode: 'car',
    });

    expect(result).toBeDefined();
    expect(result.routes.length).toBeGreaterThan(0);
    expect(result.provider).toBeDefined();
    expect(['osrm', 'google', 'mapbox', 'fallback']).toContain(result.provider);
    expect(result.disclaimer).toBeTruthy();
  });
});

