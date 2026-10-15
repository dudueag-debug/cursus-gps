import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import type { Coordinates, RouteOption, Occurrence, CultureSpot, UserProfile, MapLayerType, Place } from '../../types';
import { createVehicleDivIcon } from './VehicleMarkerIcon';
import { Crosshair, ZoomIn, ZoomOut, Eye, Layers, Compass, Box, Map as MapIcon, Globe, Navigation, MapPin, Phone, Star, X, Camera, AlertTriangle, Clock, ShieldAlert, Sparkles } from 'lucide-react';
import { RIO_COMMUNITY_ZONES, type RioCommunityRiskZone } from '../../data/rioCommunityZones';

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
  gpsAccuracy?: number | null;
  liveSpeedKmh?: number;
}

function getCardinalDirection(angle: number): string {
  const directions = ['N', 'NE', 'L', 'SE', 'S', 'SO', 'O', 'NO'];
  const index = Math.round((angle % 360) / 45) % 8;
  return directions[index];
}

const MAP_QUICK_CATEGORIES = [
  { key: 'all', label: 'Tudo no Mapa', emoji: '🗺️' },
  { key: 'shopping', label: 'Shoppings Reais', emoji: '🛍️' },
  { key: 'saude', label: 'Hospitais & UPAs', emoji: '🏥' },
  { key: 'estacionamento', label: 'Estacionamentos 24h', emoji: '🅿️' },
  { key: 'parque_praia', label: 'Praias do RJ', emoji: '🏖️' },
  { key: 'cachoeira', label: 'Cachoeiras & Florestas', emoji: '🏞️' },
  { key: 'supermercado', label: 'Supermercados', emoji: '🛒' },
  { key: 'mercado', label: 'Mercados Locais', emoji: '🏪' },
  { key: 'posto_gnv', label: 'Postos & GNV', emoji: '⛽' },
  { key: 'material_construcao', label: 'Mat. Construção', emoji: '🔨' },
  { key: 'educacao', label: 'Escolas & Faculdades', emoji: '🎓' },
  { key: 'oficina', label: 'Mecânicos', emoji: '🔧' },
  { key: 'funilaria_pintura', label: 'Funilaria & Pintura', emoji: '🎨' },
  { key: 'borracheiro', label: 'Borracharias 24h', emoji: '🛞' },
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
  gpsAccuracy = 3,
  liveSpeedKmh,
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const tileLayerRef = useRef<L.TileLayer | null>(null);
  const vehicleMarkerRef = useRef<L.Marker | null>(null);
  const accuracyCircleRef = useRef<L.Circle | null>(null);
  const primaryRouteLineRef = useRef<L.Polyline | null>(null);
  const altRouteLineRef = useRef<L.Polyline | null>(null);
  const destMarkerRef = useRef<L.Marker | null>(null);
  const destBeaconCircleRef = useRef<L.Circle | null>(null);
  const occurrencesLayerGroupRef = useRef<L.LayerGroup | null>(null);
  const cultureLayerGroupRef = useRef<L.LayerGroup | null>(null);
  const placesLayerGroupRef = useRef<L.LayerGroup | null>(null);
  const communityLayerGroupRef = useRef<L.LayerGroup | null>(null);
  const isUserDraggingMapRef = useRef<boolean>(false);

  // Automatic Night Mode detection when dusk arrives (18:00 to 05:59)
  const isNightHourNow = () => {
    const h = new Date().getHours();
    return h >= 18 || h < 6;
  };

  // Active layer & 3D perspective mode (Defaults to 'streets' for full Google Maps street names)
  const [activeLayer, setActiveLayer] = useState<MapLayerType>(() => {
    return user.mapLayerType || 'streets';
  });
  const [userManuallyChangedLayer, setUserManuallyChangedLayer] = useState<boolean>(false);
  const [is3DMode, setIs3DMode] = useState<boolean>(user.is3DMode || false);
  const [showLayerMenu, setShowLayerMenu] = useState<boolean>(false);
  const [activeMapCategory, setActiveMapCategory] = useState<string>('all');
  const [selectedMapPlace, setSelectedMapPlace] = useState<Place | null>(null);
  const [selectedMapOccurrence, setSelectedMapOccurrence] = useState<Occurrence | null>(null);
  const [tappedMapCoords, setTappedMapCoords] = useState<Coordinates | null>(null);

  const [currentZoom, setCurrentZoom] = useState<number>(15);
  const [isDeclutterActive, setIsDeclutterActive] = useState<boolean>(false);

  // Active Community Extreme Risk Zone & Live Traversal Timer
  const [activeCommunityZone, setActiveCommunityZone] = useState<RioCommunityRiskZone | null>(null);
  const [dismissedCommunityId, setDismissedCommunityId] = useState<string | null>(null);
  const [communitySecondsElapsed, setCommunitySecondsElapsed] = useState<number>(0);
  const lastAnnouncedCommunityIdRef = useRef<string | null>(null);

  // Active Risk Zone Entry Alert & Live Timer until exiting the zone (strictly when passing nearby)
  const [activeRiskZone, setActiveRiskZone] = useState<Occurrence | null>(null);
  const [zoneSecondsElapsed, setZoneSecondsElapsed] = useState<number>(0);
  const [zoneDismissedId, setZoneDismissedId] = useState<string | null>(null);
  const lastWarnedRadarIdRef = useRef<string | null>(null);

  // Proximity Radar / Pardal tracking (< 450m)
  const nearbyRadar = occurrences.find(o =>
    (o.category === 'radar' || o.title.toLowerCase().includes('radar') || o.title.toLowerCase().includes('pardal')) &&
    calcDistanceMeters(currentLocation, o.coordinates) <= 450
  );

  const radarDistance = nearbyRadar ? Math.round(calcDistanceMeters(currentLocation, nearbyRadar.coordinates)) : 0;
  const currentSpeed = liveSpeedKmh && liveSpeedKmh > 0 ? liveSpeedKmh : (isNavigating ? 48 : 0);
  const radarSpeedLimit = nearbyRadar?.speedLimitKmh || 60;
  const isOverSpeed = nearbyRadar ? currentSpeed > radarSpeedLimit : false;

  // Spoken voice advisory when entering radar proximity
  useEffect(() => {
    if (nearbyRadar && nearbyRadar.id !== lastWarnedRadarIdRef.current) {
      lastWarnedRadarIdRef.current = nearbyRadar.id;
      if (typeof window !== 'undefined' && 'speechSynthesis' in window && user.enableVoiceInstructions) {
        try {
          window.speechSynthesis.cancel();
          const dist = Math.round(calcDistanceMeters(currentLocation, nearbyRadar.coordinates));
          const limit = nearbyRadar.speedLimitKmh || 60;
          const msg = new SpeechSynthesisUtterance(`Atenção: radar à frente a ${dist} metros. Limite regulamentar ${limit} quilômetros por hora.`);
          msg.lang = 'pt-BR';
          msg.rate = 1.05;
          window.speechSynthesis.speak(msg);
        } catch {}
      }
    }
  }, [nearbyRadar?.id, user.enableVoiceInstructions]);

  // Professional Ultra-Detailed Cartography (100% Google Maps official road network with all street names & places)
  const getLayerConfig = (layer: MapLayerType) => {
    switch (layer) {
      case 'satellite':
        return {
          url: 'https://mt{s}.google.com/vt/lyrs=y&x={x}&y={y}&z={z}',
          subdomains: ['0', '1', '2', '3'],
          maxZoom: 21,
          className: '',
          attribution: '&copy; Tô Passando Satélite Google HD',
        };
      case 'topo':
        return {
          url: 'https://mt{s}.google.com/vt/lyrs=p&x={x}&y={y}&z={z}',
          subdomains: ['0', '1', '2', '3'],
          maxZoom: 21,
          className: '',
          attribution: '&copy; Tô Passando Relevo Google',
        };
      case 'dark':
        return {
          url: 'https://mt{s}.google.com/vt/lyrs=m&x={x}&y={y}&z={z}',
          subdomains: ['0', '1', '2', '3'],
          maxZoom: 21,
          className: 'leaflet-tile-subtle-dark',
          attribution: '&copy; Tô Passando Noturno Oficial',
        };
      case 'streets':
      default:
        return {
          url: 'https://mt{s}.google.com/vt/lyrs=m&x={x}&y={y}&z={z}',
          subdomains: ['0', '1', '2', '3'],
          maxZoom: 21,
          className: '',
          attribution: '&copy; Tô Passando Cartografia Oficial Google Maps',
        };
    }
  };

  const createSafeTile = (layer: MapLayerType) => {
    const config = getLayerConfig(layer);
    const tile = L.tileLayer(config.url, {
      maxZoom: config.maxZoom,
      attribution: config.attribution,
      className: config.className,
      subdomains: config.subdomains,
      keepBuffer: 10,
      updateWhenIdle: false,
    });

    // Fallback on tile error to mt1 Google Maps standard
    tile.on('tileerror', (e: any) => {
      const img = e.tile;
      if (img && !img.dataset.fallback) {
        img.dataset.fallback = 'true';
        const { z, x, y } = e.coords;
        img.src = `https://mt1.google.com/vt/lyrs=m&x=${x}&y=${y}&z=${z}`;
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

  // Monitor Real-Time GPS Entry into Community / Extreme Risk Zones in Rio de Janeiro
  useEffect(() => {
    const nearbyCommunity = RIO_COMMUNITY_ZONES.find(zone => {
      const dist = calcDistanceMeters(currentLocation, zone.coordinates);
      return dist <= zone.radiusMeters;
    });

    if (nearbyCommunity && nearbyCommunity.id !== dismissedCommunityId) {
      setActiveCommunityZone(prev => {
        if (prev?.id !== nearbyCommunity.id) {
          setCommunitySecondsElapsed(0);
        }
        return nearbyCommunity;
      });

      // Voice advisory alert when entering community area
      if (nearbyCommunity.id !== lastAnnouncedCommunityIdRef.current) {
        lastAnnouncedCommunityIdRef.current = nearbyCommunity.id;
        if (typeof window !== 'undefined' && 'speechSynthesis' in window && user.enableVoiceInstructions) {
          try {
            window.speechSynthesis.cancel();
            const msg = new SpeechSynthesisUtterance(
              `Atenção: você está passando pela comunidade ${nearbyCommunity.name}. Área de extremo risco. Mantenha os vidros fechados, faróis baixos e velocidade moderada.`
            );
            msg.lang = 'pt-BR';
            msg.rate = 1.05;
            window.speechSynthesis.speak(msg);
          } catch {}
        }
      }
    } else {
      if (activeCommunityZone && lastAnnouncedCommunityIdRef.current === activeCommunityZone.id) {
        // Driver has safely exited the community zone!
        if (typeof window !== 'undefined' && 'speechSynthesis' in window && user.enableVoiceInstructions) {
          try {
            const msg = new SpeechSynthesisUtterance('Você saiu da área de comunidade. Travessia concluída com segurança.');
            msg.lang = 'pt-BR';
            msg.rate = 1.05;
            window.speechSynthesis.speak(msg);
          } catch {}
        }
        lastAnnouncedCommunityIdRef.current = null;
      }
      setActiveCommunityZone(null);
      setCommunitySecondsElapsed(0);
    }
  }, [currentLocation.lat, currentLocation.lng, dismissedCommunityId, user.enableVoiceInstructions, activeCommunityZone]);

  // Tick the live timer every second while the user is inside the community zone
  useEffect(() => {
    if (!activeCommunityZone) return;
    const timer = setInterval(() => {
      setCommunitySecondsElapsed(prev => prev + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [activeCommunityZone?.id]);

  // Monitor Real-Time GPS Entry into Reported Dangerous / Risk Zones (ONLY when driver is passing through!)
  useEffect(() => {
    const riskCategories = new Set([
      'roubo_celular_semaforo',
      'roubo_carro_moto',
      'roubo_pedestre',
      'ponto_roubo',
      'local_perigoso',
    ]);

    const activeZones = occurrences.filter(
      o => !o.isNormalized && o.status !== 'resolvida' && riskCategories.has(o.category)
    );

    let closestZone: Occurrence | null = null;
    let minDistance = Infinity;

    for (const z of activeZones) {
      const dist = calcDistanceMeters(currentLocation, z.coordinates);
      const triggerRadius = z.riskRadiusMeters ? Math.min(z.riskRadiusMeters, 250) : 220;
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

      // Professional Navigation Metric Scale Control (dynamic physical distance)
      L.control.scale({ metric: true, imperial: false, position: 'bottomleft' }).addTo(map);

      // Occurrences, Culture, Places & Community layer groups
      const occGroup = L.layerGroup().addTo(map);
      const culGroup = L.layerGroup().addTo(map);
      const plcGroup = L.layerGroup().addTo(map);
      const comGroup = L.layerGroup().addTo(map);
      occurrencesLayerGroupRef.current = occGroup;
      cultureLayerGroupRef.current = culGroup;
      placesLayerGroupRef.current = plcGroup;
      communityLayerGroupRef.current = comGroup;

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

      // Track zoom level changes dynamically to declutter the map when zoomed out
      map.on('zoomend', () => {
        try {
          setCurrentZoom(map.getZoom());
        } catch {}
      });

      // Track user manual panning so map doesn't fight finger/mouse when exploring
      map.on('dragstart', () => {
        isUserDraggingMapRef.current = true;
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

  // Recenter / follow vehicle smoothly in real time
  useEffect(() => {
    if (!mapRef.current) return;
    if (isNavigating) {
      // Forward perspective camera offset so driver sees upcoming roads and intersections
      const rad = (heading * Math.PI) / 180;
      const forwardLat = Math.cos(rad) * 0.0016;
      const forwardLng = Math.sin(rad) * 0.0016;
      mapRef.current.panTo([currentLocation.lat + forwardLat, currentLocation.lng + forwardLng], { animate: true, duration: 0.8 });
    } else if (!isUserDraggingMapRef.current) {
      mapRef.current.panTo([currentLocation.lat, currentLocation.lng], { animate: true, duration: 1.0 });
    }
  }, [currentLocation.lat, currentLocation.lng, isNavigating, heading]);

  // Update Vehicle Marker Position, Icon, GPS Accuracy Pulse Ring, and Heading
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

    // RTK Satellite Accuracy Ring showing precision
    const accuracyRadius = Math.max(10, Math.min(45, gpsAccuracy || 18));
    if (!accuracyCircleRef.current) {
      accuracyCircleRef.current = L.circle([currentLocation.lat, currentLocation.lng], {
        radius: accuracyRadius,
        color: '#06b6d4',
        fillColor: '#22d3ee',
        fillOpacity: 0.12,
        weight: 1.5,
        dashArray: '3, 4',
      }).addTo(mapRef.current);
    } else {
      accuracyCircleRef.current.setLatLng([currentLocation.lat, currentLocation.lng]);
      accuracyCircleRef.current.setRadius(accuracyRadius);
    }
  }, [currentLocation, heading, user.vehicleModel, user.vehicleColor, user.enableWindEffect, isNavigating, gpsAccuracy]);

  // Draw Professional Technological Laser Routes & Destination Beacon
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
    if (destBeaconCircleRef.current) {
      destBeaconCircleRef.current.remove();
      destBeaconCircleRef.current = null;
    }

    if (!selectedRoute || !selectedRoute.coordinates || selectedRoute.coordinates.length < 2) return;

    const latLngs = selectedRoute.coordinates.map(c => [c.lat, c.lng] as [number, number]);

    // Outer glow navigation casing
    const outerPoly = L.polyline(latLngs, {
      color: '#0369a1',
      weight: 12,
      opacity: 0.85,
      lineCap: 'round',
      lineJoin: 'round',
    }).addTo(mapRef.current);
    altRouteLineRef.current = outerPoly;

    // Inner glowing electric cyan route laser line
    const primaryPoly = L.polyline(latLngs, {
      color: '#06b6d4',
      weight: 6.5,
      opacity: 1,
      lineCap: 'round',
      lineJoin: 'round',
    }).addTo(mapRef.current);
    primaryRouteLineRef.current = primaryPoly;

    // Destination Pin Marker & Pulsing Arrival Beacon
    const lastCoord = selectedRoute.coordinates[selectedRoute.coordinates.length - 1];

    const arrivalBeacon = L.circle([lastCoord.lat, lastCoord.lng], {
      radius: 40,
      color: '#10b981',
      fillColor: '#34d399',
      fillOpacity: 0.25,
      weight: 2.5,
    }).addTo(mapRef.current);
    destBeaconCircleRef.current = arrivalBeacon;

    const destHtml = `
      <div class="relative flex flex-col items-center group cursor-pointer" style="transform: translate(-50%, -100%);">
        <div class="w-10 h-10 rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-400 border-2 border-white flex items-center justify-center shadow-2xl text-white font-black animate-bounce ring-4 ring-emerald-400/40">
          <svg class="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M3 21v-4m0 0V5a2 2 0 012-2h6.5l1 1H21l-3 6 3 6h-8.5l-1-1H5a2 2 0 00-2 2zm9-13.5V9"/></svg>
        </div>
        <div class="mt-0.5 px-2.5 py-0.5 bg-slate-950/95 text-white font-black text-[10px] rounded-full shadow-lg whitespace-nowrap border border-emerald-400/60">
          🏁 ${selectedRoute.title || 'Destino'}
        </div>
      </div>
    `;

    const destIcon = L.divIcon({
      className: 'tp-dest-pin-marker',
      html: destHtml,
      iconSize: [40, 40],
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

      const nightGlowClass =
        isNightMode && isNightPriority
          ? 'ring-4 ring-yellow-300 shadow-[0_0_22px_#fde047] scale-110'
          : '';

      const iconHtml = `
        <div class="relative flex items-center justify-center cursor-pointer group">
          <div class="w-7 h-7 rounded-full flex items-center justify-center shadow-lg border-2 border-white transition-transform hover:scale-125 ${nightGlowClass}" style="background-color: ${badgeBg}">
            <span class="text-xs leading-none">${badgeEmoji}</span>
          </div>
          ${!isResolved ? '<span class="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-red-500 border border-white animate-ping"></span>' : ''}
        </div>
      `;

      const occIcon = L.divIcon({
        className: 'tp-occ-marker',
        html: iconHtml,
        iconSize: [28, 28],
        iconAnchor: [14, 14],
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

  // Render Active Community Safety Perimeter ONLY when approaching / passing through (leaves cartography 100% clean)
  useEffect(() => {
    if (!mapRef.current || !communityLayerGroupRef.current) return;
    const group = communityLayerGroupRef.current;
    group.clearLayers();

    if (!activeCommunityZone) return;

    // Safety perimeter circle only for the community zone being traversed
    const circle = L.circle([activeCommunityZone.coordinates.lat, activeCommunityZone.coordinates.lng], {
      radius: activeCommunityZone.radiusMeters,
      color: '#dc2626',
      weight: 2.5,
      dashArray: '6, 6',
      opacity: 0.9,
      fillColor: '#991b1b',
      fillOpacity: 0.16,
    });

    group.addLayer(circle);
  }, [activeCommunityZone]);

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
    if (cat === 'parque_praia') {
      return place.category === 'parque_praia';
    }
    if (cat === 'cachoeira') {
      return place.category === 'cachoeira';
    }
    if (cat === 'estacionamento') {
      return place.category === 'estacionamento';
    }
    if (cat === 'shopping') {
      return place.category === 'shopping';
    }
    return place.category === cat;
  };

  // Render Verified Places & Real Neighborhood Establishments with Adaptive Decluttering & Real Photos
  useEffect(() => {
    if (!mapRef.current || !placesLayerGroupRef.current) return;
    const group = placesLayerGroupRef.current;
    group.clearLayers();

    // When Declutter Mode is active or during Active Navigation, prioritize clean roads unless a specific category was picked
    if ((isDeclutterActive || isNavigating) && activeMapCategory === 'all') {
      return;
    }

    const filtered = places.filter(p => matchPlaceCategory(p, activeMapCategory));

    // Declutter guard: Sort by distance and cap visible places to the closest 35 to prevent DOM & visual overcrowding
    const visiblePlaces = filtered
      .map(p => ({
        ...p,
        _dist: calcDistanceMeters(currentLocation, p.coordinates),
      }))
      .sort((a, b) => a._dist - b._dist)
      .slice(0, 35);

    const isHighZoom = currentZoom >= 16;   // Street level: show full photo card with name & star rating
    const isMediumZoom = currentZoom >= 14; // District level: show compact photo thumbnail badge without text clutter
    // Low zoom (< 14): show sleek, compact 22px category pin to keep arterial roads 100% clean

    visiblePlaces.forEach(place => {
      let bgColor = 'bg-slate-700';
      let borderColor = 'border-white';
      let iconEmoji = '📍';

      if (place.category === 'saude' || place.category === 'upa' || place.category === 'hospital' || place.category === 'posto_saude') {
        bgColor = 'bg-red-600';
        borderColor = 'border-red-300';
        iconEmoji = '🏥';
      } else if (place.category === 'policia' || place.category === 'delegacia' || place.category === 'batalhao' || place.category === 'dpo') {
        bgColor = 'bg-blue-600';
        borderColor = 'border-blue-300';
        iconEmoji = '🚓';
      } else if (place.category === 'posto_gnv') {
        bgColor = 'bg-cyan-600';
        borderColor = 'border-cyan-300';
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
        borderColor = 'border-pink-300';
        iconEmoji = '🛍️';
      } else if (place.category === 'estacionamento') {
        bgColor = 'bg-blue-700';
        borderColor = 'border-cyan-300';
        iconEmoji = '🅿️';
      } else if (place.category === 'cachoeira') {
        bgColor = 'bg-teal-600';
        borderColor = 'border-teal-300';
        iconEmoji = '🏞️';
      } else if (place.category === 'parque_praia' || place.category === 'lazer_cultura') {
        bgColor = 'bg-sky-600';
        borderColor = 'border-sky-300';
        iconEmoji = '🏖️';
      }

      // Clean, minimalist Google Maps style POI pin (NO floating photos covering the streets)
      const iconHtml = `
        <div class="relative flex items-center justify-center cursor-pointer group">
          <div class="w-6 h-6 rounded-full ${bgColor} border-2 border-white flex items-center justify-center shadow-md transition-transform group-hover:scale-130 group-hover:ring-2 group-hover:ring-cyan-400">
            <span class="text-[11px] leading-none">${iconEmoji}</span>
          </div>
        </div>
      `;

      const placeIcon = L.divIcon({
        className: 'tp-place-marker',
        html: iconHtml,
        iconSize: [24, 24],
        iconAnchor: [12, 12],
      });

      const marker = L.marker([place.coordinates.lat, place.coordinates.lng], { icon: placeIcon, zIndexOffset: 500 });
      marker.on('click', () => {
        setSelectedMapOccurrence(null);
        setSelectedMapPlace(place);
        mapRef.current?.panTo([place.coordinates.lat, place.coordinates.lng], { animate: true });
      });

      marker.bindTooltip(`
        <div class="text-xs p-1 font-semibold text-slate-900 max-w-[200px]">
          <div class="font-black text-slate-900">${iconEmoji} ${place.name}</div>
          <div class="text-[10px] text-slate-600">${place.subCategory}${place.rating ? ` • ★${place.rating.toFixed(1)}` : ''}</div>
        </div>
      `, { direction: 'top', offset: [0, -10] });

      group.addLayer(marker);
    });
  }, [places, activeMapCategory, currentZoom, isDeclutterActive, isNavigating, currentLocation.lat, currentLocation.lng]);

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
    isUserDraggingMapRef.current = false;
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

      {/* Top Floating Bar: Centered Category Chips & Aligned Safety Alerts */}
      {!isNavigating && (
        <div className="absolute top-2 inset-x-0 z-30 flex flex-col items-center gap-1.5 pointer-events-none px-2 sm:px-14">
          <div className="flex items-center justify-start sm:justify-center gap-1.5 overflow-x-auto no-scrollbar pointer-events-auto max-w-full pb-1">
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

            {/* Quick Declutter / Clean Visual Map Toggle */}
            <button
              onClick={() => setIsDeclutterActive(!isDeclutterActive)}
              className={`shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-black shadow-xl border active:scale-95 transition-all ${
                isDeclutterActive
                  ? 'bg-gradient-to-r from-amber-400 to-orange-500 text-slate-950 border-amber-300 ring-2 ring-amber-400/40 shadow-amber-500/30'
                  : 'bg-slate-950/90 hover:bg-slate-900 text-emerald-300 border-emerald-500/40'
              }`}
              title={isDeclutterActive ? 'Modo Limpo Ativo (Pistas Despoluídas). Clique para reexibir todos os comércios.' : 'Despoluir Mapa (Ocultar comércios secundários e deixar pistas limpas)'}
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>{isDeclutterActive ? '✨ Mapa Despoluído' : '🧹 Despoluir Mapa'}</span>
            </button>

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

          {/* Proximity Speed Camera (Pardal) Alert Banner */}
          {nearbyRadar && (
            <div className="pointer-events-auto max-w-lg w-full bg-gradient-to-r from-red-950/95 via-slate-950/95 to-amber-950/95 border-2 border-red-500 rounded-2xl p-3 shadow-2xl backdrop-blur-xl animate-in slide-in-from-top-4 duration-300">
              <div className="flex items-center justify-between gap-3">
                {/* Brazilian Regulatory Speed Limit Sign (Placa R-19) */}
                <div className={`w-12 h-12 rounded-full bg-white border-4 border-red-600 flex flex-col items-center justify-center shrink-0 shadow-xl ${isOverSpeed ? 'animate-bounce ring-4 ring-red-500' : 'ring-2 ring-red-500/50'}`}>
                  <span className="text-slate-950 font-black text-sm leading-none">{radarSpeedLimit}</span>
                  <span className="text-slate-700 font-bold text-[7px] leading-none uppercase">km/h</span>
                </div>

                {/* Radar Details */}
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="px-2 py-0.5 rounded-md bg-red-600 text-white font-black text-[9px] uppercase tracking-wider flex items-center gap-1 animate-pulse shadow">
                      📸 RADAR / PARDAL APROXIMANDO-SE
                    </span>
                    <span className="text-xs font-black text-amber-300 font-mono">
                      A {radarDistance} METROS
                    </span>
                  </div>
                  <div className="text-xs font-black text-white truncate mt-1">
                    {nearbyRadar.title} • {nearbyRadar.locationName || 'Trecho Monitorado'}
                  </div>
                  {isOverSpeed ? (
                    <div className="text-[10px] font-black text-rose-300 flex items-center gap-1 mt-0.5 animate-pulse">
                      ⚠️ VELOCIDADE ({currentSpeed} km/h) ACIMA DO LIMITE! REDUZA A VELOCIDADE!
                    </div>
                  ) : (
                    <div className="text-[10px] font-bold text-emerald-400 mt-0.5 flex items-center gap-1">
                      <span>✓</span>
                      <span>Velocidade monitorada ({currentSpeed} km/h) compatível com a via</span>
                    </div>
                  )}
                </div>

                {/* Camera / Action icon */}
                <button
                  onClick={() => {
                    setSelectedMapOccurrence(nearbyRadar);
                    setSelectedMapPlace(null);
                  }}
                  className="p-2 rounded-xl bg-slate-900/90 hover:bg-slate-800 border border-red-500/50 text-red-400 hover:text-white shrink-0 text-xs font-bold transition-all"
                  title="Ver Detalhes do Radar"
                >
                  <Camera className="w-5 h-5" />
                </button>
              </div>
            </div>
          )}

          {/* Active Community Zone Entry Alert & Live Traversal Timer */}
          {activeCommunityZone && (
            <div className="pointer-events-auto max-w-lg w-full bg-gradient-to-r from-red-950/98 via-rose-950/98 to-slate-950/98 border-2 border-red-500 rounded-2xl p-3 shadow-2xl backdrop-blur-xl animate-in slide-in-from-top-4 duration-300">
              <div className="flex items-start justify-between gap-2.5">
                <div className="w-10 h-10 rounded-xl bg-red-600 border-2 border-white flex items-center justify-center text-white shrink-0 shadow-lg animate-pulse">
                  <ShieldAlert className="w-5 h-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="px-2 py-0.5 rounded-md bg-red-600 text-white font-black text-[9px] uppercase tracking-wider">
                      🚨 ÁREA DE COMUNIDADE • EXTREMO RISCO
                    </span>
                    <span className="text-[10px] font-mono font-black text-amber-300 flex items-center gap-1">
                      <Clock className="w-3 h-3 text-amber-400" />
                      Tempo na comunidade: {String(Math.floor(communitySecondsElapsed / 60)).padStart(2, '0')}:
                      {String(communitySecondsElapsed % 60).padStart(2, '0')}
                    </span>
                  </div>
                  <div className="text-xs font-black text-white truncate mt-1">
                    {activeCommunityZone.name} ({activeCommunityZone.complexName})
                  </div>
                  <div className="text-[10px] text-amber-200 mt-1 leading-snug font-semibold">
                    🔒 Mantenha vidros levantados • 💡 Farol baixo • 🚗 Velocidade moderada e constante • ⚠️ Evite paradas e manobras bruscas
                  </div>
                </div>
                <button
                  onClick={() => setDismissedCommunityId(activeCommunityZone.id)}
                  className="p-1.5 text-slate-400 hover:text-white rounded-lg bg-slate-900"
                  title="Ocultar aviso"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

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
        <div className="absolute top-16 left-1/2 -translate-x-1/2 w-[calc(100%-2rem)] sm:w-[410px] z-40 bg-slate-950/95 border-2 border-rose-500/70 rounded-2xl shadow-2xl overflow-hidden backdrop-blur-md animate-in fade-in slide-in-from-top-2 duration-200">
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
        <div className="absolute top-16 left-1/2 -translate-x-1/2 w-[calc(100%-2rem)] sm:w-[410px] z-40 bg-slate-950/95 border border-cyan-500/50 rounded-2xl shadow-2xl overflow-hidden backdrop-blur-md animate-in fade-in slide-in-from-top-2 duration-200">
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

        {/* Quick Declutter HUD Toggle Button */}
        <button
          onClick={() => setIsDeclutterActive(!isDeclutterActive)}
          className={`p-3 rounded-xl shadow-xl border backdrop-blur-md active:scale-95 transition-all flex items-center justify-center ${
            isDeclutterActive
              ? 'bg-amber-500 text-slate-950 border-amber-300 shadow-amber-500/25 ring-2 ring-amber-400/50'
              : 'bg-slate-900/90 hover:bg-slate-800 text-slate-300 border-slate-700/80'
          }`}
          title={isDeclutterActive ? 'Modo Limpo Ativo (Mostrando Apenas Alertas e Rotas) — Clique para Exibir Todos os Locais' : 'Despoluir Mapa (Ocultar Comércios Secundários e Limpar Pistas)'}
        >
          <Sparkles className="w-5 h-5 text-amber-300" />
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
                <span>🧭 Google Maps Ruas & Nomes (Oficial)</span>
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
                <span>🛰️ Google Satélite HD com Ruas</span>
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
                <span>🏔️ Google Relevo & Topografia</span>
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
                <span>🌙 Tô Passando Noturno Suave</span>
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

      {/* Technological Cockpit Telemetry HUD Widget (Speedometer + Regulatory Speed Limit Sign + Gyro Compass Rose + RTK Precision) */}
      <div className="absolute bottom-20 sm:bottom-4 left-3 z-20 flex flex-col gap-1.5 pointer-events-auto select-none">
        {/* Upper Telemetry Bar: Speedometer + Regulatory Speed Limit Sign + Gyro Compass */}
        <div className="flex items-center gap-2 bg-slate-950/90 backdrop-blur-xl border border-cyan-500/40 rounded-2xl p-2 shadow-2xl shadow-black/80">
          {/* Digital Speedometer Gauge */}
          <div className="flex flex-col items-center justify-center min-w-[54px] px-2 py-1 rounded-xl bg-slate-900/90 border border-slate-700/80 shadow-inner">
            <span className="text-2xl sm:text-3xl font-black font-mono leading-none tracking-tight text-white">
              {currentSpeed}
            </span>
            <span className="text-[9px] font-black uppercase text-cyan-400 tracking-wider mt-0.5">
              km/h
            </span>
          </div>

          {/* Regulatory Speed Limit Sign (Placa R-19) */}
          <div
            className="w-10 h-10 rounded-full bg-white border-[3.5px] border-red-600 flex flex-col items-center justify-center shrink-0 shadow-md ring-2 ring-red-500/30"
            title="Limite Regulamentar da Via (DETRAN / CONTRAN)"
          >
            <span className="text-slate-950 font-black text-xs leading-none">{radarSpeedLimit}</span>
            <span className="text-slate-600 font-black text-[6px] leading-none uppercase">km/h</span>
          </div>

          {/* Gyro Compass Rose with Tap-to-Lock North */}
          <button
            onClick={() => {
              if (mapRef.current) {
                mapRef.current.panTo([currentLocation.lat, currentLocation.lng], { animate: true });
              }
            }}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-slate-900/90 hover:bg-slate-800 border border-slate-700/80 text-white transition-all active:scale-95 group"
            title="Bússola Giroscópica (Clique para Centralizar ao Norte)"
          >
            <div className="relative w-6 h-6 flex items-center justify-center">
              <Compass
                className="w-5 h-5 text-cyan-400 group-hover:scale-110 transition-transform"
                style={{ transform: `rotate(${-heading}deg)` }}
              />
              <div className="absolute -top-0.5 text-[8px] font-black text-red-500">N</div>
            </div>
            <div className="flex flex-col text-left leading-none">
              <span className="text-[10px] font-black text-white font-mono">
                {getCardinalDirection(heading)}
              </span>
              <span className="text-[8px] text-slate-400 font-mono">
                {String(Math.round(heading % 360)).padStart(3, '0')}°
              </span>
            </div>
          </button>
        </div>

        {/* RTK High Precision Satellite Telemetry Pill */}
        <div className="flex items-center gap-2 bg-slate-950/85 backdrop-blur-md border border-slate-800/90 rounded-xl px-2.5 py-1 shadow-lg text-[10px] text-slate-300 w-fit">
          <div className="w-2 h-2 rounded-full bg-emerald-400 animate-ping shrink-0" />
          <span className="font-semibold">🛰️ GNSS RTK Satélites</span>
          <span className="text-cyan-300 font-bold font-mono">±{gpsAccuracy || 3}m</span>
          <span className="px-1.5 py-0.2 rounded bg-emerald-950 border border-emerald-500/40 text-emerald-400 font-black text-[8px] uppercase">
            Alta Precisão
          </span>
        </div>

        {/* 3D Mode & Night Mode Highlights */}
        <div className="flex flex-wrap items-center gap-1.5">
          {is3DMode && (
            <div className="px-2 py-0.5 rounded-lg bg-lime-400 text-slate-950 font-black text-[9px] tracking-wider uppercase shadow-md border border-lime-300">
              Modo 3D Ativo
            </div>
          )}
          {activeLayer === 'dark' && (
            <div className="px-2 py-0.5 rounded-lg bg-indigo-950/90 text-amber-300 font-black text-[9px] shadow border border-amber-400/60 flex items-center gap-1">
              <span>🌙 Noturno Ativo • 💡 Vias Escuras & 🚫 Sem Sinalização em Destaque</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
