import React, { useState, useEffect } from 'react';
import { 
  Building2, 
  HeartPulse, 
  ShieldAlert,
  Fuel,
  Compass, 
  Search, 
  MapPin, 
  Phone, 
  Globe, 
  Clock, 
  Navigation,
  Sparkles,
  Home,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  Pencil,
  Crosshair,
  BadgeAlert,
  ChevronRight,
  ExternalLink,
  Store,
  Disc,
  Pill,
  ShoppingCart
} from 'lucide-react';
import { Place, PlaceCategory, Coordinates, HomeAddress } from '../../types';
import { api } from '../../services/api';
import { userService } from '../../services/userService';

interface CentralDeLocaisProps {
  onRouteToPlace: (place: Place) => void;
  userCoords: Coordinates;
  onSelectPlaceOnMap?: (place: Place) => void;
  onPlacesUpdated?: (places: Place[]) => void;
}

type OriginMode = 'near_me' | 'near_home' | 'custom_location';

export const CentralDeLocais: React.FC<CentralDeLocaisProps> = ({
  onRouteToPlace,
  userCoords,
  onSelectPlaceOnMap,
  onPlacesUpdated,
}) => {
  const [places, setPlaces] = useState<Place[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [radiusKm, setRadiusKm] = useState<number>(5);

  // Origin mode: Near Me vs Near Home vs Custom Location
  const [originMode, setOriginMode] = useState<OriginMode>('near_me');
  const [homeAddress, setHomeAddress] = useState<HomeAddress | null>(null);
  const [customAddressQuery, setCustomAddressQuery] = useState('');
  const [customCenterCoords, setCustomCenterCoords] = useState<Coordinates | null>(null);
  const [customAddressLabel, setCustomAddressLabel] = useState<string>('');
  const [isGeocodingOrigin, setIsGeocodingOrigin] = useState(false);

  // Home setting modal / prompt state
  const [isSettingHome, setIsSettingHome] = useState(false);
  const [homeStreetInput, setHomeStreetInput] = useState('');
  const [homeNumberInput, setHomeNumberInput] = useState('');
  const [homeBairroInput, setHomeBairroInput] = useState('');
  const [homeCityInput, setHomeCityInput] = useState('Rio de Janeiro');
  const [homeCepInput, setHomeCepInput] = useState('');
  const [homeSaveSuccess, setHomeSaveSuccess] = useState(false);

  // Load home address from user profile
  useEffect(() => {
    const session = userService.getActiveSession();
    if (session && session.id) {
      const savedHome = userService.getHomeAddress(session.id);
      setHomeAddress(savedHome);
    }
  }, []);

  // Compute active reference coordinates for search
  const getActiveCenterCoords = (): { coords: Coordinates; label: string; mode: OriginMode } => {
    if (originMode === 'near_home' && homeAddress) {
      return {
        coords: homeAddress.coordinates,
        label: `Minha Casa: ${homeAddress.formattedAddress || `${homeAddress.street}, ${homeAddress.number}`}`,
        mode: 'near_home',
      };
    }

    if (originMode === 'custom_location' && customCenterCoords) {
      return {
        coords: customCenterCoords,
        label: customAddressLabel || 'Endereço pesquisado',
        mode: 'custom_location',
      };
    }

    // Default: Near Me (Live GPS)
    return {
      coords: userCoords,
      label: 'Localização Atual (GPS Ao Vivo)',
      mode: 'near_me',
    };
  };

  const fetchPlaces = async () => {
    setLoading(true);
    try {
      const { coords } = getActiveCenterCoords();
      const results = await api.searchPlaces(searchQuery, {
        centerCoords: coords,
        radiusKm,
        category: selectedCategory === 'all' ? undefined : selectedCategory,
      });
      setPlaces(results);
      if (onPlacesUpdated) {
        onPlacesUpdated(results);
      }
    } catch (e) {
      console.error('[CentralDeLocais] Erro ao buscar locais:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPlaces();
  }, [selectedCategory, radiusKm, originMode, customCenterCoords, userCoords.lat, userCoords.lng]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchPlaces();
  };

  const handleGeocodeCustomAddress = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customAddressQuery.trim()) return;

    setIsGeocodingOrigin(true);
    try {
      const results = await api.geocode(customAddressQuery.trim());
      const first = Array.isArray(results) && results.length > 0 ? results[0] : null;
      if (first && first.coordinates) {
        setCustomCenterCoords(first.coordinates);
        setCustomAddressLabel(first.displayName || customAddressQuery.trim());
        setOriginMode('custom_location');
      } else {
        alert('Endereço não localizado. Tente informar com nome da rua e bairro.');
      }
    } catch {
      alert('Não foi possível geolocalizar o endereço digitado.');
    } finally {
      setIsGeocodingOrigin(false);
    }
  };

  const handleSaveHomeAddress = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!homeStreetInput.trim()) return;

    setIsGeocodingOrigin(true);
    try {
      const query = `${homeStreetInput}, ${homeNumberInput || 's/n'}, ${homeBairroInput || ''}, ${homeCityInput || 'Rio de Janeiro'}`;
      const results = await api.geocode(query);
      const first = Array.isArray(results) && results.length > 0 ? results[0] : null;
      const coords = first?.coordinates || userCoords;

      const fullFormatted = `${homeStreetInput.trim()}${homeNumberInput ? `, ${homeNumberInput.trim()}` : ''} - ${homeBairroInput.trim() || homeCityInput.trim()}`;
      const newHome: HomeAddress = {
        address: fullFormatted,
        street: homeStreetInput.trim(),
        number: homeNumberInput.trim() || undefined,
        neighborhood: homeBairroInput.trim() || undefined,
        city: homeCityInput.trim() || 'Rio de Janeiro',
        state: 'RJ',
        cep: homeCepInput.trim() || undefined,
        formattedAddress: fullFormatted,
        coordinates: coords,
        savedAt: new Date().toISOString(),
      };

      const session = userService.getActiveSession();
      if (session && session.id) {
        userService.setHomeAddress(session.id, newHome);
      }
      setHomeAddress(newHome);
      setHomeSaveSuccess(true);
      setTimeout(() => {
        setHomeSaveSuccess(false);
        setIsSettingHome(false);
      }, 1500);
    } catch {
      alert('Erro ao validar endereço de casa.');
    } finally {
      setIsGeocodingOrigin(false);
    }
  };

  const categories = [
    { key: 'all', label: 'Todos do Bairro & Região', icon: <Building2 className="w-4 h-4" /> },
    { key: 'posto_gnv', label: '⛽ Postos de Gasolina & GNV', icon: <Fuel className="w-4 h-4 text-cyan-400" /> },
    { key: 'supermercado', label: '🛒 Grandes Mercados & Atacadões', icon: <ShoppingCart className="w-4 h-4 text-lime-400" /> },
    { key: 'mercado', label: '🏪 Mercados Locais & Padarias', icon: <Store className="w-4 h-4 text-emerald-400" /> },
    { key: 'material_construcao', label: '🔨 Materiais de Construção', icon: <Store className="w-4 h-4 text-amber-500" /> },
    { key: 'educacao', label: '🎓 Escolas Locais & Faculdades', icon: <Building2 className="w-4 h-4 text-indigo-400" /> },
    { key: 'saude', label: '🏥 UPAs & Hospitais 24h', icon: <HeartPulse className="w-4 h-4 text-red-400" /> },
    { key: 'oficina', label: '🔧 Mecânicos & Oficinas', icon: <Disc className="w-4 h-4 text-orange-400" /> },
    { key: 'funilaria_pintura', label: '🎨 Pintores de Carros & Funilaria', icon: <Sparkles className="w-4 h-4 text-pink-400" /> },
    { key: 'borracheiro', label: '🛞 Borracheiros 24h', icon: <Disc className="w-4 h-4 text-amber-400" /> },
    { key: 'farmacia', label: '💊 Farmácias 24h', icon: <Pill className="w-4 h-4 text-emerald-400" /> },
    { key: 'policia', label: '🚓 Batalhões, DPOs & Delegacias', icon: <ShieldAlert className="w-4 h-4 text-blue-400" /> },
    { key: 'banco_caixa', label: '🏧 Caixas 24 Horas', icon: <Building2 className="w-4 h-4 text-yellow-400" /> },
    { key: 'brt_transporte', label: '🚌 BRT & Terminais', icon: <Navigation className="w-4 h-4 text-emerald-400" /> },
    { key: 'recarga_jae', label: '💳 Recarga Jaé', icon: <Sparkles className="w-4 h-4 text-cyan-400" /> },
    { key: 'igreja', label: '⛪ Igrejas & Templos', icon: <Building2 className="w-4 h-4 text-violet-400" /> },
    { key: 'esporte_lazer', label: '⚽ Estádios, Paintball & Zoo', icon: <Compass className="w-4 h-4 text-orange-400" /> },
    { key: 'presidio', label: '🔒 Complexos Penitenciários', icon: <ShieldAlert className="w-4 h-4 text-rose-500" /> },
    { key: 'shopping', label: '🛍️ Shoppings', icon: <Store className="w-4 h-4 text-pink-400" /> },
    { key: 'parque_praia', label: '🏖️ Praias & Lazer', icon: <Compass className="w-4 h-4 text-purple-400" /> },
  ];

  const activeCenter = getActiveCenterCoords();

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 text-white shadow-2xl flex flex-col gap-4 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-3">
        <div>
          <div className="flex items-center gap-2">
            <Building2 className="w-6 h-6 text-cyan-400" />
            <h2 className="text-lg font-black tracking-tight text-white">Comércios do Seu Bairro & Serviços Verificados</h2>
          </div>
          <p className="text-xs text-slate-400">
            Postos, mercados locais e grandes, materiais de construção, escolas, UPAs, hospitais, mecânicos, funilaria/pintura e borracheiros com fotos reais e avaliações.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-blue-900/50 border border-blue-500/30 text-blue-300">
            Regra da Verdade Cartográfica
          </span>
        </div>
      </div>

      {/* Origin Selection: Perto de Mim vs Perto de Casa vs Outro Local */}
      <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-3 flex flex-col gap-3">
        <div className="flex items-center justify-between text-xs font-semibold text-slate-300 border-b border-slate-800 pb-2">
          <span>Ponto de Referência da Busca:</span>
          <span className="text-[11px] text-cyan-400 font-normal truncate max-w-[200px] sm:max-w-none">
            {activeCenter.label}
          </span>
        </div>

        <div className="grid grid-cols-3 gap-2">
          <button
            onClick={() => setOriginMode('near_me')}
            className={`flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg text-xs font-bold transition-all ${
              originMode === 'near_me'
                ? 'bg-blue-600 text-white shadow-md shadow-blue-500/30'
                : 'bg-slate-800/80 text-slate-300 hover:bg-slate-700'
            }`}
          >
            <Crosshair className="w-3.5 h-3.5 text-cyan-300" />
            <span>Perto de Mim</span>
          </button>

          <button
            onClick={() => {
              if (!homeAddress) {
                setIsSettingHome(true);
              } else {
                setOriginMode('near_home');
              }
            }}
            className={`flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg text-xs font-bold transition-all ${
              originMode === 'near_home'
                ? 'bg-blue-600 text-white shadow-md shadow-blue-500/30'
                : 'bg-slate-800/80 text-slate-300 hover:bg-slate-700'
            }`}
          >
            <Home className="w-3.5 h-3.5 text-amber-300" />
            <span>{homeAddress ? 'Perto de Casa' : 'Cadastrar Casa'}</span>
          </button>

          <button
            onClick={() => setOriginMode('custom_location')}
            className={`flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg text-xs font-bold transition-all ${
              originMode === 'custom_location'
                ? 'bg-blue-600 text-white shadow-md shadow-blue-500/30'
                : 'bg-slate-800/80 text-slate-300 hover:bg-slate-700'
            }`}
          >
            <MapPin className="w-3.5 h-3.5 text-emerald-300" />
            <span>Outro Local</span>
          </button>
        </div>

        {/* Custom Location input when active */}
        {originMode === 'custom_location' && (
          <form onSubmit={handleGeocodeCustomAddress} className="flex gap-2 pt-1 animate-fadeIn">
            <input
              type="text"
              value={customAddressQuery}
              onChange={e => setCustomAddressQuery(e.target.value)}
              placeholder="Digite o bairro ou endereço (ex: Botafogo, Rio de Janeiro)..."
              className="flex-1 bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
            />
            <button
              type="submit"
              disabled={isGeocodingOrigin}
              className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-bold text-xs rounded-lg transition-colors"
            >
              {isGeocodingOrigin ? 'Buscando...' : 'Aplicar'}
            </button>
          </form>
        )}

        {/* Home Address Info / Edit Button */}
        {originMode === 'near_home' && homeAddress && (
          <div className="flex items-center justify-between text-xs bg-slate-900/60 p-2 rounded-lg border border-slate-800">
            <span className="text-slate-300 text-[11px] truncate">
              🏠 {homeAddress.formattedAddress || `${homeAddress.street}, ${homeAddress.number}`}
            </span>
            <button
              onClick={() => setIsSettingHome(true)}
              className="text-[11px] text-cyan-400 hover:underline flex items-center gap-1 shrink-0 ml-2"
            >
              <Pencil className="w-3 h-3" />
              <span>Editar</span>
            </button>
          </div>
        )}
      </div>

      {/* Modal / Form to Set Explicit Home Address (Never inferred automatically) */}
      {isSettingHome && (
        <div className="bg-slate-950 border border-blue-500/40 rounded-xl p-4 flex flex-col gap-3 shadow-xl">
          <div className="flex items-center justify-between border-b border-slate-800 pb-2">
            <div className="flex items-center gap-2">
              <Home className="w-4 h-4 text-amber-400" />
              <h3 className="text-xs font-bold text-white uppercase tracking-wider">Definir Endereço de Casa</h3>
            </div>
            <button
              onClick={() => setIsSettingHome(false)}
              className="text-xs text-slate-400 hover:text-white"
            >
              ✕
            </button>
          </div>

          <p className="text-[11px] text-slate-400">
            Sua privacidade é respeitada: o Cursus GPS nunca presume que sua localização atual é a sua casa. Informe os dados abaixo para salvar explicitamente.
          </p>

          <form onSubmit={handleSaveHomeAddress} className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
            <input
              type="text"
              required
              placeholder="Rua / Avenida *"
              value={homeStreetInput}
              onChange={e => setHomeStreetInput(e.target.value)}
              className="bg-slate-900 border border-slate-700 rounded-lg p-2 text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
            />
            <input
              type="text"
              placeholder="Número (opcional)"
              value={homeNumberInput}
              onChange={e => setHomeNumberInput(e.target.value)}
              className="bg-slate-900 border border-slate-700 rounded-lg p-2 text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
            />
            <input
              type="text"
              placeholder="Bairro (ex: Copacabana, Tijuca)"
              value={homeBairroInput}
              onChange={e => setHomeBairroInput(e.target.value)}
              className="bg-slate-900 border border-slate-700 rounded-lg p-2 text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
            />
            <input
              type="text"
              placeholder="Cidade (padrão: Rio de Janeiro)"
              value={homeCityInput}
              onChange={e => setHomeCityInput(e.target.value)}
              className="bg-slate-900 border border-slate-700 rounded-lg p-2 text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
            />
            <input
              type="text"
              placeholder="CEP (ex: 22070-011)"
              value={homeCepInput}
              onChange={e => setHomeCepInput(e.target.value)}
              className="sm:col-span-2 bg-slate-900 border border-slate-700 rounded-lg p-2 text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
            />

            <div className="sm:col-span-2 flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setIsSettingHome(false)}
                className="px-3 py-1.5 bg-slate-800 text-slate-300 rounded-lg text-xs hover:bg-slate-700"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={isGeocodingOrigin}
                className="px-4 py-1.5 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-lg text-xs flex items-center gap-1.5 shadow-md shadow-blue-500/30"
              >
                {homeSaveSuccess ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-300" /> : <Home className="w-3.5 h-3.5" />}
                <span>{homeSaveSuccess ? 'Salvo com Sucesso!' : 'Salvar como Minha Casa'}</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Radius Configuration (2 km, 5 km, 10 km, 15 km) */}
      <div className="flex items-center justify-between text-xs">
        <span className="text-slate-400 font-semibold">Raio de Cobertura Geográfica:</span>
        <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800">
          {[2, 5, 10, 15].map(r => (
            <button
              key={r}
              onClick={() => setRadiusKm(r)}
              className={`px-3 py-1 rounded-lg text-xs font-black transition-all ${
                radiusKm === r
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              {r} km
            </button>
          ))}
        </div>
      </div>

      {/* Category Filter Pills */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
        {categories.map(cat => (
          <button
            key={cat.key}
            onClick={() => setSelectedCategory(cat.key)}
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
          placeholder="Buscar por nome, rua, UPA, delegacia, farmácia ou posto..."
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
          <div className="col-span-full py-10 text-center text-xs text-slate-400 animate-pulse flex flex-col items-center gap-2">
            <Compass className="w-6 h-6 text-cyan-400 animate-spin" />
            <span>Consultando catálogo geográfico oficial...</span>
          </div>
        ) : places.length === 0 ? (
          <div className="col-span-full py-10 text-center text-xs text-slate-400 bg-slate-950/40 rounded-xl border border-slate-800 p-6 flex flex-col items-center gap-3">
            <AlertCircle className="w-8 h-8 text-amber-400" />
            <p className="font-semibold text-slate-300">
              Nenhum local verificado encontrado em um raio de {radiusKm} km.
            </p>
            <p className="text-[11px] text-slate-500 max-w-sm">
              Conforme nossa política de transparência, não simulamos nem inventamos locais. Você pode expandir o raio de busca para encontrar mais opções confirmadas.
            </p>
            {radiusKm < 15 && (
              <button
                onClick={() => setRadiusKm(radiusKm === 2 ? 5 : radiusKm === 5 ? 10 : 15)}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs rounded-xl shadow-md transition-all"
              >
                Expandir Raio para {radiusKm === 2 ? 5 : radiusKm === 5 ? 10 : 15} km
              </button>
            )}
          </div>
        ) : (
          places.map(place => (
            <div
              key={place.id}
              className="bg-slate-950/70 border border-slate-800 hover:border-slate-700 rounded-xl p-3.5 flex flex-col justify-between gap-3 transition-all relative overflow-hidden"
            >
              <div>
                {/* Header card with name, rating & status */}
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h3 className="font-bold text-sm text-slate-100 flex items-center gap-1.5 flex-wrap">
                      <span>{place.name}</span>
                      {place.hasGNV && (
                        <span className="text-[9px] bg-cyan-950 text-cyan-300 border border-cyan-700 px-1.5 py-0.2 rounded font-black">
                          GNV
                        </span>
                      )}
                    </h3>
                    <span className="text-[11px] text-cyan-400 font-medium block">{place.subCategory}</span>
                    {place.rating !== undefined && (
                      <div className="flex items-center gap-1.5 mt-1">
                        <span className="text-[11px] font-black text-amber-400 bg-amber-950/60 border border-amber-700/50 px-1.5 py-0.5 rounded flex items-center gap-1">
                          ★ {place.rating.toFixed(1)}
                        </span>
                        <span className="text-[10px] text-amber-300 tracking-tight">
                          {'★'.repeat(Math.round(place.rating))}
                        </span>
                        {place.ratingCount !== undefined && (
                          <span className="text-[10px] text-slate-400 font-medium">
                            ({place.ratingCount.toLocaleString('pt-BR')} avaliações)
                          </span>
                        )}
                      </div>
                    )}
                  </div>

                  <div className="flex flex-col items-end gap-1 shrink-0">
                    {place.isOpen !== undefined && (
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        place.isOpen ? 'bg-emerald-950 text-emerald-300 border border-emerald-700' : 'bg-red-950 text-red-300 border border-red-700'
                      }`}>
                        {place.is24h ? '24 HORAS' : place.isOpen ? 'Aberto' : 'Fechado'}
                      </span>
                    )}

                    {place.distanceMeters !== undefined && (
                      <span className="text-[10px] font-bold text-slate-400 bg-slate-900 px-2 py-0.5 rounded">
                        {place.distanceMeters < 1000 ? `${place.distanceMeters}m` : `${(place.distanceMeters / 1000).toFixed(1)}km`}
                      </span>
                    )}
                  </div>
                </div>

                {/* Real Photo Banner when available, or neutral placeholder with Rule of Truth badge */}
                {place.photoUrl ? (
                  <div className="relative mt-2 rounded-lg overflow-hidden h-36 w-full border border-slate-800 bg-slate-900 group">
                    <img
                      src={place.photoUrl}
                      alt={place.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      loading="lazy"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/20 to-transparent"></div>
                    {place.photoAttribution && (
                      <span className="absolute bottom-1 right-2 text-[9px] text-slate-300/80 bg-slate-950/80 px-1.5 py-0.5 rounded backdrop-blur-sm">
                        📷 {place.photoAttribution}
                      </span>
                    )}
                    <span className="absolute top-2 left-2 text-[9px] font-bold text-emerald-300 bg-emerald-950/80 border border-emerald-700/60 px-2 py-0.5 rounded backdrop-blur-sm">
                      Foto Real Verificada
                    </span>
                    {place.rating !== undefined && (
                      <span className="absolute top-2 right-2 text-[10px] font-black text-amber-300 bg-slate-950/85 border border-amber-500/50 px-2 py-0.5 rounded backdrop-blur-sm">
                        ★ {place.rating.toFixed(1)}
                      </span>
                    )}
                  </div>
                ) : (
                  <div className="mt-2 py-2 px-3 bg-slate-900/50 border border-slate-800/80 rounded-lg flex items-center justify-between text-[11px] text-slate-400">
                    <span className="flex items-center gap-1.5 italic">
                      <Sparkles className="w-3.5 h-3.5 text-slate-500" />
                      Foto deste local indisponível no momento
                    </span>
                    <span className="text-[9px] text-slate-500">Regra da Verdade</span>
                  </div>
                )}

                {/* Address info */}
                <div className="mt-2 flex flex-col gap-1.5 text-xs text-slate-300">
                  <div className="flex items-start gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-slate-500 shrink-0 mt-0.5" />
                    <span>
                      {place.address}
                      {place.neighborhood ? `, ${place.neighborhood}` : ''}
                      {place.city ? ` - ${place.city}` : ''}
                      {place.cep ? ` • CEP ${place.cep}` : ''}
                    </span>
                  </div>

                  {/* Verified Reference Point (Ponto de Referência Confirmado) */}
                  {place.verifiedReferencePoint && (
                    <div className="flex items-start gap-1.5 bg-cyan-950/40 border border-cyan-800/40 rounded-lg p-2 text-cyan-200">
                      <Compass className="w-3.5 h-3.5 text-cyan-400 shrink-0 mt-0.5" />
                      <div className="flex flex-col text-[11px]">
                        <span className="font-bold text-cyan-300">Ponto de Referência:</span>
                        <span>{place.verifiedReferencePoint}</span>
                        {place.accessNotes && (
                          <span className="text-slate-400 text-[10px] mt-0.5">ℹ️ {place.accessNotes}</span>
                        )}
                      </div>
                    </div>
                  )}

                  {place.openingHours && (
                    <div className="flex items-center gap-1.5 text-slate-400">
                      <Clock className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                      <span>{place.openingHours}</span>
                    </div>
                  )}

                  {/* Official Source Badges (Rule of Truth) */}
                  {place.officialSource && (
                    <div className="mt-0.5 flex items-center gap-1 text-[10px] text-blue-300 bg-blue-950/60 border border-blue-800/40 px-2 py-1 rounded-md">
                      <CheckCircle2 className="w-3 h-3 text-blue-400 shrink-0" />
                      <span className="truncate">Fonte Oficial: {place.officialSource}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center justify-between gap-2 pt-2 border-t border-slate-800/80">
                <div className="flex items-center gap-2">
                  {place.phone ? (
                    <a
                      href={`tel:${place.phone.replace(/[^0-9]/g, '')}`}
                      className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs flex items-center gap-1 transition-colors"
                      title="Ligar"
                    >
                      <Phone className="w-3.5 h-3.5 text-emerald-400" />
                      <span className="hidden sm:inline font-mono">{place.phone}</span>
                    </a>
                  ) : (
                    <span className="text-[10px] text-slate-500 italic">Tel. não informado</span>
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

                  {onSelectPlaceOnMap && (
                    <button
                      onClick={() => onSelectPlaceOnMap(place)}
                      className="p-2 bg-slate-800 hover:bg-slate-700 text-amber-400 rounded-lg text-xs transition-colors"
                      title="Ver no Mapa"
                    >
                      <MapPin className="w-3.5 h-3.5" />
                    </button>
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

