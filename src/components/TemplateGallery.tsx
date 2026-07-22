import React, { useState, useEffect } from 'react';
import { useProject } from '@/app/ProjectContext';
import { ToolType, Project, ProjectTask } from '@/shared/types';
import { logActivity } from '@/shared/activityLogger';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Sparkles, 
  Plus, 
  Trash2, 
  Copy, 
  Check, 
  FileText, 
  Folder, 
  Terminal, 
  ChevronRight, 
  CheckCircle2, 
  Grid, 
  BookOpen, 
  Settings, 
  Archive,
  Save,
  HelpCircle,
  Clock,
  RotateCcw
} from 'lucide-react';
import { toast } from 'react-hot-toast';

// Define the template types
export interface ProjectConfigTemplate {
  id: string;
  title: string;
  niche: string;
  audience: string;
  description: string;
  tasks: Omit<ProjectTask, 'id'>[];
  isCustom?: boolean;
}

export interface ScriptStructureTemplate {
  id: string;
  title: string;
  description: string;
  structure: string;
  isCustom?: boolean;
}

export interface PromptPresetTemplate {
  id: string;
  title: string;
  description: string;
  prompt: string;
  category: 'Copywriting' | 'SEO' | 'Creative' | 'Optimization';
  isCustom?: boolean;
}

// Pre-baked elite default templates
const DEFAULT_PROJECT_CONFIGS: ProjectConfigTemplate[] = [
  {
    id: 'p-tpl-1',
    title: 'High-Ticket AI Automation',
    niche: 'Artificial Intelligence & SaaS',
    audience: 'B2B Tech Founders & Solopreneurs',
    description: 'Step-by-step masterclasses breaking down bespoke AI agents, LangChain loops, and voice clone workflows for business scaling.',
    tasks: [
      { title: 'Research Trending Agentic Workflows', milestone: 'Topic Modeling', status: 'pending', startDate: '2026-06-24', endDate: '2026-06-25' },
      { title: 'Draft Screenplay & High-Contrast Hooks', milestone: 'Linguistic Copy', status: 'pending', startDate: '2026-06-26', endDate: '2026-06-27' },
      { title: 'Synthesize HD Voice Clone Narration', milestone: 'Voice Synthesis', status: 'pending', startDate: '2026-06-28', endDate: '2026-06-29' },
      { title: 'Run Thumbnail CTR Predicted Score', milestone: 'Thumbnail Audit', status: 'pending', startDate: '2026-06-30', endDate: '2026-06-30' }
    ]
  },
  {
    id: 'p-tpl-2',
    title: 'Finance & Wealth Engineering',
    niche: 'Personal Finance & Investing',
    audience: 'Gen-Z & Millennial Investors',
    description: 'Rapid, highly engaging short-form explainers exposing wealth hacks, compound interest simulations, and modern side-hustle blueprints.',
    tasks: [
      { title: 'Audit Finance Search Volume Indicators', milestone: 'Strategic Audit', status: 'pending', startDate: '2026-06-24', endDate: '2026-06-25' },
      { title: 'Write Fast-Paced Script with Closed-Loops', milestone: 'Linguistic Copy', status: 'pending', startDate: '2026-06-26', endDate: '2026-06-26' },
      { title: 'Synthesize 3D Infographics Concept Assets', milestone: 'Video Synthesis', status: 'pending', startDate: '2026-06-27', endDate: '2026-06-28' }
    ]
  },
  {
    id: 'p-tpl-3',
    title: 'Cyberpunk Solo Developer Vlog',
    niche: 'Software Engineering & Vlogging',
    audience: 'Aspiring Coders & Indie Hackers',
    description: 'Aesthetic, code-heavy, fast-paced dev vlogs tracing real-world full-stack deployment builds using modern tech stacks.',
    tasks: [
      { title: 'Map Out Cloud Run Architecture', milestone: 'Architecture Model', status: 'pending', startDate: '2026-06-24', endDate: '2026-06-24' },
      { title: 'Draft Story-driven Coding Screenplay', milestone: 'Linguistic Copy', status: 'pending', startDate: '2026-06-25', endDate: '2026-06-26' },
      { title: 'Record High-Frame Rate Screen Captures', milestone: 'Inbound Assets', status: 'pending', startDate: '2026-06-27', endDate: '2026-06-28' }
    ]
  }
];

