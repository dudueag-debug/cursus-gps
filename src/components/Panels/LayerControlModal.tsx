import React from 'react';
import { 
  Layers, 
  Map as MapIcon, 
  Globe, 
  Mountain, 
  Car, 
  AlertTriangle, 
  CloudSun, 
  Bus, 
  Bike, 
  ParkingCircle, 
  Fuel, 
  HeartPulse, 
  Utensils, 
  Wrench, 
  Landmark,
  XCircle,
  Check
} from 'lucide-react';
import type { MapLayerType } from '../../types';

export interface DetailedLayerPreferences {
  baseLayer: MapLayerType; // 'streets' | 'satellite' | 'topo' | 'dark'
  traffic: boolean;
  incidents: boolean;
  weather: boolean;
  transit: boolean;
  bikeLanes: boolean;
  parking: boolean;
  fuelStations: boolean;
  hospitals: boolean;
  restaurants: boolean;
  workshops: boolean;
  tourism: boolean;
}

interface LayerControlModalProps {
  isOpen: boolean;
  onClose: () => void;
  preferences: DetailedLayerPreferences;
  onUpdatePreferences: (pref: DetailedLayerPreferences) => void;
}

export const LayerControlModal: React.FC<LayerControlModalProps> = ({
  isOpen,
  onClose,
  preferences,
  onUpdatePreferences,
}) => {
  if (!isOpen) return null;

  const handleToggle = (key: keyof DetailedLayerPreferences) => {
    onUpdatePreferences({
      ...preferences,
      [key]: !preferences[key],
    });
  };

  const handleSetBase = (base: MapLayerType) => {
    onUpdatePreferences({
      ...preferences,
      baseLayer: base,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-4 animate-fade-in">
      <div className="bg-slate-900 border border-slate-700/80 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-900/90">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-gradient-to-tr from-blue-600 to-cyan-500 text-white shadow-md">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                CAMADAS DO MAPA VIVO
              </h2>
              <p className="text-xs text-slate-400">
                Ative ou desative camadas cartográficas e dados ao vivo
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition"
          >
            <XCircle className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 overflow-y-auto space-y-4 text-slate-200">
          {/* 1. Base Map Style */}
          <div>
            <label className="text-xs font-semibold text-slate-400 block mb-2 uppercase tracking-wider">
              Estilo Base do Mapa
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {[
                { id: 'streets', label: 'Vetor / Padrão', icon: MapIcon },
                { id: 'satellite', label: 'Satélite', icon: Globe },
                { id: 'topo', label: 'Relevo / Topo', icon: Mountain },
                { id: 'dark', label: '🌙 Noturno Tech', icon: MapIcon },
              ].map(item => {
                const Icon = item.icon;
                const isSelected = preferences.baseLayer === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => handleSetBase(item.id as any)}
                    className={`p-2.5 rounded-xl border flex flex-col items-center gap-1.5 transition ${
                      isSelected
                        ? 'bg-blue-600/30 border-blue-500 text-blue-300 font-bold shadow-md'
                        : 'bg-slate-800 border-slate-700 text-slate-400 hover:bg-slate-750'
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                    <span className="text-[11px] text-center">{item.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 2. Live Overlay Layers (14 Layers) */}
          <div>
            <label className="text-xs font-semibold text-slate-400 block mb-2 uppercase tracking-wider">
              Camadas Dinâmicas & Informações Colaborativas
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {[
                { key: 'traffic', label: 'Trânsito em Tempo Real', icon: Car, color: 'text-emerald-400' },
                { key: 'incidents', label: 'Incidentes & Alertas', icon: AlertTriangle, color: 'text-amber-400' },
                { key: 'weather', label: 'Clima & Risco de Chuva', icon: CloudSun, color: 'text-sky-400' },
                { key: 'transit', label: 'Transporte (Ônibus/Metrô)', icon: Bus, color: 'text-indigo-400' },
                { key: 'bikeLanes', label: 'Ciclovias & Rotas Cicláveis', icon: Bike, color: 'text-lime-400' },
                { key: 'parking', label: 'Estacionamentos & Vagas', icon: ParkingCircle, color: 'text-blue-400' },
                { key: 'fuelStations', label: 'Postos de Gasolina & GNV', icon: Fuel, color: 'text-amber-300' },
                { key: 'hospitals', label: 'Hospitais, UPAs & Farmácias', icon: HeartPulse, color: 'text-red-400' },
                { key: 'restaurants', label: 'Restaurantes & Alimentação', icon: Utensils, color: 'text-orange-400' },
                { key: 'workshops', label: 'Oficinas & Borracharias 24h', icon: Wrench, color: 'text-yellow-400' },
                { key: 'tourism', label: 'Pontos Turísticos & História', icon: Landmark, color: 'text-purple-400' },
              ].map(layer => {
                const Icon = layer.icon;
                const active = Boolean(preferences[layer.key as keyof DetailedLayerPreferences]);
                return (
                  <button
                    key={layer.key}
                    type="button"
                    onClick={() => handleToggle(layer.key as keyof DetailedLayerPreferences)}
                    className={`p-2.5 rounded-xl border flex items-center justify-between text-xs font-semibold transition ${
                      active
                        ? 'bg-slate-800/90 border-blue-500/50 text-white shadow-sm'
                        : 'bg-slate-900/60 border-slate-800 text-slate-500 hover:text-slate-300'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <Icon className={`w-4 h-4 ${active ? layer.color : 'text-slate-600'}`} />
                      <span>{layer.label}</span>
                    </div>
                    <div className={`w-5 h-5 rounded-md flex items-center justify-center border transition ${
                      active ? 'bg-blue-600 border-blue-500 text-white' : 'border-slate-700 bg-slate-950'
                    }`}>
                      {active && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-900/95 flex justify-end">
          <button
            onClick={onClose}
            className="w-full py-2.5 px-4 bg-gradient-to-r from-blue-600 to-cyan-600 hover:brightness-110 text-white font-bold rounded-xl text-sm transition"
          >
            Aplicar Camadas
          </button>
        </div>
      </div>
    </div>
  );
};
