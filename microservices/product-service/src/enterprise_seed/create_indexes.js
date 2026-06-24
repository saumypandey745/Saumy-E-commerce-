const mongoose = require('mongoose');
const Product = require('../../microservices/product-service/src/models/Product');
const Category = require('../../microservices/product-service/src/models/Category');

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/ecommerce_products';

async function run() {
    try {
        console.log('Connecting to MongoDB...');
        await mongoose.connect(MONGO_URI);
        
        console.log('Creating Product Indexes...');
        
        // Compound index for Category-based sorting by price (highly used)
        await Product.collection.createIndex({ category_id: 1, final_price: 1 });
        
        // Compound index for Category-based sorting by rating
        await Product.collection.createIndex({ category_id: 1, average_rating: -1 });
        
        // Index for brand filtering
        await Product.collection.createIndex({ brand: 1 });
        
        // Index for seller queries
        await Product.collection.createIndex({ seller_id: 1 });
        
        console.log('Product Indexes created successfully!');

        console.log('Creating Category Indexes...');
        await Category.collection.createIndex({ parent_id: 1 });
        await Category.collection.createIndex({ slug: 1 }, { unique: true });
        console.log('Category Indexes created successfully!');

        process.exit(0);
    } catch (err) {
        console.error('Failed to create indexes:', err);
        process.exit(1);
    }
}

run();
