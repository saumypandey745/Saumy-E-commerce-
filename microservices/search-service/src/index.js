const express = require('express');
const cors = require('cors');
require('dotenv').config();
const { connectRabbitMQ, getBrokerMode } = require('./config/rabbitmq');
const { startSyncConsumer } = require('./consumers/sync.consumer');
const searchRoutes = require('./routes/search.routes');

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

const PORT = process.env.PORT || 8008;

app.use(cors());
app.use(express.json());

// Initialize Event Mesh
connectRabbitMQ().then(() => {
    startSyncConsumer();
});

// Run Initial Search Index Synchronization
const syncProducts = require('./syncProducts');
syncProducts().then(() => {
    console.log('[Search Engine Service] Initial product synchronization complete.');
}).catch((err) => {
    console.error('[Search Engine Service] Initial product synchronization failed:', err);
});

// Routes
app.use('/', searchRoutes);

// Health check
app.get('/health', (req, res) => {
    res.status(200).json({ status: 'OK', service: 'search-service', database: 'connected', messageBroker: getBrokerMode() });
});

app.listen(PORT, () => {
    console.log(`Search Engine Service is running on port ${PORT}`);
});
