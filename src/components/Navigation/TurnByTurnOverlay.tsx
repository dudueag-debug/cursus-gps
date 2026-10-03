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

interface TurnByTurnOverlayProps {
  route: RouteOption;
  onExitNavigation: () => void;
  enableVoice: boolean;
}

export const TurnByTurnOverlay: React.FC<TurnByTurnOverlayProps> = ({
  route,
  onExitNavigation,
  enableVoice: initialEnableVoice,
}) => {
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [speed, setSpeed] = useState(48);
  const [voiceActive, setVoiceActive] = useState(initialEnableVoice);

  const step = route.steps[currentStepIndex] || route.steps[0] || {
    instruction: 'Continue na rota guiada',
    distanceMeters: 400,
    durationSeconds: 30,
    maneuver: 'continue',
  };

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
      speakInstruction(`${step.instruction}`);
    }
  }, [currentStepIndex, voiceActive]);

  // Simulate progress through route steps and speed variations
  useEffect(() => {
    const timer = setInterval(() => {
      setSpeed(prev => Math.min(65, Math.max(30, prev + Math.floor(Math.random() * 7 - 3))));
    }, 2000);

    const stepAdvancer = setInterval(() => {
      setCurrentStepIndex(prev => {
        if (prev < route.steps.length - 1) {
          return prev + 1;
        }
        return prev;
      });
    }, 12000);

    return () => {
      clearInterval(timer);
      clearInterval(stepAdvancer);
    };
  }, [route.steps.length]);

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

  return (
    <div className="absolute top-0 left-0 right-0 z-30 pointer-events-none p-3 sm:p-4 flex flex-col justify-between h-full">
      {/* Top Navigation Banner */}
      <div className="pointer-events-auto max-w-xl mx-auto w-full bg-slate-950/95 backdrop-blur-lg border border-slate-700/80 rounded-2xl p-4 shadow-2xl flex items-center justify-between gap-3 text-white">
        <div className="flex items-center gap-3.5">
          <div className="w-14 h-14 rounded-2xl bg-blue-900/60 border border-blue-500/40 flex items-center justify-center shadow-inner">
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
          </div>
        </div>

        {/* Voice and Close controls */}
        <div className="flex items-center gap-1.5">
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

          <button
            onClick={onExitNavigation}
            className="p-2.5 rounded-xl bg-red-600/20 hover:bg-red-600/30 border border-red-500/40 text-red-300 transition-all"
            title="Encerrar Navegação"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Safety Notice & Speedometer HUD at Bottom */}
      <div className="pointer-events-auto max-w-xl mx-auto w-full flex flex-col gap-2">
        {/* Anti-distraction Road Safety Banner */}
        <div className="bg-slate-950/85 backdrop-blur-md border border-slate-800 px-3 py-1.5 rounded-xl flex items-center justify-center gap-2 text-[11px] text-slate-400">
          <ShieldAlert className="w-3.5 h-3.5 text-amber-400 shrink-0" />
          <span>Direção Segura: Comandos visuais otimizados. Não mexa no aparelho em movimento.</span>
        </div>

        {/* Speed & ETA Bar */}
        <div className="bg-slate-950/95 backdrop-blur-lg border border-slate-700/80 rounded-2xl p-3.5 shadow-2xl flex items-center justify-between text-white">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 bg-slate-900 px-3 py-1.5 rounded-xl border border-slate-800">
              <Gauge className="w-4 h-4 text-lime-400" />
              <span className="font-mono text-lg font-black text-white">{speed}</span>
              <span className="text-[10px] text-slate-400 font-bold">km/h</span>
            </div>
            <div>
              <div className="text-[10px] font-bold uppercase text-slate-400">Tempo Restante</div>
              <div className="text-sm font-bold text-slate-100">
                {Math.round(route.totalDurationSeconds / 60)} min
              </div>
            </div>
          </div>

          <div className="text-right">
            <div className="text-[10px] font-bold uppercase text-slate-400">Chegada Prevista</div>
            <div className="text-sm font-black text-lime-400">{route.eta}</div>
          </div>
        </div>
      </div>
    </div>
  );
};
