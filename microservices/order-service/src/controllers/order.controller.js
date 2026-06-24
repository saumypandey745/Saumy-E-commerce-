const { sequelize } = require('../config/db');
const Order = require('../models/Order');
const OrderItem = require('../models/OrderItem');

exports.getUserOrders = async (req, res, next) => {
    try {
        const orders = await Order.findAll({
            where: { user_id: req.user.id },
            include: [{ model: OrderItem, as: 'items' }],
            order: [['createdAt', 'DESC']]
        });
        res.status(200).json({ success: true, orders });
    } catch (error) {
        next(error);
    }
};

exports.getOrderById = async (req, res, next) => {
    try {
        const order = await Order.findOne({
            where: { id: req.params.id, user_id: req.user.id },
            include: [{ model: OrderItem, as: 'items' }]
        });
        if (!order) return res.status(404).json({ success: false, message: 'Order not found' });
        res.status(200).json({ success: true, order });
    } catch (error) {
        next(error);
    }
};
exports.verifyPurchase = async (req, res, next) => {
    try {
        const { user_id, product_id } = req.query;
        if (!user_id || !product_id) return res.status(400).json({ success: false, message: 'Missing user_id or product_id' });

        const order = await Order.findOne({
            where: { user_id, status: 'CONFIRMED' },
            include: [{
                model: OrderItem,
                as: 'items',
                where: { product_id }
            }]
        });

        res.status(200).json({ success: true, has_purchased: !!order });
    } catch (error) {
        next(error);
    }
};

exports.getSellerOrders = async (req, res, next) => {
    try {
        const orderItems = await OrderItem.findAll({
            where: { seller_id: req.user.id },
            include: [{ model: Order, as: 'order', attributes: ['id', 'user_id', 'status', 'total_amount', 'createdAt'] }],
            order: [['createdAt', 'DESC']]
        });
        res.status(200).json({ success: true, items: orderItems });
    } catch (error) {
        next(error);
    }
};

exports.updateOrderStatus = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { status } = req.body;
        
        const orderItem = await OrderItem.findOne({
            where: { id, seller_id: req.user.id }
        });
        
        if (!orderItem) return res.status(404).json({ success: false, message: 'Order item not found or unauthorized' });
        
        const previousStatus = orderItem.fulfillment_status;
        orderItem.fulfillment_status = status;
        await orderItem.save();

        if (status === 'DELIVERED' && previousStatus !== 'DELIVERED') {
            const { publishEvent } = require('../config/rabbitmq');
            publishEvent('order.item.delivered', {
                order_item_id: orderItem.id,
                order_id: orderItem.order_id,
                seller_id: orderItem.seller_id,
                price: orderItem.price,
                quantity: orderItem.quantity
            });
        }
        
        res.status(200).json({ success: true, item: orderItem });
    } catch (error) {
        next(error);
    }
};
