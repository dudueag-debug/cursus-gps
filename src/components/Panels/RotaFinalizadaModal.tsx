import React from 'react';
import { 
  CheckCircle2, 
  MapPin, 
  Gauge, 
  Clock, 
  Route, 
  ShieldCheck, 
  Flame, 
  X, 
  ChevronRight, 
  Save, 
  Award,
  Share2
} from 'lucide-react';

export interface CompletedTripData {
  originName: string;
  destName: string;
  distanceMeters: number;
  durationSeconds: number;
  avgSpeedKmh: number;
  maxSpeedKmh: number;
  timestamp: string;
}

interface RotaFinalizadaModalProps {
  isOpen: boolean;
  onClose: () => void;
  tripData: CompletedTripData | null;
  onViewHistory?: () => void;
}

export const RotaFinalizadaModal: React.FC<RotaFinalizadaModalProps> = ({
  isOpen,
  onClose,
  tripData,
  onViewHistory,
}) => {
  if (!isOpen || !tripData) return null;

  const distanceKm = (tripData.distanceMeters / 1000).toFixed(1);
  const distanceDisplay = tripData.distanceMeters >= 1000 
    ? `${distanceKm} km` 
    : `${tripData.distanceMeters} m`;

  const minutes = Math.floor(tripData.durationSeconds / 60);
  const seconds = tripData.durationSeconds % 60;
  const durationDisplay = minutes > 0 
    ? `${minutes} min ${seconds > 0 ? `${seconds}s` : ''}` 
    : `${seconds} s`;

  const formattedDate = new Date(tripData.timestamp).toLocaleTimeString('pt-BR', {
    hour: '2-digit',
    minute: '2-digit',
  });

  const handleShare = () => {
    if (typeof navigator !== 'undefined' && navigator.share) {
      navigator.share({
        title: 'Corrida Finalizada • TÔ PASSANDO RJ',
        text: `Acabei de concluir minha rota no TÔ PASSANDO! Percorri ${distanceDisplay} em ${durationDisplay}.`,
      }).catch(() => {});
    }
  };

  return (
    <div className="fixed inset-0 z-[10000] bg-black/85 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-700/80 rounded-3xl w-full max-w-lg p-5 sm:p-6 shadow-2xl flex flex-col gap-4 text-white max-h-[92vh] overflow-y-auto animate-in zoom-in-95 duration-200">
        
        {/* Top Header */}
        <div className="flex items-start justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-lime-400 to-emerald-500 flex items-center justify-center text-slate-950 shadow-lg shadow-lime-500/20">
              <CheckCircle2 className="w-7 h-7 stroke-[2.5]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-lime-400/20 text-lime-400 border border-lime-400/40">
                  🏁 Rota Finalizada
                </span>
                <span className="text-[11px] text-slate-400 font-mono">
                  {formattedDate}
                </span>
              </div>
              <h2 className="text-xl font-black tracking-tight text-white mt-0.5">
                Resumo da Sua Corrida
              </h2>
            </div>
          </div>

          <button 
            onClick={onClose} 
            className="p-1.5 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition-colors"
            title="Fechar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Origin & Destination Card */}
        <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-4 flex flex-col gap-2.5">
          <div className="flex items-start gap-3">
            <div className="flex flex-col items-center mt-1">
              <span className="w-3 h-3 rounded-full bg-cyan-400 ring-4 ring-cyan-500/20"></span>
              <span className="w-0.5 h-6 bg-slate-700 my-0.5"></span>
              <span className="w-3 h-3 rounded-full bg-lime-400 ring-4 ring-lime-500/20"></span>
            </div>
            <div className="flex-1 flex flex-col justify-between gap-2">
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Origem</span>
                <p className="text-xs font-bold text-slate-200 line-clamp-1">
                  {tripData.originName || 'Local de Partida'}
                </p>
              </div>
              <div>
                <span className="text-[10px] font-bold text-lime-400 uppercase tracking-wider">Destino Chegado</span>
                <p className="text-sm font-black text-white line-clamp-1">
                  {tripData.destName || 'Destino Concluído'}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Real Telemetry Grid: Distance, Time, Avg Speed, Max Speed */}
        <div className="grid grid-cols-2 gap-2.5">
          {/* Total Distance Recorded */}
          <div className="bg-slate-950/70 border border-slate-800/90 rounded-2xl p-3.5 flex flex-col justify-between">
            <div className="flex items-center justify-between text-slate-400">
              <span className="text-[11px] font-bold uppercase tracking-wider">Distância Real</span>
              <Route className="w-4 h-4 text-cyan-400" />
            </div>
            <div className="mt-2">
              <span className="text-2xl sm:text-3xl font-black font-mono text-cyan-400">
                {distanceDisplay}
              </span>
              <p className="text-[10px] text-slate-400 font-medium mt-0.5">
                Odômetro via satélite GPS
              </p>
            </div>
          </div>

          {/* Total Duration */}
          <div className="bg-slate-950/70 border border-slate-800/90 rounded-2xl p-3.5 flex flex-col justify-between">
            <div className="flex items-center justify-between text-slate-400">
              <span className="text-[11px] font-bold uppercase tracking-wider">Tempo Gasto</span>
              <Clock className="w-4 h-4 text-amber-400" />
            </div>
            <div className="mt-2">
              <span className="text-2xl sm:text-3xl font-black font-mono text-amber-400">
                {durationDisplay}
              </span>
              <p className="text-[10px] text-slate-400 font-medium mt-0.5">
                Duração total em trânsito
              </p>
            </div>
          </div>

          {/* Average Speed */}
          <div className="bg-slate-950/70 border border-slate-800/90 rounded-2xl p-3.5 flex flex-col justify-between">
            <div className="flex items-center justify-between text-slate-400">
              <span className="text-[11px] font-bold uppercase tracking-wider">Velocidade Média</span>
              <Gauge className="w-4 h-4 text-lime-400" />
            </div>
            <div className="mt-2">
              <div className="flex items-baseline gap-1">
                <span className="text-2xl sm:text-3xl font-black font-mono text-lime-400">
                  {tripData.avgSpeedKmh}
                </span>
                <span className="text-xs text-slate-400 font-bold">km/h</span>
              </div>
              <p className="text-[10px] text-slate-400 font-medium mt-0.5">
                Média ponderada real
              </p>
            </div>
          </div>

          {/* Max Speed */}
          <div className="bg-slate-950/70 border border-slate-800/90 rounded-2xl p-3.5 flex flex-col justify-between">
            <div className="flex items-center justify-between text-slate-400">
              <span className="text-[11px] font-bold uppercase tracking-wider">Velocidade Máxima</span>
              <Flame className="w-4 h-4 text-rose-400" />
            </div>
            <div className="mt-2">
              <div className="flex items-baseline gap-1">
                <span className="text-2xl sm:text-3xl font-black font-mono text-rose-400">
                  {tripData.maxSpeedKmh}
                </span>
                <span className="text-xs text-slate-400 font-bold">km/h</span>
              </div>
              <p className="text-[10px] text-slate-400 font-medium mt-0.5">
                Pico registrado no trajeto
              </p>
            </div>
          </div>
        </div>

        {/* Saved to History Confirmation Banner */}
        <div className="bg-emerald-950/40 border border-emerald-500/40 rounded-2xl p-3 flex items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-xl bg-emerald-500/20 flex items-center justify-center text-emerald-400 shrink-0">
              <Save className="w-4 h-4" />
            </div>
            <div>
              <p className="font-bold text-emerald-300">
                Corrida gravada no seu histórico com sucesso!
              </p>
              <p className="text-[11px] text-emerald-400/80">
                Os dados de quilometragem e tempo foram salvos no seu perfil.
              </p>
            </div>
          </div>

          <ShieldCheck className="w-5 h-5 text-emerald-400 shrink-0" />
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center gap-2 pt-2 border-t border-slate-800">
          {typeof navigator !== 'undefined' && 'share' in navigator && (
            <button
              onClick={handleShare}
              className="w-full sm:w-auto px-4 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs flex items-center justify-center gap-2 transition-colors cursor-pointer"
            >
              <Share2 className="w-4 h-4" />
              <span>Compartilhar</span>
            </button>
          )}

          {onViewHistory && (
            <button
              onClick={() => {
                onClose();
                onViewHistory();
              }}
              className="w-full sm:w-auto px-4 py-3 rounded-xl bg-slate-800 hover:bg-slate-750 text-cyan-300 border border-cyan-500/30 font-bold text-xs flex items-center justify-center gap-2 transition-colors cursor-pointer"
            >
              <span>Ver no Perfil</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          )}

          <button
            onClick={onClose}
            className="w-full flex-1 py-3 px-5 rounded-xl bg-gradient-to-r from-lime-400 to-lime-500 hover:from-lime-300 hover:to-lime-400 text-slate-950 font-black text-xs uppercase tracking-wider shadow-lg shadow-lime-500/20 active:scale-98 transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            <span>Concluir e Voltar ao Mapa</span>
          </button>
        </div>

      </div>
    </div>
  );
};
