const express = require('express');
const cors = require('cors');
require('dotenv').config();
const { connectDB } = require('./config/db');
const { connectRabbitMQ } = require('./config/rabbitmq');
const { startSagaConsumers } = require('./consumers/saga.consumer');
const promotionRoutes = require('./routes/promotion.routes');
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

app.use((req, res, next) => {
    const store = new Map();
    store.set('x-request-id', req.headers['x-request-id'] || 'unknown');
    asyncLocalStorage.run(store, () => next());
});
// --- END ENTERPRISE STRUCTURED LOGGING ---

const PORT = process.env.PORT || 8012;

const { initModels } = require('./models');

// Connect DB & MQ
connectRabbitMQ().then(() => {
    startSagaConsumers();
});

app.use(cors());
app.use(express.json());

// Routes
app.get('/health', (req, res) => {
    res.status(200).json({ status: 'OK', service: 'promotion-service', database: 'connected' });
});
app.use('/', promotionRoutes);

// Error Handler
app.use(errorHandler);

let server;
if (require.main === module) {
    connectDB().then(() => initModels());
    server = app.listen(PORT, () => {
    console.log(`[Promotion Service] Running on port ${PORT}`);
});
}

// Graceful shutdown
const gracefulShutdown = async (signal) => {
    console.log(`[Promotion Service] Received ${signal}. Starting graceful shutdown...`);
    server.close(async () => {
        try {
            const { sequelize } = require('./config/db');
            await sequelize.close();
            console.log('[Promotion Service] DB connection closed.');
        } catch (err) {
            console.error('[Promotion Service] Error closing DB:', err.message);
        }
        process.exit(0);
    });
    setTimeout(() => process.exit(1), 10000).unref();
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT',  () => gracefulShutdown('SIGINT'));

module.exports = app;
