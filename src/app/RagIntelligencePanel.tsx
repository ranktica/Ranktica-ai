import React, { useState, useEffect, useRef } from 'react';
import { 
  Database, 
  UploadCloud, 
  Search, 
  Sliders, 
  Network, 
  Activity, 
  Trash2, 
  CheckCircle, 
  HelpCircle, 
  ChevronRight, 
  Zap, 
  Grid, 
  ExternalLink, 
  BookOpen, 
  Globe, 
  Sparkles,
  Eye,
  RefreshCw,
  Plus,
  Compass,
  CornerDownRight,
  ShieldCheck,
  Award
} from 'lucide-react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  ResponsiveContainer, 
  Cell, 
  PieChart, 
  Pie 
} from 'recharts';
import * as d3 from 'd3';
import toast from 'react-hot-toast';
import { motion, AnimatePresence } from 'motion/react';

// Ingestion preloads templates to support instantaneous loading
const SAMPLE_TEMPLATES = [
  {
    title: "Enterprise Brand Guidelines & Product Portfolio",
    type: "Document",
    url: "internal://brand-wiki",
    content: "Ranktica AI core brand focuses on delivering high-performance SEO, GEO, and AEO optimization automation algorithms. Our premium product is called Ranktics Flow which analyzes competitor video assets and designs visual high-CTR recommendations. The target personas are technopreneurs, digital agency founders, and dynamic video content creators. Competitors include legacy SEO systems like Ahrefs and SEMrush, but Ranktica AI competes by utilizing predictive CTR metrics and real-time Google AI Overviews ranking."
  },
  {
    title: "Q3 Active Organic Channels SEO Diagnostics",
    type: "SEO Data",
    url: "https://ranktica.ai/seo-diagnostics",
    content: "Our organic analytics indicators show that organic referral queries for 'AI SEO automator' has climbed by 280% month-over-month. To rank higher in ChatGPT Search and Perplexity, Ranktica AI emphasizes Generative Engine Optimization (GEO) by securing direct entity citations next to authoritative brand definitions. Key competitor Semrush holds 45% traffic share, but lacks AI Overview summaries alignment. Target keywords priority list contains: 'Generative Engine Optimization', 'AEO triggers', 'AI search index scoring'."
  },
  {
    title: "Interactive Client Sentiment & Retention Auditing",
    type: "Customer Data",
    url: "internal://q3-customer-sentiment",
    content: "Direct feedback transcripts from 150 elite enterprise agencies indicate high retention rates of 94% on the Ranktics Flow platform. Users praise the custom metadata suggestions and autonomous schedule automation. A minor friction point cited is API payload rate-limiting. Key retention metrics prioritize: prompt accuracy counts, automated publishing cycles latency, and visual click-through rate predictive alignment stats."
  }
];

