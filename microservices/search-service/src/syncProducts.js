const mongoose = require('mongoose');
const { Client } = require('@elastic/elasticsearch');

const MONGO_URI = process.env.MONGO_URI || 'mongodb://mongo:27017/ecommerce_products';
const ELASTICSEARCH_URL = process.env.ELASTICSEARCH_URL || 'http://elasticsearch:9200';

// Define a minimal Mongoose Product schema for querying
const ProductSchema = new mongoose.Schema({
    title: String,
    description: String,
    brand: String,
    category: String,
    base_price: Number,
    discount_percentage: Number,
    final_price: Number,
    average_rating: Number,
    tags: [String],
    status: String,
    images: [String],
    slug: String,
    search_keywords: [String]
});

const Product = mongoose.models.Product || mongoose.model('Product', ProductSchema);

const run = async () => {
    try {
        console.log('[Search Indexer] Connecting to MongoDB...');
        await mongoose.connect(MONGO_URI);
        console.log('[Search Indexer] Connected to MongoDB.');

        console.log('[Search Indexer] Connecting to Elasticsearch...');
        const esClient = new Client({ node: ELASTICSEARCH_URL });
        
        // Test connection
        await esClient.ping();
        console.log('[Search Indexer] Connected to Elasticsearch.');

        // Delete existing index if it exists
        try {
            console.log('[Search Indexer] Cleaning old products index...');
            await esClient.indices.delete({ index: 'products' });
            console.log('[Search Indexer] Old index deleted.');
        } catch (e) {
            console.log('[Search Indexer] Index did not exist yet.');
        }

        // Create index with mapping (setting up text indexing and keyword fields)
        console.log('[Search Indexer] Creating new products index...');
        await esClient.indices.create({
            index: 'products',
            body: {
                mappings: {
                    properties: {
                        title: { type: 'text' },
                        description: { type: 'text' },
                        brand: { type: 'keyword' },
                        category_name: { type: 'keyword' },
                        final_price: { type: 'double' },
                        average_rating: { type: 'double' },
                        tags: { type: 'keyword' },
                        status: { type: 'keyword' },
                        images: { type: 'keyword' },
                        slug: { type: 'keyword' },
                        search_keywords: { type: 'text' }
                    }
                }
            }
        });
        console.log('[Search Indexer] Index created successfully.');

        // Fetch products
        console.log('[Search Indexer] Fetching products from MongoDB...');
        const products = await Product.find({});
        console.log(`[Search Indexer] Found ${products.length} products to index.`);

        // Bulk Indexing
        if (products.length > 0) {
            console.log('[Search Indexer] Bulking index packets...');
            const body = products.flatMap(doc => [
                { index: { _index: 'products', _id: doc._id.toString() } },
                {
                    title: doc.title,
                    description: doc.description,
                    brand: doc.brand || 'Generic',
                    category_name: doc.category || 'General',
                    final_price: doc.final_price || doc.base_price || 0,
                    average_rating: doc.average_rating || 0,
                    tags: doc.tags || [],
                    status: doc.status || 'ACTIVE',
                    images: doc.images || [],
                    slug: doc.slug,
                    search_keywords: doc.search_keywords || []
                }
            ]);

            const bulkResponse = await esClient.bulk({ refresh: true, body });
            if (bulkResponse.errors) {
                console.error('[Search Indexer] Errors occurred during bulk indexing:', bulkResponse.errors);
            } else {
                console.log(`[Search Indexer] Successfully indexed ${products.length} products!`);
            }
        }

        console.log('[Search Indexer] Synchronization finished successfully.');
    } catch (err) {
        console.error('[Search Indexer] Critical Error during synchronization:', err);
        throw err;
    }
};

module.exports = run;

if (require.main === module) {
    run().then(() => process.exit(0)).catch(() => process.exit(1));
}
