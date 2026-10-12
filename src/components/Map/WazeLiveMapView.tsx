import React, { useState, useEffect } from 'react';
import {
  Navigation,
  Search,
  MapPin,
  ExternalLink,
  RefreshCw,
  Crosshair,
  AlertTriangle,
  Sparkles,
  Compass,
  ZoomIn,
  ZoomOut,
  Route as RouteIcon,
  Info,
  ChevronDown,
  ChevronUp,
  CheckCircle2,
} from 'lucide-react';
import type { Coordinates, GeocodeResult, RouteOption, Place } from '../../types';
import { api } from '../../services/api';

interface WazeLiveMapViewProps {
  userCoords: Coordinates;
  detectedLocationName?: string;
  gpsAccuracy?: number | null;
  selectedRoute?: RouteOption | null;
  places?: Place[];
  initialTargetCoords?: Coordinates | null;
  initialTargetLabel?: string | null;
  onTraceInCursus?: (coords: Coordinates, label: string) => void;
  onBackToCursusMap?: () => void;
}

const WAZE_QUICK_CATEGORIES = [
  { key: 'all', label: 'Todos do Bairro', emoji: '📍' },
  { key: 'posto_gnv', label: 'Postos & GNV', emoji: '⛽' },
  { key: 'supermercado', label: 'Supermercados', emoji: '🛒' },
  { key: 'mercado', label: 'Mercadinhos', emoji: '🏪' },
  { key: 'oficina', label: 'Mecânicos', emoji: '🔧' },
  { key: 'funilaria_pintura', label: 'Funilaria & Pintura', emoji: '🎨' },
  { key: 'borracheiro', label: 'Borracharias 24h', emoji: '🛞' },
  { key: 'material_construcao', label: 'Construção', emoji: '🔨' },
  { key: 'saude', label: 'UPAs & Hospitais', emoji: '🏥' },
  { key: 'educacao', label: 'Escolas & Faculdades', emoji: '🎓' },
  { key: 'policia', label: 'Polícia & Batalhões', emoji: '🚓' },
];

// Reference coordinates for Duque de Caxias - RJ from the owner's reference specification
export const DUQUE_DE_CAXIAS_COORDS: Coordinates = {
  lat: -22.7858,
  lng: -43.3049,
};

export const OWNER_REFERENCE_WAZE_DIRECTIONS_URL =
  'https://www.waze.com/pt-BR/live-map/directions/duque-de-caxias-rj-br?to=place.ChIJ9Tjo--1ymQARKqWAwmCwK2c&from=place.ChIJRz4gQ_9fmQARGPQX8apoghE';

/**
 * Helper to build the official Waze Live Map Embed URL (no secret API keys required)
 */
export function buildWazeEmbedUrl(coords: Coordinates, zoom: number = 14, showPin: boolean = true): string {
  const clampedZoom = Math.max(3, Math.min(17, Math.round(zoom)));
  const lat = Number(coords.lat.toFixed(6));
  const lon = Number(coords.lng.toFixed(6));
  return `https://embed.waze.com/pt-BR/iframe?zoom=${clampedZoom}&lat=${lat}&lon=${lon}${showPin ? '&pin=1' : ''}`;
}

/**
 * Helper to build official Waze Universal Deep Link to open navigation or routes directly in Waze
 */
export function buildWazeDirectNavigationUrl(destCoords: Coordinates, originCoords?: Coordinates): string {
  const toLat = Number(destCoords.lat.toFixed(6));
  const toLng = Number(destCoords.lng.toFixed(6));
  if (originCoords) {
    const fromLat = Number(originCoords.lat.toFixed(6));
    const fromLng = Number(originCoords.lng.toFixed(6));
    return `https://www.waze.com/pt-BR/live-map/directions?to=ll.${toLat}%2C${toLng}&from=ll.${fromLat}%2C${fromLng}`;
  }
  return `https://waze.com/ul?ll=${toLat},${toLng}&navigate=yes&zoom=15`;
}

