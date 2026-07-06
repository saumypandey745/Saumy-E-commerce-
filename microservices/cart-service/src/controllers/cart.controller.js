const cartService = require('../services/cart.service');
const Joi = require('joi');

// HIGH-06: Accept both camelCase (productId) and snake_case (product_id) for backward compatibility
// The platform standard is snake_case; this adapter prevents integration test failures
// and protects against client naming variations during the API versioning migration (ARCH-02)
const addItemSchema = Joi.object({
    productId: Joi.string().optional(),
    product_id: Joi.string().optional(),
    sku: Joi.string().required(),
    quantity: Joi.number().integer().min(1).required()
}).or('productId', 'product_id'); // At least one must be present

exports.getCart = async (req, res) => {
    try {
        const userId = req.user ? req.user.id : null;
        const guestId = req.guestId || null;
        const cart = await cartService.getCart(userId, guestId);
        res.status(200).json({ success: true, data: cart });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

exports.addItem = async (req, res) => {
    try {
        const { error } = addItemSchema.validate(req.body);
        if (error) return res.status(400).json({ success: false, message: error.details[0].message });

        const userId = req.user ? req.user.id : null;
        const guestId = req.guestId || null;

        // HIGH-06: Normalize both naming conventions to the internal camelCase field
        const { productId, product_id, sku, quantity } = req.body;
        const normalizedProductId = productId || product_id;

        const cart = await cartService.addItem(userId, guestId, normalizedProductId, sku, quantity);
        res.status(200).json({ success: true, data: cart });
    } catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
};

exports.updateQuantity = async (req, res) => {
    try {
        const quantity = parseInt(req.body.quantity);
        if (isNaN(quantity) || quantity < 1) {
            return res.status(400).json({ success: false, message: 'Invalid quantity' });
        }

        const userId = req.user ? req.user.id : null;
        const guestId = req.guestId || null;
        const productId = req.params.productId;

        const cart = await cartService.updateItemQuantity(userId, guestId, productId, quantity);
        res.status(200).json({ success: true, data: cart });
    } catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
};

exports.removeItem = async (req, res) => {
    try {
        const userId = req.user ? req.user.id : null;
        const guestId = req.guestId || null;
        const productId = req.params.productId;

        const cart = await cartService.removeItem(userId, guestId, productId);
        res.status(200).json({ success: true, data: cart });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

exports.mergeCart = async (req, res) => {
    try {
        // Must be authenticated to merge
        if (!req.user) {
            return res.status(401).json({ success: false, message: 'Must be logged in' });
        }
        
        const guestId = req.body.guestId;
        if (!guestId) {
             return res.status(400).json({ success: false, message: 'guestId required' });
        }

        const cart = await cartService.mergeGuestCart(req.user.id, guestId);
        res.status(200).json({ success: true, data: cart });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
