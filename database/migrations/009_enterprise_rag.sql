-- Migration: 009_enterprise_rag
-- Description: Sets up enterprise RAG architecture, knowledge bases, chunks, nodes, and relationships for the knowledge graph.

CREATE TABLE IF NOT EXISTS knowledge_sources (
    id VARCHAR(255) PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    source_type VARCHAR(100) NOT NULL, -- 'Document', 'URL', 'Web page', 'SEO', 'Analytics', 'Customer'
    source_url TEXT,
    raw_content TEXT,
    organization_id VARCHAR(255) NOT NULL,
    ingested_by VARCHAR(255) NOT NULL,
    chunks_count INTEGER DEFAULT 0,
    nodes_count INTEGER DEFAULT 0,
    relationships_count INTEGER DEFAULT 0,
    seo_geo_optimized BOOLEAN DEFAULT 1, -- Optimizes for SEO, GEO, AEO, ChatGPT Search, Perplexity
    status VARCHAR(50) DEFAULT 'processed', -- 'pending', 'processing', 'processed', 'error'
    created_at BIGINT NOT NULL
);

CREATE TABLE IF NOT EXISTS knowledge_chunks (
    id VARCHAR(255) PRIMARY KEY,
    source_id VARCHAR(255) NOT NULL,
    chunk_index INTEGER NOT NULL,
    chunk_text TEXT NOT NULL,
    token_count INTEGER NOT NULL,
    embedding_vector TEXT, -- Stored as JSON string or space-separated floats
    created_at BIGINT NOT NULL,
    FOREIGN KEY(source_id) REFERENCES knowledge_sources(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS knowledge_nodes (
    id VARCHAR(255) PRIMARY KEY,
    organization_id VARCHAR(255) NOT NULL,
    name VARCHAR(255) NOT NULL,
    entity_type VARCHAR(100) NOT NULL, -- 'Brand', 'Topic', 'Keywords', 'Persona', 'Metrics', 'Competitor', 'Product'
    description TEXT,
    confidence REAL DEFAULT 1.0,
    source_chunk_id VARCHAR(255),
    created_at BIGINT NOT NULL,
    FOREIGN KEY(source_chunk_id) REFERENCES knowledge_chunks(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS knowledge_relationships (
    id VARCHAR(255) PRIMARY KEY,
    organization_id VARCHAR(255) NOT NULL,
    source_node_id VARCHAR(255) NOT NULL,
    target_node_id VARCHAR(255) NOT NULL,
    relation_type VARCHAR(255) NOT NULL, -- 'MENTIONS', 'OPTIMIZES_FOR', 'RELATES_TO', 'DEFINES', 'COMPETES_WITH'
    weight REAL DEFAULT 1.0,
    context_reference TEXT,
    created_at BIGINT NOT NULL,
    FOREIGN KEY(source_node_id) REFERENCES knowledge_nodes(id) ON DELETE CASCADE,
    FOREIGN KEY(target_node_id) REFERENCES knowledge_nodes(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS rag_agent_configs (
    id VARCHAR(255) PRIMARY KEY,
    organization_id VARCHAR(255) UNIQUE NOT NULL,
    selected_llm VARCHAR(100) DEFAULT 'gemini-3.5-flash',
    seo_geo_priority VARCHAR(50) DEFAULT 'high', -- 'low', 'medium', 'high'
    target_search_engines TEXT, -- JSON Array, standard ChatGPT Search, Perplexity, Google AI Overviews, Gemini, GEO Optimization
    context_limit INTEGER DEFAULT 5,
    custom_instructions TEXT,
    updated_at BIGINT NOT NULL
);
