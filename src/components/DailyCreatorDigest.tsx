import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Sparkles, 
  TrendingUp, 
  Briefcase, 
  CheckCircle2, 
  Plus, 
  Trash2, 
  ChevronRight, 
  Flame, 
  Target, 
  Clock, 
  ShieldAlert,
  Zap,
  RefreshCw,
  Award
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { Project } from '@/shared/types';

interface DailyCreatorDigestProps {
  projects: Project[];
  onNavigate: (tool: any) => void;
}

interface CustomTask {
  id: string;
  text: string;
  completed: boolean;
  type: 'system' | 'custom';
}

interface TrendCard {
  id: string;
  title: string;
  ctrBoost: string;
  velocity: string;
  category: string;
  details: string;
}

export const DailyCreatorDigest: React.FC<DailyCreatorDigestProps> = ({ projects, onNavigate }) => {
  // 1. AI-Driven Trends dataset
  const [trends, setTrends] = useState<TrendCard[]>([
    {
      id: 'trend_1',
      title: "Faceless Personal Finance 'Crash Courses'",
      ctrBoost: "+18.4% CTR",
      velocity: "High Velocity",
      category: "Personal Finance",
      details: "Channels utilizing minimalist cosmic slate cards and dynamic vocal pacing are seeing massive audience retention in short-form tutorials."
    },
    {
      id: 'trend_2',
      title: "Linguistic Velocity & Cinematic Voiceovers",
      ctrBoost: "+24.8% CTR",
      velocity: "Exponential Peak",
      category: "AI Audio Narration",
      details: "Replacing standard generative AI tones with deep cinematic characters (e.g., Charon preset) coupled with rapid 3-word visual pacing."
    },
    {
      id: 'trend_3',
      title: "Exposing SaaS Hacks & Competitor Spans",
      ctrBoost: "+12.2% CTR",
      velocity: "Blue Ocean Gap",
      category: "SaaS & Growth Hacks",
      details: "Audiences are craving high-efficiency breakdowns of tech products. Recommended layout: grid bento layout with high density stats."
    }
  ]);

  const [activeTrendId, setActiveTrendId] = useState<string | null>(null);
  const [isBriefingLoading, setIsBriefingLoading] = useState(false);
  const [briefingText, setBriefingText] = useState<string>("");

  // 2. Pending Tasks & Goals
  const [tasks, setTasks] = useState<CustomTask[]>([]);
  const [newTaskText, setNewTaskText] = useState('');

  // 3. Load / Initialize tasks
  useEffect(() => {
    const saved = localStorage.getItem('ranktica_daily_digest_tasks');
    if (saved) {
      try {
        setTasks(JSON.parse(saved));
      } catch (e) {
        console.error('Failed to load daily tasks', e);
      }
    } else {
      // Default initial booster tasks
      const defaultTasks: CustomTask[] = [
        { id: 'sys_1', text: 'Analyze daily blue ocean gap ideas inside Viral Idea Lab', completed: false, type: 'system' },
        { id: 'sys_2', text: 'Generate active thumbnail CTR variations with AI thumbnail rater', completed: false, type: 'system' },
        { id: 'sys_3', text: 'Check workload hours and balance team members leaves in Team Planner', completed: false, type: 'system' },
      ];
      setTasks(defaultTasks);
      localStorage.setItem('ranktica_daily_digest_tasks', JSON.stringify(defaultTasks));
    }
  }, []);

  // Update localStorage on task change
  const saveTasks = (updatedTasks: CustomTask[]) => {
    setTasks(updatedTasks);
    localStorage.setItem('ranktica_daily_digest_tasks', JSON.stringify(updatedTasks));
  };

  // Add custom task
  const handleAddTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskText.trim()) return;
    const newTask: CustomTask = {
      id: `custom_${Date.now()}`,
      text: newTaskText.trim(),
      completed: false,
      type: 'custom'
    };
    const updated = [...tasks, newTask];
    saveTasks(updated);
    setNewTaskText('');
    toast.success('Daily priority task registered!');
  };

  // Toggle task completed
  const handleToggleTask = (id: string) => {
    const updated = tasks.map(t => t.id === id ? { ...t, completed: !t.completed } : t);
    saveTasks(updated);
    const task = updated.find(t => t.id === id);
    if (task?.completed) {
      toast.success('Task complete! Linguistic production moving...', { icon: '🔥' });
    }
  };

  // Delete task
  const handleDeleteTask = (id: string) => {
    const updated = tasks.filter(t => t.id !== id);
    saveTasks(updated);
    toast.error('Task removed');
  };

  // Dynamic status-based calculations
  const activeProjects = projects.filter(p => !p.archived && p.status !== 'archive');
  const finishedTasks = tasks.filter(t => t.completed).length;
  const completionPercentage = tasks.length > 0 ? Math.round((finishedTasks / tasks.length) * 100) : 0;

  // Synthesize daily briefing report using simulated Gemini cognitive analyzer
  const handleTriggerBriefing = () => {
    setIsBriefingLoading(true);
    setBriefingText("");
    
    setTimeout(() => {
      const activeProjTitles = activeProjects.map(p => `"${p.title}"`).join(', ') || 'No active projects';
      const text = `GOOD MORNING CREATOR. HERE IS YOUR DYNAMIC AI PRODUCTION DISPATCH FOR JULY 18, 2026.
      
• ACTIVE PIPELINES: You are actively directing ${activeProjects.length} production channels (${activeProjTitles}). Your current focus should remain on scripting workflows to sustain high retention levels.
• SYSTEM DIAGNOSIS: Channel CTR averages are hovering around 8.4% (target is 10.0%). We recommend immediate visual testing using high contrast red borders.
• PRIORITY DIRECTIVE: Finish the script synthesis for ${activeProjects[0]?.title || 'your key project'} and balance workload limits in the Team Members hub.`;
      
      setBriefingText(text);
      setIsBriefingLoading(false);
      toast.success('AI Briefing successfully synthesized!');
    }, 1200);
  };

  return (
    <div className="bg-zinc-900/90 border border-zinc-800 rounded-[2rem] p-6 lg:p-8 space-y-6 relative overflow-hidden shadow-xl" id="daily-creator-digest">
      {/* Decorative Gradient Background Aura */}
      <div className="absolute top-0 right-0 w-80 h-80 bg-red-600/5 rounded-full blur-[100px] pointer-events-none"></div>
      <div className="absolute -bottom-10 -left-10 w-80 h-80 bg-indigo-600/5 rounded-full blur-[100px] pointer-events-none"></div>

      {/* Title & Daily Status Meter */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-zinc-800/60 relative z-10">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2">
            <span className="flex items-center gap-1 bg-red-500/10 border border-red-500/20 text-red-500 text-[9px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full">
              <Sparkles size={10} className="animate-pulse" /> AI Daily Intelligence
            </span>
            <span className="text-[10px] font-mono text-zinc-500">System Live • 128-bit Encryption</span>
          </div>
          <h3 className="text-xl font-black text-white tracking-tight flex items-center gap-2 font-display">
            Daily Creator Digest
          </h3>
          <p className="text-xs text-zinc-400">
            Synthesize virality metrics, track script & video workflows, and coordinate team roles.
          </p>
        </div>

        <div className="flex items-center gap-4 bg-zinc-950/60 border border-zinc-800/80 rounded-2xl p-3">
          <div className="space-y-1">
            <p className="text-[9px] font-mono font-black uppercase text-zinc-500 tracking-wider">Blueprint Status</p>
            <div className="flex items-center gap-2">
              <span className="font-mono text-lg font-bold text-white">{completionPercentage}%</span>
              <span className="text-zinc-500 text-xs">completed</span>
            </div>
          </div>
          <div className="w-20 h-2 bg-zinc-800 rounded-full overflow-hidden">
            <div 
              className="h-full bg-red-600 rounded-full transition-all duration-500" 
              style={{ width: `${completionPercentage}%` }}
            />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 relative z-10">
        
        {/* SECTION 1: AI-Driven Trends */}
        <div className="space-y-4 bg-zinc-950/40 border border-zinc-850 p-5 rounded-2xl">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-black uppercase tracking-widest text-zinc-400 flex items-center gap-1.5">
              <TrendingUp size={14} className="text-red-500" /> Viral Trend Watch
            </h4>
            <span className="text-[9px] font-mono bg-red-600/10 border border-red-500/20 text-red-400 px-2 py-0.5 rounded-full font-bold">Live CTR Spike</span>
          </div>
          
          <div className="space-y-3">
            {trends.map(t => (
              <div 
                key={t.id} 
                onClick={() => setActiveTrendId(activeTrendId === t.id ? null : t.id)}
                className={`p-3.5 rounded-xl border transition-all cursor-pointer ${
                  activeTrendId === t.id 
                    ? 'bg-zinc-900 border-red-600/60 shadow-lg' 
                    : 'bg-zinc-950 hover:bg-zinc-900/60 border-zinc-850'
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <span className="text-[8px] font-black uppercase text-zinc-500 tracking-wider block mb-1">{t.category}</span>
                    <h5 className="text-[11px] font-bold text-white leading-tight">{t.title}</h5>
                  </div>
                  <span className="text-[9px] font-mono font-black text-green-400 whitespace-nowrap bg-green-500/10 px-2 py-0.5 rounded-md border border-green-500/20">{t.ctrBoost}</span>
                </div>
                
                <div className="flex items-center justify-between mt-2.5 text-[9px] text-zinc-500">
                  <span className="flex items-center gap-1 text-red-400 font-medium">
                    <Flame size={10} /> {t.velocity}
                  </span>
                  <span className="text-zinc-650 hover:text-zinc-400">Click to expand</span>
                </div>

                <AnimatePresence>
                  {activeTrendId === t.id && (
                    <motion.div 
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="mt-3 pt-3 border-t border-zinc-800/80 overflow-hidden"
                    >
                      <p className="text-[10px] text-zinc-400 leading-relaxed bg-zinc-950 p-2.5 rounded-lg border border-zinc-900">
                        {t.details}
                      </p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ))}
          </div>
        </div>

        {/* SECTION 2: Project Pipeline tracker */}
        <div className="space-y-4 bg-zinc-950/40 border border-zinc-850 p-5 rounded-2xl">
          <h4 className="text-xs font-black uppercase tracking-widest text-zinc-400 flex items-center gap-1.5">
            <Briefcase size={14} className="text-indigo-400" /> Active Channel Pipelines
          </h4>

          {activeProjects.length === 0 ? (
            <div className="text-center py-8 bg-zinc-950 rounded-xl border border-zinc-900 space-y-3">
              <ShieldAlert className="text-zinc-650 mx-auto" size={20} />
              <p className="text-[10px] text-zinc-500">No active production pipelines detected.</p>
              <button 
                onClick={() => onNavigate(3)} // Route index for Projects or Creator dashboard
                className="px-3.5 py-1.5 bg-red-600/10 hover:bg-red-600 text-red-500 hover:text-white border border-red-500/25 rounded-lg text-[9px] font-black uppercase tracking-wider transition-all cursor-pointer"
              >
                Create Project
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {activeProjects.slice(0, 3).map(p => {
                let progress = 20;
                let stepLabel = "Idea Incubation";
                if (p.status === 'scripting') { progress = 40; stepLabel = "Script Writing"; }
                else if (p.status === 'production') { progress = 70; stepLabel = "Video Synthesis"; }
                else if (p.status === 'scheduled') { progress = 90; stepLabel = "Publish Pending"; }
                else if (p.status === 'published') { progress = 100; stepLabel = "Delivered"; }

                return (
                  <div key={p.id} className="p-3.5 bg-zinc-950 border border-zinc-850 rounded-xl space-y-2">
                    <div className="flex items-center justify-between gap-2">
                      <h5 className="text-[11px] font-black text-white truncate max-w-[150px]">{p.title}</h5>
                      <span className="text-[8px] font-mono font-black uppercase tracking-wider text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded-full border border-indigo-500/20">
                        {p.status}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-[9px] text-zinc-500 font-mono">
                      <span>Niche: {p.niche || 'General'}</span>
                      <span className="text-zinc-400">{progress}%</span>
                    </div>

                    <div className="w-full h-1 bg-zinc-900 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-indigo-500 rounded-full transition-all duration-300" 
                        style={{ width: `${progress}%` }}
                      />
                    </div>

                    <div className="flex items-center justify-between pt-1 text-[8px] text-zinc-500">
                      <span className="flex items-center gap-1">
                        <Clock size={10} /> Active Goal: {stepLabel}
                      </span>
                      <span className="text-zinc-400 hover:text-white cursor-pointer font-bold flex items-center gap-0.5">
                        Focus <ChevronRight size={10} />
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* SECTION 3: Priority Task Blueprint */}
        <div className="space-y-4 bg-zinc-950/40 border border-zinc-850 p-5 rounded-2xl">
          <h4 className="text-xs font-black uppercase tracking-widest text-zinc-400 flex items-center gap-1.5">
            <Target size={14} className="text-emerald-400" /> Creator Blueprint Checklist
          </h4>

          {/* Quick Task Input */}
          <form onSubmit={handleAddTask} className="flex gap-2">
            <input 
              type="text"
              value={newTaskText}
              onChange={(e) => setNewTaskText(e.target.value)}
              placeholder="Inject daily task priority..."
              className="flex-1 bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-[10px] text-white focus:outline-none focus:border-red-500/50"
            />
            <button 
              type="submit"
              className="p-2 bg-red-600 text-white rounded-xl hover:bg-red-500 active:scale-95 transition-all cursor-pointer shrink-0"
            >
              <Plus size={14} />
            </button>
          </form>

          {/* Task list */}
          <div className="space-y-2 max-h-[220px] overflow-y-auto pr-1">
            {tasks.map(t => (
              <div 
                key={t.id} 
                className={`flex items-center justify-between gap-3 p-2.5 bg-zinc-950 border border-zinc-850 rounded-xl group transition-all ${
                  t.completed ? 'opacity-60 bg-zinc-950/40 border-zinc-900' : ''
                }`}
              >
                <div 
                  onClick={() => handleToggleTask(t.id)}
                  className="flex items-start gap-2.5 flex-1 cursor-pointer"
                >
                  <button 
                    type="button"
                    className={`mt-0.5 w-3.5 h-3.5 rounded border flex items-center justify-center shrink-0 transition-all ${
                      t.completed 
                        ? 'bg-red-600 border-red-500 text-white' 
                        : 'border-zinc-700 hover:border-zinc-500'
                    }`}
                  >
                    {t.completed && <CheckCircle2 size={10} className="stroke-[3]" />}
                  </button>
                  <p className={`text-[10px] leading-snug transition-all ${
                    t.completed ? 'line-through text-zinc-500' : 'text-zinc-300'
                  }`}>
                    {t.text}
                  </p>
                </div>
                {t.type === 'custom' && (
                  <button 
                    onClick={() => handleDeleteTask(t.id)}
                    className="text-zinc-600 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100 p-1 rounded cursor-pointer"
                  >
                    <Trash2 size={11} />
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>

      </div>

      {/* AI Daily Briefing Dispatcher Section */}
      <div className="bg-gradient-to-r from-zinc-950 via-zinc-900/60 to-zinc-950 border border-zinc-800 rounded-2xl p-5 mt-4 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <h4 className="text-xs font-black uppercase text-white flex items-center gap-1.5 tracking-wider">
              <Zap size={14} className="text-amber-400 animate-pulse" /> AI Daily Intelligence Briefing
            </h4>
            <p className="text-[10px] text-zinc-500">Synthesize real-time workflow statuses, metrics, and YouTube velocity indicators.</p>
          </div>
          <button
            onClick={handleTriggerBriefing}
            disabled={isBriefingLoading}
            className="flex items-center gap-2 px-5 py-2.5 bg-red-600 hover:bg-red-500 disabled:opacity-50 text-[10px] font-black uppercase tracking-wider text-white rounded-xl transition-all shadow-lg shadow-red-950/40 cursor-pointer self-start sm:self-auto"
          >
            <RefreshCw size={12} className={isBriefingLoading ? 'animate-spin' : ''} />
            {isBriefingLoading ? 'Synthesizing...' : 'Generate Dispatch Briefing'}
          </button>
        </div>

        <AnimatePresence>
          {briefingText && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="bg-zinc-950 border border-zinc-850 rounded-xl p-4 font-mono text-[10px] text-zinc-400 leading-relaxed whitespace-pre-line border-l-4 border-l-amber-500 relative shadow-inner"
            >
              <div className="absolute top-2 right-2 text-[8px] uppercase tracking-wider font-black text-amber-500 bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded-md">
                Secure AI Dispatch
              </div>
              {briefingText}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

    </div>
  );
};
