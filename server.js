console.log("Starting the server...");

import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import mongoose from 'mongoose';

// Routes
import categoryRouter from './routes/categoryRoutes.js';
import walletRouter from './routes/walletRoutes.js';
import tradeRouter from './routes/tradeRoutes.js';
import positionRouter from './routes/positionRoutes.js';

// Database
import connectToDB from './database/mongodb.js';

// Config
import { PORT, NODE_ENV } from './config/env.js';
import { initializeClobClient } from './config/polymarket.js';

// Jobs
import jobScheduler from './jobs/scheduler.js';

// Middleware
import { apiLimiter } from './middleware/rateLimit.middleware.js';
import { sanitizeInput } from './middleware/validation.middleware.js';

// Utils
import logger from './utils/logger.js';
import { 
    globalErrorHandler, 
    handleUnhandledRejection, 
    handleUncaughtException 
} from './utils/errorHandler.js';

const app = express();

// Setup error handlers for uncaught errors
handleUnhandledRejection();
handleUncaughtException();

// Middleware
app.use(cors({
    origin: NODE_ENV === 'production' 
        ? ['https://your-frontend-domain.com'] // Update with your actual frontend URL
        : '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// HTTP request logger
app.use(morgan('combined', { stream: logger.stream }));

// Global middleware
app.use(sanitizeInput); // Sanitize all inputs
app.use(apiLimiter); // Rate limiting

// Health check endpoint
app.get('/', (req, res) => {
    res.json({ 
        status: 'OK', 
        message: 'BetSwipe API Server',
        timestamp: new Date().toISOString(),
        environment: NODE_ENV,
        version: '1.0.0'
    });
});

// Health check with more details
app.get('/health', async (req, res) => {
    try {
        // Check database connection
        const dbStatus = mongoose.connection.readyState === 1 ? 'connected' : 'disconnected';
        
        // Get job scheduler status
        const jobsStatus = jobScheduler.getStatus();
        
        res.json({
            status: 'OK',
            timestamp: new Date().toISOString(),
            environment: NODE_ENV,
            database: dbStatus,
            jobs: jobsStatus,
            uptime: process.uptime()
        });
    } catch (error) {
        res.status(503).json({
            status: 'ERROR',
            message: 'Health check failed',
            error: error.message
        });
    }
});

// API Routes
app.use('/api/categories', categoryRouter);
app.use('/api/wallet', walletRouter);
app.use('/api/trade', tradeRouter);
app.use('/api/positions', positionRouter);

// 404 handler
app.use((req, res) => {
    res.status(404).json({
        success: false,
        message: `Route ${req.originalUrl} not found`
    });
});

// Global error handling middleware (must be last)
app.use(globalErrorHandler);

// Initialize and start server
const startServer = async () => {
    try {
        // Connect to MongoDB
        await connectToDB();
        logger.info('MongoDB connected successfully');

        // Initialize Polymarket client
        try {
            initializeClobClient();
            logger.info('Polymarket CLOB client initialized');
        } catch (error) {
            logger.error('Failed to initialize Polymarket client:', error);
            // Continue without Polymarket if it fails (for development)
            if (NODE_ENV === 'production') {
                throw error;
            }
        }

        // Initialize background jobs
        jobScheduler.initialize();
        
        // Start background jobs only in production or if explicitly enabled
        if (NODE_ENV === 'production' || process.env.ENABLE_JOBS === 'true') {
            jobScheduler.start();
            logger.info('Background jobs started');
        } else {
            logger.info('Background jobs disabled in development (set ENABLE_JOBS=true to enable)');
        }

        // Start Express server
        const server = app.listen(PORT, () => {
            logger.info(`🚀 Server is running on port ${PORT}`);
            logger.info(`📍 API available at http://localhost:${PORT}/api`);
            logger.info(`🌍 Environment: ${NODE_ENV}`);
            logger.info(`📊 Jobs status: ${jobScheduler.isRunning ? 'Running' : 'Stopped'}`);
        });

        // Graceful shutdown handler
        const gracefulShutdown = async (signal) => {
            logger.info(`${signal} received, starting graceful shutdown...`);
            
            // Stop accepting new requests
            server.close(() => {
                logger.info('HTTP server closed');
            });

            // Stop background jobs
            jobScheduler.stop();
            logger.info('Background jobs stopped');

            // Close database connection
            try {
                await mongoose.connection.close();
                logger.info('MongoDB connection closed');
            } catch (error) {
                logger.error('Error closing MongoDB connection:', error);
            }

            // Exit process
            process.exit(0);
        };

        // Handle shutdown signals
        process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
        process.on('SIGINT', () => gracefulShutdown('SIGINT'));

        // Handle nodemon restart
        process.once('SIGUSR2', () => {
            gracefulShutdown('SIGUSR2');
            process.kill(process.pid, 'SIGUSR2');
        });

    } catch (error) {
        logger.error('Failed to start server:', error);
        process.exit(1);
    }
};

// Start the server
startServer();

// Export app for testing
export default app;