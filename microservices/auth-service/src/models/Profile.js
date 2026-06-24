const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');
const User = require('./User');

const Profile = sequelize.define('Profile', {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    user_id: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
            model: User,
            key: 'id'
        },
        unique: true
    },
    first_name: { type: DataTypes.STRING, allowNull: true },
    last_name: { type: DataTypes.STRING, allowNull: true },
    phone_number: { type: DataTypes.STRING, allowNull: true },
    profile_image_url: { type: DataTypes.STRING, allowNull: true },
    
    // Address Book (Stored as JSON array for flexibility)
    addresses: {
        type: DataTypes.JSONB,
        defaultValue: [],
        allowNull: false
    },
    
    // Preferences
    currency: { type: DataTypes.STRING, defaultValue: 'USD' },
    language: { type: DataTypes.STRING, defaultValue: 'en' }
}, {
    timestamps: true,
    tableName: 'profiles'
});

User.hasOne(Profile, { foreignKey: 'user_id', onDelete: 'CASCADE' });
Profile.belongsTo(User, { foreignKey: 'user_id' });

module.exports = Profile;
