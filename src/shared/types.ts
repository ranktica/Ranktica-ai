import React from 'react';

export enum ToolType {
  DASHBOARD = 'dashboard', // Default/Creator
  AGENT_BUS = 'agent_bus',
  DEV_DASHBOARD = 'dev_dashboard',
  ABOUT = 'about',
  PROJECTS = 'projects',
  IDEAS = 'ideas',
  SCRIPT = 'script',
  SEO = 'seo',
  THUMBNAIL = 'thumbnail',
  THUMBNAIL_RATER = 'thumbnail_rater',
  VIDEO = 'video',
  VIDEO_GENERATOR = 'video_generator',
  AUDIO = 'audio',
  RESEARCH = 'research',
  COMPETITOR_SPY = 'competitor_spy',
  CHANNEL_AUDIT = 'channel_audit',
  LIVE = 'live',
  MARKETING = 'marketing',
  REPURPOSE = 'repurpose',
  KEYWORD_INSPECTOR = 'keyword_inspector',
  TREND_WATCHER = 'trend_watcher',
  TITLE_GENERATOR = 'title_generator',
  OUTREACH = 'outreach',
  EMAIL_MARKETING = 'email_marketing',
  MARKET_STRATEGIST = 'market_strategist',
  UPGRADE = 'upgrade',
  WORKFLOW = 'workflow',
  SHORTS_GENERATOR = 'shorts_generator',
  METADATA_ENGINEER = 'metadata_engineer',
  OBJECT_STORAGE = 'object_storage',
  AB_TESTING = 'ab_testing',
  SUBSCRIPTIONS = 'subscriptions',
  CUSTOMERS = 'customers',
  PAYMENTS = 'payments',
  INVOICES = 'invoices',
  STRIPE_WEBHOOKS = 'stripe_webhooks',
  ACTIVITY_LOGS = 'activity_logs',
  SECURITY = 'security',
  COST_GOVERNANCE = 'cost_governance',
  RAG_INTELLIGENCE = 'rag_intelligence',
  PROMPT_PORTAL = 'prompt_portal',
  AI_EMPLOYEE_OS = 'ai_employee_os',
  BATTERY_DASHBOARD = 'battery_dashboard',
  TEAM_MEMBERS = 'team_members'
}

export type PlanType = 'free' | 'pro' | 'enterprise' | 'solopreneur' | 'technopreneur' | 'entrepreneur' | 'angle';

export interface UserStats {
  ideasGenerated: number;
  scriptsWritten: number;
  thumbnailsCreated: number;
  seoOptimized: number;
  marketingPlans: number;
  apiCalls?: number;
  tokensUsed?: number;
  repurposedUnits?: number;
}

export interface User {
  email: string;
  name: string;
  plan: PlanType;
  planStartDate: number;
  referralCode: string;
  referredBy?: string;
  stats?: UserStats;
}

export interface ScriptVersion {
  id: string;
  content: string;
  timestamp: number;
  label?: string;
}

export interface TitleVersion {
  id: string;
  title: string;
  timestamp: number;
  label?: string;
}

export interface Workspace {
  id: string;
  name: string;
  handle?: string;
  niche: string;
  audience: string;
  pipelineGoal?: string;
}

export interface ProjectMilestone {
  id: string;
  title: string;
  date: string; // YYYY-MM-DD
  completed?: boolean;
}

export interface Project {
  id: string;
  title: string;
  niche: string;
  audience?: string;
  description?: string;
  folderId?: string;
  workspaceId?: string;
  dependencies?: string[];
  deadline?: string;
  status: 'idea' | 'scripting' | 'production' | 'scheduled' | 'published' | 'archive';
  lastUpdated: number;
  assets: {
    script?: any;
    thumbnail?: any;
    seo?: any;
    video?: any;
    ideas?: VideoIdea[];
    videoUri?: string;
    tags?: string[];
    scriptHistory?: ScriptVersion[];
    titleHistory?: TitleVersion[];
    metadata_topic?: string;
    metadata_description?: string;
    metadata_result?: any;
    tasks?: ProjectTask[];
    thumbnailDraft?: any;
    titleDraft?: any;
    videoDraft?: any;
    audioDraft?: any;
    deadline?: string;
    milestones?: ProjectMilestone[];
    favoriteTools?: ToolType[];
    videoRuntime?: string;
  };
  team: string[];
  archived?: boolean;
  ownerId?: string;
  organizationId?: string;
  milestones?: ProjectMilestone[];
}

