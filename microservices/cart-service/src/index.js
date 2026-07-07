const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const connectDB = require('./config/db');
const { connectRedis } = require('./config/redis');
const mongoSanitize = require('express-mongo-sanitize');

dotenv.config();

const cartRoutes = require('./routes/cart.routes');
const wishlistRoutes = require('./routes/wishlist.routes');

const app = express();
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

const PORT = process.env.PORT || 8007;

// CORS — only allow known frontend origins
const allowedOrigins = [
    'http://localhost:3000',
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

// MED-07: Prevent NoSQL injection attacks
app.use(mongoSanitize());

// Init DB & Redis
connectRedis();

app.use('/api/v1/cart', cartRoutes);
app.use('/api/v1/wishlist', wishlistRoutes);

app.get('/health', (req, res) => {
    res.status(200).json({ status: 'OK', service: 'cart-service', port: PORT });
});

let server;
if (require.main === module) {
    connectDB();
    server = app.listen(PORT, () => {
    console.log(`[Cart Service] Running on port ${PORT}`);
});
}

// MED-02: Graceful shutdown — ensures Redis connections are closed cleanly
// and in-flight cart operations complete before pod termination
const gracefulShutdown = async (signal) => {
    console.log(`[Cart Service] Received ${signal}. Shutting down gracefully...`);
    server.close(async () => {
        try {
            const { redisClient } = require('./config/redis');
            if (redisClient && redisClient.isOpen) {
                await redisClient.quit();
                console.log('[Cart Service] Redis connection closed cleanly.');
            }
        } catch (err) {
            console.error('[Cart Service] Error closing Redis:', err.message);
        }
        console.log('[Cart Service] Shutdown complete. Exiting.');
        process.exit(0);
    });
    setTimeout(() => {
        console.error('[Cart Service] Forced exit after 10s timeout.');
        process.exit(1);
    }, 10000).unref();
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT',  () => gracefulShutdown('SIGINT'));


module.exports = app;
