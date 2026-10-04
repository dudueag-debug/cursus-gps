import React, { useState } from 'react';
import { 
  BookOpen, 
  Volume2, 
  VolumeX, 
  MapPin, 
  Sparkles, 
  X,
  ExternalLink
} from 'lucide-react';
import { CultureSpot } from '../../types';

interface CultureModalProps {
  spot: CultureSpot | null;
  allSpots: CultureSpot[];
  isOpen: boolean;
  onClose: () => void;
  onSelectSpot: (spot: CultureSpot) => void;
}

export const CultureModal: React.FC<CultureModalProps> = ({
  spot,
  allSpots,
  isOpen,
  onClose,
  onSelectSpot,
}) => {
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);

  if (!isOpen) return null;

  const current = spot || allSpots[0];

  const handleSpeak = (text: string) => {
    if (typeof window === 'undefined' || !window.speechSynthesis) return;

    if (isPlayingAudio) {
      window.speechSynthesis.cancel();
      setIsPlayingAudio(false);
      return;
    }

    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'pt-BR';
    utterance.rate = 1.0;
    utterance.onend = () => setIsPlayingAudio(false);
    utterance.onerror = () => setIsPlayingAudio(false);
    
    setIsPlayingAudio(true);
    window.speechSynthesis.speak(utterance);
  };

  return (
    <div className="fixed inset-0 z-[9999] bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-xl p-5 shadow-2xl flex flex-col gap-4 text-white max-h-[85vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-start justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-purple-900/40 border border-purple-500/40 flex items-center justify-center">
              <BookOpen className="w-6 h-6 text-purple-300" />
            </div>
            <div>
              <h2 className="text-lg font-black tracking-tight text-white">História e Cultura dos Lugares</h2>
              <p className="text-xs text-slate-400">
                Patrimônio histórico, arquitetura e origens das cidades brasileiras.
              </p>
            </div>
          </div>

          <button onClick={onClose} className="p-1 text-slate-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Spot selection chips if multiple */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
          {allSpots.map(s => (
            <button
              key={s.id}
              onClick={() => {
                if (isPlayingAudio) window.speechSynthesis.cancel();
                setIsPlayingAudio(false);
                onSelectSpot(s);
              }}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                current?.id === s.id
                  ? 'bg-purple-600 text-white shadow-md shadow-purple-600/30'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
              }`}
            >
              {s.title.split(' ')[0]} {s.title.split(' ')[1] || ''}
            </button>
          ))}
        </div>

        {/* Main Content */}
        {current && (
          <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-4 flex flex-col gap-3">
            <div className="flex items-start justify-between gap-2">
              <div>
                <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded bg-purple-900/60 border border-purple-600/40 text-purple-300">
                  {current.category.toUpperCase()}
                </span>
                <h3 className="text-base font-bold text-white mt-1.5">{current.title}</h3>
                <div className="flex items-center gap-1 text-xs text-slate-400 mt-0.5">
                  <MapPin className="w-3.5 h-3.5 text-slate-500" />
                  <span>{current.city} - {current.state}</span>
                </div>
              </div>

              {/* Audio reading button */}
              <button
                onClick={() => handleSpeak(`${current.title}. ${current.fullText}`)}
                className={`p-2.5 rounded-xl border flex items-center gap-1.5 text-xs font-semibold transition-all ${
                  isPlayingAudio
                    ? 'bg-purple-600 border-purple-400 text-white animate-pulse'
                    : 'bg-slate-800 border-slate-700 text-purple-300 hover:bg-slate-700'
                }`}
                title="Ouvir Narração por Voz"
              >
                {isPlayingAudio ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                <span>{isPlayingAudio ? 'Parar Áudio' : 'Ouvir Guia'}</span>
              </button>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed bg-slate-900/60 p-3 rounded-lg border border-slate-800/80">
              {current.fullText}
            </p>

            <div className="text-[11px] text-slate-500 flex items-center justify-between border-t border-slate-900 pt-2">
              <span>Fonte Documentada: {current.source}</span>
              <span className="text-purple-400">Patrimônio Verificado</span>
            </div>
          </div>
        )}

        <div className="flex justify-end pt-2 border-t border-slate-800">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-xl"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
};