export interface ProjectTask {
  id: string;
  title: string;
  milestone: string;
  status: 'pending' | 'in_progress' | 'completed';
  startDate: string; // YYYY-MM-DD
  endDate: string; // YYYY-MM-DD
}

export interface VideoIdea {
  title: string;
  hook: string;
  seo_keywords?: string[];
  viral_score?: number;
  score?: number;
  difficulty?: string;
  platform?: string;
  competition?: string;
  interest?: string | number;
  logic?: string;
}

export interface SeoResult {
  titles: string[];
  description: string;
  tags: string[];
  hashtags: string[];
  semanticClusters: string[];
}

export interface FaqItem {
  question: string;
  answer: string;
  optimizationScore: number;
}

export interface GeoEntity {
  name: string;
  type: string;
  weight: number;
  connectivity: string[];
}

export interface GeoAeoResult {
  metaTags: {
    title: string;
    description: string;
    robots: string;
    ogTitle: string;
    ogDescription: string;
    ogImage: string;
    twitterCard: string;
  };
  schemas: {
    article: string;
    faq: string;
    howTo: string;
    videoObject: string;
    organization: string;
    localBusiness: string;
    breadcrumb: string;
  };
  faqList: FaqItem[];
  entities: GeoEntity[];
  knowledgeGraphNodes: Array<{ id: string; label: string; group: string }>;
  knowledgeGraphEdges: Array<{ from: string; to: string; label: string }>;
  conversationalResponse: string;
  aeoKeywords: string[];
  citationOptimization: {
    brandAuthorityScore: number;
    recommendedCoMentions: string[];
    uniquenessDifferentiator: string;
    citationBacklinkBlueprint: string;
  };
  sitemapXml: string;
  robotsTxt: string;
  rssXml: string;
}

export interface SocialPost {
  day: number;
  platform: 'twitter' | 'linkedin' | 'instagram' | 'facebook' | 'YouTube Shorts' | 'Substack Newsletter' | 'YouTube Video' | 'Twitter / X';
  content: string;
  hashtags: string[];
  time: string;
  status?: 'pending' | 'scheduled';
  visualPrompt?: string; // New field for AI-suggested visual
}

export interface ChatMessage {
  role: 'user' | 'model';
  text: string;
  image?: string;
  sources?: Array<{ title: string; uri: string }>;
}

export interface NavItem {
  id: ToolType;
  label: string;
  icon: React.ReactNode;
  category?: string;
  description?: string;
}

export interface LinkItem {
  id: string;
  label: string;
  url: string;
}

export interface ThumbnailRating {
  score: number;
  strengths: string[];
  weaknesses: string[];
  suggestions: string;
}

export interface CompetitorAnalysis {
  channelName: string;
  swot: {
    strengths: string[];
    weaknesses: string[];
    opportunities: string[];
    threats: string[];
  };
  topKeywords: string[];
  uploadSchedule: string;
  strategy: string;
}

export interface AuditItem {
  label: string;
  passed: boolean;
  tip: string;
}

export interface VideoAudit {
  score: number;
  checklist: AuditItem[];
  overallFeedback: string;
}

export interface RepurposedContent {
  twitterThread: string[];
  blogPost: string;
  newsletter: {
    subject: string;
    body: string;
  };
  shortsScript: string;
}

export interface DiscoverQuery {
  term: string;
  category: 'Primary' | 'Secondary' | 'Long-Tail' | 'Commercial' | 'Transactional' | 'Informational' | 'Local' | 'Question' | 'Voice' | 'Conversational';
  volume: number;
  cpc: string;
  competition: 'Low' | 'Medium' | 'High' | 'Very High';
  difficulty: number;
  trendScore: number;
  intent: string;
  opportunityScore: number;
}

export interface SemanticClusterItem {
  name: string;
  keywords: string[];
  intentGroup: string;
  volumeShare: number;
}

export interface EntityGraphNode {
  id: string;
  label: string;
  type: 'Entity' | 'Concept' | 'Category' | 'Brand';
  valency: number;
}

export interface EntityGraphEdge {
  source: string;
  target: string;
  relation: string;
}

export interface GeoPlatform {
  name: string;
  visibility: number;
  citationOpportunities: string[];
  missingEntities: string[];
  answerGaps: string[];
  brandMentions: number;
  promptVisibilityScore: number;
}

