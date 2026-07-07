const express = require('express');
const router = express.Router();
const adminController = require('../controllers/admin.controller');

// Middleware to ensure user is Admin
const authMiddleware = (req, res, next) => {
    const role = req.headers['x-user-role'];
    // In local testing without gateway, headers might be missing, but for production, we rely on api-gateway RBAC + headers
    if (role !== 'ADMIN' && role !== 'SUPER_ADMIN') {
        // Fallback for internal microservice-to-microservice calls (e.g. from monitoring-service)
        if (req.headers['x-internal-service'] === 'monitoring-service') {
            return next();
        }
        return res.status(403).json({ success: false, message: 'Admin access required' });
    }
    next();
};

router.use(authMiddleware);

router.get('/', adminController.getAllUsers);
router.get('/stats', adminController.getUserStats);
router.put('/:id/role', adminController.updateUserRole);
router.put('/:id/status', adminController.updateUserStatus);

module.exports = router;
