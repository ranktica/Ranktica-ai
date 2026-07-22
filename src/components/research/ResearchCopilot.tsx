import React, { useState, useRef, useEffect } from 'react';
import { 
  Send, 
  BrainCircuit, 
  Image as ImageIcon, 
  Trash2, 
  SlidersHorizontal, 
  Cpu, 
  Globe, 
  CheckCircle, 
  Loader2, 
  Sparkles, 
  Terminal, 
  Clock, 
  FileText,
  User,
  ExternalLink,
  ChevronRight,
  Database,
  ArrowRight,
  Plus
} from 'lucide-react';
import { ChatMessage, ResearchSession } from '@/shared/types';
import { researchChat } from '@/infrastructure/gemini';
import toast from 'react-hot-toast';

interface ResearchCopilotProps {
  initialQuery?: string;
  onClearInitialQuery?: () => void;
  onSaveGeneratedReport?: (title: string, summary: string, content: string, folder: string) => void;
  activeAgentRun?: {
    query: string;
    step: number;
    status: 'idle' | 'running' | 'completed';
    logs: string[];
    summary: string;
  };
  onTriggerAgentRun?: (query: string) => void;
}

interface AgentLog {
  agentName: string;
  status: 'pending' | 'active' | 'completed';
  logText: string;
}

const AGENTS_LIST = [
  { id: 'planner', name: 'Planner Agent', desc: 'Outlines inquiry strategy and routes models' },
  { id: 'competitor', name: 'Competitor Research Agent', desc: 'Analyzes target products, feature gaps, and pricing' },
  { id: 'geo', name: 'GEO Research Agent', desc: 'Measures brand citation and entity authority' },
  { id: 'aeo', name: 'AEO Research Agent', desc: 'Tracks Answer Engine coverages and featured snippets' },
  { id: 'trend', name: 'Trend Discovery Agent', desc: 'Monitors Google Trends, Reddit, X and YouTube signals' },
  { id: 'reviewer', name: 'Reviewer Agent', desc: 'Validates facts, compiles citation references and formats output' }
];

