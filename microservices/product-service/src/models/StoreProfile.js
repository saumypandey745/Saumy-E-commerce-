const mongoose = require('mongoose');

const storeProfileSchema = new mongoose.Schema({
    seller_id: { type: String, required: true, unique: true }, // References User.id from Auth Service
    store_name: { type: String, required: true },
    slug: { type: String, required: true, unique: true },
    description: { type: String },
    
    logo_url: { type: String },
    banner_url: { type: String },
    
    // KYC and Onboarding
    kyc_status: { type: String, enum: ['PENDING', 'APPROVED', 'REJECTED'], default: 'APPROVED' },
    business_registration_number: { type: String },
    tax_id: { type: String },
    documents: [{
        doc_type: { type: String },
        url: { type: String },
        verified: { type: Boolean, default: false }
    }],
    
    // Contact & Policies
    contact_email: { type: String },
    contact_phone: { type: String },
    return_policy: { type: String },
    shipping_policy: { type: String },
    
    // Performance & Analytics
    total_sales: { type: Number, default: 0 },
    average_rating: { type: Number, default: 0 },
    review_count: { type: Number, default: 0 },
    
    is_suspended: { type: Boolean, default: false }
}, { timestamps: true });

storeProfileSchema.index({ seller_id: 1 });
storeProfileSchema.index({ slug: 1 });

module.exports = mongoose.model('StoreProfile', storeProfileSchema);
