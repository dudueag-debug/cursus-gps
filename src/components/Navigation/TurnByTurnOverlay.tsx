import React, { useEffect, useState } from 'react';
import { 
  ArrowUpRight, 
  ArrowUpLeft, 
  ArrowUp, 
  RotateCw, 
  Flag, 
  Volume2, 
  VolumeX, 
  X, 
  Gauge,
  ShieldAlert
} from 'lucide-react';
import { RouteOption } from '../../types';

import { NavigationEngine, type IntersectionDetail } from '../../engines/navigationEngine';
import type { RerouteOpportunity } from '../../engines/aiPredictionEngine';

interface TurnByTurnOverlayProps {
  route: RouteOption;
  onExitNavigation: () => void;
  enableVoice: boolean;
  isRecalculating?: boolean;
  liveSpeedKmh?: number;
  remainingDistanceMeters?: number;
  currentStreetName?: string;
  rerouteOpportunity?: RerouteOpportunity | null;
  onAcceptReroute?: (newRoute: RouteOption) => void;
  onDismissReroute?: () => void;
  isDeadReckoning?: boolean;
  providerName?: string;
}

export const TurnByTurnOverlay: React.FC<TurnByTurnOverlayProps> = ({
  route,
  onExitNavigation,
  enableVoice: initialEnableVoice,
  isRecalculating = false,
  liveSpeedKmh = 0,
  remainingDistanceMeters,
  currentStreetName,
  rerouteOpportunity,
  onAcceptReroute,
  onDismissReroute,
  isDeadReckoning = false,
  providerName = 'OSRM Open Cartography (Brasil)',
}) => {
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const speed = Math.round(liveSpeedKmh && liveSpeedKmh > 0 ? liveSpeedKmh : 0);
  const [voiceActive, setVoiceActive] = useState(initialEnableVoice);

  const step = route.steps[currentStepIndex] || route.steps[0] || {
    instruction: 'Continue na rota guiada',
    distanceMeters: 400,
    durationSeconds: 30,
    maneuver: 'continue',
    streetName: currentStreetName || 'Via Principal',
  };

  const intersection = NavigationEngine.evaluateIntersectionMode(step.distanceMeters, step);

  // Web Speech synthesis voice instruction
  const speakInstruction = (text: string) => {
    if (!voiceActive || typeof window === 'undefined' || !window.speechSynthesis) return;
    try {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'pt-BR';
      utterance.rate = 1.05;
      window.speechSynthesis.speak(utterance);
    } catch (e) {
      console.warn('Speech synthesis not available:', e);
    }
  };

  useEffect(() => {
    if (step) {
      const natural = NavigationEngine.formatNaturalSpokenInstruction(step);
      speakInstruction(natural);
    }
  }, [currentStepIndex, voiceActive]);

  const getManeuverIcon = (maneuver: string) => {
    switch (maneuver) {
      case 'turn-left':
        return <ArrowUpLeft className="w-9 h-9 text-lime-400" />;
      case 'turn-right':
        return <ArrowUpRight className="w-9 h-9 text-lime-400" />;
      case 'roundabout':
        return <RotateCw className="w-9 h-9 text-lime-400" />;
      case 'arrive':
        return <Flag className="w-9 h-9 text-emerald-400" />;
      default:
        return <ArrowUp className="w-9 h-9 text-lime-400" />;
    }
  };

  const displayDistance = remainingDistanceMeters !== undefined
    ? (remainingDistanceMeters > 1000 ? `${(remainingDistanceMeters / 1000).toFixed(1)} km` : `${remainingDistanceMeters} m`)
    : `${(route.totalDistanceMeters / 1000).toFixed(1)} km`;

  return (
    <div className="absolute top-0 left-0 right-0 z-30 pointer-events-none p-3 sm:p-4 flex flex-col justify-between h-full">
      {/* Top Navigation Banner */}
      <div className="pointer-events-auto max-w-xl mx-auto w-full flex flex-col gap-2">
        {/* Smart Rerouting Opportunity Prompt (Section 9) */}
        {rerouteOpportunity && (
          <div className="bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 border-2 border-cyan-400 text-white p-3.5 rounded-2xl shadow-2xl flex flex-col gap-2 animate-fade-in">
            <div className="flex items-center justify-between">
              <span className="font-extrabold text-xs text-cyan-300 flex items-center gap-1.5 uppercase">
                🚀 {rerouteOpportunity.promptTitle}
              </span>
              <span className="text-[11px] font-black px-2 py-0.5 rounded-full bg-lime-400 text-slate-950">
                - {rerouteOpportunity.timeSavedMinutes} min
              </span>
            </div>
            <p className="text-xs text-slate-200">
              {rerouteOpportunity.promptDescription}
            </p>
            <div className="flex items-center gap-2 pt-1">
              <button
                onClick={() => onAcceptReroute?.(rerouteOpportunity.alternativeRoute)}
                className="flex-1 py-2 px-3 bg-gradient-to-r from-lime-400 to-emerald-400 text-slate-950 font-black text-xs rounded-xl shadow-md active:scale-95 transition"
              >
                [ ACEITAR NOVA ROTA ]
              </button>
              <button
                onClick={() => onDismissReroute?.()}
                className="py-2 px-3 bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs rounded-xl transition"
              >
                [ MANTER ATUAL ]
              </button>
            </div>
          </div>
        )}

        {/* Recalculating alert banner */}
        {isRecalculating && (
          <div className="bg-amber-500 text-slate-950 px-4 py-2 rounded-xl font-bold text-xs flex items-center justify-center gap-2 shadow-lg animate-pulse">
            <RotateCw className="w-4 h-4 animate-spin" />
            <span>Recalculando rota inteligente...</span>
          </div>
        )}

        {/* Dead Reckoning / Tunnel Active Alert (Rule of Truth & Continuity) */}
        {isDeadReckoning && (
          <div className="bg-indigo-600/90 border border-indigo-400 text-white px-3.5 py-1.5 rounded-xl font-bold text-xs flex items-center justify-between gap-2 shadow-lg backdrop-blur-md animate-pulse">
            <div className="flex items-center gap-2">
              <span className="text-sm">🚇</span>
              <span>Projeção Inercial Ativa em Túnel (Dead Reckoning)</span>
            </div>
            <span className="text-[10px] text-indigo-200 uppercase tracking-wider font-extrabold">GPS Simulador Off</span>
          </div>
        )}

        <div className="bg-slate-950/95 backdrop-blur-lg border border-slate-700/80 rounded-2xl p-4 shadow-2xl flex items-center justify-between gap-3 text-white">
          <div className="flex items-center gap-3.5">
            <div className="w-14 h-14 rounded-2xl bg-blue-900/60 border border-blue-500/40 flex items-center justify-center shadow-inner shrink-0">
              {getManeuverIcon(step.maneuver)}
            </div>
            <div>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-black text-lime-400">
                  {step.distanceMeters > 0 ? `${step.distanceMeters} m` : 'Chegando'}
                </span>
                <span className="text-xs uppercase font-bold text-slate-400">
                  {step.maneuver === 'arrive' ? 'Destino Final' : 'Próxima manobra'}
                </span>
              </div>
              <p className="text-sm font-semibold text-slate-100 line-clamp-1">
                {step.instruction}
              </p>
              {step.streetName && (
                <p className="text-[11px] text-slate-400 line-clamp-1">
                  {step.streetName}
                </p>
              )}
            </div>
          </div>

          {/* Voice and Quick Controls */}
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => {
                if (step) {
                  const natural = NavigationEngine.formatNaturalSpokenInstruction(step);
                  speakInstruction(natural);
                }
              }}
              className="p-2.5 rounded-xl border border-slate-700 bg-slate-800 hover:bg-slate-700 text-slate-300 transition-all active:scale-95"
              title="Repetir Instrução de Voz"
            >
              <RotateCw className="w-5 h-5 text-cyan-400" />
            </button>
            <button
              onClick={() => setVoiceActive(!voiceActive)}
              className={`p-2.5 rounded-xl border transition-all ${
                voiceActive
                  ? 'bg-blue-600/30 border-blue-500 text-blue-300'
                  : 'bg-slate-800 border-slate-700 text-slate-400'
              }`}
              title={voiceActive ? 'Silenciar Voz' : 'Ativar Voz'}
            >
              {voiceActive ? <Volume2 className="w-5 h-5 text-lime-400" /> : <VolumeX className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Discrete Intelligent Reroute Notification (Prompt Requirement 2) */}
        {rerouteOpportunity && (
          <div className="bg-slate-950/98 border-2 border-lime-400/80 rounded-2xl p-3 shadow-2xl backdrop-blur-xl animate-in slide-in-from-top-2 duration-300 text-white space-y-2">
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-lime-400/20 border border-lime-400/40 flex items-center justify-center text-lime-400 shrink-0 shadow-sm">
                  <Flag className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-[10px] uppercase font-black tracking-wider text-lime-400 block">
                    ⚡ Alternativa mais rápida disponível
                  </span>
                  <div className="text-xs font-black text-white">
                    Economia de ~{rerouteOpportunity.timeSavedMinutes ?? Math.max(1, Math.round((rerouteOpportunity.timeSavedSeconds || 180) / 60))} min • Diferença: {(rerouteOpportunity.distanceDeltaKm ?? ((rerouteOpportunity.distanceDiffMeters || 0) / 1000)) > 0 ? `+${(rerouteOpportunity.distanceDeltaKm ?? ((rerouteOpportunity.distanceDiffMeters || 0) / 1000)).toFixed(1)} km` : `${(rerouteOpportunity.distanceDeltaKm ?? ((rerouteOpportunity.distanceDiffMeters || 0) / 1000)).toFixed(1)} km`}
                  </div>
                </div>
              </div>

              <span className="text-[10px] text-slate-400 font-mono hidden sm:inline">
                {rerouteOpportunity.reason}
              </span>
            </div>

            <div className="flex items-center gap-2 pt-1">
              <button
                onClick={() => onAcceptReroute?.(rerouteOpportunity.alternativeRoute)}
                className="flex-1 py-2 px-3 rounded-xl bg-lime-400 hover:bg-lime-300 text-slate-950 font-black text-xs shadow-md active:scale-95 transition-all text-center"
              >
                Ver Alternativa
              </button>
              <button
                onClick={() => onDismissReroute?.()}
                className="py-2 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs border border-slate-700 active:scale-95 transition-all"
              >
                Manter minha rota
              </button>
            </div>
          </div>
        )}

        {/* Complex Intersections Mode Visualizer (Section 11) */}
        {intersection.isApproaching && intersection.recommendedLanes.length > 0 && (
          <div className="bg-slate-950/95 border border-cyan-500/50 rounded-xl p-2.5 shadow-lg flex items-center justify-between gap-3 text-white animate-fade-in">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-cyan-300">🚦 Faixa Recomendada:</span>
              <div className="flex items-center gap-1">
                {intersection.recommendedLanes.map((lane, idx) => (
                  <span
                    key={idx}
                    className={`px-2 py-0.5 rounded text-[11px] font-black border ${
                      lane.isOptimal
                        ? 'bg-lime-400 text-slate-950 border-lime-300 shadow-sm'
                        : 'bg-slate-800 text-slate-500 border-slate-700'
                    }`}
                  >
                    {lane.direction === 'left' ? '⬅️' : lane.direction === 'right' ? '➡️' : '⬆️'} Faixa {idx + 1}
                  </span>
                ))}
              </div>
            </div>
            <span className="text-[10px] text-slate-400 hidden sm:inline">{intersection.laneGuidanceText}</span>
          </div>
        )}
      </div>

      {/* Safety Notice & Bottom Navigation HUD */}
      <div className="pointer-events-auto max-w-xl mx-auto w-full flex flex-col gap-2">
        {/* Speedometer, ETA, Distance & Big ENCERRAR Button */}
        <div className="bg-slate-950/95 backdrop-blur-lg border border-slate-700/80 rounded-2xl p-3.5 shadow-2xl flex items-center justify-between gap-3 text-white">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 bg-slate-900 px-3 py-1.5 rounded-xl border border-slate-800">
              <Gauge className="w-4 h-4 text-lime-400" />
              <span className="font-mono text-lg font-black text-white">{speed}</span>
              <span className="text-[10px] text-slate-400 font-bold">km/h</span>
            </div>

            <div className="flex flex-col">
              <div className="flex items-baseline gap-1.5">
                <span className="text-base font-black text-white">{Math.round(route.totalDurationSeconds / 60)} min</span>
                <span className="text-xs text-slate-400 font-medium">({displayDistance})</span>
              </div>
              <div className="text-[11px] font-bold text-lime-400">
                Chegada: {route.eta}
              </div>
            </div>
          </div>

          {/* Prominent Red ENCERRAR Button as required by Section 7 */}
          <button
            onClick={onExitNavigation}
            className="px-5 py-3 rounded-xl bg-red-600 hover:bg-red-500 text-white font-black text-xs uppercase tracking-wider shadow-lg shadow-red-600/30 active:scale-95 transition-all flex items-center gap-1.5 cursor-pointer shrink-0"
          >
            <X className="w-4 h-4" />
            <span>ENCERRAR</span>
          </button>
        </div>

        {/* Rule of Truth Cartographic Provider Seal */}
        <div className="flex items-center justify-center gap-2 text-[10px] text-slate-500 font-medium pb-1">
          <span>🗺️ {providerName}</span>
          <span>•</span>
          <span>TÔ PASSANDO Cursus Engine</span>
        </div>
      </div>
    </div>
  );
};
