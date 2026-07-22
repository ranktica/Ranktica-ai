
import React, { useState, useRef, useEffect, useMemo } from 'react';
import { toast } from 'react-hot-toast';
import { generateScriptStream, optimizeScriptPacing, generateScriptSummary, translateScript } from '@/infrastructure/gemini';
import { ToolType } from '@/shared/types';
import { logActivity } from '@/shared/activityLogger';
import { usePersistedFormState } from '@/shared/usePersistedFormState';
import { triggerHapticFeedback } from '@/shared/haptics';
import { 
  Loader2, 
  Download, 
  Bold, 
  Italic, 
  List, 
  Heading1, 
  Sparkles,
  Zap,
  BookOpen,
  ChevronDown,
  History,
  FileText,
  Copy,
  Clock,
  Search,
  Activity,
  Gauge,
  ZapOff,
  TrendingDown,
  Wind,
  MousePointer2,
  AlertTriangle,
  Mic,
  ArrowRight,
  ShieldAlert,
  ZapIcon,
  CheckCircle2,
  Timer,
  X,
  Volume2,
  VolumeX,
  Users,
  Smile,
  Flame,
  Plus,
  Trash2,
  Settings,
  ChevronUp,
  Languages,
  MessageSquare,
  Smartphone,
  Sliders,
  Pause,
  Play,
  Square,
  Calendar
} from 'lucide-react';
import { useAuth } from '@/infrastructure/auth/AuthContext';
import { useProject } from '@/app/ProjectContext';
import { useCommand } from '@/shared/CommandContext';
import { getCachedToken, loginWithGoogle } from '@/infrastructure/auth/firebase';
import { LineChart, Line, ResponsiveContainer, XAxis, YAxis, Tooltip, AreaChart, Area } from 'recharts';

const SCRIPT_PRESETS = [
  {
    id: 'ai-agency-24h',
    label: '24h AI Agency Challenge',
    title: 'I Built a $10k/mo AI Agency in Exactly 24 Hours',
    tone: 'Fast-paced & Hype',
    type: 'storytelling',
    instructions: `URGENCY PROTOCOL:
1. 3-Second Hook: "I fired my human team and replaced them with autonomous agents for 24 hours. I made more money in one day than they did in a month."
2. Visual Cues: Mandatory [Visual: ...] every 10-15 words. Describe aggressive transitions and data overlays.
3. Focus: Immediate value, technical challenges (API failures, persona mapping), and the final revenue reveal.
4. CTA: Subscribe to join the 1% of creators who orchestrate swarms instead of writing prompts.`
  },
  {
    id: 'ai-marketing-2025-shift',
    label: 'AI Marketing: The 2025 Shift',
    title: 'The Future of AI in Marketing: Why Traditional Agencies are Dead',
    tone: 'Fast-paced & Hype',
    type: 'storytelling',
    instructions: `FORCE PACING:
1. Start with a SHOCKING Pattern Interrupt: "Your agency is lying to you about AI."
2. Mandatory [Visual: ...] every 10-15 words.
3. End with a massive subscription CTA.`
  }
];

const DEFAULT_TEMPLATES = [
  {
    id: 'how-to-template',
    name: '🔧 How-to / Tutorial Blueprint',
    desc: 'Structured for detailed procedural software or hardware tutorials.',
    title: 'How to Build [Concept] with No-Code AI in 15 Minutes',
    tone: 'Professional',
    scriptType: 'how-to',
    instructions: `PACING ARCHITECTURE FOR TUTORIALS:
1. First 5 seconds: Show the end-product fully operational to build extreme proof.
2. Structure: Break down into 3-4 distinct logical steps (Setup, Core Building, Config, Verification).
3. Visuals: Focus on high-clarity screencasts and code references. [Visual: Screencast showing...]
4. Outro: Prompt users to comment about any bugs they hit.`
  },
  {
    id: 'top-10-template',
    name: '🏆 Top 10 Countdown Arc',
    desc: 'Maintains compound suspense from item 10 down to the grand #1 winner.',
    title: 'Top 10 Banned AI Websites Everyone Is Secretly Using',
    tone: 'Fast-paced & Hype',
    scriptType: 'top-10',
    instructions: `SUSPENSE COMPOUND PROTOCOL:
1. Hook: "The last website on this list is literally illegal in 3 countries. Do not use it."
2. Countdown: Build value progressively. Keep pacing fast (~45 words per item).
3. Contrast: Alternate between shocking tools and insanely practical utilities.
4. Call-to-action: Comment your prediction for #1 before the reveal.`
  },
  {
    id: 'storytelling-template',
    name: '🎙️ Deep Storytelling & Essay Arc',
    desc: 'Poetic, narrative-driven blueprint for essays and tech exposes.',
    title: 'The Terrifying Rise and Silent Fall of [Company/Concept]',
    tone: 'Dramatic',
    scriptType: 'storytelling',
    instructions: `NARRATIVE PROTOCOL:
1. Deep Suspense Hook: Start with a rhetorical inquiry and slow scene pacing.
2. Human-interest Focus: Profile the key creators, conflict points, and downfall catalysts.
3. Audio cues: Describe slow orchestral build-ups and silence pattern interrupts.
4. CTA: Reflect on what this means for human workforce.`
  }
];

const getSimulatedRetentionPatterns = (category: string) => {
  const cat = (category || 'storytelling').toLowerCase();
  switch (cat) {
    case 'challenge':
    case 'storytelling':
      return [
        { percentage: '10%', action: 'Narrative Hook Spark', retention: 98, status: 'Critically Hot', desc: 'Sustained dramatic question hooks viewers aggressively.' },
        { percentage: '20%', action: 'Story Setup', retention: 82, status: 'Steady Warm', desc: 'Mild drop-off as background context begins to establish.' },
        { percentage: '30%', action: 'Conflict Escalation', retention: 79, status: 'Steady Warm', desc: 'Audience engages fully for the upcoming tension buildup.' },
        { percentage: '40%', action: 'Core Build-up Lull', retention: 65, status: 'Amber Warning', desc: 'Potential drop if pacing lacks visual cues or pattern interrupts.' },
        { percentage: '50%', action: 'Midpoint Climax delay', retention: 58, status: 'Retention Risk', desc: 'Excessive talking blocks without visual turns cause cognitive fatigue.' },
        { percentage: '60%', action: 'Neural Twist Re-sync', retention: 84, status: 'Critically Hot', desc: 'High hook recovery due to unexpected turn or hurdle reveal.' },
        { percentage: '70%', action: 'Resolution Payoff', retention: 72, status: 'Steady Warm', desc: 'Satisfying mechanical pay-off keeps viewers locked.' },
        { percentage: '80%', action: 'Climax & Final Reward', retention: 85, status: 'Critically Hot', desc: 'Key outcome reveal spikes general curiosity spikes.' },
        { percentage: '90%', action: 'Call to Action (CTA)', retention: 48, status: 'Drop-off Peak', desc: 'Audience bounces immediately when dry extro / CTA dialogue starts.' },
        { percentage: '100%', action: 'Fade-out / End-screen', retention: 22, status: 'Disengaged', desc: 'End screen visual transition.' }
      ];
    case 'how-to':
    case 'educational':
      return [
        { percentage: '10%', action: 'Premise & Promise Hook', retention: 92, status: 'Critically Hot', desc: 'Immediate reassurance of resolving the core error.' },
        { percentage: '20%', action: 'Prerequisites Setup', retention: 86, status: 'Steady Warm', desc: 'Practical configurations command stable high attention.' },
        { percentage: '30%', action: 'Step 1: Installation', retention: 74, status: 'Steady Warm', desc: 'Engaged active learners focus on execution alignment.' },
        { percentage: '40%', action: 'Theoretical Side-note', retention: 55, status: 'Amber Warning', desc: 'Excessive jargon/concept explanation induces minor user drift.' },
        { percentage: '50%', action: 'Step 2: Core Assembly', retention: 88, status: 'Critically Hot', desc: 'Peak active engagement as the main solution is wired.' },
        { percentage: '60%', action: 'Step 3: Configurations', retention: 70, status: 'Steady Warm', desc: 'Expectations reached. Minor tutorial bounce phase begins.' },
        { percentage: '70%', action: 'Optional Optimizations', retention: 61, status: 'Amber Warning', desc: 'Niche optional config. Only deep-diving viewers persist.' },
        { percentage: '80%', action: 'Live Functional Proof', retention: 78, status: 'Steady Warm', desc: 'Visual verification of success brings drifting viewers back.' },
        { percentage: '90%', action: 'Resource Guide Outro', retention: 41, status: 'Drop-off Peak', desc: 'Directing to links / source code prompts users to exit the video.' },
        { percentage: '100%', action: 'Wrap up & endcard', retention: 18, status: 'Disengaged', desc: 'Final frame transition.' }
      ];
    default: // list / countdown / general
      return [
        { percentage: '10%', action: 'Hype Trailer Hook', retention: 94, status: 'Critically Hot', desc: 'Previewing top countdown ranks creates major suspense.' },
        { percentage: '20%', action: 'Ranks #10 to #8', retention: 84, status: 'Steady Warm', desc: 'First list points flow quickly to establish rhythm.' },
        { percentage: '35%', action: 'Mid-list sponsor break', retention: 45, status: 'Drop-off Peak', desc: 'Commercial sponsors cause immediate high speed bounce.' },
        { percentage: '50%', action: 'Ranks #7 to #5', retention: 71, status: 'Steady Warm', desc: 'Regaining focus as mid-ranking list points renew value.' },
        { percentage: '65%', action: 'Rank #4: Mind-blow entry', retention: 81, status: 'Critically Hot', desc: 'Surprising item entry triggers sudden viewer comments.' },
        { percentage: '75%', action: 'Ranks #3 to #2', retention: 76, status: 'Steady Warm', desc: 'Suspensful build-up as the #1 spotlight spot approaches.' },
        { percentage: '85%', action: 'Ranks Prediction Cue', retention: 89, status: 'Critically Hot', desc: 'Engaged predictions keep user focus extremely high.' },
        { percentage: '95%', action: 'Ultimate #1 Champion', retention: 95, status: 'Critically Hot', desc: 'The major climax reveal of the video.' },
        { percentage: '100%', action: 'Outro CTA Screen', retention: 34, status: 'Disengaged', desc: 'End list transition.' }
      ];
  }
};

// Helper heuristic to approximate English syllable count for Flesch-Kincaid readability score calculations
const countSyllables = (word: string): number => {
  word = word.toLowerCase().replace(/[^a-z]/g, '');
  if (word.length <= 3) return 1;
  word = word.replace(/(?:[^laeiouy]es|ed|[^laeiouy]e)$/, '');
  word = word.replace(/^y/, '');
  const syl = word.match(/[aeiouy]{1,2}/g);
  return syl ? syl.length : 1;
};

