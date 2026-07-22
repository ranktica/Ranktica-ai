
import React, { useState, useEffect, lazy, Suspense } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Layout } from './app/Layout';

// Lazy loaded tool modules
const CreatorDashboard = lazy(() => import('./app/CreatorDashboard').then(m => ({ default: m.CreatorDashboard })));
const WorkflowAutomation = lazy(() => import('./app/WorkflowAutomation').then(m => ({ default: m.WorkflowAutomation })));
const DeveloperDashboard = lazy(() => import('./app/DeveloperDashboard').then(m => ({ default: m.DeveloperDashboard })));
const Projects = lazy(() => import('./app/Projects').then(m => ({ default: m.Projects })));
const IdeaGenerator = lazy(() => import('./app/IdeaGenerator').then(m => ({ default: m.IdeaGenerator })));
const ScriptWriter = lazy(() => import('./app/ScriptWriter').then(m => ({ default: m.ScriptWriter })));
const ShortsGenerator = lazy(() => import('./app/ShortsGenerator').then(m => ({ default: m.ShortsGenerator })));
const SeoOptimizer = lazy(() => import('./app/SeoOptimizer').then(m => ({ default: m.SeoOptimizer })));
const MetadataEngineer = lazy(() => import('./app/MetadataEngineer').then(m => ({ default: m.MetadataEngineer })));
const ThumbnailGenerator = lazy(() => import('./app/ThumbnailGenerator').then(m => ({ default: m.ThumbnailGenerator })));
const ThumbnailRater = lazy(() => import('./app/ThumbnailRater').then(m => ({ default: m.ThumbnailRater })));
const CompetitorSpy = lazy(() => import('./app/CompetitorSpy').then(m => ({ default: m.CompetitorSpy })));
const ChannelAudit = lazy(() => import('./app/ChannelAudit').then(m => ({ default: m.ChannelAudit })));
const MarketingScheduler = lazy(() => import('./app/MarketingScheduler').then(m => ({ default: m.MarketingScheduler })));
const VideoStudio = lazy(() => import('./app/VideoStudio').then(m => ({ default: m.VideoStudio })));
const VideoGenerator = lazy(() => import('./app/VideoGenerator').then(m => ({ default: m.VideoGenerator })));
const AudioStudio = lazy(() => import('./app/AudioStudio').then(m => ({ default: m.AudioStudio })));
const ResearchAssistant = lazy(() => import('./app/ResearchAssistant').then(m => ({ default: m.ResearchAssistant })));
const LiveBrainstorm = lazy(() => import('./app/LiveBrainstorm').then(m => ({ default: m.LiveBrainstorm })));
const RepurposeEngine = lazy(() => import('./app/RepurposeEngine').then(m => ({ default: m.RepurposeEngine })));
const KeywordInspector = lazy(() => import('./app/KeywordInspector').then(m => ({ default: m.KeywordInspector })));
const TrendWatcher = lazy(() => import('./app/TrendWatcher').then(m => ({ default: m.TrendWatcher })));
const TitleGenerator = lazy(() => import('./app/TitleGenerator').then(m => ({ default: m.TitleGenerator })));
const OutreachHub = lazy(() => import('./app/OutreachHub').then(m => ({ default: m.OutreachHub })));
const EmailMarketing = lazy(() => import('./app/EmailMarketing').then(m => ({ default: m.EmailMarketing })));
const MarketStrategist = lazy(() => import('./app/MarketStrategist').then(m => ({ default: m.MarketStrategist })));
const About = lazy(() => import('./app/About').then(m => ({ default: m.About })));
const Upgrade = lazy(() => import('./app/Upgrade').then(m => ({ default: m.Upgrade })));
const Auth = lazy(() => import('./app/Auth').then(m => ({ default: m.Auth })));
const ObjectStorage = lazy(() => import('./app/ObjectStorage').then(m => ({ default: m.ObjectStorage })));
const AbTesting = lazy(() => import('./app/AbTesting').then(m => ({ default: m.AbTesting })));
const AgentBusView = lazy(() => import('./app/AgentBusView').then(m => ({ default: m.AgentBusView })));
const SubscriptionsView = lazy(() => import('./app/billing/SubscriptionsView').then(m => ({ default: m.SubscriptionsView })));
const CustomersView = lazy(() => import('./app/billing/CustomersView').then(m => ({ default: m.CustomersView })));
const PaymentsView = lazy(() => import('./app/billing/PaymentsView').then(m => ({ default: m.PaymentsView })));
const InvoicesView = lazy(() => import('./app/billing/InvoicesView').then(m => ({ default: m.InvoicesView })));
const StripeWebhooksView = lazy(() => import('./app/billing/StripeWebhooksView').then(m => ({ default: m.StripeWebhooksView })));
const ActivityLogs = lazy(() => import('./app/ActivityLogs').then(m => ({ default: m.ActivityLogs })));
const SecurityPanel = lazy(() => import('./app/SecurityPanel').then(m => ({ default: m.SecurityPanel })));
const CostGovernancePanel = lazy(() => import('./app/CostGovernancePanel').then(m => ({ default: m.CostGovernancePanel })));
const RagIntelligencePanel = lazy(() => import('./app/RagIntelligencePanel').then(m => ({ default: m.RagIntelligencePanel })));
const PromptPortal = lazy(() => import('./app/PromptPortal').then(m => ({ default: m.PromptPortal })));
const AIEmployeeOS = lazy(() => import('./app/AIEmployeeOS').then(m => ({ default: m.AIEmployeeOS })));
const BatteryHealthDashboard = lazy(() => import('./app/BatteryHealthDashboard').then(m => ({ default: m.BatteryHealthDashboard })));
const TeamMembers = lazy(() => import('./app/TeamMembers').then(m => ({ default: m.TeamMembers })));
import { ToolType } from './shared/types';
import { AuthProvider, useAuth } from './infrastructure/auth/AuthContext';
import { ProjectProvider, useProject } from './app/ProjectContext';
import { CommandProvider, useCommand } from './shared/CommandContext';
import { VoiceNavigator } from './components/VoiceNavigator';
import { CommandPalette } from './components/CommandPalette';
import { SyncStatus } from './components/SyncStatus';
import { UndoRedoOverlay } from './components/UndoRedoOverlay';
import { PwaInstallPrompt } from './components/PwaInstallPrompt';
import { KeyboardShortcutCheatSheet } from './components/KeyboardShortcutCheatSheet';
import { Loader2, Youtube, Sparkles } from 'lucide-react';
import toast, { Toaster } from 'react-hot-toast';
import { logger } from './infrastructure/logger';
import { ErrorBoundary } from './app/ErrorBoundary';
import { I18nProvider } from './shared/i18n';
import { logActivity } from './shared/activityLogger';
import { OnboardingTour } from './components/OnboardingTour';
import { offlineCache } from './shared/offlineCache';
import { usePerformanceMonitor } from './shared/usePerformanceMonitor';
import { GlobalRecoveryManager } from './app/GlobalRecoveryManager';


