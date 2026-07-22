import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { 
  getActivities, 
  logActivity, 
  getCategoryFromTypeAndTool,
  ActivityItem 
} from '@/shared/activityLogger';
import { 
  History, 
  Search, 
  Trash2, 
  RefreshCw, 
  FileText, 
  Clock, 
  PlusCircle, 
  TrendingUp, 
  Award, 
  Cpu, 
  CheckCircle2, 
  ArrowRight, 
  FileSpreadsheet, 
  ShieldAlert, 
  Fingerprint,
  Info,
  Layers,
  Settings,
  DollarSign,
  User,
  Activity,
  FolderOpen,
  Calendar,
  X,
  UploadCloud,
  SlidersHorizontal,
  Zap,
  Flag,
  GitCompare,
  Bookmark
} from 'lucide-react';
import toast from 'react-hot-toast';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer 
} from 'recharts';
import { useProject } from './ProjectContext';
import { useAuth } from '@/infrastructure/auth/AuthContext';


export interface LogTemplate {
  id: string;
  name: string;
  searchTerm: string;
  selectedFilter: string;
  filterMode: 'category' | 'type';
  timePreset: 'all' | '24h' | '7d' | '30d' | 'custom';
  customStartDate: string;
  customEndDate: string;
  selectedProjectId: string;
  selectedActionType: string;
  sortBy: string;
  isDefault?: boolean;
}


