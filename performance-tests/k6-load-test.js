import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
  stages: [
    { duration: '30s', target: 200 }, // Ramp-up to 200 users
    { duration: '1m', target: 1000 }, // Massive Flash Sale Peak at 1000 users
    { duration: '30s', target: 0 },   // Ramp-down to 0 users
  ],
  thresholds: {
    http_req_duration: ['p(95)<500'], // 95% of requests must complete below 500ms
    http_req_failed: ['rate<0.01'],   // Error rate must be less than 1%
  },
};

const BASE_URL = 'http://localhost:8000/api';

export default function () {
  const params = {
    headers: {
      'x-load-test': 'true'
    }
  };

  // 1. View Products
  const productsRes = http.get(`${BASE_URL}/products`, params);
  check(productsRes, { 'Products loaded successfully': (r) => r.status === 200 });
  
  sleep(1);

  // 2. Add to Cart (Mock payload for unauthenticated session, expecting 401/403 or 200 if guest)
  const cartPayload = JSON.stringify({
    productId: 'product-123',
    quantity: 1,
  });
  
  const postParams = {
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer customer-mock-token',
      'x-load-test': 'true'
    }
  };
  
  const cartRes = http.post(`${BASE_URL}/cart/items`, cartPayload, postParams);
  // Since we don't pass a valid auth token in this test, we expect either a 401 Unauthorized
  // or a 200 if x-guest-id is used. We'll just verify the server responds quickly.
  check(cartRes, { 'Cart interaction recorded': (r) => r.status === 200 || r.status === 401 });

  sleep(1);
}
