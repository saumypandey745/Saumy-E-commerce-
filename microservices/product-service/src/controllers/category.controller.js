const Category = require('../models/Category');
const slugify = require('slugify');
const { redisClient } = require('../config/db');

exports.createCategory = async (req, res, next) => {
    try {
        const { name, parent_id, attributes_schema } = req.body;
        const slug = slugify(name, { lower: true, strict: true });

        const existing = await Category.findOne({ slug });
        if (existing) return res.status(400).json({ success: false, message: 'Category slug already exists' });

        const category = await Category.create({ name, slug, parent_id, attributes_schema });
        
        await redisClient.del('categories:tree'); // Invalidate cache
        res.status(201).json({ success: true, category });
    } catch (error) {
        next(error);
    }
};

exports.getCategories = async (req, res, next) => {
    try {
        const cachedTree = await redisClient.get('categories:tree');
        if (cachedTree) {
            return res.status(200).json({ success: true, categories: JSON.parse(cachedTree) });
        }

        // Fetch all and build tree
        const categories = await Category.find().lean();
        
        const categoryMap = {};
        categories.forEach(cat => categoryMap[cat._id] = { ...cat, children: [] });

        const tree = [];
        categories.forEach(cat => {
            if (cat.parent_id && categoryMap[cat.parent_id]) {
                categoryMap[cat.parent_id].children.push(categoryMap[cat._id]);
            } else {
                tree.push(categoryMap[cat._id]);
            }
        });

        await redisClient.set('categories:tree', JSON.stringify(tree), { EX: 86400 }); // Cache 1 day
        res.status(200).json({ success: true, categories: tree });
    } catch (error) {
        next(error);
    }
};
