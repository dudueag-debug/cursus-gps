import type { UserProfile, RouteOption, Place, Occurrence } from '../types';

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

export const userService = {
  getAccounts(): UserAccount[] {
    try {
      const data = localStorage.getItem(ACCOUNTS_KEY);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  },

  getActiveSession(): UserProfile | null {
    try {
      const activeId = localStorage.getItem(ACTIVE_SESSION_KEY);
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
        privacy: {
          shareLocationWithCommunity: true,
          saveRouteHistory: true,
          anonymousReports: false,
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
      const raw = localStorage.getItem(key);
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
      localStorage.setItem(`tp_userdata_${userId}`, JSON.stringify(updated));
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
      localStorage.setItem(ACCOUNTS_KEY, JSON.stringify(accounts));

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

    localStorage.setItem(ACTIVE_SESSION_KEY, existing.id);
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

    localStorage.setItem(ACTIVE_SESSION_KEY, acc.id);
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
    localStorage.setItem(ACCOUNTS_KEY, JSON.stringify(accounts));
    localStorage.setItem(ACTIVE_SESSION_KEY, guestId);

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
    localStorage.removeItem(ACTIVE_SESSION_KEY);
  },

  addRouteToUserHistory(userId: string, origin: string, destination: string, dist: number, dur: number) {
    const data = this.getUserPrivateData(userId);
    data.routeHistory.unshift({
      id: `rt-hist-${Date.now()}`,
      originName: origin,
      destName: destination,
      timestamp: new Date().toISOString(),
      distanceMeters: dist,
      durationSeconds: dur,
    });
    // Keep max 30 routes per user database
    if (data.routeHistory.length > 30) data.routeHistory.pop();
    this.saveUserPrivateData(userId, { routeHistory: data.routeHistory });
  },
};
