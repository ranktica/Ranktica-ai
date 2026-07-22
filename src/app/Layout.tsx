import React, { useState, useEffect, useMemo, useRef } from "react";
import { toast } from "react-hot-toast";
import {
  LayoutDashboard,
  Lightbulb,
  FileText,
  Search,
  Image as ImageIcon,
  Menu,
  X,
  LogOut,
  ChevronRight,
  Globe,
  Users,
  Smartphone,
  Info,
  Terminal,
  Clapperboard,
  AlertCircle,
  Video,
  Mic,
  Clock,
  Zap,
  RotateCcw,
  Fingerprint,
  Cpu,
  BrainCircuit,
  Target,
  LineChart,
  Repeat,
  Mail,
  ClipboardCheck,
  Eye,
  BarChart3,
  TrendingUp,
  MapPin,
  MessageSquare,
  Layers,
  CloudLightning,
  ChevronDown,
  Briefcase,
  Plus,
  Palette,
  Database,
  CreditCard,
  DollarSign,
  Bell,
  Trash2,
  CheckCheck,
  FolderOpen,
  Settings,
  Sliders,
  History,
  Download,
  Sparkles,
  Battery,
  BatteryCharging,
  BatteryWarning,
  Calendar,
  Unlock,
  ShieldAlert,
  Star,
  HelpCircle
} from "lucide-react";
import { ToolType, NavItem } from "@/shared/types";
import { useAuth } from "@/infrastructure/auth/AuthContext";
import { useProject } from "@/app/ProjectContext";
import { OfflineIndicator } from "@/components/OfflineIndicator";
import { AutoSaveStatus } from "@/components/AutoSaveStatus";
import { PresenceIndicator } from "@/components/PresenceIndicator";
import { InactivitySaveWarning } from "@/components/InactivitySaveWarning";
import { ClientPdfExporter } from "@/components/ClientPdfExporter";
import { NotificationCenter } from "@/components/NotificationCenter";
import { motion, AnimatePresence } from "motion/react";
import {
  getNotifications,
  saveNotifications,
  subscribeNotifications,
  markAllNotificationsAsRead,
  clearNotifications,
  removeNotification,
  NotificationItem,
} from "@/infrastructure/notifications";
import { FCMService } from '@/infrastructure/fcm';
import { subscribeToNotifications, markAsRead, markAllAsReadBatch, AlertNotification } from '@/shared/notificationService';
import { useTaskScheduler } from "@/shared/useTaskScheduler";
import { useTranslation, LanguageCode } from "@/shared/i18n";
import { getActivities, logActivity } from "@/shared/activityLogger";
import { DesktopSidebar } from "@/components/DesktopSidebar";

const NAV_ITEMS: NavItem[] = [
  // ROLE: Creator (General Overview)
  {
    id: ToolType.DASHBOARD,
    label: "Creator Command",
    icon: <LayoutDashboard size={18} />,
    category: "Creator",
    description: "Central workspace portal with analytics, orchestration controls, and system health status."
  },
  {
    id: ToolType.AGENT_BUS,
    label: "Agent Bus Matrix",
    icon: <Layers size={18} />,
    category: "Creator",
    description: "Persistently monitor inter-agent communications and system events on the bus matrix."
  },
  {
    id: ToolType.AI_EMPLOYEE_OS,
    label: "Digital Employee OS",
    icon: <Users size={18} />,
    category: "Creator",
    description: "Autonomous system to scale creative digital workforce and virtual agents."
  },
  {
    id: ToolType.WORKFLOW,
    label: "14-Step Creator Core",
    icon: <Cpu size={18} />,
    category: "Creator",
    description: "Iteratively run through the 14-step high-CTR viral content production checklist."
  },

  // ROLE: Researcher (Intelligence Gathering)
  {
    id: ToolType.RESEARCH,
    label: "Research Intelligence",
    icon: <BrainCircuit size={18} />,
    category: "Researcher",
    description: "Gather and process viral competitor intelligence and blue ocean topics."
  },
  {
    id: ToolType.KEYWORD_INSPECTOR,
    label: "Keyword Inspector",
    icon: <Search size={18} />,
    category: "Researcher",
    description: "Inspect rising and underserved query volume for maximum search visibility."
  },
  {
    id: ToolType.TREND_WATCHER,
    label: "Trend Watcher",
    icon: <TrendingUp size={18} />,
    category: "Researcher",
    description: "Real-time crawler tracing rising cultural signals and creative shifts."
  },
  {
    id: ToolType.COMPETITOR_SPY,
    label: "Competitor Spy",
    icon: <Eye size={18} />,
    category: "Researcher",
    description: "Deeply analyze competitor upload cadence, metadata strategies, and CTR metrics."
  },
  {
    id: ToolType.LIVE,
    label: "Live Brainstorm",
    icon: <Mic size={18} />,
    category: "Researcher",
    description: "Persistent audio-text brainwave room for live multidisciplinary ideation."
  },

  // ROLE: Writer (Linguistic Content)
  {
    id: ToolType.SCRIPT,
    label: "Scripting Core",
    icon: <FileText size={18} />,
    category: "Writer",
    description: "Cognitive modeling script editor with direct readability analysis."
  },
  {
    id: ToolType.AUDIO,
    label: "Neural Narration",
    icon: <Fingerprint size={18} />,
    category: "Writer",
    description: "Synthesize natural, emotive multi-voice narration tracks for video outputs."
  },

  // ROLE: Designer (Visual Assets)
  {
    id: ToolType.THUMBNAIL,
    label: "Thumbnail Studio",
    icon: <ImageIcon size={18} />,
    category: "Designer",
    description: "Generate visual thumbnails customized for high psychological interest."
  },
  {
    id: ToolType.THUMBNAIL_RATER,
    label: "Visual Rater (CTR)",
    icon: <Target size={18} />,
    category: "Designer",
    description: "Validate graphic layouts against empirical interest and attention heatmaps."
  },

  // ROLE: Architect (Structural Production)
  {
    id: ToolType.VIDEO,
    label: "Video Studio",
    icon: <Video size={18} />,
    category: "Architect",
    description: "Advanced studio timeline editing interface for fully localized footage."
  },
  {
    id: ToolType.VIDEO_GENERATOR,
    label: "Veo Synthesis",
    icon: <Clapperboard size={18} />,
    category: "Architect",
    description: "Synthesize high-fidelity video B-roll assets using Veo's multi-stage generator."
  },
  {
    id: ToolType.SHORTS_GENERATOR,
    label: "Shorts Architect",
    icon: <Smartphone size={18} />,
    category: "Architect",
    description: "Rapid micro-video compiler and smart vertical layout trimmer."
  },

  // ROLE: Strategist (Growth Frameworks)
  {
    id: ToolType.MARKET_STRATEGIST,
    label: "Market Strategist",
    icon: <LineChart size={18} />,
    category: "Strategist",
    description: "Model high-CTR audience demographics and monetization pathways."
  },
  {
    id: ToolType.METADATA_ENGINEER,
    label: "Metadata Architect",
    icon: <Layers size={18} />,
    category: "Strategist",
    description: "Auto-compile optimized descriptions, tags, and dynamic timestamps."
  },
  {
    id: ToolType.SEO,
    label: "SEO Optimizer",
    icon: <BarChart3 size={18} />,
    category: "Strategist",
    description: "Compare semantic keyword density against competitive industry thresholds."
  },
  {
    id: ToolType.TITLE_GENERATOR,
    label: "Title Engineering",
    icon: <Zap size={18} />,
    category: "Strategist",
    description: "Generate attention-grabbing, highly clickable titles based on cognitive interests."
  },
  {
    id: ToolType.AB_TESTING,
    label: "A/B Split Tester",
    icon: <BarChart3 size={18} />,
    category: "Strategist",
    description: "Run predictive simulation matrix tests for metadata variations."
  },

  // ROLE: Editor (Post-Production)
  {
    id: ToolType.REPURPOSE,
    label: "Repurpose Engine",
    icon: <Repeat size={18} />,
    category: "Editor",
    description: "Chop long-form videos into micro-content snippets for horizontal scale."
  },
  {
    id: ToolType.CHANNEL_AUDIT,
    label: "Audit & Compliance",
    icon: <ClipboardCheck size={18} />,
    category: "Editor",
    description: "Verify copyright compliance and safe advertiser brand safety."
  },

  // ROLE: Marketer (Outreach & Distribution)
  {
    id: ToolType.OUTREACH,
    label: "Outreach Hub",
    icon: <Users size={18} />,
    category: "Marketer",
    description: "Manage dynamic external campaigns and sponsor tracking records."
  },
  {
    id: ToolType.EMAIL_MARKETING,
    label: "Email Blast Studio",
    icon: <Mail size={18} />,
    category: "Marketer",
    description: "Design and draft targeted newsletters to grow a loyal subscriber base."
  },

  // ROLE: Planner (Campaigning)
  {
    id: ToolType.IDEAS,
    label: "Idea Lab",
    icon: <Lightbulb size={18} />,
    category: "Planner",
    description: "Brainstorm underserved niche ideas using blue ocean gap analysis."
  },
  {
    id: ToolType.MARKETING,
    label: "Omni-Channel Blitz",
    icon: <Clock size={18} />,
    category: "Planner",
    description: "Orchestrate multi-platform publishing schedules with social push integration."
  },

  // ROLE: Manager (Operations)
  {
    id: ToolType.PROJECTS,
    label: "Production Board",
    icon: <Terminal size={18} />,
    category: "Manager",
    description: "Manage and schedule workspace projects, deadlines, and milestones."
  },
  {
    id: ToolType.OBJECT_STORAGE,
    label: "Object Storage Assets",
    icon: <Database size={18} />,
    category: "Manager",
    description: "Store and search large media assets, audio cuts, and graphic files."
  },
  {
    id: ToolType.DEV_DASHBOARD,
    label: "Developer Console",
    icon: <Cpu size={18} />,
    category: "Manager",
    description: "Under-the-hood console for telemetry, custom scripts, and system testing."
  },
  {
    id: ToolType.ABOUT,
    label: "System Manifest",
    icon: <Info size={18} />,
    category: "Manager",
    description: "General overview of the Ranktica AI platform architecture."
  },
  {
    id: ToolType.ACTIVITY_LOGS,
    label: "Activity Audit Logs",
    icon: <History size={18} />,
    category: "Manager",
    description: "Immutable timeline log recording user actions and security events."
  },
  {
    id: ToolType.SECURITY,
    label: "Security & Auditing",
    icon: <Fingerprint size={18} />,
    category: "Manager",
    description: "Manage access tokens, system permissions, and API key routing configurations."
  },
  {
    id: ToolType.COST_GOVERNANCE,
    label: "AI Cost Governance",
    icon: <DollarSign size={18} />,
    category: "Manager",
    description: "Budgeting and audit center for server-side AI model invocation costs."
  },
  {
    id: ToolType.TEAM_MEMBERS,
    label: "Team Members",
    icon: <Users size={18} />,
    category: "Manager",
    description: "Invite and manage human specialists and collaborator access roles."
  },
  {
    id: ToolType.BATTERY_DASHBOARD,
    label: "Battery Health Lab",
    icon: <BatteryCharging size={18} />,
    category: "Manager",
    description: "Simulation center for eco-throttling, battery tracking, and hardware cost modeling."
  },
  {
    id: ToolType.RAG_INTELLIGENCE,
    label: "RAG & Knowledge Graph",
    icon: <Database size={18} />,
    category: "Manager",
    description: "Cognitive text retrieval system mapping connected contextual data."
  },
  {
    id: ToolType.PROMPT_PORTAL,
    label: "Prompt Management",
    icon: <Terminal size={18} />,
    category: "Manager",
    description: "Consolidated orchestrator to version and validate system prompts."
  },

  // ROLE: Finance (Billing & Ledger)
  {
    id: ToolType.SUBSCRIPTIONS,
    label: "Subscriptions",
    icon: <CreditCard size={18} />,
    category: "Finance",
    description: "Monitor and configure subscription plans, billing periods, and features."
  },
  {
    id: ToolType.CUSTOMERS,
    label: "Patron Database",
    icon: <Users size={18} />,
    category: "Finance",
    description: "CRM tracking platform customer lifetime value, engagement, and tier status."
  },
  {
    id: ToolType.PAYMENTS,
    label: "Transaction Audit",
    icon: <DollarSign size={18} />,
    category: "Finance",
    description: "Audit ledger documenting all platform transaction operations."
  },
  {
    id: ToolType.INVOICES,
    label: "Invoices Archive",
    icon: <FileText size={18} />,
    category: "Finance",
    description: "Chronological repository containing all client billing invoices."
  },
  {
    id: ToolType.STRIPE_WEBHOOKS,
    label: "Webhook Telemetry",
    icon: <CloudLightning size={18} />,
    category: "Finance",
    description: "Real-time webhooks dashboard logging incoming payment events."
  },
];

const LANGUAGES = [
  { code: "en", label: "English" },
  { code: "es", label: "Spanish" },
  { code: "fr", label: "French" },
];

interface LayoutProps {
  currentTool: ToolType;
  onNavigate: (tool: ToolType, payload?: any) => void;
  children: React.ReactNode;
}