export interface AeoDetails {
  featuredSnippetOpp: string;
  peopleAlsoAsk: string[];
  faqOpp: string[];
  voiceSearchOpp: string[];
  recommendedFaqs: { question: string; answer: string }[];
  schemaMarkup: string;
  snippetProbability: number;
  snippetTemplate: string;
}

export interface CompetitorData {
  name: string;
  rankingKeywordsCount: number;
  estimatedTraffic: string;
  backlinkStrength: number;
  domainAuthority: number;
  contentCoveragePercent: number;
  aiVisibilityScore: number;
  contentGap: string[];
  keywordGap: string[];
  entityGap: string[];
}

export interface PredictiveModel {
  futureVolume: { label: string; value: number }[];
  futureCpc: { label: string; value: string }[];
  rankingProbability: { label: string; value: number }[];
  trafficGrowth: { label: string; value: number }[];
}

export interface TrendNetwork {
  google: string[];
  reddit: string[];
  youtube: string[];
  tiktok: string[];
  x: string[];
}

export interface ContentBrief {
  pillarPage: string;
  suggestedTitle: string;
  metaDescription: string;
  headingStructure: string[];
  faqStructure: { question: string; answer: string }[];
  entityCoveragePlan: string[];
  internalLinkingPlan: string[];
}

export interface KeywordMetrics {
  keyword: string;
  searchVolume: number;
  competition: 'Low' | 'Medium' | 'High' | 'Very High';
  overallScore: number;
  relatedKeywords: string[];
  cpc?: string;
  lsiClusters?: string[];
  
  // Enterprise Extended Intelligence Attributes
  estimatedMonthlyTraffic?: number;
  estimatedCpcValue?: string;
  visibilityScore?: number;
  aiSearchPresenceScore?: number;
  geoScore?: number;
  aeoScore?: number;
  competitorDominanceIndex?: number;
  trendMomentumScore?: number;
  
  // Sub-intelligence modules
  discoveryQueries?: DiscoverQuery[];
  semanticClustersList?: SemanticClusterItem[];
  entityNodes?: EntityGraphNode[];
  entityEdges?: EntityGraphEdge[];
  geoPlatforms?: GeoPlatform[];
  aeoDetails?: AeoDetails;
  competitors?: CompetitorData[];
  predictiveForecast?: PredictiveModel;
  trendsNetwork?: TrendNetwork;
  contentBrief?: ContentBrief;
  modelRoutingLog?: { task: string; model: string; latencyMs: number }[];
}

export interface TrendResult {
  topic: string;
  description: string;
  whyTrending: string;
  searchVolumeTrend: 'Rising' | 'Exploding' | 'Stable';
}

export interface TitlePrediction {
  title: string;
  type: string;
  predictedCtr: number;
  logic?: string;
}

export interface OutreachTemplate {
  stage: 'Initial' | 'Follow-Up 1' | 'Follow-Up 2' | 'Value Add';
  subject?: string;
  body: string;
  explanation: string;
}

export interface OutreachResult {
  strategy: string;
  funnelSteps: Array<{ step: number; label: string; message: string; action: string }>;
  dataCollectionFormat: string;
  tips: string[];
  platform?: string;
  targetAudience?: string;
  searchStrategy?: string[];
  templates?: OutreachTemplate[];
  dosAndDonts?: string[];
}

export interface EmailCampaign {
  id: string;
  name: string;
  subject: string;
  body: string;
  targetAudience: string;
  status: 'draft' | 'sending' | 'completed';
  totalRecipients: number;
  sentCount: number;
  stats: {
    openRate: number;
    clickRate: number;
    replyRate: number;
    bounceRate: number;
  };
  createdAt: number;
}

export interface EmailContact {
  id: string;
  email: string;
  name: string;
  company?: string;
}

export interface CustomerPersona {
  name: string;
  gender: string;
  ageRange: string;
  occupation: string;
  quote: string;
  demographics: {
    location: string;
    incomeLevel: string;
    education: string;
    familyStatus: string;
  };
  psychographics: {
    goals: string[];
    painPoints: string[];
    values: string[];
    hobbies: string[];
    fears: string[];
  };
  buyingBehavior: string;
  contentPreferences?: string[];
  favoriteBrands: string[];
  dailyRoutine: string;
}

export interface NicheGap {
  gap: string;
  description: string;
  currentSolutions: string;
  opportunityScore: number;
}

