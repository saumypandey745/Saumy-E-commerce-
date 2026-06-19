const wishlistService = require('../services/wishlist.service');

exports.getWishlist = async (req, res) => {
    try {
        const userId = req.user.id; // User is guaranteed by requireUser middleware
        const wishlist = await wishlistService.getWishlist(userId);
        res.status(200).json({ success: true, data: wishlist });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

exports.addItem = async (req, res) => {
    try {
        const userId = req.user.id;
        const { productId } = req.body;
        
        if (!productId) {
            return res.status(400).json({ success: false, message: 'productId required' });
        }

        const wishlist = await wishlistService.addItem(userId, productId);
        res.status(200).json({ success: true, data: wishlist });
    } catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
};

exports.removeItem = async (req, res) => {
    try {
        const userId = req.user.id;
        const productId = req.params.productId;

        const wishlist = await wishlistService.removeItem(userId, productId);
        res.status(200).json({ success: true, data: wishlist });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
