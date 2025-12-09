import { Request, Response, NextFunction } from 'express';
import logger from './logger.js';

/**
 * Custom error class
 */
export class AppError extends Error {
    code: string;
    statusCode: number;
    details: any;
    isOperational: boolean;

    constructor(message: string, code: string, statusCode: number = 500, details: any = null) {
        super(message);
        this.name = 'AppError';
        this.code = code;
        this.statusCode = statusCode;
        this.details = details;
        this.isOperational = true;

        Error.captureStackTrace(this, this.constructor);
    }
}

/**
 * Error codes
 */
export const ErrorCodes = {
    // Auth errors
    UNAUTHORIZED: 'UNAUTHORIZED',
    TOKEN_EXPIRED: 'TOKEN_EXPIRED',
    SESSION_EXPIRED: 'SESSION_EXPIRED',

    // Wallet errors
    WALLET_NOT_FOUND: 'WALLET_NOT_FOUND',
    INSUFFICIENT_BALANCE: 'INSUFFICIENT_BALANCE',
    INSUFFICIENT_MATIC: 'INSUFFICIENT_MATIC',

    // Trade errors
    TRADE_FAILED: 'TRADE_FAILED',
    ORDER_REJECTED: 'ORDER_REJECTED',
    MARKET_CLOSED: 'MARKET_CLOSED',
    INVALID_AMOUNT: 'INVALID_AMOUNT',

    // System errors
    DATABASE_ERROR: 'DATABASE_ERROR',
    BLOCKCHAIN_ERROR: 'BLOCKCHAIN_ERROR',
    EXTERNAL_API_ERROR: 'EXTERNAL_API_ERROR',

    // Validation errors
    VALIDATION_ERROR: 'VALIDATION_ERROR',
    INVALID_INPUT: 'INVALID_INPUT',
} as const;

/**
 * Handle async errors
 */
export const asyncHandler = (fn: Function) => {
    return (req: Request, res: Response, next: NextFunction) => {
        Promise.resolve(fn(req, res, next)).catch(next);
    };
};

/**
 * Format error response
 */
export const formatErrorResponse = (error: AppError | any) => {
    // Never expose sensitive information
    const response = {
        success: false,
        error: {
            code: error.code || 'UNKNOWN_ERROR',
            message: error.message || 'An unexpected error occurred',
        }
    };

    // Add details in development mode
    if (process.env.NODE_ENV === 'development' && error.details) {
        (response.error as any).details = error.details;
    }

    return response;
};

/**
 * Global error handler middleware
 */
export const globalErrorHandler = (err: any, req: Request, res: Response, next: NextFunction) => {
    let error = { ...err };
    error.message = err.message;

    // Log error
    logger.error(`Error: ${error.message}`, {
        error: err,
        request: {
            method: req.method,
            url: req.url,
            body: req.body,
            user: (req as any).user?.privyUserId
        }
    });

    // Mongoose validation error
    if (err.name === 'ValidationError') {
        const message = Object.values(err.errors).map((e: any) => e.message).join(', ');
        error = new AppError(message, ErrorCodes.VALIDATION_ERROR, 400);
    }

    // Mongoose duplicate key error
    if (err.code === 11000) {
        const field = Object.keys(err.keyValue)[0];
        error = new AppError(
            `${field} already exists`,
            ErrorCodes.VALIDATION_ERROR,
            400
        );
    }

    // JWT errors
    if (err.name === 'JsonWebTokenError') {
        error = new AppError('Invalid token', ErrorCodes.UNAUTHORIZED, 401);
    }

    if (err.name === 'TokenExpiredError') {
        error = new AppError('Token expired', ErrorCodes.TOKEN_EXPIRED, 401);
    }

    // Send error response
    res.status(error.statusCode || 500).json(formatErrorResponse(error));
};

/**
 * Handle unhandled promise rejections
 */
export const handleUnhandledRejection = (): void => {
    process.on('unhandledRejection', (err: any) => {
        logger.error('Unhandled Promise Rejection:', err);
        // In production, you might want to gracefully shut down
        if (process.env.NODE_ENV === 'production') {
            // Close server & exit process
            process.exit(1);
        }
    });
};

/**
 * Handle uncaught exceptions
 */
export const handleUncaughtException = (): void => {
    process.on('uncaughtException', (err: Error) => {
        logger.error('Uncaught Exception:', err);
        // Must exit after uncaught exception
        process.exit(1);
    });
};
