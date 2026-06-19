const mongoose = require('mongoose');

const inventoryLogSchema = new mongoose.Schema({
    product_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
    sku: { type: String, required: true },
    warehouse_id: { type: String, required: true },
    quantity_change: { type: Number, required: true },
    previous_stock: { type: Number, required: true },
    new_stock: { type: Number, required: true },
    reason: { type: String, enum: ['PURCHASE', 'RESTOCK', 'REFUND', 'MANUAL_ADJUSTMENT'], required: true },
    reference_id: { type: String } // e.g. order_id
}, { timestamps: true });

module.exports = mongoose.model('InventoryLog', inventoryLogSchema);
