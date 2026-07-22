import React, { useState, useMemo } from 'react';
import { Project } from '@/shared/types';
import { 
  History, 
  Search, 
  SlidersHorizontal, 
  Sparkles, 
  Cpu, 
  Globe, 
  Edit3, 
  Check, 
  Clock, 
  Info, 
  PlusCircle, 
  Video, 
  ChevronDown, 
  Trash2,
  Calendar,
  Layers,
  ArrowRight
} from 'lucide-react';
import { 
  ResponsiveContainer, 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  Tooltip, 
  Legend, 
  BarChart, 
  Bar 
} from 'recharts';
import { toast } from 'react-hot-toast';

interface ProjectActivityTimelineProps {
  projects: Project[];
  historyLogs: any[];
  addHistoryLog: (
    actionOrLog: string | any, 
    type?: 'bulk' | 'save' | 'export' | 'import', 
    metadata?: Record<string, any>
  ) => void;
}

interface TimelineEvent {
  id: string;
  projectId: string;
  projectTitle: string;
  projectNiche: string;
  action: string;
  timestamp: number;
  type: 'edit' | 'generation' | 'deployment';
  iconType: string;
  meta?: Record<string, any>;
}

export const ProjectActivityTimeline: React.FC<ProjectActivityTimelineProps> = ({
  projects,
  historyLogs,
  addHistoryLog
}) => {
  // Only use active (non-archived) projects for timeline visualization selection by default
  const activeProjects = useMemo(() => projects.filter(p => !p.archived), [projects]);

  // Selected projects state for combined timeline visualization
  const [selectedProjIds, setSelectedProjIds] = useState<string[]>(() => 
    activeProjects.map(p => p.id)
  );

  // Filters state
  const [showEdits, setShowEdits] = useState(true);
  const [showGenerations, setShowGenerations] = useState(true);
  const [showDeployments, setShowDeployments] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  // Event Simulator UI controls
  const [simProjId, setSimProjId] = useState(activeProjects[0]?.id || '');
  const [simType, setSimType] = useState<'edit' | 'generation' | 'deployment'>('generation');
  const [simActionIndex, setSimActionIndex] = useState(0);

  const simulationTemplates = {
    edit: [
      { action: 'Updated project details: refined target niche guidelines', meta: { field: 'niche', scope: 'global' } },
      { action: 'Adjusted target demographic parameters to focus on Gen-Z tech consumers', meta: { field: 'audience', scope: 'demographic' } },
      { action: 'Refined voiceover script narration hook and text segments', meta: { field: 'script', length: '1200 words' } },
      { action: 'Updated canvas thumbnail aspect ratio layout structure', meta: { field: 'thumbnail', preset: '16:9' } }
    ],
    generation: [
      { action: 'Generated 5 high-performing viral video script ideas in Idea Lab', meta: { count: 5, model: 'Gemini 2.5 Flash' } },
      { action: 'Synthesized cinematic custom CTR thumbnail artwork storyboard', meta: { style: 'Cyberpunk Photorealistic', aspect: '16:9' } },
      { action: 'Drafted professional script screenplay with dialogue flow', meta: { duration: '3 mins', tone: 'Engaging' } },
      { action: 'Compiled semantic keyword list and Geo/Aeo optimized SEO tags', meta: { keywords: '12 tags', category: 'Automation' } }
    ],
    deployment: [
      { action: 'Scheduled production publishing queue pipeline for automatic feed release', meta: { date: '2026-07-12', platform: 'YouTube' } },
      { action: 'Successfully published finalized MP4 video compilation asset to connected channel API', meta: { url: 'https://youtube.com/watch?v=demo', format: '1080p' } },
      { action: 'Uploaded local optimized SEO package and thumbnail graphics to media library', meta: { host: 'CDN Cloud Storage', size: '22 MB' } }
    ]
  };

  // Sync simulator project dropdown if list changes
  React.useEffect(() => {
    if (activeProjects.length > 0 && !activeProjects.some(p => p.id === simProjId)) {
      setSimProjId(activeProjects[0].id);
    }
  }, [activeProjects, simProjId]);

  // Handle trigger simulation
  const handleTriggerSimulation = () => {
    const selectedProj = activeProjects.find(p => p.id === simProjId);
    if (!selectedProj) {
      toast.error('Please create or select an active project workspace first.');
      return;
    }

    const templates = simulationTemplates[simType];
    const template = templates[simActionIndex % templates.length];
    
    // Log the simulation in the global history logs
    addHistoryLog({
      action: template.action,
      type: simType === 'edit' ? 'save' : simType === 'generation' ? 'import' : 'export',
      timestamp: Date.now(),
      metadata: {
        projectId: selectedProj.id,
        projectTitle: selectedProj.title,
        eventType: simType,
        ...template.meta
      }
    });

    toast.success(`Simulated ${simType} event logged: "${template.action}"`);
    setSimActionIndex(prev => prev + 1);
  };

  // Generate deterministic but realistic timeline events list merged with real historyLogs
  const allMergedEvents = useMemo(() => {
    const events: TimelineEvent[] = [];

    // 1. Process actual historyLogs from state
    historyLogs.forEach((log) => {
      const pId = log.metadata?.projectId || log.metadata?.project_id;
      const matchingProj = projects.find(p => p.id === pId);
      
      // Attempt to identify project by title if no explicit ID
      let finalProjId = pId || '';
      let finalProjTitle = log.metadata?.projectTitle || '';
      let finalProjNiche = '';

      if (matchingProj) {
        finalProjId = matchingProj.id;
        finalProjTitle = matchingProj.title;
        finalProjNiche = matchingProj.niche;
      } else if (log.action) {
        // Fallback: search for title in string
        const foundProj = projects.find(p => log.action.toLowerCase().includes(p.title.toLowerCase()));
        if (foundProj) {
          finalProjId = foundProj.id;
          finalProjTitle = foundProj.title;
          finalProjNiche = foundProj.niche;
        }
      }

      // Skip logging if it doesn't align with any project
      if (!finalProjId) return;

      // Determine event type
      let evType: 'edit' | 'generation' | 'deployment' = 'edit';
      if (log.metadata?.eventType) {
        evType = log.metadata.eventType;
      } else if (log.type === 'export' || log.action.toLowerCase().includes('schedule') || log.action.toLowerCase().includes('publish') || log.action.toLowerCase().includes('deploy')) {
        evType = 'deployment';
      } else if (log.type === 'import' || log.action.toLowerCase().includes('generat') || log.action.toLowerCase().includes('synthesiz') || log.action.toLowerCase().includes('draft')) {
        evType = 'generation';
      }

      events.push({
        id: log.id,
        projectId: finalProjId,
        projectTitle: finalProjTitle,
        projectNiche: finalProjNiche || 'general',
        action: log.action,
        timestamp: log.timestamp,
        type: evType,
        iconType: evType,
        meta: log.metadata
      });
    });

    // 2. Generate deterministic realistic chronological events for each active project
    activeProjects.forEach((proj) => {
      // Base creation timestamp derived from project ID
      const baseTime = parseFloat(proj.id) || (Date.now() - 5 * 24 * 3600 * 1000);
      
      // Create Event
      events.push({
        id: `det-create-${proj.id}`,
        projectId: proj.id,
        projectTitle: proj.title,
        projectNiche: proj.niche,
        action: `Workspace project initialized and target niche "${proj.niche}" configured`,
        timestamp: baseTime,
        type: 'edit',
        iconType: 'edit',
        meta: { field: 'initialization', audience: proj.audience }
      });

      // Idea Generation Event
      events.push({
        id: `det-ideas-${proj.id}`,
        projectId: proj.id,
        projectTitle: proj.title,
        projectNiche: proj.niche,
        action: `Generated 5 high-potential video content ideas targeting ${proj.niche} audience`,
        timestamp: baseTime + 15 * 60 * 1000,
        type: 'generation',
        iconType: 'generation',
        meta: { count: 5, tool: 'Idea Lab' }
      });

      // Scripting Event
      if (proj.assets?.script || proj.status !== 'idea') {
        events.push({
          id: `det-script-${proj.id}`,
          projectId: proj.id,
          projectTitle: proj.title,
          projectNiche: proj.niche,
          action: `Drafted primary voiceover script screenplay and scene descriptions`,
          timestamp: baseTime + 1 * 60 * 60 * 1000,
          type: 'generation',
          iconType: 'generation',
          meta: { duration: '4 mins', tool: 'Scripting Core' }
        });

        events.push({
          id: `det-edit-script-${proj.id}`,
          projectId: proj.id,
          projectTitle: proj.title,
          projectNiche: proj.niche,
          action: `Refined dialogue flow and updated script narration text for better retention`,
          timestamp: baseTime + 2 * 60 * 60 * 1000,
          type: 'edit',
          iconType: 'edit',
          meta: { field: 'script' }
        });
      }

      // Thumbnail Event
      if (proj.assets?.thumbnail || ['production', 'scheduled', 'published'].includes(proj.status)) {
        events.push({
          id: `det-thumb-${proj.id}`,
          projectId: proj.id,
          projectTitle: proj.title,
          projectNiche: proj.niche,
          action: `Synthesized photorealistic custom video thumbnail graphics using AI model`,
          timestamp: baseTime + 10 * 60 * 60 * 1000,
          type: 'generation',
          iconType: 'generation',
          meta: { aspect: '16:9', tool: 'Thumbnail Studio' }
        });
      }

      // SEO / Metadata Optimization Event
      if (proj.assets?.seo || ['scheduled', 'published'].includes(proj.status)) {
        events.push({
          id: `det-seo-${proj.id}`,
          projectId: proj.id,
          projectTitle: proj.title,
          projectNiche: proj.niche,
          action: `Created search-optimized high-CTR SEO title variants and semantic metadata tags`,
          timestamp: baseTime + 15 * 60 * 60 * 1000,
          type: 'generation',
          iconType: 'generation',
          meta: { tagsCount: 15, tool: 'SEO Optimizer' }
        });
      }

      // Scheduled Deployment
      if (proj.status === 'scheduled') {
        events.push({
          id: `det-sched-${proj.id}`,
          projectId: proj.id,
          projectTitle: proj.title,
          projectNiche: proj.niche,
          action: `Scheduled automated publication sequence on connected YouTube account pipeline`,
          timestamp: baseTime + 20 * 60 * 60 * 1000,
          type: 'deployment',
          iconType: 'deployment',
          meta: { date: proj.deadline || 'Upcoming release' }
        });
      }

      // Published Deployment
      if (proj.status === 'published') {
        events.push({
          id: `det-pub-${proj.id}`,
          projectId: proj.id,
          projectTitle: proj.title,
          projectNiche: proj.niche,
          action: `Successfully compiled video frames and deployed final high-CTR video to public channel`,
          timestamp: baseTime + 24 * 60 * 60 * 1000,
          type: 'deployment',
          iconType: 'deployment',
          meta: { platform: 'YouTube API', status: 'published' }
        });
      }
    });

    // Remove duplicates based on ID
    const uniqueMap = new Map<string, TimelineEvent>();
    events.forEach(ev => uniqueMap.set(ev.id, ev));

    return Array.from(uniqueMap.values());
  }, [projects, activeProjects, historyLogs]);

  // Filter events based on selected projects, type toggles, and search keyword
  const filteredEvents = useMemo(() => {
    return allMergedEvents.filter((ev) => {
      // 1. Filter by project selection
      if (!selectedProjIds.includes(ev.projectId)) return false;

      // 2. Filter by type
      if (ev.type === 'edit' && !showEdits) return false;
      if (ev.type === 'generation' && !showGenerations) return false;
      if (ev.type === 'deployment' && !showDeployments) return false;

      // 3. Filter by search term
      if (searchTerm) {
        const query = searchTerm.toLowerCase();
        const matchesAction = ev.action.toLowerCase().includes(query);
        const matchesProject = ev.projectTitle.toLowerCase().includes(query);
        const matchesNiche = ev.projectNiche.toLowerCase().includes(query);
        if (!matchesAction && !matchesProject && !matchesNiche) return false;
      }

      return true;
    }).sort((a, b) => b.timestamp - a.timestamp); // Sort by most recent first
  }, [allMergedEvents, selectedProjIds, showEdits, showGenerations, showDeployments, searchTerm]);

  // Aggregate stats by day for chart data (last 7 days)
  const chartData = useMemo(() => {
    const list: { day: string; Edits: number; Generations: number; Deployments: number }[] = [];
    const today = new Date();

    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(today.getDate() - i);
      const dayLabel = d.toLocaleDateString([], { month: 'short', day: 'numeric' });
      list.push({
        day: dayLabel,
        Edits: 0,
        Generations: 0,
        Deployments: 0
      });
    }

    filteredEvents.forEach((ev) => {
      const evDate = new Date(ev.timestamp);
      const evLabel = evDate.toLocaleDateString([], { month: 'short', day: 'numeric' });
      const dayItem = list.find(item => item.day === evLabel);
      if (dayItem) {
        if (ev.type === 'edit') dayItem.Edits += 1;
        else if (ev.type === 'generation') dayItem.Generations += 1;
        else if (ev.type === 'deployment') dayItem.Deployments += 1;
      }
    });

    return list;
  }, [filteredEvents]);

  // Select / Deselect All helpers
  const handleSelectAll = () => {
    setSelectedProjIds(activeProjects.map(p => p.id));
  };

  const handleDeselectAll = () => {
    setSelectedProjIds([]);
  };

  return (
    <div className="space-y-6 animate-fade-in" id="project-activity-timeline-canvas">
      {/* Chart Section */}
      <div className="bg-zinc-950 border border-zinc-850 rounded-[2rem] p-6 md:p-8 space-y-6">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <span className="text-[9px] font-black tracking-widest text-red-500 uppercase font-mono flex items-center gap-2">
              <History size={12} className="animate-spin-slow" /> Activity Metrics Engine
            </span>
            <h3 className="text-xl font-bold text-white tracking-tight">Interactive Production Trend Analyzer</h3>
            <p className="text-xs text-zinc-500 mt-1">
              Visualize the frequency of digital script edits, AI generation outputs, and channel publishing deployments across selected assets.
            </p>
          </div>

          <div className="flex flex-wrap gap-4 items-center">
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded bg-blue-500" />
              <span className="text-[10px] font-black text-zinc-400 uppercase font-mono">Edits</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded bg-amber-500" />
              <span className="text-[10px] font-black text-zinc-400 uppercase font-mono">Generations</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded bg-emerald-500" />
              <span className="text-[10px] font-black text-zinc-400 uppercase font-mono">Deployments</span>
            </div>
          </div>
        </div>

        {/* Dynamic Activity Trend Chart */}
        <div className="h-64 md:h-72 w-full relative bg-zinc-900/10 border border-zinc-900 rounded-2xl p-4">
          {filteredEvents.length === 0 ? (
            <div className="absolute inset-0 flex flex-col items-center justify-center text-zinc-650 font-mono text-center">
              <SlidersHorizontal size={24} className="opacity-25 mb-2" />
              <span className="text-[10px] uppercase font-black">No Data Points For Selected Filters</span>
              <p className="text-[9px] text-zinc-500 mt-1 max-w-xs">Select projects or toggle active event types to map data on the trend line.</p>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="gradEdits" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.4}/>
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="gradGenerations" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.4}/>
                    <stop offset="95%" stopColor="#f59e0b" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="gradDeployments" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.4}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <XAxis 
                  dataKey="day" 
                  stroke="#52525b" 
                  fontSize={10} 
                  fontWeight="bold"
                  tickLine={false} 
                  axisLine={{ stroke: '#27272a' }}
                />
                <YAxis 
                  stroke="#52525b" 
                  fontSize={10} 
                  fontWeight="bold"
                  tickLine={false}
                  axisLine={false}
                  allowDecimals={false}
                />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#09090b', 
                    borderColor: '#27272a', 
                    borderRadius: '1rem',
                    fontFamily: 'monospace',
                    fontSize: '11px'
                  }}
                  itemStyle={{ textTransform: 'uppercase', fontWeight: 'bold' }}
                />
                <Area 
                  type="monotone" 
                  dataKey="Edits" 
                  stroke="#3b82f6" 
                  strokeWidth={2}
                  fill="url(#gradEdits)" 
                  dot={{ r: 3, strokeWidth: 1 }}
                />
                <Area 
                  type="monotone" 
                  dataKey="Generations" 
                  stroke="#f59e0b" 
                  strokeWidth={2}
                  fill="url(#gradGenerations)" 
                  dot={{ r: 3, strokeWidth: 1 }}
                />
                <Area 
                  type="monotone" 
                  dataKey="Deployments" 
                  stroke="#10b981" 
                  strokeWidth={2}
                  fill="url(#gradDeployments)" 
                  dot={{ r: 3, strokeWidth: 1 }}
                />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Main Core Operations Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Side: Filter Matrix, Asset Selection list & Live Event Simulator */}
        <div className="lg:col-span-4 space-y-6">
          
          {/* Asset checklist selector */}
          <div className="bg-zinc-950 border border-zinc-850 p-6 rounded-[2rem] space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-black uppercase tracking-wider text-white flex items-center gap-2">
                <Layers size={13} className="text-red-500" /> Active Video Assets
              </h4>
              <div className="flex gap-2">
                <button 
                  type="button"
                  onClick={handleSelectAll}
                  className="text-[9px] font-black text-red-500 hover:text-red-400 uppercase tracking-widest cursor-pointer"
                >
                  All
                </button>
                <span className="text-zinc-700 text-[10px]">/</span>
                <button 
                  type="button"
                  onClick={handleDeselectAll}
                  className="text-[9px] font-black text-zinc-500 hover:text-white uppercase tracking-widest cursor-pointer"
                >
                  None
                </button>
              </div>
            </div>

            {activeProjects.length === 0 ? (
              <p className="text-[10px] text-zinc-600 font-mono italic">No active assets found in current workspace.</p>
            ) : (
              <div className="space-y-2 max-h-52 overflow-y-auto no-scrollbar pr-1">
                {activeProjects.map((p) => {
                  const isChecked = selectedProjIds.includes(p.id);
                  let badgeColor = 'bg-zinc-900 text-zinc-400 border-zinc-850';
                  if (p.status === 'idea') badgeColor = 'bg-rose-500/10 text-rose-400 border-rose-500/10';
                  else if (p.status === 'scripting') badgeColor = 'bg-orange-500/10 text-orange-400 border-orange-500/10';
                  else if (p.status === 'production') badgeColor = 'bg-yellow-500/10 text-yellow-400 border-yellow-500/10';
                  else if (p.status === 'scheduled') badgeColor = 'bg-blue-500/10 text-blue-400 border-blue-500/10';
                  else if (p.status === 'published') badgeColor = 'bg-emerald-500/10 text-emerald-400 border-emerald-500/10';

                  return (
                    <label 
                      key={p.id}
                      className={`flex items-center justify-between p-2.5 rounded-xl border transition-all cursor-pointer select-none ${
                        isChecked 
                          ? 'bg-zinc-900 border-zinc-800' 
                          : 'bg-zinc-950/40 border-zinc-900/60 opacity-60 hover:opacity-90'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => {
                            setSelectedProjIds(prev => 
                              prev.includes(p.id) 
                                ? prev.filter(id => id !== p.id) 
                                : [...prev, p.id]
                            );
                          }}
                          className="w-3.5 h-3.5 rounded border-zinc-800 bg-zinc-950 text-red-650 accent-red-650 focus:ring-1 focus:ring-red-500/50 cursor-pointer"
                        />
                        <div className="min-w-0">
                          <p className="text-xs font-bold text-white truncate">{p.title}</p>
                          <p className="text-[9px] text-zinc-500 font-mono uppercase tracking-wider">{p.niche}</p>
                        </div>
                      </div>
                      <span className={`text-[8px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded border shrink-0 ${badgeColor}`}>
                        {p.status}
                      </span>
                    </label>
                  );
                })}
              </div>
            )}
          </div>

          {/* Interactive Simulation Dashboard */}
          <div className="bg-zinc-950 border border-zinc-850 p-6 rounded-[2rem] space-y-4">
            <h4 className="text-xs font-black uppercase tracking-wider text-white flex items-center gap-2">
              <PlusCircle size={13} className="text-red-500" /> Event Simulation Studio
            </h4>
            <p className="text-[10px] text-zinc-500 font-medium leading-normal">
              Simulate manual updates, background generations, or platform deployments to see real-time chronologic additions.
            </p>

            <div className="space-y-3.5 pt-1">
              <div>
                <label className="text-[8px] font-black text-zinc-500 uppercase block font-mono mb-1.5">Target Workspace</label>
                <select
                  value={simProjId}
                  onChange={(e) => setSimProjId(e.target.value)}
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-xl p-2.5 text-xs text-white uppercase outline-none focus:border-red-500 transition-colors cursor-pointer"
                >
                  {activeProjects.map(p => (
                    <option key={p.id} value={p.id}>{p.title}</option>
                  ))}
                  {activeProjects.length === 0 && <option value="">No Active Projects</option>}
                </select>
              </div>

              <div>
                <label className="text-[8px] font-black text-zinc-500 uppercase block font-mono mb-1.5">Event Category</label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setSimType('edit')}
                    className={`p-2.5 rounded-xl text-[9px] font-black uppercase tracking-wider transition-all border flex flex-col items-center gap-1 cursor-pointer ${
                      simType === 'edit'
                        ? 'bg-blue-600/10 border-blue-500 text-blue-400'
                        : 'bg-zinc-900/40 border-zinc-850 text-zinc-400 hover:text-white'
                    }`}
                  >
                    <Edit3 size={12} /> Edit
                  </button>
                  <button
                    type="button"
                    onClick={() => setSimType('generation')}
                    className={`p-2.5 rounded-xl text-[9px] font-black uppercase tracking-wider transition-all border flex flex-col items-center gap-1 cursor-pointer ${
                      simType === 'generation'
                        ? 'bg-amber-600/10 border-amber-500 text-amber-400'
                        : 'bg-zinc-900/40 border-zinc-850 text-zinc-400 hover:text-white'
                    }`}
                  >
                    <Sparkles size={12} /> Generate
                  </button>
                  <button
                    type="button"
                    onClick={() => setSimType('deployment')}
                    className={`p-2.5 rounded-xl text-[9px] font-black uppercase tracking-wider transition-all border flex flex-col items-center gap-1 cursor-pointer ${
                      simType === 'deployment'
                        ? 'bg-emerald-600/10 border-emerald-500 text-emerald-400'
                        : 'bg-zinc-900/40 border-zinc-850 text-zinc-400 hover:text-white'
                    }`}
                  >
                    <Globe size={12} /> Deploy
                  </button>
                </div>
              </div>

              <button
                type="button"
                onClick={handleTriggerSimulation}
                className="w-full bg-red-650 hover:bg-red-600 text-white p-2.5 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all cursor-pointer flex items-center justify-center gap-1.5 shadow-lg shadow-red-950/20 active-press"
              >
                <PlusCircle size={12} /> Log Simulated Action
              </button>
            </div>
          </div>

        </div>

        {/* Right Side: Timeline Event Stream Logs */}
        <div className="lg:col-span-8 bg-zinc-950 border border-zinc-850 rounded-[2.2rem] p-6 md:p-8 space-y-6">
          
          {/* Header controllers inside right pane */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-900 pb-5">
            <div className="flex-1">
              <h3 className="text-sm font-black text-white uppercase tracking-wider">Chronological Stream</h3>
              <p className="text-[10px] text-zinc-500 font-medium">Mapped Events: <strong className="text-zinc-350">{filteredEvents.length}</strong> matching selected filters</p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              {/* Type toggle buttons */}
              <div className="flex bg-zinc-900/80 rounded-xl p-1 border border-zinc-850 text-[9px] font-black uppercase tracking-wider">
                <button
                  type="button"
                  onClick={() => setShowEdits(!showEdits)}
                  className={`px-2.5 py-1.5 rounded-lg transition-all flex items-center gap-1 cursor-pointer ${
                    showEdits ? 'bg-blue-600/10 text-blue-400 border border-blue-500/10' : 'text-zinc-550 hover:text-zinc-400'
                  }`}
                  title="Toggle Edits"
                >
                  ✍️ Edits
                </button>
                <button
                  type="button"
                  onClick={() => setShowGenerations(!showGenerations)}
                  className={`px-2.5 py-1.5 rounded-lg transition-all flex items-center gap-1 cursor-pointer ${
                    showGenerations ? 'bg-amber-600/10 text-amber-400 border border-amber-500/10' : 'text-zinc-550 hover:text-zinc-400'
                  }`}
                  title="Toggle Generations"
                >
                  🤖 Gens
                </button>
                <button
                  type="button"
                  onClick={() => setShowDeployments(!showDeployments)}
                  className={`px-2.5 py-1.5 rounded-lg transition-all flex items-center gap-1 cursor-pointer ${
                    showDeployments ? 'bg-emerald-600/10 text-emerald-400 border border-emerald-500/10' : 'text-zinc-550 hover:text-zinc-400'
                  }`}
                  title="Toggle Deployments"
                >
                  🚀 Deploys
                </button>
              </div>

              {/* Keyword Search */}
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-2.5 text-zinc-600">
                  <Search size={10} />
                </span>
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Filter by keyword..."
                  className="bg-zinc-900 border border-zinc-800 text-[10px] pl-7 pr-3 py-1.5 rounded-xl text-white placeholder-zinc-600 focus:border-red-500 outline-none w-36 sm:w-44 transition-all"
                />
              </div>
            </div>
          </div>

          {/* Interactive timeline tree structure */}
          <div className="overflow-y-auto max-h-[32rem] pr-2 custom-scrollbar no-scrollbar">
            {filteredEvents.length === 0 ? (
              <div className="py-20 flex flex-col items-center justify-center text-center text-zinc-650 font-mono space-y-2">
                <Info size={32} className="opacity-15 text-zinc-550" />
                <span className="text-[10px] uppercase font-black">Timeline Void Discovered</span>
                <p className="text-[10px] text-zinc-550 max-w-xs">
                  No activities conform to your search query or selected filters. Try toggling other event types or selecting additional project assets.
                </p>
              </div>
            ) : (
              <div className="relative border-l border-zinc-900 ml-4 pl-6 space-y-6">
                {filteredEvents.map((ev, index) => {
                  let badgeColor = 'bg-blue-950/40 text-blue-400 border-blue-900/30';
                  let iconElement = <Edit3 size={11} className="text-blue-400" />;
                  
                  if (ev.type === 'generation') {
                    badgeColor = 'bg-amber-950/40 text-amber-400 border-amber-900/30';
                    iconElement = <Sparkles size={11} className="text-amber-400" />;
                  } else if (ev.type === 'deployment') {
                    badgeColor = 'bg-emerald-950/40 text-emerald-400 border-emerald-900/30';
                    iconElement = <Globe size={11} className="text-emerald-400" />;
                  }

                  const evDate = new Date(ev.timestamp);
                  const humanTimeStr = evDate.toLocaleDateString([], { 
                    month: 'short', 
                    day: 'numeric', 
                    hour: '2-digit', 
                    minute: '2-digit' 
                  });

                  // Calculate relative time humanized
                  const diffMs = Date.now() - ev.timestamp;
                  const diffMins = Math.floor(diffMs / (60 * 1000));
                  let relativeStr = 'Just now';
                  
                  if (diffMins >= 1 && diffMins < 60) {
                    relativeStr = `${diffMins} min${diffMins > 1 ? 's' : ''} ago`;
                  } else if (diffMins >= 60) {
                    const diffHrs = Math.floor(diffMins / 60);
                    if (diffHrs < 24) {
                      relativeStr = `${diffHrs} hr${diffHrs > 1 ? 's' : ''} ago`;
                    } else {
                      const diffDays = Math.floor(diffHrs / 24);
                      relativeStr = diffDays === 1 ? 'Yesterday' : `${diffDays} days ago`;
                    }
                  }

                  return (
                    <div key={ev.id} className="relative group transition-all animate-fade-in">
                      {/* Interactive dot link */}
                      <div className={`absolute -left-[30px] top-1 w-4 h-4 rounded-full border border-zinc-950 flex items-center justify-center transition-transform group-hover:scale-110 shadow ${
                        ev.type === 'edit' ? 'bg-blue-950/80 border-blue-500/50' : 
                        ev.type === 'generation' ? 'bg-amber-950/80 border-amber-500/50' : 
                        'bg-emerald-950/80 border-emerald-500/50'
                      }`}>
                        {iconElement}
                      </div>

                      {/* Event container */}
                      <div className="bg-zinc-950/40 hover:bg-zinc-950 border border-zinc-900 hover:border-zinc-800 p-4 rounded-2xl transition-all space-y-2.5">
                        <div className="flex flex-wrap items-center justify-between gap-2.5">
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] font-black uppercase text-white tracking-wide max-w-xs truncate">
                              {ev.projectTitle}
                            </span>
                            <span className="text-[8px] bg-zinc-900 text-zinc-550 border border-zinc-850 px-1.5 py-0.5 rounded font-mono uppercase tracking-widest shrink-0">
                              {ev.projectNiche}
                            </span>
                          </div>
                          
                          <div className="flex items-center gap-2 text-[9px] font-mono font-black shrink-0">
                            <span className={`px-1.5 py-0.5 rounded border text-[8px] uppercase tracking-wider ${badgeColor}`}>
                              {ev.type}
                            </span>
                            <span className="text-zinc-650 flex items-center gap-1">
                              <Clock size={9} /> {relativeStr}
                            </span>
                          </div>
                        </div>

                        <p className="text-xs text-zinc-300 font-semibold leading-relaxed">
                          {ev.action}
                        </p>

                        {/* Rendering metadata if available */}
                        {ev.meta && Object.keys(ev.meta).length > 0 && (
                          <div className="text-[9px] font-mono text-zinc-550 bg-zinc-950 border border-zinc-900 rounded-xl p-2.5 space-y-1">
                            <div className="flex items-center gap-1 border-b border-zinc-900 pb-1 mb-1 font-black text-[8px] text-zinc-600 uppercase">
                              <Info size={9} /> Operational Attributes
                            </div>
                            <div className="grid grid-cols-2 gap-x-4 gap-y-1">
                              {Object.entries(ev.meta).map(([key, val]) => {
                                if (['projectId', 'projectTitle', 'eventType'].includes(key)) return null;
                                return (
                                  <div key={key} className="flex justify-between truncate">
                                    <span className="text-zinc-650 uppercase font-black">{key}:</span>
                                    <span className="text-zinc-400 font-semibold">{String(val)}</span>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        )}
                        
                        <div className="text-[8px] text-zinc-650 font-mono text-right font-black">
                          LOGGED: {humanTimeStr}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

        </div>

      </div>

    </div>
  );
};
