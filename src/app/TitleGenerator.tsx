
import React, { useState, useEffect, useMemo } from 'react';
import { generateViralTitles } from '@/infrastructure/gemini';
import { TitlePrediction } from '@/shared/types';
import { useProject } from '@/app/ProjectContext';
import { toast } from 'react-hot-toast';
import { 
  Loader2, 
  Sparkles, 
  Copy, 
  Check, 
  Zap, 
  Target, 
  AlertTriangle, 
  Lightbulb,
  MousePointer2,
  TrendingUp,
  BrainCircuit,
  MessageSquare,
  Play,
  Monitor,
  Smartphone,
  Layout,
  Eye,
  ArrowRight,
  ChevronRight,
  Award,
  Flame,
  ShieldAlert,
  Wind,
  Layers,
  ArrowUpRight
} from 'lucide-react';

const PSYCH_TRIGGERS = [
  { id: 'Curiosity', label: 'Curiosity Gap', desc: 'The "need to know" effect.' },
  { id: 'Urgency', label: 'Urgency', desc: 'FOMO or time-sensitive hooks.' },
  { id: 'Negative', label: 'Negative Bias', desc: 'Common mistakes or warnings.' },
  { id: 'Listicle', label: 'Listicle', desc: 'Numbered, digestible logic.' },
  { id: 'How-To', label: 'Utility', desc: 'Direct solution value.' },
  { id: 'Authority', label: 'Authority', desc: 'Expert data or credentials.' },
  { id: 'Social Proof', label: 'Social Proof', desc: 'What elites are doing.' }
];

