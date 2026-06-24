const { Client } = require('@elastic/elasticsearch');
const mongoose = require('mongoose');
const Product = require('../../microservices/product-service/src/models/Product');
const Category = require('../../microservices/product-service/src/models/Category');

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/ecommerce_products';
const ES_NODE = process.env.ELASTICSEARCH_URL || 'http://localhost:9200';

const client = new Client({
  node: ES_NODE,
  // If running outside Docker but ES is in docker, localhost:9200
});

async function run() {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(MONGO_URI);
    
    console.log('Connecting to Elasticsearch...');
    const ping = await client.ping();
    if (!ping) throw new Error('Elasticsearch not reachable');
    console.log('Elasticsearch connected.');

    const indexName = 'products';

    const indexExists = await client.indices.exists({ index: indexName });
    if (indexExists) {
        console.log(`Deleting existing index ${indexName}...`);
        await client.indices.delete({ index: indexName });
    }

    console.log(`Creating index ${indexName} with mapping...`);
    await client.indices.create({
        index: indexName,
        body: {
            settings: {
                analysis: {
                    filter: {
                        synonym_filter: {
                            type: 'synonym',
                            synonyms: [
                                'mobile, smartphone, cellphone',
                                'laptop, notebook, computer',
                                'shoes, sneakers, trainers',
                                'tv, television'
                            ]
                        }
                    },
                    analyzer: {
                        autocomplete_analyzer: {
                            type: 'custom',
                            tokenizer: 'autocomplete_tokenizer',
                            filter: ['lowercase']
                        },
                        synonym_analyzer: {
                            type: 'custom',
                            tokenizer: 'standard',
                            filter: ['lowercase', 'synonym_filter']
                        }
                    },
                    tokenizer: {
                        autocomplete_tokenizer: {
                            type: 'edge_ngram',
                            min_gram: 2,
                            max_gram: 20,
                            token_chars: ['letter', 'digit']
                        }
                    }
                }
            },
            mappings: {
                properties: {
                    title: {
                        type: 'text',
                        analyzer: 'autocomplete_analyzer',
                        search_analyzer: 'synonym_analyzer',
                        fields: {
                            keyword: { type: 'keyword' }
                        }
                    },
                    description: { type: 'text' },
                    brand: { type: 'keyword' },
                    category_name: { type: 'keyword' },
                    final_price: { type: 'double' },
                    average_rating: { type: 'double' },
                    tags: { type: 'keyword' },
                    status: { type: 'keyword' },
                    images: { type: 'keyword', index: false },
                    slug: { type: 'keyword', index: false },
                    barcode: { type: 'keyword' },
                    weight: { type: 'double' },
                    search_keywords: {
                        type: 'text',
                        analyzer: 'synonym_analyzer'
                    },
                    variants: {
                        type: 'nested',
                        properties: {
                            sku: { type: 'keyword' },
                            color: { type: 'keyword' },
                            size: { type: 'keyword' },
                            storage: { type: 'keyword' },
                            price_modifier: { type: 'double' }
                        }
                    }
                }
            }
        }
    });

    console.log('Fetching products from MongoDB...');
    // We populate the category so we can index its name for faceting
    const products = await Product.find({}).populate('category_id subcategory_id').lean();
    console.log(`Found ${products.length} products to index.`);

    let count = 0;
    const body = products.flatMap(doc => [
        { index: { _index: indexName, _id: doc._id.toString() } },
        {
            title: doc.title,
            description: doc.description,
            brand: doc.brand,
            category_name: doc.category_id ? doc.category_id.name : null,
            subcategory_name: doc.subcategory_id ? doc.subcategory_id.name : null,
            final_price: doc.final_price,
            average_rating: doc.average_rating,
            tags: doc.tags,
            status: doc.status,
            images: doc.images,
            slug: doc.slug,
            barcode: doc.barcode,
            weight: doc.weight,
            search_keywords: doc.search_keywords,
            variants: doc.variants ? doc.variants.map(v => ({
                sku: v.sku,
                color: v.color,
                size: v.size,
                storage: v.storage,
                price_modifier: v.price_modifier
            })) : []
        }
    ]);

    console.log('Bulk indexing to Elasticsearch...');
    const bulkResponse = await client.bulk({ refresh: true, body });

    if (bulkResponse.errors) {
        console.log('Errors occurred during bulk indexing:');
        const erroredDocuments = [];
        bulkResponse.items.forEach((action, i) => {
            const operation = Object.keys(action)[0];
            if (action[operation].error) {
                erroredDocuments.push({
                    status: action[operation].status,
                    error: action[operation].error,
                    operation: body[i * 2],
                    document: body[i * 2 + 1]
                });
            }
        });
        console.log(erroredDocuments);
    } else {
        console.log(`✅ Successfully indexed ${products.length} products to Elasticsearch.`);
    }

    process.exit(0);
}

run().catch(console.log);
