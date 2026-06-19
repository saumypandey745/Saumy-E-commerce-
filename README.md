# Ecommerce Enterprise

## Message Broker Configuration

The microservices rely on RabbitMQ for asynchronous event-driven communication (e.g., when a review is created, the product rating is updated asynchronously).

### Environments

**Production**
- **Strict Mode**: The services attempt to connect to the real RabbitMQ broker specified by `RABBITMQ_URL` (or default `localhost:5672`).
- If the broker is unreachable, the services will **exit immediately**. There is no silent fallback in production.

**Development**
- **Automatic Fallback**: Services will first try to connect to the real RabbitMQ broker.
- If the connection fails, they will automatically fall back to an **In-Memory Mock Broker**. This ensures developers can run the entire platform locally without needing to install RabbitMQ or Docker.
- The logs will clearly state: `Real RabbitMQ unavailable – falling back to mock.` or `RabbitMQ connected successfully.`

**CI/Test**
- **Forced Mock**: You can force the services to use the mock broker regardless of RabbitMQ availability by setting the environment variable `USE_RABBITMQ_MOCK=true`.
- This ensures deterministic behavior in CI pipelines.
- The logs will output: `Running with In-Memory Mock Broker (forced).`

### Verifying Broker Status
Each service exposes a `/health` endpoint that returns the current message broker mode:
```json
{
  "status": "OK",
  "service": "product-service",
  "database": "connected",
  "messageBroker": "mock" // or "rabbitmq"
}
```
