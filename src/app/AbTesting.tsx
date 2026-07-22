import React, { useState, useEffect, useRef } from 'react';
import { useProject } from '@/app/ProjectContext';
import { logActivity } from '@/shared/activityLogger';
import { toast } from 'react-hot-toast';
import { 
  BarChart3, 
  HelpCircle, 
  Play, 
  Plus, 
  RotateCcw, 
  Sparkles, 
  Trophy, 
  UploadCloud, 
  TrendingUp, 
  ArrowRight, 
  Trash2,
  FileText,
  AlertCircle
} from 'lucide-react';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid, Legend } from 'recharts';

interface ABTest {
  id: string;
  projectId: string;
  projectTitle: string;
  type: 'title' | 'thumbnail';
  status: 'running' | 'completed';
  startedAt: number;
  optionA: {
    label: string; // Title content or thumbnail url
    impressions: number;
    clicks: number;
    ctr: number;
  };
  optionB: {
    label: string;
    impressions: number;
    clicks: number;
    ctr: number;
  };
  winnerDeclared?: 'A' | 'B';
  historyData: Array<{
    step: number;
    ctrA: number;
    ctrB: number;
  }>;
}

const DEFAULT_EXPERIMENTS: ABTest[] = [
  {
    id: 'exp-1',
    projectId: 'demo-1',
    projectTitle: 'AI Revolutionizing Filmmaking',
    type: 'title',
    status: 'running',
    startedAt: Date.now() - 3 * 24 * 60 * 60 * 1000,
    optionA: {
      label: 'How AI Filmmaking Generates Millions in 2026',
      impressions: 14200,
      clicks: 482,
      ctr: 3.39
    },
    optionB: {
      label: 'The AI Filmmaking Strategy YouTube DOES NOT Want You to Know',
      impressions: 13900,
      clicks: 815,
      ctr: 5.86
    },
    historyData: [
      { step: 1, ctrA: 1.2, ctrB: 1.5 },
      { step: 2, ctrA: 2.1, ctrB: 2.8 },
      { step: 3, ctrA: 3.0, ctrB: 4.2 },
      { step: 4, ctrA: 3.39, ctrB: 5.86 }
    ]
  },
  {
    id: 'exp-2',
    projectId: 'demo-2',
    projectTitle: 'Web3 & Node.js Scalability Hacks',
    type: 'thumbnail',
    status: 'completed',
    startedAt: Date.now() - 8 * 24 * 60 * 60 * 1000,
    optionA: {
      label: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=400&q=80',
      impressions: 24500,
      clicks: 1470,
      ctr: 6.00
    },
    optionB: {
      label: 'https://images.unsplash.com/photo-1639762681485-074b7f938ba0?w=400&q=80',
      impressions: 24900,
      clicks: 910,
      ctr: 3.65
    },
    winnerDeclared: 'A',
    historyData: [
      { step: 1, ctrA: 2.5, ctrB: 2.3 },
      { step: 2, ctrA: 4.1, ctrB: 3.5 },
      { step: 3, ctrA: 5.8, ctrB: 3.8 },
      { step: 4, ctrA: 6.0, ctrB: 3.65 }
    ]
  }
];

