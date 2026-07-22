import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Sparkles, 
  Lightbulb, 
  FileText, 
  Video, 
  ArrowRight, 
  ArrowLeft, 
  X, 
  Compass, 
  LayoutDashboard,
  CheckCircle2,
  HelpCircle,
  Settings,
  Plus,
  Trash2,
  ChevronUp,
  ChevronDown,
  RotateCcw,
  Save,
  Check,
  TrendingUp,
  BarChart3,
  Users
} from 'lucide-react';
import * as LucideIcons from 'lucide-react';
import { ToolType } from '@/shared/types';
import { toast } from 'react-hot-toast';

interface OnboardingTourProps {
  onNavigate: (tool: ToolType, payload?: any) => void;
  onClose: () => void;
}

export interface TourStep {
  title: string;
  description: string;
  tool: ToolType;
  iconName: string;
  iconColor: string;
  badge: string;
  accentColor: string;
  focusElements?: string[]; // Descriptions of what to look for
  tips: string;
}

const DEFAULT_STEPS: TourStep[] = [
  {
    title: "Viral Idea Lab",
    badge: "Idea Generator",
    tool: ToolType.IDEAS,
    iconName: "Lightbulb",
    iconColor: "text-yellow-400",
    accentColor: "from-yellow-500 to-amber-600",
    description: "Welcome to your viral conceptual core! This is where you transform thoughts into high-retention video templates. Run the AI generator to extract calculated hooks, audience niches, title predictions, and search-optimized semantic keywords in seconds.",
    focusElements: [
      "Niche Conception prompts",
      "Audience Hooks generation console",
      "Semantic search-optimized keyword list"
    ],
    tips: "💡 Pro tip: Direct hooks created here can be prefilled instantly into the Scripting module with one hit!"
  },
  {
    title: "Design-Driven Script Writer",
    badge: "Scripting Core",
    tool: ToolType.SCRIPT,
    iconName: "FileText",
    iconColor: "text-blue-400",
    accentColor: "from-blue-500 to-indigo-600",
    description: "This is your multi-speaker studio! Draft perfect auditory narration or dialogue screenplays seamlessly. Tweak structural pacing timelines, insert cinematic voice tags, adjust semantic emotion profiles, and keep prompt streams completely synchronized.",
    focusElements: [
      "Pacing & Duration modifiers",
      "Voice Clone tags injector",
      "Creative AI narration prompt engine"
    ],
    tips: "✍️ Pro tip: Highlight sentences within the editor to trigger direct syllable optimizations for higher speech rhythm."
  },
  {
    title: "Timeline Video Studio",
    badge: "Video Studio",
    tool: ToolType.VIDEO,
    iconName: "Video",
    iconColor: "text-red-500",
    accentColor: "from-red-500 to-orange-600",
    description: "Take control of the final master compile! The Video Studio is where you arrange footage, drop multi-layered clips on the timeline track, overlay customized B-rolls, set background music gain filters, and export high-fidelity video manifests.",
    focusElements: [
      "Multi-track timeline compiler",
      "B-roll asset repository",
      "Master sequence export and syncing"
    ],
    tips: "🎬 Pro tip: Make sure to click 'Backup Manifest' in the video options before running batch cloud renders."
  },
  {
    title: "Creator Command",
    badge: "Command Console",
    tool: ToolType.DASHBOARD,
    iconName: "LayoutDashboard",
    iconColor: "text-purple-400",
    accentColor: "from-purple-500 to-fuchsia-600",
    description: "Return to your strategic cockpit! Track real-time engagement streams from YouTube, TikTok, and Instagram simultaneously. Monitor prediction heatmaps, complete your daily check-in streaks, and view direct recommendations generated specifically to grow your audience.",
    focusElements: [
      "Daily streak and progress trackers",
      "Omnichannel analytical graphs",
      "Dynamic Pomodoro focus timer"
    ],
    tips: "🔥 Pro tip: Connect your real YouTube stream index once to automatically receive background AI advice cards!"
  }
];

