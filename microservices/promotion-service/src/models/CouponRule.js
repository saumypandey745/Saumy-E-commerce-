const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');
const Coupon = require('./Coupon');

const CouponRule = sequelize.define('CouponRule', {
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
    rule_type: {
        type: DataTypes.ENUM('CATEGORY_INCLUDE', 'PRODUCT_INCLUDE', 'SELLER_INCLUDE', 'PRODUCT_EXCLUDE'),
        allowNull: false,
    },
    target_id: {
        type: DataTypes.STRING,
        allowNull: false,
    }
}, {
    tableName: 'coupon_rules',
    timestamps: true,
});

Coupon.hasMany(CouponRule, { foreignKey: 'coupon_id', as: 'rules' });
CouponRule.belongsTo(Coupon, { foreignKey: 'coupon_id' });

module.exports = CouponRule;
