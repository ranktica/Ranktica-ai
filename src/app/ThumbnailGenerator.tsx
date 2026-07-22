import React, { useState, useRef, useEffect } from 'react';
import { generateThumbnail, editImage, enhanceThumbnailPrompt } from '@/infrastructure/gemini';
import { 
  Loader2, 
  Image as ImageIcon, 
  Download, 
  Wand2, 
  Upload, 
  Sparkles, 
  Zap, 
  Monitor, 
  Smartphone, 
  Square,
  ChevronRight,
  Focus,
  Lock,
  ShieldCheck,
  Star,
  Camera,
  Sun,
  Trash2,
  RefreshCw,
  Sliders,
  Layers,
  Sparkle
} from 'lucide-react';
import { useAuth } from '@/infrastructure/auth/AuthContext';
import { toast } from 'react-hot-toast';
import { logActivity } from '@/shared/activityLogger';
import { useProject } from './ProjectContext';
import { useCommand } from '@/shared/CommandContext';
import { triggerHapticFeedback } from '@/shared/haptics';

const STYLES = ['Photorealistic', '3D Render', 'Anime / Manga', 'Cyberpunk', 'Minimalist'];
const ASPECT_RATIOS = [
  { id: '16:9', label: 'YouTube Video', icon: <Monitor size={14} />, ratio: '16:9' },
  { id: '9:16', label: 'Shorts / Reels', icon: <Smartphone size={14} />, ratio: '9:16' },
  { id: '1:1', label: 'Square Post', icon: <Square size={14} />, ratio: '1:1' }
];

const THUMBNAIL_BLUEPRINTS = [
  {
    id: 'ranktica-requested',
    label: 'Ranktica AI: Requested Build',
    prompt: 'Ranktica AI for YouTube Automation. A futuristic neural interface, glowing tech-noir workstation, ultra-high resolution, sharp details, cinematic anamorphic flares, depth of field.',
    style: 'Cyberpunk',
    lighting: 'Neon Night Ambient',
    motion: 'Cinematic Anamorphic Flares'
  },
  {
    id: 'ranktica-cyber',
    label: 'Ranktica AI: Neural Core',
    prompt: 'A high-fidelity cinematic visualization of Ranktica AI neural core. A futuristic creator workstation glowing with holographic YouTube data, neon red and orange, octane render.',
    style: 'Cyberpunk',
    lighting: 'Bioluminescent'
  },
  {
    id: 'tech-unboxing',
    label: 'Tech Unboxing: Neon Glow',
    prompt: 'Ultra high-tech smartphones unboxing on a dark reflective surface, cinematic cyan and pink lighting, extreme detail, depth of field, high contrast, studio photography.',
    style: 'Photorealistic',
    lighting: 'Cyberpunk Studio Spotlight'
  },
  {
    id: 'anime-epic',
    label: 'Anime: High Action Splash',
    prompt: 'Epic futuristic samurai anime-style splash art, dramatic sword pose, vibrant particles, motion lines, orange and purple color palette, masterpiece.',
    style: 'Anime / Manga',
    lighting: 'Dynamic Lightning Flare'
  }
];

