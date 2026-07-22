# Ranktica AI V3 - Horizontal Scaling Plan

This document outlines the scaling architecture designed to support a 100x traffic spike on the Ranktica AI V3 Global Marketing Operating System without latency degradation.

---

## 1. Multi-Tier Scaling Architecture

### A. Stateless Server Layer (Google Cloud Run)
- **Autoscaling Mechanism:** Google Cloud Run (native Knative framework).
- **Scale Boundaries:** Min Replicas: `3` (always warm), Max Replicas: `50`.
- **Autoscaling Metric:** Concurrent requests per container set to `80`. Scale out when average container CPU load surpasses `75%`.
- **Pre-warming Rules:** Dispatched automatically upon bulk Campaign creation. Triggering a campaign sends a pre-warming request to spin up 10 extra instances in anticipation of the crawler and copywriting agents.

### B. Intelligent Caching Layer (Redis Cluster)
- **Deployment Topology:** 6-node sharded Redis cluster (3 Masters, 3 Replicas) with multi-AZ failover.
- **Cache Content:**
  - AI copy generated via Gemini (cached for 24 hours).
  - Common SEO analysis crawls and competitor shared metrics.
  - User authorization and OAuth session tokens.
- **Eviction Policy:** `allkeys-lru` (Least Recently Used) to prevent memory saturation during high traffic sweeps.

### C. Write-Optimized Database Layer (PostgreSQL)
- **Connection Management:** PgBouncer proxy layer inside the VPC, keeping database connections locked at a warm pool size of `50`.
- **Read-Write Splitting:**
  - **Master Writer:** Handles active billing payments, new campaign creations, and user status modifications.
  - **Read Replicas (x3):** Routing all analytic dashboards, report exports, and SEO historical audits to standby replicas.
- **Auto-partitioning:** Partitioning large `activity_logs` and `competitor_scrapes` tables horizontally by month to maintain efficient indexing.

---

## 2. Resource Boundaries & Budgets

| Service | CPU limits | Memory limits | Max Connections | Scale-out Trigger |
| :--- | :--- | :--- | :--- | :--- |
| **Node API Gateway** | 1.0 vCPU | 1 GB | 1,000 / pod | &gt;75% CPU load |
| **Agent Worker** | 0.5 vCPU | 512 MB | 50 / pod | Dispatched job queue |
| **Redis Node** | 0.5 vCPU | 2 GB | 10,000 | &gt;80% RAM Pool |
| **PostgreSQL Master**| 4 vCPU | 16 GB | 1,500 (Bounced)| &gt;70% IOPS capacity |
