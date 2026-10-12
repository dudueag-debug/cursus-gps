import React, { useState } from 'react';
import { 
  Fuel, 
  Disc, 
  ShieldAlert, 
  HeartPulse, 
  Bus, 
  ShoppingCart, 
  CloudSun, 
  Radar, 
  AlertTriangle, 
  Navigation, 
  Route as RouteIcon, 
  Car, 
  Droplets, 
  Package, 
  AlertOctagon, 
  Flame, 
  Siren, 
  AlertCircle, 
  ChevronUp, 
  ChevronDown,
  Sparkles,
  Info,
  Search,
  CheckCircle2,
  Landmark
} from 'lucide-react';
import type { Occurrence, Coordinates, PlaceCategory, WeatherData, TransportMode, RouteOption } from '../../types';

interface ViaCardHUDProps {
  occurrences: Occurrence[];
  currentLocation: Coordinates;
  weatherData?: WeatherData | null;
  userPreferredMode?: TransportMode;
  selectedRoute?: RouteOption | null;
  onStartNavigation?: () => void;
  onSelectOccurrence: (occ: Occurrence) => void;
  onOpenReportModal?: () => void;
  onOpenQuickSignals?: () => void;
  onOpenSocorroModal?: () => void;
  onOpenWeatherModal?: () => void;
  onOpenRoutePlanner?: () => void;
  onOpenPlacesPanel?: () => void;
  onFindNearest?: (category: PlaceCategory) => void;
  onQuickReport?: (category: string, title: string) => void;
  onQuickDestination?: (type: 'home' | 'work' | 'saved') => void;
  onConfirmOccurrence?: (id: string) => void;
  onOpenOQueTemAqui?: () => void;
  onOpenConhecaEsteLugar?: () => void;
  onOpenAboutApp?: () => void;
  onOpenBrazilTouristMap?: () => void;
}

