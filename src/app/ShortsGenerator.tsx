import React, { useState, useRef, useEffect } from 'react';
import { generateShortsScript, generateThumbnail } from '@/infrastructure/gemini';
import { 
  Loader2, 
  Smartphone, 
  Zap, 
  Clock, 
  Copy, 
  Maximize2, 
  Minimize2, 
  Sparkles, 
  Video, 
  FileText,
  Play,
  RotateCcw,
  BookOpen,
  ChevronDown,
  Check,
  History,
  Timer,
  ImageIcon,
  ChevronRight,
  Film,
  Scissors,
  Flame,
  Award,
  TrendingUp,
  BrainCircuit
} from 'lucide-react';
import { useAuth } from '@/infrastructure/auth/AuthContext';
import { ToolType } from '@/shared/types';

const SHORT_STYLES = [
  { id: 'cinematic', label: 'Cinematic Story', desc: 'Dramatic lighting and high production feel.' },
  { id: 'kinetic', label: 'Kinetic Typography', desc: 'Fast text, energetic music, and bold colors.' },
  { id: 'documentary', label: 'Mini Docu', desc: 'Informative, fast facts, and clean b-roll.' },
  { id: 'sketch', label: 'POV Sketch', desc: 'Relatable characters and punchy dialogue.' },
  { id: 'educational', label: 'How-to Blast', desc: 'Rapid steps and satisfying results.' }
];

const SHORTS_BLUEPRINTS = [
  {
    id: 'ai-marketing-hyper-paced',
    label: 'AI Marketing (Ultra-Paced)',
    topic: 'The End of Traditional Marketing: Why AI Agents are the only future.',
    style: 'kinetic',
    pacing: 'Fast' as const,
    script: `[Visual: 0:00 - Red strobe light. Massive white text flashes: EXTINCT.]
**"The marketing agency is officially extinct."**
[Visual: 0:03 - Kinetic 'TRADITIONAL' text shatters into binary code. Bass drop.]
**"If you're still manually writing copy in 2025,"**
[Visual: 0:06 - 3D model of a human hand being replaced by a robotic arm.]
**"you aren't a marketer—you're a bottleneck."**
[Visual: 0:09 - 3D hologram of 5 AI agents talking in a neural loop.]
**"The 1% have switched to Agentic Orchestration."**
[Visual: 0:12 - Drone shot flying through a digital neural network forest.]
**"One human. Fifty autonomous agents. Infinite scale."**
[Visual: 0:15 - A "Profit" line graph going vertical. 10,000% ROI overlay.]
**"Agencies are replacing five-thousand dollar retainers"**
[Visual: 0:18 - Rain of golden coins turning into digital data bits.]
**"with twelve-cent API calls. The quality?"**
[Visual: 0:21 - Microscopic scan of pixel-perfect text being written at light speed.]
**"It isn't just better; it is terrifyingly precise."**
[Visual: 0:24 - Ranktica AI interface flashing different tools rapidly.]
**"Stop prompting. Start orchestrating the swarm."**
[Visual: 0:27 - 3D 'BLUEPRINT' text rotating. Neon red highlights.]
**"I just dropped the full guide on how to build one."**
[Visual: 0:30 - Massive 'SUBSCRIBE' button pulsing with electric arcs.]
**"Subscribe now to join the elite 1% of creators."**
[Visual: 0:33 - Kinetic 'LET'S BUILD' text with glitch effect.]
**"The autonomous revolution starts today. Let's go."**`
  },
  {
    id: 'ai-marketing-2025-kinetic',
    label: 'AI Marketing (2025 Blitz)',
    topic: 'The Future of AI in Marketing: How agentic workflows are destroying traditional agencies.',
    style: 'kinetic',
    pacing: 'Fast' as const,
    script: `[Visual: 0:00 - Ultra-fast strobe of traditional office logos fading to black. Red text: THE END.]
**"The marketing agency is officially extinct."**

[Visual: 0:05 - Kinetic text 'TRADITIONAL' shatters into binary code. Rapid bass thumping music.]
**"In 2025, if you're still manually writing copy or managing ads, you aren't a marketer—you're a bottleneck."**

[Visual: 0:12 - 3D hologram of 5 AI agents talking to each other in a neural loop.]
**"The 1% have switched to Agentic Orchestration. One human. Fifty autonomous agents. Infinite scale."**

[Visual: 0:20 - A "Profit" line graph going vertical. Text overlay: 10,000% ROI.]
**"We're seeing agencies replace five-thousand dollar retainers with twelve-cent API calls. The quality isn't just better; it's terrifyingly precise."**

[Visual: 0:28 - Rapid montage of Ranktica AI's interface generating 30 days of content in 10 seconds.]
**"Stop prompting. Start orchestrating. I just dropped the full blueprint on how to build your first marketing swarm."**

[Visual: 0:35 - Massive 'SUBSCRIBE' button pulsing with electric red arcs.]
**"The autonomous revolution doesn't wait. Subscribe now to join the elite 1% of creators who build the future. Let's go."**`
  }
];