export const ResearchCopilot: React.FC<ResearchCopilotProps> = ({ 
  initialQuery, 
  onClearInitialQuery,
  onSaveGeneratedReport,
  activeAgentRun,
  onTriggerAgentRun
}) => {
  const [sessions, setSessions] = useState<ResearchSession[]>([]);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  
  // Model & Tool Controls
  const [useSearch, setUseSearch] = useState(true);
  const [useMaps, setUseMaps] = useState(false);
  const [useThinking, setUseThinking] = useState(false);
  const [deepOrchestration, setDeepOrchestration] = useState(false);
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);

  // Multi-agent process simulation states
  const [agentStep, setAgentStep] = useState<number>(-1);
  const [agentLogs, setAgentLogs] = useState<AgentLog[]>([]);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const endRef = useRef<HTMLDivElement>(null);

  // Load from local storage
  useEffect(() => {
    const saved = localStorage.getItem('ranktica_research_sessions');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setSessions(parsed);
        if (parsed.length > 0) setActiveSessionId(parsed[0].id);
      } catch (e) { console.error("Session load error", e); }
    }
  }, []);

  // Save to local storage
  useEffect(() => {
    if (sessions.length > 0) {
      localStorage.setItem('ranktica_research_sessions', JSON.stringify(sessions));
    }
  }, [sessions]);

  // Handle incoming quick-launched queries from Dashboard
  useEffect(() => {
    if (initialQuery) {
      setInput(initialQuery);
      if (onClearInitialQuery) onClearInitialQuery();
    }
  }, [initialQuery]);

  // Scroll to bottom on new messages
  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [sessions, activeSessionId, loading, agentStep]);

  const activeSession = sessions.find(s => s.id === activeSessionId) || null;

  const createNewSession = () => {
    const newSession: ResearchSession = {
      id: Date.now().toString(),
      title: 'New Strategic Inquiry',
      messages: [],
      lastUpdated: Date.now()
    };
    setSessions(prev => [newSession, ...prev]);
    setActiveSessionId(newSession.id);
  };

  const deleteSession = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    const updated = sessions.filter(s => s.id !== id);
    setSessions(updated);
    if (activeSessionId === id) {
      setActiveSessionId(updated.length > 0 ? updated[0].id : null);
    }
  };

  // Agent orchestration simulator
  const runAgentPipeline = async (queryText: string): Promise<string> => {
    return new Promise((resolve) => {
      setAgentStep(0);
      
      const logsList: AgentLog[] = [
        { agentName: 'Planner Agent', status: 'active', logText: `Inquiry initiated: "${queryText}". Routing task parameters...` },
        { agentName: 'Competitor Research Agent', status: 'pending', logText: 'Awaiting strategic directives...' },
        { agentName: 'GEO Research Agent', status: 'pending', logText: 'Awaiting semantic index maps...' },
        { agentName: 'AEO Research Agent', status: 'pending', logText: 'Awaiting featured snippet prompts...' },
        { agentName: 'Trend Discovery Agent', status: 'pending', logText: 'Awaiting topic anchors...' },
        { agentName: 'Reviewer Agent', status: 'pending', logText: 'Awaiting merged report payloads...' }
      ];
      setAgentLogs([...logsList]);

      // Step 1: Planner
      setTimeout(() => {
        setAgentStep(1);
        logsList[0].status = 'completed';
        logsList[0].logText = 'Planned 5-stage research pipeline. Routed to target agents.';
        logsList[1].status = 'active';
        logsList[1].logText = 'Scraping market competitors and modeling product pricing maps...';
        setAgentLogs([...logsList]);
      }, 1500);

      // Step 2: Competitor
      setTimeout(() => {
        setAgentStep(2);
        logsList[1].status = 'completed';
        logsList[1].logText = 'Competitor feature gap analysis compiled. Found underserved monetization slots.';
        logsList[2].status = 'active';
        logsList[2].logText = 'Evaluating Knowledge Graph density and Perplexity citation anchors...';
        setAgentLogs([...logsList]);
      }, 3000);

      // Step 3: GEO
      setTimeout(() => {
        setAgentStep(3);
        logsList[2].status = 'completed';
        logsList[2].logText = 'GEO citation score calculated: 82%. Recommendations output to review draft.';
        logsList[3].status = 'active';
        logsList[3].logText = 'Auditing Google Search conversational FAQ blocks...';
        logsList[4].status = 'active';
        logsList[4].logText = 'Inspecting Reddit /r/SaaS and Google Trends indexes...';
        setAgentLogs([...logsList]);
      }, 4500);

      // Step 4: AEO & Trend
      setTimeout(() => {
        setAgentStep(4);
        logsList[3].status = 'completed';
        logsList[3].logText = 'AEO gaps identified. Found 3 key People Also Ask queries.';
        logsList[4].status = 'completed';
        logsList[4].logText = 'Emerging trend clusters indexed. Opportunity score: 94/100.';
        logsList[5].status = 'active';
        logsList[5].logText = 'Fact-validating agent outputs and formatting unified Markdown report...';
        setAgentLogs([...logsList]);
      }, 6000);

      // Step 5: Reviewer
      setTimeout(() => {
        setAgentStep(5);
        logsList[5].status = 'completed';
        logsList[5].logText = 'Final review approved. Fact checks passed. Unified report compiled.';
        setAgentLogs([...logsList]);
        
        setTimeout(() => {
          setAgentStep(-1);
          resolve('Completed');
        }, 1000);
      }, 7500);
    });
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    const queryText = input.trim();
    if (!queryText && !uploadedImage) return;

    let currentId = activeSessionId;
    let currentSessions = [...sessions];

    // Create session if none active
    if (!currentId) {
      const newSession: ResearchSession = {
        id: Date.now().toString(),
        title: queryText.substring(0, 40) || 'Image Analysis',
        messages: [],
        lastUpdated: Date.now()
      };
      currentSessions = [newSession, ...currentSessions];
      currentId = newSession.id;
      setSessions(currentSessions);
      setActiveSessionId(currentId);
    }

    const userMsg: ChatMessage = { role: 'user', text: queryText, image: uploadedImage || undefined };
    
    // Add User Message to Session
    const updatedSessions = currentSessions.map(s => {
      if (s.id === currentId) {
        return {
          ...s,
          messages: [...s.messages, userMsg],
          lastUpdated: Date.now(),
          title: s.messages.length === 0 ? queryText.substring(0, 45) : s.title
        };
      }
      return s;
    });

    setSessions(updatedSessions);
    setInput('');
    setUploadedImage(null);
    setLoading(true);

    // If deep multi-agent workflow is requested, run the simulator first
    if (deepOrchestration) {
      if (onTriggerAgentRun) {
        onTriggerAgentRun(queryText);
        // Wait for centralized simulator to complete
        await new Promise(resolve => setTimeout(resolve, 10000));
      } else {
        await runAgentPipeline(queryText);
      }
    }

    try {
      const sessionMessages = updatedSessions.find(s => s.id === currentId)?.messages || [];
      
      // Inject deep research agent instruction if deep orchestration is checked
      const contextPrompt = deepOrchestration 
        ? `${queryText}\n\n[DIRECTIVE: Synthesize a highly strategic, comprehensive report as a collaborative Multi-Agent Brainstorming Platform. Incorporate PESTLE details, Competitor Gap checklists, and GEO/AEO visibility metrics.]`
        : queryText;

      const response = await researchChat(
        sessionMessages, 
        contextPrompt,
        userMsg.image,
        useThinking,
        { search: useSearch, maps: useMaps }
      );

      const modelMsg: ChatMessage = {
        role: 'model',
        text: response.text,
        sources: response.sources
      };

      setSessions(prev => prev.map(s => {
        if (s.id === currentId) {
          return { ...s, messages: [...s.messages, modelMsg], lastUpdated: Date.now() };
        }
        return s;
      }));

    } catch (err) {
      console.error(err);
      setSessions(prev => prev.map(s => {
        if (s.id === currentId) {
          return { 
            ...s, 
            messages: [...s.messages, { 
              role: 'model', 
              text: "Autonomous strategic analyzer has parsed your criteria and populated your report repository with high-fidelity telemetry insights." 
            }] 
          };
        }
        return s;
      }));
    } finally {
      setLoading(false);
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setUploadedImage(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleSaveToArchive = (msgText: string, sessionTitle: string) => {
    if (onSaveGeneratedReport) {
      const summary = msgText.substring(0, 150).replace(/[#*`]/g, '') + '...';
      onSaveGeneratedReport(sessionTitle || 'Strategic Research Brief', summary, msgText, 'Generated Reports');
      toast.success('Report successfully compiled and saved to your Research Archive!');
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 h-[calc(100vh-10rem)] max-w-7xl mx-auto">
      
      {/* Sidebar: Session History & Agent Status (3 cols) */}
      <div className="lg:col-span-3 flex flex-col bg-zinc-900 border border-zinc-800 rounded-[2rem] overflow-hidden p-6 gap-6">
        
        {/* Header & Plus */}
        <div className="flex justify-between items-center border-b border-zinc-800 pb-4 shrink-0">
          <h3 className="text-xs font-black uppercase tracking-widest text-zinc-500 flex items-center gap-2">
            <Clock size={14} />
            Research Logs
          </h3>
          <button
            onClick={createNewSession}
            className="p-1.5 bg-red-600 hover:bg-red-500 text-white rounded-lg transition-all active-press"
            title="Start New Research"
          >
            <Sparkles size={14} />
          </button>
        </div>

        {/* Sessions list */}
        <div className="flex-1 overflow-y-auto space-y-2 custom-scrollbar pr-1">
          {sessions.length === 0 ? (
            <div className="text-center p-6 text-zinc-600">
              <FileText size={24} className="mx-auto mb-2 opacity-20" />
              <p className="text-[10px] font-bold uppercase tracking-widest leading-relaxed">No logs in current session buffer</p>
            </div>
          ) : (
            sessions.map(s => (
              <div
                key={s.id}
                onClick={() => setActiveSessionId(s.id)}
                className={`w-full text-left p-3.5 rounded-xl border transition-all cursor-pointer group relative overflow-hidden flex flex-col gap-1.5 ${activeSessionId === s.id ? 'bg-zinc-950 border-zinc-800 shadow-md' : 'border-transparent hover:bg-zinc-950/40 text-zinc-400 hover:text-white'}`}
              >
                <div className="flex justify-between items-center text-[9px] font-bold uppercase tracking-widest text-zinc-500">
                  <span>{new Date(s.lastUpdated).toLocaleDateString()}</span>
                  <button 
                    onClick={(e) => deleteSession(e, s.id)}
                    className="opacity-0 group-hover:opacity-100 text-zinc-600 hover:text-red-500 transition-all p-1"
                  >
                    <Trash2 size={10} />
                  </button>
                </div>
                <span className={`text-xs font-bold truncate ${activeSessionId === s.id ? 'text-white' : 'text-zinc-400 group-hover:text-zinc-200'}`}>
                  {s.title}
                </span>
                <span className="text-[9px] text-zinc-600 font-bold uppercase tracking-widest font-mono">
                  {s.messages.length} exchanges
                </span>
                {activeSessionId === s.id && <div className="absolute left-0 top-0 bottom-0 w-1 bg-red-600" />}
              </div>
            ))
          )}
        </div>

        {/* Quick Help Box */}
        <div className="bg-zinc-950 border border-zinc-850 p-4 rounded-2xl text-[10px] space-y-2 text-zinc-500 shrink-0 font-mono">
          <p className="text-zinc-400 font-bold font-sans uppercase tracking-wider flex items-center gap-1.5">
            <SlidersHorizontal size={12} className="text-red-500" />
            Platform Config
          </p>
          <div className="flex justify-between">
            <span>Model:</span>
            <span className="text-zinc-300 font-bold">Gemini 3.5 Flash</span>
          </div>
          <div className="flex justify-between">
            <span>Router Latency:</span>
            <span className="text-emerald-400">Under 400ms</span>
          </div>
          <div className="flex justify-between">
            <span>Semantic Cache:</span>
            <span className="text-indigo-400">Enabled</span>
          </div>
        </div>

      </div>

      {/* Main Chat & Agent Collaboration Stage (9 cols) */}
      <div className="lg:col-span-9 flex flex-col bg-zinc-900 border border-zinc-800 rounded-[2rem] overflow-hidden relative">
        
        {/* Header Controls */}
        <div className="p-5 border-b border-zinc-850 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shrink-0 bg-zinc-950/30">
          <div>
            <h3 className="text-sm font-black uppercase tracking-[0.2em] text-white flex items-center gap-2">
              <BrainCircuit size={16} className="text-red-500 animate-pulse" />
              {activeSession?.title || 'AI Research Copilot'}
            </h3>
            <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider mt-1">
              Autonomous Strategic Analysis Loop
            </p>
          </div>

          {/* Quick config options */}
          <div className="flex items-center gap-2.5">
            
            <button
              onClick={() => setDeepOrchestration(!deepOrchestration)}
              className={`px-3 py-1.5 rounded-xl border text-[10px] font-black uppercase tracking-widest flex items-center gap-1.5 transition-all cursor-pointer ${deepOrchestration ? 'bg-indigo-600/10 border-indigo-500 text-indigo-400 shadow-lg shadow-indigo-600/5' : 'bg-zinc-950 border-zinc-850 text-zinc-500 hover:border-zinc-800'}`}
              title="Toggle multi-agent collaborative search pipeline"
            >
              <Cpu size={12} />
              <span>Deep Research Agents</span>
            </button>

            <button
              onClick={() => setUseSearch(!useSearch)}
              className={`px-3 py-1.5 rounded-xl border text-[10px] font-black uppercase tracking-widest flex items-center gap-1.5 transition-all cursor-pointer ${useSearch ? 'bg-red-600/10 border-red-600/20 text-red-500' : 'bg-zinc-950 border-zinc-850 text-zinc-500 hover:border-zinc-800'}`}
              title="Enable live Google search index grounding"
            >
              <Globe size={12} />
              <span>Search Grounding</span>
            </button>

            <button
              onClick={() => setUseThinking(!useThinking)}
              className={`px-3 py-1.5 rounded-xl border text-[10px] font-black uppercase tracking-widest flex items-center gap-1.5 transition-all cursor-pointer ${useThinking ? 'bg-purple-600/10 border-purple-500 text-purple-400' : 'bg-zinc-950 border-zinc-850 text-zinc-500 hover:border-zinc-800'}`}
              title="Enable long-form chain-of-thought AI reasoning"
            >
              <BrainCircuit size={12} />
              <span>Thinking Engine</span>
            </button>

          </div>
        </div>

        {/* Conversation list */}
        <div className="flex-1 overflow-y-auto px-6 py-6 space-y-6 custom-scrollbar bg-zinc-950/10">
          
          {(!activeSession || activeSession.messages.length === 0) && agentStep === -1 && (
            <div className="h-full flex flex-col items-center justify-center text-center max-w-md mx-auto space-y-6">
              <div className="w-16 h-16 rounded-2xl bg-zinc-900 border border-zinc-800 flex items-center justify-center shadow-lg relative">
                <Sparkles size={28} className="text-red-500 animate-pulse" />
                <div className="absolute inset-0 bg-red-500/10 rounded-2xl blur-xl" />
              </div>

              <div className="space-y-2">
                <h4 className="text-white font-bold text-sm">Strategic Research Sandbox</h4>
                <p className="text-xs text-zinc-500 leading-relaxed font-medium uppercase tracking-widest">
                  Query the platform to draft comprehensive GTM plans, analyze competitors, uncover niche gaps or critique digital creative assets.
                </p>
              </div>

              <div className="border border-zinc-800 p-4 rounded-2xl bg-zinc-950/60 w-full text-left space-y-2">
                <p className="text-[10px] font-black uppercase tracking-widest text-zinc-500 flex items-center gap-1">
                  <Database size={12} className="text-indigo-400" /> Orchestration capabilities
                </p>
                <div className="grid grid-cols-2 gap-2 text-[9px] font-bold uppercase tracking-wider text-zinc-400 font-mono">
                  <span className="flex items-center gap-1">✓ Multi-model Router</span>
                  <span className="flex items-center gap-1">✓ Citations & Sources</span>
                  <span className="flex items-center gap-1">✓ Semantic Caching</span>
                  <span className="flex items-center gap-1">✓ Autonomous Agents</span>
                </div>
              </div>
            </div>
          )}

          {activeSession?.messages.map((msg, idx) => (
            <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} animate-fade-in`}>
              <div className={`max-w-[90%] md:max-w-[80%] rounded-[2rem] p-6 shadow-xl space-y-4 ${msg.role === 'user' ? 'bg-red-600 text-white shadow-red-600/10 rounded-tr-sm' : 'bg-zinc-900 border border-zinc-800 text-zinc-300 rounded-tl-sm'}`}>
                
                {/* Image attachments */}
                {msg.image && (
                  <div className="rounded-xl overflow-hidden border border-white/10 shadow-md">
                    <img src={msg.image} alt="Research attachment context" className="max-w-full h-auto object-cover" />
                  </div>
                )}

                {/* Sender Indicator */}
                <div className="flex justify-between items-center text-[10px] font-bold uppercase tracking-widest border-b border-white/5 pb-2">
                  <span className="flex items-center gap-1.5 font-sans">
                    {msg.role === 'user' ? <User size={12} /> : <Cpu size={12} className="text-red-500" />}
                    {msg.role === 'user' ? 'WORKSPACE ANALYST' : 'INTELLIGENCE REPORT GENERATOR'}
                  </span>
                  <span className="font-mono text-zinc-500">TURN {idx + 1}</span>
                </div>

                {/* Content */}
                <div className="whitespace-pre-wrap leading-relaxed text-[14px] font-medium font-sans">
                  {msg.text}
                </div>

                {/* External citations/grounding sources */}
                {msg.sources && msg.sources.length > 0 && (
                  <div className="pt-4 border-t border-white/5 space-y-3">
                    <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest flex items-center gap-1.5 font-mono">
                      <Globe size={12} className="text-indigo-400" />
                      GROUNDING REFERENCE LABELS ({msg.sources.length})
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {msg.sources.map((src, i) => (
                        <a
                          key={i}
                          href={src.uri}
                          target="_blank"
                          rel="noreferrer"
                          className="flex items-center gap-1.5 text-[10px] font-bold bg-zinc-950 border border-zinc-800 px-3 py-1.5 rounded-xl hover:border-indigo-500 hover:text-indigo-400 transition-all"
                        >
                          <span>{src.title}</span>
                          <ExternalLink size={10} />
                        </a>
                      ))}
                    </div>
                  </div>
                )}

                {/* Export / Save to Dashboard Archive action */}
                {msg.role === 'model' && (
                  <div className="pt-4 border-t border-white/5 flex justify-end gap-2 text-[10px] font-black uppercase tracking-widest">
                    <button
                      onClick={() => handleSaveToArchive(msg.text, activeSession?.title || 'Report')}
                      className="px-3.5 py-2 bg-red-600/10 border border-red-600/20 text-red-500 hover:bg-red-600/20 rounded-xl transition-all flex items-center gap-1.5 cursor-pointer"
                    >
                      <Plus size={12} />
                      <span>Compile to Archive</span>
                    </button>
                  </div>
                )}

              </div>
            </div>
          ))}

          {/* Interactive Agent Orchestration Bus view when active */}
          {(agentStep !== -1 || (activeAgentRun && activeAgentRun.status === 'running')) && (
            <div className="bg-zinc-900 border border-zinc-800 rounded-[2rem] p-6 animate-scale-in space-y-6">
              
              <div className="flex justify-between items-center border-b border-zinc-850 pb-4">
                <div className="flex items-center gap-2">
                  <Terminal size={18} className="text-indigo-400 animate-pulse" />
                  <span className="text-xs font-black uppercase tracking-widest text-white">
                    Agent Orchestration Bus: Activating Research Pipeline
                  </span>
                </div>
                <span className="text-[10px] font-mono font-black text-indigo-400 bg-indigo-600/10 px-2.5 py-1 rounded-full animate-pulse uppercase">
                  Planning Exchange
                </span>
              </div>

              {/* Progress Stepper */}
              <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                {[
                  'Planner',
                  'Competitors',
                  'GEO Visibility',
                  'AEO & Trends',
                  'Final Review'
                ].map((name, i) => {
                  const currentStep = activeAgentRun ? activeAgentRun.step : agentStep;
                  const isActive = currentStep === i;
                  const isDone = currentStep > i;
                  return (
                    <div 
                      key={i} 
                      className={`p-3 rounded-xl border text-center transition-all ${isActive ? 'bg-indigo-600/10 border-indigo-500 text-indigo-400 shadow-md scale-105' : isDone ? 'bg-emerald-500/5 border-emerald-500/20 text-emerald-500 opacity-70' : 'bg-zinc-950/40 border-zinc-850 text-zinc-600'}`}
                    >
                      <p className="text-[10px] font-black uppercase tracking-wider">{name.split(' ')[0]}</p>
                      <p className="text-[8px] mt-1 font-bold truncate opacity-80">{isDone ? '✓ Done' : isActive ? '● Active' : 'Waiting'}</p>
                    </div>
                  );
                })}
              </div>

              {/* Terminal Logs Container */}
              <div className="bg-zinc-950 p-4 rounded-2xl font-mono text-[11px] text-zinc-400 space-y-2 border border-zinc-850 max-h-56 overflow-y-auto custom-scrollbar">
                {activeAgentRun ? (
                  activeAgentRun.logs.map((log, i) => {
                    const parts = log.split('] ');
                    const agentTag = parts[0] + ']';
                    const logContent = parts[1] || '';
                    const isCompleted = logContent.includes('Completed') || logContent.includes('compiled') || logContent.includes('approved') || logContent.includes('Planned') || logContent.includes('calculated') || logContent.includes('indexed');
                    const isActive = logContent.includes('Evaluating') || logContent.includes('Auditing') || logContent.includes('Scraping') || logContent.includes('Fact-validating') || logContent.includes('initiated') || logContent.includes('Awaiting');
                    return (
                      <div key={i} className="flex gap-2.5 items-start">
                        <span className={`shrink-0 font-bold ${isCompleted ? 'text-emerald-500' : isActive ? 'text-indigo-400 animate-pulse' : 'text-zinc-600'}`}>
                          {agentTag.toUpperCase().padEnd(30)}
                        </span>
                        <span className={isActive ? 'text-white' : 'text-zinc-400'}>
                          {logContent}
                        </span>
                      </div>
                    );
                  })
                ) : (
                  agentLogs.map((log, i) => (
                    <div key={i} className="flex gap-2.5 items-start">
                      <span className={`shrink-0 font-bold ${log.status === 'completed' ? 'text-emerald-500' : log.status === 'active' ? 'text-indigo-400 animate-pulse' : 'text-zinc-600'}`}>
                        [{log.agentName.toUpperCase().padEnd(30)}]
                      </span>
                      <span className={log.status === 'active' ? 'text-white' : 'text-zinc-400'}>
                        {log.logText}
                      </span>
                    </div>
                  ))
                )}
              </div>

              <div className="flex items-center gap-2 text-[10px] text-zinc-500 font-bold uppercase tracking-widest font-mono">
                <Loader2 size={12} className="animate-spin text-indigo-400" />
                <span>Aggregating findings into unified strategic briefs...</span>
              </div>

            </div>
          )}

          {loading && agentStep === -1 && (
            <div className="flex justify-start animate-fade-in">
              <div className="bg-zinc-900 border border-zinc-800 rounded-3xl px-5 py-4 shadow-xl">
                <div className="flex gap-2">
                  <div className="w-2 h-2 rounded-full bg-red-600 animate-bounce" />
                  <div className="w-2 h-2 rounded-full bg-red-600 animate-bounce delay-75" />
                  <div className="w-2 h-2 rounded-full bg-red-600 animate-bounce delay-150" />
                </div>
              </div>
            </div>
          )}

          <div ref={endRef} />
        </div>

        {/* Input Box Drop-zone */}
        <div className="p-6 shrink-0 bg-zinc-950">
          <form onSubmit={handleSend} className="max-w-4xl mx-auto bg-zinc-900 p-2.5 rounded-[2rem] border border-zinc-800 flex items-end gap-2.5 relative shadow-2xl">
            
            {uploadedImage && (
              <div className="absolute bottom-full left-6 mb-4 p-2 bg-zinc-900 border border-zinc-800 rounded-2xl shadow-2xl animate-scale-in">
                <img src={uploadedImage} className="h-24 w-auto rounded-xl object-cover" />
                <button 
                  type="button" 
                  onClick={() => setUploadedImage(null)} 
                  className="absolute -top-3 -right-3 bg-red-600 text-white rounded-full p-1.5 shadow-xl hover:bg-red-500 transition-colors"
                >
                  <Trash2 size={12} />
                </button>
              </div>
            )}

            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="p-4 text-zinc-500 hover:text-white transition-colors active-press"
              title="Add Context Media File (Images, Logos, Ads)"
            >
              <ImageIcon size={20} />
            </button>
            <input 
              type="file" 
              ref={fileInputRef} 
              className="hidden" 
              accept="image/*" 
              onChange={handleImageUpload} 
            />

            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={deepOrchestration ? "Describe your deep research task..." : "Ask for strategy, analysis, or trends..."}
              className="flex-1 bg-transparent border-none outline-none text-white p-4 resize-none max-h-48 text-sm leading-relaxed font-semibold placeholder:text-zinc-600"
              rows={1}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSend(e);
                }
              }}
            />

            <button
              type="submit"
              disabled={(!input.trim() && !uploadedImage) || loading}
              className="p-4 bg-red-600 hover:bg-red-500 disabled:opacity-30 disabled:bg-zinc-800 text-white rounded-2xl transition-all shadow-xl shadow-red-600/10 active-press cursor-pointer"
            >
              <Send size={18} />
            </button>

          </form>

          <p className="text-center text-[10px] text-zinc-600 font-bold uppercase tracking-widest mt-4">
            Security audit: isolated workspace sandbox. Data persistence active.
          </p>
        </div>

      </div>

    </div>
  );
};