export const ThumbnailGenerator: React.FC<any> = ({ prefill }) => {
  const [mode, setMode] = useState<'generate' | 'edit'>('generate');
  const [genMode, setGenMode] = useState<'fast' | 'pro'>('fast');
  const [prompt, setPrompt] = useState(THUMBNAIL_BLUEPRINTS[0].prompt);
  const [style, setStyle] = useState(THUMBNAIL_BLUEPRINTS[0].style);
  const [aspectRatio, setAspectRatio] = useState<string>('16:9');
  const [imageSize, setImageSize] = useState<string>('1K');
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [resultImage, setResultImage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [enhancing, setEnhancing] = useState(false);
  const [hasApiKey, setHasApiKey] = useState(false);
  const [checkingKey, setCheckingKey] = useState(true);
  const [dragActive, setDragActive] = useState(false);
  
  // Custom cycling visual loading text
  const [loadingText, setLoadingText] = useState('Initiating Synthesis...');
  
  const { incrementStat } = useAuth();
  const { activeProject, updateActiveProject } = useProject();
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle');

  // Load draft on project load
  useEffect(() => {
    if (activeProject) {
      const draft = activeProject.assets?.thumbnailDraft;
      if (draft) {
        if (draft.prompt) setPrompt(draft.prompt);
        if (draft.style) setStyle(draft.style);
        if (draft.aspectRatio) setAspectRatio(draft.aspectRatio);
        if (draft.genMode) setGenMode(draft.genMode);
        if (draft.imageSize) setImageSize(draft.imageSize);
        if (draft.mode) setMode(draft.mode);
      }
    }
  }, [activeProject?.id]);

  // Auto-save draft logic
  useEffect(() => {
    if (!activeProject) return;

    const currentDraft = activeProject.assets?.thumbnailDraft || {};
    if (
      prompt === (currentDraft.prompt || '') &&
      style === (currentDraft.style || '') &&
      aspectRatio === (currentDraft.aspectRatio || '') &&
      genMode === (currentDraft.genMode || '') &&
      imageSize === (currentDraft.imageSize || '') &&
      mode === (currentDraft.mode || '')
    ) {
      return;
    }

    setSaveStatus('saving');
    const timer = setTimeout(async () => {
      try {
        await updateActiveProject({
          assets: {
            ...activeProject.assets,
            thumbnailDraft: {
              prompt,
              style,
              aspectRatio,
              genMode,
              imageSize,
              mode
            }
          }
        });
        setSaveStatus('saved');
        setTimeout(() => setSaveStatus('idle'), 1500);
      } catch (err) {
        console.error('[Thumbnail Draft Auto-Save Fail]', err);
        setSaveStatus('idle');
      }
    }, 3000); // 3 seconds timeout

    return () => clearTimeout(timer);
  }, [prompt, style, aspectRatio, genMode, imageSize, mode, activeProject]);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const { registerCommand } = useCommand();

  const lastPromptRef = useRef(prompt);

  const handlePromptBlur = () => {
    if (prompt !== lastPromptRef.current) {
      const oldVal = lastPromptRef.current;
      const newVal = prompt;
      registerCommand(
        'Thumbnail Studio',
        `Edited visual concept prompt`,
        () => setPrompt(oldVal),
        () => setPrompt(newVal)
      );
      lastPromptRef.current = prompt;
    }
  };

  useEffect(() => {
    if (activeProject?.assets?.thumbnail && !resultImage) {
      setResultImage(activeProject.assets.thumbnail);
    }
  }, [activeProject, resultImage]);

  useEffect(() => {
    if (prefill) {
      if (typeof prefill === 'string') {
        setPrompt(prefill);
      } else if (prefill.prompt) {
        setPrompt(prefill.prompt);
      } else if (prefill.title) {
        setPrompt(`YouTube Thumbnail for "${prefill.title}". Eye-catching visual style, high dramatic composition`);
      }
    }
  }, [prefill]);

  useEffect(() => {
    const checkKey = async () => {
      try {
        if (window.aistudio) {
          const selected = await window.aistudio.hasSelectedApiKey();
          setHasApiKey(Boolean(selected));
        }
      } catch (e) {
        console.warn('AI Studio key check skipped:', e);
      }
      setCheckingKey(false);
    };
    checkKey();
  }, []);

  // Cycle loading messages when loading
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (loading) {
      const messages = [
        'Casting latent seeds in visual space...',
        'Refining volumetric light projections...',
        'Diffusing premium color pixels...',
        'Orchestrating geometric composition layers...',
        'Assembling ultra high-fidelity texture maps...',
        'Polishing contrast boundaries...'
      ];
      let index = 0;
      setLoadingText(messages[0]);
      interval = setInterval(() => {
        index = (index + 1) % messages.length;
        setLoadingText(messages[index]);
      }, 2500);
    }
    return () => clearInterval(interval);
  }, [loading]);

  const handleEnhancePrompt = async () => {
    if (!prompt.trim()) {
      toast.error('Please enter a concept to enhance');
      return;
    }
    setEnhancing(true);
    const id = toast.loading('Re-engineering prompt for AI model optimization...');
    const oldPrompt = prompt;
    try {
      const enhanced = await enhanceThumbnailPrompt(prompt);
      setPrompt(enhanced);
      toast.success('Prompt optimized with professional texture attributes!', { id });

      registerCommand(
        'Thumbnail Studio',
        `Enhanced thumbnail core concept`,
        () => {
          setPrompt(oldPrompt);
        },
        () => {
          setPrompt(enhanced);
        }
      );
    } catch (err) {
      console.error(err);
      toast.error('Failed to enhance prompt', { id });
    } finally {
      setEnhancing(false);
    }
  };

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (mode === 'generate' && !prompt.trim()) {
      toast.error('Concept manifest is empty');
      return;
    }
    if (mode === 'edit' && !uploadedImage) {
      toast.error('Please upload a source image first');
      return;
    }
    if (mode === 'edit' && !prompt.trim()) {
      toast.error('Please specify visual transformation instructions');
      return;
    }

    if (genMode === 'pro' && !hasApiKey) {
      try {
        if (window.aistudio) {
          await window.aistudio.openSelectKey();
          setHasApiKey(true);
        } else {
          toast('Fast mode will handle this automatically. Switch to Pro mode when API Key is active.', { icon: 'ℹ️' });
        }
      } catch (e) {
        console.warn(e);
      }
    }

    setLoading(true);
    const preGenImage = resultImage;
    setResultImage(null);
    const id = toast.loading(mode === 'generate' ? 'Synthesizing visuals from latent parameters...' : 'Transforming source image pixels...');

    try {
      const blueprint = THUMBNAIL_BLUEPRINTS.find(b => b.prompt === prompt);
      const lightingCue = blueprint?.lighting ? ` Lighting: ${blueprint.lighting}.` : '';
      const motionCue = blueprint?.lighting ? ` Composition cue: ${blueprint.prompt.substring(0, 50)}.` : '';
      
      const url = mode === 'generate' 
          ? await generateThumbnail(prompt + lightingCue + motionCue, style, genMode, aspectRatio, imageSize)
          : await editImage(uploadedImage!, prompt);
      
      if (url) {
        setResultImage(url);
        incrementStat('thumbnailsCreated');
        if (activeProject) {
          updateActiveProject({
            assets: {
              ...activeProject.assets,
              thumbnail: url
            }
          });
        }
        logActivity(`Synthesized professional ${aspectRatio} CTR Thumbnail block incorporating ${style} style parameters`, "Thumbnail Studio", "thumbnail");
        triggerHapticFeedback([100, 50, 100]);
        toast.success('Visual artifact materialized successfully!', { id });

        registerCommand(
          'Thumbnail Studio',
          mode === 'generate' ? `Synthesized thumbnail design` : `Transformed image`,
          () => {
            setResultImage(preGenImage);
          },
          () => {
            setResultImage(url);
          }
        );
      } else {
        throw new Error('Emptied output received');
      }
    } catch (err) {
      console.error(err);
      toast.error('Synthesis failed. Invoking high-fidelity visual backup...', { id });
      // Ultimate visual backup so app never crashes and behaves robustly
      const seed = Math.floor(Math.random() * 1000);
      const backupUrl = `https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=1200&q=80&sig=${seed}`;
      setResultImage(backupUrl);
      if (activeProject) {
        updateActiveProject({
          assets: {
            ...activeProject.assets,
            thumbnail: backupUrl
          }
        });
      }

      registerCommand(
        'Thumbnail Studio',
        `Synthesized fallback thumbnail`,
        () => {
          setResultImage(preGenImage);
        },
        () => {
          setResultImage(backupUrl);
        }
      );
    } finally {
      setLoading(false);
    }
  };

  const applyBlueprint = (bp: typeof THUMBNAIL_BLUEPRINTS[0]) => {
    const oldPrompt = prompt;
    const oldStyle = style;

    setPrompt(bp.prompt);
    setStyle(bp.style);
    toast.success(`Adopted style: ${bp.style}`);

    registerCommand(
      'Thumbnail Studio',
      `Applied preset: "${bp.label}"`,
      () => {
        setPrompt(oldPrompt);
        setStyle(oldStyle);
      },
      () => {
        setPrompt(bp.prompt);
        setStyle(bp.style);
      }
    );
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onloadend = () => {
          setUploadedImage(reader.result as string);
          toast.success('Source image registered!');
        };
        reader.readAsDataURL(file);
      } else {
        toast.error('Please drop an image file');
      }
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onloadend = () => {
          setUploadedImage(reader.result as string);
          toast.success('Source image registered!');
        };
        reader.readAsDataURL(file);
      } else {
        toast.error('Please upload an image file');
      }
    }
  };

  const handleDownload = () => {
    if (!resultImage) return;
    const link = document.createElement('a');
    link.href = resultImage;
    link.download = `ranktica-thumbnail-${Date.now()}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('Downloaded visual resource!');
  };

  const resetAll = () => {
    setResultImage(null);
    setUploadedImage(null);
    setPrompt('');
    toast.success('Workspace reset');
  };

  return (
    <div id="thumbnail_studio_scope" className="h-[calc(100vh-6rem)] flex flex-col animate-fade-in pb-4">
      {/* Header controls with high-fidelity toggle tabs */}
      <header className="flex flex-col md:flex-row md:items-center justify-between py-4 border-b border-zinc-800 shrink-0 mb-6 gap-4">
        <div>
          <h2 className="text-3xl font-extrabold text-white tracking-tight flex items-center gap-3">
             <ImageIcon className="text-orange-500" /> Thumbnail Studio
          </h2>
          <p className="text-zinc-400 text-sm font-medium">Professional Neural Architecture for CTR Maximization</p>
        </div>
        <div className="flex bg-zinc-900/50 rounded-2xl p-1 border border-zinc-800 self-start md:self-auto shadow-lg">
          <button 
            type="button"
            onClick={() => { setMode('generate'); setResultImage(null); }} 
            className={`px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center gap-2 ${mode === 'generate' ? 'bg-orange-600 text-white shadow' : 'text-zinc-400 hover:text-zinc-200'}`}
          >
            <Sparkles size={14} /> Latent Generator
          </button>
          <button 
            type="button"
            onClick={() => { setMode('edit'); setResultImage(null); }} 
            className={`px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center gap-2 ${mode === 'edit' ? 'bg-orange-600 text-white shadow' : 'text-zinc-400 hover:text-zinc-200'}`}
          >
            <RefreshCw size={14} /> AI Pixel Editor
          </button>
        </div>
      </header>

      <div className="flex-1 flex flex-col lg:flex-row gap-8 min-h-0">
        {/* Left Interactive Workspace Controls */}
        <div className="w-full lg:w-[420px] flex flex-col gap-6 overflow-y-auto pr-3 custom-scrollbar shrink-0">
          <div className="bg-zinc-900/90 border border-zinc-800/80 rounded-[2rem] p-6 space-y-6 shadow-2xl relative">
             <div className="absolute top-0 right-0 w-32 h-32 bg-orange-600/5 rounded-full blur-2xl pointer-events-none" />

             {/* Mode Selective Config */}
             {mode === 'generate' ? (
                // Studio Model presets
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="text-[10px] font-black text-zinc-450 uppercase tracking-[0.2em] flex items-center gap-2">
                      <Star size={12} className="text-orange-500 fill-orange-500/30" /> Neural Blueprints
                    </h3>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                     {THUMBNAIL_BLUEPRINTS.map(bp => (
                       <button 
                         type="button"
                         key={bp.id} 
                         onClick={() => applyBlueprint(bp)} 
                         className={`w-full text-left p-2.5 bg-zinc-950/80 border rounded-xl transition-all duration-300 hover:border-zinc-700 ${prompt === bp.prompt ? 'border-orange-500 ring-1 ring-orange-500/20' : 'border-zinc-800/80'}`}
                       >
                          <span className="text-[9px] font-black tracking-wide text-zinc-450 block truncate">{bp.label}</span>
                          <p className="text-[9px] text-zinc-650 line-clamp-1 mt-0.5">{bp.prompt}</p>
                       </button>
                     ))}
                  </div>
                </div>
             ) : (
                // Edit Model Image Upload
                <div className="space-y-3">
                  <h3 className="text-[10px] font-black text-zinc-450 uppercase tracking-[0.2em] flex items-center gap-2">
                    <Upload size={12} className="text-orange-500" /> Reference Canvas Source
                  </h3>

                  <div 
                    onDragEnter={handleDrag}
                    onDragOver={handleDrag}
                    onDragLeave={handleDrag}
                    onDrop={handleDrop}
                    onClick={() => fileInputRef.current?.click()}
                    className={`w-full h-40 border-2 border-dashed rounded-2xl flex flex-col items-center justify-center cursor-pointer bg-zinc-950/60 p-4 transition-all group relative overflow-hidden ${
                      dragActive ? 'border-orange-500 bg-orange-950/10' : 'border-zinc-800 hover:border-zinc-700 hover:bg-zinc-950'
                    }`}
                  >
                    {uploadedImage ? (
                      <>
                        <img src={uploadedImage} alt="Uploaded preview" className="w-full h-full object-cover rounded-lg" />
                        <div className="absolute inset-0 bg-black/70 flex flex-col items-center justify-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Upload size={20} className="text-orange-500" />
                          <span className="text-[11px] font-black uppercase tracking-wider text-white">Replace Context Image</span>
                        </div>
                      </>
                    ) : (
                      <div className="text-center space-y-2">
                        <div className="p-3 rounded-xl bg-zinc-900 border border-zinc-850 mx-auto w-fit group-hover:scale-105 transition-transform">
                          <Upload size={20} className="text-zinc-400 group-hover:text-orange-500 transition-colors" />
                        </div>
                        <p className="text-xs font-bold text-zinc-200">Drag & drop your thumbnail image</p>
                        <p className="text-[10px] text-zinc-500">or click to browse local storage</p>
                      </div>
                    )}
                    <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleFileUpload} />
                  </div>

                  {uploadedImage && (
                    <button 
                      type="button"
                      onClick={(e) => { e.stopPropagation(); setUploadedImage(null); }}
                      className="w-full py-1.5 px-3 bg-red-950/20 border border-red-900/30 hover:bg-red-950/40 text-red-400 rounded-xl text-[10px] font-black uppercase tracking-wider transition-colors flex items-center justify-center gap-1.5"
                    >
                      <Trash2 size={12} /> Clear Reference Image
                    </button>
                  )}
                </div>
             )}

              {/* Dynamic input label and Concept formulation */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest block font-mono">
                      {mode === 'generate' ? 'Concept Manifest' : 'Transformation Orders'}
                    </label>
                    {activeProject && (
                      <span className="text-[8px] font-mono tracking-wider uppercase text-zinc-500 bg-zinc-950 border border-zinc-900 rounded px-1.5 py-0.5 flex items-center gap-1.5 select-none">
                        {saveStatus === 'saving' && <span className="w-1 h-1 rounded-full bg-amber-500 animate-pulse" />}
                        {saveStatus === 'saved' && <span className="w-1 h-1 rounded-full bg-emerald-500" />}
                        {saveStatus === 'saving' && 'Saving...'}
                        {saveStatus === 'saved' && 'Saved'}
                        {saveStatus === 'idle' && 'Synced'}
                      </span>
                    )}
                  </div>
                 
                 {mode === 'generate' && (
                   <button
                     type="button"
                     onClick={handleEnhancePrompt}
                     disabled={enhancing || !prompt.trim()}
                     className="text-[10px] font-bold text-orange-400 hover:text-orange-300 disabled:opacity-40 transition-colors flex items-center gap-1"
                     title="Use AI to fully detail and enrich this prompt"
                   >
                     {enhancing ? <Loader2 className="animate-spin w-3 h-3" /> : <Wand2 size={12} />} 
                     AI Enhancer
                   </button>
                 )}
               </div>
               
               <textarea
                  onFocus={() => { lastPromptRef.current = prompt; }}
                  onBlur={handlePromptBlur} 
                 value={prompt} 
                 onChange={(e) => setPrompt(e.target.value)} 
                 placeholder={mode === 'generate' ? "e.g. A futuristic workspace illuminated by bright orange holographic statistics panels, cinematic volumetric lighting, 8k resolution details." : "e.g. Replace the dark grey background with an exploding stellar supernova and add detailed volumetric cyan laser effects."}
                 className="w-full h-28 bg-zinc-950 border border-zinc-800/80 rounded-2xl p-4 text-white text-xs outline-none focus:border-zinc-700 focus:ring-1 focus:ring-zinc-700/50 resize-none shadow-inner leading-relaxed transition-colors placeholder:text-zinc-650 font-mono" 
               />
             </div>

             {/* Style selectors */}
             <div className="space-y-3">
                <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest block">Artistic Core Style</label>
                <div className="flex flex-wrap gap-1.5">
                   {STYLES.map(s => (
                     <button 
                       type="button"
                       key={s} 
                       onClick={() => setStyle(s)} 
                       className={`px-3 py-1.5 rounded-xl border text-[9px] font-black uppercase tracking-wider transition-all duration-200 ${style === s ? 'bg-orange-600/10 border-orange-500 text-orange-400' : 'bg-zinc-950/80 border-zinc-800 hover:border-zinc-700 text-zinc-400'}`}
                     >
                       {s}
                     </button>
                   ))}
                </div>
             </div>

             <div className="border-t border-zinc-850 pt-5 space-y-4">
               {/* Engine selective Quality and Resolution modifiers */}
               <div className="flex items-center justify-between">
                 <div>
                   <label className="text-[10px] font-black text-white uppercase tracking-wider block">Synthesis Engine Mode</label>
                   <span className="text-[10px] text-zinc-500">Fast is zero-cost; Pro enables deep image size parameters.</span>
                 </div>
                 <div className="flex bg-zinc-950 border border-zinc-850 p-1 rounded-xl">
                   <button 
                     type="button"
                     onClick={() => setGenMode('fast')} 
                     className={`px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-wider transition-all ${genMode === 'fast' ? 'bg-zinc-800 text-white' : 'text-zinc-500 hover:text-zinc-300'}`}
                   >
                     Speed
                   </button>
                   <button 
                     type="button"
                     onClick={() => {
                        setGenMode('pro');
                        toast.success('Pro engine metrics loaded', { id: 'pro-engine-loaded' });
                     }} 
                     className={`px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-wider transition-all ${genMode === 'pro' ? 'bg-zinc-800 text-white' : 'text-zinc-500 hover:text-zinc-300'}`}
                   >
                     Pro
                   </button>
                 </div>
               </div>

               {/* Aspect Ratio and Dimensions (If applicable) */}
               <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest block">Canvas Ratio</label>
                    <select 
                      value={aspectRatio} 
                      onChange={(e) => setAspectRatio(e.target.value)}
                      className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-[11px] text-zinc-350 font-black uppercase tracking-wider outline-none cursor-pointer focus:border-zinc-700"
                    >
                      {ASPECT_RATIOS.map(item => (
                        <option key={item.id} value={item.ratio}>{item.ratio} ({item.id})</option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest block">Scale Density</label>
                    <select 
                      value={imageSize} 
                      disabled={genMode !== 'pro'}
                      onChange={(e) => setImageSize(e.target.value)}
                      className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-[11px] text-zinc-350 font-black uppercase tracking-wider outline-none cursor-pointer focus:border-zinc-700 disabled:opacity-40"
                    >
                        <option value="1K">1K UHD (Normal)</option>
                        <option value="2K">2K QuadHD</option>
                        <option value="4K">4K Extreme UHD</option>
                    </select>
                  </div>
               </div>
             </div>

             <button 
               type="button"
               onClick={handleGenerate} 
               disabled={loading || (mode === 'edit' && !uploadedImage)} 
               className="w-full py-5 rounded-2xl font-black uppercase text-xs tracking-[0.25em] bg-orange-600 hover:bg-orange-500 disabled:opacity-40 text-white shadow-xl shadow-orange-600/10 active-press transition-all flex items-center justify-center gap-2 border border-orange-500"
             >
               {loading ? <Loader2 className="animate-spin" /> : <><Zap size={14} fill="currentColor" /> Synthesize Visuals</>}
             </button>
          </div>
        </div>

        {/* Right Output Materlization Arena */}
        <div className="flex-1 bg-zinc-950/80 rounded-[2rem] border border-zinc-850/60 flex flex-col relative items-center justify-center overflow-hidden shadow-inner group p-6 min-h-[350px]">
           {loading ? (
             <div className="flex flex-col items-center gap-6 animate-fade-in text-center p-8 max-w-md">
                <div className="relative">
                  <div className="w-16 h-16 border-t-2 border-b-2 border-orange-500 rounded-full animate-spin" />
                  <Sparkle className="absolute inset-0 m-auto text-orange-500 animate-pulse" size={24} />
                </div>
                <div className="space-y-1.5">
                  <p className="text-sm font-black text-white uppercase tracking-widest">{loadingText}</p>
                  <p className="text-[10px] text-zinc-500">Retrieving weights via Ranktica's fast CDN pipeline</p>
                </div>
             </div>
           ) : resultImage ? (
             <div className="w-full h-full flex flex-col justify-between items-center gap-6 animate-scale-in">
               <div className="flex-1 w-full flex items-center justify-center min-h-0">
                 <img 
                   src={resultImage} 
                   alt="Materialized Visual Result" 
                   className="max-w-full max-h-[70%] object-contain rounded-2xl shadow-2xl border border-zinc-800" 
                 />
               </div>
               
               <div className="flex flex-wrap items-center justify-center gap-3 shrink-1">
                 <button 
                   type="button"
                   onClick={handleDownload} 
                   className="px-6 py-3 bg-zinc-900 border border-zinc-800 hover:bg-zinc-850 text-white rounded-xl text-xs font-black uppercase tracking-widest transition-all flex items-center gap-2 shadow-lg"
                 >
                   <Download size={14} /> Download Asset (PNG)
                 </button>
                 <button 
                   type="button"
                   onClick={resetAll} 
                   className="px-6 py-3 bg-zinc-950/40 border border-zinc-850 hover:bg-zinc-900 text-zinc-400 hover:text-white rounded-xl text-xs font-black uppercase tracking-widest transition-all flex items-center gap-2"
                 >
                   <RefreshCw size={14} /> Start Fresh
                 </button>
               </div>
             </div>
           ) : (
             <div className="text-zinc-800 flex flex-col items-center gap-4 text-center max-w-sm opacity-40 group-hover:opacity-60 transition-opacity">
                <ImageIcon size={64} strokeWidth={1} className="text-zinc-650" />
                <div className="space-y-1">
                  <p className="font-extrabold uppercase text-xs tracking-[0.3em] text-zinc-300">Visual workspace idle</p>
                  <p className="text-[10px] text-zinc-450 normal-case font-medium">Fine-tune the configurations on the left panel, then trigger synthesis to view results.</p>
                </div>
             </div>
           )}
        </div>
      </div>
    </div>
  );
};
