import React from 'react';
import { Download, Smartphone, Monitor, Apple, CheckCircle2, X, Share2, PlusSquare } from 'lucide-react';

interface InstallAppModalProps {
  isOpen: boolean;
  onClose: () => void;
  deferredPrompt: any;
}

export const InstallAppModal: React.FC<InstallAppModalProps> = ({
  isOpen,
  onClose,
  deferredPrompt,
}) => {
  if (!isOpen) return null;

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const choiceResult = await deferredPrompt.userChoice;
      if (choiceResult.outcome === 'accepted') {
        console.log('Usuário aceitou instalar o PWA');
      }
      onClose();
    } else {
      alert('Se o botão nativo não abrir, utilize as instruções de instalação abaixo para seu dispositivo.');
    }
  };

  return (
    <div className="fixed inset-0 z-[9999] bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-700 rounded-3xl w-full max-w-lg p-6 shadow-2xl flex flex-col gap-5 text-white max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-start justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-lime-400/10 border border-lime-400/30 flex items-center justify-center">
              <Download className="w-6 h-6 text-lime-400" />
            </div>
            <div>
              <h2 className="text-xl font-black text-white tracking-tight">Baixar TÔ PASSANDO</h2>
              <p className="text-xs text-slate-400">Instale no seu Celular (Android/iPhone) ou Computador</p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors">
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Direct Action if browser supports prompt */}
        {deferredPrompt && (
          <button
            onClick={handleInstallClick}
            className="w-full py-4 rounded-2xl bg-gradient-to-r from-lime-400 via-lime-500 to-emerald-400 hover:brightness-110 text-slate-950 font-black text-sm tracking-wide shadow-xl shadow-lime-500/25 flex items-center justify-center gap-2 active:scale-[0.98] transition-all"
          >
            <Download className="w-5 h-5 fill-slate-950" />
            <span>INSTALAR AGORA NO DISPOSITIVO</span>
          </button>
        )}

        {/* Step-by-step guides for all platforms */}
        <div className="flex flex-col gap-3">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
            Instruções por Tipo de Aparelho:
          </h3>

          {/* Android Guide */}
          <div className="bg-slate-950/70 border border-slate-800 rounded-2xl p-4 flex flex-col gap-2">
            <div className="flex items-center gap-2 text-emerald-400 font-bold text-sm">
              <Smartphone className="w-5 h-5" />
              <span>No Celular Android (Chrome, Samsung Internet)</span>
            </div>
            <ol className="text-xs text-slate-300 space-y-1.5 list-decimal list-inside pl-1">
              <li>Abra o site no navegador do celular (Chrome).</li>
              <li>Toque no menu de <strong>3 pontinhos (⋮)</strong> no canto superior direito.</li>
              <li>Toque em <strong>"Instalar aplicativo"</strong> ou <strong>"Adicionar à tela inicial"</strong>.</li>
              <li>O ícone do <strong>TÔ PASSANDO</strong> aparecerá junto com seus outros aplicativos!</li>
            </ol>
          </div>

          {/* iPhone / iOS Guide */}
          <div className="bg-slate-950/70 border border-slate-800 rounded-2xl p-4 flex flex-col gap-2">
            <div className="flex items-center gap-2 text-cyan-400 font-bold text-sm">
              <Apple className="w-5 h-5" />
              <span>No iPhone ou iPad (Safari)</span>
            </div>
            <ol className="text-xs text-slate-300 space-y-1.5 list-decimal list-inside pl-1">
              <li>Abra o link do GPS no navegador <strong>Safari</strong>.</li>
              <li>Toque no ícone de <strong>Compartilhar</strong> (quadrado com seta para cima <Share2 className="w-3.5 h-3.5 inline text-blue-400" />).</li>
              <li>Role para baixo e selecione <strong>"Adicionar à Tela de Início"</strong> (<PlusSquare className="w-3.5 h-3.5 inline text-slate-300" />).</li>
              <li>Toque em <strong>Adicionar</strong> no topo direito. O GPS abrirá em tela cheia sem barra de navegador!</li>
            </ol>
          </div>

          {/* Computador Guide */}
          <div className="bg-slate-950/70 border border-slate-800 rounded-2xl p-4 flex flex-col gap-2">
            <div className="flex items-center gap-2 text-blue-400 font-bold text-sm">
              <Monitor className="w-5 h-5" />
              <span>No Computador (Windows / Mac - Chrome / Edge)</span>
            </div>
            <p className="text-xs text-slate-300">
              Clique no ícone de <strong>instalar</strong> que aparece no canto direito da barra de pesquisa de endereço (ou vá em Menu &gt; "Instalar TÔ PASSANDO"). Ele funcionará como um programa nativo de computador!
            </p>
          </div>
        </div>

        <div className="flex justify-end pt-2 border-t border-slate-800">
          <button
            onClick={onClose}
            className="px-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-xl"
          >
            Entendi, Fechar
          </button>
        </div>
      </div>
    </div>
  );
};
