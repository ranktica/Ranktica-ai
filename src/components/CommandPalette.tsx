import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useProject } from '@/app/ProjectContext';
import { useCommand } from '@/shared/CommandContext';
import { ToolType } from '@/shared/types';
import toast from 'react-hot-toast';
import { 
  Search, 
  Terminal, 
  Briefcase, 
  CornerDownLeft, 
  X, 
  Sparkles,
  Command,
  FileCode,
  Wrench,
  Play,
  Plus,
  Loader2,
  CheckCircle2,
  AlertTriangle,
  Trash2,
  CircleDot,
  Layers,
  Keyboard,
  Video
} from 'lucide-react';

const TOOL_LABELS: Record<ToolType, string> = {
  [ToolType.DASHBOARD]: 'Creator Dashboard',
  [ToolType.AGENT_BUS]: 'Agent Bus View',
  [ToolType.DEV_DASHBOARD]: 'Developer Dashboard',
  [ToolType.ABOUT]: 'About Ranktica',
  [ToolType.PROJECTS]: 'Projects Hub',
  [ToolType.IDEAS]: 'Viral Idea Lab',
  [ToolType.SCRIPT]: 'Script Writer',
  [ToolType.SEO]: 'SEO Optimizer',
  [ToolType.THUMBNAIL]: 'Thumbnail Studio',
  [ToolType.THUMBNAIL_RATER]: 'Aesthetic Thumbnail Rater',
  [ToolType.VIDEO]: 'Adaptive Video Studio',
  [ToolType.VIDEO_GENERATOR]: 'AI Video Generator',
  [ToolType.AUDIO]: 'Precision Audio Studio',
  [ToolType.RESEARCH]: 'Research & Grounding',
  [ToolType.COMPETITOR_SPY]: 'Competitor Intelligence',
  [ToolType.CHANNEL_AUDIT]: 'Channel Health Audit',
  [ToolType.LIVE]: 'Live Brainstorming',
  [ToolType.MARKETING]: 'Outbound Marketing Scheduler',
  [ToolType.REPURPOSE]: 'Omni Repurpose Engine',
  [ToolType.KEYWORD_INSPECTOR]: 'Semantic Keyword Inspector',
  [ToolType.TREND_WATCHER]: 'Real-time Trend Watcher',
  [ToolType.TITLE_GENERATOR]: 'High-CTR Title Predictor',
  [ToolType.OUTREACH]: 'Outreach Hub',
  [ToolType.EMAIL_MARKETING]: 'Active Email Campaigns',
  [ToolType.MARKET_STRATEGIST]: 'Market Strategist',
  [ToolType.UPGRADE]: 'Subscription Upgrades',
  [ToolType.WORKFLOW]: 'Autonomous Workflow Automation',
  [ToolType.SHORTS_GENERATOR]: 'Viral Shorts Studio',
  [ToolType.METADATA_ENGINEER]: 'YouTube Metadata Engineer',
  [ToolType.OBJECT_STORAGE]: 'Cloud Object Storage',
  [ToolType.AB_TESTING]: 'A/B CTR Split Tester',
  [ToolType.SUBSCRIPTIONS]: 'Stripe Subscriptions',
  [ToolType.CUSTOMERS]: 'Customer Directory',
  [ToolType.PAYMENTS]: 'Stripe Payment Ingestion',
  [ToolType.INVOICES]: 'Stripe Invoicing System',
  [ToolType.STRIPE_WEBHOOKS]: 'Stripe Webhook Listener',
  [ToolType.ACTIVITY_LOGS]: 'Activity Audit Logs',
  [ToolType.SECURITY]: 'SaaS Security & Audits',
  [ToolType.COST_GOVERNANCE]: 'AI Cost Governance & Telemetry',
  [ToolType.RAG_INTELLIGENCE]: 'Knowledge Intelligence & RAG Core',
  [ToolType.PROMPT_PORTAL]: 'Prompt Platform Specifications',
  [ToolType.AI_EMPLOYEE_OS]: 'Digital Employee OS',
  [ToolType.BATTERY_DASHBOARD]: 'Battery Health Dashboard',
  [ToolType.TEAM_MEMBERS]: 'Team Collaboration Hub',
};

