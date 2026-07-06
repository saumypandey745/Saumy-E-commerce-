const express = require('express');
const cors = require('cors');
require('dotenv').config();
const { connectDB } = require('./config/db');
const { connectRabbitMQ, getBrokerMode } = require('./config/rabbitmq');
const mongoSanitize = require('express-mongo-sanitize');
const reviewRoutes = require('./routes/review.routes');

const app = express();\n
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

const PORT = process.env.PORT || 8009;

app.use(cors());
app.use(express.json());
app.get('/openapi.json', (req, res) => res.sendFile(require('path').join(__dirname, 'openapi.json')));

// MED-07: Prevent NoSQL injection attacks
app.use(mongoSanitize());

// Initialize DB & Event Mesh
connectDB();
connectRabbitMQ();

// Health check
app.get('/health', (req, res) => {
    res.status(200).json({ status: 'OK', service: 'review-service', database: 'connected', messageBroker: getBrokerMode() });
});

// Routes
app.use('/', reviewRoutes);

app.listen(PORT, () => {
    console.log(`Review Engine Service is running on port ${PORT}`);
});
