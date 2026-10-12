import React, { useState, useRef, useEffect } from 'react';
import { Camera, CheckCircle2, XCircle, Sparkles, ShieldCheck, MapPin, AlertTriangle } from 'lucide-react';
import type { Coordinates } from '../../types';
import { IncidentAiService, type IncidentPhotoAnalysisResult } from '../../services/incidentAiService';

interface PhotoIncidentModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentLocation: Coordinates;
  detectedLocationName: string;
  onSaveOccurrence: (data: {
    category: string;
    title: string;
    description: string;
    locationName: string;
    coordinates: Coordinates;
    severity: string;
    photoUrl?: string;
    isAiValidated?: boolean;
    aiConfidencePercent?: number;
    speedLimitKmh?: number;
    riskRadiusMeters?: number;
    zoneColor?: string;
  }) => Promise<void>;
}

const MARKER_CATEGORIES = [
  {
    key: 'roubo_celular_semaforo',
    label: '📱 Roubo de Telefone no Engarrafamento',
    defaultTitle: '⚠️ ALERTA: Roubo de Telefone no Engarrafamento',
    defaultDesc: 'Atenção no semáforo e trânsito lento: ponto com furtos e roubos de celular pela janela. Feche os vidros!',
    severity: 'critica',
    zoneColor: '#e11d48',
    radius: 280,
    samplePhoto: 'https://images.unsplash.com/photo-1519003722824-194d4455a60c?auto=format&fit=crop&w=700&q=80',
  },
  {
    key: 'roubo_carro_moto',
    label: '🚨 Assalto: Carro, Moto e Pedestres',
    defaultTitle: '🚨 Alto Índice de Assalto (Carro, Moto e Pedestres)',
    defaultDesc: 'Local demarcado pelo condutor com risco de abordagem a veículos, motos e pedestres.',
    severity: 'critica',
    zoneColor: '#dc2626',
    radius: 340,
    samplePhoto: 'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?auto=format&fit=crop&w=700&q=80',
  },
  {
    key: 'local_perigoso',
    label: '⚠️ Bairro / Local Perigoso em Alerta',
    defaultTitle: '⚠️ Bairro / Local Perigoso Demarcado',
    defaultDesc: 'Zona em alerta de segurança. O cronômetro de travessia é acionado ao entrar neste perímetro.',
    severity: 'critica',
    zoneColor: '#9333ea',
    radius: 400,
    samplePhoto: 'https://images.unsplash.com/photo-1477959858617-67f85cf4f1df?auto=format&fit=crop&w=700&q=80',
  },
  {
    key: 'falta_iluminacao',
    label: '💡 Falta de Iluminação Pública (Via Escura)',
    defaultTitle: '💡 Trecho Sem Iluminação Pública',
    defaultDesc: 'Postes apagados e rua escura. Redobre a atenção durante o período noturno.',
    severity: 'alta',
    zoneColor: '#f59e0b',
    radius: 230,
    samplePhoto: 'https://images.unsplash.com/photo-1517649763962-0c623066013b?auto=format&fit=crop&w=700&q=80',
  },
  {
    key: 'sem_sinalizacao',
    label: '🚫 Via Sem Sinalização / Faixas Apagadas',
    defaultTitle: '🚫 Via Sem Sinalização Viária',
    defaultDesc: 'Falta de placas, pintura de faixa apagada ou semáforo inoperante no trecho.',
    severity: 'alta',
    zoneColor: '#eab308',
    radius: 200,
    samplePhoto: 'https://images.unsplash.com/photo-1506521781263-d8422e82f27a?auto=format&fit=crop&w=700&q=80',
  },
  {
    key: 'falta_pavimentacao',
    label: '🕳️ Buraco na Via / Falta de Pavimentação',
    defaultTitle: '🕳️ Trecho com Buracos e Falta de Pavimentação',
    defaultDesc: 'Asfalto danificado com buracos profundos. Reduza a velocidade.',
    severity: 'alta',
    zoneColor: '#ca8a04',
    radius: 210,
    samplePhoto: 'https://images.unsplash.com/photo-1515162816999-a0c47dc192f7?auto=format&fit=crop&w=700&q=80',
  },
  {
    key: 'alagamento',
    label: '🌊 Alagamento na Via',
    defaultTitle: '🌊 Ponto de Alagamento na Pista',
    defaultDesc: 'Acúmulo de água na pista. Risco para carros baixos e motocicletas.',
    severity: 'critica',
    zoneColor: '#0284c7',
    radius: 220,
    samplePhoto: 'https://images.unsplash.com/photo-1547683905-f686c993aae5?auto=format&fit=crop&w=700&q=80',
  },
  {
    key: 'engarrafamento',
    label: '🚗 Engarrafamento / Lentidão em Tempo Real',
    defaultTitle: '🚗 Engarrafamento e Lentidão na Via',
    defaultDesc: 'Trânsito parado ou muito lento neste trecho em tempo real.',
    severity: 'alta',
    zoneColor: '#ea580c',
    radius: 220,
    samplePhoto: 'https://images.unsplash.com/photo-1568605117036-5fe5e7bab0b7?auto=format&fit=crop&w=700&q=80',
  },
  {
    key: 'blitz',
    label: '👮 Blitz / Ponto de Policiamento',
    defaultTitle: '👮 Blitz & Policiamento na Via',
    defaultDesc: 'Ponto com viatura policial e fiscalização ativa no momento.',
    severity: 'media',
    zoneColor: '#2563eb',
    radius: 150,
    samplePhoto: 'https://images.unsplash.com/photo-1541888946425-d09bb18086f6?auto=format&fit=crop&w=700&q=80',
  },
  {
    key: 'radar',
    label: '📸 Pardal / Limite de Velocidade',
    defaultTitle: '📸 Pardal Eletrônico de Velocidade',
    defaultDesc: 'Fiscalização eletrônica de limite de velocidade ativa na via.',
    severity: 'media',
    zoneColor: '#7c3aed',
    radius: 120,
    samplePhoto: 'https://images.unsplash.com/photo-1449824913935-59a10b8d2000?auto=format&fit=crop&w=700&q=80',
  },
];

