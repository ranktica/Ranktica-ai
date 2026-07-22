import React, { useState, useMemo, useEffect, useRef } from 'react';
import { Project } from '@/shared/types';
import { useProject } from '@/app/ProjectContext';
import { useAuth } from '@/infrastructure/auth/AuthContext';
import JSZip from 'jszip';
import { jsPDF } from 'jspdf';
import { 
  Plus, 
  Calendar, 
  FileText, 
  Image as ImageIcon, 
  Search, 
  Video, 
  Users, 
  Share2, 
  Check, 
  Link as LinkIcon,
  Trash2,
  X as XIcon,
  Copy as CopyIcon,
  ChevronRight,
  Archive,
  RotateCcw,
  Sparkles,
  Inbox,
  BarChart3,
  TrendingUp,
  PieChart as PieIcon,
  Edit,
  Download,
  History,
  Upload,
  Clock,
  Folder,
  FolderPlus,
  Activity,
  Cloud,
  LayoutGrid,
  FileJson
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { ProjectActivityChart } from '@/components/ProjectActivityChart';
import { ProjectDependencyGraph } from '@/components/ProjectDependencyGraph';
import { ProjectAuditLogModal } from '@/components/ProjectAuditLogModal';
import { ProjectOverviewDashboard } from '@/components/ProjectOverviewDashboard';
import { ProjectActivityTimeline } from '@/components/ProjectActivityTimeline';
import { 
  ResponsiveContainer, 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  Tooltip, 
  PieChart, 
  Pie, 
  Cell,
  BarChart,
  Bar,
  Legend
} from 'recharts';

export const Projects: React.FC = () => {
  const { 
    projects, 
    createProject, 
    deleteProject, 
    updateProject, 
    toggleArchiveProject,
    bulkDeleteProjects,
    bulkArchiveProjects,
    activeProject,
    setActiveProjectById,
    updateActiveProject,
    backupProjectToCloud
  } = useProject();

  const [activeTab, setActiveTab] = useState<'overview' | 'active' | 'timeline' | 'archived' | 'dependency_graph'>('overview');
  const [isCreating, setIsCreating] = useState(false);
  const [showCharts, setShowCharts] = useState(true);

  const statusDistribution = useMemo(() => {
    const counts: Record<string, number> = {
      idea: 0,
      scripting: 0,
      production: 0,
      scheduled: 0,
      published: 0
    };
    projects.forEach((prj) => {
      if (counts[prj.status] !== undefined) {
        counts[prj.status]++;
      }
    });

    const statusLabels: Record<string, string> = {
      idea: 'Idea Phase',
      scripting: 'Scripting',
      production: 'Production',
      scheduled: 'Scheduled',
      published: 'Published'
    };

    const statusColors: Record<string, string> = {
      idea: '#71717a',
      scripting: '#3b82f6',
      production: '#f97316',
      scheduled: '#a855f7',
      published: '#22c55e'
    };

    const parsed = Object.keys(counts).map((key) => ({
      name: statusLabels[key],
      value: counts[key],
      fill: statusColors[key]
    })).filter(item => item.value > 0);

    if (parsed.length === 0) {
      return [
        { name: 'Idea Phase', value: 4, fill: '#71717a' },
        { name: 'Scripting', value: 2, fill: '#3b82f6' },
        { name: 'Production', value: 3, fill: '#f97316' },
        { name: 'Scheduled', value: 1, fill: '#a855f7' },
        { name: 'Published', value: 5, fill: '#22c55e' },
      ];
    }
    return parsed;
  }, [projects]);

  const growthTrendData = useMemo(() => {
    const data = [];
    const now = new Date();
    const projectCount = projects.length;

    for (let i = 29; i >= 0; i--) {
      const d = new Date();
      d.setDate(now.getDate() - i);
      const dateString = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      
      let currentVal = 0;
      if (projectCount > 0) {
        currentVal = Math.round(
          projectCount * 0.3 +
          (projectCount * 0.7 * (30 - i)) / 30 + 
          Math.sin((30 - i) * 0.4) * Math.min(2, projectCount * 0.1)
        );
        currentVal = Math.max(1, Math.min(projectCount, currentVal));
      } else {
        currentVal = Math.round(2 + Math.pow(30 - i, 0.75) * 0.8 + Math.sin(30 - i) * 0.5);
      }

      data.push({
        date: dateString,
        Projects: currentVal
      });
    }
    return data;
  }, [projects]);

  const taskCompletionData = useMemo(() => {
    const activePrjs = projects.filter(p => !p.archived);
    
    // Count completions of different milestones
    const scriptsCount = activePrjs.filter(p => p.assets?.script).length;
    const thumbnailsCount = activePrjs.filter(p => p.assets?.thumbnail).length;
    const seoCount = activePrjs.filter(p => p.assets?.seo || p.assets?.metadata_topic || p.assets?.metadata_result).length;
    const videoCount = activePrjs.filter(p => p.assets?.videoUri).length;

    return [
      { name: 'Scripts', Completed: scriptsCount, Pending: Math.max(0, activePrjs.length - scriptsCount) },
      { name: 'Thumbnails', Completed: thumbnailsCount, Pending: Math.max(0, activePrjs.length - thumbnailsCount) },
      { name: 'SEO Assets', Completed: seoCount, Pending: Math.max(0, activePrjs.length - seoCount) },
      { name: 'Videos', Completed: videoCount, Pending: Math.max(0, activePrjs.length - videoCount) }
    ];
  }, [projects]);

  const [newProjectName, setNewProjectName] = useState('');
  const [newProjectNiche, setNewProjectNiche] = useState('');
  const [newProjectAudience, setNewProjectAudience] = useState('');
  
  // Custom collections/folders management state
  const [folders, setFolders] = useState<{ id: string; name: string; color?: string }[]>(() => {
    const saved = localStorage.getItem('ranktica-project-folders-col');
    return saved ? JSON.parse(saved) : [
      { id: 'f1', name: 'Original Leads', color: '#ef4444' },
      { id: 'f2', name: 'Social Campaigns', color: '#10b981' },
      { id: 'f3', name: 'Long Form Video', color: '#3b82f6' }
    ];
  });

  useEffect(() => {
    localStorage.setItem('ranktica-project-folders-col', JSON.stringify(folders));
  }, [folders]);

  const [selectedFolderId, setSelectedFolderId] = useState<string | null>(null);
  const [showFolderModal, setShowFolderModal] = useState(false);
  const [folderNameInput, setFolderNameInput] = useState('');
  const [folderColorInput, setFolderColorInput] = useState('#ef4444');
  const [folderEditingId, setFolderEditingId] = useState<string | null>(null);

  // Visualization toggle state
  const [showVisualizations, setShowVisualizations] = useState(true);

  // Bulk share collaboration link states
  const [generatedShareLink, setGeneratedShareLink] = useState<string | null>(null);
  const [shareExpiresOption, setShareExpiresOption] = useState<string>('24h');
  const [copiedShareLink, setCopiedShareLink] = useState(false);
  const [collabMode, setCollabMode] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('collab') === 'true' && params.get('shared_ids')) {
      setCollabMode(true);
    }
  }, []);

  const [shareProject, setShareProject] = useState<Project | null>(null);
  const [copiedLink, setCopiedLink] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');

  // --- REAL-TIME MULTI-USER COLLABORATION & CURSORS ---
  const { user } = useAuth();
  const [collabUsers, setCollabUsers] = useState<Array<{ username: string; color: string; x?: number; y?: number; focusElementId?: string }>>([]);
  const [isCollabConnected, setIsCollabConnected] = useState(false);
  const wsRef = useRef<WebSocket | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!user) return;

    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const projId = 'projects_hub_collab';
    const cName = (user as any)?.displayName || (user as any)?.name || user?.email?.split('@')[0] || `Creator_${Math.floor(Math.random() * 1000)}`;
    const wsUrl = `${protocol}//${window.location.host}/api/collaborator-ws?projectId=${encodeURIComponent(projId)}&username=${encodeURIComponent(cName)}`;

    try {
      const socket = new WebSocket(wsUrl);
      wsRef.current = socket;

      socket.onopen = () => {
        setIsCollabConnected(true);
      };

      socket.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (data.type === 'room_state') {
            setCollabUsers(data.activeUsers);
          } else if (data.type === 'user_joined') {
            setCollabUsers(data.activeUsers);
            toast.success(`Team member "${data.username}" joined Projects view 👥`);
          } else if (data.type === 'user_left') {
            setCollabUsers(data.activeUsers);
          } else if (data.type === 'cursor') {
            setCollabUsers(prev => {
              const exists = prev.some(u => u.username === data.username);
              if (exists) {
                return prev.map(u => u.username === data.username ? { ...u, x: data.x, y: data.y, focusElementId: data.focusElementId } : u);
              } else {
                return [...prev, { username: data.username, color: data.color, x: data.x, y: data.y, focusElementId: data.focusElementId }];
              }
            });
          }
        } catch (err) {
          console.error('[Collab Hub Client] Error parsing packet:', err);
        }
      };

      socket.onclose = () => {
        setIsCollabConnected(false);
        setCollabUsers([]);
        wsRef.current = null;
      };

      socket.onerror = (err) => {
        console.warn('[Collab Hub Client] WebSocket notice:', err);
      };

      return () => {
        if (socket.readyState === WebSocket.OPEN || socket.readyState === WebSocket.CONNECTING) {
          socket.close();
        }
      };
    } catch (e) {
      console.error('[Collab Hub Client] Connection failed:', e);
    }
  }, [user]);

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isCollabConnected || !wsRef.current || wsRef.current.readyState !== WebSocket.OPEN || !containerRef.current) return;
    
    const rect = containerRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;

    wsRef.current.send(JSON.stringify({
      type: 'cursor',
      x,
      y
    }));
  };

  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [selectedAuditProject, setSelectedAuditProject] = useState<Project | null>(null);

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [showHistory, setShowHistory] = useState(false);
  const [sortStrategy, setSortStrategy] = useState<'default' | 'lastUpdated' | 'smart_sort'>('smart_sort');
  const [bulkImportList, setBulkImportList] = useState<any[] | null>(null);
  const [bulkImportFileName, setBulkImportFileName] = useState('');

  const { addCustomProject } = useProject();

  // History Log Interface & Hook
  const [historyLogs, setHistoryLogs] = useState<{
    id: string;
    timestamp: number;
    action: string;
    type: 'bulk' | 'save' | 'export' | 'import';
    metadata?: Record<string, any>;
  }[]>(() => {
    const saved = localStorage.getItem('ranktica-project-history');
    return saved ? JSON.parse(saved) : [
      { id: '1', timestamp: Date.now() - 50000, action: 'Workspace manifest operations ledger initialized.', type: 'save' }
    ];
  });

  useEffect(() => {
    localStorage.setItem('ranktica-project-history', JSON.stringify(historyLogs));
  }, [historyLogs]);

  const addHistoryLog = (
    actionOrLog: string | any, 
    type: 'bulk' | 'save' | 'export' | 'import' = 'save',
    metadata?: Record<string, any>
  ) => {
    let finalAction = '';
    let finalType = type;
    let finalMetadata = metadata;
    let finalTimestamp = Date.now();

    if (actionOrLog && typeof actionOrLog === 'object') {
      finalAction = actionOrLog.description || actionOrLog.action || 'Auto saved updates';
      finalType = actionOrLog.type || 'save';
      finalMetadata = { ...actionOrLog.metadata, ...metadata };
      finalTimestamp = actionOrLog.timestamp ? new Date(actionOrLog.timestamp).getTime() : Date.now();
    } else {
      finalAction = actionOrLog;
    }

    const newLog = {
      id: Date.now().toString() + Math.random().toString(36).substr(2, 4),
      timestamp: finalTimestamp,
      action: finalAction,
      type: finalType,
      metadata: finalMetadata
    };
    setHistoryLogs(prev => [newLog, ...prev].slice(0, 150)); 
  };

  const allTags = useMemo(() => {
    const tagsSet = new Set<string>();
    projects.forEach(p => {
      if (p.assets?.tags && Array.isArray(p.assets.tags)) {
        p.assets.tags.forEach(t => tagsSet.add(t));
      }
    });
    return Array.from(tagsSet);
  }, [projects]);

  const handleBulkArchive = async () => {
    if (selectedIds.length === 0) return;
    const isArchivedTab = activeTab === 'archived';
    const verb = isArchivedTab ? 'restore' : 'archive';
    
    const toastId = toast.loading(`Bulk ${verb}ing ${selectedIds.length} projects...`);
    try {
      if (bulkArchiveProjects) {
        await bulkArchiveProjects(selectedIds, !isArchivedTab);
      } else {
        for (const id of selectedIds) {
           await toggleArchiveProject(id);
        }
      }
      toast.success(`Successfully ${verb}d ${selectedIds.length} projects.`, { id: toastId });
      addHistoryLog(`Bulk ${verb}d ${selectedIds.length} projects`, 'bulk');
      setSelectedIds([]);
    } catch (e) {
      toast.error(`Failed to bulk ${verb} projects.`, { id: toastId });
    }
  };

  const handleBulkDelete = async () => {
    if (selectedIds.length === 0) return;
    if (!confirm(`Are you absolutely sure you want to permanently delete these ${selectedIds.length} projects? This action is IRREVERSIBLE.`)) {
      return;
    }
    
    const toastId = toast.loading(`Bulk deleting ${selectedIds.length} projects...`);
    try {
      if (bulkDeleteProjects) {
        await bulkDeleteProjects(selectedIds);
      } else {
        for (const id of selectedIds) {
           await deleteProject(id);
        }
      }
      toast.success(`Successfully deleted ${selectedIds.length} projects.`, { id: toastId });
      addHistoryLog(`Bulk permanently deleted ${selectedIds.length} projects`, 'bulk');
      setSelectedIds([]);
    } catch (e) {
      toast.error('Failed to bulk delete projects.', { id: toastId });
    }
  };

  const handleBulkShare = () => {
    if (selectedIds.length === 0) return;
    const idsString = selectedIds.join(',');
    const origin = window.location.origin;
    // Build temporary shared read-only collaboration link
    const shareUrl = `${origin}?shared_ids=${idsString}&collab=true&expires=${Date.now() + 24 * 60 * 60 * 1000}`;
    setGeneratedShareLink(shareUrl);
    
    // Copy immediately to clipboard
    navigator.clipboard.writeText(shareUrl);
    setCopiedShareLink(true);
    setTimeout(() => setCopiedShareLink(false), 2000);
    
    toast.success('Temporary read-only collaboration link generated & copied to clipboard!');
    addHistoryLog(`Generated collaboration link for ${selectedIds.length} projects`, 'export');
  };

  const handleBulkMoveToFolder = (folderId: string) => {
    if (selectedIds.length === 0) return;
    const folder = folders.find(f => f.id === folderId);
    
    selectedIds.forEach(id => {
      updateProject(id, { folderId: folderId || undefined });
    });
    
    addHistoryLog(`Bulk categorized ${selectedIds.length} projects into folder "${folder ? folder.name : 'None'}"`, 'bulk');
    toast.success(`Moved ${selectedIds.length} projects to "${folder ? folder.name : 'Unorganized'}"`);
    setSelectedIds([]);
  };

  const handleCreateFolder = (name: string, color: string) => {
    if (!name.trim()) return;
    const newFolder = {
      id: 'f-' + Date.now().toString(),
      name: name.trim(),
      color: color || '#ef4444'
    };
    setFolders(prev => [...prev, newFolder]);
    addHistoryLog(`Created project group "${name}"`, 'save');
    toast.success(`Collection folder "${name}" created successfully`);
  };

  const handleUpdateFolder = (id: string, name: string, color: string) => {
    if (!name.trim()) return;
    setFolders(prev => prev.map(f => f.id === id ? { ...f, name: name.trim(), color } : f));
    addHistoryLog(`Renamed collection folder to "${name}"`, 'save');
    toast.success(`Collection folder updated successfully`);
  };

  const handleDeleteFolder = (id: string) => {
    const fName = folders.find(f => f.id === id)?.name || '';
    setFolders(prev => prev.filter(f => f.id !== id));
    
    // Reset folder affiliation on existing projects
    projects.forEach(p => {
      if (p.folderId === id) {
        updateProject(p.id, { folderId: undefined });
      }
    });

    if (selectedFolderId === id) {
      setSelectedFolderId(null);
    }
    
    addHistoryLog(`Deleted collection folder "${fName}"`, 'save');
    toast.success(`Removed collection folder and unmapped projects`);
  };

  const handleBulkExport = () => {
    if (selectedIds.length === 0) return;
    const selectedProjects = projects.filter(p => selectedIds.includes(p.id));
    const jsonString = JSON.stringify(selectedProjects, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `ranktica-bulk-export-${Date.now()}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    toast.success(`Exported ${selectedProjects.length} projects backup JSON`);
    addHistoryLog(`Bulk exported ${selectedProjects.length} projects backup JSON`, 'export');
  };

  const handleZipBulkExport = async () => {
    const targetIds = selectedIds.length > 0 ? selectedIds : projects.filter(p => !p.archived).map(p => p.id);
    const targetProjects = projects.filter(p => targetIds.includes(p.id));
    
    if (targetProjects.length === 0) {
      toast.error("No projects selected or active to build asset archives.");
      return;
    }

    const tid = toast.loading(`Assembling consolidated AI ZIP bundles for ${targetProjects.length} projects...`);
    
    try {
      const zip = new JSZip();

      targetProjects.forEach(project => {
        // Create folder named after project title and ID
        const folderName = `${project.title.replace(/[^a-zA-Z0-9_\-]/g, "_")}_${project.id}`;
        const folder = zip.folder(folderName);
        if (!folder) return;

        // 1. Project metadata.json
        const metadataJson = {
          id: project.id,
          title: project.title,
          niche: project.niche,
          audience: project.audience,
          description: project.description,
          folderId: project.folderId,
          status: project.status,
          lastUpdated: project.lastUpdated || Date.now()
        };
        folder.file("metadata.json", JSON.stringify(metadataJson, null, 2));

        // 2. Script text
        const scriptValue = project.assets?.script?.dialogue || project.assets?.script?.rawText || "No script drafted yet.";
        folder.file("script.txt", scriptValue);

        // 3. Thumbnails config & metadata
        const thumbnailText = project.assets?.thumbnail?.prompt 
          ? `PROMPT: ${project.assets.thumbnail.prompt}\nCTR PROJECTIONS: ${project.assets.thumbnail.ctrPrediction || 'TBD'}%`
          : "No thumbnail assets generated yet.";
        folder.file("thumbnail_blueprint.txt", thumbnailText);
        
        // Write Markdown description inside /visuals/
        if (project.assets?.thumbnail?.prompt) {
          folder.file("visuals/thumbnail_desc.md", `## AI Generated Studio Canvas\n- **Prompt**: ${project.assets.thumbnail.prompt}\n- **Model**: Cosmic Vision Pro\n- **Calculated CTR Winner**: ${project.assets.thumbnail.ctrPrediction || 'TBD'}%\n`);
        }
      });

      const blob = await zip.generateAsync({ type: 'blob' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `ranktica-asset-bundle-${Date.now()}.zip`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      toast.success(`Consolidated ZIP archive generated! 📦`, { id: tid });
      addHistoryLog(`Bulk exported ${targetProjects.length} project ZIP data archives`, 'export');
    } catch (err) {
      console.error("ZIP bundle assembly failed:", err);
      toast.error("An error occurred while compiling your compressed ZIP archive.", { id: tid });
    }
  };

  const handleExportScriptsZip = async () => {
    const targetIds = selectedIds.length > 0 ? selectedIds : projects.filter(p => !p.archived).map(p => p.id);
    const targetProjects = projects.filter(p => targetIds.includes(p.id));
    const completedScripts = targetProjects.filter(p => p.assets?.script?.dialogue || p.assets?.script?.rawText);

    if (completedScripts.length === 0) {
      toast.error("No completed scripts found in the selected projects.");
      return;
    }

    const tid = toast.loading(`Assembling ZIP archive with ${completedScripts.length} completed scripts...`);
    try {
      const zip = new JSZip();
      completedScripts.forEach(project => {
        const fileName = `${project.title.replace(/[^a-zA-Z0-9_\-]/g, "_")}_script.txt`;
        const scriptValue = project.assets?.script?.dialogue || project.assets?.script?.rawText;
        zip.file(fileName, scriptValue);
      });

      const blob = await zip.generateAsync({ type: 'blob' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `ranktica-scripts-export-${Date.now()}.zip`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      toast.success(`Exported ${completedScripts.length} scripts in ZIP! 📦`, { id: tid });
      addHistoryLog(`Bulk exported ${completedScripts.length} scripts in ZIP`, 'export');
    } catch (err) {
      console.error("Scripts ZIP assembly failed:", err);
      toast.error("An error occurred while compiling your scripts ZIP archive.", { id: tid });
    }
  };

  const handleExportThumbnailsZip = async () => {
    const targetIds = selectedIds.length > 0 ? selectedIds : projects.filter(p => !p.archived).map(p => p.id);
    const targetProjects = projects.filter(p => targetIds.includes(p.id));
    const projectsWithThumbnails = targetProjects.filter(p => p.assets?.thumbnail?.prompt || p.assets?.thumbnailDraft);

    if (projectsWithThumbnails.length === 0) {
      toast.error("No generated thumbnails or prompts found in the selected projects.");
      return;
    }

    const tid = toast.loading(`Assembling ZIP archive with ${projectsWithThumbnails.length} thumbnail configs...`);
    try {
      const zip = new JSZip();
      projectsWithThumbnails.forEach(project => {
        const folderName = `${project.title.replace(/[^a-zA-Z0-9_\-]/g, "_")}_thumbnail`;
        const folder = zip.folder(folderName);
        if (!folder) return;

        const thumb = project.assets.thumbnail || {};
        const draft = project.assets.thumbnailDraft;

        let content = `PROJECT: ${project.title}\n`;
        content += `PROMPT: ${thumb.prompt || 'Not specified'}\n`;
        content += `CTR PREDICTION: ${thumb.ctrPrediction || 'TBD'}%\n`;
        content += `STYLE: ${thumb.style || 'cinematic'}\n`;
        content += `RATIO: ${thumb.aspectRatio || '16:9'}\n`;
        if (draft) {
          content += `DRAFT URI: ${draft}\n`;
        }
        folder.file("thumbnail_info.txt", content);

        if (typeof draft === 'string' && draft.startsWith('data:image')) {
          const parts = draft.split(';base64,');
          if (parts.length === 2) {
            const base64Data = parts[1];
            const extension = draft.split(';')[0].split('/')[1] || 'png';
            folder.file(`thumbnail_image.${extension}`, base64Data, { base64: true });
          }
        } else if (typeof draft === 'string' && (draft.startsWith('http') || draft.startsWith('/'))) {
          folder.file("image_link.url", `[InternetShortcut]\nURL=${draft}\n`);
        }
      });

      const blob = await zip.generateAsync({ type: 'blob' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `ranktica-thumbnails-export-${Date.now()}.zip`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      toast.success(`Exported ${projectsWithThumbnails.length} thumbnail configurations in ZIP! 📦`, { id: tid });
      addHistoryLog(`Bulk exported ${projectsWithThumbnails.length} thumbnail configurations in ZIP`, 'export');
    } catch (err) {
      console.error("Thumbnails ZIP assembly failed:", err);
      toast.error("An error occurred while compiling your thumbnails ZIP archive.", { id: tid });
    }
  };

  const handlePdfZipBulkExport = async () => {
    const targetIds = selectedIds.length > 0 ? selectedIds : projects.filter(p => !p.archived).map(p => p.id);
    const targetProjects = projects.filter(p => targetIds.includes(p.id));
    
    if (targetProjects.length === 0) {
      toast.error("No projects selected or active to compile PDF summaries.");
      return;
    }

    const tid = toast.loading(`Synthesizing elite PDF summaries for ${targetProjects.length} projects...`);
    
    try {
      const zip = new JSZip();

      targetProjects.forEach(project => {
        const doc = new jsPDF();
        const margin = 15;
        const pageWidth = doc.internal.pageSize.width;
        const contentWidth = pageWidth - (margin * 2);
        let y = 15;

        const checkPageBreak = (neededHeight: number) => {
          if (y + neededHeight > doc.internal.pageSize.height - 15) {
            doc.addPage();
            y = 15;
          }
        };

        const drawSectionHeader = (title: string) => {
          checkPageBreak(12);
          doc.setFillColor(244, 244, 245);
          doc.rect(margin, y, contentWidth, 7, 'F');
          doc.setFont('helvetica', 'bold');
          doc.setFontSize(9);
          doc.setTextColor(24, 24, 27);
          doc.text(title.toUpperCase(), margin + 3, y + 5);
          y += 11;
        };

        const drawKeyValueRow = (key: string, value: string) => {
          checkPageBreak(6);
          doc.setFont('helvetica', 'bold');
          doc.setFontSize(8.5);
          doc.setTextColor(113, 113, 122);
          doc.text(key, margin + 4, y);
          
          doc.setFont('helvetica', 'normal');
          doc.setFontSize(8.5);
          doc.setTextColor(24, 24, 27);
          const splitValue = doc.splitTextToSize(value, contentWidth - 52);
          doc.text(splitValue, margin + 48, y);
          y += (splitValue.length * 4) + 1.5;
        };

        const drawBulletPoint = (text: string) => {
          checkPageBreak(5);
          doc.setFont('helvetica', 'normal');
          doc.setFontSize(8);
          doc.setTextColor(39, 39, 42);
          doc.text("•", margin + 4, y);
          const splitText = doc.splitTextToSize(text, contentWidth - 10);
          doc.text(splitText, margin + 8, y);
          y += (splitText.length * 4) + 1.5;
        };

        // Header Banner
        doc.setFillColor(9, 9, 11); // zinc-950
        doc.rect(margin, y, contentWidth, 24, 'F');
        
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(13);
        doc.setTextColor(255, 255, 255);
        doc.text("RANKTICA AI  |  PROJECT EXECUTIVE SUMMARY", margin + 6, y + 10);
        
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(8);
        doc.setTextColor(161, 161, 170);
        doc.text(`GENERATED ON: ${new Date().toLocaleString()}  |  PROJECT ID: ${project.id}`, margin + 6, y + 17);
        y += 32;

        // Section 1: Core Profile
        drawSectionHeader("Project Configuration Profile");
        drawKeyValueRow("Project Title", project.title || "Untitled Project");
        drawKeyValueRow("Niche Classification", project.niche || "Not specified");
        drawKeyValueRow("Target Audience", project.audience || "Not specified");
        drawKeyValueRow("Current Pipeline Status", (project.status || "idea").toUpperCase());
        drawKeyValueRow("Estimated Project Cost", localStorage.getItem(`ranktica_project_cost_${project.id}`) || "$0.0245");
        drawKeyValueRow("Description", project.description || "No description provided.");
        y += 3;

        // Section 2: Screenplay Script & Dialogue
        drawSectionHeader("Script & Screenplay Status");
        const scriptExcerpt = project.assets?.script?.dialogue || project.assets?.script?.rawText;
        if (scriptExcerpt) {
          const charCount = scriptExcerpt.length;
          drawKeyValueRow("Dialogue Status", `Drafted & Compiled (${charCount} characters)`);
          
          // Draw a small snippet
          const snippet = scriptExcerpt.substring(0, 250) + (scriptExcerpt.length > 250 ? "..." : "");
          drawKeyValueRow("Script Excerpt", snippet);
        } else {
          drawKeyValueRow("Dialogue Status", "Not started / empty script canvas.");
        }
        y += 3;

        // Section 3: CTR Thumbnail Blueprint
        drawSectionHeader("Thumbnail CTR Blueprint");
        const thumbPrompt = project.assets?.thumbnail?.prompt;
        const ctrPred = project.assets?.thumbnail?.ctrPrediction;
        if (thumbPrompt) {
          drawKeyValueRow("Calculated CTR Projection", `${ctrPred || 'TBD'}%`);
          drawKeyValueRow("Creative Image Prompt", thumbPrompt);
        } else {
          drawKeyValueRow("Thumbnail CTR Status", "No thumbnails generated yet.");
        }
        y += 3;

        // Section 4: Tasks & Milestones
        const projectTasks = project.assets?.tasks || [];
        if (projectTasks.length > 0) {
          drawSectionHeader(`Active Task Inventory (${projectTasks.length} items)`);
          projectTasks.slice(0, 6).forEach((task: any) => {
            const statusText = task.completed ? "[COMPLETED]" : "[PENDING]";
            drawBulletPoint(`${statusText} ${task.title || task.name} - Assigned to: ${task.assignedTo || 'Unassigned'}`);
          });
        }
        y += 3;

        // Footer signature
        checkPageBreak(15);
        y += 5;
        doc.setDrawColor(228, 228, 231);
        doc.line(margin, y, pageWidth - margin, y);
        y += 5;

        doc.setFont('helvetica', 'normal');
        doc.setFontSize(7.5);
        doc.setTextColor(113, 113, 122);
        doc.text("Ranktica AI • High-Performance CMO & Content Strategy Terminal", margin, y);
        doc.text("Page 1 of 1", pageWidth - margin - 15, y);

        // Save into ZIP
        const safeTitle = (project.title || "project").toLowerCase().replace(/[^a-z0-9]+/g, "-");
        const pdfBlob = doc.output('blob');
        zip.file(`${safeTitle}-summary.pdf`, pdfBlob);
      });

      const blob = await zip.generateAsync({ type: 'blob' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `ranktica-project-pdfs-${Date.now()}.zip`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      toast.success(`Exported ZIP containing ${targetProjects.length} Project PDFs! 📄📦`, { id: tid });
      addHistoryLog(`Bulk exported ${targetProjects.length} projects as ZIP of PDF summaries`, 'export');
    } catch (err) {
      console.error("ZIP assembly failed:", err);
      toast.error("An error occurred while compiling your compressed ZIP archive.", { id: tid });
    }
  };

  const handleSinglePdfExport = (project: Project) => {
    const tid = toast.loading(`Synthesizing elite PDF summary for "${project.title}"...`);
    try {
      const doc = new jsPDF();
      const margin = 15;
      const pageWidth = doc.internal.pageSize.width;
      const contentWidth = pageWidth - (margin * 2);
      let y = 15;

      const checkPageBreak = (neededHeight: number) => {
        if (y + neededHeight > doc.internal.pageSize.height - 15) {
          doc.addPage();
          y = 15;
        }
      };

      const drawSectionHeader = (title: string) => {
        checkPageBreak(12);
        doc.setFillColor(244, 244, 245);
        doc.rect(margin, y, contentWidth, 7, 'F');
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(9);
        doc.setTextColor(24, 24, 27);
        doc.text(title.toUpperCase(), margin + 3, y + 5);
        y += 11;
      };

      const drawKeyValueRow = (key: string, value: string) => {
        checkPageBreak(6);
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(8.5);
        doc.setTextColor(113, 113, 122);
        doc.text(key, margin + 4, y);
        
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(8.5);
        doc.setTextColor(24, 24, 27);
        const splitValue = doc.splitTextToSize(value, contentWidth - 52);
        doc.text(splitValue, margin + 48, y);
        y += (splitValue.length * 4) + 1.5;
      };

      const drawBulletPoint = (text: string) => {
        checkPageBreak(5);
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(8);
        doc.setTextColor(39, 39, 42);
        doc.text("•", margin + 4, y);
        const splitText = doc.splitTextToSize(text, contentWidth - 10);
        doc.text(splitText, margin + 8, y);
        y += (splitText.length * 4) + 1.5;
      };

      // Header Banner
      doc.setFillColor(9, 9, 11); // zinc-950
      doc.rect(margin, y, contentWidth, 24, 'F');
      
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(13);
      doc.setTextColor(255, 255, 255);
      doc.text("RANKTICA AI  |  PROJECT EXECUTIVE SUMMARY", margin + 6, y + 10);
      
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      doc.setTextColor(161, 161, 170);
      doc.text(`GENERATED ON: ${new Date().toLocaleString()}  |  PROJECT ID: ${project.id}`, margin + 6, y + 17);
      y += 32;

      // Section 1: Core Profile
      drawSectionHeader("Project Configuration Profile");
      drawKeyValueRow("Project Title", project.title || "Untitled Project");
      drawKeyValueRow("Niche Classification", project.niche || "Not specified");
      drawKeyValueRow("Target Audience", project.audience || "Not specified");
      drawKeyValueRow("Current Pipeline Status", (project.status || "idea").toUpperCase());
      drawKeyValueRow("Estimated Project Cost", localStorage.getItem(`ranktica_project_cost_${project.id}`) || "$0.0245");
      drawKeyValueRow("Description", project.description || "No description provided.");
      y += 3;

      // Section 2: Screenplay Script & Dialogue
      drawSectionHeader("Script & Screenplay Status");
      const scriptExcerpt = project.assets?.script?.dialogue || project.assets?.script?.rawText;
      if (scriptExcerpt) {
        const charCount = scriptExcerpt.length;
        drawKeyValueRow("Dialogue Status", `Drafted & Compiled (${charCount} characters)`);
        
        // Draw a small snippet
        const snippet = scriptExcerpt.substring(0, 250) + (scriptExcerpt.length > 250 ? "..." : "");
        drawKeyValueRow("Script Excerpt", snippet);
      } else {
        drawKeyValueRow("Dialogue Status", "Not started / empty script canvas.");
      }
      y += 3;

      // Section 3: CTR Thumbnail Blueprint
      drawSectionHeader("Thumbnail CTR Blueprint");
      const thumbPrompt = project.assets?.thumbnail?.prompt;
      const ctrPred = project.assets?.thumbnail?.ctrPrediction;
      if (thumbPrompt) {
        drawKeyValueRow("Calculated CTR Projection", `${ctrPred || 'TBD'}%`);
        drawKeyValueRow("Creative Image Prompt", thumbPrompt);
      } else {
        drawKeyValueRow("Thumbnail CTR Status", "No thumbnails generated yet.");
      }
      y += 3;

      // Section 4: Tasks & Milestones
      const projectTasks = project.assets?.tasks || [];
      if (projectTasks.length > 0) {
        drawSectionHeader(`Active Task Inventory (${projectTasks.length} items)`);
        projectTasks.slice(0, 6).forEach((task: any) => {
          const statusText = task.completed ? "[COMPLETED]" : "[PENDING]";
          drawBulletPoint(`${statusText} ${task.title || task.name} - Assigned to: ${task.assignedTo || 'Unassigned'}`);
        });
      }
      y += 3;

      // Footer signature
      checkPageBreak(15);
      y += 5;
      doc.setDrawColor(228, 228, 231);
      doc.line(margin, y, pageWidth - margin, y);
      y += 5;

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7.5);
      doc.setTextColor(113, 113, 122);
      doc.text("Ranktica AI • High-Performance CMO & Content Strategy Terminal", margin, y);
      doc.text("Page 1 of 1", pageWidth - margin - 15, y);

      const safeTitle = (project.title || "project").toLowerCase().replace(/[^a-z0-9]+/g, "-");
      doc.save(`ranktica-${safeTitle}-summary-${Date.now()}.pdf`);
      toast.success(`Exported PDF summary for "${project.title}"! 📄`, { id: tid });
      addHistoryLog(`Exported project "${project.title}" as PDF executive summary`, 'export');
    } catch (err) {
      console.error("PDF synthesis failed:", err);
      toast.error("Failed to generate PDF summary.", { id: tid });
    }
  };

  const handleExportBackup = () => {
    const activeProjects = projects.filter(p => !p.archived);
    if (activeProjects.length === 0) {
      toast.error("No active projects found to export.");
      return;
    }
    const jsonString = JSON.stringify(activeProjects, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `ranktica-active-backup-${Date.now()}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    toast.success(`Offline backup files exported! ${activeProjects.length} active manifests compiled.`);
    addHistoryLog(`Exported offline backup file with all active project manifests`, 'export');
  };

  const handleExportSnapshot = () => {
    try {
      const snapshot: Record<string, string | null> = {};
      for (let i = 0; i < window.localStorage.length; i++) {
        const key = window.localStorage.key(i);
        if (key && (
          key.startsWith('ranktica_') || 
          key.startsWith('ranktica-') || 
          key.startsWith('rt_') ||
          key.startsWith('neural_vision_hub_') ||
          key.startsWith('team_member_') ||
          key.startsWith('team_sync_') ||
          key.startsWith('sync_slack_') ||
          key.startsWith('sync_discord_') ||
          key.startsWith('auto_balance_') ||
          key === 'language'
        )) {
          snapshot[key] = window.localStorage.getItem(key);
        }
      }

      const blob = new Blob([JSON.stringify(snapshot, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `ranktica_workspace_snapshot_${Date.now()}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      toast.success("🧠 Workspace snapshot exported! Saved all configurations.");
      addHistoryLog("Exported full workspace snapshot environment config", "export");
    } catch (err: any) {
      toast.error(`Snapshot failed: ${err.message || err}`);
    }
  };

  const handleImportSnapshot = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const snapshot = JSON.parse(event.target?.result as string);
        if (!snapshot || typeof snapshot !== 'object') {
          throw new Error("Invalid snapshot format");
        }

        Object.entries(snapshot).forEach(([key, value]) => {
          if (typeof value === 'string') {
            window.localStorage.setItem(key, value);
          }
        });

        toast.success("🌅 Workspace snapshot imported successfully! Reloading configuration context...");
        setTimeout(() => {
          window.location.reload();
        }, 1500);
      } catch (err: any) {
        toast.error(`Failed to load snapshot: ${err.message || err}`);
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const handleCloudBackup = async () => {
    const targetProject = activeProject || projects.filter(p => !p.archived)[0];
    if (!targetProject) {
      toast.error("No active projects found to back up to the cloud.");
      return;
    }

    try {
      if (backupProjectToCloud) {
        const toastId = toast.loading(`Backing up "${targetProject.title}" securely to Firestore...`);
        await backupProjectToCloud(targetProject.id);
        toast.dismiss(toastId);
        toast.success(`Successfully backed up "${targetProject.title}" to Firestore!`, { icon: '☁️' });
        addHistoryLog(`Manual cloud backup of "${targetProject.title}" created on Firestore`, 'save', { projectId: targetProject.id, title: targetProject.title });
      } else {
        toast.error("Cloud backup is not configured or unavailable.");
      }
    } catch (err: any) {
      toast.error(err.message || "Cloud backup failed. Check your connection or permissions.");
    }
  };

  const handleJsonImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setBulkImportFileName(file.name);
    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const json = JSON.parse(event.target?.result as string);
        const projectsToImport: Project[] = Array.isArray(json) ? json : [json];
        
        if (projectsToImport.length === 0) {
          toast.error("Import file is empty.");
          return;
        }

        const isValid = projectsToImport.every(p => p && typeof p === "object" && p.title);
        if (!isValid) {
          toast.error("Invalid project schema. Manifests must contain a title.");
          return;
        }

        setBulkImportList(projectsToImport);
      } catch (err) {
        console.error("Failed to parse JSON file:", err);
        toast.error("Failed to parse file. Please configure correct JSON schema.");
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const handleCommitBulkImport = async () => {
    if (!bulkImportList || bulkImportList.length === 0) return;

    const toastId = toast.loading(`Importing ${bulkImportList.length} workspace manifests...`);
    let importedCount = 0;

    for (const proj of bulkImportList) {
      const cleanProj: Project = {
        id: proj.id || `import-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
        title: proj.title,
        niche: proj.niche || 'General',
        audience: proj.audience || 'General Audience',
        status: proj.status || 'idea',
        description: proj.description || '',
        folderId: proj.folderId || '',
        lastUpdated: proj.lastUpdated || Date.now(),
        assets: proj.assets || {},
        team: proj.team || ['AI Swarm Owner'],
        archived: Boolean(proj.archived)
      };
      await addCustomProject(cleanProj);
      importedCount++;
    }

    toast.success(`Successfully loaded ${importedCount} project manifests!`, { id: toastId });
    addHistoryLog(`Imported ${importedCount} projects successfully via file sandbox`, 'import');
    setBulkImportList(null);
    setBulkImportFileName('');
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProjectName.trim()) return;

    try {
      await createProject(
        newProjectName, 
        newProjectNiche || 'General', 
        newProjectAudience || 'General Audience'
      );
      toast.success(`Project "${newProjectName}" successfully initialized!`);
      addHistoryLog({
        id: `create-${Date.now()}-${Math.random()}`,
        action: `Initialized brand new workspace manifest "${newProjectName}"`,
        type: 'save',
        timestamp: new Date().toISOString(),
        metadata: { title: newProjectName, niche: newProjectNiche || 'General', audience: newProjectAudience || 'General Audience' }
      });
      setIsCreating(false);
      setNewProjectName('');
      setNewProjectNiche('');
      setNewProjectAudience('');
    } catch {
      toast.error('Failed to initialize project manifest.');
    }
  };

  const updateStatus = async (id: string, newStatus: Project['status']) => {
    try {
      await updateProject(id, { status: newStatus });
      const targetProj = projects.find(p => p.id === id);
      addHistoryLog({
        id: `status-${Date.now()}-${Math.random()}`,
        action: `Moved project "${targetProj?.title || id}" to "${newStatus.toUpperCase()}" phase`,
        type: 'save',
        timestamp: new Date().toISOString(),
        metadata: { projectId: id, title: targetProj?.title, newStatus }
      });
      toast.success(`Project updated to ${newStatus} phase!`);
    } catch {
      toast.error('Failed to migrate project status.');
    }
  };

  const handleArchiveToggle = async (id: string, title: string, isArchived: boolean) => {
    try {
      await toggleArchiveProject(id);
      addHistoryLog({
        id: `archive-${Date.now()}-${Math.random()}`,
        action: isArchived ? `Restored project "${title}" to active workspace` : `Archived project "${title}"`,
        type: 'save',
        timestamp: new Date().toISOString(),
        metadata: { projectId: id, title, archived: !isArchived }
      });
      toast.success(isArchived ? `Restored "${title}" to active workspace.` : `Archived "${title}" successfully.`);
    } catch {
      toast.error('Failed to change archive state.');
    }
  };

  const handleDelete = async (id: string, title: string) => {
    if (confirm(`Are you absolutely sure you want to delete "${title}"? This action is irreversible.`)) {
      try {
        await deleteProject(id);
        addHistoryLog({
          id: `delete-${Date.now()}-${Math.random()}`,
          action: `Deleted project manifest "${title}" permanently`,
          type: 'save',
          timestamp: new Date().toISOString(),
          metadata: { projectId: id, title }
        });
        toast.success(`Deleted project "${title}".`);
      } catch {
        toast.error('Failed to remove project manifest.');
      }
    }
  };

  const handleCopyLink = () => {
    if (!shareProject) return;
    const expiresMs = getExpiryTimestamp(shareExpiresOption);
    const shareUrl = `${window.location.origin}?shared_ids=${shareProject.id}&collab=true&expires=${expiresMs}`;
    navigator.clipboard.writeText(shareUrl);
    setCopiedLink(true);
    toast.success('Public read-only collaboration link generated and copied to clipboard!');
    addHistoryLog(`Generated public read-only collaboration link for "${shareProject.title}"`, 'export', { projectId: shareProject.id });
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const handleInvite = (e: React.FormEvent) => {
    e.preventDefault();
    if (inviteEmail && shareProject) {
      const currentTeam = shareProject.team || [];
      if (currentTeam.includes(inviteEmail)) {
        toast.error(`${inviteEmail} is already authorized in this project team!`);
        return;
      }
      const updatedTeam = [...currentTeam, inviteEmail];
      updateProject(shareProject.id, { team: updatedTeam });
      toast.success(`Collaboration invitation dispatched and authorized for ${inviteEmail}! 👥`);
      setInviteEmail('');
      setShareProject(null);
    }
  };

  const columns = [
    { id: 'idea', label: 'Idea Phase', color: 'bg-zinc-500' },
    { id: 'scripting', label: 'Scripting', color: 'bg-blue-500' },
    { id: 'production', label: 'Production', color: 'bg-orange-500' },
    { id: 'scheduled', label: 'Scheduled', color: 'bg-purple-500' },
    { id: 'published', label: 'Published', color: 'bg-green-500' }
  ];

  // Helper for Smart Prioritizing Algorithm
  const getPriorityScore = (p: Project) => {
    let score = 0;
    
    // 1. Deadline urgency
    if (p.deadline) {
      const deadlineMs = new Date(p.deadline).getTime();
      if (!isNaN(deadlineMs)) {
        const diffDays = (deadlineMs - Date.now()) / (1000 * 60 * 60 * 24);
        if (diffDays < 0) {
          score += 200; // Overdue is critical!
        } else if (diffDays <= 2) {
          score += 150; // Coming up in next 48 hours
        } else if (diffDays <= 7) {
          score += 90;  // This week
        } else if (diffDays <= 30) {
          score += 45;  // This month
        } else {
          score += 15;
        }
      }
    }
    
    // 2. Status Urgency
    switch (p.status) {
      case 'scheduled': score += 95; break;   // Needs to publish
      case 'production': score += 75; break;  // In active production
      case 'scripting': score += 50; break;   // Script development
      case 'idea': score += 20; break;        // Idea development
      case 'published': score += 0; break;    // Already finished, no current priority
    }
    
    // 3. Activity recency
    const ageHrs = (Date.now() - p.lastUpdated) / (1000 * 60 * 60);
    if (ageHrs <= 12) {
      score += 60; // Extremely active
    } else if (ageHrs <= 48) {
      score += 40; // Active recently
    } else if (ageHrs <= 168) {
      score += 20; // This week
    }

    return score;
  };

  // Filter projects based on tab, search text query, tag query, and folder query
  const filteredProjects = useMemo(() => {
    let list = projects;
    
    if (collabMode) {
      const params = new URLSearchParams(window.location.search);
      const sharedIdsStr = params.get('shared_ids') || '';
      const ids = sharedIdsStr.split(',').filter(Boolean);
      
      list = ids.map(id => {
        const found = projects.find(p => p.id === id);
        if (found) return found;
        
        // Return highly polished mock workspace for collaborator
        return {
          id: id,
          title: `Shared Collaboration Pipeline #${id.slice(-4).toUpperCase()}`,
          niche: 'Shared Campaign Pipelines',
          audience: 'Brand Stakeholders, Creators',
          description: 'A read-only temporary workspace bundle shared via Ranktica command board.',
          status: 'production',
          lastUpdated: Date.now(),
          assets: {
            tags: ['external-collab', 'read', 'shared-view'],
            script: 'This Content development document is accessible in shared guest mode only.'
          },
          team: ['client-review@ranktica.ai', 'creator@ranktica.ai']
        } as Project;
      });
    }

    const matched = list.filter(p => {
      // If we are in regular mode, filter by active vs archived tabs
      if (!collabMode) {
        const isArchived = Boolean(p.archived);
        const matchesTab = activeTab === 'archived' ? isArchived : !isArchived;
        if (!matchesTab) return false;
      }

      // 1. Full-text search (title, status, creation date, description, niche, audience, assigned tags, and folder collections)
      const searchLow = searchQuery.toLowerCase().trim();
      const matchesSearch = !searchLow ||
        (p.title && p.title.toLowerCase().includes(searchLow)) ||
        (p.status && p.status.toLowerCase().includes(searchLow)) ||
        (p.niche && p.niche.toLowerCase().includes(searchLow)) ||
        (p.audience && p.audience.toLowerCase().includes(searchLow)) ||
        (p.description && p.description.toLowerCase().includes(searchLow)) ||
        (p.assets?.metadata_topic && p.assets.metadata_topic.toLowerCase().includes(searchLow)) ||
        (p.assets?.metadata_description && String(p.assets.metadata_description).toLowerCase().includes(searchLow)) ||
        (p.assets?.tags && Array.isArray(p.assets.tags) && p.assets.tags.some(t => t.toLowerCase().includes(searchLow))) ||
        (p.folderId && folders.find(f => f.id === p.folderId)?.name.toLowerCase().includes(searchLow)) ||
        (() => {
          const timestamp = Number(p.id);
          if (!isNaN(timestamp) && timestamp > 0) {
            const d = new Date(timestamp);
            const creationDateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')} ${d.toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })}`;
            return creationDateStr.toLowerCase().includes(searchLow);
          }
          return false;
        })();

      // 2. Filter Tag
      const matchesTag = !selectedTag || (p.assets?.tags && Array.isArray(p.assets.tags) && p.assets.tags.includes(selectedTag));

      // 3. Filter Folder
      const matchesFolder = !selectedFolderId || p.folderId === selectedFolderId;

      return matchesSearch && matchesTag && matchesFolder;
    });

    // Apply sorting strategies
    if (sortStrategy === 'smart_sort') {
      return [...matched].sort((a, b) => getPriorityScore(b) - getPriorityScore(a));
    } else if (sortStrategy === 'lastUpdated') {
      return [...matched].sort((a, b) => b.lastUpdated - a.lastUpdated);
    } else {
      return matched;
    }
  }, [projects, collabMode, searchQuery, selectedTag, selectedFolderId, activeTab, folders, sortStrategy]);

  // Keyboard shortcut listener for Ctrl+E (Instant Metadata Download)
  useEffect(() => {
    const handleShortcut = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'e') {
        e.preventDefault();
        
        let targetProjects: Project[] = [];
        if (selectedIds.length > 0) {
          targetProjects = projects.filter(p => selectedIds.includes(p.id));
        } else if (editingProject) {
          targetProjects = [editingProject];
        } else if (filteredProjects && filteredProjects.length > 0) {
          targetProjects = [filteredProjects[0]];
        }

        if (targetProjects.length > 0) {
          const content = JSON.stringify(targetProjects, null, 2);
          const blob = new Blob([content], { type: 'application/json' });
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          const fileName = targetProjects.length === 1 
            ? `${targetProjects[0].title.toLowerCase().replace(/[^a-z0-9]+/g, '_')}_metadata.json`
            : `ranktica_bulk_projects_metadata.json`;
          a.download = fileName;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          URL.revokeObjectURL(url);
          toast.success(`Ctrl+E Triggered: Downloaded metadata for ${targetProjects.length} project(s)!`);
          addHistoryLog(`Exported project metadata via Ctrl+E keyboard pipeline`, 'export', { count: targetProjects.length });
        } else {
          toast.error("No active project detected for instant download shortcut.");
        }
      }
    };

    window.addEventListener('keydown', handleShortcut);
    return () => window.removeEventListener('keydown', handleShortcut);
  }, [selectedIds, projects, editingProject, filteredProjects]);

  return (
    <div id="project_board_container" ref={containerRef} onPointerMove={handlePointerMove} className="h-full flex flex-col space-y-8 animate-fade-in pb-10 relative overflow-hidden">
      {/* Real-time Collaboration Cursor Layer */}
      {isCollabConnected && collabUsers.map((collabUser, index) => {
        const myName = (user as any)?.displayName || (user as any)?.name || user?.email?.split('@')[0];
        if (!collabUser.x || !collabUser.y || collabUser.username === myName) return null;
        return (
          <div
            key={index}
            className="absolute pointer-events-none transition-all duration-75 z-[99]"
            style={{
              left: `${collabUser.x}%`,
              top: `${collabUser.y}%`,
            }}
          >
            <svg
              className="w-5 h-5 drop-shadow-md"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M3 3V19.5L8.5 14L13.5 24L17.5 22L12.5 12H19.5L3 3Z"
                fill={collabUser.color || '#ec4899'}
                stroke="white"
                strokeWidth="1.5"
                strokeLinejoin="round"
              />
            </svg>
            <div
              className="px-2 py-0.5 rounded-md text-[9px] font-mono font-black text-white uppercase tracking-wider whitespace-nowrap shadow-md ml-4 mt-1"
              style={{ backgroundColor: collabUser.color || '#ec4899' }}
            >
              {collabUser.username}
            </div>
          </div>
        );
      })}

      {/* Collaboration Live Session Banner */}
      {collabMode && (
         <div className="bg-gradient-to-r from-blue-910/40 to-indigo-950/40 border border-blue-500/30 p-4 rounded-[2rem] flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 backdrop-blur shadow-lg">
            <div className="flex items-center gap-3">
               <span className="flex h-2.5 w-2.5 relative">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-blue-500" />
               </span>
               <div>
                  <h4 className="text-xs font-black text-white uppercase tracking-wider flex items-center gap-2">Read-Only Collaboration Lounge</h4>
                  <p className="text-[10px] text-zinc-400 mt-0.5">Decrypting temporary shared bundle. Syncs, creation, write states, and destructive controls are frozen.</p>
               </div>
            </div>
            <button 
               type="button"
               onClick={() => {
                  window.location.href = window.location.pathname;
               }}
               className="text-[9px] font-black uppercase tracking-widest text-blue-400 hover:text-white bg-blue-950/40 border border-blue-500/20 rounded-xl px-3 py-1.5 transition-all self-end sm:self-auto cursor-pointer"
            >
               Exit Session
            </button>
         </div>
      )}

      {/* Top action section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between shrink-0 gap-4">
         <div>
            <h2 className="text-3xl font-extrabold text-white tracking-tight flex flex-col sm:flex-row sm:items-center gap-3">
              <span>Production Command Board</span>
              {isCollabConnected && collabUsers.length > 0 && (
                <div className="flex items-center gap-1.5 bg-zinc-900 border border-zinc-800 px-3 py-1 rounded-full text-[10px] font-mono text-zinc-400 select-none">
                  <span className="flex h-1.5 w-1.5 relative">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                    <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500" />
                  </span>
                  <span>{collabUsers.length} ONLINE</span>
                  <div className="flex -space-x-1.5 overflow-hidden ml-1">
                    {collabUsers.map((u, i) => (
                      <div 
                        key={i}
                        className="w-4 h-4 rounded-full flex items-center justify-center text-[8px] font-black uppercase text-white shadow border border-zinc-950"
                        style={{ backgroundColor: u.color }}
                        title={u.username}
                      >
                        {u.username.substring(0, 2)}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </h2>
            <p className="text-zinc-400 text-sm font-medium">Coordinate dynamic content pipelines across your creation workspace.</p>
         </div>
         <div className="flex items-center gap-4 self-start md:self-auto">
            {/* Active / Archive tab selectors */}
            <div className="flex bg-zinc-900/60 rounded-2xl p-1 border border-zinc-800 shadow-md">
              <button 
                type="button"
                onClick={() => setActiveTab('overview')} 
                className={`px-5 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center gap-1.5 ${activeTab === 'overview' ? 'bg-indigo-600 text-white shadow' : 'text-zinc-500 hover:text-zinc-300'}`}
              >
                <LayoutGrid size={14} /> Overview
              </button>
              <button 
                type="button"
                onClick={() => setActiveTab('active')} 
                className={`px-5 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center gap-1.5 ${activeTab === 'active' ? 'bg-red-600 text-white shadow' : 'text-zinc-500 hover:text-zinc-300'}`}
              >
                <Inbox size={14} /> Active Work
              </button>
              <button 
                type="button"
                onClick={() => setActiveTab('timeline')} 
                className={`px-5 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center gap-1.5 ${activeTab === 'timeline' ? 'bg-blue-600 text-white shadow' : 'text-zinc-500 hover:text-zinc-300'}`}
              >
                <Calendar size={14} /> Project Timeline
              </button>
              <button 
                type="button"
                onClick={() => setActiveTab('dependency_graph')} 
                className={`px-5 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center gap-1.5 ${activeTab === 'dependency_graph' ? 'bg-purple-600 text-white shadow' : 'text-zinc-500 hover:text-zinc-300'}`}
              >
                <Activity size={14} /> Dependency Graph
              </button>
              <button 
                type="button"
                onClick={() => setActiveTab('archived')} 
                className={`px-5 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center gap-1.5 ${activeTab === 'archived' ? 'bg-zinc-800 text-white shadow ring-1 ring-zinc-700/30' : 'text-zinc-500 hover:text-zinc-300'}`}
              >
                <Archive size={14} /> Archived ({projects.filter(p => p.archived).length})
              </button>
            </div>

            <button 
              type="button"
              onClick={() => setShowHistory(true)}
              className="bg-zinc-900 hover:bg-zinc-800 text-zinc-300 px-5 py-3 rounded-2xl font-black text-xs uppercase tracking-wider shadow border border-zinc-850 flex items-center gap-2 active-press transition-all hover:text-white"
              title="View your production audit and event ledger"
            >
              <History size={14} /> History ({historyLogs.length})
            </button>

            <label className="bg-zinc-900 hover:bg-zinc-800 text-zinc-300 px-5 py-3 rounded-2xl font-black text-xs uppercase tracking-wider shadow border border-zinc-850 flex items-center gap-2 active-press transition-all hover:text-white cursor-pointer select-none">
              <Upload size={14} /> Import Backup
              <input 
                type="file" 
                accept=".json" 
                onChange={handleJsonImport} 
                className="hidden" 
              />
            </label>

            <button 
              type="button"
              onClick={handleExportBackup}
              className="bg-zinc-900 hover:bg-zinc-800 text-zinc-300 px-5 py-3 rounded-2xl font-black text-xs uppercase tracking-wider shadow border border-zinc-850 flex items-center gap-2 active-press transition-all hover:text-white"
              title="Export all active projects as backup JSON file"
            >
              <Download size={14} /> Export Backup
            </button>

            {/* Workspace Snapshots */}
            <label className="bg-zinc-900/60 hover:bg-zinc-800 text-purple-400 border border-purple-950 hover:border-purple-800 px-5 py-3 rounded-2xl font-black text-xs uppercase tracking-wider shadow flex items-center gap-2 active-press transition-all cursor-pointer select-none">
              <Upload size={14} /> Load Snapshot
              <input 
                type="file" 
                accept=".json" 
                onChange={handleImportSnapshot} 
                className="hidden" 
              />
            </label>

            <button 
              type="button"
              onClick={handleExportSnapshot}
              className="bg-zinc-900/60 hover:bg-zinc-800 text-purple-400 border border-purple-950 hover:border-purple-800 px-5 py-3 rounded-2xl font-black text-xs uppercase tracking-wider shadow flex items-center gap-2 active-press transition-all"
              title="Export complete state of all open tool configurations as JSON snapshot"
            >
              <Download size={14} /> Take Snapshot
            </button>

            <button 
              type="button"
              onClick={handleCloudBackup}
              className="bg-zinc-900 hover:bg-zinc-800 text-zinc-300 px-5 py-3 rounded-2xl font-black text-xs uppercase tracking-wider shadow border border-zinc-850 flex items-center gap-2 active-press transition-all hover:text-white"
              title="Backup current active project state to Firestore"
            >
              <Cloud size={14} /> Backup Now
            </button>

            <button 
              type="button"
              onClick={() => setIsCreating(true)}
              className="bg-red-600 hover:bg-red-500 text-white px-6 py-3 rounded-2xl font-black text-xs uppercase tracking-wider shadow-lg shadow-red-600/20 flex items-center gap-2 active-press transition-all border border-red-500"
            >
              <Plus size={16} /> New Manifest
            </button>
         </div>
      </div>

      {isCreating && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-md p-4 animate-fade-in">
           <form onSubmit={handleCreate} className="bg-zinc-900/90 border border-zinc-800 rounded-[2.5rem] p-10 w-full max-w-md shadow-2xl relative">
              <div className="absolute top-0 right-0 w-32 h-32 bg-red-600/5 rounded-full blur-2xl pointer-events-none" />
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-2xl font-black text-white tracking-tight">Initialize Workspace</h3>
                <button type="button" onClick={() => setIsCreating(false)} className="p-1 hover:bg-zinc-800 rounded-lg text-zinc-500 hover:text-white transition-colors"><XIcon size={18} /></button>
              </div>
              <div className="space-y-6">
                 <div>
                    <label className="text-[10px] font-black text-zinc-500 uppercase block mb-2 tracking-[0.2em]">Project / Video Title</label>
                    <input 
                      value={newProjectName}
                      onChange={e => setNewProjectName(e.target.value)}
                      placeholder="e.g. 100 Days Surviving in Deep Ocean"
                      className="w-full bg-zinc-950 border border-zinc-800 rounded-2xl p-4 text-white text-xs focus:border-red-500 focus:ring-1 focus:ring-red-500/50 outline-none transition-all placeholder:text-zinc-700 font-mono"
                      autoFocus
                      required
                    />
                 </div>
                 <div>
                    <label className="text-[10px] font-black text-zinc-500 uppercase block mb-2 tracking-[0.2em]">Primary Niche</label>
                    <input 
                      value={newProjectNiche}
                      onChange={e => setNewProjectNiche(e.target.value)}
                      placeholder="e.g. Gaming / Challenge"
                      className="w-full bg-zinc-950 border border-zinc-800 rounded-2xl p-4 text-white text-xs focus:border-red-500 focus:ring-1 focus:ring-red-500/50 outline-none transition-all placeholder:text-zinc-700 font-mono"
                    />
                 </div>
                 <div>
                    <label className="text-[10px] font-black text-zinc-500 uppercase block mb-2 tracking-[0.2em]">Target Viewer Persona</label>
                    <input 
                      value={newProjectAudience}
                      onChange={e => setNewProjectAudience(e.target.value)}
                      placeholder="e.g. Teenagers, Minecraft Enthusiasts"
                      className="w-full bg-zinc-950 border border-zinc-800 rounded-2xl p-4 text-white text-xs focus:border-red-500 focus:ring-1 focus:ring-red-500/50 outline-none transition-all placeholder:text-zinc-700 font-mono"
                    />
                 </div>
                 <div className="flex gap-4 mt-8 pt-4">
                    <button type="button" onClick={() => setIsCreating(false)} className="flex-1 py-3.5 text-xs text-zinc-400 hover:text-white font-black uppercase tracking-wider transition-colors">Abort</button>
                    <button type="submit" disabled={!newProjectName} className="flex-[2] bg-red-600 hover:bg-red-500 disabled:opacity-40 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-lg shadow-red-600/10 active-press transition-all border border-red-500">Engage Pipeline</button>
                 </div>
              </div>
           </form>
        </div>
      )}

      {/* Share Modal */}
      {shareProject && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-md p-4 animate-fade-in">
           <div className="bg-zinc-900 border border-zinc-800 rounded-[2rem] p-10 w-full max-w-md shadow-2xl relative">
              <div className="flex justify-between items-start mb-8">
                 <div>
                    <h3 className="text-xl font-black text-white tracking-tight">Ecosystem Sharing</h3>
                    <p className="text-xs text-zinc-400 mt-1">Configure authorization pathways for "{shareProject.title}"</p>
                 </div>
                 <button onClick={() => setShareProject(null)} className="p-2 hover:bg-zinc-800 rounded-full text-zinc-500 transition-colors"><XIcon size={20} /></button>
              </div>

               <div className="space-y-6">
                 <div>
                    <label className="text-[9px] font-black text-zinc-500 uppercase block mb-2 tracking-[0.2em]">Direct Invite Email</label>
                    <form onSubmit={handleInvite} className="flex gap-2">
                       <input 
                         type="email" 
                         value={inviteEmail}
                         onChange={e => setInviteEmail(e.target.value)}
                         placeholder="collab@ranktica.ai"
                         className="flex-1 bg-zinc-950 border border-zinc-850 rounded-xl px-4 py-3 text-white text-xs outline-none focus:border-red-500 transition-all font-mono"
                         required
                       />
                       <button type="submit" className="bg-zinc-800 border border-zinc-700 hover:border-zinc-600 text-white px-5 rounded-xl text-xs font-bold shadow transition-all">Invite</button>
                    </form>
                 </div>

                 <div>
                    <div className="flex justify-between items-center mb-2">
                        <label className="text-[9px] font-black text-zinc-500 uppercase block tracking-[0.2em]">Secure Read-Only URL</label>
                        <select
                           value={shareExpiresOption}
                           onChange={e => setShareExpiresOption(e.target.value)}
                           className="bg-zinc-950 border border-zinc-850 rounded-lg py-1 px-2 text-[9px] text-zinc-400 font-bold uppercase outline-none focus:border-red-500 transition-colors cursor-pointer"
                        >
                           <option value="24h">Expires 24h</option>
                           <option value="7d">Expires 7d</option>
                           <option value="30d">Expires 30d</option>
                           <option value="never">Permanent</option>
                        </select>
                     </div>
                    <div className="flex gap-2 bg-zinc-950 border border-zinc-850 p-3 rounded-xl items-center">
                       <span className="flex-1 text-[11px] text-zinc-500 truncate flex items-center gap-2 font-mono">
                          <LinkIcon size={12} className="text-zinc-800" />
                          {window.location.origin}?shared_ids={shareProject.id}&collab=true
                       </span>
                       <button onClick={handleCopyLink} className="text-zinc-400 hover:text-white p-2 hover:bg-zinc-800 rounded-lg transition-all">
                          {copiedLink ? <Check size={14} className="text-green-500 animate-scale-in" /> : <CopyIcon size={14} />}
                       </button>
                    </div>
                 </div>

                 <div className="bg-red-500/5 p-4 rounded-2xl border border-red-500/10 flex items-start gap-3">
                    <Users size={18} className="text-red-500 mt-0.5 shrink-0" />
                    <p className="text-[10px] text-zinc-505 text-zinc-500 leading-relaxed font-semibold">Authorized creators gain absolute editing privileges over this manifest, enabling joint scripts, concurrent thumbnail planning, and synced SEO optimizations.</p>
                 </div>
              </div>
           </div>
        </div>
      )}

      {/* Analytics & Insight Widget Area */}
      <div className="bg-zinc-900/30 border border-zinc-800/80 p-6 rounded-[2rem] relative overflow-hidden transition-all hover:border-zinc-700/50 shrink-0">
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-2">
            <BarChart3 className="text-red-500" size={16} />
            <h3 className="text-xs font-black uppercase tracking-[0.2em] text-white">WORKSPACE INTELLIGENCE HUB</h3>
          </div>
          <div className="flex items-center gap-2">
            <button 
              onClick={() => setShowVisualizations(!showVisualizations)} 
              className={`text-[10px] font-black uppercase tracking-wider transition-all border px-3 py-1.5 rounded-xl flex items-center gap-1.5 ${showVisualizations ? "bg-red-500/15 text-red-500 border-red-550/30" : "bg-zinc-950 border-zinc-800 text-zinc-500 hover:text-white"}`}
            >
              <Activity size={11} className={showVisualizations ? "animate-pulse text-red-500" : ""} /> D3 Trend Tracker
            </button>
            <button 
              onClick={() => setShowCharts(!showCharts)} 
              className="text-[10px] font-black uppercase tracking-wider text-zinc-500 hover:text-white transition-all bg-zinc-950 border border-zinc-800 px-3 py-1.5 rounded-xl"
            >
              {showCharts ? "Hide Dashboard" : "Show Dashboard"}
            </button>
          </div>
        </div>

        {showCharts && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-scale-in">
            {/* Left Chart: Status Distribution */}
            <div className="flex flex-col justify-between">
              <div>
                <h4 className="text-[10px] font-black uppercase tracking-widest text-zinc-400 flex items-center gap-1.5 mb-1">
                  <PieIcon size={12} className="text-zinc-500" /> Pipeline Status Density
                </h4>
                <p className="text-zinc-500 text-[11px] font-medium font-sans">Real-time status metrics mapping density across project phases.</p>
              </div>
              
              <div className="h-44 my-3 flex items-center justify-center relative">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={statusDistribution}
                      innerRadius={45}
                      outerRadius={65}
                      paddingAngle={4}
                      dataKey="value"
                    >
                      {statusDistribution.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.fill} />
                      ))}
                    </Pie>
                    <Tooltip 
                      contentStyle={{ background: '#0e0e11', border: '1px solid #27272a', borderRadius: '12px', fontSize: '10px' }}
                      itemStyle={{ color: '#fff' }}
                    />
                  </PieChart>
                </ResponsiveContainer>
                {/* Center readout */}
                <div className="absolute flex flex-col items-center justify-center text-center">
                  <span className="text-2xl font-black text-white leading-none font-mono tracking-tight">
                    {projects.length}
                  </span>
                  <span className="text-[8px] font-black uppercase text-zinc-500 tracking-wider mt-0.5">
                    Total
                  </span>
                </div>
              </div>

              {/* Custom Legend */}
              <div className="grid grid-cols-3 gap-2 text-[8px] font-black uppercase text-zinc-500 bg-zinc-950/40 p-2.5 rounded-xl border border-zinc-850/60 mt-1 max-h-16 overflow-y-auto custom-scrollbar">
                {statusDistribution.map((entry, i) => (
                  <div key={i} className="flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: entry.fill }} />
                    <span className="truncate">{entry.name}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Middle Chart: 30-Day Growth Trend */}
            <div className="flex flex-col justify-between">
              <div className="flex justify-between items-start">
                <div>
                  <h4 className="text-[10px] font-black uppercase tracking-widest text-zinc-400 flex items-center gap-1.5 mb-1">
                    <TrendingUp size={12} className="text-zinc-500" /> Accumulative Growth Velocity
                  </h4>
                  <p className="text-zinc-500 text-[11px] font-medium font-sans">Accumulation rate and scale trend over the last 30 days.</p>
                </div>
              </div>

              <div className="h-44 my-3">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={growthTrendData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                    <defs>
                      <linearGradient id="growthGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#ef4444" stopOpacity={0.25}/>
                        <stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <XAxis 
                      dataKey="date" 
                      stroke="#52525b" 
                      fontSize={8} 
                      tickLine={false} 
                      axisLine={false}
                    />
                    <YAxis 
                      stroke="#52525b" 
                      fontSize={8} 
                      tickLine={false} 
                      axisLine={false}
                      allowDecimals={false}
                    />
                    <Tooltip 
                      contentStyle={{ background: '#0e0e11', border: '1px solid #27272a', borderRadius: '12px', fontSize: '10px' }}
                      labelStyle={{ color: '#e4e4e7', fontWeight: 'bold' }}
                      itemStyle={{ color: '#ef4444' }}
                    />
                    <Area 
                      type="monotone" 
                      dataKey="Projects" 
                      stroke="#ef4445" 
                      strokeWidth={2.5} 
                      fillOpacity={1} 
                      fill="url(#growthGrad)" 
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>

              <div className="flex items-center justify-between text-[8px] font-black uppercase text-zinc-500 bg-zinc-950/40 px-3 py-2.5 rounded-xl border border-zinc-850/60 mt-1">
                <span className="flex items-center gap-1"><Sparkles size={11} className="text-yellow-500 animate-pulse" /> Network: Active</span>
                <span>Active count: {projects.filter(p => !p.archived).length}</span>
              </div>
            </div>

            {/* Right Chart: Task Milestone Completion Status */}
            <div className="flex flex-col justify-between">
              <div>
                <h4 className="text-[10px] font-black uppercase tracking-widest text-zinc-400 flex items-center gap-1.5 mb-1">
                  <Check size={12} className="text-zinc-500" /> Milestone Completion Matrices
                </h4>
                <p className="text-zinc-500 text-[11px] font-medium font-sans">Workspace completions (Scripts, Thumbnails, SEO, Videos) of active projects.</p>
              </div>

              <div className="h-44 my-3">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={taskCompletionData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                    <XAxis 
                      dataKey="name" 
                      stroke="#52525b" 
                      fontSize={8} 
                      tickLine={false} 
                      axisLine={false}
                    />
                    <YAxis 
                      stroke="#52525b" 
                      fontSize={8} 
                      tickLine={false} 
                      axisLine={false}
                      allowDecimals={false}
                    />
                    <Tooltip 
                      contentStyle={{ background: '#0e0e11', border: '1px solid #27272a', borderRadius: '12px', fontSize: '10px' }}
                      labelStyle={{ color: '#e4e4e7', fontWeight: 'bold' }}
                      itemStyle={{ color: '#3b82f6' }}
                    />
                    <Legend 
                      verticalAlign="top" 
                      height={20} 
                      iconSize={6} 
                      iconType="circle"
                      wrapperStyle={{ fontSize: '7px', textTransform: 'uppercase', color: '#71717a' }}
                    />
                    <Bar dataKey="Completed" stackId="a" fill="#22c55e" radius={[0, 0, 0, 0]} />
                    <Bar dataKey="Pending" stackId="a" fill="#18181b" radius={[3, 3, 0, 0]} stroke="#27272a" />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              <div className="flex items-center justify-between text-[8px] font-black uppercase text-zinc-500 bg-zinc-950/40 px-3 py-2.5 rounded-xl border border-zinc-850/60 mt-1">
                <span>Completed: {projects.filter(p => !p.archived).reduce((acc, p) => {
                  let cnt = 0;
                  if (p.assets?.script) cnt++;
                  if (p.assets?.thumbnail) cnt++;
                  if (p.assets?.seo || p.assets?.metadata_topic || p.assets?.metadata_result) cnt++;
                  if (p.assets?.videoUri) cnt++;
                  return acc + cnt;
                }, 0)} Tasks</span>
                <span className="text-emerald-400 font-bold tracking-widest">
                  Avg: {Math.round((projects.filter(p => !p.archived).reduce((acc, p) => {
                    let cnt = 0;
                    if (p.assets?.script) cnt++;
                    if (p.assets?.thumbnail) cnt++;
                    if (p.assets?.seo || p.assets?.metadata_topic || p.assets?.metadata_result) cnt++;
                    if (p.assets?.videoUri) cnt++;
                    return acc + cnt;
                  }, 0) / (projects.filter(p => !p.archived).length * 4 || 1)) * 100)}% Done
                </span>
              </div>
            </div>
          </div>
        )}
      </div>

      {showVisualizations && (
        <ProjectActivityChart projects={projects} logs={historyLogs} />
      )}

      {/* Workspace Collections (Folders) Panel */}
      <div className="bg-zinc-900/30 border border-zinc-855/80 p-6 rounded-[2rem] flex flex-col gap-4 shrink-0 transition-all hover:border-zinc-800">
         <div className="flex justify-between items-center">
            <div className="flex items-center gap-2">
               <Folder className="text-red-500 animate-pulse" size={16} />
               <h3 className="text-xs font-black uppercase tracking-[0.2em] text-white">COLLECTION DOMAINS (FOLDERS)</h3>
            </div>
            {!collabMode && (
              <button 
                 type="button"
                 onClick={() => {
                    setFolderEditingId(null);
                    setFolderNameInput('');
                    setFolderColorInput('#ef4444');
                    setShowFolderModal(true);
                 }}
                 className="text-[9px] font-black uppercase tracking-widest text-red-400 hover:text-white bg-red-950/20 border border-red-500/20 rounded-xl px-3 py-1.5 transition-all flex items-center gap-1 cursor-pointer"
              >
                 <FolderPlus size={11} /> Create Collection
              </button>
            )}
         </div>

         {/* Folder Selector Pills list */}
         <div className="flex flex-wrap gap-2 items-center">
            <button
               type="button"
               onClick={() => setSelectedFolderId(null)}
               className={`px-3.5 py-2 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all border flex items-center gap-1.5 ${!selectedFolderId ? 'bg-zinc-100 text-zinc-950 border-white font-extrabold' : 'bg-zinc-900 text-zinc-400 border-zinc-850 hover:text-white'}`}
            >
               <span>All Folder Groups</span>
               <span className="bg-zinc-950/80 px-1.5 py-0.5 rounded text-[8px] font-extrabold">{projects.length}</span>
            </button>

            {folders.map(folder => {
               const countInFolder = projects.filter(p => !p.archived && p.folderId === folder.id).length;
               return (
                  <div key={folder.id} className="relative group/folder flex items-center">
                     <button
                        type="button"
                        onClick={() => setSelectedFolderId(selectedFolderId === folder.id ? null : folder.id)}
                        className={`px-3.5 py-2 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all border flex items-center gap-2 ${selectedFolderId === folder.id ? 'bg-red-500/15 text-red-400 border-red-500/30 font-extrabold' : 'bg-zinc-900 text-zinc-400 border-zinc-850 hover:text-white'}`}
                     >
                        <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: folder.color || '#ef4444' }} />
                        <span>{folder.name}</span>
                        <span className="bg-zinc-950/80 px-1.5 py-0.5 rounded text-[8px] font-extrabold">{countInFolder}</span>
                     </button>
                     
                     {/* Edit/Delete tools on hover */}
                     {!collabMode && (
                       <div className="absolute -top-3 right-1 hidden group-hover/folder:flex items-center gap-1 bg-zinc-950 border border-zinc-850 rounded-lg p-1 shadow-xl transition-all z-10 animate-fade-in">
                          <button
                             type="button"
                             onClick={(e) => {
                                e.stopPropagation();
                                setFolderEditingId(folder.id);
                                setFolderNameInput(folder.name);
                                setFolderColorInput(folder.color || '#ef4444');
                                setShowFolderModal(true);
                             }}
                             className="text-[9px] font-bold text-zinc-400 hover:text-white px-1 hover:bg-zinc-800 rounded transition-colors"
                          >
                             Edit
                          </button>
                          <button
                             type="button"
                             onClick={(e) => {
                                e.stopPropagation();
                                if (confirm(`Remove collection "${folder.name}"? Workspace items inside will remain intact but unorganized.`)) {
                                   handleDeleteFolder(folder.id);
                                }
                             }}
                             className="text-[9px] font-bold text-red-500 hover:text-red-300 px-1 hover:bg-red-950/20 rounded transition-colors block"
                          >
                             Delete
                          </button>
                       </div>
                     )}
                  </div>
               );
            })}
         </div>
      </div>

      {/* Modern Search & Tag filtering/Sorting Hub */}
      <div className="flex flex-col gap-4 bg-zinc-950/60 p-5 rounded-[2rem] border border-zinc-850 shadow-inner shrink-0">
         {/* Row 1: Search and Prioritization Options */}
         <div className="flex flex-col lg:flex-row gap-4 items-stretch lg:items-center justify-between">
            <div className="flex-1 relative">
               <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-650" size={15} />
               <input 
                  type="text"
                  placeholder="Search workspaces by title, keywords or target niche..."
                  value={searchQuery}
                  onChange={e => {
                     setSearchQuery(e.target.value);
                     setSelectedIds([]);
                  }}
                  className="w-full bg-zinc-900/60 hover:bg-zinc-900/95 focus:bg-zinc-900 border border-zinc-850/75 focus:border-red-500/50 rounded-2xl py-3 pl-11 pr-5 text-xs text-white placeholder:text-zinc-650 outline-none transition-all font-semibold shadow-inner"
               />
               {searchQuery && (
                 <button 
                   type="button"
                   onClick={() => {
                      setSearchQuery('');
                      setSelectedIds([]);
                   }} 
                   className="absolute right-4 top-1/2 -translate-y-1/2 text-[10px] text-zinc-500 hover:text-white bg-zinc-950 px-2 py-1 rounded-md border border-zinc-850 font-black uppercase tracking-wider"
                 >
                   Clear
                 </button>
               )}
            </div>

            {/* Prioritizing Engine Selector */}
            <div className="flex items-center gap-1.5 bg-zinc-900/80 border border-zinc-850/80 p-1 rounded-[1.25rem] shrink-0 select-none self-start lg:self-auto">
              <span className="text-[9px] font-black uppercase text-zinc-550 tracking-wider pl-2.5 pr-1.5 font-mono">Prioritize:</span>
              {[
                { id: 'smart_sort', label: '🔥 Smart Urgency', tooltip: 'Auto ranks by deadlines, active modification phases, and user interaction metrics' },
                { id: 'lastUpdated', label: '🕒 Last Saved' },
                { id: 'default', label: '🎛️ Default Grid' }
              ].map(strat => (
                <button
                  key={strat.id}
                  type="button"
                  onClick={() => setSortStrategy(strat.id as any)}
                  className={`px-3.5 py-1.5 rounded-xl text-[9px] font-black uppercase transition-all tracking-wider border ${
                    sortStrategy === strat.id 
                      ? 'bg-red-500/10 text-red-400 border-red-500/20 shadow' 
                      : 'text-zinc-550 hover:text-zinc-300 border-transparent'
                  }`}
                  title={strat.tooltip}
                >
                  {strat.label}
                </button>
              ))}
            </div>
         </div>
         
         {/* Row 2: Tag Filters */}
         <div className="flex gap-2 items-center overflow-x-auto py-1 max-w-full no-scrollbar border-t border-zinc-900 pt-3">
            <span className="text-[9px] font-black uppercase text-zinc-550 tracking-widest whitespace-nowrap shrink-0 flex items-center gap-1">
               Filter Tags:
            </span>
            <button
               type="button"
               onClick={() => {
                  setSelectedTag(null);
                  setSelectedIds([]);
               }}
               className={`px-3.5 py-2 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all border whitespace-nowrap ${!selectedTag ? 'bg-red-950/30 text-red-400 border-red-500/30 shadow' : 'bg-zinc-900 text-zinc-500 border-zinc-850 hover:text-zinc-300'}`}
            >
               All ({projects.filter(p => activeTab === 'archived' ? p.archived : !p.archived).length})
            </button>
            {allTags.map(tag => {
               const countForTag = projects.filter(p => {
                  const isArchived = Boolean(p.archived);
                  const matchesTab = activeTab === 'archived' ? isArchived : !isArchived;
                  return matchesTab && p.assets?.tags && Array.isArray(p.assets.tags) && p.assets.tags.includes(tag);
               }).length;
               
               if (countForTag === 0) return null;

               return (
                  <button
                     key={tag}
                     type="button"
                     onClick={() => {
                        setSelectedTag(selectedTag === tag ? null : tag);
                        setSelectedIds([]);
                     }}
                     className={`px-3.5 py-2 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all border whitespace-nowrap flex items-center gap-1 ${selectedTag === tag ? 'bg-red-500/15 text-red-400 border-red-550/30 shadow' : 'bg-zinc-900 text-zinc-500 border-zinc-850 hover:text-zinc-300'}`}
                  >
                     <span>#{tag}</span>
                     <span className="bg-zinc-950/80 px-1.5 py-0.5 rounded text-[8px] border border-zinc-850/30 font-bold">{countForTag}</span>
                  </button>
               );
            })}
         </div>
      </div>

      {/* Kanban Board vs Project Timeline vs Dependency Graph vs Overview Dashboard */}
      {activeTab === 'overview' ? (
        <ProjectOverviewDashboard 
          projects={projects}
          activeProject={activeProject}
          setActiveProjectById={setActiveProjectById}
          updateActiveProject={updateActiveProject}
        />
      ) : activeTab === 'timeline' ? (
        <ProjectTimelineView 
          projects={projects} 
          updateStatus={updateStatus} 
          historyLogs={historyLogs}
          addHistoryLog={addHistoryLog}
        />
      ) : activeTab === 'dependency_graph' ? (
        <ProjectDependencyGraph 
          projects={projects.filter(p => !p.archived)} 
          updateProject={updateProject} 
          folders={folders} 
          onEditProject={setEditingProject}
        />
      ) : (
        <div className="flex-1 overflow-x-auto overflow-y-hidden custom-scrollbar">
           {filteredProjects.length > 0 && (
             <div className="flex justify-between items-center px-4 mb-4 gap-4 shrink-0">
                <div className="flex items-center gap-2 text-xs font-bold text-zinc-500">
                   <span className="font-semibold text-zinc-400">Bulk Actions Dashboard</span>
                   <div className="h-4 w-[1px] bg-zinc-850" />
                   <button 
                     type="button"
                     onClick={() => {
                        const allVisibleIds = filteredProjects.map(p => p.id);
                        const allSelected = allVisibleIds.every(id => selectedIds.includes(id));
                        if (allSelected) {
                           setSelectedIds(prev => prev.filter(id => !allVisibleIds.includes(id)));
                        } else {
                           setSelectedIds(prev => Array.from(new Set([...prev, ...allVisibleIds])));
                        }
                     }} 
                     className="bg-zinc-900/80 hover:bg-zinc-800 text-[10px] text-zinc-300 px-3 py-1.5 rounded-xl border border-zinc-850 transition-all font-black uppercase tracking-wider hover:text-white"
                   >
                     {filteredProjects.every(p => selectedIds.includes(p.id)) ? "Deselect All Visible" : "Select All Visible"}
                   </button>
                   {selectedIds.length > 0 && (
                     <button
                       type="button"
                       onClick={() => setSelectedIds([])}
                       className="text-[10px] text-zinc-500 hover:text-white font-black uppercase tracking-wider ml-1"
                     >
                       Clear Selection
                     </button>
                   )}
                </div>
                <div className="text-[10px] text-zinc-550 font-mono font-bold uppercase tracking-wider">
                  Visible: {filteredProjects.length} / Global: {projects.length}
                </div>
             </div>
           )}
           <div className="flex gap-6 h-full min-w-[1250px] pb-6">
            {columns.map(col => {
               const colProjects = filteredProjects.filter(p => p.status === col.id);
               return (
                  <div key={col.id} className="flex-1 flex flex-col min-w-[340px]">
                     <div className="flex items-center justify-between mb-4 px-4 shrink-0">
                        <div className="flex items-center gap-2.5">
                           <div className={`w-2.5 h-2.5 rounded-full ${col.color} shadow`}></div>
                           <h3 className="font-extrabold text-white text-[11px] uppercase tracking-[0.15em]">{col.label}</h3>
                           <span className="text-[10px] text-zinc-500 font-extrabold px-2.5 py-0.5 bg-zinc-900 border border-zinc-850 rounded-full">{colProjects.length}</span>
                        </div>
                     </div>
                     
                     <div className="flex-1 bg-zinc-900/10 border border-zinc-850/40 rounded-[2rem] p-4 space-y-4 overflow-y-auto custom-scrollbar shadow-inner min-h-[300px]">
                         {colProjects.map(project => {
                           const isArchived = Boolean(project.archived);
                           return (
                              <div key={project.id} className="bg-zinc-900/90 border border-zinc-850 hover:border-zinc-700/85 p-6 rounded-3xl shadow-lg transition-all group animate-scale-in relative hover-lift">
                                 <div className="flex justify-between items-start mb-4 gap-2">
                                    <div className="flex items-center gap-2">
                                       <input 
                                          type="checkbox"
                                          checked={selectedIds.includes(project.id)}
                                          onChange={() => {
                                             setSelectedIds(prev => 
                                               prev.includes(project.id) 
                                                 ? prev.filter(id => id !== project.id) 
                                                 : [...prev, project.id]
                                             );
                                          }}
                                          className="w-3.5 h-3.5 rounded border-zinc-750 bg-zinc-950 text-red-650 accent-red-600 focus:ring-1 focus:ring-red-500/50 cursor-pointer"
                                          title="Select project for bulk actions"
                                       />
                                       <span className="text-[8px] uppercase font-black text-zinc-500 tracking-[0.2em] bg-zinc-950 px-2.5 py-1 rounded-lg border border-zinc-850 transition-colors group-hover:text-zinc-300">{project.niche}</span>
                                    </div>
                                    
                                    {/* Contextual actions */}
                                    <div className="flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-all duration-200">
                                       <button 
                                         type="button"
                                         onClick={() => setEditingProject(project)} 
                                         className="p-1.5 hover:bg-zinc-850 rounded-lg text-zinc-500 hover:text-white transition-colors" 
                                         title="Modify Manifest Settings"
                                       >
                                          <Edit size={13} />
                                       </button>
                                       <button 
                                         type="button"
                                         onClick={() => setSelectedAuditProject(project)} 
                                         className="p-1.5 hover:bg-zinc-850 rounded-lg text-zinc-400 hover:text-white transition-all cursor-pointer" 
                                         title="View Project Audit Log"
                                       >
                                          <History size={13} />
                                       </button>

                                       <button 
                                         type="button"
                                         onClick={() => setShareProject(project)} 
                                         className="p-1.5 hover:bg-zinc-850 rounded-lg text-zinc-500 hover:text-white transition-colors" 
                                         title="Share Workspace Link"
                                       >
                                          <Share2 size={13} />
                                       </button>

                                        <button 
                                          type="button"
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            handleSinglePdfExport(project);
                                          }} 
                                          className="p-1.5 hover:bg-zinc-850 rounded-lg text-zinc-500 hover:text-red-500 transition-colors" 
                                          title="Download PDF Executive Summary"
                                        >
                                           <Download size={13} />
                                        </button>
                                       
                                       <button 
                                         type="button"
                                         onClick={() => handleArchiveToggle(project.id, project.title, isArchived)} 
                                         className={`p-1.5 hover:bg-zinc-850 rounded-lg text-zinc-500 transition-colors ${isArchived ? 'hover:text-green-400' : 'hover:text-amber-500'}`}
                                         title={isArchived ? "Unarchive & Restore" : "Archive Workspace"}
                                       >
                                          {isArchived ? <RotateCcw size={13} /> : <Archive size={13} />}
                                       </button>
 
                                       <button 
                                         type="button"
                                         onClick={() => handleDelete(project.id, project.title)} 
                                         className="p-1.5 hover:bg-zinc-850 rounded-lg text-zinc-500 hover:text-red-500 transition-colors" 
                                         title="Delete Permanently"
                                       >
                                          <Trash2 size={13} />
                                       </button>
                                    </div>
                                 </div>
                                 
                                 <h4 
                                   onClick={() => setEditingProject(project)}
                                   className="font-extrabold text-white mb-4 leading-snug text-[15px] tracking-tight group-hover:text-red-550 transition-colors cursor-pointer"
                                   title="Click to click-to-edit settings"
                                 >
                                   {project.title}
                                 </h4>
                                 
                                 {/* Assets check-indicators */}
                                 <div className="flex gap-2 mb-5">
                                    {[
                                      { has: project.assets?.script, icon: FileText, label: 'Script Draft', color: 'text-blue-400', bg: 'bg-blue-400/10' },
                                      { has: project.assets?.thumbnail, icon: ImageIcon, label: 'Thumbnail Art', color: 'text-orange-400', bg: 'bg-orange-400/10' },
                                      { has: project.assets?.seo, icon: Search, label: 'SEO Metadata', color: 'text-green-400', bg: 'bg-green-400/10' },
                                      { has: project.assets?.videoUri, icon: Video, label: 'Synthesized MP4 Video', color: 'text-purple-400', bg: 'bg-purple-400/10' }
                                    ].map((asset, i) => (
                                      <div 
                                        key={i} 
                                        className={`p-2 rounded-xl transition-all duration-300 ${asset.has ? `${asset.bg} ${asset.color} border border-current/10 scale-100` : 'bg-zinc-950 text-zinc-800 grayscale scale-95 opacity-50'}`} 
                                        title={asset.label}
                                      >
                                         <asset.icon size={13} />
                                      </div>
                                    ))}
                                 </div>

                                 {/* Small inline tags display */}
                                 {project.assets?.tags && Array.isArray(project.assets.tags) && project.assets.tags.length > 0 && (
                                   <div className="flex flex-wrap gap-1.5 mb-4 select-none">
                                     {project.assets.tags.map(tag => (
                                       <span key={tag} className="text-[8px] font-black uppercase tracking-wider px-2 py-0.5 rounded-lg bg-red-955/20 text-red-400 border border-red-500/10 mb-1">
                                          #{tag}
                                       </span>
                                     ))}
                                   </div>
                                 )}

                                 <div className="flex justify-between items-center border-t border-zinc-850 pt-4 mt-2">
                                    <div className="flex -space-x-1.5">
                                       {project.team && project.team.length > 0 ? project.team.map((avatar, i) => (
                                          <img key={i} src={avatar} className="w-7 h-7 rounded-lg border border-zinc-900 shadow transform hover:scale-110 hover:z-10 transition-all cursor-pointer" alt="Collaborator" />
                                       )) : (
                                          <div className="w-7 h-7 rounded-lg bg-zinc-950 border border-zinc-850 flex items-center justify-center text-[8px] font-black text-zinc-600">SOLO</div>
                                       )}
                                       <button type="button" onClick={() => setShareProject(project)} className="w-7 h-7 rounded-lg bg-zinc-900 hover:bg-zinc-800 flex items-center justify-center border border-zinc-850 text-zinc-500 hover:text-white text-[11px] font-black transition-all">+</button>
                                    </div>
                                    
                                    <div className="flex items-center gap-1.5">
                                       <button 
                                          type="button"
                                          onClick={() => setShareProject(project)}
                                          className="text-[9px] font-black uppercase tracking-widest bg-zinc-950 hover:bg-zinc-850 text-zinc-500 hover:text-white px-3 py-2 rounded-xl border border-zinc-850 transition-all flex items-center gap-1"
                                          title="Generate public read-only link"
                                       >
                                          <Share2 size={10} /> Share
                                       </button>

                                       {!isArchived && project.status !== 'published' && (
                                          <button 
                                             type="button"
                                             onClick={() => {
                                                const statuses: Project['status'][] = ['idea', 'scripting', 'production', 'scheduled', 'published'];
                                                const currIdx = statuses.indexOf(project.status);
                                                if (currIdx < statuses.length - 1) updateStatus(project.id, statuses[currIdx + 1]);
                                             }}
                                             className="text-[9px] font-black uppercase tracking-widest bg-zinc-950 hover:bg-zinc-850 text-zinc-500 hover:text-zinc-200 px-3.5 py-2 rounded-xl border border-zinc-850 transition-all flex items-center gap-1.5"
                                          >
                                             Sequence <ChevronRight size={10} />
                                          </button>
                                       )}
                                    </div>
                                 </div>
                              </div>
                           );
                        })}

                        {colProjects.length === 0 && (
                           <div className="py-20 flex flex-col items-center justify-center border-2 border-dashed border-zinc-850 rounded-[2rem] text-zinc-600">
                              <Plus size={20} className="mb-2 opacity-25" />
                              <span className="text-[10px] font-bold uppercase tracking-wider opacity-40">Ready for Launch</span>
                           </div>
                        )}
                     </div>
                  </div>
               );
            })}
         </div>
      </div>
      )}

      {/* Floating Bulk Action Toolbar */}
      {selectedIds.length > 0 && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 bg-zinc-950/95 border border-zinc-800 rounded-2xl px-6 py-4 flex items-center gap-6 shadow-2xl backdrop-blur-md animate-scale-in max-w-lg w-[calc(100%-2rem)] justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-red-500/10 text-red-500 text-xs font-black px-2.5 py-1 rounded-lg border border-red-500/10 min-w-8 text-center font-mono">
              {selectedIds.length}
            </div>
            <div>
              <p className="text-white text-xs font-black uppercase tracking-wide">Bulk Actions Active</p>
              <p className="text-[10px] text-zinc-500 font-semibold leading-none mt-1">Perform coordinated operations across selected workspace manifests.</p>
            </div>
          </div>
          
          <div className="flex items-center gap-2 shrink-0">
            {/* Generate read-only collaboration link */}
            <button
               type="button"
               onClick={handleBulkShare}
               className="bg-zinc-900 hover:bg-zinc-800 hover:text-indigo-400 text-zinc-300 p-2.5 rounded-xl border border-zinc-800 transition-all flex items-center gap-1 text-[10px] font-black uppercase tracking-wider relative group"
               title="Generate and copy temporary collaboration link"
            >
               <Share2 size={13} />
            </button>

            {/* Folder collection mover */}
            <select
               onChange={(e) => {
                  const val = e.target.value;
                  if (val) {
                     handleBulkMoveToFolder(val === 'unorganized' ? '' : val);
                     e.target.value = '';
                  }
               }}
               className="bg-zinc-900 hover:bg-zinc-850 text-zinc-300 text-[10px] font-black uppercase tracking-wider px-2 py-2.5 rounded-xl border border-zinc-800 cursor-pointer outline-none max-w-[105px]"
               defaultValue=""
            >
               <option value="" disabled>Move to...</option>
               <option value="unorganized">No Folder</option>
               {folders.map(f => (
                  <option key={f.id} value={f.id}>{f.name}</option>
               ))}
            </select>
            <button
              type="button"
              onClick={handleBulkExport}
              className="bg-zinc-900 hover:bg-zinc-850 text-zinc-300 p-2.5 rounded-xl border border-zinc-800 transition-all flex items-center gap-1 text-[10px] font-black uppercase tracking-wider relative group"
              title="Export selected as offline JSON backup"
            >
              <Download size={13} />
            </button>
            <button
              type="button"
              onClick={handleZipBulkExport}
              className="bg-zinc-900 hover:bg-zinc-850 text-red-400 p-2.5 rounded-xl border border-zinc-800 transition-all flex items-center gap-2 text-[10px] font-black uppercase tracking-wider relative group"
              title="Download unified metadata, scripts & thumbnails as ZIP"
            >
              <Folder size={13} className="text-red-500 animate-pulse" />
              <span className="text-zinc-300">ZIP Bundle</span>
            </button>
            <button
              type="button"
              onClick={handleExportScriptsZip}
              className="bg-zinc-900 hover:bg-zinc-850 text-blue-400 p-2.5 rounded-xl border border-zinc-800 transition-all flex items-center gap-2 text-[10px] font-black uppercase tracking-wider relative group"
              title="Download completed scripts as ZIP"
            >
              <FileText size={13} className="text-blue-550 animate-pulse" />
              <span className="text-zinc-300">ZIP Scripts</span>
            </button>
            <button
              type="button"
              onClick={handleExportThumbnailsZip}
              className="bg-zinc-900 hover:bg-zinc-850 text-amber-400 p-2.5 rounded-xl border border-zinc-800 transition-all flex items-center gap-2 text-[10px] font-black uppercase tracking-wider relative group"
              title="Download thumbnail configurations as ZIP"
            >
              <ImageIcon size={13} className="text-amber-500 animate-pulse" />
              <span className="text-zinc-300">ZIP Thumbnails</span>
            </button>
            <button
              type="button"
              onClick={handlePdfZipBulkExport}
              className="bg-zinc-900 hover:bg-zinc-850 text-indigo-400 p-2.5 rounded-xl border border-zinc-800 transition-all flex items-center gap-2 text-[10px] font-black uppercase tracking-wider relative group"
              title="Download selected project summaries as ZIP of PDF files"
            >
              <FileText size={13} className="text-indigo-400 animate-pulse" />
              <span className="text-zinc-300">PDF ZIP</span>
            </button>

            <button
              type="button"
              onClick={handleBulkArchive}
              className="bg-zinc-900 hover:bg-zinc-850 text-amber-500 p-2.5 rounded-xl border border-zinc-800 transition-all flex items-center gap-1 text-[10px] font-black uppercase tracking-wider relative group"
              title={activeTab === 'archived' ? "Restore / Unarchive" : "Archive Workspace"}
            >
              {activeTab === 'archived' ? <RotateCcw size={13} /> : <Archive size={13} />}
            </button>

            <button
              type="button"
              onClick={handleBulkDelete}
              className="bg-red-950/40 hover:bg-red-950 text-red-400 p-2.5 rounded-xl border border-red-900/30 transition-all flex items-center gap-1 text-[10px] font-black uppercase tracking-wider relative group mr-1"
              title="Delete selected permanently"
            >
              <Trash2 size={13} />
            </button>

            <select
              onChange={async (e) => {
                const newStatus = e.target.value as any;
                if (!newStatus) return;
                
                // Batch update selected projects
                for (const id of selectedIds) {
                   updateStatus(id, newStatus);
                }
                
                // Add log
                const count = selectedIds.length;
                addHistoryLog(
                   `Changed status to "${newStatus.toUpperCase()}" for ${count} workspaces`,
                   'bulk',
                   { count, status: newStatus }
                );
                
                // Reset select and selection
                e.target.value = '';
                setSelectedIds([]);
              }}
              className="bg-zinc-900 hover:bg-zinc-850 text-zinc-300 text-[10px] font-black uppercase tracking-wider px-3 py-2.5 rounded-xl border border-zinc-800 cursor-pointer transition-all outline-none"
              title="Batch change status for selected projects"
              defaultValue=""
            >
              <option value="" disabled>Status...</option>
              <option value="idea">IDEA</option>
              <option value="scripting">SCRIPTING</option>
              <option value="production">PRODUCTION</option>
              <option value="scheduled">SCHEDULED</option>
              <option value="published">PUBLISHED</option>
            </select>

            <div className="w-[1px] h-6 bg-zinc-800 mx-1" />

            <button
              type="button"
              onClick={() => setSelectedIds([])}
              className="text-zinc-500 hover:text-white transition-colors text-[10px] font-black uppercase tracking-wider px-2 py-1"
            >
              Clear
            </button>
          </div>
        </div>
      )}

      {/* Editing Project Modal with integrated Auto-Save / Export */}
      {editingProject && (
        <ProjectEditorModal 
          project={editingProject} 
          onClose={() => setEditingProject(null)} 
          addHistoryLog={addHistoryLog}
        />
      )}

      {/* Project Audit Log Modal */}
      {selectedAuditProject && (
        <ProjectAuditLogModal 
          project={selectedAuditProject} 
          onClose={() => setSelectedAuditProject(null)} 
          historyLogs={historyLogs}
        />
      )}

       {/* Bulk JSON Ingestion Arena Modal */}
       {bulkImportList && (
         <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/95 backdrop-blur-md p-4 animate-fade-in font-sans">
           <div className="bg-zinc-900 border border-zinc-800 rounded-[2.5rem] p-10 w-full max-w-xl shadow-2xl relative flex flex-col max-h-[85vh]">
             <div className="absolute top-0 right-0 w-32 h-32 bg-purple-650/5 rounded-full blur-2xl pointer-events-none" />
             
             <div className="flex justify-between items-start mb-6 shrink-0">
               <div>
                 <span className="text-[9px] font-black tracking-widest text-purple-400 uppercase flex items-center gap-1.5 mb-1 font-mono">
                    <Upload size={10} className="animate-bounce" /> RAW DATA INGEST SANDBOX
                 </span>
                 <h3 className="text-2xl font-black text-white tracking-tight">Deploy Ingest Matrix</h3>
                 {bulkImportFileName && (
                    <p className="text-[10px] text-zinc-550 font-mono mt-1 font-bold">Source File: {bulkImportFileName}</p>
                 )}
               </div>
               <button 
                 type="button" 
                 onClick={() => {
                    setBulkImportList(null);
                    setBulkImportFileName('');
                 }} 
                 className="p-1 hover:bg-zinc-850 rounded-lg text-zinc-550 hover:text-white transition-colors cursor-pointer"
               >
                 <XIcon size={18} />
               </button>
             </div>

             <p className="text-[11px] text-zinc-400 mb-4 shrink-0 leading-relaxed font-semibold">
                Verify the workspace pipeline entries drafted in your imported matrix files before deploying them.
             </p>

             <div className="flex-1 overflow-y-auto pr-1 space-y-2.5 my-4 no-scrollbar border-y border-zinc-850/50 py-4">
                {bulkImportList.map((item, idx) => (
                   <div key={idx} className="bg-zinc-950/60 p-4 rounded-2xl border border-zinc-855/80 flex items-center justify-between gap-3 hover:border-zinc-800 transition-all">
                      <div className="min-w-0 flex-1">
                         <div className="flex items-center gap-2">
                            <span className="text-[8px] font-black text-zinc-650 font-mono w-5">#{idx + 1}</span>
                            <span className="text-white text-xs font-bold truncate">{item.title || item.name || 'Untitled Project'}</span>
                         </div>
                         <div className="flex gap-2 items-center mt-1.5 pl-7">
                            <span className="text-[8px] uppercase font-mono px-1.5 py-0.5 rounded bg-zinc-905 border border-zinc-850 text-zinc-400 font-bold">{item.niche || 'General'}</span>
                            {item.audience && (
                               <span className="text-[8px] font-mono text-zinc-600 truncate max-w-[150px] font-medium">To: {item.audience}</span>
                            )}
                         </div>
                      </div>
                      <span className="text-[8px] font-black uppercase text-purple-400 tracking-wider bg-purple-500/10 border border-purple-500/15 rounded-lg px-2.5 py-1 shrink-0 font-mono">
                         {item.status || 'idea'}
                      </span>
                   </div>
                ))}
             </div>

             <div className="flex justify-between items-center bg-zinc-950/30 p-4 rounded-2xl border border-zinc-850/80 shrink-0 mt-2">
                <span className="text-[10px] text-zinc-550 font-black uppercase tracking-wider font-mono">Count Compiled:</span>
                <span className="text-white text-xs font-black font-mono">{bulkImportList.length} workspace item(s)</span>
             </div>

             <div className="flex justify-end gap-2 shrink-0 pt-4 font-sans">
                <button
                   type="button"
                   onClick={() => {
                      setBulkImportList(null);
                      setBulkImportFileName('');
                   }}
                   className="bg-zinc-950 text-zinc-500 hover:text-white font-black px-4 py-3 rounded-xl text-xs uppercase tracking-wider transition-colors cursor-pointer"
                >
                   Abort
                </button>
                <button
                   type="button"
                   onClick={handleCommitBulkImport}
                   className="bg-purple-600 hover:bg-purple-500 text-white font-black px-5 py-3 rounded-xl text-xs uppercase tracking-wider transition-colors cursor-pointer"
                >
                   Ingest & Deploy
                </button>
             </div>
           </div>
         </div>
       )}

       {/* Generated Share Link Modal Overlay */}
       {generatedShareLink && (
         <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/95 backdrop-blur-md p-4 animate-fade-in font-sans">
           <div className="bg-zinc-900 border border-zinc-800 rounded-[2.5rem] p-10 w-full max-w-lg shadow-2xl relative">
             <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-650/5 rounded-full blur-2xl pointer-events-none" />
             
             <div className="flex justify-between items-start mb-6">
               <div>
                 <span className="text-[9px] font-black tracking-widest text-indigo-400 uppercase flex items-center gap-1 mb-1 font-mono">
                    Collaboration Link Established
                 </span>
                 <h3 className="text-2xl font-black text-white tracking-tight">Temporary Share Gateway</h3>
               </div>
               <button 
                 type="button" 
                 onClick={() => setGeneratedShareLink(null)} 
                 className="p-1 hover:bg-zinc-850 rounded-lg text-zinc-550 hover:text-white transition-colors cursor-pointer"
               >
                 <XIcon size={18} />
               </button>
             </div>

             <div className="space-y-6">
                <div>
                   <label className="text-[10px] font-black text-zinc-500 uppercase block mb-1.5 tracking-[0.2em] font-mono">Read-Only Share Link URL</label>
                   <div className="flex gap-2">
                      <input 
                         type="text"
                         readOnly
                         value={generatedShareLink}
                         className="flex-1 bg-zinc-950 border border-zinc-805 rounded-xl p-3 text-white text-xs font-mono outline-none selection:bg-indigo-500/30"
                      />
                      <button
                         type="button"
                         onClick={() => {
                            navigator.clipboard.writeText(generatedShareLink);
                            setCopiedShareLink(true);
                            setTimeout(() => setCopiedShareLink(false), 2000);
                            toast.success('Share URL copied!');
                         }}
                         className="bg-indigo-600 hover:bg-indigo-500 text-white font-black px-4 rounded-xl text-xs uppercase tracking-wider flex items-center gap-1 cursor-pointer"
                      >
                         {copiedShareLink ? <Check size={14} /> : <CopyIcon size={14} />}
                         <span>{copiedShareLink ? 'Copied' : 'Copy'}</span>
                      </button>
                   </div>
                </div>

                <div className="bg-zinc-955/65 p-4 rounded-2xl border border-zinc-850 flex items-start gap-3">
                   <span className="w-2 h-2 rounded-full bg-indigo-400 mt-1 shrink-0 animate-ping" />
                   <div>
                      <h4 className="text-[10px] font-extrabold text-white uppercase tracking-wider font-mono">Access Parameters Secured</h4>
                      <p className="text-[10px] text-zinc-400 mt-1 leading-relaxed">This connection is compiled in read-only collaboration mode. Peers accessing this link will view identical pipeline boards without any editing permissions.</p>
                   </div>
                </div>

                <div className="flex justify-between items-center bg-zinc-955/35 p-3 rounded-2xl border border-zinc-850 font-mono text-[9px]">
                   <span className="text-zinc-500 font-black uppercase">Expires:</span>
                   <span className="text-amber-400 font-bold">24 Hours / Temporary Session</span>
                </div>

                <div className="flex justify-end gap-2 pt-2">
                   <button
                      type="button"
                      onClick={() => setGeneratedShareLink(null)}
                      className="bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-white font-black px-5 py-3 rounded-xl text-xs uppercase tracking-wider transition-colors cursor-pointer"
                   >
                      Dismiss Portal
                   </button>
                </div>
             </div>
           </div>
         </div>
       )}

       {/* Folder Creation/Editing Modal Overlay */}
       {showFolderModal && (
         <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/95 backdrop-blur-md p-4 animate-fade-in font-sans">
           <div className="bg-zinc-900 border border-zinc-800 rounded-[2.5rem] p-10 w-full max-w-md shadow-2xl relative">
             <div className="absolute top-0 right-0 w-32 h-32 bg-red-650/5 rounded-full blur-2xl pointer-events-none" />
             
             <div className="flex justify-between items-start mb-6">
               <div>
                 <span className="text-[9px] font-black tracking-widest text-zinc-500 uppercase flex items-center gap-1 mb-1 font-mono">
                    Workspace organization controls
                 </span>
                 <h3 className="text-2xl font-black text-white tracking-tight">
                    {folderEditingId ? 'Edit Collection Domain' : 'Create Collection Domain'}
                 </h3>
               </div>
               <button 
                 type="button" 
                 onClick={() => setShowFolderModal(false)} 
                 className="p-1 hover:bg-zinc-850 rounded-lg text-zinc-500 hover:text-white transition-colors cursor-pointer"
               >
                 <XIcon size={18} />
               </button>
             </div>

             <div className="space-y-6">
                <div>
                   <label className="text-[10px] font-black text-zinc-500 uppercase block mb-1.5 tracking-[0.2em] font-mono">Collection Group Name</label>
                   <input 
                      type="text"
                      placeholder="e.g. Q3 Brand Campaigns"
                      value={folderNameInput}
                      onChange={e => setFolderNameInput(e.target.value)}
                      className="w-full bg-zinc-950 border border-zinc-800 rounded-2xl p-4 text-white text-xs focus:border-red-500 focus:ring-1 focus:ring-red-500/50 outline-none transition-all placeholder:text-zinc-700 font-mono"
                      required
                   />
                </div>

                <div>
                   <label className="text-[10px] font-black text-zinc-550 uppercase block mb-2 tracking-[0.2em] font-mono">Visual Theme Tint</label>
                   <div className="flex gap-3">
                      {['#ef4444', '#f59e0b', '#10b981', '#3b82f6', '#ec4899', '#8b5cf6'].map(col => (
                         <button
                            key={col}
                            type="button"
                            onClick={() => setFolderColorInput(col)}
                            className={`w-8 h-8 rounded-full border-2 transition-transform cursor-pointer ${folderColorInput === col ? 'scale-110 border-white ring-4 ring-white/10' : 'border-zinc-900 hover:scale-105'}`}
                            style={{ backgroundColor: col }}
                         />
                      ))}
                   </div>
                </div>

                <div className="flex justify-end gap-2 pt-2">
                   <button
                      type="button"
                      onClick={() => setShowFolderModal(false)}
                      className="bg-zinc-950 text-zinc-500 hover:text-white font-black px-4 py-3 rounded-xl text-xs uppercase tracking-wider transition-colors cursor-pointer"
                   >
                      Cancel
                   </button>
                   <button
                      type="button"
                      onClick={() => {
                         if (!folderNameInput.trim()) {
                            toast.error('Collection group title is required.');
                            return;
                         }
                         if (folderEditingId) {
                            handleUpdateFolder(folderEditingId, folderNameInput, folderColorInput);
                         } else {
                            handleCreateFolder(folderNameInput, folderColorInput);
                         }
                         setShowFolderModal(false);
                      }}
                      className="bg-red-650 hover:bg-red-550 text-white font-black px-5 py-3 rounded-xl text-xs uppercase tracking-wider transition-colors cursor-pointer"
                   >
                      {folderEditingId ? 'Update Group' : 'Establish Group'}
                   </button>
                </div>
             </div>
           </div>
         </div>
       )}

      {/* Workflow Audit Ledger Sidebar */}
      {showHistory && (
         <div className="fixed inset-0 z-50 flex justify-end bg-black/80 backdrop-blur-sm animate-fade-in">
           {/* Backdrop click to close */}
           <div className="absolute inset-0" onClick={() => setShowHistory(false)} />
           
           <div className="relative w-full max-w-md h-full bg-zinc-950 border-l border-zinc-850 shadow-2xl flex flex-col z-50 animate-slide-in p-6 md:p-8 bg-zinc-950/95 backdrop-blur-md">
             <div className="flex justify-between items-start mb-6">
                <div>
                   <h3 className="text-sm font-black uppercase tracking-[0.18em] text-white flex items-center gap-2">
                     <History size={16} className="text-red-500 animate-pulse" /> WORKFLOW AUDIT LEDGER
                   </h3>
                   <p className="text-[9px] text-zinc-550 mt-1.5 font-bold uppercase tracking-wider">Historical trace of bulk actions, imports, and auto-saves</p>
                </div>
                <button 
                  onClick={() => setShowHistory(false)} 
                  className="p-1.5 bg-zinc-900 border border-zinc-850 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-850 transition-all cursor-pointer"
                  title="Close sidebar"
                >
                  <XIcon size={14} />
                </button>
             </div>

             {/* Sidebar Action Bar */}
             <div className="flex gap-2 mb-6 justify-between items-center bg-zinc-900/30 p-3 rounded-2xl border border-zinc-850">
               <span className="text-[9px] font-black uppercase text-zinc-500 tracking-wider font-mono">
                  Total events recorded: {historyLogs.length}
               </span>
               {historyLogs.length > 0 && (
                 <button
                   type="button"
                   onClick={() => {
                     setHistoryLogs([]);
                     localStorage.removeItem('project_history_logs');
                     toast.success("Audit trail cleared successfully");
                   }}
                   className="text-[9px] text-red-400 hover:text-red-300 font-extrabold uppercase tracking-widest px-2.5 py-1 bg-red-950/20 border border-red-500/10 rounded-lg hover:bg-red-950/30 transition-all cursor-pointer"
                 >
                   Clear Logs
                 </button>
               )}
             </div>

             {/* Events Timeline Stream */}
             <div className="flex-1 overflow-y-auto pr-1 space-y-4 custom-scrollbar">
                {historyLogs.length === 0 ? (
                   <div className="h-full flex flex-col items-center justify-center text-center py-20 text-zinc-650">
                      <Clock size={24} className="mb-3 opacity-20 text-zinc-500" />
                      <p className="text-[10px] font-black uppercase tracking-wider text-zinc-500">No Events Discovered</p>
                      <p className="text-[10px] text-zinc-500 mt-1 font-sans font-semibold">Initialize manifests, trigger bulk operations, or perform backups to generate log entries.</p>
                   </div>
                ) : (
                  <div className="relative border-l border-zinc-850 ml-2.5 pl-5 space-y-6">
                    {historyLogs.map((log) => {
                       // Custom icon & color pairing depending on action type
                       let colorClass = 'bg-blue-500 ring-blue-500/10';
                       let iconElement = <Clock size={10} className="text-white animate-spin-slow" />;
                       
                       if (log.action === 'auto_save') {
                          colorClass = 'bg-emerald-500 ring-emerald-500/15';
                          iconElement = <Sparkles size={10} className="text-white" />;
                       } else if (log.action.includes('bulk_')) {
                          colorClass = 'bg-amber-500 ring-amber-500/15';
                          iconElement = <Inbox size={10} className="text-white" />;
                       } else if (log.action === 'import') {
                          colorClass = 'bg-purple-500 ring-purple-500/15';
                          iconElement = <Upload size={10} className="text-white" />;
                       } else if (log.action === 'export') {
                          colorClass = 'bg-blue-500 ring-blue-500/15';
                          iconElement = <Download size={10} className="text-white" />;
                       }

                       return (
                          <div key={log.id} className="relative group transition-all">
                             {/* Indicator dot */}
                             <div className={`absolute -left-[27px] top-1 w-3.5 h-3.5 rounded-full border border-zinc-950 ring-4 flex items-center justify-center ${colorClass}`}>
                                {iconElement}
                             </div>
                             
                             <div className="bg-zinc-900/30 hover:bg-zinc-900/60 p-4 rounded-2xl border border-zinc-850/50 transition-all hover:border-zinc-800">
                                <div className="flex justify-between items-start">
                                   <span className="text-[8px] font-black uppercase tracking-wider text-zinc-400 bg-zinc-950 px-2 py-0.5 rounded border border-zinc-850 font-mono">
                                      {log.type}
                                   </span>
                                   <span className="text-[8px] font-mono font-bold text-zinc-600">
                                      {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                                   </span>
                                </div>
                                <p className="text-xs text-zinc-300 font-semibold mt-2.5 leading-relaxed">
                                   {log.action}
                                </p>
                                {log.metadata && (
                                   <div className="mt-2 text-[9px] font-mono text-zinc-500 bg-zinc-950/50 p-2 rounded-xl border border-zinc-850/10 max-h-24 overflow-y-auto no-scrollbar">
                                      {Object.entries(log.metadata).map(([k, v]) => (
                                         <div key={k} className="flex justify-between">
                                            <span className="text-zinc-600 font-bold uppercase">{k}:</span>
                                            <span className="text-zinc-400 font-semibold text-right max-w-[120px] truncate">{String(v)}</span>
                                         </div>
                                      ))}
                                   </div>
                                )}
                             </div>
                          </div>
                       );
                    })}
                  </div>
                )}
             </div>
           </div>
         </div>
      )}
    </div>
  );
};