const TOOL_LABELS: Record<ToolType, string> = {
  [ToolType.DASHBOARD]: 'Creator Dashboard',
  [ToolType.AGENT_BUS]: 'Agent Bus View',
  [ToolType.DEV_DASHBOARD]: 'Developer Dashboard',
  [ToolType.ABOUT]: 'About Ranktica',
  [ToolType.PROJECTS]: 'Projects Hub',
  [ToolType.IDEAS]: 'Viral Idea Lab',
  [ToolType.SCRIPT]: 'Script Writer',
  [ToolType.SEO]: 'SEO Optimizer',
  [ToolType.THUMBNAIL]: 'Thumbnail Studio',
  [ToolType.THUMBNAIL_RATER]: 'Aesthetic Thumbnail Rater',
  [ToolType.VIDEO]: 'Adaptive Video Studio',
  [ToolType.VIDEO_GENERATOR]: 'AI Video Generator',
  [ToolType.AUDIO]: 'Precision Audio Studio',
  [ToolType.RESEARCH]: 'Research & Grounding',
  [ToolType.COMPETITOR_SPY]: 'Competitor Intelligence',
  [ToolType.CHANNEL_AUDIT]: 'Channel Health Audit',
  [ToolType.LIVE]: 'Live Brainstorming',
  [ToolType.MARKETING]: 'Outbound Marketing Scheduler',
  [ToolType.REPURPOSE]: 'Omni Repurpose Engine',
  [ToolType.KEYWORD_INSPECTOR]: 'Semantic Keyword Inspector',
  [ToolType.TREND_WATCHER]: 'Real-time Trend Watcher',
  [ToolType.TITLE_GENERATOR]: 'High-CTR Title Predictor',
  [ToolType.OUTREACH]: 'Outreach Hub',
  [ToolType.EMAIL_MARKETING]: 'Active Email Campaigns',
  [ToolType.MARKET_STRATEGIST]: 'Market Strategist',
  [ToolType.UPGRADE]: 'Subscription Upgrades',
  [ToolType.WORKFLOW]: 'Autonomous Workflow Automation',
  [ToolType.SHORTS_GENERATOR]: 'Viral Shorts Studio',
  [ToolType.METADATA_ENGINEER]: 'YouTube Metadata Engineer',
  [ToolType.OBJECT_STORAGE]: 'Cloud Object Storage',
  [ToolType.AB_TESTING]: 'A/B CTR Split Tester',
  [ToolType.SUBSCRIPTIONS]: 'Stripe Subscriptions',
  [ToolType.CUSTOMERS]: 'Customer Directory',
  [ToolType.PAYMENTS]: 'Stripe Payment Ingestion',
  [ToolType.INVOICES]: 'Stripe Invoicing System',
  [ToolType.STRIPE_WEBHOOKS]: 'Stripe Webhook Listener',
  [ToolType.ACTIVITY_LOGS]: 'Activity Audit Logs',
  [ToolType.SECURITY]: 'SaaS Security & Audits',
  [ToolType.COST_GOVERNANCE]: 'AI Cost Governance & Telemetry',
  [ToolType.RAG_INTELLIGENCE]: 'Knowledge Intelligence & RAG Core',
  [ToolType.PROMPT_PORTAL]: 'Prompt Platform Specifications',
  [ToolType.AI_EMPLOYEE_OS]: 'Digital Employee OS',
  [ToolType.BATTERY_DASHBOARD]: 'Battery Health Dashboard',
  [ToolType.TEAM_MEMBERS]: 'Team Collaboration Hub',
};


