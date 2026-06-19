const { Sequelize } = require('sequelize');
require('dotenv').config();

const dbDialect = process.env.DB_DIALECT || 'sqlite';

console.log(`[Order Service] Database dialect is set to: ${dbDialect}`);

const sequelize = dbDialect === 'sqlite'
    ? new Sequelize({
        dialect: 'sqlite',
        storage: process.env.DB_STORAGE || './order_db.sqlite',
        logging: false,
      })
    : new Sequelize(
        process.env.DB_NAME || 'order_db',
        process.env.DB_USER || 'admin',
        process.env.DB_PASS || 'adminpassword',
        {
            host: process.env.DB_HOST || 'localhost',
            port: process.env.DB_PORT || 5432,
            dialect: 'postgres',
            logging: false,
        }
      );

const connectDB = async () => {
    try {
        await sequelize.authenticate();
        console.log(`Database connected successfully using ${dbDialect} (Order Service).`);
        await sequelize.sync();
    } catch (error) {
        console.error('Unable to connect to the database:', error);
        process.exit(1);
    }
};

module.exports = { sequelize, connectDB };
