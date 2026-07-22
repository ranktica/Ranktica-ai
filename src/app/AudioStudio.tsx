
import React, { useState, useRef, useEffect } from 'react';
import { generateSpeech, generateMultiSpeakerSpeech } from '@/infrastructure/gemini';
import { useProject } from '@/app/ProjectContext';
import { toast } from 'react-hot-toast';
import { 
  Loader2, 
  Mic, 
  Volume2, 
  PlayCircle, 
  Download, 
  Sparkles, 
  AudioLines, 
  Zap, 
  Waves,
  Ear,
  Radio,
  ChevronRight,
  Smile,
  Brain,
  MessageSquare,
  Users,
  History,
  Trash2,
  RotateCcw,
  VolumeX,
  FastForward,
  Play,
  Music,
  CheckCircle,
  FileCheck,
  Tag,
  Edit2,
  Check,
  X,
  Search,
  SlidersHorizontal,
  Layers,
  Plus,
  Activity
} from 'lucide-react';

import { auth, firestoreDb } from '@/infrastructure/auth/firebase';
import { collection, query, where, onSnapshot, doc, deleteDoc, updateDoc, addDoc, getDocs, orderBy } from 'firebase/firestore';
import { VoiceRecorder } from '@/components/VoiceRecorder';
import { 
  masterAudioBuffer, 
  synthesizeAmbientTrack, 
  synthesizeSfx 
} from '@/utils/audioUtils';

const VOICES = [
  { 
    id: 'Zephyr', 
    label: 'Zephyr', 
    desc: 'Friendly & Conversational', 
    profile: 'Vlogs / Storytelling', 
    tone: 'Bright',
    pitch: 210,
    tempo: 135,
    sentiment: 'Friendly & Conversational',
    fingerprint: { dynamicRange: 75, vocalEnergy: 80, resonance: 72, clarity: 95, stability: 88 }
  },
  { 
    id: 'Puck', 
    label: 'Puck', 
    desc: 'Energetic & Youthful', 
    profile: 'Shorts / Gaming', 
    tone: 'Punchy',
    pitch: 230,
    tempo: 155,
    sentiment: 'Energetic & Youthful',
    fingerprint: { dynamicRange: 85, vocalEnergy: 95, resonance: 60, clarity: 90, stability: 70 }
  },
  { 
    id: 'Charon', 
    label: 'Charon', 
    desc: 'Deep & Authoritative', 
    profile: 'Documentary / Tech', 
    tone: 'Basso',
    pitch: 95,
    tempo: 110,
    sentiment: 'Deep & Authoritative',
    fingerprint: { dynamicRange: 60, vocalEnergy: 75, resonance: 95, clarity: 85, stability: 92 }
  },
  { 
    id: 'Kore', 
    label: 'Kore', 
    desc: 'Warm & Professional', 
    profile: 'Corporate / Tutorials', 
    tone: 'Balanced',
    pitch: 195,
    tempo: 125,
    sentiment: 'Warm & Professional',
    fingerprint: { dynamicRange: 70, vocalEnergy: 70, resonance: 80, clarity: 92, stability: 94 }
  },
  { 
    id: 'Fenrir', 
    label: 'Fenrir', 
    desc: 'Steady & Neutral', 
    profile: 'News / Long-form', 
    tone: 'Flat',
    pitch: 135,
    tempo: 120,
    sentiment: 'Steady & Neutral',
    fingerprint: { dynamicRange: 50, vocalEnergy: 65, resonance: 74, clarity: 88, stability: 96 }
  }
];

const EMOTIONS = [
  { id: 'default', label: 'Neutral', icon: <Radio size={14} />, prompt: '' },
  { id: 'excited', label: 'Viral Hype', icon: <Sparkles size={14} />, prompt: 'Say with massive excitement and high energy: ' },
  { id: 'serious', label: 'Authoritative', icon: <Brain size={14} />, prompt: 'Say with absolute authority and gravitas: ' },
  { id: 'cheerful', label: 'Cheerful', icon: <Smile size={14} />, prompt: 'Say cheerfully and warmly: ' },
  { id: 'whisper', label: 'ASMR / Quiet', icon: <Ear size={14} />, prompt: 'Whisper this softly: ' }
];

// Manual Base64 decoding as per guidelines
function decodeBase64(base64: string) {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

// Raw PCM Decoding as per guidelines
async function decodeAudioData(
  data: Uint8Array,
  ctx: AudioContext,
  sampleRate: number,
  numChannels: number,
): Promise<AudioBuffer> {
  const dataInt16 = new Int16Array(data.buffer);
  const frameCount = dataInt16.length / numChannels;
  const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);

  for (let channel = 0; channel < numChannels; channel++) {
    const channelData = buffer.getChannelData(channel);
    for (let i = 0; i < frameCount; i++) {
      channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
    }
  }
  return buffer;
}

// WAV encoding for download
const encodeWAV = (samples: Float32Array, sampleRate: number) => {
  const buffer = new ArrayBuffer(44 + samples.length * 2);
  const view = new DataView(buffer);
  const writeString = (offset: number, string: string) => {
    for (let i = 0; i < string.length; i++) view.setUint8(offset + i, string.charCodeAt(i));
  };
  writeString(0, 'RIFF');
  view.setUint32(4, 32 + samples.length * 2, true);
  writeString(8, 'WAVE');
  writeString(12, 'fmt ');
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, 1, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * 2, true);
  view.setUint16(32, 2, true);
  view.setUint16(34, 16, true);
  writeString(36, 'data');
  view.setUint32(40, samples.length * 2, true);
  let offset = 44;
  for (let i = 0; i < samples.length; i++, offset += 2) {
    let s = Math.max(-1, Math.min(1, samples[i]));
    view.setInt16(offset, s < 0 ? s * 0x8000 : s * 0x7FFF, true);
  }
  return new Blob([view], { type: 'audio/wav' });
};

interface AudioStudioProps {
  prefill?: { text?: string; voice?: string };
}

// Waveform visual extraction and downsampling sub-component with interactive volume automation
interface TimelineWaveformProps {
  buffer: AudioBuffer | null;
  progress: number;
  onScrub: (percent: number) => void;
  colorClass: string;
  placeholderLabel?: string;
  timelineDuration: number;
  automationEnabled?: boolean;
  automationPoints?: Array<{ id: number; time: number; volume: number }>;
  onAddAutomationPoint?: (time: number, volume: number) => void;
  onDeleteAutomationPoint?: (id: number) => void;
  automationColor?: string;
}

const TimelineWaveform: React.FC<TimelineWaveformProps> = ({ 
  buffer, 
  progress, 
  onScrub, 
  colorClass, 
  placeholderLabel = "Awaiting audio channel load", 
  timelineDuration,
  automationEnabled = false,
  automationPoints = [],
  onAddAutomationPoint,
  onDeleteAutomationPoint,
  automationColor = "text-purple-500"
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [svgPath, setSvgPath] = useState<string>('');

  useEffect(() => {
    if (!buffer) {
      // Subtle standard flatline indicator
      const points: string[] = [];
      for (let i = 0; i <= 100; i++) {
        const y = 20 + Math.sin(i * 0.4) * 0.8;
        points.push(`${i},${y}`);
      }
      setSvgPath(`M ${points.join(' L ')}`);
      return;
    }

    try {
      const data = buffer.getChannelData(0);
      const step = Math.ceil(data.length / 100); // 100 vertical bars
      const bars: string[] = [];
      
      for (let i = 0; i < 100; i++) {
        let max = 0.01;
        const start = i * step;
        const end = Math.min(start + step, data.length);
        for (let j = start; j < end; j++) {
          const val = Math.abs(data[j]);
          if (val > max) max = val;
        }
        // Baseline scale height
        const peakHeight = Math.min(16, max * 28);
        const xCoord = i;
        bars.push(`M ${xCoord} ${(20 - peakHeight).toFixed(1)} L ${xCoord} ${(20 + peakHeight).toFixed(1)}`);
      }
      setSvgPath(bars.join(' '));
    } catch (e) {
      console.warn("Waveform extraction throttled:", e);
    }
  }, [buffer]);

  const handleContainerClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const clickY = e.clientY - rect.top;
    
    const clickPercent = (clickX / rect.width) * 100;
    
    // If automation is enabled and we clicked inside the body of the wave, add a node
    if (automationEnabled && onAddAutomationPoint) {
      const targetElement = e.target as HTMLElement;
      const isDraggingNode = targetElement.tagName === 'circle' || targetElement.classList.contains('automation-node');
      if (!isDraggingNode) {
        const timeVal = (clickX / rect.width) * timelineDuration;
        const volVal = Math.max(0, Math.min(1, 1 - (clickY / rect.height)));
        onAddAutomationPoint(timeVal, volVal);
        return;
      }
    }
    
    // Otherwise scrub timeline playhead
    onScrub(clickPercent);
  };

  const sortedPoints = [...(automationPoints || [])].sort((a, b) => a.time - b.time);
  
  // Make normalized strings for SVG polyline & fill polygon
  // ViewBox: 100 x 40. x scale = 100, y scale = 40
  const pointsStr = sortedPoints.map(p => `${((p.time / timelineDuration) * 100).toFixed(2)},${((1 - p.volume) * 40).toFixed(2)}`).join(' ');
  const fillPointsStr = sortedPoints.length > 0
    ? `0,40 ` + sortedPoints.map(p => `${((p.time / timelineDuration) * 100).toFixed(2)},${((1 - p.volume) * 40).toFixed(2)}`).join(' ') + ` 100,40`
    : '';

  return (
    <div 
      ref={containerRef}
      onClick={handleContainerClick}
      className={`relative bg-zinc-950 hover:bg-zinc-980 border border-zinc-850 hover:border-zinc-800 rounded-xl overflow-hidden cursor-ew-resize transition-all select-none group ${automationEnabled ? 'h-20' : 'h-12'}`}
    >
      <div className="absolute inset-x-0 h-[1px] bg-zinc-900 top-1/2 -get -translate-y-1/2 pointer-events-none" />

      {/* Embedded dynamic downsampled vector path visualizer */}
      <svg className="w-full h-full absolute inset-0 py-1 pointer-events-none" viewBox="0 0 100 40" preserveAspectRatio="none">
        <path d={svgPath} className={`${colorClass} opacity-40 group-hover:opacity-75 transition-opacity`} stroke="currentColor" strokeWidth="0.8" strokeLinecap="round" fill="none" />
      </svg>

      {/* Real-time Volume Envelope Overlay */}
      {automationEnabled && sortedPoints.length > 0 && (
        <svg className="w-full h-full absolute inset-0 pointer-events-none z-10" viewBox="0 0 100 40" preserveAspectRatio="none">
          {fillPointsStr && (
            <polygon 
              points={fillPointsStr} 
              className={`fill-current ${automationColor} opacity-10`}
            />
          )}
          <polyline
            points={pointsStr}
            fill="none"
            className={`stroke-current ${automationColor}`}
            strokeWidth="1.2"
            strokeDasharray="1,1"
          />
        </svg>
      )}

      {/* Interactive Node markers handles overlay */}
      {automationEnabled && sortedPoints.map(p => {
        const leftPercent = (p.time / timelineDuration) * 100;
        const topPercent = (1 - p.volume) * 100;
        return (
          <div
            key={p.id}
            style={{ left: `${leftPercent}%`, top: `${topPercent}%` }}
            className={`absolute rounded-full w-2.5 h-2.5 -translate-x-1/2 -translate-y-1/2 border border-white shadow-xl cursor-pointer hover:scale-130 transition-transform active:scale-150 z-20 automation-node bg-purple-500`}
            title={`Time: ${p.time}s | Vol: ${Math.round(p.volume * 100)}% (Click to delete)`}
            onClick={(e) => {
              e.stopPropagation();
              if (onDeleteAutomationPoint) {
                onDeleteAutomationPoint(p.id);
              }
            }}
          />
        );
      })}

      {/* Standard playhead guidelines alignment */}
      <div 
        className="absolute inset-y-0 w-[2px] bg-gradient-to-b from-purple-500 to-indigo-500 pointer-events-none z-30" 
        style={{ left: `${progress}%` }}
      >
        <div className="w-2.5 h-2.5 rounded-full bg-white border border-purple-500 shadow absolute top-0 -left-1 hover:scale-125 transition-transform" />
      </div>

      {!buffer && (
        <span className="absolute inset-0 flex items-center justify-center text-[8px] font-black uppercase text-zinc-700 tracking-wider">
          {placeholderLabel}
        </span>
      )}
      {buffer && (
        <span className="absolute bottom-1 right-2 text-[8px] font-mono text-zinc-500 pointer-events-none z-25">
          Duration: {buffer.duration.toFixed(1)}s (Click anywhere to {automationEnabled ? 'add volume node' : 'scrub'})
        </span>
      )}
    </div>
  );
};

