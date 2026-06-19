# Global Database Scaling Strategy

A multi-vendor e-commerce platform facing hundreds of millions of users will generate terabytes of data daily. A single MongoDB replica set or SQLite database will fail catastrophically.

## 1. Database Sharding (MongoDB)

For the **Product** and **Order** services, data must be partitioned across multiple servers.

**Sharding Strategy:**
- **Product DB**: Shard Key = `{ category_id: 1, _id: 1 }`. This ensures products within the same category reside on the same shard, optimizing faceted category searches.
- **Order DB**: Shard Key = `{ hashed_user_id: 1 }`. This ensures orders are uniformly distributed across shards to prevent "hotspots" during flash sales, while keeping a specific user's orders clustered together for fast retrieval.

## 2. High Availability & Disaster Recovery

- **Cross-Region Replication**: Databases will run in a stretched cluster across at least 3 Availability Zones (AZs) or entirely different geographic regions.
- **Failover**: If the Primary node fails, Raft consensus elections automatically promote a Secondary node to Primary within 3 seconds.
- **Point-in-Time Recovery (PiTR)**: Oplog archiving enables restoring the database to any specific second in the last 7 days in the event of accidental data deletion.

## 3. Relational Migration for Payments

The current SQLite payment database is an architectural hazard.
- **Target**: Migrate `payment-service` to CockroachDB (Distributed SQL).
- **Reasoning**: Payments demand strict ACID transactions (Atomicity, Consistency, Isolation, Durability) and serializable isolation levels to prevent double-spending or lost charges, which MongoDB does not guarantee efficiently at scale.

## 4. Data Lifecycle & Cold Storage

To keep active indexes small and queries fast:
- **Hot Data**: Last 6 months of orders kept in SSD-backed MongoDB/CockroachDB.
- **Warm Data**: 6-12 months of orders moved to slower HDD storage tiers.
- **Cold Storage**: Orders > 1 year old archived to Amazon S3 / Google Cloud Storage and queried via AWS Athena / Google BigQuery.
