const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const OrderItem = sequelize.define('OrderItem', {
    id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
    },
    order_id: {
        type: DataTypes.UUID,
        allowNull: false,
    },
    product_id: {
        type: DataTypes.STRING, // Since Product Service uses MongoDB (String IDs)
        allowNull: false,
    },
    sku: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    seller_id: {
        type: DataTypes.UUID, // Link to the seller for split payouts
        allowNull: false,
    },
    quantity: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 1
    },
    // CRIT-04: DECIMAL(12,2) — legally binding purchase price must be exact
    // FLOAT caused IEEE 754 rounding errors (e.g. $9.99 stored as $9.990000000000001)
    price_at_purchase: {
        type: DataTypes.DECIMAL(12, 2),
        allowNull: false,
    },
    fulfillment_status: {
        type: DataTypes.ENUM('PENDING', 'ACCEPTED', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED', 'RETURN_REQUESTED', 'RETURNED'),
        defaultValue: 'PENDING',
    }
}, {
    timestamps: true,
    tableName: 'order_items',
});

module.exports = OrderItem;
