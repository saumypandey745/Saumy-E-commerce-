# SAST & DAST CI/CD Pipeline Design

This document outlines the GitHub Actions security pipeline required before any code can be merged into the `main` production branch.

## 1. Static Application Security Testing (SAST)
Analyzes the raw source code for known vulnerabilities without executing it.

- **Checkov**: Scans Kubernetes YAML and Terraform IaC for misconfigurations (e.g., containers running as root).
- **Bandit / ESLint**: Scans Python and JavaScript code for hardcoded secrets, injection flaws, and unsafe eval() usage.
- **Trivy / Dependabot**: Scans `package.json` and `requirements.txt` for vulnerable third-party dependencies with known CVEs.

## 2. Dynamic Application Security Testing (DAST)
Analyzes the running application from the outside by simulating malicious attacks.

- **OWASP ZAP**: Automates penetration testing against the staging environment API Gateway. Attempts SQL Injection, Cross-Site Scripting (XSS), and Cross-Site Request Forgery (CSRF).
- **Pipeline Failure**: If OWASP ZAP detects a High or Critical vulnerability, the CI/CD pipeline immediately halts, preventing the deployment.

## 3. Container Scanning
Every Docker image built in the pipeline is scanned using **Trivy**.
- Validates base images (e.g., `node:20-alpine`) for OS-level vulnerabilities.
- Signs the container image cryptographically (using Sigstore Cosign) to guarantee supply chain integrity. The Kubernetes cluster will refuse to run unsigned images.