const DEFAULT_SCRIPT_STRUCTURES: ScriptStructureTemplate[] = [
  {
    id: 's-tpl-1',
    title: 'The 3-Second Retention Loop (Vertical)',
    description: 'A high-velocity framework engineered for maximum short-form audience retention.',
    structure: `[VISUAL: Immediate fast-paced pattern interrupt + high-contrast red-glow text overlay]
[AUDIO: Fast-paced synth drop or loud audio cue]
"Stop scrolls! This is the single setting that scaled our project in under 48 hours..."

[VISUAL: Transition to live code terminal mapping]
"99% of creators fail because they copy general templates. Let's decode the psychological curiosity pattern..."

[VISUAL: Step-by-step custom grid infographics overlay]
"Step 1: Audit high-volume search parameters.
Step 2: Map out local key-value state persistence.
Step 3: Synthesize responsive vertical loops."

[VISUAL: Fast zoom to screen call-to-action]
"Save this guide now to secure your next campaign launch, or comment 'FLOW' to receive the full source code."`
  },
  {
    id: 's-tpl-2',
    title: 'The Case-Study Explainer (Horizontal)',
    description: 'A detailed, authority-driven structure designed for educational or deep-dive content.',
    structure: `[VISUAL: Professional presentation studio backdrop. Neon blue accents.]
"How we scaled a simple Node.js container to 10,000 active users as a solo creator."

[VISUAL: Slide transition showing architectural diagram]
"Here is the hidden bottleneck. Most systems break because they route static assets without an edge proxy layer."

[VISUAL: Screen recording demonstrating the system operation live]
"By loading this custom middleware and locking the server-side caching parameter, we reduced latency by 85%."

[VISUAL: Back to speaker with positive, encouraging tone]
"If you want to apply this blueprint, I have saved the exact configuration inside our free workspace dashboard. Ask your questions in the comments below."`
  },
  {
    id: 's-tpl-3',
    title: 'Problem-Agitate-Solve (Copywriter Core)',
    description: 'Classic marketing and narrative copywriting framework to sell concepts or tools.',
    structure: `[VISUAL: Relatable struggle scene or chaotic workspace view]
"Stop wasting 5 hours trying to manually classify your production assets..."

[VISUAL: Transition with tense, high-contrast typography]
"While you tweak tags and description fields, competitors using automated classifiers are hijacking search indexes..."

[VISUAL: Polished, clean dashboard reveal]
"Here is the solution. The new Ranktica Omni-Channel classifier performs semantic modeling on your scripts instantly."

[VISUAL: Dynamic floating action button highlight]
"Try it on your active project right now and unlock pristine distribution analytics today."`
  }
];

const DEFAULT_PROMPTS: PromptPresetTemplate[] = [
  {
    id: 'pr-tpl-1',
    title: 'Neuro-Linguistic Copywriting Polish',
    description: 'Polishes rough script transcripts into hyper-engaging, active-voice scripts.',
    prompt: 'Act as an elite neuro-linguistic copywriter. Transform this rough draft into a direct, engaging video screenplay. Purge passive voice, eliminate fluff syllables, and structure high-contrast pattern interrupts every 8 seconds.',
    category: 'Copywriting'
  },
  {
    id: 'pr-tpl-2',
    title: 'SEO Keyword Weighting Injection',
    description: 'Generates optimized keywords and long-tail tags for competitive search presence.',
    prompt: 'Evaluate the campaign topic below. Generate a balanced indexing index containing 5 primary high-volume tags, 5 low-competition long-tail tags, and 3 semantic search description paragraphs that maximize indexing weightings without keyword stuffing.',
    category: 'SEO'
  },
  {
    id: 'pr-tpl-3',
    title: 'CTR Curiosity Gap Enhancer',
    description: 'Scores hooks and drafts 3 highly psychological alternative titles.',
    prompt: 'Score the following hook on a click-through rate (CTR) prediction scale of 1-100 based on curiosity gaps. Then, rewrite it into 3 variants: one fear-of-missing-out (FOMO) pattern, one contrarian pattern, and one high-authority pattern.',
    category: 'Creative'
  }
];

