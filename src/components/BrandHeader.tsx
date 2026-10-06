import React from 'react';
import { 
  Bell, 
  Menu, 
  CloudRain, 
  Car, 
  Camera, 
  Navigation2,
  MapPin,
  Mic
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
  onOpenTrafficOccurrences?: () => void;
  onOpenRadars?: () => void;
  activeOccurrencesCount: number;
  detectedLocation?: string;
  weatherData?: WeatherData | null;
  onRecenterGPS?: () => void;
  gpsAccuracy?: number | null;
}

export const BrandHeader: React.FC<BrandHeaderProps> = ({
  user,
  setActivePanel,
  openWeatherModal,
  openVoiceModal,
  openLocationModal,
  openMenuDrawer,
  openNotificationsModal,
  onOpenTrafficOccurrences,
  onOpenRadars,
  activeOccurrencesCount,
  detectedLocation = 'GPS ao vivo',
  weatherData,
  onRecenterGPS,
  gpsAccuracy,
}) => {
  const isRaining = weatherData && (weatherData.isRaining || weatherData.rainProbability >= 40);
  const currentTemp = weatherData ? `${weatherData.currentTemp}°` : '26°';

  return (
    <header className="bg-slate-950/95 backdrop-blur-xl border-b border-slate-800/80 text-white px-3 sm:px-4 py-2 safe-top-header safe-x-pad shadow-2xl shadow-black/80 sticky top-0 z-[1000] transition-all">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-2">
        {/* Left: Brand Logo + GPS Status Pill */}
        <div 
          onClick={() => setActivePanel('map')}
          className="flex items-center gap-2.5 cursor-pointer group select-none shrink-0"
        >
          {/* Logo Icon */}
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
                GPS
              </span>
            </div>

            {/* Compact Live GPS Location Badge */}
            <div 
              onClick={(e) => {
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

        {/* Center / Right: Compact Non-Intrusive Quick Badges (Weather & Voice) */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          {/* Compact Weather Pill */}
          <button
            onClick={openWeatherModal}
            className={`flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-black transition-all active:scale-95 shadow-sm border ${
              isRaining
                ? 'bg-blue-950/60 border-blue-500/50 text-cyan-300 shadow-blue-500/20'
                : 'bg-slate-900/80 border-slate-750 text-slate-300 hover:bg-slate-850'
            }`}
            title="Previsão do Tempo e Alertas de Chuva"
          >
            <CloudRain className="w-3.5 h-3.5 text-cyan-400" />
            <span className="font-mono text-white text-xs">{currentTemp}</span>
            {isRaining && <span className="hidden sm:inline text-[10px] text-cyan-300">Chuva</span>}
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
            title="Alertas e Ocorrências na Via"
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
    </header>
  );
};
