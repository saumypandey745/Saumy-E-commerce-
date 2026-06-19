const Review = require('../models/Review');
const { publishEvent } = require('../config/rabbitmq');

const ORDER_SERVICE_URL = process.env.ORDER_SERVICE_URL || 'http://localhost:8004';

exports.createReview = async (req, res, next) => {
    try {
        const { product_id, rating, comment } = req.body;
        const user_id = req.user.id;

        // 1. Verify Purchase via Order Service
        let is_verified_purchase = false;
        try {
            const verifyResponse = await fetch(`${ORDER_SERVICE_URL}/verify-purchase?user_id=${user_id}&product_id=${product_id}`, {
                headers: { 'Authorization': req.headers.authorization || '' } // Pass token
            });
            const verifyData = await verifyResponse.json();
            if (verifyData.success && verifyData.has_purchased) {
                is_verified_purchase = true;
            }
        } catch (err) {
            console.error('[Review Service] Error calling order-service:', err.message);
        }

        // 2. Save Review
        let review = await Review.findOne({ product_id, user_id });
        if (review) {
            // Update existing review
            review.rating = rating;
            review.comment = comment;
            review.is_verified_purchase = is_verified_purchase;
            await review.save();
        } else {
            // Create new review
            review = await Review.create({
                product_id,
                user_id,
                rating,
                comment,
                is_verified_purchase
            });
        }

        // 3. Recalculate Average
        const stats = await Review.aggregate([
            { $match: { product_id, status: 'ACTIVE' } },
            { $group: {
                _id: '$product_id',
                average_rating: { $avg: '$rating' },
                review_count: { $sum: 1 }
            }}
        ]);

        const newAvg = stats.length > 0 ? stats[0].average_rating : 0;
        const newCount = stats.length > 0 ? stats[0].review_count : 0;

        // 4. Publish Event for Product Service
        publishEvent('event.review.updated', {
            product_id,
            average_rating: newAvg,
            review_count: newCount
        });

        res.status(201).json({ success: true, message: 'Review saved', review });
    } catch (error) {
        next(error);
    }
};

exports.getProductReviews = async (req, res, next) => {
    try {
        const { product_id } = req.params;
        const { page = 1, limit = 10 } = req.query;

        const reviews = await Review.find({ product_id, status: 'ACTIVE' })
            .sort({ createdAt: -1 })
            .skip((page - 1) * limit)
            .limit(Number(limit));

        const total = await Review.countDocuments({ product_id, status: 'ACTIVE' });

        res.status(200).json({
            success: true,
            count: reviews.length,
            total,
            reviews
        });
    } catch (error) {
        next(error);
    }
};
