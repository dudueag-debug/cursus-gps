import React, { useState } from 'react';
import { Download, CheckCircle2, Trash2, HardDrive, Wifi, WifiOff, XCircle, RefreshCw } from 'lucide-react';
import { OfflineMapEngine, type OfflineMapRegion } from '../../engines/offlineMapEngine';

interface OfflineRegionsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const OfflineRegionsModal: React.FC<OfflineRegionsModalProps> = ({ isOpen, onClose }) => {
  const [regions, setRegions] = useState<OfflineMapRegion[]>(() => OfflineMapEngine.getRegions());
  const [downloadingId, setDownloadingId] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleDownload = async (regionId: string) => {
    setDownloadingId(regionId);
    await OfflineMapEngine.downloadRegion(regionId, progress => {
      setRegions(prev => prev.map(r => r.id === regionId ? { ...r, downloadProgressPercent: progress } : r));
    });
    setDownloadingId(null);
    setRegions(OfflineMapEngine.getRegions());
  };

  const handleDelete = (regionId: string) => {
    OfflineMapEngine.deleteRegion(regionId);
    setRegions(OfflineMapEngine.getRegions());
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-4 animate-fade-in">
      <div className="bg-slate-900 border border-slate-700/80 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-900/90">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-500 text-white shadow-md">
              <HardDrive className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                MAPAS OFFLINE & DOWNLOAD REGIONAL
              </h2>
              <p className="text-xs text-slate-400">
                Navegue e calcule rotas mesmo sem conexão com a internet
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition"
          >
            <XCircle className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 overflow-y-auto space-y-3 text-slate-200">
          {/* Info Banner */}
          <div className="p-3 bg-emerald-950/40 border border-emerald-500/30 rounded-xl text-xs text-emerald-300 flex items-start gap-2">
            <WifiOff className="w-4 h-4 text-emerald-400 mt-0.5 shrink-0" />
            <p>
              Os pacotes offline contêm malha viária completa, pontos de interesse essenciais e geometria vetorial para navegação autônoma em qualquer lugar do Brasil.
            </p>
          </div>

          {/* Region List */}
          <div className="space-y-2">
            {regions.map(reg => {
              const isBusy = downloadingId === reg.id;
              return (
                <div
                  key={reg.id}
                  className={`p-3 rounded-xl border flex items-center justify-between gap-3 transition ${
                    reg.isDownloaded
                      ? 'bg-slate-800/90 border-emerald-500/40'
                      : 'bg-slate-950/60 border-slate-800'
                  }`}
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-xs text-white truncate">{reg.name}</span>
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 font-bold">
                        {reg.stateCode}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-[11px] text-slate-400 mt-1">
                      <span>{reg.sizeMb} MB</span>
                      <span>•</span>
                      <span>{reg.availablePoisCount.toLocaleString('pt-BR')} locais salvos</span>
                      {reg.isDownloaded && (
                        <>
                          <span>•</span>
                          <span className="text-emerald-400 font-semibold">Instalado</span>
                        </>
                      )}
                    </div>

                    {isBusy && (
                      <div className="w-full bg-slate-900 rounded-full h-1.5 mt-2 overflow-hidden border border-slate-700">
                        <div
                          className="bg-emerald-500 h-full transition-all duration-300"
                          style={{ width: `${reg.downloadProgressPercent}%` }}
                        />
                      </div>
                    )}
                  </div>

                  <div>
                    {reg.isDownloaded ? (
                      <div className="flex items-center gap-1.5">
                        <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                        <button
                          onClick={() => handleDelete(reg.id)}
                          className="p-2 text-slate-500 hover:text-red-400 hover:bg-slate-800 rounded-lg transition"
                          title="Excluir pacote offline"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => handleDownload(reg.id)}
                        disabled={isBusy}
                        className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl flex items-center gap-1.5 shadow-md active:scale-95 transition disabled:opacity-50"
                      >
                        {isBusy ? (
                          <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <Download className="w-3.5 h-3.5" />
                        )}
                        <span>{isBusy ? `${reg.downloadProgressPercent}%` : 'Baixar'}</span>
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-900/95">
          <button
            onClick={onClose}
            className="w-full py-2.5 px-4 bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold rounded-xl text-sm transition"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
};
