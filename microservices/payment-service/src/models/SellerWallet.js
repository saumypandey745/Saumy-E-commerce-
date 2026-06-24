const mongoose = require('mongoose');

const sellerWalletSchema = new mongoose.Schema({
    seller_id: { type: String, required: true, unique: true }, // References User.id
    balance: { type: Number, default: 0.0 }, // Available to withdraw
    pending_balance: { type: Number, default: 0.0 }, // Still clearing or in transit
    total_earned: { type: Number, default: 0.0 }, // Lifetime gross earnings
    total_withdrawn: { type: Number, default: 0.0 }, // Lifetime withdrawn amount
    currency: { type: String, default: 'USD' },
    status: { type: String, enum: ['ACTIVE', 'SUSPENDED', 'FROZEN'], default: 'ACTIVE' },
    last_payout_date: { type: Date }
}, { timestamps: true });

sellerWalletSchema.index({ seller_id: 1 });

module.exports = mongoose.model('SellerWallet', sellerWalletSchema);