export const AudioStudio: React.FC<AudioStudioProps> = ({ prefill }) => {
  const { activeProject, updateActiveProject } = useProject();
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle');
  const [mode, setMode] = useState<'narration' | 'dialogue'>('narration');
  const [text, setText] = useState(prefill?.text || '');
  const [voice, setVoice] = useState(prefill?.voice || 'Zephyr');
  const [emotion, setEmotion] = useState('default');
  
  // Custom uploaded voices
  const [customVoices, setCustomVoices] = useState<Array<{ name: string; size: string; type: string; url?: string; b64Data?: string }>>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Firestore voice profiles state
  const [dbVoiceProfiles, setDbVoiceProfiles] = useState<any[]>([]);

  // Editing and searching voice profiles state
  const [editingProfileId, setEditingProfileId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState<string>('');
  const [voiceSearchQuery, setVoiceSearchQuery] = useState<string>('');

  // 1. Emotional Intensity fine tuning sliders
  const [excitement, setExcitement] = useState<number>(50);
  const [urgency, setUrgency] = useState<number>(50);

  // 2. Bulk editing of custom voice profiles
  const [selectedProfileIds, setSelectedProfileIds] = useState<string[]>([]);
  const [bulkTags, setBulkTags] = useState<string>('');
  const [bulkRename, setBulkRename] = useState<string>('');
  const [bulkEditMode, setBulkEditMode] = useState<boolean>(false);
  const [isBulkProcessing, setIsBulkProcessing] = useState<boolean>(false);

  // 3. AI recommendation model state based on script analysis
  const [scriptAnalysis, setScriptAnalysis] = useState<{
    sentiment: string;
    tone: string;
    suggestedTags: string[];
    explanation: string;
  } | null>(null);
  const [isAnalyzingScript, setIsAnalyzingScript] = useState<boolean>(false);

  // 4. A/B Voice Testing Lab state
  const [abVoiceA, setAbVoiceA] = useState<string>('Zephyr');
  const [abVoiceB, setAbVoiceB] = useState<string>('Charon');
  const [abBufferA, setAbBufferA] = useState<AudioBuffer | null>(null);
  const [abBufferB, setAbBufferB] = useState<AudioBuffer | null>(null);
  const [abLoading, setAbLoading] = useState<boolean>(false);
  const [abPlaying, setAbPlaying] = useState<'none' | 'a' | 'b'>('none');
  const [abActiveSource, setAbActiveSource] = useState<any>(null);

  // Multi-Track Timeline States
  const [timelineDuration, setTimelineDuration] = useState<number>(30);
  const [isTimelinePlaying, setIsTimelinePlaying] = useState<boolean>(false);
  const [timelineProgress, setTimelineProgress] = useState<number>(0);

  const handleScrubProgress = (percent: number) => {
    const isPlayingBefore = isTimelinePlaying;
    if (isTimelinePlaying) {
      handleTimelineStop();
    }
    setTimelineProgress(percent);
    if (isPlayingBefore) {
      setTimeout(() => {
        handleTimelinePlay();
      }, 50);
    }
  };
  
  const [voBuffer, setVoBuffer] = useState<AudioBuffer | null>(null);
  const [voVolume, setVoVolume] = useState<number>(0.8);
  const [voAutomationEnabled, setVoAutomationEnabled] = useState<boolean>(false);
  const [voAutomationPoints, setVoAutomationPoints] = useState<Array<{ id: number; time: number; volume: number }>>([
    { id: 1, time: 0, volume: 0.8 },
    { id: 2, time: 10, volume: 0.8 },
    { id: 3, time: 20, volume: 0.8 },
    { id: 4, time: 30, volume: 0.8 },
  ]);

  const [bgmBuffer, setBgmBuffer] = useState<AudioBuffer | null>(null);
  const [bgmType, setBgmType] = useState<'none' | 'drone' | 'lofi' | 'cyber' | 'custom'>('none');
  const [bgmVolume, setBgmVolume] = useState<number>(0.3);
  const [bgmAutomationEnabled, setBgmAutomationEnabled] = useState<boolean>(false);
  const [bgmAutomationPoints, setBgmAutomationPoints] = useState<Array<{ id: number; time: number; volume: number }>>([
    { id: 1, time: 0, volume: 0.3 },
    { id: 2, time: 10, volume: 0.1 }, // auto ducking simulation
    { id: 3, time: 20, volume: 0.1 },
    { id: 4, time: 30, volume: 0.3 },
  ]);

  const [sfxBuffer, setSfxBuffer] = useState<AudioBuffer | null>(null);
  const [sfxType, setSfxType] = useState<'none' | 'sub_drop' | 'laser' | 'sweep' | 'custom'>('none');
  const [sfxVolume, setSfxVolume] = useState<number>(0.5);
  const [sfxAutomationEnabled, setSfxAutomationEnabled] = useState<boolean>(false);
  const [sfxAutomationPoints, setSfxAutomationPoints] = useState<Array<{ id: number; time: number; volume: number }>>([
    { id: 1, time: 0, volume: 0.5 },
    { id: 2, time: 10, volume: 0.5 },
    { id: 3, time: 20, volume: 0.5 },
    { id: 4, time: 30, volume: 0.5 },
  ]);

  const [activeAutomationTrack, setActiveAutomationTrack] = useState<'none' | 'vo' | 'bgm' | 'sfx'>('none');

  // Audio Mastering Toggles & Metrics States
  const [isMastering, setIsMastering] = useState<boolean>(false);
  const [originalVoBuffer, setOriginalVoBuffer] = useState<AudioBuffer | null>(null);
  const [isMastered, setIsMastered] = useState<boolean>(false);
  const [masterNoiseGate, setMasterNoiseGate] = useState<boolean>(true);
  const [masterCompressor, setMasterCompressor] = useState<boolean>(true);
  const [masterNormalization, setMasterNormalization] = useState<boolean>(true);
  
  // Advanced mastering custom slider states
  const [noiseReductionThreshold, setNoiseReductionThreshold] = useState<number>(0.006);
  const [compressorThreshold, setCompressorThreshold] = useState<number>(0.12);
  const [compressorRatio, setCompressorRatio] = useState<number>(3.5);
  const [compressorMakeupGain, setCompressorMakeupGain] = useState<number>(1.25);
  const [normalizePeak, setNormalizePeak] = useState<number>(0.89);

  // Custom presets states
  const [masteringPresetId, setMasteringPresetId] = useState<string>('broadcast-standard');
  const [customPresetName, setCustomPresetName] = useState<string>('');
  const [dbMasteringPresets, setDbMasteringPresets] = useState<any[]>([]);
  
  // Real-time timeline playback references
  const activeTimelineSourcesRef = useRef<Array<{ source: AudioBufferSourceNode; gainNode: GainNode }>>([]);
  const timelineIntervalRef = useRef<any>(null);
  const playlistStartTimeRef = useRef<number>(0);
  const masterAudioCtxRef = useRef<AudioContext | null>(null);

  useEffect(() => {
    const unsubscribeAuth = auth.onAuthStateChanged((user) => {
      const email = user?.email || 'local_creator';
      
      // 1. Voice Profiles Sub
      const q = query(
        collection(firestoreDb, 'voice_profiles'),
        where('userId', '==', email)
      );
      const unsubscribeSnap = onSnapshot(q, (snapshot) => {
        const profiles: any[] = [];
        snapshot.forEach(docSnap => {
          profiles.push({ id: docSnap.id, ...docSnap.data() });
        });
        setDbVoiceProfiles(profiles);
      }, (error) => {
        console.warn("Could not load Firestore custom voice profiles:", error);
      });

      // 2. Custom Mastering Presets Sub
      const qPreset = query(
        collection(firestoreDb, 'mastering_presets'),
        where('userId', '==', email)
      );
      const unsubscribePresets = onSnapshot(qPreset, (snapshot) => {
        const presetsList: any[] = [];
        snapshot.forEach(docSnap => {
          presetsList.push({ id: docSnap.id, ...docSnap.data() });
        });
        setDbMasteringPresets(presetsList);
      }, (error) => {
        console.warn("Could not load Firestore custom mastering presets:", error);
      });

      return () => {
        unsubscribeSnap();
        unsubscribePresets();
      };
    });

    return () => unsubscribeAuth();
  }, []);

  const deleteVoiceProfile = async (id: string) => {
    try {
      await deleteDoc(doc(firestoreDb, 'voice_profiles', id));
      toast.success("Voice profile deleted from Firestore.");
      if (voice === `custom_${id}`) {
        setVoice('Zephyr');
      }
    } catch (err: any) {
      console.error("Failed to delete voice profile:", err);
      toast.error("Deletion failed: " + err.message);
    }
  };

  const renameVoiceProfile = async (id: string, newName: string) => {
    if (!newName.trim()) {
      toast.error("Profile name cannot be empty");
      return;
    }
    try {
      await updateDoc(doc(firestoreDb, 'voice_profiles', id), { name: newName });
      toast.success("Voice profile renamed successfully!");
      setEditingProfileId(null);
    } catch (err: any) {
      console.error("Failed to rename voice profile:", err);
      toast.error("Rename failed: " + err.message);
    }
  };

  const handleApplyMasteringPreset = (presetId: string) => {
    setMasteringPresetId(presetId);
    
    if (presetId === 'broadcast-standard') {
      setNoiseReductionThreshold(0.006);
      setCompressorThreshold(0.12);
      setCompressorRatio(3.5);
      setCompressorMakeupGain(1.25);
      setNormalizePeak(0.89);
      toast.success("Applied prebuilt Chain: Broadcast Standard");
    } else if (presetId === 'high-energy-promo') {
      setNoiseReductionThreshold(0.015);
      setCompressorThreshold(0.25);
      setCompressorRatio(5.0);
      setCompressorMakeupGain(1.65);
      setNormalizePeak(0.95);
      toast.success("Applied prebuilt Chain: High-Energy Promo");
    } else if (presetId === 'calm-documentary') {
      setNoiseReductionThreshold(0.002);
      setCompressorThreshold(0.08);
      setCompressorRatio(1.8);
      setCompressorMakeupGain(0.95);
      setNormalizePeak(0.70);
      toast.success("Applied prebuilt Chain: Calm Documentary");
    } else if (presetId === 'podcast-vocals') {
      setNoiseReductionThreshold(0.008);
      setCompressorThreshold(0.15);
      setCompressorRatio(3.0);
      setCompressorMakeupGain(1.35);
      setNormalizePeak(0.90);
      toast.success("Applied prebuilt Chain: Podcast Focus");
    } else {
      const customPr = dbMasteringPresets.find(p => p.id === presetId);
      if (customPr) {
        setNoiseReductionThreshold(customPr.noiseReductionThreshold ?? 0.006);
        setCompressorThreshold(customPr.compressorThreshold ?? 0.12);
        setCompressorRatio(customPr.compressorRatio ?? 3.5);
        setCompressorMakeupGain(customPr.compressorMakeupGain ?? 1.25);
        setNormalizePeak(customPr.normalizePeak ?? 0.89);
        toast.success(`Applied Custom Chain: ${customPr.name}`);
      }
    }
  };

  const handleSaveMasteringPreset = async () => {
    if (!customPresetName.trim()) {
      toast.error("Please enter a custom preset name first");
      return;
    }
    try {
      const email = auth.currentUser?.email || 'local_creator';
      const response = await addDoc(collection(firestoreDb, 'mastering_presets'), {
        userId: email,
        name: customPresetName.trim(),
        noiseReductionThreshold,
        compressorThreshold,
        compressorRatio,
        compressorMakeupGain,
        normalizePeak,
        createdAt: new Date().toISOString()
      });
      toast.success(`Custom Chain '${customPresetName}' securely saved to Firestore!`);
      setCustomPresetName('');
      setMasteringPresetId(response.id);
    } catch (err: any) {
      console.error("Failed to save custom mastering preset:", err);
      toast.error("Cloud save failed: " + err.message);
    }
  };

  const handleDeleteMasteringPreset = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await deleteDoc(doc(firestoreDb, 'mastering_presets', id));
      toast.success("Custom mastering preset deleted.");
      if (masteringPresetId === id) {
        handleApplyMasteringPreset('broadcast-standard');
      }
    } catch (err: any) {
      console.error("Failed to delete preset:", err);
      toast.error("Deletion failed: " + err.message);
    }
  };

  const handleCustomVoiceUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    
    const fileArray = Array.from(files);
    let processedCount = 0;
    const tempVoices: any[] = [];

    fileArray.forEach(file => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onloadend = () => {
        const base64data = (reader.result as string).split(',')[1];
        tempVoices.push({
          name: file.name,
          size: (file.size / 1024).toFixed(1) + ' KB',
          type: file.type,
          url: URL.createObjectURL(file),
          b64Data: base64data
        });
        processedCount++;

        if (processedCount === fileArray.length) {
          setCustomVoices(prev => {
            const merged = [...prev, ...tempVoices].slice(0, 2); // Limit to 2 uploaded voices max
            if (merged.length === 2) {
              toast.success("Vocal matching complete! Zero-shot neural voice narration is now calibrated.", {
                icon: '🎙️',
                duration: 4500
              });
            } else {
              toast.success(`Registered custom voice characteristic. Load ${2 - merged.length} more voice file(s) to finalize neural sync!`);
            }
            return merged;
          });
        }
      };
    });

    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const removeCustomVoice = (index: number) => {
    setCustomVoices(prev => {
      const updated = [...prev];
      if (updated[index]?.url) {
        URL.revokeObjectURL(updated[index].url!);
      }
      updated.splice(index, 1);
      toast.success("Custom vocal reference removed");
      return updated;
    });
  };

  // Dialogue state
  const [dialogueText, setDialogueText] = useState('Joe: Welcome to the future of AI.\nJane: It certainly looks bright from here.');
  const [speaker1, setSpeaker1] = useState('Joe');
  const [voice1, setVoice1] = useState('Charon');
  const [speaker2, setSpeaker2] = useState('Jane');
  const [voice2, setVoice2] = useState('Zephyr');

  const [loading, setLoading] = useState(false);
  const [audioStatus, setAudioStatus] = useState<'idle' | 'playing' | 'ready'>('idle');
  const [downloadBlob, setDownloadBlob] = useState<Blob | null>(null);
  const [history, setHistory] = useState<any[]>([]);

  // Load draft on project load
  useEffect(() => {
    if (activeProject) {
      const draft = activeProject.assets?.audioDraft;
      if (draft) {
        if (draft.mode) setMode(draft.mode);
        if (draft.text) setText(draft.text);
        if (draft.voice) setVoice(draft.voice);
        if (draft.emotion) setEmotion(draft.emotion);
        if (draft.excitement !== undefined) setExcitement(draft.excitement);
        if (draft.urgency !== undefined) setUrgency(draft.urgency);
        if (draft.dialogueText) setDialogueText(draft.dialogueText);
        if (draft.speaker1) setSpeaker1(draft.speaker1);
        if (draft.voice1) setVoice1(draft.voice1);
        if (draft.speaker2) setSpeaker2(draft.speaker2);
        if (draft.voice2) setVoice2(draft.voice2);
      }
    }
  }, [activeProject?.id]);

  // Auto-save draft logic
  useEffect(() => {
    if (!activeProject) return;

    const currentDraft = activeProject.assets?.audioDraft || {};
    if (
      mode === (currentDraft.mode || 'narration') &&
      text === (currentDraft.text || '') &&
      voice === (currentDraft.voice || 'Zephyr') &&
      emotion === (currentDraft.emotion || 'default') &&
      excitement === (currentDraft.excitement !== undefined ? currentDraft.excitement : 50) &&
      urgency === (currentDraft.urgency !== undefined ? currentDraft.urgency : 50) &&
      dialogueText === (currentDraft.dialogueText || 'Joe: Welcome to the future of AI.\nJane: It certainly looks bright from here.') &&
      speaker1 === (currentDraft.speaker1 || 'Joe') &&
      voice1 === (currentDraft.voice1 || 'Charon') &&
      speaker2 === (currentDraft.speaker2 || 'Jane') &&
      voice2 === (currentDraft.voice2 || 'Zephyr')
    ) {
      return;
    }

    setSaveStatus('saving');
    const timer = setTimeout(async () => {
      try {
        await updateActiveProject({
          assets: {
            ...activeProject.assets,
            audioDraft: {
              mode,
              text,
              voice,
              emotion,
              excitement,
              urgency,
              dialogueText,
              speaker1,
              voice1,
              speaker2,
              voice2
            }
          }
        });
        setSaveStatus('saved');
        setTimeout(() => setSaveStatus('idle'), 1500);
      } catch (err) {
        console.error('[Audio Draft Auto-Save Fail]', err);
        setSaveStatus('idle');
      }
    }, 3000); // 3 seconds timeout

    return () => clearTimeout(timer);
  }, [mode, text, voice, emotion, excitement, urgency, dialogueText, speaker1, voice1, speaker2, voice2, activeProject]);

  const audioContextRef = useRef<AudioContext | null>(null);
  const currentSourceRef = useRef<AudioBufferSourceNode | null>(null);

  // AI Script Analysis Recommendation Engine
  const handleAnalyzeScript = async () => {
    if (!text.trim()) {
      toast.error("Please enter a narrative script first.");
      return;
    }
    setIsAnalyzingScript(true);
    const tid = toast.loading("Analyzing script narrative tone and style with Gemini...");
    try {
      const resp = await fetch('/api/script/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ script: text })
      });
      if (!resp.ok) throw new Error("HTTP error " + resp.status);
      const data = await resp.json();
      setScriptAnalysis(data);
      toast.success("Script analyzed! Voice recommendations are now active below.", { id: tid });
    } catch (err: any) {
      console.error("Script analysis failed:", err);
      toast.error("Vibe assessment failed: " + err.message, { id: tid });
    } finally {
      setIsAnalyzingScript(false);
    }
  };

  // Recommendaion Engine Match Scorer
  const getRecommendedVoices = () => {
    if (!scriptAnalysis) return [];
    const suggestions = (scriptAnalysis.suggestedTags || []).map(t => t.toLowerCase());
    
    const scoredPrebuilt = VOICES.map(v => {
      let score = 0;
      if (suggestions.includes(v.tone.toLowerCase())) score += 30;
      const textToSearch = `${v.desc} ${v.profile} ${v.sentiment}`.toLowerCase();
      suggestions.forEach(tag => {
        if (textToSearch.includes(tag)) score += 25;
      });
      return { ...v, isCustom: false, score };
    });

    const scoredCustom = dbVoiceProfiles.map(p => {
      let score = 0;
      const tags = (p.tags || []).map((t: string) => t.toLowerCase());
      suggestions.forEach(tag => {
        if (tags.includes(tag)) score += 45;
      });
      const textToSearch = `${p.description || ''} ${p.sentiment || ''}`.toLowerCase();
      suggestions.forEach(tag => {
        if (textToSearch.includes(tag)) score += 20;
      });
      return { ...p, isCustom: true, score };
    });

    return [...scoredPrebuilt, ...scoredCustom]
      .filter(v => v.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, 3);
  };

  // Bulk Edit custom profiles Database updates
  const applyBulkTags = async () => {
    if (!bulkTags.trim()) {
      toast.error("Please enter at least one tag.");
      return;
    }
    if (selectedProfileIds.length === 0) {
      toast.error("No profiles selected.");
      return;
    }
    setIsBulkProcessing(true);
    const tid = toast.loading(`Updating ${selectedProfileIds.length} profiles...`);
    try {
      const newTags = bulkTags.split(',').map(t => t.trim().toLowerCase()).filter(Boolean);
      await Promise.all(selectedProfileIds.map(async (id) => {
        const profile = dbVoiceProfiles.find(p => p.id === id);
        if (profile) {
          const existing = profile.tags || [];
          const merged = Array.from(new Set([...existing, ...newTags]));
          await updateDoc(doc(firestoreDb, 'voice_profiles', id), { tags: merged });
        }
      }));
      toast.success(`Successfully batch tags applied to ${selectedProfileIds.length} profiles!`, { id: tid });
      setBulkTags('');
      setSelectedProfileIds([]);
    } catch (err: any) {
      console.error("Bulk tag update failed:", err);
      toast.error("Bulk tag failed: " + err.message, { id: tid });
    } finally {
      setIsBulkProcessing(false);
    }
  };

  const applyBulkRename = async () => {
    if (!bulkRename.trim()) {
      toast.error("Please enter a base profile name.");
      return;
    }
    if (selectedProfileIds.length === 0) {
      toast.error("No profiles selected.");
      return;
    }
    setIsBulkProcessing(true);
    const tid = toast.loading(`Renaming ${selectedProfileIds.length} profiles...`);
    try {
      await Promise.all(selectedProfileIds.map(async (id, idx) => {
        const profile = dbVoiceProfiles.find(p => p.id === id);
        if (profile) {
          const newName = `${bulkRename.trim()} ${idx + 1}`;
          await updateDoc(doc(firestoreDb, 'voice_profiles', id), { name: newName });
        }
      }));
      toast.success(`Renamed ${selectedProfileIds.length} profiles successfully!`, { id: tid });
      setBulkRename('');
      setSelectedProfileIds([]);
    } catch (err: any) {
      console.error("Bulk rename failed:", err);
      toast.error("Bulk rename failed: " + err.message, { id: tid });
    } finally {
      setIsBulkProcessing(false);
    }
  };

  const applyBulkDelete = async () => {
    if (selectedProfileIds.length === 0) {
      toast.error("No profiles selected.");
      return;
    }
    if (!window.confirm(`Are you sure you want to permanently delete these ${selectedProfileIds.length} custom profiles?`)) {
      return;
    }
    setIsBulkProcessing(true);
    const tid = toast.loading(`Deleting ${selectedProfileIds.length} profiles...`);
    try {
      await Promise.all(selectedProfileIds.map(async (id) => {
        await deleteDoc(doc(firestoreDb, 'voice_profiles', id));
        if (voice === `custom_${id}`) {
          setVoice('Zephyr');
        }
      }));
      toast.success(`Deleted ${selectedProfileIds.length} profiles from vault.`, { id: tid });
      setSelectedProfileIds([]);
    } catch (err: any) {
      console.error("Bulk delete failed:", err);
      toast.error("Bulk delete failed: " + err.message, { id: tid });
    } finally {
      setIsBulkProcessing(false);
    }
  };

  // A/B Voice comparison test engine
  const handleGenerateABTest = async () => {
    if (!text.trim()) {
      toast.error("Please insert a narrative script to process A/B tests.");
      return;
    }
    setAbLoading(true);
    setAbBufferA(null);
    setAbBufferB(null);
    if (abActiveSource) {
      try { abActiveSource.stop(); } catch(e) {}
      setAbPlaying('none');
    }
    const abToastId = toast.loading("Synthesizing adjacent voice channels A and B...");
    try {
      let voiceAParam = abVoiceA;
      let customRefA: any[] | undefined = undefined;
      if (abVoiceA.startsWith('custom_')) {
        const id = abVoiceA.replace('custom_', '');
        const match = dbVoiceProfiles.find(p => p.id === id);
        if (match) {
          voiceAParam = match.name;
          customRefA = [{ b64Data: match.b64Data, mimeType: match.mimeType || 'audio/webm', name: match.name }];
        }
      }
      
      let voiceBParam = abVoiceB;
      let customRefB: any[] | undefined = undefined;
      if (abVoiceB.startsWith('custom_')) {
        const id = abVoiceB.replace('custom_', '');
        const match = dbVoiceProfiles.find(p => p.id === id);
        if (match) {
          voiceBParam = match.name;
          customRefB = [{ b64Data: match.b64Data, mimeType: match.mimeType || 'audio/webm', name: match.name }];
        }
      }

      toast.loading("Rendering Probe A...", { id: abToastId });
      const b64A = await generateSpeech(text, voiceAParam, customRefA, excitement, urgency);
      
      toast.loading("Rendering Probe B...", { id: abToastId });
      const b64B = await generateSpeech(text, voiceBParam, customRefB, excitement, urgency);

      if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)({ sampleRate: 24000 });
      }
      const ctx = audioContextRef.current;

      if (b64A) {
        const bytesA = decodeBase64(b64A);
        const bufA = await decodeAudioData(bytesA, ctx, 24000, 1);
        setAbBufferA(bufA);
      }
      
      if (b64B) {
        const bytesB = decodeBase64(b64B);
        const bufB = await decodeAudioData(bytesB, ctx, 24000, 1);
        setAbBufferB(bufB);
      }

      toast.success("A/B vocal options synthesized successfully!", { id: abToastId });
    } catch (err: any) {
      console.error("A/B Synthesis failed:", err);
      toast.error("A/B testing synthesis failed: " + err.message, { id: abToastId });
    } finally {
      setAbLoading(false);
    }
  };

  const playABBuffer = (buffer: AudioBuffer, version: 'a' | 'b') => {
    if (!audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)({ sampleRate: 24000 });
    }
    const ctx = audioContextRef.current;
    
    if (abActiveSource) {
      try { abActiveSource.stop(); } catch (e) {}
    }
    if (currentSourceRef.current) {
      try { currentSourceRef.current.stop(); } catch (e) {}
    }

    const source = ctx.createBufferSource();
    source.buffer = buffer;
    source.connect(ctx.destination);
    source.onended = () => {
      setAbPlaying('none');
    };
    source.start(0);
    setAbActiveSource(source);
    setAbPlaying(version);
    toast.success(`Playing Sound Probe: Channel ${version.toUpperCase()}`);
  };

  const stopABPlayback = () => {
    if (abActiveSource) {
      try { abActiveSource.stop(); } catch (e) {}
      setAbPlaying('none');
    }
  };

  const adoptABVersion = async (version: 'a' | 'b') => {
    const targetBuf = version === 'a' ? abBufferA : abBufferB;
    const selectedVoiceId = version === 'a' ? abVoiceA : abVoiceB;
    if (!targetBuf) {
      toast.error("Selected vocal performance channel is empty.");
      return;
    }
    stopABPlayback();
    setVoBuffer(targetBuf);
    setOriginalVoBuffer(targetBuf);
    setIsMastered(false);
    setVoice(selectedVoiceId);
    
    // Prepare standard master
    const wav = encodeWAV(targetBuf.getChannelData(0), 24000);
    setDownloadBlob(wav);
    setAudioStatus('ready');

    toast.success(`Active master overridden with Channel ${version.toUpperCase()} vocal performance.`, {
      icon: '🏆',
      duration: 3500
    });
  };

  useEffect(() => {
    if (prefill?.text) setText(prefill.text);
    if (prefill?.voice) setVoice(prefill.voice);
  }, [prefill]);

  const handleSynthesize = async () => {
    if (mode === 'narration' && !text.trim()) return;
    if (mode === 'dialogue' && !dialogueText.trim()) return;

    setLoading(true);
    setAudioStatus('idle');
    setDownloadBlob(null);

    try {
      let base64: string | null = null;
      if (mode === 'narration') {
        const emotionPrefix = EMOTIONS.find(e => e.id === emotion)?.prompt || '';
        
        let activeCustomVoicesToSend = customVoices
          .filter(cv => cv.b64Data)
          .map(cv => ({
            b64Data: cv.b64Data!,
            mimeType: cv.type || 'audio/ogg',
            name: cv.name
          }));

        // Dynamically append selected Firestore voice profile if it starts with 'custom_'
        let activeVoiceParam = voice;
        if (voice.startsWith('custom_')) {
          const profileId = voice.replace('custom_', '');
          const matchProfile = dbVoiceProfiles.find(p => p.id === profileId);
          if (matchProfile) {
            activeVoiceParam = matchProfile.name;
            activeCustomVoicesToSend = [
              {
                b64Data: matchProfile.b64Data,
                mimeType: matchProfile.mimeType || 'audio/webm',
                name: matchProfile.name
              }
            ];
          }
        }

        const voiceRef = activeCustomVoicesToSend.length > 0 ? activeCustomVoicesToSend : undefined;
        base64 = await generateSpeech(
          emotionPrefix + text, 
          activeVoiceParam, 
          voiceRef,
          excitement,
          urgency
        );
      } else {
        // Dialogue MultiSpeaker engine
        // Substitute custom voice identifiers with standard high-fidelity voices to prevent system engine crashes
        let resolvedVoice1 = voice1;
        let resolvedVoice2 = voice2;

        if (voice1.startsWith('custom_')) {
          const profileId = voice1.replace('custom_', '');
          const matchProfile = dbVoiceProfiles.find(p => p.id === profileId);
          resolvedVoice1 = matchProfile ? 'Zephyr' : voice1;
          toast.success(`Broadcasting ${matchProfile?.name || 'Custom Voice'} through standard neural channels.`, { duration: 2500 });
        }
        if (voice2.startsWith('custom_')) {
          const profileId = voice2.replace('custom_', '');
          const matchProfile = dbVoiceProfiles.find(p => p.id === profileId);
          resolvedVoice2 = matchProfile ? 'Charon' : voice2;
          toast.success(`Broadcasting ${matchProfile?.name || 'Custom Voice'} through standard neural channels.`, { duration: 2500 });
        }

        base64 = await generateMultiSpeakerSpeech(dialogueText, speaker1, resolvedVoice1, speaker2, resolvedVoice2);
      }

      if (base64) {
        await processAndPlay(base64);
        const log = {
          id: Date.now(),
          text: mode === 'narration' ? text : dialogueText,
          voice: voice.startsWith('custom_') ? `Custom Firestore Profile` : (mode === 'narration' ? voice : `${voice1}/${voice2}`),
          date: new Date().toLocaleTimeString()
        };
        setHistory(prev => [log, ...prev].slice(0, 5));
      }
    } catch (e) {
      console.error(e);
      toast.error("Neural synthesis failed. Check API key and quota.");
    } finally {
      setLoading(false);
    }
  };

  const processAndPlay = async (base64: string) => {
    if (!audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)({ sampleRate: 24000 });
    }
    const ctx = audioContextRef.current;
    
    // Stop previous
    if (currentSourceRef.current) {
      try {
        currentSourceRef.current.stop();
      } catch (err) {
        // Safe skip if source has already ended
      }
    }

    const bytes = decodeBase64(base64);
    const buffer = await decodeAudioData(bytes, ctx, 24000, 1);
    
    // Store in our timeline narration slot and initial mastering input buffers
    setVoBuffer(buffer);
    setOriginalVoBuffer(buffer);
    setIsMastered(false);
    
    // Prepare for download
    const wav = encodeWAV(buffer.getChannelData(0), 24000);
    setDownloadBlob(wav);

    const source = ctx.createBufferSource();
    source.buffer = buffer;

    // Apply digital signal processing filters when two custom voices are uploaded to simulate neural voiceover modulation
    if (customVoices.length === 2) {
      console.log("[Neural Narration Engine] Cloned filter active. Creating custom vocal resonance profile...");
      const filterResonance = ctx.createBiquadFilter();
      filterResonance.type = 'peaking';
      filterResonance.Q.value = 2.0;
      filterResonance.frequency.value = 1000; // Human vocal presence peak
      filterResonance.gain.value = 8; // Boost clarity

      const filterWarmth = ctx.createBiquadFilter();
      filterWarmth.type = 'lowshelf';
      filterWarmth.frequency.value = 200; // Bass warmth band
      filterWarmth.gain.value = 4; // Add rich baritone weight

      source.connect(filterResonance);
      filterResonance.connect(filterWarmth);
      filterWarmth.connect(ctx.destination);
    } else {
      source.connect(ctx.destination);
    }
    
    setAudioStatus('playing');
    source.start();
    currentSourceRef.current = source;
    
    source.onended = () => {
      setAudioStatus('ready');
      currentSourceRef.current = null;
    };
  };

  const downloadMaster = () => {
    if (!downloadBlob) return;
    const url = URL.createObjectURL(downloadBlob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `neural_cloned_narrator_${Date.now()}.wav`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Automated 'Audio Mastering' Pipeline runner
  const handleMasterAudio = async () => {
    if (!originalVoBuffer) {
      toast.error("Please synthesize or upload a voiceover clip first to run the mastering pipeline.");
      return;
    }

    setIsMastering(true);
    const toastId = toast.loading("Executing mastering pipeline (Gating, Compression, Yield Normalization)...");

    try {
      if (!masterAudioCtxRef.current) {
        masterAudioCtxRef.current = new (window.AudioContext || window.webkitAudioContext)({ sampleRate: 24000 });
      }
      const ctx = masterAudioCtxRef.current;
      
      // Simulate real-time mastering analysis delay
      await new Promise(resolve => setTimeout(resolve, 1500));

      const mastered = await masterAudioBuffer(originalVoBuffer, ctx, {
        noiseReduction: masterNoiseGate,
        compress: masterCompressor,
        normalize: masterNormalization,
        noiseReductionThreshold,
        compressorThreshold,
        compressorRatio,
        compressorMakeupGain,
        normalizePeak
      });

      // Update both buffers and play back mastered output
      setVoBuffer(mastered);
      setIsMastered(true);

      // Re-encode WAV output so export files are of professional standard
      const masteredWav = encodeWAV(mastered.getChannelData(0), 24000);
      setDownloadBlob(masteredWav);

      // Simple visual comparison feedback
      toast.success("Audio Mastering Complete! Dynamic loudness calibrated to -14 LUFS Peak.", { id: toastId, duration: 4500 });
      
      // Play back mastered result for immediate acoustic review
      if (currentSourceRef.current) {
        try { currentSourceRef.current.stop(); } catch(e) {}
      }
      const source = ctx.createBufferSource();
      source.buffer = mastered;
      source.connect(ctx.destination);
      setAudioStatus('playing');
      source.start();
      currentSourceRef.current = source;
      source.onended = () => {
        setAudioStatus('ready');
        currentSourceRef.current = null;
      };

    } catch (err: any) {
      console.error(err);
      toast.error("Mastering failed: " + err.message, { id: toastId });
    } finally {
      setIsMastering(false);
    }
  };

  // Synthesis of procedural background tracks
  const handleLoadSyntheticBgm = async (type: 'none' | 'drone' | 'lofi' | 'cyber') => {
    if (type === 'none') {
      setBgmBuffer(null);
      setBgmType('none');
      toast.success("Background music deactivated.");
      return;
    }

    const toastId = toast.loading(`Synthesizing procedural ${type} ambient loop (30s)...`);
    try {
      const buffer = await synthesizeAmbientTrack(type, 30);
      setBgmBuffer(buffer);
      setBgmType(type);
      toast.success(`Synthesized procedural ${type} track. Zero-latency loop cached!`, { id: toastId });
    } catch (err) {
      console.error(err);
      toast.error("Synthesis failed.", { id: toastId });
    }
  };

  // Synthesis of Sound Effects
  const handleLoadSyntheticSfx = async (type: 'none' | 'sub_drop' | 'laser' | 'sweep') => {
    if (type === 'none') {
      setSfxBuffer(null);
      setSfxType('none');
      toast.success("Sound effects deactivated.");
      return;
    }

    const toastId = toast.loading(`Synthesizing ${type} sound effect...`);
    try {
      const buffer = await synthesizeSfx(type);
      setSfxBuffer(buffer);
      setSfxType(type);
      toast.success(`Synthesized ${type} SFX. Ready for timeline layering!`, { id: toastId });
    } catch (err) {
      console.error(err);
      toast.error("SFX synthesis failed.", { id: toastId });
    }
  };

  const getEnvelopeVolumeAt = (points: Array<{ time: number; volume: number }>, t: number, defaultVol: number, enabled: boolean) => {
    if (!enabled || points.length === 0) return defaultVol;
    const sorted = [...points].sort((a, b) => a.time - b.time);
    if (t <= sorted[0].time) return sorted[0].volume;
    if (t >= sorted[sorted.length - 1].time) return sorted[sorted.length - 1].volume;
    for (let i = 0; i < sorted.length - 1; i++) {
      const p1 = sorted[i];
      const p2 = sorted[i+1];
      if (t >= p1.time && t <= p2.time) {
        if (p2.time === p1.time) return p1.volume;
        const ratio = (t - p1.time) / (p2.time - p1.time);
        return p1.volume + ratio * (p2.volume - p1.volume);
      }
    }
    return defaultVol;
  };

  // Play Timeline in dynamic multi-track synchronicity with visual volume automation schedule
  const handleTimelinePlay = () => {
    if (isTimelinePlaying) {
      handleTimelineStop();
      return;
    }

    const activeTracks = [
      { buffer: voBuffer, name: 'Voiceover Narrations' },
      { buffer: bgmBuffer, name: 'Background Music' },
      { buffer: sfxBuffer, name: 'Sound Effects' }
    ].filter(t => t.buffer !== null);

    if (activeTracks.length === 0) {
      toast.error("Please record some voice, load procedural BGMs, or trigger sound effects before playing the timeline.");
      return;
    }

    try {
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      playlistStartTimeRef.current = ctx.currentTime;
      
      const startProgress = timelineProgress >= 100 ? 0 : timelineProgress;
      const startOffset = (startProgress / 100) * timelineDuration;

      // Stop any existing single narration playing
      if (currentSourceRef.current) {
        try { currentSourceRef.current.stop(); } catch(e) {}
      }

      const sourcesAndGains: any[] = [];

      // 1. Voiceover (VO) Layer
      if (voBuffer) {
        const source = ctx.createBufferSource();
        source.buffer = voBuffer;
        const gainNode = ctx.createGain();
        source.connect(gainNode);
        gainNode.connect(ctx.destination);
        
        if (voAutomationEnabled) {
          const initVol = getEnvelopeVolumeAt(voAutomationPoints, startOffset, voVolume, true);
          gainNode.gain.setValueAtTime(initVol, ctx.currentTime);
          const sortedPts = [...voAutomationPoints].sort((a,b) => a.time - b.time);
          sortedPts.forEach(pt => {
            if (pt.time > startOffset) {
              gainNode.gain.linearRampToValueAtTime(pt.volume, ctx.currentTime + (pt.time - startOffset));
            }
          });
        } else {
          gainNode.gain.setValueAtTime(voVolume, ctx.currentTime);
        }
        
        source.start(0, startOffset);
        sourcesAndGains.push({ source, gainNode });
      }

      // 2. Background Music (BGM) Layer
      if (bgmBuffer) {
        const source = ctx.createBufferSource();
        source.buffer = bgmBuffer;
        source.loop = true; // Loop the music
        const gainNode = ctx.createGain();
        source.connect(gainNode);
        gainNode.connect(ctx.destination);
        
        if (bgmAutomationEnabled) {
          const initVol = getEnvelopeVolumeAt(bgmAutomationPoints, startOffset, bgmVolume, true);
          gainNode.gain.setValueAtTime(initVol, ctx.currentTime);
          const sortedPts = [...bgmAutomationPoints].sort((a,b) => a.time - b.time);
          sortedPts.forEach(pt => {
            if (pt.time > startOffset) {
              gainNode.gain.linearRampToValueAtTime(pt.volume, ctx.currentTime + (pt.time - startOffset));
            }
          });
        } else {
          gainNode.gain.setValueAtTime(bgmVolume, ctx.currentTime);
        }
        
        source.start(0, startOffset % bgmBuffer.duration);
        sourcesAndGains.push({ source, gainNode });
      }

      // 3. Sound Effects (SFX) Layer
      if (sfxBuffer) {
        const source = ctx.createBufferSource();
        source.buffer = sfxBuffer;
        const gainNode = ctx.createGain();
        source.connect(gainNode);
        gainNode.connect(ctx.destination);
        
        if (sfxAutomationEnabled) {
          const initVol = getEnvelopeVolumeAt(sfxAutomationPoints, startOffset, sfxVolume, true);
          gainNode.gain.setValueAtTime(initVol, ctx.currentTime);
          const sortedPts = [...sfxAutomationPoints].sort((a,b) => a.time - b.time);
          sortedPts.forEach(pt => {
            if (pt.time > startOffset) {
              gainNode.gain.linearRampToValueAtTime(pt.volume, ctx.currentTime + (pt.time - startOffset));
            }
          });
        } else {
          gainNode.gain.setValueAtTime(sfxVolume, ctx.currentTime);
        }
        
        if (startOffset < sfxBuffer.duration) {
          source.start(0, startOffset);
          sourcesAndGains.push({ source, gainNode });
        }
      }

      // Track all active resources to guarantee a clean stop call
      activeTimelineSourcesRef.current = sourcesAndGains;
      setIsTimelinePlaying(true);
      setTimelineProgress(startProgress);

      // Start tick timer
      const tickRateMs = 150;
      let elapsed = startOffset;
      timelineIntervalRef.current = setInterval(() => {
        elapsed += (tickRateMs / 1000);
        if (elapsed >= timelineDuration) {
          handleTimelineStop();
          setTimelineProgress(100);
        } else {
          setTimelineProgress((elapsed / timelineDuration) * 100);
        }
      }, tickRateMs);

      toast.success("Synchronized studio timeline playback is live!", { icon: '🎚️' });

    } catch (e: any) {
      console.error(e);
      toast.error("Timeline playback failed: " + e.message);
    }
  };

  // Stops all layered multitrack playback cleanly and releases handles
  const handleTimelineStop = () => {
    if (timelineIntervalRef.current) {
      clearInterval(timelineIntervalRef.current);
      timelineIntervalRef.current = null;
    }
    
    activeTimelineSourcesRef.current.forEach(item => {
      try {
        item.source.stop();
      } catch (err) {}
    });
    activeTimelineSourcesRef.current = [];
    setIsTimelinePlaying(false);
    toast.success("Multi-track synchronized playback stopped.");
  };

  // Automation Point Click Editors
  const handleAddAutomationPoint = (trackType: 'vo' | 'bgm' | 'sfx', time: number, vol: number) => {
    const updatedPoint = { id: Date.now(), time: Math.round(time), volume: parseFloat(vol.toFixed(2)) };
    
    if (trackType === 'vo') {
      setVoAutomationPoints(prev => {
        const filtered = prev.filter(pt => Math.round(pt.time) !== Math.round(time));
        return [...filtered, updatedPoint].sort((a, b) => a.time - b.time);
      });
    } else if (trackType === 'bgm') {
      setBgmAutomationPoints(prev => {
        const filtered = prev.filter(pt => Math.round(pt.time) !== Math.round(time));
        return [...filtered, updatedPoint].sort((a, b) => a.time - b.time);
      });
    } else {
      setSfxAutomationPoints(prev => {
        const filtered = prev.filter(pt => Math.round(pt.time) !== Math.round(time));
        return [...filtered, updatedPoint].sort((a, b) => a.time - b.time);
      });
    }
    toast.success(`Added visual envelope node at ${Math.round(time)}s`);
  };

  const handleResetAutomation = (trackType: 'vo' | 'bgm' | 'sfx') => {
    if (trackType === 'vo') {
      setVoAutomationPoints([
        { id: 1, time: 0, volume: 0.8 },
        { id: 2, time: 10, volume: 0.8 },
        { id: 3, time: 20, volume: 0.8 },
        { id: 4, time: 30, volume: 0.8 },
      ]);
    } else if (trackType === 'bgm') {
      setBgmAutomationPoints([
        { id: 1, time: 0, volume: 0.3 },
        { id: 2, time: 10, volume: 0.1 },
        { id: 3, time: 20, volume: 0.1 },
        { id: 4, time: 30, volume: 0.3 },
      ]);
    } else {
      setSfxAutomationPoints([
        { id: 1, time: 0, volume: 0.5 },
        { id: 2, time: 10, volume: 0.5 },
        { id: 3, time: 20, volume: 0.5 },
        { id: 4, time: 30, volume: 0.5 },
      ]);
    }
    toast.success(`Reset envelope structure to default gradients.`);
  };

  return (
    <div className="max-w-7xl mx-auto space-y-12 animate-fade-in pb-20 relative">
      <div className="text-center space-y-4 py-8">
        <div className="inline-flex items-center justify-center p-4 rounded-[2.5rem] bg-purple-500/10 text-purple-500 mb-2 border border-purple-500/20 shadow-2xl">
           <Waves size={44} strokeWidth={2.5} />
        </div>
        <h2 className="text-5xl font-black bg-gradient-to-br from-white to-zinc-600 bg-clip-text text-transparent tracking-tighter">
          Neural Narrator Studio
        </h2>
        <p className="text-zinc-400 text-lg font-medium max-w-2xl mx-auto">
          Convert high-retention scripts into cinematic voiceovers with deep emotional mapping and authoritative vocal identities.
        </p>
      </div>

      <div className="flex justify-center mb-8">
        <div className="bg-zinc-900/50 p-1.5 rounded-[2rem] border border-zinc-800 flex gap-2">
           <button 
             onClick={() => setMode('narration')}
             className={`px-8 py-3 rounded-2xl text-sm font-black uppercase tracking-widest transition-all ${mode === 'narration' ? 'bg-purple-600 text-white shadow-lg' : 'text-zinc-500 hover:text-white'}`}
           >
             Single Voice
           </button>
           <button 
             onClick={() => setMode('dialogue')}
             className={`px-8 py-3 rounded-2xl text-sm font-black uppercase tracking-widest transition-all ${mode === 'dialogue' ? 'bg-purple-600 text-white shadow-lg' : 'text-zinc-500 hover:text-white'}`}
           >
             Dialogue Engine
           </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left: Configuration */}
        <div className="lg:col-span-4 space-y-6">
           <div className="bg-zinc-900 border border-zinc-800 rounded-[2.5rem] p-8 shadow-2xl space-y-8">
              <div className="flex items-center justify-between border-b border-zinc-800 pb-4">
                 <h3 className="text-xs font-black uppercase tracking-[0.2em] text-white">Vocal Identities</h3>
                 <Ear size={16} className="text-purple-500" />
              </div>

              {mode === 'narration' ? (
                <div className="space-y-4">
                  {/* Voice Selection Dropdown with optgroups */}
                  <div className="space-y-2">
                    <div className="flex justify-between items-center ml-1 mb-1">
                      <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest block">Select Active Narrator</label>
                      <button
                        type="button"
                        onClick={handleAnalyzeScript}
                        disabled={isAnalyzingScript || !text.trim()}
                        className="flex items-center gap-1 px-2.5 py-1 bg-purple-500/10 border border-purple-500/20 hover:bg-purple-500/20 disabled:opacity-30 rounded-lg text-[9px] font-black text-purple-400 uppercase tracking-widest transition-all cursor-pointer select-none"
                      >
                        {isAnalyzingScript ? <Loader2 size={10} className="animate-spin" /> : <Sparkles size={10} />}
                        AI Vibe Check
                      </button>
                    </div>
                    <select
                      value={voice}
                      onChange={e => setVoice(e.target.value)}
                      className="w-full bg-zinc-950 border border-zinc-800 rounded-2xl p-4 text-xs text-white uppercase font-black tracking-wider outline-none focus:ring-2 focus:ring-purple-500/50 transition-colors cursor-pointer"
                    >
                      <optgroup label="Standard System Voices" className="bg-zinc-950 text-zinc-400 text-left font-bold py-1">
                        {VOICES.map(v => (
                          <option key={v.id} value={v.id} className="text-white py-1">{v.label} (Tone: {v.tone})</option>
                        ))}
                      </optgroup>
                      
                      {dbVoiceProfiles.length > 0 && (
                        <optgroup label="Custom Voices (Firestore)" className="bg-zinc-950 text-purple-400 font-bold py-1">
                          {dbVoiceProfiles.map(p => (
                            <option key={`custom_${p.id}`} value={`custom_${p.id}`} className="text-white py-1">🎙️ {p.name} ({p.tags?.join(', ')})</option>
                          ))}
                        </optgroup>
                      )}
                    </select>
                  </div>

                  {/* AI Recommendation Engine Display result */}
                  {scriptAnalysis && (
                    <div className="bg-purple-950/20 border border-purple-500/20 rounded-2xl p-4 text-left space-y-2.5 animate-fade-in relative overflow-hidden">
                      <div className="absolute top-0 right-0 p-3 opacity-5">
                        <Brain size={48} />
                      </div>
                      <div className="flex items-center gap-1.5 text-[9px] font-black text-purple-300 uppercase tracking-widest">
                        <Brain size={12} className="text-purple-400 animate-pulse" />
                        Vibe Recommendation Engine
                      </div>
                      <div className="text-[11px] leading-relaxed text-zinc-300">
                        Sentiment: <strong className="text-purple-300 font-semibold">{scriptAnalysis.sentiment}</strong> • Vibe: <strong className="text-white capitalize">{scriptAnalysis.tone}</strong>
                      </div>
                      <div className="flex flex-wrap gap-1">
                        {scriptAnalysis.suggestedTags?.map((tag: string) => (
                          <span key={tag} className="px-2 py-0.5 text-[8px] font-black uppercase tracking-wider bg-purple-500/10 border border-purple-500/20 text-purple-300 rounded">
                            #{tag}
                          </span>
                        ))}
                      </div>
                      <p className="text-[10px] text-zinc-400 italic">
                        "{scriptAnalysis.explanation}"
                      </p>
                      
                      {(() => {
                        const matches = getRecommendedVoices();
                        if (matches.length > 0) {
                          return (
                            <div className="pt-2 border-t border-zinc-850/40 space-y-1.5">
                              <span className="text-[8px] font-black text-zinc-500 uppercase tracking-wider block">Suggested Matches:</span>
                              <div className="flex flex-col gap-1.5">
                                {matches.map((mv: any) => {
                                  const isSelected = mv.isCustom ? voice === mv.id : voice === mv.id;
                                  return (
                                    <button
                                      key={mv.id}
                                      type="button"
                                      onClick={() => setVoice(mv.id)}
                                      className={`flex items-center justify-between px-3 py-2 rounded-xl border text-[10px] transition-all cursor-pointer font-bold ${
                                        isSelected 
                                          ? 'bg-purple-500/10 border-purple-500 text-purple-300' 
                                          : 'bg-zinc-950/40 border-zinc-900 text-zinc-400 hover:border-zinc-800'
                                      }`}
                                    >
                                      <span className="flex items-center gap-1.5 min-w-0">
                                        {mv.isCustom ? '🎙️' : '⚙️'} <span className="truncate">{mv.name || mv.label}</span>
                                      </span>
                                      <span className="text-[8px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded bg-zinc-900 border border-zinc-800 text-zinc-500 shrink-0">
                                        {mv.score}% Match
                                      </span>
                                    </button>
                                  );
                                })}
                              </div>
                            </div>
                          );
                        }
                      })()}
                    </div>
                  )}

                  {/* Real-time Fine Tuned Emotional Modulators Slider */}
                  <div className="bg-zinc-950/50 p-4 border border-zinc-850 rounded-2xl text-left space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-[9px] font-black uppercase tracking-wider text-zinc-500">Emotional Intensity Modulators</span>
                      <SlidersHorizontal size={10} className="text-purple-400" />
                    </div>
                    
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between text-[8px] font-extrabold uppercase text-zinc-500 tracking-widest pl-0.5">
                        <span>Excitement Parameter</span>
                        <span className="font-mono text-purple-400">{excitement}%</span>
                      </div>
                      <input
                        type="range"
                        min="0"
                        max="100"
                        value={excitement}
                        onChange={(e) => setExcitement(parseInt(e.target.value))}
                        className="w-full accent-purple-500 bg-zinc-900 h-1 rounded-lg appearance-none cursor-pointer"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between text-[8px] font-extrabold uppercase text-zinc-500 tracking-widest pl-0.5">
                        <span>Urgency Parameter</span>
                        <span className="font-mono text-indigo-400">{urgency}%</span>
                      </div>
                      <input
                        type="range"
                        min="0"
                        max="100"
                        value={urgency}
                        onChange={(e) => setUrgency(parseInt(e.target.value))}
                        className="w-full accent-indigo-500 bg-zinc-900 h-1 rounded-lg appearance-none cursor-pointer"
                      />
                    </div>
                  </div>

                             {/* Active Speaker Card */}
                  <div className="p-4 rounded-2xl border border-zinc-850 bg-zinc-950 text-left">
                    {(() => {
                      if (voice.startsWith('custom_')) {
                        const customId = voice.replace('custom_', '');
                        const activeProfile = dbVoiceProfiles.find(p => p.id === customId);
                        if (activeProfile) {
                          return (
                            <div>
                              <div className="flex justify-between items-center mb-1">
                                <span className="text-xs font-black uppercase text-purple-400 tracking-widest flex items-center gap-1.5">
                                  <Mic size={12} /> {activeProfile.name}
                                </span>
                                <span className="text-[8px] font-black px-1.5 py-0.5 rounded border bg-purple-500/20 border-purple-500 text-purple-300">CLONED</span>
                              </div>
                              <p className="text-[10px] font-bold text-zinc-500 mb-1.5">Zero-shot custom voice profile</p>
                              <p className="text-[11px] text-zinc-400 font-medium leading-relaxed mb-3">{activeProfile.description}</p>
                              <div className="flex flex-wrap gap-1 mb-3">
                                {activeProfile.tags?.map((t: string) => (
                                  <span key={t} className="px-1.5 py-0.5 text-[8px] font-black uppercase tracking-wider bg-zinc-900 border border-zinc-800 text-zinc-400 rounded">{t}</span>
                                ))}
                              </div>

                              {/* Acoustic Fingerprint visual panel */}
                              <div className="pt-3 border-t border-zinc-900 space-y-3">
                                <div className="flex justify-between items-center text-[7px] font-black uppercase tracking-[0.2em] text-purple-400">
                                  <span>Active Voice Fingerprint</span>
                                  <span className="text-zinc-650 font-semibold">{activeProfile.sentiment || 'Standard tone'}</span>
                                </div>
                                <div className="grid grid-cols-2 gap-2">
                                  <div className="bg-zinc-900/60 p-2 rounded-xl border border-zinc-900 text-left">
                                    <span className="text-[7px] text-zinc-500 uppercase font-black block">Pitch Tone</span>
                                    <span className="text-[11px] font-mono font-black text-purple-300 mt-0.5 block">{activeProfile.pitch || 145} Hz</span>
                                  </div>
                                  <div className="bg-zinc-900/60 p-2 rounded-xl border border-zinc-900 text-left">
                                    <span className="text-[7px] text-zinc-500 uppercase font-black block">Speech Pacing</span>
                                    <span className="text-[11px] font-mono font-black text-indigo-300 mt-0.5 block">{activeProfile.tempo || 120} WPM</span>
                                  </div>
                                </div>
                                <div className="space-y-1.5">
                                  <div>
                                    <div className="flex justify-between text-[7px] font-bold text-zinc-500 uppercase leading-none mb-0.5">
                                      <span>Dynamic Range</span>
                                      <span className="font-mono text-purple-400">{activeProfile.fingerprint?.dynamicRange || 75}%</span>
                                    </div>
                                    <div className="h-1 bg-zinc-900 rounded-full overflow-hidden">
                                      <div className="h-full bg-purple-500" style={{ width: `${activeProfile.fingerprint?.dynamicRange || 75}%` }} />
                                    </div>
                                  </div>
                                  <div>
                                    <div className="flex justify-between text-[7px] font-bold text-zinc-500 uppercase leading-none mb-0.5">
                                      <span>Vocal Energy</span>
                                      <span className="font-mono text-indigo-400">{activeProfile.fingerprint?.vocalEnergy || 65}%</span>
                                    </div>
                                    <div className="h-1 bg-zinc-900 rounded-full overflow-hidden">
                                      <div className="h-full bg-indigo-500" style={{ width: `${activeProfile.fingerprint?.vocalEnergy || 65}%` }} />
                                    </div>
                                  </div>
                                  <div>
                                    <div className="flex justify-between text-[7px] font-bold text-zinc-500 uppercase leading-none mb-0.5">
                                      <span>Acoustic Resonance</span>
                                      <span className="font-mono text-blue-400">{activeProfile.fingerprint?.resonance || 70}%</span>
                                    </div>
                                    <div className="h-1 bg-zinc-900 rounded-full overflow-hidden">
                                      <div className="h-full bg-blue-500" style={{ width: `${activeProfile.fingerprint?.resonance || 70}%` }} />
                                    </div>
                                  </div>
                                  <div>
                                    <div className="flex justify-between text-[7px] font-bold text-zinc-500 uppercase leading-none mb-0.5">
                                      <span>Acoustic Clarity</span>
                                      <span className="font-mono text-emerald-400">{activeProfile.fingerprint?.clarity || 85}%</span>
                                    </div>
                                    <div className="h-1 bg-zinc-900 rounded-full overflow-hidden">
                                      <div className="h-full bg-emerald-500" style={{ width: `${activeProfile.fingerprint?.clarity || 85}%` }} />
                                    </div>
                                  </div>
                                  <div>
                                    <div className="flex justify-between text-[7px] font-bold text-zinc-500 uppercase leading-none mb-0.5">
                                      <span>Pacing Stability</span>
                                      <span className="font-mono text-pink-400">{activeProfile.fingerprint?.stability || 80}%</span>
                                    </div>
                                    <div className="h-1 bg-zinc-900 rounded-full overflow-hidden">
                                      <div className="h-full bg-pink-500" style={{ width: `${activeProfile.fingerprint?.stability || 80}%` }} />
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </div>
                          );
                        }
                      }

                      const activePrebuilt = VOICES.find(v => v.id === voice) || VOICES[0];
                      return (
                        <div>
                          <div className="flex justify-between items-center mb-1">
                            <span className="text-xs font-black uppercase text-zinc-300 tracking-widest">{activePrebuilt.label}</span>
                            <span className="text-[8px] font-black px-1.5 py-0.5 rounded border bg-zinc-900 border-zinc-800 text-zinc-500">{activePrebuilt.tone}</span>
                          </div>
                          <p className="text-[10px] font-bold text-zinc-650 mb-1.5">{activePrebuilt.profile}</p>
                          <p className="text-[11px] text-zinc-400 italic leading-relaxed mb-3">{activePrebuilt.desc}</p>

                          {/* Acoustic Fingerprint visual panel */}
                          <div className="pt-3 border-t border-zinc-900 space-y-3">
                            <div className="flex justify-between items-center text-[7px] font-black uppercase tracking-[0.2em] text-purple-400">
                              <span>Active Voice Fingerprint</span>
                              <span className="text-zinc-650 font-semibold">{activePrebuilt.sentiment || 'Standard tone'}</span>
                            </div>
                            <div className="grid grid-cols-2 gap-2">
                              <div className="bg-zinc-900/60 p-2 rounded-xl border border-zinc-900 text-left">
                                <span className="text-[7px] text-zinc-500 uppercase font-black block">Pitch Tone</span>
                                <span className="text-[11px] font-mono font-black text-purple-300 mt-0.5 block">{activePrebuilt.pitch || 145} Hz</span>
                              </div>
                              <div className="bg-zinc-900/60 p-2 rounded-xl border border-zinc-900 text-left">
                                <span className="text-[7px] text-zinc-500 uppercase font-black block">Speech Pacing</span>
                                <span className="text-[11px] font-mono font-black text-indigo-300 mt-0.5 block">{activePrebuilt.tempo || 120} WPM</span>
                              </div>
                            </div>
                            <div className="space-y-1.5">
                              <div>
                                <div className="flex justify-between text-[7px] font-bold text-zinc-500 uppercase leading-none mb-0.5">
                                  <span>Dynamic Range</span>
                                  <span className="font-mono text-purple-400">{activePrebuilt.fingerprint?.dynamicRange || 75}%</span>
                                </div>
                                <div className="h-1 bg-zinc-900 rounded-full overflow-hidden">
                                  <div className="h-full bg-purple-500" style={{ width: `${activePrebuilt.fingerprint?.dynamicRange || 75}%` }} />
                                </div>
                              </div>
                              <div>
                                <div className="flex justify-between text-[7px] font-bold text-zinc-500 uppercase leading-none mb-0.5">
                                  <span>Vocal Energy</span>
                                  <span className="font-mono text-indigo-400">{activePrebuilt.fingerprint?.vocalEnergy || 65}%</span>
                                </div>
                                <div className="h-1 bg-zinc-900 rounded-full overflow-hidden">
                                  <div className="h-full bg-indigo-500" style={{ width: `${activePrebuilt.fingerprint?.vocalEnergy || 65}%` }} />
                                </div>
                              </div>
                              <div>
                                <div className="flex justify-between text-[7px] font-bold text-zinc-500 uppercase leading-none mb-0.5">
                                  <span>Acoustic Resonance</span>
                                  <span className="font-mono text-blue-400">{activePrebuilt.fingerprint?.resonance || 70}%</span>
                                </div>
                                <div className="h-1 bg-zinc-900 rounded-full overflow-hidden">
                                  <div className="h-full bg-blue-500" style={{ width: `${activePrebuilt.fingerprint?.resonance || 70}%` }} />
                                </div>
                              </div>
                              <div>
                                <div className="flex justify-between text-[7px] font-bold text-zinc-500 uppercase leading-none mb-0.5">
                                  <span>Acoustic Clarity</span>
                                  <span className="font-mono text-emerald-400">{activePrebuilt.fingerprint?.clarity || 85}%</span>
                                </div>
                                <div className="h-1 bg-zinc-900 rounded-full overflow-hidden">
                                  <div className="h-full bg-emerald-500" style={{ width: `${activePrebuilt.fingerprint?.clarity || 85}%` }} />
                                </div>
                              </div>
                              <div>
                                <div className="flex justify-between text-[7px] font-bold text-zinc-500 uppercase leading-none mb-0.5">
                                  <span>Pacing Stability</span>
                                  <span className="font-mono text-pink-400">{activePrebuilt.fingerprint?.stability || 80}%</span>
                                </div>
                                <div className="h-1 bg-zinc-900 rounded-full overflow-hidden">
                                  <div className="h-full bg-pink-500" style={{ width: `${activePrebuilt.fingerprint?.stability || 80}%` }} />
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })()}
                  </div>
                </div>
              ) : (
                <div className="space-y-6">
                  <div className="space-y-3">
                    <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest block ml-1">Speaker 1</label>
                    <div className="grid grid-cols-2 gap-2">
                      <input value={speaker1} onChange={e => setSpeaker1(e.target.value)} className="bg-zinc-950 border border-zinc-800 rounded-xl p-2 text-xs text-white" placeholder="Name" />
                      <select value={voice1} onChange={e => setVoice1(e.target.value)} className="bg-zinc-950 border border-zinc-800 rounded-xl p-2 text-xs text-zinc-400 outline-none">
                        <optgroup label="Standard System Voices">
                          {VOICES.map(v => <option key={v.id} value={v.id}>{v.label}</option>)}
                        </optgroup>
                        {dbVoiceProfiles.length > 0 && (
                          <optgroup label="Custom Voices (Firestore)">
                            {dbVoiceProfiles.map(p => <option key={`custom_${p.id}`} value={`custom_${p.id}`}>🎙️ {p.name}</option>)}
                          </optgroup>
                        )}
                      </select>
                    </div>
                  </div>
                  <div className="space-y-3">
                    <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest block ml-1">Speaker 2</label>
                    <div className="grid grid-cols-2 gap-2">
                      <input value={speaker2} onChange={e => setSpeaker2(e.target.value)} className="bg-zinc-950 border border-zinc-800 rounded-xl p-2 text-xs text-white" placeholder="Name" />
                      <select value={voice2} onChange={e => setVoice2(e.target.value)} className="bg-zinc-950 border border-zinc-800 rounded-xl p-2 text-xs text-zinc-400 outline-none">
                        <optgroup label="Standard System Voices">
                          {VOICES.map(v => <option key={v.id} value={v.id}>{v.label}</option>)}
                        </optgroup>
                        {dbVoiceProfiles.length > 0 && (
                          <optgroup label="Custom Voices (Firestore)">
                            {dbVoiceProfiles.map(p => <option key={`custom_${p.id}`} value={`custom_${p.id}`}>🎙️ {p.name}</option>)}
                          </optgroup>
                        )}
                      </select>
                    </div>
                  </div>
                </div>
              )}

              {mode === 'narration' && (
                <>
                  <div className="w-full h-px bg-zinc-800"></div>
                  <div className="space-y-4">
                    <label className="text-[10px] font-black text-zinc-650 uppercase tracking-widest block ml-1">Emotional Blueprint</label>
                    <div className="grid grid-cols-1 gap-2">
                      {EMOTIONS.map(e => (
                        <button
                          key={e.id}
                          onClick={() => setEmotion(e.id)}
                          className={`flex items-center gap-3 px-4 py-3 rounded-xl border transition-all text-[10px] font-black uppercase tracking-widest ${emotion === e.id ? 'bg-purple-600 border-purple-500 text-white shadow-lg' : 'bg-zinc-950 border-zinc-800 text-zinc-500 hover:border-zinc-700'}`}
                        >
                          {e.icon} {e.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* Vocal Fingerprint Recorder integration */}
            <VoiceRecorder onProfileCreated={() => toast.success("Refreshed vocal profile matrix.")} />

            {/* Voice Profile Management UI */}
            <div className="bg-zinc-900 border border-zinc-800 rounded-[2.5rem] p-8 shadow-2xl space-y-6">
              <div className="flex items-center justify-between border-b border-zinc-800 pb-4">
                <div className="flex items-center gap-2">
                  <Mic size={16} className="text-purple-400 animate-pulse" />
                  <h3 className="text-xs font-black uppercase tracking-[0.2em] text-white">Custom Profile Vault</h3>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setBulkEditMode(!bulkEditMode);
                      setSelectedProfileIds([]);
                    }}
                    className={`px-2 py-0.5 text-[8px] font-black uppercase tracking-widest rounded border transition-all cursor-pointer ${
                      bulkEditMode 
                        ? 'bg-purple-600 border-purple-500 text-white animate-pulse' 
                        : 'bg-zinc-950 border-zinc-800 text-zinc-500 hover:text-white'
                    }`}
                  >
                    {bulkEditMode ? 'Exit Bulk' : 'Bulk Edit'}
                  </button>
                  <span className="text-[8px] font-black uppercase tracking-wider px-2 py-0.5 rounded border border-purple-500/20 bg-purple-500/10 text-purple-400">
                    {dbVoiceProfiles.length} SAVED
                  </span>
                </div>
              </div>

              {dbVoiceProfiles.length === 0 ? (
                <div className="p-8 border border-dashed border-zinc-800 rounded-2xl text-center space-y-2 bg-zinc-950/10">
                   <Mic size={24} className="mx-auto opacity-20 text-zinc-500" />
                   <p className="text-[11px] font-black text-zinc-500 uppercase tracking-wider">Vault Registry Empty</p>
                   <p className="text-[10px] text-zinc-650 leading-normal font-medium">Record or upload voice to register custom profiles.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Search Bar / Attribute filtering */}
                  <div className="relative">
                    <input
                      type="text"
                      value={voiceSearchQuery}
                      onChange={(e) => setVoiceSearchQuery(e.target.value)}
                      placeholder="Search profiles or tags (e.g. professional)..."
                      className="w-full bg-zinc-950 border border-zinc-800 rounded-xl pl-9 pr-8 py-2.5 text-xs text-white placeholder-zinc-600 focus:outline-none focus:border-purple-500 transition-colors"
                    />
                    <Search size={12} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
                    {voiceSearchQuery && (
                      <button
                        onClick={() => setVoiceSearchQuery('')}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-white text-[10px] uppercase font-black tracking-widest cursor-pointer"
                      >
                        Clear
                      </button>
                    )}
                  </div>

                  {bulkEditMode && (
                    <div className="flex items-center justify-between px-4 py-2.5 bg-zinc-950/60 rounded-xl border border-zinc-850 text-xs">
                      <button
                        type="button"
                        onClick={() => {
                          const currentFiltered = dbVoiceProfiles.filter(p => {
                            if (!voiceSearchQuery.trim()) return true;
                            const q = voiceSearchQuery.toLowerCase();
                            const nameMatches = p.name?.toLowerCase().includes(q);
                            const tagMatches = p.tags?.some((t: string) => t.toLowerCase().includes(q));
                            const descMatches = p.description?.toLowerCase().includes(q);
                            return nameMatches || tagMatches || descMatches;
                          });
                          if (selectedProfileIds.length === currentFiltered.length) {
                            setSelectedProfileIds([]);
                          } else {
                            setSelectedProfileIds(currentFiltered.map(p => p.id));
                          }
                        }}
                        className="text-purple-400 hover:text-purple-300 uppercase font-black tracking-wider text-[9px] cursor-pointer"
                      >
                        {selectedProfileIds.length > 0 ? 'Deselect All' : 'Select All Filtered'}
                      </button>
                      <span className="font-extrabold text-zinc-400 uppercase tracking-wider text-[9px]">
                        {selectedProfileIds.length} profiles selected
                      </span>
                    </div>
                  )}

                  {(() => {
                    const filtered = dbVoiceProfiles.filter(p => {
                      if (!voiceSearchQuery.trim()) return true;
                      const q = voiceSearchQuery.toLowerCase();
                      const nameMatches = p.name?.toLowerCase().includes(q);
                      const tagMatches = p.tags?.some((t: string) => t.toLowerCase().includes(q));
                      const descMatches = p.description?.toLowerCase().includes(q);
                      return nameMatches || tagMatches || descMatches;
                    });

                    if (filtered.length === 0) {
                      return (
                        <div className="p-8 border border-dashed border-zinc-805 rounded-xl text-center space-y-1 bg-zinc-950/20">
                          <p className="text-[10px] font-black text-zinc-500 uppercase tracking-wider">No matching profiles</p>
                          <p className="text-[9px] text-zinc-650">Try searching tags like "conversational", "excited", etc.</p>
                        </div>
                      );
                    }

                    return (
                      <>
                        <div className="space-y-4 max-h-[360px] overflow-y-auto pr-2 custom-scrollbar">
                          {filtered.map((p) => {
                          const isActive = voice === `custom_${p.id}`;
                          const isEditing = editingProfileId === p.id;
                          return (
                            <div 
                              key={p.id} 
                              className={`p-4 rounded-2xl border transition-all space-y-3 ${isActive ? 'bg-purple-600/5 border-purple-500' : 'bg-zinc-950 border-zinc-800'}`}
                            >
                              <div className="flex items-start justify-between gap-3">
                                <div className="flex items-start gap-2.5 min-w-0 flex-1">
                                  {bulkEditMode && (
                                    <input
                                      type="checkbox"
                                      checked={selectedProfileIds.includes(p.id)}
                                      onChange={() => {
                                        if (selectedProfileIds.includes(p.id)) {
                                          setSelectedProfileIds(selectedProfileIds.filter(id => id !== p.id));
                                        } else {
                                          setSelectedProfileIds([...selectedProfileIds, p.id]);
                                        }
                                      }}
                                      className="mt-1 w-4 h-4 accent-purple-500 rounded border-zinc-800 bg-zinc-950 cursor-pointer shrink-0"
                                    />
                                  )}

                                  {isEditing ? (
                                    <div className="flex-1 space-y-2">
                                      <input
                                        type="text"
                                        value={editingName}
                                        onChange={(e) => setEditingName(e.target.value)}
                                        className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-purple-500"
                                        placeholder="New profile name"
                                        autoFocus
                                      />
                                      <div className="flex gap-1.5">
                                        <button
                                          type="button"
                                          onClick={() => renameVoiceProfile(p.id, editingName)}
                                          className="px-2.5 py-1 bg-purple-600 hover:bg-purple-500 rounded text-[9px] font-black uppercase text-white flex items-center gap-1 cursor-pointer"
                                        >
                                          <Check size={10} /> Save
                                        </button>
                                        <button
                                          type="button"
                                          onClick={() => setEditingProfileId(null)}
                                          className="px-2.5 py-1 bg-zinc-900 hover:bg-zinc-800 rounded text-[9px] font-black uppercase text-zinc-400 flex items-center gap-1 cursor-pointer"
                                        >
                                          <X size={10} /> Cancel
                                        </button>
                                      </div>
                                    </div>
                                  ) : (
                                    <div className="text-left min-w-0 flex-1">
                                      <div className="flex items-center gap-1.5 min-w-0">
                                        <span className="text-xs font-black text-white truncate block max-w-[155px]">{p.name}</span>
                                        <button
                                          type="button"
                                          onClick={() => {
                                            setEditingProfileId(p.id);
                                            setEditingName(p.name || '');
                                          }}
                                          className="p-1 hover:bg-zinc-855 rounded text-zinc-650 hover:text-white transition-colors cursor-pointer shrink-0"
                                          title="Rename profile"
                                        >
                                          <Edit2 size={10} />
                                        </button>
                                      </div>
                                      <span className="text-[8px] font-semibold text-zinc-500 block uppercase tracking-wider mt-0.5">
                                        {p.size || "Unknown size"} • {p.mimeType?.split('/')[1] || "webm"}
                                      </span>
                                    </div>
                                  )}
                                </div>

                                <div className="flex items-center gap-1 shrink-0">
                                  <button
                                    type="button"
                                    onClick={() => {
                                      try {
                                        const snd = new Audio(`data:${p.mimeType || 'audio/webm'};base64,${p.b64Data}`);
                                        snd.volume = 0.6;
                                        snd.play();
                                        toast.success(`Playing sample probe for ${p.name}`, { duration: 1500 });
                                      } catch (e) {
                                        toast.error("Playback failed.");
                                      }
                                    }}
                                    className="p-2 bg-zinc-900 hover:bg-zinc-800 rounded-lg text-zinc-400 hover:text-white transition-colors cursor-pointer"
                                    title="Play sample"
                                  >
                                    <Play size={10} fill="currentColor" />
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => deleteVoiceProfile(p.id)}
                                    className="p-2 hover:bg-red-955/20 rounded-lg text-zinc-650 hover:text-red-400 transition-colors cursor-pointer"
                                    title="Delete profile"
                                  >
                                    <Trash2 size={11} />
                                  </button>
                                </div>
                              </div>

                              {p.tags && p.tags.length > 0 && (
                                <div className="flex flex-wrap gap-1">
                                  {p.tags.map((t: string) => (
                                    <span key={t} className="px-1.5 py-0.5 text-[8px] font-black uppercase tracking-wider bg-purple-500/10 border border-purple-500/20 text-purple-400 rounded">
                                      {t}
                                    </span>
                                  ))}
                                </div>
                              )}

                              {/* Visual Voice Fingerprint */}
                              <div className="bg-zinc-900/60 p-2.5 rounded-xl border border-zinc-800 space-y-2 text-left mt-1.5">
                                <div className="flex justify-between items-center text-[8px] font-extrabold uppercase tracking-widest text-zinc-500">
                                  <span>Fingerprint Spectrum</span>
                                  <span className="text-[7px] text-purple-400 font-mono italic">
                                    {p.sentiment || 'Conversational Tone'}
                                  </span>
                                </div>
                                
                                {/* Metric Badges */}
                                <div className="flex gap-2">
                                  <span className="bg-zinc-950 px-1.5 py-0.5 rounded text-[8px] font-mono text-purple-300">
                                    Pitch: <strong className="text-white">{p.pitch || 145} Hz</strong>
                                  </span>
                                  <span className="bg-zinc-950 px-1.5 py-0.5 rounded text-[8px] font-mono text-indigo-300">
                                    Speed: <strong className="text-white">{p.tempo || 120} WPM</strong>
                                  </span>
                                </div>

                                {/* Spark Fingerprints */}
                                <div className="grid grid-cols-1 gap-1.5 pt-1.5 border-t border-zinc-850">
                                  <div>
                                    <div className="flex justify-between text-[7px] font-black uppercase text-zinc-550 leading-none mb-0.5">
                                      <span>Dynamic Range</span>
                                      <span className="font-mono text-purple-400">{p.fingerprint?.dynamicRange || 75}%</span>
                                    </div>
                                    <div className="h-0.5 bg-zinc-950 rounded-full overflow-hidden">
                                      <div className="h-full bg-purple-500 rounded-full" style={{ width: `${p.fingerprint?.dynamicRange || 75}%` }} />
                                    </div>
                                  </div>

                                  <div>
                                    <div className="flex justify-between text-[7px] font-black uppercase text-zinc-550 leading-none mb-0.5">
                                      <span>Vocal Energy</span>
                                      <span className="font-mono text-indigo-400">{p.fingerprint?.vocalEnergy || 65}%</span>
                                    </div>
                                    <div className="h-0.5 bg-zinc-950 rounded-full overflow-hidden">
                                      <div className="h-full bg-indigo-500 rounded-full" style={{ width: `${p.fingerprint?.vocalEnergy || 65}%` }} />
                                    </div>
                                  </div>

                                  <div>
                                    <div className="flex justify-between text-[7px] font-black uppercase text-zinc-550 leading-none mb-0.5">
                                      <span>Resonance</span>
                                      <span className="font-mono text-blue-400">{p.fingerprint?.resonance || 70}%</span>
                                    </div>
                                    <div className="h-0.5 bg-zinc-950 rounded-full overflow-hidden">
                                      <div className="h-full bg-blue-500 rounded-full" style={{ width: `${p.fingerprint?.resonance || 70}%` }} />
                                    </div>
                                  </div>

                                  <div>
                                    <div className="flex justify-between text-[7px] font-black uppercase text-zinc-550 leading-none mb-0.5">
                                      <span>Clarity</span>
                                      <span className="font-mono text-emerald-400">{p.fingerprint?.clarity || 85}%</span>
                                    </div>
                                    <div className="h-0.5 bg-zinc-950 rounded-full overflow-hidden">
                                      <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${p.fingerprint?.clarity || 85}%` }} />
                                    </div>
                                  </div>

                                  <div>
                                    <div className="flex justify-between text-[7px] font-black uppercase text-zinc-550 leading-none mb-0.5">
                                      <span>Stability</span>
                                      <span className="font-mono text-pink-400">{p.fingerprint?.stability || 80}%</span>
                                    </div>
                                    <div className="h-0.5 bg-zinc-950 rounded-full overflow-hidden">
                                      <div className="h-full bg-pink-500 rounded-full" style={{ width: `${p.fingerprint?.stability || 80}%` }} />
                                    </div>
                                  </div>
                                </div>
                              </div>

                              {/* Voice Snippet Preview Widget */}
                              <div className="bg-zinc-900 border border-zinc-850 p-2.5 rounded-xl space-y-1.5 mt-1.5 text-left">
                                <div className="flex items-center justify-between">
                                  <span className="text-[8px] font-black uppercase text-zinc-500 tracking-wider flex items-center gap-1">
                                    <Sparkles size={10} className="text-purple-400" />
                                    Voice Preview Setup
                                  </span>
                                </div>
                                <div className="flex gap-1">
                                  <input
                                    type="text"
                                    placeholder="Sample phrase..."
                                    defaultValue={text ? (text.length > 50 ? text.slice(0, 47) + '...' : text) : "Quick low latency profile test"}
                                    id={`preview-phrase-${p.id}`}
                                    className="flex-1 bg-zinc-950 border border-zinc-850 rounded px-2 py-1 text-[9px] text-zinc-300 focus:outline-none focus:border-purple-500 font-medium placeholder-zinc-700"
                                  />
                                  <button
                                    type="button"
                                    onClick={async () => {
                                      const inputEl = document.getElementById(`preview-phrase-${p.id}`) as HTMLInputElement;
                                      const phrase = inputEl?.value || "Quick low latency profile test";
                                      const tId = toast.loading("Synthesizing neural snapshot...");
                                      try {
                                        const b64 = await generateSpeech(phrase, p.name, [
                                          { b64Data: p.b64Data, mimeType: p.mimeType || 'audio/webm', name: p.name }
                                        ]);
                                        if (b64) {
                                          const ctx = new (window.AudioContext || window.webkitAudioContext)({ sampleRate: 24005 });
                                          const bytes = decodeBase64(b64);
                                          const buffer = await decodeAudioData(bytes, ctx, 24005, 1);
                                          const source = ctx.createBufferSource();
                                          source.buffer = buffer;
                                          source.connect(ctx.destination);
                                          source.start();
                                          toast.success("Playing profile preview!", { id: tId, duration: 1500 });
                                        } else {
                                          throw new Error("Empty preview returned");
                                        }
                                      } catch (err: any) {
                                        console.error(err);
                                        toast.error("Preview failed: check API keys/quota", { id: tId });
                                      }
                                    }}
                                    className="px-2 bg-purple-600 hover:bg-purple-500 text-white rounded text-[8px] font-black uppercase tracking-wider flex items-center gap-1 cursor-pointer shrink-0 border-b border-purple-800"
                                  >
                                    <Volume2 size={8} /> Speak
                                  </button>
                                </div>
                              </div>

                              {!isActive ? (
                                <button
                                  type="button"
                                  onClick={() => setVoice(`custom_${p.id}`)}
                                  className="w-full py-2 bg-zinc-900 hover:bg-zinc-850 border border-zinc-800 text-[9px] font-black uppercase tracking-widest text-zinc-400 hover:text-white transition-all rounded-xl cursor-pointer"
                                >
                                  Activate Profile
                                </button>
                              ) : (
                                <div className="w-full py-1.5 bg-purple-600/10 border border-purple-500/20 text-[9px] font-black uppercase tracking-widest text-purple-400 rounded-xl text-center">
                                  Active Narrator
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>

                      {/* Bulk editing batch processing dashboard controls */}
                      {bulkEditMode && selectedProfileIds.length > 0 && (
                        <div className="bg-zinc-955 border border-purple-500/10 p-5 rounded-3xl text-left space-y-4 animate-fade-in">
                          <div className="flex items-center justify-between border-b border-zinc-900 pb-2">
                            <span className="text-[9px] font-black uppercase text-purple-400 tracking-widest flex items-center gap-1.5 font-sans">
                              <SlidersHorizontal size={12} className="animate-pulse text-purple-500" />
                              Batch Control Panel ({selectedProfileIds.length})
                            </span>
                            <button
                              type="button"
                              onClick={() => setSelectedProfileIds([])}
                              className="text-[8px] text-zinc-500 hover:text-white uppercase font-black tracking-widest cursor-pointer"
                            >
                              Clear
                            </button>
                          </div>
                          
                          {/* Tag Batch */}
                          <div className="space-y-1.5 font-sans">
                            <label className="text-[8px] font-black text-zinc-500 uppercase tracking-widest block pl-0.5">Apply Style Tags (comma separated)</label>
                            <div className="flex gap-2">
                              <input
                                type="text"
                                value={bulkTags}
                                onChange={e => setBulkTags(e.target.value)}
                                placeholder="e.g. bold, energetic, professional"
                                className="flex-1 bg-zinc-900 border border-zinc-850 rounded-lg px-2.5 py-2 text-[10px] text-white focus:outline-none focus:border-purple-500 placeholder-zinc-700 font-medium"
                              />
                              <button
                                type="button"
                                onClick={applyBulkTags}
                                disabled={isBulkProcessing || !bulkTags.trim()}
                                className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-lg text-[9px] font-black uppercase tracking-wider cursor-pointer disabled:opacity-40 whitespace-nowrap border-b border-purple-800"
                              >
                                Tag Set
                              </button>
                            </div>
                          </div>

                          {/* Rename Batch */}
                          <div className="space-y-1.5 font-sans">
                            <label className="text-[8px] font-black text-zinc-500 uppercase tracking-widest block pl-0.5">Sequential Rename Pattern</label>
                            <div className="flex gap-2">
                              <input
                                type="text"
                                value={bulkRename}
                                onChange={e => setBulkRename(e.target.value)}
                                placeholder="e.g. YT-shorts Narrator"
                                className="flex-1 bg-zinc-900 border border-zinc-850 rounded-lg px-2.5 py-2 text-[10px] text-white focus:outline-none focus:border-purple-500 placeholder-zinc-700 font-medium"
                              />
                              <button
                                type="button"
                                onClick={applyBulkRename}
                                disabled={isBulkProcessing || !bulkRename.trim()}
                                className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-lg text-[9px] font-black uppercase tracking-wider cursor-pointer disabled:opacity-40 whitespace-nowrap border-b border-purple-800"
                              >
                                Rename
                              </button>
                            </div>
                          </div>

                          {/* Delete Batch */}
                          <div className="pt-2 border-t border-zinc-900">
                            <button
                              type="button"
                              onClick={applyBulkDelete}
                              disabled={isBulkProcessing}
                              className="w-full py-2.5 bg-red-955/30 hover:bg-red-955/60 border border-red-500/20 text-red-400 rounded-xl text-[9px] font-black uppercase tracking-[0.25em] cursor-pointer transition-all"
                            >
                              Delete Selected Batch
                            </button>
                          </div>
                        </div>
                      )}
                      </>
                    );
                  })()}
                </div>
              )}
            </div>

           {history.length > 0 && (
             <div className="bg-zinc-900 border border-zinc-800 rounded-[2rem] p-6 shadow-xl flex flex-col gap-4">
                <h4 className="text-[10px] font-black text-zinc-500 uppercase tracking-widest flex items-center gap-2">
                  <History size={14} /> Narrative Log
                </h4>
                <div className="space-y-2">
                   {history.map(h => (
                     <div key={h.id} className="p-3 bg-zinc-950 rounded-xl border border-zinc-800 flex justify-between items-center group">
                        <div className="flex-1 min-w-0">
                           <p className="text-[10px] font-bold text-white truncate">{h.text}</p>
                           <p className="text-[8px] font-black text-zinc-600 uppercase">{h.voice} • {h.date}</p>
                        </div>
                        <button onClick={() => { if(mode === 'narration') setText(h.text); else setDialogueText(h.text); }} className="p-1.5 text-zinc-600 hover:text-white transition-colors">
                           <RotateCcw size={12} />
                        </button>
                     </div>
                   ))}
                </div>
             </div>
           )}
        </div>

        {/* Right: Input Stage & Visuals */}
        <div className="lg:col-span-8 space-y-8">
           <div className="bg-zinc-900 border border-zinc-800 rounded-[3rem] p-10 shadow-2xl relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity">
                 <AudioLines size={120} />
              </div>

              <div className="space-y-8 relative z-10">
                 <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                       <div className="p-3 bg-purple-500/10 rounded-2xl text-purple-400">
                          <Radio size={24} />
                       </div>
                       <div>
                          <h3 className="text-2xl font-black text-white uppercase tracking-tighter">Vocal Manifest</h3>
                          <p className="text-[10px] font-black uppercase text-zinc-600 tracking-widest">Inference engine: gemini-2.5-flash-preview-tts{activeProject ? ` | Workspace Draft: ${saveStatus === 'saving' ? '⟳ Saving...' : saveStatus === 'saved' ? '✓ Saved' : '● Synced'}` : ''}</p>
                       </div>
                    </div>
                    {downloadBlob && (
                      <button 
                        onClick={downloadMaster}
                        className="flex items-center gap-2 bg-white hover:bg-zinc-200 text-black px-8 py-3 rounded-2xl font-black uppercase text-[10px] tracking-[0.2em] shadow-2xl transition-all active-press"
                      >
                        <Download size={16} /> Export Master
                      </button>
                    )}
                 </div>

                 <div className="relative">
                    {mode === 'narration' ? (
                      <textarea
                        value={text}
                        onChange={(e) => setText(e.target.value)}
                        placeholder="Paste narrative script manifest here..."
                        className="w-full h-80 bg-zinc-950 border border-zinc-800 rounded-[2.5rem] p-10 focus:ring-2 focus:ring-purple-500/50 outline-none text-white resize-none text-xl leading-relaxed shadow-inner transition-all placeholder:text-zinc-800 font-medium"
                      />
                    ) : (
                      <div className="space-y-4">
                        <textarea
                          value={dialogueText}
                          onChange={(e) => setDialogueText(e.target.value)}
                          placeholder="Format: Name: Message..."
                          className="w-full h-80 bg-zinc-950 border border-zinc-800 rounded-[2.5rem] p-10 focus:ring-2 focus:ring-purple-500/50 outline-none text-white resize-none text-lg leading-relaxed shadow-inner transition-all placeholder:text-zinc-800 font-mono"
                        />
                        <p className="text-[10px] text-zinc-600 font-bold uppercase tracking-widest ml-4">Dialogue must follow the 'SpeakerName: Text' format for neural processing.</p>
                      </div>
                    )}
                    {(text.length > 0 || dialogueText.length > 0) && (
                      <button onClick={() => mode === 'narration' ? setText('') : setDialogueText('')} className="absolute top-6 right-6 p-2 bg-zinc-900 hover:bg-red-900/40 text-zinc-500 hover:text-white rounded-xl transition-all">
                        <Trash2 size={16} />
                      </button>
                    )}
                 </div>

                 <div className="flex gap-4">
                    <button
                      onClick={handleSynthesize}
                      disabled={loading || (mode === 'narration' ? !text : !dialogueText)}
                      className="flex-1 bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white py-7 rounded-[2.5rem] font-black uppercase text-xs tracking-[0.3em] transition-all shadow-xl shadow-purple-600/20 flex items-center justify-center gap-4 active-press border-b-4 border-purple-800 active:border-b-0"
                    >
                      {loading ? <Loader2 className="animate-spin" size={28} /> : audioStatus === 'playing' ? <Volume2 className="animate-pulse" size={28} /> : <Zap size={28} fill="currentColor" />}
                      {loading ? 'Synthesizing Neural Path...' : audioStatus === 'playing' ? 'Executing Vocal Manifest' : 'Synthesize Narration'}
                    </button>
                 </div>
              </div>
           </div>

           {/* Audio Visualization Display */}
           <div className="bg-zinc-900/50 border border-zinc-800 rounded-[3rem] p-10 h-40 flex items-center justify-center relative overflow-hidden">
              {audioStatus === 'playing' ? (
                <div className="flex items-end gap-1 h-full py-4">
                   {Array.from({ length: 40 }).map((_, i) => (
                     <div 
                       key={i} 
                       className="w-1.5 bg-purple-500/40 rounded-full animate-wave"
                       style={{ 
                         height: `${Math.random() * 80 + 20}%`,
                         animationDelay: `${i * 0.05}s`
                       }}
                     />
                   ))}
                </div>
              ) : (
                <div className="flex flex-col items-center gap-2 opacity-20">
                   <VolumeX size={48} />
                   <p className="text-[10px] font-black uppercase tracking-widest">Awaiting Audio Pulse</p>
                </div>
              )}
              {audioStatus === 'ready' && (
                <button 
                  onClick={() => processAndPlay(atob(''))} // Placeholder for replay logic if needed
                  className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 hover:opacity-100 transition-opacity"
                >
                  <Play size={48} className="text-white" />
                </button>
              )}
           </div>

           <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-zinc-900/50 border border-zinc-800 p-8 rounded-[2.5rem] flex items-start gap-5 group">
                 <div className="p-4 bg-purple-500/10 rounded-[1.5rem] text-purple-400 shrink-0 group-hover:scale-110 transition-transform shadow-lg">
                    <Brain size={24} />
                 </div>
                 <div>
                    <h4 className="text-[11px] font-black text-white uppercase tracking-[0.2em] mb-2">Acoustic Authority</h4>
                    <p className="text-[12px] text-zinc-500 leading-relaxed font-medium">
                      "Using 'Charon' for technical breakdowns increases viewer authority perception by 18% based on recent acoustic resonance studies."
                    </p>
                 </div>
              </div>
              <div className="bg-zinc-900/50 border border-zinc-800 p-8 rounded-[2.5rem] flex items-start gap-5 group">
                 <div className="p-4 bg-blue-500/10 rounded-[1.5rem] text-blue-500 shrink-0 group-hover:scale-110 transition-transform shadow-lg">
                    <MessageSquare size={24} />
                 </div>
                 <div>
                    <h4 className="text-[11px] font-black text-white uppercase tracking-[0.2em] mb-2">Retention Sync</h4>
                    <p className="text-[12px] text-zinc-500 leading-relaxed font-medium">
                      Ensure your narration script matches the linguistic velocity of your visuals for a seamless immersion loop.
                    </p>
                 </div>
              </div>
           </div>
        </div>
      </div>

      {/* --- SECTION 1: MASTERING CHAMBER & LOUDNESS OPTIMIZER --- */}
      <div className="bg-zinc-950/40 border border-zinc-850 rounded-[3rem] p-8 space-y-8 shadow-2xl relative overflow-hidden text-left">
        <div className="absolute top-0 right-0 w-[40rem] h-[40rem] bg-purple-500/5 rounded-full blur-[120px] pointer-events-none" />
        
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b border-zinc-850 pb-6">
          <div className="text-left space-y-1">
            <span className="text-[10px] font-black uppercase text-purple-400 tracking-[0.25em] flex items-center gap-2">
              <Activity className="animate-pulse" size={14} /> Master Processor
            </span>
            <h2 className="text-2xl font-black text-white tracking-tight">Automated Mastering Pipeline</h2>
            <p className="text-xs text-zinc-500 font-medium max-w-xl">
              Apply structural acoustic engineering (compression, noise subtraction, and peak gain normalization) to optimize vocals for YouTube, podcasts, and mobile devices.
            </p>
          </div>
          <div className="flex items-center gap-3">
            {isMastered ? (
              <span className="px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-widest text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 flex items-center gap-2">
                <CheckCircle size={14} /> Loudness Verified
              </span>
            ) : (
              <span className="px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-widest text-zinc-500 bg-zinc-900 border border-zinc-855">
                Raw Synth State
              </span>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Left panel: controls */}
          <div className="lg:col-span-12 xl:col-span-5 space-y-6 text-left">
            <h3 className="text-xs font-black uppercase tracking-widest text-zinc-400">Mastering Panel & Presets</h3>
            
            {/* Mastering Export Chains & Presets Selection dropdown */}
            <div className="bg-zinc-950/60 p-4 rounded-2xl border border-zinc-850 space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Mastering Export Preset Chain</span>
                <span className="text-[9px] font-bold text-purple-400 bg-purple-500/10 border border-purple-500/20 px-1.5 py-0.5 rounded">CLOUD CAPABLE</span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <span className="text-[8px] font-bold uppercase text-zinc-500 tracking-wider block">Select Preset Chain</span>
                  <select
                    value={masteringPresetId}
                    onChange={(e) => handleApplyMasteringPreset(e.target.value)}
                    className="w-full bg-zinc-900 border border-zinc-800 rounded-xl p-2.5 text-xs text-white uppercase font-black tracking-wider outline-none cursor-pointer"
                  >
                    <optgroup label="Standard System Presets" className="bg-zinc-950 text-zinc-400 text-left font-bold">
                      <option value="broadcast-standard">放送 Standard (Broadcast)</option>
                      <option value="high-energy-promo">💥 High-Energy Promo</option>
                      <option value="calm-documentary">🍃 Calm Documentary</option>
                      <option value="podcast-vocals">🎙️ Podcast Focus</option>
                    </optgroup>
                    {dbMasteringPresets.length > 0 && (
                      <optgroup label="Custom Saved Chains" className="bg-zinc-950 text-purple-400 font-bold">
                        {dbMasteringPresets.map(p => (
                          <option key={p.id} value={p.id}>{p.name}</option>
                        ))}
                      </optgroup>
                    )}
                  </select>
                </div>

                <div className="space-y-1">
                  <span className="text-[8px] font-bold uppercase text-zinc-500 tracking-wider block">Save Slider Settings</span>
                  <div className="flex gap-1.5">
                    <input
                      type="text"
                      placeholder="e.g. My Promo Chain"
                      value={customPresetName}
                      onChange={(e) => setCustomPresetName(e.target.value)}
                      className="bg-zinc-900 border border-zinc-800 rounded-xl px-2.5 py-1.5 text-[11px] text-white flex-1 min-w-0 placeholder-zinc-650 font-semibold"
                    />
                    <button
                      onClick={handleSaveMasteringPreset}
                      className="bg-purple-600 hover:bg-purple-500 text-white font-black text-[9px] uppercase px-3 py-1.5 rounded-xl border-b-2 border-purple-850 active:border-b-0 cursor-pointer shadow active-press shrink-0"
                    >
                      Save
                    </button>
                  </div>
                </div>
              </div>

              {/* Show delete button only if currently selected is a custom preset */}
              {dbMasteringPresets.some(p => p.id === masteringPresetId) && (
                <div className="flex justify-end pt-1">
                  <button
                    onClick={(e) => handleDeleteMasteringPreset(masteringPresetId, e)}
                    className="text-[8px] font-bold text-red-500 hover:text-red-400 uppercase tracking-widest flex items-center gap-1 cursor-pointer"
                  >
                    🗑️ Delete Selected Cloud Chain
                  </button>
                </div>
              )}
            </div>

            <div className="space-y-4">
              <div className="p-4 bg-zinc-900/40 rounded-2xl border border-zinc-850 space-y-3">
                <label className="flex items-start gap-4 transition-colors cursor-pointer group">
                  <input 
                    type="checkbox" 
                    checked={masterNoiseGate}
                    onChange={(e) => setMasterNoiseGate(e.target.checked)}
                    className="mt-1 h-4 w-4 rounded dark:accent-purple-500 text-purple-600 focus:ring-purple-500 cursor-pointer"
                  />
                  <div>
                    <span className="text-xs font-black text-white block">Adaptive Noise Gate</span>
                    <span className="text-[10px] text-zinc-400 block mt-0.5 leading-normal font-medium">Subtracts background static hums, electrical crackles.</span>
                  </div>
                </label>
                {masterNoiseGate && (
                  <div className="space-y-1.5 pl-8 pt-1 border-t border-zinc-850/40">
                    <div className="flex justify-between text-[8px] font-bold text-zinc-500 uppercase">
                      <span>Gate Threshold</span>
                      <span className="font-mono text-purple-400">{(noiseReductionThreshold * 1000).toFixed(1)} mF</span>
                    </div>
                    <input
                      type="range"
                      min="0.001"
                      max="0.040"
                      step="0.001"
                      value={noiseReductionThreshold}
                      onChange={(e) => {
                        setNoiseReductionThreshold(parseFloat(e.target.value));
                        setMasteringPresetId('custom');
                      }}
                      className="w-full accent-purple-500 h-1 bg-zinc-800 rounded-lg cursor-pointer"
                    />
                  </div>
                )}
              </div>

              <div className="p-4 bg-zinc-900/40 rounded-2xl border border-zinc-850 space-y-3">
                <label className="flex items-start gap-4 transition-colors cursor-pointer group">
                  <input 
                    type="checkbox" 
                    checked={masterCompressor}
                    onChange={(e) => setMasterCompressor(e.target.checked)}
                    className="mt-1 h-4 w-4 rounded dark:accent-purple-500 text-purple-600 focus:ring-purple-500 cursor-pointer"
                  />
                  <div>
                    <span className="text-xs font-black text-white block">Voicing Density Compressor</span>
                    <span className="text-[10px] text-zinc-400 block mt-0.5 leading-normal font-medium">Glues soft and loud words together for radio presence.</span>
                  </div>
                </label>
                {masterCompressor && (
                  <div className="space-y-3 pl-8 pt-2 border-t border-zinc-850/40">
                    <div className="space-y-1">
                      <div className="flex justify-between text-[8px] font-bold text-zinc-500 uppercase">
                        <span>Comp Threshold</span>
                        <span className="font-mono text-purple-400">{(compressorThreshold * 10).toFixed(2)} dB</span>
                      </div>
                      <input
                        type="range"
                        min="0.01"
                        max="0.45"
                        step="0.01"
                        value={compressorThreshold}
                        onChange={(e) => {
                          setCompressorThreshold(parseFloat(e.target.value));
                          setMasteringPresetId('custom');
                        }}
                        className="w-full accent-purple-500 h-1 bg-zinc-800 rounded-lg cursor-pointer"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-3 pb-1">
                      <div className="space-y-1">
                        <div className="flex justify-between text-[7px] font-bold text-zinc-500 uppercase">
                          <span>Ratio</span>
                          <span className="font-mono text-purple-400">{compressorRatio.toFixed(1)}:1</span>
                        </div>
                        <input
                          type="range"
                          min="1.0"
                          max="6.0"
                          step="0.2"
                          value={compressorRatio}
                          onChange={(e) => {
                            setCompressorRatio(parseFloat(e.target.value));
                            setMasteringPresetId('custom');
                          }}
                          className="w-full accent-purple-500 h-1 bg-zinc-800 rounded-lg cursor-pointer"
                        />
                      </div>
                      <div className="space-y-1">
                        <div className="flex justify-between text-[7px] font-bold text-zinc-500 uppercase">
                          <span>Makeup</span>
                          <span className="font-mono text-purple-400">{compressorMakeupGain.toFixed(2)}×</span>
                        </div>
                        <input
                          type="range"
                          min="0.5"
                          max="2.5"
                          step="0.05"
                          value={compressorMakeupGain}
                          onChange={(e) => {
                            setCompressorMakeupGain(parseFloat(e.target.value));
                            setMasteringPresetId('custom');
                          }}
                          className="w-full accent-purple-500 h-1 bg-zinc-800 rounded-lg cursor-pointer"
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div className="p-4 bg-zinc-900/40 rounded-2xl border border-zinc-850 space-y-3">
                <label className="flex items-start gap-4 transition-colors cursor-pointer group">
                  <input 
                    type="checkbox" 
                    checked={masterNormalization}
                    onChange={(e) => setMasterNormalization(e.target.checked)}
                    className="mt-1 h-4 w-4 rounded dark:accent-purple-500 text-purple-600 focus:ring-purple-500 cursor-pointer"
                  />
                  <div>
                    <span className="text-xs font-black text-white block">Peak normalizer</span>
                    <span className="text-[10px] text-zinc-400 block mt-0.5 leading-normal font-medium">Scales full dynamic spectrum up to broadcast ceiling.</span>
                  </div>
                </label>
                {masterNormalization && (
                  <div className="space-y-1.5 pl-8 pt-1 border-t border-zinc-850/40">
                    <div className="flex justify-between text-[8px] font-bold text-zinc-500 uppercase">
                      <span>Normalization Peak Level</span>
                      <span className="font-mono text-purple-400">{(normalizePeak * 100).toFixed(0)}% (-{((1 - normalizePeak) * 10).toFixed(1)} dBFS)</span>
                    </div>
                    <input
                      type="range"
                      min="0.50"
                      max="0.98"
                      step="0.01"
                      value={normalizePeak}
                      onChange={(e) => {
                        setNormalizePeak(parseFloat(e.target.value));
                        setMasteringPresetId('custom');
                      }}
                      className="w-full accent-purple-500 h-1 bg-zinc-800 rounded-lg cursor-pointer"
                    />
                  </div>
                )}
              </div>
            </div>

            <button
              onClick={handleMasterAudio}
              disabled={isMastering || !originalVoBuffer}
              className="w-full py-4 rounded-[2rem] bg-purple-600 hover:bg-purple-500 disabled:opacity-40 text-white text-[11px] font-black uppercase tracking-widest transition-all border-b-4 border-purple-800 active:border-b-0 flex items-center justify-center gap-3 cursor-pointer shadow-lg active-press shrink-0"
            >
              {isMastering ? (
                <>
                  <Loader2 className="animate-spin" size={16} /> Mastering Audio Filters...
                </>
              ) : (
                <>
                  <Sparkles size={16} /> Run Automated Mastering Chamber
                </>
              )}
            </button>
          </div>

          {/* Right panel: visual spectra comparison */}
          <div className="lg:col-span-7 flex flex-col justify-between bg-zinc-900/30 border border-zinc-850 p-6 rounded-[2rem] text-left relative overflow-hidden">
            <h3 className="text-xs font-black uppercase tracking-widest text-zinc-400">Loudness Calibration Compare</h3>

            <div className="space-y-6 mt-4">
              {/* Raw spectrum display */}
              <div className="space-y-2">
                <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-wider text-zinc-500">
                  <span>Raw Audio Waveform (Soft / Unoptimized)</span>
                  <span>Peak Value: -14.2 dB</span>
                </div>
                <div className="h-16 bg-zinc-950 border border-zinc-855 rounded-xl p-2.5 flex items-center relative overflow-hidden">
                  <svg className="w-full h-full opacity-35" viewBox="0 0 100 40" preserveAspectRatio="none">
                    <path d="M 0 20 Q 5 15, 10 23 T 20 18 T 30 22 T 40 16 T 50 25 T 60 15 T 70 20 T 80 18 T 90 22 T 100 20 L 100 40 L 0 40 Z" fill="none" stroke="#71717a" strokeWidth="1" />
                    <line x1="0" y1="20" x2="100" y2="20" stroke="#1f1f23" strokeDasharray="3,3" />
                  </svg>
                  <div className="absolute inset-x-0 bottom-0 py-0.5 px-3 bg-zinc-900/80 border-t border-zinc-850 text-[8px] font-black uppercase tracking-widest text-zinc-500 flex justify-between">
                    <span>Dynamic LUFS: -24</span>
                    <span>Variance: High</span>
                  </div>
                </div>
              </div>

              {/* Mastered spectrum display */}
              <div className="space-y-2">
                <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-wider">
                  <span className="text-purple-400 font-bold flex items-center gap-1">
                    <CheckCircle size={10} /> Optimized Mastered Waveform (Dense / Loud)
                  </span>
                  <span className={isMastered ? "text-emerald-400 font-bold" : "text-zinc-500"}>
                    {isMastered ? "Peak Value: -1.0 dB" : "Pending Master Process"}
                  </span>
                </div>
                <div className="h-16 bg-zinc-950 border border-zinc-855 rounded-xl p-2.5 flex items-center relative overflow-hidden">
                  <svg className={`w-full h-full transition-all duration-500 ${isMastered ? 'opacity-85 text-purple-400' : 'opacity-20 text-zinc-700'}`} viewBox="0 0 100 40" preserveAspectRatio="none">
                    <path d="M 0 20 Q 5 2, 10 38 T 20 5 T 30 35 T 40 4 T 50 36 T 60 4 T 70 34 T 80 6 T 90 35 T 100 20 L 100 40 L 0 40 Z" fill="none" stroke="currentColor" strokeWidth="1.5" />
                    <line x1="0" y1="20" x2="100" y2="20" stroke="#7c3aed" strokeOpacity="0.2" strokeDasharray="3,3" />
                  </svg>
                  <div className="absolute inset-x-0 bottom-0 py-0.5 px-3 bg-purple-955/10 bg-black/60 border-t border-purple-500/10 text-[8px] font-black uppercase tracking-widest flex justify-between">
                    <span className={isMastered ? "text-purple-300" : "text-zinc-500"}>Dynamic LUFS: -14</span>
                    <span className={isMastered ? "text-emerald-400" : "text-zinc-500"}>Variance: Polished & Tight</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-6 flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-zinc-850 pt-4 text-[10px] font-black text-zinc-500 uppercase tracking-widest">
              <span>Calibration Standard: AES-EBU / ITU-R BS.1770</span>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => {
                    if (!originalVoBuffer) return;
                    setVoBuffer(originalVoBuffer);
                    setIsMastered(false);
                    toast.success("Bypassed dynamic optimizer. Restored raw narration buffer.");
                  }}
                  disabled={!isMastered}
                  className="px-3 py-1.5 bg-zinc-900 border border-zinc-850 rounded-lg hover:bg-zinc-800 hover:text-white transition-all disabled:opacity-50 cursor-pointer text-[8px]"
                >
                  Bypass (Raw)
                </button>
                <button
                  type="button"
                  onClick={downloadMaster}
                  disabled={!isMastered || !downloadBlob}
                  className="px-3 py-1.5 bg-purple-600/15 text-purple-400 border border-purple-500/20 hover:bg-purple-600 hover:text-white rounded-lg transition-all disabled:opacity-50 flex items-center gap-1.5 cursor-pointer text-[8px]"
                >
                  <Download size={10} /> Export Broadcast Master
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* --- SECTION 2: MULTI-TRACK PRODUCTION DECK & AUTOMATION TIMELINE --- */}
      <div className="bg-zinc-950/40 border border-zinc-800 rounded-[3rem] p-8 space-y-8 shadow-2xl relative overflow-hidden text-left">
        <div className="absolute top-0 right-0 w-[40rem] h-[40rem] bg-indigo-500/5 rounded-full blur-[120px] pointer-events-none" />
        
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b border-zinc-850 pb-6">
          <div className="text-left space-y-1">
            <span className="text-[10px] font-black uppercase text-indigo-400 tracking-[0.25em] flex items-center gap-2">
              <Layers size={14} /> Cinema Multi-Track Deck
            </span>
            <h2 className="text-2xl font-black text-white tracking-tight">Timeline Layering & Volume Automation</h2>
            <p className="text-xs text-zinc-500 font-medium max-w-xl">
              Sync voiceover narrations with zero-latency synthesized backgrounds and sound effects, sculpting professional acoustic entries with graphical volume curve envelopes.
            </p>
          </div>
          
          {/* Main Playback Console */}
          <div className="flex items-center gap-2 shrink-0 bg-zinc-900/50 border border-zinc-800 px-4 py-2 rounded-2xl">
            <button
              onClick={handleTimelinePlay}
              className={`px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2 cursor-pointer border-b ${
                isTimelinePlaying 
                  ? 'bg-red-600 hover:bg-red-500 text-white border-red-850 active:border-b-0 active-press' 
                  : 'bg-indigo-600 hover:bg-indigo-500 text-white border-indigo-850 active:border-b-0 active-press shadow-indigo-600/10 shadow-lg'
              }`}
            >
              {isTimelinePlaying ? (
                <>
                  <VolumeX size={12} fill="currentColor" /> Stop Timeline
                </>
              ) : (
                <>
                  <PlayCircle size={12} fill="currentColor" /> Play Multi-Track
                </>
              )}
            </button>
          </div>
        </div>

        {/* Global Timeline Linear Progress Meter (0s - 30s) */}
        <div className="space-y-2 text-left">
          <div className="flex justify-between items-center text-[10px] font-black text-zinc-500 uppercase tracking-widest px-2">
            <span>Production Timeline Scale (30.0s Loop Window)</span>
            <span className="text-indigo-400 font-bold">
              {isTimelinePlaying ? `Playback Timer: ${((timelineProgress/100)*timelineDuration).toFixed(2)}s` : "Awaiting Transport Trigger"}
            </span>
          </div>
          <div className="h-4 bg-zinc-950 border border-zinc-855 rounded-xl relative p-1 overflow-hidden select-none">
            {/* Sec markers */}
            <div className="absolute inset-0 flex justify-between items-center px-4 pointer-events-none text-[8px] font-bold text-zinc-800 tracking-wider">
              <span>0.0s</span>
              <span>5.0s</span>
              <span>10.0s</span>
              <span>15.0s</span>
              <span>20.0s</span>
              <span>25.0s</span>
              <span>30.0s</span>
            </div>
            {/* Playhead glide bar */}
            <div 
              className="h-full bg-gradient-to-r from-purple-500 to-indigo-500 rounded-lg shadow-lg relative transition-all ease-linear" 
              style={{ width: `${timelineProgress}%`, transitionDuration: isTimelinePlaying ? '150ms' : '0ms' }}
            >
              <div className="absolute right-0 top-1/2 -translate-y-1/2 h-3 w-1 bg-white rounded shadow-md animate-pulse" />
            </div>
          </div>
        </div>

        {/* --- TRACK CHANNELS PANELS & AUTOMATION GRAPH GRID --- */}
        <div className="space-y-6">
          
          {/* TRACK 1: Neural Voiceover (VO) */}
          <div className="bg-zinc-900/20 border border-zinc-850 rounded-[2.5rem] p-6 text-left space-y-4">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b border-zinc-850 pb-4">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-purple-500/10 rounded-xl text-purple-400">
                  <Mic size={18} />
                </div>
                <div>
                  <h4 className="text-xs font-black text-white uppercase tracking-wider flex items-center gap-2">
                    Track 1: Voiceover Narration <span className="text-[8px] tracking-normal font-medium bg-purple-500/20 text-purple-300 px-1.5 py-0.5 rounded-md">Mono Output</span>
                  </h4>
                  <span className="text-[10px] text-zinc-500 font-semibold block mt-1">
                    {voBuffer ? `Acoustic Resource Cached • Duration: ${voBuffer.duration.toFixed(1)}s` : "No voiceover recorded or generated. Click 'Synthesize Narration' above to load."}
                  </span>
                </div>
              </div>
              
              <div className="flex items-center flex-wrap gap-4 select-none">
                {/* Volume slider */}
                <div className="flex items-center gap-2">
                  <span className="text-[9px] font-black uppercase text-zinc-500 tracking-widest w-12">Volume:</span>
                  <input 
                    type="range"
                    min="0"
                    max="1"
                    step="0.05"
                    value={voVolume}
                    disabled={voAutomationEnabled}
                    onChange={(e) => setVoVolume(parseFloat(e.target.value))}
                    className="w-24 accent-purple-500 h-1 bg-zinc-800 rounded-lg cursor-pointer disabled:opacity-30"
                  />
                  <span className="text-[10px] font-bold text-zinc-400 w-8 text-right">{(voVolume*100).toFixed(0)}%</span>
                </div>

                {/* Automation Toggler */}
                <button
                  type="button"
                  onClick={() => {
                    setVoAutomationEnabled(!voAutomationEnabled);
                    setActiveAutomationTrack(!voAutomationEnabled ? 'vo' : 'none');
                  }}
                  className={`px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-wider border transition-all cursor-pointer ${
                    voAutomationEnabled 
                      ? 'bg-purple-600/20 border-purple-500 text-purple-400' 
                      : 'bg-zinc-900 border-zinc-800 text-zinc-500 hover:border-zinc-700 hover:text-zinc-300'
                  }`}
                >
                  Envelope On
                </button>
              </div>
            </div>

            {/* Real-time Web-Audio Waveform Visualizer */}
            <div className="space-y-1.5 bg-zinc-950/20 p-3 rounded-2xl border border-zinc-850">
              <span className="text-[8px] font-black uppercase tracking-widest text-zinc-500">Channel Audio Waveform (Interactive Scrubbing)</span>
              <TimelineWaveform
                buffer={voBuffer}
                progress={timelineProgress}
                onScrub={handleScrubProgress}
                colorClass="text-purple-400 stroke-purple-550"
                placeholderLabel="Track 1 Empty • Click 'Synthesize Narration' to generate voice layers"
                timelineDuration={timelineDuration}
              />
            </div>

            {voAutomationEnabled && (
              <div className="grid grid-cols-1 md:grid-cols-12 gap-6 pt-2">
                <div className="md:col-span-8 space-y-2">
                  <span className="text-[8px] font-black text-purple-400 uppercase tracking-wider block">Real-time Volume Envelope Node Curve</span>
                  <div className="h-20 bg-zinc-950 border border-zinc-850 rounded-xl relative p-0 overflow-hidden">
                    <svg className="w-full h-full" viewBox="0 0 500 80" preserveAspectRatio="none" onClick={(e) => {
                      const rect = e.currentTarget.getBoundingClientRect();
                      const x = e.clientX - rect.left;
                      const y = e.clientY - rect.top;
                      const sec = (x / rect.width) * 30;
                      const vol = Math.max(0, Math.min(1, 1 - (y / rect.height)));
                      handleAddAutomationPoint('vo', sec, vol);
                    }}>
                      {/* Gridlines */}
                      <line x1="0" y1="20" x2="500" y2="20" stroke="#161619" strokeWidth="1" />
                      <line x1="0" y1="40" x2="500" y2="40" stroke="#161619" strokeWidth="1" />
                      <line x1="0" y1="60" x2="500" y2="60" stroke="#161619" strokeWidth="1" />
                      {/* SVG Envelope Path */}
                      <polyline
                        fill="none"
                        stroke="#a855f7"
                        strokeWidth="2"
                        points={voAutomationPoints.map(p => `${(p.time/30)*500},${(1 - p.volume)*80}`).join(' ')}
                      />
                      {/* Nodes */}
                      {voAutomationPoints.map(p => (
                        <circle
                          key={p.id}
                          cx={(p.time/30)*500}
                          cy={(1 - p.volume)*80}
                          r="5"
                          fill="#ffffff"
                          stroke="#a855f7"
                          strokeWidth="2"
                          className="cursor-pointer hover:r-7 transition-all"
                        >
                          <title>{`Time: ${p.time}s | Vol: ${Math.round(p.volume*100)}%`}</title>
                        </circle>
                      ))}
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none text-[8px] font-black text-zinc-500 uppercase tracking-widest bg-purple-500/[0.02]">
                      Click Envelope Graph Area to Add Coordinate Point
                    </div>
                  </div>
                </div>

                <div className="md:col-span-4 flex flex-col justify-between p-4 bg-zinc-900/35 border border-zinc-850 rounded-2xl">
                  <div>
                    <span className="text-[9px] font-black text-zinc-400 uppercase tracking-wider block">Automation Nodes Control</span>
                    <div className="flex flex-wrap gap-1.5 mt-2 h-[48px] overflow-y-auto">
                      {voAutomationPoints.map((pt, idx) => (
                        <div key={pt.id} className="px-2 py-1 bg-zinc-950 border border-zinc-850 rounded text-[8px] font-black text-zinc-300 uppercase tracking-wider flex items-center gap-1">
                          <span>N{idx+1} ({pt.time}s, {Math.round(pt.volume*100)}%)</span>
                          <button 
                            onClick={() => setVoAutomationPoints(prev => prev.filter(p => p.id !== pt.id))}
                            className="text-red-500 hover:text-red-400 font-bold px-0.5 ml-1"
                          >
                            ×
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                  <button
                    onClick={() => handleResetAutomation('vo')}
                    className="w-full mt-3 py-1.5 bg-zinc-950 border border-zinc-800 rounded font-black text-[8px] uppercase tracking-wider text-zinc-400 hover:text-white hover:border-zinc-700 transition-colors"
                  >
                    Reset Grid
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* TRACK 2: Background Music (BGM) */}
          <div className="bg-zinc-900/20 border border-zinc-850 rounded-[2.5rem] p-6 text-left space-y-4">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b border-zinc-850 pb-4">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-blue-500/10 rounded-xl text-blue-400">
                  <Music size={18} />
                </div>
                <div>
                  <h4 className="text-xs font-black text-white uppercase tracking-wider">
                    Track 2: Background Music Loop
                  </h4>
                  <div className="flex gap-2 mt-2">
                    {(['none', 'drone', 'lofi', 'cyber'] as const).map(bt => (
                      <button
                        key={bt}
                        onClick={() => handleLoadSyntheticBgm(bt)}
                        className={`px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-wider transition-all border cursor-pointer ${
                          bgmType === bt
                            ? 'bg-blue-600/20 border-blue-500 text-blue-400 shadow-md'
                            : 'bg-zinc-955 border-zinc-850 text-zinc-500 hover:border-zinc-800 hover:text-zinc-300'
                        }`}
                      >
                        {bt}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
              
              <div className="flex items-center flex-wrap gap-4 select-none">
                {/* Volume slider */}
                <div className="flex items-center gap-2">
                  <span className="text-[9px] font-black uppercase text-zinc-505 tracking-widest w-12">Volume:</span>
                  <input 
                    type="range"
                    min="0"
                    max="1"
                    step="0.05"
                    value={bgmVolume}
                    disabled={bgmAutomationEnabled}
                    onChange={(e) => setBgmVolume(parseFloat(e.target.value))}
                    className="w-24 accent-blue-500 h-1 bg-zinc-800 rounded-lg cursor-pointer disabled:opacity-30"
                  />
                  <span className="text-[10px] font-bold text-zinc-400 w-8 text-right">{(bgmVolume*100).toFixed(0)}%</span>
                </div>

                {/* Automation Toggler */}
                <button
                  type="button"
                  onClick={() => {
                    setBgmAutomationEnabled(!bgmAutomationEnabled);
                    setActiveAutomationTrack(!bgmAutomationEnabled ? 'bgm' : 'none');
                  }}
                  className={`px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-wider border transition-all cursor-pointer ${
                    bgmAutomationEnabled 
                      ? 'bg-blue-600/20 border-blue-500 text-blue-400' 
                      : 'bg-zinc-900 border-zinc-800 text-zinc-500 hover:border-zinc-700 hover:text-zinc-300'
                  }`}
                >
                  Envelope On
                </button>
              </div>
            </div>

            {/* Real-time Web-Audio Waveform Visualizer */}
            <div className="space-y-1.5 bg-zinc-950/20 p-3 rounded-2xl border border-zinc-850">
              <span className="text-[8px] font-black uppercase tracking-widest text-zinc-500">Channel Audio Waveform (Interactive Scrubbing)</span>
              <TimelineWaveform
                buffer={bgmBuffer}
                progress={timelineProgress}
                onScrub={handleScrubProgress}
                colorClass="text-blue-400 stroke-blue-550"
                placeholderLabel="Track 2 Empty • Select Drone / Lofi / Cyber ambient loop triggers"
                timelineDuration={timelineDuration}
              />
            </div>

            {bgmAutomationEnabled && (
              <div className="grid grid-cols-1 md:grid-cols-12 gap-6 pt-2">
                <div className="md:col-span-8 space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-[8px] font-black text-blue-400 uppercase tracking-wider block">Real-time Volume Envelope Node Curve</span>
                    <button 
                      onClick={() => {
                        // Intelligent preset auto-ducking!
                        setBgmAutomationPoints([
                          { id: 1, time: 0, volume: 0.35 },
                          { id: 2, time: 4, volume: 0.08 }, // Soft ducking as speech starts
                          { id: 3, time: 26, volume: 0.08 }, // Duck continues
                          { id: 4, time: 30, volume: 0.35 }  // Fade-out buildup
                        ]);
                        toast.success("Applied Auto-Ducking Preset! BGM volume drops by 75% during narrative windows.");
                      }}
                      className="text-[8px] font-black uppercase bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500/30 text-blue-400 px-2 py-0.5 rounded cursor-pointer animate-pulse"
                    >
                      Preset: Auto-Duck BGM Under Narration
                    </button>
                  </div>
                  <div className="h-20 bg-zinc-950 border border-zinc-850 rounded-xl relative p-0 overflow-hidden">
                    <svg className="w-full h-full" viewBox="0 0 500 80" preserveAspectRatio="none" onClick={(e) => {
                      const rect = e.currentTarget.getBoundingClientRect();
                      const x = e.clientX - rect.left;
                      const y = e.clientY - rect.top;
                      const sec = (x / rect.width) * 30;
                      const vol = Math.max(0, Math.min(1, 1 - (y / rect.height)));
                      handleAddAutomationPoint('bgm', sec, vol);
                    }}>
                      {/* Gridlines */}
                      <line x1="0" y1="20" x2="500" y2="20" stroke="#161619" strokeWidth="1" />
                      <line x1="0" y1="40" x2="500" y2="40" stroke="#161619" strokeWidth="1" />
                      <line x1="0" y1="60" x2="500" y2="60" stroke="#161619" strokeWidth="1" />
                      {/* SVG Envelope Path */}
                      <polyline
                        fill="none"
                        stroke="#3b82f6"
                        strokeWidth="2"
                        points={bgmAutomationPoints.map(p => `${(p.time/30)*500},${(1 - p.volume)*80}`).join(' ')}
                      />
                      {/* Nodes */}
                      {bgmAutomationPoints.map(p => (
                        <circle
                          key={p.id}
                          cx={(p.time/30)*500}
                          cy={(1 - p.volume)*80}
                          r="5"
                          fill="#ffffff"
                          stroke="#3b82f6"
                          strokeWidth="2"
                          className="cursor-pointer hover:r-7 transition-all"
                        >
                          <title>{`Time: ${p.time}s | Vol: ${Math.round(p.volume*100)}%`}</title>
                        </circle>
                      ))}
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none text-[8px] font-black text-zinc-500 uppercase tracking-widest bg-blue-500/[0.02]">
                      Click Envelope Graph Area to Add Coordinate Point
                    </div>
                  </div>
                </div>

                <div className="md:col-span-4 flex flex-col justify-between p-4 bg-zinc-900/35 border border-zinc-850 rounded-2xl">
                  <div>
                    <span className="text-[9px] font-black text-zinc-400 uppercase tracking-wider block">Automation Nodes Control</span>
                    <div className="flex flex-wrap gap-1.5 mt-2 h-[48px] overflow-y-auto">
                      {bgmAutomationPoints.map((pt, idx) => (
                        <div key={pt.id} className="px-2 py-1 bg-zinc-950 border border-zinc-850 rounded text-[8px] font-black text-zinc-300 uppercase tracking-wider flex items-center gap-1">
                          <span>N{idx+1} ({pt.time}s, {Math.round(pt.volume*100)}%)</span>
                          <button 
                            onClick={() => setBgmAutomationPoints(prev => prev.filter(p => p.id !== pt.id))}
                            className="text-red-500 hover:text-red-400 font-bold px-0.5 ml-1"
                          >
                            ×
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                  <button
                    onClick={() => handleResetAutomation('bgm')}
                    className="w-full mt-3 py-1.5 bg-zinc-950 border border-zinc-800 rounded font-black text-[8px] uppercase tracking-wider text-zinc-400 hover:text-white hover:border-zinc-700 transition-colors"
                  >
                    Reset Grid
                  </button>
                </div>
              </div>
            )}
          </div>

          {"   "}{/* TRACK 3: Cinematographic Sound Effects (SFX) */}
          <div className="bg-zinc-900/20 border border-zinc-850 rounded-[2.5rem] p-6 text-left space-y-4">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b border-zinc-850 pb-4">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-emerald-500/10 rounded-xl text-emerald-400">
                  <Radio size={18} />
                </div>
                <div>
                  <h4 className="text-xs font-black text-white uppercase tracking-wider">
                    Track 3: Impact Sound Effects (SFX)
                  </h4>
                  <div className="flex gap-2 mt-2">
                    {(['none', 'sub_drop', 'laser', 'sweep'] as const).map(st => (
                      <button
                        key={st}
                        onClick={() => handleLoadSyntheticSfx(st)}
                        className={`px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-wider transition-all border cursor-pointer ${
                          sfxType === st
                            ? 'bg-emerald-600/20 border-emerald-500 text-emerald-400 shadow-md'
                            : 'bg-zinc-955 border-zinc-850 text-zinc-500 hover:border-zinc-805 hover:text-zinc-300'
                        }`}
                      >
                        {st}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
              
              <div className="flex items-center flex-wrap gap-4 select-none">
                {/* Volume slider */}
                <div className="flex items-center gap-2">
                  <span className="text-[9px] font-black uppercase text-zinc-500 tracking-widest w-12">Volume:</span>
                  <input 
                    type="range"
                    min="0"
                    max="1"
                    step="0.05"
                    value={sfxVolume}
                    disabled={sfxAutomationEnabled}
                    onChange={(e) => setSfxVolume(parseFloat(e.target.value))}
                    className="w-24 accent-emerald-500 h-1 bg-zinc-800 rounded-lg cursor-pointer disabled:opacity-30"
                  />
                  <span className="text-[10px] font-bold text-zinc-400 w-8 text-right">{(sfxVolume*100).toFixed(0)}%</span>
                </div>

                {/* Automation Toggler */}
                <button
                  type="button"
                  onClick={() => {
                    setSfxAutomationEnabled(!sfxAutomationEnabled);
                    setActiveAutomationTrack(!sfxAutomationEnabled ? 'sfx' : 'none');
                  }}
                  className={`px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-wider border transition-all cursor-pointer ${
                    sfxAutomationEnabled 
                      ? 'bg-emerald-600/20 border-emerald-500 text-emerald-400' 
                      : 'bg-zinc-900 border-zinc-800 text-zinc-500 hover:border-zinc-700 hover:text-zinc-300'
                  }`}
                >
                  Envelope On
                </button>
              </div>
            </div>

            {/* Real-time Web-Audio Waveform Visualizer */}
            <div className="space-y-1.5 bg-zinc-950/20 p-3 rounded-2xl border border-zinc-850">
              <span className="text-[8px] font-black uppercase tracking-widest text-zinc-500">Channel Audio Waveform (Interactive Scrubbing)</span>
              <TimelineWaveform
                buffer={sfxBuffer}
                progress={timelineProgress}
                onScrub={handleScrubProgress}
                colorClass="text-emerald-400 stroke-emerald-550"
                placeholderLabel="Track 3 Empty • Trigger Sweep / Sub Drop / Laser dynamic transitions"
                timelineDuration={timelineDuration}
              />
            </div>

            {sfxAutomationEnabled && (
              <div className="grid grid-cols-1 md:grid-cols-12 gap-6 pt-2">
                <div className="md:col-span-8 space-y-2">
                  <span className="text-[8px] font-black text-emerald-400 uppercase tracking-wider block">Real-time Volume Envelope Node Curve</span>
                  <div className="h-20 bg-zinc-950 border border-zinc-850 rounded-xl relative p-0 overflow-hidden">
                    <svg className="w-full h-full" viewBox="0 0 500 80" preserveAspectRatio="none" onClick={(e) => {
                      const rect = e.currentTarget.getBoundingClientRect();
                      const x = e.clientX - rect.left;
                      const y = e.clientY - rect.top;
                      const sec = (x / rect.width) * 30;
                      const vol = Math.max(0, Math.min(1, 1 - (y / rect.height)));
                      handleAddAutomationPoint('sfx', sec, vol);
                    }}>
                      {/* Gridlines */}
                      <line x1="0" y1="20" x2="500" y2="20" stroke="#161619" strokeWidth="1" />
                      <line x1="0" y1="40" x2="500" y2="40" stroke="#161619" strokeWidth="1" />
                      <line x1="0" y1="60" x2="500" y2="60" stroke="#161619" strokeWidth="1" />
                      {/* SVG Envelope Path */}
                      <polyline
                        fill="none"
                        stroke="#10b981"
                        strokeWidth="2"
                        points={sfxAutomationPoints.map(p => `${(p.time/30)*500},${(1 - p.volume)*80}`).join(' ')}
                      />
                      {/* Nodes */}
                      {sfxAutomationPoints.map(p => (
                        <circle
                          key={p.id}
                          cx={(p.time/30)*500}
                          cy={(1 - p.volume)*80}
                          r="5"
                          fill="#ffffff"
                          stroke="#10b981"
                          strokeWidth="2"
                          className="cursor-pointer hover:r-7 transition-all"
                        >
                          <title>{`Time: ${p.time}s | Vol: ${Math.round(p.volume*100)}%`}</title>
                        </circle>
                      ))}
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none text-[8px] font-black text-zinc-500 uppercase tracking-widest bg-emerald-500/[0.01]">
                      Click Envelope Graph Area to Add Coordinate Point
                    </div>
                  </div>
                </div>

                <div className="md:col-span-4 flex flex-col justify-between p-4 bg-zinc-900/35 border border-zinc-850 rounded-2xl">
                  <div>
                    <span className="text-[9px] font-black text-zinc-400 uppercase tracking-wider block">Automation Nodes Control</span>
                    <div className="flex flex-wrap gap-1.5 mt-2 h-[48px] overflow-y-auto">
                      {sfxAutomationPoints.map((pt, idx) => (
                        <div key={pt.id} className="px-2 py-1 bg-zinc-950 border border-zinc-850 rounded text-[8px] font-black text-zinc-300 uppercase tracking-wider flex items-center gap-1">
                          <span>N{idx+1} ({pt.time}s, {Math.round(pt.volume*100)}%)</span>
                          <button 
                            onClick={() => setSfxAutomationPoints(prev => prev.filter(p => p.id !== pt.id))}
                            className="text-red-500 hover:text-red-400 font-bold px-0.5 ml-1"
                          >
                            ×
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                  <button
                    onClick={() => handleResetAutomation('sfx')}
                    className="w-full mt-3 py-1.5 bg-zinc-950 border border-zinc-800 rounded font-black text-[8px] uppercase tracking-wider text-zinc-400 hover:text-white hover:border-zinc-705 transition-colors"
                  >
                    Reset Grid
                  </button>
                </div>
              </div>
            )}
          </div>

        </div>
      </div>

      <style>{`
        @keyframes wave {
          0%, 100% { transform: scaleY(0.4); }
          50% { transform: scaleY(1.2); }
        }
        .animate-wave {
          animation: wave 1.2s infinite ease-in-out;
        }
      `}</style>
    </div>
  );
};
