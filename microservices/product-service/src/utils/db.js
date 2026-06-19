// src/utils/db.js
const { Sequelize } = require('sequelize');
require('dotenv').config();

const dialect = process.env.DB_DIALECT || 'postgres';
const dbName = process.env.DB_NAME || 'ecommerce_db';
const dbUser = process.env.DB_USER || 'admin';
const dbPass = process.env.DB_PASS || 'adminpassword';
const dbHost = process.env.DB_HOST || 'postgres';
const dbPort = process.env.DB_PORT || 5432;

const sequelize = new Sequelize(dbName, dbUser, dbPass, {
  host: dbHost,
  port: dbPort,
  dialect,
  logging: false,
});

const connectDB = async () => {
  try {
    await sequelize.authenticate();
    console.log(`[DB] Connected to ${dialect}://${dbHost}:${dbPort}/${dbName}`);
    await sequelize.sync({ alter: true });
  } catch (err) {
    console.error('❌ DB connection failed:', err);
    process.exit(1);
  }
};

module.exports = { sequelize, connectDB };
