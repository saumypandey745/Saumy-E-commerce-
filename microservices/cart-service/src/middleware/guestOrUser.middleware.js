const verifyToken = require('@ecommerce/shared/middleware/auth.middleware');

/**
 * Middleware to resolve either a logged-in User ID or a Guest ID.
 * Expects 'Authorization' header for user, or 'x-guest-id' for guest.
 */
const resolveIdentity = async (req, res, next) => {
    // Try to authenticate user first if token exists
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
        return verifyToken(req, res, () => {
            // After verifyToken, req.user is set
            next();
        });
    }

    // Fallback to guest ID
    const guestId = req.headers['x-guest-id'];
    if (guestId) {
        req.guestId = guestId;
        return next();
    }

    return res.status(401).json({
        success: false,
        message: 'Authentication required. Provide either an auth token or x-guest-id header.'
    });
};

/**
 * Enforces that only an authenticated user can proceed.
 */
const requireUser = (req, res, next) => {
    return verifyToken(req, res, next);
};

module.exports = { resolveIdentity, requireUser };
