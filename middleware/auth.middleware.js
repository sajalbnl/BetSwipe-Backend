import jwt from 'jsonwebtoken';
import { JWT_SECRET, } from '../config/env.js';
import logger from '../utils/logger.js';

/**
 * Verify Privy JWT token
 */
export const verifyPrivyToken = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        
        if (!authHeader) {
            return res.status(401).json({
                success: false,
                message: 'No authorization token provided'
            });
        }

        const token = authHeader.replace('Bearer ', '');
        
        // Verify JWT token
        const decoded = jwt.verify(token, JWT_SECRET);
        
        // Extract Privy user ID
        req.user = {
            privyUserId: decoded.sub || decoded.userId,
            email: decoded.email,
            wallet: decoded.wallet
        };

        logger.debug(`Authenticated user: ${req.user.privyUserId}`);
        next();
    } catch (error) {
        logger.error('Auth middleware error:', error);
        
        if (error.name === 'TokenExpiredError') {
            return res.status(401).json({
                success: false,
                message: 'Token expired'
            });
        }

        return res.status(401).json({
            success: false,
            message: 'Invalid token'
        });
    }
};

/**
 * Optional auth - doesn't fail if no token
 */
export const optionalAuth = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        
        if (authHeader) {
            const token = authHeader.replace('Bearer ', '');
            const decoded = jwt.verify(token, JWT_SECRET);
            
            req.user = {
                privyUserId: decoded.sub || decoded.userId,
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
export const requireAdmin = async (req, res, next) => {
    if (!req.user || !req.user.isAdmin) {
        return res.status(403).json({
            success: false,
            message: 'Admin access required'
        });
    }
    next();
};