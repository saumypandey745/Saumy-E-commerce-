import http from 'k6/http';
import { check, sleep, group } from 'k6';
import { Trend, Rate } from 'k6/metrics';

const GATEWAY_URL = 'http://localhost:8000/api/v1';

export let options = {
    stages: [
        { duration: '30s', target: 50 },  // Ramp up to 50 users
        { duration: '1m', target: 50 },   // Stay at 50 users
        { duration: '30s', target: 0 },   // Ramp down
    ],
    thresholds: {
        http_req_duration: ['p(95)<1000'], // 95% of requests must complete below 1.0s
        http_req_failed: ['rate<0.05'],    // Error rate must be less than 5%
    },
};

const ErrorRate = new Rate('error_rate');
const CheckoutLatency = new Trend('checkout_latency');

export default function () {
    const headers = { 'Content-Type': 'application/json', 'x-load-test': 'true' };

    group('1. Auth Journey', () => {
        // Register (simulated/mocked or hitting cache if duplicate)
        const registerPayload = JSON.stringify({
            email: `loadtest_${__VU}_${__ITER}@example.com`,
            password: 'Password123!',
            first_name: 'Load',
            last_name: 'Tester'
        });
        const regRes = http.post(`${GATEWAY_URL}/auth/register`, registerPayload, { headers });
        ErrorRate.add(regRes.status >= 400);

        // Login
        const loginPayload = JSON.stringify({
            email: `loadtest_${__VU}_${__ITER}@example.com`,
            password: 'Password123!'
        });
        const loginRes = http.post(`${GATEWAY_URL}/auth/login`, loginPayload, { headers });
        check(loginRes, {
            'login is 200 or 429': (r) => r.status === 200 || r.status === 429,
        });
        ErrorRate.add(loginRes.status >= 500);
    });

    sleep(1);

    group('2. Browsing Journey', () => {
        // Fetch products
        const prodRes = http.get(`${GATEWAY_URL}/products?page=1&limit=10`, { headers });
        check(prodRes, {
            'products fetched successfully': (r) => r.status === 200,
        });
        ErrorRate.add(prodRes.status >= 400);

        if (prodRes.status === 200) {
            try {
                const body = JSON.parse(prodRes.body);
                if (body.products && body.products.length > 0) {
                    const productId = body.products[0]._id;
                    // Fetch product details
                    const detailRes = http.get(`${GATEWAY_URL}/products/${productId}`, { headers });
                    ErrorRate.add(detailRes.status >= 400);
                }
            } catch(e) {}
        }
    });

    sleep(1);
    
    group('3. Cart & Checkout (Simulated)', () => {
        const start = new Date();
        const cartRes = http.get(`${GATEWAY_URL}/cart`, { headers });
        CheckoutLatency.add(new Date() - start);
        ErrorRate.add(cartRes.status >= 500);
    });

    sleep(1);
}
