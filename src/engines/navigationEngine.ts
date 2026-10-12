import type { Coordinates, RouteOption, RouteStep } from '../types';

export interface IntersectionDetail {
  isApproaching: boolean;
  distanceToIntersectionMeters: number;
  intersectionType: 'roundabout' | 'fork_split' | 'multi_lane_turn' | 'highway_exit' | 'standard';
  recommendedLanes: { laneIndex: number; isOptimal: boolean; direction: 'left' | 'center' | 'right' }[];
  laneGuidanceText: string;
  suggestedZoomLevel: number;
  tiltAngleDeg: number;
}

export class NavigationEngine {
  /**
   * Builds natural spoken Brazilian Portuguese instructions (Section 10)
   */
  public static formatNaturalSpokenInstruction(step: RouteStep): string {
    const dist = step.distanceMeters;
    let distPhrase = '';

    if (dist > 1000) {
      const km = (dist / 1000).toFixed(1).replace('.', ',');
      distPhrase = `Em ${km} quilômetros, `;
    } else if (dist > 150) {
      distPhrase = `Em ${dist} metros, `;
    } else if (dist > 30) {
      distPhrase = 'Em breve, ';
    } else {
      distPhrase = 'Agora, ';
    }

    switch (step.maneuver) {
      case 'turn-left':
        return `${distPhrase}vire à esquerda${step.streetName ? ' na ' + step.streetName : ''}.`;
      case 'turn-right':
        return `${distPhrase}vire à direita${step.streetName ? ' na ' + step.streetName : ''}.`;
      case 'merge':
        return `${distPhrase}mantenha-se à faixa de acesso para entrar na via principal.`;
      case 'roundabout':
        return `${distPhrase}entre na rotatória e pegue a saída indicada.`;
      case 'arrive':
        return 'Você chegou ao seu destino.';
      default:
        return `${distPhrase}siga em frente na via principal.`;
    }
  }

  /**
   * Complex Intersections Mode Evaluator (Section 11)
   * Detects when approaching a major split, roundabout, or highway exit to provide zoom & lane guidance.
   */
  public static evaluateIntersectionMode(
    distanceToNextStepMeters: number,
    currentStep: RouteStep | null
  ): IntersectionDetail {
    if (!currentStep) {
      return {
        isApproaching: false,
        distanceToIntersectionMeters: 0,
        intersectionType: 'standard',
        recommendedLanes: [],
        laneGuidanceText: '',
        suggestedZoomLevel: 16,
        tiltAngleDeg: 0,
      };
    }

    const isApproaching = distanceToNextStepMeters < 180 && distanceToNextStepMeters > 5;
    let type: IntersectionDetail['intersectionType'] = 'standard';
    let lanes: IntersectionDetail['recommendedLanes'] = [];
    let laneText = 'Mantenha-se na sua faixa';

    if (currentStep.maneuver === 'roundabout') {
      type = 'roundabout';
      laneText = 'Rotatória à frente: acesse pela faixa externa ou intermediária';
      lanes = [
        { laneIndex: 0, isOptimal: true, direction: 'center' },
        { laneIndex: 1, isOptimal: true, direction: 'right' },
      ];
    } else if (currentStep.maneuver === 'turn-left') {
      type = 'multi_lane_turn';
      laneText = 'Aproxime-se das 2 faixas da esquerda';
      lanes = [
        { laneIndex: 0, isOptimal: true, direction: 'left' },
        { laneIndex: 1, isOptimal: false, direction: 'center' },
        { laneIndex: 2, isOptimal: false, direction: 'right' },
      ];
    } else if (currentStep.maneuver === 'turn-right') {
      type = 'multi_lane_turn';
      laneText = 'Aproxime-se da faixa da direita';
      lanes = [
        { laneIndex: 0, isOptimal: false, direction: 'left' },
        { laneIndex: 1, isOptimal: false, direction: 'center' },
        { laneIndex: 2, isOptimal: true, direction: 'right' },
      ];
    } else if (currentStep.maneuver === 'merge') {
      type = 'highway_exit';
      laneText = 'Bifurcação: acesse a alça de saída';
      lanes = [
        { laneIndex: 0, isOptimal: false, direction: 'left' },
        { laneIndex: 1, isOptimal: true, direction: 'right' },
      ];
    }

    return {
      isApproaching,
      distanceToIntersectionMeters: distanceToNextStepMeters,
      intersectionType: type,
      recommendedLanes: lanes,
      laneGuidanceText: laneText,
      suggestedZoomLevel: isApproaching ? 18.5 : 16,
      tiltAngleDeg: isApproaching ? 38 : 28,
    };
  }
}
