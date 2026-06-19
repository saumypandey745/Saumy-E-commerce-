const { getChannel } = require('../config/rabbitmq');
const { esClient } = require('../config/elasticsearch');

const startSyncConsumer = async () => {
    const channel = getChannel();
    
    const q = await channel.assertQueue('search_sync_queue', { durable: true });
    
    // Bind to product catalog events
    await channel.bindQueue(q.queue, 'ecommerce_events', 'event.product.created');
    await channel.bindQueue(q.queue, 'ecommerce_events', 'event.product.updated');
    await channel.bindQueue(q.queue, 'ecommerce_events', 'event.product.deleted');

    console.log('[Search Service] Sync Consumer listening for catalog updates...');

    channel.consume(q.queue, async (msg) => {
        if (!msg) return;
        
        const routingKey = msg.fields.routingKey;
        const product = JSON.parse(msg.content.toString());
        
        try {
            if (routingKey === 'event.product.created' || routingKey === 'event.product.updated') {
                console.log(`[Search Service] Indexing product: ${product._id || product.id}`);
                await esClient.update({
                    index: 'products',
                    id: product._id || product.id,
                    doc: product
                });
            } else if (routingKey === 'event.product.deleted') {
                console.log(`[Search Service] Deleting product from index: ${product._id || product.id}`);
                await esClient.delete({
                    index: 'products',
                    id: product._id || product.id
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
