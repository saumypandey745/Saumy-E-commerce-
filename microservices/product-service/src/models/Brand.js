const mongoose = require('mongoose');

const brandSchema = new mongoose.Schema({
    name: { type: String, required: true },
    slug: { type: String, required: true, unique: true },
    logo_url: { type: String },
    description: { type: String }
}, { timestamps: true });

module.exports = mongoose.model('Brand', brandSchema);
