const express = require('express');
const cors = require('cors');
require('dotenv').config();
const { connectDB } = require('./config/db');
const { connectRabbitMQ, getBrokerMode } = require('./config/rabbitmq');
const { startPaymentConsumer } = require('./consumers/payment.consumer');
const { startSellerConsumer } = require('./consumers/seller.consumer');
const paymentRoutes = require('./routes/payment.routes');
const { errorHandler } = require('@ecommerce/shared');

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

const PORT = process.env.PORT || 8006;

app.use(cors({
    origin: (origin, callback) => {
        const allowed = ['http://localhost:3000','http://localhost:8000',...
            (process.env.ALLOWED_ORIGINS ? process.env.ALLOWED_ORIGINS.split(',').map(o => o.trim()) : [])];
        if (!origin || allowed.includes(origin) || origin.endsWith('.vercel.app')) return callback(null, true);
        return callback(new Error('CORS: Origin not allowed'));
    },
    credentials: true
}));

const webhookRoutes = require('./routes/webhook.routes');
app.use('/webhook', express.raw({type: 'application/json'}), webhookRoutes);
app.use(express.json());
app.get('/openapi.json', (req, res) => res.sendFile(require('path').join(__dirname, 'openapi.json')));

connectRabbitMQ().then(() => {
    startPaymentConsumer();
    startSellerConsumer();
});

app.use('/', paymentRoutes);

// Health check
app.get('/health', (req, res) => {
    res.status(200).json({ status: 'OK', service: 'payment-service', database: 'connected', messageBroker: getBrokerMode() });
});

app.use(errorHandler);

let server;
if (require.main === module) {
    connectDB();
    server = app.listen(PORT, () => {
    console.log(`[Payment Service] Running on port ${PORT}`);
});
}

// MED-02: Graceful shutdown — payment service must not drop in-flight Stripe calls
const gracefulShutdown = async (signal) => {
    console.log(`[Payment Service] Received ${signal}. Draining connections...`);
    server.close(async () => {
        try {
            const { sequelize } = require('./config/db');
            await sequelize.close();
            console.log('[Payment Service] DB closed. Exiting.');
        } catch (err) {
            console.error('[Payment Service] DB close error:', err.message);
        }
        process.exit(0);
    });
    setTimeout(() => { process.exit(1); }, 10000).unref();
};
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT',  () => gracefulShutdown('SIGINT'));

module.exports = app;