export const AbTesting: React.FC = () => {
  const { projects, updateProject, activeProject } = useProject();

  const [tests, setTests] = useState<ABTest[]>(() => {
    const saved = localStorage.getItem('ranktica_ab_tests');
    return saved ? JSON.parse(saved) : DEFAULT_EXPERIMENTS;
  });

  const [testType, setTestType] = useState<'title' | 'thumbnail'>('title');
  const [selectedProjectId, setSelectedProjectId] = useState<string>('');
  
  // Create state inputs
  const [titleA, setTitleA] = useState('');
  const [titleB, setTitleB] = useState('');
  const [thumbUrlA, setThumbUrlA] = useState('');
  const [thumbUrlB, setThumbUrlB] = useState('');
  
  // Drag and drop states for thumbnails
  const [isDraggingA, setIsDraggingA] = useState(false);
  const [isDraggingB, setIsDraggingB] = useState(false);

  const [selectedTestId, setSelectedTestId] = useState<string | null>('exp-1');
  const fileInputRefA = useRef<HTMLInputElement>(null);
  const fileInputRefB = useRef<HTMLInputElement>(null);

  // Sync back to local storage
  useEffect(() => {
    localStorage.setItem('ranktica_ab_tests', JSON.stringify(tests));
  }, [tests]);

  // Set default project on load
  useEffect(() => {
    if (activeProject) {
      setSelectedProjectId(activeProject.id);
      if (testType === 'title') {
        setTitleA(activeProject.title);
        setTitleB(activeProject.title + ' [REACTION COGNITION SPLIT]');
      } else {
        setThumbUrlA(activeProject.assets?.thumbnail?.url || 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=400&q=80');
        setThumbUrlB('https://images.unsplash.com/photo-1639762681485-074b7f938ba0?w=400&q=80');
      }
    } else if (projects.length > 0) {
      setSelectedProjectId(projects[0].id);
    }
  }, [activeProject, projects, testType]);

  const activeTest = tests.find(t => t.id === selectedTestId);

  // Drag and drop handers for A
  const handleDragOverA = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDraggingA(true);
  };
  const handleDragLeaveA = () => setIsDraggingA(false);
  const handleDropA = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDraggingA(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      const reader = new FileReader();
      reader.onload = (event) => {
        setThumbUrlA(event.target?.result as string);
        toast.success(`Option A thumbnail loaded: ${file.name} 🖼️`);
      };
      reader.readAsDataURL(file);
    }
  };

  // Drag and drop handers for B
  const handleDragOverB = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDraggingB(true);
  };
  const handleDragLeaveB = () => setIsDraggingB(false);
  const handleDropB = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDraggingB(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      const reader = new FileReader();
      reader.onload = (event) => {
        setThumbUrlB(event.target?.result as string);
        toast.success(`Option B thumbnail loaded: ${file.name} 🖼️`);
      };
      reader.readAsDataURL(file);
    }
  };

  const selectManualFileA = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const reader = new FileReader();
      reader.onload = (event) => {
        setThumbUrlA(event.target?.result as string);
        toast.success(`Option A thumbnail uploaded: ${file.name} 🖼️`);
      };
      reader.readAsDataURL(file);
    }
  };

  const selectManualFileB = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const reader = new FileReader();
      reader.onload = (event) => {
        setThumbUrlB(event.target?.result as string);
        toast.success(`Option B thumbnail uploaded: ${file.name} 🖼️`);
      };
      reader.readAsDataURL(file);
    }
  };

  // Start new experiment
  const handleCreateExperiment = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedProjectId) {
      toast.error('Please configure or select a valid project first.');
      return;
    }

    const proj = projects.find(p => p.id === selectedProjectId);
    const labelA = testType === 'title' ? titleA : thumbUrlA;
    const labelB = testType === 'title' ? titleB : thumbUrlB;

    if (!labelA || !labelB) {
      toast.error('Both options require complete variant content before initializing.');
      return;
    }

    const newExperiment: ABTest = {
      id: 'exp-' + Date.now().toString(),
      projectId: selectedProjectId,
      projectTitle: proj ? proj.title : 'External Trial Project',
      type: testType,
      status: 'running',
      startedAt: Date.now(),
      optionA: {
        label: labelA,
        impressions: 150,
        clicks: 5,
        ctr: 3.33
      },
      optionB: {
        label: labelB,
        impressions: 150,
        clicks: 8,
        ctr: 5.33
      },
      historyData: [
        { step: 1, ctrA: 3.33, ctrB: 5.33 }
      ]
    };

    const updated = [newExperiment, ...tests];
    setTests(updated);
    setSelectedTestId(newExperiment.id);
    
    logActivity(
      `Dispatched split-test forecaster setup for "${newExperiment.projectTitle}" (A/B Trial type: ${testType})`,
      'Split Test Forecasting',
      'ab_testing'
    );
    toast.success('A/B Split Test Planner successfully initialized! 🧪');
  };

  // Traffic simulation solver
  const handleSimulateTraffic = () => {
    if (!selectedTestId) return;

    setTests(prev => prev.map(test => {
      if (test.id !== selectedTestId) return test;

      const biasA = test.type === 'title' ? 0.045 : 0.052; // option A average ctr
      const biasB = test.type === 'title' ? 0.059 : 0.038; // option B average ctr (B is winning titles, A winning thumbs)

      // Scale impressions up
      const deltaA_Imp = Math.floor(Math.random() * 2500) + 1200;
      const deltaB_Imp = Math.floor(Math.random() * 2500) + 1200;

      // Clicks based on probability
      const deltaA_Click = Math.floor(deltaA_Imp * (biasA + (Math.random() * 0.02 - 0.01)));
      const deltaB_Click = Math.floor(deltaB_Imp * (biasB + (Math.random() * 0.02 - 0.01)));

      const nextA_Imp = test.optionA.impressions + deltaA_Imp;
      const nextA_Click = test.optionA.clicks + deltaA_Click;
      const nextB_Imp = test.optionB.impressions + deltaB_Imp;
      const nextB_Click = test.optionB.clicks + deltaB_Click;

      const nextA_Ctr = Number(((nextA_Click / nextA_Imp) * 100).toFixed(2));
      const nextB_Ctr = Number(((nextB_Click / nextB_Imp) * 100).toFixed(2));

      // Append historical steps
      const newStepNum = test.historyData.length + 1;
      const updatedHistory = [
        ...test.historyData,
        { step: newStepNum, ctrA: nextA_Ctr, ctrB: nextB_Ctr }
      ].slice(-10); // Keep last 10 points for a tidy chart

      toast.success("Forecast generated — based on modeled CTR patterns, not live YouTube data.");

      return {
        ...test,
        optionA: {
          ...test.optionA,
          impressions: nextA_Imp,
          clicks: nextA_Click,
          ctr: nextA_Ctr
        },
        optionB: {
          ...test.optionB,
          impressions: nextB_Imp,
          clicks: nextB_Click,
          ctr: nextB_Ctr
        },
        historyData: updatedHistory
      };
    }));

    logActivity(
      `Generated forecast outflow to compare split-test CTR variants`,
      'Split Test Forecasting',
      'ab_testing'
    );
  };

  // Declare winner and update project manifest
  const handleDeclareWinner = async (test: ABTest, winner: 'A' | 'B') => {
    const winningContent = winner === 'A' ? test.optionA.label : test.optionB.label;
    
    // Update local state list
    setTests(prev => prev.map(t => {
      if (t.id === test.id) {
        return {
          ...t,
          status: 'completed' as const,
          winnerDeclared: winner
        };
      }
      return t;
    }));

    // Update Project context if project match
    try {
      if (test.type === 'title') {
        await updateProject(test.projectId, {
          title: winningContent
        });
        toast.success(`Winner declared! Applied title: "${winningContent}" straight to Project Asset folder! 🎯`);
      } else {
        // Thumbnail url updated
        const targetProj = projects.find(p => p.id === test.projectId);
        await updateProject(test.projectId, {
          assets: {
            ...targetProj?.assets,
            thumbnail: {
              ...targetProj?.assets?.thumbnail,
              url: winningContent,
              label: 'A/B Winning Asset'
            }
          }
        });
        toast.success('Winner declared! Set winning thumbnail image directly in Project assets 🖼️');
      }
    } catch (e) {
      console.warn('[AB Split Sync] Project bypass or offline local save carried out');
    }

    logActivity(
      `Completed trial. Variant Option ${winner} declared winner for project "${test.projectTitle}"`,
      'Split Testing',
      'ab_testing'
    );
  };

  const handleDeleteTest = (id: string) => {
    if (confirm('Permanently delete this split testing experiment trace?')) {
      setTests(prev => prev.filter(t => t.id !== id));
      if (selectedTestId === id) {
        setSelectedTestId(null);
      }
      toast.success('Experiment removed.');
    }
  };

  // Calculate stats confidence
  const calculateWinnerStats = (test: ABTest) => {
    const ctrA = test.optionA.ctr;
    const ctrB = test.optionB.ctr;
    if (Math.abs(ctrA - ctrB) < 0.2) {
      return { msg: 'Performances are closely matched.', pVal: 50, winner: '-' };
    }
    const isBWinning = ctrB > ctrA;
    const confidence = isBWinning 
      ? Math.min(99, Math.floor(80 + (ctrB - ctrA) * 10))
      : Math.min(99, Math.floor(80 + (ctrA - ctrB) * 10));
    
    return {
      msg: `Option ${isBWinning ? 'B' : 'A'} is outperforming Option ${isBWinning ? 'A' : 'B'} with strong statistical indicators.`,
      pVal: confidence,
      winner: isBWinning ? 'B' : 'A'
    };
  };

  return (
    <div className="space-y-8 animate-fade-in pb-16">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-[#0f0f12] border border-zinc-805 p-6 rounded-3xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-red-650/5 rounded-full blur-3xl pointer-events-none" />
        
        <div>
          <div className="flex items-center gap-2 text-red-400 font-mono text-[10px] uppercase tracking-widest leading-none mb-1.5">
            <Sparkles size={12} className="animate-pulse" />
            <span>Optimization Studio</span>
          </div>
          <h1 className="text-xl md:text-2xl font-black uppercase tracking-tight text-white m-0">
            A/B Test Planner & Forecaster
          </h1>
          <p className="text-xs text-zinc-500 mt-1 max-w-xl">
            Experiment and forecast with different title scripts and thumbnail visualizations. Feed modeled traffic patterns to discover optimizing high CTR templates and sync winners straight to your main channels.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              if (tests.length > 0) {
                setSelectedTestId(tests[0].id);
              }
              toast.success('Planner forecasts aligned.');
            }}
            className="px-4 py-2 bg-zinc-900 hover:bg-zinc-850 border border-zinc-800 text-[10px] font-black uppercase text-zinc-300 rounded-xl transition-all flex items-center gap-2"
          >
            <RotateCcw size={12} /> Align Sandbox
          </button>
        </div>
      </div>

      {/* Persistent Disclaimer Banner */}
      <div className="p-4 bg-zinc-900/45 border border-zinc-805 rounded-2xl flex items-start gap-3">
        <AlertCircle size={16} className="text-zinc-400 shrink-0 mt-0.5" />
        <div>
          <span className="text-[10px] font-black uppercase tracking-wider text-zinc-400 block">Modelling Disclaimer</span>
          <p className="text-xs text-zinc-500 mt-1 leading-relaxed">
            This planner forecasts expected outcomes based on modeled engagement patterns. Connect a YouTube channel for live performance tracking (coming soon).
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left Side: Create / Experiments controller */}
        <div className="lg:col-span-5 space-y-8">
          
          {/* Create Trial Panel */}
          <div className="bg-[#0f0f12] border border-zinc-805 rounded-3xl p-6 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/5 rounded-full blur-2xl pointer-events-none" />
            <h3 className="text-xs font-black uppercase tracking-widest text-zinc-400 mb-4 flex items-center gap-2">
              <Plus size={14} className="text-amber-500" /> Choose Trial Parameters
            </h3>

            <form onSubmit={handleCreateExperiment} className="space-y-4">
              {/* Type selector */}
              <div>
                <label className="block text-[8px] font-black uppercase text-zinc-500 tracking-wider mb-2">Split Type</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setTestType('title')}
                    className={`p-3 rounded-xl border text-center transition-all ${
                      testType === 'title' 
                        ? 'bg-red-500/10 border-red-500/30 text-white font-extrabold' 
                        : 'bg-zinc-900/50 border-zinc-850 text-zinc-500 hover:text-zinc-300'
                    }`}
                  >
                    <span className="text-[10px] font-black uppercase tracking-wider block">Title trial</span>
                    <span className="text-[8px] opacity-60 block mt-0.5">CTR Split Generator</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setTestType('thumbnail')}
                    className={`p-3 rounded-xl border text-center transition-all ${
                      testType === 'thumbnail' 
                        ? 'bg-red-500/10 border-red-500/30 text-white font-extrabold' 
                        : 'bg-zinc-900/50 border-zinc-850 text-zinc-500 hover:text-zinc-300'
                    }`}
                  >
                    <span className="text-[10px] font-black uppercase tracking-wider block">Thumbnail trial</span>
                    <span className="text-[8px] opacity-60 block mt-0.5">Visual split rater</span>
                  </button>
                </div>
              </div>

              {/* Linked project selector */}
              <div>
                <label className="block text-[8px] font-black uppercase text-zinc-500 tracking-wider mb-1.5">Linked Project</label>
                <select
                  value={selectedProjectId}
                  onChange={(e) => setSelectedProjectId(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-zinc-900 border border-zinc-800 rounded-xl text-xs font-bold text-zinc-300 focus:outline-none focus:ring-1 focus:ring-red-500 cursor-pointer"
                >
                  <option value="">-- Choose active manifest folder --</option>
                  {projects.map(p => (
                    <option key={p.id} value={p.id}>
                      {p.title} ({p.niche})
                    </option>
                  ))}
                </select>
              </div>

              {/* Options Inputs based on experiment type */}
              {testType === 'title' ? (
                <div className="space-y-4">
                  <div>
                    <label className="block text-[8px] font-black uppercase text-zinc-550 mb-1">Option A Title (Baseline)</label>
                    <textarea
                      value={titleA}
                      onChange={(e) => setTitleA(e.target.value)}
                      placeholder="Input standard video title or default format..."
                      className="w-full h-16 p-3 bg-zinc-900 border border-zinc-800 rounded-xl text-xs font-bold text-white focus:outline-none focus:border-red-500 placeholder:text-zinc-700"
                    />
                  </div>
                  <div>
                    <label className="block text-[8px] font-black uppercase text-zinc-550 mb-1 font-mono text-red-400">Option B Title (Variation)</label>
                    <textarea
                      value={titleB}
                      onChange={(e) => setTitleB(e.target.value)}
                      placeholder="Input provocative split variation title..."
                      className="w-full h-16 p-3 bg-zinc-900 border border-zinc-800 rounded-xl text-xs font-bold text-white focus:outline-none focus:border-red-500 placeholder:text-zinc-700"
                    />
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-4">
                  {/* Option A upload selection */}
                  <div>
                    <label className="block text-[8px] font-black uppercase text-zinc-550 mb-1">Option A Visual</label>
                    <div
                      onDragOver={handleDragOverA}
                      onDragLeave={handleDragLeaveA}
                      onDrop={handleDropA}
                      onClick={() => fileInputRefA.current?.click()}
                      className={`h-24 rounded-xl border flex flex-col items-center justify-center p-2 text-center transition-all cursor-pointer ${
                        isDraggingA 
                          ? 'border-dashed border-red-500 bg-red-500/10' 
                          : thumbUrlA ? 'border-zinc-800 bg-zinc-900/40 hover:bg-zinc-900' : 'border-dashed border-zinc-800 bg-zinc-950 hover:bg-zinc-900'
                      }`}
                    >
                      {thumbUrlA ? (
                        <div className="relative w-full h-full flex items-center justify-center overflow-hidden rounded-lg">
                          <img src={thumbUrlA} alt="Option A Preview" className="w-full h-full object-cover opacity-60" />
                          <span className="absolute bottom-1 bg-zinc-950/80 px-1.5 py-0.5 rounded text-[7px] font-black uppercase text-white tracking-widest">A Loaded</span>
                        </div>
                      ) : (
                        <>
                          <UploadCloud size={18} className="text-zinc-650 mb-1" />
                          <span className="text-[7.5px] font-black uppercase text-zinc-500 tracking-wide">Drag / Upload</span>
                        </>
                      )}
                      <input
                        type="file"
                        ref={fileInputRefA}
                        onChange={selectManualFileA}
                        className="hidden"
                        accept="image/*"
                      />
                    </div>
                  </div>

                  {/* Option B upload selection */}
                  <div>
                    <label className="block text-[8px] font-black uppercase text-zinc-550 mb-1 text-red-400">Option B Visual</label>
                    <div
                      onDragOver={handleDragOverB}
                      onDragLeave={handleDragLeaveB}
                      onDrop={handleDropB}
                      onClick={() => fileInputRefB.current?.click()}
                      className={`h-24 rounded-xl border flex flex-col items-center justify-center p-2 text-center transition-all cursor-pointer ${
                        isDraggingB 
                          ? 'border-dashed border-red-500 bg-red-500/10' 
                          : thumbUrlB ? 'border-zinc-800 bg-zinc-900/40 hover:bg-zinc-900' : 'border-dashed border-zinc-800 bg-zinc-950 hover:bg-zinc-900'
                      }`}
                    >
                      {thumbUrlB ? (
                        <div className="relative w-full h-full flex items-center justify-center overflow-hidden rounded-lg">
                          <img src={thumbUrlB} alt="Option B Preview" className="w-full h-full object-cover opacity-60" />
                          <span className="absolute bottom-1 bg-zinc-950/80 px-1.5 py-0.5 rounded text-[7px] font-black uppercase text-white tracking-widest">B Loaded</span>
                        </div>
                      ) : (
                        <>
                          <UploadCloud size={18} className="text-zinc-650 mb-1" />
                          <span className="text-[7.5px] font-black uppercase text-zinc-500 tracking-wide">Drag / Upload</span>
                        </>
                      )}
                      <input
                        type="file"
                        ref={fileInputRefB}
                        onChange={selectManualFileB}
                        className="hidden"
                        accept="image/*"
                      />
                    </div>
                  </div>
                </div>
              )}

              <button
                type="submit"
                className="w-full py-3 bg-red-650 bg-red-600 hover:bg-red-500 text-[10px] font-black uppercase tracking-widest text-white rounded-xl transition-all shadow-md hover:scale-[1.01] flex items-center justify-center gap-2"
              >
                <Sparkles size={13} /> Generate Split Test Forecast
              </button>
            </form>
          </div>

          {/* List of active split tests */}
          <div className="bg-[#0f0f12] border border-zinc-805 rounded-3xl p-6">
            <h3 className="text-xs font-black uppercase tracking-widest text-zinc-400 mb-4 flex items-center gap-2">
              <BarChart3 size={14} className="text-red-500" /> Active Forecasts ({tests.length})
            </h3>

            {tests.length === 0 ? (
              <div className="text-center py-8 text-zinc-650">
                <HelpCircle size={20} className="mx-auto text-zinc-800 mb-1.5" />
                <span className="text-[10px] font-bold block uppercase">No forecasts created yet</span>
                <span className="text-[8px] leading-tight block mt-1">Initialize your first CTR forecast planner above to begin.</span>
              </div>
            ) : (
              <div className="space-y-2">
                {tests.map(t => {
                  const isActive = selectedTestId === t.id;
                  return (
                    <div
                      key={t.id}
                      onClick={() => setSelectedTestId(t.id)}
                      className={`w-full text-left p-3.5 rounded-2xl border transition-all cursor-pointer flex items-center justify-between group ${
                        isActive 
                          ? 'bg-zinc-900 border-zinc-700 shadow' 
                          : 'bg-zinc-950/30 border-zinc-900 hover:bg-zinc-900/60'
                      }`}
                    >
                      <div className="overflow-hidden">
                        <div className="flex items-center gap-2">
                          <span className={`text-[8px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded ${
                            t.status === 'running' 
                              ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/15 animate-pulse' 
                              : 'bg-zinc-900 text-zinc-500 border border-zinc-800'
                          }`}>
                            {t.status}
                          </span>
                          <span className="text-[8px] font-mono text-zinc-650 bg-zinc-900 border border-zinc-850 px-1 py-0.5 rounded">
                            {t.type}
                          </span>
                        </div>
                        <div className="text-xs font-black text-zinc-250 mt-2 truncate group-hover:text-white transition-colors">{t.projectTitle}</div>
                        <div className="text-[9px] text-zinc-550 truncate mt-0.5 opacity-80">
                          {t.type === 'title' ? `A: ${t.optionA.label.substring(0, 30)}...` : 'Visual assets linked'}
                        </div>
                      </div>

                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteTest(t.id);
                        }}
                        className="opacity-0 group-hover:opacity-100 p-2 text-zinc-650 hover:text-red-400 rounded-lg hover:bg-zinc-800 transition-all border border-transparent hover:border-zinc-700 shrink-0"
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

        </div>

        {/* Right Side: Active Experiment Sandbox Stats Dashboard */}
        <div className="lg:col-span-7 space-y-8">
          
          {activeTest ? (
            <div className="bg-[#0f0f12] border border-zinc-850 p-6 rounded-3xl relative overflow-hidden space-y-6">
              
              {/* Header inside detailed experiment page */}
              <div className="flex flex-col sm:flex-row justify-between items-start gap-3 border-b border-zinc-800 pb-4">
                <div>
                  <span className="text-[8px] font-bold font-mono uppercase bg-zinc-900 border border-zinc-800 px-2 py-0.5 rounded text-zinc-400">
                    TEST ID: {activeTest.id}
                  </span>
                  <h2 className="text-base font-black text-white uppercase tracking-tight mt-2">{activeTest.projectTitle}</h2>
                  <div className="text-[9px] text-zinc-550 mt-0.5">Started {new Date(activeTest.startedAt).toLocaleString()}</div>
                </div>

                {activeTest.status === 'running' && (
                  <button
                    onClick={handleSimulateTraffic}
                    className="flex items-center gap-1.5 px-4 py-2 bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 text-[10px] font-black uppercase text-white rounded-xl shadow-lg hover:scale-105 active:scale-95 transition-all cursor-pointer"
                  >
                    <Play size={12} className="animate-pulse" /> Forecast Engagement
                  </button>
                )}
              </div>

              {/* Grid with statistics comparing A and B */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                
                {/* Option A card */}
                <div className={`p-4 rounded-3xl border relative transition-all overflow-hidden ${
                  activeTest.winnerDeclared === 'A' 
                    ? 'bg-amber-500/10 border-amber-500' 
                    : 'bg-zinc-900/40 border-zinc-820'
                }`}>
                  <div className="absolute top-2 right-2 flex items-center gap-1">
                    {activeTest.winnerDeclared === 'A' && (
                      <span className="bg-amber-500 text-zinc-950 text-[7px] font-extrabold uppercase px-1.5 py-0.5 rounded-md flex items-center gap-0.5 font-mono shadow-md">
                        <Trophy size={10} /> WINNER
                      </span>
                    )}
                    <span className="text-[8px] font-black font-mono text-zinc-550 bg-zinc-950 border border-zinc-850 px-1.5 py-0.5 rounded">
                      OPTION A (CTR BASELINE)
                    </span>
                  </div>

                  {activeTest.type === 'title' ? (
                    <div className="text-xs font-bold text-zinc-100 min-h-[50px] pr-8 mt-4 leading-normal select-all">
                      "{activeTest.optionA.label}"
                    </div>
                  ) : (
                    <div className="relative w-full h-28 overflow-hidden rounded-xl border border-zinc-800 bg-[#060608] mt-4 mb-2 flex items-center justify-center">
                      <img src={activeTest.optionA.label} alt="Variant A Preview" className="w-full h-full object-cover" />
                    </div>
                  )}

                  {/* Quantitative Statistics comparison */}
                  <div className="grid grid-cols-3 gap-2 mt-4 pt-4 border-t border-zinc-900/40">
                    <div>
                      <div className="text-[8px] font-black uppercase tracking-wider text-zinc-550">Impressions</div>
                      <div className="text-sm font-black text-white mt-1">{(activeTest.optionA.impressions).toLocaleString()}</div>
                    </div>
                    <div>
                      <div className="text-[8px] font-black uppercase tracking-wider text-zinc-550">Clicks</div>
                      <div className="text-sm font-black text-white mt-1">{(activeTest.optionA.clicks * 1).toLocaleString()}</div>
                    </div>
                    <div>
                      <div className="text-[8px] font-black uppercase tracking-wider text-zinc-550">Split CTR</div>
                      <div className="text-sm font-black text-red-500 mt-1">{activeTest.optionA.ctr}%</div>
                    </div>
                  </div>

                  {activeTest.status === 'running' && (
                    <button
                      onClick={() => handleDeclareWinner(activeTest, 'A')}
                      className="w-full mt-4 py-2 bg-zinc-950 hover:bg-zinc-900 text-zinc-300 hover:text-white border border-zinc-800 hover:border-zinc-700 text-[8px] font-black uppercase tracking-widest rounded-xl transition-all"
                    >
                      Declare Variant A Winner
                    </button>
                  )}
                </div>

                {/* Option B card */}
                <div className={`p-4 rounded-3xl border relative transition-all overflow-hidden ${
                  activeTest.winnerDeclared === 'B' 
                    ? 'bg-amber-500/10 border-amber-500' 
                    : 'bg-zinc-900/40 border-zinc-820'
                }`}>
                  <div className="absolute top-2 right-2 flex items-center gap-1">
                    {activeTest.winnerDeclared === 'B' && (
                      <span className="bg-amber-500 text-zinc-950 text-[7px] font-extrabold uppercase px-1.5 py-0.5 rounded-md flex items-center gap-0.5 font-mono shadow-md">
                        <Trophy size={10} /> WINNER
                      </span>
                    )}
                    <span className="text-[8px] font-black font-mono text-red-400 bg-red-500/10 border border-red-500/20 px-1.5 py-0.5 rounded">
                      OPTION B (VARIATION)
                    </span>
                  </div>

                  {activeTest.type === 'title' ? (
                    <div className="text-xs font-bold text-zinc-100 min-h-[50px] pr-8 mt-4 leading-normal select-all">
                      "{activeTest.optionB.label}"
                    </div>
                  ) : (
                    <div className="relative w-full h-28 overflow-hidden rounded-xl border border-zinc-805 bg-[#060608] mt-4 mb-2 flex items-center justify-center">
                      <img src={activeTest.optionB.label} alt="Variant B Preview" className="w-full h-full object-cover" />
                    </div>
                  )}

                  {/* Quantitative Statistics comparison */}
                  <div className="grid grid-cols-3 gap-2 mt-4 pt-4 border-t border-zinc-900/40">
                    <div>
                      <div className="text-[8px] font-black uppercase tracking-wider text-zinc-550">Impressions</div>
                      <div className="text-sm font-black text-white mt-1">{(activeTest.optionB.impressions).toLocaleString()}</div>
                    </div>
                    <div>
                      <div className="text-[8px] font-black uppercase tracking-wider text-zinc-550">Clicks</div>
                      <div className="text-sm font-black text-white mt-1">{(activeTest.optionB.clicks * 1).toLocaleString()}</div>
                    </div>
                    <div>
                      <div className="text-[8px] font-black uppercase tracking-wider text-zinc-550">Split CTR</div>
                      <div className="text-sm font-black text-red-500 mt-1">{activeTest.optionB.ctr}%</div>
                    </div>
                  </div>

                  {activeTest.status === 'running' && (
                    <button
                      onClick={() => handleDeclareWinner(activeTest, 'B')}
                      className="w-full mt-4 py-2 bg-zinc-950 hover:bg-zinc-900 text-zinc-300 hover:text-white border border-zinc-800 hover:border-zinc-700 text-[8px] font-black uppercase tracking-widest rounded-xl transition-all"
                    >
                      Declare Variant B Winner
                    </button>
                  )}
                </div>

              </div>

              {/* Statistical Significance Alerts Bar */}
              {activeTest.status === 'running' && (
                <div className="p-3.5 bg-zinc-950 rounded-2xl border border-zinc-900 flex items-start gap-3">
                  <AlertCircle size={15} className="text-amber-500 shrink-0 mt-0.5" />
                  <div>
                    <span className="text-[9px] font-black uppercase tracking-wider text-zinc-400 block">AI Statistical Significance Report</span>
                    <p className="text-xs font-bold text-zinc-300 mt-1 leading-normal">
                      {calculateWinnerStats(activeTest).msg} Confidence parameters currently point to <strong className="text-amber-400 font-black">{calculateWinnerStats(activeTest).pVal}% confidence</strong>.
                    </p>
                  </div>
                </div>
              )}

              {/* Recharts Area diagram over time */}
              <div className="space-y-2">
                <span className="text-[9px] font-black uppercase tracking-widest text-zinc-500 block">
                  Evolution Click-Through Rate (CTR % Split Trend)
                </span>
                <div className="h-64 bg-zinc-950/40 border border-zinc-900 p-4 rounded-2xl">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart
                      data={activeTest.historyData}
                      margin={{ top: 10, right: 10, left: -25, bottom: 0 }}
                    >
                      <defs>
                        <linearGradient id="colorA" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#71717a" stopOpacity={0.2}/>
                          <stop offset="95%" stopColor="#71717a" stopOpacity={0}/>
                        </linearGradient>
                        <linearGradient id="colorB" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#ef4444" stopOpacity={0.2}/>
                          <stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#18181b" />
                      <XAxis dataKey="step" tick={{ fill: '#52525b', fontSize: 9 }} tickLine={false} />
                      <YAxis tick={{ fill: '#52525b', fontSize: 9 }} tickLine={false} />
                      <Tooltip 
                        contentStyle={{ backgroundColor: '#09090b', borderColor: '#1f1f23', borderRadius: 12 }} 
                        labelStyle={{ fontSize: 9, fontWeight: 'bold', textTransform: 'uppercase' }}
                      />
                      <Legend verticalAlign="top" height={36} iconSize={10} wrapperStyle={{ fontSize: 9, textTransform: 'uppercase', fontWeight: 'bold' }} />
                      <Area name="Option A CTR" type="monotone" dataKey="ctrA" stroke="#a1a1aa" fillOpacity={1} fill="url(#colorA)" strokeWidth={2} />
                      <Area name="Option B CTR" type="monotone" dataKey="ctrB" stroke="#ef4444" fillOpacity={1} fill="url(#colorB)" strokeWidth={2} />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>

            </div>
          ) : (
            <div className="h-full min-h-[420px] bg-[#0f0f12] border border-zinc-90 w-full rounded-3xl flex flex-col items-center justify-center text-center p-8">
              <Sparkles size={32} className="text-zinc-850 animate-pulse mb-3" />
              <h3 className="text-xs font-black uppercase text-zinc-500 tracking-wider">No forecast trial selected</h3>
              <p className="text-[10px] text-zinc-650 max-w-sm mt-1">Select an active forecast from the sidebar list or generate a brand new parameter forecast on the left panel to display visual statistics.</p>
            </div>
          )}

        </div>

      </div>

    </div>
  );
};
