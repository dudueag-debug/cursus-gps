import { Router, Request, Response } from 'express';
import { MapProviderService } from '../services/mapProvider';
import { strictRoutingRateLimit } from '../middleware/rateLimit';

const router = Router();

router.use(strictRoutingRateLimit);

router.post('/calculate', async (req: Request, res: Response) => {
  const { origin, destination, mode, avoidTolls } = req.body;

  if (!origin || !destination || typeof origin.lat !== 'number' || typeof destination.lat !== 'number') {
    return res.status(400).json({ error: 'Parâmetros origin e destination (lat/lng) são obrigatórios.' });
  }

  try {
    const result = await MapProviderService.calculateRoute({
      origin,
      destination,
      mode: mode || 'car',
      avoidTolls: Boolean(avoidTolls),
    });

    res.json(result);
  } catch (error: any) {
    res.status(502).json({ error: 'Erro ao calcular trajeto via motor cartográfico', details: error?.message });
  }
});

export default router;
