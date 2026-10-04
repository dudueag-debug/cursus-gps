import React, { useState } from 'react';
import { 
  AlertTriangle, 
  ChevronDown, 
  ChevronUp, 
  ThumbsUp, 
  MapPin, 
  ShieldAlert, 
  Plus, 
  Check, 
  Activity,
  Flame,
  Construction,
  Clock
} from 'lucide-react';
import type { Occurrence, Coordinates } from '../../types';

interface ViaCardHUDProps {
  occurrences: Occurrence[];
  currentLocation: Coordinates;
  onSelectOccurrence: (occ: Occurrence) => void;
  onOpenReportModal?: () => void;
  onConfirmOccurrence?: (id: string) => void;
}

export const ViaCardHUD: React.FC<ViaCardHUDProps> = ({
  occurrences,
  currentLocation,
  onSelectOccurrence,
  onOpenReportModal,
  onConfirmOccurrence,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [selectedFilter, setSelectedFilter] = useState<'all' | 'radars' | 'hazards' | 'traffic'>('all');
  const [confirmedIds, setConfirmedIds] = useState<string[]>([]);

  // Filter occurrences
  const filtered = occurrences.filter(occ => {
    if (occ.isNormalized) return false;
    if (selectedFilter === 'radars') return ['radar', 'policia'].includes(occ.category);
    if (selectedFilter === 'hazards') return ['buraco', 'oleo', 'alagamento', 'animais'].includes(occ.category);
    if (selectedFilter === 'traffic') return ['transito', 'acidente', 'obras'].includes(occ.category);
    return true;
  });

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'radar':
      case 'policia':
        return '📸';
      case 'buraco':
        return '🕳️';
      case 'oleo':
        return '🛢️';
      case 'alagamento':
        return '🌊';
      case 'acidente':
        return '💥';
      case 'obras':
        return '🚧';
      case 'transito':
        return '🚗';
      default:
        return '⚠️';
    }
  };

  const getSeverityBadge = (severity: string) => {
    switch (severity) {
      case 'critica':
        return <span className="px-1.5 py-0.5 rounded text-[10px] font-black uppercase bg-red-600 text-white animate-pulse">Crítico</span>;
      case 'alta':
        return <span className="px-1.5 py-0.5 rounded text-[10px] font-black uppercase bg-orange-500 text-slate-950">Alto Risco</span>;
      case 'media':
        return <span className="px-1.5 py-0.5 rounded text-[10px] font-bold uppercase bg-amber-500/30 text-amber-300 border border-amber-600/40">Moderado</span>;
      default:
        return <span className="px-1.5 py-0.5 rounded text-[10px] font-medium uppercase bg-slate-800 text-slate-300">Atenção</span>;
    }
  };

  const handleConfirm = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirmedIds.includes(id)) {
      setConfirmedIds(prev => [...prev, id]);
      if (onConfirmOccurrence) onConfirmOccurrence(id);
    }
  };

  const totalActive = occurrences.filter(o => !o.isNormalized).length;

  return (
    <div className="absolute bottom-3 left-3 right-3 sm:left-4 sm:right-auto sm:w-96 z-20 select-none">
      <div className="bg-slate-950/95 backdrop-blur-xl border border-slate-700/80 rounded-2xl shadow-2xl overflow-hidden transition-all duration-300">
        {/* Header Bar */}
        <div 
          onClick={() => setIsExpanded(!isExpanded)}
          className="flex items-center justify-between p-3 cursor-pointer hover:bg-slate-900/60 transition-colors"
        >
          <div className="flex items-center gap-2.5">
            <div className="relative flex items-center justify-center w-8 h-8 rounded-xl bg-amber-500/20 border border-amber-500/40 text-amber-400">
              <AlertTriangle className="w-4 h-4 animate-pulse" />
              {totalActive > 0 && (
                <span className="absolute -top-1 -right-1 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-red-500 text-[9px] font-black text-white">
                  {totalActive}
                </span>
              )}
            </div>

            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-black text-xs text-white uppercase tracking-wider">Acontecendo na Via</span>
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-lime-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-lime-500"></span>
                </span>
              </div>
              <p className="text-[11px] text-slate-400">
                {totalActive > 0 ? `${totalActive} alertas ativos para motoristas` : 'Via limpa no seu raio de GPS'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            {onOpenReportModal && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onOpenReportModal();
                }}
                className="flex items-center gap-1 bg-lime-400 hover:bg-lime-300 text-slate-950 px-2.5 py-1 rounded-lg text-xs font-black shadow-md shadow-lime-500/20 active:scale-95 transition-all"
                title="Avisar motoristas sobre perigo na via"
              >
                <Plus className="w-3.5 h-3.5 stroke-[3]" />
                <span className="hidden xs:inline">Alertar</span>
              </button>
            )}

            <button 
              className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              title={isExpanded ? 'Recolher Card' : 'Expandir Alertas'}
            >
              {isExpanded ? <ChevronDown className="w-5 h-5" /> : <ChevronUp className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Collapsible Content */}
        {isExpanded && (
          <div className="border-t border-slate-800/80 p-3 flex flex-col gap-2.5 max-h-[380px] overflow-y-auto">
            {/* Filter Pills */}
            <div className="flex items-center gap-1 overflow-x-auto pb-1 text-[11px] no-scrollbar">
              <button
                onClick={() => setSelectedFilter('all')}
                className={`px-2.5 py-1 rounded-lg font-bold transition-all whitespace-nowrap ${
                  selectedFilter === 'all'
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'bg-slate-900 text-slate-400 hover:text-slate-200'
                }`}
              >
                Todos ({totalActive})
              </button>

              <button
                onClick={() => setSelectedFilter('radars')}
                className={`px-2.5 py-1 rounded-lg font-bold transition-all whitespace-nowrap ${
                  selectedFilter === 'radars'
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'bg-slate-900 text-slate-400 hover:text-slate-200'
                }`}
              >
                📸 Radares & Blitz
              </button>

              <button
                onClick={() => setSelectedFilter('hazards')}
                className={`px-2.5 py-1 rounded-lg font-bold transition-all whitespace-nowrap ${
                  selectedFilter === 'hazards'
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'bg-slate-900 text-slate-400 hover:text-slate-200'
                }`}
              >
                🕳️ Buracos & Pista
              </button>

              <button
                onClick={() => setSelectedFilter('traffic')}
                className={`px-2.5 py-1 rounded-lg font-bold transition-all whitespace-nowrap ${
                  selectedFilter === 'traffic'
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'bg-slate-900 text-slate-400 hover:text-slate-200'
                }`}
              >
                🚧 Trânsito & Obras
              </button>
            </div>

            {/* List of Occurrences */}
            <div className="flex flex-col gap-2">
              {filtered.length === 0 ? (
                <div className="text-center py-6 text-slate-500 text-xs">
                  Nenhum alerta nesta categoria no momento. Boa viagem!
                </div>
              ) : (
                filtered.map(occ => {
                  const isConfirmed = confirmedIds.includes(occ.id);
                  const count = occ.confirmationsCount + (isConfirmed ? 1 : 0);

                  return (
                    <div
                      key={occ.id}
                      onClick={() => onSelectOccurrence(occ)}
                      className="bg-slate-900/80 hover:bg-slate-900 border border-slate-800 hover:border-slate-700 rounded-xl p-2.5 flex flex-col gap-1.5 cursor-pointer transition-all active:scale-[0.99]"
                    >
                      {/* Top Info */}
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <span className="text-lg leading-none">{getCategoryIcon(occ.category)}</span>
                          <div>
                            <h4 className="font-bold text-xs text-slate-100 leading-snug">{occ.title}</h4>
                            <p className="text-[10px] text-slate-400 flex items-center gap-1">
                              <MapPin className="w-3 h-3 text-cyan-400" />
                              <span className="truncate max-w-[180px]">{occ.locationName || 'Na via'}</span>
                            </p>
                          </div>
                        </div>

                        {getSeverityBadge(occ.severity)}
                      </div>

                      {/* Description */}
                      {occ.description && (
                        <p className="text-[11px] text-slate-300 bg-slate-950/60 p-1.5 rounded-lg border border-slate-800/60 leading-relaxed">
                          {occ.description}
                        </p>
                      )}

                      {/* Actions Footer */}
                      <div className="flex items-center justify-between pt-1 border-t border-slate-800/60 text-[10px] text-slate-400">
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3 text-slate-500" />
                          <span>Faixa: <b className="text-slate-300">{occ.affectedLanes || 'Central'}</b></span>
                        </span>

                        <div className="flex items-center gap-2">
                          <button
                            onClick={(e) => handleConfirm(occ.id, e)}
                            className={`flex items-center gap-1 px-2 py-0.5 rounded-md font-semibold transition-all ${
                              isConfirmed
                                ? 'bg-emerald-950 border border-emerald-600/60 text-emerald-300'
                                : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
                            }`}
                            title="Confirmar que o perigo continua na via"
                          >
                            <ThumbsUp className="w-3 h-3" />
                            <span>{count} {isConfirmed ? 'Confirmado' : 'Confirmar'}</span>
                          </button>

                          <span className="text-lime-400 font-bold hover:underline">
                            Ver no Mapa ➔
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
