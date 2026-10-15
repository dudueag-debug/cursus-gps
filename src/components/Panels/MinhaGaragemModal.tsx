import React, { useState, useMemo } from 'react';
import { 
  X, 
  Car, 
  Star, 
  Search, 
  Filter, 
  Check, 
  Zap, 
  Fuel, 
  Gauge, 
  Sparkles, 
  ShieldCheck, 
  Eye, 
  Flame, 
  Info,
  SlidersHorizontal,
  ChevronRight
} from 'lucide-react';
import { 
  CLASSIC_CARS_CATALOG, 
  type ClassicCar, 
  type CarCategory, 
  type CarBrand,
  type CarColorOption 
} from '../../data/classicCarsCatalog';
import type { UserProfile } from '../../types';

interface MinhaGaragemModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: UserProfile;
  onSelectCar: (carId: string, colorId: string, useSimpleMarker: boolean) => void;
}

export const MinhaGaragemModal: React.FC<MinhaGaragemModalProps> = ({
  isOpen,
  onClose,
  user,
  onSelectCar,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<CarCategory | 'all'>('all');
  const [selectedBrand, setSelectedBrand] = useState<CarBrand | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [onlyFavorites, setOnlyFavorites] = useState(false);
  const [favorites, setFavorites] = useState<string[]>(() => {
    try {
      const stored = localStorage.getItem('tp_favorite_cars');
      return stored ? JSON.parse(stored) : ['vw-fusca', 'chevy-opala', 'fiat-uno'];
    } catch {
      return ['vw-fusca', 'chevy-opala', 'fiat-uno'];
    }
  });

  const [activeCarId, setActiveCarId] = useState<string>(() => {
    return (user as any).selectedClassicCarId || 'vw-fusca';
  });

  const [activeColorMap, setActiveColorMap] = useState<Record<string, string>>(() => {
    try {
      const stored = localStorage.getItem('tp_car_colors_map');
      return stored ? JSON.parse(stored) : {};
    } catch {
      return {};
    }
  });

  const [useSimpleMarker, setUseSimpleMarker] = useState<boolean>(() => {
    return Boolean((user as any).useSimpleVehicleMarker || user.accessibility.reducedMotion);
  });

  const [previewCar, setPreviewCar] = useState<ClassicCar | null>(null);

  // Toggle Favorite
  const toggleFavorite = (carId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setFavorites(prev => {
      const next = prev.includes(carId) ? prev.filter(id => id !== carId) : [...prev, carId];
      try {
        localStorage.setItem('tp_favorite_cars', JSON.stringify(next));
      } catch {}
      return next;
    });
  };

  // Select Color for a specific car
  const handleSelectColor = (carId: string, colorId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setActiveColorMap(prev => {
      const next = { ...prev, [carId]: colorId };
      try {
        localStorage.setItem('tp_car_colors_map', JSON.stringify(next));
      } catch {}
      return next;
    });
  };

  // Filtered catalog
  const filteredCars = useMemo(() => {
    return CLASSIC_CARS_CATALOG.filter(car => {
      if (selectedCategory !== 'all' && car.category !== selectedCategory) return false;
      if (selectedBrand !== 'all' && car.brand !== selectedBrand) return false;
      if (onlyFavorites && !favorites.includes(car.id)) return false;

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesName = car.name.toLowerCase().includes(q);
        const matchesModel = car.model.toLowerCase().includes(q);
        const matchesNick = car.nickname?.toLowerCase().includes(q);
        const matchesGen = car.generation.toLowerCase().includes(q);
        const matchesBrand = car.brand.toLowerCase().includes(q);
        return matchesName || matchesModel || matchesNick || matchesGen || matchesBrand;
      }
      return true;
    });
  }, [selectedCategory, selectedBrand, searchQuery, onlyFavorites, favorites]);

  // Apply car selection
  const handleConfirmCar = (car: ClassicCar) => {
    const colorId = activeColorMap[car.id] || car.defaultColorId;
    setActiveCarId(car.id);
    onSelectCar(car.id, colorId, useSimpleMarker);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[3500] flex items-center justify-center bg-black/85 backdrop-blur-md p-3 sm:p-4 animate-in fade-in duration-200">
      <div className="bg-slate-950 border border-slate-800 rounded-3xl w-full max-w-4xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh] isolate">
        
        {/* Top Header */}
        <div className="p-4 sm:p-5 border-b border-slate-800/80 flex items-center justify-between bg-gradient-to-r from-slate-950 via-slate-900 to-slate-950">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-amber-500 via-orange-500 to-yellow-400 p-0.5 shadow-lg flex items-center justify-center">
              <div className="w-full h-full bg-slate-950 rounded-[14px] flex items-center justify-center">
                <Car className="w-6 h-6 text-amber-400" />
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg sm:text-xl font-black text-white tracking-tight">
                  MINHA GARAGEM CLÁSSICA
                </h2>
                <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-400 border border-amber-500/30 text-[10px] font-black uppercase">
                  RJ Ao Vivo
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Escolha o ícone clássico que representa o seu veículo na navegação do mapa
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-900 transition-colors"
            title="Fechar Garagem"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Filter Controls Bar */}
        <div className="p-3 sm:p-4 border-b border-slate-800/60 bg-slate-950/70 space-y-3">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
            {/* Search Input */}
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Buscar Fusca, Opala, Chevette, Gol quadrado, Uno..."
                className="w-full pl-9 pr-4 py-2 bg-slate-900/90 border border-slate-700/80 rounded-xl text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white text-xs"
                >
                  ✕
                </button>
              )}
            </div>

            {/* Favorite Filter Toggle */}
            <button
              onClick={() => setOnlyFavorites(!onlyFavorites)}
              className={`px-3 py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 border transition-all active:scale-95 shrink-0 ${
                onlyFavorites
                  ? 'bg-amber-500/20 text-amber-300 border-amber-400 shadow-md'
                  : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-slate-200'
              }`}
            >
              <Star className={`w-3.5 h-3.5 ${onlyFavorites ? 'fill-amber-400 text-amber-400' : ''}`} />
              <span>Favoritos ({favorites.length})</span>
            </button>

            {/* Low-End / Simple Marker Toggle */}
            <button
              onClick={() => setUseSimpleMarker(!useSimpleMarker)}
              className={`px-3 py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 border transition-all active:scale-95 shrink-0 ${
                useSimpleMarker
                  ? 'bg-cyan-500/20 text-cyan-300 border-cyan-400 shadow-md'
                  : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-slate-200'
              }`}
              title="Marcador leve e simplificado para aparelhos lentos ou economia de bateria"
            >
              <Zap className={`w-3.5 h-3.5 ${useSimpleMarker ? 'text-cyan-400 fill-cyan-400' : ''}`} />
              <span>Marcador Simples</span>
            </button>
          </div>

          {/* Category Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none text-xs font-bold">
            {[
              { id: 'all', label: 'Todos os Clássicos' },
              { id: 'nacional', label: '🇧🇷 Nacionais' },
              { id: 'antigo', label: '🏛️ Antigos & Veteranos' },
              { id: 'esportivo', label: '🏎️ Esportivos de Época' },
              { id: 'utilitario', label: '🚚 Utilitários & Picapes' },
              { id: 'moderno', label: '✨ Anos 90 Modernos' },
            ].map(cat => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id as any)}
                className={`px-3 py-1.5 rounded-xl whitespace-nowrap transition-all border ${
                  selectedCategory === cat.id
                    ? 'bg-lime-400 text-slate-950 border-lime-300 font-black shadow-md'
                    : 'bg-slate-900/80 text-slate-400 border-slate-800 hover:text-white'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>

          {/* Brand Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5 text-[11px] font-semibold text-slate-400">
            <span className="shrink-0 text-slate-500">Fabricante:</span>
            {['all', 'Volkswagen', 'Chevrolet', 'Ford', 'Fiat', 'Puma'].map(b => (
              <button
                key={b}
                onClick={() => setSelectedBrand(b as any)}
                className={`px-2.5 py-1 rounded-lg transition-all ${
                  selectedBrand === b
                    ? 'bg-blue-600/30 text-cyan-300 font-bold border border-cyan-500/40'
                    : 'bg-slate-900 text-slate-400 hover:text-slate-200'
                }`}
              >
                {b === 'all' ? 'Todas as Marcas' : b}
              </button>
            ))}
          </div>
        </div>

        {/* Catalog Grid */}
        <div className="p-4 sm:p-5 overflow-y-auto space-y-4 flex-1">
          {filteredCars.length === 0 ? (
            <div className="py-12 text-center text-slate-500 space-y-2">
              <Car className="w-12 h-12 mx-auto text-slate-600 opacity-60" />
              <p className="text-sm font-bold text-slate-400">Nenhum veículo encontrado com esses filtros.</p>
              <p className="text-xs">Tente buscar por outro nome ou remover o filtro de favoritos.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 sm:gap-4">
              {filteredCars.map(car => {
                const isSelected = activeCarId === car.id;
                const isFav = favorites.includes(car.id);
                const currentColorId = activeColorMap[car.id] || car.defaultColorId;
                const currentColor = car.availableColors.find(c => c.id === currentColorId) || car.availableColors[0];

                return (
                  <div
                    key={car.id}
                    onClick={() => setPreviewCar(car)}
                    className={`rounded-2xl border p-3.5 sm:p-4 transition-all flex flex-col justify-between cursor-pointer relative group ${
                      isSelected
                        ? 'bg-gradient-to-br from-cyan-950/40 via-slate-900 to-slate-950 border-cyan-400 ring-2 ring-cyan-400/30 shadow-xl'
                        : 'bg-slate-900/60 hover:bg-slate-900 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    {/* Top Row: Brand, Year, Favorite Star */}
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="text-[10px] uppercase font-black tracking-wider text-cyan-400">
                            {car.brand}
                          </span>
                          <span className="text-[10px] text-slate-500">•</span>
                          <span className="text-[10px] text-slate-400 font-mono">
                            {car.yearRange}
                          </span>
                        </div>
                        <h3 className="text-base font-black text-white leading-tight truncate mt-0.5">
                          {car.name}
                        </h3>
                        {car.nickname && (
                          <span className="inline-block px-1.5 py-0.2 rounded bg-amber-500/10 border border-amber-500/20 text-amber-300 text-[10px] font-bold mt-1">
                            {car.nickname}
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          onClick={e => toggleFavorite(car.id, e)}
                          className={`p-1.5 rounded-lg border transition-all ${
                            isFav
                              ? 'bg-amber-500/20 border-amber-500/40 text-amber-400'
                              : 'bg-slate-800/80 border-slate-700 text-slate-400 hover:text-white'
                          }`}
                          title={isFav ? 'Remover dos favoritos' : 'Adicionar aos favoritos'}
                        >
                          <Star className={`w-3.5 h-3.5 ${isFav ? 'fill-amber-400' : ''}`} />
                        </button>

                        {isSelected && (
                          <span className="px-2 py-1 rounded-lg bg-lime-400 text-slate-950 font-black text-[10px] flex items-center gap-1 shadow">
                            <Check className="w-3 h-3" />
                            <span>ATIVO</span>
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Description & Historical Specs */}
                    <p className="text-[11px] text-slate-300 leading-snug line-clamp-2 mb-3">
                      {car.description}
                    </p>

                    <div className="bg-slate-950/60 rounded-xl p-2.5 border border-slate-800/80 grid grid-cols-2 gap-2 text-[10px] text-slate-400 mb-3">
                      <div>
                        <span className="text-slate-500 block">Motorização:</span>
                        <span className="font-bold text-slate-200">{car.specs.engine}</span>
                      </div>
                      <div>
                        <span className="text-slate-500 block">Potência:</span>
                        <span className="font-bold text-slate-200">{car.specs.power}</span>
                      </div>
                    </div>

                    {/* Color Palette Selector Pills */}
                    <div className="pt-2 border-t border-slate-800/60 flex items-center justify-between gap-2">
                      <div className="flex items-center gap-1.5">
                        <span className="text-[10px] text-slate-400 font-semibold mr-1">Cor:</span>
                        {car.availableColors.slice(0, 5).map(col => (
                          <button
                            key={col.id}
                            onClick={e => handleSelectColor(car.id, col.id, e)}
                            className={`w-5 h-5 rounded-full border-2 transition-transform hover:scale-125 ${
                              currentColor.id === col.id ? 'scale-120 ring-2 ring-cyan-400 border-white' : 'border-slate-700'
                            }`}
                            style={{ backgroundColor: col.primary }}
                            title={col.name}
                          />
                        ))}
                      </div>

                      <button
                        onClick={e => {
                          e.stopPropagation();
                          handleConfirmCar(car);
                        }}
                        className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all active:scale-95 flex items-center gap-1 shadow ${
                          isSelected
                            ? 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                            : 'bg-lime-400 hover:bg-lime-300 text-slate-950 shadow-lime-500/20'
                        }`}
                      >
                        <span>{isSelected ? 'Em Uso' : 'Escolher'}</span>
                        <ChevronRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Modal Footer with Summary */}
        <div className="p-3 sm:p-4 border-t border-slate-800 bg-slate-950 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-slate-400">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>Catálogo histórico expansível de veículos clássicos brasileiros e internacionais</span>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-[11px] text-slate-500">
              Total de Clássicos: <strong className="text-white">{CLASSIC_CARS_CATALOG.length} modelos</strong>
            </span>
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs transition"
            >
              Fechar
            </button>
          </div>
        </div>

      </div>

      {/* Detail Preview Submodal */}
      {previewCar && (
        <div className="fixed inset-0 z-[3600] flex items-center justify-center bg-black/80 p-4 animate-in fade-in">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-md p-5 space-y-4 shadow-2xl">
            <div className="flex items-start justify-between">
              <div>
                <span className="text-xs font-black text-cyan-400 uppercase tracking-wider">{previewCar.brand}</span>
                <h3 className="text-xl font-black text-white">{previewCar.name}</h3>
                <p className="text-xs text-slate-400">{previewCar.generation} ({previewCar.yearRange})</p>
              </div>
              <button onClick={() => setPreviewCar(null)} className="p-1.5 text-slate-400 hover:text-white rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-300 leading-relaxed">
              <span className="font-bold text-amber-400 block mb-1">Curiosidade de Época:</span>
              {previewCar.specs.curiosity}
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-400">Selecione a Cor de Fábrica:</label>
              <div className="flex items-center gap-2 flex-wrap">
                {previewCar.availableColors.map(col => {
                  const isCurrent = (activeColorMap[previewCar.id] || previewCar.defaultColorId) === col.id;
                  return (
                    <button
                      key={col.id}
                      onClick={e => handleSelectColor(previewCar.id, col.id, e)}
                      className={`px-2.5 py-1.5 rounded-xl border text-xs font-bold flex items-center gap-2 transition-all ${
                        isCurrent ? 'border-cyan-400 bg-cyan-950/40 text-white' : 'border-slate-700 bg-slate-800 text-slate-300'
                      }`}
                    >
                      <span className="w-3.5 h-3.5 rounded-full" style={{ backgroundColor: col.primary }} />
                      <span>{col.name}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="pt-2 flex items-center gap-2">
              <button
                onClick={() => {
                  handleConfirmCar(previewCar);
                  setPreviewCar(null);
                }}
                className="flex-1 py-3 rounded-xl bg-lime-400 hover:bg-lime-300 text-slate-950 font-black text-sm shadow-lg active:scale-95 transition-all flex items-center justify-center gap-2"
              >
                <Check className="w-4 h-4" />
                <span>Usar Este Clássico no Mapa</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
