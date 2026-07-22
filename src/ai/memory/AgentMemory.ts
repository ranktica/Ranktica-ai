/**
 * Ranktica AI - Agentic Memory Subsystem
 * core/memory/AgentMemory.ts
 * 
 * Provides cognitive memory managers for autonomous agents, implementing:
 * 1. Short-term Working Memory (Session Chat, Tool Outputs)
 * 2. Long-term Fact Storage (Insights, Past Successes, Niche Gaps)
 * 3. Priority & Relevance Retrieval Scoring
 */

export type MemoryType = 'fact' | 'instruction' | 'insight' | 'feedback' | 'context' | 'preference' | 'seo_entity' | 'dialogue';

export interface MemoryNode {
  id: string;
  agentId: string;
  projectId?: string;
  type: MemoryType;
  content: string;
  importance: number; // Scale: 1 (low) to 5 (critical)
  timestamp: number;
  metadata?: Record<string, any>;
}

export interface MemoryQuery {
  agentId?: string;
  projectId?: string;
  type?: MemoryType;
  importanceMin?: number;
  search?: string;
}

export class AgentMemoryEngine {
  private static STORAGE_KEY = 'ranktica_agent_memories';

  /**
   * Saves a new memory node to the cognitive memory database.
   */
  public static addMemory(node: Omit<MemoryNode, 'id' | 'timestamp'>): MemoryNode {
    const memories = this.getAllMemories();
    const newNode: MemoryNode = {
      ...node,
      id: `mem_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: Date.now()
    };
    
    memories.push(newNode);
    this.saveMemories(memories);
    console.debug(`[MemoryEngine] Added cognitive memory for agent: ${node.agentId}`, newNode);
    return newNode;
  }

  /**
   * 1. PROJECT MEMORY API
   * Track cross-agent entity flow and workflow steps
   */
  public static saveProjectStage(projectId: string, agentId: string, content: string, metadata?: Record<string, any>): MemoryNode {
    return this.addMemory({
      agentId,
      projectId,
      type: 'context',
      content,
      importance: 4,
      metadata: {
        ...metadata,
        stage: 'workflow_stage',
        timestamp: Date.now()
      }
    });
  }

  /**
   * 2. USER PREFERENCE MEMORY API
   * Stores customized style settings, tone demands, and brand patterns per creator profile.
   */
  public static saveUserPreference(category: string, preferenceContent: string, importance: number = 3): MemoryNode {
    return this.addMemory({
      agentId: 'userPreferenceManager',
      type: 'preference',
      content: preferenceContent,
      importance,
      metadata: {
        category,
        timestamp: Date.now()
      }
    });
  }

  /**
   * 3. SEO KNOWLEDGE MEMORY API
   * Seeds, tracks, and extracts generated semantic entities so and downstream agents can ingest them.
   */
  public static saveSeoEntity(projectId: string, entities: string[], niche: string): MemoryNode {
    return this.addMemory({
      agentId: 'seoAgent',
      projectId,
      type: 'seo_entity',
      content: `SEO Semantic Entities generated: ${entities.join(', ')}`,
      importance: 5,
      metadata: {
        entities,
        niche,
        timestamp: Date.now()
      }
    });
  }

  /**
   * Extract semantic entities for a project to feed downstream agents (Script agent, Thumbnail agent)
   */
  public static getEntitiesForProject(projectId: string): string[] {
    const memories = this.queryMemories({ projectId, type: 'seo_entity' });
    if (memories.length === 0) return [];
    
    // Retrieve entities array from the most recent SEO entity memory node metadata
    const newest = memories[0];
    return newest.metadata?.entities || [];
  }

  /**
   * 4. AGENT CONVERSATION HISTORY API
   * Retains conversational dialogue logs between autonomous agents to facilitate multi-step reasoning.
   */
  public static saveDialogueTrace(agentId: string, projectId: string | undefined, message: string, role: 'user' | 'assistant' | 'system'): MemoryNode {
    return this.addMemory({
      agentId,
      projectId,
      type: 'dialogue',
      content: message,
      importance: 3,
      metadata: {
        role,
        timestamp: Date.now()
      }
    });
  }

  /**
   * Retrieves conversation history dialogue trail for a specific agent/project context.
   */
  public static getDialogueHistory(agentId: string, projectId?: string): MemoryNode[] {
    return this.queryMemories({ agentId, projectId, type: 'dialogue' })
      .sort((a, b) => a.timestamp - b.timestamp); // Chronological order
  }

  /**
   * Retrieves all cognitive memories stored in persistence.
   */
  public static getAllMemories(): MemoryNode[] {
    try {
      const raw = localStorage.getItem(this.STORAGE_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch (e) {
      console.error('[MemoryEngine] Failed to load memories from localStorage', e);
      return [];
    }
  }

  /**
   * Queries and filters cognitive memories with relevance scoring.
   */
  public static queryMemories(query: MemoryQuery): MemoryNode[] {
    let memories = this.getAllMemories();

    if (query.agentId) {
      memories = memories.filter(m => m.agentId === query.agentId);
    }
    if (query.projectId) {
      memories = memories.filter(m => m.projectId === query.projectId);
    }
    if (query.type) {
      memories = memories.filter(m => m.type === query.type);
    }
    if (query.importanceMin !== undefined) {
      memories = memories.filter(m => m.importance >= (query.importanceMin || 0));
    }

    if (query.search && query.search.trim()) {
      const searchTerms = query.search.toLowerCase().split(/\s+/);
      memories = memories.map(m => {
        let score = 0;
        const contentLower = m.content.toLowerCase();
        
        // Simple term frequency overlap score
        searchTerms.forEach(term => {
          if (contentLower.includes(term)) {
            score += 2;
          }
        });

        // Boost based on importance and recency
        score += m.importance * 0.5;
        
        return { m, score };
      })
      .filter(item => item.score > 0)
      .sort((a, b) => b.score - a.score)
      .map(item => item.m);
    } else {
      // Default to sorting by importance (desc) and timestamp (desc)
      memories.sort((a, b) => {
        if (b.importance !== a.importance) {
          return b.importance - a.importance;
        }
        return b.timestamp - a.timestamp;
      });
    }

    return memories;
  }

  /**
   * Bulk updates / deletes a memory node.
   */
  public static deleteMemory(id: string): void {
    const memories = this.getAllMemories().filter(m => m.id !== id);
    this.saveMemories(memories);
  }

  /**
   * Clear all memories (useful for system resetting).
   */
  public static clearAll(): void {
    localStorage.removeItem(this.STORAGE_KEY);
  }

  /**
   * Seed typical initial context memory nodes for default platforms.
   */
  public static seedDefaultMemories(): void {
    if (this.getAllMemories().length > 0) return;

    const seedData: Omit<MemoryNode, 'id' | 'timestamp'>[] = [
      {
        agentId: 'seoAgent',
        type: 'instruction',
        content: 'Prioritize short, hooky LSI title clusters for modern tech audiences. Avoid jargon-heavy sentences in descriptions.',
        importance: 4,
        metadata: { scope: 'global' }
      },
      {
        agentId: 'scriptAgent',
        type: 'insight',
        content: 'Engagement statistics confirm viewer dropoff after 15 seconds unless a major visual dynamic pattern interrupt is explicitly written.',
        importance: 5,
        metadata: { platform: 'youtube-shorts' }
      },
      {
        agentId: 'thumbnailAgent',
        type: 'fact',
        content: 'Complementary color schemes of Zinc/Amber generate up to 22% higher mock-up CTR ratings in historical test frames.',
        importance: 3,
        metadata: { element: 'color-theory' }
      }
    ];

    seedData.forEach(m => this.addMemory(m));
  }

  private static saveMemories(memories: MemoryNode[]): void {
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(memories));
    } catch (e) {
      console.error('[MemoryEngine] Failed to save memories to localStorage', e);
    }
  }
}
