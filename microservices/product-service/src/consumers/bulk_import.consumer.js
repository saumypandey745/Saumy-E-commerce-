const { getChannel, publishEvent } = require('../config/rabbitmq');
const Product = require('../models/Product');

const startBulkImportConsumer = async () => {
    const channel = getChannel();
    const q = await channel.assertQueue('bulk_import_queue', { durable: true });
    await channel.bindQueue(q.queue, 'ecommerce_events', 'product.bulk.import');

    console.log('[Product Service] Bulk Import Consumer listening...');

    channel.consume(q.queue, async (msg) => {
        if (!msg) return;
        
        try {
            const { seller_id, products } = JSON.parse(msg.content.toString());
            console.log(`[Product Service] Processing bulk import for seller ${seller_id}, ${products.length} products`);
            
            for (const item of products) {
                const newProduct = await Product.create({
                    ...item,
                    seller_id,
                    status: 'PENDING_APPROVAL'
                });
                // We emit product.created so it can eventually be indexed once approved
                // Wait, it is PENDING_APPROVAL so it shouldn't be indexed until approved. 
                // We still emit event.product.created for other services if needed,
                // but search service shouldn't index it until status is ACTIVE.
                // It's safe to emit.
                publishEvent('event.product.created', newProduct.toObject());
            }

            channel.ack(msg);
        } catch (error) {
            console.error(`[Product Service] Error processing bulk import:`, error);
            channel.nack(msg, false, false);
        }
    });
};

module.exports = { startBulkImportConsumer };
