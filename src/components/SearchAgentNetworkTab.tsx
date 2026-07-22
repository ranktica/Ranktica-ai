import React, { useState, useEffect } from 'react';
import { useProject } from '@/app/ProjectContext';
import { toast } from 'react-hot-toast';
import { 
  Zap, 
  Loader2, 
  Play, 
  Copy, 
  Search, 
  ArrowRight, 
  CheckCircle2, 
  AlertCircle,
  FileText,
  Activity,
  Award,
  BookOpen
} from 'lucide-react';

export const SearchAgentNetworkTab: React.FC = () => {
  const { activeProject } = useProject();

  // Network States
  const [searchAgents, setSearchAgents] = useState<any[]>([]);
  const [searchAgentRuns, setSearchAgentRuns] = useState<any[]>([]);
  const [isLoadingSearchAgents, setIsLoadingSearchAgents] = useState(false);
  const [isLoadingSearchRuns, setIsLoadingSearchRuns] = useState(false);
  const [isSubmittingSearchRun, setIsSubmittingSearchRun] = useState(false);

  // Input states
  const [searchUrlInput, setSearchUrlInput] = useState('https://joinranktica.com');
  const [searchNicheInput, setSearchNicheInput] = useState('Enterprise Growth Automation');
  const [searchAudienceInput, setSearchAudienceInput] = useState('SaaS Founders & Marketing CMOs');

  // Selected item states
  const [selectedSearchRun, setSelectedSearchRun] = useState<any>(null);
  const [selectedSearchAgent, setSelectedSearchAgent] = useState<any>(null);
  const [activeReportPhase, setActiveReportPhase] = useState<string>('Website Analysis');

  // Sync with active project details if available
  useEffect(() => {
    if (activeProject) {
      if (activeProject.title) {
        setSearchUrlInput(`https://${activeProject.title.toLowerCase().replace(/[^a-z0-9]/g, '')}.com`);
      }
      setSearchNicheInput(activeProject.niche || 'Growth Optimization');
      setSearchAudienceInput(activeProject.audience || 'Target Organic Search Audience');
    }
  }, [activeProject]);

  // Sync Search Agents and Workflow runs
  const fetchSearchAgents = async () => {
    setIsLoadingSearchAgents(true);
    try {
      const res = await fetch('/api/db/search-agents');
      if (res.ok) {
        const data = await res.json();
        const arrayData = Array.isArray(data) ? data : [];
        setSearchAgents(arrayData);
        if (arrayData.length > 0 && !selectedSearchAgent) {
          setSelectedSearchAgent(arrayData[0]);
        }
      }
    } catch (err) {
      console.error('Error fetching search agents:', err);
    } finally {
      setIsLoadingSearchAgents(false);
    }
  };

  const fetchSearchRuns = async (isPoll = false) => {
    if (!isPoll) setIsLoadingSearchRuns(true);
    try {
      const res = await fetch('/api/db/search-agent-runs');
      if (res.ok) {
        const data = await res.json();
        const arrayData = Array.isArray(data) ? data : [];
        setSearchAgentRuns(arrayData);
        
        // Keep selected run content completely synchronized
        if (selectedSearchRun) {
          const updatedSelected = arrayData.find((r: any) => r.id === selectedSearchRun.id);
          if (updatedSelected) {
            setSelectedSearchRun(updatedSelected);
          }
        } else if (arrayData.length > 0 && !isPoll) {
          setSelectedSearchRun(arrayData[0]);
        }
      }
    } catch (err) {
      console.error('Error fetching search agent runs:', err);
    } finally {
      if (!isPoll) setIsLoadingSearchRuns(false);
    }
  };

  // Launch initial fetches
  useEffect(() => {
    fetchSearchAgents();
    fetchSearchRuns();
  }, []);

  // Poll running campaigns if any is In Progress
  useEffect(() => {
    const hasActiveRuns = searchAgentRuns.some((r: any) => r.status === 'In Progress');
    if (!hasActiveRuns) return;

    const interval = setInterval(() => {
      fetchSearchRuns(true);
    }, 4000);

    return () => clearInterval(interval);
  }, [searchAgentRuns, selectedSearchRun]);

  const handleDeploySearchNetwork = async () => {
    if (!searchUrlInput || !searchNicheInput) {
      toast.error('URL and Niche are required parameters.');
      return;
    }

    setIsSubmittingSearchRun(true);
    try {
      const res = await fetch('/api/db/search-agent-runs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          url: searchUrlInput,
          niche: searchNicheInput,
          audience: searchAudienceInput
        })
      });

      if (res.ok) {
        const data = await res.json();
        toast.success(`Autonomous Search Network deployed successfully (ID: ${data.runId})`);
        
        // Fetch to display the brand-new run instantly
        await fetchSearchRuns();
      } else {
        const errData = await res.json();
        toast.error(errData.error || 'Failed to deploy Search Network.');
      }
    } catch (err) {
      toast.error('Network execution loop failed to trigger.');
    } finally {
      setIsSubmittingSearchRun(false);
    }
  };

  const handleCopy = (text: string, label: string) => {
    try {
      navigator.clipboard.writeText(text);
      toast.success(`${label} copied to clipboard!`);
    } catch (err) {
      toast.error('Failed to copy text.');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header section */}
      <div className="bg-[#0b0b0e] border border-zinc-850 p-6 rounded-2xl relative overflow-hidden flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="absolute top-0 right-0 w-64 h-64 bg-red-600/5 rounded-full filter blur-3xl pointer-events-none" />
        <div className="space-y-1 relative z-10">
          <div className="flex items-center gap-2">
            <span className="text-[10px] bg-red-950/40 border border-red-900/60 text-red-500 font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">Autonomous AI Pipeline</span>
            <span className="text-[10px] bg-zinc-900 text-zinc-400 font-bold px-2 py-0.5 rounded-full">v5.0 Enterprise</span>
          </div>
          <h2 className="text-xl font-black text-white uppercase tracking-tight">Ranktica AI Autonomous Search Agent Network</h2>
          <p className="text-xs text-zinc-400 max-w-2xl leading-relaxed">
            Deploy 9 specialized autonomous search engine agents in a cohesive 7-stage optimization pipeline to hijack organic retrieval clusters and Generative Search models (GEO + AEO).
          </p>
        </div>
        <div className="flex gap-3 relative z-10">
          <button
            onClick={() => { fetchSearchAgents(); fetchSearchRuns(); }}
            className="px-4 py-2 bg-zinc-900 hover:bg-zinc-850 border border-zinc-800 text-zinc-300 font-bold text-xs rounded-xl transition-all"
          >
            Sync State
          </button>
        </div>
      </div>

      {/* Layout split */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left side: Setup & Runs */}
        <div className="lg:col-span-4 space-y-6">
          {/* Form */}
          <div className="bg-[#0b0b0e] border border-zinc-850 p-5 rounded-2xl space-y-4">
            <h3 className="text-xs font-black uppercase text-zinc-300 flex items-center gap-2 pb-2 border-b border-zinc-900">
              <Zap size={14} className="text-red-500 animate-pulse" />
              Deploy Search Network Scan
            </h3>
            <div className="space-y-3">
              <div>
                <label className="block text-[10px] font-bold text-zinc-500 uppercase mb-1">Target Website URL</label>
                <input
                  type="text"
                  value={searchUrlInput}
                  onChange={(e) => setSearchUrlInput(e.target.value)}
                  placeholder="https://joinranktica.com"
                  className="w-full bg-zinc-950 border border-zinc-850 rounded-xl p-3 text-xs text-zinc-200 focus:outline-none focus:border-red-500 transition-all font-mono"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-zinc-500 uppercase mb-1">Semantic Niche focus</label>
                <input
                  type="text"
                  value={searchNicheInput}
                  onChange={(e) => setSearchNicheInput(e.target.value)}
                  placeholder="Enterprise SaaS Growth"
                  className="w-full bg-zinc-950 border border-zinc-850 rounded-xl p-3 text-xs text-zinc-200 focus:outline-none focus:border-red-500 transition-all"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-zinc-500 uppercase mb-1">Target Audience Profile</label>
                <input
                  type="text"
                  value={searchAudienceInput}
                  onChange={(e) => setSearchAudienceInput(e.target.value)}
                  placeholder="SaaS Founders & Marketing Executives"
                  className="w-full bg-zinc-950 border border-zinc-850 rounded-xl p-3 text-xs text-zinc-200 focus:outline-none focus:border-red-500 transition-all"
                />
              </div>

              <button
                onClick={handleDeploySearchNetwork}
                disabled={isSubmittingSearchRun}
                className="w-full py-3 bg-gradient-to-r from-red-600 to-orange-500 hover:from-red-500 hover:to-orange-400 text-white font-bold text-xs uppercase tracking-wider rounded-xl transition-all shadow-lg active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer"
              >
                {isSubmittingSearchRun ? (
                  <>
                    <Loader2 size={14} className="animate-spin" />
                    Allocating Agents...
                  </>
                ) : (
                  <>
                    <Play size={12} fill="white" />
                    Deploy Agent Network
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Execution runs list */}
          <div className="bg-[#0b0b0e] border border-zinc-850 p-5 rounded-2xl space-y-4">
            <h3 className="text-xs font-black uppercase text-zinc-300 flex items-center justify-between pb-2 border-b border-zinc-900">
              <span>Historical executions</span>
              <span className="text-[10px] font-mono text-zinc-500">{searchAgentRuns.length} runs</span>
            </h3>

            {isLoadingSearchRuns && searchAgentRuns.length === 0 ? (
              <div className="py-8 flex flex-col items-center justify-center text-zinc-550 text-xs gap-2">
                <Loader2 className="animate-spin text-red-500" size={20} />
                Loading network records...
              </div>
            ) : searchAgentRuns.length === 0 ? (
              <div className="py-8 text-center text-zinc-550 text-xs">
                No previous runs found. Configure a target above to launch your first autonomous search agent campaign.
              </div>
            ) : (
              <div className="space-y-3 max-h-[380px] overflow-y-auto pr-1">
                {searchAgentRuns.map((run) => {
                  const isSelected = selectedSearchRun?.id === run.id;
                  return (
                    <div
                      key={run.id}
                      onClick={() => {
                        setSelectedSearchRun(run);
                        // Set active report phase depending on available data
                        if (run.learning_results) setActiveReportPhase('Learning');
                        else if (run.measurement_results) setActiveReportPhase('Measurement');
                        else if (run.optimization_results) setActiveReportPhase('Optimization');
                        else if (run.content_creation_results) setActiveReportPhase('Content Creation');
                        else if (run.strategy_generation_results) setActiveReportPhase('Strategy Generation');
                        else if (run.seo_diagnosis_results) setActiveReportPhase('SEO Diagnosis');
                        else setActiveReportPhase('Website Analysis');
                      }}
                      className={`p-3.5 rounded-xl border text-left cursor-pointer transition-all ${
                        isSelected 
                          ? 'bg-zinc-950 border-red-500 shadow-md shadow-red-950/20' 
                          : 'bg-zinc-950 hover:bg-zinc-900/60 border-zinc-900 hover:border-zinc-800'
                      }`}
                    >
                      <div className="flex justify-between items-start mb-1.5">
                        <span className="text-[10px] font-mono font-bold text-zinc-400 select-all">{run.id}</span>
                        <span className={`text-[9px] uppercase font-black px-2 py-0.5 rounded-full border ${
                          run.status === 'Completed' 
                            ? 'bg-emerald-950/30 border-emerald-900/40 text-emerald-400'
                            : run.status === 'Failed'
                            ? 'bg-red-950/30 border-red-900/40 text-red-400'
                            : 'bg-orange-950/30 border-orange-900/40 text-orange-400 animate-pulse'
                        }`}>
                          {run.status}
                        </span>
                      </div>
                      <p className="text-xs font-black text-zinc-200 truncate" title={run.url}>{run.url}</p>
                      <div className="flex gap-2 text-[10px] text-zinc-500 mt-2 font-semibold">
                        <span className="bg-zinc-900 border border-zinc-850 px-1.5 py-0.5 rounded truncate max-w-[120px]">{run.niche}</span>
                        <span className="bg-zinc-900 border border-zinc-850 px-1.5 py-0.5 rounded truncate max-w-[120px]">{run.audience}</span>
                      </div>
                      <div className="mt-3 pt-2.5 border-t border-zinc-900 flex justify-between items-center text-[9px] font-bold text-zinc-500 uppercase tracking-wider">
                        <span>Phase Tracker</span>
                        <span className="text-red-500">{run.current_phase}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Right side: visualizer & reports */}
        <div className="lg:col-span-8 space-y-6">
          
          {/* 1. Stepper Workflow Controller (Visible when run selected) */}
          {selectedSearchRun && (
            <div className="bg-[#0b0b0e] border border-zinc-850 p-5 rounded-2xl space-y-4">
              <div className="flex justify-between items-center pb-2 border-b border-zinc-900">
                <div className="space-y-0.5">
                  <h3 className="text-xs font-black uppercase text-zinc-300">Active Workflow Stepper</h3>
                  <p className="text-[10px] text-zinc-500">Click on completed phases (green) to examine specific agent report structures</p>
                </div>
                <span className="text-[10px] font-mono text-zinc-400">Target: {selectedSearchRun.url}</span>
              </div>

              {/* Stepper horizontal pipeline */}
              <div className="relative pt-4 pb-2">
                {/* Connecting bar */}
                <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-zinc-900 -translate-y-1/2" />
                
                <div className="relative z-10 flex justify-between">
                  {[
                    { id: 'Website Analysis', label: '1. Analysis', key: 'website_analysis_results' },
                    { id: 'SEO Diagnosis', label: '2. Diagnosis', key: 'seo_diagnosis_results' },
                    { id: 'Strategy Generation', label: '3. Strategy', key: 'strategy_generation_results' },
                    { id: 'Content Creation', label: '4. Creation', key: 'content_creation_results' },
                    { id: 'Optimization', label: '5. Optimization', key: 'optimization_results' },
                    { id: 'Measurement', label: '6. Measure', key: 'measurement_results' },
                    { id: 'Learning', label: '7. Learning', key: 'learning_results' }
                  ].map((phase, idx) => {
                    const isCompleted = !!selectedSearchRun[phase.key];
                    const isActive = selectedSearchRun.current_phase === phase.id && selectedSearchRun.status === 'In Progress';
                    const isCurrentSelected = activeReportPhase === phase.id;

                    let nodeColor = 'bg-zinc-950 border-zinc-850 text-zinc-500 hover:border-zinc-700';
                    if (isCompleted) {
                      nodeColor = isCurrentSelected 
                        ? 'bg-emerald-500 border-emerald-400 text-black shadow-md shadow-emerald-500/20 font-black' 
                        : 'bg-emerald-950/80 border-emerald-800 text-emerald-400 hover:bg-emerald-900/60 font-black';
                    } else if (isActive) {
                      nodeColor = 'bg-orange-500 border-orange-400 text-black font-bold animate-pulse shadow-md shadow-orange-500/20';
                    }

                    return (
                      <button
                        key={phase.id}
                        disabled={!isCompleted && !isActive}
                        onClick={() => setActiveReportPhase(phase.id)}
                        className={`flex flex-col items-center gap-1.5 focus:outline-none disabled:cursor-not-allowed group transition-all`}
                      >
                        <div className={`w-8 h-8 rounded-full border-2 flex items-center justify-center text-xs font-mono font-black transition-all ${nodeColor}`}>
                          {isCompleted ? '✓' : idx + 1}
                        </div>
                        <span className={`text-[9px] uppercase font-black transition-all ${
                          isCurrentSelected ? 'text-white' : isCompleted ? 'text-zinc-400 group-hover:text-zinc-200' : isActive ? 'text-orange-400' : 'text-zinc-650'
                        }`}>
                          {phase.label}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* 2. Detailed Report Panel */}
          {selectedSearchRun && (
            <div className="bg-[#0b0b0e] border border-zinc-850 p-6 rounded-2xl min-h-[400px]">
              <div className="flex justify-between items-start pb-4 border-b border-zinc-900 mb-6">
                <div className="space-y-1">
                  <span className="text-[10px] uppercase font-black tracking-wider text-red-500">Report Output</span>
                  <h3 className="text-base font-black text-white uppercase">{activeReportPhase} Report</h3>
                </div>
                <span className="text-[10px] bg-zinc-900 text-zinc-400 font-bold px-2.5 py-1 rounded border border-zinc-850 uppercase tracking-widest font-mono">
                  PHASE CODE: {activeReportPhase.replace(/\s+/g, '_').toUpperCase()}
                </span>
              </div>

              {/* Website Analysis Details */}
              {activeReportPhase === 'Website Analysis' && (
                <div className="space-y-6">
                  {!selectedSearchRun.website_analysis_results ? (
                    <div className="py-16 text-center text-zinc-550 flex flex-col items-center gap-3">
                      <Loader2 className="animate-spin text-orange-500" size={24} />
                      <p className="text-xs">Technical SEO Agent is currently scraping, compiling, and analyzing {selectedSearchRun.url}...</p>
                      <p className="text-[10px] text-zinc-650">Testing sitemap hierarchies, latency distributions, and microdata.</p>
                    </div>
                  ) : (
                    <div className="space-y-4 animate-fade-in">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="p-4 rounded-xl bg-zinc-950 border border-zinc-900 space-y-1.5">
                          <span className="text-[10px] font-bold text-zinc-500 uppercase">Crawl Efficiency</span>
                          <p className="text-xs text-zinc-300 leading-relaxed font-semibold">
                            {selectedSearchRun.website_analysis_results.crawlability}
                          </p>
                        </div>
                        <div className="p-4 rounded-xl bg-zinc-950 border border-zinc-900 space-y-1.5">
                          <span className="text-[10px] font-bold text-zinc-500 uppercase">Performance & Latency</span>
                          <p className="text-xs text-zinc-300 leading-relaxed font-semibold">
                            {selectedSearchRun.website_analysis_results.page_speed_insights}
                          </p>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="p-4 rounded-xl bg-zinc-950 border border-zinc-900 space-y-3">
                          <span className="text-[10px] font-bold text-red-500 uppercase block">Critical Blockers Found</span>
                          <ul className="space-y-1.5">
                            {selectedSearchRun.website_analysis_results.critical_blockers?.map((blocker: string, i: number) => (
                              <li key={i} className="text-xs text-zinc-400 flex items-start gap-2">
                                <span className="text-red-500 mt-0.5">•</span>
                                <span>{blocker}</span>
                              </li>
                            )) || <span className="text-xs text-zinc-600">Zero critical blockers logged.</span>}
                          </ul>
                        </div>
                        <div className="p-4 rounded-xl bg-zinc-950 border border-zinc-900 space-y-3">
                          <span className="text-[10px] font-bold text-zinc-500 uppercase block">Sitemap Hierarchy Issues</span>
                          <ul className="space-y-1.5">
                            {selectedSearchRun.website_analysis_results.sitemap_issues?.map((issue: string, i: number) => (
                              <li key={i} className="text-xs text-zinc-400 flex items-start gap-2">
                                <span className="text-orange-500 mt-0.5">•</span>
                                <span>{issue}</span>
                              </li>
                            )) || <span className="text-xs text-zinc-600 font-semibold">No active hierarchy issues detected.</span>}
                          </ul>
                        </div>
                      </div>

                      <div className="p-4 rounded-xl bg-zinc-950 border border-zinc-900 space-y-1.5">
                        <span className="text-[10px] font-bold text-zinc-500 uppercase">Active Schema Microdata</span>
                        <p className="text-xs text-zinc-300 leading-relaxed font-semibold">
                          {selectedSearchRun.website_analysis_results.schema_status}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* SEO Diagnosis Details */}
              {activeReportPhase === 'SEO Diagnosis' && (
                <div className="space-y-6">
                  {!selectedSearchRun.seo_diagnosis_results ? (
                    <div className="py-16 text-center text-zinc-550 flex flex-col items-center gap-3">
                      {selectedSearchRun.status === 'In Progress' ? (
                        <>
                          <Loader2 className="animate-spin text-orange-500" size={24} />
                          <p className="text-xs">Keyword Intelligence Agent is auditing semantic clusters and mapping competitor footprints...</p>
                        </>
                      ) : (
                        <p className="text-xs">No Diagnosis report compiled for this campaign phase.</p>
                      )}
                    </div>
                  ) : (
                    <div className="space-y-4 animate-fade-in">
                      <div className="p-4 rounded-xl bg-zinc-950 border border-zinc-900 space-y-1.5">
                        <span className="text-[10px] font-bold text-zinc-500 uppercase block">Search Intent Taxonomy</span>
                        <p className="text-xs text-zinc-300 leading-relaxed font-semibold">
                          {selectedSearchRun.seo_diagnosis_results.intent_mapping}
                        </p>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="p-4 rounded-xl bg-zinc-950 border border-zinc-900 space-y-3">
                          <span className="text-[10px] font-bold text-orange-400 uppercase block">Identified Semantic Gaps</span>
                          <ul className="space-y-1.5">
                            {selectedSearchRun.seo_diagnosis_results.semantic_gaps?.map((gap: string, i: number) => (
                              <li key={i} className="text-xs text-zinc-300 flex items-start gap-2">
                                <span className="text-orange-500 mt-0.5">•</span>
                                <span>{gap}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                        <div className="p-4 rounded-xl bg-zinc-950 border border-zinc-900 space-y-3">
                          <span className="text-[10px] font-bold text-red-500 uppercase block">Competitor Search Phrases</span>
                          <ul className="space-y-1.5">
                            {selectedSearchRun.seo_diagnosis_results.competitor_keywords?.map((keyword: string, i: number) => (
                              <li key={i} className="text-xs text-zinc-300 flex items-start gap-2 font-mono">
                                <span className="text-red-500 mt-0.5">•</span>
                                <span>{keyword}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>

                      <div className="p-4 rounded-xl bg-zinc-950 border border-zinc-900 space-y-3">
                        <span className="text-[10px] font-bold text-zinc-500 uppercase block">LSI Keyword Cluster Opportunities</span>
                        <div className="flex flex-wrap gap-2">
                          {selectedSearchRun.seo_diagnosis_results.lsi_clusters?.map((cluster: string, i: number) => (
                            <span key={i} className="bg-zinc-900 border border-zinc-800 text-zinc-300 text-xs px-2.5 py-1 rounded-lg font-bold">
                              {cluster}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Strategy Generation Details */}
              {activeReportPhase === 'Strategy Generation' && (
                <div className="space-y-6">
                  {!selectedSearchRun.strategy_generation_results ? (
                    <div className="py-16 text-center text-zinc-550 flex flex-col items-center gap-3">
                      {selectedSearchRun.status === 'In Progress' ? (
                        <>
                          <Loader2 className="animate-spin text-orange-500" size={24} />
                          <p className="text-xs">Content Strategy Agent is formulating topical hubs and planning publication pipelines...</p>
                        </>
                      ) : (
                        <p className="text-xs">No strategy report compiled for this campaign phase.</p>
                      )}
                    </div>
                  ) : (
                    <div className="space-y-4 animate-fade-in">
                      <div className="p-4 rounded-xl bg-zinc-950 border border-zinc-900 space-y-1.5">
                        <span className="text-[10px] font-bold text-zinc-500 uppercase block">Hub-and-Spoke Architecture Blueprint</span>
                        <p className="text-xs text-zinc-300 leading-relaxed font-semibold">
                          {selectedSearchRun.strategy_generation_results.hub_and_spoke_plan}
                        </p>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="p-4 rounded-xl bg-zinc-950 border border-zinc-900 space-y-3">
                          <span className="text-[10px] font-bold text-red-500 uppercase block">Topical Authority Columns</span>
                          <ul className="space-y-1.5">
                            {selectedSearchRun.strategy_generation_results.topical_hubs?.map((hub: string, i: number) => (
                              <li key={i} className="text-xs text-zinc-300 flex items-start gap-2 font-black uppercase">
                                <span className="text-red-500 mt-0.5">•</span>
                                <span>{hub}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                        <div className="p-4 rounded-xl bg-zinc-950 border border-zinc-900 space-y-3">
                          <span className="text-[10px] font-bold text-zinc-500 uppercase block">Strategic Publication Schedule</span>
                          <ul className="space-y-1.5">
                            {selectedSearchRun.strategy_generation_results.timeline?.map((item: string, i: number) => (
                              <li key={i} className="text-xs text-zinc-300 flex items-start gap-2">
                                <span className="text-orange-500 mt-0.5">•</span>
                                <span>{item}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Content Creation Details */}
              {activeReportPhase === 'Content Creation' && (
                <div className="space-y-6">
                  {!selectedSearchRun.content_creation_results ? (
                    <div className="py-16 text-center text-zinc-550 flex flex-col items-center gap-3">
                      {selectedSearchRun.status === 'In Progress' ? (
                        <>
                          <Loader2 className="animate-spin text-orange-500" size={24} />
                          <p className="text-xs">Content Optimization Agent is crafting click-optimized headers and drafting dense LSI copy blocks...</p>
                        </>
                      ) : (
                        <p className="text-xs">No content assets drafted for this campaign.</p>
                      )}
                    </div>
                  ) : (
                    <div className="space-y-6 animate-fade-in">
                      {selectedSearchRun.content_creation_results.articles?.map((article: any, idx: number) => (
                        <div key={idx} className="p-5 rounded-xl bg-zinc-950 border border-zinc-900 space-y-4">
                          <div className="flex justify-between items-start border-b border-zinc-900 pb-3">
                            <div className="space-y-0.5">
                              <span className="text-[9px] font-bold text-red-500 uppercase">Draft Article #{idx + 1}</span>
                              <h4 className="text-sm font-black text-white">{article.title}</h4>
                            </div>
                            <button
                              onClick={() => handleCopy(article.dense_paragraph || '', 'Draft text')}
                              className="px-2.5 py-1 text-[10px] font-bold text-zinc-400 hover:text-white bg-zinc-900 hover:bg-zinc-850 border border-zinc-800 rounded-lg cursor-pointer transition-all active:scale-95 flex items-center gap-1"
                            >
                              <Copy size={10} />
                              Copy Draft
                            </button>
                          </div>

                          <div className="space-y-1.5">
                            <span className="text-[10px] font-bold text-zinc-500 uppercase">Click-Optimized Meta Description</span>
                            <p className="text-xs text-zinc-300 italic p-3 bg-zinc-900/40 rounded-xl border border-zinc-900 font-semibold leading-relaxed">
                              "{article.meta_desc}"
                            </p>
                          </div>

                          <div className="space-y-2.5">
                            <span className="text-[10px] font-bold text-zinc-500 uppercase">SEO Content Block (Density-mapped LSI)</span>
                            <p className="text-xs text-zinc-300 leading-relaxed bg-zinc-900/20 p-4 rounded-xl border border-zinc-900 font-semibold">
                              {article.dense_paragraph}
                            </p>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                            <div className="space-y-2">
                              <span className="text-[10px] font-bold text-zinc-500 uppercase">Article Section Outlines</span>
                              <ul className="space-y-1 bg-zinc-900/20 p-3 rounded-xl border border-zinc-900">
                                {article.outline?.map((sec: string, sIdx: number) => (
                                  <li key={sIdx} className="text-xs text-zinc-400 flex items-start gap-2">
                                    <span className="text-red-500 mt-0.5">•</span>
                                    <span>{sec}</span>
                                  </li>
                                ))}
                              </ul>
                            </div>
                            <div className="space-y-2">
                              <span className="text-[10px] font-bold text-zinc-500 uppercase">Micro-Content Distribution Summaries</span>
                              <ul className="space-y-2 bg-zinc-900/20 p-3 rounded-xl border border-zinc-900">
                                {article.micro_content?.map((micro: string, mIdx: number) => (
                                  <li key={mIdx} className="text-xs text-zinc-400 p-2 bg-[#0b0b0d] border border-zinc-900 rounded-lg relative group">
                                    <span className="block text-[8px] uppercase font-black text-orange-500 mb-1">
                                      Variant #{mIdx + 1}
                                    </span>
                                    <span className="line-clamp-3 leading-relaxed">{micro}</span>
                                    <button
                                      onClick={() => handleCopy(micro, 'Social copy')}
                                      className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 p-1 bg-zinc-900 text-zinc-400 hover:text-white rounded transition-all"
                                      title="Copy to clipboard"
                                    >
                                      <Copy size={10} />
                                    </button>
                                  </li>
                                ))}
                              </ul>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Optimization Details */}
                  {activeReportPhase === 'Optimization' && (
                    <div className="space-y-6">
                      {!selectedSearchRun.optimization_results ? (
                        <div className="py-16 text-center text-zinc-550 flex flex-col items-center gap-3">
                          {selectedSearchRun.status === 'In Progress' ? (
                            <>
                              <Loader2 className="animate-spin text-orange-500" size={24} />
                              <p className="text-xs">AEO & GEO Agents are formulating conversational snippet blocks and mapping knowledge graph schemas...</p>
                            </>
                          ) : (
                            <p className="text-xs">No structural schemas or snippet optimization assets found.</p>
                          )}
                        </div>
                      ) : (
                        <div className="space-y-5 animate-fade-in">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="p-4 rounded-xl bg-zinc-950 border border-zinc-900 space-y-3">
                              <span className="text-[10px] font-bold text-red-500 uppercase block">Featured Snippet Answer block</span>
                              {selectedSearchRun.optimization_results.featured_snippets?.map((snip: any, i: number) => (
                                <div key={i} className="space-y-2">
                                  <div className="p-2.5 bg-zinc-900/60 border border-zinc-900 rounded-lg">
                                    <span className="text-[8px] font-black uppercase text-orange-500 block mb-1">Target Question</span>
                                    <p className="text-xs text-white font-bold">{snip.question}</p>
                                  </div>
                                  <div className="p-3 bg-[#0d0d10] border border-red-950/40 rounded-lg relative group">
                                    <span className="text-[8px] font-black uppercase text-emerald-500 block mb-1">Answer Snippet (Declarative, Under 45 Words)</span>
                                    <p className="text-xs text-zinc-300 leading-relaxed font-semibold italic">"{snip.answer}"</p>
                                    <button
                                      onClick={() => handleCopy(snip.answer, 'Featured Snippet')}
                                      className="absolute top-2.5 right-2 text-zinc-500 hover:text-white"
                                    >
                                      <Copy size={12} />
                                    </button>
                                  </div>
                                </div>
                              ))}
                            </div>

                            <div className="p-4 rounded-xl bg-zinc-950 border border-zinc-900 space-y-3">
                              <span className="text-[10px] font-bold text-zinc-500 uppercase block">Conversational Voice Script Templates</span>
                              <ul className="space-y-2">
                                {selectedSearchRun.optimization_results.voice_response_templates?.map((script: string, i: number) => (
                                  <li key={i} className="text-xs text-zinc-400 p-2.5 bg-zinc-900/20 border border-zinc-900 rounded-lg leading-relaxed">
                                    <span className="block text-[8px] font-black text-zinc-600 mb-1">SPOKEN OUTLINE #{i + 1}</span>
                                    "{script}"
                                  </li>
                                ))}
                              </ul>
                            </div>
                          </div>

                          <div className="p-4 rounded-xl bg-zinc-950 border border-zinc-900 space-y-3">
                            <div className="flex justify-between items-center">
                              <span className="text-[10px] font-bold text-zinc-500 uppercase block">JSON-LD Structured Schema Templates</span>
                              <button
                                    onClick={() => handleCopy(selectedSearchRun.optimization_results.json_ld_schemas?.[0] || '', 'Schema JSON')}
                                    className="px-2 py-0.5 text-[9px] text-zinc-400 hover:text-white bg-zinc-900 border border-zinc-800 rounded font-bold"
                              >
                                Copy Schema Code
                              </button>
                            </div>
                            <pre className="p-4 rounded-lg bg-black/60 border border-zinc-900 text-[10px] text-emerald-400 font-mono overflow-x-auto whitespace-pre-wrap leading-relaxed max-h-[160px]">
                              {selectedSearchRun.optimization_results.json_ld_schemas?.[0]}
                            </pre>
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Measurement Details */}
                  {activeReportPhase === 'Measurement' && (
                    <div className="space-y-5 animate-fade-in">
                      {!selectedSearchRun.measurement_results ? (
                        <div className="py-16 text-center text-zinc-550 flex flex-col items-center gap-3">
                          {selectedSearchRun.status === 'In Progress' ? (
                            <>
                              <Loader2 className="animate-spin text-orange-500" size={24} />
                              <p className="text-xs">Link Authority and Analytics Agents are estimating click models and compiling competitive SWOT forecasts...</p>
                            </>
                          ) : (
                            <p className="text-xs">No metrics forecasts compiled for this campaign.</p>
                          )}
                        </div>
                      ) : (
                        <>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="p-4 rounded-xl bg-zinc-950 border border-zinc-900 flex justify-between items-center">
                              <div className="space-y-0.5">
                                <span className="text-[9px] font-black text-zinc-500 uppercase tracking-widest block">Predicted Campaign CTR</span>
                                <span className="text-[10px] text-zinc-400 leading-none">Generative & search click probability</span>
                              </div>
                              <span className="text-3xl font-black font-mono text-emerald-400 bg-emerald-950/20 border border-emerald-900/30 px-3.5 py-1.5 rounded-xl">
                                {selectedSearchRun.measurement_results.predicted_ctr_percent}%
                              </span>
                            </div>
                            <div className="p-4 rounded-xl bg-zinc-950 border border-zinc-900 flex justify-between items-center">
                              <div className="space-y-0.5">
                                <span className="text-[9px] font-black text-zinc-500 uppercase tracking-widest block">Organic Traffic Valuation</span>
                                <span className="text-[10px] text-zinc-400 leading-none">Equivalent keyword click CPC cost</span>
                              </div>
                              <span className="text-3xl font-black font-mono text-white bg-zinc-900 border border-zinc-850 px-3.5 py-1.5 rounded-xl">
                                {selectedSearchRun.measurement_results.cpc_valuation}
                              </span>
                            </div>
                          </div>

                          <div className="p-4 rounded-xl bg-zinc-950 border border-zinc-900 space-y-3">
                            <span className="text-[10px] font-bold text-zinc-500 uppercase block">High-Value Authority Co-Citation Targets</span>
                            <div className="flex flex-wrap gap-2">
                              {selectedSearchRun.measurement_results.backlink_opportunities?.map((target: string, i: number) => (
                                <span key={i} className="bg-zinc-900 border border-zinc-800 text-zinc-300 text-xs px-2.5 py-1 rounded-lg font-bold">
                                  🔗 {target}
                                </span>
                              ))}
                            </div>
                          </div>

                          <div className="space-y-2">
                            <span className="text-[10px] font-bold text-zinc-500 uppercase block mb-1">4-Quadrant SWOT Analytics Matrix</span>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div className="p-4 rounded-xl bg-zinc-950 border border-zinc-900 space-y-2">
                                <span className="text-[10px] uppercase font-black text-emerald-500 tracking-wider">Strengths (Inherent Edge)</span>
                                <ul className="space-y-1 text-xs text-zinc-400">
                                  {selectedSearchRun.measurement_results.swot_analysis?.strengths?.map((item: string, i: number) => (
                                    <li key={i} className="flex gap-1.5 items-start">
                                      <span className="text-emerald-500">•</span>
                                      <span>{item}</span>
                                    </li>
                                  ))}
                                </ul>
                              </div>
                              <div className="p-4 rounded-xl bg-zinc-950 border border-zinc-900 space-y-2">
                                <span className="text-[10px] uppercase font-black text-orange-500 tracking-wider">Weaknesses (Exposure Risk)</span>
                                <ul className="space-y-1 text-xs text-zinc-400">
                                  {selectedSearchRun.measurement_results.swot_analysis?.weaknesses?.map((item: string, i: number) => (
                                    <li key={i} className="flex gap-1.5 items-start">
                                      <span className="text-orange-500">•</span>
                                      <span>{item}</span>
                                    </li>
                                  ))}
                                </ul>
                              </div>
                              <div className="p-4 rounded-xl bg-zinc-950 border border-zinc-900 space-y-2">
                                <span className="text-[10px] uppercase font-black text-blue-500 tracking-wider">Opportunities (Scalers)</span>
                                <ul className="space-y-1 text-xs text-zinc-400">
                                  {selectedSearchRun.measurement_results.swot_analysis?.opportunities?.map((item: string, i: number) => (
                                    <li key={i} className="flex gap-1.5 items-start">
                                      <span className="text-blue-500">•</span>
                                      <span>{item}</span>
                                    </li>
                                  ))}
                                </ul>
                              </div>
                              <div className="p-4 rounded-xl bg-zinc-950 border border-zinc-900 space-y-2">
                                <span className="text-[10px] uppercase font-black text-red-500 tracking-wider">Threats (Platform Factors)</span>
                                <ul className="space-y-1 text-xs text-zinc-400">
                                  {selectedSearchRun.measurement_results.swot_analysis?.threats?.map((item: string, i: number) => (
                                    <li key={i} className="flex gap-1.5 items-start">
                                      <span className="text-red-500">•</span>
                                      <span>{item}</span>
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            </div>
                          </div>
                        </>
                      )}
                    </div>
                  )}

                  {/* Learning Loop Details */}
                  {activeReportPhase === 'Learning' && (
                    <div className="space-y-6">
                      {!selectedSearchRun.learning_results ? (
                        <div className="py-16 text-center text-zinc-550 flex flex-col items-center gap-3">
                          {selectedSearchRun.status === 'In Progress' ? (
                            <>
                              <Loader2 className="animate-spin text-orange-500" size={24} />
                              <p className="text-xs">Analytics feedback loops are compiling historical takeaways and updating prompt libraries...</p>
                            </>
                          ) : (
                            <p className="text-xs">No learning reports compiled for this campaign yet.</p>
                          )}
                        </div>
                      ) : (
                        <div className="space-y-4 animate-fade-in">
                          <div className="p-4 rounded-xl bg-zinc-950 border border-zinc-900 space-y-1.5">
                            <span className="text-[10px] font-bold text-zinc-500 uppercase block">Profound Strategic Insights Gained</span>
                            <p className="text-xs text-zinc-300 leading-relaxed font-semibold">
                              {selectedSearchRun.learning_results.key_takeaways}
                            </p>
                          </div>

                          <div className="p-4 rounded-xl bg-zinc-950 border border-zinc-900 space-y-2">
                            <span className="text-[10px] font-bold text-zinc-500 uppercase block">Self-Optimized Prompt Override for Subsequent Cycles</span>
                            <pre className="p-3 rounded-lg bg-black/40 border border-zinc-900 text-[10px] text-zinc-400 font-mono whitespace-pre-wrap leading-relaxed">
                              {selectedSearchRun.learning_results.refined_prompts}
                            </pre>
                          </div>

                          <div className="p-4 rounded-xl bg-zinc-950 border border-zinc-900 space-y-3">
                            <span className="text-[10px] font-bold text-emerald-400 uppercase block">Prioritized Immediate Action Checklist</span>
                            <ul className="space-y-2">
                              {selectedSearchRun.learning_results.next_action_items?.map((item: string, i: number) => (
                                <li key={i} className="text-xs text-zinc-300 flex items-start gap-2.5 font-bold">
                                  <span className="text-emerald-500 mt-0.5">✔</span>
                                  <span>{item}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
            </div>
          )}

          {/* 3. The 9 Specialized Agent Matrix (Grid Details) */}
          <div className="bg-[#0b0b0e] border border-zinc-850 p-5 rounded-2xl space-y-4">
            <div className="flex justify-between items-center pb-2 border-b border-zinc-900">
              <div className="space-y-0.5">
                <h3 className="text-xs font-black uppercase text-zinc-300">The 9 Specialized Agent Matrix</h3>
                <p className="text-[10px] text-zinc-500">Select an agent below to examine its configured Tools, Tasks, Memory, and KPIs</p>
              </div>
              <span className="text-[10px] bg-red-950/20 text-red-500 border border-red-900/40 px-2 py-0.5 rounded font-black font-mono">9 ACTIVE AGENTS</span>
            </div>

            {/* Agent micro-cards grid */}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {isLoadingSearchAgents && searchAgents.length === 0 ? (
                <div className="col-span-full py-8 text-center text-zinc-550 text-xs">
                  Loading agent matrix...
                </div>
              ) : (
                searchAgents.map((agent) => {
                  const isSelected = selectedSearchAgent?.id === agent.id;
                  return (
                    <div
                      key={agent.id}
                      onClick={() => setSelectedSearchAgent(agent)}
                      className={`p-3 rounded-xl border text-left cursor-pointer transition-all active:scale-95 select-none ${
                        isSelected
                          ? 'bg-[#111115] border-red-500 shadow shadow-red-950/20'
                          : 'bg-zinc-950 hover:bg-zinc-900/60 border-zinc-900 hover:border-zinc-800'
                      }`}
                    >
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest font-mono">
                          {agent.id.replace(/_agent/gi, '').replace(/_/g, ' ')}
                        </span>
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                      </div>
                      <h4 className="text-xs font-black text-zinc-100 truncate">{agent.name}</h4>
                    </div>
                  );
                })
              )}
            </div>

            {/* Agent Details sub-panel */}
            {selectedSearchAgent && (
              <div className="p-5 rounded-xl bg-zinc-950 border border-zinc-900 space-y-4 animate-fade-in">
                <div className="flex justify-between items-start border-b border-zinc-900 pb-3">
                  <div className="space-y-0.5">
                    <span className="text-[8px] font-black uppercase text-red-500 tracking-wider">Agent Blueprint Spec</span>
                    <h4 className="text-sm font-black text-white">{selectedSearchAgent.name}</h4>
                  </div>
                  <span className="text-[10px] text-emerald-400 uppercase font-black tracking-widest font-mono bg-emerald-950/20 px-2 py-0.5 border border-emerald-900/30 rounded">
                    STATUS: {selectedSearchAgent.status?.toUpperCase() || 'ACTIVE'}
                  </span>
                </div>

                <div className="space-y-1">
                  <span className="text-[10px] font-bold text-zinc-500 uppercase block">Purpose & Objectives</span>
                  <p className="text-xs text-zinc-300 leading-relaxed font-semibold">
                    {selectedSearchAgent.purpose}
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
                  <div className="space-y-2">
                    <span className="text-[10px] font-bold text-zinc-500 uppercase block">Configured System Tools</span>
                    <div className="flex flex-wrap gap-1.5">
                      {selectedSearchAgent.tools?.map((tool: string, i: number) => (
                        <span key={i} className="text-[10px] font-bold bg-zinc-900 border border-zinc-800 text-zinc-300 px-2.5 py-1 rounded-lg">
                          ⚡ {tool}
                        </span>
                      )) || <span className="text-xs text-zinc-650">None</span>}
                    </div>
                  </div>
                  <div className="space-y-2">
                    <span className="text-[10px] font-bold text-zinc-500 uppercase block">Key Performance Indicators (KPIs)</span>
                    <div className="space-y-1.5">
                      {selectedSearchAgent.metrics && typeof selectedSearchAgent.metrics === 'object' ? (
                        Object.entries(selectedSearchAgent.metrics).map(([key, val]: [string, any], i) => (
                          <div key={i} className="flex justify-between text-xs font-mono">
                            <span className="text-zinc-500 uppercase font-bold text-[10px]">{key.replace(/_/g, ' ')}</span>
                            <span className="text-zinc-200 font-bold">{val}</span>
                          </div>
                        ))
                      ) : (
                        <span className="text-xs text-zinc-650">No tracked metrics.</span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="space-y-2 pt-1">
                  <span className="text-[10px] font-bold text-zinc-500 uppercase block">Execution Tasks & Responsibilities</span>
                  <ul className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs text-zinc-400">
                    {selectedSearchAgent.tasks?.map((task: string, i: number) => (
                      <li key={i} className="flex gap-2 items-center bg-[#0b0b0d] p-2 border border-zinc-900 rounded-lg">
                        <span className="text-emerald-500 text-[10px]">✔</span>
                        <span className="font-semibold">{task}</span>
                      </li>
                    )) || <span className="text-xs text-zinc-650">None</span>}
                  </ul>
                </div>

                <div className="space-y-2 pt-1">
                  <span className="text-[10px] font-bold text-zinc-500 uppercase block">Long-Term Memory Logs</span>
                  <div className="p-3 rounded-lg bg-black/40 border border-zinc-900 font-mono text-[10px] text-zinc-400 italic max-h-[80px] overflow-y-auto leading-relaxed">
                    {selectedSearchAgent.memory?.map((mem: string, i: number) => (
                      <p key={i} className="leading-relaxed">
                        • {mem}
                      </p>
                    )) || <p className="text-zinc-600">No active context memories logs found.</p>}
                  </div>
                </div>
              </div>
            )}
          </div>

        </div>

      </div>
    </div>
  );
};
