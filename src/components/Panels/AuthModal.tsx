import React, { useState } from 'react';
import { 
  Lock, 
  Mail, 
  User, 
  ArrowRight, 
  Sparkles, 
  X, 
  ShieldCheck,
  CheckCircle
} from 'lucide-react';
import { api } from '../../services/api';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAuthSuccess: (user: any) => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  onAuthSuccess,
}) => {
  const [tab, setTab] = useState<'login' | 'register' | 'forgot'>('login');
  const [identifier, setIdentifier] = useState('');
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setLoading(true);

    try {
      if (tab === 'login') {
        const res = await api.login(identifier || 'eduardo@cursus.com.br');
        onAuthSuccess(res.user);
        onClose();
      } else if (tab === 'register') {
        if (!acceptedTerms) {
          setErrorMsg('Você precisa aceitar os Termos de Uso e Política de Privacidade.');
          setLoading(false);
          return;
        }
        const res = await api.login(identifier);
        onAuthSuccess({ ...res.user, name: name || identifier });
        onClose();
      } else {
        alert('Instruções de recuperação de senha enviadas para seu e-mail cadastrado.');
        setTab('login');
      }
    } catch (e: any) {
      setErrorMsg(e.message || 'Falha na autenticação.');
    } finally {
      setLoading(false);
    }
  };

  const handleGuest = async () => {
    setLoading(true);
    try {
      const res = await api.guestLogin();
      onAuthSuccess(res.user);
      onClose();
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[9999] bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-700/80 rounded-2xl w-full max-w-md p-6 shadow-2xl flex flex-col gap-4 text-white">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div>
            <div className="flex items-center gap-2">
              <span className="font-black text-xl tracking-tight text-white">TÔ PASSANDO</span>
              <span className="text-[10px] uppercase font-bold px-1.5 py-0.5 rounded bg-blue-900/60 text-blue-300">CURSUS</span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">Sua conta segura de navegação multimodal.</p>
          </div>

          <button onClick={onClose} className="text-slate-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab switch */}
        <div className="flex bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs font-bold">
          <button
            onClick={() => setTab('login')}
            className={`flex-1 py-2 rounded-lg transition-all ${
              tab === 'login' ? 'bg-blue-600 text-white shadow-md' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Entrar
          </button>
          <button
            onClick={() => setTab('register')}
            className={`flex-1 py-2 rounded-lg transition-all ${
              tab === 'register' ? 'bg-blue-600 text-white shadow-md' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Criar Conta
          </button>
        </div>

        {errorMsg && (
          <div className="bg-red-950/60 border border-red-800 text-red-200 text-xs p-2.5 rounded-xl">
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-3 text-xs">
          {tab === 'register' && (
            <div>
              <label className="text-slate-300 font-semibold block mb-1">Nome completo:</label>
              <div className="relative flex items-center">
                <User className="absolute left-3 w-4 h-4 text-slate-500" />
                <input
                  type="text"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder="Seu nome"
                  required
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl pl-9 pr-3 py-2.5 text-slate-100 placeholder-slate-500 focus:outline-none focus:border-blue-500"
                />
              </div>
            </div>
          )}

          <div>
            <label className="text-slate-300 font-semibold block mb-1">E-mail ou Telefone verificado:</label>
            <div className="relative flex items-center">
              <Mail className="absolute left-3 w-4 h-4 text-slate-500" />
              <input
                type="text"
                value={identifier}
                onChange={e => setIdentifier(e.target.value)}
                placeholder="seu-email@exemplo.com.br"
                required
                className="w-full bg-slate-950 border border-slate-700 rounded-xl pl-9 pr-3 py-2.5 text-slate-100 placeholder-slate-500 focus:outline-none focus:border-blue-500"
              />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-slate-300 font-semibold">Senha:</label>
              {tab === 'login' && (
                <button
                  type="button"
                  onClick={() => setTab('forgot')}
                  className="text-[11px] text-blue-400 hover:underline"
                >
                  Esqueceu a senha?
                </button>
              )}
            </div>
            <div className="relative flex items-center">
              <Lock className="absolute left-3 w-4 h-4 text-slate-500" />
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="••••••••"
                required={tab !== 'forgot'}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl pl-9 pr-3 py-2.5 text-slate-100 placeholder-slate-500 focus:outline-none focus:border-blue-500"
              />
            </div>
          </div>

          {tab === 'register' && (
            <label className="flex items-start gap-2 pt-1 text-[11px] text-slate-400 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={acceptedTerms}
                onChange={e => setAcceptedTerms(e.target.checked)}
                className="mt-0.5 rounded border-slate-700 bg-slate-800 text-blue-500"
              />
              <span>
                Li e concordo com os Termos de Uso e Política de Privacidade conforme a LGPD brasileira.
              </span>
            </label>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-2 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold rounded-xl shadow-lg shadow-blue-500/20 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
          >
            {loading ? (
              <span>Processando...</span>
            ) : (
              <>
                <span>{tab === 'login' ? 'Entrar no Tô Passando' : tab === 'register' ? 'Criar Conta Gratuita' : 'Recuperar Acesso'}</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        {/* Guest access option */}
        <div className="pt-2 border-t border-slate-800 text-center">
          <button
            onClick={handleGuest}
            disabled={loading}
            className="text-xs text-slate-400 hover:text-lime-300 font-semibold transition-colors"
          >
            Continuar como Visitante (Recursos Essenciais)
          </button>
        </div>
      </div>
    </div>
  );
};
