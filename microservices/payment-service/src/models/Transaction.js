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
    amount: {
        type: DataTypes.FLOAT,
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
