import React, { useState } from 'react';
import { 
  MapPin, 
  Crosshair, 
  Search, 
  Check, 
  X, 
  Navigation, 
  Compass, 
  AlertCircle,
  Loader2,
  Sparkles
} from 'lucide-react';
import type { Coordinates } from '../../types';
import { api } from '../../services/api';
import { locationService } from '../../services/locationService';

interface LocationModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentLocation: Coordinates;
  detectedLocationName: string;
  onSelectLocation: (coords: Coordinates, formattedName: string) => void;
}

const POPULAR_CITIES: { name: string; state: string; coords: Coordinates }[] = [
  { name: 'Rio de Janeiro', state: 'RJ', coords: { lat: -22.9068, lng: -43.1729 } },
  { name: 'São Paulo', state: 'SP', coords: { lat: -23.5505, lng: -46.6333 } },
  { name: 'Niterói', state: 'RJ', coords: { lat: -22.8832, lng: -43.1034 } },
  { name: 'Belo Horizonte', state: 'MG', coords: { lat: -19.9167, lng: -43.9345 } },
  { name: 'Curitiba', state: 'PR', coords: { lat: -25.4284, lng: -49.2733 } },
  { name: 'Brasília', state: 'DF', coords: { lat: -15.7975, lng: -47.8919 } },
  { name: 'Salvador', state: 'BA', coords: { lat: -12.9777, lng: -38.5016 } },
  { name: 'Campinas', state: 'SP', coords: { lat: -22.9056, lng: -47.0608 } },
];

