const express = require('express');
const router = express.Router();
const reviewController = require('../controllers/review.controller');
const authMiddleware = require('@ecommerce/shared/middleware/auth.middleware');

router.get('/:product_id', reviewController.getProductReviews);

// Protected routes
router.use(authMiddleware);
router.post('/', reviewController.createReview);

module.exports = router;
