import React, { useState } from 'react';
import type { RegionHistoryData, Coordinates } from '../../types';
import { 
  HISTORICAL_REGIONS_DATABASE, 
  getNearestRegionHistory, 
  searchRegionHistory 
} from '../../services/historyCultureService';
import { 
  X, 
  Landmark, 
  Search, 
  BookOpen, 
  Calendar, 
  Users, 
  Sparkles, 
  ShieldCheck, 
  MapPin, 
  Compass, 
  Building2,
  Volume2
} from 'lucide-react';

interface ConhecaEsteLugarModalProps {
  isOpen: boolean;
  onClose: () => void;
  userCoords: Coordinates | null;
  selectedRegion?: RegionHistoryData | null;
}

export const ConhecaEsteLugarModal: React.FC<ConhecaEsteLugarModalProps> = ({
  isOpen,
  onClose,
  userCoords,
  selectedRegion
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeRegion, setActiveRegion] = useState<RegionHistoryData>(() => {
    if (selectedRegion) return selectedRegion;
    if (userCoords) return getNearestRegionHistory(userCoords);
    return HISTORICAL_REGIONS_DATABASE[0];
  });
  const [isSpeaking, setIsSpeaking] = useState(false);

  if (!isOpen) return null;

  const searchResults = searchQuery ? searchRegionHistory(searchQuery) : HISTORICAL_REGIONS_DATABASE;

  const handleSpeakHistory = () => {
    if (!('speechSynthesis' in window)) return;
    
    if (isSpeaking) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
      return;
    }

    const textToRead = `${activeRegion.regionName}, ${activeRegion.city}. ${activeRegion.originStory} ${activeRegion.urbanEvolution} Patrimônio cultural: ${activeRegion.culturalHeritage}`;
    const utterance = new SpeechSynthesisUtterance(textToRead);
    utterance.lang = 'pt-BR';
    utterance.rate = 1.0;
    
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);

    window.speechSynthesis.speak(utterance);
    setIsSpeaking(true);
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fade-in">
      <div className="bg-slate-900 border border-amber-500/30 w-full max-w-2xl rounded-3xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="p-5 bg-gradient-to-r from-slate-900 via-amber-950/40 to-slate-900 border-b border-amber-500/20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 shadow-inner">
              <Landmark className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-bold text-white tracking-wide">CONHEÇA ESTE LUGAR</h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold tracking-wider bg-amber-500/20 text-amber-300 border border-amber-500/30 uppercase">
                  DADO HISTÓRICO VERIFICADO
                </span>
              </div>
              <p className="text-xs text-slate-400">História, cultura, patrimônio e formação urbana</p>
            </div>
          </div>
          <button 
            onClick={() => {
              if (isSpeaking && 'speechSynthesis' in window) {
                window.speechSynthesis.cancel();
              }
              onClose();
            }}
            className="w-9 h-9 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search Bar & Region Switcher */}
        <div className="p-4 bg-slate-950/60 border-b border-slate-800">
          <div className="relative mb-3">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input 
              type="text"
              placeholder="Pesquisar história de bairros, cidades ou comunidades..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-slate-800/80 border border-slate-700 rounded-xl text-sm text-white placeholder-slate-400 focus:outline-none focus:border-amber-500/50"
            />
          </div>

          <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-thin">
            {searchResults.map(region => (
              <button
                key={region.id}
                onClick={() => {
                  setActiveRegion(region);
                  if (isSpeaking && 'speechSynthesis' in window) {
                    window.speechSynthesis.cancel();
                    setIsSpeaking(false);
                  }
                }}
                className={`px-3 py-1.5 rounded-xl text-xs whitespace-nowrap font-medium transition-all flex items-center gap-1.5 ${
                  activeRegion.id === region.id
                    ? 'bg-amber-500 text-slate-950 font-bold shadow-md'
                    : 'bg-slate-800/80 hover:bg-slate-700 text-slate-300'
                }`}
              >
                <MapPin className="w-3.5 h-3.5" />
                <span>{region.regionName}</span>
                {region.category === 'comunidade' && (
                  <span className="text-[9px] px-1 py-0.2 rounded bg-purple-500/30 text-purple-200">
                    Comunidade
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Region Detail Content */}
        <div className="p-6 overflow-y-auto space-y-5 flex-1 scrollbar-thin">
          
          {/* Main Title & Audio Narration */}
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-2xl font-black text-white tracking-wide">
                  {activeRegion.regionName}
                </h2>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-800 text-amber-400 border border-amber-500/30">
                  {activeRegion.city} - {activeRegion.state}
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-1 flex items-center gap-2">
                {activeRegion.foundationYear && (
                  <span className="flex items-center gap-1 text-slate-300">
                    <Calendar className="w-3.5 h-3.5 text-amber-400" />
                    Fundação / Registros: {activeRegion.foundationYear}
                  </span>
                )}
                {activeRegion.populationInfo && (
                  <span className="flex items-center gap-1 text-slate-300">
                    <Users className="w-3.5 h-3.5 text-cyan-400" />
                    {activeRegion.populationInfo}
                  </span>
                )}
              </p>
            </div>

            <button
              onClick={handleSpeakHistory}
              className={`px-3.5 py-2 rounded-2xl text-xs font-bold transition-all flex items-center gap-2 shadow-md ${
                isSpeaking
                  ? 'bg-red-500/20 text-red-400 border border-red-500/40 animate-pulse'
                  : 'bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40'
              }`}
              title="Ouvir narrativa histórica"
            >
              <Volume2 className="w-4 h-4" />
              <span>{isSpeaking ? 'Parar Áudio' : 'Ouvir História'}</span>
            </button>
          </div>

          {/* Origem e Fundação */}
          <div className="bg-slate-800/60 border border-slate-700/80 rounded-2xl p-4">
            <div className="flex items-center gap-2 text-amber-400 font-bold text-sm mb-2">
              <BookOpen className="w-4 h-4" />
              <span>Origem e Fundação Histórica</span>
            </div>
            <p className="text-sm text-slate-200 leading-relaxed">
              {activeRegion.originStory}
            </p>
          </div>

          {/* Evolução Urbana */}
          <div className="bg-slate-800/60 border border-slate-700/80 rounded-2xl p-4">
            <div className="flex items-center gap-2 text-cyan-400 font-bold text-sm mb-2">
              <Building2 className="w-4 h-4" />
              <span>Evolução Urbana e Desenvolvimento</span>
            </div>
            <p className="text-sm text-slate-200 leading-relaxed">
              {activeRegion.urbanEvolution}
            </p>
          </div>

          {/* Patrimônio Cultural e Curiosidades */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-slate-800/40 border border-slate-700/60 rounded-2xl p-4">
              <div className="flex items-center gap-2 text-yellow-400 font-bold text-xs mb-2">
                <Landmark className="w-4 h-4" />
                <span>Patrimônio e Cultura</span>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">
                {activeRegion.culturalHeritage}
              </p>
            </div>

            <div className="bg-slate-800/40 border border-slate-700/60 rounded-2xl p-4">
              <div className="flex items-center gap-2 text-purple-400 font-bold text-xs mb-2">
                <Sparkles className="w-4 h-4" />
                <span>Curiosidades Locais</span>
              </div>
              <ul className="text-xs text-slate-300 space-y-1 list-disc list-inside">
                {activeRegion.curiosities.map((c, i) => (
                  <li key={i}>{c}</li>
                ))}
              </ul>
            </div>
          </div>

          {/* Marcos Cronológicos */}
          {activeRegion.importantEvents && activeRegion.importantEvents.length > 0 && (
            <div className="bg-slate-950/60 border border-slate-800 rounded-2xl p-4">
              <div className="flex items-center gap-2 text-amber-400 font-bold text-xs mb-2">
                <Compass className="w-4 h-4" />
                <span>Linha do Tempo e Acontecimentos Marcantes</span>
              </div>
              <div className="space-y-2">
                {activeRegion.importantEvents.map((evt, i) => (
                  <div key={i} className="flex items-start gap-2 text-xs text-slate-300">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-400 mt-1.5 shrink-0" />
                    <span>{evt}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Fontes Fidedignas */}
          <div className="bg-slate-950/40 border border-slate-800/80 rounded-2xl p-3 flex items-center justify-between text-xs text-slate-400">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>Fontes: {activeRegion.sources.join(', ')}</span>
            </div>
            <span className="text-[10px] text-slate-500">Sem estereótipos • Dados públicos</span>
          </div>

        </div>

      </div>
    </div>
  );
};
