# Global Edge Deployment & Disaster Recovery

## 1. Global Edge Architecture

To achieve sub-100ms API response times globally, we deploy an Edge network strategy.

- **Edge CDN (Cloudflare)**: Caches all static assets (images, CSS, JS).
- **Image Optimization**: Cloudflare Polish / AWS CloudFront + Lambda@Edge resizes product images dynamically based on the device's screen size and supports WebP/AVIF formats.
- **Edge API Gateways**: Deploying lightweight API Gateways at Edge locations (e.g., Cloudflare Workers) to serve cached `/api/products` payloads directly from the edge node nearest to the user, completely avoiding the transatlantic hop to the origin server.

## 2. Disaster Recovery Strategy

We must be prepared for worst-case scenarios: Datacenter fires, ransomware, or regional internet outages.

### 2.1 Recovery Objectives
- **RTO (Recovery Time Objective)**: 15 minutes. The maximum time allowed to restore the platform in a backup region.
- **RPO (Recovery Point Objective)**: 1 minute. The maximum allowable data loss (e.g., orders placed in the last 60 seconds may be lost during a catastrophic primary DB failure).

### 2.2 Automated Backups
- **Databases**: Automated volume snapshots every 4 hours. Continuous Oplog archiving to separate immutable, WORM (Write-Once-Read-Many) AWS S3 buckets.
- **Infrastructure**: Because all infrastructure is Terraform code and Kubernetes Helm charts, deploying a clone of the cluster to a new region takes less than 10 minutes.

### 2.3 Failover Mechanism
Route53 Health Checks constantly ping the Primary Region API Gateway. If 3 consecutive failures occur, Route53 automatically updates DNS records to point all global traffic to the Secondary "Standby" Region.
