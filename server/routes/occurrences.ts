import { Router, Request, Response } from 'express';
import { authMiddleware, AuthenticatedRequest } from '../middleware/auth';

const router = Router();

// In-memory store for active occurrences
const liveOccurrences: any[] = [
  {
    id: 'occ-live-1',
    category: 'engarrafamento',
    title: 'Trânsito moderado em via expressa',
    description: 'Velocidade média reduzida com fluxo contínuo.',
    locationName: 'Via Principal • Próximo a você',
    coordinates: { lat: -22.9064, lng: -43.1822 },
    sourceType: 'community',
    sourceName: 'Condutores Cursus',
    status: 'relatada_comunidade',
    createdAt: new Date(Date.now() - 1800000).toISOString(),
    updatedAt: new Date().toISOString(),
    confirmationsCount: 14,
    resolvedVotesCount: 1,
    denialsCount: 0,
    severity: 'media',
    affectedLanes: 'Todas as faixas',
    messagesCount: 3,
    isNormalized: false,
    dataOrigin: 'reported',
    confidenceScore: 85,
  },
];

router.get('/', (_req: Request, res: Response) => {
  res.json(liveOccurrences);
});

router.post('/', authMiddleware, (req: AuthenticatedRequest, res: Response) => {
  const { category, title, description, locationName, coordinates, severity, affectedLanes } = req.body;

  if (!category || !title || !coordinates) {
    return res.status(400).json({ error: 'Campos category, title e coordinates são obrigatórios.' });
  }

  const authorName = req.user?.isGuest ? 'Condutor Anônimo' : `Condutor #${req.user?.id.slice(-4)}`;

  const newOcc = {
    id: `occ-${Date.now()}`,
    category,
    title,
    description: description || '',
    locationName: locationName || 'Via Atual',
    coordinates,
    sourceType: 'community',
    sourceName: authorName,
    status: 'relatada_comunidade',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    confirmationsCount: 1,
    resolvedVotesCount: 0,
    denialsCount: 0,
    severity: severity || 'media',
    affectedLanes: affectedLanes || 'Faixa Principal',
    messagesCount: 0,
    isNormalized: false,
    dataOrigin: 'reported',
    confidenceScore: 70,
  };

  liveOccurrences.unshift(newOcc);
  res.status(201).json(newOcc);
});

router.post('/:id/confirm', authMiddleware, (req: Request, res: Response) => {
  const { id } = req.params;
  const { action } = req.body;

  const occ = liveOccurrences.find(o => o.id === id);
  if (!occ) {
    return res.status(404).json({ error: 'Ocorrência não encontrada.' });
  }

  if (action === 'confirm_active') {
    occ.confirmationsCount++;
    occ.confidenceScore = Math.min(99, occ.confidenceScore + 5);
  } else if (action === 'vote_resolved') {
    occ.resolvedVotesCount++;
    if (occ.resolvedVotesCount >= 3) {
      occ.isNormalized = true;
      occ.status = 'resolvida';
    }
  }

  occ.updatedAt = new Date().toISOString();
  res.json({ occurrence: occ, message: 'Confirmação registrada.' });
});

export default router;
