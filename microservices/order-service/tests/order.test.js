const request = require('supertest');
const app = require('../src/index');
const { sequelize } = require('../src/config/db');

// Mock rabbitmq to prevent real publishing during tests
jest.mock('../src/config/rabbitmq', () => ({
    connectRabbitMQ: jest.fn().mockResolvedValue(),
    publishEvent: jest.fn(),
    getBrokerMode: jest.fn().mockReturnValue('Mocked'),
    getChannel: jest.fn()
}));

// Mock saga consumer so it doesn't try to bind to queues
jest.mock('../src/consumers/saga.consumer', () => ({
    startSagaConsumers: jest.fn()
}));

jest.mock('jsonwebtoken', () => ({
    verify: jest.fn().mockReturnValue({ id: 'test-user-123', email: 'test@example.com', role: 'CUSTOMER' })
}));

describe('Order Service - Integration Tests', () => {
    beforeAll(async () => {
        // Sync database for tests
        await sequelize.sync({ force: true });
    });

    afterAll(async () => {
        await sequelize.close();
    });

    const mockHeaders = {
        'x-user-id': 'test-user-123',
        'x-user-email': 'test@example.com',
        'x-user-role': 'CUSTOMER',
        'authorization': 'Bearer mock-token'
    };

    describe('POST /checkout', () => {
        it('should create an order successfully', async () => {
            const res = await request(app)
                .post('/checkout')
                .set(mockHeaders)
                .send({
                    items: [
                        { product_id: 'product-1', sku: 'SKU-1', quantity: 2, price: 50.00 }
                    ],
                    total_amount: 100.00,
                    shipping_address: { city: 'Test City', zip: '12345' },
                    card_number: 'tok_visa'
                });
            
            expect(res.status).toBe(201);
            expect(res.body.success).toBe(true);
            expect(res.body.order.id).toBeDefined();
            expect(res.body.order.status).toBe('PENDING');
            
            // Wait, we need to check if event was published
            const { publishEvent } = require('../src/config/rabbitmq');
            expect(publishEvent).toHaveBeenCalledWith('event.order.created', expect.any(Object));
        });
    });

    describe('GET /', () => {
        it('should return user orders', async () => {
            const res = await request(app)
                .get('/')
                .set(mockHeaders);
            
            expect(res.status).toBe(200);
            expect(res.body.success).toBe(true);
            expect(Array.isArray(res.body.orders)).toBe(true);
            expect(res.body.orders.length).toBeGreaterThan(0);
        });
    });
});
