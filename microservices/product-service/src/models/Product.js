const mongoose = require('mongoose');

const variantSchema = new mongoose.Schema({
    sku: { type: String, required: true, unique: true, sparse: true },
    color: { type: String },
    size: { type: String },
    storage: { type: String },
    model: { type: String },
    attributes: { type: Map, of: String }, // Additional flexible attributes
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
    short_description: { type: String },
    description: { type: String, required: true },
    barcode: { type: String }, // EAN/UPC
    features: [{ type: String }], // e.g., ["Waterproof", "Noise Cancelling"]
    specifications: { type: Map, of: String }, // e.g., {"Battery": "4000mAh", "Weight": "200g"}
    
    base_price: { type: Number, required: true },
    discount_percentage: { type: Number, default: 0 },
    final_price: { type: Number, required: true }, // Computed pre-insertion for fast querying
    tax_percentage: { type: Number, default: 0 },
    
    seller_id: { type: String, required: true }, // References User.id from Auth Service
    brand: { type: String }, // e.g., "Apple", "Samsung"
    
    category_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Category', required: true },
    subcategory_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Category' },
    brand_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Brand' },
    
    tags: [{ type: String }], // e.g., ["gaming", "wireless"]
    search_keywords: [{ type: String }], // Hidden keywords for better search discovery
    meta_title: { type: String },
    meta_description: { type: String },

    weight: { type: Number }, // in kg
    dimensions: {
        length: { type: Number },
        width: { type: Number },
        height: { type: Number }
    }, // in cm

    delivery_estimate: { type: String }, // e.g. "2-4 Business Days"
    return_policy: { type: String }, // e.g. "30-Day Free Returns"
    warranty: { type: String }, // e.g. "1 Year Manufacturer Warranty"

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

// Existing indexes
productSchema.index({ title: 'text', description: 'text', tags: 'text', search_keywords: 'text' });
productSchema.index({ slug: 1 }, { unique: true });

// MED-01: Composite indexes for high-frequency query patterns
// Without these, every seller dashboard query / category page is a full collection scan
productSchema.index({ seller_id: 1, status: 1 });        // Seller dashboard: products by seller+status
productSchema.index({ category_id: 1, status: 1 });      // Category pages: products by category+status
productSchema.index({ subcategory_id: 1, status: 1 });   // Subcategory pages
productSchema.index({ final_price: 1, status: 1 });      // Price-sorted listings
productSchema.index({ average_rating: -1, status: 1 });  // Top-rated products listing
productSchema.index({ createdAt: -1 });                  // Newest products
productSchema.index({ status: 1, createdAt: -1 });       // Admin moderation queue (PENDING_APPROVAL sorted by age)

module.exports = mongoose.model('Product', productSchema);
