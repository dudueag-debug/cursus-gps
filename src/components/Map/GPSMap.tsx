import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import type { Coordinates, RouteOption, Occurrence, CultureSpot, UserProfile, MapLayerType, Place } from '../../types';
import { createVehicleDivIcon } from './VehicleMarkerIcon';
import { Crosshair, ZoomIn, ZoomOut, Eye, Layers, Compass, Box, Map as MapIcon, Globe, Navigation, MapPin, Phone, Star, X, Camera, AlertTriangle, Clock, ShieldAlert } from 'lucide-react';

interface GPSMapProps {
  currentLocation: Coordinates;
  heading: number;
  user: UserProfile;
  isNavigating: boolean;
  selectedRoute: RouteOption | null;
  occurrences: Occurrence[];
  cultureSpots: CultureSpot[];
  places?: Place[];
  onSelectOccurrence: (occ: Occurrence) => void;
  onSelectCultureSpot: (spot: CultureSpot) => void;
  onSelectPlace?: (place: Place) => void;
  onMapClick?: (coords: Coordinates) => void;
  onUpdateLocation?: (coords: Coordinates) => void;
  onOpenWeather?: () => void;
  onOpenSocorro?: () => void;
  onOpenOccurrences?: () => void;
  onOpenPhotoIncident?: (coords?: Coordinates) => void;
  onOpenQuickSignals?: () => void;
  onFindCategory?: (category: any) => void;
  onOpenPlacesPanel?: () => void;
  onOpenWazeLive?: (coords?: Coordinates, label?: string) => void;
  isSplashActive?: boolean;
  activePanel?: string;
}

const MAP_QUICK_CATEGORIES = [
  { key: 'all', label: 'Tudo no Mapa', emoji: '🗺️' },
  { key: 'posto_gnv', label: 'Postos & GNV', emoji: '⛽' },
  { key: 'supermercado', label: 'Supermercados', emoji: '🛒' },
  { key: 'mercado', label: 'Mercados Locais', emoji: '🏪' },
  { key: 'oficina', label: 'Mecânicos', emoji: '🔧' },
  { key: 'funilaria_pintura', label: 'Funilaria & Pintura', emoji: '🎨' },
  { key: 'borracheiro', label: 'Borracharias 24h', emoji: '🛞' },
  { key: 'material_construcao', label: 'Mat. Construção', emoji: '🔨' },
  { key: 'saude', label: 'UPAs & Hospitais', emoji: '🏥' },
  { key: 'educacao', label: 'Escolas & Faculdades', emoji: '🎓' },
  { key: 'policia', label: 'Polícia & Batalhões', emoji: '🚓' },
];

function calcDistanceMeters(a: Coordinates, b: Coordinates): number {
  const R = 6371000;
  const dLat = ((b.lat - a.lat) * Math.PI) / 180;
  const dLng = ((b.lng - a.lng) * Math.PI) / 180;
  const lat1 = (a.lat * Math.PI) / 180;
  const lat2 = (b.lat * Math.PI) / 180;
  const sinDLat = Math.sin(dLat / 2);
  const sinDLng = Math.sin(dLng / 2);
  const h = sinDLat * sinDLat + Math.cos(lat1) * Math.cos(lat2) * sinDLng * sinDLng;
  return 2 * R * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h));
}

