const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema({
    product_id: { type: String, required: true, index: true },
    user_id: { type: String, required: true },
    rating: { type: Number, required: true, min: 1, max: 5 },
    comment: { type: String, required: true },
    is_verified_purchase: { type: Boolean, default: false },
    status: { type: String, enum: ['ACTIVE', 'HIDDEN'], default: 'ACTIVE' }
}, { timestamps: true });

// Prevent multiple reviews from the same user on the same product
reviewSchema.index({ product_id: 1, user_id: 1 }, { unique: true });

module.exports = mongoose.model('Review', reviewSchema);
