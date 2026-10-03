import React, { useState } from 'react';
import { 
  Car, 
  Bike, 
  Bus, 
  Train, 
  Footprints, 
  Shuffle, 
  Search, 
  Navigation, 
  Clock, 
  TrendingUp, 
  AlertTriangle, 
  ChevronRight,
  Sparkles,
  MapPin,
  CheckCircle2
} from 'lucide-react';
import { TransportMode, RouteOption, GeocodeResult, Coordinates } from '../../types';
import { api } from '../../services/api';

interface RoutePlannerProps {
  currentLocation: Coordinates;
  onRouteCalculated: (routes: RouteOption[], selectedIndex: number) => void;
  onStartNavigation: () => void;
  selectedRoute: RouteOption | null;
  onSelectAlternative: (index: number) => void;
  routes: RouteOption[];
  onSetDestinationFromExternal?: (coords: Coordinates, name: string) => void;
}

export const RoutePlanner: React.FC<RoutePlannerProps> = ({
  currentLocation,
  onRouteCalculated,
  onStartNavigation,
  selectedRoute,
  onSelectAlternative,
  routes,
}) => {
  const [originText, setOriginText] = useState('Sua Localização Atual');
  const [originCoords, setOriginCoords] = useState<Coordinates>(currentLocation);

  const [destText, setDestText] = useState('Av. Paulista, 1500 - São Paulo, SP');
  const [destCoords, setDestCoords] = useState<Coordinates>({ lat: -23.5617, lng: -46.6559 });

  const [mode, setMode] = useState<TransportMode>('car');
  const [avoidTolls, setAvoidTolls] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [searchSuggestions, setSearchSuggestions] = useState<GeocodeResult[]>([]);
  const [activeSearchField, setActiveSearchField] = useState<'origin' | 'dest' | null>(null);

  // Address search via API
  const handleSearch = async (query: string, field: 'origin' | 'dest') => {
    setActiveSearchField(field);
    if (query.trim().length < 3) {
      setSearchSuggestions([]);
      return;
    }

    try {
      const results = await api.geocode(query);
      setSearchSuggestions(results);
    } catch (e) {
      console.error(e);
    }
  };

  const handleSelectSuggestion = (item: GeocodeResult) => {
    if (activeSearchField === 'dest') {
      setDestText(item.displayName);
      setDestCoords(item.coordinates);
    } else {
      setOriginText(item.displayName);
      setOriginCoords(item.coordinates);
    }
    setSearchSuggestions([]);
    setActiveSearchField(null);
  };

  const handleCalculateRoute = async () => {
    setIsSearching(true);
    try {
      const data = await api.calculateRoute(originCoords, destCoords, mode, { avoidTolls });
      onRouteCalculated(data.routes, 0);
    } catch (err) {
      console.error(err);
      alert('Não foi possível calcular a rota no momento.');
    } finally {
      setIsSearching(false);
    }
  };

  const modeButtons: { mode: TransportMode; label: string; icon: React.ReactNode }[] = [
    { mode: 'car', label: 'Carro', icon: <Car className="w-4 h-4" /> },
    { mode: 'motorcycle', label: 'Moto', icon: <Bike className="w-4 h-4" /> },
    { mode: 'bus', label: 'Ônibus', icon: <Bus className="w-4 h-4" /> },
    { mode: 'subway', label: 'Metrô', icon: <Train className="w-4 h-4" /> },
    { mode: 'walk', label: 'A Pé', icon: <Footprints className="w-4 h-4" /> },
    { mode: 'multimodal', label: 'Combinado', icon: <Shuffle className="w-4 h-4" /> },
  ];

  return (
    <div className="bg-slate-900/95 backdrop-blur-md border border-slate-800 rounded-2xl p-4 text-white shadow-xl flex flex-col gap-3">
      {/* Mode Selector */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
        {modeButtons.map(item => (
          <button
            key={item.mode}
            onClick={() => {
              setMode(item.mode);
            }}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
              mode === item.mode
                ? 'bg-blue-600 text-white shadow-md shadow-blue-500/30'
                : 'bg-slate-800/80 text-slate-300 hover:bg-slate-700/80 hover:text-white'
            }`}
          >
            {item.icon}
            <span>{item.label}</span>
          </button>
        ))}
      </div>

      {/* Input Fields */}
      <div className="flex flex-col gap-2 relative">
        {/* Origin */}
        <div className="relative flex items-center">
          <div className="absolute left-3 w-3 h-3 rounded-full border-2 border-lime-400 bg-slate-900" />
          <input
            type="text"
            value={originText}
            onChange={e => {
              setOriginText(e.target.value);
              handleSearch(e.target.value, 'origin');
            }}
            onFocus={() => setActiveSearchField('origin')}
            placeholder="Origem (CEP, Rua ou Cidade)"
            className="w-full bg-slate-950/80 border border-slate-700/80 rounded-xl pl-9 pr-8 py-2.5 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
          />
          <button
            onClick={() => {
              setOriginText('Sua Localização Atual');
              setOriginCoords(currentLocation);
            }}
            className="absolute right-2.5 text-slate-400 hover:text-lime-400 transition-colors"
            title="Usar GPS Atual"
          >
            <Navigation className="w-4 h-4" />
          </button>
        </div>

        {/* Destination */}
        <div className="relative flex items-center">
          <MapPin className="absolute left-3 w-4 h-4 text-red-400" />
          <input
            type="text"
            value={destText}
            onChange={e => {
              setDestText(e.target.value);
              handleSearch(e.target.value, 'dest');
            }}
            onFocus={() => setActiveSearchField('dest')}
            placeholder="Para onde você vai? (CEP ou endereço)"
            className="w-full bg-slate-950/80 border border-slate-700/80 rounded-xl pl-9 pr-8 py-2.5 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
          />
          <Search className="absolute right-2.5 w-4 h-4 text-slate-400" />
        </div>

        {/* Search Autocomplete Suggestions Dropdown */}
        {searchSuggestions.length > 0 && (
          <div className="absolute top-20 left-0 right-0 z-50 bg-slate-950 border border-slate-700 rounded-xl shadow-2xl overflow-hidden divide-y divide-slate-800">
            {searchSuggestions.map(item => (
              <div
                key={item.id}
                onClick={() => handleSelectSuggestion(item)}
                className="p-2.5 hover:bg-slate-800/90 cursor-pointer flex items-center justify-between text-xs transition-colors"
              >
                <div>
                  <p className="font-semibold text-slate-100">{item.displayName}</p>
                  <p className="text-[10px] text-slate-400">
                    {item.provider === 'viacep' ? 'CEP Oficial Brasil' : 'OpenStreetMap'} • {item.city || 'Brasil'}
                  </p>
                </div>
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-blue-900/60 text-blue-300 font-bold uppercase">
                  {item.type}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Preferences & Calculate CTA */}
      <div className="flex items-center justify-between pt-1">
        <label className="flex items-center gap-2 cursor-pointer text-xs text-slate-400 select-none">
          <input
            type="checkbox"
            checked={avoidTolls}
            onChange={e => setAvoidTolls(e.target.checked)}
            className="rounded border-slate-700 bg-slate-800 text-blue-500 focus:ring-0"
          />
          <span>Evitar pedágios</span>
        </label>

        <button
          onClick={handleCalculateRoute}
          disabled={isSearching}
          className="flex items-center gap-1.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-xs px-4 py-2.5 rounded-xl shadow-lg shadow-blue-500/25 active:scale-95 transition-all disabled:opacity-50"
        >
          {isSearching ? (
            <span className="animate-pulse">Calculando...</span>
          ) : (
            <>
              <Sparkles className="w-3.5 h-3.5 text-lime-400" />
              <span>Traçar Rota</span>
            </>
          )}
        </button>
      </div>

      {/* Route Options Summary */}
      {routes.length > 0 && selectedRoute && (
        <div className="mt-2 flex flex-col gap-2.5 border-t border-slate-800 pt-3">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              Opções de Rota Disponíveis
            </span>
            <span className="text-[10px] text-lime-400 font-semibold">
              Previsão Baseada em Dados
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {routes.map((rt, idx) => {
              const isSelected = selectedRoute.id === rt.id;
              const durationMinutes = Math.round(rt.totalDurationSeconds / 60);
              const distanceKm = (rt.totalDistanceMeters / 1000).toFixed(1);

              return (
                <div
                  key={rt.id}
                  onClick={() => onSelectAlternative(idx)}
                  className={`p-3 rounded-xl border cursor-pointer transition-all flex flex-col justify-between ${
                    isSelected
                      ? 'bg-blue-950/60 border-blue-500 shadow-md shadow-blue-500/10'
                      : 'bg-slate-950/40 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-xs text-slate-200">{rt.title}</span>
                    {isSelected && <CheckCircle2 className="w-4 h-4 text-lime-400" />}
                  </div>

                  <div className="flex items-baseline gap-2 mt-2">
                    <span className="text-xl font-black text-white">{durationMinutes} min</span>
                    <span className="text-xs text-slate-400 font-medium">{distanceKm} km</span>
                  </div>

                  <div className="flex items-center justify-between text-[11px] text-slate-400 mt-2 pt-2 border-t border-slate-800/80">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3 text-slate-500" /> Chegada: {rt.eta}
                    </span>
                    {rt.hasTolls ? (
                      <span className="text-amber-400 font-medium">Pedágio ~R$ {rt.tollEstimateBrl?.toFixed(2)}</span>
                    ) : (
                      <span className="text-emerald-400">Sem pedágio</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Multimodal steps visualizer */}
          {selectedRoute.multimodalSegments && (
            <div className="bg-slate-950/60 rounded-xl p-2.5 border border-slate-800">
              <p className="text-[11px] font-semibold text-slate-300 mb-2">Etapas Multimodais Integradas:</p>
              <div className="flex flex-col gap-1.5 text-xs">
                {selectedRoute.multimodalSegments.map((seg, idx) => (
                  <div key={idx} className="flex items-center gap-2 text-slate-300">
                    <span className="w-5 h-5 rounded-full bg-slate-800 flex items-center justify-center text-[10px] text-lime-400 font-bold">
                      {idx + 1}
                    </span>
                    <span>{seg.label}</span>
                    <span className="ml-auto text-slate-500 font-medium">{seg.durationMinutes} min</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Action CTA to Start Navigation */}
          <button
            onClick={onStartNavigation}
            className="w-full py-3.5 rounded-xl bg-gradient-to-r from-lime-400 via-lime-500 to-emerald-500 hover:from-lime-300 hover:to-emerald-400 text-slate-950 font-black text-sm tracking-wide shadow-xl shadow-lime-500/25 flex items-center justify-center gap-2 active:scale-[0.98] transition-all"
          >
            <Navigation className="w-5 h-5 fill-slate-950" />
            <span>INICIAR NAVEGAÇÃO GPS</span>
          </button>
        </div>
      )}
    </div>
  );
};
