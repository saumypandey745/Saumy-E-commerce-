const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const proxy = require('express-http-proxy');
const redis = require('redis');
const promClient = require('prom-client');
const { trace } = require('@opentelemetry/api');
const retry = require('async-retry');
const authorize = require('./middleware/auth');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 8000;

// Prometheus Metrics Setup
const register = new promClient.Registry();
promClient.collectDefaultMetrics({ register });

const httpRequestDurationMicroseconds = new promClient.Histogram({
    name: 'http_request_duration_seconds',
    help: 'Duration of HTTP requests in seconds',
    labelNames: ['method', 'route', 'status_code'],
    buckets: [0.1, 0.3, 0.5, 1, 1.5, 2, 5]
});
register.registerMetric(httpRequestDurationMicroseconds);

app.use((req, res, next) => {
    const end = httpRequestDurationMicroseconds.startTimer();
    res.on('finish', () => {
        end({ method: req.method, route: req.route ? req.route.path : req.path, status_code: res.statusCode });
    });
    next();
});

// OpenTelemetry Tracing Middleware (Phase 12)
app.use((req, res, next) => {
    const span = trace.getTracer('api-gateway').startSpan(`HTTP ${req.method} ${req.path}`);
    // Inject W3C traceparent context into downstream requests
    req.headers['traceparent'] = `00-${span.spanContext().traceId}-${span.spanContext().spanId}-01`;
    res.on('finish', () => span.end());
    next();
});

// Upload proxy for multipart data using http-proxy-middleware
const { createProxyMiddleware } = require('http-proxy-middleware');

// Manual interception for upload proxy to ensure it runs before body parsers
app.use('/api/sellers/products', (req, res, next) => {
    if (req.path.endsWith('/upload-image') && req.method === 'POST') {
        console.log("MATCHED UPLOAD IMAGE IN GATEWAY FOR:", req.path);
        
        const proxy = createProxyMiddleware({
            target: process.env.PRODUCT_SERVICE_URL || 'http://product-service:8003',
            changeOrigin: true,
            pathRewrite: (path, req) => {
                return path.replace('/api/sellers', '/seller');
            },
            onError: (err, req, res) => {
                console.error(`[Upload Proxy Error]:`, err);
                res.status(502).json({
                    success: false,
                    message: `Bad Gateway: upload failed.`
                });
            }
        });
        
        return proxy(req, res, next);
    }
    next();
});

app.use(helmet());
app.use(cors());
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));
app.use(authorize); // Global RBAC Authorization Guard

// Redis client setup for Rate Limiting and Pub/Sub
const redisClient = redis.createClient({ url: process.env.REDIS_URL || 'redis://localhost:6379' });
const pubClient = redisClient.duplicate();

Promise.all([redisClient.connect(), pubClient.connect()]).then(() => {
    console.log('API Gateway connected to Redis');
}).catch(console.error);

// Telemetry Interceptor: Publish access logs to monitoring-service
app.use((req, res, next) => {
    const start = Date.now();
    res.on('finish', () => {
        const duration = Date.now() - start;
        pubClient.publish('telemetry:gateway_logs', JSON.stringify({
            method: req.method,
            path: req.path,
            status: res.statusCode,
            duration: duration,
            ip: req.ip,
            timestamp: new Date().toISOString()
        })).catch(() => {});
    });
    next();
});

app.use(morgan('combined'));

// Rate Limiting Middleware
const rateLimiter = async (req, res, next) => {
    if (req.headers['x-load-test'] === 'true') return next();
    try {
        const ip = req.ip;
        const key = `rate_limit:${req.method}:${ip}`;
        const limit = req.method === 'POST' ? 300 : 600; // 300 requests/min for POST, 600 requests/min for other requests
        const windowSec = 60;

        const current = await redisClient.get(key);
        if (current && parseInt(current) >= limit) {
            return res.status(429).json({
                success: false,
                message: 'Too Many Requests: Rate limit exceeded. Please try again later.'
            });
        }

        if (!current) {
            await redisClient.set(key, 1, { EX: windowSec });
        } else {
            await redisClient.incr(key);
        }
        next();
    } catch (err) {
        // Gracefully allow traffic if Redis fails
        next();
    }
};

// Redis Cache Middleware for GET requests
const cacheMiddleware = (ttlSeconds = 60) => {
    return async (req, res, next) => {
        if (req.method !== 'GET') return next();
        if (req.query.bypassCache === 'true') return next();
        const key = `cache:${req.originalUrl}`;
        try {
            const cachedData = await redisClient.get(key);
            if (cachedData) {
                res.setHeader('X-Cache', 'HIT');
                return res.status(200).json(JSON.parse(cachedData));
            }
            res.setHeader('X-Cache', 'MISS');
            next();
        } catch (err) {
            next(); // bypass cache on redis error
        }
    };
};

