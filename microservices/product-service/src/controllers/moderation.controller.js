const Product = require('../models/Product');
const { redisClient } = require('../config/db');
const { publishEvent } = require('../config/rabbitmq');

exports.getPendingProducts = async (req, res, next) => {
    try {
        const products = await Product.find({ status: 'PENDING_APPROVAL' })
            .populate('category_id', 'name')
            .populate('brand_id', 'name')
            .sort({ updatedAt: -1 });

        res.status(200).json({ success: true, count: products.length, products });
    } catch (error) {
        next(error);
    }
};

exports.approveProduct = async (req, res, next) => {
    try {
        const product = await Product.findById(req.params.id);
        if (!product) return res.status(404).json({ success: false, message: 'Product not found' });

        if (product.status !== 'PENDING_APPROVAL') {
            return res.status(400).json({ success: false, message: `Cannot approve product in status: ${product.status}` });
        }

        product.status = 'ACTIVE';
        product.moderation_notes = req.body.notes || 'Approved by admin';
        await product.save();

        await redisClient.set(`product:read:${product._id}`, JSON.stringify(product));
        // Clear catalog caches
        const keys = await redisClient.keys('products:page=*');
        if (keys.length > 0) await redisClient.del(keys);

        // Sync with Search Engine
        publishEvent('event.product.approved', product.toObject());

        res.status(200).json({ success: true, message: 'Product approved successfully', product });
    } catch (error) {
        next(error);
    }
};

exports.rejectProduct = async (req, res, next) => {
    try {
        const product = await Product.findById(req.params.id);
        if (!product) return res.status(404).json({ success: false, message: 'Product not found' });

        if (product.status !== 'PENDING_APPROVAL') {
             return res.status(400).json({ success: false, message: `Cannot reject product in status: ${product.status}` });
        }

        if (!req.body.notes) {
            return res.status(400).json({ success: false, message: 'Rejection requires moderation notes' });
        }

        product.status = 'REJECTED';
        product.moderation_notes = req.body.notes;
        await product.save();

        res.status(200).json({ success: true, message: 'Product rejected', product });
    } catch (error) {
        next(error);
    }
};
