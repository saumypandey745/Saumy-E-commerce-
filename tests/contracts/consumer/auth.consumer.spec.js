const path = require('path');
const { PactV3, MatchersV3 } = require('@pact-foundation/pact');

const { like } = MatchersV3;

const provider = new PactV3({
    consumer: 'api-gateway',
    provider: 'auth-service',
    dir: path.resolve(__dirname, '../pacts'),
});

describe('Auth Service Pact', () => {
    it('returns a successful login token', () => {
        provider
            .uponReceiving('a valid login request')
            .withRequest({
                method: 'POST',
                path: '/login',
                headers: { 'Content-Type': 'application/json' },
                body: { email: 'test@example.com', password: 'Password123!' }
            })
            .willRespondWith({
                status: 200,
                headers: { 'Content-Type': 'application/json' },
                body: {
                    status: 'success',
                    data: {
                        token: like('jwt.token.string'),
                        user: {
                            id: like('user123'),
                            email: like('test@example.com')
                        }
                    }
                }
            });

        return provider.executeTest(async (mockserver) => {
            // Simulated Gateway fetch logic against the mockserver
            const response = await fetch(`${mockserver.url}/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: 'test@example.com', password: 'Password123!' })
            });

            const body = await response.json();
            if (response.status !== 200 || body.status !== 'success') {
                throw new Error('Contract mismatch');
            }
        });
    });
});
