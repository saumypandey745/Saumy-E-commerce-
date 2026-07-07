const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
    console.error('[FATAL] JWT_SECRET environment variable is not set. Server cannot start securely.');
    process.exit(1);
}

/**
 * RBAC Permission Matrix defining which roles can access which API prefixes.
 * Array of roles allowed. '*' means all authenticated users.
 */
const PERMISSIONS = {
    '/api/auth/me': ['*'],
    '/api/auth/logout': ['*'],
    '/api/auth/password': ['*'],
    
    // Profiles
    '/api/profile': ['*'],
    
    // Shopping
    '/api/cart': ['CUSTOMER', 'SELLER', 'ADMIN', 'SUPER_ADMIN'], // Sellers can also buy
    '/api/orders/seller': ['SELLER'], // Specific seller routes must come BEFORE general orders
    '/api/orders': ['*'],
    '/api/wishlist': ['*'],
    
    // Seller Portal Routes
    '/api/sellers/onboard': ['CUSTOMER', 'SELLER', 'ADMIN', 'SUPER_ADMIN'], // Customer converts to seller
    '/api/sellers/store': ['SELLER', 'ADMIN', 'SUPER_ADMIN'],
    '/api/sellers/analytics': ['SELLER', 'ADMIN', 'SUPER_ADMIN'],
    '/api/sellers/products': ['SELLER', 'ADMIN', 'SUPER_ADMIN'],
    '/api/products/bulk-import': ['SELLER', 'ADMIN', 'SUPER_ADMIN'],
    
    // Admin Routes
    '/api/admin': ['ADMIN', 'SUPER_ADMIN'],
    '/api/v1/monitoring': ['ADMIN', 'SUPER_ADMIN'], // Only Super Admin and Admin can view system telemetry
    '/api/admin/system': ['SUPER_ADMIN'], // Only Super Admin can see System DevOps Health
    '/api/admin/audit-logs': ['SUPER_ADMIN']
};

/**
 * Verifies JWT and checks RBAC matrix
 */
const authorize = (req, res, next) => {
    // 1. Bypass public routes entirely
    if (
        req.path.startsWith('/api/auth/login') ||
        req.path.startsWith('/api/auth/register') ||
        req.path.startsWith('/api/auth/verify-otp') ||
        req.path.startsWith('/api/auth/google') ||
        req.path.startsWith('/api/auth/logout') ||
        (req.path.startsWith('/api/products') && req.method === 'GET') ||
        req.path.startsWith('/api/search') ||
        req.path.startsWith('/api/cart') ||
        (req.path.startsWith('/api/reviews') && req.method === 'GET') ||
        req.path.startsWith('/api/ai') ||
        req.path.startsWith('/api/ml') ||
        req.path.startsWith('/api/resilience') ||
        req.path === '/health' ||
        req.path === '/metrics'
    ) {
        return next();
    }

    // 2. Extract Token
    let token = req.cookies?.accessToken;
    
    // Fallback to Authorization header
    if (!token) {
        const authHeader = req.headers.authorization;
        if (authHeader && authHeader.startsWith('Bearer ')) {
            token = authHeader.split(' ')[1];
        }
    }

    if (!token) {
        return res.status(401).json({ success: false, message: 'Unauthorized: Missing or invalid token' });
    }

    // ⚠️  DEV-ONLY mock bypass tokens — NEVER active in production
    if (process.env.NODE_ENV !== 'production' && token === 'admin-mock-token') {
        req.user = { id: 'admin-mock-id', role: 'ADMIN' };
    } else if (process.env.NODE_ENV !== 'production' && token === 'superadmin-mock-token') {
        req.user = { id: 'superadmin-mock-id', role: 'SUPER_ADMIN' };
    } else if (process.env.NODE_ENV !== 'production' && token === 'seller-mock-token') {
        req.user = { id: 'seller-mock-id', role: 'SELLER' };
    } else if (process.env.NODE_ENV !== 'production' && token === 'customer-mock-token') {
        req.user = { id: 'customer-mock-id', role: 'CUSTOMER' };
    } else {
        // Real JWT Verification — always active
        try {
            const decoded = jwt.verify(token, JWT_SECRET);
            req.user = decoded;
        } catch (err) {
            return res.status(401).json({ success: false, message: 'Unauthorized: Token expired or invalid' });
        }
    }

    // 3. RBAC Enforcement
    const role = req.user.role;
    
    // Find matching route policy
    let allowedRoles = null;
    for (const [routePattern, roles] of Object.entries(PERMISSIONS)) {
        if (req.path.startsWith(routePattern)) {
            allowedRoles = roles;
            break; // First match wins (order matters in PERMISSIONS dict)
        }
    }

    // If no explicit policy exists, default to safe open or blocked.
    // For a strict system, default to blocked unless it's a known endpoint.
    // Since this is evolving, if we didn't define it in the matrix but required auth, we allow.
    if (!allowedRoles || allowedRoles.includes('*') || allowedRoles.includes(role)) {
        // Inject verified user context into downstream requests
        req.headers['x-user-id'] = req.user.id;
        req.headers['x-user-role'] = req.user.role;
        // Propagate correlation ID for distributed tracing
        if (req.headers['x-request-id']) {
            req.headers['x-request-id'] = req.headers['x-request-id'];
        }
        
        // Strict ownership: always inject x-seller-id for sellers to prevent malicious payload overrides
        if (role === 'SELLER') {
            req.headers['x-seller-id'] = req.user.id;
        }
        
        return next();
    }

    // Role is blocked
    const errorMsg = `Forbidden: Your role '${role}' does not have permission to access ${req.path}`;
    
    // Attempt to publish security alert (ignoring failures if redis isn't attached yet)
    try {
        const { createClient } = require('redis');
        const pubClient = createClient({ url: process.env.REDIS_URL || 'redis://localhost:6379' });
        pubClient.connect().then(() => {
            pubClient.publish('telemetry:security_alerts', JSON.stringify({
                type: 'RBAC_VIOLATION',
                user: req.user.id,
                role: role,
                path: req.path,
                ip: req.ip,
                timestamp: new Date().toISOString()
            })).finally(() => pubClient.disconnect());
        });
    } catch(e) {}

    return res.status(403).json({ 
        success: false, 
        message: errorMsg 
    });
};

module.exports = authorize;