export const LocationModal: React.FC<LocationModalProps> = ({
  isOpen,
  onClose,
  currentLocation,
  detectedLocationName,
  onSelectLocation,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<{ name: string; coordinates: Coordinates }[]>([]);
  const [isLocatingGPS, setIsLocatingGPS] = useState(false);
  const [gpsError, setGpsError] = useState<string | null>(null);

  if (!isOpen) return null;

  // Real-time GPS Detection on User Click
  const handleRequestGPS = () => {
    setIsLocatingGPS(true);
    setGpsError(null);

    if (typeof navigator === 'undefined' || !navigator.geolocation) {
      setGpsError('Seu navegador não suporta geolocalização por GPS.');
      setIsLocatingGPS(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const coords = {
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
        };

        try {
          const rev = await locationService.reverseGeocode(coords);
          const formatted = `${rev.city} - ${rev.state} • GPS Ao Vivo`;
          onSelectLocation(coords, formatted);
          setIsLocatingGPS(false);
          onClose();
        } catch {
          onSelectLocation(coords, 'Sua Posição GPS Ao Vivo');
          setIsLocatingGPS(false);
          onClose();
        }
      },
      (err) => {
        setIsLocatingGPS(false);
        if (err.code === 1) {
          setGpsError('Permissão de GPS negada. Ative o acesso à localização nas configurações do navegador ou busque seu endereço abaixo.');
        } else if (err.code === 2) {
          setGpsError('Sinal de GPS indisponível no momento. Tente novamente em área aberta ou busque pelo endereço.');
        } else {
          setGpsError('Tempo limite para obter sinal de GPS. Busque seu endereço ou bairro abaixo.');
        }
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      }
    );
  };

  // Search Address / Neighborhood / City
  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    setIsSearching(true);
    setGpsError(null);
    try {
      const results = await api.geocode(searchQuery.trim());
      setSearchResults(results.map(r => ({ name: r.displayName || `${r.street || ''} ${r.city || ''}`.trim(), coordinates: r.coordinates })));
    } catch (err) {
      console.error(err);
    } finally {
      setIsSearching(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[2500] flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg bg-slate-900 border border-slate-700/80 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="p-4 sm:p-5 bg-gradient-to-r from-blue-950 via-slate-900 to-indigo-950 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-lime-400/10 border border-lime-400/30 flex items-center justify-center text-lime-400 shadow-md">
              <Crosshair className="w-5 h-5 animate-spin-slow" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-black text-white flex items-center gap-2">
                Localização & GPS do Veículo
              </h2>
              <p className="text-xs text-slate-400">
                Ajuste sua posição em tempo real para navegação e alertas
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-white transition-all active:scale-95"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-4 sm:p-5 overflow-y-auto space-y-4">
          {/* Current Position Card */}
          <div className="p-3.5 rounded-2xl bg-slate-950/80 border border-slate-800 flex items-center justify-between gap-3 shadow-inner">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-blue-600/20 text-blue-400 flex items-center justify-center shrink-0">
                <MapPin className="w-4 h-4" />
              </div>
              <div className="text-left">
                <div className="text-[10px] uppercase font-bold text-slate-400">Posição Atual no Mapa</div>
                <div className="text-xs sm:text-sm font-bold text-white truncate max-w-[200px] sm:max-w-[280px]">
                  {detectedLocationName}
                </div>
                <div className="text-[10px] font-mono text-slate-500">
                  {currentLocation.lat.toFixed(5)}, {currentLocation.lng.toFixed(5)}
                </div>
              </div>
            </div>
            <span className="px-2 py-1 rounded-lg bg-lime-400/10 text-lime-400 border border-lime-400/20 text-[10px] font-black uppercase shrink-0">
              Ativo
            </span>
          </div>

          {/* Primary Action: Get Real-Time GPS from Device */}
          <button
            onClick={handleRequestGPS}
            disabled={isLocatingGPS}
            className="w-full py-3.5 px-4 rounded-2xl bg-gradient-to-r from-lime-400 to-emerald-400 hover:from-lime-300 hover:to-emerald-300 text-slate-950 font-black text-sm flex items-center justify-center gap-2 shadow-xl shadow-lime-500/20 active:scale-98 transition-all disabled:opacity-50"
          >
            {isLocatingGPS ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                <span>Calibrando Antena GPS do Telefone...</span>
              </>
            ) : (
              <>
                <Crosshair className="w-5 h-5" />
                <span>🎯 Obter Minha Localização Exata via GPS (Ao Vivo)</span>
              </>
            )}
          </button>

          {/* GPS Error Notice if any */}
          {gpsError && (
            <div className="p-3 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs flex items-start gap-2 leading-relaxed">
              <AlertCircle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
              <span>{gpsError}</span>
            </div>
          )}

          {/* Manual Address / Neighborhood Search */}
          <div className="space-y-2 pt-1">
            <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
              <Search className="w-3.5 h-3.5 text-blue-400" />
              <span>Ou digite seu Bairro, Rua ou Ponto de Referência:</span>
            </label>
            <form onSubmit={handleSearch} className="flex gap-2">
              <div className="relative flex-1">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Ex: Copacabana, Av. Paulista, Centro..."
                  className="w-full bg-slate-950 border border-slate-700/80 rounded-2xl px-3.5 py-2.5 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-blue-500 transition-colors"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white text-xs"
                  >
                    ✕
                  </button>
                )}
              </div>
              <button
                type="submit"
                disabled={isSearching || !searchQuery.trim()}
                className="px-4 py-2.5 rounded-2xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition-all disabled:opacity-50 flex items-center gap-1.5 shrink-0"
              >
                {isSearching ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
                <span>Buscar</span>
              </button>
            </form>

            {/* Search Results List */}
            {searchResults.length > 0 && (
              <div className="mt-2 space-y-1.5 max-h-44 overflow-y-auto p-1 bg-slate-950/60 rounded-2xl border border-slate-800">
                {searchResults.map((res, idx) => (
                  <button
                    key={idx}
                    onClick={() => {
                      onSelectLocation(res.coordinates, res.name);
                      onClose();
                    }}
                    className="w-full text-left p-2.5 rounded-xl hover:bg-blue-600/20 hover:border-blue-500/40 border border-transparent transition-all flex items-center justify-between group text-xs text-slate-200"
                  >
                    <div className="flex items-center gap-2 truncate">
                      <MapPin className="w-3.5 h-3.5 text-lime-400 shrink-0" />
                      <span className="truncate group-hover:text-white font-medium">{res.name}</span>
                    </div>
                    <span className="text-[10px] text-blue-400 font-bold group-hover:translate-x-0.5 transition-transform shrink-0 ml-2">
                      Selecionar ➔
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Quick Major Cities / Presets */}
          <div className="pt-2">
            <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1">
              <Compass className="w-3.5 h-3.5 text-cyan-400" />
              <span>Cidades & Capitais Rápidas</span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
              {POPULAR_CITIES.map((city) => (
                <button
                  key={city.name}
                  onClick={() => {
                    onSelectLocation(city.coords, `${city.name} - ${city.state} • GPS`);
                    onClose();
                  }}
                  className="p-2 rounded-xl bg-slate-800/60 hover:bg-slate-700/80 border border-slate-700/50 hover:border-blue-500/50 text-left transition-all active:scale-95 flex flex-col"
                >
                  <span className="text-xs font-bold text-white truncate">{city.name}</span>
                  <span className="text-[10px] text-slate-400 font-semibold">{city.state}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-3 bg-slate-950 border-t border-slate-800 text-center">
          <p className="text-[11px] text-slate-400">
            💡 <b className="text-slate-300">Dica:</b> O TÔ PASSANDO sincroniza automaticamente o trajeto e os alertas de trânsito para a região escolhida.
          </p>
        </div>
      </div>
    </div>
  );
};
