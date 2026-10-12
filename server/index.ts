import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import { standardRateLimit } from './middleware/rateLimit';
import healthRoutes from './routes/health';
import routingRoutes from './routes/routing';
import occurrencesRoutes from './routes/occurrences';
import placesRoutes from './routes/places';

const app = express();
const PORT = process.env.PORT || 3001;

// Global Middleware
app.use(cors());
app.use(express.json());
app.use(standardRateLimit);

// Modular Routes
app.use('/api/health', healthRoutes);
app.use('/api/routes', routingRoutes);
app.use('/api/occurrences', occurrencesRoutes);
app.use('/api/places', placesRoutes);

// Root Welcome & Discovery
app.get('/api', (_req: Request, res: Response) => {
  res.json({
    name: 'CURSUS GPS Backend Engine API',
    version: '2.0.0',
    documentation: '/api/health',
    endpoints: [
      'GET  /api/health',
      'POST /api/routes/calculate',
      'GET  /api/occurrences',
      'POST /api/occurrences',
      'POST /api/occurrences/:id/confirm',
    ],
  });
});

// Centralized JSON Error Handler
app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
  console.error('[Server Error]:', err);
  res.status(err.status || 500).json({
    error: err.message || 'Erro interno do servidor',
    timestamp: new Date().toISOString(),
  });
});

// Start Server when invoked directly
if (process.env.NODE_ENV !== 'test') {
  app.listen(PORT, () => {
    console.log(`[CURSUS GPS Server] Rodando na porta ${PORT}`);
  });
}

export default app;
