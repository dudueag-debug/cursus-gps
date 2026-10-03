import L from 'leaflet';
import { VehicleModel, VehicleColor } from '../../types';

export const getVehicleColorHex = (color: VehicleColor): string => {
  switch (color) {
    case 'lime': return '#CCFF00';
    case 'electric_blue': return '#00D2FF';
    case 'cyber_yellow': return '#FFD000';
    case 'ruby_red': return '#FF3366';
    case 'silver': return '#E2E8F0';
    default: return '#CCFF00';
  }
};

export const createVehicleDivIcon = (
  model: VehicleModel,
  color: VehicleColor,
  headingDegrees: number = 0,
  enableWindEffect: boolean = true,
  isNavigating: boolean = false
) => {
  const colorHex = getVehicleColorHex(color);

  // SVG representation for each model
  let vehicleSvg = '';

  if (model === 'walker') {
    vehicleSvg = `
      <svg viewBox="0 0 24 24" class="w-8 h-8 drop-shadow-[0_0_10px_${colorHex}]" fill="none" stroke="${colorHex}" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
        <circle cx="12" cy="5" r="2" fill="${colorHex}" />
        <path d="m9 20 3-6 2 3 3-5" />
        <path d="m6 10 3 2 3-2 3 2" />
      </svg>
    `;
  } else if (model.startsWith('motorcycle')) {
    vehicleSvg = `
      <svg viewBox="0 0 32 32" class="w-9 h-9 drop-shadow-[0_0_12px_${colorHex}]" fill="none">
        <!-- Motorcycle body top-down -->
        <ellipse cx="16" cy="7" rx="3.5" ry="6" fill="#1e293b" stroke="${colorHex}" stroke-width="2" />
        <rect x="14" y="13" width="4" height="12" rx="2" fill="${colorHex}" />
        <!-- Front wheel / handlebars -->
        <line x1="8" y1="9" x2="24" y2="9" stroke="${colorHex}" stroke-width="3" stroke-linecap="round" />
        <!-- Rear wheel -->
        <rect x="14.5" y="24" width="3" height="6" rx="1.5" fill="#0f172a" stroke="${colorHex}" stroke-width="1.5" />
        <!-- Helmet indicator -->
        <circle cx="16" cy="17" r="3.5" fill="#ffffff" stroke="${colorHex}" stroke-width="1.5" />
      </svg>
    `;
  } else if (model === 'van') {
    vehicleSvg = `
      <svg viewBox="0 0 32 40" class="w-9 h-11 drop-shadow-[0_0_12px_${colorHex}]" fill="none">
        <rect x="6" y="4" width="20" height="32" rx="5" fill="#0f172a" stroke="${colorHex}" stroke-width="2.5" />
        <!-- Windshield -->
        <path d="M8 12 Q16 9 24 12" stroke="${colorHex}" stroke-width="2.5" fill="none" />
        <!-- Headlights -->
        <circle cx="8" cy="5" r="1.5" fill="#ffffff" />
        <circle cx="24" cy="5" r="1.5" fill="#ffffff" />
        <!-- Roof ribs -->
        <line x1="10" y1="18" x2="22" y2="18" stroke="#334155" stroke-width="1.5" />
        <line x1="10" y1="24" x2="22" y2="24" stroke="#334155" stroke-width="1.5" />
      </svg>
    `;
  } else {
    // Default Car (Sedan / SUV) aerodynamic top-down view
    vehicleSvg = `
      <svg viewBox="0 0 32 40" class="w-9 h-11 drop-shadow-[0_0_14px_${colorHex}]" fill="none">
        <!-- Car body -->
        <path d="M9 7 C9 3, 23 3, 23 7 L25 29 C25 35, 7 35, 7 29 Z" fill="#090d16" stroke="${colorHex}" stroke-width="2.5" />
        <!-- Windshield front -->
        <path d="M10 11 Q16 8 22 11 L21 16 Q16 14 11 16 Z" fill="#1e293b" stroke="${colorHex}" stroke-width="1" />
        <!-- Rear window -->
        <path d="M11 25 Q16 23 21 25 L20 28 Q16 27 12 28 Z" fill="#1e293b" stroke="${colorHex}" stroke-width="1" />
        <!-- Glowing Headlights -->
        <polygon points="9,4 12,4 10,2" fill="#ffffff" />
        <polygon points="20,4 23,4 22,2" fill="#ffffff" />
        <!-- Center tech stripe -->
        <line x1="16" y1="16" x2="16" y2="25" stroke="${colorHex}" stroke-width="1.5" opacity="0.8" />
      </svg>
    `;
  }

  // Wind trail effect particles behind the vehicle
  const windEffectHtml = (enableWindEffect && isNavigating) ? `
    <div class="absolute -bottom-5 left-1/2 -translate-x-1/2 flex flex-col items-center pointer-events-none opacity-80">
      <div class="w-1 h-3 rounded-full bg-cyan-400/80 animate-pulse" style="animation-delay: 0.1s;"></div>
      <div class="w-0.5 h-4 rounded-full bg-lime-300/60 mt-0.5 animate-pulse" style="animation-delay: 0.3s;"></div>
      <div class="w-0.5 h-2 rounded-full bg-white/40 mt-0.5 animate-pulse" style="animation-delay: 0.5s;"></div>
    </div>
  ` : '';

  const html = `
    <div class="relative flex items-center justify-center w-14 h-14 select-none">
      <!-- Radar pulse ring -->
      <div class="absolute w-12 h-12 rounded-full border border-lime-400/50 animate-ping opacity-40"></div>
      
      <!-- Rotating vehicle container -->
      <div class="relative flex items-center justify-center transition-transform duration-300 ease-out" style="transform: rotate(${headingDegrees}deg);">
        ${vehicleSvg}
        ${windEffectHtml}
      </div>
    </div>
  `;

  return L.divIcon({
    html,
    className: 'custom-vehicle-marker',
    iconSize: [56, 56],
    iconAnchor: [28, 28],
  });
};
