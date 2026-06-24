const mongoose = require('mongoose');

const sellerAnalyticsSchema = new mongoose.Schema({
    seller_id: { type: String, required: true },
    date: { type: Date, required: true }, // Aggregated by day (e.g., 2026-06-23T00:00:00Z)
    metrics: {
        total_revenue: { type: Number, default: 0 },
        total_orders: { type: Number, default: 0 },
        total_items_sold: { type: Number, default: 0 },
        page_views: { type: Number, default: 0 },
        conversion_rate: { type: Number, default: 0 } // e.g. 2.5
    },
    top_products: [{
        product_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
        title: { type: String },
        revenue: { type: Number, default: 0 },
        units_sold: { type: Number, default: 0 }
    }]
}, { timestamps: true });

// Compound index for quick querying by seller and date range
sellerAnalyticsSchema.index({ seller_id: 1, date: -1 }, { unique: true });

module.exports = mongoose.model('SellerAnalytics', sellerAnalyticsSchema);
