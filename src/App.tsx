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
import { useVoiceCommander } from './hooks/useVoiceCommander';
import type { UserProfile, Coordinates, RouteOption, Occurrence, CultureSpot, Place } from './types';
import { api } from './services/api';

export function App() {
  // Splash Screen State
  const [showSplash, setShowSplash] = useState(true);

  // User & Profile State
  const [user, setUser] = useState<UserProfile>({
    id: 'user-eduardo',
    name: 'Eduardo Piloto',
    username: 'eduardo_gps',
    email: 'eduardo@cursus.com.br',
    phone: '+55 11 98765-4321',
    isGuest: false,
    preferredMode: 'car',
    vehicleModel: 'sedan',
    vehicleColor: 'lime',
    enableWindEffect: true,
    enableVoiceInstructions: true,
    enableCultureAudio: true,
    privacy: {
      shareLocationWithCommunity: true,
      saveRouteHistory: true,
      anonymousReports: false,
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

  // Geographic Coordinates (Defaults to São Paulo / Brasil)
  const [currentLocation, setCurrentLocation] = useState<Coordinates>({
    lat: -23.5505,
    lng: -46.6333,
  });
  const [heading, setHeading] = useState(45);

  // Routes State
  const [routes, setRoutes] = useState<RouteOption[]>([]);
  const [selectedRouteIndex, setSelectedRouteIndex] = useState(0);

  // Data from backend
  const [occurrences, setOccurrences] = useState<Occurrence[]>([]);
  const [cultureSpots, setCultureSpots] = useState<CultureSpot[]>([]);
  const [selectedCultureSpot, setSelectedCultureSpot] = useState<CultureSpot | null>(null);

  // Modal Visibility State
  const [isSafetyModalOpen, setIsSafetyModalOpen] = useState(false);
  const [isCultureModalOpen, setIsCultureModalOpen] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isInstallModalOpen, setIsInstallModalOpen] = useState(false);
  const [isVoiceModalOpen, setIsVoiceModalOpen] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);

  // Voice speech synthesis output
  const speakText = (text: string) => {
    if (typeof window === 'undefined' || !window.speechSynthesis) return;
    try {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'pt-BR';
      utterance.rate = 1.05;
      window.speechSynthesis.speak(utterance);
    } catch (e) {
      console.warn('Speech synthesis error:', e);
    }
  };

  // Voice Commander Hook
  const handleVoiceDestination = async (query: string) => {
    try {
      const results = await api.geocode(query);
      if (results && results.length > 0) {
        const dest = results[0];
        const data = await api.calculateRoute(currentLocation, dest.coordinates, user.preferredMode);
        setRoutes(data.routes);
        setSelectedRouteIndex(0);
        setActivePanel('map');
      } else {
        speakText('Não encontrei o endereço exato, tente falar o nome de uma avenida ou bairro.');
      }
    } catch (e) {
      console.error(e);
    }
  };

  const voice = useVoiceCommander({
    onSearchDestination: handleVoiceDestination,
    onStartNavigation: () => handleStartNavigation(),
    onStopNavigation: () => handleExitNavigation(),
    onOpenPanel: panel => {
      if (panel === 'safety') setIsSafetyModalOpen(true);
      else if (panel === 'culture') setIsCultureModalOpen(true);
      else setActivePanel(panel);
    },
    onRecenterMap: () => {
      // Map will recenter via GPS
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

    // Try browser Geolocation API
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        pos => {
          setCurrentLocation({
            lat: pos.coords.latitude,
            lng: pos.coords.longitude,
          });
          if (pos.coords.heading !== null && !isNaN(pos.coords.heading)) {
            setHeading(pos.coords.heading);
          }
        },
        err => {
          console.log('GPS permissão padrão ou não disponível:', err.message);
        },
        { enableHighAccuracy: true, timeout: 6000 }
      );
    }

    // Fetch occurrences & culture spots
    const loadData = async () => {
      try {
        const occData = await api.getOccurrences();
        setOccurrences(occData);
        const culData = await api.getCultureSpots();
        setCultureSpots(culData);
      } catch (e) {
        console.error('API load error:', e);
      }
    };

    loadData();

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
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

    // Safety Gate: for Car or Motorcycle, open safety checklist first if user hasn't verified
    if (['car', 'motorcycle'].includes(selectedRoute.mode)) {
      setIsSafetyModalOpen(true);
    } else {
      setIsNavigating(true);
    }
  };

  const handleProceedFromSafety = () => {
    setIsNavigating(true);
  };

  const handleExitNavigation = () => {
    setIsNavigating(false);
  };

  // Traçar rota a partir de um local encontrado na Central de Locais
  const handleRouteToPlace = async (place: Place) => {
    try {
      const data = await api.calculateRoute(currentLocation, place.coordinates, user.preferredMode);
      setRoutes(data.routes);
      setSelectedRouteIndex(0);
      setActivePanel('map');
    } catch (e) {
      console.error(e);
      alert('Não foi possível calcular a rota até este local no momento.');
    }
  };

  const handleSelectOccurrence = (occ: Occurrence) => {
    setActivePanel('occurrences');
  };

  const handleSelectCultureSpot = (spot: CultureSpot) => {
    setSelectedCultureSpot(spot);
    setIsCultureModalOpen(true);
  };

  const refreshOccurrences = async () => {
    try {
      const occ = await api.getOccurrences();
      setOccurrences(occ);
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className={`min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans ${user.accessibility.highContrast ? 'contrast-125' : ''}`}>
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
        activeOccurrencesCount={occurrences.filter(o => !o.isNormalized).length}
      />

      {/* Main Content Area */}
      <main className="flex-1 relative flex flex-col lg:flex-row overflow-hidden">
        {/* Map Area */}
        <div className="flex-1 relative min-h-[50vh] lg:min-h-full">
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
            isSplashActive={showSplash}
          />

          {/* Active Navigation HUD Overlay */}
          {isNavigating && selectedRoute && (
            <TurnByTurnOverlay
              route={selectedRoute}
              onExitNavigation={handleExitNavigation}
              enableVoice={user.enableVoiceInstructions}
            />
          )}
        </div>

        {/* Side / Drawer Panel depending on active tab */}
        {!isNavigating && (
          <div className="w-full lg:w-[460px] xl:w-[500px] bg-slate-950/95 border-t lg:border-t-0 lg:border-l border-slate-800 p-3 sm:p-4 overflow-y-auto max-h-[50vh] lg:max-h-[calc(100vh-61px)] shadow-2xl z-20">
            {activePanel === 'map' && (
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
            )}

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
        )}
      </main>

      {/* Modals */}
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
        onLogout={() => setIsAuthModalOpen(true)}
      />

      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        onAuthSuccess={loggedUser => {
          setUser(prev => ({ ...prev, ...loggedUser }));
        }}
      />

      <InstallAppModal
        isOpen={isInstallModalOpen}
        onClose={() => setIsInstallModalOpen(false)}
        deferredPrompt={deferredPrompt}
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
    </div>
  );
}

export default App;
