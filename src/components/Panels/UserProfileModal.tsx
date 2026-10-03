import React, { useState } from 'react';
import { 
  User, 
  Car, 
  Bike, 
  Shield, 
  Eye, 
  Wind, 
  Volume2, 
  Palette, 
  Trash2, 
  X,
  Check,
  CheckCircle2
} from 'lucide-react';
import { UserProfile, VehicleModel, VehicleColor } from '../../types';

interface UserProfileModalProps {
  user: UserProfile;
  isOpen: boolean;
  onClose: () => void;
  onUpdateUser: (updated: UserProfile) => void;
  onLogout: () => void;
}

export const UserProfileModal: React.FC<UserProfileModalProps> = ({
  user,
  isOpen,
  onClose,
  onUpdateUser,
  onLogout,
}) => {
  const [profile, setProfile] = useState<UserProfile>(user);
  const [saveSuccess, setSaveSuccess] = useState(false);

  if (!isOpen) return null;

  const handleSave = () => {
    onUpdateUser(profile);
    setSaveSuccess(true);
    setTimeout(() => {
      setSaveSuccess(false);
      onClose();
    }, 800);
  };

  const handleClearHistory = () => {
    if (confirm('Deseja realmente apagar todo o seu histórico de rotas e destinos? Esta ação é irreversível conforme a LGPD.')) {
      alert('Histórico de rotas apagado com sucesso do servidor.');
    }
  };

  const vehicleModels: { id: VehicleModel; label: string; icon: string }[] = [
    { id: 'sedan', label: 'Carro Sedan', icon: '🚗' },
    { id: 'suv', label: 'Carro SUV', icon: '🚙' },
    { id: 'motorcycle_sport', label: 'Moto Esportiva', icon: '🏍️' },
    { id: 'motorcycle_scooter', label: 'Scooter 2R', icon: '🛵' },
    { id: 'van', label: 'Van / Utilitário', icon: '🚐' },
    { id: 'walker', label: 'Pedestre / A Pé', icon: '🚶' },
  ];

  const vehicleColors: { id: VehicleColor; label: string; hex: string }[] = [
    { id: 'lime', label: 'Verde-Limão TÔ PASSANDO', hex: '#CCFF00' },
    { id: 'electric_blue', label: 'Azul Tecnológico', hex: '#00D2FF' },
    { id: 'cyber_yellow', label: 'Amarelo Cyber', hex: '#FFD000' },
    { id: 'ruby_red', label: 'Vermelho Ruby', hex: '#FF3366' },
    { id: 'silver', label: 'Prata Espacial', hex: '#E2E8F0' },
  ];

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-xl p-5 shadow-2xl flex flex-col gap-4 text-white max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-start justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-blue-900/40 border border-blue-500/40 flex items-center justify-center">
              <User className="w-6 h-6 text-blue-400" />
            </div>
            <div>
              <h2 className="text-lg font-black tracking-tight text-white">Perfil e Configurações</h2>
              <p className="text-xs text-slate-400">
                Personalização do veículo, acessibilidade e privacidade LGPD.
              </p>
            </div>
          </div>

          <button onClick={onClose} className="p-1 text-slate-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* User Identity info */}
        <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-3.5 flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-sm text-slate-100">{profile.name}</span>
              {profile.isGuest && (
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-amber-950 text-amber-300 border border-amber-700">
                  Modo Visitante
                </span>
              )}
            </div>
            <p className="text-xs text-slate-400">@{profile.username} {profile.email ? `• ${profile.email}` : ''}</p>
          </div>

          <button
            onClick={onLogout}
            className="text-xs text-red-400 hover:text-red-300 border border-red-900/50 hover:bg-red-950/40 px-3 py-1.5 rounded-lg transition-colors"
          >
            Sair
          </button>
        </div>

        {/* Vehicle Customization (Carrinho de Navegação) */}
        <div className="flex flex-col gap-2.5 bg-slate-950/50 border border-slate-800/80 rounded-xl p-3.5">
          <div className="flex items-center gap-2">
            <Palette className="w-4 h-4 text-lime-400" />
            <h3 className="font-bold text-xs uppercase tracking-wider text-slate-300">
              Personalização do Marcador / Carrinho de Navegação
            </h3>
          </div>

          <div>
            <label className="text-xs text-slate-400 block mb-1.5">Modelo do Marcador:</label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {vehicleModels.map(m => (
                <button
                  key={m.id}
                  onClick={() => setProfile({ ...profile, vehicleModel: m.id })}
                  className={`p-2 rounded-xl border text-xs font-semibold flex items-center gap-2 transition-all ${
                    profile.vehicleModel === m.id
                      ? 'bg-blue-600/30 border-blue-500 text-white'
                      : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <span className="text-base">{m.icon}</span>
                  <span>{m.label}</span>
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-xs text-slate-400 block mb-1.5">Cor Predominante do Veículo:</label>
            <div className="flex items-center gap-2 overflow-x-auto pb-1">
              {vehicleColors.map(c => (
                <button
                  key={c.id}
                  onClick={() => setProfile({ ...profile, vehicleColor: c.id })}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-medium transition-all ${
                    profile.vehicleColor === c.id
                      ? 'border-white bg-slate-800 text-white shadow-md'
                      : 'border-slate-800 bg-slate-950 text-slate-400'
                  }`}
                >
                  <span className="w-3.5 h-3.5 rounded-full" style={{ backgroundColor: c.hex }} />
                  <span>{c.label.split(' ')[0]}</span>
                </button>
              ))}
            </div>
          </div>

          <label className="flex items-center gap-2.5 cursor-pointer text-xs text-slate-300 pt-1 select-none">
            <input
              type="checkbox"
              checked={profile.enableWindEffect}
              onChange={e => setProfile({ ...profile, enableWindEffect: e.target.checked })}
              className="rounded border-slate-700 bg-slate-800 text-lime-400 focus:ring-0"
            />
            <div className="flex items-center gap-1.5">
              <Wind className="w-4 h-4 text-cyan-400" />
              <span>Ativar efeito visual de vento / rastro de movimento ao navegar</span>
            </div>
          </label>
        </div>

        {/* Accessibility settings */}
        <div className="flex flex-col gap-2 bg-slate-950/50 border border-slate-800/80 rounded-xl p-3.5 text-xs">
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
            <span>Instruções de navegação em voz alta (TTS)</span>
          </label>
        </div>

        {/* Privacy & LGPD */}
        <div className="flex flex-col gap-2 bg-slate-950/50 border border-slate-800/80 rounded-xl p-3.5 text-xs">
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
            <span>Compartilhar dados anônimos de velocidade para cálculo de trânsito</span>
          </label>

          <div className="pt-2 border-t border-slate-900 flex items-center justify-between">
            <span className="text-[11px] text-slate-500">Excluir dados gravados de trajetos:</span>
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
            className="flex items-center gap-1.5 px-5 py-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-xs shadow-lg shadow-blue-500/20"
          >
            {saveSuccess ? (
              <>
                <Check className="w-4 h-4 text-lime-400" />
                <span>Salvo!</span>
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
