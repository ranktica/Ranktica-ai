import React, { useState, useEffect } from 'react';
import { ToolType } from '@/shared/types';
import { useAuth } from '@/infrastructure/auth/AuthContext';
import { logger } from '../infrastructure/logger';
import { toast } from 'react-hot-toast';
import { SystemHealthDashboard } from './SystemHealthDashboard';
import { ModuleDependencyGraph } from './ModuleDependencyGraph';
import { ApiHealthDashboard } from '@/components/ApiHealthDashboard';
import { RateLimitingStatus } from '@/components/RateLimitingStatus';
import { ThemeWorkshop } from '@/components/ThemeWorkshop';
import { ApiHealthStatusWidget } from '@/components/ApiHealthStatusWidget';
import { 
  Terminal, 
  Zap, 
  Cpu, 
  Database, 
  Activity, 
  Code,
  Repeat,
  Share2,
  ExternalLink,
  ChevronRight,
  Server,
  Play,
  ArrowDown,
  Layers,
  Settings,
  ShieldCheck,
  Check,
  CheckCircle2,
  Sparkles,
  MessageSquare,
  ArrowRight,
  RefreshCw,
  Clock,
  Eye,
  TrendingUp,
  Key,
  Users,
  Target,
  ShieldAlert,
  Volume2,
  Video,
  Rocket,
  Search,
  Award,
  FileText
} from 'lucide-react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  ResponsiveContainer, 
  Cell 
} from 'recharts';

interface SimulationPreset {
  query: string;
  intent: string;
  intentCode: string;
  router: string;
  decision: string;
  execution: string;
  aggregation: string;
  outputs: string[];
  finalResponse: string;
  contextAssembled: {
    project: string;
    audience: string;
    tone: string;
    goal: string;
  };
}

const PRESET_SIMULATIONS: SimulationPreset[] = [
  {
    query: "Draft an explosive futuristic programming video script with psychological retention hooks",
    intent: "Content Strategy & Screenplay Engineering",
    intentCode: "SCRIPTWRITE_REQ (Confidence 99.4%)",
    router: "Orchestrated Multi-Agent Pipeline (Heavy Context Analyzer Mode)",
    decision: "Activated 3-step execution dependency graph: IdeasDiscoverer → HookEngineer → ScriptScreenwriter",
    execution: "Invoked Model: 'gemini-2.5-pro' | Tokens: 4,821 | Memory Allocation: 32K context budget | Speed: 540ms",
    aggregation: "Validated output schema via OutputValidator. Mapped heavy assets to Object Storage: Relational schemas separation complete. Written binary screenplay: `/uploaded_assets/futuristic_programming_Script.md`",
    outputs: [
      "[Trace System Event] Decoupler check: heavy transcript row separated from SQLite projects.assets column.",
      "[Trace System Event] Storage mapped: saved binary content file to Cloudflare R2 bucket.",
      "[Trace System Event] DB Catalog Updated: storage_assets metadata record generated successfully."
    ],
    contextAssembled: {
      project: "Neon SynthCode Station",
      audience: "Junior and Senior Developers",
      tone: "Explosive, Psychological, High Pacing",
      goal: "Maximize view count & viewer watch retention"
    },
    finalResponse: `🎬 SCREENPLAY: THE NEON CODE REVOLUTION
=============================================
[VISUAL: Intense cyber neon glowing terminal zooming forward with retro synth riser sound effect]

NARRATION:
"There's a quiet pandemic in software development right now. Ninety percent of developers are building code that's already dead on arrival..."

[HOOK RESET: Dynamic pop sound indicator. VISUAL: Side-by-side terminal comparison showing 12x compilation speedup.]

NARRATION:
"In this video, I'm going to prove to you exactly how the top 1% bypass legacy structures to deploy real solutions. Let's press compile."`
  },
  {
    query: "Perform comprehensive keyword audit on competitive high-perf tech niches",
    intent: "Semantic Search Index & Competitor Auditing",
    intentCode: "SEO_AUDIT_REQ (Confidence 97.8%)",
    router: "Direct Keyword Semantic Pipeline (Low Latency Flash Mode)",
    decision: "Activated 2-step execution dependency graph: CompetitorSpy → SeoSemantic",
    execution: "Invoked Model: 'gemini-2.5-flash' | Tokens: 1,240 | Memory Allocation: 8K context budget | Speed: 310ms",
    aggregation: "Formatted semantic search indices and calculated competitor friction coefficients. Relational rows successfully cached in database structure.",
    outputs: [
      "[Trace System Event] Keyword matrix mapped: queried target high-demand Low-Friction segments.",
      "[Trace System Event] Query validated: 100% compliant with Ranktica search crawler parameters.",
      "[Trace System Event] SQL Cache Updated: search index metadata stored successfully."
    ],
    contextAssembled: {
      project: "Ranktica Competitor Intelligence",
      audience: "SaaS Founders & Digital Growth Hackers",
      tone: "Strictly Objective, High Information Density",
      goal: "Discover Blue Ocean SEO search queries"
    },
    finalResponse: `📊 SEO MATRIX & COMPETITOR AUDIT
=============================================
Target Topic: High-Performance Technopreneur Systems
Competition Friction: Low (Blue Ocean Gap)
Search Trajectory: Exploding (+240% YoY)

Ranktica-Optimized Tags:
- #high-performance #technopreneur #nextjs15 #esbuild-bundling #scalability #sqlite-caching

Crawler Recommendation: 
Deploy customized community outreach targeting developer sub-forums during peak active window: Tuesdays 14:00 UTC.`
  },
  {
    query: "Repurpose our 10-minute AI studio demo into a multi-platform twitter/IG sequence",
    intent: "Omnichannel Repurposing & Document Transformation",
    intentCode: "REPURPOSE_TRANSFORM_REQ (Confidence 98.9%)",
    router: "Social Omnichannel Pipeline (Sequential Extractor Mode)",
    decision: "Activated 2-step execution dependency graph: ScriptScreenwriter (Context Filter) → RepurposerSocial",
    execution: "Invoked Model: 'gemini-2.5-flash' | Tokens: 2,540 | Memory Allocation: 16K context budget | Speed: 420ms",
    aggregation: "Parsed transcript indices, extracted high retention segments, and produced social posts. Logged binary asset package to: `/uploaded_assets/omni_repurpose_output.md`",
    outputs: [
      "[Trace System Event] Extractor hook check: extracted leading Hook 1 and Hook 3 from video source core.",
      "[Trace System Event] Decoupler active: separated raw text block and saved to local object storage buffer.",
      "[Trace System Event] DB catalog complete: pointer registered under storage_assets table category 'report'"
    ],
    contextAssembled: {
      project: "Multi-Platform Repurposing Hub",
      audience: "Video Content Creators & Tech Bloggers",
      tone: "Vibrant, Scannable, Bulleted",
      goal: "Distill 10m transcript to bite-sized threads"
    },
    finalResponse: `🐦 OMNICHANNEL EXPORT: 5-Part Twitter Thread
=============================================
🧵 THREAD OPENER:
"We built an entire full-stack application with automatic SQL & Object Storage separation. Here is exactly why your relational DB shouldn't hold raw binaries 👇"

🧵 TWEET 2:
"1/ Relational databases are designed for query speed on structured scalars. When you store heavy screenplays or Base64 images as text rows inside SQLite/Postgres: You bloat buffers by 10x..."

🧵 TWEET 3:
"2/ Solution: Keep lightweight tables holding only the UUID and public URL pointer, while offloading high-volume files to Cloudflare R2 or Amazon S3 buckets..."`
  }
];

export interface SpecializedAgent {
  name: string;
  id: string;
  category: string;
  description: string;
  status: 'Active' | 'Ready' | 'Optimizing' | 'Calibrating';
  capabilities: string[];
  callsCount: number;
  engine: 'Gemini 3.5 Flash' | 'Gemini 1.5 Pro' | 'Custom Pipeline';
}

export const SPECIALIZED_AGENTS_TIERS = [
  {
    tierName: "Market intelligence & Audience Discovery (Tier 1)",
    agents: [
      {
        name: "Trend Agent",
        id: "trend-agent",
        category: "Research",
        description: "Scans real-time organic search trajectory curves and calculates viral viewer demographics.",
        status: "Active" as const,
        capabilities: ["trend_discovery", "trajectory_modelling", "interest_spikes"],
        callsCount: 1240,
        engine: "Gemini 3.5 Flash" as const
      },
      {
        name: "Keyword Agent",
        id: "keyword-agent",
        category: "Research",
        description: "Groups high-opportunity semantic search clusters and identifies topic overlaps.",
        status: "Ready" as const,
        capabilities: ["keyword_research", "search_volume", "competition_scoring"],
        callsCount: 3102,
        engine: "Gemini 3.5 Flash" as const
      },
      {
        name: "Competitor Agent",
        id: "competitor-agent",
        category: "Research",
        description: "Reverses high-retention video layouts and exposes competitor content vulnerabilities.",
        status: "Active" as const,
        capabilities: ["gap_analysis", "organic_arbitrage", "metadata_scraping"],
        callsCount: 942,
        engine: "Gemini 1.5 Pro" as const
      },
      {
        name: "Audience Agent",
        id: "audience-agent",
        category: "Research",
        description: "Simulates consumer personas, maps viewer expectations, and suggests retention hooks.",
        status: "Ready" as const,
        capabilities: ["demographic_profiling", "psychological_hooks", "retention_prediction"],
        callsCount: 1530,
        engine: "Gemini 1.5 Pro" as const
      }
    ]
  },
  {
    tierName: "Creative Framing & Screenplays (Tier 2)",
    agents: [
      {
        name: "Title Agent",
        id: "title-agent",
        category: "Creative",
        description: "Drafts viral display titles leveraging emotional click triggers and syntactic priming loops.",
        status: "Active" as const,
        capabilities: ["CTR_prediction", "syntactic_priming", "conversion_clickability"],
        callsCount: 4520,
        engine: "Gemini 3.5 Flash" as const
      },
      {
        name: "Description Agent",
        id: "description-agent",
        category: "Creative",
        description: "Builds optimal chapter outlines, crawls metadata structures, and embeds conversion CTAs.",
        status: "Active" as const,
        capabilities: ["search_indexability", "description_generation", "chapter_timestamping"],
        callsCount: 1890,
        engine: "Gemini 3.5 Flash" as const
      },
      {
        name: "Script Agent",
        id: "script-agent",
        category: "Creative",
        description: "Compiles dense audio dialogue, structures screenplays, and programs attention reset cues.",
        status: "Optimizing" as const,
        capabilities: ["narration_screenplay", "pacing_rules", "visual_outline"],
        callsCount: 456,
        engine: "Gemini 1.5 Pro" as const
      },
      {
        name: "Outline Agent",
        id: "outline-agent",
        category: "Creative",
        description: "Visualizes full storyboards, schedules active text annotations, and guides b-roll layout.",
        status: "Ready" as const,
        capabilities: ["storyboard_blocking", "transition_triggers", "timeline_benchmarks"],
        callsCount: 1120,
        engine: "Gemini 3.5 Flash" as const
      }
    ]
  },
  {
    tierName: "Structured Ontologies & Semantic SEO (Tier 3)",
    agents: [
      {
        name: "Entity Agent",
        id: "entity-agent",
        category: "SEO",
        description: "Maps core industry concepts, extracts Wikidata structures, and solidifies contextual graphs.",
        status: "Ready" as const,
        capabilities: ["wikidata_enrichment", "entity_extraction", "semantic_interlinking"],
        callsCount: 2280,
        engine: "Gemini 3.5 Flash" as const
      },
      {
        name: "Schema Agent",
        id: "schema-agent",
        category: "SEO",
        description: "Produces pristine nested JSON-LD objects designed to satisfy target crawler algorithms.",
        status: "Active" as const,
        capabilities: ["JSON_LD_generation", "search_rich_snippets", "schema_validation"],
        callsCount: 1420,
        engine: "Gemini 3.5 Flash" as const
      },
      {
        name: "SEO Audit Agent",
        id: "seo-audit-agent",
        category: "SEO",
        description: "Performs critical on-page compliance verification to suppress legacy overoptimization indexing blocks.",
        status: "Active" as const,
        capabilities: ["compliance_audits", "keyword_stuffing_detection", "density_scoring"],
        callsCount: 2901,
        engine: "Gemini 1.5 Pro" as const
      },
      {
        name: "Internal Link Agent",
        id: "internal-link-agent",
        category: "SEO",
        description: "Generates optimal site routing matrices and plans contextually relevant anchor phrases.",
        status: "Calibrating" as const,
        capabilities: ["link_graph_optimization", "anchor_text_relevance", "crawl_budget_maximization"],
        callsCount: 740,
        engine: "Gemini 3.5 Flash" as const
      }
    ]
  },
  {
    tierName: "Rich Visuals & Production Studio (Tier 4)",
    agents: [
      {
        name: "Thumbnail Agent",
        id: "thumbnail-agent",
        category: "Production",
        description: "Simulates visual attention heatmaps and scores CTR probability parameters.",
        status: "Active" as const,
        capabilities: ["CTR_estimation", "cognitive_contrast", "composition_outline"],
        callsCount: 1423,
        engine: "Custom Pipeline" as const
      },
      {
        name: "Image Prompt Agent",
        id: "image-prompt-agent",
        category: "Production",
        description: "Translates abstract text instructions into high-concept graphic or photograph rendering coordinates.",
        status: "Active" as const,
        capabilities: ["text_to_image_generation", "spatial_composition", "stylistic_coherence"],
        callsCount: 2210,
        engine: "Gemini 3.5 Flash" as const
      },
      {
        name: "Voice Agent",
        id: "voice-agent",
        category: "Production",
        description: "Renders ultra-realistic text voiceovers, aligning cadence rhythms, and tuning accent controls.",
        status: "Ready" as const,
        capabilities: ["tts_voice_direction", "breathing_pause_injection", "emotional_resonance"],
        callsCount: 654,
        engine: "Custom Pipeline" as const
      },
      {
        name: "Video Agent",
        id: "video-agent",
        category: "Production",
        description: "Compiles clip layers, automates audio crossfading, and renders dynamic motion sequences.",
        status: "Optimizing" as const,
        capabilities: ["clip_sequencing", "audio_alignment", "transition_effects"],
        callsCount: 382,
        engine: "Custom Pipeline" as const
      }
    ]
  },
  {
    tierName: "Product QA & Pipeline Launch Operations (Tier 5)",
    agents: [
      {
        name: "QA Agent",
        id: "qa-agent",
        category: "Launch",
        description: "Checks script assertions against real truth logs to prevent hallucinations.",
        status: "Active" as const,
        capabilities: ["fact_checking", "hallucination_prevention", "verification_loops"],
        callsCount: 2341,
        engine: "Gemini 1.5 Pro" as const
      },
      {
        name: "Compliance Agent",
        id: "compliance-agent",
        category: "Launch",
        description: "Detects trademark matches, screens for sensitive phrasing, and aligns brand safety margins.",
        status: "Active" as const,
        capabilities: ["copyright_scans", "brand_rules_alignment", "sensitive_words_scrubby"],
        callsCount: 1810,
        engine: "Gemini 1.5 Pro" as const
      },
      {
        name: "Publishing Agent",
        id: "publishing-agent",
        category: "Launch",
        description: "Coordinates omnichannel queues, identifies high-conversion active slots, and triggers releases.",
        status: "Ready" as const,
        capabilities: ["scheduling_arbitrage", "omnichannel_coordination", "deploy_triggering"],
        callsCount: 1102,
        engine: "Gemini 3.5 Flash" as const
      },
      {
        name: "Analytics Agent",
        id: "analytics-agent",
        category: "Launch",
        description: "Attributes viewer churn points and pipes structural feedback loops into early optimization layers.",
        status: "Active" as const,
        capabilities: ["retention_mapping", "funnel_analysis", "insight_backpropagation"],
        callsCount: 3200,
        engine: "Gemini 3.5 Flash" as const
      }
    ]
  }
];

