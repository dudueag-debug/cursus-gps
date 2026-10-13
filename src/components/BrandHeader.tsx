import React, { useState, useEffect } from 'react';
import {
  Bell,
  Menu,
  CloudRain,
  Camera,
  Navigation2,
  Mic,
  Clock,
  Route as RouteIcon,
  Download,
  Store,
  AlertTriangle,
} from 'lucide-react';
import type { UserProfile, WeatherData } from '../types';

interface BrandHeaderProps {
  user: UserProfile;
  activePanel: 'map' | 'places' | 'occurrences' | 'safety' | 'culture' | 'profile';
  setActivePanel: (panel: 'map' | 'places' | 'occurrences' | 'safety' | 'culture' | 'profile') => void;
  openSafetyModal: () => void;
  openInstallModal: () => void;
  openVoiceModal: () => void;
  openWeatherModal: () => void;
  openLocationModal?: () => void;
  openMenuDrawer?: () => void;
  openNotificationsModal?: () => void;
  onOpenRoutePlanner?: () => void;
  onOpenTrafficOccurrences?: () => void;
  onOpenRadars?: () => void;
  onOpenPhotoIncident?: () => void;
  activeOccurrencesCount: number;
  detectedLocation?: string;
  weatherData?: WeatherData | null;
  onRecenterGPS?: () => void;
  gpsAccuracy?: number | null;
}

