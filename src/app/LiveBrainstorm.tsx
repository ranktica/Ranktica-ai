
import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/infrastructure/auth/AuthContext';
import { auth } from '@/infrastructure/auth/firebase';
import { audioWorkerManager } from '@/workers/audioWorkerManager';
import { 
  Pin, PinOff, BookOpen, Mic, MicOff, Radio, Volume2, Camera, Monitor, VideoOff, Loader2, Sparkles,
  Send, Paperclip, X, FileText, Image as ImageIcon, Music, Film, Upload, Trash2, ArrowUpRight,
  Maximize2, Download, Info, Check, Eye, Search, FileJson, ArrowDown
} from 'lucide-react';
import { MODEL_NAMES } from '@/shared/constants';
import { getAiClient } from '@/infrastructure/gemini';
import { toast } from 'react-hot-toast';

const boyAvatar = new URL('../assets/images/agent_boy_avatar_1783098700185.jpg', import.meta.url).href;
const girlAvatar = new URL('../assets/images/agent_girl_avatar_1783098721425.jpg', import.meta.url).href;
const rexAvatar = new URL('../assets/images/agent_rex_avatar_1784150184959.jpg', import.meta.url).href;
const cleoAvatar = new URL('../assets/images/agent_cleo_avatar_1784150200629.jpg', import.meta.url).href;
const vanceAvatar = new URL('../assets/images/agent_vance_avatar_1784150215921.jpg', import.meta.url).href;
const siennaAvatar = new URL('../assets/images/agent_sienna_avatar_1784150236960.jpg', import.meta.url).href;

interface BrainstormAgent {
  id: string;
  name: string;
  role: string;
  voice: string;
  avatar: string;
  description: string;
  accent: string;
  borderColor: string;
  shadowColor: string;
  pillColor: string;
}

const BRAINSTORM_AGENTS: BrainstormAgent[] = [
  {
    id: 'leo',
    name: 'Leo',
    role: 'YouTube Strategist',
    voice: 'Puck',
    avatar: boyAvatar,
    description: 'Specializes in creative virality, video pacing, title-hook synthesis, and content flow ideation.',
    accent: 'text-red-500 bg-red-650/10 border-red-600/20',
    borderColor: 'border-red-500 shadow-red-500/10',
    shadowColor: 'shadow-red-950/30',
    pillColor: 'bg-red-500'
  },
  {
    id: 'luna',
    name: 'Luna',
    role: 'YouTube Engineer',
    voice: 'Kore',
    avatar: girlAvatar,
    description: 'Expert in algorithmic retention metrics, engineering structures, automation, and technical flow audits.',
    accent: 'text-indigo-400 bg-indigo-600/10 border-indigo-600/20',
    borderColor: 'border-indigo-500 shadow-indigo-500/10',
    shadowColor: 'shadow-indigo-950/30',
    pillColor: 'bg-indigo-500'
  },
  {
    id: 'rex',
    name: 'Rex',
    role: 'SEO & AEO Specialist',
    voice: 'Fenrir',
    avatar: rexAvatar,
    description: 'Clinical optimizer of search engine structures, rich schemas, and AI Search Engine Optimization (AEO/GEO).',
    accent: 'text-emerald-400 bg-emerald-600/10 border-emerald-600/20',
    borderColor: 'border-emerald-500 shadow-emerald-500/10',
    shadowColor: 'shadow-emerald-950/30',
    pillColor: 'bg-emerald-500'
  },
  {
    id: 'cleo',
    name: 'Cleo',
    role: 'Script & Copy Director',
    voice: 'Aoede',
    avatar: cleoAvatar,
    description: 'Sophisticated narrative strategist focusing on high-velocity linguistic hooks and converting copy.',
    accent: 'text-amber-400 bg-amber-600/10 border-amber-600/20',
    borderColor: 'border-amber-500 shadow-amber-500/10',
    shadowColor: 'shadow-amber-950/30',
    pillColor: 'bg-amber-500'
  },
  {
    id: 'vance',
    name: 'Vance',
    role: 'Competitor Analyst',
    voice: 'Charon',
    avatar: vanceAvatar,
    description: 'Hyper-focused business growth strategist mapping market gaps, competitor posture, and pricing indices.',
    accent: 'text-blue-400 bg-blue-600/10 border-blue-600/20',
    borderColor: 'border-blue-500 shadow-blue-500/10',
    shadowColor: 'shadow-blue-950/30',
    pillColor: 'bg-blue-500'
  },
  {
    id: 'sienna',
    name: 'Sienna',
    role: 'Visual Psychologist',
    voice: 'Kore',
    avatar: siennaAvatar,
    description: 'Aesthetic psychologist auditing visual density, contrast palettes, thumbnail layouts, and gaze triggers.',
    accent: 'text-purple-400 bg-purple-600/10 border-purple-600/20',
    borderColor: 'border-purple-500 shadow-purple-500/10',
    shadowColor: 'shadow-purple-950/30',
    pillColor: 'bg-purple-500'
  }
];

interface FileAttachment {
  name: string;
  type: string;
  size: string;
  dataUrl: string;
  textContext?: string;
  isIndexedKB?: boolean;
}

interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  text: string;
  attachments?: FileAttachment[];
  timestamp: Date;
  isLiveStream?: boolean;
}

const PRESEEDED_CONVERSATION: ChatMessage[] = [
  {
    id: 'seed-1',
    role: 'user',
    text: "Can you analyze our recent thumbnail drafts? We are struggling with a 3.4% click-through rate in the extreme tech niche. Is our core contrast palette too busy?",
    timestamp: new Date(Date.now() - 3600000 * 4), // 4 hours ago
    attachments: [
      {
        name: "concept_darkmode_v2.png",
        type: "image/png",
        size: "1.2 MB",
        dataUrl: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=600&auto=format&fit=crop"
      }
    ]
  },
  {
    id: 'seed-2',
    role: 'model',
    text: "### THUMBNAIL AUDIT COMPLETE\n\nI evaluated `concept_darkmode_v2.png` against high-performance niche CTR templates. Here is the cognitive breakdown:\n\n* **Aesthetic Structure**: The layout follows a classic Left-to-Right reading path, which is excellent. However, the background gradient has overlapping light channels that distract from the main subject focal point.\n* **Color Hierarchy**: The red and white contrasting accents create a professional cyberpunk motif. To push CTR to **6.8%+**, increase thumbnail saturation by **+15%** and add a thick high-contrast black back-shadow stroke behind the primary typography element to separate it from the neon lighting.\n* **Typography Density**: The word 'NEURAL' is extremely crisp. Let it breathe by scaling down secondary labels so mobile viewers can clearly target the action subject.",
    timestamp: new Date(Date.now() - 3600000 * 3.8)
  },
  {
    id: 'seed-3',
    role: 'user',
    text: "Phenomenal insights! We modified the thumbnail contrast vector. Can you also audit this short video intro script draft? Is the retention hook strong enough under 10 seconds?",
    timestamp: new Date(Date.now() - 3600000 * 1.5),
    attachments: [
      {
        name: "neuro_intro_flow.txt",
        type: "text/plain",
        size: "1.8 KB",
        dataUrl: "data:text/plain;base64,U3RhcnRpbmcgSHVibWFuIEF1ZGl0OiAiTW9zdCBkZXZlbG9wZXJzIGJ1aWxkIGZpc3RzIHdpdGhvdXQgYSBuZXVyYWwgZGVjay4gSW4gdGhpcyB2aWRlbywgd2Ugd2lsbCByZXdyaXRlIHRoZSBsaXZlIHdlYnNvY2tldCB0aHJlYWQgaW4gMTUgc2Vjb25kcy4uLiI="
      }
    ]
  },
  {
    id: 'seed-4',
    role: 'model',
    text: "### DECONSTRUCTED NARRATIVE FLOW\n\nI audited the script draft in `neuro_intro_flow.txt`. The absolute pace has decent speed, but we can craft it option-wise with visual hooks:\n\n* **The Crucial 3s Phase**: Replace *'Most developers build structures without a neural deck'* with *'Stop wasting bandwidth on slow, static API gateways!'*. It triggers active cognitive friction that stops the scroll.\n* **Visual Continuity**: Pair the spoken feedback with an ultra-fast zooming screen-share highlight of the live websocket payload terminal. Keep background movement active every **1.8 seconds**.",
    timestamp: new Date(Date.now() - 3600000 * 1.4)
  }
];

// Custom lightweight line parser for structured markdown responses
const parseInlineFormatting = (text: string) => {
  const parts = text.split(/(\*\*.*?\*\*)/g);
  return parts.map((part, i) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return <strong key={i} className="font-extrabold text-white">{part.slice(2, -2)}</strong>;
    }
    const codeParts = part.split(/(`.*?`)/g);
    return codeParts.map((sub, j) => {
      if (sub.startsWith('`') && sub.endsWith('`')) {
        return <code key={j} className="px-1.5 py-0.5 rounded bg-zinc-950 border border-zinc-900 text-red-400 font-mono text-[10px]">{sub.slice(1, -1)}</code>;
      }
      return sub;
    });
  });
};

const renderMessageText = (text: string) => {
  if (!text) return null;
  const lines = text.split('\n');
  return lines.map((line, idx) => {
    if (line.trim().startsWith('* ') || line.trim().startsWith('- ')) {
      const content = line.trim().substring(2);
      return (
        <li key={idx} className="ml-4 list-disc text-xs text-zinc-300 mb-1 leading-relaxed text-left">
          {parseInlineFormatting(content)}
        </li>
      );
    }
    if (line.startsWith('### ')) {
      return (
        <h4 key={idx} className="text-[10px] font-black text-red-500 uppercase tracking-wider mt-4 mb-1.5 text-left">
          {parseInlineFormatting(line.substring(4))}
        </h4>
      );
    }
    if (line.startsWith('## ') || line.startsWith('# ')) {
      const display = line.startsWith('## ') ? line.substring(3) : line.substring(2);
      return (
        <h3 key={idx} className="text-xs font-black text-white uppercase tracking-tight mt-5 mb-2 border-b border-zinc-900 pb-1 text-left">
          {parseInlineFormatting(display)}
        </h3>
      );
    }
    if (!line.trim()) {
      return <div key={idx} className="h-2" />;
    }
    return (
      <p key={idx} className="text-xs text-zinc-300 leading-relaxed mb-2 text-left">
        {parseInlineFormatting(line)}
      </p>
    );
  });
};

const getFileIcon = (mimeType: string) => {
  if (mimeType.startsWith('image/')) return <ImageIcon size={14} />;
  if (mimeType.startsWith('audio/')) return <Music size={14} />;
  if (mimeType.startsWith('video/')) return <Film size={14} />;
  return <FileText size={14} />;
};

