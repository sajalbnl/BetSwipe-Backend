import { Request, Response } from 'express';
import rateLimit from 'express-rate-limit';
import logger from '../utils/logger.js';
import { AuthenticatedRequest } from './auth.middleware.js';

/**
 * General API rate limiter
 */
export const apiLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 100, // 100 requests per minute
  message: 'Too many requests, please try again later',
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req: Request, res: Response): void => {
    logger.warn(`Rate limit exceeded for IP: ${req.ip}`);
    res.status(429).json({
      success: false,
      message: 'Too many requests, please try again later'
    });
  }
});

/**
 * Strict rate limiter for trades
 */
export const tradeLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 10, // 10 trades per minute
  message: 'Trade rate limit exceeded',
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req: Request): string => {
    // Rate limit per user, not IP
    return (req as AuthenticatedRequest).user?.privyUserId || req.ip || 'unknown';
  },
  handler: (req: Request, res: Response): void => {
    const authReq = req as AuthenticatedRequest;
    logger.warn(`Trade rate limit exceeded for user: ${authReq.user?.privyUserId || req.ip}`);
    res.status(429).json({
      success: false,
      message: 'Too many trades, please wait before placing another bet'
    });
  }
});

/**
 * Auth endpoints rate limiter
 */
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 requests per 15 minutes
  message: 'Too many authentication attempts',
  skipSuccessfulRequests: true, // Don't count successful requests
  handler: (req: Request, res: Response): void => {
    logger.warn(`Auth rate limit exceeded for IP: ${req.ip}`);
    res.status(429).json({
      success: false,
      message: 'Too many authentication attempts, please try again later'
    });
  }
});

/**
 * Wallet creation rate limiter
 */
export const walletCreationLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 1, // 1 wallet creation per hour per user
  keyGenerator: (req: Request): string => {
    return req.body?.privyUserId || req.ip || 'unknown';
  },
  handler: (req: Request, res: Response): void => {
    logger.warn(`Wallet creation rate limit exceeded for: ${req.body?.privyUserId || req.ip}`);
    res.status(429).json({
      success: false,
      message: 'Wallet already created. Please wait before trying again.'
    });
  }
});
