import type { GeocodeResult, RouteOption, Occurrence, Place, CultureSpot, TransportMode, OccurrenceMessage } from '../types';

const API_BASE = '/api';

export const api = {
  async getHealth() {
    const res = await fetch(`${API_BASE}/health`);
    if (!res.ok) throw new Error('Falha ao verificar status da API');
    return res.json();
  },

  async geocode(query: string): Promise<GeocodeResult[]> {
    const res = await fetch(`${API_BASE}/geocode?q=${encodeURIComponent(query)}`);
    if (!res.ok) throw new Error('Erro ao buscar endereço ou CEP');
    return res.json();
  },

  async calculateRoute(
    origin: { lat: number; lng: number },
    destination: { lat: number; lng: number },
    mode: TransportMode = 'car',
    preferences?: { avoidTolls?: boolean }
  ): Promise<{ routes: RouteOption[]; disclaimer: string }> {
    const res = await fetch(`${API_BASE}/route`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ origin, destination, mode, preferences }),
    });
    if (!res.ok) throw new Error('Erro ao calcular rota');
    return res.json();
  },

  async getOccurrences(): Promise<Occurrence[]> {
    const res = await fetch(`${API_BASE}/occurrences`);
    if (!res.ok) throw new Error('Erro ao carregar ocorrências');
    return res.json();
  },

  async reportOccurrence(data: {
    category: string;
    title: string;
    description: string;
    locationName: string;
    coordinates: { lat: number; lng: number };
    severity: string;
    affectedLanes?: string;
  }): Promise<Occurrence> {
    const res = await fetch(`${API_BASE}/occurrences`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error('Erro ao registrar ocorrência');
    return res.json();
  },

  async confirmOccurrence(id: string, action: 'confirm_active' | 'vote_resolved' | 'report_fake'): Promise<{ occurrence: Occurrence; message: string }> {
    const res = await fetch(`${API_BASE}/occurrences/${id}/confirm`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action }),
    });
    if (!res.ok) throw new Error('Erro ao atualizar ocorrência');
    return res.json();
  },

  async getOccurrenceMessages(id: string): Promise<OccurrenceMessage[]> {
    const res = await fetch(`${API_BASE}/occurrences/${id}/messages`);
    if (!res.ok) throw new Error('Erro ao carregar mensagens da ocorrência');
    return res.json();
  },

  async postOccurrenceMessage(id: string, userName: string, text: string): Promise<OccurrenceMessage> {
    const res = await fetch(`${API_BASE}/occurrences/${id}/messages`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userName, text }),
    });
    if (!res.ok) throw new Error('Erro ao enviar mensagem');
    return res.json();
  },

  async getPlaces(category?: string, query?: string): Promise<Place[]> {
    const params = new URLSearchParams();
    if (category) params.append('category', category);
    if (query) params.append('query', query);
    const res = await fetch(`${API_BASE}/places?${params.toString()}`);
    if (!res.ok) throw new Error('Erro ao carregar locais');
    return res.json();
  },

  async getCultureSpots(): Promise<CultureSpot[]> {
    const res = await fetch(`${API_BASE}/culture-spots`);
    if (!res.ok) throw new Error('Erro ao carregar pontos culturais');
    return res.json();
  },

  async getSafetyChecklist(vehicle: 'car' | 'motorcycle') {
    const res = await fetch(`${API_BASE}/safety-checklist?vehicle=${vehicle}`);
    if (!res.ok) throw new Error('Erro ao carregar checklist de segurança');
    return res.json();
  },

  async login(identifier: string) {
    const res = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ identifier }),
    });
    if (!res.ok) throw new Error('Erro ao realizar login');
    return res.json();
  },

  async guestLogin() {
    const res = await fetch(`${API_BASE}/auth/guest`, {
      method: 'POST',
    });
    if (!res.ok) throw new Error('Erro ao entrar como visitante');
    return res.json();
  },
};
