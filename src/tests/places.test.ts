import { describe, it, expect, beforeEach } from 'vitest';
import { PlacesDataService, getDistanceMeters } from '../../server/services/placesDataService';
import { userService } from '../services/userService';
import {
  buildWazeEmbedUrl,
  buildWazeDirectNavigationUrl,
  OWNER_REFERENCE_WAZE_DIRECTIONS_URL,
} from '../components/Map/WazeLiveMapView';
import { Coordinates, HomeAddress } from '../types';

describe('Busca Inteligente de Lugares e Serviços (Rule of Truth & Places Service)', () => {
  const centroRio: Coordinates = { lat: -22.9068, lng: -43.1729 }; // Centro do Rio de Janeiro
  const copacabana: Coordinates = { lat: -22.9698, lng: -43.1868 }; // Copacabana
  const duqueDeCaxias: Coordinates = { lat: -22.7858, lng: -43.3049 }; // Duque de Caxias - RJ

  describe('Geodetic Calculations & Radius Filtering', () => {
    it('should compute exact Haversine distance between coordinates', () => {
      const dist = getDistanceMeters(centroRio, copacabana);
      // Distance between Centro and Copacabana is approximately 7.1 km - 7.3 km
      expect(dist).toBeGreaterThan(6500);
      expect(dist).toBeLessThan(8000);
    });

    it('should filter places strictly within 2 km radius', () => {
      const places2km = PlacesDataService.searchPlaces({
        centerCoords: centroRio,
        radiusKm: 2,
      });

      expect(places2km.length).toBeGreaterThan(0);
      places2km.forEach(p => {
        expect(p.distanceMeters).toBeDefined();
        expect(p.distanceMeters!).toBeLessThanOrEqual(2000);
      });
    });

    it('should expand results appropriately when increasing radius from 2 km to 10 km', () => {
      const places2km = PlacesDataService.searchPlaces({
        centerCoords: centroRio,
        radiusKm: 2,
      });
      const places10km = PlacesDataService.searchPlaces({
        centerCoords: centroRio,
        radiusKm: 10,
      });

      expect(places10km.length).toBeGreaterThanOrEqual(places2km.length);
    });
  });

  describe('Official Health & Public Safety Units (Rule of Truth)', () => {
    it('should return verified UPAs and Hospitals with official sources', () => {
      const healthUnits = PlacesDataService.getHealthUnits(centroRio, 15);
      expect(healthUnits.length).toBeGreaterThan(0);

      healthUnits.forEach(unit => {
        expect(['saude', 'upa', 'hospital', 'posto_saude']).toContain(unit.category);
        expect(unit.officialSource).toBeDefined();
        expect(unit.verificationLevel).toBe('oficial_confirmada');
        expect(unit.source).toBe('official');
        expect(unit.isOpen).toBe(true);
      });

      // Verify known official units
      const names = healthUnits.map(u => u.name);
      expect(names.some(n => n.includes('Souza Aguiar') || n.includes('UPA'))).toBe(true);
    });

    it('should return verified Police and Public Safety units with official sources', () => {
      const policeUnits = PlacesDataService.getPoliceUnits(centroRio, 15);
      expect(policeUnits.length).toBeGreaterThan(0);

      policeUnits.forEach(unit => {
        expect(['policia', 'delegacia', 'batalhao', 'dpo']).toContain(unit.category);
        expect(unit.officialSource).toBeDefined();
        expect(unit.verificationLevel).toBe('oficial_confirmada');
      });

      const names = policeUnits.map(u => u.name);
      expect(names.some(n => n.includes('Delegacia') || n.includes('BPM') || n.includes('Polícia'))).toBe(true);
    });

    it('should find universities, BRT terminals, construction stores, car body/paint shops, and penitentiaries', () => {
      // Education (UERJ, UFRJ, CEFET)
      const education = PlacesDataService.searchPlaces({
        centerCoords: centroRio,
        query: 'UERJ',
        radiusKm: 20,
      });
      expect(education.length).toBeGreaterThan(0);
      expect(education[0].category).toBe('faculdade');

      // BRT Terminals
      const brt = PlacesDataService.searchPlaces({
        centerCoords: centroRio,
        category: 'brt_transporte',
        radiusKm: 35,
      });
      expect(brt.length).toBeGreaterThan(0);
      expect(brt.some(b => b.name.includes('Gentileza') || b.name.includes('Alvorada'))).toBe(true);

      // Construction Stores
      const construcao = PlacesDataService.searchPlaces({
        centerCoords: centroRio,
        category: 'material_construcao',
        radiusKm: 35,
      });
      expect(construcao.length).toBeGreaterThan(0);

      // Car painters & body shops (Funilaria e Pintura Automotiva)
      const funilaria = PlacesDataService.searchPlaces({
        centerCoords: centroRio,
        category: 'funilaria_pintura',
        radiusKm: 35,
      });
      expect(funilaria.length).toBeGreaterThan(0);

      // Penitentiaries
      const presidio = PlacesDataService.searchPlaces({
        centerCoords: centroRio,
        category: 'presidio',
        radiusKm: 45,
      });
      expect(presidio.length).toBeGreaterThan(0);
      expect(presidio[0].name).toContain('Gericinó');
    });

    it('should provide verified reference point, Google-style ratings, and real photos with attribution across all catalog items', () => {
      const allPlaces = PlacesDataService.searchPlaces({
        centerCoords: centroRio,
        radiusKm: 50,
      });

      expect(allPlaces.length).toBeGreaterThan(30);
      allPlaces.forEach(p => {
        expect(p.verifiedReferencePoint).toBeDefined();
        expect(p.verifiedReferencePoint!.length).toBeGreaterThan(5);
        expect(p.photoUrl).toMatch(/^https:\/\//);
        expect(p.photoAttribution).toBeDefined();
        expect(p.rating).toBeGreaterThanOrEqual(4.0);
        expect(p.ratingCount).toBeGreaterThan(0);
      });
    });
  });

  describe('Waze Live Map Official Iframe & Deep Links Integration', () => {
    it('should generate official Waze iframe embed URL for Duque de Caxias reference coordinates', () => {
      const embedUrl = buildWazeEmbedUrl(duqueDeCaxias, 14, true);
      expect(embedUrl).toBe(
        'https://embed.waze.com/pt-BR/iframe?zoom=14&lat=-22.7858&lon=-43.3049&pin=1'
      );
    });

    it('should clamp Waze iframe zoom levels between 3 and 17', () => {
      expect(buildWazeEmbedUrl(duqueDeCaxias, 1, false)).toContain('zoom=3');
      expect(buildWazeEmbedUrl(duqueDeCaxias, 22, true)).toContain('zoom=17');
    });

    it('should generate valid Waze Universal Link and Live Map Web Directions URL', () => {
      const universalUrl = buildWazeDirectNavigationUrl(duqueDeCaxias);
      expect(universalUrl).toBe(
        'https://waze.com/ul?ll=-22.7858,-43.3049&navigate=yes&zoom=15'
      );

      const directionsUrl = buildWazeDirectNavigationUrl(duqueDeCaxias, centroRio);
      expect(directionsUrl).toContain(
        'https://www.waze.com/pt-BR/live-map/directions?to=ll.-22.7858%2C-43.3049'
      );
      expect(directionsUrl).toContain(
        'from=ll.-22.9068%2C-43.1729'
      );
      expect(OWNER_REFERENCE_WAZE_DIRECTIONS_URL).toBe(
        'https://www.waze.com/pt-BR/live-map/directions/duque-de-caxias-rj-br?to=place.ChIJ9Tjo--1ymQARKqWAwmCwK2c&from=place.ChIJRz4gQ_9fmQARGPQX8apoghE'
      );
    });
  });

  describe('Search Query Normalization & Deduplication', () => {
    it('should match case-insensitively and ignore accents/diacritics', () => {
      const queryWithAccents = PlacesDataService.searchPlaces({
        centerCoords: centroRio,
        query: 'farmácia',
        radiusKm: 15,
      });

      const queryWithoutAccents = PlacesDataService.searchPlaces({
        centerCoords: centroRio,
        query: 'farmacia',
        radiusKm: 15,
      });

      expect(queryWithAccents.length).toBe(queryWithoutAccents.length);
      expect(queryWithAccents.length).toBeGreaterThan(0);
    });

    it('should sort results strictly by real distance (closest first)', () => {
      const results = PlacesDataService.searchPlaces({
        centerCoords: centroRio,
        radiusKm: 15,
      });

      for (let i = 1; i < results.length; i++) {
        expect(results[i].distanceMeters!).toBeGreaterThanOrEqual(results[i - 1].distanceMeters!);
      }
    });
  });

  describe('Home Address Privacy & Isolation (Never inferred automatically)', () => {
    const testUserId = 'user_test_privacy_001';

    beforeEach(() => {
      userService.clearHomeAddress(testUserId);
    });

    it('should return null if user has not explicitly configured a home address', () => {
      const home = userService.getHomeAddress(testUserId);
      expect(home).toBeNull();
    });

    it('should save and retrieve explicit home address with coordinates', () => {
      const myHome: HomeAddress = {
        address: 'Rua Barata Ribeiro, 200 - Copacabana, Rio de Janeiro',
        street: 'Rua Barata Ribeiro',
        number: '200',
        neighborhood: 'Copacabana',
        city: 'Rio de Janeiro',
        state: 'RJ',
        cep: '22040-002',
        formattedAddress: 'Rua Barata Ribeiro, 200 - Copacabana, Rio de Janeiro',
        coordinates: { lat: -22.9691, lng: -43.1843 },
        savedAt: new Date().toISOString(),
      };

      userService.setHomeAddress(testUserId, myHome);

      const retrieved = userService.getHomeAddress(testUserId);
      expect(retrieved).not.toBeNull();
      expect(retrieved?.street).toBe('Rua Barata Ribeiro');
      expect(retrieved?.coordinates.lat).toBe(-22.9691);
      expect(retrieved?.coordinates.lng).toBe(-43.1843);
    });

    it('should allow clearing home address (LGPD right to erasure)', () => {
      const myHome: HomeAddress = {
        address: 'Rua das Laranjeiras, Rio de Janeiro',
        street: 'Rua das Laranjeiras',
        city: 'Rio de Janeiro',
        coordinates: { lat: -22.935, lng: -43.19 },
        savedAt: new Date().toISOString(),
      };

      userService.setHomeAddress(testUserId, myHome);
      expect(userService.getHomeAddress(testUserId)).not.toBeNull();

      userService.clearHomeAddress(testUserId);
      expect(userService.getHomeAddress(testUserId)).toBeNull();
    });
  });
});

