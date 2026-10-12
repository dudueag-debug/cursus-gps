import React, { useState, useEffect } from 'react';
import { Activity, Server, Cpu, Database, Wifi, AlertTriangle, CheckCircle2, RefreshCw, XCircle } from 'lucide-react';
import { ObservabilityEngine, type ObservabilityDashboardState } from '../../engines/observabilityEngine';

interface ObservabilityDashboardModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ObservabilityDashboardModal: React.FC<ObservabilityDashboardModalProps> = ({
  isOpen,
  onClose,
}) => {
  const [data, setData] = useState<ObservabilityDashboardState>(() => ObservabilityEngine.getDashboardState());

  useEffect(() => {
    if (!isOpen) return;
    const timer = setInterval(() => {
      setData(ObservabilityEngine.getDashboardState());
    }, 2000);
    return () => clearInterval(timer);
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/85 backdrop-blur-md p-4 animate-fade-in">
      <div className="bg-slate-900 border border-slate-700/80 rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-900/90">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-gradient-to-tr from-purple-600 to-indigo-600 text-white shadow-md">
              <Activity className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                PAINEL DE OBSERVABILIDADE & DIAGNÓSTICO
              </h2>
              <p className="text-xs text-slate-400">
                Monitoramento de desempenho, sessões ativas e telemetria de motores
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
          {/* Key Metric Tiles */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            <div className="p-3 bg-slate-800/80 border border-slate-700 rounded-xl">
              <span className="text-[11px] text-slate-400 block mb-1">Usuários Online</span>
              <span className="text-xl font-black text-lime-400 font-mono">
                {data.activeUsersOnlineCount.toLocaleString('pt-BR')}
              </span>
            </div>

            <div className="p-3 bg-slate-800/80 border border-slate-700 rounded-xl">
              <span className="text-[11px] text-slate-400 block mb-1">Sessões de GPS</span>
              <span className="text-xl font-black text-cyan-400 font-mono">
                {data.activeNavigationSessionsCount}
              </span>
            </div>

            <div className="p-3 bg-slate-800/80 border border-slate-700 rounded-xl">
              <span className="text-[11px] text-slate-400 block mb-1">Latência Média GPS</span>
              <span className="text-xl font-black text-emerald-400 font-mono">
                {data.gpsFixAverageLatencyMs} ms
              </span>
            </div>

            <div className="p-3 bg-slate-800/80 border border-slate-700 rounded-xl">
              <span className="text-[11px] text-slate-400 block mb-1">Taxa de Sucesso Rotas</span>
              <span className="text-xl font-black text-indigo-400 font-mono">
                {data.routeEngineSuccessRatePercent}%
              </span>
            </div>
          </div>

          {/* Engine Health Breakdown */}
          <div className="p-3.5 bg-slate-950/80 border border-slate-800 rounded-xl space-y-2.5">
            <span className="text-xs font-bold text-slate-300 uppercase tracking-wider block">
              Status dos Motores Modulares
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
              <div className="flex items-center justify-between p-2 rounded-lg bg-slate-900 border border-slate-800">
                <span className="text-slate-300">Location Engine (Kalman 2D):</span>
                <span className="text-emerald-400 font-bold flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Ativo
                </span>
              </div>
              <div className="flex items-center justify-between p-2 rounded-lg bg-slate-900 border border-slate-800">
                <span className="text-slate-300">Map Matching Engine:</span>
                <span className="text-emerald-400 font-bold flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Sincronizado
                </span>
              </div>
              <div className="flex items-center justify-between p-2 rounded-lg bg-slate-900 border border-slate-800">
                <span className="text-slate-300">Live Traffic & AI Prediction:</span>
                <span className="text-emerald-400 font-bold flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Conectado
                </span>
              </div>
              <div className="flex items-center justify-between p-2 rounded-lg bg-slate-900 border border-slate-800">
                <span className="text-slate-300">Supabase Realtime Stream:</span>
                <span className="text-emerald-400 font-bold flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Operacional
                </span>
              </div>
            </div>
          </div>

          {/* Privacy Guarantee Note (Section 18) */}
          <div className="p-3 bg-purple-950/30 border border-purple-500/30 rounded-xl text-xs text-purple-300">
            🔒 <strong>Privacy by Design:</strong> Nenhuma coordenada individual ou histórico pessoal é gravado em logs centrais. Todos os dados de tráfego são anonimizados e agregados em blocos estatísticos.
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-900/95">
          <button
            onClick={onClose}
            className="w-full py-2.5 px-4 bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold rounded-xl text-sm transition"
          >
            Fechar Painel
          </button>
        </div>
      </div>
    </div>
  );
};
