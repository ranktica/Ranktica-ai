import React, { useState, useEffect, useRef, useMemo } from 'react';
import { 
  Mic, 
  MicOff, 
  Volume2, 
  HelpCircle, 
  X, 
  ChevronRight, 
  Check, 
  Search, 
  Sparkles, 
  Compass, 
  Database,
  Tv, 
  ArrowRight,
  Headphones,
  CheckCircle2,
  Terminal,
  MessageSquareCode,
  Square,
  Loader2
} from 'lucide-react';
import { ToolType } from '@/shared/types';
import { toast } from 'react-hot-toast';
import { motion, AnimatePresence } from 'motion/react';

interface VoiceNavigatorProps {
  currentTool: ToolType;
  onNavigate: (tool: ToolType) => void;
}

interface CommandItem {
  phrases: string[];
  tool: ToolType;
  label: string;
  category: 'Workspace' | 'Content Creation' | 'Intelligence & Automation';
  description: string;
}

const COMMANDS_MAP: CommandItem[] = [
  // Workspaces
  { 
    phrases: ['dashboard', 'home', 'command center', 'creator command'], 
    tool: ToolType.DASHBOARD, 
    label: 'Creator Dashboard',
    category: 'Workspace',
    description: 'Your central control cockpit.'
  },
  { 
    phrases: ['project', 'projects', 'workspace', 'hubs'], 
    tool: ToolType.PROJECTS, 
    label: 'Projects Hub',
    category: 'Workspace',
    description: 'Structure and manage physical assets.'
  },
  
  // Content Creation
  { 
    phrases: ['script', 'scripts', 'script writer', 'writer', 'screenplay'], 
    tool: ToolType.SCRIPT, 
    label: 'Script Writer',
    category: 'Content Creation',
    description: 'Draft multithread narration screenplays.'
  },
  { 
    phrases: ['idea', 'ideas', 'viral idea', 'generator'], 
    tool: ToolType.IDEAS, 
    label: 'Viral Idea Lab',
    category: 'Content Creation',
    description: 'Conceptualize hooks and semantic predictions.'
  },
  { 
    phrases: ['thumbnail', 'thumbnails', 'art', 'graphic', 'cover'], 
    tool: ToolType.THUMBNAIL, 
    label: 'Thumbnail Studio',
    category: 'Content Creation',
    description: 'Generate production-ready graphics.'
  },
  { 
    phrases: ['thumbnail rater', 'rate thumbnail', 'aesthetic'], 
    tool: ToolType.THUMBNAIL_RATER, 
    label: 'Thumbnail Rater',
    category: 'Content Creation',
    description: 'Rate visual metrics using neural rating engines.'
  },
  { 
    phrases: ['video studio', 'video player', 'video editing'], 
    tool: ToolType.VIDEO, 
    label: 'Video Studio',
    category: 'Content Creation',
    description: 'Arrange timeline video clips and B-rolls.'
  },
  { 
    phrases: ['video generator', 'synthesis', 'render video', 'create video'], 
    tool: ToolType.VIDEO_GENERATOR, 
    label: 'AI Video Generator',
    category: 'Content Creation',
    description: 'Trigger fast cloud-based sequence rendering.'
  },
  { 
    phrases: ['audio', 'narrator', 'voiceover', 'speech synth', 'sound'], 
    tool: ToolType.AUDIO, 
    label: 'Neural Audio Studio',
    category: 'Content Creation',
    description: 'Multispeaker AI synthesizers and timing alignment.'
  },

  // Intelligence & Automation
  { 
    phrases: ['seo', 'seo optimizer', 'tags', 'metadata optimizer'], 
    tool: ToolType.SEO, 
    label: 'SEO Optimizer',
    category: 'Intelligence & Automation',
    description: 'Calculates high-index searchable query keywords.'
  },
  { 
    phrases: ['automation', 'workflow', 'autonomous', 'workflow automation'], 
    tool: ToolType.WORKFLOW, 
    label: 'Workflow Automation',
    category: 'Intelligence & Automation',
    description: 'Execute multi-step pipeline agent sequences.'
  },
  { 
    phrases: ['metadata', 'metadata engineer', 'youtube description'], 
    tool: ToolType.METADATA_ENGINEER, 
    label: 'Metadata Engineer',
    category: 'Intelligence & Automation',
    description: 'Build perfect AI video descriptions.'
  },
  { 
    phrases: ['spy', 'competitor', 'intelligence', 'competitor spy'], 
    tool: ToolType.COMPETITOR_SPY, 
    label: 'Competitor Intelligence',
    category: 'Intelligence & Automation',
    description: 'Real-time competitive research analytics.'
  },
  { 
    phrases: ['audit', 'channel audit', 'health check'], 
    tool: ToolType.CHANNEL_AUDIT, 
    label: 'Channel Health Audit',
    category: 'Intelligence & Automation',
    description: 'Comprehensive performance and security metrics.'
  }
];