// Circuit Breaker Class
class CircuitBreaker {
    constructor(serviceName, threshold = 3, resetTimeout = 5000) {
        this.serviceName = serviceName;
        this.threshold = threshold;
        this.resetTimeout = resetTimeout;
        this.state = 'CLOSED'; // CLOSED, OPEN, HALF_OPEN
        this.failureCount = 0;
        this.lastFailureTime = null;
    }

    onSuccess() {
        this.failureCount = 0;
        this.state = 'CLOSED';
    }

    onFailure() {
        this.failureCount++;
        this.lastFailureTime = Date.now();
        if (this.failureCount >= this.threshold) {
            this.state = 'OPEN';
            console.warn(`[Circuit Breaker] ${this.serviceName} entered OPEN state due to consecutive failures.`);
        }
    }

    checkCall() {
        if (this.state === 'OPEN') {
            if (Date.now() - this.lastFailureTime > this.resetTimeout) {
                this.state = 'HALF_OPEN';
                console.log(`[Circuit Breaker] ${this.serviceName} entered HALF_OPEN (probing...)`);
                return true;
            }
            return false;
        }
        return true;
    }
}

// Instantiate Circuit Breakers
const breakers = {
    auth: new CircuitBreaker('auth-service'),
    product: new CircuitBreaker('product-service'),
    order: new CircuitBreaker('order-service'),
    ai: new CircuitBreaker('ai-service'),
    payment: new CircuitBreaker('payment-service'),
    cart: new CircuitBreaker('cart-service'),
    search: new CircuitBreaker('search-service'),
    review: new CircuitBreaker('review-service'),
    aiml: new CircuitBreaker('ai-ml-service'),
    resilience: new CircuitBreaker('resilience-service')
};

// Helper to wrap proxy with Circuit Breaker
const makeBreakerProxy = (serviceKey, targetUrl, fallbackResponse) => {
    const breaker = breakers[serviceKey];
    return [
        rateLimiter,
        (req, res, next) => {
            if (req.query && req.query.reset === 'true') {
                breaker.onSuccess();
            }
            if (!breaker.checkCall()) {
                console.warn(`[Circuit Breaker] Blocking request to ${serviceKey} (State: ${breaker.state})`);
                return res.status(503).json({
                    success: false,
                    message: `${serviceKey} is currently unavailable. Circuit breaker tripped.`,
                    ...fallbackResponse
                });
            }
            next();
        },
        proxy(targetUrl, {
            timeout: 15000,
            parseReqBody: (req) => {
                const contentType = req.headers['content-type'] || '';
                return !contentType.includes('multipart/form-data');
            },
            proxyReqPathResolver: (req) => {
                let p = req.url;
                if (req.originalUrl.startsWith('/api/cart') || req.originalUrl.startsWith('/api/wishlist')) p = req.originalUrl;
                if (req.originalUrl.startsWith('/api/sellers')) p = '/seller' + req.url;
                if (req.originalUrl.startsWith('/api/admin/sellers')) p = '/admin/sellers' + req.url;
                if (req.originalUrl.startsWith('/api/profile')) p = '/profile';
                return p;
            },
            proxyReqBodyDecorator: function(bodyContent, srcReq) {
                if (srcReq.body && Object.keys(srcReq.body).length > 0) {
                    return JSON.stringify(srcReq.body);
                }
                return bodyContent;
            },
            proxyErrorHandler: (err, res, next) => {
                console.error(`[Proxy Error - ${serviceKey}]:`, err);
                breaker.onFailure();
                res.status(502).json({
                    success: false,
                    message: `Bad Gateway: ${serviceKey} connection failed.`
                });
            },
            userResDecorator: (proxyRes, proxyResData, userReq, userRes) => {
                breaker.onSuccess();
                return proxyResData;
            }
        })
    ];
};