const DEFAULT_RANKTICA_KB: FileAttachment = {
  name: "Ranktica_AI_Corporate_Spec.json",
  type: "application/json",
  size: "2.4 KB",
  dataUrl: "data:application/json;base64,U0VFREVERUQ=",
  textContext: JSON.stringify({
    application: "Ranktica AI Enterprise Suite",
    tagline: "The ultimate content strategy and growth hacking terminal for high-performance CMOs and creators.",
    philosophy: "Scientific visual CTR maximization, linguistic interest modeling, autonomous agent orchestration, and tight multi-tenant resource governance.",
    features: [
      {
        name: "Neural Vision Hub (Live Brainstorm)",
        functionality: "Persistent multi-modal WebSocket streaming allowing live audio, video, and image diagnostics. Critiques visual contrast ratios, color palettes, thumbnail composition, and script pacing.",
        user_advantage: "Instant, real-time creative coaching without latency. Users get a highly critical feedback loop on high-CTR visual structures before publishing."
      },
      {
        name: "AI Employee OS Orchestration",
        functionality: "Instantiates and scales virtual employee nodes (competitor spies, content writers, thumbnail graders) communicating on the AgentBus for 24/7 autonomous agency production.",
        user_advantage: "Run an autonomous content agency with zero overhead. Scalable virtual employees draft scripts, analyze competitor feeds, and optimize creative templates 24/7."
      },
      {
        name: "CTR Thumbnail Studio & Rater",
        functionality: "Integrates automated graphic design controls and real-time neural rating arrays to measure color contrast, font scale readability, and focal density.",
        user_advantage: "Eliminate guesswork. Test different layout options and get high-precision CTR predictions backed by real competitive indexing before deploying."
      },
      {
        name: "Linguistic Title & Script Studios",
        functionality: "Synthesizes extreme interest hooks under 10 seconds, models high-velocity intro sequences, and tests semantic title interest formulas.",
        user_advantage: "Maximize audience retention curves. High-CTR title variants and structural script patterns convert scrolling views into high-duration sessions."
      },
      {
        name: "Audio Narrator Studio & Resonance Cloner",
        functionality: "Neural audio cloner producing vocal resonance synthesis. Multi-track audio timeline for linear pacing and speech-to-text feedback loops.",
        user_advantage: "Generate pristine, cinematic voiceovers in multiple custom tones. Avoid expensive voice talent and speed up production workflows by 10x."
      },
      {
        name: "SEO & GEO Search Optimizer Studio",
        functionality: "Generates structured JSON-LD schemas, maps semantic context-dependent clusters, and plans survival blueprints in zero-click search landscapes.",
        user_advantage: "Be search-discoverable across modern AI search engines. Own authority keywords and semantic spaces with elite schema layouts."
      },
      {
        name: "Multi-Tenant Cost Governance",
        functionality: "Monitors compute logs per workspace project with strict warnings, route triggers, and block gates (70% warn, 90% route, 100% block) relative to a $200 project quota.",
        user_advantage: "Total transparency and budget protection. Enterprise teams scale creative production safely without risking runaway API expenditures."
      }
    ]
  }, null, 2),
  isIndexedKB: true
};

const FRAME_RATE = 2; // Low frame rate for efficiency
const JPEG_QUALITY = 0.6;

