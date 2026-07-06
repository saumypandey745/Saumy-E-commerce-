const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');
const OrderItem = require('./OrderItem');

const Order = sequelize.define('Order', {
    id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
    },
    user_id: {
        type: DataTypes.UUID,
        allowNull: false,
    },
    // CRIT-04: DECIMAL(12,2) — exact fixed-point arithmetic
    // FLOAT was causing IEEE 754 rounding errors in financial calculations
    total_amount: {
        type: DataTypes.DECIMAL(12, 2),
        allowNull: false,
    },
    status: {
        type: DataTypes.ENUM('PENDING', 'CONFIRMED', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED'),
        defaultValue: 'PENDING',
    },
    payment_status: {
        type: DataTypes.ENUM('PENDING', 'PAID', 'FAILED', 'REFUNDED'),
        defaultValue: 'PENDING',
    },
    // HIGH-05: Use TEXT not JSONB — JSONB is PostgreSQL-only
    // SQLite silently degrades JSONB to TEXT; using TEXT explicitly prevents migration failure
    // The getter/setter handles JSON serialization correctly on both DBs
    shipping_address: {
        type: DataTypes.TEXT,
        allowNull: false,
        get() {
            const raw = this.getDataValue('shipping_address');
            try { return raw ? JSON.parse(raw) : null; } catch { return raw; }
        },
        set(value) {
            this.setDataValue('shipping_address', typeof value === 'string' ? value : JSON.stringify(value));
        }
    }
}, {
    timestamps: true,
    tableName: 'orders',
    indexes: [
        // MED-01: Index on user_id — required for "my orders" queries (full table scan without this)
        { fields: ['user_id'] },
        // MED-01: Index on status+createdAt — required for admin order management queue
        { fields: ['status', 'createdAt'] },
        // MED-01: Index on payment_status — required for reconciliation and payout queries
        { fields: ['payment_status'] }
    ]
});

Order.hasMany(OrderItem, { as: 'items', foreignKey: 'order_id' });
OrderItem.belongsTo(Order, { foreignKey: 'order_id', as: 'order' });

module.exports = Order;
