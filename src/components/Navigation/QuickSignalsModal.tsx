import React, { useState } from 'react';
import { 
  AlertTriangle, 
  X, 
  Check, 
  Car, 
  Waves, 
  CircleDot, 
  Package, 
  AlertOctagon, 
  Flame, 
  ShieldAlert, 
  Ban, 
  Split, 
  Skull, 
  Zap,
  MapPin,
  Send
} from 'lucide-react';

import type { OccurrenceCategory, Coordinates } from '../../types';
import { api } from '../../services/api';

interface QuickSignalsModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentLocation: Coordinates;
  detectedLocationName?: string;
  onReportCreated?: () => void;
}

interface SignalOption {
  category: OccurrenceCategory;
  title: string;
  label: string;
  icon: React.ReactNode;
  color: string;
  badgeColor: string;
  severity: 'baixa' | 'media' | 'alta' | 'critica';
  defaultDescription: string;
}

export const QuickSignalsModal: React.FC<QuickSignalsModalProps> = ({
  isOpen,
  onClose,
  currentLocation,
  detectedLocationName = 'Minha Localização Atual',
  onReportCreated,
}) => {
  const [selectedSignal, setSelectedSignal] = useState<SignalOption | null>(null);
  const [customNote, setCustomNote] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const signalOptions: SignalOption[] = [
    {
      category: 'roubo_celular_semaforo',
      title: '⚠️ ALERTA: Roubo de Telefone no Engarrafamento',
      label: '📱 Roubo Celular no Trânsito',
      icon: <Skull className="w-5 h-5" />,
      color: 'from-rose-600 to-pink-700',
      badgeColor: 'bg-rose-500/30 text-rose-200 border-rose-500/60',
      severity: 'critica',
      defaultDescription: 'Atenção no semáforo e engarrafamento: alto índice de furto/roubo de celular pela janela.',
    },
    {
      category: 'roubo_carro_moto',
      title: '🚨 Alto Índice de Assalto: Carro, Moto e Pedestres',
      label: '🚨 Assalto Carro/Moto/Pedestre',
      icon: <Skull className="w-5 h-5" />,
      color: 'from-red-700 to-rose-900',
      badgeColor: 'bg-red-500/30 text-red-200 border-red-500/60',
      severity: 'critica',
      defaultDescription: 'Zona com relatos de assalto a motoristas, motociclistas e pedestres.',
    },
    {
      category: 'local_perigoso',
      title: '⚠️ Bairro / Local Perigoso em Alerta',
      label: '⚠️ Bairro / Local Perigoso',
      icon: <Zap className="w-5 h-5" />,
      color: 'from-purple-700 to-indigo-900',
      badgeColor: 'bg-purple-500/30 text-purple-200 border-purple-500/50',
      severity: 'critica',
      defaultDescription: 'Bairro ou trecho perigoso demarcado com alerta de travessia ativa.',
    },
    {
      category: 'blitz',
      title: '👮 Blitz & Policiamento na Via',
      label: '👮 Blitz / Policiamento',
      icon: <ShieldAlert className="w-5 h-5" />,
      color: 'from-blue-600 to-indigo-700',
      badgeColor: 'bg-blue-500/20 text-blue-300 border-blue-500/40',
      severity: 'media',
      defaultDescription: 'Operação policial e viaturas posicionadas na via em tempo real.',
    },
    {
      category: 'radar',
      title: '📸 Pardal / Limite de Velocidade (60 km/h)',
      label: '📸 Pardal / Limite Velocidade',
      icon: <AlertOctagon className="w-5 h-5" />,
      color: 'from-violet-600 to-purple-700',
      badgeColor: 'bg-violet-500/20 text-violet-300 border-violet-500/40',
      severity: 'media',
      defaultDescription: 'Pardal eletrônico de velocidade e avanço de sinal ativo.',
    },
    {
      category: 'engarrafamento',
      title: '🚗 Engarrafamento & Lentidão em Tempo Real',
      label: '🚗 Engarrafamento / Lentidão',
      icon: <Car className="w-5 h-5" />,
      color: 'from-amber-600 to-orange-600',
      badgeColor: 'bg-amber-500/20 text-amber-300 border-amber-500/40',
      severity: 'alta',
      defaultDescription: 'Trânsito parado ou fluxo muito lento na via neste momento.',
    },
    {
      category: 'falta_iluminacao',
      title: '💡 Falta de Iluminação Pública (Via Escura)',
      label: '💡 Falta de Iluminação',
      icon: <Zap className="w-5 h-5" />,
      color: 'from-amber-500 to-yellow-700',
      badgeColor: 'bg-amber-500/30 text-amber-200 border-amber-500/50',
      severity: 'alta',
      defaultDescription: 'Postes apagados e trecho escuro. Destaque automático no modo noturno.',
    },
    {
      category: 'sem_sinalizacao',
      title: '🚫 Via Sem Sinalização / Faixas Apagadas',
      label: '🚫 Sem Sinalização na Via',
      icon: <Ban className="w-5 h-5" />,
      color: 'from-yellow-600 to-orange-700',
      badgeColor: 'bg-yellow-500/20 text-yellow-300 border-yellow-500/40',
      severity: 'alta',
      defaultDescription: 'Ausência de placas, pintura de faixa apagada ou semáforo desligado.',
    },
    {
      category: 'falta_pavimentacao',
      title: '🕳️ Falta de Pavimentação & Trecho com Buracos',
      label: '🕳️ Buracos / Sem Asfalto',
      icon: <CircleDot className="w-5 h-5" />,
      color: 'from-yellow-700 to-amber-800',
      badgeColor: 'bg-yellow-500/20 text-yellow-300 border-yellow-500/40',
      severity: 'alta',
      defaultDescription: 'Trecho sem pavimentação adequada e com sequência de buracos na via.',
    },
    {
      category: 'alagamento',
      title: '🌊 Ponto de Alagamento na Pista',
      label: '🌊 Alagamento na Via',
      icon: <Waves className="w-5 h-5" />,
      color: 'from-blue-600 to-cyan-600',
      badgeColor: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40',
      severity: 'critica',
      defaultDescription: 'Água acumulada na via com risco para veículos e motociclistas.',
    },
    {
      category: 'acidente',
      title: '💥 Acidente de Trânsito na Via',
      label: '💥 Acidente',
      icon: <Flame className="w-5 h-5" />,
      color: 'from-red-600 to-rose-700',
      badgeColor: 'bg-red-500/20 text-red-300 border-red-500/40',
      severity: 'critica',
      defaultDescription: 'Colisão / acidente na pista. Reduza a velocidade.',
    },
    {
      category: 'via_interditada',
      title: '🚧 Via Interditada / Bloqueio',
      label: '🚧 Via Interditada',
      icon: <Split className="w-5 h-5" />,
      color: 'from-red-700 to-red-950',
      badgeColor: 'bg-red-600/30 text-red-200 border-red-500/60',
      severity: 'critica',
      defaultDescription: 'Pista bloqueada ou parcialmente interditada.',
    },
  ];

  const handleQuickSend = async (signal: SignalOption) => {
    setIsSubmitting(true);
    try {
      await api.reportOccurrence({
        category: signal.category,
        title: signal.title,
        description: customNote || signal.defaultDescription,
        locationName: detectedLocationName || 'Na via em tempo real',
        coordinates: currentLocation,
        severity: signal.severity,
        affectedLanes: 'Trecho do GPS',
      });

      setSuccessMessage(`Alerta "${signal.label}" publicado para toda a comunidade!`);
      if (onReportCreated) onReportCreated();

      setTimeout(() => {
        setSuccessMessage(null);
        setSelectedSignal(null);
        setCustomNote('');
        onClose();
      }, 1500);
    } catch (e) {
      console.error(e);
      alert('Não foi possível enviar o alerta no momento.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[9999] bg-black/85 backdrop-blur-md flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in">
      <div className="bg-slate-950 border border-slate-700/80 rounded-t-3xl sm:rounded-3xl w-full max-w-xl max-h-[92vh] flex flex-col overflow-hidden shadow-2xl">
        {/* Header */}
        <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-900/60">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-black text-base text-white tracking-tight">Sinalizar na Via (1 Toque)</h2>
              <p className="text-[11px] text-slate-400 flex items-center gap-1">
                <MapPin className="w-3 h-3 text-lime-400" />
                <span className="truncate max-w-[240px]">{detectedLocationName}</span>
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-full text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Success Alert Banner */}
        {successMessage && (
          <div className="m-4 p-3.5 bg-emerald-950/90 border border-emerald-500/80 rounded-2xl flex items-center gap-2.5 text-emerald-200 text-xs font-bold animate-in zoom-in-95">
            <Check className="w-5 h-5 text-emerald-400 shrink-0" />
            <span>{successMessage}</span>
          </div>
        )}

        {/* Grid of 12 Fast Buttons */}
        <div className="p-4 overflow-y-auto max-h-[65vh] space-y-3">
          <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
            Selecione o que você encontrou na pista:
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
            {signalOptions.map((opt) => {
              const isSelected = selectedSignal?.category === opt.category;
              return (
                <button
                  key={opt.category}
                  onClick={() => {
                    setSelectedSignal(opt);
                    setCustomNote('');
                  }}
                  className={`p-3 rounded-2xl border text-left flex flex-col justify-between gap-2.5 transition-all active:scale-95 relative overflow-hidden group ${
                    isSelected
                      ? 'bg-slate-800 border-lime-400 ring-2 ring-lime-400/30 shadow-lg'
                      : 'bg-slate-900/80 hover:bg-slate-800/90 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className={`w-8 h-8 rounded-xl bg-gradient-to-br ${opt.color} flex items-center justify-center text-white shadow-md group-hover:scale-110 transition-transform`}>
                      {opt.icon}
                    </div>
                    {isSelected && (
                      <span className="w-4 h-4 rounded-full bg-lime-400 text-slate-950 flex items-center justify-center">
                        <Check className="w-3 h-3 stroke-[3]" />
                      </span>
                    )}
                  </div>

                  <div>
                    <span className="font-black text-xs text-slate-100 block leading-tight">
                      {opt.label}
                    </span>
                    <span className={`inline-block mt-1 text-[9px] font-bold px-1.5 py-0.2 rounded border ${opt.badgeColor}`}>
                      {opt.severity.toUpperCase()}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Optional Note & Direct Confirmation Bar */}
          {selectedSignal && (
            <div className="bg-slate-900 border border-slate-700/80 rounded-2xl p-3.5 mt-3 flex flex-col gap-2.5 animate-in slide-in-from-bottom-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-200">
                  Confirmar: <strong className="text-lime-400">{selectedSignal.title}</strong>
                </span>
                <span className="text-[10px] text-slate-400">Opcional: adicione detalhe</span>
              </div>

              <input
                type="text"
                value={customNote}
                onChange={(e) => setCustomNote(e.target.value)}
                placeholder={`Ex: ${selectedSignal.defaultDescription}`}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-lime-400"
              />

              <button
                onClick={() => handleQuickSend(selectedSignal)}
                disabled={isSubmitting}
                className="w-full py-3 bg-gradient-to-r from-lime-400 via-lime-500 to-emerald-400 hover:brightness-110 text-slate-950 font-black text-xs rounded-xl shadow-lg shadow-lime-500/20 flex items-center justify-center gap-2 active:scale-[0.98] transition-all disabled:opacity-50"
              >
                {isSubmitting ? (
                  <span className="animate-pulse">Publicando Alerta no GPS...</span>
                ) : (
                  <>
                    <Send className="w-4 h-4 fill-slate-950" />
                    <span>ENVIAR ALERTA IMEDIATAMENTE</span>
                  </>
                )}
              </button>
            </div>
          )}
        </div>

        {/* Footer info */}
        <div className="p-3 border-t border-slate-800 text-center text-[10px] text-slate-500 bg-slate-950">
          Sua sinalização ajuda motoristas de carros, motos e transportes em todo o Brasil.
        </div>
      </div>
    </div>
  );
};