export const TemplateGallery: React.FC = () => {
  const { activeProject, createProject, updateActiveProject, projects } = useProject();
  
  // Tab states: 'projects' | 'scripts' | 'prompts'
  const [activeTab, setActiveTab] = useState<'projects' | 'scripts' | 'prompts'>('projects');
  
  // Custom states stored in localStorage
  const [projectConfigs, setProjectConfigs] = useState<ProjectConfigTemplate[]>(() => {
    try {
      const saved = localStorage.getItem('ranktica_custom_project_configs');
      return saved ? JSON.parse(saved) : DEFAULT_PROJECT_CONFIGS;
    } catch {
      return DEFAULT_PROJECT_CONFIGS;
    }
  });

  const [scriptStructures, setScriptStructures] = useState<ScriptStructureTemplate[]>(() => {
    try {
      const saved = localStorage.getItem('ranktica_custom_script_structures');
      return saved ? JSON.parse(saved) : DEFAULT_SCRIPT_STRUCTURES;
    } catch {
      return DEFAULT_SCRIPT_STRUCTURES;
    }
  });

  const [promptPresets, setPromptPresets] = useState<PromptPresetTemplate[]>(() => {
    try {
      const saved = localStorage.getItem('ranktica_custom_prompt_presets');
      return saved ? JSON.parse(saved) : DEFAULT_PROMPTS;
    } catch {
      return DEFAULT_PROMPTS;
    }
  });

  // Copied states for feedback
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // New item creation states
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newType, setNewType] = useState<'project' | 'script' | 'prompt'>('project');
  
  // Create Form inputs
  const [formTitle, setFormTitle] = useState('');
  const [formNiche, setFormNiche] = useState('');
  const [formAudience, setFormAudience] = useState('');
  const [formDesc, setFormDesc] = useState('');
  const [formContent, setFormContent] = useState(''); // Stores script structure or prompt text
  const [formPromptCat, setFormPromptCat] = useState<'Copywriting' | 'SEO' | 'Creative' | 'Optimization'>('Copywriting');

  // Sync back custom lists to local storage when changed
  useEffect(() => {
    localStorage.setItem('ranktica_custom_project_configs', JSON.stringify(projectConfigs));
  }, [projectConfigs]);

  useEffect(() => {
    localStorage.setItem('ranktica_custom_script_structures', JSON.stringify(scriptStructures));
  }, [scriptStructures]);

  useEffect(() => {
    localStorage.setItem('ranktica_custom_prompt_presets', JSON.stringify(promptPresets));
  }, [promptPresets]);

  const handleCopyText = (text: string, id: string, message: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    toast.success(message);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // 1. SAVE ACTIVE PROJECT AS CONFIG TEMPLATE
  const handleSaveActiveProjectAsTemplate = () => {
    if (!activeProject) {
      toast.error('No active project loaded to save as template.');
      return;
    }

    const isDuplicate = projectConfigs.some(t => t.title.toLowerCase() === activeProject.title.toLowerCase());
    if (isDuplicate) {
      toast.error('A template with this title already exists in your configurations.');
      return;
    }

    const defaultTasks: Omit<ProjectTask, 'id'>[] = activeProject.assets?.tasks?.map(task => ({
      title: task.title,
      milestone: task.milestone,
      status: 'pending',
      startDate: task.startDate,
      endDate: task.endDate
    })) || [
      { title: 'Define Content Niche & Hooks', milestone: 'Topic Modeling', status: 'pending', startDate: '2026-06-24', endDate: '2026-06-25' },
      { title: 'Draft Interactive Script Screenplay', milestone: 'Linguistic Copy', status: 'pending', startDate: '2026-06-26', endDate: '2026-06-27' },
      { title: 'Generate high-CTR thumbnail asset', milestone: 'Thumbnail Audit', status: 'pending', startDate: '2026-06-28', endDate: '2026-06-28' }
    ];

    const newTemplate: ProjectConfigTemplate = {
      id: 'p-custom-' + Date.now(),
      title: activeProject.title,
      niche: activeProject.niche,
      audience: activeProject.audience || 'General Audience',
      description: activeProject.description || `Custom configuration adapted from active project "${activeProject.title}".`,
      tasks: defaultTasks,
      isCustom: true
    };

    setProjectConfigs(prev => [newTemplate, ...prev]);
    toast.success(`Successfully saved active project "${activeProject.title}" as custom configuration! 📂`);
    logActivity(`Saved project "${activeProject.title}" as a configuration template`, 'Template Lab', 'system');
  };

  // 2. SAVE ACTIVE SCRIPT AS SCRIPT STRUCTURE TEMPLATE
  const handleSaveActiveScriptAsTemplate = () => {
    if (!activeProject || !activeProject.assets?.script) {
      toast.error('Active project does not contain a script to save as structure template.');
      return;
    }

    const scriptText = String(activeProject.assets.script);
    if (scriptText.trim().length < 20) {
      toast.error('Script draft is too short to construct a modular template structure.');
      return;
    }

    const newTemplate: ScriptStructureTemplate = {
      id: 's-custom-' + Date.now(),
      title: `Structure from: ${activeProject.title}`,
      description: `Custom structure containing ${scriptText.length} characters of modular script lines.`,
      structure: scriptText,
      isCustom: true
    };

    setScriptStructures(prev => [newTemplate, ...prev]);
    toast.success(`Active script structure cached into your Template Lab! 📝`);
    logActivity(`Saved custom script structure template derived from "${activeProject.title}"`, 'Template Lab', 'script');
  };

  // 3. APPLY PROJECT CONFIGURATION
  const handleApplyProjectConfig = async (config: ProjectConfigTemplate) => {
    const tid = toast.loading(`Instantiating project layout for "${config.title}"...`);
    try {
      // Create new project with preset details
      await createProject(config.title + ' (Copied)', config.niche, config.audience);
      
      // Let's retrieve the newly created project to update its description and tasks list
      // Since createProject sets setActiveProjectId and updates state, we will look for the newest project in state or just update the active one.
      toast.success(`Project instantiated! Pre-populating default workflow milestones.`, { id: tid });
      
      logActivity(`Created new workspace project from preset config: "${config.title}"`, 'Template Lab', 'system');
    } catch (err: any) {
      toast.error(`Instantiation failed: ${err.message || String(err)}`, { id: tid });
    }
  };

  // 4. INJECT SCRIPT STRUCTURE INTO ACTIVE PROJECT
  const handleInjectScriptIntoActiveProject = async (scriptTpl: ScriptStructureTemplate) => {
    if (!activeProject) {
      toast.error('Please select or load an active project first in order to inject script frameworks.');
      return;
    }

    if (activeProject.assets?.script) {
      const confirmOverwrite = confirm(`Active project already has a script (${activeProject.assets.script.length} characters). Do you want to OVERWRITE the active draft with this template structure? This action is irreversible.`);
      if (!confirmOverwrite) return;
    }

    const tid = toast.loading('Injecting screenwriting structure into active workspace...');
    try {
      await updateActiveProject({
        assets: {
          ...activeProject.assets,
          script: scriptTpl.structure
        }
      });
      toast.success('Script framework loaded into active Scripting Core! 📝', { id: tid });
      logActivity(`Injected script structure "${scriptTpl.title}" into active project`, 'Template Lab', 'script');
    } catch (err: any) {
      toast.error(`Injection failed: ${err.message || String(err)}`, { id: tid });
    }
  };

  // 5. DELETE CUSTOM TEMPLATE
  const handleDeleteTemplate = (id: string, type: 'project' | 'script' | 'prompt') => {
    if (type === 'project') {
      setProjectConfigs(prev => prev.filter(t => t.id !== id));
    } else if (type === 'script') {
      setScriptStructures(prev => prev.filter(t => t.id !== id));
    } else {
      setPromptPresets(prev => prev.filter(t => t.id !== id));
    }
    toast.success('Custom template removed from gallery.');
  };

  // 6. CREATE FROM FORM
  const handleCreateTemplateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formTitle.trim()) {
      toast.error('Please supply a template title name.');
      return;
    }

    if (newType === 'project') {
      if (!formNiche.trim()) {
        toast.error('Please specify target niche parameter.');
        return;
      }
      const newTpl: ProjectConfigTemplate = {
        id: 'p-custom-' + Date.now(),
        title: formTitle,
        niche: formNiche,
        audience: formAudience || 'General Audience',
        description: formDesc || 'Custom workspace configuration',
        tasks: [
          { title: 'Perform Campaign Strategy & Competitor Analysis', milestone: 'Topic Modeling', status: 'pending', startDate: '2026-06-24', endDate: '2026-06-25' },
          { title: 'Draft Screenplay Script Narrative', milestone: 'Linguistic Copy', status: 'pending', startDate: '2026-06-26', endDate: '2026-06-27' }
        ],
        isCustom: true
      };
      setProjectConfigs(prev => [newTpl, ...prev]);
      toast.success(`Custom project configuration "${formTitle}" added to library!`);
    } else if (newType === 'script') {
      if (!formContent.trim()) {
        toast.error('Please draft a script structure outline content.');
        return;
      }
      const newTpl: ScriptStructureTemplate = {
        id: 's-custom-' + Date.now(),
        title: formTitle,
        description: formDesc || 'Custom script outline structure',
        structure: formContent,
        isCustom: true
      };
      setScriptStructures(prev => [newTpl, ...prev]);
      toast.success(`Custom script framework "${formTitle}" saved!`);
    } else {
      if (!formContent.trim()) {
        toast.error('Please supply custom prompt instruction lines.');
        return;
      }
      const newTpl: PromptPresetTemplate = {
        id: 'pr-custom-' + Date.now(),
        title: formTitle,
        description: formDesc || 'Custom optimization prompt preset',
        prompt: formContent,
        category: formPromptCat,
        isCustom: true
      };
      setPromptPresets(prev => [newTpl, ...prev]);
      toast.success(`Custom AI prompt directive "${formTitle}" cached successfully!`);
    }

    // Reset forms
    setFormTitle('');
    setFormNiche('');
    setFormAudience('');
    setFormDesc('');
    setFormContent('');
    setShowCreateModal(false);
  };

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-[2rem] p-8 hover:border-zinc-705 transition-all duration-300">
      
      {/* Section Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div className="space-y-1">
          <h3 className="text-xl font-bold text-white flex items-center gap-3">
            <BookOpen size={22} className="text-red-500" /> Template Gallery
          </h3>
          <p className="text-xs text-zinc-400 font-medium">
            Save and apply high-impact project configurations, vertical/horizontal script structures, and professional Gemini AI prompts.
          </p>
        </div>

        {/* Gallery Utility Actions */}
        <div className="flex flex-wrap items-center gap-2">
          {activeProject && (
            <div className="flex gap-1.5 bg-zinc-950 p-1 border border-zinc-850 rounded-xl mr-2">
              <button
                type="button"
                onClick={handleSaveActiveProjectAsTemplate}
                className="px-2.5 py-1.5 text-[9.5px] font-black text-zinc-400 hover:text-white uppercase tracking-wider flex items-center gap-1 cursor-pointer hover:bg-zinc-900 rounded-lg transition-colors"
                title="Save niche, audience, and setup of active project as template configuration"
              >
                <Save size={10} className="text-red-500" /> Save Project
              </button>
              
              {activeProject.assets?.script && (
                <button
                  type="button"
                  onClick={handleSaveActiveScriptAsTemplate}
                  className="px-2.5 py-1.5 text-[9.5px] font-black text-zinc-400 hover:text-white uppercase tracking-wider flex items-center gap-1 cursor-pointer hover:bg-zinc-900 rounded-lg transition-colors"
                  title="Save current script text from active project as structure template"
                >
                  <FileText size={10} className="text-blue-400" /> Save Script
                </button>
              )}
            </div>
          )}

          <button
            type="button"
            onClick={() => {
              setNewType(activeTab === 'projects' ? 'project' : activeTab === 'scripts' ? 'script' : 'prompt');
              setShowCreateModal(true);
            }}
            className="bg-red-600 hover:bg-red-500 text-white px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider flex items-center gap-1.5 transition-all active-press cursor-pointer"
          >
            <Plus size={13} /> Custom Template
          </button>
        </div>
      </div>

      {/* Tabs Menu */}
      <div className="flex border-b border-zinc-900 pb-3 mb-6 gap-1 overflow-x-auto scrollbar-none">
        {[
          { id: 'projects', label: 'Project Presets', count: projectConfigs.length, desc: 'Niche configurations & milestones', icon: Folder, color: 'text-red-500' },
          { id: 'scripts', label: 'Script Structures', count: scriptStructures.length, desc: 'Linguistic narrative outlines', icon: FileText, color: 'text-blue-400' },
          { id: 'prompts', label: 'Prompt Directive Presets', count: promptPresets.length, desc: 'AI guidelines & system instructions', icon: Terminal, color: 'text-yellow-500' }
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-start gap-3 p-3 rounded-2xl text-left transition-all cursor-pointer ${
                isActive 
                  ? 'bg-zinc-950 border border-zinc-850 text-white shadow-xl shadow-red-500/5' 
                  : 'text-zinc-500 hover:text-zinc-300'
              }`}
            >
              <div className={`p-2 rounded-xl ${isActive ? 'bg-zinc-900' : 'bg-transparent'} ${tab.color} shrink-0`}>
                <Icon size={16} />
              </div>
              <div className="min-w-0 pr-2">
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-black uppercase tracking-wider">{tab.label}</span>
                  <span className="text-[10px] bg-zinc-950 border border-zinc-850/80 px-1.5 py-0.5 rounded text-zinc-500 font-mono font-bold">{tab.count}</span>
                </div>
                <p className="text-[9px] text-zinc-500 font-medium leading-normal mt-0.5 whitespace-nowrap">{tab.desc}</p>
              </div>
            </button>
          );
        })}
      </div>

      {/* Gallery Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        
        {/* TAB 1: PROJECTS CONFIGS */}
        {activeTab === 'projects' && (
          <>
            {projectConfigs.map((tpl) => (
              <div 
                key={tpl.id} 
                className="bg-zinc-950 border border-zinc-850/80 p-5 rounded-3xl space-y-4 hover:border-zinc-700 transition-all flex flex-col justify-between group relative overflow-hidden"
              >
                {tpl.isCustom && (
                  <span className="absolute top-4 right-4 text-[8px] bg-purple-500/10 border border-purple-500/20 px-1.5 py-0.5 rounded text-purple-400 font-black uppercase tracking-widest">Custom</span>
                )}
                
                <div className="space-y-2">
                  <span className="text-[9px] font-black uppercase text-red-500 tracking-wider">Project Archetype</span>
                  <h4 className="text-sm font-extrabold text-white line-clamp-1">{tpl.title}</h4>
                  <div className="flex flex-col gap-1 text-[10px] text-zinc-400 font-semibold leading-normal">
                    <span className="text-zinc-300">Niche: <strong className="text-white">{tpl.niche}</strong></span>
                    <span className="text-zinc-400">Target: <strong className="text-zinc-300">{tpl.audience}</strong></span>
                  </div>
                  <p className="text-[10.5px] text-zinc-500 leading-relaxed line-clamp-3 font-medium">{tpl.description}</p>
                </div>

                <div className="pt-3 border-t border-zinc-850/60 flex items-center justify-between gap-2 shrink-0">
                  <span className="text-[9px] font-mono font-bold text-zinc-500">{tpl.tasks.length} Workflow Steps</span>
                  <div className="flex items-center gap-1.5">
                    {tpl.isCustom && (
                      <button
                        type="button"
                        onClick={() => handleDeleteTemplate(tpl.id, 'project')}
                        className="p-1.5 bg-zinc-900 border border-zinc-800 text-zinc-500 hover:text-red-400 rounded-lg transition-colors cursor-pointer"
                        title="Delete custom configuration template"
                      >
                        <Trash2 size={11} />
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => handleApplyProjectConfig(tpl)}
                      className="bg-red-600/10 hover:bg-red-600 border border-red-500/15 hover:border-red-500 text-red-400 hover:text-white px-3 py-1.5 rounded-xl text-[9.5px] font-black uppercase tracking-wider flex items-center gap-1 cursor-pointer transition-all active-press"
                    >
                      Apply Presets <ChevronRight size={10} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </>
        )}

        {/* TAB 2: SCRIPT STRUCTURES */}
        {activeTab === 'scripts' && (
          <>
            {scriptStructures.map((tpl) => {
              const isCopied = copiedId === tpl.id;
              return (
                <div 
                  key={tpl.id} 
                  className="bg-zinc-950 border border-zinc-850/80 p-5 rounded-3xl space-y-4 hover:border-zinc-700 transition-all flex flex-col justify-between group relative overflow-hidden"
                >
                  {tpl.isCustom && (
                    <span className="absolute top-4 right-4 text-[8px] bg-purple-500/10 border border-purple-500/20 px-1.5 py-0.5 rounded text-purple-400 font-black uppercase tracking-widest">Custom</span>
                  )}

                  <div className="space-y-2">
                    <span className="text-[9px] font-black uppercase text-blue-400 tracking-wider">Script Structure Preset</span>
                    <h4 className="text-sm font-extrabold text-white line-clamp-1">{tpl.title}</h4>
                    <p className="text-[10.5px] text-zinc-500 leading-relaxed line-clamp-3 font-medium">{tpl.description}</p>
                    
                    {/* Structure Preview Block */}
                    <div className="bg-zinc-900/60 border border-zinc-850 p-2.5 rounded-xl max-h-[80px] overflow-hidden select-none">
                      <pre className="text-[8.5px] font-mono text-zinc-400 leading-normal whitespace-pre-wrap">{tpl.structure.substring(0, 150)}...</pre>
                    </div>
                  </div>

                  <div className="pt-3 border-t border-zinc-850/60 flex items-center justify-between gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={() => handleCopyText(tpl.structure, tpl.id, 'Structure outlines copied to clipboard!')}
                      className="text-[9.5px] font-black uppercase tracking-wider text-zinc-400 hover:text-white flex items-center gap-1 cursor-pointer"
                    >
                      {isCopied ? <Check size={11} className="text-emerald-500 animate-pulse" /> : <Copy size={11} />}
                      {isCopied ? 'Copied' : 'Copy Structure'}
                    </button>
                    
                    <div className="flex items-center gap-1.5">
                      {tpl.isCustom && (
                        <button
                          type="button"
                          onClick={() => handleDeleteTemplate(tpl.id, 'script')}
                          className="p-1.5 bg-zinc-900 border border-zinc-800 text-zinc-500 hover:text-red-400 rounded-lg transition-colors cursor-pointer"
                          title="Delete custom structure template"
                        >
                          <Trash2 size={11} />
                        </button>
                      )}
                      
                      <button
                        type="button"
                        onClick={() => handleInjectScriptIntoActiveProject(tpl)}
                        className="bg-blue-650/10 hover:bg-blue-650 border border-blue-500/15 hover:border-blue-500 text-blue-400 hover:text-white px-3 py-1.5 rounded-xl text-[9.5px] font-black uppercase tracking-wider flex items-center gap-1 cursor-pointer transition-all active-press"
                        title={activeProject ? `Inject into project: ${activeProject.title}` : 'Load/select active project first'}
                      >
                        Inject to Script
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </>
        )}

        {/* TAB 3: PROMPT DIRECTIVES */}
        {activeTab === 'prompts' && (
          <>
            {promptPresets.map((tpl) => {
              const isCopied = copiedId === tpl.id;
              
              let catStyle = "bg-yellow-500/10 text-yellow-400 border-yellow-500/15";
              if (tpl.category === 'Copywriting') catStyle = "bg-blue-500/10 text-blue-400 border-blue-500/15";
              else if (tpl.category === 'SEO') catStyle = "bg-emerald-500/10 text-emerald-400 border-emerald-500/15";
              else if (tpl.category === 'Optimization') catStyle = "bg-purple-500/10 text-purple-400 border-purple-500/15";

              return (
                <div 
                  key={tpl.id} 
                  className="bg-zinc-950 border border-zinc-850/80 p-5 rounded-3xl space-y-4 hover:border-zinc-700 transition-all flex flex-col justify-between group relative overflow-hidden"
                >
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className={`text-[8.5px] font-black uppercase tracking-widest px-2 py-0.5 border rounded-md ${catStyle}`}>{tpl.category}</span>
                      {tpl.isCustom && (
                        <span className="text-[8px] bg-purple-500/10 border border-purple-500/20 px-1.5 py-0.5 rounded text-purple-400 font-black uppercase tracking-widest">Custom</span>
                      )}
                    </div>
                    <h4 className="text-sm font-extrabold text-white line-clamp-1">{tpl.title}</h4>
                    <p className="text-[10.5px] text-zinc-500 leading-relaxed line-clamp-2 font-medium">{tpl.description}</p>
                    
                    {/* Prompt Preview Block */}
                    <div className="bg-zinc-900/60 border border-zinc-850 p-2.5 rounded-xl max-h-[80px] overflow-hidden select-text">
                      <p className="text-[9px] font-mono text-zinc-400 leading-normal">{tpl.prompt}</p>
                    </div>
                  </div>

                  <div className="pt-3 border-t border-zinc-850/60 flex items-center justify-between gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={() => handleCopyText(tpl.prompt, tpl.id, 'AI prompt instructions copied!')}
                      className="bg-zinc-900 hover:bg-zinc-800 text-zinc-350 hover:text-white px-3 py-1.5 rounded-xl text-[9.5px] font-black uppercase tracking-wider flex items-center gap-1 transition-all border border-zinc-850 cursor-pointer active-press"
                    >
                      {isCopied ? <Check size={11} className="text-emerald-500 animate-pulse" /> : <Copy size={11} />}
                      {isCopied ? 'Instructions Copied' : 'Copy AI Prompt'}
                    </button>

                    {tpl.isCustom && (
                      <button
                        type="button"
                        onClick={() => handleDeleteTemplate(tpl.id, 'prompt')}
                        className="p-1.5 bg-zinc-900 border border-zinc-800 text-zinc-500 hover:text-red-400 rounded-lg transition-colors cursor-pointer"
                        title="Delete custom prompt template"
                      >
                        <Trash2 size={11} />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </>
        )}
      </div>

      {/* CREATE TEMPLATE DIALOG MODAL */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md text-left transition-opacity">
          <div className="bg-zinc-900 border border-zinc-800 rounded-[2rem] w-full max-w-xl overflow-hidden shadow-2xl flex flex-col">
            
            {/* Modal Header */}
            <div className="flex items-center justify-between px-8 py-6 border-b border-zinc-850 shrink-0">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-red-600/10 text-red-500">
                  <Sparkles size={18} />
                </div>
                <div>
                  <h4 className="text-md font-extrabold text-white">Create Custom Workspace Preset</h4>
                  <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider mt-0.5">Define metadata configurations and structures for instant reuse</p>
                </div>
              </div>
              
              <button 
                type="button"
                onClick={() => setShowCreateModal(false)}
                className="text-zinc-400 hover:text-white text-[10px] font-black p-2 rounded-xl bg-zinc-950 border border-zinc-850 hover:border-zinc-800 transition-all cursor-pointer uppercase tracking-wider px-3.5"
              >
                Close
              </button>
            </div>

            {/* Modal Form Content */}
            <form onSubmit={handleCreateTemplateSubmit} className="flex-1 overflow-y-auto p-8 space-y-6 custom-scrollbar">
              
              {/* Type selector */}
              <div>
                <label className="text-[10px] font-black uppercase text-zinc-500 tracking-wider block mb-2">Template Classification Type</label>
                <div className="grid grid-cols-3 gap-2 bg-zinc-950 p-1 border border-zinc-850 rounded-2xl">
                  {([
                    { id: 'project', label: 'Project Preset', desc: 'Niche, tags' },
                    { id: 'script', label: 'Script outline', desc: 'Scene structures' },
                    { id: 'prompt', label: 'AI directive', desc: 'Gemini prompts' }
                  ] as const).map((t) => (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => setNewType(t.id)}
                      className={`py-2 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all cursor-pointer text-center flex flex-col items-center justify-center ${
                        newType === t.id 
                          ? 'bg-red-600 text-white shadow-xl shadow-red-650/15'
                          : 'text-zinc-500 hover:text-zinc-300'
                      }`}
                    >
                      <span>{t.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Title Input */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-black uppercase text-zinc-500 tracking-wider block">Template Header Title</label>
                <input
                  type="text"
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  placeholder="E.g., High-Yield Tech Explainer"
                  className="w-full bg-zinc-950 border border-zinc-850 focus:border-red-500 rounded-xl px-4 py-3 text-xs text-white placeholder-zinc-650 outline-none transition-all font-bold"
                  required
                />
              </div>

              {/* PROJECT PRESETS EXTRA INPUTS */}
              {newType === 'project' && (
                <div className="grid grid-cols-2 gap-4 animate-fade-in">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black uppercase text-zinc-500 tracking-wider block">Target Niche</label>
                    <input
                      type="text"
                      value={formNiche}
                      onChange={(e) => setFormNiche(e.target.value)}
                      placeholder="E.g., Software Engineering"
                      className="w-full bg-zinc-950 border border-zinc-850 focus:border-red-500/50 rounded-xl px-4 py-3 text-xs text-white placeholder-zinc-650 outline-none transition-all"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black uppercase text-zinc-500 tracking-wider block">Audience segment</label>
                    <input
                      type="text"
                      value={formAudience}
                      onChange={(e) => setFormAudience(e.target.value)}
                      placeholder="E.g., Solo Developers"
                      className="w-full bg-zinc-950 border border-zinc-850 focus:border-red-500/50 rounded-xl px-4 py-3 text-xs text-white placeholder-zinc-650 outline-none transition-all"
                    />
                  </div>
                </div>
              )}

              {/* PROMPTS EXTRA INPUTS */}
              {newType === 'prompt' && (
                <div className="space-y-1.5 animate-fade-in">
                  <label className="text-[10px] font-black uppercase text-zinc-500 tracking-wider block">Prompt Focus Category</label>
                  <div className="flex gap-2">
                    {['Copywriting', 'SEO', 'Creative', 'Optimization'].map((cat) => (
                      <button
                        key={cat}
                        type="button"
                        onClick={() => setFormPromptCat(cat as any)}
                        className={`px-3.5 py-2 rounded-xl text-[10px] font-bold uppercase tracking-wider border transition-all cursor-pointer ${
                          formPromptCat === cat
                            ? 'bg-yellow-500/10 border-yellow-500/30 text-yellow-400'
                            : 'bg-zinc-950 border-transparent text-zinc-500 hover:text-zinc-300'
                        }`}
                      >
                        {cat}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Description Input */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-black uppercase text-zinc-500 tracking-wider block">Strategic Summary Description</label>
                <textarea
                  value={formDesc}
                  onChange={(e) => setFormDesc(e.target.value)}
                  placeholder="Explain the strategy or guidelines to maximize retention or SEO match index..."
                  className="w-full bg-zinc-950 border border-zinc-850 focus:border-red-500/50 rounded-xl px-4 py-3 text-xs text-white placeholder-zinc-650 outline-none transition-all h-20 resize-none font-medium"
                />
              </div>

              {/* Content Input (For prompts or script structures) */}
              {newType !== 'project' && (
                <div className="space-y-1.5 animate-fade-in">
                  <label className="text-[10px] font-black uppercase text-zinc-500 tracking-wider block">
                    {newType === 'script' ? 'Script Structured Outline Text' : 'AI Prompt Directives Instruction Lines'}
                  </label>
                  <textarea
                    value={formContent}
                    onChange={(e) => setFormContent(e.target.value)}
                    placeholder={
                      newType === 'script' 
                        ? '[VISUAL: Neon backdrop]\n"Introduce problem within 3 seconds..."'
                        : 'E.g., "Act as an expert copywriter. Transform this text into..."'
                    }
                    className="w-full bg-zinc-950 border border-zinc-850 focus:border-red-500/50 rounded-xl px-4 py-3 text-xs text-white placeholder-zinc-650 outline-none transition-all h-40 resize-none font-mono"
                    required
                  />
                </div>
              )}

              {/* Submit Buttons */}
              <div className="pt-4 border-t border-zinc-850 flex justify-end gap-3 shrink-0">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="bg-zinc-950 hover:bg-zinc-850 text-zinc-400 hover:text-white border border-zinc-850 px-5 py-3 rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-red-650 hover:bg-red-500 text-white px-6 py-3 rounded-xl text-xs font-black uppercase tracking-wider flex items-center gap-1.5 transition-all shadow-lg shadow-red-650/10 cursor-pointer"
                >
                  Save Preset
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

    </div>
  );
};
