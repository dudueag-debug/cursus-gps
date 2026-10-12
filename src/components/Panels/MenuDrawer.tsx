import React from 'react';
import { 
  X, 
  User, 
  ShieldCheck, 
  BookOpen, 
  Mic, 
  Download, 
  MapPin, 
  Settings, 
  Building2,
  AlertTriangle,
  Car,
  Bike,
  Radar,
  Info,
  CloudSun,
  Flame,
  Activity,
  Landmark,
  Route as RouteIcon
} from 'lucide-react';
import type { UserProfile } from '../../types';

interface MenuDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  user: UserProfile;
  onOpenRoutePlanner?: () => void;
  onOpenProfile: () => void;
  onOpenSafety: () => void;
  onOpenCulture: () => void;
  onOpenVoice: () => void;
  onOpenInstall: () => void;
  onOpenPlaces: () => void;
  onOpenOccurrences: () => void;
  onOpenLocationModal: () => void;
  onToggleTransportMode: () => void;
  onOpenOQueTemAqui?: () => void;
  onOpenConhecaEsteLugar?: () => void;
  onOpenAboutApp?: () => void;
  onOpenWeather?: () => void;
  onOpenVehicleModal?: () => void;
  onOpenPhotoIncident?: () => void;
  onOpenFutureTech?: () => void;
  onOpenLayersModal?: () => void;
  onOpenOfflineRegions?: () => void;
  onOpenObservability?: () => void;
  onOpenBrazilTouristMap?: () => void;
  onOpenWazeLive?: () => void;
}

