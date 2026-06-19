const { getChannel, publishEvent } = require('../config/rabbitmq');
const Product = require('../models/Product');
const { redisClient } = require('../config/db');

const startReviewConsumer = async () => {
    const channel = getChannel();
    
    const q = await channel.assertQueue('product_review_sync_queue', { durable: true });
    
    await channel.bindQueue(q.queue, 'ecommerce_events', 'event.review.updated');

    console.log('[Product Service] Review Consumer listening for rating updates...');

    channel.consume(q.queue, async (msg) => {
        if (!msg) return;
        
        try {
            const data = JSON.parse(msg.content.toString());
            const { product_id, average_rating, review_count } = data;

            const product = await Product.findById(product_id);
            if (product) {
                product.average_rating = average_rating;
                product.review_count = review_count;
                await product.save();

                // Update cache
                await redisClient.set(`product:read:${product._id}`, JSON.stringify(product));
                await redisClient.set(`product:read:${product.slug}`, JSON.stringify(product));

                // Emit event for Search Service to reindex the new ratings
                publishEvent('event.product.updated', product.toObject());
                console.log(`[Product Service] Synced new ratings for ${product_id} (${average_rating} stars)`);
            }

            channel.ack(msg);
        } catch (error) {
            console.error('[Product Service] Error processing review event:', error);
            channel.nack(msg, false, false);
        }
    });
};

module.exports = { startReviewConsumer };
