const { publishEvent } = require('../config/rabbitmq');
const Order = require('../models/Order');
const redis = require('redis');

// CRIT-05: Redis client for saga idempotency guards
const redisClient = redis.createClient({ url: process.env.REDIS_URL || 'redis://localhost:6379' });
redisClient.connect().catch(err => console.error('[SagaOrchestrator] Redis connection error:', err));

/**
 * CRIT-05: Idempotency guard using Redis SETNX.
 * Returns true if this is a NEW (first-time) execution — safe to process.
 * Returns false if this is a DUPLICATE — must be skipped.
 *
 * Key: saga_idempotency:{orderId}:{step} — expires after 24h
 * RabbitMQ delivers at-least-once, so without this, payment.process could
 * be emitted twice, double-charging the customer.
 */
const acquireIdempotencyLock = async (orderId, step) => {
    const key = `saga_idempotency:${orderId}:${step}`;
    const ttlSeconds = 86400; // 24 hours

    // SET key value NX EX ttl — atomic, no race condition
    const result = await redisClient.set(key, '1', { NX: true, EX: ttlSeconds });

    if (result === null) {
        console.warn(`[SAGA][DUPLICATE DETECTED] Skipping duplicate event for order ${orderId}, step: ${step}`);
        return false; // Duplicate — do not process
    }
    return true; // First time — safe to process
};

class SagaOrchestrator {
    async startCheckoutSaga(orderId, items, cardNumber) {
        console.log(`[SAGA] Starting saga for order ${orderId}`);
        // 1. Order is created locally as PENDING

        // 2. Publish Reserve Stock Command
        publishEvent('command.product.reserve_stock', {
            order_id: orderId,
            items: items,
            card_number: cardNumber
        });
    }

    async handleStockReserved(orderId, cardNumber) {
        // CRIT-05: Idempotency — if already processed, skip silently
        const isNew = await acquireIdempotencyLock(orderId, 'stock_reserved');
        if (!isNew) return;

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
        // CRIT-05: Idempotency guard
        const isNew = await acquireIdempotencyLock(orderId, 'stock_failed');
        if (!isNew) return;

        console.log(`[SAGA] Stock reservation failed for order ${orderId}. Cancelling...`);
        const order = await Order.findByPk(orderId);
        if (!order) return;

        order.status = 'CANCELLED';
        await order.save();
    }

    async handlePaymentSuccess(orderId) {
        // CRIT-05: Idempotency guard — prevents double-confirming an order
        const isNew = await acquireIdempotencyLock(orderId, 'payment_success');
        if (!isNew) return;

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
        // CRIT-05: Idempotency guard — prevents double-compensating stock release
        const isNew = await acquireIdempotencyLock(orderId, 'payment_failed');
        if (!isNew) return;

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
