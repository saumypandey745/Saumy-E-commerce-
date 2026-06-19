const { MongoClient } = require('mongodb');

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017';

async function applyIndexes() {
    console.log(`Connecting to MongoDB at ${MONGO_URI}...`);
    const client = new MongoClient(MONGO_URI);
    
    try {
        await client.connect();
        
        // 1. Products Database
        console.log('Applying indexes to ecommerce_products...');
        const productsDb = client.db('ecommerce_products');
        await productsDb.collection('products').createIndex({ slug: 1 }, { unique: true });
        await productsDb.collection('products').createIndex({ status: 1, base_price: -1 });
        await productsDb.collection('products').createIndex({ "category.id": 1 });
        
        // 2. Orders Database
        console.log('Applying indexes to ecommerce_orders...');
        const ordersDb = client.db('ecommerce_orders');
        await ordersDb.collection('orders').createIndex({ user_id: 1, created_at: -1 });
        await ordersDb.collection('orders').createIndex({ status: 1 });
        
        // 3. Reviews Database
        console.log('Applying indexes to ecommerce_reviews...');
        const reviewsDb = client.db('ecommerce_reviews');
        await reviewsDb.collection('reviews').createIndex({ product_id: 1, rating: -1 });
        await reviewsDb.collection('reviews').createIndex({ product_id: 1, is_verified_purchase: 1 });
        
        console.log('Successfully applied all enterprise database indexes!');
    } catch (err) {
        console.error('Failed to apply indexes:', err);
    } finally {
        await client.close();
    }
}

applyIndexes();
