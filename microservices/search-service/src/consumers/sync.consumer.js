const { getChannel } = require('../config/rabbitmq');
const { esClient } = require('../config/elasticsearch');

const startSyncConsumer = async () => {
    const channel = getChannel();
    
    const q = await channel.assertQueue('search_sync_queue', { durable: true });
    
    // Bind to product catalog events
    await channel.bindQueue(q.queue, 'ecommerce_events', 'event.product.created');
    await channel.bindQueue(q.queue, 'ecommerce_events', 'event.product.updated');
    await channel.bindQueue(q.queue, 'ecommerce_events', 'event.product.approved');
    await channel.bindQueue(q.queue, 'ecommerce_events', 'event.product.deleted');

    console.log('[Search Service] Sync Consumer listening for catalog updates...');

    channel.consume(q.queue, async (msg) => {
        if (!msg) return;
        
        const routingKey = msg.fields.routingKey;
        const product = JSON.parse(msg.content.toString());
        
        try {
            if (routingKey === 'event.product.created' || routingKey === 'event.product.updated' || routingKey === 'event.product.approved') {
                console.log(`[Search Service] Indexing product: ${product._id || product.id}`);
                await esClient.index({
                    index: 'products',
                    id: (product._id || product.id).toString(),
                    document: {
                        title: product.title,
                        description: product.description,
                        brand: product.brand || 'Generic',
                        category_name: product.category || 'General',
                        final_price: product.final_price || product.base_price || 0,
                        average_rating: product.average_rating || 0,
                        tags: product.tags || [],
                        status: product.status || 'ACTIVE',
                        images: product.images || [],
                        slug: product.slug,
                        search_keywords: product.search_keywords || [],
                        barcode: product.barcode,
                        weight: product.weight,
                        variants: product.variants ? product.variants.map(v => ({
                            sku: v.sku,
                            color: v.color,
                            size: v.size,
                            storage: v.storage,
                            price_modifier: v.price_modifier
                        })) : []
                    }
                });
            } else if (routingKey === 'event.product.deleted') {
                console.log(`[Search Service] Deleting product from index: ${product._id || product.id}`);
                await esClient.delete({
                    index: 'products',
                    id: (product._id || product.id).toString()
                });
            }

            channel.ack(msg);
        } catch (error) {
            console.error(`[Search Service] Error syncing document ${product._id}:`, error);
            channel.nack(msg, false, false);
        }
    });
};

module.exports = { startSyncConsumer };
