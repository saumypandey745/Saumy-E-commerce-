const express = require('express');
const cors = require('cors');
require('dotenv').config();
const { connectDB } = require('./config/db');
const { connectRabbitMQ, getBrokerMode } = require('./config/rabbitmq');
const { startSagaConsumers } = require('./consumers/saga.consumer');
const orderRoutes = require('./routes/order.routes');
const { errorHandler, metrics } = require('@ecommerce/shared');

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

const PORT = process.env.PORT || 8004;


app.use(cors());
app.use(express.json());
app.get('/openapi.json', (req, res) => res.sendFile(require('path').join(__dirname, 'openapi.json')));

// Routes
app.get('/metrics', metrics.getMetrics);
app.use(metrics.metricsMiddleware);
app.get('/health', async (req, res) => {
    try {
        const { sequelize } = require('./config/db');
        await sequelize.authenticate();
        res.status(200).json({ status: 'OK', service: 'order-service', database: 'connected', messageBroker: getBrokerMode() });
    } catch (err) {
        res.status(503).json({ status: 'ERROR', service: 'order-service', database: 'disconnected' });
    }
});
app.use('/', orderRoutes); // Gateway maps /api/orders to /
app.use('/coupons', require('./routes/coupon.routes'));

// Error Handler
app.use(errorHandler);

let server;
if (require.main === module) {
    // Connect DB & MQ
    connectDB();
    connectRabbitMQ().then(() => {
        startSagaConsumers();
    });

    server = app.listen(PORT, () => {
        console.log(`[Order Service] Running on port ${PORT}`);
    });
}

// MED-02: Graceful shutdown — critical for Kubernetes rolling deploys
// SIGTERM is sent by K8s before pod termination; SIGINT is Ctrl+C in dev
const gracefulShutdown = async (signal) => {
    console.log(`[Order Service] Received ${signal}. Starting graceful shutdown...`);

    // 1. Stop accepting new HTTP connections
    server.close(async () => {
        console.log('[Order Service] HTTP server closed. Draining DB connections...');
        try {
            const { sequelize } = require('./config/db');
            await sequelize.close();
            console.log('[Order Service] Database connection closed cleanly.');
        } catch (err) {
            console.error('[Order Service] Error closing DB connection:', err.message);
        }
        console.log('[Order Service] Shutdown complete. Exiting.');
        process.exit(0);
    });

    // 2. Force exit after 10 seconds if draining stalls
    setTimeout(() => {
        console.error('[Order Service] Graceful shutdown timed out after 10s. Force exiting.');
        process.exit(1);
    }, 10000).unref();
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT',  () => gracefulShutdown('SIGINT'));

module.exports = app;
