import React, { useState, useEffect } from 'react';
import { BrandHeader } from './components/BrandHeader';
import { GPSMap } from './components/Map/GPSMap';
import { RoutePlanner } from './components/Navigation/RoutePlanner';
import { TurnByTurnOverlay } from './components/Navigation/TurnByTurnOverlay';
import { CentralDeLocais } from './components/Panels/CentralDeLocais';
import { AcontecendoNaVia } from './components/Panels/AcontecendoNaVia';
import { PartidaSeguraModal } from './components/Panels/PartidaSeguraModal';
import { CultureModal } from './components/Panels/CultureModal';
import { UserProfileModal } from './components/Panels/UserProfileModal';
import { AuthModal } from './components/Panels/AuthModal';
import { InstallAppModal } from './components/Panels/InstallAppModal';
import { VoiceCommandModal } from './components/Navigation/VoiceCommandModal';
import { SplashScreen } from './components/SplashScreen';
import { ViaCardHUD } from './components/Navigation/ViaCardHUD';
import { QuickSignalsModal } from './components/Navigation/QuickSignalsModal';
import { Socorro24hModal } from './components/Panels/Socorro24hModal';
import { ClimaTempoModal } from './components/Panels/ClimaTempoModal';
import { LocationModal } from './components/Panels/LocationModal';
import { MenuDrawer } from './components/Panels/MenuDrawer';
import { OQueTemAquiModal } from './components/Panels/OQueTemAquiModal';
import { ConhecaEsteLugarModal } from './components/Panels/ConhecaEsteLugarModal';
import { AboutAppModal } from './components/Panels/AboutAppModal';
import { useVoiceCommander } from './hooks/useVoiceCommander';
import type { UserProfile, Coordinates, RouteOption, Occurrence, CultureSpot, Place, PlaceCategory, WeatherData } from './types';
import { api } from './services/api';
import { locationService } from './services/locationService';
import { userService } from './services/userService';
import { weatherService } from './services/weatherService';
import { parseNaturalLanguageQuery } from './services/intelligentSearchService';

