const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const Coupon = sequelize.define('Coupon', {
    id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
    },
    code: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
    },
    type: {
        type: DataTypes.ENUM('PERCENTAGE', 'FIXED', 'FREE_SHIPPING', 'BOGO'),
        allowNull: false,
    },
    value: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: true, // Nullable for Free Shipping or BOGO
    },
    min_order_amount: {
        type: DataTypes.DECIMAL(10, 2),
        defaultValue: 0,
    },
    max_discount_amount: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: true,
    },
    usage_limit_total: {
        type: DataTypes.INTEGER,
        allowNull: true, // null = unlimited
    },
    usage_limit_user: {
        type: DataTypes.INTEGER,
        allowNull: true,
    },
    valid_from: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
    },
    valid_until: {
        type: DataTypes.DATE,
        allowNull: true,
    },
    is_active: {
        type: DataTypes.BOOLEAN,
        defaultValue: true,
    }
}, {
    tableName: 'coupons',
    timestamps: true,
});

module.exports = Coupon;