const Intro = ({ onFinish }: { onFinish: () => void }) => {
  useEffect(() => {
    const timer = setTimeout(onFinish, 2800);
    return () => clearTimeout(timer);
  }, [onFinish]);

  return (
    <div className="fixed inset-0 z-[100] bg-[#09090b] flex flex-col items-center justify-center">
      <div className="relative animate-scale-in">
        <div className="w-24 h-24 bg-gradient-to-tr from-red-600 to-orange-600 rounded-[2rem] flex items-center justify-center shadow-2xl shadow-red-600/20 mb-8 relative z-10">
          <Youtube size={48} className="text-white" />
        </div>
        <div className="absolute inset-0 bg-red-600 blur-[80px] opacity-20 animate-pulse"></div>
      </div>
      
      <div className="text-center space-y-2 animate-fade-in" style={{ animationDelay: '400ms', animationFillMode: 'both' }}>
        <h1 className="text-5xl font-black text-white tracking-tighter">
          RANKTICA <span className="text-red-500">AI</span>
        </h1>
        <div className="flex items-center justify-center gap-2 text-[10px] font-black text-zinc-500 uppercase tracking-[0.5em] ml-2">
          <Sparkles size={10} className="text-red-500" />
          Autonomous Creator Suite
        </div>
      </div>

      <div className="absolute bottom-16 flex flex-col items-center gap-4 animate-fade-in" style={{ animationDelay: '800ms', animationFillMode: 'both' }}>
        <div className="w-40 h-1 bg-zinc-900 rounded-full overflow-hidden">
          <div className="h-full bg-red-600 w-full origin-left animate-pulse"></div>
        </div>
        <span className="text-[9px] font-bold text-zinc-700 uppercase tracking-widest">Waking Up Neural Core</span>
      </div>
    </div>
  );
};

