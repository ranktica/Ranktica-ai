# Ranktica AI — System Architecture Blueprint

This document defines the production-ready system architecture, component topology, and cognitive memory framework powering **Ranktica AI**, a full-stack multi-agent platform for content synthesis, algorithmic auditing, and viral script engineering on YouTube and wider media environments.

---

## 1. System Architecture Overview

Ranktica AI is built utilizing a **Full-Stack Orchestration Design**. For local development and demonstration, it operates on a responsive Express server and an offline-first SQLite database (`sql.js`). For production workloads, the system scales seamlessly to a high-availability **PostgreSQL** relational database paired with an active **Redis Cache** cluster. 

```
                                  +---------------------------+
                                  |     Vite Dev Server       |
                                  | (SPA Assets / Front-End)  |
                                  +-------------+-------------+
                                                |
                                                | HMR / Assets
                                                v
+-------------------------+       +-------------+-------------+       +-------------------------+
|     React 19 Client     | <---> |    Express API Server     | <---> |  PostgreSQL Database    |
| (Modern Creator Canvas) |       |  (Proxy & Orchestrators)  |       |  (Primary Datastore)    |
+-------------------------+       +-------------+-------------+       +------------+------------+
                                                |                                  |
                                                | Secure Server SDK                | Cache Cache-hits / Sync
                                                v                                  v
                                  +-------------+-------------+       +------------+------------+
                                  |    Google Gemini LMMs     |       |    Redis Cache Cluster  |
                                  |  (via @google/genai SDK)  |       |  (In-Memory Memory SS)  |
                                  +---------------------------+       +-------------------------+
```

### Core Architecture Capabilities
1. **Server-Side LLM Gatekeeper**: High-security architecture proxies all API instructions through the Node.js Express server to shield sensitive credentials (such as the Gemini API Key) from leaking into client browsers.
2. **Multi-Agent Orchestrator Model**: Promotes isolated specialized agent classes (Subordinates) overseen by a primary coordinator (Director) to synthesize multi-faceted media campaigns.
3. **Caching & Enterprise DB Sync**:
   - **PostgreSQL**: Acts as the authoritative single source of truth for all persistent storage schemas supporting complex workflows, relational campaigns, project entities, and memory nodes.
   - **Redis Cache Layer**: Accerelates high-volume performance by caching user session tokens, frequent query metrics, and expensive LLM reasoning contexts or parsed semantic entity tags, reducing redundant model inference costs.

---

## 2. Directory & Structure Map

The software implementation is split cleanly along structural domains:

```
├── server.ts                    # Backend server (Express API router, database interfaces)
├── package.json                 # Dependency manifests, esbuild configurations, run scripts
├── index.html                   # Entry page
├── src
│   ├── App.tsx                  # Root application controller and security guard
│   ├── types.ts                 # Shared universal type primitives, interfaces, and enums
│   ├── core
│   │   ├── agents/              # Subordinate and Orchestrator Agent logic
│   │   │   ├── seoAgent.ts      # Crawler and Metadata Optimizer
│   │   │   ├── scriptAgent.ts   # Screenplay and Narrative Screenwriter
│   │   │   ├── hookAgent.ts     # Viral engagement strategist
│   │   │   ├── thumbnailAgent.ts# Designer specializing in layout composition
│   │   │   └── youtubeAgent.ts  # Lead coordinator formulating uniform Campaign Blueprints
│   │   ├── auth/                # Security authentication context handling subscriptions
│   │   ├── memory/              # Agent cognitive memory subsystem (Persistent, Retrieval-active)
│   │   │   └── AgentMemory.ts   # Retrieval-Scored Fact and Instruction memory engine
│   │   ├── telemetry/           # Observability, Latency & Metrics tracking subsystem
│   │   │   └── TelemetrySystem.ts# OpenTelemetry & Cost Metric exporter engine
│   │   ├── components/          # Reusable shared interface layouts
│   │   └── constants.ts         # Central target static system settings
│   ├── agents/                  # UI view controllers for individual workspace platforms
│   │   ├── Dashboard.tsx        # High-level productivity tracking and interactive charting
│   │   ├── Projects.tsx         # Active campaign catalog management panel
│   │   └── ...                  # Custom agent interfaces (ScriptWriter, TitleGenerator)
│   ├── services/
│   │   ├── database.ts          # Front-end manifest synchronizer wrapper
│   │   └── gemini.ts            # High-performance generative tasks definitions
│   └── workflows/
│       └── workflowEngine.ts    # Algorithmic predictive calculators & quality validators
```

