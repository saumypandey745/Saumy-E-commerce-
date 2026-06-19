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