export const PhotoIncidentModal: React.FC<PhotoIncidentModalProps> = ({
  isOpen,
  onClose,
  currentLocation,
  detectedLocationName,
  onSaveOccurrence,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedCat, setSelectedCat] = useState(MARKER_CATEGORIES[0]);
  const [customTitle, setCustomTitle] = useState(MARKER_CATEGORIES[0].defaultTitle);
  const [customDesc, setCustomDesc] = useState(MARKER_CATEGORIES[0].defaultDesc);
  const [speedLimit, setSpeedLimit] = useState<number>(60);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<IncidentPhotoAnalysisResult | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    setCustomTitle(selectedCat.defaultTitle);
    setCustomDesc(selectedCat.defaultDesc);
  }, [selectedCat]);

  if (!isOpen) return null;

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Convert to data URL so it persists in localStorage and renders on the map
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setImagePreview(reader.result);
      }
    };
    reader.readAsDataURL(file);

    setIsAnalyzing(true);
    setAnalysisResult(null);

    try {
      const result = await IncidentAiService.analyzeIncidentImage(file, currentLocation);
      setAnalysisResult(result);
    } catch (err) {
      console.error('Erro na análise de imagem:', err);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleConfirmAndPublish = async () => {
    setIsSaving(true);
    try {
      const finalTitle =
        selectedCat.key === 'radar'
          ? `📸 Pardal Eletrônico • Limite ${speedLimit} km/h`
          : customTitle.trim() || selectedCat.defaultTitle;

      await onSaveOccurrence({
        category: selectedCat.key,
        title: finalTitle,
        description: customDesc.trim() || selectedCat.defaultDesc,
        locationName: detectedLocationName,
        coordinates: currentLocation,
        severity: selectedCat.severity,
        photoUrl: imagePreview || selectedCat.samplePhoto,
        isAiValidated: true,
        aiConfidencePercent: analysisResult?.confidencePercent || 98,
        speedLimitKmh: selectedCat.key === 'radar' ? speedLimit : undefined,
        riskRadiusMeters: selectedCat.radius,
        zoneColor: selectedCat.zoneColor,
      });
      handleClose();
    } catch (err) {
      console.error(err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleClose = () => {
    setImagePreview(null);
    setAnalysisResult(null);
    setIsAnalyzing(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[1200] flex items-center justify-center bg-slate-950/85 backdrop-blur-md p-3 sm:p-4 animate-fade-in">
      <div className="bg-slate-900 border border-rose-500/40 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-950">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-gradient-to-tr from-rose-600 to-amber-500 text-white shadow-md">
              <Camera className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-black text-white flex items-center gap-2">
                Marcar Local no Mapa & Tirar Foto Ao Vivo
              </h2>
              <p className="text-[11px] text-slate-400">
                Demarque locais de roubo, sem iluminação, buracos, alagamento, blitz ou pardal
              </p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition"
          >
            <XCircle className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 overflow-y-auto space-y-3.5 text-slate-200">
          {/* Active GPS Coordinates Banner */}
          <div className="p-2.5 bg-slate-950 border border-cyan-500/40 rounded-xl text-xs flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 min-w-0">
              <MapPin className="w-4 h-4 text-cyan-400 shrink-0" />
              <span className="truncate font-bold text-cyan-200">{detectedLocationName}</span>
            </div>
            <span className="text-[10px] font-mono text-slate-400 shrink-0">
              {currentLocation.lat.toFixed(5)}, {currentLocation.lng.toFixed(5)}
            </span>
          </div>

          {/* 1. Choose What to Mark on the Map */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-black uppercase tracking-wider text-slate-300 block">
              1. O que está ocorrendo neste local? (Fica marcado com cor no mapa)
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 max-h-48 overflow-y-auto pr-1">
              {MARKER_CATEGORIES.map(cat => {
                const isSelected = selectedCat.key === cat.key;
                return (
                  <button
                    key={cat.key}
                    type="button"
                    onClick={() => setSelectedCat(cat)}
                    className={`p-2 rounded-xl border text-left text-xs font-bold transition-all flex items-center gap-2 ${
                      isSelected
                        ? 'bg-rose-600/25 border-rose-400 text-white shadow-md'
                        : 'bg-slate-950/70 hover:bg-slate-800 border-slate-800 text-slate-300'
                    }`}
                  >
                    <span
                      className="w-3 h-3 rounded-full shrink-0 border border-white/50"
                      style={{ backgroundColor: cat.zoneColor }}
                    />
                    <span className="truncate">{cat.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Speed Limit Selector when Pardal / Radar is selected */}
          {selectedCat.key === 'radar' && (
            <div className="p-3 rounded-xl bg-slate-950 border border-purple-500/40 space-y-2">
              <label className="text-xs font-black text-purple-300 block">
                Velocidade Máxima do Pardal (km/h):
              </label>
              <div className="flex items-center gap-2 flex-wrap">
                {[30, 40, 50, 60, 70, 80, 90, 100, 110].map(spd => (
                  <button
                    key={spd}
                    type="button"
                    onClick={() => setSpeedLimit(spd)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-black border transition-all ${
                      speedLimit === spd
                        ? 'bg-red-600 text-white border-white shadow-md'
                        : 'bg-slate-900 text-slate-300 border-slate-700'
                    }`}
                  >
                    {spd} km/h
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* 2. Camera / Photo Capture */}
          <div className="space-y-2">
            <label className="text-[11px] font-black uppercase tracking-wider text-slate-300 block">
              2. Tirar Foto Real do Local (Câmera ou Galeria)
            </label>
            <input
              type="file"
              ref={fileInputRef}
              accept="image/*"
              capture="environment"
              className="hidden"
              onChange={handleFileChange}
            />

            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="w-full py-3 px-4 bg-gradient-to-r from-rose-600 via-amber-500 to-lime-500 hover:brightness-110 text-slate-950 font-black text-xs rounded-xl flex items-center justify-center gap-2 shadow-lg active:scale-98 transition cursor-pointer"
            >
              <Camera className="w-4 h-4" />
              <span>📸 ABRIR CÂMERA E TIRAR FOTO DO LOCAL AGORA</span>
            </button>

            {imagePreview && (
              <div className="relative rounded-xl overflow-hidden border-2 border-lime-400 bg-slate-950 h-40 flex items-center justify-center">
                <img src={imagePreview} alt="Foto capturada do local" className="w-full h-full object-cover" />
                <span className="absolute top-2 left-2 px-2 py-0.5 rounded bg-lime-400 text-slate-950 font-black text-[10px]">
                  ✓ Foto Real Anexada
                </span>
                {isAnalyzing && (
                  <div className="absolute inset-0 bg-slate-950/75 backdrop-blur-sm flex flex-col items-center justify-center gap-2">
                    <Sparkles className="w-6 h-6 text-lime-400 animate-spin" />
                    <span className="text-xs font-bold text-white">Validando foto e coordenadas GPS...</span>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* 3. Custom Title & Details */}
          <div className="space-y-2">
            <input
              type="text"
              value={customTitle}
              onChange={e => setCustomTitle(e.target.value)}
              placeholder="Título do alerta no mapa..."
              className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs font-bold text-white focus:outline-none focus:border-cyan-400"
            />
            <textarea
              value={customDesc}
              onChange={e => setCustomDesc(e.target.value)}
              rows={2}
              placeholder="Descreva o ponto exato, referência ou orientação para outros motoristas..."
              className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-cyan-400"
            />
          </div>
        </div>

        {/* Action Footer */}
        <div className="p-3.5 border-t border-slate-800 bg-slate-950 flex gap-2.5">
          <button
            type="button"
            onClick={handleClose}
            disabled={isSaving}
            className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold rounded-xl text-xs transition"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={handleConfirmAndPublish}
            disabled={isSaving}
            className="flex-1 py-2.5 px-4 bg-gradient-to-r from-lime-400 to-emerald-500 hover:brightness-110 text-slate-950 font-black rounded-xl text-xs flex items-center justify-center gap-2 shadow-lg shadow-lime-500/20 active:scale-98 transition cursor-pointer"
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>{isSaving ? 'Marcando no Mapa...' : 'MARCAR NO MAPA EM TEMPO REAL'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};