---

## 3. Cognitive Agentic Memory Subsystem

Autonomous agents require memory statefulness to prevent context fragmentation over multiple user feedback cycles. Active in `/src/core/memory/`, the memory engine models three levels of memory retention:

### Core Memory Components
The memory ecosystem is composed of four specialized memory layers:

1. **Project Memory**: Handles entity flow and active state progression across multi-step or long-running workflows. This tracks and maintains the precise stage, current execution metrics, and intermediary artifacts for each project campaign.
2. **User Preference Memory**: Restores custom creative guidelines, tone demands, writing patterns, and brand-voice directives per creator profile to preserve stylistic continuity.
3. **SEO Knowledge Memory**: Seeds, tracks, and registers generated semantic keyword entities and LSI terms. Downstream agents can directly read from this memory schema to ensure consistency without re-prompting.
4. **Agent Conversation History**: Retains chronological conversational dialogue logs and decision trees between agents and the system to enable complex multi-step reasoning capabilities.

---

## 4. Multi-Agent Orchestration & Entity Propagation Flow

With high-fidelity memory synchronization, Ranktica AI supports true multi-step agent workflows and collaborative entity generation:

```
                  +-----------------------------------+
                  |             SEO Agent             |
                  |     (Generates semantic titles,   |
                  |      tags, LSI keywords)          |
                  +-----------------+-----------------+
                                    |
                                    | [1] Writes keywords & tags
                                    v
                  +-----------------------------------+
                  |        SEO Knowledge Memory       | <---+ [Inquires Entities and
                  |      (Persistent project memory)  |     |  Semantic Scope]
                  +-----------------+-----------------+     |
                                    |                       |
                                    | [2] Transports LSI    |
                                    v                       |
                  +-----------------------------------+     |
                  |           Script Agent            | ----+
                  |    (Integrates core entities into |
                  |    the narration flow seamlessly) |
                  +-----------------+-----------------+
                                    |
                                    | [3] Passes script pacing
                                    v
                  +-----------------------------------+
                  |          Thumbnail Agent          |
                  |  (Applies visual metaphors matched|
                  |   to semantic entities and hook)  |
                  +-----------------+-----------------+
                                    |
                                    | [4] Syncs outcomes
                                    v
                  +-----------------------------------+
                  |          Analytics Agent          |
                  |     (Audits score metrics, CTR,   |
                  |      retention simulation ratios) |
                  +-----------------------------------+
```

### Retrieval Relevance Math
When queried, memories are retrieved using a hybrid prioritization algorithm taking into account Keyword Overlap, Node Importance (Importance scale: `1` to `5`), and Timestamp Recency weights:

$$\text{Relevance Score} = (2 \times \text{Terms Matched}) + (0.5 \times \text{Importance Weight})$$

The engine returns sorted lists with high relevance memories prioritized for runtime injection into active agent prompts.

---

## 5. Storage & Schema Topology

The database utilizes persistent SQLite structures mapped via the Express sql.js engine. To optimize performance and reduce database bloat, the system implements a **Decoupled Relational / Object Storage Separation Pattern**. Relational structures are stored in SQL, while heavy binary files (such as high-res images, voice synthesizer audio, preview videos, and markdown reports) are offloaded to external Object Storage buckets (Cloudflare R2 or Amazon S3).