export const GPSMap: React.FC<GPSMapProps> = ({
  currentLocation,
  heading,
  user,
  isNavigating,
  selectedRoute,
  occurrences,
  cultureSpots,
  places = [],
  onSelectOccurrence,
  onSelectCultureSpot,
  onSelectPlace,
  onMapClick,
  onOpenOccurrences,
  onOpenPhotoIncident,
  onOpenQuickSignals,
  onOpenPlacesPanel,
  isSplashActive = false,
  activePanel = 'map',
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const tileLayerRef = useRef<L.TileLayer | null>(null);
  const vehicleMarkerRef = useRef<L.Marker | null>(null);
  const primaryRouteLineRef = useRef<L.Polyline | null>(null);
  const altRouteLineRef = useRef<L.Polyline | null>(null);
  const destMarkerRef = useRef<L.Marker | null>(null);
  const occurrencesLayerGroupRef = useRef<L.LayerGroup | null>(null);
  const cultureLayerGroupRef = useRef<L.LayerGroup | null>(null);
  const placesLayerGroupRef = useRef<L.LayerGroup | null>(null);

  // Automatic Night Mode detection when dusk arrives (18:00 to 05:59)
  const isNightHourNow = () => {
    const h = new Date().getHours();
    return h >= 18 || h < 6;
  };

  // Active layer & 3D perspective mode (Automatically starts in 'dark' Noturno mode when evening/night)
  const [activeLayer, setActiveLayer] = useState<MapLayerType>(() => {
    if (isNightHourNow()) return 'dark';
    return user.mapLayerType || 'streets';
  });
  const [userManuallyChangedLayer, setUserManuallyChangedLayer] = useState<boolean>(false);
  const [is3DMode, setIs3DMode] = useState<boolean>(user.is3DMode || false);
  const [showLayerMenu, setShowLayerMenu] = useState<boolean>(false);
  const [activeMapCategory, setActiveMapCategory] = useState<string>('all');
  const [selectedMapPlace, setSelectedMapPlace] = useState<Place | null>(null);
  const [selectedMapOccurrence, setSelectedMapOccurrence] = useState<Occurrence | null>(null);
  const [tappedMapCoords, setTappedMapCoords] = useState<Coordinates | null>(null);

  // Active Risk Zone Entry Alert & Live Timer until exiting the zone
  const [activeRiskZone, setActiveRiskZone] = useState<Occurrence | null>(null);
  const [zoneSecondsElapsed, setZoneSecondsElapsed] = useState<number>(0);
  const [zoneDismissedId, setZoneDismissedId] = useState<string | null>(null);

  // Professional Watermark-Free Layer Definitions for Brazil & Worldwide
  const getLayerConfig = (layer: MapLayerType) => {
    switch (layer) {
      case 'satellite':
        return {
          url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
          maxZoom: 19,
          className: '',
          attribution: '&copy; TÔ PASSANDO Satélite HD',
        };
      case 'topo':
        return {
          url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Topo_Map/MapServer/tile/{z}/{y}/{x}',
          maxZoom: 19,
          className: '',
          attribution: '&copy; TÔ PASSANDO Topografia',
        };
      case 'dark':
        return {
          url: 'https://worldtiles3.waze.com/tiles/{z}/{x}/{y}.png',
          maxZoom: 19,
          className: 'leaflet-tile-futuristic-dark',
          attribution: '&copy; TÔ PASSANDO Noturno Automático',
        };
      case 'streets':
      default:
        return {
          url: 'https://worldtiles3.waze.com/tiles/{z}/{x}/{y}.png',
          maxZoom: 19,
          className: '',
          attribution: '&copy; TÔ PASSANDO Cartografia Ao Vivo',
        };
    }
  };

  const createSafeTile = (layer: MapLayerType) => {
    const config = getLayerConfig(layer);
    const tile = L.tileLayer(config.url, {
      maxZoom: config.maxZoom,
      attribution: config.attribution,
      className: config.className,
      crossOrigin: true,
      keepBuffer: 8,
      updateWhenIdle: false,
    });

    // Fallback on tile error to standard OSM
    tile.on('tileerror', (e: any) => {
      const img = e.tile;
      if (img && !img.dataset.fallback) {
        img.dataset.fallback = 'true';
        const { z, x, y } = e.coords;
        img.src = `https://tile.openstreetmap.org/${z}/${x}/${y}.png`;
      }
    });

    return tile;
  };

  // Switch Tile Layer dynamically
  const switchLayer = (newLayer: MapLayerType, isManual: boolean = true) => {
    if (!mapRef.current) return;
    if (isManual) setUserManuallyChangedLayer(true);
    setActiveLayer(newLayer);

    if (tileLayerRef.current) {
      mapRef.current.removeLayer(tileLayerRef.current);
    }

    const newTile = createSafeTile(newLayer).addTo(mapRef.current);
    tileLayerRef.current = newTile;
  };

  // Automatically switch to Night Mode ('dark') when dusk arrives (18:00 - 05:59)
  useEffect(() => {
    const checkAutoNight = () => {
      if (!userManuallyChangedLayer && isNightHourNow() && activeLayer !== 'dark') {
        switchLayer('dark', false);
      }
    };
    checkAutoNight();
    const interval = setInterval(checkAutoNight, 30000);
    return () => clearInterval(interval);
  }, [activeLayer, userManuallyChangedLayer]);

  // Monitor Real-Time GPS Entry into Dangerous / Risk Zones and Start Live Traversal Timer
  useEffect(() => {
    const riskCategories = new Set([
      'roubo_celular_semaforo',
      'roubo_carro_moto',
      'roubo_pedestre',
      'ponto_roubo',
      'local_perigoso',
      'falta_iluminacao',
      'sem_sinalizacao',
      'falta_pavimentacao',
      'trecho_buracos',
      'alagamento',
    ]);

    const activeZones = occurrences.filter(
      o => !o.isNormalized && o.status !== 'resolvida' && riskCategories.has(o.category)
    );

    let closestZone: Occurrence | null = null;
    let minDistance = Infinity;

    for (const z of activeZones) {
      const dist = calcDistanceMeters(currentLocation, z.coordinates);
      const triggerRadius = (z.riskRadiusMeters || 280) + 120;
      if (dist <= triggerRadius && dist < minDistance) {
        minDistance = dist;
        closestZone = z;
      }
    }

    if (closestZone && closestZone.id !== zoneDismissedId) {
      setActiveRiskZone(prev => {
        if (prev?.id !== closestZone!.id) {
          setZoneSecondsElapsed(0);
        }
        return closestZone;
      });
    } else if (!closestZone) {
      setActiveRiskZone(null);
      setZoneSecondsElapsed(0);
    }
  }, [currentLocation.lat, currentLocation.lng, occurrences, zoneDismissedId]);

  // Tick the live timer every second while the user is inside the active risk zone
  useEffect(() => {
    if (!activeRiskZone) return;
    const timer = setInterval(() => {
      setZoneSecondsElapsed(prev => prev + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [activeRiskZone?.id]);

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
        attributionControl: false,
        touchZoom: true,
        dragging: true,
        preferCanvas: true,
      });

      // Base tile layer
      const baseTile = createSafeTile(activeLayer).addTo(map);
      tileLayerRef.current = baseTile;

      // Occurrences, Culture & Places layer groups
      const occGroup = L.layerGroup().addTo(map);
      const culGroup = L.layerGroup().addTo(map);
      const plcGroup = L.layerGroup().addTo(map);
      occurrencesLayerGroupRef.current = occGroup;
      cultureLayerGroupRef.current = culGroup;
      placesLayerGroupRef.current = plcGroup;

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

      // Map click handler (allows marking exact spot on map + taking photo)
      map.on('click', (e: L.LeafletMouseEvent) => {
        const clicked = { lat: e.latlng.lat, lng: e.latlng.lng };
        setTappedMapCoords(clicked);
        if (onMapClick) {
          onMapClick(clicked);
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

  // Recalculate map dimensions when returning to map tab
  useEffect(() => {
    if (activePanel === 'map' && mapRef.current) {
      const invalidate = () => {
        try {
          mapRef.current?.invalidateSize();
        } catch {}
      };
      invalidate();
      setTimeout(invalidate, 50);
      setTimeout(invalidate, 250);
    }
  }, [activePanel]);

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

  // Draw Routes (Waze-Style Dual Polyline & Destination Pin)
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
    if (destMarkerRef.current) {
      destMarkerRef.current.remove();
      destMarkerRef.current = null;
    }

    if (!selectedRoute || !selectedRoute.coordinates || selectedRoute.coordinates.length < 2) return;

    const latLngs = selectedRoute.coordinates.map(c => [c.lat, c.lng] as [number, number]);

    // Outer Waze-style route casing
    const outerPoly = L.polyline(latLngs, {
      color: '#3b0764',
      weight: 11,
      opacity: 0.9,
      lineCap: 'round',
      lineJoin: 'round',
    }).addTo(mapRef.current);
    altRouteLineRef.current = outerPoly;

    // Inner Waze-style vibrant route line
    const primaryPoly = L.polyline(latLngs, {
      color: '#8b5cf6',
      weight: 6.5,
      opacity: 1,
      lineCap: 'round',
      lineJoin: 'round',
    }).addTo(mapRef.current);
    primaryRouteLineRef.current = primaryPoly;

    // Destination Pin Marker at the end of the route
    const lastCoord = selectedRoute.coordinates[selectedRoute.coordinates.length - 1];
    const destHtml = `
      <div class="relative flex flex-col items-center group cursor-pointer" style="transform: translate(-50%, -100%);">
        <div class="w-9 h-9 rounded-2xl bg-gradient-to-tr from-rose-600 to-red-500 border-2 border-white flex items-center justify-center shadow-2xl text-white font-black animate-bounce">
          <svg class="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M3 21v-4m0 0V5a2 2 0 012-2h6.5l1 1H21l-3 6 3 6h-8.5l-1-1H5a2 2 0 00-2 2zm9-13.5V9"/></svg>
        </div>
        <div class="mt-0.5 px-2.5 py-0.5 bg-slate-950/95 text-white font-black text-[10px] rounded-full shadow-lg whitespace-nowrap border border-cyan-500/50">
          🏁 ${selectedRoute.title || 'Destino'}
        </div>
      </div>
    `;

    const destIcon = L.divIcon({
      className: 'tp-dest-pin-marker',
      html: destHtml,
      iconSize: [36, 36],
      iconAnchor: [0, 0],
    });

    const dMarker = L.marker([lastCoord.lat, lastCoord.lng], { icon: destIcon, zIndexOffset: 950 }).addTo(mapRef.current);
    destMarkerRef.current = dMarker;

    // Auto-fit to route bounds
    try {
      mapRef.current.fitBounds(primaryPoly.getBounds(), { padding: [70, 70], maxZoom: 16 });
    } catch {}
  }, [selectedRoute]);

  // Render Real-Time Occurrences & Colored Risk Zones on Map
  useEffect(() => {
    if (!mapRef.current || !occurrencesLayerGroupRef.current) return;
    const group = occurrencesLayerGroupRef.current;
    group.clearLayers();

    const isNightMode = activeLayer === 'dark';

    occurrences.forEach(occ => {
      const isResolved = occ.isNormalized || occ.status === 'resolvida';
      let badgeBg = occ.zoneColor || '#F97316';
      let badgeEmoji = '⚠️';
      let shortLabel = 'Alerta';
      let isNightPriority = false;

      if (occ.category === 'blitz') {
        badgeBg = '#0284c7';
        badgeEmoji = '👮';
        shortLabel = 'Blitz Policial';
      } else if (occ.category === 'policiamento_ativo') {
        badgeBg = '#2563eb';
        badgeEmoji = '🚓';
        shortLabel = 'Policiamento';
      } else if (occ.category === 'radar') {
        badgeBg = '#dc2626';
        badgeEmoji = '📸';
        shortLabel = `Pardal ${occ.speedLimitKmh || 60} km/h`;
      } else if (occ.category === 'roubo_celular_semaforo') {
        badgeBg = '#e11d48';
        badgeEmoji = '📱';
        shortLabel = 'Roubo Celular';
      } else if (occ.category === 'roubo_carro_moto' || occ.category === 'roubo_pedestre' || occ.category === 'ponto_roubo') {
        badgeBg = '#dc2626';
        badgeEmoji = '🚨';
        shortLabel = 'Alto Assalto';
      } else if (occ.category === 'local_perigoso') {
        badgeBg = '#9333ea';
        badgeEmoji = '⚠️';
        shortLabel = 'Área Perigosa';
      } else if (occ.category === 'falta_iluminacao') {
        badgeBg = '#f59e0b';
        badgeEmoji = '💡';
        shortLabel = 'Sem Iluminação';
        isNightPriority = true;
      } else if (occ.category === 'sem_sinalizacao') {
        badgeBg = '#eab308';
        badgeEmoji = '🚫';
        shortLabel = 'Sem Sinalização';
        isNightPriority = true;
      } else if (occ.category === 'falta_pavimentacao' || occ.category === 'buraco' || occ.category === 'trecho_buracos') {
        badgeBg = '#ca8a04';
        badgeEmoji = '🕳️';
        shortLabel = occ.category === 'falta_pavimentacao' ? 'Sem Asfalto / Buracos' : 'Buraco na Via';
      } else if (occ.category === 'engarrafamento' || occ.category === 'lentidao' || occ.category === 'congestionamento') {
        badgeBg = '#ea580c';
        badgeEmoji = '🚗';
        shortLabel = 'Engarrafamento';
      } else if (occ.category === 'acidente') {
        badgeBg = '#e11d48';
        badgeEmoji = '💥';
        shortLabel = 'Acidente';
      } else if (occ.category === 'obra' || occ.category === 'obras') {
        badgeBg = '#d97706';
        badgeEmoji = '🚧';
        shortLabel = 'Obras';
      } else if (occ.category === 'alagamento') {
        badgeBg = '#0284c7';
        badgeEmoji = '🌊';
        shortLabel = 'Alagamento';
      }

      if (isResolved) {
        badgeBg = '#10B981';
      }

      // Draw Colored Risk Zone Perimeter Circle on Map ("esse local fica com outra cor ou marcado")
      if (!isResolved && (occ.riskRadiusMeters || isNightPriority)) {
        const radius = occ.riskRadiusMeters || 220;
        const circleColor = occ.zoneColor || badgeBg;
        const highlightAtNight = isNightMode && isNightPriority;

        const zoneCircle = L.circle([occ.coordinates.lat, occ.coordinates.lng], {
          radius,
          color: highlightAtNight ? '#fde047' : circleColor,
          weight: highlightAtNight ? 3.5 : 2.5,
          opacity: 0.95,
          fillColor: circleColor,
          fillOpacity: highlightAtNight ? 0.38 : 0.22,
          dashArray: occ.category === 'roubo_celular_semaforo' || occ.category === 'local_perigoso' ? undefined : '6, 6',
        });

        zoneCircle.on('click', () => {
          setSelectedMapPlace(null);
          setSelectedMapOccurrence(occ);
          setActiveRiskZone(occ);
          setZoneSecondsElapsed(0);
          onSelectOccurrence(occ);
        });

        group.addLayer(zoneCircle);
      }

      const nightGlowClass =
        isNightMode && isNightPriority
          ? 'ring-4 ring-yellow-300 shadow-[0_0_22px_#fde047] scale-110'
          : '';

      const iconHtml = `
        <div class="relative flex flex-col items-center justify-center cursor-pointer group">
          <div class="w-9 h-9 rounded-full flex items-center justify-center shadow-xl border-2 border-white transition-transform hover:scale-125 ${nightGlowClass}" style="background-color: ${badgeBg}">
            <span class="text-base leading-none">${badgeEmoji}</span>
          </div>
          <span class="mt-0.5 px-1.5 py-0.2 rounded-full bg-slate-950/95 text-white font-black text-[9px] shadow border border-white/30 whitespace-nowrap">
            ${shortLabel}
          </span>
          ${!isResolved ? '<span class="absolute -top-0.5 right-0 w-2.5 h-2.5 rounded-full bg-red-500 border border-white animate-ping"></span>' : ''}
        </div>
      `;

      const occIcon = L.divIcon({
        className: 'tp-occ-marker',
        html: iconHtml,
        iconSize: [48, 48],
        iconAnchor: [24, 24],
      });

      const marker = L.marker([occ.coordinates.lat, occ.coordinates.lng], { icon: occIcon, zIndexOffset: 750 });
      marker.on('click', () => {
        setSelectedMapPlace(null);
        setSelectedMapOccurrence(occ);
        if (occ.riskRadiusMeters) {
          setActiveRiskZone(occ);
          setZoneSecondsElapsed(0);
        }
        onSelectOccurrence(occ);
      });

      marker.bindTooltip(`
        <div class="text-xs p-1.5 font-semibold max-w-[230px]">
          <div class="font-black text-slate-900">${badgeEmoji} ${occ.title}</div>
          <div class="text-[10px] text-slate-700 mt-0.5">${occ.description || ''}</div>
          <div class="text-[10px] text-cyan-800 font-bold mt-1">${isResolved ? '✅ Normalizada' : '🔴 Fica Atento Tô Passando'} • 👍 ${occ.confirmationsCount} confirmações</div>
        </div>
      `, { direction: 'top', offset: [0, -14] });

      group.addLayer(marker);
    });
  }, [occurrences, onSelectOccurrence, activeLayer]);

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

  // Filter places based on activeMapCategory
  const matchPlaceCategory = (place: Place, cat: string): boolean => {
    if (!cat || cat === 'all') return true;
    if (cat === 'saude') {
      return ['saude', 'upa', 'hospital', 'posto_saude'].includes(place.category);
    }
    if (cat === 'policia') {
      return ['policia', 'delegacia', 'batalhao', 'dpo'].includes(place.category);
    }
    if (cat === 'educacao') {
      return ['educacao', 'escola', 'faculdade', 'curso_tecnico'].includes(place.category);
    }
    if (cat === 'supermercado') {
      return place.category === 'supermercado';
    }
    if (cat === 'mercado') {
      return place.category === 'mercado';
    }
    return place.category === cat;
  };

  // Render Verified Places & Neighborhood Commerce POIs on Map
  useEffect(() => {
    if (!mapRef.current || !placesLayerGroupRef.current) return;
    const group = placesLayerGroupRef.current;
    group.clearLayers();

    const visiblePlaces = places.filter(p => matchPlaceCategory(p, activeMapCategory));

    visiblePlaces.forEach(place => {
      let bgColor = 'bg-slate-700';
      let borderColor = 'border-white';
      let iconEmoji = '📍';

      if (place.category === 'saude' || place.category === 'upa' || place.category === 'hospital' || place.category === 'posto_saude') {
        bgColor = 'bg-red-600';
        iconEmoji = '🏥';
      } else if (place.category === 'policia' || place.category === 'delegacia' || place.category === 'batalhao' || place.category === 'dpo') {
        bgColor = 'bg-blue-600';
        iconEmoji = '🚓';
      } else if (place.category === 'posto_gnv') {
        bgColor = 'bg-cyan-600';
        iconEmoji = '⛽';
      } else if (place.category === 'borracheiro') {
        bgColor = 'bg-amber-600';
        iconEmoji = '🛞';
      } else if (place.category === 'oficina') {
        bgColor = 'bg-orange-600';
        iconEmoji = '🔧';
      } else if (place.category === 'funilaria_pintura') {
        bgColor = 'bg-pink-600';
        iconEmoji = '🎨';
      } else if (place.category === 'farmacia') {
        bgColor = 'bg-emerald-600';
        iconEmoji = '💊';
      } else if (place.category === 'supermercado') {
        bgColor = 'bg-lime-600';
        iconEmoji = '🛒';
      } else if (place.category === 'mercado') {
        bgColor = 'bg-emerald-600';
        iconEmoji = '🏪';
      } else if (place.category === 'brt_transporte') {
        bgColor = 'bg-emerald-600';
        iconEmoji = '🚌';
      } else if (place.category === 'recarga_jae') {
        bgColor = 'bg-cyan-500';
        iconEmoji = '💳';
      } else if (place.category === 'educacao' || place.category === 'escola' || place.category === 'faculdade' || place.category === 'curso_tecnico') {
        bgColor = 'bg-indigo-600';
        iconEmoji = '🎓';
      } else if (place.category === 'material_construcao') {
        bgColor = 'bg-amber-700';
        iconEmoji = '🔨';
      } else if (place.category === 'banco_caixa') {
        bgColor = 'bg-yellow-600';
        iconEmoji = '🏧';
      } else if (place.category === 'igreja') {
        bgColor = 'bg-violet-600';
        iconEmoji = '⛪';
      } else if (place.category === 'esporte' || place.category === 'paintball') {
        bgColor = 'bg-orange-600';
        iconEmoji = '⚽';
      } else if (place.category === 'zoologico') {
        bgColor = 'bg-green-600';
        iconEmoji = '🦁';
      } else if (place.category === 'presidio') {
        bgColor = 'bg-rose-700';
        iconEmoji = '🔒';
      } else if (place.category === 'shopping') {
        bgColor = 'bg-pink-600';
        iconEmoji = '🛍️';
      } else if (place.category === 'parque_praia' || place.category === 'lazer_cultura') {
        bgColor = 'bg-purple-600';
        iconEmoji = '🏖️';
      }

      const ratingTag = place.rating !== undefined ? `★${place.rating.toFixed(1)}` : '';

      const iconHtml = `
        <div class="relative flex flex-col items-center justify-center cursor-pointer group">
          <div class="w-8 h-8 rounded-full ${bgColor} border-2 ${borderColor} flex items-center justify-center shadow-xl transition-transform hover:scale-125">
            <span class="text-sm leading-none">${iconEmoji}</span>
          </div>
          ${ratingTag ? `<span class="mt-0.5 px-1 py-0.2 rounded bg-slate-950/90 text-amber-400 font-black text-[8px] shadow border border-amber-500/40 whitespace-nowrap">${ratingTag}</span>` : ''}
        </div>
      `;

      const placeIcon = L.divIcon({
        className: 'tp-place-marker',
        html: iconHtml,
        iconSize: [36, 40],
        iconAnchor: [18, 20],
      });

      const marker = L.marker([place.coordinates.lat, place.coordinates.lng], { icon: placeIcon, zIndexOffset: 500 });
      marker.on('click', () => {
        setSelectedMapPlace(place);
        mapRef.current?.panTo([place.coordinates.lat, place.coordinates.lng], { animate: true });
      });

      marker.bindTooltip(`
        <div class="text-xs p-1 font-semibold text-slate-900 max-w-[240px]">
          ${place.photoUrl ? `<div class="w-full h-20 rounded overflow-hidden mb-1 relative"><img src="${place.photoUrl}" class="w-full h-full object-cover"/>${place.rating !== undefined ? `<span class="absolute top-1 right-1 bg-slate-950/90 text-amber-400 text-[10px] font-black px-1.5 py-0.5 rounded">★ ${place.rating.toFixed(1)}</span>` : ''}</div>` : ''}
          <div class="font-bold text-slate-900">${place.name}</div>
          ${place.rating !== undefined ? `<div class="text-[10px] text-amber-600 font-bold">★ ${place.rating.toFixed(1)} ${place.ratingCount ? `(${place.ratingCount.toLocaleString('pt-BR')} avaliações)` : ''}</div>` : ''}
          <div class="text-[10px] text-slate-600 font-normal">${place.subCategory} ${place.distanceMeters ? `• ${place.distanceMeters < 1000 ? `${place.distanceMeters}m` : `${(place.distanceMeters / 1000).toFixed(1)}km`}` : ''}</div>
          ${place.verifiedReferencePoint ? `<div class="text-[9px] text-cyan-800 font-medium mt-0.5">📍 Ref: ${place.verifiedReferencePoint}</div>` : ''}
        </div>
      `, { direction: 'top', offset: [0, -12] });

      group.addLayer(marker);
    });
  }, [places, activeMapCategory]);

  // Select category pill on map and pan to nearest matching place
  const handleSelectMapCategory = (catKey: string) => {
    setActiveMapCategory(catKey);
    if (catKey === 'all') {
      setSelectedMapPlace(null);
      return;
    }
    const matching = places.filter(p => matchPlaceCategory(p, catKey));
    if (matching.length > 0) {
      const nearest = matching[0];
      setSelectedMapPlace(nearest);
      if (mapRef.current) {
        mapRef.current.setView([nearest.coordinates.lat, nearest.coordinates.lng], 16, { animate: true });
      }
    }
  };

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
      {/* 3D Viewport Transform Wrapper - Perfect Center Origin */}
      <div 
        className="w-full h-full flex-1 transition-transform duration-500 ease-out"
        style={{
          transform: is3DMode ? 'perspective(850px) rotateX(28deg) scale(1.12)' : 'none',
          transformOrigin: 'center center',
        }}
      >
        {/* Container Leaflet */}
        <div 
          ref={mapContainerRef} 
          className="w-full h-full" 
          style={{ width: '100%', height: '100%', minHeight: '300px' }}
        />
      </div>

      {/* Top Floating Bar: Tô Passando Nesse Momento + Marcar Foto + Fica Atento + Commerce Chips */}
      {!isNavigating && (
        <div className="absolute top-2.5 left-2.5 right-16 z-30 flex flex-col gap-1.5 pointer-events-none">
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pointer-events-auto pb-1">
            <button
              onClick={handleRecenter}
              className="shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-black text-[11px] shadow-xl border border-cyan-300 active:scale-95 transition-all"
            >
              <Compass className="w-3.5 h-3.5 text-slate-950 animate-spin" style={{ animationDuration: '9s' }} />
              <span>Tô Passando Nesse Momento</span>
            </button>

            {onOpenPhotoIncident && (
              <button
                onClick={() => onOpenPhotoIncident(tappedMapCoords || currentLocation)}
                className="shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-gradient-to-r from-rose-600 to-amber-500 hover:brightness-110 text-white font-black text-[11px] shadow-xl border border-rose-300 active:scale-95 transition-all"
              >
                <Camera className="w-3.5 h-3.5 text-white" />
                <span>📸 Marcar Local + Foto</span>
              </button>
            )}

            {onOpenQuickSignals && (
              <button
                onClick={onOpenQuickSignals}
                className="shrink-0 flex items-center gap-1 px-2.5 py-1.5 rounded-full bg-red-600/90 hover:bg-red-500 text-white font-black text-[11px] shadow-xl border border-red-400 active:scale-95 transition-all"
              >
                <span>🚨 Sinalizar na Via</span>
              </button>
            )}

            {onOpenOccurrences && (
              <button
                onClick={onOpenOccurrences}
                className="shrink-0 flex items-center gap-1 px-2.5 py-1.5 rounded-full bg-slate-950/90 hover:bg-slate-900 text-amber-300 font-black text-[11px] shadow-xl border border-amber-500/40 active:scale-95 transition-all"
              >
                <span>👮📸 Fica Atento Tô Passando ({occurrences.length})</span>
              </button>
            )}

            {MAP_QUICK_CATEGORIES.map(cat => {
              const isSelected = activeMapCategory === cat.key;
              return (
                <button
                  key={cat.key}
                  onClick={() => handleSelectMapCategory(cat.key)}
                  className={`shrink-0 flex items-center gap-1 px-2.5 py-1.5 rounded-full text-[11px] font-bold shadow-lg border transition-all active:scale-95 ${
                    isSelected
                      ? 'bg-lime-400 text-slate-950 border-lime-300 font-black shadow-lime-500/30'
                      : 'bg-slate-950/90 hover:bg-slate-900 text-slate-200 border-slate-700/80'
                  }`}
                >
                  <span>{cat.emoji}</span>
                  <span>{cat.label}</span>
                </button>
              );
            })}
          </div>

          {/* Active Risk Zone Entry Alert & Live Countdown/Elapsed Timer Until Exit */}
          {activeRiskZone && (
            <div className="pointer-events-auto max-w-md bg-gradient-to-r from-red-950/95 via-rose-950/95 to-slate-950/95 border-2 border-rose-500 rounded-2xl p-2.5 shadow-2xl backdrop-blur-md animate-in fade-in duration-200">
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-start gap-2 min-w-0">
                  <div className="w-8 h-8 rounded-xl bg-rose-600 flex items-center justify-center text-white shrink-0 animate-pulse shadow-lg">
                    <ShieldAlert className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="px-1.5 py-0.2 rounded bg-rose-500 text-white font-black text-[9px] uppercase tracking-wider">
                        ALERTA DE ENTRADA EM LOCAL DE RISCO
                      </span>
                      <span className="text-[10px] font-mono font-black text-amber-300 flex items-center gap-1">
                        <Clock className="w-3 h-3 text-amber-400" />
                        Tempo no local: {String(Math.floor(zoneSecondsElapsed / 60)).padStart(2, '0')}:
                        {String(zoneSecondsElapsed % 60).padStart(2, '0')}
                      </span>
                    </div>
                    <div className="text-xs font-black text-white truncate mt-0.5">
                      {activeRiskZone.title}
                    </div>
                    <div className="text-[10px] text-rose-200 line-clamp-2 leading-snug">
                      {activeRiskZone.description}
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => {
                    setZoneDismissedId(activeRiskZone.id);
                    setActiveRiskZone(null);
                  }}
                  className="p-1 rounded-lg bg-slate-900/80 hover:bg-slate-800 text-slate-300 hover:text-white shrink-0"
                  title="Fechar alerta de zona"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>

              {(() => {
                const distToCenter = calcDistanceMeters(currentLocation, activeRiskZone.coordinates);
                const radius = activeRiskZone.riskRadiusMeters || 280;
                const remainingMeters = Math.max(40, Math.round(radius + 60 - Math.min(distToCenter, radius)));
                const estSecondsToExit = Math.max(15, Math.round(remainingMeters / 8.5) - zoneSecondsElapsed);
                const minsLeft = Math.floor(estSecondsToExit / 60);
                const secsLeft = estSecondsToExit % 60;
                return (
                  <div className="mt-2 pt-1.5 border-t border-rose-500/30 flex items-center justify-between text-[10px] font-bold">
                    <span className="text-lime-300">
                      ⏱️ Tempo estimado até sair deste local: ~{String(minsLeft).padStart(2, '0')}:{String(secsLeft).padStart(2, '0')} ({remainingMeters}m)
                    </span>
                    <button
                      onClick={() => setSelectedMapOccurrence(activeRiskZone)}
                      className="text-cyan-300 hover:underline font-black"
                    >
                      Ver Foto & Detalhes →
                    </button>
                  </div>
                );
              })()}
            </div>
          )}

          {/* Quick Prompt when User Taps a Point on the Map */}
          {tappedMapCoords && onOpenPhotoIncident && (
            <div className="pointer-events-auto max-w-sm bg-slate-950/95 border border-lime-400/70 rounded-xl px-3 py-2 shadow-xl flex items-center justify-between gap-2">
              <div className="text-[10px] text-slate-200 min-w-0">
                <span className="font-black text-lime-400 block">📍 Ponto Selecionado no Mapa</span>
                <span className="font-mono text-slate-400">
                  {tappedMapCoords.lat.toFixed(5)}, {tappedMapCoords.lng.toFixed(5)}
                </span>
              </div>
              <div className="flex items-center gap-1.5 shrink-0">
                <button
                  onClick={() => onOpenPhotoIncident(tappedMapCoords)}
                  className="px-2.5 py-1.5 rounded-lg bg-gradient-to-r from-rose-600 to-amber-500 text-white font-black text-[10px] flex items-center gap-1 shadow"
                >
                  <Camera className="w-3 h-3" />
                  <span>Marcar + Foto Aqui</span>
                </button>
                <button
                  onClick={() => setTappedMapCoords(null)}
                  className="p-1 text-slate-400 hover:text-white"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Floating Selected Occurrence / Risk Zone Card (Shows User Photo, Colored Risk Badge, Speed Limit & Timer) */}
      {selectedMapOccurrence && !isNavigating && (
        <div className="absolute top-14 left-3 right-16 sm:right-auto sm:w-[390px] z-30 bg-slate-950/95 border-2 border-rose-500/70 rounded-2xl shadow-2xl overflow-hidden backdrop-blur-md animate-in fade-in slide-in-from-top-2 duration-200">
          {selectedMapOccurrence.photoUrl && (
            <div className="relative h-36 w-full bg-slate-900 overflow-hidden">
              <img
                src={selectedMapOccurrence.photoUrl}
                alt={selectedMapOccurrence.title}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/30 to-transparent" />
              <span className="absolute top-2 left-2 px-2 py-0.5 rounded-lg bg-rose-600 text-white font-black text-[10px] shadow-lg">
                📸 Foto Real do Local Demarcado
              </span>
              <button
                onClick={() => setSelectedMapOccurrence(null)}
                className="absolute top-2 right-2 p-1.5 rounded-full bg-slate-950/80 hover:bg-slate-900 text-white border border-slate-700"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )}

          <div className="p-3 space-y-2">
            <div className="flex items-start justify-between gap-2">
              <div>
                <span
                  className="inline-block px-2 py-0.5 rounded text-[9px] font-black uppercase text-white mb-1"
                  style={{ backgroundColor: selectedMapOccurrence.zoneColor || '#e11d48' }}
                >
                  {selectedMapOccurrence.speedLimitKmh
                    ? `📸 Limite ${selectedMapOccurrence.speedLimitKmh} km/h`
                    : selectedMapOccurrence.riskRadiusMeters
                    ? `Zona Demarcada (${selectedMapOccurrence.riskRadiusMeters}m)`
                    : 'Alerta em Tempo Real'}
                </span>
                <h4 className="text-sm font-black text-white leading-tight">
                  {selectedMapOccurrence.title}
                </h4>
              </div>
              {!selectedMapOccurrence.photoUrl && (
                <button
                  onClick={() => setSelectedMapOccurrence(null)}
                  className="p-1 rounded-lg bg-slate-900 text-slate-400 hover:text-white"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            <p className="text-[11px] text-slate-200 leading-snug">
              {selectedMapOccurrence.description}
            </p>

            <div className="text-[10px] text-cyan-300 font-bold flex items-center justify-between pt-1 border-t border-slate-800">
              <span>📍 {selectedMapOccurrence.locationName}</span>
              <span>👍 {selectedMapOccurrence.confirmationsCount} confirmações</span>
            </div>

            <div className="grid grid-cols-2 gap-1.5 pt-1">
              <button
                onClick={() => {
                  setActiveRiskZone(selectedMapOccurrence);
                  setZoneDismissedId(null);
                  setZoneSecondsElapsed(0);
                  setSelectedMapOccurrence(null);
                }}
                className="py-2 px-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-black text-[10px] flex items-center justify-center gap-1 shadow"
              >
                <Clock className="w-3.5 h-3.5" />
                <span>Abrir Tempo de Saída</span>
              </button>
              {onOpenPhotoIncident && (
                <button
                  onClick={() => {
                    const coords = selectedMapOccurrence.coordinates;
                    setSelectedMapOccurrence(null);
                    onOpenPhotoIncident(coords);
                  }}
                  className="py-2 px-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-[10px] flex items-center justify-center gap-1 shadow"
                >
                  <Camera className="w-3.5 h-3.5" />
                  <span>Atualizar com Foto</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Floating Selected Establishment Card (Real Photo + Star Rating + Verified Reference Point + Route Action) */}
      {selectedMapPlace && !isNavigating && (
        <div className="absolute top-14 left-3 right-16 sm:right-auto sm:w-[390px] z-30 bg-slate-950/95 border border-cyan-500/50 rounded-2xl shadow-2xl overflow-hidden backdrop-blur-md animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="relative h-32 w-full bg-slate-900 overflow-hidden">
            {selectedMapPlace.photoUrl ? (
              <img
                src={selectedMapPlace.photoUrl}
                alt={selectedMapPlace.name}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-slate-800 text-slate-400 text-xs font-bold">
                Estabelecimento Verificado
              </div>
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/40 to-transparent" />

            {/* Close Card Button */}
            <button
              onClick={() => setSelectedMapPlace(null)}
              className="absolute top-2 right-2 p-1.5 rounded-full bg-slate-950/80 hover:bg-slate-900 text-white border border-slate-700"
              title="Fechar cartão"
            >
              <X className="w-4 h-4" />
            </button>

            {/* Star Rating Pill */}
            {selectedMapPlace.rating !== undefined && (
              <div className="absolute top-2 left-2 px-2 py-0.5 rounded-lg bg-slate-950/90 border border-amber-500/40 flex items-center gap-1 text-[11px] font-black text-amber-400 shadow-lg">
                <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                <span>{selectedMapPlace.rating.toFixed(1)}</span>
                {selectedMapPlace.ratingCount !== undefined && (
                  <span className="text-[9px] text-slate-300 font-semibold">
                    ({selectedMapPlace.ratingCount.toLocaleString('pt-BR')} avaliações)
                  </span>
                )}
              </div>
            )}

            <div className="absolute bottom-2 left-3 right-3">
              <div className="text-sm font-black text-white leading-tight line-clamp-1">
                {selectedMapPlace.name}
              </div>
              <div className="text-[10px] text-cyan-300 font-bold">
                {selectedMapPlace.subCategory}
                {selectedMapPlace.distanceMeters
                  ? ` • ${selectedMapPlace.distanceMeters < 1000 ? `${selectedMapPlace.distanceMeters}m` : `${(selectedMapPlace.distanceMeters / 1000).toFixed(1)} km`}`
                  : ''}
              </div>
            </div>
          </div>

          <div className="p-3 space-y-2">
            <div className="text-[11px] text-slate-300 flex items-start gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-cyan-400 shrink-0 mt-0.5" />
              <span>
                {selectedMapPlace.address}
                {selectedMapPlace.neighborhood ? ` — ${selectedMapPlace.neighborhood}` : ''}
              </span>
            </div>

            {selectedMapPlace.verifiedReferencePoint && (
              <div className="p-2 rounded-xl bg-cyan-950/50 border border-cyan-500/30 text-[10px] text-cyan-200 leading-snug">
                <span className="font-black uppercase text-cyan-400 block mb-0.5">
                  📍 Ponto de Referência de Chegada:
                </span>
                {selectedMapPlace.verifiedReferencePoint}
                {selectedMapPlace.accessNotes && (
                  <span className="block text-[9px] text-slate-300 mt-0.5">
                    🚗 {selectedMapPlace.accessNotes}
                  </span>
                )}
              </div>
            )}

            <div className="pt-1">
              <button
                onClick={() => {
                  if (onSelectPlace) onSelectPlace(selectedMapPlace);
                  setSelectedMapPlace(null);
                }}
                className="w-full py-2.5 px-3 rounded-xl bg-lime-400 hover:bg-lime-300 text-slate-950 font-black text-xs flex items-center justify-center gap-1.5 shadow-lg active:scale-95 transition-all"
              >
                <Navigation className="w-3.5 h-3.5" />
                <span>Traçar Rota Agora no Tô Passando</span>
              </button>
            </div>

            {selectedMapPlace.phone && (
              <div className="flex items-center justify-between pt-1 border-t border-slate-800/80 text-[10px] text-slate-400">
                <a
                  href={`tel:${selectedMapPlace.phone.replace(/[^\d+]/g, '')}`}
                  className="text-emerald-400 hover:underline font-bold flex items-center gap-1"
                >
                  <Phone className="w-3 h-3" />
                  <span>Ligar: {selectedMapPlace.phone}</span>
                </a>
                {onOpenPlacesPanel && (
                  <button
                    onClick={onOpenPlacesPanel}
                    className="text-cyan-400 hover:underline font-bold"
                  >
                    Ver todos os locais →
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Floating Controls HUD (Strictly lower z-index than headers and modals) */}
      <div className="absolute top-14 right-3 z-30 flex flex-col gap-2">
        {/* Recenter Button */}
        <button
          onClick={handleRecenter}
          className="p-3 bg-slate-900/90 hover:bg-slate-800 text-lime-400 rounded-xl shadow-xl border border-slate-700/80 backdrop-blur-md active:scale-95 transition-all group"
          title="Centralizar no Meu Veículo (GPS)"
        >
          <Crosshair className="w-5 h-5 group-hover:rotate-45 transition-transform" />
        </button>

        {/* Quick Camera Mark Button on Right HUD */}
        {onOpenPhotoIncident && (
          <button
            onClick={() => onOpenPhotoIncident(tappedMapCoords || currentLocation)}
            className="p-3 bg-rose-600/95 hover:bg-rose-500 text-white rounded-xl shadow-xl border border-rose-400 backdrop-blur-md active:scale-95 transition-all"
            title="Marcar Local de Roubo ou Problema na Via + Tirar Foto"
          >
            <Camera className="w-5 h-5" />
          </button>
        )}

        {/* Noturno Automático / Manual Quick Toggle */}
        <button
          onClick={() => switchLayer(activeLayer === 'dark' ? 'streets' : 'dark', true)}
          className={`p-3 rounded-xl shadow-xl border backdrop-blur-md active:scale-95 transition-all flex items-center justify-center ${
            activeLayer === 'dark'
              ? 'bg-indigo-600 text-white border-indigo-400 shadow-indigo-500/30'
              : 'bg-slate-900/90 hover:bg-slate-800 text-slate-300 border-slate-700/80'
          }`}
          title={activeLayer === 'dark' ? 'Modo Noturno Ativo (Destaque de Iluminação e Sinalização)' : 'Ativar Modo Noturno'}
        >
          <span className="text-base leading-none select-none">🌙</span>
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
            title="Escolher Camadas (Mapa Tô Passando / Satélite / Relevo)"
          >
            <Layers className="w-5 h-5" />
          </button>

          {/* Layer Selection Dropdown */}
          {showLayerMenu && (
            <div className="absolute right-12 top-0 bg-slate-900/95 border border-slate-700 rounded-2xl shadow-2xl p-2 w-52 flex flex-col gap-1 backdrop-blur-md z-40">
              <div className="text-[10px] uppercase font-bold tracking-wider text-slate-400 px-2 py-1">
                Visualização Cartográfica
              </div>
              
              <button
                onClick={() => { switchLayer('streets', true); setShowLayerMenu(false); }}
                className={`flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold transition-all ${
                  activeLayer === 'streets'
                    ? 'bg-blue-600 text-white shadow-md'
                    : 'text-slate-300 hover:bg-slate-800'
                }`}
              >
                <MapIcon className="w-4 h-4 text-lime-400" />
                <span>🧭 Mapa Tô Passando (Ruas Ao Vivo)</span>
              </button>

              <button
                onClick={() => { switchLayer('satellite', true); setShowLayerMenu(false); }}
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
                onClick={() => { switchLayer('topo', true); setShowLayerMenu(false); }}
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
                onClick={() => { switchLayer('dark', true); setShowLayerMenu(false); }}
                className={`flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold transition-all ${
                  activeLayer === 'dark'
                    ? 'bg-blue-600 text-white shadow-md'
                    : 'text-slate-300 hover:bg-slate-800'
                }`}
              >
                <Box className="w-4 h-4 text-indigo-400" />
                <span>🌙 Tô Passando Noturno</span>
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

      {/* Floating Info & Night Mode Highlight Pill */}
      <div className="absolute bottom-20 left-3 z-20 flex flex-wrap items-center gap-1.5 pointer-events-none">
        {is3DMode && (
          <div className="px-2.5 py-1 rounded-xl bg-lime-400 text-slate-950 font-black text-[10px] tracking-wider uppercase shadow-lg shadow-lime-500/20 border border-lime-300">
            Modo 3D Ativo
          </div>
        )}
        {activeLayer === 'dark' && (
          <div className="px-2.5 py-1 rounded-xl bg-indigo-950/90 text-amber-300 font-black text-[10px] shadow-lg border border-amber-400/60 flex items-center gap-1.5">
            <span>🌙 Modo Noturno Ativo • 💡 Destacando Vias Sem Iluminação e 🚫 Sem Sinalização</span>
          </div>
        )}
      </div>
    </div>
  );
};
