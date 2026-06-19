import http from 'k6/http';
import { check, sleep } from 'k6';

// Enterprise Load Testing Strategy: Flash Sale Spike Test
export const options = {
  stages: [
    { duration: '1m', target: 10000 },  // Ramp up to 10k users in 1 minute
    { duration: '3m', target: 100000 }, // Spike to 100k users (Flash Sale)
    { duration: '1m', target: 100000 }, // Hold 100k users for 1 minute
    { duration: '1m', target: 0 },      // Ramp down to 0
  ],
  thresholds: {
    // 99% of requests must complete below 100ms
    http_req_duration: ['p(99)<100'],
    // Error rate must be strictly less than 0.1%
    http_req_failed: ['rate<0.001'],
  },
};

const BASE_URL = 'http://localhost:8000/api';

export default function () {
  // 1. User arrives and views the catalog (Cached Edge request)
  const productRes = http.get(`${BASE_URL}/products`);
  check(productRes, {
    'catalog loaded successfully': (r) => r.status === 200,
  });

  sleep(1); // Think time

  // 2. User searches for a specific flash sale item (Cached CQRS request)
  const searchRes = http.get(`${BASE_URL}/search?q=laptop`);
  check(searchRes, {
    'search executed successfully': (r) => r.status === 200,
  });

  sleep(2); // Reviewing search results

  // 3. User attempts checkout (Simulated write heavy payload to Saga Orchestrator)
  // Note: During a 100k test, most of these will hit the HPA limits or RabbitMQ backlog
  const payload = JSON.stringify({
    userId: `user_${Math.floor(Math.random() * 1000000)}`,
    items: [{ productId: 'prod_987', quantity: 1 }]
  });

  const params = {
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer mock-load-token'
    },
  };

  const checkoutRes = http.post(`${BASE_URL}/orders`, payload, params);
  
  // Accept 201 Created or 503 Service Unavailable (Circuit Breaker Tripped)
  check(checkoutRes, {
    'checkout created or degraded gracefully': (r) => r.status === 201 || r.status === 503,
  });

  sleep(1);
}