interface ShortsGeneratorProps {
  prefill?: { 
    topic?: string; 
    style?: string; 
    pacing?: 'Fast' | 'Standard';
    context?: string;
  };
}

export const ShortsGenerator: React.FC<ShortsGeneratorProps> = ({ prefill }) => {
  const [topic, setTopic] = useState(prefill?.topic || '');
  const [style, setStyle] = useState(prefill?.style || 'kinetic');
  const [pacing, setPacing] = useState<'Fast' | 'Standard'>(prefill?.pacing || 'Fast');
  const [script, setScript] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [teleprompterMode, setTeleprompterMode] = useState(false);
  const [prompterSpeed, setPrompterSpeed] = useState(1);
  const [visualPrompts, setVisualPrompts] = useState<Record<number, string | null>>({});
  const [loadingVisual, setLoadingVisual] = useState<number | null>(null);
  
  const { incrementStat } = useAuth();
  const scriptEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (prefill) {
      if (prefill.topic) setTopic(prefill.topic);
      if (prefill.style) setStyle(prefill.style);
      if (prefill.pacing) setPacing(prefill.pacing);
    }
  }, [prefill]);

  const applyBlueprint = (bp: typeof SHORTS_BLUEPRINTS[0]) => {
    setTopic(bp.topic);
    setStyle(bp.style);
    setPacing(bp.pacing);
    setScript(bp.script || '');
    setVisualPrompts({});
  };

  const handleGenerate = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!topic.trim()) return;

    setIsGenerating(true);
    setScript('');
    setVisualPrompts({});
    
    try {
      let fullScript = '';
      await generateShortsScript(topic, style, pacing, (chunk) => {
        setScript(prev => prev + chunk);
        fullScript += chunk;
      });
      incrementStat('scriptsWritten');
    } catch (err) {
      console.error(err);
      setScript("[Error generating script. Please check your connection and try again.]");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleVisualizeScene = async (index: number, visualPromptText: string) => {
    setLoadingVisual(index);
    try {
      const url = await generateThumbnail(visualPromptText, '3D Render', 'fast', '9:16', '1K');
      setVisualPrompts(prev => ({ ...prev, [index]: url }));
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingVisual(null);
    }
  };

  useEffect(() => {
    if (scriptEndRef.current && !teleprompterMode) {
      scriptEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [script, teleprompterMode]);

  const spokenTextOnly = script.replace(/\[.*?\]/g, '').trim();
  const wordCount = spokenTextOnly.split(/\s+/).filter(w => w.length > 0).length;
  const estSeconds = Math.round((wordCount / (pacing === 'Fast' ? 165 : 135)) * 60);
  const isOverLimit = estSeconds > 60;

  const cueCount = (script.match(/\[Visual:.*?\]/g) || []).length;
  const visualDensity = wordCount > 0 ? (cueCount / (wordCount / 12)) * 100 : 0;
  const isOptimallyPaced = visualDensity >= 80;

  const copyScript = () => {
    navigator.clipboard.writeText(script);
    alert("Full script copied to clipboard!");
  };

  return (
    <div className={`h-full flex flex-col gap-8 animate-fade-in ${teleprompterMode ? 'fixed inset-0 z-50 bg-[#09090b] p-8 md:p-20' : 'pb-10'}`}>
      
      {!teleprompterMode && (
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 shrink-0">
          <div>
            <h2 className="text-4xl font-black text-white tracking-tighter flex items-center gap-3">
              <Smartphone className="text-red-500" /> Shorts Architect
            </h2>
            <p className="text-zinc-500 text-[10px] font-bold uppercase tracking-widest">Viral Vertical synthesis</p>
          </div>
          <div className="flex gap-2">
            {script && (
              <button 
                onClick={() => { setTopic(''); setScript(''); setVisualPrompts({}); }}
                className="p-3 bg-zinc-900 border border-zinc-800 text-zinc-500 hover:text-white rounded-2xl transition-all active-press"
                title="Reset Workspace"
              >
                <RotateCcw size={18} />
              </button>
            )}
          </div>
        </header>
      )}

      <div className={`flex-1 flex flex-col md:flex-row gap-8 min-h-0 ${teleprompterMode ? 'w-full max-w-6xl mx-auto' : ''}`}>
        
        {/* Left: Blueprints Sidebar */}
        {!teleprompterMode && (
          <div className="w-full md:w-[350px] flex flex-col gap-6 shrink-0">
            <div className="bg-zinc-900 border border-zinc-800 rounded-[2.5rem] p-8 shadow-2xl space-y-8 relative overflow-hidden group">
               <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                  <Award size={80} />
               </div>
               <h3 className="text-xs font-black text-white uppercase tracking-[0.2em] flex items-center gap-2">
                  <Flame size={16} className="text-orange-500" /> Neural Blueprints
               </h3>
               
               <div className="space-y-3">
                  {SHORTS_BLUEPRINTS.map(bp => (
                    <button 
                      key={bp.id}
                      onClick={() => applyBlueprint(bp)}
                      className="w-full text-left p-4 bg-zinc-950/50 border border-zinc-800 rounded-2xl hover:border-red-500/50 transition-all group/item"
                    >
                       <div className="flex justify-between items-center mb-1">
                          <span className={`text-[10px] font-black uppercase tracking-tighter ${bp.id.includes('hyper') ? 'text-yellow-500' : 'text-red-500'}`}>{bp.id.includes('hyper') ? 'Hyper Paced' : 'Viral Blitz'}</span>
                          <ChevronRight size={12} className="text-zinc-700 group-hover/item:translate-x-1 transition-transform" />
                       </div>
                       <p className="text-xs font-bold text-zinc-300 leading-snug">{bp.label}</p>
                    </button>
                  ))}
               </div>

               <div className="w-full h-px bg-zinc-800"></div>

               <div className="space-y-6">
                  <ModifierGroup label="Style" icon={Sparkles} options={SHORT_STYLES.map(s => s.label)} current={SHORT_STYLES.find(s=>s.id===style)?.label || 'Kinetic'} setter={(val) => setStyle(SHORT_STYLES.find(s=>s.label===val)?.id || 'kinetic')} color="text-blue-500" />
                  <div className="space-y-4">
                    <label className="text-[10px] font-black text-zinc-600 uppercase tracking-widest block ml-1">Linguistic Pacing</label>
                    <div className="flex bg-zinc-950 border border-zinc-800 rounded-2xl p-1">
                      <button onClick={() => setPacing('Fast')} className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${pacing === 'Fast' ? 'bg-zinc-800 text-white shadow-md' : 'text-zinc-500 hover:text-white'}`}>Aggressive</button>
                      <button onClick={() => setPacing('Standard')} className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${pacing === 'Standard' ? 'bg-zinc-800 text-white shadow-md' : 'text-zinc-500 hover:text-white'}`}>Steady</button>
                    </div>
                  </div>
               </div>
            </div>

            <div className="bg-zinc-900/50 border border-zinc-800 p-6 rounded-[2rem] flex items-start gap-4">
              <div className="p-3 bg-red-500/10 rounded-2xl text-red-500">
                 <BrainCircuit size={20} />
              </div>
              <div>
                 <h4 className="text-[10px] font-bold text-white uppercase tracking-widest mb-1">Neuromapping</h4>
                 <p className="text-[10px] text-zinc-500 leading-relaxed font-medium">
                   "Kinetic styles with Aggressive pacing maintain viewer interest for 42% longer in the 2025 algorithm."
                 </p>
              </div>
           </div>
          </div>
        )}

        {/* Right: Output Stage */}
        <div className="flex-1 flex flex-col gap-6 min-w-0">
          
          <form onSubmit={handleGenerate} className="bg-zinc-900 border border-zinc-800 p-2 rounded-[2.5rem] shadow-2xl flex items-center gap-2 group focus-within:border-red-500/50 transition-all">
             <div className="flex items-center pl-6 text-zinc-600">
                <TrendingUp size={20} />
             </div>
             <input
               type="text"
               value={topic}
               onChange={(e) => setTopic(e.target.value)}
               placeholder="Target topic or narrative catalyst..."
               className="flex-1 bg-transparent border-none py-6 outline-none text-white font-medium text-lg placeholder:text-zinc-800"
             />
             <button
               type="submit"
               disabled={isGenerating || !topic}
               className="bg-red-600 hover:bg-red-500 disabled:opacity-50 text-white px-12 py-4 rounded-[2rem] font-black uppercase text-xs tracking-widest transition-all shadow-lg shadow-red-600/20 flex items-center gap-2 active-press mr-1"
             >
               {isGenerating ? <Loader2 className="animate-spin" size={18} /> : <><Zap size={18} fill="currentColor" /> Generate</>}
             </button>
          </form>

          {script && !teleprompterMode && (
            <div className="flex items-center gap-6 bg-zinc-900 border border-zinc-800 p-5 rounded-[2rem] shadow-inner shrink-0 overflow-x-auto no-scrollbar">
               <div className="flex items-center gap-2 shrink-0">
                  <Clock size={16} className={isOverLimit ? 'text-red-500' : 'text-green-500'} />
                  <div className="flex flex-col">
                    <span className="text-[9px] font-black text-zinc-500 uppercase tracking-widest">Est. Duration</span>
                    <span className={`text-sm font-black ${isOverLimit ? 'text-red-500' : 'text-white'}`}>{estSeconds}s {isOverLimit && '(LIMIT EXCEEDED)'}</span>
                  </div>
               </div>
               <div className="w-px h-8 bg-zinc-800 shrink-0"></div>
               <div className="flex items-center gap-2 shrink-0">
                  <Zap size={16} className={isOptimallyPaced ? 'text-yellow-500' : 'text-zinc-600'} />
                  <div className="flex flex-col">
                    <span className="text-[9px] font-black text-zinc-500 uppercase tracking-widest">Visual Density</span>
                    <span className={`text-sm font-black ${isOptimallyPaced ? 'text-yellow-500' : 'text-white'}`}>{cueCount} Cues</span>
                  </div>
               </div>
               <div className="ml-auto flex gap-3 shrink-0">
                  <button onClick={copyScript} className="p-3 bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-white rounded-2xl transition-all border border-zinc-700"><Copy size={18} /></button>
                  <button onClick={() => setTeleprompterMode(true)} className="flex items-center gap-2 px-5 py-3 bg-zinc-800 hover:bg-zinc-700 text-white rounded-2xl transition-all border border-zinc-700 font-black uppercase text-[10px] tracking-widest">
                    <Maximize2 size={14} /> Teleprompter
                  </button>
                  <button className="flex items-center gap-2 px-6 py-3 bg-white hover:bg-zinc-200 text-black rounded-2xl transition-all shadow-xl font-black uppercase text-[10px] tracking-[0.2em] active-press">
                    <Film size={14} /> Enter Studio
                  </button>
               </div>
            </div>
          )}

          <div className={`flex-1 bg-zinc-950 border border-zinc-900 rounded-[3rem] shadow-inner relative overflow-hidden group flex flex-col ${teleprompterMode ? 'border-none' : ''}`}>
             
             {teleprompterMode && (
               <div className="shrink-0 flex items-center justify-between mb-12 animate-fade-in">
                  <div className="flex items-center gap-5">
                     <div className="w-14 h-14 bg-red-600 rounded-full flex items-center justify-center animate-pulse shadow-[0_0_30px_rgba(239,68,68,0.3)]">
                        <Play size={28} fill="white" className="ml-1" />
                     </div>
                     <div>
                        <h3 className="text-3xl font-black uppercase tracking-[0.3em] text-white">Retinal Scan</h3>
                        <div className="flex items-center gap-4 mt-2">
                           <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest flex items-center gap-1.5"><Timer size={12} /> Velocity Multiplier:</span>
                           <div className="flex gap-1.5">
                              {[1, 1.2, 1.5, 2].map(s => (
                                <button key={s} onClick={() => setPrompterSpeed(s)} className={`px-3 py-1 rounded-lg text-[10px] font-black transition-all border ${prompterSpeed === s ? 'bg-red-600 border-red-500 text-white' : 'bg-zinc-900 border-zinc-800 text-zinc-500 hover:text-white'}`}>{s}x</button>
                              ))}
                           </div>
                        </div>
                     </div>
                  </div>
                  <button onClick={() => setTeleprompterMode(false)} className="p-5 bg-zinc-900 border border-zinc-800 text-white rounded-3xl hover:bg-zinc-800 transition-all active-press">
                     <Minimize2 size={32} />
                  </button>
               </div>
             )}

             <div className="flex-1 overflow-y-auto p-8 md:p-14 custom-scrollbar">
                {!script && !isGenerating ? (
                   <div className="h-full flex flex-col items-center justify-center text-zinc-800 gap-8 opacity-40">
                      <div className="w-48 h-48 rounded-[3rem] border-4 border-dashed border-zinc-900 flex items-center justify-center">
                         <Smartphone size={100} strokeWidth={1} />
                      </div>
                      <div className="text-center space-y-2">
                        <p className="font-black uppercase text-base tracking-[0.5em]">Terminal Idling</p>
                        <p className="text-[10px] font-bold tracking-widest uppercase opacity-60">Initialize parameters to begin narrative synthesis</p>
                      </div>
                   </div>
                ) : isGenerating && !script ? (
                   <div className="h-full flex flex-col items-center justify-center gap-10 text-red-500">
                      <div className="relative">
                         <Loader2 className="animate-spin w-24 h-24" strokeWidth={1} />
                         <div className="absolute inset-0 bg-red-500 blur-[80px] opacity-10 animate-pulse"></div>
                      </div>
                      <div className="text-center space-y-3">
                        <p className="text-2xl font-black text-white tracking-tighter animate-pulse uppercase">Compressing Narrative</p>
                        <p className="text-[10px] text-zinc-500 font-black tracking-widest uppercase">Consulting Retention Algorithm</p>
                      </div>
                   </div>
                ) : (
                   <div className={`${teleprompterMode ? 'max-w-5xl mx-auto text-6xl md:text-8xl font-black leading-tight space-y-20 pb-80' : 'text-xl font-bold leading-relaxed space-y-8'} text-zinc-100 transition-all duration-300`}>
                      {script.split(/(\[.*?\])/g).map((part, i) => (
                        part.startsWith('[') ? (
                          <div key={i} className="flex flex-col gap-6 mb-4 animate-scale-in">
                            <div className={`flex items-center gap-4 bg-red-600/10 text-red-500 border border-red-600/20 rounded-3xl w-fit ${teleprompterMode ? 'px-12 py-6 text-3xl' : 'px-5 py-2.5 text-[11px] uppercase tracking-widest font-black'}`}>
                               <Video size={teleprompterMode ? 32 : 16} />
                               {part.slice(1, -1)}
                               {!teleprompterMode && (
                                 <button 
                                   onClick={() => handleVisualizeScene(i, part.slice(1, -1))}
                                   disabled={loadingVisual === i}
                                   className="ml-6 p-1.5 hover:bg-red-600/20 rounded-xl transition-all group/vis"
                                   title="Neural Visual Reference"
                                 >
                                   {loadingVisual === i ? <Loader2 size={14} className="animate-spin" /> : <ImageIcon size={14} className="group-hover/vis:scale-110 transition-transform" />}
                                 </button>
                               )}
                            </div>
                            {visualPrompts[i] && !teleprompterMode && (
                              <div className="w-full max-w-[200px] aspect-[9/16] rounded-[2rem] overflow-hidden border-2 border-zinc-800 bg-zinc-900 shadow-2xl animate-scale-in relative group/ref">
                                 <img src={visualPrompts[i]!} className="w-full h-full object-cover group-hover/ref:scale-110 transition-transform duration-700" alt="Scene Ref" />
                                 <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover/ref:opacity-100 transition-opacity flex items-end p-4">
                                    <span className="text-[8px] font-black text-white uppercase tracking-widest">Scene Ref Generated</span>
                                 </div>
                              </div>
                            )}
                          </div>
                        ) : (
                          <p key={i} className={`whitespace-pre-wrap ${teleprompterMode ? 'drop-shadow-[0_10px_20px_rgba(0,0,0,0.5)]' : ''}`}>{part}</p>
                        )
                      ))}
                      <div ref={scriptEndRef} />
                   </div>
                )}
             </div>

             {teleprompterMode && (
                <div className="absolute bottom-0 left-0 right-0 h-80 bg-gradient-to-t from-[#09090b] via-[#09090b]/80 to-transparent pointer-events-none z-10"></div>
             )}
          </div>
        </div>
      </div>
    </div>
  );
};

const ModifierGroup = ({ label, icon: Icon, options, current, setter, color }: any) => (
  <div className="space-y-3">
    <label className={`text-[10px] font-black uppercase tracking-widest flex items-center gap-2 ${color}`}>
       <Icon size={12} /> {label}
    </label>
    <div className="flex flex-wrap gap-2">
       {options.map((opt: string) => (
         <button
           key={opt}
           type="button"
           onClick={() => setter(opt)}
           className={`px-3 py-1.5 rounded-lg text-[9px] font-bold uppercase transition-all border ${current === opt ? 'bg-zinc-100 border-white text-black shadow-lg scale-105' : 'bg-zinc-950 border-zinc-800 text-zinc-500 hover:border-zinc-700'}`}
         >
           {opt}
         </button>
       ))}
    </div>
  </div>
);
