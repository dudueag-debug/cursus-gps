import React, { useState } from 'react';
import { Sparkles, Eye, Video, Smartphone, Wrench, XCircle, Activity, ShieldAlert, Cpu } from 'lucide-react';
import { FutureIntegrationRegistry } from '../../services/futureContracts';

interface FutureTechModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const FutureTechModal: React.FC<FutureTechModalProps> = ({ isOpen, onClose }) => {
  const [activeTab, setActiveTab] = useState<'ar' | 'dashcam' | 'auto' | 'mecanica'>('ar');
  const mecanicaStatus = FutureIntegrationRegistry.getMecanica40Status();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/85 backdrop-blur-md p-4 animate-fade-in">
      <div className="bg-slate-900 border border-slate-700/80 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-900/90">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-gradient-to-tr from-cyan-500 to-blue-600 text-white shadow-md">
              <Cpu className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                Laboratório Tecnológico CURSUS
              </h2>
              <p className="text-xs text-slate-400">
                Próxima geração: AR, Dashcam, CarPlay & Mecânica 4.0 IA
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

        {/* Tab Navigation */}
        <div className="flex border-b border-slate-800 bg-slate-950/60 p-1 gap-1">
          {[
            { id: 'ar', label: '👓 AR Nav', icon: Eye },
            { id: 'dashcam', label: '📹 Dashcam', icon: Video },
            { id: 'auto', label: '🚗 CarPlay/Auto', icon: Smartphone },
            { id: 'mecanica', label: '🔧 Mecânica 4.0', icon: Wrench },
          ].map(tab => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex-1 py-2 px-1 text-xs font-semibold rounded-lg flex items-center justify-center gap-1.5 transition ${
                  activeTab === tab.id
                    ? 'bg-blue-600 text-white shadow-md'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                }`}
              >
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Content */}
        <div className="p-4 overflow-y-auto space-y-4 text-slate-200">
          {activeTab === 'ar' && (
            <div className="space-y-3">
              <div className="relative rounded-xl overflow-hidden border border-cyan-500/40 bg-slate-950 p-6 flex flex-col items-center justify-center text-center gap-3">
                <div className="w-16 h-16 rounded-full bg-cyan-500/20 border border-cyan-400 flex items-center justify-center text-cyan-300 animate-pulse">
                  <Eye className="w-8 h-8" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-cyan-300">Navegação em Realidade Aumentada (AR HUD)</h3>
                  <p className="text-xs text-slate-400 mt-1 max-w-xs">
                    Setas tridimensionais e alertas de faixa projetados diretamente na imagem da câmera frontal do seu smartphone ou para-brisa.
                  </p>
                </div>
                <span className="px-3 py-1 bg-cyan-950 text-cyan-300 border border-cyan-500/40 text-[11px] font-bold rounded-full">
                  Contrato de Interface V2.0 Ativo
                </span>
              </div>
            </div>
          )}

          {activeTab === 'dashcam' && (
            <div className="space-y-3">
              <div className="p-4 bg-slate-800/80 border border-slate-700 rounded-xl space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-white flex items-center gap-1.5">
                    <Video className="w-4 h-4 text-emerald-400" />
                    Dashcam & Visão Computacional
                  </span>
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-950 text-emerald-300 border border-emerald-500/30">
                    Standby
                  </span>
                </div>
                <p className="text-xs text-slate-300">
                  Gravação contínua em loop com detecção inteligente de buracos, objetos na pista e avisos de frenagem de emergência.
                </p>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="p-2 bg-slate-900 rounded-lg border border-slate-800">
                    <span className="text-slate-400 block text-[10px]">Gravação em Loop:</span>
                    <span className="font-semibold text-slate-200">1080p @ 60fps</span>
                  </div>
                  <div className="p-2 bg-slate-900 rounded-lg border border-slate-800">
                    <span className="text-slate-400 block text-[10px]">Alerta de Colisão:</span>
                    <span className="font-semibold text-slate-200">IA Ativa (0.3s)</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'auto' && (
            <div className="space-y-3">
              <div className="p-4 bg-slate-800/80 border border-slate-700 rounded-xl space-y-3">
                <span className="text-xs font-bold text-white flex items-center gap-1.5">
                  <Smartphone className="w-4 h-4 text-indigo-400" />
                  Projeção Automotiva (Android Auto / CarPlay)
                </span>
                <p className="text-xs text-slate-300">
                  Interface minimalista de alto contraste otimizada para telas de multimídia automotiva de 7" a 15", com suporte a controle por botão rotativo no volante.
                </p>
                <div className="p-3 bg-slate-900 rounded-lg border border-slate-800 text-xs text-slate-400">
                  🚗 <strong className="text-slate-200">Pronto para Conexão:</strong> O Cursus GPS exporta dados de manobra padronizados via WebSocket e IPC.
                </div>
              </div>
            </div>
          )}

          {activeTab === 'mecanica' && (
            <div className="space-y-3">
              <div className="p-4 bg-slate-800/80 border border-purple-500/40 rounded-xl space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-purple-300 flex items-center gap-1.5">
                    <Wrench className="w-4 h-4" />
                    Integração com Mecânica 4.0 IA
                  </span>
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-purple-950 text-purple-300 border border-purple-500/30">
                    OBD-II Pronto
                  </span>
                </div>
                <p className="text-xs text-slate-300">
                  {mecanicaStatus.recommendation}
                </p>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="p-2 bg-slate-900 rounded-lg border border-slate-800">
                    <span className="text-slate-400 block text-[10px]">Temperatura do Motor:</span>
                    <span className="font-semibold text-emerald-400">{mecanicaStatus.coolantTempCelsius}°C (Normal)</span>
                  </div>
                  <div className="p-2 bg-slate-900 rounded-lg border border-slate-800">
                    <span className="text-slate-400 block text-[10px]">Tensão da Bateria:</span>
                    <span className="font-semibold text-emerald-400">{mecanicaStatus.batteryVoltage}V (Saudável)</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-900/95">
          <button
            onClick={onClose}
            className="w-full py-2.5 px-4 bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold rounded-xl text-sm transition"
          >
            Fechar Laboratório
          </button>
        </div>
      </div>
    </div>
  );
};
