const mongoose = require('mongoose');

const sellerTransactionSchema = new mongoose.Schema({
    seller_id: { type: String, required: true }, // References User.id
    order_id: { type: String }, // Optional, if linked to an order
    type: { 
        type: String, 
        enum: ['CREDIT', 'DEBIT', 'PAYOUT', 'REFUND', 'FEE'], 
        required: true 
    },
    amount: { type: Number, required: true }, // Positive for CREDIT, Negative for DEBIT/PAYOUT/FEE
    currency: { type: String, default: 'USD' },
    status: { type: String, enum: ['PENDING', 'COMPLETED', 'FAILED', 'CANCELLED'], default: 'PENDING' },
    description: { type: String },
    reference_id: { type: String }, // E.g., payout ID, payment intent ID
}, { timestamps: true });

sellerTransactionSchema.index({ seller_id: 1, createdAt: -1 });
sellerTransactionSchema.index({ order_id: 1 });

module.exports = mongoose.model('SellerTransaction', sellerTransactionSchema);
