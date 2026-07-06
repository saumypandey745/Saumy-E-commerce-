const { Sequelize } = require('sequelize');
const path = require('path');
const dotenv = require('dotenv');

dotenv.config({ path: path.join(__dirname, '../.env') });

async function migrateData() {
    console.log('--- CRIT-04: SQLite to PostgreSQL Data Migration ---');

    // 1. Connect to Source (SQLite)
    const sqliteOrderDb = new Sequelize({
        dialect: 'sqlite',
        storage: path.join(__dirname, '../microservices/order-service/order_db.sqlite'),
        logging: false
    });
    const sqlitePaymentDb = new Sequelize({
        dialect: 'sqlite',
        storage: path.join(__dirname, '../microservices/payment-service/payment_db.sqlite'),
        logging: false
    });

    // 2. Connect to Destination (PostgreSQL)
    const postgresPass = process.env.POSTGRES_PASSWORD || 'adminpassword';
    
    const pgOrderDb = new Sequelize('order_db', 'admin', postgresPass, {
        host: 'localhost',
        port: 5432,
        dialect: 'postgres',
        logging: false
    });
    const pgPaymentDb = new Sequelize('payment_db', 'admin', postgresPass, {
        host: 'localhost',
        port: 5432,
        dialect: 'postgres',
        logging: false
    });

    try {
        console.log('[1/4] Authenticating with databases...');
        await sqliteOrderDb.authenticate();
        await sqlitePaymentDb.authenticate();
        await pgOrderDb.authenticate();
        await pgPaymentDb.authenticate();
        console.log('All database connections established.');

        // Function to migrate a table dynamically
        async function migrateTable(sourceDb, destDb, tableName) {
            console.log(`Migrating table '${tableName}'...`);
            const [rows] = await sourceDb.query(`SELECT * FROM "${tableName}"`);
            
            if (rows.length === 0) {
                console.log(`  Table '${tableName}' is empty. Skipping.`);
                return;
            }

            console.log(`  Found ${rows.length} records. Inserting into PostgreSQL...`);
            
            // Get columns from the first row
            const columns = Object.keys(rows[0]).map(col => `"${col}"`).join(', ');
            
            for (const row of rows) {
                const values = Object.values(row);
                // Map values to handle SQL injections / quotes
                const placeholders = values.map((_, i) => `$${i + 1}`).join(', ');
                
                // Use parameterized query
                await destDb.query(`INSERT INTO "${tableName}" (${columns}) VALUES (${placeholders})`, {
                    bind: values
                });
            }
            console.log(`  Table '${tableName}' migration complete.`);
        }

        console.log('[2/4] Migrating Order Service data...');
        // Order service tables: orders, order_items
        try { await migrateTable(sqliteOrderDb, pgOrderDb, 'orders'); } catch (e) { console.error('  Failed to migrate orders:', e.message); }
        try { await migrateTable(sqliteOrderDb, pgOrderDb, 'order_items'); } catch (e) { console.error('  Failed to migrate order_items:', e.message); }

        console.log('[3/4] Migrating Payment Service data...');
        // Payment service tables: transactions
        try { await migrateTable(sqlitePaymentDb, pgPaymentDb, 'transactions'); } catch (e) { console.error('  Failed to migrate transactions:', e.message); }

        console.log('[4/4] Migration Finished successfully!');
        
    } catch (err) {
        console.error('Migration failed:', err);
    } finally {
        await sqliteOrderDb.close();
        await sqlitePaymentDb.close();
        await pgOrderDb.close();
        await pgPaymentDb.close();
    }
}

migrateData();
