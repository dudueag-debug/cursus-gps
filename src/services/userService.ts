import type { UserProfile, RouteOption, Place, Occurrence, HomeAddress } from '../types';

export interface UserPrivateData {
  routeHistory: {
    id: string;
    originName: string;
    destName: string;
    timestamp: string;
    distanceMeters: number;
    durationSeconds: number;
  }[];
  favoritePlaces: Place[];
  userOccurrences: Occurrence[];
  preferences: Partial<UserProfile>;
  homeAddress?: HomeAddress | null;
}

export interface UserAccount {
  id: string;
  name: string;
  username: string;
  email: string;
  phone?: string;
  createdAt: string;
  isGuest: boolean;
}

const ACCOUNTS_KEY = 'tp_accounts_db';
const ACTIVE_SESSION_KEY = 'tp_active_session_user';

// Isomorphic storage helper (supports both browser window.localStorage and Node/Vitest in-memory fallback)
const inMemoryStore = new Map<string, string>();
const safeStorage = {
  getItem(key: string): string | null {
    if (typeof window !== 'undefined' && typeof window.localStorage !== 'undefined') {
      try {
        return window.localStorage.getItem(key);
      } catch {}
    }
    return inMemoryStore.get(key) ?? null;
  },
  setItem(key: string, value: string): void {
    if (typeof window !== 'undefined' && typeof window.localStorage !== 'undefined') {
      try {
        window.localStorage.setItem(key, value);
        return;
      } catch {}
    }
    inMemoryStore.set(key, value);
  },
  removeItem(key: string): void {
    if (typeof window !== 'undefined' && typeof window.localStorage !== 'undefined') {
      try {
        window.localStorage.removeItem(key);
        return;
      } catch {}
    }
    inMemoryStore.delete(key);
  },
};

