import React, { useState, useEffect, useMemo, useRef } from 'react';
import { jsPDF } from 'jspdf';
import { ToolType } from '@/shared/types';
import { useAuth } from '@/infrastructure/auth/AuthContext';
import { offlineCache } from '@/shared/offlineCache';
import { ContributionHeatmap } from '@/components/ContributionHeatmap';
import { DailyCreatorDigest } from '@/components/DailyCreatorDigest';
import { RankticaCommandCenter } from './RankticaCommandCenter';
import { 
  Lightbulb, 
  FileText, 
  Image as ImageIcon, 
  Search,
  Sparkles,
  Video,
  ChevronRight,
  BarChart2,
  Mic,
  Waves,
  Clapperboard,
  Cpu,
  Flame,
  Calendar,
  CheckCircle2,
  TrendingUp,
  Clock,
  ArrowRight,
  Eye,
  Copy,
  Download,
  FileJson,
  ArrowUpRight,
  ArrowDownRight,
  RefreshCw,
  Sliders,
  Timer,
  Pause,
  Play,
  ChevronDown,
  ChevronUp,
  Layers,
  Database,
  Plus,
  AlertCircle,
  Keyboard,
  Table,
  X,
  Activity,
  Pin,
  Globe,
  Users,
  History,
  Target,
  Battery,
  FolderOpen
} from 'lucide-react';
// Using custom SVG area charts to ensure full React 19 compatibility and premium custom interactive rendering
const SimpleAreaChart = ({ data, strokeColor = '#ef4444', height = 160 }: { data: { day?: string; t?: string; value?: number; count?: number; usage?: number; ping?: number; }[], strokeColor?: string, height?: number }) => {
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);

  if (!data || data.length === 0) return null;

  const values = data.map(d => d.value !== undefined ? d.value : (d.count !== undefined ? d.count : (d.usage !== undefined ? d.usage : (d.ping || 0))));
  const max = Math.max(...values, 1);
  const min = Math.min(...values, 0);
  const range = max - min || 1;
  
  const paddingY = 20;
  const chartHeight = height - paddingY * 2;
  const width = 600;
  
  const points = data.map((d, i) => {
    const val = d.value !== undefined ? d.value : (d.count !== undefined ? d.count : (d.usage !== undefined ? d.usage : (d.ping || 0)));
    const x = (i / Math.max(1, data.length - 1)) * width;
    const y = paddingY + chartHeight - ((val - min) / range) * chartHeight;
    const label = d.day || d.t || '';
    return { x, y, label, val };
  });
  
  let pathD = '';
  if (points.length > 0) {
    pathD = `M ${points[0].x} ${points[0].y}`;
    for (let i = 1; i < points.length; i++) {
      const p0 = points[i - 1];
      const p1 = points[i];
      const cpX1 = p0.x + (p1.x - p0.x) / 3;
      const cpY1 = p0.y;
      const cpX2 = p0.x + 2 * (p1.x - p0.x) / 3;
      const cpY2 = p1.y;
      pathD += ` C ${cpX1} ${cpY1}, ${cpX2} ${cpY2}, ${p1.x} ${p1.y}`;
    }
  }
  
  const fillD = pathD ? `${pathD} L ${points[points.length - 1].x} ${height} L ${points[0].x} ${height} Z` : '';

  return (
    <div className="w-full h-full flex flex-col justify-between">
      <div className="relative flex-1" style={{ height }}>
        <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-full overflow-visible">
          <defs>
            <linearGradient id={`chartGradient-${strokeColor.replace('#', '')}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={strokeColor} stopOpacity={0.3} />
              <stop offset="100%" stopColor={strokeColor} stopOpacity={0} />
            </linearGradient>
          </defs>
          
          {[0, 0.25, 0.5, 0.75, 1].map((ratio, idx) => {
            const y = paddingY + chartHeight * ratio;
            return (
              <line 
                key={idx} 
                x1={0} 
                y1={y} 
                x2={width} 
                y2={y} 
                stroke="#27272a" 
                strokeWidth={1} 
                strokeDasharray="4 4" 
                opacity={0.3}
              />
            );
          })}
          
          {fillD && <path d={fillD} fill={`url(#chartGradient-${strokeColor.replace('#', '')})`} />}
          
          {pathD && (
            <path 
              d={pathD} 
              fill="none" 
              stroke={strokeColor} 
              strokeWidth={3.5} 
              strokeLinecap="round" 
              strokeLinejoin="round" 
            />
          )}
          
          {points.map((p, idx) => (
            <g key={idx}>
              <rect 
                x={idx === 0 ? 0 : p.x - (width / (data.length - 1)) / 2}
                y={0}
                width={width / (data.length - 1)}
                height={height}
                fill="transparent"
                onMouseEnter={() => setHoveredIdx(idx)}
                onMouseLeave={() => setHoveredIdx(null)}
                className="cursor-pointer"
              />
              
              {hoveredIdx === idx && (
                <>
                  <line 
                    x1={p.x} 
                    y1={0} 
                    x2={p.x} 
                    y2={height} 
                    stroke={strokeColor} 
                    strokeWidth={1.5} 
                    strokeDasharray="2 2" 
                    opacity={0.6}
                  />
                  <circle 
                    cx={p.x} 
                    cy={p.y} 
                    r={5} 
                    fill="#18181b" 
                    stroke={strokeColor} 
                    strokeWidth={3} 
                  />
                </>
              )}
            </g>
          ))}
        </svg>

        {hoveredIdx !== null && (
          <div 
            className="absolute z-20 bg-zinc-950 border border-zinc-800 p-2 text-xs rounded-xl shadow-2xl pointer-events-none min-w-[80px]"
            style={{ 
              left: `${Math.min(84, Math.max(0, (hoveredIdx / (points.length - 1)) * 100 - 10))}%`, 
              top: '5%' 
            }}
          >
            <p className="text-zinc-500 font-bold uppercase text-[9px] tracking-wider">{points[hoveredIdx].label}</p>
            <p className="text-white font-extrabold text-xs">{points[hoveredIdx].val.toLocaleString()}</p>
          </div>
        )}
      </div>
      
      <div className="flex justify-between text-zinc-500 text-[10px] font-black uppercase mt-2 px-1 select-none">
        {data.map((d, i) => (
          <span key={i}>{d.day}</span>
        ))}
      </div>
    </div>
  );
};
import { toast } from 'react-hot-toast';
import { getActivities, logActivity, ActivityItem } from '@/shared/activityLogger';
import { useProject } from './ProjectContext';
import { Trash2, Archive, RotateCcw, BatteryCharging, BatteryWarning } from 'lucide-react';
import { TemplateGallery } from '@/components/TemplateGallery';
import { useTaskScheduler } from '@/shared/useTaskScheduler';

const CAROUSEL_DRAFTS = [
  {
    type: 'thumbnail',
    title: 'Thumbnail Concept A (High CTR Curiosity)',
    img: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=400&q=80',
    tag: '9.2% Predicted CTR',
    details: 'Red glow backdrop with bold pattern interrupt outline.'
  },
  {
    type: 'video_frame',
    title: 'Intro Hook Pattern Interrupt (0:03)',
    img: 'https://images.unsplash.com/photo-1626544827763-d516dce335e2?auto=format&fit=crop&w=400&q=80',
    tag: 'Retention Safe Frame',
    details: 'Zoomed expression visual on neural mesh nodes asset.'
  },
  {
    type: 'thumbnail',
    title: 'Thumbnail Concept B (Minimalist Editorial)',
    img: 'https://images.unsplash.com/photo-1634017839464-5c339ebe3cb4?auto=format&fit=crop&w=400&q=80',
    tag: '8.4% Predicted CTR',
    details: 'Monochrome charcoal matte with neon orange label.'
  },
  {
    type: 'video_frame',
    title: 'B-Roll Section: Smart Swarm Demo (1:12)',
    img: 'https://images.unsplash.com/photo-1639762681485-074b7f938ba0?auto=format&fit=crop&w=400&q=80',
    tag: 'Dynamic Visual Overlay',
    details: 'Simulated neural network rendering in terminal view.'
  }
];

interface ChannelStat {
  views: number;
  viewsChange: number;
  subs: number;
  subsChange: number;
  ctr: number;
  ctrChange: number;
  watchTime: number;
  watchTimeChange: number;
}

interface PlatformStats {
  youtube: ChannelStat;
  tiktok: ChannelStat;
  instagram: ChannelStat;
}

const DEFAULT_CHANNEL_STATS: PlatformStats = {
  youtube: {
    views: 12450,
    viewsChange: 14.8,
    subs: 185,
    subsChange: 8.2,
    ctr: 8.4,
    ctrChange: 1.2,
    watchTime: 412,
    watchTimeChange: -2.4,
  },
  tiktok: {
    views: 45800,
    viewsChange: 26.3,
    subs: 940,
    subsChange: 11.5,
    ctr: 4.8,
    ctrChange: 0.6,
    watchTime: 204,
    watchTimeChange: 5.1,
  },
  instagram: {
    views: 18900,
    viewsChange: -5.2,
    subs: 220,
    subsChange: 4.1,
    ctr: 6.2,
    ctrChange: -0.3,
    watchTime: 158,
    watchTimeChange: 3.8,
  }
};

const QUICK_ACTION_TASKS = [
  {
    id: 'video_generation',
    name: 'Video Diffusion & Interpolation',
    icon: 'video',
    standardPower: '120W',
    saverPower: '40W',
    description: 'High-fidelity frame synthesis, video structure expansion & upscale.'
  },
  {
    id: 'voice_cloning',
    name: 'Multi-Agent Voice Cloning',
    icon: 'mic',
    standardPower: '85W',
    saverPower: '30W',
    description: 'Acoustic voice cloning & parallel neural phonetic synthesis.'
  },
  {
    id: 'web_crawling',
    name: 'Semantic Web Crawlers',
    icon: 'globe',
    standardPower: '55W',
    saverPower: '15W',
    description: 'Autonomous parallel scrapers & SEO keyword cluster indexing.'
  },
  {
    id: 'chunk_embeddings',
    name: 'Parallel Vector Embeddings',
    icon: 'database',
    standardPower: '70W',
    saverPower: '20W',
    description: 'Heavy text tokenization & real-time vector DB synchronization.'
  }
];

const getToolIcon = (tool: ToolType) => {
  switch (tool) {
    case ToolType.AGENT_BUS: return <Layers size={14} className="text-zinc-400" />;
    case ToolType.DEV_DASHBOARD: return <Cpu size={14} className="text-red-400" />;
    case ToolType.PROJECTS: return <FolderOpen size={14} className="text-blue-400" />;
    case ToolType.IDEAS: return <Lightbulb size={14} className="text-amber-400" />;
    case ToolType.SCRIPT: return <FileText size={14} className="text-emerald-400" />;
    case ToolType.SEO: return <BarChart2 size={14} className="text-indigo-400" />;
    case ToolType.THUMBNAIL: return <ImageIcon size={14} className="text-pink-400" />;
    case ToolType.THUMBNAIL_RATER: return <Target size={14} className="text-red-400" />;
    case ToolType.VIDEO: return <Video size={14} className="text-purple-400" />;
    case ToolType.VIDEO_GENERATOR: return <Clapperboard size={14} className="text-rose-400" />;
    case ToolType.AUDIO: return <Mic size={14} className="text-yellow-400" />;
    case ToolType.RESEARCH: return <Search size={14} className="text-teal-400" />;
    case ToolType.LIVE: return <Waves size={14} className="text-cyan-400" />;
    case ToolType.BATTERY_DASHBOARD: return <Battery size={14} className="text-green-400" />;
    case ToolType.TEAM_MEMBERS: return <Users size={14} className="text-violet-400" />;
    default: return <Sparkles size={14} className="text-zinc-400" />;
  }
};

const getToolLabel = (tool: ToolType) => {
  const labels: Record<string, string> = {
    agent_bus: 'Agent Bus Matrix',
    dev_dashboard: 'Developer Console',
    projects: 'Production Board',
    ideas: 'Viral Idea Lab',
    script: 'Scripting Core',
    seo: 'SEO Optimizer',
    thumbnail: 'Thumbnail Studio',
    thumbnail_rater: 'Visual Rater (CTR)',
    video: 'Video Studio',
    video_generator: 'Veo Synthesis',
    audio: 'Neural Narration',
    research: 'Research Intelligence',
    live: 'Live Brainstorm',
    battery_dashboard: 'Battery Health Lab',
    team_members: 'Team Collaboration Hub'
  };
  return labels[tool] || tool.replace('_', ' ').toUpperCase();
};

interface CreatorDashboardProps {
  onNavigate: (tool: ToolType, payload?: any) => void;
}

export const CreatorDashboard: React.FC<CreatorDashboardProps> = ({ onNavigate }) => {
  const { user } = useAuth();
  const { batteryStatus, powerSaverMode, setPowerSaverMode } = useTaskScheduler();
  const [dashboardMode, setDashboardMode] = useState<'command_center' | 'classic'>('command_center');
  const { 
    projects = [], 
    activeProject, 
    updateActiveProject, 
    createProject,
    collaborators,
    bulkDeleteProjects,
    bulkArchiveProjects,
    setActiveProjectById,
    toggleArchiveProject,
    deleteProject,
    updateProject,
    getDaysUntilDeadline,
    getDaysUntilMilestone,
    exportProjectsToCSV
  } = useProject();

  // --- GLOBAL SEARCH SYSTEM ---
  const [globalSearchQuery, setGlobalSearchQuery] = useState("");

  const globalSearchResults = useMemo(() => {
    if (!globalSearchQuery.trim()) return [];
    const query = globalSearchQuery.toLowerCase();
    const results: Array<{
      projectId: string;
      projectTitle: string;
      type: 'script' | 'thumbnail' | 'idea' | 'project';
      title: string;
      snippet: string;
      targetTool: ToolType;
    }> = [];

    projects.forEach(p => {
      // 1. Check project title & niche
      if ((p.title && p.title.toLowerCase().includes(query)) || (p.niche && p.niche.toLowerCase().includes(query))) {
        results.push({
          projectId: p.id,
          projectTitle: p.title,
          type: 'project',
          title: p.title,
          snippet: `Niche: ${p.niche || 'N/A'}. Status: ${(p.status || 'idea').toUpperCase()}`,
          targetTool: ToolType.PROJECTS
        });
      }

      // 2. Check script
      const scriptText = p.assets?.script?.dialogue || p.assets?.script?.rawText || '';
      if (scriptText && scriptText.toLowerCase().includes(query)) {
        const idx = scriptText.toLowerCase().indexOf(query);
        const start = Math.max(0, idx - 45);
        const end = Math.min(scriptText.length, idx + query.length + 65);
        const snippet = (start > 0 ? '...' : '') + scriptText.substring(start, end) + (end < scriptText.length ? '...' : '');
        results.push({
          projectId: p.id,
          projectTitle: p.title,
          type: 'script',
          title: `Script inside: ${p.title}`,
          snippet,
          targetTool: ToolType.SCRIPT
        });
      }

      // 3. Check thumbnail
      const thumbText = p.assets?.thumbnail?.prompt || p.assets?.thumbnailDraft || '';
      if (thumbText && thumbText.toLowerCase().includes(query)) {
        const idx = thumbText.toLowerCase().indexOf(query);
        const start = Math.max(0, idx - 45);
        const end = Math.min(thumbText.length, idx + query.length + 65);
        const snippet = (start > 0 ? '...' : '') + thumbText.substring(start, end) + (end < thumbText.length ? '...' : '');
        results.push({
          projectId: p.id,
          projectTitle: p.title,
          type: 'thumbnail',
          title: `Thumbnail design in: ${p.title}`,
          snippet,
          targetTool: ToolType.THUMBNAIL
        });
      }

      // 4. Check ideas
      const ideas = p.assets?.ideas || [];
      ideas.forEach((idea: any) => {
        const ideaTitle = idea.title || '';
        const ideaHook = idea.hook || '';
        if (ideaTitle.toLowerCase().includes(query) || ideaHook.toLowerCase().includes(query)) {
          results.push({
            projectId: p.id,
            projectTitle: p.title,
            type: 'idea',
            title: `Generated idea: ${ideaTitle}`,
            snippet: `Hook: "${ideaHook}"`,
            targetTool: ToolType.IDEAS
          });
        }
      });
    });

    return results;
  }, [projects, globalSearchQuery]);

  // Template creation state variables
  const [isCreatingTemplate, setIsCreatingTemplate] = useState(false);
  const [tmplName, setTmplName] = useState("");
  const [tmplNiche, setTmplNiche] = useState("");
  const [tmplAudience, setTmplAudience] = useState("");
  const [tmplType, setTmplType] = useState<"gaming" | "educational" | "vlogs">("gaming");

  // --- Interactive Lab Mode State variables ---
  const [labStep, setLabStep] = useState<number>(0); // 0 = inactive, 1 = Topic/Idea, 2 = Screenplay Script, 3 = Neural Audio, 4 = Thumbnail design, 5 = Veo Video synthesis
  const [labSelectedIdea, setLabSelectedIdea] = useState<string>('');
  const [labScriptText, setLabScriptText] = useState<string>('');
  const [labVoiceId, setLabVoiceId] = useState<string>('charon');
  const [labThumbnailPredictedCTR, setLabThumbnailPredictedCTR] = useState<string>('');
  const [labVideoPrompt, setLabVideoPrompt] = useState<string>('');
  const [labProgressPercent, setLabProgressPercent] = useState<number>(0);

  // Recently accessed modules state
  const [recentlyUsedTools, setRecentlyUsedTools] = useState<ToolType[]>([]);

  useEffect(() => {
    const loadRecentlyUsed = async () => {
      try {
        const list = await offlineCache.getState('recently_used_tools');
        if (Array.isArray(list)) {
          // Filter out DASHBOARD tool since we are currently on the dashboard
          setRecentlyUsedTools(list.filter(t => t !== ToolType.DASHBOARD));
        }
      } catch (e) {
        console.warn('[CreatorDashboard] Error loading recently used tools:', e);
      }
    };
    loadRecentlyUsed();
    
    // Listen to changes
    const handleCacheUpdate = () => {
      loadRecentlyUsed();
    };
    window.addEventListener('ranktica-offline-cache-updated', handleCacheUpdate);
    return () => window.removeEventListener('ranktica-offline-cache-updated', handleCacheUpdate);
  }, []);

  // Local state for tracking/scheduling project deadlines and milestones
  const [timelineSelectedProjId, setTimelineSelectedProjId] = useState<string>('');
  const [newMilestoneTitle, setNewMilestoneTitle] = useState('');
  const [newMilestoneDate, setNewMilestoneDate] = useState('');
  const [timelineDeadlineInput, setTimelineDeadlineInput] = useState('');
  const [hoveredTimelineItemId, setHoveredTimelineItemId] = useState<string | null>(null);

  // Real-time team presence indicators state
  const [presenceList, setPresenceList] = useState<any[]>([
    { id: 'pres_1', name: 'Sarah Jenkins', role: 'Editor', statusText: 'editing script for Cosmic Slate', moduleLabel: 'Script Writer' },
    { id: 'pres_2', name: 'Alex Mercer', role: 'Admin', statusText: 'synthesizing thumbnails', moduleLabel: 'Thumbnail Studio' },
    { id: 'pres_3', name: 'Elena Rostova', role: 'Viewer', statusText: 'brainstorming blue ocean niches', moduleLabel: 'Viral Idea Lab' },
  ]);

  // Load actual database team members if available, and mock their actions in real-time
  useEffect(() => {
    const loadPresence = async () => {
      try {
        const res = await fetch('/api/db/team-members');
        if (res.ok) {
          const members = await res.json();
          if (members && members.length > 0) {
            const modules = ['Script Writer', 'Thumbnail Studio', 'Viral Idea Lab', 'SEO Optimizer', 'Video Studio', 'Adaptive Video Studio'];
            const tasks = [
              'editing video screenplay',
              'synthesizing YouTube thumbnails',
              'brainstorming viral CTR ideas',
              'optimizing semantic metadata tags',
              'rendering active video storyboard',
              'synthesizing conversational voiceovers'
            ];
            const list = members.map((mem: any, idx: number) => ({
              id: mem.id,
              name: mem.name,
              role: mem.role || 'Editor',
              statusText: tasks[idx % tasks.length],
              moduleLabel: modules[idx % modules.length]
            }));
            setPresenceList(list);
          }
        }
      } catch (e) {
        // Fallback silently to initial mock members
      }
    };
    loadPresence();

    // Set up real-time status rotation to show dynamic module-switching activity
    const interval = setInterval(() => {
      setPresenceList(prev => {
        if (prev.length === 0) return prev;
        const indexToChange = Math.floor(Math.random() * prev.length);
        const tasks = [
          'refining blueprint outlines',
          'analyzing high-retention competitor hooks',
          'optimizing search visibility score',
          'generating audio transcript waveforms',
          'orchestrating outbound neural networks',
          'reviewing brand authority analytics'
        ];
        const modules = [
          'SEO Optimizer',
          'Competitor Intelligence',
          'Research & Grounding',
          'Precision Audio Studio',
          'Agent Bus View',
          'Developer Dashboard'
        ];
        const randomTask = tasks[Math.floor(Math.random() * tasks.length)];
        const randomModule = modules[Math.floor(Math.random() * modules.length)];
        
        return prev.map((item, idx) => {
          if (idx === indexToChange) {
            return {
              ...item,
              statusText: randomTask,
              moduleLabel: randomModule
            };
          }
          return item;
        });
      });
    }, 10000); // Shift tasks every 10s

    return () => clearInterval(interval);
  }, []);

  const [selectedDashboardProjectIds, setSelectedDashboardProjectIds] = useState<string[]>([]);
  const [showArchivedDashboardAssets, setShowArchivedDashboardAssets] = useState(false);
  const [dashboardAssetSearch, setDashboardAssetSearch] = useState("");

  // Pinned battery quick stats state
  const [pinnedBatteryStats, setPinnedBatteryStats] = useState<string[]>(() => {
    try {
      const stored = localStorage.getItem('ranktica-pinned-battery-stats');
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  const [taskPowerSavers, setTaskPowerSavers] = useState<Record<string, boolean>>(() => {
    const saved = localStorage.getItem('ranktica-task-power-savers');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error(e);
      }
    }
    return {
      video_generation: false,
      voice_cloning: false,
      web_crawling: false,
      chunk_embeddings: false
    };
  });

  // Keep state synced with localStorage changes (e.g. if updated in battery tab)
  useEffect(() => {
    const handleStorageChange = () => {
      try {
        const stored = localStorage.getItem('ranktica-pinned-battery-stats');
        setPinnedBatteryStats(stored ? JSON.parse(stored) : []);
      } catch (e) {
        console.error(e);
      }
      try {
        const saved = localStorage.getItem('ranktica-task-power-savers');
        if (saved) setTaskPowerSavers(JSON.parse(saved));
      } catch (e) {
        console.error(e);
      }
    };

    window.addEventListener('storage', handleStorageChange);
    // Also poll occasionally to capture same-tab updates if page doesn't re-render
    const interval = setInterval(handleStorageChange, 1000);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      clearInterval(interval);
    };
  }, []);

  const handleToggleEco = (taskId: string) => {
    const nextVal = !taskPowerSavers[taskId];
    const updated = { ...taskPowerSavers, [taskId]: nextVal };
    setTaskPowerSavers(updated);
    localStorage.setItem('ranktica-task-power-savers', JSON.stringify(updated));
    toast.success(`${nextVal ? 'Eco Saver mode enabled!' : 'Eco Saver mode disabled.'}`);
  };

  const handleUnpin = (taskId: string) => {
    const nextPinned = pinnedBatteryStats.filter(id => id !== taskId);
    setPinnedBatteryStats(nextPinned);
    localStorage.setItem('ranktica-pinned-battery-stats', JSON.stringify(nextPinned));
    toast.success('Unpinned scoreboard widget');
  };

  const selectedTimelineProject = useMemo(() => {
    return projects.find(p => p.id === timelineSelectedProjId) || projects.find(p => !p.archived && p.status !== 'archive') || projects[0] || null;
  }, [projects, timelineSelectedProjId]);

  // Sync deadline input state when selected project changes
  useEffect(() => {
    if (selectedTimelineProject) {
      setTimelineDeadlineInput(selectedTimelineProject.deadline || '');
    } else {
      setTimelineDeadlineInput('');
    }
  }, [selectedTimelineProject]);

  const urgentMilestoneItems = useMemo(() => {
    if (!getDaysUntilDeadline || !getDaysUntilMilestone) return [];
    
    const items: Array<{
      projectId: string;
      projectTitle: string;
      title: string;
      date: string;
      type: 'deadline' | 'milestone';
      daysRemaining: number;
    }> = [];

    projects.forEach(p => {
      if (p.archived || p.status === 'archive') return;

      const deadlineDays = getDaysUntilDeadline(p);
      if (deadlineDays !== null && deadlineDays !== undefined && p.status !== 'published') {
        // within 48 hours means <= 2.0 days (usually we care about upcoming, but we can display any <= 2 days that is not completed)
        if (deadlineDays <= 2.0 && deadlineDays >= -5) {
          items.push({
            projectId: p.id,
            projectTitle: p.title,
            title: 'Project Deadline',
            date: p.deadline || '',
            type: 'deadline',
            daysRemaining: deadlineDays
          });
        }
      }

      if (p.milestones && Array.isArray(p.milestones)) {
        p.milestones.forEach(m => {
          if (m.completed) return;
          const msDays = getDaysUntilMilestone(m.date);
          if (msDays !== null && msDays !== undefined) {
            if (msDays <= 2.0 && msDays >= -5) {
              items.push({
                projectId: p.id,
                projectTitle: p.title,
                title: m.title,
                date: m.date,
                type: 'milestone',
                daysRemaining: msDays
              });
            }
          }
        });
      }
    });

    return items;
  }, [projects, getDaysUntilDeadline, getDaysUntilMilestone]);

  const upcomingDeadlinesAndMilestones = useMemo(() => {
    const items: Array<{
      id: string;
      projectId: string;
      projectTitle: string;
      title: string;
      date: string;
      type: 'deadline' | 'milestone';
      completed?: boolean;
    }> = [];

    projects.forEach(p => {
      if (p.archived || p.status === 'archive') return;
      
      if (p.deadline) {
        items.push({
          id: `dl-${p.id}`,
          projectId: p.id,
          projectTitle: p.title,
          title: 'Project Deadline',
          date: p.deadline,
          type: 'deadline',
          completed: p.status === 'published'
        });
      }

      if (p.milestones && Array.isArray(p.milestones)) {
        p.milestones.forEach(m => {
          items.push({
            id: m.id || `ms-${p.id}-${m.title}`,
            projectId: p.id,
            projectTitle: p.title,
            title: m.title,
            date: m.date,
            type: 'milestone',
            completed: m.completed
          });
        });
      }
    });

    // Sort chronologically
    return items.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }, [projects]);

  const handleUpdateDeadline = async () => {
    if (!selectedTimelineProject) return;
    try {
      await updateProject(selectedTimelineProject.id, {
        deadline: timelineDeadlineInput
      });
      toast.success('Project deadline updated successfully!');
    } catch (err) {
      toast.error('Failed to update deadline.');
    }
  };

  const handleAddMilestone = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTimelineProject || !newMilestoneTitle.trim() || !newMilestoneDate) {
      toast.error('Please provide milestone title and date.');
      return;
    }

    const currentMilestones = selectedTimelineProject.milestones || [];
    const newMilestone = {
      id: `ms-${Date.now()}`,
      title: newMilestoneTitle.trim(),
      date: newMilestoneDate,
      completed: false
    };

    try {
      await updateProject(selectedTimelineProject.id, {
        milestones: [...currentMilestones, newMilestone]
      });
      setNewMilestoneTitle('');
      setNewMilestoneDate('');
      toast.success('Milestone added successfully!');
    } catch (err) {
      toast.error('Failed to add milestone.');
    }
  };

  const handleToggleMilestone = async (milestoneId: string) => {
    if (!selectedTimelineProject) return;
    const currentMilestones = selectedTimelineProject.milestones || [];
    const updatedMilestones = currentMilestones.map(m => 
      m.id === milestoneId ? { ...m, completed: !m.completed } : m
    );

    try {
      await updateProject(selectedTimelineProject.id, {
        milestones: updatedMilestones
      });
      toast.success('Milestone status updated!');
    } catch (err) {
      toast.error('Failed to update milestone status.');
    }
  };

  const handleDeleteMilestone = async (milestoneId: string) => {
    if (!selectedTimelineProject) return;
    const currentMilestones = selectedTimelineProject.milestones || [];
    const updatedMilestones = currentMilestones.filter(m => m.id !== milestoneId);

    try {
      await updateProject(selectedTimelineProject.id, {
        milestones: updatedMilestones
      });
      toast.success('Milestone deleted.');
    } catch (err) {
      toast.error('Failed to delete milestone.');
    }
  };

  const [collapsedWidgets, setCollapsedWidgets] = useState<Record<string, boolean>>(() => {
    try {
      const saved = localStorage.getItem('ranktica_collapsed_widgets');
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });

  const toggleWidget = (widgetId: string) => {
    setCollapsedWidgets(prev => {
      const updated = { ...prev, [widgetId]: !prev[widgetId] };
      try {
        localStorage.setItem('ranktica_collapsed_widgets', JSON.stringify(updated));
      } catch (e) {
        console.error(e);
      }
      return updated;
    });
  };

  const filteredDashboardAssets = useMemo(() => {
    return projects.filter(p => {
      const isArchived = p.archived || p.status === 'archive';
      const matchesArchive = showArchivedDashboardAssets ? isArchived : !isArchived;
      const matchesSearch = p.title.toLowerCase().includes(dashboardAssetSearch.toLowerCase()) || 
                            p.niche.toLowerCase().includes(dashboardAssetSearch.toLowerCase());
      return matchesArchive && matchesSearch;
    });
  }, [projects, showArchivedDashboardAssets, dashboardAssetSearch]);

  const projectSummaryStats = useMemo(() => {
    const totalProjects = projects.length;
    const activeWorkflows = projects.filter(p => !p.archived && p.status !== 'archive' && p.status && p.status !== 'published' && p.status !== 'idea').length;
    
    let generatedMediaAssets = 0;
    projects.forEach(p => {
      if (p.assets) {
        if (p.assets.script) generatedMediaAssets++;
        if (p.assets.thumbnail || p.assets.thumbnailDraft) generatedMediaAssets++;
        if (p.assets.seo || p.assets.metadata_topic) generatedMediaAssets++;
        if (p.assets.video || p.assets.videoUri || p.assets.videoDraft) generatedMediaAssets++;
        if (p.assets.ideas && p.assets.ideas.length > 0) generatedMediaAssets += p.assets.ideas.length;
      }
    });

    return {
      totalProjects,
      activeWorkflows: activeWorkflows || projects.filter(p => p.status === 'scripting' || p.status === 'production').length,
      generatedMediaAssets
    };
  }, [projects]);

  const handleDashboardBulkArchive = async () => {
    if (selectedDashboardProjectIds.length === 0) return;
    const verb = showArchivedDashboardAssets ? 'restore' : 'archive';
    const toastId = toast.loading(`Bulk ${verb}ing ${selectedDashboardProjectIds.length} assets...`);
    try {
      if (bulkArchiveProjects) {
        await bulkArchiveProjects(selectedDashboardProjectIds, showArchivedDashboardAssets ? false : true);
      } else {
        for (const id of selectedDashboardProjectIds) {
          await toggleArchiveProject(id);
        }
      }
      toast.success(`Successfully ${verb}d ${selectedDashboardProjectIds.length} assets.`, { id: toastId });
      setSelectedDashboardProjectIds([]);
    } catch (e) {
      toast.error(`Failed to bulk ${verb} assets.`, { id: toastId });
    }
  };

  const handleDashboardBulkDelete = async () => {
    if (selectedDashboardProjectIds.length === 0) return;
    if (!confirm(`Are you absolutely sure you want to permanently delete these ${selectedDashboardProjectIds.length} assets? This action is IRREVERSIBLE.`)) {
      return;
    }
    const toastId = toast.loading(`Bulk deleting ${selectedDashboardProjectIds.length} assets...`);
    try {
      if (bulkDeleteProjects) {
        await bulkDeleteProjects(selectedDashboardProjectIds);
      } else {
        for (const id of selectedDashboardProjectIds) {
          await deleteProject(id);
        }
      }
      toast.success(`Successfully deleted ${selectedDashboardProjectIds.length} assets.`, { id: toastId });
      setSelectedDashboardProjectIds([]);
    } catch (e) {
      toast.error('Failed to bulk delete assets.', { id: toastId });
    }
  };

  const handleCreateTemplateProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tmplName.trim()) {
      toast.error("Please enter a project title.");
      return;
    }
    const toastId = toast.loading(`Initializing ${tmplType} project from template...`);
    try {
      await createProject(
        tmplName,
        tmplNiche || "General",
        tmplAudience || "General Audience",
        tmplType
      );
      toast.success(`Successfully initialized "${tmplName}" with ${tmplType} template stages! 🚀`, { id: toastId });
      setIsCreatingTemplate(false);
      setTmplName("");
      setTmplNiche("");
      setTmplAudience("");
    } catch (err) {
      toast.error("Failed to create project from template.", { id: toastId });
    }
  };

  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [activitySearch, setActivitySearch] = useState("");
  const [activityTypeFilter, setActivityTypeFilter] = useState("All");
  const [showQuickActions, setShowQuickActions] = useState(false);

  const topHistoryRecommendation = useMemo(() => {
    if (!activities || activities.length === 0) {
      return { 
        recommendation: "Draft Script Screenplay", 
        detail: "Start drafting creative dialogues for active campaigns", 
        tool: ToolType.SCRIPT 
      };
    }
    const counts = {
      script: activities.filter(a => a.type === 'script').length,
      thumbnail: activities.filter(a => a.type === 'thumbnail').length,
      seo: activities.filter(a => a.type === 'seo').length,
      video: activities.filter(a => a.type === 'video').length,
      ideas: activities.filter(a => a.type === 'ideas').length,
    };
    
    // Find highest category count
    let topKey = 'script';
    let maxVal = counts.script;
    if (counts.thumbnail > maxVal) { topKey = 'thumbnail'; maxVal = counts.thumbnail; }
    if (counts.seo > maxVal) { topKey = 'seo'; maxVal = counts.seo; }
    if (counts.video > maxVal) { topKey = 'video'; maxVal = counts.video; }
    if (counts.ideas > maxVal) { topKey = 'ideas'; maxVal = counts.ideas; }

    if (topKey === 'seo') {
      return { 
        recommendation: "SEO Tags Optimizer", 
        detail: "Audit competitive keyword weightings based on search history", 
        tool: ToolType.SEO 
      };
    } else if (topKey === 'thumbnail') {
      return { 
        recommendation: "Thumbnail Design Core", 
        detail: "Review and rate high-CTR thumbnail assets", 
        tool: ToolType.THUMBNAIL 
      };
    } else if (topKey === 'video') {
      return { 
        recommendation: "Veo Video Synthesis", 
        detail: "Synthesize high fidelity cinematic scenes now", 
        tool: ToolType.VIDEO_GENERATOR 
      };
    } else if (topKey === 'ideas') {
      return { 
        recommendation: "Viral Conception Hub", 
        detail: "Brainstorm fresh high-engagement content concepts", 
        tool: ToolType.IDEAS 
      };
    }
    return { 
      recommendation: "Draft Script Screenplay", 
      detail: "Begin dialing standard dialogue scripts using core templates", 
      tool: ToolType.SCRIPT 
    };
  }, [activities]);

  const toolStats = useMemo(() => {
    if (!activities || activities.length === 0) return [];
    const counts: Record<string, { count: number; type: string; lastUsed: number }> = {};
    activities.forEach(act => {
      const toolName = act.tool || 'General';
      if (!counts[toolName]) {
        counts[toolName] = { count: 0, type: act.type || 'general', lastUsed: act.timestamp || 0 };
      }
      counts[toolName].count++;
      if (act.timestamp && act.timestamp > counts[toolName].lastUsed) {
        counts[toolName].lastUsed = act.timestamp;
      }
    });

    const total = Object.values(counts).reduce((acc, curr) => acc + curr.count, 0);

    return Object.entries(counts)
      .map(([tool, data]) => ({
        tool,
        count: data.count,
        type: data.type,
        percentage: total > 0 ? Math.round((data.count / total) * 100) : 0,
        lastUsed: data.lastUsed
      }))
      .sort((a, b) => b.count - a.count || b.lastUsed - a.lastUsed);
  }, [activities]);

  const filteredActivities = useMemo(() => {
    return activities.filter((act) => {
      const matchesSearch = act.action?.toLowerCase().includes(activitySearch.toLowerCase()) ||
                            act.tool?.toLowerCase().includes(activitySearch.toLowerCase());
      if (activityTypeFilter === "All") return matchesSearch;
      if (activityTypeFilter === "Ideas" && act.type === "ideas") return matchesSearch;
      if (activityTypeFilter === "Scripts" && act.type === "script") return matchesSearch;
      if (activityTypeFilter === "Thumbnails" && act.type === "thumbnail") return matchesSearch;
      if (activityTypeFilter === "SEO" && act.type === "seo") return matchesSearch;
      if (activityTypeFilter === "Check-ins" && act.type === "checkin") return matchesSearch;
      if (activityTypeFilter === "Videos" && act.type === "video") return matchesSearch;
      if (activityTypeFilter === "Shorts" && act.type === "shorts") return matchesSearch;
      if (activityTypeFilter === "Agent" && act.type === "agent") return matchesSearch;
      if (activityTypeFilter === "System" && act.type === "system") return matchesSearch;
      return matchesSearch;
    });
  }, [activities, activitySearch, activityTypeFilter]);

  const [quickViewType, setQuickViewType] = useState<'script' | 'thumbnail' | 'voice' | null>(null);
  const [showKeyboardShortcuts, setShowKeyboardShortcuts] = useState(false);
  const [tagging, setTagging] = useState(false);
  const [carouselIndex, setCarouselIndex] = useState(0);

  useEffect(() => {
    const handleKeydown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (
        target &&
        (target.tagName === 'INPUT' ||
          target.tagName === 'TEXTAREA' ||
          target.isContentEditable)
      ) {
        return;
      }

      if (e.key === '?') {
        e.preventDefault();
        setShowKeyboardShortcuts(prev => !prev);
      }
    };

    window.addEventListener('keydown', handleKeydown);
    return () => window.removeEventListener('keydown', handleKeydown);
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      setCarouselIndex((prev) => (prev + 1) % CAROUSEL_DRAFTS.length);
    }, 4000);
    return () => clearInterval(interval);
  }, []);
  const [checkIn, setCheckIn] = useState(() => {
    try {
      const saved = localStorage.getItem('ranktica_check_in_metrics');
      if (saved) return JSON.parse(saved);
    } catch {}
    return { streak: 5, goal: 3, progress: 1, lastCheckIn: '' };
  });

  const [activePlatform, setActivePlatform] = useState<'all' | 'youtube' | 'tiktok' | 'instagram'>('all');
  const [activePlatformMetric, setActivePlatformMetric] = useState<'views' | 'subs' | 'ctr' | 'watchTime'>('views');
  const [channelStats, setChannelStats] = useState<PlatformStats>(() => {
    try {
      const saved = localStorage.getItem('ranktica_channel_stats');
      if (saved) return JSON.parse(saved);
    } catch {}
    return DEFAULT_CHANNEL_STATS;
  });
  const [isEditingStats, setIsEditingStats] = useState(false);
  const [editForm, setEditForm] = useState<PlatformStats>(() => channelStats);
  const [isSyncingStats, setIsSyncingStats] = useState(false);

  const handleSyncStats = () => {
    setIsSyncingStats(true);
    const tid = toast.loading("Syncing real-time feed API indexes from connected channels...");
    
    setTimeout(() => {
      const updated = {
        youtube: {
          ...channelStats.youtube,
          views: channelStats.youtube.views + Math.floor(Math.random() * 120) + 30,
          subs: channelStats.youtube.subs + Math.floor(Math.random() * 6) + 1,
          ctr: Math.min(15, parseFloat((channelStats.youtube.ctr + (Math.random() * 0.4 - 0.2)).toFixed(1))),
          viewsChange: parseFloat((channelStats.youtube.viewsChange + (Math.random() * 1.5 - 0.7)).toFixed(1)),
          watchTime: channelStats.youtube.watchTime + Math.floor(Math.random() * 5),
          watchTimeChange: parseFloat((channelStats.youtube.watchTimeChange + (Math.random() * 0.8 - 0.4)).toFixed(1))
        },
        tiktok: {
          ...channelStats.tiktok,
          views: channelStats.tiktok.views + Math.floor(Math.random() * 450) + 100,
          subs: channelStats.tiktok.subs + Math.floor(Math.random() * 25) + 5,
          ctr: Math.min(10, parseFloat((channelStats.tiktok.ctr + (Math.random() * 0.2 - 0.1)).toFixed(1))),
          viewsChange: parseFloat((channelStats.tiktok.viewsChange + (Math.random() * 2.0 - 0.6)).toFixed(1)),
          watchTime: channelStats.tiktok.watchTime + Math.floor(Math.random() * 3),
          watchTimeChange: parseFloat((channelStats.tiktok.watchTimeChange + (Math.random() * 0.5 - 0.25)).toFixed(1))
        },
        instagram: {
          ...channelStats.instagram,
          views: channelStats.instagram.views + Math.floor(Math.random() * 180) + 40,
          subs: channelStats.instagram.subs + Math.floor(Math.random() * 12) + 2,
          ctr: Math.min(12, parseFloat((channelStats.instagram.ctr + (Math.random() * 0.3 - 0.15)).toFixed(1))),
          viewsChange: parseFloat((channelStats.instagram.viewsChange + (Math.random() * 1.2 - 0.5)).toFixed(1)),
          watchTime: channelStats.instagram.watchTime + Math.floor(Math.random() * 2),
          watchTimeChange: parseFloat((channelStats.instagram.watchTimeChange + (Math.random() * 0.3 - 0.15)).toFixed(1))
        }
      };
      
      setChannelStats(updated);
      setEditForm(updated);
      localStorage.setItem('ranktica_channel_stats', JSON.stringify(updated));
      setIsSyncingStats(false);
      
      toast.success("All connected channel analytics dynamically updated with live metrics! 📈", { id: tid });
      logActivity("Inbound real-time channel statistics synchronized", "Creator Command", "seo");
    }, 1500);
  };

  const handleSaveEditStats = (e: React.FormEvent) => {
    e.preventDefault();
    setChannelStats(editForm);
    localStorage.setItem('ranktica_channel_stats', JSON.stringify(editForm));
    setIsEditingStats(false);
    toast.success("Channel operational metrics updated successfully.");
    logActivity("Configured custom channel workspace baseline metrics", "Creator Command", "seo");
  };

  const currentStats = useMemo(() => {
    if (activePlatform === 'all') {
      const youtube = channelStats.youtube;
      const tiktok = channelStats.tiktok;
      const instagram = channelStats.instagram;
      
      return {
        views: youtube.views + tiktok.views + instagram.views,
        viewsChange: parseFloat(((youtube.viewsChange + tiktok.viewsChange + instagram.viewsChange) / 3).toFixed(1)),
        subs: youtube.subs + tiktok.subs + instagram.subs,
        subsChange: parseFloat(((youtube.subsChange + tiktok.subsChange + instagram.subsChange) / 3).toFixed(1)),
        ctr: parseFloat(((youtube.ctr + tiktok.ctr + instagram.ctr) / 3).toFixed(1)),
        ctrChange: parseFloat(((youtube.ctrChange + tiktok.ctrChange + instagram.ctrChange) / 3).toFixed(1)),
        watchTime: youtube.watchTime + tiktok.watchTime + instagram.watchTime,
        watchTimeChange: parseFloat(((youtube.watchTimeChange + tiktok.watchTimeChange + instagram.watchTimeChange) / 3).toFixed(1))
      };
    }
    return channelStats[activePlatform];
  }, [channelStats, activePlatform]);

  const platformTrendData = useMemo(() => {
    const baseVal = currentStats[activePlatformMetric];
    const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    return days.map((day, idx) => {
      let multiplier = 0.8 + (idx * 0.03) + (Math.sin(idx) * 0.05);
      if (idx === 6) multiplier = 1.0;
      return {
        day,
        value: activePlatformMetric === 'ctr' 
          ? parseFloat((baseVal * multiplier).toFixed(1))
          : Math.round(baseVal * multiplier)
      };
    });
  }, [currentStats, activePlatformMetric]);

  const aiGrowthAdvice = useMemo(() => {
    switch (activePlatform) {
      case 'youtube':
        return {
          title: "Optimize YouTube Hook Structure",
          advice: `Your YouTube average click-through rate (CTR) is at a strong ${currentStats.ctr}%. However, overall watch-time has dropped by ${Math.abs(currentStats.watchTimeChange)}% recently. We highly recommend using the full AI Script Generator to formulate a 'Pattern Interrupt' hook within the first 10 seconds of your next video.`,
          actionLabel: "Launch Script Writer",
          actionTool: ToolType.SCRIPT
        };
      case 'tiktok':
        return {
          title: "Double Down on Paced Storytelling",
          advice: `TikTok views are peaking at a stunning ${currentStats.views.toLocaleString()} daily impressions (up ${currentStats.viewsChange}%). TikTok's algorithmic distribution engine favors fast-moving visual narrative overlays. Use our Cinematic Clapperboard to render and sync high-retention short vertical assets to keep this momentum.`,
          actionLabel: "Generate AI Video",
          actionTool: ToolType.VIDEO_GENERATOR
        };
      case 'instagram':
        return {
          title: "Scale Local Lead Conversion",
          advice: `Your Instagram audience metrics increased by +${currentStats.subs} followers today. Your profile visits are converting well! Setup outbound social sequencers to automatically send the latest automated project summary PDF to any new user that interacts on your channel feed.`,
          actionLabel: "Open Outreach Hub",
          actionTool: ToolType.OUTREACH
        };
      default:
        return {
          title: "Activate Omnichannel Recycling",
          advice: `Total combined impressions have scaled to ${currentStats.views.toLocaleString()} daily views! Your visual designs are converting well. Leverage our 14-Step Core pipeline to recycle your top-performing horizontal video into vertical Instagram Reels and blog posts to secure a massive organic search index.`,
          actionLabel: "Review 14-Step Core",
          actionTool: ToolType.WORKFLOW
        };
    }
  }, [activePlatform, currentStats]);

  // Auto tag on load if tags are empty and activeProject exists
  useEffect(() => {
    let active = true;
    const autoTag = async () => {
      if (activeProject && !activeProject.assets?.tags && !tagging) {
        setTagging(true);
        try {
          const { classifyAssetTags } = await import('@/infrastructure/gemini');
          const scriptStr = activeProject.assets?.script ? String(activeProject.assets.script) : '';
          const tags = await classifyAssetTags(activeProject.title, activeProject.niche, scriptStr);
          if (active) {
            await updateActiveProject({
              assets: {
                ...activeProject.assets,
                tags: tags
              }
            });
            toast.success(`Gemini classified as: ${tags.join(', ')} 🏷️`, { id: 'auto-tag-toast' });
          }
        } catch (err) {
          console.warn('[AutoTag] failed:', err);
        } finally {
          if (active) setTagging(false);
        }
      }
    };
    autoTag();
    return () => { active = false; };
  }, [activeProject, updateActiveProject]);

  const handleTriggerRecategorize = async () => {
    if (!activeProject) return;
    setTagging(true);
    const tid = toast.loading("Invoking Gemini classifier...");
    try {
      const { classifyAssetTags } = await import('@/infrastructure/gemini');
      const scriptStr = activeProject.assets?.script ? String(activeProject.assets.script) : '';
      const tags = await classifyAssetTags(activeProject.title, activeProject.niche, scriptStr);
      await updateActiveProject({
        assets: {
          ...activeProject.assets,
          tags: tags
        }
      });
      toast.success(`Project freshly tagged: ${tags.join(', ')}`, { id: tid });
    } catch (err: any) {
      toast.error(`Tagging failed: ${err.message || String(err)}`, { id: tid });
    } finally {
      setTagging(false);
    }
  };

  const stats = user?.stats || { 
    ideasGenerated: 0, 
    scriptsWritten: 0, 
    thumbnailsCreated: 0, 
    seoOptimized: 0, 
    marketingPlans: 0 
  };

  useEffect(() => {
    setActivities(getActivities());
  }, []);

  const handleCheckIn = () => {
    const todayStr = new Date().toDateString();
    if (checkIn.lastCheckIn === todayStr) {
      toast('You already checked in today! Keep up the brilliant creation work.', { icon: 'ℹ️' });
      return;
    }
    
    const newProgress = Math.min(checkIn.goal, checkIn.progress + 1);
    const hasMetGoal = newProgress === checkIn.goal;
    const newStreak = checkIn.streak + 1;
    
    const updated = {
      ...checkIn,
      progress: newProgress,
      streak: newStreak,
      lastCheckIn: todayStr
    };
    
    setCheckIn(updated);
    localStorage.setItem('ranktica_check_in_metrics', JSON.stringify(updated));
    
    toast.success(`Check-In Successful! extended your hot streak to ${newStreak} days! 🔥`);
    if (hasMetGoal) {
      toast.success('Congratulations! Daily creator video output target fully realized today! 🏆', { duration: 5000 });
    }
    
    logActivity("Completed Daily Creative Check-In & advanced streak", "Creator Command", "checkin");
    setActivities(getActivities());
  };

  const handleExportReport = () => {
    const activeProjTitle = activeProject ? activeProject.title : "None (No ongoing project)";
    const activeProjNiche = activeProject ? activeProject.niche : "None";
    const activeProjAudience = activeProject ? activeProject.audience : "None";
    const activeProjStatus = activeProject ? activeProject.status : "N/A";
    const scriptStatus = activeProject?.assets?.script ? "Drafted & Saved" : "Not started";
    const videoStatus = activeProject?.assets?.videoUri ? "Rendered & Saved" : "Not started";
    const thumbnailStatus = activeProject?.assets?.thumbnail ? "Generated & Saved" : "Not started";
    const voiceStatus = activeProject?.assets?.video ? "Synthesized & Saved" : "Not started";

    const reportMarkdown = `# RANKTICA AI — SESSION & PRODUCTIVITY SUMMARY
Generated At: ${new Date().toLocaleString()}
User: ${user?.name || 'Creative Partner'} (${user?.email || 'joinranktica@gmail.com'})

=========================================

1. CREATOR WORKSPACE METRICS
-----------------------------------------
- Daily Check-In Streak: ${checkIn.streak} days
- Daily Goal Progress: ${checkIn.progress} / ${checkIn.goal} activities completed
- Viral Ideas Processed: ${stats.ideasGenerated}
- Production Scripts Drafted: ${stats.scriptsWritten}
- Thumbnails Synthesized: ${stats.thumbnailsCreated}
- SEO Optimization Logs: ${stats.seoOptimized}
- Omnichannel Marketing Campaigns: ${stats.marketingPlans}

2. ACTIVE PROJECT PROFILE
-----------------------------------------
- Title: ${activeProjTitle}
- Niche Focus: ${activeProjNiche}
- Target Audience: ${activeProjAudience}
- General Status: ${activeProjStatus}

ASSET INVENTORY:
- Screenplay Script: [${scriptStatus}]
- Cloned Voice Stream: [${voiceStatus}]
- Veo Studio Video Rendering: [${videoStatus}]
- High-CTR Thumbnail Design: [${thumbnailStatus}]

3. SYSTEM LOGS & TELEMETRY
-----------------------------------------
${activities.map((act) => `[${act.time || 'Logged'}] ${act.tool}: ${act.action}`).join('\n')}

=========================================
Ranktica AI • Intelligent Omnichannel Creator Workspace
`;

    const blob = new Blob([reportMarkdown], { type: 'text/markdown;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `ranktica-creative-report-${Date.now()}.md`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    toast.success("Summary report downloaded successfully! 📝", { id: 'report-download-success' });
    logActivity("Exported current session metrics and project status to summary report", "Creator Command", "checkin");
    setActivities(getActivities());
  };

  const handleExportPDF = () => {
    try {
      const doc = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });

      const pageWidth = doc.internal.pageSize.width;
      const pageHeight = doc.internal.pageSize.height;
      const margin = 20;
      const contentWidth = pageWidth - 2 * margin;
      let y = 18;

      const checkPageBreak = (heightNeeded: number) => {
        if (y + heightNeeded > pageHeight - margin) {
          doc.addPage();
          y = 18;
          // Continued Page Header
          doc.setFont('helvetica', 'normal');
          doc.setFontSize(8);
          doc.setTextColor(148, 163, 184);
          doc.text("Ranktica AI — Project Status Report (Continued)", margin, y - 5);
          doc.setDrawColor(241, 245, 249);
          doc.line(margin, y - 3, pageWidth - margin, y - 3);
        }
      };

      const drawSectionHeader = (title: string) => {
        checkPageBreak(15);
        doc.setFillColor(248, 250, 252);
        doc.setDrawColor(241, 245, 249);
        doc.roundedRect(margin, y, contentWidth, 8, 1, 1, 'FD');
        
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(9.5);
        doc.setTextColor(15, 23, 42);
        doc.text(title.toUpperCase(), margin + 3.5, y + 5.5);
        y += 12;
      };

      const drawKeyValueRow = (key: string, value: string) => {
        checkPageBreak(6);
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(8.5);
        doc.setTextColor(71, 85, 105);
        doc.text(key, margin + 4, y);
        
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(8.5);
        doc.setTextColor(15, 23, 42);
        const splitValue = doc.splitTextToSize(value, contentWidth - 52);
        doc.text(splitValue, margin + 48, y);
        y += (splitValue.length * 4) + 1.5;
      };

      const drawBulletPoint = (text: string) => {
        checkPageBreak(5);
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(8.5);
        doc.setTextColor(51, 65, 85);
        doc.text("•", margin + 4, y);
        const splitText = doc.splitTextToSize(text, contentWidth - 10);
        doc.text(splitText, margin + 8, y);
        y += (splitText.length * 4) + 1.5;
      };

      // Header Block
      doc.setFillColor(15, 23, 42);
      doc.rect(margin, y, contentWidth, 24, 'F');
      
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(14);
      doc.setTextColor(255, 255, 255);
      doc.text("RANKTICA AI  |  CREATIVE STUDIO STATUS REPORT", margin + 6, y + 10);
      
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8.5);
      doc.setTextColor(148, 163, 184);
      doc.text(`GENERATED ON: ${new Date().toLocaleString()}  |  OPERATOR: ${user?.name || 'Creative Partner'}`, margin + 6, y + 17);
      y += 32;

      // 1. PROJECT METADATA (IF PRESENT)
      if (activeProject) {
        drawSectionHeader("Active Project Configuration");
        drawKeyValueRow("Project Title", activeProject.title);
        drawKeyValueRow("Niche Target", activeProject.niche);
        drawKeyValueRow("Target Audience", activeProject.audience || "Not specified");
        drawKeyValueRow("Current Status", activeProject.status ? activeProject.status.toUpperCase() : "IDEA");
        
        const tagsString = activeProject.assets?.tags && activeProject.assets.tags.length > 0 
          ? activeProject.assets.tags.join(", ") 
          : "No tags assigned";
        drawKeyValueRow("Niche Classification", tagsString);
        y += 4;

        drawSectionHeader("Asset Pipeline Inventory");
        const scriptStatus = activeProject.assets?.script 
          ? `Drafted & Saved (${activeProject.assets.script.length} characters)` 
          : "Not started";
        drawKeyValueRow("Screenplay Script", scriptStatus);

        const voiceStatus = activeProject.assets?.video 
          ? "Synthesized & Cloned Voice Stream Saved" 
          : "Not started";
        drawKeyValueRow("Voice Synthesis", voiceStatus);

        const videoStatus = activeProject.assets?.videoUri 
          ? `Veo Render Completed (${activeProject.assets.videoUri.substring(0, 50)}...)` 
          : "Not started";
        drawKeyValueRow("Video Rendering", videoStatus);

        const thumbnailStatus = activeProject.assets?.thumbnail 
          ? "Thumbnail Image Generated & Saved" 
          : "Not started";
        drawKeyValueRow("Thumbnail CTR Design", thumbnailStatus);
        y += 4;
      } else {
        drawSectionHeader("Active Project Status");
        checkPageBreak(12);
        doc.setFont('helvetica', 'italic');
        doc.setFontSize(9);
        doc.setTextColor(100, 116, 139);
        doc.text("No active project currently designated in your creative workspace.", margin + 4, y);
        y += 10;
      }

      // 2. CREATIVE WORKSPACE METRICS
      drawSectionHeader("Creator Workspace Performance Metrics");
      drawKeyValueRow("Daily Check-In Streak", `${checkIn.streak} Days`);
      drawKeyValueRow("Daily Goal Progress", `${checkIn.progress} / ${checkIn.goal} Creative Objectives Completed`);
      drawKeyValueRow("Viral Ideas Formulated", String(stats.ideasGenerated));
      drawKeyValueRow("Production Scripts Drafted", String(stats.scriptsWritten));
      drawKeyValueRow("Thumbnails Synthesized", String(stats.thumbnailsCreated));
      drawKeyValueRow("SEO Authority Audits", String(stats.seoOptimized));
      drawKeyValueRow("Marketing Distribution Plans", String(stats.marketingPlans));
      y += 4;

      // 2.5 WORKSPACE AI DATA USAGE & GOVERNANCE POLICY
      drawSectionHeader("Workspace AI Data Usage & Governance Policy");
      const activeProjectCost = activeProject?.id ? localStorage.getItem(`ranktica_project_cost_${activeProject.id}`) || "$0.0245" : "$0.0000";
      drawKeyValueRow("Estimated Project Cost", activeProjectCost);
      drawKeyValueRow("Multi-Tenant Token Limit", "1,000,000 Tokens / project");
      drawKeyValueRow("Zero-Escalation Safeguard Policy", "70% Warn / 90% Route / 100% Block");
      y += 4;

      // 3. SYSTEM ACTIVITY LOGS (LAST 8 ACTIONS)
      if (activities && activities.length > 0) {
        drawSectionHeader("Recent Workspace Telemetry & Activity Logs");
        const sortedActivities = [...activities].slice(0, 8);

        sortedActivities.forEach((act) => {
          const logText = `[${act.time || 'Logged'}] ${act.tool.toUpperCase()}: ${act.action}`;
          drawBulletPoint(logText);
        });
        y += 4;
      }

      // Footer signature
      checkPageBreak(15);
      y += 5;
      doc.setDrawColor(226, 232, 240);
      doc.line(margin, y, pageWidth - margin, y);
      y += 5;

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      doc.setTextColor(148, 163, 184);
      doc.text("Ranktica AI • Intelligent Omnichannel Creator Workspace System", margin, y);
      doc.text("Page 1 of 1", pageWidth - margin - 15, y);

      // Save PDF
      const safeTitle = activeProject 
        ? activeProject.title.toLowerCase().replace(/[^a-z0-9]+/g, "-") 
        : "workspace";
      doc.save(`ranktica-status-report-${safeTitle}-${Date.now()}.pdf`);

      toast.success("Printable PDF report generated & downloaded successfully! 📄", { id: 'pdf-download-success' });
      logActivity("Exported current project status to printable PDF report", "Creator Command", "checkin");
      setActivities(getActivities());
    } catch (error) {
      console.error("PDF generation failed:", error);
      toast.error("Failed to generate PDF report. Please try again.");
    }
  };

  const handleExportProject = () => {
    if (!activeProject) {
      toast.error("No active project selected to export! Please select or create a project first.", { id: 'export-proj-error' });
      return;
    }

    const projectJson = JSON.stringify(activeProject, null, 2);
    const blob = new Blob([projectJson], { type: 'application/json;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    
    const safeTitle = activeProject.title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)+/g, '');
      
    link.setAttribute("download", `ranktica-project-${safeTitle || 'export'}-${Date.now()}.json`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    toast.success(`Project "${activeProject.title}" configuration exported! 📂`, { id: 'export-proj-success' });
    logActivity(`Exported project "${activeProject.title}" configuration to JSON`, "Creator Command", "system");
    setActivities(getActivities());
  };

  // --- Pomodoro Deep Work Timer states ---
  const [pomoMode, setPomoMode] = useState<'focus' | 'short' | 'long'>('focus');
  const [pomoTimeLeft, setPomoTimeLeft] = useState<number>(25 * 60);
  const [pomoIsRunning, setPomoIsRunning] = useState<boolean>(false);
  const [pomoSecondsTotal, setPomoSecondsTotal] = useState<number>(0);
  const pomoTimerRef = useRef<any>(null);

  // Sound playbacks and synthesis guides
  const playPomoChime = (type: 'tick' | 'complete' | 'reminder') => {
    try {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioContextClass) return;
      const ctx = new AudioContextClass();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      
      if (type === 'tick') {
        osc.frequency.setValueAtTime(900, ctx.currentTime);
        gain.gain.setValueAtTime(0.005, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.00001, ctx.currentTime + 0.05);
        osc.start();
        osc.stop(ctx.currentTime + 0.05);
      } else if (type === 'reminder') {
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(587.33, ctx.currentTime); // D5
        gain.gain.setValueAtTime(0.0, ctx.currentTime);
        gain.gain.linearRampToValueAtTime(0.04, ctx.currentTime + 0.1);
        gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.6);
        osc.start();
        osc.stop(ctx.currentTime + 0.6);
      } else {
        osc.type = 'sine';
        osc.frequency.setValueAtTime(523.25, ctx.currentTime); // C5
        osc.frequency.setValueAtTime(659.25, ctx.currentTime + 0.12); // E5
        osc.frequency.setValueAtTime(783.99, ctx.currentTime + 0.24); // G5
        osc.frequency.setValueAtTime(1046.50, ctx.currentTime + 0.36); // C6
        gain.gain.setValueAtTime(0.0, ctx.currentTime);
        gain.gain.linearRampToValueAtTime(0.08, ctx.currentTime + 0.1);
        gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 1.0);
        osc.start();
        osc.stop(ctx.currentTime + 1.0);
      }
    } catch (e) {
      console.warn("Audio Context blocked:", e);
    }
  };

  const getPomoModesDetails = () => {
    switch(pomoMode) {
      case 'focus': return { time: 25 * 60, label: 'Deep Work Focus' };
      case 'short': return { time: 5 * 60, label: 'Short Break' };
      case 'long': return { time: 15 * 60, label: 'Long Break' };
    }
  };

  const setPomoModeAndReset = (mode: 'focus' | 'short' | 'long') => {
    setPomoIsRunning(false);
    if (pomoTimerRef.current) {
      clearInterval(pomoTimerRef.current);
      pomoTimerRef.current = null;
    }
    setPomoMode(mode);
    let seconds = 25 * 60;
    if (mode === 'short') seconds = 5 * 60;
    if (mode === 'long') seconds = 15 * 60;
    setPomoTimeLeft(seconds);
    setPomoSecondsTotal(0);
    toast.success(`Switched mode to ${mode === 'focus' ? 'Deep Work Focus' : mode === 'short' ? 'Short Break' : 'Long Break'} ⏱️`);
  };

  // Focus Reminders list
  const FOCUS_REMINDERS = [
    "Pacing is king. Focus on making the first 3 seconds of your scripts completely undeniable.",
    "Eliminate trailing words and filler syllables to hold absolute audience attention.",
    "A gorgeous high-CTR thumbnail pattern interrupt is the gateway to your work.",
    "Keep pushing! Your target audience is waiting for this high-velocity delivery. You are doing amazing. ⚡",
    "Pacing is the soul of vertical content. Ensure your scripts are direct and punchy."
  ];

  // Tick effect
  useEffect(() => {
    if (pomoIsRunning) {
      pomoTimerRef.current = setInterval(() => {
        setPomoTimeLeft((prev) => {
          if (prev <= 1) {
            // Completed!
            setPomoIsRunning(false);
            if (pomoTimerRef.current) clearInterval(pomoTimerRef.current);
            playPomoChime('complete');
            
            if (pomoMode === 'focus') {
              // Log the successful creative sprint to the activity heat map
              const activeProjTitle = activeProject ? `on project "${activeProject.title}"` : 'on creator ideas';
              const actionStr = `Completed 25-minute Pomodoro Deep Work Focus session ${activeProjTitle} ⚡`;
              logActivity(actionStr, "Focus Studio", "pomodoro");
              setActivities(getActivities());
              toast.success("Incredible focus! Detailed sprint logged to your Contribution Hotmap! 🔥", { duration: 6000 });
            } else {
              toast.success("Break complete! Ready to lock back into Deep Work?");
            }
            return 0;
          }
          
          const currentElapsed = getPomoModesDetails().time - (prev - 1);
          setPomoSecondsTotal(currentElapsed);

          // Periodic Reminders every 5 minutes (300 seconds)
          if (currentElapsed > 0 && currentElapsed % 300 === 0) {
            playPomoChime('reminder');
            const randomReminder = FOCUS_REMINDERS[Math.floor(Math.random() * FOCUS_REMINDERS.length)];
            toast('Focus Reminder: ' + randomReminder, {
              icon: '🧠',
              duration: 5000
            });
          }
          
          return prev - 1;
        });
      }, 1000);
    } else {
      if (pomoTimerRef.current) {
        clearInterval(pomoTimerRef.current);
        pomoTimerRef.current = null;
      }
    }
    
    return () => {
      if (pomoTimerRef.current) {
        clearInterval(pomoTimerRef.current);
      }
    };
  }, [pomoIsRunning, pomoMode, activeProject]);

  const activityData = [
    { day: 'Mon', count: 4 },
    { day: 'Tue', count: 7 },
    { day: 'Wed', count: 5 },
    { day: 'Thu', count: 12 },
    { day: 'Fri', count: 9 },
    { day: 'Sat', count: 15 },
    { day: 'Sun', count: 11 },
  ];

  // Helper to map type to icons
  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'ideas':
        return <Lightbulb size={16} className="text-yellow-400" />;
      case 'thumbnail':
        return <ImageIcon size={16} className="text-orange-500" />;
      case 'seo':
        return <Search size={16} className="text-green-400" />;
      case 'script':
        return <FileText size={16} className="text-blue-400" />;
      case 'checkin':
        return <Flame size={16} className="text-red-500" />;
      default:
        return <Sparkles size={16} className="text-orange-500" />;
    }
  };

  const daysOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const todayIndex = new Date().getDay();
  const checkedInToday = checkIn.lastCheckIn === new Date().toDateString();

  // --- Interactive Production Lab Mode Renderer ---
  const renderInteractiveLab = () => {
    if (labStep === 0) {
      return (
        <div className="bg-gradient-to-r from-red-950/40 via-purple-950/20 to-zinc-950 border border-red-500/20 rounded-2xl p-6 flex flex-col md:flex-row md:items-center justify-between gap-6 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-red-600/10 rounded-full blur-2xl"></div>
          <div className="space-y-2 relative z-10">
            <div className="flex items-center gap-2">
              <span className="bg-red-500/10 border border-red-500/30 text-red-400 text-[9px] font-black uppercase tracking-widest px-2.5 py-0.5 rounded-full">
                🧪 Guided Scenario Simulation
              </span>
              <span className="text-[10px] text-zinc-500 font-mono">Real-time guided workflow</span>
            </div>
            <h3 className="text-xl font-black text-white tracking-tight">Interactive production <span className="text-red-500">LAB MODE</span></h3>
            <p className="text-zinc-400 text-xs max-w-2xl leading-relaxed">
              Unlock a real-time scenario simulation that guides you step-by-step through our existing tool suite to formulate, write, narrate, and render a complete YouTube video with contextual highlights.
            </p>
          </div>
          <button
            onClick={() => {
              setLabStep(1);
              setLabSelectedIdea('');
              setLabScriptText('');
              setLabVideoPrompt('');
              setLabProgressPercent(0);
              toast.success("Welcome to the Interactive Video Synthesis Lab! Follow the step-by-step guide.");
            }}
            className="relative z-10 shrink-0 px-6 py-3 bg-red-600 hover:bg-red-500 text-white rounded-xl text-xs font-black uppercase tracking-wider transition-all active-press shadow-lg shadow-red-950/50 cursor-pointer"
          >
            Launch Guided Lab Scenario →
          </button>
        </div>
      );
    }

    const stepsList = [
      { id: 1, name: 'Idea Discovery' },
      { id: 2, name: 'Screenplay Script' },
      { id: 3, name: 'Neural Audio' },
      { id: 4, name: 'Thumbnail Design' },
      { id: 5, name: 'Veo Video Render' }
    ];

    return (
      <div className="bg-zinc-950 border border-zinc-800 rounded-3xl p-6 space-y-6 relative overflow-hidden shadow-2xl">
        <div className="absolute top-0 left-0 w-2 h-full bg-red-600"></div>
        
        {/* Step progress header bar */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-zinc-900 pb-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 bg-red-950 text-red-500 border border-red-900 rounded text-[9px] font-black uppercase tracking-wider animate-pulse">
                ACTIVE LAB SESSION
              </span>
              <span className="text-xs text-zinc-500 font-mono">Step {labStep} of 5</span>
            </div>
            <h3 className="text-lg font-black text-white">Scenario: "From High-CTR Idea to Veo Rendered Production"</h3>
          </div>
          <button
            onClick={() => {
              setLabStep(0);
              toast.success("Interactive production lab simulation session saved.");
            }}
            className="px-3 py-1.5 bg-zinc-900 border border-zinc-850 hover:bg-zinc-850 text-zinc-400 hover:text-white rounded-xl text-[10px] uppercase font-bold tracking-wider transition-all"
          >
            Exit Lab Mode
          </button>
        </div>

        {/* Stepper visual status dots */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-2 pb-4 border-b border-zinc-900/50">
          {stepsList.map((st) => {
            const isCompleted = labStep > st.id;
            const isActive = labStep === st.id;
            return (
              <div 
                key={st.id} 
                className={`p-3 rounded-xl border transition-all flex flex-col ${
                  isActive 
                    ? 'bg-zinc-900 border-red-500/40 text-white shadow-md shadow-red-950/10 font-black' 
                    : isCompleted 
                      ? 'bg-zinc-950 border-emerald-900/40 text-emerald-500' 
                      : 'bg-zinc-950/40 border-zinc-900 text-zinc-600'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-mono font-bold uppercase tracking-wider">Step {st.id}</span>
                  {isCompleted && <span className="text-[10px] font-black">✓</span>}
                  {isActive && <span className="w-1.5 h-1.5 bg-red-500 rounded-full animate-ping" />}
                </div>
                <span className="text-xs mt-1 leading-snug">{st.name}</span>
              </div>
            );
          })}
        </div>

        {/* Dynamic content rendering based on active step */}
        <div className="space-y-4">
          {labStep === 1 && (
            <div className="space-y-4 animate-fade-in">
              <div className="bg-zinc-900/30 border border-zinc-900 rounded-2xl p-4">
                <h4 className="text-sm font-bold text-white flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse"></span>
                  Objective: Discover a Viral Blue-Ocean Niche Idea
                </h4>
                <p className="text-xs text-zinc-400 mt-1 leading-relaxed">
                  Select a candidate concept backed by our AI strategic planner metrics. Real-time grounding data suggests these target clusters are currently underserved by competitors.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {[
                  { idea: "The AI-Employee Revolution: Building 24/7 Outbound Agencies", niche: "AI & Tech SaaS", ctr: "9.8% CTR", score: "High Velocity" },
                  { idea: "Why Your SaaS Landing Page Conversion is Leaking Capital Today", niche: "Product Growth Hacks", ctr: "8.9% CTR", score: "Low Search Difficulty" },
                  { idea: "Inside the Blue Ocean: Scaling Content Strategy for 2026", niche: "Content Marketing Tools", ctr: "9.1% CTR", score: "Rising Query Trend" }
                ].map((item, idx) => (
                  <button
                    key={idx}
                    onClick={() => {
                      setLabSelectedIdea(item.idea);
                      toast.success(`Idea Locked in! Topic designated: "${item.idea}"`);
                    }}
                    className={`w-full text-left p-4 rounded-xl border transition-all cursor-pointer ${
                      labSelectedIdea === item.idea 
                        ? 'bg-red-950/20 border-red-500/40 text-white shadow-xl shadow-red-950/10' 
                        : 'bg-zinc-900/40 border-zinc-850 hover:bg-zinc-905 text-zinc-300'
                    }`}
                  >
                    <span className="text-[9px] bg-red-500/10 border border-red-500/20 text-red-400 px-1.5 py-0.5 rounded font-mono font-bold uppercase block w-fit mb-2">
                      {item.niche}
                    </span>
                    <h5 className="text-xs font-bold leading-snug">{item.idea}</h5>
                    <div className="flex items-center justify-between text-[10px] text-zinc-500 font-mono mt-3 pt-2 border-t border-zinc-900/50">
                      <span>CTR: <strong className="text-emerald-400">{item.ctr}</strong></span>
                      <span>{item.score}</span>
                    </div>
                  </button>
                ))}
              </div>

              {labSelectedIdea && (
                <div className="flex justify-end pt-2">
                  <button
                    onClick={() => {
                      setLabStep(2);
                      toast.success("Proceeded to Script screenplay synthesis.");
                    }}
                    className="px-5 py-2.5 bg-red-600 hover:bg-red-500 text-white font-bold text-xs uppercase tracking-wider rounded-xl transition-all active-press"
                  >
                    Unlock Step 2: Write Screenplay Outline →
                  </button>
                </div>
              )}
            </div>
          )}

          {labStep === 2 && (
            <div className="space-y-4 animate-fade-in">
              <div className="bg-zinc-900/30 border border-zinc-900 rounded-2xl p-4">
                <h4 className="text-sm font-bold text-white flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse"></span>
                  Objective: Synthesize High-Velocity Screenplay Script
                </h4>
                <p className="text-xs text-zinc-400 mt-1 leading-relaxed">
                  Draft a punchy voiceover script outline for our selected video concept: <strong className="text-white">"{labSelectedIdea}"</strong>. Keep words compact to preserve high retention rates.
                </p>
              </div>

              <div className="space-y-3">
                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      setLabScriptText(
                        `[0:00 - Pattern Interrupt] (Zoomed expression graphic) "Stop building SaaS platforms the hard way. In 2026, the elite are orchestrating autonomous, 24/7 AI employee networks to hijack competitor traffic."\n\n` +
                        `[0:15 - Core Argument] "Standard SEO is slow. Instead, we program parallel web crawler crawlers to index Blue Ocean niches and auto-generate responsive schema markup."\n\n` +
                        `[0:35 - Action Blueprint] "Step 1: Define high-velocity topic parameters. Step 2: Scale neural copywriter agents to draft authoritative outlines. Hit subscribe for the complete strategy checklist."`
                      );
                      toast.success("AI Outline synthesized beautifully!");
                    }}
                    className="px-4 py-2 bg-zinc-905 hover:bg-zinc-800 border border-zinc-850 text-zinc-300 rounded-lg text-xs font-bold uppercase transition-all flex items-center gap-2"
                  >
                    ✨ Synthesize AI Retention Script
                  </button>
                  <button
                    onClick={() => setLabScriptText('')}
                    className="px-3 py-2 bg-zinc-950 hover:bg-zinc-900 border border-zinc-900 text-zinc-500 hover:text-red-400 rounded-lg text-xs transition-all"
                  >
                    Clear Outline
                  </button>
                </div>

                <textarea
                  rows={6}
                  value={labScriptText}
                  onChange={(e) => setLabScriptText(e.target.value)}
                  placeholder="Paste or click 'Synthesize' above to auto-generate high-retention screenplay outlines..."
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-xl text-xs text-white p-3 focus:outline-none focus:border-red-500 font-mono leading-relaxed"
                />
              </div>

              {labScriptText && (
                <div className="flex justify-between items-center pt-2">
                  <span className="text-[10px] text-zinc-500 font-mono">
                    Character Count: <strong className="text-zinc-350">{labScriptText.length} characters</strong>
                  </span>
                  <button
                    onClick={() => {
                      setLabStep(3);
                      toast.success("Script locked in successfully! Proceeding to Neural Narration Synthesis.");
                    }}
                    className="px-5 py-2.5 bg-red-600 hover:bg-red-500 text-white font-bold text-xs uppercase tracking-wider rounded-xl transition-all active-press"
                  >
                    Lock-In Script & Proceed →
                  </button>
                </div>
              )}
            </div>
          )}

          {labStep === 3 && (
            <div className="space-y-4 animate-fade-in">
              <div className="bg-zinc-900/30 border border-zinc-900 rounded-2xl p-4">
                <h4 className="text-sm font-bold text-white flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse"></span>
                  Objective: Assign Elite Voice Preset & Synthesize Audio
                </h4>
                <p className="text-xs text-zinc-400 mt-1 leading-relaxed">
                  Select a pre-trained neural voice actor tailored for high-CTR educational or promotional delivery.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {[
                  { id: "zephyr", name: "Zephyr (Tech Lead)", desc: "Deep, crisp tech-oriented male speaker.", freq: "Low-mid range resonance" },
                  { id: "charon", name: "Charon (Expert Analyst)", desc: "Professional, analytical, clear female voice.", freq: "Ideal for data presentations" },
                  { id: "aura", name: "Aura (Conversion Lead)", desc: "High-energy, energetic male conversationalist.", freq: "Best for high- CTR shorts" }
                ].map((v) => (
                  <button
                    key={v.id}
                    onClick={() => {
                      setLabVoiceId(v.id);
                      // Play high-frequency synthesizer tone as diagnostic proof of live voice sampling
                      try {
                        const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
                        if (AudioContextClass) {
                          const ctx = new AudioContextClass();
                          const osc = ctx.createOscillator();
                          const gain = ctx.createGain();
                          osc.connect(gain);
                          gain.connect(ctx.destination);
                          osc.frequency.setValueAtTime(v.id === 'zephyr' ? 220 : v.id === 'charon' ? 440 : 550, ctx.currentTime);
                          gain.gain.setValueAtTime(0.01, ctx.currentTime);
                          gain.gain.exponentialRampToValueAtTime(0.00001, ctx.currentTime + 0.3);
                          osc.start();
                          osc.stop(ctx.currentTime + 0.3);
                        }
                      } catch(e) {}
                      toast.success(`Voice sample "${v.name}" cached!`);
                    }}
                    className={`w-full text-left p-4 rounded-xl border transition-all cursor-pointer ${
                      labVoiceId === v.id 
                        ? 'bg-red-950/20 border-red-500/40 text-white' 
                        : 'bg-zinc-900/40 border-zinc-850 hover:bg-zinc-905 text-zinc-300'
                    }`}
                  >
                    <h5 className="text-xs font-bold leading-none mb-1">{v.name}</h5>
                    <p className="text-[10px] text-zinc-500 mb-3">{v.desc}</p>
                    <span className="text-[9px] font-mono text-zinc-400 block border-t border-zinc-900/60 pt-2">
                      {v.freq}
                    </span>
                  </button>
                ))}
              </div>

              <div className="flex justify-between items-center pt-2">
                <span className="text-[10px] text-zinc-500 font-mono">
                  Synthesizer: <strong className="text-red-400">AudioContext Online</strong>
                </span>
                <button
                  onClick={() => {
                    setLabStep(4);
                    toast.success("Narration audio successfully generated! Proceeding to Visual Thumbnail design.");
                  }}
                  className="px-5 py-2.5 bg-red-600 hover:bg-red-500 text-white font-bold text-xs uppercase tracking-wider rounded-xl transition-all active-press"
                >
                  Synthesize Audio & Proceed →
                </button>
              </div>
            </div>
          )}

          {labStep === 4 && (
            <div className="space-y-4 animate-fade-in">
              <div className="bg-zinc-900/30 border border-zinc-900 rounded-2xl p-4">
                <h4 className="text-sm font-bold text-white flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse"></span>
                  Objective: Synthesize High-CTR Thumbnail Design
                </h4>
                <p className="text-xs text-zinc-400 mt-1 leading-relaxed">
                  Design a compelling pattern-interrupt thumbnail. AI metrics will evaluate candidate graphic CTR score in real-time.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="md:col-span-2 space-y-3">
                  <div>
                    <label className="text-[10px] font-mono font-bold uppercase text-zinc-500 block mb-1">Visual Prompt</label>
                    <input 
                      type="text" 
                      value={labThumbnailPredictedCTR}
                      onChange={(e) => setLabThumbnailPredictedCTR(e.target.value)}
                      placeholder="e.g. A dark slate grid card showing neon laser nodes mesh glow backlighting..."
                      className="w-full bg-zinc-900 border border-zinc-800 rounded-xl text-xs text-white p-3 focus:outline-none focus:border-red-500"
                    />
                  </div>
                  <button
                    onClick={() => {
                      setLabThumbnailPredictedCTR("A dark slate grid card showing neon laser nodes mesh glow backlighting with 9.2% Predicted CTR");
                      toast.success("Thumbnail Render Complete! CTR Predictor: 9.2% CTR confidence!");
                    }}
                    className="px-4 py-2 bg-zinc-905 hover:bg-zinc-850 border border-zinc-800 text-zinc-300 rounded-lg text-xs font-bold uppercase transition-all"
                  >
                    🎨 Render Thumbnail Variation
                  </button>
                </div>

                <div className="bg-zinc-900/50 border border-zinc-850 rounded-xl p-4 flex flex-col justify-center items-center text-center">
                  {labThumbnailPredictedCTR ? (
                    <div className="space-y-2">
                      <div className="w-full h-24 bg-red-950/20 rounded-lg border border-red-900/40 flex items-center justify-center font-mono text-[10px] text-red-400">
                        [ MOCK THUMBNAIL PREVIEW ]
                      </div>
                      <div className="text-[10px] font-bold text-emerald-400">Predicted CTR: 9.2%</div>
                    </div>
                  ) : (
                    <span className="text-zinc-650 text-xs font-mono">No thumbnail rendered. Click 'Render' to generate mockup preview.</span>
                  )}
                </div>
              </div>

              {labThumbnailPredictedCTR && (
                <div className="flex justify-end pt-2">
                  <button
                    onClick={() => {
                      setLabStep(5);
                      setLabProgressPercent(0);
                      toast.success("Thumbnail asset generated successfully! Moving to ultimate video compilation render.");
                    }}
                    className="px-5 py-2.5 bg-red-600 hover:bg-red-500 text-white font-bold text-xs uppercase tracking-wider rounded-xl transition-all active-press"
                  >
                    Lock-In Thumbnail & Proceed →
                  </button>
                </div>
              )}
            </div>
          )}

          {labStep === 5 && (
            <div className="space-y-4 animate-fade-in">
              <div className="bg-zinc-900/30 border border-zinc-900 rounded-2xl p-4">
                <h4 className="text-sm font-bold text-white flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse"></span>
                  Objective: Execute Veo Video Synthesis Engine
                </h4>
                <p className="text-xs text-zinc-400 mt-1 leading-relaxed">
                  Now compile all generated assets (Idea, Script screenplay, voice Narration track, CTR thumbnail) into our high-fidelity Veo Synthesis pipeline.
                </p>
              </div>

              <div className="space-y-4">
                {labProgressPercent === 0 ? (
                  <button
                    onClick={() => {
                      let pct = 0;
                      const interval = setInterval(() => {
                        pct += 10;
                        setLabProgressPercent(pct);
                        if (pct >= 100) {
                          clearInterval(interval);
                          toast.success("🎉 CONGRATULATIONS! Video asset compilation finished!");
                          // Log newly formulated completed walkthrough to local activities logs!
                          logActivity("Completed Interactive production Lab Mode walkthrough!", "Interactive Lab Mode", "checkin");
                        }
                      }, 400);
                    }}
                    className="px-6 py-3 bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-500 hover:to-orange-500 text-white font-black text-xs uppercase tracking-widest rounded-xl transition-all active-press block w-fit"
                  >
                    🎬 Compile and Render Full Video Assets
                  </button>
                ) : (
                  <div className="p-4 bg-zinc-900/40 rounded-xl border border-zinc-900">
                    <div className="flex justify-between text-xs text-zinc-400 mb-2 font-mono">
                      <span>Status: {labProgressPercent < 100 ? 'Synthesizing scene-to-scene transitions...' : 'COMPLETED SUCCESSFULLY'}</span>
                      <span className="text-white font-bold">{labProgressPercent}%</span>
                    </div>
                    <div className="w-full h-2 bg-zinc-950 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-red-500 transition-all duration-300" 
                        style={{ width: `${labProgressPercent}%` }}
                      />
                    </div>
                  </div>
                )}

                {labProgressPercent >= 100 && (
                  <div className="p-4 bg-emerald-950/20 border border-emerald-900/40 rounded-2xl space-y-3 animate-fade-in">
                    <h5 className="text-sm font-bold text-emerald-400">✨ Sandbox Production Complete!</h5>
                    <p className="text-xs text-zinc-400 leading-normal">
                      Your high-relevance video has been compiled. Feel free to download the synthesized asset file or deploy it directly to YouTube with automated schemas.
                    </p>
                    <div className="flex gap-2.5">
                      <a 
                        href="#download" 
                        onClick={(e) => { e.preventDefault(); toast.success("Downloading video archive bundle..."); }}
                        className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold uppercase transition-all"
                      >
                        📥 Download Asset Bundle
                      </a>
                      <button 
                        onClick={() => {
                          setLabStep(0);
                          toast.success("Congratulations on finishing! Ready for your next real project production!");
                        }}
                        className="px-4 py-2 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 rounded-lg text-xs font-bold uppercase transition-all"
                      >
                        Finish & Reset Lab Mode
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    );
  };

  if (dashboardMode === 'command_center') {
    return (
      <div className="space-y-6 animate-fade-in pb-10">
        {/* Premium Dashboard Mode Selector */}
        <div className="flex justify-between items-center bg-[#09090b] border border-zinc-900 rounded-2xl p-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-red-950/40 border border-red-900/60 flex items-center justify-center text-red-500 shrink-0">
              <Sparkles className="animate-pulse" size={15} />
            </div>
            <div>
              <h3 className="text-xs font-black text-white uppercase tracking-wider">Dashboard Portal</h3>
              <p className="text-[10px] text-zinc-500 font-medium">Switch between the enterprise orchestration center and the classic creative workspace.</p>
            </div>
          </div>
          <div className="flex bg-zinc-950 p-1 rounded-xl border border-zinc-850">
            <button
              onClick={() => setDashboardMode('command_center')}
              className="px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all cursor-pointer bg-red-600 text-white shadow-md shadow-red-950/30"
            >
              AI Command Center
            </button>
            <button
              onClick={() => setDashboardMode('classic')}
              className="px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all cursor-pointer text-zinc-400 hover:text-white"
            >
              Classic Workspace
            </button>
          </div>
        </div>

        {/* Dynamic Guided Sandbox Simulator rendering */}
        {renderInteractiveLab()}

        {recentlyUsedTools.length > 0 && (
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 space-y-3">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2">
                <History size={12} className="text-red-500 animate-pulse" />
                <h4 className="text-[10px] font-black uppercase tracking-wider text-zinc-300">Recently Accessed Modules</h4>
              </div>
              <span className="text-[8px] font-mono font-black text-zinc-650 uppercase">Session Telemetry</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {recentlyUsedTools.map((tool) => (
                <button
                  key={tool}
                  onClick={() => onNavigate(tool)}
                  className="flex items-center gap-2.5 px-3 py-2 rounded-xl bg-zinc-950 hover:bg-zinc-900 border border-zinc-850 hover:border-zinc-800 transition-all text-xs font-bold text-zinc-300 hover:text-white shrink-0 cursor-pointer shadow-sm group active-press"
                >
                  <div className="w-5 h-5 rounded-lg bg-zinc-900 flex items-center justify-center border border-zinc-800 group-hover:border-zinc-700 transition-all shrink-0">
                    {getToolIcon(tool)}
                  </div>
                  <span className="truncate">{getToolLabel(tool)}</span>
                  <ChevronRight size={10} className="text-zinc-600 group-hover:text-zinc-400 group-hover:translate-x-0.5 transition-all ml-1" />
                </button>
              ))}
            </div>
          </div>
        )}

        <RankticaCommandCenter />
      </div>
    );
  }

  return (
    <div className="space-y-10 animate-fade-in pb-10">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <h2 className="text-4xl font-extrabold text-white tracking-tight flex items-center gap-3">
            Creative Command
            {urgentMilestoneItems.length > 0 && (
              <span className="bg-amber-500/15 text-amber-400 border border-amber-500/30 text-[10px] px-2.5 py-0.5 rounded-full font-mono font-bold animate-pulse shadow-sm shadow-amber-500/10">
                ⚠️ {urgentMilestoneItems.length} Urgent
              </span>
            )}
          </h2>
          <p className="text-zinc-400 text-sm font-medium">Welcome back, {user?.name}. Your production is on track.</p>
        </div>
        <div className="flex gap-2 self-start md:self-auto">
          <button 
            onClick={() => setDashboardMode('command_center')}
            className="bg-zinc-950 hover:bg-zinc-900 text-red-500 hover:text-red-400 px-5 py-3 rounded-2xl text-xs font-black uppercase tracking-wider flex items-center gap-2 transition-all border border-zinc-850 active-press"
            title="Switch to AI Command Center"
          >
            <Sparkles size={14} className="animate-pulse" /> AI Command Center
          </button>
          <button 
            onClick={handleExportReport}
            className="bg-zinc-950 hover:bg-zinc-900 text-zinc-300 hover:text-white px-5 py-3 rounded-2xl text-xs font-black uppercase tracking-wider flex items-center gap-2 transition-all border border-zinc-850 active-press"
            title="Export Production Report"
          >
            <Download size={14} className="text-emerald-500" /> Export Summary
          </button>
          <button 
            onClick={handleExportPDF}
            className="bg-zinc-950 hover:bg-zinc-900 text-zinc-300 hover:text-white px-5 py-3 rounded-2xl text-xs font-black uppercase tracking-wider flex items-center gap-2 transition-all border border-zinc-850 active-press"
            title="Export Status Report as PDF"
          >
            <FileText size={14} className="text-red-500 animate-pulse" /> Export PDF
          </button>
          <button 
            onClick={handleExportProject}
            className="bg-zinc-950 hover:bg-zinc-900 text-zinc-300 hover:text-white px-5 py-3 rounded-2xl text-xs font-black uppercase tracking-wider flex items-center gap-2 transition-all border border-zinc-850 active-press"
            title="Export Project Configuration JSON"
          >
            <FileJson size={14} className="text-blue-500 animate-pulse" /> Export Project
          </button>
          <button 
            onClick={exportProjectsToCSV}
            className="bg-zinc-950 hover:bg-zinc-900 text-zinc-300 hover:text-white px-5 py-3 rounded-2xl text-xs font-black uppercase tracking-wider flex items-center gap-2 transition-all border border-zinc-850 active-press"
            title="Export All Projects as CSV"
          >
            <Table size={14} className="text-teal-400" /> Export CSV
          </button>
          <button 
            onClick={() => setShowKeyboardShortcuts(true)}
            className="bg-zinc-950 hover:bg-zinc-900 text-zinc-350 hover:text-white px-5 py-3 rounded-2xl text-xs font-black uppercase tracking-wider flex items-center gap-2 transition-all border border-zinc-850 active-press"
            title="Open Keyboard Shortcuts Overlay [?]"
          >
            <Keyboard size={14} className="text-amber-500" /> Shortcuts
          </button>
          <button 
            onClick={() => onNavigate(ToolType.WORKFLOW)}
            className="bg-zinc-900 hover:bg-zinc-800 text-white px-6 py-3 rounded-2xl text-xs font-black uppercase tracking-wider flex items-center gap-2 transition-all border border-zinc-800 active-press"
          >
            <Cpu size={14} className="text-red-500 animate-pulse" /> 14-Step Core
          </button>
          <button 
            onClick={() => onNavigate(ToolType.VIDEO_GENERATOR)}
            className="bg-red-600 hover:bg-red-500 text-white px-6 py-3 rounded-2xl text-xs font-black uppercase tracking-wider flex items-center gap-2 transition-all shadow-lg shadow-red-600/20 active-press btn-glow"
          >
            <Clapperboard size={14} /> New Production
          </button>
        </div>
      </header>

      {/* GLOBAL PRODUCTION SEARCH ENGINE */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-[2rem] p-6 relative overflow-hidden shadow-xl">
        <div className="absolute top-0 right-0 w-64 h-64 bg-red-600/5 rounded-full blur-[80px] pointer-events-none" />
        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-black uppercase text-zinc-400 tracking-[0.2em] font-mono flex items-center gap-2">
              <Search size={14} className="text-red-500 animate-pulse" /> Full-Text Global Search Indexer
            </h3>
            <span className="text-[9px] font-mono font-bold bg-zinc-950 px-2 py-1 rounded border border-zinc-850 text-zinc-550 uppercase tracking-widest">
              Live Real-Time Queries
            </span>
          </div>
          <div className="relative">
            <input
              type="text"
              value={globalSearchQuery}
              onChange={(e) => setGlobalSearchQuery(e.target.value)}
              placeholder="Search full-text of project scripts, thumbnail prompt canvases, and generated ideas..."
              className="w-full bg-zinc-950 border border-zinc-850 focus:border-red-500 hover:border-zinc-800 rounded-2xl pl-12 pr-4 py-4 text-xs text-white placeholder-zinc-700 outline-none transition-all font-mono"
            />
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-650" size={16} />
            {globalSearchQuery.trim() && (
              <button
                onClick={() => setGlobalSearchQuery("")}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-[10px] font-bold text-zinc-500 hover:text-white uppercase tracking-wider font-mono cursor-pointer"
              >
                Clear [esc]
              </button>
            )}
          </div>
        </div>

        {/* Dynamic Search Results Panel */}
        {globalSearchQuery.trim() && (
          <div className="mt-4 border-t border-zinc-850 pt-4 animate-fade-in space-y-3">
            <div className="flex justify-between items-center px-1">
              <span className="text-[10px] font-mono font-black text-zinc-500 uppercase tracking-wider">
                Search Results ({globalSearchResults.length} matches)
              </span>
            </div>

            {globalSearchResults.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-[300px] overflow-y-auto custom-scrollbar pr-1">
                {globalSearchResults.map((res, index) => {
                  let badgeColor = 'bg-blue-500/10 text-blue-400 border-blue-500/20';
                  let typeLabel = 'SCRIPT';
                  if (res.type === 'thumbnail') {
                    badgeColor = 'bg-orange-500/10 text-orange-400 border-orange-500/20';
                    typeLabel = 'THUMBNAIL';
                  } else if (res.type === 'idea') {
                    badgeColor = 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20';
                    typeLabel = 'IDEA LAB';
                  } else if (res.type === 'project') {
                    badgeColor = 'bg-green-500/10 text-green-400 border-green-500/20';
                    typeLabel = 'PROJECT';
                  }

                  return (
                    <div 
                      key={index}
                      onClick={() => {
                        setActiveProjectById(res.projectId);
                        onNavigate(res.targetTool);
                        setGlobalSearchQuery("");
                        toast.success(`Switched active workspace to "${res.projectTitle}" & navigated to ${typeLabel}!`);
                      }}
                      className="group bg-zinc-950 border border-zinc-855 hover:border-red-500/40 p-4 rounded-xl transition-all cursor-pointer flex flex-col justify-between hover:shadow-lg hover:shadow-red-500/5"
                    >
                      <div>
                        <div className="flex justify-between items-start gap-2 mb-2">
                          <span className="text-[11px] font-bold text-white group-hover:text-red-500 transition-colors truncate">
                            {res.title}
                          </span>
                          <span className={`text-[8px] font-black tracking-widest uppercase px-2 py-0.5 rounded border font-mono shrink-0 ${badgeColor}`}>
                            {typeLabel}
                          </span>
                        </div>
                        <p className="text-[10.5px] font-mono text-zinc-500 leading-relaxed font-semibold break-words">
                          {res.snippet}
                        </p>
                      </div>
                      <div className="mt-3 flex justify-between items-center text-[9px] font-mono font-black uppercase text-zinc-650 group-hover:text-red-400 transition-colors pt-2 border-t border-zinc-900/60">
                        <span>Project: {res.projectTitle}</span>
                        <span>Open & Config →</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="bg-zinc-950 border border-zinc-850 p-6 rounded-xl text-center space-y-1">
                <p className="text-xs font-mono text-zinc-550">No production records matching "{globalSearchQuery}" inside scripts, thumbnails, or ideas.</p>
                <p className="text-[10px] font-mono text-zinc-700">Try searching for other keywords, niches, or workspace titles.</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Subtle Milestone Alert Banner */}
      {urgentMilestoneItems.length > 0 && (
        <div className="bg-amber-500/10 border border-amber-500/20 rounded-2xl p-4 flex items-start gap-3.5 animate-fade-in relative overflow-hidden backdrop-blur-sm">
          <div className="absolute top-0 left-0 w-1 h-full bg-amber-500"></div>
          <AlertCircle className="text-amber-500 shrink-0 mt-0.5" size={16} />
          <div className="flex-1 min-w-0">
            <h4 className="text-xs font-black text-amber-400 uppercase tracking-wider flex items-center gap-2">
              ⚠️ Urgent Production Milestones ({urgentMilestoneItems.length})
            </h4>
            <div className="mt-2 grid grid-cols-1 md:grid-cols-2 gap-3">
              {urgentMilestoneItems.map((item, idx) => (
                <div key={idx} className="flex items-center justify-between text-[11px] text-zinc-300 bg-zinc-950/40 border border-zinc-900/60 rounded-xl px-3 py-2">
                  <p className="truncate mr-4 font-medium">
                    <span className="font-bold text-white text-[12px] block leading-tight">{item.projectTitle}</span> 
                    <span className="text-zinc-400 text-[10px]">{item.title}</span>
                  </p>
                  <span className="font-mono text-[10px] text-amber-500 font-bold shrink-0 bg-amber-500/10 border border-amber-500/25 px-2 py-0.5 rounded-md">
                    {item.daysRemaining < 0 
                      ? "Overdue" 
                      : item.daysRemaining === 0 
                        ? "Due Today" 
                        : `${item.daysRemaining}d left`}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Daily Creator Intelligence Digest */}
      <DailyCreatorDigest projects={projects} onNavigate={onNavigate} />

      {/* Dynamic Guided Sandbox Simulator rendering */}
      {renderInteractiveLab()}

      {/* Recently Visited Tools Section */}
      {recentlyUsedTools.length > 0 && (
        <div className="bg-zinc-950/60 border border-zinc-850/70 rounded-3xl p-6 shadow-xl space-y-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2">
              <History size={14} className="text-red-500 animate-pulse" />
              <h4 className="text-sm font-black uppercase tracking-wider text-white">Recently Accessed Modules</h4>
            </div>
            <span className="text-[8px] font-mono font-black text-zinc-650 uppercase">Session Telemetry</span>
          </div>
          <div className="flex flex-wrap gap-3">
            {recentlyUsedTools.map((tool) => (
              <button
                key={tool}
                onClick={() => onNavigate(tool)}
                className="flex items-center gap-3 px-4 py-2.5 rounded-2xl bg-zinc-900/60 hover:bg-zinc-900 border border-zinc-850 hover:border-zinc-800 transition-all text-xs font-bold text-zinc-350 hover:text-white shrink-0 cursor-pointer shadow-sm group active-press"
              >
                <div className="w-6 h-6 rounded-xl bg-zinc-950 flex items-center justify-center border border-zinc-800 group-hover:border-zinc-700 transition-all shrink-0">
                  {getToolIcon(tool)}
                </div>
                <span className="truncate">{getToolLabel(tool)}</span>
                <ChevronRight size={12} className="text-zinc-600 group-hover:text-zinc-400 group-hover:translate-x-0.5 transition-all ml-1.5" />
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Project Provider Summary Stats Widget */}
      <div id="project-summary-stats-widget" className="bg-[#09090b]/60 border border-zinc-850/70 rounded-3xl p-6 shadow-xl relative overflow-hidden backdrop-blur-sm">
        <div className="absolute top-0 left-0 w-1 h-full bg-red-600"></div>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
          <div>
            <h3 className="text-sm font-black text-white uppercase tracking-wider flex items-center gap-2">
              <Database size={15} className="text-red-500" /> Active Workspace State Engine
            </h3>
            <p className="text-[10px] text-zinc-500 font-medium">Real-time localized workspace metrics synchronized with Cloud Firestore database</p>
          </div>
          <span className="text-[9px] font-mono font-bold bg-zinc-900 border border-zinc-800 text-zinc-400 px-2 py-0.5 rounded-full uppercase tracking-widest">
            Provider Sync Active
          </span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {/* Total Projects */}
          <div className="bg-zinc-950 border border-zinc-900 p-4 rounded-2xl flex items-center gap-4 hover:border-zinc-800 transition-all group">
            <div className="p-3 rounded-xl bg-blue-500/10 text-blue-400 group-hover:scale-105 transition-transform duration-300">
              <Layers size={18} />
            </div>
            <div>
              <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest block">Total Projects</span>
              <p className="text-2xl font-black text-white mt-0.5">{projectSummaryStats.totalProjects}</p>
            </div>
          </div>

          {/* Active Workflows */}
          <div className="bg-zinc-950 border border-zinc-900 p-4 rounded-2xl flex items-center gap-4 hover:border-zinc-800 transition-all group">
            <div className="p-3 rounded-xl bg-amber-500/10 text-amber-500 group-hover:scale-105 transition-transform duration-300">
              <Cpu size={18} />
            </div>
            <div>
              <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest block">Active Workflows</span>
              <p className="text-2xl font-black text-white mt-0.5">{projectSummaryStats.activeWorkflows}</p>
            </div>
          </div>

          {/* Generated Media Assets */}
          <div className="bg-zinc-950 border border-zinc-900 p-4 rounded-2xl flex items-center gap-4 hover:border-zinc-800 transition-all group">
            <div className="p-3 rounded-xl bg-purple-500/10 text-purple-400 group-hover:scale-105 transition-transform duration-300">
              <FolderOpen size={18} />
            </div>
            <div>
              <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest block">Media Assets</span>
              <p className="text-2xl font-black text-white mt-0.5">{projectSummaryStats.generatedMediaAssets}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Pinned AI Battery & Power Impact Quick-Stats */}
      <div id="pinned-battery-quick-stats-section" className="bg-[#09090b]/60 border border-zinc-850/70 rounded-3xl p-6 shadow-xl relative overflow-hidden backdrop-blur-sm mt-6">
        <div className="absolute top-0 left-0 w-1 h-full bg-amber-500"></div>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
          <div className="space-y-1">
            <h3 className="text-sm font-black text-white uppercase tracking-wider flex items-center gap-2">
              <Pin size={14} className="text-amber-500 fill-amber-500" /> Pinned AI Workload Power Impact Stats
            </h3>
            <p className="text-[10px] text-zinc-500 font-medium">
              Real-time monitoring of energy levels and thermal footprints for background rendering tasks
            </p>
          </div>
          <button
            onClick={() => onNavigate(ToolType.BATTERY_DASHBOARD)}
            className="text-[9.5px] font-black uppercase tracking-wider text-amber-500 hover:text-amber-400 bg-amber-500/10 border border-amber-500/20 px-3 py-1.5 rounded-xl transition-all self-start sm:self-auto active-press cursor-pointer"
          >
            Manage Power Pipelines
          </button>
        </div>

        {pinnedBatteryStats.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-6 px-4 bg-zinc-950/40 border border-zinc-900/60 rounded-2xl text-center">
            <Activity size={24} className="text-zinc-700 mb-2 animate-pulse" />
            <p className="text-[11px] font-black text-zinc-400 uppercase">No Power Gauges Pinned</p>
            <p className="text-[10px] text-zinc-500 max-w-md mt-1 leading-normal">
              You haven't pinned any Battery Quick-Stats cards to the main dashboard. Visit the Battery Health Dashboard to pin real-time AI impact monitors.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {pinnedBatteryStats.map((taskId) => {
              const task = QUICK_ACTION_TASKS.find(t => t.id === taskId);
              if (!task) return null;

              const isEcoActive = taskPowerSavers[taskId];

              // Compute dynamic impact metric scores (consistent with Battery Dashboard)
              let impactScore = 0;
              let currentWatts = "";
              let efficiency = "";
              let thermalColor = "text-emerald-400";
              let thermalText = "Cool";

              if (task.id === 'video_generation') {
                impactScore = isEcoActive ? 32 : 92;
                currentWatts = isEcoActive ? '40W' : '120W';
                efficiency = isEcoActive ? '94%' : '48%';
                thermalColor = isEcoActive ? 'text-emerald-400' : 'text-red-400';
                thermalText = isEcoActive ? 'Optimized' : 'Thermal Load';
              } else if (task.id === 'voice_cloning') {
                impactScore = isEcoActive ? 24 : 68;
                currentWatts = isEcoActive ? '30W' : '85W';
                efficiency = isEcoActive ? '96%' : '62%';
                thermalColor = isEcoActive ? 'text-emerald-400' : 'text-amber-400';
                thermalText = isEcoActive ? 'Optimized' : 'Warm';
              } else if (task.id === 'web_crawling') {
                impactScore = isEcoActive ? 12 : 45;
                currentWatts = isEcoActive ? '15W' : '55W';
                efficiency = isEcoActive ? '98%' : '74%';
                thermalColor = 'text-emerald-400';
                thermalText = 'Optimal';
              } else if (task.id === 'chunk_embeddings') {
                impactScore = isEcoActive ? 16 : 56;
                currentWatts = isEcoActive ? '20W' : '70W';
                efficiency = isEcoActive ? '97%' : '68%';
                thermalColor = isEcoActive ? 'text-emerald-400' : 'text-yellow-400';
                thermalText = isEcoActive ? 'Optimal' : 'Medium Heat';
              }

              // Map icons
              let IconComponent = Video;
              if (task.icon === 'mic') IconComponent = Mic;
              else if (task.icon === 'globe') IconComponent = Globe;
              else if (task.icon === 'database') IconComponent = Database;

              return (
                <div 
                  key={task.id}
                  className="bg-zinc-950/80 border border-zinc-900 rounded-2xl p-4 flex flex-col justify-between space-y-4 relative overflow-hidden transition-all hover:border-zinc-800"
                >
                  {/* Icon + Title + Unpin */}
                  <div className="flex justify-between items-start gap-2 relative z-10">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className={`p-2 rounded-xl shrink-0 ${
                        isEcoActive 
                          ? 'bg-emerald-500/10 text-emerald-400' 
                          : 'bg-zinc-900 text-zinc-400'
                      }`}>
                        <IconComponent size={14} />
                      </div>
                      <div className="min-w-0">
                        <h4 className="text-[11px] font-black text-white uppercase tracking-wide truncate">
                          {task.name.split(' & ')[0]}
                        </h4>
                        <span className={`text-[7.5px] font-extrabold uppercase tracking-widest block leading-none mt-0.5 ${isEcoActive ? 'text-emerald-400' : 'text-amber-400'}`}>
                          {isEcoActive ? '🍃 ECO ACTIVE' : '⚡ FULL RUN'}
                        </span>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleUnpin(task.id)}
                      className="p-1 rounded-md text-zinc-600 hover:text-red-400 transition-colors cursor-pointer"
                      title="Unpin scoreboard"
                    >
                      <X size={12} />
                    </button>
                  </div>

                  {/* Impact score bar */}
                  <div className="space-y-1.5 relative z-10">
                    <div className="flex justify-between items-baseline text-[8px] font-black uppercase tracking-widest text-zinc-500">
                      <span>Power Impact Score</span>
                      <span className={impactScore > 75 ? 'text-red-400' : impactScore > 40 ? 'text-amber-400' : 'text-emerald-400'}>
                        {impactScore}/100
                      </span>
                    </div>

                    <div className="h-1 bg-zinc-900 rounded-full overflow-hidden">
                      <div 
                        className={`h-full rounded-full transition-all duration-500 ${
                          impactScore > 75 
                            ? 'bg-red-500' 
                            : impactScore > 40 
                              ? 'bg-amber-500' 
                              : 'bg-emerald-500'
                        }`}
                        style={{ width: `${impactScore}%` }}
                      />
                    </div>
                  </div>

                  {/* Quick toggle list and info */}
                  <div className="grid grid-cols-2 gap-1.5 pt-1 border-t border-zinc-900/60 relative z-10">
                    <div className="text-left">
                      <span className="text-[6.5px] font-extrabold text-zinc-500 uppercase tracking-widest block">Power Draw</span>
                      <span className="text-[9.5px] font-black text-zinc-300">{currentWatts}</span>
                    </div>
                    <div className="text-left">
                      <span className="text-[6.5px] font-extrabold text-zinc-500 uppercase tracking-widest block">Efficiency</span>
                      <span className="text-[9.5px] font-black text-emerald-400">{efficiency}</span>
                    </div>
                  </div>

                  {/* Action eco toggle directly on creator dashboard */}
                  <button
                    type="button"
                    onClick={() => handleToggleEco(task.id)}
                    className={`w-full py-1.5 px-2 rounded-xl text-[8px] font-black uppercase tracking-wider transition-all duration-200 flex items-center justify-center gap-1 cursor-pointer active:scale-95 ${
                      isEcoActive
                        ? 'bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20'
                        : 'bg-zinc-900 border border-zinc-850 text-zinc-400 hover:text-white hover:bg-zinc-850'
                    }`}
                  >
                    <span className={`w-1 h-1 rounded-full ${isEcoActive ? 'bg-emerald-400 animate-pulse' : 'bg-zinc-500'}`} />
                    {isEcoActive ? "Eco Active" : "Throttled Mode"}
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Project Due Dates Timeline & Milestone Scheduler Widget */}
      <div id="project-timeline-scheduler" className="bg-[#09090b]/60 border border-zinc-850/70 rounded-3xl p-6 shadow-xl relative overflow-hidden backdrop-blur-sm mt-6 animate-fade-in">
        <div className="absolute top-0 left-0 w-1 h-full bg-amber-500"></div>
        
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <div>
            <h3 className="text-sm font-black text-white uppercase tracking-wider flex items-center gap-2">
              <Calendar size={15} className="text-amber-500" /> Project Milestones & Due Dates Timeline
            </h3>
            <p className="text-[10px] text-zinc-500 font-medium">Chronological visualization of upcoming major release phases and workflow deadlines</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Column 1: Visual Timeline Chart */}
          <div className="lg:col-span-7 bg-zinc-950/80 border border-zinc-900/80 rounded-2xl p-5 flex flex-col justify-between">
            <div className="mb-4">
              <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Visual Schedule Graph</span>
            </div>

            {upcomingDeadlinesAndMilestones.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 px-4 text-center my-auto">
                <Clock size={32} className="text-zinc-700 animate-pulse mb-3" />
                <p className="text-xs font-bold text-zinc-400">No Scheduled Deadlines or Milestones</p>
                <p className="text-[10px] text-zinc-600 mt-1 max-w-sm">
                  To plot a visual schedule, select a project in the scheduler panel on the right, assign a deadline, or insert key milestones.
                </p>
              </div>
            ) : (
              <div className="relative w-full overflow-x-auto select-none py-4 scrollbar-thin scrollbar-thumb-zinc-800 scrollbar-track-transparent my-auto">
                <div className="min-w-[600px] px-4">
                  <svg viewBox="0 0 700 160" className="w-full h-auto overflow-visible">
                    {/* Background Connection Line */}
                    <line x1="40" y1="80" x2="660" y2="80" stroke="#1f1f23" strokeWidth="4" strokeLinecap="round" />
                    
                    {/* Active Track Progress Overlay */}
                    <line 
                      x1="40" 
                      y1="80" 
                      x2={40 + (upcomingDeadlinesAndMilestones.slice(0, 7).findIndex(item => {
                        const days = Math.ceil((new Date(item.date).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
                        return days > 0;
                      }) !== -1 ? (upcomingDeadlinesAndMilestones.slice(0, 7).findIndex(item => {
                        const days = Math.ceil((new Date(item.date).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
                        return days > 0;
                      }) / Math.max(1, Math.min(6, upcomingDeadlinesAndMilestones.length - 1))) * 620 : 620)} 
                      y2="80" 
                      stroke="url(#timeline-grad)" 
                      strokeWidth="4" 
                      strokeLinecap="round" 
                    />

                    {/* Gradients */}
                    <defs>
                      <linearGradient id="timeline-grad" x1="0%" y1="0%" x2="100%" y2="0%">
                        <stop offset="0%" stopColor="#10b981" />
                        <stop offset="50%" stopColor="#f59e0b" />
                        <stop offset="100%" stopColor="#3b82f6" />
                      </linearGradient>
                    </defs>

                    {/* Plot items */}
                    {upcomingDeadlinesAndMilestones.slice(0, 7).map((item, i, arr) => {
                      const totalElements = arr.length;
                      const x = 40 + (i / Math.max(1, totalElements - 1)) * 620;
                      const isTop = i % 2 === 0;
                      const yNode = 80;
                      const yLabel = isTop ? 25 : 135;

                      const daysRemaining = Math.ceil((new Date(item.date).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
                      const isOverdue = daysRemaining < 0 && !item.completed;
                      
                      let color = "#3b82f6"; // Blue upcoming deadline
                      if (item.completed) color = "#10b981"; // Green completed
                      else if (isOverdue) color = "#ef4444"; // Red overdue
                      else if (item.type === 'milestone') color = "#f59e0b"; // Gold upcoming milestone

                      const isHovered = hoveredTimelineItemId === item.id;

                      return (
                        <g 
                          key={item.id} 
                          onMouseEnter={() => setHoveredTimelineItemId(item.id)}
                          onMouseLeave={() => setHoveredTimelineItemId(null)}
                          className="cursor-pointer group"
                        >
                          {/* Vertical Connector dotted lines */}
                          <line 
                            x1={x} 
                            y1={yNode} 
                            x2={x} 
                            y2={yLabel + (isTop ? 10 : -10)} 
                            stroke={isHovered ? color : "#27272a"} 
                            strokeWidth="1.5" 
                            strokeDasharray="3,3" 
                            className="transition-colors duration-300"
                          />

                          {/* Pulsing ring for overdue / hovered */}
                          {(isOverdue || isHovered) && (
                            <circle 
                              cx={x} 
                              cy={yNode} 
                              r={12} 
                              fill="none" 
                              stroke={color} 
                              strokeWidth="2" 
                              className={isOverdue ? "animate-ping opacity-60" : "opacity-40"}
                            />
                          )}

                          {/* Core point circle */}
                          <circle 
                            cx={x} 
                            cy={yNode} 
                            r={isHovered ? 7 : 5} 
                            fill={color} 
                            stroke="#09090b" 
                            strokeWidth="2" 
                            className="transition-all duration-300"
                          />

                          {/* Text/Label Container */}
                          <g transform={`translate(${x}, ${yLabel})`}>
                            {/* Subtle hover background capsule */}
                            {isHovered && (
                              <rect 
                                x="-65" 
                                y={isTop ? "-16" : "-10"} 
                                width="130" 
                                height="28" 
                                rx="6" 
                                fill="#18181b" 
                                stroke="#27272a" 
                                strokeWidth="1"
                              />
                            )}

                            {/* Label: Item title */}
                            <text 
                              textAnchor="middle" 
                              y={isTop ? "-4" : "4"} 
                              fill={isHovered ? "#ffffff" : "#a1a1aa"} 
                              fontSize="9" 
                              fontWeight="bold" 
                              className="font-sans tracking-wide transition-colors"
                            >
                              {item.title.length > 14 ? item.title.substring(0, 12) + "..." : item.title}
                            </text>

                            {/* Date text label */}
                            <text 
                              textAnchor="middle" 
                              y={isTop ? "8" : "15"} 
                              fill={color} 
                              fontSize="8" 
                              fontFamily="monospace"
                              className="font-bold transition-colors"
                            >
                              {new Date(item.date).toLocaleDateString(undefined, {month: 'short', day: 'numeric'})}
                            </text>
                          </g>
                        </g>
                      );
                    })}
                  </svg>
                </div>
              </div>
            )}

            {/* Selected item hover details display */}
            <div className="mt-4 border-t border-zinc-900 pt-4 min-h-[50px] flex items-center justify-between">
              {hoveredTimelineItemId ? (() => {
                const hoveredItem = upcomingDeadlinesAndMilestones.find(item => item.id === hoveredTimelineItemId);
                if (!hoveredItem) return <p className="text-[10px] text-zinc-600">Hover over any node in the timeline to view scheduled details.</p>;
                
                const daysRemaining = Math.ceil((new Date(hoveredItem.date).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
                const isOverdue = daysRemaining < 0 && !hoveredItem.completed;

                return (
                  <div className="flex items-center justify-between w-full animate-fade-in">
                    <div>
                      <span className="text-[9px] font-mono font-bold text-zinc-500 uppercase tracking-widest block">{hoveredItem.projectTitle}</span>
                      <p className="text-xs font-black text-white flex items-center gap-1.5 mt-0.5">
                        <span className={`w-1.5 h-1.5 rounded-full ${hoveredItem.type === 'deadline' ? 'bg-blue-500' : 'bg-amber-500'}`}></span>
                        {hoveredItem.title}
                      </p>
                    </div>
                    <div className="text-right">
                      <span className="text-[9px] font-mono font-bold text-zinc-500 block">DUE DATE: {new Date(hoveredItem.date).toLocaleDateString()}</span>
                      <p className={`text-[10px] font-black uppercase mt-0.5 ${
                        hoveredItem.completed ? "text-emerald-500" :
                        isOverdue ? "text-red-500 animate-pulse" : "text-amber-500"
                      }`}>
                        {hoveredItem.completed ? "✓ Completed" :
                         isOverdue ? `⚠️ Overdue by ${Math.abs(daysRemaining)} days` :
                         daysRemaining === 0 ? "⚡ Due Today" : `⏳ ${daysRemaining} days remaining`}
                      </p>
                    </div>
                  </div>
                );
              })() : (
                <div className="flex items-center justify-between w-full text-zinc-600 text-[10px]">
                  <p className="flex items-center gap-1.5">
                    <Clock size={11} /> Hover over timeline nodes to inspect specific milestone conditions
                  </p>
                  <div className="flex gap-4">
                    <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span> Deadlines</span>
                    <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span> Milestones</span>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Column 2: Milestones & Deadlines Manager Panel */}
          <div className="lg:col-span-5 bg-zinc-950/80 border border-zinc-900/80 rounded-2xl p-5 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-4 pb-3 border-b border-zinc-900">
                <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Scheduler Control Desk</span>
                
                {/* Select active project to schedule */}
                <select 
                  value={timelineSelectedProjId} 
                  onChange={(e) => setTimelineSelectedProjId(e.target.value)}
                  className="bg-zinc-900 border border-zinc-800 text-[10px] text-white rounded-lg px-2 py-1 focus:outline-none focus:border-zinc-700 max-w-[180px] font-medium"
                >
                  <option value="" disabled={projects.length > 0}>-- Select Project --</option>
                  {projects.filter(p => !p.archived && p.status !== 'archive').map(p => (
                    <option key={p.id} value={p.id}>{p.title}</option>
                  ))}
                </select>
              </div>

              {selectedTimelineProject ? (
                <div className="space-y-4 animate-fade-in">
                  {/* Part A: Set Project Deadline */}
                  <div>
                    <label className="text-[9px] font-black text-zinc-500 uppercase tracking-widest block mb-1">Project Ultimate Deadline</label>
                    <div className="flex gap-2">
                      <div className="relative flex-1">
                        <Calendar size={12} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
                        <input 
                          type="date" 
                          value={timelineDeadlineInput}
                          onChange={(e) => setTimelineDeadlineInput(e.target.value)}
                          className="w-full bg-zinc-900 border border-zinc-800 rounded-xl py-2 pl-8 pr-3 text-[10px] text-white font-mono focus:outline-none focus:border-zinc-750"
                        />
                      </div>
                      <button 
                        onClick={handleUpdateDeadline}
                        className="bg-zinc-900 hover:bg-zinc-850 border border-zinc-800 text-white font-black text-[9px] uppercase px-3 py-2 rounded-xl transition-all active-press"
                      >
                        Set
                      </button>
                    </div>
                  </div>

                  {/* Part B: Add Custom Milestone */}
                  <form onSubmit={handleAddMilestone} className="border-t border-zinc-900/50 pt-3">
                    <label className="text-[9px] font-black text-zinc-500 uppercase tracking-widest block mb-1">Add Stage Milestone</label>
                    <div className="flex flex-col sm:flex-row gap-2">
                      <input 
                        type="text" 
                        placeholder="Milestone Title (e.g. Script Review)" 
                        value={newMilestoneTitle}
                        onChange={(e) => setNewMilestoneTitle(e.target.value)}
                        className="flex-1 bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2 text-[10px] text-white focus:outline-none focus:border-zinc-750"
                      />
                      <input 
                        type="date" 
                        value={newMilestoneDate}
                        onChange={(e) => setNewMilestoneDate(e.target.value)}
                        className="bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2 text-[10px] text-white font-mono focus:outline-none focus:border-zinc-750"
                      />
                      <button 
                        type="submit"
                        className="bg-red-600 hover:bg-red-500 text-white p-2 rounded-xl flex items-center justify-center transition-all active-press"
                        title="Add Milestone"
                      >
                        <Plus size={14} />
                      </button>
                    </div>
                  </form>

                  {/* Part C: Project Milestones List */}
                  <div className="border-t border-zinc-900/50 pt-3 max-h-[140px] overflow-y-auto scrollbar-thin scrollbar-thumb-zinc-900 scrollbar-track-transparent pr-1">
                    <span className="text-[9px] font-black text-zinc-500 uppercase tracking-widest block mb-2">
                      Active Milestones ({selectedTimelineProject.milestones?.length || 0})
                    </span>
                    
                    {!selectedTimelineProject.milestones || selectedTimelineProject.milestones.length === 0 ? (
                      <p className="text-[10px] text-zinc-600 italic py-2">No milestones set for this project yet.</p>
                    ) : (
                      <div className="space-y-1.5">
                        {selectedTimelineProject.milestones.map((m) => {
                          const daysRem = Math.ceil((new Date(m.date).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
                          const isOver = daysRem < 0 && !m.completed;
                          
                          return (
                            <div 
                              key={m.id}
                              className="bg-zinc-900/40 border border-zinc-900/80 rounded-xl px-3 py-1.5 flex items-center justify-between gap-2 hover:border-zinc-850 transition-all group/item"
                            >
                              <div className="flex items-center gap-2 min-w-0">
                                <button 
                                  onClick={() => handleToggleMilestone(m.id)}
                                  className="text-zinc-600 hover:text-white transition-colors animate-press"
                                  title="Toggle Completion"
                                >
                                  <CheckCircle2 
                                    size={14} 
                                    className={m.completed ? "text-emerald-500 fill-emerald-500/10" : "text-zinc-700 hover:text-zinc-500"} 
                                  />
                                </button>
                                <div className="min-w-0">
                                  <p className={`text-[10px] font-bold truncate leading-tight ${m.completed ? 'line-through text-zinc-600' : 'text-zinc-300'}`}>
                                    {m.title}
                                  </p>
                                  <span className={`text-[8px] font-mono leading-none ${isOver ? 'text-red-500 font-bold' : 'text-zinc-500'}`}>
                                    {new Date(m.date).toLocaleDateString()} {isOver ? '(Overdue)' : ''}
                                  </span>
                                </div>
                              </div>

                              <button 
                                onClick={() => handleDeleteMilestone(m.id)}
                                className="text-zinc-700 hover:text-red-400 p-1 opacity-0 group-hover/item:opacity-100 transition-all rounded-lg hover:bg-zinc-850/50"
                                title="Delete Milestone"
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
              ) : (
                <div className="flex flex-col items-center justify-center py-12 text-center my-auto">
                  <AlertCircle size={22} className="text-zinc-700 mb-2" />
                  <p className="text-[10px] text-zinc-500 font-bold">No projects found to select</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { label: 'Ideas Flowing', val: stats.ideasGenerated, icon: Lightbulb, color: 'text-yellow-400', bg: 'bg-yellow-400/10' },
          { label: 'Scripts Drafted', val: stats.scriptsWritten, icon: FileText, color: 'text-blue-400', bg: 'bg-blue-400/10' },
          { label: 'Neural Narration', val: 'Active', icon: Waves, color: 'text-purple-400', bg: 'bg-purple-400/10' },
          { label: 'SEO Efficiency', val: '92%', icon: Search, color: 'text-green-400', bg: 'bg-green-400/10' },
        ].map((stat, i) => (
          <div key={i} className="bg-zinc-900 border border-zinc-800 p-6 rounded-3xl hover-lift group">
            <div className="flex items-center gap-3 mb-4">
              <div className={`p-3 rounded-2xl ${stat.bg} ${stat.color} transition-transform duration-500 group-hover:rotate-12`}>
                <stat.icon size={22} />
              </div>
              <span className="text-xs font-bold text-zinc-500 uppercase tracking-widest">{stat.label}</span>
            </div>
            <p className="text-4xl font-extrabold text-white group-hover:text-red-500 transition-colors duration-500">{stat.val}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Creative Velocity Chart */}
        <div className={`lg:col-span-2 bg-zinc-900 border border-zinc-800 rounded-3xl p-8 hover:border-zinc-700 transition-all duration-300 flex flex-col ${
          collapsedWidgets.productionVelocity ? 'h-fit' : 'justify-between'
        }`}>
           <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-4">
                 <h3 className="text-xl font-bold text-white flex items-center gap-3">
                   <BarChart2 size={24} className="text-red-500" /> Production Velocity
                 </h3>
                 {collapsedWidgets.productionVelocity && (
                   <span className="text-[10px] bg-red-500/10 text-red-400 px-2 py-0.5 rounded-full font-bold uppercase tracking-widest animate-pulse">Minimized</span>
                 )}
              </div>
              <div className="flex items-center gap-3">
                 <div className="bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-1.5 text-[10px] font-bold text-zinc-500 uppercase tracking-tighter">
                   Live Data Stream
                 </div>
                 <button
                   onClick={() => toggleWidget('productionVelocity')}
                   className="p-1.5 rounded-lg bg-zinc-950 hover:bg-zinc-800 border border-zinc-850 hover:text-white text-zinc-400 transition-colors cursor-pointer"
                   title={collapsedWidgets.productionVelocity ? "Expand widget" : "Collapse widget"}
                 >
                   {collapsedWidgets.productionVelocity ? <ChevronDown size={14} /> : <ChevronUp size={14} />}
                 </button>
              </div>
           </div>
           {!collapsedWidgets.productionVelocity && (
              <div className="h-64 flex-1 mt-4">
                 <SimpleAreaChart data={activityData} strokeColor="#ef4444" height={200} />
              </div>
           )}
        </div>

        {/* Quick Launch & Pomodoro Stack */}
        <div className="flex flex-col gap-8">
          {/* REAL-TIME TEAM PRESENCE RADAR */}
          <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-8 flex flex-col hover:border-zinc-700 transition-all duration-300">
             <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-4">
                   <h3 className="text-xl font-bold text-white flex items-center gap-3">
                     <Users size={24} className="text-indigo-400" /> Presence Radar
                   </h3>
                   <span className="flex items-center gap-1 text-[8px] bg-emerald-500/10 text-emerald-400 px-2 py-0.5 rounded-full font-black uppercase tracking-widest animate-pulse">
                     ● Live
                   </span>
                </div>
             </div>
             
             <div className="space-y-3.5">
               {presenceList.map((m: any) => (
                 <div key={m.id} className="flex items-center justify-between p-3 bg-zinc-950 border border-zinc-850 rounded-2xl transition-all hover:bg-zinc-900/60 group">
                   <div className="flex items-center gap-3 min-w-0">
                     <div className="relative animate-pulse">
                       <div className="w-9 h-9 rounded-full bg-zinc-800 border border-zinc-700 flex items-center justify-center font-black text-xs text-indigo-400 uppercase tracking-wider">
                         {m.name.slice(0, 2)}
                       </div>
                       <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-500 border-2 border-zinc-950 rounded-full animate-pulse" />
                     </div>
                     <div className="min-w-0">
                       <div className="flex items-center gap-1.5">
                         <span className="text-xs font-black text-white truncate">{m.name}</span>
                         <span className="text-[8px] font-mono text-zinc-500 uppercase px-1 bg-zinc-900 rounded">{m.role}</span>
                       </div>
                       <div className="flex items-center gap-1 mt-0.5">
                         <Activity size={10} className="text-indigo-400 shrink-0" />
                         <span className="text-[10px] text-zinc-400 font-medium truncate lowercase">{m.statusText}</span>
                       </div>
                     </div>
                   </div>
                   
                   <span className="text-[8px] font-mono font-bold text-zinc-500 bg-[#121214] px-2 py-1 rounded-lg border border-zinc-850 tracking-wider uppercase group-hover:text-indigo-400 group-hover:border-indigo-500/20 transition-all shrink-0 ml-2">
                     {m.moduleLabel}
                   </span>
                 </div>
               ))}
             </div>
          </div>

          {/* Quick Launch Tools */}
          <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-8 flex flex-col hover:border-zinc-700 transition-all duration-300">
             <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-4">
                   <h3 className="text-xl font-bold text-white flex items-center gap-3">
                     <Sparkles size={24} className="text-yellow-500" /> Viral Kickstart
                   </h3>
                   {collapsedWidgets.viralKickstart && (
                     <span className="text-[10px] bg-yellow-500/10 text-yellow-400 px-2 py-0.5 rounded-full font-bold uppercase tracking-widest animate-pulse">Minimized</span>
                   )}
                </div>
                <button
                  onClick={() => toggleWidget('viralKickstart')}
                  className="p-1.5 rounded-lg bg-zinc-950 hover:bg-zinc-800 border border-zinc-850 hover:text-white text-zinc-400 transition-colors cursor-pointer"
                  title={collapsedWidgets.viralKickstart ? "Expand widget" : "Collapse widget"}
                >
                  {collapsedWidgets.viralKickstart ? <ChevronDown size={14} /> : <ChevronUp size={14} />}
                </button>
             </div>
             {!collapsedWidgets.viralKickstart && (
                <div className="space-y-4 flex-1 overflow-y-auto custom-scrollbar max-h-[220px]">
                   {[
                     { label: '14-Step Creator Core', icon: <Cpu size={20} />, tool: ToolType.WORKFLOW, color: 'bg-red-500/10 text-red-500' },
                     { label: 'Generate Viral Idea', icon: <Lightbulb size={20} />, tool: ToolType.IDEAS, color: 'bg-yellow-500/10 text-yellow-400' },
                     { label: 'Write Full Script', icon: <FileText size={20} />, tool: ToolType.SCRIPT, color: 'bg-blue-500/10 text-blue-400' },
                     { label: 'Video Studio', icon: <Video size={20} />, tool: ToolType.VIDEO, color: 'bg-red-500/10 text-red-500' },
                     { label: 'AI Video Synthesis', icon: <Clapperboard size={20} />, tool: ToolType.VIDEO_GENERATOR, color: 'bg-orange-500/10 text-orange-500' },
                     { label: 'Neural Narrator', icon: <Waves size={20} />, tool: ToolType.AUDIO, color: 'bg-purple-500/10 text-purple-400' },
                     { 
                       label: 'Create 4K Thumbnail', 
                       icon: <ImageIcon size={20} />, 
                       tool: ToolType.THUMBNAIL, 
                       color: 'bg-green-500/10 text-green-400',
                       payload: { style: 'Cyberpunk' } 
                     },
                   ].map((item: any, i) => (
                     <button 
                       key={i}
                       onClick={() => onNavigate(item.tool, item.payload)}
                       className="w-full flex items-center justify-between p-4 bg-zinc-950 hover:bg-zinc-800 border border-zinc-850 rounded-2xl transition-all group active-press"
                     >
                       <div className="flex items-center gap-4">
                         <span className={`p-2.5 rounded-xl ${item.color} transition-transform duration-300 group-hover:scale-110`}>
                           {item.icon}
                         </span>
                         <span className="text-sm font-bold text-zinc-300 group-hover:text-white transition-colors">{item.label}</span>
                       </div>
                       <ChevronRight size={16} className="text-zinc-700 group-hover:text-white transition-all transform group-hover:translate-x-1" />
                     </button>
                   ))}
                </div>
             )}
          </div>

          {/* POMODORO DEEP WORK FOCUS TIMER */}
          <div className={`bg-zinc-900 border border-zinc-800 rounded-3xl p-8 hover:border-zinc-700 transition-all duration-300 flex flex-col relative overflow-hidden group shadow-xl ${
            collapsedWidgets.focusStudio ? 'h-fit' : 'justify-between'
          }`}>
            {/* Ambient Background Gradient Accent */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-red-600/5 rounded-full blur-[40px] pointer-events-none group-hover:bg-red-500/10 transition-all duration-500" />
            
            <div>
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-4">
                  <h3 className="text-xl font-bold text-white flex items-center gap-3">
                    <span className="flex items-center gap-3"><Timer size={22} className="text-red-500 animate-pulse" /> Focus Studio</span>
                  </h3>
                  {collapsedWidgets.focusStudio && (
                    <span className="text-[10px] bg-red-500/10 text-red-400 px-2 py-0.5 rounded-full font-bold uppercase tracking-widest animate-pulse">Minimized</span>
                  )}
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-[10px] font-bold text-zinc-400 bg-zinc-950 px-3 py-1 rounded-xl border border-zinc-850 uppercase tracking-widest leading-none">
                    Pomodoro Engine
                  </span>
                  <button
                    onClick={() => toggleWidget('focusStudio')}
                    className="p-1.5 rounded-lg bg-zinc-950 hover:bg-zinc-800 border border-zinc-850 hover:text-white text-zinc-400 transition-colors cursor-pointer"
                    title={collapsedWidgets.focusStudio ? "Expand widget" : "Collapse widget"}
                  >
                    {collapsedWidgets.focusStudio ? <ChevronDown size={14} /> : <ChevronUp size={14} />}
                  </button>
                </div>
              </div>

              {!collapsedWidgets.focusStudio && (
                <>
                  {/* Mode Selectors */}
                  <div className="grid grid-cols-3 gap-2 bg-zinc-950 p-1 border border-zinc-850 rounded-2xl mb-6">
                    {(['focus', 'short', 'long'] as const).map((m) => (
                      <button
                        key={m}
                        type="button"
                        onClick={() => setPomoModeAndReset(m)}
                        className={`py-1.5 rounded-xl text-[9px] font-black uppercase tracking-wider transition-all cursor-pointer ${
                          pomoMode === m 
                            ? 'bg-red-600 text-white shadow-xl shadow-red-600/15'
                            : 'text-zinc-400 hover:text-white hover:bg-zinc-900'
                        }`}
                      >
                        {m === 'focus' ? 'Focus' : m === 'short' ? 'Short' : 'Long'}
                      </button>
                    ))}
                  </div>

                  {/* Huge Timer View */}
                  <div className="flex flex-col items-center justify-center py-6 bg-zinc-950/40 border border-zinc-850/60 rounded-[2rem] gap-2 mb-6 text-center">
                    <div className="text-5xl font-black text-white font-mono tracking-tight drop-shadow-xl select-none">
                      {Math.floor(pomoTimeLeft / 60).toString().padStart(2, '0')}
                      <span className="text-red-500 animate-pulse">:</span>
                      {(pomoTimeLeft % 60).toString().padStart(2, '0')}
                    </div>
                    <div className="text-[10px] text-zinc-400 font-extrabold uppercase tracking-widest">
                      {pomoMode === 'focus' ? '🚀 Active Creative Sprint' : pomoMode === 'short' ? '☕ Quick Mind Rest' : '💤 Long Rest Cycle'}
                    </div>
                  </div>

                  {/* Timing progress bar */}
                  <div className="w-full bg-zinc-950 border border-zinc-850 rounded-full h-1.5 mb-6 overflow-hidden">
                    <div 
                      className="bg-gradient-to-r from-red-600 to-amber-500 h-full transition-all duration-300"
                      style={{ width: `${(pomoTimeLeft / getPomoModesDetails().time) * 100}%` }}
                    />
                  </div>
                </>
              )}
            </div>

            {!collapsedWidgets.focusStudio && (
              <>
                {/* Play/Pause control triggers */}
                <div className="flex gap-3 items-center justify-between">
                  <button
                    type="button"
                    onClick={() => setPomoIsRunning(!pomoIsRunning)}
                    className={`flex-1 py-3 px-5 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all cursor-pointer text-center flex justify-center items-center gap-2 ${
                      pomoIsRunning 
                        ? 'bg-amber-600 hover:bg-amber-500 text-white shadow-lg shadow-amber-600/10'
                        : 'bg-red-600 hover:bg-red-500 text-white shadow-lg shadow-red-600/10 font-bold'
                    }`}
                  >
                    {pomoIsRunning ? <Pause size={12} className="fill-white" /> : <Play size={12} className="fill-white" />}
                    {pomoIsRunning ? 'Pause Sprint' : 'Start Focus'}
                  </button>
                  
                  <button
                    type="button"
                    onClick={() => setPomoModeAndReset(pomoMode)}
                    className="bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white px-5 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest border border-zinc-750 cursor-pointer transition-all"
                  >
                    Reset
                  </button>
                </div>
                
                {/* active project indicator banner */}
                {activeProject ? (
                  <div className="mt-4 pt-3 border-t border-zinc-850/60 text-[9.5px] text-zinc-500 font-medium flex items-center justify-between">
                    <span>Task: Syncing to {activeProject.title.substring(0, 24)}...</span>
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  </div>
                ) : (
                  <div className="mt-4 pt-3 border-t border-zinc-850/60 text-[9.5px] text-zinc-500 font-medium flex items-center justify-between">
                    <span>Task: Generic Deep Creative Strategy</span>
                    <span className="w-1.5 h-1.5 rounded-full bg-yellow-500 animate-pulse" />
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      {/* Dynamic Contribution Heatmap visualization */}
      <ContributionHeatmap activities={activities} />

      {/* Daily Performance Summary Widget */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-[2rem] p-8 hover:border-zinc-700 transition-all duration-300">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-6">
          <div className="space-y-1">
            <div className="flex items-center gap-4">
              <h3 className="text-xl font-bold text-white flex items-center gap-3">
                <TrendingUp size={22} className="text-red-500" /> Daily Performance Summary
              </h3>
              {collapsedWidgets.performanceSummary && (
                <span className="text-[10px] bg-red-500/10 text-red-400 px-2 py-0.5 rounded-full font-bold uppercase tracking-widest animate-pulse">Minimized</span>
              )}
            </div>
            <p className="text-zinc-400 text-xs font-medium">Track real-time organic traffic, conversion indexes, and audience growth across networks.</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {!collapsedWidgets.performanceSummary && (
              <>
                <button
                  onClick={handleSyncStats}
                  disabled={isSyncingStats}
                  className="bg-zinc-950 hover:bg-zinc-900 text-zinc-300 hover:text-white px-4 py-2 text-xs font-black uppercase tracking-widest rounded-xl transition-all border border-zinc-850 flex items-center gap-2 disabled:opacity-50 active-press cursor-pointer"
                >
                  <RefreshCw size={12} className={isSyncingStats ? "animate-spin text-red-500" : "text-red-500"} />
                  {isSyncingStats ? 'Syncing...' : 'Sync Feeds'}
                </button>
                <button
                  onClick={() => setIsEditingStats(!isEditingStats)}
                  className={`px-4 py-2 text-xs font-black uppercase tracking-widest rounded-xl transition-all border flex items-center gap-2 active-press cursor-pointer ${
                    isEditingStats
                      ? 'bg-red-500/10 border-red-500/30 text-red-500'
                      : 'bg-zinc-950 hover:bg-zinc-900 border-zinc-850 text-zinc-300 hover:text-white'
                  }`}
                >
                  <Sliders size={12} className="text-yellow-500" />
                  Configure Stats
                </button>
              </>
            )}
            <button
              onClick={() => toggleWidget('performanceSummary')}
              className="p-1.5 rounded-lg bg-zinc-950 hover:bg-zinc-900 border border-zinc-850 hover:text-white text-zinc-400 transition-colors cursor-pointer"
              title={collapsedWidgets.performanceSummary ? "Expand widget" : "Collapse widget"}
            >
              {collapsedWidgets.performanceSummary ? <ChevronDown size={14} /> : <ChevronUp size={14} />}
            </button>
          </div>
        </div>

        {!collapsedWidgets.performanceSummary && (
          <>
        <div className="flex border-b border-zinc-900/60 pb-4 mb-6 overflow-x-auto gap-2 scrollbar-none">
          {[
            { id: 'all', label: 'All Channels', desc: 'Omnichannel rollup', bg: 'hover:bg-red-500/5' },
            { id: 'youtube', label: 'YouTube', desc: 'Video metrics', bg: 'hover:bg-red-500/5' },
            { id: 'tiktok', label: 'TikTok', desc: 'Short-form impressions', bg: 'hover:bg-orange-500/5' },
            { id: 'instagram', label: 'Instagram', desc: 'Audience outreach', bg: 'hover:bg-purple-500/5' }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => {
                setActivePlatform(tab.id as any);
                setEditForm(channelStats);
              }}
              className={`px-5 py-2.5 rounded-2xl text-left border transition-all active-press shrink-0 flex flex-col justify-between cursor-pointer ${
                activePlatform === tab.id
                  ? 'bg-zinc-950 border-red-500 text-white shadow-xl shadow-red-500/5'
                  : 'bg-zinc-950/40 border-transparent text-zinc-400 hover:text-zinc-200'
              } ${tab.bg}`}
            >
              <span className="text-xs font-black uppercase tracking-wider">{tab.label}</span>
              <span className="text-[10px] text-zinc-500 italic font-medium mt-0.5">{tab.desc}</span>
            </button>
          ))}
        </div>

        {/* Inline Metrics Editor Form */}
        {isEditingStats && (
          <form onSubmit={handleSaveEditStats} className="bg-zinc-950 border border-zinc-850 p-6 rounded-3xl mb-8 space-y-6 animate-fade-in">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-850">
              <h4 className="text-sm font-black uppercase tracking-wider text-white">Configure Live Channel Metrics</h4>
              <button
                type="button"
                onClick={() => setIsEditingStats(false)}
                className="text-xs text-zinc-500 hover:text-zinc-300 font-bold cursor-pointer"
              >
                Cancel
              </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* YouTube Editors */}
              <div className="space-y-3 bg-zinc-900/60 p-4 rounded-2xl border border-zinc-850/60">
                <p className="text-[11px] font-black uppercase tracking-widest text-red-500">YouTube Metrics</p>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[10px] font-bold text-zinc-500 block">Views</label>
                    <input
                      type="number"
                      value={editForm.youtube.views}
                      onChange={(e) => setEditForm({
                        ...editForm,
                        youtube: { ...editForm.youtube, views: Math.max(0, parseInt(e.target.value) || 0) }
                      })}
                      className="w-full bg-zinc-950 border border-zinc-850 rounded-lg p-2 text-xs text-white"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-zinc-500 block">Subs Gained</label>
                    <input
                      type="number"
                      value={editForm.youtube.subs}
                      onChange={(e) => setEditForm({
                        ...editForm,
                        youtube: { ...editForm.youtube, subs: Math.max(0, parseInt(e.target.value) || 0) }
                      })}
                      className="w-full bg-zinc-950 border border-zinc-850 rounded-lg p-2 text-xs text-white"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-zinc-500 block">CTR (%)</label>
                    <input
                      type="number"
                      step="0.1"
                      value={editForm.youtube.ctr}
                      onChange={(e) => setEditForm({
                        ...editForm,
                        youtube: { ...editForm.youtube, ctr: Math.max(0, parseFloat(e.target.value) || 0) }
                      })}
                      className="w-full bg-zinc-950 border border-zinc-850 rounded-lg p-2 text-xs text-white"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-zinc-500 block">Watch Hrs</label>
                    <input
                      type="number"
                      value={editForm.youtube.watchTime}
                      onChange={(e) => setEditForm({
                        ...editForm,
                        youtube: { ...editForm.youtube, watchTime: Math.max(0, parseInt(e.target.value) || 0) }
                      })}
                      className="w-full bg-zinc-950 border border-zinc-855 rounded-lg p-2 text-xs text-white"
                    />
                  </div>
                </div>
              </div>

              {/* TikTok Editors */}
              <div className="space-y-3 bg-zinc-900/60 p-4 rounded-2xl border border-zinc-850/60">
                <p className="text-[11px] font-black uppercase tracking-widest text-orange-500">TikTok Metrics</p>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[10px] font-bold text-zinc-500 block">Views</label>
                    <input
                      type="number"
                      value={editForm.tiktok.views}
                      onChange={(e) => setEditForm({
                        ...editForm,
                        tiktok: { ...editForm.tiktok, views: Math.max(0, parseInt(e.target.value) || 0) }
                      })}
                      className="w-full bg-zinc-950 border border-zinc-850 rounded-lg p-2 text-xs text-white"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-zinc-500 block">Followers Gained</label>
                    <input
                      type="number"
                      value={editForm.tiktok.subs}
                      onChange={(e) => setEditForm({
                        ...editForm,
                        tiktok: { ...editForm.tiktok, subs: Math.max(0, parseInt(e.target.value) || 0) }
                      })}
                      className="w-full bg-zinc-950 border border-zinc-850 rounded-lg p-2 text-xs text-white"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-zinc-500 block">CTR (%)</label>
                    <input
                      type="number"
                      step="0.1"
                      value={editForm.tiktok.ctr}
                      onChange={(e) => setEditForm({
                        ...editForm,
                        tiktok: { ...editForm.tiktok, ctr: Math.max(0, parseFloat(e.target.value) || 0) }
                      })}
                      className="w-full bg-zinc-950 border border-zinc-850 rounded-lg p-2 text-xs text-white"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-zinc-500 block">Watch Hrs</label>
                    <input
                      type="number"
                      value={editForm.tiktok.watchTime}
                      onChange={(e) => setEditForm({
                        ...editForm,
                        tiktok: { ...editForm.tiktok, watchTime: Math.max(0, parseInt(e.target.value) || 0) }
                      })}
                      className="w-full bg-zinc-950 border border-zinc-855 rounded-lg p-2 text-xs text-white"
                    />
                  </div>
                </div>
              </div>

              {/* Instagram Editors */}
              <div className="space-y-3 bg-zinc-900/60 p-4 rounded-2xl border border-zinc-850/60">
                <p className="text-[11px] font-black uppercase tracking-widest text-purple-400">Instagram Metrics</p>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[10px] font-bold text-zinc-500 block">Impressions</label>
                    <input
                      type="number"
                      value={editForm.instagram.views}
                      onChange={(e) => setEditForm({
                        ...editForm,
                        instagram: { ...editForm.instagram, views: Math.max(0, parseInt(e.target.value) || 0) }
                      })}
                      className="w-full bg-zinc-950 border border-zinc-850 rounded-lg p-2 text-xs text-white"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-zinc-500 block">Followers Gained</label>
                    <input
                      type="number"
                      value={editForm.instagram.subs}
                      onChange={(e) => setEditForm({
                        ...editForm,
                        instagram: { ...editForm.instagram, subs: Math.max(0, parseInt(e.target.value) || 0) }
                      })}
                      className="w-full bg-zinc-950 border border-zinc-850 rounded-lg p-2 text-xs text-white"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-zinc-500 block">Engagement (%)</label>
                    <input
                      type="number"
                      step="0.1"
                      value={editForm.instagram.ctr}
                      onChange={(e) => setEditForm({
                        ...editForm,
                        instagram: { ...editForm.instagram, ctr: Math.max(0, parseFloat(e.target.value) || 0) }
                      })}
                      className="w-full bg-zinc-950 border border-zinc-850 rounded-lg p-2 text-xs text-white"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-zinc-500 block">Watch Hrs</label>
                    <input
                      type="number"
                      value={editForm.instagram.watchTime}
                      onChange={(e) => setEditForm({
                        ...editForm,
                        instagram: { ...editForm.instagram, watchTime: Math.max(0, parseInt(e.target.value) || 0) }
                      })}
                      className="w-full bg-zinc-950 border border-zinc-855 rounded-lg p-2 text-xs text-white"
                    />
                  </div>
                </div>
              </div>
            </div>
            <div className="flex gap-2 justify-end">
              <button
                type="button"
                onClick={() => {
                  setEditForm(DEFAULT_CHANNEL_STATS);
                  setChannelStats(DEFAULT_CHANNEL_STATS);
                  localStorage.setItem('ranktica_channel_stats', JSON.stringify(DEFAULT_CHANNEL_STATS));
                  setIsEditingStats(false);
                  toast.success("Metrics restored to default baseline indexes.");
                }}
                className="bg-zinc-900 border border-zinc-800 hover:bg-zinc-850 text-zinc-400 hover:text-white px-5 py-2.5 rounded-xl text-xs font-bold cursor-pointer"
              >
                Reset Defaults
              </button>
              <button
                type="submit"
                className="bg-red-650 hover:bg-red-500 text-white px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider cursor-pointer"
              >
                Save Operational Metrics
              </button>
            </div>
          </form>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Interactive Metric Cards (Col span 2) */}
          <div className="lg:col-span-2 space-y-6">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {[
                { id: 'views', label: 'Impressions', val: currentStats.views.toLocaleString(), change: currentStats.viewsChange },
                { id: 'subs', label: activePlatform === 'youtube' ? 'Subscribers' : 'New Followers', val: currentStats.subs.toLocaleString(), change: currentStats.subsChange },
                { id: 'ctr', label: activePlatform === 'instagram' ? 'Engagement Rate' : 'CTR Rate', val: `${currentStats.ctr}%`, change: currentStats.ctrChange },
                { id: 'watchTime', label: 'Watch Hrs', val: `${currentStats.watchTime.toLocaleString()}h`, change: currentStats.watchTimeChange }
              ].map((card) => {
                const isSelected = activePlatformMetric === card.id;
                const isPositive = card.change >= 0;
                
                return (
                  <button
                    key={card.id}
                    type="button"
                    onClick={() => setActivePlatformMetric(card.id as any)}
                    className={`p-4 bg-zinc-955 border rounded-2xl text-left transition-all hover-lift active-press flex flex-col justify-between h-28 cursor-pointer ${
                      isSelected 
                        ? 'border-red-500 ring-2 ring-red-500/25' 
                        : 'border-zinc-850 hover:border-zinc-750'
                    }`}
                  >
                    <div>
                      <p className="text-[10px] font-black uppercase tracking-widest text-zinc-500 line-clamp-1">{card.label}</p>
                      <h4 className="text-xl font-extrabold text-white mt-1 leading-snug">{card.val}</h4>
                    </div>
                    
                    <div className={`flex items-center gap-1 text-[10px] font-black mt-2 self-start ${
                      isPositive ? 'text-emerald-500' : 'text-rose-500'
                    }`}>
                      {isPositive ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
                      <span>{isPositive ? '+' : ''}{card.change}%</span>
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Sparkline trend over week */}
            <div className="bg-zinc-955 border border-zinc-850 rounded-3xl p-6 h-60 flex flex-col justify-between">
              <div className="flex items-center justify-between mb-4">
                <span className="text-[10px] font-black uppercase tracking-widest text-zinc-400">
                  Daily {activePlatformMetric === 'views' ? 'Impressions' : activePlatformMetric === 'subs' ? 'Audience Growth' : activePlatformMetric === 'ctr' ? 'CTR Percentage' : 'Watch Hours'} Trend
                </span>
                <span className="text-[9px] text-zinc-500 font-bold bg-zinc-900 border border-zinc-800 px-2 py-0.5 rounded-full">
                  7-Day Sparkline
                </span>
              </div>
              <div className="h-40 flex-1 mt-4">
                <SimpleAreaChart data={platformTrendData} strokeColor="#ef4444" height={130} />
              </div>
            </div>
          </div>

          {/* AI Advisor Panel (Col span 1) */}
          <div className="bg-zinc-955 border border-zinc-850 rounded-3xl p-6 flex flex-col justify-between hover:border-zinc-750 transition-all">
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <span className="p-1.5 rounded-lg bg-red-500/10 text-red-500">
                  <Sparkles size={16} />
                </span>
                <h4 className="text-sm font-black uppercase tracking-widest text-white">AI Audience Insights</h4>
              </div>
              
              <div className="space-y-2">
                <p className="text-xs font-black text-red-405 capitalize leading-snug">{aiGrowthAdvice.title}</p>
                <p className="text-xs text-zinc-400 leading-relaxed font-semibold">{aiGrowthAdvice.advice}</p>
              </div>
            </div>

            <div className="pt-6 border-t border-zinc-850/40 mt-6 space-y-3">
              <div className="flex items-center justify-between text-[10px] text-zinc-500">
                <span className="font-bold">Sync Level: OK</span>
                <span className="font-mono">REACTIVE INDEX</span>
              </div>
              <button
                onClick={() => onNavigate(aiGrowthAdvice.actionTool)}
                className="w-full bg-zinc-900 border border-zinc-800 hover:bg-zinc-800 text-white py-3 rounded-xl text-xs font-black uppercase tracking-wider flex items-center justify-center gap-2 transition-all active-press cursor-pointer"
              >
                {aiGrowthAdvice.actionLabel} <ArrowRight size={12} className="text-red-500" />
              </button>
            </div>
          </div>
        </div>
        </>
       )}
      </div>

      {/* Row 2: Daily Creator Check-in Widget & Recent Activity Log */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Daily Creator Check-in Widget */}
        <div className={`lg:col-span-1 bg-zinc-900 border border-zinc-800 rounded-[2rem] p-8 hover:border-zinc-705 transition-all relative overflow-hidden group ${
          collapsedWidgets.creatorCheckIn ? 'h-fit' : ''
        }`}>
           <div className="absolute top-0 right-0 w-32 h-32 bg-red-650/5 rounded-full blur-2xl pointer-events-none" />
           
           <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-4">
                 <h3 className="text-xl font-bold text-white flex items-center gap-3">
                   <Flame size={22} className="text-orange-500" /> Creator Check-In
                 </h3>
                 {collapsedWidgets.creatorCheckIn && (
                   <span className="text-[10px] bg-orange-500/10 text-orange-400 px-2 py-0.5 rounded-full font-bold uppercase tracking-widest animate-pulse">Minimized</span>
                 )}
              </div>
              <div className="flex items-center gap-2">
                 <div className="flex items-center gap-1.5 px-3 py-1 bg-orange-500/10 border border-orange-500/20 rounded-full text-orange-500 text-[10px] font-black uppercase">
                    <Flame size={12} fill="currentColor" /> {checkIn.streak} d streak
                 </div>
                 <button
                   onClick={() => toggleWidget('creatorCheckIn')}
                   className="p-1.5 rounded-lg bg-zinc-950 hover:bg-zinc-800 border border-zinc-850 hover:text-white text-zinc-400 transition-colors cursor-pointer"
                   title={collapsedWidgets.creatorCheckIn ? "Expand widget" : "Collapse widget"}
                 >
                   {collapsedWidgets.creatorCheckIn ? <ChevronDown size={14} /> : <ChevronUp size={14} />}
                 </button>
              </div>
           </div>

           {!collapsedWidgets.creatorCheckIn && (
              <div className="space-y-6">
                 {/* Goal gauge progress */}
                 <div className="bg-zinc-950 border border-zinc-850 rounded-2xl p-4 space-y-2">
                    <div className="flex justify-between items-center text-xs">
                       <span className="text-zinc-400 font-bold">Daily Content Target</span>
                       <span className="text-white font-black">{checkIn.progress} / {checkIn.goal} Done</span>
                    </div>
                    <div className="w-full h-3 bg-zinc-900 rounded-full overflow-hidden border border-zinc-800">
                       <div 
                         className="h-full bg-gradient-to-r from-orange-500 to-red-600 transition-all duration-700 ease-out" 
                         style={{ width: `${(checkIn.progress / checkIn.goal) * 100}%` }}
                       />
                    </div>
                    <p className="text-[10px] text-zinc-500 leading-normal mt-1">Check-in daily, write scripts, or build thumbnails to secure your streak goals.</p>
                 </div>

                 {/* Weak Calendar visualization */}
                 <div className="grid grid-cols-7 gap-1.5 text-center">
                    {daysOfWeek.map((day, index) => {
                       // Check-in status mapping representational glow
                       // SUN-SAT representation: Today vs Past Checked-In days
                       const isToday = index === todayIndex;
                       const isChecked = index < todayIndex || (isToday && checkedInToday);
                       
                       return (
                         <div key={day} className="space-y-1">
                            <span className={`text-[9px] font-black uppercase ${isToday ? 'text-orange-500' : 'text-zinc-500'}`}>{day}</span>
                            <div className={`h-8 rounded-lg flex items-center justify-center transition-all border ${
                              isChecked 
                                ? 'bg-orange-500/15 border-orange-500/30 text-orange-400' 
                                : isToday 
                                  ? 'bg-zinc-950 border-orange-500/50 text-orange-500 border-dashed animate-pulse' 
                                  : 'bg-zinc-950 border-zinc-850 text-zinc-700'
                            }`}>
                               {isChecked ? <CheckCircle2 size={13} fill="currentColor" className="text-zinc-900 fill-orange-500" /> : <div className="w-1.5 h-1.5 rounded-full bg-current" />}
                            </div>
                         </div>
                       );
                    })}
                 </div>

                 {/* Action checkin button */}
                 <button 
                   type="button"
                   onClick={handleCheckIn}
                   disabled={checkedInToday}
                   className={`w-full py-3.5 rounded-xl font-black uppercase text-[10px] tracking-widest transition-all ${
                     checkedInToday 
                       ? 'bg-zinc-950 border border-zinc-850 text-zinc-500 cursor-not-allowed' 
                       : 'bg-orange-600 hover:bg-orange-500 active-press text-white border border-orange-500 shadow-lg shadow-orange-600/15'
                   }`}
                 >
                    {checkedInToday ? "Checked in for Today (Streak Safe)" : "Complete Check-In Verification"}
                 </button>
              </div>
           )}
        </div>

        {/* Recent Activity Panel */}
        {/* Active Project Assets Panel */}
        <div className={`lg:col-span-1 bg-zinc-900 border border-zinc-800 rounded-[2rem] p-8 hover:border-zinc-705 transition-all ${
          collapsedWidgets.recentAssets ? 'h-fit' : ''
        }`}>
           <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-4">
                 <h3 className="text-xl font-bold text-white flex items-center gap-3">
                   <FolderOpen size={22} className="text-purple-500 animate-pulse" /> Recent Assets
                 </h3>
                 {collapsedWidgets.recentAssets && (
                   <span className="text-[10px] bg-purple-500/10 text-purple-400 px-2 py-0.5 rounded-full font-bold uppercase tracking-widest animate-pulse">Minimized</span>
                 )}
              </div>
              <div className="flex items-center gap-2">
                 <p className="text-[10px] font-black text-purple-500 uppercase tracking-widest">Active Project</p>
                 <button
                   onClick={() => toggleWidget('recentAssets')}
                   className="p-1.5 rounded-lg bg-zinc-950 hover:bg-zinc-800 border border-zinc-850 hover:text-white text-zinc-400 transition-colors cursor-pointer"
                   title={collapsedWidgets.recentAssets ? "Expand widget" : "Collapse widget"}
                 >
                   {collapsedWidgets.recentAssets ? <ChevronDown size={14} /> : <ChevronUp size={14} />}
                 </button>
              </div>
           </div>

           {!collapsedWidgets.recentAssets && (
              <div className="space-y-4">
              {!activeProject ? (
                <div className="py-12 flex flex-col items-center justify-center border border-dashed border-zinc-850 rounded-2xl text-zinc-650 text-center space-y-2">
                   <FolderOpen size={24} className="opacity-15" />
                   <div className="text-xs font-bold text-zinc-400">No Active Project Mapped</div>
                   <p className="text-[9px] text-zinc-500 max-w-xs leading-normal">Configure or select an active project in the selector to assemble a real-time asset checklist.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="bg-zinc-950/70 border border-zinc-850 p-4 rounded-2xl space-y-3">
                     <div className="flex justify-between items-start">
                        <div>
                           <p className="text-[9.5px] font-black tracking-widest text-zinc-500 uppercase">Context Target</p>
                           <h4 className="text-sm font-bold text-white leading-snug mt-1">{activeProject.title}</h4>
                           <p className="text-[10px] text-zinc-400 leading-normal mt-0.5">{activeProject.niche}</p>
                        </div>
                        <div className="flex flex-col items-end gap-1">
                           <label className="text-[8px] font-black tracking-widest text-zinc-500 uppercase">Asset Status</label>
                           <select
                             value={activeProject.status}
                             onChange={async (e) => {
                               const newStatus = e.target.value;
                               if (newStatus === 'archive') {
                                 await toggleArchiveProject(activeProject.id);
                                 toast.success(`Successfully archived "${activeProject.title}"`);
                               } else {
                                 await updateProject(activeProject.id, { status: newStatus as any });
                                 toast.success(`Status updated to ${newStatus}`);
                               }
                             }}
                             className="bg-zinc-900 border border-zinc-800 text-[9px] font-black uppercase tracking-wider text-zinc-300 rounded px-2 py-0.5 focus:outline-none focus:border-zinc-700 cursor-pointer"
                           >
                             <option value="idea">Idea</option>
                             <option value="scripting">Scripting</option>
                             <option value="production">Production</option>
                             <option value="scheduled">Scheduled</option>
                             <option value="published">Published</option>
                             <option value="archive">Archive 📁</option>
                           </select>
                        </div>
                     </div>

                     {activeProject.status === 'published' && (
                       <div className="bg-emerald-950/20 border border-emerald-900/30 rounded-2xl p-4 space-y-2.5 animate-fade-in">
                         <div className="flex gap-2">
                           <CheckCircle2 className="text-emerald-500 shrink-0 mt-0.5" size={14} />
                           <div>
                             <p className="text-white text-xs font-bold">Automation Complete</p>
                             <p className="text-[10px] text-zinc-400 leading-normal mt-0.5">
                               This YouTube automation asset is published! You can archive it to keep your active workspace clean.
                             </p>
                           </div>
                         </div>
                         <button
                           type="button"
                           onClick={async () => {
                             await toggleArchiveProject(activeProject.id);
                             toast.success(`Successfully archived "${activeProject.title}"`);
                           }}
                           className="w-full py-2 bg-emerald-600/10 hover:bg-emerald-600 text-emerald-400 hover:text-white border border-emerald-500/20 hover:border-emerald-500 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                         >
                           <Archive size={12} />
                           Archive Completed Asset
                         </button>
                       </div>
                     )}

                     {/* Dynamic automated classification tags display */}
                     <div className="pt-3 border-t border-zinc-850/60 flex flex-wrap items-center gap-1.5">
                       {activeProject.assets?.tags && activeProject.assets.tags.length > 0 ? (
                         <>
                           {activeProject.assets.tags.map((tag: string, i: number) => {
                             let pillStyle = "bg-zinc-900 border-zinc-805 text-zinc-400";
                             if (tag === 'educational') pillStyle = "bg-blue-500/10 border-blue-500/20 text-blue-400";
                             else if (tag === 'entertainment') pillStyle = "bg-amber-500/10 border-amber-500/20 text-amber-400";
                             else if (tag === 'vlog') pillStyle = "bg-emerald-500/10 border-emerald-500/20 text-emerald-400";
                             else if (['tutorial', 'tech', 'storytelling', 'gaming'].includes(tag)) pillStyle = "bg-purple-500/10 border-purple-500/20 text-purple-400";
                             
                             return (
                               <span key={i} className={`text-[8.5px] font-black uppercase tracking-widest px-2 py-0.5 rounded border ${pillStyle}`}>
                                 {tag}
                               </span>
                             );
                           })}
                           <button
                             onClick={handleTriggerRecategorize}
                             disabled={tagging}
                             className="text-[8.5px] font-black text-purple-400 hover:text-purple-300 flex items-center gap-0.5 uppercase tracking-widest ml-auto disabled:opacity-50 cursor-pointer"
                           >
                             <Sparkles size={8} className={tagging ? "animate-spin" : ""} /> {tagging ? "Tagging" : "Retag"}
                           </button>
                         </>
                       ) : (
                         <div className="flex items-center justify-between w-full">
                           <span className="text-[8.5px] text-zinc-500 italic">No automated categories yet</span>
                           <button
                             onClick={handleTriggerRecategorize}
                             disabled={tagging}
                             className="text-[8.5px] bg-purple-500/10 hover:bg-purple-500/20 border border-purple-500/20 text-purple-400 font-extrabold uppercase tracking-widest py-0.5 px-2 rounded flex items-center gap-1 cursor-pointer"
                           >
                             <Sparkles size={8} className={tagging ? "animate-spin" : ""} /> Auto-Tag
                           </button>
                         </div>
                       )}
                     </div>
                  </div>

                  {/* Real-time Collaboration presence indicators */}
                  {collaborators && collaborators.length > 1 && (
                    <div className="flex items-center gap-2 px-3 py-2 bg-purple-500/5 border border-purple-500/10 rounded-xl">
                      <div className="flex -space-x-1.5 overflow-hidden">
                        {collaborators.map((col, idx) => {
                          const initial = col.name.trim().substring(0, 1).toUpperCase();
                          return (
                            <div 
                              key={idx} 
                              className="w-5 h-5 rounded-full bg-purple-600 border border-zinc-900 text-[9px] font-black text-white flex items-center justify-center cursor-help"
                              title={`${col.name} (${col.userId}) - Active tool: ${col.activeTool || 'Dashboard'}`}
                            >
                              {initial}
                            </div>
                          );
                        })}
                      </div>
                      <p className="text-[8.5px] font-bold text-purple-400 capitalize anim-pulse">
                        {collaborators.length} collaborators active on this project
                      </p>
                    </div>
                  )}

                  {/* Dynamic Concept Preview Carousel */}
                  <div className="bg-zinc-950/40 border border-zinc-850 p-4 rounded-3xl space-y-3 overflow-hidden relative theme-glow-shadow">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="flex h-2 w-2 relative">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                          <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
                        </span>
                        <p className="text-[9px] font-black uppercase tracking-wider text-zinc-400">Live Concepts Carousel</p>
                      </div>
                      <span className="text-[8px] font-bold text-zinc-400 bg-zinc-900 border border-zinc-800 px-2 py-0.5 rounded-full uppercase tracking-widest">{CAROUSEL_DRAFTS[carouselIndex].type}</span>
                    </div>

                    <div className="relative aspect-video rounded-xl overflow-hidden border border-zinc-800/80 group">
                      <img 
                        src={CAROUSEL_DRAFTS[carouselIndex].img} 
                        alt={CAROUSEL_DRAFTS[carouselIndex].title} 
                        referrerPolicy="no-referrer"
                        className="w-full h-full object-cover transition-transform duration-700 ease-out scale-102 group-hover:scale-105"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/40 to-transparent flex flex-col justify-end p-4">
                        <span className="text-[7.5px] font-black uppercase bg-red-650 border border-red-500/20 text-white px-1.5 py-0.5 rounded self-start mb-1 tracking-widest leading-none shadow shadow-red-650/40">{CAROUSEL_DRAFTS[carouselIndex].tag}</span>
                        <h5 className="text-[11px] font-black text-white leading-snug line-clamp-1">{CAROUSEL_DRAFTS[carouselIndex].title}</h5>
                        <p className="text-[9px] text-zinc-500 line-clamp-1 leading-normal mt-0.5">{CAROUSEL_DRAFTS[carouselIndex].details}</p>
                      </div>
                    </div>

                    {/* Progress indicators */}
                    <div className="flex gap-1.5 justify-center pt-1">
                      {CAROUSEL_DRAFTS.map((_, idx) => (
                        <button
                          key={idx}
                          onClick={() => setCarouselIndex(idx)}
                          className={`h-1 rounded-full transition-all duration-300 ${carouselIndex === idx ? 'w-4 bg-red-500' : 'w-1.5 bg-zinc-800 hover:bg-zinc-700'}`}
                          title={`Navigate to slide ${idx + 1}`}
                        />
                      ))}
                    </div>
                  </div>

                  <div className="space-y-2">
                    {/* Script asset row */}
                    <div 
                      className="flex items-center justify-between p-3 bg-zinc-950 hover:bg-zinc-800/60 border border-zinc-850 rounded-xl transition-all group cursor-pointer"
                    >
                       <div className="flex items-center gap-3 min-w-0" onClick={() => onNavigate(ToolType.SCRIPT)}>
                          <div className={`p-2 rounded-lg bg-blue-500/10 text-blue-400 shrink-0`}>
                             <FileText size={14} />
                          </div>
                          <div className="min-w-0">
                             <p className="text-xs font-bold text-zinc-300">Video Script</p>
                             <p className="text-[9px] text-zinc-500 truncate">
                               {activeProject.assets?.script 
                                 ? `${activeProject.assets.script.length} chars generated` 
                                 : "Not generated yet"}
                             </p>
                          </div>
                       </div>
                       <div className="flex items-center gap-1 shrink-0">
                         {activeProject.assets?.script && (
                           <button
                             onClick={(e) => {
                               e.stopPropagation();
                               setQuickViewType('script');
                             }}
                             className="p-1.5 hover:bg-zinc-800 text-zinc-400 hover:text-white rounded-lg transition-colors cursor-pointer"
                             title="Quick View Video Script"
                           >
                             <Eye size={13} />
                           </button>
                         )}
                         <ChevronRight size={12} className="text-zinc-600" />
                       </div>
                    </div>

                    {/* Thumbnail asset row */}
                    <div 
                      className="flex items-center justify-between p-3 bg-zinc-950 hover:bg-zinc-800/60 border border-zinc-850 rounded-xl transition-all group cursor-pointer"
                    >
                       <div className="flex items-center gap-3 min-w-0" onClick={() => onNavigate(ToolType.THUMBNAIL)}>
                          <div className={`p-2 rounded-lg bg-orange-500/10 text-orange-400 shrink-0`}>
                             <ImageIcon size={14} />
                          </div>
                          <div className="min-w-0">
                             <p className="text-xs font-bold text-zinc-300">Thumbnail Canvas</p>
                             <p className="text-[9px] text-zinc-500 truncate">
                               {activeProject.assets?.thumbnail 
                                 ? "Render complete (HD)" 
                                 : "Click to generate assets"}
                             </p>
                          </div>
                       </div>
                       <div className="flex items-center gap-1 shrink-0">
                         {activeProject.assets?.thumbnail && (
                           <button
                             onClick={(e) => {
                               e.stopPropagation();
                               setQuickViewType('thumbnail');
                             }}
                             className="p-1.5 hover:bg-zinc-800 text-zinc-400 hover:text-white rounded-lg transition-colors cursor-pointer"
                             title="Quick View Thumbnail Graphic"
                           >
                             <Eye size={13} />
                           </button>
                         )}
                         <ChevronRight size={12} className="text-zinc-600" />
                       </div>
                    </div>

                    {/* Audio Voiceover asset row */}
                    <div 
                      className="flex items-center justify-between p-3 bg-zinc-950 hover:bg-zinc-800/60 border border-zinc-850 rounded-xl transition-all group cursor-pointer"
                    >
                       <div className="flex items-center gap-3 min-w-0" onClick={() => onNavigate(ToolType.AUDIO)}>
                          <div className={`p-2 rounded-lg bg-purple-500/10 text-purple-400 shrink-0`}>
                             <Waves size={14} />
                          </div>
                          <div className="min-w-0">
                             <p className="text-xs font-bold text-zinc-300">Voice Synthesis</p>
                             <p className="text-[9px] text-zinc-500 truncate">
                               {activeProject.assets?.videoUri 
                                 ? "Cinematic audio ready" 
                                 : "TTS synthesis pending"}
                             </p>
                          </div>
                       </div>
                       <div className="flex items-center gap-1 shrink-0">
                         {activeProject.assets?.videoUri && (
                           <button
                             onClick={(e) => {
                               e.stopPropagation();
                               setQuickViewType('voice');
                             }}
                             className="p-1.5 hover:bg-zinc-800 text-zinc-400 hover:text-white rounded-lg transition-colors cursor-pointer"
                             title="Quick View/Play Media Track"
                           >
                             <Eye size={13} />
                           </button>
                         )}
                         <ChevronRight size={12} className="text-zinc-600" />
                       </div>
                    </div>
                  </div>
                </div>
              )}
              </div>
           )}
        </div>

        {/* Recent Workspace Activity & Telemetry Panel */}
        <div className="lg:col-span-1 bg-zinc-900 border border-zinc-800 rounded-[2rem] p-8 hover:border-zinc-705 transition-all flex flex-col h-full">
           <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-white flex items-center gap-3">
                <Clock size={22} className="text-red-500 animate-pulse" /> Recent Activity Log
              </h3>
              <button
                type="button"
                onClick={() => {
                  if (confirm("Are you sure you want to clear your Workspace Recent Activity log history?")) {
                    localStorage.removeItem('ranktica_activities');
                    setActivities([]);
                    toast.success("Activity logs successfully purged.");
                  }
                }}
                className="text-[9px] font-black uppercase text-zinc-500 hover:text-red-400 tracking-wider bg-zinc-950 px-2 py-1.5 rounded-lg border border-zinc-850 cursor-pointer transition-colors"
              >
                Clear Log
              </button>
           </div>
           
           {/* Most Used Tools Section */}
            <div className="mb-6 p-4 bg-zinc-950/60 border border-zinc-850/80 rounded-2xl shrink-0">
               <h4 className="text-[10px] font-black uppercase tracking-widest text-zinc-400 mb-3 flex items-center justify-between">
                 <span>Most Used Tools</span>
                 <span className="text-[8px] text-zinc-500 normal-case font-medium">Based on recent actions</span>
               </h4>
               {toolStats.length > 0 ? (
                 <div className="space-y-3">
                   {toolStats.slice(0, 4).map((item) => {
                     // Determine color based on tool type
                     let barColor = "bg-red-500";
                     let bgAccent = "bg-red-500/10";
                     let textColor = "text-red-400";
                     if (item.type === 'ideas') {
                       barColor = "bg-yellow-400";
                       bgAccent = "bg-yellow-400/10";
                       textColor = "text-yellow-400";
                     } else if (item.type === 'thumbnail') {
                       barColor = "bg-orange-500";
                       bgAccent = "bg-orange-500/10";
                       textColor = "text-orange-400";
                     } else if (item.type === 'seo') {
                       barColor = "bg-green-400";
                       bgAccent = "bg-green-400/10";
                       textColor = "text-green-400";
                     } else if (item.type === 'script') {
                       barColor = "bg-blue-400";
                       bgAccent = "bg-blue-400/10";
                       textColor = "text-blue-400";
                     } else if (item.type === 'checkin') {
                       barColor = "bg-red-500";
                       bgAccent = "bg-red-500/10";
                       textColor = "text-red-400";
                     }

                     return (
                       <div key={item.tool} className="space-y-1 group/tool">
                         <div className="flex items-center justify-between text-[11px] font-bold">
                           <div className="flex items-center gap-1.5 text-zinc-300">
                             <span className={`p-1 rounded-md ${bgAccent} ${textColor} flex items-center justify-center shrink-0`}>
                               {getActivityIcon(item.type)}
                             </span>
                             <span className="group-hover/tool:text-white transition-colors truncate max-w-[120px]">{item.tool}</span>
                           </div>
                           <span className="text-zinc-400 shrink-0 text-[10px]">
                             {item.count} {item.count === 1 ? 'use' : 'uses'} <span className="text-[9px] font-normal text-zinc-500">({item.percentage}%)</span>
                           </span>
                         </div>
                         <div className="w-full h-1.5 bg-zinc-900 rounded-full overflow-hidden">
                           <div 
                             className={`h-full ${barColor} rounded-full transition-all duration-500`}
                             style={{ width: `${item.percentage}%` }}
                           />
                         </div>
                       </div>
                     );
                   })}
                 </div>
               ) : (
                 <p className="text-[10px] text-zinc-650 italic text-center py-2">No tool usage recorded yet.</p>
               )}
            </div>

            {/* Filtering & Searching Controls */}
           <div className="space-y-3 mb-6 shrink-0">
             <input
               type="text"
               value={activitySearch}
               onChange={(e) => setActivitySearch(e.target.value)}
               placeholder="Search logged actions..."
               className="w-full bg-zinc-950 border border-zinc-850 rounded-xl px-4 py-2.5 text-xs text-zinc-350 focus:outline-none focus:border-red-500/50 placeholder-zinc-600 font-medium"
             />
             
             <div className="flex gap-1.5 overflow-x-auto scrollbar-none py-0.5">
               {["All", "Ideas", "Scripts", "Thumbnails", "SEO", "Videos", "Shorts", "Agent", "System", "Check-ins"].map((cat) => (
                 <button
                   key={cat}
                   type="button"
                   onClick={() => setActivityTypeFilter(cat)}
                   className={`px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-wider transition-all whitespace-nowrap cursor-pointer ${
                     activityTypeFilter === cat
                       ? "bg-red-500/10 border border-red-500/30 text-red-500"
                       : "bg-zinc-950 border border-transparent text-zinc-500 hover:text-zinc-300"
                   }`}
                 >
                   {cat}
                 </button>
               ))}
             </div>
           </div>

           <div className="space-y-3 flex-grow overflow-y-auto max-h-[360px] custom-scrollbar pr-0.5">
              {filteredActivities.length > 0 ? filteredActivities.map((act) => (
                <div key={act.id} 
                   onClick={() => {
                     if (act.type === 'ideas') onNavigate(ToolType.IDEAS);
                     else if (act.type === 'thumbnail') onNavigate(ToolType.THUMBNAIL);
                     else if (act.type === 'seo') onNavigate(ToolType.SEO);
                     else if (act.type === 'script') onNavigate(ToolType.SCRIPT);
                     else if (act.type === 'video') onNavigate(ToolType.VIDEO_GENERATOR);
                     else if (act.type === 'shorts') onNavigate(ToolType.SHORTS_GENERATOR);
                     else if (act.type === 'agent') onNavigate(ToolType.AGENT_BUS);
                   }}
                   className="flex items-center gap-4 p-3.5 bg-zinc-950 border border-zinc-850/80 rounded-2xl hover:border-zinc-800 hover:bg-zinc-900/40 transition-all cursor-pointer group active:scale-[0.98]"
                   title="Click to switch to this creative tool"
                 >
                   <div className="p-2.5 bg-zinc-900 border border-zinc-800 rounded-xl group-hover:scale-110 transition-transform hover:rotate-6">
                      {getActivityIcon(act.type)}
                   </div>
                   <div className="flex-1 min-w-0">
                      <p className="text-xs font-bold text-zinc-200 line-clamp-1 leading-normal">{act.action}</p>
                      <div className="flex items-center gap-2 mt-1">
                         <span className="text-[9px] font-black text-zinc-500 uppercase">{act.tool}</span>
                         <span className="w-1 h-1 rounded-full bg-zinc-800" />
                         <span className="text-[9px] text-zinc-650 font-semibold">{act.time}</span>
                      </div>
                   </div>
                   <ArrowRight size={12} className="text-zinc-500 opacity-0 group-hover:opacity-100 group-hover:translate-x-1 group-hover:text-red-500 transition-all shrink-0" />
                </div>
              )) : (
                <div className="py-12 flex flex-col items-center justify-center border border-dashed border-zinc-850 rounded-2xl text-zinc-600 text-center space-y-2">
                   <Clock size={24} className="opacity-20 animate-spin" />
                   <div className="text-xs font-bold">No registered actions found</div>
                   <p className="text-[10px] text-zinc-550 max-w-xs leading-normal">Perform workflow tasks like design, scripting and SEO config to populate telemetry.</p>
                </div>
              )}
           </div>
        </div>
      </div>

      {/* YouTube Automation Assets Console */}
      <div className={`bg-zinc-900 border border-zinc-800 rounded-[2rem] p-8 hover:border-zinc-705 transition-all duration-300 ${
        collapsedWidgets.youtubeAutomationAssets ? 'h-fit' : 'space-y-6'
      }`}>
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-4">
               <h3 className="text-xl font-bold text-white flex items-center gap-3">
                 <FolderOpen size={22} className="text-red-500" /> YouTube Automation Assets
               </h3>
               {collapsedWidgets.youtubeAutomationAssets && (
                 <span className="text-[10px] bg-red-500/10 text-red-400 px-2 py-0.5 rounded-full font-bold uppercase tracking-widest animate-pulse">Minimized</span>
               )}
            </div>
            <p className="text-zinc-400 text-xs font-medium">
              Perform multi-select bulk operations including instant archival, permanent deletion, and status updates on your video assets.
            </p>
          </div>
          
          <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
            {!collapsedWidgets.youtubeAutomationAssets && (
              <>
                {/* Search Input */}
                <div className="relative flex-grow md:flex-grow-0 md:w-64">
                  <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-zinc-550">
                    <Search size={12} />
                  </span>
                  <input
                    type="text"
                    value={dashboardAssetSearch}
                    onChange={(e) => setDashboardAssetSearch(e.target.value)}
                    placeholder="Search assets by title or niche..."
                    className="w-full bg-zinc-950/80 border border-zinc-850 focus:border-red-500 rounded-xl pl-9 pr-4 py-2 text-xs text-white placeholder-zinc-500 outline-none transition-all"
                  />
                </div>
                
                {/* Archive State Toggle */}
                <button
                  type="button"
                  onClick={() => {
                    setShowArchivedDashboardAssets(!showArchivedDashboardAssets);
                    setSelectedDashboardProjectIds([]);
                  }}
                  className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all border flex items-center gap-1.5 active-press cursor-pointer ${
                    showArchivedDashboardAssets
                      ? 'bg-amber-500/10 border-amber-500/30 text-amber-500'
                      : 'bg-zinc-950 hover:bg-zinc-800 border-zinc-850 text-zinc-400 hover:text-white'
                  }`}
                >
                  <Archive size={12} />
                  {showArchivedDashboardAssets ? 'Show Active' : 'Show Archived'}
                </button>

                {/* Create from Template Button */}
                <button
                  type="button"
                  onClick={() => {
                    setTmplName("");
                    setTmplNiche("");
                    setTmplAudience("");
                    setTmplType("gaming");
                    setIsCreatingTemplate(true);
                  }}
                  className="bg-red-650 hover:bg-red-600 text-white px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all border border-red-500 flex items-center gap-1.5 active-press cursor-pointer"
                >
                  <Plus size={12} />
                  Create from Template
                </button>
              </>
            )}
            <button
              onClick={() => toggleWidget('youtubeAutomationAssets')}
              className="p-1.5 rounded-lg bg-zinc-950 hover:bg-zinc-800 border border-zinc-850 hover:text-white text-zinc-400 transition-colors cursor-pointer"
              title={collapsedWidgets.youtubeAutomationAssets ? "Expand widget" : "Collapse widget"}
            >
              {collapsedWidgets.youtubeAutomationAssets ? <ChevronDown size={14} /> : <ChevronUp size={14} />}
            </button>
          </div>
        </div>

        {!collapsedWidgets.youtubeAutomationAssets && (
          <>

        {/* Selected Projects Bulk Actions Bar */}
        {selectedDashboardProjectIds.length > 0 && (
          <div className="bg-zinc-950 border border-zinc-850 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 animate-fade-in">
            <div className="flex items-center gap-3">
              <div className="bg-red-500/10 text-red-500 text-xs font-mono font-black px-2.5 py-1 rounded-lg border border-red-500/10 min-w-8 text-center">
                {selectedDashboardProjectIds.length}
              </div>
              <div>
                <p className="text-white text-xs font-black uppercase tracking-wide">Bulk Operations Pending</p>
                <p className="text-[10px] text-zinc-500 font-semibold leading-none mt-1">
                  Actions will affect all selected video automation assets.
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setSelectedDashboardProjectIds([])}
                className="text-[10px] text-zinc-400 hover:text-white font-black uppercase tracking-wider px-3 py-2 transition-all mr-2"
              >
                Cancel Selection
              </button>
              
              <button
                type="button"
                onClick={handleDashboardBulkArchive}
                className="bg-zinc-900 hover:bg-zinc-800 text-amber-500 hover:text-amber-400 px-4 py-2 rounded-xl border border-zinc-800 hover:border-zinc-700 transition-all text-[10px] font-black uppercase tracking-wider flex items-center gap-1.5 cursor-pointer"
              >
                {showArchivedDashboardAssets ? <RotateCcw size={12} /> : <Archive size={12} />}
                {showArchivedDashboardAssets ? 'Restore Selected' : 'Archive Selected'}
              </button>
              
              <button
                type="button"
                onClick={handleDashboardBulkDelete}
                className="bg-red-950/40 hover:bg-red-950 text-red-400 hover:text-red-300 px-4 py-2 rounded-xl border border-red-900/30 transition-all text-[10px] font-black uppercase tracking-wider flex items-center gap-1.5 cursor-pointer"
              >
                <Trash2 size={12} />
                Delete Permanently
              </button>
            </div>
          </div>
        )}

        {/* Assets List */}
        {filteredDashboardAssets.length === 0 ? (
          <div className="py-12 flex flex-col items-center justify-center border border-dashed border-zinc-850 rounded-2xl text-zinc-600 text-center space-y-2">
            <FolderOpen size={32} className="opacity-15 text-zinc-400" />
            <div className="text-xs font-bold text-zinc-400">
              {dashboardAssetSearch ? 'No matching assets found' : showArchivedDashboardAssets ? 'No archived assets' : 'No active YouTube automation assets'}
            </div>
            <p className="text-[10px] text-zinc-500 max-w-xs leading-normal">
              {dashboardAssetSearch ? 'Refine your search term or filter settings' : showArchivedDashboardAssets ? 'Assets you archive will be stored here safely.' : 'Create new workspace projects to start tracking automation assets.'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto custom-scrollbar">
            <table className="w-full text-left border-collapse min-w-[600px]">
              <thead>
                <tr className="border-b border-zinc-850 text-zinc-500 text-[10px] font-black uppercase tracking-wider">
                  <th className="py-3 px-4 w-12">
                    <input
                      type="checkbox"
                      checked={filteredDashboardAssets.length > 0 && filteredDashboardAssets.every(p => selectedDashboardProjectIds.includes(p.id))}
                      onChange={(e) => {
                        if (e.target.checked) {
                          const allIds = filteredDashboardAssets.map(p => p.id);
                          setSelectedDashboardProjectIds(prev => Array.from(new Set([...prev, ...allIds])));
                        } else {
                          const allIds = filteredDashboardAssets.map(p => p.id);
                          setSelectedDashboardProjectIds(prev => prev.filter(id => !allIds.includes(id)));
                        }
                      }}
                      className="w-3.5 h-3.5 rounded border-zinc-800 bg-zinc-950 text-red-650 accent-red-600 focus:ring-1 focus:ring-red-500/50 cursor-pointer"
                    />
                  </th>
                  <th className="py-3 px-4">Asset Name</th>
                  <th className="py-3 px-4">Target Niche</th>
                  <th className="py-3 px-4">Audience</th>
                  <th className="py-3 px-4">Current Status</th>
                  <th className="py-3 px-4 text-right">Workspace Controls</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-850/40 text-xs">
                {filteredDashboardAssets.map((project) => {
                  const isSelected = selectedDashboardProjectIds.includes(project.id);
                  const isActive = activeProject?.id === project.id;
                  
                  let statusColor = "bg-zinc-950 text-zinc-400 border-zinc-850";
                  if (project.status === 'idea') statusColor = "bg-rose-500/10 text-rose-400 border-rose-500/10";
                  else if (project.status === 'scripting') statusColor = "bg-orange-500/10 text-orange-400 border-orange-500/10";
                  else if (project.status === 'production') statusColor = "bg-yellow-500/10 text-yellow-400 border-yellow-500/10";
                  else if (project.status === 'scheduled') statusColor = "bg-blue-500/10 text-blue-400 border-blue-500/10";
                  else if (project.status === 'published') statusColor = "bg-emerald-500/10 text-emerald-400 border-emerald-500/10";

                  return (
                    <tr 
                      key={project.id}
                      className={`hover:bg-zinc-950/40 transition-colors group ${isActive ? 'bg-red-500/5' : ''}`}
                    >
                      <td className="py-3.5 px-4">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => {
                            setSelectedDashboardProjectIds(prev => 
                              prev.includes(project.id) 
                                ? prev.filter(id => id !== project.id) 
                                : [...prev, project.id]
                            );
                          }}
                          className="w-3.5 h-3.5 rounded border-zinc-800 bg-zinc-950 text-red-650 accent-red-600 focus:ring-1 focus:ring-red-500/50 cursor-pointer"
                        />
                      </td>
                      <td className="py-3.5 px-4 font-bold text-white max-w-xs truncate">
                        <div className="flex items-center gap-2">
                          <span className="truncate">{project.title}</span>
                          {isActive && (
                            <span className="text-[8px] bg-red-600/10 text-red-500 border border-red-500/20 px-1.5 py-0.5 rounded uppercase font-black tracking-widest shrink-0">
                              Active
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="py-3.5 px-4 text-zinc-400 font-medium capitalize">{project.niche}</td>
                      <td className="py-3.5 px-4 text-zinc-500 font-mono text-[10px]">{project.audience || 'General Audience'}</td>
                      <td className="py-3.5 px-4">
                        <span className={`text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded border ${statusColor}`}>
                          {project.status}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {!isActive && !project.archived && (
                            <button
                              type="button"
                              onClick={() => {
                                setActiveProjectById(project.id);
                                toast.success(`Active workspace changed to "${project.title}"`);
                              }}
                              className="bg-zinc-950 hover:bg-zinc-800 text-[9px] font-black uppercase tracking-wider text-zinc-400 hover:text-white px-2.5 py-1.5 rounded-lg border border-zinc-850 transition-all cursor-pointer"
                            >
                              Load Asset
                            </button>
                          )}
                          
                          <button
                            type="button"
                            onClick={async () => {
                              const action = project.archived ? 'restored' : 'archived';
                              await toggleArchiveProject(project.id);
                              toast.success(`Successfully ${action} project "${project.title}"`);
                            }}
                            className="p-2 hover:bg-zinc-850 rounded-lg text-zinc-500 hover:text-amber-500 transition-colors"
                            title={project.archived ? 'Restore Asset' : 'Archive Asset'}
                          >
                            {project.archived ? <RotateCcw size={13} /> : <Archive size={13} />}
                          </button>
                          
                          <button
                            type="button"
                            onClick={async () => {
                              if (confirm(`Are you sure you want to permanently delete project "${project.title}"? This is IRREVERSIBLE.`)) {
                                await deleteProject(project.id);
                                toast.success(`Successfully deleted project "${project.title}"`);
                              }
                            }}
                            className="p-2 hover:bg-zinc-850 rounded-lg text-zinc-500 hover:text-red-500 transition-colors"
                            title="Delete Asset Permanently"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
        </>
       )}
      </div>

      {/* Row 3: Resource Usage Dashboard */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-[2rem] p-8 hover:border-zinc-705 transition-all duration-300">
         <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-8">
            <div>
               <div className="flex items-center gap-4">
                  <h3 className="text-xl font-bold text-white flex items-center gap-3">
                    <Cpu size={22} className="text-emerald-500 animate-pulse" /> Resource Usage Dashboard
                  </h3>
                  {collapsedWidgets.resourceUsage && (
                    <span className="text-[10px] bg-emerald-500/10 text-emerald-400 px-2 py-0.5 rounded-full font-bold uppercase tracking-widest animate-pulse">Minimized</span>
                  )}
               </div>
               <p className="text-xs text-zinc-400 mt-1 leading-normal font-medium">Monitoring LLM token streams, storage assets, and real-time inference latencies.</p>
            </div>
            
            <div className="flex items-center gap-4 bg-zinc-950 border border-zinc-850 px-4 py-2 rounded-2xl">
               {!collapsedWidgets.resourceUsage && (
                 <>
                   <div className="flex items-center gap-1.5 text-xs text-zinc-400 font-bold">
                      <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                      API Gateway: Operational
                   </div>
                   <span className="h-4 w-px bg-zinc-805" />
                   <div className="text-[10px] text-zinc-500 font-mono">INF. LATENCY: 124ms</div>
                 </>
               )}
               <button
                 onClick={() => toggleWidget('resourceUsage')}
                 className="p-1.5 rounded-lg bg-zinc-950 hover:bg-zinc-800 border border-zinc-850 hover:text-white text-zinc-400 transition-colors cursor-pointer"
                 title={collapsedWidgets.resourceUsage ? "Expand widget" : "Collapse widget"}
               >
                 {collapsedWidgets.resourceUsage ? <ChevronDown size={14} /> : <ChevronUp size={14} />}
               </button>
            </div>
         </div>

         {!collapsedWidgets.resourceUsage && (
            <>
         <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            
            {/* 1. Word/Token Consumption Area */}
            <div className="bg-zinc-950 border border-zinc-850 rounded-2xl p-6 space-y-4">
               <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                     <p className="text-[9px] font-black tracking-widest text-zinc-400 uppercase">AI Token Usage</p>
                     <h4 className="text-lg font-black text-white">412,850 <span className="text-[10px] text-zinc-500 font-bold">tokens</span></h4>
                  </div>
                  <span className="text-[10px] bg-emerald-500/10 text-emerald-400 font-bold border border-emerald-500/20 px-2.5 py-1 rounded-lg">82.5% Quota</span>
               </div>
               
               <div className="h-32 mt-4">
                  <SimpleAreaChart data={[
                     { t: 'Mon', usage: 45 },
                     { t: 'Tue', usage: 52 },
                     { t: 'Wed', usage: 68 },
                     { t: 'Thu', usage: 61 },
                     { t: 'Fri', usage: 74 },
                     { t: 'Sat', usage: 82 },
                     { t: 'Sun', usage: 85 }
                  ]} strokeColor="#10b981" height={100} />
               </div>
            </div>

            {/* 2. Media Storage Utilization */}
            <div className="bg-zinc-950 border border-zinc-850 rounded-2xl p-6 space-y-4">
               <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                     <p className="text-[9px] font-black tracking-widest text-zinc-400 uppercase">CDN Storage (SSD)</p>
                     <h4 className="text-lg font-black text-white">12.8 <span className="text-[10px] text-zinc-500 font-bold">GB</span> / 50 GB</h4>
                  </div>
                  <span className="text-[10px] text-blue-400 font-bold border border-blue-500/10 bg-blue-500/5 px-2.5 py-1 rounded-lg">25.6% Space</span>
               </div>

               {/* Storage Bar Gauge visualizer */}
               <div className="h-32 flex flex-col justify-between pt-2">
                  <div className="space-y-1.5">
                     <div className="flex justify-between items-center text-[10px] text-zinc-400 font-bold">
                        <span>Video Assets</span>
                        <span className="text-white">8.4 GB</span>
                     </div>
                     <div className="w-full h-1.5 bg-zinc-900 rounded-full overflow-hidden border border-zinc-850">
                        <div className="h-full bg-blue-500 w-[65%]" />
                     </div>
                  </div>

                  <div className="space-y-1.5">
                     <div className="flex justify-between items-center text-[10px] text-zinc-400 font-bold">
                        <span>Audio & Master Tracks</span>
                        <span className="text-white">3.1 GB</span>
                     </div>
                     <div className="w-full h-1.5 bg-zinc-900 rounded-full overflow-hidden border border-zinc-850">
                        <div className="h-full bg-purple-500 w-[24%]" />
                     </div>
                  </div>

                  <div className="space-y-1.5">
                     <div className="flex justify-between items-center text-[10px] text-zinc-400 font-bold">
                        <span>Cached CDN Render Buffers</span>
                        <span className="text-white">1.3 GB</span>
                     </div>
                     <div className="w-full h-1.5 bg-zinc-900 rounded-full overflow-hidden border border-zinc-850">
                        <div className="h-full bg-orange-500 w-[11%]" />
                     </div>
                  </div>
               </div>
            </div>

            {/* 3. API Latency / Inf. Pipeline Ping Area */}
            <div className="bg-zinc-950 border border-zinc-850 rounded-2xl p-6 space-y-4">
               <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                     <p className="text-[9px] font-black tracking-widest text-zinc-400 uppercase">Gemini Latency Index</p>
                     <h4 className="text-lg font-black text-white">142 <span className="text-[10px] text-zinc-500 font-bold">ms Avg</span></h4>
                  </div>
                  <span className="text-[10px] text-red-400 font-bold border border-red-500/10 bg-red-500/5 px-2.5 py-1 rounded-lg">Response Velocity</span>
               </div>

               <div className="h-32 mt-4">
                  <SimpleAreaChart data={[
                     { t: '12:00', ping: 110 },
                     { t: '12:10', ping: 165 },
                     { t: '12:20', ping: 130 },
                     { t: '12:30', ping: 142 },
                     { t: '12:40', ping: 155 },
                     { t: '12:50', ping: 125 },
                     { t: '13:00', ping: 142 }
                  ]} strokeColor="#ef4444" height={100} />
               </div>
            </div>

         </div>
         </>
         )}
      </div>

      {/* Template Gallery */}
      <TemplateGallery />

      {/* Centralized Quick View Modal Overlay */}
      {quickViewType && activeProject && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md text-left transition-opacity">
          <div className="bg-zinc-900 border border-zinc-800 rounded-[2rem] w-full max-w-2xl overflow-hidden shadow-2xl max-h-[85vh] flex flex-col scale-100 transition-transform">
            
            {/* Modal Header */}
            <div className="flex items-center justify-between px-8 py-6 border-b border-zinc-850 shrink-0">
              <div className="flex items-center gap-3">
                <div className={`p-2.5 rounded-xl ${
                  quickViewType === 'script' ? 'bg-blue-500/10 text-blue-400' :
                  quickViewType === 'thumbnail' ? 'bg-orange-500/10 text-orange-400' :
                  'bg-purple-500/10 text-purple-400'
                }`}>
                  {quickViewType === 'script' && <FileText size={18} />}
                  {quickViewType === 'thumbnail' && <ImageIcon size={18} />}
                  {quickViewType === 'voice' && <Waves size={18} />}
                </div>
                <div>
                  <h4 className="text-md font-extrabold text-white">
                    {quickViewType === 'script' && 'Script Asset Draft'}
                    {quickViewType === 'thumbnail' && 'Thumbnail Asset Graphic'}
                    {quickViewType === 'voice' && 'Synthesized Audio/Video Artifact'}
                  </h4>
                  <p className="text-[10px] text-purple-400 font-bold uppercase tracking-wider mt-0.5">
                    {activeProject.title}
                  </p>
                </div>
              </div>
              
              <button 
                onClick={() => setQuickViewType(null)}
                className="text-zinc-400 hover:text-white text-[10px] font-black p-2 rounded-xl bg-zinc-950 border border-zinc-850 hover:border-zinc-800 transition-all cursor-pointer uppercase tracking-wider px-3.5"
              >
                Close
              </button>
            </div>

            {/* Modal Content */}
            <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
              {quickViewType === 'script' && (
                <div className="space-y-6">
                  {activeProject.assets?.script ? (
                    <>
                      <div className="bg-zinc-950/80 border border-zinc-850 rounded-2xl p-6 font-medium text-zinc-300 text-xs leading-relaxed whitespace-pre-wrap select-text max-h-[400px] overflow-y-auto custom-scrollbar">
                        {activeProject.assets.script}
                      </div>
                      <div className="flex gap-3 justify-end">
                        <button
                          onClick={() => {
                            navigator.clipboard.writeText(activeProject.assets.script);
                            toast.success("Script copied to clipboard! 📋");
                          }}
                          className="bg-purple-600 hover:bg-purple-500 text-white text-[10px] font-black uppercase tracking-widest px-5 py-3 rounded-xl flex items-center gap-2 transition-all cursor-pointer"
                        >
                          <Copy size={12} /> Copy Script
                        </button>
                      </div>
                    </>
                  ) : (
                    <div className="text-center py-12 text-zinc-550 border border-dashed border-zinc-850 rounded-2xl">
                      <FileText size={32} className="mx-auto text-zinc-705 mb-3 animate-bounce" />
                      <p className="text-xs font-bold leading-normal">No Script Generated Yet</p>
                    </div>
                  )}
                </div>
              )}

              {quickViewType === 'thumbnail' && (
                <div className="space-y-6 flex flex-col items-center">
                  {activeProject.assets?.thumbnail ? (
                    <>
                      <div className="w-full max-w-lg overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-950 group shadow-inner">
                        <img 
                          src={activeProject.assets.thumbnail} 
                          alt="Thumbnail Artifact Preview" 
                          referrerPolicy="no-referrer"
                          className="w-full h-auto object-cover group-hover:scale-[1.02] transition-transform duration-500"
                        />
                      </div>
                      <div className="text-center">
                        <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Composite Visual Properties</p>
                        <p className="text-xs text-zinc-500 mt-1">Resolution: 1080p (HQ Aspect Match) | Pre-cached CDN Node</p>
                      </div>
                      <div className="flex gap-3">
                        <a
                          href={activeProject.assets.thumbnail}
                          target="_blank"
                          rel="noreferrer"
                          className="bg-purple-600 hover:bg-purple-500 text-white text-[10px] font-black uppercase tracking-widest px-5 py-3 rounded-xl flex items-center gap-2 transition-all cursor-pointer"
                        >
                          <Download size={12} /> External HD View
                        </a>
                      </div>
                    </>
                  ) : (
                    <div className="text-center py-12 text-zinc-550 border border-dashed border-zinc-850 rounded-2xl w-full">
                      <ImageIcon size={32} className="mx-auto text-zinc-705 mb-3" />
                      <p className="text-xs font-bold leading-normal">No Graphic Thumbnail Generated Yet</p>
                    </div>
                  )}
                </div>
              )}

              {quickViewType === 'voice' && (
                <div className="space-y-6 flex flex-col items-center">
                  {activeProject.assets?.videoUri ? (
                    <>
                      <div className="w-full max-w-lg aspect-video rounded-2xl overflow-hidden border border-zinc-800 bg-zinc-950 flex items-center justify-center relative shadow-2xl">
                        <video 
                          src={activeProject.assets.videoUri} 
                          controls
                          className="w-full h-full object-contain"
                          poster={activeProject.assets.thumbnail || undefined}
                        />
                      </div>
                      <div className="text-center max-w-md">
                        <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Active Media Target</p>
                        <p className="text-xs text-zinc-500 mt-1.5 leading-relaxed">
                          Standardized AI Voice Sync video output incorporating custom narrator lines and professional background synthesis blocks.
                        </p>
                      </div>
                      <div className="flex gap-3">
                        <a
                          href={activeProject.assets.videoUri}
                          download={`ranktica-video-${activeProject.id}.mp4`}
                          className="bg-purple-600 hover:bg-purple-500 text-white text-[10px] font-black uppercase tracking-widest px-5 py-3 rounded-xl flex items-center gap-2 transition-all cursor-pointer"
                        >
                          <Download size={12} /> Download Video
                        </a>
                      </div>
                    </>
                  ) : (
                    <div className="text-center py-12 text-zinc-555 border border-dashed border-zinc-850 rounded-2xl w-full">
                      <Waves size={32} className="mx-auto text-zinc-705 mb-3 animate-pulse" />
                      <p className="text-xs font-bold leading-normal">Voice Synthesis Pending</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Dynamic Floating Quick Actions Menu */}
      <div className="fixed bottom-6 right-6 z-[100] font-sans">
        {showQuickActions && (
          <>
            {/* Backdrop dismisse overlay */}
            <div className="fixed inset-0 z-40 bg-transparent" onClick={() => setShowQuickActions(false)} />
            
            <div className="absolute bottom-16 right-0 w-80 bg-[#0d0d0f] border border-zinc-800 rounded-2xl shadow-2xl z-50 p-4 space-y-4 animate-scale-in glass-morphism">
              {/* Core header logs summary */}
              <div className="pb-3 border-b border-zinc-850 space-y-1">
                <div className="flex items-center gap-1.5 text-zinc-405 text-[10px] font-black uppercase">
                  <Sparkles size={11} className="text-red-500" />
                  <span>Sovereign Quick Actions</span>
                </div>
                {/* Recommendation pill based on user history context */}
                <div className="bg-red-950/40 border border-red-500/20 rounded-lg p-2 mt-1 space-y-0.5">
                  <span className="text-[8px] font-black uppercase text-red-400 block tracking-wider">⚡ Highly Recommended Workflow</span>
                  <span className="text-[10px] font-extrabold text-white block">{topHistoryRecommendation.recommendation}</span>
                  <span className="text-[8px] text-zinc-400 block leading-tight">{topHistoryRecommendation.detail}</span>
                </div>
              </div>

              {/* Action routes */}
              <div className="space-y-1">
                <button
                  onClick={() => {
                    onNavigate(ToolType.PROJECTS);
                    setShowQuickActions(false);
                  }}
                  className="w-full text-left p-2.5 rounded-xl hover:bg-zinc-900 flex items-center gap-2.5 transition group"
                >
                  <div className="w-6 h-6 rounded bg-zinc-900 border border-zinc-800 group-hover:bg-red-950/20 group-hover:border-red-500/30 flex items-center justify-center text-zinc-400 group-hover:text-red-400 transition shrink-0">
                    <Calendar size={12} />
                  </div>
                  <div className="min-w-0">
                    <span className="text-[10px] font-extrabold text-zinc-200 block">New Video Project</span>
                    <span className="text-[8px] text-zinc-500 block truncate">Initiate new production Board and files</span>
                  </div>
                </button>

                <button
                  onClick={() => {
                    onNavigate(ToolType.SEO);
                    setShowQuickActions(false);
                  }}
                  className="w-full text-left p-2.5 rounded-xl hover:bg-zinc-900 flex items-center gap-2.5 transition group"
                >
                  <div className="w-6 h-6 rounded bg-zinc-900 border border-zinc-800 group-hover:bg-red-950/20 group-hover:border-red-500/30 flex items-center justify-center text-zinc-400 group-hover:text-red-400 transition shrink-0">
                    <Search size={12} />
                  </div>
                  <div className="min-w-0">
                    <span className="text-[10px] font-extrabold text-zinc-200 block">SEO & Tags Scan</span>
                    <span className="text-[8px] text-zinc-500 block truncate">Audit search keywords & tag volumes</span>
                  </div>
                </button>

                <button
                  onClick={() => {
                    onNavigate(ToolType.SCRIPT);
                    setShowQuickActions(false);
                  }}
                  className="w-full text-left p-2.5 rounded-xl hover:bg-zinc-900 flex items-center gap-2.5 transition group"
                >
                  <div className="w-6 h-6 rounded bg-zinc-900 border border-zinc-800 group-hover:bg-red-950/20 group-hover:border-red-500/30 flex items-center justify-center text-zinc-400 group-hover:text-red-400 transition shrink-0">
                    <FileText size={12} />
                  </div>
                  <div className="min-w-0">
                    <span className="text-[10px] font-extrabold text-zinc-200 block">Draft Video Script</span>
                    <span className="text-[8px] text-zinc-500 block truncate">Composition script with neural narrations</span>
                  </div>
                </button>

                <button
                  onClick={() => {
                    onNavigate(ToolType.VIDEO_GENERATOR);
                    setShowQuickActions(false);
                  }}
                  className="w-full text-left p-2.5 rounded-xl hover:bg-zinc-900 flex items-center gap-2.5 transition group"
                >
                  <div className="w-6 h-6 rounded bg-zinc-900 border border-zinc-800 group-hover:bg-red-950/20 group-hover:border-red-500/30 flex items-center justify-center text-zinc-400 group-hover:text-red-400 transition shrink-0">
                    <Clapperboard size={12} />
                  </div>
                  <div className="min-w-0">
                    <span className="text-[10px] font-extrabold text-zinc-200 block">Veo Scene Synthesizer</span>
                    <span className="text-[8px] text-zinc-500 block truncate">Produce cinematic visual elements with AI</span>
                  </div>
                </button>

                <button
                  onClick={() => {
                    onNavigate(ToolType.IDEAS);
                    setShowQuickActions(false);
                  }}
                  className="w-full text-left p-2.5 rounded-xl hover:bg-zinc-900 flex items-center gap-2.5 transition group"
                >
                  <div className="w-6 h-6 rounded bg-zinc-900 border border-zinc-800 group-hover:bg-red-950/20 group-hover:border-red-500/30 flex items-center justify-center text-zinc-400 group-hover:text-red-400 transition shrink-0">
                    <Lightbulb size={12} />
                  </div>
                  <div className="min-w-0">
                    <span className="text-[10px] font-extrabold text-zinc-200 block">Brainstorm Concepts</span>
                    <span className="text-[8px] text-zinc-500 block truncate">Create viral, high CTR content hooks</span>
                  </div>
                </button>
              </div>

              {/* Directly trigger the recommended action */}
              <button
                onClick={() => {
                  onNavigate(topHistoryRecommendation.tool);
                  setShowQuickActions(false);
                }}
                className="w-full mt-2 bg-gradient-to-r from-red-600 to-rose-600 hover:brightness-110 active:scale-95 text-white p-2 text-center rounded-xl text-[10px] font-black uppercase tracking-wider transition-all cursor-pointer flex items-center justify-center gap-1.5 shadow-lg shadow-red-950/20"
              >
                <Sparkles size={11} className="animate-spin" />
                <span>Launch Recommended Action</span>
              </button>
            </div>
          </>
        )}

        {/* Floating trigger bubble button */}
        <button
          onClick={() => setShowQuickActions(!showQuickActions)}
          className={`relative h-12 w-12 rounded-full border shadow-2xl flex items-center justify-center transition-all duration-300 active:scale-95 cursor-pointer ${
            showQuickActions 
              ? 'bg-red-650 border-red-500 text-white rotate-45 animate-none' 
              : 'bg-zinc-950 border-zinc-800 text-red-500 hover:text-white'
          }`}
          title="Toggle Quick Actions Floating Panel"
        >
          <Sparkles size={18} className={showQuickActions ? "" : "animate-pulse"} />
        </button>
      </div>

      {/* Keyboard Shortcuts Cheat Sheet Modal Overlay */}
      {showKeyboardShortcuts && (
        <div 
          className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-fade-in"
          onClick={() => setShowKeyboardShortcuts(false)}
        >
          <div 
            className="bg-[#0c0c0e]/95 border border-zinc-800 rounded-3xl p-6 md:p-8 w-full max-w-2xl shadow-2xl relative overflow-hidden max-h-[90vh] flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Top color accent strip */}
            <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-red-600 via-amber-500 to-orange-500"></div>

            {/* Modal Header */}
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-zinc-900 border border-zinc-800 text-amber-500 shadow-inner">
                  <Keyboard size={20} />
                </div>
                <div>
                  <h3 className="text-lg font-black text-white tracking-tight uppercase">Keyboard Shortcuts Cheat Sheet</h3>
                  <p className="text-[10px] text-zinc-500 font-medium">Power-user key combinations to speed up your production workflows</p>
                </div>
              </div>
              <button 
                onClick={() => setShowKeyboardShortcuts(false)}
                className="p-2 rounded-xl bg-zinc-900 hover:bg-zinc-850 border border-zinc-800 text-zinc-400 hover:text-white transition-all active-press"
                title="Close Cheat Sheet"
              >
                <X size={16} />
              </button>
            </div>

            {/* Modal Content - Scrollable if screen is small */}
            <div className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-zinc-800 scrollbar-track-transparent pr-1 space-y-6">
              {/* Core & Action Shortcuts */}
              <div className="space-y-3">
                <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest block border-b border-zinc-900 pb-1.5">
                  ⚡ Core & AI Workflow Actions
                </span>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {/* Ctrl+S */}
                  <div className="bg-zinc-950/50 border border-zinc-900/80 rounded-2xl p-3.5 flex items-start justify-between gap-4">
                    <div className="min-w-0">
                      <span className="text-xs font-bold text-zinc-200 block">Workspace Quick Save</span>
                      <span className="text-[9px] text-zinc-500 block leading-tight mt-0.5">Saves your active draft/dashboard state securely to cloud.</span>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <kbd className="inline-flex items-center justify-center px-1.5 py-0.5 rounded-md border border-zinc-750 bg-zinc-900 text-zinc-300 font-mono text-[9px] font-bold shadow-sm">Ctrl</kbd>
                      <span className="text-zinc-600 text-[9px] font-bold">+</span>
                      <kbd className="inline-flex items-center justify-center px-1.5 py-0.5 rounded-md border border-zinc-750 bg-zinc-900 text-zinc-300 font-mono text-[9px] font-bold shadow-sm">S</kbd>
                    </div>
                  </div>

                  {/* Ctrl+K */}
                  <div className="bg-zinc-950/50 border border-zinc-900/80 rounded-2xl p-3.5 flex items-start justify-between gap-4">
                    <div className="min-w-0">
                      <span className="text-xs font-bold text-zinc-200 block">Command Palette / Search</span>
                      <span className="text-[9px] text-zinc-500 block leading-tight mt-0.5">Search workflows, tools, and trigger quick commands instantly.</span>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <kbd className="inline-flex items-center justify-center px-1.5 py-0.5 rounded-md border border-zinc-750 bg-zinc-900 text-zinc-300 font-mono text-[9px] font-bold shadow-sm">Ctrl</kbd>
                      <span className="text-zinc-600 text-[9px] font-bold">+</span>
                      <kbd className="inline-flex items-center justify-center px-1.5 py-0.5 rounded-md border border-zinc-750 bg-zinc-900 text-zinc-300 font-mono text-[9px] font-bold shadow-sm">K</kbd>
                    </div>
                  </div>

                  {/* Ctrl+G */}
                  <div className="bg-zinc-950/50 border border-zinc-900/80 rounded-2xl p-3.5 flex items-start justify-between gap-4">
                    <div className="min-w-0">
                      <span className="text-xs font-bold text-zinc-200 block">Trigger AI Generation</span>
                      <span className="text-[9px] text-zinc-500 block leading-tight mt-0.5">Launches the main active AI pipeline generator (Script/Video/Thumbnail).</span>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <kbd className="inline-flex items-center justify-center px-1.5 py-0.5 rounded-md border border-zinc-750 bg-zinc-900 text-zinc-300 font-mono text-[9px] font-bold shadow-sm">Ctrl</kbd>
                      <span className="text-zinc-600 text-[9px] font-bold">+</span>
                      <kbd className="inline-flex items-center justify-center px-1.5 py-0.5 rounded-md border border-zinc-750 bg-zinc-900 text-zinc-300 font-mono text-[9px] font-bold shadow-sm">G</kbd>
                    </div>
                  </div>

                  {/* Ctrl+E */}
                  <div className="bg-zinc-950/50 border border-zinc-900/80 rounded-2xl p-3.5 flex items-start justify-between gap-4">
                    <div className="min-w-0">
                      <span className="text-xs font-bold text-zinc-200 block">Clear Active Input Fields</span>
                      <span className="text-[9px] text-zinc-500 block leading-tight mt-0.5">Wipes the input forms and state in the current workflow tool.</span>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <kbd className="inline-flex items-center justify-center px-1.5 py-0.5 rounded-md border border-zinc-750 bg-zinc-900 text-zinc-300 font-mono text-[9px] font-bold shadow-sm">Ctrl</kbd>
                      <span className="text-zinc-600 text-[9px] font-bold">+</span>
                      <kbd className="inline-flex items-center justify-center px-1.5 py-0.5 rounded-md border border-zinc-750 bg-zinc-900 text-zinc-300 font-mono text-[9px] font-bold shadow-sm">E</kbd>
                    </div>
                  </div>
                </div>
              </div>

              {/* Navigation module hotkeys */}
              <div className="space-y-3">
                <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest block border-b border-zinc-900 pb-1.5">
                  🧭 Navigation Hotkeys (Fast Module Switching)
                </span>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {/* Dashboard */}
                  <div className="bg-zinc-950/40 border border-zinc-900/50 rounded-xl px-3 py-2 flex items-center justify-between text-[11px] hover:border-zinc-850/80 transition-colors">
                    <div className="flex items-center gap-2">
                      <BarChart2 size={12} className="text-zinc-400" />
                      <span className="font-medium text-zinc-300">Creator Dashboard</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <kbd className="inline-flex items-center justify-center px-1 py-0.5 rounded border border-zinc-800 bg-zinc-900 text-zinc-400 font-mono text-[8px]">Ctrl</kbd>
                      <kbd className="inline-flex items-center justify-center px-1 py-0.5 rounded border border-zinc-800 bg-zinc-900 text-zinc-400 font-mono text-[8px]">Alt</kbd>
                      <kbd className="inline-flex items-center justify-center px-1.5 py-0.5 rounded border border-zinc-800 bg-zinc-900 text-zinc-300 font-mono text-[8px] font-bold">D</kbd>
                    </div>
                  </div>

                  {/* Projects */}
                  <div className="bg-zinc-950/40 border border-zinc-900/50 rounded-xl px-3 py-2 flex items-center justify-between text-[11px] hover:border-zinc-850/80 transition-colors">
                    <div className="flex items-center gap-2">
                      <Calendar size={12} className="text-zinc-400" />
                      <span className="font-medium text-zinc-300">Projects Workspace</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <kbd className="inline-flex items-center justify-center px-1 py-0.5 rounded border border-zinc-800 bg-zinc-900 text-zinc-400 font-mono text-[8px]">Ctrl</kbd>
                      <kbd className="inline-flex items-center justify-center px-1 py-0.5 rounded border border-zinc-800 bg-zinc-900 text-zinc-400 font-mono text-[8px]">Alt</kbd>
                      <kbd className="inline-flex items-center justify-center px-1.5 py-0.5 rounded border border-zinc-800 bg-zinc-900 text-zinc-300 font-mono text-[8px] font-bold">P</kbd>
                    </div>
                  </div>

                  {/* Script */}
                  <div className="bg-zinc-950/40 border border-zinc-900/50 rounded-xl px-3 py-2 flex items-center justify-between text-[11px] hover:border-zinc-850/80 transition-colors">
                    <div className="flex items-center gap-2">
                      <FileText size={12} className="text-zinc-400" />
                      <span className="font-medium text-zinc-300">Script Generator</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <kbd className="inline-flex items-center justify-center px-1 py-0.5 rounded border border-zinc-800 bg-zinc-900 text-zinc-400 font-mono text-[8px]">Ctrl</kbd>
                      <kbd className="inline-flex items-center justify-center px-1 py-0.5 rounded border border-zinc-800 bg-zinc-900 text-zinc-400 font-mono text-[8px]">Alt</kbd>
                      <kbd className="inline-flex items-center justify-center px-1.5 py-0.5 rounded border border-zinc-800 bg-zinc-900 text-zinc-300 font-mono text-[8px] font-bold">S</kbd>
                    </div>
                  </div>

                  {/* Ideas */}
                  <div className="bg-zinc-950/40 border border-zinc-900/50 rounded-xl px-3 py-2 flex items-center justify-between text-[11px] hover:border-zinc-850/80 transition-colors">
                    <div className="flex items-center gap-2">
                      <Lightbulb size={12} className="text-zinc-400" />
                      <span className="font-medium text-zinc-300">Ideas Brainstorm</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <kbd className="inline-flex items-center justify-center px-1 py-0.5 rounded border border-zinc-800 bg-zinc-900 text-zinc-400 font-mono text-[8px]">Ctrl</kbd>
                      <kbd className="inline-flex items-center justify-center px-1 py-0.5 rounded border border-zinc-800 bg-zinc-900 text-zinc-400 font-mono text-[8px]">Alt</kbd>
                      <kbd className="inline-flex items-center justify-center px-1.5 py-0.5 rounded border border-zinc-800 bg-zinc-900 text-zinc-300 font-mono text-[8px] font-bold">I</kbd>
                    </div>
                  </div>

                  {/* Thumbnails */}
                  <div className="bg-zinc-950/40 border border-zinc-900/50 rounded-xl px-3 py-2 flex items-center justify-between text-[11px] hover:border-zinc-850/80 transition-colors">
                    <div className="flex items-center gap-2">
                      <ImageIcon size={12} className="text-zinc-400" />
                      <span className="font-medium text-zinc-300">Thumbnail Builder</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <kbd className="inline-flex items-center justify-center px-1 py-0.5 rounded border border-zinc-800 bg-zinc-900 text-zinc-400 font-mono text-[8px]">Ctrl</kbd>
                      <kbd className="inline-flex items-center justify-center px-1 py-0.5 rounded border border-zinc-800 bg-zinc-900 text-zinc-400 font-mono text-[8px]">Alt</kbd>
                      <kbd className="inline-flex items-center justify-center px-1.5 py-0.5 rounded border border-zinc-800 bg-zinc-900 text-zinc-300 font-mono text-[8px] font-bold">T</kbd>
                    </div>
                  </div>

                  {/* Video Synth */}
                  <div className="bg-zinc-950/40 border border-zinc-900/50 rounded-xl px-3 py-2 flex items-center justify-between text-[11px] hover:border-zinc-850/80 transition-colors">
                    <div className="flex items-center gap-2">
                      <Video size={12} className="text-zinc-400" />
                      <span className="font-medium text-zinc-300">Video Synth Module</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <kbd className="inline-flex items-center justify-center px-1 py-0.5 rounded border border-zinc-800 bg-zinc-900 text-zinc-400 font-mono text-[8px]">Ctrl</kbd>
                      <kbd className="inline-flex items-center justify-center px-1 py-0.5 rounded border border-zinc-800 bg-zinc-900 text-zinc-400 font-mono text-[8px]">Alt</kbd>
                      <kbd className="inline-flex items-center justify-center px-1.5 py-0.5 rounded border border-zinc-800 bg-zinc-900 text-zinc-300 font-mono text-[8px] font-bold">V</kbd>
                    </div>
                  </div>

                  {/* Keyword Inspector */}
                  <div className="bg-zinc-950/40 border border-zinc-900/50 rounded-xl px-3 py-2 flex items-center justify-between text-[11px] hover:border-zinc-850/80 transition-colors">
                    <div className="flex items-center gap-2">
                      <Search size={12} className="text-zinc-400" />
                      <span className="font-medium text-zinc-300">Keyword Inspector</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <kbd className="inline-flex items-center justify-center px-1 py-0.5 rounded border border-zinc-800 bg-zinc-900 text-zinc-400 font-mono text-[8px]">Alt</kbd>
                      <span className="text-zinc-600 text-[8px] font-bold">+</span>
                      <kbd className="inline-flex items-center justify-center px-1.5 py-0.5 rounded border border-zinc-800 bg-zinc-900 text-zinc-300 font-mono text-[8px] font-bold">K</kbd>
                    </div>
                  </div>

                  {/* Cheat sheet trigger */}
                  <div className="bg-zinc-950/40 border border-zinc-900/50 rounded-xl px-3 py-2 flex items-center justify-between text-[11px] hover:border-zinc-850/80 transition-colors">
                    <div className="flex items-center gap-2">
                      <Keyboard size={12} className="text-zinc-400" />
                      <span className="font-medium text-zinc-300">Show/Hide Shortcuts</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <kbd className="inline-flex items-center justify-center px-1.5 py-0.5 rounded border border-zinc-800 bg-zinc-900 text-zinc-350 font-mono text-[8px] font-bold">?</kbd>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="border-t border-zinc-900 pt-4 mt-6 flex justify-between items-center text-[10px] text-zinc-500 font-mono">
              <span>PROTIP: HIT <kbd className="bg-zinc-900 border border-zinc-800 px-1 py-0.5 rounded text-zinc-350 font-bold font-sans">?</kbd> ANYWHERE ON THE DASHBOARD TO TOGGLE THIS PANEL</span>
              <button 
                onClick={() => setShowKeyboardShortcuts(false)}
                className="bg-red-600 hover:bg-red-500 text-white font-black text-[10px] uppercase tracking-wider px-4 py-2 rounded-xl transition-all active-press"
              >
                Close Sheet
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create from Template Modal */}
      {isCreatingTemplate && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fade-in text-left">
          <div className="bg-zinc-950 border border-zinc-850 rounded-[2.5rem] w-full max-w-lg shadow-2xl relative overflow-hidden flex flex-col max-h-[90vh]">
            {/* Ambient Background Glow */}
            <div className="absolute top-0 right-0 w-48 h-48 bg-red-600/10 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute bottom-0 left-0 w-48 h-48 bg-blue-600/5 rounded-full blur-3xl pointer-events-none" />

            {/* Modal Header */}
            <div className="p-8 pb-4 border-b border-zinc-900 flex justify-between items-center shrink-0">
              <div>
                <h3 className="text-xl font-black text-white tracking-tight flex items-center gap-2">
                  <span className="p-1.5 bg-red-500/10 text-red-500 rounded-lg flex items-center justify-center">
                    <Plus size={16} />
                  </span>
                  Create from Template
                </h3>
                <p className="text-[10px] text-zinc-500 mt-1 font-semibold">Pre-fill new workspaces with tailored workflow stages.</p>
              </div>
              <button 
                type="button" 
                onClick={() => setIsCreatingTemplate(false)} 
                className="p-2 hover:bg-zinc-900 rounded-xl text-zinc-500 hover:text-white transition-colors cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            {/* Modal Body */}
            <form onSubmit={handleCreateTemplateProject} className="flex-1 overflow-y-auto custom-scrollbar p-8 space-y-6">
              {/* Form Fields */}
              <div className="space-y-4">
                <div>
                  <label className="text-[9px] font-black text-zinc-500 uppercase block mb-1.5 tracking-wider">Project / Video Title</label>
                  <input 
                    value={tmplName}
                    onChange={e => setTmplName(e.target.value)}
                    placeholder="e.g. Solo Dev Builds SaaS in 24 Hours"
                    className="w-full bg-zinc-900 border border-zinc-850 focus:border-red-500 rounded-2xl p-4 text-xs text-white outline-none transition-all placeholder:text-zinc-600 font-bold"
                    required
                    autoFocus
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-[9px] font-black text-zinc-500 uppercase block mb-1.5 tracking-wider">Niche Target</label>
                    <input 
                      value={tmplNiche}
                      onChange={e => setTmplNiche(e.target.value)}
                      placeholder="e.g. Tech / Education"
                      className="w-full bg-zinc-900 border border-zinc-850 focus:border-red-500 rounded-2xl p-4 text-xs text-white outline-none transition-all placeholder:text-zinc-650"
                    />
                  </div>
                  <div>
                    <label className="text-[9px] font-black text-zinc-500 uppercase block mb-1.5 tracking-wider">Viewer Persona</label>
                    <input 
                      value={tmplAudience}
                      onChange={e => setTmplAudience(e.target.value)}
                      placeholder="e.g. Aspiring Developers"
                      className="w-full bg-zinc-900 border border-zinc-850 focus:border-red-500 rounded-2xl p-4 text-xs text-white outline-none transition-all placeholder:text-zinc-650"
                    />
                  </div>
                </div>
              </div>

              {/* Template Selector Grid */}
              <div className="space-y-3">
                <label className="text-[9px] font-black text-zinc-500 uppercase block tracking-wider">Select Workflow Template</label>
                <div className="grid grid-cols-1 gap-3">
                  {/* Gaming Option */}
                  <button
                    type="button"
                    onClick={() => setTmplType("gaming")}
                    className={`p-4 rounded-2xl border text-left transition-all flex gap-3 ${
                      tmplType === 'gaming' 
                        ? 'bg-red-500/5 border-red-500 text-white' 
                        : 'bg-zinc-900/50 border-zinc-850 text-zinc-400 hover:border-zinc-800 hover:bg-zinc-900'
                    }`}
                  >
                    <div className={`p-2 rounded-xl flex items-center justify-center shrink-0 ${tmplType === 'gaming' ? 'bg-red-500/10 text-red-400' : 'bg-zinc-950 text-zinc-500'}`}>
                      <Activity size={16} />
                    </div>
                    <div>
                      <div className="text-xs font-bold text-zinc-200">Gaming Setup Template</div>
                      <p className="text-[10px] text-zinc-500 mt-0.5 leading-normal">
                        Includes: Hardware audit, Lighting/camera setup, Audio noise calibration, B-roll import, Performance benchmark fine-tuning.
                      </p>
                    </div>
                  </button>

                  {/* Educational Option */}
                  <button
                    type="button"
                    onClick={() => setTmplType("educational")}
                    className={`p-4 rounded-2xl border text-left transition-all flex gap-3 ${
                      tmplType === 'educational' 
                        ? 'bg-red-500/5 border-red-500 text-white' 
                        : 'bg-zinc-900/50 border-zinc-850 text-zinc-400 hover:border-zinc-800 hover:bg-zinc-900'
                    }`}
                  >
                    <div className={`p-2 rounded-xl flex items-center justify-center shrink-0 ${tmplType === 'educational' ? 'bg-red-500/10 text-red-400' : 'bg-zinc-950 text-zinc-500'}`}>
                      <Activity size={16} />
                    </div>
                    <div>
                      <div className="text-xs font-bold text-zinc-200">Educational Template</div>
                      <p className="text-[10px] text-zinc-500 mt-0.5 leading-normal">
                        Includes: Academic lit review, Script annotations, Slides & screencast, Overlay graphics & animations, Interactive quiz sync.
                      </p>
                    </div>
                  </button>

                  {/* Vlogs Option */}
                  <button
                    type="button"
                    onClick={() => setTmplType("vlogs")}
                    className={`p-4 rounded-2xl border text-left transition-all flex gap-3 ${
                      tmplType === 'vlogs' 
                        ? 'bg-red-500/5 border-red-500 text-white' 
                        : 'bg-zinc-900/50 border-zinc-850 text-zinc-400 hover:border-zinc-800 hover:bg-zinc-900'
                    }`}
                  >
                    <div className={`p-2 rounded-xl flex items-center justify-center shrink-0 ${tmplType === 'vlogs' ? 'bg-red-500/10 text-red-400' : 'bg-zinc-950 text-zinc-500'}`}>
                      <Activity size={16} />
                    </div>
                    <div>
                      <div className="text-xs font-bold text-zinc-200">Vlogs Template</div>
                      <p className="text-[10px] text-zinc-500 mt-0.5 leading-normal">
                        Includes: Location wind checks, Primary assembly selects, Sound design & grading, Caption generation, Thumbnail concepts sync.
                      </p>
                    </div>
                  </button>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 pt-2">
                <button 
                  type="button" 
                  onClick={() => setIsCreatingTemplate(false)}
                  className="flex-1 py-3.5 bg-zinc-900 hover:bg-zinc-850 text-zinc-400 hover:text-white rounded-2xl font-black text-[10px] uppercase tracking-wider transition-all"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  disabled={!tmplName.trim()}
                  className="flex-[2] py-3.5 bg-red-600 hover:bg-red-500 disabled:opacity-40 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all shadow-lg shadow-red-600/10 border border-red-500"
                >
                  Initialize Workspace
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