const AppContent = () => {
  const { user, isLoading, checkPlanStatus } = useAuth();
  const [currentTool, setCurrentTool] = useState<ToolType>(ToolType.DASHBOARD);
  
  // Call performance monitoring hook for tool-switching and Navigation Timing
  usePerformanceMonitor(currentTool);

  const { recordMacroAction, macros, executeMacro } = useCommand();
  const { activeProject, updateActiveProject, setActiveProjectById } = useProject();

  const [showIntro, setShowIntro] = useState(true);
  const [prefillData, setPrefillData] = useState<any>(null);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [showShortcutSheet, setShowShortcutSheet] = useState(false);

  // Restore previous module active state from IndexedDB offlineCache upon loading
  useEffect(() => {
    const restoreLastActiveTool = async () => {
      try {
        const cached = await offlineCache.getState('active_tool_type');
        if (cached && cached.tool) {
          const tool = cached.tool as ToolType;
          setCurrentTool(tool);
          
          // Track recently used tools in offlineCache
          offlineCache.getState('recently_used_tools')
            .then((recentlyUsed) => {
              const list = Array.isArray(recentlyUsed) ? recentlyUsed : [];
              const updated = [tool, ...list.filter((t: any) => t !== tool)].slice(0, 5);
              offlineCache.saveState('recently_used_tools', updated)
                .catch(err => console.warn('[OfflineCache] Error saving recently used tools:', err));
            })
            .catch(err => console.warn('[OfflineCache] Error reading recently used tools:', err));
        }
      } catch (err) {
        console.warn('[OfflineCache] Failed to restore previous tool type state:', err);
      }
    };
    if (!showIntro) {
      restoreLastActiveTool();
    }
  }, [showIntro]);

  // Restore state from URL search parameters on load, taking precedence over offlineCache
  useEffect(() => {
    if (showIntro || !user) return;

    const params = new URLSearchParams(window.location.search);
    const toolParam = params.get('tool');
    const projectParam = params.get('project');

    if (toolParam) {
      const matchedTool = Object.values(ToolType).find(
        (t) => t.toLowerCase() === toolParam.toLowerCase()
      );
      if (matchedTool) {
        setCurrentTool(matchedTool);
        logger.info(`[URL Restoration] Successfully restored tool state from URL parameter: ${matchedTool}`);
      }
    }

    if (projectParam) {
      setActiveProjectById(projectParam);
      logger.info(`[URL Restoration] Successfully restored active project state from URL parameter: ${projectParam}`);
    }
  }, [showIntro, user]);

  // Sync currentTool and activeProject state back to the URL search parameters for bookmark/share ease
  useEffect(() => {
    if (showIntro || !user) return;

    const params = new URLSearchParams(window.location.search);
    let changed = false;

    if (currentTool) {
      if (params.get('tool') !== currentTool) {
        params.set('tool', currentTool);
        changed = true;
      }
    } else {
      if (params.has('tool')) {
        params.delete('tool');
        changed = true;
      }
    }

    if (activeProject?.id) {
      if (params.get('project') !== activeProject.id) {
        params.set('project', activeProject.id);
        changed = true;
      }
    } else {
      if (params.has('project')) {
        params.delete('project');
        changed = true;
      }
    }

    if (changed) {
      const newSearch = params.toString();
      const newUrl = `${window.location.pathname}${newSearch ? '?' + newSearch : ''}`;
      window.history.replaceState(null, '', newUrl);
    }
  }, [currentTool, activeProject, showIntro, user]);

  // Sync active module state back to IndexedDB whenever the user navigates
  useEffect(() => {
    if (!showIntro) {
      offlineCache.saveState('active_tool_type', { tool: currentTool })
        .catch(err => console.warn('[OfflineCache] Unaligned tool type caching:', err));
    }
  }, [currentTool, showIntro]);

  // Auto-launch the onboarding tour for new users once the main intro is finished
  useEffect(() => {
    if (!showIntro) {
      const completedOnboarding = localStorage.getItem('ranktica_onboarding_completed');
      if (completedOnboarding !== 'true') {
        const timer = setTimeout(() => {
          setShowOnboarding(true);
        }, 1200);
        return () => clearTimeout(timer);
      }
    }
  }, [showIntro]);

  // Listen to the system-wide restart event from elements such as Layout button or Dashboard links
  useEffect(() => {
    const handleStartTour = () => {
      setShowOnboarding(true);
    };
    window.addEventListener('ranktica-start-onboarding-tour', handleStartTour);
    return () => window.removeEventListener('ranktica-start-onboarding-tour', handleStartTour);
  }, []);

  // Listen to the graceful recovery event to soft-reload active module and re-initialize main state
  useEffect(() => {
    const handleGracefulRecovery = () => {
      console.log('[AppContent] Processing graceful recovery...');
      const previousTool = currentTool;
      // Temporarily set to null to force complete unmount of any crashed tool module
      setCurrentTool(null as any);
      
      setTimeout(() => {
        // Re-initialize to the previous tool gracefully (or dashboard if it was invalid)
        setCurrentTool(previousTool || ToolType.DASHBOARD);
        toast.dismiss();
        toast.success('Application state re-initialized. Module gracefully reloaded.', {
          icon: '⚡',
          id: 'recovery-success',
        });
      }, 200);
    };
    window.addEventListener('ranktica-graceful-recovery', handleGracefulRecovery);
    return () => window.removeEventListener('ranktica-graceful-recovery', handleGracefulRecovery);
  }, [currentTool]);

  const handleNavigate = (tool: ToolType, payload?: any) => {
    logger.startMeasure(`navigate-${tool}`);
    const previousTool = currentTool;
    setPrefillData(payload || null);
    setCurrentTool(tool);

    const label = TOOL_LABELS[tool] || 'System Module';
    toast.dismiss();
    toast.success(`Accessed ${label}`, {
      icon: '🚀',
      id: `nav-${tool}`,
    });

    // Record navigation macro step if recording is active
    recordMacroAction('navigate', tool, `Navigate to ${label}`);

    // Automatically log user engagement activity for module analytics & heatmaps
    logActivity(`Navigated to ${label} system module`, label, tool);

    // Track recently used tools in offlineCache
    offlineCache.getState('recently_used_tools')
      .then((recentlyUsed) => {
        const list = Array.isArray(recentlyUsed) ? recentlyUsed : [];
        const updated = [tool, ...list.filter((t: any) => t !== tool)].slice(0, 5);
        offlineCache.saveState('recently_used_tools', updated)
          .catch(err => console.warn('[OfflineCache] Error saving recently used tools:', err));
      })
      .catch(err => console.warn('[OfflineCache] Error reading recently used tools:', err));

    logger.info(`Navigation state changed from ${previousTool} to ${tool}`, { payload });
    logger.endMeasure(`navigate-${tool}`);
  };

  // Global Keyboard Shortcuts (Ctrl+S for save, Ctrl+Alt hotkeys, Alt+Key for macros)
  useEffect(() => {
    if (!user) return;

    const handleGlobalShortcuts = (e: KeyboardEvent) => {
      // Check for Ctrl+S or Cmd+S
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 's') {
        e.preventDefault();
        
        // Log telemetry interaction
        logActivity("Saved active creator workspace configuration state via keyboard hotkey (Ctrl+S)", "Shortcut Pipeline", "system");
        
        toast.success("Workspace State Saved! 💾", {
          id: "shortcut-save-toast",
          duration: 3000
        });
      }

      // Check for Ctrl+/ or Cmd+/ to toggle Keyboard Shortcut Cheat Sheet
      if ((e.ctrlKey || e.metaKey) && e.key === '/') {
        e.preventDefault();
        setShowShortcutSheet(prev => !prev);
        logActivity("Toggled Keyboard Shortcut Cheat Sheet via keyboard hotkey (Ctrl+/)", "Shortcut Pipeline", "system");
      }
      
      // Ctrl+Alt shortcuts for fast module hop
      if (e.ctrlKey && e.altKey) {
        let hopTool: ToolType | null = null;
        if (e.key.toLowerCase() === 'd') {
          hopTool = ToolType.DASHBOARD;
        } else if (e.key.toLowerCase() === 'p') {
          hopTool = ToolType.PROJECTS;
        } else if (e.key.toLowerCase() === 's') {
          hopTool = ToolType.SCRIPT;
        } else if (e.key.toLowerCase() === 'i') {
          hopTool = ToolType.IDEAS;
        } else if (e.key.toLowerCase() === 't') {
          hopTool = ToolType.THUMBNAIL;
        } else if (e.key.toLowerCase() === 'v') {
          hopTool = ToolType.VIDEO_GENERATOR;
        }
        
        if (hopTool) {
          e.preventDefault();
          handleNavigate(hopTool);
        }
      }

      // Alt+<key> shortcuts for play keyboard macro
      if (e.altKey && !e.ctrlKey && !e.metaKey) {
        const key = e.key.toLowerCase();
        const foundMacro = macros.find(m => m.shortcutKey === key);
        if (foundMacro) {
          e.preventDefault();
          executeMacro(foundMacro, handleNavigate, updateActiveProject, activeProject);
        }
      }
    };
    
    window.addEventListener('keydown', handleGlobalShortcuts);
    return () => window.removeEventListener('keydown', handleGlobalShortcuts);
  }, [user, currentTool, macros, activeProject, showShortcutSheet]);

  if (showIntro) {
    return <Intro onFinish={() => setShowIntro(false)} />;
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#09090b] flex items-center justify-center">
        <Loader2 className="animate-spin text-red-500" size={32} />
      </div>
    );
  }

  if (!user) {
    return <Auth />;
  }

  const { isValid } = checkPlanStatus();

  if (!isValid && currentTool !== ToolType.UPGRADE) {
    return <Upgrade />;
  }

  const renderTool = () => {
    if (currentTool === ToolType.UPGRADE) {
      return <Upgrade />;
    }

    if (!isValid) return <Upgrade />;

    try {
      switch (currentTool) {
      case ToolType.DASHBOARD:
        return <CreatorDashboard onNavigate={handleNavigate} />;
      case ToolType.AGENT_BUS:
        return <AgentBusView />;
      case ToolType.WORKFLOW:
        return <WorkflowAutomation />;
      case ToolType.DEV_DASHBOARD:
        return <DeveloperDashboard />;
      case ToolType.ABOUT:
        return <About />;
      case ToolType.PROJECTS:
        return <Projects />;
      case ToolType.IDEAS:
        return <IdeaGenerator onNavigate={handleNavigate} />;
      case ToolType.SCRIPT:
        return <ScriptWriter prefill={prefillData} onNavigate={handleNavigate} />;
      case ToolType.SHORTS_GENERATOR:
        return <ShortsGenerator prefill={prefillData} />;
      case ToolType.SEO:
        return <SeoOptimizer prefill={prefillData} />;
      case ToolType.METADATA_ENGINEER:
        return <MetadataEngineer onNavigate={handleNavigate} />;
      case ToolType.THUMBNAIL:
        return <ThumbnailGenerator prefill={prefillData} />;
      case ToolType.THUMBNAIL_RATER:
        return <ThumbnailRater />;
      case ToolType.COMPETITOR_SPY:
        return <CompetitorSpy />;
      case ToolType.CHANNEL_AUDIT:
        return <ChannelAudit />;
      case ToolType.VIDEO:
        return <VideoStudio />;
      case ToolType.VIDEO_GENERATOR:
        return <VideoGenerator />;
      case ToolType.AUDIO:
        return <AudioStudio />;
      case ToolType.RESEARCH:
        return <ResearchAssistant />;
      case ToolType.LIVE:
        return <LiveBrainstorm />;
      case ToolType.MARKETING:
        return <MarketingScheduler />;
      case ToolType.REPURPOSE:
        return <RepurposeEngine onNavigate={handleNavigate} />;
      case ToolType.KEYWORD_INSPECTOR:
        return <KeywordInspector />;
      case ToolType.TREND_WATCHER:
        return <TrendWatcher />;
      case ToolType.TITLE_GENERATOR:
        return <TitleGenerator />;
      case ToolType.OUTREACH:
        return <OutreachHub />;
      case ToolType.EMAIL_MARKETING:
        return <EmailMarketing />;
      case ToolType.MARKET_STRATEGIST:
        return <MarketStrategist />;
      case ToolType.OBJECT_STORAGE:
        return <ObjectStorage />;
      case ToolType.AB_TESTING:
        return <AbTesting />;
      case ToolType.SUBSCRIPTIONS:
        return <SubscriptionsView />;
      case ToolType.CUSTOMERS:
        return <CustomersView />;
      case ToolType.PAYMENTS:
        return <PaymentsView />;
      case ToolType.INVOICES:
        return <InvoicesView />;
      case ToolType.STRIPE_WEBHOOKS:
        return <StripeWebhooksView />;
      case ToolType.ACTIVITY_LOGS:
        return <ActivityLogs />;
      case ToolType.SECURITY:
        return <SecurityPanel />;
      case ToolType.COST_GOVERNANCE:
        return <CostGovernancePanel />;
      case ToolType.RAG_INTELLIGENCE:
        return <RagIntelligencePanel />;
      case ToolType.PROMPT_PORTAL:
        return <PromptPortal />;
      case ToolType.AI_EMPLOYEE_OS:
        return <AIEmployeeOS />;
      case ToolType.BATTERY_DASHBOARD:
        return <BatteryHealthDashboard />;
      case ToolType.TEAM_MEMBERS:
        return <TeamMembers />;
      default:
        return <CreatorDashboard onNavigate={handleNavigate} />;
      }
    } catch (err: any) {
      logger.error(`Error occurred while rendering tool "${currentTool}":`, err);
      toast.error(`Rendering Error: Could not display ${TOOL_LABELS[currentTool] || 'requested module'}`);
      throw err;
    }
  };

  return (
    <>
      <Layout currentTool={currentTool} onNavigate={handleNavigate}>
        <AnimatePresence mode="wait">
          <motion.div
            key={currentTool || 'empty'}
            initial={{ opacity: 0, y: 10, scale: 0.995 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.995 }}
            transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
            className="w-full h-full"
          >
            <Suspense fallback={
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex flex-col items-center justify-center h-[50vh] w-full bg-transparent gap-3"
              >
                <div className="p-3 rounded-full bg-red-600/10 border border-red-600/20">
                  <Loader2 className="animate-spin text-red-500" size={28} />
                </div>
                <span className="text-[11px] font-mono uppercase tracking-widest text-zinc-500">Initializing Module Workspace...</span>
              </motion.div>
            }>
              {renderTool()}
            </Suspense>
          </motion.div>
        </AnimatePresence>
      </Layout>
      <VoiceNavigator currentTool={currentTool} onNavigate={handleNavigate} />
      <CommandPalette onNavigate={handleNavigate} />
      <GlobalRecoveryManager />
      <SyncStatus />
      <PwaInstallPrompt />
      <UndoRedoOverlay />
      <KeyboardShortcutCheatSheet isOpen={showShortcutSheet} onClose={() => setShowShortcutSheet(false)} />
      {showOnboarding && (
        <OnboardingTour 
          onNavigate={handleNavigate} 
          onClose={() => setShowOnboarding(false)} 
        />
      )}
    </>
  );
};

function App() {
  return (
    <CommandProvider>
      <AuthProvider>
        <ProjectProvider>
          <I18nProvider>
            <ErrorBoundary>
              <AppContent />
            </ErrorBoundary>
          </I18nProvider>
        </ProjectProvider>
        <Toaster 
          position="bottom-right"
          toastOptions={{
            style: {
              background: '#18181b',
              color: '#fff',
              border: '1px solid #27272a',
              fontSize: '12px',
              borderRadius: '12px',
            },
          }}
        />
      </AuthProvider>
    </CommandProvider>
  );
}

export default App;
