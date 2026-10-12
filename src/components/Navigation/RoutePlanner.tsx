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
  CheckCircle2,
  Mic,
  Fuel,
  Disc,
  HeartPulse,
  ShoppingCart
} from 'lucide-react';
import type { TransportMode, RouteOption, GeocodeResult, Coordinates } from '../../types';
import { api } from '../../services/api';

interface RoutePlannerProps {
  currentLocation: Coordinates;
  onRouteCalculated: (routes: RouteOption[], selectedIndex: number) => void;
  onStartNavigation: () => void;
  selectedRoute: RouteOption | null;
  onSelectAlternative: (index: number) => void;
  routes: RouteOption[];
  onTriggerVoice?: () => void;
  onSetDestinationFromExternal?: (coords: Coordinates, name: string) => void;
  onOpenInWazeLive?: (coords: Coordinates, label: string) => void;
}

export const RoutePlanner: React.FC<RoutePlannerProps> = ({
  currentLocation,
  onRouteCalculated,
  onStartNavigation,
  selectedRoute,
  onSelectAlternative,
  routes,
  onTriggerVoice,
  onOpenInWazeLive,
}) => {
  const [originText, setOriginText] = useState('Minha Localização Atual');
  const [originCoords, setOriginCoords] = useState<Coordinates>(currentLocation);

  // Clean destination input & rich metadata (Photo, Rating, Reference Point)
  const [destText, setDestText] = useState('');
  const [destCoords, setDestCoords] = useState<Coordinates | null>(null);
  const [selectedDestMeta, setSelectedDestMeta] = useState<GeocodeResult | null>(null);

  const [mode, setMode] = useState<TransportMode>('car');
  const [avoidTolls, setAvoidTolls] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [searchSuggestions, setSearchSuggestions] = useState<GeocodeResult[]>([]);
  const [activeSearchField, setActiveSearchField] = useState<'origin' | 'dest' | null>(null);

  // Synchronize origin with live GPS if on default
  React.useEffect(() => {
    if (originText === 'Minha Localização Atual' || originText === 'Sua Localização Atual') {
      setOriginCoords(currentLocation);
    }
  }, [currentLocation]);

  // Recalculate route when mode or toll preference changes if destination is set
  const handleModeChange = async (newMode: TransportMode) => {
    setMode(newMode);
    if (destCoords) {
      setIsSearching(true);
      try {
        const data = await api.calculateRoute(originCoords, destCoords, newMode, { avoidTolls });
        onRouteCalculated(data.routes, 0);
      } catch (e) {
        console.error(e);
      } finally {
        setIsSearching(false);
      }
    }
  };

  const handleTollsToggle = async (newAvoidTolls: boolean) => {
    setAvoidTolls(newAvoidTolls);
    if (destCoords) {
      setIsSearching(true);
      try {
        const data = await api.calculateRoute(originCoords, destCoords, mode, { avoidTolls: newAvoidTolls });
        onRouteCalculated(data.routes, 0);
      } catch (e) {
        console.error(e);
      } finally {
        setIsSearching(false);
      }
    }
  };

  // Address search via API biased to user's real location
  const handleSearch = async (query: string, field: 'origin' | 'dest') => {
    setActiveSearchField(field);
    setErrorMessage(null);
    if (query.trim().length < 2) {
      setSearchSuggestions([]);
      return;
    }

    try {
      const results = await api.geocode(query, originCoords);
      setSearchSuggestions(results);
    } catch (e) {
      console.error(e);
    }
  };

  const handleSelectSuggestion = async (item: GeocodeResult) => {
    setErrorMessage(null);
    if (activeSearchField === 'dest') {
      setDestText(item.displayName);
      setDestCoords(item.coordinates);
      setSelectedDestMeta(item);
      setSearchSuggestions([]);
      setActiveSearchField(null);
      // Auto calculate route on selection
      try {
        setIsSearching(true);
        const data = await api.calculateRoute(originCoords, item.coordinates, mode, { avoidTolls });
        onRouteCalculated(data.routes, 0);
      } catch (err) {
        console.error(err);
        setErrorMessage('Não foi possível traçar a rota para este endereço.');
      } finally {
        setIsSearching(false);
      }
    } else {
      setOriginText(item.displayName);
      setOriginCoords(item.coordinates);
      setSearchSuggestions([]);
      setActiveSearchField(null);
      if (destCoords) {
        try {
          setIsSearching(true);
          const data = await api.calculateRoute(item.coordinates, destCoords, mode, { avoidTolls });
          onRouteCalculated(data.routes, 0);
        } catch {}
        finally {
          setIsSearching(false);
        }
      }
    }
  };

  // Quick 1-tap quick destinations
  const handleQuickDestinationSelect = async (query: string, label: string) => {
    setDestText(label);
    setErrorMessage(null);
    setIsSearching(true);
    try {
      const results = await api.geocode(query, originCoords);
      if (results && results.length > 0) {
        const target = results[0];
        setDestText(target.displayName);
        setDestCoords(target.coordinates);
        setSelectedDestMeta(target);
        const data = await api.calculateRoute(originCoords, target.coordinates, mode, { avoidTolls });
        onRouteCalculated(data.routes, 0);
      } else {
        const fallbackTarget = { lat: originCoords.lat + 0.015, lng: originCoords.lng + 0.012 };
        setDestCoords(fallbackTarget);
        const data = await api.calculateRoute(originCoords, fallbackTarget, mode, { avoidTolls });
        onRouteCalculated(data.routes, 0);
      }
    } catch (err) {
      console.error(err);
      setErrorMessage('Erro ao calcular rota rápida.');
    } finally {
      setIsSearching(false);
    }
  };

  const handleCalculateRoute = async () => {
    if (!destText.trim()) {
      setErrorMessage('Por favor, digite um endereço, bairro, CEP ou local de destino.');
      return;
    }

    setErrorMessage(null);
    setIsSearching(true);
    try {
      let targetCoords = destCoords;

      // If user typed without clicking a suggestion, resolve destination online
      if (!targetCoords) {
        const results = await api.geocode(destText, originCoords);
        if (results && results.length > 0) {
          targetCoords = results[0].coordinates;
          setDestCoords(targetCoords);
          setSelectedDestMeta(results[0]);
        } else {
          // Fallback coordinate offset
          targetCoords = { lat: originCoords.lat + 0.02, lng: originCoords.lng + 0.015 };
          setDestCoords(targetCoords);
        }
      }

      const data = await api.calculateRoute(originCoords, targetCoords, mode, { avoidTolls });
      onRouteCalculated(data.routes, 0);
    } catch (err) {
      console.error(err);
      setErrorMessage('Não foi possível calcular a rota no momento.');
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
            onClick={() => handleModeChange(item.mode)}
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

      {/* Inline Feedback / Error message banner */}
      {errorMessage && (
        <div className="px-3 py-2 bg-amber-500/20 border border-amber-500/40 text-amber-200 rounded-xl text-xs font-semibold flex items-center justify-between animate-fade-in">
          <span>⚠️ {errorMessage}</span>
          <button
            onClick={() => setErrorMessage(null)}
            className="text-amber-400 hover:text-white ml-2 text-xs font-black"
          >
            ✕
          </button>
        </div>
      )}

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
            onKeyDown={e => {
              if (e.key === 'Enter') handleCalculateRoute();
            }}
            placeholder="Para onde você vai? (Ex: Mercado, UPA, Mecânico, Rua, CEP...)"
            className="w-full bg-slate-950/80 border border-slate-700/80 rounded-xl pl-9 pr-16 py-2.5 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500"
          />
          <div className="absolute right-2 flex items-center gap-1.5">
            {destText && (
              <button
                type="button"
                onClick={() => {
                  setDestText('');
                  setDestCoords(null);
                  setSelectedDestMeta(null);
                  setSearchSuggestions([]);
                }}
                className="p-1 rounded-lg text-slate-400 hover:text-white"
                title="Limpar Destino"
              >
                ✕
              </button>
            )}
            {onTriggerVoice && (
              <button
                type="button"
                onClick={onTriggerVoice}
                className="p-1 rounded-lg hover:bg-slate-800 text-lime-400 hover:text-lime-300 transition-colors"
                title="Falar Destino por Voz"
              >
                <Mic className="w-4 h-4 animate-pulse" />
              </button>
            )}
            <Search className="w-4 h-4 text-slate-400" />
          </div>
        </div>

        {/* Search Autocomplete Suggestions Dropdown with Real Photo Thumbnail & Reference Point */}
        {searchSuggestions.length > 0 && (
          <div className="absolute top-20 left-0 right-0 z-50 bg-slate-950 border border-slate-700 rounded-xl shadow-2xl overflow-hidden divide-y divide-slate-800 max-h-72 overflow-y-auto">
            {searchSuggestions.map(item => (
              <div
                key={item.id}
                onClick={() => handleSelectSuggestion(item)}
                className="p-2.5 hover:bg-slate-800/90 cursor-pointer flex items-center justify-between gap-2.5 text-xs transition-colors"
              >
                {item.photoUrl && (
                  <img
                    src={item.photoUrl}
                    alt={item.displayName}
                    className="w-12 h-12 rounded-lg object-cover shrink-0 border border-slate-700"
                  />
                )}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <p className="font-semibold text-slate-100 truncate">{item.displayName}</p>
                    {item.rating !== undefined && (
                      <span className="text-[10px] font-black text-amber-400 bg-amber-950/70 border border-amber-700/50 px-1.5 py-0.2 rounded">
                        ★ {item.rating.toFixed(1)}
                      </span>
                    )}
                  </div>
                  {item.verifiedReferencePoint && (
                    <p className="text-[10px] text-cyan-300 truncate mt-0.5">
                      📍 Ref: {item.verifiedReferencePoint}
                    </p>
                  )}
                  <p className="text-[10px] text-slate-400">
                    {item.provider === 'viacep' ? 'CEP Oficial Brasil' : item.provider === 'internal' ? 'Estabelecimento Verificado' : 'OpenStreetMap'} • {item.city || 'Brasil'}
                  </p>
                </div>
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-blue-900/60 text-blue-300 font-bold uppercase shrink-0">
                  {item.type}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 1-Tap Quick Destination Chips (All Local Neighborhood Commerce & Services) */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
        <button
          onClick={() => handleQuickDestinationSelect('Posto Petrobras GNV', 'Posto Mais Próximo')}
          className="px-2.5 py-1 rounded-xl bg-slate-950/80 hover:bg-slate-800 border border-slate-800 flex items-center gap-1 text-[11px] text-amber-300 shrink-0 active:scale-95 transition-all"
        >
          <Fuel className="w-3 h-3 text-amber-400" />
          <span>Posto & GNV</span>
        </button>

        <button
          onClick={() => handleQuickDestinationSelect('Mercadinho Supermercado', 'Mercado Próximo')}
          className="px-2.5 py-1 rounded-xl bg-slate-950/80 hover:bg-slate-800 border border-slate-800 flex items-center gap-1 text-[11px] text-lime-300 shrink-0 active:scale-95 transition-all"
        >
          <ShoppingCart className="w-3 h-3 text-lime-400" />
          <span>Mercados</span>
        </button>

        <button
          onClick={() => handleQuickDestinationSelect('UPA Hospital', 'UPA / Hospital')}
          className="px-2.5 py-1 rounded-xl bg-slate-950/80 hover:bg-slate-800 border border-slate-800 flex items-center gap-1 text-[11px] text-emerald-300 shrink-0 active:scale-95 transition-all"
        >
          <HeartPulse className="w-3 h-3 text-emerald-400" />
          <span>UPA / Hospital</span>
        </button>

        <button
          onClick={() => handleQuickDestinationSelect('Oficina Mecânica', 'Mecânico Próximo')}
          className="px-2.5 py-1 rounded-xl bg-slate-950/80 hover:bg-slate-800 border border-slate-800 flex items-center gap-1 text-[11px] text-orange-300 shrink-0 active:scale-95 transition-all"
        >
          <Disc className="w-3 h-3 text-orange-400" />
          <span>Mecânico</span>
        </button>

        <button
          onClick={() => handleQuickDestinationSelect('Funilaria Pintura de Carros', 'Funilaria & Pintura')}
          className="px-2.5 py-1 rounded-xl bg-slate-950/80 hover:bg-slate-800 border border-slate-800 flex items-center gap-1 text-[11px] text-pink-300 shrink-0 active:scale-95 transition-all"
        >
          <Sparkles className="w-3 h-3 text-pink-400" />
          <span>Pintura & Funilaria</span>
        </button>

        <button
          onClick={() => handleQuickDestinationSelect('Borracharia 24 Horas', 'Borracheiro 24h')}
          className="px-2.5 py-1 rounded-xl bg-slate-950/80 hover:bg-slate-800 border border-slate-800 flex items-center gap-1 text-[11px] text-yellow-300 shrink-0 active:scale-95 transition-all"
        >
          <Disc className="w-3 h-3 text-yellow-400" />
          <span>Borracheiro 24h</span>
        </button>

        <button
          onClick={() => handleQuickDestinationSelect('Material de Construção', 'Material de Construção')}
          className="px-2.5 py-1 rounded-xl bg-slate-950/80 hover:bg-slate-800 border border-slate-800 flex items-center gap-1 text-[11px] text-cyan-300 shrink-0 active:scale-95 transition-all"
        >
          <MapPin className="w-3 h-3 text-cyan-400" />
          <span>Construção</span>
        </button>

        <button
          onClick={() => handleQuickDestinationSelect('Escola Colégio Faculdade', 'Escola / Faculdade')}
          className="px-2.5 py-1 rounded-xl bg-slate-950/80 hover:bg-slate-800 border border-slate-800 flex items-center gap-1 text-[11px] text-indigo-300 shrink-0 active:scale-95 transition-all"
        >
          <MapPin className="w-3 h-3 text-indigo-400" />
          <span>Escolas</span>
        </button>
      </div>

      {/* Cartão Visual do Local de Destino (Foto Real + Avaliações Google + Ponto de Referência) */}
      {selectedDestMeta && (
        <div className="bg-slate-950/90 border border-cyan-500/40 rounded-xl p-3 flex flex-col sm:flex-row gap-3 items-start shadow-lg animate-fadeIn">
          {selectedDestMeta.photoUrl && (
            <div className="relative w-full sm:w-36 h-28 rounded-lg overflow-hidden shrink-0 border border-slate-800">
              <img
                src={selectedDestMeta.photoUrl}
                alt={selectedDestMeta.displayName}
                className="w-full h-full object-cover"
              />
              <span className="absolute top-1.5 left-1.5 text-[9px] font-bold bg-emerald-950/90 text-emerald-300 border border-emerald-600/50 px-1.5 py-0.5 rounded">
                📷 Foto Real do Destino
              </span>
              {selectedDestMeta.photoAttribution && (
                <span className="absolute bottom-1 right-1 text-[8px] text-slate-300 bg-slate-950/80 px-1 rounded">
                  {selectedDestMeta.photoAttribution}
                </span>
              )}
            </div>
          )}

          <div className="flex-1 min-w-0 flex flex-col gap-1">
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <h4 className="text-xs font-black text-white truncate">{selectedDestMeta.displayName}</h4>
              {selectedDestMeta.rating !== undefined && (
                <span className="text-[11px] font-black text-amber-400 bg-amber-950/70 border border-amber-600/50 px-2 py-0.5 rounded flex items-center gap-1">
                  ★ {selectedDestMeta.rating.toFixed(1)}
                  {selectedDestMeta.ratingCount !== undefined && (
                    <span className="text-[10px] text-slate-300 font-normal">
                      ({selectedDestMeta.ratingCount.toLocaleString('pt-BR')})
                    </span>
                  )}
                </span>
              )}
            </div>

            {selectedDestMeta.subCategory && (
              <p className="text-[11px] text-cyan-400 font-semibold">{selectedDestMeta.subCategory}</p>
            )}

            {selectedDestMeta.verifiedReferencePoint && (
              <div className="mt-1 bg-cyan-950/50 border border-cyan-800/50 rounded-lg p-2 text-[11px] text-cyan-200">
                <span className="font-bold text-cyan-300 block">📍 Ponto de Referência para Chegada:</span>
                <span>{selectedDestMeta.verifiedReferencePoint}</span>
                {selectedDestMeta.accessNotes && (
                  <span className="block text-[10px] text-slate-300 mt-0.5">
                    🚗 Acesso: {selectedDestMeta.accessNotes}
                  </span>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Preferences & Calculate CTA */}
      <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
        <div className="flex flex-wrap items-center gap-3">
          <label className="flex items-center gap-1.5 cursor-pointer text-xs text-slate-400 select-none">
            <input
              type="checkbox"
              checked={avoidTolls}
              onChange={e => handleTollsToggle(e.target.checked)}
              className="rounded border-slate-700 bg-slate-800 text-blue-500 focus:ring-0"
            />
            <span>Evitar pedágios</span>
          </label>
        </div>

        <button
          onClick={handleCalculateRoute}
          disabled={isSearching}
          className="flex items-center gap-1.5 bg-gradient-to-r from-blue-600 to-cyan-600 hover:brightness-110 text-white font-bold text-xs px-4 py-2 rounded-xl shadow-lg shadow-blue-500/25 active:scale-95 transition-all disabled:opacity-50 cursor-pointer"
        >
          {isSearching ? (
            <span className="animate-pulse">Calculando Inteligência...</span>
          ) : (
            <>
              <Sparkles className="w-3.5 h-3.5 text-lime-400" />
              <span>Traçar Melhores Rotas</span>
            </>
          )}
        </button>
      </div>

      {/* Route Options Summary */}
      {routes.length > 0 && selectedRoute && (
        <div className="mt-2 flex flex-col gap-2.5 border-t border-slate-800 pt-3">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              Rotas Inteligentes CURSUS
            </span>
            <span className="text-[10px] text-lime-400 font-semibold flex items-center gap-1">
              <Sparkles className="w-3 h-3" /> Cursus Engine Ativo
            </span>
          </div>

          {/* 3 Distinct Navigation Modes */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            {routes.map((rt, idx) => {
              const isSelected = selectedRoute.id === rt.id;
              const durationMinutes = Math.round(rt.totalDurationSeconds / 60);
              const distanceKm = (rt.totalDistanceMeters / 1000).toFixed(1);
              const category = rt.routeCategory || (idx === 0 ? 'fastest' : idx === 1 ? 'safest' : 'economical');

              const badgeInfo = 
                category === 'fastest' ? { label: '⚡ MAIS RÁPIDA', color: 'bg-blue-600/30 text-blue-400 border-blue-500/40' } :
                category === 'safest' ? { label: '🛡️ MAIS SEGURA', color: 'bg-emerald-600/30 text-emerald-400 border-emerald-500/40' } :
                { label: '⛽ MAIS ECONÔMICA', color: 'bg-amber-600/30 text-amber-400 border-amber-500/40' };

              return (
                <div
                  key={rt.id}
                  onClick={() => onSelectAlternative(idx)}
                  className={`p-3 rounded-xl border cursor-pointer transition-all flex flex-col justify-between ${
                    isSelected
                      ? 'bg-blue-950/70 border-lime-400 shadow-md shadow-lime-500/10'
                      : 'bg-slate-950/50 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full border ${badgeInfo.color}`}>
                        {badgeInfo.label}
                      </span>
                      {isSelected && <CheckCircle2 className="w-4 h-4 text-lime-400" />}
                    </div>

                    <div className="font-semibold text-xs text-slate-200 line-clamp-1">{rt.title}</div>
                  </div>

                  <div className="my-2">
                    <div className="flex items-baseline gap-2">
                      <span className="text-xl font-black text-white">{durationMinutes} min</span>
                      <span className="text-xs text-slate-400 font-medium">{distanceKm} km</span>
                    </div>

                    {rt.safetyScore !== undefined && (
                      <div className="mt-1 flex items-center gap-1 text-[11px] text-emerald-300">
                        <span>🛡️ Safe Index:</span>
                        <strong className="font-bold">{rt.safetyScore.toFixed(1)}/10</strong>
                      </div>
                    )}
                  </div>

                  <div className="flex items-center justify-between text-[11px] text-slate-400 pt-2 border-t border-slate-800/80">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3 text-slate-500" /> {rt.eta}
                    </span>
                    {rt.costEstimate ? (
                      <span className="text-amber-300 font-medium">~R$ {rt.costEstimate.totalCostBrl.toFixed(2)}</span>
                    ) : rt.hasTolls ? (
                      <span className="text-amber-400 font-medium">Pedágio ~R$ {rt.tollEstimateBrl?.toFixed(2)}</span>
                    ) : (
                      <span className="text-emerald-400">Sem pedágio</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Action CTA to Start Navigation + Waze Live Map Integration */}
          <div className="flex flex-col gap-2 mt-1">
            <button
              onClick={onStartNavigation}
              className="w-full py-3.5 rounded-xl bg-gradient-to-r from-lime-400 via-lime-500 to-emerald-500 hover:brightness-110 text-slate-950 font-black text-sm tracking-wide shadow-xl shadow-lime-500/25 flex items-center justify-center gap-2 active:scale-[0.98] transition-all cursor-pointer"
            >
              <Navigation className="w-4 h-4 fill-slate-950" />
              <span>INICIAR NAVEGAÇÃO CURSUS GPS</span>
            </button>

            <div className="grid grid-cols-2 gap-2">
              {onOpenInWazeLive && (
                <button
                  type="button"
                  onClick={() => {
                    const target =
                      destCoords ||
                      selectedRoute.coordinates[selectedRoute.coordinates.length - 1];
                    onOpenInWazeLive(target, destText || selectedRoute.title || 'Destino');
                  }}
                  className="py-2.5 px-3 rounded-xl bg-cyan-950/70 hover:bg-cyan-900/70 border border-cyan-500/40 text-cyan-300 font-bold text-xs flex items-center justify-center gap-1.5 transition-all"
                >
                  <Navigation className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Ver no Waze ao Vivo</span>
                </button>
              )}

              <a
                href={`https://waze.com/ul?ll=${(destCoords || selectedRoute.coordinates[selectedRoute.coordinates.length - 1]).lat.toFixed(6)},${(destCoords || selectedRoute.coordinates[selectedRoute.coordinates.length - 1]).lng.toFixed(6)}&navigate=yes`}
                target="_blank"
                rel="noopener noreferrer"
                className="py-2.5 px-3 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-200 font-bold text-xs flex items-center justify-center gap-1.5 transition-all"
              >
                <ChevronRight className="w-3.5 h-3.5 text-cyan-400" />
                <span>Abrir Rota no App Waze</span>
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
