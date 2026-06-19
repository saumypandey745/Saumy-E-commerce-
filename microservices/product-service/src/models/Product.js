const mongoose = require('mongoose');

const variantSchema = new mongoose.Schema({
    sku: { type: String, required: true, unique: true, sparse: true },
    attributes: { type: Map, of: String }, // e.g. {"Size": "L", "Color": "Red"}
    price_modifier: { type: Number, default: 0 },
    inventory_count: { type: Number, default: 0 },
    images: [{ type: String }],
    warehouses: [{
        warehouse_id: { type: String, required: true },
        name: { type: String, required: true },
        stock: { type: Number, default: 0 }
    }]
});

const productSchema = new mongoose.Schema({
    title: { type: String, required: true },
    slug: { type: String, required: true, unique: true },
    description: { type: String, required: true },
    base_price: { type: Number, required: true },
    
    seller_id: { type: String, required: true }, // References User.id from Auth Service
    
    category_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Category', required: true },
    brand_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Brand' },
    
    attributes: { type: Map, of: String }, // Global attributes for the product
    variants: [variantSchema],
    
    images: [{ type: String }],
    videos: [{ type: String }],
    
    status: { 
        type: String, 
        enum: ['DRAFT', 'PENDING_APPROVAL', 'ACTIVE', 'REJECTED', 'OUT_OF_STOCK', 'ARCHIVED'], 
        default: 'DRAFT' 
    },
    moderation_notes: { type: String },
    
    // Aggregated inventory across all variants
    total_inventory_count: { type: Number, default: 0 },

    // Review statistics
    average_rating: { type: Number, default: 0 },
    review_count: { type: Number, default: 0 }
}, { timestamps: true });

// Create text index for search
productSchema.index({ title: 'text', description: 'text' });
productSchema.index({ slug: 1 });
productSchema.index({ seller_id: 1 });

module.exports = mongoose.model('Product', productSchema);
