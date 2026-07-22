import React, { useState } from 'react';
import { 
  Search, 
  Folder, 
  FolderOpen, 
  Plus, 
  Star, 
  Download, 
  Clock, 
  TrendingUp, 
  Cpu, 
  SlidersHorizontal,
  Bookmark,
  Share2,
  Trash2,
  FileText,
  Pin,
  FileSpreadsheet,
  Terminal,
  History,
  ShieldCheck,
  ChevronRight,
  Sparkles,
  Loader2,
  CheckCircle
} from 'lucide-react';
import toast from 'react-hot-toast';

export interface ResearchReport {
  id: string;
  title: string;
  folder: string;
  summary: string;
  tags: string[];
  isPinned: boolean;
  isFavorite: boolean;
  isShared: boolean;
  date: string;
  version: string;
  creditsUsed: number;
  timeSavedMinutes: number;
  content: string;
  methodology: string;
}

export const PRESET_REPORTS: ResearchReport[] = [
  {
    id: 'rep-1',
    title: 'Generative Engine Optimization (GEO) Index - SaaS Market 2026',
    folder: 'GEO Reports',
    summary: 'Evaluating LLM citation likelihood for B2B developer tool SaaS startups across Gemini, ChatGPT, Perplexity, and Claude.',
    tags: ['GEO', 'LLM Citation', 'SaaS', 'SEO'],
    isPinned: true,
    isFavorite: true,
    isShared: true,
    date: '2026-07-10',
    version: 'V2.1',
    creditsUsed: 120,
    timeSavedMinutes: 240,
    content: `## Executive Summary
This GEO audit investigates B2B developer tool SaaS startup positioning across major Large Language Model search engines (ChatGPT, Gemini, Claude, Perplexity, Grok, and DeepSeek).
Current search paradigms are shifting rapidly toward Answer Engine Optimization (AEO). High organic Google ranking no longer guarantees LLM visibility.

## Key Findings
1. **Citation Authority**: ChatGPT (using SearchGPT crawler) relies heavily on Schema.org structured JSON-LD.
2. **Knowledge Graph Presence**: Gemini prioritizes official Google Maps locations, Wikidata identifiers, and high-frequency brand mentions on GitHub and StackOverflow.
3. **Structured Context**: Claude prefers comprehensive technical briefs and deep documentation structures.
4. **Answer Gaps**: 76% of startups omit specific API usage cost boundaries, resulting in ChatGPT hallucinating pricing during direct commercial intent queries.

## Strategic Recommendations
- **Deploy Schema Markup**: Implement complete SoftwareApplication and FAQ schema to anchor citation crawlers.
- **Entity Valency Expansion**: Secure high-authority brand mentions in curated developer indexes and technical blogs.
- **Close Competitor Answer Gaps**: Specifically write explicit comparisons addressing competitor pricing, database schemas, and migration limits.`,
    methodology: 'Autonomous RAG crawler querying 6 model endpoints over 50 product-intent seed prompts.'
  },
  {
    id: 'rep-2',
    title: 'Competitor Intelligence Brief: OpenAI vs Google Developer Ecosystem',
    folder: 'Competitor Research',
    summary: 'Deep-dive pricing, feature matrix, API latencies, and market positioning of GPT-4o vs Gemini 1.5 Pro and 2.5 Flash developer channels.',
    tags: ['Competitor', 'API Latency', 'AI Model', 'Pricing'],
    isPinned: true,
    isFavorite: false,
    isShared: false,
    date: '2026-07-12',
    version: 'V1.0',
    creditsUsed: 180,
    timeSavedMinutes: 360,
    content: `## Competitor Matrix Analysis
Comparing the core API pricing, structural boundaries, and multimodal velocity of current AI developer networks.

### Traffic & Pricing Breakdown
- **Gemini 2.5 Flash**: $0.075 / 1M input tokens. Under 400ms average latency. High multimodal video framing capability.
- **GPT-4o Mini**: $0.15 / 1M input tokens. Under 350ms average latency. Excellent code execution logic.
- **Claude 3.5 Haiku**: $0.25 / 1M input tokens. Highly structured, dense text representation output.

### SWOT Summary
- **Strengths**: Gemini has a massive 2M token context window and native integration with Google Workspace.
- **Weaknesses**: OpenAI maintains high brand equity and direct-to-consumer ChatGPT network effects.
- **Opportunities**: Blue Ocean gap in providing sub-cent, latency-monitored multi-model routing filters.
- **Threats**: Rapid commoditization of raw token intelligence driving margins to zero.`,
    methodology: 'Synthesized competitor telemetry via API latency benchmarks, pricing scrapers, and brand authority index monitoring.'
  },
  {
    id: 'rep-3',
    title: 'Answer Engine Optimization (AEO) Visibility Tracker - Fintech Niche',
    folder: 'AEO Reports',
    summary: 'Direct answer snippet opportunities and People Also Ask coverage within automated personal finance systems.',
    tags: ['AEO', 'Fintech', 'Featured Snippets'],
    isPinned: false,
    isFavorite: true,
    isShared: true,
    date: '2026-07-14',
    version: 'V1.4',
    creditsUsed: 95,
    timeSavedMinutes: 180,
    content: `## AEO Diagnostic Audit
Focuses on conversational finance query triggers and automated conversational search queries.

### Featured Snippet Probabilities
- **Query**: "How to automate multi-bank budget tracking securely?"
- **Snippet Opportunity**: Custom table listing bank API integrations (Plaid vs MX).
- **Probability Score**: 84% citation likelihood for pages structured with clear comparison tables.

### Key Gaps
- Fintech brands lack explicit answers to security compliance questions (SOC2, ISO 27001) in clear text paragraphs, losing AEO traction to legacy banks.`,
    methodology: 'Conversational prompt simulation monitoring featured snippets across 100 high-CPC finance key phrases.'
  },
  {
    id: 'rep-4',
    title: 'High-Growth Tech Startups Niche Opportunity Scoreboard - Pakistan & APAC',
    folder: 'Market Research',
    summary: 'Evaluating emerging AI, supply chain, and SaaS micro-niches with rising search volume and low competitor density.',
    tags: ['Market', 'Niche Gap', 'APAC', 'Startups'],
    isPinned: false,
    isFavorite: false,
    isShared: false,
    date: '2026-07-13',
    version: 'V1.1',
    creditsUsed: 140,
    timeSavedMinutes: 300,
    content: `## Market Opportunity Mapping: APAC Tech Hubs
An audit of under-served software niches in Pakistan and adjacent South Asian markets.

### 1. B2B Localized Supply Chain SaaS
- **Opportunity Score**: 92/100
- **Volume Trend**: +140% YoY query interest.
- **Competitor Density**: Extremely Low (dominated by offline brokers and legacy spreadsheets).
- **Gap**: Zero localized mobile inventory management tools with integrated voice translation.

### 2. Multi-Model Arabic & Urdu Voice Agents
- **Opportunity Score**: 89/100
- **Volume Trend**: Exploding regional search volume for voice commands.
- **Gap**: Missing localized accents in standard LLM TTS interfaces (e.g., Charon/Zephyr configs).`,
    methodology: 'Google Trends scrapers, regional startup registry indexing, and localized keyword inspection.'
  },
  {
    id: 'rep-5',
    title: 'Blue Ocean Strategy Framework for AI-Driven Content Calendars',
    folder: 'Campaign Research',
    summary: 'Re-inventing automated publishing workflows by eliminating manual scheduling queues and creating real-time telemetry pipelines.',
    tags: ['Strategy', 'Blue Ocean', 'Content Calendar'],
    isPinned: false,
    isFavorite: true,
    isShared: false,
    date: '2026-07-11',
    version: 'V3.0',
    creditsUsed: 110,
    timeSavedMinutes: 200,
    content: `## Blue Ocean Strategy Map: Content Scheduling
Moving away from red ocean competition (such as generic scheduling queues like Buffer or Hootsuite).

### Eliminate
- Perfect calendar symmetry schedules (robotic hourly publishing).
- Expensive, low-value bulk template databases.
- Multi-user seat premium gating for simple drafts.

### Reduce
- Time spent copy-pasting descriptions across platforms.
- Dependence on third-party tracking URLs.

### Raise
- Real-time CTR prediction models prior to publishing.
- Dynamic entity tagging based on live trending hashtags.

### Create
- Decoupled media catalogues that sync assets to headless hosting servers.
- Conversational telemetry command consoles.`,
    methodology: 'Applying W. Chan Kim competitive matrix modeling to active creative SaaS features.'
  }
];

