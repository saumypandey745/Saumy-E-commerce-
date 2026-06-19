const Cart = require('../models/Cart');
const { getRedisClient } = require('../config/redis');
const axios = require('axios');

const PRODUCT_SERVICE_URL = process.env.PRODUCT_SERVICE_URL || 'http://localhost:8003';

class CartService {
    /**
     * Gets a cart by either user ID or guest ID. Prioritizes Redis cache.
     */
    async getCart(userId, guestId) {
        const identifier = userId ? `user:${userId}` : `guest:${guestId}`;
        const redisClient = getRedisClient();
        
        const cachedCart = await redisClient.get(`cart:${identifier}`);
        if (cachedCart) {
            return JSON.parse(cachedCart);
        }

        const query = userId ? { user_id: userId } : { guest_id: guestId };
        let cart = await Cart.findOne(query);

        if (!cart) {
            cart = new Cart(query);
            await cart.save();
        }

        await redisClient.set(`cart:${identifier}`, JSON.stringify(cart), { EX: 3600 }); // Cache for 1 hr
        return cart;
    }

    /**
     * Adds an item to the cart after validating with Product Service
     */
    async addItem(userId, guestId, productId, sku, quantity) {
        // Validate product exists and has stock
        let productData;
        try {
            const response = await axios.get(`${PRODUCT_SERVICE_URL}/${productId}`);
            productData = response.data.product || response.data.data || response.data;
        } catch (error) {
            throw new Error('Product not found or product service unavailable');
        }

        if (productData.inventory_count < quantity) {
            throw new Error('Not enough inventory available');
        }

        let cart = await this.getCart(userId, guestId);
        
        // Convert Mongoose doc if it came from cache
        if (!cart.save) {
            const query = userId ? { user_id: userId } : { guest_id: guestId };
            cart = await Cart.findOne(query);
        }

        const itemIndex = cart.items.findIndex(item => item.product_id === productId && item.sku === sku);

        if (itemIndex > -1) {
            cart.items[itemIndex].quantity += quantity;
            // Check inventory again for total quantity
            if (productData.inventory_count < cart.items[itemIndex].quantity) {
                 throw new Error('Not enough inventory available for total quantity');
            }
        } else {
            console.log("productData from Product Service:", productData);
            cart.items.push({
                product_id: productId,
                sku: sku,
                seller_id: productData.seller_id,
                title: productData.title,
                image: productData.images && productData.images.length > 0 ? productData.images[0] : null,
                price_at_addition: productData.base_price,
                quantity: quantity
            });
        }

        await cart.save();

        const identifier = userId ? `user:${userId}` : `guest:${guestId}`;
        await getRedisClient().set(`cart:${identifier}`, JSON.stringify(cart), { EX: 3600 });

        return cart;
    }

    async updateItemQuantity(userId, guestId, productId, quantity) {
        let cart = await this.getCart(userId, guestId);
        if (!cart.save) {
            const query = userId ? { user_id: userId } : { guest_id: guestId };
            cart = await Cart.findOne(query);
        }

        const itemIndex = cart.items.findIndex(item => item.product_id === productId);
        if (itemIndex === -1) {
            throw new Error('Item not found in cart');
        }

        // Optional: Re-check inventory here before updating

        cart.items[itemIndex].quantity = quantity;
        await cart.save();

        const identifier = userId ? `user:${userId}` : `guest:${guestId}`;
        await getRedisClient().set(`cart:${identifier}`, JSON.stringify(cart), { EX: 3600 });

        return cart;
    }

    async removeItem(userId, guestId, productId) {
        let cart = await this.getCart(userId, guestId);
        if (!cart.save) {
            const query = userId ? { user_id: userId } : { guest_id: guestId };
            cart = await Cart.findOne(query);
        }

        cart.items = cart.items.filter(item => item.product_id !== productId);
        await cart.save();

        const identifier = userId ? `user:${userId}` : `guest:${guestId}`;
        await getRedisClient().set(`cart:${identifier}`, JSON.stringify(cart), { EX: 3600 });

        return cart;
    }

    /**
     * Merges guest cart into user cart upon login
     */
    async mergeGuestCart(userId, guestId) {
        const guestCart = await Cart.findOne({ guest_id: guestId });
        if (!guestCart || guestCart.items.length === 0) {
            return await this.getCart(userId, null);
        }

        let userCart = await Cart.findOne({ user_id: userId });
        if (!userCart) {
            userCart = new Cart({ user_id: userId, items: [] });
        }

        // Merge logic
        for (const guestItem of guestCart.items) {
            const existingItemIndex = userCart.items.findIndex(item => item.product_id === guestItem.product_id && item.sku === guestItem.sku);
            if (existingItemIndex > -1) {
                userCart.items[existingItemIndex].quantity += guestItem.quantity;
            } else {
                userCart.items.push(guestItem);
            }
        }

        await userCart.save();
        await Cart.deleteOne({ _id: guestCart._id });

        // Update caches
        const redisClient = getRedisClient();
        await redisClient.del(`cart:guest:${guestId}`);
        await redisClient.set(`cart:user:${userId}`, JSON.stringify(userCart), { EX: 3600 });

        return userCart;
    }
}

module.exports = new CartService();
