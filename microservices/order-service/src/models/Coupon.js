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
    discount_type: {
        type: DataTypes.ENUM('PERCENTAGE', 'FIXED'),
        allowNull: false,
    },
    discount_value: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
    },
    min_order_value: {
        type: DataTypes.DECIMAL(10, 2),
        defaultValue: 0,
    },
    valid_until: {
        type: DataTypes.DATE,
        allowNull: true,
    },
    usage_limit: {
        type: DataTypes.INTEGER,
        defaultValue: 0, // 0 means unlimited
    },
    used_count: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
    },
    is_active: {
        type: DataTypes.BOOLEAN,
        defaultValue: true,
    }
}, {
    timestamps: true,
    tableName: 'coupons',
    indexes: [
        { fields: ['code'] }
    ]
});

module.exports = Coupon;
