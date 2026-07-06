const { Verifier } = require('@pact-foundation/pact');
const path = require('path');

describe('Product Service Provider Verification', () => {
    it('validates the expectations of API Gateway', () => {
        const opts = {
            provider: 'product-service',
            providerBaseUrl: 'http://localhost:8003',
            pactUrls: [path.resolve(__dirname, '../pacts/api-gateway-product-service.json')],
            publishVerificationResult: !!process.env.PACT_BROKER_URL,
            providerVersion: process.env.GIT_COMMIT || '1.0.0',
        };

        return new Verifier(opts).verifyProvider().then(output => {
            console.log('Pact Verification Complete!');
            console.log(output);
        });
    });
});
