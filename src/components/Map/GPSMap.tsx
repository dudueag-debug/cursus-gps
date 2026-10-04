import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import type { Coordinates, RouteOption, Occurrence, CultureSpot, UserProfile, MapLayerType } from '../../types';
import { createVehicleDivIcon } from './VehicleMarkerIcon';
import { Crosshair, ZoomIn, ZoomOut, Eye, Layers, Compass, Box, Map as MapIcon, Globe } from 'lucide-react';

interface GPSMapProps {
  currentLocation: Coordinates;
  heading: number;
  user: UserProfile;
  isNavigating: boolean;
  selectedRoute: RouteOption | null;
  occurrences: Occurrence[];
  cultureSpots: CultureSpot[];
  onSelectOccurrence: (occ: Occurrence) => void;
  onSelectCultureSpot: (spot: CultureSpot) => void;
  onMapClick?: (coords: Coordinates) => void;
  isSplashActive?: boolean;
}

export const GPSMap: React.FC<GPSMapProps> = ({
  currentLocation,
  heading,
  user,
  isNavigating,
  selectedRoute,
  occurrences,
  cultureSpots,
  onSelectOccurrence,
  onSelectCultureSpot,
  onMapClick,
  isSplashActive = false,
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const tileLayerRef = useRef<L.TileLayer | null>(null);
  const vehicleMarkerRef = useRef<L.Marker | null>(null);
  const primaryRouteLineRef = useRef<L.Polyline | null>(null);
  const altRouteLineRef = useRef<L.Polyline | null>(null);
  const occurrencesLayerGroupRef = useRef<L.LayerGroup | null>(null);
  const cultureLayerGroupRef = useRef<L.LayerGroup | null>(null);

  // Active layer & 3D perspective mode
  const [activeLayer, setActiveLayer] = useState<MapLayerType>(user.mapLayerType || 'streets');
  const [is3DMode, setIs3DMode] = useState<boolean>(user.is3DMode || false);
  const [showLayerMenu, setShowLayerMenu] = useState<boolean>(false);

  // Layer URL Definitions
  const getLayerConfig = (layer: MapLayerType) => {
    switch (layer) {
      case 'satellite':
        return {
          url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
          maxZoom: 19,
          attribution: 'Tiles &copy; Esri World Imagery &bull; TÔ PASSANDO',
        };
      case 'topo':
        return {
          url: 'https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png',
          maxZoom: 17,
          attribution: '&copy; OpenTopoMap contributors &bull; TÔ PASSANDO',
        };
      case 'dark':
        return {
          url: 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',
          maxZoom: 19,
          attribution: '&copy; CARTO Dark Matter &bull; TÔ PASSANDO',
        };
      case 'streets':
      default:
        return {
          url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
          maxZoom: 19,
          attribution: '&copy; OpenStreetMap contributors &bull; TÔ PASSANDO',
        };
    }
  };

  // Switch Tile Layer dynamically
  const switchLayer = (newLayer: MapLayerType) => {
    if (!mapRef.current) return;
    setActiveLayer(newLayer);

    if (tileLayerRef.current) {
      mapRef.current.removeLayer(tileLayerRef.current);
    }

    const config = getLayerConfig(newLayer);
    const newTile = L.tileLayer(config.url, {
      maxZoom: config.maxZoom,
      attribution: config.attribution,
    }).addTo(mapRef.current);

    tileLayerRef.current = newTile;
  };

  // Initialize Leaflet Map
  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return;

    if ((mapContainerRef.current as any)._leaflet_id) {
      delete (mapContainerRef.current as any)._leaflet_id;
    }

    try {
      const map = L.map(mapContainerRef.current, {
        center: [currentLocation.lat, currentLocation.lng],
        zoom: 15,
        zoomControl: false,
        attributionControl: true,
      });

      // Base tile layer
      const config = getLayerConfig(activeLayer);
      const baseTile = L.tileLayer(config.url, {
        maxZoom: config.maxZoom,
        attribution: config.attribution,
      }).addTo(map);
      tileLayerRef.current = baseTile;

      // Occurrences & Culture layer groups
      const occGroup = L.layerGroup().addTo(map);
      const culGroup = L.layerGroup().addTo(map);
      occurrencesLayerGroupRef.current = occGroup;
      cultureLayerGroupRef.current = culGroup;

      // Realistic 3D Vehicle Marker
      const markerIcon = createVehicleDivIcon(
        user.vehicleModel,
        user.vehicleColor,
        heading,
        user.enableWindEffect,
        isNavigating
      );
      const vMarker = L.marker([currentLocation.lat, currentLocation.lng], {
        icon: markerIcon,
        zIndexOffset: 1000,
      }).addTo(map);
      vehicleMarkerRef.current = vMarker;

      // Map click handler
      map.on('click', (e: L.LeafletMouseEvent) => {
        if (onMapClick) {
          onMapClick({ lat: e.latlng.lat, lng: e.latlng.lng });
        }
      });

      mapRef.current = map;

      // Force recalculation of container size to prevent offset box
      const invalidate = () => {
        try {
          if (mapRef.current) {
            mapRef.current.invalidateSize();
          }
        } catch {}
      };

      invalidate();
      setTimeout(invalidate, 100);
      setTimeout(invalidate, 300);
      setTimeout(invalidate, 700);
      setTimeout(invalidate, 1500);

      window.addEventListener('resize', invalidate);

      if (mapContainerRef.current && window.ResizeObserver) {
        const ro = new ResizeObserver(() => {
          invalidate();
        });
        ro.observe(mapContainerRef.current);
      }
    } catch (err) {
      console.warn('[GPSMap] Aviso de inicialização cartográfica:', err);
    }

    return () => {
      try {
        if (mapRef.current) {
          mapRef.current.remove();
          mapRef.current = null;
        }
      } catch (e) {
        console.warn('Cleanup map error:', e);
      }
    };
  }, []);

  // Recalculate map dimensions when splash screen is dismissed
  useEffect(() => {
    if (!isSplashActive && mapRef.current) {
      const invalidate = () => {
        try {
          mapRef.current?.invalidateSize();
        } catch {}
      };
      invalidate();
      setTimeout(invalidate, 100);
      setTimeout(invalidate, 300);
      setTimeout(invalidate, 600);
    }
  }, [isSplashActive]);

  // Recenter map when currentLocation changes substantially (e.g. initial online detection)
  useEffect(() => {
    if (!mapRef.current) return;
    // Animate smoothly to new location if not currently in user drag
    mapRef.current.panTo([currentLocation.lat, currentLocation.lng], { animate: true, duration: 1.2 });
  }, [currentLocation.lat, currentLocation.lng]);

  // Update Vehicle Marker Position, Icon, and Heading
  useEffect(() => {
    if (!vehicleMarkerRef.current || !mapRef.current) return;

    vehicleMarkerRef.current.setLatLng([currentLocation.lat, currentLocation.lng]);

    const newIcon = createVehicleDivIcon(
      user.vehicleModel,
      user.vehicleColor,
      heading,
      user.enableWindEffect,
      isNavigating
    );
    vehicleMarkerRef.current.setIcon(newIcon);

    if (isNavigating) {
      mapRef.current.panTo([currentLocation.lat, currentLocation.lng], { animate: true });
    }
  }, [currentLocation, heading, user.vehicleModel, user.vehicleColor, user.enableWindEffect, isNavigating]);

  // Draw Routes (Primary & Alternative)
  useEffect(() => {
    if (!mapRef.current) return;

    if (primaryRouteLineRef.current) {
      primaryRouteLineRef.current.remove();
      primaryRouteLineRef.current = null;
    }
    if (altRouteLineRef.current) {
      altRouteLineRef.current.remove();
      altRouteLineRef.current = null;
    }

    if (!selectedRoute) return;

    const latLngs = selectedRoute.coordinates.map(c => [c.lat, c.lng] as [number, number]);

    // Primary Route Line (Glow + Solid Tech Blue)
    const primaryPoly = L.polyline(latLngs, {
      color: '#0066FF',
      weight: 6,
      opacity: 0.9,
      lineCap: 'round',
      lineJoin: 'round',
    }).addTo(mapRef.current);
    primaryRouteLineRef.current = primaryPoly;

    // Auto-fit to route bounds
    try {
      mapRef.current.fitBounds(primaryPoly.getBounds(), { padding: [60, 60], maxZoom: 16 });
    } catch {}
  }, [selectedRoute]);

  // Render Occurrences on Map
  useEffect(() => {
    if (!mapRef.current || !occurrencesLayerGroupRef.current) return;
    const group = occurrencesLayerGroupRef.current;
    group.clearLayers();

    occurrences.forEach(occ => {
      const isResolved = occ.isNormalized || occ.status === 'resolvida';
      const color = isResolved ? '#10B981' : occ.severity === 'critica' ? '#EF4444' : occ.severity === 'alta' ? '#F97316' : '#EAB308';

      const iconHtml = `
        <div class="relative flex items-center justify-center cursor-pointer group">
          <div class="w-8 h-8 rounded-full flex items-center justify-center shadow-lg border-2 border-white/80 transition-transform hover:scale-125" style="background-color: ${color}">
            <svg class="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          ${!isResolved ? '<span class="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-red-500 animate-ping"></span>' : ''}
        </div>
      `;

      const occIcon = L.divIcon({
        className: 'tp-occ-marker',
        html: iconHtml,
        iconSize: [32, 32],
        iconAnchor: [16, 16],
      });

      const marker = L.marker([occ.coordinates.lat, occ.coordinates.lng], { icon: occIcon });
      marker.on('click', () => onSelectOccurrence(occ));

      marker.bindTooltip(`
        <div class="text-xs p-1 font-semibold">
          <div class="text-slate-900">${occ.title}</div>
          <div class="text-[10px] text-slate-600">${isResolved ? '✅ Normalizada' : '⚠️ Ativa'} • ${occ.confirmationsCount} confirmações</div>
        </div>
      `, { direction: 'top', offset: [0, -10] });

      group.addLayer(marker);
    });
  }, [occurrences, onSelectOccurrence]);

  // Render Culture & Heritage Spots
  useEffect(() => {
    if (!mapRef.current || !cultureLayerGroupRef.current) return;
    const group = cultureLayerGroupRef.current;
    group.clearLayers();

    cultureSpots.forEach(spot => {
      const iconHtml = `
        <div class="relative flex items-center justify-center cursor-pointer group">
          <div class="w-7 h-7 rounded-full bg-purple-600 border-2 border-purple-200 flex items-center justify-center shadow-lg transition-transform hover:scale-125">
            <svg class="w-3.5 h-3.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
            </svg>
          </div>
        </div>
      `;

      const culIcon = L.divIcon({
        className: 'tp-culture-marker',
        html: iconHtml,
        iconSize: [28, 28],
        iconAnchor: [14, 14],
      });

      const marker = L.marker([spot.coordinates.lat, spot.coordinates.lng], { icon: culIcon });
      marker.on('click', () => onSelectCultureSpot(spot));

      marker.bindTooltip(`
        <div class="text-xs p-1 font-semibold text-purple-950">
          <div>${spot.title}</div>
          <div class="text-[10px] text-purple-700 font-normal">Patrimônio / História</div>
        </div>
      `, { direction: 'top', offset: [0, -8] });

      group.addLayer(marker);
    });
  }, [cultureSpots, onSelectCultureSpot]);

  // Center on Vehicle
  const handleRecenter = () => {
    if (mapRef.current) {
      mapRef.current.setView([currentLocation.lat, currentLocation.lng], 16, { animate: true });
    }
  };

  // Zoom In / Out
  const handleZoomIn = () => mapRef.current?.zoomIn();
  const handleZoomOut = () => mapRef.current?.zoomOut();

  // Fit Route
  const handleFitRoute = () => {
    if (mapRef.current && primaryRouteLineRef.current) {
      mapRef.current.fitBounds(primaryRouteLineRef.current.getBounds(), { padding: [50, 50] });
    }
  };

  return (
    <div className="relative w-full h-full min-h-[300px] bg-slate-950 overflow-hidden flex flex-col isolate z-0">
      {/* 3D Viewport Transform Wrapper */}
      <div 
        className="w-full h-full flex-1 transition-transform duration-500 ease-out"
        style={{
          transform: is3DMode ? 'perspective(850px) rotateX(28deg) scale(1.12)' : 'none',
          transformOrigin: 'center 85%',
        }}
      >
        {/* Container Leaflet */}
        <div 
          ref={mapContainerRef} 
          className="w-full h-full" 
          style={{ width: '100%', height: '100%', minHeight: '300px' }}
        />
      </div>

      {/* Floating Controls HUD (Strictly lower z-index than headers and modals) */}
      <div className="absolute top-4 right-4 z-30 flex flex-col gap-2">
        {/* Recenter Button */}
        <button
          onClick={handleRecenter}
          className="p-3 bg-slate-900/90 hover:bg-slate-800 text-lime-400 rounded-xl shadow-xl border border-slate-700/80 backdrop-blur-md active:scale-95 transition-all group"
          title="Centralizar na Minha Posição"
        >
          <Crosshair className="w-5 h-5 group-hover:rotate-45 transition-transform" />
        </button>

        {/* 3D Perspective Toggle Button */}
        <button
          onClick={() => setIs3DMode(!is3DMode)}
          className={`p-3 rounded-xl shadow-xl border backdrop-blur-md active:scale-95 transition-all flex items-center justify-center font-black text-xs ${
            is3DMode
              ? 'bg-lime-400 text-slate-950 border-lime-300 shadow-lime-500/20'
              : 'bg-slate-900/90 hover:bg-slate-800 text-cyan-300 border-slate-700/80'
          }`}
          title={is3DMode ? 'Desativar Visão 3D' : 'Ativar Modo Cockpit 3D'}
        >
          <Box className="w-5 h-5" />
        </button>

        {/* Layers Menu Trigger */}
        <div className="relative">
          <button
            onClick={() => setShowLayerMenu(!showLayerMenu)}
            className={`p-3 rounded-xl shadow-xl border backdrop-blur-md active:scale-95 transition-all ${
              showLayerMenu
                ? 'bg-blue-600 text-white border-blue-400'
                : 'bg-slate-900/90 hover:bg-slate-800 text-slate-200 border-slate-700/80'
            }`}
            title="Escolher Camadas (Satélite / Ruas / Relevo)"
          >
            <Layers className="w-5 h-5" />
          </button>

          {/* Layer Selection Dropdown */}
          {showLayerMenu && (
            <div className="absolute right-12 top-0 bg-slate-900/95 border border-slate-700 rounded-2xl shadow-2xl p-2 w-48 flex flex-col gap-1 backdrop-blur-md z-40">
              <div className="text-[10px] uppercase font-bold tracking-wider text-slate-400 px-2 py-1">
                Visualização do Mapa
              </div>
              
              <button
                onClick={() => { switchLayer('streets'); setShowLayerMenu(false); }}
                className={`flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold transition-all ${
                  activeLayer === 'streets'
                    ? 'bg-blue-600 text-white shadow-md'
                    : 'text-slate-300 hover:bg-slate-800'
                }`}
              >
                <MapIcon className="w-4 h-4 text-lime-400" />
                <span>🗺️ Ruas e Avenidas</span>
              </button>

              <button
                onClick={() => { switchLayer('satellite'); setShowLayerMenu(false); }}
                className={`flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold transition-all ${
                  activeLayer === 'satellite'
                    ? 'bg-blue-600 text-white shadow-md'
                    : 'text-slate-300 hover:bg-slate-800'
                }`}
              >
                <Globe className="w-4 h-4 text-cyan-400" />
                <span>🛰️ Satélite Real HD</span>
              </button>

              <button
                onClick={() => { switchLayer('topo'); setShowLayerMenu(false); }}
                className={`flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold transition-all ${
                  activeLayer === 'topo'
                    ? 'bg-blue-600 text-white shadow-md'
                    : 'text-slate-300 hover:bg-slate-800'
                }`}
              >
                <Compass className="w-4 h-4 text-amber-400" />
                <span>🏔️ Relevo / Topografia</span>
              </button>

              <button
                onClick={() => { switchLayer('dark'); setShowLayerMenu(false); }}
                className={`flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold transition-all ${
                  activeLayer === 'dark'
                    ? 'bg-blue-600 text-white shadow-md'
                    : 'text-slate-300 hover:bg-slate-800'
                }`}
              >
                <Box className="w-4 h-4 text-indigo-400" />
                <span>🌙 Noturno Futurista</span>
              </button>
            </div>
          )}
        </div>

        {selectedRoute && (
          <button
            onClick={handleFitRoute}
            className="p-3 bg-slate-900/90 hover:bg-slate-800 text-blue-400 rounded-xl shadow-xl border border-slate-700/80 backdrop-blur-md active:scale-95 transition-all"
            title="Ver Rota Completa"
          >
            <Eye className="w-5 h-5" />
          </button>
        )}

        {/* Zoom Controls */}
        <div className="flex flex-col bg-slate-900/90 rounded-xl border border-slate-700/80 shadow-xl backdrop-blur-md overflow-hidden">
          <button
            onClick={handleZoomIn}
            className="p-2.5 text-slate-200 hover:bg-slate-800 active:bg-slate-700 transition-colors border-b border-slate-800"
            title="Aproximar"
          >
            <ZoomIn className="w-4 h-4" />
          </button>
          <button
            onClick={handleZoomOut}
            className="p-2.5 text-slate-200 hover:bg-slate-800 active:bg-slate-700 transition-colors"
            title="Afastar"
          >
            <ZoomOut className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Floating Bottom Info & Mode Pill */}
      <div className="absolute bottom-4 left-4 z-30 flex items-center gap-2">
        <div className="hidden sm:flex items-center gap-3 bg-slate-950/90 backdrop-blur-md px-3.5 py-1.5 rounded-xl border border-slate-800 text-[11px] text-slate-300 shadow-xl">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-lime-400 animate-pulse" />
            <span>Você ({user.vehicleModel === 'sport' ? 'Superesportivo 3D' : user.vehicleModel === 'suv' ? 'SUV 3D' : 'Carro 3D'})</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
            <span>Ocorrências</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-purple-500" />
            <span>Patrimônio</span>
          </div>
        </div>

        {is3DMode && (
          <div className="px-2.5 py-1 rounded-xl bg-lime-400/90 text-slate-950 font-black text-[10px] tracking-wider uppercase shadow-lg shadow-lime-500/20">
            Modo 3D Ativo
          </div>
        )}
      </div>
    </div>
  );
};