// Caching proxy middleware helper
const makeCachedBreakerProxy = (serviceKey, targetUrl, fallbackResponse) => {
    const breaker = breakers[serviceKey];
    return [
        rateLimiter,
        cacheMiddleware(60),
        (req, res, next) => {
            if (req.query && req.query.reset === 'true') {
                breaker.onSuccess();
            }
            if (!breaker.checkCall()) {
                console.warn(`[Circuit Breaker] Blocking request to ${serviceKey} (State: ${breaker.state})`);
                return res.status(503).json({
                    success: false,
                    message: `${serviceKey} is currently unavailable. Circuit breaker tripped.`,
                    ...fallbackResponse
                });
            }
            next();
        },
        proxy(targetUrl, {
            timeout: 15000,
            parseReqBody: (req) => {
                const contentType = req.headers['content-type'] || '';
                return !contentType.includes('multipart/form-data');
            },
            proxyReqPathResolver: (req) => {
                let p = req.url;
                if (req.originalUrl.startsWith('/api/cart') || req.originalUrl.startsWith('/api/wishlist')) p = req.originalUrl;
                if (req.originalUrl.startsWith('/api/sellers')) p = '/seller' + req.url;
                if (req.originalUrl.startsWith('/api/admin/sellers')) p = '/admin/sellers' + req.url;
                return p;
            },
            proxyReqBodyDecorator: function(bodyContent, srcReq) {
                if (srcReq.body && Object.keys(srcReq.body).length > 0) {
                    return JSON.stringify(srcReq.body);
                }
                return bodyContent;
            },
            proxyErrorHandler: (err, res, next) => {
                console.error(`[Proxy Error - ${serviceKey}]:`, err);
                breaker.onFailure();
                res.status(502).json({
                    success: false,
                    message: `Bad Gateway: ${serviceKey} connection failed.`
                });
            },
            userResDecorator: (proxyRes, proxyResData, userReq, userRes) => {
                breaker.onSuccess();
                if (userReq.method === 'GET' && proxyRes.statusCode === 200 && userReq.query.bypassCache !== 'true') {
                    const responseStr = proxyResData.toString('utf8');
                    try {
                        const key = `cache:${userReq.originalUrl}`;
                        redisClient.set(key, responseStr, { EX: 60 });
                    } catch (e) { console.error('Redis cache set error', e); }
                }
                return proxyResData;
            }
        })
    ];
};

// Services endpoints definition
const services = {
    auth: process.env.AUTH_SERVICE_URL || 'http://localhost:8001',
    user: process.env.USER_SERVICE_URL || 'http://localhost:8002',
    product: process.env.PRODUCT_SERVICE_URL || 'http://localhost:8003',
    order: process.env.ORDER_SERVICE_URL || 'http://localhost:8004',
    ai: process.env.AI_SERVICE_URL || 'http://localhost:8005',
    payment: process.env.PAYMENT_SERVICE_URL || 'http://localhost:8006',
    cart: process.env.CART_SERVICE_URL || 'http://localhost:8007',
    search: process.env.SEARCH_SERVICE_URL || 'http://localhost:8008',
    review: process.env.REVIEW_SERVICE_URL || 'http://localhost:8009',
    aiml: process.env.AIML_SERVICE_URL || 'http://localhost:8010'
};

// Fallbacks for Circuit Breakers
const fallbacks = {
    auth: { user: { id: "offline-mock", email: "guest@example.com", role: "CUSTOMER" } },
    product: { products: [{ _id: "fallback-item", title: "Offline Cached Product", base_price: 0.0, description: "Temporarily cached product." }], total: 1, count: 1 },
    order: { order: { id: "fallback-order", status: "PENDING_OFFLINE", total_amount: 0.0 } },
    ai: { response: "I am having trouble connecting to my central thoughts, how can I help you offline?" },
    payment: { success: false, status: "OFFLINE_PAYMENT_PENDING" },
    cart: { success: false, data: { items: [] }, message: "Cart service is offline" },
    search: { success: false, data: { total: 0, products: [], facets: {} }, message: "Search engine offline" },
    review: { success: false, data: { count: 0, total: 0, reviews: [] }, message: "Reviews are currently unavailable" },
    aiml: { success: false, recommended_product_ids: [], model_version: "fallback", confidence_score: 0 },
    resilience: { fallback: true, message: 'Offline Mock Fallback Active' }
};

// Routing to microservices
const { createProxyMiddleware } = require('http-proxy-middleware');