export function App() {
  // Splash Screen State
  const [showSplash, setShowSplash] = useState(true);

  // Cached initial location from previous sessions
  const cachedLoc = locationService.getCachedLocation();

  // Detected Brazilian Location Name (City - State)
  const [detectedLocationName, setDetectedLocationName] = useState<string>(() => {
    return cachedLoc?.formatted || 'Localizando GPS ao vivo...';
  });

  // User & Profile State
  const [user, setUser] = useState<UserProfile>({
    id: 'user-eduardo',
    name: 'Eduardo Noronha',
    username: 'eduardo_gps',
    email: 'dudusemog@gmail.com',
    phone: '+55 21 98765-4321',
    isGuest: false,
    preferredMode: 'car',
    vehicleModel: 'sedan',
    vehicleColor: 'lime',
    enableWindEffect: true,
    enableVoiceInstructions: true,
    enableCultureAudio: true,
    detectedCity: cachedLoc?.city || 'Brasil',
    detectedState: cachedLoc?.state || 'BR',
    privacy: {
      shareLocationWithCommunity: true,
      saveRouteHistory: true,
      anonymousReports: false,
      locationPermissionGranted: true,
    },
    accessibility: {
      highContrast: false,
      reducedMotion: false,
      largerText: false,
    },
  });

  // Active Navigation & View State
  const [activePanel, setActivePanel] = useState<'map' | 'places' | 'occurrences' | 'safety' | 'culture' | 'profile'>('map');
  const [isNavigating, setIsNavigating] = useState(false);

  // Geographic Coordinates (Real GPS or Cached Coordinates)
  const [currentLocation, setCurrentLocation] = useState<Coordinates>(() => {
    return cachedLoc?.coordinates || {
      lat: -22.906424,
      lng: -43.182231,
    };
  });
  const [heading, setHeading] = useState(45);
  const [gpsAccuracy, setGpsAccuracy] = useState<number | null>(cachedLoc?.accuracyMeters || null);

  // Routes State
  const [routes, setRoutes] = useState<RouteOption[]>([]);
  const [selectedRouteIndex, setSelectedRouteIndex] = useState(0);

  // Weather & Rain State
  const [weatherData, setWeatherData] = useState<WeatherData | null>(null);
  const [isWeatherModalOpen, setIsWeatherModalOpen] = useState(false);

  // Data from backend & services
  const [occurrences, setOccurrences] = useState<Occurrence[]>([]);
  const [cultureSpots, setCultureSpots] = useState<CultureSpot[]>([]);
  const [places, setPlaces] = useState<Place[]>([]);
  const [selectedCultureSpot, setSelectedCultureSpot] = useState<CultureSpot | null>(null);

  // Modal Visibility State
  const [isSafetyModalOpen, setIsSafetyModalOpen] = useState(false);
  const [isCultureModalOpen, setIsCultureModalOpen] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isInstallModalOpen, setIsInstallModalOpen] = useState(false);
  const [isVoiceModalOpen, setIsVoiceModalOpen] = useState(false);
  const [isQuickSignalsOpen, setIsQuickSignalsOpen] = useState(false);
  const [isSocorroModalOpen, setIsSocorroModalOpen] = useState(false);
  const [isLocationModalOpen, setIsLocationModalOpen] = useState(false);
  const [isMenuDrawerOpen, setIsMenuDrawerOpen] = useState(false);
  const [isMobilePlannerOpen, setIsMobilePlannerOpen] = useState(false);
  const [isOQueTemAquiOpen, setIsOQueTemAquiOpen] = useState(false);
  const [isConhecaEsteLugarOpen, setIsConhecaEsteLugarOpen] = useState(false);
  const [isAboutAppOpen, setIsAboutAppOpen] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);

  // Toggle vehicle mode (Car <-> Motorcycle)
  const handleToggleTransportMode = () => {
    const nextMode = user.preferredMode === 'motorcycle' ? 'car' : 'motorcycle';
    setUser(prev => ({
      ...prev,
      preferredMode: nextMode,
      vehicleModel: nextMode === 'motorcycle' ? 'motorcycle_sport' : 'sedan',
    }));
    speakText(`Modo de transporte alterado para ${nextMode === 'motorcycle' ? 'Moto' : 'Carro'}`);
  };

  // Instant 1-tap crowd-sourced occurrence reporting from driver bar
  const handleQuickReport = async (category: string, title: string) => {
    try {
      await api.reportOccurrence({
        category,
        title,
        coordinates: currentLocation,
        severity: ['acidente', 'alagamento', 'blitz', 'via_interditada'].includes(category) ? 'alta' : 'media',
        locationName: detectedLocationName,
        affectedLanes: 'Faixa Principal',
        description: `Alerta reportado em tempo real pelo condutor ${user.name}`,
      });
      refreshOccurrences();
      speakText('Ocorrência registrada no mapa vivo!');
    } catch (e) {
      console.error(e);
    }
  };

  // Quick destination (Casa / Trabalho / Salvas)
  const handleQuickDestination = async (type: 'home' | 'work' | 'saved') => {
    const targetOffset = type === 'home' ? { lat: currentLocation.lat + 0.045, lng: currentLocation.lng + 0.035 }
      : type === 'work' ? { lat: currentLocation.lat - 0.052, lng: currentLocation.lng - 0.042 }
      : { lat: currentLocation.lat + 0.02, lng: currentLocation.lng - 0.02 };

    const targetTitle = type === 'home' ? 'Casa' : type === 'work' ? 'Trabalho' : 'Destino Salvo';

    try {
      const data = await api.calculateRoute(currentLocation, targetOffset, user.preferredMode);
      setRoutes(data.routes);
      setSelectedRouteIndex(0);
      setActivePanel('map');
      speakText(`Traçando rota até ${targetTitle}`);
    } catch (e) {
      console.error(e);
      setIsMobilePlannerOpen(true);
    }
  };

  // Handle location update from modal or GPS calibration
  const handleLocationSelected = (coords: Coordinates, formattedName: string) => {
    setCurrentLocation(coords);
    setDetectedLocationName(formattedName);
    api.getOccurrences(coords).then(setOccurrences).catch(console.error);
    api.getCultureSpots(coords).then(setCultureSpots).catch(console.error);
    api.getPlaces('', undefined, coords).then(setPlaces).catch(console.error);
    refreshWeather(coords);
  };

  // Fetch weather data for given coordinates
  const refreshWeather = async (coords: Coordinates, city = 'Sua Região', state = 'BR') => {
    try {
      const data = await weatherService.getWeather(coords, city, state);
      setWeatherData(data);
    } catch (e) {
      console.warn('Weather fetch notice:', e);
    }
  };

  // Voice speech synthesis output
  const speakText = (text: string) => {
    if (typeof window === 'undefined' || !window.speechSynthesis) return;
    try {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'pt-BR';
      utterance.rate = user.voiceRate || 1.05;

      if (user.selectedVoiceURI) {
        const voices = window.speechSynthesis.getVoices();
        const found = voices.find(v => v.voiceURI === user.selectedVoiceURI);
        if (found) utterance.voice = found;
      }

      window.speechSynthesis.speak(utterance);
    } catch (e) {
      console.warn('Speech synthesis error:', e);
    }
  };

  // Intelligent Natural Language Search & Voice Handler
  const handleIntelligentSearch = async (query: string) => {
    const parsed = parseNaturalLanguageQuery(query, currentLocation);

    if (parsed.intentType === 'what_is_here') {
      setIsOQueTemAquiOpen(true);
      speakText(parsed.explanation);
      return;
    }

    if (parsed.intentType === 'weather_lookup') {
      setIsWeatherModalOpen(true);
      speakText(parsed.explanation);
      return;
    }

    if (parsed.intentType === 'history_lookup') {
      setIsConhecaEsteLugarOpen(true);
      speakText(parsed.explanation);
      return;
    }

    if (parsed.intentType === 'signal_action') {
      setIsQuickSignalsOpen(true);
      speakText(parsed.explanation);
      return;
    }

    if (parsed.intentType === 'category_search' && parsed.categoryFilter) {
      speakText(parsed.explanation);
      handleFindNearest(parsed.categoryFilter);
      return;
    }

    // Default address geocoding & route search
    try {
      const results = await api.geocode(query, currentLocation);
      if (results && results.length > 0) {
        const dest = results[0];
        const data = await api.calculateRoute(currentLocation, dest.coordinates, user.preferredMode);
        setRoutes(data.routes);
        setSelectedRouteIndex(0);
        setActivePanel('map');
        speakText(`Rota calculada para ${dest.displayName}`);
      } else {
        speakText('Não encontrei o endereço exato, tente falar o nome de uma avenida ou bairro.');
      }
    } catch (e) {
      console.error(e);
    }
  };

  const voice = useVoiceCommander({
    onSearchDestination: handleIntelligentSearch,
    onStartNavigation: () => handleStartNavigation(),
    onStopNavigation: () => handleExitNavigation(),
    onOpenPanel: panel => {
      if (panel === 'safety') setIsSafetyModalOpen(true);
      else if (panel === 'culture') setIsCultureModalOpen(true);
      else setActivePanel(panel);
    },
    onRecenterMap: () => {
      setIsLocationModalOpen(true);
    },
    onSpeakResponse: text => speakText(text),
  });

  // Load Real Data, PWA install listener and Geolocation on mount
  useEffect(() => {
    const handleBeforeInstall = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };
    window.addEventListener('beforeinstallprompt', handleBeforeInstall);

    const activeSession = userService.getActiveSession();
    if (activeSession) {
      setUser(activeSession);
    } else {
      const savedProfile = localStorage.getItem('tp_user_profile');
      if (savedProfile) {
        try {
          const parsed = JSON.parse(savedProfile);
          setUser(prev => ({ ...prev, ...parsed }));
        } catch {}
      }
    }

    // Auto-detect user's real physical location immediately
    locationService.detectUserLocation((res) => {
      setCurrentLocation(res.coordinates);
      setDetectedLocationName(res.formatted);
      if (res.accuracyMeters) setGpsAccuracy(Math.round(res.accuracyMeters));
      setUser(prev => ({
        ...prev,
        detectedCity: res.city,
        detectedState: res.state,
      }));
      // Reload localized alerts, weather, culture spots and places
      api.getOccurrences(res.coordinates).then(setOccurrences).catch(console.error);
      api.getCultureSpots(res.coordinates).then(setCultureSpots).catch(console.error);
      api.getPlaces('', undefined, res.coordinates).then(setPlaces).catch(console.error);
      refreshWeather(res.coordinates, res.city, res.state);
    }).catch(err => {
      console.warn('Detecção de localização aviso:', err);
    });

    // Continuous Live High-Accuracy GPS Tracking
    let watchId: number | null = null;
    let lastReverseTime = 0;
    if (typeof navigator !== 'undefined' && 'geolocation' in navigator) {
      try {
        watchId = navigator.geolocation.watchPosition(
          pos => {
            const lat = pos.coords.latitude;
            const lng = pos.coords.longitude;
            if (lat && lng) {
              const newCoords = { lat, lng };
              setCurrentLocation(newCoords);
              if (pos.coords.accuracy) {
                setGpsAccuracy(Math.round(pos.coords.accuracy));
              }
              if (
                pos.coords.heading !== null &&
                !isNaN(pos.coords.heading) &&
                (pos.coords.speed || 0) > 0.5
              ) {
                setHeading(pos.coords.heading);
              }

              // Throttle reverse geocoding to once every 20 seconds
              const now = Date.now();
              if (now - lastReverseTime > 20000 || lastReverseTime === 0) {
                lastReverseTime = now;
                locationService.reverseGeocode(newCoords).then(rev => {
                  const displayName = rev.road 
                    ? `${rev.road}, ${rev.city}` 
                    : `${rev.city} - ${rev.state}`;
                  setDetectedLocationName(displayName);
                  setUser(prev => ({
                    ...prev,
                    detectedCity: rev.city,
                    detectedState: rev.state,
                  }));
                  localStorage.setItem('tp_user_location', JSON.stringify({
                    coordinates: newCoords,
                    city: rev.city,
                    state: rev.state,
                    country: 'Brasil',
                    road: rev.road,
                    suburb: rev.suburb,
                    source: 'gps',
                    accuracyMeters: pos.coords.accuracy,
                    formatted: displayName,
                  }));
                }).catch(() => {});
              }
            }
          },
          err => {
            console.warn('GPS continuous watch notice:', err);
          },
          {
            enableHighAccuracy: true,
            maximumAge: 0,
            timeout: 10000,
          }
        );
      } catch (e) {
        console.warn('Erro ao registrar watchPosition:', e);
      }
    }

    // Listen for real-time heading / compass
    let handleOrientation: ((e: DeviceOrientationEvent) => void) | null = null;
    if (typeof window !== 'undefined' && 'DeviceOrientationEvent' in window) {
      handleOrientation = (e: DeviceOrientationEvent) => {
        if (e.alpha !== null && !isNaN(e.alpha)) {
          setHeading(360 - e.alpha);
        }
      };
      window.addEventListener('deviceorientation', handleOrientation);
    }

    // Initial load
    const loadData = async () => {
      try {
        const occData = await api.getOccurrences(currentLocation);
        setOccurrences(occData);
        const culData = await api.getCultureSpots(currentLocation);
        setCultureSpots(culData);
        const placeData = await api.getPlaces('', undefined, currentLocation);
        setPlaces(placeData);
        refreshWeather(currentLocation, user.detectedCity || 'Brasil', user.detectedState || 'BR');
      } catch (e) {
        console.error('API load error:', e);
      }
    };

    loadData();

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
      if (handleOrientation) {
        window.removeEventListener('deviceorientation', handleOrientation);
      }
      if (watchId !== null && typeof navigator !== 'undefined' && 'geolocation' in navigator) {
        navigator.geolocation.clearWatch(watchId);
      }
    };
  }, []);

  const selectedRoute = routes[selectedRouteIndex] || null;

  // Handle route calculation
  const handleRouteCalculated = (newRoutes: RouteOption[], selectedIdx: number = 0) => {
    setRoutes(newRoutes);
    setSelectedRouteIndex(selectedIdx);
    setActivePanel('map');
  };

  // Trigger Navigation Start
  const handleStartNavigation = () => {
    if (!selectedRoute) return;

    userService.addRouteToUserHistory(
      user.id,
      detectedLocationName || 'Minha Localização',
      selectedRoute.title || 'Destino GPS 4.0',
      selectedRoute.totalDistanceMeters,
      selectedRoute.totalDurationSeconds
    );

    if (['car', 'motorcycle'].includes(selectedRoute.mode)) {
      setIsSafetyModalOpen(true);
    } else {
      setIsNavigating(true);
    }
  };

  const handleProceedFromSafety = () => {
    if (selectedRoute) {
      userService.addRouteToUserHistory(
        user.id,
        detectedLocationName || 'Minha Localização',
        selectedRoute.title || 'Destino GPS 4.0',
        selectedRoute.totalDistanceMeters,
        selectedRoute.totalDurationSeconds
      );
    }
    setIsNavigating(true);
  };

  const handleExitNavigation = () => {
    setIsNavigating(false);
  };

  // Traçar rota a partir de um local encontrado
  const handleRouteToPlace = async (place: Place) => {
    try {
      const data = await api.calculateRoute(currentLocation, place.coordinates, user.preferredMode);
      setRoutes(data.routes);
      setSelectedRouteIndex(0);
      setActivePanel('map');
      speakText(`Traçando rota até ${place.name}`);
    } catch (e) {
      console.error(e);
      alert('Não foi possível calcular a rota até este local no momento.');
    }
  };

  // Encontrar o serviço essencial mais próximo com 1 toque
  const handleFindNearest = async (category: PlaceCategory) => {
    try {
      const localPlaces = await api.getPlaces(category, undefined, currentLocation);
      if (localPlaces && localPlaces.length > 0) {
        const nearest = localPlaces[0];
        handleRouteToPlace(nearest);
      } else {
        setActivePanel('places');
      }
    } catch (e) {
      console.error(e);
      setActivePanel('places');
    }
  };

  const handleSelectOccurrence = (occ: Occurrence) => {
    setCurrentLocation(occ.coordinates);
    setActivePanel('map');
  };

  const handleSelectCultureSpot = (spot: CultureSpot) => {
    setSelectedCultureSpot(spot);
    setIsCultureModalOpen(true);
  };

  const refreshOccurrences = async () => {
    try {
      const occ = await api.getOccurrences(currentLocation);
      setOccurrences(occ);
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className={`h-[100dvh] min-h-[100dvh] max-h-[100dvh] bg-slate-950 text-slate-100 flex flex-col font-sans overflow-hidden ${user.accessibility.highContrast ? 'contrast-125' : ''}`}>
      {/* Visual Splash Opening Screen */}
      {showSplash && (
        <SplashScreen onEnterApp={() => setShowSplash(false)} />
      )}

      {/* Brand Navigation Header */}
      <BrandHeader
        user={user}
        activePanel={activePanel}
        setActivePanel={panel => {
          if (panel === 'safety') {
            setIsSafetyModalOpen(true);
          } else if (panel === 'profile') {
            setIsProfileModalOpen(true);
          } else if (panel === 'culture') {
            setIsCultureModalOpen(true);
          } else {
            setActivePanel(panel);
          }
        }}
        openSafetyModal={() => setIsSafetyModalOpen(true)}
        openInstallModal={() => setIsInstallModalOpen(true)}
        openVoiceModal={() => {
          setIsVoiceModalOpen(true);
          voice.startListening();
        }}
        openWeatherModal={() => setIsWeatherModalOpen(true)}
        openLocationModal={() => setIsLocationModalOpen(true)}
        openMenuDrawer={() => setIsMenuDrawerOpen(true)}
        openNotificationsModal={() => setActivePanel('occurrences')}
        onOpenTrafficOccurrences={() => setActivePanel('occurrences')}
        onOpenRadars={() => setActivePanel('occurrences')}
        weatherData={weatherData}
        activeOccurrencesCount={occurrences.filter(o => !o.isNormalized).length}
        detectedLocation={detectedLocationName}
        gpsAccuracy={gpsAccuracy}
        onRecenterGPS={() => {
          setIsLocationModalOpen(true);
        }}
      />

      {/* Main Content Area */}
      <main className="flex-1 relative flex flex-col lg:flex-row overflow-hidden">
        {/* Map Area */}
        <div className="flex-1 relative h-full w-full min-h-0">
          <GPSMap
            currentLocation={currentLocation}
            heading={heading}
            user={user}
            isNavigating={isNavigating}
            selectedRoute={selectedRoute}
            occurrences={occurrences}
            cultureSpots={cultureSpots}
            onSelectOccurrence={handleSelectOccurrence}
            onSelectCultureSpot={handleSelectCultureSpot}
            onOpenWeather={() => setIsWeatherModalOpen(true)}
            onOpenSocorro={() => setIsSocorroModalOpen(true)}
            onOpenOccurrences={() => setActivePanel('occurrences')}
            onFindCategory={handleFindNearest}
            onOpenPlacesPanel={() => setActivePanel('places')}
            onUpdateLocation={(coords) => {
              locationService.reverseGeocode(coords).then(rev => {
                handleLocationSelected(coords, `${rev.city} - ${rev.state} • GPS Ao Vivo`);
              }).catch(() => {
                handleLocationSelected(coords, 'Sua Posição GPS Ao Vivo');
              });
            }}
            isSplashActive={showSplash}
            activePanel={activePanel}
          />

          {/* Super-Card do Motorista 4.0 (Fixado na parte inferior) */}
          {!isNavigating && (
            <ViaCardHUD
              occurrences={occurrences}
              currentLocation={currentLocation}
              weatherData={weatherData}
              userPreferredMode={user.preferredMode}
              selectedRoute={selectedRoute}
              onStartNavigation={handleStartNavigation}
              onSelectOccurrence={handleSelectOccurrence}
              onOpenReportModal={() => setActivePanel('occurrences')}
              onOpenQuickSignals={() => setIsQuickSignalsOpen(true)}
              onOpenSocorroModal={() => setIsSocorroModalOpen(true)}
              onOpenWeatherModal={() => setIsWeatherModalOpen(true)}
              onOpenRoutePlanner={() => setIsMobilePlannerOpen(true)}
              onOpenPlacesPanel={() => setActivePanel('places')}
              onFindNearest={handleFindNearest}
              onQuickReport={handleQuickReport}
              onQuickDestination={handleQuickDestination}
              onConfirmOccurrence={(id) => api.confirmOccurrence(id, 'confirm_active').catch(console.error)}
              onOpenOQueTemAqui={() => setIsOQueTemAquiOpen(true)}
              onOpenConhecaEsteLugar={() => setIsConhecaEsteLugarOpen(true)}
              onOpenAboutApp={() => setIsAboutAppOpen(true)}
            />
          )}

          {/* Active Navigation HUD Overlay */}
          {isNavigating && selectedRoute && (
            <TurnByTurnOverlay
              route={selectedRoute}
              onExitNavigation={handleExitNavigation}
              enableVoice={user.enableVoiceInstructions}
            />
          )}
        </div>

        {/* Mobile Route Planner Drawer */}
        {!isNavigating && isMobilePlannerOpen && (
          <div className="absolute inset-x-0 bottom-0 top-[52px] lg:hidden bg-slate-950/98 border-t border-slate-800 p-3 sm:p-4 overflow-y-auto max-h-full shadow-2xl z-40 flex flex-col">
            <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-800 shrink-0">
              <span className="text-xs font-black uppercase text-slate-400">
                Traçar Rota & Destino
              </span>
              <button
                onClick={() => setIsMobilePlannerOpen(false)}
                className="px-2.5 py-1 rounded-xl bg-slate-800 text-xs font-black text-cyan-400 active:scale-95 transition-all"
              >
                ✕ Fechar
              </button>
            </div>
            <div className="flex-1 overflow-y-auto">
              <RoutePlanner
                currentLocation={currentLocation}
                routes={routes}
                selectedRoute={selectedRoute}
                onRouteCalculated={(newRoutes, idx) => {
                  handleRouteCalculated(newRoutes, idx);
                  setIsMobilePlannerOpen(false);
                }}
                onSelectAlternative={idx => setSelectedRouteIndex(idx)}
                onStartNavigation={() => {
                  setIsMobilePlannerOpen(false);
                  handleStartNavigation();
                }}
                onTriggerVoice={() => {
                  setIsVoiceModalOpen(true);
                  voice.startListening();
                }}
              />
            </div>
          </div>
        )}

        {/* Side / Drawer Panel depending on active tab */}
        {!isNavigating && activePanel !== 'map' && (
          <div className="absolute inset-x-0 bottom-0 top-[52px] lg:static lg:top-auto lg:bottom-auto w-full lg:w-[460px] xl:w-[500px] bg-slate-950/98 border-t lg:border-t-0 lg:border-l border-slate-800 p-3 sm:p-4 overflow-y-auto max-h-full shadow-2xl z-40 flex flex-col">
            {/* Mobile close bar */}
            <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-800 lg:hidden shrink-0">
              <span className="text-xs font-black uppercase text-slate-400">
                {activePanel === 'places' ? 'Central de Locais' : activePanel === 'occurrences' ? 'Acontecendo na Via' : 'Painel'}
              </span>
              <button
                onClick={() => setActivePanel('map')}
                className="px-2.5 py-1 rounded-xl bg-slate-800 text-xs font-black text-cyan-400 active:scale-95 transition-all"
              >
                ✕ Voltar ao Mapa
              </button>
            </div>

            <div className="flex-1 overflow-y-auto">
              {activePanel === 'places' && (
                <CentralDeLocais
                  onRouteToPlace={handleRouteToPlace}
                  userCoords={currentLocation}
                />
              )}

              {activePanel === 'occurrences' && (
                <AcontecendoNaVia
                  currentLocation={currentLocation}
                  onSelectOccurrenceOnMap={occ => {
                    setActivePanel('map');
                  }}
                  onRefreshMap={refreshOccurrences}
                />
              )}
            </div>
          </div>
        )}

        {/* Desktop RoutePlanner drawer when on map */}
        {!isNavigating && activePanel === 'map' && (
          <div className="hidden lg:flex w-[440px] xl:w-[480px] bg-slate-950/95 border-l border-slate-800 p-3 sm:p-4 overflow-y-auto max-h-[calc(100vh-61px)] shadow-2xl z-20 flex-col">
            <RoutePlanner
              currentLocation={currentLocation}
              routes={routes}
              selectedRoute={selectedRoute}
              onRouteCalculated={handleRouteCalculated}
              onSelectAlternative={idx => setSelectedRouteIndex(idx)}
              onStartNavigation={handleStartNavigation}
              onTriggerVoice={() => {
                setIsVoiceModalOpen(true);
                voice.startListening();
              }}
            />
          </div>
        )}
      </main>

      {/* Clima & Tempo Modal */}
      <ClimaTempoModal
        isOpen={isWeatherModalOpen}
        onClose={() => setIsWeatherModalOpen(false)}
        weatherData={weatherData}
        preferredMode={user.preferredMode}
      />

      {/* "O Que Tem Aqui?" Scanner Modal (500m / 2km) */}
      <OQueTemAquiModal
        isOpen={isOQueTemAquiOpen}
        onClose={() => setIsOQueTemAquiOpen(false)}
        userCoords={currentLocation}
        places={places}
        onSelectPlace={(p) => {
          setCurrentLocation(p.coordinates);
          setIsOQueTemAquiOpen(false);
          setActivePanel('map');
        }}
        onStartRouteToPlace={handleRouteToPlace}
      />

      {/* Conheça Este Lugar & História Regional Modal */}
      <ConhecaEsteLugarModal
        isOpen={isConhecaEsteLugarOpen}
        onClose={() => setIsConhecaEsteLugarOpen(false)}
        userCoords={currentLocation}
      />

      {/* Sobre o Aplicativo GPS 4.0 Modal */}
      <AboutAppModal
        isOpen={isAboutAppOpen}
        onClose={() => setIsAboutAppOpen(false)}
      />

      {/* Os 12 Alertas da Via Modal */}
      <QuickSignalsModal
        isOpen={isQuickSignalsOpen}
        onClose={() => setIsQuickSignalsOpen(false)}
        currentLocation={currentLocation}
        detectedLocationName={detectedLocationName}
        onReportCreated={refreshOccurrences}
      />

      <Socorro24hModal
        isOpen={isSocorroModalOpen}
        onClose={() => setIsSocorroModalOpen(false)}
        currentLocation={currentLocation}
        detectedLocationName={detectedLocationName}
        user={user}
      />

      <PartidaSeguraModal
        isOpen={isSafetyModalOpen}
        onClose={() => setIsSafetyModalOpen(false)}
        onProceedToNavigation={handleProceedFromSafety}
        defaultVehicle={user.preferredMode === 'motorcycle' ? 'motorcycle' : 'car'}
      />

      <CultureModal
        isOpen={isCultureModalOpen}
        onClose={() => setIsCultureModalOpen(false)}
        spot={selectedCultureSpot}
        allSpots={cultureSpots}
        onSelectSpot={spot => setSelectedCultureSpot(spot)}
      />

      <UserProfileModal
        isOpen={isProfileModalOpen}
        onClose={() => setIsProfileModalOpen(false)}
        user={user}
        onUpdateUser={updated => setUser(updated)}
        onLogout={() => {
          setIsProfileModalOpen(false);
          setIsAuthModalOpen(true);
        }}
      />

      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        onAuthSuccess={loggedUser => {
          setUser(prev => ({ ...prev, ...loggedUser }));
          setIsAuthModalOpen(false);
        }}
      />

      <InstallAppModal
        isOpen={isInstallModalOpen}
        onClose={() => setIsInstallModalOpen(false)}
        deferredPrompt={deferredPrompt}
      />

      <LocationModal
        isOpen={isLocationModalOpen}
        onClose={() => setIsLocationModalOpen(false)}
        currentLocation={currentLocation}
        detectedLocationName={detectedLocationName}
        onSelectLocation={handleLocationSelected}
      />

      <VoiceCommandModal
        isOpen={isVoiceModalOpen}
        onClose={() => {
          voice.stopListening();
          setIsVoiceModalOpen(false);
        }}
        isListening={voice.isListening}
        transcript={voice.transcript}
        lastActionMessage={voice.lastActionMessage}
        onToggleListening={() => {
          if (voice.isListening) voice.stopListening();
          else voice.startListening();
        }}
        onExecuteSampleCommand={phrase => {
          voice.processCommand(phrase);
        }}
      />

      {/* Driver Slide-out Menu Drawer */}
      <MenuDrawer
        isOpen={isMenuDrawerOpen}
        onClose={() => setIsMenuDrawerOpen(false)}
        user={user}
        onOpenProfile={() => setIsProfileModalOpen(true)}
        onOpenSafety={() => setIsSafetyModalOpen(true)}
        onOpenCulture={() => setIsCultureModalOpen(true)}
        onOpenVoice={() => {
          setIsVoiceModalOpen(true);
          voice.startListening();
        }}
        onOpenInstall={() => setIsInstallModalOpen(true)}
        onOpenPlaces={() => setActivePanel('places')}
        onOpenOccurrences={() => setActivePanel('occurrences')}
        onOpenLocationModal={() => setIsLocationModalOpen(true)}
        onToggleTransportMode={handleToggleTransportMode}
        onOpenOQueTemAqui={() => setIsOQueTemAquiOpen(true)}
        onOpenConhecaEsteLugar={() => setIsConhecaEsteLugarOpen(true)}
        onOpenAboutApp={() => setIsAboutAppOpen(true)}
        onOpenWeather={() => setIsWeatherModalOpen(true)}
      />
    </div>
  );
}

export default App;
