const { getChannel } = require('../config/rabbitmq');
const SellerWallet = require('../models/SellerWallet');
const SellerTransaction = require('../models/SellerTransaction');

const PLATFORM_FEE_PERCENTAGE = 0.10; // 10% commission

const processSellerEarnings = async (data) => {
    try {
        const { order_item_id, order_id, seller_id, price, quantity } = data;
        
        const total_amount = price * quantity;
        const platform_fee = total_amount * PLATFORM_FEE_PERCENTAGE;
        const net_amount = total_amount - platform_fee;

        let wallet = await SellerWallet.findOne({ seller_id });
        if (!wallet) {
            wallet = await SellerWallet.create({ seller_id, available_balance: 0, pending_balance: 0, total_earnings: 0 });
        }

        wallet.available_balance += net_amount;
        wallet.total_earnings += net_amount;
        await wallet.save();

        await SellerTransaction.create({
            seller_id,
            type: 'CREDIT',
            amount: net_amount,
            status: 'COMPLETED',
            reference_id: order_item_id,
            description: `Earnings for order item ${order_item_id} (Fee: ${platform_fee})`
        });

        console.log(`[Seller Consumer] Credited ${net_amount} to seller ${seller_id} for order item ${order_item_id}`);
    } catch (error) {
        console.error('[Seller Consumer] Error processing seller earnings:', error.message);
    }
};

const startSellerConsumer = async () => {
    try {
        const channel = getChannel();
        if (channel.isMock) {
            channel.subscribe('ecommerce_events', 'order.item.delivered', processSellerEarnings);
            return;
        }

        const q = await channel.assertQueue('seller_wallet_queue', { durable: true });
        await channel.bindQueue(q.queue, 'ecommerce_events', 'order.item.delivered');

        channel.consume(q.queue, async (msg) => {
            if (msg !== null) {
                const data = JSON.parse(msg.content.toString());
                await processSellerEarnings(data);
                channel.ack(msg);
            }
        });

        console.log('[Payment Service] Seller consumer started');
    } catch (error) {
        console.error('[Payment Service] Failed to start seller consumer:', error);
    }
};

module.exports = { startSellerConsumer };
