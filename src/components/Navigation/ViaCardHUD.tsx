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
  Info
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
    <div className="absolute bottom-2 left-1/2 -translate-x-1/2 w-[calc(100%-1rem)] sm:w-[500px] max-w-lg z-30 select-none pointer-events-auto pb-[env(safe-area-inset-bottom)]">
      <div className="bg-slate-950/90 backdrop-blur-2xl border border-slate-800/80 rounded-3xl shadow-2xl overflow-hidden transition-all duration-300 flex flex-col shadow-black/80">
        
        {/* Toast Feedback */}
        {reportSuccessToast && (
          <div className="mx-3 mt-2 p-2 rounded-xl bg-cyan-400 text-slate-950 font-bold text-xs text-center animate-fade-in shadow-md">
            {reportSuccessToast}
          </div>
        )}

        {/* COMPACT & SLEEK MAIN BAR */}
        <div className="px-4 py-2.5 flex items-center justify-between gap-3">
          {/* Left: ETA & Live Status */}
          <div 
            onClick={() => setIsExpanded(!isExpanded)}
            className="flex flex-col text-left cursor-pointer group"
          >
            <div className="flex items-center gap-2">
              <span className="text-white font-extrabold text-xl sm:text-2xl tracking-tight group-hover:text-cyan-400 transition-colors">
                {totalMinutes} min
              </span>
              <span className="text-[10px] font-semibold text-slate-400">
                • {distanceKm} km
              </span>
            </div>
            <div className="text-[11px] font-medium text-slate-400 flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span>Chegada às {etaTime}</span>
            </div>
          </div>

          {/* Right: Actions (Rotas & Navegar) */}
          <div className="flex items-center gap-2">
            <button
              onClick={onOpenRoutePlanner}
              className="px-3 py-2 rounded-2xl bg-slate-900/90 hover:bg-slate-800 border border-slate-700/80 text-slate-200 text-xs font-semibold active:scale-95 transition-all shadow-sm flex items-center gap-1.5"
              title="Buscar ou Traçar Rota"
            >
              <RouteIcon className="w-3.5 h-3.5 text-cyan-400" />
              <span>Rotas</span>
            </button>

            <button
              onClick={onStartNavigation}
              className="px-4 py-2 rounded-2xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:brightness-110 text-white text-xs font-bold active:scale-95 transition-all shadow-lg shadow-cyan-500/25 flex items-center gap-1.5"
              title="Iniciar Navegação com GPS"
            >
              <Navigation className="w-3.5 h-3.5 fill-white" />
              <span>Navegar</span>
            </button>
          </div>
        </div>

        {/* 5 CLEAN 1-TAP ESSENTIAL SHORTCUTS */}
        <div className="px-3 py-2 grid grid-cols-5 gap-1.5 border-t border-slate-800/60 bg-slate-900/30">
          {/* 1. Posto/GNV */}
          <button
            onClick={() => onFindNearest?.('posto_gnv')}
            className="py-1.5 px-1 rounded-2xl hover:bg-slate-850 active:scale-95 transition-all flex flex-col items-center justify-center text-center group"
            title="Posto de Gasolina e GNV"
          >
            <div className="w-8 h-8 rounded-xl bg-amber-500/15 border border-amber-500/25 flex items-center justify-center text-amber-400 mb-1 group-hover:scale-105 transition-transform">
              <Fuel className="w-4 h-4" />
            </div>
            <span className="text-[10px] font-medium text-slate-300 truncate max-w-full">Postos</span>
          </button>

          {/* 2. Borracheiro */}
          <button
            onClick={() => onFindNearest?.('borracheiro')}
            className="py-1.5 px-1 rounded-2xl hover:bg-slate-850 active:scale-95 transition-all flex flex-col items-center justify-center text-center group"
            title="Borracheiro 24h"
          >
            <div className="w-8 h-8 rounded-xl bg-orange-500/15 border border-orange-500/25 flex items-center justify-center text-orange-400 mb-1 group-hover:scale-105 transition-transform">
              <Disc className="w-4 h-4" />
            </div>
            <span className="text-[10px] font-medium text-slate-300 truncate max-w-full">Borracheiro</span>
          </button>

          {/* 3. Polícia */}
          <button
            onClick={() => onFindNearest?.('policia')}
            className="py-1.5 px-1 rounded-2xl hover:bg-slate-850 active:scale-95 transition-all flex flex-col items-center justify-center text-center group"
            title="Polícia e DPO"
          >
            <div className="w-8 h-8 rounded-xl bg-blue-500/15 border border-blue-500/25 flex items-center justify-center text-blue-400 mb-1 group-hover:scale-105 transition-transform">
              <ShieldAlert className="w-4 h-4" />
            </div>
            <span className="text-[10px] font-medium text-slate-300 truncate max-w-full">Polícia</span>
          </button>

          {/* 4. Saúde */}
          <button
            onClick={() => onFindNearest?.('saude')}
            className="py-1.5 px-1 rounded-2xl hover:bg-slate-850 active:scale-95 transition-all flex flex-col items-center justify-center text-center group"
            title="UPA e Hospital"
          >
            <div className="w-8 h-8 rounded-xl bg-emerald-500/15 border border-emerald-500/25 flex items-center justify-center text-emerald-400 mb-1 group-hover:scale-105 transition-transform">
              <HeartPulse className="w-4 h-4" />
            </div>
            <span className="text-[10px] font-medium text-slate-300 truncate max-w-full">Saúde</span>
          </button>

          {/* 5. SINALIZAR */}
          <button
            onClick={onOpenQuickSignals}
            className="py-1.5 px-1 rounded-2xl hover:bg-red-950/30 active:scale-95 transition-all flex flex-col items-center justify-center text-center group"
            title="Sinalizar Ocorrência na Via"
          >
            <div className="w-8 h-8 rounded-xl bg-red-600/90 border border-red-500/40 flex items-center justify-center text-white mb-1 group-hover:scale-105 transition-transform shadow-md shadow-red-600/30 animate-pulse">
              <AlertTriangle className="w-4 h-4" />
            </div>
            <span className="text-[10px] font-bold text-red-400 truncate max-w-full">Sinalizar</span>
          </button>
        </div>

        {/* EXPAND TOGGLE FOOTER */}
        <div 
          onClick={() => setIsExpanded(!isExpanded)}
          className="w-full py-1 px-4 bg-slate-950/60 border-t border-slate-800/60 flex items-center justify-between cursor-pointer hover:bg-slate-900/60 transition-colors text-[10px] text-slate-400"
        >
          <div className="flex items-center gap-1.5">
            <span className="text-cyan-400">⚡</span>
            <span>{isExpanded ? 'Recolher Atalhos' : 'O que tem aqui, Clima, Transporte e Alertas'}</span>
          </div>
          <span className="flex items-center gap-0.5 text-cyan-400 font-semibold">
            {isExpanded ? (
              <><span>Fechar</span><ChevronDown className="w-3.5 h-3.5" /></>
            ) : (
              <><span>Mais</span><ChevronUp className="w-3.5 h-3.5" /></>
            )}
          </span>
        </div>

        {/* EXPANDABLE SECONDARY DRAWER */}
        {isExpanded && (
          <div className="flex flex-col p-3 gap-3 max-h-[46vh] overflow-y-auto border-t border-slate-800/80 bg-slate-950/95 animate-in fade-in duration-200 scrollbar-thin">
            
            {/* Quick Discover Shortcuts */}
            <div className="grid grid-cols-5 gap-1.5 text-center">
              <button
                onClick={onOpenOQueTemAqui}
                className="p-2 rounded-xl bg-slate-900 hover:bg-slate-850 border border-slate-800 flex flex-col items-center justify-center active:scale-95 transition-all text-cyan-300"
              >
                <Radar className="w-4 h-4 text-cyan-400 mb-0.5 animate-spin-slow" />
                <span className="text-[9px] font-medium">O Que Tem</span>
              </button>

              <button
                onClick={onOpenWeatherModal}
                className="p-2 rounded-xl bg-slate-900 hover:bg-slate-850 border border-slate-800 flex flex-col items-center justify-center active:scale-95 transition-all text-amber-300"
              >
                <CloudSun className="w-4 h-4 text-amber-400 mb-0.5" />
                <span className="text-[9px] font-medium">Clima</span>
              </button>

              <button
                onClick={() => onFindNearest?.('transporte_infraestrutura')}
                className="p-2 rounded-xl bg-slate-900 hover:bg-slate-850 border border-slate-800 flex flex-col items-center justify-center active:scale-95 transition-all text-sky-300"
              >
                <Bus className="w-4 h-4 text-sky-400 mb-0.5" />
                <span className="text-[9px] font-medium">Transporte</span>
              </button>

              <button
                onClick={() => onFindNearest?.('mercado')}
                className="p-2 rounded-xl bg-slate-900 hover:bg-slate-850 border border-slate-800 flex flex-col items-center justify-center active:scale-95 transition-all text-purple-300"
              >
                <ShoppingCart className="w-4 h-4 text-purple-400 mb-0.5" />
                <span className="text-[9px] font-medium">Mercado</span>
              </button>

              <button
                onClick={onOpenConhecaEsteLugar}
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
                  onClick={onOpenQuickSignals}
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
                    className={`p-2 rounded-xl border flex items-center gap-2 text-left active:scale-95 transition-all text-[10.5px] font-medium ${sig.color}`}
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
                onClick={onOpenAboutApp}
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