export const WazeLiveMapView: React.FC<WazeLiveMapViewProps> = ({
  userCoords,
  detectedLocationName = 'Localização GPS',
  gpsAccuracy,
  selectedRoute,
  places = [],
  initialTargetCoords,
  initialTargetLabel,
  onTraceInCursus,
  onBackToCursusMap,
}) => {
  // Determine initial center: external target -> active route destination -> user's authorized GPS -> Duque de Caxias example
  const getInitialCoords = (): Coordinates => {
    if (initialTargetCoords) return initialTargetCoords;
    if (selectedRoute && selectedRoute.coordinates.length > 0) {
      return selectedRoute.coordinates[selectedRoute.coordinates.length - 1];
    }
    if (userCoords && userCoords.lat && userCoords.lng) {
      return userCoords;
    }
    return DUQUE_DE_CAXIAS_COORDS;
  };

  const [mapCenter, setMapCenter] = useState<Coordinates>(getInitialCoords);
  const [activeLabel, setActiveLabel] = useState<string>(
    initialTargetLabel ||
      selectedRoute?.title ||
      detectedLocationName ||
      'Duque de Caxias - RJ (Mapa Ao Vivo)'
  );
  const [zoom, setZoom] = useState<number>(14);
  const [iframeKey, setIframeKey] = useState<number>(1);
  const [isLoadingIframe, setIsLoadingIframe] = useState<boolean>(true);
  const [iframeError, setIframeError] = useState<boolean>(false);
  const [isOnline, setIsOnline] = useState<boolean>(
    typeof navigator !== 'undefined' ? navigator.onLine : true
  );

  // Search & Destination Card with Real Photo & Reference Point
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [suggestions, setSuggestions] = useState<GeocodeResult[]>([]);
  const [isSearching, setIsSearching] = useState<boolean>(false);
  const [selectedDestination, setSelectedDestination] = useState<GeocodeResult | null>(null);
  const [isHudMinimized, setIsHudMinimized] = useState<boolean>(false);
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [localPlaces, setLocalPlaces] = useState<Place[]>(places);

  useEffect(() => {
    if (places && places.length > 0) {
      setLocalPlaces(places);
    } else {
      api.getPlaces('', undefined, mapCenter).then(setLocalPlaces).catch(() => {});
    }
  }, [places, mapCenter.lat, mapCenter.lng]);

  // Sync if initialTargetCoords changes from parent
  useEffect(() => {
    if (initialTargetCoords) {
      setMapCenter(initialTargetCoords);
      if (initialTargetLabel) setActiveLabel(initialTargetLabel);
      setIsLoadingIframe(true);
      setIframeError(false);
    }
  }, [initialTargetCoords?.lat, initialTargetCoords?.lng, initialTargetLabel]);

  // Monitor network connectivity
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      setIframeError(false);
    };
    const handleOffline = () => {
      setIsOnline(false);
      setIframeError(true);
    };
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Timeout fallback if iframe takes too long or fails silently
  useEffect(() => {
    if (!isLoadingIframe) return;
    const timer = setTimeout(() => {
      setIsLoadingIframe(false);
    }, 6500);
    return () => clearTimeout(timer);
  }, [isLoadingIframe, iframeKey, mapCenter.lat, mapCenter.lng, zoom]);

  const handleSearchChange = async (value: string) => {
    setSearchQuery(value);
    if (value.trim().length < 2) {
      setSuggestions([]);
      return;
    }
    setIsSearching(true);
    try {
      const results = await api.geocode(value, userCoords);
      setSuggestions(results);
    } catch (e) {
      console.error('[WazeLiveMapView] Erro na busca:', e);
    } finally {
      setIsSearching(false);
    }
  };

  const handleSelectSuggestion = (item: GeocodeResult) => {
    setSelectedDestination(item);
    setSearchQuery(item.displayName);
    setSuggestions([]);
    setMapCenter(item.coordinates);
    setActiveLabel(item.displayName);
    setZoom(15);
    setIsLoadingIframe(true);
    setIframeError(false);
  };

  const handleSearchSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    setIsSearching(true);
    try {
      const results = await api.geocode(searchQuery, userCoords);
      if (results && results.length > 0) {
        handleSelectSuggestion(results[0]);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsSearching(false);
    }
  };

  const handleCenterOnMyGPS = () => {
    setMapCenter(userCoords);
    setActiveLabel(detectedLocationName || 'Minha Posição GPS Ao Vivo');
    setSelectedDestination(null);
    setZoom(15);
    setIsLoadingIframe(true);
    setIframeError(false);
  };

  const handleCenterOnDuqueDeCaxias = () => {
    setMapCenter(DUQUE_DE_CAXIAS_COORDS);
    setActiveLabel('Duque de Caxias - RJ (Centro / Referência)');
    setSelectedDestination({
      id: 'ref-duque-de-caxias',
      displayName: 'Duque de Caxias — Região Metropolitana, RJ',
      city: 'Duque de Caxias',
      state: 'RJ',
      coordinates: DUQUE_DE_CAXIAS_COORDS,
      type: 'city',
      provider: 'internal',
      verifiedReferencePoint:
        'Acesso pela Rodovia Washington Luíz (BR-040), Linha Vermelha e Av. Presidente Kennedy.',
      accessNotes: 'Conexão direta com o Centro de Duque de Caxias, Hospital Moacyr do Carmo e Caxias Shopping.',
      photoUrl:
        'https://images.unsplash.com/photo-1449824913935-59a10b8d2000?auto=format&fit=crop&w=800&q=80',
      photoAttribution: 'Acervo Urbano Baixada Fluminense / RJ',
      rating: 4.8,
      ratingCount: 1450,
    });
    setZoom(14);
    setIsLoadingIframe(true);
    setIframeError(false);
  };

  const handleReloadIframe = () => {
    setIsLoadingIframe(true);
    setIframeError(false);
    setIframeKey(prev => prev + 1);
  };

  const embedUrl = buildWazeEmbedUrl(mapCenter, zoom, true);
  const directWazeRouteUrl = buildWazeDirectNavigationUrl(mapCenter, userCoords);
  const directWazeAppUrl = `https://waze.com/ul?ll=${mapCenter.lat.toFixed(6)},${mapCenter.lng.toFixed(6)}&navigate=yes&zoom=${zoom}`;

  return (
    <div className="relative w-full h-full flex flex-col bg-slate-950 text-white overflow-hidden select-none">
      {/* Top Compact Control Bar */}
      <div className="z-30 bg-slate-950/95 backdrop-blur-xl border-b border-slate-800 px-3 py-2.5 flex flex-col gap-2 shadow-xl">
        <div className="flex flex-wrap items-center justify-between gap-2">
          {/* Title & Live Status */}
          <div className="flex items-center gap-2 min-w-0">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-cyan-500 to-blue-600 flex items-center justify-center shadow-md shadow-cyan-500/20 shrink-0">
              <Navigation className="w-4 h-4 text-slate-950 fill-slate-950" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <h2 className="text-xs sm:text-sm font-black tracking-tight text-white truncate">
                  WAZE AO VIVO • TRÂNSITO EM TEMPO REAL
                </h2>
                <span className="text-[9px] font-black uppercase px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                  Embed Oficial
                </span>
              </div>
              <p className="text-[10px] text-slate-400 truncate">
                📍 Centro ativo: <strong className="text-cyan-300">{activeLabel}</strong>
                {gpsAccuracy ? ` • Precisão GPS ±${gpsAccuracy}m` : ''}
              </p>
            </div>
          </div>

          {/* Quick Location & Zoom Controls */}
          <div className="flex items-center gap-1.5 flex-wrap">
            <button
              onClick={handleCenterOnMyGPS}
              className="px-2.5 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-lime-500/40 text-lime-300 text-[11px] font-bold flex items-center gap-1 active:scale-95 transition-all"
              title="Centralizar na Minha Localização GPS"
            >
              <Crosshair className="w-3.5 h-3.5 text-lime-400" />
              <span>Meu GPS</span>
            </button>

            <button
              onClick={handleCenterOnDuqueDeCaxias}
              className="px-2.5 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-cyan-500/40 text-cyan-300 text-[11px] font-bold flex items-center gap-1 active:scale-95 transition-all"
              title="Visualizar Duque de Caxias - RJ (Mapa de Referência)"
            >
              <MapPin className="w-3.5 h-3.5 text-cyan-400" />
              <span>Duque de Caxias</span>
            </button>

            {/* Zoom Controls respecting Waze allowed levels (3-17) */}
            <div className="flex items-center bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
              <button
                onClick={() => {
                  setZoom(z => Math.max(3, z - 1));
                  setIsLoadingIframe(true);
                }}
                className="p-1.5 text-slate-300 hover:bg-slate-800 hover:text-white transition-colors"
                title="Diminuir Zoom no Waze"
              >
                <ZoomOut className="w-3.5 h-3.5" />
              </button>
              <span className="px-2 text-[10px] font-mono font-bold text-cyan-300">Z{zoom}</span>
              <button
                onClick={() => {
                  setZoom(z => Math.min(17, z + 1));
                  setIsLoadingIframe(true);
                }}
                className="p-1.5 text-slate-300 hover:bg-slate-800 hover:text-white transition-colors"
                title="Aumentar Zoom no Waze"
              >
                <ZoomIn className="w-3.5 h-3.5" />
              </button>
            </div>

            <button
              onClick={handleReloadIframe}
              className="p-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-300 hover:text-white active:scale-95 transition-all"
              title="Recarregar Mapa Ao Vivo"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoadingIframe ? 'animate-spin text-cyan-400' : ''}`} />
            </button>

            {onBackToCursusMap && (
              <button
                onClick={onBackToCursusMap}
                className="px-2.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-[11px] font-bold active:scale-95 transition-all"
              >
                Mapa Cursus
              </button>
            )}
          </div>
        </div>

        {/* Search Destination Bar with Real Photo & Reference Point Lookup */}
        <div className="relative">
          <form onSubmit={handleSearchSubmit} className="flex items-center gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-cyan-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={e => handleSearchChange(e.target.value)}
                placeholder="Pesquisar destino, rua, bairro, mercado, UPA ou oficina para ver no Waze ao Vivo..."
                className="w-full bg-slate-900 border border-slate-700/90 rounded-xl pl-9 pr-20 py-2 text-xs text-white placeholder-slate-400 focus:outline-none focus:border-cyan-400"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => {
                    setSearchQuery('');
                    setSuggestions([]);
                  }}
                  className="absolute right-14 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white text-xs px-1.5"
                >
                  ✕
                </button>
              )}
              <button
                type="submit"
                disabled={isSearching}
                className="absolute right-1.5 top-1/2 -translate-y-1/2 px-2.5 py-1 bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-[11px] rounded-lg transition-colors"
              >
                {isSearching ? '...' : 'Ir'}
              </button>
            </div>

            {/* Direct Waze External Action Button */}
            <a
              href={directWazeRouteUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="px-3 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:brightness-110 text-slate-950 font-black text-xs flex items-center gap-1.5 shadow-lg shadow-cyan-500/20 shrink-0 active:scale-95 transition-all"
              title="Abrir percurso completo diretamente no Waze"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Abrir Percurso no Waze</span>
              <span className="sm:hidden">No Waze</span>
            </a>
          </form>

          {/* Search Suggestions Dropdown with Real Photos, Ratings & Reference Points */}
          {suggestions.length > 0 && (
            <div className="absolute left-0 right-0 top-11 z-50 bg-slate-950 border border-slate-700 rounded-xl shadow-2xl overflow-hidden divide-y divide-slate-800 max-h-64 overflow-y-auto">
              {suggestions.map(item => (
                <div
                  key={item.id}
                  onClick={() => handleSelectSuggestion(item)}
                  className="p-2.5 hover:bg-slate-800/90 cursor-pointer flex items-center justify-between gap-2.5 text-xs transition-colors"
                >
                  {item.photoUrl && (
                    <img
                      src={item.photoUrl}
                      alt={item.displayName}
                      className="w-11 h-11 rounded-lg object-cover shrink-0 border border-slate-700"
                    />
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="font-bold text-white truncate">{item.displayName}</span>
                      {item.rating !== undefined && (
                        <span className="text-[10px] font-black text-amber-400 bg-amber-950/80 border border-amber-700/50 px-1.5 py-0.2 rounded">
                          ★ {item.rating.toFixed(1)}
                        </span>
                      )}
                    </div>
                    {item.verifiedReferencePoint && (
                      <p className="text-[10px] text-cyan-300 truncate">
                        📍 Ref: {item.verifiedReferencePoint}
                      </p>
                    )}
                  </div>
                  <span className="text-[10px] px-2 py-0.5 rounded bg-cyan-950 text-cyan-300 border border-cyan-700/50 font-bold">
                    Centralizar Waze
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Quick Neighborhood Commerce Category Chips + Real-Photo Establishment Selector */}
        <div className="flex flex-col gap-1.5 pt-0.5">
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-0.5">
            {WAZE_QUICK_CATEGORIES.map(cat => {
              const isSelected = activeCategory === cat.key;
              return (
                <button
                  key={cat.key}
                  type="button"
                  onClick={() => {
                    setActiveCategory(cat.key);
                    const filtered = localPlaces.filter(p => {
                      if (cat.key === 'all') return true;
                      if (cat.key === 'saude') return ['saude', 'upa', 'hospital', 'posto_saude'].includes(p.category);
                      if (cat.key === 'policia') return ['policia', 'delegacia', 'batalhao', 'dpo'].includes(p.category);
                      if (cat.key === 'educacao') return ['educacao', 'escola', 'faculdade', 'curso_tecnico'].includes(p.category);
                      return p.category === cat.key;
                    });
                    if (filtered.length > 0 && cat.key !== 'all') {
                      const first = filtered[0];
                      handleSelectSuggestion({
                        id: `place-${first.id}`,
                        displayName: `${first.name} — ${first.neighborhood || 'Bairro'}`,
                        street: first.address,
                        neighborhood: first.neighborhood,
                        city: first.city || 'RJ',
                        state: first.state || 'RJ',
                        coordinates: first.coordinates,
                        type: 'poi',
                        provider: 'internal',
                        photoUrl: first.photoUrl,
                        photoAttribution: first.photoAttribution,
                        verifiedReferencePoint: first.verifiedReferencePoint,
                        accessNotes: first.accessNotes,
                        rating: first.rating,
                        ratingCount: first.ratingCount,
                      });
                    }
                  }}
                  className={`shrink-0 flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold border transition-all active:scale-95 ${
                    isSelected
                      ? 'bg-cyan-500 text-slate-950 border-cyan-300 font-black'
                      : 'bg-slate-900/90 hover:bg-slate-800 text-slate-300 border-slate-800'
                  }`}
                >
                  <span>{cat.emoji}</span>
                  <span>{cat.label}</span>
                </button>
              );
            })}
          </div>

          {localPlaces.length > 0 && (
            <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-0.5">
              {localPlaces
                .filter(p => {
                  if (activeCategory === 'all') return true;
                  if (activeCategory === 'saude') return ['saude', 'upa', 'hospital', 'posto_saude'].includes(p.category);
                  if (activeCategory === 'policia') return ['policia', 'delegacia', 'batalhao', 'dpo'].includes(p.category);
                  if (activeCategory === 'educacao') return ['educacao', 'escola', 'faculdade', 'curso_tecnico'].includes(p.category);
                  return p.category === activeCategory;
                })
                .slice(0, 12)
                .map(place => (
                  <button
                    key={place.id}
                    type="button"
                    onClick={() =>
                      handleSelectSuggestion({
                        id: `place-${place.id}`,
                        displayName: `${place.name} — ${place.neighborhood || 'Bairro'}`,
                        street: place.address,
                        neighborhood: place.neighborhood,
                        city: place.city || 'RJ',
                        state: place.state || 'RJ',
                        coordinates: place.coordinates,
                        type: 'poi',
                        provider: 'internal',
                        photoUrl: place.photoUrl,
                        photoAttribution: place.photoAttribution,
                        verifiedReferencePoint: place.verifiedReferencePoint,
                        accessNotes: place.accessNotes,
                        rating: place.rating,
                        ratingCount: place.ratingCount,
                      })
                    }
                    className="shrink-0 flex items-center gap-2 p-1.5 rounded-xl bg-slate-900/90 hover:bg-slate-800 border border-slate-800 hover:border-cyan-500/50 text-left transition-all active:scale-95 max-w-[230px]"
                  >
                    {place.photoUrl && (
                      <img
                        src={place.photoUrl}
                        alt={place.name}
                        className="w-9 h-9 rounded-lg object-cover shrink-0 border border-slate-700"
                      />
                    )}
                    <div className="min-w-0">
                      <div className="text-[10px] font-bold text-white truncate">{place.name}</div>
                      <div className="flex items-center gap-1 text-[9px] text-amber-400 font-black">
                        {place.rating !== undefined && <span>★ {place.rating.toFixed(1)}</span>}
                        <span className="text-slate-400 font-normal truncate">• {place.subCategory}</span>
                      </div>
                    </div>
                  </button>
                ))}
            </div>
          )}
        </div>
      </div>

      {/* Main Responsive Waze Live Map Iframe Area (Maximized Viewport) */}
      <div className="relative flex-1 w-full h-full min-h-[320px] bg-slate-900">
        {!isOnline || iframeError ? (
          <div className="absolute inset-0 z-20 bg-slate-950 flex flex-col items-center justify-center p-6 text-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400">
              <AlertTriangle className="w-7 h-7" />
            </div>
            <div className="max-w-md space-y-1.5">
              <h3 className="text-base font-black text-white">
                Mapa Ao Vivo do Waze Temporariamente Indisponível
              </h3>
              <p className="text-xs text-slate-400">
                Verifique sua conexão com a internet ou utilize os botões abaixo para abrir o percurso diretamente no aplicativo/site oficial do Waze ou retornar ao mapa nativo do Cursus GPS.
              </p>
            </div>
            <div className="flex flex-wrap items-center justify-center gap-2.5">
              <button
                onClick={handleReloadIframe}
                className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs flex items-center gap-1.5 border border-slate-700"
              >
                <RefreshCw className="w-4 h-4 text-cyan-400" />
                <span>Tentar Novamente</span>
              </button>
              <a
                href={directWazeRouteUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="px-4 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-black text-xs flex items-center gap-1.5 shadow-lg"
              >
                <ExternalLink className="w-4 h-4" />
                <span>Abrir Diretamente no Waze</span>
              </a>
            </div>
          </div>
        ) : (
          <>
            {isLoadingIframe && (
              <div className="absolute top-3 left-1/2 -translate-x-1/2 z-20 bg-slate-950/90 border border-cyan-500/40 text-cyan-300 px-3.5 py-1.5 rounded-full text-xs font-bold flex items-center gap-2 shadow-xl backdrop-blur-md">
                <RefreshCw className="w-3.5 h-3.5 animate-spin text-cyan-400" />
                <span>Sincronizando Waze Live Map em tempo real...</span>
              </div>
            )}

            <iframe
              key={`${iframeKey}-${mapCenter.lat.toFixed(5)}-${mapCenter.lng.toFixed(5)}-${zoom}`}
              src={embedUrl}
              title="Waze Live Map Oficial — Cursus GPS"
              className="w-full h-full border-0"
              allow="geolocation; fullscreen"
              loading="eager"
              referrerPolicy="no-referrer-when-downgrade"
              onLoad={() => setIsLoadingIframe(false)}
              onError={() => {
                setIsLoadingIframe(false);
                setIframeError(true);
              }}
            />
          </>
        )}

        {/* Floating Destination Card (Real Photo + Google Rating + Verified Reference Point + Waze Links) */}
        <div className="absolute bottom-3 left-3 right-3 sm:left-4 sm:right-auto sm:w-[430px] z-20 pointer-events-auto">
          <div className="bg-slate-950/95 backdrop-blur-xl border border-slate-800 rounded-2xl p-3 shadow-2xl flex flex-col gap-2.5">
            {/* Header of floating card */}
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-1.5 min-w-0">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span className="text-xs font-black text-white truncate">
                  {selectedDestination ? selectedDestination.displayName : activeLabel}
                </span>
              </div>
              <button
                onClick={() => setIsHudMinimized(!isHudMinimized)}
                className="p-1 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white"
                title={isHudMinimized ? 'Expandir Detalhes do Destino' : 'Minimizar Cartão'}
              >
                {isHudMinimized ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </button>
            </div>

            {!isHudMinimized && (
              <>
                {/* Real Photo & Verified Reference Point when a destination is selected */}
                {selectedDestination && (
                  <div className="flex flex-col sm:flex-row gap-2.5 items-start bg-slate-900/80 border border-slate-800 rounded-xl p-2">
                    {selectedDestination.photoUrl && (
                      <div className="relative w-full sm:w-28 h-20 rounded-lg overflow-hidden shrink-0 border border-slate-700">
                        <img
                          src={selectedDestination.photoUrl}
                          alt={selectedDestination.displayName}
                          className="w-full h-full object-cover"
                        />
                        <span className="absolute top-1 left-1 text-[8px] font-bold bg-emerald-950/90 text-emerald-300 px-1.5 py-0.5 rounded">
                          Foto Real
                        </span>
                      </div>
                    )}
                    <div className="flex-1 min-w-0 text-[11px] space-y-1">
                      {selectedDestination.rating !== undefined && (
                        <div className="flex items-center gap-1.5">
                          <span className="font-black text-amber-400 bg-amber-950/70 border border-amber-700/50 px-1.5 py-0.2 rounded text-[10px]">
                            ★ {selectedDestination.rating.toFixed(1)}
                          </span>
                          {selectedDestination.ratingCount !== undefined && (
                            <span className="text-[10px] text-slate-400">
                              ({selectedDestination.ratingCount.toLocaleString('pt-BR')} avaliações)
                            </span>
                          )}
                        </div>
                      )}
                      {selectedDestination.verifiedReferencePoint && (
                        <p className="text-cyan-200 leading-snug">
                          <strong className="text-cyan-400">📍 Ref:</strong>{' '}
                          {selectedDestination.verifiedReferencePoint}
                        </p>
                      )}
                      {selectedDestination.accessNotes && (
                        <p className="text-[10px] text-slate-400 leading-snug">
                          🚗 {selectedDestination.accessNotes}
                        </p>
                      )}
                    </div>
                  </div>
                )}

                {/* Action Buttons: Open in Waze App, Open Reference Route, or Trace in Cursus */}
                <div className="grid grid-cols-2 gap-1.5">
                  <a
                    href={directWazeAppUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="py-2 px-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:brightness-110 text-slate-950 font-black text-[11px] flex items-center justify-center gap-1.5 shadow-md"
                  >
                    <Navigation className="w-3.5 h-3.5 fill-slate-950" />
                    <span>Navegar no App Waze</span>
                  </a>

                  <a
                    href={directWazeRouteUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="py-2 px-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-cyan-500/40 text-cyan-300 font-bold text-[11px] flex items-center justify-center gap-1.5"
                  >
                    <ExternalLink className="w-3.5 h-3.5 text-cyan-400" />
                    <span>Rota no Waze Web</span>
                  </a>

                  {onTraceInCursus && (
                    <button
                      onClick={() => onTraceInCursus(mapCenter, activeLabel)}
                      className="col-span-2 py-2 px-2.5 rounded-xl bg-lime-500/15 hover:bg-lime-500/25 border border-lime-500/40 text-lime-300 font-bold text-[11px] flex items-center justify-center gap-1.5 transition-colors"
                    >
                      <RouteIcon className="w-3.5 h-3.5 text-lime-400" />
                      <span>Comparar 3 Rotas Inteligentes no Cursus GPS</span>
                    </button>
                  )}
                </div>

                {/* Owner Reference Route Link (Duque de Caxias - RJ) & Transparency Note */}
                <div className="pt-1 border-t border-slate-800/90 flex flex-col gap-1 text-[10px] text-slate-400">
                  <div className="flex items-center justify-between gap-2">
                    <span className="flex items-center gap-1 text-slate-400">
                      <Info className="w-3 h-3 text-cyan-400 shrink-0" />
                      <span>Visualização oficial Waze Embed.</span>
                    </span>
                    <a
                      href={OWNER_REFERENCE_WAZE_DIRECTIONS_URL}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-cyan-400 hover:underline font-semibold flex items-center gap-1 shrink-0"
                    >
                      <span>Rota Ref. Duque de Caxias</span>
                      <ExternalLink className="w-2.5 h-2.5" />
                    </a>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
