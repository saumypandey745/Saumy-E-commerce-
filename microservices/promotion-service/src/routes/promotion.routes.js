const express = require('express');
const router = express.Router();
const promotionController = require('../controllers/promotion.controller');
const authMiddleware = require('@ecommerce/shared/middleware/auth.middleware');
const requireRole = require('@ecommerce/shared/middleware/rbac.middleware');

router.post('/validate', promotionController.validateCoupon);
router.get('/coupons/:code', promotionController.getCouponByCode);

// Admin / Seller protected routes
router.use(authMiddleware);
router.post('/coupons', requireRole(['ADMIN', 'SUPER_ADMIN', 'SELLER']), promotionController.createCoupon);
router.get('/coupons', requireRole(['ADMIN', 'SUPER_ADMIN', 'SELLER']), promotionController.getCoupons);

module.exports = router;
