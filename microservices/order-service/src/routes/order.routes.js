const express = require('express');
const router = express.Router();
const orderController = require('../controllers/order.controller');
const checkoutController = require('../controllers/checkout.controller');
const analyticsController = require('../controllers/analytics.controller');
const authMiddleware = require('@ecommerce/shared/middleware/auth.middleware');
const requireRole = require('@ecommerce/shared/middleware/rbac.middleware');

router.use(authMiddleware);

router.post('/checkout', checkoutController.checkoutCart);

router.get('/verify-purchase', orderController.verifyPurchase);
router.get('/seller', requireRole(['SELLER', 'ADMIN']), orderController.getSellerOrders);
router.put('/seller/:id/status', requireRole(['SELLER', 'ADMIN']), orderController.updateOrderStatus);
router.get('/analytics/seller', requireRole(['SELLER', 'ADMIN']), analyticsController.getSellerAnalytics);
router.get('/analytics/admin', requireRole(['ADMIN']), analyticsController.getAdminAnalytics);
router.get('/', orderController.getUserOrders);
router.get('/:id', orderController.getOrderById);

router.post('/:id/return', orderController.requestReturn);
router.put('/admin/:id/return/approve', requireRole(['ADMIN', 'SUPER_ADMIN']), orderController.approveReturn);

module.exports = router;
