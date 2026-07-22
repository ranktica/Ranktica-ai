import React, { useState, useRef } from 'react';
import { rateThumbnail, compareThumbnails, ThumbnailComparison } from '@/infrastructure/gemini';
import { ThumbnailRating } from '@/shared/types';
import { Loader2, Upload, Eye, CheckCircle2, AlertTriangle, Lightbulb, Trophy, Sparkles, Layers } from 'lucide-react';
import { toast } from 'react-hot-toast';

export const ThumbnailRater: React.FC = () => {
  // State for tabs
  const [activeTab, setActiveTab] = useState<'single' | 'split'>('single');

  // Specialized LoRA Adapter State
  const [selectedLoraAdapter, setSelectedLoraAdapter] = useState<string>('viral_tech_ctr_v4');

  // State for single rater (kept intact)
  const [context, setContext] = useState('');
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [rating, setRating] = useState<ThumbnailRating | null>(null);
  const [loading, setLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // State for split rater (brand new)
  const [splitContext, setSplitContext] = useState('');
  const [splitImageA, setSplitImageA] = useState<string | null>(null);
  const [splitImageB, setSplitImageB] = useState<string | null>(null);
  const [splitResult, setSplitResult] = useState<ThumbnailComparison | null>(null);
  const [splitLoading, setSplitLoading] = useState(false);
  const fileInputARef = useRef<HTMLInputElement>(null);
  const fileInputBRef = useRef<HTMLInputElement>(null);

  // Single rating handler
  const handleRate = async () => {
    if (!uploadedImage || !context.trim()) return;
    setLoading(true);
    setRating(null);
    try {
      const result = await rateThumbnail(uploadedImage, context);
      setRating(result);
      toast.success("Single thumbnail rating generated perfectly! 🎯");
    } catch (e) {
      console.error(e);
      toast.error("Analysis failed. Please try again with another image.");
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setUploadedImage(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  // Split-testing rating handler
  const handleCompareRate = async () => {
    if (!splitImageA || !splitImageB) {
      toast.error("Please upload BOTH Variant A and Variant B thumbnails first!");
      return;
    }
    if (!splitContext.trim()) {
      toast.error("Please supply a video title or intent context first!");
      return;
    }

    setSplitLoading(true);
    setSplitResult(null);
    try {
      const result = await compareThumbnails(splitImageA, splitImageB, splitContext);
      setSplitResult(result);
      toast.success("Split-testing performance review complete! 🏆");
    } catch (e) {
      console.error(e);
      toast.error("A/B comparison failed. Please try again.");
    } finally {
      setSplitLoading(false);
    }
  };

  const handleSplitUpload = (e: React.ChangeEvent<HTMLInputElement>, target: 'A' | 'B') => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        if (target === 'A') setSplitImageA(reader.result as string);
        if (target === 'B') setSplitImageB(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-fade-in font-sans pb-16">
      {/* Visual Header */}
      <div className="text-center space-y-4 py-4 relative">
        <div className="absolute inset-0 max-w-lg mx-auto bg-purple-500/5 rounded-full blur-[100px] pointer-events-none" />
        <h2 className="text-4xl font-extrabold text-white tracking-tight flex items-center justify-center gap-3">
          <Sparkles className="text-purple-400" size={28} /> Thumbnail CTR Studio
        </h2>
        <p className="text-zinc-400 max-w-xl mx-auto text-sm leading-relaxed">
          Predict click intent and visual retention rates. Choose between diagnostic review or side-by-side A/B split-testing.
        </p>

        {/* Tab Selectors */}
        <div className="flex justify-center mt-6">
          <div className="inline-flex bg-zinc-950 p-1 border border-zinc-850 rounded-2xl">
            <button
              type="button"
              onClick={() => setActiveTab('single')}
              className={`px-5 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer ${
                activeTab === 'single'
                  ? 'bg-purple-600 text-white shadow-lg shadow-purple-600/15'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              <span className="flex items-center gap-1.5"><Eye size={12} /> Diagnostic Rater</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('split')}
              className={`px-5 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer ${
                activeTab === 'split'
                  ? 'bg-purple-600 text-white shadow-lg shadow-purple-600/15'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              <span className="flex items-center gap-1.5"><Layers size={12} /> A/B Split Tester</span>
            </button>
          </div>
        </div>

        {/* Specialized LoRA Model Adapter Selector */}
        <div className="max-w-2xl mx-auto mt-4 bg-zinc-900/80 border border-zinc-800 rounded-2xl p-4 text-left space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-mono font-bold text-purple-400 uppercase tracking-widest flex items-center gap-1.5">
              <Sparkles size={12} /> Specialized LoRA Adapter Active
            </span>
            <span className="text-[9px] font-mono text-zinc-500">Fine-Tuned Weights</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
            {[
              { id: 'viral_tech_ctr_v4', name: 'Viral Tech CTR v4.2', desc: 'Trained on 10k tech thumbnails' },
              { id: 'mrbeast_glow_v3', name: 'MrBeast Glow v3.1', desc: 'High-contrast challenge style' },
              { id: 'cyberpunk_dark_v2', name: 'Cyberpunk Aesthetic v2', desc: 'Dark high-contrast review' }
            ].map((adapter) => (
              <button
                key={adapter.id}
                type="button"
                onClick={() => {
                  setSelectedLoraAdapter(adapter.id);
                  toast.success(`Loaded LoRA Adapter: ${adapter.name}`);
                }}
                className={`p-2.5 rounded-xl border text-left transition-all ${
                  selectedLoraAdapter === adapter.id
                    ? 'bg-purple-950/60 border-purple-500 text-white'
                    : 'bg-zinc-950 border-zinc-800 text-zinc-400 hover:text-zinc-200'
                }`}
              >
                <div className="text-xs font-bold">{adapter.name}</div>
                <div className="text-[9px] text-zinc-500">{adapter.desc}</div>
              </button>
            ))}
          </div>
        </div>
      </div>

      {activeTab === 'single' ? (
        /* --- SINGLE DIAGNOSTIC TAB --- */
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 text-left">
          {/* Upload & Input Section */}
          <div className="space-y-6">
            <div 
               onClick={() => fileInputRef.current?.click()}
               className="w-full aspect-video border-2 border-dashed border-zinc-800 hover:border-purple-500 rounded-[2rem] flex flex-col items-center justify-center cursor-pointer bg-zinc-950 transition-colors relative group overflow-hidden"
             >
               {uploadedImage ? (
                 <>
                    <img src={uploadedImage} alt="Thumbnail Diagnostic" className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-black/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                      <span className="text-white font-black text-xs uppercase tracking-wider flex items-center gap-2 bg-zinc-950/80 px-4 py-2 rounded-xl"><Upload size={14} /> Replace Thumbnail</span>
                    </div>
                 </>
               ) : (
                 <div className="text-zinc-550 flex flex-col items-center gap-3 select-none">
                    <div className="p-4 rounded-full bg-zinc-900 border border-zinc-850 text-purple-400 group-hover:scale-105 transition-transform"><Upload size={28} /></div>
                    <span className="text-xs font-bold uppercase tracking-wider">Drag or click to choose Thumbnail</span>
                    <span className="text-[10px] text-zinc-600 font-mono">Recommended (1280x720) PNG/JPG</span>
                 </div>
               )}
               <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleFileUpload} />
            </div>

            <div className="bg-zinc-950/40 p-6 border border-zinc-850/60 rounded-3xl space-y-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-black uppercase text-zinc-400 tracking-widest">Target Context / Video Title</label>
                <input
                  type="text"
                  value={context}
                  onChange={(e) => setContext(e.target.value)}
                  placeholder="e.g. I Spent 100 Days in a Cybersecurity Isolation Chamber"
                  className="w-full bg-zinc-950 border border-zinc-850 rounded-xl px-4 py-3 text-sm text-white focus:ring-1 focus:ring-purple-500/50 outline-none placeholder-zinc-600 font-medium"
                />
              </div>

              <button
                onClick={handleRate}
                disabled={loading || !uploadedImage || !context.trim()}
                className="w-full bg-purple-600 hover:bg-purple-500 disabled:opacity-30 disabled:pointer-events-none text-white py-3.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all shadow-[0_0_20px_rgba(147,51,234,0.15)] flex items-center justify-center gap-2 cursor-pointer"
              >
                {loading ? <Loader2 className="animate-spin" size={14} /> : <><Eye size={14} /> Analyze CTR Diagnostics</>}
              </button>
            </div>
          </div>

          {/* Results Section */}
          <div className="bg-zinc-900 border border-zinc-800 rounded-[2.5rem] p-8 min-h-[400px] relative flex flex-col justify-between">
            {loading && (
               <div className="absolute inset-0 flex flex-col items-center justify-center text-purple-400 bg-zinc-950/85 z-10 rounded-[2.5rem] backdrop-blur-sm">
                  <Loader2 className="animate-spin mb-4 text-purple-400" size={36} />
                  <p className="text-zinc-200 text-sm font-black uppercase tracking-wider animate-pulse">Running Neural CTR Check...</p>
                  <p className="text-zinc-500 text-[10px] mt-1">Simulating target viewer behavior models</p>
               </div>
            )}

            {!rating && !loading && (
              <div className="absolute inset-0 flex flex-col items-center justify-center text-zinc-600 py-16">
                 <Eye size={42} className="mb-3 text-zinc-800" />
                 <p className="text-sm font-bold text-zinc-500">Awaiting CTR diagnostic scanning...</p>
                 <p className="text-xs text-zinc-650 max-w-sm text-center mt-1 leading-normal">Supply context, load your image file into the slots, and press analyze to read ratings.</p>
              </div>
            )}

            {rating && (
              <div className="space-y-6">
                 <div className="flex items-center justify-between border-b border-zinc-850/60 pb-5">
                   <div>
                     <h3 className="text-lg font-extrabold text-white">Diagnostics Verdict</h3>
                     <p className="text-[10px] text-zinc-500 mt-1 uppercase tracking-widest font-mono">Gemini Multimodal rating</p>
                   </div>
                   <div className={`px-5 py-2.5 rounded-2xl font-black text-2xl border ${
                      rating.score >= 80 ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' :
                      rating.score >= 60 ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' :
                      'bg-red-500/10 text-red-400 border-red-500/20'
                   }`}>
                     {rating.score}
                     <span className="text-[11px] text-zinc-600 font-bold ml-1">/100</span>
                   </div>
                 </div>

                 <div className="space-y-4">
                    <div className="space-y-2">
                       <h4 className="text-xs font-black uppercase text-emerald-400 flex items-center gap-2 uppercase tracking-widest"><CheckCircle2 size={14} /> Areas Of Strong CTR Appeal</h4>
                       <ul className="text-xs text-zinc-300 space-y-2.5 list-none">
                         {rating.strengths?.map((s, i) => (
                           <li key={i} className="bg-zinc-950/40 p-2.5 border border-zinc-850/40 rounded-xl leading-relaxed flex items-start gap-2">
                             <span className="text-emerald-500 shrink-0 font-bold">•</span>
                             <span>{s}</span>
                           </li>
                         ))}
                       </ul>
                    </div>

                    <div className="space-y-2">
                       <h4 className="text-xs font-black uppercase text-red-400 flex items-center gap-2 uppercase tracking-widest"><AlertTriangle size={14} /> Conversion Obstacles</h4>
                       <ul className="text-xs text-zinc-300 space-y-2.5 list-none">
                         {rating.weaknesses?.map((s, i) => (
                           <li key={i} className="bg-zinc-950/40 p-2.5 border border-zinc-850/40 rounded-xl leading-relaxed flex items-start gap-2">
                             <span className="text-red-500 shrink-0 font-bold">•</span>
                             <span>{s}</span>
                           </li>
                         ))}
                       </ul>
                    </div>

                    <div className="p-5 bg-purple-500/5 border border-purple-500/15 rounded-2xl mt-4">
                       <h4 className="text-xs font-black text-purple-300 flex items-center gap-2 mb-2 uppercase tracking-widest"><Lightbulb size={14} /> Optimization Action Plan</h4>
                       <p className="text-xs text-zinc-300 leading-relaxed font-medium">{rating.suggestions}</p>
                    </div>
                 </div>
              </div>
            )}
          </div>
        </div>
      ) : (
        /* --- A/B SPLIT TESTING TAB --- */
        <div className="space-y-8 text-left">
          {/* Side-by-Side Upload Slots */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Variant A */}
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-xs font-black uppercase text-zinc-400 tracking-wider">A: Target Baseline Variant</span>
                {splitImageA && <span className="text-[10px] bg-indigo-500/10 text-indigo-400 px-2 py-0.5 rounded-full border border-indigo-500/20 font-bold">Loaded</span>}
              </div>
              <div 
                 onClick={() => fileInputARef.current?.click()}
                 className={`w-full aspect-video border-2 border-dashed border-zinc-800 hover:border-indigo-500 rounded-[2rem] flex flex-col items-center justify-center cursor-pointer bg-zinc-950 transition-all relative group overflow-hidden ${
                   splitImageA ? 'shadow-lg shadow-indigo-500/5' : ''
                 }`}
               >
                 {splitImageA ? (
                   <>
                      <img src={splitImageA} alt="Thumbnail Context A" className="w-full h-full object-cover" />
                      <div className="absolute inset-0 bg-black/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                        <span className="text-white font-bold text-xs uppercase tracking-wider flex items-center gap-1.5 bg-zinc-950/80 px-4 py-2 rounded-xl"><Upload size={12} /> Change Variant A</span>
                      </div>
                   </>
                 ) : (
                   <div className="text-zinc-550 flex flex-col items-center gap-3 select-none">
                      <div className="p-3 bg-zinc-900 border border-zinc-850 rounded-2xl text-indigo-400"><Upload size={24} /></div>
                      <span className="text-xs font-bold uppercase tracking-wider text-zinc-500">Pick Variant A Image</span>
                      <span className="text-[9px] text-zinc-600 font-mono">Click to upload file</span>
                   </div>
                 )}
                 <input type="file" ref={fileInputARef} className="hidden" accept="image/*" onChange={(e) => handleSplitUpload(e, 'A')} />
              </div>
            </div>

            {/* Variant B */}
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-xs font-black uppercase text-zinc-400 tracking-wider">B: Alternate Challenger Variant</span>
                {splitImageB && <span className="text-[10px] bg-rose-500/10 text-rose-400 px-2 py-0.5 rounded-full border border-rose-500/20 font-bold">Loaded</span>}
              </div>
              <div 
                 onClick={() => fileInputBRef.current?.click()}
                 className={`w-full aspect-video border-2 border-dashed border-zinc-800 hover:border-rose-500 rounded-[2rem] flex flex-col items-center justify-center cursor-pointer bg-zinc-950 transition-all relative group overflow-hidden ${
                   splitImageB ? 'shadow-lg shadow-rose-500/5' : ''
                 }`}
               >
                 {splitImageB ? (
                   <>
                      <img src={splitImageB} alt="Thumbnail Context B" className="w-full h-full object-cover" />
                      <div className="absolute inset-0 bg-black/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                        <span className="text-white font-bold text-xs uppercase tracking-wider flex items-center gap-1.5 bg-zinc-950/80 px-4 py-2 rounded-xl"><Upload size={12} /> Change Variant B</span>
                      </div>
                   </>
                 ) : (
                   <div className="text-zinc-550 flex flex-col items-center gap-3 select-none">
                      <div className="p-3 bg-zinc-900 border border-zinc-850 rounded-2xl text-rose-400"><Upload size={24} /></div>
                      <span className="text-xs font-bold uppercase tracking-wider text-zinc-500">Pick Variant B Image</span>
                      <span className="text-[9px] text-zinc-600 font-mono">Click to upload file</span>
                   </div>
                 )}
                 <input type="file" ref={fileInputBRef} className="hidden" accept="image/*" onChange={(e) => handleSplitUpload(e, 'B')} />
              </div>
            </div>
          </div>

          {/* Test Controls panel */}
          <div className="bg-zinc-950 border border-zinc-850 p-6 rounded-3xl grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
            <div className="md:col-span-2 space-y-1.5">
              <label className="text-[10px] font-black uppercase text-zinc-400 tracking-widest">Shared Title Content / Intent Context</label>
              <input
                type="text"
                value={splitContext}
                onChange={(e) => setSplitContext(e.target.value)}
                placeholder="e.g. My Team Built a Functional Fusion Reactor (Prediction context)"
                className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3 text-xs text-white focus:ring-1 focus:ring-purple-500/50 outline-none placeholder-zinc-650"
              />
            </div>
            <button
              onClick={handleCompareRate}
              disabled={splitLoading || !splitImageA || !splitImageB || !splitContext.trim()}
              className="w-full bg-purple-600 hover:bg-purple-500 disabled:opacity-30 disabled:pointer-events-none text-white py-3.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all shadow-[0_0_20px_rgba(147,51,234,0.15)] flex items-center justify-center gap-2 cursor-pointer"
            >
              {splitLoading ? <Loader2 className="animate-spin" size={14} /> : <><Sparkles size={14} className="fill-white" /> Run CTR Split Test</>}
            </button>
          </div>

          {/* Comparative Results Area */}
          <div className="bg-zinc-900 border border-zinc-800 rounded-[2.5rem] p-8 min-h-[400px] relative">
            {splitLoading && (
               <div className="absolute inset-0 flex flex-col items-center justify-center text-purple-400 bg-zinc-950/90 z-20 rounded-[2.5rem] backdrop-blur-sm">
                  <Loader2 className="animate-spin mb-4 text-purple-550" size={40} />
                  <p className="text-zinc-200 text-sm font-black uppercase tracking-widest animate-pulse">Running Comparative A/B Test...</p>
                  <p className="text-zinc-500 text-[10px] mt-1.5 max-w-sm text-center font-mono leading-relaxed">Evaluating gaze flows, semantic contrast, and predicted click-through frequencies through multi-layered visual grids.</p>
               </div>
            )}

            {!splitResult && !splitLoading && (
              <div className="absolute inset-0 flex flex-col items-center justify-center text-zinc-600 py-16">
                 <Layers size={45} className="mb-3 text-zinc-800" />
                 <p className="text-sm font-bold text-zinc-550 uppercase tracking-widest">Awaiting Split-Test parameters</p>
                 <p className="text-xs text-zinc-600 max-w-sm text-center mt-1 leading-normal">Load both visual alternates, designate target context, and trigger assessment model to render winner.</p>
              </div>
            )}

            {splitResult && (
              <div className="space-y-8 animate-in fade-in duration-300">
                {/* Huge Winner Banner */}
                <div className="bg-zinc-950 border border-zinc-850 rounded-[2rem] p-6 flex flex-col md:flex-row items-center justify-between gap-6 relative overflow-hidden">
                  <div className="absolute -top-12 -left-12 w-48 h-48 bg-purple-500/5 rounded-full blur-[60px] pointer-events-none" />
                  
                  <div className="flex items-center gap-4.5 text-left">
                    <div className="bg-yellow-500/15 p-3.5 rounded-2xl border border-yellow-500/20 text-yellow-500 shrink-0 animate-bounce">
                      <Trophy size={32} className="fill-yellow-500/20" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-black bg-purple-600/25 border border-purple-500/30 text-purple-300 px-3 py-0.5 rounded-full uppercase tracking-widest font-mono">CTR WINNER</span>
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block" />
                      </div>
                      <h3 className="text-2xl font-black text-white mt-1">
                        {splitResult.winner === 'variantA' ? 'Variant A (Baseline)' : 'Variant B (Challenger)'}
                      </h3>
                      <p className="text-xs text-zinc-400 mt-2 leading-relaxed">
                        {splitResult.winnerExplanation}
                      </p>
                    </div>
                  </div>

                  <div className="bg-yellow-500/10 border border-yellow-500/20 px-6 py-4 rounded-2xl shrink-0 text-center">
                    <span className="text-[9px] font-black text-yellow-500 uppercase tracking-widest block mb-1">CTR Advantage</span>
                    <span className="text-4xl font-extrabold text-white font-mono">
                      {splitResult.winner === 'variantA' ? splitResult.variantA.predictedCtr : splitResult.variantB.predictedCtr}%
                    </span>
                    <span className="text-[10px] text-zinc-550 block mt-1 font-bold">Predicted CTR</span>
                  </div>
                </div>

                {/* Side-by-Side Diagnostic Breakdown */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 text-left">
                  {/* Variant A Diagnostics */}
                  <div className={`border rounded-[2rem] p-6 flex flex-col justify-between transition-all ${
                     splitResult.winner === 'variantA' 
                       ? 'bg-purple-950/15 border-purple-500/20 shadow-lg shadow-purple-500/5' 
                       : 'bg-zinc-950/40 border-zinc-850/60 opacity-70'
                  }`}>
                    <div>
                      <div className="flex justify-between items-center pb-4 border-b border-zinc-850 mb-5">
                        <span className="text-sm font-black text-white flex items-center gap-2">
                          Variant A {splitResult.winner === 'variantA' ? '🏆 Winner' : ''}
                        </span>
                        <div className="text-right">
                          <span className="text-[10px] text-zinc-550 block font-bold mb-0.5 uppercase tracking-wider">Estimated CTR</span>
                          <span className="text-2xl font-black text-white font-mono">{splitResult.variantA.predictedCtr}%</span>
                        </div>
                      </div>

                      <div className="space-y-4">
                        <div className="space-y-2">
                          <h4 className="text-[10px] font-black uppercase text-zinc-400 tracking-wider">Psychological Triggers:</h4>
                          <div className="flex flex-wrap gap-1.5">
                            {splitResult.variantA.psychologicalTriggers?.map((trig, i) => (
                              <span key={i} className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[10px] font-bold px-2.5 py-1 rounded-xl">
                                💡 {trig}
                              </span>
                            ))}
                            {(!splitResult.variantA.psychologicalTriggers || splitResult.variantA.psychologicalTriggers.length === 0) && (
                              <span className="text-xs text-zinc-500">None detected.</span>
                            )}
                          </div>
                        </div>

                        <div className="space-y-2">
                          <h4 className="text-[10px] font-black uppercase text-zinc-400 tracking-wider">Identified Weaknesses:</h4>
                          <ul className="space-y-1">
                            {splitResult.variantA.weaknesses?.map((wk, i) => (
                              <li key={i} className="text-xs text-zinc-400 flex items-start gap-1.5 leading-relaxed">
                                <span className="text-red-500 shrink-0">•</span>
                                <span>{wk}</span>
                              </li>
                            ))}
                            {(!splitResult.variantA.weaknesses || splitResult.variantA.weaknesses.length === 0) && (
                              <span className="text-xs text-zinc-500 font-medium">None detected! Extremely solid.</span>
                            )}
                          </ul>
                        </div>
                      </div>
                    </div>

                    <div className="mt-8 pt-4 border-t border-zinc-850/60 flex justify-between items-center">
                      <span className="text-[9px] text-zinc-500 font-black uppercase tracking-wider">Baseline diagnostic</span>
                      <span className="text-xs font-black text-zinc-400 font-mono">Score: {splitResult.variantA.score}/100</span>
                    </div>
                  </div>

                  {/* Variant B Diagnostics */}
                  <div className={`border rounded-[2rem] p-6 flex flex-col justify-between transition-all ${
                     splitResult.winner === 'variantB' 
                       ? 'bg-purple-950/15 border-purple-500/20 shadow-lg shadow-purple-500/5' 
                       : 'bg-zinc-950/40 border-zinc-850/60 opacity-70'
                  }`}>
                    <div>
                      <div className="flex justify-between items-center pb-4 border-b border-zinc-850 mb-5">
                        <span className="text-sm font-black text-white flex items-center gap-2">
                          Variant B {splitResult.winner === 'variantB' ? '🏆 Winner' : ''}
                        </span>
                        <div className="text-right">
                          <span className="text-[10px] text-zinc-550 block font-bold mb-0.5 uppercase tracking-wider">Estimated CTR</span>
                          <span className="text-2xl font-black text-white font-mono">{splitResult.variantB.predictedCtr}%</span>
                        </div>
                      </div>

                      <div className="space-y-4">
                        <div className="space-y-2">
                          <h4 className="text-[10px] font-black uppercase text-zinc-400 tracking-wider">Psychological Triggers:</h4>
                          <div className="flex flex-wrap gap-1.5">
                            {splitResult.variantB.psychologicalTriggers?.map((trig, i) => (
                              <span key={i} className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[10px] font-bold px-2.5 py-1 rounded-xl">
                                💡 {trig}
                              </span>
                            ))}
                            {(!splitResult.variantB.psychologicalTriggers || splitResult.variantB.psychologicalTriggers.length === 0) && (
                              <span className="text-xs text-zinc-500">None detected.</span>
                            )}
                          </div>
                        </div>

                        <div className="space-y-2">
                          <h4 className="text-[10px] font-black uppercase text-zinc-400 tracking-wider">Identified Weaknesses:</h4>
                          <ul className="space-y-1">
                            {splitResult.variantB.weaknesses?.map((wk, i) => (
                              <li key={i} className="text-xs text-zinc-400 flex items-start gap-1.5 leading-relaxed">
                                <span className="text-red-500 shrink-0">•</span>
                                <span>{wk}</span>
                              </li>
                            ))}
                            {(!splitResult.variantB.weaknesses || splitResult.variantB.weaknesses.length === 0) && (
                              <span className="text-xs text-zinc-500 font-medium">None detected! Extremely solid.</span>
                            )}
                          </ul>
                        </div>
                      </div>
                    </div>

                    <div className="mt-8 pt-4 border-t border-zinc-850/60 flex justify-between items-center">
                      <span className="text-[9px] text-zinc-500 font-black uppercase tracking-wider">Challenger diagnostic</span>
                      <span className="text-xs font-black text-zinc-400 font-mono">Score: {splitResult.variantB.score}/100</span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
