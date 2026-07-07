const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
require('dotenv').config();
const { connectDB } = require('./config/db');
const authRoutes = require('./routes/auth.routes');
const { errorHandler, metrics } = require('@ecommerce/shared');

// Fail fast — auth-service is the identity authority
// Starting with a missing secret would allow forged tokens to pass silently
if (!process.env.JWT_SECRET) {
    console.error('[FATAL] JWT_SECRET is not set. Auth service cannot start safely.');
    process.exit(1);
}

const app = express();
app.get('/metrics', metrics.getMetrics);
app.use(metrics.metricsMiddleware);
app.get("/health", async (req, res) => {
    try {
        const { sequelize } = require('./config/db');
        await sequelize.authenticate();
        res.status(200).json({ status: "OK", service: "auth-service", db: "connected" });
    } catch (err) {
        res.status(503).json({ status: "ERROR", service: "auth-service", db: "disconnected" });
    }
});
// --- BEGIN ENTERPRISE STRUCTURED LOGGING ---
const { AsyncLocalStorage } = require('async_hooks');
const asyncLocalStorage = new AsyncLocalStorage();
const originalLog = console.log;
const originalError = console.error;
const originalWarn = console.warn;

function formatLog(level, args) {
    const store = asyncLocalStorage.getStore();
    const requestId = store ? store.get('x-request-id') : 'system';
    const msg = args.map(a => typeof a === 'object' ? JSON.stringify(a) : a).join(' ');
    return JSON.stringify({ timestamp: new Date().toISOString(), level, requestId, message: msg });
}

console.log = (...args) => originalLog(formatLog('info', args));
console.error = (...args) => originalError(formatLog('error', args));
console.warn = (...args) => originalWarn(formatLog('warn', args));

// Intercept requests to seed AsyncLocalStorage
app.use((req, res, next) => {
    const store = new Map();
    store.set('x-request-id', req.headers['x-request-id'] || 'unknown');
    asyncLocalStorage.run(store, () => next());
});
// --- END ENTERPRISE STRUCTURED LOGGING ---

app.set('trust proxy', true);
const PORT = process.env.PORT || 8001;



// Auth-service only accepts requests from the API gateway and local dev tools
const allowedOrigins = [
    'http://localhost:3000',
    'http://localhost:3001',
    'http://localhost:3002',
    'http://localhost:8000', // API gateway
    ...(process.env.ALLOWED_ORIGINS ? process.env.ALLOWED_ORIGINS.split(',').map(o => o.trim()) : [])
];
app.use(cors({
    origin: (origin, callback) => {
        if (!origin || allowedOrigins.includes(origin) || origin.endsWith('.vercel.app')) return callback(null, true);
        return callback(new Error('CORS: Origin not allowed'));
    },
    credentials: true
}));
app.use(express.json());
app.get('/openapi.json', (req, res) => res.sendFile(require('path').join(__dirname, 'openapi.json')));
app.use(cookieParser());

// Routes
app.use('/', authRoutes); // Gateway maps /api/auth to /
app.use('/admin/users', require('./routes/admin.routes')); // Map for User Management

// Error Handler Middleware
app.use(errorHandler);

let server;
if (require.main === module) {
    // Connect Database
    connectDB().then(() => {
        console.log('[Auth Service] Database connected. Starting seeder check...');
        const seed = require('./seed');
        return seed();
    }).then(() => {
        console.log('[Auth Service] Seeder check completed successfully.');
        server = app.listen(PORT, () => {
            console.log(`[Auth Service] Running on port ${PORT}`);
        });
    }).catch((err) => {
        console.error('[Auth Service] Error during database/seeder startup:', err);
    });
}

// MED-02: Graceful shutdown
const gracefulShutdown = async (signal) => {
    console.log(`[Auth Service] Received ${signal}. Shutting down gracefully...`);
    server.close(async () => {
        try {
            const { sequelize } = require('./config/db');
            await sequelize.close();
            console.log('[Auth Service] DB connection closed. Exiting.');
        } catch (err) {
            console.error('[Auth Service] Error closing DB:', err.message);
        }
        process.exit(0);
    });
    setTimeout(() => { console.error('[Auth Service] Forced exit after timeout.'); process.exit(1); }, 10000).unref();
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT',  () => gracefulShutdown('SIGINT'));

module.exports = app;