export const ActivityLogs: React.FC = () => {
  const { googleToken, signInWithGoogle } = useAuth();
  
  // Template Library State
  const [templates, setTemplates] = useState<LogTemplate[]>(() => {
    const stored = localStorage.getItem('ranktica_log_templates');
    if (stored) {
      try {
        return JSON.parse(stored);
      } catch (e) {
        console.error(e);
      }
    }
    return [
      {
        id: 'tpl-errors',
        name: '⚠️ System Anomalies & Errors',
        searchTerm: 'error',
        selectedFilter: 'all',
        filterMode: 'category',
        timePreset: 'all',
        customStartDate: '',
        customEndDate: '',
        selectedProjectId: 'all',
        selectedActionType: 'all',
        sortBy: 'date-desc',
        isDefault: true
      },
      {
        id: 'tpl-scripts',
        name: '📝 AI Script Creations',
        searchTerm: '',
        selectedFilter: 'all',
        filterMode: 'category',
        timePreset: 'all',
        customStartDate: '',
        customEndDate: '',
        selectedProjectId: 'all',
        selectedActionType: 'script',
        sortBy: 'date-desc',
        isDefault: true
      },
      {
        id: 'tpl-recent',
        name: '⚡ Last 24 Hours Activity',
        searchTerm: '',
        selectedFilter: 'all',
        filterMode: 'category',
        timePreset: '24h',
        customStartDate: '',
        customEndDate: '',
        selectedProjectId: 'all',
        selectedActionType: 'all',
        sortBy: 'date-desc',
        isDefault: true
      },
      {
        id: 'tpl-billing',
        name: '💳 Stripe & Billing Traces',
        searchTerm: 'stripe',
        selectedFilter: 'all',
        filterMode: 'category',
        timePreset: 'all',
        customStartDate: '',
        customEndDate: '',
        selectedProjectId: 'all',
        selectedActionType: 'all',
        sortBy: 'date-desc',
        isDefault: true
      }
    ];
  });
  const [newTemplateName, setNewTemplateName] = useState('');
  const [isSavingTemplate, setIsSavingTemplate] = useState(false);
  const [isPushingToSheets, setIsPushingToSheets] = useState(false);
  const [createdSheetUrl, setCreatedSheetUrl] = useState<string | null>(null);
  const [logs, setLogs] = useState<ActivityItem[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedFilter, setSelectedFilter] = useState<string>('all');
  const [filterMode, setFilterMode] = useState<'category' | 'type'>('category');
  const [selectedLog, setSelectedLog] = useState<ActivityItem | null>(null);
  const [isConfirmClearOpen, setIsConfirmClearOpen] = useState(false);
  const [viewMode, setViewMode] = useState<'timeline' | 'table'>('timeline');

  // New States for requested features
  const [isGroupedByRepetitive, setIsGroupedByRepetitive] = useState(false);
  const [expandedGroupIds, setExpandedGroupIds] = useState<Set<string>>(new Set());
  const [isDiffModalOpen, setIsDiffModalOpen] = useState(false);
  const [diffLogA, setDiffLogA] = useState<ActivityItem | null>(null);
  const [diffLogB, setDiffLogB] = useState<ActivityItem | null>(null);

  // Custom timeline filters
  const [timePreset, setTimePreset] = useState<'all' | '24h' | '7d' | '30d' | 'custom'>('all');
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');

  // Dropdown filter & sorting states
  const [selectedProjectId, setSelectedProjectId] = useState<string>('all');
  const [selectedActionType, setSelectedActionType] = useState<string>('all');
  const [sortBy, setSortBy] = useState<string>('date-desc');

  // Batch selection state
  const [selectedLogIds, setSelectedLogIds] = useState<Set<string>>(new Set());

  // Projects context
  const projectContext = useProject();
  const projects = projectContext?.projects || [];

  // CSV upload and merge states
  const [isImportOpen, setIsImportOpen] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [parsedItems, setParsedItems] = useState<ActivityItem[]>([]);
  const [uploadFileName, setUploadFileName] = useState('');
  const [uploadError, setUploadError] = useState('');

  // Auto-Purge state
  const [autoPurgeEnabled, setAutoPurgeEnabled] = useState(() => localStorage.getItem('ranktica_autopurge_90') === 'true');

  // Productivity Summary Modal state
  const [isProductivityModalOpen, setIsProductivityModalOpen] = useState(false);

  // CSV line parser supporting double quote escaping
  const parseCSVLine = (line: string): string[] => {
    const result: string[] = [];
    let current = '';
    let inQuotes = false;
    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      if (char === '"') {
        if (inQuotes && line[i + 1] === '"') {
          current += '"';
          i++;
        } else {
          inQuotes = !inQuotes;
        }
      } else if (char === ',' && !inQuotes) {
        result.push(current);
        current = '';
      } else {
        current += char;
      }
    }
    result.push(current);
    return result;
  };

  // Main parser function to map CSV to ActivityItem records
  const parseCSV = (text: string): Partial<ActivityItem>[] => {
    const lines = text.split(/\r?\n/);
    if (lines.length < 2) return [];
    
    const headerLine = lines[0];
    const headers = parseCSVLine(headerLine).map(h => h.trim().toLowerCase());
    
    const idIdx = headers.findIndex(h => h.includes('id'));
    const toolIdx = headers.findIndex(h => h.includes('tool') || h.includes('creator'));
    const actionIdx = headers.findIndex(h => h.includes('action') || h.includes('detail'));
    const categoryIdx = headers.findIndex(h => h.includes('category') || h.includes('tag'));
    const typeIdx = headers.findIndex(h => h.includes('type') || h.includes('internal'));
    const timeIdx = headers.findIndex(h => h.includes('time') || h.includes('stamp'));

    const results: Partial<ActivityItem>[] = [];

    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;
      const cols = parseCSVLine(line);
      if (cols.length === 0) continue;

      let id = idIdx !== -1 ? cols[idIdx]?.trim() : '';
      let tool = toolIdx !== -1 ? cols[toolIdx]?.trim() : '';
      let action = actionIdx !== -1 ? cols[actionIdx]?.trim() : '';
      let category = categoryIdx !== -1 ? cols[categoryIdx]?.trim() : '';
      let type = typeIdx !== -1 ? cols[typeIdx]?.trim() : '';
      let time = timeIdx !== -1 ? cols[timeIdx]?.trim() : '';

      const cleanQuote = (str: string) => {
        let val = str || '';
        if (val.startsWith('"') && val.endsWith('"')) {
          val = val.slice(1, -1);
        }
        return val.replace(/""/g, '"').trim();
      };

      id = cleanQuote(id);
      tool = cleanQuote(tool);
      action = cleanQuote(action);
      category = cleanQuote(category);
      type = cleanQuote(type);
      time = cleanQuote(time);

      if (!action && !tool) continue;

      let timestamp = Date.now();
      if (id && /^\d+-\d+$/.test(id)) {
        const parts = id.split('-');
        const ts = parseInt(parts[0], 10);
        if (!isNaN(ts)) {
          timestamp = ts;
        }
      } else if (time) {
        const parsedTime = Date.parse(time);
        if (!isNaN(parsedTime)) {
          timestamp = parsedTime;
        }
      }

      results.push({
        id: id || `${timestamp}-${Math.floor(Math.random() * 1000)}`,
        action: action || 'Uploaded offline event',
        tool: tool || 'Imported File',
        category: category || getCategoryFromTypeAndTool(type, tool),
        type: type || 'imported',
        time: time || 'Just now',
        timestamp
      });
    }

    return results;
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0]);
    }
  };

  const handleFile = (file: File) => {
    if (!file.name.endsWith('.csv')) {
      setUploadError('Only standard CSV activity logs files (.csv) are supported.');
      toast.error('Invalid file format. Please upload a CSV file.');
      return;
    }

    setUploadFileName(file.name);
    setUploadError('');

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target?.result as string;
        if (!text) {
          throw new Error('File content is empty.');
        }
        
        const parsed = parseCSV(text);
        if (parsed.length === 0) {
          throw new Error('No valid activity records found in CSV file. Check headers.');
        }

        setParsedItems(parsed as ActivityItem[]);
        toast.success(`Successfully parsed ${parsed.length} activities from ${file.name}! 📑`);
      } catch (err: any) {
        console.error(err);
        setUploadError(err.message || 'Failed to parse the selected CSV file.');
        setParsedItems([]);
      }
    };
    reader.onerror = () => {
      setUploadError('Error reading the selected CSV file.');
      toast.error('File reading error.');
    };
    reader.readAsText(file);
  };

  const handleMergeLogs = () => {
    if (parsedItems.length === 0) {
      toast.error('No parsed logs to merge.');
      return;
    }

    try {
      const currentLogs = getActivities();
      const currentIds = new Set(currentLogs.map(l => l.id));
      
      let newCount = 0;
      let duplicateCount = 0;
      const mergedList = [...currentLogs];

      parsedItems.forEach(item => {
        if (currentIds.has(item.id)) {
          duplicateCount++;
          const idx = mergedList.findIndex(l => l.id === item.id);
          if (idx !== -1) {
            mergedList[idx] = item;
          }
        } else {
          newCount++;
          mergedList.push(item);
        }
      });

      mergedList.sort((a, b) => b.timestamp - a.timestamp);
      const finalLogs = mergedList.slice(0, 200);

      localStorage.setItem('ranktica_activities', JSON.stringify(finalLogs));
      loadLogs();

      setParsedItems([]);
      setUploadFileName('');
      setIsImportOpen(false);

      if (duplicateCount > 0) {
        toast.success(`Successfully merged ${newCount} new activities and updated ${duplicateCount} duplicates! 🔄`);
      } else {
        toast.success(`Successfully merged all ${newCount} activities into the production ledger! 🚀`);
      }
    } catch (e) {
      console.error(e);
      toast.error('Failed to merge historical logs into current ledger.');
    }
  };

  // Automatically purge logs older than 90 days
  const checkAndPurgeOldLogs = (currentLogs: ActivityItem[]) => {
    const isPurgeEnabled = localStorage.getItem('ranktica_autopurge_90') === 'true';
    if (!isPurgeEnabled) return currentLogs;
    
    const ninetyDaysAgo = Date.now() - (90 * 24 * 60 * 60 * 1000);
    const validLogs = currentLogs.filter(log => log.timestamp >= ninetyDaysAgo);
    const purgedCount = currentLogs.length - validLogs.length;
    
    if (purgedCount > 0) {
      localStorage.setItem('ranktica_activities', JSON.stringify(validLogs));
      toast.success(`Automatically purged ${purgedCount} log entries older than 90 days to maintain workspace performance. 🧹`, { id: 'purge-toast' });
      return validLogs;
    }
    return currentLogs;
  };

  const handleToggleAutoPurge = (enabled: boolean) => {
    setAutoPurgeEnabled(enabled);
    localStorage.setItem('ranktica_autopurge_90', enabled ? 'true' : 'false');
    if (enabled) {
      toast.success('90-day automatic log purging enabled.');
      // Run immediate purge when toggled on
      try {
        const currentLogs = getActivities();
        const ninetyDaysAgo = Date.now() - (90 * 24 * 60 * 60 * 1000);
        const validLogs = currentLogs.filter(log => log.timestamp >= ninetyDaysAgo);
        const purgedCount = currentLogs.length - validLogs.length;
        if (purgedCount > 0) {
          localStorage.setItem('ranktica_activities', JSON.stringify(validLogs));
          setLogs(validLogs);
          toast.success(`Purged ${purgedCount} log entries older than 90 days! 🧹`);
        } else {
          toast.success('Active log database is already clean! No logs older than 90 days found.');
        }
      } catch (err) {
        console.error(err);
      }
    } else {
      toast.success('90-day automatic log purging disabled.');
    }
  };

  // Load activities from localStorage activityLogger state
  const loadLogs = () => {
    try {
      let currentLogs = getActivities();
      currentLogs = checkAndPurgeOldLogs(currentLogs);
      setLogs(currentLogs);
    } catch (e) {
      console.error('Failed to load logs', e);
      toast.error('Could not load current activity ledger.');
    }
  };

  useEffect(() => {
    loadLogs();
    const interval = setInterval(loadLogs, 4000);
    return () => clearInterval(interval);
  }, []);

  // Filter logs based on search, selected filter (category or type), timeline date ranges, project, action/technical type and sort
  const filteredLogs = useMemo(() => {
    const filtered = logs.filter(log => {
      const category = log.category || getCategoryFromTypeAndTool(log.type, log.tool);
      const matchesSearch = 
        log.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.tool.toLowerCase().includes(searchTerm.toLowerCase()) || 
        (log.type || 'system').toLowerCase().includes(searchTerm.toLowerCase()) ||
        category.toLowerCase().includes(searchTerm.toLowerCase());
      
      let matchesFilter = selectedFilter === 'all';
      if (!matchesFilter) {
        if (filterMode === 'category') {
          matchesFilter = category.toLowerCase() === selectedFilter.toLowerCase();
        } else {
          matchesFilter = (log.type || 'general').toLowerCase() === selectedFilter.toLowerCase();
        }
      }

      // Action/Technical type filter
      const matchesActionType = selectedActionType === 'all' || (log.type || 'general').toLowerCase() === selectedActionType.toLowerCase();

      // Project ID filter
      let matchesProject = true;
      if (selectedProjectId !== 'all') {
        if (selectedProjectId === 'general') {
          matchesProject = !log.projectId;
        } else {
          const proj = projects.find(p => p.id === selectedProjectId);
          matchesProject = log.projectId === selectedProjectId || 
            !!(proj && log.action.toLowerCase().includes(proj.title.toLowerCase()));
        }
      }

      // Date Range filter processing
      let matchesTime = true;
      const now = Date.now();
      const logTs = log.timestamp || now;
      
      if (timePreset === '24h') {
        matchesTime = logTs >= now - 24 * 60 * 60 * 1000;
      } else if (timePreset === '7d') {
        matchesTime = logTs >= now - 7 * 24 * 60 * 60 * 1000;
      } else if (timePreset === '30d') {
        matchesTime = logTs >= now - 30 * 24 * 60 * 60 * 1000;
      } else if (timePreset === 'custom') {
        if (customStartDate) {
          const startMs = new Date(customStartDate + 'T00:00:00').getTime();
          if (!isNaN(startMs) && logTs < startMs) {
            matchesTime = false;
          }
        }
        if (customEndDate) {
          const endMs = new Date(customEndDate + 'T23:59:59').getTime();
          if (!isNaN(endMs) && logTs > endMs) {
            matchesTime = false;
          }
        }
      }

      return matchesSearch && matchesFilter && matchesTime && matchesActionType && matchesProject;
    });

    // Sort the filtered logs
    return [...filtered].sort((a, b) => {
      if (sortBy === 'date-desc') {
        return b.timestamp - a.timestamp;
      } else if (sortBy === 'date-asc') {
        return a.timestamp - b.timestamp;
      } else if (sortBy === 'action-asc') {
        return a.action.localeCompare(b.action);
      } else if (sortBy === 'action-desc') {
        return b.action.localeCompare(a.action);
      } else if (sortBy === 'type-asc') {
        return (a.type || '').localeCompare(b.type || '');
      } else if (sortBy === 'type-desc') {
        return (b.type || '').localeCompare(a.type || '');
      }
      return b.timestamp - a.timestamp;
    });
  }, [logs, searchTerm, selectedFilter, filterMode, timePreset, customStartDate, customEndDate, selectedActionType, selectedProjectId, sortBy, projects]);

  // Unique categories of logs
  const categoriesList = useMemo(() => {
    const cats = new Set<string>();
    cats.add('all');
    logs.forEach(log => {
      const cat = log.category || getCategoryFromTypeAndTool(log.type, log.tool);
      cats.add(cat);
    });
    // Ensure the core standard categories are represented if not empty
    ['Automation', 'Billing', 'User', 'System'].forEach(c => {
      if (logs.length > 0) cats.add(c);
    });
    return Array.from(cats);
  }, [logs]);

  // Unique technical sub-types of logs
  const typesList = useMemo(() => {
    const types = new Set<string>();
    types.add('all');
    logs.forEach(log => {
      if (log.type) types.add(log.type);
    });
    return Array.from(types);
  }, [logs]);

  // Process logs to count operations per day for the last 30 days
  const last30DaysData = useMemo(() => {
    const data: { date: string; displayDate: string; count: number }[] = [];
    const now = new Date();
    for (let i = 29; i >= 0; i--) {
      const d = new Date();
      d.setDate(now.getDate() - i);
      const dateString = d.toISOString().split('T')[0];
      const displayDate = d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
      data.push({
        date: dateString,
        displayDate,
        count: 0
      });
    }

    logs.forEach(log => {
      if (log.timestamp) {
        const logDate = new Date(log.timestamp).toISOString().split('T')[0];
        const entry = data.find(item => item.date === logDate);
        if (entry) {
          entry.count += 1;
        }
      }
    });

    return data;
  }, [logs]);

  // Quick Stats calculator (Today's active metrics)
  const quickStats = useMemo(() => {
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const todayStartMs = todayStart.getTime();
    
    const todayLogs = logs.filter(log => (log.timestamp || 0) >= todayStartMs);
    
    // 1. Daily active projects
    const activeProjectsSet = new Set<string>();
    todayLogs.forEach(log => {
      if (log.projectId) {
        const proj = projects.find(p => p.id === log.projectId);
        activeProjectsSet.add(proj ? proj.title : 'General Sandbox');
      } else {
        // Search if any project name is in the action
        let foundProj = false;
        projects.forEach(p => {
          if (log.action.toLowerCase().includes(p.title.toLowerCase())) {
            activeProjectsSet.add(p.title);
            foundProj = true;
          }
        });
        if (!foundProj) {
          activeProjectsSet.add('General Sandbox');
        }
      }
    });

    const activeProjectsCount = activeProjectsSet.size === 1 && activeProjectsSet.has('General Sandbox') && todayLogs.length === 0
      ? 0 
      : activeProjectsSet.size;

    // 2. Total actions today
    const totalActionsToday = todayLogs.length;

    // 3. Top-performing action types (frequencies of log.type)
    const typeFrequencies: Record<string, number> = {};
    const targetLogs = todayLogs.length > 0 ? todayLogs : logs; // Fallback to all logs if nothing today
    
    targetLogs.forEach(log => {
      const typeStr = log.type || 'system';
      typeFrequencies[typeStr] = (typeFrequencies[typeStr] || 0) + 1;
    });

    let topType = 'None';
    let topTypeCount = 0;
    Object.entries(typeFrequencies).forEach(([type, count]) => {
      if (count > topTypeCount) {
        topTypeCount = count;
        topType = type;
      }
    });

    return {
      activeProjectsCount,
      activeProjectsList: Array.from(activeProjectsSet),
      totalActionsToday,
      topType: topType !== 'None' ? `${topType.toUpperCase()} (${topTypeCount})` : 'N/A'
    };
  }, [logs, projects]);

  // Anomalous activity statistical pattern detector
  const anomalousLogsMap = useMemo(() => {
    const flags: Record<string, { reason: string; level: 'warning' | 'critical' }> = {};
    if (logs.length === 0) return flags;

    // 1. Rapid-fire sequence detection (consecutive logs within 5 seconds of each other)
    // Sort chronologically to analyze spacing
    const chronoLogs = [...logs].sort((a, b) => (a.timestamp || 0) - (b.timestamp || 0));
    
    for (let i = 0; i < chronoLogs.length; i++) {
      const curr = chronoLogs[i];
      const prev = i > 0 ? chronoLogs[i - 1] : null;
      const next = i < chronoLogs.length - 1 ? chronoLogs[i + 1] : null;

      const currTs = curr.timestamp || 0;
      const prevTs = prev ? (prev.timestamp || 0) : 0;
      const nextTs = next ? (next.timestamp || 0) : 0;

      if (prev && currTs - prevTs > 0 && currTs - prevTs <= 5000) {
        const diffSecs = ((currTs - prevTs) / 1000).toFixed(1);
        flags[curr.id] = {
          reason: `Rapid-fire action sequence: triggered within ${diffSecs}s of preceding operation.`,
          level: 'critical'
        };
      } else if (next && nextTs - currTs > 0 && nextTs - currTs <= 5000) {
        const diffSecs = ((nextTs - currTs) / 1000).toFixed(1);
        flags[curr.id] = {
          reason: `Rapid-fire action sequence: triggered within ${diffSecs}s of subsequent operation.`,
          level: 'critical'
        };
      }
    }

    // 2. High-volume cluster/spike detection (> 10 actions within any rolling 1-minute window)
    chronoLogs.forEach(log => {
      const logTs = log.timestamp || 0;
      const windowLogs = chronoLogs.filter(other => {
        const otherTs = other.timestamp || 0;
        return otherTs >= logTs && otherTs < logTs + 60000;
      });

      if (windowLogs.length >= 10) {
        windowLogs.forEach(wLog => {
          if (!flags[wLog.id]) {
            flags[wLog.id] = {
              reason: `High-frequency spike detected: part of a burst of ${windowLogs.length} actions in 60 seconds.`,
              level: 'warning'
            };
          }
        });
      }
    });

    return flags;
  }, [logs]);

  // Group consecutive identical operations (repetitive tools/actions) when 'Group By' toggle is on
  const processedLogs = useMemo(() => {
    if (!isGroupedByRepetitive) {
      return filteredLogs.map(log => ({
        id: log.id,
        isGroup: false,
        mainLog: log,
        subLogs: [] as ActivityItem[]
      }));
    }

    const groups: { id: string; isGroup: boolean; mainLog: ActivityItem; subLogs: ActivityItem[] }[] = [];
    
    filteredLogs.forEach(log => {
      if (groups.length === 0) {
        groups.push({ id: log.id, isGroup: false, mainLog: log, subLogs: [] });
      } else {
        const lastGroup = groups[groups.length - 1];
        
        // Define repetitive signature: same tool and same internal action type or same project
        const isRepetitive = 
          lastGroup.mainLog.tool === log.tool && 
          (lastGroup.mainLog.type === log.type || lastGroup.mainLog.projectId === log.projectId);
        
        if (isRepetitive) {
          lastGroup.isGroup = true;
          lastGroup.subLogs.push(log);
        } else {
          groups.push({ id: log.id, isGroup: false, mainLog: log, subLogs: [] });
        }
      }
    });

    return groups;
  }, [filteredLogs, isGroupedByRepetitive]);

  // Hourly Peak activity heatmap over the last week (7 days)
  const heatmapData = useMemo(() => {
    const days: { date: Date; dateStr: string; label: string; hours: number[] }[] = [];
    const now = new Date();
    
    // Last 7 days, ending today
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(now.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];
      const label = d.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' });
      days.push({
        date: d,
        dateStr,
        label,
        hours: Array(24).fill(0)
      });
    }

    logs.forEach(log => {
      if (log.timestamp) {
        const logDate = new Date(log.timestamp);
        const logDateStr = logDate.toISOString().split('T')[0];
        const logHour = logDate.getHours();
        
        const dayEntry = days.find(d => d.dateStr === logDateStr);
        if (dayEntry) {
          dayEntry.hours[logHour] += 1;
        }
      }
    });

    let maxVal = 0;
    days.forEach(d => {
      d.hours.forEach(h => {
        if (h > maxVal) maxVal = h;
      });
    });

    return { days, maxVal };
  }, [logs]);

  // Generate weekly productivity insights summary report based on logged activities
  const weeklyProductivityReport = useMemo(() => {
    const sevenDaysAgo = Date.now() - (7 * 24 * 60 * 60 * 1000);
    const past7DaysLogs = logs.filter(log => log.timestamp >= sevenDaysAgo);
    const totalActions = past7DaysLogs.length;

    const dayCounts: Record<string, number> = {
      'Sunday': 0, 'Monday': 0, 'Tuesday': 0, 'Wednesday': 0, 'Thursday': 0, 'Friday': 0, 'Saturday': 0
    };
    
    let morning = 0;   // 5 AM - 12 PM
    let afternoon = 0; // 12 PM - 5 PM
    let evening = 0;   // 5 PM - 10 PM
    let night = 0;     // 10 PM - 5 AM

    const categories: Record<string, number> = {};
    const toolCounts: Record<string, number> = {};

    past7DaysLogs.forEach(log => {
      if (log.timestamp) {
        const date = new Date(log.timestamp);
        const dayName = date.toLocaleDateString(undefined, { weekday: 'long' });
        if (dayName in dayCounts) {
          dayCounts[dayName]++;
        }

        const hr = date.getHours();
        if (hr >= 5 && hr < 12) morning++;
        else if (hr >= 12 && hr < 17) afternoon++;
        else if (hr >= 17 && hr < 22) evening++;
        else night++;

        const cat = log.category || getCategoryFromTypeAndTool(log.type, log.tool);
        categories[cat] = (categories[cat] || 0) + 1;

        const tool = log.tool || 'System';
        toolCounts[tool] = (toolCounts[tool] || 0) + 1;
      }
    });

    let topDay = 'No Activity';
    let maxDayCount = 0;
    Object.entries(dayCounts).forEach(([day, count]) => {
      if (count > maxDayCount) {
        maxDayCount = count;
        topDay = day;
      }
    });

    let peakSlot = 'Late Night (10 PM - 5 AM)';
    let maxSlotCount = night;
    if (morning > maxSlotCount) {
      maxSlotCount = morning;
      peakSlot = 'Morning (5 AM - 12 PM)';
    }
    if (afternoon > maxSlotCount) {
      maxSlotCount = afternoon;
      peakSlot = 'Afternoon (12 PM - 5 PM)';
    }
    if (evening > maxSlotCount) {
      maxSlotCount = evening;
      peakSlot = 'Evening (5 PM - 10 PM)';
    }

    let topTool = 'None';
    let maxToolCount = 0;
    Object.entries(toolCounts).forEach(([tool, count]) => {
      if (count > maxToolCount) {
        maxToolCount = count;
        topTool = tool;
      }
    });

    const automationCount = categories['Automation'] || 0;
    const automationRate = totalActions > 0 ? Math.round((automationCount / totalActions) * 100) : 0;
    
    const distinctTools = Object.keys(toolCounts).length;
    let score = Math.min(100, Math.round((totalActions * 2.5) + (distinctTools * 6) + (automationRate * 0.3)));
    if (totalActions === 0) score = 0;

    let persona = 'Pragmatic Workspace Administrator';
    let workflowNarrative = 'You have a highly structured and steady development pattern, with system events and manual workflows nicely balanced.';
    let recommendations: string[] = [
      'Encourage workflow automations by linking more templates to automated dispatch triggers.',
      'Schedule heavier content production runs during off-peak evening hours.'
    ];

    if (automationRate > 40) {
      persona = 'High-Velocity Automation Engineer';
      workflowNarrative = 'You are a power administrator utilizing background queues, auto-triggering tasks, and system pipelines to amplify your output.';
      recommendations = [
        'Excellent job delegating manual actions to background jobs. Maintain server health constraints on port 3000.',
        'Consider setting up webhooks to track batch exports directly inside external notification targets.'
      ];
    } else if (distinctTools > 3) {
      persona = 'Omni-Channel Content Creator';
      workflowNarrative = 'Your activity shows high diversity, bouncing smoothly between Scriptwriting, SEO Optimizer, Thumbnail Generation, and Video Studio.';
      recommendations = [
        'Maintain modular project folders in your Workspace to keep asset versions consolidated.',
        'Use the template injector tool more often to reuse scripting matrices rather than building from scratch.'
      ];
    } else if (night > totalActions * 0.4 && totalActions > 0) {
      persona = 'Sovereign Midnight Creative';
      workflowNarrative = 'Your productivity flourishes in the calm silence of the late night hours, executing video syntheses and scripts when system loads are clear.';
      recommendations = [
        'Utilize Eco-Saver video exports during night rendering cycles to conserve system heat indices.',
        'Set up automated task scheduling to resume unfinished drafts at your next active window.'
      ];
    }

    return {
      totalActions,
      dayCounts,
      peakSlot,
      topDay,
      topTool,
      automationRate,
      score,
      persona,
      workflowNarrative,
      recommendations
    };
  }, [logs]);

  // Calculate statistics for metrics cards
  const stats = useMemo(() => {
    const total = logs.length;
    
    // Most active tool
    const toolCounts: Record<string, number> = {};
    let highestTool = 'None';
    let maxToolCount = 0;
    
    // Category distribution counts
    const categoryDistribution: Record<string, number> = {
      'Automation': 0,
      'Billing': 0,
      'User': 0,
      'System': 0
    };
    
    logs.forEach(log => {
      const tool = log.tool || 'System';
      toolCounts[tool] = (toolCounts[tool] || 0) + 1;
      if (toolCounts[tool] > maxToolCount) {
        maxToolCount = toolCounts[tool];
        highestTool = tool;
      }
      
      const category = log.category || getCategoryFromTypeAndTool(log.type, log.tool);
      categoryDistribution[category] = (categoryDistribution[category] || 0) + 1;
    });

    return {
      total,
      highestTool,
      highestToolCount: maxToolCount,
      categoryDistribution,
    };
  }, [logs]);

  // Inject a high-quality mockup activity log action
  const handleInjectMockLog = () => {
    const actions = [
      { action: 'Executed deep semantic cluster mapping on legal tech keyword variants', tool: 'SEO Optimizer', type: 'seo', category: 'Automation' },
      { action: 'Synthesized cinematic cyberpunk thumbnail featuring orange glow accents', tool: 'Thumbnail Studio', type: 'thumbnail', category: 'User' },
      { action: 'Calculated SWOT competition matrices for local AI automation firms', tool: 'Competitor Spy', type: 'competitor', category: 'User' },
      { action: 'Drafted 10-minute long-form explanatory voice narration outline', tool: 'Scripting Core', type: 'script', category: 'User' },
      { action: 'Synchronized workspace state telemetry safely with secure cloud endpoint', tool: 'System Pipeline', type: 'system', category: 'System' },
      { action: 'Initiated daily collaborative creative check-in and advanced streak to 12 days', tool: 'Creator Command', type: 'checkin', category: 'User' },
      { action: 'Booted autonomous multi-agent queue dispatcher on listening port 3000', tool: 'AgentBus Orchestrator', type: 'system', category: 'Automation' },
      { action: 'Run A/B split-tester model of thumbnail candidates with 94.6% confidence interval', tool: 'A/B Split Tester', type: 'ab_testing', category: 'Automation' },
      { action: 'Invoiced client subscription tier adjustments for renewal transition', tool: 'Stripe Billing System', type: 'billing', category: 'Billing' },
      { action: 'Ingested Stripe checkout session webhook event for premium user authorization', tool: 'Webhook Dispatcher', type: 'stripe_webhooks', category: 'Billing' }
    ];

    const randomAction = actions[Math.floor(Math.random() * actions.length)];
    
    // Support testing filters by injecting across varied date metrics (just now, yesterday, last 5 days, last 12 days, last 25 days)
    const offsets = [
      0, // just now
      10 * 60 * 60 * 1000, // 10 hours ago
      32 * 60 * 60 * 1000, // yesterday
      4 * 24 * 60 * 60 * 1000, // 4 days ago
      9 * 24 * 60 * 60 * 1000, // 9 days ago
      15 * 24 * 60 * 60 * 1000, // 15 days ago
      28 * 24 * 60 * 60 * 1000 // 28 days ago
    ];
    const randomOffset = offsets[Math.floor(Math.random() * offsets.length)];
    const customTs = Date.now() - randomOffset;

    logActivity(randomAction.action, randomAction.tool, randomAction.type, randomAction.category, customTs);
    loadLogs();

    let offsetText = 'just now';
    if (randomOffset > 0) {
      const days = Math.round(randomOffset / (24 * 60 * 60 * 1000));
      offsetText = days > 0 ? `${days} day${days > 1 ? 's' : ''} ago` : 'hours ago';
    }
    toast.success(`Injected simulated log item (${offsetText}) into ${randomAction.tool}!`);
  };

  // Batch selection handlers
  const handleToggleSelectLog = (id: string, e: React.MouseEvent | React.ChangeEvent) => {
    e.stopPropagation();
    const next = new Set(selectedLogIds);
    if (next.has(id)) {
      next.delete(id);
    } else {
      next.add(id);
    }
    setSelectedLogIds(next);
  };

  const isAllSelected = useMemo(() => {
    return filteredLogs.length > 0 && filteredLogs.every(log => selectedLogIds.has(log.id));
  }, [filteredLogs, selectedLogIds]);

  const handleToggleSelectAll = () => {
    if (isAllSelected) {
      const next = new Set(selectedLogIds);
      filteredLogs.forEach(log => next.delete(log.id));
      setSelectedLogIds(next);
    } else {
      const next = new Set(selectedLogIds);
      filteredLogs.forEach(log => next.add(log.id));
      setSelectedLogIds(next);
    }
  };

  const handleDeleteSelectedLogs = () => {
    if (selectedLogIds.size === 0) return;
    const count = selectedLogIds.size;
    if (window.confirm(`Are you sure you want to permanently delete these ${count} selected activity logs? This action is irreversible.`)) {
      try {
        const saved = localStorage.getItem('ranktica_activities');
        const activities: ActivityItem[] = saved ? JSON.parse(saved) : [];
        const updated = activities.filter(log => !selectedLogIds.has(log.id));
        localStorage.setItem('ranktica_activities', JSON.stringify(updated));
        
        setSelectedLogIds(new Set());
        loadLogs();
        toast.success(`Permanently deleted ${count} selected activity logs! 🧹`);
      } catch (err) {
        console.error(err);
        toast.error('Failed to permanently delete selected activity logs.');
      }
    }
  };

  // Erase all logs in sandbox with double confirmation
  const handleClearAllLogs = () => {
    try {
      localStorage.removeItem('ranktica_activities');
      // Record a final log confirming we cleared the log system
      logActivity('Executed sessions ledger flush and wiped historic workflow logs.', 'Audit Systems', 'system', 'System');
      loadLogs();
      setIsConfirmClearOpen(false);
      setSelectedLog(null);
      toast.success('Successfully cleared workflow activity audits!');
    } catch (e) {
      console.error(e);
      toast.error('Ledger flush option failed.');
    }
  };

  // Export logs as CSV spreadsheet
  const handleExportCSV = () => {
    if (filteredLogs.length === 0) {
      toast.error('No qualified operations to export from the active view.');
      return;
    }
    const headers = ['ID', 'Creator Tool', 'Action Details', 'Category Tagging', 'Internal Type', 'Time Stamp'];
    const rows = filteredLogs.map(log => [
      log.id || '',
      `"${(log.tool || '').replace(/"/g, '""')}"`,
      `"${(log.action || '').replace(/"/g, '""')}"`,
      `"${(log.category || getCategoryFromTypeAndTool(log.type, log.tool)).replace(/"/g, '""')}"`,
      `"${(log.type || 'system').replace(/"/g, '""')}"`,
      `"${(log.time || '').replace(/"/g, '""')}"`
    ]);
    const csvContent = [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `ranktica_activities_export_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    toast.success('Recent activities downloaded as CSV spreadsheet! 📊');
  };

  // Export logs as clean printable audit layout
  const handlePrintAudit = () => {
    if (filteredLogs.length === 0) {
      toast.error('No activities found to export.');
      return;
    }
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      toast.error('Pop-up window blocked. Please permit pop-ups in your browser options.');
      return;
    }
    
    const rowsHtml = filteredLogs.map(log => {
      const category = log.category || getCategoryFromTypeAndTool(log.type, log.tool);
      return `
        <tr style="border-bottom: 1px solid #27272a;">
          <td style="padding: 14px 10px; font-size: 11px; font-weight: 700; color: #f4f4f5; text-transform: uppercase;">${log.tool || 'System'}</td>
          <td style="padding: 14px 10px; font-size: 11px; color: #d4d4d8; max-width: 320px;">${log.action || ''}</td>
          <td style="padding: 14px 10px; font-size: 10px; font-weight: 900; color: #ef4444; text-transform: uppercase; letter-spacing: 0.5px;">${category}</td>
          <td style="padding: 14px 10px; font-size: 10px; font-weight: 950; color: #a1a1aa; text-transform: uppercase;">${log.type || 'system'}</td>
          <td style="padding: 14px 10px; font-size: 10px; font-family: monospace; color: #71717a;">${log.time || ''}</td>
        </tr>
      `;
    }).join('');

    const htmlContent = `
      <html>
        <head>
          <title>Ranktica AI Studio - Detailed Workflow Audit Sheet</title>
          <style>
            @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;700;900&display=swap');
            body { font-family: 'Inter', sans-serif; padding: 40px; color: #fafafa; margin: 0; background: #09090b; }
            .header-box { display: flex; justify-content: space-between; align-items: center; border-bottom: 3px solid #ef4444; padding-bottom: 24px; margin-bottom: 30px; }
            h1 { margin: 0; font-size: 26px; font-weight: 900; text-transform: uppercase; letter-spacing: -1px; color: #ffffff; }
            .sub-title { margin: 5px 0 0 0; font-size: 11px; font-weight: 900; color: #ef4444; letter-spacing: 1px; text-transform: uppercase; }
            .meta-info { font-size: 11px; color: #a1a1aa; line-height: 1.6; text-align: right; }
            table { width: 100%; border-collapse: collapse; background: #0f0f12; border-radius: 12px; overflow: hidden; border: 1px solid #27272a; }
            th { background: #18181b; color: #ffffff; text-align: left; padding: 14px 10px; font-size: 10px; font-weight: 900; text-transform: uppercase; letter-spacing: 0.8px; border-bottom: 1px solid #27272a; }
            .footer-line { margin-top: 60px; text-align: center; font-size: 10px; color: #71717a; border-top: 1px solid #27272a; padding-top: 24px; }
            @media print {
              body { padding: 20px; }
              table { border: 1px solid #27272a; }
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
              <div><strong>Total Operations Recorded:</strong> ${filteredLogs.length}</div>
              <div><strong>Fidelity level:</strong> SANDBOX AUTHENTICATED</div>
            </div>
          </div>
          <table>
            <thead>
              <tr>
                <th style="width: 20%">Creator Tool</th>
                <th style="width: 35%">Action Details</th>
                <th style="width: 15%">Category Tag</th>
                <th style="width: 15%">Technical Type</th>
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
    toast.success('Audit ledger printable report layout triggered! 🧾');
  };

  // Export logs as high-fidelity professional-looking activity PDF documentation
  const handleExportPDF = () => {
    if (filteredLogs.length === 0) {
      toast.error('No activities found in the active view to export.');
      return;
    }

    try {
      const doc = new jsPDF({
        orientation: 'p',
        unit: 'mm',
        format: 'a4'
      });

      // Colors
      const primaryColor = [239, 68, 68]; // Red: #ef4444
      const darkBg = [12, 12, 15]; // Zinc-950/Zinc-900 hybrid
      const textLight = [255, 255, 255];
      const textMuted = [113, 113, 122];

      // Title & Header Banner
      doc.setFillColor(12, 12, 15);
      doc.rect(0, 0, 210, 40, 'F');

      // Ranktica Logo Accent
      doc.setFillColor(239, 68, 68);
      doc.rect(15, 10, 4, 18, 'F');

      doc.setTextColor(255, 255, 255);
      doc.setFont('Helvetica', 'bold');
      doc.setFontSize(20);
      doc.text('RANKTICA AI CORPORATION', 24, 18);

      doc.setTextColor(239, 68, 68);
      doc.setFont('Helvetica', 'bold');
      doc.setFontSize(9);
      doc.text('ACTIVITY & WORKFLOW AUDIT LEDGER', 24, 25);

      // Metadata Info
      const docId = `RAC-${Math.floor(100000 + Math.random() * 900000)}`;
      const generatedAt = new Date().toLocaleString();
      const scopeVal = timePreset === 'all' ? 'FULL HISTORY' : timePreset.toUpperCase();

      doc.setTextColor(161, 161, 170);
      doc.setFont('Helvetica', 'normal');
      doc.setFontSize(8);
      doc.text(`Doc ID: ${docId}`, 145, 15);
      doc.text(`Generated At: ${generatedAt}`, 145, 20);
      doc.text(`Data Scope: ${scopeVal}`, 145, 25);

      // Red divider below header
      doc.setDrawColor(239, 68, 68);
      doc.setLineWidth(0.8);
      doc.line(15, 40, 195, 40);

      // Brief summary block
      doc.setFillColor(244, 244, 245);
      doc.rect(15, 46, 180, 14, 'F');
      doc.setTextColor(63, 63, 70);
      doc.setFont('Helvetica', 'normal');
      doc.setFontSize(8.5);
      doc.text('Official Record Brief: This workspace audit documentation provides a chronological ledger of system automation', 18, 51);
      doc.text('dispatches, user asset builds, and database sequences. Authenticated local sessions verify the sequence integrity.', 18, 55);

      // KPI Metrics Box
      // KPI 1
      doc.setFillColor(24, 24, 27);
      doc.rect(15, 65, 56, 18, 'F');
      doc.setTextColor(161, 161, 170);
      doc.setFontSize(7.5);
      doc.text('AUDIT COVERAGE', 18, 70);
      doc.setTextColor(255, 255, 255);
      doc.setFont('Helvetica', 'bold');
      doc.setFontSize(10.5);
      doc.text(`${filteredLogs.length} Operations`, 18, 77);

      // KPI 2
      doc.setFillColor(24, 24, 27);
      doc.rect(77, 65, 56, 18, 'F');
      doc.setTextColor(161, 161, 170);
      doc.setFont('Helvetica', 'normal');
      doc.setFontSize(7.5);
      doc.text('PRIMARY CORE UNIT', 80, 70);
      doc.setTextColor(239, 68, 68);
      doc.setFont('Helvetica', 'bold');
      doc.setFontSize(10.5);
      doc.text(`${stats.highestTool || 'Omni-Channel'}`, 80, 77);

      // KPI 3
      doc.setFillColor(24, 24, 27);
      doc.rect(139, 65, 56, 18, 'F');
      doc.setTextColor(161, 161, 170);
      doc.setFont('Helvetica', 'normal');
      doc.setFontSize(7.5);
      doc.text('FIDELITY STATUS', 142, 70);
      doc.setTextColor(255, 255, 255);
      doc.setFont('Helvetica', 'bold');
      doc.setFontSize(10.5);
      doc.text('100% Sandbox Local', 142, 77);

      // Table mapping
      const tableHeaders = [['Index', 'Creator Tool', 'Logged Operation Details', 'Category', 'Timestamp']];
      const tableData = filteredLogs.map((log, idx) => {
        const category = log.category || getCategoryFromTypeAndTool(log.type, log.tool);
        return [
          `#${idx + 1}`,
          log.tool || 'System',
          log.action || '',
          category,
          log.time || ''
        ];
      });

      // Render beautiful table
      autoTable(doc, {
        head: tableHeaders,
        body: tableData,
        startY: 90,
        margin: { left: 15, right: 15 },
        theme: 'grid',
        headStyles: {
          fillColor: [24, 24, 27],
          textColor: [255, 255, 255],
          fontStyle: 'bold',
          fontSize: 8.5,
          lineWidth: 0.1,
          lineColor: [63, 63, 70]
        },
        bodyStyles: {
          fontSize: 8,
          textColor: [39, 39, 42],
          lineWidth: 0.1,
          lineColor: [228, 228, 231]
        },
        alternateRowStyles: {
          fillColor: [250, 250, 250]
        },
        columnStyles: {
          0: { cellWidth: 15, fontStyle: 'bold' },
          1: { cellWidth: 35, fontStyle: 'bold' },
          2: { cellWidth: 70 },
          3: { cellWidth: 30 },
          4: { cellWidth: 30 }
        },
        didDrawPage: (data) => {
          // Footer on each page
          doc.setTextColor(113, 113, 122);
          doc.setFont('Helvetica', 'normal');
          doc.setFontSize(7.5);
          doc.text(`© ${new Date().getFullYear()} Ranktica AI Corporation. Confidential Workspace Audit Documentation.`, 15, doc.internal.pageSize.height - 10);
          doc.text(`Page ${data.pageNumber}`, 180, doc.internal.pageSize.height - 10);
        }
      });

      doc.save(`ranktica_audit_ledger_${Date.now()}.pdf`);
      toast.success('Professional PDF report successfully compiled and downloaded! 📥');
    } catch (err) {
      console.error('[PDF Export Error]', err);
      toast.error('Failed to export PDF report client-side.');
    }
  };

  // Template Library Actions
  const handleSaveTemplate = () => {
    if (!newTemplateName.trim()) {
      toast.error('Please enter a name for your template.');
      return;
    }
    const newTpl: LogTemplate = {
      id: 'tpl-' + Date.now(),
      name: newTemplateName.trim(),
      searchTerm,
      selectedFilter,
      filterMode,
      timePreset,
      customStartDate,
      customEndDate,
      selectedProjectId,
      selectedActionType,
      sortBy
    };
    const updated = [...templates, newTpl];
    setTemplates(updated);
    localStorage.setItem('ranktica_log_templates', JSON.stringify(updated));
    setNewTemplateName('');
    setIsSavingTemplate(false);
    toast.success(`Template "${newTpl.name}" saved successfully! 💾`);
  };

  const handleApplyTemplate = (tpl: LogTemplate) => {
    setSearchTerm(tpl.searchTerm);
    setSelectedFilter(tpl.selectedFilter);
    setFilterMode(tpl.filterMode);
    setTimePreset(tpl.timePreset);
    setCustomStartDate(tpl.customStartDate);
    setCustomEndDate(tpl.customEndDate);
    setSelectedProjectId(tpl.selectedProjectId);
    setSelectedActionType(tpl.selectedActionType);
    setSortBy(tpl.sortBy);
    toast.success(`Applied template: ${tpl.name} 🎯`);
  };

  const handleDeleteTemplate = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const updated = templates.filter(t => t.id !== id);
    setTemplates(updated);
    localStorage.setItem('ranktica_log_templates', JSON.stringify(updated));
    toast.success('Template removed from library.');
  };

  // Push filtered logs directly to Google Sheets
  const handlePushToGoogleSheets = async () => {
    if (filteredLogs.length === 0) {
      toast.error('No activities found in the active view to export.');
      return;
    }

    let token = googleToken;

    if (!token) {
      toast.error('Google Sheets integration requires Google Authentication.');
      try {
        await signInWithGoogle();
        toast.success('Google Authentication successful! Please click "Push to Google Sheets" again to finalize the export.');
        return;
      } catch (err: any) {
        console.error(err);
        toast.error(`Authentication failed: ${err.message || err}`);
        return;
      }
    }

    setIsPushingToSheets(true);
    const toastId = toast.loading('Initiating Google Sheets connection...');

    try {
      // 1. Create a Spreadsheet
      const title = `Ranktica AI Activity Logs - ${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString()}`;
      toast.loading('Creating fresh Google Sheet...', { id: toastId });
      
      const createResponse = await fetch('https://sheets.googleapis.com/v4/spreadsheets', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          properties: {
            title: title
          }
        })
      });

      if (!createResponse.ok) {
        const errText = await createResponse.text();
        if (createResponse.status === 401) {
          throw new Error('Google authorization has expired. Please sign in again.');
        }
        throw new Error(`Failed to create spreadsheet: ${errText}`);
      }

      const createData = await createResponse.json();
      const spreadsheetId = createData.spreadsheetId;
      const spreadsheetUrl = createData.spreadsheetUrl;

      // 2. Prepare the rows
      toast.loading('Writing activity ledger rows...', { id: toastId });
      
      const headers = ['ID', 'Creator Tool', 'Action Details', 'Category Tag', 'Technical Type', 'Observed Time'];
      const rows = filteredLogs.map(log => [
        log.id || '',
        log.tool || '',
        log.action || '',
        log.category || getCategoryFromTypeAndTool(log.type, log.tool),
        log.type || 'system',
        log.time || ''
      ]);

      const values = [headers, ...rows];

      // 3. Write data to Sheet1!A1
      const appendResponse = await fetch(
        `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/Sheet1!A1:append?valueInputOption=USER_ENTERED`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            range: 'Sheet1!A1',
            majorDimension: 'ROWS',
            values: values
          })
        }
      );

      if (!appendResponse.ok) {
        const errText = await appendResponse.text();
        throw new Error(`Failed to populate spreadsheet: ${errText}`);
      }

      setCreatedSheetUrl(spreadsheetUrl);
      toast.success(
        (t) => (
          <span className="flex flex-col gap-1.5 text-xs text-zinc-300">
            <span className="font-bold text-white">Successfully exported to Google Sheets! 📊</span>
            <a 
              href={spreadsheetUrl} 
              target="_blank" 
              rel="noopener noreferrer" 
              className="inline-flex items-center gap-1 font-extrabold text-red-400 hover:text-red-300 underline uppercase tracking-wider text-[10px]"
            >
              Open Google Sheet ↗
            </a>
          </span>
        ),
        { id: toastId, duration: 8000 }
      );
    } catch (error: any) {
      console.error('[Google Sheets Export Error]', error);
      toast.error(`Export failed: ${error.message || error}`, { id: toastId });
    } finally {
      setIsPushingToSheets(false);
    }
  };

  // Get color for category badges
  const getCategoryColorStyle = (category?: string) => {
    const cat = (category || 'User').toLowerCase();
    switch (cat) {
      case 'automation': 
        return {
          badge: 'border-orange-500/20 text-orange-400 bg-orange-950/20',
          dot: 'bg-orange-400',
          icon: <Settings size={11} className="text-orange-400 shrink-0" />
        };
      case 'billing': 
        return {
          badge: 'border-emerald-500/20 text-emerald-400 bg-emerald-950/20',
          dot: 'bg-emerald-400',
          icon: <DollarSign size={11} className="text-emerald-400 shrink-0" />
        };
      case 'system': 
        return {
          badge: 'border-rose-500/20 text-rose-400 bg-rose-950/20',
          dot: 'bg-rose-450',
          icon: <Cpu size={11} className="text-rose-400 shrink-0" />
        };
      case 'user': 
        return {
          badge: 'border-indigo-500/20 text-indigo-400 bg-indigo-950/20',
          dot: 'bg-indigo-400',
          icon: <User size={11} className="text-indigo-400 shrink-0" />
        };
      default: 
        return {
          badge: 'border-zinc-800 text-zinc-400 bg-zinc-950/40',
          dot: 'bg-zinc-500',
          icon: <Activity size={11} className="text-zinc-400 shrink-0" />
        };
    }
  };

  // Get color for type badges
  const getTypeColor = (type?: string) => {
    switch (type) {
      case 'ideas': return 'border-amber-900/60 text-amber-400 bg-amber-950/20';
      case 'thumbnail': return 'border-purple-900/60 text-purple-400 bg-purple-950/20';
      case 'seo': return 'border-blue-900/60 text-blue-400 bg-blue-950/20';
      case 'script': return 'border-emerald-950 text-emerald-400 bg-emerald-950/20';
      case 'checkin': return 'border-pink-900 text-pink-400 bg-pink-950/20';
      case 'competitor': return 'border-cyan-900 text-cyan-400 bg-cyan-950/20';
      default: return 'border-zinc-850 text-zinc-400 bg-zinc-950/40';
    }
  };

  return (
    <div className="space-y-6 pb-12 animate-fade-in relative">
      
      {/* HEADER BAR */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-zinc-900 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-xl bg-red-650/10 border border-red-500/20 flex items-center justify-center">
              <History size={16} className="text-red-500 animate-spin-slow" />
            </div>
            <div>
              <h1 className="text-xl font-black uppercase text-white tracking-tight flex items-center gap-2">
                Activity Audit Logs & Ledger
              </h1>
              <p className="text-[10px] uppercase font-mono text-zinc-500 mt-0.5 tracking-wider">
                Full-Fidelity Real-time Event Monitor & Local Workflow Verification Engine
              </p>
            </div>
          </div>
        </div>

        {/* TOP PANEL CONTROLS */}
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <button
            onClick={handleInjectMockLog}
            className="px-3.5 py-1.5 bg-red-950/30 border border-red-900/40 hover:bg-red-950/50 text-red-400 rounded-lg flex items-center gap-1.5 font-bold transition-all cursor-pointer"
            title="Inject real-life simulation activity data to audit logs"
          >
            <PlusCircle size={14} /> Simulate Action
          </button>

          <button
            onClick={() => setIsImportOpen(!isImportOpen)}
            className={`px-3.5 py-1.5 border rounded-lg flex items-center gap-1.5 font-bold transition-all cursor-pointer ${
              isImportOpen 
                ? 'bg-red-500 border-red-500 text-white shadow-md font-black' 
                : 'bg-zinc-900 border-zinc-800 hover:bg-zinc-850 hover:text-white text-zinc-350'
            }`}
            title="Upload and merge custom historical CSV activity logs"
          >
            <UploadCloud size={14} /> Merge CSV Logs
          </button>
          
          <button
            onClick={loadLogs}
            className="px-3.5 py-1.5 bg-zinc-900 border border-zinc-800 hover:bg-zinc-850 text-zinc-300 rounded-lg flex items-center gap-1.5 font-bold transition-all cursor-pointer"
            title="Force immediate activities refresh scan"
          >
            <RefreshCw size={13} className="hover:rotate-180 transition-all duration-500" /> Refresh
          </button>

          <button
            onClick={() => setIsConfirmClearOpen(true)}
            className="px-3.5 py-1.5 bg-zinc-900 border border-zinc-800 hover:bg-red-950/40 hover:border-red-900/40 hover:text-red-400 text-zinc-400 rounded-lg flex items-center gap-1.5 font-bold transition-all cursor-pointer"
            title="Flush entire sessions operations memory"
          >
            <Trash2 size={13} /> Flush Ledger
          </button>
        </div>
      </div>

      {/* QUICK STATS MINI-BAR */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Stat 1: Daily Active Projects */}
        <div className="bg-[#09090b]/90 border border-zinc-850 p-3.5 rounded-xl flex items-center justify-between text-left shadow-sm">
          <div className="space-y-1">
            <span className="block text-[8px] font-black text-zinc-500 uppercase tracking-widest">Active Projects Today</span>
            <span className="block text-base font-black text-white font-mono">
              {quickStats.activeProjectsCount} {quickStats.activeProjectsCount === 1 ? 'Project' : 'Projects'}
            </span>
            <span className="block text-[9px] text-zinc-400 font-semibold truncate max-w-[200px]" title={quickStats.activeProjectsList.join(', ')}>
              {quickStats.activeProjectsList.length > 0 
                ? quickStats.activeProjectsList.join(', ') 
                : 'No projects active today'}
            </span>
          </div>
          <div className="h-10 w-10 rounded-lg bg-red-950/20 border border-red-500/20 flex items-center justify-center shrink-0">
            <FolderOpen size={16} className="text-red-500" />
          </div>
        </div>

        {/* Stat 2: Total Actions Today */}
        <div className="bg-[#09090b]/90 border border-zinc-850 p-3.5 rounded-xl flex items-center justify-between text-left shadow-sm">
          <div className="space-y-1">
            <span className="block text-[8px] font-black text-zinc-500 uppercase tracking-widest">Operations Completed Today</span>
            <span className="block text-base font-black text-red-500 font-mono">
              {quickStats.totalActionsToday}
            </span>
            <span className="block text-[9px] text-zinc-400 font-semibold">
              Live workflow event executions
            </span>
          </div>
          <div className="h-10 w-10 rounded-lg bg-red-950/20 border border-red-500/20 flex items-center justify-center shrink-0">
            <Activity size={16} className="text-red-500" />
          </div>
        </div>

        {/* Stat 3: Top Performing Action Types */}
        <div className="bg-[#09090b]/90 border border-zinc-850 p-3.5 rounded-xl flex items-center justify-between text-left shadow-sm">
          <div className="space-y-1">
            <span className="block text-[8px] font-black text-zinc-500 uppercase tracking-widest">Top Active Classification</span>
            <span className="block text-xs font-black text-white uppercase font-mono mt-0.5 truncate max-w-[180px]" title={quickStats.topType}>
              {quickStats.topType}
            </span>
            <span className="block text-[9px] text-zinc-400 font-semibold">
              Most frequent category of operations
            </span>
          </div>
          <div className="h-10 w-10 rounded-lg bg-red-950/20 border border-red-500/20 flex items-center justify-center shrink-0">
            <Cpu size={16} className="text-red-500" />
          </div>
        </div>
      </div>

      {/* SYSTEM CONTROLS & AUTO-PURGE POLICY */}
      <div className="bg-[#0c0c0f]/80 border border-zinc-850 p-3.5 px-4 rounded-xl flex flex-col lg:flex-row lg:items-center justify-between gap-4 text-left">
        <div className="flex items-center gap-2.5">
          <div className="h-7 w-7 rounded bg-zinc-950 border border-zinc-900 flex items-center justify-center">
            <Settings size={13} className="text-red-500 animate-spin-slow" />
          </div>
          <div>
            <h3 className="text-xs font-black uppercase text-white tracking-wider flex items-center gap-1.5">
              Workspace Operations Policy
            </h3>
            <p className="text-[10px] font-medium text-zinc-500">
              Configure automated retention parameters and performance-enhancing workspace policies.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* GROUP BY REPETITIVE TOGGLE */}
          <div className="flex items-center gap-3 bg-black/40 border border-zinc-900 px-3 py-1.5 rounded-lg">
            <span className="text-[10px] font-bold text-zinc-400 flex items-center gap-1.5">
              <Layers size={12} className="text-zinc-500" /> Group Repetitive:
            </span>
            <label className="relative inline-flex items-center cursor-pointer select-none">
              <input
                type="checkbox"
                checked={isGroupedByRepetitive}
                onChange={(e) => {
                  setIsGroupedByRepetitive(e.target.checked);
                  setExpandedGroupIds(new Set()); // Reset on change
                  toast.success(e.target.checked 
                    ? 'Repetitive operations grouped into expandable summaries! 📁'
                    : 'Repetitive operations ungrouped to full granular view. 📄'
                  );
                }}
                className="sr-only peer"
              />
              <div className="w-8 h-4.5 bg-zinc-850 rounded-full peer peer-focus:outline-none relative after:content-[''] after:absolute after:top-[2.5px] after:left-[2px] after:bg-zinc-500 after:border-zinc-400 after:border after:rounded-full after:h-3.5 after:w-3.5 after:transition-all peer-checked:bg-red-600 peer-checked:after:bg-white peer-checked:after:translate-x-full" />
            </label>
            <span className={`text-[9px] font-black uppercase font-mono w-10 text-center ${isGroupedByRepetitive ? 'text-red-500' : 'text-zinc-600'}`}>
              {isGroupedByRepetitive ? 'ON' : 'OFF'}
            </span>
          </div>

          <div className="flex items-center gap-3 bg-black/40 border border-zinc-900 px-3 py-1.5 rounded-lg">
            <span className="text-[10px] font-bold text-zinc-400">90-Day Auto Purge:</span>
            <label className="relative inline-flex items-center cursor-pointer select-none">
              <input
                type="checkbox"
                checked={autoPurgeEnabled}
                onChange={(e) => handleToggleAutoPurge(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-8 h-4.5 bg-zinc-850 rounded-full peer peer-focus:outline-none relative after:content-[''] after:absolute after:top-[2.5px] after:left-[2px] after:bg-zinc-500 after:border-zinc-400 after:border after:rounded-full after:h-3.5 after:w-3.5 after:transition-all peer-checked:bg-red-600 peer-checked:after:bg-white peer-checked:after:translate-x-full" />
            </label>
            <span className={`text-[9px] font-black uppercase font-mono w-10 text-center ${autoPurgeEnabled ? 'text-red-500' : 'text-zinc-600'}`}>
              {autoPurgeEnabled ? 'ACTIVE' : 'OFF'}
            </span>
          </div>

          <button
            onClick={() => setIsProductivityModalOpen(true)}
            className="px-3.5 py-1.5 bg-gradient-to-r from-red-950/40 to-purple-950/40 hover:from-red-950/60 hover:to-purple-950/60 border border-red-900/55 hover:border-red-500/40 text-red-200 rounded-lg text-[10px] font-black uppercase tracking-wider flex items-center gap-1.5 cursor-pointer transition-all shadow-sm"
          >
            <Award size={13} className="text-red-500" /> Weekly AI Insights
          </button>
        </div>
      </div>

      {/* BENCHMARK STATS GRID */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Metric 1 */}
        <div className="bg-[#0c0c0f] border border-zinc-850 p-4 rounded-xl flex items-center justify-between relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-20 h-20 bg-red-650/5 rounded-full blur-2xl group-hover:bg-red-650/15 transition-all pointer-events-none" />
          <div className="space-y-1.5 z-10 text-left">
            <span className="block text-[8px] font-black uppercase text-zinc-500 tracking-widest leading-none">TOTAL OPERATIONS LOAD</span>
            <span className="block text-2xl font-black text-white font-mono">{stats.total}</span>
            <span className="block text-[8.5px] font-semibold text-zinc-600 italic">Across active sandbox session</span>
          </div>
          <div className="h-9 w-9 rounded-lg bg-zinc-950/70 border border-zinc-900 flex items-center justify-center shrink-0">
            <Cpu size={16} className="text-zinc-500" />
          </div>
        </div>

        {/* Metric 2 */}
        <div className="bg-[#0c0c0f] border border-zinc-850 p-4 rounded-xl flex items-center justify-between relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-20 h-20 bg-orange-650/5 rounded-full blur-2xl group-hover:bg-orange-660/15 transition-all pointer-events-none" />
          <div className="space-y-1.5 z-10 text-left">
            <span className="block text-[8px] font-black uppercase text-zinc-550 mr-2 tracking-widest leading-none">PRIMARY ENGAGED QUEUE</span>
            <span className="block text-lg font-black text-white truncate max-w-[150px]">{stats.highestTool}</span>
            <span className="block text-[8.5px] font-semibold text-orange-400 font-mono uppercase">{stats.highestToolCount} recorded cycles</span>
          </div>
          <div className="h-9 w-9 rounded-lg bg-zinc-950/70 border border-zinc-900 flex items-center justify-center shrink-0">
            <TrendingUp size={16} className="text-orange-500" />
          </div>
        </div>

        {/* Metric 3 */}
        <div className="bg-[#0c0c0f] border border-zinc-850 p-4 rounded-xl flex items-center justify-between relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-20 h-20 bg-emerald-650/5 rounded-full blur-2xl group-hover:bg-emerald-660/15 transition-all pointer-events-none" />
          <div className="space-y-1.5 z-10 text-left">
            <span className="block text-[8px] font-black uppercase text-zinc-555 tracking-widest leading-none">SYSTEM INTEGRITY RATE</span>
            <span className="block text-2xl font-black text-emerald-400 font-mono">100%</span>
            <span className="block text-[8.5px] font-semibold text-zinc-650">Verification checks secure</span>
          </div>
          <div className="h-9 w-9 rounded-lg bg-zinc-950/70 border border-zinc-900 flex items-center justify-center shrink-0">
            <CheckCircle2 size={16} className="text-emerald-500" />
          </div>
        </div>

        {/* Metric 4 */}
        <div className="bg-[#0c0c0f] border border-zinc-850 p-4 rounded-xl flex items-center justify-between relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-20 h-20 bg-fuchsia-650/5 rounded-full blur-2xl group-hover:bg-fuchsia-660/15 transition-all pointer-events-none" />
          <div className="space-y-1.5 z-10 text-left">
            <span className="block text-[8px] font-black uppercase text-zinc-555 tracking-widest leading-none">ACTIVE QUEUE CATEGORIES</span>
            <span className="block text-2xl font-black text-fuchsia-400 font-mono">4</span>
            <span className="block text-[8.5px] font-semibold text-zinc-600">Categorized system matrices</span>
          </div>
          <div className="h-9 w-9 rounded-lg bg-zinc-950/70 border border-zinc-900 flex items-center justify-center shrink-0">
            <Fingerprint size={16} className="text-fuchsia-500" />
          </div>
        </div>
      </div>

      {/* HOURLY PEAK ACTIVITY HEATMAP (LAST WEEK) */}
      <div className="bg-[#0c0c0f] border border-zinc-850 p-5 rounded-2xl text-left space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-zinc-900 pb-3">
          <div>
            <h3 className="text-xs font-black uppercase text-white tracking-widest flex items-center gap-1.5">
              <Clock size={13} className="text-red-500" /> Weekly Hourly Peak Activity Heatmap
            </h3>
            <p className="text-[9px] uppercase font-mono text-zinc-550 mt-0.5">
              Hourly frequency grid mapping over the last 7 days of creative operations and system sequences
            </p>
          </div>
          <div className="flex items-center gap-4 text-xs font-mono">
            <div className="flex items-center gap-1.5 text-[10px] text-zinc-500">
              <span>Less</span>
              <div className="w-2.5 h-2.5 rounded bg-zinc-900 border border-zinc-950" />
              <div className="w-2.5 h-2.5 rounded bg-red-950/80 border border-zinc-950" />
              <div className="w-2.5 h-2.5 rounded bg-red-800 border border-zinc-950" />
              <div className="w-2.5 h-2.5 rounded bg-red-600 border border-zinc-950" />
              <div className="w-2.5 h-2.5 rounded bg-red-500 border border-zinc-950" />
              <span>More</span>
            </div>
          </div>
        </div>

        <div className="overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-zinc-800">
          <div className="min-w-[760px] space-y-1.5">
            {/* Hour Labels Header */}
            <div className="flex pl-24 text-[8px] font-black font-mono text-zinc-550 uppercase tracking-wider">
              {Array.from({ length: 24 }).map((_, hour) => {
                const label = hour === 0 ? '12a' : hour === 12 ? '12p' : hour % 12 === 0 ? `${hour % 12}a` : hour > 12 ? `${hour - 12}p` : `${hour}a`;
                // Only show every 2nd label to prevent crowding
                return (
                  <div key={hour} className="w-6.5 text-center shrink-0">
                    {hour % 2 === 0 ? label : ''}
                  </div>
                );
              })}
            </div>

            {/* Heatmap Rows (7 Days) */}
            <div className="space-y-1">
              {heatmapData.days.map((day) => {
                return (
                  <div key={day.dateStr} className="flex items-center gap-2">
                    {/* Day label */}
                    <div className="w-22 text-right text-[10px] font-bold text-zinc-400 shrink-0 select-none">
                      {day.label}
                    </div>
                    {/* 24 Hour blocks */}
                    <div className="flex gap-1.5">
                      {day.hours.map((count, hour) => {
                        // Calculate color
                        let bgClass = 'bg-zinc-900 border border-zinc-950 hover:border-zinc-850';
                        if (count > 0 && count <= 2) bgClass = 'bg-red-950/80 border border-zinc-950 hover:border-red-900';
                        else if (count > 2 && count <= 5) bgClass = 'bg-red-850/80 border border-zinc-950 hover:border-red-700';
                        else if (count > 5 && count <= 8) bgClass = 'bg-red-650 border border-zinc-950 hover:border-red-500';
                        else if (count > 8) bgClass = 'bg-red-500 border border-zinc-950 hover:border-red-400';

                        const rangeStart = `${hour.toString().padStart(2, '0')}:00`;
                        const rangeEnd = `${((hour + 1) % 24).toString().padStart(2, '0')}:00`;

                        return (
                          <div
                            key={hour}
                            className={`w-5 h-5 rounded-md ${bgClass} cursor-pointer transition-all duration-150 relative group flex items-center justify-center`}
                          >
                            {count > 0 && (
                              <span className="text-[7.5px] font-black font-mono text-white/50 select-none">
                                {count}
                              </span>
                            )}
                            
                            {/* Hover Tooltip */}
                            <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 bg-[#0e0e11] border border-zinc-800 p-2 rounded shadow-xl text-left pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-200 z-50 shrink-0 w-44 font-sans leading-relaxed">
                              <p className="font-black text-[9px] uppercase tracking-wider text-zinc-400 border-b border-zinc-900 pb-1 mb-1">
                                {day.label}
                              </p>
                              <p className="text-[10px] text-zinc-350">
                                Time Slot: <strong className="font-mono text-zinc-100">{rangeStart} - {rangeEnd}</strong>
                              </p>
                              <p className="text-[10px] text-red-400 font-bold mt-0.5">
                                {count === 0 ? 'No recorded events' : `${count} recorded operation${count > 1 ? 's' : ''}`}
                              </p>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* 30-DAY ACTIVITY VOLUME RECHARTS CHART */}
      <div className="bg-[#0c0c0f] border border-zinc-850 p-5 rounded-2xl text-left space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-zinc-900 pb-3">
          <div>
            <h3 className="text-xs font-black uppercase text-white tracking-widest flex items-center gap-1.5">
              <TrendingUp size={13} className="text-red-500 animate-pulse" /> Past 30 Days Operational Volume
            </h3>
            <p className="text-[9px] uppercase font-mono text-zinc-550 mt-0.5">
              Visualizing daily recorded workflow cycles, automated sequences, and system audits
            </p>
          </div>
          <div className="flex items-center gap-4 text-right">
            <div className="text-left bg-black/40 border border-zinc-900 px-3 py-1 rounded-lg">
              <span className="block text-[7.5px] font-black text-zinc-550 uppercase tracking-widest">30D SUM</span>
              <span className="block text-sm font-black text-red-500 font-mono">
                {last30DaysData.reduce((acc, curr) => acc + curr.count, 0)} ops
              </span>
            </div>
            <div className="text-left bg-black/40 border border-zinc-900 px-3 py-1 rounded-lg">
              <span className="block text-[7.5px] font-black text-zinc-550 uppercase tracking-widest">DAILY AVG</span>
              <span className="block text-sm font-black text-zinc-350 font-mono">
                {(last30DaysData.reduce((acc, curr) => acc + curr.count, 0) / 30).toFixed(1)}/d
              </span>
            </div>
            <div className="text-left bg-black/40 border border-zinc-900 px-3 py-1 rounded-lg">
              <span className="block text-[7.5px] font-black text-zinc-550 uppercase tracking-widest">PEAK LEVEL</span>
              <span className="block text-sm font-black text-zinc-350 font-mono">
                {Math.max(...last30DaysData.map(d => d.count), 0)} ops
              </span>
            </div>
          </div>
        </div>

        <div className="h-44 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={last30DaysData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
              <defs>
                <linearGradient id="activityVolumeGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#ef4444" stopOpacity={0.25}/>
                  <stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#18181b" vertical={false} />
              <XAxis 
                dataKey="displayDate" 
                stroke="#52525b" 
                fontSize={8} 
                tickLine={false} 
                axisLine={false}
                dy={6}
              />
              <YAxis 
                stroke="#52525b" 
                fontSize={8} 
                tickLine={false} 
                axisLine={false}
                allowDecimals={false}
              />
              <Tooltip
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    const dataPoint = payload[0].payload;
                    return (
                      <div className="bg-[#0e0e11] border border-zinc-800 p-2 rounded shadow-lg text-left text-[10px] space-y-0.5">
                        <p className="font-bold text-zinc-400">{dataPoint.displayDate}</p>
                        <p className="font-mono text-red-500 font-black">
                          {dataPoint.count} recorded operations
                        </p>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Area 
                type="monotone" 
                dataKey="count" 
                stroke="#ef4444" 
                strokeWidth={2} 
                fillOpacity={1} 
                fill="url(#activityVolumeGrad)" 
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* BATCH SELECTION FLOATING ACTION PANEL */}
      <AnimatePresence>
        {selectedLogIds.size > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="bg-red-950/20 border border-red-900/45 p-4 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-left shadow-lg shadow-black/40"
          >
            <div className="flex items-center gap-3">
              <div className="h-8 w-8 rounded-full bg-red-950/50 border border-red-900/55 flex items-center justify-center text-red-400 font-bold font-mono text-xs shrink-0">
                {selectedLogIds.size}
              </div>
              <div>
                <h4 className="text-xs font-black uppercase text-white tracking-wider">
                  Batch Selection Enabled
                </h4>
                <p className="text-[10px] font-medium text-zinc-400">
                  You have selected {selectedLogIds.size} log item{selectedLogIds.size > 1 ? 's' : ''}. You can clear selection or delete permanently.
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2 shrink-0">
              {selectedLogIds.size === 2 && (
                <button
                  onClick={() => {
                    const ids = Array.from(selectedLogIds);
                    const logA = logs.find(l => l.id === ids[0]);
                    const logB = logs.find(l => l.id === ids[1]);
                    if (logA && logB) {
                      const sorted = logA.timestamp <= logB.timestamp ? [logA, logB] : [logB, logA];
                      setDiffLogA(sorted[0]);
                      setDiffLogB(sorted[1]);
                      setIsDiffModalOpen(true);
                    }
                  }}
                  className="px-4 py-1.5 bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 text-red-400 hover:text-red-300 rounded-lg text-xs font-black uppercase tracking-wider shadow-md transition-all flex items-center gap-1.5 cursor-pointer"
                  title="Compare selected 2 logs side-by-side"
                >
                  <GitCompare size={13} /> Compare Selected (Diff)
                </button>
              )}
              <button
                onClick={() => setSelectedLogIds(new Set())}
                className="px-3 py-1.5 hover:bg-zinc-900 text-zinc-400 hover:text-white rounded-lg text-xs font-bold transition-all cursor-pointer"
              >
                Deselect All
              </button>
              <button
                onClick={handleDeleteSelectedLogs}
                className="px-4 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded-lg text-xs font-black uppercase tracking-wider shadow-md transition-all flex items-center gap-1.5 cursor-pointer"
              >
                <Trash2 size={13} /> Delete Selected ({selectedLogIds.size})
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* EXPANDABLE CSV UPLOAD & MERGE CORE UTILITY */}
      <AnimatePresence>
        {isImportOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0, marginBottom: 0 }}
            animate={{ opacity: 1, height: 'auto', marginBottom: 24 }}
            exit={{ opacity: 0, height: 0, marginBottom: 0 }}
            className="overflow-hidden"
          >
            <div className="bg-[#0c0c0f] border border-zinc-850 p-5 rounded-xl space-y-4 text-left">
              <div className="flex items-center justify-between border-b border-zinc-900 pb-3">
                <div className="text-left">
                  <h3 className="text-xs font-black uppercase text-white tracking-wider flex items-center gap-2">
                    <UploadCloud size={14} className="text-red-500 animate-pulse" /> Import & Merge Historical Ledger CSV
                  </h3>
                  <p className="text-[10px] uppercase font-mono text-zinc-500 mt-0.5">
                    Sync off-platform history files directly with your current active logs view
                  </p>
                </div>
                <button 
                  onClick={() => {
                    setIsImportOpen(false);
                    setParsedItems([]);
                    setUploadFileName('');
                    setUploadError('');
                  }}
                  className="text-zinc-500 hover:text-zinc-350 cursor-pointer p-1"
                >
                  <X size={14} />
                </button>
              </div>

              {/* Drag and Drop area */}
              <div 
                onDragEnter={handleDrag}
                onDragOver={handleDrag}
                onDragLeave={handleDrag}
                onDrop={handleDrop}
                onClick={() => document.getElementById('csv-file-input')?.click()}
                className={`border-2 border-dashed rounded-xl p-8 flex flex-col items-center justify-center gap-2.5 transition-all cursor-pointer text-center relative ${
                  dragActive 
                    ? 'border-red-500 bg-red-950/10' 
                    : 'border-zinc-800 hover:border-zinc-700 bg-black/40 hover:bg-black/60'
                }`}
              >
                <input 
                  type="file" 
                  id="csv-file-input"
                  accept=".csv"
                  onChange={handleFileChange}
                  className="hidden"
                />
                
                <div className="h-10 w-10 rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center">
                  <FileSpreadsheet size={18} className="text-zinc-400" />
                </div>

                <div className="space-y-1">
                  <p className="text-xs font-semibold text-zinc-350">
                    {uploadFileName ? (
                      <span className="text-red-400 font-bold">{uploadFileName}</span>
                    ) : (
                      <span>Drag and drop your historical CSV file here, or <span className="text-red-500 hover:underline font-bold">browse</span></span>
                    )}
                  </p>
                  <p className="text-[9px] uppercase font-mono text-zinc-600 tracking-wider">
                    Expected headers: ID, Creator Tool, Action Details, Category Tagging, Internal Type, Time Stamp
                  </p>
                </div>
              </div>

              {uploadError && (
                <div className="bg-red-950/20 border border-red-900/40 p-3 rounded-lg flex items-start gap-2.5 text-left">
                  <ShieldAlert size={14} className="text-red-500 mt-0.5 shrink-0" />
                  <div className="space-y-0.5">
                    <p className="text-xs font-bold text-red-400">Parsing Error Encountered</p>
                    <p className="text-[10px] text-zinc-400 font-medium">{uploadError}</p>
                  </div>
                </div>
              )}

              {parsedItems.length > 0 && (
                <div className="bg-zinc-950 border border-zinc-900 p-4 rounded-xl space-y-3 text-left">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-zinc-900 pb-2">
                    <div>
                      <span className="text-[10px] uppercase font-mono text-zinc-400 font-black">PARSED CSV PREVIEW SUMMARY</span>
                      <p className="text-[9px] text-zinc-650 italic">Verify parsed metadata before committing to database</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 bg-red-950/30 border border-red-900/40 text-[9px] font-mono text-red-400 rounded-md font-bold">
                        {parsedItems.length} Valid Records
                      </span>
                    </div>
                  </div>

                  {/* Micro list preview of first 3 items */}
                  <div className="space-y-2 max-h-[140px] overflow-y-auto pr-1">
                    {parsedItems.slice(0, 3).map((item, index) => (
                      <div key={item.id || index} className="text-xs flex items-center justify-between bg-black/40 p-2 rounded-lg border border-zinc-900">
                        <div className="truncate max-w-[70%]">
                          <span className="text-[9px] font-mono text-zinc-500 mr-2 uppercase">[{item.tool}]</span>
                          <span className="text-zinc-300 font-medium">{item.action}</span>
                        </div>
                        <div className="text-[9px] font-mono text-zinc-500 shrink-0 uppercase">
                          {item.time || 'History Log'}
                        </div>
                      </div>
                    ))}
                    {parsedItems.length > 3 && (
                      <div className="text-[9px] uppercase font-mono text-zinc-600 text-center pt-1 tracking-wider">
                        And {parsedItems.length - 3} other operations included in file...
                      </div>
                    )}
                  </div>

                  <div className="flex items-center justify-end gap-2 pt-2 border-t border-zinc-900">
                    <button
                      onClick={() => {
                        setParsedItems([]);
                        setUploadFileName('');
                        setUploadError('');
                      }}
                      className="px-3.5 py-1.5 hover:bg-zinc-900 border border-transparent text-zinc-400 hover:text-white rounded-lg text-xs font-bold transition-all cursor-pointer"
                    >
                      Clear File
                    </button>
                    <button
                      onClick={handleMergeLogs}
                      className="px-4 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded-lg text-xs font-black uppercase tracking-wider shadow-md transition-all flex items-center gap-1.5 cursor-pointer"
                    >
                      <CheckCircle2 size={13} /> Merge Into Ledger
                    </button>
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* FILTERING & MODE SELECTION BAR */}
      <div className="bg-[#0c0c0f] border border-zinc-850 p-4 rounded-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Search Input */}
        <div className="relative flex-1 max-w-md">
          <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-zinc-600 pointer-events-none">
            <Search size={14} />
          </span>
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-black border border-zinc-850 rounded-lg pl-9 pr-4 py-2 text-xs text-zinc-200 focus:outline-none focus:border-red-500 placeholder-zinc-650 font-medium"
            placeholder="Search action descriptions, tools or categories..."
          />
        </div>

        {/* Right side segment filters */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Categorization filter switch */}
          <div className="flex items-center gap-1 bg-black p-1 rounded-lg border border-zinc-900">
            <button
              onClick={() => {
                setFilterMode('category');
                setSelectedFilter('all');
              }}
              className={`px-2.5 py-1 rounded text-[9px] font-black uppercase tracking-wider transition-all cursor-pointer ${
                filterMode === 'category' ? 'bg-zinc-800 text-white' : 'text-zinc-500 hover:text-zinc-350'
              }`}
            >
              Filter Category
            </button>
            <button
              onClick={() => {
                setFilterMode('type');
                setSelectedFilter('all');
              }}
              className={`px-2.5 py-1 rounded text-[9px] font-black uppercase tracking-wider transition-all cursor-pointer ${
                filterMode === 'type' ? 'bg-zinc-800 text-white' : 'text-zinc-500 hover:text-zinc-350'
              }`}
            >
              Filter Technical Type
            </button>
          </div>

          <div className="flex items-center gap-1.5 bg-zinc-950 p-1 rounded-lg border border-zinc-900">
            <button
              onClick={() => setViewMode('timeline')}
              className={`px-3 py-1.5 rounded text-[10px] font-black uppercase tracking-wider transition-all cursor-pointer ${
                viewMode === 'timeline' ? 'bg-red-500 text-white shadow-md' : 'text-zinc-500 hover:text-zinc-300'
              }`}
            >
              Timeline Stream
            </button>
            <button
              onClick={() => setViewMode('table')}
              className={`px-3 py-1.5 rounded text-[10px] font-black uppercase tracking-wider transition-all cursor-pointer ${
                viewMode === 'table' ? 'bg-red-500 text-white shadow-md' : 'text-zinc-500 hover:text-zinc-300'
              }`}
            >
              Table Ledger
            </button>
          </div>

          <div className="flex items-center gap-1 bg-zinc-950 border border-zinc-900 rounded-lg p-1">
            <button
              onClick={handleExportCSV}
              className="px-2.5 py-1.5 hover:bg-zinc-900 text-zinc-400 hover:text-white rounded text-[10px] font-black uppercase tracking-wider transition-all flex items-center gap-1 cursor-pointer"
              title="Download filtered logs table as CSV Spreadsheet file"
            >
              <FileSpreadsheet size={11} className="text-emerald-500" /> Download CSV
            </button>
            <button
              onClick={handlePrintAudit}
              className="px-2.5 py-1.5 hover:bg-zinc-900 text-zinc-400 hover:text-white rounded text-[10px] font-black uppercase tracking-wider transition-all flex items-center gap-1 cursor-pointer"
              title="Trigger clean printable view of current logs"
            >
              <FileText size={11} className="text-zinc-400" /> Print Report
            </button>
            <button
              onClick={handleExportPDF}
              className="px-2.5 py-1.5 hover:bg-zinc-900 text-zinc-350 hover:text-white border-l border-zinc-900 pl-2 rounded text-[10px] font-black uppercase tracking-wider transition-all flex items-center gap-1 cursor-pointer"
              title="Compile and download high-fidelity professional PDF audit report"
            >
              <FileText size={11} className="text-red-500" /> Download PDF
            </button>
            <button
              onClick={handlePushToGoogleSheets}
              disabled={isPushingToSheets}
              className="px-2.5 py-1.5 hover:bg-zinc-900 text-zinc-350 hover:text-white border-l border-zinc-900 pl-2 rounded text-[10px] font-black uppercase tracking-wider transition-all flex items-center gap-1 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              title="Push current filtered logs directly to a Google Sheets document"
            >
              {isPushingToSheets ? (
                <>
                  <RefreshCw size={11} className="animate-spin text-emerald-400" /> Pushing...
                </>
              ) : (
                <>
                  <FileSpreadsheet size={11} className="text-emerald-400" /> Push to Google Sheets
                </>
              )}
            </button>
            {createdSheetUrl && (
              <a
                href={createdSheetUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="px-2.5 py-1.5 bg-emerald-950/40 hover:bg-emerald-900/50 text-emerald-400 hover:text-emerald-350 border border-emerald-900/50 rounded text-[10px] font-extrabold uppercase tracking-wider transition-all flex items-center gap-1 cursor-pointer ml-1 animate-pulse"
                title="Open the last exported Google Sheets spreadsheet in a new tab"
              >
                Open Google Sheet ↗
              </a>
            )}
          </div>
        </div>
      </div>

      {/* NEWLY INTRODUCED: TIMELINE PERIOD DATE FILTER CARD */}
      <div className="bg-[#0c0c0f] border border-zinc-850 p-4 rounded-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-2 text-left">
          <Calendar size={14} className="text-red-500 shrink-0" />
          <span className="text-xs font-black uppercase tracking-wider text-white">Timeline Period:</span>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {/* Preset Buttons */}
          <div className="flex flex-wrap items-center gap-1 bg-black p-1 rounded-lg border border-zinc-900">
            {[
              { id: 'all', label: 'All Time' },
              { id: '24h', label: 'Last 24 Hours' },
              { id: '7d', label: 'Last 7 Days' },
              { id: '30d', label: 'Last 30 Days' },
              { id: 'custom', label: 'Custom Range...' }
            ].map(preset => (
              <button
                key={preset.id}
                onClick={() => {
                  setTimePreset(preset.id as any);
                  if (preset.id !== 'custom') {
                    setCustomStartDate('');
                    setCustomEndDate('');
                  }
                }}
                className={`px-3 py-1.5 rounded text-[9px] font-black uppercase tracking-wider transition-all cursor-pointer ${
                  timePreset === preset.id 
                    ? 'bg-red-500 text-white font-bold shadow-md' 
                    : 'text-zinc-500 hover:text-zinc-300'
                }`}
              >
                {preset.label}
              </button>
            ))}
          </div>

          {/* Custom Date Input Fields */}
          {timePreset === 'custom' && (
            <div className="flex flex-wrap items-center gap-2 animate-fade-in">
              <div className="flex items-center gap-1.5 bg-black border border-zinc-900 rounded-lg p-1.5 px-2.5">
                <span className="text-[8px] uppercase tracking-wider font-mono text-zinc-550 font-black">Start:</span>
                <input
                  type="date"
                  value={customStartDate}
                  onChange={(e) => setCustomStartDate(e.target.value)}
                  className="bg-transparent text-[10px] text-zinc-300 border-none outline-none focus:ring-0 p-0 text-center font-mono cursor-pointer"
                />
              </div>

              <div className="flex items-center gap-1.5 bg-black border border-zinc-900 rounded-lg p-1.5 px-2.5">
                <span className="text-[8px] uppercase tracking-wider font-mono text-zinc-550 font-black">End:</span>
                <input
                  type="date"
                  value={customEndDate}
                  onChange={(e) => setCustomEndDate(e.target.value)}
                  className="bg-transparent text-[10px] text-zinc-300 border-none outline-none focus:ring-0 p-0 text-center font-mono cursor-pointer"
                />
              </div>

              {(customStartDate || customEndDate) && (
                <button
                  onClick={() => {
                    setCustomStartDate('');
                    setCustomEndDate('');
                  }}
                  className="p-1.5 hover:bg-zinc-900 text-zinc-650 hover:text-red-400 rounded transition-colors"
                  title="Clear custom start/end date bounds"
                >
                  <X size={13} />
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* NEWLY INTRODUCED: ADVANCED DROPDOWN FILTERING & SORTING CARD */}
      <div className="bg-[#0c0c0f] border border-zinc-850 p-4 rounded-xl grid grid-cols-1 md:grid-cols-3 gap-4 text-left">
        {/* Sort By Select */}
        <div className="space-y-1.5">
          <label className="text-[9px] font-black uppercase tracking-wider text-zinc-400 flex items-center gap-1">
            <SlidersHorizontal size={10} className="text-red-500" /> Sort Audit History:
          </label>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="w-full bg-black border border-zinc-850 rounded-lg px-3 py-2 text-xs text-zinc-300 focus:outline-none focus:border-red-500 font-medium"
          >
            <option value="date-desc">Newest to Oldest (Date Range Desc)</option>
            <option value="date-asc">Oldest to Newest (Date Range Asc)</option>
            <option value="action-asc">Action Details (A-Z)</option>
            <option value="action-desc">Action Details (Z-A)</option>
            <option value="type-asc">Action Type (A-Z)</option>
            <option value="type-desc">Action Type (Z-A)</option>
          </select>
        </div>

        {/* Action Type Select */}
        <div className="space-y-1.5">
          <label className="text-[9px] font-black uppercase tracking-wider text-zinc-400 flex items-center gap-1">
            <Layers size={10} className="text-red-500" /> Filter Action Type:
          </label>
          <select
            value={selectedActionType}
            onChange={(e) => setSelectedActionType(e.target.value)}
            className="w-full bg-black border border-zinc-850 rounded-lg px-3 py-2 text-xs text-zinc-300 focus:outline-none focus:border-red-500 font-medium"
          >
            <option value="all">All Action Types (Default)</option>
            {typesList.filter(t => t !== 'all').map(type => (
              <option key={type} value={type}>
                {type.toUpperCase()} Operations
              </option>
            ))}
          </select>
        </div>

        {/* Specific Project ID Select */}
        <div className="space-y-1.5">
          <label className="text-[9px] font-black uppercase tracking-wider text-zinc-400 flex items-center gap-1">
            <FolderOpen size={10} className="text-red-500" /> Filter Specific Project:
          </label>
          <select
            value={selectedProjectId}
            onChange={(e) => setSelectedProjectId(e.target.value)}
            className="w-full bg-black border border-zinc-850 rounded-lg px-3 py-2 text-xs text-zinc-300 focus:outline-none focus:border-red-500 font-medium"
          >
            <option value="all">All Projects / General Workspace</option>
            <option value="general">Unassigned (No Project Context)</option>
            {projects.map(proj => (
              <option key={proj.id} value={proj.id}>
                {proj.title}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* TEMPLATE LIBRARY FEATURE */}
      <div className="bg-[#0c0c0f] border border-zinc-850 p-4 rounded-xl flex flex-col gap-3.5 text-left animate-fade-in">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-zinc-900">
          <div className="flex items-center gap-2">
            <Bookmark size={14} className="text-red-500" />
            <span className="text-xs font-black uppercase tracking-wider text-white">Log Template Library</span>
            <span className="text-[9px] font-bold text-zinc-500 bg-zinc-950 px-1.5 py-0.5 rounded border border-zinc-900">
              {templates.length} Saved
            </span>
          </div>

          <div className="flex items-center gap-2">
            {isSavingTemplate ? (
              <div className="flex items-center gap-2 animate-fade-in">
                <input
                  type="text"
                  placeholder="Template Name..."
                  value={newTemplateName}
                  onChange={(e) => setNewTemplateName(e.target.value)}
                  className="bg-black border border-zinc-800 rounded px-2.5 py-1 text-[10px] text-zinc-200 focus:outline-none focus:border-red-500 w-44 font-medium"
                />
                <button
                  onClick={handleSaveTemplate}
                  className="px-2.5 py-1 bg-red-600 hover:bg-red-700 text-white rounded text-[9px] font-black uppercase tracking-wider cursor-pointer"
                >
                  Save
                </button>
                <button
                  onClick={() => {
                    setIsSavingTemplate(false);
                    setNewTemplateName('');
                  }}
                  className="px-2 py-1 bg-zinc-900 hover:bg-zinc-850 text-zinc-400 hover:text-white rounded text-[9px] font-black uppercase tracking-wider cursor-pointer"
                >
                  Cancel
                </button>
              </div>
            ) : (
              <button
                onClick={() => setIsSavingTemplate(true)}
                className="px-2.5 py-1 bg-zinc-950 hover:bg-zinc-900 border border-zinc-850 text-zinc-350 hover:text-white rounded text-[9px] font-black uppercase tracking-wider flex items-center gap-1 transition-all cursor-pointer"
                title="Save current search & filter configurations as a reusable template"
              >
                <PlusCircle size={10} className="text-red-500 animate-pulse" /> Save Current Preset
              </button>
            )}
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          {templates.map((tpl) => {
            const isMatch = 
              searchTerm === tpl.searchTerm &&
              selectedFilter === tpl.selectedFilter &&
              filterMode === tpl.filterMode &&
              timePreset === tpl.timePreset &&
              customStartDate === tpl.customStartDate &&
              customEndDate === tpl.customEndDate &&
              selectedProjectId === tpl.selectedProjectId &&
              selectedActionType === tpl.selectedActionType &&
              sortBy === tpl.sortBy;

            return (
              <div
                key={tpl.id}
                onClick={() => handleApplyTemplate(tpl)}
                className={`group/tpl px-2.5 py-1.5 rounded-lg border text-[10px] font-extrabold uppercase tracking-wide transition-all flex items-center gap-2 cursor-pointer select-none ${
                  isMatch
                    ? 'border-red-500 bg-red-500/5 text-red-400 font-bold'
                    : 'border-zinc-900 bg-black/60 text-zinc-400 hover:border-zinc-750 hover:text-white hover:bg-zinc-900/40'
                }`}
                title="Click to apply this template filter configuration instantly"
              >
                <Bookmark size={10} className={isMatch ? "text-red-500 animate-pulse" : "text-zinc-600 group-hover/tpl:text-zinc-400"} />
                <span>{tpl.name}</span>
                
                {!tpl.isDefault && (
                  <button
                    type="button"
                    onClick={(e) => handleDeleteTemplate(tpl.id, e)}
                    className="p-0.5 hover:bg-red-950/40 text-zinc-600 hover:text-red-500 rounded transition-colors ml-1.5 opacity-0 group-hover/tpl:opacity-100"
                    title="Delete template"
                  >
                    <X size={10} />
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* FILTER TABS */}
      <div className="text-left space-y-1">
        <span className="text-[9px] font-black tracking-widest text-zinc-500 uppercase font-mono pl-1">
          Active Filtering Base ({filterMode === 'category' ? 'By Categories Tagging' : 'By Inbound Technical Types'})
        </span>
        <div className="flex flex-wrap items-center gap-1.5 scroll-smooth overflow-x-auto pb-1 max-w-full">
          {(filterMode === 'category' ? categoriesList : typesList).map(cat => (
            <button
              key={cat}
              onClick={() => setSelectedFilter(cat)}
              className={`px-3.5 py-1.5 rounded-lg border text-[10px] font-black uppercase tracking-wider transition-all shrink-0 cursor-pointer ${
                selectedFilter === cat 
                  ? 'border-red-500 bg-red-500/10 text-red-500 shadow'
                  : 'border-zinc-900 bg-[#070709] text-zinc-500 hover:bg-zinc-900 hover:text-zinc-300'
              }`}
            >
              {cat || 'general'}
            </button>
          ))}
        </div>
      </div>

      {/* MAIN CONTENT WORKSPACE AREA */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        
        {/* LEADING VIEW: LIST & DETAILS TIMELINE OR TABLE */}
        <div className="lg:col-span-2 space-y-4">
          
          {filteredLogs.length === 0 ? (
            <div className="bg-[#0c0c0f] border border-zinc-850 rounded-2xl p-12 text-center flex flex-col items-center justify-center space-y-3">
              <Clock size={32} className="text-zinc-700 animate-pulse" />
              <h3 className="text-sm font-black uppercase text-zinc-400">No Operations Matched Filter</h3>
              <p className="text-xs text-zinc-600 max-w-sm leading-relaxed">
                There are no current logged operations in sandbox that match the specified query keywords or categories. Click Simulate Action to generate sample workflows entries.
              </p>
              <button
                onClick={handleInjectMockLog}
                className="px-4 py-2 bg-zinc-900 border border-zinc-800 text-xs font-black text-zinc-350 rounded-lg hover:text-white cursor-pointer"
              >
                Incorporate Simulation Activity
              </button>
            </div>
          ) : (
            <>
              {/* TIMELINE MODE */}
              {viewMode === 'timeline' && (
                <div className="space-y-3 relative text-left">
                  {/* Decorative alignment lines */}
                  <div className="absolute left-14.5 top-2 bottom-2 w-0.5 bg-zinc-900 pointer-events-none" />

                  {processedLogs.map((group, index) => {
                    const log = group.mainLog;
                    const resolvedCategory = log.category || getCategoryFromTypeAndTool(log.type, log.tool);
                    const catStyle = getCategoryColorStyle(resolvedCategory);
                    const isExpanded = expandedGroupIds.has(group.id);
                    const anomaly = anomalousLogsMap[log.id];

                    return (
                      <div key={group.id} className="space-y-2">
                        {/* Main Log Entry */}
                        <motion.div
                          initial={{ opacity: 0, y: 8 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: index * 0.03, duration: 0.2 }}
                          onClick={() => setSelectedLog(log)}
                          className={`relative flex gap-4 p-4 rounded-xl border transition-all duration-250 hover:border-zinc-750 cursor-pointer group ${
                            selectedLog?.id === log.id 
                              ? 'border-red-500/60 bg-[#120d0f]' 
                              : 'border-zinc-850 bg-[#0c0c0f]'
                          }`}
                        >
                          {/* Checkbox selector */}
                          <div className="relative z-10 flex items-center justify-center shrink-0" onClick={(e) => e.stopPropagation()}>
                            <input 
                              type="checkbox"
                              checked={selectedLogIds.has(log.id)}
                              onChange={(e) => handleToggleSelectLog(log.id, e)}
                              className="rounded border-zinc-800 bg-black text-red-500 focus:ring-red-500/40 focus:ring-offset-black h-4.5 w-4.5 cursor-pointer accent-red-500"
                            />
                          </div>

                          {/* Left icon marker node */}
                          <div className="relative z-10 shrink-0">
                            <div className="h-6 w-6 rounded-full bg-zinc-950 border border-zinc-800 text-[10px] flex items-center justify-center font-black text-zinc-500 shadow shadow-black mt-1 group-hover:border-red-500/20 group-hover:text-red-400">
                              {processedLogs.length - index}
                            </div>
                          </div>

                          {/* Content details block */}
                          <div className="space-y-1.5 flex-1 min-w-0">
                            <div className="flex items-center justify-between gap-4">
                              <div className="flex flex-wrap items-center gap-2">
                                {/* TOOL UNIT */}
                                <span className="text-[9px] font-black tracking-widest text-zinc-400 uppercase font-mono bg-zinc-950 px-2 py-0.5 rounded border border-zinc-900">
                                  {log.tool}
                                </span>
                                
                                {/* NEWLY INTRODUCED: SYSTEM CATEGORY BADGE */}
                                <div className={`flex items-center gap-1.5 px-2 py-0.5 rounded border text-[8px] font-black uppercase tracking-wider ${catStyle.badge}`}>
                                  {catStyle.icon}
                                  <span>{resolvedCategory}</span>
                                </div>

                                {/* ANOMALOUS FLAG BADGE */}
                                {anomaly && (
                                  <div 
                                    className="flex items-center gap-1 px-1.5 py-0.5 rounded border border-red-900 bg-red-955/20 text-red-400 text-[7.5px] font-black tracking-wider uppercase cursor-help animate-pulse"
                                    title={anomaly.reason}
                                  >
                                    <Flag size={9} className="fill-red-400 text-red-400" />
                                    <span>Anomaly</span>
                                  </div>
                                )}

                                {/* REPETITIVE COUNT BADGE */}
                                {group.isGroup && (
                                  <span className="text-[8px] font-black tracking-widest text-zinc-400 uppercase font-mono bg-zinc-900 px-2 py-0.5 rounded border border-zinc-800">
                                    📁 {group.subLogs.length + 1} Operations Grouped
                                  </span>
                                )}
                              </div>
                              <span className="text-[8px] font-mono text-zinc-600 font-bold shrink-0">
                                {log.time}
                              </span>
                            </div>
                            
                            <p className="text-xs font-semibold text-zinc-300 leading-normal truncate group-hover:text-white">
                              {log.action}
                            </p>
                            
                            <div className="flex items-center justify-between gap-4">
                              <div className="flex items-center gap-2">
                                <span className={`text-[7px] font-black px-1.5 py-0.5 rounded border uppercase tracking-wider ${getTypeColor(log.type)}`}>
                                  {log.type || 'system'}
                                </span>
                                <span className="text-[7.5px] text-zinc-650 font-mono">ID: {log.id}</span>
                              </div>

                              {group.isGroup && (
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    const nextExpanded = new Set(expandedGroupIds);
                                    if (nextExpanded.has(group.id)) {
                                      nextExpanded.delete(group.id);
                                    } else {
                                      nextExpanded.add(group.id);
                                    }
                                    setExpandedGroupIds(nextExpanded);
                                  }}
                                  className="text-[9px] font-black uppercase text-red-400 hover:text-red-300 transition-colors flex items-center gap-1 border border-zinc-800 hover:border-red-500/20 bg-zinc-950 px-2 py-1 rounded cursor-pointer"
                                >
                                  {isExpanded ? 'Collapse Operations ▲' : `Expand +${group.subLogs.length} Operations ▼`}
                                </button>
                              )}
                            </div>
                          </div>

                          {/* Right Indicator */}
                          <div className="flex items-center justify-center text-zinc-700 group-hover:text-zinc-500 shrink-0">
                            <ArrowRight size={13} className="transform transition-transform group-hover:translate-x-0.5" />
                          </div>
                        </motion.div>

                        {/* Expandable sub logs */}
                        <AnimatePresence>
                          {group.isGroup && isExpanded && (
                            <motion.div
                              initial={{ opacity: 0, height: 0 }}
                              animate={{ opacity: 1, height: 'auto' }}
                              exit={{ opacity: 0, height: 0 }}
                              className="overflow-hidden pl-12 space-y-2 border-l-2 border-zinc-900 ml-4.5"
                            >
                              {group.subLogs.map((subLog, subIdx) => {
                                const subCat = subLog.category || getCategoryFromTypeAndTool(subLog.type, subLog.tool);
                                const subCatStyle = getCategoryColorStyle(subCat);
                                const subAnomaly = anomalousLogsMap[subLog.id];
                                return (
                                  <motion.div
                                    key={subLog.id}
                                    initial={{ opacity: 0, x: -10 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: subIdx * 0.02 }}
                                    onClick={() => setSelectedLog(subLog)}
                                    className={`relative flex gap-3 p-3 rounded-lg border transition-all duration-200 cursor-pointer ${
                                      selectedLog?.id === subLog.id 
                                        ? 'border-red-500/40 bg-[#120d0f]' 
                                        : 'border-zinc-905 bg-[#09090b]/60 hover:bg-[#0c0c0f]'
                                    }`}
                                  >
                                    {/* Selection Checkbox */}
                                    <div className="flex items-center justify-center shrink-0" onClick={(e) => e.stopPropagation()}>
                                      <input 
                                        type="checkbox"
                                        checked={selectedLogIds.has(subLog.id)}
                                        onChange={(e) => handleToggleSelectLog(subLog.id, e)}
                                        className="rounded border-zinc-800 bg-black text-red-500 focus:ring-red-500/40 focus:ring-offset-black h-3.5 w-3.5 cursor-pointer accent-red-500"
                                      />
                                    </div>

                                    {/* Connection node icon */}
                                    <div className="shrink-0 flex items-center justify-center text-zinc-700">
                                      <span className="text-[8px] font-black text-zinc-500 px-1.5 py-0.5 bg-zinc-950 border border-zinc-900 rounded font-mono">
                                        ↳ {subIdx + 1}
                                      </span>
                                    </div>

                                    {/* Content info */}
                                    <div className="space-y-1 flex-1 min-w-0 text-left">
                                      <div className="flex items-center justify-between gap-4">
                                        <div className="flex flex-wrap items-center gap-1.5">
                                          <span className="text-[8px] font-bold text-zinc-400 uppercase font-mono">
                                            {subLog.tool}
                                          </span>
                                          <div className={`flex items-center gap-1 px-1.5 py-0.2 rounded border text-[7px] font-black uppercase tracking-wider ${subCatStyle.badge}`}>
                                            <span>{subCat}</span>
                                          </div>
                                          {subAnomaly && (
                                            <div 
                                              className="flex items-center gap-1 px-1 py-0.2 rounded border border-red-900 bg-red-955/20 text-red-400 text-[7px] font-black tracking-wider uppercase cursor-help animate-pulse"
                                              title={subAnomaly.reason}
                                            >
                                              <Flag size={8} className="fill-red-450" />
                                              <span>Anomaly</span>
                                            </div>
                                          )}
                                        </div>
                                        <span className="text-[8px] font-mono text-zinc-650 font-bold shrink-0">
                                          {subLog.time}
                                        </span>
                                      </div>

                                      <p className="text-xs font-semibold text-zinc-400 truncate">
                                        {subLog.action}
                                      </p>
                                    </div>
                                  </motion.div>
                                );
                              })}
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* TABLE MODE */}
              {viewMode === 'table' && (
                <div className="bg-[#0c0c0f] border border-zinc-850 rounded-2xl overflow-hidden shadow">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse font-sans text-xs">
                      <thead>
                        <tr className="bg-[#111116] border-b border-zinc-900 text-zinc-500 text-[9px] font-black tracking-widest uppercase">
                          <th className="py-3 px-4 w-12 text-center">
                            <input 
                              type="checkbox"
                              checked={isAllSelected}
                              onChange={handleToggleSelectAll}
                              className="rounded border-zinc-800 bg-black text-red-500 focus:ring-red-500/40 focus:ring-offset-black h-3.5 w-3.5 cursor-pointer accent-red-500"
                            />
                          </th>
                          <th className="py-3 px-4">Tool Unit</th>
                          <th className="py-3 px-4">Logged Operation Details</th>
                          <th className="py-3 px-4">Category Tag</th>
                          <th className="py-3 px-4">Technical Type</th>
                          <th className="py-3 px-4">Observed Time</th>
                        </tr>
                      </thead>
                      <tbody>
                        {processedLogs.map((group) => {
                          const log = group.mainLog;
                          const resolvedCategory = log.category || getCategoryFromTypeAndTool(log.type, log.tool);
                          const catStyle = getCategoryColorStyle(resolvedCategory);
                          const isExpanded = expandedGroupIds.has(group.id);
                          const anomaly = anomalousLogsMap[log.id];

                          return (
                            <React.Fragment key={group.id}>
                              {/* Main Row */}
                              <tr
                                onClick={() => setSelectedLog(log)}
                                className={`border-b border-zinc-900/40 hover:bg-zinc-900/30 transition-all cursor-pointer ${
                                  selectedLog?.id === log.id ? 'bg-red-955/10' : ''
                                }`}
                              >
                                <td className="py-3.5 px-4 text-center" onClick={(e) => e.stopPropagation()}>
                                  <div className="flex items-center justify-center gap-1.5">
                                    <input 
                                      type="checkbox"
                                      checked={selectedLogIds.has(log.id)}
                                      onChange={(e) => handleToggleSelectLog(log.id, e)}
                                      className="rounded border-zinc-800 bg-black text-red-500 focus:ring-red-500/40 focus:ring-offset-black h-3.5 w-3.5 cursor-pointer accent-red-500"
                                    />
                                    {group.isGroup && (
                                      <button
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          const nextExpanded = new Set(expandedGroupIds);
                                          if (nextExpanded.has(group.id)) {
                                            nextExpanded.delete(group.id);
                                          } else {
                                            nextExpanded.add(group.id);
                                          }
                                          setExpandedGroupIds(nextExpanded);
                                        }}
                                        className="p-1 hover:bg-zinc-850 rounded text-zinc-400 hover:text-white transition-all font-mono font-bold text-[9px] cursor-pointer"
                                        title={isExpanded ? 'Collapse nested operations' : 'Expand nested operations'}
                                      >
                                        {isExpanded ? '▼' : '►'}
                                      </button>
                                    )}
                                  </div>
                                </td>
                                <td className="py-3.5 px-4 font-black text-zinc-350 truncate max-w-[130px]">
                                  <div className="flex items-center gap-1.5">
                                    <span>{log.tool}</span>
                                    {group.isGroup && (
                                      <span className="px-1.5 py-0.2 bg-zinc-900 border border-zinc-800 text-[8px] rounded font-bold text-zinc-550" title={`${group.subLogs.length + 1} nested operations`}>
                                        ({group.subLogs.length + 1})
                                      </span>
                                    )}
                                  </div>
                                </td>
                                <td className="py-3.5 px-4 font-semibold text-zinc-400 max-w-xs truncate">
                                  <div className="flex items-center gap-2">
                                    <span className="truncate">{log.action}</span>
                                    {anomaly && (
                                      <span 
                                        className="inline-flex items-center gap-1 text-red-500 cursor-help" 
                                        title={anomaly.reason}
                                      >
                                        <Flag size={12} className="fill-red-500 text-red-500 animate-pulse shrink-0" />
                                      </span>
                                    )}
                                  </div>
                                </td>
                                <td className="py-3.5 px-4">
                                  <div className={`inline-flex items-center gap-1 px-2 py-0.5 rounded border text-[8px] font-black uppercase tracking-wider ${catStyle.badge}`}>
                                    <span className={`w-1 h-1 rounded-full ${catStyle.dot}`} />
                                    <span>{resolvedCategory}</span>
                                  </div>
                                </td>
                                <td className="py-3.5 px-4">
                                  <span className={`text-[7px] font-black px-2 py-0.5 rounded border uppercase tracking-wider shrink-0 ${getTypeColor(log.type)}`}>
                                    {log.type || 'system'}
                                  </span>
                                </td>
                                <td className="py-3.5 px-4 text-[9px] font-mono text-zinc-600 font-bold shrink-0">{log.time}</td>
                              </tr>

                              {/* Expanded Nested Sub-Rows */}
                              {group.isGroup && isExpanded && group.subLogs.map((subLog, subIdx) => {
                                const subCategory = subLog.category || getCategoryFromTypeAndTool(subLog.type, subLog.tool);
                                const subCatStyle = getCategoryColorStyle(subCategory);
                                const subAnomaly = anomalousLogsMap[subLog.id];
                                return (
                                  <tr
                                    key={subLog.id}
                                    onClick={() => setSelectedLog(subLog)}
                                    className={`border-b border-zinc-905/35 bg-[#09090b]/40 hover:bg-[#0c0c0f]/40 transition-all cursor-pointer ${
                                      selectedLog?.id === subLog.id ? 'bg-red-955/15' : ''
                                    }`}
                                  >
                                    <td className="py-2.5 px-4 text-center pl-6" onClick={(e) => e.stopPropagation()}>
                                      <div className="flex items-center justify-center gap-1">
                                        <input 
                                          type="checkbox"
                                          checked={selectedLogIds.has(subLog.id)}
                                          onChange={(e) => handleToggleSelectLog(subLog.id, e)}
                                          className="rounded border-zinc-800 bg-black text-red-500 focus:ring-red-500/40 focus:ring-offset-black h-3 w-3 cursor-pointer accent-red-500"
                                        />
                                        <span className="text-[8px] font-bold text-zinc-650 font-mono">↳</span>
                                      </div>
                                    </td>
                                    <td className="py-2.5 px-4 text-zinc-500 text-[10.5px] truncate max-w-[130px] font-bold pl-6">
                                      {subLog.tool}
                                    </td>
                                    <td className="py-2.5 px-4 text-zinc-450 max-w-xs truncate italic pl-6 text-[11px]">
                                      <div className="flex items-center gap-1.5">
                                        <span className="truncate">{subLog.action}</span>
                                        {subAnomaly && (
                                          <span 
                                            className="inline-flex items-center gap-1 text-red-500 cursor-help" 
                                            title={subAnomaly.reason}
                                          >
                                            <Flag size={10} className="fill-red-500 text-red-500 animate-pulse shrink-0" />
                                          </span>
                                        )}
                                      </div>
                                    </td>
                                    <td className="py-2.5 px-4">
                                      <div className={`inline-flex items-center gap-1 px-1.5 py-0.2 rounded border text-[7px] font-black uppercase tracking-wider ${subCatStyle.badge}`}>
                                        <span className={`w-0.5 h-0.5 rounded-full ${subCatStyle.dot}`} />
                                        <span>{subCategory}</span>
                                      </div>
                                    </td>
                                    <td className="py-2.5 px-4">
                                      <span className={`text-[6.5px] font-black px-1.5 py-0.2 rounded border uppercase tracking-wider shrink-0 ${getTypeColor(subLog.type)}`}>
                                        {subLog.type || 'system'}
                                      </span>
                                    </td>
                                    <td className="py-2.5 px-4 text-[8.5px] font-mono text-zinc-700 font-bold shrink-0">{subLog.time}</td>
                                  </tr>
                                );
                              })}
                            </React.Fragment>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </>
          )}

        </div>

        {/* RIGHT AREA PANEL: INSPECTOR OR CATEGORY DUALITY CHART */}
        <div className="space-y-4">
          
          {/* INSPECTOR */}
          <div className="bg-[#0c0c0f] border border-zinc-850 p-5 rounded-2xl space-y-4 text-left">
            <h3 className="text-xs font-black uppercase text-white flex items-center gap-1.5 border-b border-zinc-900 pb-2.5">
              <PlusCircle size={14} className="text-red-500" /> Audit Logs Inspector
            </h3>

            {selectedLog ? (
              <div className="space-y-4 animate-fade-in text-xs">
                
                <div className="space-y-1">
                  <span className="block text-[8px] font-black uppercase text-zinc-500 tracking-wider">CREATOR WORKSPACE SOURCE</span>
                  <span className="text-sm font-black text-white">{selectedLog.tool}</span>
                </div>

                <div className="space-y-1">
                  <span className="block text-[8px] font-black uppercase text-zinc-500 tracking-wider">INGESTED ACTIONS DESCRIPTION</span>
                  <p className="font-semibold text-zinc-305 bg-black/40 border border-zinc-900 p-3 rounded-lg leading-relaxed italic">
                    "{selectedLog.action}"
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <span className="block text-[8px] font-black uppercase text-zinc-500 tracking-wider">STAMP DISTANCE</span>
                    <span className="block font-bold text-zinc-300 font-mono">{selectedLog.time || 'Just Now'}</span>
                  </div>
                  <div className="space-y-1">
                    <span className="block text-[8px] font-black uppercase text-zinc-500 tracking-wider">SYSTEM CATEGORIZATION</span>
                    <div className="mt-1">
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded border text-[8px] font-black uppercase tracking-wider ${getCategoryColorStyle(selectedLog.category || getCategoryFromTypeAndTool(selectedLog.type, selectedLog.tool)).badge}`}>
                        <span>{selectedLog.category || getCategoryFromTypeAndTool(selectedLog.type, selectedLog.tool)}</span>
                      </span>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 border-t border-zinc-900 pt-3">
                  <div className="space-y-1">
                    <span className="block text-[8px] font-black uppercase text-zinc-500 tracking-wider">TECHNICAL CLASSIFICATION</span>
                    <span className={`inline-block text-[7.5px] font-black px-2 py-0.5 rounded border uppercase tracking-wider ${getTypeColor(selectedLog.type)}`}>
                      {selectedLog.type || 'system'}
                    </span>
                  </div>
                  <div className="space-y-1">
                    <span className="block text-[8px] font-black uppercase text-zinc-500 tracking-wider">VERIFIED STATUS</span>
                    <span className="text-emerald-500 font-bold font-mono text-[9.5px] block mt-0.5">✔ VERIFIED_OK</span>
                  </div>
                </div>

                <div className="border-t border-zinc-900 pt-3 space-y-2 font-mono text-[9px] text-zinc-550">
                  <div className="flex justify-between">
                    <span>ledger_unique_id:</span>
                    <span className="text-zinc-450 font-bold max-w-[120px] truncate">{selectedLog.id}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>signature_integrity:</span>
                    <span className="text-emerald-500 font-bold">authenticated_sha256</span>
                  </div>
                  <div className="flex justify-between">
                    <span>epoch_milli:</span>
                    <span>{selectedLog.timestamp || 'Immediate'}</span>
                  </div>
                </div>

                <div className="pt-2.5 border-t border-zinc-900">
                  <button
                    onClick={() => {
                      const isSelected = selectedLogIds.has(selectedLog.id);
                      const next = new Set(selectedLogIds);
                      if (isSelected) {
                        next.delete(selectedLog.id);
                      } else {
                        if (next.size >= 2) {
                          toast.error('You can select up to 2 logs for comparison. Deselect others first.');
                          return;
                        }
                        next.add(selectedLog.id);
                      }
                      setSelectedLogIds(next);
                      if (!isSelected) {
                        toast.success(`Log selected for comparison. ${next.size === 1 ? 'Select 1 more log.' : 'Ready! Click "Compare Selected" below!'}`);
                      }
                    }}
                    className={`w-full py-2 px-3 rounded-lg border text-[10px] font-black uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                      selectedLogIds.has(selectedLog.id)
                        ? 'bg-red-500/10 border-red-500/30 text-red-400 hover:bg-red-500/20'
                        : 'bg-zinc-900 border-zinc-800 text-zinc-350 hover:bg-zinc-850 hover:text-white'
                    }`}
                  >
                    <GitCompare size={12} />
                    {selectedLogIds.has(selectedLog.id) ? 'Deselect from Comparison' : 'Select for Comparison'}
                  </button>
                </div>

                <div className="bg-zinc-950/40 p-3 border border-zinc-900 rounded-lg flex items-start gap-1.5 text-[10px] text-zinc-500 leading-normal">
                  <Info size={12} className="text-zinc-600 shrink-0 mt-0.5" />
                  <span>
                    This operation sequence is successfully recorded inside the localized **getActivities()** sandbox state, preserving active tracking data.
                  </span>
                </div>

              </div>
            ) : (
              <div className="h-44 flex flex-col items-center justify-center text-center space-y-1.5 text-zinc-600">
                <Info size={20} className="opacity-40 animate-pulse" />
                <span className="text-xs font-bold">Inspect details</span>
                <span className="text-[10px] leading-relaxed max-w-[180px] font-medium scale-95 mx-auto">
                  Click on any historical activity line item to trigger verification inspections.
                </span>
              </div>
            )}
          </div>

          {/* NEW ENHANCED DISTRIBUTION MATRIX CHART BY CATEGORIES */}
          <div className="bg-[#0c0c0f] border border-zinc-850 p-5 rounded-2xl text-left space-y-4">
            <h3 className="text-xs font-black uppercase text-white flex items-center gap-1.5 border-b border-zinc-900 pb-2.5">
              <Layers size={14} className="text-red-500" /> Category Core Matrix
            </h3>

            <div className="space-y-4">
              {Object.entries(stats.categoryDistribution).map(([category, count]) => {
                const percentage = stats.total > 0 ? (count / stats.total) * 100 : 0;
                const catStyle = getCategoryColorStyle(category);
                
                return (
                  <div key={category} className="space-y-1 px-1">
                    <div className="flex items-center justify-between text-[10px] font-bold">
                      <div className="flex items-center gap-1.5">
                        {catStyle.icon}
                        <span className="uppercase text-zinc-350 tracking-wide">{category}</span>
                      </div>
                      <span className="font-mono text-zinc-400">{count} cycles ({percentage.toFixed(0)}%)</span>
                    </div>
                    
                    <div className="w-full bg-[#111116] h-2.5 rounded-full overflow-hidden border border-zinc-900/60 flex">
                      <div 
                        className={`h-full rounded-full transition-all duration-500 ${
                          category === 'Automation' ? 'bg-orange-500' :
                          category === 'Billing' ? 'bg-emerald-500' :
                          category === 'System' ? 'bg-rose-500' : 'bg-indigo-500'
                        }`}
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

        </div>

      </div>

      {/* CONFIRMATION OVERLAYS AND MODALS */}
      <AnimatePresence>
        {isConfirmClearOpen && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-[#0c0c0f] border border-zinc-800 rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl relative"
            >
              
              <div className="flex items-start gap-3">
                <div className="h-10 w-10 rounded-xl bg-red-950/40 border border-red-900/60 flex items-center justify-center shrink-0">
                  <ShieldAlert size={20} className="text-red-500 animate-bounce" />
                </div>
                <div className="text-left space-y-1">
                  <h3 className="text-sm font-black text-white uppercase tracking-wider">Flush Workflow Activities?</h3>
                  <p className="text-xs text-zinc-400 leading-relaxed font-semibold">
                    You are trying to execute a permanent sandbox ledger flush. This operation is irreversible. All activity logs will be wiped and replaced with a single verification flush message.
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 text-xs font-bold pt-2 border-t border-zinc-900">
                <button
                  type="button"
                  onClick={() => setIsConfirmClearOpen(false)}
                  className="px-3.5 py-1.5 bg-zinc-900 border border-zinc-800 hover:bg-zinc-850 text-zinc-400 hover:text-zinc-200 rounded-lg transition-all cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleClearAllLogs}
                  className="px-3.5 py-1.5 bg-red-600 hover:bg-red-500 text-white rounded-lg transition-all cursor-pointer"
                >
                  Confirm Flush
                </button>
              </div>

            </motion.div>
          </div>
        )}

        {isProductivityModalOpen && (
          <div className="fixed inset-0 bg-black/85 backdrop-blur-md z-[100] flex items-center justify-center p-4 overflow-y-auto">
            <motion.div
              initial={{ scale: 0.95, y: 15, opacity: 0 }}
              animate={{ scale: 1, y: 0, opacity: 1 }}
              exit={{ scale: 0.95, y: 15, opacity: 0 }}
              className="bg-[#09090b] border border-zinc-850 rounded-2xl max-w-2xl w-full p-6 space-y-6 shadow-2xl relative text-left"
            >
              {/* Decorative accent lines */}
              <div className="absolute top-0 left-0 right-0 h-[3px] bg-gradient-to-r from-red-650 via-purple-650 to-pink-500 rounded-t-2xl" />

              {/* Close button */}
              <button
                onClick={() => setIsProductivityModalOpen(false)}
                className="absolute top-4 right-4 h-7 w-7 rounded-full bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-white flex items-center justify-center transition-all cursor-pointer hover:bg-zinc-850"
              >
                ✕
              </button>

              {/* Modal Header */}
              <div className="space-y-1 text-left border-b border-zinc-900 pb-4 pr-8">
                <div className="flex items-center gap-2">
                  <div className="h-6 w-6 rounded bg-red-950/40 border border-red-500/20 flex items-center justify-center">
                    <Award size={13} className="text-red-500" />
                  </div>
                  <span className="text-[9px] uppercase font-mono text-red-500 font-bold tracking-widest">Ranktica AI Cognitive Intelligence</span>
                </div>
                <h3 className="text-lg font-black text-white uppercase tracking-tight">Weekly Workspace Productivity Analysis</h3>
                <p className="text-[10px] text-zinc-500 uppercase font-mono">Comprehensive behavioral telemetry & workflow execution audit brief</p>
              </div>

              {/* Modal Body */}
              <div className="space-y-5 max-h-[60vh] overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-zinc-800">
                
                {/* Executive Profile Persona Summary */}
                <div className="bg-[#101014] border border-zinc-900 rounded-xl p-4 flex flex-col md:flex-row items-center gap-5">
                  {/* Score Indicator radial mock */}
                  <div className="relative h-20 w-20 shrink-0 flex items-center justify-center bg-black/50 rounded-full border border-zinc-800">
                    <div className="absolute inset-2 rounded-full border border-red-500/10 border-t-red-500 animate-spin-slow" />
                    <div className="text-center">
                      <span className="block text-[8px] font-black text-zinc-500 uppercase font-mono leading-none">SCORE</span>
                      <span className="block text-2xl font-black text-white font-mono leading-none mt-1">
                        {weeklyProductivityReport.score}
                      </span>
                    </div>
                  </div>

                  <div className="text-left space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-xs font-black uppercase text-white tracking-wide">Behavioral Persona:</span>
                      <span className="px-2 py-0.5 bg-red-950/60 border border-red-900/50 rounded text-[9px] font-black text-red-400 uppercase font-mono">
                        {weeklyProductivityReport.persona}
                      </span>
                    </div>
                    <p className="text-xs text-zinc-350 leading-relaxed font-semibold">
                      {weeklyProductivityReport.workflowNarrative}
                    </p>
                  </div>
                </div>

                {/* Grid stats metric cards */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <div className="bg-[#0c0c0f] border border-zinc-900 rounded-lg p-3 text-left">
                    <span className="block text-[8px] font-bold text-zinc-500 uppercase tracking-wider">7-Day Activity</span>
                    <span className="block text-base font-black text-white font-mono mt-0.5">
                      {weeklyProductivityReport.totalActions} runs
                    </span>
                  </div>
                  <div className="bg-[#0c0c0f] border border-zinc-900 rounded-lg p-3 text-left">
                    <span className="block text-[8px] font-bold text-zinc-500 uppercase tracking-wider">Peak Hour Slot</span>
                    <span className="block text-xs font-bold text-red-400 mt-1 truncate">
                      {weeklyProductivityReport.peakSlot.split(' ')[0]}
                    </span>
                  </div>
                  <div className="bg-[#0c0c0f] border border-zinc-900 rounded-lg p-3 text-left">
                    <span className="block text-[8px] font-bold text-zinc-500 uppercase tracking-wider">Top Active Day</span>
                    <span className="block text-xs font-black text-white font-mono mt-1">
                      {weeklyProductivityReport.topDay}
                    </span>
                  </div>
                  <div className="bg-[#0c0c0f] border border-zinc-900 rounded-lg p-3 text-left">
                    <span className="block text-[8px] font-bold text-zinc-500 uppercase tracking-wider">Automation Rate</span>
                    <span className="block text-base font-black text-red-500 font-mono mt-0.5">
                      {weeklyProductivityReport.automationRate}%
                    </span>
                  </div>
                </div>

                {/* Day-of-Week Activity Visual Chart */}
                <div className="bg-[#0c0c0f] border border-zinc-900 rounded-xl p-4 text-left space-y-3">
                  <h4 className="text-[10px] font-black uppercase text-zinc-400 tracking-wider">7-Day Activity Distribution</h4>
                  <div className="grid grid-cols-7 gap-2 h-20 items-end border-b border-zinc-900 pb-1">
                    {Object.entries(weeklyProductivityReport.dayCounts).map(([day, count]) => {
                      const maxCount = Math.max(...Object.values(weeklyProductivityReport.dayCounts), 1);
                      const pct = Math.min(100, Math.max(5, (count / maxCount) * 100));
                      return (
                        <div key={day} className="flex flex-col items-center gap-1.5 h-full justify-end group relative">
                          <span className="text-[8px] font-mono font-bold text-zinc-450 opacity-0 group-hover:opacity-100 transition-opacity absolute bottom-full mb-1">
                            {count}
                          </span>
                          <div 
                            style={{ height: `${pct}%` }} 
                            className="w-full bg-red-600/40 group-hover:bg-red-500/70 border border-red-900/60 rounded-t transition-all duration-300" 
                          />
                        </div>
                      );
                    })}
                  </div>
                  <div className="grid grid-cols-7 gap-2 text-center text-[8px] font-black text-zinc-500 uppercase tracking-wider select-none font-mono">
                    {Object.keys(weeklyProductivityReport.dayCounts).map(d => (
                      <span key={d}>{d.substring(0, 3)}</span>
                    ))}
                  </div>
                </div>

                {/* Contextual Actionable Recommendations */}
                <div className="space-y-2.5">
                  <h4 className="text-[10px] font-black uppercase text-zinc-400 tracking-widest flex items-center gap-1">
                    <Zap size={11} className="text-red-500" /> Strategic Workflow Optimization Guide
                  </h4>
                  <div className="space-y-2">
                    {weeklyProductivityReport.recommendations.map((rec, i) => (
                      <div key={i} className="flex items-start gap-2.5 bg-[#101014]/60 border border-zinc-900 p-3 rounded-lg text-left">
                        <div className="h-5 w-5 rounded-full bg-red-950/20 border border-red-900/40 flex items-center justify-center shrink-0 mt-0.5 text-[10px] font-black text-red-400 font-mono">
                          {i + 1}
                        </div>
                        <p className="text-xs text-zinc-350 leading-relaxed font-semibold">
                          {rec}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>

              </div>

              {/* Modal Footer Controls */}
              <div className="flex items-center justify-between gap-4 pt-4 border-t border-zinc-900 text-xs font-bold">
                <button
                  type="button"
                  onClick={() => {
                    const printWindow = window.open('', '_blank');
                    if (!printWindow) {
                      toast.error('Pop-up window blocked.');
                      return;
                    }
                    const dayLabels = Object.keys(weeklyProductivityReport.dayCounts);
                    const dayValues = Object.values(weeklyProductivityReport.dayCounts);
                    const barsHtml = dayLabels.map((day, i) => {
                      const count = dayValues[i];
                      return `
                        <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid #1f1f23; padding: 10px 0;">
                          <span style="font-weight: 700; font-size: 11px;">${day}</span>
                          <span style="font-family: monospace; font-weight: 900; color: #ef4444;">${count} operations</span>
                        </div>
                      `;
                    }).join('');

                    const htmlContent = `
                      <html>
                        <head>
                          <title>Ranktica AI Studio - Productivity Summary</title>
                          <style>
                            @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;700;900&family=JetBrains+Mono:wght@400;700&display=swap');
                            body { font-family: 'Inter', sans-serif; padding: 40px; color: #fafafa; background: #0c0c0f; }
                            .card { border: 1px solid #27272a; border-radius: 16px; background: #0c0c0f; padding: 30px; max-width: 650px; margin: 0 auto; }
                            .header { border-bottom: 2px solid #ef4444; padding-bottom: 20px; margin-bottom: 24px; }
                            .title { margin: 0; font-size: 24px; font-weight: 900; color: white; text-transform: uppercase; }
                            .meta { font-size: 11px; color: #71717a; margin-top: 6px; }
                            .persona-banner { background: #131317; border-left: 4px solid #ef4444; padding: 16px; border-radius: 4px; margin-bottom: 24px; }
                            .grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; margin-bottom: 24px; }
                            .grid-item { background: #18181b; border: 1px solid #27272a; border-radius: 8px; padding: 12px; }
                            .grid-lbl { font-size: 8px; font-weight: 900; color: #52525b; text-transform: uppercase; }
                            .grid-val { font-size: 14px; font-weight: 900; color: white; margin-top: 2px; }
                            @media print {
                              body { background: white; color: #121214; }
                              .card { border: none; padding: 0; }
                              .grid-item { background: #f4f4f5; border: 1px solid #e4e4e7; }
                              .grid-val { color: black; }
                              .persona-banner { background: #f4f4f5; }
                            }
                          </style>
                        </head>
                        <body>
                          <div class="card">
                            <div class="header">
                              <h1 class="title">Productivity Summary</h1>
                              <p class="meta">Verified workspace audit • Compiled: ${new Date().toLocaleDateString()}</p>
                            </div>
                            
                            <div class="persona-banner">
                              <h3 style="margin: 0; font-size: 14px; text-transform: uppercase; color: white;">${weeklyProductivityReport.persona}</h3>
                              <p style="font-size: 12px; margin: 6px 0 0 0; color: #a1a1aa; line-height: 1.5;">${weeklyProductivityReport.workflowNarrative}</p>
                            </div>

                            <div class="grid">
                              <div class="grid-item">
                                <div class="grid-lbl">Weekly Score</div>
                                <div class="grid-val">${weeklyProductivityReport.score}/100</div>
                              </div>
                              <div class="grid-item">
                                <div class="grid-lbl">Total Cycles</div>
                                <div class="grid-val">${weeklyProductivityReport.totalActions}</div>
                              </div>
                              <div class="grid-item">
                                <div class="grid-lbl">Top Day</div>
                                <div class="grid-val">${weeklyProductivityReport.topDay}</div>
                              </div>
                              <div class="grid-item">
                                <div class="grid-lbl">Automation</div>
                                <div class="grid-val">${weeklyProductivityReport.automationRate}%</div>
                              </div>
                            </div>

                            <h3 style="font-size: 10px; text-transform: uppercase; color: #71717a; border-bottom: 1px solid #27272a; padding-bottom: 6px; margin-bottom: 12px;">Weekly Activity Distribution</h3>
                            ${barsHtml}
                          </div>
                          <script>window.onload = function(){ window.print(); }</script>
                        </body>
                      </html>
                    `;
                    printWindow.document.write(htmlContent);
                    printWindow.document.close();
                    toast.success('Productivity Brief print layout compiled! 📈');
                  }}
                  className="px-3 py-1.5 bg-zinc-900 border border-zinc-800 hover:bg-zinc-850 text-zinc-350 hover:text-white rounded-lg flex items-center gap-1 transition-all cursor-pointer"
                  title="Print this formatted weekly productivity report summary directly"
                >
                  <FileText size={12} className="text-red-500" /> Export Summary PDF
                </button>

                <button
                  type="button"
                  onClick={() => setIsProductivityModalOpen(false)}
                  className="px-4 py-1.5 bg-red-600 hover:bg-red-500 text-white rounded-lg transition-all cursor-pointer"
                >
                  Done
                </button>
              </div>

            </motion.div>
          </div>
        )}

        {isDiffModalOpen && diffLogA && diffLogB && (
          <div className="fixed inset-0 bg-black/85 backdrop-blur-md z-[100] flex items-center justify-center p-4 overflow-y-auto">
            <motion.div
              initial={{ scale: 0.95, y: 15, opacity: 0 }}
              animate={{ scale: 1, y: 0, opacity: 1 }}
              exit={{ scale: 0.95, y: 15, opacity: 0 }}
              className="bg-[#09090b] border border-zinc-850 rounded-2xl max-w-4xl w-full p-6 space-y-6 shadow-2xl relative text-left"
            >
              {/* Decorative accent lines */}
              <div className="absolute top-0 left-0 right-0 h-[3px] bg-gradient-to-r from-red-650 via-purple-650 to-pink-500 rounded-t-2xl" />

              {/* Close button */}
              <button
                onClick={() => setIsDiffModalOpen(false)}
                className="absolute top-4 right-4 h-7 w-7 rounded-full bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-white flex items-center justify-center transition-all cursor-pointer hover:bg-zinc-850"
              >
                ✕
              </button>

              {/* Modal Header */}
              <div className="space-y-1 text-left border-b border-zinc-900 pb-4 pr-8">
                <div className="flex items-center gap-2">
                  <div className="h-6 w-6 rounded bg-red-950/40 border border-red-500/20 flex items-center justify-center">
                    <GitCompare size={13} className="text-red-500" />
                  </div>
                  <span className="text-[9px] uppercase font-mono text-red-500 font-bold tracking-widest">Operation Diff Analyser</span>
                </div>
                <h3 className="text-lg font-black text-white uppercase tracking-tight">Side-by-Side Activity Comparison</h3>
                <p className="text-[10px] text-zinc-500 uppercase font-mono">Compare telemetry differences and audit parameter drift between log entries</p>
              </div>

              {/* Diff View Grid/Table */}
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left border-collapse">
                  <thead>
                    <tr className="border-b border-zinc-900 text-zinc-500 uppercase font-mono text-[9px] tracking-widest">
                      <th className="py-2.5 px-3">Parameter Attribute</th>
                      <th className="py-2.5 px-3 bg-red-950/5 text-red-400 border-l border-zinc-900">Base Operation (A)</th>
                      <th className="py-2.5 px-3 bg-emerald-950/5 text-emerald-400 border-l border-zinc-900">Comparison Operation (B)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-900/60 font-semibold">
                    {/* ID */}
                    <tr className="hover:bg-zinc-900/20">
                      <td className="py-3 px-3 text-zinc-500 font-mono text-[10px]">ledger_unique_id</td>
                      <td className="py-3 px-3 font-mono text-[10px] text-zinc-400 border-l border-zinc-900">{diffLogA.id}</td>
                      <td className={`py-3 px-3 font-mono text-[10px] border-l border-zinc-900 ${diffLogA.id !== diffLogB.id ? 'text-emerald-400 bg-emerald-950/10' : 'text-zinc-400'}`}>{diffLogB.id}</td>
                    </tr>
                    {/* Timestamp */}
                    <tr className="hover:bg-zinc-900/20">
                      <td className="py-3 px-3 text-zinc-500 font-mono text-[10px]">exact_timestamp</td>
                      <td className="py-3 px-3 text-zinc-300 border-l border-zinc-900 font-mono">{new Date(diffLogA.timestamp).toLocaleString()}</td>
                      <td className={`py-3 px-3 border-l border-zinc-900 font-mono ${diffLogA.timestamp !== diffLogB.timestamp ? 'text-emerald-400 bg-emerald-950/10' : 'text-zinc-300'}`}>{new Date(diffLogB.timestamp).toLocaleString()}</td>
                    </tr>
                    {/* Tool */}
                    <tr className="hover:bg-zinc-900/20">
                      <td className="py-3 px-3 text-zinc-500 font-mono text-[10px]">creator_tool_source</td>
                      <td className="py-3 px-3 text-white border-l border-zinc-900">{diffLogA.tool}</td>
                      <td className={`py-3 px-3 border-l border-zinc-900 ${diffLogA.tool !== diffLogB.tool ? 'text-emerald-400 bg-emerald-950/10' : 'text-white'}`}>{diffLogB.tool}</td>
                    </tr>
                    {/* Classification Type */}
                    <tr className="hover:bg-zinc-900/20">
                      <td className="py-3 px-3 text-zinc-500 font-mono text-[10px]">technical_classification</td>
                      <td className="py-3 px-3 border-l border-zinc-900">
                        <span className={`inline-block text-[8px] font-black px-2 py-0.5 rounded border uppercase tracking-wider ${getTypeColor(diffLogA.type)}`}>
                          {diffLogA.type || 'system'}
                        </span>
                      </td>
                      <td className={`py-3 px-3 border-l border-zinc-900 ${diffLogA.type !== diffLogB.type ? 'bg-emerald-950/10' : ''}`}>
                        <span className={`inline-block text-[8px] font-black px-2 py-0.5 rounded border uppercase tracking-wider ${getTypeColor(diffLogB.type)}`}>
                          {diffLogB.type || 'system'}
                        </span>
                        {diffLogA.type !== diffLogB.type && <span className="ml-2 text-[9px] text-emerald-400 font-mono font-bold">(drift)</span>}
                      </td>
                    </tr>
                    {/* Category */}
                    <tr className="hover:bg-zinc-900/20">
                      <td className="py-3 px-3 text-zinc-500 font-mono text-[10px]">system_categorization</td>
                      <td className="py-3 px-3 border-l border-zinc-900">
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded border text-[8px] font-black uppercase tracking-wider ${getCategoryColorStyle(diffLogA.category || getCategoryFromTypeAndTool(diffLogA.type, diffLogA.tool)).badge}`}>
                          <span>{diffLogA.category || getCategoryFromTypeAndTool(diffLogA.type, diffLogA.tool)}</span>
                        </span>
                      </td>
                      <td className={`py-3 px-3 border-l border-zinc-900 ${diffLogA.category !== diffLogB.category ? 'bg-emerald-950/10' : ''}`}>
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded border text-[8px] font-black uppercase tracking-wider ${getCategoryColorStyle(diffLogB.category || getCategoryFromTypeAndTool(diffLogB.type, diffLogB.tool)).badge}`}>
                          <span>{diffLogB.category || getCategoryFromTypeAndTool(diffLogB.type, diffLogB.tool)}</span>
                        </span>
                        {(diffLogA.category || getCategoryFromTypeAndTool(diffLogA.type, diffLogA.tool)) !== (diffLogB.category || getCategoryFromTypeAndTool(diffLogB.type, diffLogB.tool)) && <span className="ml-2 text-[9px] text-emerald-400 font-mono font-bold">(changed)</span>}
                      </td>
                    </tr>
                    {/* Project ID */}
                    <tr className="hover:bg-zinc-900/20">
                      <td className="py-3 px-3 text-zinc-500 font-mono text-[10px]">project_scope_binding</td>
                      <td className="py-3 px-3 text-zinc-300 border-l border-zinc-900 font-mono text-[11px]">{diffLogA.projectId || 'None (General)'}</td>
                      <td className={`py-3 px-3 border-l border-zinc-900 font-mono text-[11px] ${diffLogA.projectId !== diffLogB.projectId ? 'text-emerald-400 bg-emerald-950/10' : 'text-zinc-300'}`}>{diffLogB.projectId || 'None (General)'}</td>
                    </tr>
                    {/* Action details */}
                    <tr className="hover:bg-zinc-900/20">
                      <td className="py-3 px-3 text-zinc-500 font-mono text-[10px]">ingested_action_details</td>
                      <td className="py-3.5 px-3 text-zinc-300 border-l border-zinc-900 italic font-medium leading-relaxed">"{diffLogA.action}"</td>
                      <td className={`py-3.5 px-3 border-l border-zinc-900 italic font-medium leading-relaxed ${diffLogA.action !== diffLogB.action ? 'text-emerald-300 bg-emerald-950/10' : 'text-zinc-300'}`}>"{diffLogB.action}"</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* Drift Summary Note */}
              <div className="bg-zinc-950/40 p-4 border border-zinc-900 rounded-xl space-y-1 text-xs">
                <span className="block font-black uppercase text-zinc-500 text-[8px] tracking-wider">INTELLIGENT COMPLIANCE ANALYSIS SUMMARY</span>
                <p className="text-zinc-400 leading-relaxed font-semibold">
                  {diffLogA.tool === diffLogB.tool 
                    ? `Sequential telemetry entries for "${diffLogA.tool}". The action drift shows a modification pattern in project assets over a duration of ${Math.abs(Math.round((diffLogB.timestamp - diffLogA.timestamp) / 1000))}s.`
                    : `Cross-system operation comparison between tool source "${diffLogA.tool}" and "${diffLogB.tool}". This represents separate segments of the workspace operations lineage.`
                  }
                </p>
              </div>

              {/* Close controls */}
              <div className="flex justify-end pt-2 border-t border-zinc-900">
                <button
                  onClick={() => setIsDiffModalOpen(false)}
                  className="px-5 py-2 bg-red-650 hover:bg-red-600 text-white rounded-lg text-xs font-black uppercase tracking-wider transition-all cursor-pointer shadow-md"
                >
                  Close Analysis
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
};
