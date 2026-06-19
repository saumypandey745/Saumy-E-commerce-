console.log("RBAC Middleware Loaded!");
/**
 * Role-Based Access Control Middleware
 * Ensure this is used AFTER auth.middleware.js so req.user is populated.
 * @param {string[]} allowedRoles - Array of roles allowed to access the route
 */
const requireRole = (allowedRoles) => {
    return (req, res, next) => {
        console.log("RBAC Check -> User:", req.user, "Allowed:", allowedRoles);
        if (!req.user) {
            return res.status(401).json({ message: 'Unauthorized: User not authenticated' });
        }

        if (!allowedRoles.includes(req.user.role)) {
            return res.status(403).json({ message: `Forbidden: Requires one of roles: ${allowedRoles.join(', ')}` });
        }

        next();
    };
};

module.exports = requireRole;
