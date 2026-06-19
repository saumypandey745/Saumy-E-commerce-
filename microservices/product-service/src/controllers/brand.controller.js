const Brand = require('../models/Brand');
const slugify = require('slugify');

exports.createBrand = async (req, res, next) => {
    try {
        const { name, logo_url, description } = req.body;
        const slug = slugify(name, { lower: true, strict: true });

        const existing = await Brand.findOne({ slug });
        if (existing) return res.status(400).json({ success: false, message: 'Brand already exists' });

        const brand = await Brand.create({ name, slug, logo_url, description });
        res.status(201).json({ success: true, brand });
    } catch (error) {
        next(error);
    }
};

exports.getBrands = async (req, res, next) => {
    try {
        const brands = await Brand.find().sort({ name: 1 });
        res.status(200).json({ success: true, count: brands.length, brands });
    } catch (error) {
        next(error);
    }
};
