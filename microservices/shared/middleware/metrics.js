const client = require('prom-client');

// Create a Registry
const register = new client.Registry();

// Add default metrics (CPU, Memory, Event Loop, etc.)
client.collectDefaultMetrics({
    app: 'ecommerce-enterprise',
    register
});

// Custom HTTP metrics
const httpRequestDurationMicroseconds = new client.Histogram({
    name: 'http_request_duration_ms',
    help: 'Duration of HTTP requests in ms',
    labelNames: ['method', 'route', 'status_code'],
    buckets: [10, 50, 100, 200, 500, 1000, 2000, 5000]
});
register.registerMetric(httpRequestDurationMicroseconds);

// Express Middleware
const metricsMiddleware = (req, res, next) => {
    // Ignore metrics endpoint
    if (req.path === '/metrics') {
        return next();
    }
    
    const start = Date.now();
    
    // Once response finishes, record duration and status
    res.on('finish', () => {
        const duration = Date.now() - start;
        // Basic normalization for routes (e.g. /api/v1/users/123 -> /api/v1/users/:id)
        // For simplicity, we just use the req.path, but in production we'd want to use req.route?.path
        const route = req.route ? req.baseUrl + req.route.path : req.path;
        
        httpRequestDurationMicroseconds
            .labels(req.method, route, res.statusCode)
            .observe(duration);
    });

    next();
};

const getMetrics = async (req, res) => {
    res.set('Content-Type', register.contentType);
    res.end(await register.metrics());
};

module.exports = {
    metricsMiddleware,
    getMetrics,
    register
};
