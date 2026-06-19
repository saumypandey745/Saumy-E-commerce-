const mongoose = require('mongoose');

const cartItemSchema = new mongoose.Schema({
    product_id: { type: String, required: true },
    sku: { type: String, required: true },
    seller_id: { type: String, required: true },
    quantity: { type: Number, required: true, min: 1 },
    price_at_addition: { type: Number, required: true },
    title: { type: String, required: true },
    image: { type: String },
    saved_for_later: { type: Boolean, default: false }
}, { _id: false });

const cartSchema = new mongoose.Schema({
    user_id: { type: String, index: true }, // Optional for guest carts
    guest_id: { type: String, index: true }, // Optional for authenticated carts
    items: [cartItemSchema],
    coupon_code: { type: String },
    expires_at: { type: Date } // For guest carts to be auto-purged if needed
}, { timestamps: true });

// Ensure a cart has either user_id or guest_id
cartSchema.pre('save', function(next) {
    if (!this.user_id && !this.guest_id) {
        return next(new Error('Cart must have either user_id or guest_id'));
    }
    next();
});

module.exports = mongoose.model('Cart', cartSchema);