const ARCHIVE_FOLDERS = [
  'Market Research',
  'Competitor Research',
  'Keyword Research',
  'Brand Research',
  'Content Research',
  'SEO Reports',
  'GEO Reports',
  'AEO Reports',
  'Campaign Research',
  'Customer Research',
  'Industry Reports',
  'Technology Research',
  'Saved Prompts',
  'Uploaded Assets',
  'Generated Reports'
];

interface ResearchDashboardProps {
  onOpenReport: (report: ResearchReport) => void;
  onOpenCopilotWithQuery: (query: string) => void;
  reports?: ResearchReport[];
  onUpdateReports?: (updated: ResearchReport[]) => void;
  activeAgentRun?: {
    query: string;
    step: number;
    status: 'idle' | 'running' | 'completed';
    logs: string[];
    summary: string;
  };
  onTriggerAgentRun?: (query: string) => void;
}

export const ResearchDashboard: React.FC<ResearchDashboardProps> = ({ 
  onOpenReport, 
  onOpenCopilotWithQuery,
  reports: propReports,
  onUpdateReports,
  activeAgentRun,
  onTriggerAgentRun
}) => {
  const [localReports, setLocalReports] = useState<ResearchReport[]>(() => {
    const saved = localStorage.getItem('ranktica_research_reports');
    if (saved) {
      try { return JSON.parse(saved); } catch (e) { return PRESET_REPORTS; }
    }
    return PRESET_REPORTS;
  });

  const reports = propReports || localReports;
  const setReports = (updated: ResearchReport[]) => {
    if (onUpdateReports) {
      onUpdateReports(updated);
    } else {
      setLocalReports(updated);
      localStorage.setItem('ranktica_research_reports', JSON.stringify(updated));
    }
  };

  const [selectedFolder, setSelectedFolder] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [tagFilter, setTagFilter] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'favorites' | 'shared' | 'pinned'>('all');
  const [selectedReportId, setSelectedReportId] = useState<string | null>(null);
  const [showNewReportModal, setShowNewReportModal] = useState(false);

  // New Report Form state
  const [newTitle, setNewTitle] = useState('');
  const [newFolder, setNewFolder] = useState('Market Research');
  const [newSummary, setNewSummary] = useState('');
  const [newContent, setNewContent] = useState('');
  const [newTags, setNewTags] = useState('');

  // Save to LocalStorage helper
  const saveReports = (updated: ResearchReport[]) => {
    setReports(updated);
    localStorage.setItem('ranktica_research_reports', JSON.stringify(updated));
  };

  const handleCreateReport = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !newContent.trim()) {
      toast.error('Please fill in the title and report content.');
      return;
    }

    const tagsArray = newTags.split(',').map(t => t.trim()).filter(t => t !== '');
    const newReport: ResearchReport = {
      id: `rep-${Date.now()}`,
      title: newTitle,
      folder: newFolder,
      summary: newSummary || newContent.substring(0, 100) + '...',
      tags: tagsArray.length > 0 ? tagsArray : ['Research'],
      isPinned: false,
      isFavorite: false,
      isShared: false,
      date: new Date().toISOString().split('T')[0],
      version: 'V1.0',
      creditsUsed: Math.floor(Math.random() * 80) + 40,
      timeSavedMinutes: Math.floor(Math.random() * 120) + 60,
      content: newContent,
      methodology: 'Autonomous Multi-Agent synthesis triggered in user workspace.'
    };

    const updated = [newReport, ...reports];
    saveReports(updated);
    setShowNewReportModal(false);
    
    // Reset Form
    setNewTitle('');
    setNewSummary('');
    setNewContent('');
    setNewTags('');
    
    toast.success('New strategic research report generated in archive!');
  };

  const togglePin = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const updated = reports.map(r => r.id === id ? { ...r, isPinned: !r.isPinned } : r);
    saveReports(updated);
    toast.success(updated.find(r => r.id === id)?.isPinned ? 'Report pinned to top' : 'Report unpinned');
  };

  const toggleFavorite = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const updated = reports.map(r => r.id === id ? { ...r, isFavorite: !r.isFavorite } : r);
    saveReports(updated);
    toast.success(updated.find(r => r.id === id)?.isFavorite ? 'Added to favorites' : 'Removed from favorites');
  };

  const toggleShared = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const updated = reports.map(r => r.id === id ? { ...r, isShared: !r.isShared } : r);
    saveReports(updated);
    toast.success(updated.find(r => r.id === id)?.isShared ? 'Report shared to team workspace' : 'Report sharing disabled');
  };

  const deleteReport = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm('Are you sure you want to delete this strategic report?')) {
      const updated = reports.filter(r => r.id !== id);
      saveReports(updated);
      toast.success('Report deleted from archive.');
    }
  };

  // KPI calculations
  const totalReportsCount = reports.length;
  const totalCreditsUsed = reports.reduce((sum, r) => sum + r.creditsUsed, 10620);
  const totalHoursSaved = Math.round((reports.reduce((sum, r) => sum + r.timeSavedMinutes, 9840)) / 60);
  const totalFavoriteCount = reports.filter(r => r.isFavorite).length;
  const totalSharedCount = reports.filter(r => r.isShared).length;

  // Filtering reports
  const filteredReports = reports.filter(r => {
    const matchesSearch = r.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          r.summary.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          r.content.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesFolder = selectedFolder ? r.folder === selectedFolder : true;
    
    const matchesTag = tagFilter ? r.tags.some(t => t.toLowerCase().includes(tagFilter.toLowerCase())) : true;
    
    const matchesType = filterType === 'all' ? true :
                        filterType === 'favorites' ? r.isFavorite :
                        filterType === 'pinned' ? r.isPinned :
                        filterType === 'shared' ? r.isShared : true;

    return matchesSearch && matchesFolder && matchesTag && matchesType;
  });

  const allAvailableTags = Array.from(new Set(reports.flatMap(r => r.tags)));

  // GTM Quick Action queries
  const QUICK_QUERIES = [
    'Analyze my competitors',
    'Research AI marketing trends',
    'Find content gaps',
    'Compare OpenAI vs Gemini',
    'Predict future industry trends',
    'Develop a 12-month roadmap'
  ];

  const handleExportJSON = (report: ResearchReport) => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(report, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `${report.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_report.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
    toast.success('Report exported to JSON!');
  };

  const handleExportCSV = (report: ResearchReport) => {
    const csvContent = "data:text/csv;charset=utf-8," + [
      ["Parameter", "Value"],
      ["Title", report.title],
      ["Folder", report.folder],
      ["Date", report.date],
      ["Version", report.version],
      ["Credits Used", report.creditsUsed],
      ["Time Saved (min)", report.timeSavedMinutes],
      ["Methodology", report.methodology],
      ["Content Summary", report.summary],
      ["Tags", report.tags.join(" | ")]
    ].map(e => e.map(val => `"${String(val).replace(/"/g, '""')}"`).join(",")).join("\n");

    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", encodeURI(csvContent));
    downloadAnchor.setAttribute("download", `${report.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_metrics.csv`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
    toast.success('Report metrics exported to CSV!');
  };

  const handleExportMarkdown = (report: ResearchReport) => {
    const mdText = `# ${report.title}
**Folder**: ${report.folder} | **Date**: ${report.date} | **Version**: ${report.version}
**Credits Used**: ${report.creditsUsed} tokens | **Research Time Saved**: ${report.timeSavedMinutes} minutes

---

## 📈 Executive Summary
${report.summary}

---

${report.content}

---
## 🛠️ Methodology & Sources
${report.methodology}
**Tags**: ${report.tags.map(t => `#${t}`).join(', ')}
`;
    const dataStr = "data:text/markdown;charset=utf-8," + encodeURIComponent(mdText);
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `${report.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_report.md`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
    toast.success('Report exported as Markdown!');
  };

  return (
    <div className="space-y-8 animate-fade-in text-zinc-300">
      
      {/* Metrics Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        
        <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-6 relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-all">
            <SlidersHorizontal size={80} className="text-white" />
          </div>
          <p className="text-[10px] font-black uppercase tracking-widest text-zinc-500 mb-2">Research Projects</p>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-black text-white font-mono">{totalReportsCount}</span>
            <span className="text-xs text-red-500 font-bold uppercase font-mono">Archive Active</span>
          </div>
          <div className="flex justify-between items-center mt-4 pt-4 border-t border-zinc-800 text-[10px] text-zinc-400 font-bold uppercase">
            <span>Pinned Reports: {reports.filter(r => r.isPinned).length}</span>
            <span className="text-zinc-600">•</span>
            <span>Folders: {ARCHIVE_FOLDERS.length}</span>
          </div>
        </div>

        <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-6 relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-all">
            <TrendingUp size={80} className="text-emerald-500" />
          </div>
          <p className="text-[10px] font-black uppercase tracking-widest text-zinc-500 mb-2">Saved Insights</p>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-black text-emerald-400 font-mono">256</span>
            <span className="text-xs text-emerald-500 font-bold uppercase font-mono">+12 New</span>
          </div>
          <div className="flex justify-between items-center mt-4 pt-4 border-t border-zinc-800 text-[10px] text-zinc-400 font-bold uppercase">
            <span>Favorites: {totalFavoriteCount}</span>
            <span className="text-zinc-600">•</span>
            <span>Shared: {totalSharedCount}</span>
          </div>
        </div>

        <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-6 relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-all">
            <Cpu size={80} className="text-indigo-500" />
          </div>
          <p className="text-[10px] font-black uppercase tracking-widest text-zinc-500 mb-2">AI Credits Meter</p>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-black text-indigo-400 font-mono">
              {totalCreditsUsed.toLocaleString()}
            </span>
            <span className="text-xs text-indigo-500 font-bold uppercase">Tokens</span>
          </div>
          <div className="flex justify-between items-center mt-4 pt-4 border-t border-zinc-800 text-[10px] text-zinc-400 font-bold uppercase">
            <span>Quota Cap: 150K</span>
            <span className="text-zinc-600">•</span>
            <span>Usage: {Math.round((totalCreditsUsed / 150000) * 100)}%</span>
          </div>
        </div>

        <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-6 relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-all">
            <Clock size={80} className="text-red-500" />
          </div>
          <p className="text-[10px] font-black uppercase tracking-widest text-zinc-500 mb-2">Research Time Saved</p>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-black text-red-500 font-mono">{totalHoursSaved}</span>
            <span className="text-xs text-red-500 font-bold uppercase">Hours</span>
          </div>
          <div className="flex justify-between items-center mt-4 pt-4 border-t border-zinc-800 text-[10px] text-zinc-400 font-bold uppercase">
            <span>Automation: 100%</span>
            <span className="text-zinc-600">•</span>
            <span>Avg Saved: 4.8 hr/rep</span>
          </div>
        </div>

      </div>

      {/* AI-Generated Executive Summary Card */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-[2rem] p-6 lg:p-8 relative overflow-hidden">
        {/* Visual elements */}
        <div className="absolute top-0 right-0 p-8 opacity-5">
          <Sparkles size={120} className="text-indigo-400" />
        </div>
        
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 border-b border-zinc-800/80 pb-6 mb-6">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-indigo-500 animate-pulse" />
              <h3 className="text-sm font-black uppercase tracking-[0.2em] text-white">
                AI-Generated Executive Summary Hub
              </h3>
            </div>
            <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider font-mono">
              Autonomous Synthesis Engine • Real-Time Core Updates
            </p>
          </div>
          
          <div className="flex items-center gap-3">
            {activeAgentRun && activeAgentRun.status === 'running' ? (
              <div className="flex items-center gap-2 bg-indigo-600/10 border border-indigo-500/20 px-3 py-1.5 rounded-xl text-xs text-indigo-400 font-black uppercase tracking-widest font-mono">
                <Loader2 size={12} className="animate-spin" />
                <span>Agents Orchestrating (Step {activeAgentRun.step + 1}/5)</span>
              </div>
            ) : activeAgentRun && activeAgentRun.status === 'completed' ? (
              <div className="flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/20 px-3 py-1.5 rounded-xl text-xs text-emerald-400 font-black uppercase tracking-widest font-mono">
                <CheckCircle size={12} />
                <span>Synthesis Completed</span>
              </div>
            ) : (
              <div className="bg-zinc-950 px-3 py-1.5 rounded-xl text-xs text-zinc-500 font-black uppercase tracking-widest font-mono">
                <span>System Idling</span>
              </div>
            )}
          </div>
        </div>

        {/* Real-time agent status stepper */}
        {activeAgentRun && activeAgentRun.status === 'running' && (
          <div className="mb-6 bg-zinc-950/40 p-4 rounded-2xl border border-zinc-850">
            <p className="text-[9px] font-black uppercase tracking-widest text-zinc-500 mb-3 font-mono">
              Orchestration Pipeline: {activeAgentRun.query}
            </p>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
              {[
                'Planner',
                'Competitors',
                'GEO Visibility',
                'AEO & Trends',
                'Final Review'
              ].map((name, i) => {
                const isActive = activeAgentRun.step === i;
                const isDone = activeAgentRun.step > i;
                return (
                  <div 
                    key={i} 
                    className={`p-2.5 rounded-xl border text-center transition-all ${isActive ? 'bg-[#09090b] border-indigo-500 text-indigo-400 shadow-md scale-105' : isDone ? 'bg-emerald-500/5 border-emerald-500/20 text-emerald-500 opacity-80' : 'bg-zinc-950 border-zinc-900 text-zinc-600'}`}
                  >
                    <p className="text-[10px] font-bold truncate">{name}</p>
                    <p className="text-[8px] mt-1 font-bold font-mono opacity-85">
                      {isDone ? '✓ Completed' : isActive ? '● Active' : 'Waiting'}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
          {/* Executive Summary Output Text Box */}
          <div className="lg:col-span-8 flex flex-col justify-between bg-zinc-950 border border-zinc-850 p-6 rounded-2xl relative">
            <div className="space-y-4">
              <p className="text-[10px] font-black uppercase tracking-widest text-zinc-500 font-mono">
                Latest Strategic Findings Summary
              </p>
              
              <div className="text-xs text-zinc-300 font-medium leading-relaxed font-mono whitespace-pre-line max-h-[300px] overflow-y-auto custom-scrollbar pr-2">
                {activeAgentRun && activeAgentRun.summary ? activeAgentRun.summary : (
                  reports.length > 0 ? (
                    `• Base Archive Loaded: ${reports.length} strategic briefs active.\n• Pinned Intel: "${reports.find(r => r.isPinned)?.title || reports[0].title}" is anchored at top.\n• Latest Synthesis: "${reports[0].title}" compiled on ${reports[0].date}.\n\nExecutive Insight: The system is ready for new business parameters. Enter an inquiry topic below to execute a real-time multi-agent campaign audit.`
                  ) : (
                    "No active insights compiled. Start a real-time multi-agent orchestration below."
                  )
                )}
              </div>
            </div>

            {/* If completed, let them open the latest report */}
            {activeAgentRun && activeAgentRun.status === 'completed' && (
              <div className="mt-4 pt-4 border-t border-zinc-900 flex justify-end">
                <button
                  onClick={() => {
                    const latestGenerated = reports.find(r => r.title.includes(activeAgentRun.query));
                    if (latestGenerated) {
                      onOpenReport(latestGenerated);
                    } else if (reports.length > 0) {
                      onOpenReport(reports[0]);
                    }
                  }}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-black uppercase tracking-widest text-[10px] rounded-xl flex items-center gap-1.5 transition-all cursor-pointer"
                >
                  <FileText size={12} />
                  <span>Review Executive Report</span>
                </button>
              </div>
            )}
          </div>

          {/* Quick trigger section (Right 4 columns) */}
          <div className="lg:col-span-4 flex flex-col justify-between bg-zinc-950/40 border border-zinc-850 p-6 rounded-2xl">
            <div className="space-y-4">
              <p className="text-[10px] font-black uppercase tracking-widest text-zinc-400 font-mono flex items-center gap-1">
                <Terminal size={12} className="text-red-500" />
                <span>Launch Agent Inquiry</span>
              </p>
              <p className="text-xs text-zinc-500 leading-relaxed font-medium">
                Directly orchestrate our team of AI agents (Planner, Competitors, GEO, AEO, Reviewer) to perform real-time target research.
              </p>
            </div>

            <div className="mt-6 space-y-3">
              <input
                type="text"
                id="summary-inquiry-input"
                placeholder="e.g., Fintech expansion Pakistan 2026"
                disabled={activeAgentRun && activeAgentRun.status === 'running'}
                className="w-full bg-zinc-950 border border-zinc-800 focus:border-red-600 outline-none px-4 py-3 text-xs font-bold text-white rounded-xl placeholder-zinc-600 disabled:opacity-50"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    const val = (e.target as HTMLInputElement).value;
                    if (val && onTriggerAgentRun) {
                      onTriggerAgentRun(val);
                      (e.target as HTMLInputElement).value = '';
                    }
                  }
                }}
              />
              <button
                disabled={activeAgentRun && activeAgentRun.status === 'running'}
                onClick={() => {
                  const inputEl = document.getElementById('summary-inquiry-input') as HTMLInputElement;
                  if (inputEl && inputEl.value && onTriggerAgentRun) {
                    onTriggerAgentRun(inputEl.value);
                    inputEl.value = '';
                  } else {
                    toast.error('Please enter an inquiry topic first.');
                  }
                }}
                className="w-full py-3 bg-red-600 hover:bg-red-500 disabled:bg-zinc-800 text-white rounded-xl text-xs font-black uppercase tracking-widest cursor-pointer transition-all flex items-center justify-center gap-1.5 shadow-lg shadow-red-600/10"
              >
                <Sparkles size={12} className="animate-pulse" />
                <span>{activeAgentRun && activeAgentRun.status === 'running' ? 'Agents Compiling...' : 'Orchestrate Team'}</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Launchpad & Strategic Assistant Prompts */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-[2rem] p-6 lg:p-8">
        <h3 className="text-md font-bold text-white mb-4 flex items-center gap-2">
          <Sparkles size={18} className="text-red-500" />
          Strategic Intelligence Prompts (AI Research Copilot)
        </h3>
        <p className="text-xs text-zinc-500 mb-6 font-medium uppercase tracking-widest">
          Click any analytical prompt below to load it directly into the AI Research Copilot Stage:
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {QUICK_QUERIES.map((q, idx) => (
            <button
              key={idx}
              onClick={() => onOpenCopilotWithQuery(q)}
              className="p-4 bg-zinc-950 hover:bg-zinc-950/80 border border-zinc-800/80 hover:border-red-600/30 text-left text-xs font-bold text-zinc-400 hover:text-white rounded-2xl transition-all hover:translate-y-[-1px] group flex justify-between items-center cursor-pointer"
            >
              <span>{q}</span>
              <ChevronRight size={14} className="text-zinc-700 group-hover:text-red-500 transition-colors" />
            </button>
          ))}
        </div>
      </div>

      {/* Main Archive Explorer Split Stage */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Folders List (Left 3 columns) */}
        <div className="lg:col-span-3 space-y-4">
          <div className="bg-zinc-900 border border-zinc-800 rounded-[2rem] p-6">
            <div className="flex justify-between items-center mb-4">
              <h4 className="text-xs font-black uppercase tracking-widest text-zinc-500 flex items-center gap-2">
                <Folder size={16} className="text-zinc-500" />
                Strategic Folders
              </h4>
              {selectedFolder && (
                <button 
                  onClick={() => setSelectedFolder(null)}
                  className="text-[10px] font-bold text-red-500 hover:text-red-400 uppercase tracking-widest"
                >
                  Clear
                </button>
              )}
            </div>
            
            <div className="space-y-1 max-h-[420px] overflow-y-auto custom-scrollbar pr-1">
              <button
                onClick={() => setSelectedFolder(null)}
                className={`w-full text-left px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-between ${!selectedFolder ? 'bg-red-600/10 border border-red-600/20 text-red-500' : 'hover:bg-zinc-850 text-zinc-400 hover:text-zinc-200'}`}
              >
                <span className="flex items-center gap-2">
                  <FolderOpen size={14} />
                  <span>All Documents</span>
                </span>
                <span className="font-mono text-[10px] bg-zinc-950 px-2 py-0.5 rounded-full text-zinc-500">{reports.length}</span>
              </button>

              {ARCHIVE_FOLDERS.map((f, idx) => {
                const count = reports.filter(r => r.folder === f).length;
                return (
                  <button
                    key={idx}
                    onClick={() => setSelectedFolder(f)}
                    className={`w-full text-left px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-between ${selectedFolder === f ? 'bg-red-600/10 border border-red-600/20 text-red-500' : 'hover:bg-zinc-850 text-zinc-400 hover:text-zinc-200'}`}
                  >
                    <span className="flex items-center gap-2 truncate">
                      <Folder size={14} className={selectedFolder === f ? 'text-red-500' : 'text-zinc-600'} />
                      <span className="truncate">{f}</span>
                    </span>
                    <span className="font-mono text-[10px] bg-zinc-950 px-2 py-0.5 rounded-full text-zinc-500 shrink-0">{count}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Quick Stats Summary */}
          <div className="bg-zinc-900 border border-zinc-800 rounded-[2rem] p-6 text-xs text-zinc-500 space-y-3 font-mono">
            <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest flex items-center gap-1.5 font-sans mb-3">
              <ShieldCheck size={14} className="text-emerald-500" />
              Secure Enterprise Node
            </p>
            <div className="flex justify-between border-b border-zinc-850 pb-2">
              <span>Tenant Isolation:</span>
              <span className="text-emerald-400 font-bold">Active (AES-256)</span>
            </div>
            <div className="flex justify-between border-b border-zinc-850 pb-2">
              <span>Vector Database:</span>
              <span className="text-zinc-300">pgvector Caching</span>
            </div>
            <div className="flex justify-between">
              <span>OpenTelemetry:</span>
              <span className="text-zinc-500">Connected</span>
            </div>
          </div>
        </div>

        {/* Reports Archive Table & Detail (Right 9 columns) */}
        <div className="lg:col-span-9 space-y-6">
          <div className="bg-zinc-900 border border-zinc-800 rounded-[2rem] p-6">
            
            {/* Toolbar */}
            <div className="flex flex-col md:flex-row gap-4 items-center justify-between mb-6 border-b border-zinc-800/60 pb-6">
              
              <div className="relative w-full md:w-72">
                <Search size={16} className="absolute left-4 top-3.5 text-zinc-600" />
                <input
                  type="text"
                  placeholder="Search research reports, findings..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-800 hover:border-zinc-700 focus:border-red-600/50 outline-none pl-11 pr-4 py-3 text-xs font-semibold text-white rounded-2xl transition-all"
                />
              </div>

              <div className="flex flex-wrap gap-2 w-full md:w-auto justify-end">
                <select
                  value={filterType}
                  onChange={(e: any) => setFilterType(e.target.value)}
                  className="bg-zinc-950 border border-zinc-800 outline-none px-4 py-2.5 rounded-xl text-xs font-bold text-zinc-400 focus:text-white cursor-pointer"
                >
                  <option value="all">All Documents</option>
                  <option value="pinned">Pinned Only</option>
                  <option value="favorites">Favorites Only</option>
                  <option value="shared">Shared Workspace</option>
                </select>

                <select
                  value={tagFilter}
                  onChange={(e) => setTagFilter(e.target.value)}
                  className="bg-zinc-950 border border-zinc-800 outline-none px-4 py-2.5 rounded-xl text-xs font-bold text-zinc-400 focus:text-white cursor-pointer"
                >
                  <option value="">All Tags</option>
                  {allAvailableTags.map((tag, i) => (
                    <option key={i} value={tag}>{tag}</option>
                  ))}
                </select>

                <button
                  onClick={() => setShowNewReportModal(true)}
                  className="px-4 py-2.5 bg-red-600 hover:bg-red-500 text-white rounded-xl text-xs font-black uppercase tracking-wider flex items-center gap-2 cursor-pointer transition-all shadow-lg shadow-red-600/10 active-press"
                >
                  <Plus size={14} />
                  <span>Synthesize Report</span>
                </button>
              </div>

            </div>

            {/* List and Details section */}
            <div className="space-y-4">
              {filteredReports.length === 0 ? (
                <div className="p-12 text-center text-zinc-600">
                  <FileText size={48} className="mx-auto mb-4 opacity-20" />
                  <p className="text-xs font-black uppercase tracking-widest leading-loose">No strategic reports matching active filter metrics</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-4">
                  {filteredReports.map(report => (
                    <div
                      key={report.id}
                      onClick={() => onOpenReport(report)}
                      className="bg-zinc-950 hover:bg-zinc-950/80 border border-zinc-850 hover:border-zinc-700 p-5 rounded-2xl transition-all cursor-pointer group relative overflow-hidden"
                    >
                      <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 mb-3">
                        <div className="space-y-1.5 max-w-[85%]">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-[10px] font-black uppercase tracking-widest text-zinc-600 font-mono">
                              {report.folder}
                            </span>
                            <span className="text-zinc-700">•</span>
                            <span className="text-[10px] text-zinc-500 font-semibold font-mono">
                              {report.date}
                            </span>
                            <span className="text-zinc-700">•</span>
                            <span className="text-[9px] text-red-500 font-bold bg-red-600/10 px-2 py-0.5 rounded-full font-mono">
                              {report.version}
                            </span>
                          </div>
                          
                          <h4 className="text-sm font-bold text-white group-hover:text-red-500 transition-colors flex items-center gap-2">
                            {report.isPinned && <Pin size={12} className="text-red-500 shrink-0" />}
                            {report.title}
                          </h4>
                          
                          <p className="text-xs text-zinc-400 font-medium leading-relaxed">
                            {report.summary}
                          </p>
                        </div>

                        {/* Interactive Flags */}
                        <div className="flex items-center gap-2 self-start md:self-auto shrink-0 bg-zinc-900 px-3 py-1.5 rounded-xl border border-zinc-800">
                          <button
                            onClick={(e) => togglePin(report.id, e)}
                            className={`p-1 hover:text-white transition-colors ${report.isPinned ? 'text-red-500' : 'text-zinc-600'}`}
                            title="Pin Report"
                          >
                            <Pin size={14} />
                          </button>
                          <button
                            onClick={(e) => toggleFavorite(report.id, e)}
                            className={`p-1 hover:text-white transition-colors ${report.isFavorite ? 'text-yellow-500 font-bold' : 'text-zinc-600'}`}
                            title="Favorite Report"
                          >
                            <Star size={14} fill={report.isFavorite ? 'currentColor' : 'none'} />
                          </button>
                          <button
                            onClick={(e) => toggleShared(report.id, e)}
                            className={`p-1 hover:text-white transition-colors ${report.isShared ? 'text-indigo-400' : 'text-zinc-600'}`}
                            title="Share to Workspace"
                          >
                            <Share2 size={14} />
                          </button>
                          <button
                            onClick={(e) => deleteReport(report.id, e)}
                            className="p-1 text-zinc-600 hover:text-red-500 transition-colors"
                            title="Delete Report"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </div>

                      {/* Footer - Tags and Actions */}
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-3 border-t border-zinc-900">
                        <div className="flex flex-wrap gap-1.5">
                          {report.tags.map((tag, i) => (
                            <span key={i} className="text-[10px] bg-zinc-900 text-zinc-500 border border-zinc-800 px-2 py-0.5 rounded-full font-bold">
                              #{tag}
                            </span>
                          ))}
                        </div>

                        <div className="flex gap-2 text-[10px] font-black uppercase tracking-widest text-zinc-500 font-mono">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleExportMarkdown(report);
                            }}
                            className="flex items-center gap-1 hover:text-red-500 transition-colors bg-zinc-900 border border-zinc-800 px-2 py-1 rounded-md"
                          >
                            <Download size={10} /> MD
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleExportJSON(report);
                            }}
                            className="flex items-center gap-1 hover:text-indigo-400 transition-colors bg-zinc-900 border border-zinc-800 px-2 py-1 rounded-md"
                          >
                            <Download size={10} /> JSON
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleExportCSV(report);
                            }}
                            className="flex items-center gap-1 hover:text-emerald-400 transition-colors bg-zinc-900 border border-zinc-800 px-2 py-1 rounded-md"
                          >
                            <Download size={10} /> CSV
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

          </div>
        </div>

      </div>

      {/* Synthesize New Report Modal */}
      {showNewReportModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/80 backdrop-blur-md">
          <div className="bg-zinc-900 border border-zinc-800 w-full max-w-2xl rounded-3xl overflow-hidden shadow-2xl animate-scale-in">
            <div className="p-6 border-b border-zinc-800 flex justify-between items-center bg-zinc-950/40">
              <h3 className="text-sm font-black uppercase tracking-[0.2em] text-white flex items-center gap-2">
                <Sparkles size={16} className="text-red-500" />
                Strategic Report Synthesizer
              </h3>
              <button 
                onClick={() => setShowNewReportModal(false)}
                className="text-zinc-500 hover:text-white font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateReport} className="p-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500 block mb-2">Report Title</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. competitors SWOT & traffic flows"
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                    className="w-full bg-zinc-950 border border-zinc-800 focus:border-red-600 outline-none text-xs font-bold text-white px-4 py-3 rounded-xl"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500 block mb-2">Target Folder</label>
                  <select
                    value={newFolder}
                    onChange={(e) => setNewFolder(e.target.value)}
                    className="w-full bg-zinc-950 border border-zinc-800 focus:border-red-600 outline-none text-xs font-bold text-white px-4 py-3 rounded-xl cursor-pointer"
                  >
                    {ARCHIVE_FOLDERS.map((f, i) => (
                      <option key={i} value={f}>{f}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500 block mb-2">Quick Summary</label>
                <input
                  type="text"
                  placeholder="A brief strategic overview describing the core insights..."
                  value={newSummary}
                  onChange={(e) => setNewSummary(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-800 focus:border-red-600 outline-none text-xs font-bold text-white px-4 py-3 rounded-xl"
                />
              </div>

              <div>
                <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500 block mb-2">Report Body (Markdown supported)</label>
                <textarea
                  required
                  rows={8}
                  placeholder="## Executive Summary&#13;Write findings, tables, SWOT grids or recommendations..."
                  value={newContent}
                  onChange={(e) => setNewContent(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-800 focus:border-red-600 outline-none text-xs font-medium text-white p-4 rounded-xl resize-none font-mono"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500 block mb-2">Tags (Comma separated)</label>
                  <input
                    type="text"
                    placeholder="Market, Competitor, SEO, GEO"
                    value={newTags}
                    onChange={(e) => setNewTags(e.target.value)}
                    className="w-full bg-zinc-950 border border-zinc-800 focus:border-red-600 outline-none text-xs font-bold text-white px-4 py-3 rounded-xl"
                  />
                </div>

                <div className="flex items-end justify-end">
                  <button
                    type="submit"
                    className="w-full py-3 bg-red-600 hover:bg-red-500 text-white font-black uppercase tracking-wider text-xs rounded-xl shadow-lg shadow-red-600/10 active-press transition-all cursor-pointer text-center"
                  >
                    Compile to Archive
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
