import { Request, Response, NextFunction } from 'express';
import { verifyToken, extractTokenFromHeader, JwtPayload } from '../utils/jwt';
import { SessionService } from '../services/sessionService';

export interface AuthenticatedRequest extends Request {
  user?: JwtPayload;
  sessionId?: string;
}

const sessionService = new SessionService();

export const authenticateToken = (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  const token = extractTokenFromHeader(req.headers.authorization);
  
  if (!token) {
    return res.status(401).json({ message: 'Access token required' });
  }

  try {
    const payload = verifyToken(token);
    
    // Check if session exists and is active
    const sessionId = req.headers['x-session-id'] as string;
    if (sessionId) {
      const session = sessionService.getSession(sessionId);
      if (!session || session.userId !== payload.userId) {
        return res.status(401).json({ message: 'Invalid or expired session' });
      }
      
      // Update session activity
      sessionService.updateSessionActivity(sessionId);
      req.sessionId = sessionId;
    }
    
    req.user = payload;
    next();
  } catch (error) {
    return res.status(403).json({ message: 'Invalid or expired token' });
  }
};

export const requireAdmin = (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  if (!req.user) {
    return res.status(401).json({ message: 'Authentication required' });
  }

  if (req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Admin access required' });
  }

  next();
};

export const requireClient = (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  if (!req.user) {
    return res.status(401).json({ message: 'Authentication required' });
  }

  if (req.user.role !== 'client') {
    return res.status(403).json({ message: 'Client access required' });
  }

  next();
};
