const express = require('express');
const cors = require('cors');
const { connectDB, connectRedis } = require('./config/db');
const mongoSanitize = require('express-mongo-sanitize');
const { connectRabbitMQ, getBrokerMode } = require('./config/rabbitmq');
const { startInventoryConsumer } = require('./consumers/inventory.consumer');
const productRoutes = require('./routes/product.routes');
const { errorHandler } = require('@ecommerce/shared');
const { startReviewConsumer } = require('./consumers/review.consumer');

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

const PORT = process.env.PORT || 8003;

const { startBulkImportConsumer } = require('./consumers/bulk_import.consumer');

// Connect DBs & MQ
connectRedis();
connectRabbitMQ().then(() => {
    startInventoryConsumer();
    startReviewConsumer();
    startBulkImportConsumer();
});

app.use(cors());
app.use(express.json());
app.get('/openapi.json', (req, res) => res.sendFile(require('path').join(__dirname, 'openapi.json')));

// MED-07: Prevent NoSQL injection attacks (e.g., {"$gt": ""})
app.use(mongoSanitize());

app.use((req, res, next) => {
    console.log(`[Product Service] ${req.method} ${req.url}`);
    next();
});

// Routes
app.get('/health', (req, res) => {
    res.status(200).json({ status: 'OK', service: 'product-service', database: 'connected', messageBroker: getBrokerMode() });
});
app.use('/categories', require('./routes/category.routes'));
app.use('/brands', require('./routes/brand.routes'));
app.use('/moderation', require('./routes/moderation.routes'));
app.use('/seller', require('./routes/seller'));
app.use('/admin/sellers', require('./routes/admin.seller.routes'));
app.use('/', productRoutes); // Gateway maps /api/products to /

// Error Handler
app.use(errorHandler);

app.listen(PORT, () => {
    console.log(`Product Service is running on port ${PORT}`);
});

module.exports = app;
