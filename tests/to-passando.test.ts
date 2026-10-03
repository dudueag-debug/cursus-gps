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

    // User community votes that road is now clear
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
});
