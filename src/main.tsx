import React, { Component, ErrorInfo, ReactNode } from 'react'
import { createRoot } from 'react-dom/client'
import 'leaflet/dist/leaflet.css'
import './index.css'
import App from './App.tsx'

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

class RootErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('[TÔ PASSANDO] Erro capturado no Root:', error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="fixed inset-0 bg-slate-950 text-white flex flex-col items-center justify-center p-6 text-center z-[999999]">
          <div className="w-16 h-16 rounded-2xl bg-blue-600/20 border border-blue-500/40 flex items-center justify-center text-lime-400 mb-4 shadow-xl">
            ⚡
          </div>
          <h1 className="text-2xl font-black text-white uppercase tracking-tight">
            TÔ PASSANDO GPS
          </h1>
          <p className="text-sm text-slate-300 mt-2 max-w-md">
            Ocorreu uma reinicialização necessária dos sensores do GPS. Toque no botão abaixo para restabelecer a conexão.
          </p>
          <button
            onClick={() => {
              try {
                localStorage.removeItem('tp_active_session_user');
              } catch {}
              window.location.reload();
            }}
            className="mt-6 px-6 py-3.5 rounded-2xl bg-gradient-to-r from-lime-400 to-emerald-400 text-slate-950 font-black text-sm shadow-xl active:scale-95 transition-all"
          >
            REINICIAR APLICATIVO
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

const container = document.getElementById('root');
if (container) {
  const root = createRoot(container);
  root.render(
    <RootErrorBoundary>
      <App />
    </RootErrorBoundary>
  );
}
