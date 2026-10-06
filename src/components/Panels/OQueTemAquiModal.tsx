import React, { useState } from 'react';
import type { Place, Coordinates } from '../../types';
import { 
  X, 
  Radar, 
  Fuel, 
  Wrench, 
  ShieldAlert, 
  Cross, 
  Bus, 
  ShoppingCart, 
  Trophy, 
  Landmark, 
  Navigation, 
  CheckCircle2, 
  ArrowRight,
  Sparkles
} from 'lucide-react';

interface OQueTemAquiModalProps {
  isOpen: boolean;
  onClose: () => void;
  userCoords: Coordinates | null;
  places: Place[];
  onSelectPlace: (place: Place) => void;
  onStartRouteToPlace: (place: Place) => void;
}

export const OQueTemAquiModal: React.FC<OQueTemAquiModalProps> = ({
  isOpen,
  onClose,
  userCoords,
  places,
  onSelectPlace,
  onStartRouteToPlace
}) => {
  const [activeTab, setActiveTab] = useState<'500m' | '2km'>('500m');

  if (!isOpen) return null;

  // Calculate distance from user
  function getDist(p: Place): number {
    if (!userCoords) return 999999;
    const R = 6371e3;
    const φ1 = (userCoords.lat * Math.PI) / 180;
    const φ2 = (p.coordinates.lat * Math.PI) / 180;
    const Δφ = ((p.coordinates.lat - userCoords.lat) * Math.PI) / 180;
    const Δλ = ((p.coordinates.lng - userCoords.lng) * Math.PI) / 180;
    const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) + Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return Math.round(R * c);
  }

  const placesWithDist = places.map(p => ({
    ...p,
    distanceMeters: getDist(p)
  }));

  const items500m = placesWithDist.filter(p => p.distanceMeters <= 800);
  const items2km = placesWithDist.filter(p => p.distanceMeters > 800 && p.distanceMeters <= 2500);

  const displayList = activeTab === '500m' ? items500m : items2km;

  // Summary counts by category
  const getCategoryCount = (list: typeof placesWithDist, catPrefix: string) => {
    return list.filter(p => p.category.startsWith(catPrefix) || p.subCategory.toLowerCase().includes(catPrefix)).length;
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'posto_gnv': return <Fuel className="w-5 h-5 text-amber-400" />;
      case 'borracheiro': return <Wrench className="w-5 h-5 text-orange-400" />;
      case 'policia': return <ShieldAlert className="w-5 h-5 text-blue-400" />;
      case 'saude': return <Cross className="w-5 h-5 text-emerald-400" />;
      case 'transporte_infraestrutura': return <Bus className="w-5 h-5 text-sky-400" />;
      case 'mercado':
      case 'comercio_servicos': return <ShoppingCart className="w-5 h-5 text-purple-400" />;
      case 'esporte': return <Trophy className="w-5 h-5 text-emerald-400" />;
      case 'turismo':
      case 'lazer_cultura': return <Landmark className="w-5 h-5 text-yellow-400" />;
      default: return <Sparkles className="w-5 h-5 text-cyan-400" />;
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fade-in">
      <div className="bg-slate-900 border border-cyan-500/30 w-full max-w-lg rounded-3xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="p-5 bg-gradient-to-r from-slate-900 via-cyan-950/50 to-slate-900 border-b border-cyan-500/20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-cyan-500/20 border border-cyan-500/40 flex items-center justify-center text-cyan-400 shadow-inner">
              <Radar className="w-6 h-6 animate-spin-slow" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-bold text-white tracking-wide">O QUE TEM AQUI?</h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold tracking-wider bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 uppercase">
                  DADO REAL
                </span>
              </div>
              <p className="text-xs text-slate-400">Varredura inteligente de serviços ao seu redor</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="w-9 h-9 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Radius Tabs */}
        <div className="flex bg-slate-950/60 p-1.5 mx-5 mt-4 rounded-2xl border border-slate-800">
          <button
            onClick={() => setActiveTab('500m')}
            className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 ${
              activeTab === '500m'
                ? 'bg-cyan-500 text-slate-950 shadow-md font-extrabold'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <span>📍 Raio de 500 Metros</span>
            <span className={`px-2 py-0.5 rounded-full text-[10px] ${activeTab === '500m' ? 'bg-slate-950/30 text-slate-950' : 'bg-slate-800 text-slate-300'}`}>
              {items500m.length}
            </span>
          </button>
          <button
            onClick={() => setActiveTab('2km')}
            className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 ${
              activeTab === '2km'
                ? 'bg-cyan-500 text-slate-950 shadow-md font-extrabold'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <span>🎯 Raio de 2 Quilômetros</span>
            <span className={`px-2 py-0.5 rounded-full text-[10px] ${activeTab === '2km' ? 'bg-slate-950/30 text-slate-950' : 'bg-slate-800 text-slate-300'}`}>
              {items2km.length}
            </span>
          </button>
        </div>

        {/* Category Quick Chips Summary */}
        <div className="grid grid-cols-3 gap-2 px-5 mt-3">
          <div className="bg-slate-800/60 border border-slate-700/50 rounded-xl p-2 flex items-center gap-2">
            <Fuel className="w-4 h-4 text-amber-400" />
            <div className="text-[11px]">
              <span className="text-slate-400 block">Postos</span>
              <span className="font-bold text-white">{getCategoryCount(displayList, 'posto')} locais</span>
            </div>
          </div>
          <div className="bg-slate-800/60 border border-slate-700/50 rounded-xl p-2 flex items-center gap-2">
            <Wrench className="w-4 h-4 text-orange-400" />
            <div className="text-[11px]">
              <span className="text-slate-400 block">Borracheiro</span>
              <span className="font-bold text-white">{getCategoryCount(displayList, 'borrach')} locais</span>
            </div>
          </div>
          <div className="bg-slate-800/60 border border-slate-700/50 rounded-xl p-2 flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 text-blue-400" />
            <div className="text-[11px]">
              <span className="text-slate-400 block">Polícia/DPO</span>
              <span className="font-bold text-white">{getCategoryCount(displayList, 'polic')} unids</span>
            </div>
          </div>
        </div>

        {/* Place Items List */}
        <div className="p-5 overflow-y-auto space-y-3 flex-1 scrollbar-thin">
          {displayList.length === 0 ? (
            <div className="text-center py-10 text-slate-400">
              <Radar className="w-12 h-12 mx-auto text-slate-600 mb-2 animate-pulse" />
              <p className="text-sm font-medium">Nenhum ponto registrado nesse raio específico.</p>
              <p className="text-xs text-slate-500 mt-1">Experimente alternar para o raio de 2km.</p>
            </div>
          ) : (
            displayList.map(place => (
              <div 
                key={place.id}
                onClick={() => onSelectPlace(place)}
                className="bg-slate-800/70 hover:bg-slate-800 border border-slate-700/70 hover:border-cyan-500/50 p-3.5 rounded-2xl transition-all cursor-pointer group shadow-sm flex items-center justify-between gap-3"
              >
                <div className="flex items-start gap-3 min-w-0">
                  <div className="w-10 h-10 rounded-xl bg-slate-900 border border-slate-700 flex items-center justify-center shrink-0 group-hover:border-cyan-500/40">
                    {getCategoryIcon(place.category)}
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <h4 className="font-semibold text-white text-sm truncate group-hover:text-cyan-300 transition-colors">
                        {place.name}
                      </h4>
                      {place.is24h && (
                        <span className="px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-300 text-[10px] font-bold border border-emerald-500/30 shrink-0">
                          24H
                        </span>
                      )}
                      {place.hasGNV && (
                        <span className="px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 text-[10px] font-bold border border-amber-500/30 shrink-0">
                          GNV
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-400 truncate mt-0.5">{place.address}</p>
                    <div className="flex items-center gap-3 mt-1 text-[11px] text-slate-400">
                      <span className="text-cyan-400 font-bold">~{place.distanceMeters}m de você</span>
                      {place.rating && (
                        <span className="text-amber-400 flex items-center gap-0.5">
                          ★ {place.rating.toFixed(1)}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onStartRouteToPlace(place);
                    onClose();
                  }}
                  className="px-3 py-2 rounded-xl bg-cyan-500/20 hover:bg-cyan-500 text-cyan-400 hover:text-slate-950 border border-cyan-500/40 text-xs font-bold transition-all flex items-center gap-1.5 shrink-0"
                  title="Traçar rota até este local"
                >
                  <Navigation className="w-3.5 h-3.5" />
                  <span>Rota</span>
                </button>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-950/80 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
          <div className="flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4 text-cyan-400" />
            <span>Dados checados em tempo real</span>
          </div>
          <button 
            onClick={onClose}
            className="text-cyan-400 hover:text-cyan-300 font-bold flex items-center gap-1"
          >
            <span>Fechar</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

      </div>
    </div>
  );
};
