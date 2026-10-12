import React, { useState, useRef } from 'react';
import { Camera, Upload, CheckCircle2, XCircle, Sparkles, AlertTriangle, ShieldCheck, ArrowLeft } from 'lucide-react';
import type { Coordinates, Occurrence } from '../../types';
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
  }) => Promise<void>;
}

export const PhotoIncidentModal: React.FC<PhotoIncidentModalProps> = ({
  isOpen,
  onClose,
  currentLocation,
  detectedLocationName,
  onSaveOccurrence,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<IncidentPhotoAnalysisResult | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  if (!isOpen) return null;

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const previewUrl = URL.createObjectURL(file);
    setImagePreview(previewUrl);
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

  const handleSimulateCameraCapture = async (category: string) => {
    setIsAnalyzing(true);
    setAnalysisResult(null);
    setImagePreview('https://images.unsplash.com/photo-1515162816999-a0c47dc192f7?w=600&auto=format&fit=crop&q=80');

    try {
      const result = await IncidentAiService.analyzeIncidentImage(category + '_buraco.jpg', currentLocation);
      setAnalysisResult(result);
    } catch (err) {
      console.error(err);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleConfirmAndPublish = async () => {
    if (!analysisResult) return;
    setIsSaving(true);
    try {
      await onSaveOccurrence({
        category: analysisResult.detectedCategory,
        title: analysisResult.suggestedTitle,
        description: analysisResult.suggestedDescription,
        locationName: detectedLocationName,
        coordinates: currentLocation,
        severity: analysisResult.suggestedSeverity,
        photoUrl: analysisResult.imageUrl,
        isAiValidated: true,
        aiConfidencePercent: analysisResult.confidencePercent,
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-4 animate-fade-in">
      <div className="bg-slate-900 border border-slate-700/80 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-900/90">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-gradient-to-tr from-purple-600 to-indigo-600 text-white shadow-md">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                IA de Ocorrências com Foto
              </h2>
              <p className="text-xs text-slate-400">
                Detecção inteligente de buracos, alagamentos e perigos na via
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
        <div className="p-4 overflow-y-auto space-y-4 text-slate-200">
          {/* Rule of Truth Banner */}
          <div className="p-3 bg-slate-800/80 border border-slate-700 rounded-xl text-xs flex items-start gap-2.5">
            <ShieldCheck className="w-4 h-4 text-lime-400 mt-0.5 shrink-0" />
            <p className="text-slate-300">
              <span className="font-semibold text-lime-300">Regra de Validação Cursus:</span> A IA identifica a imagem, mas a ocorrência pública só é publicada após sua confirmação explícita.
            </p>
          </div>

          {/* Upload / Capture Selector */}
          {!imagePreview && (
            <div className="flex flex-col gap-3 py-4">
              <input
                type="file"
                ref={fileInputRef}
                accept="image/*"
                capture="environment"
                className="hidden"
                onChange={handleFileChange}
              />

              <button
                onClick={() => fileInputRef.current?.click()}
                className="w-full py-4 px-4 bg-gradient-to-r from-lime-500 to-emerald-600 hover:from-lime-400 hover:to-emerald-500 text-slate-950 font-bold rounded-xl flex items-center justify-center gap-3 shadow-lg shadow-lime-500/20 active:scale-98 transition cursor-pointer"
              >
                <Camera className="w-6 h-6" />
                <span>Tirar Foto ou Escolher Imagem</span>
              </button>

              <div className="flex items-center gap-2 my-2 text-xs text-slate-500 justify-center">
                <span>ou teste com amostras de vias:</span>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => handleSimulateCameraCapture('buraco')}
                  className="p-2.5 bg-slate-800 hover:bg-slate-700/80 border border-slate-700 text-xs font-semibold rounded-xl text-slate-300 text-center transition"
                >
                  🕳️ Simular Buraco
                </button>
                <button
                  onClick={() => handleSimulateCameraCapture('alagamento')}
                  className="p-2.5 bg-slate-800 hover:bg-slate-700/80 border border-slate-700 text-xs font-semibold rounded-xl text-slate-300 text-center transition"
                >
                  🌊 Simular Alagamento
                </button>
              </div>
            </div>
          )}

          {/* Preview & AI Analysis */}
          {imagePreview && (
            <div className="space-y-3">
              <div className="relative rounded-xl overflow-hidden border border-slate-700 bg-slate-950 max-h-52 flex items-center justify-center">
                <img src={imagePreview} alt="Ocorrência" className="w-full h-full object-cover" />
                {isAnalyzing && (
                  <div className="absolute inset-0 bg-slate-950/75 backdrop-blur-sm flex flex-col items-center justify-center gap-2">
                    <Sparkles className="w-8 h-8 text-lime-400 animate-spin" />
                    <span className="text-sm font-semibold text-white">IA Cursus Analisando Imagem...</span>
                  </div>
                )}
              </div>

              {analysisResult && (
                <div className="p-4 bg-slate-800/90 border border-purple-500/40 rounded-xl space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-bold text-white flex items-center gap-1.5">
                      {analysisResult.categoryTitle}
                    </span>
                    <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-purple-950 text-purple-300 border border-purple-500/50">
                      Confiança: {analysisResult.confidencePercent}%
                    </span>
                  </div>

                  <p className="text-xs text-slate-300">
                    {analysisResult.suggestedDescription}
                  </p>

                  <div className="space-y-1">
                    <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                      Características Identificadas:
                    </span>
                    <ul className="text-xs text-slate-300 space-y-0.5 list-disc list-inside">
                      {analysisResult.detectedFeatures.map((feat, idx) => (
                        <li key={idx}>{feat}</li>
                      ))}
                    </ul>
                  </div>

                  <div className="text-[11px] text-slate-400 pt-1 border-t border-slate-700/60 flex items-center justify-between">
                    <span>Local: {detectedLocationName}</span>
                    <span className="capitalize">Severidade: {analysisResult.suggestedSeverity}</span>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Action Footer */}
        {imagePreview && analysisResult && (
          <div className="p-4 border-t border-slate-800 bg-slate-900/95 flex gap-3">
            <button
              onClick={handleClose}
              disabled={isSaving}
              className="flex-1 py-3 px-4 bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold rounded-xl text-sm transition"
            >
              [ CANCELAR ]
            </button>
            <button
              onClick={handleConfirmAndPublish}
              disabled={isSaving}
              className="flex-1 py-3 px-4 bg-gradient-to-r from-lime-500 to-emerald-600 hover:from-lime-400 hover:to-emerald-500 text-slate-950 font-bold rounded-xl text-sm flex items-center justify-center gap-2 shadow-lg shadow-lime-500/20 active:scale-98 transition cursor-pointer"
            >
              {isSaving ? (
                <span>Salvando...</span>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  <span>[ CONFIRMAR ]</span>
                </>
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
