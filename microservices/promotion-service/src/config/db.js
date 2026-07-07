const { Sequelize } = require('sequelize');
require('dotenv').config();

const dbDialect = process.env.DB_DIALECT || 'sqlite';
console.log(`[Order Service] Database dialect: ${dbDialect}`);

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
            process.env.DB_NAME || 'order_db',
            process.env.DB_USER || 'admin',
            process.env.DB_PASS || 'adminpassword',
            {
                host: process.env.DB_HOST || 'postgres',
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
        storage: process.env.NODE_ENV === 'test' ? ':memory:' : (process.env.DB_STORAGE || './db.sqlite'),
        logging: false,
    });
}

const connectDB = async () => {
    try {
        await sequelize.authenticate();
        console.log(`[Order Service] ${dbDialect.toUpperCase()} connected successfully.`);

        // CRIT-04: Never auto-sync schema in production — run Sequelize migrations
        if (dbDialect !== 'postgres' || process.env.NODE_ENV !== 'production' || process.env.DB_SYNC === 'true') {
            await sequelize.sync({ alter: true });
            console.log('[Order Service] Schema synced.');
        } else {
            console.log('[Order Service] Production mode — skipping auto-sync. Run migrations manually.');
        }
    } catch (error) {
        console.error('[Order Service] Database connection failed:', error.message);
        process.exit(1); // Fail fast — service cannot operate without database
    }
};

module.exports = { sequelize, connectDB };
