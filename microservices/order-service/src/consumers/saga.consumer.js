const { getChannel } = require('../config/rabbitmq');
const orchestrator = require('../saga/orchestrator');

const startSagaConsumers = async () => {
    const channel = getChannel();
    
    // Assert queue for order service replies
    const q = await channel.assertQueue('order_saga_replies', { durable: true });
    
    // Bind queue to events we care about
    await channel.bindQueue(q.queue, 'ecommerce_events', 'event.product.stock_reserved');
    await channel.bindQueue(q.queue, 'ecommerce_events', 'event.product.stock_failed');
    await channel.bindQueue(q.queue, 'ecommerce_events', 'event.payment.success');
    await channel.bindQueue(q.queue, 'ecommerce_events', 'event.payment.failed');

    console.log('[Order Service] Saga Consumer listening for events...');

    channel.consume(q.queue, async (msg) => {
        if (!msg) return;
        
        const routingKey = msg.fields.routingKey;
        const content = JSON.parse(msg.content.toString());
        
        try {
            switch(routingKey) {
                case 'event.product.stock_reserved':
                    await orchestrator.handleStockReserved(content.order_id, content.card_number);
                    break;
                case 'event.product.stock_failed':
                    await orchestrator.handleStockFailed(content.order_id, content.reason);
                    break;
                case 'event.payment.success':
                    await orchestrator.handlePaymentSuccess(content.order_id);
                    break;
                case 'event.payment.failed':
                    await orchestrator.handlePaymentFailed(content.order_id, content.items);
                    break;
            }
            channel.ack(msg);
        } catch (error) {
            console.error(`[Saga Consumer] Error processing ${routingKey}:`, error);
            // Nack and requeue or send to DLQ in production
            channel.nack(msg, false, false); 
        }
    });
};

module.exports = { startSagaConsumers };