export interface TrendDataPoint {
  year: number;
  interest: number;
  keyDriver: string;
}

export interface TrendForecast {
  topic: string;
  forecast: TrendDataPoint[];
  summary: string;
}

export interface TrendResultForecast {
  topic: string;
  searchVolumeTrend: string;
  description: string;
  whyTrending: string;
}

export interface MetadataEngineeringResult {
  titles: string[];
  description: string;
  tags: string[];
  hashtags: string[];
  semanticClusters: string[];
  score: number;
  deltaAnalysis: string;
  performancePrediction: string;
}

export interface ResearchSession {
  id: string;
  title: string;
  messages: ChatMessage[];
  lastUpdated: number;
}

export interface CostEstimation {
  inputTokens: number;
  outputTokens: number;
  apiCostUSD: number;
  limitCostCredits: number;
}

export interface ProjectContextType {
  projects: Project[];
  activeProject: Project | null;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  searchResults: Project[];
  workspaces?: Workspace[];
  activeWorkspaceId?: string;
  setActiveWorkspaceId?: (id: string) => void;
  createWorkspace?: (name: string, niche: string, audience: string, handle?: string, pipelineGoal?: string) => Promise<void>;
  deleteWorkspace?: (id: string) => Promise<void>;
  backupProjectToCloud?: (projectId: string) => Promise<void>;
  setActiveProjectById: (id: string) => void;
  updateActiveProject: (updates: Partial<Project>) => Promise<void>;
  updateProject: (id: string, updates: Partial<Project>) => Promise<void>;
  createProject: (title: string, niche: string, audience?: string, templateType?: string) => Promise<void>;
  toggleArchiveProject: (id: string) => Promise<void>;
  deleteProject: (id: string) => Promise<void>;
  bulkDeleteProjects?: (ids: string[]) => Promise<void>;
  bulkArchiveProjects?: (ids: string[], archiveState?: boolean) => Promise<void>;
  isSyncing: boolean;
  isOffline?: boolean;
  offlineQueueSize?: number;
  offlineQueue?: any[];
  lastAutoSavedAt?: number | null;
  isAutoSaving?: boolean;
  saveActiveModuleState?: (toolId: string, formState: any) => void;
  getActiveModuleState?: (toolId: string) => Promise<any>;
  clearModuleState?: (toolId: string) => Promise<void>;
  addCustomProject: (project: Project) => Promise<void>;
  addScriptVersion: (projectId: string, content: string, label?: string) => Promise<void>;
  addTitleVersion: (projectId: string, title: string, label?: string) => Promise<void>;
  revertToScriptVersion: (projectId: string, versionId: string) => Promise<void>;
  revertToTitleVersion: (projectId: string, versionId: string) => Promise<void>;
  collaborators: Array<{ userId: string; name: string; lastActive: number; activeTool?: string }>;
  updateUserPresence: (activeTool?: string) => Promise<void>;
  estimateTaskCost: (taskType: 'script' | 'video', params: { wordCount?: number; durationSeconds?: number; model?: string }) => CostEstimation;
  exportCrossPlatformConfig: (projectId: string) => {
    tiktok: {
      title: string;
      caption: string;
      maxLength: string;
      aspectRatio: string;
      recommendedAudio: string;
      hashtags: string[];
      visualPacingAdvice: string;
      segments: Array<{ time: string; cue: string; action: string }>;
    };
    instagram: {
      title: string;
      caption: string;
      maxLength: string;
      aspectRatio: string;
      recommendedAudio: string;
      hashtags: string[];
      visualPacingAdvice: string;
      segments: Array<{ time: string; cue: string; action: string }>;
    };
    youtube: {
      title: string;
      description: string;
      maxLength: string;
      aspectRatio: string;
      recommendedAudio: string;
      hashtags: string[];
      visualPacingAdvice: string;
      segments: Array<{ time: string; cue: string; action: string }>;
    };
  };
  getDaysUntilDeadline?: (project: Project) => number | null;
  getDaysUntilMilestone?: (milestoneDate: string) => number | null;
  exportProjectsToCSV?: () => void;
}

declare global {
  interface AIStudio {
    hasSelectedApiKey: () => Promise<boolean>;
    openSelectKey: () => Promise<void>;
  }

  interface Window {
    AudioContext: typeof AudioContext;
    webkitAudioContext: typeof AudioContext;
    aistudio?: AIStudio;
  }
}
