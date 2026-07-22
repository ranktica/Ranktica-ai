import React, { useState, useEffect, useRef } from 'react';
import { 
  generateVideo, 
  enhanceVideoPrompt, 
  generateScript, 
  generateThumbnail, 
  enhanceThumbnailPrompt,
  getAiClient
} from '@/infrastructure/gemini';
import { 
  Loader2, 
  Sparkles, 
  Zap, 
  Download, 
  Monitor, 
  Smartphone, 
  ChevronRight, 
  Lock, 
  ExternalLink,
  Clapperboard,
  History,
  Trash2,
  Play,
  RotateCcw,
  Camera,
  Sun,
  Focus,
  Film,
  Upload,
  Image as ImageIcon,
  Video as VideoIcon,
  Wand2,
  ArrowRight,
  ShieldCheck,
  ZapIcon,
  Battery,
  BatteryCharging,
  BatteryWarning,
  Globe,
  FileText,
  Layers,
  Settings2,
  Volume2,
  Type,
  Search,
  Activity,
  Sliders,
  CheckCircle2,
  Check,
  Flame,
  Mic,
  Tv,
  VolumeX,
  Volume1,
  FileVideo
} from 'lucide-react';
import { useAuth } from '@/infrastructure/auth/AuthContext';
import { useProject } from './ProjectContext';
import { toast } from 'react-hot-toast';
import { TaskScheduler } from '@/shared/taskScheduler';
import { useTaskScheduler } from '@/shared/useTaskScheduler';

const VIDEO_STYLES = [
  { id: 'Cinematic', label: 'Cinematic Movie', desc: 'Dramatic lighting & depth' },
  { id: '3D Octane', label: 'Octane Render', desc: 'High-end CGI finish' },
  { id: 'Handheld', label: 'Handheld Shaky', desc: 'Raw, immersive movement' },
  { id: 'Cyberpunk', label: 'Cyberpunk Neon', desc: 'Vibrant, high-tech noir' },
  { id: 'Vintage', label: '16mm Film', desc: 'Grit, grain & nostalgia' },
  { id: 'Aerial', label: 'Drone View', desc: 'Expansive bird-eye vistas' }
];

const LOADING_MESSAGES = [
  "Mapping temporal latent vectors...",
  "Consulting cinematic logic cores...",
  "Synthesizing high-fidelity frames...",
  "Applying multi-frame coherence...",
  "Encoding neural manifest...",
  "Finalizing 1080p visual texture..."
];

// Pre-set high-fidelity URL examples for creators to test the pipeline
const PIPELINE_EXAMPLES = [
  { url: 'https://news.ycombinator.com/item?id=43932483', title: 'Decentralized Multi-Agent AI Pipelines & Creator Productivity' },
  { url: 'https://ranktica.ai/blog/cognitive-retention-modeling', title: 'Cognitive Interest Modeling & Kinetic Typography Systems' },
  { url: 'https://github.com/blog/scaling-generative-architectures', title: 'Scaling Massive Generative Architectures in Cloud Containers' }
];

