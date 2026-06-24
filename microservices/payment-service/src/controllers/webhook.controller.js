const Stripe = require('stripe');
const stripeSecretKey = process.env.STRIPE_SECRET_KEY || 'sk_test_mock424242424242424242424242';
const stripe = new Stripe(stripeSecretKey);
const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET; // Might be undefined in dev
const { Transaction, Invoice } = require('../models');
const invoiceService = require('../services/invoice.service');
const { publishEvent } = require('../config/rabbitmq');

exports.handleStripeWebhook = async (req, res) => {
    const sig = req.headers['stripe-signature'];
    let event;

    try {
        if (endpointSecret) {
            event = stripe.webhooks.constructEvent(req.body, sig, endpointSecret);
        } else {
            // Bypass signature verification if no endpoint secret is set (for local dev)
            event = JSON.parse(req.body.toString());
        }
    } catch (err) {
        console.error(`⚠️  Webhook signature verification failed.`, err.message);
        return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    if (event.type === 'checkout.session.completed') {
        const session = event.data.object;
        const orderId = session.client_reference_id;
        const amount = session.amount_total / 100; // Stripe uses cents

        console.log(`[Payment Webhook] Session completed for order: ${orderId}`);

        try {
            // Idempotency check
            const existingTx = await Transaction.findOne({ where: { order_id: orderId } });
            if (!existingTx) {
                // Record Transaction
                const transaction = await Transaction.create({
                    order_id: orderId,
                    stripe_charge_id: session.payment_intent || session.id,
                    amount,
                    currency: session.currency.toUpperCase(),
                    status: 'SUCCESS'
                });

                // Generate Invoice
                const invoicePath = await invoiceService.generateInvoice(transaction, {});
                await Invoice.create({
                    transaction_id: transaction.id,
                    order_id: orderId,
                    file_path: invoicePath
                });

                console.log(`[Payment Webhook] Invoice generated for order ${orderId}. Publishing event.payment.success...`);
                // Notify Saga
                publishEvent('event.payment.success', { order_id: orderId });
            }
        } catch (error) {
            console.error(`[Payment Webhook] Error processing success for ${orderId}:`, error);
        }
    }

    res.status(200).end();
};