// Map tools to clean categories for grouping in the command palette
const TOOL_CATEGORIES: Record<ToolType, 'core' | 'ai' | 'analytics' | 'billing'> = {
  [ToolType.DASHBOARD]: 'core',
  [ToolType.PROJECTS]: 'core',
  [ToolType.ABOUT]: 'core',
  [ToolType.UPGRADE]: 'billing',
  [ToolType.SUBSCRIPTIONS]: 'billing',
  [ToolType.CUSTOMERS]: 'billing',
  [ToolType.PAYMENTS]: 'billing',
  [ToolType.INVOICES]: 'billing',
  [ToolType.STRIPE_WEBHOOKS]: 'billing',
  [ToolType.DEV_DASHBOARD]: 'core',
  [ToolType.AGENT_BUS]: 'core',
  [ToolType.OBJECT_STORAGE]: 'core',
  [ToolType.WORKFLOW]: 'ai',
  [ToolType.IDEAS]: 'ai',
  [ToolType.SCRIPT]: 'ai',
  [ToolType.SEO]: 'ai',
  [ToolType.SHORTS_GENERATOR]: 'ai',
  [ToolType.METADATA_ENGINEER]: 'ai',
  [ToolType.THUMBNAIL]: 'ai',
  [ToolType.THUMBNAIL_RATER]: 'ai',
  [ToolType.VIDEO_GENERATOR]: 'ai',
  [ToolType.VIDEO]: 'core',
  [ToolType.AUDIO]: 'core',
  [ToolType.RESEARCH]: 'ai',
  [ToolType.LIVE]: 'ai',
  [ToolType.MARKETING]: 'analytics',
  [ToolType.REPURPOSE]: 'ai',
  [ToolType.KEYWORD_INSPECTOR]: 'analytics',
  [ToolType.TREND_WATCHER]: 'analytics',
  [ToolType.TITLE_GENERATOR]: 'ai',
  [ToolType.AB_TESTING]: 'analytics',
  [ToolType.OUTREACH]: 'analytics',
  [ToolType.EMAIL_MARKETING]: 'analytics',
  [ToolType.MARKET_STRATEGIST]: 'ai',
  [ToolType.COMPETITOR_SPY]: 'analytics',
  [ToolType.CHANNEL_AUDIT]: 'analytics',
  [ToolType.ACTIVITY_LOGS]: 'analytics',
  [ToolType.SECURITY]: 'analytics',
  [ToolType.COST_GOVERNANCE]: 'analytics',
  [ToolType.RAG_INTELLIGENCE]: 'ai',
  [ToolType.PROMPT_PORTAL]: 'ai',
  [ToolType.AI_EMPLOYEE_OS]: 'core',
  [ToolType.BATTERY_DASHBOARD]: 'analytics',
  [ToolType.TEAM_MEMBERS]: 'core',
};

interface CommandPaletteProps {
  onNavigate: (tool: ToolType, payload?: any) => void;
}

