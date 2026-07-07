const { Sequelize } = require('sequelize');
require('dotenv').config();

const dbDialect = process.env.DB_DIALECT || 'sqlite';

console.log(`[Auth Service] Database dialect is set to: ${dbDialect}`);

let sequelize;

if (dbDialect === 'postgres') {
    // Production: PostgreSQL via DATABASE_URL (PaaS) or individual DB_* vars
    if (process.env.DATABASE_URL) {
        sequelize = new Sequelize(process.env.DATABASE_URL, {
            dialect: 'postgres',
            logging: false,
            dialectOptions: {
                ssl: process.env.DB_SSL === 'true'
                    ? { require: true, rejectUnauthorized: false }
                    : false
            },
            pool: { max: 10, min: 2, acquire: 30000, idle: 30000 }
        });
    } else {
        sequelize = new Sequelize(
            process.env.DB_NAME || 'user_db',
            process.env.DB_USER || 'admin',
            process.env.DB_PASS || 'adminpassword',
            {
                host: process.env.DB_HOST || 'localhost',
                port: parseInt(process.env.DB_PORT || '5432', 10),
                dialect: 'postgres',
                logging: false,
                pool: { max: 10, min: 2, acquire: 30000, idle: 30000 }
            }
        );
    }
} else {
    // Local dev fallback: SQLite
    sequelize = new Sequelize({
        dialect: 'sqlite',
        storage: process.env.NODE_ENV === 'test' ? ':memory:' : (process.env.DB_STORAGE || './user_db.sqlite'),
        logging: false,
    });
}

const connectDB = async () => {
    try {
        await sequelize.authenticate();
        console.log(`[Auth Service] ${dbDialect.toUpperCase()} connected successfully.`);

        // Sync schema — safe for initial deployment; use migrations for ongoing production changes
        if (dbDialect !== 'postgres' || process.env.NODE_ENV !== 'production' || process.env.DB_SYNC === 'true') {
            await sequelize.sync({ alter: true });
            console.log('[Auth Service] Schema synced.');
        } else {
            console.log('[Auth Service] Production mode — skipping auto-sync. Run migrations manually.');
        }
    } catch (error) {
        console.error('[Auth Service] Unable to connect to the database:', error);
        process.exit(1);
    }
};

module.exports = { sequelize, connectDB };