export const ViaCardHUD: React.FC<ViaCardHUDProps> = ({
  occurrences,
  currentLocation,
  weatherData,
  selectedRoute,
  onStartNavigation,
  onOpenQuickSignals,
  onOpenWeatherModal,
  onOpenRoutePlanner,
  onFindNearest,
  onQuickReport,
  onOpenOQueTemAqui,
  onOpenConhecaEsteLugar,
  onOpenAboutApp,
  onOpenBrazilTouristMap,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [reportSuccessToast, setReportSuccessToast] = useState<string | null>(null);

  // Dynamic ETA calculations
  const totalMinutes = selectedRoute 
    ? Math.round(selectedRoute.totalDurationSeconds / 60) 
    : 12;
  const distanceKm = selectedRoute 
    ? (selectedRoute.totalDistanceMeters / 1000).toFixed(1) 
    : '4,8';
  
  const arrivalDate = new Date(Date.now() + totalMinutes * 60 * 1000);
  const etaTime = arrivalDate.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });

  // Quick report handler
  const handleQuickReportClick = (category: string, label: string) => {
    if (onQuickReport) {
      onQuickReport(category, `Alerta de ${label} reportado pelo condutor`);
    } else if (onOpenQuickSignals) {
      onOpenQuickSignals();
    }

    setReportSuccessToast(`✓ ${label} registrado no mapa!`);
    setTimeout(() => setReportSuccessToast(null), 2500);
  };

  // The 12 Signal Categories defined in Section 9
  const valberSignals = [
    { category: 'engarrafamento', label: 'Engarrafamento', icon: <Car className="w-3.5 h-3.5" />, color: 'bg-amber-500/20 text-amber-400 border-amber-500/30' },
    { category: 'alagamento', label: 'Alagamento', icon: <Droplets className="w-3.5 h-3.5" />, color: 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30' },
    { category: 'buraco', label: 'Buraco na Via', icon: <AlertTriangle className="w-3.5 h-3.5" />, color: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30' },
    { category: 'objeto_via', label: 'Objeto na Pista', icon: <Package className="w-3.5 h-3.5" />, color: 'bg-orange-500/20 text-orange-400 border-orange-500/30' },
    { category: 'veiculo_parado', label: 'Veículo Parado', icon: <AlertOctagon className="w-3.5 h-3.5" />, color: 'bg-amber-500/20 text-amber-300 border-amber-500/30' },
    { category: 'acidente', label: 'Acidente', icon: <Flame className="w-3.5 h-3.5" />, color: 'bg-red-500/20 text-red-400 border-red-500/30' },
    { category: 'blitz', label: 'Blitz Policial', icon: <Siren className="w-3.5 h-3.5" />, color: 'bg-blue-500/20 text-blue-400 border-blue-500/30' },
    { category: 'via_parcialmente_interditada', label: 'Via Parcial Fechada', icon: <AlertCircle className="w-3.5 h-3.5" />, color: 'bg-amber-500/20 text-amber-400 border-amber-500/30' },
    { category: 'via_interditada', label: 'Via Interditada', icon: <AlertCircle className="w-3.5 h-3.5" />, color: 'bg-red-500/20 text-red-400 border-red-500/30' },
    { category: 'acesso_fechado', label: 'Acesso Fechado', icon: <RouteIcon className="w-3.5 h-3.5" />, color: 'bg-rose-500/20 text-rose-400 border-rose-500/30' },
    { category: 'ponto_roubo', label: 'Ponto de Roubos', icon: <ShieldAlert className="w-3.5 h-3.5" />, color: 'bg-purple-500/20 text-purple-400 border-purple-500/30' },
    { category: 'local_perigoso', label: 'Local Perigoso', icon: <Sparkles className="w-3.5 h-3.5" />, color: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30' },
  ];

  return (
    <div className="absolute bottom-3 left-1/2 -translate-x-1/2 w-[calc(100%-1rem)] sm:w-[480px] max-w-lg z-30 select-none pointer-events-auto pb-[env(safe-area-inset-bottom)]">
      <div className="bg-slate-950/90 backdrop-blur-xl border border-slate-800/80 rounded-2xl sm:rounded-3xl shadow-2xl overflow-hidden transition-all duration-300 flex flex-col shadow-black/90">
        
        {/* Toast Feedback */}
        {reportSuccessToast && (
          <div className="mx-3 mt-2 p-1.5 rounded-xl bg-cyan-400 text-slate-950 font-bold text-xs text-center animate-fade-in shadow-md">
            {reportSuccessToast}
          </div>
        )}

        {/* ULTRA-COMPACT SLIM FLOATING HUD BAR (Single row, takes minimal space) */}
        <div className="px-3 py-2 flex items-center justify-between gap-2">
          
          {/* Left: Quick Destination / ETA info (ALWAYS opens RoutePlanner on click) */}
          <div 
            onClick={onOpenRoutePlanner}
            className="flex items-center gap-2 cursor-pointer group shrink min-w-0"
            title="Clique para abrir e calcular rotas"
          >
            {selectedRoute ? (
              <div className="flex flex-col text-left leading-tight truncate">
                <div className="flex items-center gap-1.5">
                  <span className="text-white font-extrabold text-sm sm:text-base tracking-tight group-hover:text-cyan-400 transition-colors">
                    {totalMinutes} min
                  </span>
                  <span className="text-[10px] font-semibold text-slate-400">
                    ({distanceKm} km)
                  </span>
                </div>
                <div className="text-[10px] text-cyan-300 font-medium flex items-center gap-1 truncate">
                  <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
                  <span className="truncate">{selectedRoute.title || `Chegada às ${etaTime}`}</span>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-slate-900/90 border border-slate-800 hover:border-cyan-500/50 transition-all text-slate-300">
                <Search className="w-3.5 h-3.5 text-cyan-400" />
                <span className="text-xs font-semibold text-slate-200 truncate">Para onde vamos?</span>
              </div>
            )}
          </div>

          {/* Center: 5 Discrete 1-Tap Micro Action Buttons */}
          <div className="flex items-center gap-1 sm:gap-1.5 shrink-0">
            {/* 1. Postos */}
            <button
              onClick={() => onFindNearest?.('posto_gnv')}
              className="w-8 h-8 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/25 flex items-center justify-center text-amber-400 active:scale-90 transition-all"
              title="Posto de Combustível / GNV Mais Próximo"
            >
              <Fuel className="w-3.5 h-3.5" />
            </button>

            {/* 2. Borracheiro */}
            <button
              onClick={() => onFindNearest?.('borracheiro')}
              className="w-8 h-8 rounded-xl bg-orange-500/10 hover:bg-orange-500/20 border border-orange-500/25 flex items-center justify-center text-orange-400 active:scale-90 transition-all"
              title="Borracheiro Mais Próximo"
            >
              <Disc className="w-3.5 h-3.5" />
            </button>

            {/* 3. Polícia */}
            <button
              onClick={() => onFindNearest?.('policia')}
              className="w-8 h-8 rounded-xl bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500/25 flex items-center justify-center text-blue-400 active:scale-90 transition-all"
              title="Polícia / DPO Mais Próximo"
            >
              <ShieldAlert className="w-3.5 h-3.5" />
            </button>

            {/* 4. Saúde */}
            <button
              onClick={() => onFindNearest?.('saude')}
              className="w-8 h-8 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/25 flex items-center justify-center text-emerald-400 active:scale-90 transition-all"
              title="UPA / Hospital Mais Próximo"
            >
              <HeartPulse className="w-3.5 h-3.5" />
            </button>

            {/* 5. Sinalizar */}
            <button
              onClick={onOpenQuickSignals}
              className="w-8 h-8 rounded-xl bg-red-600/20 hover:bg-red-600/40 border border-red-500/40 flex items-center justify-center text-red-400 active:scale-90 transition-all"
              title="Sinalizar Alerta na Via"
            >
              <AlertTriangle className="w-3.5 h-3.5 text-red-400" />
            </button>
          </div>

          {/* Right: Actions for Routes & Navigation */}
          <div className="flex items-center gap-1.5 shrink-0">
            {/* Always accessible Route Planner button */}
            <button
              onClick={onOpenRoutePlanner}
              className="px-2.5 py-1.5 sm:py-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-cyan-500/40 text-cyan-300 text-xs font-bold active:scale-95 transition-all flex items-center gap-1 shadow-sm"
              title="Abrir Planejador de Rotas e Destino"
            >
              <RouteIcon className="w-3.5 h-3.5 text-cyan-400" />
              <span>Rotas</span>
            </button>

            {/* Start Navigation if Route Selected */}
            {selectedRoute && (
              <button
                onClick={onStartNavigation}
                className="px-3 sm:px-3.5 py-1.5 sm:py-2 rounded-xl bg-gradient-to-r from-lime-400 to-emerald-500 hover:brightness-110 text-slate-950 text-xs font-black active:scale-95 transition-all shadow-md shadow-lime-500/20 flex items-center gap-1"
                title="Iniciar Navegação GPS em Tempo Real"
              >
                <Navigation className="w-3.5 h-3.5 fill-slate-950" />
                <span>Navegar</span>
              </button>
            )}

            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="p-1.5 rounded-xl bg-slate-900/80 hover:bg-slate-800 text-slate-400 hover:text-cyan-400 transition-colors"
              title={isExpanded ? 'Recolher Painel' : 'Ver Mais Opções e Alertas'}
            >
              {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
            </button>
          </div>

        </div>

        {/* EXPANDABLE SECONDARY DRAWER (Only visible when user explicitly expands) */}
        {isExpanded && (
          <div className="flex flex-col p-3 gap-3 max-h-[42vh] overflow-y-auto border-t border-slate-800/80 bg-slate-950/98 animate-in fade-in duration-200 scrollbar-thin">
            
            {/* Quick Discover Shortcuts */}
            <div className="grid grid-cols-3 sm:grid-cols-6 gap-1.5 text-center">
              <button
                onClick={() => { onOpenBrazilTouristMap?.(); setIsExpanded(false); }}
                className="p-2 rounded-xl bg-gradient-to-tr from-amber-950/40 to-slate-900 hover:bg-slate-850 border border-amber-500/30 flex flex-col items-center justify-center active:scale-95 transition-all text-amber-300 col-span-3 sm:col-span-2"
              >
                <Landmark className="w-4 h-4 text-amber-400 mb-0.5" />
                <span className="text-[10px] font-bold">🗺️ Mercados & Turismo (Clean)</span>
              </button>

              <button
                onClick={() => { onOpenOQueTemAqui?.(); setIsExpanded(false); }}
                className="p-2 rounded-xl bg-slate-900 hover:bg-slate-850 border border-slate-800 flex flex-col items-center justify-center active:scale-95 transition-all text-cyan-300"
              >
                <Radar className="w-4 h-4 text-cyan-400 mb-0.5" />
                <span className="text-[9px] font-medium">O Que Tem</span>
              </button>

              <button
                onClick={() => { onOpenWeatherModal?.(); setIsExpanded(false); }}
                className="p-2 rounded-xl bg-slate-900 hover:bg-slate-850 border border-slate-800 flex flex-col items-center justify-center active:scale-95 transition-all text-amber-300"
              >
                <CloudSun className="w-4 h-4 text-amber-400 mb-0.5" />
                <span className="text-[9px] font-medium">Clima</span>
              </button>

              <button
                onClick={() => { onFindNearest?.('mercado'); setIsExpanded(false); }}
                className="p-2 rounded-xl bg-slate-900 hover:bg-slate-850 border border-slate-800 flex flex-col items-center justify-center active:scale-95 transition-all text-purple-300"
              >
                <ShoppingCart className="w-4 h-4 text-purple-400 mb-0.5" />
                <span className="text-[9px] font-medium">Mercado</span>
              </button>

              <button
                onClick={() => { onOpenConhecaEsteLugar?.(); setIsExpanded(false); }}
                className="p-2 rounded-xl bg-slate-900 hover:bg-slate-850 border border-slate-800 flex flex-col items-center justify-center active:scale-95 transition-all text-yellow-300"
              >
                <Sparkles className="w-4 h-4 text-yellow-400 mb-0.5" />
                <span className="text-[9px] font-medium">História</span>
              </button>
            </div>

            {/* 12 Quick Signal Chips */}
            <div>
              <div className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-2 flex items-center justify-between">
                <span>Sinalizar Ocorrência Rápida</span>
                <button
                  onClick={() => { onOpenQuickSignals?.(); setIsExpanded(false); }}
                  className="text-cyan-400 hover:underline text-[10px] font-bold"
                >
                  Grade Completa ➔
                </button>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
                {valberSignals.map((sig) => (
                  <button
                    key={sig.category}
                    onClick={() => handleQuickReportClick(sig.category, sig.label)}
                    className={`p-1.5 rounded-xl border flex items-center gap-1.5 text-left active:scale-95 transition-all text-[10px] font-medium ${sig.color}`}
                  >
                    <span>{sig.icon}</span>
                    <span className="truncate">{sig.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Footer */}
            <div className="pt-2 border-t border-slate-800 flex items-center justify-between text-[10px] text-slate-400">
              <span>TÔ PASSANDO • GPS INTELIGENTE 4.0</span>
              <button
                onClick={() => { onOpenAboutApp?.(); setIsExpanded(false); }}
                className="text-cyan-400 hover:text-cyan-300 font-medium flex items-center gap-1"
              >
                <Info className="w-3 h-3" />
                <span>Sobre o App</span>
              </button>
            </div>

          </div>
        )}

      </div>
    </div>
  );
};