export const ScriptWriter: React.FC<any> = ({ prefill, onNavigate }) => {
  const { user, incrementStat } = useAuth();
  const [title, setTitle] = usePersistedFormState('ranktica_script_title', 'The 24-Hour AI Agency Challenge');
  const [instructions, setInstructions] = usePersistedFormState('ranktica_script_instructions', '');
  const [tone, setTone] = usePersistedFormState('ranktica_script_tone', 'Fast-paced & Hype');
  const [scriptType, setScriptType] = usePersistedFormState('ranktica_script_type', 'storytelling');
  const [scriptLoraAdapter, setScriptLoraAdapter] = usePersistedFormState('ranktica_script_lora_adapter', 'script_lora_velocity_v5');
  const [script, setScript] = usePersistedFormState('ranktica_script_content', '');
  const [isGenerating, setIsGenerating] = useState(false);

  // --- REAL-TIME MULTI-USER COLLABORATIVE VIEW MODULE ---
  const [isRealtimeConnected, setIsRealtimeConnected] = useState(false);
  const [onlineCollaborators, setOnlineCollaborators] = useState<Array<{ username: string, color: string, cursorIndex?: number }>>([]);
  const wsRef = useRef<WebSocket | null>(null);
  const isIncomingEdit = useRef(false);

  const joinCollaboration = () => {
    if (wsRef.current) {
      wsRef.current.close();
    }

    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const projId = activeProject?.id || 'default_room';
    const cName = (user as any)?.displayName || (user as any)?.name || user?.email?.split('@')[0] || `Creator_${Math.floor(Math.random() * 1000)}`;
    const wsUrl = `${protocol}//${window.location.host}/api/collaborator-ws?projectId=${encodeURIComponent(projId)}&username=${encodeURIComponent(cName)}`;

    try {
      const socket = new WebSocket(wsUrl);
      wsRef.current = socket;

      socket.onopen = () => {
        setIsRealtimeConnected(true);
        toast.success(`Connected to Real-Time Collaboration as "${cName}"! 🔗`);
      };

      socket.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (data.type === 'room_state') {
            setOnlineCollaborators(data.activeUsers);
          } else if (data.type === 'user_joined') {
            setOnlineCollaborators(data.activeUsers);
            toast.success(`Collaborator "${data.username}" joined 👥`);
          } else if (data.type === 'user_left') {
            setOnlineCollaborators(data.activeUsers);
            toast.success(`Collaborator "${data.username}" left`);
          } else if (data.type === 'cursor') {
            setOnlineCollaborators(prev => prev.map(c => 
              c.username === data.username ? { ...c, cursorIndex: data.cursorIndex } : c
            ));
          } else if (data.type === 'edit') {
            isIncomingEdit.current = true;
            setScript(data.content);
            setTimeout(() => {
              isIncomingEdit.current = false;
            }, 50);
          }
        } catch (err) {
          console.error('[Collab Client] Parse error:', err);
        }
      };

      socket.onclose = () => {
        setIsRealtimeConnected(false);
        setOnlineCollaborators([]);
        wsRef.current = null;
      };

      socket.onerror = (err) => {
        console.warn('[Collab Client] WebSocket notice:', err);
      };
    } catch (e) {
      console.error('[Collab Client] Connection failed:', e);
    }
  };

  const leaveCollaboration = () => {
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
    setIsRealtimeConnected(false);
    setOnlineCollaborators([]);
    toast.success("Disconnected from Real-Time Collaboration.");
  };

  const toggleRealtimeCollaboration = () => {
    if (isRealtimeConnected) {
      leaveCollaboration();
    } else {
      joinCollaboration();
    }
  };

  // Broadcast text edits when script changes locally
  useEffect(() => {
    if (isRealtimeConnected && wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      if (!isIncomingEdit.current) {
        wsRef.current.send(JSON.stringify({
          type: 'edit',
          content: script,
          cursorIndex: textareaRef.current?.selectionStart
        }));
      }
    }
  }, [script, isRealtimeConnected]);

  // Broadcast cursor movements
  const handleTextareaCursorChange = () => {
    if (isRealtimeConnected && wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      const cursorIndex = textareaRef.current?.selectionStart;
      if (typeof cursorIndex === 'number') {
        wsRef.current.send(JSON.stringify({
          type: 'cursor',
          cursorIndex
        }));
      }
    }
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, []);
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [estimateModel, setEstimateModel] = useState<'flash' | 'pro'>('flash');
  const [estimateWordCount, setEstimateWordCount] = useState<number>(1000);
  const [showPresets, setShowPresets] = useState(false);
  
  const [showHistorySidebar, setShowHistorySidebar] = useState(false);
  const [showSocialModal, setShowSocialModal] = useState(false);
  
  // --- Highlight-based Inline Comments State ---
  const [comments, setComments] = usePersistedFormState<Array<{
    id: string;
    selection: string;
    text: string;
    author: string;
    color: string;
    timestamp: number;
  }>>('ranktica_script_comments_sync', []);
  const [selectedText, setSelectedText] = useState('');
  const [selectionStart, setSelectionStart] = useState<number | null>(null);
  const [selectionEnd, setSelectionEnd] = useState<number | null>(null);
  const [newCommentText, setNewCommentText] = useState('');
  const [showCommentsSidebar, setShowCommentsSidebar] = useState(false);

  // --- Reusable Script Templates State ---
  const [customTemplates, setCustomTemplates] = usePersistedFormState<Array<{
    id: string;
    name: string;
    desc: string;
    title: string;
    tone: string;
    scriptType: string;
    instructions: string;
  }>>('ranktica_custom_script_templates_sync', []);
  const [showTemplatesGallery, setShowTemplatesGallery] = useState(false);
  const [showSaveTemplateForm, setShowSaveTemplateForm] = useState(false);
  const [newTemplateName, setNewTemplateName] = useState('');
  const [newTemplateDesc, setNewTemplateDesc] = useState('');

  // --- Translation States ---
  const [isTranslating, setIsTranslating] = useState(false);
  const [showTranslateMenu, setShowTranslateMenu] = useState(false);

  // --- Retention Analytics Sideview Tabs ---
  const [analyticsTab, setAnalyticsTab] = useState<'curve' | 'heatmap' | 'scheduler'>('curve');
  const [selectedHeatmapIdx, setSelectedHeatmapIdx] = useState<number | null>(null);

  const lastLoadedProjectId = useRef<string | null>(null);

  // --- 1. Team Collaborators Stack ---
  const [collaborators] = useState([
    { name: "Marcus V.", role: "Producer", color: "from-purple-500 to-indigo-600", status: "Editing" },
    { name: "Sarah K.", role: "Video Editor", color: "from-amber-400 to-red-500", status: "Viewing" },
    { name: "Alex P.", role: "AI Strategist", color: "from-teal-400 to-emerald-600", status: "Active" },
    { name: "John D.", role: "Manager", color: "from-blue-400 to-sky-600", status: "Active" }
  ]);

  // --- 2. Channel Brand Personas ---
  const defaultPersonas = [
    { id: 'tech-rev', name: 'Tech Reviewer', guidelines: 'Tone: Incisive, tech-savvy, focus on real world utility, specifications, trade-offs. Fast pacing, pattern interrupts, and authoritative specifications analysis.' },
    { id: 'game-vlog', name: 'Gaming Vlogger', guidelines: 'Tone: High-energy, humorous commentary, gamer lingo, rapid joke pacing, highly interactive references to gaming visuals and epic wins/fails.' },
    { id: 'finance-guide', name: 'Finance Expert', guidelines: 'Tone: Methodical, premium, trustworthy. Focus on ROI, actionable financial spreadsheets, passive streams, and direct visual breakdowns of money metrics.' },
    { id: 'docu-essay', name: 'Docu-Essayist', guidelines: 'Tone: Deeply narrative, suspenseful and curious storytelling, historical comparisons, poetic descriptions, slow rhetorical inquiries, and evocative scene setting.' }
  ];

  const [customPersonas, setCustomPersonas] = usePersistedFormState<Array<{ id: string; name: string; guidelines: string }>>('ranktica_custom_personas', []);
  const [activePersonaId, setActivePersonaId] = usePersistedFormState<string>('ranktica_active_persona', 'tech-rev');
  const [showPersonaSettings, setShowPersonaSettings] = useState(false);
  const [newPersonaName, setNewPersonaName] = useState('');
  const [newPersonaGuidelines, setNewPersonaGuidelines] = useState('');

  const allPersonas = useMemo(() => {
    return [...defaultPersonas, ...customPersonas];
  }, [customPersonas]);

  const activePersona = useMemo(() => {
    return allPersonas.find(p => p.id === activePersonaId) || allPersonas[0];
  }, [allPersonas, activePersonaId]);

  const handleCreateCustomPersona = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPersonaName.trim() || !newPersonaGuidelines.trim()) {
      toast.error("Please enter both a name and guideline guidelines.");
      return;
    }
    const newId = `persona_${Date.now()}`;
    const newP = { id: newId, name: newPersonaName.trim(), guidelines: newPersonaGuidelines.trim() };
    setCustomPersonas(prev => [...prev, newP]);
    setActivePersonaId(newId);
    setNewPersonaName('');
    setNewPersonaGuidelines('');
    toast.success(`Saved and activated brand persona "${newP.name}"! 🎙️`);
  };

  const handleDeletePersona = (id: string) => {
    if (id === 'tech-rev' || id === 'game-vlog' || id === 'finance-guide' || id === 'docu-essay') {
      toast.error("Default personas cannot be deleted!");
      return;
    }
    setCustomPersonas(prev => prev.filter(p => p.id !== id));
    if (activePersonaId === id) {
      setActivePersonaId('tech-rev');
    }
    toast.success("Custom brand persona removed.");
  };

  const { registerCommand } = useCommand();

  const lastScriptRef = useRef(script);
  const lastTitleRef = useRef(title);
  const lastInstructionsRef = useRef(instructions);

  const handleScriptBlur = () => {
    if (script !== lastScriptRef.current) {
      const oldVal = lastScriptRef.current;
      const newVal = script;
      registerCommand(
        'Script Writer',
        `Edited script content (${script.split(/\s+/).filter(Boolean).length} words)`,
        () => setScript(oldVal),
        () => setScript(newVal)
      );
      lastScriptRef.current = script;
    }
  };

  const handleTitleBlur = () => {
    if (title !== lastTitleRef.current) {
      const oldVal = lastTitleRef.current;
      const newVal = title;
      registerCommand(
        'Script Writer',
        `Changed headline title: "${title}"`,
        () => setTitle(oldVal),
        () => setTitle(newVal)
      );
      lastTitleRef.current = title;
    }
  };

  const handleInstructionsBlur = () => {
    if (instructions !== lastInstructionsRef.current) {
      const oldVal = lastInstructionsRef.current;
      const newVal = instructions;
      registerCommand(
        'Script Writer',
        `Edited narrative constraints outline`,
        () => setInstructions(oldVal),
        () => setInstructions(newVal)
      );
      lastInstructionsRef.current = instructions;
    }
  };

  // --- Highlight & In-Text Annotation System ---
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  const handleTextareaSelect = (e: React.SyntheticEvent<HTMLTextAreaElement>) => {
    const target = e.currentTarget;
    const start = target.selectionStart;
    const end = target.selectionEnd;
    if (start !== end && start !== null && end !== null) {
      const text = target.value.substring(start, end);
      setSelectedText(text);
      setSelectionStart(start);
      setSelectionEnd(end);
    } else {
      setSelectedText('');
      setSelectionStart(null);
      setSelectionEnd(null);
    }
  };

  const handleAddComment = () => {
    if (!newCommentText.trim()) {
      toast.error("Please enter some comment text first.");
      return;
    }
    if (!selectedText) {
      toast.error("Please select/highlight a block of text in the script editor to comment on!");
      return;
    }
    const colors = [
      'bg-red-500/10 border-red-500/25 text-red-400',
      'bg-blue-500/10 border-blue-500/25 text-blue-400',
      'bg-purple-500/10 border-purple-500/25 text-purple-400',
      'bg-amber-500/10 border-amber-500/25 text-amber-400'
    ];
    const newComment = {
      id: `comment_${Date.now()}`,
      selection: selectedText,
      text: newCommentText.trim(),
      author: 'You (Editor)',
      color: colors[comments.length % colors.length],
      timestamp: Date.now()
    };
    setComments(prev => [newComment, ...prev]);
    setNewCommentText('');
    setSelectedText('');
    toast.success("Successfully attached inline comment to selected script segment!");
  };

  const handleLocateComment = (snippet: string) => {
    if (!textareaRef.current) return;
    const idx = script.indexOf(snippet);
    if (idx !== -1) {
      textareaRef.current.focus();
      textareaRef.current.setSelectionRange(idx, idx + snippet.length);
      const linesBefore = textareaRef.current.value.substring(0, idx).split('\n').length;
      const lineHeight = 28;
      textareaRef.current.scrollTop = Math.max(0, linesBefore * lineHeight - 120);
      toast.success(`Focused annotated block: "${snippet.substring(0, 25)}..."`);
    } else {
      toast.error("The commented script text could not be located in this draft version.");
    }
  };

  const handleDeleteComment = (id: string) => {
    setComments(prev => prev.filter(c => c.id !== id));
    toast.success("Comment deleted.");
  };

  // --- Translation Logic Helper ---
  const handleTranslateScript = async (targetLang: string) => {
    if (!script) {
      toast.error("Generate or write script content before translating.");
      return;
    }
    setShowTranslateMenu(false);
    setIsTranslating(true);
    const toastId = toast.loading(`Translating script to ${targetLang} with Gemini...`);
    try {
      const translated = await translateScript(script, targetLang);
      if (translated) {
        setScript(translated);
        toast.success(`Translated to ${targetLang}! Cues preserved. 🌐`, { id: toastId });
        
        const label = `Translated (${targetLang})`;
        const nextVer = {
          id: `ver_${Date.now()}`,
          timestamp: Date.now(),
          label,
          script: translated,
          title,
          tone
        };
        setLocalStorageHistory(prev => [nextVer, ...prev]);
        if (activeProject) {
          await addScriptVersion(activeProject.id, translated, `Auto-Translate: ${targetLang}`);
          await updateActiveProject({
            assets: { ...activeProject.assets, script: translated }
          });
        }
      } else {
        toast.error("AI returned empty result. Try again.", { id: toastId });
      }
    } catch (err) {
      console.error(err);
      toast.error("Auto-translation failed. Check configuration or API limits.", { id: toastId });
    } finally {
      setIsTranslating(false);
    }
  };

  // --- Custom Script Reusable Templates Logic ---
  const handleSaveCustomTemplate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTemplateName.trim()) {
      toast.error("Please enter a name for the custom template.");
      return;
    }
    const nextT = {
      id: `tmpl_${Date.now()}`,
      name: `📋 ${newTemplateName.trim()}`,
      desc: newTemplateDesc.trim() || 'Custom saved blueprint structure.',
      title: title || 'Blueprint Title',
      tone: tone || 'Professional',
      scriptType: scriptType || 'storytelling',
      instructions: instructions || ''
    };
    setCustomTemplates(prev => [nextT, ...prev]);
    setNewTemplateName('');
    setNewTemplateDesc('');
    setShowSaveTemplateForm(false);
    toast.success(`Saved current blueprint configuration as template "${nextT.name}"!`);
  };

  const handleLoadTemplate = (t: any) => {
    const oldTitle = title;
    const oldInstructions = instructions;
    const oldTone = tone;
    const oldScriptType = scriptType;

    setTitle(t.title);
    setInstructions(t.instructions);
    setTone(t.tone);
    setScriptType(t.scriptType);
    setShowTemplatesGallery(false);
    toast.success(`Loaded "${t.name}" template parameters successfully!`);

    registerCommand(
      'Script Writer',
      `Loaded template: "${t.name}"`,
      () => {
        setTitle(oldTitle);
        setInstructions(oldInstructions);
        setTone(oldTone);
        setScriptType(oldScriptType);
      },
      () => {
        setTitle(t.title);
        setInstructions(t.instructions);
        setTone(t.tone);
        setScriptType(t.scriptType);
      }
    );
  };

  const handleDeleteTemplate = (id: string) => {
    setCustomTemplates(prev => prev.filter(t => t.id !== id));
    toast.success("Successfully deleted custom template.");
  };

  // --- 3. Script Summary ---
  const [summaryText, setSummaryText] = usePersistedFormState<string>('ranktica_script_summary', '');
  const [isGeneratingSummary, setIsGeneratingSummary] = useState(false);
  const [isSummaryCollapsed, setIsSummaryCollapsed] = useState(true);

  const extractSummaryHeuristics = (text: string): string => {
    const clean = text.replace(/\[Visual:.*?\]/g, '').trim();
    const sentences = clean.split(/[.!?]+/).map(s => s.trim()).filter(s => s.length > 20);
    const bullets = [];
    if (sentences[0]) bullets.push(`🎯 Visual Anchor: ${sentences[0].substring(0, 80)}.`);
    if (sentences[Math.floor(sentences.length / 2)]) bullets.push(`💡 Key Concept Catalyst: ${sentences[Math.floor(sentences.length / 2)].substring(0, 80)}.`);
    if (sentences[sentences.length - 1]) bullets.push(`🚀 Retention Call: ${sentences[sentences.length - 1].substring(0, 80)}.`);
    
    while (bullets.length < 3) {
      bullets.push(`📋 Team Alignment point #${bullets.length + 1}: Script narrative segment ready for execution.`);
    }
    return bullets.slice(0, 3).map(b => `• ${b}`).join('\n');
  };

  const handleGenerateSummary = async (scriptText: string) => {
    if (!scriptText || !scriptText.trim()) {
      toast.error("Script workspace is empty, write some content first!");
      return;
    }
    setIsGeneratingSummary(true);
    const toastId = toast.loading('Synthesizing executive briefed summary...', { id: 'summary-toast' });
    try {
      const res = await generateScriptSummary(scriptText);
      setSummaryText(res || extractSummaryHeuristics(scriptText));
      setIsSummaryCollapsed(false);
      toast.success("Executive video summary updated! 📋", { id: 'summary-toast' });
    } catch (err) {
      console.error("Failed to generate summary", err);
      setSummaryText(extractSummaryHeuristics(scriptText));
      setIsSummaryCollapsed(false);
      toast.success("Produced summary based on draft extract!", { id: 'summary-toast' });
    } finally {
      setIsGeneratingSummary(false);
    }
  };

  // --- 4. Mood Analysis Tracker ---
  const scriptMoods = useMemo(() => {
    if (!script || !script.trim()) return [];
    
    // Split by newlines or paragraphs
    const paragraphs = script.split(/\n+/).map(p => p.trim()).filter(p => p.length > 3);
    return paragraphs.map((para, idx) => {
      const textLower = para.toLowerCase();
      let mood: 'Hype' | 'Analytic' | 'Drama' | 'Casual' | 'Climax' = 'Casual';
      let intensity = 50; 
      let color = 'bg-teal-500';
      let textColor = 'text-teal-400';
      let bgLight = 'bg-teal-500/10 border-teal-500/20';
      let label = 'Steady Conversation';

      if (textLower.includes('insane') || textLower.includes('revolution') || textLower.includes('failed') || textLower.includes('$') || textLower.includes('secrets') || textLower.includes('!')) {
         mood = 'Hype';
         intensity = 85 + (idx % 12);
         color = 'bg-red-500';
         textColor = 'text-red-400';
         bgLight = 'bg-red-500/10 border-red-500/20';
         label = 'High Pacing Energy';
      } else if (textLower.includes('how') || textLower.includes('step') || textLower.includes('spec') || textLower.includes('%') || textLower.includes('metric') || textLower.includes('code') || textLower.includes('logic')) {
         mood = 'Analytic';
         intensity = 60 + (idx % 15);
         color = 'bg-blue-500';
         textColor = 'text-blue-400';
         bgLight = 'bg-blue-500/10 border-blue-500/20';
         label = 'Analytical Deep Dive';
      } else if (textLower.includes('danger') || textLower.includes('warning') || textLower.includes('shut down') || textLower.includes('nobody') || textLower.includes('stop') || textLower.includes('shock')) {
         mood = 'Drama';
         intensity = 75 + (idx % 20);
         color = 'bg-purple-500';
         textColor = 'text-purple-400';
         bgLight = 'bg-purple-500/10 border-purple-500/20';
         label = 'Evocative Tension';
      } else if (textLower.includes('subscribe') || textLower.includes('join') || textLower.includes('comment') || textLower.includes('link') || textLower.includes('down below')) {
         mood = 'Climax';
         intensity = 95;
         color = 'bg-amber-500';
         textColor = 'text-amber-400';
         bgLight = 'bg-amber-500/10 border-amber-550/20';
         label = 'Audience Peak (CTA)';
      }

      return {
        id: `mood_${idx}`,
        text: para,
        mood,
        intensity,
        color,
        textColor,
        bgLight,
        label,
        words: para.split(/\s+/).filter(w => w.length > 0).length
      };
    });
  }, [script]);
  
  const [lastSavedTime, setLastSavedTime] = useState<string>(() => {
    // Attempt to set initial saved time to current time or a default
    const date = new Date();
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  });

  const [isPlayingTTS, setIsPlayingTTS] = useState(false);
  const [isPausedTTS, setIsPausedTTS] = useState(false);
  const [showVoiceControls, setShowVoiceControls] = useState(false);
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [selectedVoice, setSelectedVoice] = useState<string>('');
  const [ttsRate, setTtsRate] = useState<number>(1.0);
  const [ttsPitch, setTtsPitch] = useState<number>(1.0);
  
  const synthRef = useRef<SpeechSynthesis | null>(null);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

  // Sound playbacks and Speech cancellation hooks
  useEffect(() => {
    if (typeof window !== 'undefined') {
      synthRef.current = window.speechSynthesis;
      
      const loadVoices = () => {
        if (synthRef.current) {
          const list = synthRef.current.getVoices();
          setVoices(list);
          if (list.length > 0) {
            // Prefer an English voice, or default to the first available voice
            const englishVoice = list.find(v => v.lang.startsWith('en-US')) || 
                                 list.find(v => v.lang.startsWith('en')) || 
                                 list[0];
            setSelectedVoice(englishVoice.name);
          }
        }
      };

      loadVoices();
      if (window.speechSynthesis) {
        window.speechSynthesis.onvoiceschanged = loadVoices;
      }
    }
    return () => {
      if (synthRef.current) {
        synthRef.current.cancel();
      }
    };
  }, []);

  // Listen to successful localStorage hook saves in real-time
  useEffect(() => {
    const handleSaveEvent = (e: Event) => {
      const customEvent = e as CustomEvent<{ key: string; timestamp: number }>;
      if (customEvent.detail && (
        customEvent.detail.key === 'ranktica_script_content' || 
        customEvent.detail.key === 'ranktica_script_title' || 
        customEvent.detail.key === 'ranktica_script_instructions'
      )) {
        const date = new Date(customEvent.detail.timestamp);
        const timeString = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
        setLastSavedTime(timeString);
      }
    };

    window.addEventListener('local-storage-saved', handleSaveEvent);
    return () => {
      window.removeEventListener('local-storage-saved', handleSaveEvent);
    };
  }, []);

  const handleToggleTTS = () => {
    if (!script || !script.trim()) {
      toast.error("Script text area is empty. Write or synthesize content to play!");
      return;
    }
    if (!synthRef.current) {
      toast.error("Web Speech API is not supported in this browser environment.");
      return;
    }

    if (isPlayingTTS) {
      synthRef.current.cancel();
      setIsPlayingTTS(false);
      setIsPausedTTS(false);
      toast.success("Text-To-Speech audio preview stopped 🔇");
    } else {
      synthRef.current.cancel();
      // Remove visual cue formatting for spoken narration
      const cleanText = script.replace(/\[Visual:.*?\]/g, ' ').replace(/\s+/g, ' ').trim();
      const utterance = new SpeechSynthesisUtterance(cleanText);
      
      if (selectedVoice) {
        const voiceObj = voices.find(v => v.name === selectedVoice);
        if (voiceObj) {
          utterance.voice = voiceObj;
        }
      }

      utterance.rate = ttsRate;
      utterance.pitch = ttsPitch;
      
      utterance.onend = () => {
        setIsPlayingTTS(false);
        setIsPausedTTS(false);
      };
      utterance.onerror = () => {
        setIsPlayingTTS(false);
        setIsPausedTTS(false);
      };

      setIsPlayingTTS(true);
      setIsPausedTTS(false);
      synthRef.current.speak(utterance);
      toast.success(`Playing Text-To-Speech layout preview 🔊`);
    }
  };

  const handlePauseResumeTTS = () => {
    if (!synthRef.current) return;
    if (isPausedTTS) {
      synthRef.current.resume();
      setIsPausedTTS(false);
      toast.success("TTS playbacks resumed ▶️");
    } else if (isPlayingTTS) {
      synthRef.current.pause();
      setIsPausedTTS(true);
      toast.success("TTS playbacks paused ⏸️");
    }
  };

  const handleStopTTS = () => {
    if (!synthRef.current) return;
    synthRef.current.cancel();
    setIsPlayingTTS(false);
    setIsPausedTTS(false);
    toast.success("Text-to-speech audio stopped 🔇");
  };

  const scriptEndRef = useRef<HTMLDivElement>(null);
  const { activeProject, addScriptVersion, addTitleVersion, revertToScriptVersion, revertToTitleVersion, updateActiveProject, estimateTaskCost } = useProject();

  // Flesch-Kincaid Readability metrics score logic
  const readabilityScore = useMemo(() => {
    if (!script) return { score: 100, level: 'Post-graduate', gradeLevel: 'University', target: 'N/A' };
    
    // Clean code formatting tags out
    const cleanSpoken = script.replace(/\[Visual:.*?\]/g, ' ').replace(/\s+/g, ' ').trim();
    if (!cleanSpoken) return { score: 100, level: 'Post-graduate', gradeLevel: 'University', target: 'N/A' };
    
    const wordsList = cleanSpoken.split(/\s+/).filter(w => w.length > 0);
    const totalWords = wordsList.length;
    if (totalWords === 0) return { score: 100, level: 'Post-graduate', gradeLevel: 'University', target: 'N/A' };
    
    const sentenceList = cleanSpoken.split(/[.!?]+/).filter(s => s.trim().length > 0);
    const totalSentences = sentenceList.length || 1;
    
    // Estimate syllable metrics
    let totalSyllables = 0;
    wordsList.forEach(w => {
      totalSyllables += countSyllables(w);
    });
    
    // Flesch Reading Ease Formula
    const asl = totalWords / totalSentences;
    const asw = totalSyllables / totalWords;
    const score = Math.max(0, Math.min(100, Math.round(206.835 - (1.015 * asl) - (84.6 * asw))));
    
    // Flesch-Kincaid Grade Level index estimate
    const gradeLevel = Math.max(1, parseFloat((0.39 * asl + 11.8 * asw - 15.59).toFixed(1)));
    
    let level = 'Standard';
    let target = 'General Audience';
    
    if (score >= 90) {
      level = 'Very Easy';
      target = 'Shorts/Tiktok Demographics';
    } else if (score >= 80) {
      level = 'Easy';
      target = 'Casual Storytelling';
    } else if (score >= 70) {
      level = 'Fairly Easy';
      target = 'Standard YouTube Viewers';
    } else if (score >= 60) {
      level = 'Standard / Moderate';
      target = 'Tech & Edutainment reviews';
    } else if (score >= 50) {
      level = 'Fairly Difficult';
      target = 'Detailed documentaries';
    } else if (score >= 30) {
      level = 'Difficult';
      target = 'Expert academic analysis';
    } else {
      level = 'Extremely Complex';
      target = 'Highly niche professionals';
    }
    
    return { score, level, gradeLevel: `${gradeLevel}th Grade`, target };
  }, [script]);

  // Dynamic Word/Char indicator and reading time metrics selector
  const calculatedReadingMetrics = useMemo(() => {
    if (!script) return { words: 0, chars: 0, estTimeSeconds: 0, formatted: '0s', wpm: 150 };
    const cleanSpoken = script.replace(/\[Visual:.*?\]/g, '').trim();
    const words = cleanSpoken.split(/\s+/).filter(w => w.length > 0).length;
    const chars = script.length;
    
    let wpm = 150;
    const normalizedTone = tone.toLowerCase();
    if (normalizedTone.includes('hype') || normalizedTone.includes('energetic')) {
      wpm = 165;
    } else if (normalizedTone.includes('professional')) {
      wpm = 130;
    } else if (normalizedTone.includes('casual') || normalizedTone.includes('dramatic')) {
      wpm = 140;
    }
    
    const totalSeconds = Math.round((words / wpm) * 60);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    const formatted = minutes > 0 ? `${minutes}m ${seconds}s` : `${seconds}s`;
    
    return { words, chars, estTimeSeconds: totalSeconds, formatted, wpm };
  }, [script, tone]);

  // Local storage backup snapshots list linked to custom persistent storage hook
  const historyKey = activeProject 
    ? `ranktica_script_history_list_${activeProject.id}` 
    : 'ranktica_script_history_list_default';

  const [localStorageHistory, setLocalStorageHistory] = usePersistedFormState<Array<{
    id: string;
    timestamp: number;
    label: string;
    script: string;
    title: string;
    tone: string;
  }>>(historyKey, []);

  const handleCreateCheckpoint = (customLabel?: string) => {
    if (!script.trim()) {
      toast.error("Script workspace is empty, write some content first!");
      return;
    }
    const label = customLabel || `Manual Save: ${title.substring(0, 20)}...`;
    const nextVer = {
      id: `ver_${Date.now()}`,
      timestamp: Date.now(),
      label,
      script,
      title,
      tone
    };
    setLocalStorageHistory(prev => [nextVer, ...prev]);
    toast.success("Design snapshot added to local history checklist! 📁");
  };

  const handleExportPDF = () => {
    if (!script) {
      toast.error("Nothing to export yet. Generate or write a script first!");
      return;
    }
    try {
      const printWindow = window.open('', '_blank');
      if (!printWindow) {
        toast.error("Popup blocked! Please allow popups to export as PDF.");
        return;
      }

      printWindow.document.write(`
        <html>
          <head>
            <title>${title || 'Draft Script'} - Ranktica AI Export</title>
            <link href="https://fonts.googleapis.com/css2?family=Inter:ital,wght@0,400;0,600;0,800;1,400&family=JetBrains+Mono:wght@400;700&display=swap" rel="stylesheet">
            <style>
              body {
                font-family: 'Inter', sans-serif;
                color: #18181b;
                line-height: 1.7;
                padding: 0.5in;
                max-width: 8.5in;
                margin: 0 auto;
                background: #fff;
              }
              @media print {
                body {
                  padding: 0.25in;
                }
                .no-print {
                  display: none;
                }
              }
              header {
                border-bottom: 2px solid #e4e4e7;
                padding-bottom: 20px;
                margin-bottom: 30px;
              }
              .meta-grid {
                display: grid;
                grid-template-columns: repeat(2, 1fr);
                gap: 15px;
                margin-bottom: 25px;
                font-size: 11px;
                text-transform: uppercase;
                letter-spacing: 0.05em;
                color: #71717a;
              }
              .meta-item strong {
                color: #18181b;
              }
              h1 {
                font-size: 28px;
                font-weight: 800;
                letter-spacing: -0.025em;
                color: #0c0a09;
                margin: 0 0 10px 0;
              }
              .script-content {
                font-size: 14px;
                white-space: pre-wrap;
                color: #27272a;
              }
              .cue {
                font-family: 'JetBrains Mono', monospace;
                background-color: #f4f4f5;
                border: 1px dashed #d4d4d8;
                color: #ef4444;
                padding: 4px 8px;
                border-radius: 4px;
                font-size: 11px;
                display: block;
                margin: 15px 0;
                font-weight: 700;
              }
              .footer-note {
                margin-top: 50px;
                border-top: 1px solid #e4e4e7;
                padding-top: 15px;
                font-size: 10px;
                text-align: center;
                color: #a1a1aa;
              }
            </style>
          </head>
          <body>
            <div class="no-print" style="position: sticky; top: 0; background: #fafafa; border: 1px solid #e4e4e7; padding: 10px 20px; margin-bottom: 20px; display: flex; justify-content: space-between; align-items: center; border-radius: 8px;">
              <span style="font-size: 12px; font-weight: bold; color: #52525b;">📄 PDF Document Generator is ready</span>
              <button onclick="window.print()" style="background: #ef4444; color: white; border: none; padding: 8px 16px; border-radius: 6px; font-size: 11px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.05em; cursor: pointer;">
                Save or Print PDF
              </button>
            </div>
            <header>
              <div style="font-size: 10px; font-weight: 800; color: #ef4444; letter-spacing: 0.25em; margin-bottom: 5px;">RANKTICA AI STUDIO EXPORT</div>
              <h1>${title || 'Untitled Video Project'}</h1>
              <div class="meta-grid">
                <div class="meta-item">Tone Mode: <strong>${tone}</strong></div>
                <div class="meta-item">Est. Duration: <strong>${calculatedReadingMetrics.formatted}</strong></div>
                <div class="meta-item">Word Count: <strong>${calculatedReadingMetrics.words}</strong></div>
                <div class="meta-item">Characters: <strong>${calculatedReadingMetrics.chars}</strong></div>
              </div>
            </header>
            <main class="script-content">${
              script.replace(/(\[Visual:.*?\])/g, '<span class="cue">$1</span>')
            }</main>
            <div class="footer-note">
              Generated via Ranktica AI Studio Script Architect on ${new Date().toLocaleDateString()}
            </div>
            <script>
              window.addEventListener('DOMContentLoaded', () => {
                setTimeout(() => {
                  window.print();
                }, 500);
              });
            </script>
          </body>
        </html>
      `);
      printWindow.document.close();
      toast.success("Ready for export! Adjust printer preferences to 'Save as PDF' 📄");
    } catch (error) {
      console.error("PDF printing failed:", error);
      toast.error("Could not construct document frame");
    }
  };

  const auditData = useMemo(() => {
    if (!script) return { avgGap: 0, violationsCount: 0, heatmap: [], estTime: 0, wpm: 0 };
    
    // Spoken text only (remove visual tags)
    const spoken = script.replace(/\[Visual:.*?\]/g, '').trim();
    const totalWords = spoken.split(/\s+/).filter(w => w.length > 0).length;
    
    // Estimate time based on dynamically configured or fallback pacing selector
    const estTimeSeconds = (totalWords / calculatedReadingMetrics.wpm) * 60;
    
    // Split into segments separated by visual cues
    const segments = script.split(/\[Visual:.*?\]/g).filter(s => s.trim().length > 0);
    const gaps = segments.map(s => s.trim().split(/\s+/).filter(w => w.length > 0).length);
    
    const avgGap = gaps.length > 0 ? Math.round(gaps.reduce((a, b) => a + b, 0) / gaps.length) : 0;
    const violations = gaps.filter(g => g > 15 || g < 8);
    
    // Create a heatmap where High Heat = Good Retention (Gap between 8-15 words)
    const heatmap = gaps.map((g, i) => ({
      name: `Seg ${i + 1}`,
      Retention: (g >= 8 && g <= 15) ? 95 : (g > 15 ? Math.max(30, 100 - (g - 15) * 5) : 60),
      Words: g
    }));

    return { avgGap, violationsCount: violations.length, heatmap, estTime: estTimeSeconds, wpm: calculatedReadingMetrics.wpm };
  }, [script, calculatedReadingMetrics]);

  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle');

  // Auto-save logic
  useEffect(() => {
    if (!activeProject) return;

    const currentScript = activeProject.assets?.script || '';
    const currentTitle = activeProject.title || '';

    if (script === currentScript && title === currentTitle) {
      return;
    }

    const timer = setTimeout(async () => {
      setSaveStatus('saving');
      const toastId = toast.loading('Auto-saving script...', { id: 'script-autosave' });
      try {
        await updateActiveProject({
          title,
          assets: {
            ...activeProject.assets,
            script
          }
        });
        setSaveStatus('saved');
        triggerHapticFeedback(15);
        toast.success('Workspace auto-saved!', { id: 'script-autosave' });
        
        setTimeout(() => setSaveStatus('idle'), 2000);
      } catch (err) {
        console.error(err);
        toast.error('Auto-save failed!', { id: 'script-autosave' });
        setSaveStatus('idle');
      }
    }, 3000);

    return () => clearTimeout(timer);
  }, [script, title, activeProject]);

  useEffect(() => {
    if (prefill) {
      if (prefill.title) setTitle(prefill.title);
      if (prefill.instructions) setInstructions(prefill.instructions);
    }
  }, [prefill]);

  // Load the script and title when the selected project changes
  useEffect(() => {
    if (activeProject && activeProject.id !== lastLoadedProjectId.current) {
      lastLoadedProjectId.current = activeProject.id;
      setScript(activeProject.assets?.script || '');
      setTitle(activeProject.title || '');
      setInstructions('');
    }
  }, [activeProject]);

  const handleSyncStepToCalendar = async (customDate: Date, windowLabel: string) => {
    try {
      let token = getCachedToken();
      if (!token) {
        toast.loading('Google authorization needed. Spawning consent popup...', { id: 'gcal-script' });
        const authResult = await loginWithGoogle();
        token = authResult.token;
        toast.success('Successfully authorized Google Workspace!', { id: 'gcal-script' });
      }

      const isConfirmed = window.confirm(`Authorize Ranktica to add this suggested release date to your Google Calendar?`);
      if (!isConfirmed) return;

      toast.loading('Synchronizing with Google Calendar API...', { id: 'gcal-script' });

      const endDate = new Date(customDate.getTime() + 60 * 60 * 1000); // 1 hour slot

      const eventPayload = {
        summary: `📢 [Release] ${title || 'Untitled Video'}`,
        description: `Video Title: ${title || 'Untitled'}\nSuggested Peak Window: ${windowLabel}\n\nGenerated Script Brief:\n"${script.substring(0, 300)}..."`,
        start: {
          dateTime: customDate.toISOString(),
          timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC'
        },
        end: {
          dateTime: endDate.toISOString(),
          timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC'
        },
        reminders: {
          useDefault: true
        }
      };

      const response = await fetch('https://www.googleapis.com/calendar/v3/calendars/primary/events', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(eventPayload)
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.error?.message || 'Google Calendar API rejected.');
      }

      toast.success(`Video scheduled on Google Calendar for ${customDate.toLocaleDateString()} at ${customDate.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}! 📅`, { id: 'gcal-script' });
    } catch (err: any) {
      toast.error(`Sync Failed: ${err.message}`, { id: 'gcal-script' });
    }
  };

  const applyPreset = (p: typeof SCRIPT_PRESETS[0]) => {
    const oldTitle = title;
    const oldTone = tone;
    const oldType = scriptType;
    const oldInstructions = instructions;

    setTitle(p.title);
    setTone(p.tone);
    setScriptType(p.type);
    setInstructions(p.instructions);
    setShowPresets(false);

    registerCommand(
      'Script Writer',
      `Applied preset bias: "${p.label}"`,
      () => {
        setTitle(oldTitle);
        setTone(oldTone);
        setScriptType(oldType);
        setInstructions(oldInstructions);
      },
      () => {
        setTitle(p.title);
        setTone(p.tone);
        setScriptType(p.type);
        setInstructions(p.instructions);
      }
    );
  };

  useEffect(() => {
    const handleRankticaAction = (event: Event) => {
      const customEvent = event as CustomEvent;
      const { actionType } = customEvent.detail || {};
      if (actionType === 'generate') {
         if (!title.trim()) {
           applyPreset({
             id: "future-ai",
             label: "Future AI Workflows",
             title: "The Future of AI & Creator Workflows",
             tone: "informative",
             type: "full-length",
             instructions: "Draft a high-retainment educational video script highlighting cost optimization."
           });
         }
         setTimeout(() => {
           handleGenerate();
         }, 100);
      } else if (actionType === 'save') {
         // Notify the user of simulated manual save
         if (activeProject && script) {
           addScriptVersion(activeProject.id, script, "Workspace Checkpoint");
           updateActiveProject({ assets: { ...activeProject.assets, script } });
           triggerHapticFeedback([50, 30, 50]);
           toast.success("Script workspace saved into local Project Manifest");
         } else {
           toast.error("Set an Active Project from Dashboard to save scripts.");
         }
      } else if (actionType === 'clear') {
         setTitle('');
         setScript('');
         setInstructions('');
         toast.success("Script workspace cleared");
      }
    };
    
    window.addEventListener('ranktica-action', handleRankticaAction);
    return () => window.removeEventListener('ranktica-action', handleRankticaAction);
  }, [title, tone, scriptType, instructions, script]);

  const handleGenerate = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!title.trim()) return;
    setIsGenerating(true);
    const preGenerationScript = script;
    setScript('');
    setSummaryText(''); // Clear old summary to trigger a fresh premium recap
    let finalScript = '';
    
    // Prime the model with selected brand voice persona guidelines
    const fullInstructions = `Active Channel Persona Brand Voice: "${activePersona.name}" - Guidelines: ${activePersona.guidelines}\n\nAdditional Narrative Constraints:\n${instructions || 'No additional constraints.'}`;

    const taskId = `script-gen-${Date.now()}`;
    window.dispatchEvent(new CustomEvent('ranktica-background-task', {
      detail: {
        id: taskId,
        name: `Scripting Core: "${title}"`,
        type: 'script_finalization',
        duration: 15,
        status: 'start',
      }
    }));

    try {
      await generateScriptStream(title, tone, scriptType, fullInstructions, (chunk) => {
        finalScript += chunk;
        setScript(prev => prev + chunk);
      });
      incrementStat('scriptsWritten');

      // Dispatch dynamic Resource Cost telemetry event
      try {
        const wordCount = finalScript.split(/\s+/).filter(Boolean).length || 100;
        const estCost = estimateTaskCost('script', { wordCount, model: 'pro' });
        window.dispatchEvent(new CustomEvent('ranktica-ai-generation', {
          detail: {
            type: `Script Generation: ${title.substring(0, 24)}`,
            model: 'gemini-2.5-pro',
            cost: estCost.apiCostUSD,
            inputTokens: estCost.inputTokens,
            outputTokens: estCost.outputTokens
          }
        }));
      } catch (e) {
        console.warn("Failed to dispatch script cost telemetry", e);
      }
      logActivity(`Drafted video script titled "${title}" as a ${tone} ${scriptType}`, "Scripting Core", "script");
      
      window.dispatchEvent(new CustomEvent('ranktica-background-task', {
        detail: {
          id: taskId,
          name: `Scripting Core: "${title}"`,
          status: 'complete',
        }
      }));
      
      // Auto-save generation to local storage backup history timeline
      const label = `AI Drafted: "${title.substring(0, 16)}..." (${tone})`;
      const nextVer = {
        id: `ver_${Date.now()}`,
        timestamp: Date.now(),
        label,
        script: finalScript,
        title,
        tone
      };
      setLocalStorageHistory(prev => [nextVer, ...prev]);

      if (activeProject && finalScript) {
        await addScriptVersion(activeProject.id, finalScript, `AI Drafting: ${tone}`);
        await updateActiveProject({
          title: title,
          assets: { ...activeProject.assets, script: finalScript }
        });
      }

      registerCommand(
        'Script Writer',
        `Generated AI Screenplay: "${title}"`,
        () => {
          setScript(preGenerationScript);
        },
        () => {
          setScript(finalScript);
        }
      );

      // Automatically compile dynamic 3-bullet executive alignments
      await handleGenerateSummary(finalScript);

    } catch (err) { 
      console.error(err); 
      toast.error("Generation encountered an error. Please retry.");
      window.dispatchEvent(new CustomEvent('ranktica-background-task', {
        detail: {
          id: taskId,
          name: `Scripting Core: "${title}"`,
          status: 'failed',
        }
      }));
    } finally { 
      setIsGenerating(false); 
    }
  };

  const handleOptimizePacing = async () => {
    if (!script) return;
    setIsOptimizing(true);
    const original = script;
    setScript('');
    let finalScript = '';
    try {
      await optimizeScriptPacing(original, (chunk) => {
        finalScript += chunk;
        setScript(prev => prev + chunk);
      });

      // Dispatch dynamic Resource Cost telemetry event for pacing optimization
      try {
        const wordCount = finalScript.split(/\s+/).filter(Boolean).length || 100;
        const estCost = estimateTaskCost('script', { wordCount, model: 'flash' });
        window.dispatchEvent(new CustomEvent('ranktica-ai-generation', {
          detail: {
            type: 'Pacing Optimization: Retention Blitz',
            model: 'gemini-2.5-flash',
            cost: estCost.apiCostUSD,
            inputTokens: estCost.inputTokens,
            outputTokens: estCost.outputTokens
          }
        }));
      } catch (e) {
        console.warn("Failed to dispatch pacing cost telemetry", e);
      }

      // Auto-save optimization to local storage backup history timeline
      const label = `Optimized Retention Blitz`;
      const nextVer = {
        id: `ver_${Date.now()}`,
        timestamp: Date.now(),
        label,
        script: finalScript,
        title,
        tone
      };
      setLocalStorageHistory(prev => [nextVer, ...prev]);

      if (activeProject && finalScript) {
        await addScriptVersion(activeProject.id, finalScript, "Retention Blitz Optimization");
        await updateActiveProject({ assets: { ...activeProject.assets, script: finalScript } });
      }

      registerCommand(
        'Script Writer',
        `Optimized pacing: Retention Blitz`,
        () => {
          setScript(original);
        },
        () => {
          setScript(finalScript);
        }
      );
    } catch (err) { console.error(err); setScript(original); } 
    finally { setIsOptimizing(false); }
  };

  return (
    <div className="h-[calc(100vh-6rem)] flex flex-col md:flex-row gap-6 animate-fade-in pb-10">
      <div className="w-full md:w-[380px] space-y-6 flex flex-col shrink-0">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-black text-white">Script Architect</h2>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setShowTemplatesGallery(true)}
              className="flex items-center gap-1 bg-red-600/10 hover:bg-red-600/15 text-red-500 border border-red-550/20 hover:border-red-500/30 px-2.5 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-wider transition-all cursor-pointer"
              title="Save or retrieve commonly used outline structures as templates"
            >
              <BookOpen size={10} /> Gallery
            </button>
            <div className="relative">
              <button onClick={() => setShowPresets(!showPresets)} className="flex items-center gap-1 bg-zinc-900 hover:bg-zinc-850 text-white px-2.5 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-wider border border-zinc-800 transition-all cursor-pointer">
                Blue <ChevronDown size={10} />
              </button>
              {showPresets && (
                <div className="absolute top-full right-0 mt-2 w-64 bg-zinc-900 border border-zinc-800 rounded-2xl shadow-2xl z-50 overflow-hidden glass-morphism">
                  {SCRIPT_PRESETS.map(p => (
                    <button key={p.id} onClick={() => applyPreset(p)} className="w-full text-left px-4 py-3 hover:bg-red-500/10 text-zinc-400 text-sm border-b border-zinc-800 last:border-0 transition-colors cursor-pointer">
                      {p.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        <form onSubmit={handleGenerate} className="space-y-4 p-6 bg-zinc-900 border border-zinc-800 rounded-[2.5rem] flex-1 flex flex-col shadow-2xl">
          <input 
            type="text" 
            value={title} 
            onChange={(e) => setTitle(e.target.value)} 
            onFocus={() => { lastTitleRef.current = title; }}
            onBlur={handleTitleBlur}
            placeholder="Headline" 
            className="w-full bg-zinc-950 border border-zinc-800 rounded-2xl px-5 py-4 text-white font-medium focus:ring-2 focus:ring-red-500/50 outline-none" 
          />
          <textarea 
            value={instructions} 
            onChange={(e) => setInstructions(e.target.value)} 
            onFocus={() => { lastInstructionsRef.current = instructions; }}
            onBlur={handleInstructionsBlur}
            placeholder="Narrative constraints..." 
            className="flex-1 bg-zinc-950 border border-zinc-800 rounded-2xl p-5 outline-none resize-none text-white text-sm leading-relaxed" 
          />
          
          {/* Channel Persona Config setting */}
          <div className="border-t border-zinc-850 pt-3 mt-1">
            <div className="flex items-center justify-between mb-2">
              <label className="text-[9px] font-black uppercase tracking-widest text-zinc-500 flex items-center gap-1.5">
                <Settings size={11} className="text-red-500" /> Channel Brand Voice
              </label>
              <button 
                type="button" 
                onClick={() => setShowPersonaSettings(!showPersonaSettings)} 
                className="text-[8px] text-zinc-400 hover:text-red-400 font-extrabold uppercase tracking-wider transition-colors cursor-pointer"
              >
                {showPersonaSettings ? "Hide Manager" : "Manage Brand Voices"}
              </button>
            </div>
            
            <select 
              value={activePersonaId} 
              onChange={(e) => setActivePersonaId(e.target.value)} 
              className="w-full bg-zinc-950 border border-zinc-850 rounded-xl px-4 py-2.5 text-[10px] font-black uppercase text-white appearance-none cursor-pointer focus:ring-1 focus:ring-red-500/50 outline-none"
            >
              {allPersonas.map(p => (
                <option key={p.id} value={p.id}>
                  🎙️ {p.name} {p.id.startsWith('persona_') ? '(Custom)' : ''}
                </option>
              ))}
            </select>

            {/* Persona Settings & Guidelines Details / Adds */}
            {showPersonaSettings ? (
              <div className="mt-3 bg-zinc-950/70 border border-zinc-850 rounded-2xl p-3 space-y-3.5 animate-scale-in text-left">
                <div className="space-y-1">
                  <span className="text-[8px] text-zinc-500 font-black uppercase tracking-widest">Active Voice Definition:</span>
                  <p className="text-[10px] text-zinc-300 leading-normal italic bg-zinc-900/60 p-2 rounded-xl border border-zinc-850/30">
                    "{activePersona.guidelines}"
                  </p>
                </div>

                {/* Save Custom Brand Persona Form */}
                <div className="border-t border-zinc-850 pt-2.5 space-y-2">
                  <span className="text-[8px] text-red-500 font-bold uppercase tracking-wider">Save Custom Brand Persona</span>
                  <input 
                    type="text" 
                    placeholder="e.g. Cooking Guru, AI Hustler" 
                    value={newPersonaName}
                    onChange={(e) => setNewPersonaName(e.target.value)}
                    className="w-full bg-[#121214] border border-zinc-800 rounded-lg px-2.5 py-1 text-[10px] text-white outline-none"
                  />
                  <textarea 
                    placeholder="Define precise voice guidelines (e.g., Speak in short statements, mention organic ingredients often, use high excitement)..." 
                    value={newPersonaGuidelines}
                    onChange={(e) => setNewPersonaGuidelines(e.target.value)}
                    className="w-full h-14 bg-[#121214] border border-zinc-800 rounded-lg p-2 text-[10px] text-white resize-none outline-none leading-normal"
                  />
                  <div className="flex justify-between items-center pt-1">
                    <span className="text-[7.5px] text-zinc-650 uppercase font-mono">PERSISTS LOCALLY</span>
                    <button 
                      type="button" 
                      onClick={handleCreateCustomPersona}
                      className="bg-red-600 hover:bg-red-500 text-white px-2.5 py-1 rounded-lg text-[8px] font-black uppercase transition-colors cursor-pointer"
                    >
                      Save Persona
                    </button>
                  </div>
                </div>

                {/* List Custom Personas for deletions */}
                {customPersonas.length > 0 && (
                  <div className="border-t border-zinc-850 pt-2.5 space-y-1.5">
                    <span className="text-[8px] text-zinc-500 font-bold uppercase">Custom brand library</span>
                    <div className="space-y-1 max-h-24 overflow-y-auto custom-scrollbar pr-1">
                      {customPersonas.map(p => (
                        <div key={p.id} className="flex justify-between items-center bg-[#121214]/60 p-1.5 rounded-lg border border-zinc-850 text-[9px] text-zinc-300">
                          <span className="truncate font-medium">{p.name}</span>
                          <button 
                            type="button" 
                            onClick={() => handleDeletePersona(p.id)}
                            className="text-[8px] text-zinc-500 hover:text-red-500 font-bold uppercase transition-colors"
                          >
                            Delete
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <p className="text-[8px] text-zinc-550 mt-1.5 italic pl-0.5" title="Persona parameters are injected automatically to prime Gemini output">
                Active Prime: <strong className="text-zinc-400 font-black">{activePersona.name}</strong> voice filter applied.
              </p>
            )}
          </div>

          {/* AI Pre-Calculation & Cost Estimator Forecasting Panel */}
          <div className="bg-zinc-950 border border-zinc-850 rounded-2xl p-4.5 space-y-3.5 mb-2">
            <div className="flex items-center justify-between">
              <span className="text-[9.5px] font-black uppercase text-zinc-400 flex items-center gap-1.5 tracking-wider">
                <Activity size={12} className="text-red-500 animate-pulse" /> AI Cost Forecast Estimator
              </span>
              <span className="text-[8px] px-2 py-0.5 font-mono font-black uppercase rounded-full bg-red-950 border border-red-900/30 text-red-400">
                Pre-Execution Analysis
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3.5">
              <div>
                <label className="text-[8.5px] font-black text-zinc-450 uppercase mb-1 flex items-center gap-1">
                  Target Length: <span className="text-zinc-350">{estimateWordCount} words</span>
                </label>
                <input 
                  type="range" 
                  min="300" 
                  max="3000" 
                  step="100" 
                  value={estimateWordCount} 
                  onChange={(e) => setEstimateWordCount(parseInt(e.target.value))} 
                  className="w-full h-1 bg-zinc-850 rounded-lg appearance-none cursor-pointer accent-red-600 focus:outline-none"
                />
              </div>

              <div>
                <label className="text-[8.5px] font-black text-zinc-450 uppercase mb-1 flex items-center gap-1">
                  Engine Model Accuracy
                </label>
                <div className="flex bg-zinc-900 rounded-md p-0.5 border border-zinc-800">
                  <button 
                    type="button" 
                    onClick={() => setEstimateModel('flash')} 
                    className={`flex-1 text-[8.5px] font-black uppercase py-1 rounded transition-all ${estimateModel === 'flash' ? 'bg-zinc-850 text-white' : 'text-zinc-550'}`}
                  >
                    Flash Lite
                  </button>
                  <button 
                    type="button" 
                    onClick={() => setEstimateModel('pro')} 
                    className={`flex-1 text-[8.5px] font-black uppercase py-1 rounded transition-all ${estimateModel === 'pro' ? 'bg-red-600/10 text-red-400 border border-red-500/20' : 'text-zinc-550'}`}
                  >
                    Smart Pro
                  </button>
                </div>
              </div>
            </div>

            {(() => {
              const est = estimateTaskCost('script', { wordCount: estimateWordCount, model: estimateModel });
              return (
                <div className="grid grid-cols-4 gap-2 bg-zinc-900/40 border border-zinc-900/80 p-2.5 rounded-xl">
                  <div className="text-center">
                    <p className="text-[7.5px] font-black text-zinc-550 uppercase tracking-tight">Input Tokens</p>
                    <p className="text-[10px] font-mono font-black text-zinc-350">{est.inputTokens.toLocaleString()}</p>
                  </div>
                  <div className="text-center border-l border-zinc-850">
                    <p className="text-[7.5px] font-black text-zinc-550 uppercase tracking-tight">Output Tokens</p>
                    <p className="text-[10px] font-mono font-black text-zinc-350">{est.outputTokens.toLocaleString()}</p>
                  </div>
                  <div className="text-center border-l border-zinc-850">
                    <p className="text-[7.5px] font-black text-zinc-550 uppercase tracking-tight">API Cost (USD)</p>
                    <p className="text-[10px] font-mono font-black text-green-400">${est.apiCostUSD.toFixed(5)}</p>
                  </div>
                  <div className="text-center border-l border-zinc-850">
                    <p className="text-[7.5px] font-black text-zinc-550 uppercase tracking-tight">Quota Credit</p>
                    <p className="text-[10px] font-mono font-black text-red-400">-{est.limitCostCredits}</p>
                  </div>
                </div>
              );
            })()}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <select value={tone} onChange={(e) => setTone(e.target.value)} className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 text-[10px] font-black uppercase text-white appearance-none cursor-pointer">
              <option>Fast-paced & Hype</option>
              <option>Energetic</option>
              <option>Professional</option>
              <option>Casual</option>
              <option>Dramatic</option>
            </select>
            <button type="submit" disabled={isGenerating || !title} className="bg-red-600 hover:bg-red-500 text-white rounded-xl font-black uppercase text-xs tracking-widest flex items-center justify-center gap-2">
              {isGenerating ? <Loader2 className="animate-spin" size={18} /> : <Sparkles size={18} />} Synthesize
            </button>
          </div>
        </form>

        {script && (
          <div className="bg-zinc-900 border border-zinc-800 p-6 rounded-[2.5rem] animate-scale-in space-y-4">
             {/* Dual Tab Toggle Header */}
             <div className="flex items-center justify-between border-b border-zinc-850 pb-2.5">
                <div className="flex gap-4">
                   <button
                     type="button"
                     onClick={() => setAnalyticsTab('curve')}
                     className={`text-[9.5px] font-black uppercase tracking-wider pb-1 transition-all border-b-2 cursor-pointer ${analyticsTab === 'curve' ? 'border-red-500 text-white font-extrabold' : 'border-transparent text-zinc-500 hover:text-zinc-350'}`}
                   >
                     📂 Pacing Curve
                   </button>
                   <button
                     type="button"
                     onClick={() => setAnalyticsTab('heatmap')}
                     className={`text-[9.5px] font-black uppercase tracking-wider pb-1 transition-all border-b-2 cursor-pointer ${analyticsTab === 'heatmap' ? 'border-red-500 text-white font-extrabold' : 'border-transparent text-zinc-500 hover:text-zinc-350'}`}
                     title="Retention Heatmap Simulating Drop-off Dynamics"
                   >
                     🔥 Heatmap Simulator
                   </button>
                   <button
                     type="button"
                     onClick={() => setAnalyticsTab('scheduler')}
                     className={`text-[9.5px] font-black uppercase tracking-wider pb-1 transition-all border-b-2 cursor-pointer ${analyticsTab === 'scheduler' ? 'border-red-500 text-white font-extrabold' : 'border-transparent text-zinc-500 hover:text-zinc-350'}`}
                     title="AI Predicted Peak Performance Release Scheduling Windows"
                   >
                     📅 Calendar Suggestions
                   </button>
                </div>
                <div className="flex items-center gap-1">
                   <Clock size={11} className="text-zinc-500" />
                   <span className="text-[9.5px] font-bold text-zinc-400 font-mono">{Math.floor(auditData.estTime / 60)}m {Math.floor(auditData.estTime % 60)}s</span>
                </div>
             </div>

             {analyticsTab === 'curve' ? (
               <div className="space-y-4 animate-scale-in">
                 <div className="h-24 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                       <AreaChart data={auditData.heatmap}>
                          <Tooltip 
                            contentStyle={{ backgroundColor: '#0f0f12', border: '1px solid #27272a', borderRadius: '8px' }}
                            itemStyle={{ color: '#ef4444', fontSize: '10px' }}
                          />
                          <Area type="monotone" dataKey="Retention" stroke="#ef4444" fill="#ef444433" strokeWidth={2} />
                       </AreaChart>
                    </ResponsiveContainer>
                 </div>
                 
                 {/* Pacing Auditor Alert */}
                 <div className={`p-4 rounded-2xl border flex items-start gap-2.5 transition-all ${auditData.violationsCount > 0 ? 'bg-orange-500/10 border-orange-500/30 text-orange-400' : 'bg-green-500/10 border-green-500/30 text-green-400'}`}>
                    {auditData.violationsCount > 0 ? <ShieldAlert size={16} className="shrink-0 mt-0.5" /> : <CheckCircle2 size={16} className="shrink-0 mt-0.5" />}
                    <div className="text-left">
                       <p className="text-[10px] font-black uppercase tracking-widest leading-none">
                          {auditData.violationsCount > 0 ? 'Pacing Violation' : 'Velocity Optimal'}
                       </p>
                       <p className="text-[10px] font-medium opacity-80 mt-1 leading-relaxed">
                          {auditData.violationsCount > 0 
                            ? `${auditData.violationsCount} sections violate the 10-15 word visual cue pacing guidelines.` 
                            : 'Linguistic velocity matches typical target metrics.'}
                       </p>
                    </div>
                 </div>
               </div>
             ) : analyticsTab === 'heatmap' ? (
               <div className="space-y-3.5 text-left animate-scale-in pb-1">
                 <div className="flex items-center justify-between text-[8px] text-zinc-500 font-black uppercase tracking-wider pl-0.5">
                   <span>Audience Heat (0% ➔ 100%)</span>
                   <span className="text-rose-500">Pacing: {scriptType}</span>
                 </div>

                 {/* Colored Horizontal Heatmap strip */}
                 <div className="flex h-5 w-full bg-zinc-950 rounded-lg overflow-hidden border border-zinc-850 p-0.5 select-none gap-0.5">
                   {(() => {
                     const patterns = getSimulatedRetentionPatterns(scriptType);
                     return patterns.map((node, idx) => {
                       let colorClass = 'bg-zinc-800';
                       if (node.retention >= 90) colorClass = 'bg-emerald-500';
                       else if (node.retention >= 70) colorClass = 'bg-teal-400';
                       else if (node.retention >= 50) colorClass = 'bg-amber-400';
                       else colorClass = 'bg-red-650';

                       const isSelected = selectedHeatmapIdx === idx;
                       return (
                         <button
                           key={idx}
                           type="button"
                           onClick={() => setSelectedHeatmapIdx(idx)}
                           className={`flex-1 h-full rounded transition-all text-[8.5px] font-black font-mono text-zinc-950 flex items-center justify-center cursor-pointer ${colorClass} ${isSelected ? 'ring-2 ring-white scale-y-115 z-10 hover:brightness-125' : 'hover:opacity-90'}`}
                           title={`${node.action} (${node.retention}%)`}
                         >
                           {idx + 1}
                         </button>
                       );
                     });
                   })()}
                 </div>

                 {/* Interactive Insight Node Card */}
                 {(() => {
                   const patterns = getSimulatedRetentionPatterns(scriptType);
                   const idx = selectedHeatmapIdx !== null ? selectedHeatmapIdx : patterns.findIndex(p => p.retention < 60) !== -1 ? patterns.findIndex(p => p.retention < 60) : 0;
                   const node = patterns[idx] || patterns[0];

                   let badgeClass = 'bg-zinc-900 border border-zinc-800 text-zinc-400';
                   if (node.retention >= 90) badgeClass = 'bg-emerald-550/10 text-emerald-400 border border-emerald-500/20';
                   else if (node.retention >= 70) badgeClass = 'bg-teal-550/10 text-teal-400 border border-teal-500/20';
                   else if (node.retention >= 50) badgeClass = 'bg-amber-550/10 text-amber-400 border border-amber-550/20';
                   else badgeClass = 'bg-red-550/10 text-red-400 border border-red-500/20 animate-pulse';

                   return (
                     <div className="bg-zinc-950 p-4 rounded-2xl border border-zinc-850 space-y-2.5 animate-scale-in">
                       <div className="flex justify-between items-center">
                         <span className="text-[8.5px] text-zinc-500 font-extrabold uppercase font-mono">Segment #{idx + 1} timeline ({node.percentage})</span>
                         <span className={`text-[8px] font-black uppercase px-2 py-0.5 rounded leading-none ${badgeClass}`}>
                           {node.status} ({node.retention}%)
                         </span>
                       </div>
                       <h5 className="text-[11px] font-black text-white leading-none">{node.action}</h5>
                       <p className="text-[10px] text-zinc-400 leading-normal">{node.desc}</p>
                       
                       <div className="border-t border-zinc-900/60 pt-2.5 bg-zinc-900/40 p-2.5 rounded-xl border border-zinc-90/50 text-[10px] text-rose-400 italic flex gap-1.5 items-start font-medium leading-relaxed">
                         <span className="shrink-0 text-red-500">💡</span>
                         <span>
                           {node.retention < 60 
                             ? 'Retention Risk: Pacing lull mapped. Introduce strict pattern interrupts, visual changes, or a sound trigger.'
                             : 'Pace pay-off: Momentum is high. Keep explanations punchy and maintain immediate forward drive.'}
                         </span>
                       </div>
                     </div>
                   );
                 })()}
               </div>
             ) : (
               <div className="space-y-3.5 text-left animate-scale-in pb-1">
                 <div className="flex items-center justify-between text-[8.5px] text-zinc-500 font-black uppercase tracking-wider pl-0.5">
                   <span>Optimal Scheduling Windows (TrendWatcher matched)</span>
                   <span className="text-emerald-500">Dynamic Predictions</span>
                 </div>

                 {(() => {
                   const normalized = (title || '').toLowerCase();
                   let trendName = "General Viral Growth Window";
                   let whyTrend = "Sustained interest in high-quality video content formats across platforms.";
                   let velocity = "+150%";

                   if (normalized.includes('ai') || normalized.includes('code') || normalized.includes('coding') || normalized.includes('gpt') || normalized.includes('gemini')) {
                     trendName = "Exploding No-Code AI / AI Coding Trend";
                     whyTrend = "Breakout search volume for generative AI tutorials and autonomous agents during early weekdays.";
                     velocity = "+420%";
                   } else if (normalized.includes('marketing') || normalized.includes('agency') || normalized.includes('business') || normalized.includes('client')) {
                     trendName = "Rising Remote Agency & Marketing Shift";
                     whyTrend = "Growing industry interest in SaaS client retention strategies and workflow automation hubs.";
                     velocity = "+280%";
                   } else if (normalized.includes('game') || normalized.includes('gaming') || normalized.includes('play')) {
                     trendName = "Viral Short-Form Interactive Gaming Trend";
                     whyTrend = "TikTok and YouTube Shorts algorithms actively push game mechanics and screen-recording overlays.";
                     velocity = "+310%";
                   } else if (normalized.includes('money') || normalized.includes('crypto') || normalized.includes('finance') || normalized.includes('budget')) {
                     trendName = "Finance Interest Spark Trend";
                     whyTrend = "Macroeconomic updates and budget optimization metrics are spiking on consumer search indices.";
                     velocity = "+195%";
                   }

                   const date1 = new Date();
                   date1.setDate(date1.getDate() + 1); // Tomorrow
                   date1.setHours(11, 30, 0, 0); // 11:30 AM

                   const date2 = new Date();
                   date2.setDate(date2.getDate() + 3); // 3 days from now
                   date2.setHours(16, 15, 0, 0); // 4:15 PM

                   const suggestions = [
                     {
                       date: date1,
                       label: `${trendName} (Morning High-Velocity)`,
                       timeStr: `${date1.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })} at 11:30 AM (Tomorrow)`,
                       desc: `Why: Early-morning seekers are active. Search indices show ${velocity} breakout velocity. ${whyTrend}`
                     },
                     {
                       date: date2,
                       label: `${trendName} (Evening Catch-up Peak)`,
                       timeStr: `${date2.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })} at 4:15 PM (In 3 Days)`,
                       desc: `Why: High weekend/end-of-week casual developer retention. Mobile traffic spikes by up to 2.5x after office hours.`
                     }
                   ];

                   return (
                     <div className="space-y-3">
                       {suggestions.map((s, idx) => (
                         <div key={idx} className="bg-zinc-950 p-3 rounded-2xl border border-zinc-850 space-y-2">
                           <div className="flex justify-between items-start gap-1">
                             <div>
                               <span className="text-[7.5px] font-black uppercase text-red-500 tracking-wider">Option {idx + 1}</span>
                               <h5 className="text-[11px] font-black text-zinc-150 leading-none mt-0.5">{s.label}</h5>
                             </div>
                             <span className="px-2 py-0.5 bg-red-600/10 border border-red-500/20 text-red-500 text-[8.5px] font-black uppercase rounded-md tracking-wider whitespace-nowrap">
                               {velocity} Traffic
                             </span>
                           </div>
                           
                           <p className="text-[9.5px] text-zinc-400 font-mono font-medium">{s.timeStr}</p>
                           <p className="text-[9.5px] text-zinc-500 leading-normal">{s.desc}</p>
                           
                           <button
                             type="button"
                             onClick={() => handleSyncStepToCalendar(s.date, s.label)}
                             className="w-full flex items-center justify-center gap-1.5 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-[9px] font-black uppercase tracking-wider transition-all mt-1 cursor-pointer"
                           >
                             <Calendar size={11} /> Sync Release to GCal
                           </button>
                         </div>
                       ))}
                     </div>
                   );
                 })()}
               </div>
             )}

             {/* Readability Score and Demographic target */}
             <div className="border-t border-zinc-800 pt-4 space-y-3">
                <div className="flex items-center justify-between">
                   <h3 className="text-[10px] font-black text-zinc-600 uppercase tracking-widest flex items-center gap-2">
                     <Gauge size={14} className="text-blue-400" /> Readability Index
                   </h3>
                   <span className="text-[9px] font-bold text-zinc-500 uppercase">{readabilityScore.gradeLevel}</span>
                </div>
                <div className="grid grid-cols-2 gap-3">
                   <div className="bg-zinc-950 p-3 rounded-2xl border border-zinc-850 flex flex-col justify-between">
                      <span className="text-[8px] text-zinc-500 font-bold uppercase tracking-wider">Reading Ease</span>
                      <div className="flex items-baseline gap-1 mt-1">
                         <span className="text-lg font-black font-mono text-white">{readabilityScore.score}</span>
                         <span className="text-[9px] text-zinc-650 font-bold">/100</span>
                      </div>
                      <span className="text-[8.5px] font-bold text-blue-400 mt-1 truncate" title={readabilityScore.level}>{readabilityScore.level}</span>
                   </div>
                   <div className="bg-zinc-950 p-3 rounded-2xl border border-zinc-850 flex flex-col justify-between">
                      <span className="text-[8px] text-zinc-500 font-bold uppercase tracking-wider">Demographic Goal</span>
                      <span className="text-[10px] font-extrabold text-white mt-1.5 truncate" title={readabilityScore.target}>{readabilityScore.target}</span>
                      <span className="text-[8px] text-zinc-500 mt-1">FK Grade metric</span>
                   </div>
                </div>
             </div>
          </div>
        )}
      </div>

      <div className="flex-1 flex flex-col bg-zinc-900 border border-zinc-800 rounded-[3rem] overflow-hidden shadow-2xl relative">
        <div className="p-6 border-b border-zinc-800 flex justify-between items-center bg-zinc-950/50 backdrop-blur-md">
          <div className="flex items-center gap-4">
             <span className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Live Production manifest</span>
             {lastSavedTime && (
               <span className="text-[10px] text-zinc-500 font-mono flex items-center gap-1.5" title="Latest local browser storage persist checkpoint">
                 <span className="w-1.5 h-1.5 rounded-full bg-emerald-500/80 inline-block animate-pulse" />
                 Last saved at {lastSavedTime}
               </span>
             )}

             {/* Dynamic Collaborators Avatar Stack */}
             <div className="flex items-center gap-2 pl-4 border-l border-zinc-800">
               <span className="text-[9px] text-zinc-550 font-black uppercase tracking-wider hidden lg:inline-block">In-File:</span>
               <div className="flex -space-x-1.5 overflow-hidden">
                 {isRealtimeConnected && onlineCollaborators.map((col) => {
                   const initials = col.username.slice(0, 2).toUpperCase();
                   return (
                     <div 
                       key={col.username} 
                       className="relative group inline-block w-6 h-6 rounded-full border border-zinc-950 flex items-center justify-center text-[8px] font-black text-white cursor-pointer hover:-translate-y-0.5 hover:z-20 transition-all"
                       style={{ backgroundColor: col.color }}
                     >
                       <span>{initials}</span>
                       <span className="absolute bottom-0 right-0 w-1.5 h-1.5 rounded-full bg-green-400 border border-zinc-950 animate-pulse" />
                       
                       <div className="absolute top-full left-1/2 transform -translate-x-1/2 mt-2 hidden group-hover:block w-36 bg-zinc-950 border border-zinc-800 p-2.5 rounded-xl text-left shadow-2xl z-50 text-[9px] pointer-events-none">
                         <span className="font-extrabold text-white block">{col.username}</span>
                         <span className="text-zinc-400 block text-[8px]">Active Collaborator</span>
                         <span className="text-green-400 font-mono mt-1 block flex items-center gap-1 uppercase text-[7.5px]">
                           <span className="w-1.5 h-1.5 rounded-full bg-green-400 inline-block mr-1" /> ONLINE
                         </span>
                       </div>
                     </div>
                   );
                 })}
                 {!isRealtimeConnected && collaborators.map((col) => {
                   const initials = col.name.split(' ').map(n => n[0]).join('');
                   return (
                     <div 
                       key={col.name} 
                       className={`relative group inline-block w-6 h-6 rounded-full bg-gradient-to-br ${col.color} border border-zinc-950 flex items-center justify-center text-[8px] font-black text-white cursor-pointer hover:-translate-y-0.5 hover:z-20 transition-all`}
                     >
                       <span>{initials}</span>
                       <span className="absolute bottom-0 right-0 w-1.5 h-1.5 rounded-full bg-emerald-400 border border-zinc-950 animate-pulse" />
                       
                       {/* High-fidelity hover tooltip card */}
                       <div className="absolute top-full left-1/2 transform -translate-x-1/2 mt-2 hidden group-hover:block w-36 bg-zinc-950 border border-zinc-800 p-2.5 rounded-xl text-left shadow-2xl z-50 text-[9px] pointer-events-none">
                         <span className="font-extrabold text-white block">{col.name}</span>
                         <span className="text-zinc-400 block text-[8px]">{col.role}</span>
                         <span className="text-emerald-400 font-mono mt-1 block flex items-center gap-1 uppercase text-[7.5px]">
                           <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block animate-ping mr-1" /> {col.status}
                         </span>
                       </div>
                     </div>
                   );
                 })}
                 <div className="w-6 h-6 rounded-full bg-zinc-850 hover:bg-zinc-800 border border-zinc-950 flex items-center justify-center text-[7.5px] font-black text-zinc-400 cursor-pointer" title="Share Workspace file to view details">
                   {isRealtimeConnected ? `+${onlineCollaborators.length}` : '+1'}
                 </div>
               </div>
             </div>

             {isOptimizing && <div className="flex items-center gap-2 px-3 py-1 bg-purple-600/10 border border-purple-500/20 rounded-full text-purple-400 text-[9px] font-black uppercase animate-pulse"><ZapIcon size={10} /> Neural Re-Syncing</div>}
             {saveStatus === 'saving' && (
               <div className="flex items-center gap-1.5 px-2.5 py-0.5 bg-blue-500/10 border border-blue-500/20 rounded-md text-blue-400 text-[9px] font-bold uppercase animate-pulse">
                 <span className="w-1 h-3 flex items-center justify-center">
                   <span className="animate-ping absolute inline-flex h-1.5 w-1.5 rounded-full bg-blue-400 opacity-75"></span>
                   <span className="relative inline-flex rounded-full h-1 w-1 bg-blue-500"></span>
                 </span>
                 Auto-saving...
               </div>
             )}
             {saveStatus === 'saved' && (
               <div className="flex items-center gap-1 px-2.5 py-0.5 bg-emerald-500/15 border border-emerald-500/20 rounded-md text-emerald-400 text-[9px] font-bold uppercase">
                 <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block" />
                 Saved
               </div>
             )}
          </div>
          <div className="flex gap-2 items-center">
            {/* Live Collaboration Button */}
            <button
              onClick={toggleRealtimeCollaboration}
              className={`px-3 py-2 rounded-xl text-[10px] font-black uppercase flex items-center gap-1.5 transition-all cursor-pointer ${
                isRealtimeConnected 
                  ? 'bg-green-600 hover:bg-green-500 text-white shadow-[0_0_12px_rgba(22,163,74,0.3)]' 
                  : 'bg-zinc-800 hover:bg-zinc-750 text-zinc-300 border border-zinc-700/60'
              }`}
              title="Live edit this script with multiple team members simultaneously via WebSockets"
            >
              <Users size={12} className={isRealtimeConnected ? 'animate-pulse' : ''} />
              {isRealtimeConnected ? 'Collab ON' : 'Join Collab'}
            </button>

            <button 
              onClick={handleOptimizePacing} 
              disabled={isOptimizing || !script} 
              className="bg-purple-600 hover:bg-purple-500 disabled:opacity-30 text-white px-4 py-2 rounded-xl text-[10px] font-black uppercase flex items-center gap-2 transition-all active-press"
              title="Force strict 10-15 word visual cue pacing"
            >
              {isOptimizing ? <Loader2 size={12} className="animate-spin" /> : <Wind size={12} />} Retention Blitz
            </button>
            <div className="flex bg-zinc-850 rounded-xl p-0.5 border border-zinc-750">
               <button
                 type="button"
                 onClick={handleToggleTTS}
                 disabled={!script}
                 className={`px-3 py-1.5 rounded-l-lg text-[10px] font-black uppercase flex items-center gap-1.5 transition-all cursor-pointer ${
                   isPlayingTTS
                     ? 'bg-red-500/20 text-red-400 animate-pulse'
                     : 'hover:bg-zinc-755 text-zinc-300 hover:text-white'
                 }`}
                 title="Leverage low-latency Web Audio speech preview to confirm spoken phrase cadence"
               >
                 {isPlayingTTS ? <VolumeX size={11} className="text-red-400" /> : <Volume2 size={11} className="text-zinc-400" />}
                 {isPlayingTTS ? 'Stop' : 'Play TTS'}
               </button>
               
               <button
                 type="button"
                 onClick={() => setShowVoiceControls(!showVoiceControls)}
                 className={`px-2 py-1.5 rounded-r-lg border-l border-zinc-705 text-zinc-400 hover:text-white transition-all cursor-pointer ${
                   showVoiceControls ? 'bg-zinc-700 text-white' : 'hover:bg-zinc-755'
                 }`}
                 title="Open voice options (pitch, speed, custom speaker elements)"
               >
                 <Sliders size={11} />
               </button>
             </div>

             <button 
               type="button"
               onClick={() => setShowSocialModal(true)} 
               disabled={!script}
               className="bg-zinc-800 text-white px-4 py-2 rounded-xl text-[10px] font-black uppercase flex items-center gap-2 hover:bg-zinc-705 border border-zinc-750 disabled:opacity-30 transition-all cursor-pointer"
               title="Export script structures to platform-specific configurations for TikTok, Instagram Reels, and YouTube Shorts"
             >
               <Smartphone size={12} className="text-blue-400" /> Social Export
             </button>

             <button 
               type="button"
               onClick={() => {
                 if (!script) {
                   toast.error("Script has no narrative content to copy yet.");
                   return;
                 }
                 navigator.clipboard.writeText(script); 
                 toast.success("Design narrative copied to system clipboard! 📋"); 
               }} 
               className="bg-zinc-805 text-white px-4 py-2 rounded-xl text-[10px] font-black uppercase flex items-center gap-2 hover:bg-zinc-700 transition-colors cursor-pointer"
               title="Copy design parameters to active clipboard"
             >
               <Copy size={12} /> Copy Script
             </button>
             <button 
               type="button"
               onClick={handleExportPDF} 
               disabled={!script}
               className="bg-zinc-800 text-white px-4 py-2 rounded-xl text-[10px] font-black uppercase flex items-center gap-2 hover:bg-zinc-700 disabled:opacity-30 transition-colors cursor-pointer"
               title="Export generated script to formatted PDF"
             >
               <FileText size={12} className="text-zinc-400" /> Export PDF
             </button>
             <button 
               type="button"
               onClick={() => setShowHistorySidebar(!showHistorySidebar)} 
               className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase flex items-center gap-2 transition-all cursor-pointer ${
                 showHistorySidebar 
                   ? 'bg-red-600 text-white shadow-lg shadow-red-600/10' 
                   : 'bg-zinc-800 text-zinc-400 hover:text-white hover:bg-zinc-700'
               }`}
               title="Revision & Version History"
             >
               <History size={12} /> History {activeProject ? `(${((activeProject.assets?.scriptHistory?.length || 0) + (activeProject.assets?.titleHistory?.length || 0))})` : ''}
             </button>

             {/* Auto-Translate Dropdown */}
             <div className="relative">
               <button
                 type="button"
                 onClick={() => setShowTranslateMenu(!showTranslateMenu)}
                 disabled={!script}
                 className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase flex items-center gap-2 transition-all cursor-pointer border ${
                   showTranslateMenu 
                     ? 'bg-red-600/10 border-red-500/30 text-red-500' 
                     : 'bg-zinc-805 border-zinc-850 hover:bg-zinc-750 text-zinc-300 hover:text-white'
                 }`}
                 title="Translate script into other languages using Gemini while preserving pacing structures"
               >
                 <Languages size={12} />
                 <span>Translate</span>
               </button>
               {showTranslateMenu && (
                 <div className="absolute right-0 mt-2 w-44 bg-zinc-950 border border-zinc-805 rounded-2xl shadow-2xl z-50 overflow-hidden font-sans">
                   <div className="p-2.5 border-b border-zinc-900 bg-zinc-900/40 text-[8.5px] font-black text-zinc-500 uppercase tracking-wider text-center">
                     Select Target Language
                    </div>
                   {['Spanish', 'French', 'German', 'Japanese', 'Hindi', 'Mandarin'].map(lang => (
                     <button
                       key={lang}
                       type="button"
                       onClick={() => handleTranslateScript(lang)}
                       className="w-full text-left px-4 py-2.5 hover:bg-red-500/15 hover:text-white text-zinc-400 text-[10.5px] font-bold border-b border-zinc-900 last:border-0 transition-colors cursor-pointer"
                     >
                       🌐 {lang}
                     </button>
                   ))}
                 </div>
               )}
             </div>

             {/* Collaboration Notes / Comments */}
             <button
               type="button"
               onClick={() => setShowCommentsSidebar(!showCommentsSidebar)}
               className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase flex items-center gap-2 transition-all cursor-pointer border ${
                 showCommentsSidebar
                   ? 'bg-rose-600 border-rose-500 text-white shadow-lg shadow-rose-600/10'
                   : 'bg-zinc-800 border-zinc-850 hover:bg-zinc-750 text-zinc-300 hover:text-white'
               }`}
               title="Open Collaboration Notes & Annotations panel"
             >
               <MessageSquare size={12} />
               <span>Notes</span>
               {comments.length > 0 && (
                 <span className="bg-red-500 text-white text-[8px] font-black w-4.5 h-4.5 rounded-full flex items-center justify-center animate-pulse leading-none">
                   {comments.length}
                 </span>
               )}
             </button>
          </div>
        </div>

        {/* 3-Bullet Executive Alignment Brief */}
        {script && (
          <div className="bg-zinc-950 border-b border-zinc-850 transition-all">
            <div className="px-8 py-3 bg-zinc-950/40 flex items-center justify-between border-b border-zinc-90 w-full">
              <div className="flex items-center gap-2.5">
                <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
                <span className="text-[10px] font-black uppercase text-zinc-400 tracking-widest flex items-center gap-1.5">
                  📋 Video Executive Alignment Brief
                </span>
                {isGeneratingSummary && (
                  <span className="text-[9px] text-red-400 animate-pulse font-mono flex items-center gap-1">
                    <Loader2 size={10} className="animate-spin" /> syncing summary...
                  </span>
                )}
              </div>
              <div className="flex items-center gap-3">
                <button 
                  onClick={() => handleGenerateSummary(script)}
                  disabled={isGeneratingSummary}
                  className="text-[8.5px] font-black text-rose-500 hover:text-rose-400 uppercase tracking-wider transition-colors bg-rose-500/5 px-2.5 py-1 rounded-md border border-rose-500/10 cursor-pointer disabled:opacity-30"
                >
                  ✨ Re-Synthesize Brief
                </button>
                <button 
                  onClick={() => setIsSummaryCollapsed(!isSummaryCollapsed)} 
                  className="text-zinc-500 hover:text-white transition-all duration-150 cursor-pointer"
                >
                  {isSummaryCollapsed ? (
                    <span className="text-[9px] font-black uppercase flex items-center gap-1">Expand <ChevronDown size={11} /></span>
                  ) : (
                    <span className="text-[9px] font-black uppercase flex items-center gap-1">Collapse <ChevronUp size={11} /></span>
                  )}
                </button>
              </div>
            </div>

            {!isSummaryCollapsed && (
              <div className="px-8 pb-5 pt-3.5 space-y-2.5 bg-[#09090b]/40 animate-scale-in">
                {summaryText ? (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {summaryText.split('\n').filter(line => line.trim().length > 0).slice(0, 3).map((bullet, idx) => {
                      // Strip leading bullets/asterisks nicely for human-centered crisp text blocks
                      const bulletClean = bullet.replace(/^[•\-\*\s\d\.\)]+/, '').trim();
                      return (
                        <div key={idx} className="bg-zinc-900/60 border border-zinc-850 p-3.5 rounded-2xl flex items-start gap-2.5 shadow-md hover:border-zinc-800 transition-all">
                          <div className="text-zinc-300 text-[11px] leading-relaxed font-sans font-semibold">
                            {bulletClean}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-4 bg-zinc-900/40 rounded-2xl border border-dashed border-zinc-850 text-center">
                    <p className="text-[10px] text-zinc-500 max-w-sm">No executive alignment brief compiled for this workspace version.</p>
                    <button
                      onClick={() => handleGenerateSummary(script)}
                      className="mt-2 text-[9px] font-black bg-red-600/10 border border-red-500/25 text-red-500 hover:bg-red-600/20 px-3 py-1.5 rounded-lg uppercase tracking-wider transition-all cursor-pointer"
                    >
                      ⚡ Compile Alignment Summary
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
        
        <div className="flex-1 flex flex-row overflow-hidden relative">
          <textarea
            ref={textareaRef}
            onSelect={handleTextareaSelect}
            value={script}
            onChange={(e) => setScript(e.target.value)}
            onFocus={() => { lastScriptRef.current = script; }}
            onBlur={handleScriptBlur}
            onKeyUp={handleTextareaCursorChange}
            onMouseUp={handleTextareaCursorChange}
            placeholder="[Terminal Idle - Waiting for synthesis instructions or click to edit direct...]"
            className="flex-1 h-full p-12 bg-[#09090b] outline-none border-none resize-none focus:ring-0 custom-scrollbar font-sans text-xl md:text-2xl font-bold leading-relaxed text-zinc-100 tracking-tight placeholder:text-zinc-850 focus:outline-none"
          />

          {/* Color-Coded Mood Analysis Sidebar */}
          {scriptMoods.length > 0 && (
            <div className="w-16 border-l border-zinc-850 bg-zinc-950/40 flex flex-col items-center py-6 gap-3.5 overflow-y-auto custom-scrollbar shrink-0 select-none">
              <span className="text-[7.5px] font-black uppercase text-zinc-600 tracking-widest text-center">Pacing</span>
              {scriptMoods.map((m, idx) => (
                <div 
                  key={m.id}
                  className="group relative flex flex-col items-center cursor-pointer"
                >
                  {/* Sentiment Capsule Node representing segment layout pacing */}
                  <div 
                    className={`w-7 h-7 rounded-lg ${m.color} flex items-center justify-center font-mono text-[9px] font-black text-zinc-950 border border-zinc-950 hover:scale-110 active:scale-95 transition-all shadow-md`}
                    style={{ opacity: 0.15 + (m.intensity / 115) }}
                  >
                    {idx + 1}
                  </div>
                  
                  <span className="text-[7px] text-zinc-550 font-black mt-1 uppercase font-mono">{m.mood.substring(0, 4)}</span>

                  {/* Sentimental analysis floatation layout widget */}
                  <div className="absolute right-full top-1/2 -translate-y-1/2 mr-3.5 hidden group-hover:block w-64 bg-zinc-950 border border-zinc-800 p-4.5 rounded-2xl text-left shadow-2xl z-50 pointer-events-none animate-scale-in">
                    <div className="flex justify-between items-center mb-2">
                      <span className={`text-[8px] font-black uppercase px-2 py-0.5 rounded ${m.bgLight} ${m.textColor}`}>
                        {m.mood} Mood
                      </span>
                      <span className="text-[9px] font-mono font-black text-zinc-300">{m.intensity}% Score</span>
                    </div>
                    <span className="text-[10px] font-black text-white block mb-1.5">{m.label}</span>
                    <p className="text-[10px] text-zinc-400 line-clamp-3 leading-normal">
                      "{m.text}"
                    </p>
                    <div className="border-t border-zinc-850 mt-2.5 pt-1.5 flex justify-between items-center text-[7.5px] font-mono text-zinc-500">
                      <span>SEGMENT {idx + 1}</span>
                      <span>{m.words} WORDS</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Real-time Workspace Dynamic Telemetry Footer */}
        <div className="px-8 py-4 border-t border-zinc-800 bg-[#0c0c0e]/80 backdrop-blur-md flex flex-wrap justify-between items-center gap-4">
          <div className="flex flex-wrap items-center gap-6 text-[10px] font-black uppercase text-zinc-500 font-mono tracking-widest">
            <span className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse"></span>
              WORDS: <span className="text-white font-black">{calculatedReadingMetrics.words}</span>
            </span>
            <span>CHARS: <span className="text-white font-black">{calculatedReadingMetrics.chars}</span></span>
            <span className="flex items-center gap-1.5 text-blue-400">
              <Clock size={12} />
              EST READING TIME: <span className="text-white font-black">{calculatedReadingMetrics.formatted}</span>
            </span>
            <span className="text-zinc-650 hidden md:inline">SPEECH RATE: ~{calculatedReadingMetrics.wpm} WPM ({tone})</span>
          </div>

          <div className="text-[9px] font-bold text-zinc-650 uppercase tracking-widest font-mono flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span> INTERACTIVE WORKSPACE READY
          </div>
        </div>

        {/* Sliding Version History overlay */}
        {showHistorySidebar && (
          <div className="absolute top-0 right-0 h-full w-80 bg-zinc-950 border-l border-zinc-800 shadow-3xl z-40 flex flex-col animate-slide-in p-6 select-none bg-zinc-950/95 backdrop-blur-md">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-4 mb-5 shrink-0">
               <div className="flex items-center gap-2.5">
                  <Clock className="text-rose-500 animate-pulse" size={15} />
                  <h4 className="text-[10px] font-black uppercase tracking-widest text-white">Revision Timeline</h4>
               </div>
               <button 
                 onClick={() => setShowHistorySidebar(false)} 
                 className="text-zinc-500 hover:text-white text-[9px] font-black uppercase tracking-wider cursor-pointer"
               >
                 Close
               </button>
            </div>

            <button
              onClick={() => handleCreateCheckpoint()}
              disabled={!script}
              className="w-full bg-[#121214] border border-zinc-800 text-zinc-300 hover:text-white px-3 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all flex items-center justify-center gap-2 mb-5 hover:border-zinc-700 disabled:opacity-40 shrink-0 cursor-pointer"
            >
              <Sparkles size={11} className="text-red-500 animate-pulse" /> Capture Backup Snapshot
            </button>

            <div className="flex-1 overflow-y-auto custom-scrollbar space-y-6">
              {/* Local Storage Snapshots (Restore Older Versions using LocalStorage persistent hook) */}
              <div className="space-y-3 pb-5 border-b border-zinc-900">
                 <h5 className="text-[9px] font-black uppercase tracking-wider text-rose-500 flex items-center gap-2">
                   <Clock size={12} className="text-rose-500" /> Local Storage Backups
                 </h5>
                 {localStorageHistory.length === 0 ? (
                   <p className="text-[9px] text-zinc-650 italic leading-snug">No localized states archived yet. Modify or run AI generators to trigger auto-checkpoints.</p>
                 ) : (
                   <div className="space-y-2.5 max-h-56 overflow-y-auto pr-1 select-text custom-scrollbar">
                     {localStorageHistory.map((ver) => (
                       <div key={ver.id} className="bg-zinc-900/60 border border-zinc-850 p-2.5 rounded-xl flex flex-col gap-2 group animate-scale-in">
                          <div className="flex justify-between items-start">
                             <div className="text-[9px] font-bold text-zinc-300 pr-2 text-left leading-normal truncate max-w-[150px]">{ver.label}</div>
                             <span className="text-[7.5px] font-mono font-black text-zinc-600 shrink-0 uppercase">{new Date(ver.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                          </div>
                          <button
                            onClick={() => {
                              setScript(ver.script);
                              setTitle(ver.title);
                              if (ver.tone) setTone(ver.tone);
                              toast.success(`Restored snapshot: "${ver.label}" 📁`, { id: 'history-restore-alert' });
                            }}
                            className="w-full bg-zinc-950 hover:bg-rose-600/10 border border-zinc-805 hover:border-rose-500/20 text-zinc-400 hover:text-rose-400 py-1 rounded-lg text-[8px] font-black uppercase tracking-wider transition-all cursor-pointer"
                          >
                            Restore Workspace
                          </button>
                       </div>
                     ))}
                   </div>
                 )}
              </div>

              {/* Database Script Revisions block */}
              <div className="space-y-3">
                 <h5 className="text-[9px] font-black uppercase tracking-wider text-zinc-500 flex items-center gap-2"><FileText size={11} /> Project Checkpoints</h5>
                 {!activeProject ? (
                   <p className="text-[10px] text-zinc-600 italic">No active project loaded</p>
                 ) : !activeProject.assets?.scriptHistory || activeProject.assets.scriptHistory.length === 0 ? (
                   <p className="text-[10px] text-zinc-600 italic">No script saved checkpoints yet.</p>
                 ) : (
                   <div className="space-y-2.5">
                     {activeProject.assets.scriptHistory.map((ver) => (
                       <div key={ver.id} className="bg-zinc-900/80 border border-zinc-850 p-3 rounded-xl flex flex-col gap-2 group animate-scale-in">
                          <div className="flex justify-between items-start">
                             <span className="text-[10px] font-bold text-white pr-2 text-left leading-normal">{ver.label}</span>
                             <span className="text-[8px] font-black text-zinc-650 shrink-0 uppercase">{new Date(ver.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                          </div>
                          <button
                            onClick={async () => {
                              await revertToScriptVersion(activeProject.id, ver.id);
                              setScript(ver.content);
                              toast.success(`Restored script history checkpoint "${ver.label}"!`);
                            }}
                            className="w-full bg-zinc-950 hover:bg-red-600/10 border border-zinc-805 hover:border-red-500/20 text-zinc-400 hover:text-red-400 py-1.5 rounded-lg text-[8px] font-black uppercase tracking-wider transition-all cursor-pointer"
                          >
                            Revert Workspace
                          </button>
                       </div>
                     ))}
                   </div>
                 )}
              </div>

              {/* Database Title Revisions block */}
              <div className="space-y-3 pb-6 border-t border-zinc-900 pt-4">
                 <h5 className="text-[9px] font-black uppercase tracking-wider text-zinc-500 flex items-center gap-2"><Sparkles size={11} /> Headline Library</h5>
                 {!activeProject ? (
                   <p className="text-[10px] text-zinc-655 italic">No active project loaded</p>
                 ) : !activeProject.assets?.titleHistory || activeProject.assets.titleHistory.length === 0 ? (
                   <div className="p-3 bg-zinc-900/40 rounded-xl border border-zinc-900/60 text-left">
                     <p className="text-[10px] text-zinc-655 italic leading-snug">No title checkpoints. Change headlines to register.</p>
                   </div>
                 ) : (
                   <div className="space-y-3">
                     {activeProject.assets.titleHistory.map((ver) => (
                       <div key={ver.id} className="bg-zinc-900/80 border border-zinc-850 p-3 rounded-xl flex flex-col gap-2 group animate-scale-in">
                          <div className="flex justify-between items-start">
                             <span className="text-[10px] font-bold text-zinc-300 pr-2 leading-tight text-left">{ver.title}</span>
                             <span className="text-[8px] font-black text-zinc-600 shrink-0 uppercase">{new Date(ver.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                          </div>
                          <button
                            onClick={async () => {
                              await revertToTitleVersion(activeProject.id, ver.id);
                              setTitle(ver.title);
                              toast.success(`Promoted title "${ver.title}" to script headline!`);
                            }}
                            className="w-full bg-zinc-950 hover:bg-red-600/10 border border-zinc-800 hover:border-red-500/20 text-zinc-400 hover:text-red-400 py-1.5 rounded-lg text-[8px] font-black uppercase tracking-wider transition-all cursor-pointer"
                          >
                            Promote Headline
                          </button>
                       </div>
                     ))}
                   </div>
                 )}
              </div>
            </div>
          </div>
        )}

        {/* Sliding Annotations & Comments overlay */}
        {showCommentsSidebar && (
          <div className="absolute top-0 right-0 h-full w-80 bg-zinc-950 border-l border-zinc-800 shadow-3xl z-40 flex flex-col animate-slide-in p-6 select-none bg-zinc-950/95 backdrop-blur-md">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-4 mb-5 shrink-0">
               <div className="flex items-center gap-2.5">
                  <MessageSquare className="text-rose-500 animate-pulse" size={15} />
                  <h4 className="text-[10px] font-black uppercase tracking-widest text-white">Collaboration Notes</h4>
               </div>
               <button 
                 onClick={() => setShowCommentsSidebar(false)} 
                 className="text-zinc-500 hover:text-white text-[9px] font-black uppercase tracking-wider cursor-pointer"
               >
                 Close
               </button>
            </div>

            {/* If has highlighted segment, show rapid attachments card */}
            {selectedText ? (
              <div className="bg-gradient-to-br from-red-950/20 to-purple-950/10 border border-zinc-850 p-4 rounded-xl space-y-3 shrink-0 mb-5 text-left animate-scale-in">
                <span className="text-[8px] text-zinc-550 uppercase font-mono font-black tracking-widest block">Selected Context snippet:</span>
                <p className="text-[10px] text-zinc-300 italic line-clamp-2 leading-relaxed bg-[#0c0c0e]/50 p-2 border border-zinc-800 rounded-xl">
                  "{selectedText}"
                </p>
                <div className="space-y-2">
                  <input
                    type="text"
                    placeholder="Type note (e.g., Make hook punchier)"
                    value={newCommentText}
                    onChange={(e) => setNewCommentText(e.target.value)}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-[11px] text-white outline-none focus:ring-1 focus:ring-red-500"
                  />
                  <button
                    onClick={handleAddComment}
                    className="w-full bg-rose-600 hover:bg-rose-500 text-white text-[10px] font-black uppercase py-1.5 rounded-xl transition-all cursor-pointer"
                  >
                    Attach Note Reference
                  </button>
                </div>
              </div>
            ) : (
              <div className="bg-zinc-900/40 border border-dashed border-zinc-850 p-4 rounded-xl text-center text-[10px] text-zinc-500 shrink-0 mb-5 italic leading-relaxed">
                Highlight / select any text segment directly inside the script editor area to attach a collaboration note!
              </div>
            )}

            {/* List Active attached comments */}
            <div className="flex-1 overflow-y-auto custom-scrollbar space-y-4 pr-1">
              <span className="text-[8px] font-black uppercase text-zinc-500 tracking-widest block text-left">Active Annotations ({comments.length})</span>
              {comments.length === 0 ? (
                <p className="text-[9.5px] text-zinc-650 italic text-center py-8">No annotations attached in this file workspace version.</p>
              ) : (
                <div className="space-y-3 text-left">
                  {comments.map((c) => (
                    <div key={c.id} className="bg-[#121214] border border-zinc-850 p-3.5 rounded-2xl flex flex-col gap-2 relative group hover:border-zinc-800 transition-all select-text">
                      <div className="flex justify-between items-start">
                        <span className="text-[9.25px] font-black text-rose-550">{c.author}</span>
                        <button
                          onClick={() => handleDeleteComment(c.id)}
                          className="text-zinc-600 hover:text-red-500 transition-colors cursor-pointer"
                          title="Delete annotation"
                        >
                          <Trash2 size={11} />
                        </button>
                      </div>
                      
                      <div className="text-[10px] text-zinc-400 leading-relaxed italic bg-zinc-950/60 p-2 rounded-xl border border-zinc-850 relative">
                        <span className="absolute top-0.5 right-1 text-[7px] text-zinc-600 font-mono">CUE</span>
                        "{c.selection}"
                      </div>
                      
                      <p className="text-[11px] text-white font-medium pl-0.5 leading-snug">
                        {c.text}
                      </p>

                      <div className="flex justify-between items-center pt-1 border-t border-zinc-850 mt-1">
                        <span className="text-[7.5px] text-zinc-655 font-mono font-black">{new Date(c.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                        <button
                          type="button"
                          onClick={() => handleLocateComment(c.selection)}
                          className="text-[8.5px] font-black uppercase text-blue-400 hover:text-blue-300 transition-colors cursor-pointer"
                        >
                          Locate Section ➔
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Templates Gallery Overlay */}
        {showTemplatesGallery && (
          <div className="fixed inset-0 bg-black/85 backdrop-blur-md z-50 flex items-center justify-center p-4 animate-fade-in select-none">
            <div className="bg-zinc-950 border border-zinc-800 rounded-[2.5rem] w-full max-w-2xl max-h-[85vh] flex flex-col overflow-hidden shadow-2xl p-8 space-y-6">
              <div className="flex justify-between items-center border-b border-zinc-900 pb-4">
                <div className="space-y-1 text-left">
                  <h3 className="text-xl font-black text-white flex items-center gap-2">
                    <BookOpen className="text-rose-500 animate-pulse" size={20} /> Script Templates Library
                  </h3>
                  <p className="text-xs text-zinc-500">Kickstart scripts fast using proven structures or save your own reusable settings</p>
                </div>
                <button
                  type="button"
                  onClick={() => { setShowTemplatesGallery(false); setShowSaveTemplateForm(false); }}
                  className="p-2 hover:bg-zinc-900 rounded-xl text-zinc-400 hover:text-white transition-colors cursor-pointer"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto custom-scrollbar space-y-6 pr-2">
                {/* Save Current Workspace Segment */}
                {!showSaveTemplateForm ? (
                  <div className="bg-gradient-to-r from-red-950/20 to-purple-950/10 border border-rose-900/30 p-5 rounded-2xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4 text-left">
                    <div className="space-y-1">
                      <span className="text-[10px] text-rose-500 font-extrabold uppercase tracking-widest block font-mono">Orchestrator Template Pack</span>
                      <h4 className="text-sm font-black text-white">Save Current Blueprint Configuration</h4>
                      <p className="text-xs text-zinc-400">Captures: Headline, Constraints, active Voice, Pacing type, and Tone.</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setShowSaveTemplateForm(true)}
                      className="bg-rose-600 hover:bg-rose-500 text-white px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all self-stretch md:self-auto cursor-pointer"
                    >
                      Save As Template
                    </button>
                  </div>
                ) : (
                  <form onSubmit={handleSaveCustomTemplate} className="bg-zinc-900/40 border border-zinc-850 p-5 rounded-2xl space-y-4 animate-scale-in text-left">
                    <h4 className="text-sm font-black text-white">Save Reusable Workspace Template</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-bold text-zinc-400 uppercase">Template Name</label>
                        <input
                          type="text"
                          required
                          placeholder="e.g. AI Hustler Daily Vlog"
                          value={newTemplateName}
                          onChange={(e) => setNewTemplateName(e.target.value)}
                          className="w-full bg-zinc-950 border border-zinc-850 rounded-xl px-4 py-2.5 text-xs text-white outline-none focus:ring-1 focus:ring-rose-500"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-bold text-zinc-400 uppercase">Short Description</label>
                        <input
                          type="text"
                          placeholder="e.g. Sharp dramatic hooks with tutorial visual cues"
                          value={newTemplateDesc}
                          onChange={(e) => setNewTemplateDesc(e.target.value)}
                          className="w-full bg-zinc-950 border border-zinc-850 rounded-xl px-4 py-2.5 text-xs text-white outline-none focus:ring-1 focus:ring-rose-500"
                        />
                      </div>
                    </div>
                    <div className="flex justify-end gap-3 pt-2">
                      <button
                        type="button"
                        onClick={() => setShowSaveTemplateForm(false)}
                        className="bg-zinc-950 border border-zinc-850 hover:bg-zinc-900 text-zinc-455 px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase transition-colors"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        className="bg-rose-600 hover:bg-rose-500 text-white px-3.5 py-1.5 rounded-lg text-[10px] font-black uppercase transition-colors"
                      >
                        Persist & Save
                      </button>
                    </div>
                  </form>
                )}

                {/* Default Script Structures */}
                <div className="space-y-3 pt-2">
                  <span className="text-[10px] text-zinc-550 font-black uppercase tracking-widest block text-left">Default Structures Gallery</span>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {DEFAULT_TEMPLATES.map(t => (
                      <div key={t.id} className="bg-[#121214] hover:bg-[#161619] border border-zinc-850 hover:border-zinc-800 p-4 rounded-2xl flex flex-col justify-between text-left transition-all group">
                        <div className="space-y-2">
                          <span className="text-[9px] font-black uppercase bg-rose-500/10 text-rose-455 px-2 py-0.5 rounded inline-block font-mono">
                            {t.scriptType}
                          </span>
                          <h5 className="text-xs font-black text-white tracking-tight">{t.name}</h5>
                          <p className="text-[10.5px] text-zinc-500 leading-normal">{t.desc}</p>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleLoadTemplate(t)}
                          className="mt-4 w-full bg-zinc-950 group-hover:bg-rose-600 group-hover:text-white border border-zinc-850 group-hover:border-rose-550 text-zinc-400 text-[10px] font-bold uppercase tracking-wider py-2 rounded-xl transition-all cursor-pointer"
                        >
                          Load Structure
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Custom Saved Library */}
                <div className="space-y-3 pt-2">
                  <span className="text-[10px] text-zinc-550 font-black uppercase tracking-widest block text-left font-mono">Your Curated Templates</span>
                  {customTemplates.length === 0 ? (
                    <div className="py-8 bg-zinc-950 border border-dashed border-zinc-850 rounded-2xl text-center text-zinc-600 text-xs">
                      No custom structures archived yet. Save one above!
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {customTemplates.map(t => (
                        <div key={t.id} className="bg-zinc-900/60 border border-zinc-850 p-4.5 rounded-2xl flex justify-between items-start text-left gap-4">
                          <div className="space-y-1 flex-1">
                            <span className="text-[8px] font-mono uppercase bg-purple-500/10 text-purple-450 px-1.5 py-0.5 rounded inline-block">{t.scriptType}</span>
                            <h5 className="text-xs font-black text-white">{t.name}</h5>
                            <p className="text-[10px] text-zinc-400 line-clamp-2 leading-snug">{t.desc}</p>
                            <span className="text-[8.5px] text-zinc-650 block font-mono">Tone: {t.tone}</span>
                          </div>
                          <div className="flex flex-col gap-2 shrink-0 h-full justify-between items-end">
                            <button
                              type="button"
                              onClick={() => handleDeleteTemplate(t.id)}
                              className="text-[9px] text-zinc-600 hover:text-red-500 transition-colors"
                              title="Delete template"
                            >
                              <Trash2 size={13} />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleLoadTemplate(t)}
                              className="bg-[#121214] hover:bg-rose-600 hover:text-white border border-zinc-805 text-[9.5px] font-black uppercase px-2.5 py-1.5 rounded-lg transition-colors cursor-pointer"
                            >
                              Load
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
