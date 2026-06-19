const express = require('express');
const router = express.Router();
const orderController = require('../controllers/order.controller');
const checkoutController = require('../controllers/checkout.controller');
const authMiddleware = require('@ecommerce/shared/middleware/auth.middleware');

router.use(authMiddleware);

router.post('/checkout', checkoutController.checkoutCart);
router.get('/verify-purchase', orderController.verifyPurchase);
router.get('/', orderController.getUserOrders);
router.get('/:id', orderController.getOrderById);

module.exports = router;
