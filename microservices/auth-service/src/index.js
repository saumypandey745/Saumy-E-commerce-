const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const cookieParser = require('cookie-parser');
require('dotenv').config();
const { connectDB } = require('./config/db');
const authRoutes = require('./routes/auth.routes');
const { errorHandler } = require('@ecommerce/shared');

const app = express();
app.set('trust proxy', true);
const PORT = process.env.PORT || 8001;

// Connect Database
connectDB().then(() => {
    console.log('[Auth Service] Database connected. Starting seeder check...');
    const seed = require('./seed');
    return seed();
}).then(() => {
    console.log('[Auth Service] Seeder check completed successfully.');
}).catch((err) => {
    console.error('[Auth Service] Error during database/seeder startup:', err);
});

app.use(cors({ origin: true, credentials: true }));
app.use(express.json());
app.use(cookieParser());

// Routes
app.use('/', authRoutes); // Gateway maps /api/auth to /

// Error Handler Middleware
app.use(errorHandler);

app.listen(PORT, () => {
    console.log(`Auth Service is running on port ${PORT}`);
});
