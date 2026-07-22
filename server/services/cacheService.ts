import Redis from 'ioredis';

export class CacheService {
  private redisClient: Redis | null = null;
  private redisInitialized = false;
  private redisEnabled = false;
  private localCache = new Map<string, { value: string; expiry: number }>();
  
  // Real semantic cache store - maps normalized prompt texts to cache values
  private semanticCacheStore: Array<{
    prompt: string;
    key: string;
    value: string;
    expiry: number;
    model: string;
    agent: string;
  }> = [];

  private stats = {
    exactHits: 0,
    semanticHits: 0,
    misses: 0,
    savedDollars: 0,
    savedTokens: 0,
  };

  // Dynamic Cache Configs
  private config = {
    semanticCacheEnabled: true,
    similarityThreshold: 0.85, // 85% overlap
    defaultTTL: 7200, // 2 hours
  };

  constructor() {
    this.getRedisClient();
  }

  private getRedisClient(): Redis | null {
    if (!this.redisInitialized) {
      this.redisInitialized = true;
      const redisUrl = process.env.REDIS_URL;
      if (redisUrl) {
        try {
          console.log('[CacheService] Configured URL found. Initializing Redis client...');
          this.redisClient = new Redis(redisUrl, {
            maxRetriesPerRequest: 1,
            connectTimeout: 4000,
            retryStrategy: (times) => {
              if (times > 3) {
                console.warn('[CacheService] Reconnection threshold reached. Disabling Redis backend; continuing with In-Memory fallback.');
                this.redisEnabled = false;
                return null;
              }
              return Math.min(times * 150, 2000);
            }
          });

          this.redisClient.on('connect', () => {
            console.log('[CacheService] Connected to the Redis cluster.');
            this.redisEnabled = true;
          });

          this.redisClient.on('error', (err) => {
            console.warn('[CacheService] Connection error:', err.message);
            this.redisEnabled = false;
          });
        } catch (err) {
          console.warn('[CacheService] Initialization failed, using local memory instead:', err);
          this.redisClient = null;
          this.redisEnabled = false;
        }
      } else {
        console.log('[CacheService] No REDIS_URL specified. Utilizing local memory cache.');
        this.redisEnabled = false;
      }
    }
    return this.redisClient;
  }

  /**
   * Calculates Jaccard token overlap similarity between two text prompts
   */
  public calculateSimilarity(p1: string, p2: string): number {
    const w1 = new Set(p1.toLowerCase().replace(/[^\w\s]/g, '').split(/\s+/).filter(s => s.length > 2));
    const w2 = new Set(p2.toLowerCase().replace(/[^\w\s]/g, '').split(/\s+/).filter(s => s.length > 2));
    
    if (w1.size === 0 || w2.size === 0) return 0;
    
    let intersection = 0;
    for (const word of w1) {
      if (w2.has(word)) intersection++;
    }
    
    const union = new Set([...w1, ...w2]).size;
    return intersection / union;
  }