export const MenuDrawer: React.FC<MenuDrawerProps> = ({
  isOpen,
  onClose,
  user,
  onOpenRoutePlanner,
  onOpenProfile,
  onOpenSafety,
  onOpenCulture,
  onOpenVoice,
  onOpenInstall,
  onOpenPlaces,
  onOpenOccurrences,
  onOpenLocationModal,
  onToggleTransportMode,
  onOpenOQueTemAqui,
  onOpenConhecaEsteLugar,
  onOpenAboutApp,
  onOpenWeather,
  onOpenVehicleModal,
  onOpenPhotoIncident,
  onOpenFutureTech,
  onOpenLayersModal,
  onOpenOfflineRegions,
  onOpenObservability,
  onOpenBrazilTouristMap,
  onOpenWazeLive,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[3000] flex justify-end bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div 
        className="w-full max-w-xs sm:max-w-sm h-full bg-slate-950 border-l border-slate-800 p-4 sm:p-5 flex flex-col justify-between shadow-2xl overflow-y-auto animate-in slide-in-from-right duration-300 safe-top-header safe-bottom-hud"
      >
        {/* Top Header */}
        <div>
          <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-cyan-600 flex items-center justify-center text-white font-black text-sm shadow-md">
                4.0
              </div>
              <div>
                <h3 className="font-black text-sm text-white">GPS INTELIGENTE 4.0</h3>
                <p className="text-[10px] text-cyan-300">TÔ PASSANDO • Plataforma Viva</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white transition-all active:scale-95"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* User Profile Card */}
          <div 
            onClick={() => { onOpenProfile(); onClose(); }}
            className="p-3 rounded-2xl bg-gradient-to-r from-cyan-950/60 to-slate-900 border border-cyan-600/30 mb-4 flex items-center justify-between cursor-pointer hover:border-cyan-500 transition-all shadow-md group"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-400 to-blue-500 flex items-center justify-center text-slate-950 font-black text-base shadow-md">
                {user.name.charAt(0).toUpperCase()}
              </div>
              <div>
                <h4 className="font-bold text-xs text-white group-hover:text-cyan-300 transition-colors">{user.name}</h4>
                <p className="text-[10px] text-slate-400">
                  Modo: <b className="text-cyan-300 uppercase">{user.preferredMode === 'motorcycle' ? 'Motociclista' : 'Carro'}</b>
                </p>
              </div>
            </div>
            <Settings className="w-4 h-4 text-slate-400 group-hover:text-white transition-colors" />
          </div>

          {/* Switch Vehicle Mode Quick Toggle */}
          <button
            onClick={onToggleTransportMode}
            className="w-full p-2.5 rounded-2xl bg-slate-900 hover:bg-slate-850 border border-slate-800 flex items-center justify-between text-xs font-bold text-slate-200 mb-3 active:scale-98 transition-all"
          >
            <span className="flex items-center gap-2">
              {user.preferredMode === 'motorcycle' ? <Bike className="w-4 h-4 text-lime-400" /> : <Car className="w-4 h-4 text-cyan-400" />}
              <span>Alternar para {user.preferredMode === 'motorcycle' ? 'Modo Carro' : 'Modo Moto'}</span>
            </span>
            <span className="px-2 py-0.5 rounded-md bg-cyan-600/20 text-cyan-300 text-[10px]">Trocar</span>
          </button>

          {/* Menu Items List */}
          <div className="space-y-1.5 text-xs font-semibold text-slate-300">
            {/* Tô Passando Nesse Momento Dedicated View */}
            <button
              onClick={() => { onOpenWazeLive?.(); onClose(); }}
              className="w-full p-2.5 rounded-xl hover:bg-cyan-950/60 flex items-center gap-3 text-left transition-colors text-cyan-300 font-bold bg-gradient-to-r from-cyan-950/80 via-blue-950/40 to-slate-900 border border-cyan-400/50 shadow-sm"
            >
              <RouteIcon className="w-4 h-4 text-cyan-400" />
              <span>🧭 Tô Passando Nesse Momento (Trânsito Ao Vivo)</span>
            </button>

            {/* Planejador de Rotas Principal */}
            <button
              onClick={() => { onOpenRoutePlanner?.(); onClose(); }}
              className="w-full p-2.5 rounded-xl hover:bg-blue-900/40 flex items-center gap-3 text-left transition-colors text-cyan-300 font-bold bg-gradient-to-r from-blue-950/60 via-slate-900 to-slate-900 border border-cyan-500/40 shadow-sm"
            >
              <RouteIcon className="w-4 h-4 text-cyan-400" />
              <span>🛣️ Traçar Rota & Destino (3 Modos)</span>
            </button>

            {/* Mercados & Pontos Turísticos do Brasil (Google Maps Clean) */}
            <button
              onClick={() => { onOpenBrazilTouristMap?.(); onClose(); }}
              className="w-full p-2.5 rounded-xl hover:bg-amber-950/40 flex items-center gap-3 text-left transition-colors text-amber-300 font-bold bg-gradient-to-r from-amber-950/40 via-amber-900/20 to-slate-900 border border-amber-500/40 shadow-sm"
            >
              <Landmark className="w-4 h-4 text-amber-400" />
              <span>🗺️ Mercados & Pontos Turísticos (Clean)</span>
            </button>
            {/* 1. O Que Tem Aqui? (Varredura 500m / 2km) */}
            <button
              onClick={() => { onOpenOQueTemAqui?.(); onClose(); }}
              className="w-full p-2.5 rounded-xl hover:bg-slate-900 flex items-center gap-3 text-left transition-colors text-cyan-300 font-bold bg-cyan-950/20 border border-cyan-500/20"
            >
              <Radar className="w-4 h-4 text-cyan-400" />
              <span>🔎 O Que Tem Aqui? (500m / 2km)</span>
            </button>

            {/* 2. Conheça Este Lugar (História e Patrimônio) */}
            <button
              onClick={() => { onOpenConhecaEsteLugar?.(); onClose(); }}
              className="w-full p-2.5 rounded-xl hover:bg-slate-900 flex items-center gap-3 text-left transition-colors text-amber-300 font-bold bg-amber-950/20 border border-amber-500/20"
            >
              <BookOpen className="w-4 h-4 text-amber-400" />
              <span>🏛️ Conheça Este Lugar (História)</span>
            </button>

            {/* 3. Clima & Condições de Pista */}
            <button
              onClick={() => { onOpenWeather?.(); onClose(); }}
              className="w-full p-2.5 rounded-xl hover:bg-slate-900 flex items-center gap-3 text-left transition-colors"
            >
              <CloudSun className="w-4 h-4 text-sky-400" />
              <span>☁️ Clima em Tempo Real & Pista</span>
            </button>

            {/* 4. Calibrar Localização & GPS */}
            <button
              onClick={() => { onOpenLocationModal(); onClose(); }}
              className="w-full p-2.5 rounded-xl hover:bg-slate-900 flex items-center gap-3 text-left transition-colors"
            >
              <MapPin className="w-4 h-4 text-emerald-400" />
              <span>Calibrar GPS & Localização</span>
            </button>

            {/* 5. Checklist de Partida Segura */}
            <button
              onClick={() => { onOpenSafety(); onClose(); }}
              className="w-full p-2.5 rounded-xl hover:bg-slate-900 flex items-center gap-3 text-left transition-colors"
            >
              <ShieldCheck className="w-4 h-4 text-lime-400" />
              <span>Checklist de Partida Segura</span>
            </button>

            {/* 6. Central de Locais & Serviços */}
            <button
              onClick={() => { onOpenPlaces(); onClose(); }}
              className="w-full p-2.5 rounded-xl hover:bg-slate-900 flex items-center gap-3 text-left transition-colors"
            >
              <Building2 className="w-4 h-4 text-cyan-400" />
              <span>Central de Locais & Serviços</span>
            </button>

            {/* 7. Alertas & Acontecendo na Via */}
            <button
              onClick={() => { onOpenOccurrences(); onClose(); }}
              className="w-full p-2.5 rounded-xl hover:bg-slate-900 flex items-center gap-3 text-left transition-colors"
            >
              <AlertTriangle className="w-4 h-4 text-amber-400" />
              <span>Alertas & Acontecendo na Via</span>
            </button>

            {/* Cursus Vehicle Profile */}
            <button
              onClick={() => { onOpenVehicleModal?.(); onClose(); }}
              className="w-full p-2.5 rounded-xl hover:bg-slate-900 flex items-center gap-3 text-left transition-colors text-amber-400 font-bold bg-amber-950/20 border border-amber-500/20"
            >
              <Car className="w-4 h-4 text-amber-400" />
              <span>🚗 CURSUS VEHICLE & Combustível</span>
            </button>

            {/* IA de Ocorrências com Foto */}
            <button
              onClick={() => { onOpenPhotoIncident?.(); onClose(); }}
              className="w-full p-2.5 rounded-xl hover:bg-slate-900 flex items-center gap-3 text-left transition-colors text-purple-300 font-bold bg-purple-950/20 border border-purple-500/20"
            >
              <AlertTriangle className="w-4 h-4 text-purple-400" />
              <span>📸 IA de Ocorrências com Foto</span>
            </button>

            {/* Laboratório Tecnológico (AR, Dashcam, Mecânica 4.0) */}
            <button
              onClick={() => { onOpenFutureTech?.(); onClose(); }}
              className="w-full p-2.5 rounded-xl hover:bg-slate-900 flex items-center gap-3 text-left transition-colors text-cyan-300 font-bold bg-cyan-950/20 border border-cyan-500/20"
            >
              <Radar className="w-4 h-4 text-cyan-400" />
              <span>🧪 Lab Tecnológico (AR & Mecânica 4.0)</span>
            </button>

            {/* 8. Comando por Voz */}
            <button
              onClick={() => { onOpenVoice(); onClose(); }}
              className="w-full p-2.5 rounded-xl hover:bg-slate-900 flex items-center gap-3 text-left transition-colors"
            >
              <Mic className="w-4 h-4 text-purple-400" />
              <span>Navegação & Comando de Voz</span>
            </button>

            {/* Camadas do Mapa */}
            <button
              onClick={() => { onOpenLayersModal?.(); onClose(); }}
              className="w-full p-2.5 rounded-xl hover:bg-slate-900 flex items-center gap-3 text-left transition-colors text-sky-300 font-bold bg-sky-950/20 border border-sky-500/20"
            >
              <Radar className="w-4 h-4 text-sky-400" />
              <span>🗺️ Camadas do Mapa (14 Camadas)</span>
            </button>

            {/* Mapas Offline & Download Regional */}
            <button
              onClick={() => { onOpenOfflineRegions?.(); onClose(); }}
              className="w-full p-2.5 rounded-xl hover:bg-slate-900 flex items-center gap-3 text-left transition-colors text-teal-300 font-bold bg-teal-950/20 border border-teal-500/20"
            >
              <Download className="w-4 h-4 text-teal-400" />
              <span>💾 Mapas Offline & Download Regional</span>
            </button>

            {/* Painel de Observabilidade */}
            <button
              onClick={() => { onOpenObservability?.(); onClose(); }}
              className="w-full p-2.5 rounded-xl hover:bg-slate-900 flex items-center gap-3 text-left transition-colors text-purple-400 font-bold bg-purple-950/20 border border-purple-500/20"
            >
              <Activity className="w-4 h-4 text-purple-400" />
              <span>📊 Painel de Observabilidade (Admin)</span>
            </button>

            {/* 9. Instalar Aplicativo (PWA) */}
            <button
              onClick={() => { onOpenInstall(); onClose(); }}
              className="w-full p-2.5 rounded-xl hover:bg-slate-900 flex items-center gap-3 text-left transition-colors text-emerald-400 font-bold"
            >
              <Download className="w-4 h-4 text-emerald-400" />
              <span>Instalar Aplicativo (PWA / Offline)</span>
            </button>

            {/* 10. Sobre o Aplicativo (Eduardo Noronha) */}
            <button
              onClick={() => { onOpenAboutApp?.(); onClose(); }}
              className="w-full p-2.5 rounded-xl hover:bg-slate-900 flex items-center gap-3 text-left transition-colors text-slate-400"
            >
              <Info className="w-4 h-4 text-slate-400" />
              <span>Sobre o GPS INTELIGENTE 4.0</span>
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="pt-4 border-t border-slate-800 text-[11px] text-slate-500 text-center">
          <p>TÔ PASSANDO — GPS INTELIGENTE 4.0</p>
          <p className="text-[10px] text-slate-600 mt-0.5">Criado por Eduardo Noronha • dudusemog@gmail.com</p>
        </div>
      </div>
    </div>
  );
};
