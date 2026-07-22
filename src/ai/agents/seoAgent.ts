import { SeoResult } from '@/shared/types';
import { MODEL_NAMES } from '@/shared/constants';

/**
 * Ranktica SEO & Semantic Clustering AI Agent
 * Specializes in search indexing, crawling simulation, and keyword strategy.
 */
export class SeoAgent {
  /**
   * Generates comprehensive SEO metadata for a target topic, niche, and audience.
   */
  async generateMetadata(topic: string, niche: string, audience: string): Promise<SeoResult> {
    const prompt = `
You are Ranktica's Advanced SEO & Semantic Metadata Engineering Agent.
Analyze the target topic, channel niche, and ideal audience to engineer high-CTR, crawler-optimized metadata.

TARGET TOPIC: "${topic}"
CHANNEL NICHE: "${niche}"
TARGET AUDIENCE: "${audience}"

Ensure compliance with the latest YouTube search and recommendation ranking algorithms.
- Titles must leverage psychological curiosity triggers, value promises, or pattern interrupts (65 characters limit).
- The description must be structured with visual chapters/sections, a summary, links placement call-outs, and secondary keywords.
- Tags must represent exact, broad, and semantic search strings.
- Hashtags should target high-index channels (3-5 items).
- Semantic clusters must identify the primary core subject pillars and secondary supportive terms.

OUTPUT STRICT JSON ONLY MATCHING THE FOLLOWING SCHEMA:
{
  "titles": ["string"],
  "description": "string",
  "tags": ["string"],
  "hashtags": ["string"],
  "semanticClusters": ["string"]
}
`;

    try {
      const response = await fetch('/api/gemini', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: MODEL_NAMES.TEXT_SMART,
          contents: [{ role: 'user', parts: [{ text: prompt }] }],
          config: {
            responseMimeType: 'application/json'
          }
        })
      });

      if (!response.ok) {
        throw new Error(`SEO Agent generation failed with status code ${response.status}`);
      }

      const result = await response.json();
      const cleanedText = (result.text || "{}").replace(/```json|```/g, '').trim();
      const parsed: SeoResult = JSON.parse(cleanedText);
      
      return {
        titles: parsed.titles || [topic],
        description: parsed.description || `Full guide about ${topic} in the ${niche} domain. Built for ${audience}.`,
        tags: parsed.tags || [topic, niche, 'ranktica'],
        hashtags: parsed.hashtags || ['#ranktica', `#${niche.replace(/\s+/g, '')}`],
        semanticClusters: parsed.semanticClusters || [niche, topic]
      };
    } catch (error) {
      console.error('[SeoAgent Error]:', error);
      // Premium fallback structures
      return {
        titles: [
          `${topic}: The Ultimate Guide for ${audience}`,
          `How to Master ${topic} (Step-by-Step for ${audience})`,
          `This Secret ${topic} Hack Changes Everything!`
        ],
        description: `Struggling to figure out ${topic}? In this complete tutorial tailored for ${audience}, we dive deep into the essential systems, standard pitfalls, and advanced secrets of the ${niche} landscape.`,
        tags: [topic, niche, 'tutorial', 'guide', audience, 'viral insights'],
        hashtags: [`#${niche.replace(/\s+/g, '')}`, '#tutorial', '#viralguide'],
        semanticClusters: [topic, niche, audience]
      };
    }
  }

  /**
   * Conducts an off-site semantic similarity check to isolate high-relevance search terms
   */
  async clusterKeywords(primarySeed: string, lsiTerms: string[]): Promise<string[]> {
    const prompt = `
Given the seed keyword "${primarySeed}" and related terms: ${lsiTerms.join(', ')}.
Group them into 3 distinct semantic clusters that align with YT Search intent.
OUTPUT STRICT JSON ONLY:
["cluster-1-name", "cluster-2-name", "cluster-3-name"]
`;
    try {
      const response = await fetch('/api/gemini', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: MODEL_NAMES.TEXT_SMART,
          contents: [{ role: 'user', parts: [{ text: prompt }] }],
          config: { responseMimeType: 'application/json' }
        })
      });
      if (response.ok) {
        const result = await response.json();
        const text = (result.text || "[]").replace(/```json|```/g, '').trim();
        return JSON.parse(text);
      }
    } catch (e) {
      console.warn('[SeoAgent Clustering Fallback]:', e);
    }
    return ['Trend Exploration', 'Value Propositions', 'Comparative Insights'];
  }
}
