
import React, { useState, useEffect } from 'react';
import { videoIdeaSchema } from '@/types/schemas';
import { z } from 'zod';
import { toast } from 'react-hot-toast';
import { generateIdeas } from '@/infrastructure/gemini';
import { VideoIdea, ToolType } from '@/shared/types';
import { logActivity } from '@/shared/activityLogger';
import { usePersistedFormState } from '@/shared/usePersistedFormState';
import { IdeaCard } from '@/app/IdeaCard';
import { 
  Loader2, 
  Sparkles, 
  Zap, 
  TrendingUp, 
  Search, 
  Bookmark,
  ChevronRight,
  Flame,
  Award,
  Trash2,
  FileText,
  Save,
  BrainCircuit,
  Activity,
  Target,
  ArrowUpRight,
  Briefcase,
  Rocket,
  Download
} from 'lucide-react';
import { useAuth } from '@/infrastructure/auth/AuthContext';
import { useProject } from '@/app/ProjectContext';
import { useCommand } from '@/shared/CommandContext';

const SUGGESTED_NICHES = [
  'AI in Marketing',
  'Faceless Automation',
  'Personal Finance 2025',
  'Minecraft Mods',
  'Clean Cooking'
];

const VIRAL_BLUEPRINTS = [
  {
    niche: 'AI in Marketing: Viral Case Studies',
    ideas: [
      { 
        title: "I Fired my $10,000/mo Marketing Agency for a $12 AI Swarm", 
        hook: "Retainers are a scam. I replaced my entire agency with a swarm of 5 specialized AI agents for less than a dollar a day. The results didn't just match them—they destroyed them. Here's the data.", 
        score: 9.9,
        competition: 'Low',
        interest: 'Exploding',
        logic: "Extreme substitution ROI. Everyone wants to save money while increasing performance using 'secret' tech."
      },
      { 
        title: "Google Search is Dead: How to Rank #1 in AI Overviews (2025 Blueprint)", 
        hook: "The links you're building are useless. AI Overviews have changed search forever. If you aren't optimizing for 'Contextual Resonance,' you are effectively invisible. Here is the survival guide.", 
        score: 9.8,
        competition: 'Medium',
        interest: 'Exploding',
        logic: "Negative bias pattern interrupt. Challenges current reality to sell a future-proof solution."
      }
    ]
  }
];

interface IdeaGeneratorProps {
  onNavigate?: (tool: ToolType, payload?: any) => void;
}

