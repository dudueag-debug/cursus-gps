import L from 'leaflet';
import { VehicleModel, VehicleColor } from '../../types';

export const getVehicleColorHex = (color: VehicleColor): { primary: string; secondary: string; highlight: string } => {
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
      return { primary: '#CCFF00', secondary: '#88B800', highlight: '#E5FF80' };
  }
};

export const createVehicleDivIcon = (
  model: VehicleModel,
  color: VehicleColor,
  headingDegrees: number = 0,
  enableWindEffect: boolean = true,
  isNavigating: boolean = false
) => {
  const { primary, secondary, highlight } = getVehicleColorHex(color);

  // SVG representation for realistic 3D vehicle
  let vehicleSvg = '';

  if (model === 'walker') {
    vehicleSvg = `
      <svg viewBox="0 0 36 36" class="w-9 h-9 drop-shadow-[0_4px_8px_rgba(0,0,0,0.8)]" fill="none">
        <!-- 3D Pedestrian Marker -->
        <ellipse cx="18" cy="30" rx="9" ry="3.5" fill="#000000" opacity="0.6" />
        <circle cx="18" cy="10" r="5" fill="${highlight}" stroke="${secondary}" stroke-width="1.5" />
        <path d="M14 17 L22 17 L24 28 L20 28 L19 21 L17 21 L16 28 L12 28 Z" fill="${primary}" stroke="#000" stroke-width="1" />
        <circle cx="18" cy="10" r="2" fill="#fff" />
      </svg>
    `;
  } else if (model.startsWith('motorcycle')) {
    vehicleSvg = `
      <svg viewBox="0 0 40 54" class="w-10 h-13" fill="none">
        <defs>
          <radialGradient id="bikeHeadlight" cx="50%" cy="100%" r="90%">
            <stop offset="0%" stop-color="#ffffff" stop-opacity="0.9" />
            <stop offset="40%" stop-color="#99f6e4" stop-opacity="0.4" />
            <stop offset="100%" stop-color="#99f6e4" stop-opacity="0" />
          </radialGradient>
          <linearGradient id="bikeBody" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stop-color="${secondary}" />
            <stop offset="45%" stop-color="${primary}" />
            <stop offset="60%" stop-color="${highlight}" />
            <stop offset="100%" stop-color="${secondary}" />
          </linearGradient>
        </defs>

        <!-- Asphalt Headlight Beam -->
        <polygon points="12,12 28,12 38,-15 2,-15" fill="url(#bikeHeadlight)" />

        <!-- Ambient Shadow underneath -->
        <ellipse cx="20" cy="36" rx="8" ry="14" fill="#000000" opacity="0.75" />

        <!-- Rear Wheel -->
        <rect x="18" y="38" width="4" height="10" rx="2" fill="#0f172a" stroke="#475569" stroke-width="1" />

        <!-- 3D Bike Fairing -->
        <path d="M17 12 C14 16, 13 26, 15 34 L25 34 C27 26, 26 16, 23 12 Z" fill="url(#bikeBody)" stroke="#090d16" stroke-width="1" />

        <!-- Front Wheel & Handlebars -->
        <rect x="18.5" y="6" width="3" height="8" rx="1.5" fill="#1e293b" />
        <line x1="10" y1="14" x2="30" y2="14" stroke="#e2e8f0" stroke-width="2.5" stroke-linecap="round" />
        <circle cx="10" cy="14" r="2" fill="${secondary}" />
        <circle cx="30" cy="14" r="2" fill="${secondary}" />

        <!-- Rider Helmet 3D with Visor -->
        <ellipse cx="20" cy="24" rx="4.5" ry="5.5" fill="#1e293b" stroke="${primary}" stroke-width="1.5" />
        <path d="M18 21 Q20 19 22 21 Q20 22 18 21" fill="#00D2FF" />

        <!-- Twin Tail LED -->
        <circle cx="19" cy="46" r="1.5" fill="#ff0033" />
        <circle cx="21" cy="46" r="1.5" fill="#ff0033" />
      </svg>
    `;
  } else if (model === 'suv') {
    vehicleSvg = `
      <svg viewBox="0 0 46 64" class="w-12 h-16" fill="none">
        <defs>
          <radialGradient id="suvBeam" cx="50%" cy="100%" r="90%">
            <stop offset="0%" stop-color="#ffffff" stop-opacity="0.85" />
            <stop offset="50%" stop-color="#cffafe" stop-opacity="0.35" />
            <stop offset="100%" stop-color="#00D2FF" stop-opacity="0" />
          </radialGradient>
          <linearGradient id="suvMetallic" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stop-color="${secondary}" />
            <stop offset="25%" stop-color="${primary}" />
            <stop offset="50%" stop-color="${highlight}" />
            <stop offset="75%" stop-color="${primary}" />
            <stop offset="100%" stop-color="${secondary}" />
          </linearGradient>
          <linearGradient id="glassRoof" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stop-color="#0f172a" />
            <stop offset="50%" stop-color="#1e293b" />
            <stop offset="100%" stop-color="#020617" />
          </linearGradient>
        </defs>

        <!-- 3D Laser Headlight Beams illuminating the road -->
        <polygon points="10,14 36,14 46,-25 0,-25" fill="url(#suvBeam)" />

        <!-- Contact Ground Shadow with Ambient Occlusion -->
        <ellipse cx="23" cy="42" rx="17" ry="19" fill="#000000" opacity="0.8" filter="blur(1px)" />

        <!-- 3D Wheels & Mudguards -->
        <rect x="5" y="16" width="4" height="9" rx="2" fill="#090d16" stroke="#334155" stroke-width="0.8" />
        <rect x="37" y="16" width="4" height="9" rx="2" fill="#090d16" stroke="#334155" stroke-width="0.8" />
        <rect x="5" y="44" width="4" height="10" rx="2" fill="#090d16" stroke="#334155" stroke-width="0.8" />
        <rect x="37" y="44" width="4" height="10" rx="2" fill="#090d16" stroke="#334155" stroke-width="0.8" />

        <!-- Robust SUV 3D Chassis Body -->
        <path d="M10 12 C10 8, 36 8, 36 12 L38 52 C38 57, 8 57, 8 52 Z" fill="url(#suvMetallic)" stroke="#090d16" stroke-width="1.8" />

        <!-- Panoramic Windshield & Roof Bars -->
        <path d="M12 18 Q23 14 34 18 L33 26 Q23 24 13 26 Z" fill="url(#glassRoof)" stroke="#090d16" stroke-width="1" />
        <!-- Windshield reflection highlight -->
        <path d="M14 20 L26 16 L24 24 Z" fill="#ffffff" opacity="0.25" />

        <!-- Sunroof / Roof Carrier Bars -->
        <rect x="13" y="29" width="20" height="18" rx="2" fill="#090d16" stroke="${secondary}" stroke-width="1" />
        <line x1="11" y1="33" x2="35" y2="33" stroke="#94a3b8" stroke-width="1.5" />
        <line x1="11" y1="41" x2="35" y2="41" stroke="#94a3b8" stroke-width="1.5" />

        <!-- Rear Glass Window -->
        <path d="M13 49 Q23 48 33 49 L32 52 Q23 52 14 52 Z" fill="#020617" />

        <!-- Dual Laser Projector Headlights -->
        <circle cx="12" cy="11" r="2.5" fill="#ffffff" />
        <circle cx="12" cy="11" r="1.5" fill="#00D2FF" />
        <circle cx="34" cy="11" r="2.5" fill="#ffffff" />
        <circle cx="34" cy="11" r="1.5" fill="#00D2FF" />

        <!-- LED Ruby Taillights -->
        <rect x="9" y="52" width="6" height="2.5" rx="1" fill="#ff0044" />
        <rect x="31" y="52" width="6" height="2.5" rx="1" fill="#ff0044" />
      </svg>
    `;
  } else if (model === 'sport') {
    // Ultra Realistic 3D Supercar GT
    vehicleSvg = `
      <svg viewBox="0 0 46 64" class="w-12 h-16" fill="none">
        <defs>
          <radialGradient id="gtBeam" cx="50%" cy="100%" r="90%">
            <stop offset="0%" stop-color="#ffffff" stop-opacity="0.9" />
            <stop offset="40%" stop-color="#67e8f9" stop-opacity="0.45" />
            <stop offset="100%" stop-color="#0066FF" stop-opacity="0" />
          </radialGradient>
          <linearGradient id="gtPaint" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stop-color="${secondary}" />
            <stop offset="20%" stop-color="${primary}" />
            <stop offset="50%" stop-color="${highlight}" />
            <stop offset="80%" stop-color="${primary}" />
            <stop offset="100%" stop-color="${secondary}" />
          </linearGradient>
          <linearGradient id="gtGlass" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stop-color="#0284c7" stop-opacity="0.9" />
            <stop offset="50%" stop-color="#090d16" />
            <stop offset="100%" stop-color="#020617" />
          </linearGradient>
        </defs>

        <!-- Xenon High-Tech Road Light Cone -->
        <polygon points="10,13 36,13 46,-28 0,-28" fill="url(#gtBeam)" />

        <!-- Ambient Ground Contact Shadow -->
        <ellipse cx="23" cy="40" rx="16" ry="19" fill="#000000" opacity="0.85" filter="blur(1.2px)" />

        <!-- Wheels / Low-profile Pirelli Tires -->
        <rect x="5" y="16" width="3.5" height="9" rx="1.5" fill="#020617" stroke="#475569" stroke-width="0.8" />
        <rect x="37.5" y="16" width="3.5" height="9" rx="1.5" fill="#020617" stroke="#475569" stroke-width="0.8" />
        <rect x="5" y="43" width="3.5" height="10" rx="1.5" fill="#020617" stroke="#475569" stroke-width="0.8" />
        <rect x="37.5" y="43" width="3.5" height="10" rx="1.5" fill="#020617" stroke="#475569" stroke-width="0.8" />

        <!-- Sculpted Aerodynamic Supercar 3D Body -->
        <path d="M12 9 C15 6, 31 6, 34 9 L38 22 C39 28, 38 42, 38 52 C38 56, 8 56, 8 52 C8 42, 7 28, 8 22 Z" fill="url(#gtPaint)" stroke="#090d16" stroke-width="1.8" />

        <!-- Front Aerodynamic Hood Vents -->
        <polygon points="17,14 23,12 29,14 26,17 20,17" fill="#090d16" />

        <!-- Curved Windshield with Realistic Reflection Glare -->
        <path d="M13 21 Q23 18 33 21 L31 31 Q23 29 15 31 Z" fill="url(#gtGlass)" stroke="#090d16" stroke-width="1" />
        <polygon points="16,23 24,19 21,29" fill="#ffffff" opacity="0.3" />

        <!-- Side Mirrors -->
        <path d="M7 23 L10 24 L10 27 Z" fill="${secondary}" />
        <path d="M39 23 L36 24 L36 27 Z" fill="${secondary}" />

        <!-- Roof & Rear Window -->
        <rect x="15" y="32" width="16" height="12" rx="3" fill="#090d16" />
        <path d="M16 45 Q23 44 30 45 L29 48 Q23 48 17 48 Z" fill="#020617" />

        <!-- Dual Aerodynamic Rear Spoiler Wings -->
        <rect x="7" y="52" width="32" height="3" rx="1.5" fill="#090d16" stroke="${primary}" stroke-width="1" />

        <!-- Projector Headlight LEDs -->
        <circle cx="12" cy="9.5" r="2.5" fill="#ffffff" />
        <circle cx="34" cy="9.5" r="2.5" fill="#ffffff" />

        <!-- Full-Width LED Ruby Lightbar -->
        <rect x="10" y="55" width="26" height="2" rx="1" fill="#ff0033" />
      </svg>
    `;
  } else {
    // Default Sedan Executivo 3D Luxo
    vehicleSvg = `
      <svg viewBox="0 0 44 62" class="w-11 h-15" fill="none">
        <defs>
          <radialGradient id="sedanBeam" cx="50%" cy="100%" r="90%">
            <stop offset="0%" stop-color="#ffffff" stop-opacity="0.85" />
            <stop offset="50%" stop-color="#a5f3fc" stop-opacity="0.35" />
            <stop offset="100%" stop-color="#0066FF" stop-opacity="0" />
          </radialGradient>
          <linearGradient id="sedanPaint" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stop-color="${secondary}" />
            <stop offset="25%" stop-color="${primary}" />
            <stop offset="50%" stop-color="${highlight}" />
            <stop offset="75%" stop-color="${primary}" />
            <stop offset="100%" stop-color="${secondary}" />
          </linearGradient>
          <linearGradient id="sedanGlass" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stop-color="#0f172a" />
            <stop offset="60%" stop-color="#1e293b" />
            <stop offset="100%" stop-color="#020617" />
          </linearGradient>
        </defs>

        <!-- Forward Headlight Road Illumination -->
        <polygon points="10,12 34,12 44,-24 0,-24" fill="url(#sedanBeam)" />

        <!-- Ambient Shadow underneath chassis -->
        <ellipse cx="22" cy="38" rx="15" ry="18" fill="#000000" opacity="0.8" filter="blur(1px)" />

        <!-- Tires with Alloy Rims -->
        <rect x="5" y="15" width="3.5" height="9" rx="1.5" fill="#090d16" stroke="#475569" stroke-width="0.8" />
        <rect x="35.5" y="15" width="3.5" height="9" rx="1.5" fill="#090d16" stroke="#475569" stroke-width="0.8" />
        <rect x="5" y="41" width="3.5" height="9.5" rx="1.5" fill="#090d16" stroke="#475569" stroke-width="0.8" />
        <rect x="35.5" y="41" width="3.5" height="9.5" rx="1.5" fill="#090d16" stroke="#475569" stroke-width="0.8" />

        <!-- Sedan 3D Metallic Body Contour -->
        <path d="M11 9 C14 6, 30 6, 33 9 L36 21 C37 28, 36 41, 36 50 C36 55, 8 55, 8 50 C8 41, 7 28, 8 21 Z" fill="url(#sedanPaint)" stroke="#090d16" stroke-width="1.8" />

        <!-- Curved Windshield with Glare Glass reflection -->
        <path d="M12 17 Q22 14 32 17 L30 26 Q22 24 14 26 Z" fill="url(#sedanGlass)" stroke="#090d16" stroke-width="1" />
        <polygon points="14,19 24,16 21,25" fill="#ffffff" opacity="0.25" />

        <!-- Side Mirrors -->
        <path d="M6 19 L9 20 L9 23 Z" fill="${secondary}" />
        <path d="M38 19 L35 20 L35 23 Z" fill="${secondary}" />

        <!-- Tinted Glass Panoramic Roof -->
        <rect x="13.5" y="27" width="17" height="14" rx="2" fill="#020617" stroke="${secondary}" stroke-width="0.8" />

        <!-- Rear Window Glass -->
        <path d="M13 43 Q22 42 31 43 L30 46 Q22 46 14 46 Z" fill="#020617" />

        <!-- Bi-Xenon Headlights -->
        <circle cx="11.5" cy="9.5" r="2.2" fill="#ffffff" />
        <circle cx="32.5" cy="9.5" r="2.2" fill="#ffffff" />

        <!-- Ruby Rear Taillights -->
        <rect x="9" y="50" width="5" height="2" rx="1" fill="#ff0033" />
        <rect x="30" y="50" width="5" height="2" rx="1" fill="#ff0033" />
      </svg>
    `;
  }

  // Speed Wind Slipstream Animation trailing behind the vehicle
  const windEffectHtml = (enableWindEffect && isNavigating) ? `
    <div class="absolute -bottom-6 left-1/2 -translate-x-1/2 flex flex-col items-center pointer-events-none opacity-90">
      <div class="w-1.5 h-5 rounded-full bg-cyan-400/90 animate-pulse shadow-[0_0_8px_#00D2FF]"></div>
      <div class="w-1 h-6 rounded-full bg-lime-300/80 mt-1 animate-pulse shadow-[0_0_8px_#CCFF00]" style="animation-delay: 0.15s;"></div>
      <div class="w-0.5 h-3 rounded-full bg-white/60 mt-0.5 animate-pulse" style="animation-delay: 0.3s;"></div>
    </div>
  ` : '';

  const html = `
    <div class="relative flex items-center justify-center w-16 h-16 select-none cursor-pointer">
      <!-- High-Precision GPS Anchor Point Dot (True Location) -->
      <div class="absolute w-2.5 h-2.5 rounded-full bg-lime-400 border border-slate-950 shadow-[0_0_8px_#CCFF00] z-0 pointer-events-none"></div>

      <!-- 3D Radar Pulse Ring -->
      <div class="absolute w-14 h-14 rounded-full border border-lime-400/40 animate-ping opacity-30 pointer-events-none"></div>

      <!-- Realistic 3D Vehicle with directional rotation around true center -->
      <div class="relative z-10 flex items-center justify-center transition-transform duration-200 ease-out" style="transform: rotate(${headingDegrees}deg); transform-origin: center center;">
        ${vehicleSvg}
        ${windEffectHtml}
      </div>
    </div>
  `;

  return L.divIcon({
    className: 'tp-3d-vehicle-marker',
    html,
    iconSize: [64, 64],
    iconAnchor: [32, 32],
  });
};
