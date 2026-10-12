import { Router, Request, Response } from 'express';
import { PlacesDataService } from '../services/placesDataService';
import { MapProviderService } from '../services/mapProvider';

const router = Router();

// 1. Search places with query, category and configurable radius (Local + Live Provider)
router.get('/search', async (req: Request, res: Response) => {
  const lat = parseFloat(req.query.lat as string);
  const lng = parseFloat(req.query.lng as string);
  const query = req.query.query as string;
  const category = req.query.category as string;
  const radiusKm = parseFloat(req.query.radius as string) || 5;

  // Validate coordinates
  const centerCoords = (!isNaN(lat) && !isNaN(lng)) 
    ? { lat, lng } 
    : { lat: -22.9678, lng: -43.1878 }; // Default to Rio Copacabana if no valid coords

  // 1. Local Audited Places
  const localResults = PlacesDataService.searchPlaces({
    centerCoords,
    query,
    category,
    radiusKm: Math.min(Math.max(radiusKm, 1), 50),
  });

  // 2. Query Live Provider (Google Places or OpenStreetMap Photon) for full nationwide coverage
  let livePlaces: any[] = [];
  let liveProvider = 'none';
  try {
    const liveRes = await MapProviderService.searchLivePlaces({
      centerCoords,
      radiusMeters: radiusKm * 1000,
      query,
      category,
    });
    if (liveRes && liveRes.places) {
      livePlaces = liveRes.places;
      liveProvider = liveRes.provider;
    }
  } catch (err) {
    console.warn('Live places search notice:', err);
  }

  // Combine results with local audited places taking precedence
  const combined = [...localResults];
  const knownNames = new Set(localResults.map(r => r.name.toLowerCase().slice(0, 10)));

  livePlaces.forEach(lp => {
    const prefix = lp.name.toLowerCase().slice(0, 10);
    if (!knownNames.has(prefix)) {
      knownNames.add(prefix);
      combined.push(lp);
    }
  });

  res.json({
    places: combined,
    total: combined.length,
    radiusKm,
    center: centerCoords,
    provider: liveProvider,
    disclaimer: 'Catálogo Cursus GPS com cobertura oficial Rio de Janeiro e mapeamento ao vivo do Brasil.',
  });
});

// 2. Nearby places around center
router.get('/nearby', (req: Request, res: Response) => {
  const lat = parseFloat(req.query.lat as string);
  const lng = parseFloat(req.query.lng as string);
  const category = req.query.category as string;
  const radiusKm = parseFloat(req.query.radius as string) || 2;

  const centerCoords = (!isNaN(lat) && !isNaN(lng)) 
    ? { lat, lng } 
    : { lat: -22.9678, lng: -43.1878 };

  const results = PlacesDataService.searchPlaces({
    centerCoords,
    category,
    radiusKm,
  });

  res.json({
    places: results,
    total: results.length,
    radiusKm,
  });
});

// 3. Category catalog
router.get('/categories', (_req: Request, res: Response) => {
  res.json(PlacesDataService.getCategories());
});

// 4. Specialized Health Units (UPAs, Hospitals, Clinics)
router.get('/health-units', (req: Request, res: Response) => {
  const lat = parseFloat(req.query.lat as string);
  const lng = parseFloat(req.query.lng as string);
  const radiusKm = parseFloat(req.query.radius as string) || 10;

  const centerCoords = (!isNaN(lat) && !isNaN(lng)) 
    ? { lat, lng } 
    : { lat: -22.9678, lng: -43.1878 };

  const results = PlacesDataService.getHealthUnits(centerCoords, radiusKm);
  res.json({
    units: results,
    total: results.length,
    source: 'SMS-Rio / SES-RJ / CNES Data.Rio',
    disclaimer: 'Unidades com localização verificada. Em caso de emergência com risco de vida, ligue 192 (SAMU) ou 193 (Bombeiros).',
  });
});

// 5. Specialized Police Units (Civil, Military, DPO)
router.get('/police-units', (req: Request, res: Response) => {
  const lat = parseFloat(req.query.lat as string);
  const lng = parseFloat(req.query.lng as string);
  const radiusKm = parseFloat(req.query.radius as string) || 10;

  const centerCoords = (!isNaN(lat) && !isNaN(lng)) 
    ? { lat, lng } 
    : { lat: -22.9678, lng: -43.1878 };

  const results = PlacesDataService.getPoliceUnits(centerCoords, radiusKm);
  res.json({
    units: results,
    total: results.length,
    source: 'Polícia Civil do Estado do RJ / PMERJ / ISP Dados',
    disclaimer: 'Unidades fixas confirmadas em fontes oficiais. Em caso de emergência policial imediata, ligue 190.',
  });
});

// 6. Get single place by ID
router.get('/:id', (req: Request, res: Response) => {
  const place = PlacesDataService.getPlaceById(req.params.id);
  if (!place) {
    return res.status(404).json({ error: 'Local não encontrado no catálogo.' });
  }
  res.json(place);
});

export default router;
