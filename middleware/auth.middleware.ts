import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { JWT_SECRET } from '../config/env.js';
import logger from '../utils/logger.js';

// Extended Request with user data
export interface AuthenticatedRequest extends Request {
  user?: {
    privyUserId: string;
    email?: string;
    wallet?: string;
    isAdmin?: boolean;
  };
}

interface JwtPayload {
  sub?: string;
  userId?: string;
  email?: string;
  wallet?: string;
}

/**
 * Verify Privy JWT token
 */
export const verifyPrivyToken = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      res.status(401).json({
        success: false,
        message: 'No authorization token provided'
      });
      return;
    }

    const token = authHeader.replace('Bearer ', '');

    if (!JWT_SECRET) {
      res.status(500).json({
        success: false,
        message: 'Server configuration error'
      });
      return;
    }

    // Verify JWT token
    const decoded = jwt.verify(token, JWT_SECRET) as JwtPayload;

    // Extract Privy user ID
    req.user = {
      privyUserId: decoded.sub || decoded.userId || '',
      email: decoded.email,
      wallet: decoded.wallet
    };

    logger.debug(`Authenticated user: ${req.user.privyUserId}`);
    next();
  } catch (error: any) {
    logger.error('Auth middleware error:', error);

    if (error.name === 'TokenExpiredError') {
      res.status(401).json({
        success: false,
        message: 'Token expired'
      });
      return;
    }

    res.status(401).json({
      success: false,
      message: 'Invalid token'
    });
  }
};

/**
 * Optional auth - doesn't fail if no token
 */
export const optionalAuth = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;

    if (authHeader && JWT_SECRET) {
      const token = authHeader.replace('Bearer ', '');
      const decoded = jwt.verify(token, JWT_SECRET) as JwtPayload;

      req.user = {
        privyUserId: decoded.sub || decoded.userId || '',
        email: decoded.email,
        wallet: decoded.wallet
      };
    }

    next();
  } catch (error) {
    // Continue without auth
    console.warn('Optional auth failed, continuing without user:', error);
    next();
  }
};

/**
 * Require admin role
 */
export const requireAdmin = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  if (!req.user || !req.user.isAdmin) {
    res.status(403).json({
      success: false,
      message: 'Admin access required'
    });
    return;
  }
  next();
};
