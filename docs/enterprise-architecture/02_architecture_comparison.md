# Current vs. Planet-Scale Architecture Comparison

This document contrasts the current "Development/MVP Microservices" architecture with the target "Planet-Scale Enterprise" architecture.

## 1. Network & Routing

| Feature | Current Architecture | Planet-Scale Target Architecture |
| :--- | :--- | :--- |
| **Entrypoint** | Single Node.js Express API Gateway | Global Edge Network (Cloudflare/Fastly) -> Regional Istio Ingress Gateways |
| **Service-to-Service Comm** | Plaintext HTTP/1.1 via internal Docker DNS | gRPC over HTTP/2 with strict Istio mutual TLS (mTLS) |
| **Service Discovery** | Docker Compose DNS / K8s ClusterIP | Istio Envoy Sidecar proxies |
| **Resilience** | Basic `opossum` Circuit Breakers | Envoy-level retries, advanced timeouts, bulkhead isolation, and shadow traffic |

## 2. Data Persistence

| Feature | Current Architecture | Planet-Scale Target Architecture |
| :--- | :--- | :--- |
| **Document Store** | Single MongoDB Replica Set per service | Globally Distributed MongoDB Atlas with Zone-based sharding |
| **Transactional Store** | SQLite (Payment Service) | CockroachDB or AWS Aurora PostgreSQL (Multi-AZ) |
| **Caching** | Single Redis instance at Gateway | Distributed Redis Cluster (e.g., ElastiCache) with cross-region replication |
| **Search Engine** | In-memory `fuse.js` mock | Elastic Cloud / OpenSearch Cluster with multi-node replication |

## 3. Event-Driven Architecture

| Feature | Current Architecture | Planet-Scale Target Architecture |
| :--- | :--- | :--- |
| **Message Broker** | Single RabbitMQ node | Apache Kafka Cluster (Partitioned, Replicated, High-Throughput) |
| **Event Contracts** | Unstructured JSON | Apache Avro / Protobuf schemas via Confluent Schema Registry |
| **Dead Letter Handling** | None | Automated DLQ redelivery, alarming, and human-in-the-loop review queues |

## 4. Observability & Security

| Feature | Current Architecture | Planet-Scale Target Architecture |
| :--- | :--- | :--- |
| **Tracing** | None | OpenTelemetry (`traceparent` propagation) -> Jaeger/Tempo |
| **Logging** | Console stdout | Fluent Bit -> Loki / ELK Stack (Structured JSON logs) |
| **Secrets Management** | K8s Secrets / `.env` files | HashiCorp Vault (Dynamic secrets, auto-rotation) |
| **Traffic Protection** | Basic IP Rate Limiting | AWS WAF, Bot Management, L7 DDoS Protection |

## 5. Deployment & CI/CD

| Feature | Current Architecture | Planet-Scale Target Architecture |
| :--- | :--- | :--- |
| **Orchestration** | Local Docker Compose | Multi-Region Amazon EKS / Google GKE Clusters |
| **Release Strategy** | Rolling Updates (Recreate) | GitOps (ArgoCD) with Canary & Blue-Green deployments |
| **Infrastructure as Code** | Manual K8s YAMLs | Enterprise Terraform Modules & Helm Charts |
| **Autoscaling** | None (Static Replicas) | Horizontal Pod Autoscaler (HPA), Cluster Autoscaler (Karpenter) |
