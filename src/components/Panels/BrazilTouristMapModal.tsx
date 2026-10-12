import React, { useState, useEffect, useRef } from 'react';
import L from 'leaflet';
import { 
  X, 
  MapPin, 
  ShoppingBag, 
  Landmark, 
  Store, 
  Navigation, 
  Search, 
  Filter, 
  Star, 
  Compass, 
  ChevronRight,
  Maximize2,
  Minimize2,
  Sparkles
} from 'lucide-react';
import { 
  BRAZIL_TOURIST_CATALOG, 
  type BrazilTouristSpot, 
  type BrazilTouristCategory, 
  type BrazilRegion 
} from '../../data/brazilTouristCatalog';
import type { Coordinates } from '../../types';

interface BrazilTouristMapModalProps {
  isOpen: boolean;
  onClose: () => void;
  userCoords: Coordinates;
  onNavigateToSpot: (spot: BrazilTouristSpot) => void;
}

export const BrazilTouristMapModal: React.FC<BrazilTouristMapModalProps> = ({
  isOpen,
  onClose,
  userCoords,
  onNavigateToSpot,
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const markersLayerRef = useRef<L.LayerGroup | null>(null);

  const [selectedSpot, setSelectedSpot] = useState<BrazilTouristSpot | null>(null);
  const [activeCategory, setActiveCategory] = useState<BrazilTouristCategory | 'todas'>('todas');
  const [activeRegion, setActiveRegion] = useState<BrazilRegion | 'todas'>('todas');
  const [searchQuery, setSearchQuery] = useState('');
  const [isListView, setIsListView] = useState(false);

  // Filtered Spots
  const filteredSpots = BRAZIL_TOURIST_CATALOG.filter(spot => {
    const matchesCat = activeCategory === 'todas' || spot.category === activeCategory;
    const matchesReg = activeRegion === 'todas' || spot.region === activeRegion;
    const matchesSearch = searchQuery === '' || 
      spot.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      spot.city.toLowerCase().includes(searchQuery.toLowerCase()) ||
      spot.state.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCat && matchesReg && matchesSearch;
  });

  // Color Palette as requested:
  // Mercados → terracota (#C85A32)
  // Pontos turísticos → azul petróleo (#0E5C68)
  // Artesanato → mostarda (#D99B26)
  const getCategoryTheme = (category: BrazilTouristCategory) => {
    switch (category) {
      case 'mercado':
        return {
          bg: '#C85A32',
          text: 'text-[#C85A32]',
          label: 'Mercado & Feira',
          iconName: 'basket',
          badgeBg: 'bg-[#C85A32]/10 text-[#C85A32] border-[#C85A32]/30',
        };
      case 'ponto_turistico':
        return {
          bg: '#0E5C68',
          text: 'text-[#0E5C68]',
          label: 'Ponto Turístico',
          iconName: 'pin',
          badgeBg: 'bg-[#0E5C68]/10 text-[#0E5C68] border-[#0E5C68]/30',
        };
      case 'artesanato':
      default:
        return {
          bg: '#D99B26',
          text: 'text-[#D99B26]',
          label: 'Artesanato Local',
          iconName: 'store',
          badgeBg: 'bg-[#D99B26]/10 text-[#D99B26] border-[#D99B26]/30',
        };
    }
  };

  const createCleanDivIcon = (spot: BrazilTouristSpot, isSelected: boolean) => {
    const theme = getCategoryTheme(spot.category);
    const size = isSelected ? 36 : 28;

    let svgIconContent = '';
    if (spot.category === 'mercado') {
      // Basket / cesta icon in terracotta
      svgIconContent = `<svg class="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.2" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"/></svg>`;
    } else if (spot.category === 'ponto_turistico') {
      // Pin icon in petrol blue
      svgIconContent = `<svg class="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/></svg>`;
    } else {
      // Store / artisan icon in mustard
      svgIconContent = `<svg class="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.2" d="M3 3h18v4l-2 5v7a2 2 0 01-2 2H7a2 2 0 01-2-2v-7l-2-5V3zM3 7h18"/></svg>`;
    }

    const html = `
      <div class="relative flex flex-col items-center group cursor-pointer" style="transform: translate(-50%, -50%);">
        <div class="flex items-center justify-center rounded-full shadow-md transition-all duration-200 ${isSelected ? 'ring-4 ring-offset-2 ring-[#0E5C68] scale-110' : 'hover:scale-110'}"
             style="background-color: ${theme.bg}; width: ${size}px; height: ${size}px; box-shadow: 0 4px 10px rgba(0,0,0,0.18);">
          ${svgIconContent}
        </div>
        <div class="mt-1 px-2 py-0.5 rounded-md bg-white/95 text-slate-800 text-[10px] font-bold shadow-sm whitespace-nowrap border border-slate-200/80 pointer-events-none transition-opacity">
          ${spot.shortName}
        </div>
      </div>
    `;

    return L.divIcon({
      className: 'clean-google-tourist-marker',
      html,
      iconSize: [size, size],
      iconAnchor: [0, 0],
    });
  };

  // Initialize and update Leaflet Map
  useEffect(() => {
    if (!isOpen || !mapContainerRef.current) return;

    if (!mapRef.current) {
      if ((mapContainerRef.current as any)._leaflet_id) {
        delete (mapContainerRef.current as any)._leaflet_id;
      }

      const map = L.map(mapContainerRef.current, {
        center: [-14.235, -51.9253], // Center of Brazil
        zoom: 4,
        minZoom: 3,
        maxZoom: 18,
        zoomControl: false,
        attributionControl: false,
      });

      // CartoDB Positron / Minimalist Light Clean Map (Google Maps Clean Style)
      L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
        attribution: '&copy; OpenStreetMap contributors &copy; CARTO',
        subdomains: 'abcd',
        maxZoom: 20,
      }).addTo(map);

      const markersGroup = L.layerGroup().addTo(map);
      markersLayerRef.current = markersGroup;
      mapRef.current = map;

      setTimeout(() => {
        try {
          map.invalidateSize();
        } catch {}
      }, 150);
    }

    return () => {
      if (mapRef.current) {
        try {
          mapRef.current.remove();
        } catch {}
        mapRef.current = null;
      }
    };
  }, [isOpen]);

  // Render markers when filtered spots or selection change
  useEffect(() => {
    if (!mapRef.current || !markersLayerRef.current) return;
    const group = markersLayerRef.current;
    group.clearLayers();

    filteredSpots.forEach(spot => {
      const isSelected = selectedSpot?.id === spot.id;
      const icon = createCleanDivIcon(spot, isSelected);

      const marker = L.marker([spot.coordinates.lat, spot.coordinates.lng], {
        icon,
        zIndexOffset: isSelected ? 1000 : 100,
      });

      marker.on('click', () => {
        setSelectedSpot(spot);
        if (mapRef.current) {
          mapRef.current.panTo([spot.coordinates.lat, spot.coordinates.lng], { animate: true });
        }
      });

      group.addLayer(marker);
    });
  }, [filteredSpots, selectedSpot]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[2500] flex flex-col bg-[#f6f7f9] text-slate-800 animate-in fade-in duration-200 select-none">
      {/* Top Header: Clean, modern, luxury bar */}
      <header className="px-4 py-3 bg-white border-b border-slate-200/90 shadow-xs flex items-center justify-between z-30 shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-[#0E5C68] text-white flex items-center justify-center shadow-md">
            <Compass className="w-5 h-5" />
          </div>
          <div>
            <h1 className="font-extrabold text-base sm:text-lg text-slate-900 tracking-tight flex items-center gap-2">
              <span>Mercados & Pontos Turísticos do Brasil</span>
              <span className="hidden sm:inline-flex px-2 py-0.5 rounded-full bg-amber-100 text-amber-900 text-[10px] font-black uppercase">
                Edição Premium Clean
              </span>
            </h1>
            <p className="text-xs text-slate-500 font-medium">
              Cartografia limpa e moderna sem ruídos • Principais feiras, monumentos e polos artesanais
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsListView(!isListView)}
            className="px-3 py-1.5 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-xs font-bold text-slate-700 transition active:scale-95"
          >
            {isListView ? '🗺️ Ver no Mapa' : '📋 Ver em Lista'}
          </button>
          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 hover:text-slate-900 transition active:scale-95"
            title="Fechar Mapa"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </header>

      {/* Filter Toolbar */}
      <div className="px-4 py-2.5 bg-white/90 backdrop-blur-sm border-b border-slate-200 flex flex-wrap items-center justify-between gap-2 z-20 shrink-0">
        {/* Category Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto py-1 max-w-full no-scrollbar">
          <button
            onClick={() => setActiveCategory('todas')}
            className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all shrink-0 ${
              activeCategory === 'todas'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
            }`}
          >
            Todos ({BRAZIL_TOURIST_CATALOG.length})
          </button>

          <button
            onClick={() => setActiveCategory('mercado')}
            className={`px-3 py-1.5 rounded-full text-xs font-bold flex items-center gap-1.5 transition-all shrink-0 ${
              activeCategory === 'mercado'
                ? 'bg-[#C85A32] text-white shadow-xs'
                : 'bg-[#C85A32]/10 hover:bg-[#C85A32]/20 text-[#C85A32]'
            }`}
          >
            <ShoppingBag className="w-3.5 h-3.5" />
            <span>Mercados & Feiras</span>
          </button>

          <button
            onClick={() => setActiveCategory('ponto_turistico')}
            className={`px-3 py-1.5 rounded-full text-xs font-bold flex items-center gap-1.5 transition-all shrink-0 ${
              activeCategory === 'ponto_turistico'
                ? 'bg-[#0E5C68] text-white shadow-xs'
                : 'bg-[#0E5C68]/10 hover:bg-[#0E5C68]/20 text-[#0E5C68]'
            }`}
          >
            <Landmark className="w-3.5 h-3.5" />
            <span>Pontos Turísticos</span>
          </button>

          <button
            onClick={() => setActiveCategory('artesanato')}
            className={`px-3 py-1.5 rounded-full text-xs font-bold flex items-center gap-1.5 transition-all shrink-0 ${
              activeCategory === 'artesanato'
                ? 'bg-[#D99B26] text-white shadow-xs'
                : 'bg-[#D99B26]/10 hover:bg-[#D99B26]/20 text-[#D99B26]'
            }`}
          >
            <Store className="w-3.5 h-3.5" />
            <span>Artesanato Regional</span>
          </button>
        </div>

        {/* Region Selector */}
        <div className="flex items-center gap-1 overflow-x-auto text-xs font-semibold text-slate-500">
          <span className="hidden sm:inline text-[11px] uppercase font-bold text-slate-400 mr-1">Região:</span>
          {(['todas', 'norte', 'nordeste', 'centro_oeste', 'sudeste', 'sul'] as const).map(reg => (
            <button
              key={reg}
              onClick={() => setActiveRegion(reg)}
              className={`px-2.5 py-1 rounded-lg transition-all text-xs ${
                activeRegion === reg
                  ? 'bg-slate-800 text-white font-bold'
                  : 'hover:bg-slate-200 text-slate-600'
              }`}
            >
              {reg === 'todas' ? 'Brasil Todo' : reg === 'centro_oeste' ? 'Centro-Oeste' : reg.charAt(0).toUpperCase() + reg.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Main Map Viewport & Drawer Layout */}
      <div className="flex-1 relative overflow-hidden flex flex-col md:flex-row">
        {/* Map View */}
        <div className={`flex-1 relative h-full w-full ${isListView ? 'hidden md:block' : 'block'}`}>
          <div ref={mapContainerRef} className="w-full h-full bg-[#f4f3f0]" />

          {/* Floating Discrete Legend (Bottom Left) */}
          <div className="absolute bottom-6 left-4 z-20 bg-white/95 backdrop-blur-md p-3.5 rounded-2xl shadow-xl border border-slate-200/90 text-xs max-w-xs pointer-events-auto">
            <h4 className="font-extrabold text-[11px] uppercase tracking-wider text-slate-700 mb-2 flex items-center gap-1.5">
              <span>Legenda do Mapa</span>
            </h4>
            <div className="space-y-1.5 font-semibold text-[11px] text-slate-600">
              <div className="flex items-center gap-2">
                <span className="w-3.5 h-3.5 rounded-full bg-[#C85A32] shrink-0 shadow-xs"></span>
                <span>Mercados & Feiras Tradicionais</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3.5 h-3.5 rounded-full bg-[#0E5C68] shrink-0 shadow-xs"></span>
                <span>Pontos Turísticos & Monumentos</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3.5 h-3.5 rounded-full bg-[#D99B26] shrink-0 shadow-xs"></span>
                <span>Artesanato & Produtos Regionais</span>
              </div>
            </div>
          </div>

          {/* Zoom & Recenter Controls */}
          <div className="absolute top-4 right-4 z-20 flex flex-col gap-2 pointer-events-auto">
            <button
              onClick={() => mapRef.current?.setView([-14.235, -51.9253], 4, { animate: true })}
              className="p-2.5 bg-white hover:bg-slate-100 text-slate-700 rounded-xl shadow-md border border-slate-200 transition active:scale-95"
              title="Ver Brasil Completo"
            >
              <Maximize2 className="w-4 h-4" />
            </button>
            <button
              onClick={() => mapRef.current?.zoomIn()}
              className="p-2.5 bg-white hover:bg-slate-100 text-slate-700 rounded-xl shadow-md border border-slate-200 transition font-black text-sm"
              title="Aproximar Zoom"
            >
              +
            </button>
            <button
              onClick={() => mapRef.current?.zoomOut()}
              className="p-2.5 bg-white hover:bg-slate-100 text-slate-700 rounded-xl shadow-md border border-slate-200 transition font-black text-sm"
              title="Afastar Zoom"
            >
              −
            </button>
          </div>
        </div>

        {/* Selected Spot Detail Sheet (Bottom / Side Card) */}
        {selectedSpot && (
          <div className="absolute inset-x-3 bottom-4 md:inset-x-auto md:right-4 md:top-4 md:bottom-auto md:w-96 z-30 bg-white rounded-2xl shadow-2xl border border-slate-200/90 p-4.5 animate-in slide-in-from-bottom md:slide-in-from-right duration-200 flex flex-col gap-3 max-h-[80vh] overflow-y-auto">
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-center gap-2">
                <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider border ${getCategoryTheme(selectedSpot.category).badgeBg}`}>
                  {getCategoryTheme(selectedSpot.category).label}
                </span>
                <span className="flex items-center text-amber-500 text-xs font-bold gap-0.5">
                  <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                  <span>{selectedSpot.rating.toFixed(1)}</span>
                </span>
              </div>
              <button
                onClick={() => setSelectedSpot(null)}
                className="p-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-500 transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div>
              <h3 className="text-base font-extrabold text-slate-900 leading-snug">
                {selectedSpot.name}
              </h3>
              <p className="text-xs text-slate-500 font-medium mt-0.5 flex items-center gap-1">
                <MapPin className="w-3 h-3 text-[#0E5C68]" />
                <span>{selectedSpot.city} - {selectedSpot.state} ({selectedSpot.region.toUpperCase()})</span>
              </p>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed bg-slate-50 p-2.5 rounded-xl border border-slate-100">
              {selectedSpot.description}
            </p>

            <div className="bg-amber-50/80 border border-amber-200/60 rounded-xl p-2.5 text-xs text-amber-900">
              <span className="font-bold flex items-center gap-1 text-[11px] text-amber-800 uppercase">
                <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                Destaque Especial:
              </span>
              <p className="mt-0.5 text-xs font-medium text-amber-950">
                {selectedSpot.highlight}
              </p>
            </div>

            <button
              onClick={() => {
                onNavigateToSpot(selectedSpot);
                onClose();
              }}
              className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-[#0E5C68] to-[#164e63] hover:brightness-110 text-white font-extrabold text-xs flex items-center justify-center gap-2 shadow-md transition active:scale-95"
            >
              <Navigation className="w-4 h-4" />
              <span>[ TRAÇAR ROTA ATÉ ESTE LOCAL ]</span>
            </button>
          </div>
        )}

        {/* List View on demand */}
        {isListView && (
          <div className="w-full md:w-96 bg-white border-l border-slate-200 p-4 overflow-y-auto max-h-full z-20 flex flex-col gap-2">
            <h3 className="font-extrabold text-xs uppercase tracking-wider text-slate-400 mb-1">
              Locais em Destaque ({filteredSpots.length})
            </h3>
            {filteredSpots.map(spot => {
              const theme = getCategoryTheme(spot.category);
              const isSelected = selectedSpot?.id === spot.id;
              return (
                <div
                  key={spot.id}
                  onClick={() => {
                    setSelectedSpot(spot);
                    setIsListView(false);
                    mapRef.current?.setView([spot.coordinates.lat, spot.coordinates.lng], 13, { animate: true });
                  }}
                  className={`p-3 rounded-2xl border transition-all cursor-pointer flex items-center justify-between ${
                    isSelected
                      ? 'bg-slate-50 border-[#0E5C68] shadow-sm'
                      : 'bg-white hover:bg-slate-50 border-slate-200'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div 
                      className="w-8 h-8 rounded-xl flex items-center justify-center text-white shrink-0 shadow-xs"
                      style={{ backgroundColor: theme.bg }}
                    >
                      {spot.category === 'mercado' ? <ShoppingBag className="w-4 h-4" /> : spot.category === 'ponto_turistico' ? <Landmark className="w-4 h-4" /> : <Store className="w-4 h-4" />}
                    </div>
                    <div>
                      <h4 className="font-bold text-xs text-slate-900">{spot.name}</h4>
                      <p className="text-[10px] text-slate-500">{spot.city} - {spot.state}</p>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-400" />
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
