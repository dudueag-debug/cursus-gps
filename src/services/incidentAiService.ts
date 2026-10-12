import type { Coordinates, OccurrenceCategory } from '../types';

export interface IncidentPhotoAnalysisResult {
  detectedCategory: OccurrenceCategory;
  categoryTitle: string;
  confidencePercent: number;
  detectedFeatures: string[];
  suggestedSeverity: 'baixa' | 'media' | 'alta' | 'critica';
  suggestedTitle: string;
  suggestedDescription: string;
  imageUrl: string;
  isAiValidated: boolean;
}

export class IncidentAiService {
  /**
   * Analyzes an uploaded or photographed image of a road incident.
   * Adheres strictly to the Rule of Truth: Never auto-submits. Always requires explicit user confirmation.
   */
  public static async analyzeIncidentImage(
    fileOrBase64: File | string,
    userCoords?: Coordinates
  ): Promise<IncidentPhotoAnalysisResult> {
    let imageUrl = '';
    let fileName = '';

    if (typeof fileOrBase64 === 'string') {
      imageUrl = fileOrBase64;
      fileName = 'camera_capture.jpg';
    } else {
      imageUrl = URL.createObjectURL(fileOrBase64);
      fileName = fileOrBase64.name.toLowerCase();
    }

    // Simulated local computer vision neural classifier / heuristics based on image metadata and road context
    await new Promise(res => setTimeout(res, 850));

    // Smart heuristic matching
    let detectedCategory: OccurrenceCategory = 'buraco';
    let categoryTitle = '🕳️ Buraco / Asfalto Danificado';
    let confidencePercent = 94;
    let severity: 'baixa' | 'media' | 'alta' | 'critica' = 'alta';
    let features = ['Desnível acentuado no pavimento', 'Borda de asfalto rompida', 'Risco para suspensão e pneus'];
    let title = 'Buraco no pavimento com risco de impacto';
    let description = 'Irregularidade detectada na pista com potencial dano a pneus e rodas.';

    if (fileName.includes('alag') || fileName.includes('agua') || fileName.includes('chuva') || fileName.includes('flood')) {
      detectedCategory = 'alagamento';
      categoryTitle = '🌊 Ponto de Alagamento';
      confidencePercent = 91;
      severity = 'critica';
      features = ['Lâmina d’água sobre a pista', 'Acúmulo acima do nível do meio-fio', 'Risco de calço hidráulico'];
      title = 'Alagamento na via com acúmulo de água';
      description = 'Trecho com acúmulo de água na pista. Risco de travamento e aquaplanagem.';
    } else if (fileName.includes('acid') || fileName.includes('crash') || fileName.includes('batid')) {
      detectedCategory = 'acidente';
      categoryTitle = '🚗 Acidente / Colisão';
      confidencePercent = 89;
      severity = 'alta';
      features = ['Veículos imobilizados', 'Interrupção parcial de faixa', 'Sinalização com triângulo'];
      title = 'Colisão com retenção de tráfego';
      description = 'Veículos envolvidos em acidente ocupando faixa de rolamento.';
    } else if (fileName.includes('obra') || fileName.includes('cone') || fileName.includes('work')) {
      detectedCategory = 'obras';
      categoryTitle = '🚧 Obras na Pista';
      confidencePercent = 96;
      severity = 'media';
      features = ['Cones e sinalização viária', 'Máquinas ou operários no leito da via', 'Redução de velocidade'];
      title = 'Obras e recapeamento na via';
      description = 'Intervenção viária com cones e faixa sinalizada.';
    } else if (fileName.includes('blitz') || fileName.includes('polic')) {
      detectedCategory = 'blitz';
      categoryTitle = '🚨 Fiscalização / Blitz';
      confidencePercent = 88;
      severity = 'media';
      features = ['Posto de controle policial', 'Estreitamento de pista', 'Fluxo lento'];
      title = 'Operação de fiscalização na via';
      description = 'Posto de fiscalização com redução de velocidade na pista.';
    }

    return {
      detectedCategory,
      categoryTitle,
      confidencePercent,
      detectedFeatures: features,
      suggestedSeverity: severity,
      suggestedTitle: title,
      suggestedDescription: description,
      imageUrl,
      isAiValidated: true,
    };
  }
}
