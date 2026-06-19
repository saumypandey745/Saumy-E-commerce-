const express = require('express');
const router = express.Router();
const categoryController = require('../controllers/category.controller');
const authMiddleware = require('@ecommerce/shared/middleware/auth.middleware');
const requireRole = require('@ecommerce/shared/middleware/rbac.middleware');

router.get('/', categoryController.getCategories);

// Admin only
router.post('/', authMiddleware, requireRole(['ADMIN', 'SUPER_ADMIN']), categoryController.createCategory);

module.exports = router;
