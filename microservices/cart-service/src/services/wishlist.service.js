const Wishlist = require('../models/Wishlist');
const axios = require('axios');

const PRODUCT_SERVICE_URL = process.env.PRODUCT_SERVICE_URL || 'http://localhost:8003';

class WishlistService {
    async getWishlist(userId) {
        let wishlist = await Wishlist.findOne({ user_id: userId });
        if (!wishlist) {
            wishlist = new Wishlist({ user_id: userId, items: [] });
            await wishlist.save();
        }
        return wishlist;
    }

    async addItem(userId, productId) {
        let productData;
        try {
            const response = await axios.get(`${PRODUCT_SERVICE_URL}/api/products/${productId}`);
            productData = response.data.data || response.data;
        } catch (error) {
            throw new Error('Product not found');
        }

        let wishlist = await this.getWishlist(userId);
        
        const itemIndex = wishlist.items.findIndex(item => item.product_id === productId);
        if (itemIndex > -1) {
            throw new Error('Item already in wishlist');
        }

        wishlist.items.push({
            product_id: productId,
            title: productData.title,
            image: productData.images ? productData.images[0] : null,
            price: productData.base_price
        });

        await wishlist.save();
        return wishlist;
    }

    async removeItem(userId, productId) {
        let wishlist = await this.getWishlist(userId);
        wishlist.items = wishlist.items.filter(item => item.product_id !== productId);
        await wishlist.save();
        return wishlist;
    }
}

module.exports = new WishlistService();
