
import React, { useState, useRef, useEffect, useMemo } from 'react';
import { generateVideo } from '@/infrastructure/gemini';
import { useProject } from '@/app/ProjectContext';
import { toast } from 'react-hot-toast';
import { 
  Loader2, 
  Video as VideoIcon, 
  Upload, 
  PlayCircle, 
  Download, 
  Scissors, 
  Plus, 
  Trash2, 
  PauseCircle, 
  SkipBack, 
  SkipForward, 
  Film, 
  Zap, 
  Sparkles,
  Archive,
  Monitor,
  Volume2,
  Lock,
  ExternalLink,
  Star,
  Sun,
  Focus,
  GripVertical,
  VolumeX,
  ChevronRight,
  ChevronLeft,
  Clock,
  Layers,
  Play,
  Pause,
  Maximize,
  Volume1,
  Settings2,
  History,
  Check,
  RotateCcw,
  Copy
} from 'lucide-react';

const LOADING_MESSAGES = [
  "Initializing Veo creative engine...",
  "Analyzing visual descriptors...",
  "Synthesizing high-fidelity frames...",
  "Applying temporal coherence...",
  "Finalizing cinematic render...",
  "Optimizing for 16:9 manifest..."
];

const VIDEO_BLUEPRINTS = [
  {
    id: 'robotic-hummingbird',
    label: 'Iridescent Cyber-Nature',
    prompt: 'A robotic hummingbird with iridescent metallic feathers sipping glowing nectar from a liquid crystal flower, using cinematic movie style, with a slow pan right camera motion, illuminated by golden hour lighting, and captured with a Zeiss Master Prime 35mm lens. 5 second duration.',
    style: 'Cinematic Movie',
    motion: 'Slow Pan Right',
    lighting: 'Golden Hour',
    lens: 'Zeiss Master Prime 35mm',
    aspectRatio: '16:9'
  },
  {
    id: 'tech-cityscape',
    label: 'Future Metro',
    prompt: 'Low angle tracking shot through a hyper-detailed cyberpunk city at night. Rain splashes on a reflective pavement.',
    style: 'Cyberpunk Neon',
    motion: 'Dolly Zoom In',
    lighting: 'Bioluminescent',
    lens: 'Anamorphic 40mm',
    aspectRatio: '16:9'
  }
];

interface LibraryAsset {
  id: string;
  url: string;
  name: string;
  type: 'ai' | 'upload';
  duration: number;
}

interface TimelineClip {
  id: string;
  assetId: string;
  url: string;
  name: string;
  duration: number;
  timelineOffset: number;
  trimStart: number;
  trimEnd: number;
  volume: number;
}

