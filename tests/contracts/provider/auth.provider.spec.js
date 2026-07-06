const { Verifier } = require('@pact-foundation/pact');
const path = require('path');

describe('Auth Service Provider Verification', () => {
    it('validates the expectations of API Gateway', () => {
        const opts = {
            provider: 'auth-service',
            providerBaseUrl: 'http://localhost:8001',
            pactUrls: [path.resolve(__dirname, '../pacts/api-gateway-auth-service.json')],
            // Optional: broker URL integration
            // pactBrokerUrl: process.env.PACT_BROKER_URL,
            // pactBrokerToken: process.env.PACT_BROKER_TOKEN,
            publishVerificationResult: !!process.env.PACT_BROKER_URL,
            providerVersion: process.env.GIT_COMMIT || '1.0.0',
        };

        return new Verifier(opts).verifyProvider().then(output => {
            console.log('Pact Verification Complete!');
            console.log(output);
        });
    });
});
