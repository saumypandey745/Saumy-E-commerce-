const { Invoice, Transaction } = require('../models');
const fs = require('fs');
const path = require('path');
const Stripe = require('stripe');
const stripeSecretKey = process.env.STRIPE_SECRET_KEY || 'sk_test_mock424242424242424242424242';
const stripe = new Stripe(stripeSecretKey);

exports.downloadInvoice = async (req, res, next) => {
    try {
        const { id } = req.params; // Invoice ID
        
        const invoice = await Invoice.findByPk(id, {
            include: [{ model: Transaction }]
        });

        if (!invoice) {
            return res.status(404).json({ success: false, message: 'Invoice not found' });
        }

        const filePath = invoice.file_path;
        
        if (!fs.existsSync(filePath)) {
            return res.status(404).json({ success: false, message: 'Invoice file missing on disk' });
        }

        res.download(filePath, `invoice_${invoice.order_id}.pdf`);
    } catch (error) {
        next(error);
    }
};

exports.getTransactionHistory = async (req, res, next) => {
    try {
        // Ideally filter by user_id, but payment service only knows order_id
        // This endpoint would likely be called internally by Gateway or Admin
        const transactions = await Transaction.findAll({
            order: [['createdAt', 'DESC']],
            limit: 50
        });
        
        res.status(200).json({ success: true, transactions });
    } catch (error) {
        next(error);
    }
};

exports.createCheckoutSession = async (req, res, next) => {
    try {
        const { order_id, amount, currency, items } = req.body;
        // In a real production system you use actual line_items. For simplicity we sum up as one item.
        const session = await stripe.checkout.sessions.create({
            payment_method_types: ['card'],
            mode: 'payment',
            client_reference_id: order_id,
            line_items: items ? items.map(item => ({
                price_data: {
                    currency: currency || 'usd',
                    product_data: { name: item.title || item.sku || 'Product' },
                    unit_amount: Math.round(item.price_at_addition * 100)
                },
                quantity: item.quantity
            })) : [
                {
                    price_data: {
                        currency: currency || 'usd',
                        product_data: { name: `Order ${order_id}` },
                        unit_amount: Math.round(amount * 100)
                    },
                    quantity: 1
                }
            ],
            success_url: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
            cancel_url: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/cart?cancel=true`,
        });

        res.status(200).json({ success: true, url: session.url });
    } catch (error) {
        next(error);
    }
};
