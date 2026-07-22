
import React, { useState } from 'react';
import { generateRepurposedContent, generateSpeech, generateThumbnail, optimizeShortsScript, repurposeToShorts } from '@/infrastructure/gemini';
import { RepurposedContent, ToolType } from '@/shared/types';
import { 
  Loader2, 
  RefreshCcw, 
  Twitter, 
  Mail, 
  FileText, 
  Copy, 
  Video, 
  Clock, 
  Sparkles, 
  Maximize2, 
  Minimize2, 
  Monitor,
  Check,
  AlertCircle,
  Volume2,
  Image as ImageIcon,
  PlayCircle,
  Download,
  Scissors,
  ChevronRight,
  Film,
  Zap,
  Wand2
} from 'lucide-react';

interface RepurposeEngineProps {
  onNavigate?: (tool: ToolType) => void;
}

const ShortsScriptRenderer = ({ script, sourceText, onUpdate, onNavigate }: { script: string, sourceText: string, onUpdate: (s: string) => void, onNavigate?: (tool: ToolType) => void }) => {
  const [teleprompterMode, setTeleprompterMode] = useState(false);
  const [isGeneratingAudio, setIsGeneratingAudio] = useState(false);
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [isRefining, setIsRefining] = useState(false);
  const [pacing, setPacing] = useState<'Fast' | 'Standard'>('Fast');
  const [visualPrompts, setVisualPrompts] = useState<Record<number, string | null>>({});
  const [loadingVisual, setLoadingVisual] = useState<number | null>(null);
  
  // Split script by visual notes [bracketed text]
  const parts = script.split(/(\[.*?\])/g);
  
  // Estimate duration
  const spokenTextOnly = script.replace(/\[.*?\]/g, '').trim();
  const wordCount = spokenTextOnly.split(/\s+/).filter(w => w.length > 0).length;
  const estSeconds = Math.round((wordCount / (pacing === 'Fast' ? 160 : 135)) * 60);
  const isOverLimit = estSeconds > 60;

  const handleVoiceover = async () => {
    if (!spokenTextOnly) return;
    setIsGeneratingAudio(true);
    try {
      const base64 = await generateSpeech(spokenTextOnly);
      if (base64) {
        // Simple raw audio playback
        const binaryString = atob(base64);
        const len = binaryString.length;
        const bytes = new Uint8Array(len);
        for (let i = 0; i < len; i++) bytes[i] = binaryString.charCodeAt(i);
        const audioContext = new (window.AudioContext || window.webkitAudioContext)({sampleRate: 24000});
        const buffer = audioContext.createBuffer(1, bytes.length / 2, 24000);
        const channelData = buffer.getChannelData(0);
        const dataInt16 = new Int16Array(bytes.buffer);
        for (let i = 0; i < dataInt16.length; i++) channelData[i] = dataInt16[i] / 32768.0;
        const source = audioContext.createBufferSource();
        source.buffer = buffer;
        source.connect(audioContext.destination);
        source.start();
      }
    } catch (e) {
      console.error(e);
      alert("Voiceover synthesis failed.");
    } finally {
      setIsGeneratingAudio(false);
    }
  };

  const handleRefine = async () => {
    setIsRefining(true);
    try {
      const refined = await repurposeToShorts(sourceText, pacing);
      onUpdate(refined);
    } catch (e) {
      console.error(e);
      alert("Refining script failed.");
    } finally {
      setIsRefining(false);
    }
  };

  const handleOptimize = async () => {
    setIsOptimizing(true);
    try {
      const optimized = await optimizeShortsScript(script);
      onUpdate(optimized);
    } catch (e) {
      console.error(e);
    } finally {
      setIsOptimizing(false);
    }
  };

  // Fix: Added the missing 5th argument '1K' to match generateThumbnail's signature.
  const handleVisualizeScene = async (index: number, prompt: string) => {
    setLoadingVisual(index);
    try {
      const url = await generateThumbnail(prompt, 'Photorealistic', 'fast', '9:16', '1K');
      setVisualPrompts(prev => ({ ...prev, [index]: url }));
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingVisual(null);
    }
  };

  return (
    <div className={`space-y-6 transition-all duration-500 ${teleprompterMode ? 'fixed inset-0 z-50 bg-[#09090b] p-8 md:p-20' : ''}`}>
      {/* Header / Stats */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 bg-zinc-900 border border-zinc-800 p-4 rounded-2xl shadow-inner">
        <div className="flex items-center gap-6">
           <div className="flex items-center gap-2">
              <Clock size={16} className={isOverLimit ? 'text-red-500' : 'text-green-500'} />
              <div className="flex flex-col">
                <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Est. Runtime</span>
                <span className={`text-sm font-black ${isOverLimit ? 'text-red-500' : 'text-white'}`}>
                  {estSeconds}s {isOverLimit && '(OVER LIMIT)'}
                </span>
              </div>
           </div>
           
           <div className="w-px h-8 bg-zinc-800"></div>

           <div className="flex flex-col gap-1">
              <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Target Pacing</span>
              <div className="flex bg-zinc-950 border border-zinc-800 rounded-lg p-1">
                  <button 
                    onClick={() => setPacing('Fast')}
                    className={`px-3 py-1 text-[9px] font-black uppercase rounded ${pacing === 'Fast' ? 'bg-zinc-800 text-white shadow-lg' : 'text-zinc-500 hover:text-white'}`}
                  >
                    Aggressive
                  </button>
                  <button 
                    onClick={() => setPacing('Standard')}
                    className={`px-3 py-1 text-[9px] font-black uppercase rounded ${pacing === 'Standard' ? 'bg-zinc-800 text-white shadow-lg' : 'text-zinc-500 hover:text-white'}`}
                  >
                    Steady
                  </button>
              </div>
           </div>

           <div className="w-px h-8 bg-zinc-800"></div>

           <div className="flex items-center gap-2">
              <Volume2 size={16} className="text-purple-500" />
              <button 
                onClick={handleVoiceover}
                disabled={isGeneratingAudio}
                className="text-[10px] font-black text-zinc-500 uppercase tracking-widest hover:text-purple-400 transition-colors flex items-center gap-1"
              >
                {isGeneratingAudio ? <Loader2 size={12} className="animate-spin" /> : <PlayCircle size={12} />}
                {isGeneratingAudio ? 'Synthesizing...' : 'Preview Voiceover'}
              </button>
           </div>
        </div>

        <div className="flex gap-2 w-full md:w-auto">
           <button 
             onClick={handleRefine}
             disabled={isRefining}
             className="flex items-center gap-2 px-4 py-2 bg-red-600/10 hover:bg-red-600/20 text-red-500 border border-red-500/20 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all"
           >
              {isRefining ? <Loader2 size={14} className="animate-spin" /> : <Wand2 size={14} />}
              {isRefining ? 'Re-writing...' : 'Re-sync Script'}
           </button>

           {isOverLimit && (
              <button 
                onClick={handleOptimize}
                disabled={isOptimizing}
                className="flex items-center gap-2 px-4 py-2 bg-orange-600/10 hover:bg-orange-600/20 text-orange-500 border border-orange-500/20 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all"
              >
                {isOptimizing ? <Loader2 size={14} className="animate-spin" /> : <Scissors size={14} />}
                Condense
              </button>
           )}

           <button 
             onClick={() => setTeleprompterMode(!teleprompterMode)}
             className={`flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all border ${teleprompterMode ? 'bg-red-600 border-red-500 text-white' : 'bg-zinc-800 border-zinc-700 text-zinc-300 hover:text-white'}`}
           >
              {teleprompterMode ? <Minimize2 size={14} /> : <Maximize2 size={14} />}
              {teleprompterMode ? 'Exit' : 'Teleprompter'}
           </button>
           
           {onNavigate && (
              <button 
                onClick={() => onNavigate(ToolType.VIDEO_GENERATOR)}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-[10px] font-black uppercase tracking-widest transition-all shadow-lg shadow-blue-600/20"
              >
                <Film size={14} /> Studio
              </button>
           )}
        </div>
      </div>

      {/* Script Body */}
      <div className={`bg-zinc-950 border border-zinc-800 rounded-[2.5rem] p-8 md:p-12 shadow-2xl relative group overflow-hidden ${teleprompterMode ? 'h-[80vh] flex flex-col' : 'max-h-[600px]'}`}>
        <div className="absolute top-0 left-0 w-2 h-full bg-red-600 opacity-50 group-hover:opacity-100 transition-opacity"></div>
        
        <div className={`overflow-y-auto pr-4 custom-scrollbar ${teleprompterMode ? 'flex-1' : ''}`}>
           <div className={`${teleprompterMode ? 'text-4xl md:text-6xl font-black leading-tight space-y-12 pb-40' : 'text-lg md:text-xl font-bold leading-relaxed space-y-6'} text-white transition-all duration-300`}>
             {parts.map((part, i) => (
               part.startsWith('[') && part.endsWith(']') ? (
                 <div key={i} className="flex flex-col gap-4 mb-4">
                    <div className={`flex items-center gap-3 bg-red-600/10 text-red-500 border border-red-600/20 rounded-2xl w-fit ${teleprompterMode ? 'px-8 py-4 text-2xl' : 'px-4 py-2 text-xs uppercase tracking-widest'}`}>
                        <Sparkles size={teleprompterMode ? 24 : 14} />
                        {part.slice(1, -1)}
                        {!teleprompterMode && (
                          <button 
                            onClick={() => handleVisualizeScene(i, part.slice(1, -1))}
                            disabled={loadingVisual === i}
                            className="ml-4 p-1 hover:bg-red-600/20 rounded transition-colors"
                            title="Generate Scene Reference"
                          >
                            {loadingVisual === i ? <Loader2 size={12} className="animate-spin" /> : <ImageIcon size={12} />}
                          </button>
                        )}
                    </div>
                    {visualPrompts[i] && !teleprompterMode && (
                       <div className="w-32 aspect-[9/16] rounded-xl overflow-hidden border border-zinc-800 bg-zinc-900 shadow-xl animate-scale-in">
                          <img src={visualPrompts[i]!} className="w-full h-full object-cover" alt="Scene Ref" />
                       </div>
                    )}
                 </div>
               ) : (
                 <p key={i} className="whitespace-pre-wrap">{part}</p>
               )
             ))}
           </div>
        </div>

        {/* Floating Warning for teleprompter */}
        {teleprompterMode && isOverLimit && (
           <div className="absolute bottom-10 right-10 bg-red-600 text-white px-6 py-3 rounded-2xl flex items-center gap-3 font-bold animate-pulse shadow-2xl">
              <AlertCircle size={20} /> Script too long for 60s
           </div>
        )}
      </div>

      {!teleprompterMode && isOverLimit && (
        <div className="p-4 bg-red-600/10 border border-red-600/20 rounded-2xl flex items-center gap-3 text-red-400">
           <AlertCircle size={20} />
           <p className="text-sm font-medium">This script is estimated at {estSeconds}s. Consider using the "Condense" tool to stay under the 60s Shorts limit.</p>
        </div>
      )}
    </div>
  );
};

export const RepurposeEngine: React.FC<RepurposeEngineProps> = ({ onNavigate }) => {
  const [sourceText, setSourceText] = useState('');
  const [result, setResult] = useState<RepurposedContent | null>(null);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'thread' | 'blog' | 'newsletter' | 'shorts'>('thread');
  const [pacing, setPacing] = useState<'Fast' | 'Standard'>('Fast');

  const handleGenerate = async () => {
    if (!sourceText.trim()) return;
    setLoading(true);
    try {
      const content = await generateRepurposedContent(sourceText, pacing);
      setResult(content);
    } catch (e) {
      console.error(e);
      alert("Repurposing failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    alert("Copied to clipboard!");
  };

  const copyCleanShortsScript = () => {
    if (!result) return;
    const clean = result.shortsScript.replace(/\[.*?\]/g, '').trim();
    navigator.clipboard.writeText(clean);
    alert("Spoken lines copied!");
  };

  const updateShortsScript = (newScript: string) => {
    if (!result) return;
    setResult({ ...result, shortsScript: newScript });
  };

  return (
    <div className="h-[calc(100vh-6rem)] flex flex-col md:flex-row gap-6 animate-fade-in pb-10">
       {/* Input Side */}
       <div className="w-full md:w-1/3 flex flex-col gap-4">
          <div className="space-y-2 shrink-0">
             <h2 className="text-2xl font-bold text-white">Content Repurposer</h2>
             <p className="text-zinc-400 text-sm">Convert a script or video topic into 4 distinct content formats instantly.</p>
          </div>
          
          <div className="flex-1 flex flex-col bg-zinc-900 border border-zinc-800 rounded-[2rem] p-6 shadow-xl">
             <textarea 
               value={sourceText} 
               onChange={e => setSourceText(e.target.value)}
               className="flex-1 bg-zinc-950 border border-zinc-800 rounded-2xl p-6 text-white text-sm resize-none focus:ring-2 focus:ring-blue-500/50 outline-none transition-all"
               placeholder="Paste your source text (script, transcript, or topic) here..."
             />
             
             <div className="mt-4 space-y-2">
                <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest block ml-1">Initial Shorts Pacing</label>
                <div className="flex bg-zinc-950 border border-zinc-800 rounded-xl p-1">
                   <button 
                     onClick={() => setPacing('Fast')}
                     className={`flex-1 py-2 text-[10px] font-black uppercase rounded-lg transition-all ${pacing === 'Fast' ? 'bg-zinc-800 text-white shadow-lg' : 'text-zinc-600 hover:text-white'}`}
                   >
                     Aggressive
                   </button>
                   <button 
                     onClick={() => setPacing('Standard')}
                     className={`flex-1 py-2 text-[10px] font-black uppercase rounded-lg transition-all ${pacing === 'Standard' ? 'bg-zinc-800 text-white shadow-lg' : 'text-zinc-600 hover:text-white'}`}
                   >
                     Steady
                   </button>
                </div>
             </div>

             <button 
               onClick={handleGenerate}
               disabled={loading || !sourceText}
               className="mt-6 w-full bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white py-4 rounded-2xl font-black uppercase text-xs tracking-widest transition-all shadow-lg shadow-blue-600/20 flex items-center justify-center gap-3 active-press"
             >
                {loading ? <Loader2 className="animate-spin" /> : <><RefreshCcw size={18} /> Transform Content</>}
             </button>
          </div>
       </div>

       {/* Output Side */}
       <div className="w-full md:w-2/3 bg-zinc-900 border border-zinc-800 rounded-[2.5rem] flex flex-col overflow-hidden shadow-2xl">
          {!result ? (
             <div className="flex-1 flex flex-col items-center justify-center text-zinc-700 gap-6 opacity-30">
               <div className="w-24 h-24 rounded-[2rem] border-4 border-dashed border-zinc-800 flex items-center justify-center">
                  <RefreshCcw size={48} className="animate-pulse" />
               </div>
               <p className="font-black uppercase tracking-[0.2em] text-xs">Output Workspace Ready</p>
             </div>
          ) : (
             <>
               {/* Tabs */}
               <div className="flex border-b border-zinc-800 bg-zinc-950 p-2 gap-1">
                  {[
                    { id: 'thread', label: 'Twitter', icon: Twitter, color: 'text-blue-400' },
                    { id: 'blog', label: 'Blog', icon: FileText, color: 'text-purple-400' },
                    { id: 'newsletter', label: 'Email', icon: Mail, color: 'text-yellow-400' },
                    { id: 'shorts', label: 'Shorts', icon: Video, color: 'text-red-400' }
                  ].map(tab => (
                    <button 
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id as any)} 
                      className={`flex-1 py-4 text-xs font-black uppercase tracking-widest flex items-center justify-center gap-2 rounded-2xl transition-all ${activeTab === tab.id ? 'bg-zinc-900 text-white shadow-lg' : 'text-zinc-500 hover:text-white'}`}
                    >
                      <tab.icon size={16} className={activeTab === tab.id ? tab.color : 'text-zinc-600'} /> 
                      <span className="hidden sm:inline">{tab.label}</span>
                    </button>
                  ))}
               </div>

               {/* Content Area */}
               <div className="flex-1 overflow-y-auto p-8 bg-[#09090b] relative custom-scrollbar">
                  
                  {/* Twitter Thread View */}
                  {activeTab === 'thread' && (
                     <div className="max-w-xl mx-auto space-y-6 animate-fade-in">
                        <div className="flex justify-between items-center mb-4">
                           <h3 className="text-lg font-bold text-white">Viral Thread</h3>
                           <button onClick={() => copyToClipboard(result.twitterThread?.join('\n\n') || '')} className="text-[10px] font-black uppercase text-zinc-500 hover:text-white flex items-center gap-2 bg-zinc-900 px-4 py-2 rounded-xl border border-zinc-800 transition-all"><Copy size={14} /> Copy All</button>
                        </div>
                        {result.twitterThread?.map((tweet, i) => (
                           <div key={i} className="flex gap-4 relative animate-scale-in" style={{ animationDelay: `${i * 0.1}s` }}>
                              {i !== (result.twitterThread?.length || 0) - 1 && <div className="absolute left-[20px] top-12 bottom-[-24px] w-[2px] bg-zinc-800"></div>}
                              <div className="w-10 h-10 rounded-2xl bg-zinc-900 shrink-0 border border-zinc-800 flex items-center justify-center text-zinc-600 font-bold text-xs">{i + 1}</div>
                              <div className="flex-1 bg-zinc-900/50 border border-zinc-800 rounded-[1.5rem] p-6 text-white text-sm leading-relaxed shadow-sm hover:border-zinc-700 transition-all">
                                 {tweet}
                              </div>
                           </div>
                        ))}
                     </div>
                  )}

                  {/* Blog View */}
                  {activeTab === 'blog' && (
                     <div className="max-w-2xl mx-auto animate-fade-in">
                        <div className="flex justify-between items-center mb-8">
                           <h3 className="text-lg font-bold text-white">Markdown Article</h3>
                           <button onClick={() => copyToClipboard(result.blogPost)} className="text-[10px] font-black uppercase text-zinc-500 hover:text-white flex items-center gap-2 bg-zinc-900 px-4 py-2 rounded-xl border border-zinc-800 transition-all"><Copy size={14} /> Copy Content</button>
                        </div>
                        <div className="prose prose-invert prose-p:text-zinc-400 prose-headings:text-white max-w-none bg-zinc-900/30 p-8 rounded-3xl border border-zinc-800">
                           <pre className="whitespace-pre-wrap font-sans text-sm md:text-base leading-relaxed">{result.blogPost}</pre>
                        </div>
                     </div>
                  )}

                  {/* Newsletter View */}
                  {activeTab === 'newsletter' && (
                     <div className="max-w-2xl mx-auto bg-white rounded-[2rem] p-10 min-h-full shadow-2xl animate-fade-in text-zinc-900">
                        <div className="flex justify-end mb-6">
                           <button onClick={() => copyToClipboard(`Subject: ${result.newsletter.subject}\n\n${result.newsletter.body}`)} className="text-[10px] font-black uppercase text-zinc-400 hover:text-zinc-600 flex items-center gap-2 transition-colors"><Copy size={14} /> Copy Template</button>
                        </div>
                        <div className="border-b-2 border-zinc-100 pb-6 mb-8">
                           <span className="text-zinc-400 text-[10px] font-black uppercase tracking-widest">Subject Line</span>
                           <h2 className="text-2xl font-black mt-2 text-zinc-900 leading-tight">{result.newsletter.subject}</h2>
                        </div>
                        <div className="whitespace-pre-wrap leading-[1.8] text-zinc-700 font-medium">
                           {result.newsletter.body}
                        </div>
                     </div>
                  )}

                  {/* Shorts Script View */}
                  {activeTab === 'shorts' && (
                     <div className="max-w-3xl mx-auto animate-fade-in">
                        <div className="flex justify-between items-center mb-8">
                           <h3 className="text-lg font-bold text-white">Shorts Production Hub</h3>
                           <div className="flex gap-2">
                             <button 
                               onClick={copyCleanShortsScript} 
                               className="text-[10px] font-black uppercase text-zinc-500 hover:text-white flex items-center gap-2 bg-zinc-900 px-4 py-2 rounded-xl border border-zinc-800 transition-all"
                             >
                                <Copy size={14} /> Spoken Only
                             </button>
                             <button 
                               onClick={() => copyToClipboard(result.shortsScript)} 
                               className="text-[10px] font-black uppercase text-zinc-500 hover:text-white flex items-center gap-2 bg-zinc-900 px-4 py-2 rounded-xl border border-zinc-800 transition-all"
                             >
                                <Copy size={14} /> Full Script
                             </button>
                           </div>
                        </div>
                        <ShortsScriptRenderer 
                          script={result.shortsScript} 
                          sourceText={sourceText}
                          onUpdate={updateShortsScript} 
                          onNavigate={onNavigate}
                        />
                     </div>
                  )}
               </div>
             </>
          )}
       </div>
    </div>
  );
};
