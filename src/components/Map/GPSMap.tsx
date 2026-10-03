import React, { useEffect, useRef } from 'react';
import L from 'leaflet';
import { Coordinates, RouteOption, Occurrence, CultureSpot, UserProfile } from '../../types';
import { createVehicleDivIcon } from './VehicleMarkerIcon';
import { Crosshair, ZoomIn, ZoomOut, Layers, Eye } from 'lucide-react';

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
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const vehicleMarkerRef = useRef<L.Marker | null>(null);
  const primaryRouteLineRef = useRef<L.Polyline | null>(null);
  const altRouteLineRef = useRef<L.Polyline | null>(null);
  const occurrencesLayerGroupRef = useRef<L.LayerGroup | null>(null);
  const cultureLayerGroupRef = useRef<L.LayerGroup | null>(null);

  // Initialize Leaflet Map
  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return;

    const map = L.map(mapContainerRef.current, {
      center: [currentLocation.lat, currentLocation.lng],
      zoom: 15,
      zoomControl: false,
      attributionControl: false,
    });

    // High-tech dark Carto tile layer
    L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
      maxZoom: 19,
      subdomains: 'abcd',
    }).addTo(map);

    // Occurrences & Culture layer groups
    const occGroup = L.layerGroup().addTo(map);
    const culGroup = L.layerGroup().addTo(map);
    occurrencesLayerGroupRef.current = occGroup;
    cultureLayerGroupRef.current = culGroup;

    // Vehicle Marker
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

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, []);

  // Update Vehicle Marker Position, Icon, and Heading
  useEffect(() => {
    if (!vehicleMarkerRef.current || !mapRef.current) return;

    vehicleMarkerRef.current.setLatLng([currentLocation.lat, currentLocation.lng]);
    const updatedIcon = createVehicleDivIcon(
      user.vehicleModel,
      user.vehicleColor,
      heading,
      user.enableWindEffect,
      isNavigating
    );
    vehicleMarkerRef.current.setIcon(updatedIcon);

    if (isNavigating) {
      mapRef.current.panTo([currentLocation.lat, currentLocation.lng], { animate: true, duration: 0.8 });
    }
  }, [currentLocation, heading, user.vehicleModel, user.vehicleColor, user.enableWindEffect, isNavigating]);

  // Update Routes Polyline
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    // Clear previous lines
    if (primaryRouteLineRef.current) {
      map.removeLayer(primaryRouteLineRef.current);
      primaryRouteLineRef.current = null;
    }
    if (altRouteLineRef.current) {
      map.removeLayer(altRouteLineRef.current);
      altRouteLineRef.current = null;
    }

    if (!selectedRoute || selectedRoute.coordinates.length === 0) return;

    const latLngs = selectedRoute.coordinates.map(c => [c.lat, c.lng] as [number, number]);

    // Primary vibrant neon route line
    const polyline = L.polyline(latLngs, {
      color: '#0066FF',
      weight: 6,
      opacity: 0.9,
      lineCap: 'round',
      lineJoin: 'round',
    }).addTo(map);
    primaryRouteLineRef.current = polyline;

    // Fit map bounds to show complete route if not mid-navigation
    if (!isNavigating) {
      map.fitBounds(polyline.getBounds(), { padding: [60, 60] });
    }
  }, [selectedRoute, isNavigating]);

  // Render Occurrences ("Acontecendo na Via")
  useEffect(() => {
    const group = occurrencesLayerGroupRef.current;
    if (!group) return;

    group.clearLayers();

    occurrences.forEach(occ => {
      // Determine badge color based on severity and normalized state
      const isResolved = occ.isNormalized || occ.status === 'resolvida';
      const color = isResolved ? '#10B981' : occ.severity === 'critica' ? '#EF4444' : occ.severity === 'alta' ? '#F97316' : '#EAB308';
      
      const occIconHtml = `
        <div class="relative flex items-center justify-center cursor-pointer group">
          <div class="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold shadow-lg transition-transform group-hover:scale-125 border-2 border-white" style="background-color: ${color}">
            ${isResolved ? '✓' : '!'}
          </div>
        </div>
      `;

      const marker = L.marker([occ.coordinates.lat, occ.coordinates.lng], {
        icon: L.divIcon({
          html: occIconHtml,
          className: 'occ-map-pin',
          iconSize: [32, 32],
          iconAnchor: [16, 16],
        }),
      });

      marker.on('click', () => {
        onSelectOccurrence(occ);
      });

      marker.bindTooltip(`
        <div class="text-xs font-semibold p-1">
          <div class="text-slate-900">${occ.title}</div>
          <div class="text-slate-600 text-[10px]">${occ.sourceName}</div>
        </div>
      `, { direction: 'top', offset: [0, -10] });

      group.addLayer(marker);
    });
  }, [occurrences, onSelectOccurrence]);

  // Render Culture Spots
  useEffect(() => {
    const group = cultureLayerGroupRef.current;
    if (!group) return;

    group.clearLayers();

    cultureSpots.forEach(spot => {
      const cultureIconHtml = `
        <div class="w-7 h-7 rounded-full bg-purple-700 border-2 border-amber-300 flex items-center justify-center text-amber-300 text-[10px] font-black shadow-md cursor-pointer hover:scale-110 transition-transform">
          🏛️
        </div>
      `;

      const marker = L.marker([spot.coordinates.lat, spot.coordinates.lng], {
        icon: L.divIcon({
          html: cultureIconHtml,
          className: 'culture-map-pin',
          iconSize: [28, 28],
          iconAnchor: [14, 14],
        }),
      });

      marker.on('click', () => {
        onSelectCultureSpot(spot);
      });

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
    <div className="relative w-full h-full min-h-[450px] bg-slate-950 overflow-hidden">
      {/* Container Leaflet */}
      <div ref={mapContainerRef} className="w-full h-full tech-tile-filter" />

      {/* Floating Controls HUD */}
      <div className="absolute top-4 right-4 z-20 flex flex-col gap-2">
        <button
          onClick={handleRecenter}
          className="p-3 bg-slate-900/90 hover:bg-slate-800 text-lime-400 rounded-xl shadow-lg border border-slate-700/80 backdrop-blur-md active:scale-95 transition-all group"
          title="Centralizar na Minha Posição"
        >
          <Crosshair className="w-5 h-5 group-hover:rotate-45 transition-transform" />
        </button>

        {selectedRoute && (
          <button
            onClick={handleFitRoute}
            className="p-3 bg-slate-900/90 hover:bg-slate-800 text-blue-400 rounded-xl shadow-lg border border-slate-700/80 backdrop-blur-md active:scale-95 transition-all"
            title="Ver Rota Completa"
          >
            <Eye className="w-5 h-5" />
          </button>
        )}

        <div className="flex flex-col bg-slate-900/90 rounded-xl border border-slate-700/80 shadow-lg backdrop-blur-md overflow-hidden">
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

      {/* Live Map Legend Overlay */}
      <div className="absolute bottom-4 left-4 z-20 hidden sm:flex items-center gap-3 bg-slate-950/80 backdrop-blur-md px-3 py-1.5 rounded-lg border border-slate-800 text-[11px] text-slate-300">
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-lime-400 animate-pulse" />
          <span>Você ({user.vehicleModel})</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
          <span>Ocorrência na Via</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-purple-500" />
          <span>Ponto Histórico</span>
        </div>
      </div>
    </div>
  );
};