export const TitleGenerator: React.FC = () => {
  const { activeProject, updateActiveProject, addTitleVersion } = useProject();
  const [context, setContext] = useState('');
  const [competitorTitle, setCompetitorTitle] = useState('');
  const [selectedTriggers, setSelectedTriggers] = useState<string[]>(['Curiosity', 'Authority']);
  const [titles, setTitles] = useState<TitlePrediction[]>([]);
  const [loading, setLoading] = useState(false);
  const [copiedIdx, setCopiedIdx] = useState<number | null>(null);
  const [previewTitle, setPreviewTitle] = useState<string>('');
  const [previewMode, setPreviewMode] = useState<'desktop' | 'mobile'>('mobile');
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle');

  // Load draft on project load
  useEffect(() => {
    if (activeProject) {
      const draft = activeProject.assets?.titleDraft;
      if (draft) {
        if (draft.context) setContext(draft.context);
        if (draft.competitorTitle) setCompetitorTitle(draft.competitorTitle);
        if (draft.selectedTriggers) setSelectedTriggers(draft.selectedTriggers);
      }
    }
  }, [activeProject?.id]);

  // Auto-save draft logic
  useEffect(() => {
    if (!activeProject) return;

    const currentDraft = activeProject.assets?.titleDraft || {};
    if (
      context === (currentDraft.context || '') &&
      competitorTitle === (currentDraft.competitorTitle || '') &&
      JSON.stringify(selectedTriggers) === JSON.stringify(currentDraft.selectedTriggers || ['Curiosity', 'Authority'])
    ) {
      return;
    }

    setSaveStatus('saving');
    const timer = setTimeout(async () => {
      try {
        await updateActiveProject({
          assets: {
            ...activeProject.assets,
            titleDraft: {
              context,
              competitorTitle,
              selectedTriggers
            }
          }
        });
        setSaveStatus('saved');
        setTimeout(() => setSaveStatus('idle'), 1500);
      } catch (err) {
        console.error('[Title Draft Auto-Save Fail]', err);
        setSaveStatus('idle');
      }
    }, 3000); // 3 seconds timeout

    return () => clearTimeout(timer);
  }, [context, competitorTitle, selectedTriggers, activeProject]);

  const handleGenerate = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!context.trim()) return;
    setLoading(true);
    setTitles([]);
    try {
      const results = await generateViralTitles(context, selectedTriggers, competitorTitle);
      setTitles(results);
      if (results.length > 0) setPreviewTitle(results[0].title);
    } catch (e) {
      console.error(e);
      alert("Title engineering failed.");
    } finally {
      setLoading(false);
    }
  };

  const toggleTrigger = (id: string) => {
    setSelectedTriggers(prev => 
      prev.includes(id) ? prev.filter(t => t !== id) : [...prev, id]
    );
  };

  const copyToClipboard = (text: string, idx: number) => {
    navigator.clipboard.writeText(text);
    setCopiedIdx(idx);
    setTimeout(() => setCopiedIdx(null), 2000);
  };

  const getLinguisticVelocity = (title: string) => {
    const len = title.length;
    const words = title.split(' ').length;
    const velocity = Math.min(100, Math.round((words / (len / 5)) * 80));
    return {
      score: velocity,
      label: velocity > 85 ? 'Sprinting' : velocity > 65 ? 'Jogging' : 'Walking'
    };
  };

  const getTriggerColor = (type: string) => {
    switch (type) {
      case 'Curiosity': return 'bg-purple-500/10 text-purple-400 border-purple-500/20';
      case 'Urgency': return 'bg-red-500/10 text-red-400 border-red-500/20';
      case 'Negative': return 'bg-orange-500/10 text-orange-400 border-orange-500/20';
      case 'Listicle': return 'bg-blue-500/10 text-blue-400 border-blue-500/20';
      case 'How-To': return 'bg-green-500/10 text-green-400 border-green-500/20';
      case 'Authority': return 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20';
      case 'Social Proof': return 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20';
      default: return 'bg-zinc-800 text-zinc-400';
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-12 animate-fade-in pb-20">
      <div className="text-center space-y-4 py-8">
        <div className="inline-flex items-center justify-center p-4 rounded-[2rem] bg-red-600/10 text-red-500 mb-2 border border-red-500/20 shadow-2xl">
           <MousePointer2 size={40} strokeWidth={2.5} />
        </div>
        <h2 className="text-5xl font-black bg-gradient-to-br from-white to-zinc-600 bg-clip-text text-transparent tracking-tighter">
          CTR Title Lab
        </h2>
        <p className="text-zinc-400 text-lg font-medium max-w-2xl mx-auto">
          Engineer viral high-performance titles by stacking psychological triggers and simulating algorithmic response.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Configuration Panel - 4 cols */}
        <div className="lg:col-span-4 space-y-6">
           <form onSubmit={handleGenerate} className="bg-zinc-900 border border-zinc-800 p-8 rounded-[2.5rem] shadow-2xl space-y-8 relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity">
                 <BrainCircuit size={100} />
              </div>

              <div className="space-y-6 relative z-10">
                 <div>
                    <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest block mb-3 ml-1 flex items-center gap-2">
                       <Layout size={12} /> Video Context / Topic
                     </label>
                     {activeProject && (
                        <div className="mb-2">
                          <span className="text-[8px] font-mono tracking-wider uppercase text-zinc-500 bg-zinc-950 border border-zinc-900 rounded px-1.5 py-0.5 inline-flex items-center gap-1.5 select-none">
                            {saveStatus === 'saving' && <span className="w-1 h-1 rounded-full bg-amber-500 animate-pulse" />}
                            {saveStatus === 'saved' && <span className="w-1 h-1 rounded-full bg-emerald-500" />}
                            {saveStatus === 'saving' && 'Saving...'}
                            {saveStatus === 'saved' && 'Saved'}
                            {saveStatus === 'idle' && 'Synced'}
                          </span>
                        </div>
                     )}
                     <label className="hidden">
                    </label>
                    <textarea
                      value={context}
                      onChange={(e) => setContext(e.target.value)}
                      placeholder="Describe your video (e.g. Scaling a marketing agency)..."
                      className="w-full h-32 bg-zinc-950 border border-zinc-800 rounded-2xl p-5 focus:ring-2 focus:ring-red-500/50 outline-none transition-all resize-none text-white text-sm leading-relaxed"
                    />
                 </div>

                 <div className="p-5 bg-zinc-950/50 border border-zinc-800 rounded-2xl space-y-3">
                    <label className="text-[10px] font-black text-zinc-600 uppercase tracking-widest block ml-1 flex items-center gap-2">
                       <ArrowUpRight size={12} className="text-blue-500" /> Out-Click Competitor (Optional)
                    </label>
                    <input 
                      value={competitorTitle}
                      onChange={e => setCompetitorTitle(e.target.value)}
                      className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-3 text-xs text-zinc-400 focus:border-blue-500 outline-none"
                      placeholder="Paste a successful title to outperform..."
                    />
                 </div>

                 <div className="space-y-4">
                    <div className="flex items-center justify-between px-1">
                       <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Trigger Stacking</label>
                       <span className="text-[9px] font-bold text-zinc-700 uppercase">{selectedTriggers.length} Active</span>
                    </div>
                    <div className="grid grid-cols-1 gap-2">
                       {PSYCH_TRIGGERS.map(t => (
                         <button
                           key={t.id}
                           type="button"
                           onClick={() => toggleTrigger(t.id)}
                           className={`text-left p-3 rounded-xl border transition-all relative overflow-hidden group ${
                             selectedTriggers.includes(t.id) 
                               ? 'bg-red-500/10 border-red-500 text-white' 
                               : 'bg-zinc-950 border border-zinc-800 text-zinc-500 hover:border-zinc-700'
                           }`}
                         >
                            <div className="relative z-10">
                               <p className="text-xs font-black uppercase tracking-widest">{t.label}</p>
                               <p className="text-[9px] opacity-60 font-medium mt-1">{t.desc}</p>
                            </div>
                            {selectedTriggers.includes(t.id) && <div className="absolute top-2 right-2"><Check size={12} className="text-red-500" /></div>}
                         </button>
                       ))}
                    </div>
                 </div>

                 <button
                   type="submit"
                   disabled={loading || !context}
                   className="w-full bg-red-600 hover:bg-red-500 disabled:opacity-50 text-white py-5 rounded-[1.5rem] font-black uppercase text-xs tracking-[0.2em] transition-all shadow-xl shadow-red-600/20 flex items-center justify-center gap-3 active-press"
                 >
                   {loading ? <Loader2 className="animate-spin" size={20} /> : <><Sparkles size={18} /> Engineer Variations</>}
                 </button>
              </div>
           </form>

           <div className="p-8 bg-zinc-900 border border-zinc-800 rounded-[2.5rem] flex items-start gap-5 shadow-xl">
              <div className="p-3 bg-blue-500/10 rounded-2xl text-blue-400">
                 <BrainCircuit size={24} />
              </div>
              <div>
                 <h4 className="text-[10px] font-black text-white uppercase tracking-widest mb-1">Architecture Tip</h4>
                 <p className="text-[11px] text-zinc-500 leading-relaxed font-medium">
                   "Mobile titles truncate at ~50 chars. Ensure your primary psychological anchor is in the first 35 characters."
                 </p>
              </div>
           </div>
        </div>

        {/* Results Lab - 8 cols */}
        <div className="lg:col-span-8 space-y-8">
           {/* Preview Mockup Switcher */}
           <div className="bg-zinc-900 border border-zinc-800 p-8 rounded-[3rem] shadow-2xl relative">
              <div className="flex items-center justify-between mb-8 px-4">
                 <h3 className="text-sm font-black uppercase tracking-widest text-zinc-500 flex items-center gap-2">
                    <Eye size={16} /> Impression Simulator
                 </h3>
                 <div className="flex bg-zinc-950 border border-zinc-800 rounded-xl p-1">
                    <button onClick={() => setPreviewMode('mobile')} className={`p-2 rounded-lg transition-all ${previewMode === 'mobile' ? 'bg-zinc-800 text-white' : 'text-zinc-600'}`}><Smartphone size={16}/></button>
                    <button onClick={() => setPreviewMode('desktop')} className={`p-2 rounded-lg transition-all ${previewMode === 'desktop' ? 'bg-zinc-800 text-white' : 'text-zinc-600'}`}><Monitor size={16}/></button>
                 </div>
              </div>

              <div className="flex justify-center items-center py-10 min-h-[300px]">
                 {previewMode === 'mobile' ? (
                   <div className="w-[300px] bg-black rounded-[3rem] border-[8px] border-zinc-800 overflow-hidden shadow-2xl animate-scale-in">
                      <div className="aspect-video bg-zinc-800 flex items-center justify-center relative">
                         <Play size={40} className="text-zinc-700" />
                         <div className="absolute bottom-2 right-2 bg-black/80 px-1.5 py-0.5 rounded text-[10px] font-bold">08:14</div>
                      </div>
                      <div className="p-4 space-y-3">
                         <h4 className="text-[15px] font-bold text-white leading-tight break-words">
                            {previewTitle || "Engineering Required..."}
                         </h4>
                         <div className="flex gap-3">
                            <div className="w-9 h-9 rounded-full bg-zinc-700 shrink-0"></div>
                            <div className="space-y-0.5">
                               <div className="text-[13px] text-zinc-300 font-medium">Ranktica AI Studio</div>
                               <div className="text-[11px] text-zinc-500">124K views • 2 hours ago</div>
                            </div>
                         </div>
                      </div>
                   </div>
                 ) : (
                   <div className="w-full max-w-2xl bg-black rounded-3xl border-4 border-zinc-800 overflow-hidden shadow-2xl animate-scale-in">
                      <div className="flex">
                         <div className="w-3/5 aspect-video bg-zinc-800 flex items-center justify-center relative">
                            <Play size={64} className="text-zinc-700" />
                            <div className="absolute bottom-4 right-4 bg-black/80 px-2 py-1 rounded text-xs font-bold">12:42</div>
                         </div>
                         <div className="w-2/5 p-6 space-y-4">
                            <h4 className="text-lg font-bold text-white leading-snug line-clamp-3">
                               {previewTitle || "Synthesis Dormant..."}
                            </h4>
                            <div className="flex items-center gap-3">
                               <div className="w-10 h-10 rounded-full bg-zinc-700 shrink-0"></div>
                               <div>
                                  <div className="text-sm font-bold text-zinc-200">Ranktica AI</div>
                                  <div className="text-[11px] text-zinc-500">2.4M views • 1 year ago</div>
                               </div>
                            </div>
                         </div>
                      </div>
                   </div>
                 )}
              </div>
           </div>

           {/* Results Feed */}
           <div className="bg-zinc-950 border border-zinc-900 rounded-[3rem] overflow-hidden flex flex-col shadow-inner relative min-h-[500px]">
              {!titles.length && !loading ? (
                <div className="flex-1 flex flex-col items-center justify-center text-zinc-800 gap-10 opacity-40 animate-pulse">
                   <div className="w-48 h-48 rounded-[4rem] border-4 border-dashed border-zinc-900 flex items-center justify-center">
                      <Wind size={80} strokeWidth={1} />
                   </div>
                   <div className="text-center space-y-2">
                      <p className="font-black uppercase text-2xl tracking-[0.5em]">Synthesis Stage Ready</p>
                      <p className="text-sm font-bold tracking-widest uppercase opacity-60">Initialize viral parameters to synthesize variations</p>
                   </div>
                </div>
              ) : loading ? (
                <div className="flex-1 flex flex-col items-center justify-center gap-12 text-red-500">
                   <div className="relative">
                      <Loader2 className="animate-spin w-24 h-24" strokeWidth={1} />
                      <div className="absolute inset-0 bg-red-500 blur-[80px] opacity-10 animate-pulse"></div>
                   </div>
                   <div className="text-center space-y-4">
                      <p className="text-3xl font-black text-white tracking-tighter uppercase animate-pulse">Simulating Viral Response</p>
                      <div className="flex items-center justify-center gap-4 text-xs font-black text-zinc-600 uppercase tracking-widest">
                         <span className="flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-red-600 animate-ping"></div> LINGUISTICS</span>
                         <span className="flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-red-600 animate-ping delay-100"></div> PSYCHOLOGY</span>
                         <span className="flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-red-600 animate-ping delay-200"></div> CTR MAPS</span>
                      </div>
                   </div>
                </div>
              ) : (
                <div className="flex-1 flex flex-col animate-fade-in">
                   <div className="p-8 border-b border-zinc-900 flex items-center justify-between bg-zinc-900/50 backdrop-blur-md sticky top-0 z-10">
                      <div className="flex items-center gap-3">
                         <Zap size={20} className="text-yellow-500" />
                         <h3 className="text-sm font-black uppercase tracking-widest text-zinc-400">Viral Manifest</h3>
                      </div>
                      <div className="flex items-center gap-4">
                         <div className="text-right hidden md:block">
                            <span className="text-[10px] font-black text-zinc-600 uppercase block">Engine Integrity</span>
                            <span className="text-xs font-black text-green-500 uppercase tracking-widest">A+ Optimal</span>
                         </div>
                         <div className="w-px h-8 bg-zinc-800"></div>
                         <span className="text-[10px] font-black text-zinc-500 bg-zinc-900 px-3 py-1.5 rounded-xl border border-zinc-800 uppercase">{titles.length} Engineered</span>
                      </div>
                   </div>
                   
                   <div className="p-8 grid grid-cols-1 gap-6">
                      {titles.map((item, idx) => {
                        const velocity = getLinguisticVelocity(item.title);
                        return (
                          <div 
                            key={idx} 
                            onClick={() => setPreviewTitle(item.title)}
                            className={`group bg-zinc-900 border ${previewTitle === item.title ? 'border-red-500 ring-4 ring-red-500/5' : 'border-zinc-800'} hover:border-zinc-700 rounded-[2.5rem] p-8 transition-all relative overflow-hidden cursor-pointer shadow-xl`}
                          >
                             <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-center relative z-10">
                                <div className="md:col-span-8 space-y-4">
                                   <div className="flex flex-wrap items-center gap-3">
                                      <span className={`px-2.5 py-1 rounded-lg text-[9px] font-black uppercase border tracking-widest ${getTriggerColor(item.type)}`}>
                                        {item.type}
                                      </span>
                                      <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-lg bg-zinc-950 border border-zinc-800 text-[8px] font-black uppercase text-zinc-600 tracking-tighter">
                                         <Wind size={10} /> Velocity: {velocity.label}
                                      </div>
                                      <div className={`flex items-center gap-1.5 px-2 py-0.5 rounded-lg bg-zinc-950 border border-zinc-800 text-[8px] font-black uppercase tracking-tighter ${item.title.length > 50 ? 'text-orange-500' : 'text-green-500'}`}>
                                         {item.title.length} Chars
                                      </div>
                                   </div>
                                   <h4 className="text-xl font-extrabold text-white leading-tight group-hover:text-red-500 transition-colors duration-300">
                                      {item.title}
                                   </h4>
                                   <p className="text-[10px] text-zinc-500 leading-relaxed font-medium italic border-l-2 border-zinc-800 pl-4 py-1">
                                      "{item.logic}"
                                   </p>
                                </div>
                                
                                <div className="md:col-span-4 flex items-center justify-end gap-6">
                                   <div className="text-right">
                                      <div className="flex items-end justify-end gap-1">
                                         <span className={`text-4xl font-black tracking-tighter ${item.predictedCtr >= 12 ? 'text-green-500' : item.predictedCtr >= 8 ? 'text-yellow-500' : 'text-zinc-500'}`}>
                                           {item.predictedCtr.toFixed(1)}%
                                         </span>
                                      </div>
                                      <span className="block text-[9px] font-black text-zinc-600 uppercase tracking-widest mt-1">Predicted CTR</span>
                                   </div>
                                   <button 
                                     onClick={(e) => { e.stopPropagation(); copyToClipboard(item.title, idx); }}
                                     className={`p-4 rounded-2xl transition-all active-press ${copiedIdx === idx ? 'bg-green-600 text-white shadow-xl shadow-green-600/20' : 'bg-zinc-950 text-zinc-600 hover:text-white hover:bg-zinc-800 border border-zinc-800'}`}
                                   >
                                      {copiedIdx === idx ? <Check size={20} /> : <Copy size={20} />}
                                   </button>
                                </div>
                             </div>

                             {/* Bottom Progress Velocity Bar */}
                             <div className="absolute bottom-0 left-0 right-0 h-1.5 bg-zinc-950">
                                <div 
                                   className={`h-full transition-all duration-1000 delay-300 ${item.predictedCtr >= 12 ? 'bg-green-500' : item.predictedCtr >= 8 ? 'bg-yellow-500' : 'bg-zinc-700'}`}
                                   style={{ width: `${Math.min(item.predictedCtr * 5, 100)}%` }}
                                />
                             </div>
                          </div>
                        );
                      })}
                   </div>

                   <div className="p-10 bg-zinc-900/50 border-t border-zinc-900 mt-auto flex flex-col md:flex-row items-center justify-between gap-6">
                      <div className="flex items-center gap-4">
                         <div className="p-3 bg-red-600/10 rounded-2xl text-red-500"><Award size={24}/></div>
                         <div>
                            <h4 className="text-xs font-black text-white uppercase tracking-widest">Neural Calibration Active</h4>
                            <p className="text-[10px] text-zinc-500 font-medium mt-1">Simulated against 2025 YouTube Retentional Datasets</p>
                         </div>
                      </div>
                      <button className="flex items-center gap-2 px-8 py-3 bg-white hover:bg-zinc-200 text-black rounded-2xl font-black uppercase text-[10px] tracking-[0.2em] transition-all active-press shadow-2xl">
                         Save Manifest to Library <ArrowRight size={14}/>
                      </button>
                   </div>
                </div>
              )}
           </div>

           <div className="bg-orange-900/10 border border-orange-500/20 p-8 rounded-[2.5rem] flex items-start gap-5">
              <ShieldAlert size={28} className="text-orange-500 shrink-0 mt-1" />
              <div>
                 <h4 className="text-sm font-black text-orange-500 uppercase tracking-widest mb-1">Algorithmic Warning</h4>
                 <p className="text-sm text-zinc-400 leading-relaxed font-medium">
                   "Avoid high CTR titles if your video content doesn't deliver on the promise in the first 30 seconds. This leads to a 'Bait and Switch' drop in retention, causing the algorithm to bury your content."
                 </p>
              </div>
           </div>
        </div>
      </div>
    </div>
  );
};