export const IdeaGenerator: React.FC<IdeaGeneratorProps> = ({ onNavigate }) => {
  const [niche, setNiche] = usePersistedFormState('ranktica_ideas_niche', '');
  const [audience, setAudience] = usePersistedFormState('ranktica_ideas_audience', '');
  const [ideas, setIdeas] = useState<VideoIdea[]>([]);
  const [savedGems, setSavedGems] = useState<VideoIdea[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Batch Queue & Processing state
  const [selectedIdeas, setSelectedIdeas] = useState<VideoIdea[]>([]);
  const [sidebarTab, setSidebarTab] = useState<'gems' | 'batch_queue'>('gems');
  const [isProcessingBatch, setIsProcessingBatch] = useState(false);
  const [batchProgress, setBatchProgress] = useState({ current: 0, total: 0 });
  const [batchStep, setBatchStep] = useState('');
  const [batchLogs, setBatchLogs] = useState<string[]>([]);
  const [batchTone, setBatchTone] = usePersistedFormState('ranktica_ideas_batch_tone', 'Fast-paced & Hype');
  const [batchGoal, setBatchGoal] = usePersistedFormState('ranktica_ideas_batch_goal', 'ctr');

  const { incrementStat } = useAuth();
  const { projects, activeProject, updateActiveProject, createProject, addCustomProject } = useProject();
  const { registerCommand } = useCommand();

  const handleExportSelectedZIP = async () => {
    if (selectedIdeas.length === 0) {
      toast.error("Add at least one idea to the batch queue first 💡");
      return;
    }
    const tid = toast.loading("Packaging selected project assets into a standardized ZIP archive...");
    try {
      const { ExportUtility } = await import('@/shared/ExportUtility');
      
      const matchingProjects = projects.filter(p => 
        selectedIdeas.some(idea => 
          p.title === idea.title || 
          p.assets?.ideas?.some((id: any) => id.title === idea.title)
        )
      );

      const projectsToExport = [...matchingProjects];
      
      selectedIdeas.forEach(idea => {
        const alreadyIncluded = projectsToExport.some(p => p.title === idea.title);
        if (!alreadyIncluded) {
          projectsToExport.push({
            id: 'temp-' + Date.now() + Math.random().toString(36).substr(2, 4),
            title: idea.title,
            niche: niche || 'Autonomous Content',
            audience: audience || 'General Audience',
            status: 'idea',
            lastUpdated: Date.now(),
            assets: {
              script: `[AWAITING AI ENGINE BATCH PROSTHESIS - Title: ${idea.title}]\nHook Strategy: ${idea.hook}\nNiche: ${niche}`,
              seo: {
                titles: [idea.title],
                description: `Hook: ${idea.hook}`,
                tags: [niche || 'autonomous', 'viral', String(idea.competition).toLowerCase()],
                hashtags: ['#ranktica', '#aicontent'],
                semanticClusters: []
              }
            },
            team: ['AI Swarm Backup Author']
          });
        }
      });

      await ExportUtility.downloadProjectAssets(projectsToExport, `ranktica-batch-queue-export`);
      toast.success("Standardized zip archive generated successfully! 📦", { id: tid });
    } catch (e: any) {
      toast.error(`Zip export failed: ${e.message || String(e)}`, { id: tid });
    }
  };

  useEffect(() => {
    if (activeProject) {
      setNiche(activeProject.niche);
      setAudience(activeProject.audience || '');
    }
  }, [activeProject]);

  useEffect(() => {
    const saved = localStorage.getItem('ranktica_saved_gems');
    if (saved) {
      try {
        setSavedGems(JSON.parse(saved));
      } catch (e) {
        console.error("Failed to load saved gems", e);
      }
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('ranktica_saved_gems', JSON.stringify(savedGems));
  }, [savedGems]);

  const handleToggleSelectIdea = (idea: VideoIdea) => {
    const isAlreadySelected = selectedIdeas.find(i => i.title === idea.title);

    setSelectedIdeas(prev => {
      if (isAlreadySelected) {
        return prev.filter(i => i.title !== idea.title);
      }
      return [...prev, idea];
    });

    registerCommand(
      'Idea Generator',
      isAlreadySelected ? `Removed from batch queue: "${idea.title}"` : `Queued for batch process: "${idea.title}"`,
      () => {
        setSelectedIdeas(prev => {
          if (isAlreadySelected) {
            return [...prev, idea];
          }
          return prev.filter(i => i.title !== idea.title);
        });
      },
      () => {
        setSelectedIdeas(prev => {
          if (isAlreadySelected) {
            return prev.filter(i => i.title !== idea.title);
          }
          return [...prev, idea];
        });
      }
    );
  };

  const startBatchProcess = async () => {
    if (selectedIdeas.length === 0) return;
    setIsProcessingBatch(true);
    setBatchProgress({ current: 0, total: selectedIdeas.length });
    setBatchLogs(["[System] Initializing automated creative generator..."]);

    // Dynamic import to fetch latest gemini functions safely
    try {
      const { generateScript, engineerMetadata } = await import('@/infrastructure/gemini');

      for (let i = 0; i < selectedIdeas.length; i++) {
        const idea = selectedIdeas[i];
        const indexDisplay = i + 1;
        setBatchProgress({ current: indexDisplay, total: selectedIdeas.length });
        setBatchStep(`Authoring script: "${idea.title.substring(0, 32)}..."`);
        
        setBatchLogs(prev => [...prev, `\n[${indexDisplay}/${selectedIdeas.length}] 🚀 Synthesizing assets for: "${idea.title}"`]);

        try {
          setBatchLogs(prev => [...prev, `[Metadata AI] Designing psychological trigger-matrix...`]);
          // Call actual metadata optimization
          const metadataResult = await engineerMetadata({
            topic: niche || 'Autonomous Content',
            title: idea.title,
            description: `Hook: ${idea.hook}`
          }, batchGoal);
          
          setBatchLogs(prev => [...prev, `[Metadata AI] Success. Primary headline: "${metadataResult.titles?.[0] || idea.title}"`]);

          setBatchLogs(prev => [...prev, `[Scripting AI] Drafting full storytelling voiceover...`]);
          // Call actual script generation
          const targetTitle = metadataResult.titles?.[0] || idea.title;
          const generatedScript = await generateScript(
            targetTitle,
            batchTone,
            'storytelling',
            `Hook: ${idea.hook}. Goal: ${batchGoal}`
          );

          setBatchLogs(prev => [...prev, `[Scripting AI] Success. Compiled narrative buffer.`]);

          setBatchLogs(prev => [...prev, `[Database] Storing new project manifest with version checkpoints...`]);
          const newProjId = Date.now().toString() + Math.random().toString(36).substr(2, 4);
          
          const scriptHistory = [{
            id: 'v1',
            content: generatedScript,
            timestamp: Date.now(),
            label: 'Batch Synthesized Version'
          }];

          const titleHistory = (metadataResult.titles || [idea.title]).map((t: string, idx: number) => ({
            id: `t-${idx}-${Date.now().toString().slice(-4)}`,
            title: t,
            timestamp: Date.now(),
            label: `Batch Option ${idx + 1}`
          }));

          const newProject: any = {
            id: newProjId,
            title: targetTitle,
            niche: niche || 'Autonomous Content',
            audience: audience || 'General Audience',
            status: 'scripting' as const,
            lastUpdated: Date.now(),
            assets: {
              script: generatedScript,
              seo: {
                titles: metadataResult.titles || [idea.title],
                description: metadataResult.description || '',
                tags: metadataResult.tags || [],
                hashtags: metadataResult.hashtags || [],
                semanticClusters: metadataResult.semanticClusters || []
              },
              ideas: [idea],
              scriptHistory,
              titleHistory
            },
            team: ['AI Agent Swarm']
          };

          await addCustomProject(newProject);
          setBatchLogs(prev => [...prev, `[Database] Success! Local manifest stored under ID: ${newProjId}`]);

          incrementStat('scriptsWritten');
          incrementStat('ideasGenerated');
          logActivity(`Batch processed idea "${targetTitle}" into new Project assets`, "Batch Queue", "script");

        } catch (err) {
          setBatchLogs(prev => [...prev, `❌ AI model fail: ${err instanceof Error ? err.message : String(err)}`]);
        }
      }

      setBatchLogs(prev => [...prev, `\n🎉 All task actions mapped successfully!`]);
    } catch (e) {
      setBatchLogs(prev => [...prev, `❌ System engine failure: ${e instanceof Error ? e.message : String(e)}`]);
    } finally {
      setIsProcessingBatch(false);
      setSelectedIdeas([]);
      toast.success("Batch automated pipeline finished processing!", { duration: 5000 });
    }
  };

  const handleSubmit = async (e?: React.FormEvent, manualNiche?: string) => {
    if (e) e.preventDefault();
    const nicheToUse = manualNiche || niche;
    if (!nicheToUse.trim()) return;

    setLoading(true);
    setError(null);
    const oldIdeas = ideas;
    try {
      const results = await generateIdeas(nicheToUse, 5);
      
      // Strict Zod Validation of tool outputs for type safety
      const parsedResults = z.array(videoIdeaSchema).parse(results);
      
      const formattedResults = parsedResults.map((r) => ({
        title: r.title,
        hook: r.hook,
        score: r.viral_score || r.score || 0,
        competition: r.difficulty || r.competition || 'Medium',
        interest: typeof r.interest === 'string' ? r.interest : (r.platform === 'YouTube' ? 'Exploding' : 'Stable'),
        logic: r.logic || `SEO Keywords: ${r.seo_keywords?.join(', ') || 'N/A'}`
      }));

      setIdeas(formattedResults);
      incrementStat('ideasGenerated');
      logActivity(`Generated ${formattedResults.length} viral video ideas targeting "${nicheToUse}"`, "Idea Lab", "ideas");

      registerCommand(
        'Idea Generator',
        `Generated AI ideas targeting "${nicheToUse}"`,
        () => setIdeas(oldIdeas),
        () => setIdeas(formattedResults)
      );
    } catch (err) {
      console.error(err);
      setError("Failed to generate ideas. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const promoteToActiveProject = (idea: VideoIdea) => {
    if (activeProject) {
      updateActiveProject({ 
        title: idea.title, 
        assets: { ...activeProject.assets, ideas: [idea, ...(activeProject.assets.ideas || [])] } 
      });
      alert("Idea Promoted to Active Manifest!");
    } else {
      createProject(idea.title, niche || 'Autonomous Content', audience || 'General Audience');
      alert("New Project Manifest Created from Idea!");
    }
  };

  const toggleSaveGem = (idea: VideoIdea) => {
    const isAlreadySaved = savedGems.find(g => g.title === idea.title);
    setSavedGems(prev => {
      if (isAlreadySaved) {
        return prev.filter(g => g.title !== idea.title);
      }
      return [idea, ...prev];
    });

    registerCommand(
      'Idea Generator',
      isAlreadySaved ? `Unsaved idea gem: "${idea.title}"` : `Saved idea gem: "${idea.title}"`,
      () => {
        setSavedGems(prev => {
          if (isAlreadySaved) {
            return [idea, ...prev];
          }
          return prev.filter(g => g.title !== idea.title);
        });
      },
      () => {
        setSavedGems(prev => {
          if (isAlreadySaved) {
            return prev.filter(g => g.title !== idea.title);
          }
          return [idea, ...prev];
        });
      }
    );
  };

  const deleteGem = (titleToDelete: string) => {
    const gemToRestore = savedGems.find(g => g.title === titleToDelete);
    if (!gemToRestore) return;

    setSavedGems(prev => prev.filter(g => g.title !== titleToDelete));

    registerCommand(
      'Idea Generator',
      `Deleted idea gem: "${titleToDelete}"`,
      () => {
        setSavedGems(prev => [gemToRestore, ...prev]);
      },
      () => {
        setSavedGems(prev => prev.filter(g => g.title !== titleToDelete));
      }
    );
  };

  const handleQuickSelect = (n: string) => {
    setNiche(n);
    handleSubmit(undefined, n);
  };

  return (
    <div className="max-w-5xl mx-auto space-y-12 animate-fade-in pb-20">
      <div className="text-center space-y-4 py-8">
        <div className="inline-flex items-center justify-center p-4 rounded-[2rem] bg-red-500/10 text-red-500 mb-2 border border-red-500/20 shadow-2xl shadow-red-500/5">
           <TrendingUp size={40} strokeWidth={2.5} />
        </div>
        <h2 className="text-5xl font-black bg-gradient-to-br from-white to-zinc-600 bg-clip-text text-transparent tracking-tighter">
          Viral Idea Lab
        </h2>
        <p className="text-zinc-400 text-lg font-medium max-w-2xl mx-auto">
          Deploy Google Gemini to engineer breakout topics and promote them directly to your Active Production Manifest.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
        <div className="lg:col-span-2 space-y-8">
          <div className="space-y-6">
            <form onSubmit={handleSubmit} className="relative group space-y-4">
              <div className="absolute inset-0 bg-red-600 blur-2xl opacity-0 group-focus-within:opacity-10 transition-opacity"></div>
              <div className="relative flex flex-col md:flex-row gap-3 p-2 bg-zinc-900 border border-zinc-800 rounded-[2.5rem] shadow-2xl focus-within:border-red-500/50 transition-all">
                <div className="flex flex-1 items-center gap-3">
                  <div className="flex items-center pl-4 text-zinc-600">
                    <Search size={20} />
                  </div>
                  <input
                    type="text"
                    value={niche}
                    onChange={(e) => setNiche(e.target.value)}
                    placeholder="Enter your niche (e.g. AI Marketing)..."
                    className="flex-1 bg-transparent border-none py-4 outline-none text-white font-medium placeholder:text-zinc-700 text-sm"
                  />
                </div>
                <div className="h-full w-px bg-zinc-800 hidden md:block my-2"></div>
                <div className="flex flex-1 items-center gap-3">
                  <div className="flex items-center pl-4 text-zinc-600">
                    <Target size={20} />
                  </div>
                  <input
                    type="text"
                    value={audience}
                    onChange={(e) => setAudience(e.target.value)}
                    placeholder="Target Audience (e.g. Solo Creators)..."
                    className="flex-1 bg-transparent border-none py-4 outline-none text-white font-medium placeholder:text-zinc-700 text-sm"
                  />
                </div>
                <button
                  type="submit"
                  disabled={loading || !niche}
                  className="bg-red-600 hover:bg-red-500 disabled:opacity-50 disabled:cursor-not-allowed text-white px-10 py-3 rounded-[2rem] font-black uppercase text-xs tracking-widest transition-all shadow-lg shadow-red-600/20 flex items-center gap-2 active-press"
                >
                  {loading ? <Loader2 className="animate-spin" size={18} /> : <><Zap size={18} fill="currentColor" /> Generate</>}
                </button>
              </div>
            </form>

            <div className="flex flex-wrap items-center justify-center gap-2 px-4">
               <span className="text-[10px] font-black text-zinc-600 uppercase tracking-widest mr-2">Featured:</span>
               {SUGGESTED_NICHES.map(n => (
                 <button
                   key={n}
                   onClick={() => handleQuickSelect(n)}
                   className="px-4 py-1.5 rounded-full text-xs font-bold bg-zinc-900 border border-zinc-800 text-zinc-500 hover:text-red-500 hover:border-red-500/30 transition-all"
                 >
                   {n}
                 </button>
               ))}
            </div>
          </div>

          {ideas.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-scale-in">
                 {ideas.map((idea, index) => (
                   <div key={index} className="relative group/card">
                      <IdeaCard 
                        idea={idea} 
                        onAction={onNavigate} 
                        onToggleSave={toggleSaveGem}
                        isSaved={!!savedGems.find(g => g.title === idea.title)}
                        isSelected={!!selectedIdeas.find(s => s.title === idea.title)}
                        onToggleSelect={() => handleToggleSelectIdea(idea)}
                      />
                      <button 
                        onClick={() => promoteToActiveProject(idea)}
                        className="absolute -top-2 -right-2 p-3 bg-blue-600 text-white rounded-full shadow-xl opacity-0 group-hover/card:opacity-100 transition-all active-press z-20"
                        title="Promote to Active Manifest"
                      >
                         <Rocket size={16} />
                      </button>
                   </div>
                 ))}
            </div>
          )}
        </div>

        <div className="space-y-6">
           <div className="bg-gradient-to-br from-zinc-900 to-black border border-zinc-800 rounded-[2.5rem] p-8 shadow-2xl flex flex-col h-[600px] overflow-hidden">
              {/* Tab Header */}
              <div className="flex border-b border-zinc-800/60 pb-4 mb-6 shrink-0 gap-2">
                <button
                  type="button"
                  onClick={() => setSidebarTab('gems')}
                  className={`flex-1 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all cursor-pointer ${
                    sidebarTab === 'gems'
                      ? 'bg-zinc-850 text-white border border-zinc-800 shadow-lg'
                      : 'bg-transparent text-zinc-500 hover:text-zinc-350'
                  }`}
                >
                  Saved Gems ({savedGems.length})
                </button>
                <button
                  type="button"
                  onClick={() => setSidebarTab('batch_queue')}
                  className={`flex-1 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all relative border cursor-pointer ${
                    sidebarTab === 'batch_queue'
                      ? 'bg-red-600/10 text-red-500 border-red-500/20 shadow-lg shadow-red-500/5'
                      : 'bg-transparent text-zinc-500 hover:text-zinc-350 border-transparent'
                  }`}
                >
                  Batch Queue ({selectedIdeas.length})
                  {selectedIdeas.length > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                  )}
                </button>
              </div>

              {/* Tab Content Wrapper */}
              <div className="flex-1 overflow-hidden flex flex-col">
                {sidebarTab === 'gems' ? (
                  <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar space-y-3">
                    {savedGems.length === 0 ? (
                      <div className="h-full flex flex-col items-center justify-center text-center p-6 text-zinc-500 space-y-2 mt-12">
                        <Bookmark size={28} strokeWidth={1.5} />
                        <p className="text-xs font-bold uppercase tracking-wider">No Saved Gems</p>
                        <p className="text-[10px] font-medium max-w-[180px]">Save high ranking ideas above to collect them here.</p>
                      </div>
                    ) : (
                      savedGems.map((gem, i) => {
                        const isQueued = !!selectedIdeas.find(s => s.title === gem.title);
                        return (
                          <div key={i} className="bg-zinc-950 border border-zinc-800 rounded-2xl p-4 group animate-scale-in flex flex-col gap-3">
                              <p className="text-xs font-bold text-white leading-snug">{gem.title}</p>
                              <div className="flex justify-between items-center bg-zinc-900/60 p-2 rounded-xl border border-zinc-800/40">
                                <button 
                                  onClick={() => promoteToActiveProject(gem)}
                                  className="text-[9px] font-black uppercase text-blue-500 hover:text-blue-400 flex items-center gap-1.5 cursor-pointer"
                                >
                                   <Rocket size={11} /> Promote
                                </button>
                                
                                <div className="flex items-center gap-2">
                                  <button
                                    onClick={() => handleToggleSelectIdea(gem)}
                                    className={`px-2.5 py-1 rounded-lg text-[8px] font-black uppercase tracking-wider border cursor-pointer ${
                                      isQueued
                                        ? 'bg-red-600/20 border-red-500/30 text-red-400'
                                        : 'bg-zinc-950 border-zinc-800 text-zinc-500 hover:text-zinc-300'
                                    }`}
                                  >
                                    {isQueued ? 'Queued' : '+ Queue'}
                                  </button>
                                  <button 
                                    onClick={() => deleteGem(gem.title)} 
                                    className="p-1 hover:bg-red-600/10 text-zinc-600 hover:text-red-500 rounded transition-all cursor-pointer"
                                    title="Delete Gem"
                                  >
                                    <Trash2 size={13} />
                                  </button>
                                </div>
                              </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                ) : (
                  <div className="flex-1 overflow-hidden flex flex-col">
                    {isProcessingBatch ? (
                      <div className="flex-1 flex flex-col items-center justify-center p-4 space-y-6">
                        <div className="relative flex items-center justify-center">
                          <Loader2 className="animate-spin text-red-500" size={54} strokeWidth={2.5} />
                          <span className="absolute text-[10px] font-black text-white">
                            {Math.round((batchProgress.current / batchProgress.total) * 100)}%
                          </span>
                        </div>
                        <div className="text-center space-y-2">
                          <h4 className="text-xs font-black text-white uppercase tracking-wider">Compiling Batch Pipeline</h4>
                          <p className="text-[10px] font-medium text-zinc-400 animate-pulse">{batchStep}</p>
                        </div>

                        {/* Scrolling Log Terminal */}
                        <div className="w-full flex-1 bg-zinc-940 rounded-2xl border border-zinc-850 p-4 font-mono text-[9px] text-[#22c55e] h-[180px] overflow-y-auto custom-scrollbar flex flex-col gap-1.5 text-left select-none">
                          {batchLogs.map((log, idx) => (
                            <div key={idx} className="leading-tight whitespace-pre-wrap">{log}</div>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <div className="flex-1 flex flex-col h-full overflow-hidden text-left">
                        {selectedIdeas.length === 0 ? (
                          <div className="flex-1 flex flex-col items-center justify-center text-center p-6 text-zinc-600 space-y-2 mt-12">
                            <Zap size={28} strokeWidth={1.5} />
                            <p className="text-xs font-bold uppercase tracking-wider">Queue is Empty</p>
                            <p className="text-[10px] font-medium max-w-[180px]">Select "Queue" on idea cards or Saved Gems to batch compile scripts.</p>
                          </div>
                        ) : (
                          <div className="flex-1 flex flex-col h-full justify-between">
                            {/* Scrollable Queued list */}
                            <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar space-y-2.5 max-h-[220px]">
                              {selectedIdeas.map((idea, i) => (
                                <div key={i} className="bg-zinc-950 border border-zinc-850 rounded-xl p-3.5 flex items-center justify-between gap-4">
                                  <div className="min-w-0 flex-1">
                                    <p className="text-xs font-bold text-white truncate">{idea.title}</p>
                                    <p className="text-[8px] font-bold text-zinc-600 uppercase mt-0.5">SCORE: {idea.score}/10</p>
                                  </div>
                                  <button
                                    onClick={() => handleToggleSelectIdea(idea)}
                                    className="p-1.5 hover:bg-red-600/10 text-zinc-600 hover:text-red-500 rounded-lg cursor-pointer"
                                    title="Remove from Queue"
                                  >
                                    <Trash2 size={13} />
                                  </button>
                                </div>
                              ))}
                            </div>

                            {/* Batch Options & Trigger */}
                            <div className="border-t border-zinc-800/60 pt-4 mt-4 space-y-4 shrink-0 bg-gradient-to-t from-black to-transparent p-1">
                              <div className="grid grid-cols-2 gap-3 col-span-2">
                                <div>
                                  <label className="text-[8px] font-black text-zinc-500 uppercase tracking-widest block mb-1.5 ml-1">Script Voice Tone</label>
                                  <select
                                    value={batchTone}
                                    onChange={(e) => setBatchTone(e.target.value)}
                                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-[10px] font-bold text-zinc-300 outline-none cursor-pointer focus:ring-1 focus:ring-red-500/50"
                                  >
                                    <option value="Fast-paced & Hype">Fast-paced Hype</option>
                                    <option value="Informative & Calm">Informative & Calm</option>
                                    <option value="Sarcastic & Witty">Sarcastic & Witty</option>
                                    <option value="Corporate Professional">Professional</option>
                                  </select>
                                </div>
                                <div>
                                  <label className="text-[8px] font-black text-zinc-500 uppercase tracking-widest block mb-1.5 ml-1">Metadata Goal</label>
                                  <select
                                    value={batchGoal}
                                    onChange={(e) => setBatchGoal(e.target.value)}
                                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-[10px] font-bold text-zinc-300 outline-none cursor-pointer focus:ring-1 focus:ring-red-500/50"
                                  >
                                    <option value="ctr">Maximize CTR</option>
                                    <option value="search">Search Dominance</option>
                                    <option value="engagement">Community Buzz</option>
                                  </select>
                                </div>
                              </div>

                               <div className="grid grid-cols-2 gap-2.5">
                                <button
                                  type="button"
                                  onClick={startBatchProcess}
                                  className="bg-red-600 hover:bg-red-500 text-white py-3.5 px-3 rounded-[1.5rem] text-[9.5px] font-black tracking-widest uppercase shadow-lg shadow-red-610/10 flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                                  title="Compile all selected ideas with Gemini AI"
                                >
                                  <Zap size={12} fill="currentColor" /> Compile ({selectedIdeas.length})
                                </button>
                                
                                <button
                                  type="button"
                                  onClick={handleExportSelectedZIP}
                                  className="bg-zinc-950 hover:bg-zinc-800 border border-zinc-800 text-zinc-300 py-3.5 px-3 rounded-[1.5rem] text-[9.5px] font-black tracking-widest uppercase flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                                  title="Package all selected project assets to ZIP archive"
                                >
                                  <Download size={12} /> Export ZIP
                                </button>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
           </div>
        </div>
      </div>
    </div>
  );
};
