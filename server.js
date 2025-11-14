console.log("Starting the server...");

import express from 'express';
import categoryRouter from './routes/categoryRoutes.js';
import connectToDB from './database/mongodb.js';

import { PORT } from './config/env.js';

const app = express();

// Middleware to parse JSON from request body
app.use(express.json());

app.get('/', (req, res) => {
    res.send('Hello World!');
})

app.use('/api/categories', categoryRouter);

// Connect to MongoDB, then start the server
connectToDB().then(() => {
    app.listen(PORT, () => {
        console.log(`Server is running on port ${PORT}`);
    });
}).catch((error) => {
    console.error("Failed to connect to MongoDB:", error);
    process.exit(1);
});