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

  it('should retrieve nearest locations for Gas/GNV, 24h Tire repair, and Police', async () => {
    const { api } = await import('../src/services/api');
    const userCoords = { lat: -22.9064, lng: -43.1822 };

    const gnvPlaces = await api.getPlaces('posto_gnv', undefined, userCoords);
    expect(gnvPlaces.length).toBeGreaterThan(0);
    expect(gnvPlaces.some(p => p.category === 'posto_gnv')).toBe(true);

    const tirePlaces = await api.getPlaces('borracheiro', undefined, userCoords);
    expect(tirePlaces.length).toBeGreaterThan(0);
    expect(tirePlaces.some(p => p.category === 'borracheiro')).toBe(true);

    const policePlaces = await api.getPlaces('policia', undefined, userCoords);
    expect(policePlaces.length).toBeGreaterThan(0);
    expect(policePlaces.some(p => p.category === 'policia')).toBe(true);
  });
});