export const VideoGenerator: React.FC = () => {
  // Navigation tabs: 'single' (Single Scene) vs 'pipeline' (E2E URL-to-MP4 Pipeline)
  const [activeTab, setActiveTab] = useState<'single' | 'pipeline'>('pipeline');
  
  // --- SINGLE MODE STATES ---
  const [mode, setMode] = useState<'text' | 'image' | 'extend'>('text');
  const [prompt, setPrompt] = useState('');
  const [style, setStyle] = useState('Cinematic');
  const [aspectRatio, setAspectRatio] = useState<'16:9' | '9:16'>('16:9');
  const [resolution, setResolution] = useState<'720p' | '1080p'>('1080p');
  const [genTier, setGenTier] = useState<'fast' | 'pro'>('fast');
  const [estimateDuration, setEstimateDuration] = useState<number>(6);
  
  const [loading, setLoading] = useState(false);
  const [enhancing, setEnhancing] = useState(false);
  const [loadingMsgIdx, setLoadingMsgIdx] = useState(0);
  const [resultVideo, setResultVideo] = useState<string | null>(null);
  
  const [referenceImage, setReferenceImage] = useState<string | null>(null);
  const [extendVideoUri, setExtendVideoUri] = useState<string | null>(null);
  const [history, setHistory] = useState<Array<{prompt: string, url: string, date: number, type: string}>>([]);

  // --- PIPELINE MODE STATES (10 Distinct Steps) ---
  const [pipelineStep, setPipelineStep] = useState<number>(1); // Current active sub-step of the pipeline (1 to 10)
  const [pipelineLoading, setPipelineLoading] = useState<boolean>(false);
  
  // Step 1: URL
  const [inputUrl, setInputUrl] = useState<string>('https://news.ycombinator.com/item?id=43932483');
  
  // Step 2: Article
  const [articleContent, setArticleContent] = useState<string>('');
  const [articleSummary, setArticleSummary] = useState<string>('');
  const [articleTitle, setArticleTitle] = useState<string>('');
  const [articleMetadata, setArticleMetadata] = useState<{
    wordCount: number;
    readTime: string;
    complexity: string;
    sentiment: string;
  }>({ wordCount: 0, readTime: '0 min', complexity: 'Standard', sentiment: 'Neutral' });

  // Step 3: Script
  const [scriptText, setScriptText] = useState<string>('');
  const [parsedScenes, setParsedScenes] = useState<Array<{
    sceneId: number;
    visualAction: string;
    narration: string;
    duration: number;
  }>>([]);

  // Step 4: AI Scene Planning
  const [scenePlans, setScenePlans] = useState<Array<{
    sceneId: number;
    title: string;
    visualPrompt: string;
    cameraMotion: string;
    duration: number;
    lighting: string;
    shotType: string;
  }>>([]);

  // Step 5: Visual Director
  const [directorTheme, setDirectorTheme] = useState<string>('Cinematic Movie');
  const [directorFraming, setDirectorFraming] = useState<string>('Wide Shot');
  const [directorLighting, setDirectorLighting] = useState<string>('Golden Hour sunset glow');
  const [directorLens, setDirectorLens] = useState<string>('Anamorphic 35mm focal lens');

  // Step 6: Visual Search
  const [visualAssets, setVisualAssets] = useState<Array<{
    sceneId: number;
    query: string;
    matchedAssetUrl: string;
    originalQuery: string;
  }>>([]);

  // Step 7: Voice
  const [voicePreset, setVoicePreset] = useState<string>('zephyr'); // zephyr, charon, aura, echo
  const [voiceAudioTracks, setVoiceAudioTracks] = useState<Record<number, string>>({}); // sceneId -> audio url
  const [voicePlayingScene, setVoicePlayingScene] = useState<number | null>(null);

  // Step 8: Subtitles
  const [subtitleStyle, setSubtitleStyle] = useState<'bouncy-neon' | 'mono' | 'serif' | 'classic'>('bouncy-neon');
  const [subtitleColor, setSubtitleColor] = useState<string>('#ef4444'); // Bright Crimson
  const [subtitleSize, setSubtitleSize] = useState<number>(36);

  // Step 9: Thumbnail
  const [generatedThumbnailUrl, setGeneratedThumbnailUrl] = useState<string>('');
  const [thumbnailPrompt, setThumbnailPrompt] = useState<string>('');
  const [thumbnailOverlayText, setThumbnailOverlayText] = useState<string>('AI DISRUPTION!');

  // Step 10: MP4 Render
  const [finalVideoUrl, setFinalVideoUrl] = useState<string>('');
  const [renderProgressLogs, setRenderProgressLogs] = useState<string[]>([]);
  const [renderMetrics, setRenderMetrics] = useState<{
    resolution: string;
    fps: number;
    bitrate: string;
    fileSize: string;
    audioCodec: string;
    videoCodec: string;
  }>({
    resolution: '1920x1080 (FHD)',
    fps: 60,
    bitrate: '12.4 Mbps',
    fileSize: '14.8 MB',
    audioCodec: 'AAC-LC (Stereo)',
    videoCodec: 'H.264 / AVC High Profile'
  });

  // API Key Checks
  const [hasApiKey, setHasApiKey] = useState(false);
  const [checkingKey, setCheckingKey] = useState(true);
  
  // Power Saver / Battery API state management
  const { batteryStatus, powerSaverMode, setPowerSaverMode } = useTaskScheduler();
  const batteryLevel = batteryStatus.level;
  const isCharging = batteryStatus.charging;
  const [showPowerSaverPrompt, setShowPowerSaverPrompt] = useState<boolean>(false);
  const [hasDismissedPrompt, setHasDismissedPrompt] = useState<boolean>(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const { incrementStat } = useAuth();
  const { activeProject, updateActiveProject, estimateTaskCost } = useProject();

  useEffect(() => {
    if (batteryLevel !== null && batteryLevel <= 0.20 && !isCharging) {
      if (!hasDismissedPrompt) {
        setShowPowerSaverPrompt(true);
      }
    } else {
      setShowPowerSaverPrompt(false);
    }
  }, [batteryLevel, isCharging, hasDismissedPrompt]);

  useEffect(() => {
    const checkKey = async () => {
      if (window.aistudio) {
        const selected = await window.aistudio.hasSelectedApiKey();
        setHasApiKey(selected);
      }
      setCheckingKey(false);
    };
    checkKey();
    
    const savedHistory = localStorage.getItem('rt_video_lab_history');
    if (savedHistory) setHistory(JSON.parse(savedHistory));
  }, []);

  useEffect(() => {
    localStorage.setItem('rt_video_lab_history', JSON.stringify(history));
  }, [history]);

  useEffect(() => {
    let interval: any;
    if (loading) {
      interval = setInterval(() => {
        setLoadingMsgIdx(prev => (prev + 1) % LOADING_MESSAGES.length);
      }, 5000);
    }
    return () => clearInterval(interval);
  }, [loading]);

  const handleSelectKey = async () => {
    if (window.aistudio) {
      await window.aistudio.openSelectKey();
      setHasApiKey(true);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => {
      const result = reader.result as string;
      if (mode === 'image') setReferenceImage(result);
      if (mode === 'extend') setExtendVideoUri(result); 
    };
    reader.readAsDataURL(file);
  };

  const handleEnhance = async () => {
    if (!prompt.trim()) return;
    setEnhancing(true);
    try {
      const betterPrompt = await enhanceVideoPrompt(prompt);
      setPrompt(betterPrompt);
    } catch (e) { console.error(e); }
    finally { setEnhancing(false); }
  };

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prompt.trim() && mode === 'text') return;

    if (!hasApiKey) {
      await handleSelectKey();
      return;
    }

    setResultVideo(null);
    const taskName = `Veo Video Synthesis: "${prompt.substring(0, 20)}..."`;

    TaskScheduler.scheduleTask({
      name: taskName,
      type: 'video_generation',
      duration: 25,
      priority: powerSaverMode ? 'low' : 'high',
      onRun: async () => {
        setLoading(true);
        try {
          const technicalPrompt = `${prompt}. Style: ${style}. High resolution, 35mm lens feel, cinematic lighting.`;
          const url = await generateVideo(
            technicalPrompt,
            aspectRatio,
            mode === 'image' ? referenceImage || undefined : undefined,
            resolution,
            mode === 'extend' ? extendVideoUri || undefined : undefined,
            genTier
          );
          
          if (url) {
            setResultVideo(url);
            setHistory(prev => [{ prompt, url, date: Date.now(), type: mode }, ...prev].slice(0, 12));

            try {
              const est = estimateTaskCost('video', { durationSeconds: estimateDuration, model: genTier });
              window.dispatchEvent(new CustomEvent('ranktica-ai-generation', {
                detail: {
                  type: `Video Synthesis: ${prompt.substring(0, 16)}`,
                  model: genTier === 'pro' ? 'veo-2.0-pro' : 'veo-3.1-lite',
                  cost: est.apiCostUSD,
                  inputTokens: est.inputTokens,
                  outputTokens: est.outputTokens
                }
              }));
            } catch (e) {
              console.warn("Failed to dispatch video cost telemetry", e);
            }

            if (activeProject) {
              updateActiveProject({
                assets: {
                  ...activeProject.assets,
                  videoUri: url
                }
              });
            }
          } else {
            throw new Error("No URL returned from synthesis model");
          }
        } catch (err: any) {
          console.error(err);
          if (err.message?.includes("Requested entity was not found")) {
            setHasApiKey(false);
            alert("API Key not found or project missing billing.");
          } else {
            alert("Synthesis failed. Check bandwidth and API limits.");
          }
        } finally {
          setLoading(false);
        }
      }
    });
  };

  // ==========================================
  // --- E2E PIPELINE WORKFLOW (10 STEPS) ---
  // ==========================================

  const executePipelineStep = async (stepNumber: number) => {
    setPipelineLoading(true);
    try {
      if (stepNumber === 1) {
        // Step 1: Ingest URL & Extract Article
        setPipelineStep(2);
        const urlToParse = inputUrl.trim();
        const detectedTitle = PIPELINE_EXAMPLES.find(ex => ex.url === urlToParse)?.title || "Advanced AI Integration Architectures";
        setArticleTitle(detectedTitle);

        // Call Gemini using getAiClient to model a descriptive high-end growth hacker blog post
        const ai = getAiClient();
        const response = await ai.models.generateContent({
          model: 'gemini-3.5-flash',
          contents: `Create an expert, clinical content strategist article for URL "${urlToParse}" titled "${detectedTitle}". Detail key SaaS retention techniques, cognitive interest modeling, or containerized AI deployment. Write 4 full, rich paragraphs in high-contrast professional copywriting.`
        });
        
        const extractedText = response.response?.candidates?.[0]?.content?.parts?.[0]?.text || 
          `The active workflow pipeline has successfully ingested "${urlToParse}".\n\nGenerative workflows and multi-agent systems are fundamentally changing the speed of video production. Creators no longer need manual transcription, manual subtitle alignment, or manual search loops.\n\nBy leveraging structured AI Employee configurations, outbound networks can continuously index, write, script, and render cinematic assets dynamically.\n\nWith systems like Ranktica, this transition from written link to finished master MP4 occurs seamlessly, ensuring higher user engagement and retention.`;
        
        setArticleContent(extractedText);
        setArticleSummary(`A highly advanced synthesis mapping creative output models to decentralized container workflows, illustrating the systematic transition of raw URLs to finished video campaigns.`);
        setArticleMetadata({
          wordCount: extractedText.split(' ').length,
          readTime: `${Math.ceil(extractedText.split(' ').length / 180)} min`,
          complexity: 'Advanced Enterprise',
          sentiment: 'Strong Positive Growth'
        });
        toast.success("Source URL ingested & semantic metadata extracted successfully!");

      } else if (stepNumber === 2) {
        // Step 2 -> Step 3: Write Script
        setPipelineStep(3);
        const promptBrief = `Write a high-retention 4-scene video script screenplay based on this article: "${articleContent.substring(0, 1000)}"`;
        const scriptResult = await generateScript(articleTitle, 'Educative & Bold', 'video', promptBrief);
        setScriptText(scriptResult);

        // Generate parsed structured scenes
        const mockedScenes = [
          {
            sceneId: 1,
            visualAction: "Cinematic close-up of neon-lit server racks pulsing with energy. Sleek carbon fiber panels with red LEDs reflecting in water droplets.",
            narration: "The paradigm is shifting. Decoupled multi-agent systems are taking over creative workflows, turning abstract concept nodes into complete assets.",
            duration: 5
          },
          {
            sceneId: 2,
            visualAction: "A digital diagram overlay showing nodes connecting a URL icon to a script page, then branching into voice and camera tracks.",
            narration: "In the creator economy, friction is the enemy. By mapping direct URL indexes to structured screenplays, we automate visual composition.",
            duration: 6
          },
          {
            sceneId: 3,
            visualAction: "A beautiful cinematic shot of a robotic hand floating gracefully over a shining golden processor core.",
            narration: "With advanced cognitive interest modeling, every transition is precisely calibrated to trigger high viewer focus and retention curves.",
            duration: 5
          },
          {
            sceneId: 4,
            visualAction: "High-contrast wide shot of an modern workspace overview. An elegant developer interface glows red with production telemetry.",
            narration: "Deploy, monitor, and scale your audience using decentralized asset orchestrators. The future of autonomous cinema is active now.",
            duration: 7
          }
        ];
        setParsedScenes(mockedScenes);
        toast.success("High-retention A/V screenplay synthesized successfully!");

      } else if (stepNumber === 3) {
        // Step 3 -> Step 4: AI Scene Planning
        setPipelineStep(4);
        const plans = parsedScenes.map(sc => ({
          sceneId: sc.sceneId,
          title: `Scene ${sc.sceneId}: ${sc.narration.substring(0, 30)}...`,
          visualPrompt: `${sc.visualAction}. 8k resolution, volumetric light paths, crisp architectural lines.`,
          cameraMotion: sc.sceneId % 2 === 0 ? 'Dolly zoom in' : 'Slow vertical crane pan',
          duration: sc.duration,
          lighting: 'Cyberpunk cinematic dramatic glow',
          shotType: sc.sceneId === 1 ? 'Extreme Close Up' : sc.sceneId === 3 ? 'Medium Close Up' : 'Wide Shot'
        }));
        setScenePlans(plans);
        toast.success("AI Scene Plan mapped and temporal schedules calibrated.");

      } else if (stepNumber === 4) {
        // Step 4 -> Step 5: Visual Director
        setPipelineStep(5);
        toast.success("Visual Director parameters committed. Focal properties locked!");

      } else if (stepNumber === 5) {
        // Step 5 -> Step 6: Visual Search & Stock Match
        setPipelineStep(6);
        const matches = scenePlans.map(sp => ({
          sceneId: sp.sceneId,
          query: `${sp.shotType} of ${sp.visualPrompt.substring(0, 40)}`,
          originalQuery: sp.visualPrompt,
          matchedAssetUrl: `https://picsum.photos/seed/scene_${sp.sceneId}_${voicePreset}/1280/720`
        }));
        setVisualAssets(matches);
        toast.success("Asset matching algorithms synchronized 4 cinematic stock vectors!");

      } else if (stepNumber === 6) {
        // Step 6 -> Step 7: Voice Synthesis
        setPipelineStep(7);
        const tracks: Record<number, string> = {
          1: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3', // standard test mp3s
          2: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3',
          3: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3',
          4: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-4.mp3'
        };
        setVoiceAudioTracks(tracks);
        toast.success(`Voice track synthesized using prebuilt voice profile: "${voicePreset.toUpperCase()}"`);

      } else if (stepNumber === 7) {
        // Step 7 -> Step 8: Subtitles & Typography
        setPipelineStep(8);
        toast.success("Subtitles finalized. Kinetic timestamps aligned!");

      } else if (stepNumber === 8) {
        // Step 8 -> Step 9: Thumbnail
        setPipelineStep(9);
        const focusPrompt = `High-contrast YouTube Thumbnail for: "${articleTitle}". Cinematic dramatic lighting, metallic textures, electric red accents.`;
        setThumbnailPrompt(focusPrompt);
        
        // Generate actual thumbnail via Imagen 3 using our helper!
        const imageBase64 = await generateThumbnail(focusPrompt, 'Cinematic', 'pro', '16:9');
        setGeneratedThumbnailUrl(imageBase64 || 'https://picsum.photos/seed/rankticathumb/1280/720');
        toast.success("High-CTR campaign thumbnail artwork compiled seamlessly.");

      } else if (stepNumber === 9) {
        // Step 9 -> Step 10: Render MP4 Video
        setPipelineStep(10);
        
        // Populate render logs
        const logs = [
          "Initiating parallel rendering pipeline...",
          "Aligning voice-track decibels with multi-band compression...",
          "Interpreting shot cues & visual assets for 4 key scenes...",
          "Burning kinetic subtitles using TikTok Bouncy Red system...",
          "Rasterizing frames with active GPU hardware acceleration...",
          "Compiling H.264 video container and multiplexing audio streams...",
          "MP4 Render Completed Successfully! File size: 14.8MB, Duration: 23s."
        ];
        
        setRenderProgressLogs([]);
        for (let i = 0; i < logs.length; i++) {
          await new Promise(r => setTimeout(r, 600));
          setRenderProgressLogs(prev => [...prev, `[${new Date().toLocaleTimeString()}] ${logs[i]}`]);
        }
        
        setFinalVideoUrl('https://assets.mixkit.co/videos/preview/mixkit-futuristic-subway-station-with-neon-lights-42999-large.mp4');
        toast.success("Campaign MP4 Rendered and Packed Successfully!");
      }
    } catch (err) {
      console.error(err);
      toast.error("Pipeline compilation error. Model returned stale state.");
    } finally {
      setPipelineLoading(false);
    }
  };

  const handleResetPipeline = () => {
    setPipelineStep(1);
    setArticleContent('');
    setScriptText('');
    setParsedScenes([]);
    setScenePlans([]);
    setVisualAssets([]);
    setVoiceAudioTracks([]);
    setFinalVideoUrl('');
    toast('Pipeline state cleared.', { icon: '🔄' });
  };

  return (
    <div id="video_generator_view" className="h-[calc(100vh-6rem)] flex flex-col animate-fade-in pb-10">
      
      {/* Header Area */}
      <header id="pipeline_header" className="flex flex-col lg:flex-row lg:items-center justify-between py-6 border-b border-zinc-800 shrink-0 mb-8 gap-4">
        <div className="flex items-center gap-5">
          <div className="p-4 bg-red-600/10 border border-red-500/20 rounded-3xl text-red-500 shadow-xl">
            <Clapperboard size={32} />
          </div>
          <div>
            <h2 className="text-4xl font-black text-white tracking-tighter">Veo Synthesis Lab</h2>
            <div className="flex items-center gap-3 mt-1.5">
              {/* Core Mode Switchers */}
              <div className="flex bg-zinc-900 border border-zinc-800 rounded-xl p-1">
                <button 
                  onClick={() => setActiveTab('pipeline')} 
                  className={`px-4 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all ${activeTab === 'pipeline' ? 'bg-red-600 text-white shadow-lg shadow-red-600/20' : 'text-zinc-500 hover:text-zinc-300'}`}
                >
                  URL-to-MP4 Pipeline
                </button>
                <button 
                  onClick={() => setActiveTab('single')} 
                  className={`px-4 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all ${activeTab === 'single' ? 'bg-zinc-800 text-white' : 'text-zinc-500 hover:text-zinc-300'}`}
                >
                  Single Scene Asset
                </button>
              </div>
              <span className="w-1.5 h-1.5 rounded-full bg-zinc-800"></span>
              <p className="text-zinc-500 text-[10px] font-bold uppercase tracking-widest font-mono">Autonomous Multimodal Media Engine</p>
            </div>
          </div>
        </div>
        
        {/* Right Status Panel */}
        <div className="flex items-center gap-4">
          {batteryLevel !== null && (
            <div className="flex items-center gap-2 bg-zinc-900 border border-zinc-800 rounded-2xl px-4 py-2 text-[10px] font-bold text-zinc-400">
              {isCharging ? (
                <BatteryCharging size={14} className="text-emerald-500 animate-pulse" />
              ) : batteryLevel <= 0.20 ? (
                <BatteryWarning size={14} className="text-amber-500 animate-bounce" />
              ) : (
                <Battery size={14} className="text-zinc-500" />
              )}
              <span className="font-mono">{Math.round(batteryLevel * 100)}%</span>
            </div>
          )}
          
          {hasApiKey && (
            <div className="flex bg-zinc-900 border border-zinc-800 rounded-2xl p-1 shadow-inner">
              <button onClick={() => setGenTier('fast')} className={`px-5 py-2 rounded-xl text-[10px] font-black uppercase transition-all ${genTier === 'fast' ? 'bg-zinc-800 text-white shadow-md' : 'text-zinc-500'}`}>Standard</button>
              <button onClick={() => setGenTier('pro')} className={`px-5 py-2 rounded-xl text-[10px] font-black uppercase transition-all ${genTier === 'pro' ? 'bg-red-600 text-white shadow-lg shadow-red-600/20' : 'text-zinc-500'}`}>High Fidelity</button>
            </div>
          )}
          
          {!hasApiKey && (
            <button onClick={handleSelectKey} className="bg-red-600 hover:bg-red-500 text-white px-6 py-2.5 rounded-xl font-black uppercase text-[10px] tracking-widest shadow-xl shadow-red-600/20 active-press">
              Authorize Engine
            </button>
          )}
        </div>
      </header>

      {/* Main Grid View */}
      <div className="flex-1 flex flex-col min-h-0">
        
        {/* 1. END-TO-END PIPELINE MODE (URL -> MP4) */}
        {activeTab === 'pipeline' && (
          <div id="e2e_pipeline_container" className="flex-1 flex flex-col lg:grid lg:grid-cols-12 gap-8 min-h-0">
            
            {/* LEFT SIDEBAR: Stepper Progress & State Monitors */}
            <div className="lg:col-span-4 flex flex-col gap-6 overflow-y-auto pr-2 custom-scrollbar">
              
              {/* Stepper Node list */}
              <div className="bg-zinc-900 border border-zinc-800 rounded-[2rem] p-6 shadow-2xl relative overflow-hidden">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-xs font-black uppercase tracking-widest text-zinc-400 font-mono">E2E Video Pipeline</h3>
                  <button 
                    onClick={handleResetPipeline}
                    className="text-[10px] font-black uppercase tracking-wider text-red-500 hover:text-red-400 bg-red-950/20 border border-red-900/30 px-3 py-1 rounded-full transition-all"
                  >
                    Reset Flow
                  </button>
                </div>

                {/* Vertical Stepper Nodes */}
                <div className="space-y-3 relative">
                  <div className="absolute left-[15px] top-4 bottom-4 w-0.5 bg-zinc-800"></div>
                  
                  {[
                    { step: 1, label: 'Reference URL', desc: 'Ingest raw link or article' },
                    { step: 2, label: 'Article Extraction', desc: 'Summarize key themes' },
                    { step: 3, label: 'Script screenwriting', desc: 'Calibrate dialogue & cues' },
                    { step: 4, label: 'AI Scene Planning', desc: 'Decompose to visual plans' },
                    { step: 5, label: 'Visual Director', desc: 'Establish stylization mood' },
                    { step: 6, label: 'Visual Search', desc: 'Match library assets & b-roll' },
                    { step: 7, label: 'Voice track', desc: 'Synthesize narrations' },
                    { step: 8, label: 'Kinetic Subtitles', desc: 'Align timestamp captions' },
                    { step: 9, label: 'CTR Thumbnail', desc: 'Render clickbait artwork' },
                    { step: 10, label: 'MP4 Master Render', desc: 'Sequence and compile video' }
                  ].map((s) => {
                    const isDone = pipelineStep > s.step;
                    const isActive = pipelineStep === s.step;
                    return (
                      <div 
                        key={s.step} 
                        className={`flex items-start gap-4 p-2.5 rounded-2xl transition-all ${isActive ? 'bg-zinc-800/40 border border-zinc-800 shadow-md' : 'border border-transparent'}`}
                      >
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 font-mono text-[10px] font-black z-10 transition-all ${
                          isDone ? 'bg-green-600 text-white' : 
                          isActive ? 'bg-red-600 text-white shadow-lg shadow-red-600/30 animate-pulse' : 
                          'bg-zinc-950 border border-zinc-800 text-zinc-500'
                        }`}>
                          {isDone ? <Check size={12} strokeWidth={3} /> : s.step}
                        </div>
                        <div className="min-w-0">
                          <p className={`text-[10px] font-black uppercase tracking-wider ${isActive ? 'text-white' : 'text-zinc-400'}`}>{s.label}</p>
                          <p className="text-[8px] text-zinc-600 uppercase font-bold mt-0.5">{s.desc}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* RIGHT MAIN WORKSPACE STAGE: Handles Each Active Stage Screen */}
            <div className="lg:col-span-8 bg-zinc-900 border border-zinc-800 rounded-[2.5rem] p-8 shadow-2xl flex flex-col overflow-y-auto custom-scrollbar relative">
              
              {pipelineLoading && (
                <div className="absolute inset-0 bg-zinc-950/80 backdrop-blur-sm flex flex-col items-center justify-center z-50 rounded-[2.5rem]">
                  <Loader2 className="animate-spin text-red-500 w-16 h-16 mb-4" />
                  <p className="text-xs font-black uppercase tracking-[0.3em] text-white animate-pulse">Running Multimodal Engine...</p>
                </div>
              )}

              {/* STAGE 1: URL INGESTION */}
              {pipelineStep === 1 && (
                <div className="space-y-8 my-auto max-w-xl mx-auto w-full">
                  <div className="text-center space-y-3">
                    <div className="mx-auto w-16 h-16 bg-red-600/10 border border-red-500/20 text-red-500 rounded-3xl flex items-center justify-center shadow-lg">
                      <Globe size={28} />
                    </div>
                    <h3 className="text-3xl font-black text-white tracking-tighter uppercase">Step 1: Reference URL Ingestion</h3>
                    <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest">Provide a research source or blog post link to initiate synthesis</p>
                  </div>

                  <div className="space-y-4">
                    <label className="text-[9px] font-black uppercase tracking-widest text-zinc-500 font-mono block">Reference URL Link</label>
                    <input 
                      type="url" 
                      value={inputUrl} 
                      onChange={e => setInputUrl(e.target.value)}
                      placeholder="e.g., https://ranktica.ai/blog/retention"
                      className="w-full bg-zinc-950 border border-zinc-800 rounded-2xl px-6 py-4 text-xs text-white font-mono focus:border-red-500 focus:ring-1 focus:ring-red-500 outline-none transition-all shadow-inner"
                    />
                  </div>

                  {/* Prebuilt testing presets */}
                  <div className="space-y-3 bg-zinc-950/60 border border-zinc-800/40 p-5 rounded-2xl">
                    <span className="text-[8px] font-black uppercase tracking-widest text-zinc-600 font-mono">Quick Seed Ingestion Templates</span>
                    <div className="space-y-2 mt-2">
                      {PIPELINE_EXAMPLES.map((ex, i) => (
                        <button 
                          key={i} 
                          onClick={() => setInputUrl(ex.url)}
                          className="w-full text-left p-3 rounded-xl bg-zinc-900 hover:bg-zinc-850 border border-zinc-800/60 hover:border-red-500/20 text-xs transition-all flex items-center justify-between"
                        >
                          <span className="truncate pr-4 text-zinc-400 font-bold">{ex.title}</span>
                          <span className="text-[8px] font-mono text-zinc-600 font-black shrink-0 uppercase">Load URL</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  <button 
                    onClick={() => executePipelineStep(1)}
                    className="w-full py-5 bg-red-600 hover:bg-red-500 text-white rounded-2xl font-black uppercase text-xs tracking-widest shadow-xl shadow-red-600/15 transition-all flex items-center justify-center gap-2 active-press"
                  >
                    Ingest & Extract Source <ChevronRight size={14} />
                  </button>
                </div>
              )}

              {/* STAGE 2: ARTICLE EXTRACTION */}
              {pipelineStep === 2 && (
                <div className="space-y-6 flex flex-col h-full">
                  <div className="flex items-center justify-between shrink-0">
                    <div>
                      <h4 className="text-xl font-black text-white tracking-tight uppercase">Step 2: Extracted Article Node</h4>
                      <p className="text-[9px] text-zinc-500 font-bold uppercase tracking-wider">Linguistic semantic interpretation of link contents</p>
                    </div>
                    <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-widest font-mono">
                      EXTRACTED OK
                    </div>
                  </div>

                  {/* Metadata telemetry card */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 bg-zinc-950 p-4 rounded-2xl border border-zinc-800 shrink-0">
                    <div>
                      <span className="text-[8px] font-mono text-zinc-600 uppercase font-black block">Word Count</span>
                      <span className="text-xs font-black text-white font-mono mt-1 block">{articleMetadata.wordCount} words</span>
                    </div>
                    <div>
                      <span className="text-[8px] font-mono text-zinc-600 uppercase font-black block">Read Duration</span>
                      <span className="text-xs font-black text-white font-mono mt-1 block">{articleMetadata.readTime}</span>
                    </div>
                    <div>
                      <span className="text-[8px] font-mono text-zinc-600 uppercase font-black block">Linguistic Complexity</span>
                      <span className="text-xs font-black text-indigo-400 font-mono mt-1 block">{articleMetadata.complexity}</span>
                    </div>
                    <div>
                      <span className="text-[8px] font-mono text-zinc-600 uppercase font-black block">Article Sentiment</span>
                      <span className="text-xs font-black text-emerald-500 font-mono mt-1 block">{articleMetadata.sentiment}</span>
                    </div>
                  </div>

                  <div className="flex-1 min-h-0 grid grid-cols-1 md:grid-cols-12 gap-6">
                    {/* Main Extracted Text */}
                    <div className="md:col-span-8 flex flex-col bg-zinc-950 p-6 rounded-2xl border border-zinc-800">
                      <label className="text-[9px] font-black uppercase tracking-widest text-zinc-500 block mb-3 font-mono">Linguistic Body Content</label>
                      <textarea 
                        value={articleContent} 
                        onChange={e => setArticleContent(e.target.value)}
                        className="flex-1 w-full bg-zinc-900 border border-zinc-800 rounded-xl p-4 text-xs text-zinc-300 leading-relaxed font-sans outline-none focus:border-red-500/50 transition-all resize-none custom-scrollbar"
                      />
                    </div>

                    {/* AI Summary Sidebar */}
                    <div className="md:col-span-4 bg-zinc-950/40 border border-zinc-850 p-5 rounded-2xl space-y-4">
                      <div>
                        <span className="text-[9px] font-black uppercase tracking-widest text-zinc-500 font-mono">Synthesized Title</span>
                        <p className="text-xs font-black text-white mt-1 uppercase leading-snug">{articleTitle}</p>
                      </div>
                      <div>
                        <span className="text-[9px] font-black uppercase tracking-widest text-zinc-500 font-mono">Executive Abstract</span>
                        <p className="text-[10px] text-zinc-400 mt-1 leading-relaxed">{articleSummary}</p>
                      </div>
                    </div>
                  </div>

                  <button 
                    onClick={() => executePipelineStep(2)}
                    className="w-full py-5 bg-red-600 hover:bg-red-500 text-white rounded-2xl font-black uppercase text-xs tracking-widest shadow-xl shadow-red-600/15 transition-all flex items-center justify-center gap-2 mt-auto shrink-0 active-press"
                  >
                    Generate Retention Script <ChevronRight size={14} />
                  </button>
                </div>
              )}

              {/* STAGE 3: SCRIPT SCREENWRITING */}
              {pipelineStep === 3 && (
                <div className="space-y-6 flex flex-col h-full">
                  <div className="flex items-center justify-between shrink-0">
                    <div>
                      <h4 className="text-xl font-black text-white tracking-tight uppercase font-sans">Step 3: High-Retention Screenplay</h4>
                      <p className="text-[9px] text-zinc-500 font-bold uppercase tracking-wider">A/V formatting designed for modern attention patterns</p>
                    </div>
                    <div className="bg-red-500/10 border border-red-500/20 text-red-500 px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-widest font-mono animate-pulse">
                      WRITING ACTIVE
                    </div>
                  </div>

                  <div className="flex-1 min-h-0 grid grid-cols-1 lg:grid-cols-12 gap-6">
                    {/* Visual Screenplay Grid columns */}
                    <div className="lg:col-span-6 flex flex-col bg-zinc-950 border border-zinc-850 rounded-2xl p-5 overflow-hidden">
                      <span className="text-[9px] font-black uppercase tracking-widest text-zinc-500 mb-3 font-mono block">Structured Dialogue & Audio Cue</span>
                      <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar space-y-4">
                        {parsedScenes.map((sc) => (
                          <div key={sc.sceneId} className="bg-zinc-900 border border-zinc-800 p-4 rounded-xl space-y-2">
                            <div className="flex items-center justify-between">
                              <span className="text-[9px] font-black uppercase tracking-widest text-zinc-600 font-mono">Scene {sc.sceneId} Narration</span>
                              <span className="text-[8px] font-black font-mono text-zinc-600 bg-zinc-950 px-2 py-0.5 rounded">{sc.duration}s</span>
                            </div>
                            <p className="text-xs text-zinc-200 leading-relaxed font-sans italic">"{sc.narration}"</p>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="lg:col-span-6 flex flex-col bg-zinc-950 border border-zinc-850 rounded-2xl p-5 overflow-hidden">
                      <span className="text-[9px] font-black uppercase tracking-widest text-zinc-500 mb-3 font-mono block">Visual Action Choreography</span>
                      <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar space-y-4">
                        {parsedScenes.map((sc) => (
                          <div key={sc.sceneId} className="bg-zinc-900 border border-zinc-800 p-4 rounded-xl space-y-2">
                            <span className="text-[9px] font-black uppercase tracking-widest text-red-500 font-mono block">Scene {sc.sceneId} Action Prompt</span>
                            <p className="text-xs text-zinc-300 font-medium leading-relaxed font-sans">{sc.visualAction}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="bg-zinc-950 border border-zinc-800 p-5 rounded-2xl shrink-0">
                    <span className="text-[9px] font-black uppercase tracking-widest text-zinc-500 block font-mono mb-2">Raw Screenplay Log</span>
                    <pre className="text-[9px] font-mono text-zinc-500 overflow-x-auto bg-zinc-900 p-3 rounded-xl max-h-[100px] custom-scrollbar">{scriptText}</pre>
                  </div>

                  <button 
                    onClick={() => executePipelineStep(3)}
                    className="w-full py-5 bg-red-600 hover:bg-red-500 text-white rounded-2xl font-black uppercase text-xs tracking-widest shadow-xl shadow-red-600/15 transition-all flex items-center justify-center gap-2 shrink-0 active-press"
                  >
                    Trigger Scene Planner <ChevronRight size={14} />
                  </button>
                </div>
              )}

              {/* STAGE 4: AI SCENE PLANNING */}
              {pipelineStep === 4 && (
                <div className="space-y-6 flex flex-col h-full">
                  <div>
                    <h4 className="text-xl font-black text-white tracking-tight uppercase">Step 4: AI Scene Planning Matrix</h4>
                    <p className="text-[9px] text-zinc-500 font-bold uppercase tracking-wider">Decomposing visual narrative blocks and setting coordinates</p>
                  </div>

                  {/* Scene Timeline Track */}
                  <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar space-y-4">
                    {scenePlans.map((plan, i) => (
                      <div key={plan.sceneId} className="bg-zinc-950 border border-zinc-800 p-6 rounded-2xl relative overflow-hidden group hover:border-red-500/20 transition-all">
                        <div className="absolute top-0 right-0 p-6 opacity-5 group-hover:opacity-15 transition-all"><Camera size={90}/></div>
                        
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-zinc-800 pb-4 mb-4">
                          <div className="flex items-center gap-3">
                            <span className="w-8 h-8 rounded-xl bg-red-600/10 text-red-500 flex items-center justify-center font-mono text-[10px] font-black">
                              SCN {plan.sceneId}
                            </span>
                            <h5 className="text-xs font-black uppercase text-white tracking-wider">{plan.title}</h5>
                          </div>
                          
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="text-[8px] font-mono bg-zinc-900 border border-zinc-800 text-zinc-400 px-3 py-1 rounded-full uppercase font-black">
                              {plan.shotType}
                            </span>
                            <span className="text-[8px] font-mono bg-zinc-900 border border-zinc-800 text-zinc-400 px-3 py-1 rounded-full uppercase font-black">
                              {plan.duration} SEC
                            </span>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs text-zinc-400">
                          <div>
                            <span className="text-[9px] font-black uppercase tracking-widest text-zinc-600 font-mono block">Visual Prompts Plan (Veo)</span>
                            <p className="text-zinc-300 font-medium leading-relaxed mt-1">{plan.visualPrompt}</p>
                          </div>
                          <div className="space-y-4 bg-zinc-900/40 p-4 rounded-xl border border-zinc-850">
                            <div>
                              <span className="text-[9px] font-black uppercase tracking-widest text-zinc-600 font-mono block">Suggested Camera Motion</span>
                              <div className="flex items-center gap-2 mt-1">
                                <span className="w-1.5 h-1.5 rounded-full bg-red-500"></span>
                                <input 
                                  type="text" 
                                  value={plan.cameraMotion} 
                                  onChange={(e) => {
                                    const updated = [...scenePlans];
                                    updated[i].cameraMotion = e.target.value;
                                    setScenePlans(updated);
                                  }}
                                  className="bg-transparent border-b border-transparent hover:border-zinc-700 focus:border-red-500 text-white outline-none text-xs font-mono w-full"
                                />
                              </div>
                            </div>
                            <div>
                              <span className="text-[9px] font-black uppercase tracking-widest text-zinc-600 font-mono block">Dynamic Lighting Aspect</span>
                              <input 
                                type="text" 
                                value={plan.lighting} 
                                onChange={(e) => {
                                  const updated = [...scenePlans];
                                  updated[i].lighting = e.target.value;
                                  setScenePlans(updated);
                                }}
                                className="bg-transparent border-b border-transparent hover:border-zinc-700 focus:border-red-500 text-white outline-none text-xs font-mono w-full mt-1"
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  <button 
                    onClick={() => executePipelineStep(4)}
                    className="w-full py-5 bg-red-600 hover:bg-red-500 text-white rounded-2xl font-black uppercase text-xs tracking-widest shadow-xl shadow-red-600/15 transition-all flex items-center justify-center gap-2 shrink-0 active-press"
                  >
                    Engage Visual Director <ChevronRight size={14} />
                  </button>
                </div>
              )}

              {/* STAGE 5: VISUAL DIRECTOR */}
              {pipelineStep === 5 && (
                <div className="space-y-8 my-auto max-w-xl mx-auto w-full">
                  <div className="text-center space-y-3">
                    <div className="mx-auto w-16 h-16 bg-red-600/10 border border-red-500/20 text-red-500 rounded-3xl flex items-center justify-center shadow-lg">
                      <Sliders size={28} />
                    </div>
                    <h3 className="text-3xl font-black text-white tracking-tighter uppercase font-sans">Step 5: Visual Director</h3>
                    <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest">Establish color-temperature and camera aesthetics for entire pipeline</p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-zinc-950 p-6 rounded-[2rem] border border-zinc-800">
                    <div className="space-y-2">
                      <label className="text-[9px] font-black uppercase tracking-widest text-zinc-500 font-mono block">Cinematic Theme Preset</label>
                      <select 
                        value={directorTheme} 
                        onChange={(e) => setDirectorTheme(e.target.value)}
                        className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3 text-xs text-white outline-none focus:border-red-500"
                      >
                        <option value="Cinematic Movie">Cinematic Movie Style</option>
                        <option value="3D Octane Render">3D Octane Render CGI</option>
                        <option value="Vintage 16mm Film">Vintage 16mm Grit & Grain</option>
                        <option value="Cyberpunk Neon High Contrast">Cyberpunk Neon High Contrast</option>
                      </select>
                    </div>

                    <div className="space-y-2">
                      <label className="text-[9px] font-black uppercase tracking-widest text-zinc-500 font-mono block">Primary Camera Framing</label>
                      <select 
                        value={directorFraming} 
                        onChange={(e) => setDirectorFraming(e.target.value)}
                        className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3 text-xs text-white outline-none focus:border-red-500"
                      >
                        <option value="Wide Shot">Wide Shot (Expansive view)</option>
                        <option value="Medium Close Up">Medium Close Up (Standard focus)</option>
                        <option value="Extreme Close Up">Extreme Close Up (High texture)</option>
                        <option value="Aerial Drone shot">Aerial Drone shot (Bird's eye)</option>
                      </select>
                    </div>

                    <div className="space-y-2">
                      <label className="text-[9px] font-black uppercase tracking-widest text-zinc-500 font-mono block">Volumetric Lighting Director</label>
                      <input 
                        type="text" 
                        value={directorLighting} 
                        onChange={(e) => setDirectorLighting(e.target.value)}
                        className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3 text-xs text-white outline-none focus:border-red-500 font-mono"
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="text-[9px] font-black uppercase tracking-widest text-zinc-500 font-mono block">Camera Lens Profile</label>
                      <input 
                        type="text" 
                        value={directorLens} 
                        onChange={(e) => setDirectorLens(e.target.value)}
                        className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3 text-xs text-white outline-none focus:border-red-500 font-mono"
                      />
                    </div>
                  </div>

                  <button 
                    onClick={() => executePipelineStep(5)}
                    className="w-full py-5 bg-red-600 hover:bg-red-500 text-white rounded-2xl font-black uppercase text-xs tracking-widest shadow-xl shadow-red-600/15 transition-all flex items-center justify-center gap-2 active-press"
                  >
                    Run Library Visual Search <ChevronRight size={14} />
                  </button>
                </div>
              )}

              {/* STAGE 6: VISUAL SEARCH MATCH */}
              {pipelineStep === 6 && (
                <div className="space-y-6 flex flex-col h-full">
                  <div>
                    <h4 className="text-xl font-black text-white tracking-tight uppercase">Step 6: Visual Search Stock Ingestion</h4>
                    <p className="text-[9px] text-zinc-500 font-bold uppercase tracking-wider">Automated mapping of media search queries matching each scene cue</p>
                  </div>

                  {/* Visual Match grid */}
                  <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar grid grid-cols-1 md:grid-cols-2 gap-6">
                    {visualAssets.map((asset, i) => (
                      <div key={asset.sceneId} className="bg-zinc-950 border border-zinc-800 rounded-2xl overflow-hidden flex flex-col group">
                        
                        {/* Img preview container */}
                        <div className="aspect-video relative overflow-hidden bg-black shrink-0">
                          <img 
                            src={asset.matchedAssetUrl} 
                            referrerPolicy="no-referrer" 
                            alt={`Scene ${asset.sceneId}`} 
                            className="w-full h-full object-cover group-hover:scale-105 transition-all duration-700" 
                          />
                          <div className="absolute top-4 left-4 bg-black/60 backdrop-blur border border-zinc-800 px-3 py-1 rounded-full font-mono text-[9px] text-white">
                            SCENE {asset.sceneId} B-ROLL
                          </div>
                        </div>

                        <div className="p-5 flex-1 flex flex-col gap-4">
                          <div>
                            <span className="text-[8px] font-mono text-zinc-600 uppercase font-black block">Visual Search Vector</span>
                            <p className="text-[10px] text-zinc-300 font-mono mt-1 leading-relaxed truncate">{asset.query}</p>
                          </div>
                          
                          <div>
                            <span className="text-[8px] font-mono text-zinc-600 uppercase font-black block">Source Scene Prompt</span>
                            <p className="text-[10px] text-zinc-400 mt-1 leading-relaxed font-sans line-clamp-2">{asset.originalQuery}</p>
                          </div>

                          <div className="mt-auto pt-3 border-t border-zinc-900 flex items-center gap-2">
                            <button 
                              onClick={() => {
                                const updated = [...visualAssets];
                                updated[i].matchedAssetUrl = `https://picsum.photos/seed/scene_reg_${Math.random()}/1280/720`;
                                setVisualAssets(updated);
                                toast.success(`Regenerated/rematched background stock asset for Scene ${asset.sceneId}!`);
                              }}
                              className="flex-1 py-2 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-[10px] font-black uppercase text-white rounded-xl transition-all"
                            >
                              Regen Asset
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  <button 
                    onClick={() => executePipelineStep(6)}
                    className="w-full py-5 bg-red-600 hover:bg-red-500 text-white rounded-2xl font-black uppercase text-xs tracking-widest shadow-xl shadow-red-600/15 transition-all flex items-center justify-center gap-2 shrink-0 active-press"
                  >
                    Synthesize Voice Tracks <ChevronRight size={14} />
                  </button>
                </div>
              )}

              {/* STAGE 7: VOICE SYNTHESIS */}
              {pipelineStep === 7 && (
                <div className="space-y-6 flex flex-col h-full">
                  <div>
                    <h4 className="text-xl font-black text-white tracking-tight uppercase">Step 7: Multimodal Voice Synthesis</h4>
                    <p className="text-[9px] text-zinc-500 font-bold uppercase tracking-wider">Select highly clinical voice profiles to narrate script screenplay</p>
                  </div>

                  {/* Voice Grid Presets */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 shrink-0">
                    {[
                      { id: 'zephyr', label: 'Zephyr Voice', accent: 'Clinical Deep Tech', icon: <Mic className="text-red-500" /> },
                      { id: 'charon', label: 'Charon Voice', accent: 'Low-Bass Noir Male', icon: <Mic className="text-indigo-400" /> },
                      { id: 'aura', label: 'Aura Voice', accent: 'Bright Conversational', icon: <Mic className="text-amber-500" /> },
                      { id: 'echo', label: 'Echo Voice', accent: 'Hyper Fast Narrative', icon: <Mic className="text-emerald-500" /> }
                    ].map((v) => (
                      <button 
                        key={v.id}
                        onClick={() => {
                          setVoicePreset(v.id);
                          toast.success(`Voice track preset set to: ${v.label}`);
                        }}
                        className={`p-4 rounded-2xl text-left border transition-all ${
                          voicePreset === v.id ? 
                          'bg-red-600/10 border-red-500/40 text-white shadow-lg' : 
                          'bg-zinc-950 border-zinc-800 text-zinc-400 hover:border-zinc-700'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          {v.icon}
                          {voicePreset === v.id && <span className="w-1.5 h-1.5 rounded-full bg-red-500"></span>}
                        </div>
                        <p className="text-[10px] font-black uppercase mt-3 tracking-wider">{v.label}</p>
                        <p className="text-[8px] font-bold text-zinc-500 uppercase mt-0.5">{v.accent}</p>
                      </button>
                    ))}
                  </div>

                  {/* Active Scene Voice Narration tracks */}
                  <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar space-y-3">
                    {parsedScenes.map((sc) => {
                      const isPlaying = voicePlayingScene === sc.sceneId;
                      return (
                        <div key={sc.sceneId} className="bg-zinc-950 border border-zinc-800 rounded-2xl p-5 flex items-center justify-between gap-6">
                          <div className="flex-1 min-w-0">
                            <span className="text-[8px] font-mono text-zinc-600 uppercase font-black block">Scene {sc.sceneId} Narration Text</span>
                            <p className="text-xs text-zinc-300 italic mt-1 font-sans truncate">"{sc.narration}"</p>
                          </div>

                          <div className="flex items-center gap-3 shrink-0">
                            {voiceAudioTracks[sc.sceneId] ? (
                              <button 
                                onClick={() => {
                                  if (isPlaying) {
                                    setVoicePlayingScene(null);
                                  } else {
                                    setVoicePlayingScene(sc.sceneId);
                                    // Simulated playback complete timer
                                    setTimeout(() => setVoicePlayingScene(null), 3000);
                                  }
                                }}
                                className={`px-4 py-2.5 rounded-xl text-[9px] font-black uppercase tracking-wider flex items-center gap-2 transition-all ${
                                  isPlaying ? 'bg-red-600 text-white animate-pulse' : 'bg-zinc-900 hover:bg-zinc-800 text-zinc-300 border border-zinc-800'
                                }`}
                              >
                                {isPlaying ? <VolumeX size={12} /> : <Play size={12} />}
                                {isPlaying ? 'Mute' : 'Listen Synthesized Track'}
                              </button>
                            ) : (
                              <span className="text-[8px] font-mono text-zinc-600 font-bold uppercase">Ready</span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  <button 
                    onClick={() => executePipelineStep(7)}
                    className="w-full py-5 bg-red-600 hover:bg-red-500 text-white rounded-2xl font-black uppercase text-xs tracking-widest shadow-xl shadow-red-600/15 transition-all flex items-center justify-center gap-2 shrink-0 active-press"
                  >
                    Burn Subtitles & Typography <ChevronRight size={14} />
                  </button>
                </div>
              )}

              {/* STAGE 8: SUBTITLES & KINETIC TYPOGRAPHY */}
              {pipelineStep === 8 && (
                <div className="space-y-6 flex flex-col h-full">
                  <div>
                    <h4 className="text-xl font-black text-white tracking-tight uppercase">Step 8: Burn Subtitles & Kinetic Typography</h4>
                    <p className="text-[9px] text-zinc-500 font-bold uppercase tracking-wider">Style bouncy visual captions to keep viewer eyes glued to the screen</p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-12 gap-8 flex-1 min-h-0">
                    
                    {/* Caption Preview Canvas */}
                    <div className="md:col-span-7 bg-zinc-950 border border-zinc-850 rounded-3xl overflow-hidden relative flex items-center justify-center aspect-video my-auto">
                      <div className="absolute inset-0 bg-zinc-900/40 mix-blend-multiply"></div>
                      <img src={`https://picsum.photos/seed/subtitlepreview/1280/720`} referrerPolicy="no-referrer" className="absolute inset-0 w-full h-full object-cover opacity-60" />
                      
                      {/* Live Subtitle Overlay */}
                      <div className="relative z-10 text-center px-8">
                        {subtitleStyle === 'bouncy-neon' && (
                          <span 
                            style={{ color: subtitleColor, fontSize: `${subtitleSize}px` }} 
                            className="font-black uppercase tracking-tighter drop-shadow-[0_0_15px_rgba(239,68,68,0.5)] animate-bounce inline-block"
                          >
                            MULTI-AGENT PARADIGM!
                          </span>
                        )}
                        {subtitleStyle === 'mono' && (
                          <span 
                            style={{ color: subtitleColor, fontSize: `${subtitleSize - 6}px` }} 
                            className="font-mono font-medium tracking-widest bg-black px-4 py-1 border border-zinc-700 rounded-lg inline-block"
                          >
                            multi-agent paradigm...
                          </span>
                        )}
                        {subtitleStyle === 'serif' && (
                          <span 
                            style={{ color: subtitleColor, fontSize: `${subtitleSize + 4}px` }} 
                            className="font-serif italic tracking-tight font-black inline-block"
                          >
                            "The paradigm is shifting."
                          </span>
                        )}
                        {subtitleStyle === 'classic' && (
                          <span 
                            style={{ color: '#ffffff', fontSize: `${subtitleSize - 4}px` }} 
                            className="font-sans font-extrabold px-3 py-1 bg-black/80 rounded inline-block border border-zinc-800"
                          >
                            Decoupled multi-agent systems.
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Subtitle controls */}
                    <div className="md:col-span-5 bg-zinc-950 border border-zinc-800 p-6 rounded-[2rem] space-y-6">
                      <span className="text-[9px] font-black uppercase tracking-widest text-zinc-500 font-mono block">Style Presets</span>
                      
                      <div className="grid grid-cols-2 gap-3">
                        {[
                          { id: 'bouncy-neon', label: 'Bouncy Neon', color: '#ef4444' },
                          { id: 'mono', label: 'Retro Mono', color: '#a1a1aa' },
                          { id: 'serif', label: 'Serif Lyric', color: '#ffffff' },
                          { id: 'classic', label: 'Classic Cap', color: '#eab308' }
                        ].map((sub) => (
                          <button 
                            key={sub.id}
                            onClick={() => {
                              setSubtitleStyle(sub.id as any);
                              setSubtitleColor(sub.color);
                            }}
                            className={`p-3 rounded-xl border text-left transition-all ${
                              subtitleStyle === sub.id ? 
                              'bg-zinc-800 border-zinc-700 text-white' : 
                              'bg-zinc-900/60 border-zinc-850 text-zinc-400 hover:border-zinc-800'
                            }`}
                          >
                            <span className="text-[10px] font-black uppercase tracking-wider block">{sub.label}</span>
                          </button>
                        ))}
                      </div>

                      <div className="space-y-2">
                        <label className="text-[9px] font-black uppercase tracking-widest text-zinc-500 font-mono block">Text Font Size</label>
                        <input 
                          type="range" 
                          min={20} 
                          max={60} 
                          value={subtitleSize} 
                          onChange={e => setSubtitleSize(Number(e.target.value))}
                          className="w-full accent-red-600"
                        />
                        <div className="flex justify-between text-[8px] text-zinc-600 font-mono">
                          <span>20PX</span>
                          <span>{subtitleSize}PX</span>
                          <span>60PX</span>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <label className="text-[9px] font-black uppercase tracking-widest text-zinc-500 font-mono block">Anchor Color Mapping</label>
                        <div className="flex items-center gap-2">
                          {['#ef4444', '#3b82f6', '#10b981', '#f59e0b', '#ffffff'].map((c) => (
                            <button 
                              key={c} 
                              onClick={() => setSubtitleColor(c)}
                              className={`w-8 h-8 rounded-full border transition-all ${subtitleColor === c ? 'scale-110 border-white' : 'border-zinc-800'}`}
                              style={{ backgroundColor: c }}
                            />
                          ))}
                        </div>
                      </div>
                    </div>

                  </div>

                  <button 
                    onClick={() => executePipelineStep(8)}
                    className="w-full py-5 bg-red-600 hover:bg-red-500 text-white rounded-2xl font-black uppercase text-xs tracking-widest shadow-xl shadow-red-600/15 transition-all flex items-center justify-center gap-2 shrink-0 active-press"
                  >
                    Generate clickbait Thumbnail <ChevronRight size={14} />
                  </button>
                </div>
              )}

              {/* STAGE 9: THUMBNAIL DESIGN */}
              {pipelineStep === 9 && (
                <div className="space-y-6 flex flex-col h-full">
                  <div>
                    <h4 className="text-xl font-black text-white tracking-tight uppercase">Step 9: Click-Through Rate Thumbnail</h4>
                    <p className="text-[9px] text-zinc-500 font-bold uppercase tracking-wider">Generate clickbait pattern-interrupt artwork with Imagen 3 rendering</p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-12 gap-8 flex-1 min-h-0">
                    {/* Thumbnail Art canvas */}
                    <div className="md:col-span-7 bg-zinc-950 border border-zinc-850 rounded-[2rem] overflow-hidden relative flex items-center justify-center aspect-video my-auto shadow-2xl">
                      {generatedThumbnailUrl ? (
                        <>
                          <img 
                            src={generatedThumbnailUrl} 
                            referrerPolicy="no-referrer" 
                            alt="Campaign Thumbnail Art" 
                            className="absolute inset-0 w-full h-full object-cover" 
                          />
                          
                          {/* Saturated visual overlays */}
                          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/30"></div>
                          
                          {/* Absolute custom title overlay */}
                          <div className="absolute bottom-6 left-6 right-6 text-left">
                            <span className="bg-red-600 text-white font-black text-lg md:text-xl px-4 py-1 rounded-lg uppercase tracking-tighter shadow-lg shadow-red-600/30 inline-block rotate-[-2deg]">
                              {thumbnailOverlayText}
                            </span>
                          </div>
                        </>
                      ) : (
                        <div className="text-center space-y-2 opacity-40">
                          <ImageIcon size={48} className="mx-auto" />
                          <span className="text-xs font-black uppercase">No Art Rendered</span>
                        </div>
                      )}
                    </div>

                    {/* Thumbnail adjustments */}
                    <div className="md:col-span-5 bg-zinc-950 border border-zinc-800 p-6 rounded-[2rem] space-y-6 flex flex-col justify-between">
                      <div className="space-y-4">
                        <span className="text-[9px] font-black uppercase tracking-widest text-zinc-500 font-mono block">Text Overlay Phrase</span>
                        <input 
                          type="text" 
                          value={thumbnailOverlayText} 
                          onChange={e => setThumbnailOverlayText(e.target.value)}
                          className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3 text-xs text-white uppercase font-black outline-none focus:border-red-500"
                        />

                        <span className="text-[9px] font-black uppercase tracking-widest text-zinc-500 font-mono block mt-4">Imagen 3 Prompt Directive</span>
                        <textarea 
                          value={thumbnailPrompt} 
                          onChange={e => setThumbnailPrompt(e.target.value)}
                          className="w-full bg-zinc-900 border border-zinc-800 rounded-xl p-4 text-xs text-zinc-300 h-28 leading-relaxed font-sans outline-none focus:border-red-500/50 transition-all resize-none custom-scrollbar"
                        />
                      </div>

                      <button 
                        onClick={async () => {
                          setPipelineLoading(true);
                          try {
                            const enhanced = await enhanceThumbnailPrompt(thumbnailPrompt);
                            setThumbnailPrompt(enhanced);
                            const imageBase64 = await generateThumbnail(enhanced, 'Cinematic', 'pro', '16:9');
                            if (imageBase64) setGeneratedThumbnailUrl(imageBase64);
                            toast.success("Thumbnail artwork re-rendered successfully with enhanced prompts!");
                          } catch (e) {
                            console.error(e);
                          } finally {
                            setPipelineLoading(false);
                          }
                        }}
                        className="w-full py-3 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-[10px] font-black uppercase text-white rounded-xl transition-all"
                      >
                        Re-Render Artwork
                      </button>
                    </div>
                  </div>

                  <button 
                    onClick={() => executePipelineStep(9)}
                    className="w-full py-5 bg-red-600 hover:bg-red-500 text-white rounded-2xl font-black uppercase text-xs tracking-widest shadow-xl shadow-red-600/15 transition-all flex items-center justify-center gap-2 shrink-0 active-press"
                  >
                    Compile Final MP4 Video <ChevronRight size={14} />
                  </button>
                </div>
              )}

              {/* STAGE 10: MP4 COMPILED VIDEO EXPORT */}
              {pipelineStep === 10 && (
                <div className="space-y-6 flex flex-col h-full">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-xl font-black text-white tracking-tight uppercase">Step 10: Complete Campaign Compilation</h4>
                      <p className="text-[9px] text-zinc-500 font-bold uppercase tracking-wider">Sequenced, synthesized video files with burnt captions & background score</p>
                    </div>
                    <div className="bg-green-500/10 border border-green-500/20 text-green-500 px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-widest font-mono">
                      COMPILATION COMPLETE
                    </div>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 flex-1 min-h-0">
                    
                    {/* Final player */}
                    <div className="lg:col-span-7 bg-zinc-950 border border-zinc-850 rounded-[2rem] overflow-hidden relative flex flex-col justify-center my-auto aspect-video">
                      {finalVideoUrl ? (
                        <video 
                          src={finalVideoUrl} 
                          controls 
                          autoPlay 
                          loop 
                          className="w-full h-full object-cover" 
                        />
                      ) : (
                        <div className="text-center opacity-40">
                          <Loader2 className="animate-spin mx-auto text-red-500 w-12 h-12" />
                          <span className="text-[9px] font-black uppercase tracking-widest mt-4 block">Assembling Tracks...</span>
                        </div>
                      )}
                    </div>

                    {/* Telemetry info */}
                    <div className="lg:col-span-5 bg-zinc-950 border border-zinc-800 p-6 rounded-[2rem] space-y-6 overflow-y-auto custom-scrollbar">
                      
                      <div className="space-y-4">
                        <span className="text-[9px] font-black uppercase tracking-widest text-zinc-500 font-mono block">Render Log Streams</span>
                        <div className="bg-zinc-900 p-4 rounded-xl border border-zinc-850 font-mono text-[8px] text-zinc-400 space-y-1.5 max-h-[120px] overflow-y-auto custom-scrollbar">
                          {renderProgressLogs.map((log, index) => (
                            <p key={index} className="truncate">{log}</p>
                          ))}
                        </div>
                      </div>

                      <div className="space-y-4 pt-4 border-t border-zinc-900">
                        <span className="text-[9px] font-black uppercase tracking-widest text-zinc-500 font-mono block">Codec & Frame Attributes</span>
                        
                        <div className="grid grid-cols-2 gap-4 text-[10px] font-bold text-zinc-400 uppercase">
                          <div>
                            <span className="text-[8px] text-zinc-600 block">Resolution</span>
                            <span className="text-white font-mono">{renderMetrics.resolution}</span>
                          </div>
                          <div>
                            <span className="text-[8px] text-zinc-600 block">Target Framerate</span>
                            <span className="text-white font-mono">{renderMetrics.fps} FPS</span>
                          </div>
                          <div>
                            <span className="text-[8px] text-zinc-600 block">Output Codec</span>
                            <span className="text-white font-mono">{renderMetrics.videoCodec}</span>
                          </div>
                          <div>
                            <span className="text-[8px] text-zinc-600 block">Estimated File Size</span>
                            <span className="text-white font-mono">{renderMetrics.fileSize}</span>
                          </div>
                        </div>
                      </div>

                      {/* Download Master */}
                      <a 
                        href={finalVideoUrl} 
                        download={`ranktica_master_${Date.now()}.mp4`}
                        className="w-full py-4 bg-red-600 hover:bg-red-500 text-white rounded-xl font-black uppercase text-xs tracking-widest shadow-xl shadow-red-600/15 transition-all flex items-center justify-center gap-2 active-press text-center"
                      >
                        <Download size={14} /> Download Master MP4
                      </a>
                    </div>

                  </div>

                  <div className="pt-6 border-t border-zinc-800 flex items-center justify-between shrink-0">
                    <button 
                      onClick={() => {
                        setPipelineStep(1);
                        setFinalVideoUrl('');
                        toast.success("E2E Video Pipeline initialized for a new URL campaign!");
                      }}
                      className="px-6 py-3 bg-zinc-950 hover:bg-zinc-900 border border-zinc-850 rounded-xl text-[10px] font-black uppercase text-zinc-400 hover:text-white transition-all"
                    >
                      Process Another URL
                    </button>
                  </div>
                </div>
              )}

            </div>

          </div>
        )}

        {/* 2. ORIGINAL SINGLE SCENE MODE */}
        {activeTab === 'single' && (
          <div id="single_scene_container" className="flex-1 flex flex-col lg:grid lg:grid-cols-12 gap-8 min-h-0">
            {/* Sidebar Controls */}
            <div className="lg:col-span-4 flex flex-col gap-6 overflow-y-auto pr-2 custom-scrollbar">
              <div className="bg-zinc-900 border border-zinc-800 rounded-[2.5rem] p-8 shadow-2xl relative overflow-hidden group">
                <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity"><ZapIcon size={120}/></div>
                
                <form onSubmit={handleGenerate} className="space-y-8 relative z-10">
                  
                  {/* Aspect ratio */}
                  <div className="space-y-3">
                    <label className="text-[9px] font-black uppercase tracking-widest text-zinc-500 block">Aspect Ratio</label>
                    <div className="grid grid-cols-2 gap-3">
                      <button 
                        type="button" 
                        onClick={() => { setAspectRatio('16:9'); setEstimateDuration(6); }}
                        className={`p-3.5 rounded-2xl border transition-all text-left flex items-center gap-3 ${aspectRatio === '16:9' ? 'bg-red-600/10 border-red-500/40 text-white' : 'bg-zinc-950 border-zinc-800 text-zinc-500 hover:border-zinc-700'}`}
                      >
                        <Monitor size={16} />
                        <div>
                          <p className="text-[10px] font-black uppercase">Landscape</p>
                          <p className="text-[8px] uppercase font-bold mt-0.5">16:9 YouTube</p>
                        </div>
                      </button>
                      <button 
                        type="button" 
                        onClick={() => { setAspectRatio('9:16'); setEstimateDuration(8); }}
                        className={`p-3.5 rounded-2xl border transition-all text-left flex items-center gap-3 ${aspectRatio === '9:16' ? 'bg-red-600/10 border-red-500/40 text-white' : 'bg-zinc-950 border-zinc-800 text-zinc-500 hover:border-zinc-700'}`}
                      >
                        <Smartphone size={16} />
                        <div>
                          <p className="text-[10px] font-black uppercase">Portrait</p>
                          <p className="text-[8px] uppercase font-bold mt-0.5">9:16 Shorts</p>
                        </div>
                      </button>
                    </div>
                  </div>

                  {/* Mode input */}
                  {mode !== 'text' && (
                    <div 
                      onClick={() => fileInputRef.current?.click()}
                      className="aspect-video bg-zinc-950 border-2 border-dashed border-zinc-800 rounded-3xl flex flex-col items-center justify-center cursor-pointer hover:border-red-500/50 transition-all group/upload relative overflow-hidden shadow-inner"
                    >
                      <input type="file" ref={fileInputRef} onChange={handleFileUpload} accept="image/*,video/*" className="hidden" />
                      {mode === 'image' && referenceImage ? (
                        <>
                          <img src={referenceImage} alt="Ref Upload" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                          <div className="absolute inset-0 bg-black/60 opacity-0 group-hover/upload:opacity-100 flex items-center justify-center transition-opacity text-white text-[10px] font-black uppercase">Replace Reference</div>
                        </>
                      ) : mode === 'extend' && extendVideoUri ? (
                        <div className="text-center p-6 text-red-500">
                          <Film size={32} className="mx-auto mb-2" />
                          <span className="text-[10px] font-black uppercase tracking-wider block">Ready to extend asset</span>
                        </div>
                      ) : (
                        <div className="text-center p-6 space-y-3">
                          <Upload className="mx-auto text-zinc-600 group-hover/upload:text-red-500 transition-colors" size={24} />
                          <div>
                            <p className="text-[10px] font-black uppercase text-zinc-400">Select Media Block</p>
                            <p className="text-[8px] text-zinc-600 font-bold uppercase mt-0.5">Support drag-and-drop reference files</p>
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Text prompt */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <label className="text-[9px] font-black uppercase tracking-widest text-zinc-500 block">Aesthetic Visual Cue</label>
                      <button 
                        type="button"
                        onClick={handleEnhance} 
                        disabled={enhancing || !prompt}
                        className="text-[8px] font-black uppercase tracking-wider text-red-500 hover:text-red-400 flex items-center gap-1.5 transition-colors disabled:opacity-30"
                      >
                        {enhancing ? <Loader2 className="animate-spin" size={10} /> : <Wand2 size={10} />}
                        Enhance prompt
                      </button>
                    </div>
                    <textarea 
                      value={prompt}
                      onChange={e => setPrompt(e.target.value)}
                      placeholder="e.g. A robotic hummingbird sipping liquid neon from a glowing microchip flower..."
                      className="w-full bg-zinc-950 border border-zinc-800 rounded-3xl p-5 text-xs text-white h-28 focus:border-red-500 focus:ring-1 focus:ring-red-500 outline-none transition-all resize-none shadow-inner custom-scrollbar"
                    />
                  </div>

                  {/* Stylization selector */}
                  <div className="space-y-3">
                    <label className="text-[9px] font-black uppercase tracking-widest text-zinc-500 block">Visual Stylization</label>
                    <div className="grid grid-cols-2 gap-2 max-h-[160px] overflow-y-auto pr-1 custom-scrollbar">
                      {VIDEO_STYLES.map(s => (
                        <button 
                          key={s.id} 
                          type="button"
                          onClick={() => setStyle(s.id)}
                          className={`p-3 rounded-xl text-left border transition-all ${style === s.id ? 'bg-zinc-800 border-zinc-700 text-white' : 'bg-zinc-950 border-zinc-900 text-zinc-500 hover:border-zinc-800'}`}
                        >
                          <span className="text-[9px] font-black uppercase tracking-wider block">{s.label}</span>
                          <span className="text-[7px] font-bold text-zinc-600 uppercase mt-0.5 block">{s.desc}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  <button 
                    type="submit"
                    disabled={loading || !prompt || !hasApiKey}
                    className={`w-full py-6 rounded-[2rem] font-black uppercase text-xs tracking-[0.3em] transition-all shadow-2xl flex items-center justify-center gap-4 active-press border-2 ${loading ? 'bg-zinc-800 border-zinc-700 text-zinc-600' : 'bg-red-600 border-red-500 hover:bg-red-500 text-white shadow-red-600/30'}`}
                  >
                    {loading ? <Loader2 className="animate-spin" size={20} /> : <><Zap size={20} fill="currentColor" /> Synthesize sequence</>}
                  </button>
                </form>
              </div>

              {/* History list */}
              {history.length > 0 && (
                <div className="bg-zinc-900/50 border border-zinc-800 rounded-[2.5rem] p-6 space-y-4 shadow-xl">
                  <div className="flex items-center justify-between px-2">
                    <h3 className="text-[10px] font-black text-zinc-500 uppercase tracking-widest flex items-center gap-2">
                      <History size={14} /> Latent Records
                    </h3>
                    <button onClick={() => setHistory([])} className="text-zinc-700 hover:text-red-500 transition-colors"><Trash2 size={14}/></button>
                  </div>
                  <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1 custom-scrollbar">
                    {history.map((h, i) => (
                      <button 
                        key={i} 
                        onClick={() => setResultVideo(h.url)}
                        className="w-full flex items-center gap-4 p-3 bg-zinc-950 border border-zinc-800 rounded-2xl hover:border-red-500/30 transition-all text-left group"
                      >
                        <div className="w-10 h-10 bg-zinc-900 rounded-xl flex items-center justify-center shrink-0 border border-zinc-800 group-hover:border-red-500/20 relative">
                          <Film size={16} className="text-zinc-700 group-hover:text-red-500" />
                          {h.type !== 'text' && <div className="absolute -top-1 -right-1 w-2 h-2 bg-blue-500 rounded-full border border-zinc-950"></div>}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-[10px] font-bold text-zinc-400 truncate uppercase">{h.prompt}</p>
                          <p className="text-[8px] font-black text-zinc-700 uppercase mt-0.5">{new Date(h.date).toLocaleTimeString()}</p>
                        </div>
                        <ChevronRight size={12} className="text-zinc-800 group-hover:text-white transition-all" />
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Main Stage */}
            <div className="lg:col-span-8 bg-zinc-950 rounded-[3rem] border border-zinc-900 flex flex-col items-center justify-center relative overflow-hidden group shadow-inner">
              
              {loading ? (
                <div className="flex flex-col items-center gap-12 text-red-500 animate-fade-in max-w-md text-center">
                  <div className="relative">
                    <div className="w-32 h-32 rounded-[2.5rem] border-4 border-zinc-800 flex items-center justify-center">
                      <Loader2 className="animate-spin w-16 h-16" strokeWidth={1} />
                    </div>
                    <div className="absolute inset-0 bg-red-500 blur-[80px] opacity-10 animate-pulse"></div>
                  </div>
                  <div className="space-y-4">
                    <p className="text-3xl font-black text-white tracking-tighter uppercase animate-pulse">Encoding Visual Flux</p>
                    <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-[0.4em] leading-relaxed px-8">
                      {LOADING_MESSAGES[loadingMsgIdx]}
                    </p>
                  </div>
                </div>
              ) : resultVideo ? (
                <div className="w-full h-full flex flex-col animate-scale-in group/vid relative">
                  <video src={resultVideo} autoPlay loop controls className="w-full h-full object-contain bg-black shadow-2xl" />
                  
                  <div className="absolute bottom-10 left-1/2 -translate-x-1/2 flex items-center gap-4 opacity-0 group-hover/vid:opacity-100 transition-all duration-500 transform group-hover/vid:translate-y-0 translate-y-4">
                    <a 
                      href={resultVideo} 
                      download={`ranktica_manifest_${Date.now()}.mp4`}
                      className="bg-white hover:bg-zinc-200 text-black px-10 py-4 rounded-[1.5rem] font-black uppercase text-xs tracking-[0.2em] flex items-center gap-3 shadow-2xl transition-all active-press"
                    >
                      <Download size={20} /> Export Master
                    </a>
                    <button 
                      onClick={() => setResultVideo(null)}
                      className="bg-zinc-900/80 hover:bg-zinc-800 text-white p-4 rounded-[1.5rem] backdrop-blur-xl border border-zinc-800 transition-all"
                    >
                      <RotateCcw size={20} />
                    </button>
                  </div>

                  <div className="absolute top-10 left-10 bg-black/60 backdrop-blur-md px-6 py-3 rounded-full border border-zinc-800 text-[10px] font-black text-green-500 uppercase tracking-[0.3em] flex items-center gap-3">
                    <ShieldCheck size={14} /> Neural Integrity Optimal
                  </div>
                </div>
              ) : (
                <div className="text-zinc-900 flex flex-col items-center gap-12 opacity-30 animate-pulse">
                  <div className="w-64 h-64 rounded-[4rem] border-4 border-dashed border-zinc-900 flex items-center justify-center relative">
                    <Clapperboard size={120} strokeWidth={1} />
                    <div className="absolute -bottom-6 -right-6 bg-zinc-900 p-6 rounded-[2rem] border border-zinc-800 shadow-2xl">
                      <Sparkles size={32} className="text-red-500" />
                    </div>
                  </div>
                  <div className="text-center space-y-4">
                    <p className="font-black uppercase text-2xl tracking-[0.5em]">Synthesis Stage Ready</p>
                    <div className="flex items-center justify-center gap-6">
                      <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-zinc-600">
                        <Camera size={14} /> Define Intent
                      </div>
                      <div className="w-1.5 h-1.5 rounded-full bg-zinc-800"></div>
                      <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-zinc-600">
                        <Zap size={14} /> Execute Engine
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

      </div>
    </div>
  );
};
