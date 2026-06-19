const express = require('express');
const router = express.Router();
const brandController = require('../controllers/brand.controller');
const authMiddleware = require('@ecommerce/shared/middleware/auth.middleware');
const requireRole = require('@ecommerce/shared/middleware/rbac.middleware');

router.get('/', brandController.getBrands);

// Admin only
router.post('/', authMiddleware, requireRole(['ADMIN', 'SUPER_ADMIN']), brandController.createBrand);

module.exports = router;
