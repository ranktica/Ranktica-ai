import React, { useState, useEffect } from 'react';
import { useTranslation } from '@/shared/i18n';
import { useProject } from '@/app/ProjectContext';
import { 
  Users, UserPlus, Trash2, Shield, Search, CheckCircle, 
  Mail, Edit3, X, Loader2, ArrowLeftRight, Check, AlertTriangle,
  Bell, Activity, ClipboardList, Download, CalendarRange, ToggleLeft, 
  ToggleRight, Shuffle, HelpCircle, FileDown, CheckSquare, Square, 
  UserCheck, Smile, Star, Calendar, Upload, Plus, Sparkles, FileSpreadsheet, Layers, Flame, Tag
} from 'lucide-react';
import toast from 'react-hot-toast';
import { 
  ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, 
  CartesianGrid, BarChart, Bar, Legend, AreaChart, Area, Cell 
} from 'recharts';

interface TeamMember {
  id: string;
  name: string;
  email: string;
  role: 'Viewer' | 'Editor' | 'Admin';
  project_id: string;
  status: 'invited' | 'active';
  created_at: number;
}

interface TeamCapacity {
  member_id: string;
  weekly_capacity: number;
  current_load: number;
  work_status: 'Active' | 'On Leave';
  skills: string;
  skills_matrix?: string; // JSON string representation of Record<string, number>
  onboarding_checklist: string; // JSON string representation of OnboardingTask[]
  updated_at: number;
  name: string;
  email: string;
  role: 'Viewer' | 'Editor' | 'Admin';
  invitation_status: 'invited' | 'active';
}

interface OnboardingTask {
  id: string;
  label: string;
  completed: boolean;
}

interface LeaveBlock {
  id: string;
  member_id: string;
  name: string;
  email: string;
  start_date: string;
  end_date: string;
  reason: string;
  status: 'Approved' | 'Pending';
  created_at: number;
}

interface WeeklyReport {
  id: string;
  week_start: string;
  summary: string;
  report_details: string; // JSON string representation
  created_at: number;
}

interface ForecastTask {
  id: string;
  title: string;
  hours: number;
  skill: string;
}

interface AutoBalanceTask {
  id: string;
  title: string;
  hours: number;
  skillRequired: 'SEO' | 'Content Writing' | 'Video Scripting' | 'Assets Optimization' | 'Metrics Analytics';
  status: 'Unassigned' | 'Overdue';
  dueDate: string;
  assignedTo?: string;
  assignedName?: string;
}

// Tag system helpers
const getDefaultTags = (memberId: string, role: string, name: string): string[] => {
  const nameSeed = name.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  const depts = ['Marketing', 'Engineering', 'Design', 'Product', 'Support'];
  const dept = depts[nameSeed % depts.length];
  const levels = ['Junior', 'Mid', 'Senior', 'Lead', 'Director'];
  const seniority = role === 'Admin' ? 'Lead' : role === 'Editor' ? 'Senior' : levels[nameSeed % 3];
  const customGroups = ['Growth', 'LSI-Semantic', 'Infrastructure', 'SEO Audit', 'Content Squad'];
  const group = customGroups[(nameSeed + 2) % customGroups.length];
  return [dept, seniority, group];
};

const getMemberTags = (memberId: string, role: string, name: string): string[] => {
  const stored = localStorage.getItem(`team_member_tags_${memberId}`);
  if (stored) {
    try {
      return JSON.parse(stored);
    } catch (e) {
      // fallback
    }
  }
  const defaults = getDefaultTags(memberId, role, name);
  localStorage.setItem(`team_member_tags_${memberId}`, JSON.stringify(defaults));
  return defaults;
};

const saveMemberTags = (memberId: string, tags: string[]) => {
  localStorage.setItem(`team_member_tags_${memberId}`, JSON.stringify(tags));
};

const UPCOMING_TASKS: ForecastTask[] = [
  { id: 'task_1', title: 'Formulate Topical Hub Architecture', hours: 8, skill: 'Scriptwriting, AI Optimization' },
  { id: 'task_2', title: 'Audit competitor keyword density', hours: 5, skill: 'Metrics Verification, Performance Analytics' },
  { id: 'task_3', title: 'Synthesize authoritative co-mentions', hours: 12, skill: 'Scriptwriting, Content Review' },
  { id: 'task_4', title: 'Standardize NAP across registries', hours: 4, skill: 'Billing Governance, Team Admin' },
  { id: 'task_5', title: 'Validate schema structural trees', hours: 6, skill: 'Metrics Verification, AI Optimization' },
  { id: 'task_6', title: 'Inject semantic LSI variations', hours: 8, skill: 'Scriptwriting, AI Optimization' },
  { id: 'task_7', title: 'Audit link building gap & citations', hours: 10, skill: 'Metrics Verification, Performance Analytics' }
];

