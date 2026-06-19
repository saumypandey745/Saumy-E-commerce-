const { publishEvent } = require('../config/rabbitmq');
const Order = require('../models/Order');

class SagaOrchestrator {
    async startCheckoutSaga(orderId, items, cardNumber) {
        console.log(`[SAGA] Starting saga for order ${orderId}`);
        // 1. Order is created locally as PENDING
        
        // 2. Publish Reserve Stock Command
        publishEvent('command.product.reserve_stock', {
            order_id: orderId,
            items: items,
            card_number: cardNumber // Pass through to payment later
        });
    }

    async handleStockReserved(orderId, cardNumber) {
        console.log(`[SAGA] Stock reserved for order ${orderId}. Processing payment...`);
        const order = await Order.findByPk(orderId);
        if (!order) return;

        order.status = 'PROCESSING';
        await order.save();

        // 3. Publish Process Payment Command
        publishEvent('command.payment.process', {
            order_id: orderId,
            amount: order.total_amount,
            card_number: cardNumber
        });
    }

    async handleStockFailed(orderId, reason) {
        console.log(`[SAGA] Stock reservation failed for order ${orderId}. Cancelling order...`);
        const order = await Order.findByPk(orderId);
        if (!order) return;

        order.status = 'CANCELLED';
        await order.save();
    }

    async handlePaymentSuccess(orderId) {
        console.log(`[SAGA] Payment successful for order ${orderId}. Confirming order...`);
        const order = await Order.findByPk(orderId);
        if (!order) return;

        order.status = 'CONFIRMED';
        order.payment_status = 'PAID';
        await order.save();
        
        // Final Event
        publishEvent('event.order.confirmed', { order_id: orderId, user_id: order.user_id });
    }

    async handlePaymentFailed(orderId, items) {
        console.warn(`[SAGA] Payment failed for order ${orderId}. Starting compensating transactions...`);
        const order = await Order.findByPk(orderId);
        if (!order) return;

        order.status = 'CANCELLED';
        order.payment_status = 'FAILED';
        await order.save();

        let finalItems = items;
        if (!finalItems) {
            const OrderItem = require('../models/OrderItem');
            const orderItems = await OrderItem.findAll({ where: { order_id: orderId } });
            finalItems = orderItems.map(oi => ({
                product_id: oi.product_id,
                sku: oi.sku,
                quantity: oi.quantity
            }));
        }

        // COMPENSATING TRANSACTION: Release Stock
        publishEvent('command.product.release_stock', {
            order_id: orderId,
            items: finalItems
        });
    }
}

module.exports = new SagaOrchestrator();
