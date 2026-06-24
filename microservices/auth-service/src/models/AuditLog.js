const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const AuditLog = sequelize.define('AuditLog', {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    user_id: { type: DataTypes.UUID, allowNull: true },
    action: { type: DataTypes.STRING, allowNull: false },
    severity: { type: DataTypes.ENUM('LOW', 'MEDIUM', 'HIGH', 'CRITICAL'), defaultValue: 'LOW' },
    ip_address: { type: DataTypes.STRING, allowNull: true },
    user_agent: { type: DataTypes.STRING, allowNull: true },
    previous_value: { type: DataTypes.JSON, allowNull: true },
    new_value: { type: DataTypes.JSON, allowNull: true },
    details: { type: DataTypes.JSON, allowNull: true }
}, {
    timestamps: true,
    tableName: 'audit_logs'
});

module.exports = AuditLog;
