import React from 'react';
import { 
  Navigation2, 
  MapPin, 
  ShieldCheck, 
  AlertTriangle, 
  Building2, 
  BookOpen, 
  User, 
  Radio,
  Download,
  Mic
} from 'lucide-react';
import type { UserProfile } from '../types';

interface BrandHeaderProps {
  user: UserProfile;
  activePanel: 'map' | 'places' | 'occurrences' | 'safety' | 'culture' | 'profile';
  setActivePanel: (panel: 'map' | 'places' | 'occurrences' | 'safety' | 'culture' | 'profile') => void;
  openSafetyModal: () => void;
  openInstallModal: () => void;
  openVoiceModal: () => void;
  activeOccurrencesCount: number;
}

export const BrandHeader: React.FC<BrandHeaderProps> = ({
  user,
  activePanel,
  setActivePanel,
  openSafetyModal,
  openInstallModal,
  openVoiceModal,
  activeOccurrencesCount,
}) => {
  return (
    <header className="bg-slate-950/90 backdrop-blur-md border-b border-slate-800 text-white px-4 py-2.5 sticky top-0 z-40 transition-all shadow-lg shadow-black/40">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-2">
        {/* Logo & Slogan */}
        <div 
          onClick={() => setActivePanel('map')} 
          className="flex items-center gap-3 cursor-pointer group select-none"
        >
          <div className="relative w-10 h-10 rounded-xl bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-900 p-0.5 shadow-md shadow-blue-500/20 group-hover:scale-105 transition-transform flex items-center justify-center">
            {/* Wind / Road road shape with glowing compass */}
            <div className="w-full h-full bg-slate-950 rounded-[10px] flex items-center justify-center relative overflow-hidden">
              <div className="absolute inset-0 bg-blue-500/10" />
              {/* Road lines */}
              <div className="absolute w-1 h-6 bg-lime-400/80 rounded-full rotate-12 -left-1 opacity-75" />
              <Navigation2 className="w-5 h-5 text-lime-400 transform rotate-45 group-hover:rotate-90 transition-transform duration-300 drop-shadow-[0_0_8px_rgba(204,255,0,0.8)]" />
            </div>
          </div>

          <div>
            <div className="flex items-center gap-2">
              <span className="font-black text-xl tracking-tight bg-gradient-to-r from-white via-slate-100 to-lime-300 bg-clip-text text-transparent">
                TÔ PASSANDO
              </span>
              <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded bg-blue-900/60 border border-blue-600/40 text-blue-300">
                CURSUS
              </span>
            </div>
            <p className="text-[11px] text-slate-400 font-medium hidden sm:block">
              Você vai. A gente te guia. • <span className="text-lime-400 font-semibold">Brasil Multimodal</span>
            </p>
          </div>
        </div>

        {/* Navigation Quick Tabs */}
        <nav className="flex items-center gap-1 sm:gap-2">
          {/* Mapa Principal */}
          <button
            onClick={() => setActivePanel('map')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              activePanel === 'map'
                ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
                : 'text-slate-300 hover:bg-slate-800/80 hover:text-white'
            }`}
          >
            <MapPin className="w-4 h-4 text-lime-400" />
            <span className="hidden md:inline">Navegação</span>
          </button>

          {/* Central de Locais */}
          <button
            onClick={() => setActivePanel('places')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              activePanel === 'places'
                ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
                : 'text-slate-300 hover:bg-slate-800/80 hover:text-white'
            }`}
          >
            <Building2 className="w-4 h-4 text-cyan-400" />
            <span className="hidden md:inline">Central de Locais</span>
          </button>

          {/* Acontecendo na Via */}
          <button
            onClick={() => setActivePanel('occurrences')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all relative ${
              activePanel === 'occurrences'
                ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
                : 'text-slate-300 hover:bg-slate-800/80 hover:text-white'
            }`}
          >
            <AlertTriangle className="w-4 h-4 text-amber-400" />
            <span className="hidden md:inline">Na Via</span>
            {activeOccurrencesCount > 0 && (
              <span className="bg-amber-500 text-slate-950 font-black text-[10px] px-1.5 py-0.2 rounded-full">
                {activeOccurrencesCount}
              </span>
            )}
          </button>

          {/* Partida Segura (Checklist) */}
          <button
            onClick={openSafetyModal}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-lime-400/10 hover:bg-lime-400/20 text-lime-300 border border-lime-400/30 transition-all shadow-sm"
            title="Checklist Pré-Viagem"
          >
            <ShieldCheck className="w-4 h-4 text-lime-400 animate-pulse" />
            <span className="hidden lg:inline">Partida Segura</span>
          </button>

          {/* História e Cultura */}
          <button
            onClick={() => setActivePanel('culture')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              activePanel === 'culture'
                ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
                : 'text-slate-300 hover:bg-slate-800/80 hover:text-white'
            }`}
          >
            <BookOpen className="w-4 h-4 text-purple-400" />
            <span className="hidden xl:inline">Cultura & História</span>
          </button>

          {/* Comando de Voz */}
          <button
            onClick={openVoiceModal}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-bold bg-blue-600/30 hover:bg-blue-600/50 text-blue-300 border border-blue-500/40 shadow-sm active:scale-95 transition-all"
            title="Comando de Voz Inteligente"
          >
            <Mic className="w-3.5 h-3.5 text-lime-400 animate-pulse" />
            <span className="hidden md:inline">Voz</span>
          </button>

          {/* Baixar / Instalar App */}
          <button
            onClick={openInstallModal}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-bold bg-gradient-to-r from-lime-400 to-emerald-400 text-slate-950 shadow-md shadow-lime-500/20 hover:brightness-110 active:scale-95 transition-all"
            title="Instalar no Celular ou Computador"
          >
            <Download className="w-3.5 h-3.5 fill-slate-950" />
            <span className="hidden sm:inline">Baixar App</span>
          </button>

          {/* Perfil & Acessibilidade */}
          <button
            onClick={() => setActivePanel('profile')}
            className="flex items-center gap-2 pl-2 pr-3 py-1.5 rounded-lg bg-slate-800/90 hover:bg-slate-700/90 text-slate-200 border border-slate-700 text-xs font-medium transition-all"
          >
            <div className="w-5 h-5 rounded-full bg-gradient-to-tr from-lime-400 to-blue-500 flex items-center justify-center text-slate-950 font-bold text-[10px]">
              {user.name.charAt(0).toUpperCase()}
            </div>
            <span className="hidden sm:inline font-semibold">{user.isGuest ? 'Visitante' : user.name.split(' ')[0]}</span>
          </button>
        </nav>
      </div>
    </header>
  );
};
