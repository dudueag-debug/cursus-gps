import type { Coordinates, RouteOption } from '../types';

export interface OfflineMapRegion {
  id: string;
  name: string;
  stateCode: string;
  category: 'metropolitana' | 'estadual' | 'nacional';
  sizeMb: number;
  centerCoords: Coordinates;
  bbox: [number, number, number, number]; // [minLng, minLat, maxLng, maxLat]
  isDownloaded: boolean;
  downloadProgressPercent: number;
  lastSyncDate?: string;
  availablePoisCount: number;
}

export const BRAZIL_OFFLINE_REGIONS: OfflineMapRegion[] = [
  {
    id: 'reg-sp-metro',
    name: 'São Paulo — Região Metropolitana & Litoral',
    stateCode: 'SP',
    category: 'metropolitana',
    sizeMb: 145,
    centerCoords: { lat: -23.5505, lng: -46.6333 },
    bbox: [-47.1, -24.1, -46.1, -23.3],
    isDownloaded: false,
    downloadProgressPercent: 0,
    availablePoisCount: 14200,
  },
  {
    id: 'reg-rj-metro',
    name: 'Rio de Janeiro — Capital, Niterói & Baixada',
    stateCode: 'RJ',
    category: 'metropolitana',
    sizeMb: 110,
    centerCoords: { lat: -22.9064, lng: -43.1822 },
    bbox: [-43.8, -23.1, -42.8, -22.6],
    isDownloaded: true,
    downloadProgressPercent: 100,
    lastSyncDate: new Date().toISOString(),
    availablePoisCount: 9800,
  },
  {
    id: 'reg-mg-metro',
    name: 'Belo Horizonte — Grande BH & Inconfidentes',
    stateCode: 'MG',
    category: 'metropolitana',
    sizeMb: 95,
    centerCoords: { lat: -19.9167, lng: -43.9345 },
    bbox: [-44.2, -20.2, -43.7, -19.7],
    isDownloaded: false,
    downloadProgressPercent: 0,
    availablePoisCount: 6500,
  },
  {
    id: 'reg-df-metro',
    name: 'Brasília — Distrito Federal & Entorno',
    stateCode: 'DF',
    category: 'metropolitana',
    sizeMb: 85,
    centerCoords: { lat: -15.7975, lng: -47.8919 },
    bbox: [-48.2, -16.1, -47.5, -15.5],
    isDownloaded: false,
    downloadProgressPercent: 0,
    availablePoisCount: 5200,
  },
  {
    id: 'reg-pr-metro',
    name: 'Curitiba — Região Metropolitana & Litoral',
    stateCode: 'PR',
    category: 'metropolitana',
    sizeMb: 78,
    centerCoords: { lat: -25.4284, lng: -49.2733 },
    bbox: [-49.6, -25.7, -49.0, -25.2],
    isDownloaded: false,
    downloadProgressPercent: 0,
    availablePoisCount: 4800,
  },
  {
    id: 'reg-ba-metro',
    name: 'Salvador — Capital & Litoral Norte',
    stateCode: 'BA',
    category: 'metropolitana',
    sizeMb: 80,
    centerCoords: { lat: -12.9777, lng: -38.5016 },
    bbox: [-38.8, -13.2, -38.2, -12.7],
    isDownloaded: false,
    downloadProgressPercent: 0,
    availablePoisCount: 4300,
  },
  {
    id: 'reg-pe-metro',
    name: 'Recife — Região Metropolitana & Olinda',
    stateCode: 'PE',
    category: 'metropolitana',
    sizeMb: 75,
    centerCoords: { lat: -8.0476, lng: -34.8770 },
    bbox: [-35.1, -8.3, -34.7, -7.8],
    isDownloaded: false,
    downloadProgressPercent: 0,
    availablePoisCount: 4100,
  },
  {
    id: 'reg-rs-metro',
    name: 'Porto Alegre — Região Metropolitana & Serra',
    stateCode: 'RS',
    category: 'metropolitana',
    sizeMb: 88,
    centerCoords: { lat: -30.0346, lng: -51.2177 },
    bbox: [-51.5, -30.3, -50.9, -29.8],
    isDownloaded: false,
    downloadProgressPercent: 0,
    availablePoisCount: 5100,
  },
];

export class OfflineMapEngine {
  private static STORAGE_KEY = 'tp_offline_regions_db';

  public static getRegions(): OfflineMapRegion[] {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      if (stored) return JSON.parse(stored);
    } catch {}
    return BRAZIL_OFFLINE_REGIONS;
  }

  public static saveRegions(regions: OfflineMapRegion[]) {
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(regions));
  }

  public static async downloadRegion(
    regionId: string,
    onProgress: (percent: number) => void
  ): Promise<boolean> {
    const list = this.getRegions();
    const target = list.find(r => r.id === regionId);
    if (!target) return false;

    for (let p = 10; p <= 100; p += 15) {
      target.downloadProgressPercent = p;
      onProgress(p);
      await new Promise(r => setTimeout(r, 200));
    }

    target.isDownloaded = true;
    target.downloadProgressPercent = 100;
    target.lastSyncDate = new Date().toISOString();
    this.saveRegions(list);
    return true;
  }

  public static deleteRegion(regionId: string): boolean {
    const list = this.getRegions();
    const target = list.find(r => r.id === regionId);
    if (!target) return false;

    target.isDownloaded = false;
    target.downloadProgressPercent = 0;
    delete target.lastSyncDate;
    this.saveRegions(list);
    return true;
  }

  /**
   * Evaluates if given coordinates fall inside an already downloaded offline pack
   */
  public static isLocationAvailableOffline(coords: Coordinates): boolean {
    const list = this.getRegions();
    return list.some(r => {
      if (!r.isDownloaded) return false;
      const [minLng, minLat, maxLng, maxLat] = r.bbox;
      return coords.lng >= minLng && coords.lng <= maxLng && coords.lat >= minLat && coords.lat <= maxLat;
    });
  }
}
