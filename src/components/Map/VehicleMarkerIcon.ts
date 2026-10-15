import L from 'leaflet';
import { VehicleModel, VehicleColor } from '../../types';
import { CLASSIC_CARS_CATALOG, FACTORY_PALETTES, type ClassicCar } from '../../data/classicCarsCatalog';

export interface VehicleColorPalette {
  primary: string;
  secondary: string;
  highlight: string;
}

export const getVehicleColorHex = (
  color: VehicleColor | string,
  classicColorId?: string
): VehicleColorPalette => {
  // Check classic palette first
  if (classicColorId && FACTORY_PALETTES[classicColorId]) {
    const pal = FACTORY_PALETTES[classicColorId];
    return { primary: pal.primary, secondary: pal.secondary, highlight: pal.highlight };
  }

  switch (color) {
    case 'lime':
      return { primary: '#CCFF00', secondary: '#88B800', highlight: '#E5FF80' };
    case 'electric_blue':
      return { primary: '#00D2FF', secondary: '#0077B6', highlight: '#80E8FF' };
    case 'cyber_yellow':
      return { primary: '#FFD000', secondary: '#B39200', highlight: '#FFE780' };
    case 'ruby_red':
      return { primary: '#FF2A55', secondary: '#990022', highlight: '#FF8099' };
    case 'silver':
      return { primary: '#E2E8F0', secondary: '#64748B', highlight: '#FFFFFF' };
    case 'stealth_dark':
      return { primary: '#2D3748', secondary: '#1A202C', highlight: '#4A5568' };
    default:
      if (typeof color === 'string' && color.startsWith('#')) {
        return { primary: color, secondary: '#0F172A', highlight: '#FFFFFF' };
      }
      return { primary: '#CCFF00', secondary: '#88B800', highlight: '#E5FF80' };
  }
};

