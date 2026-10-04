import React, { useState, useEffect } from 'react';
import { 
  User, 
  Car, 
  Wind, 
  Volume2, 
  Shield, 
  Eye, 
  X, 
  Check, 
  LogOut, 
  Trash2, 
  Sparkles,
  Play
} from 'lucide-react';
import type { UserProfile, VehicleModel, VehicleColor, TransportMode } from '../../types';

interface UserProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: UserProfile;
  onUpdateUser: (updated: UserProfile) => void;
  onLogout: () => void;
}

export const UserProfileModal: React.FC<UserProfileModalProps> = ({
  isOpen,
  onClose,
  user,
  onUpdateUser,
  onLogout,
}) => {
  const [profile, setProfile] = useState<UserProfile>(user);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [availableVoices, setAvailableVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [isPlayingTestVoice, setIsPlayingTestVoice] = useState(false);

  useEffect(() => {
    setProfile(user);
  }, [user]);

  // Load browser voices
  useEffect(() => {
    if (typeof window === 'undefined' || !window.speechSynthesis) return;

    const loadVoices = () => {
      const voices = window.speechSynthesis.getVoices();
      if (voices.length > 0) {
        // Sort: Portuguese voices first, then others alphabetically
        const sorted = [...voices].sort((a, b) => {
          const aIsPt = a.lang.toLowerCase().startsWith('pt');
          const bIsPt = b.lang.toLowerCase().startsWith('pt');
          if (aIsPt && !bIsPt) return -1;
          if (!aIsPt && bIsPt) return 1;
          return a.name.localeCompare(b.name);
        });
        setAvailableVoices(sorted);

        // If no voice selected yet, pick first Portuguese voice if available
        if (!profile.selectedVoiceURI) {
          const defaultPt = sorted.find(v => v.lang.toLowerCase().startsWith('pt'));
          if (defaultPt) {
            setProfile(prev => ({ ...prev, selectedVoiceURI: defaultPt.voiceURI }));
          }
        }
      }
    };

    loadVoices();
    window.speechSynthesis.onvoiceschanged = loadVoices;
  }, []);

  if (!isOpen) return null;

  const handleSave = () => {
    onUpdateUser(profile);
    localStorage.setItem('tp_user_profile', JSON.stringify(profile));
    setSaveSuccess(true);
    setTimeout(() => {
      setSaveSuccess(false);
      onClose();
    }, 800);
  };

  const handleTestVoice = () => {
    if (typeof window === 'undefined' || !window.speechSynthesis) return;
    try {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance('Olá! Eu sou a sua voz do TÔ PASSANDO. Em trezentos metros, vire à direita.');
      utterance.lang = 'pt-BR';
      utterance.rate = profile.voiceRate || 1.05;

      if (profile.selectedVoiceURI) {
        const found = availableVoices.find(v => v.voiceURI === profile.selectedVoiceURI);
        if (found) utterance.voice = found;
      }

      utterance.onstart = () => setIsPlayingTestVoice(true);
      utterance.onend = () => setIsPlayingTestVoice(false);
      utterance.onerror = () => setIsPlayingTestVoice(false);

      window.speechSynthesis.speak(utterance);
    } catch {
      setIsPlayingTestVoice(false);
    }
  };

  const handleClearHistory = () => {
    if (confirm('Deseja realmente limpar seu histórico local de destinos gravados?')) {
      localStorage.removeItem('tp_recent_searches');
      alert('Histórico de rotas limpo com sucesso.');
    }
  };

  const vehicleModels: { id: VehicleModel; label: string; icon: string; desc: string }[] = [
    { id: 'sport', label: 'Superesportivo GT 3D', icon: '🏎️', desc: 'Aerodinâmico com feixe laser e difusores' },
    { id: 'sedan', label: 'Sedan Executivo 3D', icon: '🚗', desc: 'Linhas luxo, teto solar e bi-xenon' },
    { id: 'suv', label: 'SUV 4x4 Premium 3D', icon: '🚙', desc: 'Porte elevado com barras de teto' },
    { id: 'motorcycle_sport', label: 'Superbike 3D', icon: '🏍️', desc: 'Moto esportiva com piloto e farol' },
    { id: 'van', label: 'Van / Utilitário 3D', icon: '🚐', desc: 'Transporte de carga e passageiros' },
    { id: 'walker', label: 'Pedestre 3D', icon: '🚶', desc: 'Navegação para caminhada a pé' },
  ];

  const vehicleColors: { id: VehicleColor; label: string; hex: string }[] = [
    { id: 'lime', label: 'Verde-Limão TÔ PASSANDO', hex: '#CCFF00' },
    { id: 'electric_blue', label: 'Azul Tecnológico', hex: '#00D2FF' },
    { id: 'cyber_yellow', label: 'Amarelo Cyber', hex: '#FFD000' },
    { id: 'ruby_red', label: 'Vermelho Ruby Metálico', hex: '#FF2A55' },
    { id: 'silver', label: 'Prata Titânio', hex: '#E2E8F0' },
    { id: 'stealth_dark', label: 'Preto Stealth Carbono', hex: '#2D3748' },
  ];

  return (
    <div className="fixed inset-0 z-[9999] bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-700 rounded-3xl w-full max-w-xl p-5 shadow-2xl flex flex-col gap-4 text-white max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-start justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-blue-900/40 border border-blue-500/40 flex items-center justify-center">
              <User className="w-6 h-6 text-blue-400" />
            </div>
            <div>
              <h2 className="text-lg font-black tracking-tight text-white">Perfil e Configurações do GPS</h2>
              <p className="text-xs text-slate-400">
                Personalização do veículo 3D, voz da navegação e privacidade LGPD.
              </p>
            </div>
          </div>

          <button onClick={onClose} className="p-1.5 text-slate-400 hover:text-white rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* User Identity Info */}
        <div className="bg-slate-950/70 border border-slate-800 rounded-2xl p-3.5 flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-sm text-slate-100">{profile.name}</span>
              {profile.isGuest && (
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-amber-950 text-amber-300 border border-amber-700">
                  Modo Visitante
                </span>
              )}
            </div>
            <div className="text-xs text-slate-400">@{profile.username} • {profile.email}</div>
          </div>

          <button
            onClick={onLogout}
            className="flex items-center gap-1 text-xs text-slate-400 hover:text-red-400 px-3 py-1.5 rounded-xl border border-slate-800 hover:border-red-900/40 hover:bg-red-950/20 transition-colors"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Alternar Conta</span>
          </button>
        </div>

        {/* 3D Realistic Vehicle Selector */}
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
              <Car className="w-4 h-4 text-lime-400" />
              <span>Modelo do Veículo no Mapa (Render 3D Realista)</span>
            </label>
            <span className="text-[10px] text-lime-400 font-bold bg-lime-950/60 border border-lime-800/60 px-2 py-0.5 rounded-full">
              3D Cockpit
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {vehicleModels.map(m => (
              <button
                key={m.id}
                onClick={() => setProfile({ ...profile, vehicleModel: m.id })}
                className={`p-2.5 rounded-xl border text-left flex flex-col gap-1 transition-all ${
                  profile.vehicleModel === m.id
                    ? 'border-lime-400 bg-lime-400/10 text-lime-300 shadow-md shadow-lime-500/10 scale-[1.02]'
                    : 'border-slate-800 bg-slate-950/60 text-slate-300 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center gap-2">
                  <span className="text-lg">{m.icon}</span>
                  <span className="font-bold text-xs">{m.label}</span>
                </div>
                <span className="text-[10px] text-slate-400 leading-tight">{m.desc}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Realistic Vehicle Color Selector */}
        <div className="flex flex-col gap-2">
          <label className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
            <Sparkles className="w-4 h-4 text-cyan-400" />
            <span>Pintura Metálica 3D do Veículo</span>
          </label>
          <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
            {vehicleColors.map(c => (
              <button
                key={c.id}
                onClick={() => setProfile({ ...profile, vehicleColor: c.id })}
                className={`p-2 rounded-xl border flex flex-col items-center gap-1.5 transition-all ${
                  profile.vehicleColor === c.id
                    ? 'border-white bg-slate-800 shadow-lg'
                    : 'border-slate-800 bg-slate-950/60 hover:border-slate-700'
                }`}
              >
                <div
                  className="w-5 h-5 rounded-full border-2 border-white/40 shadow-inner"
                  style={{ backgroundColor: c.hex }}
                />
                <span className="text-[10px] text-center font-semibold text-slate-300 leading-tight">
                  {c.label.split(' ')[0]}
                </span>
              </button>
            ))}
          </div>

          <label className="flex items-center gap-2 mt-1 cursor-pointer text-xs text-slate-300 select-none">
            <input
              type="checkbox"
              checked={profile.enableWindEffect}
              onChange={e => setProfile({ ...profile, enableWindEffect: e.target.checked })}
              className="rounded border-slate-700 bg-slate-800 text-lime-400 focus:ring-0"
            />
            <div className="flex items-center gap-1.5">
              <Wind className="w-4 h-4 text-cyan-400" />
              <span>Ativar efeito visual de vento e rastro aerodinâmico na navegação</span>
            </div>
          </label>
        </div>

        {/* Voice Selection & Customization Section */}
        <div className="flex flex-col gap-2.5 bg-slate-950/70 border border-slate-800/80 rounded-2xl p-3.5 text-xs">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Volume2 className="w-4 h-4 text-lime-400" />
              <h3 className="font-bold text-xs uppercase tracking-wider text-slate-200">
                Voz da Navegação e Instruções (TTS)
              </h3>
            </div>
            <button
              onClick={handleTestVoice}
              disabled={isPlayingTestVoice}
              className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-lime-400 text-slate-950 font-black text-[11px] shadow-md hover:bg-lime-300 active:scale-95 transition-all disabled:opacity-50"
            >
              <Play className="w-3 h-3 fill-current" />
              <span>{isPlayingTestVoice ? 'Falando...' : 'Ouvir Teste'}</span>
            </button>
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-[11px] text-slate-400 font-medium">Escolha a voz do assistente:</label>
            <select
              value={profile.selectedVoiceURI || ''}
              onChange={e => setProfile({ ...profile, selectedVoiceURI: e.target.value })}
              className="bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-lime-400 transition-colors"
            >
              {availableVoices.length === 0 && (
                <option value="">Voz Padrão do Sistema (Português)</option>
              )}
              {availableVoices.map(voice => (
                <option key={voice.voiceURI} value={voice.voiceURI}>
                  {voice.lang.startsWith('pt') ? '🇧🇷 ' : '🌐 '} {voice.name} ({voice.lang})
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-3 pt-1">
            <label className="text-[11px] text-slate-400 whitespace-nowrap">Velocidade da fala:</label>
            <input
              type="range"
              min="0.8"
              max="1.3"
              step="0.05"
              value={profile.voiceRate || 1.05}
              onChange={e => setProfile({ ...profile, voiceRate: parseFloat(e.target.value) })}
              className="flex-1 accent-lime-400"
            />
            <span className="text-[11px] font-bold text-lime-400 min-w-[35px] text-right">
              {Math.round((profile.voiceRate || 1.05) * 100)}%
            </span>
          </div>
        </div>

        {/* Accessibility Settings */}
        <div className="flex flex-col gap-2 bg-slate-950/50 border border-slate-800/80 rounded-2xl p-3.5 text-xs">
          <div className="flex items-center gap-2">
            <Eye className="w-4 h-4 text-blue-400" />
            <h3 className="font-bold text-xs uppercase tracking-wider text-slate-300">Acessibilidade</h3>
          </div>

          <label className="flex items-center gap-2 cursor-pointer text-slate-300 select-none">
            <input
              type="checkbox"
              checked={profile.accessibility.reducedMotion}
              onChange={e => setProfile({
                ...profile,
                accessibility: { ...profile.accessibility, reducedMotion: e.target.checked }
              })}
              className="rounded border-slate-700 bg-slate-800 text-blue-500 focus:ring-0"
            />
            <span>Reduzir animações e transições na tela</span>
          </label>

          <label className="flex items-center gap-2 cursor-pointer text-slate-300 select-none">
            <input
              type="checkbox"
              checked={profile.enableVoiceInstructions}
              onChange={e => setProfile({ ...profile, enableVoiceInstructions: e.target.checked })}
              className="rounded border-slate-700 bg-slate-800 text-blue-500 focus:ring-0"
            />
            <span>Instruções de navegação em voz alta ativas</span>
          </label>
        </div>

        {/* Privacy & LGPD */}
        <div className="flex flex-col gap-2 bg-slate-950/50 border border-slate-800/80 rounded-2xl p-3.5 text-xs">
          <div className="flex items-center gap-2">
            <Shield className="w-4 h-4 text-emerald-400" />
            <h3 className="font-bold text-xs uppercase tracking-wider text-slate-300">Privacidade & LGPD</h3>
          </div>

          <label className="flex items-center gap-2 cursor-pointer text-slate-300 select-none">
            <input
              type="checkbox"
              checked={profile.privacy.shareLocationWithCommunity}
              onChange={e => setProfile({
                ...profile,
                privacy: { ...profile.privacy, shareLocationWithCommunity: e.target.checked }
              })}
              className="rounded border-slate-700 bg-slate-800 text-emerald-500 focus:ring-0"
            />
            <span>Compartilhar dados anônimos de tráfego para cálculo de rotas comunitárias</span>
          </label>

          <div className="pt-2 border-t border-slate-900 flex items-center justify-between">
            <span className="text-[11px] text-slate-500">Excluir dados gravados:</span>
            <button
              onClick={handleClearHistory}
              className="flex items-center gap-1 text-[11px] text-red-400 hover:text-red-300 bg-red-950/30 border border-red-900/40 px-2.5 py-1 rounded-lg"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Limpar Histórico de Rotas</span>
            </button>
          </div>
        </div>

        {/* Footer actions */}
        <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold"
          >
            Cancelar
          </button>

          <button
            onClick={handleSave}
            className="flex items-center gap-1.5 px-5 py-2 rounded-xl bg-gradient-to-r from-lime-400 to-lime-500 hover:from-lime-300 hover:to-lime-400 text-slate-950 font-black text-xs shadow-lg shadow-lime-500/20"
          >
            {saveSuccess ? (
              <>
                <Check className="w-4 h-4 text-slate-950 stroke-[3]" />
                <span>Salvo com Sucesso!</span>
              </>
            ) : (
              <span>Salvar Preferências</span>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
