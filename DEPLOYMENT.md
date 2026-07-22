# Ranktica AI – Enterprise SaaS Deployment & Operation Manual

This guide describes the configuration, build, deployment, backup, and restore routines for the Ranktica AI SaaS production environment.

---

## 🧭 Multi-Environment Management

Ranktica AI enforces a strict three-tier environmental isolation strategy to align with modern DevSecOps standards.

| Environment | Purpose | Database | Cache | Secrets Registry |
| :--- | :--- | :--- | :--- | :--- |
| **Development** | Local code development & sandbox experimentation | Local SQLite (`database.sqlite`) | In-Memory Object Fallback | `.env.development` |
| **Staging** | QA verification, performance testing, & CI/CD feedback | Cloud PostgreSQL QA cluster | Isolated Redis DB index `1` | `.env.staging` (GCP / Vault) |
| **Production** | Live tenant operations, multi-tenant workspace routing, payments | High-availability PostgreSQL cluster | High-availability Redis DB index `0` | `.env.production` (Cloud Secret Manager) |

### Environment Files:
- Local/Dev override parameters: `/.env.development`
- Pre-production staging configurations: `/.env.staging`
- High-availability production parameters: `/.env.production`

---

## ⚡ Active Health Probes & Monitoring

To support zero-downtime rolling updates and instant load balancer failover, Ranktica AI features programmatic health and latency endpoints:

### 1. `/api/health`
An intensive, multi-point health check probing crucial app sub-systems:
- **Database Connection**: Evaluates live database availability and logs queries latency.
- **Cache Registry**: Evaluates Redis connection performance and reports live cache hit/miss statistics.
- **Hardware Telemetry**: Collects active CPU counts, load averages, memory allocations (used percentage, available MB), and standard active PID.

*HTTP Response Codes:*
- `200 OK`: All mandatory dependencies are online and fully operational.
- `500 Internal Server Error`: An critical dependency (e.g., active Database) is offline or reporting timeouts.

### 2. `/api/observability/ping`
A rapid low-overhead transport probe returning `{ "status": "pong", "timestamp": ... }` with `200 OK`, ideal for high-frequency edge ingress pingers and CDN health check loops.

---

## 🐳 Containerization (Docker Suite)

We pack applications according to secure, lightweight multi-stage standards which shields final runtimes from unnecessary development dependencies.

### 🧱 Dockerfile Design Standards:
- **Phase 1 (Builder)**: Resolves dependency trees, executes TypeScript validation, and compiles modular full-stack targets using high-performance bundlers.
- **Phase 2 (Runner)**: Includes only production assets and runtime dependencies, runs under a non-privileged `node` system user (`USER node`), and mounts transient storage directories with locked read-write boundaries.

### 🚀 Docker Compose Stack:
Our orchestrator file `docker-compose.yml` launches a fully integrated system stack including:
1. **`app`**: The core Ranktica AI application running over standard port `3000`.
2. **`db`**: A PostgreSQL 16 database utilizing persistent local volumes.
3. **`cache`**: A Redis 7 cluster configured with an LRU cache eviction policy.
4. **`backup-daemon`**: A background Alpine-based daemon running automatic daily transactional backups.

To launch the system stack in production:
```bash
docker-compose --env-file .env.production up -d --build
```

---

## 🔄 Programmatic Backups & Safe Rollback

To guard tenant tables from unintended corruption or data failure events, we provide standalone utility scripts:

### 📥 1. Daily Automated Backups (`/scripts/backup-db.sh`)
- **Action**: Hot-copies SQLite file structures (using native `.backup` to prevent transaction locks) or executes logical `pg_dump` schemas onto PostgreSQL clusters.
- **Compression**: Packs and compresses SQL statements using highly efficient `gzip -9` compression.
- **Pruning**: Automatically identifies and deletes backup archives older than `14` days to enforce storage cleanups.

### 📤 2. Immediate Recovery & Rollbak (`/scripts/rollback.sh`)
Accepts a target database backup file, initiates warning checks, builds fallback state archives before making edits, and executes recovery routines:
```bash
# Example syntax: Execute PostgreSQL state restoration
sh scripts/rollback.sh pg_ranktica_prod_25501103_020000.sql.gz

# Example syntax: Execute SQLite state restoration
sh scripts/rollback.sh sqlite_fallback_25501103_010000.sqlite.tar.gz
```

---

## 👷 Continuous Integration & Deployment (GitHub Actions)

Our automated CI/CD engine is defined in `/.github/workflows/ci-cd.yml` and comprises four strict gates:

```
[ Push/PR ] ──> 🛡️ 1. Gated Quality & SAST Scan ──> 🐳 2. Build & Audit Container ──> 🧪 3. Deploy Staging & Assert Health ──> 🚀 4. Production Rollout
```

1. **Verify & Audit Gate**:
   - Installs a clean dependency lock tree (`npm ci`).
   - Translates code against Type-safety compilers (`npm run lint`).
   - Executes structural integration assertions (`npm run test`).
   - Audits source code against static security threats and hardcoded keys (`npm run security-scan`).
2. **Containerize Image Gate**:
   - Compiles and caches container layers on Docker Buildx.
   - Audits base images for underlying OS exploits and package vulnerabilities.
3. **Staging Rollout Gate**:
   - Deploys container state to the staging server.
   - Triggers post-deploy health checking checks against `/api/health`.
4. **Production Canary Rollout**:
   - Deploys the release to production clusters.
   - Performs health checking validation. If alerts or latency regressions are discovered, it immediately executes `rollback.sh` to revert traffic to previous stable SHAs.
