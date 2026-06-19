const cartService = require('../services/cart.service');
const Joi = require('joi');

const addItemSchema = Joi.object({
    productId: Joi.string().required(),
    sku: Joi.string().required(),
    quantity: Joi.number().integer().min(1).required()
});

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
        const { productId, sku, quantity } = req.body;

        const cart = await cartService.addItem(userId, guestId, productId, sku, quantity);
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