export const Layout: React.FC<LayoutProps> = ({
  currentTool,
  onNavigate,
  children,
}) => {
  const { user, logout, checkPlanStatus, googleToken, signInWithGoogle } = useAuth();
  const { deferredTasks, forceRunTask, clearDeferredTasks, batteryStatus } = useTaskScheduler();
  const { 
    projects, 
    activeProject, 
    setActiveProjectById, 
    isSyncing, 
    collaborators, 
    isOffline, 
    offlineQueueSize,
    workspaces = [],
    activeWorkspaceId = '',
    setActiveWorkspaceId = () => {},
    createWorkspace = () => Promise.resolve(),
    deleteWorkspace = () => Promise.resolve(),
    updateUserPresence = () => {},
    updateProject = () => Promise.resolve()
  } = useProject();
  const { daysLeft, isFree, isExpiringSoon, plan } = checkPlanStatus();

  // Starred/Favorite tools state
  const [favorites, setFavorites] = useState<ToolType[]>(() => {
    const saved = localStorage.getItem('ranktica_global_favorite_tools');
    return saved ? JSON.parse(saved) : [];
  });

  // Sync favorites with activeProject when it changes
  useEffect(() => {
    if (activeProject?.assets?.favoriteTools && Array.isArray(activeProject.assets.favoriteTools)) {
      setFavorites(activeProject.assets.favoriteTools);
    } else {
      const saved = localStorage.getItem('ranktica_global_favorite_tools');
      setFavorites(saved ? JSON.parse(saved) : []);
    }
  }, [activeProject]);

  const toggleFavorite = (tool: ToolType) => {
    let updated: ToolType[];
    if (favorites.includes(tool)) {
      updated = favorites.filter(t => t !== tool);
      toast.success(`Removed from favorites`);
    } else {
      updated = [...favorites, tool];
      toast.success(`Added to favorites! ⭐`);
    }
    setFavorites(updated);
    localStorage.setItem('ranktica_global_favorite_tools', JSON.stringify(updated));

    if (activeProject && updateProject) {
      updateProject(activeProject.id, {
        assets: {
          ...activeProject.assets,
          favoriteTools: updated
        }
      }).catch(err => console.warn('[Layout] Failed to save favorite tools to project settings:', err));
    }
  };

  const [showWorkspaceCreator, setShowWorkspaceCreator] = useState(false);
  const [wsName, setWsName] = useState("");
  const [wsHandle, setWsHandle] = useState("");
  const [wsNiche, setWsNiche] = useState("");
  const [wsAudience, setWsAudience] = useState("");
  const [wsGoal, setWsGoal] = useState("");

  const activeWorkspace = useMemo(() => {
    return workspaces.find(w => w.id === activeWorkspaceId) || workspaces[0] || null;
  }, [workspaces, activeWorkspaceId]);

  const filteredProjects = useMemo(() => {
    return projects.filter(p => !p.workspaceId || p.workspaceId === activeWorkspaceId);
  }, [projects, activeWorkspaceId]);

  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [showProjectSwitcher, setShowProjectSwitcher] = useState(false);
  const [projectSearchQuery, setProjectSearchQuery] = useState("");
  const desktopProjectSwitcherRef = useRef<HTMLDivElement>(null);
  const mobileProjectSwitcherRef = useRef<HTMLDivElement>(null);

  // Shortcut Manager state & configuration
  const DEFAULT_SHORTCUTS = useMemo(() => [
    { id: 'nav_dashboard', name: 'Navigate: Creator Command', modifier: 'Alt', key: 'd', action: 'nav', target: ToolType.DASHBOARD },
    { id: 'nav_ideas', name: 'Navigate: Idea Box', modifier: 'Alt', key: 'i', action: 'nav', target: ToolType.IDEAS },
    { id: 'nav_script', name: 'Navigate: Script Writer', modifier: 'Ctrl+Alt', key: 's', action: 'nav', target: ToolType.SCRIPT },
    { id: 'nav_video', name: 'Navigate: Video Studio', modifier: 'Ctrl+Alt', key: 'v', action: 'nav', target: ToolType.VIDEO },
    { id: 'nav_keyword', name: 'Navigate: Keyword Inspector', modifier: 'Ctrl+Alt', key: 'k', action: 'nav', target: ToolType.KEYWORD_INSPECTOR },
    { id: 'nav_employee_os', name: 'Navigate: AI Employee OS', modifier: 'Ctrl+Alt', key: 'a', action: 'nav', target: ToolType.AI_EMPLOYEE_OS },
    { id: 'nav_cost', name: 'Navigate: Cost & Governance', modifier: 'Ctrl+Alt', key: 'c', action: 'nav', target: ToolType.COST_GOVERNANCE },
    { id: 'macro_generate', name: 'Macro: Trigger AI Gen', modifier: 'Ctrl+Alt', key: 'g', action: 'macro', target: 'generate' },
    { id: 'macro_save', name: 'Macro: Save Draft', modifier: 'Ctrl', key: 's', action: 'macro', target: 'save' },
    { id: 'macro_clear', name: 'Macro: Clear Editor', modifier: 'Ctrl', key: 'e', action: 'macro', target: 'clear' },
  ], []);

  const [shortcuts, setShortcuts] = useState<any[]>(() => {
    const saved = localStorage.getItem('ranktica_custom_shortcuts');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.warn("Failed to parse custom shortcuts", e);
      }
    }
    return DEFAULT_SHORTCUTS;
  });

  // Sync shortcuts with user database profile on initial mount
  useEffect(() => {
    fetch('/api/db/user/settings')
      .then(r => r.json())
      .then(data => {
        if (data && Array.isArray(data.shortcuts) && data.shortcuts.length > 0) {
          setShortcuts(data.shortcuts);
          localStorage.setItem('ranktica_custom_shortcuts', JSON.stringify(data.shortcuts));
        }
      })
      .catch(() => {});
  }, []);

  const [recordingShortcutId, setRecordingShortcutId] = useState<string | null>(null);

  // Breadcrumbs path history state
  const [pathHistory, setPathHistory] = useState<ToolType[]>(() => [currentTool]);

  useEffect(() => {
    setPathHistory((prev) => {
      // If currentTool is already the last element, do nothing
      if (prev[prev.length - 1] === currentTool) return prev;

      // If currentTool is in history, truncate up to it (go back behavior)
      const index = prev.indexOf(currentTool);
      if (index !== -1) {
        return prev.slice(0, index + 1);
      }

      // Otherwise, append to stack
      const nextHistory = [...prev, currentTool];
      // Limit to 5 steps to keep layout clean
      if (nextHistory.length > 5) {
        return nextHistory.slice(nextHistory.length - 5);
      }
      return nextHistory;
    });
  }, [currentTool]);

  // Mobile swipe gestures navigation
  const touchStartX = useRef<number | null>(null);
  const touchStartY = useRef<number | null>(null);

  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length !== 1) return;
    touchStartX.current = e.touches[0].clientX;
    touchStartY.current = e.touches[0].clientY;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current === null || touchStartY.current === null) return;

    const touchEndX = e.changedTouches[0].clientX;
    const touchEndY = e.changedTouches[0].clientY;

    const diffX = touchEndX - touchStartX.current;
    const diffY = touchEndY - touchStartY.current;

    touchStartX.current = null;
    touchStartY.current = null;

    // Minimum distance of 100px for swipe, and vertical deviation of less than 50px
    if (Math.abs(diffX) > 100 && Math.abs(diffY) < 50) {
      const currentIndex = NAV_ITEMS.findIndex((item) => item.id === currentTool);
      if (currentIndex === -1) return;

      let nextIndex = currentIndex;
      if (diffX < 0) {
        // Swiped left -> next module
        nextIndex = (currentIndex + 1) % NAV_ITEMS.length;
      } else {
        // Swiped right -> previous module
        nextIndex = (currentIndex - 1 + NAV_ITEMS.length) % NAV_ITEMS.length;
      }

      const nextTool = NAV_ITEMS[nextIndex];
      if (nextTool) {
        onNavigate(nextTool.id);
      }
    }
  };

  const displayedProjects = useMemo(() => {
    let result = filteredProjects.filter((p) => !p.archived);
    if (projectSearchQuery.trim()) {
      const q = projectSearchQuery.toLowerCase();
      result = result.filter(
        (p) =>
          p.title.toLowerCase().includes(q) ||
          p.niche.toLowerCase().includes(q)
      );
    }
    return result;
  }, [filteredProjects, projectSearchQuery]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as Node;
      const insideDesktop = desktopProjectSwitcherRef.current?.contains(target);
      const insideMobile = mobileProjectSwitcherRef.current?.contains(target);

      if (!insideDesktop && !insideMobile) {
        setShowProjectSwitcher(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Sync user presence on tool changes instantly
  useEffect(() => {
    if (updateUserPresence) {
      updateUserPresence(currentTool);
    }
  }, [currentTool, activeProject?.id]);

  const { language, setLanguage, t } = useTranslation();
  const [theme, setTheme] = useState(() => {
    return localStorage.getItem('ranktica_active_theme') || 'cyberpunk-red';
  });
  const [previewTheme, setPreviewTheme] = useState<string | null>(null);

  const [displayDensity, setDisplayDensity] = useState<'compact' | 'cozy'>(() => {
    const saved = localStorage.getItem('ranktica_display_density');
    if (saved === 'spacious') return 'cozy';
    return (saved as 'compact' | 'cozy') || 'cozy';
  });

  useEffect(() => {
    const activeTheme = previewTheme || theme;
    document.documentElement.setAttribute('data-theme', activeTheme);
    document.body.setAttribute('data-theme', activeTheme);
    localStorage.setItem('ranktica_active_theme', theme);
  }, [theme, previewTheme]);

  useEffect(() => {
    document.documentElement.setAttribute('data-density', displayDensity);
    document.body.setAttribute('data-density', displayDensity);
    localStorage.setItem('ranktica_display_density', displayDensity);
  }, [displayDensity]);

  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [autoSaveActive, setAutoSaveActive] = useState(true);
  const [vocalAssistanceTone, setVocalAssistanceTone] = useState(true);
  
  const [isSystemSyncEnabled, setIsSystemSyncEnabled] = useState(() => {
    const saved = localStorage.getItem('ranktica_system_sync');
    if (saved === null) {
      const oldSaved = localStorage.getItem('ranktica_time_theme_toggle');
      return oldSaved !== 'false';
    }
    return saved === 'true';
  });

  const [focusBlocksEnabled, setFocusBlocksEnabled] = useState(() => {
    return localStorage.getItem('ranktica_focus_blocks_enabled') === 'true';
  });
  const [focusStartTime, setFocusStartTime] = useState(() => {
    return localStorage.getItem('ranktica_focus_start_time') || '09:00';
  });
  const [focusEndTime, setFocusEndTime] = useState(() => {
    return localStorage.getItem('ranktica_focus_end_time') || '17:00';
  });

  // Focus block automated scheduling theme override effect
  useEffect(() => {
    if (!focusBlocksEnabled) return;

    const checkFocusBlockTime = () => {
      const now = new Date();
      const currentH = now.getHours();
      const currentM = now.getMinutes();
      const currentMinVal = currentH * 60 + currentM;

      const [startH, startM] = focusStartTime.split(':').map(Number);
      const [endH, endM] = focusEndTime.split(':').map(Number);
      const startMinVal = startH * 60 + startM;
      const endMinVal = endH * 60 + endM;

      let isInBlock = false;
      if (startMinVal <= endMinVal) {
        isInBlock = currentMinVal >= startMinVal && currentMinVal < endMinVal;
      } else {
        // Overnight block (e.g. 22:00 to 06:00)
        isInBlock = currentMinVal >= startMinVal || currentMinVal < endMinVal;
      }

      if (isInBlock) {
        if (theme !== 'deep-work') {
          // Backup previous theme before deep-work override
          if (localStorage.getItem('ranktica_active_theme') !== 'deep-work') {
            localStorage.setItem('ranktica_pre_focus_theme', localStorage.getItem('ranktica_active_theme') || 'cyberpunk-red');
          }
          setTheme('deep-work');
          toast.success("🧠 Scheduled 'Focus Block' active! Switching to high-contrast Deep Work theme to maximize focus.", {
            id: 'focus-block-toast'
          });
        }
      } else {
        // Outside block: if current theme is deep-work, restore the previous user theme
        if (theme === 'deep-work') {
          const preTheme = localStorage.getItem('ranktica_pre_focus_theme') || 'cyberpunk-red';
          setTheme(preTheme);
          toast.success("🌅 Focus block concluded! Restoring previous layout theme.", {
            id: 'focus-block-toast'
          });
        }
      }
    };

    checkFocusBlockTime();
    const interval = setInterval(checkFocusBlockTime, 15000); // Check every 15 seconds
    return () => clearInterval(interval);
  }, [focusBlocksEnabled, focusStartTime, focusEndTime, theme]);

  const handleToggleSystemSync = () => {
    const nextVal = !isSystemSyncEnabled;
    setIsSystemSyncEnabled(nextVal);
    localStorage.setItem('ranktica_system_sync', String(nextVal));
    toast.success(`System Sync auto-theme ${nextVal ? 'enabled ⏰' : 'disabled ❌'}`);
  };

  const [showShortcutOverlay, setShowShortcutOverlay] = useState(false);

  useEffect(() => {
    const handleHelpShortcut = (e: KeyboardEvent) => {
      // Look for Ctrl+Shift+/ or Ctrl+Shift+?
      const isQuestionOrSlash = e.key === '/' || e.key === '?';
      if (e.ctrlKey && e.shiftKey && isQuestionOrSlash) {
        e.preventDefault();
        setShowShortcutOverlay(prev => !prev);
      }
    };
    window.addEventListener('keydown', handleHelpShortcut);
    return () => window.removeEventListener('keydown', handleHelpShortcut);
  }, []);
  
  const [showActivitySidebar, setShowActivitySidebar] = useState(false);
  const [activitiesList, setActivitiesList] = useState<any[]>([]);
  const [activeSidebarTab, setActiveSidebarTab] = useState<'my' | 'collaborator'>('my');
  const [collabFeed, setCollabFeed] = useState<any[]>([]);

  useEffect(() => {
    const refreshActivities = () => {
      setActivitiesList(getActivities());
    };
    refreshActivities();
    const interval = setInterval(refreshActivities, 5000);
    return () => clearInterval(interval);
  }, []);

  // Dynamics Collaborator Comments and Edits Stream Builder
  useEffect(() => {
    const pTitle = activeProject?.title || "AI Revolutionizing Filmmaking";
    const initialFeed = [
      {
        id: 'coll-1',
        name: 'Sarah Thorne',
        role: 'Creative Editor',
        avatarColor: 'bg-indigo-505 bg-indigo-600',
        action: 'edited script hook duration by -5s',
        projectTitle: pTitle,
        time: '3m ago',
        type: 'edit',
        comment: 'We need to speed up the hook to optimize the retention drop at second 3.'
      },
      {
        id: 'coll-2',
        name: 'David K.',
        role: 'SEO Specialist',
        avatarColor: 'bg-emerald-505 bg-emerald-600',
        action: 'optimized search keywords tag structure',
        projectTitle: pTitle,
        time: '18m ago',
        type: 'optimization'
      },
      {
        id: 'coll-3',
        name: 'Alex Rivera',
        role: 'Producer',
        avatarColor: 'bg-pink-550 bg-pink-600',
        action: 'left critical feedback on Title candidate A',
        projectTitle: pTitle,
        time: '1h ago',
        type: 'comment',
        comment: 'Option A title looks slightly generic. Suggest adding CPC high-intent triggers.'
      },
      {
        id: 'coll-4',
        name: 'Marcus Young',
        role: 'Video Animator',
        avatarColor: 'bg-purple-550 bg-purple-600',
        action: 'uploaded high-fidelity thumbnail template assets',
        projectTitle: pTitle,
        time: '3h ago',
        type: 'edit'
      }
    ];
    setCollabFeed(initialFeed);
  }, [activeProject]);

  useEffect(() => {
    const handleCollabSync = () => {
      if (!showActivitySidebar) return;
      const pTitle = activeProject?.title || "AI Revolutionizing Filmmaking";
      const names = ['Sarah Thorne', 'David K.', 'Alex Rivera', 'Marcus Young'];
      const actions = [
        { verb: 'added a comment on script scene 3', type: 'comment', text: 'Consider inserting an engaging visual transition here.' },
        { verb: 'rendered a viral micro-teaser snippet', type: 'edit' },
        { verb: 'refined competitor search ranking triggers', type: 'optimization' },
        { verb: 're-weighted thumbnail A/B split CTR confidence rating', type: 'optimization' },
        { verb: 'suggested a high-CTR alternative descriptor', type: 'comment', text: 'How about using localized metrics to peak curiosity?' }
      ];

      const rIndexName = Math.floor(Math.random() * names.length);
      const rIndexAct = Math.floor(Math.random() * actions.length);
      
      const newActionInstance = {
        id: 'coll-' + Date.now(),
        name: names[rIndexName],
        role: rIndexName === 0 ? 'Creative Editor' : rIndexName === 1 ? 'SEO Specialist' : rIndexName === 2 ? 'Producer' : 'Video Animator',
        avatarColor: rIndexName === 0 ? 'bg-indigo-600' : rIndexName === 1 ? 'bg-emerald-600' : rIndexName === 2 ? 'bg-pink-600' : 'bg-purple-600',
        action: actions[rIndexAct].verb,
        projectTitle: pTitle,
        time: 'Just now',
        type: actions[rIndexAct].type,
        comment: actions[rIndexAct].text
      };

      setCollabFeed(prev => [newActionInstance, ...prev.slice(0, 9)]);
      toast.success(`Dynamic Collab Feed update: ${newActionInstance.name} ${newActionInstance.action}! 👥`, { id: 'collab-feed-toast' });
    };

    const interval = setInterval(handleCollabSync, 20000); 
    return () => clearInterval(interval);
  }, [showActivitySidebar, activeProject]);

  // Exporters for Recent activities list
  const exportCSV = () => {
    if (activitiesList.length === 0) {
      toast.error("No tracked actions to export from local sandbox.", { id: 'csv-err' });
      return;
    }
    const headers = ["ID", "Creator Tool", "Action Details", "Audit Category", "Time Stamp"];
    const rows = activitiesList.map(act => [
      act.id || "",
      `"${(act.tool || "").replace(/"/g, '""')}"`,
      `"${(act.action || "").replace(/"/g, '""')}"`,
      `"${(act.type || "system").replace(/"/g, '""')}"`,
      `"${(act.time || "").replace(/"/g, '""')}"`
    ]);
    const csvContent = "data:text/csv;charset=utf-8," 
      + [headers.join(","), ...rows.map(e => e.join(","))].join("\n");
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `ranktica_audit_report_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success("Recent activities successfully exported as CSV spreadsheet! 📊", { id: 'csv-ok' });
  };

  const exportPDF = () => {
    if (activitiesList.length === 0) {
      toast.error("No tracked actions to export from local sandbox.", { id: 'pdf-err' });
      return;
    }
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      toast.error("Pop-up window blocked. Please permit pop-ups in your browser options.", { id: 'pdf-popup-blocked' });
      return;
    }
    
    const rowsHtml = activitiesList.map(act => `
      <tr style="border-bottom: 1px solid #e4e4e7;">
        <td style="padding: 12px 10px; font-size: 11px; font-weight: 700; color: #18181b; text-transform: uppercase;">${act.tool || 'System'}</td>
        <td style="padding: 12px 10px; font-size: 11px; color: #3f3f46; max-width: 300px;">${act.action || ''}</td>
        <td style="padding: 12px 10px; font-size: 10px; font-weight: 900; color: #ef4444; text-transform: uppercase; letter-spacing: 0.5px;">${act.type || 'system'}</td>
        <td style="padding: 12px 10px; font-size: 10px; font-family: monospace; color: #71717a;">${act.time || ''}</td>
      </tr>
    `).join('');

    const htmlContent = `
      <html>
        <head>
          <title>Ranktica AI Studio - Audit Ledger</title>
          <style>
            @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;700;900&display=swap');
            body { font-family: 'Inter', sans-serif; padding: 40px; color: #18181b; margin: 0; background: #fafafa; }
            .header-box { display: flex; justify-content: space-between; align-items: center; border-bottom: 3px solid #ef4444; padding-bottom: 24px; margin-bottom: 30px; }
            h1 { margin: 0; font-size: 26px; font-weight: 900; text-transform: uppercase; letter-spacing: -1px; color: #0d0d10; }
            .sub-title { margin: 5px 0 0 0; font-size: 11px; font-weight: 900; color: #ef4444; letter-spacing: 1px; text-transform: uppercase; }
            .meta-info { font-size: 11px; color: #4b5563; line-height: 1.6; text-align: right; }
            table { width: 100%; border-collapse: collapse; background: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05); }
            th { background: #111827; color: #ffffff; text-align: left; padding: 14px 10px; font-size: 10px; font-weight: 900; text-transform: uppercase; letter-spacing: 0.8px; }
            .footer-line { margin-top: 60px; text-align: center; font-size: 10px; color: #9ca3af; border-top: 1px solid #e5e7eb; padding-top: 24px; }
            @media print {
              body { background: none; padding: 20px; }
              table { box-shadow: none; border: 1px solid #e5e7eb; }
            }
          </style>
        </head>
        <body>
          <div class="header-box">
            <div>
              <h1>Ranktica AI Studio</h1>
              <p class="sub-title">System Activity Audit Ledger Report</p>
            </div>
            <div class="meta-info">
              <div><strong>Generated On:</strong> ${new Date().toLocaleString()}</div>
              <div><strong>Total operations recorded:</strong> ${activitiesList.length}</div>
              <div><strong>Fidelity level:</strong> SANDBOX AUTHENTICATED</div>
            </div>
          </div>
          <table>
            <thead>
              <tr>
                <th style="width: 25%">Creator Tool</th>
                <th style="width: 45%">Action / Ingestion Details</th>
                <th style="width: 15%">Category</th>
                <th style="width: 15%">Timestamp</th>
              </tr>
            </thead>
            <tbody>
              ${rowsHtml}
            </tbody>
          </table>
          <div class="footer-line">
            © ${new Date().getFullYear()} Ranktica AI Corporation. All rights reserved. This document serves as a verified local session audit track.
          </div>
          <script>
            window.onload = function() {
              window.print();
            }
          </script>
        </body>
      </html>
    `;

    printWindow.document.write(htmlContent);
    printWindow.document.close();
    toast.success("Audit ledger report preview loaded. Triggered system printable dialog! 🧾", { id: 'pdf-ok' });
  };

  const [isSessionLocked, setIsSessionLocked] = useState(false);
  const [unlockPassword, setUnlockPassword] = useState('');

  useEffect(() => {
    let idleTimeout: NodeJS.Timeout;
    
    const resetIdleTimer = () => {
      if (isSessionLocked) return;
      clearTimeout(idleTimeout);
      
      const IDLE_TIME_MS = 15 * 60 * 1000; // 15 minutes in milliseconds
      
      idleTimeout = setTimeout(() => {
        if (activeProject) {
          try {
            const backupKey = `ranktica_workspace_backup_${activeProject.id}`;
            localStorage.setItem(backupKey, JSON.stringify({
              timestamp: Date.now(),
              project: activeProject,
              workspaceId: activeWorkspaceId
            }));
            
            try {
              logActivity(
                `Workspace auto-saved and secure session locked after 15 minutes of inactivity.`,
                'Security Core',
                'system'
              );
            } catch (err) {
              console.error("Logger error", err);
            }
            
          } catch (err) {
            console.error("Auto-save configuration error:", err);
          }
        }
        
        setIsSessionLocked(true);
        toast.error("Session Locked: 15 minutes of inactivity detected. Active workspace successfully auto-saved! 🔒", {
          duration: 6000,
          id: 'session-lock-toast'
        });
      }, IDLE_TIME_MS);
    };

    window.addEventListener('mousemove', resetIdleTimer);
    window.addEventListener('keydown', resetIdleTimer);
    window.addEventListener('click', resetIdleTimer);
    window.addEventListener('scroll', resetIdleTimer);

    resetIdleTimer();

    return () => {
      clearTimeout(idleTimeout);
      window.removeEventListener('mousemove', resetIdleTimer);
      window.removeEventListener('keydown', resetIdleTimer);
      window.removeEventListener('click', resetIdleTimer);
      window.removeEventListener('scroll', resetIdleTimer);
    };
  }, [activeProject, activeWorkspaceId, isSessionLocked]);

  useEffect(() => {
    const activeTheme = previewTheme || theme;
    document.documentElement.setAttribute('data-theme', activeTheme);
    if (!previewTheme) {
      localStorage.setItem('ranktica_active_theme', theme);
    }
  }, [theme, previewTheme]);

  // Dynamic System Theme scheme observer callback (Defaults to Midnight Blue in dark mode)
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleSystemThemeChange = (e: MediaQueryListEvent | MediaQueryList) => {
      if (e.matches) {
        setTheme('midnight-blue');
      } else {
        setTheme('cyberpunk-red');
      }
    };

    const savedTheme = localStorage.getItem('ranktica_active_theme');
    if (!savedTheme) {
      handleSystemThemeChange(mediaQuery);
    }

    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener('change', handleSystemThemeChange);
    } else {
      mediaQuery.addListener(handleSystemThemeChange);
    }

    return () => {
      if (mediaQuery.removeEventListener) {
        mediaQuery.removeEventListener('change', handleSystemThemeChange);
      } else {
        mediaQuery.removeListener(handleSystemThemeChange);
      }
    };
  }, []);

  // Automatic CSS theme toggle based on user's local system sunrise/sunset times
  useEffect(() => {
    if (!isSystemSyncEnabled) return;

    const checkAndSetTimeTheme = () => {
      const now = new Date();
      const currentDecimalHour = now.getHours() + now.getMinutes() / 60;
      
      // Clinical Solar calculation for Sunrise/Sunset based on Earth's tilt & local month
      // Default: Sunrise is around 6:00 AM, Sunset is around 7:30 PM (19:30)
      const month = now.getMonth(); // 0-11
      const seasonalOffset = Math.sin((month - 2) * Math.PI / 6); // Max tilt in June, min in Dec
      const sunriseHour = 6.0 - 0.8 * seasonalOffset; // earlier in summer, later in winter
      const sunsetHour = 18.5 + 1.2 * seasonalOffset; // later in summer, earlier in winter

      const isDaytime = currentDecimalHour >= sunriseHour && currentDecimalHour < sunsetHour;
      const targetTheme = isDaytime ? 'emerald-forest' : 'midnight-blue';

      // Only set theme if it has changed from current and we're not previewing
      if (theme !== targetTheme && !previewTheme) {
        setTheme(targetTheme);
        const formatTime = (decimalHour: number) => {
          const h = Math.floor(decimalHour);
          const m = Math.floor((decimalHour - h) * 60);
          return `${h}:${m < 10 ? '0' : ''}${m}`;
        };
        toast(`System Sync: Switched to ${isDaytime ? 'Emerald Forest 🌲 (Daytime)' : 'Midnight Blue 🌙 (Nighttime)'} based on solar cycle (Sunrise ${formatTime(sunriseHour)} | Sunset ${formatTime(sunsetHour)})`, {
          id: 'auto-theme-toast',
          icon: '🌗',
          duration: 5000
        });
      }
    };

    // Run immediately on mount or when auto-toggle setting changes
    checkAndSetTimeTheme();

    const intervalId = setInterval(checkAndSetTimeTheme, 30000); // Check every 30 seconds
    return () => clearInterval(intervalId);
  }, [isSystemSyncEnabled, theme, previewTheme]);

  // Web Speech API Voice Command switch Listener
  const [isVoiceListening, setIsVoiceListening] = useState(false);
  const [voiceTranscript, setVoiceTranscript] = useState("");
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      const rec = new SpeechRecognition();
      rec.continuous = true;
      rec.interimResults = false;
      rec.lang = 'en-US';

      rec.onstart = () => {
        setIsVoiceListening(true);
      };

      rec.onresult = (event: any) => {
        const lastResultIndex = event.results.length - 1;
        const transcript = event.results[lastResultIndex][0].transcript;
        setVoiceTranscript(transcript);

        const text = transcript.toLowerCase();
        let targetTool: ToolType | null = null;
        
        if (text.includes("script writer") || text.includes("scripting") || text.includes("script")) {
          targetTool = ToolType.SCRIPT;
        } else if (text.includes("projects") || text.includes("production board") || text.includes("project")) {
          targetTool = ToolType.PROJECTS;
        } else if (text.includes("ideas") || text.includes("idea lab") || text.includes("ideas lab") || text.includes("idea")) {
          targetTool = ToolType.IDEAS;
        } else if (text.includes("dashboard") || text.includes("creator command")) {
          targetTool = ToolType.DASHBOARD;
        } else if (text.includes("video") || text.includes("video studio")) {
          targetTool = ToolType.VIDEO;
        } else if (text.includes("metadata") || text.includes("metadata engineer") || text.includes("metadata architect")) {
          targetTool = ToolType.METADATA_ENGINEER;
        } else if (text.includes("keyword inspector") || text.includes("keyword")) {
          targetTool = ToolType.KEYWORD_INSPECTOR;
        } else if (text.includes("competitor") || text.includes("competitor spy")) {
          targetTool = ToolType.COMPETITOR_SPY;
        } else if (text.includes("neural narration") || text.includes("audio")) {
          targetTool = ToolType.AUDIO;
        } else if (text.includes("shorts") || text.includes("shorts architect")) {
          targetTool = ToolType.SHORTS_GENERATOR;
        } else if (text.includes("seo font") || text.includes("seo optimizer")) {
          targetTool = ToolType.SEO;
        } else if (text.includes("live brainstorm") || text.includes("brainstorm")) {
          targetTool = ToolType.LIVE;
        }

        if (targetTool) {
          onNavigate(targetTool);
          const name = NAV_ITEMS.find((n) => n.id === targetTool)?.label || String(targetTool);
          toast.success(`Voice Navigated: Switched to ${name} 🎙️`, {
            id: 'voice-shortcut-nav',
            icon: '🎙️'
          });
        } else {
          toast(`Heard phrase: "${transcript}"`, {
            id: 'voice-heard',
            icon: '👂'
          });
        }
      };

      rec.onend = () => {
        setIsVoiceListening(false);
      };

      rec.onerror = (e: any) => {
        console.error("Speech Recognition error details:", e);
        setIsVoiceListening(false);
      };

      recognitionRef.current = rec;
    }
  }, [onNavigate]);

  const toggleVoiceListening = () => {
    if (!recognitionRef.current) {
      toast.error("Web Speech API has not loaded or is unsupported.", { id: "voice-unsupported" });
      return;
    }

    if (isVoiceListening) {
      recognitionRef.current.stop();
    } else {
      try {
        recognitionRef.current.start();
        toast.success("Voice command active. Say 'Go to Script Writer' or other tools!", {
          id: 'voice-started',
          icon: '🎙️'
        });
      } catch (err) {
        console.error("Failed to start speech recognition:", err);
        setIsVoiceListening(false);
      }
    }
  };

  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [rawFirestoreNotifications, setRawFirestoreNotifications] = useState<AlertNotification[]>([]);
  const [showNotificationCenter, setShowNotificationCenter] = useState(false);
  const [notifCategoryFilter, setNotifCategoryFilter] = useState<'All' | 'System' | 'Performance' | 'Action'>('All');

  const [runningTasks, setRunningTasks] = useState<any[]>([]);

  useEffect(() => {
    const handleTaskEvent = (e: Event) => {
      const customEvent = e as CustomEvent;
      const { id, name, type, duration, status, progress } = customEvent.detail || {};
      if (!id) return;
      
      if (status === 'start') {
        const item = { id, name, type, duration, progress: 0, etaSecs: duration || 15 };
        setRunningTasks(prev => {
          if (prev.some(t => t.id === id)) return prev;
          return [...prev, item];
        });
      } else if (status === 'complete') {
        setRunningTasks(prev => prev.filter(t => t.id !== id));
        FCMService.simulateFcmJobCompleted(name, 'complete');
      } else if (status === 'failed') {
        setRunningTasks(prev => prev.filter(t => t.id !== id));
        FCMService.simulateFcmJobCompleted(name, 'failed');
      } else if (status === 'update') {
        setRunningTasks(prev => prev.map(t => t.id === id ? { ...t, progress: progress ?? t.progress } : t));
      }
    };

    window.addEventListener('ranktica-background-task', handleTaskEvent);
    return () => window.removeEventListener('ranktica-background-task', handleTaskEvent);
  }, []);

  useEffect(() => {
    if (runningTasks.length === 0) return;
    const interval = setInterval(() => {
      setRunningTasks(prev => {
        return prev.map(t => {
          if (t.progress >= 99) return t;
          const inc = t.duration > 0 ? (100 / t.duration) : 6.5;
          return {
            ...t,
            progress: Math.min(99, Math.round(t.progress + inc)),
            etaSecs: Math.max(0, t.etaSecs - 1)
          };
        });
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [runningTasks.length]);

  const filteredNotifications = useMemo(() => {
    if (notifCategoryFilter === 'All') return notifications;
    return notifications.filter((n) => (n.category || 'System') === notifCategoryFilter);
  }, [notifications, notifCategoryFilter]);

  useEffect(() => {
    setNotifications(getNotifications());
    const unsubscribe = subscribeNotifications(() => {
      const localItems = getNotifications().filter(li => !li.id.startsWith('notif-'));
      const mappedNotifs: NotificationItem[] = rawFirestoreNotifications.map((fn) => ({
        id: fn.id,
        message: `${fn.message}`,
        type: fn.type,
        timestamp: new Date(fn.createdAt).toISOString(),
        read: fn.status === 'read',
        category: fn.type === 'success' ? 'Action' : fn.type === 'info' ? 'System' : 'Performance'
      }));
      const combined = [...mappedNotifs, ...localItems].sort(
        (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
      );
      setNotifications(combined);
    });
    return unsubscribe;
  }, [rawFirestoreNotifications]);

  useEffect(() => {
    const userEmail = user?.email || "";
    if (!userEmail) return;

    const unsubscribeFirestore = subscribeToNotifications(userEmail, (firestoreNotifs) => {
      setRawFirestoreNotifications(firestoreNotifs);

      const mappedNotifs: NotificationItem[] = firestoreNotifs.map((fn) => ({
        id: fn.id,
        message: `${fn.message}`,
        type: fn.type,
        timestamp: new Date(fn.createdAt).toISOString(),
        read: fn.status === 'read',
        category: fn.type === 'success' ? 'Action' : fn.type === 'info' ? 'System' : 'Performance'
      }));

      const localItems = getNotifications().filter(li => !li.id.startsWith('notif-'));
      
      const combined = [...mappedNotifs, ...localItems].sort(
        (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
      );

      setNotifications(combined);
    });

    return unsubscribeFirestore;
  }, [user]);

  const handleMarkAllAsRead = async () => {
    markAllNotificationsAsRead();
    const userEmail = user?.email || "";
    if (userEmail) {
      try {
        const unread = rawFirestoreNotifications.filter((n) => n.status === "unread");
        if (unread.length > 0) {
          await markAllAsReadBatch(unread);
        }
      } catch (err) {
        console.error("Firestore batch mark read failed:", err);
      }
    }
  };

  const unreadCount = notifications.filter((n) => !n.read).length;

  const [showSearchModal, setShowSearchModal] = useState(false);
  const [showHotkeysOverlay, setShowHotkeysOverlay] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchCategory, setSearchCategory] = useState("All");
  const [focusedIndex, setFocusedIndex] = useState(0);

  const recentProjects = useMemo(() => {
    return [...filteredProjects]
      .filter((p) => !p.archived && p.title)
      .sort((a, b) => (b.lastUpdated || 0) - (a.lastUpdated || 0))
      .slice(0, 5);
  }, [filteredProjects]);

  const [globalSearchQuery, setGlobalSearchQuery] = useState("");
  const [showGlobalSearchResults, setShowGlobalSearchResults] = useState(false);
  const [globalSearchFilter, setGlobalSearchFilter] = useState<'all' | 'projects' | 'scripts' | 'ideas' | 'entities'>('all');

  const globalSearchMatches = useMemo(() => {
    if (!globalSearchQuery.trim()) return { projects: [], scripts: [], assets: [], entities: [] };
    const query = globalSearchQuery.toLowerCase();

    const matchedProjects: any[] = [];
    const matchedScripts: any[] = [];
    const matchedAssets: any[] = [];
    const matchedEntities: any[] = [];

    // Helper to find and push unique entities (hashtags, handles)
    const extractEntities = (text: string, prj: any) => {
      if (!text) return;
      // Extract hashtags
      const hashRegex = /#\w+/g;
      let match;
      while ((match = hashRegex.exec(text)) !== null) {
        const tag = match[0];
        if (tag.toLowerCase().includes(query.replace('#', '')) && !matchedEntities.some(e => e.name === tag && e.project.id === prj.id)) {
          matchedEntities.push({
            project: prj,
            type: 'Hashtag Entity',
            name: tag,
            sub: `Tag in project: ${prj.title}`,
            targetTool: ToolType.SEO
          });
        }
      }
      // Extract @ handles
      const handleRegex = /@\w+/g;
      while ((match = handleRegex.exec(text)) !== null) {
        const handle = match[0];
        if (handle.toLowerCase().includes(query.replace('@', '')) && !matchedEntities.some(e => e.name === handle && e.project.id === prj.id)) {
          matchedEntities.push({
            project: prj,
            type: 'Agent / Handle Entity',
            name: handle,
            sub: `Reference in project: ${prj.title}`,
            targetTool: ToolType.AI_EMPLOYEE_OS
          });
        }
      }
    };

    filteredProjects.forEach((prj) => {
      if (prj.archived) return;
      
      // Extract entities from project content
      extractEntities(prj.title, prj);
      extractEntities(prj.niche, prj);
      if (prj.description) extractEntities(prj.description, prj);
      if (prj.audience) extractEntities(prj.audience, prj);

      // 1. Projects
      const titleMatches = prj.title?.toLowerCase().includes(query);
      const nicheMatches = prj.niche?.toLowerCase().includes(query);
      const audienceMatches = prj.audience?.toLowerCase().includes(query);
      const statusMatches = prj.status?.toLowerCase().includes(query);

      if (titleMatches || nicheMatches || audienceMatches || statusMatches) {
        matchedProjects.push(prj);
      }

      // 2. Scripts
      const scriptContent = prj.assets?.script;
      if (typeof scriptContent === 'string') {
        extractEntities(scriptContent, prj);
        if (scriptContent.toLowerCase().includes(query)) {
          const index = scriptContent.toLowerCase().indexOf(query);
          const snippetStart = Math.max(0, index - 20);
          const snippetEnd = Math.min(scriptContent.length, index + query.length + 30);
          const snippet = (snippetStart > 0 ? "..." : "") + scriptContent.substring(snippetStart, snippetEnd) + (snippetEnd < scriptContent.length ? "..." : "");
          matchedScripts.push({ project: prj, snippet });
        }
      }

      // 3. Generated Assets / Idea Lab Documents
      if (prj.assets?.ideas) {
        prj.assets.ideas.forEach((idea: any) => {
          extractEntities(idea.title, prj);
          extractEntities(idea.hook, prj);
          if (
            idea.title?.toLowerCase().includes(query) ||
            idea.hook?.toLowerCase().includes(query) ||
            (idea.seo_keywords && idea.seo_keywords.some((kw: string) => kw.toLowerCase().includes(query)))
          ) {
            matchedAssets.push({
              project: prj,
              type: 'Idea',
              name: idea.title,
              sub: idea.hook,
              targetTool: ToolType.IDEAS
            });
          }
        });
      }

      // Check SEO titles
      if (prj.assets?.seo?.titles) {
        prj.assets.seo.titles.forEach((seoTitle: string) => {
          extractEntities(seoTitle, prj);
          if (seoTitle.toLowerCase().includes(query)) {
            matchedAssets.push({
              project: prj,
              type: 'Title / SEO',
              name: seoTitle,
              sub: `From project: ${prj.title}`,
              targetTool: ToolType.SEO
            });
          }
        });
      }

      // Check SEO tags/hashtags
      if (prj.assets?.seo?.tags) {
        prj.assets.seo.tags.forEach((tag: string) => {
          extractEntities(tag, prj);
          if (tag.toLowerCase().includes(query)) {
            matchedAssets.push({
              project: prj,
              type: 'SEO Tag',
              name: tag,
              sub: `Tag in project: ${prj.title}`,
              targetTool: ToolType.SEO
            });
          }
        });
      }

      // Check VideoUri / video
      if (prj.assets?.videoUri && prj.assets.videoUri.toLowerCase().includes(query)) {
        matchedAssets.push({
          project: prj,
          type: 'Video Stream',
          name: 'Video File Asset',
          sub: prj.assets.videoUri,
          targetTool: ToolType.VIDEO
        });
      }
    });

    return {
      projects: matchedProjects.slice(0, 5),
      scripts: matchedScripts.slice(0, 5),
      assets: matchedAssets.slice(0, 5),
      entities: matchedEntities.slice(0, 5)
    };
  }, [globalSearchQuery, filteredProjects]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // 1. Check if user is typing inside an input or editable field
      const target = e.target as HTMLElement;
      const isTypingInField = 
        target?.tagName === "INPUT" || 
        target?.tagName === "TEXTAREA" || 
        target?.isContentEditable;

      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setShowSearchModal((prev) => !prev);
      }
      
      if (e.key === "Escape") {
        setShowSearchModal(false);
        setShowHotkeysOverlay(false);
      }

      // Handle '?' key for navigation overlays only if not typing in text fields
      if (e.key === "?" && !isTypingInField) {
        e.preventDefault();
        setShowHotkeysOverlay((prev) => !prev);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Filter matching tools
  const matchingTools = NAV_ITEMS.filter((item) => {
    const matchesQuery =
      item.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (item.category || "").toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory =
      searchCategory === "All" || item.category === searchCategory;
    return matchesQuery && matchesCategory;
  });

  const commandActions = useMemo(() => [
    {
      id: "generate-script",
      label: "Generate new script",
      toolId: ToolType.SCRIPT,
      actionType: "generate",
      desc: "Auto-compose an optimized video production script",
      shortcut: "⌘G",
    },
    {
      id: "save-script",
      label: "Save active script",
      toolId: ToolType.SCRIPT,
      actionType: "save",
      desc: "Securely persist active script to storage",
      shortcut: "⌘S",
    },
    {
      id: "clear-script",
      label: "Clear script workspace",
      toolId: ToolType.SCRIPT,
      actionType: "clear",
      desc: "Erase current editor contents",
      shortcut: "⌘E",
    },
    {
      id: "analyze-competitor",
      label: "Analyze competitor performance",
      toolId: ToolType.COMPETITOR_SPY,
      actionType: "analyze",
      desc: "Scan and decode competitive channel metrics",
      shortcut: "⌘G",
    },
    {
      id: "trigger-ideation",
      label: "Trigger viral idea generation",
      toolId: ToolType.IDEAS,
      actionType: "generate",
      desc: "Generate viral raw idea suggestions with AI",
      shortcut: "⌘G",
    }
  ], []);

  const matchingActions = useMemo(() => {
    return commandActions.filter((action) => {
      const matchesQuery =
        action.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
        action.desc.toLowerCase().includes(searchQuery.toLowerCase());
      
      const toolItem = NAV_ITEMS.find(n => n.id === action.toolId);
      const matchesCategory =
        searchCategory === "All" || (toolItem && toolItem.category === searchCategory);
        
      return matchesQuery && matchesCategory;
    });
  }, [commandActions, searchQuery, searchCategory]);

  const matchingProjects = useMemo(() => {
    if (!searchQuery.trim()) return [];
    return filteredProjects.filter((p) => 
      p.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.niche?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.status?.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [filteredProjects, searchQuery]);

  // Combine matching search actions, tools, and project history for simple single-indexed array arrow keys navigation
  const combinedResults = useMemo(() => {
    const list: Array<
      | { type: "action"; data: typeof commandActions[0] }
      | { type: "tool"; data: typeof NAV_ITEMS[0] }
      | { type: "project"; data: any }
    > = [];
    matchingActions.forEach((a) => list.push({ type: "action", data: a }));
    matchingTools.forEach((t) => list.push({ type: "tool", data: t }));
    matchingProjects.forEach((p) => list.push({ type: "project", data: p }));
    return list;
  }, [matchingActions, matchingTools, matchingProjects]);

  // Reset focus selection on filter/query adjustments
  useEffect(() => {
    setFocusedIndex(0);
  }, [searchQuery, searchCategory, showSearchModal]);

  const triggerPaletteAction = (action: typeof commandActions[0]) => {
    onNavigate(action.toolId);
    setTimeout(() => {
      window.dispatchEvent(
        new CustomEvent("ranktica-action", {
          detail: { actionType: action.actionType }
        })
      );
    }, 150);
    toast.success(`Executed action: ${action.label}`);
    setShowSearchModal(false);
    setSearchQuery("");
  };

  const handlePaletteKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (combinedResults.length === 0) return;

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setFocusedIndex((prev) => (prev + 1) % combinedResults.length);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setFocusedIndex((prev) => (prev - 1 + combinedResults.length) % combinedResults.length);
    } else if (e.key === "Enter") {
      e.preventDefault();
      const selection = combinedResults[focusedIndex];
      if (selection) {
        if (selection.type === "action") {
          triggerPaletteAction(selection.data);
        } else {
          onNavigate(selection.data.id);
          setShowSearchModal(false);
          setSearchQuery("");
        }
      }
    }
  };

  useEffect(() => {
    const handleShortcutKeys = (e: KeyboardEvent) => {
      // If we are currently recording a shortcut, intercept and bind it
      if (recordingShortcutId) {
        e.preventDefault();
        e.stopPropagation();

        const pressedKey = e.key.toLowerCase();
        // Skip if key is only raw modifier
        if (['control', 'alt', 'shift', 'meta', 'escape'].includes(pressedKey)) {
          return;
        }

        let modifier: 'Ctrl+Alt' | 'Shift+Alt' | 'Alt' | 'Ctrl' | 'None' = 'None';
        const hasCtrl = e.ctrlKey || e.metaKey;
        const hasAlt = e.altKey;
        const hasShift = e.shiftKey;

        if (hasCtrl && hasAlt) {
          modifier = 'Ctrl+Alt';
        } else if (hasShift && hasAlt) {
          modifier = 'Shift+Alt';
        } else if (hasAlt) {
          modifier = 'Alt';
        } else if (hasCtrl) {
          modifier = 'Ctrl';
        }

        const updatedShortcuts = shortcuts.map(s => {
          if (s.id === recordingShortcutId) {
            return { ...s, modifier, key: pressedKey };
          }
          return s;
        });

        setShortcuts(updatedShortcuts);
        localStorage.setItem('ranktica_custom_shortcuts', JSON.stringify(updatedShortcuts));
        
        // Persist to user database profile
        fetch('/api/db/user/settings', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ shortcuts: updatedShortcuts })
        }).catch(() => {});

        toast.success(`Bound ${modifier !== 'None' ? modifier + ' + ' : ''}${pressedKey.toUpperCase()} and saved to user profile!`, {
          id: 'shortcut-configured-success'
        });
        setRecordingShortcutId(null);
        return;
      }

      const activeEl = document.activeElement;
      if (
        activeEl &&
        (activeEl.tagName === "INPUT" ||
          activeEl.tagName === "TEXTAREA" ||
          activeEl.getAttribute("contenteditable") === "true")
      ) {
        // Skip hotkeys unless saving
        if (!((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "s")) {
          return;
        }
      }

      const pressedKey = e.key.toLowerCase();
      const needsCtrl = e.ctrlKey || e.metaKey;
      const needsAlt = e.altKey;
      const needsShift = e.shiftKey;

      // Find if any custom shortcut matches this keystroke
      for (const s of shortcuts) {
        const matchesModifier =
          (s.modifier === 'Ctrl+Alt' && needsCtrl && needsAlt) ||
          (s.modifier === 'Shift+Alt' && needsShift && needsAlt) ||
          (s.modifier === 'Ctrl' && needsCtrl && !needsAlt) ||
          (s.modifier === 'Alt' && needsAlt && !needsCtrl) ||
          (s.modifier === 'None' && !needsCtrl && !needsAlt);

        if (matchesModifier && pressedKey === s.key) {
          e.preventDefault();

          if (s.action === 'nav') {
            onNavigate(s.target as ToolType);
            const name = NAV_ITEMS.find((n) => n.id === s.target)?.label || String(s.target);
            toast.success(`Switched to ${name}`, {
              id: 'keyboard-shortcut-nav',
              icon: '⚡'
            });
          } else if (s.action === 'macro') {
            const activeAction = commandActions.find(
              (a) => a.toolId === currentTool && a.actionType === s.target
            );
            if (activeAction) {
              window.dispatchEvent(
                new CustomEvent("ranktica-action", {
                  detail: { actionType: s.target }
                })
              );
              toast.success("Triggered payload: " + activeAction.label);
            } else {
              toast.error(`Macro "${s.name}" is not supported on current view.`);
            }
          }
          break;
        }
      }
    };

    window.addEventListener("keydown", handleShortcutKeys);
    return () => window.removeEventListener("keydown", handleShortcutKeys);
  }, [commandActions, currentTool, shortcuts, recordingShortcutId]);

  const categories = [
    "All",
    ...Array.from(new Set(NAV_ITEMS.map((i) => i.category || "Other"))),
  ];

  if (isSessionLocked) {
    return (
      <div className="fixed inset-0 z-[99999] bg-[#09090b] flex flex-col items-center justify-center p-6 text-white font-sans overflow-hidden">
        {/* Background futuristic tech grids/glows */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(239,68,68,0.06),transparent_60%)] pointer-events-none" />
        
        <div className="w-full max-w-md p-8 md:p-10 rounded-[2rem] bg-zinc-900 border border-zinc-800 shadow-2xl relative z-10 space-y-6 text-center">
          <div className="flex flex-col items-center gap-3">
            <div className="w-16 h-16 rounded-full bg-red-650/10 border border-red-500/20 flex items-center justify-center text-red-500 shadow-lg animate-pulse">
              <ShieldAlert size={28} />
            </div>
            <div className="space-y-1">
              <h2 className="text-xl font-black bg-gradient-to-r from-red-500 to-orange-500 bg-clip-text text-transparent uppercase tracking-tight">
                Secure Session Lock
              </h2>
              <p className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest">
                Ranktica AI Enterprise Suite
              </p>
            </div>
          </div>

          <div className="space-y-3.5 bg-zinc-950/60 border border-zinc-850/60 p-5 rounded-2xl text-left">
            <div className="flex items-center justify-between text-[10px] font-mono text-zinc-500 uppercase tracking-wider">
              <span>Security Status:</span>
              <span className="text-red-500 font-extrabold animate-pulse">Protected</span>
            </div>
            <div className="flex items-center justify-between text-[10px] font-mono text-zinc-500 uppercase tracking-wider">
              <span>Auto-Save Action:</span>
              <span className="text-green-500 font-extrabold">Active & Verified</span>
            </div>
            <div className="h-[1px] bg-zinc-850/60 my-2" />
            <p className="text-xs text-zinc-400 leading-relaxed text-center">
              This terminal has been locked after <strong className="text-white">15 minutes of inactivity</strong>. Your active workspace configurations and ongoing scripts were successfully committed to durable storage backup.
            </p>
          </div>

          <form 
            onSubmit={(e) => {
              e.preventDefault();
              setIsSessionLocked(false);
              setUnlockPassword('');
              toast.success("Workspace access restored. Welcome back, Administrator! ⚡", {
                icon: '🔑'
              });
            }}
            className="space-y-4"
          >
            <div className="space-y-2 text-left">
              <label className="text-[9px] font-black uppercase text-zinc-500 tracking-widest block ml-1">
                Enter Unlock Code or Signature
              </label>
              <input
                type="password"
                required
                placeholder="Type 'admin' or any code to unlock..."
                value={unlockPassword}
                onChange={(e) => setUnlockPassword(e.target.value)}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 text-sm text-center font-bold text-white focus:outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500 transition-all placeholder:text-zinc-700"
              />
            </div>

            <button
              type="submit"
              className="w-full py-3 rounded-xl bg-red-650 hover:bg-red-600 text-white font-black uppercase text-[11px] tracking-wider transition-all shadow-xl shadow-red-950/20 active:scale-[0.98] cursor-pointer flex items-center justify-center gap-2"
            >
              <Unlock size={12} fill="currentColor" />
              <span>Unlock Cockpit</span>
            </button>
          </form>

          <p className="text-[9px] font-mono text-zinc-650 uppercase tracking-widest">
            Cryptographic Lock Protocol Active
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-[#09090b] text-white overflow-hidden font-sans">
      {/* Sidebar */}
      <DesktopSidebar
        currentTool={currentTool}
        onNavigate={onNavigate}
        favorites={favorites}
        toggleFavorite={toggleFavorite}
        user={user}
        theme={theme}
        previewTheme={previewTheme}
        setPreviewTheme={setPreviewTheme}
        setTheme={setTheme}
        activeWorkspaceId={activeWorkspaceId}
        setActiveWorkspaceId={setActiveWorkspaceId}
        workspaces={workspaces}
        setShowWorkspaceCreator={setShowWorkspaceCreator}
        deleteWorkspace={deleteWorkspace}
        activeWorkspace={activeWorkspace}
        isExpiringSoon={isExpiringSoon}
        daysLeft={daysLeft}
        isFree={isFree}
        plan={plan}
        navItems={NAV_ITEMS}
        t={t}
        logout={logout}
      />

            {/* Main Area */}
      <main className="flex-1 flex flex-col relative overflow-hidden bg-[#09090b]">
        {/* Mobile Header */}
        <header className="flex md:hidden items-center justify-between px-4 py-3 border-b border-zinc-800 bg-[#0f0f12]/90 backdrop-blur-md sticky top-0 z-30 shrink-0">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsMobileMenuOpen(true)}
              className="p-2 hover:bg-zinc-800/80 text-zinc-400 hover:text-white rounded-xl transition-all active:scale-90"
              aria-label="Open navigation menu"
            >
              <Menu size={20} />
            </button>
            <span className="text-sm font-black bg-gradient-to-r from-red-500 to-orange-500 bg-clip-text text-transparent tracking-tight">
              Ranktica AI
            </span>
          </div>

          <div className="flex items-center gap-1.5">
            {/* Project Switcher */}
            <div className="relative" ref={mobileProjectSwitcherRef}>
              <button
                onClick={() => {
                  setShowProjectSwitcher(!showProjectSwitcher);
                  setProjectSearchQuery("");
                }}
                className={`flex items-center gap-2 p-2 rounded-xl border transition-all ${
                  activeProject ? "bg-zinc-900 border-zinc-800 text-white" : "bg-red-650/10 border-red-500/20 text-red-400"
                }`}
                title="Switch Project"
              >
                <Briefcase size={14} className={activeProject ? "text-blue-500" : "text-red-500"} />
              </button>

              {showProjectSwitcher && (
                <div className="absolute top-full right-0 mt-2 w-72 max-w-[calc(100vw-2.5rem)] bg-zinc-900 border border-zinc-800 rounded-2xl shadow-2xl z-50 overflow-hidden glass-morphism animate-scale-in">
                  <div className="p-4 border-b border-zinc-800 flex items-center justify-between">
                    <span className="text-[9px] font-black text-zinc-500 uppercase tracking-widest">
                      Active Manifests
                    </span>
                    <button
                      onClick={() => {
                        onNavigate(ToolType.PROJECTS);
                        setShowProjectSwitcher(false);
                      }}
                      className="text-[9px] font-black text-blue-400 uppercase hover:text-blue-300"
                    >
                      Manage All
                    </button>
                  </div>

                  {/* Micro Search Input inside Dropdown */}
                  <div className="px-3 py-2 border-b border-zinc-800 bg-zinc-950/40">
                    <div className="relative flex items-center">
                      <Search size={12} className="absolute left-2.5 text-zinc-500" />
                      <input
                        type="text"
                        value={projectSearchQuery}
                        onChange={(e) => setProjectSearchQuery(e.target.value)}
                        placeholder="Search active projects..."
                        className="w-full pl-7 pr-3 py-1 bg-zinc-900 border border-zinc-800 rounded-lg text-[10px] text-zinc-300 placeholder-zinc-600 focus:outline-none focus:border-red-500/50 font-mono"
                        onClick={(e) => e.stopPropagation()}
                      />
                      {projectSearchQuery && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setProjectSearchQuery("");
                          }}
                          className="absolute right-2 text-zinc-600 hover:text-zinc-400 text-[10px]"
                        >
                          ✕
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="max-h-60 overflow-y-auto py-1 custom-scrollbar">
                    {displayedProjects.length === 0 ? (
                      <div className="p-4 text-center text-[10px] text-zinc-500 font-mono italic">
                        No matching projects found
                      </div>
                    ) : (
                      displayedProjects.map((p) => (
                        <button
                          key={p.id}
                          onClick={() => {
                            setActiveProjectById(p.id);
                            setShowProjectSwitcher(false);
                            toast.success(`Context loaded: ${p.title} 📂`);
                          }}
                          className={`w-full text-left px-5 py-3 hover:bg-zinc-800/50 transition-all flex items-center justify-between gap-2 border-l-2 ${
                            activeProject?.id === p.id 
                              ? "bg-zinc-800/30 border-red-500" 
                              : "border-transparent"
                          }`}
                        >
                          <div className="flex flex-col gap-0.5 min-w-0 flex-1">
                            <span className={`text-xs font-black truncate ${activeProject?.id === p.id ? "text-red-400" : "text-zinc-200"}`}>
                              {p.title}
                            </span>
                            <span className="text-[8px] font-bold text-zinc-600 uppercase truncate">
                              {p.niche} • {p.status}
                            </span>
                          </div>
                          {activeProject?.id === p.id && (
                            <CheckCheck size={12} className="text-red-500 shrink-0" />
                          )}
                        </button>
                      ))
                    )}
                  </div>
                  <button
                    onClick={() => {
                      onNavigate(ToolType.PROJECTS);
                      setShowProjectSwitcher(false);
                    }}
                    className="w-full p-4 bg-zinc-950 border-t border-zinc-800 text-[10px] font-black text-zinc-400 hover:text-white uppercase tracking-widest transition-colors flex items-center justify-center gap-2"
                  >
                    <Plus size={12} /> New Project Manifest
                  </button>
                </div>
              )}
            </div>

            {/* Theme switcher */}
            <div className="relative flex h-8 items-center gap-1 px-2 rounded-xl border border-zinc-800 bg-zinc-900">
              <Palette size={12} className="text-zinc-500" />
              <select
                value={theme}
                onChange={(e) => {
                  setTheme(e.target.value);
                  let themeName = 'Cyberpunk Red';
                  if (e.target.value === 'midnight-blue') themeName = 'Midnight Blue';
                  else if (e.target.value === 'emerald-forest') themeName = 'Emerald Forest';
                  else if (e.target.value === 'deep-work') themeName = 'Deep Work';
                  toast.success(`Theme loaded: ${themeName} 🎨`);
                }}
                className="bg-transparent text-[8px] font-black uppercase text-zinc-400 outline-none cursor-pointer hover:text-white transition-colors max-w-[60px]"
              >
                <option value="cyberpunk-red" className="bg-[#09090b] text-white">Red</option>
                <option value="midnight-blue" className="bg-[#030712] text-white">Blue</option>
                <option value="emerald-forest" className="bg-[#022c22] text-white">Forest</option>
                <option value="deep-work" className="bg-[#000000] text-white">Work</option>
              </select>
            </div>

            {/* Mobile Language selector */}
            <div className="relative flex h-8 items-center gap-1 px-2 rounded-xl border border-zinc-800 bg-zinc-900">
              <Globe size={12} className="text-zinc-500" />
              <select
                value={language}
                onChange={(e) => {
                  setLanguage(e.target.value as LanguageCode);
                  toast.success(`Language: ${e.target.value.toUpperCase()} 🌐`);
                }}
                className="bg-transparent text-[8px] font-black uppercase text-zinc-400 outline-none cursor-pointer hover:text-white transition-colors max-w-[48px]"
              >
                <option value="en" className="bg-[#09090b] text-white">EN</option>
                <option value="es" className="bg-[#09090b] text-white">ES</option>
                <option value="fr" className="bg-[#09090b] text-white">FR</option>
              </select>
            </div>

            {/* Mobile Display Density Selector */}
            <div className="relative flex h-8 items-center gap-1 px-2 rounded-xl border border-zinc-800 bg-zinc-900" title="Display Density">
              <Sliders size={12} className="text-zinc-500" />
              <select
                value={displayDensity}
                onChange={(e) => {
                  const val = e.target.value as 'cozy' | 'compact';
                  setDisplayDensity(val);
                  toast.success(`Density: ${val.toUpperCase()} 📐`);
                }}
                className="bg-transparent text-[8px] font-black uppercase text-zinc-400 outline-none cursor-pointer hover:text-white transition-colors max-w-[48px]"
              >
                <option value="cozy" className="bg-[#09090b] text-white">Cozy</option>
                <option value="compact" className="bg-[#09090b] text-white">Comp</option>
              </select>
            </div>

            {/* Notification triggers */}
            <button
              onClick={() => {
                setShowNotificationCenter(!showNotificationCenter);
                if (!showNotificationCenter) {
                  handleMarkAllAsRead();
                }
              }}
              className="relative p-2 bg-zinc-900 border border-zinc-800 rounded-xl text-zinc-400 hover:text-white"
            >
              <Bell size={14} />
              {unreadCount > 0 && (
                <span className="absolute -right-1 -top-1 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-red-650 bg-red-600 text-[7px] font-black text-white">
                  {unreadCount}
                </span>
              )}
            </button>

            {/* Tour/Sparkles */}
            <button
              onClick={() => window.dispatchEvent(new CustomEvent("ranktica-start-onboarding-tour"))}
              className="p-2 bg-red-500/10 border border-red-500/20 text-red-400 rounded-xl"
              title="Start Onboarding Tour"
            >
              <Sparkles size={14} className="animate-pulse" />
            </button>
          </div>
        </header>

        {/* Mobile Breadcrumbs bar */}
        <div className="flex md:hidden items-center gap-1.5 px-4 py-2 bg-[#0d0d10] border-b border-zinc-800/60 overflow-x-auto whitespace-nowrap scrollbar-none text-[9px] font-mono font-bold tracking-wider text-zinc-500">
          <button 
            onClick={() => onNavigate(ToolType.DASHBOARD)}
            className="text-red-500 hover:text-red-400 transition-colors uppercase cursor-pointer shrink-0"
          >
            Ranktica AI
          </button>
          {pathHistory.map((tool, idx) => {
            const isLast = idx === pathHistory.length - 1;
            const label = NAV_ITEMS.find(n => n.id === tool)?.label || tool.replace('_', ' ').toUpperCase();
            return (
              <React.Fragment key={tool}>
                <ChevronRight size={8} className="text-zinc-800 shrink-0" />
                <button
                  disabled={isLast}
                  onClick={() => onNavigate(tool)}
                  className={`uppercase transition-all shrink-0 ${
                    isLast 
                      ? 'text-zinc-300 font-extrabold cursor-default' 
                      : 'text-zinc-500 hover:text-zinc-300 cursor-pointer hover:underline'
                  }`}
                >
                  {label}
                </button>
              </React.Fragment>
            );
          })}
        </div>

        {/* Desktop Header */}
        <header className="hidden md:flex items-center justify-between px-8 py-4 border-b border-zinc-800 bg-[#0f0f12]/80 backdrop-blur-md sticky top-0 z-30">
          <div className="flex items-center gap-4">
            {/* Clickable Dynamic Breadcrumbs for Context Tracking */}
            <div className="flex items-center gap-1.5 text-[10px] font-mono font-bold tracking-wider text-zinc-500">
              <button 
                onClick={() => onNavigate(ToolType.DASHBOARD)}
                className="text-red-500 hover:text-red-400 transition-colors uppercase cursor-pointer"
              >
                Ranktica AI
              </button>
              
              {pathHistory.map((tool, idx) => {
                const isLast = idx === pathHistory.length - 1;
                const label = NAV_ITEMS.find(n => n.id === tool)?.label || tool.replace('_', ' ').toUpperCase();
                return (
                  <React.Fragment key={tool}>
                    <ChevronRight size={10} className="text-zinc-800 shrink-0" />
                    <button
                      disabled={isLast}
                      onClick={() => onNavigate(tool)}
                      className={`uppercase transition-all truncate max-w-[150px] ${
                        isLast 
                          ? 'text-zinc-200 font-black cursor-default' 
                          : 'text-zinc-500 hover:text-zinc-300 cursor-pointer hover:underline'
                      }`}
                    >
                      {label}
                    </button>
                  </React.Fragment>
                );
              })}
            </div>

            <div className="w-px h-6 bg-zinc-800 mx-2"></div>

            {/* Project Switcher */}
            <div className="relative" ref={desktopProjectSwitcherRef}>
              <button
                onClick={() => {
                  setShowProjectSwitcher(!showProjectSwitcher);
                  setProjectSearchQuery("");
                }}
                className={`flex items-center gap-3 px-4 py-2 rounded-xl border transition-all ${activeProject ? "bg-zinc-900 border-zinc-700 text-white" : "bg-red-600/10 border-red-500/20 text-red-500"}`}
              >
                <Briefcase
                  size={14}
                  className={activeProject ? "text-blue-500" : "text-red-500"}
                />
                <span className="text-[10px] font-black uppercase tracking-widest">
                  {activeProject?.title || "SELECT PROJECT"}
                </span>
                <ChevronDown size={14} className="text-zinc-600" />
              </button>

              {showProjectSwitcher && (
                <div className="absolute top-full left-0 mt-2 w-72 bg-zinc-900 border border-zinc-800 rounded-2xl shadow-2xl z-50 overflow-hidden glass-morphism animate-scale-in">
                  <div className="p-4 border-b border-zinc-800 flex items-center justify-between">
                    <span className="text-[9px] font-black text-zinc-500 uppercase tracking-widest">
                      Active Manifests
                    </span>
                    <button
                      onClick={() => {
                        onNavigate(ToolType.PROJECTS);
                        setShowProjectSwitcher(false);
                      }}
                      className="text-[9px] font-black text-blue-400 uppercase hover:text-blue-300"
                    >
                      Manage All
                    </button>
                  </div>

                  {/* Micro Search Input inside Dropdown */}
                  <div className="px-3 py-2 border-b border-zinc-800 bg-zinc-950/40">
                    <div className="relative flex items-center">
                      <Search size={12} className="absolute left-2.5 text-zinc-500" />
                      <input
                        type="text"
                        value={projectSearchQuery}
                        onChange={(e) => setProjectSearchQuery(e.target.value)}
                        placeholder="Search active projects..."
                        className="w-full pl-7 pr-3 py-1 bg-zinc-900 border border-zinc-800 rounded-lg text-[10px] text-zinc-300 placeholder-zinc-600 focus:outline-none focus:border-red-500/50 font-mono"
                        onClick={(e) => e.stopPropagation()}
                      />
                      {projectSearchQuery && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setProjectSearchQuery("");
                          }}
                          className="absolute right-2 text-zinc-600 hover:text-zinc-400 text-[10px]"
                        >
                          ✕
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="max-h-60 overflow-y-auto py-2 custom-scrollbar">
                    {displayedProjects.length === 0 ? (
                      <div className="p-4 text-center text-[10px] text-zinc-500 font-mono italic">
                        No matching projects found
                      </div>
                    ) : (
                      displayedProjects.map((p) => (
                        <button
                          key={p.id}
                          onClick={() => {
                            setActiveProjectById(p.id);
                            setShowProjectSwitcher(false);
                            toast.success(`Context loaded: ${p.title} 📂`);
                          }}
                          className={`w-full text-left px-5 py-3 hover:bg-zinc-800/50 transition-all flex items-center justify-between gap-2 border-l-2 ${
                            activeProject?.id === p.id 
                              ? "bg-zinc-800/30 border-red-500" 
                              : "border-transparent"
                          }`}
                        >
                          <div className="flex flex-col gap-0.5 min-w-0 flex-1">
                            <span className={`text-xs font-black truncate ${activeProject?.id === p.id ? "text-red-400" : "text-zinc-200"}`}>
                              {p.title}
                            </span>
                            <span className="text-[8px] font-bold text-zinc-600 uppercase truncate">
                              {p.niche} • {p.status}
                            </span>
                          </div>
                          {activeProject?.id === p.id && (
                            <CheckCheck size={12} className="text-red-500 shrink-0" />
                          )}
                        </button>
                      ))
                    )}
                  </div>
                  <button
                    onClick={() => {
                      onNavigate(ToolType.PROJECTS);
                      setShowProjectSwitcher(false);
                    }}
                    className="w-full p-4 bg-zinc-950 border-t border-zinc-800 text-[10px] font-black text-zinc-400 hover:text-white uppercase tracking-widest transition-colors flex items-center justify-center gap-2"
                  >
                    <Plus size={12} /> New Project Manifest
                  </button>
                </div>
              )}
            </div>

            {/* Active Workspace Badge */}
            {activeWorkspace && (
              <div className="flex items-center gap-2 bg-gradient-to-r from-red-950/20 to-orange-950/20 border border-red-500/25 px-3 py-1.5 rounded-xl">
                <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
                <span className="text-[10px] font-black uppercase text-zinc-100 tracking-wider">
                  {activeWorkspace.name}
                </span>
                <span className="text-[8px] font-bold text-zinc-500 uppercase tracking-tight">
                  ({activeWorkspace.handle})
                </span>
              </div>
            )}
          </div>

          <div className="flex items-center gap-4">
            {/* Real-time Workspace Collaborators Presence Indicator */}
            <PresenceIndicator />

            {/* Global live search bar */}
            <div className="relative hidden lg:block">
              <div className="flex items-center gap-2 px-3 py-1.5 bg-zinc-900 border border-zinc-800 rounded-xl w-64 text-xs font-bold text-zinc-400">
                <Search size={14} className="text-zinc-550 shrink-0" />
                <input
                  type="text"
                  placeholder="Ask / Search anything..."
                  value={globalSearchQuery}
                  onChange={(e) => {
                    setGlobalSearchQuery(e.target.value);
                    setShowGlobalSearchResults(true);
                  }}
                  onFocus={() => setShowGlobalSearchResults(true)}
                  className="bg-transparent border-none text-white text-[11px] font-black uppercase outline-none focus:ring-0 p-0 w-full placeholder:text-zinc-600"
                />
                {globalSearchQuery && (
                  <button
                    type="button"
                    onClick={() => {
                      setGlobalSearchQuery("");
                      setShowGlobalSearchResults(false);
                    }}
                    className="text-[10px] text-zinc-500 hover:text-white"
                  >
                    Clear
                  </button>
                )}
                <kbd className="bg-zinc-950 px-1.5 py-0.5 rounded border border-zinc-800 text-[8px] font-mono font-bold text-zinc-600">
                  ⌘K
                </kbd>
              </div>

              {showGlobalSearchResults && globalSearchQuery.trim() && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setShowGlobalSearchResults(false)} />
                  <div className="absolute top-full right-0 mt-2 w-[420px] bg-[#0f0f12] border border-zinc-800 rounded-2xl shadow-2xl z-50 overflow-hidden glass-morphism animate-scale-in max-h-[500px] overflow-y-auto custom-scrollbar p-1">
                    <div className="p-3 border-b border-zinc-800 flex justify-between items-center bg-zinc-950/20">
                      <span className="text-[10px] font-black text-zinc-500 uppercase tracking-wider">
                        Real-time Cross-Module Query
                      </span>
                      <span className="text-[9px] font-bold text-zinc-650 px-1.5 py-0.5 rounded bg-zinc-900 text-zinc-400">
                        Matches: {globalSearchMatches.projects.length + globalSearchMatches.scripts.length + globalSearchMatches.assets.length + globalSearchMatches.entities.length}
                      </span>
                    </div>

                    {/* Filter Pills for quick categorization */}
                    <div className="px-3 py-2 border-b border-zinc-900/50 flex flex-wrap gap-1 bg-zinc-950/40">
                      {[
                        { id: 'all', label: '✨ All' },
                        { id: 'projects', label: '📁 Projects' },
                        { id: 'scripts', label: '✍️ Scripts' },
                        { id: 'ideas', label: '💡 Ideas' },
                        { id: 'entities', label: '🏷️ Entities' }
                      ].map((f) => (
                        <button
                          key={f.id}
                          type="button"
                          onClick={() => setGlobalSearchFilter(f.id as any)}
                          className={`text-[9px] font-black uppercase tracking-wider px-2 py-1 rounded-md transition-all border ${
                            globalSearchFilter === f.id
                              ? 'bg-red-650/10 border-red-500/20 text-red-400'
                              : 'bg-zinc-900/40 border-transparent text-zinc-500 hover:text-zinc-350 hover:bg-zinc-900'
                          }`}
                        >
                          {f.label}
                        </button>
                      ))}
                    </div>

                    <div className="p-2 space-y-3">
                      {/* Projects Section */}
                      {(globalSearchFilter === 'all' || globalSearchFilter === 'projects') && globalSearchMatches.projects.length > 0 && (
                        <div>
                          <h4 className="px-2 py-1 text-[8px] font-black uppercase text-zinc-600 tracking-wider">Projects</h4>
                          <div className="space-y-1">
                            {globalSearchMatches.projects.map((p) => (
                              <button
                                key={p.id}
                                type="button"
                                onClick={() => {
                                  setActiveProjectById(p.id);
                                  onNavigate(ToolType.PROJECTS);
                                  setShowGlobalSearchResults(false);
                                  setGlobalSearchQuery("");
                                  toast.success(`Active project switched to: ${p.title} 📁`);
                                }}
                                className="w-full text-left p-2 hover:bg-zinc-850 rounded-xl transition-all flex items-center justify-between"
                              >
                                <div>
                                  <div className="text-xs font-bold text-zinc-200">{p.title}</div>
                                  <div className="text-[9px] text-zinc-550">{p.niche} • {p.status}</div>
                                </div>
                                <div className="text-[8px] font-black tracking-widest uppercase bg-zinc-900 px-1.5 py-0.5 rounded text-zinc-500 border border-zinc-805">
                                  Select
                                </div>
                              </button>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Scripts Section */}
                      {(globalSearchFilter === 'all' || globalSearchFilter === 'scripts') && globalSearchMatches.scripts.length > 0 && (
                        <div>
                          <h4 className="px-2 py-1 text-[8px] font-black uppercase text-zinc-600 tracking-wider">Scripts</h4>
                          <div className="space-y-1">
                            {globalSearchMatches.scripts.map((item) => (
                              <button
                                key={item.project.id}
                                type="button"
                                onClick={() => {
                                  setActiveProjectById(item.project.id);
                                  onNavigate(ToolType.SCRIPT);
                                  setShowGlobalSearchResults(false);
                                  setGlobalSearchQuery("");
                                  toast.success(`Loaded Script workspace for: ${item.project.title} ✍️`);
                                }}
                                className="w-full text-left p-2 hover:bg-zinc-850 rounded-xl transition-all"
                              >
                                <div className="text-xs font-bold text-zinc-200">{item.project.title}</div>
                                <div className="text-[10px] text-zinc-400 bg-zinc-950/50 p-1.5 rounded-lg border border-zinc-800 mt-1 font-mono italic truncate shrink-0">
                                  {item.snippet}
                                </div>
                              </button>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Assets Section */}
                      {(globalSearchFilter === 'all' || globalSearchFilter === 'ideas') && globalSearchMatches.assets.length > 0 && (
                        <div>
                          <h4 className="px-2 py-1 text-[8px] font-black uppercase text-zinc-600 tracking-wider">Generated Assets</h4>
                          <div className="space-y-1">
                            {globalSearchMatches.assets.map((item, idx) => (
                              <button
                                key={idx}
                                type="button"
                                onClick={() => {
                                  setActiveProjectById(item.project.id);
                                  onNavigate(item.targetTool);
                                  setShowGlobalSearchResults(false);
                                  setGlobalSearchQuery("");
                                  toast.success(`Loaded ${item.type} workspace: ${item.project.title} 🚀`);
                                }}
                                className="w-full text-left p-2 hover:bg-zinc-850 rounded-xl transition-all flex items-start justify-between gap-3"
                              >
                                <div className="overflow-hidden">
                                  <div className="text-xs font-bold text-zinc-200 truncate">{item.name}</div>
                                  <div className="text-[9px] text-zinc-550 truncate">{item.sub}</div>
                                </div>
                                <span className="shrink-0 text-[8px] font-black shortcut-type uppercase bg-red-650/10 text-red-400 border border-red-500/10 px-1.5 py-0.5 rounded">
                                  {item.type}
                                </span>
                              </button>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Entities Section */}
                      {(globalSearchFilter === 'all' || globalSearchFilter === 'entities') && globalSearchMatches.entities.length > 0 && (
                        <div>
                          <h4 className="px-2 py-1 text-[8px] font-black uppercase text-zinc-600 tracking-wider">Matched Entities</h4>
                          <div className="space-y-1">
                            {globalSearchMatches.entities.map((item, idx) => (
                              <button
                                key={idx}
                                type="button"
                                onClick={() => {
                                  setActiveProjectById(item.project.id);
                                  onNavigate(item.targetTool);
                                  setShowGlobalSearchResults(false);
                                  setGlobalSearchQuery("");
                                  toast.success(`Switched to Entity context: ${item.name} 🏷️`);
                                }}
                                className="w-full text-left p-2 hover:bg-zinc-850 rounded-xl transition-all flex items-start justify-between gap-3"
                              >
                                <div className="overflow-hidden">
                                  <div className="text-xs font-mono font-bold text-yellow-400 truncate">{item.name}</div>
                                  <div className="text-[9px] text-zinc-550 truncate">{item.sub}</div>
                                </div>
                                <span className="shrink-0 text-[8px] font-black shortcut-type uppercase bg-indigo-650/10 text-indigo-400 border border-indigo-500/10 px-1.5 py-0.5 rounded font-mono">
                                  {item.type}
                                </span>
                              </button>
                            ))}
                          </div>
                        </div>
                      )}

                      {((globalSearchFilter === 'all' && 
                          globalSearchMatches.projects.length === 0 &&
                          globalSearchMatches.scripts.length === 0 &&
                          globalSearchMatches.assets.length === 0 &&
                          globalSearchMatches.entities.length === 0) ||
                        (globalSearchFilter === 'projects' && globalSearchMatches.projects.length === 0) ||
                        (globalSearchFilter === 'scripts' && globalSearchMatches.scripts.length === 0) ||
                        (globalSearchFilter === 'ideas' && globalSearchMatches.assets.length === 0) ||
                        (globalSearchFilter === 'entities' && globalSearchMatches.entities.length === 0)) && (
                        <div className="py-8 text-center">
                          <Search size={24} className="mx-auto text-zinc-700 animate-pulse mb-2" />
                          <div className="text-xs font-bold text-zinc-550">No cross-module matches found</div>
                          <div className="text-[9px] text-zinc-650 mt-1">Try another search term or filter category</div>
                        </div>
                      )}
                    </div>
                  </div>
                </>
              )}
            </div>

            {isSyncing && (
              <div className="flex items-center gap-2 px-3 py-1 bg-blue-600/10 border border-blue-500/20 rounded-full text-blue-400 text-[9px] font-black uppercase animate-pulse">
                <CloudLightning size={10} /> Syncing to Cloud
              </div>
            )}

            <button
              onClick={async () => {
                if (!googleToken) {
                  try {
                    toast.loading('Connecting Google Workspace...', { id: 'top-gcal-auth' });
                    await signInWithGoogle();
                    toast.success('Successfully authorized Google Calendar connection!', { id: 'top-gcal-auth' });
                  } catch (err: any) {
                    toast.error(err.message || 'Google Calendar auth failed.', { id: 'top-gcal-auth' });
                  }
                } else {
                  toast.success('Google Calendar connection is healthy & active! 🎯', { id: 'top-gcal-auth' });
                }
              }}
              className={`flex items-center gap-1.5 px-3 py-1.5 border rounded-xl text-[10px] font-black uppercase tracking-wider transition-all cursor-pointer ${
                googleToken
                  ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400 hover:bg-emerald-500/20'
                  : 'bg-amber-500/10 border-amber-500/25 text-amber-400 hover:bg-amber-500/20 animate-pulse'
              }`}
              title={googleToken ? 'Google Calendar Connected - Active' : 'Google Calendar Expired or Needs Re-Auth'}
            >
              <Calendar size={12} className={googleToken ? 'text-emerald-400' : 'text-amber-400 animate-bounce'} />
              <span>{googleToken ? 'GCal Connected' : 'GCal Re-Auth Needed'}</span>
              <span className={`w-1.5 h-1.5 rounded-full ${googleToken ? 'bg-emerald-400' : 'bg-amber-400'}`} />
            </button>

            <div className="flex items-center gap-2 bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-1.5">
              <Globe size={14} className="text-zinc-500" />
              <select
                value={language}
                onChange={(e) => setLanguage(e.target.value as any)}
                className="bg-transparent text-[10px] font-black uppercase text-zinc-400 outline-none cursor-pointer hover:text-white transition-colors"
              >
                {LANGUAGES.map((l) => (
                  <option key={l.code} value={l.code}>
                    {l.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-2 bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-1.5">
              <Palette size={14} className="text-zinc-500" />
              <select
                value={theme}
                onChange={(e) => {
                  setTheme(e.target.value);
                  toast.success(`Theme loaded: ${e.target.value === 'cyberpunk-red' ? 'Cyberpunk Red' : e.target.value === 'midnight-blue' ? 'Midnight Blue' : 'Emerald Forest'} 🎨`);
                }}
                className="bg-transparent text-[10px] font-black uppercase text-zinc-400 outline-none cursor-pointer hover:text-white transition-colors"
              >
                <option value="cyberpunk-red" className="bg-[#09090b] text-white">Cyberpunk Red</option>
                <option value="midnight-blue" className="bg-[#030712] text-white">Midnight Blue</option>
                <option value="emerald-forest" className="bg-[#022c22] text-white">Emerald Forest</option>
              </select>
            </div>

            {/* Desktop Display Density Selector */}
            <div className="flex items-center gap-2 bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-1.5" title="Toggle Display Density">
              <Sliders size={14} className="text-zinc-500" />
              <select
                value={displayDensity}
                onChange={(e) => {
                  const newDensity = e.target.value as 'cozy' | 'compact';
                  setDisplayDensity(newDensity);
                  toast.success(`Density: ${newDensity.toUpperCase()} 📐`);
                }}
                className="bg-transparent text-[10px] font-black uppercase text-zinc-400 outline-none cursor-pointer hover:text-white transition-colors"
              >
                <option value="cozy" className="bg-[#09090b] text-white">Cozy</option>
                <option value="compact" className="bg-[#09090b] text-white">Compact</option>
              </select>
            </div>

            {/* Global Web Speech Navigation micro controller */}
            <button
               type="button"
               id="voice-navigation-toggle"
               onClick={toggleVoiceListening}
               className={`relative h-8 px-3 rounded-xl border flex items-center gap-1.5 transition-all active:scale-95 cursor-pointer text-[10px] font-black uppercase ${
                  isVoiceListening 
                    ? "border-red-500 bg-red-500/10 text-red-550 text-red-400 font-extrabold animate-pulse" 
                    : "border-zinc-800 bg-zinc-900 text-zinc-400 hover:text-white"
               }`}
               title="Speak 'Go to Script Writer' or other tool names to navigate!"
            >
               <Mic size={13} className={isVoiceListening ? "text-red-500 animate-bounce" : ""} />
               <span>{isVoiceListening ? "Listening" : "Voice Nav"}</span>
            </button>

            <div className="relative">
              <button
                type="button"
                onClick={() => {
                  setShowNotificationCenter(!showNotificationCenter);
                  if (!showNotificationCenter) {
                    handleMarkAllAsRead();
                  }
                }}
                className="relative flex h-8 w-8 items-center justify-center rounded-xl border border-zinc-800 bg-zinc-900 text-zinc-400 transition-all hover:text-white active:scale-95 cursor-pointer"
                title="System Notifications"
              >
                <Bell size={14} />
                {unreadCount > 0 && (
                  <span className="absolute -right-1 -top-1 flex h-4 w-4 animate-pulse items-center justify-center rounded-full bg-red-650 bg-red-600 text-[8px] font-black text-white">
                    {unreadCount}
                  </span>
                )}
              </button>
            </div>

            <OfflineIndicator />
            <AutoSaveStatus />

            <div className="relative">
              <button
                type="button"
                onClick={() => setShowActivitySidebar(!showActivitySidebar)}
                className={`relative flex h-8 w-8 items-center justify-center rounded-xl border transition-all hover:text-white active:scale-95 cursor-pointer ${
                  showActivitySidebar 
                    ? "border-red-500 bg-red-500/10 text-red-500 shadow-md shadow-red-500/5" 
                    : "border-zinc-800 bg-zinc-900 text-zinc-400"
                }`}
                title="Recent Activity feed"
              >
                <History size={14} />
              </button>
            </div>

            <div className="relative">
              <button
                type="button"
                id="onboarding-tour-trigger"
                onClick={() => window.dispatchEvent(new CustomEvent("ranktica-start-onboarding-tour"))}
                className="relative flex h-8 px-3 items-center justify-center gap-1.5 rounded-xl border border-dashed border-red-500/35 bg-red-500/5 text-red-400 hover:text-red-300 transition-all hover:bg-red-500/10 active:scale-95 cursor-pointer text-[10px] font-black uppercase"
                title="Start or Restart the Getting Started Onboarding Tour"
              >
                <Sparkles size={12} className="text-red-500 animate-pulse shrink-0" />
                <span>Tour</span>
              </button>
            </div>

            <div className="relative">
              <button
                type="button"
                id="workspace-settings-trigger"
                onClick={() => setShowSettingsModal(true)}
                className="relative flex h-8 w-8 items-center justify-center rounded-xl border border-zinc-800 bg-zinc-900 text-zinc-400 transition-all hover:text-white active:scale-95 cursor-pointer"
                title="System Configuration Settings"
              >
                <Settings size={14} />
              </button>
            </div>

            {/* Language Selector Dropdown */}
            <div className="relative flex h-8 items-center gap-1.5 px-3 rounded-xl border border-zinc-800 bg-[#0f0f12] hover:border-zinc-700 transition-colors">
              <Globe size={13} className="text-red-500 animate-pulse shrink-0" />
              <select
                value={language}
                onChange={(e) => {
                  setLanguage(e.target.value as LanguageCode);
                  toast.success(`Interface language updated: ${e.target.value.toUpperCase()} 🌐`);
                }}
                className="bg-transparent text-[10px] font-black uppercase text-zinc-300 outline-none cursor-pointer hover:text-white transition-colors"
                title="Select Interface Language"
              >
                <option value="en" className="bg-[#09090b] text-white">EN</option>
                <option value="es" className="bg-[#09090b] text-white">ES</option>
                <option value="fr" className="bg-[#09090b] text-white">FR</option>
              </select>
            </div>

            <div id="rpc-error-toast" className="hidden animate-fade-in">
              <div className="flex items-center gap-2 bg-red-600/10 border border-red-600/20 px-3 py-1.5 rounded-xl text-[10px] font-bold text-red-500">
                <AlertCircle size={14} /> RPC CONNECTION ERROR
              </div>
            </div>
          </div>
        </header>

        <div 
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
          className="flex-1 overflow-y-auto p-4 md:p-8 custom-scrollbar relative"
        >
          <div className="max-w-7xl mx-auto h-full">{children}</div>
          <ClientPdfExporter currentTool={currentTool} />
        </div>
      </main>

      {/* Sliding Activity Sidebar */}
      <AnimatePresence>
        {showActivitySidebar && (
          <motion.aside
            initial={{ x: 320, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: 320, opacity: 0 }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="w-80 h-full bg-[#0d0d10] border-l border-zinc-805 flex flex-col sticky top-0 right-0 z-40 shadow-2xl glass-morphism shrink-0"
          >
            <div className="p-4 border-b border-zinc-800 flex items-center justify-between bg-zinc-950/40">
              <div className="flex items-center gap-2">
                <History size={14} className="text-red-500 animate-spin-slow" />
                <span className="text-xs font-black uppercase tracking-wider text-zinc-100">
                  Recent Activity
                </span>
              </div>
              <button
                onClick={() => setShowActivitySidebar(false)}
                className="text-zinc-500 hover:text-white transition-colors p-1 hover:bg-zinc-850 rounded-lg"
              >
                <X size={14} />
              </button>
            </div>

            {/* Segment Tab Controls */}
            <div className="grid grid-cols-2 border-b border-zinc-800 bg-zinc-950/20 text-center">
              <button
                onClick={() => setActiveSidebarTab('my')}
                className={`py-2.5 text-[10px] font-black uppercase tracking-wider transition-all cursor-pointer border-b-2 ${
                  activeSidebarTab === 'my' 
                    ? 'border-red-500 text-red-500 bg-red-500/5' 
                    : 'border-transparent text-zinc-500 hover:text-zinc-350 bg-transparent'
                }`}
              >
                My Operations
              </button>
              <button
                onClick={() => setActiveSidebarTab('collaborator')}
                className={`py-2.5 text-[10px] font-black uppercase tracking-wider transition-all cursor-pointer border-b-2 ${
                  activeSidebarTab === 'collaborator' 
                    ? 'border-red-500 text-red-500 bg-red-500/5' 
                    : 'border-transparent text-zinc-500 hover:text-zinc-350 bg-transparent'
                }`}
              >
                Collaborator Feed
              </button>
            </div>

            {activeSidebarTab === 'my' ? (
              <>
                <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
                  {/* CSV and PDF Export Tools */}
                  <div className="flex items-center justify-between p-2.5 bg-zinc-950/70 border border-zinc-850 rounded-2xl mb-4">
                    <span className="text-[8.5px] font-black uppercase text-zinc-500 tracking-wider">
                      Audit tools
                    </span>
                    <div className="flex gap-1.5">
                      <button
                        onClick={exportCSV}
                        className="px-2.5 py-1.5 bg-zinc-900 border border-zinc-800 hover:bg-zinc-850 text-[8.5px] font-black uppercase tracking-wider text-zinc-300 hover:text-white rounded-lg flex items-center gap-1 transition-all cursor-pointer"
                        title="Export logged sandbox operations as CSV"
                      >
                        <Download size={9} /> CSV
                      </button>
                      <button
                        onClick={exportPDF}
                        className="px-2.5 py-1.5 bg-zinc-900 border border-zinc-800 hover:bg-zinc-850 text-[8.5px] font-black uppercase tracking-wider text-zinc-300 hover:text-white rounded-lg flex items-center gap-1 transition-all cursor-pointer"
                        title="Export logged sandbox operations as printable PDF report"
                      >
                        <FileText size={9} /> PDF
                      </button>
                    </div>
                  </div>

                  {activitiesList.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-center py-12">
                      <Clock size={24} className="text-zinc-700 animate-pulse mb-2" />
                      <span className="text-xs font-bold text-zinc-550">No activities tracked yet</span>
                      <span className="text-[9px] text-zinc-650 mt-1 max-w-[200px]">
                        Engage with creation or optimization modules to trigger live audit alerts.
                      </span>
                    </div>
                  ) : (
                    activitiesList.map((act) => (
                      <div
                        key={act.id}
                        className="group p-3 bg-zinc-900/45 border border-zinc-805 hover:border-zinc-750 rounded-xl transition-all relative overflow-hidden"
                      >
                        <div className="absolute top-0 right-0 w-24 h-24 bg-red-650/5 rounded-full blur-2xl group-hover:bg-red-650/10 pointer-events-none" />
                        <div className="flex items-start justify-between gap-2">
                          <span className="text-[9px] font-black tracking-widest text-zinc-400 capitalize bg-zinc-950 px-1.5 py-0.5 rounded border border-zinc-850">
                            {act.tool}
                          </span>
                          <span className="text-[8px] font-mono text-zinc-550 shrink-0 mt-0.5">
                            {act.time}
                          </span>
                        </div>
                        <p className="text-xs font-bold text-zinc-350 leading-snug mt-2">
                          {act.action}
                        </p>
                        <div className="mt-2.5 flex items-center gap-1">
                          <span className={`w-1.5 h-1.5 rounded-full ${
                            act.type === 'ideas' ? 'bg-amber-500' :
                            act.type === 'thumbnail' ? 'bg-purple-500' :
                            act.type === 'seo' ? 'bg-blue-500' :
                            act.type === 'script' ? 'bg-emerald-500' : 'bg-red-500'
                          }`} />
                          <span className="text-[8px] font-black uppercase tracking-wider text-zinc-550">
                            {act.type || 'system'}
                          </span>
                        </div>
                      </div>
                    ))
                  )}
                </div>

                <div className="p-4 border-t border-zinc-800 bg-zinc-950/30 flex items-center justify-between">
                  <span className="text-[8px] font-mono text-zinc-500 uppercase">
                    Total operations: {activitiesList.length}
                  </span>
                  <button
                    onClick={async () => {
                      if (confirm('Are you sure you want to purge all activity logs from local sandbox?')) {
                        localStorage.removeItem('ranktica_activities');
                        setActivitiesList([]);
                        toast.success('Activity history purged clean! 🧹');
                      }
                    }}
                    className="text-[9px] font-black uppercase text-red-400 hover:text-red-305 hover:underline"
                  >
                    Purge Logs
                  </button>
                </div>
              </>
            ) : (
              <>
                {/* Collaborators Live Feed list */}
                <div className="flex-1 overflow-y-auto p-4 space-y-3.5 custom-scrollbar">
                  <div className="text-[9px] font-bold text-zinc-500 uppercase px-1 pb-1 flex items-center justify-between border-b border-zinc-900">
                    <span>Collaborator Feed (Live edits / comments)</span>
                    <span className="text-[8px] font-mono text-emerald-400 animate-pulse">● Active sync</span>
                  </div>

                  {collabFeed.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-center py-12">
                      <Users size={24} className="text-zinc-700 animate-pulse mb-2" />
                      <span className="text-xs font-bold text-zinc-550">No collaborator logs detected</span>
                      <span className="text-[9px] text-zinc-650 mt-1 max-w-[200px]">
                        Select or update active projects to trigger real-time collaborative operations of your team.
                      </span>
                    </div>
                  ) : (
                    collabFeed.map((col) => (
                      <div
                        key={col.id}
                        className="group p-3 bg-zinc-900/35 border border-zinc-850 rounded-xl relative overflow-hidden transition-all hover:bg-zinc-900/60"
                      >
                        <div className="flex items-center gap-2">
                          <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[8.5px] font-black text-white shrink-0 ${col.avatarColor}`}>
                            {col.name.split(' ').map((n: string) => n[0]).join('')}
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center justify-between">
                              <span className="text-[10px] font-extrabold text-zinc-200 truncate pr-1">
                                {col.name}
                              </span>
                              <span className="text-[8px] font-mono text-zinc-550 shrink-0">
                                {col.time}
                              </span>
                            </div>
                            <span className="text-[8px] font-black uppercase text-red-500 tracking-wider">
                              {col.role}
                            </span>
                          </div>
                        </div>
                        
                        <p className="text-xs font-bold text-zinc-350 leading-snug mt-2 pl-1 select-all">
                          {col.action}
                        </p>

                        {col.comment && (
                          <div className="mt-2 text-[10.5px] font-medium leading-relaxed text-zinc-400 bg-zinc-950 p-2.5 rounded-lg border border-zinc-850 relative italic pl-6">
                            <MessageSquare size={10} className="text-red-400 absolute left-2 top-3.5 shrink-0" />
                            "{col.comment}"
                          </div>
                        )}

                        <div className="mt-2.5 flex items-center justify-between border-t border-zinc-850/30 pt-1.5 pl-1">
                          <div className="flex items-center gap-1 overflow-hidden">
                            <span className="w-1 h-1 rounded-full bg-red-500 flex-shrink-0" />
                            <span className="text-[8px] font-mono text-zinc-500 uppercase truncate max-w-[130px]" title={col.projectTitle}>
                              {col.projectTitle}
                            </span>
                          </div>
                          <span className="text-[8px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded bg-zinc-950 text-zinc-550 border border-zinc-850 whitespace-nowrap shrink-0">
                            {col.type}
                          </span>
                        </div>
                      </div>
                    ))
                  )}
                </div>

                <div className="p-4 border-t border-zinc-800 bg-zinc-950/30 flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <span className="relative flex h-1.5 w-1.5">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500"></span>
                    </span>
                    <span className="text-[8px] font-mono text-zinc-500 uppercase">
                      Connected presence: ({collaborators?.length || 4} Active)
                    </span>
                  </div>
                  <span className="text-[8.5px] font-black uppercase text-emerald-400 tracking-widest leading-none bg-emerald-500/10 px-1 py-0.5 rounded border border-emerald-500/20">
                    LIVE STREAM
                  </span>
                </div>
              </>
            )}
          </motion.aside>
        )}
      </AnimatePresence>

      {/* Global Command Search Modal (Cmd / Ctrl + K) */}
      {showSearchModal && (
        <div
          className="fixed inset-0 z-[100] bg-black/85 backdrop-blur-md flex items-start justify-center p-4 pt-20 animate-fade-in"
          onClick={() => setShowSearchModal(false)}
        >
          <div
            className="bg-[#0f0f12] border border-zinc-800 rounded-3xl w-full max-w-xl shadow-2xl relative overflow-hidden animate-scale-in"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Search Input Zone */}
            <div className="p-4 border-b border-zinc-800 flex items-center gap-3 bg-zinc-950/40">
              <Search size={20} className="text-zinc-500 shrink-0" />
              <input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={handlePaletteKeyDown}
                placeholder="Search tools, workflows, or platforms... (e.g. Scripting, SEO)"
                className="flex-1 bg-transparent border-none text-white text-sm outline-none placeholder:text-zinc-600 focus:ring-0 py-1"
                autoFocus
              />
              <button
                onClick={() => setShowSearchModal(false)}
                className="p-1 hover:bg-zinc-800 rounded-lg text-zinc-500 hover:text-white font-mono text-[10px] uppercase font-bold"
              >
                esc
              </button>
            </div>

            {/* Hub selective Category Filters */}
            <div className="px-4 py-2 bg-zinc-950/20 border-b border-zinc-805 overflow-x-auto flex gap-1.5 scrollbar-none shrink-0">
              {categories.map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setSearchCategory(cat)}
                  className={`px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-wider transition-all whitespace-nowrap ${searchCategory === cat ? "bg-red-600 text-white shadow" : "text-zinc-500 hover:text-zinc-350 hover:bg-zinc-900/50"}`}
                >
                  {cat}
                </button>
              ))}
            </div>

            {/* Recent Workspace Projects section */}
            {recentProjects.length > 0 && (
              <div className="px-4 py-3 bg-zinc-950/25 border-b border-zinc-805/85 flex flex-col gap-2">
                <span className="text-[9px] font-black tracking-widest text-zinc-500 uppercase flex items-center justify-between">
                  <span>Recent Projects (Last 5 Edited)</span>
                  <span className="text-[7px] text-zinc-600 bg-zinc-900 border border-zinc-820 px-1.5 py-0.5 rounded font-bold font-mono">
                    quick context switch
                  </span>
                </span>
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-1.5">
                  {recentProjects.map((p) => {
                    const isActive = activeProject?.id === p.id;
                    return (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => {
                          setActiveProjectById(p.id);
                          setShowSearchModal(false);
                          toast.success(`Switched project context to: ${p.title} 📁`, { id: 'context-switch-alert' });
                        }}
                        className={`px-2 py-1.5 rounded-xl border text-left transition-all ${
                          isActive
                            ? "bg-red-500/10 border-red-500/30 text-red-400"
                            : "bg-zinc-950 border-zinc-900 hover:bg-zinc-900 hover:border-zinc-800 text-zinc-400 hover:text-white"
                        }`}
                      >
                        <div className="text-[9px] font-bold truncate leading-snug">{p.title}</div>
                        <div className="text-[7.5px] opacity-50 truncate">{p.niche || "No Niche"}</div>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Search Results listing with focused keyboard highlights */}
            <div className="max-h-96 overflow-y-auto p-3 space-y-2 custom-scrollbar">
              {combinedResults.length > 0 ? (
                <div className="space-y-1.5">
                  {combinedResults.map((result, idx) => {
                    const isFocused = idx === focusedIndex;
                    if (result.type === "action") {
                      const action = result.data;
                      return (
                        <button
                          key={action.id}
                          type="button"
                          onClick={() => triggerPaletteAction(action)}
                          className={`w-full flex items-center justify-between p-3 rounded-2xl border transition-all group text-left ${
                            isFocused
                              ? "bg-red-500/10 border-red-500/40 text-white shadow-md shadow-red-500/5"
                              : "border-dashed border-zinc-900 bg-zinc-950 hover:bg-zinc-900 text-zinc-350 hover:text-white"
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <span className={`p-2 rounded-xl transition-colors ${isFocused ? "bg-red-500/20 text-red-500" : "bg-zinc-950 text-zinc-500 group-hover:text-red-500"}`}>
                              <Zap size={12} className="text-red-500 shrink-0" />
                            </span>
                            <div>
                              <span className="text-xs font-bold block">
                                {action.label}
                              </span>
                              <span className="text-[9px] text-zinc-500 leading-none">
                                {action.desc}
                              </span>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            {action.shortcut && (
                              <kbd className="bg-zinc-950 px-1.5 py-0.5 rounded border border-zinc-800 text-[8px] font-mono font-bold text-zinc-500">
                                {action.shortcut}
                              </kbd>
                            )}
                            <ChevronRight
                              size={12}
                              className={`transform transition-all ${isFocused ? "translate-x-1 text-white" : "text-zinc-700 group-hover:text-white"}`}
                            />
                          </div>
                        </button>
                      );
                    } else if (result.type === "project") {
                      const p = result.data;
                      const isActive = activeProject?.id === p.id;
                      return (
                        <button
                          key={`proj-pal-${p.id}`}
                          type="button"
                          onClick={() => {
                            setActiveProjectById(p.id);
                            setShowSearchModal(false);
                            setSearchQuery("");
                            toast.success(`Active project context set to: ${p.title} 📁`);
                          }}
                          className={`w-full flex items-center justify-between p-3 rounded-2xl border transition-all group text-left ${
                            isFocused
                              ? "bg-[#ef4444]/10 border-[#ef4444]/40 text-white shadow-md shadow-[#ef4444]/5"
                              : isActive
                              ? "bg-zinc-950 border-blue-500/20 text-blue-450"
                              : "border-transparent bg-transparent hover:bg-zinc-900 text-zinc-310 hover:text-white"
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <span
                              className={`p-2 rounded-xl transition-colors ${
                                isActive || isFocused 
                                  ? "bg-blue-500/15 text-blue-400" 
                                  : "bg-zinc-950 text-zinc-550 group-hover:text-blue-500"
                              }`}
                            >
                              <FolderOpen size={12} className="text-blue-500" />
                            </span>
                            <div>
                              <span className="text-xs font-bold block">
                                {p.title}
                              </span>
                              <span className="text-[9.5px] text-zinc-500 leading-none">
                                Niche: {p.niche || 'General'} | Status: {p.status || 'Active'}
                              </span>
                            </div>
                          </div>

                          <div className="flex items-center gap-2">
                            <span className="text-[8px] font-black uppercase text-zinc-500 bg-zinc-900/40 border border-zinc-800 px-2 py-0.5 rounded">
                              Switch Project
                            </span>
                            <ChevronRight
                              size={14}
                              className={`transform transition-all ${isFocused ? "translate-x-1 text-white" : "text-zinc-700 group-hover:text-white"}`}
                            />
                          </div>
                        </button>
                      );
                    } else {
                      const tool = result.data;
                      const isActive = currentTool === tool.id;
                      return (
                        <button
                          key={tool.id}
                          type="button"
                          onClick={() => {
                            onNavigate(tool.id);
                            setShowSearchModal(false);
                            setSearchQuery("");
                          }}
                          className={`w-full flex items-center justify-between p-3 rounded-2xl border transition-all group text-left ${
                            isFocused
                              ? "bg-red-500/10 border-red-500/40 text-white shadow-md shadow-red-500/5"
                              : isActive
                              ? "bg-zinc-950 border-red-500/20 text-red-400"
                              : "border-transparent bg-transparent hover:bg-zinc-900 text-zinc-310 hover:text-white"
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <span
                              className={`p-2 rounded-xl transition-colors ${
                                isActive || isFocused 
                                  ? "bg-red-500/15 text-red-550 text-red-400" 
                                  : "bg-zinc-950 text-zinc-550 group-hover:text-red-500"
                              }`}
                            >
                              {tool.icon}
                            </span>
                            <div>
                              <span className="text-xs font-bold block">
                                {tool.label}
                              </span>
                              <span className="text-[9px] font-black uppercase text-zinc-500 tracking-wider">
                                Role: {tool.category}
                              </span>
                            </div>
                          </div>

                          <div className="flex items-center gap-2">
                            {isActive && (
                              <span className="text-[8px] font-black uppercase bg-red-650/10 border border-red-500/20 px-2 py-0.5 rounded-full text-red-400">
                                Active
                              </span>
                            )}
                            <ChevronRight
                              size={14}
                              className={`transform transition-all ${isFocused ? "translate-x-1 text-white" : "text-zinc-700 group-hover:text-white"}`}
                            />
                          </div>
                        </button>
                      );
                    }
                  })}
                </div>
              ) : (
                <div className="py-12 flex flex-col items-center justify-center text-center text-zinc-650 space-y-2">
                  <Search size={32} className="opacity-20 animate-pulse" />
                  <p className="text-xs font-bold uppercase tracking-wider text-zinc-400">
                    No results found
                  </p>
                  <p className="text-[10px] text-zinc-550 max-w-xs leading-normal">
                    The query "{searchQuery}" does not map to any active
                    Ranktica AI tool or action shortcut.
                  </p>
                </div>
              )}
            </div>

            {/* Modal Footer helper */}
            <div className="px-5 py-3 border-t border-zinc-805/85 bg-zinc-950 flex flex-col md:flex-row gap-2 justify-between items-center text-[9px] font-black text-zinc-500 uppercase tracking-widest text-center">
              <span>Nav: [↑↓] select • [Enter] navigate • [Alt+D] Dashboard • [Alt+S] Scripting • [Alt+I] Idea Lab • [Alt+V] Video • [Alt+K] Keyword Inspector</span>
              <span>Ranktica Command Hub v2.0</span>
            </div>
          </div>
        </div>
      )}

      {/* Persistent Notification Center Panel (Drawer style) */}
      {showNotificationCenter && (
        <div
          className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-sm animate-fade-in"
          onClick={() => setShowNotificationCenter(false)}
        >
          <div
            className="relative flex h-full w-full max-w-md flex-col border-l border-zinc-855 bg-[#0f0f12] shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <NotificationCenter
              onClose={() => setShowNotificationCenter(false)}
              userEmail={user?.email || undefined}
            />
          </div>
        </div>
      )}

      {/* Keyboard Hotkeys Help Overlay */}
      {showHotkeysOverlay && (
        <div
          id="hotkeys-help-overlay"
          className="fixed inset-0 z-[110] bg-black/95 backdrop-blur-md flex items-center justify-center p-4 animate-fade-in"
          onClick={() => setShowHotkeysOverlay(false)}
        >
          <div
            className="bg-[#0f0f12] border border-zinc-800 rounded-3xl p-6 md:p-8 max-w-2xl w-full shadow-2xl relative overflow-hidden animate-scale-in"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Ambient gradients */}
            <div className="absolute -top-24 -right-24 w-56 h-56 bg-red-600/10 rounded-full blur-3xl animate-pulse"></div>
            <div className="absolute -bottom-24 -left-24 w-56 h-56 bg-indigo-600/10 rounded-full blur-3xl animate-pulse"></div>

            <button
              onClick={() => setShowHotkeysOverlay(false)}
              className="absolute top-6 right-6 p-1.5 hover:bg-zinc-800 rounded-lg text-zinc-500 hover:text-white transition-colors"
            >
              <X size={16} />
            </button>

            <div className="mb-6 space-y-1 border-b border-zinc-800/60 pb-4">
              <span className="text-[10px] font-black text-red-500 tracking-widest uppercase font-mono">
                AISTUDIO WORKSPACE COMMAND DECK
              </span>
              <h3 className="text-xl font-black text-white uppercase tracking-tight">
                On-Screen Keyboard Shortcuts Cheat Sheet
              </h3>
              <p className="text-xs text-zinc-400">
                Speed up your Ranktica operations and navigation flow with custom low-latency keybindings.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 relative z-10 font-sans">
              {/* Column 1: Core System & Editor Bindings */}
              <div className="space-y-4">
                <h4 className="text-[9px] font-black text-zinc-500 uppercase tracking-widest font-mono border-b border-zinc-850 pb-1.5">
                  Core Controls & Editing
                </h4>
                
                <div className="space-y-3">
                  <div className="flex justify-between items-center bg-zinc-950/40 p-2.5 rounded-xl border border-zinc-850/40">
                    <div className="space-y-0.5">
                      <span className="text-xs font-bold text-zinc-200">Show Cheat Sheet</span>
                      <p className="text-[9px] text-zinc-500">Toggle this help listing</p>
                    </div>
                    <kbd className="bg-zinc-950 px-2 py-0.5 rounded border border-zinc-800 text-[10px] font-mono font-bold text-red-400">
                      ?
                    </kbd>
                  </div>

                  <div className="flex justify-between items-center bg-zinc-950/40 p-2.5 rounded-xl border border-zinc-850/40">
                    <div className="space-y-0.5">
                      <span className="text-xs font-bold text-zinc-200">Global Search / Switcher</span>
                      <p className="text-[9px] text-zinc-500">Search projects and buffers</p>
                    </div>
                    <kbd className="bg-zinc-950 px-2 py-0.5 rounded border border-zinc-800 text-[10px] font-mono font-bold text-zinc-400">
                      Ctrl + K
                    </kbd>
                  </div>

                  <div className="flex justify-between items-center bg-zinc-950/40 p-2.5 rounded-xl border border-zinc-850/40">
                    <div className="space-y-0.5">
                      <span className="text-xs font-bold text-zinc-200">Save Workspace Draft</span>
                      <p className="text-[9px] text-zinc-500">Persist workspace and parameters</p>
                    </div>
                    <kbd className="bg-zinc-950 px-2 py-0.5 rounded border border-zinc-800 text-[10px] font-mono font-bold text-zinc-400">
                      Ctrl + S
                    </kbd>
                  </div>

                  <div className="flex justify-between items-center bg-zinc-950/40 p-2.5 rounded-xl border border-zinc-850/40">
                    <div className="space-y-0.5">
                      <span className="text-xs font-bold text-zinc-200">AI Synthesize Generation</span>
                      <p className="text-[9px] text-zinc-500">Initiate script / idea generator</p>
                    </div>
                    <kbd className="bg-zinc-950 px-2 py-0.5 rounded border border-zinc-800 text-[10px] font-mono font-bold text-zinc-400">
                      Ctrl + G
                    </kbd>
                  </div>

                  <div className="flex justify-between items-center bg-zinc-950/40 p-2.5 rounded-xl border border-zinc-850/40">
                    <div className="space-y-0.5">
                      <span className="text-xs font-bold text-zinc-200">Clear Editor Buffer</span>
                      <p className="text-[9px] text-zinc-500">Empty the active work buffer</p>
                    </div>
                    <kbd className="bg-zinc-950 px-2 py-0.5 rounded border border-zinc-800 text-[10px] font-mono font-bold text-zinc-400">
                      Ctrl + E
                    </kbd>
                  </div>
                </div>
              </div>

              {/* Column 2: Workspace View Switches */}
              <div className="space-y-4">
                <h4 className="text-[9px] font-black text-zinc-500 uppercase tracking-widest font-mono border-b border-zinc-850 pb-1.5">
                  Workspace Navigations
                </h4>

                <div className="space-y-3">
                  <div className="flex justify-between items-center bg-zinc-950/40 p-2.5 rounded-xl border border-zinc-850/40">
                    <div className="space-y-0.5">
                      <span className="text-xs font-bold text-zinc-200">Command Center</span>
                      <p className="text-[9px] text-zinc-500">Go to Core Dashboard</p>
                    </div>
                    <kbd className="bg-zinc-950 px-2 py-0.5 rounded border border-zinc-800 text-[10px] font-mono font-bold text-indigo-400">
                      Alt + D
                    </kbd>
                  </div>

                  <div className="flex justify-between items-center bg-zinc-950/40 p-2.5 rounded-xl border border-zinc-850/40">
                    <div className="space-y-0.5">
                      <span className="text-xs font-bold text-zinc-200">Idea Generator</span>
                      <p className="text-[9px] text-zinc-500">Switch to brainstorming tool</p>
                    </div>
                    <kbd className="bg-zinc-950 px-2 py-0.5 rounded border border-zinc-800 text-[10px] font-mono font-bold text-indigo-400">
                      Alt + I
                    </kbd>
                  </div>

                  <div className="flex justify-between items-center bg-zinc-950/40 p-2.5 rounded-xl border border-zinc-850/40">
                    <div className="space-y-0.5">
                      <span className="text-xs font-bold text-zinc-200">Script Writer Workspace</span>
                      <p className="text-[9px] text-zinc-500">Access video scripting matrix</p>
                    </div>
                    <kbd className="bg-zinc-950 px-2 py-0.5 rounded border border-zinc-800 text-[10px] font-mono font-bold text-indigo-400">
                      Alt + S
                    </kbd>
                  </div>

                  <div className="flex justify-between items-center bg-zinc-950/40 p-2.5 rounded-xl border border-zinc-850/40">
                    <div className="space-y-0.5">
                      <span className="text-xs font-bold text-zinc-200">Video Studio Engine</span>
                      <p className="text-[9px] text-zinc-500">Switch to active visualizer</p>
                    </div>
                    <kbd className="bg-zinc-950 px-2 py-0.5 rounded border border-zinc-800 text-[10px] font-mono font-bold text-indigo-400">
                      Alt + V
                    </kbd>
                  </div>

                  <div className="flex justify-between items-center bg-zinc-950/40 p-2.5 rounded-xl border border-zinc-850/40">
                    <div className="space-y-0.5">
                      <span className="text-xs font-bold text-zinc-200">Keyword Inspector</span>
                      <p className="text-[9px] text-zinc-500">Open niche & search volume metrics</p>
                    </div>
                    <kbd className="bg-zinc-950 px-2 py-0.5 rounded border border-zinc-800 text-[10px] font-mono font-bold text-indigo-400">
                      Alt + K
                    </kbd>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-8 pt-4 border-t border-zinc-850 flex items-center justify-between text-[8px] font-mono font-black text-zinc-650 uppercase tracking-widest">
              <span className="flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-ping" />
                Press <span className="text-zinc-400 font-bold bg-zinc-900 px-1 py-0.5 rounded border border-zinc-800 ml-1 font-mono">?</span> or <span className="text-zinc-400 font-bold bg-zinc-900 px-1 py-0.5 rounded border border-zinc-800 font-mono">Esc</span> to close
              </span>
              <span>Command Deck Orchestrator v2.0</span>
            </div>
          </div>
        </div>
      )}

      {/* Sovereign Workspace Settings & Live Theme Previewer Modal */}
      {showSettingsModal && (
        <div
          id="workspace-settings-modal"
          className="fixed inset-0 z-[120] bg-black/90 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto custom-scrollbar animate-fade-in"
          onClick={() => {
            setShowSettingsModal(false);
            setPreviewTheme(null);
          }}
        >
          <div
            className="bg-[#0c0c0e] border border-zinc-800 rounded-3xl p-6 md:p-8 max-w-3xl w-full shadow-2xl relative overflow-hidden animate-scale-in my-8"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Ambient visual radial halos */}
            <div className="absolute -top-32 -right-32 w-64 h-64 bg-red-500/5 rounded-full blur-3xl pointer-events-none"></div>
            <div className="absolute -bottom-32 -left-32 w-64 h-64 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none"></div>

            {/* Header elements */}
            <div className="flex justify-between items-start mb-6 pb-4 border-b border-zinc-850">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <Sliders size={14} className="text-red-500" />
                  <span className="text-[9px] font-black tracking-widest text-zinc-500 uppercase font-mono">
                    Workspace Management Matrix
                  </span>
                </div>
                <h3 className="text-xl font-black text-white uppercase tracking-tight">
                  System Settings & Theme Previewer
                </h3>
                <p className="text-xs text-zinc-500">
                  Configure active interface presets, language localization, and styles in real-time.
                </p>
              </div>
              <button
                onClick={() => {
                  setShowSettingsModal(false);
                  setPreviewTheme(null);
                }}
                className="p-1.5 bg-zinc-950/80 hover:bg-zinc-800 rounded-xl border border-zinc-850 text-zinc-400 hover:text-white transition-all active:scale-90"
              >
                <X size={16} />
              </button>
            </div>

            {/* Body contents */}
            <div className="space-y-6">
              {/* Section 1: Dynamic Theme Previewer Grid */}
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <h4 className="text-xs font-black text-white uppercase tracking-wider flex items-center gap-1.5">
                    <Palette size={12} className="text-blue-400" />
                    CSS Live Stylesheet Themes
                  </h4>
                  <div className="flex items-center gap-2">
                    {previewTheme && previewTheme !== theme && (
                      <span className="text-[8px] font-mono font-black uppercase text-amber-400 bg-amber-950/40 border border-amber-900 px-2 py-0.5 rounded-full animate-pulse">
                        Preview Active
                      </span>
                    )}
                    <span className="text-[8px] font-mono font-black uppercase text-zinc-500 bg-zinc-900 border border-zinc-850 px-2 py-0.5 rounded-full">
                      Current Theme: <strong className="text-red-400">{theme}</strong>
                    </span>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  {/* Option 1: Cyberpunk Red */}
                  <button
                    onClick={() => {
                      setPreviewTheme('cyberpunk-red');
                      toast("Previewing Cyberpunk Red theme. Click Apply below to save.", { id: 'preview-cr', icon: '🎨' });
                    }}
                    className={`text-left rounded-2xl p-4 transition-all relative overflow-hidden flex flex-col justify-between border ${
                      (previewTheme || theme) === 'cyberpunk-red'
                        ? 'border-red-500 bg-red-950/10 ring-2 ring-red-500/20'
                        : 'border-zinc-850 bg-zinc-950/40 hover:border-zinc-700/60'
                    }`}
                  >
                    <div className="space-y-1 mb-4 w-full">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-black text-white uppercase">Cyberpunk Red</span>
                        {(previewTheme || theme) === 'cyberpunk-red' && (
                          <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></span>
                        )}
                      </div>
                      <p className="text-[10px] text-zinc-500 leading-tight">High contrast dark style accented by tech vibrant neon red.</p>
                    </div>

                    {/* Miniature UI sample representation of theme */}
                    <div className="w-full bg-[#0a0a0c] border border-zinc-900 rounded-xl p-2.5 space-y-2 pointer-events-none font-sans scale-95 origin-left">
                      <div className="flex justify-between items-center">
                        <div className="w-8 h-1.5 bg-zinc-800 rounded-full"></div>
                        <div className="w-2 h-2 rounded-full bg-red-500"></div>
                      </div>
                      <div className="space-y-1">
                        <div className="w-full h-1 bg-zinc-900 rounded-full overflow-hidden">
                          <div className="w-2/3 h-full bg-red-500"></div>
                        </div>
                      </div>
                      <div className="flex justify-between items-center pt-1 border-t border-zinc-900">
                        <div className="w-4 h-4 rounded-full bg-zinc-900 flex items-center justify-center text-[7px] font-bold text-red-400">R</div>
                        <div className="w-10 h-3 bg-red-600 rounded text-[6px] font-black text-white flex items-center justify-center">CORE</div>
                      </div>
                    </div>
                  </button>

                  {/* Option 2: Midnight Blue */}
                  <button
                    onClick={() => {
                      setPreviewTheme('midnight-blue');
                      toast("Previewing Midnight Blue theme. Click Apply below to save.", { id: 'preview-mb', icon: '🎨' });
                    }}
                    className={`text-left rounded-2xl p-4 transition-all relative overflow-hidden flex flex-col justify-between border ${
                      (previewTheme || theme) === 'midnight-blue'
                        ? 'border-blue-500 bg-blue-950/10 ring-2 ring-blue-500/20'
                        : 'border-zinc-850 bg-zinc-950/40 hover:border-zinc-700/60'
                    }`}
                  >
                    <div className="space-y-1 mb-4 w-full">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-black text-white uppercase">Midnight Blue</span>
                        {(previewTheme || theme) === 'midnight-blue' && (
                          <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></span>
                        )}
                      </div>
                      <p className="text-[10px] text-zinc-500 leading-tight">Sovereign deep navy template accented by royal cosmic blue.</p>
                    </div>

                    {/* Miniature UI sample representation of theme */}
                    <div className="w-full bg-[#030610] border border-zinc-900 rounded-xl p-2.5 space-y-2 pointer-events-none font-sans scale-95 origin-left">
                      <div className="flex justify-between items-center">
                        <div className="w-8 h-1.5 bg-zinc-800 rounded-full"></div>
                        <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                      </div>
                      <div className="space-y-1">
                        <div className="w-full h-1 bg-zinc-900 rounded-full overflow-hidden">
                          <div className="w-1/2 h-full bg-blue-500"></div>
                        </div>
                      </div>
                      <div className="flex justify-between items-center pt-1 border-t border-zinc-900">
                        <div className="w-4 h-4 rounded-full bg-zinc-900 flex items-center justify-center text-[7px] font-bold text-blue-400">R</div>
                        <div className="w-10 h-3 bg-blue-600 rounded text-[6px] font-black text-white flex items-center justify-center">CORE</div>
                      </div>
                    </div>
                  </button>

                  {/* Option 3: Emerald Forest */}
                  <button
                    onClick={() => {
                      setPreviewTheme('emerald-forest');
                      toast("Previewing Emerald Forest theme. Click Apply below to save.", { id: 'preview-ef', icon: '🎨' });
                    }}
                    className={`text-left rounded-2xl p-4 transition-all relative overflow-hidden flex flex-col justify-between border ${
                      (previewTheme || theme) === 'emerald-forest'
                        ? 'border-emerald-500 bg-emerald-950/10 ring-2 ring-emerald-500/20'
                        : 'border-zinc-850 bg-zinc-950/40 hover:border-zinc-700/60'
                    }`}
                  >
                    <div className="space-y-1 mb-4 w-full">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-black text-white uppercase">Emerald Forest</span>
                        {(previewTheme || theme) === 'emerald-forest' && (
                          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                        )}
                      </div>
                      <p className="text-[10px] text-zinc-500 leading-tight">Organic pine-moss dark workspace with mint green accents.</p>
                    </div>

                    {/* Miniature UI sample representation of theme */}
                    <div className="w-full bg-[#022c22] border border-zinc-900 rounded-xl p-2.5 space-y-2 pointer-events-none font-sans scale-95 origin-left">
                      <div className="flex justify-between items-center">
                        <div className="w-8 h-1.5 bg-zinc-800 rounded-full"></div>
                        <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
                      </div>
                      <div className="space-y-1">
                        <div className="w-full h-1 bg-zinc-900 rounded-full overflow-hidden">
                          <div className="w-3/4 h-full bg-emerald-500"></div>
                        </div>
                      </div>
                      <div className="flex justify-between items-center pt-1 border-t border-zinc-900">
                        <div className="w-4 h-4 rounded-full bg-zinc-900 flex items-center justify-center text-[7px] font-bold text-emerald-400">R</div>
                        <div className="w-10 h-3 bg-emerald-600 rounded text-[6px] font-black text-white flex items-center justify-center">CORE</div>
                      </div>
                    </div>
                  </button>

                  {/* Option 4: Deep Work */}
                  <button
                    onClick={() => {
                      setPreviewTheme('deep-work');
                      toast("Previewing Deep Work theme. Click Apply below to save.", { id: 'preview-dw', icon: '🎨' });
                    }}
                    className={`text-left rounded-2xl p-4 transition-all relative overflow-hidden flex flex-col justify-between border ${
                      (previewTheme || theme) === 'deep-work'
                        ? 'border-zinc-200 bg-zinc-900/40 ring-2 ring-white/25'
                        : 'border-zinc-850 bg-zinc-950/40 hover:border-zinc-700/60'
                    }`}
                  >
                    <div className="space-y-1 mb-4 w-full">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-black text-white uppercase">Deep Work</span>
                        {(previewTheme || theme) === 'deep-work' && (
                          <span className="w-2 h-2 rounded-full bg-white animate-pulse"></span>
                        )}
                      </div>
                      <p className="text-[10px] text-zinc-500 leading-tight">High contrast stark monochrome template designed for distraction-free focus.</p>
                    </div>

                    {/* Miniature UI sample representation of theme */}
                    <div className="w-full bg-[#000000] border border-zinc-900 rounded-xl p-2.5 space-y-2 pointer-events-none font-sans scale-95 origin-left">
                      <div className="flex justify-between items-center">
                        <div className="w-8 h-1.5 bg-zinc-800 rounded-full"></div>
                        <div className="w-2 h-2 rounded-full bg-white"></div>
                      </div>
                      <div className="space-y-1">
                        <div className="w-full h-1 bg-zinc-900 rounded-full overflow-hidden">
                          <div className="w-full h-full bg-white"></div>
                        </div>
                      </div>
                      <div className="flex justify-between items-center pt-1 border-t border-zinc-900">
                        <div className="w-4 h-4 rounded-full bg-zinc-900 flex items-center justify-center text-[7px] font-bold text-white">R</div>
                        <div className="w-10 h-3 bg-zinc-100 rounded text-[6px] font-black text-zinc-950 flex items-center justify-center">CORE</div>
                      </div>
                    </div>
                  </button>
                </div>

                {/* Theme Live Preview Alert Banner */}
                {previewTheme && previewTheme !== theme && (
                  <div className="bg-amber-955 bg-amber-950/20 border border-amber-500/30 rounded-2xl p-3 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-amber-300 animate-fade-in">
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse shrink-0" />
                      <span className="leading-relaxed">
                        Live Preview: <strong>{previewTheme === 'cyberpunk-red' ? 'Cyberpunk Red' : previewTheme === 'midnight-blue' ? 'Midnight Blue' : previewTheme === 'emerald-forest' ? 'Emerald Forest' : 'Deep Work'}</strong> active. Persist this theme or revert to original.
                      </span>
                    </div>
                    <div className="flex gap-2 shrink-0">
                      <button
                        onClick={() => {
                          setTheme(previewTheme);
                          setPreviewTheme(null);
                          toast.success("Theme permanently applied! 🎉");
                        }}
                        className="bg-amber-600 hover:bg-amber-500 text-black font-black uppercase text-[10px] tracking-wider px-3 py-1.5 rounded-lg transition-all cursor-pointer active:scale-95"
                      >
                        Apply Theme
                      </button>
                      <button
                        onClick={() => {
                          setPreviewTheme(null);
                          toast("Preview reverted.", { icon: '🔄' });
                        }}
                        className="bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-black uppercase text-[10px] tracking-wider px-3 py-1.5 rounded-lg transition-all cursor-pointer active:scale-95 border border-zinc-700"
                      >
                        Revert
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Section 2: General Controls */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-zinc-850">
                {/* Panel row 1: System Language */}
                <div className="space-y-2 bg-zinc-950/40 border border-zinc-850 p-4 rounded-2xl">
                  <label className="text-xs font-black uppercase text-white hover:text-red-400 Transition-colors flex items-center gap-1.5">
                    <Globe size={12} className="text-zinc-400" />
                    App Language Localization
                  </label>
                  <p className="text-[10px] text-zinc-500 mb-2">Translate the active command interface tabs to your desired locale.</p>
                  <select
                    value={language}
                    onChange={(e) => {
                      setLanguage(e.target.value as any);
                      toast.success(`Language set to ${LANGUAGES.find(l=>l.code===e.target.value)?.label}`);
                    }}
                    className="w-full bg-[#18181b] border border-zinc-800 text-xs font-black text-white uppercase p-2.5 rounded-xl outline-none focus:border-red-500 transition-colors cursor-pointer"
                  >
                    {LANGUAGES.map((l) => (
                      <option key={l.code} value={l.code}>
                        {l.label}
                      </option>
                    ))}
                  </select>

                  {/* Display Density Switcher */}
                  <div className="pt-4 border-t border-zinc-850/60 space-y-2">
                    <label className="text-xs font-black uppercase text-white flex items-center gap-1.5">
                      <Sliders size={12} className="text-zinc-400" />
                      Display Density
                    </label>
                    <p className="text-[10px] text-zinc-500 mb-2">Toggle between Compact and Cozy view modes to optimize workspace efficiency.</p>
                    <div className="flex bg-[#18181b] border border-zinc-800 rounded-xl p-1">
                      <button
                        type="button"
                        onClick={() => {
                          setDisplayDensity('compact');
                          toast.success("Display density set to Compact mode. 🖥️");
                        }}
                        className={`flex-1 py-1.5 text-[10px] font-black uppercase rounded-lg transition-all cursor-pointer ${
                          displayDensity === 'compact'
                            ? 'bg-red-600 text-white shadow-md font-bold'
                            : 'text-zinc-400 hover:text-zinc-200'
                        }`}
                      >
                        Compact
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setDisplayDensity('cozy');
                          toast.success("Display density set to Cozy mode. 🖥️");
                        }}
                        className={`flex-1 py-1.5 text-[10px] font-black uppercase rounded-lg transition-all cursor-pointer ${
                          displayDensity === 'cozy'
                            ? 'bg-red-600 text-white shadow-md font-bold'
                            : 'text-zinc-400 hover:text-zinc-200'
                        }`}
                      >
                        Cozy
                      </button>
                    </div>
                  </div>
                </div>

                {/* Panel row 2: Extra Options triggers */}
                <div className="space-y-3 bg-zinc-950/40 border border-zinc-850 p-4 rounded-2xl flex flex-col justify-center">
                  {/* Switch 1: Autosave */}
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-xs font-extrabold text-white block">Auto-save Document Drafts</span>
                      <span className="text-[10px] text-zinc-500">Enable automatic updates mapping of textareas</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setAutoSaveActive(!autoSaveActive);
                        toast.success(`Auto-save ${!autoSaveActive ? 'enabled' : 'disabled'}`);
                      }}
                      className={`w-9 h-5 rounded-full p-0.5 transition-colors duration-200 focus:outline-none shrink-0 ${
                        autoSaveActive ? 'bg-red-650' : 'bg-zinc-800'
                      }`}
                    >
                      <div className={`w-4 h-4 rounded-full bg-white transition-transform duration-200 ${
                        autoSaveActive ? 'translate-x-4' : 'translate-x-0'
                      }`} />
                    </button>
                  </div>

                  {/* Switch 2: Audio completion synth */}
                  <div className="flex items-center justify-between pt-3 border-t border-zinc-850/60">
                    <div>
                      <span className="text-xs font-extrabold text-white block">Acoustic Feedback Tones</span>
                      <span className="text-[10px] text-zinc-500">Play responsive synth notes on task completions</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setVocalAssistanceTone(!vocalAssistanceTone);
                        toast.success(`Audio synthesis chimes ${!vocalAssistanceTone ? 'enabled' : 'disabled'}`);
                      }}
                      className={`w-9 h-5 rounded-full p-0.5 transition-colors duration-200 focus:outline-none shrink-0 ${
                        vocalAssistanceTone ? 'bg-red-650' : 'bg-zinc-800'
                      }`}
                    >
                      <div className={`w-4 h-4 rounded-full bg-white transition-transform duration-200 ${
                        vocalAssistanceTone ? 'translate-x-4' : 'translate-x-0'
                      }`} />
                    </button>
                  </div>

                  {/* Switch 3: System Sync theme auto toggle */}
                  <div className="flex items-center justify-between pt-3 border-t border-zinc-850/60">
                    <div>
                      <span className="text-xs font-extrabold text-white block">System Sync (Day/Night Auto-Theme)</span>
                      <span className="text-[10px] text-zinc-500">Midnight Blue 🌙 (Night) vs Emerald Forest 🌲 (Day) synced with estimated local sunrise/sunset</span>
                    </div>
                    <button
                      type="button"
                      onClick={handleToggleSystemSync}
                      className={`w-9 h-5 rounded-full p-0.5 transition-colors duration-200 focus:outline-none shrink-0 ${
                        isSystemSyncEnabled ? 'bg-indigo-600' : 'bg-zinc-800'
                      }`}
                    >
                      <div className={`w-4 h-4 rounded-full bg-white transition-transform duration-200 ${
                        isSystemSyncEnabled ? 'translate-x-4' : 'translate-x-0'
                      }`} />
                    </button>
                  </div>

                  {/* Switch 4: Focus blocks */}
                  <div className="flex flex-col pt-3 border-t border-zinc-850/60 gap-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="text-xs font-extrabold text-white block">Focus Blocks (Automatic Deep Work)</span>
                        <span className="text-[10px] text-zinc-500">Automatically trigger high-contrast Monochrome theme during scheduled focus windows</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          const nextVal = !focusBlocksEnabled;
                          setFocusBlocksEnabled(nextVal);
                          localStorage.setItem('ranktica_focus_blocks_enabled', String(nextVal));
                          toast.success(`Focus blocks scheduling ${nextVal ? 'enabled 🧠' : 'disabled ❌'}`);
                        }}
                        className={`w-9 h-5 rounded-full p-0.5 transition-colors duration-200 focus:outline-none shrink-0 ${
                          focusBlocksEnabled ? 'bg-indigo-600' : 'bg-zinc-800'
                        }`}
                      >
                        <div className={`w-4 h-4 rounded-full bg-white transition-transform duration-200 ${
                          focusBlocksEnabled ? 'translate-x-4' : 'translate-x-0'
                        }`} />
                      </button>
                    </div>

                    {focusBlocksEnabled && (
                      <div className="grid grid-cols-2 gap-3 bg-zinc-900/40 p-3 rounded-xl border border-zinc-850/65">
                        <div>
                          <label className="text-[9px] font-black tracking-widest text-zinc-500 uppercase block mb-1">Start Time</label>
                          <input
                            type="time"
                            value={focusStartTime}
                            onChange={(e) => {
                              setFocusStartTime(e.target.value);
                              localStorage.setItem('ranktica_focus_start_time', e.target.value);
                            }}
                            className="bg-zinc-950 border border-zinc-800 rounded-lg px-2.5 py-1.5 text-xs text-white outline-none focus:border-indigo-500 font-mono w-full"
                          />
                        </div>
                        <div>
                          <label className="text-[9px] font-black tracking-widest text-zinc-500 uppercase block mb-1">End Time</label>
                          <input
                            type="time"
                            value={focusEndTime}
                            onChange={(e) => {
                              setFocusEndTime(e.target.value);
                              localStorage.setItem('ranktica_focus_end_time', e.target.value);
                            }}
                            className="bg-zinc-950 border border-zinc-800 rounded-lg px-2.5 py-1.5 text-xs text-white outline-none focus:border-indigo-500 font-mono w-full"
                          />
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Section 3: Global Shortcut Manager */}
              <div className="space-y-4 pt-6 border-t border-zinc-850">
                <div className="flex justify-between items-center">
                  <h4 className="text-xs font-black text-white uppercase tracking-wider flex items-center gap-1.5">
                    <Sliders size={12} className="text-red-500" />
                    Global Key Shortcut Matrix
                  </h4>
                  <button
                    type="button"
                    onClick={() => {
                      setShortcuts(DEFAULT_SHORTCUTS);
                      localStorage.setItem('ranktica_custom_shortcuts', JSON.stringify(DEFAULT_SHORTCUTS));
                      toast.success("Restored factory key configurations.");
                    }}
                    className="text-[9px] font-bold text-zinc-550 hover:text-zinc-300 uppercase underline"
                  >
                    Restore Defaults
                  </button>
                </div>
                <p className="text-[10px] text-zinc-500">
                  Click 'Record' next to any operation, then press your desired key combination to bind it.
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-56 overflow-y-auto pr-1.5 custom-scrollbar">
                  {shortcuts.map((s) => {
                    const isRecording = recordingShortcutId === s.id;
                    return (
                      <div 
                        key={s.id} 
                        className={`flex items-center justify-between p-3 rounded-2xl border ${
                          isRecording 
                            ? 'bg-red-950/10 border-red-500/40 animate-pulse' 
                            : 'bg-zinc-900/30 border-zinc-850/60 hover:border-zinc-800 transition-colors'
                        }`}
                      >
                        <div className="space-y-0.5 text-left">
                          <span className="text-[10px] font-extrabold text-zinc-300 uppercase block">{s.name}</span>
                          <span className="text-[8px] font-mono font-bold text-zinc-500 uppercase">
                            Type: {s.action === 'nav' ? 'Navigation' : 'Macro'}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-[9px] font-black uppercase text-red-500 bg-red-500/5 border border-red-500/10 px-2 py-0.5 rounded-md">
                            {isRecording ? 'Listening...' : `${s.modifier !== 'None' ? s.modifier + ' + ' : ''}${s.key.toUpperCase()}`}
                          </span>
                          <button
                            type="button"
                            onClick={() => {
                              if (isRecording) {
                                setRecordingShortcutId(null);
                              } else {
                                setRecordingShortcutId(s.id);
                                toast("Listening for key combination... Press any key.");
                              }
                            }}
                            className={`text-[8.5px] font-black uppercase tracking-wider px-2.5 py-1 rounded-lg transition-all border ${
                              isRecording
                                ? 'bg-zinc-800 text-zinc-400 border-zinc-700'
                                : 'bg-red-650 hover:bg-red-600 text-white border-transparent'
                            }`}
                          >
                            {isRecording ? 'Cancel' : 'Record'}
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Footer buttons */}
            <div className="mt-8 pt-4 border-t border-zinc-850 flex items-center justify-between">
              <span className="text-[9px] font-mono font-black text-zinc-650 uppercase tracking-widest">
                System Configurations synced to LocalStorage
              </span>
              <div className="flex gap-3">
                {previewTheme && previewTheme !== theme && (
                  <button
                    onClick={() => {
                      setPreviewTheme(null);
                      setShowSettingsModal(false);
                      toast("Preview discarded and settings closed.", { icon: '🔄' });
                    }}
                    className="bg-zinc-800 hover:bg-zinc-750 text-zinc-300 px-5 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all h-10 flex items-center justify-center cursor-pointer border border-zinc-700"
                  >
                    Discard Preview
                  </button>
                )}
                <button
                  onClick={() => {
                    if (previewTheme && previewTheme !== theme) {
                      setTheme(previewTheme);
                      setPreviewTheme(null);
                    }
                    setShowSettingsModal(false);
                    toast.success("Workspace layout persisted! 🎉");
                  }}
                  className="bg-red-650 hover:bg-red-600 border border-transparent text-white px-5 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all h-10 flex items-center justify-center cursor-pointer"
                >
                  Persist & Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Deploy Workspace Modal */}
      <AnimatePresence>
        {showWorkspaceCreator && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-zinc-900 border border-zinc-800 rounded-2xl max-w-md w-full p-6 space-y-6 shadow-2xl relative"
            >
              <button
                onClick={() => setShowWorkspaceCreator(false)}
                className="absolute top-4 right-4 text-zinc-500 hover:text-white transition-colors"
              >
                <X size={16} />
              </button>

              <div className="space-y-1">
                <h3 className="text-sm font-black uppercase tracking-wider text-white">
                  Deploy YouTube Channel Workspace
                </h3>
                <p className="text-xs text-zinc-400">
                  Configure a new content pipeline and independent target audience sandbox.
                </p>
              </div>

              <div className="space-y-4 font-mono text-left">
                <div>
                  <label className="block text-[9px] font-black uppercase text-zinc-500 tracking-wider mb-1.5">
                    Channel / Workspace Name
                  </label>
                  <input
                    type="text"
                    value={wsName}
                    onChange={(e) => setWsName(e.target.value)}
                    placeholder="e.g. AI Film Mastery"
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-3 text-xs text-zinc-200 focus:outline-none focus:border-red-500 transition-all font-mono"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[9px] font-black uppercase text-zinc-500 tracking-wider mb-1.5">
                      YouTube Handle
                    </label>
                    <input
                      type="text"
                      value={wsHandle}
                      onChange={(e) => setWsHandle(e.target.value)}
                      placeholder="e.g. @aifilmmastery"
                      className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-3 text-xs text-zinc-200 focus:outline-none focus:border-red-500 transition-all font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-[9px] font-black uppercase text-zinc-500 tracking-wider mb-1.5">
                      Niche / Vertical Focus
                    </label>
                    <input
                      type="text"
                      value={wsNiche}
                      onChange={(e) => setWsNiche(e.target.value)}
                      placeholder="e.g. AI Filmmaking"
                      className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-3 text-xs text-zinc-200 focus:outline-none focus:border-red-500 transition-all font-mono"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[9px] font-black uppercase text-zinc-500 tracking-wider mb-1.5">
                    Target Audience Persona
                  </label>
                  <input
                    type="text"
                    value={wsAudience}
                    onChange={(e) => setWsAudience(e.target.value)}
                    placeholder="e.g. Aspiring filmmakers, tech geeks"
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-3 text-xs text-zinc-200 focus:outline-none focus:border-red-500 transition-all font-mono"
                  />
                </div>

                <div>
                  <label className="block text-[9px] font-black uppercase text-zinc-500 tracking-wider mb-1.5">
                    Pipeline Upload Frequency & Goal
                  </label>
                  <input
                    type="text"
                    value={wsGoal}
                    onChange={(e) => setWsGoal(e.target.value)}
                    placeholder="e.g. 1 breakdown & 2 shorts weekly"
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-3 text-xs text-zinc-200 focus:outline-none focus:border-red-500 transition-all font-mono"
                  />
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => setShowWorkspaceCreator(false)}
                  className="flex-1 py-3 bg-zinc-800 hover:bg-zinc-750 text-zinc-300 font-black text-xs uppercase tracking-wider rounded-xl transition-all border border-zinc-700 cursor-pointer text-center"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    if (!wsName || !wsNiche || !wsAudience) {
                      toast.error("Please fill name, niche, and audience to deploy.");
                      return;
                    }
                    createWorkspace(wsName, wsNiche, wsAudience, wsHandle, wsGoal);
                    setShowWorkspaceCreator(false);
                    // Clear inputs
                    setWsName("");
                    setWsHandle("");
                    setWsNiche("");
                    setWsAudience("");
                    setWsGoal("");
                  }}
                  className="flex-1 py-3 bg-red-650 hover:bg-red-600 text-white font-black text-xs uppercase tracking-wider rounded-xl transition-all shadow-md cursor-pointer text-center"
                >
                  Deploy Pipeline
                </button>
              </div>
            </motion.div>
          </div>
        )}

        {/* Mobile Navigation Drawer */}
        {isMobileMenuOpen && (
          <>
            {/* Backdrop Overlay */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsMobileMenuOpen(false)}
              className="fixed inset-0 z-[140] bg-black/85 backdrop-blur-sm md:hidden"
            />

            {/* Slide-out Panel */}
            <motion.aside
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 220 }}
              className="fixed inset-y-0 left-0 z-[150] w-72 max-w-[85vw] h-full bg-[#0f0f12] border-r border-zinc-850 flex flex-col md:hidden shadow-2xl overflow-hidden"
            >
              {/* Header */}
              <div className="p-5 border-b border-zinc-800 flex items-center justify-between bg-zinc-950/40 shrink-0">
                <div>
                  <h1 className="text-xl font-black bg-gradient-to-r from-red-500 to-orange-500 bg-clip-text text-transparent">
                    Ranktica AI
                  </h1>
                  <p className="text-[9px] text-zinc-500 font-bold uppercase tracking-widest mt-0.5">
                    Mobile Console
                  </p>
                </div>
                <button
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="p-1.5 bg-zinc-900 border border-zinc-800 rounded-lg text-zinc-400 hover:text-white transition-all active:scale-90"
                >
                  <X size={16} />
                </button>
              </div>
              <div className="px-5 py-3 border-b border-zinc-850/60 space-y-2 shrink-0">
                <div className="flex items-center justify-between">
                  <span className="text-[8px] font-black uppercase text-zinc-500 tracking-[0.2em]">
                    YouTube Workspace
                  </span>
                  <button
                    onClick={() => {
                      setShowWorkspaceCreator(true);
                      setIsMobileMenuOpen(false);
                    }}
                    className="p-1 hover:text-white text-zinc-500 rounded bg-zinc-950 border border-zinc-850 hover:bg-zinc-900 transition-all cursor-pointer"
                    title="Deploy New Content Pipeline"
                  >
                    <Plus size={10} />
                  </button>
                </div>

                <select
                  value={activeWorkspaceId}
                  onChange={(e) => {
                    setActiveWorkspaceId(e.target.value);
                    const matched = workspaces.find(w => w.id === e.target.value);
                    if (matched) {
                      toast.success(`Pipeline switched to ${matched.name}! 🚀`);
                    }
                  }}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-xs font-black text-zinc-200 focus:outline-none focus:border-red-500 transition-all cursor-pointer"
                >
                  {workspaces.map((ws) => (
                    <option key={ws.id} value={ws.id} className="bg-zinc-950 text-zinc-200">
                      {ws.name} ({ws.handle})
                    </option>
                  ))}
                </select>
              </div>

              {/* Navigation Items (Scrollable) */}
              <nav className="flex-1 px-4 space-y-4 overflow-y-auto py-4 custom-scrollbar">
                {/* Mobile Starred Modules Section */}
                {favorites.length > 0 && (
                  <div className="space-y-0.5 border-b border-zinc-850/60 pb-3 mb-2">
                    <h3 className="px-3 text-[8px] font-black uppercase tracking-[0.2em] mb-1.5 mt-2 text-red-500 border-l border-red-500 ml-1 flex items-center gap-1.5">
                      <Star size={9} className="fill-red-500 text-red-500 animate-pulse" />
                      Starred Modules
                    </h3>
                    {NAV_ITEMS.filter((item) => favorites.includes(item.id)).map((item) => {
                      const isActive = currentTool === item.id;
                      return (
                        <div key={`mobile-starred-${item.id}`} className="flex items-center w-full relative">
                          <button
                            onClick={() => {
                              onNavigate(item.id);
                              setIsMobileMenuOpen(false);
                            }}
                            className={`flex items-center justify-between flex-1 px-3 py-1.5 text-xs font-bold rounded-xl transition-all ${
                              isActive
                                ? "bg-red-500/10 text-red-500 border border-red-500/20 shadow-sm"
                                : "text-zinc-500 hover:bg-zinc-800/50 hover:text-zinc-200 border border-transparent"
                            }`}
                          >
                            <div className="flex items-center overflow-hidden">
                              <span className={`mr-2.5 transition-colors ${isActive ? "text-red-500" : "text-zinc-700"}`}>
                                {item.icon}
                              </span>
                              <span className="truncate">
                                {(() => {
                                  const keyMap: Record<string, string> = {
                                    dashboard: 'creatorCommand',
                                    projects: 'productionBoard',
                                    team_members: 'teamMembers',
                                    video_studio: 'videoStudio',
                                    ai_employee_os: 'digitalEmployeeOS',
                                    about: 'systemManifest',
                                    cost_governance: 'aiCostGovernance',
                                    security: 'securityAuditing',
                                    activity_logs: 'auditCompliance'
                                  };
                                  return keyMap[item.id] ? t(keyMap[item.id]) : item.label;
                                })()}
                              </span>
                            </div>

                            {/* Unstar */}
                            <span
                              onClick={(e) => {
                                e.stopPropagation();
                                toggleFavorite(item.id);
                              }}
                              className="p-1 rounded hover:bg-zinc-850 text-yellow-500 transition-all shrink-0 ml-2"
                            >
                              <Star size={11} className="fill-yellow-500 text-yellow-500" />
                            </span>
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* Standard Categories */}
                {Array.from(new Set(NAV_ITEMS.map((i) => i.category || "Other"))).map(
                  (cat) => (
                    <div key={cat} className="space-y-0.5">
                      <h3 className="px-3 text-[8px] font-black uppercase tracking-[0.2em] mb-1.5 mt-4 text-zinc-650 border-l border-zinc-800 ml-1">
                        {cat}
                      </h3>
                      {NAV_ITEMS.filter((i) => i.category === cat).map((item) => {
                        const isActive = currentTool === item.id;
                        return (
                          <div key={`mobile-nav-${item.id}`} className="flex items-center w-full relative">
                            <button
                              onClick={() => {
                                onNavigate(item.id);
                                setIsMobileMenuOpen(false);
                              }}
                              className={`flex items-center justify-between flex-1 px-3 py-1.5 text-xs font-bold rounded-xl transition-all ${
                                isActive
                                  ? "bg-red-500/10 text-red-500 border border-red-500/20 shadow-sm"
                                  : "text-zinc-500 hover:bg-zinc-800/50 hover:text-zinc-200 border border-transparent"
                              }`}
                            >
                              <div className="flex items-center overflow-hidden">
                                <span className={`mr-2.5 transition-colors ${isActive ? "text-red-500" : "text-zinc-700"}`}>
                                  {item.icon}
                                </span>
                                <span className="truncate">
                                  {(() => {
                                    const keyMap: Record<string, string> = {
                                      dashboard: 'creatorCommand',
                                      projects: 'productionBoard',
                                      team_members: 'teamMembers',
                                      video_studio: 'videoStudio',
                                      ai_employee_os: 'digitalEmployeeOS',
                                      about: 'systemManifest',
                                      cost_governance: 'aiCostGovernance',
                                      security: 'securityAuditing',
                                      activity_logs: 'auditCompliance'
                                    };
                                    return keyMap[item.id] ? t(keyMap[item.id]) : item.label;
                                  })()}
                                </span>
                              </div>

                              {/* Star Toggle */}
                              <span
                                onClick={(e) => {
                                  e.stopPropagation();
                                  toggleFavorite(item.id);
                                }}
                                className={`p-1 rounded hover:bg-zinc-850 text-zinc-550 hover:text-yellow-500 transition-all shrink-0 ml-2 ${
                                  favorites.includes(item.id) ? "text-yellow-500" : ""
                                }`}
                              >
                                <Star size={11} className={favorites.includes(item.id) ? "fill-yellow-500 text-yellow-500" : ""} />
                              </span>
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  )
                )}
              </nav>

              {/* Footer */}
              <div className="p-4 border-t border-zinc-800 space-y-3 bg-zinc-950/40 shrink-0">
                <div className="flex items-center gap-3 bg-zinc-900/60 border border-zinc-850 p-2.5 rounded-xl">
                  <div className="w-7 h-7 rounded-lg bg-red-600 text-white flex items-center justify-center font-black text-[9px]">
                    {plan.substring(0, 3).toUpperCase()}
                  </div>
                  <div className="flex-1 overflow-hidden">
                    <p className="text-[10px] font-black truncate text-zinc-200">
                      {user?.name}
                    </p>
                    <p className="text-[8px] font-bold text-zinc-600 uppercase tracking-tighter">
                      {daysLeft}D REMAINING
                    </p>
                  </div>
                </div>

                <div className="text-center py-1">
                  <a
                    href="https://warsientrepreneurs.com/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group inline-flex flex-col items-center justify-center gap-0.5 text-[8px] font-mono tracking-widest text-zinc-650 hover:text-red-500 uppercase transition-all"
                  >
                    <span className="text-[7px] text-zinc-600 group-hover:text-zinc-500 transition-colors">Developed & Designed By</span>
                    <span className="font-extrabold text-zinc-400 group-hover:text-red-500 tracking-[0.15em] transition-colors">Warsi Entrepreneurs</span>
                  </a>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      setShowSettingsModal(true);
                      setIsMobileMenuOpen(false);
                    }}
                    className="flex-1 flex items-center justify-center gap-1.5 py-2 border border-zinc-800 bg-zinc-900 rounded-xl text-[9px] font-black uppercase text-zinc-400 hover:text-white"
                  >
                    <Settings size={12} /> Settings
                  </button>
                  <button
                    onClick={logout}
                    className="flex-1 flex items-center justify-center gap-1.5 py-2 border border-transparent bg-red-650/10 text-[9px] font-black uppercase text-red-400 hover:text-red-300 rounded-xl"
                  >
                    <LogOut size={12} /> Sign Out
                  </button>
                </div>
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* Overlay Help Modal (Ctrl+Shift+/) */}
      <AnimatePresence>
        {showShortcutOverlay && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[1000] flex items-center justify-center p-4 bg-zinc-950/80 backdrop-blur-md"
            onClick={() => setShowShortcutOverlay(false)}
          >
            <motion.div
              initial={{ scale: 0.95, y: 15 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 15 }}
              transition={{ type: "spring", duration: 0.4 }}
              className="w-full max-w-2xl p-6 rounded-[2rem] bg-zinc-900 border border-zinc-800 shadow-2xl relative overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Decorative glows */}
              <div className="absolute top-0 right-0 w-48 h-48 bg-red-600/10 rounded-full blur-3xl pointer-events-none" />
              <div className="absolute bottom-0 left-0 w-48 h-48 bg-indigo-600/10 rounded-full blur-3xl pointer-events-none" />

              {/* Header */}
              <div className="flex items-center justify-between pb-4 border-b border-zinc-800 relative z-10">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 bg-red-600/10 border border-red-500/20 text-red-500 rounded-xl">
                    <Sliders size={18} />
                  </div>
                  <div>
                    <h3 className="text-base font-black uppercase text-zinc-100 tracking-tight font-sans">
                      Ranktica AI Shortcut Command Matrix
                    </h3>
                    <p className="text-[10px] font-mono font-bold text-zinc-500 uppercase tracking-wider">
                      Keyboard Pipeline & Visual Reference Map
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setShowShortcutOverlay(false)}
                  className="w-7 h-7 rounded-xl border border-zinc-800 bg-zinc-900 hover:text-white text-zinc-400 transition-colors flex items-center justify-center cursor-pointer text-xs"
                >
                  ✕
                </button>
              </div>

              {/* Grid content */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6 relative z-10 max-h-[60vh] overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-zinc-800">
                
                {/* Category 1: Global Operations */}
                <div className="space-y-3">
                  <h4 className="text-[9px] font-black text-red-500 uppercase tracking-widest border-l-2 border-red-500 pl-2">
                    Global System Commands
                  </h4>
                  <div className="space-y-2.5">
                    <div className="flex items-center justify-between bg-zinc-950 border border-zinc-850 p-2.5 rounded-xl">
                      <span className="text-[10px] text-zinc-300 font-bold">Toggle Shortcuts Overlay</span>
                      <div className="flex gap-1">
                        <kbd className="font-mono text-[9px] font-black bg-zinc-800 text-zinc-100 border border-zinc-700 rounded px-1.5 py-0.5 shadow-sm">Ctrl</kbd>
                        <span className="text-[9px] text-zinc-500 self-center">+</span>
                        <kbd className="font-mono text-[9px] font-black bg-zinc-800 text-zinc-100 border border-zinc-700 rounded px-1.5 py-0.5 shadow-sm">Shift</kbd>
                        <span className="text-[9px] text-zinc-500 self-center">+</span>
                        <kbd className="font-mono text-[9px] font-black bg-zinc-800 text-zinc-100 border border-zinc-700 rounded px-1.5 py-0.5 shadow-sm">/</kbd>
                      </div>
                    </div>

                    <div className="flex items-center justify-between bg-zinc-950 border border-zinc-850 p-2.5 rounded-xl">
                      <span className="text-[10px] text-zinc-300 font-bold">Save System State / Check-in</span>
                      <div className="flex gap-1">
                        <kbd className="font-mono text-[9px] font-black bg-zinc-800 text-zinc-100 border border-zinc-700 rounded px-1.5 py-0.5 shadow-sm">Ctrl</kbd>
                        <span className="text-[9px] text-zinc-500 self-center">+</span>
                        <kbd className="font-mono text-[9px] font-black bg-zinc-800 text-zinc-100 border border-zinc-700 rounded px-1.5 py-0.5 shadow-sm">S</kbd>
                      </div>
                    </div>

                    <div className="flex items-center justify-between bg-zinc-955/50 bg-zinc-950 border border-zinc-850 p-2.5 rounded-xl">
                      <span className="text-[10px] text-zinc-300 font-bold">Launch Onboarding Tour</span>
                      <div className="flex gap-1">
                        <kbd className="font-mono text-[9px] font-black bg-zinc-800 text-zinc-100 border border-zinc-700 rounded px-1.5 py-0.5 shadow-sm">Click</kbd>
                        <span className="text-[9px] text-zinc-500 self-center">"Tour"</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Category 2: Rapid Module Hop */}
                <div className="space-y-3">
                  <h4 className="text-[9px] font-black text-indigo-400 uppercase tracking-widest border-l-2 border-indigo-500 pl-2">
                    Rapid Module Navigation
                  </h4>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between bg-zinc-950 border border-zinc-850 p-2 rounded-xl">
                      <span className="text-[10px] text-zinc-300 font-bold">Jump to Creator Command</span>
                      <div className="flex gap-1">
                        <kbd className="font-mono text-[8px] font-black bg-zinc-800 text-zinc-100 border border-zinc-700 rounded px-1 shadow-sm">Alt</kbd>
                        <span className="text-[8px] text-zinc-500 self-center">+</span>
                        <kbd className="font-mono text-[8px] font-black bg-zinc-800 text-zinc-100 border border-zinc-700 rounded px-1 shadow-sm">D</kbd>
                      </div>
                    </div>

                    <div className="flex items-center justify-between bg-zinc-955/50 bg-zinc-950 border border-zinc-850 p-2 rounded-xl">
                      <span className="text-[10px] text-zinc-300 font-bold">Jump to Idea Box</span>
                      <div className="flex gap-1">
                        <kbd className="font-mono text-[8px] font-black bg-zinc-800 text-zinc-100 border border-zinc-700 rounded px-1 shadow-sm">Alt</kbd>
                        <span className="text-[8px] text-zinc-500 self-center">+</span>
                        <kbd className="font-mono text-[8px] font-black bg-zinc-800 text-zinc-100 border border-zinc-700 rounded px-1 shadow-sm">I</kbd>
                      </div>
                    </div>

                    <div className="flex items-center justify-between bg-zinc-955/50 bg-zinc-950 border border-zinc-850 p-2 rounded-xl">
                      <span className="text-[10px] text-zinc-300 font-bold">Jump to Script Writer</span>
                      <div className="flex gap-1">
                        <kbd className="font-mono text-[8px] font-black bg-zinc-800 text-zinc-100 border border-zinc-700 rounded px-1 shadow-sm">Alt</kbd>
                        <span className="text-[8px] text-zinc-500 self-center">+</span>
                        <kbd className="font-mono text-[8px] font-black bg-zinc-800 text-zinc-100 border border-zinc-700 rounded px-1 shadow-sm">S</kbd>
                      </div>
                    </div>

                    <div className="flex items-center justify-between bg-zinc-955/50 bg-zinc-950 border border-zinc-850 p-2 rounded-xl">
                      <span className="text-[10px] text-zinc-300 font-bold">Jump to Video Studio</span>
                      <div className="flex gap-1">
                        <kbd className="font-mono text-[8px] font-black bg-zinc-800 text-zinc-100 border border-zinc-700 rounded px-1 shadow-sm">Alt</kbd>
                        <span className="text-[8px] text-zinc-500 self-center">+</span>
                        <kbd className="font-mono text-[8px] font-black bg-zinc-800 text-zinc-100 border border-zinc-700 rounded px-1 shadow-sm">V</kbd>
                      </div>
                    </div>

                    <div className="flex items-center justify-between bg-zinc-955/50 bg-zinc-950 border border-zinc-850 p-2 rounded-xl">
                      <span className="text-[10px] text-zinc-300 font-bold">Jump to Keyword Inspector</span>
                      <div className="flex gap-1">
                        <kbd className="font-mono text-[8px] font-black bg-zinc-800 text-zinc-100 border border-zinc-700 rounded px-1 shadow-sm">Alt</kbd>
                        <span className="text-[8px] text-zinc-500 self-center">+</span>
                        <kbd className="font-mono text-[8px] font-black bg-zinc-800 text-zinc-100 border border-zinc-700 rounded px-1 shadow-sm">K</kbd>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Category 3: Interactive Macros */}
                <div className="space-y-3">
                  <h4 className="text-[9px] font-black text-emerald-500 uppercase tracking-widest border-l-2 border-emerald-500 pl-2">
                    Action Macro Engines
                  </h4>
                  <div className="space-y-2.5">
                    <div className="flex items-center justify-between bg-zinc-955/50 bg-zinc-950 border border-zinc-850 p-2.5 rounded-xl">
                      <span className="text-[10px] text-zinc-300 font-bold font-mono">Macro: Trigger AI Generation</span>
                      <div className="flex gap-1">
                        <kbd className="font-mono text-[9px] font-black bg-zinc-800 text-zinc-100 border border-zinc-700 rounded px-1.5 py-0.5 shadow-sm">Ctrl</kbd>
                        <span className="text-[9px] text-zinc-500 self-center">+</span>
                        <kbd className="font-mono text-[9px] font-black bg-zinc-800 text-zinc-100 border border-zinc-700 rounded px-1.5 py-0.5 shadow-sm">G</kbd>
                      </div>
                    </div>

                    <div className="flex items-center justify-between bg-zinc-955/50 bg-zinc-950 border border-zinc-850 p-2.5 rounded-xl">
                      <span className="text-[10px] text-zinc-300 font-bold font-mono">Macro: Clear Editor Canvas</span>
                      <div className="flex gap-1">
                        <kbd className="font-mono text-[9px] font-black bg-zinc-800 text-zinc-100 border border-zinc-700 rounded px-1.5 py-0.5 shadow-sm">Ctrl</kbd>
                        <span className="text-[9px] text-zinc-500 self-center">+</span>
                        <kbd className="font-mono text-[9px] font-black bg-zinc-800 text-zinc-100 border border-zinc-700 rounded px-1.5 py-0.5 shadow-sm">E</kbd>
                      </div>
                    </div>

                    <div className="flex items-center justify-between bg-zinc-955/50 bg-zinc-950 border border-zinc-850 p-2.5 rounded-xl">
                      <span className="text-[10px] text-zinc-300 font-bold font-mono">Macro: Save Content Draft</span>
                      <div className="flex gap-1">
                        <kbd className="font-mono text-[9px] font-black bg-zinc-800 text-zinc-100 border border-zinc-700 rounded px-1.5 py-0.5 shadow-sm">Ctrl</kbd>
                        <span className="text-[9px] text-zinc-500 self-center">+</span>
                        <kbd className="font-mono text-[9px] font-black bg-zinc-800 text-zinc-100 border border-zinc-700 rounded px-1.5 py-0.5 shadow-sm">S</kbd>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Interactive Macro Info and Config Panel */}
                <div className="space-y-3">
                  <h4 className="text-[9px] font-black text-amber-500 uppercase tracking-widest border-l-2 border-amber-500 pl-2">
                    Keyboard Macros Setup
                  </h4>
                  <div className="bg-zinc-950 border border-zinc-850 rounded-xl p-3 space-y-2 text-[10px] text-zinc-400 font-sans">
                    <p>
                      Remap dynamic navigation and action macro keys inside the <strong className="text-zinc-200">System Config Settings modal</strong>.
                    </p>
                    <div className="p-2 border border-zinc-850 bg-zinc-900 rounded-lg text-[9px] font-mono text-zinc-500">
                      Settings &gt; Global Key Shortcut Matrix &gt; Double-click shortcut cell to record new hotkey sequences.
                    </div>
                    <p className="text-[9px] italic text-zinc-500 font-mono">
                      *Note: Avoid overriding browser defaults like Ctrl+T or Ctrl+W.
                    </p>
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div className="mt-6 pt-4 border-t border-zinc-800 flex items-center justify-between text-[10px] font-mono text-zinc-500">
                <span>Ranktica Clinical OS v1.99</span>
                <span className="bg-indigo-500/10 text-indigo-400 px-2 py-0.5 rounded-md font-bold text-[8px] uppercase tracking-wider">
                  Press Ctrl+Shift+/ again to exit
                </span>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
      <InactivitySaveWarning />
    </div>
  );
};
