# Extreme Scale Performance & Chaos Testing

To guarantee 99.99% uptime during massive traffic spikes (e.g., Black Friday), we utilize rigorous, automated performance engineering.

## 1. Load Testing Scenarios (k6)
We simulate user journeys using Grafana k6 to ensure the infrastructure autoscales correctly.

- **Peak Shopping (Spike Test)**: Rapidly scales from 1,000 to 100,000 concurrent Virtual Users (VUs) over 2 minutes to test Horizontal Pod Autoscaler (HPA) reaction times.
- **Checkout Stress Test**: Simulates 10,000 concurrent VUs abandoning carts or completing purchases to monitor RabbitMQ message queue backpressure.

## 2. Performance Analysis Metrics
- **API Latency**: Must remain `< 100ms` for cached catalog reads, and `< 500ms` for transactional writes (Checkout).
- **Redis Hit Ratio**: If the hit ratio drops below 90%, it indicates cache thrashing or inadequate TTL strategies.

## 3. Chaos Engineering (Gremlin / Chaos Mesh)
"Everything fails all the time." We proactively inject failures into the production-like staging environment to ensure the circuit breakers and SRE patterns function correctly.

### 3.1 Chaos Experiments
- **Pod Kill**: Randomly terminates `product-service` pods. *Expected result*: Kubernetes immediately spins up replacements; Istio reroutes traffic seamlessly; users experience zero 502 errors.
- **Network Blackhole**: Injects 5000ms latency between the API Gateway and the Auth Service. *Expected result*: Circuit breakers trip after 3 seconds, returning the configured fallback ("Offline Mock Active") instead of crashing the Gateway.
- **Database CPU Stress**: Spikes MongoDB CPU to 100%. *Expected result*: Read replicas handle the load, or read operations fall back to the Redis cache gracefully.