export const OnboardingTour: React.FC<OnboardingTourProps> = ({ onNavigate, onClose }) => {
  const [currentStepIndex, setCurrentStepIndex] = useState(-1); // -1 is Welcome page, steps indices, final is Done page
  const [steps, setSteps] = useState<TourStep[]>([]);
  const [isAdminEditing, setIsAdminEditing] = useState(false);
  const [selectedEditIndex, setSelectedEditIndex] = useState<number>(0);

  // Load custom or default steps
  useEffect(() => {
    const saved = localStorage.getItem('ranktica_custom_onboarding_steps');
    if (saved) {
      try {
        setSteps(JSON.parse(saved));
      } catch (e) {
        console.error('Failed to parse onboarding tour steps', e);
        setSteps(DEFAULT_STEPS);
      }
    } else {
      setSteps(DEFAULT_STEPS);
    }
  }, []);

  // Detect if simulated user role is Admin
  const userRole = localStorage.getItem('ranktica_simulated_role') || 'Admin';
  const isAdmin = userRole === 'Admin';

  // Navigate corresponding view as steps change
  useEffect(() => {
    if (currentStepIndex >= 0 && currentStepIndex < steps.length) {
      onNavigate(steps[currentStepIndex].tool);
    }
  }, [currentStepIndex, steps]);

  const handleNext = () => {
    if (currentStepIndex < steps.length - 1) {
      setCurrentStepIndex(prev => prev + 1);
    } else {
      handleFinish();
    }
  };

  const handleBack = () => {
    if (currentStepIndex > -1) {
      setCurrentStepIndex(prev => prev - 1);
    }
  };

  const handleFinish = () => {
    localStorage.setItem('ranktica_onboarding_completed', 'true');
    onClose();
    toast.success("Onboarding tour completed! You are ready to create! 🚀");
  };

  const handleResetToDefaults = () => {
    if (confirm("Reset the product onboarding tour to the preconfigured factory defaults?")) {
      localStorage.removeItem('ranktica_custom_onboarding_steps');
      setSteps(DEFAULT_STEPS);
      setSelectedEditIndex(0);
      toast.success("Restored factory default walkthrough settings!");
    }
  };

  const handleSaveCustomSteps = () => {
    localStorage.setItem('ranktica_custom_onboarding_steps', JSON.stringify(steps));
    setIsAdminEditing(false);
    toast.success("Successfully published and updated the Onboarding Tour for all team members! 🛰️");
  };

  const handleAddStep = () => {
    const newStep: TourStep = {
      title: "New Walkthrough Stage",
      badge: "Feature Guide",
      tool: ToolType.IDEAS,
      iconName: "Sparkles",
      iconColor: "text-red-500",
      accentColor: "from-red-500 to-rose-600",
      description: "Provide a clinical description outlining how this specific interface solves viral audience retention or multi-tenant pipeline velocity.",
      focusElements: ["Interactive Control Elements", "Analytical Indicators"],
      tips: "💡 Pro tip: Explanations are highly interactive!"
    };
    setSteps([...steps, newStep]);
    setSelectedEditIndex(steps.length);
    toast.success("Added new walkthrough step!");
  };

  const handleDeleteStep = (indexToDelete: number) => {
    if (steps.length <= 1) {
      toast.error("An onboarding tour must contain at least one step.");
      return;
    }
    const updated = steps.filter((_, idx) => idx !== indexToDelete);
    setSteps(updated);
    setSelectedEditIndex(Math.max(0, indexToDelete - 1));
    toast.success("Removed selected tour step.");
  };

  const handleMoveStep = (index: number, direction: 'up' | 'down') => {
    if (direction === 'up' && index === 0) return;
    if (direction === 'down' && index === steps.length - 1) return;

    const updated = [...steps];
    const targetIdx = direction === 'up' ? index - 1 : index + 1;
    const temp = updated[index];
    updated[index] = updated[targetIdx];
    updated[targetIdx] = temp;

    setSteps(updated);
    setSelectedEditIndex(targetIdx);
  };

  const renderStepIcon = (iconName: string, colorClass: string) => {
    const IconComponent = (LucideIcons as any)[iconName] || LucideIcons.HelpCircle;
    return <IconComponent size={32} className={colorClass} />;
  };

  const activeStep = currentStepIndex >= 0 && currentStepIndex < steps.length ? steps[currentStepIndex] : null;

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/85 backdrop-blur-[3px] overflow-hidden select-none">
      {/* Background Neon Glow Rings */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-red-650/5 rounded-full blur-[160px] pointer-events-none" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] bg-orange-500/5 rounded-full blur-[140px] pointer-events-none" />

      <AnimatePresence mode="wait">
        {/* ADMIN EDITING VIEW PANEL */}
        {isAdminEditing ? (
          <motion.div
            key="admin-editor"
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.96 }}
            className="bg-[#0f0f12] border border-zinc-800 rounded-[2.5rem] w-full max-w-4xl h-[85vh] flex flex-col overflow-hidden shadow-2xl relative"
          >
            {/* Top red glow band */}
            <div className="absolute top-0 inset-x-0 h-[3px] bg-gradient-to-r from-red-600 via-orange-500 to-indigo-600" />
            
            {/* Editor Header */}
            <div className="p-6 border-b border-zinc-850 flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] uppercase tracking-widest font-black text-red-500 font-mono bg-red-600/10 px-2.5 py-1 rounded-full border border-red-500/20">
                    Administrator Access
                  </span>
                </div>
                <h2 className="text-xl font-black text-white mt-1.5 tracking-tight font-sans">
                  Onboarding Tour Customization Engine
                </h2>
              </div>
              <button 
                onClick={() => setIsAdminEditing(false)}
                className="text-zinc-500 hover:text-white p-2 hover:bg-zinc-850 rounded-xl transition-all"
                title="Cancel & Exit"
              >
                <X size={16} />
              </button>
            </div>

            {/* Split Screen Container */}
            <div className="flex-1 flex overflow-hidden">
              {/* Left Column: Steps list & Order */}
              <div className="w-1/3 border-r border-zinc-850 p-6 flex flex-col justify-between bg-zinc-950/40">
                <div className="space-y-4 overflow-y-auto custom-scrollbar flex-1 pr-1">
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-[9px] font-black uppercase text-zinc-500 tracking-wider">
                      Tour Walkthrough Stages
                    </span>
                    <button
                      onClick={handleAddStep}
                      className="p-1.5 bg-red-600/10 hover:bg-red-600 text-red-400 hover:text-white border border-red-500/10 rounded-lg text-[9px] font-black uppercase tracking-wider flex items-center gap-1 transition-all"
                    >
                      <Plus size={10} /> Add Stage
                    </button>
                  </div>

                  <div className="space-y-2">
                    {steps.map((step, idx) => (
                      <div 
                        key={idx}
                        onClick={() => setSelectedEditIndex(idx)}
                        className={`p-3 rounded-2xl border transition-all cursor-pointer flex items-center justify-between gap-2 group ${idx === selectedEditIndex ? 'bg-zinc-900 border-zinc-750 shadow-md shadow-black/35 text-white' : 'bg-transparent border-zinc-855 text-zinc-400 hover:bg-zinc-900/40'}`}
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <span className="text-[10px] font-mono font-black text-zinc-600 group-hover:text-red-500">
                            #{idx + 1}
                          </span>
                          <span className="text-xs font-bold truncate">
                            {step.title || "Untitled Stage"}
                          </span>
                        </div>
                        
                        {/* Stage Controls */}
                        <div className="flex items-center gap-1 opacity-60 group-hover:opacity-100 transition-opacity shrink-0">
                          <button
                            disabled={idx === 0}
                            onClick={(e) => { e.stopPropagation(); handleMoveStep(idx, 'up'); }}
                            className="p-1 hover:bg-zinc-800 rounded text-zinc-500 hover:text-white disabled:opacity-30 disabled:pointer-events-none"
                          >
                            <ChevronUp size={12} />
                          </button>
                          <button
                            disabled={idx === steps.length - 1}
                            onClick={(e) => { e.stopPropagation(); handleMoveStep(idx, 'down'); }}
                            className="p-1 hover:bg-zinc-800 rounded text-zinc-500 hover:text-white disabled:opacity-30 disabled:pointer-events-none"
                          >
                            <ChevronDown size={12} />
                          </button>
                          <button
                            onClick={(e) => { e.stopPropagation(); handleDeleteStep(idx); }}
                            className="p-1 hover:bg-zinc-800 rounded text-zinc-500 hover:text-red-500"
                          >
                            <Trash2 size={12} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="pt-4 border-t border-zinc-850">
                  <button
                    onClick={handleResetToDefaults}
                    className="w-full py-2.5 bg-zinc-950 hover:bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-white rounded-xl text-[10px] font-black uppercase tracking-wider transition-all flex items-center justify-center gap-2 font-mono"
                  >
                    <RotateCcw size={12} className="text-zinc-500" /> Factory Reset
                  </button>
                </div>
              </div>

              {/* Right Column: Step Form Editor */}
              <div className="flex-1 p-6 overflow-y-auto custom-scrollbar space-y-5 bg-zinc-950/20">
                <span className="text-[9.5px] font-black uppercase text-zinc-500 tracking-wider font-mono block">
                  Stage #{selectedEditIndex + 1} Customizer Panel
                </span>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-[9px] font-black text-zinc-550 uppercase tracking-widest font-mono block mb-1.5">Stage Title</label>
                    <input
                      type="text"
                      value={steps[selectedEditIndex]?.title || ''}
                      onChange={(e) => {
                        const updated = [...steps];
                        updated[selectedEditIndex].title = e.target.value;
                        setSteps(updated);
                      }}
                      className="w-full bg-zinc-950 border border-zinc-850 focus:border-red-500 rounded-xl p-3 text-xs text-white placeholder-zinc-700 font-mono outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-[9px] font-black text-zinc-550 uppercase tracking-widest font-mono block mb-1.5">Ribbon Badge</label>
                    <input
                      type="text"
                      value={steps[selectedEditIndex]?.badge || ''}
                      onChange={(e) => {
                        const updated = [...steps];
                        updated[selectedEditIndex].badge = e.target.value;
                        setSteps(updated);
                      }}
                      className="w-full bg-zinc-950 border border-zinc-850 focus:border-red-500 rounded-xl p-3 text-xs text-white placeholder-zinc-700 font-mono outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="text-[9px] font-black text-zinc-550 uppercase tracking-widest font-mono block mb-1.5">Workspace Target</label>
                    <select
                      value={steps[selectedEditIndex]?.tool || ToolType.IDEAS}
                      onChange={(e) => {
                        const updated = [...steps];
                        updated[selectedEditIndex].tool = e.target.value as ToolType;
                        setSteps(updated);
                      }}
                      className="w-full bg-zinc-950 border border-zinc-850 focus:border-red-500 rounded-xl p-3 text-xs text-white font-mono outline-none cursor-pointer"
                    >
                      <option value={ToolType.DASHBOARD}>Dashboard Command</option>
                      <option value={ToolType.IDEAS}>Viral Idea Lab</option>
                      <option value={ToolType.SCRIPT}>Script Writer Core</option>
                      <option value={ToolType.VIDEO}>Timeline Video Studio</option>
                      <option value={ToolType.SEO}>SEO Marketing Optimizer</option>
                      <option value={ToolType.AGENT_BUS}>Outbound AI Employee Bus</option>
                      <option value={ToolType.AUDIO}>Neural Narrator Core</option>
                      <option value={ToolType.PROJECTS}>Projects Hub</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-[9px] font-black text-zinc-550 uppercase tracking-widest font-mono block mb-1.5">Vector Icon Component</label>
                    <select
                      value={steps[selectedEditIndex]?.iconName || 'HelpCircle'}
                      onChange={(e) => {
                        const updated = [...steps];
                        updated[selectedEditIndex].iconName = e.target.value;
                        setSteps(updated);
                      }}
                      className="w-full bg-zinc-950 border border-zinc-850 focus:border-red-500 rounded-xl p-3 text-xs text-white font-mono outline-none cursor-pointer"
                    >
                      <option value="Lightbulb">Lightbulb</option>
                      <option value="FileText">FileText</option>
                      <option value="Video">Video</option>
                      <option value="LayoutDashboard">LayoutDashboard</option>
                      <option value="Sparkles">Sparkles</option>
                      <option value="Compass">Compass</option>
                      <option value="Users">Users</option>
                      <option value="CheckCircle2">CheckCircle2</option>
                      <option value="HelpCircle">HelpCircle</option>
                      <option value="TrendingUp">TrendingUp</option>
                      <option value="BarChart3">BarChart3</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-[9px] font-black text-zinc-550 uppercase tracking-widest font-mono block mb-1.5">Icon Visual Tint</label>
                    <select
                      value={steps[selectedEditIndex]?.iconColor || 'text-red-500'}
                      onChange={(e) => {
                        const updated = [...steps];
                        updated[selectedEditIndex].iconColor = e.target.value;
                        setSteps(updated);
                      }}
                      className="w-full bg-zinc-950 border border-zinc-850 focus:border-red-500 rounded-xl p-3 text-xs text-white font-mono outline-none cursor-pointer"
                    >
                      <option value="text-yellow-400">Yellow Tint</option>
                      <option value="text-blue-400">Blue Tint</option>
                      <option value="text-red-500">Crimson Tint</option>
                      <option value="text-purple-400">Purple Tint</option>
                      <option value="text-green-400">Emerald Tint</option>
                      <option value="text-orange-400">Amber Tint</option>
                      <option value="text-teal-400">Teal Tint</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="text-[9px] font-black text-zinc-550 uppercase tracking-widest font-mono block mb-1.5">Accent Color Track Gradient</label>
                  <select
                    value={steps[selectedEditIndex]?.accentColor || 'from-red-500 to-orange-600'}
                    onChange={(e) => {
                      const updated = [...steps];
                      updated[selectedEditIndex].accentColor = e.target.value;
                      setSteps(updated);
                    }}
                    className="w-full bg-zinc-950 border border-zinc-850 focus:border-red-500 rounded-xl p-3 text-xs text-white font-mono outline-none cursor-pointer"
                  >
                    <option value="from-yellow-500 to-amber-600">Golden Amber</option>
                    <option value="from-blue-500 to-indigo-600">Deep Indigo</option>
                    <option value="from-red-500 to-orange-600">Neon Crimson</option>
                    <option value="from-purple-500 to-fuchsia-600">Cyber Purple</option>
                    <option value="from-emerald-500 to-teal-600">Royal Emerald</option>
                  </select>
                </div>

                <div>
                  <label className="text-[9px] font-black text-zinc-550 uppercase tracking-widest font-mono block mb-1.5">Clinical Stage Description</label>
                  <textarea
                    value={steps[selectedEditIndex]?.description || ''}
                    onChange={(e) => {
                      const updated = [...steps];
                      updated[selectedEditIndex].description = e.target.value;
                      setSteps(updated);
                    }}
                    rows={3}
                    className="w-full bg-zinc-950 border border-zinc-850 focus:border-red-500 rounded-xl p-3 text-xs text-white placeholder-zinc-700 font-mono outline-none resize-none"
                    placeholder="Provide a detailed, professional description..."
                  />
                </div>

                <div>
                  <label className="text-[9px] font-black text-zinc-550 uppercase tracking-widest font-mono block mb-1.5">
                    Target Focus Elements (comma-separated list)
                  </label>
                  <input
                    type="text"
                    value={steps[selectedEditIndex]?.focusElements?.join(', ') || ''}
                    onChange={(e) => {
                      const updated = [...steps];
                      updated[selectedEditIndex].focusElements = e.target.value.split(',').map(s => s.trim()).filter(Boolean);
                      setSteps(updated);
                    }}
                    className="w-full bg-zinc-950 border border-zinc-850 focus:border-red-500 rounded-xl p-3 text-xs text-white placeholder-zinc-750 font-mono outline-none"
                    placeholder="e.g. Navigation tab bar, Analytical gauges, Target prompt"
                  />
                </div>

                <div>
                  <label className="text-[9px] font-black text-zinc-550 uppercase tracking-widest font-mono block mb-1.5">Aesthetic Tip or Recommendation</label>
                  <input
                    type="text"
                    value={steps[selectedEditIndex]?.tips || ''}
                    onChange={(e) => {
                      const updated = [...steps];
                      updated[selectedEditIndex].tips = e.target.value;
                      setSteps(updated);
                    }}
                    className="w-full bg-zinc-950 border border-zinc-850 focus:border-red-500 rounded-xl p-3 text-xs text-white placeholder-zinc-700 font-mono outline-none"
                    placeholder="🏆 Pro tip: Write dynamic hints here..."
                  />
                </div>
              </div>
            </div>

            {/* Save bar */}
            <div className="p-6 border-t border-zinc-850 flex justify-between items-center bg-zinc-950">
              <button
                onClick={() => setIsAdminEditing(false)}
                className="py-3 px-5 bg-transparent border border-zinc-800 hover:bg-zinc-900 text-zinc-400 hover:text-white rounded-xl text-xs font-black uppercase tracking-wider transition-all"
              >
                Discard & Close
              </button>
              <button
                onClick={handleSaveCustomSteps}
                className="py-3 px-6 bg-red-600 hover:bg-red-500 text-white rounded-xl text-xs font-black uppercase tracking-wider shadow-lg shadow-red-600/10 flex items-center gap-2 transition-all"
              >
                <Save size={13} /> Save & Deploy Tour
              </button>
            </div>
          </motion.div>
        ) : (
          /* REGULAR ONBOARDING TOUR GRAPHICAL INTERFACE */
          <motion.div
            key="onboarding"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="w-full max-w-xl shadow-2xl relative"
          >
            {/* WELCOME TOUR PAGE */}
            {currentStepIndex === -1 && (
              <div className="bg-[#0f0f12] border border-zinc-800 rounded-[2.5rem] p-8 relative overflow-hidden shadow-2xl glass-morphism select-none flex flex-col items-center text-center space-y-6">
                <div className="absolute top-0 inset-x-0 h-[3px] bg-gradient-to-r from-red-600 via-orange-500 to-indigo-600" />
                
                <button
                  onClick={onClose}
                  className="absolute top-6 right-6 text-zinc-500 hover:text-white transition-colors p-2 hover:bg-zinc-850 rounded-xl"
                >
                  <X size={16} />
                </button>

                <div className="w-16 h-16 bg-red-500/10 border border-red-500/20 rounded-2xl flex items-center justify-center text-red-500 shadow-lg shadow-red-500/5">
                  <Compass size={32} className="animate-spin-slow text-red-500" />
                </div>

                <div className="space-y-2">
                  <h2 className="text-3xl font-black text-white tracking-tighter">
                    GETTING STARTED
                  </h2>
                  <div className="flex items-center justify-center gap-1.5 text-[9px] font-black tracking-[0.3em] uppercase text-zinc-500">
                    <Sparkles size={10} className="text-red-500 animate-pulse" />
                    Your Creative Command Cockpit
                  </div>
                </div>

                <p className="text-sm font-semibold text-zinc-400 leading-relaxed">
                  Welcome to Ranktica AI, the absolute autonomous hub for creators, researchers, and producers. Let's take a quick walkthrough journey together through our core workspaces to kickstart your creative velocity!
                </p>

                <div className="w-full bg-zinc-950 p-4 border border-zinc-850 rounded-2xl text-left flex gap-3.5 items-start">
                  <HelpCircle size={18} className="text-red-400 shrink-0 mt-0.5" />
                  <div className="space-y-1">
                    <span className="text-[10px] uppercase tracking-wider font-black text-zinc-300">Guided Interactive Experience</span>
                    <p className="text-[11px] font-semibold text-zinc-500 leading-relaxed">During this tour, the dashboard will automatically navigate between tabs to give you a live feel of each dedicated workplace.</p>
                  </div>
                </div>

                {/* Optional Admin tour customize trigger */}
                {isAdmin && (
                  <div className="w-full border border-dashed border-zinc-800 p-3 rounded-2xl flex items-center justify-between bg-zinc-950/20">
                    <span className="text-[10px] font-mono font-black uppercase text-zinc-500 tracking-wider">
                      Admin: Customize Onboarding Walkthrough
                    </span>
                    <button
                      onClick={() => {
                        setSelectedEditIndex(0);
                        setIsAdminEditing(true);
                      }}
                      className="py-1.5 px-3 bg-zinc-900 hover:bg-zinc-850 border border-zinc-800 text-zinc-300 hover:text-white rounded-xl text-[9px] font-black uppercase tracking-wider flex items-center gap-1 transition-all"
                    >
                      <Settings size={10} className="text-red-500" /> Customize Tour
                    </button>
                  </div>
                )}

                <div className="flex w-full gap-3 pt-4">
                  <button
                    onClick={onClose}
                    className="flex-1 py-3.5 bg-zinc-950 hover:bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-white transition-all text-xs font-black uppercase tracking-wider rounded-2xl"
                  >
                    Skip Tour
                  </button>
                  <button
                    onClick={handleNext}
                    className="flex-1 py-3.5 bg-red-600 hover:bg-red-500 text-white transition-all text-xs font-black uppercase tracking-wider rounded-2xl flex items-center justify-center gap-2 shadow-lg shadow-red-600/15 group hover:scale-[1.02] active:scale-95"
                  >
                    Start Journey <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
                  </button>
                </div>
              </div>
            )}

            {/* INTERACTIVE TOUR STEPS */}
            {activeStep && (
              <div className="bg-[#0f0f12] border border-zinc-800 rounded-[2.5rem] p-8 relative overflow-hidden shadow-2xl glass-morphism select-none">
                <div className={`absolute top-0 inset-x-0 h-[3px] bg-gradient-to-r ${activeStep.accentColor}`} />

                <button
                  onClick={onClose}
                  className="absolute top-6 right-6 text-zinc-500 hover:text-white transition-colors p-2 hover:bg-zinc-850 rounded-xl"
                >
                  <X size={16} />
                </button>

                {/* Stepper Progress Indicator */}
                <div className="flex items-center gap-1.5 mb-6 text-zinc-500">
                  {steps.map((_, idx) => (
                    <div 
                      key={idx} 
                      className={`h-1 rounded-full transition-all duration-300 ${idx === currentStepIndex ? 'w-8 bg-red-600' : idx < currentStepIndex ? 'w-3 bg-zinc-700' : 'w-1.5 bg-zinc-850'}`} 
                    />
                  ))}
                  <span className="text-[9px] font-black uppercase tracking-widest text-zinc-650 ml-2">
                    Module {currentStepIndex + 1} of {steps.length}
                  </span>
                </div>

                {/* Step Content */}
                <div className="flex gap-4 items-start pb-5">
                  <div className="p-4 bg-zinc-900/40 border border-zinc-850 rounded-2xl shrink-0">
                    {renderStepIcon(activeStep.iconName, activeStep.iconColor || 'text-red-500')}
                  </div>
                  <div className="space-y-1">
                    <span className="text-[9.5px] font-black tracking-widest uppercase text-red-400 leading-none">
                      {activeStep.badge || 'Walkthrough Stage'}
                    </span>
                    <h3 className="text-2xl font-black text-white leading-tight">
                      {activeStep.title}
                    </h3>
                  </div>
                </div>

                <div className="space-y-6">
                  <p className="text-xs font-semibold text-zinc-400 leading-relaxed text-justify">
                    {activeStep.description}
                  </p>

                  {activeStep.focusElements && activeStep.focusElements.length > 0 && (
                    <div className="space-y-2">
                      <span className="text-[9px] font-black uppercase text-zinc-500 tracking-wider">Key Elements to Explore:</span>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                        {activeStep.focusElements.map((el, i) => (
                          <div key={i} className="bg-zinc-950 p-2.5 rounded-xl border border-zinc-855 text-[10px] font-bold text-zinc-300 flex items-center gap-2">
                            <CheckCircle2 size={12} className="text-red-500 shrink-0" />
                            <span className="leading-tight">{el}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {activeStep.tips && (
                    <div className="p-4 border border-zinc-800 bg-zinc-950/40 rounded-2xl text-[10.5px] font-bold italic text-zinc-400 bg-zinc-950 flex items-start gap-2.5">
                      <span className="shrink-0 text-red-500">🏆</span>
                      <span>{activeStep.tips}</span>
                    </div>
                  )}
                </div>

                {/* Bottom navigation controls */}
                <div className="flex justify-between items-center pt-8 mt-6 border-t border-zinc-800/40">
                  <button
                    onClick={handleBack}
                    disabled={currentStepIndex === 0}
                    className="py-2.5 px-4 bg-transparent text-zinc-550 hover:text-white hover:bg-zinc-900 text-xs font-black uppercase tracking-wider rounded-xl transition-all flex items-center gap-1.5 disabled:opacity-0 disabled:pointer-events-none"
                  >
                    <ArrowLeft size={13} /> Back
                  </button>

                  <div className="flex gap-2">
                    <button
                      onClick={onClose}
                      className="py-2.5 px-4 bg-transparent text-zinc-500 hover:text-white text-xs font-black uppercase tracking-wider rounded-xl transition-colors font-semibold"
                    >
                      Skip
                    </button>
                    <button
                      onClick={handleNext}
                      className="py-2.5 px-6 bg-red-650 bg-red-600 hover:bg-red-550 text-white text-xs font-black uppercase tracking-wider rounded-xl transition-all flex items-center gap-2 shadow-lg hover:scale-105 active:scale-95 duration-200"
                    >
                      {currentStepIndex === steps.length - 1 ? 'Finish Tour' : 'Next Step'} <ArrowRight size={13} />
                    </button>
                  </div>
                </div>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
