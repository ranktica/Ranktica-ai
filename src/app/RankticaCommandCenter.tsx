import React, { useState, useEffect, useMemo } from 'react';
import { 
  BarChart2, 
  Cpu, 
  TrendingUp, 
  Search, 
  FileText, 
  Eye, 
  DollarSign, 
  Coins, 
  Activity, 
  Play, 
  Zap, 
  AlertTriangle, 
  CheckCircle, 
  Terminal, 
  ArrowRight, 
  RefreshCw, 
  Plus, 
  Sliders, 
  Code, 
  Copy, 
  Check, 
  ArrowUpRight, 
  ArrowDownRight,
  Sparkles,
  Info,
  Shield,
  Layers,
  ChevronRight,
  Database
} from 'lucide-react';
import { useAuth } from '@/infrastructure/auth/AuthContext';
import { toast } from 'react-hot-toast';
import { RankticaEnterprisePortal } from './RankticaEnterprisePortal';
import { AIEmployeeOS } from './AIEmployeeOS';

// Define TS Interfaces for modular data
interface AgentState {
  id: string;
  name: string;
  role: string;
  status: 'idle' | 'running' | 'analyzing' | 'success' | 'error';
  lastActive: string;
  task: string;
  performanceScore: number;
  tokensUsed: number;
}

interface CampaignState {
  id: string;
  name: string;
  url: string;
  niche: string;
  audience: string;
  budget: number;
  status: 'Active' | 'Paused' | 'Completed';
  currentStage: number;
  seoScore: number;
  geoCitations: number;
}

interface CompetitorState {
  name: string;
  url: string;
  organicTraffic: number;
  keywordsCount: number;
  shareOfVoice: number;
  hijackDifficulty: 'Low' | 'Medium' | 'High';
}

