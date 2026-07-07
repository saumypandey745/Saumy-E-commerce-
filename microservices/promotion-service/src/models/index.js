const Coupon = require('./Coupon');
const CouponRule = require('./CouponRule');
const CouponUsage = require('./CouponUsage');
const { sequelize } = require('../config/db');

const initModels = async () => {
    try {
        await sequelize.sync({ alter: process.env.NODE_ENV === 'development' });
        console.log('[Promotion Service] DB Models synchronized');
    } catch (error) {
        console.error('[Promotion Service] Error syncing DB models:', error);
    }
};

module.exports = {
    Coupon,
    CouponRule,
    CouponUsage,
    initModels
};