  /**
   * Lookup for exact or semantically similar prompt responses
   */
  public async get(key: string, promptText?: string): Promise<string | null> {
    this.getRedisClient();

    // 1. Check exact key match in Redis
    if (this.redisEnabled && this.redisClient) {
      try {
        const val = await this.redisClient.get(key);
        if (val) {
          this.stats.exactHits++;
          this.stats.savedDollars += 0.0012; // Average exact reuse value
          this.stats.savedTokens += 4000;
          return val;
        }
      } catch (err) {
        console.warn('[CacheService] Redis get error:', (err as Error).message);
      }
    }

    // 2. Check exact key match in local memory
    const localVal = this.localCache.get(key);
    if (localVal) {
      if (Date.now() < localVal.expiry) {
        this.stats.exactHits++;
        this.stats.savedDollars += 0.0012;
        this.stats.savedTokens += 4000;
        return localVal.value;
      } else {
        this.localCache.delete(key);
      }
    }

    // 3. Fallback to Jaccard Semantic Match if exact match missed
    if (this.config.semanticCacheEnabled && promptText && promptText.length > 10) {
      this.evictExpiredSemanticCache();
      
      let bestMatch: typeof this.semanticCacheStore[0] | null = null;
      let highestSimilarity = 0;

      for (const entry of this.semanticCacheStore) {
        if (Date.now() < entry.expiry) {
          const sim = this.calculateSimilarity(promptText, entry.prompt);
          if (sim > highestSimilarity) {
            highestSimilarity = sim;
            bestMatch = entry;
          }
        }
      }

      if (bestMatch && highestSimilarity >= this.config.similarityThreshold) {
        this.stats.semanticHits++;
        this.stats.savedDollars += 0.0025; // Semantic savings are generally higher (prevents reasoning model calls)
        this.stats.savedTokens += 6000;
        
        console.log(`[CacheService] 🧠 SEMANTIC CACHE HIT (Similarity: ${(highestSimilarity * 100).toFixed(1)}%). Reusing result.`);
        
        // Return matching cached value with injection flag
        try {
          const parsed = JSON.parse(bestMatch.value);
          parsed.semanticCacheHit = true;
          parsed.semanticSimilarity = parseFloat(highestSimilarity.toFixed(3));
          parsed.promptVersionSignature = `[Semantic Match Cache - ${(highestSimilarity * 100).toFixed(0)}%]`;
          return JSON.stringify(parsed);
        } catch (_) {
          return bestMatch.value;
        }
      }
    }

    this.stats.misses++;
    return null;
  }

  /**
   * Set cache entry for both exact key and semantic indexing
   */
  public async set(
    key: string,
    value: string,
    ttlSeconds: number = 7200,
    promptText?: string,
    model: string = 'gemini-3.5-flash',
    agent: string = 'AI Agent'
  ): Promise<void> {
    this.getRedisClient();
    const expiry = Date.now() + (ttlSeconds * 1000);

    // 1. Commit to Redis (if active)
    if (this.redisEnabled && this.redisClient) {
      try {
        await this.redisClient.setex(key, ttlSeconds, value);
      } catch (err) {
        console.warn('[CacheService] Redis set error:', (err as Error).message);
      }
    }

    // 2. Commit to exact local cache
    this.localCache.set(key, { value, expiry });

    // 3. Register prompt in Semantic Cache Store
    if (this.config.semanticCacheEnabled && promptText && promptText.length > 10) {
      // Evict duplicate or expired first
      this.semanticCacheStore = this.semanticCacheStore.filter(
        entry => entry.key !== key && Date.now() < entry.expiry
      );

      this.semanticCacheStore.push({
        prompt: promptText,
        key,
        value,
        expiry,
        model,
        agent
      });
    }
  }

  /**
   * Evict expired records in semantic list
   */
  /**
   * Normalizes popular niche queries to a canonical key to maximize deduplication
   */
  public normalizeNicheQuery(niche: string, audience?: string, platform?: string): string {
    const cleanNiche = (niche || '').toLowerCase().trim().replace(/[^\w\s]/g, '').replace(/\s+/g, '_');
    const cleanAudience = (audience || 'all').toLowerCase().trim().replace(/[^\w\s]/g, '').replace(/\s+/g, '_');
    const cleanPlatform = (platform || 'all').toLowerCase().trim().replace(/[^\w\s]/g, '').replace(/\s+/g, '_');
    return `gemini:niche_dedup:${cleanNiche}:${cleanAudience}:${cleanPlatform}`;
  }

