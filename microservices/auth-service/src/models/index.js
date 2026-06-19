const User = require('./User');
const RefreshToken = require('./RefreshToken');
const AuditLog = require('./AuditLog');

// Define relationships
User.hasMany(RefreshToken, { foreignKey: 'user_id' });
RefreshToken.belongsTo(User, { foreignKey: 'user_id' });

User.hasMany(AuditLog, { foreignKey: 'user_id' });
AuditLog.belongsTo(User, { foreignKey: 'user_id' });

module.exports = { User, RefreshToken, AuditLog };
