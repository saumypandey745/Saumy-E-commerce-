const { sequelize: orderDb } = require('./microservices/order-service/src/config/db');
const Order = require('./microservices/order-service/src/models/Order');
const OrderItem = require('./microservices/order-service/src/models/OrderItem');
const { sequelize: paymentDb } = require('./microservices/payment-service/src/config/db');
const Transaction = require('./microservices/payment-service/src/models/Transaction');

async function testReturn() {
    try {
        await orderDb.authenticate();
        await paymentDb.authenticate();
        
        console.log('Connected to DBs');

        const order = await Order.create({
            id: '11111111-1111-1111-1111-111111111111',
            user_id: 'user-123',
            status: 'RETURN_REQUESTED',
            payment_status: 'SUCCESS',
            total_amount: 150.00,
            shipping_address: {}
        });

        const item = await OrderItem.create({
            order_id: order.id,
            product_id: '64d3b6f00f0f1b2c3d4e5f6g',
            sku: 'TEST-SKU-1',
            seller_id: 'seller-123',
            quantity: 1,
            price: 150.00,
            fulfillment_status: 'DELIVERED'
        });

        const tx = await Transaction.create({
            id: 'tx-123',
            order_id: order.id,
            stripe_charge_id: 'ch_mock123',
            amount: 150.00,
            currency: 'USD',
            status: 'SUCCESS'
        });

        console.log('Mock Data created. Calling approve return API...');
        const axios = require('axios');
        const res = await axios.put(`http://localhost:8002/api/v1/orders/${order.id}/approve-return`, {}, {
            headers: { 'x-user-id': 'admin-123', 'x-user-role': 'ADMIN' }
        });
        
        console.log('API Response:', res.data);

        // Wait a bit and check saga state
        setTimeout(async () => {
            const finalOrder = await Order.findByPk(order.id);
            console.log('Final Order Status:', finalOrder.status);
            console.log('Final Payment Status:', finalOrder.payment_status);
            process.exit(0);
        }, 3000);

    } catch (e) {
        console.error(e);
        process.exit(1);
    }
}
testReturn();
