const { getChannel, publishEvent } = require('../config/rabbitmq');
const productController = require('../controllers/product.controller');

const startInventoryConsumer = async () => {
    const channel = getChannel();
    
    const q = await channel.assertQueue('product_inventory_commands', { durable: true });
    
    await channel.bindQueue(q.queue, 'ecommerce_events', 'command.product.reserve_stock');
    await channel.bindQueue(q.queue, 'ecommerce_events', 'command.product.release_stock');
    await channel.bindQueue(q.queue, 'ecommerce_events', 'command.product.restock');

    console.log('[Product Service] Inventory Consumer listening for commands...');

    channel.consume(q.queue, async (msg) => {
        if (!msg) return;
        
        const routingKey = msg.fields.routingKey;
        const content = JSON.parse(msg.content.toString());
        
        try {
            if (routingKey === 'command.product.reserve_stock') {
                console.log(`[Product Service] Received reserve_stock command for order ${content.order_id}, items: ${JSON.stringify(content.items)}`);
                try {
                    // Call the logic directly bypassing HTTP
                    // Mock req/res for the controller functions since they were written for HTTP
                    const mockReq = { body: { items: content.items, order_id: content.order_id } };
                    const mockRes = {
                        status: (code) => ({
                            json: (data) => {
                                if (code === 200) {
                                    publishEvent('event.product.stock_reserved', { order_id: content.order_id, card_number: content.card_number });
                                } else {
                                    console.error(`[Inventory Consumer] reserveStock HTTP failed with ${code}: ${data.message}`);
                                    publishEvent('event.product.stock_failed', { order_id: content.order_id, reason: data.message });
                                }
                            }
                        })
                    };
                    const mockNext = (err) => {
                        console.error(`[Inventory Consumer] reserveStock next() called with error:`, err);
                        publishEvent('event.product.stock_failed', { order_id: content.order_id, reason: err.message });
                    };
                    
                    await productController.reserveStock(mockReq, mockRes, mockNext);
                    
                } catch (error) {
                    console.error(`[Inventory Consumer] reserveStock threw error:`, error);
                    publishEvent('event.product.stock_failed', { order_id: content.order_id, reason: error.message });
                }
            } 
            else if (routingKey === 'command.product.release_stock' || routingKey === 'command.product.restock') {
                 console.log(`[Product Service] Received ${routingKey} command for order ${content.order_id}`);
                 const mockReq = { body: { items: content.items, order_id: content.order_id } };
                 const mockRes = { status: () => ({ json: () => {
                     if (routingKey === 'command.product.restock') {
                         publishEvent('event.product.restock_success', { order_id: content.order_id });
                     }
                 } }) };
                 await productController.releaseStock(mockReq, mockRes, (err) => {
                     console.error(`[Inventory Consumer] releaseStock failed:`, err);
                 });
            }

            channel.ack(msg);
        } catch (error) {
            console.error(`[Inventory Consumer] Error processing ${routingKey}:`, error);
            channel.nack(msg, false, false);
        }
    });
};

module.exports = { startInventoryConsumer };