const getExpiryTimestamp = (option: string): number => {
  const now = Date.now();
  switch (option) {
    case '24h':
      return now + 24 * 60 * 60 * 1000;
    case '7d':
      return now + 7 * 24 * 60 * 60 * 1000;
    case '30d':
      return now + 30 * 24 * 60 * 60 * 1000;
    case 'never':
    default:
      return now + 365 * 24 * 60 * 60 * 1000; // 1 year fallback
  }
};

const ProjectEditorModal: React.FC<{ 
  project: Project; 
  onClose: () => void; 
  addHistoryLog: (log: any) => void;
}> = ({ project, onClose, addHistoryLog }) => {
  const { updateProject } = useProject();
  const [title, setTitle] = useState(project.title);
  const [niche, setNiche] = useState(project.niche);
  const [audience, setAudience] = useState(project.audience || '');
  const [description, setDescription] = useState(project.description || '');
  const [folderId, setFolderId] = useState(project.folderId || '');
  const [saveStatus, setSaveStatus] = useState<'saved' | 'saving' | 'dirty'>('saved');

  const [editorShareExpires, setEditorShareExpires] = useState<string>('7d');
  const [copiedShare, setCopiedShare] = useState(false);

  const handleShareCurrentProject = () => {
    const origin = window.location.origin;
    const expiresMs = getExpiryTimestamp(editorShareExpires);
    const shareUrl = `${origin}?shared_ids=${project.id}&collab=true&expires=${expiresMs}`;
    navigator.clipboard.writeText(shareUrl);
    setCopiedShare(true);
    toast.success('Public collaboration link generated and copied to clipboard!', {
      id: `share-${project.id}`
    });
    addHistoryLog({
      id: `log-${Date.now()}-${Math.random()}`,
      action: 'share',
      description: `Generated public read-only collaboration link for "${title || 'Untitled'}"`,
      timestamp: new Date().toISOString(),
      metadata: { projectId: project.id, title: title || 'Untitled' }
    });
    setTimeout(() => setCopiedShare(false), 2000);
  };

  const [editorFolders] = useState<{ id: string; name: string }[]>(() => {
    try {
      return JSON.parse(localStorage.getItem('ranktica-project-folders-col') || '[]');
    } catch {
      return [];
    }
  });

  // Debounced auto-save effect
  useEffect(() => {
    if (
      title !== project.title || 
      niche !== project.niche || 
      audience !== (project.audience || '') ||
      description !== (project.description || '') ||
      folderId !== (project.folderId || '')
    ) {
      setSaveStatus('dirty');
      
      const timeoutId = setTimeout(async () => {
        setSaveStatus('saving');
        try {
          await updateProject(project.id, {
            title,
            niche,
            audience,
            description: description || undefined,
            folderId: folderId || undefined
          });
          setSaveStatus('saved');
          addHistoryLog({
             id: `log-${Date.now()}-${Math.random()}`,
             action: 'auto_save',
             description: `Auto-saved updates to manifest "${title || 'Untitled'}"`,
             timestamp: new Date().toISOString(),
             metadata: { projectId: project.id, title, niche }
          });
        } catch (err) {
          console.error('[Auto-Save] Save failed:', err);
          setSaveStatus('dirty');
        }
      }, 1000); // Debounce typing for 1000ms

      return () => clearTimeout(timeoutId);
    }
  }, [title, niche, audience, description, folderId, project.id, project.title, project.niche, project.audience, project.description, project.folderId, addHistoryLog]);

  const handleSaveAndClose = async () => {
    if (
      title !== project.title || 
      niche !== project.niche || 
      audience !== (project.audience || '') ||
      description !== (project.description || '') ||
      folderId !== (project.folderId || '')
    ) {
      setSaveStatus('saving');
      try {
        await updateProject(project.id, {
          title,
          niche,
          audience,
          description: description || undefined,
          folderId: folderId || undefined
        });
        toast.success(`Project "${title}" successfully saved!`, { duration: 1500 });
      } catch (err) {
        console.error('[Final Save] Save failed:', err);
      }
    }
    onClose();
  };

  const handleExportSingle = () => {
    const jsonString = JSON.stringify(project, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `ranktica-project-${project.id}-${Date.now()}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    toast.success(`Exported single manifest offline backup`);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/95 backdrop-blur-md p-4 animate-fade-in">
       <div className="bg-zinc-900 border border-zinc-800 rounded-[2.5rem] p-10 w-full max-w-lg shadow-2xl relative">
          <div className="absolute top-0 right-0 w-32 h-32 bg-red-650/5 rounded-full blur-2xl pointer-events-none" />
          
          <div className="flex justify-between items-start mb-6 gap-2">
            <div>
              <span className="text-[9px] font-black tracking-widest text-zinc-500 uppercase flex items-center gap-1 mb-1 font-mono">
                Workspace ID: <span className="text-zinc-400">{project.id}</span>
              </span>
              <h3 className="text-2xl font-black text-white tracking-tight">Modify Manifest Settings</h3>
            </div>
            
            <div className="flex items-center gap-2">
              {/* Auto-Save status Indicator */}
              <div className="bg-zinc-950 border border-zinc-850 py-1.5 px-3 rounded-xl flex items-center gap-1.5 text-[9px] font-black uppercase tracking-wider select-none">
                {saveStatus === 'saved' && (
                  <>
                    <span className="w-1.5 h-1.5 rounded-full bg-green-500" />
                    <span className="text-zinc-500">Auto-saved</span>
                  </>
                )}
                {saveStatus === 'saving' && (
                  <>
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-ping" />
                    <span className="text-amber-400">Saving...</span>
                  </>
                )}
                {saveStatus === 'dirty' && (
                  <>
                    <span className="w-1.5 h-1.5 rounded-full bg-zinc-650 animate-pulse" />
                    <span className="text-zinc-400">Pending Changes</span>
                  </>
                )}
              </div>
              
              <button 
                type="button" 
                onClick={handleSaveAndClose} 
                className="p-1 hover:bg-zinc-800 rounded-lg text-zinc-500 hover:text-white transition-colors"
                title="Save & Close"
              >
                <XIcon size={18} />
              </button>
            </div>
          </div>

          <div className="space-y-6">
             <div>
                <label className="text-[10px] font-black text-zinc-500 uppercase block mb-2 tracking-[0.2em]">Project / Video Title</label>
                <input 
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  placeholder="e.g. 100 Days Surviving in Deep Ocean"
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-2xl p-4 text-white text-xs focus:border-red-500 focus:ring-1 focus:ring-red-500/50 outline-none transition-all placeholder:text-zinc-700 font-mono"
                  required
                />
             </div>
             <div>
                <label className="text-[10px] font-black text-zinc-500 uppercase block mb-2 tracking-[0.2em]">Primary Niche</label>
                <input 
                  value={niche}
                  onChange={e => setNiche(e.target.value)}
                  placeholder="e.g. Gaming / Challenge"
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-2xl p-4 text-white text-xs focus:border-red-500 focus:ring-1 focus:ring-red-500/50 outline-none transition-all placeholder:text-zinc-700 font-mono"
                />
             </div>
             <div>
                <label className="text-[10px] font-black text-zinc-500 uppercase block mb-2 tracking-[0.2em]">Target Viewer Persona (Audience)</label>
                <input 
                  value={audience}
                  onChange={e => setAudience(e.target.value)}
                  placeholder="e.g. Teenagers, Minecraft Enthusiasts"
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-2xl p-4 text-white text-xs focus:border-red-500 focus:ring-1 focus:ring-red-500/50 outline-none transition-all placeholder:text-zinc-700 font-mono"
                />
             </div>

             <div>
                <label className="text-[10px] font-black text-zinc-500 uppercase block mb-2 tracking-[0.2em] font-mono">Workspace Annotation & Description Notes</label>
                <textarea
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  placeholder="Write comprehensive workspace logs, outline objectives, tags, task breakdowns or project parameters..."
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-2xl p-4 text-white text-xs focus:border-red-500 focus:ring-1 focus:ring-red-500/50 outline-none transition-all placeholder:text-zinc-700 font-mono h-24 resize-none"
                />
             </div>

             <div>
                <label className="text-[10px] font-black text-zinc-500 uppercase block mb-2 tracking-[0.2em] font-mono">Assigned Collection Folder Domain</label>
                <select
                  value={folderId}
                  onChange={e => setFolderId(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-2xl p-4 text-white text-xs focus:border-red-500 focus:ring-1 focus:ring-red-500/50 outline-none transition-all font-mono"
                >
                  <option value="">Unorganized / No Folder</option>
                  {editorFolders.map(f => (
                    <option key={f.id} value={f.id}>{f.name}</option>
                  ))}
                </select>
             </div>

             <div className="bg-zinc-950 border border-zinc-850 p-4 rounded-2xl space-y-3 mt-4">
                <div className="flex justify-between items-center">
                   <label className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.2em] font-mono">Public Collaboration Link</label>
                   <select
                     value={editorShareExpires}
                     onChange={e => setEditorShareExpires(e.target.value)}
                     className="bg-zinc-900 border border-zinc-800 rounded-lg py-1 px-2 text-[9px] text-zinc-400 font-bold uppercase outline-none focus:border-red-500 transition-colors cursor-pointer"
                   >
                     <option value="24h">Expires 24h</option>
                     <option value="7d">Expires 7d</option>
                     <option value="30d">Expires 30d</option>
                     <option value="never">Permanent</option>
                   </select>
                </div>
                
                <div className="flex gap-2 bg-zinc-900 border border-zinc-850 p-2.5 rounded-xl items-center">
                   <span className="flex-1 text-[10px] text-zinc-500 truncate flex items-center gap-1.5 font-mono">
                      <LinkIcon size={12} className="text-zinc-650" />
                      {window.location.origin}?shared_ids={project.id}&collab=true
                   </span>
                   <button 
                     type="button" 
                     onClick={handleShareCurrentProject} 
                     className="text-zinc-400 hover:text-white p-2 hover:bg-zinc-800 rounded-lg transition-all"
                     title="Generate and copy sharing link"
                   >
                      {copiedShare ? <Check size={14} className="text-green-500 animate-scale-in" /> : <CopyIcon size={14} />}
                   </button>
                </div>
                <p className="text-[8px] text-zinc-500 leading-relaxed font-semibold">Generates a secure, temporary, read-only URL enabling peers to inspect identical assets, script screenplays, and metadata schedules without write credentials.</p>
             </div>

             <div className="flex flex-wrap gap-3 mt-8 pt-4">
                <button
                  type="button"
                  onClick={handleExportSingle}
                  className="flex-1 min-w-[120px] py-3 px-4 bg-zinc-950 hover:bg-zinc-850 border border-zinc-800 text-zinc-300 rounded-2xl font-black text-[10px] uppercase tracking-widest active-press transition-all flex items-center justify-center gap-1.5"
                  title="Export just this project as JSON"
                >
                  <Download size={14} /> Backup (.json)
                </button>
                <button
                  type="button"
                  onClick={handleShareCurrentProject}
                  className="flex-1 min-w-[120px] py-3 px-4 bg-blue-950/20 hover:bg-blue-900/30 border border-blue-500/30 text-blue-400 hover:text-white rounded-2xl font-black text-[10px] uppercase tracking-widest active-press transition-all flex items-center justify-center gap-1.5"
                  title="Generate and copy public read-only link"
                >
                  <Share2 size={14} /> {copiedShare ? 'Copied!' : 'Share Project'}
                </button>
                <button 
                  type="button" 
                  onClick={handleSaveAndClose} 
                  className="flex-[2] min-w-[160px] py-3 px-4 bg-red-600 hover:bg-red-500 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-lg shadow-red-600/10 active-press transition-all border border-red-500 flex items-center justify-center gap-1.5"
                >
                  <Check size={14} /> Close & Save
                </button>
             </div>
          </div>
       </div>
    </div>
  );
};

interface ProjectTimelineViewProps {
  projects: Project[];
  updateStatus: (id: string, newStatus: Project['status']) => Promise<void>;
  historyLogs: any[];
  addHistoryLog: (
    actionOrLog: string | any, 
    type?: 'bulk' | 'save' | 'export' | 'import', 
    metadata?: Record<string, any>
  ) => void;
}

export const ProjectTimelineView: React.FC<ProjectTimelineViewProps> = ({ 
  projects, 
  updateStatus,
  historyLogs,
  addHistoryLog
}) => {
  const { updateProject } = useProject();
  
  const [subView, setSubView] = useState<'pipeline' | 'gantt' | 'analytics' | 'activity_timeline'>('activity_timeline');
  const [selectedGanttProjId, setSelectedGanttProjId] = useState<string>('');
  const [mockScriptPct, setMockScriptPct] = useState<number | null>(null);
  const [mockVideoPct, setMockVideoPct] = useState<number | null>(null);
  const [mockRenderPct, setMockRenderPct] = useState<number | null>(null);

  // Filter archived out
  const activeProjects = projects.filter(p => !p.archived);

  // Sync selected project id
  useEffect(() => {
    if (activeProjects.length > 0 && !selectedGanttProjId) {
      setSelectedGanttProjId(activeProjects[0].id);
    }
  }, [activeProjects, selectedGanttProjId]);

  useEffect(() => {
    setMockScriptPct(null);
    setMockVideoPct(null);
    setMockRenderPct(null);
  }, [selectedGanttProjId]);

  if (activeProjects.length === 0) {
    return (
      <div className="py-20 flex flex-col items-center justify-center border border-dashed border-zinc-800 rounded-[2rem] text-zinc-500 bg-zinc-950/20">
        <Calendar size={32} className="mb-3 opacity-30 text-blue-400" />
        <h4 className="text-sm font-extrabold text-white uppercase tracking-wider mb-1">No Active Timelines</h4>
        <p className="text-xs text-zinc-400 max-w-xs text-center">Create or unarchive a project to visualize its dynamic end-to-end publishing lifecycle.</p>
      </div>
    );
  }

  // Selected project for Gantt
  const selectedProject = activeProjects.find(p => p.id === selectedGanttProjId) || activeProjects[0];

  // Default tasks initializer
  const defaultTasksForProject = (projId: string, projTitle: string): any[] => {
    return [
      {
        id: `task-${projId}-1`,
        title: 'Idea Research & Brainstorm',
        milestone: 'Ideation',
        status: 'completed' as const,
        startDate: new Date(Date.now() - 5 * 24 * 3600 * 1000).toISOString().split('T')[0],
        endDate: new Date(Date.now() - 2 * 24 * 3600 * 1000).toISOString().split('T')[0],
      },
      {
        id: `task-${projId}-2`,
        title: 'Script Screenplay Draft',
        milestone: 'Scripting',
        status: 'in_progress' as const,
        startDate: new Date(Date.now() - 2 * 24 * 3600 * 1000).toISOString().split('T')[0],
        endDate: new Date(Date.now() + 2 * 24 * 3600 * 1000).toISOString().split('T')[0],
      },
      {
        id: `task-${projId}-3`,
        title: 'Voiceover Recording',
        milestone: 'Audio Studio',
        status: 'pending' as const,
        startDate: new Date(Date.now() + 2 * 24 * 3600 * 1000).toISOString().split('T')[0],
        endDate: new Date(Date.now() + 4 * 24 * 3600 * 1000).toISOString().split('T')[0],
      },
      {
        id: `task-${projId}-4`,
        title: 'Thumbnail Canvas Design',
        milestone: 'Thumbnail',
        status: 'pending' as const,
        startDate: new Date(Date.now() + 4 * 24 * 3600 * 1000).toISOString().split('T')[0],
        endDate: new Date(Date.now() + 6 * 24 * 3600 * 1000).toISOString().split('T')[0],
      },
      {
        id: `task-${projId}-5`,
        title: 'Veo Video Compilation & Render',
        milestone: 'Video Studio',
        status: 'pending' as const,
        startDate: new Date(Date.now() + 6 * 24 * 3600 * 1000).toISOString().split('T')[0],
        endDate: new Date(Date.now() + 10 * 24 * 3600 * 1000).toISOString().split('T')[0],
      }
    ];
  };

  const tasks = selectedProject?.assets?.tasks || defaultTasksForProject(selectedProject?.id || 'demo', selectedProject?.title || 'demo');

  // Trigger tasks initial persistent sync if not present
  const persistTasks = async (updatedTasks: any[]) => {
    const assets = { ...selectedProject.assets, tasks: updatedTasks };
    await updateProject(selectedProject.id, { assets });
  };

  const handleAddTask = async (newTask: { title: string; milestone: string; status: 'pending' | 'in_progress' | 'completed'; startDate: string; endDate: string }) => {
    const taskObj = {
      id: `task-${selectedProject.id}-${Date.now()}`,
      ...newTask
    };
    const updatedTasks = [...(selectedProject.assets?.tasks || defaultTasksForProject(selectedProject.id, selectedProject.title)), taskObj];
    await persistTasks(updatedTasks);
    toast.success('Gantt Milestone task tracked successfully!');
  };

  const handleDeleteTask = async (taskId: string) => {
    const updatedTasks = (selectedProject.assets?.tasks || defaultTasksForProject(selectedProject.id, selectedProject.title)).filter((t: any) => t.id !== taskId);
    await persistTasks(updatedTasks);
    toast.success('Task removed from Gantt timeline.');
  };

  const handleUpdateTaskStatus = async (taskId: string, status: 'pending' | 'in_progress' | 'completed') => {
    const updatedTasks = (selectedProject.assets?.tasks || defaultTasksForProject(selectedProject.id, selectedProject.title)).map((t: any) => 
      t.id === taskId ? { ...t, status } : t
    );
    await persistTasks(updatedTasks);
    toast.success('Milestone execution state synchronized!');
  };

  const stages = [
    { id: 'ideation', label: 'Ideation', desc: 'Concept Proposed', icon: Sparkles, color: 'text-zinc-400', activeBg: 'bg-zinc-500/20 border-zinc-500' },
    { id: 'scripting', label: 'Scripting', desc: 'Script Written', icon: FileText, color: 'text-blue-400', activeBg: 'bg-blue-500/20 border-blue-500' },
    { id: 'production', label: 'Thumbnail', desc: 'Art Designed', icon: ImageIcon, color: 'text-orange-400', activeBg: 'bg-orange-500/20 border-orange-500' },
    { id: 'marketing', label: 'SEO tags', desc: 'Metadata Complete', icon: Search, color: 'text-green-400', activeBg: 'bg-green-500/20 border-green-500' },
    { id: 'published', label: 'Video Export', desc: 'Synthesized MP4', icon: Video, color: 'text-purple-400', activeBg: 'bg-purple-500/20 border-purple-500' }
  ];

  // Render Gantt UI helper
  const renderGanttTimeline = () => {
    // Dynamic Date Calculation for Adaptive Gantt grid
    const startDates = tasks.map((t: any) => new Date(t.startDate).getTime());
    const endDates = tasks.map((t: any) => new Date(t.endDate).getTime());
    
    const minTime = startDates.length > 0 ? Math.min(...startDates) : Date.now() - 5 * 24 * 3600 * 1000;
    const maxTime = endDates.length > 0 ? Math.max(...endDates) : Date.now() + 9 * 24 * 3600 * 1000;

    const minDate = new Date(minTime);
    minDate.setHours(0, 0, 0, 0);
    const maxDate = new Date(maxTime);
    maxDate.setHours(23, 59, 59, 999);

    const totalDays = Math.max(7, Math.ceil((maxDate.getTime() - minDate.getTime()) / (24 * 3600 * 1000)));
    
    // Generate scale days labels
    const daysArray = Array.from({ length: totalDays }, (_, i) => {
      const d = new Date(minDate.getTime() + i * 24 * 3600 * 1000);
      return d;
    });

    const milestoneColors: Record<string, string> = {
      'Ideation': 'from-zinc-500 to-zinc-650 text-zinc-300 ring-zinc-500/20',
      'Scripting': 'from-blue-650 to-indigo-600 text-blue-200 ring-blue-500/20',
      'Audio Studio': 'from-purple-650 to-fuchsia-600 text-purple-200 ring-purple-500/20',
      'Thumbnail': 'from-orange-650 to-amber-600 text-orange-200 ring-orange-500/20',
      'Video Studio': 'from-red-650 to-pink-600 text-red-200 ring-red-500/20',
      'SEO Marketing': 'from-emerald-650 to-teal-600 text-emerald-200 ring-emerald-500/20'
    };

    return (
      <div className="space-y-6">
        {/* Project Selection Dropdown bar & Form Container */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-zinc-950 p-4 border border-zinc-850 rounded-2xl">
          <div>
            <label className="text-[9px] font-black tracking-widest text-zinc-550 uppercase block mb-1">Selected Active Project Workspace</label>
            <select
              value={selectedGanttProjId}
              onChange={e => setSelectedGanttProjId(e.target.value)}
              className="bg-zinc-900 border border-zinc-800 text-xs font-black text-white p-2.5 rounded-xl uppercase outline-none focus:border-blue-500 transition-colors cursor-pointer"
            >
              {activeProjects.map(p => (
                <option key={p.id} value={p.id}>{p.title}</option>
              ))}
            </select>
          </div>
          <div className="flex gap-2">
            <span className="text-[9.5px] font-bold text-zinc-400 bg-zinc-900 border border-zinc-850 px-3.5 py-2 rounded-xl uppercase tracking-wider">
              Niche Target: <strong className="text-blue-400">{selectedProject?.niche}</strong>
            </span>
            <span className="text-[9.5px] font-bold text-zinc-400 bg-zinc-900 border border-zinc-850 px-3.5 py-2 rounded-xl uppercase tracking-wider">
              Suite status: <strong className="text-red-400">{selectedProject?.status}</strong>
            </span>
          </div>
        </div>

        {/* Adaptive Gantt Timeline Grid Box */}
        <div className="bg-zinc-950 border border-zinc-850 rounded-[2rem] p-6 overflow-x-auto custom-scrollbar">
          <div className="min-w-[800px] space-y-6">
            
            {/* Horizontal Timeline Grid Scaler Days */}
            <div className="flex border-b border-zinc-850/60 pb-3 h-12 items-end">
              <div className="w-[240px] text-[9.5px] font-black uppercase text-zinc-500 tracking-wider">Milestone Work Items</div>
              <div className="flex-1 relative flex justify-between">
                {daysArray.map((day, idx) => {
                  const dayStr = day.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
                  const isToday = day.toDateString() === new Date().toDateString();
                  return (
                    <div key={idx} className="flex-1 text-center relative flex flex-col items-center">
                      <span className={`text-[8px] font-mono font-bold block ${isToday ? 'text-rose-500 font-extrabold' : 'text-zinc-600'}`}>{dayStr}</span>
                      <div className={`w-[1px] h-6 mt-1.5 bg-zinc-850/30 relative inline-block ${isToday ? 'bg-rose-500/50 w-[2px]' : ''}`}>
                        {isToday && (
                          <span className="absolute -top-1 left-1.5 uppercase font-black tracking-widest text-[7px] text-rose-500 bg-rose-950 px-1 py-0.5 rounded border border-rose-800/30">Today</span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Task rows */}
            <div className="space-y-4">
              {tasks.map((task: any) => {
                const taskStart = new Date(task.startDate).getTime();
                const taskEnd = new Date(task.endDate).getTime();
                
                // Offsets
                const offsetDays = Math.max(0, Math.floor((taskStart - minDate.getTime()) / (24 * 3600 * 1000)));
                const durationDays = Math.max(1, Math.ceil((taskEnd - taskStart) / (24 * 3600 * 1000)));
                
                const percentLeft = (offsetDays / totalDays) * 100;
                const percentWidth = (durationDays / totalDays) * 100;

                return (
                  <div key={task.id} className="flex items-center group/row border-b border-zinc-900/30 pb-3">
                    {/* Information name side */}
                    <div className="w-[240px] pr-4 space-y-1">
                      <span className="text-[7.5px] font-black font-mono uppercase bg-zinc-900 border border-zinc-800 text-zinc-400 px-1.5 py-0.5 rounded">
                        {task.milestone}
                      </span>
                      <h5 className="text-[11px] font-black text-white group-hover/row:text-red-400 transition-colors leading-tight">{task.title}</h5>
                      <div className="flex gap-1.5 items-center">
                        <select
                          value={task.status}
                          onChange={(e) => handleUpdateTaskStatus(task.id, e.target.value as any)}
                          className={`text-[8px] font-black uppercase tracking-wider bg-zinc-900 border border-zinc-820 rounded p-1 outline-none transition-colors cursor-pointer ${
                            task.status === 'completed' ? 'text-green-400 focus:border-green-600' :
                            task.status === 'in_progress' ? 'text-blue-400 focus:border-blue-600' :
                            'text-zinc-550 focus:border-zinc-700'
                          }`}
                        >
                          <option value="pending">Pending</option>
                          <option value="in_progress">In Progress</option>
                          <option value="completed">Completed</option>
                        </select>
                        <button
                          type="button"
                          onClick={() => handleDeleteTask(task.id)}
                          className="hover:bg-zinc-900/80 p-1 rounded hover:text-red-500 text-zinc-550 transition-colors"
                          title="Delete Milestone Task"
                        >
                          <Trash2 size={9.5} />
                        </button>
                      </div>
                    </div>

                    {/* Timeline visualization horizontal stretching strip */}
                    <div className="flex-1 h-12 relative flex items-center bg-zinc-900/10 rounded-xl px-1">
                      <div 
                        className={`absolute h-8 rounded-xl bg-gradient-to-r ${milestoneColors[task.milestone] || 'from-zinc-650 to-zinc-700'} border border-zinc-500/10 shadow-lg px-3 flex items-center justify-between ring-4 ring-zinc-950 overflow-hidden group select-none hover:brightness-110 transition-all cursor-grab active:cursor-grabbing`}
                        style={{
                          left: `calc(${percentLeft}% + 4px)`,
                          width: `calc(${percentWidth}% - 8px)`
                        }}
                      >
                        <div className="truncate text-[8px] font-bold text-white uppercase tracking-wider flex items-center gap-1">
                          <Clock size={8} /> {durationDays} days ({new Date(task.startDate).toLocaleDateString([], {month: 'numeric', day: 'numeric'})} - {new Date(task.endDate).toLocaleDateString([], {month: 'numeric', day: 'numeric'})})
                        </div>
                        <span className={`text-[7px] font-black uppercase font-mono px-1 rounded-full ${
                          task.status === 'completed' ? 'bg-emerald-900 text-emerald-300' :
                          task.status === 'in_progress' ? 'bg-blue-900 text-blue-300 animate-pulse' :
                          'bg-zinc-800 text-zinc-400'
                        }`}>
                          {task.status === 'completed' ? 'Done' : task.status === 'in_progress' ? 'Active' : 'Wait'}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Task Form Inserter Matrix */}
        <div className="bg-zinc-950 border border-zinc-850 p-6 rounded-[2rem] space-y-4">
          <div className="flex items-center gap-2">
            <Plus size={16} className="text-red-500" />
            <h4 className="text-xs font-black uppercase tracking-wider text-white">Track Workspace Milestone Task</h4>
          </div>

          <form onSubmit={async (e) => {
            e.preventDefault();
            const f = e.currentTarget;
            const elements = f.elements as any;
            
            const title = elements.t_title.value.trim();
            const milestone = elements.t_milestone.value;
            const status = elements.t_status.value;
            const startDate = elements.t_start.value;
            const endDate = elements.t_end.value;

            if (!title) {
              toast.error('Task title is required');
              return;
            }
            if (new Date(endDate) < new Date(startDate)) {
              toast.error('Task end date cannot precede start date!');
              return;
            }

            await handleAddTask({ title, milestone, status, startDate, endDate });
            f.reset();
          }} className="grid grid-cols-1 md:grid-cols-5 gap-3.5 items-end">
            <div className="space-y-1.5">
              <label className="text-[8px] font-black text-zinc-500 uppercase block font-mono">Work Item Title</label>
              <input
                name="t_title"
                type="text"
                required
                placeholder="e.g. Draw dynamic vector thumbnails"
                className="w-full bg-zinc-900 border border-zinc-800 rounded-xl p-2.5 text-xs text-white uppercase font-black placeholder-zinc-650 outline-none focus:border-red-500 transition-colors"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-[8px] font-black text-zinc-500 uppercase block font-mono">Milestone Group</label>
              <select
                name="t_milestone"
                className="w-full bg-zinc-900 border border-zinc-800 rounded-xl p-2.5 text-xs font-black text-white uppercase outline-none focus:border-red-500 transition-colors"
              >
                <option value="Ideation">Ideation</option>
                <option value="Scripting">Scripting</option>
                <option value="Audio Studio">Audio Studio</option>
                <option value="Thumbnail">Thumbnail</option>
                <option value="Video Studio">Video Studio</option>
                <option value="SEO Marketing">SEO Marketing</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-[8px] font-black text-zinc-500 uppercase block font-mono">Execution Status</label>
              <select
                name="t_status"
                className="w-full bg-zinc-900 border border-zinc-800 rounded-xl p-2.5 text-xs font-black text-white uppercase outline-none focus:border-red-500 transition-colors"
              >
                <option value="pending">Pending</option>
                <option value="in_progress">In Progress</option>
                <option value="completed">Completed</option>
              </select>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1.5">
                <label className="text-[8px] font-black text-zinc-500 uppercase block font-mono">Start</label>
                <input
                  name="t_start"
                  type="date"
                  required
                  defaultValue={new Date().toISOString().split('T')[0]}
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-xl p-2.5 text-[10px] font-black text-white outline-none focus:border-red-500 transition-colors"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[8px] font-black text-zinc-500 uppercase block font-mono">End</label>
                <input
                  name="t_end"
                  type="date"
                  required
                  defaultValue={new Date(Date.now() + 3 * 24 * 3600 * 1000).toISOString().split('T')[0]}
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-xl p-2.5 text-[10px] font-black text-white outline-none focus:border-red-500 transition-colors"
                />
              </div>
            </div>

            <button
              type="submit"
              className="bg-red-650 hover:bg-red-600 border border-transparent text-white p-2.5 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all cursor-pointer h-10 w-full flex items-center justify-center gap-1 hover:shadow-lg hover:shadow-red-950/20"
            >
              <Plus size={12} /> Add Gantt Task
            </button>
          </form>
        </div>
      </div>
    );
  };

  const renderAnalyticsTimeline = () => {
    const currentTasks = selectedProject?.assets?.tasks || defaultTasksForProject(selectedProject?.id || 'demo', selectedProject?.title || 'demo');
    
    // 1. Calculate Scripts/Dialogue success
    const sTasks = currentTasks.filter((t: any) => t.milestone === 'Scripting' || t.milestone === 'Ideation');
    const sDone = sTasks.filter((t: any) => t.status === 'completed').length;
    const sTotal = sTasks.length || 1;
    const sCalc = Math.round((sDone / sTotal) * 100);
    const sFinal = mockScriptPct !== null ? mockScriptPct : (selectedProject?.assets?.script ? 100 : sCalc);

    // 2. Calculate Video Generation success
    const vTasks = currentTasks.filter((t: any) => t.milestone === 'Video Studio' || t.milestone === 'Thumbnail');
    const vDone = vTasks.filter((t: any) => t.status === 'completed').length;
    const vTotal = vTasks.length || 1;
    const vCalc = Math.round((vDone / vTotal) * 100);
    const vFinal = mockVideoPct !== null ? mockVideoPct : (selectedProject?.assets?.videoUri ? 100 : vCalc);

    // 3. Calculate Final Render success
    const rTasks = currentTasks.filter((t: any) => t.milestone === 'SEO Marketing' || t.milestone === 'Final Render');
    const rDone = rTasks.filter((t: any) => t.status === 'completed').length;
    const rTotal = rTasks.length || 1;
    const rCalc = Math.round((rDone / rTotal) * 100);
    const rFinal = mockRenderPct !== null ? mockRenderPct : (selectedProject?.status === 'published' ? 100 : rCalc);

    // Recharts Data Source
    const chartData = [
      { name: 'Script Milestone', Progress: sFinal },
      { name: 'Video Scenario', Progress: vFinal },
      { name: 'Final Comp Render', Progress: rFinal }
    ];

    return (
      <div className="space-y-6 animate-fade-in" id="milestones-recharts-analytics-panel">
        <div className="bg-[#121214] border border-zinc-800 rounded-[2rem] p-6 space-y-6">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-zinc-900 pb-5">
            <div className="space-y-1">
              <span className="text-[9px] font-black tracking-widest text-rose-500 uppercase font-mono">
                Recharts Live Production Tracker
              </span>
              <h3 className="text-sm font-black text-white uppercase tracking-wider">
                Production Progress Analytics
              </h3>
              <p className="text-xs text-zinc-500">
                Track and simulate dialogue scripting, scene generation, and final render compiling rates.
              </p>
            </div>

            <div className="flex items-center gap-2 bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-1.5 shrink-0">
              <span className="text-[10px] font-black uppercase text-zinc-500">Inspect Manifest:</span>
              <select
                value={selectedGanttProjId}
                onChange={(e) => setSelectedGanttProjId(e.target.value)}
                className="bg-transparent text-xs font-black uppercase text-zinc-350 hover:text-white outline-none cursor-pointer transition-colors"
              >
                {activeProjects.map((p) => (
                  <option key={p.id} value={p.id} className="bg-[#121214]">
                    {p.title}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-zinc-950/40 border border-zinc-850 p-4 rounded-2xl flex items-center justify-between">
              <div className="space-y-1.5 min-w-0">
                <span className="text-[9px] font-bold text-amber-500 uppercase font-mono tracking-wider block">Dialogue Scripting</span>
                <span className="text-xl font-black text-white block">{sFinal}% Complete</span>
                <span className="text-[8px] text-zinc-500 block truncate">Tasks: {sDone} complete • {sTasks.length} total</span>
              </div>
              <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-500 font-black text-xs shrink-0">
                ✍️
              </div>
            </div>

            <div className="bg-zinc-950/40 border border-zinc-850 p-4 rounded-2xl flex items-center justify-between">
              <div className="space-y-1.5 min-w-0">
                <span className="text-[9px] font-bold text-blue-500 uppercase font-mono tracking-wider block">Video Scene Gen</span>
                <span className="text-xl font-black text-white block">{vFinal}% Complete</span>
                <span className="text-[8px] text-zinc-500 block truncate">Tasks: {vDone} complete • {vTasks.length} total</span>
              </div>
              <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-500 font-black text-xs shrink-0">
                🎬
              </div>
            </div>

            <div className="bg-zinc-950/40 border border-zinc-850 p-4 rounded-2xl flex items-center justify-between">
              <div className="space-y-1.5 min-w-0">
                <span className="text-[9px] font-bold text-emerald-500 uppercase font-mono tracking-wider block">Compilation Render</span>
                <span className="text-xl font-black text-white block">{rFinal}% Complete</span>
                <span className="text-[8px] text-zinc-500 block truncate">Tasks: {rDone} complete • {rTasks.length} total</span>
              </div>
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-500 font-black text-xs shrink-0">
                ⚙️
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-5 gap-6 items-center bg-zinc-950/20 border border-zinc-900 rounded-3xl p-6">
            <div className="md:col-span-3 h-64 md:h-80 w-full relative">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                  data={chartData}
                  margin={{ top: 20, right: 30, left: 10, bottom: 20 }}
                >
                  <defs>
                    <linearGradient id="colorProgress" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8}/>
                      <stop offset="95%" stopColor="#ef4444" stopOpacity={0.05}/>
                    </linearGradient>
                  </defs>
                  <XAxis 
                    dataKey="name" 
                    stroke="#52525b" 
                    fontSize={10} 
                    fontWeight="black"
                    tickLine={false} 
                  />
                  <YAxis 
                    stroke="#52525b" 
                    fontSize={10} 
                    fontWeight="bold"
                    domain={[0, 100]}
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(v) => `${v}%`}
                  />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: '#09090b', 
                      borderColor: '#27272a', 
                      borderRadius: '1rem',
                      fontFamily: 'monospace',
                      fontSize: '11px',
                      textTransform: 'uppercase'
                    }} 
                  />
                  <Legend 
                    verticalAlign="top" 
                    height={36} 
                    wrapperStyle={{ fontSize: '10px', textTransform: 'uppercase', fontWeight: 'bold' }}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="Progress" 
                    stroke="#ef4444" 
                    fillOpacity={1} 
                    strokeWidth={2}
                    fill="url(#colorProgress)" 
                    name="Phase Completion Rate"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>

            <div className="md:col-span-2 space-y-4">
              <div className="bg-zinc-950 p-4 border border-zinc-900 rounded-2xl space-y-4">
                <span className="text-[9px] font-black uppercase text-zinc-500 font-mono tracking-widest block border-b border-zinc-900 pb-2">
                  🎛️ Real-time Milestone Simulators
                </span>

                <div className="space-y-1.5">
                  <div className="flex justify-between items-center text-[10px]">
                    <span className="font-extrabold text-zinc-350">Scripting & Dialogue</span>
                    <span className="font-mono text-amber-500 font-black">{sFinal}%</span>
                  </div>
                  <input 
                    type="range"
                    min="0"
                    max="100"
                    step="5"
                    value={sFinal}
                    onChange={(e) => setMockScriptPct(Number(e.target.value))}
                    className="w-full h-1 bg-zinc-900 rounded-lg cursor-pointer accent-amber-500"
                  />
                </div>

                <div className="space-y-1.5">
                  <div className="flex justify-between items-center text-[10px]">
                    <span className="font-extrabold text-zinc-350">Video Scenario Generation</span>
                    <span className="font-mono text-blue-500 font-black">{vFinal}%</span>
                  </div>
                  <input 
                    type="range"
                    min="0"
                    max="100"
                    step="5"
                    value={vFinal}
                    onChange={(e) => setMockVideoPct(Number(e.target.value))}
                    className="w-full h-1 bg-zinc-900 rounded-lg cursor-pointer accent-blue-500"
                  />
                </div>

                <div className="space-y-1.5">
                  <div className="flex justify-between items-center text-[10px]">
                    <span className="font-extrabold text-zinc-355">Final compilation Render</span>
                    <span className="font-mono text-emerald-500 font-black">{rFinal}%</span>
                  </div>
                  <input 
                    type="range"
                    min="0"
                    max="100"
                    step="5"
                    value={rFinal}
                    onChange={(e) => setMockRenderPct(Number(e.target.value))}
                    className="w-full h-1 bg-zinc-900 rounded-lg cursor-pointer accent-emerald-500"
                  />
                </div>

                {(mockScriptPct !== null || mockVideoPct !== null || mockRenderPct !== null) && (
                  <button
                    onClick={() => {
                      setMockScriptPct(null);
                      setMockVideoPct(null);
                      setMockRenderPct(null);
                      toast.success("Synchronized back to Board milestone tasks!");
                    }}
                    className="w-full bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-white border border-zinc-800 text-[9px] font-black uppercase tracking-widest py-2 rounded-xl transition-all cursor-pointer"
                  >
                    🔄 Reload from Board Task Logs
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Dynamic Sub-View Switch controllers */}
      <div className="flex bg-zinc-950/60 p-1 border border-zinc-850 rounded-2xl w-fit">
        <button
          type="button"
          onClick={() => setSubView('activity_timeline')}
          className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all flex items-center gap-1.5 cursor-pointer ${
            subView === 'activity_timeline' 
              ? 'bg-blue-600 text-white shadow'
              : 'text-zinc-505 hover:text-white'
          }`}
        >
          <History size={12} /> Activity Timeline
        </button>
        <button
          type="button"
          onClick={() => setSubView('gantt')}
          className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all flex items-center gap-1.5 cursor-pointer ${
            subView === 'gantt' 
              ? 'bg-blue-600 text-white shadow'
              : 'text-zinc-505 hover:text-white'
          }`}
        >
          <Activity size={12} /> Gantt Milestone Matrix
        </button>
        <button
          type="button"
          onClick={() => setSubView('pipeline')}
          className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all flex items-center gap-1.5 cursor-pointer ${
            subView === 'pipeline' 
              ? 'bg-blue-600 text-white shadow'
              : 'text-zinc-505 hover:text-white'
          }`}
        >
          <Calendar size={12} /> Workflow Pipeline
        </button>
        <button
          type="button"
          onClick={() => setSubView('analytics')}
          className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all flex items-center gap-1.5 cursor-pointer ${
            subView === 'analytics' 
              ? 'bg-blue-600 text-white shadow'
              : 'text-zinc-505 hover:text-white'
          }`}
        >
          <BarChart3 size={12} /> Recharts Milestone Analytics
        </button>
      </div>

      {subView === 'activity_timeline' && (
        <ProjectActivityTimeline 
          projects={projects} 
          historyLogs={historyLogs} 
          addHistoryLog={addHistoryLog} 
        />
      )}

      {subView === 'gantt' && renderGanttTimeline()}

      {subView === 'pipeline' && (
        <div className="space-y-6 overflow-y-auto pr-2 max-h-[calc(100vh-280px)] custom-scrollbar">
          {activeProjects.map((project) => {
            // Compute completed count & calculate exact completion percentage
            let progressPercent = 20; // Starts with Ideation at minimum
            if (project.assets?.script) progressPercent += 20;
            if (project.assets?.thumbnail) progressPercent += 20;
            if (project.assets?.seo || project.assets?.metadata_topic || project.assets?.metadata_result) progressPercent += 20;
            if (project.assets?.videoUri) progressPercent += 20;

            const assetStates = {
              ideation: true,
              scripting: !!project.assets?.script,
              production: !!project.assets?.thumbnail,
              marketing: !!(project.assets?.seo || project.assets?.metadata_topic || project.assets?.metadata_result),
              published: !!project.assets?.videoUri
            };

            const toggleAsset = async (stageId: string) => {
              if (stageId === 'ideation') return; // Always done
              
              let updates: any = { assets: { ...project.assets } };
              if (!updates.assets) updates.assets = {};

              if (stageId === 'scripting') {
                updates.assets.script = !updates.assets.script;
              } else if (stageId === 'production') {
                updates.assets.thumbnail = !updates.assets.thumbnail;
              } else if (stageId === 'marketing') {
                updates.assets.seo = !updates.assets.seo;
              } else if (stageId === 'published') {
                updates.assets.videoUri = updates.assets.videoUri ? '' : 'https://example.com/mock.mp4';
              }

              try {
                await updateProject(project.id, updates);
                toast.success(`Updated component progress on '${project.title}'`);
              } catch (e) {
                toast.error("Failed to update asset state");
              }
            };

            const handleStatusSequence = async () => {
              const statuses: Project['status'][] = ['idea', 'scripting', 'production', 'scheduled', 'published'];
              const currIdx = statuses.indexOf(project.status);
              if (currIdx < statuses.length - 1) {
                const next = statuses[currIdx + 1];
                await updateStatus(project.id, next);
                toast.success(`Advanced status to ${next.toUpperCase()}`);
              } else {
                // cycle loop to idea
                await updateStatus(project.id, 'idea');
                toast.success(`Reset status back to IDEA`);
              }
            };

            return (
              <div key={project.id} className="bg-zinc-900/80 border border-zinc-800 rounded-3xl p-6 transition-all hover:border-zinc-750 hover:shadow-xl group">
                {/* Top row */}
                <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 mb-6">
                  <div>
                    <div className="flex items-center gap-3 mb-1">
                      <span className="text-[9px] uppercase font-black text-zinc-400 bg-zinc-950 px-2.5 py-1 rounded-lg border border-zinc-850">
                        {project.niche}
                      </span>
                      <span className="text-[9px] uppercase font-black text-blue-400 bg-blue-500/10 px-2.5 py-1 rounded-lg border border-blue-500/20">
                        Status: {project.status.toUpperCase()}
                      </span>
                      <span className="text-xs font-mono text-zinc-500">
                        Last updated: {new Date(project.lastUpdated).toLocaleDateString()}
                      </span>
                    </div>
                    <h4 className="text-lg font-extrabold text-white tracking-tight">{project.title}</h4>
                  </div>

                  {/* Progress visualizer & controllers */}
                  <div className="flex items-center gap-4 self-stretch lg:self-auto justify-between lg:justify-end border-t border-zinc-850 lg:border-t-0 pt-4 lg:pt-0">
                    <div className="text-right">
                      <div className="text-[10px] font-black uppercase text-zinc-400 tracking-wider">Suite Progress</div>
                      <div className="text-xl font-black text-emerald-400">{progressPercent}%</div>
                    </div>
                    
                    {/* Status sequence controller */}
                    <button
                      type="button"
                      onClick={handleStatusSequence}
                      className="bg-zinc-950 hover:bg-zinc-850 border border-zinc-800 text-[10px] font-black uppercase tracking-widest text-zinc-300 hover:text-white px-4 py-2.5 rounded-xl transition-all cursor-pointer"
                    >
                      Sequence State ⚡
                    </button>
                  </div>
                </div>

                {/* Seamless Progress track bar */}
                <div className="relative mb-6">
                  <div className="absolute top-1/2 left-0 w-full h-[3px] bg-zinc-800 -translate-y-1/2 rounded-full" />
                  <div 
                    className="absolute top-1/2 left-0 h-[3px] bg-gradient-to-r from-blue-500 via-orange-500 to-purple-500 -translate-y-1/2 rounded-full transition-all duration-500" 
                    style={{ width: `${progressPercent}%` }}
                  />

                  {/* Grid overlay of timeline node elements */}
                  <div className="grid grid-cols-5 relative justify-between z-10 w-full">
                    {stages.map((stage) => {
                      const isDone = assetStates[stage.id as keyof typeof assetStates];
                      const Icon = stage.icon;

                      return (
                        <div key={stage.id} className="flex flex-col items-center">
                          {/* Clicking on node triggers seamless toggle for assets */}
                          <button
                            type="button"
                            onClick={() => toggleAsset(stage.id)}
                            className={`w-11 h-11 rounded-full border flex items-center justify-center transition-all cursor-pointer relative ${
                              isDone 
                                ? `${stage.activeBg} text-white shadow-lg shadow-zinc-950 scale-110 active:scale-100 ring-2 ring-zinc-950` 
                                : "bg-zinc-950 hover:bg-zinc-900 border-zinc-800 text-zinc-600 scale-95 hover:scale-100 hover:text-zinc-300"
                            }`}
                            title={`Click to check/uncheck ${stage.label}`}
                          >
                            {isDone ? (
                              <Check size={14} className="text-emerald-400 font-black absolute -top-1 -right-1 bg-zinc-950 rounded-full border border-zinc-800 p-0.5" />
                            ) : null}
                            <Icon size={16} className={isDone ? stage.color : "text-zinc-650"} />
                          </button>

                          <div className="text-center mt-3 px-1">
                            <div className={`text-[10px] font-black uppercase tracking-wider ${isDone ? 'text-zinc-200' : 'text-zinc-500'}`}>
                              {stage.label}
                            </div>
                            <div className="text-[8px] text-zinc-500 tracking-tight leading-normal hidden sm:block">
                              {isDone ? stage.desc : 'Pending Asset'}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Quick helper note */}
                <div className="text-[10px] font-black uppercase tracking-widest text-zinc-505 flex items-center gap-1.5 opacity-60">
                  <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse"></span>
                  ProTip: Click on any workflow node icon (Ideation, Script, Thumbnail, SEO, Video) to simulate live tool generation outputs!
                </div>
              </div>
            );
          })}
        </div>
      )}

      {subView === 'analytics' && renderAnalyticsTimeline()}
    </div>
  );
};

