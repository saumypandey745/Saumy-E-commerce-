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
    price_at_purchase: {
        type: DataTypes.FLOAT,
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
