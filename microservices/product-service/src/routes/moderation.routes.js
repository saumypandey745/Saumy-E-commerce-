const express = require('express');
const router = express.Router();
const moderationController = require('../controllers/moderation.controller');
const authMiddleware = require('@ecommerce/shared/middleware/auth.middleware');
const requireRole = require('@ecommerce/shared/middleware/rbac.middleware');

// All moderation routes are Admin only
router.use(authMiddleware, requireRole(['ADMIN', 'SUPER_ADMIN']));

router.get('/pending', moderationController.getPendingProducts);
router.post('/:id/approve', moderationController.approveProduct);
router.post('/:id/reject', moderationController.rejectProduct);

module.exports = router;
