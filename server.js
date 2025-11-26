console.log("Starting the server...");

import express from 'express';
import cors from 'cors';
import categoryRouter from './routes/categoryRoutes.js';
import walletRouter from './routes/walletRoutes.js';
import tradeRouter from './routes/tradeRoutes.js';
import positionRouter from './routes/positionRoutes.js';
import connectToDB from './database/mongodb.js';
import jobScheduler from './jobs/scheduler.js';
import { PORT, NODE_ENV } from './config/env.js';

const app = express();

// Middleware
app.use(cors({
    origin: '*', // In production, specify your app's URL
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization'],
}));

app.use(express.json());

// Health check endpoint
app.get('/', (req, res) => {
    res.json({ 
        status: 'OK', 
        message: 'BetSwipe API Server',
        timestamp: new Date().toISOString(),
        environment: NODE_ENV
    });
});

// API Routes
app.use('/api/categories', categoryRouter);
app.use('/api/wallet', walletRouter);
app.use('/api/trade', tradeRouter);
app.use('/api/positions', positionRouter);

// Error handling middleware
app.use((err, req, res, next) => {
    console.error('Error:', err);
    res.status(err.status || 500).json({
        success: false,
        message: err.message || 'Internal server error',
    });
});

// Connect to MongoDB, then start the server
connectToDB()
    .then(() => {
        // Initialize Polymarket client
        const { initializeClobClient } = require('./config/polymarket.js');
        initializeClobClient();

        // Start background jobs
        jobScheduler.initialize();
        jobScheduler.start();

        // Start server
        app.listen(PORT, () => {
            console.log(`Server is running on port ${PORT}`);
            console.log(`API available at http://localhost:${PORT}/api`);
            console.log(`Environment: ${NODE_ENV}`);
        });
    })
    .catch((error) => {
        console.error("Failed to connect to MongoDB:", error);
        process.exit(1);
    });

// Graceful shutdown
process.on('SIGINT', () => {
    console.log('Shutting down gracefully...');
    jobScheduler.stop();
    process.exit(0);
});