export const createVehicleDivIcon = (
  model: VehicleModel | string,
  color: VehicleColor | string,
  headingDegrees: number = 0,
  enableWindEffect: boolean = true,
  isNavigating: boolean = false,
  options?: {
    classicCarId?: string;
    classicColorId?: string;
    useSimpleMarker?: boolean;
    reducedMotion?: boolean;
  }
): L.DivIcon => {
  const classicId = options?.classicCarId || (typeof model === 'string' && model.startsWith('vw-') || model.startsWith('chevy-') || model.startsWith('ford-') || model.startsWith('fiat-') || model.startsWith('puma-') ? model : undefined);
  const classicCar: ClassicCar | undefined = classicId 
    ? CLASSIC_CARS_CATALOG.find(c => c.id === classicId) 
    : undefined;

  const { primary, secondary, highlight } = getVehicleColorHex(
    color,
    options?.classicColorId || classicCar?.defaultColorId
  );

  // 1. Simple High-Contrast Marker for Low-End Devices or Reduced Motion
  if (options?.useSimpleMarker || model === 'simple') {
    const simpleSvg = `
      <div class="relative flex items-center justify-center" style="transform: rotate(${headingDegrees}deg); transition: transform 0.15s linear;">
        <div class="w-10 h-10 rounded-full flex items-center justify-center bg-slate-950/90 border-2 border-cyan-400 shadow-[0_0_15px_rgba(6,182,212,0.6)]">
          <svg viewBox="0 0 24 24" class="w-6 h-6 text-lime-400" fill="currentColor">
            <path d="M12 2L4 20L12 16L20 20L12 2Z" />
          </svg>
        </div>
        <div class="absolute -inset-1 rounded-full border border-cyan-400/40 animate-ping pointer-events-none"></div>
      </div>
    `;

    return L.divIcon({
      className: 'tp-simple-vehicle-marker',
      html: simpleSvg,
      iconSize: [40, 40],
      iconAnchor: [20, 20],
    });
  }

  // 2. SVG representation for realistic 3D vehicle
  let vehicleSvg = '';

  if (classicCar) {
    // Dedicated classic car top-down rendering
    const style = classicCar.bodyStyle;

    if (style === 'beetle') {
      // Fusca: Iconic rounded curved wings & oval rear
      vehicleSvg = `
        <svg viewBox="0 0 46 64" class="w-12 h-16 drop-shadow-[0_8px_16px_rgba(0,0,0,0.85)]" fill="none">
          <defs>
            <linearGradient id="fuscaBody" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stop-color="${secondary}" />
              <stop offset="30%" stop-color="${primary}" />
              <stop offset="50%" stop-color="${highlight}" />
              <stop offset="70%" stop-color="${primary}" />
              <stop offset="100%" stop-color="${secondary}" />
            </linearGradient>
            <radialGradient id="fuscaBeam" cx="50%" cy="100%" r="90%">
              <stop offset="0%" stop-color="#fff" stop-opacity="0.8" />
              <stop offset="100%" stop-color="${primary}" stop-opacity="0" />
            </radialGradient>
          </defs>
          <polygon points="12,12 34,12 44,-20 2,-20" fill="url(#fuscaBeam)" />
          <ellipse cx="23" cy="38" rx="17" ry="20" fill="#000" opacity="0.75" />
          <!-- Wheels -->
          <rect x="5" y="16" width="4" height="9" rx="2" fill="#111" stroke="#ccc" stroke-width="0.8" />
          <rect x="37" y="16" width="4" height="9" rx="2" fill="#111" stroke="#ccc" stroke-width="0.8" />
          <rect x="5" y="44" width="4" height="9" rx="2" fill="#111" stroke="#ccc" stroke-width="0.8" />
          <rect x="37" y="44" width="4" height="9" rx="2" fill="#111" stroke="#ccc" stroke-width="0.8" />
          <!-- Rounded Fenders (Paralamas Arredondados) -->
          <path d="M12 14 C12 8, 34 8, 34 14 C38 18, 41 34, 40 48 C39 58, 7 58, 6 48 C5 34, 8 18, 12 14 Z" fill="url(#fuscaBody)" stroke="#0b1329" stroke-width="1.2" />
          <!-- Chrome Bumpers -->
          <rect x="11" y="9" width="24" height="2.5" rx="1.2" fill="#e2e8f0" stroke="#94a3b8" stroke-width="0.5" />
          <rect x="11" y="56" width="24" height="2.5" rx="1.2" fill="#e2e8f0" stroke="#94a3b8" stroke-width="0.5" />
          <!-- Windshield & Curved Roof (Teto Curvo) -->
          <ellipse cx="23" cy="34" rx="12" ry="14" fill="#0f172a" stroke="#cbd5e1" stroke-width="0.8" />
          <path d="M14 26 Q23 23 32 26 L30 38 Q23 39 16 38 Z" fill="#1e293b" />
          <!-- Twin Headlights (Faróis Redondos) -->
          <circle cx="14" cy="12" r="3" fill="#fff" stroke="#cbd5e1" stroke-width="1" />
          <circle cx="32" cy="12" r="3" fill="#fff" stroke="#cbd5e1" stroke-width="1" />
          <!-- Twin Tail Lights (Fafá) -->
          <circle cx="12" cy="52" r="2.2" fill="#ef4444" />
          <circle cx="34" cy="52" r="2.2" fill="#ef4444" />
        </svg>
      `;
    } else if (style === 'van') {
      // Kombi: Flat front, two-tone split windshield
      vehicleSvg = `
        <svg viewBox="0 0 46 68" class="w-12 h-17 drop-shadow-[0_8px_16px_rgba(0,0,0,0.85)]" fill="none">
          <defs>
            <linearGradient id="kombiBody" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stop-color="${secondary}" />
              <stop offset="50%" stop-color="${primary}" />
              <stop offset="100%" stop-color="${secondary}" />
            </linearGradient>
            <radialGradient id="kombiBeam" cx="50%" cy="100%" r="90%">
              <stop offset="0%" stop-color="#fff" stop-opacity="0.8" />
              <stop offset="100%" stop-color="${primary}" stop-opacity="0" />
            </radialGradient>
          </defs>
          <polygon points="12,10 34,10 44,-22 2,-22" fill="url(#kombiBeam)" />
          <rect x="7" y="10" width="32" height="54" rx="7" fill="url(#kombiBody)" stroke="#0b1329" stroke-width="1.2" />
          <!-- Split Windshield (Vidro Bipartido Corujinha) -->
          <rect x="11" y="14" width="11" height="8" rx="2" fill="#0f172a" stroke="#cbd5e1" stroke-width="0.8" />
          <rect x="24" y="14" width="11" height="8" rx="2" fill="#0f172a" stroke="#cbd5e1" stroke-width="0.8" />
          <!-- Side Windows (Janelinhas) -->
          <rect x="10" y="26" width="3" height="28" rx="1" fill="#0f172a" />
          <rect x="33" y="26" width="3" height="28" rx="1" fill="#0f172a" />
          <!-- White Roof Top -->
          <rect x="14" y="25" width="18" height="30" rx="3" fill="#f8fafc" opacity="0.9" />
          <!-- Headlights & Spare Wheel -->
          <circle cx="11" cy="11" r="3" fill="#fff" stroke="#94a3b8" stroke-width="0.8" />
          <circle cx="35" cy="11" r="3" fill="#fff" stroke="#94a3b8" stroke-width="0.8" />
          <circle cx="23" cy="11" r="3.5" fill="#f8fafc" stroke="#64748b" stroke-width="1" />
        </svg>
      `;
    } else if (style === 'coupe') {
      // Maverick / Puma / Corcel GT: Long muscular hood & fastback
      vehicleSvg = `
        <svg viewBox="0 0 46 66" class="w-12 h-17 drop-shadow-[0_8px_16px_rgba(0,0,0,0.85)]" fill="none">
          <defs>
            <linearGradient id="coupeBody" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stop-color="${secondary}" />
              <stop offset="30%" stop-color="${primary}" />
              <stop offset="50%" stop-color="${highlight}" />
              <stop offset="70%" stop-color="${primary}" />
              <stop offset="100%" stop-color="${secondary}" />
            </linearGradient>
            <radialGradient id="coupeBeam" cx="50%" cy="100%" r="90%">
              <stop offset="0%" stop-color="#fff" stop-opacity="0.8" />
              <stop offset="100%" stop-color="${primary}" stop-opacity="0" />
            </radialGradient>
          </defs>
          <polygon points="10,12 36,12 46,-24 0,-24" fill="url(#coupeBeam)" />
          <ellipse cx="23" cy="40" rx="17" ry="20" fill="#000" opacity="0.75" />
          <path d="M12 12 L34 12 L38 24 L39 52 L34 60 L12 60 L7 52 L8 24 Z" fill="url(#coupeBody)" stroke="#0b1329" stroke-width="1.2" />
          <!-- Dual Racing Stripes (Faixas Esportivas) -->
          <rect x="20" y="12" width="2.5" height="48" fill="#111827" opacity="0.7" />
          <rect x="23.5" y="12" width="2.5" height="48" fill="#111827" opacity="0.7" />
          <!-- Cabin Greenhouse Glass -->
          <path d="M13 28 L33 28 L31 46 L15 46 Z" fill="#0f172a" stroke="#94a3b8" stroke-width="0.8" />
          <circle cx="12" cy="13" r="2.5" fill="#fff" stroke="#94a3b8" stroke-width="0.8" />
          <circle cx="34" cy="13" r="2.5" fill="#fff" stroke="#94a3b8" stroke-width="0.8" />
        </svg>
      `;
    } else if (style === 'pickup') {
      // Saveiro: Pickup bed with roll bar
      vehicleSvg = `
        <svg viewBox="0 0 44 64" class="w-11 h-16 drop-shadow-[0_8px_16px_rgba(0,0,0,0.85)]" fill="none">
          <defs>
            <linearGradient id="pickupBody" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stop-color="${secondary}" />
              <stop offset="50%" stop-color="${primary}" />
              <stop offset="100%" stop-color="${secondary}" />
            </linearGradient>
          </defs>
          <rect x="8" y="12" width="28" height="48" rx="4" fill="url(#pickupBody)" stroke="#0b1329" stroke-width="1.2" />
          <!-- Cab (Cabine) -->
          <rect x="11" y="20" width="22" height="15" rx="3" fill="#0f172a" stroke="#cbd5e1" stroke-width="0.8" />
          <!-- Bed (Caçamba aberta) -->
          <rect x="11" y="38" width="22" height="19" rx="1.5" fill="#1e293b" stroke="#475569" stroke-width="0.8" />
          <!-- Roll bar (Santo Antônio) -->
          <line x1="10" y1="37" x2="34" y2="37" stroke="#cbd5e1" stroke-width="2" />
          <circle cx="12" cy="13" r="2.5" fill="#fff" />
          <circle cx="32" cy="13" r="2.5" fill="#fff" />
        </svg>
      `;
    } else {
      // General Sedan / Hatch classic (Opala, Monza, Chevette, Gol quadrado, Uno, Tempra, etc.)
      const isSquare = classicCar.id.includes('gol') || classicCar.id.includes('uno') || classicCar.id.includes('147');
      const hasEscada = classicCar.id === 'fiat-uno';

      vehicleSvg = `
        <svg viewBox="0 0 46 64" class="w-12 h-16 drop-shadow-[0_8px_16px_rgba(0,0,0,0.85)]" fill="none">
          <defs>
            <linearGradient id="classicBody" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stop-color="${secondary}" />
              <stop offset="35%" stop-color="${primary}" />
              <stop offset="50%" stop-color="${highlight}" />
              <stop offset="65%" stop-color="${primary}" />
              <stop offset="100%" stop-color="${secondary}" />
            </linearGradient>
            <radialGradient id="classicBeam" cx="50%" cy="100%" r="90%">
              <stop offset="0%" stop-color="#fff" stop-opacity="0.8" />
              <stop offset="100%" stop-color="${primary}" stop-opacity="0" />
            </radialGradient>
          </defs>
          <polygon points="10,12 36,12 46,-24 0,-24" fill="url(#classicBeam)" />
          <ellipse cx="23" cy="38" rx="17" ry="20" fill="#000" opacity="0.75" />
          <!-- Main Body Shell -->
          <rect x="${isSquare ? '8' : '9'}" y="12" width="${isSquare ? '30' : '28'}" height="48" rx="${isSquare ? '3' : '6'}" fill="url(#classicBody)" stroke="#0b1329" stroke-width="1.2" />
          <!-- Cabin Windows -->
          <rect x="12" y="24" width="22" height="22" rx="3" fill="#0f172a" stroke="#94a3b8" stroke-width="0.8" />
          ${hasEscada ? `
            <!-- The Mythical Brazilian Uno Roof Ladder (Escada da Firma) -->
            <rect x="18" y="16" width="10" height="36" fill="#facc15" stroke="#713f12" stroke-width="0.8" rx="1" />
            <line x1="18" y1="22" x2="28" y2="22" stroke="#713f12" stroke-width="1.2" />
            <line x1="18" y1="28" x2="28" y2="28" stroke="#713f12" stroke-width="1.2" />
            <line x1="18" y1="34" x2="28" y2="34" stroke="#713f12" stroke-width="1.2" />
            <line x1="18" y1="40" x2="28" y2="40" stroke="#713f12" stroke-width="1.2" />
            <line x1="18" y1="46" x2="28" y2="46" stroke="#713f12" stroke-width="1.2" />
          ` : ''}
          <!-- Rectangular or Quad Headlights -->
          <rect x="10" y="12" width="6" height="3" rx="1" fill="#fff" stroke="#94a3b8" stroke-width="0.5" />
          <rect x="30" y="12" width="6" height="3" rx="1" fill="#fff" stroke="#94a3b8" stroke-width="0.5" />
          <!-- Tail Lights -->
          <rect x="10" y="57" width="5" height="2.5" rx="0.8" fill="#ef4444" />
          <rect x="31" y="57" width="5" height="2.5" rx="0.8" fill="#ef4444" />
        </svg>
      `;
    }
  } else if (model === 'walker') {
    vehicleSvg = `
      <svg viewBox="0 0 36 36" class="w-9 h-9 drop-shadow-[0_4px_8px_rgba(0,0,0,0.8)]" fill="none">
        <ellipse cx="18" cy="30" rx="9" ry="3.5" fill="#000000" opacity="0.6" />
        <circle cx="18" cy="10" r="5" fill="${highlight}" stroke="${secondary}" stroke-width="1.5" />
        <path d="M14 17 L22 17 L24 28 L20 28 L19 21 L17 21 L16 28 L12 28 Z" fill="${primary}" stroke="#000" stroke-width="1" />
        <circle cx="18" cy="10" r="2" fill="#fff" />
      </svg>
    `;
  } else if (model.startsWith('motorcycle')) {
    vehicleSvg = `
      <svg viewBox="0 0 40 54" class="w-10 h-13 drop-shadow-[0_6px_12px_rgba(0,0,0,0.8)]" fill="none">
        <polygon points="12,12 28,12 38,-15 2,-15" fill="#fff" opacity="0.8" />
        <ellipse cx="20" cy="36" rx="8" ry="14" fill="#000000" opacity="0.75" />
        <rect x="18" y="38" width="4" height="10" rx="2" fill="#0f172a" stroke="#475569" stroke-width="1" />
        <path d="M17 12 C14 16, 13 26, 15 34 L25 34 C27 26, 26 16, 23 12 Z" fill="${primary}" stroke="#090d16" stroke-width="1" />
        <rect x="18.5" y="6" width="3" height="8" rx="1.5" fill="#1e293b" />
        <line x1="10" y1="14" x2="30" y2="14" stroke="#e2e8f0" stroke-width="2.5" stroke-linecap="round" />
        <ellipse cx="20" cy="24" rx="4.5" ry="5.5" fill="#1e293b" stroke="${primary}" stroke-width="1.5" />
        <circle cx="19" cy="46" r="1.5" fill="#ff0033" />
        <circle cx="21" cy="46" r="1.5" fill="#ff0033" />
      </svg>
    `;
  } else {
    // Default modern sports car / sedan
    vehicleSvg = `
      <svg viewBox="0 0 46 64" class="w-12 h-16 drop-shadow-[0_8px_16px_rgba(0,0,0,0.85)]" fill="none">
        <defs>
          <radialGradient id="stdBeam" cx="50%" cy="100%" r="90%">
            <stop offset="0%" stop-color="#fff" stop-opacity="0.85" />
            <stop offset="100%" stop-color="${primary}" stop-opacity="0" />
          </radialGradient>
          <linearGradient id="stdMetallic" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stop-color="${secondary}" />
            <stop offset="25%" stop-color="${primary}" />
            <stop offset="50%" stop-color="${highlight}" />
            <stop offset="75%" stop-color="${primary}" />
            <stop offset="100%" stop-color="${secondary}" />
          </linearGradient>
        </defs>
        <polygon points="10,14 36,14 46,-25 0,-25" fill="url(#stdBeam)" />
        <ellipse cx="23" cy="42" rx="17" ry="19" fill="#000" opacity="0.8" />
        <path d="M10 16 L36 16 L40 28 L39 52 L36 60 L10 60 L7 52 L6 28 Z" fill="url(#stdMetallic)" stroke="#090d16" stroke-width="1.2" />
        <rect x="13" y="24" width="20" height="24" rx="3" fill="#0f172a" stroke="#67e8f9" stroke-width="0.8" />
        <circle cx="12" cy="15" r="2.5" fill="#fff" />
        <circle cx="34" cy="15" r="2.5" fill="#fff" />
      </svg>
    `;
  }

  // Realistic aerodynamic particle streams / wind effect when navigating
  const windEffectHtml = (enableWindEffect && isNavigating && !options?.reducedMotion) ? `
    <div class="absolute inset-0 pointer-events-none flex justify-between px-1">
      <span class="w-0.5 h-6 bg-cyan-400/80 rounded-full animate-pulse -translate-y-4"></span>
      <span class="w-0.5 h-8 bg-lime-400/80 rounded-full animate-pulse -translate-y-6"></span>
    </div>
  ` : '';

  const finalHtml = `
    <div class="relative flex items-center justify-center cursor-pointer group" style="transform: rotate(${headingDegrees}deg); transition: transform ${options?.reducedMotion ? '0.05s' : '0.2s'} cubic-bezier(0.2, 0.8, 0.4, 1);">
      ${vehicleSvg}
      ${windEffectHtml}
    </div>
  `;

  return L.divIcon({
    className: 'tp-vehicle-marker-3d',
    html: finalHtml,
    iconSize: [48, 64],
    iconAnchor: [24, 32],
  });
};
