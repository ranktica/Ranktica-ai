import { z } from 'zod';

export const videoIdeaSchema = z.object({
  title: z.string(),
  hook: z.string(),
  seo_keywords: z.array(z.string()).optional(),
  viral_score: z.number().optional(),
  score: z.number().optional(),
  difficulty: z.string().optional(),
  platform: z.string().optional(),
  competition: z.string().optional(),
  interest: z.union([z.string(), z.number()]).optional(),
  logic: z.string().optional(),
});

export const seoResultSchema = z.object({
  titles: z.array(z.string()),
  description: z.string(),
  tags: z.array(z.string()),
  hashtags: z.array(z.string()),
  semanticClusters: z.array(z.string()),
});

export const faqItemSchema = z.object({
  question: z.string(),
  answer: z.string(),
  optimizationScore: z.number(),
});

export const geoEntitySchema = z.object({
  name: z.string(),
  type: z.string(),
  weight: z.number(),
  connectivity: z.array(z.string()),
});

export const geoAeoResultSchema = z.object({
  metaTags: z.object({
    title: z.string(),
    description: z.string(),
    robots: z.string(),
    ogTitle: z.string(),
    ogDescription: z.string(),
    ogImage: z.string(),
    twitterCard: z.string(),
  }),
  schemas: z.object({
    article: z.string(),
    faq: z.string(),
    howTo: z.string(),
    videoObject: z.string(),
    organization: z.string(),
    localBusiness: z.string(),
    breadcrumb: z.string(),
  }),
  faqList: z.array(faqItemSchema),
  entities: z.array(geoEntitySchema),
  knowledgeGraphNodes: z.array(z.object({
    id: z.string(),
    label: z.string(),
    group: z.string()
  })),
  knowledgeGraphEdges: z.array(z.object({
    from: z.string(),
    to: z.string(),
    label: z.string()
  })),
  conversationalResponse: z.string(),
  aeoKeywords: z.array(z.string()),
  citationOptimization: z.object({
    brandAuthorityScore: z.number(),
    recommendedCoMentions: z.array(z.string()),
    uniquenessDifferentiator: z.string(),
    citationBacklinkBlueprint: z.string(),
  }),
  sitemapXml: z.string(),
  robotsTxt: z.string(),
  rssXml: z.string(),
});

export const socialPostSchema = z.object({
  day: z.number(),
  platform: z.enum(['twitter', 'linkedin', 'instagram', 'facebook', 'YouTube Shorts', 'Substack Newsletter', 'YouTube Video', 'Twitter / X', 'LinkedIn']),
  content: z.string(),
  hashtags: z.array(z.string()),
  time: z.string(),
  status: z.enum(['pending', 'scheduled']).optional(),
  visualPrompt: z.string().optional(),
});

export const chatMessageSchema = z.object({
  role: z.enum(['user', 'model']),
  text: z.string(),
  image: z.string().optional(),
  sources: z.array(z.object({
    title: z.string(),
    uri: z.string()
  })).optional(),
});

// Zod schemas for functions' input args
export const generateOutreachCampaignInputSchema = z.object({
  platform: z.string(),
  intent: z.string(),
  duration: z.string(),
  goal: z.string(),
  customer: z.string(),
  city: z.string(),
  dataCollection: z.array(z.string()).optional(),
});

export const engineerMetadataInputSchema = z.object({
  input: z.object({
    topic: z.string().optional(),
    title: z.string().optional(),
    description: z.string().optional(),
    tags: z.string().optional(),
  }),
  goal: z.string(),
});

export const generateIdeasInputSchema = z.object({
  niche: z.string(),
  count: z.number().optional(),
});

export const generateSeoInputSchema = z.object({
  topic: z.string(),
});

export const generateGeoAeoInputSchema = z.object({
  topic: z.string(),
});

export const generateThumbnailInputSchema = z.object({
  prompt: z.string(),
  style: z.string(),
  mode: z.enum(['fast', 'pro']),
  aspectRatio: z.string(),
  imageSize: z.string().optional(),
});

export const generateSpeechInputSchema = z.object({
  text: z.string(),
  voice: z.string().optional(),
  customVoices: z.array(z.object({
    b64Data: z.string(),
    mimeType: z.string(),
    name: z.string(),
  })).optional(),
  excitement: z.number().optional(),
  urgency: z.number().optional(),
});
