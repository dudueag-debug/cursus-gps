/**
 * Background Location, Screen Wake Lock & Background Navigation Service
 * Supports PWA / Mobile Web background navigation capabilities within browser sandbox rules.
 */

export interface BackgroundNavigationState {
  wakeLockActive: boolean;
  audioBeaconActive: boolean;
  notificationsGranted: boolean;
  isBackgrounded: boolean;
  lastBackgroundTimestamp: number | null;
  error: string | null;
}

type StateListener = (state: BackgroundNavigationState) => void;

class BackgroundLocationService {
  private static instance: BackgroundLocationService;
  private wakeLockSentinel: any = null;
  private audioContext: AudioContext | null = null;
  private audioBeaconTimer: any = null;
  private listeners: Set<StateListener> = new Set();

  private state: BackgroundNavigationState = {
    wakeLockActive: false,
    audioBeaconActive: false,
    notificationsGranted: typeof Notification !== 'undefined' ? Notification.permission === 'granted' : false,
    isBackgrounded: false,
    lastBackgroundTimestamp: null,
    error: null,
  };

  private constructor() {
    this.initVisibilityListener();
  }

  public static getInstance(): BackgroundLocationService {
    if (!BackgroundLocationService.instance) {
      BackgroundLocationService.instance = new BackgroundLocationService();
    }
    return BackgroundLocationService.instance;
  }

  public getState(): BackgroundNavigationState {
    return { ...this.state };
  }

  public subscribe(listener: StateListener): () => void {
    this.listeners.add(listener);
    listener(this.getState());
    return () => this.listeners.delete(listener);
  }

  private notify() {
    const s = this.getState();
    this.listeners.forEach(fn => fn(s));
  }

  /**
   * Screen Wake Lock API (keeps mobile screen turned on during active navigation)
   */
  public async acquireWakeLock(): Promise<boolean> {
    if (typeof navigator === 'undefined' || !('wakeLock' in navigator)) {
      this.state.error = 'Screen Wake Lock API não suportada neste navegador.';
      this.notify();
      return false;
    }

    try {
      this.wakeLockSentinel = await (navigator as any).wakeLock.request('screen');
      this.state.wakeLockActive = true;
      this.state.error = null;

      this.wakeLockSentinel.addEventListener('release', () => {
        this.state.wakeLockActive = false;
        this.notify();
      });

      this.notify();
      return true;
    } catch (err: any) {
      this.state.wakeLockActive = false;
      this.state.error = err.message || 'Falha ao solicitar Wake Lock';
      this.notify();
      return false;
    }
  }

  public async releaseWakeLock(): Promise<void> {
    if (this.wakeLockSentinel) {
      try {
        await this.wakeLockSentinel.release();
      } catch {}
      this.wakeLockSentinel = null;
    }
    this.state.wakeLockActive = false;
    this.notify();
  }

  public isWakeLockActive(): boolean {
    return this.state.wakeLockActive;
  }

  /**
   * Background Audio Beacon (Web Audio API)
   * Plays an inaudible, silent audio pulse every 15s to prevent iOS Safari & Android Chrome
   * from terminating the GPS watchPosition background thread when screen is locked or tab minimized.
   */
  public startBackgroundAudioBeacon(): void {
    if (this.state.audioBeaconActive) return;

    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;

      this.audioContext = new AudioCtx();
      this.state.audioBeaconActive = true;

      // Pulse inaudible buffer every 15 seconds
      this.audioBeaconTimer = setInterval(() => {
        if (!this.audioContext || this.audioContext.state === 'closed') return;
        try {
          if (this.audioContext.state === 'suspended') {
            this.audioContext.resume();
          }
          const osc = this.audioContext.createOscillator();
          const gain = this.audioContext.createGain();
          gain.gain.setValueAtTime(0.0001, this.audioContext.currentTime); // Inaudible gain
          osc.connect(gain);
          gain.connect(this.audioContext.destination);
          osc.start();
          osc.stop(this.audioContext.currentTime + 0.05);
        } catch {}
      }, 15000);

      this.notify();
    } catch {
      this.state.audioBeaconActive = false;
    }
  }

  public stopBackgroundAudioBeacon(): void {
    if (this.audioBeaconTimer) {
      clearInterval(this.audioBeaconTimer);
      this.audioBeaconTimer = null;
    }
    if (this.audioContext) {
      try {
        this.audioContext.close();
      } catch {}
      this.audioContext = null;
    }
    this.state.audioBeaconActive = false;
    this.notify();
  }

  /**
   * Request Web Notifications permission for turn-by-turn alerts when minimized
   */
  public async requestNotificationPermission(): Promise<boolean> {
    if (typeof Notification === 'undefined') return false;

    try {
      const perm = await Notification.requestPermission();
      const granted = perm === 'granted';
      this.state.notificationsGranted = granted;
      this.notify();
      return granted;
    } catch {
      return false;
    }
  }

  /**
   * Dispatches a background navigation alert if the app is currently in background
   */
  public sendBackgroundTurnNotification(
    instruction: string,
    distanceMeters: number,
    eta: string
  ): void {
    if (!this.state.isBackgrounded) return;
    if (typeof Notification === 'undefined' || Notification.permission !== 'granted') return;

    try {
      const distStr = distanceMeters > 1000 ? `${(distanceMeters / 1000).toFixed(1)} km` : `${distanceMeters} m`;
      new Notification('TÔ PASSANDO • Próxima Manobra', {
        body: `Em ${distStr}: ${instruction} • Chegada: ${eta}`,
        icon: '/icon.svg',
        badge: '/icon.svg',
        tag: 'tp-navigation-turn',
        silent: true,
      });
    } catch {}
  }

  private initVisibilityListener(): void {
    if (typeof document === 'undefined') return;

    document.addEventListener('visibilitychange', () => {
      const isHidden = document.hidden;
      this.state.isBackgrounded = isHidden;

      if (isHidden) {
        this.state.lastBackgroundTimestamp = Date.now();
      } else {
        // App returned to foreground: re-acquire wake lock if navigating
        if (this.wakeLockSentinel && !this.state.wakeLockActive) {
          this.acquireWakeLock().catch(() => {});
        }
      }
      this.notify();
    });
  }
}

export const backgroundLocationService = BackgroundLocationService.getInstance();
