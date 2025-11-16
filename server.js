console.log("Starting the server...");

import express from 'express';
import cors from 'cors';
import categoryRouter from './routes/categoryRoutes.js';
import connectToDB from './database/mongodb.js';

import { PORT } from './config/env.js';

const app = express();

app.use(cors({
    origin: '*', // In production, specify your app's URL
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization'],
}));

// Middleware to parse JSON from request body
app.use(express.json());

// Health check endpoint
app.get('/', (req, res) => {
    res.json({ 
        status: 'OK', 
        message: 'BetSwipe API Server',
        timestamp: new Date().toISOString() 
    });
});

app.use('/api/categories', categoryRouter);

// Error handling middleware
app.use((err, req, res,) => {
    console.error('Error:', err);
    res.status(err.status || 500).json({
        success: false,
        message: err.message || 'Internal server error',
    });
});

// Connect to MongoDB, then start the server
connectToDB().then(() => {
    app.listen(PORT, () => {
        console.log(`Server is running on port ${PORT}`);
    });
}).catch((error) => {
    console.error("Failed to connect to MongoDB:", error);
    process.exit(1);
});