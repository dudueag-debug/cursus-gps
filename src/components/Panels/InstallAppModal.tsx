import React, { useState, useEffect } from 'react';
import {
  Download,
  Smartphone,
  Apple,
  CheckCircle2,
  X,
  Share2,
  PlusSquare,
  QrCode,
  Copy,
  Check,
  ShieldCheck,
  Navigation,
  Store,
  Camera,
  ExternalLink,
} from 'lucide-react';

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
  const [activePlatformTab, setActivePlatformTab] = useState<'android' | 'ios' | 'qrcode'>('android');
  const [copiedLink, setCopiedLink] = useState(false);
  const [installSuccess, setInstallSuccess] = useState(false);

  const appUrl =
    typeof window !== 'undefined' && window.location.origin
      ? window.location.origin
      : 'https://cursus-gps.vercel.app';

  useEffect(() => {
    if (typeof navigator !== 'undefined') {
      const ua = navigator.userAgent.toLowerCase();
      if (/iphone|ipad|ipod/.test(ua)) {
        setActivePlatformTab('ios');
      } else if (/android/.test(ua)) {
        setActivePlatformTab('android');
      }
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const choiceResult = await deferredPrompt.userChoice;
      if (choiceResult.outcome === 'accepted') {
        setInstallSuccess(true);
        setTimeout(() => {
          setInstallSuccess(false);
          onClose();
        }, 1600);
      }
    } else {
      const ua = typeof navigator !== 'undefined' ? navigator.userAgent.toLowerCase() : '';
      if (/iphone|ipad|ipod/.test(ua)) {
        setActivePlatformTab('ios');
      } else {
        setActivePlatformTab('android');
      }
    }
  };

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(appUrl);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2500);
    } catch {
      // Fallback
    }
  };

  const handleNativeShare = async () => {
    if (typeof navigator !== 'undefined' && navigator.share) {
      try {
        await navigator.share({
          title: 'TÔ PASSANDO GPS — Comércios do RJ & Alertas em Tempo Real',
          text: 'Baixe o App TÔ PASSANDO GPS no seu celular (iOS e Android) com todos os comércios do Rio de Janeiro e alertas em tempo real!',
          url: appUrl,
        });
      } catch {}
    } else {
      handleCopyLink();
    }
  };

  return (
    <div className="fixed inset-0 z-[9999] bg-black/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-4">
      <div className="bg-slate-900 border border-slate-700 rounded-3xl w-full max-w-xl p-5 sm:p-6 shadow-2xl flex flex-col gap-4 text-white max-h-[92vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-start justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-lime-400/20 to-emerald-500/20 border border-lime-400/40 flex items-center justify-center shadow-lg shadow-lime-500/10">
              <Download className="w-6 h-6 text-lime-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg sm:text-xl font-black text-white tracking-tight">
                  Baixar App no Telefone (PWA)
                </h2>
                <span className="px-2 py-0.5 rounded-full bg-lime-400/20 border border-lime-400/40 text-lime-300 text-[10px] font-black uppercase">
                  iOS & Android
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Instale o TÔ PASSANDO na tela inicial do seu celular sem ocupar memória
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl bg-slate-800 text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Direct 1-Tap Install Button */}
        <button
          onClick={handleInstallClick}
          className="w-full py-3.5 px-4 rounded-2xl bg-gradient-to-r from-lime-400 via-emerald-400 to-cyan-400 hover:brightness-110 text-slate-950 font-black text-xs sm:text-sm tracking-wide shadow-xl shadow-lime-500/25 flex items-center justify-center gap-2.5 active:scale-[0.98] transition-all"
        >
          {installSuccess ? (
            <>
              <CheckCircle2 className="w-5 h-5 text-slate-950" />
              <span>APLICATIVO INSTALADO COM SUCESSO!</span>
            </>
          ) : deferredPrompt ? (
            <>
              <Download className="w-5 h-5" />
              <span>INSTALAR APLICATIVO AGORA COM 1 TOQUE (ANDROID / PWA)</span>
            </>
          ) : (
            <>
              <Smartphone className="w-5 h-5" />
              <span>VER PASSO A PASSO RÁPIDO PARA SEU TELEFONE ABAIXO</span>
            </>
          )}
        </button>

        {/* Platform Selector Tabs (Android / iOS / QR Code) */}
        <div className="grid grid-cols-3 gap-2 bg-slate-950 p-1.5 rounded-2xl border border-slate-800">
          <button
            onClick={() => setActivePlatformTab('android')}
            className={`flex items-center justify-center gap-1.5 py-2.5 px-2 rounded-xl text-xs font-black transition-all ${
              activePlatformTab === 'android'
                ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/30'
                : 'text-slate-400 hover:text-white hover:bg-slate-900'
            }`}
          >
            <Smartphone className="w-4 h-4" />
            <span>Android (PWA)</span>
          </button>

          <button
            onClick={() => setActivePlatformTab('ios')}
            className={`flex items-center justify-center gap-1.5 py-2.5 px-2 rounded-xl text-xs font-black transition-all ${
              activePlatformTab === 'ios'
                ? 'bg-cyan-600 text-white shadow-lg shadow-cyan-600/30'
                : 'text-slate-400 hover:text-white hover:bg-slate-900'
            }`}
          >
            <Apple className="w-4 h-4" />
            <span>iPhone / iOS</span>
          </button>

          <button
            onClick={() => setActivePlatformTab('qrcode')}
            className={`flex items-center justify-center gap-1.5 py-2.5 px-2 rounded-xl text-xs font-black transition-all ${
              activePlatformTab === 'qrcode'
                ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30'
                : 'text-slate-400 hover:text-white hover:bg-slate-900'
            }`}
          >
            <QrCode className="w-4 h-4" />
            <span>QR Code / Link</span>
          </button>
        </div>

        {/* Tab Content: ANDROID */}
        {activePlatformTab === 'android' && (
          <div className="bg-slate-950/90 border border-emerald-500/40 rounded-2xl p-4 flex flex-col gap-3 animate-fadeIn">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-emerald-400 font-black text-sm">
                <Smartphone className="w-5 h-5" />
                <span>Como Baixar no Android (Samsung, Motorola, Xiaomi)</span>
              </div>
              <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                Chrome / Samsung
              </span>
            </div>

            <div className="grid grid-cols-1 gap-2.5 text-xs text-slate-200">
              <div className="flex items-start gap-3 bg-slate-900/90 p-3 rounded-xl border border-slate-800">
                <span className="w-6 h-6 rounded-full bg-emerald-500 text-slate-950 font-black flex items-center justify-center shrink-0 text-xs">
                  1
                </span>
                <div>
                  <p className="font-bold text-white">Abra no navegador Chrome do seu Android</p>
                  <p className="text-slate-400 text-[11px] mt-0.5">
                    Se já estiver no Chrome, basta tocar no botão verde <strong>"Instalar Aplicativo Agora"</strong> acima ou seguir o passo 2.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 bg-slate-900/90 p-3 rounded-xl border border-slate-800">
                <span className="w-6 h-6 rounded-full bg-emerald-500 text-slate-950 font-black flex items-center justify-center shrink-0 text-xs">
                  2
                </span>
                <div>
                  <p className="font-bold text-white">Toque nos 3 pontinhos (⋮) no canto superior direito</p>
                  <p className="text-slate-400 text-[11px] mt-0.5">
                    No menu do navegador, selecione a opção <strong>"Instalar aplicativo"</strong> ou <strong>"Adicionar à tela inicial"</strong>.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 bg-slate-900/90 p-3 rounded-xl border border-slate-800">
                <span className="w-6 h-6 rounded-full bg-emerald-500 text-slate-950 font-black flex items-center justify-center shrink-0 text-xs">
                  3
                </span>
                <div>
                  <p className="font-bold text-white">Confirme em "Instalar" e abra direto pela Tela Inicial</p>
                  <p className="text-slate-400 text-[11px] mt-0.5">
                    O ícone oficial do <strong>TÔ PASSANDO GPS</strong> fica salvo junto com seus aplicativos em tela cheia!
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tab Content: iOS / iPHONE */}
        {activePlatformTab === 'ios' && (
          <div className="bg-slate-950/90 border border-cyan-500/40 rounded-2xl p-4 flex flex-col gap-3 animate-fadeIn">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-cyan-400 font-black text-sm">
                <Apple className="w-5 h-5" />
                <span>Como Baixar no iPhone e iPad (iOS PWA)</span>
              </div>
              <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                Navegador Safari
              </span>
            </div>

            <div className="grid grid-cols-1 gap-2.5 text-xs text-slate-200">
              <div className="flex items-start gap-3 bg-slate-900/90 p-3 rounded-xl border border-slate-800">
                <span className="w-6 h-6 rounded-full bg-cyan-400 text-slate-950 font-black flex items-center justify-center shrink-0 text-xs">
                  1
                </span>
                <div>
                  <p className="font-bold text-white">Abra este endereço no navegador Safari do iPhone</p>
                  <p className="text-slate-400 text-[11px] mt-0.5">
                    No iOS, a instalação de Web App (PWA) é feita pelo Safari.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 bg-slate-900/90 p-3 rounded-xl border border-slate-800">
                <span className="w-6 h-6 rounded-full bg-cyan-400 text-slate-950 font-black flex items-center justify-center shrink-0 text-xs">
                  2
                </span>
                <div>
                  <p className="font-bold text-white flex items-center gap-1.5">
                    <span>Toque no botão Compartilhar</span>
                    <span className="inline-flex items-center px-1.5 py-0.5 rounded bg-blue-600/30 text-blue-300 border border-blue-500/40">
                      <Share2 className="w-3.5 h-3.5" />
                    </span>
                    <span>na barra inferior</span>
                  </p>
                  <p className="text-slate-400 text-[11px] mt-0.5">
                    É o ícone de quadrado com uma seta apontando para cima no centro inferior do Safari.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 bg-slate-900/90 p-3 rounded-xl border border-slate-800">
                <span className="w-6 h-6 rounded-full bg-cyan-400 text-slate-950 font-black flex items-center justify-center shrink-0 text-xs">
                  3
                </span>
                <div>
                  <p className="font-bold text-white flex items-center gap-1.5">
                    <span>Role e toque em "Adicionar à Tela de Início"</span>
                    <PlusSquare className="w-4 h-4 text-cyan-300 inline" />
                  </p>
                  <p className="text-slate-400 text-[11px] mt-0.5">
                    Em seguida, toque em <strong>"Adicionar"</strong> no canto superior direito. O app ficará instalado na tela do seu iPhone!
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tab Content: QR CODE & DIRECT LINK */}
        {activePlatformTab === 'qrcode' && (
          <div className="bg-slate-950/90 border border-blue-500/40 rounded-2xl p-4 flex flex-col items-center gap-3 text-center animate-fadeIn">
            <div className="bg-white p-3 rounded-2xl shadow-xl border-4 border-lime-400">
              <img
                src={`https://api.qrserver.com/v1/create-qr-code/?size=160x160&data=${encodeURIComponent(appUrl)}`}
                alt="QR Code para Baixar TÔ PASSANDO GPS"
                className="w-36 h-36 object-contain"
              />
            </div>
            <div>
              <p className="text-sm font-black text-white">Aponte a Câmera do Celular (iOS ou Android)</p>
              <p className="text-xs text-slate-400 mt-0.5">
                Escaneie o QR Code ou envie o link direto para instalar o PWA em qualquer telefone
              </p>
            </div>

            <div className="w-full flex flex-col sm:flex-row items-center gap-2 pt-1">
              <div className="w-full flex-1 bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs font-mono text-cyan-300 truncate">
                {appUrl}
              </div>
              <button
                onClick={handleCopyLink}
                className="w-full sm:w-auto px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 border border-slate-600"
              >
                {copiedLink ? <Check className="w-4 h-4 text-lime-400" /> : <Copy className="w-4 h-4" />}
                <span>{copiedLink ? 'Link Copiado!' : 'Copiar Link'}</span>
              </button>
              <button
                onClick={handleNativeShare}
                className="w-full sm:w-auto px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5"
              >
                <ExternalLink className="w-4 h-4" />
                <span>Enviar para Celular</span>
              </button>
            </div>
          </div>
        )}

        {/* Included Features in the Installed Mobile App */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
          <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-2.5 flex flex-col items-center text-center gap-1">
            <Navigation className="w-4 h-4 text-lime-400" />
            <span className="text-[10px] font-black text-white">GPS Tela Cheia</span>
            <span className="text-[9px] text-slate-400">Alta Precisão</span>
          </div>
          <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-2.5 flex flex-col items-center text-center gap-1">
            <Store className="w-4 h-4 text-cyan-400" />
            <span className="text-[10px] font-black text-white">Comércios do RJ</span>
            <span className="text-[9px] text-slate-400">Todos os Bairros</span>
          </div>
          <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-2.5 flex flex-col items-center text-center gap-1">
            <ShieldCheck className="w-4 h-4 text-rose-400" />
            <span className="text-[10px] font-black text-white">Zonas de Risco</span>
            <span className="text-[9px] text-slate-400">Alerta + Tempo</span>
          </div>
          <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-2.5 flex flex-col items-center text-center gap-1">
            <Camera className="w-4 h-4 text-amber-400" />
            <span className="text-[10px] font-black text-white">Câmera Ao Vivo</span>
            <span className="text-[9px] text-slate-400">Marcar Local</span>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between pt-2 border-t border-slate-800">
          <button
            onClick={handleCopyLink}
            className="text-xs text-cyan-400 hover:underline flex items-center gap-1 font-semibold"
          >
            <Copy className="w-3.5 h-3.5" />
            <span>{copiedLink ? 'Link copiado para a área de transferência!' : 'Copiar link do App'}</span>
          </button>
          <button
            onClick={onClose}
            className="px-5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold rounded-xl"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
};
