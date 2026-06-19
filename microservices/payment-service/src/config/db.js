const { Sequelize } = require('sequelize');
const path = require('path');

const storagePath = path.join(__dirname, '../../payment_db.sqlite');

const sequelize = new Sequelize({
    dialect: 'sqlite',
    storage: storagePath,
    logging: false
});

const connectDB = async () => {
    try {
        await sequelize.authenticate();
        console.log('[Payment Service] SQLite connected successfully.');
        await sequelize.sync({ alter: true });
        console.log('[Payment Service] Database synced.');
    } catch (error) {
        console.error('[Payment Service] DB connection error:', error);
    }
};

module.exports = { sequelize, connectDB };