export const TeamMembers: React.FC = () => {
  const { t } = useTranslation();
  const { projects } = useProject();

  // --- SIMULATED ROLE STATE ---
  const [activeUserRole, setActiveUserRole] = useState<'Admin' | 'Editor' | 'Viewer'>(() => {
    return (localStorage.getItem('ranktica_simulated_role') as any) || 'Admin';
  });

  const handleRoleChange = (newRole: 'Admin' | 'Editor' | 'Viewer') => {
    setActiveUserRole(newRole);
    localStorage.setItem('ranktica_simulated_role', newRole);
    toast.success(`Active role persona switched to: ${newRole} 🎭`);
    // Re-fetch datasets to sync headers
    fetchMembers();
    fetchCapacities();
    fetchLeaves();
    fetchWeeklyReports();
  };

  const checkRolePermission = (required: 'Admin' | 'Editor' | 'Viewer'): boolean => {
    if (activeUserRole === 'Viewer' && required !== 'Viewer') {
      toast.error('Access Denied: Viewer persona has read-only restrictions.', { id: 'permission-denied-viewer' });
      return false;
    }
    if (activeUserRole === 'Editor' && required === 'Admin') {
      toast.error('Access Denied: Editor persona cannot perform Admin modifications.', { id: 'permission-denied-editor' });
      return false;
    }
    return true;
  };
  
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Navigation tabs
  const [activeTab, setActiveTab] = useState<'collaborators' | 'capacity' | 'leaves_reports' | 'performance'>('collaborators');

  // Invitation Form state
  const [inviteName, setInviteName] = useState('');
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<'Viewer' | 'Editor' | 'Admin'>('Viewer');
  const [inviteProjectId, setInviteProjectId] = useState('all');
  const [submitting, setSubmitting] = useState(false);
  
  // Edit member state
  const [editingMember, setEditingMember] = useState<TeamMember | null>(null);
  const [editRole, setEditRole] = useState<'Viewer' | 'Editor' | 'Admin'>('Viewer');
  const [editProjectId, setEditProjectId] = useState('all');

  // Delete Member Confirm Modal state
  const [memberToDelete, setMemberToDelete] = useState<TeamMember | null>(null);

  // Activities & Heatmap states
  const [activities, setActivities] = useState<any[]>([]);
  const [loadingActivities, setLoadingActivities] = useState(false);
  const [simulatingActivity, setSimulatingActivity] = useState(false);

  // Notification states
  const [activeNotificationMember, setActiveNotificationMember] = useState<TeamMember | null>(null);
  const [notificationSettings, setNotificationSettings] = useState({
    email_assignments: true,
    email_status_changes: true,
    inapp_assignments: true,
    inapp_status_changes: true
  });
  const [isSavingNotifications, setIsSavingNotifications] = useState(false);

  // Permission audit state
  const [showAuditModal, setShowAuditModal] = useState(false);

  // Capacity Planner state variables
  const [capacities, setCapacities] = useState<TeamCapacity[]>([]);
  const [loadingCapacities, setLoadingCapacities] = useState(false);
  const [editingCapacityMember, setEditingCapacityMember] = useState<TeamCapacity | null>(null);
  const [isSavingCapacity, setIsSavingCapacity] = useState(false);
  const [rebalanceSuggestions, setRebalanceSuggestions] = useState<any[] | null>(null);

  // Onboarding Workflow states
  const [selectedOnboardingMember, setSelectedOnboardingMember] = useState<TeamCapacity | null>(null);
  const [selectedGuideTask, setSelectedGuideTask] = useState<string | null>('welcome');

  // Leaves & Availability Calendar states
  const [leaves, setLeaves] = useState<LeaveBlock[]>([]);
  const [loadingLeaves, setLoadingLeaves] = useState(false);
  const [newLeaveMemberId, setNewLeaveMemberId] = useState('');
  const [newLeaveStartDate, setNewLeaveStartDate] = useState('');
  const [newLeaveEndDate, setNewLeaveEndDate] = useState('');
  const [newLeaveReason, setNewLeaveReason] = useState('');
  const [isSubmittingLeave, setIsSubmittingLeave] = useState(false);

  // Weekly Reports states
  const [weeklyReports, setWeeklyReports] = useState<WeeklyReport[]>([]);
  const [loadingReports, setLoadingReports] = useState(false);
  const [isGeneratingReport, setIsGeneratingReport] = useState(false);
  const [selectedReport, setSelectedReport] = useState<WeeklyReport | null>(null);

  // Bulk Import state
  const [showBulkImportModal, setShowBulkImportModal] = useState(false);
  const [bulkCsvData, setBulkCsvData] = useState('');
  const [bulkImportError, setBulkImportError] = useState('');
  const [isImporting, setIsImporting] = useState(false);
  const [parsedBulkMembers, setParsedBulkMembers] = useState<any[]>([]);
  const [showImportPreview, setShowImportPreview] = useState(false);

  // Sync Log states
  const [showSyncLogPanel, setShowSyncLogPanel] = useState(false);
  const [syncLogs, setSyncLogs] = useState<any[]>([]);

  // Capacity heatmap
  const [showCapacityHeatmap, setShowCapacityHeatmap] = useState(false);

  // Selected performance member
  const [selectedPerformanceMember, setSelectedPerformanceMember] = useState<TeamCapacity | null>(null);

  // Forecast task drag/drop assignment tracking
  const [draggedTaskId, setDraggedTaskId] = useState<string | null>(null);
  const [assignedForecastTasks, setAssignedForecastTasks] = useState<Record<string, ForecastTask[]>>({});

  // Skill matrix edit values for a team member
  const [editingSkillsMatrixMember, setEditingSkillsMatrixMember] = useState<TeamCapacity | null>(null);
  const [skillsMatrixProficiencies, setSkillsMatrixProficiencies] = useState<Record<string, number>>({});
  const [isSavingSkillsMatrix, setIsSavingSkillsMatrix] = useState(false);

  // Third-Party Notification & Webhook integration states
  const [sidebarTab, setSidebarTab] = useState<'stream' | 'settings'>('stream');
  const [slackWebhook, setSlackWebhook] = useState(localStorage.getItem('sync_slack_webhook') || '');
  const [discordWebhook, setDiscordWebhook] = useState(localStorage.getItem('sync_discord_webhook') || '');
  const [slackEnabled, setSlackEnabled] = useState(localStorage.getItem('sync_slack_enabled') === 'true');
  const [discordEnabled, setDiscordEnabled] = useState(localStorage.getItem('sync_discord_enabled') === 'true');

  // Member Tagging system states
  const [selectedDeptFilter, setSelectedDeptFilter] = useState<string>('All');
  const [selectedSeniorityFilter, setSelectedSeniorityFilter] = useState<string>('All');
  const [selectedCustomFilter, setSelectedCustomFilter] = useState<string>('All');
  const [editingTagsMember, setEditingTagsMember] = useState<TeamCapacity | null>(null);
  const [memberDeptInput, setMemberDeptInput] = useState('');
  const [memberSeniorityInput, setMemberSeniorityInput] = useState('');
  const [memberCustomInput, setMemberCustomInput] = useState('');

  // Overdue and unassigned tasks auto-balancing system states
  const [autoBalanceTasks, setAutoBalanceTasks] = useState<AutoBalanceTask[]>(() => {
    const stored = localStorage.getItem('auto_balance_tasks');
    if (stored) {
      try { return JSON.parse(stored); } catch (e) {}
    }
    return [
      { id: 'ab_task_1', title: '🚨 Overdue: Fix broken metadata routing & LSI indexer', hours: 10, skillRequired: 'SEO', status: 'Overdue', dueDate: '2026-06-25' },
      { id: 'ab_task_2', title: '🚨 Overdue: Refine video scripts for product release', hours: 8, skillRequired: 'Video Scripting', status: 'Overdue', dueDate: '2026-06-28' },
      { id: 'ab_task_3', title: '⚠️ Unassigned: Generate weekly marketing performance stats', hours: 6, skillRequired: 'Metrics Analytics', status: 'Unassigned', dueDate: '2026-07-05' },
      { id: 'ab_task_4', title: '⚠️ Unassigned: Refine script copywriting layout templates', hours: 12, skillRequired: 'Content Writing', status: 'Unassigned', dueDate: '2026-07-10' },
      { id: 'ab_task_5', title: '⚠️ Unassigned: Optimize background assets load time', hours: 4, skillRequired: 'Assets Optimization', status: 'Unassigned', dueDate: '2026-07-12' },
    ];
  });
  const [isAutoBalancing, setIsAutoBalancing] = useState(false);

  // Sync Log initialization
  useEffect(() => {
    const stored = localStorage.getItem('team_sync_logs');
    if (stored) {
      try {
        setSyncLogs(JSON.parse(stored));
      } catch (e) {
        // fallback
      }
    } else {
      const defaults = [
        {
          id: 'log_1',
          memberName: 'Alice Smith',
          type: 'leave_status',
          title: 'Leave Approved',
          message: 'Annual leave block scheduled for Jul 15 - Jul 22. Target capacity throttled to 0 hrs.',
          timestamp: Date.now() - 1000 * 60 * 60 * 3
        },
        {
          id: 'log_2',
          memberName: 'Bob Jones',
          type: 'task_assignment',
          title: 'Forecast Task Allocated',
          message: 'Successfully assigned "Formulate Topical Hub Architecture" (8h). Weekly load updated to 38h/40h.',
          timestamp: Date.now() - 1000 * 60 * 60 * 5
        },
        {
          id: 'log_3',
          memberName: 'Clara Adams',
          type: 'workload_update',
          title: 'Quota Configured',
          message: 'Weekly base allocation capacity changed from 30h to 40h. Available balance increased.',
          timestamp: Date.now() - 1000 * 60 * 60 * 24
        },
        {
          id: 'log_4',
          memberName: 'David Miller',
          type: 'role_suggest',
          title: 'Optimal Role Suggested',
          message: 'Import recommendation triggered: Assigned "Editor" based on SEO & Copywriting skill proficiency alignment.',
          timestamp: Date.now() - 1000 * 60 * 60 * 28
        }
      ];
      setSyncLogs(defaults);
      localStorage.setItem('team_sync_logs', JSON.stringify(defaults));
    }
  }, []);

  const triggerWebhookSync = async (title: string, message: string) => {
    const sUrl = localStorage.getItem('sync_slack_webhook');
    const dUrl = localStorage.getItem('sync_discord_webhook');
    const sEnabled = localStorage.getItem('sync_slack_enabled') === 'true';
    const dEnabled = localStorage.getItem('sync_discord_enabled') === 'true';

    if (sEnabled && sUrl) {
      try {
        await fetch(sUrl, {
          method: 'POST',
          mode: 'no-cors',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ text: `*Ranktica Team Sync Notification*\n*${title}*\n${message}` })
        });
      } catch (e) {
        console.warn('Slack webhook failed:', e);
      }
    }
    if (dEnabled && dUrl) {
      try {
        await fetch(dUrl, {
          method: 'POST',
          mode: 'no-cors',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            embeds: [{
              title: `Ranktica Team Sync: ${title}`,
              description: message,
              color: 3447003,
              timestamp: new Date().toISOString()
            }]
          })
        });
      } catch (e) {
        console.warn('Discord webhook failed:', e);
      }
    }
  };

  const addSyncLogEntry = (memberName: string, type: 'workload_update' | 'task_assignment' | 'leave_status' | 'role_suggest', title: string, message: string) => {
    const newEntry = {
      id: `log_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
      memberName,
      type,
      title,
      message,
      timestamp: Date.now()
    };
    setSyncLogs(prev => {
      const updated = [newEntry, ...prev];
      localStorage.setItem('team_sync_logs', JSON.stringify(updated));
      return updated;
    });
    triggerWebhookSync(`${title} (${memberName})`, message);
  };

  // Performance Metrics helpers
  interface PerformanceStats {
    velocity: number;
    totalOutput: number;
    efficiency: number;
    recentTrend: { month: string; tasks: number; velocity: number }[];
    skillProficiencies: { name: string; level: number }[];
  }

  const getMemberPerformanceStats = (member: TeamCapacity): PerformanceStats => {
    const nameSeed = member.name.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    const velocity = Math.round((1.5 + (nameSeed % 33) / 10) * 10) / 10;
    const totalOutput = 15 + (nameSeed % 41);
    const efficiency = 80 + (nameSeed % 19);

    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'];
    const recentTrend = months.map((m, idx) => {
      const tasks = Math.round(3 + (nameSeed % 5) + Math.sin(idx + nameSeed) * 2);
      const vel = Math.round((velocity + Math.cos(idx + nameSeed) * 0.5) * 10) / 10;
      return {
        month: m,
        tasks: Math.max(1, tasks),
        velocity: Math.max(0.5, vel)
      };
    });

    const skillsList = member.skills.split(',').map(s => s.trim()).filter(Boolean);
    const skillProficiencies = skillsList.map((skill, idx) => {
      const level = 2 + ((nameSeed + idx) % 4);
      return {
        name: skill,
        level
      };
    });

    if (skillProficiencies.length === 0) {
      skillProficiencies.push({ name: 'General', level: 3 });
    }

    return {
      velocity,
      totalOutput,
      efficiency,
      recentTrend,
      skillProficiencies
    };
  };

  // 12-Week capacity heatmap helpers
  const get12WeeksHorizon = () => {
    const weeks = [];
    const startDay = new Date('2026-07-01');
    for (let i = 0; i < 12; i++) {
      const wStart = new Date(startDay);
      wStart.setDate(startDay.getDate() + i * 7);
      const wEnd = new Date(wStart);
      wEnd.setDate(wStart.getDate() + 6);
      weeks.push({
        index: i + 1,
        start: wStart,
        end: wEnd,
        label: `W${i + 1}`,
        dateStr: `${wStart.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })} - ${wEnd.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}`
      });
    }
    return weeks;
  };

  const isMemberOnLeaveForWeek = (memberId: string, wStart: Date, wEnd: Date, leavesList: LeaveBlock[]) => {
    return leavesList.some(l => {
      if (l.member_id !== memberId) return false;
      const leaveStart = new Date(l.start_date);
      const leaveEnd = new Date(l.end_date);
      return leaveStart <= wEnd && leaveEnd >= wStart;
    });
  };

  // Fetch all team members
  const fetchMembers = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/db/team-members');
      if (res.ok) {
        const data = await res.json();
        setMembers(data);
      } else {
        throw new Error('Failed to fetch team members');
      }
    } catch (err: any) {
      toast.error(`Error loading team: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Fetch all historical activities
  const fetchActivities = async () => {
    try {
      setLoadingActivities(true);
      const res = await fetch('/api/db/team-members/activities');
      if (res.ok) {
        const data = await res.json();
        setActivities(data);
      }
    } catch (err: any) {
      console.error('Failed to retrieve collaborator activities', err);
    } finally {
      setLoadingActivities(false);
    }
  };

  // Fetch capacity and onboarding dataset
  const fetchCapacities = async () => {
    try {
      setLoadingCapacities(true);
      const res = await fetch('/api/db/team-members/capacities');
      if (res.ok) {
        const data = await res.json();
        setCapacities(data);
        if (data && data.length > 0) {
          setSelectedPerformanceMember(prev => prev ? (data.find((d: any) => d.member_id === prev.member_id) || data[0]) : data[0]);
        }
      }
    } catch (err) {
      console.error('Failed to load capacity planner profiles', err);
    } finally {
      setLoadingCapacities(false);
    }
  };

  const fetchLeaves = async () => {
    try {
      setLoadingLeaves(true);
      const res = await fetch('/api/db/team-members/leaves');
      if (res.ok) {
        const data = await res.json();
        setLeaves(data);
      }
    } catch (err) {
      console.error('Failed to load leaves', err);
    } finally {
      setLoadingLeaves(false);
    }
  };

  const fetchWeeklyReports = async () => {
    try {
      setLoadingReports(true);
      const res = await fetch('/api/db/team-members/weekly-reports');
      if (res.ok) {
        const data = await res.json();
        setWeeklyReports(data);
      }
    } catch (err) {
      console.error('Failed to load weekly reports', err);
    } finally {
      setLoadingReports(false);
    }
  };

  useEffect(() => {
    fetchMembers();
    fetchActivities();
    fetchCapacities();
    fetchLeaves();
    fetchWeeklyReports();
  }, []);

  // Handle invitation submission
  const handleInviteSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!checkRolePermission('Admin')) return;
    if (!inviteName.trim() || !inviteEmail.trim()) {
      toast.error('Name and email are required');
      return;
    }

    try {
      setSubmitting(true);
      const response = await fetch('/api/db/team-members', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: inviteName,
          email: inviteEmail,
          role: inviteRole,
          project_id: inviteProjectId
        })
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error || 'Failed to invite team member');
      }

      toast.success(`Successfully invited ${inviteName}! Onboarding checklist initialized.`);
      
      // Auto register a project assigned activity for visual heatmap feedback
      try {
        const inviteResData = await response.json();
        const createdId = inviteResData.id;
        if (createdId) {
          await fetch('/api/db/team-members/activities', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              member_id: createdId,
              activity_type: 'project_assigned',
              project_id: inviteProjectId,
              contribution_score: 2
            })
          });
        }
      } catch (e) {
        // quiet fail on background metric
      }

      setInviteName('');
      setInviteEmail('');
      setInviteRole('Viewer');
      setInviteProjectId('all');
      
      await fetchMembers();
      await fetchActivities();
      await fetchCapacities();

      // Automatically pop open the onboarding guide for the newly invited member!
      const refreshedCapacitiesRes = await fetch('/api/db/team-members/capacities');
      if (refreshedCapacitiesRes.ok) {
        const freshCaps = await refreshedCapacitiesRes.json();
        const newlyCreated = freshCaps.find((c: any) => c.email.toLowerCase() === inviteEmail.toLowerCase());
        if (newlyCreated) {
          setSelectedOnboardingMember(newlyCreated);
          setSelectedGuideTask('welcome');
        }
      }
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  // Handle save edited member
  const handleSaveEdit = async () => {
    if (!editingMember) return;
    try {
      const response = await fetch(`/api/db/team-members/${editingMember.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: editingMember.name,
          email: editingMember.email,
          role: editRole,
          project_id: editProjectId,
          status: editingMember.status
        })
      });

      if (!response.ok) throw new Error('Failed to update team member');

      toast.success('Collaborator updated successfully');
      
      // Post activity log
      try {
        await fetch('/api/db/team-members/activities', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            member_id: editingMember.id,
            activity_type: 'status_changed',
            project_id: editProjectId,
            contribution_score: 1
          })
        });
      } catch (e) {
        // Quiet catch
      }

      setEditingMember(null);
      fetchMembers();
      fetchActivities();
      fetchCapacities();
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  // Handle delete member
  const handleDeleteConfirm = async () => {
    if (!memberToDelete) return;
    if (!checkRolePermission('Admin')) return;
    try {
      const response = await fetch(`/api/db/team-members/${memberToDelete.id}`, {
        method: 'DELETE'
      });

      if (!response.ok) throw new Error('Failed to revoke collaborator');

      toast.success(`Successfully revoked access for ${memberToDelete.name}`);
      setMemberToDelete(null);
      fetchMembers();
      fetchActivities();
      fetchCapacities();
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  // Fetch granular notifications for modal
  const handleOpenNotifications = async (member: TeamMember) => {
    setActiveNotificationMember(member);
    try {
      const res = await fetch(`/api/db/team-members/${member.id}/notifications`);
      if (res.ok) {
        const data = await res.json();
        setNotificationSettings({
          email_assignments: data.email_assignments === 1 || data.email_assignments === true,
          email_status_changes: data.email_status_changes === 1 || data.email_status_changes === true,
          inapp_assignments: data.inapp_assignments === 1 || data.inapp_assignments === true,
          inapp_status_changes: data.inapp_status_changes === 1 || data.inapp_status_changes === true
        });
      }
    } catch (err) {
      toast.error('Failed to load notification configurations');
    }
  };

  // Save granular notification selections
  const handleSaveNotifications = async () => {
    if (!activeNotificationMember) return;
    try {
      setIsSavingNotifications(true);
      const res = await fetch(`/api/db/team-members/${activeNotificationMember.id}/notifications`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email_assignments: notificationSettings.email_assignments ? 1 : 0,
          email_status_changes: notificationSettings.email_status_changes ? 1 : 0,
          inapp_assignments: notificationSettings.inapp_assignments ? 1 : 0,
          inapp_status_changes: notificationSettings.inapp_status_changes ? 1 : 0
        })
      });
      if (res.ok) {
        toast.success(`Alert preferences updated for ${activeNotificationMember.name}`);
        setActiveNotificationMember(null);
      } else {
        throw new Error('Failed to update alert rules');
      }
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setIsSavingNotifications(false);
    }
  };

  // Toggle Member Status (Active <-> On Leave)
  // Automatically sets capacity to 0 when set to 'On Leave'
  const handleToggleStatus = async (capacityRow: TeamCapacity) => {
    const isCurrentlyActive = capacityRow.work_status === 'Active';
    const nextStatus = isCurrentlyActive ? 'On Leave' : 'Active';
    const nextCapacityLimit = nextStatus === 'On Leave' ? 0 : 40;

    try {
      const response = await fetch(`/api/db/team-members/${capacityRow.member_id}/capacity`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          weekly_capacity: nextCapacityLimit,
          current_load: capacityRow.current_load,
          work_status: nextStatus,
          skills: capacityRow.skills
        })
      });

      if (!response.ok) throw new Error('Failed to update status');
      toast.success(`${capacityRow.name} is now ${nextStatus}. Capacity adjusted to ${nextCapacityLimit} hours.`);
      addSyncLogEntry(
        capacityRow.name,
        'leave_status',
        'Status Toggled',
        `Work status toggled to "${nextStatus === 'On Leave' ? 'On Leave' : 'Active'}". Capacity updated to ${nextCapacityLimit}h.`
      );
      fetchCapacities();
    } catch (err: any) {
      toast.error(`Error toggling status: ${err.message}`);
    }
  };

  // Save changes to capacity, current workload, or technical skills
  const handleSaveCapacityDetails = async () => {
    if (!editingCapacityMember) return;
    try {
      setIsSavingCapacity(true);
      const response = await fetch(`/api/db/team-members/${editingCapacityMember.member_id}/capacity`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          weekly_capacity: Number(editingCapacityMember.weekly_capacity),
          current_load: Number(editingCapacityMember.current_load),
          work_status: editingCapacityMember.work_status,
          skills: editingCapacityMember.skills
        })
      });

      if (!response.ok) throw new Error('Failed to update capacities profile');
      toast.success(`Workload profile updated for ${editingCapacityMember.name}`);
      addSyncLogEntry(
        editingCapacityMember.name,
        'workload_update',
        'Quota Configured',
        `Weekly base capacity adjusted to ${editingCapacityMember.weekly_capacity}h. Workload set to ${editingCapacityMember.current_load}h.`
      );
      setEditingCapacityMember(null);
      fetchCapacities();
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setIsSavingCapacity(false);
    }
  };

  // Parser for CSV lines & Role Suggestion Analysis
  const handleAnalyzeCsv = () => {
    if (!bulkCsvData.trim()) {
      setBulkImportError('Please paste or enter some CSV data first.');
      return;
    }
    setBulkImportError('');

    try {
      const lines = bulkCsvData.split('\n').map(l => l.trim()).filter(Boolean);
      if (lines.length <= 1) {
        setBulkImportError('CSV data must contain a header row and at least one team member row.');
        return;
      }

      const parsed: any[] = [];
      const rows = lines.slice(1);
      
      rows.forEach((row, rIdx) => {
        // Parse CSV columns, preserving quotes and commas inside them
        const cols = row.split(',').map(c => c.replace(/^["']|["']$/g, '').trim());
        if (cols.length >= 2) {
          const name = cols[0];
          const email = cols[1];
          const csvRole = (cols[2] || 'Viewer') as 'Viewer' | 'Editor' | 'Admin';
          const project_id = cols[3] || 'all';
          const weekly_capacity = Number(cols[4]) || 40;
          const skills = cols[5] || '';

          // Role Suggestion Logic based on skills
          let suggestedRole: 'Viewer' | 'Editor' | 'Admin' = csvRole;
          let explanation = 'Maintained default role specified in CSV.';

          const skillsLower = skills.toLowerCase();
          if (
            skillsLower.includes('manage') || 
            skillsLower.includes('lead') || 
            skillsLower.includes('admin') || 
            skillsLower.includes('director') || 
            skillsLower.includes('head') || 
            skillsLower.includes('governance') || 
            skillsLower.includes('billing') ||
            skillsLower.includes('scrum') ||
            skillsLower.includes('owner')
          ) {
            suggestedRole = 'Admin';
            explanation = ' ✨ Suggested Admin: matches management/lead keywords';
          } else if (
            skillsLower.includes('editor') || 
            skillsLower.includes('script') || 
            skillsLower.includes('content') || 
            skillsLower.includes('write') || 
            skillsLower.includes('design') || 
            skillsLower.includes('seo') || 
            skillsLower.includes('optim') || 
            skillsLower.includes('review') ||
            skillsLower.includes('develop') ||
            skillsLower.includes('code')
          ) {
            suggestedRole = 'Editor';
            explanation = ' ✨ Suggested Editor: matches content/creation/development keywords';
          } else if (
            skillsLower.includes('view') || 
            skillsLower.includes('read') || 
            skillsLower.includes('research') || 
            skillsLower.includes('audit') || 
            skillsLower.includes('metrics') || 
            skillsLower.includes('analyt') || 
            skillsLower.includes('report')
          ) {
            suggestedRole = 'Viewer';
            explanation = ' ✨ Suggested Viewer: matches analysis/research keywords';
          } else if (!cols[2]) {
            suggestedRole = 'Viewer';
            explanation = ' ✨ Suggested Viewer (default: no role or keywords)';
          }

          parsed.push({
            id: `temp_${rIdx}_${Date.now()}`,
            name,
            email,
            role: suggestedRole, // editable parsed choice
            csvRole,
            project_id,
            weekly_capacity,
            current_load: 0,
            skills,
            explanation
          });
        }
      });

      if (parsed.length === 0) {
        setBulkImportError('No valid team member rows detected.');
        return;
      }

      setParsedBulkMembers(parsed);
      setShowImportPreview(true);
    } catch (err: any) {
      setBulkImportError(`Parsing error: ${err.message}`);
    }
  };

  const handleBulkImportSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (parsedBulkMembers.length === 0) return;

    try {
      setIsImporting(true);
      let successCount = 0;
      for (const m of parsedBulkMembers) {
        // Invite member
        const res = await fetch('/api/db/team-members', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: m.name,
            email: m.email,
            role: m.role, // finalized reviewed choice
            project_id: m.project_id
          })
        });

        if (res.ok) {
          successCount++;
          const inviteData = await res.json();
          const createdId = inviteData.id;

          if (createdId) {
            // Update capacity profiles
            await fetch(`/api/db/team-members/${createdId}/capacity`, {
              method: 'PUT',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                weekly_capacity: m.weekly_capacity,
                current_load: 0,
                work_status: 'Active',
                skills: m.skills
              })
            });

            // Log this in Team Sync Logs
            addSyncLogEntry(
              m.name,
              'role_suggest',
              'Member Invited via CSV',
              `Suggested role "${m.role}" assigned with ${m.weekly_capacity}h capacity based on skills "${m.skills}".`
            );
          }
        }
      }

      toast.success(`Successfully imported and invited ${successCount} out of ${parsedBulkMembers.length} team members!`);
      setShowBulkImportModal(false);
      setBulkCsvData('');
      setParsedBulkMembers([]);
      setShowImportPreview(false);
      fetchMembers();
      fetchCapacities();
    } catch (err: any) {
      toast.error(`Error importing: ${err.message}`);
    } finally {
      setIsImporting(false);
    }
  };

  // Calculate Vacation & Availability Loss for the upcoming quarter
  const getUpcomingQuarterImpact = () => {
    const today = new Date();
    const quarterEnd = new Date();
    quarterEnd.setDate(today.getDate() + 90); // 90 days (1 quarter) horizon

    let totalDaysLost = 0;
    let totalHoursLost = 0;
    const memberImpacts: Record<string, { name: string; days: number; hours: number }> = {};

    leaves.forEach(l => {
      const start = new Date(l.start_date);
      const end = new Date(l.end_date);

      // Clamp to upcoming quarter horizon
      const overlapStart = start > today ? start : today;
      const overlapEnd = end < quarterEnd ? end : quarterEnd;

      if (overlapEnd >= overlapStart) {
        const msDiff = overlapEnd.getTime() - overlapStart.getTime();
        const days = Math.ceil(msDiff / (1000 * 60 * 60 * 24)) + 1;

        // Calculate hours lost based on member capacity (default to 40 hours/week)
        const cap = capacities.find(c => c.member_id === l.member_id);
        const weeklyCap = cap?.weekly_capacity || 40;
        const dailyCap = weeklyCap / 5;
        const hours = Math.round(days * dailyCap);

        totalDaysLost += days;
        totalHoursLost += hours;

        if (!memberImpacts[l.member_id]) {
          memberImpacts[l.member_id] = { name: l.name, days: 0, hours: 0 };
        }
        memberImpacts[l.member_id].days += days;
        memberImpacts[l.member_id].hours += hours;
      }
    });

    return {
      totalDaysLost,
      totalHoursLost,
      memberImpacts: Object.values(memberImpacts),
    };
  };

  // Submit a Leave Block
  const handlePostLeave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newLeaveMemberId || !newLeaveStartDate || !newLeaveEndDate) {
      toast.error('Please select a team member and date range.');
      return;
    }

    try {
      setIsSubmittingLeave(true);
      const res = await fetch('/api/db/team-members/leaves', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          member_id: newLeaveMemberId,
          start_date: newLeaveStartDate,
          end_date: newLeaveEndDate,
          reason: newLeaveReason || 'Vacation',
          status: 'Approved'
        })
      });

      if (res.ok) {
        toast.success('Leave scheduled successfully! Capacities will auto-adjust accordingly.');
        setNewLeaveMemberId('');
        setNewLeaveStartDate('');
        setNewLeaveEndDate('');
        setNewLeaveReason('');
        fetchLeaves();
        fetchCapacities();
      } else {
        const data = await res.json();
        throw new Error(data.error || 'Failed to submit leave');
      }
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setIsSubmittingLeave(false);
    }
  };

  // Delete a Leave Block
  const handleDeleteLeave = async (id: string) => {
    try {
      const res = await fetch(`/api/db/team-members/leaves/${id}`, {
        method: 'DELETE'
      });

      if (res.ok) {
        toast.success('Planned leave block cancelled.');
        fetchLeaves();
        fetchCapacities();
      } else {
        throw new Error('Failed to cancel leave block');
      }
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  // Generate Weekly Capacity Report
  const handleGenerateWeeklyReport = async () => {
    try {
      setIsGeneratingReport(true);
      const monday = new Date();
      monday.setDate(monday.getDate() - ((monday.getDay() + 6) % 7)); // Get nearest Monday
      const weekStr = monday.toISOString().split('T')[0];

      const res = await fetch('/api/db/team-members/weekly-reports/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ week_start: weekStr })
      });

      if (res.ok) {
        toast.success('Weekly Capacity Report dispatched successfully!');
        fetchWeeklyReports();
      } else {
        throw new Error('Failed to generate report');
      }
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setIsGeneratingReport(false);
    }
  };

  // Drop / Forecast task allocation onto a team member
  const handleDropTask = async (e: React.DragEvent, targetMember: TeamCapacity) => {
    e.preventDefault();
    const taskId = e.dataTransfer.getData('taskId') || draggedTaskId;
    if (!taskId) return;

    const task = UPCOMING_TASKS.find(t => t.id === taskId);
    if (!task) return;

    if (targetMember.work_status === 'On Leave') {
      toast.error(`Cannot assign tasks to ${targetMember.name} (On Leave).`);
      return;
    }

    try {
      // Optimistically update assigned tasks locally
      const currentAssigned = assignedForecastTasks[targetMember.member_id] || [];
      if (currentAssigned.some(t => t.id === task.id)) {
        toast.error(`"${task.title}" is already assigned to ${targetMember.name}.`);
        return;
      }

      const updatedAssigned = [...currentAssigned, task];
      setAssignedForecastTasks(prev => ({
        ...prev,
        [targetMember.member_id]: updatedAssigned
      }));

      // Calculate new workload
      const newLoad = targetMember.current_load + task.hours;

      const res = await fetch(`/api/db/team-members/${targetMember.member_id}/capacity`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          weekly_capacity: targetMember.weekly_capacity,
          current_load: newLoad,
          work_status: targetMember.work_status,
          skills: targetMember.skills
        })
      });

      if (res.ok) {
        toast.success(`Allocated "${task.title}" (${task.hours}h) to ${targetMember.name}.`);
        addSyncLogEntry(
          targetMember.name,
          'task_assignment',
          'Task Drop Allocated',
          `Allocated forecast task: "${task.title}" (${task.hours}h) via Drag & Drop interface. Workload is now ${newLoad}h.`
        );
        fetchCapacities();
      } else {
        throw new Error('Failed to persist workload change on server');
      }
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setDraggedTaskId(null);
    }
  };

  const handleManualAllocateTask = async (taskId: string, memberId: string) => {
    const task = UPCOMING_TASKS.find(t => t.id === taskId);
    const targetMember = capacities.find(c => c.member_id === memberId);
    if (!task || !targetMember) return;

    if (targetMember.work_status === 'On Leave') {
      toast.error(`Cannot assign tasks to ${targetMember.name} (On Leave).`);
      return;
    }

    try {
      const currentAssigned = assignedForecastTasks[targetMember.member_id] || [];
      if (currentAssigned.some(t => t.id === task.id)) {
        toast.error(`"${task.title}" is already assigned to ${targetMember.name}.`);
        return;
      }

      const newLoad = targetMember.current_load + task.hours;

      setAssignedForecastTasks(prev => ({
        ...prev,
        [targetMember.member_id]: [...currentAssigned, task]
      }));

      const res = await fetch(`/api/db/team-members/${targetMember.member_id}/capacity`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          weekly_capacity: targetMember.weekly_capacity,
          current_load: newLoad,
          work_status: targetMember.work_status,
          skills: targetMember.skills
        })
      });

      if (res.ok) {
        toast.success(`Allocated "${task.title}" (${task.hours}h) to ${targetMember.name}.`);
        addSyncLogEntry(
          targetMember.name,
          'task_assignment',
          'Task Manual Allocated',
          `Allocated forecast task: "${task.title}" (${task.hours}h) manually. Workload updated to ${newLoad}h.`
        );
        fetchCapacities();
      }
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  // Remove a forecasted task assignment
  const handleRemoveForecastTask = async (memberId: string, taskId: string, taskHours: number) => {
    const targetMember = capacities.find(c => c.member_id === memberId);
    if (!targetMember) return;

    try {
      const currentAssigned = assignedForecastTasks[memberId] || [];
      const updatedAssigned = currentAssigned.filter(t => t.id !== taskId);
      setAssignedForecastTasks(prev => ({
        ...prev,
        [memberId]: updatedAssigned
      }));

      const newLoad = Math.max(0, targetMember.current_load - taskHours);

      const res = await fetch(`/api/db/team-members/${memberId}/capacity`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          weekly_capacity: targetMember.weekly_capacity,
          current_load: newLoad,
          work_status: targetMember.work_status,
          skills: targetMember.skills
        })
      });

      if (res.ok) {
        toast.success(`Removed task assignment. Adjusted workload load.`);
        const task = UPCOMING_TASKS.find(t => t.id === taskId);
        addSyncLogEntry(
          targetMember.name,
          'task_assignment',
          'Task Deallocated',
          `Deallocated forecast task: "${task?.title || 'Unknown Task'}" (-${taskHours}h). Workload reduced to ${newLoad}h.`
        );
        fetchCapacities();
      }
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  // Update Skill matrix rating
  const handleOpenSkillsMatrix = (member: TeamCapacity) => {
    setEditingSkillsMatrixMember(member);
    let profs: Record<string, number> = {};
    try {
      profs = JSON.parse(member.skills_matrix || '{}');
    } catch (e) {
      profs = {};
    }
    // Initialize standard task types with 3/5 defaults if empty
    const taskTypes = ['SEO', 'Content Writing', 'Video Scripting', 'Assets Optimization', 'Metrics Analytics'];
    taskTypes.forEach(t => {
      if (profs[t] === undefined) profs[t] = 3;
    });
    setSkillsMatrixProficiencies(profs);
  };

  const handleSaveSkillsMatrix = async () => {
    if (!editingSkillsMatrixMember) return;

    try {
      const res = await fetch(`/api/db/team-members/${editingSkillsMatrixMember.member_id}/capacity`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          weekly_capacity: editingSkillsMatrixMember.weekly_capacity,
          current_load: editingSkillsMatrixMember.current_load,
          work_status: editingSkillsMatrixMember.work_status,
          skills: editingSkillsMatrixMember.skills,
          skills_matrix: JSON.stringify(skillsMatrixProficiencies)
        })
      });

      if (res.ok) {
        toast.success(`Skill proficiency matrix updated for ${editingSkillsMatrixMember.name}!`);
        setEditingSkillsMatrixMember(null);
        fetchCapacities();
      } else {
        throw new Error('Failed to save skills matrix');
      }
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  // Toggle onboarding checklist task complete/incomplete
  const handleToggleOnboardingTask = async (taskToToggle: OnboardingTask) => {
    if (!selectedOnboardingMember) return;
    try {
      const currentChecklist: OnboardingTask[] = JSON.parse(selectedOnboardingMember.onboarding_checklist || '[]');
      const updatedChecklist = currentChecklist.map(t => 
        t.id === taskToToggle.id ? { ...t, completed: !t.completed } : t
      );

      // Check if all tasks are complete
      const allCompleted = updatedChecklist.every(t => t.completed);

      // Save to capacity entry
      const res = await fetch(`/api/db/team-members/${selectedOnboardingMember.member_id}/onboarding`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ onboarding_checklist: updatedChecklist })
      });

      if (!res.ok) throw new Error('Failed to save onboarding milestone');

      // If all completed, auto-promote the invitation status to 'active' in the main table!
      if (allCompleted && selectedOnboardingMember.invitation_status === 'invited') {
        await fetch(`/api/db/team-members/${selectedOnboardingMember.member_id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: selectedOnboardingMember.name,
            email: selectedOnboardingMember.email,
            role: selectedOnboardingMember.role,
            project_id: 'all',
            status: 'active'
          })
        });
        toast.success(`🎉 Hurrah! All onboarding steps completed. ${selectedOnboardingMember.name} is now promoted to Active Collaborator!`);
      } else {
        toast.success(`Milestone updated: "${taskToToggle.label}"`);
      }

      // Update state
      const updatedMember = {
        ...selectedOnboardingMember,
        onboarding_checklist: JSON.stringify(updatedChecklist),
        invitation_status: allCompleted ? 'active' as const : selectedOnboardingMember.invitation_status
      };
      setSelectedOnboardingMember(updatedMember);
      fetchCapacities();
      fetchMembers();
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  // Auto-Balance algorithm for unassigned/overdue tasks:
  const handleExecuteAutoBalance = async () => {
    setIsAutoBalancing(true);
    const toastId = toast.loading('Initiating intelligent workloads auto-balancing...');

    try {
      // 1. Get current active capacity profiles
      const activeCapacities = capacities.filter(c => c.work_status === 'Active');
      if (activeCapacities.length === 0) {
        throw new Error('No active team members available to balance tasks onto.');
      }

      // 2. Track a local running map of workloads starting with each member's current workload load
      const runningLoads: Record<string, number> = {};
      activeCapacities.forEach(c => {
        runningLoads[c.member_id] = c.current_load;
      });

      // 3. Clone and sort tasks: Overdue first, then Unassigned
      const tasksToReassign = [...autoBalanceTasks].sort((a, b) => {
        if (a.status === 'Overdue' && b.status !== 'Overdue') return -1;
        if (a.status !== 'Overdue' && b.status === 'Overdue') return 1;
        return b.hours - a.hours; // prioritize larger tasks first
      });

      const updatedTasks = [...autoBalanceTasks];
      let assignedCount = 0;

      for (const task of tasksToReassign) {
        // Skip already assigned/balanced tasks
        if (task.assignedTo) continue;

        // 4. Find the best match using Skill Proficiency Matrix and lowest projected load
        let bestMember: TeamCapacity | null = null;
        let bestScore = -Infinity;
        let bestProficiency = 0;

        for (const cap of activeCapacities) {
          // Parse skills_matrix Record<string, number>
          let proficiencies: Record<string, number> = {};
          try {
            proficiencies = JSON.parse(cap.skills_matrix || '{}');
          } catch (e) {
            proficiencies = {};
          }

          // Let's get the rating for task's skillRequired
          const generalSkills = cap.skills.toLowerCase().split(',').map(s => s.trim());
          const hasGeneralSkill = generalSkills.includes(task.skillRequired.toLowerCase()) || 
                              generalSkills.some(s => s.includes(task.skillRequired.toLowerCase().split(' ')[0]));
          
          let proficiency = proficiencies[task.skillRequired];
          if (proficiency === undefined) {
            proficiency = hasGeneralSkill ? 3 : 1; // Default to 3 if in text skills list, else 1
          }

          // Projected load for this member
          const currentProjLoad = runningLoads[cap.member_id];
          const loadRatio = cap.weekly_capacity > 0 ? currentProjLoad / cap.weekly_capacity : 1;

          // Score formula: high skill proficiency is favored, low load is favored
          const score = (proficiency * 15) - (loadRatio * 100);

          if (score > bestScore) {
            bestScore = score;
            bestMember = cap;
            bestProficiency = proficiency;
          }
        }

        if (bestMember) {
          const targetMember: TeamCapacity = bestMember;
          const rating = bestProficiency;
          
          // Allocate task to best matching member
          const originalIndex = updatedTasks.findIndex(t => t.id === task.id);
          if (originalIndex !== -1) {
            updatedTasks[originalIndex] = {
              ...updatedTasks[originalIndex],
              assignedTo: targetMember.member_id,
              assignedName: targetMember.name
            };
          }

          // Update running loads
          const previousLoad = runningLoads[targetMember.member_id];
          const newLoad = previousLoad + task.hours;
          runningLoads[targetMember.member_id] = newLoad;

          // Write updated capacity to backend
          await fetch(`/api/db/team-members/${targetMember.member_id}/capacity`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              weekly_capacity: targetMember.weekly_capacity,
              current_load: newLoad,
              work_status: targetMember.work_status,
              skills: targetMember.skills
            })
          });

          // Log transaction
          addSyncLogEntry(
            targetMember.name,
            'task_assignment',
            'Auto-Balance Balanced',
            `Auto-Balanced task "${task.title}" (${task.hours}h) onto ${targetMember.name} (Top proficiency in ${task.skillRequired}: Level ${rating}, Projected workload: ${newLoad}h).`
          );

          assignedCount++;
        }
      }

      // Save assignments to local state & persist
      setAutoBalanceTasks(updatedTasks);
      localStorage.setItem('auto_balance_tasks', JSON.stringify(updatedTasks));

      if (assignedCount > 0) {
        toast.success(`Success! Auto-balanced ${assignedCount} pending workloads across top matches.`, { id: toastId });
        fetchCapacities();
      } else {
        toast('All tasks are already fully balanced!', { id: toastId, icon: '✅' });
      }

    } catch (err: any) {
      toast.error(`Auto-balance failed: ${err.message}`, { id: toastId });
    } finally {
      setIsAutoBalancing(false);
    }
  };

  const handleResetAutoBalance = () => {
    const reset = autoBalanceTasks.map(t => ({ ...t, assignedTo: undefined, assignedName: undefined }));
    setAutoBalanceTasks(reset);
    localStorage.setItem('auto_balance_tasks', JSON.stringify(reset));
    toast.success('Auto-balance assignments reset. Workloads can be re-run.');
  };

  // Auto-Rebalance Suggestions Engine:
  // Dynamically matches over-capacity members with under-capacity members using shared skills.
  const calculateRebalanceSuggestions = () => {
    const overCapacity = capacities.filter(c => c.work_status === 'Active' && c.current_load > c.weekly_capacity);
    const underCapacity = capacities.filter(c => c.work_status === 'Active' && c.current_load < c.weekly_capacity);

    if (overCapacity.length === 0) {
      toast('No collaborators are currently over-capacity!', { icon: 'ℹ️' });
      setRebalanceSuggestions([]);
      return;
    }

    const suggestions: any[] = [];

    overCapacity.forEach(over => {
      let excessLoad = over.current_load - over.weekly_capacity;
      const overSkills = over.skills.split(',').map(s => s.trim().toLowerCase());

      underCapacity.forEach(under => {
        if (excessLoad <= 0) return;

        const underSkills = under.skills.split(',').map(s => s.trim().toLowerCase());
        const matchingSkills = overSkills.filter(skill => underSkills.includes(skill));

        if (matchingSkills.length > 0) {
          const availableCapacity = under.weekly_capacity - under.current_load;
          if (availableCapacity > 0) {
            const transferHours = Math.min(excessLoad, availableCapacity);
            suggestions.push({
              fromId: over.member_id,
              fromName: over.name,
              toId: under.member_id,
              toName: under.name,
              skillsMatched: matchingSkills.map(s => s.charAt(0).toUpperCase() + s.slice(1)).join(', '),
              hoursToTransfer: transferHours,
              overCapacityBefore: over.current_load,
              overCapacityAfter: over.current_load - transferHours,
              underCapacityBefore: under.current_load,
              underCapacityAfter: under.current_load + transferHours
            });
            excessLoad -= transferHours;
          }
        }
      });
    });

    if (suggestions.length === 0) {
      toast.error('Could not auto-suggest reassignments. Try adding overlapping skills to under-capacity collaborators.');
    } else {
      toast.success(`Found ${suggestions.length} optimal workload redistribution plans!`);
    }

    setRebalanceSuggestions(suggestions);
  };

  // Execute suggested workload reassignments in the SQLite database
  const handleApplyRebalance = async () => {
    if (!rebalanceSuggestions || rebalanceSuggestions.length === 0) return;

    try {
      setLoadingCapacities(true);
      
      for (const sug of rebalanceSuggestions) {
        // Find current records to apply delta changes
        const currentOver = capacities.find(c => c.member_id === sug.fromId);
        const currentUnder = capacities.find(c => c.member_id === sug.toId);

        if (currentOver) {
          await fetch(`/api/db/team-members/${sug.fromId}/capacity`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              weekly_capacity: currentOver.weekly_capacity,
              current_load: currentOver.current_load - sug.hoursToTransfer,
              work_status: currentOver.work_status,
              skills: currentOver.skills
            })
          });
        }

        if (currentUnder) {
          await fetch(`/api/db/team-members/${sug.toId}/capacity`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              weekly_capacity: currentUnder.weekly_capacity,
              current_load: currentUnder.current_load + sug.hoursToTransfer,
              work_status: currentUnder.work_status,
              skills: currentUnder.skills
            })
          });
        }
      }

      toast.success('Workload auto-rebalance plan committed successfully! All loads synchronized.');
      setRebalanceSuggestions(null);
      fetchCapacities();
    } catch (err: any) {
      toast.error(`Failed to apply rebalance: ${err.message}`);
    } finally {
      setLoadingCapacities(false);
    }
  };

  // Export full capacity dataset to a CSV file for analytical reporting
  const handleExportCapacityCSV = () => {
    const csvRows = [];

    csvRows.push([
      'Collaborator Name',
      'Email Address',
      'Role',
      'Status',
      'Weekly Capacity Limit (hrs)',
      'Current Workload (hrs)',
      'Utilization Rate (%)',
      'Capacity Status',
      'Registered Skills Profile'
    ].join(','));

    capacities.forEach(c => {
      const utilRate = c.weekly_capacity > 0 ? Math.round((c.current_load / c.weekly_capacity) * 100) : 0;
      let capacityStatus = 'Optimal';
      if (c.work_status === 'On Leave') {
        capacityStatus = 'On Leave';
      } else if (c.weekly_capacity > 0 && c.current_load > c.weekly_capacity * 1.10) {
        capacityStatus = 'Over-Capacity Critical (>10% Overload)';
      } else if (c.current_load > c.weekly_capacity) {
        capacityStatus = 'Overload Warn';
      } else if (c.current_load < c.weekly_capacity * 0.5) {
        capacityStatus = 'Under-Utilized';
      }

      const row = [
        `"${c.name.replace(/"/g, '""')}"`,
        `"${c.email.replace(/"/g, '""')}"`,
        `"${c.role}"`,
        `"${c.work_status}"`,
        c.weekly_capacity,
        c.current_load,
        `"${utilRate}%"`,
        `"${capacityStatus}"`,
        `"${c.skills.replace(/"/g, '""')}"`
      ];
      csvRows.push(row.join(','));
    });

    const blob = new Blob([csvRows.join('\n')], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `Ranktica_Workload_Capacity_Plan_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('Capacity allocation log exported successfully!');
  };

  // Export full multi-project permission audit spreadsheet (CSV format)
  const handleExportAuditCSV = () => {
    const csvRows = [];
    
    // Header Column Schema
    csvRows.push([
      'Collaborator Name',
      'Email Address',
      'Assigned Security Role',
      'Authorized Project Scope',
      'Core Responsibilities',
      'Governance Status',
      'Audit Compliance Status'
    ].join(','));
    
    // Map entries
    filteredMembers.forEach(member => {
      const linkedProj = projects.find(p => p.id === member.project_id);
      const scope = member.project_id === 'all' ? 'All Channels & Projects' : (linkedProj?.title || 'Single restricted scope');
      const responsibilities = member.role === 'Admin'
        ? 'Full workspace administration, billing governance, credit control, team invitations'
        : member.role === 'Editor'
        ? 'Draft content generation, video scripting, assets optimization schedule, metadata review'
        : 'Read-only analytics verification, campaign metrics report checks, content review';
      
      const level = member.role === 'Admin' ? 'Level 3 - Root Admin' : member.role === 'Editor' ? 'Level 2 - Write Access' : 'Level 1 - Read Only';
      const compliance = member.project_id === 'all' ? 'Full Authority Footprint' : 'Siloed Project Access';
      
      const row = [
        `"${member.name.replace(/"/g, '""')}"`,
        `"${member.email.replace(/"/g, '""')}"`,
        `"${member.role}"`,
        `"${scope.replace(/"/g, '""')}"`,
        `"${responsibilities.replace(/"/g, '""')}"`,
        `"${level}"`,
        `"${compliance}"`
      ];
      csvRows.push(row.join(','));
    });

    const blob = new Blob([csvRows.join('\n')], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `Ranktica_Collaborator_Permission_Audit_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('Permission footprint audit compilation completed! CSV file downloaded.');
  };

  // Simulate collaborator activity on the network
  const handleSimulateActivity = async () => {
    if (members.length === 0) {
      toast.error('Invite collaborators to simulate activity events.');
      return;
    }
    try {
      setSimulatingActivity(true);
      const randomMember = members[Math.floor(Math.random() * members.length)];
      const types = ['task_completed', 'project_assigned', 'status_changed', 'comment_added', 'campaign_created'];
      const randomType = types[Math.floor(Math.random() * types.length)];
      
      // Weight points
      const score = randomType === 'task_completed' ? 4 : randomType === 'campaign_created' ? 5 : randomType === 'comment_added' ? 2 : 1;

      const res = await fetch('/api/db/team-members/activities', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          member_id: randomMember.id,
          activity_type: randomType,
          project_id: 'all',
          contribution_score: score
        })
      });

      if (res.ok) {
        toast.success(`Dispatched simulated log: ${randomMember.name} performed "${randomType.replace('_', ' ')}"!`);
        fetchActivities();
        fetchCapacities();
      }
    } catch (err: any) {
      toast.error('Simulation event failed');
    } finally {
      setSimulatingActivity(false);
    }
  };

  // Filter members by query
  const filteredMembers = members.filter(member => {
    const query = searchQuery.toLowerCase();
    return (
      member.name.toLowerCase().includes(query) ||
      member.email.toLowerCase().includes(query)
    );
  });

  // Date range helpers for the 30-day grid
  const getLast30Days = () => {
    const dates = [];
    const now = new Date();
    for (let i = 29; i >= 0; i--) {
      const d = new Date();
      d.setDate(now.getDate() - i);
      dates.push(d);
    }
    return dates;
  };

  const formatDateKey = (date: Date) => {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6 text-zinc-100" id="team-members-dashboard">
      
      {/* Header Info Banner */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between border-b border-zinc-800 pb-5 gap-4">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-white flex items-center gap-2">
            <Users className="text-red-500 animate-pulse" size={26} />
            {t('teamMembers')}
          </h1>
          <p className="text-xs text-zinc-500 mt-1">
            Govern workspace authority levels, monitor 30-day activities, align workload capacity hours, and guide new collaborator onboarding.
          </p>
        </div>
        <div className="flex flex-wrap gap-4 items-center">
          {/* Active Persona Security Override Controller */}
          <div className="flex items-center gap-3 bg-zinc-950 border border-zinc-800 rounded-2xl px-4 py-2 text-xs">
             <span className="text-[10px] font-black text-zinc-500 uppercase tracking-wider flex items-center gap-1.5">
                <Shield size={12} className="text-red-500 animate-pulse" /> Active Role Persona:
             </span>
             <div className="flex bg-zinc-900 rounded-xl p-0.5 border border-zinc-800/80">
                {(['Admin', 'Editor', 'Viewer'] as const).map(role => (
                   <button 
                     key={role}
                     type="button"
                     onClick={() => handleRoleChange(role)}
                     className={`px-3.5 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all cursor-pointer ${
                       activeUserRole === role 
                         ? 'bg-red-600 text-white shadow-md shadow-red-600/10' 
                         : 'text-zinc-400 hover:text-zinc-200'
                     }`}
                   >
                     {role}
                   </button>
                ))}
             </div>
          </div>

          <div className="flex flex-wrap gap-2.5">
          <button
            onClick={handleSimulateActivity}
            disabled={simulatingActivity || loading}
            className="flex items-center gap-2 px-4 py-2.5 bg-zinc-900 hover:bg-zinc-850 disabled:opacity-50 text-[10px] font-black uppercase tracking-widest border border-zinc-800 hover:border-zinc-700 rounded-xl transition-all text-white cursor-pointer"
          >
            <Activity size={12} className={simulatingActivity ? 'animate-pulse text-red-500' : 'text-zinc-400'} />
            Simulate Activity Event
          </button>
          <button
            onClick={() => setShowSyncLogPanel(!showSyncLogPanel)}
            className={`flex items-center gap-2 px-4 py-2.5 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all cursor-pointer border ${
              showSyncLogPanel 
                ? 'bg-red-600 border-red-500 text-white shadow-lg shadow-red-600/10' 
                : 'bg-zinc-900 hover:bg-zinc-850 border-zinc-800 hover:border-zinc-700 text-white'
            }`}
          >
            <Bell size={12} className={showSyncLogPanel ? 'animate-bounce' : 'text-zinc-400'} />
            Team Sync Log ({syncLogs.length})
          </button>
          <button
            onClick={() => setShowAuditModal(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all text-white cursor-pointer shadow-lg shadow-blue-600/10"
          >
            <ClipboardList size={12} />
            Permission Footprint Audit
          </button>
        </div>
        </div>
      </div>

      {/* Primary Navigation Tabs */}
      <div className="flex flex-wrap border-b border-zinc-800 gap-1 bg-zinc-950 p-1.5 rounded-2xl">
        <button
          onClick={() => setActiveTab('collaborators')}
          className={`flex-1 sm:flex-initial flex items-center justify-center gap-2 px-6 py-3 text-xs font-bold rounded-xl transition-all cursor-pointer ${
            activeTab === 'collaborators' 
              ? 'bg-zinc-900 text-white border border-zinc-800 shadow-md' 
              : 'text-zinc-400 hover:text-zinc-200'
          }`}
        >
          <Users size={14} className="text-red-500" />
          Collaborators & Analytics
        </button>
        <button
          onClick={() => setActiveTab('capacity')}
          className={`flex-1 sm:flex-initial flex items-center justify-center gap-2 px-6 py-3 text-xs font-bold rounded-xl transition-all cursor-pointer ${
            activeTab === 'capacity' 
              ? 'bg-zinc-900 text-white border border-zinc-800 shadow-md' 
              : 'text-zinc-400 hover:text-zinc-200'
          }`}
        >
          <CalendarRange size={14} className="text-blue-400" />
          Capacity & Resource Forecast
          {capacities.some(c => c.work_status === 'Active' && c.current_load > c.weekly_capacity * 1.10) && (
            <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-ping inline-block" />
          )}
        </button>
        <button
          onClick={() => setActiveTab('leaves_reports')}
          className={`flex-1 sm:flex-initial flex items-center justify-center gap-2 px-6 py-3 text-xs font-bold rounded-xl transition-all cursor-pointer ${
            activeTab === 'leaves_reports' 
              ? 'bg-zinc-900 text-white border border-zinc-800 shadow-md' 
              : 'text-zinc-400 hover:text-zinc-200'
          }`}
        >
          <ClipboardList size={14} className="text-emerald-400" />
          Leave & Capacity Reports
        </button>
        <button
          onClick={() => setActiveTab('performance')}
          className={`flex-1 sm:flex-initial flex items-center justify-center gap-2 px-6 py-3 text-xs font-bold rounded-xl transition-all cursor-pointer ${
            activeTab === 'performance' 
              ? 'bg-zinc-900 text-white border border-zinc-800 shadow-md' 
              : 'text-zinc-400 hover:text-zinc-200'
          }`}
        >
          <Sparkles size={14} className="text-amber-500 animate-pulse" />
          Member Performance Metrics
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 items-start">
        <div className={`${showSyncLogPanel ? 'lg:col-span-3' : 'lg:col-span-4'} space-y-6`}>
          {activeTab === 'collaborators' && (
        <>
          {/* 30-Day Activity Heatmap Section */}
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 shadow-xl space-y-4 animate-fade-in" id="heatmap-panel">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-zinc-800/60 pb-4">
              <div>
                <h2 className="text-xs font-black uppercase text-zinc-300 tracking-wider flex items-center gap-2">
                  <Activity className="text-red-500 animate-pulse" size={14} />
                  Collaborator Contribution Heatmap (30-Day Activity)
                </h2>
                <p className="text-[10px] text-zinc-500 mt-1">
                  Visualizes contribution footprint, script reviews, status toggles, and task completion milestones across active campaigns.
                </p>
              </div>
              <div className="flex items-center gap-2.5 text-[9px] text-zinc-500">
                <span>Less</span>
                <div className="flex gap-1">
                  <div className="w-3.5 h-3.5 rounded bg-zinc-950 border border-zinc-900" title="0 actions" />
                  <div className="w-3.5 h-3.5 rounded bg-red-950/80 border border-red-900/40" title="1-2 actions" />
                  <div className="w-3.5 h-3.5 rounded bg-red-800/60 border border-red-800/30" title="3-4 actions" />
                  <div className="w-3.5 h-3.5 rounded bg-red-600/80 border border-red-600/45" title="5-6 actions" />
                  <div className="w-3.5 h-3.5 rounded bg-red-500 border border-red-400/50" title="7+ actions" />
                </div>
                <span>More</span>
              </div>
            </div>

            {loading ? (
              <div className="flex flex-col items-center justify-center py-12 gap-2 text-zinc-500 text-xs">
                <Loader2 className="animate-spin text-red-500" size={20} />
                Gathering telemetry data...
              </div>
            ) : members.length === 0 ? (
              <div className="py-8 text-center text-zinc-600 text-xs font-semibold">
                Invite collaborators to populate and visualize the active heatmap timeline.
              </div>
            ) : (
              <div className="space-y-3.5 max-h-[280px] overflow-y-auto pr-1.5 custom-scrollbar">
                {members.map(member => {
                  const memberActivities = activities.filter(a => a.member_id === member.id);
                  
                  // Group activities by date key
                  const activityMap: Record<string, { count: number; score: number; types: string[] }> = {};
                  memberActivities.forEach(act => {
                    const dKey = formatDateKey(new Date(Number(act.timestamp)));
                    if (!activityMap[dKey]) {
                      activityMap[dKey] = { count: 0, score: 0, types: [] };
                    }
                    activityMap[dKey].count += 1;
                    activityMap[dKey].score += act.contribution_score || 1;
                    activityMap[dKey].types.push(act.activity_type.replace('_', ' '));
                  });

                  const last30Days = getLast30Days();
                  const totalActions = memberActivities.length;
                  const totalScore = memberActivities.reduce((acc, a) => acc + (a.contribution_score || 1), 0);

                  return (
                    <div key={member.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-3.5 bg-zinc-950/40 border border-zinc-800/60 rounded-xl gap-4 hover:border-zinc-750 transition-all">
                      <div className="w-full sm:w-52 shrink-0">
                        <div className="font-bold text-white text-xs truncate">{member.name}</div>
                        <div className="text-[10px] text-zinc-500 mt-0.5 uppercase tracking-wide font-black">
                          {member.role} • <span className="text-red-400 font-mono font-bold">{totalActions}</span> Actions ({totalScore} score)
                        </div>
                      </div>

                      {/* 30-day squares block */}
                      <div className="flex-1 flex flex-wrap gap-1.5 items-center justify-start sm:justify-end">
                        {last30Days.map((date, idx) => {
                          const dKey = formatDateKey(date);
                          const dayData = activityMap[dKey] || { count: 0, score: 0, types: [] };
                          const count = dayData.count;

                          // Choose background density color based on actions count
                          let bgClass = "bg-zinc-950 border border-zinc-900";
                          if (count > 0 && count <= 2) bgClass = "bg-red-950/70 border border-red-900/30 hover:bg-red-900/90";
                          else if (count > 2 && count <= 4) bgClass = "bg-red-800/50 border border-red-800/20 hover:bg-red-700/80";
                          else if (count > 4 && count <= 6) bgClass = "bg-red-600/75 border border-red-600/40 hover:bg-red-500/90";
                          else if (count > 6) bgClass = "bg-red-500 border border-red-400/50 hover:bg-red-400";

                          const dateString = date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
                          const typesList = Array.from(new Set(dayData.types)).join(', ');
                          const tooltip = `${dateString}: ${count} activity events ${count > 0 ? `(${typesList})` : ''}`;

                          return (
                            <div
                              key={idx}
                              className={`w-4 h-4 rounded transition-colors cursor-help shrink-0 ${bgClass}`}
                              title={tooltip}
                            />
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-fade-in">
            {/* Left Side: Invitation form */}
            <div className="lg:col-span-1 bg-zinc-900 border border-zinc-800 p-6 rounded-2xl space-y-4 shadow-xl">
              <h2 className="text-sm font-black uppercase text-zinc-400 tracking-wider flex items-center gap-2">
                <UserPlus size={16} className="text-red-400" />
                {t('inviteCollaborator')}
              </h2>

              <form onSubmit={handleInviteSubmit} className="space-y-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase text-zinc-400 tracking-wide">
                    {t('nameLabel')}
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Sarah Thorne"
                    value={inviteName}
                    onChange={(e) => setInviteName(e.target.value)}
                    className="w-full bg-zinc-950 border border-zinc-800 text-xs font-medium text-white px-3 py-2.5 rounded-xl outline-none focus:border-red-500 transition-colors"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase text-zinc-400 tracking-wide">
                    {t('emailLabel')}
                  </label>
                  <input
                    type="email"
                    required
                    placeholder="sarah@agency.com"
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                    className="w-full bg-zinc-950 border border-zinc-800 text-xs font-medium text-white px-3 py-2.5 rounded-xl outline-none focus:border-red-500 transition-colors"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase text-zinc-400 tracking-wide">
                    {t('roleLabel')}
                  </label>
                  <select
                    value={inviteRole}
                    onChange={(e) => setInviteRole(e.target.value as any)}
                    className="w-full bg-zinc-950 border border-zinc-800 text-xs font-bold text-white px-3 py-2.5 rounded-xl outline-none focus:border-red-500 transition-colors cursor-pointer"
                  >
                    <option value="Viewer">{t('viewer')}</option>
                    <option value="Editor">{t('editor')}</option>
                    <option value="Admin">{t('admin')}</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase text-zinc-400 tracking-wide">
                    {t('projectLabel')}
                  </label>
                  <select
                    value={inviteProjectId}
                    onChange={(e) => setInviteProjectId(e.target.value)}
                    className="w-full bg-zinc-950 border border-zinc-800 text-xs font-bold text-white px-3 py-2.5 rounded-xl outline-none focus:border-red-500 transition-colors cursor-pointer"
                  >
                    <option value="all">All Organization Projects</option>
                    {projects.map(proj => (
                      <option key={proj.id} value={proj.id}>
                        {proj.title}
                      </option>
                    ))}
                  </select>
                </div>

                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full bg-red-600 hover:bg-red-500 disabled:bg-zinc-800 text-white text-xs font-black uppercase tracking-wider py-3 rounded-xl transition-all shadow-lg shadow-red-600/10 flex items-center justify-center gap-2 cursor-pointer"
                >
                  {submitting ? (
                    <Loader2 className="animate-spin" size={14} />
                  ) : (
                    <UserPlus size={14} />
                  )}
                  {t('btnInvite')}
                </button>
              </form>

              <div className="pt-4 border-t border-zinc-800">
                <button
                  type="button"
                  onClick={() => setShowBulkImportModal(true)}
                  className="w-full bg-zinc-950 hover:bg-zinc-850 border border-zinc-800 hover:border-zinc-700 text-zinc-300 text-xs font-bold py-3 rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  <FileSpreadsheet size={14} className="text-emerald-500" />
                  Bulk Import from CSV
                </button>
              </div>
            </div>

            {/* Right Side: Members list */}
            <div className="lg:col-span-2 bg-zinc-900 border border-zinc-800 p-6 rounded-2xl space-y-4 shadow-xl">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <h2 className="text-sm font-black uppercase text-zinc-400 tracking-wider">
                  Active & Invited Collaborators
                </h2>
                
                {/* Search */}
                <div className="relative w-full md:w-64">
                  <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-500" size={14} />
                  <input
                    type="text"
                    placeholder={t('searchPlaceholder')}
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full bg-zinc-950 border border-zinc-800 text-xs font-medium text-white pl-9 pr-4 py-2 rounded-xl outline-none focus:border-red-500 transition-colors"
                  />
                </div>
              </div>

              {loading ? (
                <div className="flex flex-col items-center justify-center py-20 gap-3">
                  <Loader2 className="animate-spin text-red-500" size={36} />
                  <p className="text-xs text-zinc-500 font-bold">Retrieving authorized collaborator nodes...</p>
                </div>
              ) : filteredMembers.length === 0 ? (
                <div className="flex flex-col items-center justify-center border border-dashed border-zinc-800 rounded-xl py-16 text-center">
                  <Users className="text-zinc-700 mb-2" size={32} />
                  <h3 className="text-xs font-black uppercase text-zinc-500">No team members found</h3>
                  <p className="text-[10px] text-zinc-600 mt-1 max-w-xs">
                    {searchQuery ? 'Try refining your search terms.' : 'Invite colleagues using their emails to work together on your channel projects.'}
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse text-left">
                    <thead>
                      <tr className="border-b border-zinc-800 text-[10px] font-black uppercase text-zinc-500 tracking-wider">
                        <th className="pb-3 pl-2">Collaborator</th>
                        <th className="pb-3">Role</th>
                        <th className="pb-3">Onboarding Checklist</th>
                        <th className="pb-3">Status / Duty</th>
                        <th className="pb-3 pr-2 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-800/40 text-xs">
                      {filteredMembers.map(member => {
                        const linkedProj = projects.find(p => p.id === member.project_id);
                        
                        // Find corresponding capacity row to determine onboarding progress, work status, and capacity warning
                        const capacityRow = capacities.find(c => c.member_id === member.id);
                        
                        let totalTasks = 4;
                        let completedTasks = 0;
                        if (capacityRow) {
                          try {
                            const list: OnboardingTask[] = JSON.parse(capacityRow.onboarding_checklist || '[]');
                            totalTasks = list.length || 4;
                            completedTasks = list.filter(t => t.completed).length;
                          } catch (e) {
                            completedTasks = member.status === 'active' ? 4 : 0;
                          }
                        } else {
                          completedTasks = member.status === 'active' ? 4 : 0;
                        }

                        const isOnLeave = capacityRow?.work_status === 'On Leave';
                        
                        // Check if collaborator is exceeding capacity limit by > 10%
                        const isOverCapacityMoreThan10 = capacityRow && 
                          capacityRow.work_status === 'Active' &&
                          capacityRow.weekly_capacity > 0 && 
                          capacityRow.current_load > (capacityRow.weekly_capacity * 1.10);

                        return (
                          <tr key={member.id} className="hover:bg-zinc-950/20 transition-colors">
                            <td className="py-3.5 pl-2">
                              <div className="flex items-center gap-2">
                                <div>
                                  <div className="font-bold text-white flex items-center gap-1.5">
                                    {member.name}
                                    {isOverCapacityMoreThan10 && (
                                      <div 
                                        className="inline-flex items-center gap-1 bg-red-600/10 text-red-500 text-[9px] font-black uppercase px-2 py-0.5 rounded border border-red-500/20 animate-pulse cursor-help"
                                        title={`Exceeding weekly work hours limit by ${Math.round((capacityRow.current_load / capacityRow.weekly_capacity - 1) * 100)}%!`}
                                      >
                                        <AlertTriangle size={10} className="text-red-500 animate-bounce" />
                                        <span>Over Limit</span>
                                      </div>
                                    )}
                                  </div>
                                  <div className="text-[10px] text-zinc-500 flex items-center gap-1 mt-0.5">
                                    <Mail size={10} /> {member.email}
                                  </div>
                                </div>
                              </div>
                            </td>
                            <td className="py-3.5">
                              <span className="flex items-center gap-1 text-zinc-300 font-semibold">
                                <Shield size={12} className="text-red-500/80" />
                                {member.role}
                              </span>
                            </td>
                            
                            {/* Interactive Onboarding Badge Progress bar */}
                            <td className="py-3.5">
                              {capacityRow ? (
                                <button
                                  onClick={() => {
                                    setSelectedOnboardingMember(capacityRow);
                                    setSelectedGuideTask('welcome');
                                  }}
                                  className="group flex flex-col gap-1 items-start cursor-pointer hover:bg-zinc-800/40 p-1.5 rounded-lg transition-all"
                                  title="Click to view and configure interactive onboarding walkthrough checklist"
                                >
                                  <div className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-wide text-zinc-400 group-hover:text-red-400 transition-colors">
                                    <CheckSquare size={11} className="text-zinc-500" />
                                    <span>Onboarding: {completedTasks}/{totalTasks}</span>
                                  </div>
                                  <div className="w-24 bg-zinc-950 h-1.5 rounded-full overflow-hidden border border-zinc-800">
                                    <div 
                                      className={`h-full transition-all duration-300 ${completedTasks === totalTasks ? 'bg-emerald-500' : 'bg-red-500'}`}
                                      style={{ width: `${(completedTasks / totalTasks) * 100}%` }}
                                    />
                                  </div>
                                </button>
                              ) : (
                                <span className="text-zinc-500 text-[10px] font-bold">Auto-initializing...</span>
                              )}
                            </td>

                            {/* Status Toggles: Active/On Leave */}
                            <td className="py-3.5">
                              <div className="flex flex-col gap-1 items-start">
                                <button
                                  onClick={() => capacityRow && handleToggleStatus(capacityRow)}
                                  className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-[9px] font-black uppercase tracking-wider transition-all cursor-pointer border ${
                                    isOnLeave
                                      ? 'bg-amber-500/10 text-amber-400 border-amber-500/25 hover:bg-amber-500/20' 
                                      : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/25 hover:bg-emerald-500/20'
                                  }`}
                                  title={`Click to toggle ${member.name} status to ${isOnLeave ? 'Active' : 'On Leave'}`}
                                >
                                  <span className={`w-1.5 h-1.5 rounded-full ${isOnLeave ? 'bg-amber-400 animate-pulse' : 'bg-emerald-400'}`} />
                                  <span>{isOnLeave ? 'On Leave' : 'Active'}</span>
                                </button>
                                <span className="text-[9px] text-zinc-500 italic">
                                  {isOnLeave ? 'Capacity: 0h' : `Load: ${capacityRow?.current_load || 0}h / limit: ${capacityRow?.weekly_capacity || 40}h`}
                                </span>
                              </div>
                            </td>

                            <td className="py-3.5 pr-2 text-right">
                              <div className="flex items-center justify-end gap-1.5">
                                <button
                                  onClick={() => handleOpenNotifications(member)}
                                  className="p-1.5 bg-zinc-850 hover:bg-zinc-800 text-zinc-400 hover:text-white rounded-lg transition-colors cursor-pointer"
                                  title="Notification Settings"
                                >
                                  <Bell size={12} />
                                </button>
                                <button
                                  onClick={() => {
                                    setEditingMember(member);
                                    setEditRole(member.role);
                                    setEditProjectId(member.project_id);
                                  }}
                                  className="p-1.5 bg-zinc-850 hover:bg-zinc-800 text-zinc-400 hover:text-white rounded-lg transition-colors cursor-pointer"
                                  title="Edit Permissions"
                                >
                                  <Edit3 size={12} />
                                </button>
                                <button
                                  onClick={() => setMemberToDelete(member)}
                                  className="p-1.5 bg-zinc-850 hover:bg-red-500/20 text-zinc-400 hover:text-red-400 rounded-lg transition-colors cursor-pointer"
                                  title="Revoke Access"
                                >
                                  <Trash2 size={12} />
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
            </div>
          </div>
        </>
      )}

      {activeTab === 'capacity' && (
        <div className="space-y-6 animate-fade-in" id="capacity-planner-tab">
          
          {/* Action Header controls */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-zinc-900 border border-zinc-800 p-5 rounded-2xl shadow-xl">
            <div>
              <h2 className="text-sm font-black uppercase text-zinc-200 tracking-wider flex items-center gap-2">
                <CalendarRange className="text-blue-400" size={18} />
                Strategic Capacity Allocation Control
              </h2>
              <p className="text-[11px] text-zinc-500 mt-1">
                Balance work-hour quotas, flag over-utilized resources, manage leave status, and reallocate loads to prevent burnout.
              </p>
            </div>
            
            <div className="flex flex-wrap gap-2">
              <button
                onClick={calculateRebalanceSuggestions}
                className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all text-white cursor-pointer shadow-lg shadow-blue-600/10"
              >
                <Shuffle size={12} />
                Calculate Auto-Rebalance Suggestions
              </button>
              <button
                onClick={handleExportCapacityCSV}
                className="flex items-center gap-2 px-4 py-2.5 bg-zinc-950 hover:bg-zinc-800 border border-zinc-800 hover:border-zinc-700 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all text-white cursor-pointer"
              >
                <FileDown size={12} />
                Export Capacity Data CSV
              </button>
            </div>
          </div>

          {/* Auto Rebalance suggestions panel (when calculated) */}
          {rebalanceSuggestions && (
            <div className="bg-blue-950/20 border border-blue-900/40 p-5 rounded-2xl space-y-4 animate-fade-in">
              <div className="flex items-center justify-between border-b border-blue-900/30 pb-3">
                <div className="flex items-center gap-2.5 text-blue-300">
                  <Shuffle className="animate-spin text-blue-400" size={16} />
                  <span className="text-xs font-black uppercase tracking-wider">AI Workload Optimization Proposals</span>
                </div>
                <button 
                  onClick={() => setRebalanceSuggestions(null)}
                  className="p-1 hover:bg-blue-900/20 text-blue-400 rounded-lg transition-colors"
                >
                  <X size={14} />
                </button>
              </div>

              {rebalanceSuggestions.length === 0 ? (
                <p className="text-xs text-zinc-500 italic py-2">
                  No actions needed. All active collaborators are within safe utilization parameters!
                </p>
              ) : (
                <div className="space-y-3">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {rebalanceSuggestions.map((sug, idx) => (
                      <div key={idx} className="bg-zinc-900/60 border border-zinc-800/80 p-3.5 rounded-xl space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-black uppercase text-red-400 bg-red-950/40 px-2 py-0.5 rounded border border-red-900/30">
                            Overloaded Node
                          </span>
                          <span className="text-xs text-zinc-500">→</span>
                          <span className="text-[10px] font-black uppercase text-emerald-400 bg-emerald-950/40 px-2 py-0.5 rounded border border-emerald-900/30">
                            Available Capacity
                          </span>
                        </div>
                        
                        <div className="flex justify-between text-xs font-bold text-white pt-1">
                          <span>{sug.fromName} ({sug.overCapacityBefore}h)</span>
                          <span className="text-blue-400 font-mono font-black">-{sug.hoursToTransfer}h transfer</span>
                          <span>{sug.toName} ({sug.underCapacityBefore}h)</span>
                        </div>

                        <div className="w-full bg-zinc-950 h-1 rounded-full overflow-hidden">
                          <div className="bg-blue-400 h-full" style={{ width: '40%' }} />
                        </div>

                        <div className="text-[10px] text-zinc-400 flex items-center justify-between">
                          <span>Skills matched: <strong className="text-white">{sug.skillsMatched}</strong></span>
                          <span>New levels: {sug.overCapacityAfter}h / {sug.underCapacityAfter}h</span>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="flex items-center justify-end gap-3 pt-2">
                    <button
                      onClick={() => setRebalanceSuggestions(null)}
                      className="px-4 py-2 bg-zinc-950 hover:bg-zinc-900 border border-zinc-800 text-[10px] font-black uppercase tracking-wider rounded-xl transition-all cursor-pointer text-zinc-400"
                    >
                      Reject Proposals
                    </button>
                    <button
                      onClick={handleApplyRebalance}
                      className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white text-[10px] font-black uppercase tracking-widest rounded-xl transition-all shadow-lg shadow-emerald-600/10 cursor-pointer"
                    >
                      Apply Reassignment Plan
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Core capacity profiles table */}
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 shadow-xl space-y-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-zinc-800 pb-3">
              <h3 className="text-xs font-black uppercase text-zinc-300 tracking-wider flex items-center gap-2">
                <Users className="text-blue-400" size={14} />
                Collaborator Workload Profiles ({capacities.length} total)
              </h3>
            </div>

            {/* Tag Filters Row */}
            <div className="flex flex-wrap items-center gap-3 bg-zinc-950/60 p-3 rounded-xl border border-zinc-800/80 text-[10px]">
              <div className="flex items-center gap-1.5">
                <span className="text-zinc-500 uppercase font-black tracking-wider">Department:</span>
                <select
                  value={selectedDeptFilter}
                  onChange={(e) => setSelectedDeptFilter(e.target.value)}
                  className="bg-zinc-900 border border-zinc-800 text-zinc-300 rounded px-2 py-1 outline-none font-bold cursor-pointer"
                >
                  <option value="All">All Departments</option>
                  {['Marketing', 'Engineering', 'Design', 'Product', 'Support'].map(d => (
                    <option key={d} value={d}>{d}</option>
                  ))}
                </select>
              </div>

              <div className="flex items-center gap-1.5">
                <span className="text-zinc-500 uppercase font-black tracking-wider">Seniority:</span>
                <select
                  value={selectedSeniorityFilter}
                  onChange={(e) => setSelectedSeniorityFilter(e.target.value)}
                  className="bg-zinc-900 border border-zinc-800 text-zinc-300 rounded px-2 py-1 outline-none font-bold cursor-pointer"
                >
                  <option value="All">All Seniorities</option>
                  {['Junior', 'Mid', 'Senior', 'Lead', 'Director'].map(s => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>

              <div className="flex items-center gap-1.5">
                <span className="text-zinc-500 uppercase font-black tracking-wider">Custom Group:</span>
                <select
                  value={selectedCustomFilter}
                  onChange={(e) => setSelectedCustomFilter(e.target.value)}
                  className="bg-zinc-900 border border-zinc-800 text-zinc-300 rounded px-2 py-1 outline-none font-bold cursor-pointer"
                >
                  <option value="All">All Custom Groups</option>
                  {['Growth', 'LSI-Semantic', 'Infrastructure', 'SEO Audit', 'Content Squad'].map(cg => (
                    <option key={cg} value={cg}>{cg}</option>
                  ))}
                </select>
              </div>

              {(selectedDeptFilter !== 'All' || selectedSeniorityFilter !== 'All' || selectedCustomFilter !== 'All') && (
                <button
                  onClick={() => {
                    setSelectedDeptFilter('All');
                    setSelectedSeniorityFilter('All');
                    setSelectedCustomFilter('All');
                  }}
                  className="ml-auto text-red-400 font-bold uppercase tracking-wider text-[9px] hover:text-red-300 cursor-pointer"
                >
                  Clear Filters
                </button>
              )}
            </div>

            {loadingCapacities ? (
              <div className="flex flex-col items-center justify-center py-20 gap-3">
                <Loader2 className="animate-spin text-blue-500" size={32} />
                <p className="text-xs text-zinc-500 font-bold">Recalculating allocation footprints...</p>
              </div>
            ) : capacities.length === 0 ? (
              <div className="py-12 text-center text-zinc-500 text-xs">
                No capacity profiles initialized yet. Add some collaborators first!
              </div>
            ) : (() => {
              const filteredCapacities = capacities.filter(cap => {
                const tags = getMemberTags(cap.member_id, cap.role, cap.name);
                const deptMatch = selectedDeptFilter === 'All' || tags.includes(selectedDeptFilter);
                const seniorityMatch = selectedSeniorityFilter === 'All' || tags.includes(selectedSeniorityFilter);
                const customMatch = selectedCustomFilter === 'All' || tags.includes(selectedCustomFilter);
                return deptMatch && seniorityMatch && customMatch;
              });

              if (filteredCapacities.length === 0) {
                return (
                  <div className="py-12 text-center text-zinc-550 text-xs italic">
                    No active collaborators match the current tag filters.
                  </div>
                );
              }

              return (
                <div className="space-y-4 max-h-[500px] overflow-y-auto pr-1.5 custom-scrollbar">
                  {filteredCapacities.map(cap => {
                    const utilization = cap.weekly_capacity > 0 ? (cap.current_load / cap.weekly_capacity) * 100 : 0;
                    const isOverLimit = cap.work_status === 'Active' && cap.current_load > cap.weekly_capacity;
                    const isCritical = cap.work_status === 'Active' && cap.weekly_capacity > 0 && cap.current_load > (cap.weekly_capacity * 1.10);
                    const isOnLeave = cap.work_status === 'On Leave';

                    let barColor = 'bg-emerald-500';
                    if (isOnLeave) barColor = 'bg-zinc-700';
                    else if (isCritical) barColor = 'bg-red-500 animate-pulse';
                    else if (isOverLimit) barColor = 'bg-amber-500';

                    return (
                      <div 
                        key={cap.member_id} 
                        onDragOver={(e) => e.preventDefault()}
                        onDrop={(e) => handleDropTask(e, cap)}
                        className="p-4 bg-zinc-950/40 border border-zinc-800/80 rounded-xl flex flex-col justify-between gap-4 hover:border-zinc-700 transition-all group/card relative"
                      >
                      <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-5">
                        {/* Left: Metadata */}
                        <div className="w-full lg:w-72 shrink-0 space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-white text-xs">{cap.name}</span>
                            <span className="text-[10px] bg-zinc-850 text-zinc-400 px-2 py-0.5 rounded border border-zinc-800 uppercase font-black">
                              {cap.role}
                            </span>
                          </div>
                          <p className="text-[10px] text-zinc-500">{cap.email}</p>
                          <div className="pt-1 flex flex-wrap gap-1">
                            {cap.skills.split(',').map((s, i) => (
                              <span key={i} className="text-[9px] bg-zinc-900/80 text-zinc-400 border border-zinc-850 px-2 py-0.5 rounded-lg">
                                {s.trim()}
                              </span>
                            ))}
                          </div>
                          {/* Display Member Tags */}
                          <div className="flex flex-wrap gap-1 pt-1.5">
                            {getMemberTags(cap.member_id, cap.role, cap.name).map((tag, idx) => {
                              let tagStyle = 'bg-zinc-950 border-zinc-800/60 text-zinc-400';
                              if (['Marketing', 'Engineering', 'Design', 'Product', 'Support'].includes(tag)) {
                                tagStyle = 'bg-blue-950/40 border-blue-900/30 text-blue-400';
                              } else if (['Junior', 'Mid', 'Senior', 'Lead', 'Director'].includes(tag)) {
                                tagStyle = 'bg-amber-950/40 border-amber-900/30 text-amber-400';
                              } else {
                                tagStyle = 'bg-purple-950/40 border-purple-900/30 text-purple-400';
                              }
                              return (
                                <span key={idx} className={`text-[8.5px] font-black uppercase tracking-wider px-2 py-0.5 rounded border leading-none ${tagStyle}`}>
                                  {tag}
                                </span>
                              );
                            })}
                          </div>
                        </div>

                        {/* Middle: Workload Visual progress bar */}
                        <div className="flex-1 flex flex-col justify-center space-y-1.5 min-w-[200px]">
                          <div className="flex items-center justify-between text-[11px] font-bold">
                            <span className="text-zinc-400 flex items-center gap-1.5">
                              Workload Quota Allocation
                              {isCritical && (
                                <span className="text-red-400 animate-pulse bg-red-950/40 border border-red-900/30 px-1.5 py-0.5 rounded text-[8px] uppercase font-black">
                                  &gt;10% Over Capacity
                                </span>
                              )}
                            </span>
                            <span className="font-mono text-white">
                              {isOnLeave ? '0 hrs (On Leave)' : `${cap.current_load}h / ${cap.weekly_capacity}h (${Math.round(utilization)}%)`}
                            </span>
                          </div>
                          
                          <div className="w-full bg-zinc-950 h-3 rounded-full overflow-hidden border border-zinc-850 p-[2px]">
                            <div 
                              className={`h-full rounded-full transition-all duration-500 ${barColor}`}
                              style={{ width: `${Math.min(utilization, 100)}%` }}
                            />
                          </div>
                        </div>

                        {/* Right: Actions and On Leave toggle */}
                        <div className="flex items-center justify-end gap-2.5 shrink-0 self-end lg:self-center">
                          {/* Status Toggle (Active/On Leave) */}
                          <div className="flex flex-col items-end gap-0.5">
                            <span className="text-[9px] font-black uppercase tracking-wider text-zinc-500">Status Toggle</span>
                            <button
                              onClick={() => handleToggleStatus(cap)}
                              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[10px] font-bold uppercase tracking-wider border transition-all cursor-pointer ${
                                isOnLeave 
                                  ? 'bg-amber-500/10 text-amber-400 border-amber-500/25 hover:bg-amber-500/20' 
                                  : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/25 hover:bg-emerald-500/20'
                              }`}
                            >
                              <span className={`w-1.5 h-1.5 rounded-full ${isOnLeave ? 'bg-amber-400 animate-pulse' : 'bg-emerald-400'}`} />
                              {isOnLeave ? 'On Leave' : 'Active Duty'}
                            </button>
                          </div>

                          {/* Skills Matrix Button */}
                          <button
                            onClick={() => handleOpenSkillsMatrix(cap)}
                            className="flex items-center gap-1 px-2.5 py-2 bg-emerald-950/30 hover:bg-emerald-950/50 border border-emerald-900/40 text-[10px] text-emerald-400 font-bold rounded-xl transition-all cursor-pointer"
                          >
                            <Layers size={11} />
                            Skills Matrix
                          </button>

                          {/* Manage Tags Button */}
                          <button
                            onClick={() => {
                              setEditingTagsMember(cap);
                              const tags = getMemberTags(cap.member_id, cap.role, cap.name);
                              const dept = tags.find(t => ['Marketing', 'Engineering', 'Design', 'Product', 'Support'].includes(t)) || 'Marketing';
                              const seniority = tags.find(t => ['Junior', 'Mid', 'Senior', 'Lead', 'Director'].includes(t)) || 'Senior';
                              const custom = tags.find(t => !['Marketing', 'Engineering', 'Design', 'Product', 'Support', 'Junior', 'Mid', 'Senior', 'Lead', 'Director'].includes(t)) || 'Growth';
                              setMemberDeptInput(dept);
                              setMemberSeniorityInput(seniority);
                              setMemberCustomInput(custom);
                            }}
                            className="flex items-center gap-1 px-2.5 py-2 bg-purple-950/30 hover:bg-purple-950/50 border border-purple-900/40 text-[10px] text-purple-400 font-bold rounded-xl transition-all cursor-pointer"
                          >
                            <Edit3 size={11} />
                            Tags
                          </button>

                          {/* Edit Workloads Button */}
                          <button
                            onClick={() => setEditingCapacityMember(cap)}
                            className="flex items-center gap-1.5 px-3.5 py-2 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 hover:border-zinc-700 text-xs text-white font-bold rounded-xl transition-all cursor-pointer self-end"
                          >
                            <Edit3 size={11} />
                            Configure Quotas
                          </button>
                        </div>
                      </div>

                      {/* Forecast Allocations List */}
                      {assignedForecastTasks[cap.member_id] && assignedForecastTasks[cap.member_id].length > 0 && (
                        <div className="pt-2 border-t border-zinc-900 flex flex-wrap gap-2 items-center">
                          <span className="text-[9px] font-black uppercase text-zinc-500 mr-2">Allocated Forecast Tasks:</span>
                          {assignedForecastTasks[cap.member_id].map(task => (
                            <div key={task.id} className="flex items-center gap-1.5 bg-zinc-900/90 border border-zinc-800 text-[10px] text-zinc-300 pl-2.5 pr-1 py-1 rounded-xl">
                              <span className="font-semibold">{task.title}</span>
                              <span className="text-zinc-500 text-[9px] bg-zinc-950 px-1.5 py-0.5 rounded-lg">{task.hours}h</span>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleRemoveForecastTask(cap.member_id, task.id, task.hours);
                                }}
                                className="p-1 hover:bg-red-950 hover:text-red-400 text-zinc-500 rounded-lg transition-colors cursor-pointer"
                              >
                                <X size={10} />
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            );
          })()}
          </div>

          {/* Resource Allocation Forecast Panel */}
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 shadow-xl space-y-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-zinc-800 pb-4">
              <div>
                <h3 className="text-xs font-black uppercase text-zinc-300 tracking-wider flex items-center gap-2">
                  <Layers className="text-blue-400" size={14} />
                  Resource Allocation Forecast (Tactile Drag & Drop Planner)
                </h3>
                <p className="text-[10px] text-zinc-500 mt-1">
                  Drag upcoming project campaign tasks directly onto a team member's card above, or use the quick assignment dropdown menu below.
                </p>
              </div>
              <span className="text-[10px] bg-blue-500/10 border border-blue-500/20 text-blue-400 px-3 py-1 rounded-xl font-bold font-mono">
                {UPCOMING_TASKS.length} Forecast Tasks Available
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {UPCOMING_TASKS.map(task => {
                const isAssignedAnywhere = Object.values(assignedForecastTasks).some(list => list.some(t => t.id === task.id));
                return (
                  <div
                    key={task.id}
                    draggable
                    onDragStart={(e) => {
                      e.dataTransfer.setData('taskId', task.id);
                      setDraggedTaskId(task.id);
                    }}
                    className={`p-4 rounded-xl border flex flex-col justify-between gap-3 transition-all relative cursor-grab active:cursor-grabbing shadow-lg ${
                      isAssignedAnywhere 
                        ? 'bg-zinc-950/40 border-zinc-900 opacity-60' 
                        : 'bg-zinc-950 border-zinc-850 hover:border-blue-550 hover:bg-zinc-950/80'
                    }`}
                  >
                    <div>
                      <div className="flex items-start justify-between gap-2">
                        <span className="font-bold text-white text-xs leading-snug">{task.title}</span>
                        <span className="text-[10px] bg-blue-950 text-blue-400 border border-blue-900/40 px-2 py-0.5 rounded-lg shrink-0 font-bold font-mono">
                          {task.hours}h
                        </span>
                      </div>
                      <p className="text-[10px] text-zinc-500 mt-1.5 flex items-center gap-1.5 font-medium">
                        <Sparkles size={11} className="text-blue-400" />
                        Requires: {task.skill}
                      </p>
                    </div>

                    <div className="pt-2.5 border-t border-zinc-900/60 flex items-center justify-between">
                      <span className="text-[9px] font-black uppercase text-zinc-500 tracking-wider">
                        {isAssignedAnywhere ? '✓ Allocated' : '✋ Drag & Drop'}
                      </span>
                      
                      <select
                        onChange={(e) => {
                          if (e.target.value) {
                            handleManualAllocateTask(task.id, e.target.value);
                            e.target.value = ''; // Reset selector
                          }
                        }}
                        disabled={isAssignedAnywhere}
                        className="bg-zinc-900 border border-zinc-800 text-[9px] font-black uppercase tracking-wider text-zinc-400 px-2.5 py-1.5 rounded-xl outline-none focus:border-blue-500 transition-all cursor-pointer disabled:opacity-40"
                      >
                        <option value="">Allocate...</option>
                        {capacities.filter(c => c.work_status === 'Active').map(c => (
                          <option key={c.member_id} value={c.member_id}>
                            {c.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Overdue & Unassigned Task Auto-Balancer Panel */}
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 shadow-xl space-y-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-zinc-800 pb-4">
              <div>
                <h3 className="text-xs font-black uppercase text-zinc-300 tracking-wider flex items-center gap-2">
                  <Sparkles className="text-purple-400" size={14} />
                  Algorithmic Workload Auto-Balancer (Skill-Matrix Guided Optimizer)
                </h3>
                <p className="text-[10px] text-zinc-500 mt-1">
                  Reallocates overdue or unassigned team campaign tasks dynamically to qualified members with the lowest projected workload capacity.
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleResetAutoBalance}
                  className="px-3.5 py-2 bg-zinc-950 border border-zinc-850 hover:border-zinc-750 text-xs text-zinc-400 font-bold rounded-xl transition-all cursor-pointer"
                >
                  Reset Balance
                </button>
                <button
                  onClick={handleExecuteAutoBalance}
                  disabled={isAutoBalancing}
                  className="flex items-center gap-1.5 px-4 py-2 bg-purple-650 hover:bg-purple-600 text-xs text-white font-bold rounded-xl transition-all cursor-pointer disabled:opacity-50"
                >
                  <Sparkles size={12} className={isAutoBalancing ? 'animate-spin' : ''} />
                  {isAutoBalancing ? 'Optimizing...' : 'Execute Smart Auto-Balance'}
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
              {autoBalanceTasks.map(task => {
                let statusBadge = 'bg-amber-950 text-amber-400 border-amber-900/40';
                if (task.status === 'Overdue') {
                  statusBadge = 'bg-red-950/40 text-red-400 border-red-900/30';
                }
                return (
                  <div key={task.id} className="p-4 bg-zinc-950 border border-zinc-850 rounded-xl flex flex-col justify-between gap-3 relative overflow-hidden group">
                    <div>
                      <div className="flex items-center justify-between gap-1.5 mb-1">
                        <span className={`text-[8px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded border leading-none ${statusBadge}`}>
                          {task.status}
                        </span>
                        <span className="text-[8px] font-mono text-zinc-500">Due: {task.dueDate}</span>
                      </div>
                      <span className="font-bold text-white text-xs leading-snug block">{task.title}</span>
                      <p className="text-[9.5px] text-zinc-500 mt-1.5 flex items-center gap-1 font-medium">
                        Required skill: <span className="text-zinc-300 font-semibold">{task.skillRequired}</span>
                      </p>
                    </div>

                    <div className="pt-2 border-t border-zinc-900 flex items-center justify-between text-[10px]">
                      <span className="text-zinc-400 font-bold font-mono bg-zinc-900 px-2 py-0.5 rounded-lg border border-zinc-850">
                        {task.hours}h
                      </span>
                      {task.assignedTo ? (
                        <div className="flex flex-col items-end">
                          <span className="text-[8px] uppercase font-black tracking-wider text-purple-400">Assigned To</span>
                          <span className="font-bold text-white text-[10px] truncate max-w-[100px]">{task.assignedName}</span>
                        </div>
                      ) : (
                        <span className="text-zinc-600 font-black uppercase tracking-wider text-[8px] animate-pulse">Pending Balance</span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'leaves_reports' && (
        <div className="space-y-6 animate-fade-in" id="leaves-reports-tab">
          
          {/* Capacity Heatmap Visualization Panel */}
          <div className="bg-zinc-900 border border-zinc-800 p-6 rounded-2xl shadow-xl space-y-4" id="capacity-heatmap-panel">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-zinc-800 pb-4">
              <div>
                <h3 className="text-xs font-black uppercase text-zinc-300 tracking-wider flex items-center gap-2">
                  <Flame className="text-orange-500 animate-pulse" size={14} />
                  12-Week Team Capacity Heatmap & Bandwidth Gaps
                </h3>
                <p className="text-[10px] text-zinc-500 mt-1">
                  Overlays scheduled leaves on individual capacity quotas to visually highlight future delivery blockades and resource shortages.
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-4 text-[9px] text-zinc-400">
                <div className="flex items-center gap-1.5">
                  <div className="w-3.5 h-3.5 rounded bg-emerald-950/80 border border-emerald-900/30" />
                  <span>Full Capacity (Active)</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-3.5 h-3.5 rounded bg-amber-950/80 border border-amber-900/30" />
                  <span>Low Quota (&lt; 20h)</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-3.5 h-3.5 rounded bg-red-950/80 border border-red-900/30 animate-pulse" />
                  <span>0 hrs (Planned Leave)</span>
                </div>
              </div>
            </div>

            <div className="overflow-x-auto custom-scrollbar pt-2">
              <div className="min-w-[800px] space-y-2">
                {/* Header Row: Weeks */}
                <div className="grid gap-1 pb-1.5 border-b border-zinc-800/40 text-center text-[9px] font-black uppercase tracking-wider text-zinc-500" style={{ gridTemplateColumns: 'repeat(13, minmax(0, 1fr))' }}>
                  <div className="text-left font-bold text-[10px] text-zinc-400">Team Node</div>
                  {get12WeeksHorizon().map((week) => (
                    <div key={week.index} className="group relative cursor-help">
                      <span className="hover:text-white transition-colors">{week.label}</span>
                      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block bg-zinc-950 border border-zinc-850 text-[9px] text-zinc-300 font-medium px-2 py-1 rounded shadow-xl whitespace-nowrap z-30">
                        {week.dateStr}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Data Rows */}
                {capacities.length === 0 ? (
                  <p className="text-xs text-zinc-600 italic text-center py-6">No capacity profiles loaded.</p>
                ) : (
                  <div className="divide-y divide-zinc-900/60 space-y-1.5">
                    {capacities.map((cap) => (
                      <div key={cap.member_id} className="grid gap-1 items-center py-1" style={{ gridTemplateColumns: 'repeat(13, minmax(0, 1fr))' }}>
                        <div className="text-left truncate pr-2">
                          <span className="text-xs font-bold text-white block truncate">{cap.name}</span>
                          <span className="text-[8px] text-zinc-500 font-mono block uppercase truncate">{cap.role}</span>
                        </div>

                        {get12WeeksHorizon().map((week) => {
                          const isLeave = isMemberOnLeaveForWeek(cap.member_id, week.start, week.end, leaves);
                          const activeCapacity = isLeave ? 0 : cap.weekly_capacity;
                          
                          let cellColor = 'bg-emerald-950/60 border-emerald-900/35 hover:bg-emerald-900/40 text-emerald-400';
                          let capText = `${activeCapacity}h`;
                          
                          if (isLeave) {
                            cellColor = 'bg-red-950/60 border-red-900/45 hover:bg-red-900/40 text-red-400 animate-pulse';
                            capText = 'LEAVE';
                          } else if (activeCapacity < 20) {
                            cellColor = 'bg-amber-950/60 border-amber-900/35 hover:bg-amber-900/40 text-amber-400';
                          }

                          return (
                            <div
                              key={week.index}
                              className={`h-10 rounded-lg border flex flex-col items-center justify-center text-[9px] font-black font-mono transition-all duration-200 cursor-pointer relative group ${cellColor}`}
                            >
                              <span>{capText}</span>
                              <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block bg-zinc-950 border border-zinc-850 text-[10px] p-2.5 rounded-xl shadow-2xl space-y-1 z-30 min-w-44 text-left leading-normal">
                                <div className="font-bold text-white text-xs">{cap.name}</div>
                                <div className="text-[9px] text-zinc-500 font-medium">Week: {week.dateStr}</div>
                                <div className="text-[9.5px] border-t border-zinc-850 pt-1 mt-1">
                                  {isLeave ? (
                                    <span className="text-red-400 font-bold uppercase">🚨 Planned Leave Blocked</span>
                                  ) : (
                                    <span>Available Bandwidth: <strong className="text-emerald-400">{activeCapacity} hours</strong></span>
                                  )}
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Left/Middle Column: Leave & Availability Calendar */}
            <div className="lg:col-span-2 space-y-6">
              
              {/* Request/Plan Leave Form */}
              <div className="bg-zinc-900 border border-zinc-800 p-6 rounded-2xl space-y-4 shadow-xl">
                <h2 className="text-sm font-black uppercase text-zinc-300 tracking-wider flex items-center gap-2">
                  <Calendar size={16} className="text-emerald-400" />
                  Schedule Planned Leave & Availability limits
                </h2>
                <p className="text-[10px] text-zinc-500">
                  Register upcoming vacation, sabbatical, or sick leaves. Once approved, the system automatically marks the team member as 'On Leave' and drops their work hours limit to zero during those dates.
                </p>

                <form onSubmit={handlePostLeave} className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="space-y-1">
                    <label className="text-[9px] font-black uppercase text-zinc-400">Team Member</label>
                    <select
                      value={newLeaveMemberId}
                      onChange={(e) => setNewLeaveMemberId(e.target.value)}
                      className="w-full bg-zinc-950 border border-zinc-800 text-xs font-bold text-white px-3 py-2.5 rounded-xl outline-none focus:border-emerald-500 transition-colors cursor-pointer"
                    >
                      <option value="">Select Member...</option>
                      {capacities.map(c => (
                        <option key={c.member_id} value={c.member_id}>
                          {c.name} ({c.work_status})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[9px] font-black uppercase text-zinc-400">Start Date</label>
                    <input
                      type="date"
                      value={newLeaveStartDate}
                      onChange={(e) => setNewLeaveStartDate(e.target.value)}
                      className="w-full bg-zinc-950 border border-zinc-800 text-xs font-medium text-white px-3 py-2 rounded-xl outline-none focus:border-emerald-500 transition-colors"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[9px] font-black uppercase text-zinc-400">End Date</label>
                    <input
                      type="date"
                      value={newLeaveEndDate}
                      onChange={(e) => setNewLeaveEndDate(e.target.value)}
                      className="w-full bg-zinc-950 border border-zinc-800 text-xs font-medium text-white px-3 py-2 rounded-xl outline-none focus:border-emerald-500 transition-colors"
                    />
                  </div>

                  <div className="sm:col-span-3 space-y-1">
                    <label className="text-[9px] font-black uppercase text-zinc-400">Reason / Description of Leave</label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        placeholder="E.g., Summer Vacation, Medical Checkup, Family Trip"
                        value={newLeaveReason}
                        onChange={(e) => setNewLeaveReason(e.target.value)}
                        className="flex-1 bg-zinc-950 border border-zinc-800 text-xs font-medium text-white px-3 py-2.5 rounded-xl outline-none focus:border-emerald-500 transition-colors"
                      />
                      <button
                        type="submit"
                        disabled={isSubmittingLeave}
                        className="bg-emerald-600 hover:bg-emerald-500 disabled:bg-zinc-800 text-white text-xs font-black uppercase tracking-wider px-5 py-2.5 rounded-xl transition-all shadow-lg shadow-emerald-600/10 flex items-center gap-1.5 cursor-pointer"
                      >
                        {isSubmittingLeave ? <Loader2 className="animate-spin" size={12} /> : <Plus size={12} />}
                        Log Leave
                      </button>
                    </div>
                  </div>
                </form>
              </div>

              {/* Leave Calendar Overview */}
              <div className="bg-zinc-900 border border-zinc-800 p-6 rounded-2xl space-y-4 shadow-xl">
                <h3 className="text-xs font-black uppercase text-zinc-300 tracking-wider flex items-center gap-2">
                  <CalendarRange className="text-emerald-400" size={14} />
                  Active Planned Leaves Calendar List ({leaves.length})
                </h3>

                {loadingLeaves ? (
                  <div className="flex justify-center py-8">
                    <Loader2 className="animate-spin text-emerald-500" size={20} />
                  </div>
                ) : leaves.length === 0 ? (
                  <div className="text-center py-8 text-zinc-600 text-xs font-medium">
                    No active or planned leaves scheduled. System capacity is at 100%.
                  </div>
                ) : (
                  <div className="space-y-3.5 max-h-[380px] overflow-y-auto pr-1.5 custom-scrollbar">
                    {leaves.map(l => {
                      const start = new Date(l.start_date).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
                      const end = new Date(l.end_date).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
                      
                      return (
                        <div key={l.id} className="p-3.5 bg-zinc-950/50 border border-zinc-850 rounded-xl flex items-center justify-between gap-4">
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-black text-white">{l.name}</span>
                              <span className="text-[8px] bg-emerald-950 text-emerald-400 border border-emerald-900/40 px-1.5 py-0.5 rounded uppercase font-black font-mono">
                                {l.status}
                              </span>
                            </div>
                            <p className="text-[10px] text-zinc-500">Duration: <strong className="text-zinc-300">{start}</strong> to <strong className="text-zinc-300">{end}</strong></p>
                            <p className="text-[10px] text-zinc-400 italic">“{l.reason}”</p>
                          </div>

                          <button
                            onClick={() => handleDeleteLeave(l.id)}
                            className="p-2 bg-zinc-900 hover:bg-red-950 text-zinc-500 hover:text-red-400 border border-zinc-800 hover:border-red-900/30 rounded-xl transition-all cursor-pointer"
                            title="Cancel Leave Block"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            {/* Right Column: Weekly Workload Reports */}
            <div className="lg:col-span-1 space-y-6">

              {/* Vacation / Availability Loss Quarter Report */}
              <div className="bg-zinc-900 border border-zinc-800 p-6 rounded-2xl space-y-4 shadow-xl">
                <div className="flex items-center gap-2 border-b border-zinc-800 pb-3">
                  <Flame className="text-amber-500 animate-pulse" size={14} />
                  <h3 className="text-xs font-black uppercase text-zinc-300 tracking-wider">
                    Quarterly Availability Loss Report
                  </h3>
                </div>

                {(() => {
                  const { totalDaysLost, totalHoursLost, memberImpacts } = getUpcomingQuarterImpact();
                  
                  let riskLevel = 'LOW RISK';
                  let riskColor = 'text-emerald-400 bg-emerald-950/40 border-emerald-900/30';
                  if (totalHoursLost > 120) {
                    riskLevel = 'SEVERE BLOCKADE';
                    riskColor = 'text-red-400 bg-red-950/40 border-red-900/30';
                  } else if (totalHoursLost > 40) {
                    riskLevel = 'MODERATE GAP';
                    riskColor = 'text-amber-400 bg-amber-950/40 border-amber-900/30';
                  }

                  return (
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-3">
                        <div className="bg-zinc-950 p-3 rounded-xl border border-zinc-850 text-center">
                          <span className="text-[8px] font-black uppercase tracking-wider text-zinc-500 block">Total Days Lost</span>
                          <span className="text-lg font-mono font-bold text-white block mt-1">{totalDaysLost} Days</span>
                        </div>
                        <div className="bg-zinc-950 p-3 rounded-xl border border-zinc-850 text-center">
                          <span className="text-[8px] font-black uppercase tracking-wider text-zinc-500 block">Capacity Lost</span>
                          <span className="text-lg font-mono font-bold text-zinc-300 block mt-1">{totalHoursLost} Hrs</span>
                        </div>
                      </div>

                      <div className={`p-3 rounded-xl border flex items-center justify-between text-[10px] ${riskColor}`}>
                        <span className="font-black uppercase tracking-wider">Project Timeline Delay Risk:</span>
                        <span className="font-bold font-mono px-2 py-0.5 bg-black/40 rounded border border-white/5">{riskLevel}</span>
                      </div>

                      {memberImpacts.length > 0 ? (
                        <div className="space-y-2">
                          <span className="text-[8.5px] font-black uppercase tracking-wider text-zinc-400 block">Individual Impact Contributors:</span>
                          <div className="space-y-1.5 max-h-[150px] overflow-y-auto pr-1 custom-scrollbar">
                            {memberImpacts.map((mi, idx) => (
                              <div key={idx} className="flex items-center justify-between p-2 bg-zinc-950/40 border border-zinc-850/60 rounded-lg text-[10px]">
                                <span className="font-semibold text-zinc-300">{mi.name}</span>
                                <div className="flex items-center gap-2 text-zinc-400 font-mono">
                                  <span>{mi.days}d lost</span>
                                  <span className="text-zinc-600">|</span>
                                  <span className="text-zinc-300 font-bold">-{mi.hours}h</span>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      ) : (
                        <p className="text-[10px] text-zinc-550 italic leading-normal text-center py-2">
                          No scheduled leaves within the next 90 days. Project timelines are secure.
                        </p>
                      )}
                    </div>
                  );
                })()}
              </div>
              
              {/* Compile Report Actions */}
              <div className="bg-zinc-900 border border-zinc-800 p-6 rounded-2xl space-y-4 shadow-xl">
                <h3 className="text-xs font-black uppercase text-zinc-300 tracking-wider flex items-center gap-2">
                  <ClipboardList className="text-purple-400" size={14} />
                  Automated Workload Report Engine
                </h3>
                <p className="text-[10px] text-zinc-500">
                  Compile an exhaustive workload audit summary of team health, capacity bounds, and leave indicators. This report will also automatically broadcast a system notification summary to the workspace owner.
                </p>

                <button
                  type="button"
                  onClick={handleGenerateWeeklyReport}
                  disabled={isGeneratingReport}
                  className="w-full bg-zinc-950 hover:bg-zinc-850 border border-zinc-800 hover:border-zinc-700 text-zinc-100 text-xs font-black uppercase tracking-wider py-3 rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer shadow-md"
                >
                  {isGeneratingReport ? (
                    <Loader2 className="animate-spin text-purple-400" size={14} />
                  ) : (
                    <Sparkles size={14} className="text-purple-400 animate-pulse" />
                  )}
                  Compile Weekly Capacity Report
                </button>
              </div>

              {/* History list of capacity reports */}
              <div className="bg-zinc-900 border border-zinc-800 p-6 rounded-2xl space-y-4 shadow-xl">
                <h3 className="text-xs font-black uppercase text-zinc-400 tracking-wider">
                  Report Compilation History
                </h3>

                {loadingReports ? (
                  <div className="flex justify-center py-8">
                    <Loader2 className="animate-spin text-purple-400" size={16} />
                  </div>
                ) : weeklyReports.length === 0 ? (
                  <p className="text-xs text-zinc-600 italic py-4">
                    No capacity reports compiled yet. Press the button above to generate.
                  </p>
                ) : (
                  <div className="space-y-3 max-h-[350px] overflow-y-auto pr-1">
                    {weeklyReports.map(rep => {
                      const isSelected = selectedReport?.id === rep.id;
                      return (
                        <div
                          key={rep.id}
                          onClick={() => setSelectedReport(isSelected ? null : rep)}
                          className={`p-3.5 border rounded-xl cursor-pointer transition-all space-y-1.5 ${
                            isSelected
                              ? 'bg-purple-950/20 border-purple-800/60'
                              : 'bg-zinc-950/60 border-zinc-850 hover:border-zinc-750'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <span className="text-[11px] font-black text-white">Week of {rep.week_start}</span>
                            <span className="text-[8px] bg-purple-950 text-purple-400 px-1.5 py-0.5 rounded uppercase font-black">
                              Review Detail
                            </span>
                          </div>
                          <p className="text-[10px] text-zinc-400 line-clamp-2 leading-relaxed">
                            {rep.summary}
                          </p>
                          <div className="text-[8px] text-zinc-600 font-mono font-bold uppercase">
                            Compiled: {new Date(rep.created_at).toLocaleDateString()}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Expanded Report Details View (When clicked) */}
          {selectedReport && (
            <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 shadow-2xl space-y-5 animate-fade-in">
              <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
                <div className="flex items-center gap-2">
                  <ClipboardList className="text-purple-400" size={16} />
                  <span className="text-xs font-black uppercase text-white tracking-wider">
                    Workload Health Audit Details — Week of {selectedReport.week_start}
                  </span>
                </div>
                <button
                  onClick={() => setSelectedReport(null)}
                  className="p-1 hover:bg-zinc-800 text-zinc-500 hover:text-white rounded-lg transition-colors"
                >
                  <X size={14} />
                </button>
              </div>

              {/* Parsed JSON metrics dashboard */}
              {(() => {
                try {
                  const data = JSON.parse(selectedReport.report_details);
                  return (
                    <div className="space-y-4">
                      {/* KPI Metric cards */}
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5">
                        <div className="bg-zinc-950 border border-zinc-850 p-4 rounded-xl text-center space-y-0.5">
                          <div className="text-[9px] font-black uppercase text-zinc-500">Utilization Rate</div>
                          <div className="text-xl font-black text-purple-400">{data.average_utilization}%</div>
                        </div>
                        <div className="bg-zinc-950 border border-zinc-850 p-4 rounded-xl text-center space-y-0.5">
                          <div className="text-[9px] font-black uppercase text-zinc-500">Total Hours Loaded</div>
                          <div className="text-xl font-black text-white">{data.total_load_hours} hrs</div>
                        </div>
                        <div className="bg-zinc-950 border border-zinc-850 p-4 rounded-xl text-center space-y-0.5">
                          <div className="text-[9px] font-black uppercase text-zinc-500">Total Work Hours Available</div>
                          <div className="text-xl font-black text-white">{data.total_capacity_hours} hrs</div>
                        </div>
                        <div className="bg-zinc-950 border border-zinc-850 p-4 rounded-xl text-center space-y-0.5">
                          <div className="text-[9px] font-black uppercase text-zinc-500">Overburdened Nodes</div>
                          <div className={`text-xl font-black ${data.over_capacity_count > 0 ? 'text-red-400 animate-pulse' : 'text-emerald-400'}`}>
                            {data.over_capacity_count}
                          </div>
                        </div>
                      </div>

                      {/* Individual breakdowns table inside reports */}
                      <div className="bg-zinc-950 border border-zinc-850 rounded-xl p-4 space-y-3">
                        <div className="text-[9px] font-black uppercase text-zinc-400 tracking-wider">
                          Individual Workload Ratios
                        </div>
                        <div className="space-y-2.5 max-h-[300px] overflow-y-auto pr-1">
                          {(data.member_breakdown || []).map((m: any, idx: number) => (
                            <div key={idx} className="flex items-center justify-between p-2.5 bg-zinc-900/40 border border-zinc-900 rounded-lg text-xs">
                              <div>
                                <span className="font-bold text-white">{m.name}</span>
                                <span className="text-[9px] text-zinc-500 ml-2 font-mono uppercase">{m.role}</span>
                              </div>
                              <div className="flex items-center gap-3">
                                <span className={`text-[10px] font-bold ${m.work_status === 'On Leave' ? 'text-amber-400' : m.utilization > 100 ? 'text-red-400' : 'text-zinc-300'}`}>
                                  {m.work_status === 'On Leave' ? 'On Leave (0 hrs)' : `${m.current_load}h / ${m.weekly_capacity}h (${m.utilization}%)`}
                                </span>
                                <div className="w-16 bg-zinc-900 h-1.5 rounded-full overflow-hidden">
                                  <div 
                                    className={`h-full ${m.work_status === 'On Leave' ? 'bg-zinc-700' : m.utilization > 100 ? 'bg-red-500' : 'bg-emerald-500'}`} 
                                    style={{ width: `${Math.min(m.utilization, 100)}%` }}
                                  />
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  );
                } catch (e) {
                  return <p className="text-xs text-red-400">Failed to parse detailed metrics payload.</p>;
                }
              })()}
            </div>
          )}
        </div>
      )}

      {activeTab === 'performance' && (
        <div className="space-y-6 animate-fade-in" id="performance-tab">
          
          {/* Dashboard Header Banner */}
          <div className="bg-zinc-900 border border-zinc-800 p-6 rounded-2xl shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h2 className="text-sm font-black uppercase text-zinc-200 tracking-wider flex items-center gap-2">
                <Sparkles className="text-red-500 animate-pulse" size={18} />
                Team Performance & Productivity Insights
              </h2>
              <p className="text-[11px] text-zinc-500 mt-1">
                Correlates average task completion velocity (days), historical campaign output counts, and skill alignment levels.
              </p>
            </div>
            
            {/* Quick stats totals */}
            <div className="flex gap-4">
              <div className="bg-zinc-950 border border-zinc-850 px-4 py-2.5 rounded-xl text-center min-w-28">
                <div className="text-[9px] font-black text-zinc-500 uppercase tracking-wider">Avg Velocity</div>
                <div className="text-sm font-black text-red-400 font-mono mt-1">2.8 Days</div>
              </div>
              <div className="bg-zinc-950 border border-zinc-850 px-4 py-2.5 rounded-xl text-center min-w-28">
                <div className="text-[9px] font-black text-zinc-500 uppercase tracking-wider">Active Output</div>
                <div className="text-sm font-black text-blue-400 font-mono mt-1">162 Tasks</div>
              </div>
              <div className="bg-zinc-950 border border-zinc-850 px-4 py-2.5 rounded-xl text-center min-w-28">
                <div className="text-[9px] font-black text-zinc-500 uppercase tracking-wider">Overall Efficiency</div>
                <div className="text-sm font-black text-emerald-400 font-mono mt-1">91.4%</div>
              </div>
            </div>
          </div>

          {/* Productivity Trends Over Time Chart Section */}
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 shadow-xl space-y-4">
            <div>
              <h3 className="text-xs font-black uppercase text-zinc-300 tracking-wider">Overall Workspace Productivity Trends (6-Month Horizon)</h3>
              <p className="text-[10px] text-zinc-500">Aggregate team completed tasks volume contrasted with average turnaround speed.</p>
            </div>

            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                  data={[
                    { month: 'Jan', completed: 22, avgDays: 3.4 },
                    { month: 'Feb', completed: 28, avgDays: 3.1 },
                    { month: 'Mar', completed: 35, avgDays: 2.9 },
                    { month: 'Apr', completed: 31, avgDays: 2.7 },
                    { month: 'May', completed: 42, avgDays: 2.5 },
                    { month: 'Jun', completed: 48, avgDays: 2.3 },
                  ]}
                  margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
                >
                  <defs>
                    <linearGradient id="completedGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.2}/>
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="velocityGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#ef4444" stopOpacity={0.2}/>
                      <stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
                  <XAxis dataKey="month" stroke="#71717a" fontSize={10} tickLine={false} />
                  <YAxis yAxisId="left" stroke="#10b981" fontSize={10} tickLine={false} label={{ value: 'Tasks Completed', angle: -90, position: 'insideLeft', style: { fill: '#10b981', fontSize: 10, fontWeight: 'bold' } }} />
                  <YAxis yAxisId="right" orientation="right" stroke="#ef4444" fontSize={10} tickLine={false} label={{ value: 'Avg Days to Complete', angle: 90, position: 'insideRight', style: { fill: '#ef4444', fontSize: 10, fontWeight: 'bold' } }} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#09090b', borderColor: '#27272a', borderRadius: '12px' }}
                    labelStyle={{ color: '#fff', fontWeight: 'bold', fontSize: '11px' }}
                    itemStyle={{ fontSize: '10px' }}
                  />
                  <Legend wrapperStyle={{ fontSize: '10px', paddingTop: '10px' }} />
                  <Area yAxisId="left" type="monotone" dataKey="completed" name="Completed Tasks" stroke="#10b981" fillOpacity={1} fill="url(#completedGrad)" strokeWidth={2} />
                  <Area yAxisId="right" type="monotone" dataKey="avgDays" name="Velocity (Avg Days)" stroke="#ef4444" fillOpacity={1} fill="url(#velocityGrad)" strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Individual Member Comparison and In-depth breakdown */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left side: Member Selector Table */}
            <div className="lg:col-span-1 bg-zinc-900 border border-zinc-800 rounded-2xl p-5 shadow-xl space-y-4">
              <div>
                <h3 className="text-xs font-black uppercase text-zinc-300 tracking-wider">Active Team Roster</h3>
                <p className="text-[10px] text-zinc-500">Select a team member to filter and inspect individual velocity trends.</p>
              </div>

              {capacities.length === 0 ? (
                <p className="text-xs text-zinc-500 italic text-center py-8">No capacity profiles loaded.</p>
              ) : (
                <div className="space-y-2 overflow-y-auto max-h-[380px] pr-1 custom-scrollbar">
                  {capacities.map((cap) => {
                    const stats = getMemberPerformanceStats(cap);
                    const isSelected = selectedPerformanceMember?.member_id === cap.member_id;

                    return (
                      <button
                        key={cap.member_id}
                        onClick={() => setSelectedPerformanceMember(cap)}
                        className={`w-full p-3 rounded-xl border text-left transition-all cursor-pointer flex items-center justify-between ${
                          isSelected 
                            ? 'bg-zinc-950 border-red-500/40 shadow-md shadow-red-500/5' 
                            : 'bg-zinc-900 border-zinc-850 hover:bg-zinc-950/60 hover:border-zinc-800'
                        }`}
                      >
                        <div>
                          <div className="text-xs font-bold text-white">{cap.name}</div>
                          <div className="text-[9px] text-zinc-500 mt-0.5 font-mono uppercase tracking-wider">{cap.role}</div>
                        </div>
                        <div className="text-right">
                          <div className="text-[10px] font-black text-red-400 font-mono">{stats.velocity}d avg</div>
                          <div className="text-[9px] text-zinc-500">{stats.totalOutput} completed</div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Right side: Detailed performance charts for selected member */}
            <div className="lg:col-span-2 space-y-6">
              {selectedPerformanceMember ? (() => {
                const stats = getMemberPerformanceStats(selectedPerformanceMember);

                return (
                  <div className="space-y-6">
                    {/* Individual Stats cards */}
                    <div className="grid grid-cols-3 gap-3">
                      <div className="bg-zinc-900 border border-zinc-850 p-4 rounded-2xl text-center relative overflow-hidden group">
                        <div className="absolute top-0 left-0 w-1 h-full bg-red-500" />
                        <span className="text-[9px] font-black uppercase tracking-wider text-zinc-500">Completion Velocity</span>
                        <div className="text-xl font-black text-red-400 font-mono mt-1.5">{stats.velocity} Days</div>
                        <p className="text-[9px] text-zinc-500 mt-1">Average days to close issues</p>
                      </div>
                      <div className="bg-zinc-900 border border-zinc-850 p-4 rounded-2xl text-center relative overflow-hidden group font-sans">
                        <div className="absolute top-0 left-0 w-1 h-full bg-blue-500" />
                        <span className="text-[9px] font-black uppercase tracking-wider text-zinc-500">Historical Output</span>
                        <div className="text-xl font-black text-blue-400 font-mono mt-1.5">{stats.totalOutput} Tasks</div>
                        <p className="text-[9px] text-zinc-500 mt-1">Lifetime completed tasks</p>
                      </div>
                      <div className="bg-zinc-900 border border-zinc-850 p-4 rounded-2xl text-center relative overflow-hidden group">
                        <div className="absolute top-0 left-0 w-1 h-full bg-emerald-500" />
                        <span className="text-[9px] font-black uppercase tracking-wider text-zinc-500">Efficiency Index</span>
                        <div className="text-xl font-black text-emerald-400 font-mono mt-1.5">{stats.efficiency}%</div>
                        <p className="text-[9px] text-zinc-500 mt-1">SLA alignment score</p>
                      </div>
                    </div>

                    {/* Charts: Trend Line & Skill matrix */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Trend Line */}
                      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 shadow-xl space-y-3">
                        <div className="border-b border-zinc-850 pb-2">
                          <h4 className="text-[11px] font-black uppercase tracking-wide text-zinc-300">Throughput Progression</h4>
                          <p className="text-[8.5px] text-zinc-500">Completed items per month (Jan-Jun)</p>
                        </div>
                        <div className="h-44 w-full">
                          <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={stats.recentTrend}>
                              <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
                              <XAxis dataKey="month" stroke="#71717a" fontSize={8} tickLine={false} />
                              <YAxis stroke="#71717a" fontSize={8} tickLine={false} />
                              <Tooltip 
                                contentStyle={{ backgroundColor: '#09090b', borderColor: '#27272a', borderRadius: '8px' }}
                                itemStyle={{ fontSize: '9px' }}
                              />
                              <Line type="monotone" dataKey="tasks" name="Tasks Completed" stroke="#3b82f6" strokeWidth={2.5} dot={{ r: 4 }} activeDot={{ r: 6 }} />
                            </LineChart>
                          </ResponsiveContainer>
                        </div>
                      </div>

                      {/* Skills Strength Chart */}
                      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 shadow-xl space-y-3">
                        <div className="border-b border-zinc-850 pb-2">
                          <h4 className="text-[11px] font-black uppercase tracking-wide text-zinc-300">Skill Alignment Strength</h4>
                          <p className="text-[8.5px] text-zinc-500">Sourced from core proficiencies matrix</p>
                        </div>
                        <div className="h-44 w-full">
                          <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={stats.skillProficiencies} layout="vertical" margin={{ left: -10, right: 10 }}>
                              <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
                              <XAxis type="number" domain={[0, 5]} stroke="#71717a" fontSize={8} tickLine={false} />
                              <YAxis dataKey="name" type="category" stroke="#71717a" fontSize={8} tickLine={false} width={80} />
                              <Tooltip 
                                contentStyle={{ backgroundColor: '#09090b', borderColor: '#27272a', borderRadius: '8px' }}
                                itemStyle={{ fontSize: '9px' }}
                              />
                              <Bar dataKey="level" name="Proficiency Level" fill="#10b981" radius={[0, 4, 4, 0]} barSize={12}>
                                {stats.skillProficiencies.map((entry, idx) => (
                                  <Cell key={`cell-${idx}`} fill={entry.level >= 4 ? '#10b981' : '#f59e0b'} />
                                ))}
                              </Bar>
                            </BarChart>
                          </ResponsiveContainer>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })() : (
                <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-12 text-center text-zinc-500 text-xs shadow-xl flex flex-col items-center justify-center gap-3">
                  <Sparkles size={24} className="text-zinc-600 animate-pulse" />
                  <p className="font-semibold">No Team Member Selected</p>
                  <p className="text-[10px] text-zinc-600 max-w-xs">Select any collaborator from the roster on the left to unpack their interactive productivity graphs and proficiency breakdown.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

        </div>

        {showSyncLogPanel && (
          <div className="lg:col-span-1 bg-zinc-900 border border-zinc-800 p-5 rounded-2xl shadow-xl space-y-4 animate-slide-in h-fit lg:sticky lg:top-6" id="sync-log-side-panel">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
              <div className="flex items-center gap-2 text-zinc-200">
                <Bell className="text-red-500 animate-pulse" size={14} />
                <span className="text-[10px] font-black uppercase tracking-wider">Sync Log Panel</span>
              </div>
              <button 
                onClick={() => setShowSyncLogPanel(false)}
                className="p-1 hover:bg-zinc-800 text-zinc-500 hover:text-white rounded-lg transition-colors cursor-pointer border border-zinc-850"
              >
                <X size={12} />
              </button>
            </div>

            {/* Side Panel Tabs */}
            <div className="flex border-b border-zinc-850">
              <button
                onClick={() => setSidebarTab('stream')}
                className={`flex-1 pb-2 text-[10px] font-black uppercase tracking-wider text-center border-b-2 transition-all ${
                  sidebarTab === 'stream'
                    ? 'border-red-500 text-white'
                    : 'border-transparent text-zinc-500 hover:text-zinc-300'
                }`}
              >
                Live Stream
              </button>
              <button
                onClick={() => setSidebarTab('settings')}
                className={`flex-1 pb-2 text-[10px] font-black uppercase tracking-wider text-center border-b-2 transition-all ${
                  sidebarTab === 'settings'
                    ? 'border-red-500 text-white'
                    : 'border-transparent text-zinc-500 hover:text-zinc-300'
                }`}
              >
                Webhooks (Slack/Discord)
              </button>
            </div>

            {sidebarTab === 'stream' ? (
              <>
                <div className="space-y-3 max-h-[500px] overflow-y-auto pr-1 custom-scrollbar">
                  {syncLogs.length === 0 ? (
                    <p className="text-[10px] text-zinc-500 italic text-center py-8">No live notifications or assignments logged yet.</p>
                  ) : (
                    syncLogs.map((log) => {
                      let badgeColor = 'bg-zinc-950 border-zinc-800 text-zinc-400';
                      if (log.type === 'workload_update') badgeColor = 'bg-blue-950/40 border-blue-900/30 text-blue-400';
                      if (log.type === 'task_assignment') badgeColor = 'bg-purple-950/40 border-purple-900/30 text-purple-400';
                      if (log.type === 'leave_status') badgeColor = 'bg-amber-950/40 border-amber-900/30 text-amber-400';
                      if (log.type === 'role_suggest') badgeColor = 'bg-emerald-950/40 border-emerald-900/30 text-emerald-400';

                      return (
                        <div key={log.id} className="p-3 bg-zinc-950 border border-zinc-900 rounded-xl space-y-2 hover:border-zinc-800 transition-all">
                          <div className="flex items-center justify-between gap-1.5">
                            <span className="text-[10px] font-bold text-white truncate">{log.memberName}</span>
                            <span className="text-[7.5px] text-zinc-600 font-mono shrink-0">
                              {new Date(log.timestamp).toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' })}
                            </span>
                          </div>
                          
                          <div className="flex items-center gap-1.5">
                            <span className={`text-[8px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded border leading-none ${badgeColor}`}>
                              {log.title}
                            </span>
                          </div>

                          <p className="text-[9.5px] text-zinc-400 leading-normal font-medium">
                            {log.message}
                          </p>
                        </div>
                      );
                    })
                  )}
                </div>

                <div className="pt-2 border-t border-zinc-800 text-center">
                  <button 
                    onClick={() => {
                      setSyncLogs([]);
                      localStorage.removeItem('team_sync_logs');
                      toast.success('Notification stream cleared.');
                    }}
                    className="text-[9px] font-black uppercase tracking-wider text-red-500 hover:text-red-400 transition-colors cursor-pointer"
                  >
                    Clear Stream
                  </button>
                </div>
              </>
            ) : (
              <div className="space-y-4 text-xs">
                <p className="text-[10px] text-zinc-500 leading-relaxed font-medium">
                  Establish live telemetry webhooks to sync your Team Sync Log events dynamically onto third-party workspace channels.
                </p>

                {/* Slack webhook input */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-[9px] font-black uppercase tracking-wider text-zinc-400">Slack Webhook URL</label>
                    <input
                      type="checkbox"
                      checked={slackEnabled}
                      onChange={(e) => {
                        setSlackEnabled(e.target.checked);
                        localStorage.setItem('sync_slack_enabled', e.target.checked ? 'true' : 'false');
                        toast.success(e.target.checked ? 'Slack output enabled.' : 'Slack output disabled.');
                      }}
                      className="cursor-pointer"
                    />
                  </div>
                  <input
                    type="text"
                    value={slackWebhook}
                    onChange={(e) => {
                      setSlackWebhook(e.target.value);
                      localStorage.setItem('sync_slack_webhook', e.target.value);
                    }}
                    placeholder="https://hooks.slack.com/services/..."
                    className="w-full bg-zinc-950 border border-zinc-850 px-3 py-2.5 rounded-xl text-[11px] font-bold text-white outline-none focus:border-red-500 transition-colors"
                  />
                </div>

                {/* Discord webhook input */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-[9px] font-black uppercase tracking-wider text-zinc-400">Discord Webhook URL</label>
                    <input
                      type="checkbox"
                      checked={discordEnabled}
                      onChange={(e) => {
                        setDiscordEnabled(e.target.checked);
                        localStorage.setItem('sync_discord_enabled', e.target.checked ? 'true' : 'false');
                        toast.success(e.target.checked ? 'Discord output enabled.' : 'Discord output disabled.');
                      }}
                      className="cursor-pointer"
                    />
                  </div>
                  <input
                    type="text"
                    value={discordWebhook}
                    onChange={(e) => {
                      setDiscordWebhook(e.target.value);
                      localStorage.setItem('sync_discord_webhook', e.target.value);
                    }}
                    placeholder="https://discord.com/api/webhooks/..."
                    className="w-full bg-zinc-950 border border-zinc-850 px-3 py-2.5 rounded-xl text-[11px] font-bold text-white outline-none focus:border-red-500 transition-colors"
                  />
                </div>

                <div className="pt-2 flex gap-2">
                  <button
                    onClick={async () => {
                      if (!slackWebhook && !discordWebhook) {
                        toast.error('Please configure at least one Webhook URL first.');
                        return;
                      }
                      toast.loading('Sending test webhook notifications...', { duration: 1500 });
                      setTimeout(() => {
                        triggerWebhookSync('Test Configuration Connection', 'Ranktica AI OS connected successfully. Live automated telemetry sync channel initialized.');
                        toast.success('Test telemetry packets dispatched successfully!');
                      }, 1200);
                    }}
                    className="flex-1 bg-zinc-950 hover:bg-zinc-850 border border-zinc-800 hover:border-zinc-750 text-white text-[9.5px] font-black uppercase tracking-wider py-2.5 rounded-xl transition-all cursor-pointer text-center"
                  >
                    Test Integration
                  </button>
                  <button
                    onClick={() => {
                      localStorage.setItem('sync_slack_webhook', slackWebhook);
                      localStorage.setItem('sync_discord_webhook', discordWebhook);
                      localStorage.setItem('sync_slack_enabled', slackEnabled ? 'true' : 'false');
                      localStorage.setItem('sync_discord_enabled', discordEnabled ? 'true' : 'false');
                      toast.success('Sync webhook configurations stored securely.');
                    }}
                    className="flex-1 bg-red-600 hover:bg-red-500 text-white text-[9.5px] font-black uppercase tracking-wider py-2.5 rounded-xl transition-all cursor-pointer text-center"
                  >
                    Save Webhooks
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Edit Role Modal */}
      {editingMember && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-zinc-900 border border-zinc-800 w-full max-w-md rounded-2xl p-6 space-y-4 shadow-2xl relative">
            <button
              onClick={() => setEditingMember(null)}
              className="absolute right-4 top-4 p-1.5 text-zinc-500 hover:text-white bg-zinc-950 border border-zinc-800 rounded-lg"
            >
              <X size={14} />
            </button>
            
            <h3 className="text-sm font-black uppercase text-zinc-300 flex items-center gap-2">
              <ArrowLeftRight size={16} className="text-red-500" />
              Modify Collaborator Permissions
            </h3>
            
            <div className="bg-zinc-950 border border-zinc-800/60 p-3.5 rounded-xl space-y-1">
              <div className="text-[10px] font-black uppercase text-zinc-500 tracking-wider">Target Node</div>
              <div className="text-xs font-bold text-white">{editingMember.name}</div>
              <div className="text-[10px] text-zinc-500">{editingMember.email}</div>
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-black uppercase text-zinc-500 tracking-wider block">
                {t('roleLabel')}
              </label>
              <select
                value={editRole}
                onChange={(e) => setEditRole(e.target.value as any)}
                className="w-full bg-zinc-950 border border-zinc-800 text-xs font-bold text-white px-3 py-2.5 rounded-xl outline-none focus:border-red-500 transition-colors cursor-pointer"
              >
                <option value="Viewer">{t('viewer')}</option>
                <option value="Editor">{t('editor')}</option>
                <option value="Admin">{t('admin')}</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-black uppercase text-zinc-500 tracking-wider block">
                {t('projectLabel')}
              </label>
              <select
                value={editProjectId}
                onChange={(e) => setEditProjectId(e.target.value)}
                className="w-full bg-zinc-950 border border-zinc-800 text-xs font-bold text-white px-3 py-2.5 rounded-xl outline-none focus:border-red-500 transition-colors cursor-pointer"
              >
                <option value="all">All Organization Projects</option>
                {projects.map(proj => (
                  <option key={proj.id} value={proj.id}>
                    {proj.title}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-2.5 pt-2">
              <button
                onClick={() => setEditingMember(null)}
                className="flex-1 bg-zinc-950 hover:bg-zinc-850 border border-zinc-800 text-xs font-black uppercase py-2.5 rounded-xl transition-colors cursor-pointer"
              >
                {t('btnCancel')}
              </button>
              <button
                onClick={handleSaveEdit}
                className="flex-1 bg-red-600 hover:bg-red-500 text-white text-xs font-black uppercase py-2.5 rounded-xl transition-colors shadow-lg shadow-red-600/15 cursor-pointer"
              >
                {t('btnSave')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {memberToDelete && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-zinc-900 border border-zinc-800 w-full max-w-sm rounded-2xl p-6 space-y-4 shadow-2xl relative text-center">
            <div className="w-12 h-12 bg-red-600/10 border border-red-500/20 rounded-full flex items-center justify-center mx-auto text-red-500">
              <AlertTriangle size={24} />
            </div>

            <div className="space-y-1">
              <h3 className="text-sm font-black uppercase text-white tracking-wide">{t('confirmTitle')}</h3>
              <p className="text-[10px] text-zinc-400">
                Are you sure you want to revoke access for <strong className="text-white">{memberToDelete.name}</strong>?
              </p>
            </div>

            <p className="text-[10px] text-zinc-500 italic bg-zinc-950 p-2.5 rounded-xl border border-zinc-800/40">
              {t('confirmDeleteMsg')}
            </p>

            <div className="flex items-center gap-2 pt-2">
              <button
                onClick={() => setMemberToDelete(null)}
                className="flex-1 bg-zinc-950 hover:bg-zinc-850 border border-zinc-800 text-zinc-400 hover:text-white text-xs font-black uppercase py-2.5 rounded-xl transition-colors cursor-pointer"
              >
                {t('btnCancel')}
              </button>
              <button
                onClick={handleDeleteConfirm}
                className="flex-1 bg-red-600 hover:bg-red-500 text-white text-xs font-black uppercase py-2.5 rounded-xl transition-colors shadow-lg shadow-red-600/20 cursor-pointer"
              >
                {t('btnDelete')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Granular Notification Settings Modal */}
      {activeNotificationMember && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-zinc-900 border border-zinc-800 w-full max-w-md rounded-2xl p-6 space-y-5 shadow-2xl relative">
            <button
              onClick={() => setActiveNotificationMember(null)}
              className="absolute right-4 top-4 p-1.5 text-zinc-500 hover:text-white bg-zinc-950 border border-zinc-800 rounded-lg transition-colors cursor-pointer"
            >
              <X size={14} />
            </button>

            <div className="flex items-center gap-3 border-b border-zinc-800/80 pb-4">
              <div className="p-2.5 bg-red-600/10 border border-red-500/20 rounded-xl text-red-500">
                <Bell size={20} />
              </div>
              <div>
                <h3 className="text-sm font-black uppercase text-zinc-200 tracking-wide">Alert Preferences</h3>
                <p className="text-[10px] text-zinc-500">Configure real-time notifications for {activeNotificationMember.name}</p>
              </div>
            </div>

            <div className="space-y-4">
              {/* Category 1: Project Assignment */}
              <div className="bg-zinc-950/60 border border-zinc-850 p-4 rounded-xl space-y-3">
                <div className="text-[10px] font-black uppercase text-zinc-400 tracking-wider">
                  Project Assignment Alerts
                </div>
                <div className="space-y-2.5">
                  <label className="flex items-center justify-between cursor-pointer group">
                    <span className="text-xs text-zinc-300 font-medium group-hover:text-white transition-colors">
                      In-App Realtime Toast
                    </span>
                    <input
                      type="checkbox"
                      checked={notificationSettings.inapp_assignments}
                      onChange={(e) => setNotificationSettings({
                        ...notificationSettings,
                        inapp_assignments: e.target.checked
                      })}
                      className="rounded bg-zinc-900 border-zinc-800 text-red-600 focus:ring-red-500/20 w-4 h-4 cursor-pointer"
                    />
                  </label>
                  <label className="flex items-center justify-between cursor-pointer group">
                    <span className="text-xs text-zinc-300 font-medium group-hover:text-white transition-colors">
                      Email Alert boundary
                    </span>
                    <input
                      type="checkbox"
                      checked={notificationSettings.email_assignments}
                      onChange={(e) => setNotificationSettings({
                        ...notificationSettings,
                        email_assignments: e.target.checked
                      })}
                      className="rounded bg-zinc-900 border-zinc-800 text-red-600 focus:ring-red-500/20 w-4 h-4 cursor-pointer"
                    />
                  </label>
                </div>
              </div>

              {/* Category 2: Status Changes */}
              <div className="bg-zinc-950/60 border border-zinc-850 p-4 rounded-xl space-y-3">
                <div className="text-[10px] font-black uppercase text-zinc-400 tracking-wider">
                  Campaign Status Milestones
                </div>
                <div className="space-y-2.5">
                  <label className="flex items-center justify-between cursor-pointer group">
                    <span className="text-xs text-zinc-300 font-medium group-hover:text-white transition-colors">
                      In-App Alerts
                    </span>
                    <input
                      type="checkbox"
                      checked={notificationSettings.inapp_status_changes}
                      onChange={(e) => setNotificationSettings({
                        ...notificationSettings,
                        inapp_status_changes: e.target.checked
                      })}
                      className="rounded bg-zinc-900 border-zinc-800 text-red-600 focus:ring-red-500/20 w-4 h-4 cursor-pointer"
                    />
                  </label>
                  <label className="flex items-center justify-between cursor-pointer group">
                    <span className="text-xs text-zinc-300 font-medium group-hover:text-white transition-colors">
                      Email Digests
                    </span>
                    <input
                      type="checkbox"
                      checked={notificationSettings.email_status_changes}
                      onChange={(e) => setNotificationSettings({
                        ...notificationSettings,
                        email_status_changes: e.target.checked
                      })}
                      className="rounded bg-zinc-900 border-zinc-800 text-red-600 focus:ring-red-500/20 w-4 h-4 cursor-pointer"
                    />
                  </label>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2.5 pt-2">
              <button
                onClick={() => setActiveNotificationMember(null)}
                className="flex-1 bg-zinc-950 hover:bg-zinc-850 border border-zinc-800 text-xs font-black uppercase py-2.5 rounded-xl transition-colors cursor-pointer text-zinc-400"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveNotifications}
                disabled={isSavingNotifications}
                className="flex-1 bg-red-600 hover:bg-red-500 disabled:bg-zinc-800 text-white text-xs font-black uppercase py-2.5 rounded-xl transition-all shadow-lg shadow-red-600/10 flex items-center justify-center gap-2 cursor-pointer"
              >
                {isSavingNotifications && <Loader2 className="animate-spin" size={12} />}
                Save Alerts
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Permission Audit Modal */}
      {showAuditModal && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-zinc-900 border border-zinc-800 w-full max-w-4xl rounded-2xl p-6 space-y-5 shadow-2xl relative max-h-[90vh] flex flex-col animate-fade-in">
            <button
              onClick={() => setShowAuditModal(false)}
              className="absolute right-4 top-4 p-1.5 text-zinc-500 hover:text-white bg-zinc-950 border border-zinc-800 rounded-lg transition-colors cursor-pointer"
            >
              <X size={14} />
            </button>

            <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-zinc-800/80 pb-4 gap-4">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-blue-600/10 border border-blue-500/20 rounded-xl text-blue-500">
                  <ClipboardList size={20} />
                </div>
                <div>
                  <h3 className="text-sm font-black uppercase text-zinc-200 tracking-wide">Permission Footprint Audit</h3>
                  <p className="text-[10px] text-zinc-500">Verify and compile regulatory compliance and resource access levels across campaigns</p>
                </div>
              </div>
              
              <button
                onClick={handleExportAuditCSV}
                className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-[11px] font-black uppercase tracking-widest rounded-xl transition-all shadow-lg shadow-emerald-600/10 cursor-pointer self-start sm:self-center"
              >
                <Download size={12} />
                Export Audit Spreadsheet
              </button>
            </div>

            <div className="flex-1 overflow-y-auto custom-scrollbar">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-zinc-800 text-[9px] font-black uppercase text-zinc-500 tracking-wider">
                    <th className="py-3 pl-2">Collaborator</th>
                    <th className="py-3">Role</th>
                    <th className="py-3">Scope Bound</th>
                    <th className="py-3">Responsibilities & Clearance</th>
                    <th className="py-3 pr-2 text-right">Access Level</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-800/40 text-xs">
                  {filteredMembers.map(member => {
                    const linkedProj = projects.find(p => p.id === member.project_id);
                    const scope = member.project_id === 'all' ? 'Organization Wide' : (linkedProj?.title || 'Single Project Limit');
                    
                    return (
                      <tr key={member.id} className="hover:bg-zinc-950/20 transition-colors">
                        <td className="py-3.5 pl-2">
                          <div className="font-bold text-white">{member.name}</div>
                          <div className="text-[10px] text-zinc-500">{member.email}</div>
                        </td>
                        <td className="py-3.5">
                          <span className="flex items-center gap-1.5 font-bold text-zinc-300">
                            <Shield size={12} className="text-blue-500" />
                            {member.role}
                          </span>
                        </td>
                        <td className="py-3.5 text-zinc-400 font-medium max-w-[140px] truncate">
                          {scope}
                        </td>
                        <td className="py-3.5 text-[11px] text-zinc-500 max-w-[280px] leading-relaxed">
                          {member.role === 'Admin' ? (
                            <span className="text-zinc-400">
                              Full administrative access, user invitations, budget limits, system-level publishing permissions
                            </span>
                          ) : member.role === 'Editor' ? (
                            <span className="text-zinc-400">
                              Write and publish authority, campaign drafts modification, AI metadata optimization logs
                            </span>
                          ) : (
                            <span className="text-zinc-400">
                              Read-only workspace viewing, metrics verification, performance report downloads
                            </span>
                          )}
                        </td>
                        <td className="py-3.5 pr-2 text-right">
                          <span className={`inline-block px-2.5 py-0.5 rounded text-[9px] font-black uppercase tracking-wider ${
                            member.role === 'Admin' ? 'bg-red-500/10 text-red-400 border border-red-500/20' :
                            member.role === 'Editor' ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20' :
                            'bg-zinc-800 text-zinc-400 border border-zinc-700/50'
                          }`}>
                            {member.role === 'Admin' ? 'Level 3 - Root' : member.role === 'Editor' ? 'Level 2 - Write' : 'Level 1 - Read'}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <div className="flex justify-end pt-3 border-t border-zinc-800">
              <button
                onClick={() => setShowAuditModal(false)}
                className="px-6 py-2 bg-zinc-950 hover:bg-zinc-850 border border-zinc-800 text-zinc-400 hover:text-white text-xs font-black uppercase rounded-xl transition-colors cursor-pointer"
              >
                Close Audit
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Configure Tags Modal */}
      {editingTagsMember && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-zinc-900 border border-zinc-800 w-full max-w-md rounded-2xl p-6 space-y-4 shadow-2xl relative">
            <button
              onClick={() => setEditingTagsMember(null)}
              className="absolute right-4 top-4 p-1.5 text-zinc-500 hover:text-white bg-zinc-950 border border-zinc-800 rounded-lg transition-colors cursor-pointer"
            >
              <X size={14} />
            </button>

            <div className="flex items-center gap-3 border-b border-zinc-800/80 pb-4">
              <div className="p-2.5 bg-purple-600/10 border border-purple-500/20 rounded-xl text-purple-400">
                <Tag size={20} />
              </div>
              <div>
                <h3 className="text-sm font-black uppercase text-zinc-200 tracking-wide">Categorization Tag System</h3>
                <p className="text-[10px] text-zinc-500">Categorize {editingTagsMember.name} across department, seniority, or custom squad groups.</p>
              </div>
            </div>

            <div className="space-y-4">
              {/* Department Dropdown */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-black uppercase text-zinc-500 tracking-wider">Department Tag</label>
                <select
                  value={memberDeptInput}
                  onChange={(e) => setMemberDeptInput(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-800 text-xs font-bold text-white px-3 py-2.5 rounded-xl outline-none focus:border-purple-500 transition-colors cursor-pointer"
                >
                  {['Marketing', 'Engineering', 'Design', 'Product', 'Support'].map(d => (
                    <option key={d} value={d}>{d}</option>
                  ))}
                </select>
              </div>

              {/* Seniority Dropdown */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-black uppercase text-zinc-500 tracking-wider">Seniority Level Tag</label>
                <select
                  value={memberSeniorityInput}
                  onChange={(e) => setMemberSeniorityInput(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-800 text-xs font-bold text-white px-3 py-2.5 rounded-xl outline-none focus:border-purple-500 transition-colors cursor-pointer"
                >
                  {['Junior', 'Mid', 'Senior', 'Lead', 'Director'].map(s => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>

              {/* Custom Group Dropdown */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-black uppercase text-zinc-500 tracking-wider">Custom Project / Squad Tag</label>
                <select
                  value={memberCustomInput}
                  onChange={(e) => setMemberCustomInput(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-800 text-xs font-bold text-white px-3 py-2.5 rounded-xl outline-none focus:border-purple-500 transition-colors cursor-pointer"
                >
                  {['Growth', 'LSI-Semantic', 'Infrastructure', 'SEO Audit', 'Content Squad'].map(cg => (
                    <option key={cg} value={cg}>{cg}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="pt-3 border-t border-zinc-800/80 flex justify-end gap-3">
              <button
                onClick={() => setEditingTagsMember(null)}
                className="px-4 py-2 bg-zinc-950 border border-zinc-850 hover:border-zinc-750 text-xs text-zinc-400 font-bold rounded-xl transition-all cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  saveMemberTags(editingTagsMember.member_id, [memberDeptInput, memberSeniorityInput, memberCustomInput]);
                  setEditingTagsMember(null);
                  toast.success(`Categorization tags saved for ${editingTagsMember.name}`);
                  addSyncLogEntry(
                    editingTagsMember.name,
                    'role_suggest',
                    'Categorization Updated',
                    `Categorized into ${memberDeptInput}, ${memberSeniorityInput}, and ${memberCustomInput} groups.`
                  );
                }}
                className="px-5 py-2 bg-purple-650 hover:bg-purple-600 text-xs text-white font-bold rounded-xl transition-all cursor-pointer"
              >
                Save Category Tags
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Configure Quotas / Capacity Profile Modal */}
      {editingCapacityMember && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-zinc-900 border border-zinc-800 w-full max-w-md rounded-2xl p-6 space-y-4 shadow-2xl relative">
            <button
              onClick={() => setEditingCapacityMember(null)}
              className="absolute right-4 top-4 p-1.5 text-zinc-500 hover:text-white bg-zinc-950 border border-zinc-800 rounded-lg transition-colors cursor-pointer"
            >
              <X size={14} />
            </button>

            <div className="flex items-center gap-3 border-b border-zinc-800/80 pb-4">
              <div className="p-2.5 bg-blue-600/10 border border-blue-500/20 rounded-xl text-blue-400">
                <CalendarRange size={20} />
              </div>
              <div>
                <h3 className="text-sm font-black uppercase text-zinc-200 tracking-wide">Workload Profile Configuration</h3>
                <p className="text-[10px] text-zinc-500">Configure weekly work quotas and skill profile for {editingCapacityMember.name}</p>
              </div>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase text-zinc-500 tracking-wider">Weekly Quota (hours)</label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    disabled={editingCapacityMember.work_status === 'On Leave'}
                    value={editingCapacityMember.weekly_capacity}
                    onChange={(e) => setEditingCapacityMember({
                      ...editingCapacityMember,
                      weekly_capacity: Number(e.target.value)
                    })}
                    className="w-full bg-zinc-950 border border-zinc-800 text-xs font-bold text-white px-3.5 py-2.5 rounded-xl outline-none focus:border-blue-500 transition-colors disabled:opacity-40"
                  />
                  {editingCapacityMember.work_status === 'On Leave' && (
                    <p className="text-[9px] text-amber-400">Locked to 0 while On Leave.</p>
                  )}
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase text-zinc-500 tracking-wider">Current Load (hours)</label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={editingCapacityMember.current_load}
                    onChange={(e) => setEditingCapacityMember({
                      ...editingCapacityMember,
                      current_load: Number(e.target.value)
                    })}
                    className="w-full bg-zinc-950 border border-zinc-800 text-xs font-bold text-white px-3.5 py-2.5 rounded-xl outline-none focus:border-blue-500 transition-colors"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase text-zinc-500 tracking-wider">Technical Skills (comma separated)</label>
                <input
                  type="text"
                  placeholder="AI Optimization, Scriptwriting, Copywriting"
                  value={editingCapacityMember.skills}
                  onChange={(e) => setEditingCapacityMember({
                    ...editingCapacityMember,
                    skills: e.target.value
                  })}
                  className="w-full bg-zinc-950 border border-zinc-800 text-xs font-medium text-white px-3.5 py-2.5 rounded-xl outline-none focus:border-blue-500 transition-colors"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase text-zinc-500 tracking-wider">Duty Status</label>
                <select
                  value={editingCapacityMember.work_status}
                  onChange={(e) => {
                    const val = e.target.value as 'Active' | 'On Leave';
                    setEditingCapacityMember({
                      ...editingCapacityMember,
                      work_status: val,
                      weekly_capacity: val === 'On Leave' ? 0 : 40
                    });
                  }}
                  className="w-full bg-zinc-950 border border-zinc-800 text-xs font-bold text-white px-3.5 py-2.5 rounded-xl outline-none focus:border-blue-500 transition-colors cursor-pointer"
                >
                  <option value="Active">Active Duty</option>
                  <option value="On Leave">On Leave</option>
                </select>
              </div>
            </div>

            <div className="flex items-center gap-2.5 pt-2">
              <button
                onClick={() => setEditingCapacityMember(null)}
                className="flex-1 bg-zinc-950 hover:bg-zinc-850 border border-zinc-800 text-xs font-black uppercase py-2.5 rounded-xl transition-colors cursor-pointer text-zinc-400"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveCapacityDetails}
                disabled={isSavingCapacity}
                className="flex-1 bg-blue-600 hover:bg-blue-500 disabled:bg-zinc-800 text-white text-xs font-black uppercase py-2.5 rounded-xl transition-all shadow-lg shadow-blue-600/10 flex items-center justify-center gap-2 cursor-pointer"
              >
                {isSavingCapacity && <Loader2 className="animate-spin" size={12} />}
                Save Workload
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Bulk CSV Import Modal */}
      {showBulkImportModal && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-zinc-900 border border-zinc-800 w-full max-w-4xl rounded-2xl p-6 space-y-4 shadow-2xl relative animate-fade-in">
            <button
              onClick={() => {
                setShowBulkImportModal(false);
                setShowImportPreview(false);
                setParsedBulkMembers([]);
              }}
              className="absolute right-4 top-4 p-1.5 text-zinc-500 hover:text-white bg-zinc-950 border border-zinc-800 rounded-lg transition-colors cursor-pointer"
            >
              <X size={14} />
            </button>

            <div className="flex items-center gap-3 border-b border-zinc-800 pb-4">
              <div className="p-2.5 bg-emerald-600/10 border border-emerald-500/20 rounded-xl text-emerald-400">
                <FileSpreadsheet size={20} />
              </div>
              <div>
                <h3 className="text-sm font-black uppercase text-zinc-200 tracking-wide">Bulk Member CSV Import Utility</h3>
                <p className="text-[10px] text-zinc-500">Quickly upload, analyze skills, and suggest roles for your team rosters in bulk.</p>
              </div>
            </div>

            {!showImportPreview ? (
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase text-zinc-400 tracking-wide block">
                    Paste CSV Lines (Header Included)
                  </label>
                  <textarea
                    rows={8}
                    required
                    value={bulkCsvData}
                    onChange={(e) => setBulkCsvData(e.target.value)}
                    placeholder="name,email,role,weekly_capacity,skills&#10;Alice Smith,alice@smith.com,,40,SEO optimization, copywriting&#10;Bob Jones,bob@jones.com,,20,Market research, reporting&#10;Clara Adams,clara@adams.com,,30,team leader, billing manager"
                    className="w-full bg-zinc-950 border border-zinc-800 text-xs font-mono text-zinc-300 p-3.5 rounded-xl outline-none focus:border-emerald-500 transition-colors placeholder-zinc-700 leading-relaxed"
                  />
                </div>

                <div className="bg-zinc-950/60 border border-zinc-850 p-3.5 rounded-xl space-y-1.5 text-[10px] text-zinc-500">
                  <p className="font-bold text-zinc-400 uppercase tracking-wide">💡 Format & Auto-Suggest Rules:</p>
                  <p>1. Ensure headers: <code className="text-emerald-400 font-mono">name,email,role,weekly_capacity,skills</code> exist on line 1.</p>
                  <p>2. Leave <code className="text-white font-mono">role</code> blank to let the parser auto-suggest the optimal role based on their skill words.</p>
                  <p>3. Authority words (manage, lead, billing) suggestion → <code className="text-red-400 font-bold">Admin</code>. Creation/design words (write, seo, design, code) → <code className="text-blue-400 font-bold">Editor</code>. Audit/metrics words (research, audit, metrics) → <code className="text-zinc-400 font-bold">Viewer</code>.</p>
                </div>

                {bulkImportError && (
                  <div className="p-3 bg-red-950/40 border border-red-900/30 text-red-400 text-xs font-bold rounded-xl animate-shake">
                    {bulkImportError}
                  </div>
                )}

                <div className="flex items-center gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowBulkImportModal(false)}
                    className="flex-1 bg-zinc-950 hover:bg-zinc-850 border border-zinc-800 text-xs font-black uppercase py-3 rounded-xl transition-colors cursor-pointer text-zinc-400"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleAnalyzeCsv}
                    className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-black uppercase py-3 rounded-xl transition-all shadow-lg shadow-emerald-600/10 flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <Sparkles size={14} />
                    Analyze CSV & Suggest Roles
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleBulkImportSubmit} className="space-y-4">
                <div className="border border-zinc-800 rounded-xl overflow-hidden bg-zinc-950 max-h-96 overflow-y-auto custom-scrollbar">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="border-b border-zinc-800 bg-zinc-900/40">
                        <th className="p-3 font-black uppercase text-[9px] text-zinc-500">Name & Email</th>
                        <th className="p-3 font-black uppercase text-[9px] text-zinc-500 w-36">Suggested Role</th>
                        <th className="p-3 font-black uppercase text-[9px] text-zinc-500 w-24 text-center">Capacity</th>
                        <th className="p-3 font-black uppercase text-[9px] text-zinc-500">Suggested Reason / Skills</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-900">
                      {parsedBulkMembers.map((m, idx) => (
                        <tr key={m.id} className="hover:bg-zinc-900/20">
                          <td className="p-3">
                            <div className="font-bold text-white">{m.name}</div>
                            <div className="text-[10px] text-zinc-500 font-mono mt-0.5">{m.email}</div>
                          </td>
                          <td className="p-3">
                            <select
                              value={m.role}
                              onChange={(e) => {
                                const updated = [...parsedBulkMembers];
                                updated[idx].role = e.target.value;
                                setParsedBulkMembers(updated);
                              }}
                              className="bg-zinc-900 border border-zinc-800 text-[11px] font-bold text-white px-2 py-1 rounded outline-none focus:border-emerald-500 cursor-pointer w-full"
                            >
                              <option value="Admin">Admin</option>
                              <option value="Editor">Editor</option>
                              <option value="Viewer">Viewer</option>
                            </select>
                          </td>
                          <td className="p-3 text-center">
                            <input
                              type="number"
                              min="0"
                              max="100"
                              value={m.weekly_capacity}
                              onChange={(e) => {
                                const updated = [...parsedBulkMembers];
                                updated[idx].weekly_capacity = Number(e.target.value);
                                setParsedBulkMembers(updated);
                              }}
                              className="bg-zinc-900 border border-zinc-800 text-[11px] font-mono text-center text-white px-1.5 py-1 rounded outline-none focus:border-emerald-500 w-16"
                            />
                          </td>
                          <td className="p-3 space-y-1">
                            <div className="text-[9.5px] text-amber-400 font-semibold italic leading-snug">{m.explanation}</div>
                            <div className="text-[9px] text-zinc-500 font-mono">Skills: {m.skills || 'none detected'}</div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="bg-emerald-950/15 border border-emerald-900/20 p-4 rounded-xl flex items-center gap-3 text-emerald-400">
                  <Smile className="text-emerald-400 shrink-0 animate-bounce" size={18} />
                  <p className="text-[10px] leading-normal">
                    The parser has successfully extracted details and suggested appropriate authority levels. Verify the roles above, then click <strong className="font-bold uppercase">Confirm & invite All</strong> to register the roster.
                  </p>
                </div>

                <div className="flex items-center gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      setShowImportPreview(false);
                      setParsedBulkMembers([]);
                    }}
                    className="flex-1 bg-zinc-950 hover:bg-zinc-850 border border-zinc-800 text-xs font-black uppercase py-3 rounded-xl transition-colors cursor-pointer text-zinc-400"
                  >
                    ← Back to Raw CSV
                  </button>
                  <button
                    type="submit"
                    disabled={isImporting}
                    className="flex-1 bg-emerald-600 hover:bg-emerald-500 disabled:bg-zinc-800 text-white text-xs font-black uppercase py-3 rounded-xl transition-all shadow-lg shadow-emerald-600/10 flex items-center justify-center gap-2 cursor-pointer"
                  >
                    {isImporting ? (
                      <Loader2 className="animate-spin" size={14} />
                    ) : (
                      <Check size={14} />
                    )}
                    Confirm & Invite All
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* Skill Proficiency Matrix Modal */}
      {editingSkillsMatrixMember && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-zinc-900 border border-zinc-800 w-full max-w-md rounded-2xl p-6 space-y-4 shadow-2xl relative animate-fade-in">
            <button
              onClick={() => setEditingSkillsMatrixMember(null)}
              className="absolute right-4 top-4 p-1.5 text-zinc-500 hover:text-white bg-zinc-950 border border-zinc-800 rounded-lg transition-colors cursor-pointer"
            >
              <X size={14} />
            </button>

            <div className="flex items-center gap-3 border-b border-zinc-800 pb-4">
              <div className="p-2.5 bg-emerald-600/10 border border-emerald-500/20 rounded-xl text-emerald-400">
                <Layers size={20} />
              </div>
              <div>
                <h3 className="text-sm font-black uppercase text-zinc-200 tracking-wide">Skill Proficiency Matrix</h3>
                <p className="text-[10px] text-zinc-500">Configure core task proficiencies for {editingSkillsMatrixMember.name}. This is utilized by the Auto-Rebalance engine.</p>
              </div>
            </div>

            <div className="space-y-4 py-2">
              {Object.keys(skillsMatrixProficiencies).map((skillName) => (
                <div key={skillName} className="space-y-1.5 p-3 bg-zinc-950/40 border border-zinc-850 rounded-xl">
                  <div className="flex items-center justify-between">
                    <span className="text-[10.5px] font-black uppercase text-zinc-300 tracking-wide">{skillName}</span>
                    <span className="text-xs font-black text-emerald-400 font-mono">LVL {skillsMatrixProficiencies[skillName]} / 5</span>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    {[1, 2, 3, 4, 5].map((level) => (
                      <button
                        key={level}
                        type="button"
                        onClick={() => setSkillsMatrixProficiencies({
                          ...skillsMatrixProficiencies,
                          [skillName]: level
                        })}
                        className={`flex-1 py-1 text-xs font-black rounded-lg border transition-all cursor-pointer ${
                          skillsMatrixProficiencies[skillName] >= level
                            ? 'bg-emerald-950/20 border-emerald-900 text-emerald-400 font-bold shadow-sm shadow-emerald-500/5'
                            : 'bg-zinc-900/60 border-zinc-850 text-zinc-600'
                        }`}
                      >
                        {level}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            <div className="flex items-center gap-2.5 pt-2">
              <button
                onClick={() => setEditingSkillsMatrixMember(null)}
                className="flex-1 bg-zinc-950 hover:bg-zinc-850 border border-zinc-800 text-xs font-black uppercase py-2.5 rounded-xl transition-colors cursor-pointer text-zinc-400"
              >
                Close
              </button>
              <button
                onClick={handleSaveSkillsMatrix}
                disabled={isSavingSkillsMatrix}
                className="flex-1 bg-emerald-600 hover:bg-emerald-500 disabled:bg-zinc-800 text-white text-xs font-black uppercase py-2.5 rounded-xl transition-all shadow-lg shadow-emerald-600/10 flex items-center justify-center gap-2 cursor-pointer"
              >
                {isSavingSkillsMatrix && <Loader2 className="animate-spin" size={12} />}
                Save Skill Matrix
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Interactive Onboarding Checklist Modal */}
      {selectedOnboardingMember && (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-zinc-900 border border-zinc-800 w-full max-w-3xl rounded-2xl p-6 space-y-5 shadow-2xl relative max-h-[90vh] flex flex-col animate-fade-in">
            <button
              onClick={() => setSelectedOnboardingMember(null)}
              className="absolute right-4 top-4 p-1.5 text-zinc-500 hover:text-white bg-zinc-950 border border-zinc-800 rounded-lg transition-colors cursor-pointer"
            >
              <X size={14} />
            </button>

            {/* Modal Header */}
            <div className="flex items-center gap-3.5 border-b border-zinc-800 pb-4">
              <div className="p-3 bg-red-600/10 border border-red-500/20 rounded-xl text-red-500">
                <UserCheck size={22} className="animate-bounce" />
              </div>
              <div>
                <div className="text-[10px] font-black uppercase tracking-wider text-red-400">Onboarding & Walkthrough Core Workflow</div>
                <h3 className="text-base font-black text-white">
                  Collaborator Checklist: {selectedOnboardingMember.name}
                </h3>
                <p className="text-[10px] text-zinc-500 mt-0.5">
                  Guidance checklist triggered on workspace initialization. Complete all steps to authorize active status.
                </p>
              </div>
            </div>

            {/* Modal Layout split */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-5 flex-1 overflow-y-auto pr-1.5 custom-scrollbar">
              
              {/* Left Side: Steps Checklist */}
              <div className="md:col-span-5 space-y-2.5">
                <span className="text-[10px] font-black uppercase tracking-wider text-zinc-500 block mb-1">Onboarding Milestones</span>
                {(() => {
                  let tasks: OnboardingTask[] = [];
                  try {
                    tasks = JSON.parse(selectedOnboardingMember.onboarding_checklist || '[]');
                  } catch (e) {
                    tasks = [];
                  }

                  if (tasks.length === 0) {
                    return <p className="text-xs text-zinc-500 italic">No checklist milestones loaded.</p>;
                  }

                  return tasks.map(task => (
                    <div 
                      key={task.id}
                      onClick={() => setSelectedGuideTask(task.id)}
                      className={`p-3 rounded-xl border transition-all cursor-pointer flex items-center justify-between gap-3 ${
                        selectedGuideTask === task.id
                          ? 'bg-zinc-950 border-red-500/50 shadow-md shadow-red-500/5'
                          : 'bg-zinc-950/40 border-zinc-800 hover:border-zinc-700'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleToggleOnboardingTask(task);
                          }}
                          className="p-0.5 hover:bg-zinc-800 rounded text-red-500 transition-colors shrink-0"
                        >
                          {task.completed ? (
                            <CheckCircle size={15} className="text-emerald-500 fill-emerald-500/10" />
                          ) : (
                            <div className="w-4 h-4 rounded border border-zinc-600 hover:border-red-500" />
                          )}
                        </button>
                        <span className={`text-[11px] font-bold transition-all ${task.completed ? 'line-through text-zinc-500' : 'text-zinc-200'}`}>
                          {task.label}
                        </span>
                      </div>
                      <span className="text-[9px] font-black uppercase tracking-wider text-zinc-500 shrink-0">
                        {task.completed ? 'Done' : 'Pending'}
                      </span>
                    </div>
                  ));
                })()}
              </div>

              {/* Right Side: Step Interactive Walkthrough Instructions & Interactive Simulation */}
              <div className="md:col-span-7 bg-zinc-950/60 border border-zinc-850 p-4.5 rounded-xl space-y-4 flex flex-col justify-between">
                <div>
                  {selectedGuideTask === 'welcome' && (
                    <div className="space-y-3.5 animate-fade-in">
                      <div className="flex items-center gap-2 text-red-400">
                        <Smile size={16} />
                        <h4 className="text-xs font-black uppercase tracking-wider">1. Platform Guidelines & Workspace Intro</h4>
                      </div>
                      <p className="text-[11px] text-zinc-400 leading-relaxed">
                        Introduce the collaborator to Ranktica's core video campaign workspace structure, channels architecture, and generative parameters.
                      </p>
                      <div className="bg-zinc-900/60 p-3 rounded-xl border border-zinc-850 space-y-2">
                        <h5 className="text-[10px] font-black uppercase tracking-wider text-white">Guidelines overview:</h5>
                        <ul className="text-[10px] text-zinc-500 space-y-1.5 list-disc pl-3.5">
                          <li>Access assigned channels via the Channels sidebar drawer.</li>
                          <li>Review active campaign prompts and metadata logs inside the Campaign Suite.</li>
                          <li>Drafts require at least Level 2 (Editor) authority to commit optimization runs.</li>
                        </ul>
                      </div>
                    </div>
                  )}

                  {selectedGuideTask === 'notif' && (
                    <div className="space-y-3.5 animate-fade-in">
                      <div className="flex items-center gap-2 text-blue-400">
                        <Bell size={16} />
                        <h4 className="text-xs font-black uppercase tracking-wider">2. Configure Alert Preferences</h4>
                      </div>
                      <p className="text-[11px] text-zinc-400 leading-relaxed">
                        Configure granular alerts so they receive automated notifications for campaign milestones, project comments, and status reassignments.
                      </p>
                      <div className="bg-zinc-900/60 p-3 rounded-xl border border-zinc-850 space-y-1.5">
                        <h5 className="text-[10px] font-black uppercase tracking-wider text-white">Automated alert paths:</h5>
                        <p className="text-[10px] text-zinc-500 leading-normal">
                          Configuring alert filters protects collaborators from inbox fatigue. Enables direct integration triggers for Slack hook dispatches.
                        </p>
                      </div>
                    </div>
                  )}

                  {selectedGuideTask === 'scope' && (
                    <div className="space-y-3.5 animate-fade-in">
                      <div className="flex items-center gap-2 text-emerald-400">
                        <Shield size={16} />
                        <h4 className="text-xs font-black uppercase tracking-wider">3. Authorize Project Clearance Boundaries</h4>
                      </div>
                      <p className="text-[11px] text-zinc-400 leading-relaxed">
                        Verify and validate that the collaborator's role has been locked to the correct project-specific clearance level.
                      </p>
                      <div className="bg-zinc-900/60 p-3 rounded-xl border border-zinc-850 text-zinc-500 text-[10px] space-y-1">
                        <div>Admin Clearance: <span className="text-red-400 font-bold">Level 3 - Full Authority</span></div>
                        <div>Editor Clearance: <span className="text-blue-400 font-bold">Level 2 - Write Drafts</span></div>
                        <div>Viewer Clearance: <span className="text-zinc-400 font-bold">Level 1 - Read Only</span></div>
                      </div>
                    </div>
                  )}

                  {selectedGuideTask === 'profile' && (
                    <div className="space-y-3.5 animate-fade-in">
                      <div className="flex items-center gap-2 text-purple-400">
                        <Star size={16} />
                        <h4 className="text-xs font-black uppercase tracking-wider">4. Register Technical Skills Profile</h4>
                      </div>
                      <p className="text-[11px] text-zinc-400 leading-relaxed">
                        Make sure their active professional expertise (such as SEO Copywriting, Campaign Architecture, analytics) is indexed in the database.
                      </p>
                      <div className="bg-zinc-900/60 p-3 rounded-xl border border-zinc-850 text-zinc-500 text-[10px] leading-relaxed">
                        Registering skills allows the AI Strategic Capacity Planner to propose optimal task swaps in the auto-rebalancer during over-capacity conditions.
                      </div>
                    </div>
                  )}
                </div>

                {/* Simulation Completer Button */}
                <div className="pt-4 border-t border-zinc-850 flex items-center justify-between gap-4">
                  <div className="text-[10px] text-zinc-500 italic">
                    Logged in as: workspace owner admin.
                  </div>
                  
                  {(() => {
                    let tasks: OnboardingTask[] = [];
                    try {
                      tasks = JSON.parse(selectedOnboardingMember.onboarding_checklist || '[]');
                    } catch (e) {}

                    const currentTaskObj = tasks.find(t => t.id === selectedGuideTask);
                    const isCompleted = currentTaskObj?.completed || false;

                    return (
                      <button
                        onClick={() => currentTaskObj && handleToggleOnboardingTask(currentTaskObj)}
                        className={`px-4 py-2 text-[10px] font-black uppercase tracking-wider rounded-xl transition-all cursor-pointer flex items-center gap-1.5 ${
                          isCompleted 
                            ? 'bg-zinc-900 border border-zinc-850 hover:bg-zinc-800 text-zinc-400' 
                            : 'bg-red-600 hover:bg-red-500 text-white shadow-lg shadow-red-600/10'
                        }`}
                      >
                        <Check size={11} />
                        {isCompleted ? 'Mark step Incomplete' : 'Simulate collaborator completing step'}
                      </button>
                    );
                  })()}
                </div>
              </div>
            </div>

            {/* Confetti or All completed celebration */}
            {(() => {
              let tasks: OnboardingTask[] = [];
              try {
                tasks = JSON.parse(selectedOnboardingMember.onboarding_checklist || '[]');
              } catch (e) {}

              const isFullyDone = tasks.length > 0 && tasks.every(t => t.completed);
              if (isFullyDone) {
                return (
                  <div className="bg-emerald-500/10 border border-emerald-500/20 p-3.5 rounded-xl flex items-center gap-3 text-emerald-400">
                    <Smile className="text-emerald-400 shrink-0" size={20} />
                    <div className="text-[11px]">
                      <strong className="font-bold">Onboarding complete!</strong> This collaborator has finished the core workflow. Their profile is fully cleared and promoted in the network!
                    </div>
                  </div>
                );
              }
              return null;
            })()}

            <div className="flex justify-end pt-3 border-t border-zinc-800">
              <button
                onClick={() => setSelectedOnboardingMember(null)}
                className="px-5 py-2.5 bg-zinc-950 hover:bg-zinc-850 border border-zinc-800 text-zinc-400 hover:text-white text-xs font-black uppercase rounded-xl transition-colors cursor-pointer"
              >
                Close Workthrough
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