### `projects` Table
| Column Name | Type | Key | Description |
|---|---|---|---|
| `id` | TEXT | PRIMARY KEY | Unique identifier (UUID | String) |
| `title` | TEXT | | Operational campaign topic |
| `niche` | TEXT | | Category index (e.g. Finance, Tech) |
| `audience` | TEXT | | Target viewer persona |
| `status` | TEXT | | Stage state (`idea`, `scripting`, `production`, etc.) |
| `lastUpdated` | INTEGER | | Epoch timestamp of last adjustment |
| `assets` | TEXT | | Embedded JSON string containing CDN/Storage URL pointers instead of heavy inline assets |
| `team` | TEXT | | Associated platform identities |

### `user_stats` Table
| Column Name | Type | Key | Description |
|---|---|---|---|
| `email` | TEXT | PRIMARY KEY | User authentication identifier |
| `stats` | TEXT | | Serialized JSON containing tracking parameters |

### `storage_configs` Table
| Column Name | Type | Key | Description |
|---|---|---|---|
| `id` | TEXT | PRIMARY KEY | Unique ID (configured to 'active_config') |
| `provider` | TEXT | | Chosen cloud host provider (`cloudflare_r2` or `aws_s3`) |
| `endpoint` | TEXT | | S3-compatible custom endpoint URL |
| `region` | TEXT | | Geographical cloud region |
| `bucket` | TEXT | | Registered cloud bucket name |
| `access_key_id` | TEXT | | Encrypted AWS Access Key ID |
| `secret_access_key` | TEXT | | Encrypted AWS Secret Access Key |
| `public_url` | TEXT | | Public CDN Domain Prefix routing files |

### `storage_assets` Table
| Column Name | Type | Key | Description |
|---|---|---|---|
| `id` | TEXT | PRIMARY KEY | Unique tracking ID (UUID) |
| `project_id` | TEXT | | Connected workspace project ID reference |
| `name` | TEXT | | Original file title |
| `category` | TEXT | | File tag category (`image`, `voice`, `video`, `report`) |
| `file_size` | INTEGER | | File payload size in bytes |
| `mime_type` | TEXT | | Internet media content type descriptor |
| `storage_url` | TEXT | | Direct address (CDN/Storage URL pointer) |
| `created_at` | INTEGER | | Epoch timestamp of original upload |

---

## 6. Observability & Telemetry Framework

To support high-reliability engineering, Ranktica AI implements a rich metric instrumentation engine in `/src/core/telemetry/`.

### 1. Key Metrics Monitored
*   **Token Usage**: Tracks LLM Prompt, Completion, and Total Token volumes. Records corresponding generative model variants (e.g. `gemini-2.5-flash`, `gemini-2.5-pro`) to prevent token depletion and optimize API cost distribution.
*   **Agent Latency**: High-resolution timers track agent work cycle times (milliseconds) to measure runtime efficiency.
*   **Workflow Failures**: Tracks success-to-failure ratios across orchestrator pipelines to isolate broken script blocks or model parse failures.
*   **API Cost Accumulator**: Translates token metrics into real-time USD estimations using pricing coefficients.
*   **User Actions**: Logs critical interactive user click pathways, layout visual generations, and project status movements inside the workspace.

### 2. Integration Tools & Exporters
*   **OpenTelemetry Standards**: Each operational agent action compiles into an OpenTelemetry-compliant tracing `Span` payload (possessing custom IDs, trace attributes, span statuses, and exception records).
*   **Prometheus & Grafana**: Telemetry is structured to facilitate direct output redirection to:
    *   **OpenTelemetry Collector** (via standard OTLP/HTTP daemon at port `4318`)
    *   **Grafana Dashboard Integration**: Spans and metrics are piped directly to Grafana Tempo and Grafana Prometheus Data Sources to present real-time dashboards containing Latency Heatmaps, Token Heat, Cost Trajectories, and Error rates.
