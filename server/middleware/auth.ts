import { Request, Response, NextFunction } from 'express';

export interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    email?: string;
    role: string;
    isGuest: boolean;
  };
}

/**
 * Authentication middleware with support for Bearer tokens and Guest sessions
 */
export function authMiddleware(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;

  // Guest / Anonymous fallback if no header provided
  if (!authHeader) {
    req.user = {
      id: 'guest_session',
      role: 'guest',
      isGuest: true,
    };
    return next();
  }

  const [scheme, token] = authHeader.split(' ');
  if (scheme !== 'Bearer' || !token) {
    return res.status(401).json({ error: 'Token de autenticação inválido ou mal formatado' });
  }

  // Support test & authenticated tokens
  if (token.startsWith('usr_') || token.startsWith('test_') || token.length > 8) {
    req.user = {
      id: token,
      role: 'driver',
      isGuest: false,
    };
    return next();
  }

  return res.status(403).json({ error: 'Sessão expirada ou não autorizada' });
}
