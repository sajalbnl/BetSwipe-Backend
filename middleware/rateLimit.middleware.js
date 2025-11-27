import rateLimit from 'express-rate-limit';
import logger from '../utils/logger.js';

/**
 * General API rate limiter
 */
export const apiLimiter = rateLimit({
    windowMs: 60 * 1000, // 1 minute
    max: 100, // 100 requests per minute
    message: 'Too many requests, please try again later',
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req, res) => {
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
    keyGenerator: (req) => {
        // Rate limit per user, not IP
        return req.user?.privyUserId || req.ip;
    },
    handler: (req, res) => {
        logger.warn(`Trade rate limit exceeded for user: ${req.user?.privyUserId || req.ip}`);
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
    handler: (req, res) => {
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
    keyGenerator: (req) => {
        return req.body?.privyUserId || req.ip;
    },
    handler: (req, res) => {
        logger.warn(`Wallet creation rate limit exceeded for: ${req.body?.privyUserId || req.ip}`);
        res.status(429).json({
            success: false,
            message: 'Wallet already created. Please wait before trying again.'
        });
    }
});