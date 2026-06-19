const mongoose = require('mongoose');

const wishlistItemSchema = new mongoose.Schema({
    product_id: { type: String, required: true },
    title: { type: String, required: true },
    image: { type: String },
    price: { type: Number },
    added_at: { type: Date, default: Date.now }
}, { _id: false });

const wishlistSchema = new mongoose.Schema({
    user_id: { type: String, required: true, index: true, unique: true },
    items: [wishlistItemSchema]
}, { timestamps: true });

module.exports = mongoose.model('Wishlist', wishlistSchema);
