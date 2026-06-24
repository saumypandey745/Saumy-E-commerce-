const mongoose = require('mongoose');

const sellerPayoutSchema = new mongoose.Schema({
    seller_id: { type: String, required: true },
    amount: { type: Number, required: true },
    currency: { type: String, default: 'USD' },
    status: { 
        type: String, 
        enum: ['REQUESTED', 'PROCESSING', 'PAID', 'FAILED', 'CANCELLED'], 
        default: 'REQUESTED' 
    },
    payment_method: {
        type: { type: String, enum: ['BANK_TRANSFER', 'PAYPAL', 'STRIPE_CONNECT'], required: true },
        details: { type: mongoose.Schema.Types.Mixed } // e.g. bank account info, email
    },
    reference_number: { type: String }, // External provider reference
    processed_at: { type: Date },
    notes: { type: String }
}, { timestamps: true });

sellerPayoutSchema.index({ seller_id: 1, status: 1 });

module.exports = mongoose.model('SellerPayout', sellerPayoutSchema);
