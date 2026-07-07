const { getChannel } = require('../config/rabbitmq');

const startEmailConsumer = async () => {
    const channel = getChannel();
    
    const q = await channel.assertQueue('notification_emails', { durable: true });
    
    // Bind to all notification-worthy events
    await channel.bindQueue(q.queue, 'ecommerce_events', 'event.order.confirmed');
    await channel.bindQueue(q.queue, 'event.order.return_approved'); // Wait, the exchange is ecommerce_events
    await channel.bindQueue(q.queue, 'ecommerce_events', 'event.order.return_approved');
    await channel.bindQueue(q.queue, 'ecommerce_events', 'event.order.return_completed');
    await channel.bindQueue(q.queue, 'ecommerce_events', 'event.payment.failed');
    await channel.bindQueue(q.queue, 'ecommerce_events', 'event.payment.refund_failed');

    console.log('[Notification Service] Email Consumer listening for events...');

    channel.consume(q.queue, async (msg) => {
        if (!msg) return;
        
        const routingKey = msg.fields.routingKey;
        const content = JSON.parse(msg.content.toString());
        
        try {
            console.log(`[Notification Service] Processing ${routingKey}...`);
            
            // Mock email sending
            switch(routingKey) {
                case 'event.order.confirmed':
                    console.log(`[EMAIL DISPATCH] -> To: User ${content.user_id} | Subject: Order ${content.order_id} Confirmed!`);
                    break;
                case 'event.order.return_approved':
                    console.log(`[EMAIL DISPATCH] -> To: User ${content.user_id} | Subject: Return Approved for Order ${content.order_id}`);
                    break;
                case 'event.order.return_completed':
                    console.log(`[EMAIL DISPATCH] -> To: User ${content.user_id} | Subject: Refund Processed for Order ${content.order_id}`);
                    break;
                case 'event.payment.failed':
                case 'event.payment.refund_failed':
                    console.log(`[EMAIL DISPATCH] -> To: Admin/Support | Subject: URGENT: Payment/Refund Failed for Order ${content.order_id}`);
                    break;
                default:
                    console.log(`[EMAIL DISPATCH] -> Received unhandled routing key ${routingKey}`);
            }

            channel.ack(msg);
        } catch (error) {
            console.error(`[Email Consumer] Error processing ${routingKey}:`, error);
            channel.nack(msg, false, false);
        }
    });
};

module.exports = { startEmailConsumer };