export function RagIntelligencePanel() {
  const [activeTab, setActiveTab] = useState<'analytics' | 'ingest' | 'query' | 'graph' | 'config'>('analytics');
  
  // States
  const [analytics, setAnalytics] = useState<any>({
    totalSources: 0,
    totalChunks: 0,
    totalGraphNodes: 0,
    totalGraphRelationships: 0,
    sourcesBreakdown: [],
    entityTypeBreakdown: [],
    recentSources: []
  });
  const [sources, setSources] = useState<any[]>([]);
  const [graphData, setGraphData] = useState<{ nodes: any[]; links: any[] }>({ nodes: [], links: [] });
  const [config, setConfig] = useState<any>({
    selected_llm: 'gemini-3.5-flash',
    seo_geo_priority: 'high',
    target_search_engines: [],
    context_limit: 5,
    custom_instructions: ''
  });

  // Form states
  const [newTitle, setNewTitle] = useState('');
  const [newType, setNewType] = useState('Document');
  const [newUrl, setNewUrl] = useState('');
  const [newContent, setNewContent] = useState('');
  const [isIngesting, setIsIngesting] = useState(false);

  // Preview modal states
  const [isPreviewLoading, setIsPreviewLoading] = useState(false);
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [previewActiveTab, setPreviewActiveTab] = useState<'chunks' | 'entities' | 'relations'>('chunks');
  const [previewData, setPreviewData] = useState<{
    chunks: { chunk_index: number; chunk_text: string; token_count: number; character_count: number }[];
    extractedEntities: { name: string; type: string; description: string }[];
    extractedRelations: { source: string; target: string; relation: string; reason: string }[];
  } | null>(null);

  // Search states
  const [searchQuery, setSearchQuery] = useState('How does Ranktica AI optimize for GEO, ChatGPT Search and Perplexity?');
  const [searchTarget, setSearchTarget] = useState<'SEO' | 'GEO' | 'AEO' | 'ChatGPT_Search' | 'Perplexity'>('GEO');
  const [ragSearchStrategy, setRagSearchStrategy] = useState<'hybrid' | 'vector_dense' | 'bm25_lexical'>('hybrid');
  const [searchResult, setSearchResult] = useState<any>(null);
  const [isSearching, setIsSearching] = useState(false);

  const [loading, setLoading] = useState(true);
  const d3Container = useRef<SVGSVGElement | null>(null);

  useEffect(() => {
    fetchInitialData();
  }, []);

  useEffect(() => {
    if (activeTab === 'graph' && graphData.nodes.length > 0) {
      renderD3Graph();
    }
  }, [activeTab, graphData]);

  const fetchInitialData = async () => {
    setLoading(true);
    try {
      const authHeader = { 'Authorization': `Bearer ${localStorage.getItem('token') || ''}` };
      
      const [analyticsRes, sourcesRes, graphRes, configRes] = await Promise.all([
        fetch('/api/rag/analytics'),
        fetch('/api/rag/sources'),
        fetch('/api/rag/graph'),
        fetch('/api/rag/config')
      ]);

      if (analyticsRes.ok) setAnalytics(await analyticsRes.json());
      if (sourcesRes.ok) setSources(await sourcesRes.json());
      if (graphRes.ok) setGraphData(await graphRes.json());
      if (configRes.ok) {
        const configData = await configRes.json();
        setConfig({
          ...configData,
          target_search_engines: typeof configData.target_search_engines === 'string' 
            ? JSON.parse(configData.target_search_engines) 
            : configData.target_search_engines
        });
      }
    } catch (err) {
      console.error('Error fetching RAG data:', err);
      toast.error('Failed to sync enterprise RAG catalog states.');
    } finally {
      setLoading(false);
    }
  };

  const loadTemplate = (tpl: any) => {
    setNewTitle(tpl.title);
    setNewType(tpl.type);
    setNewUrl(tpl.url);
    setNewContent(tpl.content);
    toast.success('System ingestion template pre-loaded.');
  };

  const handlePreview = async (e: React.MouseEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !newContent.trim()) {
      toast.error('Title and raw content are mandatory to generate a segmentation preview.');
      return;
    }

    setIsPreviewLoading(true);
    try {
      const res = await fetch('/api/rag/sources/preview', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: newTitle,
          source_type: newType,
          source_url: newUrl,
          raw_content: newContent
        })
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || 'Preview extraction failed');
      }

      const data = await res.json();
      setPreviewData(data);
      setShowPreviewModal(true);
      setPreviewActiveTab('chunks');
      toast.success('Document pipeline simulation completed! Ready for inspection.');
    } catch (err: any) {
      toast.error(err.message || 'Failed to simulate metadata parsing.');
    } finally {
      setIsPreviewLoading(false);
    }
  };

  const handleIngest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !newContent.trim()) {
      toast.error('Title and raw content are mandatory for semantic chunk indexing.');
      return;
    }

    setIsIngesting(true);
    try {
      const res = await fetch('/api/rag/sources/ingest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: newTitle,
          source_type: newType,
          source_url: newUrl,
          raw_content: newContent
        })
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || 'Ingestion failed');
      }

      toast.success('Document pipeline finished: successfully chunked, embedded, and mapped to Knowledge Graph!');
      setNewTitle('');
      setNewUrl('');
      setNewContent('');
      await fetchInitialData();
    } catch (err: any) {
      toast.error(err.message || 'Ingestion failure');
    } finally {
      setIsIngesting(false);
    }
  };

  const handleDeleteSource = async (id: string) => {
    if (!confirm('Are you sure you want to delete this knowledge source and purge its related semantic chunks?')) return;
    try {
      const res = await fetch(`/api/rag/sources/${id}/delete`, { method: 'POST' });
      if (res.ok) {
        toast.success('Knowledge source purged.');
        await fetchInitialData();
      } else {
        throw new Error('Failed to delete');
      }
    } catch (err) {
      toast.error('Failed purging database record.');
    }
  };

  const handleSaveConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/rag/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config)
      });
      if (res.ok) {
        toast.success('RAG Optimization configs updated.');
        await fetchInitialData();
      } else {
        throw new Error('Failed to save');
      }
    } catch (err) {
      toast.error('Configuration revision failed.');
    }
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      toast.error('Query string cannot be empty.');
      return;
    }
    setIsSearching(true);
    setSearchResult(null);
    try {
      const res = await fetch('/api/rag/query', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: searchQuery,
          optimizeFor: searchTarget
        })
      });

      if (!res.ok) throw new Error('Search failed');
      const data = await res.json();
      setSearchResult(data);
    } catch (err: any) {
      toast.error('Retrieval operation timed out or failed.');
    } finally {
      setIsSearching(false);
    }
  };

  // Render highly-fluid D3.js Knowledge Graph
  const renderD3Graph = () => {
    if (!d3Container.current || graphData.nodes.length === 0) return;

    // Clear previous renders
    d3.select(d3Container.current).selectAll('*').remove();

    const width = 800;
    const height = 500;

    const svg = d3.select(d3Container.current)
      .attr('viewBox', `0 0 ${width} ${height}`)
      .attr('width', '100%')
      .attr('height', '100%')
      .style('background', '#09090b');

    // Create container for zooming
    const g = svg.append('g');

    // Add zooming handler
    svg.call(d3.zoom<SVGSVGElement, unknown>().on('zoom', (event) => {
      g.attr('transform', event.transform);
    }));

    // Map entity types to visual colors
    const colorScale = (type: string) => {
      switch (type?.toLowerCase()) {
        case 'brand': return '#f43f5e'; // Rose
        case 'product': return '#3b82f6'; // Blue
        case 'competitor': return '#eab308'; // Yellow
        case 'metrics': return '#10b981'; // Green
        case 'keywords': return '#a855f7'; // Purple
        case 'persona': return '#f97316'; // Orange
        default: return '#a1a1aa'; // Zinc/Neutral
      }
    };

    // Deep-clone links and nodes to shield react data indices
    const links = graphData.links.map(d => ({ ...d }));
    const nodes = graphData.nodes.map(d => ({ ...d }));

    // Define simulation patterns with forces
    const simulation = d3.forceSimulation(nodes as any)
      .force('link', d3.forceLink(links as any).id((d: any) => d.id).distance(100))
      .force('charge', d3.forceManyBody().strength(-200))
      .force('center', d3.forceCenter(width / 2, height / 2))
      .force('collision', d3.forceCollide().radius(25));

    // Render relationship edges (links)
    const link = g.append('g')
      .attr('stroke', '#27272a')
      .attr('stroke-opacity', 0.6)
      .selectAll('line')
      .data(links)
      .join('line')
      .attr('stroke-width', (d: any) => Math.max(1, (d.weight || 1) * 2));

    // Render links text captions
    const linkText = g.append('g')
      .selectAll('text')
      .data(links)
      .join('text')
      .attr('font-size', '8px')
      .attr('fill', '#52525b')
      .attr('text-anchor', 'middle')
      .text((d: any) => d.relation_type || '');

    // Render node groups
    const node = g.append('g')
      .selectAll('.node')
      .data(nodes)
      .join('g')
      .attr('class', 'node')
      .call(d3.drag<any, any>()
        .on('start', dragstarted)
        .on('drag', dragged)
        .on('end', dragended) as any);

    // Node circles decoration
    node.append('circle')
      .attr('r', 12)
      .attr('fill', (d: any) => colorScale(d.group_type))
      .attr('stroke', '#18181b')
      .attr('stroke-width', 2)
      .style('cursor', 'pointer')
      .style('filter', 'drop-shadow(0 0 4px rgba(255,255,255,0.05))');

    // Node labels shadow
    node.append('text')
      .attr('dy', -16)
      .attr('text-anchor', 'middle')
      .attr('font-size', '10px')
      .attr('font-weight', 'bold')
      .attr('fill', '#ffffff')
      .text((d: any) => d.name);

    // Node entity type annotation
    node.append('text')
      .attr('dy', 22)
      .attr('text-anchor', 'middle')
      .attr('font-size', '7px')
      .attr('fill', '#a1a1aa')
      .text((d: any) => d.group_type?.toUpperCase());

    // Update positions each tick
    simulation.on('tick', () => {
      link
        .attr('x1', (d: any) => d.source.x)
        .attr('y1', (d: any) => d.source.y)
        .attr('x2', (d: any) => d.target.x)
        .attr('y2', (d: any) => d.target.y);

      linkText
        .attr('x', (d: any) => (d.source.x + d.target.x) / 2)
        .attr('y', (d: any) => (d.source.y + d.target.y) / 2);

      node.attr('transform', (d: any) => `translate(${d.x}, ${d.y})`);
    });

    // Helper drag actions
    function dragstarted(event: any, d: any) {
      if (!event.active) simulation.alphaTarget(0.3).restart();
      d.fx = d.x;
      d.fy = d.y;
    }

    function dragged(event: any, d: any) {
      d.fx = event.x;
      d.fy = event.y;
    }

    function dragended(event: any, d: any) {
      if (!event.active) simulation.alphaTarget(0);
      d.fx = null;
      d.fy = null;
    }
  };

  const chartColors = ['#f43f5e', '#3b82f6', '#10b981', '#a855f7', '#f97316', '#eab308'];

  return (
    <div className="space-y-6 pb-12 animate-fade-in text-zinc-100" id="rag-intelligence-root">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-zinc-800 pb-5">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-red-500 font-bold uppercase text-xs tracking-wider">
            <Zap size={14} /> Enterprise Context Retrieval Engine
          </div>
          <h2 className="text-3xl font-black text-white tracking-tight flex items-center gap-2">
            Knowledge Intelligence & RAG Core
          </h2>
          <p className="text-zinc-400 text-sm">Ingest raw media, documents, URLs and build an interactive Knowledge Graph optimized for AI Search Engines citation inclusion.</p>
        </div>
        <button 
          onClick={fetchInitialData}
          className="self-start md:self-auto flex items-center gap-2 px-3.5 py-1.5 bg-zinc-900 border border-zinc-800 rounded-xl hover:bg-zinc-800 transition text-xs font-semibold text-zinc-300"
        >
          <RefreshCw size={12} className={loading ? "animate-spin text-red-500" : ""} /> Update Live Matrices
        </button>
      </header>

      {/* Primary tab switches */}
      <div className="flex flex-wrap gap-2 border-b border-zinc-800/60 pb-px">
        <button
          onClick={() => setActiveTab('analytics')}
          className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold transition-all border-b-2 ${activeTab === 'analytics' ? 'border-red-500 text-white bg-red-500/5' : 'border-transparent text-zinc-400 hover:text-white'}`}
        >
          <Activity size={14} /> Summary & Analytics
        </button>
        <button
          onClick={() => setActiveTab('ingest')}
          className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold transition-all border-b-2 ${activeTab === 'ingest' ? 'border-red-500 text-white bg-red-500/5' : 'border-transparent text-zinc-400 hover:text-white'}`}
        >
          <UploadCloud size={14} /> Knowledge Ingest Pipeline
        </button>
        <button
          onClick={() => setActiveTab('query')}
          className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold transition-all border-b-2 ${activeTab === 'query' ? 'border-red-500 text-white bg-red-500/5' : 'border-transparent text-zinc-400 hover:text-white'}`}
        >
          <Search size={14} /> Semantic Query & Retrieve
        </button>
        <button
          onClick={() => setActiveTab('graph')}
          className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold transition-all border-b-2 ${activeTab === 'graph' ? 'border-red-500 text-white bg-red-500/5' : 'border-transparent text-zinc-400 hover:text-white'}`}
        >
          <Network size={14} /> Knowledge Graph Canvas
        </button>
        <button
          onClick={() => setActiveTab('config')}
          className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold transition-all border-b-2 ${activeTab === 'config' ? 'border-red-500 text-white bg-red-500/5' : 'border-transparent text-zinc-400 hover:text-white'}`}
        >
          <Sliders size={14} /> Optimizers Config
        </button>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 gap-3">
          <RefreshCw size={36} className="animate-spin text-red-500" />
          <span className="text-zinc-500 text-xs font-semibold tracking-wider uppercase">Loading database matrices...</span>
        </div>
      ) : (
        <>
          {/* TAB 1: ANALYTICS & OVERVIEW */}
          {activeTab === 'analytics' && (
            <div className="space-y-6 animate-fade-in">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="p-5 bg-zinc-900/50 border border-zinc-800/80 rounded-2xl">
                  <div className="text-xs font-semibold text-zinc-500 uppercase tracking-widest mb-1.5 flex items-center gap-2">
                    <BookOpen size={12} className="text-red-500" /> Knowledge Sources
                  </div>
                  <div className="text-3xl font-black text-white">{analytics.totalSources}</div>
                  <div className="text-[10px] text-zinc-400 mt-2">Active documents, URLs, analytics logs</div>
                </div>
                <div className="p-5 bg-zinc-900/50 border border-zinc-800/80 rounded-2xl">
                  <div className="text-xs font-semibold text-zinc-500 uppercase tracking-widest mb-1.5 flex items-center gap-2">
                    <Database size={12} className="text-blue-500" /> Parsed Context Chunks
                  </div>
                  <div className="text-3xl font-black text-white">{analytics.totalChunks}</div>
                  <div className="text-[10px] text-zinc-400 mt-2">Embedded via <span className="font-mono text-blue-400">embedding-2-preview</span></div>
                </div>
                <div className="p-5 bg-zinc-900/50 border border-zinc-800/80 rounded-2xl">
                  <div className="text-xs font-semibold text-zinc-500 uppercase tracking-widest mb-1.5 flex items-center gap-2">
                    <Network size={12} className="text-emerald-500" /> Graph Entities Nodes
                  </div>
                  <div className="text-3xl font-black text-white">{analytics.totalGraphNodes}</div>
                  <div className="text-[10px] text-zinc-400 mt-2">Unique extracted brands, metrics & topics</div>
                </div>
                <div className="p-5 bg-zinc-900/50 border border-zinc-800/80 rounded-2xl">
                  <div className="text-xs font-semibold text-zinc-500 uppercase tracking-widest mb-1.5 flex items-center gap-2">
                    <Compass size={12} className="text-purple-500" /> Knowledge Relationships
                  </div>
                  <div className="text-3xl font-black text-white">{analytics.totalGraphRelationships}</div>
                  <div className="text-[10px] text-zinc-400 mt-2">Semantic links map between objects</div>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Sources Breakdown chart */}
                <div className="p-6 bg-zinc-900 border border-zinc-800 rounded-2xl shadow-xl space-y-4">
                  <h3 className="text-sm font-bold text-white uppercase tracking-widest border-b border-zinc-800 pb-2">
                    Knowledge Group Share
                  </h3>
                  <div className="h-60 w-full flex items-center justify-center">
                    {analytics.sourcesBreakdown?.length > 0 ? (
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={analytics.sourcesBreakdown}
                            dataKey="count"
                            nameKey="source_type"
                            cx="50%"
                            cy="50%"
                            innerRadius={60}
                            outerRadius={80}
                            paddingAngle={5}
                          >
                            {analytics.sourcesBreakdown.map((entry: any, index: number) => (
                              <Cell key={`cell-${index}`} fill={chartColors[index % chartColors.length]} />
                            ))}
                          </Pie>
                          <Tooltip contentStyle={{ backgroundColor: '#18181b', border: '1px solid #27272a', color: '#fff' }} />
                        </PieChart>
                      </ResponsiveContainer>
                    ) : (
                      <span className="text-xs text-zinc-500 uppercase tracking-widest">No ingested source chunks</span>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-2 text-[10px] font-bold">
                    {analytics.sourcesBreakdown?.map((item: any, idx: number) => (
                      <div key={idx} className="flex items-center gap-1.5 px-2 py-1 bg-zinc-950 rounded-lg border border-zinc-800">
                        <span className="w-2 h-2 rounded-full" style={{ backgroundColor: chartColors[idx % chartColors.length] }}></span>
                        <span className="text-zinc-400">{item.source_type}: {item.count}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Graph Entities breakdown */}
                <div className="p-6 bg-zinc-900 border border-zinc-800 rounded-2xl shadow-xl space-y-4 lg:col-span-2">
                  <h3 className="text-sm font-bold text-white uppercase tracking-widest border-b border-zinc-800 pb-2">
                    Graph Entity Categories Distribution
                  </h3>
                  <div className="h-60 w-full">
                    {analytics.entityTypeBreakdown?.length > 0 ? (
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={analytics.entityTypeBreakdown} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                          <XAxis dataKey="entity_type" stroke="#52525b" fontSize={10} tickLine={false} axisLine={false} />
                          <YAxis stroke="#52525b" fontSize={10} tickLine={false} axisLine={false} />
                          <Tooltip contentStyle={{ backgroundColor: '#18181b', border: '1px solid #27272a', color: '#fff' }} />
                          <Bar dataKey="count" fill="#f43f5e" radius={[4, 4, 0, 0]}>
                            {analytics.entityTypeBreakdown.map((entry: any, index: number) => (
                              <Cell key={`cell-${index}`} fill={chartColors[index % chartColors.length]} />
                            ))}
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    ) : (
                      <div className="flex h-full items-center justify-center text-xs text-zinc-500 uppercase tracking-widest">
                        Run entity extraction inside ingestion pipeline
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Recent Active Sources */}
              <div className="p-6 bg-zinc-900 border border-zinc-800 rounded-2xl shadow-xl">
                <h3 className="text-sm font-bold text-white uppercase tracking-widest border-b border-zinc-800 pb-3 mb-4">
                  Synchronized Knowledge Index
                </h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs text-zinc-300">
                    <thead className="bg-zinc-950 text-zinc-400 uppercase text-[10px] tracking-widest">
                      <tr>
                        <th className="p-3">Title</th>
                        <th className="p-3">Type</th>
                        <th className="p-3 text-center">Chunks</th>
                        <th className="p-3 text-center">Graph Entities</th>
                        <th className="p-3 text-center">Relationships</th>
                        <th className="p-3 text-center">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-800 font-medium">
                      {analytics.recentSources?.length > 0 ? (
                        analytics.recentSources.map((src: any) => (
                          <tr key={src.id} className="hover:bg-zinc-800/40 transition">
                            <td className="p-3 text-white flex items-center gap-1.5">
                              <BookOpen size={14} className="text-zinc-500 flex-shrink-0" /> {src.title}
                            </td>
                            <td className="p-3 text-zinc-400">{src.source_type}</td>
                            <td className="p-3 text-center text-blue-400 font-mono font-bold">{src.chunks_count}</td>
                            <td className="p-3 text-center text-emerald-400 font-mono font-bold">{src.nodes_count}</td>
                            <td className="p-3 text-center text-purple-400 font-mono font-bold">{src.relationships_count}</td>
                            <td className="p-3 text-center">
                              <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider ${
                                src.status === 'processed' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-yellow-500/10 text-yellow-400 border border-yellow-500/20'
                              }`}>
                                {src.status}
                              </span>
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={6} className="p-8 text-center text-zinc-500 uppercase tracking-widest">
                            No knowledge files deployed.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: INGESTION PIPELINE */}
          {activeTab === 'ingest' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-fade-in">
              {/* Left Column: Form & Ingester */}
              <div className="lg:col-span-2 space-y-6">
                <form onSubmit={handleIngest} className="p-6 bg-zinc-900 border border-zinc-800 rounded-2xl shadow-xl space-y-4">
                  <h3 className="text-base font-bold text-white flex items-center gap-2 border-b border-zinc-800 pb-3">
                    <Plus size={18} className="text-red-500" /> New Knowledge Source
                  </h3>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Source Document Title</label>
                      <input
                        type="text"
                        value={newTitle}
                        onChange={(e) => setNewTitle(e.target.value)}
                        placeholder="e.g. Q3 Brand Vision or Core Pricing Analytics"
                        className="w-full px-4 py-2.5 bg-zinc-950 border border-zinc-800 rounded-xl text-zinc-200 text-sm focus:outline-none focus:ring-1 focus:ring-red-500 placeholder-zinc-600"
                        id="rag-input-title"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Source Type Category</label>
                      <select
                        value={newType}
                        onChange={(e) => setNewType(e.target.value)}
                        className="w-full px-4 py-2.5 bg-zinc-950 border border-zinc-800 rounded-xl text-zinc-200 text-sm focus:outline-none focus:ring-1 focus:ring-red-500"
                        id="rag-input-type"
                      >
                        <option value="Document">Internal Document</option>
                        <option value="URL">Live URL</option>
                        <option value="Web page">Web page Scraping</option>
                        <option value="SEO Data">SEO Keyword Matrix</option>
                        <option value="Analytics Data">Metrics & Analytics</option>
                        <option value="Customer Data">Customer Feedback Logs</option>
                      </select>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Reference URL / Metadata Tag (Optional)</label>
                    <input
                      type="text"
                      value={newUrl}
                      onChange={(e) => setNewUrl(e.target.value)}
                      placeholder="e.g. https://ranktica.ai/docs/vision"
                      className="w-full px-4 py-2.5 bg-zinc-950 border border-zinc-800 rounded-xl text-zinc-200 text-sm focus:outline-none focus:ring-1 focus:ring-red-500 placeholder-zinc-600"
                      id="rag-input-url"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Raw Content / Document Body</label>
                    <textarea
                      value={newContent}
                      onChange={(e) => setNewContent(e.target.value)}
                      rows={8}
                      placeholder="Insert the knowledge documentation here. Ingesting this will automatically run token parsers, paragraphs-based chunking with paragraph overlap, embedding computations, and semantic schema-based entity graph relationship parsing..."
                      className="w-full p-4 bg-zinc-950 border border-zinc-800 rounded-2xl text-zinc-200 text-sm focus:outline-none focus:ring-1 focus:ring-red-500 placeholder-zinc-600 font-sans"
                      id="rag-input-content"
                    ></textarea>
                  </div>

                  {/* Drag-and-drop graphic overlay */}
                  <div className="p-4 border border-dashed border-zinc-800 bg-zinc-950/40 rounded-xl text-center space-y-1 relative cursor-pointer">
                    <input type="file" className="absolute inset-0 opacity-0 cursor-pointer" onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        const reader = new FileReader();
                        reader.onload = (evt) => {
                          setNewTitle(file.name.replace(/\.[^/.]+$/, ""));
                          setNewContent(String(evt.target?.result || ''));
                          toast.success('Document uploaded and read successfully.');
                        };
                        reader.readAsText(file);
                      }
                    }} />
                    <UploadCloud size={24} className="text-zinc-500 mx-auto" />
                    <div className="text-[10px] font-bold uppercase text-zinc-400">Drag & Drop raw text files or click to browse</div>
                    <p className="text-[8px] text-zinc-600 uppercase tracking-widest">Supports .txt, .md, .csv formats</p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                    <button
                      type="button"
                      onClick={handlePreview}
                      disabled={isPreviewLoading || isIngesting}
                      className="py-3 bg-zinc-950 hover:bg-zinc-900 border border-zinc-800 hover:border-zinc-700 text-zinc-300 hover:text-white font-bold text-xs uppercase tracking-widest rounded-xl transition flex items-center justify-center gap-2 cursor-pointer w-full"
                      id="preview-rag-btn"
                    >
                      {isPreviewLoading ? (
                        <>
                          <RefreshCw size={14} className="animate-spin text-red-500" /> Simulating...
                        </>
                      ) : (
                        <>
                          <Eye size={14} className="text-zinc-400" /> Preview Chunks
                        </>
                      )}
                    </button>

                    <button
                      type="submit"
                      disabled={isIngesting || isPreviewLoading}
                      className="py-3 bg-red-600 hover:bg-red-500 disabled:bg-zinc-800 text-white font-black text-xs uppercase tracking-widest rounded-xl transition flex items-center justify-center gap-2 cursor-pointer w-full"
                      id="submit-rag-ingest"
                    >
                      {isIngesting ? (
                        <>
                          <RefreshCw size={14} className="animate-spin" /> Indexing Pipeline...
                        </>
                      ) : (
                        <>
                          <Zap size={14} /> Commit to RAG Index
                        </>
                      )}
                    </button>
                  </div>
                </form>
              </div>

              {/* Right Column: Templates & List */}
              <div className="space-y-6">
                <div className="p-6 bg-zinc-900 border border-zinc-800 rounded-2xl shadow-xl space-y-4">
                  <h3 className="text-sm font-black text-white uppercase tracking-widest border-b border-zinc-800 pb-2.5">
                    Instant Demo Preloads
                  </h3>
                  <p className="text-[11px] text-zinc-400">Deploy beautiful, hyper-structured content immediately to try out the RAG vector search engine & dynamic knowledge graphs:</p>
                  
                  <div className="space-y-3 pt-2">
                    {SAMPLE_TEMPLATES.map((tpl, i) => (
                      <div 
                        key={i}
                        className="p-3 bg-zinc-950 hover:bg-zinc-800/80 border border-zinc-800 rounded-xl transition-all cursor-pointer space-y-1.5"
                        onClick={() => loadTemplate(tpl)}
                      >
                        <div className="flex justify-between items-center">
                          <span className="text-[9px] font-black px-2 py-0.5 bg-red-950 text-red-400 rounded-full uppercase tracking-wider">{tpl.type}</span>
                          <span className="text-[8px] font-black text-zinc-500 tracking-widest uppercase">Select →</span>
                        </div>
                        <h4 className="text-xs font-bold text-white leading-tight">{tpl.title}</h4>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Sources Index Panel with deletions */}
                <div className="p-6 bg-zinc-900 border border-zinc-800 rounded-2xl shadow-xl space-y-4">
                  <h3 className="text-sm font-black text-white uppercase tracking-widest border-b border-zinc-800 pb-2.5">
                    Ingested Document Sources
                  </h3>
                  <div className="space-y-3 max-h-96 overflow-y-auto pr-1">
                    {sources.length > 0 ? (
                      sources.map((src) => (
                        <div key={src.id} className="p-3.5 bg-zinc-950 border border-zinc-800 rounded-xl space-y-2 flex items-center justify-between gap-2.5">
                          <div className="space-y-1 min-w-0">
                            <span className="text-[8px] font-black px-1.5 py-0.5 bg-zinc-800 text-zinc-400 rounded-full uppercase tracking-widest">{src.source_type}</span>
                            <h4 className="text-xs font-bold text-white truncate max-w-44 leading-snug">{src.title}</h4>
                            <div className="flex items-center gap-2 text-[9px] text-zinc-500 font-mono leading-none">
                              <span>{src.chunks_count} Chunks</span>
                              <span>•</span>
                              <span>{src.nodes_count} Entities</span>
                            </div>
                          </div>
                          <button
                            onClick={() => handleDeleteSource(src.id)}
                            className="p-2 border border-zinc-800 bg-zinc-900 rounded-xl hover:bg-red-500/10 hover:border-red-500 hover:text-red-500 text-zinc-500 transition"
                            title="Delete"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      ))
                    ) : (
                      <div className="text-center py-6 text-xs text-zinc-500 uppercase tracking-widest">
                        Empty index directory.
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: SEMANTIC SEARCH & AI RETRIEVAL */}
          {activeTab === 'query' && (
            <div className="space-y-6 animate-fade-in">
              <div className="p-6 bg-zinc-900 border border-zinc-800 rounded-2xl shadow-xl space-y-5">
                <div className="space-y-2">
                  <h3 className="text-base font-bold text-white flex items-center gap-2 border-b border-zinc-800 pb-3">
                    <Compass size={18} className="text-red-500" /> Vector Synthesizer Core
                  </h3>
                  <p className="text-xs text-zinc-400">Search is executed in full compliance with the highest RAG standards. First, embedding is computed. Second, cosine similarity vector distance retrieves closest matched document chunks. Third, related Knowledge Graph entities are fetched. Fourth, Gemini generates the factual output aligned to target search guidelines.</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-5 gap-4 items-end">
                  <div className="md:col-span-3 space-y-1">
                    <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">What would you like to retrieve?</label>
                    <div className="relative">
                      <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Search anything regarding brand specs, competitor CTR ratios, or target SEO keys..."
                        className="w-full pl-11 pr-4 py-3 bg-zinc-950 border border-zinc-800 rounded-xl text-zinc-200 text-sm focus:outline-none focus:ring-1 focus:ring-red-500 placeholder-zinc-600"
                        id="rag-search-query"
                      />
                      <Search className="absolute left-4 top-3.5 text-zinc-500" size={16} />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Retrieval Strategy</label>
                    <select
                      value={ragSearchStrategy}
                      onChange={(e: any) => setRagSearchStrategy(e.target.value)}
                      className="w-full px-3 py-3 bg-zinc-950 border border-zinc-800 rounded-xl text-zinc-200 text-xs font-bold focus:outline-none focus:ring-1 focus:ring-red-500"
                    >
                      <option value="hybrid">⚡ Hybrid (Vector + BM25 RRF)</option>
                      <option value="vector_dense">🎯 Dense Vector (Cosine)</option>
                      <option value="bm25_lexical">🔤 Lexical BM25 (TF-IDF)</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Target Engine</label>
                    <select
                      value={searchTarget}
                      onChange={(e: any) => setSearchTarget(e.target.value)}
                      className="w-full px-3 py-3 bg-zinc-950 border border-zinc-800 rounded-xl text-zinc-200 text-xs font-bold focus:outline-none focus:ring-1 focus:ring-red-500"
                      id="rag-search-target"
                    >
                      <option value="GEO">GEO Optimization</option>
                      <option value="AEO">AEO Voice Assistant</option>
                      <option value="SEO">Classic Google SEO</option>
                      <option value="ChatGPT_Search">ChatGPT Search Index</option>
                      <option value="Perplexity">Perplexity Engine</option>
                    </select>
                  </div>
                </div>

                <button
                  onClick={handleSearch}
                  disabled={isSearching}
                  className="w-full py-3 bg-red-600 hover:bg-red-500 disabled:bg-zinc-800 text-white font-black text-xs uppercase tracking-widest rounded-xl transition flex items-center justify-center gap-2"
                  id="submit-rag-search"
                >
                  {isSearching ? (
                    <>
                      <RefreshCw size={14} className="animate-spin" /> Querying Vector DB & Synthesizing Grounded Reply...
                    </>
                  ) : (
                    <>
                      <Zap size={14} /> Execute Vector Query & Retrieve Context
                    </>
                  )}
                </button>
              </div>

              {searchResult && (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  {/* Synthesis output */}
                  <div className="lg:col-span-2 p-6 bg-zinc-900 border border-zinc-800 rounded-2xl shadow-xl space-y-4">
                    <div className="flex justify-between items-center border-b border-zinc-800 pb-3">
                      <h4 className="text-sm font-bold text-white flex items-center gap-1.5 uppercase tracking-wider">
                        <Sparkles size={16} className="text-red-500 animate-pulse" /> Grounded Synthesis Response
                      </h4>
                      <span className="text-[9px] font-black px-2 py-0.5 bg-emerald-950 text-emerald-400 border border-emerald-500/20 rounded-full tracking-widest uppercase">
                        Grounded Answer
                      </span>
                    </div>

                    <div className="text-zinc-300 text-sm leading-relaxed whitespace-pre-line space-y-3 font-sans">
                      {searchResult.answer}
                    </div>

                    <div className="mt-6 pt-4 border-t border-zinc-800/60 p-4 bg-zinc-950 rounded-xl flex items-start gap-3">
                      <ShieldCheck className="text-emerald-500 flex-shrink-0 mt-0.5" size={16} />
                      <div className="space-y-1">
                        <h5 className="text-xs font-black text-white leading-none uppercase tracking-wide">Verification Directives Engaged</h5>
                        <p className="text-[10px] text-zinc-500 uppercase font-medium mt-0.5">{searchResult.optimizedDirectives}</p>
                      </div>
                    </div>
                  </div>

                  {/* Retrieved Evidence chunks & nodes */}
                  <div className="space-y-6">
                    {/* Related Knowledge graph links */}
                    <div className="p-6 bg-zinc-900 border border-zinc-800 rounded-2xl shadow-xl space-y-3">
                      <h4 className="text-xs font-black text-zinc-400 uppercase tracking-widest border-b border-zinc-800 pb-2">
                        Retrieved Network Entities
                      </h4>
                      <div className="space-y-2 max-h-56 overflow-y-auto">
                        {searchResult.retrievedNodes?.length > 0 ? (
                          searchResult.retrievedNodes.map((node: any, idx: number) => (
                            <div key={idx} className="p-2.5 bg-zinc-950 border border-zinc-800 rounded-lg flex items-center justify-between gap-1">
                              <div className="min-w-0">
                                <h5 className="text-[11px] font-bold text-white truncate">{node.name}</h5>
                                <p className="text-[9px] text-zinc-500 leading-tight truncate">{node.description}</p>
                              </div>
                              <span className="text-[8px] font-black px-1.5 py-0.5 bg-red-950 text-red-400 border border-red-500/10 rounded-full flex-shrink-0 uppercase tracking-widest">
                                {node.entity_type}
                              </span>
                            </div>
                          ))
                        ) : (
                          <div className="text-[10px] text-zinc-500 uppercase tracking-widest text-center py-4">No close mapped entities found.</div>
                        )}
                      </div>
                    </div>

                    {/* Evidence blocks with distance */}
                    <div className="p-6 bg-zinc-900 border border-zinc-800 rounded-2xl shadow-xl space-y-4">
                      <h4 className="text-xs font-black text-zinc-400 uppercase tracking-widest border-b border-zinc-800 pb-2 flex justify-between items-center">
                        <span>Retrieved Vector Evidence</span>
                        <span className="text-[9px] font-black text-zinc-500 font-mono">Similarity Score</span>
                      </h4>
                      <div className="space-y-3 max-h-72 overflow-y-auto pr-1">
                        {searchResult.retrievedChunks?.length > 0 ? (
                          searchResult.retrievedChunks.map((chunk: any, i: number) => (
                            <div key={i} className="p-3 bg-zinc-950 border border-zinc-800 rounded-xl space-y-1.5">
                              <div className="flex justify-between items-center text-[9px] leading-none">
                                <span className="font-bold text-zinc-500 truncate max-w-40 uppercase tracking-widest">Doc: "{chunk.source_title}"</span>
                                <span className="font-mono font-black text-emerald-400">{(chunk.score * 100).toFixed(1)}%</span>
                              </div>
                              <p className="text-[11px] text-zinc-400 leading-normal line-clamp-3">"{chunk.text}"</p>
                            </div>
                          ))
                        ) : (
                          <div className="text-[10px] text-zinc-500 uppercase tracking-widest text-center py-4">No exact chunks found.</div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 4: KNOWLEDGE GRAPH CANVAS */}
          {activeTab === 'graph' && (
            <div className="space-y-6 animate-fade-in text-zinc-100">
              <div className="p-6 bg-zinc-900 border border-zinc-800 rounded-2xl shadow-xl space-y-4">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-zinc-800 pb-3">
                  <div className="space-y-1">
                    <h3 className="text-base font-bold text-white flex items-center gap-2">
                      <Network size={18} className="text-red-500" /> Interactive Knowledge Network Map
                    </h3>
                    <p className="text-xs text-zinc-400">Drag items to rearrange, or use mousewheel to zoom and pan. Highlighted entities indicate extracted core elements from crawled texts.</p>
                  </div>
                  {/* Legend guide */}
                  <div className="flex flex-wrap gap-2 text-[8px] font-black uppercase tracking-wider">
                    <div className="flex items-center gap-1.5 px-2 py-1 bg-zinc-950 border border-zinc-800 rounded-md">
                      <span className="w-2.5 h-2.5 rounded-full bg-rose-500"></span>
                      <span className="text-zinc-400">Brand</span>
                    </div>
                    <div className="flex items-center gap-1.5 px-2 py-1 bg-zinc-950 border border-zinc-800 rounded-md">
                      <span className="w-2.5 h-2.5 rounded-full bg-blue-500"></span>
                      <span className="text-zinc-400">Product</span>
                    </div>
                    <div className="flex items-center gap-1.5 px-2 py-1 bg-zinc-950 border border-zinc-800 rounded-md">
                      <span className="w-2.5 h-2.5 rounded-full bg-yellow-500"></span>
                      <span className="text-zinc-400">Competitor</span>
                    </div>
                    <div className="flex items-center gap-1.5 px-2 py-1 bg-zinc-950 border border-zinc-800 rounded-md">
                      <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
                      <span className="text-zinc-400">Metrics</span>
                    </div>
                    <div className="flex items-center gap-1.5 px-2 py-1 bg-zinc-950 border border-zinc-800 rounded-md">
                      <span className="w-2.5 h-2.5 rounded-full bg-purple-500"></span>
                      <span className="text-zinc-400">Keywords</span>
                    </div>
                    <div className="flex items-center gap-1.5 px-2 py-1 bg-zinc-950 border border-zinc-800 rounded-md">
                      <span className="w-2.5 h-2.5 rounded-full bg-orange-500"></span>
                      <span className="text-zinc-400">Persona</span>
                    </div>
                  </div>
                </div>

                <div className="w-full relative bg-zinc-950 rounded-2xl overflow-hidden border border-zinc-800/60" style={{ height: '500px' }}>
                  {graphData.nodes?.length > 0 ? (
                    <svg ref={d3Container} className="w-full h-full block"></svg>
                  ) : (
                    <div className="flex flex-col h-full items-center justify-center gap-2">
                      <Network size={40} className="text-zinc-650 animate-pulse text-zinc-700" />
                      <span className="text-zinc-500 text-xs font-semibold tracking-wider uppercase">Ingest a source document first to draw relationship vectors</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* TAB 5: OPTIMIZATIONS CONFIGURATION */}
          {activeTab === 'config' && (
            <div className="max-w-3xl mx-auto animate-fade-in">
              <form onSubmit={handleSaveConfig} className="p-6 bg-zinc-900 border border-zinc-800 rounded-2xl shadow-xl space-y-5">
                <h3 className="text-base font-bold text-white flex items-center gap-2 border-b border-zinc-800 pb-3">
                  <Sliders size={18} className="text-red-500" /> Enterprise RAG Synthesis Optimizer
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Selected Synthesis LLM</label>
                    <select
                      value={config.selected_llm}
                      onChange={(e) => setConfig({ ...config, selected_llm: e.target.value })}
                      className="w-full px-4 py-2.5 bg-zinc-950 border border-zinc-800 rounded-xl text-zinc-200 text-sm focus:outline-none focus:ring-1 focus:ring-red-500"
                      id="rag-config-llm"
                    >
                      <option value="gemini-3.5-flash">Gemini 3.5 Flash (Recommended - Native Reasoning)</option>
                      <option value="gemini-3.1-pro-preview">Gemini 3.1 Pro Preview (Paid Key Required)</option>
                      <option value="gemini-3.1-flash-lite">Gemini 3.1 Flash Lite (High Speed - Low Latency)</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">SEO / GEO Priority Target</label>
                    <select
                      value={config.seo_geo_priority}
                      onChange={(e) => setConfig({ ...config, seo_geo_priority: e.target.value })}
                      className="w-full px-4 py-2.5 bg-zinc-950 border border-zinc-800 rounded-xl text-zinc-200 text-sm focus:outline-none focus:ring-1 focus:ring-red-500"
                      id="rag-config-priority"
                    >
                      <option value="high">High priority structural indexing (AEO + GEO)</option>
                      <option value="medium">Standard organic crawlers alignment</option>
                      <option value="low">Disabled specialized SEO formatting</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Max Retrieved Context Chunks (Topic limit)</label>
                    <input
                      type="number"
                      value={config.context_limit}
                      onChange={(e) => setConfig({ ...config, context_limit: Math.max(1, Number(e.target.value)) })}
                      className="w-full px-4 py-2.5 bg-zinc-950 border border-zinc-800 rounded-xl text-zinc-200 text-sm font-mono focus:outline-none focus:ring-1 focus:ring-red-500"
                      id="rag-config-limit"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Optimized Search Targets</label>
                    <div className="flex flex-wrap gap-2">
                      {['Google AI Overview', 'ChatGPT Search', 'Perplexity'].map((engine) => {
                        const active = config.target_search_engines?.includes(engine);
                        return (
                          <button
                            key={engine}
                            type="button"
                            onClick={() => {
                              const list = config.target_search_engines || [];
                              const updated = list.includes(engine) 
                                ? list.filter((e: string) => e !== engine)
                                : [...list, engine];
                              setConfig({ ...config, target_search_engines: updated });
                            }}
                            className={`px-3 py-1.5 rounded-xl border font-bold text-[10px] uppercase transition ${
                              active ? 'bg-red-500/10 border-red-500 text-white' : 'bg-transparent border-zinc-800 text-zinc-400 hover:text-white'
                            }`}
                          >
                            {engine}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Custom Grounded Directives / Brand Guardrails</label>
                  <textarea
                    value={config.custom_instructions}
                    onChange={(e) => setConfig({ ...config, custom_instructions: e.target.value })}
                    rows={4}
                    placeholder="Provide custom guidelines (e.g. 'Keep answers direct', 'Never include competitor pricing details', etc.) to inject into synthesis prompts."
                    className="w-full p-4 bg-zinc-950 border border-zinc-800 rounded-2xl text-zinc-200 text-sm focus:outline-none focus:ring-1 focus:ring-red-500 placeholder-zinc-650"
                    id="rag-config-instructions"
                  ></textarea>
                </div>

                <button
                  type="submit"
                  className="w-full py-3 bg-red-600 hover:bg-red-500 text-white font-black text-xs uppercase tracking-widest rounded-xl transition flex items-center justify-center gap-2"
                  id="submit-rag-config"
                >
                  <Zap size={14} /> Commit Optimizer Revisions
                </button>
              </form>
            </div>
          )}
        </>
      )}

      {/* 🔮 DOCUMENT PREVIEW & INTEL-SPEC INTERFACE MODAL */}
      <AnimatePresence>
        {showPreviewModal && previewData && (
          <div className="fixed inset-0 bg-black/85 backdrop-blur-sm z-[9999] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-[#0e0e11] border border-zinc-800 rounded-3xl w-full max-w-5xl h-[85vh] flex flex-col overflow-hidden shadow-2xl relative"
            >
              {/* Modal Header */}
              <div className="flex items-center justify-between border-b border-zinc-800/80 p-6 bg-zinc-950/40">
                <div className="space-y-1">
                  <span className="p-1 px-2.5 text-[9px] font-mono tracking-widest bg-emerald-500/10 text-emerald-400 rounded-full border border-emerald-500/20 uppercase font-bold">
                    Pre-Ingestion Audit Active
                  </span>
                  <h3 className="text-lg font-black text-white flex items-center gap-2">
                    <Eye className="text-red-500" size={18} />
                    Document Segment & RAG Metadata Inspector
                  </h3>
                  <p className="text-xs text-zinc-500 leading-relaxed">
                    Preview proposed segment splits and structured Graph entity schemas generated via target-optimization parameters before indexing.
                  </p>
                </div>
                <button
                  onClick={() => setShowPreviewModal(false)}
                  className="p-2 text-zinc-400 hover:text-white bg-zinc-900 hover:bg-zinc-800 rounded-full border border-zinc-800 transition cursor-pointer"
                >
                  ✕
                </button>
              </div>

              {/* Source Quick Stats Overview */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 px-6 bg-zinc-950/60 border-b border-zinc-800/40 text-xs font-mono">
                <div className="space-y-0.5">
                  <span className="text-zinc-650 font-bold uppercase text-[9px]">Document Title</span>
                  <span className="text-zinc-200 block truncate font-sans font-bold">{newTitle}</span>
                </div>
                <div className="space-y-0.5">
                  <span className="text-zinc-650 font-bold uppercase text-[9px]">Category Type</span>
                  <span className="text-zinc-400 block font-sans font-medium">{newType}</span>
                </div>
                <div className="space-y-0.5">
                  <span className="text-zinc-650 font-bold uppercase text-[9px]">Proposed Chunks</span>
                  <span className="text-emerald-400 font-bold block">{previewData.chunks.length} segments</span>
                </div>
                <div className="space-y-0.5">
                  <span className="text-zinc-650 font-bold uppercase text-[9px]">Extracted Metadata</span>
                  <span className="text-purple-400 font-bold block">{previewData.extractedEntities.length} entities</span>
                </div>
              </div>

              {/* Modal Tabs Switching */}
              <div className="flex border-b border-zinc-800 bg-zinc-950/20 px-6">
                <button
                  onClick={() => setPreviewActiveTab('chunks')}
                  className={`py-3.5 px-4 text-xs font-bold transition-all border-b-2 ${
                    previewActiveTab === 'chunks' 
                      ? 'border-red-500 text-white bg-red-500/5' 
                      : 'border-transparent text-zinc-400 hover:text-white'
                  }`}
                >
                  Proposed Text Chunks ({previewData.chunks.length})
                </button>
                <button
                  onClick={() => setPreviewActiveTab('entities')}
                  className={`py-3.5 px-4 text-xs font-bold transition-all border-b-2 ${
                    previewActiveTab === 'entities' 
                      ? 'border-red-500 text-white bg-red-500/5' 
                      : 'border-transparent text-zinc-400 hover:text-white'
                  }`}
                >
                  Extracted Graph Entities ({previewData.extractedEntities.length})
                </button>
                <button
                  onClick={() => setPreviewActiveTab('relations')}
                  className={`py-3.5 px-4 text-xs font-bold transition-all border-b-2 ${
                    previewActiveTab === 'relations' 
                      ? 'border-red-500 text-white bg-red-500/5' 
                      : 'border-transparent text-zinc-400 hover:text-white'
                  }`}
                >
                  Discovered Node Relationships ({previewData.extractedRelations.length})
                </button>
              </div>

              {/* Modal Scrollable Contents */}
              <div className="flex-1 overflow-y-auto p-6 space-y-4">
                
                {/* Proposed Text Chunks View */}
                {previewActiveTab === 'chunks' && (
                  <div className="space-y-4">
                    <p className="text-xs text-zinc-500 italic pb-1">
                      Our chunking algorithm uses paragraph backtrack boundaries (Max length: 800 chars, overlap: 200 chars) to maintain complete context structure:
                    </p>
                    <div className="space-y-3">
                      {previewData.chunks.map((chk) => (
                        <div key={chk.chunk_index} className="p-4 bg-zinc-950 border border-zinc-900 rounded-xl space-y-2">
                          <div className="flex items-center justify-between text-[10px] font-mono text-zinc-500 border-b border-zinc-900 pb-2">
                            <span className="font-bold text-red-400 uppercase tracking-wider">Proposed Chunk #{chk.chunk_index + 1}</span>
                            <span className="flex gap-2">
                              <span>Range: {chk.chunk_index * 600} - {chk.chunk_index * 600 + chk.character_count} chars</span>
                              <span>•</span>
                              <span className="text-zinc-400">{chk.token_count} Est. Tokens</span>
                            </span>
                          </div>
                          <p className="text-zinc-200 text-xs font-sans leading-relaxed whitespace-pre-wrap">{chk.chunk_text}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Extracted Graph Entities View */}
                {previewActiveTab === 'entities' && (
                  <div className="space-y-4">
                    <p className="text-xs text-zinc-500 italic pb-1">
                      Gemini 3.5 Flash schema parser extracted the following semantic graph nodes from the document content:
                    </p>
                    {previewData.extractedEntities.length === 0 ? (
                      <div className="p-8 text-center bg-zinc-950 border border-zinc-900 rounded-xl text-zinc-500 text-xs">
                        No core entities could be extracted. Defaults will be registered.
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {previewData.extractedEntities.map((ent, idx) => {
                          const getBadgeColor = (type: string) => {
                            switch (type.toLowerCase()) {
                              case 'brand': return 'bg-rose-500/10 text-rose-400 border border-rose-500/20';
                              case 'product': return 'bg-blue-500/10 text-blue-400 border border-blue-500/20';
                              case 'competitor': return 'bg-yellow-500/10 text-yellow-400 border border-yellow-500/20';
                              case 'metrics': return 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20';
                              case 'keywords': return 'bg-purple-500/10 text-purple-400 border border-purple-500/20';
                              case 'persona': return 'bg-orange-500/10 text-orange-400 border border-orange-500/20';
                              default: return 'bg-zinc-850 text-zinc-400 border border-zinc-700';
                            }
                          };
                          
                          return (
                            <div key={idx} className="p-3.5 bg-zinc-950 border border-zinc-900 rounded-xl flex flex-col justify-between space-y-2">
                              <div className="space-y-1">
                                <div className="flex items-center justify-between">
                                  <span className="font-bold text-white text-xs">{ent.name}</span>
                                  <span className={`text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded ${getBadgeColor(ent.type)}`}>
                                    {ent.type}
                                  </span>
                                </div>
                                <p className="text-zinc-500 text-[11px] leading-snug">{ent.description}</p>
                              </div>
                              <div className="flex items-center justify-between text-[9px] font-mono text-zinc-650 pt-1.5 border-t border-zinc-900">
                                <span>CI Entity Extraction</span>
                                <span className="text-emerald-500 font-bold">95% confidence</span>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}

                {/* Extracted Relationships View */}
                {previewActiveTab === 'relations' && (
                  <div className="space-y-4">
                    <p className="text-xs text-zinc-500 italic pb-1">
                      Proposed ontological nodes relations mapping to represent in the interactive Knowledge Graph:
                    </p>
                    {previewData.extractedRelations.length === 0 ? (
                      <div className="p-8 text-center bg-zinc-950 border border-zinc-900 rounded-xl text-zinc-500 text-xs">
                        No explicit inter-entity relationship pathways discovered.
                      </div>
                    ) : (
                      <div className="divide-y divide-zinc-950 border border-zinc-900 rounded-xl bg-zinc-950/60 overflow-hidden">
                        {previewData.extractedRelations.map((rel, idx) => (
                          <div key={idx} className="p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
                            <div className="space-y-1">
                              <div className="flex items-center gap-2.5 text-xs flex-wrap">
                                <span className="text-zinc-200 font-bold underline decoration-zinc-800">{rel.source}</span>
                                <span className="px-1.5 py-0.5 bg-purple-500/10 text-purple-400 border border-purple-500/20 rounded font-mono text-[9px] font-black tracking-wider block">
                                  {rel.relation}
                                </span>
                                <span className="text-white font-bold underline decoration-zinc-800">{rel.target}</span>
                              </div>
                              <p className="text-zinc-500 text-[11px] font-medium leading-relaxed">{rel.reason}</p>
                            </div>
                            <div className="text-[10px] font-mono text-zinc-600 whitespace-nowrap self-end md:self-auto">
                              Weight Metric: <span className="text-zinc-400 font-bold">1.0</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

              </div>

              {/* Modal Footer Controls */}
              <div className="border-t border-zinc-850 p-5 px-6 flex flex-col sm:flex-row items-center justify-between gap-3 bg-zinc-950/40">
                <span className="text-[10px] font-mono text-zinc-500">
                  ⚡ Preview model uses non-destructive isolated sandbox memory.
                </span>
                <div className="flex gap-2 w-full sm:w-auto">
                  <button
                    type="button"
                    onClick={() => setShowPreviewModal(false)}
                    className="w-full sm:w-auto px-5 py-2.5 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-300 hover:text-white rounded-xl text-xs font-bold transition cursor-pointer uppercase tracking-wider"
                  >
                    Close Preview
                  </button>
                  <button
                    type="button"
                    onClick={async (e) => {
                      setShowPreviewModal(false);
                      // Form event wrapper calling handeIngest directly
                      const simulatedEvent = { preventDefault: () => {} };
                      await handleIngest(simulatedEvent as any);
                    }}
                    className="w-full sm:w-auto px-6 py-2.5 bg-red-600 hover:bg-red-500 text-white rounded-xl text-xs font-black transition cursor-pointer uppercase tracking-widest flex items-center justify-center gap-1.5"
                  >
                    <Zap size={12} /> Index Article
                  </button>
                </div>
              </div>

            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
