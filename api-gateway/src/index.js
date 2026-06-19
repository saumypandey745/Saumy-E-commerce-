const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const { createProxyMiddleware, responseInterceptor } = require('http-proxy-middleware');
const redis = require('redis');
const promClient = require('prom-client');
const { trace } = require('@opentelemetry/api');
const retry = require('async-retry');
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

app.use(helmet());
app.use(cors());
app.use(morgan('combined'));

// Redis client setup for Rate Limiting
const redisClient = redis.createClient({ url: process.env.REDIS_URL || 'redis://localhost:6379' });
redisClient.connect().catch(err => console.error('[Gateway Redis] Connection Error:', err));

// Rate Limiting Middleware
const rateLimiter = async (req, res, next) => {
    try {
        const ip = req.ip;
        const key = `rate_limit:${ip}`;
        const limit = 60; // 60 requests per minute
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
        createProxyMiddleware({
            target: targetUrl,
            changeOrigin: true,
            pathRewrite: (path, req) => {
                if (path.startsWith('/api/cart') || path.startsWith('/api/wishlist')) return path;
                return path.replace(/^\/api\/[^\/]+/, '');
            },
            proxyTimeout: 3000, // Phase 11 SRE: Strict timeout strategy
            onError: (err, req, res) => {
                breaker.onFailure();
                res.status(502).json({
                    success: false,
                    message: `Bad Gateway: ${serviceKey} connection failed.`
                });
            },
            onProxyRes: (proxyRes, req, res) => {
                breaker.onSuccess();
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
        createProxyMiddleware({
            target: targetUrl,
            changeOrigin: true,
            pathRewrite: (path, req) => {
                if (path.startsWith('/api/cart') || path.startsWith('/api/wishlist')) return path;
                return path.replace(/^\/api\/[^\/]+/, '');
            },
            selfHandleResponse: true,
            onProxyRes: responseInterceptor(async (responseBuffer, proxyRes, req, res) => {
                breaker.onSuccess();
                const responseStr = responseBuffer.toString('utf8');
                if (req.method === 'GET' && proxyRes.statusCode === 200 && req.query.bypassCache !== 'true') {
                    try {
                        const key = `cache:${req.originalUrl}`;
                        await redisClient.set(key, responseStr, { EX: 60 });
                    } catch (e) { console.error('Redis cache set error', e); }
                }
                return responseBuffer;
            }),
            onError: (err, req, res) => {
                breaker.onFailure();
                res.status(502).json({
                    success: false,
                    message: `Bad Gateway: ${serviceKey} connection failed.`
                });
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
    review: process.env.REVIEW_SERVICE_URL || 'http://localhost:8009'
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
    resilience: { fallback: true, message: 'Offline Mock Fallback Active' }
};

// Routing to microservices
app.use('/api/auth', makeBreakerProxy('auth', services.auth, fallbacks.auth));
app.use('/api/products', makeCachedBreakerProxy('product', services.product, fallbacks.product));
app.use('/api/orders', makeBreakerProxy('order', services.order, fallbacks.order));
app.use('/api/ai', makeBreakerProxy('ai', services.ai, fallbacks.ai));
app.use('/api/payments', makeBreakerProxy('payment', services.payment, fallbacks.payment));
app.use('/api/cart', makeBreakerProxy('cart', services.cart, fallbacks.cart));
app.use('/api/wishlist', makeBreakerProxy('cart', services.cart, fallbacks.cart));
app.use('/api/search', makeCachedBreakerProxy('search', services.search, fallbacks.search));
app.use('/api/reviews', makeBreakerProxy('review', services.review, fallbacks.review));
app.use('/api/resilience', makeBreakerProxy('resilience', 'http://localhost:9999', fallbacks.resilience));

// Admin Dashboard Aggregator API
const isAdmin = async (req, res, next) => {
    const token = req.headers.authorization;
    if (!token) return res.status(401).json({ success: false, message: 'Unauthorized' });
    
    // Developer bypass for Phase 8 Admin Dashboard
    if (token === 'Bearer admin-mock-token') {
        req.user = { id: 'admin123', role: 'ADMIN' };
        return next();
    }

    try {
        const authRes = await fetch(`${services.auth}/api/auth/me`, { headers: { Authorization: token }});
        const authData = await authRes.json();
        if (authData.success && authData.user.role === 'ADMIN') {
            next();
        } else {
            res.status(403).json({ success: false, message: 'Forbidden: Admin access required' });
        }
    } catch (err) {
        res.status(500).json({ success: false, message: 'Auth service unavailable' });
    }
};

app.get('/api/admin/stats', isAdmin, async (req, res) => {
    try {
        const headers = { Authorization: req.headers.authorization };
        
        // Scatter-Gather pattern with SRE Exponential Backoff Retries (Phase 11)
        const fetchWithRetry = (url, opts) => retry(async (bail) => {
            const response = await fetch(url, opts);
            if (response.status === 403) bail(new Error('Forbidden')); // Don't retry 403s
            if (!response.ok) throw new Error('Transient error');
            return response;
        }, { retries: 3, minTimeout: 100, maxTimeout: 1000 });

        const [productsRes, pendingProductsRes] = await Promise.all([
            fetchWithRetry(`${services.product}/api/products`, { headers }),
            fetchWithRetry(`${services.product}/api/products/moderation/pending`, { headers }).catch(() => ({ json: () => ({ count: 0 }) }))
        ]);

        const productsData = await productsRes.json();
        const pendingData = await pendingProductsRes.json();

        // In a real scenario, we'd also fetch total users and revenue. For Phase 8, we mock those metrics 
        // to avoid building dedicated sum/count endpoints in order-service.
        res.status(200).json({
            success: true,
            data: {
                total_products: productsData.total || 0,
                pending_approvals: pendingData.count || 0,
                total_users: 12450,
                total_revenue: 345000.00
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
