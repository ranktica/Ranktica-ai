
import React, { useState } from 'react';
import { usePersistedFormState } from '@/shared/usePersistedFormState';
import { engineerMetadata } from '@/infrastructure/gemini';
import { MetadataEngineeringResult, ToolType } from '@/shared/types';
import { useProject } from './ProjectContext';
import { toast } from 'react-hot-toast';
import { 
  Loader2, 
  Zap, 
  Copy, 
  Check, 
  ArrowRight, 
  FileText, 
  Target, 
  Brain, 
  Flame, 
  Layers, 
  Sparkles, 
  AlertCircle,
  Hash,
  ChevronRight,
  Monitor,
  TrendingUp,
  History,
  CheckCircle2,
  Undo2,
  Rocket
} from 'lucide-react';

const GOALS = [
  { id: 'ctr', label: 'Maximize CTR', desc: 'Focus on hooky titles and intense curiosity.' },
  { id: 'search', label: 'Search Dominance', desc: 'Focus on high-volume keywords and SEO clusters.' },
  { id: 'engagement', label: 'Community Focus', desc: 'Focus on relatability and comment triggers.' }
];

export const MetadataEngineer: React.FC<any> = ({ onNavigate }) => {
  const { activeProject, updateActiveProject } = useProject();
  const [input, setInput] = usePersistedFormState('ranktica_metadata_input_v2', {
    topic: '',
    title: '',
    description: '',
    tags: ''
  });
  const [goal, setGoal] = useState('ctr');
  const [result, setResult] = useState<MetadataEngineeringResult | null>(() => {
    return activeProject?.assets?.metadata_result || null;
  });
  const [loading, setLoading] = useState(false);
  const [copiedSection, setCopiedSection] = useState<string | null>(null);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle');

  const lastLoadedProjectId = React.useRef<string | null>(null);

  // Load project context metadata when the selected active project shifts
  React.useEffect(() => {
    if (activeProject && activeProject.id !== lastLoadedProjectId.current) {
      lastLoadedProjectId.current = activeProject.id;
      setInput({
        topic: activeProject.assets?.metadata_topic || '',
        title: activeProject.title || '',
        description: activeProject.assets?.metadata_description || '',
        tags: activeProject.assets?.tags?.join(', ') || ''
      });
      if (activeProject.assets?.metadata_result) {
        setResult(activeProject.assets.metadata_result);
      } else {
        setResult(null);
      }
    }
  }, [activeProject]);

  // Debounced auto-saving effect
  React.useEffect(() => {
    if (!activeProject) return;

    const currentTopic = activeProject.assets?.metadata_topic || '';
    const currentTitle = activeProject.title || '';
    const currentDesc = activeProject.assets?.metadata_description || '';
    
    if (input.topic === currentTopic && input.title === currentTitle && input.description === currentDesc) {
      return;
    }

    const timer = setTimeout(async () => {
      setSaveStatus('saving');
      const toastId = toast.loading('Auto-saving metadata...', { id: 'meta-autosave' });
      try {
        await updateActiveProject({
          title: input.title,
          assets: {
            ...activeProject.assets,
            metadata_topic: input.topic,
            metadata_description: input.description,
            metadata_result: result || undefined
          }
        });
        setSaveStatus('saved');
        toast.success('Metadata auto-saved!', { id: 'meta-autosave' });
        setTimeout(() => setSaveStatus('idle'), 2000);
      } catch (err) {
        console.error(err);
        toast.error('Auto-save failed!', { id: 'meta-autosave' });
        setSaveStatus('idle');
      }
    }, 3000);

    return () => clearTimeout(timer);
  }, [input, result, activeProject]);

  const handleEngineer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.topic && !input.title) return;
    setLoading(true);
    try {
      const data = await engineerMetadata(input, goal);
      setResult(data);
    } catch (e) {
      console.error(e);
      alert("Engineering process failed. Check API key status.");
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedSection(id);
    setTimeout(() => setCopiedSection(null), 2000);
  };

  const teleportToScript = () => {
    if (!result || !onNavigate) return;
    onNavigate(ToolType.SCRIPT, { 
      title: result.titles[0], 
      instructions: `GOAL: ${goal.toUpperCase()}\n\nPRIMARY DESCRIPTION CONTEXT:\n${result.description}\n\nSEMANTIC ANCHORS: ${result.semanticClusters.join(', ')}` 
    });
  };

  return (
    <div className="max-w-7xl mx-auto space-y-12 animate-fade-in pb-20">
      <header className="text-center space-y-4 py-8">
        <div className="inline-flex items-center justify-center p-4 rounded-[2rem] bg-red-600/10 text-red-500 mb-2 border border-red-500/20 shadow-2xl">
           <Layers size={40} strokeWidth={2.5} />
        </div>
        <h2 className="text-5xl font-black bg-gradient-to-br from-white to-zinc-600 bg-clip-text text-transparent tracking-tighter flex items-center justify-center gap-4">
          Metadata Architect
          {saveStatus === 'saving' && (
             <span className="text-xs bg-blue-500/10 border border-blue-500/20 rounded-full px-3 py-1 text-blue-400 font-bold uppercase inline-flex items-center gap-1.5 font-sans animate-pulse">
               <span className="w-1 h-3 flex items-center justify-center">
                 <span className="animate-ping absolute inline-flex h-1.5 w-1.5 rounded-full bg-blue-400 opacity-75"></span>
                 <span className="relative inline-flex rounded-full h-1 w-1 bg-blue-500"></span>
               </span>
               Auto-saving...
             </span>
          )}
          {saveStatus === 'saved' && (
             <span className="text-xs bg-emerald-500/15 border border-emerald-500/20 rounded-full px-3 py-1 text-emerald-400 font-bold uppercase inline-flex items-center gap-1.5 font-sans">
               <span className="w-1 h-1 rounded-full bg-emerald-400 inline-block animate-pulse" />
               Saved
             </span>
          )}
        </h2>
        <p className="text-zinc-400 text-lg font-medium max-w-2xl mx-auto">
          Engineer high-fidelity metadata manifests using neural context mapping to dominate both search and recommendations.
        </p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Input Laboratory - 5 cols */}
        <div className="lg:col-span-5 space-y-6">
           <form onSubmit={handleEngineer} className="bg-zinc-900 border border-zinc-800 rounded-[2.5rem] p-8 shadow-2xl space-y-8 relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity">
                 <Brain size={100} />
              </div>
              
              <div className="space-y-6 relative z-10">
                 <div>
                    <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest block mb-3 ml-1">Core Subject / Niche</label>
                    <input 
                       value={input.topic} 
                       onChange={e => setInput({...input, topic: e.target.value})}
                       className="w-full bg-zinc-950 border border-zinc-800 rounded-2xl p-4 text-white focus:ring-2 focus:ring-red-500/50 outline-none transition-all font-bold" 
                       placeholder="e.g. AI Marketing Automation"
                    />
                 </div>

                 <div>
                    <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest block mb-3 ml-1">Candidate Title</label>
                    <textarea 
                       value={input.title} 
                       onChange={e => setInput({...input, title: e.target.value})}
                       className="w-full h-20 bg-zinc-950 border border-zinc-800 rounded-2xl p-4 text-white focus:ring-2 focus:ring-red-500/50 outline-none transition-all resize-none text-sm font-medium" 
                       placeholder="Your current or planned title..."
                    />
                 </div>

                 <div>
                    <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest block mb-3 ml-1">Description Manifest</label>
                    <textarea 
                       value={input.description} 
                       onChange={e => setInput({...input, description: e.target.value})}
                       className="w-full h-40 bg-zinc-950 border border-zinc-800 rounded-2xl p-4 text-white focus:ring-2 focus:ring-red-500/50 outline-none transition-all resize-none text-xs font-medium custom-scrollbar" 
                       placeholder="Paste current description or notes..."
                    />
                 </div>

                 <div className="space-y-4">
                    <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest block ml-1">Neural Objective</label>
                    <div className="grid grid-cols-1 gap-2">
                       {GOALS.map(g => (
                          <button 
                             key={g.id}
                             type="button"
                             onClick={() => setGoal(g.id)}
                             className={`text-left p-4 rounded-2xl border transition-all relative overflow-hidden group ${goal === g.id ? 'bg-red-600/10 border-red-500 text-white shadow-xl' : 'bg-zinc-950 border-zinc-800 text-zinc-500 hover:border-zinc-700'}`}
                          >
                             <div className="relative z-10">
                                <p className="text-xs font-black uppercase tracking-widest">{g.label}</p>
                                <p className="text-[10px] opacity-60 font-medium mt-1">{g.desc}</p>
                             </div>
                             {goal === g.id && (
                                <div className="absolute top-2 right-2">
                                   <Zap size={14} className="text-red-500" fill="currentColor" />
                                </div>
                             )}
                          </button>
                       ))}
                    </div>
                 </div>

                 <button 
                   type="submit"
                   disabled={loading || (!input.topic && !input.title)}
                   className="w-full py-6 rounded-[2rem] bg-red-600 hover:bg-red-500 text-white font-black uppercase text-xs tracking-[0.3em] transition-all shadow-xl shadow-red-600/20 flex items-center justify-center gap-3 active-press"
                 >
                   {loading ? <Loader2 className="animate-spin" size={20} /> : <><Sparkles size={20} /> Engineer Manifest</>}
                 </button>
              </div>
           </form>

           <div className="bg-zinc-900 border border-zinc-800 p-8 rounded-[2.5rem] flex items-start gap-4">
              <div className="p-3 bg-blue-500/10 rounded-2xl text-blue-400">
                 <AlertCircle size={20} />
              </div>
              <div>
                 <h4 className="text-[10px] font-bold text-white uppercase tracking-widest mb-1">Architecture Note</h4>
                 <p className="text-[11px] text-zinc-500 leading-relaxed font-medium">
                   "Optimizing existing descriptions by injecting Semantic Chapters can increase Average View Duration by up to 12%."
                 </p>
              </div>
           </div>
        </div>

        {/* Optimized Output - 7 cols */}
        <div className="lg:col-span-7 bg-zinc-950 border border-zinc-900 rounded-[3rem] overflow-hidden flex flex-col shadow-inner relative min-h-[800px]">
           {!result && !loading ? (
              <div className="flex-1 flex flex-col items-center justify-center text-zinc-900 gap-8 opacity-40 animate-pulse">
                 <div className="w-64 h-64 rounded-[4rem] border-4 border-dashed border-zinc-900 flex items-center justify-center">
                    <Monitor size={120} strokeWidth={1} />
                 </div>
                 <div className="text-center space-y-3">
                    <p className="font-black uppercase text-2xl tracking-[0.5em]">Synthesis Stage Ready</p>
                    <p className="text-sm font-bold tracking-widest uppercase opacity-60">Initialize architectural parameters to synthesize manifest</p>
                 </div>
              </div>
           ) : loading ? (
              <div className="flex-1 flex flex-col items-center justify-center gap-10 text-red-500">
                 <div className="relative">
                    <Loader2 className="animate-spin w-24 h-24" strokeWidth={1} />
                    <div className="absolute inset-0 bg-red-500 blur-[100px] opacity-10 animate-pulse"></div>
                 </div>
                 <div className="text-center space-y-4">
                    <p className="text-3xl font-black text-white tracking-tighter uppercase animate-pulse">Mapping Latent Index</p>
                    <div className="flex items-center justify-center gap-4 text-xs font-black text-zinc-600 uppercase tracking-widest">
                       <span className="flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-red-600 animate-ping"></div> TITLES</span>
                       <span className="flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-red-600 animate-ping delay-100"></div> SEMANTICS</span>
                       <span className="flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-red-600 animate-ping delay-200"></div> RETENTION</span>
                    </div>
                 </div>
              </div>
           ) : (
              <div className="flex-1 overflow-y-auto custom-scrollbar p-10 space-y-10 animate-fade-in">
                 {/* Top Level Score */}
                 <div className="flex flex-col md:flex-row items-center justify-between gap-8 bg-zinc-900 border border-zinc-800 rounded-[2.5rem] p-8 shadow-xl">
                    <div className="flex items-center gap-6">
                       <div className="relative flex items-center justify-center">
                          <svg className="w-24 h-24 transform -rotate-90">
                             <circle cx="48" cy="48" r="40" stroke="currentColor" strokeWidth="8" fill="transparent" className="text-zinc-800" />
                             <circle cx="48" cy="48" r="40" stroke="currentColor" strokeWidth="8" fill="transparent" strokeDasharray={251.2} strokeDashoffset={251.2 - (251.2 * result.score) / 100} className="text-red-600 transition-all duration-1000 ease-out" />
                          </svg>
                          <span className="absolute text-2xl font-black text-white">{result.score}%</span>
                       </div>
                       <div>
                          <h3 className="text-xl font-black text-white uppercase tracking-tighter">Manifest Velocity</h3>
                          <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest mt-1">Growth Prediction: Excellent</p>
                       </div>
                    </div>
                    <div className="flex-1 max-w-xs p-4 bg-zinc-950 border border-zinc-800 rounded-2xl text-right">
                       <button 
                         onClick={teleportToScript}
                         className="inline-flex items-center gap-2 bg-red-600 hover:bg-red-500 text-white px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest shadow-xl transition-all active-press"
                       >
                          <Rocket size={14} /> Teleport to Script
                       </button>
                    </div>
                 </div>

                 {/* Titles Section */}
                 <div className="space-y-4">
                    <div className="flex items-center justify-between px-2">
                       <h4 className="text-[10px] font-black text-zinc-500 uppercase tracking-widest flex items-center gap-2">
                          <Flame size={14} className="text-orange-500" /> Engineered Titles
                       </h4>
                    </div>
                    <div className="space-y-3">
                       {result.titles.map((t, i) => (
                          <div key={i} className="group bg-zinc-900 border border-zinc-800 rounded-2xl p-5 hover:border-red-500/50 transition-all flex items-center justify-between gap-6 shadow-sm">
                             <div className="flex gap-4 flex-1 min-w-0">
                                <span className="text-xs font-black text-zinc-800 group-hover:text-red-500 transition-colors">{i+1}</span>
                                <p className="text-base font-bold text-white leading-tight truncate">{t}</p>
                             </div>
                             <button onClick={() => copyToClipboard(t, `title-${i}`)} className={`p-2.5 rounded-xl transition-all ${copiedSection === `title-${i}` ? 'bg-green-600 text-white' : 'bg-zinc-950 text-zinc-600 hover:text-white'}`}>
                                {copiedSection === `title-${i}` ? <Check size={16} /> : <Copy size={16} />}
                             </button>
                          </div>
                       ))}
                    </div>
                 </div>

                 {/* Description Section */}
                 <div className="space-y-4">
                    <div className="flex items-center justify-between px-2">
                       <h4 className="text-[10px] font-black text-zinc-500 uppercase tracking-widest flex items-center gap-2">
                          <FileText size={14} className="text-blue-500" /> Optimized Description
                       </h4>
                       <button onClick={() => copyToClipboard(result.description, 'desc')} className={`flex items-center gap-2 px-6 py-2 rounded-xl text-[10px] font-black uppercase transition-all ${copiedSection === 'desc' ? 'bg-green-600 text-white' : 'bg-zinc-800 text-zinc-400 hover:text-white border border-zinc-700'}`}>
                          {copiedSection === 'desc' ? <CheckCircle2 size={12} /> : <Zap size={12} fill="currentColor" />} {copiedSection === 'desc' ? 'Cloned' : 'Clone Manifest'}
                       </button>
                    </div>
                    <div className="bg-zinc-900 border border-zinc-800 rounded-[2.5rem] p-8 h-[400px] overflow-y-auto custom-scrollbar relative group/desc shadow-inner">
                       <pre className="whitespace-pre-wrap font-sans text-sm md:text-base leading-relaxed text-zinc-400 font-medium">
                          {result.description}
                       </pre>
                       <div className="absolute top-4 right-4 bg-red-600/10 border border-red-500/20 px-3 py-1.5 rounded-xl text-[9px] font-black text-red-500 uppercase tracking-[0.2em] backdrop-blur-md">
                          Retention Loop Enabled
                       </div>
                    </div>
                 </div>

                 {/* Semantic Section */}
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="bg-zinc-900 border border-zinc-800 rounded-[2.5rem] p-8 shadow-xl space-y-6">
                       <h4 className="text-[10px] font-black text-zinc-500 uppercase tracking-widest flex items-center gap-2">
                          <TrendingUp size={14} className="text-green-500" /> Discovery Tags
                       </h4>
                       <div className="flex flex-wrap gap-2">
                          {result.tags.map((tag, i) => (
                             <span key={i} className="bg-zinc-950 border border-zinc-800 px-3 py-1.5 rounded-xl text-[11px] text-zinc-500 hover:text-white transition-all cursor-default">
                                {tag}
                             </span>
                          ))}
                       </div>
                    </div>
                    <div className="bg-zinc-900 border border-zinc-800 rounded-[2.5rem] p-8 shadow-xl space-y-6">
                       <h4 className="text-[10px] font-black text-zinc-500 uppercase tracking-widest flex items-center gap-2">
                          <Hash size={14} className="text-purple-500" /> Viral Anchors
                       </h4>
                       <div className="flex flex-wrap gap-3">
                          {result.hashtags.map((h, i) => (
                             <span key={i} className="text-lg font-black text-red-600 hover:scale-110 transition-transform cursor-pointer">
                                #{h.replace(/^#/, '')}
                             </span>
                          ))}
                       </div>
                    </div>
                 </div>

                 {/* Neural Delta Analysis */}
                 <div className="bg-zinc-900 border border-zinc-800 rounded-[2.5rem] p-8 space-y-6">
                    <div className="flex items-center gap-3">
                       <Target size={20} className="text-red-500" />
                       <h4 className="text-[10px] font-black text-white uppercase tracking-tighter uppercase tracking-[0.3em]">Engineering Delta Analysis</h4>
                    </div>
                    <div className="bg-zinc-950 border border-zinc-800 rounded-3xl p-6">
                       <p className="text-sm text-zinc-300 leading-relaxed font-medium italic">"{result.deltaAnalysis}"</p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                       {result.semanticClusters.map((c, i) => (
                          <div key={i} className="flex items-center gap-2 px-3 py-1.5 bg-red-600/5 border border-red-500/10 rounded-xl text-[9px] font-black text-red-500 uppercase tracking-widest">
                             <div className="w-1 h-1 rounded-full bg-red-600"></div> {c}
                          </div>
                       ))}
                    </div>
                 </div>
              </div>
           )}
        </div>
      </div>
    </div>
  );
};
