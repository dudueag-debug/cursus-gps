import React, { useState, useEffect } from 'react';
import { 
  ShieldCheck, 
  AlertTriangle, 
  CheckCircle2, 
  Car, 
  Bike, 
  Flame, 
  X, 
  ArrowRight,
  HelpCircle
} from 'lucide-react';
import { SafetyChecklistItem } from '../../types';
import { api } from '../../services/api';

interface PartidaSeguraModalProps {
  isOpen: boolean;
  onClose: () => void;
  onProceedToNavigation: () => void;
  defaultVehicle: 'car' | 'motorcycle';
}

export const PartidaSeguraModal: React.FC<PartidaSeguraModalProps> = ({
  isOpen,
  onClose,
  onProceedToNavigation,
  defaultVehicle,
}) => {
  const [vehicle, setVehicle] = useState<'car' | 'motorcycle'>(defaultVehicle);
  const [items, setItems] = useState<SafetyChecklistItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isOpen) {
      setVehicle(defaultVehicle);
      loadChecklist(defaultVehicle);
    }
  }, [isOpen, defaultVehicle]);

  const loadChecklist = async (vType: 'car' | 'motorcycle') => {
    setLoading(true);
    try {
      const data = await api.getSafetyChecklist(vType);
      setItems(data.items);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleItem = (id: string) => {
    setItems(prev =>
      prev.map(it => (it.id === id ? { ...it, checked: !it.checked } : it))
    );
  };

  const handleVehicleChange = (vType: 'car' | 'motorcycle') => {
    setVehicle(vType);
    loadChecklist(vType);
  };

  if (!isOpen) return null;

  const totalItems = items.length;
  const checkedItems = items.filter(it => it.checked).length;
  const progressPercent = totalItems > 0 ? Math.round((checkedItems / totalItems) * 100) : 0;
  const criticalItems = items.filter(it => it.critical);
  const criticalUnchecked = criticalItems.filter(it => !it.checked);
  const canSafelyProceed = criticalUnchecked.length === 0;

  return (
    <div className="fixed inset-0 z-[9999] bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-700/80 rounded-2xl w-full max-w-xl p-5 shadow-2xl flex flex-col gap-4 text-white max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-start justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-lime-400/10 border border-lime-400/40 flex items-center justify-center">
              <ShieldCheck className="w-6 h-6 text-lime-400" />
            </div>
            <div>
              <h2 className="text-lg font-black tracking-tight text-white">Partida Segura</h2>
              <p className="text-xs text-slate-400">
                Checklist preventivo de segurança antes de iniciar a condução.
              </p>
            </div>
          </div>

          <button onClick={onClose} className="p-1 text-slate-400 hover:text-white transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Vehicle Selector Tabs */}
        <div className="flex items-center gap-2 bg-slate-950 p-1.5 rounded-xl border border-slate-800">
          <button
            onClick={() => handleVehicleChange('car')}
            className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-bold transition-all ${
              vehicle === 'car'
                ? 'bg-blue-600 text-white shadow-md shadow-blue-500/25'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Car className="w-4 h-4" />
            <span>Automóvel (Carro)</span>
          </button>

          <button
            onClick={() => handleVehicleChange('motorcycle')}
            className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-bold transition-all ${
              vehicle === 'motorcycle'
                ? 'bg-blue-600 text-white shadow-md shadow-blue-500/25'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Bike className="w-4 h-4" />
            <span>Motocicleta</span>
          </button>
        </div>

        {/* Progress Bar */}
        <div className="flex flex-col gap-1.5">
          <div className="flex items-center justify-between text-xs">
            <span className="font-semibold text-slate-300">Progresso da verificação preventiva:</span>
            <span className="font-mono font-bold text-lime-400">{progressPercent}% ({checkedItems}/{totalItems})</span>
          </div>
          <div className="w-full h-2 rounded-full bg-slate-950 overflow-hidden border border-slate-800">
            <div
              className="h-full bg-gradient-to-r from-blue-500 via-lime-400 to-emerald-400 transition-all duration-300"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>

        {/* Checklist questions */}
        <div className="flex flex-col gap-2.5 max-h-72 overflow-y-auto pr-1">
          {loading ? (
            <p className="text-center text-xs text-slate-500 py-6">Carregando itens de segurança...</p>
          ) : (
            items.map(item => (
              <label
                key={item.id}
                className={`p-3 rounded-xl border cursor-pointer transition-all flex flex-col gap-1.5 ${
                  item.checked
                    ? 'bg-lime-950/20 border-lime-500/40'
                    : 'bg-slate-950/60 border-slate-800 hover:border-slate-700'
                }`}
              >
                <div className="flex items-start gap-3">
                  <input
                    type="checkbox"
                    checked={item.checked}
                    onChange={() => handleToggleItem(item.id)}
                    className="mt-0.5 rounded border-slate-700 bg-slate-800 text-lime-400 focus:ring-0 w-4 h-4"
                  />
                  <div className="flex-1">
                    <p className={`text-xs font-semibold ${item.checked ? 'text-slate-200' : 'text-slate-300'}`}>
                      {item.question}
                    </p>
                    {item.critical && (
                      <span className="text-[10px] text-amber-400 font-bold uppercase tracking-wider">
                        Item essencial de segurança
                      </span>
                    )}
                  </div>
                </div>

                {/* Thermal Caution Alert */}
                {item.warningNote && (
                  <div className="ml-7 bg-red-950/50 border border-red-800/80 rounded-lg p-2 flex items-start gap-2 text-[11px] text-red-200">
                    <Flame className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                    <span>{item.warningNote}</span>
                  </div>
                )}
              </label>
            ))
          )}
        </div>

        {/* Legal and Technical Disclaimer */}
        <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-3 text-[11px] text-slate-400 flex items-start gap-2">
          <HelpCircle className="w-4 h-4 text-slate-500 shrink-0 mt-0.5" />
          <p>
            O Partida Segura é uma ferramenta de conscientização que não substitui a manutenção mecânica profissional periódica nem certifica a condição física real do veículo.
          </p>
        </div>

        {/* Action Button */}
        <div className="flex items-center justify-between gap-3 pt-2 border-t border-slate-800">
          <button
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold"
          >
            Revisar Depois
          </button>

          <button
            onClick={() => {
              if (!canSafelyProceed) {
                alert('Atenção: Existem itens essenciais de segurança não confirmados. Verifique antes de partir.');
              }
              onProceedToNavigation();
              onClose();
            }}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-xs shadow-lg transition-all ${
              canSafelyProceed
                ? 'bg-gradient-to-r from-lime-400 to-emerald-500 text-slate-950 hover:brightness-110 shadow-lime-500/20'
                : 'bg-amber-500 text-slate-950 hover:bg-amber-400'
            }`}
          >
            <span>{canSafelyProceed ? 'Liberar e Iniciar Trajeto' : 'Prosseguir sob Minha Responsabilidade'}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
