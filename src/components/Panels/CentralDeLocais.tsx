import React, { useState, useEffect } from 'react';
import { 
  Building2, 
  HeartPulse, 
  ShoppingBag, 
  Compass, 
  Train, 
  Search, 
  MapPin, 
  Phone, 
  Globe, 
  Clock, 
  Navigation,
  Sparkles,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { Place, PlaceCategory, Coordinates } from '../../types';
import { api } from '../../services/api';

interface CentralDeLocaisProps {
  onRouteToPlace: (place: Place) => void;
  userCoords: Coordinates;
}

export const CentralDeLocais: React.FC<CentralDeLocaisProps> = ({
  onRouteToPlace,
  userCoords,
}) => {
  const [places, setPlaces] = useState<Place[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<PlaceCategory | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);

  const fetchPlaces = async () => {
    setLoading(true);
    try {
      const cat = selectedCategory === 'all' ? undefined : selectedCategory;
      const data = await api.getPlaces(cat, searchQuery || undefined, userCoords);
      setPlaces(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPlaces();
  }, [selectedCategory, userCoords]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchPlaces();
  };

  const categories = [
    { key: 'all', label: 'Todos os Locais', icon: <Building2 className="w-4 h-4" /> },
    { key: 'saude', label: 'Saúde & Emergência', icon: <HeartPulse className="w-4 h-4 text-red-400" /> },
    { key: 'comercio_servicos', label: 'Comércio & Serviços', icon: <ShoppingBag className="w-4 h-4 text-amber-400" /> },
    { key: 'transporte_infraestrutura', label: 'Transporte & Terminais', icon: <Train className="w-4 h-4 text-blue-400" /> },
    { key: 'lazer_cultura', label: 'Lazer & Cultura', icon: <Compass className="w-4 h-4 text-purple-400" /> },
  ];

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 text-white shadow-2xl flex flex-col gap-4 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-3">
        <div>
          <div className="flex items-center gap-2">
            <Building2 className="w-6 h-6 text-cyan-400" />
            <h2 className="text-lg font-black tracking-tight text-white">Central de Locais e Estabelecimentos</h2>
          </div>
          <p className="text-xs text-slate-400">
            Hospitais, UPAs, postos de combustível, oficinas, terminais e serviços verificados no Brasil.
          </p>
        </div>

        <div className="text-right">
          <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-blue-900/50 border border-blue-500/30 text-blue-300">
            Base Cartográfica Integrada
          </span>
        </div>
      </div>

      {/* Category Filter Pills */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
        {categories.map(cat => (
          <button
            key={cat.key}
            onClick={() => setSelectedCategory(cat.key as any)}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
              selectedCategory === cat.key
                ? 'bg-blue-600 text-white shadow-md shadow-blue-500/30'
                : 'bg-slate-800/80 text-slate-300 hover:bg-slate-700 hover:text-white'
            }`}
          >
            {cat.icon}
            <span>{cat.label}</span>
          </button>
        ))}
      </div>

      {/* Search Input */}
      <form onSubmit={handleSearchSubmit} className="relative flex items-center">
        <input
          type="text"
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          placeholder="Buscar por hospital, farmácia, posto, oficina ou nome..."
          className="w-full bg-slate-950 border border-slate-700 rounded-xl pl-10 pr-24 py-2.5 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-cyan-500"
        />
        <Search className="absolute left-3 w-4 h-4 text-slate-400" />
        <button
          type="submit"
          className="absolute right-2 px-3 py-1.5 bg-blue-600 hover:bg-blue-500 rounded-lg text-xs font-bold text-white transition-all"
        >
          Filtrar
        </button>
      </form>

      {/* Places List */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-[60vh] overflow-y-auto pr-1">
        {loading ? (
          <div className="col-span-full py-8 text-center text-xs text-slate-400 animate-pulse">
            Carregando estabelecimentos e dados geográficos...
          </div>
        ) : places.length === 0 ? (
          <div className="col-span-full py-8 text-center text-xs text-slate-400">
            Nenhum estabelecimento encontrado nesta categoria.
          </div>
        ) : (
          places.map(place => (
            <div
              key={place.id}
              className="bg-slate-950/70 border border-slate-800 hover:border-slate-700 rounded-xl p-3.5 flex flex-col justify-between gap-3 transition-all"
            >
              <div>
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h3 className="font-bold text-sm text-slate-100">{place.name}</h3>
                    <span className="text-[11px] text-cyan-400 font-medium">{place.subCategory}</span>
                  </div>
                  {place.isOpen !== undefined && (
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      place.isOpen ? 'bg-emerald-950 text-emerald-300 border border-emerald-700' : 'bg-red-950 text-red-300 border border-red-700'
                    }`}>
                      {place.is24h ? '24 HORAS' : place.isOpen ? 'Aberto' : 'Fechado'}
                    </span>
                  )}
                </div>

                <div className="mt-2 flex flex-col gap-1 text-xs text-slate-300">
                  <div className="flex items-start gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-slate-500 shrink-0 mt-0.5" />
                    <span>{place.address} {place.cep ? `• CEP ${place.cep}` : ''}</span>
                  </div>

                  {place.openingHours && (
                    <div className="flex items-center gap-1.5 text-slate-400">
                      <Clock className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                      <span>{place.openingHours}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center justify-between gap-2 pt-2 border-t border-slate-800/80">
                <div className="flex items-center gap-2">
                  {place.phone ? (
                    <a
                      href={`tel:${place.phone}`}
                      className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs flex items-center gap-1 transition-colors"
                      title="Ligar"
                    >
                      <Phone className="w-3.5 h-3.5 text-emerald-400" />
                      <span className="hidden sm:inline">{place.phone}</span>
                    </a>
                  ) : (
                    <span className="text-[10px] text-slate-500 italic">Telefone não informado</span>
                  )}

                  {place.website && (
                    <a
                      href={place.website}
                      target="_blank"
                      rel="noreferrer"
                      className="p-2 bg-slate-800 hover:bg-slate-700 text-cyan-400 rounded-lg text-xs transition-colors"
                      title="Abrir Website"
                    >
                      <Globe className="w-3.5 h-3.5" />
                    </a>
                  )}
                </div>

                <button
                  onClick={() => onRouteToPlace(place)}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs rounded-lg shadow-md shadow-blue-600/30 active:scale-95 transition-all"
                >
                  <Navigation className="w-3.5 h-3.5" />
                  <span>Traçar Rota</span>
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
