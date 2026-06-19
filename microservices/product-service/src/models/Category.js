const mongoose = require('mongoose');

const categorySchema = new mongoose.Schema({
    name: { type: String, required: true },
    slug: { type: String, required: true, unique: true },
    parent_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Category', default: null },
    attributes_schema: [{
        key: { type: String, required: true },
        type: { type: String, enum: ['string', 'number', 'boolean', 'array'], default: 'string' },
        required: { type: Boolean, default: false }
    }]
}, { timestamps: true });

module.exports = mongoose.model('Category', categorySchema);
