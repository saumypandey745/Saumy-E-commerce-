const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');
const Coupon = require('./Coupon');

const CouponUsage = sequelize.define('CouponUsage', {
    id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
    },
    coupon_id: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
            model: Coupon,
            key: 'id'
        }
    },
    user_id: {
        type: DataTypes.UUID,
        allowNull: false,
    },
    order_id: {
        type: DataTypes.UUID,
        allowNull: false,
    },
    discount_applied: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
    }
}, {
    tableName: 'coupon_usages',
    timestamps: true, // createdAt will act as used_at
    indexes: [
        { fields: ['user_id', 'coupon_id'] },
        { fields: ['order_id'], unique: true }
    ]
});

Coupon.hasMany(CouponUsage, { foreignKey: 'coupon_id', as: 'usages' });
CouponUsage.belongsTo(Coupon, { foreignKey: 'coupon_id' });

module.exports = CouponUsage;