const GlowingWaveform: React.FC<{ type: 'native' | 'ai'; stream?: MediaStream | null }> = ({ type, stream }) => {
  const barCount = 14;
  const isAi = type === 'ai';
  const colorClass = isAi ? 'bg-purple-500 shadow-purple-500/50' : 'bg-red-500 shadow-red-500/50';
  const [amplitudes, setAmplitudes] = useState<number[]>(new Array(barCount).fill(4));
  const animationRef = useRef<number | null>(null);

  useEffect(() => {
    if (!stream) {
      // Premium synthetic animation loop
      let angle = 0;
      const interval = setInterval(() => {
        setAmplitudes(prev => 
          prev.map((_, i) => {
            const factor = Math.sin(angle + i * 0.4) * 0.5 + 0.5;
            // Add some natural-looking jitter/noise
            const jitter = Math.random() * 0.3;
            const height = 4 + (factor + jitter) * 18;
            return Math.min(24, Math.max(4, height));
          })
        );
        angle += 0.25;
      }, 60);
      return () => clearInterval(interval);
    }

    // High fidelity real-time microphonic frequency visualizer
    try {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioContextClass) return;

      const audioCtx = new AudioContextClass();
      const source = audioCtx.createMediaStreamSource(stream);
      const analyser = audioCtx.createAnalyser();
      analyser.fftSize = 64; // Responsive frequency analysis binning
      const bufferLength = analyser.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);
      source.connect(analyser);

      const updateData = () => {
        analyser.getByteFrequencyData(dataArray);
        
        // Map frequency bands to the bars
        setAmplitudes(() => {
          const newAmps: number[] = [];
          for (let i = 0; i < barCount; i++) {
            // Focus on low/mid vocal range frequencies (first half of bin range)
            const index = Math.floor((i / barCount) * (bufferLength / 1.5));
            const rawVal = dataArray[index] || 0;
            // Dynamic boost + mapping to 4px - 26px
            const height = 4 + (rawVal / 255) * 22;
            newAmps.push(Math.min(26, Math.max(4, height)));
          }
          return newAmps;
        });

        animationRef.current = requestAnimationFrame(updateData);
      };

      animationRef.current = requestAnimationFrame(updateData);

      return () => {
        if (animationRef.current) {
          cancelAnimationFrame(animationRef.current);
        }
        audioCtx.close().catch(() => {});
      };
    } catch (e) {
      console.warn("Could not initiate premium Web Audio API visualization, falling back to simulation:", e);
    }
  }, [stream]);

  return (
    <div className="flex items-center justify-center gap-[2.5px] h-7 px-2 shrink-0 bg-zinc-950/60 rounded-full border border-zinc-900/50 py-1" id="glowing_waveform_container">
      {amplitudes.map((amp, i) => (
        <div
          key={i}
          className={`w-[2.5px] rounded-full transition-all duration-75 ease-out ${colorClass}`}
          style={{
            height: `${amp}px`,
            boxShadow: `0 0 8px var(--tw-shadow-color)`,
          }}
        />
      ))}
    </div>
  );
};

