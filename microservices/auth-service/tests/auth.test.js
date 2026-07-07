const request = require('supertest');
const app = require('../src/index');
const { sequelize } = require('../src/config/db');
const User = require('../src/models/User');

describe('Auth Service - Integration Tests', () => {
    beforeAll(async () => {
        // Sync database for tests
        await sequelize.sync({ force: true });
    });

    afterAll(async () => {
        await sequelize.close();
    });

    describe('POST /register', () => {
        it('should register a new user successfully', async () => {
            const res = await request(app)
                .post('/register')
                .send({
                    full_name: 'Test User',
                    email: 'test@example.com',
                    password: 'Password123!',
                    role: 'CUSTOMER'
                });
            
            expect(res.status).toBe(201);
            expect(res.body.success).toBe(true);
            expect(res.body.message).toBeDefined();
            expect(res.body.user.email).toBe('test@example.com');
        });

        it('should fail if email already exists', async () => {
            const res = await request(app)
                .post('/register')
                .send({
                    full_name: 'Test User 2',
                    email: 'test@example.com',
                    password: 'Password123!',
                    role: 'CUSTOMER'
                });
            
            expect(res.status).toBe(400);
            expect(res.body.success).toBe(false);
            expect(res.body.message).toBe('Email already exists');
        });
    });

    describe('POST /login', () => {
        it('should login successfully with correct credentials', async () => {
            // Manually verify the user before login
            await User.update({ is_verified: true }, { where: { email: 'test@example.com' } });

            const res = await request(app)
                .post('/login')
                .send({
                    email: 'test@example.com',
                    password: 'Password123!'
                });
            
            expect(res.status).toBe(200);
            expect(res.body.success).toBe(true);
            expect(res.body.accessToken).toBeDefined();
        });

        it('should fail login with incorrect password', async () => {
            const res = await request(app)
                .post('/login')
                .send({
                    email: 'test@example.com',
                    password: 'WrongPassword!'
                });
            
            expect(res.status).toBe(401);
            expect(res.body.success).toBe(false);
            expect(res.body.message).toBe('Invalid email/phone or password.');
        });
    });
});