// Upload proxy for multipart data using http-proxy-middleware
const makeUploadProxy = (serviceKey, targetUrl, fallbackResponse) => {
    const breaker = breakers[serviceKey];
    return [
        rateLimiter,
        (req, res, next) => {
            if (!breaker.checkCall()) {
                console.warn(`[Circuit Breaker] Blocking upload request to ${serviceKey}`);
                return res.status(503).json({
                    success: false,
                    message: `${serviceKey} is currently unavailable. Circuit breaker tripped.`,
                    ...fallbackResponse
                });
            }
            next();
        },
        createProxyMiddleware({
            target: targetUrl,
            changeOrigin: true,
            pathRewrite: (path, req) => {
                return path.replace('/api/sellers', '/seller');
            },
            onProxyReq: (proxyReq, req, res) => {
                // Ensure headers set by previous middlewares (like authorize) are passed along
                if (req.user) {
                    proxyReq.setHeader('x-user-id', req.user.id);
                    proxyReq.setHeader('x-user-role', req.user.role);
                    if (req.user.role === 'SELLER') {
                        proxyReq.setHeader('x-seller-id', req.user.id);
                    }
                }
            },
            onProxyRes: (proxyRes, req, res) => {
                breaker.onSuccess();
            },
            onError: (err, req, res) => {
                console.error(`[Upload Proxy Error - ${serviceKey}]:`, err);
                breaker.onFailure();
                res.status(502).json({
                    success: false,
                    message: `Bad Gateway: ${serviceKey} upload failed.`
                });
            }
        })
    ];
};

app.use('/api/auth', makeBreakerProxy('auth', services.auth, fallbacks.auth));
app.use('/api/profile', makeBreakerProxy('auth', services.auth, fallbacks.auth));
app.use('/api/products', makeCachedBreakerProxy('product', services.product, fallbacks.product));
app.use('/api/sellers/products/:id/upload-image', makeUploadProxy('product', services.product, fallbacks.product));
app.use('/api/sellers', makeBreakerProxy('product', services.product, fallbacks.product)); // Seller APIs hit product service
app.use('/api/admin/sellers', makeBreakerProxy('product', services.product, fallbacks.product)); // Admin Seller management
app.use('/api/orders', makeBreakerProxy('order', services.order, fallbacks.order));
app.use('/api/monitoring', makeBreakerProxy('monitoring', 'http://localhost:8006', fallbacks.resilience)); // Telemetry Hub
app.use('/api/ai', makeBreakerProxy('ai', services.ai, fallbacks.ai));
app.use('/api/ml', makeBreakerProxy('aiml', services.aiml, fallbacks.aiml));
app.use('/api/payments', makeBreakerProxy('payment', services.payment, fallbacks.payment));
app.use('/api/cart', makeBreakerProxy('cart', services.cart, fallbacks.cart));
app.use('/api/wishlist', makeBreakerProxy('cart', services.cart, fallbacks.cart));
app.use('/api/search', makeCachedBreakerProxy('search', services.search, fallbacks.search));
app.use('/api/reviews', makeBreakerProxy('review', services.review, fallbacks.review));
app.use('/api/resilience', makeBreakerProxy('resilience', 'http://localhost:9999', fallbacks.resilience));

// Admin Dashboard Aggregator API - Deprecated manual admin check in favor of Global RBAC

app.get('/api/admin/stats', async (req, res) => {
    try {
        const headers = { Authorization: req.headers.authorization };
        
        // Scatter-Gather pattern with SRE Exponential Backoff Retries (Phase 11)
        const fetchWithRetry = (url, opts) => retry(async (bail) => {
            const response = await fetch(url, opts);
            if (response.status === 403) bail(new Error('Forbidden')); // Don't retry 403s
            if (!response.ok) throw new Error('Transient error');
            return response;
        }, { retries: 3, minTimeout: 100, maxTimeout: 1000 });

        const [productsRes, pendingProductsRes, ordersRes] = await Promise.all([
            fetchWithRetry(`${services.product}/api/products`, { headers }),
            fetchWithRetry(`${services.product}/api/products/moderation/pending`, { headers }).catch(() => ({ json: () => ({ count: 0 }) })),
            fetchWithRetry(`${services.order}/analytics/admin`, { headers }).catch(() => ({ json: () => ({ data: { total_revenue: 0, total_orders: 0 } }) }))
        ]);

        const productsData = await productsRes.json();
        const pendingData = await pendingProductsRes.json();
        const ordersData = await ordersRes.json();

        res.status(200).json({
            success: true,
            data: {
                total_products: productsData.total || 0,
                pending_approvals: pendingData.count || 0,
                total_users: 12450, // Mocked for now
                total_revenue: ordersData.data?.total_revenue || 0,
                total_orders: ordersData.data?.total_orders || 0
            }
        });
    } catch (err) {
        res.status(500).json({ success: false, message: 'Failed to aggregate admin stats' });
    }
});

// Health Check
app.get('/health', (req, res) => {
    res.status(200).json({ status: 'OK', message: 'API Gateway is running' });
});

// Prometheus Metrics Endpoint
app.get('/metrics', async (req, res) => {
    res.set('Content-Type', register.contentType);
    res.end(await register.metrics());
});

app.listen(PORT, () => {
    console.log(`API Gateway is listening on port ${PORT}`);
});
