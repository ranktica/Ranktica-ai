# Ranktica AI V3 - Final Enterprise System Architecture

This architectural document details the secure, enterprise-grade system design of Ranktica AI V3: Global AI Marketing Operating System.

---

## 1. Core Architectural Layout

Ranktica AI V3 leverages a containerized, decoupled full-stack architecture built on Node.js/Express, React/Vite, Google Cloud Run, PostgreSQL, and the high-efficiency Gemini LLM models.

```
       +-------------------------------------------------------+
       |                  Enterprise User Client               |
       |                   (React 18 / Vite SPA)               |
       +-------------------------------------------------------+
                                   |
                         HTTPS / WSS (TLS 1.3)
                                   v
       +-------------------------------------------------------+
       |               Cloudflare Edge Proxy (WAF)             |
       |          DDoS Protection & SSL/TLS Termination        |
       +-------------------------------------------------------+
                                   |
                                   v
       +-------------------------------------------------------+
       |            Knative Container Orchestration            |
       |                (Google Cloud Run Gateway)             |
       +-------------------------------------------------------+
                |                                      |
         Database Query                         Dispatch Agent Jobs
                v                                      v
+-------------------------------+              +-------------------------------+
|    VPC Database Interceptor   |              |     Autonomous Agent Bus      |
|    (PgBouncer Connection Pool)|              |   (Scale-to-zero micro pods)  |
+-------------------------------+              +-------------------------------+
                |                                      |
                v                                      v
+-------------------------------+              +-------------------------------+
|     Master Database Server    |              |     Generative Gateway        |
|    (PostgreSQL Multi-AZ)      |              |   (Gemini 2.5 Flash / Pro)   |
+-------------------------------+              +-------------------------------+
                |                                      |
         Continuous Sync                        Prompt Caching Sync
                v                                      v
+-------------------------------+              +-------------------------------+
|      Warm Standby Replica     |              |     Redis In-Memory Cache     |
|   (europe-west3 Replication)  |              |    (Cached Content Briefs)    |
+-------------------------------+              +-------------------------------+
```

---

## 2. Deep-Dive Module Subsystems

### A. Autonomous Agent Bus
Agent worker pods are spun up on-demand when users dispatch SEO audits or copywriting tasks. These workers communicate via an ephemeral Redis Message Queue. If no jobs exist on the queue, container pods scale-to-zero automatically, preserving computing budget.

### B. Gemini Generative Gateway & Prompt Caching
To maintain predictable API budgets under bulk campaign dispatches, all prompts sent to the Gemini 2.5 models utilize native Prompt Caching. Repetitive system instructions, schemas, and workspace history tables are cached at the API level, yielding a massive 60% reduction in token billing costs.

### C. Write-Optimized PostgreSQL Tier
Structured user tables (e.g., active projects, campaigns, keywords, and audit files) are stored inside a PostgreSQL cluster. Drizzle ORM acts as the central data mapper, ensuring safe, compile-time typed schema interactions and automatic migrations during container deployment loops.

### D. KMS Key Ring & Vault
No plaintext environment variables reside inside our Git repository or running container filesystems. All external secrets (e.g., database connection credentials, payment keys, model keys) are loaded directly into application memory using secure GCP KMS vaults.
