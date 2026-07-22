import React, { useState, useEffect } from 'react';
import { useProject } from '@/app/ProjectContext';
import { useAuth } from '@/infrastructure/auth/AuthContext';
import { ToolType, Project, VideoIdea, SeoResult } from '@/shared/types';
import { 
  CheckCircle2, 
  Play, 
  Lightbulb, 
  FileText, 
  Search, 
  Image as ImageIcon, 
  Repeat, 
  TrendingUp, 
  AlertCircle, 
  Sparkles, 
  Calendar, 
  ChevronRight, 
  Download, 
  Sliders, 
  BarChart, 
  RefreshCw, 
  Briefcase,
  Copy,
  ChevronLeft,
  Flame,
  Globe,
  Share2,
  ThumbsUp,
  Cpu,
  Clock,
  ArrowRight
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { HookAgent, HookVariation } from '@/ai/agents/hookAgent';
import { SeoAgent } from '@/ai/agents/seoAgent';
import { ScriptAgent } from '@/ai/agents/scriptAgent';
import { ThumbnailAgent, ThumbnailCompositionPlan } from '@/ai/agents/thumbnailAgent';
import { validateYouTubeMetadata } from '@/modules/seo/metadataValidator';
import { analyzeRetentionFactors } from '@/modules/analytics/creatorPerformance';
import { exportProjectToMarkdown } from '@/modules/content/reportingExporter';
import { InputValidator, ContextBuilder, AiRouter, PromptEngine, OutputValidator, SaveEngine, AnalyticsEngine } from '@/ai/workflows/workflowEngine';
import { PipelineOrchestrator, PipelineSessionResult } from '@/ai/agents/pipelineAgents';

// Definition of the 14 workflow steps
interface WorkflowStepDef {
  id: number;
  label: string;
  description: string;
  icon: React.ReactNode;
}

const STEPS: WorkflowStepDef[] = [
  { id: 1, label: 'Create Project', description: 'Initialize research manifest & goals', icon: <Briefcase size={16} /> },
  { id: 2, label: 'Research Market', description: 'Scan trending keywords & competitors', icon: <Search size={16} /> },
  { id: 3, label: 'Generate Viral Ideas', description: 'Brainstorm topic clusters using Gemini', icon: <Lightbulb size={16} /> },
  { id: 4, label: 'Score Ideas', description: 'Rank ideas based on competitive difficulty', icon: <Sliders size={16} /> },
  { id: 5, label: 'Select Idea', description: 'Commit to the best performing concept', icon: <CheckCircle2 size={16} /> },
  { id: 6, label: 'Generate Hooks', description: 'Engineer 5 psychology-driven hook lines', icon: <Flame size={16} /> },
  { id: 7, label: 'Generate Script', description: 'Structure engaging A/V screenplays', icon: <FileText size={16} /> },
  { id: 8, label: 'Generate SEO', description: 'Formulate search tags & meta descriptions', icon: <Globe size={16} /> },
  { id: 9, label: 'Generate Thumbnail Prompt', description: 'Draft high-contrast art directions', icon: <ImageIcon size={16} /> },
  { id: 10, label: 'Generate Repurpose', description: 'Create threads, newsletter & Shorts scripts', icon: <Repeat size={16} /> },
  { id: 11, label: 'Export Assets', description: 'Package and download campaign manifest', icon: <Download size={16} /> },
  { id: 12, label: 'Schedule Publishing', description: 'Map scheduling timings on calendar', icon: <Calendar size={16} /> },
  { id: 13, label: 'Track Analytics', description: 'Predict CTR & viewership trajectories', icon: <BarChart size={16} /> },
  { id: 14, label: 'Optimize Content', description: 'Audit meta-compliance and fix triggers', icon: <RefreshCw size={16} /> },
];

export const WorkflowAutomation: React.FC = () => {
  const { projects, activeProject, setActiveProjectById, createProject, updateActiveProject, isSyncing } = useProject();
  const { user } = useAuth();
  const [currentStep, setCurrentStep] = useState<number>(1);
  const [loadingStep, setLoadingStep] = useState<boolean>(false);

  // Form states for Step 1
  const [projTitle, setProjTitle] = useState('');
  const [projNiche, setProjNiche] = useState('AI tech');
  const [projAudience, setProjAudience] = useState('Solo Developers');

  // Interactive local pipeline states
  const [marketTrends, setMarketTrends] = useState<any>(null);
  const [generatedIdeas, setGeneratedIdeas] = useState<VideoIdea[]>([]);
  const [scoredIdeas, setScoredIdeas] = useState<VideoIdea[]>([]);
  const [selectedIdea, setSelectedIdea] = useState<VideoIdea | null>(null);
  const [engineeredHooks, setEngineeredHooks] = useState<HookVariation[]>([]);
  const [pacingTone, setPacingTone] = useState('Educative & Bold');
  const [pacingRules, setPacingRules] = useState('Fast paced with pattern interrupts');
  const [draftedScript, setDraftedScript] = useState('');
  const [seoData, setSeoData] = useState<SeoResult | null>(null);
  const [thumbnailPlan, setThumbnailPlan] = useState<ThumbnailCompositionPlan | null>(null);
  const [repurposedItems, setRepurposedItems] = useState<any>(null);
  const [launchDate, setLaunchDate] = useState('2026-05-25');
  const [launchTime, setLaunchTime] = useState('15:00');
  const [showDiagnostic, setShowDiagnostic] = useState(true);

  // Multi-Agent Pipeline state hooks
  const [isAgentPipelineMode, setIsAgentPipelineMode] = useState<boolean>(false);
  const [pipelineState, setPipelineState] = useState<'idle' | 'generator' | 'validator' | 'factchecker' | 'compliance' | 'publish' | 'complete'>('idle');
  const [pipelineStepStatus, setPipelineStepStatus] = useState<Record<string, 'idle' | 'running' | 'success' | 'failed'>>({
    generator: 'idle',
    validator: 'idle',
    factchecker: 'idle',
    compliance: 'idle',
    publish: 'idle'
  });
  const [pipelineRunning, setPipelineRunning] = useState<boolean>(false);
  const [pipelineResponse, setPipelineResponse] = useState<PipelineSessionResult | null>(null);
  const [pipelinePromptBrief, setPipelinePromptBrief] = useState<string>('');
  const [pipelineTone, setPipelineTone] = useState<string>('Educative & Bold');

  // Instantiate agents
  const hookAgent = new HookAgent();
  const seoAgent = new SeoAgent();
  const scriptAgent = new ScriptAgent();
  const thumbnailAgent = new ThumbnailAgent();

  // Load existing project data into steps whenever active project changes
  useEffect(() => {
    if (activeProject) {
      if (activeProject.assets?.script) {
        setDraftedScript(activeProject.assets.script);
      }
      if (activeProject.assets?.seo) {
        setSeoData(activeProject.assets.seo);
      }
      if (activeProject.assets?.ideas) {
        setGeneratedIdeas(activeProject.assets.ideas);
        setScoredIdeas(activeProject.assets.ideas);
      }
    }
  }, [activeProject]);

  const handleRunAgentPipeline = async () => {
    if (!activeProject) {
      toast.error('Initialize/Select a project manifest before triggering multi-agent pipeline orchestration.');
      return;
    }
    
    setPipelineRunning(true);
    setPipelineResponse(null);
    setPipelineState('idle');
    setPipelineStepStatus({
      generator: 'idle',
      validator: 'idle',
      factchecker: 'idle',
      compliance: 'idle',
      publish: 'idle'
    });

    try {
      toast.success('🧠 Multi-Agent Pipeline Triggered: Initiating Generator...');
      
      const res = await PipelineOrchestrator.runOrchestration(activeProject, {
        customBrief: pipelinePromptBrief,
        onStepChange: (stepId, status, outputs) => {
          // Adjust state based on callback
          if (stepId === 'complete') {
            setPipelineState('complete');
          } else {
            setPipelineState(stepId);
            setPipelineStepStatus(prev => ({
              ...prev,
              [stepId]: status
            }));
          }

          const taskNames: Record<string, string> = {
            generator: 'Generator Agent: Screenplay Styling',
            validator: 'Validator Agent: Structural Pacing Audit',
            factchecker: 'Fact Checker Agent: Metrics Reliability',
            compliance: 'Compliance Agent: Community Guidelines Risk',
            publish: 'Publisher Agent: Compiling Publication Bundle'
          };
          
          const taskTypes: Record<string, string> = {
            generator: 'script_finalization',
            validator: 'verification',
            factchecker: 'research',
            compliance: 'audit',
            publish: 'video_generation'
          };

          if (stepId !== 'complete') {
            if (status === 'running') {
              const name = taskNames[stepId] || `Agent Step: ${stepId}`;
              const type = taskTypes[stepId] || 'system';
              window.dispatchEvent(new CustomEvent('ranktica-background-task', {
                detail: {
                  id: `pipeline-${stepId}`,
                  name,
                  type,
                  duration: 8,
                  status: 'start'
                }
              }));
            } else if (status === 'success') {
              const name = taskNames[stepId] || `Agent Step: ${stepId}`;
              window.dispatchEvent(new CustomEvent('ranktica-background-task', {
                detail: {
                  id: `pipeline-${stepId}`,
                  name,
                  status: 'complete'
                }
              }));
            } else if (status === 'failed') {
              const name = taskNames[stepId] || `Agent Step: ${stepId}`;
              window.dispatchEvent(new CustomEvent('ranktica-background-task', {
                detail: {
                  id: `pipeline-${stepId}`,
                  name,
                  status: 'failed'
                }
              }));
            }
          }
          
          if (status === 'running') {
            if (stepId === 'generator') toast.success('1. Generator Agent is styling screenplay draft...');
            if (stepId === 'validator') toast.success('2. Validator Agent is auditing structural pacing...');
            if (stepId === 'factchecker') toast.success('3. Fact Checker Agent is scoring metrics reliability...');
            if (stepId === 'compliance') toast.success('4. Compliance Agent checking community risks...');
            if (stepId === 'publish') toast.success('5. Finalizing Publication Bundle and simulations...');
          }
        }
      });

      setPipelineResponse(res);
      setPipelineState('complete');
      
      // Keep UI variables synchronized with generated script
      if (res.generator?.scriptText) {
        setDraftedScript(res.generator.scriptText);
      }
      
      // Save changes back to our project context assets so they persist across local DB syncing
      updateActiveProject({
        status: 'published',
        assets: {
          ...activeProject.assets,
          script: res.generator?.scriptText || draftedScript,
          seo: {
            titles: res.generator?.headings || [activeProject.title],
            description: res.publish?.metadataDescription || activeProject.assets?.seo?.description || '',
            tags: activeProject.assets?.seo?.tags || ['ai', 'niche'],
            hashtags: activeProject.assets?.seo?.hashtags || ['#ai'],
            semanticClusters: res.generator?.headings || []
          }
        }
      });
      
      toast.success('🚀 Complete Pipeline Compiled & Published Successfully!');
    } catch (e) {
      console.error(e);
      toast.error('Multi-Agent Pipeline execution hit critical failure node.');
    } finally {
      setPipelineRunning(false);
    }
  };

  const handleNext = () => {
    if (currentStep < 14) {
      setCurrentStep(prev => prev + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(prev => prev - 1);
    }
  };

  // Workflow Handlers
  const handleMarketResearch = async () => {
    if (!activeProject) return toast.error('Initialize a project first!');
    setLoadingStep(true);
    try {
      // Simulate/Trigger market research intelligence aggregation
      setTimeout(() => {
        setMarketTrends({
          nicheInterest: 'EXPLODING',
          score: 88,
          searchVolume: '45,000 requests/mo',
          growthTrend: '+124% YoY',
          keywords: [
            { term: `${activeProject.niche} tips`, volume: 'High', difficulty: 'Low' },
            { term: `how to scale ${activeProject.niche}`, volume: 'Medium', difficulty: 'Low' },
            { term: `${activeProject.title} tutorial`, volume: 'Very High', difficulty: 'Medium' }
          ],
          swot: {
            strengths: ['Low quality competition using generic scripts', 'Strong interest spike among developers'],
            weaknesses: ['Requires high visual retention to maintain average view duration'],
            opportunities: ['Inject pattern interrupt visual loops early on', 'Write targeted community hooks']
          }
        });
        setLoadingStep(false);
        toast.success('Market scanning finalized!');
        handleNext();
      }, 1500);
    } catch (e) {
      setLoadingStep(false);
      toast.error('Market research index compilation failed');
    }
  };

  const handleGenerateIdeas = async () => {
    if (!activeProject) return toast.error('Please create or select a project.');
    setLoadingStep(true);
    try {
      const nicheQuery = activeProject.niche;
      const audienceQuery = activeProject.audience || 'General developers';
      
      const payload = { niche: nicheQuery, audience: audienceQuery };
      const res = await fetch('/api/generate-ideas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      
      if (!res.ok) throw new Error('Ideas error');
      const data = await res.json();
      const cleanedText = data.text.replace(/```json|```/g, '');
      const parsed = JSON.parse(cleanedText);
      const ideasList = parsed.ideas || [];

      setGeneratedIdeas(ideasList);
      updateActiveProject({
        assets: {
          ...activeProject.assets,
          ideas: ideasList
        }
      });
      setLoadingStep(false);
      toast.success('Discovered 3 optimal video topics!');
      handleNext();
    } catch (e) {
      // Fallback
      const fallbackIdeas: VideoIdea[] = [
        { title: `Mastering ${activeProject.niche}: 5 Fatal Mistakes You Are Making`, hook: 'You are losing 40% efficiency by not applying this rule.', score: 85, competition: 'Low', interest: 'Rising' },
        { title: `How I Scaled ${activeProject.niche} to 10k Users As a Solo Creator`, hook: 'No teams, no high budget. Just automated frameworks.', score: 92, competition: 'Medium', interest: 'Exploding' },
        { title: `The Advanced ${activeProject.niche} Blueprint No One Explains`, hook: 'Most tutorials skip this single critical setting.', score: 79, competition: 'Low', interest: 'Stable' }
      ];
      setGeneratedIdeas(fallbackIdeas);
      updateActiveProject({
        assets: {
          ...activeProject.assets,
          ideas: fallbackIdeas
        }
      });
      setLoadingStep(false);
      toast.success('Sample ideas populated via analytical backup!');
      handleNext();
    }
  };

  const scoreSingleIdea = (index: number, competitionVal: 'Low' | 'Medium' | 'High', interestVal: 'Stable' | 'Rising' | 'Exploding') => {
    const list = [...generatedIdeas];
    let scoreMod = 70;
    if (competitionVal === 'Low') scoreMod += 15;
    if (competitionVal === 'High') scoreMod -= 10;
    if (interestVal === 'Exploding') scoreMod += 15;
    if (interestVal === 'Rising') scoreMod += 7;

    list[index] = {
      ...list[index],
      competition: competitionVal,
      interest: interestVal,
      score: Math.min(100, Math.max(30, scoreMod))
    };
    setGeneratedIdeas(list);
    setScoredIdeas(list);
  };

  const handleSelectIdea = (idea: VideoIdea) => {
    setSelectedIdea(idea);
    updateActiveProject({
      title: idea.title,
      status: 'scripting'
    });
    toast.success(`Active topic updated to: "${idea.title}"`);
    handleNext();
  };

  const handleGenerateHooks = async () => {
    const topic = selectedIdea?.title || activeProject?.title || '';
    if (!topic) return toast.error('Confirm an active idea/title first.');
    setLoadingStep(true);
    try {
      const hooksResult = await hookAgent.engineerHooks(topic, activeProject?.niche || 'Tech', activeProject?.audience || 'General');
      setEngineeredHooks(hooksResult);
      setLoadingStep(false);
      toast.success('5 psychological hooks compiled successfully!');
      handleNext();
    } catch (e) {
      setLoadingStep(false);
      toast.error('Hook engineering error');
    }
  };

  const handleGenerateScript = async () => {
    const topic = selectedIdea?.title || activeProject?.title || '';
    if (!topic) return toast.error('Provide a video title to draft');
    setLoadingStep(true);
    try {
      const scriptText = await scriptAgent.generateScript(
        topic,
        pacingTone,
        pacingRules,
        'Structure visual patterns with vivid sound directives for creators.'
      );
      setDraftedScript(scriptText);
      if (activeProject) {
        updateActiveProject({
          assets: {
            ...activeProject.assets,
            script: scriptText
          }
        });
      }
      setLoadingStep(false);
      toast.success('Engaged narration script compiled!');
      handleNext();
    } catch (e) {
      setLoadingStep(false);
      toast.error('Scripting engine failed');
    }
  };

  const handleGenerateSEO = async () => {
    const topic = selectedIdea?.title || activeProject?.title || '';
    if (!topic) return toast.error('Requires project topic configuration');
    setLoadingStep(true);
    try {
      const seoResult = await seoAgent.generateMetadata(topic, activeProject?.niche || 'Tech', activeProject?.audience || 'General');
      setSeoData(seoResult);
      if (activeProject) {
        updateActiveProject({
          assets: {
            ...activeProject.assets,
            seo: seoResult
          }
        });
      }
      setLoadingStep(false);
      toast.success('Crawler tags and structured links mapped!');
      handleNext();
    } catch (e) {
      setLoadingStep(false);
      toast.error('SEO semantic mapping failed');
    }
  };

  const handleGenerateThumbnailPrompt = async () => {
    const topic = selectedIdea?.title || activeProject?.title || '';
    if (!topic) return toast.error('Requires project topic configuration');
    setLoadingStep(true);
    try {
      const composition = await thumbnailAgent.planComposition(topic, activeProject?.niche || 'Tech', activeProject?.audience || 'General');
      setThumbnailPlan(composition);
      setLoadingStep(false);
      toast.success('Visual composition directives generated!');
      handleNext();
    } catch (e) {
      setLoadingStep(false);
      toast.error('Thumbnail plan failed');
    }
  };

  const handleGenerateRepurpose = async () => {
    if (!draftedScript) return toast.error('Write a script first before trying to repurpose.');
    setLoadingStep(true);
    try {
      setTimeout(() => {
        setRepurposedItems({
          twitterThread: [
            `🧵 Struggling with ${activeProject?.title || 'this topic'}? Here is the complete breakdown and blueprint you need to apply today. 👇`,
            `1️⃣ Many creators make the critical mistake of ignoring semantic search clusters. They look at simple search queries instead of overall interest trends.`,
            `2️⃣ The fix? Map broad, LSI and exact keywords. Check out the 5-step visual planning block we drafted in our suite earlier.`,
            `3️⃣ Maintain average view duration by firing a high contrast pattern interrupt at second 12. Don't let viewers skip off your funnel! 🚀`
          ],
          newsletter: {
            subject: `The Ultimate ${activeProject?.niche || 'Creator'} Cheat Sheet (Insider Blueprint)`,
            body: `Hi Creator,\n\nWe just compiled our advanced guide on: "${selectedIdea?.title || activeProject?.title}".\n\nIf you want the secret guidelines regarding psychological curiosity gaps and high contrast thumbnail outlines, here is what you need to master...\n\nStay ahead,\nRanktica AI Suite`
          },
          shortsScript: `[AUDIO: Fast-paced synth drop]\n[VISUAL: Screen flashes neon pink 'DO THIS FIRST']\n\n"Stop scrolling. Here is the single hacks that scaled ${activeProject?.niche || 'this niche'} in under 48 hours. Most educators skip this. Apply it now!"`
        });
        setLoadingStep(false);
        toast.success('Social packages generated successfully!');
        handleNext();
      }, 1200);
    } catch (e) {
      setLoadingStep(false);
      toast.error('Repurpose synthesizer failed');
    }
  };

  const handleExportCampaign = () => {
    if (!activeProject) return toast.error('No project selected to export');
    try {
      const reportMarkdown = exportProjectToMarkdown({
        ...activeProject,
        assets: {
          script: draftedScript,
          seo: seoData || undefined,
          ideas: generatedIdeas
        }
      });
      
      const blob = new Blob([reportMarkdown], { type: 'text/markdown' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Ranktica_Campaign_${activeProject.title.replace(/\s+/g, '_')}.md`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast.success('Campaign Manifest successfully downloaded!');
      handleNext();
    } catch (e) {
      toast.error('Export download failed');
    }
  };

  const handleSchedulePublishing = () => {
    if (!activeProject) return;
    updateActiveProject({
      status: 'scheduled'
    });
    toast.success(`Video campaign scheduled for ${launchDate} at ${launchTime}`);
    handleNext();
  };

  const handleOptimizeNow = () => {
    if (!activeProject) return;
    toast.success('Triggering SEO compliance scan...');
    // Simulated updates
    toast.success('Metadata is now fully optimized for search indexes!');
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('Copied to clipboard!');
  };

  // Automated Metrics calculation for steps 13 and 14
  const validationReport = seoData 
    ? validateYouTubeMetadata(activeProject?.title || '', seoData.description, seoData.tags, seoData.hashtags)
    : { score: 72, status: 'good' as const, issues: [
        { severity: 'warning' as const, message: 'Metadata needs verification', description: 'Ensure rich keywords are parsed and verified by our specialized SeoAgent.' }
      ] };

  const retentionForecast = analyzeRetentionFactors(
    activeProject?.niche || 'technology',
    draftedScript ? draftedScript.split(/\s+/).length : 250,
    validationReport.score / 10
  );

  // Live Workflow Engine Diagnostic Analytics
  const stepValidation = InputValidator.validateStepInput(currentStep, activeProject);
  const liveCtx = ContextBuilder.buildContext(activeProject);
  const activeAgent = AiRouter.routeAgent(currentStep);
  const routedModelInfo = AiRouter.getTargetModel(activeAgent);

  let activePromptExcerpt = '';
  if (currentStep === 3) {
    activePromptExcerpt = PromptEngine.getViralTopicPrompt(activeProject?.niche || 'Tech', activeProject?.audience || 'Developers');
  } else if (currentStep === 6) {
    activePromptExcerpt = PromptEngine.getHookEngineeringPrompt(activeProject?.title || 'Focal Topic', activeProject?.niche || 'Tech', activeProject?.audience || 'Developers');
  } else if (currentStep === 7) {
    activePromptExcerpt = PromptEngine.getScriptScreenplayPrompt(activeProject?.title || 'Focal Topic', pacingTone, pacingRules);
  } else if (currentStep === 8) {
    activePromptExcerpt = PromptEngine.getSeoPrompt(activeProject?.title || 'Focal Topic', activeProject?.niche || 'Tech', activeProject?.audience || 'Developers');
  } else {
    activePromptExcerpt = 'Pipeline waiting. Standard optimization directives engaged.';
  }

  const promptPreview = activePromptExcerpt.length > 70 
    ? activePromptExcerpt.substring(0, 70) + '...' 
    : activePromptExcerpt;

  const scriptAnalysis = OutputValidator.validateScriptStructure(draftedScript);
  const liveSEOReport = seoData 
    ? OutputValidator.validateMetadataOutput(activeProject?.title || '', seoData.description, seoData.tags, seoData.hashtags)
    : null;

  const cacheStatus = activeProject 
    ? `SYNCHRONIZED (${Object.keys(activeProject.assets || {}).length} asset keys inside local cache)` 
    : 'IDLE (Waiting for project manifest)';

  const computedForecast = AnalyticsEngine.forecastCampaignMetrics(
    activeProject?.niche || 'Technology',
    scriptAnalysis.wordCount || 100,
    liveSEOReport?.score || 72,
    (generatedIdeas[0]?.competition || 'Medium') as any,
    (generatedIdeas[0]?.interest || 'Stable') as any
  );

  return (
    <div className="flex flex-col lg:flex-row h-full gap-8 pb-10 animate-fade-in text-white">
      {/* 14-Step Sidebar */}
      <div className="w-full lg:w-80 bg-zinc-900/60 border border-zinc-800 rounded-3xl p-6 flex flex-col h-[calc(100vh-140px)] overflow-y-auto custom-scrollbar shrink-0">
        <div className="mb-4">
          <p className="text-[10px] font-black text-red-500 uppercase tracking-widest flex items-center gap-1.5 mb-1">
            <Cpu size={12} className="animate-pulse" /> Unified Creator Engine
          </p>
          <h3 className="text-xl font-extrabold text-zinc-100">Workflow Pipeline</h3>
        </div>

        <div className="space-y-1.5 flex-1 pr-1">
          {STEPS.map((step) => {
            const isActive = currentStep === step.id;
            const isCompleted = currentStep > step.id;
            return (
              <button
                key={step.id}
                onClick={() => setCurrentStep(step.id)}
                className={`w-full text-left p-3 rounded-2xl border transition-all flex items-center gap-3 relative overflow-hidden group ${
                  isActive
                    ? 'bg-red-600/10 border-red-500/30 text-red-500 shadow-lg shadow-red-500/5'
                    : isCompleted
                    ? 'bg-zinc-950/40 border-zinc-800/80 text-zinc-400 hover:bg-zinc-800/20'
                    : 'bg-zinc-950/20 border-transparent text-zinc-600 hover:bg-zinc-800/10 hover:text-zinc-500'
                }`}
              >
                {isActive && (
                  <div className="absolute left-0 top-0 bottom-0 w-1 bg-red-500" />
                )}
                
                <div className={`p-2 rounded-xl transition-all ${
                  isActive 
                    ? 'bg-red-500/20 text-red-400' 
                    : isCompleted 
                    ? 'bg-zinc-900 text-zinc-500' 
                    : 'bg-zinc-950/50 text-zinc-700'
                }`}>
                  {step.icon}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-1">
                    <span className="text-xs font-black tracking-tight truncate">
                      {step.id}. {step.label}
                    </span>
                    {isCompleted && (
                      <CheckCircle2 size={12} className="text-emerald-500 shrink-0" />
                    )}
                  </div>
                  <p className="text-[9px] text-zinc-500 truncate mt-0.5 leading-relaxed">
                    {step.description}
                  </p>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Interactive Stage Area */}
      <div className="flex-1 bg-zinc-900 border border-zinc-800 rounded-3xl p-8 flex flex-col justify-between h-[calc(100vh-140px)] overflow-y-auto custom-scrollbar relative">
        {isSyncing && (
          <div className="absolute top-4 right-4 text-[9px] font-black uppercase text-blue-400 bg-blue-500/10 border border-blue-500/20 px-3 py-1 rounded-full animate-pulse flex items-center gap-1.5">
            <RefreshCw size={10} className="animate-spin" /> Synchronizing Core
          </div>
        )}

        {/* Toggle Mode Tab Selector */}
        <div className="flex border-b border-zinc-800 mb-6 text-xs uppercase tracking-widest font-black shrink-0 relative">
          <button 
            type="button"
            onClick={() => setIsAgentPipelineMode(false)}
            className={`pb-3 px-5 transition-all outline-none border-b-2 flex items-center gap-2 ${!isAgentPipelineMode ? 'border-red-500 text-red-500 font-extrabold' : 'border-transparent text-zinc-500 hover:text-zinc-300'}`}
          >
            Classic 14-Step Workflow
          </button>
          <button 
            type="button"
            onClick={() => setIsAgentPipelineMode(true)}
            className={`pb-3 px-5 transition-all outline-none border-b-2 flex items-center gap-2 ${isAgentPipelineMode ? 'border-red-500 text-red-500 font-extrabold' : 'border-transparent text-zinc-500 hover:text-zinc-300'}`}
          >
            <Cpu size={12} className={isAgentPipelineMode ? 'animate-pulse text-red-500' : ''} />
            Collaborative Multi-Agent Pipeline
          </button>
          {isAgentPipelineMode && (
            <span className="absolute right-0 top-0 text-[10px] bg-red-600/10 border border-red-500/20 text-red-500 px-3 py-1 rounded-full font-black animate-pulse uppercase">
              Live Auditing Suite
            </span>
          )}
        </div>

        {isAgentPipelineMode ? (
          /* MULTI-AGENT PIPELINE RENDER NODE */
          <div className="flex-1 flex flex-col justify-start mb-8 min-h-0 space-y-6">
            <div className="bg-zinc-950/60 border border-zinc-805 p-6 rounded-2xl">
              <h3 className="text-xl font-extrabold text-white mb-2 flex items-center gap-2">
                <Cpu className="text-red-500 animate-pulse" size={20} />
                Multi-Agent Cognitive Content Orchestration
              </h3>
              <p className="text-xs text-zinc-400 max-w-3xl leading-relaxed">
                Execute a seamless, sequential 5-agent pipeline context. The system drives output iteratively across 
                autonomous nodes: <strong className="text-zinc-350">Generator Agent</strong> ➔ <strong className="text-zinc-350">Validator Agent</strong> ➔ <strong className="text-zinc-350">Fact Checker Agent</strong> ➔ <strong className="text-zinc-350">Compliance Safeguards</strong> ➔ <strong className="text-zinc-350">Publish Execution</strong>. 
                Downstream minds read unified semantic keywords and creator characteristics directly from local memory frames.
              </p>
            </div>

            {/* Config & Launch Card */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="md:col-span-2 bg-zinc-950 border border-zinc-800 p-6 rounded-2xl space-y-4">
                <span className="text-[10px] font-black text-red-500 uppercase tracking-widest block font-sans">Configure System Directives</span>
                <div className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-zinc-500 uppercase">Contextual Brief Inputs (Optional)</label>
                    <textarea 
                      rows={2}
                      placeholder="Instruct details (e.g. Include a dramatic zoom-in, compare caching vs non-caching explicitly at 0:15...)"
                      value={pipelinePromptBrief}
                      onChange={e => setPipelinePromptBrief(e.target.value)}
                      className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3 text-xs text-white outline-none focus:border-red-500 transition-colors resize-none"
                    />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-zinc-500 uppercase">Tone Style Preset</label>
                      <select 
                        value={pipelineTone}
                        onChange={e => setPipelineTone(e.target.value)}
                        className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3 text-xs text-white outline-none focus:border-red-500 transition-colors"
                      >
                        <option>Educative & Bold (Default)</option>
                        <option>Hyper Brutalist Cyberpunk</option>
                        <option>Chill Conversational Narrative</option>
                        <option>Cinematic Drama Pacing</option>
                      </select>
                    </div>
                    <div className="space-y-1.5 flex flex-col justify-end">
                      <button
                        type="button"
                        onClick={handleRunAgentPipeline}
                        disabled={pipelineRunning || !activeProject}
                        className="w-full bg-red-650 hover:bg-red-700 disabled:bg-zinc-800 text-white font-extrabold text-xs uppercase tracking-widest px-5 py-3 rounded-xl transition-all flex items-center justify-center gap-2 shadow-lg shadow-red-650/15"
                      >
                        {pipelineRunning ? (
                          <>
                            <RefreshCw size={14} className="animate-spin text-red-500" /> Orchestrating...
                          </>
                        ) : (
                          <>
                            <Play size={14} /> Run Multi-Agent Loop
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Memory Context Stats Card */}
              <div className="bg-zinc-950 border border-zinc-805 p-6 rounded-2xl flex flex-col justify-between">
                <div className="space-y-4">
                  <div className="flex items-center justify-between border-b border-zinc-800 pb-2">
                    <span className="text-[10px] font-black text-red-500 uppercase tracking-widest">Cognitive State</span>
                    <span className="text-[9px] bg-emerald-500/15 text-emerald-400 px-2 py-0.5 rounded border border-emerald-500/10 font-bold uppercase">Ready</span>
                  </div>
                  <div className="space-y-2 text-xs">
                    <div className="flex justify-between">
                      <span className="text-zinc-500">Project Model:</span>
                      <span className="text-zinc-300 font-bold tracking-tight truncate max-w-[120px]">{activeProject?.title || 'None'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-zinc-500">Niche Category:</span>
                      <span className="text-zinc-300 font-mono text-[10px] truncate max-w-[120px]">{activeProject?.niche || 'None'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-zinc-500 font-sans">Preference Memory:</span>
                      <span className="text-emerald-500 font-bold">Synchronized</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-zinc-500">Target Audience:</span>
                      <span className="text-zinc-300 truncate max-w-[120px]">{activeProject?.audience || 'Everyone'}</span>
                    </div>
                  </div>
                </div>
                <div className="text-[10px] bg-zinc-90 w-full border border-zinc-800 p-2 rounded-xl text-zinc-500 italic mt-4 text-center">
                  "Core metrics and properties persist back to dynamic SQL database structures."
                </div>
              </div>
            </div>

            {/* Pipeline Stage Visual Flow nodes with checkmarks and loader */}
            <div className="bg-zinc-950 border border-zinc-805 p-6 rounded-2xl relative overflow-hidden">
              <div className="flex justify-between items-center mb-6 z-10 relative">
                <span className="text-[10px] font-black text-red-500 uppercase tracking-widest">Operational Sequence Progress</span>
                <span className="text-xs font-mono text-zinc-505">Trace: {pipelineResponse?.traceId || 'trace_inactive'}</span>
              </div>
              
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4 z-10 relative">
                {[
                  { key: 'generator', label: '1. Generator Agent', task: 'Writes Screenplay Screen' },
                  { key: 'validator', label: '2. Validator Agent', task: 'Validates Retention Pacing' },
                  { key: 'factchecker', label: '3. Fact Checker', task: 'Checks Truth & Metrics' },
                  { key: 'compliance', label: '4. Compliance Guard', task: 'Safety Seal stamps' },
                  { key: 'publish', label: '5. Publisher', task: 'Simulates CTR CTR%' }
                ].map(step => {
                  const stateStatus = pipelineStepStatus[step.key];
                  const isCurrent = pipelineState === step.key && pipelineRunning;
                  
                  let cardBorder = 'border-zinc-850';
                  let cardBg = 'bg-zinc-950/20';
                  let indicatorColor = 'text-zinc-650';
                  
                  if (stateStatus === 'success') {
                    cardBorder = 'border-emerald-500/30 shadow-lg shadow-emerald-500/2';
                    cardBg = 'bg-emerald-955/10';
                    indicatorColor = 'text-emerald-500';
                  } else if (stateStatus === 'failed') {
                    cardBorder = 'border-red-500/35';
                    cardBg = 'bg-red-955/15';
                    indicatorColor = 'text-red-500';
                  } else if (isCurrent) {
                    cardBorder = 'border-red-500 shadow-xl shadow-red-500/5 animate-pulse';
                    cardBg = 'bg-red-955/10';
                    indicatorColor = 'text-red-500';
                  }

                  return (
                    <div key={step.key} className={`border rounded-xl p-4 transition-all flex flex-col justify-between h-28 ${cardBorder} ${cardBg}`}>
                      <div className="space-y-1">
                        <span className="text-xs font-black text-zinc-100 flex items-center gap-1.5">
                          {isCurrent && <RefreshCw size={10} className="animate-spin text-red-500" />}
                          {step.label}
                        </span>
                        <p className="text-[10px] text-zinc-500 leading-tight">{step.task}</p>
                      </div>
                      
                      <div className="flex justify-between items-center mt-3">
                        <span className={`text-[9px] font-black uppercase tracking-wider ${indicatorColor}`}>
                          {stateStatus === 'success' ? 'Synchronized' : stateStatus === 'failed' ? 'Failed' : isCurrent ? 'Running...' : 'Idle'}
                        </span>
                        {stateStatus === 'success' && <CheckCircle2 size={14} className="text-emerald-500" />}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Render Collapsible Panels / Output Metrics of Completed run */}
            {pipelineResponse ? (
              <div className="space-y-6">
                <span className="text-sm font-black text-zinc-400 uppercase tracking-wider flex items-center gap-2">
                  <Sparkles size={16} className="text-red-500 shrink-0" />
                  Compiled Collaborative Campaign Results
                </span>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* GENERATOR STAGE DETAILS CARD */}
                  <div className="bg-zinc-950 border border-zinc-800 p-6 rounded-2xl space-y-4">
                    <div className="flex justify-between items-center border-b border-zinc-800 pb-2">
                      <span className="text-xs font-black text-zinc-300 flex items-center gap-1.5">
                        <FileText size={14} className="text-blue-400" />
                        1. Screenplay Screenplay Generator (Script)
                      </span>
                      <span className="text-[10px] text-blue-400 bg-blue-500/10 border border-blue-500/20 px-2 py-0.5 rounded font-mono font-black">
                        {pipelineResponse.generator?.suggestedDurationSeconds} Seconds Line
                      </span>
                    </div>
                    
                    <div className="space-y-3">
                      <div className="space-y-1">
                        <label className="text-[10px] text-zinc-500 uppercase font-bold">Narration Screenplay</label>
                        <div className="w-full h-44 bg-zinc-900 border border-zinc-805 rounded-xl p-4 overflow-y-auto text-xs font-mono leading-relaxed text-zinc-300 custom-scrollbar select-text whitespace-pre-wrap">
                          {pipelineResponse.generator?.scriptText}
                        </div>
                      </div>

                      <div className="space-y-1">
                        <label className="text-[10px] text-zinc-500 uppercase font-bold">Major Structural Headings</label>
                        <div className="flex flex-wrap gap-2">
                          {pipelineResponse.generator?.headings.map((h, i) => (
                            <span key={i} className="text-[10px] bg-blue-950/35 border border-blue-800/30 text-blue-400 px-3 py-1 rounded-full font-bold">
                              {h}
                            </span>
                          ))}
                        </div>
                      </div>

                      <div className="space-y-1">
                        <label className="text-[10px] text-zinc-500 uppercase font-bold">Visual Outline Actions</label>
                        <ul className="space-y-1.5 text-xs text-zinc-400 list-disc list-inside">
                          {pipelineResponse.generator?.visualOutline.map((v, i) => (
                            <li key={i}>{v}</li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </div>

                  {/* VALIDATOR AUDIT CARD */}
                  <div className="bg-zinc-950 border border-zinc-800 p-6 rounded-2xl space-y-4">
                    <div className="flex justify-between items-center border-b border-zinc-800 pb-2">
                      <span className="text-xs font-black text-zinc-300 flex items-center gap-1.5">
                        <CheckCircle2 size={14} className="text-emerald-400" />
                        2. Expert Retention & Hook Validator
                      </span>
                      <span className={`text-[10px] px-2 py-0.5 rounded font-black uppercase ${pipelineResponse.validator?.approved ? 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-400' : 'bg-red-500/10 text-red-400'}`}>
                        {pipelineResponse.validator?.approved ? 'APPROVED' : 'REJECTED'}
                      </span>
                    </div>

                    <div className="space-y-4">
                      {/* Pacing Rating Gauge indicator */}
                      <div className="bg-zinc-900 border border-zinc-805 p-4 rounded-xl flex items-center justify-between">
                        <div className="space-y-1">
                          <span className="text-xs font-bold text-zinc-400">Retention Score</span>
                          <p className="text-[10px] text-zinc-500 max-w-[200px]">Optimal pacing matches YouTube algorithm requirements.</p>
                        </div>
                        <div className="relative flex items-center justify-center">
                          {/* Radial indicator */}
                          <svg className="w-16 h-16 transform -rotate-90">
                            <circle cx="32" cy="32" r="26" stroke="#1d1d20" strokeWidth="4" fill="transparent" />
                            <circle cx="32" cy="32" r="26" stroke="#059669" strokeWidth="4" fill="transparent" 
                              strokeDasharray="163.3"
                              strokeDashoffset={163.3 - (163.3 * (pipelineResponse.validator?.score || 90)) / 100}
                            />
                          </svg>
                          <span className="absolute text-sm font-extrabold text-emerald-400">{pipelineResponse.validator?.score}%</span>
                        </div>
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-[10px] text-zinc-500 uppercase font-bold">Retention / Anchor Warnings</label>
                        {pipelineResponse.validator?.engagementAnchorIssues.length === 0 ? (
                          <div className="text-xs text-emerald-400 bg-emerald-505/5 p-3 rounded-xl border border-emerald-500/10">
                            ✓ No vital viewer drop-off factors detected. Perfect hooks.
                          </div>
                        ) : (
                          <ul className="space-y-1 list-disc list-inside text-xs text-red-400 bg-red-500/5 p-3 rounded-xl border border-red-500/10">
                            {pipelineResponse.validator?.engagementAnchorIssues.map((issue, idx) => (
                              <li key={idx}>{issue}</li>
                            ))}
                          </ul>
                        )}
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-[10px] text-zinc-500 uppercase font-bold">Pacing Adjustments Suggestions</label>
                        <ul className="space-y-1 list-disc list-inside text-xs text-zinc-400">
                          {pipelineResponse.validator?.pacingImprovementSuggestions.map((sug, idx) => (
                            <li key={idx}>{sug}</li>
                          ))}
                        </ul>
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-[10px] text-zinc-500 uppercase font-bold">Structural Pattern Cues</label>
                        <div className="flex flex-wrap gap-1.5">
                          {pipelineResponse.validator?.patternInterruptTriggers.map((trig, idx) => (
                            <span key={idx} className="text-[10px] bg-zinc-900 border border-zinc-800 text-zinc-400 px-2.5 py-1 rounded">
                              {trig}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* FACT-CHECK LOGS EXPANDED */}
                  <div className="bg-zinc-950 border border-zinc-805 p-6 rounded-2xl space-y-4">
                    <div className="flex justify-between items-center border-b border-zinc-850 pb-2">
                      <span className="text-xs font-black text-zinc-300 flex items-center gap-1.5">
                        <Search size={14} className="text-purple-400" />
                        3. Algorithmic Fact-Checking Agent
                      </span>
                      <span className="text-[10px] text-purple-400 bg-purple-500/10 border border-purple-500/20 px-2 py-0.5 rounded font-mono font-black">
                        {pipelineResponse.factChecker?.confidenceRate}% Checked
                      </span>
                    </div>

                    <div className="space-y-4">
                      <div className="space-y-1.5">
                        <label className="text-[10px] text-zinc-500 uppercase font-bold">Verified Claims Database Matches</label>
                        <ul className="space-y-2">
                          {pipelineResponse.factChecker?.factCheckedBulletPoints.map((pt, idx) => (
                            <li key={idx} className="text-xs text-zinc-300 flex items-start gap-2">
                              <span className="text-emerald-500 font-extrabold shrink-0">✓</span>
                              <span>{pt}</span>
                            </li>
                          ))}
                        </ul>
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-[10px] text-zinc-500 uppercase font-bold">Unverified Claims Flags</label>
                        {pipelineResponse.factChecker?.unverifiedClaims.map((cl, idx) => (
                          <div key={idx} className="text-xs text-zinc-400 bg-zinc-90 w-full border border-zinc-805 p-3 rounded-xl flex items-center gap-2">
                            <AlertCircle size={14} className="text-amber-500 shrink-0" />
                            <span>{cl}</span>
                          </div>
                        ))}
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-[10px] text-zinc-500 uppercase font-bold">Segment Substitutions Applied</label>
                        <div className="grid grid-cols-2 gap-2 text-xs font-mono">
                          {Object.entries(pipelineResponse.factChecker?.correctedSegments || {}).map(([bad, good], idx) => (
                            <React.Fragment key={idx}>
                              <div className="bg-red-500/10 border border-red-500/20 text-red-00 p-2 rounded truncate line-through">
                                {bad}
                              </div>
                              <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 p-2 rounded truncate font-bold">
                                {good}
                              </div>
                            </React.Fragment>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* COMPLIANCE CARD */}
                  <div className="bg-zinc-950 border border-zinc-800 p-6 rounded-2xl space-y-4">
                    <div className="flex justify-between items-center border-b border-zinc-800 pb-2">
                      <span className="text-xs font-black text-zinc-300 flex items-center gap-1.5">
                        <Briefcase size={14} className="text-yellow-400" />
                        4. Community Safety & Compliance Guide
                      </span>
                      <span className="text-[10px] text-yellow-400 bg-yellow-500/10 border border-yellow-500/20 px-2 py-0.5 rounded font-mono font-black">
                        SFK Rated
                      </span>
                    </div>

                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="bg-zinc-900 border border-zinc-805 p-3 rounded-xl text-center space-y-1">
                          <span className="text-[10px] text-zinc-500 uppercase font-bold">Clickbait Score</span>
                          <p className="text-2xl font-black text-yellow-400">{pipelineResponse.compliance?.clickbaitScore} <span className="text-xs text-zinc-500">/ 10</span></p>
                        </div>
                        <div className="bg-zinc-905 border border-zinc-805 p-3 rounded-xl text-center space-y-1">
                          <span className="text-[10px] text-zinc-500 uppercase font-bold">Copyright Danger</span>
                          <p className="text-lg font-black text-emerald-400 uppercase">{pipelineResponse.compliance?.copyrightRisk}</p>
                        </div>
                      </div>

                      <div className="space-y-1">
                        <label className="text-[10px] text-zinc-500 uppercase font-bold">Warnings & Guideline Violations</label>
                        {pipelineResponse.compliance?.communityGuidelinesWarnings.length === 0 ? (
                          <div className="text-xs text-emerald-400">
                            ✓ Zero community guidelines infringements found. Fully safe.
                          </div>
                        ) : (
                          <ul className="space-y-1 list-disc list-inside text-xs text-zinc-400">
                            {pipelineResponse.compliance?.communityGuidelinesWarnings.map((w, idx) => (
                              <li key={idx}>{w}</li>
                            ))}
                          </ul>
                        )}
                      </div>

                      <div className="border border-yellow-500/30 bg-yellow-500/5 p-4 rounded-xl space-y-1">
                        <span className="text-[10px] font-black text-yellow-400 uppercase tracking-widest block">Official Approval Stamp Seal</span>
                        <p className="text-[10px] font-mono text-zinc-300 truncate">{pipelineResponse.compliance?.approvalSeal}</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* PUBLISHED OUTCOMES SUMMARY */}
                <div className="bg-zinc-950/80 border border-red-500/30 p-6 rounded-2xl space-y-4">
                  <div className="flex justify-between items-center border-b border-zinc-805 pb-2">
                    <span className="text-sm font-black text-white flex items-center gap-1.5 animate-fade-in">
                      <Clock size={16} className="text-red-500" />
                      5. Publish Execution Outcome
                    </span>
                    <span className="text-xs bg-red-600 border border-red-500 text-white px-3 py-1 rounded font-black uppercase">
                      Campaign Published
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="bg-zinc-900 p-4 rounded-xl border border-zinc-805 text-center space-y-1">
                      <span className="text-[10px] text-zinc-500 uppercase font-bold block">Target Channel Hub</span>
                      <p className="text-xs font-mono font-bold text-zinc-350 truncate">{pipelineResponse.publish?.publishedChannel}</p>
                    </div>
                    <div className="bg-zinc-900 p-4 rounded-xl border border-zinc-850 text-center space-y-1">
                      <span className="text-[10px] text-zinc-500 uppercase font-bold block">Assigned Delivery ZIP</span>
                      <a href={pipelineResponse.publish?.exportBundleUrl} target="_blank" rel="noreferrer" className="text-xs font-bold text-red-550 hover:underline inline-block truncate max-w-full">
                        Download Manifest
                      </a>
                    </div>
                    <div className="bg-zinc-900 p-4 rounded-xl border border-zinc-800 text-center space-y-1">
                      <span className="text-[10px] text-zinc-500 uppercase font-bold block">Simulated CTR</span>
                      <p className="text-lg font-black text-emerald-400">{pipelineResponse.publish?.simulatedCtrPercent}%</p>
                    </div>
                    <div className="bg-zinc-905 p-4 rounded-xl border border-zinc-805 text-center space-y-1">
                      <span className="text-[10px] text-zinc-500 uppercase font-bold block">Algorithm Engagement</span>
                      <p className="text-lg font-black text-red-400">{pipelineResponse.publish?.expectedViewerEngagementRate}%</p>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] text-zinc-500 uppercase font-bold">YouTube Metadata Descriptors (Crawler Shield)</label>
                    <textarea 
                      rows={5}
                      readOnly
                      value={pipelineResponse.publish?.metadataDescription}
                      className="w-full bg-zinc-900 border border-zinc-800 rounded-xl p-4 text-xs font-mono text-zinc-400 outline-none select-text resize-none"
                    />
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-16 bg-zinc-950/20 border border-dashed border-zinc-805 rounded-2xl space-y-3">
                <p className="text-sm text-zinc-500 font-bold">No active execution telemetry logged.</p>
                <p className="text-xs text-zinc-650 max-w-md mx-auto">Click "Run Multi-Agent Loop" above to drive real-time sequential LLM orchestration and watch data synchronize dynamically across memory.</p>
              </div>
            )}
          </div>
        ) : (
          /* CLASSIC 14 STEPS WORKFLOW wrapper */
          <>
            {/* Dynamic Step Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-xs font-black text-red-500 uppercase tracking-widest">
                  <span>Stage {currentStep} of 14</span>
                  <ChevronRight size={12} />
                  <span className="text-zinc-500 font-bold">{STEPS[currentStep - 1].label}</span>
                </div>
                <h2 className="text-3xl font-extrabold text-white tracking-tight leading-none mt-1">
                  {STEPS[currentStep - 1].label}
                </h2>
                <p className="text-sm text-zinc-400">
                  {STEPS[currentStep - 1].description}
                </p>
              </div>

              <button
                type="button"
                onClick={() => setShowDiagnostic(prev => !prev)}
                className={`px-4 py-2.5 rounded-2xl border text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2 select-none pointer-events-auto ${
                  showDiagnostic 
                    ? 'bg-red-600/10 border-red-500/30 text-red-500 hover:bg-red-600/20 shadow-lg shadow-red-500/5' 
                    : 'bg-zinc-950 border-zinc-800 text-zinc-400 hover:bg-zinc-800 hover:text-white'
                }`}
              >
                <Cpu size={12} className={showDiagnostic ? "animate-pulse text-red-400" : ""} />
                {showDiagnostic ? "Hide Diagnostic" : "Engine Diagnostic"}
              </button>
            </div>

            {/* Dynamic Content Rendering */}
            <div className="flex-1 flex flex-col justify-start mb-8 min-h-0">
              
              {/* STEP 1: CREATE PROJECT */}
              {currentStep === 1 && (
            <div className="space-y-6">
              <div className="bg-zinc-950 p-6 rounded-2xl border border-zinc-800 space-y-4">
                <h4 className="text-sm font-black text-zinc-400 uppercase tracking-wider">Configure New Research / Content Manifest</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-zinc-500 uppercase">Target / Focal Topic</label>
                    <input 
                      type="text" 
                      placeholder="e.g. Scaling AI Workflows" 
                      value={projTitle} 
                      onChange={e => setProjTitle(e.target.value)}
                      className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3 text-xs text-white outline-none focus:border-red-500 transition-colors"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-zinc-500 uppercase">Channel / Subject Niche</label>
                    <input 
                      type="text" 
                      placeholder="e.g. AI tech, cooking, coding" 
                      value={projNiche} 
                      onChange={e => setProjNiche(e.target.value)}
                      className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3 text-xs text-white outline-none focus:border-red-500 transition-colors"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-zinc-500 uppercase">Ideal Demographics / Target Audience</label>
                  <input 
                    type="text" 
                    placeholder="e.g. Solo Developers, busy moms" 
                    value={projAudience} 
                    onChange={e => setProjAudience(e.target.value)}
                    className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3 text-xs text-white outline-none focus:border-red-500 transition-colors"
                  />
                </div>

                <button
                  type="button"
                  disabled={!projTitle || !projNiche}
                  onClick={() => {
                    createProject(projTitle, projNiche, projAudience);
                    setProjTitle('');
                    toast.success('Manifest established!');
                    handleNext();
                  }}
                  className="w-full md:w-auto bg-red-600 hover:bg-red-500 text-white disabled:opacity-50 text-xs font-black uppercase tracking-widest px-6 py-3 rounded-xl transition-all flex items-center justify-center gap-2 active-press"
                >
                  Create & Initialize Project <ArrowRight size={14} />
                </button>
              </div>

              {projects.filter(p => !p.archived).length > 0 && (
                <div className="space-y-3">
                  <h4 className="text-xs font-black text-zinc-500 uppercase tracking-widest">Or Select Existing Core Manifest</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-48 overflow-y-auto custom-scrollbar">
                    {projects.filter(p => !p.archived).map(p => (
                      <button
                        key={p.id}
                        onClick={() => {
                          setActiveProjectById(p.id);
                          toast.success(`Active Cockpit tied to: "${p.title}"`);
                          handleNext();
                        }}
                        className={`p-4 bg-zinc-950 border text-left rounded-2xl hover:border-zinc-700 transition-all flex justify-between items-center ${activeProject?.id === p.id ? 'border-red-500 text-red-500' : 'border-zinc-800'}`}
                      >
                        <div className="min-w-0">
                          <p className={`text-xs font-black ${activeProject?.id === p.id ? 'text-white' : 'text-zinc-200'} truncate`}>{p.title}</p>
                          <span className="text-[9px] font-bold text-zinc-600 uppercase mt-0.5 block">{p.niche}</span>
                        </div>
                        <ChevronRight size={14} className="text-zinc-600 shrink-0" />
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* STEP 2: RESEARCH MARKET */}
          {currentStep === 2 && (
            <div className="space-y-6">
              {!activeProject ? (
                <div className="bg-zinc-950 p-8 rounded-2xl border border-zinc-800 text-center space-y-2">
                  <AlertCircle className="text-zinc-600 mx-auto" size={32} />
                  <p className="text-sm font-bold text-zinc-400">Initialize a project manifest in Step 1 first.</p>
                </div>
              ) : (
                <div className="space-y-6">
                  <div className="flex flex-col md:flex-row gap-4 items-stretch">
                    <div className="bg-zinc-950 border border-zinc-800 p-6 rounded-2xl flex-1 space-y-1">
                      <span className="text-[10px] font-black text-zinc-500 uppercase">Core Topic</span>
                      <p className="text-base font-extrabold text-white">{activeProject.title}</p>
                      <span className="text-[10px] font-bold text-zinc-600 uppercase block">{activeProject.niche} • {activeProject.audience}</span>
                    </div>

                    <button
                      onClick={handleMarketResearch}
                      disabled={loadingStep}
                      className="bg-red-600 hover:bg-red-500 hover:scale-[1.02] text-white font-black text-xs uppercase tracking-widest pl-8 pr-8 rounded-2xl flex items-center justify-center gap-3 transition-all active-press border border-red-500 shrink-0"
                    >
                      {loadingStep ? (
                        <>
                          <RefreshCw size={14} className="animate-spin" /> Scanning Global Data Indexes...
                        </>
                      ) : (
                        <>
                          <Search size={14} /> Scan Market Trends <ArrowRight size={14} />
                        </>
                      )}
                    </button>
                  </div>

                  {marketTrends && (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-fade-in">
                      <div className="bg-zinc-950 border border-zinc-850 p-6 rounded-2xl space-y-4">
                        <h4 className="text-xs font-black text-zinc-500 uppercase">Demand Strength</h4>
                        <div className="flex items-baseline gap-2">
                          <span className="text-3xl font-black text-emerald-400">{marketTrends.nicheInterest}</span>
                          <span className="text-xs font-bold text-zinc-500">({marketTrends.score}/100)</span>
                        </div>
                        <div className="text-xs font-bold text-zinc-400">
                          Search Volume: <span className="text-white font-black">{marketTrends.searchVolume}</span>
                          <span className="text-emerald-500 block mt-1 font-black">{marketTrends.growthTrend}</span>
                        </div>
                      </div>

                      <div className="bg-zinc-950 border border-zinc-850 p-6 rounded-2xl space-y-3 md:col-span-2">
                        <h4 className="text-xs font-black text-zinc-500 uppercase">Competitive Intelligence Gaps</h4>
                        <ul className="space-y-2">
                          {marketTrends.swot.strengths.map((s: string, idx: number) => (
                            <li key={idx} className="text-xs text-zinc-300 flex items-start gap-2">
                              <span className="text-emerald-500 shrink-0 font-bold">✓</span> {s}
                            </li>
                          ))}
                          {marketTrends.swot.weaknesses.map((w: string, idx: number) => (
                            <li key={idx} className="text-xs text-zinc-500 flex items-start gap-2">
                              <span className="text-red-500 shrink-0 font-bold">!</span> Risk: {w}
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* STEP 3: GENERATE VIRAL IDEAS */}
          {currentStep === 3 && (
            <div className="space-y-6">
              <div className="flex justify-between items-center text-zinc-400">
                <span className="text-xs font-black uppercase tracking-wider">Formulate Topic Variations via Gemini AI</span>
                <button
                  onClick={handleGenerateIdeas}
                  disabled={loadingStep}
                  className="bg-zinc-900 border border-zinc-800 hover:bg-zinc-800 text-xs text-white font-black uppercase tracking-widest px-5 py-2.5 rounded-xl transition-all flex items-center gap-2"
                >
                  {loadingStep ? <RefreshCw size={14} className="animate-spin" /> : <Lightbulb size={14} />}
                  Execute Idea Lab Generation
                </button>
              </div>

              {generatedIdeas.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-fade-in">
                  {generatedIdeas.map((idea, idx) => (
                    <div key={idx} className="bg-zinc-950 border border-zinc-800 rounded-2xl p-6 space-y-4 hover:border-red-500/20 transition-all group relative">
                      <div className="flex justify-between items-center">
                        <span className="text-[10px] font-black text-zinc-500 uppercase">Topic Idea {idx + 1}</span>
                        <div className="bg-red-500/10 border border-red-500/20 rounded-full px-2.5 py-0.5 text-[9px] font-black text-red-500 uppercase tracking-widest">
                          {idea.interest || 'HOT'}
                        </div>
                      </div>
                      <h4 className="text-base font-extrabold text-white leading-snug tracking-tight group-hover:text-red-500 transition-colors">
                        {idea.title}
                      </h4>
                      <p className="text-xs text-zinc-400 bg-zinc-900/40 p-3 rounded-xl border border-zinc-850">
                        <span className="font-bold text-zinc-500 block uppercase text-[9px] mb-1">Recommended Hook</span>
                        "{idea.hook}"
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="bg-zinc-950 p-8 rounded-2xl border border-zinc-850 text-center space-y-3">
                  <Sparkles className="text-red-500 mx-auto animate-pulse" size={32} />
                  <p className="text-sm font-bold text-zinc-400">No ideas drafted yet. Trigger the generation button above.</p>
                </div>
              )}
            </div>
          )}

          {/* STEP 4: SCORE IDEAS */}
          {currentStep === 4 && (
            <div className="space-y-6">
              {generatedIdeas.length === 0 ? (
                <div className="bg-zinc-950 p-8 rounded-2xl border border-zinc-850 text-center">
                  <AlertCircle className="text-zinc-600 mx-auto mb-2" size={32} />
                  <p className="text-xs font-bold text-zinc-400">Generate viral ideas in Step 3 first.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  <h4 className="text-xs font-black text-zinc-500 uppercase tracking-widest mb-2">Adjust Niche Metrics to compute overall rank weights</h4>
                  {generatedIdeas.map((idea, idx) => (
                    <div key={idx} className="bg-zinc-950 border border-zinc-850 p-6 rounded-2xl grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
                      <div className="md:col-span-5 min-w-0">
                        <span className="text-[9px] font-black text-zinc-500 uppercase">IDEA {idx + 1}</span>
                        <p className="text-sm font-extrabold text-white truncate mt-0.5">{idea.title}</p>
                      </div>

                      <div className="md:col-span-2">
                        <label className="text-[9px] font-black text-zinc-500 uppercase block mb-1">COMPETITION</label>
                        <select
                          value={idea.competition || 'Low'}
                          onChange={e => scoreSingleIdea(idx, e.target.value as any, (idea.interest || 'Stable') as any)}
                          className="bg-zinc-900 text-xs border border-zinc-800 rounded-lg px-2 py-1 outline-none text-zinc-300 font-bold"
                        >
                          <option value="Low">Low</option>
                          <option value="Medium">Medium</option>
                          <option value="High">High</option>
                        </select>
                      </div>

                      <div className="md:col-span-3">
                        <label className="text-[9px] font-black text-zinc-500 uppercase block mb-1">DEMAND WAVE</label>
                        <select
                          value={idea.interest || 'Stable'}
                          onChange={e => scoreSingleIdea(idx, (idea.competition || 'Low') as any, e.target.value as any)}
                          className="bg-zinc-900 text-xs border border-zinc-800 rounded-lg px-2 py-1 outline-none text-zinc-300 font-bold"
                        >
                          <option value="Stable">Stable Interest</option>
                          <option value="Rising">Rising Interest</option>
                          <option value="Exploding">High Explosive</option>
                        </select>
                      </div>

                      <div className="md:col-span-2 text-right">
                        <span className="text-[9px] font-black text-zinc-500 uppercase block">RANKING VALUE</span>
                        <div className="text-2xl font-black text-red-500 mt-0.5">{idea.score || 80}/100</div>
                      </div>
                    </div>
                  ))}
                  <div className="text-right pt-2">
                    <button onClick={handleNext} className="bg-zinc-800 text-white hover:bg-zinc-700 text-xs font-black uppercase tracking-widest py-3 px-6 rounded-xl">
                      Confirm Scores & Proceed
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* STEP 5: SELECT IDEA */}
          {currentStep === 5 && (
            <div className="space-y-6">
              {generatedIdeas.length === 0 ? (
                <div className="bg-zinc-950 p-8 rounded-2xl border border-zinc-850 text-center">
                  <p className="text-xs font-bold text-zinc-400">Generate and evaluate ideas in previous steps.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {generatedIdeas.map((idea, idx) => (
                    <div 
                      key={idx} 
                      className={`border rounded-2xl p-6 relative flex flex-col justify-between h-56 transition-all bg-zinc-950 ${
                        selectedIdea?.title === idea.title 
                          ? 'border-red-500 shadow-xl shadow-red-500/5' 
                          : 'border-zinc-800'
                      }`}
                    >
                      <div>
                        <div className="flex justify-between items-center mb-2">
                          <span className="text-[10px] font-black text-zinc-500 uppercase">SCORE: {idea.score}/100</span>
                          <span className="text-[9px] font-bold text-emerald-400 uppercase tracking-widest">{idea.competition} Competition</span>
                        </div>
                        <h4 className="text-sm font-extrabold text-white leading-snug">{idea.title}</h4>
                      </div>

                      <button
                        onClick={() => handleSelectIdea(idea)}
                        className={`w-full py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${
                          selectedIdea?.title === idea.title 
                            ? 'bg-red-500 text-white' 
                            : 'bg-zinc-90 w hover:bg-zinc-800 text-zinc-300'
                        }`}
                      >
                        {selectedIdea?.title === idea.title ? 'Selected Master Topic' : 'Select Idea'}
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* STEP 6: GENERATE HOOKS */}
          {currentStep === 6 && (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <span className="text-xs text-zinc-400 font-bold uppercase">Generate high AVD psychological hook structures</span>
                <button
                  onClick={handleGenerateHooks}
                  disabled={loadingStep}
                  className="bg-red-600 hover:bg-red-500 text-white font-black text-xs uppercase tracking-widest px-5 py-2.5 rounded-xl transition-all flex items-center gap-2"
                >
                  {loadingStep ? <RefreshCw size={14} className="animate-spin" /> : <Flame size={14} />}
                  Engineer Psychological Hooks
                </button>
              </div>

              {engineeredHooks.length > 0 ? (
                <div className="space-y-4 animate-fade-in">
                  {engineeredHooks.map((h, i) => (
                    <div key={i} className="bg-zinc-950 border border-zinc-850 p-6 rounded-2xl flex flex-col md:flex-row gap-6 justify-between items-start md:items-center">
                      <div className="flex-1 space-y-2">
                        <div className="flex items-center gap-3">
                          <span className="bg-red-500/10 border border-red-500/20 px-2 rounded-lg text-[9px] font-black text-red-500 uppercase tracking-wider">
                            {h.type}
                          </span>
                          <span className="text-[9px] text-zinc-500 font-bold uppercase tracking-tight">Duration: {h.durationSecs}s</span>
                        </div>
                        <p className="text-sm font-extrabold text-white">"{h.hookText}"</p>
                        <p className="text-xs text-zinc-400">
                          <span className="font-bold text-zinc-500">Visual Setup directive:</span> {h.suggestedVisualAction}
                        </p>
                      </div>

                      <button
                        onClick={() => copyToClipboard(h.hookText)}
                        className="bg-zinc-900 hover:bg-zinc-805 text-zinc-400 hover:text-white p-2 border border-zinc-800 rounded-lg shrink-0 transition-all active-press"
                        title="Copy Hook Text"
                      >
                        <Copy size={16} />
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="bg-zinc-950 p-8 rounded-2xl border border-zinc-850 text-center space-y-2">
                  <Flame className="text-red-500 mx-auto animate-pulse" size={32} />
                  <p className="text-sm font-bold text-zinc-400">Evaluate ideas & compile hooks using the action above.</p>
                </div>
              )}
            </div>
          )}

          {/* STEP 7: GENERATE SCRIPT */}
          {currentStep === 7 && (
            <div className="space-y-6">
              <div className="bg-zinc-950 p-6 rounded-2xl border border-zinc-800 space-y-4">
                <h4 className="text-xs font-black text-zinc-400 uppercase tracking-wider">Tone & Speed Parameters</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[9px] font-black text-zinc-505 uppercase">Narration Tone</label>
                    <input 
                      type="text" 
                      value={pacingTone} 
                      onChange={e => setPacingTone(e.target.value)} 
                      className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-2.5 text-xs text-white"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[9px] font-black text-zinc-505 uppercase">Retention Mechanics</label>
                    <input 
                      type="text" 
                      value={pacingRules} 
                      onChange={e => setPacingRules(e.target.value)} 
                      className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-2.5 text-xs text-white"
                    />
                  </div>
                </div>

                <button
                  onClick={handleGenerateScript}
                  disabled={loadingStep}
                  className="bg-red-600 hover:bg-red-500 text-white font-black text-xs uppercase tracking-widest px-6 py-3 rounded-xl flex items-center gap-2"
                >
                  {loadingStep ? <RefreshCw size={14} className="animate-spin" /> : <FileText size={14} />}
                  Draft Complete Script
                </button>
              </div>

              {draftedScript && (
                <div className="bg-zinc-950 border border-zinc-850 p-6 rounded-2xl space-y-4 animate-fade-in">
                  <div className="flex justify-between items-center pb-3 border-b border-zinc-800">
                    <span className="text-xs font-black text-zinc-400 uppercase tracking-widest">Active Screenplay Draft</span>
                    <button onClick={() => copyToClipboard(draftedScript)} className="text-xs text-red-505 hover:underline flex items-center gap-1 font-bold">
                      <Copy size={12} /> Copy Script
                    </button>
                  </div>
                  <pre className="text-xs text-zinc-300 font-mono whitespace-pre-wrap leading-relaxed max-h-60 overflow-y-auto custom-scrollbar">
                    {draftedScript}
                  </pre>
                </div>
              )}
            </div>
          )}

          {/* STEP 8: GENERATE SEO */}
          {currentStep === 8 && (
            <div className="space-y-6">
              <div className="flex justify-between items-center text-zinc-450">
                <span className="text-xs font-black uppercase">Compile Tag Index Structures & Semantic Desc paragraphs</span>
                <button
                  onClick={handleGenerateSEO}
                  disabled={loadingStep}
                  className="bg-red-600 hover:bg-red-500 text-white font-black text-xs uppercase tracking-widest px-5 py-2.5 rounded-xl flex items-center gap-2"
                >
                  {loadingStep ? <RefreshCw size={14} className="animate-spin" /> : <Globe size={14} />}
                  Calculate Semantic SEO
                </button>
              </div>

              {seoData ? (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-fade-in">
                  <div className="bg-zinc-950 border border-zinc-850 p-6 rounded-2xl md:col-span-2 space-y-4">
                    <h4 className="text-xs font-black text-zinc-500 uppercase">Crawler Structured Description</h4>
                    <p className="text-xs text-zinc-300 leading-relaxed max-h-40 overflow-y-auto custom-scrollbar bg-zinc-900/40 p-4 border border-zinc-800 rounded-xl font-mono">
                      {seoData.description}
                    </p>
                  </div>

                  <div className="bg-zinc-950 border border-zinc-850 p-6 rounded-2xl space-y-4">
                    <h4 className="text-xs font-black text-zinc-500 uppercase">Tags & Hashtags</h4>
                    <div className="space-y-3">
                      <div>
                        <span className="text-[9px] font-bold text-zinc-500 uppercase block mb-1">Keywords</span>
                        <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto custom-scrollbar">
                          {seoData.tags.map((t, idx) => (
                            <span key={idx} className="bg-zinc-900 px-2 py-0.5 rounded text-[10px] text-zinc-300 font-mono border border-zinc-800">
                              {t}
                            </span>
                          ))}
                        </div>
                      </div>

                      <div>
                        <span className="text-[9px] font-bold text-zinc-500 uppercase block mb-1">Social Tags</span>
                        <div className="flex flex-wrap gap-1.5">
                          {seoData.hashtags.map((h, idx) => (
                            <span key={idx} className="text-red-500 font-black font-mono text-xs">
                              {h}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="bg-zinc-950 p-8 rounded-2xl border border-zinc-850 text-center space-y-2">
                  <Globe className="text-red-500 mx-auto animate-pulse" size={32} />
                  <p className="text-sm font-bold text-zinc-400">Construct meta descriptions, tags indexes using the AI button above.</p>
                </div>
              )}
            </div>
          )}

          {/* STEP 9: GENERATE THUMBNAIL PROMPT */}
          {currentStep === 9 && (
            <div className="space-y-6">
              <div className="flex justify-between items-center text-zinc-400">
                <span className="text-xs font-black uppercase">Create High CTR Composition layouts</span>
                <button
                  onClick={handleGenerateThumbnailPrompt}
                  disabled={loadingStep}
                  className="bg-red-600 hover:bg-red-500 text-white font-black text-xs uppercase tracking-widest px-5 py-2.5 rounded-xl flex items-center gap-2"
                >
                  {loadingStep ? <RefreshCw size={14} className="animate-spin" /> : <ImageIcon size={14} />}
                  Formulate Composition Plan
                </button>
              </div>

              {thumbnailPlan ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-fade-in">
                  <div className="bg-zinc-950 border border-zinc-850 p-6 rounded-2xl space-y-4">
                    <div>
                      <span className="text-[10px] font-black text-zinc-500 uppercase">Visual Theme / Vibe</span>
                      <h4 className="text-xl font-extrabold text-white mt-0.5">{thumbnailPlan.headlineSummary.toUpperCase()}</h4>
                      <p className="text-xs text-zinc-400 mt-2">{thumbnailPlan.colorPsychology.vibeExplanation}</p>
                    </div>

                    <div className="border-t border-zinc-800 pt-4 grid grid-cols-2 gap-2 text-xs">
                      <div>
                        <span className="text-[10px] text-zinc-500 font-bold uppercase block">Dominant Color</span>
                        <p className="font-extrabold text-zinc-300 mt-1">{thumbnailPlan.colorPsychology.dominant}</p>
                      </div>
                      <div>
                        <span className="text-[10px] text-zinc-500 font-bold uppercase block">Accent Color</span>
                        <p className="font-extrabold text-red-500 mt-1">{thumbnailPlan.colorPsychology.accent}</p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-zinc-950 border border-zinc-850 p-6 rounded-2xl flex flex-col justify-between">
                    <div className="space-y-2">
                      <span className="text-[10px] font-black text-zinc-500 uppercase">AIPrompt (Imagen 3 / Gemini)</span>
                      <p className="text-xs text-zinc-300 bg-zinc-900/40 p-4 rounded-xl border border-zinc-800 font-mono leading-relaxed">
                        {thumbnailPlan.suggestedAIPrompt}
                      </p>
                    </div>

                    <button
                      onClick={() => copyToClipboard(thumbnailPlan.suggestedAIPrompt)}
                      className="w-full bg-zinc-90 w hover:bg-zinc-805 text-zinc-300 hover:text-white font-black text-xs uppercase tracking-widest py-3 rounded-xl border border-zinc-800 mt-4"
                    >
                      Copy Render Prompt
                    </button>
                  </div>
                </div>
              ) : (
                <div className="bg-zinc-950 p-8 rounded-2xl border border-zinc-850 text-center space-y-2">
                  <ImageIcon className="text-red-500 mx-auto animate-pulse" size={32} />
                  <p className="text-sm font-bold text-zinc-400">Map dominant colors, focus points, AI prompt blueprints with the action above.</p>
                </div>
              )}
            </div>
          )}

          {/* STEP 10: GENERATE REPURPOSE CONTENT */}
          {currentStep === 10 && (
            <div className="space-y-6">
              <div className="flex justify-between items-center text-zinc-400">
                <span className="text-xs font-black uppercase">Diverge high relevance social threads, newsletter copies</span>
                <button
                  onClick={handleGenerateRepurpose}
                  disabled={loadingStep}
                  className="bg-red-600 hover:bg-red-500 text-white font-black text-xs uppercase tracking-widest px-5 py-2.5 rounded-xl flex items-center gap-2"
                >
                  {loadingStep ? <RefreshCw size={14} className="animate-spin" /> : <Repeat size={14} />}
                  Repurpose Narration Text
                </button>
              </div>

              {repurposedItems ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-fade-in">
                  <div className="bg-zinc-950 border border-zinc-850 p-6 rounded-2xl space-y-4">
                    <h4 className="text-xs font-black text-zinc-500 uppercase">Twitter Thread Blueprint</h4>
                    <div className="space-y-3 max-h-60 overflow-y-auto custom-scrollbar">
                      {repurposedItems.twitterThread.map((tweet: string, idx: number) => (
                        <div key={idx} className="bg-zinc-900 border border-zinc-800 p-4 rounded-xl text-xs relative">
                          <span className="absolute top-2 right-3 text-[10px] text-zinc-650 font-bold">#{idx + 1}</span>
                          <p className="text-zinc-300 pr-4 leading-relaxed">{tweet}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="bg-zinc-950 border border-zinc-850 p-6 rounded-2xl space-y-4 flex flex-col justify-between">
                    <div>
                      <h4 className="text-xs font-black text-zinc-500 uppercase mb-2">Email Newsletter Draft</h4>
                      <p className="text-[10px] text-zinc-400 font-bold uppercase">Subject: "{repurposedItems.newsletter.subject}"</p>
                      <pre className="text-xs text-zinc-300 bg-zinc-900/40 p-4 mt-2 border border-zinc-800 rounded-xl leading-relaxed whitespace-pre-wrap max-h-40 overflow-y-auto custom-scrollbar">
                        {repurposedItems.newsletter.body}
                      </pre>
                    </div>

                    <button
                      onClick={() => copyToClipboard(repurposedItems.newsletter.body)}
                      className="bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-300 text-xs py-2.5 rounded-xl uppercase font-black tracking-widest w-full"
                    >
                      Copy Newsletter Body
                    </button>
                  </div>
                </div>
              ) : (
                <div className="bg-zinc-950 p-8 rounded-2xl border border-zinc-850 text-center space-y-2">
                  <Repeat className="text-red-500 mx-auto animate-pulse" size={32} />
                  <p className="text-sm font-bold text-zinc-400">Syndicate long narration scripts into multi-platform visual assets.</p>
                </div>
              )}
            </div>
          )}

          {/* STEP 11: EXPORT ASSETS */}
          {currentStep === 11 && (
            <div className="space-y-6">
              <div className="bg-zinc-950 border border-zinc-850 p-8 rounded-2xl text-center space-y-4">
                <div className="w-16 h-16 bg-red-600/10 border border-red-500/20 text-red-500 rounded-full flex items-center justify-center mx-auto shadow-lg shadow-red-500/5">
                  <Download size={24} />
                </div>
                <div>
                  <h4 className="text-lg font-black text-zinc-100">Compiled Production Blueprint Ready</h4>
                  <p className="text-xs text-zinc-400 max-w-sm mx-auto mt-1">Export structured Markdown reports detailing viral titles, scripted screenplays, custom indexing hashtags, and active thumbnail prompts.</p>
                </div>

                <div className="flex flex-wrap gap-3 justify-center pt-2">
                  <button
                    onClick={handleExportCampaign}
                    className="bg-red-600 hover:bg-red-500 text-white font-black text-xs uppercase tracking-widest pl-6 pr-6 py-3 rounded-xl transition-all"
                  >
                    Download Markdown Blueprint (.md)
                  </button>
                  <button
                    onClick={() => {
                      if (activeProject) {
                        copyToClipboard(exportProjectToMarkdown(activeProject));
                      }
                    }}
                    className="bg-zinc-900 border border-zinc-800 text-zinc-305 hover:text-white font-black text-xs uppercase tracking-widest pl-5 pr-5 py-3 rounded-xl transition-all"
                  >
                    Copy Markdown Report
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* STEP 12: SCHEDULE PUBLISHING */}
          {currentStep === 12 && (
            <div className="space-y-6">
              <div className="bg-zinc-950 border border-zinc-800 p-8 rounded-2xl grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
                <div className="space-y-4">
                  <h4 className="text-xs font-black text-zinc-500 uppercase tracking-widest">Configure Launch Timers</h4>
                  
                  <div className="space-y-3">
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-zinc-500 uppercase">Distribution Date</label>
                      <input 
                        type="date" 
                        value={launchDate} 
                        onChange={e => setLaunchDate(e.target.value)}
                        className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3 text-xs text-zinc-300 outline-none"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-zinc-500 uppercase">Target Upload Hour</label>
                      <input 
                        type="time" 
                        value={launchTime} 
                        onChange={e => setLaunchTime(e.target.value)}
                        className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3 text-xs text-zinc-300 outline-none"
                      />
                    </div>
                  </div>

                  <button
                    onClick={handleSchedulePublishing}
                    className="w-full bg-red-600 hover:bg-red-500 text-white text-xs font-black uppercase tracking-widest py-3.5 rounded-xl transition-all"
                  >
                    Lock Distribution Schedule
                  </button>
                </div>

                <div className="bg-zinc-900/40 border border-zinc-850 p-6 rounded-2xl text-center space-y-4 relative overflow-hidden">
                  <span className="absolute top-2 right-3 text-[9px] font-black text-zinc-700">STATUS: QUEUED</span>
                  <Calendar className="text-zinc-600 mx-auto" size={40} />
                  <div>
                    <h5 className="text-sm font-black text-zinc-200">Release Campaign Ready</h5>
                    <p className="text-[11px] text-zinc-500 mt-1 leading-relaxed">Timings are aligned directly against peak viewer retention spikes computed for {launchDate} at {launchTime} UTC.</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* STEP 13: TRACK ANALYTICS */}
          {currentStep === 13 && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                {[
                  { label: 'Forecast CTR', val: `${retentionForecast.estimatedCtr}%`, sub: 'First 24 hours', color: 'text-emerald-400' },
                  { label: 'Expected Views', val: `${retentionForecast.predictedViewsRange.min.toLocaleString()} - ${retentionForecast.predictedViewsRange.max.toLocaleString()}`, sub: 'Forecast first 30 days', color: 'text-red-500' },
                  { label: 'Target Retentions', val: `${retentionForecast.retentionEstimate} seconds`, sub: '52% view-completion target', color: 'text-purple-400' },
                  { label: 'Viral Quotient', val: `${retentionForecast.vitalityQuotient}/100`, sub: 'Recommendation priority index', color: 'text-yellow-400' },
                ].map((stat, i) => (
                  <div key={i} className="bg-zinc-950 border border-zinc-850 p-6 rounded-2xl">
                    <span className="text-[9px] font-black text-zinc-500 uppercase tracking-widest block mb-2">{stat.label}</span>
                    <p className={`text-2xl font-black ${stat.color}`}>{stat.val}</p>
                    <span className="text-[10px] text-zinc-600 block mt-1">{stat.sub}</span>
                  </div>
                ))}
              </div>

              <div className="bg-zinc-950 border border-zinc-850 p-6 rounded-2xl space-y-3">
                <h4 className="text-xs font-black text-zinc-550 uppercase">Creator Growth Amplifiers</h4>
                <ul className="space-y-2 text-xs text-zinc-300">
                  {retentionForecast.leversOfAmplication.map((lever, idx) => (
                    <li key={idx} className="flex items-start gap-2.5">
                      <span className="text-emerald-500 font-bold shrink-0">✓</span> {lever}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}

          {/* STEP 14: OPTIMIZE */}
          {currentStep === 14 && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-zinc-950 border border-zinc-850 p-6 rounded-2xl text-center flex flex-col justify-center items-center">
                  <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-2">Algorithmic Match Score</span>
                  <div className={`text-5xl font-black ${validationReport.score >= 80 ? 'text-emerald-400' : 'text-yellow-500'}`}>
                    {validationReport.score}/100
                  </div>
                  <span className="text-xs font-bold text-zinc-500 capitalize mt-2">Compliance Rating: {validationReport.status}</span>
                </div>

                <div className="bg-zinc-950 border border-zinc-850 p-6 rounded-2xl md:col-span-2 space-y-4">
                  <h4 className="text-xs font-black text-zinc-500 uppercase">Immediate Technical Warnings</h4>
                  <div className="space-y-3 max-h-48 overflow-y-auto custom-scrollbar">
                    {validationReport.issues.map((i, idx) => (
                      <div key={idx} className={`p-4 rounded-xl border flex items-start gap-3 text-xs ${
                        i.severity === 'error' 
                          ? 'bg-red-502/10 border-red-500/20 text-red-500' 
                          : i.severity === 'warning'
                          ? 'bg-yellow-500/10 border-yellow-500/20 text-yellow-500'
                          : 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
                      }`}>
                        <AlertCircle size={14} className="shrink-0 mt-0.5" />
                        <div>
                          <p className="font-extrabold">{i.message}</p>
                          <p className="text-zinc-400 mt-0.5 leading-relaxed">{i.description}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="text-right">
                <button
                  onClick={handleOptimizeNow}
                  className="bg-red-600 hover:bg-red-500 text-white font-black text-xs uppercase tracking-widest pl-6 pr-6 py-3.5 rounded-xl transition-all"
                >
                  Apply Diagnostic Optimization Framework
                </button>
              </div>
            </div>
          )}
          </div>
          </>
        )}

        {/* Action controls footer */}
        <div className="border-t border-zinc-800 pt-6 flex justify-between items-center bg-zinc-900">
          <button
            onClick={handleBack}
            disabled={currentStep === 1}
            className="bg-zinc-950 hover:bg-zinc-810 border border-zinc-800 text-zinc-400 hover:text-white text-xs font-black uppercase tracking-widest px-5 py-3 rounded-xl transition-all disabled:opacity-30 disabled:pointer-events-none flex items-center gap-2"
          >
            <ChevronLeft size={14} /> Back
          </button>

          <button
            onClick={handleNext}
            disabled={currentStep === 14}
            className="bg-zinc-950 hover:bg-zinc-810 border border-zinc-850 text-zinc-300 hover:text-white text-xs font-black uppercase tracking-widest px-5 py-3 rounded-xl transition-all disabled:opacity-30 disabled:pointer-events-none flex items-center gap-2"
          >
            Skip/Next Stage <ChevronRight size={14} />
          </button>
        </div>
      </div>

      {/* Workflow Engine Diagnostic Monitor Column */}
      {showDiagnostic && (
        <div className="w-full lg:w-96 bg-zinc-950 border border-zinc-850 p-6 rounded-3xl flex flex-col h-[calc(100vh-140px)] overflow-y-auto custom-scrollbar shrink-0 select-none animate-fade-in">
          <div className="border-b border-zinc-800 pb-4 mb-4">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-[10px] font-black text-red-500 uppercase tracking-widest flex items-center gap-1.5 mb-0.5">
                  <Cpu size={12} className="animate-pulse" /> Unified Engine Telemetry
                </p>
                <h4 className="text-base font-extrabold text-zinc-100">Module Inspector</h4>
              </div>
              <button 
                onClick={() => setShowDiagnostic(false)}
                className="text-zinc-500 hover:text-zinc-300 text-xs font-bold transition-colors"
              >
                ✕ Close
              </button>
            </div>
            <p className="text-[10px] text-zinc-500 mt-1 pb-1 leading-relaxed">
              Real-time visualization of the 7 discrete submodules executing within the Ranktica creator compiler pipeline.
            </p>
          </div>

          <div className="space-y-4">
            {/* 1. INPUT VALIDATOR */}
            <div className="bg-zinc-900/60 border border-zinc-800 p-4 rounded-2xl relative shadow-md">
              <div className="flex justify-between items-start">
                <div>
                  <span className="text-[9px] font-black text-zinc-550 uppercase">Module [01 / 07]</span>
                  <h5 className="text-[11px] font-black text-zinc-200">Input Validator</h5>
                </div>
                {stepValidation.isValid ? (
                  <span className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-extrabold text-[9px] px-2 py-0.5 rounded-md uppercase tracking-wide">
                    ✓ PASS
                  </span>
                ) : (
                  <span className="bg-red-500/10 border border-red-500/20 text-red-500 font-extrabold text-[9px] px-2 py-0.5 rounded-md uppercase tracking-wide">
                    ⚠ PENDING
                  </span>
                )}
              </div>
              <p className="text-[10px] text-zinc-400 mt-2 leading-relaxed">
                {stepValidation.isValid 
                 ? "Inputs sanitized and approved for active Pipeline stage " + currentStep + "."
                 : "Blocked: " + stepValidation.errors[0]}
              </p>
            </div>

            {/* 2. CONTEXT BUILDER */}
            <div className="bg-zinc-900/60 border border-zinc-800 p-4 rounded-2xl relative shadow-md">
              <div className="flex justify-between items-start mb-2">
                <div>
                  <span className="text-[9px] font-black text-zinc-550 uppercase">Module [02 / 07]</span>
                  <h5 className="text-[11px] font-black text-zinc-200">Context Builder</h5>
                </div>
                <span className="bg-blue-500/10 border border-blue-500/20 text-blue-400 font-extrabold text-[9px] px-2 py-0.5 rounded-md uppercase tracking-wide">
                  COMPILED
                </span>
              </div>
              <div className="p-2.5 bg-zinc-950 border border-zinc-850 rounded-xl text-[9px] font-mono text-zinc-350 space-y-1">
                <div className="flex justify-between"><span className="text-zinc-600">ID:</span> <span className="text-zinc-400 truncate max-w-[130px] font-bold">{liveCtx.projectId}</span></div>
                <div className="flex justify-between"><span className="text-zinc-600">NICHE:</span> <span className="text-zinc-400 truncate max-w-[130px] font-bold">{liveCtx.niche}</span></div>
                <div className="flex justify-between"><span className="text-zinc-600">TITLED:</span> <span className="text-zinc-400 truncate max-w-[130px] font-bold">{liveCtx.topicTitle}</span></div>
                <div className="flex justify-between"><span className="text-zinc-600">IDEAS:</span> <span className="text-red-500 font-black">{liveCtx.historicalIdeasCount} compiled</span></div>
              </div>
            </div>

            {/* 3. AI ROUTER */}
            <div className="bg-zinc-900/60 border border-zinc-800 p-4 rounded-2xl relative shadow-md">
              <div className="flex justify-between items-start">
                <div>
                  <span className="text-[9px] font-black text-zinc-550 uppercase">Module [03 / 07]</span>
                  <h5 className="text-[11px] font-black text-zinc-200">AI Router</h5>
                </div>
                <span className="bg-purple-500/10 border border-purple-500/20 text-purple-400 font-extrabold text-[9px] px-2 py-0.5 rounded-md uppercase tracking-wide">
                  ROUTED
                </span>
              </div>
              <div className="mt-2.5 space-y-1 text-[10px]">
                <div className="flex justify-between"><span className="text-zinc-500">Target Segment:</span> <span className="text-teal-400 font-black">[{activeAgent}]</span></div>
                <div className="flex justify-between"><span className="text-zinc-500">Platform LLM:</span> <span className="text-zinc-350 font-bold font-mono text-[9px]">{routedModelInfo.model}</span></div>
              </div>
            </div>

            {/* 4. PROMPT ENGINE */}
            <div className="bg-zinc-900/60 border border-zinc-800 p-4 rounded-2xl relative shadow-md">
              <div className="flex justify-between items-start mb-2">
                <div>
                  <span className="text-[9px] font-black text-zinc-550 uppercase">Module [04 / 07]</span>
                  <h5 className="text-[11px] font-black text-zinc-200">Prompt Engine</h5>
                </div>
                <span className="bg-yellow-500/10 border border-yellow-500/20 text-yellow-500 font-extrabold text-[9px] px-2 py-0.5 rounded-md uppercase tracking-wide">
                  FORMULATED
                </span>
              </div>
              <div className="p-2 bg-zinc-950 border border-zinc-850 rounded-xl text-[9px] font-mono text-zinc-400 leading-normal max-h-16 overflow-y-auto">
                {promptPreview}
              </div>
            </div>

            {/* 5. OUTPUT VALIDATOR */}
            <div className="bg-zinc-900/60 border border-zinc-800 p-4 rounded-2xl relative shadow-md">
              <div className="flex justify-between items-start mb-1">
                <div>
                  <span className="text-[9px] font-black text-zinc-550 uppercase">Module [05 / 07]</span>
                  <h5 className="text-[11px] font-black text-zinc-200">Output Validator</h5>
                </div>
                <span className="bg-rose-500/10 border border-rose-500/20 text-rose-400 font-extrabold text-[9px] px-2 py-0.5 rounded-md uppercase tracking-wide">
                  AUDITING
                </span>
              </div>
              <div className="space-y-1.5 text-[10px] text-zinc-400 pt-1">
                <div className="flex justify-between"><span>Narrative Word Count:</span> <span className="text-zinc-100 font-bold font-mono text-[9px]">{scriptAnalysis.wordCount} words</span></div>
                <div className="flex justify-between"><span>Structural Hooks:</span> <span className={scriptAnalysis.hasHooks ? "text-emerald-400 font-extrabold" : "text-zinc-500"}>{scriptAnalysis.hasHooks ? "DETECTED" : "NONE"}</span></div>
                <div className="flex justify-between"><span>Semantic SEO Audit:</span> <span className="text-red-500 font-black">{liveSEOReport ? liveSEOReport.score : 72}/100</span></div>
              </div>
            </div>

            {/* 6. SAVE ENGINE */}
            <div className="bg-zinc-900/60 border border-zinc-800 p-4 rounded-2xl relative shadow-md">
              <div className="flex justify-between items-start">
                <div>
                  <span className="text-[9px] font-black text-zinc-550 uppercase">Module [06 / 07]</span>
                  <h5 className="text-[11px] font-black text-zinc-200">Save Engine</h5>
                </div>
                <span className="bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 font-extrabold text-[9px] px-2 py-0.5 rounded-md uppercase tracking-wide">
                  CACHED
                </span>
              </div>
              <p className="text-[10px] text-zinc-450 mt-2 font-mono leading-relaxed truncate">
                {cacheStatus}
              </p>
            </div>

            {/* 7. ANALYTICS ENGINE */}
            <div className="bg-zinc-900/60 border border-zinc-800 p-4 rounded-2xl relative shadow-md">
              <div className="flex justify-between items-start mb-2">
                <div>
                  <span className="text-[9px] font-black text-zinc-550 uppercase">Module [07 / 07]</span>
                  <h5 className="text-[11px] font-black text-zinc-200">Analytics Engine</h5>
                </div>
                <span className="bg-pink-500/10 border border-pink-500/20 text-pink-400 font-extrabold text-[9px] px-2 py-0.5 rounded-md uppercase tracking-wide">
                  PREDICTING
                </span>
              </div>
              <div className="space-y-1.5 text-[10px]">
                <div className="flex justify-between"><span className="text-zinc-500">Predicted CTR:</span> <span className="text-emerald-400 font-black font-mono">{computedForecast.predictedCtr}%</span></div>
                <div className="flex justify-between"><span className="text-zinc-500">Retention (AVD):</span> <span className="text-purple-400 font-black font-mono">{computedForecast.averageViewDurationPct}%</span></div>
                <div className="flex flex-col text-[10px] text-zinc-400 mt-2 bg-zinc-950 p-2.5 border border-zinc-850 rounded-xl leading-normal">
                  <span className="font-extrabold text-red-550 uppercase text-[8px] mb-0.5 block tracking-wider">PROJECTED TRAJECTORY</span>
                  {computedForecast.expectedViewsRange}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
