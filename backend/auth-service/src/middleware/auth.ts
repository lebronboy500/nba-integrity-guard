/**
 * Authentication Middleware
 */

import { Request, Response, NextFunction } from 'express';
import { verifyAccessToken, JWTPayload } from '../utils/jwt';

// Extend Express Request type
declare global {
  namespace Express {
    interface Request {
      user?: JWTPayload;
      userId?: number;
    }
  }
}

/**
 * Authenticate JWT token
 */
export function authenticateToken(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

  if (!token) {
    res.status(401).json({ error: 'Access token required' });
    return;
  }

  try {
    const payload = verifyAccessToken(token);
    req.user = payload;
    req.userId = payload.userId;
    next();
  } catch (error) {
    res.status(403).json({ error: 'Invalid or expired token' });
    return;
  }
}

/**
 * Optional authentication (doesn't fail if no token)
 */
export function optionalAuth(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (token) {
    try {
      const payload = verifyAccessToken(token);
      req.user = payload;
      req.userId = payload.userId;
    } catch (error) {
      // Token invalid, but don't fail - just continue without auth
    }
  }

  next();
}

/**
 * Verify user owns resource
 */
export function authorizeUser(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  const userId = parseInt(req.params.userId || req.params.id);

  if (!req.userId || req.userId !== userId) {
    res.status(403).json({ error: 'Access denied' });
    return;
  }

  next();
}
