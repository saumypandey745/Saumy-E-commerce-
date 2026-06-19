# Enterprise Microservice Communication Diagrams

The following Mermaid diagrams illustrate the highly resilient, planet-scale communication patterns between the microservices.

## 1. Global Ingress & API Gateway Flow (Synchronous)

This diagram highlights the Edge CDN, Web Application Firewall, and Istio Service Mesh routing.

```mermaid
graph TD
    User([Global User]) -->|HTTPS| CDN[Edge CDN / WAF]
    CDN -->|Geo-Routed| LBL[Cloud Load Balancer]
    LBL -->|HTTPS| Ingress[Istio Ingress Gateway]
    
    subgraph "Kubernetes Cluster (Region A)"
        Ingress -->|mTLS| APIGW[API Gateway Pods]
        
        APIGW -->|mTLS + TraceID| AuthSvc[Auth Service]
        APIGW -->|mTLS + TraceID| ProdSvc[Product Service]
        APIGW -->|mTLS + TraceID| OrderSvc[Order Service]
        
        AuthSvc -.-> Vault[(HashiCorp Vault)]
    end
```

## 2. Distributed Saga Orchestration (Asynchronous)

This diagram illustrates a planet-scale Checkout Saga utilizing Apache Kafka (replacing RabbitMQ for extreme throughput) and Dead Letter Queues (DLQ).

```mermaid
sequenceDiagram
    participant API as API Gateway
    participant Order as Order Service
    participant Kafka as Kafka Event Bus
    participant Pay as Payment Service
    participant Prod as Product Service

    API->>Order: POST /api/orders (Checkout)
    Order->>Order: Create Order (Status: PENDING)
    Order-)Kafka: Publish `OrderCreatedEvent`
    
    par Parallel Consumers
        Kafka-)Pay: Consume `OrderCreatedEvent`
        Kafka-)Prod: Consume `OrderCreatedEvent`
        
        Pay->>Pay: Process Stripe Charge
        Prod->>Prod: Reserve Inventory Locks
    end
    
    alt Payment Fails or Out of Stock
        Pay-)Kafka: Publish `PaymentFailedEvent`
        Prod-)Kafka: Publish `InventoryFailedEvent`
        Kafka-)Order: Consume Failure Events
        Order->>Order: Compensating Transaction (Status: CANCELLED)
        Order-)Kafka: Publish `OrderCancelledEvent`
        Kafka-)Prod: Release Inventory Locks
    else Success
        Pay-)Kafka: Publish `PaymentSuccessEvent`
        Prod-)Kafka: Publish `InventoryReservedEvent`
        Kafka-)Order: Consume Success Events
        Order->>Order: Confirm Order (Status: CONFIRMED)
    end
```

## 3. Read-Heavy CQRS & Search Cascade

This diagram demonstrates how product reviews trigger an eventually-consistent recalculation of average ratings, syncing straight to the distributed OpenSearch cluster.

```mermaid
graph LR
    User([User]) -->|POST Review| APIGW[API Gateway]
    APIGW --> RevSvc[Review Service]
    
    RevSvc -->|Save| MongoDB1[(Reviews DB)]
    RevSvc -->|Publish Event| Kafka[Kafka Topics]
    
    Kafka -->|Consume Review Updated| ProdSvc[Product Service]
    ProdSvc -->|Calculate Avg Rating| MongoDB2[(Products DB)]
    ProdSvc -->|Publish Product Updated| Kafka
    
    Kafka -->|Consume Product Updated| SearchSvc[Search Service]
    SearchSvc -->|Upsert Document| Elastic[(OpenSearch Cluster)]
```