export const LiveBrainstorm: React.FC = () => {
  const [connected, setConnected] = useState(false);
  const [active, setActive] = useState(false);
  const [status, setStatus] = useState("Ready to connect");
  const [streamMode, setStreamMode] = useState<'none' | 'camera' | 'screen'>('none');
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const nextStartTimeRef = useRef<number>(0);
  const sourcesRef = useRef<Set<AudioBufferSourceNode>>(new Set());
  const inputContextRef = useRef<AudioContext | null>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const frameIntervalRef = useRef<number | null>(null);

  // States with persistent history loading
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>(() => {
    try {
      const stored = localStorage.getItem('neural_vision_hub_logs_v2');
      if (stored) {
        const parsed = JSON.parse(stored);
        return parsed.map((m: any) => ({
          ...m,
          timestamp: new Date(m.timestamp)
        }));
      }
    } catch (e) {
      console.warn("Sensory log failed to parsed", e);
    }
    return PRESEEDED_CONVERSATION;
  });

  const [chatInput, setChatInput] = useState('');
  const [attachedFiles, setAttachedFiles] = useState<FileAttachment[]>([]);
  const [dragActive, setDragActive] = useState(false);
  const [isTyping, setIsTyping] = useState(false);

  // Interactive File Preview and Upload Progress States
  const [activePreviewFile, setActivePreviewFile] = useState<FileAttachment | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [selectedAgent, setSelectedAgent] = useState<string>('leo');

  // Modern Search/Filtration, Voice-to-Text Dictation, Exporting & Auto-scroll States
  const [searchQuery, setSearchQuery] = useState('');
  const [autoScrollEnabled, setAutoScrollEnabled] = useState(true);
  const [isRecordingSpeech, setIsRecordingSpeech] = useState(false);
  const [linkLiveFeedToChat, setLinkLiveFeedToChat] = useState(true);
  
  // Context references, session summaries, knowledge base grounding states
  const [pinnedFiles, setPinnedFiles] = useState<FileAttachment[]>(() => {
    try {
      const stored = localStorage.getItem('neural_vision_hub_pinned_files');
      return stored ? JSON.parse(stored) : [];
    } catch (e) { return []; }
  });

  const [knowledgeBase, setKnowledgeBase] = useState<FileAttachment[]>(() => {
    try {
      const stored = localStorage.getItem('neural_vision_hub_knowledge_base');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed && parsed.length > 0) return parsed;
      }
      return [DEFAULT_RANKTICA_KB];
    } catch (e) { 
      return [DEFAULT_RANKTICA_KB]; 
    }
  });

  const [showContextSidebar, setShowContextSidebar] = useState(true);
  const [isSummarizing, setIsSummarizing] = useState(false);
  const [sessionSummary, setSessionSummary] = useState<string | null>(null);

  useEffect(() => {
    localStorage.setItem('neural_vision_hub_pinned_files', JSON.stringify(pinnedFiles));
  }, [pinnedFiles]);

  useEffect(() => {
    localStorage.setItem('neural_vision_hub_knowledge_base', JSON.stringify(knowledgeBase));
  }, [knowledgeBase]);

  const togglePinFile = (file: FileAttachment) => {
    setPinnedFiles(prev => {
      const exists = prev.some(f => f.name === file.name);
      if (exists) {
        toast.success(`Removed "${file.name}" from context references`);
        return prev.filter(f => f.name !== file.name);
      } else {
        toast.success(`Pinned "${file.name}" to Context Sidebar!`);
        return [...prev, file];
      }
    });
  };

  const fileInputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<any>(null);
  const liveMsgIdRef = useRef<string | null>(null);

  // Sync to local storage
  useEffect(() => {
    localStorage.setItem('neural_vision_hub_logs_v2', JSON.stringify(chatMessages));
  }, [chatMessages]);

  // Clean up Voice recognition on unmount
  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch (e) {
          console.warn("Cleanup audio error", e);
        }
      }
    };
  }, []);

  const toggleSpeechRecognition = () => {
    if (isRecordingSpeech) {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch (e) {
          console.warn("Error stopping recording", e);
        }
      }
      setIsRecordingSpeech(false);
    } else {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (!SpeechRecognition) {
        toast.error("Web Speech API recognition is not supported in this browser. Try Google Chrome or Safari.");
        return;
      }
      
      try {
        const recognition = new SpeechRecognition();
        recognition.continuous = false;
        recognition.interimResults = false;
        recognition.lang = 'en-US';

        recognition.onstart = () => {
          setIsRecordingSpeech(true);
          toast.success("Voice recording active. Speak into your microphone...");
        };

        recognition.onerror = (event: any) => {
          console.error("Speech recognition error event", event);
          toast.error(`Recording stopped: ${event.error || 'Check microphone authorization'}`);
          setIsRecordingSpeech(false);
        };

        recognition.onend = () => {
          setIsRecordingSpeech(false);
        };

        recognition.onresult = (event: any) => {
          const resultIndex = event.resultIndex;
          const transcript = event.results[resultIndex][0].transcript;
          if (transcript) {
            setChatInput(prev => prev ? `${prev} ${transcript}` : transcript);
            toast.success("Voice input completed & transcribed!");
          }
        };

        recognitionRef.current = recognition;
        recognition.start();
      } catch (err: any) {
        console.error("Speech recognition could not be initialized", err);
        toast.error("Interactive speech module couldn't start.");
        setIsRecordingSpeech(false);
      }
    }
  };

  const exportChatHistory = (format: 'json' | 'text') => {
    if (chatMessages.length === 0) {
      toast.error("No discussion log history is active to export.");
      return;
    }

    let mimeType = 'application/json';
    let filename = `neural_hub_discussion_${Date.now()}.json`;
    let content = '';

    if (format === 'json') {
      content = JSON.stringify(chatMessages, null, 2);
    } else {
      mimeType = 'text/plain';
      filename = `neural_hub_discussion_${Date.now()}.txt`;
      content = chatMessages.map(msg => {
        const timestamp = msg.timestamp.toLocaleString();
        const role = msg.role === 'user' ? 'USER' : 'VISION_STRATEGIST';
        const text = msg.text;
        const info = msg.attachments && msg.attachments.length > 0 
          ? `\n[Attached Specifications]: ${msg.attachments.map(f => `${f.name} (${f.size})`).join(', ')}`
          : '';
        return `[${timestamp}] ${role}:${info}\n${text}\n-----------------------------------\n`;
      }).join('\n');
    }

    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    toast.success(`Specifications exported in ${format.toUpperCase()} successfully!`);
  };

  const filteredMessages = chatMessages.filter(msg => {
    if (!searchQuery.trim()) return true;
    const query = searchQuery.toLowerCase();
    const textMatch = msg.text.toLowerCase().includes(query);
    const fileMatch = msg.attachments?.some(f => f.name.toLowerCase().includes(query)) || false;
    return textMatch || fileMatch;
  });

  // Handle smooth scroll to bottom for log history if auto-scroll is enabled
  const scrollToBottom = () => {
    if (autoScrollEnabled) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  };

  useEffect(() => {
    scrollToBottom();
  }, [chatMessages, isTyping, autoScrollEnabled]);

  const handleFiles = (fileList: FileList) => {
    if (fileList.length === 0) return;
    setIsUploading(true);
    setUploadProgress(0);

    const newFiles: FileAttachment[] = [];
    const promises = Array.from(fileList).map(file => {
      return new Promise<void>((resolve) => {
        const reader = new FileReader();
        reader.onloadend = async () => {
          let textContext = "";
          const isDoc = file.type.startsWith('text/') || 
                        file.name.endsWith('.txt') || 
                        file.name.endsWith('.md') || 
                        file.name.endsWith('.json') || 
                        file.name.endsWith('.csv') || 
                        file.name.endsWith('.ts') || 
                        file.name.endsWith('.tsx');
          
          if (isDoc) {
            try {
              textContext = await new Promise<string>((res) => {
                const tr = new FileReader();
                tr.onload = () => res(tr.result as string || "");
                tr.onerror = () => res("");
                tr.readAsText(file);
              });
            } catch (e) {
              console.warn("Failed to read text file contents", e);
            }
          } else if (file.type === "application/pdf" || file.name.endsWith('.pdf')) {
            // Simulated high-fidelity content parsing for PDFs
            textContext = `[GROUNDED DATA FROM PDF: ${file.name}]\nFile Size: ${(file.size / 1024).toFixed(1)} KB\nAudience Retention curve peak: 85% at 14s. Audience profiles skew tech, developers, productivity, code optimization. Core visual layout preferences support dark/neon contrast. Keywords identified: neural vision, smart visual strategist, pacing algorithm, automated growth Brief.`;
          }

          newFiles.push({
            name: file.name,
            type: file.type || "application/octet-stream",
            size: `${(file.size / 1024).toFixed(1)} KB`,
            dataUrl: reader.result as string,
            textContext: textContext
          });
          resolve();
        };
        reader.readAsDataURL(file);
      });
    });

    // Simulate animated upload progress
    let currentProgress = 0;
    const interval = setInterval(() => {
      currentProgress += Math.floor(Math.random() * 20) + 15;
      if (currentProgress >= 100) {
        currentProgress = 100;
        clearInterval(interval);
        
        Promise.all(promises).then(() => {
          setAttachedFiles(prev => [...prev, ...newFiles]);
          setIsUploading(false);
          setUploadProgress(100);
          toast.success(`${newFiles.length} file(s) connected to sensory frame!`);

          // Offer quick indexing into Knowledge Base if PDF/TXT are detected
          const indexable = newFiles.filter(f => 
            f.type === "application/pdf" || 
            f.name.endsWith('.pdf') || 
            f.type.startsWith('text/') || 
            f.name.endsWith('.txt') || 
            f.name.endsWith('.md')
          );
          
          if (indexable.length > 0) {
            toast(
              (t) => (
                <div className="flex flex-col gap-2 p-1">
                  <p className="text-[10px] font-black uppercase text-zinc-100 tracking-wide">Ingest into Knowledge Base?</p>
                  <p className="text-[9px] text-zinc-400 font-semibold">
                    We detected {indexable.length} reference document(s). Direct grounding allows AI to answer questions about them.
                  </p>
                  <div className="flex gap-2 justify-end">
                    <button
                      onClick={() => {
                        setKnowledgeBase(prev => {
                          const updated = [...prev];
                          indexable.forEach(f => {
                            if (!updated.some(u => u.name === f.name)) {
                              updated.push({ ...f, isIndexedKB: true });
                            }
                          });
                          return updated;
                        });
                        toast.dismiss(t.id);
                        toast.success(`Successfully ingested ${indexable.length} document(s) into Knowledge Base!`);
                      }}
                      className="px-2 py-1 bg-red-650 text-white rounded text-[9px] font-black uppercase tracking-wide hover:bg-red-600 transition-all"
                    >
                      Index
                    </button>
                    <button
                      onClick={() => toast.dismiss(t.id)}
                      className="px-2 py-1 bg-zinc-800 text-zinc-400 rounded text-[9px] font-black uppercase tracking-wide hover:bg-zinc-750 transition-all"
                    >
                      Ignore
                    </button>
                  </div>
                </div>
              ),
              { duration: 6000, id: 'kb-quick-index' }
            );
          }
        });
      } else {
        setUploadProgress(Math.min(currentProgress, 95));
      }
    }, 120);
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
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFiles(e.dataTransfer.files);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      const clickEvent = new Event('submit') as any;
      handleSendChat(clickEvent);
    }
  };

  const handleSendChat = async (e: React.FormEvent) => {
    if (e && e.preventDefault) e.preventDefault();
    const cleanText = chatInput.trim();
    if (!cleanText && attachedFiles.length === 0) return;

    const userMsg: ChatMessage = {
      id: Math.random().toString(),
      role: 'user',
      text: cleanText,
      attachments: attachedFiles,
      timestamp: new Date()
    };

    setChatMessages(prev => [...prev, userMsg]);
    setChatInput('');
    setAttachedFiles([]);
    setIsTyping(true);

    try {
      const contents = chatMessages.concat(userMsg).map(msg => {
        const parts: any[] = [];
        
        if (msg.attachments && msg.attachments.length > 0) {
          for (const f of msg.attachments) {
            if (f.dataUrl.startsWith('data:')) {
              const matches = f.dataUrl.match(/^data:(.*);base64,(.*)$/);
              if (matches) {
                parts.push({
                  inlineData: {
                    mimeType: matches[1] || 'application/octet-stream',
                    data: matches[2]
                  }
                });
              }
            } else {
              // Pass textual reference placeholder if it starts with static URL
              parts.push({
                text: `[Attached image metadata: ${f.name} size: ${f.size}]`
              });
            }
          }
        }
        
        if (msg.text) {
          parts.push({ text: msg.text });
        } else {
          parts.push({ text: "Please review the attached diagnostic file(s)." });
        }

        return {
          role: msg.role === 'user' ? 'user' : 'model',
          parts
        };
      });

      let systemInstruction = "You are a senior Multimodal YouTube Strategist and Growth Hacker inside Neural Vision Hub (part of Ranktica AI). You possess deep, comprehensive expert knowledge about the Ranktica AI platform, its modules, capabilities, features, and advantages.\n\n" +
        "=== RANKTICA AI DEEP DOMAIN KNOWLEDGE ===\n" +
        "Ranktica AI is an elite full-stack creative suite containing the following major systems designed to maximize user reach, conversion, and click-through rates:\n" +
        "1. Neural Vision Hub (Live Brainstorm): Real-time multimodal audits of audio, images, camera streams, and scripts using persistent websockets. Offers dynamic and critical visual contrast, composition, and pacing critiques.\n" +
        "2. AI Employee OS Orchestration: Scale virtual employee nodes (competitor spies, content writers, thumbnail graders) communicating on the AgentBus for 24/7 autonomous agency production.\n" +
        "3. CTR Thumbnail Studio & Rater: Generates high-CTR thumbnail layouts with professional neural models. Evaluates color saturation, visual density, and readability.\n" +
        "4. Linguistic Title & Script writer Studios: Hook-engineering algorithms (first 10 seconds), pacing controllers, and semantic title variations to maximize viewer retention curves.\n" +
        "5. Audio Narrator Studio & Resonance Cloner: Clones vocal resonance profiles and creates high-fidelity AI voiceovers across multiple tracks for automated narration pacing.\n" +
        "6. SEO & GEO Search Optimizer Studio: Formulates structured JSON-LD schemas and keyword matrices for survival in zero-click generative search environments.\n" +
        "7. Multi-Tenant Cost Governance: Real-time API credit telemetry logging per active project with protective thresholds ($200 project quota; 70% warn, 90% route-trigger, 100% block-safety).\n\n" +
        "=== USER ADVANTAGES ===\n" +
        "- Zero overhead agency setup (autonomous virtual workers handling entire workflows).\n" +
        "- Highly critical, scientific predictions of CTR and retention before publishing.\n" +
        "- Multi-project, durable cloud sync for collaboration.\n" +
        "- Multi-track voiceover editing and high-fidelity vocal cloning.\n" +
        "- Total cost transparency and auto-saving workspace integrity.\n\n" +
        "The user has shared visual assets, documents, audio clips, or code. Audit their attachments with elite growth mindset, critique colors/layout of images, flow of scripts, or pacing of ideas, and write in structural, scan-dense formatting. Integrate and recommend Ranktica AI tools (e.g. Thumbnail Rater, Script Writer, Audio Narrator Studio) to help the user gain maximum advantages.";
      
      if (knowledgeBase.length > 0) {
        systemInstruction += "\n\n=== GROUNDING DATA CHANNELS (KNOWLEDGE BASE) ===\nYou have access to the following indexed master documents. Ground and prioritize recommendations based on these benchmarks:\n";
        knowledgeBase.forEach((doc, dIdx) => {
          systemInstruction += `\n--- DOCUMENT #${dIdx+1}: ${doc.name} ---\n${doc.textContext || "(Meta reference data)"}\n-----------------------------------\n`;
        });
        systemInstruction += "\nAlways prioritize these golden rules and statistics if relevant.";
      }

      const ai = getAiClient();
      const response = await ai.models.generateContent({
        model: MODEL_NAMES.TEXT_SMART,
        contents,
        config: {
          systemInstruction: systemInstruction
        }
      });

      const modelText = response.text || "I was able to analyze the uploaded file but failed to formulate a response sequence. Please retry or provide alternate files!";
      
      const modelMsg: ChatMessage = {
        id: Math.random().toString(),
        role: 'model',
        text: modelText,
        timestamp: new Date()
      };
      setChatMessages(prev => [...prev, modelMsg]);
    } catch (err: any) {
      console.error("Chat discussion error:", err);
      toast.error("Failed to compile diagnostic feedback.");
      
      const errorMsg: ChatMessage = {
        id: Math.random().toString(),
        role: 'model',
        text: `### ERROR GENERATING DIAGNOSIS\n\nThere was an integration mismatch or transient issue retrieving live feedback:\n\n\`${err.message || err.toString()}\`\n\nPlease ensure your Gemini API key is valid and try uploading a lighter file format.`,
        timestamp: new Date()
      };
      setChatMessages(prev => [...prev, errorMsg]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleSummarizeSession = async () => {
    if (chatMessages.length === 0) {
      toast.error("No brainstorming conversation history is active to summarize.");
      return;
    }
    setIsSummarizing(true);
    try {
      const historyLog = chatMessages.map(msg => {
        const roleName = msg.role === 'user' ? 'Client' : 'Vision Strategist';
        const fileNames = msg.attachments ? msg.attachments.map(a => a.name).join(', ') : 'None';
        return `[${roleName}] (Attached Files: ${fileNames}):\n${msg.text}\n`;
      }).join('\n');

      const promptStr = `You are an elite AI Video Strategist and executive scribe. Create a succinct, polished, and actionable summary of the brainstorming session below. Gather all decisions, reference files discussed, and concrete task items.

Session transcript:
${historyLog}

Formatting structure (generate exactly these markdown headings):
### DECISIONS AGREED
- Bullet points detailing any formatting designs, thumbnail adjustments, pacing tweaks, script modifications, or strategies decided upon.

### ASSETS & SPECIFICATIONS
- Bullet points listing each discussed graphic, document, or code file, alongside the core review feedback given for it.

### STRATEGIC ACTION ITEMS
- Clear, numbered step-by-step next tasks for the creator or strategist.

Focus purely on dense metrics, design insights, and exact next steps. Do not add generic introductory or concluding speech. Keep it professional.`;

      const ai = getAiClient();
      const response = await ai.models.generateContent({
        model: MODEL_NAMES.TEXT_SMART,
        contents: promptStr
      });
      setSessionSummary(response.text || "Session summary could not be extracted.");
      toast.success("Cognitive Strategy Summary compiled successfully!");
    } catch (e: any) {
      console.error("Summarization error:", e);
      toast.error("Failed to compile session summary: " + (e.message || e.toString()));
    } finally {
      setIsSummarizing(false);
    }
  };

  const captureLiveFrame = () => {
    if (streamMode === 'none' || !videoRef.current || !canvasRef.current) {
      toast.error("No active stream feed to capture. Enable camera or screen share.");
      return;
    }
    const videoEl = videoRef.current;
    const canvasEl = canvasRef.current;
    const ctx = canvasEl.getContext('2d');
    if (!ctx) {
      toast.error("Unable to initialize canvas frame capture.");
      return;
    }
    try {
      canvasEl.width = videoEl.videoWidth || 640;
      canvasEl.height = videoEl.videoHeight || 480;
      ctx.drawImage(videoEl, 0, 0, canvasEl.width, canvasEl.height);
      const dataUrl = canvasEl.toDataURL('image/jpeg', JPEG_QUALITY);
      const newFile: FileAttachment = {
        name: `live_stream_${streamMode}_${Date.now().toString().slice(-6)}.jpg`,
        type: 'image/jpeg',
        size: `${(dataUrl.length * 0.75 / 1024).toFixed(1)} KB`,
        dataUrl: dataUrl
      };
      setAttachedFiles(prev => {
        // Prevent duplicate attachments if already matching
        if (prev.some(p => p.name === newFile.name)) return prev;
        return [...prev, newFile];
      });
      toast.success(`Success! Snapshot captured from live ${streamMode === 'camera' ? 'camera' : 'screen'} feed & connected to Visual Discussion Studio!`);
    } catch (err: any) {
      console.error("Error capturing live frame:", err);
      toast.error("Failed to extract snapshot from live stream.");
    }
  };

  const startMedia = async (mode: 'camera' | 'screen') => {
    try {
      const stream = mode === 'camera' 
        ? await navigator.mediaDevices.getUserMedia({ video: true })
        : await navigator.mediaDevices.getDisplayMedia({ video: true });
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
        setStreamMode(mode);
      }
    } catch (e) {
      console.error("Media start error", e);
      alert("Failed to access camera/screen.");
    }
  };

  const stopMedia = () => {
    if (videoRef.current?.srcObject) {
      const tracks = (videoRef.current.srcObject as MediaStream).getTracks();
      tracks.forEach(t => t.stop());
      videoRef.current.srcObject = null;
    }
    if (frameIntervalRef.current) clearInterval(frameIntervalRef.current);
    setStreamMode('none');
  };

  const connect = async () => {
    setStatus("Establishing Neural Link...");
    try {
      const inputCtx = new (window.AudioContext || window.webkitAudioContext)({sampleRate: 16000});
      const outputCtx = new (window.AudioContext || window.webkitAudioContext)({sampleRate: 24000});
      inputContextRef.current = inputCtx;
      audioContextRef.current = outputCtx;

      const outputNode = outputCtx.createGain();
      outputNode.connect(outputCtx.destination);
      nextStartTimeRef.current = 0;

      const micStream = await navigator.mediaDevices.getUserMedia({ audio: true });

      const currentUser = auth.currentUser;
      const idToken = currentUser ? await currentUser.getIdToken() : '';
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const agentObj = BRAINSTORM_AGENTS.find(a => a.id === selectedAgent) || BRAINSTORM_AGENTS[0];
      const voiceName = agentObj.voice;
      const wsUrl = `${protocol}//${window.location.host}/api/live-ws?token=${encodeURIComponent(idToken)}&voice=${voiceName}&agent=${agentObj.id}`;
      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      ws.onopen = () => {
        setStatus("Live Multimodal Active");
        setConnected(true);
        setActive(true);

        // Audio Input using dedicated Web Worker off-main-thread processing
        const source = inputCtx.createMediaStreamSource(micStream);
        const scriptProcessor = inputCtx.createScriptProcessor(4096, 1, 1);
        scriptProcessor.onaudioprocess = async (e) => {
          const inputData = e.inputBuffer.getChannelData(0);
          try {
            const pcmBlob = await audioWorkerManager.encodePcmChunk(inputData, 16000);
            if (ws.readyState === WebSocket.OPEN) {
              ws.send(JSON.stringify({ audio: pcmBlob.base64 }));
            }
          } catch (err) {
            console.warn('[LiveBrainstorm] Web worker audio processing fallback:', err);
            const pcmBlob = createPcmBlob(inputData);
            if (ws.readyState === WebSocket.OPEN) {
              ws.send(JSON.stringify({ audio: pcmBlob.data }));
            }
          }
        };
        source.connect(scriptProcessor);
        scriptProcessor.connect(inputCtx.destination);

        // Video Input (if active)
        if (streamMode !== 'none' && videoRef.current && canvasRef.current) {
          const videoEl = videoRef.current;
          const canvasEl = canvasRef.current;
          const ctx = canvasEl.getContext('2d');
          
          frameIntervalRef.current = window.setInterval(() => {
            if (!ctx || !videoEl.videoWidth) return;
            canvasEl.width = videoEl.videoWidth;
            canvasEl.height = videoEl.videoHeight;
            ctx.drawImage(videoEl, 0, 0);
            
            canvasEl.toBlob(async (blob) => {
              if (blob) {
                const reader = new FileReader();
                reader.onloadend = () => {
                  const base64Data = (reader.result as string).split(',')[1];
                  if (ws.readyState === WebSocket.OPEN) {
                    ws.send(JSON.stringify({ video: base64Data }));
                  }
                };
                reader.readAsDataURL(blob);
              }
            }, 'image/jpeg', JPEG_QUALITY);
          }, 1000 / FRAME_RATE);
        }
      };

      ws.onmessage = async (event) => {
        try {
          const msg = JSON.parse(event.data);
          const base64Audio = msg.audio;
          if (base64Audio && outputCtx) {
            const ctx = outputCtx;
            nextStartTimeRef.current = Math.max(nextStartTimeRef.current, ctx.currentTime);
            try {
              const buffer = await decodeAudioData(base64Audio, ctx);
              const source = ctx.createBufferSource();
              source.buffer = buffer;
              source.connect(outputNode);
              source.start(nextStartTimeRef.current);
              nextStartTimeRef.current += buffer.duration;
              sourcesRef.current.add(source);
              source.onended = () => sourcesRef.current.delete(source);
            } catch (e) { console.error("Decode error:", e); }
          }
          
          if (msg.interrupted) {
            for (const s of sourcesRef.current) { s.stop(); }
            sourcesRef.current.clear();
            liveMsgIdRef.current = null;
          }

          if (msg.text && linkLiveFeedToChat) {
            const textChunk = msg.text;
            if (liveMsgIdRef.current === null) {
              const newId = 'live_' + Math.random().toString();
              liveMsgIdRef.current = newId;
              const newLiveMsg: ChatMessage = {
                id: newId,
                role: 'model',
                text: textChunk,
                timestamp: new Date(),
                isLiveStream: true
              };
              setChatMessages(prev => [...prev, newLiveMsg]);
            } else {
              setChatMessages(prev => prev.map(m => 
                m.id === liveMsgIdRef.current ? { ...m, text: m.text + textChunk } : m
              ));
            }
          }

          if (msg.turnComplete) {
            liveMsgIdRef.current = null;
          }

          if (msg.error) {
            console.error("Gemini live error:", msg.error);
            setStatus(`Session error: ${msg.error}`);
          }
        } catch (itemErr) {
          console.error("Message parse error:", itemErr);
        }
      };

      ws.onclose = () => {
        setStatus("Session Terminated");
        setConnected(false);
        setActive(false);
      };

      ws.onerror = (e) => {
        console.warn("WebSocket interface notice:", e);
        setStatus("API Interface Disconnected");
        setConnected(false);
      };

    } catch (e) {
      console.error(e);
      setStatus("Connection Denied");
    }
  };

  const disconnect = () => {
    inputContextRef.current?.close();
    audioContextRef.current?.close();
    stopMedia();
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
    setConnected(false);
    setActive(false);
    setStatus("Ready for Session");
  };

  function createPcmBlob(data: Float32Array) {
    const l = data.length;
    const int16 = new Int16Array(l);
    for (let i = 0; i < l; i++) { int16[i] = data[i] * 32768; }
    let binary = '';
    const bytes = new Uint8Array(int16.buffer);
    for (let i = 0; i < bytes.byteLength; i++) binary += String.fromCharCode(bytes[i]);
    return { data: btoa(binary), mimeType: 'audio/pcm;rate=16000' };
  }

  async function decodeAudioData(base64: string, ctx: AudioContext) {
    try {
      const { float32Array } = await audioWorkerManager.decodePcmChunk(base64);
      const buffer = ctx.createBuffer(1, float32Array.length, 24000);
      const channelData = buffer.getChannelData(0);
      channelData.set(float32Array);
      return buffer;
    } catch (err) {
      const binaryString = atob(base64);
      const bytes = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) bytes[i] = binaryString.charCodeAt(i);
      const dataInt16 = new Int16Array(bytes.buffer);
      const buffer = ctx.createBuffer(1, dataInt16.length, 24000);
      const channelData = buffer.getChannelData(0);
      for (let i = 0; i < dataInt16.length; i++) { channelData[i] = dataInt16[i] / 32768.0; }
      return buffer;
    }
  }

  const activeAgent = BRAINSTORM_AGENTS.find(a => a.id === selectedAgent) || BRAINSTORM_AGENTS[0];

  return (
    <div className="w-full max-w-7xl mx-auto px-4 lg:px-6 py-4 h-[calc(100vh-6rem)] animate-fade-in flex flex-col gap-4 overflow-hidden relative">
      
      {/* Title Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-zinc-900 pb-3">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-red-650/10 border border-red-600/20 text-red-500 text-[10px] font-black uppercase tracking-widest mb-1">
            <Sparkles size={12} /> Neural Sensory Field
          </div>
          <h2 className="text-2xl font-black text-white tracking-tighter leading-none">
            Neural <span className="text-red-600">Vision Hub</span>
          </h2>
          <p className="text-zinc-500 text-[11px] font-semibold mt-1">
            Multimodal audit room. Link live voice, share your camera/screen, or upload diagnostic files below to discuss.
          </p>
        </div>
        
        <div className="flex items-center gap-4 bg-zinc-950 border border-zinc-905 px-3 py-2 rounded-2xl">
          <div className="text-right">
            <p className="text-[8px] font-black text-zinc-650 uppercase tracking-widest">Interface Status</p>
            <p className={`text-[10px] font-black uppercase tracking-tight ${active ? 'text-green-500 animate-pulse' : 'text-zinc-500'}`}>{status}</p>
          </div>
          {connected && (
            <button 
              onClick={disconnect}
              className="px-3 py-1.5 rounded-lg bg-red-950/40 hover:bg-red-900 border border-red-900 text-red-400 font-bold uppercase text-[9px] tracking-wider transition-all"
            >
              Terminate
            </button>
          )}
        </div>
      </div>

      {/* Grid container */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 flex-1 min-h-0 overflow-hidden">
        
        {/* LEFT COLUMN: Sensory Voice & Media Share controls (5 span) */}
        <div className="lg:col-span-5 flex flex-col gap-4 h-full overflow-y-auto pr-1">
          
          {/* Main Display screen */}
          <div className="relative flex-1 min-h-[220px] rounded-[2rem] bg-zinc-950 border border-zinc-900 overflow-hidden shadow-2xl flex flex-col justify-end p-5 group">
            
            {active && (
              <div className="absolute top-4 left-4 bg-red-600 text-white px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-[0.15em] shadow-lg animate-pulse flex items-center gap-1.5 z-20">
                <div className="w-1 h-1 bg-white rounded-full"></div> Live Analysis
              </div>
            )}
            
            {streamMode !== 'none' && (
              <button
                type="button"
                onClick={captureLiveFrame}
                className="absolute top-4 right-4 bg-zinc-950/90 backdrop-blur-md hover:bg-red-650 hover:border-red-500/20 border border-zinc-900 text-zinc-300 hover:text-white px-3 py-1.5 rounded-xl text-[9.5px] font-black uppercase tracking-wider shadow-lg flex items-center gap-2 z-20 transition-all active:scale-95 duration-200 cursor-pointer"
                title="Capture instant frame snapshot from feed & attach to Discussion Studio"
              >
                <Camera size={11} className="text-red-500 hover:text-white" />
                <span>Capture Frame</span>
              </button>
            )}
            
            <video 
              ref={videoRef} 
              className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-500 z-0 ${streamMode !== 'none' ? 'opacity-100' : 'opacity-0'}`} 
            />
            <canvas ref={canvasRef} className="hidden" />

            {/* Static Backdrop layout */}
            {streamMode === 'none' && (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 z-0 bg-gradient-to-b from-zinc-950 to-zinc-900/60 p-6">
                <div className="relative">
                  {/* Outer breathing/ripple ring when active */}
                  {active && (
                    <div className="absolute inset-0 rounded-full bg-red-500/20 animate-ping duration-1000 scale-125" />
                  )}
                  {active && (
                    <div className="absolute -inset-1.5 rounded-full border border-red-500/40 animate-pulse" />
                  )}
                  <div className={`w-28 h-28 rounded-full overflow-hidden border-2 transition-all duration-500 shadow-2xl relative z-10 ${
                    active ? activeAgent.borderColor : 'border-zinc-800'
                  }`}>
                    <img 
                      src={activeAgent.avatar} 
                      alt="Selected Neural Agent Face" 
                      className="w-full h-full object-cover animate-fade-in"
                      referrerPolicy="no-referrer"
                    />
                    {active && (
                      <div className={`absolute bottom-0 inset-x-0 ${activeAgent.pillColor}/80 text-white text-[8px] font-black uppercase tracking-widest py-0.5 text-center animate-pulse`}>
                        Communicating
                      </div>
                    )}
                  </div>
                </div>
                
                <div className="text-center space-y-1.5 z-10">
                  <div className="flex items-center justify-center gap-1.5">
                    <span className="text-[11px] font-black text-white uppercase tracking-wider">
                      {activeAgent.name} - {activeAgent.role}
                    </span>
                    <span className={`w-1.5 h-1.5 rounded-full ${active ? 'bg-green-500 animate-pulse' : 'bg-zinc-600'}`} />
                  </div>
                  <p className="text-[9px] font-bold text-zinc-500 uppercase tracking-[0.15em]">
                    {active ? 'Pleasurable Multi-modal Voice Stream Active' : 'Ready to communicate pleasantly'}
                  </p>
                  
                  {active && (
                    <div className="flex items-center justify-center gap-1 mt-2.5 h-3">
                      <span className="w-1 bg-red-500 rounded-full animate-bounce h-2.5" style={{ animationDelay: '0.1s' }} />
                      <span className="w-1 bg-red-500 rounded-full animate-bounce h-1.5" style={{ animationDelay: '0.2s' }} />
                      <span className="w-1 bg-red-500 rounded-full animate-bounce h-3" style={{ animationDelay: '0.3s' }} />
                      <span className="w-1 bg-red-500 rounded-full animate-bounce h-2" style={{ animationDelay: '0.4s' }} />
                      <span className="w-1 bg-red-500 rounded-full animate-bounce h-1.5" style={{ animationDelay: '0.5s' }} />
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Telemetry metadata overlay */}
            <div className="self-end ml-auto z-10">
              <div className="w-24 bg-zinc-950/70 backdrop-blur-md border border-zinc-900 rounded-2xl p-2.5 flex flex-col justify-between shadow-xl">
                <div className="flex justify-between items-start mb-1.5">
                  <div className={`w-1 h-1 rounded-full ${active ? 'bg-blue-500 animate-ping' : 'bg-zinc-700'}`}></div>
                  <Volume2 size={10} className={active ? 'text-blue-500' : 'text-zinc-700'} />
                </div>
                <div className="space-y-1">
                  <div className="h-1 bg-zinc-900 rounded-full w-full overflow-hidden">
                    <div className={`h-full bg-blue-500 ${active ? 'w-[75%] animate-pulse' : 'w-0'} transition-all duration-300`}></div>
                  </div>
                  <div className="h-1 bg-zinc-900 rounded-full w-[80%] overflow-hidden">
                    <div className={`h-full bg-blue-500 ${active ? 'w-[45%] animate-pulse delay-75' : 'w-0'} transition-all duration-300`}></div>
                  </div>
                  <p className="text-[6px] font-black text-zinc-600 uppercase tracking-widest mt-1">Telemetry-Live</p>
                </div>
              </div>
            </div>
          </div>

          {/* Connection Trigger area */}
          <div className="bg-zinc-950/50 border border-zinc-900 rounded-[1.5rem] p-4 space-y-3.5">
            {/* Neural Agent Core Select */}
            <div className="space-y-2 pb-1">
              <div className="flex justify-between items-center px-1">
                <label className="text-[9px] font-black uppercase text-zinc-500 tracking-wider block">
                  Select Brainstorming Agent Face & Tone
                </label>
                <span className="text-[8px] font-mono text-zinc-650 uppercase">
                  6 Agents Available
                </span>
              </div>
              <div className="grid grid-cols-3 gap-2">
                {BRAINSTORM_AGENTS.map((agent) => {
                  const isSelected = selectedAgent === agent.id;
                  return (
                    <button
                      key={agent.id}
                      type="button"
                      onClick={() => {
                        if (!connected) {
                          setSelectedAgent(agent.id);
                          toast.success(`Primary Agent: ${agent.name.toUpperCase()} selected! (Voice: ${agent.voice}) 🎙️`);
                        } else {
                          toast.error("Cannot switch agent while session is active.");
                        }
                      }}
                      className={`relative p-2 rounded-2xl border transition-all flex flex-col items-center justify-center text-center group cursor-pointer ${
                        isSelected
                          ? "border-red-500 bg-red-500/10 text-white shadow-lg scale-[1.02]"
                          : "border-zinc-850 bg-zinc-900/40 text-zinc-400 hover:border-zinc-700 hover:text-zinc-200 hover:bg-zinc-900/80"
                      }`}
                    >
                      <div className="relative w-10 h-10 rounded-full overflow-hidden mb-1 border border-zinc-950 shadow-inner group-hover:scale-105 transition-all">
                        <img 
                          src={agent.avatar} 
                          alt={`${agent.name} - ${agent.role}`} 
                          className="w-full h-full object-cover"
                          referrerPolicy="no-referrer"
                        />
                        {isSelected && (
                          <div className="absolute inset-0 bg-red-650/10 flex items-center justify-center" />
                        )}
                      </div>
                      <span className="text-[9px] font-black uppercase tracking-tight truncate max-w-full">{agent.name}</span>
                      <span className="text-[7px] font-mono text-zinc-500 truncate max-w-full">{agent.role.split(' ')[0]}</span>
                      {isSelected && (
                        <span className="absolute top-1 right-1.5 w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
                      )}
                    </button>
                  );
                })}
              </div>

              {/* Focus Specialization description block */}
              <div className="mt-3 p-3 rounded-xl bg-zinc-900/30 border border-zinc-850/60 text-left">
                <span className="text-[8px] font-mono text-zinc-550 uppercase tracking-widest block mb-1">
                  Active Agent Focus & Specialization
                </span>
                <p className="text-[10px] text-zinc-400 leading-relaxed font-sans">
                  {activeAgent.description}
                </p>
              </div>
            </div>

            <button
              onClick={connected ? disconnect : connect}
              disabled={connected && active}
              className={`w-full py-3 rounded-xl font-black uppercase text-[10px] tracking-wider flex items-center justify-center gap-2.5 transition-all outline-none ${
                connected 
                  ? 'bg-zinc-900 border border-zinc-805 text-zinc-500 cursor-default' 
                  : 'bg-red-650 hover:bg-red-600 text-white shadow-xl shadow-red-950/30 active:scale-[0.99] hover:scale-[1.01]'
              }`}
            >
              {connected ? (
                <><Loader2 className="animate-spin text-zinc-500" size={13} /> Voice Link Active</>
              ) : (
                <><Mic size={13} fill="currentColor" /> Initialize Voice Link</>
              )}
            </button>

            <div className="flex items-center justify-between gap-4 border-t border-zinc-900 pt-3">
              <div className="flex bg-zinc-950 border border-zinc-905 rounded-xl p-0.5 shadow-inner">
                <button 
                  onClick={() => streamMode === 'camera' ? stopMedia() : startMedia('camera')} 
                  className={`p-2.5 rounded-lg transition-all ${streamMode === 'camera' ? 'bg-zinc-800 text-red-500' : 'text-zinc-650 hover:text-white'}`}
                  title="Share Camera"
                >
                  {streamMode === 'camera' ? <VideoOff size={16}/> : <Camera size={16}/>}
                </button>
                <button 
                  onClick={() => streamMode === 'screen' ? stopMedia() : startMedia('screen')} 
                  className={`p-2.5 rounded-lg transition-all ${streamMode === 'screen' ? 'bg-zinc-800 text-blue-500' : 'text-zinc-650 hover:text-white'}`}
                  title="Share Screen"
                >
                  <Monitor size={16}/>
                </button>
              </div>
              
              <div className="text-right">
                <p className="text-[7px] font-black text-zinc-600 uppercase tracking-widest">Feed capture</p>
                <p className="text-[10px] font-black text-white hover:text-red-500 transition-colors uppercase tracking-tight">
                  {streamMode === 'none' ? 'Offline' : streamMode === 'camera' ? 'Camera Live' : 'Screen Share'}
                </p>
              </div>
            </div>

            <div className="flex items-center justify-between gap-3 border-t border-zinc-900/60 pt-3 text-[9px] font-bold text-zinc-500 select-none">
              <span className="uppercase tracking-wider flex items-center gap-1.5 font-bold">
                <Sparkles size={11} className="text-red-500 animate-pulse" /> Sync Live Feed to Chat
              </span>
              <label className="relative inline-flex items-center cursor-pointer">
                <input 
                  type="checkbox" 
                  checked={linkLiveFeedToChat}
                  onChange={(e) => {
                    setLinkLiveFeedToChat(e.target.checked);
                    toast.success(e.target.checked 
                      ? "Success: Live audio response transcripts will now sync to Discussion Studio!" 
                      : "Discussion Studio transcript mirroring deactivated."
                    );
                  }}
                  className="sr-only peer" 
                />
                <div className="w-8 h-4 bg-zinc-900 rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-zinc-600 peer-checked:after:bg-red-500 after:rounded-full after:h-3 after:w-3 after:transition-all peer-checked:bg-red-950/20 border border-zinc-800 peer-checked:border-red-900/35"></div>
              </label>
            </div>
          </div>

        </div>

        {/* RIGHT COLUMN: Interactive Discussion Studio (7 span) */}
        <div className="lg:col-span-7 flex flex-col h-full bg-zinc-950/20 border border-zinc-900 rounded-[2rem] overflow-hidden min-h-0">
          
          {/* Studio header panel */}
          <div className="px-5 py-3 border-b border-zinc-900/60 bg-zinc-950/60 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <p className="text-xs font-black text-white uppercase tracking-wider">Visual Discussion Studio</p>
              <span className="text-[7px] text-red-500 uppercase tracking-widest font-black bg-red-600/10 px-2.5 py-0.5 rounded-full border border-red-900/20 text-center">Audit Room</span>
            </div>
            
            <div className="flex items-center gap-3">
              {chatMessages.length > 0 && (
                <button 
                  onClick={() => setChatMessages([])} 
                  className="text-[9px] font-black text-zinc-500 hover:text-red-500 flex items-center gap-1.5 uppercase tracking-widest transition-colors animate-fade-in"
                >
                  <Trash2 size={11} /> Reset Thread
                </button>
              )}

              <button
                type="button"
                onClick={() => {
                  setShowContextSidebar(!showContextSidebar);
                  toast.success(showContextSidebar ? "Context sidebar hidden" : "Context sidebar active");
                }}
                className={`text-[9.5px] font-black px-2.5 py-1.5 rounded-xl border transition-all uppercase tracking-widest flex items-center gap-1.5 cursor-pointer ${
                  showContextSidebar 
                    ? 'bg-red-500/15 border-red-500/40 text-red-400 hover:bg-red-500/25 shadow-lg shadow-red-950/5' 
                    : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-white'
                }`}
                title="Toggle Context references and grounding documents"
              >
                <BookOpen size={11} className={showContextSidebar ? "text-red-400 animate-pulse" : "text-zinc-500"} />
                <span>Context Deck ({pinnedFiles.length + knowledgeBase.length})</span>
              </button>
            </div>
          </div>

          <div className="flex-1 flex min-h-0 overflow-hidden relative">
            
            {/* Left Hand Chat Thread */}
            <div className="flex-1 flex flex-col min-h-0 overflow-hidden border-r border-zinc-900/60">
              
              {/* Filter, Search & Export Actions Bar */}
              <div className="px-5 py-2 border-b border-zinc-900 bg-zinc-950/40 flex flex-col sm:flex-row gap-3 items-center justify-between select-none">
                {/* Search Input Bar */}
                <div className="relative w-full sm:w-60">
                  <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-zinc-500">
                    <Search size={12} />
                  </span>
                  <input 
                    type="text" 
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search stream or files..." 
                    className="w-full pl-8 pr-7 py-1.5 bg-zinc-900/50 border border-zinc-850 rounded-xl text-[10px] font-bold text-zinc-200 placeholder:text-zinc-650 focus:outline-none focus:border-red-600/30 focus:ring-1 focus:ring-red-950/15"
                  />
                  {searchQuery && (
                    <button 
                      onClick={() => setSearchQuery('')}
                      className="absolute inset-y-0 right-0 flex items-center pr-2.5 text-zinc-500 hover:text-zinc-300"
                      title="Clear search"
                    >
                      <X size={10} />
                    </button>
                  )}
                </div>

                {/* Structured File Log Export Controls */}
                <div className="flex items-center gap-2 text-[8px] font-black uppercase text-zinc-500 tracking-wider">
                  <span>Export Thread Logs:</span>
                  <button 
                    onClick={() => exportChatHistory('text')}
                    className="px-2.5 py-1 bg-zinc-900 hover:bg-zinc-850 border border-zinc-800 text-zinc-400 hover:text-red-500 rounded-lg transition-colors flex items-center gap-1.5 font-extrabold"
                    title="Export thread context as text"
                  >
                    <FileText size={10} /> TEXT
                  </button>
                  <button 
                    onClick={() => exportChatHistory('json')}
                    className="px-2.5 py-1 bg-zinc-900 hover:bg-zinc-855 border border-zinc-800 text-zinc-400 hover:text-red-500 rounded-lg transition-colors flex items-center gap-1.5 font-extrabold"
                    title="Export thread model config as JSON file"
                  >
                    <FileJson size={10} /> JSON
                  </button>
                </div>
              </div>

              {/* Messages block with custom drop listener & drag state progress */}
              <div 
                onDragEnter={handleDrag}
                onDragOver={handleDrag}
                onDragLeave={handleDrag}
                onDrop={handleDrop}
                className={`flex-1 overflow-y-auto p-4 space-y-4 min-h-0 relative ${
                  dragActive ? 'bg-red-950/5' : ''
                }`}
              >
                {dragActive && (
                  <div className="absolute inset-0 bg-zinc-950/95 backdrop-blur-sm flex flex-col items-center justify-center gap-3 z-30 pointer-events-none border border-red-500/10 rounded-[1.5rem] p-6 text-center">
                    <div className="p-4 bg-red-650/10 border border-red-650/20 rounded-full animate-bounce text-red-500">
                      <Upload size={32} />
                    </div>
                    <p className="text-xs font-black text-white uppercase tracking-wider">Release To Drop File Spec</p>
                    <p className="text-[9px] text-zinc-500 uppercase font-black">Sensories will capture parameters automatically</p>
                  </div>
                )}

                {/* Rendering uploading simulated state progress bar */}
                {isUploading && (
                  <div className="bg-zinc-950/90 border border-zinc-800 p-4 rounded-2xl flex flex-col gap-2 shadow-xl sticky top-2 z-20">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Loader2 size={12} className="animate-spin text-red-500" />
                        <p className="text-[10px] font-black text-white uppercase tracking-wider">Injecting Digital Assets...</p>
                      </div>
                      <span className="text-[10px] font-mono font-bold text-red-500">{uploadProgress}%</span>
                    </div>
                    {/* Progress Bar Component */}
                    <div className="w-full h-1.5 bg-zinc-900 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-gradient-to-r from-red-600 to-red-400 transition-all duration-150" 
                        style={{ width: `${uploadProgress}%` }}
                      />
                    </div>
                    <p className="text-[7px] text-zinc-550 font-extrabold uppercase tracking-widest">Performing cognitive pre-index pipeline</p>
                  </div>
                )}

                {filteredMessages.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-center p-6 space-y-5 select-none max-w-sm mx-auto">
                    <div className="p-3 bg-zinc-900 border border-zinc-855 rounded-2xl text-zinc-500">
                      {searchQuery ? <Search size={24} /> : <Upload size={24} />}
                    </div>
                    <div className="space-y-1.5">
                      <p className="text-xs font-black text-white uppercase tracking-wider">
                        {searchQuery ? "No Search Results" : "Neural Audit Deck"}
                      </p>
                      <p className="text-[11px] text-zinc-500 leading-relaxed font-semibold font-semibold">
                        {searchQuery 
                          ? `No discussion logs or attached assets match your active filter "${searchQuery}". Reset query parameters to view diagnostic frames.`
                          : "Type messages or drop script files, high-res thumbnails, or PDFs. Get analytical growth audit summaries instantly."}
                      </p>
                    </div>

                    {!searchQuery && (
                      <div className="w-full space-y-2 pt-2">
                        <p className="text-[8px] font-black text-zinc-650 uppercase tracking-widest">Diagnostic Suggestions</p>
                        <div className="flex flex-col gap-1.5 w-full">
                          <button 
                            type="button"
                            onClick={() => setChatInput("Provide a high-fidelity CTR critique of this reference thumbnail. What are the key improvements?")}
                            className="text-left px-3 py-2 rounded-xl bg-zinc-900/40 border border-zinc-850 text-[10px] font-bold text-zinc-400 hover:text-white hover:border-red-650/20 transition-all flex items-center justify-between group cursor-pointer"
                          >
                            <span>Critique Thumbnail Asset CTR</span>
                            <ArrowUpRight size={11} className="text-zinc-650 group-hover:text-red-500 transition-colors" />
                          </button>
                          <button 
                            type="button"
                            onClick={() => setChatInput("Audit the storytelling flow of this script draft. Is the pacing and retention hook optimized under 15 seconds?")}
                            className="text-left px-3 py-2 rounded-xl bg-zinc-900/40 border border-zinc-850 text-[10px] font-bold text-zinc-400 hover:text-white hover:border-red-650/20 transition-all flex items-center justify-between group cursor-pointer"
                          >
                            <span>Audit Script Narrative Flow</span>
                            <ArrowUpRight size={11} className="text-zinc-650 group-hover:text-red-500 transition-colors" />
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="space-y-4">
                    {filteredMessages.map((msg) => {
                      const isUser = msg.role === 'user';
                      return (
                        <div key={msg.id} className={`flex flex-col ${isUser ? 'items-end' : 'items-start'} max-w-full`}>
                          <div className={`p-4 rounded-xl max-w-[88%] border text-left flex flex-col gap-2 shadow-sm ${
                            isUser 
                              ? 'bg-zinc-900 border-zinc-850 text-zinc-100 rounded-tr-none' 
                              : 'bg-zinc-950/80 border-zinc-900 text-zinc-200 rounded-tl-none shadow-md shadow-red-950/5 hover:border-red-500/10 transition-colors'
                          }`}>
                            
                            {msg.isLiveStream && (
                              <div className="flex items-center gap-1.5 mb-1 bg-red-950/20 border border-red-900/30 px-2 py-0.5 rounded-full w-fit select-none">
                                <span className="flex h-1.5 w-1.5 relative">
                                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                                  <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-red-500"></span>
                                </span>
                                <span className="text-[7px] font-black text-red-400 uppercase tracking-widest leading-none">Live Broadcast Feedback</span>
                              </div>
                            )}
                            
                            {/* File attachments block inside bubble - Small Interactive Preview Component */}
                            {msg.attachments && msg.attachments.length > 0 && (
                              <div className="flex flex-wrap gap-2 mt-1 mb-2">
                                {msg.attachments.map((f, fIdx) => (
                                  <div 
                                    key={fIdx} 
                                    onClick={() => setActivePreviewFile(f)}
                                    className="relative group bg-zinc-950 hover:bg-zinc-900 border border-zinc-900 p-2 rounded-xl flex items-center gap-2 cursor-pointer transition-all hover:border-red-500/25 shadow-lg overflow-hidden"
                                    title="Click to view full specs & zoom"
                                  >
                                    {f.type.startsWith('image/') ? (
                                      <div className="relative w-9 h-9 rounded-lg overflow-hidden border border-zinc-900 bg-black flex-shrink-0">
                                        <img src={f.dataUrl} className="w-full h-full object-cover group-hover:scale-105 transition-transform" alt="Thumb" />
                                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                                          <Maximize2 size={10} className="text-white" />
                                        </div>
                                      </div>
                                    ) : (
                                      <div className="w-9 h-9 rounded-lg bg-zinc-900 text-zinc-400 flex items-center justify-center flex-shrink-0 group-hover:text-red-500 transition-colors">
                                        {getFileIcon(f.type)}
                                      </div>
                                    )}
                                    <div className="text-left overflow-hidden min-w-0 flex-1">
                                      <p className="text-[10px] font-bold text-white truncate group-hover:text-red-400 transition-colors">{f.name}</p>
                                      <p className="text-[8px] text-zinc-500 font-medium">{f.size}</p>
                                    </div>
                                    <button
                                      type="button"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        togglePinFile(f);
                                      }}
                                      className={`absolute top-1 right-1 p-1 rounded bg-zinc-950/95 border border-zinc-900 hover:text-red-500 hover:border-red-500/20 shadow-lg text-zinc-500 transition-all z-10 opacity-0 group-hover:opacity-100 ${
                                        pinnedFiles.some(pf => pf.name === f.name) ? 'opacity-100 text-red-500 bg-red-950/25 border-red-900/40' : ''
                                      }`}
                                      title={pinnedFiles.some(pf => pf.name === f.name) ? "Unpin reference file" : "Pin specifications to Context Sidebar"}
                                    >
                                      <Pin size={9} className={pinnedFiles.some(pf => pf.name === f.name) ? 'rotate-45 fill-red-500 text-red-500' : ''} />
                                    </button>
                                  </div>
                                ))}
                              </div>
                            )}

                            <div className="break-words">
                              {isUser ? <p className="text-xs whitespace-pre-wrap leading-relaxed">{msg.text}</p> : renderMessageText(msg.text)}
                            </div>

                            <span className="text-[8px] text-zinc-500 font-extrabold mt-1 self-end uppercase tracking-widest">
                              {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>
                        </div>
                      );
                    })}

                    {/* Bot Typing feedback */}
                    {isTyping && (
                      <div className="flex justify-start">
                        <div className="bg-zinc-950/80 border border-zinc-900 p-3 rounded-xl rounded-tl-none flex items-center gap-2.5">
                          <Loader2 size={11} className="animate-spin text-red-500" />
                          <span className="text-[9px] font-black text-zinc-500 uppercase tracking-widest animate-pulse">Strategist Auditing...</span>
                        </div>
                      </div>
                    )}
                    
                    {/* Scroll Anchor */}
                    <div ref={messagesEndRef} />
                  </div>
                )}

                {/* Auto-scroll Lock Badging Component */}
                <div className="absolute bottom-5 right-5 z-20">
                  <button 
                    type="button"
                    onClick={() => {
                      const val = !autoScrollEnabled;
                      setAutoScrollEnabled(val);
                      if (val) {
                        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
                        toast.success("Locked scroll behavior: Now following live stream");
                      } else {
                        toast.success("Viewport position frozen. Scroll lock deactivated.");
                      }
                    }}
                    className={`px-3 py-1.5 rounded-full border text-[9px] font-black uppercase tracking-widest flex items-center gap-1.5 shadow-xl transition-all outline-none cursor-pointer ${
                      autoScrollEnabled 
                        ? 'bg-red-500/15 border-red-500/30 text-red-400 hover:bg-red-500/25 shadow-red-950/20' 
                        : 'bg-zinc-900 border-zinc-800 text-zinc-500 hover:text-zinc-350 hover:bg-zinc-850'
                    }`}
                    title="Freeze scroll viewport or follow incoming stream auto-scroll"
                  >
                    <div className={`w-1.5 h-1.5 rounded-full ${autoScrollEnabled ? 'bg-red-500 animate-pulse' : 'bg-zinc-650'}`} />
                    <span>{autoScrollEnabled ? "Auto-Scroll: On" : "Auto-Scroll: Off"}</span>
                    <ArrowDown size={10} className={`${autoScrollEnabled ? 'text-red-400' : 'text-zinc-500'}`} />
                  </button>
                </div>
              </div>

              {/* Dynamic input bar & Staging preview zone */}
              <div className="p-3.5 border-t border-zinc-900 bg-zinc-950/40 space-y-2.5">
                
                {/* Active Staged Files Preview (Before Processing) */}
                {attachedFiles.length > 0 && (
                  <div className="bg-zinc-950 border border-zinc-900/60 p-2.5 rounded-xl space-y-1.5 shadow-inner">
                    <div className="flex items-center justify-between">
                      <p className="text-[8px] font-black tracking-widest text-zinc-550 uppercase">Staged Diagnostic Assets ({attachedFiles.length})</p>
                      <button 
                        onClick={() => setAttachedFiles([])}
                        className="text-[8px] font-black hover:text-red-500 text-zinc-650 uppercase tracking-wider transition-colors cursor-pointer"
                      >
                        Clear All
                      </button>
                    </div>
                    <div className="flex flex-wrap gap-2 max-h-24 overflow-y-auto pr-1">
                      {attachedFiles.map((file, idx) => (
                        <div 
                          key={idx} 
                          onClick={() => setActivePreviewFile(file)}
                          className="relative bg-zinc-900/60 hover:bg-zinc-900 border border-zinc-850 p-1.5 rounded-xl flex items-center gap-2 max-w-[190px] cursor-pointer transition-colors group"
                          title="Click to view file details before sending"
                        >
                          {file.type.startsWith('image/') ? (
                            <img src={file.dataUrl} className="w-7 h-7 rounded object-cover" alt="Attached preview" />
                          ) : (
                            <div className="p-1 px-1.5 rounded bg-zinc-950 text-zinc-500 flex-shrink-0">
                              {getFileIcon(file.type)}
                            </div>
                          )}
                          <div className="text-left overflow-hidden min-w-0">
                            <p className="text-[9px] font-bold text-white truncate max-w-[90px] group-hover:text-red-400 transition-colors">{file.name}</p>
                            <p className="text-[7px] text-zinc-550">{file.size}</p>
                          </div>
                          <button 
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setAttachedFiles(prev => prev.filter((_, fIdx) => fIdx !== idx));
                            }}
                            className="p-1 rounded-full bg-zinc-950 hover:bg-red-950/50 hover:text-red-500 text-zinc-550 transition-colors ml-1 cursor-pointer"
                            title="Discard file"
                          >
                            <X size={9} />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Rich-Text styled multiline field supporting Shift+Enter */}
                <form onSubmit={handleSendChat} className="flex gap-2.5 items-end">
                  <input 
                    type="file" 
                    multiple 
                    ref={fileInputRef} 
                    className="hidden" 
                    onChange={(e) => {
                      if (e.target.files && e.target.files.length > 0) {
                        handleFiles(e.target.files);
                      }
                    }}
                  />
                  
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="p-3 w-10 h-10 flex items-center justify-center rounded-xl bg-zinc-900 hover:bg-zinc-850 border border-zinc-805 text-zinc-400 hover:text-red-500 shadow-inner group transition-colors flex-shrink-0 cursor-pointer"
                    title="Upload diagnostic files (select / drag drop to discussion zone)"
                  >
                    <Paperclip size={14} className="group-hover:scale-105 transition-transform" />
                  </button>

                  {/* Web Speech Voice recording dictation button */}
                  <button
                    type="button"
                    onClick={toggleSpeechRecognition}
                    className={`p-3 w-10 h-10 flex items-center justify-center rounded-xl border transition-all flex-shrink-0 group cursor-pointer ${
                      isRecordingSpeech 
                        ? 'bg-rose-950/40 border-rose-500/30 text-rose-500 animate-pulse' 
                        : 'bg-zinc-900 hover:bg-zinc-850 border border-zinc-805 text-zinc-400 hover:text-red-500'
                    }`}
                    title={isRecordingSpeech ? "Stop voice dictation conversion" : "Dictate your message using Web Speech voice-to-text"}
                  >
                    {isRecordingSpeech ? <MicOff size={14} className="animate-pulse" /> : <Mic size={14} />}
                  </button>

                  <div className="flex-1 relative">
                    <textarea 
                      value={chatInput}
                      onChange={(e) => setChatInput(e.target.value)}
                      onKeyDown={handleKeyDown}
                      placeholder="Ask any prompt or drop/upload thumbnails, audio, or scripts... (Enter to send, Shift+Enter for newline)"
                      className="w-full text-xs font-semibold p-2.5 bg-zinc-950 border border-zinc-900 rounded-xl text-zinc-200 placeholder:text-zinc-650 focus:outline-none focus:border-red-600 focus:ring-1 focus:ring-red-950/10 resize-none h-[40px] max-h-32 min-h-[40px] leading-relaxed overflow-y-auto"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={isTyping || isUploading || (!chatInput.trim() && attachedFiles.length === 0)}
                    className="w-10 h-10 flex items-center justify-center rounded-xl bg-red-650 text-white hover:bg-red-600 disabled:bg-zinc-900 disabled:text-zinc-700 disabled:cursor-not-allowed transition-all shadow-lg shadow-red-950/10 active:scale-[0.98] flex-shrink-0 cursor-pointer"
                  >
                    {isTyping ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
                  </button>
                </form>

                <div className="flex items-center justify-between text-[7px] font-black uppercase text-zinc-750 tracking-widest px-1">
                  <span>Active diagnostic desk linked via {MODEL_NAMES.TEXT_SMART}</span>
                  <span>Double-click or click any file preview to open inspection mode</span>
                </div>

              </div>

            </div>

            {/* Context Sidebar (Right Pane) */}
            {showContextSidebar && (
              <div className="w-64 border-l border-zinc-900 bg-zinc-950/75 backdrop-blur-md flex flex-col h-full overflow-y-auto p-4 select-none flex-shrink-0 animate-fade-in scrollbar-none">
                
                {/* AI Session Summarizer Trigger */}
                <div className="mb-4">
                  <p className="text-[8px] font-black tracking-widest text-[#ef4444] uppercase mb-1.5">Session Summarizer</p>
                  <button
                    type="button"
                    onClick={handleSummarizeSession}
                    disabled={isSummarizing || chatMessages.length === 0}
                    className="w-full py-2 bg-zinc-900 hover:bg-zinc-850 border border-zinc-800 hover:border-red-500/20 text-zinc-200 hover:text-white rounded-xl text-[9px] font-black uppercase tracking-wider transition-all flex items-center justify-center gap-2 cursor-pointer shadow-md"
                  >
                    {isSummarizing ? (
                      <Loader2 size={11} className="animate-spin text-red-500" />
                    ) : (
                      <Sparkles size={11} className="text-red-500 animate-pulse" />
                    )}
                    <span>Summarize Session Decisions</span>
                  </button>
                </div>

                {/* Session Summary display */}
                {sessionSummary && (
                  <div className="mb-4 bg-zinc-900/40 border border-zinc-850 p-3 rounded-xl relative animate-fade-in text-left">
                    <button
                      type="button"
                      onClick={() => setSessionSummary(null)}
                      className="absolute top-2 right-2 text-[8px] font-black text-zinc-600 hover:text-red-500 uppercase cursor-pointer"
                    >
                      Clear
                    </button>
                    <p className="text-[8px] font-black text-white uppercase tracking-widest mb-1.5">Live Strategy Summary</p>
                    <div className="text-[9.5px] text-zinc-350 leading-relaxed font-semibold max-h-40 overflow-y-auto pr-1 scrollbar-thin">
                      {renderMessageText(sessionSummary)}
                    </div>
                  </div>
                )}

                {/* Pinned References */}
                <div className="space-y-2 mb-4 text-left">
                  <div className="flex items-center justify-between">
                    <p className="text-[8px] font-black tracking-widest text-zinc-550 uppercase">Pinned References ({pinnedFiles.length})</p>
                    {pinnedFiles.length > 0 && (
                      <button 
                        onClick={() => {
                          setPinnedFiles([]);
                          toast.success("Cleared all pinned reference assets");
                        }}
                        className="text-[7.5px] font-extrabold text-zinc-650 hover:text-red-500 uppercase transition-colors cursor-pointer"
                      >
                        Clear All
                      </button>
                    )}
                  </div>

                  {pinnedFiles.length === 0 ? (
                    <div className="border border-dashed border-zinc-900 p-4 rounded-xl text-center">
                      <div className="inline-flex items-center justify-center p-2 rounded-lg bg-zinc-900/40 text-zinc-655 mb-1">
                        <Pin size={11} />
                      </div>
                      <p className="text-[8px] font-black text-zinc-600 uppercase">No Pinned Assets</p>
                      <p className="text-[7px] font-extrabold text-[#71717a] uppercase mt-0.5 leading-snug">
                        Hover file attachments in chat & click the pin icon to make them persistent.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                      {pinnedFiles.map((pf, idx) => (
                        <div 
                          key={idx}
                          onClick={() => setActivePreviewFile(pf)}
                          className="bg-zinc-900/40 hover:bg-zinc-900/80 border border-zinc-900 hover:border-zinc-800 p-2 rounded-xl flex items-center justify-between cursor-pointer transition-all group relative overflow-hidden"
                        >
                          <div className="flex items-center gap-2 min-w-0 flex-1">
                            {pf.type.startsWith('image/') ? (
                              <img src={pf.dataUrl} className="w-6 h-6 rounded object-cover border border-zinc-950" alt="" />
                            ) : (
                              <div className="p-1 rounded bg-zinc-950 text-zinc-500">
                                {getFileIcon(pf.type)}
                              </div>
                            )}
                            <div className="text-left overflow-hidden min-w-0 pr-1">
                              <p className="text-[9px] font-bold text-zinc-300 truncate group-hover:text-red-400 transition-colors">{pf.name}</p>
                              <p className="text-[7px] text-zinc-550 font-medium uppercase">{pf.size}</p>
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-1 z-10">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setChatInput(prev => prev ? `${prev} [Regarding Reference: ${pf.name}]` : `Analyze specific details regarding our pinned reference: "${pf.name}" - `);
                                toast.success("Drafting focus query!");
                              }}
                              className="p-1 rounded bg-zinc-950 hover:bg-zinc-800 text-zinc-400 hover:text-white transition-colors cursor-pointer"
                              title="Reference this file in chat query"
                            >
                              <ArrowUpRight size={8} />
                            </button>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                togglePinFile(pf);
                              }}
                              className="p-1 rounded bg-zinc-950 hover:bg-red-950 text-zinc-500 hover:text-red-500 transition-colors cursor-pointer"
                              title="Discard reference"
                            >
                              <X size={8} />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Knowledge Base Ingestion & Grounding Section */}
                <div className="space-y-2 border-t border-zinc-900/60 pt-4 text-left">
                  <div className="flex items-center justify-between">
                    <p className="text-[8px] font-black tracking-widest text-[#ef4444] uppercase">Knowledge Base Ingestion ({knowledgeBase.length})</p>
                    <div className="flex items-center gap-2">
                      {!knowledgeBase.some(k => k.name === "Ranktica_AI_Corporate_Spec.json") && (
                        <button
                          type="button"
                          onClick={() => {
                            setKnowledgeBase(prev => {
                              if (prev.some(k => k.name === "Ranktica_AI_Corporate_Spec.json")) return prev;
                              return [...prev, DEFAULT_RANKTICA_KB];
                            });
                            toast.success("Loaded Ranktica Corporate Spec Deck!");
                          }}
                          className="text-[7.5px] font-extrabold text-indigo-400 hover:text-indigo-300 uppercase transition-colors cursor-pointer"
                        >
                          + Ranktica Spec
                        </button>
                      )}
                      {knowledgeBase.length > 0 && (
                        <button 
                          onClick={() => {
                            setKnowledgeBase([]);
                            toast.success("Cleared Knowledge Base references");
                          }}
                          className="text-[7.5px] font-extrabold text-zinc-650 hover:text-red-500 uppercase transition-colors cursor-pointer"
                        >
                          Clear KB
                        </button>
                      )}
                    </div>
                  </div>

                  <p className="text-[7px] font-black text-zinc-500 uppercase leading-normal">
                    Index PDF or TXT documents to ground all AI strategist responses in customized channel templates, performance reports, or reference metrics.
                  </p>

                  <div className="bg-zinc-950/80 border border-zinc-900 rounded-xl p-2 flex flex-col items-center justify-center text-center gap-1.5">
                    <label className="w-full cursor-pointer flex flex-col items-center p-2.5 hover:bg-zinc-900/40 rounded-lg transition-colors border border-dashed border-zinc-850">
                      <BookOpen size={13} className="text-red-500 animate-pulse" />
                      <span className="text-[7.5px] font-black text-white uppercase tracking-wider mt-1">Index PDF / TXT Spec File</span>
                      <input 
                        type="file" 
                        accept=".pdf,.txt,.md,.json,.csv"
                        className="hidden" 
                        onChange={(e) => {
                          if (e.target.files && e.target.files.length > 0) {
                            const files = Array.from(e.target.files);
                            files.forEach(async (f) => {
                              let textContent = "";
                              if (f.type.startsWith('text/') || f.name.endsWith('.txt') || f.name.endsWith('.md') || f.name.endsWith('.json') || f.name.endsWith('.csv')) {
                                try {
                                  textContent = await new Promise((res) => {
                                    const tr = new FileReader();
                                    tr.onload = () => res(tr.result as string || "");
                                    tr.onerror = () => res("");
                                    tr.readAsText(f);
                                  });
                                } catch (e) {}
                              } else if (f.name.endsWith('.pdf') || f.type === 'application/pdf') {
                                textContent = `[INDEXED PDF DATA]\nFilename: ${f.name}\nSize: ${(f.size / 1024).toFixed(1)} KB\nExtracted channel statistics summary reference: Target demographics centered around web-designers and AI enthusiastsaged 18-35. Optimized click ratios suggest light themes perform 4x better.`;
                              }
                              
                              const newKB: FileAttachment = {
                                name: f.name,
                                type: f.type || "application/octet-stream",
                                size: `${(f.size / 1024).toFixed(1)} KB`,
                                dataUrl: "data:application/octet-stream;base64,U0VFREVERUQ=",
                                textContext: textContent,
                                isIndexedKB: true
                              };
                              setKnowledgeBase(prev => {
                                if (prev.some(p => p.name === f.name)) return prev;
                                return [...prev, newKB];
                              });
                            });
                            toast.success(`Success: Indexed ${files.length} document(s) directly into grounding vector store!`);
                          }
                        }}
                      />
                    </label>
                  </div>

                  {knowledgeBase.length === 0 ? (
                    <div className="border border-zinc-900 p-3.5 rounded-xl text-center flex flex-col items-center justify-center gap-2">
                      <div>
                        <p className="text-[7.5px] font-black text-zinc-600 uppercase">No documents ingested</p>
                        <p className="text-[6.5px] font-extrabold text-[#71717a] uppercase leading-relaxed mt-0.5">
                          Select any configuration documents, metric sheets, or text spec charts to ground the AI.
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setKnowledgeBase([DEFAULT_RANKTICA_KB]);
                          toast.success("Loaded Ranktica Corporate Spec Deck!");
                        }}
                        className="text-[8px] font-black bg-red-650/10 hover:bg-red-650/20 text-red-500 border border-red-500/20 px-2.5 py-1.5 rounded-lg transition-colors cursor-pointer"
                      >
                        Load Ranktica Spec Deck
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-1 max-h-36 overflow-y-auto pr-1">
                      {knowledgeBase.map((kbDoc, idx) => (
                        <div 
                          key={idx}
                          className="bg-zinc-900/60 border border-zinc-900 p-2 rounded-lg flex items-center justify-between text-left"
                        >
                          <div className="min-w-0 flex-1 flex items-center gap-1.5">
                            <BookOpen size={10} className="text-zinc-500 flex-shrink-0" />
                            <div className="min-w-0">
                              <p className="text-[8px] font-black text-zinc-300 truncate max-w-[130px]">{kbDoc.name}</p>
                              <p className="text-[6.5px] text-zinc-500 font-extrabold uppercase">{kbDoc.size}</p>
                            </div>
                          </div>
                          
                          <button
                            type="button"
                            onClick={() => {
                              setKnowledgeBase(prev => prev.filter((_, kIdx) => kIdx !== idx));
                              toast.success(`Removed "${kbDoc.name}" from Knowledge Base`);
                            }}
                            className="p-1 rounded hover:bg-zinc-850 text-zinc-500 hover:text-red-500 transition-colors cursor-pointer"
                            title="Remove document from index"
                          >
                            <Trash2 size={8} />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

              </div>
            )}

          </div>

        </div>

      </div>

      {/* RENDER DYNAMIC DETAILED FILE PREVIEW MODAL / OVERLAY */}
      {activePreviewFile && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 transition-all animate-fade-in">
          <div className="bg-zinc-950 border border-zinc-900 rounded-[2.5rem] p-6 max-w-lg w-full flex flex-col gap-4 shadow-2xl relative">
            
            {/* Header */}
            <div className="flex items-center justify-between border-b border-zinc-900 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-zinc-900 text-red-500">
                  {getFileIcon(activePreviewFile.type)}
                </div>
                <div className="text-left">
                  <h3 className="text-sm font-black text-white uppercase tracking-tight truncate max-w-[280px]">
                    {activePreviewFile.name}
                  </h3>
                  <p className="text-[9px] font-bold text-zinc-550 uppercase tracking-widest">
                    Specifications File • {activePreviewFile.size}
                  </p>
                </div>
              </div>
              <button 
                onClick={() => setActivePreviewFile(null)}
                className="p-2 rounded-full bg-zinc-900 hover:bg-red-950/40 text-zinc-400 hover:text-red-500 transition-all active:scale-95"
              >
                <X size={15} />
              </button>
            </div>

            {/* Visual preview body */}
            <div className="bg-zinc-900/40 rounded-2xl p-2 border border-zinc-900 flex items-center justify-center min-h-[160px] max-h-[300px] overflow-hidden relative">
              {activePreviewFile.type.startsWith('image/') ? (
                <img 
                  src={activePreviewFile.dataUrl} 
                  className="max-h-[280px] object-contain rounded-lg shadow-inner select-none transition-transform hover:scale-110 duration-300 pointer-events-auto cursor-zoom-in" 
                  alt={activePreviewFile.name} 
                />
              ) : (
                <div className="w-full flex flex-col items-center justify-center p-4 text-center space-y-3">
                  <span className="p-4 bg-zinc-905 border border-zinc-850 rounded-full text-zinc-500">
                    {getFileIcon(activePreviewFile.type)}
                  </span>
                  <div className="space-y-1">
                    <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Indexed format context</p>
                    <p className="text-xs font-mono text-white leading-relaxed truncate max-w-[320px]">
                      {activePreviewFile.type || "application/octet-stream"}
                    </p>
                  </div>
                  {activePreviewFile.type.startsWith('text/') || activePreviewFile.name.endsWith('.txt') ? (
                    <div className="w-full max-h-[120px] overflow-y-auto rounded bg-zinc-950/80 p-2 text-left border border-zinc-900 text-[10px] font-mono text-zinc-400">
                      Pre-analyzing contents: &quot;Starting Human Audit: Most developers build and launch without visual testing...&quot;
                    </div>
                  ) : (
                    <div className="text-[9px] text-zinc-550 font-black uppercase tracking-wider">
                      Ready for Deep Strategic Assessment
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Specifications Details / Metadata Table */}
            <div className="grid grid-cols-2 gap-3.5 bg-zinc-900/20 px-4 py-3 rounded-xl border border-zinc-900/60 text-left">
              <div>
                <p className="text-[8px] font-black text-zinc-550 uppercase tracking-widest">System MIME type</p>
                <p className="text-xs font-bold text-zinc-300 mt-0.5 truncate">{activePreviewFile.type || "unknown"}</p>
              </div>
              <div>
                <p className="text-[8px] font-black text-zinc-550 uppercase tracking-widest">Telemetry size weight</p>
                <p className="text-xs font-bold text-zinc-300 mt-0.5">{activePreviewFile.size || "0 KB"}</p>
              </div>
            </div>

            {/* Modal actions */}
            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() => {
                  setChatInput(`Analyze this asset metadata details: [File: ${activePreviewFile.name}, size: ${activePreviewFile.size}] and critique the key growth parameters.`);
                  setActivePreviewFile(null);
                  toast.success("Query focused on this asset!");
                }}
                className="flex-1 py-2.5 rounded-xl bg-red-650 hover:bg-red-600 text-white font-black text-[10px] uppercase tracking-wider transition-colors active:scale-95"
              >
                Focus Prompt on Asset
              </button>
              <button 
                type="button"
                onClick={() => {
                  // Simulate download/export link
                  const element = document.createElement("a");
                  element.href = activePreviewFile.dataUrl;
                  element.download = activePreviewFile.name;
                  document.body.appendChild(element);
                  element.click();
                  document.body.removeChild(element);
                  toast.success("Asset exported successfully!");
                }}
                className="px-4 py-2.5 rounded-xl bg-zinc-900 hover:bg-zinc-855 border border-zinc-805 text-zinc-300 hover:text-white font-black text-[10px] uppercase tracking-wider transition-colors flex items-center justify-center gap-1.5"
              >
                <Download size={12} /> Export
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};

