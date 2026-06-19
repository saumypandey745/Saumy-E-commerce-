const express = require('express');
const router = express.Router();
const productController = require('../controllers/product.controller');
const authMiddleware = require('@ecommerce/shared/middleware/auth.middleware');
const requireRole = require('@ecommerce/shared/middleware/rbac.middleware');
// Public catalog routes
router.get('/', productController.getProducts);
router.get('/:id', productController.getProductById); // Also handles slug

// Seller routes
router.post('/', authMiddleware, requireRole(['SELLER', 'ADMIN']), productController.createProduct);
router.post('/:id/submit', authMiddleware, requireRole(['SELLER', 'ADMIN']), productController.submitForApproval);

// Internal microservice endpoints for saga pattern
router.post('/internal/reserve', productController.reserveStock);
router.post('/internal/release', productController.releaseStock);

module.exports = router;