export const userService = {
  getAccounts(): UserAccount[] {
    try {
      const data = safeStorage.getItem(ACCOUNTS_KEY);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  },

  getActiveSession(): UserProfile | null {
    try {
      const activeId = safeStorage.getItem(ACTIVE_SESSION_KEY);
      if (!activeId) return null;

      const accounts = this.getAccounts();
      const acc = accounts.find(a => a.id === activeId);
      if (!acc) return null;

      const privateData = this.getUserPrivateData(acc.id);
      return {
        id: acc.id,
        name: acc.name,
        username: acc.username,
        email: acc.email,
        phone: acc.phone,
        isGuest: acc.isGuest,
        preferredMode: (privateData.preferences?.preferredMode as any) || 'car',
        vehicleModel: privateData.preferences?.vehicleModel || 'sport',
        vehicleColor: privateData.preferences?.vehicleColor || 'lime',
        enableWindEffect: privateData.preferences?.enableWindEffect ?? true,
        enableVoiceInstructions: privateData.preferences?.enableVoiceInstructions ?? true,
        enableCultureAudio: privateData.preferences?.enableCultureAudio ?? true,
        selectedVoiceURI: privateData.preferences?.selectedVoiceURI,
        voiceRate: privateData.preferences?.voiceRate || 1.05,
        mapLayerType: privateData.preferences?.mapLayerType || 'streets',
        is3DMode: privateData.preferences?.is3DMode || false,
        themeMode: 'dark',
        homeAddress: privateData.homeAddress || null,
        privacy: {
          shareLocationWithCommunity: true,
          saveRouteHistory: true,
          anonymousReports: false,
          locationPermissionGranted: true,
          ...privateData.preferences?.privacy,
        },
        accessibility: {
          highContrast: false,
          reducedMotion: false,
          largerText: false,
          ...privateData.preferences?.accessibility,
        },
      };
    } catch {
      return null;
    }
  },

  getUserPrivateData(userId: string): UserPrivateData {
    try {
      const key = `tp_userdata_${userId}`;
      const raw = safeStorage.getItem(key);
      if (raw) return JSON.parse(raw);
    } catch {}
    return {
      routeHistory: [],
      favoritePlaces: [],
      userOccurrences: [],
      preferences: {},
    };
  },

  saveUserPrivateData(userId: string, data: Partial<UserPrivateData>) {
    try {
      const current = this.getUserPrivateData(userId);
      const updated: UserPrivateData = { ...current, ...data };
      safeStorage.setItem(`tp_userdata_${userId}`, JSON.stringify(updated));
    } catch (e) {
      console.warn('Erro ao salvar dados privados do usuário:', e);
    }
  },

  register(name: string, email: string, phone?: string): UserProfile {
    const accounts = this.getAccounts();
    const cleanEmail = email.trim().toLowerCase();
    
    // Check if account already exists
    let existing = accounts.find(a => a.email === cleanEmail);
    if (!existing) {
      const newId = `usr_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
      const newUsername = cleanEmail.split('@')[0].replace(/[^a-zA-Z0-9_]/g, '') || `piloto_${newId.slice(-4)}`;
      existing = {
        id: newId,
        name: name.trim() || newUsername,
        username: newUsername,
        email: cleanEmail,
        phone: phone?.trim(),
        createdAt: new Date().toISOString(),
        isGuest: false,
      };
      accounts.push(existing);
      safeStorage.setItem(ACCOUNTS_KEY, JSON.stringify(accounts));

      // Initialize empty isolated database for this new user
      this.saveUserPrivateData(newId, {
        routeHistory: [],
        favoritePlaces: [],
        userOccurrences: [],
        preferences: {
          vehicleModel: 'sport',
          vehicleColor: 'lime',
        },
      });
    }

    safeStorage.setItem(ACTIVE_SESSION_KEY, existing.id);
    return this.getActiveSession()!;
  },

  login(identifier: string): UserProfile {
    const clean = identifier.trim().toLowerCase();
    const accounts = this.getAccounts();
    let acc = accounts.find(a => a.email === clean || a.username === clean);

    if (!acc) {
      // Auto-register first time user
      return this.register(clean.split('@')[0], clean);
    }

    safeStorage.setItem(ACTIVE_SESSION_KEY, acc.id);
    return this.getActiveSession()!;
  },

  createGuestSession(): UserProfile {
    const guestId = `guest_${Date.now()}`;
    const guestAcc: UserAccount = {
      id: guestId,
      name: 'Visitante Brasil',
      username: `guest_${guestId.slice(-4)}`,
      email: 'visitante@topassando.com.br',
      createdAt: new Date().toISOString(),
      isGuest: true,
    };

    const accounts = this.getAccounts();
    accounts.push(guestAcc);
    safeStorage.setItem(ACCOUNTS_KEY, JSON.stringify(accounts));
    safeStorage.setItem(ACTIVE_SESSION_KEY, guestId);

    this.saveUserPrivateData(guestId, {
      routeHistory: [],
      favoritePlaces: [],
      userOccurrences: [],
      preferences: {
        vehicleModel: 'sport',
        vehicleColor: 'lime',
      },
    });

    return this.getActiveSession()!;
  },

  logout() {
    safeStorage.removeItem(ACTIVE_SESSION_KEY);
  },

  /**
   * Safely adds a route to user history with duplicate suppression and privacy protection
   */
  addRouteToUserHistory(userId: string, origin: string, destination: string, dist: number, dur: number) {
    if (!userId) return;

    const data = this.getUserPrivateData(userId);

    // Privacy Guard (LGPD): if user disabled route history saving, respect their choice
    if (data.preferences?.privacy?.saveRouteHistory === false) {
      return;
    }

    const now = Date.now();
    const cleanOrigin = origin.trim();
    const cleanDest = destination.trim();

    // Check for recent duplicate (same origin & destination within the last 180 seconds)
    const existingIndex = data.routeHistory.findIndex(item => {
      const isSameRoute = item.originName === cleanOrigin && item.destName === cleanDest;
      const itemAgeMs = now - new Date(item.timestamp).getTime();
      return isSameRoute && itemAgeMs < 180000;
    });

    if (existingIndex !== -1) {
      // Update the existing entry instead of creating a duplicate
      data.routeHistory[existingIndex] = {
        ...data.routeHistory[existingIndex],
        timestamp: new Date().toISOString(),
        distanceMeters: dist,
        durationSeconds: dur,
      };
    } else {
      // Add fresh route history item
      data.routeHistory.unshift({
        id: `rt-hist-${now}`,
        originName: cleanOrigin,
        destName: cleanDest,
        timestamp: new Date().toISOString(),
        distanceMeters: dist,
        durationSeconds: dur,
      });

      // Keep max 30 routes per user database
      if (data.routeHistory.length > 30) {
        data.routeHistory.pop();
      }
    }

    this.saveUserPrivateData(userId, { routeHistory: data.routeHistory });
  },

  /**
   * Remove a single route item from user history
   */
  deleteRouteHistoryItem(userId: string, historyId: string) {
    const data = this.getUserPrivateData(userId);
    data.routeHistory = data.routeHistory.filter(h => h.id !== historyId);
    this.saveUserPrivateData(userId, { routeHistory: data.routeHistory });
  },

  /**
   * Clear all route history for the user (LGPD right to erasure)
   */
  clearRouteHistory(userId: string) {
    this.saveUserPrivateData(userId, { routeHistory: [] });
  },

  /**
   * Update user privacy preferences
   */
  updatePrivacySettings(userId: string, privacy: Partial<UserProfile['privacy']>) {
    const data = this.getUserPrivateData(userId);
    const updatedPreferences = {
      ...data.preferences,
      privacy: {
        shareLocationWithCommunity: true,
        saveRouteHistory: true,
        anonymousReports: false,
        locationPermissionGranted: true,
        ...data.preferences?.privacy,
        ...privacy,
      },
    };
    this.saveUserPrivateData(userId, { preferences: updatedPreferences });
  },

  /**
   * Provides anonymous driver alias when privacy settings request anonymity
   */
  getDisplayAuthorName(user: UserProfile | null): string {
    if (!user) return 'Condutor Anônimo';
    if (user.privacy?.anonymousReports || user.isGuest) {
      const suffix = user.id ? user.id.slice(-4) : 'BR';
      return `Condutor Anônimo #${suffix}`;
    }
    return user.name || user.username || 'Condutor Cursus';
  },

  /**
   * Explicitly sets user home address (never assumed automatically)
   */
  setHomeAddress(userId: string, home: HomeAddress) {
    if (!userId) return;
    this.saveUserPrivateData(userId, { homeAddress: home });
  },

  /**
   * Retrieves explicitly saved home address
   */
  getHomeAddress(userId: string): HomeAddress | null {
    if (!userId) return null;
    const data = this.getUserPrivateData(userId);
    return data.homeAddress || null;
  },

  /**
   * Removes saved home address (LGPD right to erasure)
   */
  clearHomeAddress(userId: string) {
    if (!userId) return;
    this.saveUserPrivateData(userId, { homeAddress: null });
  },
};