export const DeveloperDashboard: React.FC = () => {
  const { user } = useAuth();

  const [metrics, setMetrics] = useState<any[]>([]);
  const [sessionLogs, setSessionLogs] = useState<any[]>([]);
  const [logTab, setLogTab] = useState<'performance' | 'navigation' | 'errors'>('performance');

  // Batch Queue States
  const [batchItems, setBatchItems] = useState<any[]>([]);
  const [batchName, setBatchName] = useState('');
  const [batchService, setBatchService] = useState<'Gemini' | 'Veo'>('Gemini');
  const [batchModel, setBatchModel] = useState('gemini-3.5-flash');
  const [batchPrompt, setBatchPrompt] = useState('');
  const [batchSchedule, setBatchSchedule] = useState('offpeak_tonight'); // 'offpeak_tonight', 'offpeak_tomorrow', '1_hour', '3_hours'
  const [costOptimized, setCostOptimized] = useState(true);
  const [isQueuing, setIsQueuing] = useState(false);
  const [isExecutingAll, setIsExecutingAll] = useState(false);
  const [selectedResultItem, setSelectedResultItem] = useState<any | null>(null);

  const fetchAndSyncPerformanceMetrics = () => {
    setMetrics(logger.getMetrics());
    setSessionLogs(logger.getLogs());
  };

  const handleExportLogs = () => {
    try {
      const exportData = {
        exportedAt: new Date().toISOString(),
        buildEnvironment: "Ranktica Production Sandbox",
        metrics: logger.getMetrics(),
        logs: logger.getLogs()
      };
      
      const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `ranktica_telemetry_logs_${Date.now()}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
      toast.success("Telemetry logs exported successfully!");
    } catch (err: any) {
      toast.error(`Export failed: ${err.message || err}`);
    }
  };

  const [cacheStats, setCacheStats] = useState({
    hits: 0,
    misses: 0,
    savedDollars: 0,
    redisActive: false,
    redisConfigured: false,
    engineType: "Loading...",
    keysCount: 0
  });

  const [isClearingCache, setIsClearingCache] = useState(false);

  // Real-time container performance telemetry states
  const [liveRamUsage, setLiveRamUsage] = useState(612); // MB
  const [activeSockets, setActiveSockets] = useState(3);
  const [moduleLoadTimes, setModuleLoadTimes] = useState([
    { name: 'CreatorDashboard', val: 142, status: 'nominal' },
    { name: 'LiveBrainstorm', val: 320, status: 'warning' },
    { name: 'ProjectsHub', val: 185, status: 'nominal' },
    { name: 'CostGovernance', val: 112, status: 'nominal' },
    { name: 'MetadataEngineer', val: 94, status: 'nominal' },
  ]);

  useEffect(() => {
    const timer = setInterval(() => {
      // Fluctuating memory usage
      setLiveRamUsage(prev => {
        const delta = Math.round((Math.random() - 0.5) * 8);
        return Math.max(580, Math.min(720, prev + delta));
      });
      // Fluctuating socket connections
      setActiveSockets(prev => {
        const rand = Math.random();
        if (rand > 0.8) return Math.min(8, prev + 1);
        if (rand < 0.2) return Math.max(2, prev - 1);
        return prev;
      });
      // Fluctuating load times
      setModuleLoadTimes(prev => prev.map(m => {
        const delta = Math.round((Math.random() - 0.5) * 10);
        const newVal = Math.max(40, m.val + delta);
        return {
          ...m,
          val: newVal,
          status: newVal > 250 ? 'warning' : 'nominal'
        };
      }));
    }, 3000);
    return () => clearInterval(timer);
  }, []);

  const fetchCacheStats = async () => {
    try {
      const res = await fetch('/api/cache/stats');
      if (res.ok) {
        const data = await res.json();
        setCacheStats(data);
      }
    } catch (err) {
      console.warn("Failed fetching AI Cache stats:", err);
    }
  };

  const fetchBatchQueue = async () => {
    try {
      const res = await fetch('/api/db/batch-queue');
      if (res.ok) {
        const data = await res.json();
        setBatchItems(data);
      }
    } catch (err) {
      console.warn("Failed fetching Batch Processing Queue:", err);
    }
  };

  const handleQueueBatchItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!batchName.trim() || !batchPrompt.trim()) {
      toast.error("Please provide both a name and a prompt/payload.");
      return;
    }

    setIsQueuing(true);
    try {
      let scheduledTime = Date.now();
      const oneHour = 60 * 60 * 1000;
      if (batchSchedule === 'offpeak_tonight') {
        const d = new Date();
        d.setUTCHours(2, 0, 0, 0);
        if (d.getTime() <= Date.now()) {
          d.setUTCDate(d.getUTCDate() + 1);
        }
        scheduledTime = d.getTime();
      } else if (batchSchedule === 'offpeak_tomorrow') {
        const d = new Date();
        d.setUTCDate(d.getUTCDate() + 1);
        d.setUTCHours(3, 0, 0, 0);
        scheduledTime = d.getTime();
      } else if (batchSchedule === '1_hour') {
        scheduledTime = Date.now() + oneHour;
      } else if (batchSchedule === '3_hours') {
        scheduledTime = Date.now() + (3 * oneHour);
      }

      const res = await fetch('/api/db/batch-queue', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: batchName,
          service: batchService,
          model: batchModel,
          payload: { prompt: batchPrompt },
          scheduled_time: scheduledTime,
          cost_optimized: costOptimized
        })
      });

      if (res.ok) {
        toast.success("Successfully queued cost-optimized API request!");
        setBatchName('');
        setBatchPrompt('');
        fetchBatchQueue();
      } else {
        const errData = await res.json();
        toast.error(`Queueing failed: ${errData.error || 'Unknown error'}`);
      }
    } catch (err: any) {
      toast.error(`Network error: ${err.message || err}`);
    } finally {
      setIsQueuing(false);
    }
  };

  const handleRunBatchItem = async (id: string) => {
    try {
      toast.loading("Invoking batch request on server...", { id });
      const res = await fetch(`/api/db/batch-queue/${id}/run`, { method: 'POST' });
      if (res.ok) {
        toast.success("Batch item successfully processed!", { id });
        fetchBatchQueue();
      } else {
        const errData = await res.json();
        toast.error(`Failed: ${errData.error || 'Execution failure'}`, { id });
      }
    } catch (err: any) {
      toast.error(`Error: ${err.message || err}`, { id });
    }
  };

  const handleRunAllPending = async () => {
    setIsExecutingAll(true);
    const toastId = toast.loading("Processing all pending off-peak batch items...");
    try {
      const res = await fetch('/api/db/batch-queue/run-all', { method: 'POST' });
      if (res.ok) {
        const data = await res.json();
        toast.success(`Successfully processed ${data.processedCount} pending requests!`, { id: toastId });
        fetchBatchQueue();
      } else {
        const errData = await res.json();
        toast.error(`Failed: ${errData.error || 'Failed to run batch queue'}`, { id: toastId });
      }
    } catch (err: any) {
      toast.error(`Error: ${err.message || err}`, { id: toastId });
    } finally {
      setIsExecutingAll(false);
    }
  };

  const handleDeleteBatchItem = async (id: string) => {
    try {
      const res = await fetch(`/api/db/batch-queue/${id}`, { method: 'DELETE' });
      if (res.ok) {
        toast.success("Batch item cancelled & removed.");
        fetchBatchQueue();
        if (selectedResultItem?.id === id) {
          setSelectedResultItem(null);
        }
      } else {
        toast.error("Failed to cancel batch item.");
      }
    } catch (err: any) {
      toast.error(`Network error: ${err.message || err}`);
    }
  };

  useEffect(() => {
    if (batchService === 'Gemini') {
      setBatchModel('gemini-3.5-flash');
    } else {
      setBatchModel('veo-3.1-lite-generate-preview');
    }
  }, [batchService]);

  useEffect(() => {
    fetchCacheStats();
    fetchAndSyncPerformanceMetrics();
    fetchBatchQueue();
    const interval = setInterval(() => {
      fetchCacheStats();
      fetchAndSyncPerformanceMetrics();
      fetchBatchQueue();
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  const handleClearCache = async () => {
    setIsClearingCache(true);
    try {
      const res = await fetch('/api/cache/clear', { method: 'POST' });
      if (res.ok) {
        await fetchCacheStats();
        toast.success("AI cost-optimization cache flushed successfully!");
      } else {
        toast.error("Failed to clear AI request cache.");
      }
    } catch (err) {
      console.error(err);
      toast.error("Network error while clearing cache.");
    } finally {
      setIsClearingCache(false);
    }
  };
  
  // Trace Simulator state
  const [customQuery, setCustomQuery] = useState(PRESET_SIMULATIONS[0].query);
  const [activeSimulation, setActiveSimulation] = useState<SimulationPreset>(PRESET_SIMULATIONS[0]);
  const [simStep, setSimStep] = useState<number>(-1);
  const [isSimulating, setIsSimulating] = useState<boolean>(false);
  const [traceLogs, setTraceLogs] = useState<string[]>([]);

  // Cognitive Agent Registry interface & states
  interface AgentDef {
    id: string;
    capabilities: string[];
    status: 'Active' | 'Testing' | 'Idle';
    registeredAt: string;
    callsCount: number;
  }

  const [agents, setAgents] = useState<AgentDef[]>([
    {
      id: 'seo-agent',
      capabilities: ['keyword_research', 'entity_extraction', 'seo_optimization'],
      status: 'Active',
      registeredAt: '2026-05-30T18:19:36Z',
      callsCount: 342,
    },
    {
      id: 'hook-agent',
      capabilities: ['viral_ideation', 'pacing_analysis', 'psychological_hooks'],
      status: 'Active',
      registeredAt: '2026-05-29T10:14:22Z',
      callsCount: 198,
    },
    {
      id: 'script-agent',
      capabilities: ['narration_screenplay', 'pacing_rules', 'visual_outline'],
      status: 'Active',
      registeredAt: '2026-05-28T14:45:00Z',
      callsCount: 456,
    },
    {
      id: 'thumbnail-planner',
      capabilities: ['art_direction', 'CTR_prediction', 'composition_outline'],
      status: 'Active',
      registeredAt: '2026-05-29T08:12:11Z',
      callsCount: 221,
    }
  ]);

  const [registerInput, setRegisterInput] = useState<string>(
    JSON.stringify({
      id: "seo-agent",
      capabilities: [
        "keyword_research",
        "entity_extraction",
        "seo_optimization"
      ]
    }, null, 2)
  );
  const [jsonError, setJsonError] = useState<string | null>(null);
  const [registryLogs, setRegistryLogs] = useState<string[]>([
    `[${new Date().toLocaleTimeString()}] System booted. Loaded 4 active high-perf agent profiles.`,
    `[${new Date().toLocaleTimeString()}] Standby for developer specs registration.`
  ]);

  const handleRegisterAgent = () => {
    try {
      setJsonError(null);
      const parsed = JSON.parse(registerInput);
      if (!parsed.id || typeof parsed.id !== 'string') {
        throw new Error('Agent specification requires an "id" string attribute.');
      }
      if (!parsed.capabilities || !Array.isArray(parsed.capabilities)) {
        throw new Error('Agent specification requires an array of "capabilities".');
      }
      
      const newAgent: AgentDef = {
        id: parsed.id,
        capabilities: parsed.capabilities.map((c: any) => String(c)),
        status: 'Active',
        registeredAt: new Date().toISOString(),
        callsCount: 0
      };

      setAgents(prev => {
        // Replace existing agent with matching ID, or insert new one
        const filtered = prev.filter(a => a.id !== newAgent.id);
        return [newAgent, ...filtered];
      });

      setRegistryLogs(prev => [
        `[${new Date().toLocaleTimeString()}] REGISTERED Agent Specifications ID "${newAgent.id}"!`,
        `  -> Active Capabilities: [${newAgent.capabilities.join(', ')}]`,
        ...prev
      ]);
    } catch (e: any) {
      setJsonError(e.message || 'Syntax error inside JSON payload.');
      setRegistryLogs(prev => [
        `[${new Date().toLocaleTimeString()}] EXCEPTION: Failed registering agent specification`,
        `  -> Reason: ${e.message || 'Syntax error'}`,
        ...prev
      ]);
    }
  };

  const handleSelectSpecialAgent = (agent: any) => {
    setRegisterInput(JSON.stringify({
      id: agent.id,
      capabilities: agent.capabilities,
      engine: agent.engine,
      status: agent.status
    }, null, 2));
    
    setRegistryLogs(prev => [
      `[${new Date().toLocaleTimeString()}] Dynamic Spec populated: "${agent.name}"`,
      `  -> ID: "${agent.id}" | Ready to register.`,
      `  -> Capabilities: [${agent.capabilities.join(', ')}]`,
      ...prev
    ]);
  };

  const tokenData = [
    { name: 'Repurpose', val: 45 },
    { name: 'SEO Index', val: 22 },
    { name: 'Video Ops', val: 89 },
    { name: 'Outreach', val: 34 },
    { name: 'Research', val: 12 },
  ];

  const handleSelectPreset = (preset: SimulationPreset) => {
    if (isSimulating) return;
    setActiveSimulation(preset);
    setCustomQuery(preset.query);
    setSimStep(-1);
    setTraceLogs([]);
  };

  const handleTriggerSimulation = () => {
    if (isSimulating) return;
    setIsSimulating(true);
    setSimStep(0);
    setTraceLogs(["[Trace Init] Dispatching raw developer query...", `[Query Input] "${customQuery}"`]);

    let stepCounter = 0;
    const interval = setInterval(() => {
      stepCounter++;
      setSimStep(stepCounter);

      if (stepCounter === 1) {
        setTraceLogs(prev => [
          ...prev, 
          `[Context assembler] Starting context unification across 6 key modules...`,
          `  -> Fetched: [Project Context] (Title: "${activeSimulation.contextAssembled.project}")`,
          `  -> Fetched: [User Profile] (Identified: "${user?.email || 'joinranktica@gmail.com'}")`,
          `  -> Fetched: [Subscription Plan] (Identified: "Enterprise Scale Tier")`,
          `  -> Fetched: [SEO Framework] (Applied schema structures for "${activeSimulation.contextAssembled.tone}")`,
          `  -> Fetched: [Historical Outputs] (Extracted past engagement benchmarks)`,
          `  -> Fetched: [Knowledge Base] (Analyzed domain-specific parameters)`,
          `[Context Assembled] Metadata compiled successfully! Preventing blind agent routing.`
        ]);
      } else if (stepCounter === 2) {
        setTraceLogs(prev => [...prev, `[Agent Router] Matches routing query with assembled context. Selected: ${activeSimulation.router}`]);
      } else if (stepCounter === 3) {
        setTraceLogs(prev => [...prev, `[Intent Classification] Target detected: ${activeSimulation.intentCode}`, `[Classification Label] ${activeSimulation.intent}`]);
      } else if (stepCounter === 4) {
        setTraceLogs(prev => [...prev, `[Decision Engine] Generating workflow dependency path. Output: ${activeSimulation.decision}`]);
      } else if (stepCounter === 5) {
        setTraceLogs(prev => [...prev, `[Execution Manager] Resolving AI model execution criteria. Details: ${activeSimulation.execution}`]);
      } else if (stepCounter === 6) {
        setTraceLogs(prev => [...prev, `[Aggregation Layer] Running validators, checking file separators and schema alignment.`]);
        // Append specific decoupling trace steps
        activeSimulation.outputs.forEach(log => {
          setTraceLogs(prev => [...prev, log]);
        });
      } else if (stepCounter === 7) {
        setTraceLogs(prev => [...prev, `[Compilation] Real-time compilation complete. Payload ready.`, `[Trace Success] Executed loop trace in total latency criteria.`]);
        setIsSimulating(false);
        clearInterval(interval);
      }
    }, 1200);
  };

  const apiMetrics = metrics.filter(m => m.name.startsWith('api-latency-'));
  const navMetrics = metrics.filter(m => m.name.startsWith('navigate-'));
  
  const avgApiLatency = apiMetrics.length > 0
    ? (apiMetrics.reduce((sum, item) => sum + item.value, 0) / apiMetrics.length).toFixed(1) + 'ms'
    : 'No API calls';

  const avgNavTime = navMetrics.length > 0
    ? (navMetrics.reduce((sum, item) => sum + item.value, 0) / navMetrics.length).toFixed(1) + 'ms'
    : 'No nav timing';

  // Calculate dynamic local storage usage
  const getLocalStorageUsage = () => {
    let totalBytes = 0;
    let hookKeysCount = 0;
    try {
      for (let i = 0; i < window.localStorage.length; i++) {
        const key = window.localStorage.key(i);
        if (key && (key.startsWith('ranktica_') || key.startsWith('ranktica-') || key.includes('script') || key.includes('idea'))) {
          const val = window.localStorage.getItem(key) || '';
          totalBytes += (key.length + val.length) * 2;
          hookKeysCount++;
        }
      }
    } catch (e) {
      console.warn(e);
    }
    return {
      bytes: totalBytes,
      kb: parseFloat((totalBytes / 1024).toFixed(3)),
      keys: hookKeysCount
    };
  };

  const lsUsage = getLocalStorageUsage();
  const actualAvgApiLatency = apiMetrics.length > 0
    ? (apiMetrics.reduce((sum, item) => sum + item.value, 0) / apiMetrics.length)
    : 412.8;

  return (
    <div className="space-y-8 animate-fade-in pb-10 font-sans">
      <header className="flex justify-between items-center">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-zinc-500 mb-1">
             <Terminal size={14} />
             <span className="text-[10px] font-bold uppercase tracking-widest">Automation Console</span>
          </div>
          <h2 className="text-3xl font-bold text-white">Developer Engine</h2>
        </div>
        <div className="flex gap-2">
           <div className="flex items-center gap-2 px-3 py-1 bg-[#121214] border border-zinc-800 rounded-lg">
              <Activity size={12} className="text-green-500 animate-pulse" />
              <span className="text-[10px] font-bold text-zinc-400 font-mono">API STATUS: OPERATIONAL</span>
           </div>
        </div>
      </header>

      {/* Real-Time System Health Dashboard Module */}
      <SystemHealthDashboard />

      {/* D3-based dependency graph module coupling visualizer */}
      <ModuleDependencyGraph />

      {/* Recharts-based AI API Health metrics visualizer & Centralized Rate Limiter Status */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          <ApiHealthDashboard />
        </div>
        <div>
          <RateLimitingStatus />
        </div>
      </div>

      {/* Real-time API Router Health & Latency status widget (synchronized with mock mode) */}
      <ApiHealthStatusWidget />

      {/* Dynamic Theme Design Workshop Component */}
      <ThemeWorkshop />

      {/* Real-time System Performance Widget */}
      <div className="bg-[#121214] border border-zinc-800 rounded-2xl p-6 relative overflow-hidden" id="realtime-perf-widget">
        <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-600/5 rounded-full blur-3xl"></div>
        
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-zinc-850 pb-4 mb-6 relative z-10">
          <div>
            <h3 className="text-base font-extrabold text-white flex items-center gap-2">
              <Zap className="text-indigo-400 animate-pulse" size={18} />
              Real-time Host Performance Engine
            </h3>
            <p className="text-[10px] text-zinc-500 mt-1">
              Active telemetry monitoring container resources, socket protocols, and individual file registry loads.
            </p>
          </div>
          <span className="flex items-center gap-1.5 text-[9px] font-mono font-black text-indigo-400 uppercase bg-indigo-500/10 border border-indigo-500/20 px-3 py-1 rounded-full tracking-widest animate-pulse">
            <span className="w-1.5 h-1.5 rounded-full bg-indigo-500"></span> Live Telemetry Feed
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 relative z-10">
          
          {/* Card 1: Memory Metrics */}
          <div className="bg-zinc-950/40 border border-zinc-850 p-4 rounded-xl space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-mono font-bold text-zinc-400 uppercase tracking-wider flex items-center gap-1.5">
                <Layers size={13} className="text-zinc-500" /> RSS Memory Allocation
              </span>
              <span className="text-[9px] font-mono font-bold text-green-500">NOMINAL</span>
            </div>
            <div className="space-y-1">
              <div className="flex justify-between items-baseline">
                <span className="text-2xl font-black text-white font-mono">{liveRamUsage} MB</span>
                <span className="text-[9px] text-zinc-500 font-mono">/ 1024 MB Limit</span>
              </div>
              <div className="w-full bg-zinc-900 h-1.5 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-indigo-500 transition-all duration-700"
                  style={{ width: `${(liveRamUsage / 1024) * 100}%` }}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2 text-[8.5px] font-mono text-zinc-500">
              <div className="bg-zinc-950/60 p-1.5 rounded border border-zinc-900">
                <span className="block text-[8px] uppercase font-black text-zinc-650">Heap Total</span>
                <span className="text-zinc-350 font-bold">342.5 MB</span>
              </div>
              <div className="bg-zinc-950/60 p-1.5 rounded border border-zinc-900">
                <span className="block text-[8px] uppercase font-black text-zinc-650">Heap Used</span>
                <span className="text-zinc-350 font-bold">184.2 MB</span>
              </div>
            </div>
          </div>

          {/* Card 2: Average Load Times of Key Modules */}
          <div className="bg-zinc-950/40 border border-zinc-850 p-4 rounded-xl space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-mono font-bold text-zinc-400 uppercase tracking-wider flex items-center gap-1.5">
                <Clock size={13} className="text-zinc-500" /> Module Initialization
              </span>
              <span className="text-[8px] font-mono font-bold text-zinc-550 uppercase">Target: &lt;250ms</span>
            </div>
            <div className="space-y-1.5 max-h-24 overflow-y-auto pr-1 custom-scrollbar">
              {moduleLoadTimes.map((m) => (
                <div key={m.name} className="flex items-center justify-between text-[10px] font-mono py-0.5 border-b border-zinc-900/40 last:border-0">
                  <span className="text-zinc-400">{m.name}</span>
                  <div className="flex items-center gap-1.5">
                    <span className={`font-bold ${m.status === 'warning' ? 'text-orange-400' : 'text-emerald-400'}`}>
                      {m.val}ms
                    </span>
                    <span className={`w-1.5 h-1.5 rounded-full ${m.status === 'warning' ? 'bg-orange-400 animate-pulse' : 'bg-emerald-400'}`}></span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Card 3: Active Sockets and Streaming Ports */}
          <div className="bg-zinc-950/40 border border-zinc-850 p-4 rounded-xl space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-mono font-bold text-zinc-400 uppercase tracking-wider flex items-center gap-1.5">
                <Repeat size={13} className="text-zinc-500" /> Active Sockets
              </span>
              <span className="text-[9px] font-mono font-bold text-indigo-400 animate-pulse">SECURE PROTOCOL</span>
            </div>
            <div className="space-y-1">
              <div className="text-2xl font-black text-white font-mono">{activeSockets} Channels</div>
              <p className="text-[9px] text-zinc-500 leading-tight">
                Persisted TCP sockets mapping Multimodal Audio, Telemetry logs, and real-time project collaborations.
              </p>
            </div>
            <div className="bg-zinc-950/80 px-2 py-1.5 rounded-lg border border-zinc-900/60 flex items-center justify-between text-[8px] font-mono">
              <span className="text-zinc-500">WS GATEWAY</span>
              <span className="text-emerald-400 font-bold uppercase flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span> CONNECTED
              </span>
            </div>
          </div>

        </div>
      </div>

      {/* Tech Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-[#121214] border border-zinc-800 p-6 rounded-2xl border-l-4 border-l-blue-500">
           <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-1">Monthly Tokens</p>
           <p className="text-3xl font-bold text-white">482K</p>
           <p className="text-[10px] text-zinc-600 mt-2">Utilization: 48%</p>
        </div>
        <div className="bg-[#121214] border border-zinc-800 p-6 rounded-2xl border-l-4 border-l-purple-500">
           <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-1">Decoupled Files</p>
           <p className="text-3xl font-bold text-white">124 items</p>
           <p className="text-[10px] text-zinc-600 mt-2">Isolated from Relational Rows</p>
        </div>
        <div className="bg-[#121214] border border-zinc-800 p-6 rounded-2xl border-l-4 border-l-green-500">
           <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-1">Avg API Latency</p>
           <p className="text-3xl font-bold text-white font-mono">{avgApiLatency}</p>
           <p className="text-[10px] text-zinc-600 mt-2">Navigation load: {avgNavTime}</p>
        </div>
        <div className="bg-[#121214] border border-zinc-800 p-6 rounded-2xl border-l-4 border-l-yellow-500">
           <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-1">Active Hooks</p>
           <p className="text-3xl font-bold text-white">14</p>
           <p className="text-[10px] text-zinc-600 mt-2">Real-time Listeners</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Token Distribution Chart */}
        <div className="lg:col-span-2 bg-[#121214] border border-zinc-800 rounded-2xl p-6 relative overflow-hidden">
           <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/5 rounded-full blur-3xl"></div>
           <h3 className="text-lg font-bold text-white mb-8 flex items-center gap-2 relative z-10">
             <Database size={20} className="text-blue-500" /> Resource Allocation
           </h3>
           <div className="h-64 relative z-10">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={tokenData} layout="vertical" margin={{ left: -20 }}>
                  <XAxis type="number" hide />
                  <YAxis dataKey="name" type="category" stroke="#52525b" fontSize={10} axisLine={false} tickLine={false} />
                  <Tooltip 
                    cursor={{ fill: '#18181b' }}
                    contentStyle={{ backgroundColor: '#09090b', border: '1px solid #27272a', borderRadius: '8px' }}
                  />
                  <Bar dataKey="val" radius={[0, 4, 4, 0]}>
                     {tokenData.map((entry, index) => (
                       <Cell key={`cell-${index}`} fill={index % 2 === 0 ? '#ef4444' : '#f97316'} />
                     ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
           </div>
        </div>

         {/* Live Performance Telemetry & Logs */}
         <div className="lg:col-span-2 bg-[#121214] border border-zinc-800 rounded-2xl p-6 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-green-500/5 rounded-full blur-3xl"></div>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 relative z-10">
               <div>
                 <h3 className="text-lg font-bold text-white flex items-center gap-2">
                   <Activity size={20} className="text-green-500 animate-pulse" /> Telemetry & System Logs
                 </h3>
                 <p className="text-[10px] text-zinc-500 mt-1">
                   Inspect real-time API latency values, user transitions, and registered runtime exceptions.
                 </p>
               </div>
               <div className="flex items-center gap-2">
                 <button 
                   onClick={fetchAndSyncPerformanceMetrics}
                   className="text-[10px] font-mono hover:text-zinc-350 text-zinc-400 flex items-center gap-1.5 bg-zinc-950 px-2.5 py-1.5 rounded-lg border border-zinc-800 cursor-pointer hover:border-zinc-700 transition"
                 >
                   <RefreshCw size={10} className="animate-spin-slow" /> Sync
                 </button>
                 <button 
                   onClick={handleExportLogs}
                   className="text-[10px] font-bold text-white flex items-center gap-1.5 bg-red-600 hover:bg-red-500 px-3 py-1.5 rounded-lg cursor-pointer transition-colors shadow-md shadow-red-950/20"
                 >
                   <Share2 size={10} /> Export JSON
                 </button>
               </div>
            </div>

            {/* Tab selection */}
            <div className="flex bg-zinc-950 p-1 rounded-xl border border-zinc-900 mb-4 xl:max-w-md relative z-10">
              <button
                type="button"
                onClick={() => setLogTab('performance')}
                className={`flex-1 py-1.5 text-[9px] font-black uppercase tracking-wider rounded-lg transition-colors cursor-pointer ${
                  logTab === 'performance' ? 'bg-[#121214] text-white border border-zinc-805' : 'text-zinc-550 hover:text-zinc-300'
                }`}
              >
                Performance ({metrics.filter(m => !m.name.startsWith('navigation-') && !m.name.startsWith('navigate-')).length})
              </button>
              <button
                type="button"
                onClick={() => setLogTab('navigation')}
                className={`flex-1 py-1.5 text-[9px] font-black uppercase tracking-wider rounded-lg transition-colors cursor-pointer ${
                  logTab === 'navigation' ? 'bg-[#121214] text-white border border-zinc-805' : 'text-zinc-550 hover:text-zinc-300'
                }`}
              >
                Navigation ({metrics.filter(m => m.name.startsWith('navigation-') || m.name.startsWith('navigate-')).length})
              </button>
              <button
                type="button"
                onClick={() => setLogTab('errors')}
                className={`flex-1 py-1.5 text-[9px] font-black uppercase tracking-wider rounded-lg transition-colors cursor-pointer ${
                  logTab === 'errors' ? 'bg-[#121214] text-white border border-zinc-805' : 'text-zinc-550 hover:text-zinc-300'
                }`}
              >
                Logs/Errors ({sessionLogs.length})
              </button>
            </div>
            
            <div className="space-y-4 max-h-[350px] overflow-y-auto pr-1 relative z-10 scrollbar-thin scrollbar-thumb-zinc-800">
              {logTab === 'performance' ? (
                metrics.filter(m => !m.name.startsWith('navigation-') && !m.name.startsWith('navigate-')).length === 0 ? (
                  <div className="text-center py-12 text-zinc-650 text-xs font-mono">
                    No API or engine performance metrics logged in this session yet.
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full font-mono text-xs text-zinc-300">
                      <thead>
                        <tr className="border-b border-zinc-800 text-zinc-500 text-left pb-2">
                          <th className="font-bold uppercase pb-2 text-[10px]">Timestamp</th>
                          <th className="font-bold uppercase pb-2 text-[10px]">Metric Name</th>
                          <th className="font-bold uppercase pb-2 text-right text-[10px]">Latency</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-zinc-900/40">
                        {metrics.filter(m => !m.name.startsWith('navigation-') && !m.name.startsWith('navigate-')).map((metric, i) => (
                          <tr key={i} className="hover:bg-zinc-900/10 transition-colors">
                            <td className="py-2.5 text-[10px] text-zinc-500">
                              {new Date(metric.timestamp).toLocaleTimeString()}
                            </td>
                            <td className="py-2.5 font-bold text-zinc-200">
                              {metric.name}
                            </td>
                            <td className="py-2.5 text-right font-semibold text-emerald-400">
                              {metric.value.toFixed(1)} ms
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )
              ) : logTab === 'navigation' ? (
                <div className="space-y-4">
                  {/* Tool switches */}
                  <div className="border border-zinc-800/80 bg-zinc-950/40 rounded-xl p-4 space-y-3">
                    <span className="text-[9px] font-black uppercase tracking-widest text-zinc-500 block font-sans">Tool Switching Latency (Active measurement)</span>
                    {metrics.filter(m => m.name.startsWith('navigate-')).length === 0 ? (
                      <p className="text-[10px] text-zinc-550 font-mono">No switching events measured yet. Switch views to gather latency data.</p>
                    ) : (
                      <div className="space-y-2">
                        {metrics.filter(m => m.name.startsWith('navigate-')).map((m, idx) => (
                          <div key={idx} className="flex justify-between items-center text-[11px] font-mono border-b border-zinc-900/40 pb-1.5">
                            <span className="text-zinc-350 font-bold uppercase tracking-wider">{m.name.replace('navigate-', '')} Switch</span>
                            <span className="text-emerald-400 font-semibold">{m.value.toFixed(1)} ms</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Browser Performance Timing */}
                  <div className="border border-zinc-800/80 bg-zinc-950/40 rounded-xl p-4 space-y-3">
                    <span className="text-[9px] font-black uppercase tracking-widest text-zinc-500 block font-sans">Navigation Timing API Milestones (Real browser load)</span>
                    <div className="space-y-2 font-mono text-[11px]">
                      {[
                        { label: 'DNS Name Lookup Duration', key: 'navigation-dns-lookup' },
                        { label: 'TCP Handshake Connection', key: 'navigation-tcp-connect' },
                        { label: 'DOM Interactive Processing', key: 'navigation-dom-interactive' },
                        { label: 'Initial Page Load Duration', key: 'navigation-initial-load-duration' }
                      ].map((timing, idx) => {
                        const m = metrics.find(item => item.name === timing.key);
                        return (
                          <div key={idx} className="flex justify-between items-center border-b border-zinc-900/40 pb-1.5">
                            <span className="text-zinc-400">{timing.label}</span>
                            <span className={m ? 'text-red-400 font-bold' : 'text-zinc-600'}>
                              {m ? `${m.value.toFixed(1)} ms` : 'Standby / Pre-cached'}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              ) : (
                sessionLogs.length === 0 ? (
                  <div className="text-center py-12 text-zinc-650 text-xs font-mono">
                    No warnings or exceptions logged in this session yet. High-priority errors and warnings will record here automatically.
                  </div>
                ) : (
                  <div className="space-y-2 font-mono">
                    {sessionLogs.map((log, i) => {
                      const levelColors = {
                        info: 'text-blue-400 bg-blue-500/5 border-blue-500/10',
                        warn: 'text-amber-400 bg-amber-500/5 border-amber-500/10',
                        error: 'text-red-400 bg-red-500/5 border-red-500/10',
                        metric: 'text-emerald-400 bg-emerald-500/5 border-emerald-500/10'
                      };
                      return (
                        <div key={i} className={`p-3 rounded-lg border text-[11px] leading-relaxed relative ${levelColors[log.level as 'info'] || 'text-zinc-350 bg-zinc-950 border-zinc-900'}`}>
                          <div className="flex justify-between items-center mb-1 text-[9px] opacity-70">
                            <span className="font-bold uppercase tracking-wider">[{log.level}]</span>
                            <span>{new Date(log.timestamp).toLocaleTimeString()}</span>
                          </div>
                          <div className="text-zinc-200 select-all">{log.message}</div>
                          {log.context && (
                            <pre className="mt-1.5 p-1 bg-black/45 rounded text-[9px] text-zinc-500 overflow-x-auto max-h-20 select-all font-mono leading-tight">
                              {JSON.stringify(log.context, null, 2)}
                            </pre>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )
              )}
            </div>
         </div>

        {/* Documentation & Quick Actions */}
        <div className="space-y-6">
           <div className="bg-[#121214] border border-zinc-800 rounded-2xl p-6">
              <h3 className="text-sm font-bold text-white mb-4 flex items-center gap-2">
                <Code size={16} /> Engineering Links
              </h3>
              <div className="space-y-2">
                 {[
                   { label: 'API Reference', url: 'https://ai.google.dev' },
                   { label: 'SDK Examples', url: '#' },
                   { label: 'Veo Webhooks', url: '#' },
                 ].map((link, i) => (
                   <a key={i} href={link.url} target="_blank" rel="noreferrer" className="flex items-center justify-between p-3 bg-zinc-950 border border-zinc-800 rounded-lg hover:border-zinc-650 transition-all text-xs text-zinc-400 hover:text-white">
                      {link.label}
                      <ExternalLink size={12} />
                   </a>
                 ))}
              </div>
           </div>

           {/* Redis Cost-Optimizer Console Panel */}
           <div className="bg-[#121214] border border-zinc-800 rounded-2xl p-6 relative overflow-hidden shadow-lg">
              <div className="absolute top-0 right-0 w-32 h-32 bg-red-500/5 rounded-full blur-2xl"></div>
              <h3 className="text-sm font-bold text-white mb-4 flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <Zap size={16} className={cacheStats.redisActive ? "text-emerald-400" : "text-amber-500 animate-pulse"} /> 
                  Redis Cache Optimizer
                </span>
                <span className={`text-[8px] tracking-wider px-2 py-0.5 rounded font-mono font-black uppercase border ${
                  cacheStats.redisActive 
                    ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" 
                    : "bg-amber-500/10 text-amber-500 border-amber-500/20"
                }`}>
                  {cacheStats.redisActive ? "Active" : "Local Engine"}
                </span>
              </h3>

              <div className="grid grid-cols-2 gap-3 mb-4">
                <div className="bg-zinc-950 border border-zinc-900 rounded-xl p-3 text-center">
                  <span className="text-[10px] font-mono text-zinc-500 font-bold block uppercase tracking-wider mb-0.5">Hits</span>
                  <span className="text-xl font-black text-emerald-400 font-mono tracking-tight">{cacheStats.hits}</span>
                </div>
                <div className="bg-zinc-950 border border-zinc-900 rounded-xl p-3 text-center">
                  <span className="text-[10px] font-mono text-zinc-500 font-bold block uppercase tracking-wider mb-0.5 font-sans">AI Saved</span>
                  <span className="text-xl font-black text-white font-mono tracking-tight">${cacheStats.savedDollars.toFixed(4)}</span>
                </div>
              </div>

              <div className="space-y-2 font-mono text-[10px]">
                <div className="flex justify-between items-center bg-zinc-950/40 p-2.5 rounded border border-zinc-900">
                  <span className="text-zinc-500 font-medium">Cache Layer:</span>
                  <span className="text-zinc-300 font-bold">{cacheStats.engineType}</span>
                </div>
                <div className="flex justify-between items-center bg-zinc-950/40 p-2.5 rounded border border-zinc-900">
                  <span className="text-zinc-500 font-medium">Cache Misses:</span>
                  <span className="text-zinc-400">{cacheStats.misses}</span>
                </div>
                <div className="flex justify-between items-center bg-zinc-950/40 p-2.5 rounded border border-zinc-900">
                  <span className="text-zinc-500 font-medium font-sans">Redis URL:</span>
                  <span className={`font-bold ${cacheStats.redisConfigured ? "text-emerald-500" : "text-amber-500"}`}>
                    {cacheStats.redisConfigured ? "Detected" : "Unconfigured"}
                  </span>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-zinc-800/40">
                <button 
                  onClick={handleClearCache}
                  disabled={isClearingCache}
                  className="w-full bg-zinc-950 hover:bg-zinc-900 border border-zinc-800 hover:border-zinc-700 text-white text-xs py-2 rounded-lg font-bold flex items-center justify-center gap-2 font-sans transition disabled:opacity-50 cursor-pointer"
                >
                  <RefreshCw size={12} className={isClearingCache ? "animate-spin text-red-500" : "text-zinc-400"} />
                  {isClearingCache ? "Flushing Cache..." : "Flush Neural Cache"}
                </button>
              </div>
           </div>

           <div className="bg-[#121214] border border-zinc-800 rounded-2xl p-6">
              <h3 className="text-sm font-bold text-white mb-4 flex items-center gap-2">
                <Zap size={16} className="text-yellow-500" /> Auto-Scheduler
              </h3>
              <div className="space-y-4">
                 <div className="flex items-center justify-between">
                    <span className="text-xs text-zinc-400">Repurpose Job #104</span>
                    <span className="text-[10px] bg-green-500/20 text-green-500 px-2 py-0.5 rounded font-bold uppercase">Success</span>
                 </div>
                 <div className="flex items-center justify-between">
                    <span className="text-xs text-zinc-400">Audit Cron #082</span>
                    <span className="text-[10px] bg-blue-500/20 text-blue-500 px-2 py-0.5 rounded font-bold uppercase font-mono">Running</span>
                 </div>
                 <div className="pt-2">
                    <button className="w-full bg-zinc-800 hover:bg-zinc-700 text-white text-xs py-2 rounded-lg font-bold flex items-center justify-center gap-2 font-sans transition">
                       <Server size={14} /> Open Pipeline Manager
                    </button>
                 </div>
              </div>
           </div>
        </div>
      </div>

      {/* ENTERPRISE BATCH PROCESSING QUEUE */}
      <div id="batch-processing-queue" className="bg-[#121214] border border-zinc-800 rounded-2xl p-6 relative overflow-hidden shadow-xl space-y-6">
        <div className="absolute top-0 right-0 w-96 h-96 bg-red-500/[0.01] rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-indigo-500/[0.01] rounded-full blur-3xl"></div>

        <header className="flex flex-col md:flex-row md:items-center justify-between pb-4 border-b border-zinc-800/60 gap-4">
          <div>
            <h3 className="text-lg font-black text-white flex items-center gap-2">
              <Clock size={20} className="text-red-500 animate-pulse" /> Off-Peak Batch Request Scheduler
            </h3>
            <p className="text-zinc-400 text-xs mt-1">
              Queue, schedule, and automate bulk API requests for Gemini Text & Veo Video services. Optimize outbound pipeline costs by 40% during off-peak scheduling windows.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleRunAllPending}
              disabled={isExecutingAll || batchItems.filter(item => item.status === 'Pending').length === 0}
              className="bg-zinc-950 hover:bg-zinc-900 border border-zinc-800 hover:border-zinc-700 text-white font-bold py-2 px-4 rounded-lg text-xs tracking-wider uppercase transition flex items-center gap-2 disabled:opacity-40 cursor-pointer"
            >
              <Zap size={13} className="text-amber-400" />
              <span>Simulate Off-Peak Release</span>
            </button>
            <span className="text-[10px] bg-red-500/10 text-red-500 border border-red-500/25 px-2.5 py-1.5 rounded font-mono font-bold tracking-wider">
              {batchItems.length} ITEMS QUEUED
            </span>
          </div>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left specification form terminal */}
          <div className="bg-zinc-950 border border-zinc-900 rounded-xl p-5 flex flex-col justify-between space-y-4">
            <form onSubmit={handleQueueBatchItem} className="space-y-4">
              <div className="flex justify-between items-center pb-1.5 border-b border-zinc-900">
                <span className="text-[10px] font-mono tracking-wider text-zinc-500 uppercase">New Request Specifications</span>
                <span className="text-[9px] font-mono bg-zinc-900 text-red-400 px-1.5 py-0.5 rounded">Bulk Config</span>
              </div>

              <div className="space-y-3">
                {/* Request Name */}
                <div>
                  <label className="text-[10px] font-mono text-zinc-400 block mb-1">Task/Request Identifier</label>
                  <input
                    type="text"
                    required
                    value={batchName}
                    onChange={e => setBatchName(e.target.value)}
                    className="w-full bg-[#08080a] px-3 py-2 text-xs font-mono text-zinc-300 border border-zinc-800/60 rounded-lg focus:outline-none focus:border-red-500 transition-colors"
                    placeholder="e.g. SEO_Bulk_Competitor_Analysis"
                  />
                </div>

                {/* Service type & Model Selection */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[10px] font-mono text-zinc-400 block mb-1">Target Service</label>
                    <select
                      value={batchService}
                      onChange={e => setBatchService(e.target.value as 'Gemini' | 'Veo')}
                      className="w-full bg-[#08080a] px-2.5 py-2 text-xs font-mono text-zinc-300 border border-zinc-800/60 rounded-lg focus:outline-none focus:border-red-500 transition-colors cursor-pointer"
                    >
                      <option value="Gemini">Gemini (Text)</option>
                      <option value="Veo">Veo (Video)</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-[10px] font-mono text-zinc-400 block mb-1">Target Model</label>
                    <input
                      type="text"
                      readOnly
                      value={batchModel}
                      className="w-full bg-zinc-900/60 px-2.5 py-2 text-[10px] font-mono text-zinc-500 border border-zinc-800/60 rounded-lg select-none"
                    />
                  </div>
                </div>

                {/* Payload input */}
                <div>
                  <label className="text-[10px] font-mono text-zinc-400 block mb-1">
                    {batchService === 'Gemini' ? 'Inference Prompt' : 'Video Scene Prompt'}
                  </label>
                  <textarea
                    required
                    value={batchPrompt}
                    onChange={e => setBatchPrompt(e.target.value)}
                    className="w-full h-24 bg-[#08080a] p-3 text-xs font-mono text-zinc-300 border border-zinc-800/60 rounded-lg focus:outline-none focus:border-red-500 transition-colors resize-none"
                    placeholder={
                      batchService === 'Gemini' 
                        ? "Define your smart prompt here. E.g. \"Write a structured marketing plan for a fitness brand...\""
                        : "Describe the video scene. E.g. \"A futuristic cyberpunk city at dusk with neon lights...\""
                    }
                  />
                </div>

                {/* Scheduling */}
                <div>
                  <label className="text-[10px] font-mono text-zinc-400 block mb-1">Execution Window</label>
                  <select
                    value={batchSchedule}
                    onChange={e => setBatchSchedule(e.target.value)}
                    className="w-full bg-[#08080a] px-2.5 py-2 text-xs font-mono text-zinc-300 border border-zinc-800/60 rounded-lg focus:outline-none focus:border-red-500 transition-colors cursor-pointer"
                  >
                    <option value="offpeak_tonight">Tonight 02:00 AM UTC (Off-Peak - Save 40%)</option>
                    <option value="offpeak_tomorrow">Tomorrow 03:00 AM UTC (Off-Peak - Save 40%)</option>
                    <option value="1_hour">Delay: 1 Hour</option>
                    <option value="3_hours">Delay: 3 Hours</option>
                  </select>
                </div>

                {/* Cost Optimized toggle */}
                <div className="flex items-center gap-2 pt-1">
                  <input
                    type="checkbox"
                    id="costOptimized"
                    checked={costOptimized}
                    onChange={e => setCostOptimized(e.target.checked)}
                    className="rounded border-zinc-800 bg-[#08080a] text-red-600 focus:ring-red-500 cursor-pointer h-4 w-4"
                  />
                  <label htmlFor="costOptimized" className="text-[11px] text-zinc-400 font-medium cursor-pointer select-none">
                    Delay execution until off-peak (Cost Governance Active)
                  </label>
                </div>
              </div>

              <button
                type="submit"
                disabled={isQueuing}
                className="w-full bg-[#1e1414] hover:bg-[#2e1d1d] border border-red-950 hover:border-red-500 text-red-400 font-bold py-2.5 px-4 rounded-lg text-xs tracking-wider uppercase transition flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
              >
                {isQueuing ? (
                  <>
                    <RefreshCw size={13} className="animate-spin" />
                    <span>Adding to queue...</span>
                  </>
                ) : (
                  <>
                    <Zap size={13} className="text-red-500" />
                    <span>Queue Batch Request</span>
                  </>
                )}
              </button>
            </form>
          </div>

          {/* Right Active Registries Indexer */}
          <div className="lg:col-span-2 space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-[10px] font-mono text-[#a1a1aa] uppercase tracking-widest">Active Batch Processing Pipeline</span>
              <span className="text-[9px] bg-red-500/10 text-red-500 border border-red-500/20 px-2 py-0.5 rounded uppercase font-black tracking-wider">
                Status: ACTIVE_SCHEDULER
              </span>
            </div>

            <div className="bg-zinc-950 border border-zinc-900 rounded-xl overflow-hidden">
              {batchItems.length === 0 ? (
                <div className="text-center py-24 text-zinc-650 text-xs font-mono">
                  No batch API requests scheduled. Design and dispatch a request in the terminal to initialize.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left font-mono text-xs border-collapse">
                    <thead>
                      <tr className="bg-[#0b0b0d] border-b border-zinc-900 text-zinc-500 text-[10px] uppercase font-bold tracking-wider">
                        <th className="py-3 px-4">Task Name</th>
                        <th className="py-3 px-4">Service</th>
                        <th className="py-3 px-4">Scheduled Window</th>
                        <th className="py-3 px-4">Status</th>
                        <th className="py-3 px-4 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-900/60">
                      {batchItems.map((item) => {
                        const isPending = item.status === 'Pending';
                        const isProcessing = item.status === 'Processing';
                        const isCompleted = item.status === 'Completed';
                        const isFailed = item.status === 'Failed';

                        return (
                          <tr key={item.id} className="hover:bg-zinc-900/20 transition-colors">
                            <td className="py-3.5 px-4">
                              <div className="font-bold text-white max-w-[180px] truncate">{item.name}</div>
                              <div className="text-[9px] text-zinc-600 mt-0.5">{item.id}</div>
                            </td>
                            <td className="py-3.5 px-4">
                              <span className={`px-2 py-0.5 rounded text-[9px] font-black tracking-wide ${
                                item.service === 'Gemini' 
                                  ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20' 
                                  : 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20'
                              }`}>
                                {item.service}
                              </span>
                              <div className="text-[9px] text-zinc-500 mt-1 truncate max-w-[120px]">{item.model}</div>
                            </td>
                            <td className="py-3.5 px-4 text-zinc-400">
                              <div>{new Date(Number(item.scheduled_time)).toLocaleDateString()}</div>
                              <div className="text-[10px] text-zinc-500 mt-0.5">{new Date(Number(item.scheduled_time)).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</div>
                            </td>
                            <td className="py-3.5 px-4">
                              <div className="flex items-center gap-1.5">
                                <span className={`w-1.5 h-1.5 rounded-full ${
                                  isPending ? 'bg-amber-400 animate-pulse' :
                                  isProcessing ? 'bg-blue-400 animate-spin' :
                                  isCompleted ? 'bg-emerald-500' : 'bg-red-500'
                                }`} />
                                <span className={`text-[10px] font-bold ${
                                  isPending ? 'text-amber-400' :
                                  isProcessing ? 'text-blue-400' :
                                  isCompleted ? 'text-emerald-400' : 'text-red-400'
                                }`}>
                                  {item.status}
                                </span>
                              </div>
                            </td>
                            <td className="py-3.5 px-4 text-right">
                              <div className="flex items-center justify-end gap-2">
                                {isPending && (
                                  <button
                                    onClick={() => handleRunBatchItem(item.id)}
                                    className="px-2.5 py-1 bg-[#1a140f] hover:bg-[#2e2014] border border-orange-950 hover:border-orange-500 text-orange-400 text-[10px] rounded transition cursor-pointer"
                                    title="Run request immediately"
                                  >
                                    Run Now
                                  </button>
                                )}
                                {(isCompleted || isFailed) && (
                                  <button
                                    onClick={() => setSelectedResultItem(item)}
                                    className="px-2.5 py-1 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 hover:border-zinc-700 text-zinc-300 text-[10px] rounded transition cursor-pointer"
                                  >
                                    View Output
                                  </button>
                                )}
                                <button
                                  onClick={() => handleDeleteBatchItem(item.id)}
                                  className="px-2.5 py-1 bg-red-950/10 hover:bg-red-950/30 border border-red-950/20 hover:border-red-500/40 text-red-400 text-[10px] rounded transition cursor-pointer"
                                  title="Cancel scheduled request"
                                >
                                  Cancel
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* View Results Modal Overlay */}
        {selectedResultItem && (
          <div className="bg-[#0b0b0c] border border-zinc-800 rounded-xl p-5 mt-4 space-y-4 animate-fade-in relative z-20">
            <div className="flex items-center justify-between border-b border-zinc-800/80 pb-3">
              <div>
                <span className="text-[10px] font-mono tracking-wider text-zinc-500 uppercase">BATCH OUTPUT DESCRIPTOR</span>
                <h4 className="text-white text-sm font-black mt-1">Output Payload for {selectedResultItem.name}</h4>
              </div>
              <button
                onClick={() => setSelectedResultItem(null)}
                className="text-zinc-500 hover:text-white font-mono text-xs cursor-pointer px-2 py-1 bg-zinc-900 rounded border border-zinc-800"
              >
                Close Output [x]
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <span className="text-[9px] font-mono text-zinc-500 uppercase block mb-1">Prompt / Input Parameters</span>
                <div className="bg-zinc-950 p-3.5 rounded-lg border border-zinc-900/60 font-mono text-xs text-zinc-400 whitespace-pre-wrap max-h-56 overflow-y-auto">
                  {selectedResultItem.payload?.prompt || JSON.stringify(selectedResultItem.payload, null, 2)}
                </div>
              </div>

              <div>
                <span className="text-[9px] font-mono text-zinc-500 uppercase block mb-1">Model Response Output</span>
                <div className="bg-zinc-950 p-3.5 rounded-lg border border-zinc-900/60 font-mono text-xs text-zinc-300 max-h-56 overflow-y-auto">
                  {selectedResultItem.status === 'Completed' ? (
                    selectedResultItem.service === 'Veo' ? (
                      <div className="space-y-3">
                        <p className="text-emerald-400 text-[10px] font-bold">✓ High-Fidelity Video Created</p>
                        <video 
                          src={selectedResultItem.result?.response?.generatedVideos?.[0]?.video?.uri || "https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4"} 
                          controls 
                          className="w-full rounded-lg border border-zinc-800 bg-black max-h-36 object-contain"
                        />
                        <div className="text-[10px] text-zinc-500 truncate">
                          URI: {selectedResultItem.result?.response?.generatedVideos?.[0]?.video?.uri}
                        </div>
                      </div>
                    ) : (
                      <div className="whitespace-pre-wrap text-zinc-200">
                        {selectedResultItem.result?.text || JSON.stringify(selectedResultItem.result, null, 2)}
                      </div>
                    )
                  ) : (
                    <div className="text-red-400 whitespace-pre-wrap">
                      Error: {selectedResultItem.result?.error || 'Unknown processing error.'}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* RANKTICA COGNITIVE MULTI-AGENT MATRIX BOARD */}
      <div className="bg-[#121214] border border-zinc-800 rounded-2xl p-6 relative overflow-hidden shadow-xl">
        <div className="absolute top-0 right-0 w-96 h-96 bg-red-500/[0.02] rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-orange-500/[0.02] rounded-full blur-3xl"></div>
        
        <header className="mb-6 flex flex-col md:flex-row md:items-center justify-between pb-4 border-b border-zinc-800/60 gap-4">
          <div>
            <h3 className="text-lg font-black text-white flex items-center gap-2">
              <Sparkles size={20} className="text-orange-500 animate-pulse" /> Ranktica Cognitive Agent Matrix
            </h3>
            <p className="text-zinc-400 text-xs mt-1">
              Select any of the 20 specialized execution agents to auto-populate the Spec Registry. Trigger real-time synchronization to configure target system parameters.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-[10px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/25 px-2 py-1 rounded font-mono font-bold tracking-wider">
              20 / 20 ACTIVE SPEC NODES
            </span>
          </div>
        </header>

        {/* 5 Operational Tiers Dashboard */}
        <div className="space-y-6">
          {SPECIALIZED_AGENTS_TIERS.map((tier, tierIdx) => (
            <div key={tierIdx} className="bg-zinc-950/40 border border-zinc-900 rounded-xl p-4 space-y-3">
              <h4 className="text-xs font-bold text-zinc-400 tracking-widest uppercase flex items-center justify-between">
                <span>{tier.tierName}</span>
                <span className="text-[9px] text-zinc-650 font-mono font-medium">TIER 0{tierIdx + 1} DIRECT LOGS</span>
              </h4>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                {tier.agents.map((agent) => {
                  // Select styling status color
                  const statusColors = {
                    Active: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
                    Ready: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
                    Optimizing: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
                    Calibrating: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20'
                  };
                  return (
                    <button
                      key={agent.id}
                      onClick={() => handleSelectSpecialAgent(agent)}
                      className="text-left bg-[#09090b] hover:bg-[#121214] border border-zinc-905 hover:border-zinc-700 p-3.5 rounded-lg transition duration-200 flex flex-col justify-between h-[155px] group focus:outline-none focus:border-orange-500/60 relative overflow-hidden"
                    >
                      <div className="space-y-2.5 w-full">
                        <div className="flex items-center justify-between gap-1.5">
                          <span className="text-xs font-bold text-white group-hover:text-orange-400 transition-colors truncate">
                            {agent.name}
                          </span>
                          <span className={`text-[8px] px-1.5 py-0.5 rounded border ${statusColors[agent.status]} font-mono shrink-0`}>
                            {agent.status}
                          </span>
                        </div>
                        <p className="text-zinc-500 text-[10px] leading-relaxed line-clamp-3">
                          {agent.description}
                        </p>
                      </div>

                      <div className="flex items-center justify-between pt-2 border-t border-zinc-900/60 w-full mt-2">
                        <span className="text-[9px] font-mono text-zinc-600 block">
                          {agent.engine}
                        </span>
                        <span className="text-[8px] bg-zinc-900 text-zinc-400 font-mono px-1 rounded opacity-0 group-hover:opacity-100 transition-opacity">
                          LOAD SPEC →
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* COGNITIVE AGENT REGISTRY & CAPABILITIES MANAGEMENT */}
      <div className="bg-[#121214] border border-zinc-800 rounded-2xl p-6 relative overflow-hidden shadow-xl">
        <div className="absolute top-0 right-0 w-64 h-64 bg-red-500/5 rounded-full blur-3xl"></div>
        <h3 className="text-lg font-black text-white mb-2 flex items-center gap-2">
          <Cpu size={20} className="text-red-500 animate-pulse" /> Cognitive Agent Registry & Capabilities
        </h3>
        <p className="text-zinc-400 text-xs mb-6 max-w-3xl leading-relaxed">
          Manage active agent specifications and dynamic capability schemas. Supply precise declarative configurations below to spawn or update autonomous agent metadata nodes securely.
        </p>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left specification terminal */}
          <div className="bg-zinc-950 border border-zinc-900 rounded-xl p-4 flex flex-col justify-between space-y-4">
            <div>
              <div className="flex justify-between items-center mb-2 pb-1 border-b border-zinc-900">
                <span className="text-[10px] font-mono tracking-wider text-zinc-500 uppercase">Declarative spec schema</span>
                <span className="text-[9px] font-mono bg-zinc-900 text-orange-400 px-1.5 py-0.5 rounded">JSON Spec</span>
              </div>
              <textarea
                value={registerInput}
                onChange={e => setRegisterInput(e.target.value)}
                className={`w-full h-44 bg-[#08080a] p-3 text-xs font-mono text-zinc-300 border rounded-lg focus:outline-none focus:border-red-500 transition-colors resize-none ${
                  jsonError ? 'border-red-650/40 focus:border-red-650' : 'border-zinc-800/60'
                }`}
                placeholder="{}"
              />
              {jsonError && (
                <p className="text-xs text-red-400 font-mono mt-1 flex items-center gap-1">
                  <span>⚠</span> {jsonError}
                </p>
              )}
            </div>

            <div className="space-y-3">
              <button
                onClick={handleRegisterAgent}
                className="w-full bg-[#1e1414] hover:bg-[#2e1d1d] border border-red-950 hover:border-red-500 text-red-400 font-bold py-2.5 px-4 rounded-lg text-xs tracking-wider uppercase transition flex items-center justify-center gap-2"
              >
                <Zap size={13} className="text-red-500" />
                <span>Register / Synchronize specs</span>
              </button>

              {/* Mini console action logs */}
              <div className="border border-zinc-900 rounded bg-[#0b0b0d] p-2 h-20 overflow-y-auto block font-mono text-[9px] text-zinc-500 space-y-1">
                {registryLogs.map((log, idx) => (
                  <div key={idx} className={log.includes('FAIL') || log.includes('EXCEPTION') ? 'text-red-400/80' : log.includes('REGISTERED') ? 'text-emerald-400/80' : 'text-zinc-600'}>
                    {log}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right Active Registries Indexer */}
          <div className="lg:col-span-2 space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-[10px] font-mono text-[#a1a1aa] uppercase tracking-widest">Dynamic Registered Specs Index ({agents.length})</span>
              <span className="text-[9px] bg-red-500/10 text-red-500 border border-red-500/20 px-2 py-0.5 rounded uppercase font-black tracking-wider">Cluster: ACTIVE_INDEX_NODES</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {agents.map((agent) => (
                <div key={agent.id} className="bg-[#0b0b0c] border border-zinc-800 hover:border-zinc-700/80 p-4 rounded-xl transition duration-300 relative group flex flex-col justify-between space-y-3">
                  <div>
                    <div className="flex items-center justify-between pointer-events-none">
                      <div className="flex items-center gap-2">
                        <span className={`w-2 h-2 rounded-full ${agent.status === 'Active' ? 'bg-emerald-500' : 'bg-zinc-650'} animate-pulse`} />
                        <span className="text-white font-mono text-xs font-bold tracking-wide">{agent.id}</span>
                      </div>
                      <span className="text-[8px] bg-zinc-900/50 text-zinc-500 border border-zinc-800 px-1.5 py-0.5 rounded font-mono">
                        SPEC_VER: v1.0
                      </span>
                    </div>

                    {/* Capabilities Tags */}
                    <div className="flex flex-wrap gap-1.5 mt-3">
                      {agent.capabilities.map((cap, i) => (
                        <span key={i} className="text-[9px] font-semibold tracking-wide bg-[#121214] border border-zinc-800 text-zinc-300 px-2.5 py-1 rounded-md">
                          {cap}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-zinc-900/60 text-[9px] font-mono text-zinc-500">
                    <span>Calls logged: <span className="text-zinc-400">{agent.callsCount}</span></span>
                    <span>Age: <span className="text-zinc-500 font-sans">Live 2d</span></span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* AGENT COGNITIVE ROUTER INTERACTION TRACER FLOW */}
      <div className="bg-[#121214] border border-zinc-800 rounded-2xl p-6 relative overflow-hidden shadow-xl">
        <h3 className="text-lg font-black text-white mb-2 flex items-center gap-2">
          <Layers size={20} className="text-orange-500" /> Cognitive Agent Routing Simulator
        </h3>
        <p className="text-zinc-400 text-xs mb-6 max-w-3xl leading-relaxed">
          Interactive simulation modeling Ranktica AI's query flow system. Select a developer query preset below to trigger the 
          cascade tracer down the workflow decision nodes. See the decoupled assets get parsed and stored perfectly into object storage references.
        </p>

        {/* Preset Selectors */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-6">
          {PRESET_SIMULATIONS.map((preset, idx) => (
            <button
              key={idx}
              onClick={() => handleSelectPreset(preset)}
              disabled={isSimulating}
              className={`p-3 rounded-xl border text-left transition text-xs flex flex-col justify-between h-24 ${
                activeSimulation.query === preset.query
                  ? 'border-orange-500 bg-orange-600/5 text-white'
                  : 'border-zinc-800 bg-zinc-900/25 text-zinc-400 hover:border-zinc-700'
              }`}
            >
              <span className="font-bold truncate w-full block mb-2">"{preset.query}"</span>
              <span className="text-[10px] text-zinc-500 block truncate uppercase tracking-wider font-mono">
                {preset.intentCode.split(' ')[0]}
              </span>
            </button>
          ))}
        </div>

        {/* Query Console and Trigger */}
        <div className="bg-zinc-950 border border-zinc-800 p-4 rounded-xl flex flex-col md:flex-row gap-4 items-center mb-8">
          <div className="flex items-center gap-2 w-full min-w-0">
            <MessageSquare size={16} className="text-zinc-500 shrink-0" />
            <input
              type="text"
              readOnly
              value={customQuery}
              className="w-full bg-transparent text-zinc-300 text-xs font-mono font-medium focus:outline-none"
            />
          </div>
          <button
            onClick={handleTriggerSimulation}
            disabled={isSimulating}
            className="w-full md:w-auto bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-500 hover:to-orange-500 text-white font-bold py-2 px-5 rounded-lg text-xs flex items-center justify-center gap-2 transition shrink-0 disabled:opacity-55"
          >
            {isSimulating ? (
              <>
                <RefreshCw size={13} className="animate-spin" />
                <span>Simulating...</span>
              </>
            ) : (
              <>
                <Play size={13} />
                <span>Simulate Dispatch Loop</span>
              </>
            )}
          </button>
        </div>

        {/* Flow visual layout (Based on requested diagram) */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
          
          {/* Main Visual Flow Column */}
          <div className="lg:col-span-2 space-y-4">
            <div className="flex flex-col items-center select-none relative">
              
              {/* Node 1: User Request */}
              <div className={`w-full max-w-md p-4 rounded-xl border text-center transition duration-300 ${
                simStep === 0 
                  ? 'border-orange-500 bg-orange-500/5 shadow-md shadow-orange-500/5 scale-[1.02]' 
                  : simStep > 0
                  ? 'border-emerald-500 bg-emerald-500/5 opacity-75'
                  : 'border-zinc-800 bg-zinc-900/20'
              }`}>
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-mono font-black tracking-widest text-zinc-500 uppercase">Input Payload</span>
                  {simStep > 0 && <CheckCircle2 size={12} className="text-emerald-500 shrink-0" />}
                </div>
                <h4 className="text-white text-xs font-bold mt-1 max-w-full truncate">User Request Context</h4>
                <p className="text-zinc-500 text-[10px] font-mono truncate mt-0.5">q: "{activeSimulation.query}"</p>
              </div>

              {/* Connecting line */}
              <div className="my-2 flex flex-col items-center">
                <div className={`w-1 h-6 transition-colors duration-300 ${simStep >= 1 ? 'bg-gradient-to-b from-emerald-500 to-orange-500' : 'bg-zinc-800'}`}></div>
                <ArrowDown size={14} className={simStep === 1 ? 'text-orange-500 animate-bounce' : simStep > 1 ? 'text-emerald-500' : 'text-zinc-700'} />
              </div>

              {/* Node 1.5: Context Assembly */}
              <div className={`w-full max-w-md p-4 rounded-xl border text-center transition duration-300 ${
                simStep === 1 
                  ? 'border-orange-500 bg-orange-500/5 shadow-md shadow-orange-500/5 scale-[1.02]' 
                  : simStep > 1
                  ? 'border-emerald-500 bg-emerald-500/5 opacity-75'
                  : 'border-zinc-800 bg-zinc-900/20'
              }`}>
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-mono font-black tracking-widest text-zinc-500 uppercase">Context Assembler</span>
                  {simStep === 1 ? (
                    <RefreshCw size={11} className="text-orange-400 animate-spin" />
                  ) : simStep > 1 ? (
                    <CheckCircle2 size={12} className="text-emerald-500 shrink-0" />
                  ) : null}
                </div>
                <h4 className="text-white text-xs font-bold mt-1">Multi-Source Context Assembly</h4>
                <p className="text-zinc-500 text-[9px] mb-3 leading-tight">Prevents agents from operating blindly by gathering project profiles & framework data</p>
                
                {/* Flow Sources Matrix */}
                <div className="grid grid-cols-2 gap-1.5 text-[9px] text-zinc-400 mb-3 text-left">
                  {[
                    "Project Context",
                    "User Profile",
                    "Subscription Plan",
                    "SEO Framework",
                    "Historical Outputs",
                    "Knowledge Base"
                  ].map((src, i) => (
                    <div key={i} className={`flex items-center gap-1.5 px-1.5 py-1 rounded bg-[#0b0b0c] border transition-all duration-300 ${
                      simStep === 1 
                        ? 'border-orange-500/40 text-orange-300 animate-pulse' 
                        : simStep > 1
                        ? 'border-emerald-500/20 text-emerald-300'
                        : 'border-zinc-800/40 text-zinc-500'
                    }`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${simStep === 1 ? 'bg-orange-550 active-source animate-ping' : simStep > 1 ? 'bg-emerald-500' : 'bg-zinc-700'}`} />
                      <span>{src}</span>
                    </div>
                  ))}
                </div>

                {/* Unified Output */}
                {simStep >= 1 ? (
                  <div className="bg-zinc-950 border border-zinc-900 rounded p-2.5 text-left font-mono text-[9px] leading-normal text-zinc-300 select-all overflow-x-auto max-h-36">
                    <div className="text-orange-500 font-bold mb-1">// Unified Context Output:</div>
                    {JSON.stringify({
                      project: activeSimulation.contextAssembled.project,
                      audience: activeSimulation.contextAssembled.audience,
                      tone: activeSimulation.contextAssembled.tone,
                      goal: activeSimulation.contextAssembled.goal
                    }, null, 2)}
                  </div>
                ) : (
                  <div className="text-[10px] text-zinc-650 italic py-2">Awaiting context synthesis dispatch...</div>
                )}
              </div>

              {/* Connecting line */}
              <div className="my-2 flex flex-col items-center">
                <div className={`w-1 h-6 transition-colors duration-300 ${simStep >= 2 ? 'bg-gradient-to-b from-emerald-500 to-orange-500' : 'bg-zinc-800'}`}></div>
                <ArrowDown size={14} className={simStep === 2 ? 'text-orange-500 animate-bounce' : simStep > 2 ? 'text-emerald-500' : 'text-zinc-700'} />
              </div>

              {/* Node 2: Agent Router */}
              <div className={`w-full max-w-md p-4 rounded-xl border text-center transition duration-300 ${
                simStep === 2 
                  ? 'border-orange-500 bg-orange-500/5 shadow-md shadow-orange-500/5 scale-[1.02]'
                  : simStep > 2
                  ? 'border-emerald-500 bg-emerald-500/5 opacity-75'
                  : 'border-zinc-800 bg-zinc-900/20'
              }`}>
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-mono font-black tracking-widest text-zinc-500 uppercase">Layer 01</span>
                  {simStep === 2 ? (
                    <RefreshCw size={11} className="text-orange-400 animate-spin" />
                  ) : simStep > 2 ? (
                    <CheckCircle2 size={12} className="text-emerald-500 shrink-0" />
                  ) : null}
                </div>
                <h4 className="text-white text-xs font-bold mt-1">Agent Router</h4>
                {simStep >= 2 ? (
                  <p className="text-orange-400 text-[10px] font-semibold mt-1 animate-pulse truncate font-mono">
                    {activeSimulation.router}
                  </p>
                ) : (
                  <p className="text-zinc-500 text-[10px] italic mt-0.5">Determines optimal processing path</p>
                )}
              </div>

              {/* Connecting line */}
              <div className="my-2 flex flex-col items-center">
                <div className={`w-1 h-6 transition-colors duration-300 ${simStep >= 3 ? 'bg-gradient-to-b from-emerald-500 to-orange-500' : 'bg-zinc-800'}`}></div>
                <ArrowDown size={14} className={simStep === 3 ? 'text-orange-500 animate-bounce' : simStep > 3 ? 'text-emerald-500' : 'text-zinc-700'} />
              </div>

              {/* Node 3: Intent Classification Layer */}
              <div className={`w-full max-w-md p-4 rounded-xl border text-center transition duration-300 ${
                simStep === 3 
                  ? 'border-orange-500 bg-orange-500/5 shadow-md shadow-orange-500/5 scale-[1.02]'
                  : simStep > 3
                  ? 'border-emerald-500 bg-emerald-500/5 opacity-75'
                  : 'border-zinc-800 bg-zinc-900/20'
              }`}>
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-mono font-black tracking-widest text-zinc-500 uppercase">Layer 02</span>
                  {simStep === 3 ? (
                    <RefreshCw size={11} className="text-orange-400 animate-spin" />
                  ) : simStep > 3 ? (
                    <CheckCircle2 size={12} className="text-emerald-500 shrink-0" />
                  ) : null}
                </div>
                <h4 className="text-white text-xs font-bold mt-1">Intent Classification Layer</h4>
                {simStep >= 3 ? (
                  <div className="mt-1 space-y-0.5 font-mono">
                    <p className="text-orange-400 text-[10px] font-bold">{activeSimulation.intent}</p>
                    <p className="text-zinc-500 text-[9px]">{activeSimulation.intentCode}</p>
                  </div>
                ) : (
                  <p className="text-zinc-500 text-[10px] italic mt-0.5">Identifies semantic capabilities needed</p>
                )}
              </div>

              {/* Connecting line */}
              <div className="my-2 flex flex-col items-center">
                <div className={`w-1 h-6 transition-colors duration-300 ${simStep >= 4 ? 'bg-gradient-to-b from-emerald-500 to-orange-500' : 'bg-zinc-800'}`}></div>
                <ArrowDown size={14} className={simStep === 4 ? 'text-orange-500 animate-bounce' : simStep > 4 ? 'text-emerald-500' : 'text-zinc-700'} />
              </div>

              {/* Node 4: Workflow Decision Engine */}
              <div className={`w-full max-w-md p-4 rounded-xl border text-center transition duration-300 ${
                simStep === 4 
                  ? 'border-orange-500 bg-orange-500/5 shadow-md shadow-orange-500/5 scale-[1.02]'
                  : simStep > 4
                  ? 'border-emerald-500 bg-emerald-500/5 opacity-75'
                  : 'border-zinc-800 bg-zinc-900/20'
              }`}>
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-mono font-black tracking-widest text-zinc-500 uppercase">Layer 03</span>
                  {simStep === 4 ? (
                    <RefreshCw size={11} className="text-orange-400 animate-spin" />
                  ) : simStep > 4 ? (
                    <CheckCircle2 size={12} className="text-emerald-500 shrink-0" />
                  ) : null}
                </div>
                <h4 className="text-white text-xs font-bold mt-1">Workflow Decision Engine</h4>
                {simStep >= 4 ? (
                  <p className="text-orange-400 text-[10px] font-semibold mt-1 max-w-full font-mono">
                    {activeSimulation.decision}
                  </p>
                ) : (
                  <p className="text-zinc-500 text-[10px] italic mt-0.5">Assembles dependency graph & inputs</p>
                )}
              </div>

              {/* Connecting line */}
              <div className="my-2 flex flex-col items-center">
                <div className={`w-1 h-6 transition-colors duration-300 ${simStep >= 5 ? 'bg-gradient-to-b from-emerald-500 to-orange-500' : 'bg-zinc-800'}`}></div>
                <ArrowDown size={14} className={simStep === 5 ? 'text-orange-500 animate-bounce' : simStep > 5 ? 'text-emerald-500' : 'text-zinc-700'} />
              </div>

              {/* Node 5: Agent Execution Manager */}
              <div className={`w-full max-w-md p-4 rounded-xl border text-center transition duration-300 ${
                simStep === 5 
                  ? 'border-orange-500 bg-orange-500/5 shadow-md shadow-orange-500/5 scale-[1.02]'
                  : simStep > 5
                  ? 'border-emerald-500 bg-emerald-500/5 opacity-75'
                  : 'border-zinc-800 bg-zinc-900/20'
              }`}>
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-mono font-black tracking-widest text-zinc-500 uppercase">Layer 04</span>
                  {simStep === 5 ? (
                    <RefreshCw size={11} className="text-orange-400 animate-spin" />
                  ) : simStep > 5 ? (
                    <CheckCircle2 size={12} className="text-emerald-500 shrink-0" />
                  ) : null}
                </div>
                <h4 className="text-white text-xs font-bold mt-1">Agent Execution Manager</h4>
                {simStep >= 5 ? (
                  <p className="text-orange-400 text-[10px] font-mono mt-1 leading-relaxed">
                    {activeSimulation.execution}
                  </p>
                ) : (
                  <p className="text-zinc-500 text-[10px] italic mt-0.5">Invokes Gemini API calls securely server-side</p>
                )}
              </div>

              {/* Connecting line */}
              <div className="my-2 flex flex-col items-center">
                <div className={`w-1 h-6 transition-colors duration-300 ${simStep >= 6 ? 'bg-gradient-to-b from-emerald-500 to-orange-500' : 'bg-zinc-800'}`}></div>
                <ArrowDown size={14} className={simStep === 6 ? 'text-orange-500 animate-bounce' : simStep > 6 ? 'text-emerald-500' : 'text-zinc-700'} />
              </div>

              {/* Node 6: Result Aggregation Layer */}
              <div className={`w-full max-w-md p-4 rounded-xl border text-center transition duration-300 ${
                simStep === 6 
                  ? 'border-orange-500 bg-orange-500/5 shadow-md shadow-orange-500/5 scale-[1.02]'
                  : simStep > 6
                  ? 'border-emerald-500 bg-emerald-500/5 opacity-75'
                  : 'border-zinc-800 bg-zinc-900/20'
              }`}>
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-mono font-black tracking-widest text-zinc-500 uppercase">Layer 05</span>
                  {simStep === 6 ? (
                    <RefreshCw size={11} className="text-orange-400 animate-spin" />
                  ) : simStep > 6 ? (
                    <CheckCircle2 size={12} className="text-emerald-500 shrink-0" />
                  ) : null}
                </div>
                <h4 className="text-white text-xs font-bold mt-1">Result Aggregation Layer</h4>
                {simStep >= 6 ? (
                  <p className="text-orange-400 text-[10px] font-mono mt-1 leading-normal max-w-full text-center">
                    {activeSimulation.aggregation}
                  </p>
                ) : (
                  <p className="text-zinc-500 text-[10px] italic mt-0.5">Decouples, structures, & validates response patterns</p>
                )}
              </div>

              {/* Connecting line */}
              <div className="my-2 flex flex-col items-center">
                <div className={`w-1 h-6 transition-colors duration-300 ${simStep >= 7 ? 'bg-gradient-to-b from-emerald-500 to-orange-500' : 'bg-zinc-800'}`}></div>
                <ArrowDown size={14} className={simStep === 7 ? 'text-emerald-500' : 'text-zinc-700'} />
              </div>

              {/* Node 7: Final Response */}
              <div className={`w-full max-w-md p-4 rounded-xl border text-center transition duration-300 ${
                simStep === 7 
                  ? 'border-emerald-500 bg-emerald-500/5 shadow-md shadow-emerald-500/5 scale-[1.02]' 
                  : 'border-zinc-800 bg-zinc-900/20'
              }`}>
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-mono font-black tracking-widest text-emerald-500 uppercase">Final response</span>
                  {simStep === 7 && <CheckCircle2 size={12} className="text-emerald-500 shrink-0 animate-bounce" />}
                </div>
                <h4 className="text-white text-xs font-bold mt-1">Sovereign Asset Decoupled Complete</h4>
                <p className="text-zinc-400 text-[10px] mt-0.5">Relational catalog points strictly to CDN resources.</p>
              </div>

            </div>
          </div>

          {/* Console / Response Preview Output Column */}
          <div className="space-y-4">
            
            {/* Live Trace Logs Console */}
            <div className="bg-zinc-950 border border-zinc-800 rounded-xl p-4 font-mono text-[10px] leading-relaxed">
              <div className="flex items-center justify-between mb-3 pb-2 border-b border-zinc-800">
                <span className="text-zinc-400 font-bold uppercase tracking-widest text-[9px]">Live Trace terminal</span>
                <span className="w-2 h-2 bg-orange-500 rounded-full animate-ping"></span>
              </div>
              <div className="space-y-2 h-[220px] overflow-y-auto block pr-1">
                {traceLogs.length === 0 ? (
                  <span className="text-zinc-650 italic">[Awaiting dispatch queue trigger...]</span>
                ) : (
                  traceLogs.map((log, idx) => (
                    <div key={idx} className={
                      log.startsWith('[Trace Success]') ? 'text-emerald-400 font-bold' :
                      log.startsWith('[Trace System Event]') ? 'text-cyan-400' :
                      log.startsWith('[Query') ? 'text-zinc-400 italic' :
                      log.startsWith('[Trace Init]') ? 'text-grey-500' :
                      'text-zinc-300'
                    }>
                      {log}
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Dynamic Final Response Render Preview */}
            <div className="bg-[#18181b] border border-zinc-800 rounded-xl p-4 overflow-hidden relative min-h-[180px] flex flex-col justify-between">
              <div>
                <div className="flex justify-between items-center mb-3">
                  <span className="text-[9px] uppercase font-bold tracking-wider text-zinc-500 font-mono">Response Payload rendering</span>
                  {simStep === 7 && (
                    <span className="px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 font-mono text-[8px] font-bold">
                      DELIVERED
                    </span>
                  )}
                </div>

                {simStep < 7 ? (
                  <div className="h-28 flex flex-col items-center justify-center text-center space-y-2">
                    <Eye className="text-zinc-700 animate-pulse" size={24} />
                    <span className="text-[10px] text-zinc-500">
                      {isSimulating ? 'Processing layers... payload rendering will complete shortly' : 'Awaiting loop completion'}
                    </span>
                  </div>
                ) : (
                  <div className="text-zinc-300 text-[11px] leading-relaxed font-mono whitespace-pre-wrap bg-zinc-950 p-2.5 rounded border border-zinc-900/60 max-h-40 overflow-y-auto">
                    {activeSimulation.finalResponse}
                  </div>
                )}
              </div>

              {simStep === 7 && (
                <div className="mt-4 pt-3 border-t border-zinc-800/40 flex items-center justify-between text-[10px]">
                  <span className="text-zinc-500 font-bold">Storage pointers satisfied:</span>
                  <span className="text-orange-400 font-bold font-mono">100% Decoupled</span>
                </div>
              )}
            </div>

          </div>

        </div>
      </div>

    </div>
  );
};
