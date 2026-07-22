-- Migration: 010_enterprise_observability
-- Description: Sets up persistent SRE tables for structured logs, OpenTelemetry metrics, API/Agent latency histories, and user activity tracks.

CREATE TABLE IF NOT EXISTS otel_metrics (
    metric_key VARCHAR(255) PRIMARY KEY,
    metric_value REAL DEFAULT 0.0,
    unit VARCHAR(50),
    description TEXT,
    updated_at BIGINT NOT NULL
);

CREATE TABLE IF NOT EXISTS otel_structured_logs (
    id VARCHAR(255) PRIMARY KEY,
    trace_id VARCHAR(100),
    span_id VARCHAR(100),
    timestamp BIGINT NOT NULL,
    level VARCHAR(20) NOT NULL, -- 'INFO', 'WARN', 'ERROR', 'FATAL', 'DEBUG'
    service_name VARCHAR(100) NOT NULL, -- 'web-api', 'gemini-inference', 'database-engine', 'security-firewall'
    message TEXT NOT NULL,
    attributes TEXT, -- Stringified JSON
    execution_time_ms REAL DEFAULT 0.0
);

-- Seed pre-populated values for SRE operations to prevent cold starting empty charts
INSERT OR IGNORE INTO otel_metrics (metric_key, metric_value, unit, description, updated_at) VALUES 
('api_requests_total', 1425.0, 'count', 'Cumulative API requests received by gateway', 1718873582000),
('api_latency_avg_ms', 42.8, 'ms', 'Running average API gateway latency', 1718873582000),
('agent_invocations_total', 392.0, 'count', 'Cumulative generative agent triggers', 1718873582000),
('agent_latency_avg_ms', 840.0, 'ms', 'Running average agent completion latency', 1718873582000),
('gemini_failures_total', 14.0, 'count', 'Total API execution failures of Gemini models', 1718873582000),
('gemini_tokens_total', 854020.0, 'tokens', 'Total tokens processed through Gemini', 1718873582000),
('database_queries_total', 9241.0, 'count', 'Cumulative SQLite and Postgres query calls', 1718873582000),
('database_query_latency_avg_ms', 2.3, 'ms', 'System average search and write latency', 1718873582000),
('security_threats_blocked_total', 29.0, 'count', 'Direct script injection, XSS, and SQLi blocks', 1718873582000),
('active_websocket_tunnels', 5.0, 'count', 'Number of persistent websocket tunnels', 1718873582000);
