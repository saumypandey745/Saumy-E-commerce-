const { getChannel, publishEvent } = require('../config/rabbitmq');
const { Transaction, Invoice } = require('../models');
const stripeService = require('../services/stripe.service');
const invoiceService = require('../services/invoice.service');

const startPaymentConsumer = async () => {
    const channel = getChannel();
    
    const q = await channel.assertQueue('payment_saga_commands', { durable: true });
    
    await channel.bindQueue(q.queue, 'ecommerce_events', 'command.payment.process');

    console.log('[Payment Service] Payment Consumer listening for commands...');

    channel.consume(q.queue, async (msg) => {
        if (!msg) return;
        
        const routingKey = msg.fields.routingKey;
        const content = JSON.parse(msg.content.toString());
        
        try {
            if (routingKey === 'command.payment.process') {
                const { order_id, amount, card_number } = content;
                console.log(`[Payment Service] Processing payment for order ${order_id}`);
                
                // Idempotency check
                const existingTx = await Transaction.findOne({ where: { order_id } });
                if (existingTx) {
                    console.log(`[Payment Service] Idempotency Hit: Transaction for order ${order_id} already exists.`);
                    channel.ack(msg);
                    return;
                }

                try {
                    // 1. Process Stripe Charge
                    const charge = await stripeService.processCharge(amount, 'USD', card_number);
                    
                    // 2. Record Transaction
                    const transaction = await Transaction.create({
                        order_id,
                        stripe_charge_id: charge.id,
                        amount,
                        currency: 'USD',
                        status: 'SUCCESS'
                    });

                    // 3. Generate Invoice PDF
                    const invoicePath = await invoiceService.generateInvoice(transaction, {});
                    
                    await Invoice.create({
                        transaction_id: transaction.id,
                        order_id,
                        file_path: invoicePath
                    });

                    console.log(`[Payment Service] Payment APPROVED for order ${order_id}. Invoice generated.`);
                    publishEvent('event.payment.success', { order_id });

                } catch (error) {
                    console.log(`[Payment Service] Payment DECLINED for order ${order_id}: ${error.message}`);
                    
                    // Record Failed Transaction
                    await Transaction.create({
                        order_id,
                        amount,
                        currency: 'USD',
                        status: 'FAILED',
                        failure_reason: error.message
                    });

                    publishEvent('event.payment.failed', { order_id, reason: error.message });
                }
            } 

            channel.ack(msg);
        } catch (error) {
            console.error(`[Payment Consumer] Error processing ${routingKey}:`, error);
            channel.nack(msg, false, false);
        }
    });
};

module.exports = { startPaymentConsumer };