export const VoiceNavigator: React.FC<VoiceNavigatorProps> = ({ currentTool, onNavigate }) => {
  const [isSupported, setIsSupported] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [lastRecognized, setLastRecognized] = useState<string>('');
  const [showHelp, setShowHelp] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<'All' | 'Workspace' | 'Content Creation' | 'Intelligence & Automation'>('All');
  const [activeHelpTab, setActiveHelpTab] = useState<'dictionary' | 'ai_guide'>('ai_guide');
  
  // Gemini AI Voice Agent specific states & refs
  const [isAiRecording, setIsAiRecording] = useState(false);
  const [aiRecordSeconds, setAiRecordSeconds] = useState(0);
  const [isAiProcessing, setIsAiProcessing] = useState(false);
  const [aiStream, setAiStream] = useState<MediaStream | null>(null);
  
  const recognitionRef = useRef<any>(null);
  const aiMediaRecorderRef = useRef<MediaRecorder | null>(null);
  const aiAudioChunksRef = useRef<Blob[]>([]);
  const aiTimerRef = useRef<any>(null);

  useEffect(() => {
    // Check for SpeechRecognition support
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      setIsSupported(true);
      const rec = new SpeechRecognition();
      rec.continuous = true;
      rec.interimResults = false;
      rec.lang = 'en-US';

      rec.onresult = (event: any) => {
        const resultIndex = event.resultIndex;
        const transcript = event.results[resultIndex][0].transcript.toLowerCase().trim();
        setLastRecognized(transcript);
        
        // Trigger Haptic pulsing animation feedback when processing command
        setIsProcessing(true);
        setTimeout(() => {
          setIsProcessing(false);
        }, 1600);
        
        // Match speech transcripts to tools
        let matched = false;
        for (const item of COMMANDS_MAP) {
          for (const phrase of item.phrases) {
            // Match phrases with word check or sub-string match
            if (transcript.includes(phrase)) {
              onNavigate(item.tool);
              matched = true;
              toast.success(`Voice Navigated: Opened ${item.label}! 🎙️`, { id: 'voice-nav-success' });
              break;
            }
          }
          if (matched) break;
        }

        if (!matched) {
          toast.error(`Recognized "${transcript}" (No navigation match)`, { id: 'voice-nav-fail' });
        }
      };

      rec.onerror = (event: any) => {
        console.warn('[Speech] Recognition error:', event.error);
        if (event.error === 'not-allowed') {
          toast.error('Voice access blocked. Enable microphone permissions in your browser.', { id: 'voice-permission' });
          setIsListening(false);
        }
      };

      rec.onend = () => {
        // Continuous listening restart if still intended to listen
        if (isListening && recognitionRef.current) {
          try {
            recognitionRef.current.start();
          } catch (e) {
            // Ignore if active
          }
        }
      };

      recognitionRef.current = rec;
    }
  }, [onNavigate, isListening]);

  const toggleListening = () => {
    if (!isSupported) {
      toast.error('Web Speech API is unsupported in this browser environment.');
      return;
    }

    if (isAiRecording) {
      stopAiRecording();
    }

    if (isListening) {
      setIsListening(false);
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      toast.success('Voice navigation disabled');
    } else {
      setIsListening(true);
      setLastRecognized('');
      try {
        if (recognitionRef.current) {
          recognitionRef.current.start();
        }
        toast.success('Voice navigation active. Say a command! 🎙️');
      } catch (e) {
        console.error('[Speech] Start fail:', e);
      }
    }
  };

  // Gemini AI Agent Recording handlers
  const startAiRecording = async () => {
    try {
      if (isListening) {
        setIsListening(false);
        if (recognitionRef.current) {
          recognitionRef.current.stop();
        }
      }

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      setAiStream(stream);
      aiAudioChunksRef.current = [];
      const options = MediaRecorder.isTypeSupported('audio/webm') ? { mimeType: 'audio/webm' } : undefined;
      const mediaRecorder = new MediaRecorder(stream, options);

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          aiAudioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(aiAudioChunksRef.current, { type: options?.mimeType || 'audio/ogg' });
        stream.getTracks().forEach(track => track.stop());
        setAiStream(null);
        await processAiVoiceCommand(audioBlob);
      };

      aiMediaRecorderRef.current = mediaRecorder;
      mediaRecorder.start(250);
      setIsAiRecording(true);
      setAiRecordSeconds(0);

      aiTimerRef.current = setInterval(() => {
        setAiRecordSeconds(prev => prev + 1);
      }, 1000);

      toast.success("AI microphone recording active! Speak your instruction.", { id: 'ai-voice-start' });
    } catch (err) {
      console.error(err);
      toast.error("Unable to access microphone for AI agent. Please check permissions.");
    }
  };

  const stopAiRecording = () => {
    if (aiMediaRecorderRef.current && isAiRecording) {
      aiMediaRecorderRef.current.stop();
      setIsAiRecording(false);
      setAiStream(null);
      if (aiTimerRef.current) {
        clearInterval(aiTimerRef.current);
        aiTimerRef.current = null;
      }
    }
  };

  const processAiVoiceCommand = async (audioBlob: Blob) => {
    setIsAiProcessing(true);
    const toastId = toast.loading("AI Agent parsing voice instruction with Gemini...");
    try {
      const reader = new FileReader();
      reader.readAsDataURL(audioBlob);
      reader.onloadend = async () => {
        try {
          const rawBase64 = (reader.result as string).split(',')[1];
          
          const response = await fetch('/api/voice-command/parse', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ b64Data: rawBase64, mimeType: audioBlob.type })
          });

          if (!response.ok) {
            throw new Error("HTTP error " + response.status);
          }

          const result = await response.json();
          setIsAiProcessing(false);

          if (result.matchedTool) {
            onNavigate(result.matchedTool);
            const toolLabel = COMMANDS_MAP.find(c => c.tool === result.matchedTool)?.label || result.matchedTool;
            toast.success(
              `AI Voice Agent (Confidence: ${result.confidence}%): Transcribed "${result.transcript}" → Navigated to ${toolLabel}! 🎙️✨`,
              { id: toastId, duration: 5000 }
            );
          } else {
            toast.error(
              `AI Voice Agent transcribed "${result.transcript}" but couldn't resolve navigation. Reasoning: ${result.reasoning}`,
              { id: toastId, duration: 6000 }
            );
          }
        } catch (innerErr: any) {
          console.error('AI Voice Command async processing failed:', innerErr);
          setIsAiProcessing(false);
          toast.error("AI Command Agent error: " + innerErr.message, { id: toastId });
        }
      };
    } catch (err: any) {
      console.error('AI Voice Command failed:', err);
      setIsAiProcessing(false);
      toast.error("AI Command Agent error: " + err.message, { id: toastId });
    }
  };

  // Safe cleanup
  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      if (aiTimerRef.current) {
        clearInterval(aiTimerRef.current);
      }
      if (aiMediaRecorderRef.current && aiMediaRecorderRef.current.state !== 'inactive') {
        try {
          aiMediaRecorderRef.current.stop();
        } catch (e) {}
      }
    };
  }, []);

  // Filter commands based on search and category
  const filteredCommands = useMemo(() => {
    return COMMANDS_MAP.filter(cmd => {
      const matchesSearch = 
        cmd.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
        cmd.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        cmd.phrases.some(p => p.toLowerCase().includes(searchQuery.toLowerCase()));
      
      const matchesCategory = selectedCategory === 'All' || cmd.category === selectedCategory;
      
      return matchesSearch && matchesCategory;
    });
  }, [searchQuery, selectedCategory]);

  return (
    <div className="fixed bottom-6 right-6 z-40 flex flex-col items-end gap-2 font-sans select-none">
      
      {/* Help Overlay pane */}
      <AnimatePresence>
        {showHelp && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.95, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 15 }}
            transition={{ type: "spring", duration: 0.4 }}
            className="bg-[#0c0c0f]/98 border border-zinc-800 p-5 rounded-3xl w-[350px] shadow-2xl text-xs max-h-[460px] flex flex-col mb-2 font-semibold text-zinc-350 overflow-hidden relative"
          >
            {/* Top gradient strip */}
            <div className="absolute top-0 inset-x-0 h-[2px] bg-gradient-to-r from-purple-500 via-pink-500 to-indigo-600" />
            
            {/* Header */}
            <div className="flex justify-between items-center pb-3 border-b border-zinc-900 shrink-0">
              <div className="flex items-center gap-1.5">
                <MessageSquareCode size={14} className="text-purple-500 animate-pulse" />
                <span className="text-[10px] font-black uppercase tracking-wider text-white">Speech Assistant Control</span>
              </div>
              <button 
                onClick={() => setShowHelp(false)} 
                className="text-zinc-500 hover:text-white transition-colors p-1 hover:bg-zinc-900 rounded-lg"
              >
                <X size={14} />
              </button>
            </div>

            {/* Instruction Description */}
            <div className="py-2.5 shrink-0">
              <p className="text-[10px] text-zinc-500 leading-normal">
                Choose between state-of-the-art Gemini conversational AI commands or traditional localized dictation:
              </p>
            </div>

            {/* Tab selector */}
            <div className="flex bg-zinc-950 border border-zinc-900/60 rounded-xl p-0.5 mb-3 shrink-0">
              <button
                onClick={() => setActiveHelpTab('ai_guide')}
                className={`flex-1 py-1.5 text-[9.5px] font-black uppercase tracking-wider rounded-lg transition-all cursor-pointer ${
                  activeHelpTab === 'ai_guide'
                    ? 'bg-purple-950/30 text-purple-400 border border-purple-500/10'
                    : 'text-zinc-550 hover:text-zinc-300'
                }`}
              >
                Gemini AI Agent 🎙️
              </button>
              <button
                onClick={() => setActiveHelpTab('dictionary')}
                className={`flex-1 py-1.5 text-[9.5px] font-black uppercase tracking-wider rounded-lg transition-all cursor-pointer ${
                  activeHelpTab === 'dictionary'
                    ? 'bg-red-950/20 text-red-400 border border-red-500/10'
                    : 'text-zinc-550 hover:text-zinc-300'
                }`}
              >
                Native Keywords 📖
              </button>
            </div>

            {/* Live Waveform Indicator when Listening natively */}
            {isListening && (
              <div className="mb-3 p-2 bg-red-950/20 border border-red-900/30 rounded-2xl flex items-center justify-between shrink-0">
                <div className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-red-500 animate-ping" />
                  <span className="text-[10px] font-mono text-red-400 font-extrabold uppercase">Audio Stream Active</span>
                </div>
                <div className="flex items-end gap-[2px] h-3 pr-1">
                  <span className="w-[2px] bg-red-500 animate-pulse h-1 bg-gradient-to-t from-red-650 to-red-500" style={{ animationDelay: '0.1s', minHeight: '4px' }} />
                  <span className="w-[2px] bg-red-500 animate-pulse h-2.5 bg-gradient-to-t from-red-650 to-red-400" style={{ animationDelay: '0.3s', minHeight: '6px' }} />
                  <span className="w-[2px] bg-red-500 animate-pulse h-1.5 bg-gradient-to-t from-red-650 to-red-500" style={{ animationDelay: '0.5s', minHeight: '3px' }} />
                  <span className="w-[2px] bg-red-500 animate-pulse h-3 bg-gradient-to-t from-red-650 to-red-350" style={{ animationDelay: '0.2s', minHeight: '8px' }} />
                  <span className="w-[2px] bg-red-500 animate-pulse h-2 bg-gradient-to-t from-red-650 to-red-500" style={{ animationDelay: '0.4s', minHeight: '5px' }} />
                </div>
              </div>
            )}

            {/* Live Waveform Indicator when AI Recording */}
            {isAiRecording && (
              <div className="mb-3 p-2 bg-purple-950/20 border border-purple-900/30 rounded-2xl flex items-center justify-between shrink-0">
                <div className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-purple-500 animate-ping" />
                  <span className="text-[10px] font-mono text-purple-400 font-extrabold uppercase">AI Recording Audio</span>
                </div>
                <div className="flex items-end gap-[2px] h-3 pr-1">
                  <span className="w-[2px] bg-purple-500 animate-pulse h-2 bg-gradient-to-t from-purple-650 to-purple-500" style={{ animationDelay: '0.1s', minHeight: '5px' }} />
                  <span className="w-[2px] bg-purple-500 animate-pulse h-1 bg-gradient-to-t from-purple-650 to-purple-400" style={{ animationDelay: '0.3s', minHeight: '3px' }} />
                  <span className="w-[2px] bg-purple-500 animate-pulse h-3 bg-gradient-to-t from-purple-650 to-purple-500" style={{ animationDelay: '0.5s', minHeight: '8px' }} />
                  <span className="w-[2px] bg-purple-500 animate-pulse h-1.5 bg-gradient-to-t from-purple-650 to-purple-350" style={{ animationDelay: '0.2s', minHeight: '4px' }} />
                  <span className="w-[2px] bg-purple-500 animate-pulse h-2.5 bg-gradient-to-t from-purple-650 to-purple-500" style={{ animationDelay: '0.4s', minHeight: '6px' }} />
                </div>
              </div>
            )}

            {activeHelpTab === 'ai_guide' ? (
              <div className="flex-1 overflow-y-auto no-scrollbar space-y-3.5 pr-0.5">
                <div className="p-3 bg-zinc-950 border border-zinc-900 rounded-2xl space-y-2">
                  <span className="text-[9.5px] font-black uppercase text-purple-400 tracking-wider">How to use Gemini voice command</span>
                  <p className="text-[10px] text-zinc-400 leading-relaxed font-medium">
                    Click the glowing purple sparkle microphone at the bottom right. Say a natural spoken instruction (e.g., <span className="text-zinc-200 font-semibold">"take me to the script writer so I can create a new script"</span>), then click stop. 
                  </p>
                  <p className="text-[10px] text-zinc-400 leading-relaxed font-medium">
                    Gemini AI will listen, automatically transcribe, and map your request to the appropriate tool!
                  </p>
                </div>

                <div className="space-y-2 text-left">
                  <span className="text-[9px] font-black uppercase text-zinc-500 tracking-widest block ml-1">Example Vocal Instructions</span>
                  <div className="space-y-1.5">
                    <div className="p-2 bg-zinc-950/40 border border-zinc-900 rounded-xl flex items-center gap-2">
                      <span className="text-purple-400 font-mono">“</span>
                      <span className="text-[10px] text-zinc-300 font-medium italic">"Open script writer"</span>
                    </div>
                    <div className="p-2 bg-zinc-950/40 border border-zinc-900 rounded-xl flex items-center gap-2">
                      <span className="text-purple-400 font-mono">“</span>
                      <span className="text-[10px] text-zinc-300 font-medium italic">"Show me the creator dashboard cockpit"</span>
                    </div>
                    <div className="p-2 bg-zinc-950/40 border border-zinc-900 rounded-xl flex items-center gap-2">
                      <span className="text-purple-400 font-mono">“</span>
                      <span className="text-[10px] text-zinc-300 font-medium italic">"I want to optimize some SEO keywords"</span>
                    </div>
                    <div className="p-2 bg-zinc-950/40 border border-zinc-900 rounded-xl flex items-center gap-2">
                      <span className="text-purple-400 font-mono">“</span>
                      <span className="text-[10px] text-zinc-300 font-medium italic">"Let me rate my thumbnail design"</span>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <>
                {/* Search and Filters */}
                <div className="space-y-2 mb-3 shrink-0">
                  <div className="relative">
                    <Search size={11} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-zinc-500" />
                    <input
                      type="text"
                      placeholder="Search commands or modules..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full bg-zinc-950 border border-zinc-900 rounded-xl pl-8 pr-3 py-1.5 text-[10.5px] text-zinc-300 placeholder-zinc-650 focus:outline-none focus:border-purple-550/40 transition-colors"
                    />
                    {searchQuery && (
                      <button onClick={() => setSearchQuery('')} className="absolute right-2 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-white">
                        <X size={10} />
                      </button>
                    )}
                  </div>

                  <div className="flex gap-1 overflow-x-auto no-scrollbar pb-0.5">
                    {(['All', 'Workspace', 'Content Creation', 'Intelligence & Automation'] as const).map((cat) => (
                      <button
                        key={cat}
                        onClick={() => setSelectedCategory(cat)}
                        className={`whitespace-nowrap px-2.5 py-1 text-[9px] font-black uppercase tracking-wider rounded-lg border transition-all cursor-pointer ${
                          selectedCategory === cat 
                            ? 'bg-purple-950/20 text-purple-400 border-purple-500/20' 
                            : 'bg-zinc-950 text-zinc-550 border-zinc-900 hover:text-zinc-300'
                        }`}
                      >
                        {cat}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Commands List View */}
                <div className="flex-1 overflow-y-auto no-scrollbar space-y-2 pr-0.5 max-h-[220px]">
                  {filteredCommands.length === 0 ? (
                    <div className="text-center py-6 text-zinc-650 font-mono text-[10px]">
                      No vocal signatures match your query.
                    </div>
                  ) : (
                    filteredCommands.map((cmd) => (
                      <div 
                        key={cmd.tool}
                        onClick={() => {
                          onNavigate(cmd.tool);
                          toast.success(`Navigated: ${cmd.label}`);
                        }}
                        className={`p-2.5 bg-zinc-950/40 border rounded-2xl flex flex-col gap-1.5 transition-all text-left cursor-pointer ${
                          currentTool === cmd.tool 
                            ? 'border-purple-500/30 bg-purple-500/[0.02]' 
                            : 'border-zinc-900 hover:border-zinc-800 hover:bg-zinc-900/10'
                        }`}
                      >
                        <div className="flex justify-between items-center">
                          <span className={`text-[11px] font-extrabold transition-colors ${currentTool === cmd.tool ? 'text-purple-400' : 'text-zinc-200'}`}>
                            {cmd.label}
                          </span>
                          {currentTool === cmd.tool ? (
                            <span className="text-[8px] bg-purple-500/10 text-purple-500 border border-purple-500/20 px-1.5 py-0.5 rounded-lg font-black uppercase tracking-widest scale-90">
                              Active
                            </span>
                          ) : (
                            <span className="text-[8px] text-zinc-600 bg-zinc-900 px-1.5 py-0.5 rounded-lg border border-zinc-850/40 font-mono">
                              {cmd.category}
                            </span>
                          )}
                        </div>
                        
                        <p className="text-[9.5px] text-zinc-500 leading-normal font-medium pr-4">
                          {cmd.description}
                        </p>

                        <div className="flex flex-wrap gap-1 items-center pt-0.5">
                          <span className="text-[8.5px] text-zinc-600 mr-1">Vocal triggers:</span>
                          {cmd.phrases.map((phrase, idx) => (
                            <span 
                              key={idx} 
                              className="px-1.5 py-0.5 bg-zinc-950 border border-zinc-850 rounded text-[9px] font-mono font-bold text-purple-400/80 hover:text-purple-300 transition-colors decoration-dashed"
                            >
                              "{phrase}"
                            </span>
                          ))}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </>
            )}

            {/* Instruction Help Tip */}
            <div className="mt-3 pt-2.5 border-t border-zinc-900 shrink-0 text-[10px] text-zinc-550 flex items-center justify-between">
              <span>Matched command triggers: {filteredCommands.length}</span>
              <span className="font-mono text-[9px] text-purple-550 font-bold uppercase tracking-widest">Ranktica AI dictation</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Floating Status Bar / Button */}
      <div className={`flex items-center gap-2 bg-zinc-950 border p-2.5 rounded-full shadow-2xl transition-all duration-300 relative ${
        isProcessing ? 'border-emerald-500/40 shadow-emerald-950/20' : isAiProcessing ? 'border-purple-500/40 shadow-purple-950/20' : 'border-zinc-850'
      }`}>
        {isListening && (
          <div className="flex items-center gap-3 px-3 animate-fade-in truncate max-w-[280px]">
            <GlowingWaveform type="native" />
            <span className="text-[10px] font-bold text-zinc-400 truncate">
              {isProcessing ? 'Processing...' : lastRecognized ? `"${lastRecognized}"` : 'Listening hands-free...'}
            </span>
          </div>
        )}

        {isAiRecording && (
          <div className="flex items-center gap-3 px-3 animate-fade-in truncate max-w-[280px]">
            <GlowingWaveform type="ai" stream={aiStream} />
            <span className="text-[10px] font-bold text-zinc-400">
              {`Recording: ${Math.floor(aiRecordSeconds / 60)}:${(aiRecordSeconds % 60).toString().padStart(2, '0')}`}
            </span>
          </div>
        )}

        {isAiProcessing && (
          <div className="flex items-center gap-2 px-3 animate-fade-in truncate max-w-[180px]">
            <span className="relative flex h-2 w-2">
              <span className="animate-spin absolute inline-flex h-full w-full rounded-full border border-purple-500 border-t-transparent"></span>
            </span>
            <span className="text-[10px] font-bold text-purple-400 animate-pulse">
              AI parsing...
            </span>
          </div>
        )}

        <button
          onClick={() => setShowHelp(!showHelp)}
          className={`p-1.5 rounded-full transition-colors cursor-pointer ${
            showHelp ? 'bg-zinc-900 text-white' : 'text-zinc-400 hover:text-white hover:bg-zinc-900'
          }`}
          title="Voice Navigation Commands Dictionary"
        >
          <HelpCircle size={15} />
        </button>

        {isSupported && (
          <div className="relative flex items-center justify-center">
            {isListening && (
              <>
                <span className="absolute inset-0 bg-red-500/30 rounded-full animate-ping pointer-events-none" />
                <span className="absolute -inset-2 bg-red-500/15 rounded-full animate-pulse pointer-events-none" />
              </>
            )}
            <button
              onClick={toggleListening}
              className={`relative z-10 p-1.5 rounded-full transition-colors cursor-pointer ${
                isListening ? 'bg-red-950/30 text-red-400 hover:text-red-300 border border-red-500/30' : 'text-zinc-400 hover:text-white hover:bg-zinc-900'
              }`}
              title={isListening ? 'Disable continuous hands-free dictation' : 'Enable continuous hands-free dictation'}
            >
              {isListening ? <Mic size={15} className="text-red-500" /> : <MicOff size={15} />}
            </button>
          </div>
        )}

        <div className="relative">
          {isAiProcessing && (
            <>
              <span className="absolute -inset-3 bg-purple-500/30 rounded-full animate-ping pointer-events-none" />
              <span className="absolute -inset-5 bg-indigo-500/10 rounded-full animate-pulse pointer-events-none" />
            </>
          )}
          {isAiRecording && (
            <>
              <span className="absolute -inset-3 bg-red-500/30 rounded-full animate-ping pointer-events-none" />
              <span className="absolute -inset-5 bg-red-500/15 rounded-full animate-pulse pointer-events-none" />
            </>
          )}
          <button
            onClick={isAiRecording ? stopAiRecording : startAiRecording}
            className={`relative p-2.5 rounded-full transition-all cursor-pointer active-press z-10 ${
              isAiProcessing 
                ? 'bg-purple-600 text-white shadow-lg shadow-purple-950/60 scale-110 shadow-md ring-2 ring-purple-500/30'
                : isAiRecording 
                  ? 'bg-red-650 text-white shadow-lg shadow-red-950/40' 
                  : 'bg-zinc-900 text-purple-400 hover:text-purple-300 hover:bg-zinc-850 border border-purple-900/30'
            }`}
            title={isAiRecording ? 'Stop and execute AI voice command' : 'Record Gemini AI voice command'}
          >
            {isAiProcessing ? (
              <Loader2 size={16} className="animate-spin" />
            ) : isAiRecording ? (
              <Square size={16} className="fill-current animate-bounce" />
            ) : (
              <Sparkles size={16} className="animate-pulse" />
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

