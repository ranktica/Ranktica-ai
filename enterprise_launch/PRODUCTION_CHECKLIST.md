# Ranktica AI V3 - Enterprise Production Launch Checklist

This document details the mandatory infrastructure, configuration, and verification steps required to transition Ranktica AI V3 from sandbox staging to a secure, highly available enterprise production environment.

---

## 1. DNS, Routing, & CDN Configuration
- [ ] **Wildcard SSL Certificates (TLS 1.3):** Provision wildcard SSL certs using Let's Encrypt or Cloudflare Keyless SSL.
- [ ] **Edge Proxy Firewalls (WAF):** Setup Cloudflare advanced rate-limiting thresholds and deploy specialized OWASP rules blocking SQL injections and malicious query structures.
- [ ] **Cache Rules & Compression:** Map static routes to Brotli-compressed CDN nodes; implement Cache-Control headers with a `max-age` of 31536000 seconds on built JS/CSS assets.

## 2. Environment & Secrets Management
- [ ] **KMS Vault Injection:** Remove all local `.env` storage files from containers. Inject all production keys (e.g., `GEMINI_API_KEY`, `DATABASE_URL`, `STRIPE_SECRET_KEY`) dynamically using Google Cloud Secret Manager.
- [ ] **Automated Key Rotation:** Establish standard 30-day rotation cycles for critical external API keys, backed by automated Slack alert triggers on execution failure.
- [ ] **Least Privilege IAM Binding:** Bind the deployment container to a minimalist Service Account possessing only read permissions on secrets, write-access to the telemetry logs, and query access on Firestore.

## 3. Database Cluster Hardening
- [ ] **Point-In-Time Recovery (PITR):** Enable continuous write-ahead log archiving on PostgreSQL to allow fine-grained database rollbacks to any specific microsecond window in the prior 14 days.
- [ ] **PgBouncer Connection Pooling:** Wrap PostgreSQL connection entries inside PgBouncer pools operating in `transaction` mode to prevent connection exhaustion during active workforce scale-outs.
- [ ] **Primary & Standby Replication:** Stand up a multi-AZ secondary read replica to balance analytical workloads and act as an instant automatic failover target.

## 4. Operational Container Reliability
- [ ] **Knative Horizontal Pod Autoscaling (HPA):** Bind autoscaling limits to average CPU usage at 75% thresholds with scaling steps capping out at 30 concurrent containers.
- [ ] **Graceful SIGTERM Handlers:** Ensure Express server listeners intercept container teardown signals and wait 15 seconds to allow active requests to finish before severing network ports.
- [ ] **Comprehensive Health Probes:** Configure active `/api/health` endpoints returning 200 checks only when internal database connections are successfully verified.

---
**Approved for Launch by CTO & SecOps Review Boards.**