export const RankticaCommandCenter: React.FC = () => {
  const { user } = useAuth();
  
  // Real-time tick count to simulate live network updates
  const [ticker, setTicker] = useState<number>(0);
  const [activeTab, setActiveTab] = useState<string>('overview');
  const [copiedCodeId, setCopiedCodeId] = useState<string | null>(null);

  // UTC Clock
  const [currentTime, setCurrentTime] = useState<string>('');
  useEffect(() => {
    const updateTime = () => {
      const d = new Date();
      setCurrentTime(d.toISOString().replace('T', ' ').slice(0, 19) + ' UTC');
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  // Live network actions ticker
  useEffect(() => {
    const interval = setInterval(() => {
      setTicker(prev => prev + 1);
    }, 4500);
    return () => clearInterval(interval);
  }, []);

  // ------------------------------------------------------------
  // MODULE DATA STATE (Simulated & interactive database records)
  // ------------------------------------------------------------

  // 1. Live agent workforce state
  const [agents, setAgents] = useState<AgentState[]>([
    { id: 'crawler-01', name: 'Web Crawler Core', role: 'Website Scanning', status: 'idle', lastActive: '2 min ago', task: 'Ready for scanning payload', performanceScore: 98.4, tokensUsed: 124050 },
    { id: 'seo-audit-02', name: 'SEO Diagnostics Auditor', role: 'SEO Gap Auditing', status: 'success', lastActive: 'Just now', task: 'Completed tag clustering for joinranktica.com', performanceScore: 96.2, tokensUsed: 485120 },
    { id: 'strategy-planner-03', name: 'Strategic Budget Architect', role: 'Campaign Bidding Optimizer', status: 'idle', lastActive: '5 min ago', task: 'Determined keyword bid boundaries', performanceScore: 99.1, tokensUsed: 89000 },
    { id: 'copy-writer-04', name: 'Semantic Copywriter', role: 'Brief & Copy Generation', status: 'running', lastActive: 'Active now', task: 'Synthesizing responsive outline for "SaaS SEO Playbook"', performanceScore: 94.8, tokensUsed: 1450200 },
    { id: 'geo-hijack-05', name: 'GEO Hijack Engine', role: 'Generative Engine Citation Optimization', status: 'analyzing', lastActive: 'Active now', task: 'Measuring LLM search result relevance indexes', performanceScore: 97.5, tokensUsed: 2105600 },
    { id: 'aeo-synth-06', name: 'AEO Schema Injector', role: 'Answer Engine JSON-LD optimization', status: 'idle', lastActive: '12 min ago', task: 'Optimized FAQ rich result schema blocks', performanceScore: 95.9, tokensUsed: 312000 },
    { id: 'rlhf-07', name: 'RLHF Tuning Loop Agent', role: 'RLHF Feedback Alignments', status: 'running', lastActive: 'Active now', task: 'Finetuning token generation alignment thresholds', performanceScore: 98.9, tokensUsed: 924000 },
    { id: 'financial-audit-08', name: 'KPI Attributor Agent', role: 'Financial & Conversion Mapping', status: 'idle', lastActive: '1 hr ago', task: 'Synced cost tables with Stripe webhooks', performanceScore: 99.7, tokensUsed: 148000 },
    { id: 'dispatcher-09', name: 'Bus Dispatcher Router', role: 'Agent Orchestration Controller', status: 'success', lastActive: 'Just now', task: 'Successfully dispatched copywriter to SEO-audit results', performanceScore: 99.9, tokensUsed: 78000 },
  ]);

  // Handle live agent status changes based on ticking
  useEffect(() => {
    if (ticker === 0) return;
    setAgents(prev => {
      return prev.map(agent => {
        const rand = Math.random();
        if (rand > 0.6) {
          const statuses: AgentState['status'][] = ['idle', 'running', 'analyzing', 'success'];
          const nextStatus = statuses[Math.floor(Math.random() * statuses.length)];
          let nextTask = agent.task;
          if (nextStatus === 'running') nextTask = 'Parsing neural request...';
          else if (nextStatus === 'analyzing') nextTask = 'Re-optimizing model weights...';
          else if (nextStatus === 'success') nextTask = 'Successfully compiled current pipeline instruction';
          return {
            ...agent,
            status: nextStatus,
            task: nextTask,
            tokensUsed: agent.tokensUsed + Math.floor(Math.random() * 500),
            lastActive: 'Just now'
          };
        }
        return agent;
      });
    });
  }, [ticker]);

  // Agent overrides input state
  const [overrideTargetAgent, setOverrideTargetAgent] = useState<string>('copy-writer-04');
  const [overridePrompt, setOverridePrompt] = useState<string>('Inject a conversational, authority-driven perspective detailing SaaS acquisition ROI');

  const handleApplyOverride = (e: React.FormEvent) => {
    e.preventDefault();
    const agent = agents.find(a => a.id === overrideTargetAgent);
    if (!agent) return;
    
    toast.success(`Dispatched system override prompt to ${agent.name}! 🚀`);
    setAgents(prev => prev.map(a => {
      if (a.id === overrideTargetAgent) {
        return {
          ...a,
          status: 'running',
          task: `Overridden prompt executing: "${overridePrompt}"`,
          lastActive: 'Just now'
        };
      }
      return a;
    }));
  };

  // 2. Active campaigns state
  const [campaigns, setCampaigns] = useState<CampaignState[]>([
    { id: 'camp-101', name: 'SaaS SEO Growth Matrix', url: 'https://joinranktica.com', niche: 'Enterprise SaaS Content', audience: 'Founders & CMOs', budget: 15000, status: 'Active', currentStage: 5, seoScore: 94, geoCitations: 184 },
    { id: 'camp-102', name: 'AI Copywriting Dominance', url: 'https://aimagicwriter.net', niche: 'Generative AI Utilities', audience: 'Copywriters & Agencies', budget: 8500, status: 'Active', currentStage: 3, seoScore: 89, geoCitations: 92 },
    { id: 'camp-103', name: 'High-Retention Video SEO', url: 'https://videoquickcuts.io', niche: 'Viral Shorts Tech', audience: 'YouTubers & Creators', budget: 24000, status: 'Completed', currentStage: 7, seoScore: 98, geoCitations: 312 },
    { id: 'camp-104', name: 'Clean Architecture Audit', url: 'https://saasboilerplates.org', niche: 'Developer Templates', audience: 'Software Engineers', budget: 5000, status: 'Paused', currentStage: 1, seoScore: 72, geoCitations: 0 },
  ]);

  // New campaign creator
  const [newCampaignName, setNewCampaignName] = useState('');
  const [newCampaignUrl, setNewCampaignUrl] = useState('');
  const [newCampaignNiche, setNewCampaignNiche] = useState('SaaS Automation');
  const [newCampaignAudience, setNewCampaignAudience] = useState('Enterprise CMOs');
  const [newCampaignBudget, setNewCampaignBudget] = useState(10000);

  const handleCreateCampaign = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCampaignName || !newCampaignUrl) {
      toast.error('Please enter campaign name and target website URL');
      return;
    }
    const newCamp: CampaignState = {
      id: `camp-${Math.floor(100 + Math.random() * 900)}`,
      name: newCampaignName,
      url: newCampaignUrl,
      niche: newCampaignNiche,
      audience: newCampaignAudience,
      budget: Number(newCampaignBudget),
      status: 'Active',
      currentStage: 1,
      seoScore: 65,
      geoCitations: 0
    };

    setCampaigns(prev => [newCamp, ...prev]);
    setNewCampaignName('');
    setNewCampaignUrl('');
    toast.success('Campaign deployed successfully! Running stage 1 analysis...', { icon: '🤖' });
  };

  const handleStepForwardCampaign = (campId: string) => {
    setCampaigns(prev => prev.map(c => {
      if (c.id === campId) {
        const nextStage = c.currentStage < 7 ? c.currentStage + 1 : 1;
        const scoreGain = Math.floor(Math.random() * 4);
        return {
          ...c,
          currentStage: nextStage,
          seoScore: Math.min(100, c.seoScore + scoreGain),
          geoCitations: nextStage === 7 ? c.geoCitations + Math.floor(Math.random() * 15 + 5) : c.geoCitations
        };
      }
      return c;
    }));
    toast.success('Successfully triggered next phase transition');
  };

  // 3. Competitors State
  const [competitors, setCompetitors] = useState<CompetitorState[]>([
    { name: 'SaaSFlow Analytics', url: 'https://saasflow.com', organicTraffic: 245000, keywordsCount: 14500, shareOfVoice: 38.4, hijackDifficulty: 'Medium' },
    { name: 'ContentForge AI', url: 'https://contentforge.io', organicTraffic: 185000, keywordsCount: 9200, shareOfVoice: 26.1, hijackDifficulty: 'Low' },
    { name: 'OmniSEO Core', url: 'https://omniseo.net', organicTraffic: 512000, keywordsCount: 34000, shareOfVoice: 42.5, hijackDifficulty: 'High' },
  ]);

  const handleHijackCluster = (competitorName: string) => {
    toast.loading(`Launching Content Hijack Campaign targeting ${competitorName} clusters...`, {
      duration: 2000,
      id: 'hijack-loader'
    });
    setTimeout(() => {
      toast.success(`Successfully dispatched Content Generator agents! Traffic Share-of-Voice shifted (+1.4%)`, {
        id: 'hijack-loader'
      });
      setCompetitors(prev => prev.map(c => {
        if (c.name === competitorName) {
          return {
            ...c,
            shareOfVoice: Math.max(5, c.shareOfVoice - 1.8)
          };
        }
        return c;
      }));
    }, 2000);
  };

  // 4. Interactive Revenue ROI Calculator Sliders
  const [roiTraffic, setRoiTraffic] = useState<number>(50000); // monthly organic traffic
  const [roiConversion, setRoiConversion] = useState<number>(2.4); // organic conversion rate %
  const [roiLtv, setRoiLtv] = useState<number>(120); // customer LTV average $

  const calculatedOrganicValue = useMemo(() => {
    const monthlyCustomers = (roiTraffic * (roiConversion / 100));
    return Math.floor(monthlyCustomers * roiLtv);
  }, [roiTraffic, roiConversion, roiLtv]);

  // 5. Interactive Content Intelligence Title generator
  const [titleSeedTopic, setTitleSeedTopic] = useState<string>('SaaS organic pipeline scaling');
  const [generatedTitles, setGeneratedTitles] = useState<Array<{ title: string; ctr: number; confidence: number; tone: string }>>([]);
  const [isGeneratingTitles, setIsGeneratingTitles] = useState<boolean>(false);

  const handleGenerateTitles = (e: React.FormEvent) => {
    e.preventDefault();
    if (!titleSeedTopic) return;
    setIsGeneratingTitles(true);
    setTimeout(() => {
      setGeneratedTitles([
        { title: `How We Scaled Our ${titleSeedTopic} by 340% (No Paid Ads)`, ctr: 9.4, confidence: 96, tone: 'Authority / Viral' },
        { title: `The Modern Playbook for ${titleSeedTopic} in 2026`, ctr: 8.7, confidence: 91, tone: 'Educational' },
        { title: `Stop Wasting Capital: Why Your ${titleSeedTopic} is Leaking Conversions`, ctr: 8.2, confidence: 87, tone: 'Pain-point Interrupt' },
      ]);
      setIsGeneratingTitles(false);
      toast.success('Generated high-CTR title variations with Gemini scores!');
    }, 1200);
  };

  // 6. Cost Governance Budget Guard State
  const [autogardEnabled, setAutogardEnabled] = useState<boolean>(true);
  const [costBudgetLimit, setCostBudgetLimit] = useState<number>(1500);

  // ------------------------------------------------------------
  // REAL-TIME METRICS CALCULATION
  // ------------------------------------------------------------
  const activeAgentCount = useMemo(() => agents.filter(a => a.status !== 'idle').length, [agents]);
  const totalCampaignBudget = useMemo(() => campaigns.reduce((acc, c) => acc + c.budget, 0), [campaigns]);
  const activeCampaignCount = useMemo(() => campaigns.filter(c => c.status === 'Active').length, [campaigns]);

  // Live Agent Log Output updates
  const [liveLogs, setLiveLogs] = useState<string[]>([
    '[SYSTEM CORE] Ranktica AI Command Center initialized successfully.',
    '[DISPATCHER-09] Bus Dispatcher scanned active workflow queues.',
    '[CRAWLER-01] Finished scanning targeting clusters on aimagicwriter.net.',
    '[SEO-AUDIT-02] Completed search engine layout analysis: SEO index 94.',
  ]);

  useEffect(() => {
    if (ticker === 0) return;
    const logPool = [
      `[CRAWLER-01] URL analysis complete: extracted 14 critical metadata parameters.`,
      `[SEO-AUDIT-02] Verified schema markup consistency on ${campaigns[Math.floor(Math.random() * campaigns.length)].url}.`,
      `[COPY-WRITER-04] LLM token synthesis executing: 4,024 prompt words generated.`,
      `[GEO-HIJACK-05] Answer citation probability for "joinranktica" increased to 84.2%.`,
      `[RLHF-07] Reinforcement alignment successfully converged for active SEO campaigns.`,
      `[FINANCIAL-AUDIT-08] Calculated MRR attribution delta: +$1,420 organic valuation value.`,
      `[DISPATCHER-09] Successfully marshaled workflow request to copywriter nodes.`,
    ];
    const newLog = logPool[Math.floor(Math.random() * logPool.length)];
    setLiveLogs(prev => [newLog, ...prev.slice(0, 15)]);
  }, [ticker, campaigns]);

  // Copy code utility
  const handleCopyCode = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedCodeId(id);
    toast.success('API Schema copied to clipboard!');
    setTimeout(() => setCopiedCodeId(null), 2000);
  };

  // API Specifications Mock Schema Data
  const apiSchemas = {
    overview: {
      url: '/api/v1/command-center/overview',
      method: 'GET',
      headers: `{\n  "Authorization": "Bearer fk_live_58c9f0a2...",\n  "Content-Type": "application/json"\n}`,
      response: `{\n  "status": "success",\n  "timestamp": "${new Date().toISOString()}",\n  "data": {\n    "executive_metrics": {\n      "conversion_value_usd": 42150,\n      "active_agents": ${activeAgentCount},\n      "share_of_voice_pct": 14.8,\n      "avg_cpa_usd": 0.42\n    },\n    "campaigns_active": ${activeCampaignCount},\n    "cost_governance": {\n      "budget_limit_usd": ${costBudgetLimit},\n      "current_spend_usd": 384.12,\n      "caching_savings_usd": 7240.50\n    }\n  }\n}`
    },
    workforce: {
      url: '/api/v1/command-center/workforce/override',
      method: 'POST',
      headers: `{\n  "Authorization": "Bearer fk_live_58c9f0a2...",\n  "Content-Type": "application/json"\n}`,
      body: `{\n  "agent_id": "${overrideTargetAgent}",\n  "override_prompt": "${overridePrompt}",\n  "execution_priority": "high"\n}`,
      response: `{\n  "status": "dispatched",\n  "agent_id": "${overrideTargetAgent}",\n  "job_id": "job_94c1fbc039e",\n  "expected_duration_sec": 4.5,\n  "payload": {\n    "allocated_tokens": 12000,\n    "system_aligned": true\n  }\n}`
    },
    campaigns: {
      url: '/api/v1/command-center/campaigns/deploy',
      method: 'POST',
      headers: `{\n  "Authorization": "Bearer fk_live_58c9f0a2...",\n  "Content-Type": "application/json"\n}`,
      body: `{\n  "name": "New Growth Campaign",\n  "url": "https://mysite.com",\n  "niche": "E-commerce SEO",\n  "audience": "SaaS Buyers",\n  "monthly_budget": 5000\n}`,
      response: `{\n  "status": "initialized",\n  "campaign_id": "camp_849",\n  "initial_stage": 1,\n  "pipeline_dispatched": true\n}`
    }
  };

  return (
    <div id="ranktica-command-center" className="min-h-screen bg-[#070709] border border-zinc-900 rounded-3xl overflow-hidden shadow-2xl flex flex-col font-sans text-zinc-200">
      
      {/* 1. TOP HEADER STATUS RAIL */}
      <header className="bg-[#0b0b0e] border-b border-zinc-850 px-6 py-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-tr from-red-600 to-orange-500 rounded-xl flex items-center justify-center shadow-lg shadow-red-600/10">
            <Cpu className="text-white animate-spin" size={20} style={{ animationDuration: '6s' }} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-black text-white uppercase tracking-wider">Ranktica AI</h1>
              <span className="text-[9px] bg-red-950/40 border border-red-900/60 text-red-400 font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">Command Center Core</span>
            </div>
            <p className="text-[11px] text-zinc-500 font-medium">Enterprise Orchestration Engine • v5.2 Production</p>
          </div>
        </div>

        {/* Real-time sync signals */}
        <div className="flex flex-wrap items-center gap-4 text-xs">
          <div className="bg-zinc-950 border border-zinc-850 rounded-xl px-3 py-2 flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-[10px] text-zinc-400 font-mono font-bold select-all">{currentTime}</span>
          </div>

          <div className="bg-zinc-950 border border-zinc-850 rounded-xl px-3 py-2 flex items-center gap-2">
            <Activity size={12} className="text-red-500 animate-pulse" />
            <span className="text-[10px] text-zinc-400 font-bold uppercase">
              {activeAgentCount} / 9 Agents Engaged
            </span>
          </div>

          <button 
            onClick={() => {
              toast.success('Successfully synchronized entire AI workforce states!');
              setTicker(prev => prev + 1);
            }}
            className="p-2 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 hover:border-zinc-700 text-zinc-300 rounded-xl transition-all cursor-pointer"
            title="Force Global Sync"
          >
            <RefreshCw size={13} className="animate-spin-once" />
          </button>
        </div>
      </header>

      {/* 2. MAIN LAYOUT CONTAINER */}
      <div className="flex-1 flex flex-col lg:flex-row">
        
        {/* SIDEBAR NAVIGATION: Collapses on small screens */}
        <aside className="w-full lg:w-64 bg-[#09090b] border-b lg:border-b-0 lg:border-r border-zinc-850 p-4 space-y-2 select-none flex flex-row lg:flex-col overflow-x-auto lg:overflow-x-visible">
          <div className="hidden lg:block pb-3 mb-2 border-b border-zinc-900">
            <span className="text-[9px] font-black uppercase text-zinc-500 tracking-wider">Dashboard Modules</span>
          </div>
          
          {[
            { id: 'overview', label: 'Executive Overview', icon: <BarChart2 size={16} /> },
            { id: 'enterprise', label: 'V3 Enterprise Core', icon: <Shield size={16} />, badge: 'V3 Ready' },
            { id: 'workforce', label: 'AI Workforce', icon: <Cpu size={16} />, badge: '9 Active' },
            { id: 'campaigns', label: 'Campaign Intelligence', icon: <Layers size={16} />, badge: campaigns.length },
            { id: 'seo', label: 'SEO Intelligence', icon: <Search size={16} /> },
            { id: 'content', label: 'Content Intelligence', icon: <FileText size={16} /> },
            { id: 'competitor', label: 'Competitor Intel', icon: <Eye size={16} />, color: 'text-orange-500' },
            { id: 'revenue', label: 'Revenue Analytics', icon: <DollarSign size={16} />, color: 'text-emerald-500' },
            { id: 'cost', label: 'AI Cost Analytics', icon: <Coins size={16} /> },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`w-full flex items-center justify-between p-3 rounded-xl text-left font-semibold text-xs tracking-wide transition-all cursor-pointer shrink-0 lg:shrink ${
                activeTab === tab.id 
                  ? 'bg-zinc-900 border border-zinc-800 text-white font-extrabold shadow-sm' 
                  : 'text-zinc-400 hover:bg-zinc-950/40 hover:text-zinc-200 border border-transparent'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <span className={activeTab === tab.id ? 'text-red-500' : 'text-zinc-500'}>{tab.icon}</span>
                <span>{tab.label}</span>
              </div>
              {tab.badge !== undefined && (
                <span className="hidden lg:inline text-[9px] font-mono px-1.5 py-0.5 bg-zinc-950 border border-zinc-800 text-zinc-400 rounded-md">
                  {tab.badge}
                </span>
              )}
            </button>
          ))}
        </aside>

        {/* 3. WORKING PORT CANVAS */}
        <main className="flex-1 p-6 space-y-6 overflow-y-auto max-h-[calc(100vh-140px)]">

          {/* ========================================== */}
          {/* TAB 1: EXECUTIVE OVERVIEW                  */}
          {/* ========================================== */}
          {activeTab === 'overview' && (
            <div className="space-y-6 animate-fade-in">
              <div className="flex justify-between items-center pb-2 border-b border-zinc-900">
                <div>
                  <h2 className="text-xl font-black text-white uppercase tracking-tight">Executive Performance Overview</h2>
                  <p className="text-xs text-zinc-400">Holistic performance evaluation metrics compiled from all autonomous agent subsystems.</p>
                </div>
                <span className="text-[10px] font-mono bg-zinc-900 text-zinc-400 px-2 py-1 rounded border border-zinc-800">
                  Refreshed {currentTime.slice(11, 19)}
                </span>
              </div>

              {/* CORE METRICS GRID */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-[#0b0b0e] border border-zinc-850 p-5 rounded-2xl relative overflow-hidden group">
                  <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-600/5 rounded-full filter blur-xl" />
                  <span className="text-[10px] font-black uppercase text-zinc-500 tracking-wider block mb-1">Attributed Revenue Value</span>
                  <div className="flex items-baseline gap-2">
                    <span className="text-2xl font-black text-white">$42,150</span>
                    <span className="text-xs text-emerald-400 font-bold flex items-center gap-0.5">
                      <ArrowUpRight size={12} /> 18.4%
                    </span>
                  </div>
                  <p className="text-[10px] text-zinc-500 mt-2 font-medium">Attributed organic traffic ROI</p>
                </div>

                <div className="bg-[#0b0b0e] border border-zinc-850 p-5 rounded-2xl relative overflow-hidden group">
                  <div className="absolute top-0 right-0 w-24 h-24 bg-red-600/5 rounded-full filter blur-xl" />
                  <span className="text-[10px] font-black uppercase text-zinc-500 tracking-wider block mb-1">Active AI Workforce</span>
                  <div className="flex items-baseline gap-2">
                    <span className="text-2xl font-black text-white">{activeAgentCount} / 9</span>
                    <span className="text-xs text-red-400 font-bold flex items-center gap-0.5">
                      <Activity size={12} className="animate-pulse" /> Live Now
                    </span>
                  </div>
                  <p className="text-[10px] text-zinc-500 mt-2 font-medium">Simulated pipeline executors</p>
                </div>

                <div className="bg-[#0b0b0e] border border-zinc-850 p-5 rounded-2xl relative overflow-hidden group">
                  <div className="absolute top-0 right-0 w-24 h-24 bg-orange-600/5 rounded-full filter blur-xl" />
                  <span className="text-[10px] font-black uppercase text-zinc-500 tracking-wider block mb-1">Global SEO SOV</span>
                  <div className="flex items-baseline gap-2">
                    <span className="text-2xl font-black text-white">14.8%</span>
                    <span className="text-xs text-orange-400 font-bold flex items-center gap-0.5">
                      <ArrowUpRight size={12} /> 2.1%
                    </span>
                  </div>
                  <p className="text-[10px] text-zinc-500 mt-2 font-medium">Search Engine citation share</p>
                </div>

                <div className="bg-[#0b0b0e] border border-zinc-850 p-5 rounded-2xl relative overflow-hidden group">
                  <div className="absolute top-0 right-0 w-24 h-24 bg-blue-600/5 rounded-full filter blur-xl" />
                  <span className="text-[10px] font-black uppercase text-zinc-500 tracking-wider block mb-1">AI Cost per Acquisition</span>
                  <div className="flex items-baseline gap-2">
                    <span className="text-2xl font-black text-white">$0.42</span>
                    <span className="text-xs text-emerald-400 font-bold flex items-center gap-0.5">
                      <ArrowDownRight size={12} /> 34.5%
                    </span>
                  </div>
                  <p className="text-[10px] text-zinc-500 mt-2 font-medium">Average cost per subscriber lead</p>
                </div>
              </div>

              {/* TWO COLUMN GRID WITH CHART & OPERATIONS FEED */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                
                {/* Visual Graph Card */}
                <div className="lg:col-span-8 bg-[#0b0b0e] border border-zinc-850 p-5 rounded-2xl space-y-4">
                  <div className="flex justify-between items-center">
                    <h3 className="text-xs font-black uppercase tracking-wider text-zinc-400 flex items-center gap-2">
                      <TrendingUp size={14} className="text-red-500" /> Attributed Organic Scaling (Value vs Cost)
                    </h3>
                    <div className="flex items-center gap-3 text-[10px] font-bold text-zinc-500">
                      <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-emerald-500" /> Value Attributed</span>
                      <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-red-500" /> Agent Spend</span>
                    </div>
                  </div>

                  {/* CUSTOM HIGH FIDELITY SVG DUAL CHART */}
                  <div className="h-60 relative w-full pt-4">
                    <svg viewBox="0 0 600 200" className="w-full h-full overflow-visible">
                      <defs>
                        <linearGradient id="valGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#10b981" stopOpacity={0.25} />
                          <stop offset="100%" stopColor="#10b981" stopOpacity={0} />
                        </linearGradient>
                        <linearGradient id="costGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#ef4444" stopOpacity={0.1} />
                          <stop offset="100%" stopColor="#ef4444" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      {/* Gridlines */}
                      <line x1="0" y1="40" x2="600" y2="40" stroke="#1f1f2e" strokeDasharray="3 3" />
                      <line x1="0" y1="90" x2="600" y2="90" stroke="#1f1f2e" strokeDasharray="3 3" />
                      <line x1="0" y1="140" x2="600" y2="140" stroke="#1f1f2e" strokeDasharray="3 3" />
                      
                      {/* Value Area Chart path (emerald) */}
                      <path d="M 0 160 Q 100 130 200 110 T 400 60 T 600 30 L 600 200 L 0 200 Z" fill="url(#valGrad)" />
                      <path d="M 0 160 Q 100 130 200 110 T 400 60 T 600 30" fill="none" stroke="#10b981" strokeWidth="3" strokeLinecap="round" />

                      {/* Spend Area Chart path (red) */}
                      <path d="M 0 190 Q 100 185 200 170 T 400 165 T 600 150 L 600 200 L 0 200 Z" fill="url(#costGrad)" />
                      <path d="M 0 190 Q 100 185 200 170 T 400 165 T 600 150" fill="none" stroke="#ef4444" strokeWidth="2.5" strokeDasharray="5 3" />

                      {/* Interactive indicator nodes */}
                      <circle cx="200" cy="110" r="4" fill="#18181b" stroke="#10b981" strokeWidth="2" />
                      <circle cx="400" cy="60" r="4" fill="#18181b" stroke="#10b981" strokeWidth="2" />
                      <circle cx="600" cy="30" r="4" fill="#18181b" stroke="#10b981" strokeWidth="2" />
                    </svg>
                    <div className="flex justify-between text-zinc-600 text-[9px] font-bold uppercase mt-2">
                      <span>May 25</span>
                      <span>Jun 01</span>
                      <span>Jun 08</span>
                      <span>Jun 15</span>
                      <span>Jun 22</span>
                      <span>Jun 26 (Current)</span>
                    </div>
                  </div>
                </div>

                {/* Operations Terminal Logs */}
                <div className="lg:col-span-4 bg-[#0b0b0e] border border-zinc-850 p-5 rounded-2xl flex flex-col justify-between">
                  <div>
                    <h3 className="text-xs font-black uppercase tracking-wider text-zinc-400 flex items-center gap-2 mb-3">
                      <Terminal size={14} className="text-red-500 animate-pulse" /> Live Agent dispatch logs
                    </h3>
                    <div className="bg-zinc-950 border border-zinc-900 rounded-xl p-3 font-mono text-[10px] text-zinc-400 h-44 overflow-y-auto space-y-1.5 scrollbar-thin">
                      {liveLogs.map((log, index) => {
                        let colorClass = 'text-zinc-400';
                        if (log.includes('[SYSTEM CORE]')) colorClass = 'text-red-400 font-bold';
                        else if (log.includes('[DISPATCHER')) colorClass = 'text-blue-400';
                        else if (log.includes('complete') || log.includes('attribution') || log.includes('Success')) colorClass = 'text-emerald-400';
                        return (
                          <div key={index} className={`${colorClass} leading-relaxed break-all`}>
                            {log}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                  <div className="mt-4 pt-3 border-t border-zinc-900 flex justify-between items-center text-[9px] font-black text-zinc-500 uppercase tracking-widest">
                    <span>STATUS: LIVE WORKER SHIFTING</span>
                    <span className="flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-ping" /> SCANNING QUEUE
                    </span>
                  </div>
                </div>

              </div>

              {/* DYNAMIC SYSTEM INSIGHTS POWERED BY GEMINI */}
              <div className="bg-[#0b0b0e] border border-zinc-850 rounded-2xl p-5 space-y-4">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-lg bg-red-950/40 border border-red-900 flex items-center justify-center text-red-500">
                    <Sparkles size={12} />
                  </div>
                  <h3 className="text-xs font-black uppercase text-white tracking-wider">Dynamic Strategic Insights (Autonomous Agent Intelligence)</h3>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-zinc-950 border border-zinc-850 p-4 rounded-xl flex items-start gap-3 relative group hover:border-zinc-700 transition-all">
                    <div className="p-2 bg-amber-500/10 text-amber-500 rounded-lg shrink-0"><AlertTriangle size={16} /></div>
                    <div className="space-y-1">
                      <span className="text-[10px] bg-amber-500/10 text-amber-500 px-2 py-0.5 rounded font-bold uppercase">Competitive Threat Detected</span>
                      <h4 className="text-xs font-bold text-white mt-1">SEO citation drop on "SaaS boilerplates"</h4>
                      <p className="text-[11px] text-zinc-400 leading-relaxed">OmniSEO Core recently increased backlink citations on primary developer search queries, dropping our Answer Engine citation from 54% to 42%.</p>
                      <button 
                        onClick={() => {
                          handleHijackCluster('OmniSEO Core');
                        }}
                        className="text-[10px] text-red-400 hover:text-red-300 font-extrabold flex items-center gap-1 mt-2 cursor-pointer"
                      >
                        Deploy GEO Hijack Counter-Campaign <ChevronRight size={10} />
                      </button>
                    </div>
                  </div>

                  <div className="bg-zinc-950 border border-zinc-850 p-4 rounded-xl flex items-start gap-3 relative group hover:border-zinc-700 transition-all">
                    <div className="p-2 bg-emerald-500/10 text-emerald-500 rounded-lg shrink-0"><TrendingUp size={16} /></div>
                    <div className="space-y-1">
                      <span className="text-[10px] bg-emerald-500/10 text-emerald-500 px-2 py-0.5 rounded font-bold uppercase">Growth Opportunity Discovered</span>
                      <h4 className="text-xs font-bold text-white mt-1">High-Intent Semantic Gap Found</h4>
                      <p className="text-[11px] text-zinc-400 leading-relaxed">Organic cluster keyword "Generative search optimizations SaaS" shows high search volume with low competition difficulty. Click below to draft an automated sequence.</p>
                      <button 
                        onClick={() => {
                          setActiveTab('content');
                          setTitleSeedTopic('Generative search optimizations SaaS');
                          toast.success('Topic queued into Content Generator!');
                        }}
                        className="text-[10px] text-red-400 hover:text-red-300 font-extrabold flex items-center gap-1 mt-2 cursor-pointer"
                      >
                        Generate Semantic Content Brief <ChevronRight size={10} />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ========================================== */}
          {/* TAB: V3 ENTERPRISE CORE                   */}
          {/* ========================================== */}
          {activeTab === 'enterprise' && (
            <div className="animate-fade-in">
              <RankticaEnterprisePortal />
            </div>
          )}

          {/* ========================================== */}
          {/* TAB 2: AI WORKFORCE                         */}
          {/* ========================================== */}
          {activeTab === 'workforce' && (
            <div className="space-y-6 animate-fade-in">
              <AIEmployeeOS />
            </div>
          )}

          {/* ========================================== */}
          {/* TAB 3: CAMPAIGN INTELLIGENCE               */}
          {/* ========================================== */}
          {activeTab === 'campaigns' && (
            <div className="space-y-6 animate-fade-in">
              <div className="flex justify-between items-center pb-2 border-b border-zinc-900">
                <div>
                  <h2 className="text-xl font-black text-white uppercase tracking-tight">Campaign Intelligence Pipeline</h2>
                  <p className="text-xs text-zinc-400">Launch and track search authority campaign runs through the 7-stage optimization sequence.</p>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                
                {/* Deployment configuration form */}
                <div className="lg:col-span-4 bg-[#0b0b0e] border border-zinc-850 p-5 rounded-2xl h-fit">
                  <h3 className="text-xs font-black uppercase text-zinc-300 flex items-center gap-2 pb-2.5 border-b border-zinc-900 mb-4">
                    <Zap size={14} className="text-red-500 animate-pulse" /> Deploy New Search Campaign
                  </h3>
                  
                  <form onSubmit={handleCreateCampaign} className="space-y-3">
                    <div>
                      <label className="block text-[9px] font-bold text-zinc-500 uppercase mb-1">Campaign Title</label>
                      <input
                        type="text"
                        value={newCampaignName}
                        onChange={(e) => setNewCampaignName(e.target.value)}
                        placeholder="SaaS Scale campaign"
                        className="w-full bg-zinc-950 border border-zinc-850 rounded-xl p-3 text-xs text-zinc-200 focus:outline-none focus:border-red-500 transition-all"
                      />
                    </div>
                    <div>
                      <label className="block text-[9px] font-bold text-zinc-500 uppercase mb-1">Target Website URL</label>
                      <input
                        type="text"
                        value={newCampaignUrl}
                        onChange={(e) => setNewCampaignUrl(e.target.value)}
                        placeholder="https://joinranktica.com"
                        className="w-full bg-zinc-950 border border-zinc-850 rounded-xl p-3 text-xs text-zinc-200 focus:outline-none focus:border-red-500 transition-all font-mono"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[9px] font-bold text-zinc-500 uppercase mb-1">Niche Semantic Focus</label>
                        <input
                          type="text"
                          value={newCampaignNiche}
                          onChange={(e) => setNewCampaignNiche(e.target.value)}
                          className="w-full bg-zinc-950 border border-zinc-850 rounded-xl p-3 text-xs text-zinc-200 focus:outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-[9px] font-bold text-zinc-500 uppercase mb-1">Target Audience</label>
                        <input
                          type="text"
                          value={newCampaignAudience}
                          onChange={(e) => setNewCampaignAudience(e.target.value)}
                          className="w-full bg-zinc-950 border border-zinc-850 rounded-xl p-3 text-xs text-zinc-200 focus:outline-none"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-[9px] font-bold text-zinc-500 uppercase mb-1">Allocated Monthly Budget ($)</label>
                      <input
                        type="number"
                        value={newCampaignBudget}
                        onChange={(e) => setNewCampaignBudget(Number(e.target.value))}
                        className="w-full bg-zinc-950 border border-zinc-850 rounded-xl p-3 text-xs text-zinc-200 focus:outline-none"
                      />
                    </div>

                    <button
                      type="submit"
                      className="w-full py-3 bg-gradient-to-r from-red-600 to-orange-500 hover:from-red-500 hover:to-orange-400 text-white font-black text-xs uppercase tracking-wider rounded-xl transition-all shadow-lg flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <Play size={12} fill="white" /> Dispatch Campaign Core
                    </button>
                  </form>
                </div>

                {/* Campaigns List and 7-stage visualization */}
                <div className="lg:col-span-8 space-y-6">
                  
                  {/* Campaign List */}
                  <div className="bg-[#0b0b0e] border border-zinc-850 p-5 rounded-2xl space-y-4">
                    <h3 className="text-xs font-black uppercase text-zinc-300 flex justify-between items-center pb-2 border-b border-zinc-900">
                      <span>Active Orchestrator Campaigns</span>
                      <span className="text-[10px] font-mono text-zinc-500">{campaigns.length} campaigns</span>
                    </h3>

                    <div className="space-y-3">
                      {campaigns.map(camp => (
                        <div key={camp.id} className="p-4 bg-zinc-950 border border-zinc-850 rounded-xl space-y-3">
                          <div className="flex justify-between items-center">
                            <div>
                              <h4 className="text-xs font-extrabold text-white">{camp.name}</h4>
                              <p className="text-[10px] text-zinc-500 font-mono">{camp.url}</p>
                            </div>

                            <div className="flex items-center gap-3">
                              <span className={`text-[8px] uppercase font-black px-2 py-0.5 rounded-full border ${
                                camp.status === 'Active' 
                                  ? 'bg-emerald-950/30 border-emerald-900/40 text-emerald-400'
                                  : camp.status === 'Completed'
                                  ? 'bg-blue-950/30 border-blue-900/40 text-blue-400'
                                  : 'bg-zinc-900 border-zinc-800 text-zinc-500'
                              }`}>
                                {camp.status}
                              </span>

                              <button
                                onClick={() => handleStepForwardCampaign(camp.id)}
                                className="px-2.5 py-1 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-300 text-[9px] font-bold uppercase rounded transition-all cursor-pointer"
                              >
                                Step Stage
                              </button>
                            </div>
                          </div>

                          {/* 7-STAGE PROGRESS STEPPER */}
                          <div className="space-y-1.5">
                            <div className="flex justify-between text-[8px] font-black uppercase text-zinc-500">
                              <span>Stage {camp.currentStage}/7: {[
                                '',
                                'Website Analysis',
                                'SEO Diagnosis',
                                'Strategy Generation',
                                'Content Creation',
                                'Learning Alignment',
                                'Attribution Measurement',
                                'GEO Syndication'
                              ][camp.currentStage]}</span>
                              <span className="text-red-500">SEO Score: {camp.seoScore}%</span>
                            </div>
                            <div className="grid grid-cols-7 gap-1">
                              {[1, 2, 3, 4, 5, 6, 7].map(stageIdx => {
                                const isCurrent = stageIdx === camp.currentStage;
                                const isCompleted = stageIdx < camp.currentStage;
                                return (
                                  <div
                                    key={stageIdx}
                                    className={`h-2 rounded-full transition-all duration-500 ${
                                      isCurrent 
                                        ? 'bg-gradient-to-r from-red-600 to-orange-500 shadow-md shadow-red-950/20' 
                                        : isCompleted 
                                        ? 'bg-red-900/60' 
                                        : 'bg-zinc-900'
                                    }`}
                                    title={`Stage ${stageIdx}`}
                                  />
                                );
                              })}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

              </div>
            </div>
          )}

          {/* ========================================== */}
          {/* TAB 4: SEO INTELLIGENCE                   */}
          {/* ========================================== */}
          {activeTab === 'seo' && (
            <div className="space-y-6 animate-fade-in">
              <div className="flex justify-between items-center pb-2 border-b border-zinc-900">
                <div>
                  <h2 className="text-xl font-black text-white uppercase tracking-tight">Generative SEO & Citation Intelligence</h2>
                  <p className="text-xs text-zinc-400">Examine generative citation engines (GEO + AEO) targeting core model answer indexes.</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                
                {/* Generative Citations */}
                <div className="bg-[#0b0b0e] border border-zinc-850 p-5 rounded-2xl space-y-4">
                  <h3 className="text-xs font-black uppercase tracking-wider text-zinc-300 flex items-center gap-2">
                    <Search size={14} className="text-red-500" /> Citation Shares Across Generative Engines
                  </h3>
                  
                  <div className="space-y-4">
                    {[
                      { engine: 'Gemini Search Citation', share: 58, color: 'bg-blue-500' },
                      { engine: 'Perplexity Answer citation', share: 42, color: 'bg-teal-500' },
                      { engine: 'OpenAI SearchGPT references', share: 31, color: 'bg-emerald-500' },
                      { engine: 'Microsoft Copilot answers', share: 24, color: 'bg-violet-500' },
                    ].map((row, i) => (
                      <div key={i} className="space-y-1.5">
                        <div className="flex justify-between text-xs font-bold">
                          <span className="text-zinc-300">{row.engine}</span>
                          <span className="text-white font-mono">{row.share}% citation</span>
                        </div>
                        <div className="w-full bg-zinc-950 h-2 rounded-full overflow-hidden">
                          <div className={`h-full ${row.color}`} style={{ width: `${row.share}%` }} />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Semantic Keyword Clusters */}
                <div className="bg-[#0b0b0e] border border-zinc-850 p-5 rounded-2xl space-y-4">
                  <h3 className="text-xs font-black uppercase tracking-wider text-zinc-300">
                    High Priority Hijackable Keyword Targets
                  </h3>

                  <div className="space-y-2">
                    {[
                      { keyword: 'SaaS organic growth pipeline', vol: '12.4K', competition: 'Low', citationPotential: 89 },
                      { keyword: 'autonomous AI SEO workflow', vol: '4.8K', competition: 'Medium', citationPotential: 92 },
                      { keyword: 'generative engine optimization models', vol: '1.2K', competition: 'Low', citationPotential: 98 },
                      { keyword: 'AEO structured schema rich answers', vol: '800', competition: 'Low', citationPotential: 95 },
                    ].map((row, i) => (
                      <div key={i} className="p-3 bg-zinc-950 rounded-xl border border-zinc-900 flex justify-between items-center">
                        <div>
                          <h4 className="text-xs font-black text-white">{row.keyword}</h4>
                          <span className="text-[10px] text-zinc-500">Vol: {row.vol} • Comp: {row.competition}</span>
                        </div>
                        <span className="text-xs font-bold text-red-500 bg-red-950/20 px-2.5 py-1 rounded-lg">
                          {row.citationPotential}% Citation Est
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

              </div>
            </div>
          )}

          {/* ========================================== */}
          {/* TAB 5: CONTENT INTELLIGENCE                */}
          {/* ========================================== */}
          {activeTab === 'content' && (
            <div className="space-y-6 animate-fade-in">
              <div className="flex justify-between items-center pb-2 border-b border-zinc-900">
                <div>
                  <h2 className="text-xl font-black text-white uppercase tracking-tight">Content Authority Intelligence</h2>
                  <p className="text-xs text-zinc-400">Generate high click-through-rate title predictions and copy models vetted by our neural RLHF simulator.</p>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                
                {/* Seed Topic Sandbox */}
                <div className="lg:col-span-5 bg-[#0b0b0e] border border-zinc-850 p-5 rounded-2xl h-fit">
                  <h3 className="text-xs font-black uppercase tracking-wider text-zinc-300 flex items-center gap-2 mb-4">
                    <Sparkles size={14} className="text-red-500" /> CTR Optimization Sandbox
                  </h3>

                  <form onSubmit={handleGenerateTitles} className="space-y-4">
                    <div>
                      <label className="block text-[10px] font-bold text-zinc-500 uppercase mb-1.5">Topic Seed / Keywords</label>
                      <input
                        type="text"
                        value={titleSeedTopic}
                        onChange={(e) => setTitleSeedTopic(e.target.value)}
                        placeholder="E.g. scaling SaaS conversion"
                        className="w-full bg-zinc-950 border border-zinc-850 rounded-xl p-3 text-xs text-zinc-200 focus:outline-none focus:border-red-500 transition-all font-mono"
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={isGeneratingTitles}
                      className="w-full py-3 bg-red-600 hover:bg-red-500 text-white font-black text-xs uppercase tracking-wider rounded-xl transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer"
                    >
                      {isGeneratingTitles ? 'Running RLHF Predictor...' : 'Predict High-CTR Variations'}
                    </button>
                  </form>
                </div>

                {/* Simulated CTR results list */}
                <div className="lg:col-span-7 bg-[#0b0b0e] border border-zinc-850 p-5 rounded-2xl space-y-4">
                  <h3 className="text-xs font-black uppercase text-zinc-300">
                    Predicted Title CTR Output
                  </h3>

                  {generatedTitles.length === 0 ? (
                    <div className="py-12 text-center text-zinc-550 text-xs italic">
                      Enter a seed topic on the left to run our neural predicted performance simulator.
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {generatedTitles.map((item, index) => (
                        <div key={index} className="p-4 bg-zinc-950 border border-zinc-850 rounded-xl space-y-2 relative group hover:border-zinc-700 transition-all">
                          <span className="text-[8px] bg-red-950/40 text-red-400 border border-red-900/60 px-2 py-0.5 rounded font-black uppercase">
                            {item.tone}
                          </span>
                          <h4 className="text-xs font-black text-white">{item.title}</h4>
                          <div className="flex justify-between text-[10px] text-zinc-500 mt-2 font-semibold">
                            <span>Predicted CTR: <span className="text-emerald-400 font-bold">{item.ctr}%</span></span>
                            <span>RLHF Confidence: <span className="text-white">{item.confidence}%</span></span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

              </div>
            </div>
          )}

          {/* ========================================== */}
          {/* TAB 6: COMPETITOR INTELLIGENCE             */}
          {/* ========================================== */}
          {activeTab === 'competitor' && (
            <div className="space-y-6 animate-fade-in">
              <div className="flex justify-between items-center pb-2 border-b border-zinc-900">
                <div>
                  <h2 className="text-xl font-black text-white uppercase tracking-tight">Competitor Hijack & Spy Network</h2>
                  <p className="text-xs text-zinc-400">Map organic citation gaps and deploy target content campaigns to intercept competitor traffic.</p>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                
                {/* Competitors organic metrics */}
                <div className="lg:col-span-7 bg-[#0b0b0e] border border-zinc-850 p-5 rounded-2xl space-y-4">
                  <h3 className="text-xs font-black uppercase text-zinc-300">
                    Tracked Domain Profiles
                  </h3>

                  <div className="space-y-3">
                    {competitors.map((competitor, index) => (
                      <div key={index} className="p-4 bg-zinc-950 border border-zinc-850 rounded-xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                        <div>
                          <h4 className="text-xs font-extrabold text-white">{competitor.name}</h4>
                          <span className="text-[10px] text-zinc-500 font-mono">{competitor.url}</span>
                        </div>

                        <div className="flex flex-wrap gap-4 text-xs font-semibold">
                          <div className="text-zinc-500 text-[10px]">
                            <span>Organic traffic: </span>
                            <span className="text-white font-mono">{competitor.organicTraffic.toLocaleString()}</span>
                          </div>
                          <div className="text-zinc-500 text-[10px]">
                            <span>Keywords count: </span>
                            <span className="text-white font-mono">{competitor.keywordsCount.toLocaleString()}</span>
                          </div>
                          <div className="text-zinc-500 text-[10px]">
                            <span>Share of Voice: </span>
                            <span className="text-red-400 font-mono">{(competitor.shareOfVoice).toFixed(1)}%</span>
                          </div>
                        </div>

                        <button
                          onClick={() => handleHijackCluster(competitor.name)}
                          className="px-3 py-1.5 bg-red-600 hover:bg-red-500 text-white text-[10px] font-black uppercase rounded-lg transition-all cursor-pointer shadow-md"
                        >
                          Hijack Cluster
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Competitor SOV Pie Graphic */}
                <div className="lg:col-span-5 bg-[#0b0b0e] border border-zinc-850 p-5 rounded-2xl flex flex-col justify-between">
                  <div>
                    <h3 className="text-xs font-black uppercase tracking-wider text-zinc-300 mb-4">
                      Est. Industry Share of Voice (SOV %)
                    </h3>
                    
                    {/* SVG Pie Chart visualization */}
                    <div className="flex justify-center py-2">
                      <svg viewBox="0 0 160 160" className="w-36 h-36">
                        {/* Custom segments mapping */}
                        <circle cx="80" cy="80" r="60" fill="transparent" stroke="#27272a" strokeWidth="20" />
                        
                        {/* OmniSEO (42.5%) */}
                        <circle cx="80" cy="80" r="60" fill="transparent" stroke="#ef4444" strokeWidth="20" strokeDasharray="160 376" strokeDashoffset="0" />
                        
                        {/* SaaSFlow (38.4%) */}
                        <circle cx="80" cy="80" r="60" fill="transparent" stroke="#10b981" strokeWidth="20" strokeDasharray="144 376" strokeDashoffset="-160" />
                        
                        {/* ContentForge & Ranktica */}
                        <circle cx="80" cy="80" r="60" fill="transparent" stroke="#3b82f6" strokeWidth="20" strokeDasharray="72 376" strokeDashoffset="-304" />
                      </svg>
                    </div>
                  </div>

                  <div className="space-y-2 mt-4 pt-4 border-t border-zinc-900 text-[10px] font-bold text-zinc-400">
                    <div className="flex justify-between items-center">
                      <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-red-500" /> OmniSEO Core</span>
                      <span>42.5% SOV</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-emerald-500" /> SaaSFlow Analytics</span>
                      <span>38.4% SOV</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-blue-500" /> ContentForge & Ranktica</span>
                      <span>19.1% SOV</span>
                    </div>
                  </div>
                </div>

              </div>
            </div>
          )}

          {/* ========================================== */}
          {/* TAB 7: REVENUE ANALYTICS                  */}
          {/* ========================================== */}
          {activeTab === 'revenue' && (
            <div className="space-y-6 animate-fade-in">
              <div className="flex justify-between items-center pb-2 border-b border-zinc-900">
                <div>
                  <h2 className="text-xl font-black text-white uppercase tracking-tight">Organic Pipeline Revenue Attributions</h2>
                  <p className="text-xs text-zinc-400">Simulate search acquisition impact on attributed monthly recurring revenue (MRR).</p>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                
                {/* Attributed Organic ROI Estimator Sliders */}
                <div className="lg:col-span-6 bg-[#0b0b0e] border border-zinc-850 p-5 rounded-2xl space-y-4">
                  <h3 className="text-xs font-black uppercase tracking-wider text-zinc-300 flex items-center gap-2">
                    <DollarSign size={14} className="text-emerald-500" /> Organic ROI Attributer Tool
                  </h3>

                  <div className="space-y-4">
                    <div>
                      <div className="flex justify-between text-xs font-semibold mb-1">
                        <span className="text-zinc-400">Monthly Organic Traffic</span>
                        <span className="text-white font-mono">{roiTraffic.toLocaleString()} visitors</span>
                      </div>
                      <input
                        type="range"
                        min="5000"
                        max="200000"
                        step="5000"
                        value={roiTraffic}
                        onChange={(e) => setRoiTraffic(Number(e.target.value))}
                        className="w-full accent-emerald-500 cursor-pointer h-1 bg-zinc-800 rounded-lg"
                      />
                    </div>

                    <div>
                      <div className="flex justify-between text-xs font-semibold mb-1">
                        <span className="text-zinc-400">Conversion Rate (%)</span>
                        <span className="text-white font-mono">{roiConversion}% conversion</span>
                      </div>
                      <input
                        type="range"
                        min="0.5"
                        max="8"
                        step="0.1"
                        value={roiConversion}
                        onChange={(e) => setRoiConversion(Number(e.target.value))}
                        className="w-full accent-emerald-500 cursor-pointer h-1 bg-zinc-800 rounded-lg"
                      />
                    </div>

                    <div>
                      <div className="flex justify-between text-xs font-semibold mb-1">
                        <span className="text-zinc-400">Average Customer LTV ($)</span>
                        <span className="text-white font-mono">${roiLtv} LTV</span>
                      </div>
                      <input
                        type="range"
                        min="20"
                        max="500"
                        step="10"
                        value={roiLtv}
                        onChange={(e) => setRoiLtv(Number(e.target.value))}
                        className="w-full accent-emerald-500 cursor-pointer h-1 bg-zinc-800 rounded-lg"
                      />
                    </div>
                  </div>
                </div>

                {/* Return Output */}
                <div className="lg:col-span-6 bg-[#0b0b0e] border border-zinc-850 p-6 rounded-2xl flex flex-col justify-between relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-36 h-36 bg-emerald-600/5 rounded-full filter blur-2xl" />
                  
                  <div>
                    <span className="text-[10px] font-black uppercase text-zinc-500 tracking-wider">Estimated Monthly Organic Value</span>
                    <h3 className="text-4xl font-black text-emerald-400 mt-2 font-mono">
                      ${calculatedOrganicValue.toLocaleString()}
                    </h3>
                    <p className="text-xs text-zinc-400 mt-2 leading-relaxed">
                      This calculation estimates your MRR value additions based on organic visitor search captures, using the active customer lifetime value index.
                    </p>
                  </div>

                  <div className="pt-4 border-t border-zinc-900 mt-4 flex items-center gap-2">
                    <Shield size={14} className="text-emerald-500" />
                    <span className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest">Calculated organic value has been certified</span>
                  </div>
                </div>

              </div>
            </div>
          )}

          {/* ========================================== */}
          {/* TAB 8: AI COST ANALYTICS                  */}
          {/* ========================================== */}
          {activeTab === 'cost' && (
            <div className="space-y-6 animate-fade-in">
              <div className="flex justify-between items-center pb-2 border-b border-zinc-900">
                <div>
                  <h2 className="text-xl font-black text-white uppercase tracking-tight">AI Compute Cost & Token Analytics</h2>
                  <p className="text-xs text-zinc-400">Track real-time spend across Gemini API models with proactive budget governance limit controllers.</p>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                
                {/* Model spend bars */}
                <div className="lg:col-span-7 bg-[#0b0b0e] border border-zinc-850 p-5 rounded-2xl space-y-4">
                  <h3 className="text-xs font-black uppercase tracking-wider text-zinc-300">
                    Attributed spend across Models
                  </h3>

                  <div className="space-y-4">
                    {[
                      { model: 'Gemini 2.5 Flash', usage: '1.4B tokens', cost: 184.22 },
                      { model: 'Gemini 1.5 Pro', usage: '820M tokens', cost: 124.50 },
                      { model: 'Imagen 3 Design', usage: '12K images', cost: 65.00 },
                      { model: 'Whisper Audio Narration', usage: '140 hrs', cost: 10.40 },
                    ].map((row, i) => (
                      <div key={i} className="flex justify-between items-center p-3 bg-zinc-950 rounded-xl border border-zinc-900">
                        <div>
                          <h4 className="text-xs font-bold text-white">{row.model}</h4>
                          <span className="text-[10px] text-zinc-500 font-mono">Usage: {row.usage}</span>
                        </div>
                        <span className="text-xs font-bold text-white font-mono">
                          ${row.cost.toFixed(2)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Budget Limit controls */}
                <div className="lg:col-span-5 bg-[#0b0b0e] border border-zinc-850 p-5 rounded-2xl space-y-4 flex flex-col justify-between">
                  <div>
                    <h3 className="text-xs font-black uppercase tracking-wider text-zinc-300 mb-4">
                      Budget Sentinel Governance Settings
                    </h3>

                    <div className="space-y-4 text-xs">
                      <div className="flex justify-between items-center p-3 bg-zinc-950 rounded-xl border border-zinc-900">
                        <div>
                          <p className="font-bold text-white">Hard Spend Autoguard</p>
                          <p className="text-[9px] text-zinc-500 mt-0.5">Toggle hard limit execution blockers</p>
                        </div>
                        <button
                          onClick={() => {
                            setAutogardEnabled(!autogardEnabled);
                            toast.success(`Spend Autoguard ${!autogardEnabled ? 'Enabled' : 'Disabled'}`);
                          }}
                          className={`w-10 h-6 rounded-full transition-all flex items-center p-1 cursor-pointer ${
                            autogardEnabled ? 'bg-red-600 justify-end' : 'bg-zinc-800 justify-start'
                          }`}
                        >
                          <span className="w-4 h-4 rounded-full bg-white block" />
                        </button>
                      </div>

                      <div className="p-3 bg-zinc-950 rounded-xl border border-zinc-900 space-y-2">
                        <div className="flex justify-between font-bold">
                          <span className="text-zinc-400">Hard Cost Budget Limit</span>
                          <span className="text-white">${costBudgetLimit} / mo</span>
                        </div>
                        <input
                          type="range"
                          min="500"
                          max="5000"
                          step="250"
                          value={costBudgetLimit}
                          onChange={(e) => setCostBudgetLimit(Number(e.target.value))}
                          className="w-full accent-red-600 cursor-pointer h-1 bg-zinc-800 rounded-lg"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="p-4 bg-emerald-950/20 border border-emerald-900/60 rounded-xl text-[11px] text-emerald-400 leading-relaxed mt-2 flex gap-2">
                    <Info size={14} className="shrink-0 mt-0.5" />
                    <div>
                      <span className="font-bold block uppercase text-[10px] mb-0.5">Prompt Caching Yields</span>
                      Prompt caching enabled. Saving estimate of <span className="font-black text-white">$7,240.50</span> compute costs MoM.
                    </div>
                  </div>
                </div>

              </div>
            </div>
          )}

          {/* ========================================================= */}
          {/* 4. ENTERPRISE REST API SPECIFICATION CATALOG              */}
          {/* ========================================== */}
          <div className="bg-[#0b0b0e] border border-zinc-850 rounded-2xl p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-900">
              <div className="flex items-center gap-2">
                <Code size={18} className="text-red-500 animate-pulse" />
                <div>
                  <h3 className="text-sm font-black uppercase text-white tracking-wider">Enterprise Developer API Specifications</h3>
                  <p className="text-[10px] text-zinc-500">REST system contract specs for integrating modules with external SaaS endpoints.</p>
                </div>
              </div>
              <span className="text-[9px] bg-zinc-900 text-zinc-400 px-2 py-0.5 rounded font-mono uppercase border border-zinc-800">
                HTTPS v1.0 CONTRACTS
              </span>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              
              {/* API CARD 1: Executive Overview */}
              <div className="space-y-2">
                <div className="flex justify-between items-center text-xs font-bold text-zinc-300">
                  <span className="flex items-center gap-1.5"><span className="text-[10px] bg-zinc-900 text-zinc-400 px-1.5 py-0.5 rounded border border-zinc-800 uppercase font-mono">GET</span> Overview Spec</span>
                  <button 
                    onClick={() => handleCopyCode('spec-1', apiSchemas.overview.response)}
                    className="p-1 hover:bg-zinc-900 rounded transition-all cursor-pointer text-zinc-500 hover:text-white"
                  >
                    {copiedCodeId === 'spec-1' ? <Check size={13} className="text-emerald-500" /> : <Copy size={13} />}
                  </button>
                </div>
                <div className="bg-zinc-950 p-3 rounded-xl border border-zinc-900 font-mono text-[9px] text-zinc-400 space-y-2 h-44 overflow-y-auto scrollbar-none select-all">
                  <div className="text-emerald-400 font-bold">{apiSchemas.overview.method} {apiSchemas.overview.url}</div>
                  <div>Headers: <span className="text-zinc-500">{apiSchemas.overview.headers}</span></div>
                  <div>Response: <span className="text-zinc-500">{apiSchemas.overview.response}</span></div>
                </div>
              </div>

              {/* API CARD 2: Workforce Override */}
              <div className="space-y-2">
                <div className="flex justify-between items-center text-xs font-bold text-zinc-300">
                  <span className="flex items-center gap-1.5"><span className="text-[10px] bg-red-950 text-red-400 px-1.5 py-0.5 rounded border border-red-900 uppercase font-mono">POST</span> Workforce Override</span>
                  <button 
                    onClick={() => handleCopyCode('spec-2', apiSchemas.workforce.body)}
                    className="p-1 hover:bg-zinc-900 rounded transition-all cursor-pointer text-zinc-500 hover:text-white"
                  >
                    {copiedCodeId === 'spec-2' ? <Check size={13} className="text-emerald-500" /> : <Copy size={13} />}
                  </button>
                </div>
                <div className="bg-zinc-950 p-3 rounded-xl border border-zinc-900 font-mono text-[9px] text-zinc-400 space-y-2 h-44 overflow-y-auto scrollbar-none select-all">
                  <div className="text-red-400 font-bold">{apiSchemas.workforce.method} {apiSchemas.workforce.url}</div>
                  <div>Request Body: <span className="text-zinc-500">{apiSchemas.workforce.body}</span></div>
                  <div>Response: <span className="text-zinc-500">{apiSchemas.workforce.response}</span></div>
                </div>
              </div>

              {/* API CARD 3: Campaign Dispatch */}
              <div className="space-y-2">
                <div className="flex justify-between items-center text-xs font-bold text-zinc-300">
                  <span className="flex items-center gap-1.5"><span className="text-[10px] bg-red-950 text-red-400 px-1.5 py-0.5 rounded border border-red-900 uppercase font-mono">POST</span> Campaign Deploy</span>
                  <button 
                    onClick={() => handleCopyCode('spec-3', apiSchemas.campaigns.body)}
                    className="p-1 hover:bg-zinc-900 rounded transition-all cursor-pointer text-zinc-500 hover:text-white"
                  >
                    {copiedCodeId === 'spec-3' ? <Check size={13} className="text-emerald-500" /> : <Copy size={13} />}
                  </button>
                </div>
                <div className="bg-zinc-950 p-3 rounded-xl border border-zinc-900 font-mono text-[9px] text-zinc-400 space-y-2 h-44 overflow-y-auto scrollbar-none select-all">
                  <div className="text-red-400 font-bold">{apiSchemas.campaigns.method} {apiSchemas.campaigns.url}</div>
                  <div>Request Body: <span className="text-zinc-500">{apiSchemas.campaigns.body}</span></div>
                  <div>Response: <span className="text-zinc-500">{apiSchemas.campaigns.response}</span></div>
                </div>
              </div>

            </div>
          </div>

        </main>
      </div>

    </div>
  );
};
