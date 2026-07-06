const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const Transaction = sequelize.define('Transaction', {
    id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
    },
    order_id: {
        type: DataTypes.UUID,
        allowNull: false,
        unique: true, // Idempotency: One transaction per order
    },
    stripe_charge_id: {
        type: DataTypes.STRING,
        allowNull: true,
    },
    // CRIT-04: DECIMAL(12,2) — exact fixed-point arithmetic for financial data
    // FLOAT was causing IEEE 754 rounding errors (0.1 + 0.2 ≠ 0.3) — PCI DSS violation
    // Supports up to $9,999,999,999.99
    amount: {
        type: DataTypes.DECIMAL(12, 2),
        allowNull: false,
    },
    currency: {
        type: DataTypes.STRING,
        defaultValue: 'USD',
    },
    status: {
        type: DataTypes.ENUM('SUCCESS', 'FAILED', 'REFUNDED'),
        allowNull: false,
    },
    failure_reason: {
        type: DataTypes.STRING,
        allowNull: true,
    }
}, {
    timestamps: true,
    tableName: 'transactions',
});

module.exports = Transaction;
