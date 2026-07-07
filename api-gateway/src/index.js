const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const proxy = require('express-http-proxy');
const redis = require('redis');
const promClient = require('prom-client');
const { trace } = require('@opentelemetry/api');
const retry = require('async-retry');
const { v4: uuidv4 } = require('uuid');
const authorize = require('./middleware/auth');
const { rateLimit } = require('express-rate-limit');
const RedisStore = require('rate-limit-redis').default;
const swaggerUi = require('swagger-ui-express');
const cookieParser = require('cookie-parser');
const { getAggregatedSwagger } = require('./swaggerAggregator');
require('dotenv').config();

// Validate required secrets at startup — fail fast
if (!process.env.JWT_SECRET) {
    console.error('[FATAL] JWT_SECRET is not set. Refusing to start.');
    process.exit(1);
}

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

// Middleware
app.use(cookieParser());

// CRIT-06: Explicit CORS allowlist — no wildcard origins
const allowedOrigins = [
    'http://localhost:3000', // storefront (dev)
    'http://localhost:3001', // admin-dashboard (dev)
    'http://localhost:3002', // seller-hub (dev)
    ...(process.env.ALLOWED_ORIGINS ? process.env.ALLOWED_ORIGINS.split(',').map(o => o.trim()) : [])
];
app.use(cors({
    origin: (origin, callback) => {
        // Allow server-to-server requests (no origin header), listed origins, and Vercel deployments
        if (!origin || allowedOrigins.includes(origin) || origin.endsWith('.vercel.app')) {
            return callback(null, true);
        }
        console.warn(`[CORS] Blocked request from unauthorized origin: ${origin}`);
        return callback(new Error('CORS: Origin not allowed'));
    },
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'x-request-id'],
    credentials: true,
    maxAge: 86400 // Cache preflight for 24 hours
}));

// MED-05: Hardened Helmet security headers
app.use(helmet({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            scriptSrc: ["'self'"],
            styleSrc: ["'self'", "'unsafe-inline'"],
            imgSrc: ["'self'", 'data:', 'https:'],
            connectSrc: ["'self'"],
            fontSrc: ["'self'"],
            objectSrc: ["'none'"],
            frameAncestors: ["'none'"], // Clickjacking prevention
            upgradeInsecureRequests: []
        }
    },
    hsts: {
        maxAge: 31536000, // 1 year
        includeSubDomains: true,
        preload: true
    },
    frameguard: { action: 'deny' },    // X-Frame-Options: DENY
    referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
    xssFilter: true,
    noSniff: true
}));

app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));

// HIGH-04: Inject x-request-id correlation ID at gateway boundary
// Every downstream service log will share this ID for cross-service trace reconstruction
app.use((req, res, next) => {
    const requestId = req.headers['x-request-id'] || uuidv4();
    req.headers['x-request-id'] = requestId;
    res.setHeader('x-request-id', requestId);
    next();
});

app.use(authorize); // Global RBAC Authorization Guard

// Redis client setup for Rate Limiting and Pub/Sub
const redisClient = redis.createClient({ url: process.env.REDIS_URL || 'redis://localhost:6379' });
const pubClient = redisClient.duplicate();

Promise.all([redisClient.connect(), pubClient.connect()]).then(() => {
    console.log('API Gateway connected to Redis');
}).catch(console.error);

// HIGH-01: Auth-specific rate limiter (Redis-backed)
const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5, // Limit each IP to 5 requests per windowMs for auth
    standardHeaders: true,
    legacyHeaders: false,
    store: new RedisStore({
        sendCommand: (...args) => redisClient.sendCommand(args),
    }),
    message: {
        success: false,
        message: 'Too many login attempts from this IP, please try again after 15 minutes.'
    }
});

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

