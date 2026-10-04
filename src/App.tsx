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
import { useVoiceCommander } from './hooks/useVoiceCommander';
import type { UserProfile, Coordinates, RouteOption, Occurrence, CultureSpot, Place } from './types';
import { api } from './services/api';
import { locationService } from './services/locationService';
import { userService } from './services/userService';

export function App() {
  // Splash Screen State
  const [showSplash, setShowSplash] = useState(true);

  // Detected Brazilian Location Name (City - State)
  const [detectedLocationName, setDetectedLocationName] = useState<string>('Detectando GPS...');

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

  // Geographic Coordinates (Central Brasil / updated via live location)
  const [currentLocation, setCurrentLocation] = useState<Coordinates>({
    lat: -15.793889,
    lng: -47.882778,
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

    // Load active session from isolated user account database
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

    // Auto-detect user's real online location anywhere in Brazil (GPS or IP)
    locationService.detectUserLocation()
      .then(res => {
        setCurrentLocation(res.coordinates);
        setDetectedLocationName(res.formatted);
        setUser(prev => ({
          ...prev,
          detectedCity: res.city,
          detectedState: res.state,
        }));
        // Reload localized alerts and points for user's real Brazilian location
        api.getOccurrences(res.coordinates).then(setOccurrences).catch(console.error);
        api.getCultureSpots(res.coordinates).then(setCultureSpots).catch(console.error);
      })
      .catch(err => {
        console.warn('Detecção de localização aviso:', err);
        setDetectedLocationName('Brasil • GPS Ativo');
      });

    // Continuous Live High-Accuracy GPS Tracking
    let watchId: number | null = null;
    if (typeof navigator !== 'undefined' && 'geolocation' in navigator) {
      try {
        watchId = navigator.geolocation.watchPosition(
          pos => {
            const lat = pos.coords.latitude;
            const lng = pos.coords.longitude;
            if (lat && lng) {
              setCurrentLocation({ lat, lng });
              if (
                pos.coords.heading !== null &&
                !isNaN(pos.coords.heading) &&
                (pos.coords.speed || 0) > 0.5
              ) {
                setHeading(pos.coords.heading);
              }
            }
          },
          err => {
            console.warn('GPS continuous watch notice:', err);
          },
          {
            enableHighAccuracy: true,
            maximumAge: 0,
            timeout: 12000,
          }
        );
      } catch (e) {
        console.warn('Erro ao registrar watchPosition:', e);
      }
    }

    // Listen for real-time heading/orientation if on device
    let handleOrientation: ((e: DeviceOrientationEvent) => void) | null = null;
    if (typeof window !== 'undefined' && 'DeviceOrientationEvent' in window) {
      handleOrientation = (e: DeviceOrientationEvent) => {
        if (e.alpha !== null && !isNaN(e.alpha)) {
          setHeading(360 - e.alpha);
        }
      };
      window.addEventListener('deviceorientation', handleOrientation);
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

    // Record route in user's isolated history
    userService.addRouteToUserHistory(
      user.id,
      detectedLocationName || 'Minha Localização',
      selectedRoute.title || 'Destino TÔ PASSANDO',
      selectedRoute.totalDistanceMeters,
      selectedRoute.totalDurationSeconds
    );

    // Safety Gate: for Car or Motorcycle, open safety checklist first if user hasn't verified
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
        selectedRoute.title || 'Destino TÔ PASSANDO',
        selectedRoute.totalDistanceMeters,
        selectedRoute.totalDurationSeconds
      );
    }
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
        detectedLocation={detectedLocationName}
        onRecenterGPS={() => {
          locationService.detectUserLocation().then(res => {
            setCurrentLocation(res.coordinates);
            setDetectedLocationName(res.formatted);
          });
        }}
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

          {/* Acontecendo na Via - Floating Interactive Card */}
          <ViaCardHUD
            occurrences={occurrences}
            currentLocation={currentLocation}
            onSelectOccurrence={handleSelectOccurrence}
            onOpenReportModal={() => setActivePanel('occurrences')}
            onConfirmOccurrence={(id) => api.confirmOccurrence(id, 'confirm_active').catch(console.error)}
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