export const BrandHeader: React.FC<BrandHeaderProps> = ({
  activePanel,
  setActivePanel,
  openInstallModal,
  openWeatherModal,
  openVoiceModal,
  openLocationModal,
  openMenuDrawer,
  openNotificationsModal,
  onOpenRoutePlanner,
  onOpenPhotoIncident,
  activeOccurrencesCount,
  detectedLocation = 'GPS ao vivo',
  weatherData,
  onRecenterGPS,
  gpsAccuracy,
}) => {
  const [now, setNow] = useState<Date>(() => new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setNow(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const isRaining = weatherData && (weatherData.isRaining || weatherData.rainProbability >= 40);
  const currentTemp = weatherData ? `${weatherData.currentTemp}°` : '26°';

  const hour = now.getHours();
  const isNightTime = hour >= 18 || hour < 6;
  const formattedTime = now.toLocaleTimeString('pt-BR', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
  const formattedDate = now.toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
  const weekdayRaw = now.toLocaleDateString('pt-BR', { weekday: 'long' });
  const formattedWeekday = weekdayRaw.charAt(0).toUpperCase() + weekdayRaw.slice(1);

  return (
    <header className="bg-slate-950/95 backdrop-blur-xl border-b border-slate-800/80 text-white px-2.5 sm:px-4 pt-2 pb-1.5 safe-top-header safe-x-pad shadow-2xl shadow-black/80 sticky top-0 z-[1000] transition-all flex flex-col gap-1.5">
      {/* Row 1: Logo, Live Clock/Date, and Quick Actions */}
      <div className="max-w-7xl w-full mx-auto flex items-center justify-between gap-2">
        {/* Left: Brand Logo + GPS Status Pill */}
        <div
          onClick={() => setActivePanel('map')}
          className="flex items-center gap-2 cursor-pointer group select-none shrink-0"
        >
          <div className="relative w-9 h-9 sm:w-10 sm:h-10 rounded-2xl bg-gradient-to-br from-blue-600 via-indigo-600 to-emerald-500 p-0.5 shadow-lg shadow-blue-500/20 group-hover:scale-105 transition-all">
            <div className="w-full h-full bg-slate-950 rounded-[14px] flex items-center justify-center relative overflow-hidden">
              <div className="absolute inset-0 bg-blue-500/10" />
              <div className="absolute w-1.5 h-6 bg-lime-400/90 rounded-full rotate-12 -left-1 opacity-90 shadow-[0_0_8px_rgba(204,255,0,0.8)]" />
              <Navigation2 className="w-4 h-4 sm:w-5 sm:h-5 text-lime-400 transform rotate-45 group-hover:rotate-90 transition-transform duration-300 drop-shadow-[0_0_8px_rgba(204,255,0,0.9)]" />
            </div>
          </div>

          <div className="flex flex-col text-left">
            <div className="flex items-center gap-1.5 leading-none">
              <span className="font-black text-sm sm:text-lg tracking-tight bg-gradient-to-r from-white via-slate-100 to-lime-300 bg-clip-text text-transparent">
                TÔ PASSANDO
              </span>
              <span className="text-[8.5px] sm:text-[9.5px] uppercase font-black tracking-wider px-1.5 py-0.2 rounded bg-blue-600/30 border border-blue-500/40 text-blue-300">
                RJ AO VIVO
              </span>
            </div>

            {/* Compact Live GPS Location Badge */}
            <div
              onClick={e => {
                e.stopPropagation();
                if (openLocationModal) openLocationModal();
                else if (onRecenterGPS) onRecenterGPS();
              }}
              className="flex items-center gap-1.5 text-[9.5px] sm:text-[10.5px] text-slate-300 hover:text-lime-300 transition-colors mt-0.5"
              title="Clique para calibrar ou buscar sua localização exata no GPS"
            >
              <span className="relative flex h-1.5 w-1.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-lime-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-lime-500"></span>
              </span>
              <span className="font-bold text-lime-400">
                {gpsAccuracy ? `GPS (±${gpsAccuracy}m)` : 'GPS'}
              </span>
              <span className="text-slate-600">•</span>
              <span className="font-medium text-slate-300 truncate max-w-[110px] sm:max-w-[180px]">
                {detectedLocation.replace('• GPS', '').replace('• GPS Ao Vivo', '')}
              </span>
            </div>
          </div>
        </div>

        {/* Live Date, Day & Time Pill (with Automatic Night Mode Indicator) */}
        <div
          className={`hidden md:flex items-center gap-2 px-3 py-1 rounded-xl border text-[11px] font-bold shadow-inner ${
            isNightTime
              ? 'bg-indigo-950/70 border-indigo-500/50 text-indigo-200'
              : 'bg-slate-900/90 border-slate-700/80 text-slate-200'
          }`}
          title={
            isNightTime
              ? 'Horário Noturno Ativo: Mapa em Modo Noturno com destaque de iluminação e sinalização'
              : 'Relógio e Calendário em Tempo Real Tô Passando'
          }
        >
          <Clock className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
          <span className="font-mono font-black text-white tracking-wider">{formattedTime}</span>
          <span className="text-slate-600">•</span>
          <span className="text-cyan-300">{formattedWeekday}</span>
          <span className="text-slate-400 font-mono">{formattedDate}</span>
          <span
            className={`px-1.5 py-0.2 rounded text-[9px] font-black uppercase ${
              isNightTime
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
            }`}
          >
            {isNightTime ? '🌙 Noturno Auto' : '☀️ Diurno'}
          </span>
        </div>

        {/* Right: Quick Action Buttons */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          {/* Direct PWA Download Button (iOS & Android) */}
          <button
            onClick={openInstallModal}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-gradient-to-r from-lime-400 to-emerald-400 hover:brightness-110 text-slate-950 text-xs font-black shadow-md shadow-lime-500/25 active:scale-95 transition-all"
            title="Baixar App no Telefone (PWA para iPhone/iOS e Android)"
          >
            <Download className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Baixar App (iOS/Android)</span>
            <span className="sm:hidden">Baixar App</span>
          </button>

          {/* Quick Camera / Mark Spot on Map Button */}
          {onOpenPhotoIncident && (
            <button
              onClick={onOpenPhotoIncident}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-rose-600/90 hover:bg-rose-500 text-white text-xs font-black shadow-md shadow-rose-600/30 border border-rose-400/50 active:scale-95 transition-all"
              title="Marcar Local de Roubo ou Problema na Via com Foto em Tempo Real"
            >
              <Camera className="w-3.5 h-3.5" />
              <span className="hidden lg:inline">Marcar + Foto</span>
            </button>
          )}

          {/* Compact Weather Pill */}
          <button
            onClick={openWeatherModal}
            className={`flex items-center gap-1 px-2 py-1.5 rounded-xl text-xs font-black transition-all active:scale-95 shadow-sm border ${
              isRaining
                ? 'bg-blue-950/60 border-blue-500/50 text-cyan-300 shadow-blue-500/20'
                : 'bg-slate-900/80 border-slate-750 text-slate-300 hover:bg-slate-850'
            }`}
            title="Previsão do Tempo e Alertas de Chuva"
          >
            <CloudRain className="w-3.5 h-3.5 text-cyan-400" />
            <span className="font-mono text-white text-xs">{currentTemp}</span>
          </button>

          {/* Voice Commander Quick Trigger */}
          <button
            onClick={openVoiceModal}
            className="p-2 rounded-xl bg-blue-600/20 hover:bg-blue-600/40 text-blue-300 border border-blue-500/30 active:scale-95 transition-all"
            title="Comando de Voz Inteligente"
          >
            <Mic className="w-4 h-4 text-lime-400 animate-pulse" />
          </button>

          {/* Notifications Button */}
          <button
            onClick={() => {
              if (openNotificationsModal) openNotificationsModal();
              else setActivePanel('occurrences');
            }}
            className="relative p-2 rounded-xl bg-slate-900/90 hover:bg-slate-800 text-slate-200 border border-slate-750 active:scale-95 transition-all"
            title="Alertas e Ocorrências na Via em Tempo Real"
          >
            <Bell className="w-4 h-4 text-slate-200" />
            {activeOccurrencesCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-red-600 text-white font-black text-[9px] w-4 h-4 rounded-full flex items-center justify-center border border-slate-950 shadow-md animate-pulse">
                {activeOccurrencesCount > 9 ? '9+' : activeOccurrencesCount}
              </span>
            )}
          </button>

          {/* Hamburger Menu Button */}
          <button
            onClick={() => {
              if (openMenuDrawer) openMenuDrawer();
              else setActivePanel('profile');
            }}
            className="p-2 rounded-xl bg-slate-900/90 hover:bg-slate-800 text-slate-200 border border-slate-750 active:scale-95 transition-all"
            title="Menu Principal e Perfil"
          >
            <Menu className="w-4 h-4 text-slate-200" />
          </button>
        </div>
      </div>

      {/* Row 2: Dedicated Navigation Tab Bar (Mapa Ao Vivo | Comércios Todo o RJ | Tempo Real | Baixar App PWA iOS & Android | Rotas) */}
      <div className="max-w-7xl w-full mx-auto flex items-center justify-between gap-1.5 overflow-x-auto no-scrollbar pt-1 border-t border-slate-800/70">
        <div className="flex items-center gap-1.5">
          {/* Tab 1: Mapa Ao Vivo */}
          <button
            onClick={() => setActivePanel('map')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[11px] font-black whitespace-nowrap transition-all border ${
              activePanel === 'map'
                ? 'bg-cyan-400 text-slate-950 border-cyan-300 shadow-md shadow-cyan-400/20'
                : 'bg-slate-900/90 hover:bg-slate-800 text-slate-200 border-slate-800'
            }`}
          >
            <Navigation2 className="w-3.5 h-3.5" />
            <span>Mapa Ao Vivo</span>
          </button>

          {/* Tab 2: Todos os Comércios do Rio de Janeiro (Todos os Bairros) */}
          <button
            onClick={() => setActivePanel('places')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[11px] font-black whitespace-nowrap transition-all border ${
              activePanel === 'places'
                ? 'bg-emerald-400 text-slate-950 border-emerald-300 shadow-md shadow-emerald-400/20'
                : 'bg-slate-900/90 hover:bg-slate-800 text-emerald-300 border-emerald-500/40'
            }`}
          >
            <Store className="w-3.5 h-3.5" />
            <span>🏪 Comércios Todo o RJ (Todos os Bairros)</span>
          </button>

          {/* Tab 3: Tudo que Acontece em Tempo Real */}
          <button
            onClick={() => setActivePanel('occurrences')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[11px] font-black whitespace-nowrap transition-all border ${
              activePanel === 'occurrences'
                ? 'bg-amber-400 text-slate-950 border-amber-300 shadow-md shadow-amber-400/20'
                : 'bg-slate-900/90 hover:bg-slate-800 text-amber-300 border-amber-500/40'
            }`}
          >
            <AlertTriangle className="w-3.5 h-3.5" />
            <span>🚨 Tudo em Tempo Real ({activeOccurrencesCount})</span>
          </button>

          {/* Tab 4: Dedicated Aba para Baixar o App no Telefone (PWA iOS e Android) */}
          <button
            onClick={openInstallModal}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[11px] font-black whitespace-nowrap transition-all bg-lime-400/15 hover:bg-lime-400/25 text-lime-300 border border-lime-400/50 shadow-sm"
          >
            <Download className="w-3.5 h-3.5 text-lime-400" />
            <span>📲 Baixar App no Telefone (PWA iOS & Android)</span>
          </button>

          {/* Tab 5: Traçar Rota */}
          <button
            onClick={onOpenRoutePlanner}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[11px] font-black whitespace-nowrap transition-all bg-blue-600/25 hover:bg-blue-600/40 text-blue-200 border border-blue-500/40"
          >
            <RouteIcon className="w-3.5 h-3.5 text-cyan-300" />
            <span>🛣️ Traçar Rota</span>
          </button>
        </div>

        {/* Compact Mobile Clock & Night Mode Pill */}
        <div className="flex md:hidden items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-900/90 border border-slate-800 text-[10px] font-mono text-slate-300 whitespace-nowrap shrink-0">
          <Clock className="w-3 h-3 text-cyan-400" />
          <span className="font-bold text-white">{formattedTime}</span>
          <span>•</span>
          <span className="text-cyan-300">{formattedDate}</span>
          <span>{isNightTime ? '🌙' : '☀️'}</span>
        </div>
      </div>
    </header>
  );
};