// MED-03: Atomic rate limiter — eliminates TOCTOU race condition
// Uses INCR (atomic) then EXPIRE only when key is new (count === 1)
// Two concurrent requests can no longer both read null and both set 1
const rateLimiter = async (req, res, next) => {
    if (req.headers['x-load-test'] === 'true') return next();
    try {
        const ip = req.ip;
        const key = `rate_limit:${req.method}:${ip}`;
        const limit = req.method === 'POST' ? 30 : 60;
        const windowSec = 60;

        // INCR is atomic — safe under concurrent requests
        const current = await redisClient.incr(key);

        // Only set expiry on the first request in this window
        if (current === 1) {
            await redisClient.expire(key, windowSec);
        }

        if (current > limit) {
            return res.status(429).json({
                success: false,
                message: 'Too Many Requests: Rate limit exceeded. Please try again later.',
                retryAfter: windowSec
            });
        }

        next();
    } catch (err) {
        // Gracefully allow traffic if Redis is unavailable
        console.warn('[RateLimit] Redis unavailable, bypassing rate limit:', err.message);
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

// MED-04: Redis-backed Distributed Circuit Breaker
// Ensures that if a downstream service fails, all gateway instances instantly trip their breakers
class RedisCircuitBreaker {
    constructor(serviceName, threshold = 3, resetTimeout = 5000) {
        this.serviceName = serviceName;
        this.threshold = threshold;
        this.resetTimeout = resetTimeout;
        this.stateKey = `cb:${serviceName}:state`;
        this.countKey = `cb:${serviceName}:count`;
        this.timeKey = `cb:${serviceName}:time`;
    }

    async onSuccess() {
        try {
            await redisClient.set(this.stateKey, 'CLOSED');
            await redisClient.set(this.countKey, '0');
        } catch (err) { console.error('[CB] Redis err:', err.message); }
    }

    async onFailure() {
        try {
            const count = await redisClient.incr(this.countKey);
            await redisClient.set(this.timeKey, Date.now().toString());
            if (count >= this.threshold) {
                await redisClient.set(this.stateKey, 'OPEN');
                console.warn(`[Circuit Breaker] ${this.serviceName} entered OPEN state across cluster.`);
            }
        } catch (err) { console.error('[CB] Redis err:', err.message); }
    }

    async checkCall() {
        try {
            const state = await redisClient.get(this.stateKey) || 'CLOSED';
            if (state === 'OPEN') {
                const lastFailure = parseInt(await redisClient.get(this.timeKey) || '0', 10);
                if (Date.now() - lastFailure > this.resetTimeout) {
                    await redisClient.set(this.stateKey, 'HALF_OPEN');
                    console.log(`[Circuit Breaker] ${this.serviceName} entered HALF_OPEN (probing...)`);
                    return true;
                }
                return false;
            }
            return true;
        } catch (err) {
            console.error('[CB] Redis read err, failing open:', err.message);
            return true; // fail open if Redis is down
        }
    }
}

// Instantiate Circuit Breakers
const breakers = {
    auth: new RedisCircuitBreaker('auth-service'),
    product: new RedisCircuitBreaker('product-service'),
    order: new RedisCircuitBreaker('order-service'),
    ai: new RedisCircuitBreaker('ai-service'),
    payment: new RedisCircuitBreaker('payment-service'),
    cart: new RedisCircuitBreaker('cart-service'),
    search: new RedisCircuitBreaker('search-service'),
    review: new RedisCircuitBreaker('review-service'),
    aiml: new RedisCircuitBreaker('ai-ml-service'),
    promotion: new RedisCircuitBreaker('promotion-service'),
    resilience: new RedisCircuitBreaker('resilience-service')
};

// Helper to wrap proxy with Circuit Breaker
const makeBreakerProxy = (serviceKey, targetUrl, fallbackResponse) => {
    const breaker = breakers[serviceKey];
    return [
        rateLimiter,
        async (req, res, next) => {
            if (req.query && req.query.reset === 'true') {
                await breaker.onSuccess();
            }
            const canCall = await breaker.checkCall();
            if (!canCall) {
                console.warn(`[Circuit Breaker] Blocking request to ${serviceKey} (Distributed State: OPEN)`);
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
                if (req.originalUrl.startsWith('/api/v1/cart') || req.originalUrl.startsWith('/api/v1/wishlist')) p = req.originalUrl;
                if (req.originalUrl.startsWith('/api/v1/sellers')) p = '/seller' + req.url;
                if (req.originalUrl.startsWith('/api/v1/admin/sellers')) p = '/admin/sellers' + req.url;
                if (req.originalUrl.startsWith('/api/v1/profile')) p = '/profile';
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
                breaker.onFailure().catch(console.error);
                res.status(502).json({
                    success: false,
                    message: `Bad Gateway: ${serviceKey} connection failed.`
                });
            },
            userResDecorator: (proxyRes, proxyResData, userReq, userRes) => {
                breaker.onSuccess().catch(console.error);
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
        async (req, res, next) => {
            if (req.query && req.query.reset === 'true') {
                await breaker.onSuccess();
            }
            const canCall = await breaker.checkCall();
            if (!canCall) {
                console.warn(`[Circuit Breaker] Blocking request to ${serviceKey} (Distributed State: OPEN)`);
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
                if (req.originalUrl.startsWith('/api/v1/cart') || req.originalUrl.startsWith('/api/v1/wishlist')) p = req.originalUrl;
                if (req.originalUrl.startsWith('/api/v1/sellers')) p = '/seller' + req.url;
                if (req.originalUrl.startsWith('/api/v1/admin/sellers')) p = '/admin/sellers' + req.url;
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
                breaker.onFailure().catch(console.error);
                res.status(502).json({
                    success: false,
                    message: `Bad Gateway: ${serviceKey} connection failed.`
                });
            },
            userResDecorator: (proxyRes, proxyResData, userReq, userRes) => {
                if (proxyRes.statusCode >= 200 && proxyRes.statusCode < 400 && userReq.method === 'GET') {
                    const key = `cache:${userReq.originalUrl}`;
                    redisClient.setEx(key, 60, proxyResData.toString('utf8')).catch(err => console.error('Cache err:', err.message));
                }
                breaker.onSuccess().catch(console.error);
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
    aiml: process.env.AIML_SERVICE_URL || 'http://localhost:8010',
    promotion: process.env.PROMOTION_SERVICE_URL || 'http://localhost:8012',
    // HIGH-03: monitoring moved to 8011 — was colliding with payment-service on 8006
    monitoring: process.env.MONITORING_SERVICE_URL || 'http://localhost:8011'
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
    promotion: { success: false, message: "Promotions are currently unavailable" },
    resilience: { fallback: true, message: 'Offline Mock Fallback Active' }
};

// Routing to microservices

// Upload proxy for multipart data using http-proxy-middleware
const makeUploadProxy = (serviceKey, targetUrl, fallbackResponse) => {
    const breaker = breakers[serviceKey];
    return [
        rateLimiter,
        async (req, res, next) => {
            const canCall = await breaker.checkCall();
            if (!canCall) {
                console.warn(`[Circuit Breaker] Blocking upload request to ${serviceKey} (Distributed State: OPEN)`);
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
                return path.replace('/api/v1/sellers', '/seller');
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
                breaker.onSuccess().catch(console.error);
            },
            onError: (err, req, res) => {
                console.error(`[Upload Proxy Error - ${serviceKey}]:`, err);
                breaker.onFailure().catch(console.error);
                res.status(502).json({
                    success: false,
                    message: `Bad Gateway: ${serviceKey} upload failed.`
                });
            }
        })
    ];
};

app.use('/api/v1/auth/login', authLimiter);
app.use('/api/v1/auth/register', authLimiter);
app.use('/api/v1/auth', makeBreakerProxy('auth', services.auth, fallbacks.auth));
app.use('/api/v1/profile', makeBreakerProxy('auth', services.auth, fallbacks.auth));
app.use('/api/v1/products', makeCachedBreakerProxy('product', services.product, fallbacks.product));
app.use('/api/v1/sellers/products/:id/upload-image', makeUploadProxy('product', services.product, fallbacks.product));
app.use('/api/v1/sellers', makeBreakerProxy('product', services.product, fallbacks.product));
app.use('/api/v1/admin/sellers', makeBreakerProxy('product', services.product, fallbacks.product));
app.use('/api/v1/admin/users', makeBreakerProxy('auth', services.auth, fallbacks.auth));
app.use('/api/v1/coupons', makeBreakerProxy('order', services.order, fallbacks.order));
app.use('/api/v1/orders', makeBreakerProxy('order', services.order, fallbacks.order));
// HIGH-03: monitoring now on port 8011 — fixed from hardcoded localhost:8006 (payment service collision)
app.use('/api/v1/monitoring', makeBreakerProxy('resilience', services.monitoring, fallbacks.resilience));
app.use('/api/v1/ai', makeBreakerProxy('ai', services.ai, fallbacks.ai));
app.use('/api/v1/ml', makeBreakerProxy('aiml', services.aiml, fallbacks.aiml));
app.use('/api/v1/payments', makeBreakerProxy('payment', services.payment, fallbacks.payment));
app.use('/api/v1/promotions', makeBreakerProxy('promotion', services.promotion, fallbacks.promotion));
app.use('/api/v1/cart', makeBreakerProxy('cart', services.cart, fallbacks.cart));
app.use('/api/v1/wishlist', makeBreakerProxy('cart', services.cart, fallbacks.cart));
app.use('/api/v1/search', makeCachedBreakerProxy('search', services.search, fallbacks.search));
app.use('/api/v1/reviews', makeBreakerProxy('review', services.review, fallbacks.review));
app.use('/api/v1/resilience', makeBreakerProxy('resilience', 'http://localhost:9999', fallbacks.resilience));

// Admin Dashboard Aggregator API — Scatter-Gather with SRE retries
app.get('/api/v1/admin/stats', async (req, res) => {
    try {
        const headers = {
            Authorization: req.headers.authorization,
            'x-request-id': req.headers['x-request-id'] // Propagate correlation ID
        };

        // Scatter-Gather with exponential backoff retries
        const fetchWithRetry = (url, opts) => retry(async (bail) => {
            const response = await fetch(url, opts);
            if (response.status === 403) bail(new Error('Forbidden')); // Don't retry 403s
            if (!response.ok) throw new Error(`Transient error from ${url}`);
            return response;
        }, { retries: 3, minTimeout: 100, maxTimeout: 1000, factor: 2 });

        // CRIT-07: Fetch real user count from auth-service — no more hardcoded 12450
        const [productsRes, pendingProductsRes, ordersRes, usersRes] = await Promise.all([
            fetchWithRetry(`${services.product}/api/products`, { headers })
                .catch(() => ({ json: () => ({ total: 0 }) })),
            fetchWithRetry(`${services.product}/api/products/moderation/pending`, { headers })
                .catch(() => ({ json: () => ({ count: 0 }) })),
            fetchWithRetry(`${services.order}/analytics/admin`, { headers })
                .catch(() => ({ json: () => ({ data: { total_revenue: 0, total_orders: 0 } }) })),
            fetchWithRetry(`${services.auth}/admin/users/count`, { headers })
                .catch(() => ({ json: () => ({ count: 0 }) }))
        ]);

        const [productsData, pendingData, ordersData, usersData] = await Promise.all([
            productsRes.json(),
            pendingProductsRes.json(),
            ordersRes.json(),
            usersRes.json()
        ]);

        res.status(200).json({
            success: true,
            data: {
                total_products: productsData.total || 0,
                pending_approvals: pendingData.count || 0,
                total_users: usersData.count || 0, // Real count from auth-service
                total_revenue: ordersData.data?.total_revenue || 0,
                total_orders: ordersData.data?.total_orders || 0
            }
        });
    } catch (err) {
        console.error('[AdminStats] Aggregation failed:', err.message);
        res.status(500).json({ success: false, message: 'Failed to aggregate admin stats' });
    }
});

// Health Check
app.get('/health', async (req, res) => {
    try {
        await redisClient.ping();
        res.status(200).json({ status: 'OK', message: 'API Gateway is running', redis: 'connected' });
    } catch (err) {
        res.status(503).json({ status: 'ERROR', message: 'API Gateway starting or Redis is down' });
    }
});

// Centralized API Documentation
app.use('/api-docs', swaggerUi.serve, async (req, res, next) => {
    try {
        const swaggerDoc = await getAggregatedSwagger();
        swaggerUi.setup(swaggerDoc)(req, res, next);
    } catch (err) {
        next(err);
    }
});

// Prometheus Metrics Endpoint
app.get('/metrics', async (req, res) => {
    res.set('Content-Type', register.contentType);
    res.end(await register.metrics());
});

app.listen(PORT, () => {
    console.log(`API Gateway is listening on port ${PORT}`);
});
