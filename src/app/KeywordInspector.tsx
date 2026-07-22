import React, { useState } from 'react';
import { inspectKeyword } from '@/infrastructure/gemini';
import { KeywordMetrics, DiscoverQuery, SemanticClusterItem, EntityGraphNode, EntityGraphEdge, GeoPlatform, CompetitorData } from '@/shared/types';
import { motion, AnimatePresence } from "motion/react";
import { 
  Loader2, 
  Search, 
  TrendingUp, 
  Layers, 
  ArrowRight, 
  BrainCircuit, 
  Award, 
  Copy, 
  Check, 
  Zap, 
  DollarSign, 
  BarChart3, 
  ShieldCheck, 
  HardDrive, 
  Sparkles, 
  Network, 
  Bot, 
  Cpu, 
  Eye, 
  BookOpen, 
  LineChart, 
  Users, 
  FileText, 
  Settings, 
  ChevronRight, 
  HelpCircle, 
  Calendar, 
  Activity, 
  Flame, 
  Coins, 
  Shuffle, 
  Database,
  ArrowUpRight,
  MapPin,
  Clock,
  ExternalLink,
  Lock,
  Globe,
  Share2,
  ListFilter
} from 'lucide-react';

export const KeywordInspector: React.FC = () => {
  const [keyword, setKeyword] = useState('');
  const [metrics, setMetrics] = useState<KeywordMetrics | null>(null);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'discovery' | 'semantic' | 'geo' | 'aeo' | 'competitors' | 'predictive' | 'trends' | 'pillar' | 'governance' | 'roadmap'>('overview');
  
  // Interactive semantic state
  const [hoveredNode, setHoveredNode] = useState<string | null>(null);
  const [selectedPlatform, setSelectedPlatform] = useState<string>('ChatGPT');
  const [forecastMetric, setForecastMetric] = useState<'volume' | 'cpc' | 'ranking' | 'traffic'>('volume');
  
  // SaaS Configurator state
  const [isMultiTenant, setIsMultiTenant] = useState(true);
  const [usageLimit, setUsageLimit] = useState(100);
  const [whiteLabelName, setWhiteLabelName] = useState('Ranktica Workspace');

  // Provider abstraction layer connectivity states
  const providers = [
    { name: 'Google Search Console', connected: true, latency: '45ms' },
    { name: 'Google Analytics V4', connected: true, latency: '52ms' },
    { name: 'Google Trends API', connected: true, latency: '88ms' },
    { name: 'Google Keyword Planner', connected: true, latency: '120ms' },
    { name: 'Bing Webmaster Tools', connected: false, latency: '--' },
    { name: 'Ahrefs API Adapter', connected: true, latency: '240ms' },
    { name: 'SEMrush API Adapter', connected: false, latency: '--' },
    { name: 'DataForSEO Adapter', connected: true, latency: '310ms' },
    { name: 'SerpAPI Connector', connected: true, latency: '150ms' },
    { name: 'Perplexity API Gateway', connected: true, latency: '420ms' },
    { name: 'OpenAI API Proxy', connected: true, latency: '280ms' },
    { name: 'Gemini Vertex API', connected: true, latency: '95ms' },
  ];

  const handleInspect = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!keyword.trim()) return;
    setLoading(true);
    try {
      const result = await inspectKeyword(keyword);
      setMetrics(result);
    } catch (err) {
      console.error(err);
      alert("AI Search Intelligence scan failed.");
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopied(id);
    setTimeout(() => setCopied(null), 2000);
  };

  const getScoreColor = (score: number) => {
    if (score >= 85) return 'text-emerald-400 border-emerald-500/20 bg-emerald-500/5';
    if (score >= 60) return 'text-indigo-400 border-indigo-500/20 bg-indigo-500/5';
    return 'text-red-400 border-red-500/20 bg-red-500/5';
  };

  const getDifficultyColor = (score: number) => {
    if (score >= 70) return 'text-red-400 bg-red-500/10 border border-red-500/20';
    if (score >= 40) return 'text-orange-400 bg-orange-500/10 border border-orange-500/20';
    return 'text-emerald-400 bg-emerald-500/10 border border-emerald-500/20';
  };

  return (
    <div className="max-w-7xl mx-auto space-y-12 animate-fade-in pb-24 px-4 sm:px-6 lg:px-8">
      {/* 1. HEADER HERO */}
      <div className="text-center space-y-4 py-6">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-red-600/10 border border-red-600/20 text-red-500 text-[10px] uppercase font-black tracking-widest shadow-lg">
          <Bot size={12} className="animate-pulse text-red-500" />
          <span>Multimodal Live Intelligence Engine</span>
        </div>
        <h2 className="text-5xl md:text-6xl font-black bg-gradient-to-br from-white via-zinc-200 to-zinc-700 bg-clip-text text-transparent tracking-tighter">
          Search Intelligence Command Center
        </h2>
        <p className="text-zinc-400 text-base md:text-lg max-w-3xl mx-auto font-medium">
          Surpass traditional SEO models. Audit and forecast visibility metrics across Google SERPs, AI Answer Engines (AEO), and LLM Citation Platforms (GEO) utilizing multi-model routing.
        </p>
      </div>

      {/* 2. LIVE AGENTS ORCHESTRATION BANNER */}
      <div className="bg-zinc-900/60 border border-zinc-800 rounded-3xl p-6 shadow-2xl relative overflow-hidden group">
        <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity">
          <Network size={120} className="text-red-500" />
        </div>
        <h4 className="text-[10px] font-black text-red-500 uppercase tracking-widest mb-4 flex items-center gap-1.5">
          <Bot size={13} /> Active Campaign Intelligence Experts
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-4 bg-zinc-950/80 border border-zinc-800/80 rounded-2xl flex gap-3">
            <div className="p-2 bg-indigo-500/10 rounded-xl text-indigo-400 h-10 w-10 flex items-center justify-center shrink-0">
              <Cpu size={18} />
            </div>
            <div className="min-w-0">
              <p className="text-[11px] font-black text-white uppercase tracking-tight truncate">Caelum Vane</p>
              <p className="text-[9px] font-bold text-zinc-500 uppercase">Principal AI Architect</p>
              <p className="text-[10px] text-zinc-400 mt-1 leading-tight line-clamp-2">Orchestrates multi-model routing protocols.</p>
            </div>
          </div>
          <div className="p-4 bg-zinc-950/80 border border-zinc-800/80 rounded-2xl flex gap-3">
            <div className="p-2 bg-rose-500/10 rounded-xl text-rose-400 h-10 w-10 flex items-center justify-center shrink-0">
              <HardDrive size={18} />
            </div>
            <div className="min-w-0">
              <p className="text-[11px] font-black text-white uppercase tracking-tight truncate">Evelyn Vance</p>
              <p className="text-[9px] font-bold text-zinc-500 uppercase">SEO Data Engineer</p>
              <p className="text-[10px] text-zinc-400 mt-1 leading-tight line-clamp-2">Indexes crawl volumes and keyword trends.</p>
            </div>
          </div>
          <div className="p-4 bg-zinc-950/80 border border-zinc-800/80 rounded-2xl flex gap-3">
            <div className="p-2 bg-amber-500/10 rounded-xl text-amber-400 h-10 w-10 flex items-center justify-center shrink-0">
              <Globe size={18} />
            </div>
            <div className="min-w-0">
              <p className="text-[11px] font-black text-white uppercase tracking-tight truncate">Cassian Rook</p>
              <p className="text-[9px] font-bold text-zinc-500 uppercase">GEO/AEO Specialist</p>
              <p className="text-[10px] text-zinc-400 mt-1 leading-tight line-clamp-2">Optimizes citations inside LLM indexes.</p>
            </div>
          </div>
          <div className="p-4 bg-zinc-950/80 border border-zinc-800/80 rounded-2xl flex gap-3">
            <div className="p-2 bg-emerald-500/10 rounded-xl text-emerald-400 h-10 w-10 flex items-center justify-center shrink-0">
              <Layers size={18} />
            </div>
            <div className="min-w-0">
              <p className="text-[11px] font-black text-white uppercase tracking-tight truncate">Lyra Sterling</p>
              <p className="text-[9px] font-bold text-zinc-500 uppercase">Enterprise SaaS Designer</p>
              <p className="text-[10px] text-zinc-400 mt-1 leading-tight line-clamp-2">Architects raw high-contrast data visualizers.</p>
            </div>
          </div>
        </div>
      </div>

      {/* 3. CORE INPUT & DEEP CRAWLER SCANNER */}
      <div className="max-w-3xl mx-auto relative group">
        <div className="absolute inset-0 bg-red-600 blur-3xl opacity-0 group-focus-within:opacity-10 transition-opacity rounded-[2.5rem]"></div>
        <form onSubmit={handleInspect} className="relative flex flex-col md:flex-row gap-3 p-3 bg-zinc-900 border border-zinc-800 rounded-3xl md:rounded-[2.5rem] shadow-2xl focus-within:border-red-600/50 transition-all">
          <div className="flex items-center pl-4 text-zinc-600">
            <Search size={22} className="text-zinc-550" />
          </div>
          <input
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            placeholder="Input market seed query (e.g. 'AI Marketing Agents')..."
            className="flex-1 bg-transparent border-none py-4 px-2 outline-none text-white font-medium text-lg placeholder:text-zinc-700 font-sans"
          />
          <button
            type="submit"
            disabled={loading || !keyword}
            className="bg-red-600 hover:bg-red-500 disabled:opacity-50 text-white px-10 py-4 rounded-2xl md:rounded-[2rem] font-black uppercase text-xs tracking-widest transition-all shadow-lg shadow-red-600/10 flex items-center justify-center gap-2 shrink-0 active:scale-[0.98]"
          >
            {loading ? <Loader2 className="animate-spin" size={16} /> : <><Zap size={16} fill="currentColor" /> Initialize deep-index scan</>}
          </button>
        </form>
      </div>

      {/* 4. MAIN WORKSPACE */}
      {metrics ? (
        <div className="space-y-12 animate-scale-in">
          {/* A. EXECUTIVE KPI METRICS TAB BAR */}
          <div className="flex overflow-x-auto pb-2 scrollbar-thin gap-1.5 bg-zinc-950 border border-zinc-900 p-1.5 rounded-2xl">
            <button 
              onClick={() => setActiveTab('overview')} 
              className={`px-5 py-3 rounded-xl text-xs uppercase font-black tracking-wider transition-all flex items-center gap-2 whitespace-nowrap ${activeTab === 'overview' ? 'bg-red-600 text-white shadow-lg shadow-red-600/10' : 'bg-transparent text-zinc-500 hover:text-zinc-300'}`}
            >
              <Activity size={14} /> Executive KPI Overview
            </button>
            <button 
              onClick={() => setActiveTab('discovery')} 
              className={`px-5 py-3 rounded-xl text-xs uppercase font-black tracking-wider transition-all flex items-center gap-2 whitespace-nowrap ${activeTab === 'discovery' ? 'bg-red-600 text-white shadow-lg shadow-red-600/10' : 'bg-transparent text-zinc-500 hover:text-zinc-300'}`}
            >
              <Search size={14} /> Keyword Discovery
            </button>
            <button 
              onClick={() => setActiveTab('semantic')} 
              className={`px-5 py-3 rounded-xl text-xs uppercase font-black tracking-wider transition-all flex items-center gap-2 whitespace-nowrap ${activeTab === 'semantic' ? 'bg-red-600 text-white shadow-lg shadow-red-600/10' : 'bg-transparent text-zinc-500 hover:text-zinc-300'}`}
            >
              <Network size={14} /> Semantic Net
            </button>
            <button 
              onClick={() => setActiveTab('geo')} 
              className={`px-5 py-3 rounded-xl text-xs uppercase font-black tracking-wider transition-all flex items-center gap-2 whitespace-nowrap ${activeTab === 'geo' ? 'bg-red-600 text-white shadow-lg shadow-red-600/10' : 'bg-transparent text-zinc-500 hover:text-zinc-300'}`}
            >
              <Globe size={14} /> GEO Audit
            </button>
            <button 
              onClick={() => setActiveTab('aeo')} 
              className={`px-5 py-3 rounded-xl text-xs uppercase font-black tracking-wider transition-all flex items-center gap-2 whitespace-nowrap ${activeTab === 'aeo' ? 'bg-red-600 text-white shadow-lg shadow-red-600/10' : 'bg-transparent text-zinc-500 hover:text-zinc-300'}`}
            >
              <HelpCircle size={14} /> AEO Optimizer
            </button>
            <button 
              onClick={() => setActiveTab('competitors')} 
              className={`px-5 py-3 rounded-xl text-xs uppercase font-black tracking-wider transition-all flex items-center gap-2 whitespace-nowrap ${activeTab === 'competitors' ? 'bg-red-600 text-white shadow-lg shadow-red-600/10' : 'bg-transparent text-zinc-500 hover:text-zinc-300'}`}
            >
              <Users size={14} /> Competitor Spy
            </button>
            <button 
              onClick={() => setActiveTab('predictive')} 
              className={`px-5 py-3 rounded-xl text-xs uppercase font-black tracking-wider transition-all flex items-center gap-2 whitespace-nowrap ${activeTab === 'predictive' ? 'bg-red-600 text-white shadow-lg shadow-red-600/10' : 'bg-transparent text-zinc-500 hover:text-zinc-300'}`}
            >
              <LineChart size={14} /> Predictive
            </button>
            <button 
              onClick={() => setActiveTab('trends')} 
              className={`px-5 py-3 rounded-xl text-xs uppercase font-black tracking-wider transition-all flex items-center gap-2 whitespace-nowrap ${activeTab === 'trends' ? 'bg-red-600 text-white shadow-lg shadow-red-600/10' : 'bg-transparent text-zinc-500 hover:text-zinc-300'}`}
            >
              <Flame size={14} /> Trends Hub
            </button>
            <button 
              onClick={() => setActiveTab('pillar')} 
              className={`px-5 py-3 rounded-xl text-xs uppercase font-black tracking-wider transition-all flex items-center gap-2 whitespace-nowrap ${activeTab === 'pillar' ? 'bg-red-600 text-white shadow-lg shadow-red-600/10' : 'bg-transparent text-zinc-500 hover:text-zinc-300'}`}
            >
              <FileText size={14} /> Pillar Plan
            </button>
            <button 
              onClick={() => setActiveTab('governance')} 
              className={`px-5 py-3 rounded-xl text-xs uppercase font-black tracking-wider transition-all flex items-center gap-2 whitespace-nowrap ${activeTab === 'governance' ? 'bg-red-600 text-white shadow-lg shadow-red-600/10' : 'bg-transparent text-zinc-500 hover:text-zinc-300'}`}
            >
              <ShieldCheck size={14} /> Governance
            </button>
            <button 
              onClick={() => setActiveTab('roadmap')} 
              className={`px-5 py-3 rounded-xl text-xs uppercase font-black tracking-wider transition-all flex items-center gap-2 whitespace-nowrap ${activeTab === 'roadmap' ? 'bg-red-600 text-white shadow-lg shadow-red-600/10' : 'bg-transparent text-zinc-500 hover:text-zinc-300'}`}
            >
              <Calendar size={14} /> V1-V5 Roadmap
            </button>
          </div>

          {/* B. DYNAMIC ACTIVE PANEL CONTENT */}
          <div className="bg-zinc-900 border border-zinc-800 rounded-[2rem] p-8 md:p-12 shadow-3xl min-h-[500px]">
            <AnimatePresence mode="wait">
              {activeTab === 'overview' && (
                <motion.div 
                  initial={{ opacity: 0, y: 15 }} 
                  animate={{ opacity: 1, y: 0 }} 
                  exit={{ opacity: 0, y: -15 }} 
                  className="space-y-12"
                >
                  <div className="border-b border-zinc-800 pb-6">
                    <h3 className="text-3xl font-black text-white uppercase tracking-tight">Executive Dashboard Overview</h3>
                    <p className="text-zinc-400 mt-2">Aggregated macro-metrics, index connection state, and search telemetry indices calculated for the query <span className="text-white font-bold">"{metrics.keyword}"</span>.</p>
                  </div>

                  {/* KPI Grid */}
                  <div className="grid grid-cols-2 md:grid-cols-5 gap-6">
                    <div className="bg-zinc-950/80 border border-zinc-800/80 p-5 rounded-2xl flex flex-col justify-between hover:border-zinc-700 transition-all">
                      <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Total Opportunities</span>
                      <span className="text-3xl font-black text-white tracking-tight mt-2">{metrics.discoveryQueries?.length || 0}</span>
                      <span className="text-[9px] font-bold text-emerald-400 mt-1 uppercase">Discovered Nodes</span>
                    </div>
                    <div className="bg-zinc-950/80 border border-zinc-800/80 p-5 rounded-2xl flex flex-col justify-between hover:border-zinc-700 transition-all">
                      <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Estimated Traffic</span>
                      <span className="text-3xl font-black text-white tracking-tight mt-2">{metrics.estimatedMonthlyTraffic ? metrics.estimatedMonthlyTraffic.toLocaleString() : 'N/A'}</span>
                      <span className="text-[9px] font-bold text-zinc-500 mt-1 uppercase">Monthly Volume</span>
                    </div>
                    <div className="bg-zinc-950/80 border border-zinc-800/80 p-5 rounded-2xl flex flex-col justify-between hover:border-zinc-700 transition-all">
                      <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Estimated CPC</span>
                      <span className="text-3xl font-black text-white tracking-tight mt-2">{metrics.estimatedCpcValue || 'N/A'}</span>
                      <span className="text-[9px] font-bold text-indigo-400 mt-1 uppercase">Advertiser value</span>
                    </div>
                    <div className="bg-zinc-950/80 border border-zinc-800/80 p-5 rounded-2xl flex flex-col justify-between hover:border-zinc-700 transition-all">
                      <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Opportunity Score</span>
                      <span className="text-3xl font-black text-red-500 tracking-tight mt-2">{metrics.overallScore}/100</span>
                      <span className="text-[9px] font-bold text-red-400 mt-1 uppercase">High Conversion</span>
                    </div>
                    <div className="bg-zinc-950/80 border border-zinc-800/80 p-5 rounded-2xl flex flex-col justify-between hover:border-zinc-700 transition-all">
                      <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Visibility Score</span>
                      <span className="text-3xl font-black text-white tracking-tight mt-2">{metrics.visibilityScore}/100</span>
                      <span className="text-[9px] font-bold text-emerald-400 mt-1 uppercase">Active Presence</span>
                    </div>
                  </div>

                  {/* Multi-tier Intelligence Subscores */}
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                    <div className="bg-zinc-950/50 border border-zinc-800/60 p-6 rounded-2xl text-center">
                      <h4 className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">AI Search Presence Score</h4>
                      <div className="text-4xl font-black text-white mt-3">{metrics.aiSearchPresenceScore}%</div>
                      <div className="w-full bg-zinc-900 h-2 rounded-full overflow-hidden mt-3 border border-zinc-800/50">
                        <div className="bg-indigo-500 h-full" style={{ width: `${metrics.aiSearchPresenceScore}%` }} />
                      </div>
                    </div>
                    <div className="bg-zinc-950/50 border border-zinc-800/60 p-6 rounded-2xl text-center">
                      <h4 className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">GEO Score</h4>
                      <div className="text-4xl font-black text-white mt-3">{metrics.geoScore}%</div>
                      <div className="w-full bg-zinc-900 h-2 rounded-full overflow-hidden mt-3 border border-zinc-800/50">
                        <div className="bg-red-600 h-full" style={{ width: `${metrics.geoScore}%` }} />
                      </div>
                    </div>
                    <div className="bg-zinc-950/50 border border-zinc-800/60 p-6 rounded-2xl text-center">
                      <h4 className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">AEO Score</h4>
                      <div className="text-4xl font-black text-white mt-3">{metrics.aeoScore}%</div>
                      <div className="w-full bg-zinc-900 h-2 rounded-full overflow-hidden mt-3 border border-zinc-800/50">
                        <div className="bg-amber-500 h-full" style={{ width: `${metrics.aeoScore}%` }} />
                      </div>
                    </div>
                    <div className="bg-zinc-950/50 border border-zinc-800/60 p-6 rounded-2xl text-center">
                      <h4 className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Trend Momentum Score</h4>
                      <div className="text-4xl font-black text-white mt-3">{metrics.trendMomentumScore}%</div>
                      <div className="w-full bg-zinc-900 h-2 rounded-full overflow-hidden mt-3 border border-zinc-800/50">
                        <div className="bg-emerald-500 h-full" style={{ width: `${metrics.trendMomentumScore}%` }} />
                      </div>
                    </div>
                  </div>

                  {/* Core Diagnostic Scanners */}
                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 pt-4">
                    <div className="lg:col-span-8 bg-zinc-950/40 border border-zinc-800 rounded-2xl p-6">
                      <div className="flex justify-between items-center mb-6 pb-2 border-b border-zinc-800/60">
                        <h4 className="text-[11px] font-black text-white uppercase tracking-wider flex items-center gap-1.5"><HardDrive size={13} className="text-red-500" /> Deep Index Crawler Telemetry Diagnostics</h4>
                        <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[8px] font-black tracking-widest uppercase">● Online</span>
                      </div>
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                        {providers.map((p, i) => (
                          <div key={i} className="p-3 bg-zinc-950 border border-zinc-850 rounded-xl flex items-center justify-between gap-2">
                            <span className="text-[10px] text-zinc-400 font-bold truncate">{p.name}</span>
                            <div className="flex items-center gap-1.5 shrink-0">
                              <span className="text-[8px] font-mono text-zinc-500">{p.latency}</span>
                              <div className={`w-1.5 h-1.5 rounded-full ${p.connected ? 'bg-emerald-400 shadow-sm shadow-emerald-400/50' : 'bg-zinc-700'}`} />
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="lg:col-span-4 bg-zinc-950/40 border border-zinc-800 rounded-2xl p-6 flex flex-col justify-between">
                      <div>
                        <h4 className="text-[11px] font-black text-white uppercase tracking-wider mb-3 flex items-center gap-1.5"><Settings size={13} /> SaaS Readiness Configurator</h4>
                        <p className="text-[10px] text-zinc-500 leading-relaxed mb-4">Override tenant-isolation, meter usage and adjust agency white label parameters dynamically.</p>
                        
                        <div className="space-y-3.5 text-xs text-zinc-300">
                          <div className="flex justify-between items-center">
                            <span>Multi-Tenant Sandbox:</span>
                            <button 
                              type="button"
                              onClick={() => setIsMultiTenant(!isMultiTenant)}
                              className={`px-2.5 py-0.5 rounded text-[9px] font-black tracking-widest transition-colors ${isMultiTenant ? 'bg-indigo-500/20 text-indigo-400 border border-indigo-500/30' : 'bg-zinc-800 text-zinc-500'}`}
                            >
                              {isMultiTenant ? 'ACTIVE' : 'ISOLATED'}
                            </button>
                          </div>
                          <div className="flex justify-between items-center">
                            <span>SaaS Token Limits:</span>
                            <input 
                              type="range" 
                              min="10" 
                              max="1000" 
                              value={usageLimit}
                              onChange={(e) => setUsageLimit(Number(e.target.value))}
                              className="w-24 accent-red-600"
                            />
                          </div>
                          <div className="flex justify-between items-center text-[10px] text-zinc-400">
                            <span>Allocated tokens:</span>
                            <span className="font-mono text-white">{usageLimit}k/mo</span>
                          </div>
                          <div className="space-y-1">
                            <span className="block text-[10px] text-zinc-500">Agency White Label Title:</span>
                            <input 
                              type="text" 
                              value={whiteLabelName}
                              onChange={(e) => setWhiteLabelName(e.target.value)}
                              className="w-full bg-zinc-950 border border-zinc-800 rounded px-2.5 py-1 text-xs text-white"
                            />
                          </div>
                        </div>
                      </div>
                      <div className="mt-4 pt-3 border-t border-zinc-800/40 flex justify-between items-center text-[8px] font-mono text-zinc-600">
                        <span>Agency Status:</span>
                        <span className="text-emerald-400 font-bold">Premium Enterprise Ready</span>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}

              {activeTab === 'discovery' && (
                <motion.div 
                  initial={{ opacity: 0, y: 15 }} 
                  animate={{ opacity: 1, y: 0 }} 
                  exit={{ opacity: 0, y: -15 }} 
                  className="space-y-8"
                >
                  <div className="flex justify-between items-end border-b border-zinc-800 pb-6">
                    <div>
                      <h3 className="text-3xl font-black text-white uppercase tracking-tight">Keyword Discovery & Multi-Platform Mapping</h3>
                      <p className="text-zinc-400 mt-2">Deep discovery and score classifications across LLMs, Google, Bing, and YouTube ecosystems.</p>
                    </div>
                    <span className="px-3 py-1 bg-red-600/10 border border-red-600/20 text-red-500 rounded-full text-[9px] font-black tracking-widest uppercase">Primary Core Seed: {metrics.keyword}</span>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="border-b border-zinc-800 text-[10px] font-black text-zinc-500 uppercase tracking-widest">
                          <th className="py-4 px-3">Keyword Query Term</th>
                          <th className="py-4 px-3 text-center">Category Class</th>
                          <th className="py-4 px-3 text-right">Vol (mo)</th>
                          <th className="py-4 px-3 text-right">CPC</th>
                          <th className="py-4 px-3 text-center">Competition</th>
                          <th className="py-4 px-3 text-center">Difficulty</th>
                          <th className="py-4 px-3 text-center">Trend Momentum</th>
                          <th className="py-4 px-3 text-center">Intent</th>
                          <th className="py-4 px-3 text-center">Opportunity</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-zinc-850">
                        {metrics.discoveryQueries?.map((q, i) => (
                          <tr key={i} className="hover:bg-zinc-950/40 transition-colors text-xs text-zinc-300">
                            <td className="py-3 px-3 font-bold text-white flex items-center gap-2">
                              <span>{q.term}</span>
                              <button 
                                onClick={() => copyToClipboard(q.term, `discovery-${i}`)}
                                className="text-zinc-600 hover:text-white transition-colors"
                              >
                                {copied === `discovery-${i}` ? <Check size={11} className="text-emerald-400" /> : <Copy size={11} />}
                              </button>
                            </td>
                            <td className="py-3 px-3 text-center">
                              <span className="px-2 py-0.5 rounded bg-zinc-900 border border-zinc-800 text-[9px] font-semibold text-zinc-400 uppercase tracking-wider">{q.category}</span>
                            </td>
                            <td className="py-3 px-3 text-right font-mono font-medium">{q.volume.toLocaleString()}</td>
                            <td className="py-3 px-3 text-right font-mono text-indigo-400">{q.cpc}</td>
                            <td className="py-3 px-3 text-center">
                              <span className="font-semibold text-[10px]">{q.competition}</span>
                            </td>
                            <td className="py-3 px-3 text-center">
                              <div className="flex items-center justify-center gap-2">
                                <span className="font-mono">{q.difficulty}/100</span>
                                <div className="w-12 bg-zinc-950 h-1.5 rounded-full overflow-hidden border border-zinc-800">
                                  <div className={`h-full ${q.difficulty > 70 ? 'bg-red-500' : q.difficulty > 40 ? 'bg-orange-500' : 'bg-emerald-500'}`} style={{ width: `${q.difficulty}%` }} />
                                </div>
                              </div>
                            </td>
                            <td className="py-3 px-3 text-center">
                              <span className={`font-mono font-bold ${q.trendScore > 0 ? 'text-emerald-400' : 'text-red-400'}`}>{q.trendScore > 0 ? `+${q.trendScore}%` : `${q.trendScore}%`}</span>
                            </td>
                            <td className="py-3 px-3 text-center">
                              <span className={`px-2 py-0.5 rounded-full text-[9px] font-black tracking-widest uppercase ${q.intent === 'Transactional' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20'}`}>
                                {q.intent}
                              </span>
                            </td>
                            <td className="py-3 px-3 text-center">
                              <span className={`px-2 py-0.5 rounded font-black font-mono ${getScoreColor(q.opportunityScore)}`}>
                                {q.opportunityScore}%
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </motion.div>
              )}

              {activeTab === 'semantic' && (
                <motion.div 
                  initial={{ opacity: 0, y: 15 }} 
                  animate={{ opacity: 1, y: 0 }} 
                  exit={{ opacity: 0, y: -15 }} 
                  className="space-y-12"
                >
                  <div className="border-b border-zinc-800 pb-6">
                    <h3 className="text-3xl font-black text-white uppercase tracking-tight">Semantic Cluster Mapping & Knowledge Graphs</h3>
                    <p className="text-zinc-400 mt-2">Entities classification and LSI networks mapped for topical authority injection.</p>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                    {/* SVG GRAPH RENDER - 7 cols */}
                    <div className="lg:col-span-7 bg-zinc-950 border border-zinc-800 rounded-2xl p-6 relative select-none">
                      <div className="flex justify-between items-center mb-6 pb-2 border-b border-zinc-900">
                        <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Interactive Semantic Network Graph</span>
                        <span className="text-[9px] font-mono text-zinc-600">Hover nodes to view relation context</span>
                      </div>

                      <div className="h-[320px] relative w-full border border-zinc-900 rounded-xl overflow-hidden bg-[#07070a]">
                        {/* SVG Connections line overlays */}
                        <svg className="absolute inset-0 w-full h-full pointer-events-none">
                          <line x1="150" y1="160" x2="350" y2="80" stroke="#2c2c35" strokeWidth="1" strokeDasharray="4 4" />
                          <line x1="150" y1="160" x2="160" y2="280" stroke="#2c2c35" strokeWidth="1" />
                          <line x1="350" y1="80" x2="500" y2="220" stroke="#2c2c35" strokeWidth="1.5" />
                          <line x1="150" y1="160" x2="280" y2="220" stroke="#2c2c35" strokeWidth="1" />
                          <line x1="160" y1="280" x2="280" y2="220" stroke="#2c2c35" strokeWidth="1" />
                          <line x1="500" y1="220" x2="280" y2="220" stroke="#dc2626" strokeWidth="2" strokeDasharray="2" />
                          <line x1="150" y1="160" x2="500" y2="220" stroke="#2c2c35" strokeWidth="1" />
                        </svg>

                        {/* Node Elements */}
                        {metrics.entityNodes?.map((node, i) => {
                          const coords = [
                            { x: '20%', y: '50%' },
                            { x: '50%', y: '68%' },
                            { x: '25%', y: '85%' },
                            { x: '55%', y: '25%' },
                            { x: '75%', y: '68%' },
                            { x: '40%', y: '45%' },
                            { x: '82%', y: '30%' },
                            { x: '12%', y: '25%' }
                          ][i] || { x: '50%', y: '50%' };

                          const isHovered = hoveredNode === node.id;

                          return (
                            <div 
                              key={node.id} 
                              style={{ left: coords.x, top: coords.y }}
                              onMouseEnter={() => setHoveredNode(node.id)}
                              onMouseLeave={() => setHoveredNode(null)}
                              className={`absolute -translate-x-1/2 -translate-y-1/2 px-3 py-1.5 rounded-xl border text-[9px] font-black uppercase tracking-wider transition-all duration-200 cursor-pointer ${isHovered ? 'bg-red-600 text-white border-red-500 scale-110 shadow-lg shadow-red-600/35 z-20' : 'bg-zinc-900 text-zinc-300 border-zinc-800'}`}
                            >
                              <div className="flex items-center gap-1">
                                <div className={`w-1 h-1 rounded-full ${node.type === 'Brand' ? 'bg-indigo-400' : node.type === 'Concept' ? 'bg-amber-400' : 'bg-emerald-400'}`} />
                                <span>{node.label}</span>
                              </div>
                            </div>
                          );
                        })}

                        {/* Interactive Context Panel */}
                        <div className="absolute bottom-3 left-3 bg-zinc-950/90 border border-zinc-850 p-3 rounded-lg text-[9px] max-w-xs leading-normal">
                          {hoveredNode ? (
                            <div>
                              <p className="font-bold text-white uppercase tracking-wider">Active Node Identified</p>
                              <p className="text-zinc-400 mt-1">Valency Weight: {metrics.entityNodes?.find(n => n.id === hoveredNode)?.valency} / 10</p>
                              <p className="text-zinc-400">Class: {metrics.entityNodes?.find(n => n.id === hoveredNode)?.type}</p>
                            </div>
                          ) : (
                            <p className="text-zinc-500 font-mono">Hover node cluster elements to decrypt context relationships</p>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Semantic Clusters list - 5 cols */}
                    <div className="lg:col-span-5 space-y-6">
                      <div className="bg-zinc-950/60 border border-zinc-850 rounded-2xl p-6">
                        <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest block mb-4">LSI Topical Authority Clusters</span>
                        <div className="space-y-4">
                          {metrics.semanticClustersList?.map((cluster, idx) => (
                            <div key={idx} className="bg-zinc-900 border border-zinc-800 p-4 rounded-xl space-y-2">
                              <div className="flex justify-between items-start">
                                <h5 className="text-[11px] font-black text-white uppercase tracking-wide">{cluster.name}</h5>
                                <span className="px-1.5 py-0.5 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-mono text-[9px] rounded font-black">{cluster.volumeShare}% Share</span>
                              </div>
                              <p className="text-[10px] font-mono text-zinc-500">{cluster.intentGroup}</p>
                              <div className="flex flex-wrap gap-1.5 mt-2">
                                {cluster.keywords.map((kw, i) => (
                                  <span key={i} className="px-2 py-0.5 bg-zinc-950 border border-zinc-800/80 rounded text-[9.5px] font-bold text-zinc-400">{kw}</span>
                                ))}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}

              {activeTab === 'geo' && (
                <motion.div 
                  initial={{ opacity: 0, y: 15 }} 
                  animate={{ opacity: 1, y: 0 }} 
                  exit={{ opacity: 0, y: -15 }} 
                  className="space-y-8"
                >
                  <div className="border-b border-zinc-800 pb-6 flex justify-between items-end">
                    <div>
                      <h3 className="text-3xl font-black text-white uppercase tracking-tight">GEO (Generative Engine Optimization) Visibility</h3>
                      <p className="text-zinc-400 mt-2">Analyze exact brand coverage and visibility indexes across core conversational models.</p>
                    </div>
                    <span className="text-xs text-zinc-500 font-mono">Index updated daily</span>
                  </div>

                  {/* Horizontal platforms selector */}
                  <div className="flex gap-2 overflow-x-auto pb-2">
                    {metrics.geoPlatforms?.map((p) => (
                      <button
                        key={p.name}
                        type="button"
                        onClick={() => setSelectedPlatform(p.name)}
                        className={`px-4 py-2.5 rounded-xl border text-xs font-black uppercase tracking-wider transition-all cursor-pointer whitespace-nowrap ${selectedPlatform === p.name ? 'bg-red-600/10 border-red-500/50 text-red-400 shadow-md' : 'bg-zinc-950 border-zinc-850 text-zinc-400 hover:text-zinc-300'}`}
                      >
                        {p.name} ({p.visibility}%)
                      </button>
                    ))}
                  </div>

                  {/* Highlighted platform analysis */}
                  {metrics.geoPlatforms?.filter(p => p.name === selectedPlatform).map((platform) => (
                    <div key={platform.name} className="grid grid-cols-1 lg:grid-cols-12 gap-8 bg-zinc-950 border border-zinc-850 rounded-2xl p-6">
                      <div className="lg:col-span-4 space-y-6">
                        <div className="text-center p-6 bg-zinc-900 rounded-xl border border-zinc-800">
                          <h5 className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">{platform.name} Visibility Index</h5>
                          <div className="text-6xl font-black text-white mt-4 tracking-tighter">{platform.visibility}%</div>
                          <div className="w-full bg-zinc-950 h-3 rounded-full overflow-hidden mt-4 border border-zinc-800">
                            <div className="bg-gradient-to-r from-red-600 to-indigo-600 h-full" style={{ width: `${platform.visibility}%` }} />
                          </div>
                          <div className="mt-4 flex justify-between text-[10px] font-mono text-zinc-500">
                            <span>Mentions: <b>{platform.brandMentions}</b></span>
                            <span>Prompt Visibility: <b>{platform.promptVisibilityScore}%</b></span>
                          </div>
                        </div>

                        <div className="bg-zinc-900 border border-zinc-800 p-5 rounded-xl space-y-2">
                          <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest flex items-center gap-1"><Sparkles size={11} className="text-amber-400" /> Citation Potential</span>
                          <p className="text-[10px] text-zinc-400 leading-relaxed">Optimize structural citation vectors by targeting matching data schema and entity references.</p>
                        </div>
                      </div>

                      {/* Right checklist - 8 cols */}
                      <div className="lg:col-span-8 space-y-6">
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                          <div className="space-y-3">
                            <h6 className="text-[11px] font-black text-white uppercase tracking-wider border-b border-zinc-800 pb-1.5 flex items-center gap-1"><Check size={11} className="text-emerald-400" /> Citation Action Steps</h6>
                            <ul className="space-y-2">
                              {platform.citationOpportunities.map((op, i) => (
                                <li key={i} className="text-[10.5px] text-zinc-400 leading-tight flex items-start gap-1.5">
                                  <span className="text-emerald-500 font-bold shrink-0">➔</span>
                                  <span>{op}</span>
                                </li>
                              ))}
                            </ul>
                          </div>

                          <div className="space-y-3">
                            <h6 className="text-[11px] font-black text-red-400 uppercase tracking-wider border-b border-zinc-800 pb-1.5 flex items-center gap-1"><HardDrive size={11} /> Missing Entities</h6>
                            <ul className="space-y-2">
                              {platform.missingEntities.map((ent, i) => (
                                <li key={i} className="text-[10.5px] text-zinc-400 leading-tight flex items-start gap-1.5">
                                  <span className="text-red-500 font-bold shrink-0">✕</span>
                                  <span>{ent}</span>
                                </li>
                              ))}
                            </ul>
                          </div>

                          <div className="space-y-3">
                            <h6 className="text-[11px] font-black text-amber-500 uppercase tracking-wider border-b border-zinc-800 pb-1.5 flex items-center gap-1"><HelpCircle size={11} /> Answer & Context Gaps</h6>
                            <ul className="space-y-2">
                              {platform.answerGaps.map((gap, i) => (
                                <li key={i} className="text-[10.5px] text-zinc-400 leading-tight flex items-start gap-1.5">
                                  <span className="text-amber-500 font-bold shrink-0">!</span>
                                  <span>{gap}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </motion.div>
              )}

              {activeTab === 'aeo' && (
                <motion.div 
                  initial={{ opacity: 0, y: 15 }} 
                  animate={{ opacity: 1, y: 0 }} 
                  exit={{ opacity: 0, y: -15 }} 
                  className="space-y-8"
                >
                  <div className="border-b border-zinc-800 pb-6 flex justify-between items-end">
                    <div>
                      <h3 className="text-3xl font-black text-white uppercase tracking-tight">AEO (Answer Engine Optimization) & Snippet Hijack</h3>
                      <p className="text-zinc-400 mt-2">Extract direct featured snippet gaps and People Also Ask schema definitions.</p>
                    </div>
                    <span className="px-3 py-1 bg-amber-500/10 border border-amber-500/20 text-amber-400 rounded-full text-[9px] font-black tracking-widest uppercase">Snippet Prob: {metrics.aeoDetails?.snippetProbability}%</span>
                  </div>

                  {metrics.aeoDetails && (
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                      {/* Left Snippet blueprint - 7 cols */}
                      <div className="lg:col-span-7 bg-zinc-950 border border-zinc-850 rounded-2xl p-6 space-y-6">
                        <div className="space-y-2">
                          <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest block">Featured Snippet Opportunity Identifier</span>
                          <h4 className="text-lg font-bold text-white">{metrics.aeoDetails.featuredSnippetOpp}</h4>
                        </div>

                        <div className="bg-zinc-900 border border-zinc-800 p-5 rounded-xl space-y-3">
                          <span className="text-[10px] font-black text-emerald-400 uppercase tracking-widest block">Structured HTML Snippet Override Template</span>
                          <pre className="text-[10.5px] text-zinc-300 bg-zinc-950 border border-zinc-850 p-4 rounded-lg overflow-x-auto font-mono whitespace-pre-wrap leading-relaxed">{metrics.aeoDetails.snippetTemplate}</pre>
                          <button 
                            onClick={() => copyToClipboard(metrics.aeoDetails!.snippetTemplate, 'snippet-markup')}
                            className="flex items-center gap-1 text-[10px] text-zinc-500 hover:text-white uppercase font-black tracking-wider transition-colors cursor-pointer"
                          >
                            {copied === 'snippet-markup' ? <Check size={11} className="text-emerald-400" /> : <Copy size={11} />}
                            <span>Clone template markup</span>
                          </button>
                        </div>

                        {/* People Also Ask lists */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-2">
                          <div className="space-y-3">
                            <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest block border-b border-zinc-900 pb-1.5">People Also Ask Questions</span>
                            <ul className="space-y-2 text-[10.5px] text-zinc-400 leading-tight">
                              {metrics.aeoDetails.peopleAlsoAsk.map((paa, i) => (
                                <li key={i} className="flex gap-1.5 items-start">
                                  <span className="text-amber-500 font-bold shrink-0">?</span>
                                  <span>{paa}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                          <div className="space-y-3">
                            <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest block border-b border-zinc-900 pb-1.5">Voice Query Optimizations</span>
                            <ul className="space-y-2 text-[10.5px] text-zinc-400 leading-tight">
                              {metrics.aeoDetails.voiceSearchOpp.map((vs, i) => (
                                <li key={i} className="flex gap-1.5 items-start">
                                  <span className="text-indigo-400 font-bold shrink-0">🔊</span>
                                  <span>{vs}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        </div>
                      </div>

                      {/* FAQ Schemas - 5 cols */}
                      <div className="lg:col-span-5 space-y-6">
                        <div className="bg-zinc-950 border border-zinc-850 rounded-2xl p-6 space-y-4">
                          <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest block">Automated JSON-LD Schema Markup</span>
                          <pre className="text-[9.5px] text-zinc-400 bg-zinc-900 border border-zinc-850 p-4 rounded-xl overflow-x-auto font-mono whitespace-pre">{metrics.aeoDetails.schemaMarkup}</pre>
                          <button 
                            onClick={() => copyToClipboard(metrics.aeoDetails!.schemaMarkup, 'jsonld-markup')}
                            className="flex items-center gap-1.5 text-[10px] text-zinc-500 hover:text-white uppercase font-black tracking-wider transition-colors cursor-pointer"
                          >
                            {copied === 'jsonld-markup' ? <Check size={11} className="text-emerald-400" /> : <Copy size={11} />}
                            <span>Clone JSON-LD Markup</span>
                          </button>
                        </div>

                        {/* Recommended FAQs */}
                        <div className="space-y-3">
                          <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest block">Recommended FAQ Structure</span>
                          <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                            {metrics.aeoDetails.recommendedFaqs.map((faq, i) => (
                              <div key={i} className="bg-zinc-950 border border-zinc-850 p-3 rounded-lg space-y-1">
                                <p className="text-[10.5px] font-bold text-white leading-tight">Q: {faq.question}</p>
                                <p className="text-[10px] text-zinc-400 leading-normal">A: {faq.answer}</p>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </motion.div>
              )}

              {activeTab === 'competitors' && (
                <motion.div 
                  initial={{ opacity: 0, y: 15 }} 
                  animate={{ opacity: 1, y: 0 }} 
                  exit={{ opacity: 0, y: -15 }} 
                  className="space-y-8"
                >
                  <div className="border-b border-zinc-800 pb-6">
                    <h3 className="text-3xl font-black text-white uppercase tracking-tight">Competitor Intelligence & Content Gap Scan</h3>
                    <p className="text-zinc-400 mt-2">Analyze top ranking domains, AI visibility quotients, and entity deficiency vectors.</p>
                  </div>

                  <div className="space-y-6">
                    {metrics.competitors?.map((comp, idx) => (
                      <div key={idx} className="bg-zinc-950 border border-zinc-850 rounded-2xl p-6 space-y-6">
                        {/* Title bar */}
                        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 border-b border-zinc-900 pb-4">
                          <div>
                            <h4 className="text-lg font-bold text-white flex items-center gap-2">
                              <span>{comp.name}</span>
                              <span className="px-2 py-0.5 bg-red-600/10 border border-red-600/20 text-red-500 text-[8px] font-black uppercase tracking-widest rounded">Target CompetDomain</span>
                            </h4>
                            <p className="text-[10px] text-zinc-500 font-mono mt-1">Ranking keywords: {comp.rankingKeywordsCount.toLocaleString()} | Est Traffic: {comp.estimatedTraffic}</p>
                          </div>

                          {/* Scores metrics row */}
                          <div className="flex gap-6">
                            <div className="text-center">
                              <span className="text-[9px] font-mono text-zinc-500 block uppercase">Domain Auth</span>
                              <span className="text-sm font-black text-white">{comp.domainAuthority}</span>
                            </div>
                            <div className="text-center">
                              <span className="text-[9px] font-mono text-zinc-500 block uppercase">Backlinks</span>
                              <span className="text-sm font-black text-indigo-400">{comp.backlinkStrength}</span>
                            </div>
                            <div className="text-center">
                              <span className="text-[9px] font-mono text-zinc-500 block uppercase">Content Coverage</span>
                              <span className="text-sm font-black text-emerald-400">{comp.contentCoveragePercent}%</span>
                            </div>
                            <div className="text-center">
                              <span className="text-[9px] font-mono text-zinc-500 block uppercase">AI Visibility</span>
                              <span className="text-sm font-black text-amber-500">{comp.aiVisibilityScore}%</span>
                            </div>
                          </div>
                        </div>

                        {/* Gaps columns */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-[10.5px]">
                          <div className="bg-zinc-900 p-4 rounded-xl border border-zinc-800 space-y-2">
                            <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest block">Content Topic Gap</span>
                            <ul className="space-y-1.5 text-zinc-400">
                              {comp.contentGap.map((cg, i) => (
                                <li key={i} className="flex gap-1 items-start leading-tight">
                                  <span className="text-indigo-400 font-bold shrink-0">•</span>
                                  <span>{cg}</span>
                                </li>
                              ))}
                            </ul>
                          </div>

                          <div className="bg-zinc-900 p-4 rounded-xl border border-zinc-800 space-y-2">
                            <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest block">Keyword / Query Gap</span>
                            <ul className="space-y-1.5 text-zinc-400">
                              {comp.keywordGap.map((kg, i) => (
                                <li key={i} className="flex gap-1 items-start leading-tight">
                                  <span className="text-red-500 font-bold shrink-0">•</span>
                                  <span>{kg}</span>
                                </li>
                              ))}
                            </ul>
                          </div>

                          <div className="bg-zinc-900 p-4 rounded-xl border border-zinc-800 space-y-2">
                            <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest block">Missing Entity Nodes</span>
                            <ul className="space-y-1.5 text-zinc-400">
                              {comp.entityGap.map((eg, i) => (
                                <li key={i} className="flex gap-1 items-start leading-tight">
                                  <span className="text-amber-500 font-bold shrink-0">•</span>
                                  <span>{eg}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}

              {activeTab === 'predictive' && (
                <motion.div 
                  initial={{ opacity: 0, y: 15 }} 
                  animate={{ opacity: 1, y: 0 }} 
                  exit={{ opacity: 0, y: -15 }} 
                  className="space-y-12"
                >
                  <div className="border-b border-zinc-800 pb-6 flex justify-between items-end">
                    <div>
                      <h3 className="text-3xl font-black text-white uppercase tracking-tight">Predictive Forecasting Models</h3>
                      <p className="text-zinc-400 mt-2">Machine-learned time series forecasts modeling future query volume and click valuations.</p>
                    </div>

                    {/* Selector */}
                    <div className="flex gap-1.5 bg-zinc-950 p-1 border border-zinc-850 rounded-xl">
                      {(['volume', 'cpc', 'ranking', 'traffic'] as const).map((m) => (
                        <button
                          key={m}
                          type="button"
                          onClick={() => setForecastMetric(m)}
                          className={`px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest transition-colors cursor-pointer ${forecastMetric === m ? 'bg-red-600 text-white' : 'text-zinc-500 hover:text-white'}`}
                        >
                          {m}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                    {/* Visual Line Curve Graph widget - 7 cols */}
                    <div className="lg:col-span-8 bg-zinc-950 border border-zinc-850 rounded-2xl p-6 flex flex-col justify-between">
                      <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest block mb-4">Time Horizon Predictive Curve</span>
                      
                      <div className="h-64 w-full relative border border-zinc-900 rounded-xl bg-[#07070a] p-4 flex items-end">
                        {/* Grid lines */}
                        <div className="absolute inset-x-0 top-1/4 h-[1px] bg-zinc-900/40" />
                        <div className="absolute inset-x-0 top-2/4 h-[1px] bg-zinc-900/40" />
                        <div className="absolute inset-x-0 top-3/4 h-[1px] bg-zinc-900/40" />

                        {/* Interactive Graph Plotting depending on selected metric */}
                        <svg className="absolute inset-x-0 top-12 h-44 w-full overflow-visible pointer-events-none">
                          {forecastMetric === 'volume' && (
                            <>
                              <path d="M 50 150 Q 200 130 400 90 T 750 30" fill="none" stroke="#dc2626" strokeWidth="4" className="animate-pulse" />
                              <circle cx="50" cy="150" r="5" fill="#dc2626" />
                              <circle cx="250" cy="120" r="5" fill="#dc2626" />
                              <circle cx="450" cy="90" r="5" fill="#dc2626" />
                              <circle cx="710" cy="35" r="5" fill="#dc2626" />
                            </>
                          )}
                          {forecastMetric === 'cpc' && (
                            <>
                              <path d="M 50 140 Q 200 135 400 110 T 750 60" fill="none" stroke="#818cf8" strokeWidth="4" />
                              <circle cx="50" cy="140" r="5" fill="#818cf8" />
                              <circle cx="250" cy="132" r="5" fill="#818cf8" />
                              <circle cx="450" cy="110" r="5" fill="#818cf8" />
                              <circle cx="710" cy="65" r="5" fill="#818cf8" />
                            </>
                          )}
                          {forecastMetric === 'ranking' && (
                            <>
                              <path d="M 50 160 Q 200 120 400 70 T 750 20" fill="none" stroke="#f59e0b" strokeWidth="4" />
                              <circle cx="50" cy="160" r="5" fill="#f59e0b" />
                              <circle cx="250" cy="112" r="5" fill="#f59e0b" />
                              <circle cx="450" cy="70" r="5" fill="#f59e0b" />
                              <circle cx="710" cy="22" r="5" fill="#f59e0b" />
                            </>
                          )}
                          {forecastMetric === 'traffic' && (
                            <>
                              <path d="M 50 165 Q 200 155 400 115 T 750 15" fill="none" stroke="#10b981" strokeWidth="4" />
                              <circle cx="50" cy="165" r="5" fill="#10b981" />
                              <circle cx="250" cy="150" r="5" fill="#10b981" />
                              <circle cx="450" cy="115" r="5" fill="#10b981" />
                              <circle cx="710" cy="18" r="5" fill="#10b981" />
                            </>
                          )}
                        </svg>

                        {/* X-Axis labels */}
                        <div className="w-full flex justify-between text-[9px] font-mono text-zinc-650 pt-2 border-t border-zinc-900 z-10 bg-zinc-950/80">
                          <span>Current</span>
                          <span>+30 Days</span>
                          <span>+90 Days</span>
                          <span>+1 Year</span>
                        </div>
                      </div>
                    </div>

                    {/* Numeric stats list - 5 cols */}
                    <div className="lg:col-span-4 space-y-6">
                      <div className="bg-zinc-950 border border-zinc-850 rounded-2xl p-6">
                        <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest block mb-4">Forecast Datapoints</span>
                        <div className="space-y-3.5">
                          {forecastMetric === 'volume' && metrics.predictiveForecast?.futureVolume.map((pt, i) => (
                            <div key={i} className="flex justify-between items-center text-xs">
                              <span className="text-zinc-400 font-bold">{pt.label}</span>
                              <span className="font-mono text-white font-black">{pt.value.toLocaleString()} / mo</span>
                            </div>
                          ))}
                          {forecastMetric === 'cpc' && metrics.predictiveForecast?.futureCpc.map((pt, i) => (
                            <div key={i} className="flex justify-between items-center text-xs">
                              <span className="text-zinc-400 font-bold">{pt.label}</span>
                              <span className="font-mono text-indigo-400 font-black">{pt.value} CPC</span>
                            </div>
                          ))}
                          {forecastMetric === 'ranking' && metrics.predictiveForecast?.rankingProbability.map((pt, i) => (
                            <div key={i} className="flex justify-between items-center text-xs">
                              <span className="text-zinc-400 font-bold">{pt.label}</span>
                              <span className="font-mono text-amber-400 font-black">{pt.value}% Probability</span>
                            </div>
                          ))}
                          {forecastMetric === 'traffic' && metrics.predictiveForecast?.trafficGrowth.map((pt, i) => (
                            <div key={i} className="flex justify-between items-center text-xs">
                              <span className="text-zinc-400 font-bold">{pt.label}</span>
                              <span className="font-mono text-emerald-400 font-black">{pt.value.toLocaleString()} Visits</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}

              {activeTab === 'trends' && (
                <motion.div 
                  initial={{ opacity: 0, y: 15 }} 
                  animate={{ opacity: 1, y: 0 }} 
                  exit={{ opacity: 0, y: -15 }} 
                  className="space-y-8"
                >
                  <div className="border-b border-zinc-800 pb-6">
                    <h3 className="text-3xl font-black text-white uppercase tracking-tight">Social & Multi-Platform Trend Network</h3>
                    <p className="text-zinc-400 mt-2">Correlate instant momentum surges from Google, Reddit, YouTube, TikTok, and X.</p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
                    {/* Google */}
                    <div className="bg-zinc-950 border border-zinc-850 p-5 rounded-2xl space-y-4">
                      <span className="text-[11px] font-black text-white uppercase tracking-wider block border-b border-zinc-900 pb-1.5 flex items-center gap-1">🌐 Google Trends</span>
                      <ul className="space-y-2 text-[10.5px] text-zinc-400">
                        {metrics.trendsNetwork?.google.map((t, i) => (
                          <li key={i} className="flex gap-1 items-start leading-tight hover:text-white transition-colors cursor-pointer">
                            <span className="text-zinc-550">#</span> <span>{t}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    {/* Reddit */}
                    <div className="bg-zinc-950 border border-zinc-850 p-5 rounded-2xl space-y-4">
                      <span className="text-[11px] font-black text-orange-400 uppercase tracking-wider block border-b border-zinc-900 pb-1.5 flex items-center gap-1">🤖 Reddit Buzz</span>
                      <ul className="space-y-2 text-[10.5px] text-zinc-400">
                        {metrics.trendsNetwork?.reddit.map((t, i) => (
                          <li key={i} className="flex gap-1 items-start leading-tight hover:text-white transition-colors cursor-pointer">
                            <span className="text-zinc-550">#</span> <span>{t}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    {/* YouTube */}
                    <div className="bg-zinc-950 border border-zinc-850 p-5 rounded-2xl space-y-4">
                      <span className="text-[11px] font-black text-red-500 uppercase tracking-wider block border-b border-zinc-900 pb-1.5 flex items-center gap-1">📺 YouTube Feed</span>
                      <ul className="space-y-2 text-[10.5px] text-zinc-400">
                        {metrics.trendsNetwork?.youtube.map((t, i) => (
                          <li key={i} className="flex gap-1 items-start leading-tight hover:text-white transition-colors cursor-pointer">
                            <span className="text-zinc-550">#</span> <span>{t}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    {/* TikTok */}
                    <div className="bg-zinc-950 border border-zinc-850 p-5 rounded-2xl space-y-4">
                      <span className="text-[11px] font-black text-teal-400 uppercase tracking-wider block border-b border-zinc-900 pb-1.5 flex items-center gap-1">🎵 TikTok Viral</span>
                      <ul className="space-y-2 text-[10.5px] text-zinc-400">
                        {metrics.trendsNetwork?.tiktok.map((t, i) => (
                          <li key={i} className="flex gap-1 items-start leading-tight hover:text-white transition-colors cursor-pointer">
                            <span className="text-zinc-550">#</span> <span>{t}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    {/* X */}
                    <div className="bg-zinc-950 border border-zinc-850 p-5 rounded-2xl space-y-4">
                      <span className="text-[11px] font-black text-indigo-400 uppercase tracking-wider block border-b border-zinc-900 pb-1.5 flex items-center gap-1">𝕏 Real-time X</span>
                      <ul className="space-y-2 text-[10.5px] text-zinc-400">
                        {metrics.trendsNetwork?.x.map((t, i) => (
                          <li key={i} className="flex gap-1 items-start leading-tight hover:text-white transition-colors cursor-pointer">
                            <span className="text-zinc-550">#</span> <span>{t}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </motion.div>
              )}

              {activeTab === 'pillar' && (
                <motion.div 
                  initial={{ opacity: 0, y: 15 }} 
                  animate={{ opacity: 1, y: 0 }} 
                  exit={{ opacity: 0, y: -15 }} 
                  className="space-y-8"
                >
                  <div className="border-b border-zinc-800 pb-6">
                    <h3 className="text-3xl font-black text-white uppercase tracking-tight">Content Pillar & Strategy Blueprint</h3>
                    <p className="text-zinc-400 mt-2">Generate structural outlines, SEO headings briefs, and internal linking directives automatically.</p>
                  </div>

                  {metrics.contentBrief && (
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                      {/* Left structure brief - 7 cols */}
                      <div className="lg:col-span-7 bg-zinc-950 border border-zinc-850 rounded-2xl p-6 space-y-6">
                        <div className="space-y-2">
                          <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest block">Pillar Page Target Topic</span>
                          <h4 className="text-lg font-bold text-white italic">"{metrics.contentBrief.pillarPage}"</h4>
                        </div>

                        <div className="bg-zinc-900 p-5 border border-zinc-800 rounded-xl space-y-3">
                          <div className="flex justify-between items-start">
                            <span className="text-[10px] font-black text-white uppercase tracking-widest">Suggested Metadata Specs</span>
                            <button 
                              onClick={() => copyToClipboard(`Title: ${metrics.contentBrief!.suggestedTitle}\nDesc: ${metrics.contentBrief!.metaDescription}`, 'meta-copy')}
                              className="text-[10px] text-zinc-500 hover:text-white uppercase font-black tracking-wider flex items-center gap-1 transition-colors"
                            >
                              {copied === 'meta-copy' ? <Check size={11} className="text-emerald-400" /> : <Copy size={11} />}
                              <span>Clone Meta</span>
                            </button>
                          </div>
                          <p className="text-xs text-zinc-300"><b>Title:</b> {metrics.contentBrief.suggestedTitle}</p>
                          <p className="text-xs text-zinc-400"><b>Meta Description:</b> {metrics.contentBrief.metaDescription}</p>
                        </div>

                        {/* Heading outlines */}
                        <div className="space-y-3">
                          <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest block border-b border-zinc-900 pb-1.5">SEO/GEO/AEO Structured Heading Outline</span>
                          <div className="space-y-2 bg-zinc-900 p-4 rounded-xl border border-zinc-800 font-mono text-[11px] leading-relaxed">
                            {metrics.contentBrief.headingStructure.map((hd, i) => (
                              <p key={i} className="text-zinc-300 hover:text-white transition-colors pl-2">{hd}</p>
                            ))}
                          </div>
                        </div>
                      </div>

                      {/* Right brief parameters - 5 cols */}
                      <div className="lg:col-span-5 space-y-6">
                        <div className="bg-zinc-950 border border-zinc-850 rounded-2xl p-6 space-y-4">
                          <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest block">Entity Coverage Checklist</span>
                          <div className="flex flex-wrap gap-1.5">
                            {metrics.contentBrief.entityCoveragePlan.map((ent, i) => (
                              <span key={i} className="px-2.5 py-1 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[10px] font-bold rounded-lg flex items-center gap-1">
                                <Check size={10} /> {ent}
                              </span>
                            ))}
                          </div>
                        </div>

                        <div className="bg-zinc-950 border border-zinc-850 rounded-2xl p-6 space-y-4">
                          <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest block">Internal Linking Infrastructure</span>
                          <ul className="space-y-2 text-xs text-zinc-400">
                            {metrics.contentBrief.internalLinkingPlan.map((link, i) => (
                              <li key={i} className="flex gap-2 items-center hover:text-white transition-colors cursor-pointer">
                                <span className="text-indigo-400 font-bold">➔</span>
                                <span className="font-mono">{link}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    </div>
                  )}
                </motion.div>
              )}

              {activeTab === 'governance' && (
                <motion.div 
                  initial={{ opacity: 0, y: 15 }} 
                  animate={{ opacity: 1, y: 0 }} 
                  exit={{ opacity: 0, y: -15 }} 
                  className="space-y-8"
                >
                  <div className="border-b border-zinc-800 pb-6">
                    <h3 className="text-3xl font-black text-white uppercase tracking-tight">AI Multi-Model Routing & Cost Governance</h3>
                    <p className="text-zinc-400 mt-2">Observe dynamic task allocation logic, smart deduplication layers, and local semantic caching savings.</p>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                    {/* Cost governor specs - 4 cols */}
                    <div className="lg:col-span-4 bg-zinc-950 border border-zinc-850 rounded-2xl p-6 space-y-6">
                      <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest block">Smart Cost Governor Metric Dashboard</span>
                      
                      <div className="text-center p-6 bg-zinc-900 border border-zinc-800 rounded-xl relative overflow-hidden">
                        <span className="text-[9px] font-mono text-zinc-500 block uppercase">Overall Token Cost Savings</span>
                        <div className="text-5xl font-black text-emerald-400 mt-2">78.4%</div>
                        <p className="text-[10px] text-zinc-500 mt-2 leading-relaxed">Achieved via local Redis semantic query deduplication and result caching.</p>
                      </div>

                      <div className="space-y-4 text-xs text-zinc-300">
                        <div className="flex justify-between items-center pb-2 border-b border-zinc-900">
                          <span>Semantic Cache Hit Ratio:</span>
                          <span className="font-mono text-emerald-400 font-bold">84.2%</span>
                        </div>
                        <div className="flex justify-between items-center pb-2 border-b border-zinc-900">
                          <span>Query Deduplication Index:</span>
                          <span className="font-mono text-white font-bold">94.1%</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span>Result Reuse Count:</span>
                          <span className="font-mono text-white font-bold">14,250 queries</span>
                        </div>
                      </div>
                    </div>

                    {/* Routing logger - 8 cols */}
                    <div className="lg:col-span-8 bg-zinc-950 border border-zinc-850 rounded-2xl p-6">
                      <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest block mb-4">Task-level Multi-Model Routing Logger</span>
                      
                      <div className="space-y-3">
                        {metrics.modelRoutingLog?.map((log, i) => (
                          <div key={i} className="bg-zinc-900 border border-zinc-850 p-4 rounded-xl flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                            <div>
                              <p className="text-[11.5px] font-bold text-white">{log.task}</p>
                              <p className="text-[10px] text-zinc-500 font-mono mt-0.5">Assigned Target System Model</p>
                            </div>
                            <div className="flex items-center gap-3 shrink-0">
                              <span className="px-2 py-0.5 bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-[10px] font-black rounded-lg uppercase tracking-wider">{log.model}</span>
                              <span className="text-[10px] font-mono text-zinc-500">{log.latencyMs}ms latency</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}

              {activeTab === 'roadmap' && (
                <motion.div 
                  initial={{ opacity: 0, y: 15 }} 
                  animate={{ opacity: 1, y: 0 }} 
                  exit={{ opacity: 0, y: -15 }} 
                  className="space-y-8"
                >
                  <div className="border-b border-zinc-800 pb-6">
                    <h3 className="text-3xl font-black text-white uppercase tracking-tight">Ranktica AI Search Intelligence Roadmap</h3>
                    <p className="text-zinc-400 mt-2">The blueprint detailing progression from offline sandboxed utilities to globally distributed event meshes.</p>
                  </div>

                  {/* Vertical interactive timeline */}
                  <div className="space-y-8 max-w-2xl mx-auto">
                    {/* V1 */}
                    <div className="relative pl-8 border-l-2 border-red-600 pb-4">
                      <div className="absolute -left-[9px] top-0.5 w-4 h-4 rounded-full bg-red-600 border-4 border-zinc-900" />
                      <div className="space-y-1.5">
                        <span className="text-[9px] font-mono text-red-500 font-black tracking-widest block uppercase">Phase V1 — Present (Client Sandboxing)</span>
                        <h4 className="text-sm font-bold text-white">IndexedDB offline caching, local state persistence, and basic metric discovery</h4>
                        <p className="text-[11px] text-zinc-400 leading-normal">Client browser acts as primary cache vault. Forms auto-persist and save state under offline states seamlessly.</p>
                      </div>
                    </div>

                    {/* V2 */}
                    <div className="relative pl-8 border-l-2 border-zinc-800 pb-4">
                      <div className="absolute -left-[9px] top-0.5 w-4 h-4 rounded-full bg-zinc-800 border-4 border-zinc-900" />
                      <div className="space-y-1.5">
                        <span className="text-[9px] font-mono text-zinc-500 font-black tracking-widest block uppercase">Phase V2 — Near Term (Server Orchestration)</span>
                        <h4 className="text-sm font-bold text-white">Full-stack database migrations and local SQLite backend triggers</h4>
                        <p className="text-[11px] text-zinc-400 leading-normal">Integrate direct SQLite queries, server endpoints, and token allocation safeguards on the Express backend.</p>
                      </div>
                    </div>

                    {/* V3 */}
                    <div className="relative pl-8 border-l-2 border-zinc-800 pb-4">
                      <div className="absolute -left-[9px] top-0.5 w-4 h-4 rounded-full bg-zinc-800 border-4 border-zinc-900" />
                      <div className="space-y-1.5">
                        <span className="text-[9px] font-mono text-zinc-500 font-black tracking-widest block uppercase">Phase V3 — Med Term (Generative Optimization)</span>
                        <h4 className="text-sm font-bold text-white">GEO indexing scans, Claude content brief compilation and multi-model routing</h4>
                        <p className="text-[11px] text-zinc-400 leading-normal">Expand tracking algorithms to monitor Perplexity, Gemini, ChatGPT, and Claude response indexes directly.</p>
                      </div>
                    </div>

                    {/* V4 */}
                    <div className="relative pl-8 border-l-2 border-zinc-800 pb-4">
                      <div className="absolute -left-[9px] top-0.5 w-4 h-4 rounded-full bg-zinc-800 border-4 border-zinc-900" />
                      <div className="space-y-1.5">
                        <span className="text-[9px] font-mono text-zinc-500 font-black tracking-widest block uppercase">Phase V4 — Long Term (Enterprise Analytics)</span>
                        <h4 className="text-sm font-bold text-white">Kafka event buses, pgvector semantic search and BullMQ task queues</h4>
                        <p className="text-[11px] text-zinc-400 leading-normal">Scale background worker architectures, real-time telemetry pipelines, and vector databases for zero-lag querying.</p>
                      </div>
                    </div>

                    {/* V5 */}
                    <div className="relative pl-8 pb-4">
                      <div className="absolute -left-[9px] top-0.5 w-4 h-4 rounded-full bg-zinc-800 border-4 border-zinc-900" />
                      <div className="space-y-1.5">
                        <span className="text-[9px] font-mono text-zinc-500 font-black tracking-widest block uppercase">Phase V5 — Visionary (Universal Autonomy)</span>
                        <h4 className="text-sm font-bold text-white">Self-healing, autonomous multi-tenant campaign optimization networks</h4>
                        <p className="text-[11px] text-zinc-400 leading-normal">Autonomous virtual specialists collaborate over event buses to formulate, launch, and optimize enterprise content models with zero human interaction.</p>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-28 text-zinc-700 gap-6 select-none bg-zinc-900/30 border border-zinc-850 rounded-[2rem] p-10 max-w-4xl mx-auto shadow-2xl">
          <div className="w-48 h-48 rounded-[3rem] border-4 border-dashed border-zinc-800 flex items-center justify-center text-zinc-600">
            <Layers size={64} strokeWidth={1} className="animate-pulse" />
          </div>
          <div className="text-center space-y-3 max-w-md">
            <p className="font-black uppercase text-xl text-white tracking-[0.2em]">Scanner Standing By</p>
            <p className="text-xs font-medium text-zinc-500 uppercase tracking-widest leading-relaxed">
              Enter a target query in the search input above to launch the clinical Deep-Index Crawler and initialize comprehensive GEO/AEO insights.
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default KeywordInspector;
