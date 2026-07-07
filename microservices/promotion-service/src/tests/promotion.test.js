const request = require('supertest');
const express = require('express');
const promotionRoutes = require('../routes/promotion.routes');
const { Coupon, CouponRule, CouponUsage } = require('../models');

jest.mock('../models', () => {
    return {
        Coupon: {
            findOne: jest.fn(),
            create: jest.fn(),
            findAll: jest.fn()
        },
        CouponRule: {
            create: jest.fn()
        },
        CouponUsage: {
            count: jest.fn()
        }
    };
});

// Mock middlewares
jest.mock('@ecommerce/shared/middleware/auth.middleware', () => (req, res, next) => next());
jest.mock('@ecommerce/shared/middleware/rbac.middleware', () => () => (req, res, next) => next());

const app = express();
app.use(express.json());
app.use('/', promotionRoutes);

describe('Promotion Service API', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('POST /validate', () => {
        it('should successfully validate a percentage coupon', async () => {
            Coupon.findOne.mockResolvedValue({
                id: 'uuid-1',
                code: 'SUMMER20',
                type: 'PERCENTAGE',
                value: 20,
                min_order_amount: 50,
                max_discount_amount: null,
                is_active: true,
                valid_from: new Date(Date.now() - 10000), // active
                valid_until: new Date(Date.now() + 10000),
                usage_limit_total: null,
                usage_limit_user: null
            });

            const res = await request(app)
                .post('/validate')
                .send({ code: 'SUMMER20', cart_subtotal: 100 });
            
            expect(res.status).toBe(200);
            expect(res.body.success).toBe(true);
            expect(res.body.coupon.discount_amount).toBe(20);
        });

        it('should reject an expired coupon', async () => {
            Coupon.findOne.mockResolvedValue({
                id: 'uuid-2',
                code: 'EXPIRED',
                type: 'FIXED',
                value: 10,
                min_order_amount: 0,
                is_active: true,
                valid_from: new Date(Date.now() - 20000),
                valid_until: new Date(Date.now() - 10000) // expired
            });

            const res = await request(app)
                .post('/validate')
                .send({ code: 'EXPIRED', cart_subtotal: 100 });
            
            expect(res.status).toBe(400);
            expect(res.body.message).toBe('Coupon has expired');
        });

        it('should reject if subtotal is below minimum order amount', async () => {
            Coupon.findOne.mockResolvedValue({
                id: 'uuid-3',
                code: 'MIN50',
                type: 'FIXED',
                value: 10,
                min_order_amount: 50,
                is_active: true,
                valid_from: new Date(Date.now() - 20000),
                valid_until: new Date(Date.now() + 20000)
            });

            const res = await request(app)
                .post('/validate')
                .send({ code: 'MIN50', cart_subtotal: 30 }); // 30 < 50
            
            expect(res.status).toBe(400);
            expect(res.body.message).toMatch(/Minimum order amount/);
        });
    });
});
