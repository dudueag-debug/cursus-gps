import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import type { Coordinates, RouteOption, Occurrence, CultureSpot, UserProfile, MapLayerType, Place } from '../../types';
import { createVehicleDivIcon } from './VehicleMarkerIcon';
import { Crosshair, ZoomIn, ZoomOut, Eye, Layers, Compass, Box, Map as MapIcon, Globe, Navigation, MapPin, Phone, Star, X, Camera, AlertTriangle, Clock, ShieldAlert, Sparkles, Car, SlidersHorizontal } from 'lucide-react';
import { RIO_COMMUNITY_ZONES, type RioCommunityRiskZone } from '../../data/rioCommunityZones';
import { liveTrafficService, type LiveTrafficState } from '../../services/liveTrafficService';

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
  onOpenGaragem?: () => void;
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
  onOpenGaragem,
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
  const [showMoreMenu, setShowMoreMenu] = useState<boolean>(false);
  const [activeAlertIndex, setActiveAlertIndex] = useState<number>(0);
  const [activeMapCategory, setActiveMapCategory] = useState<string>('all');
  const [selectedMapPlace, setSelectedMapPlace] = useState<Place | null>(null);
  const [selectedMapOccurrence, setSelectedMapOccurrence] = useState<Occurrence | null>(null);
  const [tappedMapCoords, setTappedMapCoords] = useState<Coordinates | null>(null);

  const [currentZoom, setCurrentZoom] = useState<number>(15);
  const [isDeclutterActive, setIsDeclutterActive] = useState<boolean>(false);

  // Real-time Traffic Telemetry & Flow Overlay (Requirement 1)
  const [isTrafficActive, setIsTrafficActive] = useState<boolean>(true);
  const [trafficState, setTrafficState] = useState<LiveTrafficState>(() => liveTrafficService.getState());

  useEffect(() => {
    const unsub = liveTrafficService.subscribe(state => {
      setTrafficState(state);
    });
    return unsub;
  }, []);

  // Continuous shortest angular delta heading smoothing (Requirement 5)
  const continuousHeadingRef = useRef<number>(heading);
  useEffect(() => {
    if (user.accessibility?.reducedMotion) {
      continuousHeadingRef.current = heading;
      return;
    }
    const prev = continuousHeadingRef.current;
    const delta = ((heading - prev + 540) % 360) - 180;
    continuousHeadingRef.current = prev + delta;
  }, [heading, user.accessibility?.reducedMotion]);

  // Active Community Extreme Risk Zone & Live Traversal Timer
  const [activeCommunityZone, setActiveCommunityZone] = useState<RioCommunityRiskZone | null>(null);
  const [approachingCommunityZone, setApproachingCommunityZone] = useState<{
    zone: RioCommunityRiskZone;
    distanceMeters: number;
  } | null>(null);
  const [dismissedCommunityId, setDismissedCommunityId] = useState<string | null>(null);
  const [communitySecondsElapsed, setCommunitySecondsElapsed] = useState<number>(0);
  const lastAnnouncedCommunityIdRef = useRef<string | null>(null);
  const lastAnnouncedApproachingIdRef = useRef<string | null>(null);

  // Active Risk Zone Entry Alert & Live Timer until exiting the zone (strictly when passing nearby)
  const [activeRiskZone, setActiveRiskZone] = useState<Occurrence | null>(null);
  const [zoneSecondsElapsed, setZoneSecondsElapsed] = useState<number>(0);
  const [zoneDismissedId, setZoneDismissedId] = useState<string | null>(null);
  const lastWarnedRadarIdRef = useRef<string | null>(null);
  const lastWarnedPoliceIdRef = useRef<string | null>(null);

  // Proximity Radar / Pardal tracking (< 450m)
  const nearbyRadar = occurrences.find(o =>
    (o.category === 'radar' || o.title.toLowerCase().includes('radar') || o.title.toLowerCase().includes('pardal')) &&
    calcDistanceMeters(currentLocation, o.coordinates) <= 450
  );

  const radarDistance = nearbyRadar ? Math.round(calcDistanceMeters(currentLocation, nearbyRadar.coordinates)) : 0;
  const currentSpeed = Math.round(liveSpeedKmh && liveSpeedKmh > 0 ? liveSpeedKmh : 0);
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

  // Proximity Police Patrol or Blitz Lei Seca tracking (< 500m on road)
  const nearbyPoliceOrBlitz = occurrences.find(o =>
    (o.category === 'blitz' || o.category === 'policiamento_ativo' || o.title.toLowerCase().includes('blitz') || o.title.toLowerCase().includes('lei seca') || o.title.toLowerCase().includes('polícia')) &&
    calcDistanceMeters(currentLocation, o.coordinates) <= 500
  );
  const policeDistance = nearbyPoliceOrBlitz ? Math.round(calcDistanceMeters(currentLocation, nearbyPoliceOrBlitz.coordinates)) : 0;

  // Spoken voice advisory when entering police patrol or Lei Seca proximity
  useEffect(() => {
    if (nearbyPoliceOrBlitz && nearbyPoliceOrBlitz.id !== lastWarnedPoliceIdRef.current) {
      lastWarnedPoliceIdRef.current = nearbyPoliceOrBlitz.id;
      if (typeof window !== 'undefined' && 'speechSynthesis' in window && user.enableVoiceInstructions) {
        try {
          window.speechSynthesis.cancel();
          const dist = Math.round(calcDistanceMeters(currentLocation, nearbyPoliceOrBlitz.coordinates));
          const isLeiSeca = nearbyPoliceOrBlitz.category === 'blitz' || nearbyPoliceOrBlitz.title.toLowerCase().includes('lei seca');
          const term = isLeiSeca ? 'Operação Lei Seca' : 'Patrulhamento policial na pista';
          const msg = new SpeechSynthesisUtterance(`Atenção: ${term} reportado à frente a cerca de ${dist} metros.`);
          msg.lang = 'pt-BR';
          msg.rate = 1.05;
          window.speechSynthesis.speak(msg);
        } catch {}
      }
    }
  }, [nearbyPoliceOrBlitz?.id, user.enableVoiceInstructions]);

  // Helper to build icon for chosen classic car / model with factory colors & simple fallback (Requirement 4 & 5)
  const getSelectedVehicleIcon = (h: number) => {
    const activeClassicCarId = user.selectedClassicCarId || (typeof window !== 'undefined' ? localStorage.getItem('tp_selected_car_id') : null) || 'vw-fusca';
    const activeClassicColorId = user.selectedClassicCarColorId || (typeof window !== 'undefined' ? localStorage.getItem('tp_selected_car_color_id') : null) || undefined;
    const useSimpleMarker = Boolean(user.useSimpleVehicleMarker || user.accessibility?.reducedMotion);

    return createVehicleDivIcon(
      user.vehicleModel,
      user.vehicleColor,
      h,
      user.enableWindEffect,
      isNavigating,
      {
        classicCarId: activeClassicCarId,
        classicColorId: activeClassicColorId,
        useSimpleMarker,
        reducedMotion: Boolean(user.accessibility?.reducedMotion),
      }
    );
  };

  // Professional Ultra-Detailed Cartography (100% Google Maps official road network with live traffic tiles)
  const getLayerConfig = (layer: MapLayerType, withTraffic: boolean = isTrafficActive) => {
    switch (layer) {
      case 'satellite':
        return {
          url: withTraffic
            ? 'https://mt{s}.google.com/vt/lyrs=y,traffic&x={x}&y={y}&z={z}'
            : 'https://mt{s}.google.com/vt/lyrs=y&x={x}&y={y}&z={z}',
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
          url: withTraffic
            ? 'https://mt{s}.google.com/vt/lyrs=m,traffic&x={x}&y={y}&z={z}'
            : 'https://mt{s}.google.com/vt/lyrs=m&x={x}&y={y}&z={z}',
          subdomains: ['0', '1', '2', '3'],
          maxZoom: 21,
          className: 'leaflet-tile-subtle-dark',
          attribution: '&copy; Tô Passando Noturno Oficial',
        };
      case 'streets':
      default:
        return {
          url: withTraffic
            ? liveTrafficService.getLiveTrafficTileUrl()
            : 'https://mt{s}.google.com/vt/lyrs=m&x={x}&y={y}&z={z}',
          subdomains: ['0', '1', '2', '3'],
          maxZoom: 21,
          className: '',
          attribution: '&copy; Tô Passando Cartografia Oficial Google Maps + Tráfego Ao Vivo',
        };
    }
  };

  const createSafeTile = (layer: MapLayerType, withTraffic: boolean = isTrafficActive) => {
    const config = getLayerConfig(layer, withTraffic);
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

    const newTile = createSafeTile(newLayer, isTrafficActive).addTo(mapRef.current);
    tileLayerRef.current = newTile;
  };

  // Toggle Live Traffic Flow Layer (Requirement 1)
  const toggleTrafficOverlay = () => {
    const next = !isTrafficActive;
    setIsTrafficActive(next);
    if (!mapRef.current) return;
    if (tileLayerRef.current) {
      mapRef.current.removeLayer(tileLayerRef.current);
    }
    const newTile = createSafeTile(activeLayer, next).addTo(mapRef.current);
    tileLayerRef.current = newTile;
  };

  // Monitor Real-Time GPS Entry into Community / Extreme Risk Zones in Rio de Janeiro (~300m approaching + inside)
  useEffect(() => {
    let approachingFound: { zone: RioCommunityRiskZone; distanceMeters: number } | null = null;
    let insideFound: RioCommunityRiskZone | null = null;

    for (const zone of RIO_COMMUNITY_ZONES) {
      const dist = calcDistanceMeters(currentLocation, zone.coordinates);
      const distToBoundary = dist - zone.radiusMeters;

      if (distToBoundary <= 0) {
        insideFound = zone;
        break;
      } else if (distToBoundary <= 300) {
        if (!approachingFound || distToBoundary < approachingFound.distanceMeters) {
          approachingFound = { zone, distanceMeters: Math.round(distToBoundary) };
        }
      }
    }

    if (insideFound) {
      setApproachingCommunityZone(null);
      if (insideFound.id !== dismissedCommunityId) {
        setActiveCommunityZone(prev => {
          if (prev?.id !== insideFound!.id) {
            setCommunitySecondsElapsed(0);
          }
          return insideFound;
        });

        // Voice advisory alert when entering community area
        if (insideFound.id !== lastAnnouncedCommunityIdRef.current) {
          lastAnnouncedCommunityIdRef.current = insideFound.id;
          if (typeof window !== 'undefined' && 'speechSynthesis' in window && user.enableVoiceInstructions) {
            try {
              window.speechSynthesis.cancel();
              const msg = new SpeechSynthesisUtterance(
                `Atenção: você está passando pela comunidade ${insideFound.name}. Área de extremo risco. Mantenha os vidros fechados, faróis baixos e velocidade moderada.`
              );
              msg.lang = 'pt-BR';
              msg.rate = 1.05;
              window.speechSynthesis.speak(msg);
            } catch {}
          }
        }
      }
    } else if (approachingFound) {
      setActiveCommunityZone(null);
      setCommunitySecondsElapsed(0);

      if (approachingFound.zone.id !== dismissedCommunityId) {
        setApproachingCommunityZone(approachingFound);

        // Voice advisory warning at ~300 meters: "se não estiver na rota planejada, não adentre"
        if (approachingFound.zone.id !== lastAnnouncedApproachingIdRef.current) {
          lastAnnouncedApproachingIdRef.current = approachingFound.zone.id;
          if (typeof window !== 'undefined' && 'speechSynthesis' in window && user.enableVoiceInstructions) {
            try {
              window.speechSynthesis.cancel();
              const msg = new SpeechSynthesisUtterance(
                `Atenção motorista: aproximação de área de risco a trezentos metros em ${approachingFound.zone.name}. Se este local não estiver na sua rota planejada, não adentre e mantenha-se na via principal expressa com vidros levantados e luz baixa.`
              );
              msg.lang = 'pt-BR';
              msg.rate = 1.05;
              window.speechSynthesis.speak(msg);
            } catch {}
          }
        }
      } else {
        setApproachingCommunityZone(null);
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
      setApproachingCommunityZone(null);
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

      // Realistic 3D Classic Vehicle Marker (Minha Garagem)
      const markerIcon = getSelectedVehicleIcon(continuousHeadingRef.current);
      const vMarker = L.marker([currentLocation.lat, currentLocation.lng], {
        icon: markerIcon,
        zIndexOffset: 1000,
      }).addTo(map);
      vMarker.on('click', () => {
        if (onOpenGaragem) onOpenGaragem();
      });
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

    const newIcon = getSelectedVehicleIcon(continuousHeadingRef.current);
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
  }, [
    currentLocation,
    heading,
    user.vehicleModel,
    user.vehicleColor,
    user.selectedClassicCarId,
    user.selectedClassicCarColorId,
    user.useSimpleVehicleMarker,
    user.enableWindEffect,
    user.accessibility?.reducedMotion,
    isNavigating,
    gpsAccuracy
  ]);

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

      if (occ.category === 'blitz' || occ.title.toLowerCase().includes('blitz') || occ.title.toLowerCase().includes('lei seca')) {
        badgeBg = '#0284c7';
        badgeEmoji = '🛑';
        shortLabel = 'Operação Lei Seca';
      } else if (occ.category === 'policiamento_ativo' || occ.title.toLowerCase().includes('viatura') || occ.title.toLowerCase().includes('polícia')) {
        badgeBg = '#1d4ed8';
        badgeEmoji = '🚓';
        shortLabel = 'Policiamento na Pista';
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

  // Render Active Community Safety Perimeter ONLY when approaching (~300m) or passing through (leaves cartography 100% clean)
  useEffect(() => {
    if (!mapRef.current || !communityLayerGroupRef.current) return;
    const group = communityLayerGroupRef.current;
    group.clearLayers();

    const targetZone = activeCommunityZone || approachingCommunityZone?.zone;
    if (!targetZone) return;

    // Safety perimeter circle only for the community zone being approached (~300m) or traversed
    const circle = L.circle([targetZone.coordinates.lat, targetZone.coordinates.lng], {
      radius: targetZone.radiusMeters,
      color: '#dc2626',
      weight: 3,
      dashArray: '6, 6',
      opacity: 0.95,
      fillColor: '#991b1b',
      fillOpacity: 0.18,
    });

    const labelText = activeCommunityZone 
      ? '🚨 ÁREA DE RISCO ATIVA' 
      : `⚠️ RISCO A ~${approachingCommunityZone?.distanceMeters || 300}M - NÃO ADENTRE`;

    const iconHtml = `
      <div class="relative flex items-center justify-center cursor-pointer group">
        <div class="px-2.5 py-1 rounded-full bg-red-600 border-2 border-white text-white font-black text-[9.5px] shadow-2xl flex items-center gap-1.5 animate-pulse whitespace-nowrap">
          <span>🛑</span>
          <span>${labelText}</span>
        </div>
      </div>
    `;

    const warningBadgeIcon = L.divIcon({
      className: 'tp-community-danger-marker',
      html: iconHtml,
      iconSize: [160, 28],
      iconAnchor: [80, 14],
    });

    const marker = L.marker([targetZone.coordinates.lat, targetZone.coordinates.lng], {
      icon: warningBadgeIcon,
      zIndexOffset: 650,
    });

    marker.bindTooltip(`
      <div class="text-xs p-1.5 font-semibold text-slate-900 max-w-[240px]">
        <div class="font-black text-red-600 flex items-center gap-1">🚨 ${targetZone.name}</div>
        <div class="text-[10px] text-slate-700 font-bold mt-0.5">${targetZone.complexName} (${targetZone.neighborhood})</div>
        <div class="text-[9.5px] text-amber-800 font-bold mt-1">🛑 ${targetZone.advice}</div>
      </div>
    `, { direction: 'top', offset: [0, -12] });

    group.addLayer(circle);
    group.addLayer(marker);
  }, [activeCommunityZone, approachingCommunityZone]);

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

  // Requirement 1 & 2: Prioritização de alertas (1 card grande prioritário por vez + chips compactos para outros simultâneos)
  const renderPrioritizedAlertCard = () => {
    interface PrioritizedAlertItem {
      id: string;
      type: string;
      priority: number;
      icon: React.ReactNode;
      badge: string;
      badgeClass: string;
      title: string;
      description: string;
      distanceText?: string;
      compactLabel: string;
      emoji: string;
      actionButton?: {
        label: string;
        onClick: () => void;
      };
      onDismiss?: () => void;
    }

    const alertItems: PrioritizedAlertItem[] = [];

    // 1. Extreme Risk: Active Community Zone Traversal
    if (activeCommunityZone) {
      const mins = String(Math.floor(communitySecondsElapsed / 60)).padStart(2, '0');
      const secs = String(communitySecondsElapsed % 60).padStart(2, '0');
      alertItems.push({
        id: `comm-active-${activeCommunityZone.id}`,
        type: 'community_active',
        priority: 1,
        emoji: '🚨',
        compactLabel: `🚨 ${activeCommunityZone.name}`,
        icon: (
          <div className="w-10 h-10 rounded-2xl bg-red-600 border-2 border-white flex items-center justify-center text-white shrink-0 shadow-lg animate-pulse">
            <ShieldAlert className="w-5 h-5 stroke-[2.5]" />
          </div>
        ),
        badge: 'ÁREA DE COMUNIDADE • EXTREMO RISCO',
        badgeClass: 'bg-red-600 text-white',
        title: `${activeCommunityZone.name} (${activeCommunityZone.complexName})`,
        description: '🔒 Mantenha vidros levantados • 💡 Farol baixo • Não pare na via',
        distanceText: `Tempo no local: ${mins}:${secs}`,
        onDismiss: () => setDismissedCommunityId(activeCommunityZone.id),
      });
    }

    // 2. Approaching Community Risk Zone (< 350m)
    if (approachingCommunityZone && !activeCommunityZone && approachingCommunityZone.zone.id !== dismissedCommunityId) {
      alertItems.push({
        id: `comm-appr-${approachingCommunityZone.zone.id}`,
        type: 'community_approaching',
        priority: 2,
        emoji: '⚠️',
        compactLabel: `⚠️ Risco a ~${approachingCommunityZone.distanceMeters}m`,
        icon: (
          <div className="w-10 h-10 rounded-2xl bg-amber-500 border-2 border-white flex items-center justify-center text-slate-950 shrink-0 shadow-lg animate-bounce">
            <ShieldAlert className="w-5 h-5 text-slate-950 stroke-[2.5]" />
          </div>
        ),
        badge: `APROXIMAÇÃO DE COMUNIDADE • A ~${approachingCommunityZone.distanceMeters}M`,
        badgeClass: 'bg-amber-500 text-slate-950 font-black',
        title: `${approachingCommunityZone.zone.name} (${approachingCommunityZone.zone.complexName})`,
        description: '🛑 ATENÇÃO: NÃO ADENTRE SE NÃO FOR SEU DESTINO! Permaneça na via principal.',
        distanceText: `A ~${approachingCommunityZone.distanceMeters}m`,
        onDismiss: () => setDismissedCommunityId(approachingCommunityZone.zone.id),
      });
    }

    // 3. Imminent Radar with Over-Speed (Critical)
    if (nearbyRadar && isOverSpeed) {
      alertItems.push({
        id: `radar-over-${nearbyRadar.id}`,
        type: 'radar_overspeed',
        priority: 3,
        emoji: '📸',
        compactLabel: `📸 ${radarSpeedLimit}km/h (Alerta)`,
        icon: (
          <div className="w-11 h-11 rounded-full bg-white border-4 border-red-600 flex flex-col items-center justify-center shrink-0 shadow-xl animate-bounce ring-4 ring-red-500">
            <span className="text-slate-950 font-black text-sm leading-none">{radarSpeedLimit}</span>
            <span className="text-slate-800 font-bold text-[7px] leading-none uppercase">km/h</span>
          </div>
        ),
        badge: '⚠️ REDUZA A VELOCIDADE! ACIMA DO LIMITE',
        badgeClass: 'bg-red-600 text-white animate-pulse',
        title: `${nearbyRadar.title}`,
        description: `Você está a ${currentSpeed} km/h (Limite ${radarSpeedLimit} km/h). Radar a ${radarDistance}m à frente!`,
        distanceText: `A ${radarDistance}m`,
        actionButton: {
          label: 'Ver Radar',
          onClick: () => {
            setSelectedMapOccurrence(nearbyRadar);
            setSelectedMapPlace(null);
          },
        },
      });
    }

    // 4. Passing through Demarcated Incident / Risk Area
    if (activeRiskZone && activeRiskZone.id !== zoneDismissedId) {
      const mins = String(Math.floor(zoneSecondsElapsed / 60)).padStart(2, '0');
      const secs = String(zoneSecondsElapsed % 60).padStart(2, '0');
      alertItems.push({
        id: `zone-pass-${activeRiskZone.id}`,
        type: 'risk_zone',
        priority: 4,
        emoji: '⚠️',
        compactLabel: `⚠️ ${activeRiskZone.title}`,
        icon: (
          <div
            className="w-10 h-10 rounded-2xl flex items-center justify-center text-white shrink-0 shadow-lg animate-pulse"
            style={{ backgroundColor: activeRiskZone.zoneColor || '#dc2626' }}
          >
            <AlertTriangle className="w-5 h-5 text-white" />
          </div>
        ),
        badge: `TRANSITANDO EM ÁREA DE ATENÇÃO (${activeRiskZone.riskRadiusMeters || 200}M)`,
        badgeClass: 'bg-rose-700 text-white',
        title: `${activeRiskZone.title}`,
        description: `Tempo no local: ${mins}:${secs} • ${activeRiskZone.description || 'Atenção redobrada na via'}`,
        distanceText: `${mins}:${secs}`,
        onDismiss: () => setZoneDismissedId(activeRiskZone.id),
      });
    }

    // 5. Approaching Police Patrol or Lei Seca (< 500m)
    if (nearbyPoliceOrBlitz) {
      const isLeiSeca = nearbyPoliceOrBlitz.category === 'blitz' || nearbyPoliceOrBlitz.title.toLowerCase().includes('lei seca');
      alertItems.push({
        id: `police-${nearbyPoliceOrBlitz.id}`,
        type: 'police_blitz',
        priority: 5,
        emoji: isLeiSeca ? '🛑' : '🚓',
        compactLabel: isLeiSeca ? `🛑 Blitz a ~${policeDistance}m` : `🚓 Polícia a ~${policeDistance}m`,
        icon: (
          <div className="w-10 h-10 rounded-2xl bg-indigo-600 border-2 border-indigo-400 flex items-center justify-center text-white shrink-0 shadow-lg">
            <span className="text-xl leading-none">{isLeiSeca ? '🛑' : '🚓'}</span>
          </div>
        ),
        badge: isLeiSeca ? 'OPERAÇÃO LEI SECA • FISCALIZAÇÃO' : 'PATRULHAMENTO POLICIAL NA PISTA',
        badgeClass: isLeiSeca ? 'bg-amber-500 text-slate-950 font-black' : 'bg-indigo-600 text-white',
        title: `${nearbyPoliceOrBlitz.title}`,
        description: `Localização: ${nearbyPoliceOrBlitz.locationName || 'Trecho monitorado'} • ${policeDistance}m à frente`,
        distanceText: `A ~${policeDistance}m`,
        actionButton: {
          label: 'Ver Detalhes',
          onClick: () => {
            setSelectedMapOccurrence(nearbyPoliceOrBlitz);
            setSelectedMapPlace(null);
          },
        },
      });
    }

    // 6. Normal Radar (Speed Compatible)
    if (nearbyRadar && !isOverSpeed) {
      alertItems.push({
        id: `radar-norm-${nearbyRadar.id}`,
        type: 'radar_normal',
        priority: 6,
        emoji: '📸',
        compactLabel: `📸 Radar ${radarSpeedLimit}km/h`,
        icon: (
          <div className="w-10 h-10 rounded-full bg-white border-4 border-red-600 flex flex-col items-center justify-center shrink-0 shadow-lg ring-2 ring-red-500/40">
            <span className="text-slate-950 font-black text-xs leading-none">{radarSpeedLimit}</span>
            <span className="text-slate-700 font-bold text-[6.5px] leading-none uppercase">km/h</span>
          </div>
        ),
        badge: `RADAR À FRENTE • LIMITE ${radarSpeedLimit} KM/H`,
        badgeClass: 'bg-slate-800 text-red-400 border border-red-500/40',
        title: `${nearbyRadar.title}`,
        description: `✓ Velocidade (${currentSpeed} km/h) compatível • ${nearbyRadar.locationName || 'Via monitorada'}`,
        distanceText: `A ${radarDistance}m`,
        actionButton: {
          label: 'Ver Radar',
          onClick: () => {
            setSelectedMapOccurrence(nearbyRadar);
            setSelectedMapPlace(null);
          },
        },
      });
    }

    if (alertItems.length === 0) return null;

    // Sort by priority (1 to 6)
    alertItems.sort((a, b) => a.priority - b.priority);
    const activeAlert = alertItems[activeAlertIndex] || alertItems[0];

    return (
      <div className="pointer-events-auto max-w-xl w-full mx-auto flex flex-col gap-1.5 animate-in slide-in-from-top-3 duration-200">
        {/* 1. CARD PRINCIPAL GRANDE E PRIORITÁRIO */}
        <div className="bg-slate-950/95 border-2 border-slate-700/80 rounded-2xl p-2.5 sm:p-3 shadow-2xl backdrop-blur-xl flex items-center justify-between gap-3 text-white">
          {/* Left Icon */}
          {activeAlert.icon}

          {/* Center Content with High Readability */}
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span className={`px-2 py-0.5 rounded-md font-black text-xs uppercase tracking-wider shadow ${activeAlert.badgeClass}`}>
                {activeAlert.badge}
              </span>
              {activeAlert.distanceText && (
                <span className="text-xs sm:text-sm font-black text-amber-300 font-mono">
                  {activeAlert.distanceText}
                </span>
              )}
            </div>

            <div className="text-sm sm:text-base font-black text-white mt-1 leading-snug line-clamp-1">
              {activeAlert.title}
            </div>

            <div className="text-xs sm:text-sm font-semibold text-slate-200 mt-0.5 leading-tight line-clamp-1">
              {activeAlert.description}
            </div>
          </div>

          {/* Right Actions */}
          <div className="flex items-center gap-1.5 shrink-0">
            {activeAlert.actionButton && (
              <button
                onClick={activeAlert.actionButton.onClick}
                className="px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-black text-xs shadow transition-all cursor-pointer"
              >
                {activeAlert.actionButton.label}
              </button>
            )}

            {activeAlert.onDismiss && (
              <button
                onClick={activeAlert.onDismiss}
                className="p-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white transition-colors cursor-pointer"
                title="Ocultar alerta"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* 2. PÍLULAS COMPACTAS (Para os demais alertas simultâneos) */}
        {alertItems.length > 1 && (
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pointer-events-auto py-0.5">
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider shrink-0 pl-1">
              Outros alertas ({alertItems.length - 1}):
            </span>
            {alertItems.map((item, idx) => {
              if (item.id === activeAlert.id) return null;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveAlertIndex(idx)}
                  className="shrink-0 flex items-center gap-1 px-2.5 py-1 rounded-full bg-slate-900/95 hover:bg-slate-850 border border-slate-700/80 text-xs font-bold text-slate-200 hover:text-white shadow-md active:scale-95 transition-all"
                >
                  <span>{item.emoji}</span>
                  <span>{item.compactLabel}</span>
                  {item.distanceText && (
                    <span className="text-amber-300 font-mono text-[11px] font-black">
                      • {item.distanceText}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        )}
      </div>
    );
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
              <span>Tô Passando</span>
            </button>

            {onOpenQuickSignals && (
              <button
                onClick={onOpenQuickSignals}
                className="shrink-0 flex items-center gap-1 px-2.5 py-1.5 rounded-full bg-red-600/90 hover:bg-red-500 text-white font-black text-[11px] shadow-xl border border-red-400 active:scale-95 transition-all"
              >
                <span>🚨 Sinalizar</span>
              </button>
            )}

            {onOpenOccurrences && (
              <button
                onClick={onOpenOccurrences}
                className="shrink-0 flex items-center gap-1 px-2.5 py-1.5 rounded-full bg-slate-950/90 hover:bg-slate-900 text-amber-300 font-black text-[11px] shadow-xl border border-amber-500/40 active:scale-95 transition-all"
              >
                <span>👮 Ocorrências ({occurrences.length})</span>
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

          {/* Prioritized Single Alert Card + Compact Secondary Pills (Requirement 1 & 2: Reduzir Poluição e Priorizar Alertas) */}
          {renderPrioritizedAlertCard()}

          {/* Quick Prompt when User Taps a Point on the Map */}
          {tappedMapCoords && (
            <div className="pointer-events-auto max-w-md bg-slate-950/98 border border-lime-400/80 rounded-2xl p-2.5 shadow-2xl flex items-center justify-between gap-2.5 backdrop-blur-md">
              <div className="text-[10px] text-slate-200 min-w-0">
                <span className="font-black text-lime-400 flex items-center gap-1">
                  <span>📍</span>
                  <span>Ponto Demarcado no Mapa</span>
                </span>
                <span className="font-mono text-slate-300 text-[9.5px] block truncate">
                  {tappedMapCoords.lat.toFixed(5)}, {tappedMapCoords.lng.toFixed(5)}
                </span>
              </div>
              <div className="flex items-center gap-1.5 shrink-0">
                <button
                  onClick={() => {
                    if (onSelectPlace) {
                      onSelectPlace({
                        id: `pinned-${Date.now()}`,
                        name: 'Ponto Demarcado no Mapa',
                        category: 'comercio_servicos',
                        subCategory: 'Destino Marcado',
                        address: `${tappedMapCoords.lat.toFixed(5)}, ${tappedMapCoords.lng.toFixed(5)}`,
                        coordinates: tappedMapCoords,
                        source: 'community',
                        dataOrigin: 'reported',
                      });
                    }
                    setTappedMapCoords(null);
                  }}
                  className="px-2.5 py-1.5 rounded-xl bg-lime-400 hover:bg-lime-300 text-slate-950 font-black text-[10px] flex items-center gap-1 shadow transition-all active:scale-95"
                >
                  <Navigation className="w-3 h-3" />
                  <span>Traçar Rota</span>
                </button>
                {onOpenPhotoIncident && (
                  <button
                    onClick={() => onOpenPhotoIncident(tappedMapCoords)}
                    className="px-2.5 py-1.5 rounded-xl bg-gradient-to-r from-rose-600 to-amber-500 hover:from-rose-500 hover:to-amber-400 text-white font-black text-[10px] flex items-center gap-1 shadow transition-all active:scale-95"
                  >
                    <Camera className="w-3 h-3" />
                    <span>Foto / Relato</span>
                  </button>
                )}
                <button
                  onClick={() => setTappedMapCoords(null)}
                  className="p-1 text-slate-400 hover:text-white rounded-lg bg-slate-900"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Active Navigation Floating Critical Alert Card (Single Card, placed cleanly below TurnByTurn maneuver card) */}
      {isNavigating && (
        <div className="absolute top-28 sm:top-24 inset-x-0 z-30 flex flex-col items-center gap-1.5 pointer-events-none px-2 sm:px-14">
          {renderPrioritizedAlertCard()}
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

      {/* Google Maps & Waze Style Floating Place Chip / Sheet with Real Photo & Quick Actions */}
      {selectedMapPlace && !isNavigating && (
        <div className="absolute bottom-4 sm:top-16 left-1/2 -translate-x-1/2 w-[calc(100%-1.5rem)] sm:w-[420px] max-h-[85vh] overflow-y-auto z-40 bg-slate-950/98 border border-cyan-500/50 rounded-2xl shadow-2xl overflow-hidden backdrop-blur-md animate-in fade-in slide-in-from-bottom-2 sm:slide-in-from-top-2 duration-200">
          <div className="relative h-36 w-full bg-slate-900 overflow-hidden">
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
              className="absolute top-2 right-2 p-1.5 rounded-full bg-slate-950/80 hover:bg-slate-900 text-white border border-slate-700 shadow"
              title="Fechar cartão"
            >
              <X className="w-4 h-4" />
            </button>

            {/* Badges: Photo Verified + Star Rating Pill */}
            <div className="absolute top-2 left-2 flex items-center gap-1.5 flex-wrap">
              <span className="px-2 py-0.5 rounded-lg bg-slate-950/90 border border-cyan-400/50 text-[10px] font-black text-cyan-300 shadow">
                📸 Foto Real
              </span>
              {selectedMapPlace.rating !== undefined && (
                <div className="px-2 py-0.5 rounded-lg bg-slate-950/90 border border-amber-500/40 flex items-center gap-1 text-[11px] font-black text-amber-400 shadow-lg">
                  <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                  <span>{selectedMapPlace.rating.toFixed(1)}</span>
                  {selectedMapPlace.ratingCount !== undefined && (
                    <span className="text-[9px] text-slate-300 font-semibold">
                      ({selectedMapPlace.ratingCount.toLocaleString('pt-BR')})
                    </span>
                  )}
                </div>
              )}
            </div>

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
            <div className="text-[11px] text-slate-300 flex items-start justify-between gap-1.5">
              <div className="flex items-start gap-1.5 min-w-0">
                <MapPin className="w-3.5 h-3.5 text-cyan-400 shrink-0 mt-0.5" />
                <span>
                  {selectedMapPlace.address}
                  {selectedMapPlace.neighborhood ? ` — ${selectedMapPlace.neighborhood}` : ''}
                </span>
              </div>
              <button
                onClick={() => {
                  if (typeof navigator !== 'undefined' && navigator.clipboard) {
                    navigator.clipboard.writeText(`${selectedMapPlace.name}, ${selectedMapPlace.address}`);
                    alert('Endereço copiado para a área de transferência!');
                  }
                }}
                className="shrink-0 text-[10px] text-cyan-400 hover:text-cyan-300 font-bold"
                title="Copiar endereço"
              >
                Copiar
              </button>
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
                <span>Traçar Rota no Tô Passando</span>
              </button>
            </div>

            <div className="flex items-center justify-between pt-1 border-t border-slate-800/80 text-[10px] text-slate-400">
              {selectedMapPlace.phone ? (
                <a
                  href={`tel:${selectedMapPlace.phone.replace(/[^\d+]/g, '')}`}
                  className="text-emerald-400 hover:underline font-bold flex items-center gap-1"
                >
                  <Phone className="w-3 h-3" />
                  <span>Ligar: {selectedMapPlace.phone}</span>
                </a>
              ) : (
                <span className="text-slate-500">Local Verificado</span>
              )}
              {onOpenPlacesPanel && (
                <button
                  onClick={onOpenPlacesPanel}
                  className="text-cyan-400 hover:underline font-bold"
                >
                  Ver todos os locais →
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Floating Controls HUD (Clean 3-Button Stack: Centralizar, Trânsito e Menu "Mais") */}
      <div className="absolute top-14 right-3 z-30 flex flex-col gap-2">
        {/* 1. Recenter Button (Essencial) */}
        <button
          onClick={handleRecenter}
          className="p-3 bg-slate-900/95 hover:bg-slate-800 text-lime-400 rounded-2xl shadow-xl border border-slate-700/80 backdrop-blur-md active:scale-95 transition-all group cursor-pointer"
          title="Centralizar no Meu Veículo (GPS)"
        >
          <Crosshair className="w-5 h-5 group-hover:rotate-45 transition-transform" />
        </button>

        {/* 2. Live Traffic Overlay Toggle (Essencial) */}
        <button
          onClick={toggleTrafficOverlay}
          className={`p-3 rounded-2xl shadow-xl border backdrop-blur-md active:scale-95 transition-all flex items-center justify-center cursor-pointer ${
            isTrafficActive
              ? 'bg-emerald-500 text-slate-950 border-emerald-300 shadow-emerald-500/25 ring-2 ring-emerald-400/50'
              : 'bg-slate-900/95 hover:bg-slate-800 text-slate-400 border-slate-700/80'
          }`}
          title={isTrafficActive ? 'Tráfego Ao Vivo Ativo — Clique para Ocultar' : 'Ativar Tráfego Ao Vivo (Google Flow RJ)'}
        >
          <span className="text-base leading-none select-none">🚦</span>
        </button>

        {/* 3. Menu "Mais..." (Agrupa todos os controles secundários liberando espaço no mapa) */}
        <div className="relative">
          <button
            onClick={() => setShowMoreMenu(!showMoreMenu)}
            className={`p-3 rounded-2xl shadow-xl border backdrop-blur-md active:scale-95 transition-all flex flex-col items-center justify-center gap-0.5 cursor-pointer ${
              showMoreMenu
                ? 'bg-cyan-500 text-slate-950 border-cyan-300 shadow-cyan-500/30'
                : 'bg-slate-900/95 hover:bg-slate-800 text-cyan-400 border-slate-700/80'
            }`}
            title="Mais Opções e Controles do Mapa"
          >
            <SlidersHorizontal className="w-5 h-5" />
            <span className="text-[8px] font-black uppercase tracking-tight">Mais</span>
          </button>

          {/* Popover "Mais" Flutuante */}
          {showMoreMenu && (
            <div className="absolute right-14 top-0 bg-slate-950/98 border border-slate-700 rounded-2xl shadow-2xl p-2.5 w-64 flex flex-col gap-1.5 backdrop-blur-xl z-50 animate-in fade-in zoom-in-95 duration-150 text-white">
              <div className="flex items-center justify-between pb-1.5 border-b border-slate-800 px-1">
                <span className="text-xs font-black uppercase tracking-wider text-cyan-400">
                  Mais Opções do Mapa
                </span>
                <button
                  onClick={() => setShowMoreMenu(false)}
                  className="p-1 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Minha Garagem Clássica */}
              {onOpenGaragem && (
                <button
                  onClick={() => {
                    onOpenGaragem();
                    setShowMoreMenu(false);
                  }}
                  className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-bold text-amber-300 bg-amber-950/30 hover:bg-amber-900/40 border border-amber-500/30 transition-all text-left cursor-pointer"
                >
                  <Car className="w-4 h-4 text-amber-400 shrink-0" />
                  <span>🚗 Minha Garagem Clássica</span>
                </button>
              )}

              {/* Modo Noturno */}
              <button
                onClick={() => {
                  switchLayer(activeLayer === 'dark' ? 'streets' : 'dark', true);
                  setShowMoreMenu(false);
                }}
                className={`flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-bold transition-all text-left cursor-pointer ${
                  activeLayer === 'dark'
                    ? 'bg-indigo-600 text-white shadow-md'
                    : 'text-slate-300 hover:bg-slate-900'
                }`}
              >
                <span className="text-sm">🌙</span>
                <span>{activeLayer === 'dark' ? 'Modo Noturno (Ativo)' : 'Ativar Modo Noturno'}</span>
              </button>

              {/* Cockpit 3D */}
              <button
                onClick={() => {
                  setIs3DMode(!is3DMode);
                  setShowMoreMenu(false);
                }}
                className={`flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-bold transition-all text-left cursor-pointer ${
                  is3DMode
                    ? 'bg-lime-400 text-slate-950 shadow-md font-black'
                    : 'text-slate-300 hover:bg-slate-900'
                }`}
              >
                <Box className="w-4 h-4 text-cyan-400 shrink-0" />
                <span>{is3DMode ? 'Visão Cockpit 3D (Ativa)' : 'Ativar Visão Cockpit 3D'}</span>
              </button>

              {/* Despoluir Mapa */}
              <button
                onClick={() => {
                  setIsDeclutterActive(!isDeclutterActive);
                  setShowMoreMenu(false);
                }}
                className={`flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-bold transition-all text-left cursor-pointer ${
                  isDeclutterActive
                    ? 'bg-amber-500 text-slate-950 shadow-md font-black'
                    : 'text-slate-300 hover:bg-slate-900'
                }`}
              >
                <Sparkles className="w-4 h-4 text-amber-300 shrink-0" />
                <span>{isDeclutterActive ? '✨ Mapa Despoluído (Ativo)' : '🧹 Despoluir Mapa'}</span>
              </button>

              {/* Marcar Local com Foto */}
              {onOpenPhotoIncident && (
                <button
                  onClick={() => {
                    onOpenPhotoIncident(tappedMapCoords || currentLocation);
                    setShowMoreMenu(false);
                  }}
                  className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-bold text-rose-300 bg-rose-950/30 hover:bg-rose-900/40 border border-rose-500/30 transition-all text-left cursor-pointer"
                >
                  <Camera className="w-4 h-4 text-rose-400 shrink-0" />
                  <span>📸 Marcar Ocorrência / Foto</span>
                </button>
              )}

              {/* Ver Rota Completa (se rota ativa) */}
              {selectedRoute && (
                <button
                  onClick={() => {
                    handleFitRoute();
                    setShowMoreMenu(false);
                  }}
                  className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-bold text-cyan-300 hover:bg-slate-900 transition-all text-left cursor-pointer"
                >
                  <Eye className="w-4 h-4 text-cyan-400 shrink-0" />
                  <span>👁️ Ver Rota Completa</span>
                </button>
              )}

              {/* Seletor de Camadas Cartográficas */}
              <div className="pt-1.5 border-t border-slate-800">
                <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 px-1 pb-1 block">
                  Camada Base
                </span>
                <div className="grid grid-cols-2 gap-1 text-[11px]">
                  <button
                    onClick={() => { switchLayer('streets', true); setShowMoreMenu(false); }}
                    className={`p-1.5 rounded-lg font-bold flex items-center justify-center gap-1 cursor-pointer ${
                      activeLayer === 'streets' ? 'bg-blue-600 text-white' : 'bg-slate-900 text-slate-300 hover:bg-slate-800'
                    }`}
                  >
                    <span>🧭 Ruas</span>
                  </button>
                  <button
                    onClick={() => { switchLayer('satellite', true); setShowMoreMenu(false); }}
                    className={`p-1.5 rounded-lg font-bold flex items-center justify-center gap-1 cursor-pointer ${
                      activeLayer === 'satellite' ? 'bg-blue-600 text-white' : 'bg-slate-900 text-slate-300 hover:bg-slate-800'
                    }`}
                  >
                    <span>🛰️ Satélite</span>
                  </button>
                </div>
              </div>

              {/* Controles de Zoom */}
              <div className="flex items-center justify-between pt-1.5 border-t border-slate-800 px-1">
                <span className="text-[10px] text-slate-400 uppercase font-bold">Zoom</span>
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={handleZoomIn}
                    className="p-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-700 cursor-pointer"
                    title="Aproximar Zoom"
                  >
                    <ZoomIn className="w-4 h-4" />
                  </button>
                  <button
                    onClick={handleZoomOut}
                    className="p-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-700 cursor-pointer"
                    title="Afastar Zoom"
                  >
                    <ZoomOut className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Technological Cockpit Telemetry HUD Widget (Speedometer + Regulatory Speed Limit Sign + Gyro Compass Rose + RTK Precision) */}
      {!isNavigating && (
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

        {/* Live Traffic Flow Telemetry Status Pill (Requirement 1) */}
        <div
          onClick={toggleTrafficOverlay}
          className={`flex items-center gap-2 bg-slate-950/85 backdrop-blur-md border rounded-xl px-2.5 py-1 shadow-lg text-[10px] w-fit cursor-pointer transition-all active:scale-95 ${
            trafficState.status === 'online'
              ? 'border-emerald-500/40 text-emerald-200 hover:border-emerald-400'
              : trafficState.status === 'cached'
              ? 'border-amber-500/40 text-amber-200 hover:border-amber-400'
              : 'border-rose-500/40 text-rose-200 hover:border-rose-400'
          }`}
          title={`${trafficState.message} (Clique para alternar camada de fluxo no mapa)`}
        >
          <div className={`w-2 h-2 rounded-full shrink-0 ${
            trafficState.status === 'online' ? 'bg-emerald-400 animate-pulse' :
            trafficState.status === 'cached' ? 'bg-amber-400' : 'bg-rose-500'
          }`} />
          <span className="font-semibold">🚦 Trânsito RJ:</span>
          <span className="font-black uppercase text-[9px]">
            {trafficState.status === 'online' ? 'Ao Vivo' : trafficState.status === 'cached' ? 'Em Cache' : 'Offline'}
          </span>
          {trafficState.lastUpdated && (
            <span className="text-slate-400 font-mono text-[9px]">({trafficState.lastUpdated})</span>
          )}
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
      )}
    </div>
  );
};
