const { sequelize } = require('../config/db');
const Order = require('../models/Order');
const OrderItem = require('../models/OrderItem');
const orchestrator = require('../saga/orchestrator');
const http = require('http');

// Helper to fetch Cart from cart-service
function fetchCart(token) {
    return new Promise((resolve, reject) => {
        const cartUrl = process.env.CART_SERVICE_URL || 'http://localhost:8007/api/cart';
        const parsedUrl = new URL(cartUrl);

        http.get(parsedUrl, { headers: { Authorization: token } }, (res) => {
            let body = '';
            res.on('data', (chunk) => body += chunk);
            res.on('end', () => {
                if (res.statusCode === 200) {
                    try { resolve(JSON.parse(body)); } catch (e) { reject(e); }
                } else {
                    reject(new Error(`Failed to fetch cart. Status: ${res.statusCode}`));
                }
            });
        }).on('error', reject);
    });
}

exports.checkoutCart = async (req, res, next) => {
    const transaction = await sequelize.transaction();
    try {
        const { cart_id, shipping_address, card_number } = req.body;
        const user_id = req.user.id;

        // 1. Fetch Cart via HTTP (synchronous read)
        let cartData;
        try {
            const token = req.headers.authorization;
            const result = await fetchCart(token);
            if (!result.success || !result.data || result.data.items.length === 0) {
                return res.status(400).json({ success: false, message: 'Cart is empty or invalid' });
            }
            cartData = result.data;
        } catch (error) {
            return res.status(500).json({ success: false, message: 'Unable to communicate with Cart Service' });
        }

        // 2. Calculate Total
        const total_amount = cartData.items.reduce((sum, item) => sum + (item.price_at_addition * item.quantity), 0);

        // 3. Create PENDING Order
        const order = await Order.create({
            user_id,
            total_amount,
            shipping_address,
            status: 'PENDING',
            payment_status: 'PENDING'
        }, { transaction });

        const orderItemsData = cartData.items.map(item => ({
            order_id: order.id,
            product_id: item.product_id,
            sku: item.sku || 'UNKNOWN', // Must map sku from cart
            seller_id: item.seller_id,
            quantity: item.quantity,
            price_at_purchase: item.price_at_addition
        }));

        await OrderItem.bulkCreate(orderItemsData, { transaction });
        await transaction.commit();

        // 4. Start the Async Saga
        const sagaItems = orderItemsData.map(oi => ({ product_id: oi.product_id, sku: oi.sku, quantity: oi.quantity }));
        await orchestrator.startCheckoutSaga(order.id, sagaItems, card_number);

        // 5. Respond immediately to user (Async processing)
        res.status(202).json({
            success: true,
            message: 'Checkout process started successfully. Order is pending confirmation.',
            order_id: order.id,
            status: order.status
        });
    } catch (error) {
        await transaction.rollback();
        next(error);
    }
};