export const CommandPalette: React.FC<CommandPaletteProps> = ({ onNavigate }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [activeTab, setActiveTab] = useState<'search' | 'batch' | 'macros'>('search');
  
  // States for macro recording UI inside palette
  const [macroName, setMacroName] = useState('');
  const [macroKey, setMacroKey] = useState('');

  const { projects, activeProject, updateActiveProject, setActiveProjectById } = useProject();
  const { 
    queue, 
    addToQueue, 
    removeFromQueue, 
    clearQueue, 
    executeBatch, 
    isExecuting,
    isRecordingMacro,
    recordedActions,
    macros,
    startRecordingMacro,
    saveRecordedMacro,
    cancelRecordingMacro,
    deleteMacro,
    executeMacro,
    recordMacroAction
  } = useCommand();

  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  // Toggle Command Palette on Ctrl+K
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        setIsOpen(prev => !prev);
        setQuery('');
        setSelectedIndex(0);
      } else if (e.key === 'Escape') {
        setIsOpen(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Autofocus input when command palette is opened
  useEffect(() => {
    if (isOpen && activeTab === 'search') {
      setTimeout(() => inputRef.current?.focus(), 120);
    }
  }, [isOpen, activeTab]);

  // Fuzzy match algorithm with sequence scoring
  const fuzzyMatch = (text: string, queryStr: string): { matches: boolean; score: number } => {
    if (!queryStr) return { matches: true, score: 1 };
    const target = text.toLowerCase();
    const search = queryStr.toLowerCase();
    
    if (target === search) return { matches: true, score: 100 };
    if (target.startsWith(search)) return { matches: true, score: 80 };
    if (target.includes(search)) return { matches: true, score: 60 };
    
    // Character sequence matching
    let searchIdx = 0;
    for (let i = 0; i < target.length; i++) {
      if (target[i] === search[searchIdx]) {
        searchIdx++;
        if (searchIdx === search.length) {
          const matchLength = i + 1;
          const score = Math.floor((search.length / matchLength) * 40);
          return { matches: true, score };
        }
      }
    }
    
    return { matches: false, score: 0 };
  };

  // Compute matched items querying tools, projects, past scripts, and generated assets
  const matchedItems = useMemo(() => {
    const term = query.toLowerCase().trim();
    
    if (!term) {
      // Default list when query is empty: show core tools
      return Object.entries(TOOL_LABELS).map(([type, label]) => ({
        id: `tool-${type}`,
        type: 'tool' as const,
        label,
        category: TOOL_CATEGORIES[type as ToolType],
        toolType: type as ToolType,
        score: 1,
      }));
    }

    const results: any[] = [];

    // 1. Fuzzy match on Tools
    Object.entries(TOOL_LABELS).forEach(([type, label]) => {
      const { matches, score } = fuzzyMatch(label, term);
      if (matches) {
        results.push({
          id: `tool-${type}`,
          type: 'tool' as const,
          label,
          category: TOOL_CATEGORIES[type as ToolType],
          toolType: type as ToolType,
          score: score * 1.5, // prioritize system modules
        });
      }
    });

    // 2. Fuzzy match on Projects
    projects.forEach(p => {
      const matchTitle = fuzzyMatch(p.title, term);
      const matchNiche = fuzzyMatch(p.niche, term);
      const matchDesc = p.description ? fuzzyMatch(p.description, term) : { matches: false, score: 0 };
      
      const bestScore = Math.max(matchTitle.score, matchNiche.score, matchDesc.score);
      if (matchTitle.matches || matchNiche.matches || matchDesc.matches) {
        results.push({
          id: `project-${p.id}`,
          type: 'project' as const,
          label: p.title,
          secondaryLabel: `niche: ${p.niche}`,
          projectId: p.id,
          score: bestScore,
        });
      }

      // 3. Fuzzy match on Past Scripts (active script content or history entries)
      if (p.assets?.script) {
        const scriptStr = typeof p.assets.script === 'string' ? p.assets.script : JSON.stringify(p.assets.script);
        const { matches, score } = fuzzyMatch(scriptStr, term);
        if (matches) {
          const excerpt = scriptStr.slice(0, 100).replace(/[\r\n]+/g, ' ') + '...';
          results.push({
            id: `script-${p.id}`,
            type: 'script' as const,
            label: `Script for: ${p.title}`,
            secondaryLabel: `Excerpt: ${excerpt}`,
            projectId: p.id,
            toolType: ToolType.SCRIPT,
            score: score * 0.9,
          });
        }
      }
      p.assets?.scriptHistory?.forEach((v, idx) => {
        const { matches, score } = fuzzyMatch(v.content, term);
        if (matches) {
          const labelStr = v.label || `Version ${idx + 1}`;
          results.push({
            id: `script-version-${v.id}`,
            type: 'script' as const,
            label: `Script (${labelStr}) in: ${p.title}`,
            secondaryLabel: v.content.slice(0, 100) + '...',
            projectId: p.id,
            toolType: ToolType.SCRIPT,
            score: score * 0.8,
          });
        }
      });

      // 4. Fuzzy match on Generated Assets (thumbnails, ideas, videoUri)
      if (p.assets?.thumbnail) {
        const thumbStr = p.assets.thumbnail.toString();
        const { matches, score } = fuzzyMatch('thumbnail draft design visual', term);
        if (matches || thumbStr.toLowerCase().includes(term)) {
          results.push({
            id: `thumbnail-${p.id}`,
            type: 'asset' as const,
            label: `Thumbnail Asset: ${p.title}`,
            secondaryLabel: `Renders: ${p.assets.thumbnailDraft || thumbStr}`,
            projectId: p.id,
            toolType: ToolType.THUMBNAIL,
            score: score * 0.85,
            assetUri: p.assets.thumbnail,
          });
        }
      }

      p.assets?.ideas?.forEach((idea, idx) => {
        const matchIdeaTitle = fuzzyMatch(idea.title, term);
        const matchIdeaHook = fuzzyMatch(idea.hook, term);
        if (matchIdeaTitle.matches || matchIdeaHook.matches) {
          results.push({
            id: `idea-${p.id}-${idx}`,
            type: 'asset' as const,
            label: `Viral Idea: ${idea.title}`,
            secondaryLabel: `Hook: "${idea.hook}"`,
            projectId: p.id,
            toolType: ToolType.IDEAS,
            score: Math.max(matchIdeaTitle.score, matchIdeaHook.score) * 0.8,
            idea,
          });
        }
      });

      if (p.assets?.videoUri) {
        const { matches, score } = fuzzyMatch(`Video file generated container draft ${p.assets.videoUri}`, term);
        if (matches) {
          results.push({
            id: `video-${p.id}`,
            type: 'asset' as const,
            label: `Video Render: ${p.title}`,
            secondaryLabel: `Stream URI: ${p.assets.videoUri}`,
            projectId: p.id,
            toolType: ToolType.VIDEO_GENERATOR,
            score: score * 0.7,
            assetUri: p.assets.videoUri,
          });
        }
      }
    });

    return results.sort((a, b) => b.score - a.score);
  }, [query, projects]);

  // Ensure selection index reset on query change
  useEffect(() => {
    setSelectedIndex(0);
  }, [query]);

  // Handle keyboard navigation inside the matched list
  useEffect(() => {
    const handleListKeys = (e: KeyboardEvent) => {
      if (!isOpen || activeTab !== 'search' || matchedItems.length === 0) return;

      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex(prev => (prev + 1) % matchedItems.length);
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex(prev => (prev - 1 + matchedItems.length) % matchedItems.length);
      } else if (e.key === 'Enter') {
        e.preventDefault();
        triggerAction(matchedItems[selectedIndex]);
      }
    };

    window.addEventListener('keydown', handleListKeys);
    return () => window.removeEventListener('keydown', handleListKeys);
  }, [isOpen, activeTab, matchedItems, selectedIndex]);

  // Scroll active element into view
  useEffect(() => {
    if (listRef.current) {
      const activeEl = listRef.current.children[selectedIndex] as HTMLElement;
      if (activeEl) {
        activeEl.scrollIntoView({ block: 'nearest' });
      }
    }
  }, [selectedIndex]);

  const triggerAction = (item: any) => {
    if (item.type === 'tool') {
      onNavigate(item.toolType);
    } else if (item.type === 'project') {
      setActiveProjectById(item.projectId);
      onNavigate(ToolType.PROJECTS);
    } else if (item.type === 'script') {
      setActiveProjectById(item.projectId);
      onNavigate(ToolType.SCRIPT);
    } else if (item.type === 'asset') {
      setActiveProjectById(item.projectId);
      onNavigate(item.toolType || ToolType.DASHBOARD);
    }
    setIsOpen(false);
  };

  const handleRunBatch = async () => {
    if (!activeProject) {
      toast.error("Please designate a target workspace project before execution.");
      return;
    }
    try {
      toast.loading("Initiating sequential pipeline flow...", { id: 'batch-pipeline-flow' });
      await executeBatch(activeProject, updateActiveProject);
      toast.success("Pipeline flow executed successfully!", { id: 'batch-pipeline-flow' });
    } catch (err: any) {
      toast.error(`Pipeline stopped: ${err.message || err}`, { id: 'batch-pipeline-flow' });
    }
  };

  if (!isOpen) {
    return (
      <button 
        type="button"
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 z-40 bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-white px-3.5 py-2.5 rounded-full flex items-center gap-2 shadow-2xl transition-all cursor-pointer group hover:border-red-600/30"
      >
        <Command size={14} className="group-hover:text-red-500 transition-colors" />
        <span className="text-[10px] font-black uppercase tracking-wider">Search Palette</span>
        <kbd className="bg-zinc-950 border border-zinc-800 px-1.5 py-0.5 rounded text-[8px] font-mono select-none">Ctrl+K</kbd>
      </button>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-[10vh] px-4 animate-fade-in">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-[#09090b]/85 backdrop-blur-md cursor-pointer" 
        onClick={() => setIsOpen(false)}
      />

      {/* Main Palette Card */}
      <div className="relative w-full max-w-xl bg-zinc-950 border border-zinc-850 rounded-3xl overflow-hidden shadow-2xl shadow-red-600/5 flex flex-col max-h-[70vh]">
        
        {/* Dynamic Navigation Tabs */}
        <div className="flex border-b border-zinc-850 bg-zinc-950/60 p-1">
          <button
            type="button"
            onClick={() => setActiveTab('search')}
            className={`flex-1 py-2.5 text-[10px] font-black uppercase tracking-wider rounded-xl transition-all cursor-pointer ${
              activeTab === 'search' ? 'bg-[#121214] text-white border border-zinc-800' : 'text-zinc-500 hover:text-zinc-300'
            }`}
          >
            Command Search
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('batch')}
            className={`flex-1 py-2.5 text-[10px] font-black uppercase tracking-wider rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
              activeTab === 'batch' ? 'bg-[#121214] text-white border border-zinc-800' : 'text-zinc-500 hover:text-zinc-300'
            }`}
          >
            <Terminal size={12} className="text-red-500" /> Batch Pipeline Queue {queue.length > 0 && <span className="bg-red-500 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full">{queue.length}</span>}
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('macros')}
            className={`flex-1 py-2.5 text-[10px] font-black uppercase tracking-wider rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
              activeTab === 'macros' ? 'bg-[#121214] text-white border border-zinc-800' : 'text-zinc-500 hover:text-zinc-300'
            }`}
          >
            <Keyboard size={12} className="text-indigo-400" /> Reusable Macros {isRecordingMacro && <span className="w-2 h-2 rounded-full bg-red-500 animate-ping" />}
          </button>
        </div>

        {activeTab === 'search' ? (
          <>
            {/* Search Input bar */}
            <div className="flex items-center px-4 py-3.5 border-b border-zinc-850 gap-3">
              <Search className="text-red-500 animate-pulse shrink-0" size={18} />
              <input
                ref={inputRef}
                type="text"
                placeholder="Search Ranktica tools, models or active projects..."
                value={query}
                onChange={e => setQuery(e.target.value)}
                className="w-full bg-transparent border-none text-zinc-100 placeholder-zinc-550 focus:outline-none text-xs font-medium"
              />
              <button 
                onClick={() => setIsOpen(false)}
                className="text-zinc-500 hover:text-zinc-350 p-1 rounded-md bg-zinc-900/50 hover:bg-zinc-900 border border-transparent hover:border-zinc-800 shrink-0 cursor-pointer"
              >
                <X size={14} />
              </button>
            </div>

            {/* Results list */}
            <div 
              ref={listRef}
              className="flex-1 overflow-y-auto p-2 space-y-0.5 max-h-[40vh]"
            >
              {matchedItems.length === 0 ? (
                <div className="text-center py-10 px-4">
                  <Sparkles size={24} className="text-zinc-650 mx-auto mb-2.5 animate-pulse" />
                  <p className="text-[11px] font-black uppercase tracking-wider text-zinc-450">No results found</p>
                  <p className="text-[9px] text-zinc-550 mt-1">Refine your search term or create a new project workspace.</p>
                </div>
              ) : (
                matchedItems.map((item, index) => {
                  const isActive = index === selectedIndex;
                  return (
                    <div
                      key={item.id}
                      onClick={() => triggerAction(item)}
                      onMouseEnter={() => setSelectedIndex(index)}
                      className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl cursor-pointer transition-all ${
                        isActive 
                          ? 'bg-red-650/10 border border-red-500/20 text-white' 
                          : 'border border-transparent hover:bg-zinc-900/40 text-zinc-400 hover:text-zinc-200'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        {item.type === 'tool' ? (
                          item.category === 'ai' ? (
                            <Sparkles size={14} className={isActive ? 'text-red-400' : 'text-zinc-550'} />
                          ) : item.category === 'billing' ? (
                            <Wrench size={14} className={isActive ? 'text-green-400' : 'text-zinc-550'} />
                          ) : (
                            <Terminal size={14} className={isActive ? 'text-red-400' : 'text-zinc-550'} />
                          )
                        ) : (
                          <Briefcase size={14} className={isActive ? 'text-yellow-400' : 'text-zinc-550'} />
                        )}
                        
                        <div>
                          <p className="text-[10px] font-black uppercase tracking-wide">{item.label}</p>
                          {item.type === 'project' && item.secondaryLabel && (
                            <p className="text-[8px] font-mono text-zinc-550 mt-0.5 lowercase">
                              niche: {item.secondaryLabel}
                            </p>
                          )}
                          {item.type === 'tool' && (
                            <p className="text-[8px] font-mono text-zinc-550 mt-0.5 lowercase">
                              module: {item.category}
                            </p>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-2 font-mono text-[8px] opacity-0 group-hover:opacity-100">
                        <span className="text-zinc-500 lowercase">select</span>
                        <CornerDownLeft size={8} className="text-zinc-500" />
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </>
        ) : activeTab === 'batch' ? (
          /* Batch Execution Builder panel */
          <div className="p-6 space-y-6 overflow-y-auto max-h-[50vh] font-sans">
            <div className="space-y-1">
              <h4 className="text-xs font-black text-white uppercase tracking-wider flex items-center gap-2">
                <Terminal size={14} className="text-red-500" /> AI Batch Execution Flow
              </h4>
              <p className="text-[10px] text-zinc-400 font-medium">Queue sequential AI generation tasks for your active project. They will run seamlessly back-to-back.</p>
            </div>

            {/* Active Project Dropdown */}
            <div className="space-y-2">
              <label className="text-[9px] font-black uppercase tracking-widest text-zinc-500 block">Target Project Workspace</label>
              <select
                value={activeProject?.id || ''}
                onChange={(e) => setActiveProjectById(e.target.value)}
                disabled={isExecuting}
                className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-red-650 disabled:opacity-55"
              >
                <option value="" disabled>-- Choose target project --</option>
                {projects.map(p => (
                  <option key={p.id} value={p.id}>{p.title} ({p.niche})</option>
                ))}
              </select>
              {!activeProject && (
                <p className="text-[9px] text-amber-500 font-semibold flex items-center gap-1.5 mt-1 font-mono">
                  <AlertTriangle size={10} /> Active target project required to initiate execution
                </p>
              )}
            </div>

            {/* Pipeline Builder / Add buttons */}
            <div className="space-y-2">
              <label className="text-[9px] font-black uppercase tracking-widest text-zinc-500 block">Available Pipeline Steps</label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => addToQueue('generate_idea', 'Generate 3 High-CTR Video Ideas')}
                  disabled={isExecuting}
                  className="p-2.5 bg-zinc-900 border border-zinc-800 hover:border-red-600/30 rounded-xl text-left hover:bg-zinc-850/60 cursor-pointer disabled:opacity-50 transition"
                >
                  <span className="text-[9.5px] font-black text-white block uppercase tracking-wide">Generate Ideas</span>
                  <span className="text-[8px] text-zinc-500 block mt-0.5">Calculates niches and blue-ocean gaps</span>
                </button>
                <button
                  type="button"
                  onClick={() => addToQueue('write_script', 'Draft Full Creative Screenplay')}
                  disabled={isExecuting}
                  className="p-2.5 bg-zinc-900 border border-zinc-800 hover:border-red-600/30 rounded-xl text-left hover:bg-zinc-850/60 cursor-pointer disabled:opacity-50 transition"
                >
                  <span className="text-[9.5px] font-black text-white block uppercase tracking-wide">Draft Screenplay</span>
                  <span className="text-[8px] text-zinc-500 block mt-0.5">Synthesizes dense conversational scripts</span>
                </button>
                <button
                  type="button"
                  onClick={() => addToQueue('create_thumbnail', 'Synthesize Thumbnail design')}
                  disabled={isExecuting}
                  className="p-2.5 bg-zinc-900 border border-zinc-800 hover:border-red-600/30 rounded-xl text-left hover:bg-zinc-850/60 cursor-pointer disabled:opacity-50 transition"
                >
                  <span className="text-[9.5px] font-black text-white block uppercase tracking-wide">Synthesize Thumbnail</span>
                  <span className="text-[8px] text-zinc-500 block mt-0.5">Renders cinematic YouTube thumbnails</span>
                </button>
              </div>
            </div>

            {/* Queued Steps List */}
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <label className="text-[9px] font-black uppercase tracking-widest text-zinc-500">Pipeline Execution Queue ({queue.length})</label>
                {queue.length > 0 && !isExecuting && (
                  <button
                    type="button"
                    onClick={clearQueue}
                    className="text-[9px] font-black uppercase tracking-wider text-zinc-500 hover:text-red-500 flex items-center gap-1 cursor-pointer bg-transparent border-none"
                  >
                    <Trash2 size={10} /> Clear Queue
                  </button>
                )}
              </div>

              {queue.length === 0 ? (
                <div className="border border-dashed border-zinc-850 rounded-2xl p-6 text-center text-zinc-500 text-[10px]">
                  No pipeline steps queued yet. Click steps above to construct your flow.
                </div>
              ) : (
                <div className="space-y-2">
                  {queue.map((op, idx) => {
                    const isRunning = op.status === 'running';
                    const isCompleted = op.status === 'completed';
                    const isFailed = op.status === 'failed';
                    const isPending = op.status === 'pending';

                    return (
                      <div
                        key={op.id}
                        className={`flex items-center justify-between p-3 border rounded-xl font-mono text-[10px] ${
                          isRunning 
                            ? 'bg-indigo-600/10 border-indigo-500 text-indigo-300' 
                            : isCompleted
                            ? 'bg-emerald-500/5 border-emerald-500/20 text-emerald-400'
                            : isFailed
                            ? 'bg-red-500/5 border-red-500/20 text-red-400'
                            : 'bg-zinc-900/40 border-zinc-850 text-zinc-400'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <span className="text-zinc-600 font-bold">#{idx + 1}</span>
                          <div>
                            <span className="font-extrabold uppercase tracking-wider block">{op.label}</span>
                            <span className="text-[8px] opacity-70 block lowercase">Type: {op.type}</span>
                            {op.error && <span className="text-[8px] text-red-500 block mt-0.5 font-sans font-semibold">Error: {op.error}</span>}
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          {isRunning && <Loader2 size={12} className="animate-spin text-indigo-400" />}
                          {isCompleted && <CheckCircle2 size={12} className="text-emerald-400" />}
                          {isFailed && <AlertTriangle size={12} className="text-red-400" />}
                          
                          {isPending && !isExecuting && (
                            <button
                              type="button"
                              onClick={() => removeFromQueue(op.id)}
                              className="text-zinc-500 hover:text-red-500 transition cursor-pointer p-0.5 bg-transparent border-none"
                            >
                              <X size={12} />
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Submit Action */}
            {queue.length > 0 && (
              <div className="pt-2">
                <button
                  type="button"
                  onClick={handleRunBatch}
                  disabled={isExecuting || !activeProject}
                  className="w-full py-3 bg-red-600 hover:bg-red-500 disabled:bg-zinc-900 disabled:text-zinc-650 rounded-2xl text-xs font-black uppercase tracking-wider text-white shadow-lg transition flex items-center justify-center gap-2 cursor-pointer border-none"
                >
                  {isExecuting ? (
                    <>
                      <Loader2 size={14} className="animate-spin" />
                      Running Pipeline Flow...
                    </>
                  ) : (
                    <>
                      <Play size={12} fill="white" />
                      Launch Pipeline Flow
                    </>
                  )}
                </button>
              </div>
            )}
          </div>
        ) : (
          /* Keyboard Macros panel */
          <div className="p-6 space-y-5 overflow-y-auto max-h-[50vh] font-sans">
            <div className="space-y-1">
              <h4 className="text-xs font-black text-white uppercase tracking-wider flex items-center gap-2">
                <Keyboard size={14} className="text-indigo-400" /> Keyboard Shortcut Macros
              </h4>
              <p className="text-[10px] text-zinc-400 font-medium">
                Record and replay sequences of navigations and AI operations. Play macros instantly using <kbd className="bg-zinc-900 px-1 py-0.5 rounded text-zinc-350">Alt + Key</kbd>.
              </p>
            </div>

            {/* Recording controls */}
            <div className="bg-[#121214]/60 rounded-2xl p-4 border border-zinc-850 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  {isRecordingMacro ? (
                    <>
                      <CircleDot size={12} className="text-red-500 animate-pulse" />
                      <span className="text-[10px] font-black uppercase tracking-wider text-red-500 animate-pulse">Macro Recording Active</span>
                    </>
                  ) : (
                    <>
                      <CircleDot size={12} className="text-zinc-550" />
                      <span className="text-[10px] font-black uppercase tracking-wider text-zinc-300">Macro Recorder Status</span>
                    </>
                  )}
                </div>

                {isRecordingMacro ? (
                  <button
                    type="button"
                    onClick={cancelRecordingMacro}
                    className="text-[9px] font-black uppercase tracking-wider text-zinc-400 hover:text-red-500 px-2.5 py-1 rounded bg-zinc-850/50 hover:bg-zinc-800 transition cursor-pointer border-none"
                  >
                    Cancel
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={startRecordingMacro}
                    className="text-[9px] font-black uppercase tracking-wider text-white px-3 py-1.5 rounded bg-red-600 hover:bg-red-500 transition cursor-pointer border-none flex items-center gap-1.5"
                  >
                    <CircleDot size={10} className="text-white animate-pulse" /> Start Recording
                  </button>
                )}
              </div>

              {/* Staged / Recorded actions list */}
              {isRecordingMacro && (
                <div className="space-y-3">
                  <div className="border border-dashed border-zinc-800 rounded-xl p-3 bg-zinc-950/40 space-y-2">
                    <span className="text-[8.5px] font-black uppercase tracking-widest text-zinc-550 block">Recorded sequence steps ({recordedActions.length})</span>
                    {recordedActions.length === 0 ? (
                      <p className="text-[9px] text-zinc-500 italic">No actions recorded yet. Navigate to other tabs or modules to queue operations.</p>
                    ) : (
                      <div className="space-y-1 max-h-24 overflow-y-auto">
                        {recordedActions.map((act, idx) => (
                          <div key={act.id} className="text-[9px] font-mono text-zinc-400 flex items-center gap-1.5">
                            <span className="text-zinc-650 font-bold">#{idx + 1}</span>
                            <span className="uppercase text-[8px] font-black text-indigo-400 px-1 py-0.2 bg-indigo-500/10 rounded">{act.type}</span>
                            <span>{act.label}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Save macro form */}
                  <div className="space-y-3 pt-2 border-t border-zinc-850">
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="text-[8px] font-black uppercase tracking-wider text-zinc-500 block mb-1">Macro Name</label>
                        <input
                          type="text"
                          placeholder="e.g., Quick Scripting Niche"
                          value={macroName}
                          onChange={e => setMacroName(e.target.value)}
                          className="w-full bg-zinc-950 border border-zinc-850 rounded-lg px-2.5 py-1.5 text-[10px] text-white focus:outline-none focus:border-indigo-500"
                        />
                      </div>
                      <div>
                        <label className="text-[8px] font-black uppercase tracking-wider text-zinc-500 block mb-1">Hotkey (Alt + Key)</label>
                        <input
                          type="text"
                          maxLength={1}
                          placeholder="e.g. m, s, 1"
                          value={macroKey}
                          onChange={e => setMacroKey(e.target.value)}
                          className="w-full bg-zinc-950 border border-zinc-850 rounded-lg px-2.5 py-1.5 text-[10px] text-white font-mono uppercase text-center focus:outline-none focus:border-indigo-500"
                        />
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        saveRecordedMacro(macroName, macroKey);
                        setMacroName('');
                        setMacroKey('');
                      }}
                      disabled={recordedActions.length === 0}
                      className="w-full py-2 bg-indigo-600 hover:bg-indigo-500 disabled:bg-zinc-950 disabled:text-zinc-600 rounded-xl text-[10px] font-black uppercase tracking-wider text-white transition cursor-pointer border-none"
                    >
                      Save Keyboard Macro
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Quick Record AI Tool Steps */}
            {isRecordingMacro && (
              <div className="space-y-2">
                <label className="text-[9px] font-black uppercase tracking-widest text-zinc-550 block">Insert AI Pipeline Step</label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => recordMacroAction('ai_call', 'generate_idea', 'AI Generate 3 High-CTR Ideas')}
                    className="p-2 bg-zinc-900 border border-zinc-850 rounded-xl text-left hover:border-indigo-500 transition cursor-pointer"
                  >
                    <span className="text-[8.5px] font-black text-zinc-300 block uppercase">Ideas Step</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => recordMacroAction('ai_call', 'write_script', 'AI Write Full Screenplay')}
                    className="p-2 bg-zinc-900 border border-zinc-850 rounded-xl text-left hover:border-indigo-500 transition cursor-pointer"
                  >
                    <span className="text-[8.5px] font-black text-zinc-300 block uppercase">Script Step</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => recordMacroAction('ai_call', 'create_thumbnail', 'AI Synthesize Thumbnail')}
                    className="p-2 bg-zinc-900 border border-zinc-850 rounded-xl text-left hover:border-indigo-500 transition cursor-pointer"
                  >
                    <span className="text-[8.5px] font-black text-zinc-300 block uppercase">Thumbnail Step</span>
                  </button>
                </div>
              </div>
            )}

            {/* Saved macros list */}
            <div className="space-y-2.5">
              <label className="text-[9px] font-black uppercase tracking-widest text-zinc-550 block">Saved Keyboard Macros ({macros.length})</label>
              {macros.length === 0 ? (
                <div className="border border-dashed border-zinc-850 rounded-2xl p-6 text-center text-zinc-650 text-[10px]">
                  No reusable macros configured yet. Click 'Start Recording' above.
                </div>
              ) : (
                <div className="space-y-2 max-h-56 overflow-y-auto">
                  {macros.map((m) => (
                    <div
                      key={m.id}
                      className="bg-[#121214]/60 border border-zinc-850 rounded-2xl p-3 flex items-center justify-between"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-black uppercase text-white">{m.name}</span>
                          <span className="px-1.5 py-0.5 rounded bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 font-mono text-[8.5px] font-black uppercase">
                            Alt + {m.shortcutKey.toUpperCase()}
                          </span>
                        </div>
                        <p className="text-[8.5px] text-zinc-500 font-mono">
                          {m.actions.length} steps: {m.actions.map(a => a.label).join(' → ')}
                        </p>
                      </div>

                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => executeMacro(m, onNavigate, updateActiveProject, activeProject)}
                          className="p-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg transition cursor-pointer border-none"
                          title="Execute Macro"
                        >
                          <Play size={10} fill="white" />
                        </button>
                        <button
                          type="button"
                          onClick={() => deleteMacro(m.id)}
                          className="p-2 bg-zinc-950 hover:bg-red-500/15 border border-zinc-850 hover:border-red-500/20 text-zinc-400 hover:text-red-400 rounded-lg transition cursor-pointer"
                          title="Delete Macro"
                        >
                          <Trash2 size={10} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Footer shortcuts helper info */}
        <div className="bg-zinc-950 px-4 py-2 text-[8px] font-bold text-zinc-550 border-t border-zinc-850 flex justify-between items-center bg-zinc-950/90 font-sans tracking-wider uppercase">
          <div className="flex gap-4">
            {activeTab === 'search' ? (
              <>
                <span>↑↓ Nav</span>
                <span>↵ Select</span>
              </>
            ) : (
              <span>Sequence pipeline builder</span>
            )}
            <span>esc Exit</span>
          </div>
          <div className="flex items-center gap-1.5 text-zinc-450">
            <Command size={9} />
            <span>Search Command Console</span>
          </div>
        </div>
      </div>
    </div>
  );
};
