const express = require('express');
const router = express.Router();
const paymentController = require('../controllers/payment.controller');

// Note: In a real system, these would be protected by auth/RBAC middleware
router.get('/invoices/:id/download', paymentController.downloadInvoice);
router.get('/transactions', paymentController.getTransactionHistory);
router.post('/checkout-session', paymentController.createCheckoutSession);

module.exports = router;
