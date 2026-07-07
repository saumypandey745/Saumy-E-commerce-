const { getChannel } = require('../config/rabbitmq');
const { CouponUsage } = require('../models');

const startSagaConsumers = async () => {
    const channel = getChannel();
    
    const q = await channel.assertQueue('promotion_saga_commands', { durable: true });
    
    await channel.bindQueue(q.queue, 'ecommerce_events', 'event.order.created');
    await channel.bindQueue(q.queue, 'ecommerce_events', 'event.order.cancelled');

    console.log('[Promotion Service] Saga Consumer listening for events...');

    channel.consume(q.queue, async (msg) => {
        if (!msg) return;
        
        const routingKey = msg.fields.routingKey;
        const content = JSON.parse(msg.content.toString());
        
        try {
            if (routingKey === 'event.order.created') {
                const { order_id, user_id, coupon_id, discount_applied } = content;
                if (coupon_id) {
                    console.log(`[Promotion Service] Tracking usage for coupon ${coupon_id}`);
                    await CouponUsage.create({
                        coupon_id,
                        user_id,
                        order_id,
                        discount_applied
                    });
                }
            } else if (routingKey === 'event.order.cancelled') {
                const { order_id } = content;
                console.log(`[Promotion Service] Order ${order_id} cancelled. Reverting coupon usage if exists.`);
                await CouponUsage.destroy({ where: { order_id } });
            }
            channel.ack(msg);
        } catch (error) {
            console.error(`[Promotion Consumer] Error processing ${routingKey}:`, error);
            channel.nack(msg, false, false);
        }
    });
};

module.exports = { startSagaConsumers };
