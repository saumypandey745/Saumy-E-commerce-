const Order = require('../models/Order');
const OrderItem = require('../models/OrderItem');
const { Op } = require('sequelize');
const { sequelize } = require('../config/db');

exports.getSellerAnalytics = async (req, res, next) => {
    try {
        const seller_id = req.user.id;

        // Total Revenue for this seller (Sum of price_at_purchase * quantity)
        const revenueResult = await OrderItem.findOne({
            attributes: [
                [sequelize.fn('sum', sequelize.literal('price_at_purchase * quantity')), 'totalRevenue']
            ],
            where: { seller_id }
        });
        const totalRevenueResult = revenueResult ? revenueResult.get('totalRevenue') : 0;
        
        // Total Orders containing seller's items
        const totalOrdersResult = await OrderItem.count({
            distinct: true,
            col: 'order_id',
            where: { seller_id }
        });

        // Top selling products for this seller
        const topProducts = await OrderItem.findAll({
            attributes: [
                'sku',
                [sequelize.fn('sum', sequelize.col('quantity')), 'total_quantity'],
                [sequelize.fn('sum', sequelize.literal('price_at_purchase * quantity')), 'total_revenue']
            ],
            where: { seller_id },
            group: ['sku'],
            order: [[sequelize.fn('sum', sequelize.col('quantity')), 'DESC']],
            limit: 5
        });

        res.status(200).json({
            success: true,
            data: {
                total_revenue: totalRevenueResult || 0,
                total_orders: totalOrdersResult || 0,
                top_products: topProducts
            }
        });
    } catch (error) {
        next(error);
    }
};

exports.getAdminAnalytics = async (req, res, next) => {
    try {
        // Platform wide analytics
        const totalRevenue = await Order.sum('total_amount');
        const totalOrders = await Order.count();
        
        // Recent revenue trend (last 7 days grouped by date)
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

        const revenueByDay = await Order.findAll({
            attributes: [
                [sequelize.fn('date', sequelize.col('createdAt')), 'date'],
                [sequelize.fn('sum', sequelize.col('total_amount')), 'daily_revenue']
            ],
            where: {
                createdAt: {
                    [Op.gte]: sevenDaysAgo
                }
            },
            group: [sequelize.fn('date', sequelize.col('createdAt'))],
            order: [[sequelize.fn('date', sequelize.col('createdAt')), 'ASC']]
        });

        res.status(200).json({
            success: true,
            data: {
                total_revenue: totalRevenue || 0,
                total_orders: totalOrders || 0,
                revenue_trend: revenueByDay
            }
        });
    } catch (error) {
        next(error);
    }
};
