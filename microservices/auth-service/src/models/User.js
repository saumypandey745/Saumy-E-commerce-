const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const User = sequelize.define('User', {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  email: { type: DataTypes.STRING, allowNull: false, unique: true },
  password_hash: { type: DataTypes.STRING, allowNull: false },
  role: { type: DataTypes.ENUM('CUSTOMER', 'SELLER', 'ADMIN', 'SUPER_ADMIN'), defaultValue: 'CUSTOMER' },
  
  // Verification
  is_verified: { type: DataTypes.BOOLEAN, defaultValue: false },
  verification_token: { type: DataTypes.STRING, allowNull: true },
  
  // Account Recovery
  reset_password_token: { type: DataTypes.STRING, allowNull: true },
  reset_password_expires: { type: DataTypes.DATE, allowNull: true },
  
  // MFA / 2FA
  two_factor_secret: { type: DataTypes.STRING, allowNull: true },
  is_two_factor_enabled: { type: DataTypes.BOOLEAN, defaultValue: false }
}, {
    timestamps: true,
    tableName: 'users'
});

module.exports = User;
