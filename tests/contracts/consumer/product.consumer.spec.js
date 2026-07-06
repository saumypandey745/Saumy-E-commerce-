const path = require('path');
const { PactV3, MatchersV3 } = require('@pact-foundation/pact');

const { like, eachLike } = MatchersV3;

const provider = new PactV3({
    consumer: 'api-gateway',
    provider: 'product-service',
    dir: path.resolve(__dirname, '../pacts'),
});

describe('Product Service Pact', () => {
    it('returns a list of products', () => {
        provider
            .uponReceiving('a request for all products')
            .withRequest({
                method: 'GET',
                path: '/',
            })
            .willRespondWith({
                status: 200,
                headers: { 'Content-Type': 'application/json' },
                body: {
                    status: 'success',
                    data: eachLike({
                        _id: like('60c72b2f9b1d8b001c8e4e9b'),
                        name: like('Sample Product'),
                        price: like(99.99),
                        category: like('electronics')
                    })
                }
            });

        return provider.executeTest(async (mockserver) => {
            const response = await fetch(`${mockserver.url}/`);
            const body = await response.json();
            
            if (response.status !== 200 || body.status !== 'success' || !Array.isArray(body.data)) {
                throw new Error('Contract mismatch for GET products');
            }
        });
    });
});
