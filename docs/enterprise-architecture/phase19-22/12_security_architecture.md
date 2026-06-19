# Enterprise Zero-Trust Security Architecture

This document defines the Zero-Trust network topologies, advanced authentication strategies, and secret management protocols necessary to achieve PCI-DSS and GDPR compliance.

## 1. OAuth2 / OIDC Integration Flow

We migrate from a simple local JWT strategy to an enterprise Identity Provider (IdP) model using OAuth2/OIDC (e.g., Keycloak, Auth0, or Okta).

```mermaid
sequenceDiagram
    participant Client as Frontend (Next.js/React Native)
    participant Gateway as API Gateway
    participant IdP as Identity Provider (Auth0/Keycloak)
    participant Svc as Microservices

    Client->>IdP: 1. Redirect to Login (Google/Apple/Email)
    IdP-->>Client: 2. Return Authorization Code
    Client->>IdP: 3. Exchange Code for Access & ID Tokens (PKCE)
    Client->>Gateway: 4. API Request + Bearer Token
    Gateway->>Gateway: 5. Validate Token Signature (JWKS)
    Gateway->>Svc: 6. Forward Request with User Context
```

## 2. HashiCorp Vault Secret Management

Environment variables (`.env`) are strictly forbidden in the production Enterprise deployment. All secrets, database credentials, and TLS certificates are managed dynamically.

- **Dynamic Secrets**: Vault generates temporary, short-lived MongoDB credentials for the `product-service`. If compromised, the credentials expire automatically within 1 hour.
- **Encryption as a Service (EaaS)**: Sensitive PII (Personally Identifiable Information) is sent to Vault's Transit Engine for encryption *before* being stored in the database.

```mermaid
graph LR
    K8s[Kubernetes Pod] -->|Service Account JWT| Vault[(HashiCorp Vault)]
    Vault -->|Validates JWT| K8s
    Vault -->|Injects Temporary DB Credentials| K8s
```

## 3. Web Application Firewall (WAF) & Protection

- **Bot Detection**: Cloudflare Bot Management analyzes behavioral patterns and issues CAPTCHAs to suspected automated scripts scraping product prices.
- **Rate Limiting Intelligence**: Instead of blocking purely by IP, the WAF limits requests based on authenticated User IDs and ASN reputation to prevent distributed volumetric attacks.

## 4. Compliance Controls (PCI-DSS & GDPR)
- **PCI-DSS**: No PAN (Primary Account Number) data ever touches our servers. Stripe Elements tokenizes card details directly on the client device.
- **GDPR**: "Right to be Forgotten" endpoints are implemented to cascade user deletion events via Kafka, purging PII across all databases automatically.
