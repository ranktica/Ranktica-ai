import React, { useState, useMemo } from 'react';
import { Project, ProjectMilestone } from '@/shared/types';
import { 
  FileJson, 
  Clock, 
  CheckCircle2, 
  Sparkles, 
  FileText, 
  Image as ImageIcon, 
  TrendingUp, 
  Calendar, 
  Users, 
  Edit, 
  Download, 
  Database,
  ExternalLink,
  ChevronRight,
  PieChart,
  Activity,
  AlertCircle
} from 'lucide-react';
import { toast } from 'react-hot-toast';

interface ProjectOverviewDashboardProps {
  projects: Project[];
  activeProject: Project | null;
  setActiveProjectById: (id: string) => void;
  updateActiveProject: (updates: Partial<Project>) => Promise<void>;
}

export const ProjectOverviewDashboard: React.FC<ProjectOverviewDashboardProps> = ({
  projects,
  activeProject,
  setActiveProjectById,
  updateActiveProject
}) => {
  const [editingRuntime, setEditingRuntime] = useState(false);
  const [runtimeMinutes, setRuntimeMinutes] = useState('10');
  const [runtimeSeconds, setRuntimeSeconds] = useState('00');

  // Active project list excluding archived unless active itself is archived
  const selectableProjects = useMemo(() => {
    return projects.filter(p => !p.archived || p.id === activeProject?.id);
  }, [projects, activeProject]);

  // Calculate project metrics
  const stats = useMemo(() => {
    if (!activeProject) return {
      completionPct: 0,
      scriptOk: false,
      thumbnailOk: false,
      seoOk: false,
      milestonesPct: 0,
      totalMilestones: 0,
      completedMilestones: 0,
      totalTasks: 0,
      completedTasks: 0
    };

    const assets = activeProject.assets || {};
    const scriptOk = !!assets.script;
    const thumbnailOk = !!assets.thumbnail;
    const seoOk = !!assets.seo && (
      (Array.isArray(assets.seo.titles) && assets.seo.titles.length > 0) || 
      !!assets.seo.description || 
      (Array.isArray(assets.seo.tags) && assets.seo.tags.length > 0)
    );

    const milestones: ProjectMilestone[] = activeProject.milestones || assets.milestones || [];
    const completedMilestones = milestones.filter(m => m.completed).length;
    const totalMilestones = milestones.length;
    const milestonesPct = totalMilestones > 0 ? (completedMilestones / totalMilestones) : 0;

    const tasks = assets.tasks || [];
    const completedTasks = tasks.filter((t: any) => t.status === 'completed').length;
    const totalTasks = tasks.length;

    // Proportional breakdown calculation
    const completionPct = 
      (scriptOk ? 25 : 0) + 
      (thumbnailOk ? 25 : 0) + 
      (seoOk ? 25 : 0) + 
      Math.round(milestonesPct * 25);

    return {
      completionPct,
      scriptOk,
      thumbnailOk,
      seoOk,
      milestonesPct: Math.round(milestonesPct * 100),
      totalMilestones,
      completedMilestones,
      totalTasks,
      completedTasks
    };
  }, [activeProject]);

  // Handle active runtime edit
  const startRuntimeEditing = () => {
    if (!activeProject) return;
    const currentRuntime = activeProject.assets?.videoRuntime || '10:00';
    const parts = currentRuntime.split(':');
    setRuntimeMinutes(parts[0] || '10');
    setRuntimeSeconds(parts[1] || '00');
    setEditingRuntime(true);
  };

  const saveRuntime = async () => {
    if (!activeProject) return;
    const formattedMinutes = String(parseInt(runtimeMinutes, 10) || 0).padStart(2, '0');
    const formattedSeconds = String(parseInt(runtimeSeconds, 10) || 0).padStart(2, '0');
    const finalRuntime = `${formattedMinutes}:${formattedSeconds}`;

    const currentAssets = activeProject.assets || {};
    await updateActiveProject({
      assets: {
        ...currentAssets,
        videoRuntime: finalRuntime
      }
    });

    setEditingRuntime(false);
    toast.success(`Video runtime updated to ${finalRuntime}! ⏱️`);
  };

  // Generate downloadable JSON summary report
  const handleDownloadJSONReport = () => {
    if (!activeProject) {
      toast.error('No active project to export.');
      return;
    }

    const prj = activeProject;
    const milestones: ProjectMilestone[] = prj.milestones || prj.assets?.milestones || [];
    const tasks = prj.assets?.tasks || [];

    const report = {
      reportType: "Ranktica AI Project Progress Summary Report",
      generatedAt: new Date().toISOString(),
      metadata: {
        projectId: prj.id,
        title: prj.title,
        niche: prj.niche,
        targetAudience: prj.audience || 'General',
        status: prj.status,
        deadline: prj.deadline || prj.assets?.deadline || 'None Specified',
        archived: !!prj.archived,
        teamMembers: prj.team || []
      },
      metrics: {
        completionPercentage: `${stats.completionPct}%`,
        estimatedVideoRuntime: prj.assets?.videoRuntime || '10:00',
        progressStatus: stats.completionPct === 100 ? 'COMPLETED' : 'IN_PROGRESS',
        breakdown: {
          scriptDrafted: stats.scriptOk,
          thumbnailGenerated: stats.thumbnailOk,
          seoAssetsOptimized: stats.seoOk,
          milestonesMilestoneRate: `${stats.milestonesPct}%`
        }
      },
      workflowItems: {
        milestones: milestones.map(m => ({
          id: m.id,
          title: m.title,
          targetDate: m.date,
          completed: !!m.completed
        })),
        tasks: tasks.map((t: any) => ({
          id: t.id,
          title: t.title,
          status: t.status,
          dateRange: `${t.startDate} to ${t.endDate}`
        }))
      },
      linkedScripts: {
        hasScript: stats.scriptOk,
        currentScriptExcerpt: prj.assets?.script ? (prj.assets.script.substring(0, 1000) + (prj.assets.script.length > 1000 ? "..." : "")) : "",
        scriptHistory: prj.assets?.scriptHistory || []
      },
      generatedThumbnails: {
        hasThumbnail: stats.thumbnailOk,
        thumbnailAsset: prj.assets?.thumbnail || null,
        thumbnailDraft: prj.assets?.thumbnailDraft || null,
        compositionModel: "Cosmic Vision Pro",
        ctrPrediction: prj.assets?.thumbnail?.ctrPrediction || "Pending"
      },
      seoData: {
        hasSeoData: stats.seoOk,
        metaTopic: prj.assets?.metadata_topic || "",
        metaDescription: prj.assets?.metadata_description || "",
        titles: prj.assets?.seo?.titles || [],
        description: prj.assets?.seo?.description || "",
        tags: prj.assets?.seo?.tags || [],
        hashtags: prj.assets?.seo?.hashtags || [],
        semanticClusters: prj.assets?.seo?.semanticClusters || []
      }
    };

    const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${prj.title.toLowerCase().replace(/[^a-z0-9]+/g, '_')}_progress_summary.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success(`Exported clinical progress summary JSON report for "${prj.title}"! 🚀`);
  };

  if (!activeProject) {
    return (
      <div className="flex flex-col items-center justify-center p-20 bg-zinc-900 border border-zinc-800 rounded-[2.5rem] text-center space-y-4">
        <AlertCircle size={48} className="text-zinc-600 animate-pulse" />
        <h3 className="text-lg font-bold text-white font-sans">No Active Campaign Project Detected</h3>
        <p className="text-zinc-400 text-xs max-w-sm">Select or create a video project in the Active Work tab to synchronize operations on this dashboard.</p>
      </div>
    );
  }

  // Find thumbnail url safely
  const thumbnailSrc = typeof activeProject.assets?.thumbnail === 'string' 
    ? activeProject.assets.thumbnail 
    : (activeProject.assets?.thumbnail?.url || activeProject.assets?.thumbnailDraft);

  return (
    <div className="space-y-8">
      {/* Top Controller Header Card */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-[2.5rem] p-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-6 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-600/5 rounded-full blur-3xl pointer-events-none" />
        
        <div className="space-y-2">
          <span className="bg-indigo-600/10 text-indigo-400 border border-indigo-500/20 px-3.5 py-1.5 rounded-full text-[10px] uppercase font-black tracking-widest">
            Active Campaign Pilot
          </span>
          <div className="flex items-center gap-3">
            <h3 className="text-2xl font-black text-white font-sans tracking-tight">{activeProject.title}</h3>
            <span className={`px-2.5 py-0.5 rounded-md text-[10px] font-bold uppercase ${
              activeProject.status === 'published' ? 'bg-green-500/10 text-green-400 border border-green-500/20' :
              activeProject.status === 'scheduled' ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20' :
              activeProject.status === 'production' ? 'bg-red-500/10 text-red-400 border border-red-500/20' :
              'bg-zinc-800 text-zinc-400'
            }`}>
              {activeProject.status}
            </span>
          </div>
          <p className="text-zinc-400 text-xs max-w-xl font-medium">{activeProject.description || 'No description assigned. Add notes inside the project configuration.'}</p>
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full md:w-auto self-stretch md:self-auto">
          {/* Project Switcher Selector */}
          <div className="flex flex-col space-y-1 sm:w-56">
            <label className="text-[9px] font-black uppercase text-zinc-500 tracking-wider">Active Workspace Pivot</label>
            <select
              value={activeProject.id}
              onChange={(e) => setActiveProjectById(e.target.value)}
              className="bg-zinc-950 border border-zinc-800 text-zinc-300 text-xs rounded-xl px-3 py-2.5 outline-none focus:border-zinc-700 transition-all font-sans font-bold"
            >
              {selectableProjects.map(p => (
                <option key={p.id} value={p.id}>
                  {p.title} {p.archived ? '(Archived)' : ''}
                </option>
              ))}
            </select>
          </div>

          <button
            type="button"
            onClick={handleDownloadJSONReport}
            className="sm:self-end bg-indigo-600 hover:bg-indigo-500 text-white font-black text-[10px] uppercase tracking-widest px-5 py-3.5 rounded-xl transition-all shadow-md hover:shadow-indigo-600/10 flex items-center justify-center gap-2 font-mono active-press"
          >
            <FileJson size={14} /> Download Summary JSON
          </button>
        </div>
      </div>

      {/* Main Bento Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Stats Column: Completion Indicator & Metadata Box */}
        <div className="space-y-8 lg:col-span-1">
          {/* Completion Ring Card */}
          <div className="bg-zinc-900 border border-zinc-800 rounded-[2.5rem] p-8 space-y-6 shadow-xl relative overflow-hidden">
            <h4 className="text-xs font-black uppercase tracking-widest text-zinc-400 flex items-center gap-2">
              <PieChart size={14} className="text-indigo-400" /> Deliverables Progress
            </h4>

            {/* Circular Progress Indicator */}
            <div className="flex flex-col items-center justify-center py-4 relative">
              <div className="relative w-40 h-40">
                <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                  <circle 
                    cx="50" 
                    cy="50" 
                    r="40" 
                    stroke="#18181b" 
                    strokeWidth="8" 
                    fill="transparent" 
                  />
                  <circle 
                    cx="50" 
                    cy="50" 
                    r="40" 
                    stroke="url(#progressGradient)" 
                    strokeWidth="8" 
                    fill="transparent" 
                    strokeDasharray={2 * Math.PI * 40}
                    strokeDashoffset={2 * Math.PI * 40 * (1 - stats.completionPct / 100)}
                    strokeLinecap="round"
                    className="transition-all duration-1000 ease-out"
                  />
                  <defs>
                    <linearGradient id="progressGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#818cf8" />
                      <stop offset="100%" stopColor="#4f46e5" />
                    </linearGradient>
                  </defs>
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-3xl font-black text-white font-mono tracking-tighter">{stats.completionPct}%</span>
                  <span className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest">Completed</span>
                </div>
              </div>
            </div>

            {/* Detailed checklist */}
            <div className="space-y-3.5 border-t border-zinc-850 pt-4 font-sans">
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2.5">
                  <div className={`w-5 h-5 rounded-full flex items-center justify-center border ${
                    stats.scriptOk ? 'bg-green-500/10 border-green-500/20 text-green-400' : 'bg-zinc-950 border-zinc-800 text-zinc-600'
                  }`}>
                    {stats.scriptOk ? <CheckCircle2 size={12} /> : <div className="w-1.5 h-1.5 bg-zinc-700 rounded-full" />}
                  </div>
                  <span className="text-zinc-300 font-medium">Linguistic Content Draft</span>
                </div>
                <span className="text-zinc-500 font-mono text-[10px]">25%</span>
              </div>

              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2.5">
                  <div className={`w-5 h-5 rounded-full flex items-center justify-center border ${
                    stats.thumbnailOk ? 'bg-green-500/10 border-green-500/20 text-green-400' : 'bg-zinc-950 border-zinc-800 text-zinc-600'
                  }`}>
                    {stats.thumbnailOk ? <CheckCircle2 size={12} /> : <div className="w-1.5 h-1.5 bg-zinc-700 rounded-full" />}
                  </div>
                  <span className="text-zinc-300 font-medium">Thumbnails Rendered</span>
                </div>
                <span className="text-zinc-500 font-mono text-[10px]">25%</span>
              </div>

              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2.5">
                  <div className={`w-5 h-5 rounded-full flex items-center justify-center border ${
                    stats.seoOk ? 'bg-green-500/10 border-green-500/20 text-green-400' : 'bg-zinc-950 border-zinc-800 text-zinc-600'
                  }`}>
                    {stats.seoOk ? <CheckCircle2 size={12} /> : <div className="w-1.5 h-1.5 bg-zinc-700 rounded-full" />}
                  </div>
                  <span className="text-zinc-300 font-medium">SEO & Tag Optimization</span>
                </div>
                <span className="text-zinc-500 font-mono text-[10px]">25%</span>
              </div>

              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2.5">
                  <div className={`w-5 h-5 rounded-full flex items-center justify-center border ${
                    stats.milestonesPct > 0 ? 'bg-green-500/10 border-green-500/20 text-green-400' : 'bg-zinc-950 border-zinc-800 text-zinc-600'
                  }`}>
                    {stats.milestonesPct === 100 ? <CheckCircle2 size={12} /> : <div className="w-1.5 h-1.5 bg-zinc-700 rounded-full" />}
                  </div>
                  <span className="text-zinc-300 font-medium">Milestones Milestone Rate</span>
                </div>
                <span className="text-zinc-400 font-mono text-[10px]">{stats.milestonesPct}% ({stats.completedMilestones}/{stats.totalMilestones})</span>
              </div>
            </div>
          </div>

          {/* Interactive Runtime Card */}
          <div className="bg-zinc-900 border border-zinc-800 rounded-[2.5rem] p-8 space-y-4 shadow-xl">
            <div className="flex justify-between items-center">
              <h4 className="text-xs font-black uppercase tracking-widest text-zinc-400 flex items-center gap-2">
                <Clock size={14} className="text-red-500" /> Temporal Tuning
              </h4>
              {!editingRuntime && (
                <button
                  type="button"
                  onClick={startRuntimeEditing}
                  className="text-[10px] text-zinc-500 hover:text-white uppercase font-black tracking-widest transition-all flex items-center gap-1 font-mono"
                >
                  <Edit size={10} /> Tune
                </button>
              )}
            </div>

            {editingRuntime ? (
              <div className="space-y-4 font-sans bg-zinc-950 p-4 border border-zinc-800 rounded-2xl">
                <div className="flex items-center justify-center gap-3">
                  <div className="flex flex-col items-center">
                    <label className="text-[8px] font-bold text-zinc-600 uppercase tracking-widest mb-1">Mins</label>
                    <input 
                      type="number" 
                      min="0" 
                      max="180"
                      value={runtimeMinutes} 
                      onChange={(e) => setRuntimeMinutes(e.target.value)}
                      className="w-16 bg-zinc-900 border border-zinc-800 rounded-xl px-2 py-3 text-center text-sm font-bold font-mono text-white outline-none focus:border-red-500"
                    />
                  </div>
                  <span className="text-xl font-bold text-zinc-600 font-mono mt-4">:</span>
                  <div className="flex flex-col items-center">
                    <label className="text-[8px] font-bold text-zinc-600 uppercase tracking-widest mb-1">Secs</label>
                    <input 
                      type="number" 
                      min="0" 
                      max="59"
                      value={runtimeSeconds} 
                      onChange={(e) => setRuntimeSeconds(e.target.value)}
                      className="w-16 bg-zinc-900 border border-zinc-800 rounded-xl px-2 py-3 text-center text-sm font-bold font-mono text-white outline-none focus:border-red-500"
                    />
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setEditingRuntime(false)}
                    className="flex-1 bg-zinc-900 border border-zinc-800 hover:bg-zinc-855 text-zinc-400 text-[9px] uppercase font-black tracking-widest py-2 rounded-xl"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={saveRuntime}
                    className="flex-1 bg-red-650 hover:bg-red-500 text-white text-[9px] uppercase font-black tracking-widest py-2 rounded-xl shadow-md"
                  >
                    Save
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-between py-2">
                <div>
                  <p className="text-[9px] font-black uppercase text-zinc-500 tracking-wider">Estimated video runtime</p>
                  <p className="text-3xl font-black text-white font-mono tracking-tighter mt-1">
                    {activeProject.assets?.videoRuntime || '10:00'}
                  </p>
                </div>
                <div className="bg-red-500/10 p-3.5 rounded-[1.5rem] text-red-500 border border-red-500/20">
                  <Clock size={22} />
                </div>
              </div>
            )}

            <div className="grid grid-cols-2 gap-4 border-t border-zinc-850 pt-4 text-xs font-sans">
              <div>
                <span className="text-zinc-500">Niche</span>
                <p className="text-zinc-300 font-bold mt-0.5 truncate">{activeProject.niche}</p>
              </div>
              <div>
                <span className="text-zinc-500">Target Audience</span>
                <p className="text-zinc-300 font-bold mt-0.5 truncate">{activeProject.audience || 'General'}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Right Assets Column: Script, Thumbnail, and SEO Cards */}
        <div className="space-y-8 lg:col-span-2">
          
          {/* Connected Assets Dashboard Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            
            {/* Script Asset Box */}
            <div className="bg-zinc-900 border border-zinc-800 rounded-[2.5rem] p-8 space-y-4 shadow-xl flex flex-col justify-between">
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <h4 className="text-xs font-black uppercase tracking-widest text-zinc-400 flex items-center gap-2">
                    <FileText size={14} className="text-amber-400" /> Linked Script
                  </h4>
                  <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase ${
                    stats.scriptOk ? 'bg-green-500/10 text-green-400 border border-green-500/10' : 'bg-zinc-950 text-zinc-600'
                  }`}>
                    {stats.scriptOk ? 'DRAFT_READY' : 'PENDING'}
                  </span>
                </div>

                {activeProject.assets?.script ? (
                  <div className="bg-zinc-950 border border-zinc-850 rounded-2xl p-4 h-36 overflow-y-auto font-mono text-[10px] text-zinc-400 leading-relaxed custom-scrollbar whitespace-pre-wrap">
                    {activeProject.assets.script}
                  </div>
                ) : (
                  <div className="border border-dashed border-zinc-800 rounded-2xl p-4 h-36 flex flex-col items-center justify-center text-center space-y-2">
                    <FileText size={24} className="text-zinc-700" />
                    <p className="text-[10px] text-zinc-500 font-sans font-medium">No script content drafted yet for this project.</p>
                  </div>
                )}
              </div>

              {activeProject.assets?.scriptHistory && activeProject.assets.scriptHistory.length > 0 && (
                <div className="text-[10px] font-mono text-zinc-500 flex justify-between items-center border-t border-zinc-850/50 pt-3">
                  <span>Version history:</span>
                  <span className="text-zinc-300 font-bold">{activeProject.assets.scriptHistory.length} drafts compiled</span>
                </div>
              )}
            </div>

            {/* Thumbnail Canvas Box */}
            <div className="bg-zinc-900 border border-zinc-800 rounded-[2.5rem] p-8 space-y-4 shadow-xl flex flex-col justify-between">
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <h4 className="text-xs font-black uppercase tracking-widest text-zinc-400 flex items-center gap-2">
                    <ImageIcon size={14} className="text-blue-400" /> Generated Thumbnail
                  </h4>
                  <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase ${
                    stats.thumbnailOk ? 'bg-green-500/10 text-green-400 border border-green-500/10' : 'bg-zinc-950 text-zinc-600'
                  }`}>
                    {stats.thumbnailOk ? 'READY' : 'PENDING'}
                  </span>
                </div>

                {thumbnailSrc ? (
                  <div className="relative rounded-2xl overflow-hidden border border-zinc-850 bg-zinc-950 h-36 group">
                    <img 
                      src={thumbnailSrc} 
                      alt="Project Thumbnail Asset"
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                      referrerPolicy="no-referrer"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent p-3 flex items-end justify-between">
                      <span className="text-[8px] font-black text-white uppercase tracking-widest font-mono">CTR Predictor: {activeProject.assets?.thumbnail?.ctrPrediction || "85.2"}%</span>
                    </div>
                  </div>
                ) : (
                  <div className="border border-dashed border-zinc-800 rounded-2xl p-4 h-36 flex flex-col items-center justify-center text-center space-y-2">
                    <ImageIcon size={24} className="text-zinc-700" />
                    <p className="text-[10px] text-zinc-500 font-sans font-medium">No studio thumbnail generated yet.</p>
                  </div>
                )}
              </div>

              {activeProject.assets?.thumbnailDraft && (
                <div className="text-[10px] font-mono text-zinc-500 flex justify-between items-center border-t border-zinc-850/50 pt-3">
                  <span>Composition:</span>
                  <span className="text-zinc-300 font-bold truncate max-w-[120px]" title={activeProject.assets.thumbnailDraft}>Draft canvas loaded</span>
                </div>
              )}
            </div>

          </div>

          {/* SEO Metadata Intelligence Bento Card */}
          <div className="bg-zinc-900 border border-zinc-800 rounded-[2.5rem] p-8 space-y-6 shadow-xl relative overflow-hidden">
            <div className="flex justify-between items-center">
              <h4 className="text-xs font-black uppercase tracking-widest text-zinc-400 flex items-center gap-2">
                <Database size={14} className="text-purple-400" /> SEO & Campaign Intelligence
              </h4>
              <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase ${
                stats.seoOk ? 'bg-green-500/10 text-green-400 border border-green-500/10' : 'bg-zinc-950 text-zinc-600'
                  }`}>
                    {stats.seoOk ? 'OPTIMIZED' : 'PENDING'}
              </span>
            </div>

            {stats.seoOk ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 font-sans">
                {/* Titles & Description */}
                <div className="space-y-4">
                  {activeProject.assets.seo?.titles && activeProject.assets.seo.titles.length > 0 && (
                    <div className="space-y-1.5">
                      <span className="text-[9px] font-black uppercase text-zinc-500 tracking-wider">Optimized high-CTR title options</span>
                      <ul className="space-y-1 text-xs">
                        {activeProject.assets.seo.titles.slice(0, 3).map((title: string, index: number) => (
                          <li key={index} className="text-zinc-300 font-bold flex items-start gap-1.5 leading-tight">
                            <span className="text-indigo-500 font-mono text-[10px] mt-0.5">0{index + 1}.</span>
                            <span>{title}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {activeProject.assets.seo?.description && (
                    <div className="space-y-1">
                      <span className="text-[9px] font-black uppercase text-zinc-500 tracking-wider">Campaign descriptor</span>
                      <p className="text-xs text-zinc-400 leading-relaxed font-normal bg-zinc-950 p-3.5 border border-zinc-850 rounded-xl h-24 overflow-y-auto custom-scrollbar">
                        {activeProject.assets.seo.description}
                      </p>
                    </div>
                  )}
                </div>

                {/* Tags and Semantic clusters */}
                <div className="space-y-4">
                  {activeProject.assets.seo?.tags && activeProject.assets.seo.tags.length > 0 && (
                    <div className="space-y-2">
                      <span className="text-[9px] font-black uppercase text-zinc-500 tracking-wider">Semantic Tag Index</span>
                      <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto custom-scrollbar">
                        {activeProject.assets.seo.tags.slice(0, 12).map((tag: string, i: number) => (
                          <span key={i} className="bg-zinc-950 border border-zinc-850 px-2.5 py-1 rounded-lg text-[9px] text-zinc-400 font-mono font-bold">
                            #{tag}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {activeProject.assets.seo?.semanticClusters && activeProject.assets.seo.semanticClusters.length > 0 && (
                    <div className="space-y-1.5">
                      <span className="text-[9px] font-black uppercase text-zinc-500 tracking-wider">Cognitive Clustering Nodes</span>
                      <div className="flex flex-wrap gap-1">
                        {activeProject.assets.seo.semanticClusters.slice(0, 6).map((node: string, i: number) => (
                          <span key={i} className="bg-purple-950/20 text-purple-400 border border-purple-500/10 px-2 py-0.5 rounded-md text-[9px] font-bold font-mono">
                            {node}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="border border-dashed border-zinc-850 rounded-3xl p-8 flex flex-col items-center justify-center text-center space-y-3 font-sans h-48">
                <Database size={32} className="text-zinc-800" />
                <div className="space-y-1">
                  <p className="text-xs font-bold text-zinc-400">SEO Meta-Vault is empty.</p>
                  <p className="text-[10px] text-zinc-500 max-w-sm">Synthesize keyword matrices, metadata description arrays, and hashtags within the SEO Optimizer tool to populate this index.</p>
                </div>
              </div>
            )}
          </div>

        </div>

      </div>
    </div>
  );
};
