import React from 'react';
import { Mic, MicOff, Volume2, Sparkles, X, Compass, AlertTriangle, ShieldCheck, MapPin } from 'lucide-react';

interface VoiceCommandModalProps {
  isOpen: boolean;
  onClose: () => void;
  isListening: boolean;
  transcript: string;
  lastActionMessage: string;
  onToggleListening: () => void;
  onExecuteSampleCommand: (phrase: string) => void;
}

export const VoiceCommandModal: React.FC<VoiceCommandModalProps> = ({
  isOpen,
  onClose,
  isListening,
  transcript,
  lastActionMessage,
  onToggleListening,
  onExecuteSampleCommand,
}) => {
  if (!isOpen) return null;

  const sampleCommands = [
    { text: 'Ir para Avenida Paulista', icon: <MapPin className="w-3.5 h-3.5 text-lime-400" /> },
    { text: 'Hospital mais próximo', icon: <Compass className="w-3.5 h-3.5 text-red-400" /> },
    { text: 'Posto de gasolina', icon: <Compass className="w-3.5 h-3.5 text-amber-400" /> },
    { text: 'Iniciar navegação', icon: <Sparkles className="w-3.5 h-3.5 text-cyan-400" /> },
    { text: 'Ocorrências na via', icon: <AlertTriangle className="w-3.5 h-3.5 text-amber-400" /> },
    { text: 'Partida segura', icon: <ShieldCheck className="w-3.5 h-3.5 text-lime-400" /> },
    { text: 'Centralizar mapa', icon: <Compass className="w-3.5 h-3.5 text-blue-400" /> },
  ];

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-700/80 rounded-3xl w-full max-w-lg p-6 shadow-2xl flex flex-col items-center gap-5 text-white text-center relative overflow-hidden">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-slate-400 hover:text-white rounded-full transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="flex flex-col items-center gap-1">
          <div className="flex items-center gap-2">
            <span className="font-black text-lg tracking-tight text-white">Comando de Voz Inteligente</span>
            <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-lime-400/20 text-lime-300 border border-lime-400/30">
              CURSUS AI
            </span>
          </div>
          <p className="text-xs text-slate-400 max-w-xs">
            Controle o GPS por voz com total segurança enquanto dirige.
          </p>
        </div>

        {/* Giant Glowing Microphone Button */}
        <div className="relative my-2 flex items-center justify-center">
          {/* Pulsing neon waves when listening */}
          {isListening && (
            <>
              <div className="absolute w-36 h-36 rounded-full bg-lime-400/20 animate-ping opacity-60 pointer-events-none" />
              <div className="absolute w-28 h-28 rounded-full bg-cyan-400/30 animate-pulse pointer-events-none" />
            </>
          )}

          <button
            onClick={onToggleListening}
            className={`relative z-10 w-24 h-24 rounded-full flex flex-col items-center justify-center shadow-2xl transition-all active:scale-95 ${
              isListening
                ? 'bg-gradient-to-tr from-lime-400 via-lime-500 to-emerald-400 text-slate-950 shadow-lime-500/50 scale-105'
                : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border-2 border-slate-600'
            }`}
          >
            {isListening ? (
              <>
                <Mic className="w-10 h-10 animate-bounce" />
                <span className="text-[10px] font-black uppercase mt-1">Ouvindo...</span>
              </>
            ) : (
              <>
                <MicOff className="w-9 h-9" />
                <span className="text-[10px] font-bold mt-1">Toque p/ Falar</span>
              </>
            )}
          </button>
        </div>

        {/* Live speech transcription box */}
        <div className="w-full bg-slate-950/90 border border-slate-800 rounded-2xl p-4 min-h-[75px] flex flex-col items-center justify-center">
          {lastActionMessage ? (
            <p className="text-xs font-bold text-lime-400 flex items-center gap-1.5 animate-pulse">
              <Sparkles className="w-4 h-4" />
              <span>{lastActionMessage}</span>
            </p>
          ) : transcript ? (
            <p className="text-sm font-semibold text-slate-100 italic">
              "{transcript}"
            </p>
          ) : (
            <p className="text-xs text-slate-500">
              {isListening ? 'Fale seu destino ou comando...' : 'Pressione o microfone e diga para onde quer ir.'}
            </p>
          )}
        </div>

        {/* Sample voice command chips */}
        <div className="w-full flex flex-col gap-2">
          <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400 text-left">
            Ou toque em um comando rápido:
          </p>
          <div className="flex flex-wrap gap-1.5 justify-center">
            {sampleCommands.map((cmd, idx) => (
              <button
                key={idx}
                onClick={() => onExecuteSampleCommand(cmd.text)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-200 text-xs font-medium border border-slate-700/80 transition-all hover:scale-105"
              >
                {cmd.icon}
                <span>"{cmd.text}"</span>
              </button>
            ))}
          </div>
        </div>

        {/* Safety tip */}
        <div className="pt-2 border-t border-slate-800 w-full text-[11px] text-slate-500 flex items-center justify-center gap-1.5">
          <Volume2 className="w-3.5 h-3.5 text-lime-400" />
          <span>Comandos por voz mantêm suas mãos no volante e olhos na via.</span>
        </div>
      </div>
    </div>
  );
};