export const VideoStudio: React.FC = () => {
  const { activeProject, updateActiveProject } = useProject();
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle');

  // --- USER TEMPLATES STATE ---
  interface VideoTemplate {
    id: string;
    name: string;
    prompt: string;
    aspectRatio: '16:9' | '9:16';
    resolution: '720p' | '1080p';
  }

  const [templates, setTemplates] = useState<VideoTemplate[]>(() => {
    try {
      const stored = localStorage.getItem('ranktica_video_studio_templates');
      return stored ? JSON.parse(stored) : [];
    } catch (e) {
      return [];
    }
  });
  const [newTemplateName, setNewTemplateName] = useState('');
  const [showSaveTemplateModal, setShowSaveTemplateModal] = useState(false);

  const handleSaveTemplate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTemplateName.trim()) {
      toast.error("Please enter a name for your template.");
      return;
    }

    const template: VideoTemplate = {
      id: Math.random().toString(36).substring(7),
      name: newTemplateName.trim(),
      prompt,
      aspectRatio,
      resolution
    };

    const updated = [template, ...templates];
    setTemplates(updated);
    localStorage.setItem('ranktica_video_studio_templates', JSON.stringify(updated));
    setNewTemplateName('');
    setShowSaveTemplateModal(false);
    toast.success(`Template "${template.name}" saved successfully! 💾`);
  };

  const handleLoadTemplate = (tpl: VideoTemplate) => {
    setPrompt(tpl.prompt);
    setAspectRatio(tpl.aspectRatio);
    if (tpl.resolution) setResolution(tpl.resolution);
    toast.success(`Loaded template: "${tpl.name}" 🚀`);
  };

  const handleDeleteTemplate = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const updated = templates.filter(t => t.id !== id);
    setTemplates(updated);
    localStorage.setItem('ranktica_video_studio_templates', JSON.stringify(updated));
    toast.success("Template deleted.");
  };
  const [activeTab, setActiveTab] = useState<'create' | 'edit'>('create');
  const [hasApiKey, setHasApiKey] = useState(false);
  const [checkingKey, setCheckingKey] = useState(true);

  // --- LIBRARY & GENERATOR STATE ---
  const [library, setLibrary] = useState<LibraryAsset[]>([]);
  const [prompt, setPrompt] = useState(VIDEO_BLUEPRINTS[0].prompt);
  const [aspectRatio, setAspectRatio] = useState<'16:9' | '9:16'>('16:9');
  const [resolution, setResolution] = useState<'720p' | '1080p'>('1080p');
  const [isGenerating, setIsGenerating] = useState(false);
  const [loadingMsgIndex, setLoadingMsgIndex] = useState(0);
  const assetUploadRef = useRef<HTMLInputElement>(null);

  // --- EDITOR STATE ---
  const [timeline, setTimeline] = useState<TimelineClip[]>([]);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [zoomLevel, setZoomLevel] = useState(40); // pixels per second
  const [masterVolume, setMasterVolume] = useState(0.8);
  const [selectedClipId, setSelectedClipId] = useState<string | null>(null);

  // --- MOBILE PLAYER SYNTHESIZER PANEL STATE ---
  interface RecentConfig {
    id: string;
    name: string;
    opacity: number;
    brightness: number;
    pulseDuration: number;
    timestamp: string;
  }

  const [liveOpacity, setLiveOpacity] = useState(1.0);
  const [liveBrightness, setLiveBrightness] = useState(100);
  const [livePulseDuration, setLivePulseDuration] = useState(1.5);
  const [pulsePreset, setPulsePreset] = useState<string>('custom');

  const [recentConfigs, setRecentConfigs] = useState<RecentConfig[]>([
    { id: '1', name: 'Steady Classic', opacity: 1.0, brightness: 100, pulseDuration: 5.0, timestamp: '15:10:02' },
    { id: '2', name: 'Breathe Ambient', opacity: 0.8, brightness: 120, pulseDuration: 3.0, timestamp: '15:15:30' },
    { id: '3', name: 'Alert Neon', opacity: 0.9, brightness: 180, pulseDuration: 1.2, timestamp: '15:20:12' },
    { id: '4', name: 'Hyper Strobe', opacity: 1.0, brightness: 240, pulseDuration: 0.5, timestamp: '15:24:45' },
    { id: '5', name: 'Glow Soft', opacity: 0.95, brightness: 220, pulseDuration: 2.0, timestamp: '15:30:11' },
  ]);
  const [selectedConfigIds, setSelectedConfigIds] = useState<string[]>([]);
  const [isConfirmingDelete, setIsConfirmingDelete] = useState(false);
  const [presetPage, setPresetPage] = useState(0);
  const PRESETS_PER_PAGE = 3;

  const addRecentConfig = (name: string, opacity: number, brightness: number, pulseDuration: number) => {
    const now = new Date();
    const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    const newConfig: RecentConfig = {
      id: Math.random().toString(36).substring(2, 11),
      name,
      opacity,
      brightness,
      pulseDuration,
      timestamp: timeStr
    };
    setRecentConfigs(prev => {
      // Avoid immediate consecutive identical configurations
      const isDuplicate = prev.length > 0 && 
        Math.abs(prev[0].opacity - opacity) < 0.01 && 
        prev[0].brightness === brightness && 
        Math.abs(prev[0].pulseDuration - pulseDuration) < 0.05;
      if (isDuplicate) return prev;
      return [newConfig, ...prev].slice(0, 30); // keep a generous backlog of 30 items
    });
    setPresetPage(0); // Reset to page 1 (index 0) to show the newly added config
  };

  const toggleSelectPreset = (id: string) => {
    setSelectedConfigIds(prev => 
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  const handleRestorePreset = (cfg: RecentConfig) => {
    setTargetOpacity(cfg.opacity);
    setTargetBrightness(cfg.brightness);
    setTargetPulseDuration(cfg.pulseDuration);
    setPulsePreset('custom');
    toast.success(`Restored preset: ${cfg.name} 🔄`);
  };

  // Paginated configs calculation
  const totalPages = Math.ceil(recentConfigs.length / PRESETS_PER_PAGE) || 1;
  const currentPageIndex = Math.min(presetPage, totalPages - 1);
  const paginatedConfigs = useMemo(() => {
    const start = currentPageIndex * PRESETS_PER_PAGE;
    return recentConfigs.slice(start, start + PRESETS_PER_PAGE);
  }, [recentConfigs, currentPageIndex]);

  const handleSelectAll = () => {
    const activeIds = paginatedConfigs.map(c => c.id);
    if (activeIds.length === 0) return;
    const allSelected = activeIds.every(id => selectedConfigIds.includes(id));
    if (allSelected) {
      setSelectedConfigIds(prev => prev.filter(id => !activeIds.includes(id)));
    } else {
      setSelectedConfigIds(prev => Array.from(new Set([...prev, ...activeIds])));
    }
  };

  const handleExportSelected = () => {
    const toExport = recentConfigs.filter(c => selectedConfigIds.includes(c.id));
    if (toExport.length === 0) {
      toast.error('No selected presets found in the current list.');
      return;
    }
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(toExport, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `synth_presets_${new Date().toISOString().slice(0, 10)}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
    toast.success(`Successfully exported ${toExport.length} selected preset(s) to JSON archive! 📦`);
  };

  const handleCaptureCurrentConfig = () => {
    const now = new Date();
    const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    addRecentConfig(`Custom @ ${timeStr}`, liveOpacity, liveBrightness, livePulseDuration);
    toast.success('Captured current live signal settings! 📸');
  };

  // Smooth target values for interpolation/spring transitions on reset/presets
  const [targetOpacity, setTargetOpacity] = useState(1.0);
  const [targetBrightness, setTargetBrightness] = useState(100);
  const [targetPulseDuration, setTargetPulseDuration] = useState(1.5);

  // Sync animation loop for smooth slide transitions (subtle spring/lerp)
  useEffect(() => {
    let animFrame: number;
    const update = () => {
      let changed = false;
      const ease = 0.15; // smooth lerp multiplier

      setLiveOpacity(current => {
        const diff = targetOpacity - current;
        if (Math.abs(diff) > 0.002) {
          changed = true;
          return current + diff * ease;
        }
        return targetOpacity;
      });

      setLiveBrightness(current => {
        const diff = targetBrightness - current;
        if (Math.abs(diff) > 0.2) {
          changed = true;
          return current + diff * ease;
        }
        return targetBrightness;
      });

      setLivePulseDuration(current => {
        const diff = targetPulseDuration - current;
        if (Math.abs(diff) > 0.01) {
          changed = true;
          return current + diff * ease;
        }
        return targetPulseDuration;
      });

      if (changed) {
        animFrame = requestAnimationFrame(update);
      }
    };

    animFrame = requestAnimationFrame(update);
    return () => cancelAnimationFrame(animFrame);
  }, [targetOpacity, targetBrightness, targetPulseDuration]);

  const applyPreset = (preset: string) => {
    setPulsePreset(preset);
    let op = 1.0;
    let br = 100;
    let dur = 1.5;
    let label = 'Custom';

    switch (preset) {
      case 'steady':
        op = 1.0; br = 100; dur = 5.0; label = 'Steady Classic';
        break;
      case 'breathing':
        op = 0.8; br = 120; dur = 3.0; label = 'Breathe Ambient';
        break;
      case 'alert':
        op = 0.9; br = 180; dur = 1.2; label = 'Alert Neon';
        break;
      case 'hyper':
        op = 1.0; br = 240; dur = 0.5; label = 'Hyper Strobe';
        break;
      case 'glow':
        op = 0.95; br = 220; dur = 2.0; label = 'Glow Soft';
        break;
      case 'highcontrast':
        op = 1.0; br = 250; dur = 0.8; label = 'High Contrast';
        break;
      case 'minimalist':
        op = 0.4; br = 70; dur = 4.0; label = 'Minimalist Candle';
        break;
      default:
        return;
    }

    setTargetOpacity(op);
    setTargetBrightness(br);
    setTargetPulseDuration(dur);
    addRecentConfig(`Preset: ${label}`, op, br, dur);
    toast.success(`${label} preset applied 🧘`);
  };

  const handleResetSynthesizer = () => {
    setTargetOpacity(1.0);
    setTargetBrightness(100);
    setTargetPulseDuration(1.5);
    setPulsePreset('custom');
    addRecentConfig('Reset Default', 1.0, 100, 1.5);
    toast.success('Synthesizer settings reset to default! 🔄');
  };

  const handleCopyCSS = () => {
    const cssBlock = `.live-signal {
  opacity: ${liveOpacity.toFixed(2)};
  filter: brightness(${Math.round(liveBrightness)}%);
  animation-duration: ${livePulseDuration.toFixed(1)}s;
}`;
    navigator.clipboard.writeText(cssBlock)
      .then(() => {
        toast.success('CSS copied to clipboard! 📋');
      })
      .catch((err) => {
        console.error('Failed to copy text: ', err);
        toast.error('Failed to copy CSS.');
      });
  };

  // Load draft on project load
  useEffect(() => {
    if (activeProject) {
      const draft = activeProject.assets?.videoDraft;
      if (draft) {
        if (draft.prompt) setPrompt(draft.prompt);
        if (draft.aspectRatio) setAspectRatio(draft.aspectRatio);
        if (draft.resolution) setResolution(draft.resolution);
        if (draft.library) setLibrary(draft.library);
        if (draft.timeline) setTimeline(draft.timeline);
        if (draft.zoomLevel) setZoomLevel(draft.zoomLevel);
        if (draft.masterVolume) setMasterVolume(draft.masterVolume);
      }
    }
  }, [activeProject?.id]);

  // Auto-save draft logic
  useEffect(() => {
    if (!activeProject) return;

    const currentDraft = activeProject.assets?.videoDraft || {};
    if (
      prompt === (currentDraft.prompt || '') &&
      aspectRatio === (currentDraft.aspectRatio || '16:9') &&
      resolution === (currentDraft.resolution || '1080p') &&
      zoomLevel === (currentDraft.zoomLevel || 40) &&
      masterVolume === (currentDraft.masterVolume || 0.8) &&
      JSON.stringify(library) === JSON.stringify(currentDraft.library || []) &&
      JSON.stringify(timeline) === JSON.stringify(currentDraft.timeline || [])
    ) {
      return;
    }

    setSaveStatus('saving');
    const timer = setTimeout(async () => {
      try {
        await updateActiveProject({
          assets: {
            ...activeProject.assets,
            videoDraft: {
              prompt,
              aspectRatio,
              resolution,
              zoomLevel,
              masterVolume,
              library,
              timeline
            }
          }
        });
        setSaveStatus('saved');
        setTimeout(() => setSaveStatus('idle'), 1500);
      } catch (err) {
        console.error('[Video Draft Auto-Save Fail]', err);
        setSaveStatus('idle');
      }
    }, 4000); // 4 seconds debounce for heavier timeline arrays

    return () => clearTimeout(timer);
  }, [prompt, aspectRatio, resolution, zoomLevel, masterVolume, library, timeline, activeProject]);
  
  const timelineRef = useRef<HTMLDivElement>(null);
  const previewVideoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const checkKey = async () => {
      if (window.aistudio) {
        const selected = await window.aistudio.hasSelectedApiKey();
        setHasApiKey(selected);
      }
      setCheckingKey(false);
    };
    checkKey();
  }, []);

  const totalDuration = useMemo(() => {
    return timeline.reduce((max, clip) => Math.max(max, clip.timelineOffset + (clip.trimEnd - clip.trimStart)), 0);
  }, [timeline]);

  const handleSelectKey = async () => {
    if (window.aistudio) {
      await window.aistudio.openSelectKey();
      setHasApiKey(true);
    }
  };

  const applyBlueprint = (bp: typeof VIDEO_BLUEPRINTS[0]) => {
    setPrompt(bp.prompt);
    setAspectRatio(bp.aspectRatio as any);
  };

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!hasApiKey) {
      await handleSelectKey();
      return;
    }
    
    setIsGenerating(true);
    const interval = setInterval(() => {
      setLoadingMsgIndex(prev => (prev + 1) % LOADING_MESSAGES.length);
    }, 4000);

    try {
      const technicalPrompt = `${prompt} Ensure high-end visual fidelity, temporal consistency, and detailed textures.`;
      const url = await generateVideo(technicalPrompt, aspectRatio, undefined, resolution);
      if (url) {
        const newAsset: LibraryAsset = {
          id: Math.random().toString(36).substring(7),
          url,
          name: `AI_Render_${Date.now()}`,
          type: 'ai',
          duration: 5 
        };
        setLibrary(prev => [newAsset, ...prev]);
        setActiveTab('edit');
      }
    } catch (err: any) {
      console.error(err);
      if (err.message?.includes("Requested entity was not found")) {
        setHasApiKey(false);
        alert("API Key not found or project missing billing.");
      }
    } finally {
      clearInterval(interval);
      setIsGenerating(false);
    }
  };

  const addClipToTimeline = (asset: LibraryAsset) => {
    const newClip: TimelineClip = {
      id: Math.random().toString(36).substring(7),
      assetId: asset.id,
      url: asset.url,
      name: asset.name,
      duration: asset.duration,
      timelineOffset: totalDuration,
      trimStart: 0,
      trimEnd: asset.duration,
      volume: 1.0
    };
    setTimeline(prev => [...prev, newClip]);
    setSelectedClipId(newClip.id);
  };

  const removeClip = (id: string) => {
    setTimeline(prev => {
      const filtered = prev.filter(c => c.id !== id);
      let offset = 0;
      return filtered.map(c => {
        const item = { ...c, timelineOffset: offset };
        offset += (c.trimEnd - c.trimStart);
        return item;
      });
    });
    if (selectedClipId === id) setSelectedClipId(null);
  };

  const updateClipTrim = (id: string, start: number, end: number) => {
    setTimeline(prev => {
      let offset = 0;
      return prev.map(c => {
        if (c.id === id) {
          const updated = { ...c, trimStart: start, trimEnd: end, timelineOffset: offset };
          offset += (end - start);
          return updated;
        } else {
          const item = { ...c, timelineOffset: offset };
          offset += (c.trimEnd - c.trimStart);
          return item;
        }
      });
    });
  };

  const updateClipVolume = (id: string, vol: number) => {
    setTimeline(prev => prev.map(c => c.id === id ? { ...c, volume: vol } : c));
  };

  const splitClipAtPlayhead = () => {
    const activeClipIdx = timeline.findIndex(c => 
      currentTime >= c.timelineOffset && 
      currentTime < c.timelineOffset + (c.trimEnd - c.trimStart)
    );

    if (activeClipIdx === -1) return;

    const clip = timeline[activeClipIdx];
    const splitPointInClip = currentTime - clip.timelineOffset;
    const splitPointAbsoluteInSource = clip.trimStart + splitPointInClip;

    const firstHalf: TimelineClip = {
      ...clip,
      id: Math.random().toString(36).substring(7),
      trimEnd: splitPointAbsoluteInSource,
    };

    const secondHalf: TimelineClip = {
      ...clip,
      id: Math.random().toString(36).substring(7),
      trimStart: splitPointAbsoluteInSource,
    };

    const newTimeline = [...timeline];
    newTimeline.splice(activeClipIdx, 1, firstHalf, secondHalf);

    // Recalculate offsets
    let offset = 0;
    const recalculated = newTimeline.map(c => {
      const item = { ...c, timelineOffset: offset };
      offset += (c.trimEnd - c.trimStart);
      return item;
    });

    setTimeline(recalculated);
    setSelectedClipId(secondHalf.id);
  };

  const togglePlay = () => {
    if (totalDuration === 0) return;
    setIsPlaying(!isPlaying);
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space' && document.activeElement?.tagName !== 'INPUT' && document.activeElement?.tagName !== 'TEXTAREA') {
        e.preventDefault();
        togglePlay();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isPlaying, totalDuration]);

  useEffect(() => {
    let frame: number;
    if (isPlaying) {
      const startTime = performance.now();
      const initialTime = currentTime;
      const animate = (now: number) => {
        const delta = (now - startTime) / 1000;
        const next = initialTime + delta;
        if (next >= totalDuration) {
          setIsPlaying(false);
          setCurrentTime(0);
        } else {
          setCurrentTime(next);
          frame = requestAnimationFrame(animate);
        }
      };
      frame = requestAnimationFrame(animate);
    }
    return () => cancelAnimationFrame(frame);
  }, [isPlaying, totalDuration]);

  useEffect(() => {
    if (previewVideoRef.current) {
      const activeClip = timeline.find(c => 
        currentTime >= c.timelineOffset && 
        currentTime < c.timelineOffset + (c.trimEnd - c.trimStart)
      );
      if (activeClip) {
        if (previewVideoRef.current.src !== activeClip.url) {
          previewVideoRef.current.src = activeClip.url;
        }
        const internalTime = activeClip.trimStart + (currentTime - activeClip.timelineOffset);
        if (Math.abs(previewVideoRef.current.currentTime - internalTime) > 0.15) {
          previewVideoRef.current.currentTime = internalTime;
        }
        previewVideoRef.current.volume = activeClip.volume * masterVolume;
      } else {
        previewVideoRef.current.src = "";
      }
    }
  }, [currentTime, timeline, masterVolume]);

  if (checkingKey) {
    return <div className="h-full flex items-center justify-center"><Loader2 className="animate-spin text-red-500" size={48} /></div>;
  }

  if (!hasApiKey) {
    return (
      <div className="h-full flex flex-col items-center justify-center space-y-8 animate-fade-in">
        <div className="p-8 bg-zinc-900 rounded-[3rem] border border-zinc-800 shadow-2xl">
          <Lock size={64} className="text-red-500 mb-6 mx-auto" />
          <h2 className="text-3xl font-black text-white text-center">Video Engine Locked</h2>
          <p className="text-zinc-500 text-center max-w-sm mt-4">Veo synthesis requires a paid API key from a billing-enabled Google Cloud project.</p>
          <button onClick={handleSelectKey} className="w-full bg-red-600 hover:bg-red-500 text-white py-4 rounded-2xl font-black uppercase tracking-widest mt-8 flex items-center justify-center gap-2">
            <Zap size={18} fill="currentColor" /> Initialize Neural Engine
          </button>
        </div>
      </div>
    );
  }

  const selectedClip = timeline.find(c => c.id === selectedClipId);

  return (
    <div className="h-[calc(100vh-6rem)] flex flex-col animate-fade-in overflow-hidden">
      {/* Header */}
      <header className="flex flex-col md:flex-row md:items-center justify-between py-4 border-b border-zinc-800 shrink-0 mb-6 gap-4">
        <div className="flex items-center gap-4">
          <div className="p-2.5 bg-red-600/10 rounded-xl border border-red-500/20 text-red-500">
             <VideoIcon size={24} />
          </div>
          <div>
            <h2 className="text-2xl font-black text-white tracking-tighter">Video Architect Studio</h2>
            <p className="text-zinc-500 text-[9px] font-bold uppercase tracking-[0.2em]">Neural Content Synthesis & Linear Editing</p>
          </div>
        </div>
        
        <div className="flex bg-zinc-900/50 rounded-2xl p-1 border border-zinc-800">
          <button onClick={() => setActiveTab('create')} className={`px-6 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${activeTab === 'create' ? 'bg-zinc-800 text-white' : 'text-zinc-500'}`}>Visual Synthesis</button>
          <button onClick={() => setActiveTab('edit')} className={`px-6 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${activeTab === 'edit' ? 'bg-zinc-800 text-white' : 'text-zinc-500'}`}>Sequencer</button>
        </div>
      </header>

      <div className="flex-1 flex flex-col md:flex-row gap-6 min-h-0">
        {/* Left Sidebar: Assets & Blueprints */}
        <div className="w-full md:w-[320px] flex flex-col gap-4 shrink-0 overflow-y-auto no-scrollbar">
          
          {/* Library / Synthesis Input */}
          <div className="bg-zinc-900 border border-zinc-800 rounded-[2rem] p-6 space-y-6 shadow-2xl">
             {activeTab === 'create' ? (
                <div className="space-y-6">
                   <div className="flex items-center justify-between">
                      <h3 className="text-[10px] font-black text-zinc-500 uppercase tracking-widest flex items-center gap-2"><Star size={12} className="text-yellow-500" /> Blueprints</h3>
                   </div>
                   <div className="space-y-2">
                      {VIDEO_BLUEPRINTS.map(bp => (
                         <button key={bp.id} onClick={() => applyBlueprint(bp)} className={`w-full text-left p-3 rounded-xl border transition-all ${prompt === bp.prompt ? 'border-red-500 bg-red-500/5' : 'border-zinc-800 bg-zinc-950 hover:border-zinc-700'}`}>
                            <span className="text-[10px] font-black text-zinc-400 block uppercase mb-1">{bp.label}</span>
                            <p className="text-[10px] text-zinc-600 line-clamp-1 italic">"{bp.prompt}"</p>
                         </button>
                      ))}
                   </div>
                   <div className="w-full h-px bg-zinc-800"></div>
                   <div className="space-y-3 animate-fade-in">
                      <div className="flex items-center justify-between">
                         <h3 className="text-[10px] font-black text-zinc-500 uppercase tracking-widest flex items-center gap-2"><Settings2 size={12} className="text-red-500 animate-pulse" /> Saved Templates</h3>
                         <button type="button" onClick={() => setShowSaveTemplateModal(true)} className="text-[9px] font-black uppercase text-red-400 hover:text-white flex items-center gap-1 bg-red-950/20 border border-red-500/10 px-2.5 py-1 rounded-lg">
                            <Plus size={10} /> Save Current
                         </button>
                      </div>
                      {templates.length === 0 ? (
                        <p className="text-[10px] text-zinc-600 italic px-1 leading-relaxed">Save current prompt, aspect ratio, and resolution as a reusable template.</p>
                      ) : (
                        <div className="space-y-2 max-h-36 overflow-y-auto pr-1">
                           {templates.map(tpl => (
                              <div key={tpl.id} onClick={() => handleLoadTemplate(tpl)} className="group/tpl flex items-center justify-between p-2.5 rounded-xl border border-zinc-800 bg-zinc-950 hover:border-red-550/40 transition-all cursor-pointer">
                                 <div className="flex flex-col truncate pr-2">
                                    <span className="text-[10px] font-black text-zinc-300 truncate">{tpl.name}</span>
                                    <span className="text-[8px] text-zinc-500 font-mono uppercase tracking-wider">{tpl.aspectRatio} | {tpl.resolution || '1080p'}</span>
                                 </div>
                                 <button type="button" onClick={(e) => handleDeleteTemplate(tpl.id, e)} className="text-zinc-600 hover:text-red-500 p-1 rounded-md hover:bg-zinc-900 transition-colors opacity-0 group-hover/tpl:opacity-100 shrink-0">
                                    <Trash2 size={11} />
                                 </button>
                              </div>
                           ))}
                        </div>
                      )}
                   </div>
                   <div className="w-full h-px bg-zinc-800"></div>
                   <div className="space-y-4">
                      <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest block ml-1">Directives</label>
                      <textarea value={prompt} onChange={e => setPrompt(e.target.value)} className="w-full h-32 bg-zinc-950 border border-zinc-800 rounded-2xl p-4 text-xs text-white outline-none focus:border-red-500 transition-all resize-none" placeholder="Temporal sequence manifest..." />
                      <div className="flex gap-2">
                         <select value={aspectRatio} onChange={e => setAspectRatio(e.target.value as any)} className="flex-1 bg-zinc-950 border border-zinc-800 rounded-xl p-2.5 text-[10px] font-black uppercase text-zinc-500">
                           <option value="16:9">16:9 Landscape</option>
                           <option value="9:16">9:16 Portrait</option>
                         </select>
                         <select value={resolution} onChange={e => setResolution(e.target.value as any)} className="flex-1 bg-zinc-950 border border-zinc-800 rounded-xl p-2.5 text-[10px] font-black uppercase text-zinc-500">
                           <option value="1080p">1080p HD</option>
                           <option value="720p">720p SD</option>
                         </select>
                      </div>
                      <button onClick={handleGenerate} disabled={isGenerating || !prompt} className="w-full bg-red-600 hover:bg-red-500 disabled:opacity-50 text-white py-4 rounded-2xl font-black uppercase text-[10px] tracking-widest transition-all shadow-xl flex items-center justify-center gap-2">
                         {isGenerating ? <Loader2 className="animate-spin" size={14} /> : <><Sparkles size={14} /> Synthesize Sequence</>}
                      </button>
                   </div>
                </div>
             ) : (
                <div className="space-y-6">
                   <div className="flex items-center justify-between">
                      <h3 className="text-[10px] font-black text-zinc-500 uppercase tracking-widest flex items-center gap-2"><Archive size={12} className="text-blue-500" /> Source Library</h3>
                      <button onClick={() => assetUploadRef.current?.click()} className="p-1.5 hover:bg-zinc-800 rounded-lg text-zinc-500"><Plus size={16}/></button>
                      <input type="file" ref={assetUploadRef} className="hidden" accept="video/*" />
                   </div>
                   <div className="grid grid-cols-1 gap-3">
                      {library.length === 0 ? (
                        <div className="p-8 border-2 border-dashed border-zinc-800 rounded-2xl text-center opacity-30">
                           <Film size={24} className="mx-auto mb-2" />
                           <p className="text-[10px] font-black uppercase">Archive Empty</p>
                        </div>
                      ) : (
                        library.map(asset => (
                          <div key={asset.id} onClick={() => addClipToTimeline(asset)} className="group bg-zinc-950 border border-zinc-800 p-2 rounded-2xl cursor-pointer hover:border-red-500/50 transition-all">
                             <div className="aspect-video bg-zinc-900 rounded-xl mb-2 flex items-center justify-center overflow-hidden relative">
                                <video src={asset.url} className="w-full h-full object-cover opacity-60 group-hover:opacity-100" />
                                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                                   <Plus className="text-white" size={24} />
                                </div>
                                <span className="absolute bottom-1 right-1 text-[8px] bg-black/80 px-1.5 py-0.5 rounded text-zinc-400 font-bold">5.0s</span>
                             </div>
                             <p className="text-[9px] font-black text-zinc-500 truncate px-1 uppercase tracking-widest">{asset.name}</p>
                          </div>
                        ))
                      )}
                   </div>
                </div>
             )}
          </div>

          {/* Contextual Clip Editor Panel */}
          {activeTab === 'edit' && selectedClip && (
            <div className="bg-zinc-900 border border-zinc-800 rounded-[2rem] p-6 space-y-6 shadow-2xl animate-scale-in">
               <div className="flex items-center justify-between">
                  <h3 className="text-[10px] font-black text-zinc-500 uppercase tracking-widest flex items-center gap-2"><Settings2 size={12} className="text-purple-500" /> Clip Manifest</h3>
                  <button onClick={() => setSelectedClipId(null)} className="text-zinc-600 hover:text-white"><Plus size={14} className="rotate-45" /></button>
               </div>
               
               <div className="space-y-4">
                  <div className="space-y-2">
                     <label className="text-[9px] font-black text-zinc-600 uppercase ml-1">Precise Trim</label>
                     <div className="grid grid-cols-2 gap-2">
                        <div className="bg-zinc-950 border border-zinc-800 rounded-xl p-2.5">
                           <span className="text-[8px] font-bold text-zinc-700 block mb-1 uppercase">Start Offset</span>
                           <input type="number" step="0.1" value={selectedClip.trimStart} onChange={e => updateClipTrim(selectedClip.id, parseFloat(e.target.value), selectedClip.trimEnd)} className="w-full bg-transparent text-xs font-mono text-white outline-none" />
                        </div>
                        <div className="bg-zinc-950 border border-zinc-800 rounded-xl p-2.5">
                           <span className="text-[8px] font-bold text-zinc-700 block mb-1 uppercase">End Limit</span>
                           <input type="number" step="0.1" value={selectedClip.trimEnd} onChange={e => updateClipTrim(selectedClip.id, selectedClip.trimStart, parseFloat(e.target.value))} className="w-full bg-transparent text-xs font-mono text-white outline-none" />
                        </div>
                     </div>
                  </div>

                  <div className="space-y-2">
                     <div className="flex justify-between items-center ml-1">
                        <label className="text-[9px] font-black text-zinc-600 uppercase">Gain Control</label>
                        <span className="text-[9px] font-mono text-purple-400">{Math.round(selectedClip.volume * 100)}%</span>
                     </div>
                     <div className="flex items-center gap-3 bg-zinc-950 border border-zinc-800 p-2.5 rounded-xl">
                        <Volume1 size={14} className="text-zinc-700" />
                        <input type="range" min="0" max="1" step="0.01" value={selectedClip.volume} onChange={e => updateClipVolume(selectedClip.id, parseFloat(e.target.value))} className="flex-1 accent-purple-600 h-1.5" />
                        <Volume2 size={14} className="text-zinc-700" />
                     </div>
                  </div>

                  <div className="pt-2">
                     <button onClick={() => removeClip(selectedClip.id)} className="w-full py-3 bg-red-600/10 hover:bg-red-600/20 border border-red-500/20 text-red-500 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2">
                        <Trash2 size={12} /> Delete Fragment
                     </button>
                  </div>
               </div>
            </div>
          )}
        </div>

        {/* Main Workspace */}
        <div className="flex-1 flex flex-col gap-6 min-w-0">
          
          {/* Top Desktop & Offline GPU Status Bar */}
          <div className="bg-zinc-950 border border-zinc-800 rounded-2xl p-3 flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 bg-purple-950 text-purple-400 border border-purple-800 rounded text-[9px] font-mono font-bold uppercase">
                Desktop Packager
              </span>
              <span className="text-zinc-200 font-bold">Ranktica Desktop for macOS & Windows</span>
              <span className="text-zinc-500 text-[10px] hidden sm:inline">(Electron Native + Metal/CUDA acceleration)</span>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-[10px] font-mono text-emerald-400 bg-emerald-950/60 border border-emerald-800/80 px-2.5 py-1 rounded-full font-bold flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                NVIDIA RTX / Metal GPU Offline Pipeline Active
              </span>
              <button 
                type="button" 
                onClick={() => toast.success("Ranktica Desktop Installer build queued for macOS (.dmg) and Windows (.exe)")}
                className="px-3 py-1 bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-white rounded-lg text-[10px] font-bold transition-all"
              >
                Download Native App
              </button>
            </div>
          </div>

          {/* Top Row: Preview Window & Synthesizer Deck */}
          <div className="flex-1 flex flex-col xl:flex-row gap-6 min-h-0">
             
             {/* Preview Window */}
             <div className="flex-1 bg-zinc-950 rounded-[3rem] border border-zinc-800 relative overflow-hidden group flex flex-col shadow-inner">
                {activeTab === 'create' && isGenerating ? (
                  <div className="flex-1 flex flex-col items-center justify-center gap-6 text-red-500">
                     <div className="relative">
                       <Loader2 className="animate-spin w-16 h-16" strokeWidth={1} />
                       <div className="absolute inset-0 bg-red-500 blur-[60px] opacity-10 animate-pulse"></div>
                     </div>
                     <div className="text-center">
                        <p className="text-xl font-black text-white tracking-tighter uppercase animate-pulse">Encoding Latent Frames</p>
                        <p className="text-[10px] text-zinc-500 font-bold uppercase mt-2">{LOADING_MESSAGES[loadingMsgIndex]}</p>
                     </div>
                  </div>
                ) : (
                  <div className="flex-1 flex flex-col relative bg-black min-h-[280px]">
                     <video ref={previewVideoRef} className="w-full h-full object-contain" onEnded={() => setIsPlaying(false)} />
                     
                     {/* Persistent Mini Control Bar */}
                     <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-between">
                        <div className="flex items-center gap-4">
                           <button onClick={togglePlay} className="p-2 text-white hover:text-red-500 transition-all">
                              {isPlaying ? <Pause size={24} /> : <Play size={24} />}
                           </button>
                           <div className="text-xs font-mono font-black text-zinc-300">
                              {currentTime.toFixed(2)}s / {totalDuration.toFixed(2)}s
                           </div>
                        </div>
                        <div className="flex items-center gap-4">
                           <div className="flex items-center gap-2">
                              <Volume1 size={16} className="text-zinc-500" />
                              <input type="range" min="0" max="1" step="0.1" value={masterVolume} onChange={e => setMasterVolume(parseFloat(e.target.value))} className="w-20 accent-red-600 h-1" />
                           </div>
                           <button className="p-2 text-zinc-400 hover:text-white"><Maximize size={18} /></button>
                        </div>
                     </div>
                  </div>
                )}
             </div>

             {/* Synthesizer Deck & Mobile Player Mockup */}
             <div 
               id="video-mock-mobile-player" 
               className="w-full xl:w-[320px] shrink-0 bg-[#0a0a0d] border border-zinc-850 rounded-[2.5rem] p-5 shadow-2xl flex flex-col justify-between gap-4 relative overflow-hidden select-none animate-fade-in"
             >
                {/* Header Mockup */}
                <div className="flex items-center justify-between pb-2.5 border-b border-zinc-900">
                   <div className="flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></span>
                      <span className="text-[9px] font-black uppercase tracking-wider text-zinc-400">Mobile Monitor</span>
                   </div>
                   <div className="w-16 h-3.5 bg-black rounded-full border border-zinc-850 flex items-center justify-center">
                      <span className="w-1.5 h-1.5 rounded-full bg-zinc-800"></span>
                   </div>
                   <span className="text-[8px] font-mono text-zinc-550 uppercase tracking-widest">L-STUDIO</span>
                </div>

                {/* Mobile Screen Output (with pulsing #LIVE feed) */}
                <div className="flex-1 bg-black rounded-2xl p-4 flex flex-col justify-center items-center relative overflow-hidden min-h-[180px] border border-zinc-950 shadow-inner group/screen">
                   <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(239,68,68,0.04),transparent_70%)] pointer-events-none" />
                   
                   {/* Real-Time Speed Status Indicator */}
                   <div className="absolute top-2.5 right-2.5 bg-red-600/10 border border-red-500/20 px-2.5 py-1 rounded text-[8px] font-mono text-red-400 font-extrabold flex items-center gap-1 shadow animate-fade-in">
                      <span className="w-1 h-1 rounded-full bg-red-500 animate-ping"></span>
                      <span>PULSE: {livePulseDuration.toFixed(1)}s</span>
                   </div>
                   
                   {/* #LIVE Signal Element */}
                   <div 
                      id="LIVE" 
                      className="relative flex flex-col items-center justify-center text-center p-6 bg-red-600/10 border border-red-500/20 rounded-full w-36 h-36 select-none shadow-[0_0_40px_rgba(239,68,68,0.1)] transition-all animate-pulse"
                      style={{
                        animationDuration: `${livePulseDuration}s`,
                        filter: `opacity(${liveOpacity}) brightness(${liveBrightness}%)`
                      }}
                   >
                      <span className="absolute -top-1.5 px-2 py-0.5 bg-red-600 text-[7px] font-black uppercase text-white tracking-widest rounded leading-none border border-red-500/30 shadow animate-pulse">
                         LIVE FEED
                      </span>
                      <div className="w-7 h-7 rounded-full bg-red-600 flex items-center justify-center text-white font-black text-xs shadow-[0_0_20px_rgba(239,68,68,0.6)]">
                         ●
                      </div>
                      <span className="text-[9px] font-black tracking-widest text-zinc-200 uppercase mt-2.5">
                         SIGNAL OK
                      </span>
                      <span className="text-[7.5px] font-mono text-zinc-550 uppercase mt-1">
                         CH-4 VIDEO FEED
                      </span>
                   </div>

                   <div className="absolute bottom-2 left-3 right-3 flex items-center justify-between pointer-events-none opacity-40 group-hover/screen:opacity-80 transition-opacity">
                      <span className="text-[7px] font-mono text-zinc-550">RES: 9:16 VERT</span>
                      <span className="text-[7px] font-mono text-zinc-550">FPS: 60.00</span>
                   </div>
                </div>

                {/* Synthesizer Controls Panel */}
                <div className="space-y-4 bg-zinc-950/40 p-3.5 border border-zinc-900 rounded-2xl">
                   <div className="flex items-center justify-between">
                      <h4 className="text-[9px] font-black text-zinc-400 uppercase tracking-[0.15em]">Synthesizer Settings</h4>
                      <div className="flex items-center gap-1.5 flex-wrap">
                         <button 
                            onClick={handleCaptureCurrentConfig}
                            className="text-[9px] font-black text-zinc-400 hover:text-white uppercase tracking-wider flex items-center gap-1 transition-all px-2 py-0.5 rounded border border-zinc-900 bg-black/40 hover:bg-zinc-900 hover:border-zinc-850 cursor-pointer animate-fade-in"
                            title="Capture current settings as a custom preset"
                         >
                            <Plus size={10} className="text-red-500" />
                            Capture
                         </button>
                         <button 
                            onClick={handleCopyCSS}
                            className="text-[9px] font-black text-zinc-400 hover:text-white uppercase tracking-wider flex items-center gap-1 transition-all px-2 py-0.5 rounded border border-zinc-900 bg-black/40 hover:bg-zinc-900 hover:border-zinc-850 cursor-pointer"
                            title="Copy inline CSS of the #LIVE signal to clipboard"
                         >
                            <Copy size={10} className="text-red-500" />
                            Copy CSS
                         </button>
                         <button 
                            onClick={handleResetSynthesizer}
                            className="text-[9px] font-black text-zinc-400 hover:text-white uppercase tracking-wider flex items-center gap-1.5 transition-all px-2 py-0.5 rounded border border-zinc-900 bg-black/40 hover:bg-zinc-900 hover:border-zinc-850 cursor-pointer"
                            title="Reset settings to defaults"
                         >
                            <RotateCcw size={10} className="text-red-500" />
                            Reset
                         </button>
                      </div>
                   </div>
                   
                   {/* Control 0: Pulse Presets */}
                   <div className="space-y-1.5 text-left">
                      <div className="flex justify-between items-center text-[9px] font-extrabold uppercase tracking-wide text-zinc-500">
                         <span>Pulse Preset</span>
                         {pulsePreset !== 'custom' && (
                            <span className="font-mono text-red-500 text-[8px] px-1 bg-red-500/10 rounded border border-red-500/20 animate-pulse">
                               PRESET ACTIVE
                            </span>
                         )}
                      </div>
                      <select
                         value={pulsePreset}
                         onChange={(e) => applyPreset(e.target.value)}
                         className="w-full bg-black border border-zinc-850 hover:border-zinc-750 text-zinc-200 text-[10px] rounded px-2.5 py-1.5 focus:outline-none focus:border-red-500 font-black uppercase tracking-wider transition-all cursor-pointer"
                      >
                         <option value="custom">Custom / Manual Controls</option>
                         <option value="steady">Steady</option>
                         <option value="breathing">Breathing</option>
                         <option value="alert">Alert</option>
                         <option value="hyper">Hyper</option>
                         <option value="glow">Glow</option>
                         <option value="highcontrast">High Contrast</option>
                         <option value="minimalist">Minimalist</option>
                      </select>
                   </div>
                   
                   {/* Control 1: Opacity Slider */}
                   <div className="space-y-1.5 text-left">
                      <div className="flex justify-between items-center text-[9px] font-extrabold uppercase tracking-wide text-zinc-500">
                         <span>Opacity Intensity</span>
                         <span className="font-mono text-red-400">{Math.round(liveOpacity * 100)}%</span>
                      </div>
                      <input 
                         type="range" 
                         min="0.1" 
                         max="1.0" 
                         step="0.05" 
                         value={liveOpacity} 
                         onChange={(e) => {
                            const val = parseFloat(e.target.value);
                            setLiveOpacity(val);
                            setTargetOpacity(val);
                            setPulsePreset('custom');
                         }}
                         className="w-full accent-red-600 h-1.5 bg-zinc-900 rounded-lg cursor-pointer" 
                      />
                   </div>

                   {/* Control 2: Brightness Slider */}
                   <div className="space-y-1.5 text-left">
                      <div className="flex justify-between items-center text-[9px] font-extrabold uppercase tracking-wide text-zinc-500">
                         <span>Brightness Boost</span>
                         <span className="font-mono text-red-400">{liveBrightness}%</span>
                      </div>
                      <input 
                         type="range" 
                         min="50" 
                         max="250" 
                         step="5" 
                         value={liveBrightness} 
                         onChange={(e) => {
                            const val = parseInt(e.target.value);
                            setLiveBrightness(val);
                            setTargetBrightness(val);
                            setPulsePreset('custom');
                         }}
                         className="w-full accent-red-600 h-1.5 bg-zinc-900 rounded-lg cursor-pointer" 
                      />
                   </div>

                   {/* Control 3: Pulse duration Slider */}
                   <div className="space-y-1.5 text-left">
                      <div className="flex justify-between items-center text-[9px] font-extrabold uppercase tracking-wide text-zinc-500">
                         <span>Pulse Rhythm (Speed)</span>
                         <span className="font-mono text-red-400">{livePulseDuration.toFixed(1)}s</span>
                      </div>
                      <input 
                         type="range" 
                         min="0.5" 
                         max="5.0" 
                         step="0.1" 
                         value={livePulseDuration} 
                         onChange={(e) => {
                            const val = parseFloat(e.target.value);
                            setLivePulseDuration(val);
                            setTargetPulseDuration(val);
                            setPulsePreset('custom');
                         }}
                         className="w-full accent-red-600 h-1.5 bg-zinc-900 rounded-lg cursor-pointer" 
                      />
                   </div>

                   {/* Recent Presets Section */}
                   <div className="pt-3.5 border-t border-zinc-900 space-y-3 text-left">
                      <div className="flex items-center justify-between">
                         <div className="flex items-center gap-1.5">
                            <span className="text-[9px] font-extrabold uppercase tracking-wide text-zinc-500">Recent Presets</span>
                            <span className="text-[8px] font-black px-1.5 py-0.5 rounded bg-zinc-900 border border-zinc-800 text-zinc-400">
                               {selectedConfigIds.length} Selected
                            </span>
                         </div>
                         <div className="flex items-center gap-2">
                            <button
                               onClick={handleSelectAll}
                               className="text-[8px] font-extrabold text-zinc-400 hover:text-white uppercase tracking-wider transition-colors cursor-pointer"
                            >
                               {paginatedConfigs.every(c => selectedConfigIds.includes(c.id)) && paginatedConfigs.length > 0 ? "Deselect" : "Select All"}
                            </button>
                            
                            {selectedConfigIds.length > 0 && (
                               <button
                                  onClick={handleExportSelected}
                                  className="text-[8px] font-extrabold text-red-400 hover:text-red-350 uppercase tracking-wider transition-colors flex items-center gap-0.5 cursor-pointer"
                                  title="Export Selected Presets as JSON Archive"
                               >
                                  <Download size={8} /> Export
                               </button>
                            )}
                            
                            {selectedConfigIds.length > 0 && (
                               <button
                                  onClick={() => setIsConfirmingDelete(true)}
                                  className="text-[8px] font-extrabold text-red-500 hover:text-red-450 uppercase tracking-wider transition-colors flex items-center gap-0.5 cursor-pointer"
                                  title="Bulk Delete Selected Presets"
                               >
                                  <Trash2 size={8} /> Delete
                               </button>
                            )}
                         </div>
                      </div>

                      {/* Inline Security Prompt for Delete */}
                      {isConfirmingDelete && (
                         <div className="bg-red-950/10 border border-red-900/30 rounded-lg p-2.5 text-left space-y-2">
                            <p className="text-[8px] font-black text-red-400 uppercase tracking-wider">
                               Bulk delete the {selectedConfigIds.length} selected preset(s)?
                            </p>
                            <div className="flex gap-2">
                               <button
                                  onClick={() => {
                                     const toDelete = selectedConfigIds.filter(id => recentConfigs.some(c => c.id === id));
                                     setRecentConfigs(prev => prev.filter(c => !toDelete.includes(c.id)));
                                     setSelectedConfigIds([]);
                                     setIsConfirmingDelete(false);
                                     toast.success(`Bulk deleted ${toDelete.length} preset(s) successfully. 🗑️`);
                                  }}
                                  className="px-2 py-1 bg-red-600 hover:bg-red-500 text-white rounded text-[8px] font-black uppercase transition-colors cursor-pointer"
                               >
                                  Yes, Delete
                               </button>
                               <button
                                  onClick={() => setIsConfirmingDelete(false)}
                                  className="px-2 py-1 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 rounded text-[8px] font-black uppercase transition-colors cursor-pointer"
                                >
                                  Cancel
                               </button>
                            </div>
                         </div>
                      )}

                      {/* Scrollable list of last 5 */}
                      <div className="max-h-[145px] overflow-y-auto space-y-1 pr-0.5 custom-scrollbar">
                         {recentConfigs.length === 0 ? (
                            <p className="text-[8px] text-zinc-650 uppercase font-bold text-center py-4">No recent presets recorded.</p>
                         ) : (
                            paginatedConfigs.map((cfg) => {
                               const isSelected = selectedConfigIds.includes(cfg.id);
                               return (
                                  <div 
                                     key={cfg.id}
                                     className={`flex items-center justify-between p-2 rounded-xl border transition-all text-left ${isSelected ? 'bg-red-950/5 border-red-500/20' : 'bg-black/20 border-zinc-900/60 hover:border-zinc-850'}`}
                                  >
                                     <div className="flex items-center gap-2 flex-1 min-w-0">
                                        {/* Checkbox */}
                                        <input 
                                           type="checkbox"
                                           checked={isSelected}
                                           onChange={() => toggleSelectPreset(cfg.id)}
                                           className="accent-red-600 rounded cursor-pointer w-3 h-3 bg-zinc-900 border-zinc-800 focus:ring-0 focus:ring-offset-0"
                                        />
                                        {/* Preset details container - clickable to restore */}
                                        <div 
                                           onClick={() => handleRestorePreset(cfg)}
                                           className="flex-1 min-w-0 cursor-pointer group/item"
                                        >
                                           <div className="flex items-center justify-between gap-1.5">
                                              <span className="text-[9px] font-black text-zinc-300 truncate group-hover/item:text-white transition-colors uppercase tracking-wider">
                                                 {cfg.name}
                                              </span>
                                              <span className="text-[7px] text-zinc-550 font-mono flex-shrink-0">
                                                 {cfg.timestamp}
                                              </span>
                                           </div>
                                           <div className="flex gap-2 text-[7px] font-mono text-zinc-500 mt-0.5">
                                              <span>OPACITY: {Math.round(cfg.opacity * 100)}%</span>
                                              <span>BRIGHTNESS: {cfg.brightness}%</span>
                                              <span>PULSE: {cfg.pulseDuration.toFixed(1)}s</span>
                                           </div>
                                        </div>
                                     </div>
                                     
                                     {/* Individual Delete Option */}
                                     <button
                                        onClick={() => {
                                           setRecentConfigs(prev => prev.filter(c => c.id !== cfg.id));
                                           setSelectedConfigIds(prev => prev.filter(id => id !== cfg.id));
                                           toast.success(`Deleted preset "${cfg.name}" 🗑️`);
                                        }}
                                        className="p-1 text-zinc-650 hover:text-red-500 rounded-lg transition-colors ml-1.5 cursor-pointer flex-shrink-0"
                                        title="Delete individual preset"
                                     >
                                        <Trash2 size={10} />
                                     </button>
                                  </div>
                               );
                            })
                         )}
                      </div>

                      {/* Pagination Controls */}
                      {totalPages > 1 && (
                         <div className="flex items-center justify-between pt-2.5 border-t border-zinc-900/60 text-[9px]">
                            <span className="text-zinc-500 uppercase font-black tracking-wider font-mono">
                               Page {currentPageIndex + 1} of {totalPages}
                            </span>
                            <div className="flex items-center gap-1.5">
                               <button
                                  onClick={() => setPresetPage(prev => Math.max(0, prev - 1))}
                                  disabled={currentPageIndex === 0}
                                  className="p-1 px-2 rounded bg-zinc-900 hover:bg-zinc-850 border border-zinc-800 disabled:opacity-20 disabled:cursor-not-allowed hover:text-white transition-all flex items-center gap-1 cursor-pointer text-zinc-400"
                                  title="Previous Page"
                               >
                                  <ChevronLeft size={10} className="text-red-500" />
                                  <span>Prev</span>
                               </button>
                               <button
                                  onClick={() => setPresetPage(prev => Math.min(totalPages - 1, prev + 1))}
                                  disabled={currentPageIndex === totalPages - 1}
                                  className="p-1 px-2 rounded bg-zinc-900 hover:bg-zinc-850 border border-zinc-800 disabled:opacity-20 disabled:cursor-not-allowed hover:text-white transition-all flex items-center gap-1 cursor-pointer text-zinc-400"
                                  title="Next Page"
                               >
                                  <span>Next</span>
                                  <ChevronRight size={10} className="text-red-500" />
                               </button>
                            </div>
                         </div>
                      )}
                   </div>
                </div>
             </div>

          </div>

          {/* Bottom: Timeline Orchestrator */}
          <div className="h-[300px] bg-zinc-900 border border-zinc-800 rounded-[2.5rem] flex flex-col overflow-hidden shadow-2xl">
             <div className="px-8 py-4 border-b border-zinc-800 flex items-center justify-between bg-zinc-950/40">
                <div className="flex items-center gap-6">
                   <h3 className="text-[10px] font-black text-zinc-500 uppercase tracking-widest flex items-center gap-2"><Film size={14}/> Linear Sequence</h3>
                   <div className="w-px h-4 bg-zinc-800" />
                   <div className="flex items-center gap-4">
                      <button onClick={splitClipAtPlayhead} className="flex items-center gap-2 text-[9px] font-black uppercase text-zinc-500 hover:text-white transition-colors bg-zinc-900 px-3 py-1.5 rounded-lg border border-zinc-800 active-press">
                         <Scissors size={12} /> Split at Playhead
                      </button>
                   </div>
                </div>
                <div className="flex items-center gap-4">
                   <div className="flex items-center gap-2 bg-zinc-900 px-3 py-1.5 rounded-xl border border-zinc-800">
                      <Clock size={12} className="text-zinc-600" />
                      <span className="text-xs font-mono text-red-500 font-black">{currentTime.toFixed(2)}s</span>
                   </div>
                </div>
             </div>

             <div className="flex-1 relative overflow-hidden flex flex-col">
                <div ref={timelineRef} className="flex-1 overflow-x-auto overflow-y-hidden custom-scrollbar bg-zinc-950/20 relative" onClick={(e) => {
                  const rect = timelineRef.current?.getBoundingClientRect();
                  if (rect) setCurrentTime(Math.max(0, (e.clientX - rect.left + timelineRef.current!.scrollLeft) / zoomLevel));
                }}>
                   
                   {/* Playhead */}
                   <div className="absolute top-0 bottom-0 w-[2px] bg-red-600 z-30 pointer-events-none" style={{ left: `${currentTime * zoomLevel}px` }}>
                      <div className="w-4 h-4 bg-red-600 rounded-full -ml-[7px] -mt-2 shadow-[0_0_15px_rgba(239,68,68,0.8)]"></div>
                   </div>

                   {/* Ruler */}
                   <div className="absolute top-0 left-0 right-0 h-6 border-b border-zinc-800/50 pointer-events-none z-10 flex" style={{ width: `${Math.max(1000, totalDuration * zoomLevel + 400)}px` }}>
                      {Array.from({ length: Math.ceil(totalDuration) + 10 }).map((_, i) => (
                        <div key={i} className="border-l border-zinc-800 h-full flex items-end pb-1" style={{ width: `${zoomLevel}px` }}>
                           <span className="text-[7px] font-black text-zinc-700 ml-1">{i}s</span>
                        </div>
                      ))}
                   </div>

                   <div className="pt-10 pb-8 pl-0 min-h-full" style={{ width: `${Math.max(1000, totalDuration * zoomLevel + 400)}px` }}>
                      <div className="space-y-4">
                         {/* Video Track */}
                         <div className="h-28 bg-zinc-900/30 border border-zinc-800/40 rounded-[2rem] relative flex items-center">
                            {timeline.map((clip) => (
                              <div 
                                 key={clip.id}
                                 onClick={(e) => { e.stopPropagation(); setSelectedClipId(clip.id); }}
                                 className={`absolute h-20 rounded-2xl border transition-all flex flex-col justify-center px-4 cursor-pointer overflow-hidden ${selectedClipId === clip.id ? 'bg-red-600/10 border-red-500 ring-2 ring-red-500/20' : 'bg-zinc-800/80 border-zinc-700 hover:border-zinc-500 shadow-xl'}`}
                                 style={{ left: `${clip.timelineOffset * zoomLevel}px`, width: `${(clip.trimEnd - clip.trimStart) * zoomLevel}px` }}
                              >
                                 <div className="flex items-center gap-2">
                                    <div className="w-1.5 h-1.5 rounded-full bg-red-500"></div>
                                    <span className="text-[10px] font-black text-white uppercase truncate">{clip.name}</span>
                                 </div>
                                 <div className="flex items-center gap-3 mt-1.5 opacity-60">
                                    <div className="flex items-center gap-1">
                                       <Clock size={10} className="text-zinc-400" />
                                       <span className="text-[8px] font-bold text-zinc-400">{(clip.trimEnd - clip.trimStart).toFixed(1)}s</span>
                                    </div>
                                    {clip.volume < 1 && (
                                       <div className="flex items-center gap-1">
                                          <Volume1 size={10} className="text-purple-400" />
                                          <span className="text-[8px] font-bold text-purple-400">{Math.round(clip.volume * 100)}%</span>
                                       </div>
                                    )}
                                 </div>
                                 {/* Trim Indicators */}
                                 {clip.trimStart > 0 && <div className="absolute left-0 top-0 bottom-0 w-1 bg-red-500/40"></div>}
                                 {clip.trimEnd < clip.duration && <div className="absolute right-0 top-0 bottom-0 w-1 bg-red-500/40"></div>}
                              </div>
                            ))}
                         </div>

                         {/* Track Labels */}
                         <div className="h-6 flex items-center gap-4 px-4 opacity-20">
                            <Layers size={14} className="text-zinc-600" />
                            <span className="text-[9px] font-black text-zinc-700 uppercase tracking-[0.2em]">{timeline.length} Fragments Orchestrated</span>
                         </div>
                      </div>
                   </div>
                </div>
             </div>

             <div className="px-8 py-3 bg-zinc-950 border-t border-zinc-800 flex items-center justify-between shrink-0">
                <div className="flex items-center gap-8">
                   <div className="flex items-center gap-3">
                      <span className="text-[9px] font-black text-zinc-700 uppercase tracking-widest">Temporal Zoom</span>
                      <input type="range" min="10" max="100" value={zoomLevel} onChange={e => setZoomLevel(parseInt(e.target.value))} className="w-32 accent-zinc-700 h-1" />
                   </div>
                   <div className="w-px h-4 bg-zinc-800" />
                   <div className="flex items-center gap-3">
                      <div className={`w-2 h-2 rounded-full ${isPlaying ? 'bg-green-500 animate-pulse' : 'bg-zinc-800'}`}></div>
                      <span className="text-[9px] font-black text-zinc-600 uppercase tracking-widest">{isPlaying ? 'Output Streaming' : 'Engine Idle'}</span>
                   </div>
                </div>
                <div className="flex gap-3">
                   <button className="bg-zinc-900 hover:bg-zinc-800 text-zinc-500 hover:text-white px-6 py-2 rounded-xl font-black uppercase text-[9px] tracking-widest border border-zinc-800 transition-all">
                      Save Manifest
                    </button>
                    {activeProject && (
                      <span className="text-[8px] font-mono tracking-wider uppercase text-zinc-500 bg-zinc-950 border border-zinc-900 rounded px-1.5 py-1 flex items-center gap-1.5 select-none self-center font-sans">
                        {saveStatus === 'saving' && <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />}
                        {saveStatus === 'saved' && <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />}
                        {saveStatus === 'saving' && 'Saving...'}
                        {saveStatus === 'saved' && 'Saved'}
                        {saveStatus === 'idle' && 'Synced'}
                      </span>
                    )}
                    <button 
                      onClick={async () => {
                        if (!activeProject) {
                          toast.error('Select an Active Project to save these timeline assets.', { id: 'video-save-err' });
                          return;
                        }
                        try {
                          await updateActiveProject({
                            assets: {
                              ...activeProject.assets,
                              videoDraft: {
                                prompt,
                                aspectRatio,
                                resolution,
                                zoomLevel,
                                masterVolume,
                                library,
                                timeline
                              }
                            }
                          });
                          toast.success('Studio assets written back to Project database!', { id: 'video-save-ok' });
                        } catch (err) {
                          toast.error('Could not save.');
                        }
                      }}
                      className="hidden">
                   </button>
                   {timeline.length > 0 && (
                      <button className="bg-white hover:bg-zinc-100 text-black px-8 py-2 rounded-xl font-black uppercase text-[10px] tracking-[0.2em] flex items-center gap-3 transition-all shadow-2xl active-press">
                         <Download size={14} /> Render Master
                      </button>
                   )}
                </div>
             </div>
          </div>
        </div>
      </div>

      {/* Save Template Modal */}
      {showSaveTemplateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-md p-4 animate-fade-in">
           <form onSubmit={handleSaveTemplate} className="bg-zinc-900 border border-zinc-800 rounded-[2rem] p-10 w-full max-w-sm shadow-2xl relative animate-scale-in">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-black text-white tracking-tight">Save Video Settings Template</h3>
                <button type="button" onClick={() => setShowSaveTemplateModal(false)} className="text-zinc-500 hover:text-white p-1 hover:bg-zinc-800 rounded-lg"><Plus size={16} className="rotate-45" /></button>
              </div>
              <div className="space-y-6">
                 <div>
                    <label className="text-[10px] font-black text-zinc-500 uppercase block mb-2 tracking-[0.2em]">Template Name</label>
                    <input 
                      value={newTemplateName}
                      onChange={e => setNewTemplateName(e.target.value)}
                      placeholder="e.g. Cinema Wide HD"
                      className="w-full bg-zinc-950 border border-zinc-800 rounded-2xl p-4 text-white text-xs focus:border-red-500 outline-none transition-all placeholder:text-zinc-700 font-mono"
                      autoFocus
                      required
                    />
                 </div>
                 <div className="text-[10px] text-zinc-500 bg-zinc-950/50 p-4 rounded-2xl border border-zinc-850/80">
                    <p className="font-extrabold uppercase tracking-wider mb-2 text-zinc-400">Captured Directives:</p>
                    <ul className="list-disc list-inside space-y-1 mt-1 font-mono text-[9px]">
                       <li>Aspect Ratio: <span className="text-zinc-300">{aspectRatio}</span></li>
                       <li>Resolution: <span className="text-zinc-300">{resolution}</span></li>
                       <li className="truncate">Prompt: <span className="text-zinc-400 italic">"{prompt}"</span></li>
                    </ul>
                 </div>
                 <div className="flex gap-4 mt-8">
                    <button type="button" onClick={() => setShowSaveTemplateModal(false)} className="flex-1 py-3 text-xs text-zinc-400 hover:text-white font-black uppercase tracking-wider">Abort</button>
                    <button type="submit" className="flex-1 bg-red-650 hover:bg-red-600 bg-red-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest transition-all">Save</button>
                 </div>
              </div>
           </form>
        </div>
      )}
    </div>
  );
};
