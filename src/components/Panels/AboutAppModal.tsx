import React from 'react';
import { 
  X, 
  MapPin, 
  ShieldCheck, 
  Cpu, 
  Mail, 
  User, 
  Sparkles, 
  CheckCircle2, 
  Radio, 
  Navigation2,
  Globe2
} from 'lucide-react';

interface AboutAppModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AboutAppModal: React.FC<AboutAppModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fade-in">
      <div className="bg-slate-900 border border-cyan-500/30 w-full max-w-lg rounded-3xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="p-5 bg-gradient-to-r from-slate-900 via-cyan-950/50 to-slate-900 border-b border-cyan-500/20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-cyan-500/20 border border-cyan-500/40 flex items-center justify-center text-cyan-400 shadow-inner">
              <Navigation2 className="w-6 h-6 rotate-45" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-bold text-white tracking-wide">GPS INTELIGENTE 4.0</h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold tracking-wider bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                  v4.0 PRO
                </span>
              </div>
              <p className="text-xs text-slate-400">Plataforma de Navegação, Mapa Vivo e Segurança</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="w-9 h-9 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body Content */}
        <div className="p-6 overflow-y-auto space-y-5 flex-1 scrollbar-thin">
          
          {/* Creator Profile Card */}
          <div className="bg-gradient-to-br from-cyan-950/40 to-slate-800/60 border border-cyan-500/30 p-4 rounded-2xl flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-cyan-500/20 border border-cyan-500/40 flex items-center justify-center text-cyan-400 shrink-0 shadow-lg">
              <User className="w-7 h-7" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h4 className="text-base font-extrabold text-white">Eduardo Noronha</h4>
                <span className="px-2 py-0.2 rounded-full text-[10px] font-bold bg-cyan-500/20 text-cyan-300 border border-cyan-500/40">
                  Criador & Arquiteto
                </span>
              </div>
              <a 
                href="mailto:dudusemog@gmail.com" 
                className="text-xs text-cyan-400 hover:text-cyan-300 font-medium flex items-center gap-1.5 mt-1 transition-colors"
              >
                <Mail className="w-3.5 h-3.5" />
                <span>dudusemog@gmail.com</span>
              </a>
              <p className="text-[11px] text-slate-400 mt-1">
                Desenvolvimento avançado com foco em mobilidade urbana e segurança do condutor brasileiro.
              </p>
            </div>
          </div>

          {/* Key Pillars */}
          <div className="space-y-2.5">
            <h5 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
              <span>Diferenciais do Sistema 4.0</span>
            </h5>

            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="bg-slate-800/60 border border-slate-700/60 p-3 rounded-xl flex items-start gap-2">
                <Radio className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold text-white block">GPS em Tempo Real</span>
                  <span className="text-[11px] text-slate-400">Rastreamento contínuo e bússola de direção</span>
                </div>
              </div>

              <div className="bg-slate-800/60 border border-slate-700/60 p-3 rounded-xl flex items-start gap-2">
                <Cpu className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold text-white block">Mapa Vivo 8 Camadas</span>
                  <span className="text-[11px] text-slate-400">Trânsito, segurança, saúde, GNV, etc.</span>
                </div>
              </div>

              <div className="bg-slate-800/60 border border-slate-700/60 p-3 rounded-xl flex items-start gap-2">
                <ShieldCheck className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold text-white block">12 Alertas de Via</span>
                  <span className="text-[11px] text-slate-400">Engarrafamento, buraco, alagamento e blitz</span>
                </div>
              </div>

              <div className="bg-slate-800/60 border border-slate-700/60 p-3 rounded-xl flex items-start gap-2">
                <Globe2 className="w-4 h-4 text-purple-400 shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold text-white block">História & Cultura</span>
                  <span className="text-[11px] text-slate-400">História fidedigna de cidades e bairros</span>
                </div>
              </div>
            </div>
          </div>

          {/* Privacy & Precision Guarantee */}
          <div className="bg-slate-950/60 border border-slate-800 p-4 rounded-2xl space-y-2">
            <div className="flex items-center gap-2 text-cyan-400 font-bold text-xs">
              <CheckCircle2 className="w-4 h-4" />
              <span>Transparência e Classificação de Dados</span>
            </div>
            <p className="text-[11px] text-slate-300 leading-relaxed">
              O GPS INTELIGENTE 4.0 classifica visualmente a origem de todas as informações:
              <strong className="text-emerald-400 ml-1 font-bold">[DADO REAL]</strong>,
              <strong className="text-amber-400 ml-1 font-bold">[DADO ESTIMADO]</strong>,
              <strong className="text-cyan-400 ml-1 font-bold">[DADO REPORTADO]</strong> e
              <strong className="text-purple-400 ml-1 font-bold">[DADO HISTÓRICO]</strong>.
              Sua localização nunca é armazenada ou compartilhada sem seu consentimento.
            </p>
          </div>

        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-950/80 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
          <span>© 2026 TÔ PASSANDO — GPS INTELIGENTE 4.0</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold transition-colors"
          >
            Entendido
          </button>
        </div>

      </div>
    </div>
  );
};
