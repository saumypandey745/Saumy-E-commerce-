const mongoose = require('mongoose');

const categorySchema = new mongoose.Schema({
    name: { type: String, required: true },
    slug: { type: String, required: true, unique: true },
    parent_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Category', default: null },
    image_url: { type: String },
    seo_title: { type: String },
    seo_description: { type: String },
    status: { type: String, enum: ['ACTIVE', 'INACTIVE'], default: 'ACTIVE' },
    attributes_schema: [{
        key: { type: String, required: true },
        type: { type: String, enum: ['string', 'number', 'boolean', 'array'], default: 'string' },
        required: { type: Boolean, default: false }
    }]
}, { timestamps: true });

module.exports = mongoose.model('Category', categorySchema);