  /**
   * High-efficiency retrieval for popular niche search queries
   */
  public async getNicheSearchCache(niche: string, audience?: string, platform?: string): Promise<any | null> {
    const canonicalKey = this.normalizeNicheQuery(niche, audience, platform);
    const rawPrompt = `NICHE SEARCH: ${niche} AUDIENCE: ${audience || 'General'} PLATFORM: ${platform || 'All'}`;
    const cachedStr = await this.get(canonicalKey, rawPrompt);
    if (!cachedStr) return null;

    try {
      const parsed = JSON.parse(cachedStr);
      console.log(`[CacheService] 🎯 NICHE DEDUPLICATION HIT for key: ${canonicalKey} (Prevented Duplicate Gemini Call)`);
      return {
        ...parsed,
        deduplicated: true,
        cachedAt: Date.now(),
        dedupKey: canonicalKey
      };
    } catch (_) {
      return null;
    }
  }

  /**
   * Sets niche search cache entry with 24-hour TTL (86400 seconds) in Redis / local memory cache
   */
  public async setNicheSearchCache(
    niche: string,
    audience: string | undefined,
    platform: string | undefined,
    data: any,
    ttlSeconds: number = 86400 // 24 hours default
  ): Promise<void> {
    const canonicalKey = this.normalizeNicheQuery(niche, audience, platform);
    const rawPrompt = `NICHE SEARCH: ${niche} AUDIENCE: ${audience || 'General'} PLATFORM: ${platform || 'All'}`;
    const serialized = JSON.stringify(data);
    await this.set(canonicalKey, serialized, ttlSeconds, rawPrompt, 'gemini-3.5-flash', 'Niche Search Deduplicator');
    console.log(`[CacheService] 💾 NICHE DEDUPLICATION SAVED for key: ${canonicalKey} (TTL: ${ttlSeconds}s)`);
  }

  private evictExpiredSemanticCache() {
    this.semanticCacheStore = this.semanticCacheStore.filter(entry => Date.now() < entry.expiry);
  }

  /**
   * Get Active Configs and Performance indicators
   */
  public getStats() {
    return {
      hits: this.stats.exactHits + this.stats.semanticHits,
      exactHits: this.stats.exactHits,
      semanticHits: this.stats.semanticHits,
      misses: this.stats.misses,
      savedDollars: parseFloat(this.stats.savedDollars.toFixed(4)),
      savedTokens: this.stats.savedTokens,
      redisActive: this.redisEnabled,
      redisConfigured: !!process.env.REDIS_URL,
      engineType: this.redisEnabled ? 'Redis Cache Cluster' : 'Local In-Memory Cache Fallback',
      keysCount: this.localCache.size,
      semanticKeysCount: this.semanticCacheStore.length,
      config: this.config
    };
  }

  /**
   * Get list of active cached items for visual admin display
   */
  public getCachedItems() {
    this.evictExpiredSemanticCache();
    return this.semanticCacheStore.map(entry => {
      let previewText = '';
      try {
        const parsed = JSON.parse(entry.value);
        previewText = typeof parsed.text === 'string' ? parsed.text.substring(0, 160) : JSON.stringify(parsed).substring(0, 160);
      } catch (_) {
        previewText = entry.value.substring(0, 160);
      }

      return {
        key: entry.key,
        prompt: entry.prompt,
        model: entry.model,
        agent: entry.agent,
        expiresInSec: Math.max(0, Math.round((entry.expiry - Date.now()) / 1000)),
        preview: previewText + '...'
      };
    });
  }

  /**
   * Update cache operational configurations
   */
  public updateConfig(newConfig: Partial<typeof CacheService.prototype.config>) {
    this.config = { ...this.config, ...newConfig };
    console.log('[CacheService] Config updated:', this.config);
  }

  /**
   * Clear all exact and semantic caches
   */
  public async clear(): Promise<void> {
    this.localCache.clear();
    this.semanticCacheStore = [];
    this.stats = { exactHits: 0, semanticHits: 0, misses: 0, savedDollars: 0, savedTokens: 0 };
    
    this.getRedisClient();
    if (this.redisEnabled && this.redisClient) {
      try {
        await this.redisClient.flushall();
        console.log('[CacheService] Successfully cleared Redis database.');
      } catch (err) {
        console.warn('[CacheService] Flushall error:', (err as Error).message);
      }
    }
  }
}

export const aiCache = new CacheService();

