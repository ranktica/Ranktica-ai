import React, { createContext, useContext, useState, useEffect } from 'react';
import { Project, ProjectContextType, CostEstimation, Workspace } from '@/shared/types';
import { db } from '@/infrastructure/db/database';
import { doc, setDoc, deleteDoc, collection, onSnapshot, query } from 'firebase/firestore';
import { firestoreDb, auth } from '@/infrastructure/auth/firebase';
import { useAuth } from '@/infrastructure/auth/AuthContext';
import { toast } from 'react-hot-toast';
import { offlineCache } from '@/shared/offlineCache';
import { secureStorage } from '@/shared/secureStorage';
import { backgroundSyncService } from '@/shared/backgroundSyncService';

enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  }
}

function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData?.map(provider => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || []
    },
    operationType,
    path
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

const ProjectContext = createContext<ProjectContextType | undefined>(undefined);

const DEFAULT_WORKSPACES: Workspace[] = [
  {
    id: 'ws-techpulse',
    name: 'TechPulse AI',
    handle: '@techpulse_ai',
    niche: 'AI & Modern Coding',
    audience: 'Developers & Tech Enthusiasts',
    pipelineGoal: '2 short tutorials & 1 deep-dive video per week'
  },
  {
    id: 'ws-retrolounge',
    name: 'Retro Gaming Lounge',
    handle: '@retrolounge',
    niche: 'Gaming & Retro Emulation',
    audience: '90s Gamers & Nostalgia Seekers',
    pipelineGoal: '1 retro console review & retrospective per week'
  },
  {
    id: 'ws-financeflow',
    name: 'FinanceFlow Daily',
    handle: '@financeflow_daily',
    niche: 'Personal Finance & Career',
    audience: 'Young Professionals & Investors',
    pipelineGoal: 'Daily financial shorts & weekly market analysis'
  }
];

export const ProjectProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [searchQuery, setSearchQuery] = useState('');

  const searchResults = React.useMemo(() => {
    if (!searchQuery.trim()) return projects;
    const queryLow = searchQuery.toLowerCase().trim();
    return projects.filter(p => {
      const titleMatches = p.title?.toLowerCase().includes(queryLow) || false;
      const statusMatches = p.status?.toLowerCase().includes(queryLow) || false;
      
      const creationDateStr = (() => {
        const timestamp = Number(p.id);
        if (!isNaN(timestamp) && timestamp > 0) {
          const d = new Date(timestamp);
          return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')} ${d.toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })}`;
        }
        return '';
      })();
      const dateMatches = creationDateStr.toLowerCase().includes(queryLow);

      return titleMatches || statusMatches || dateMatches;
    });
  }, [projects, searchQuery]);

  const [activeProjectId, setActiveProjectId] = useState<string | null>(() => {
    return localStorage.getItem('ranktica_active_project_id');
  });
  const [isSyncing, setIsSyncing] = useState(false);
  const [collaborators, setCollaborators] = useState<Array<{ userId: string; name: string; lastActive: number; activeTool?: string }>>([]);
  const [isOffline, setIsOffline] = useState(!navigator.onLine);
  const [offlineQueueSize, setOfflineQueueSize] = useState(0);
  const [offlineQueue, setOfflineQueue] = useState<any[]>([]);
  const [lastAutoSavedAt, setLastAutoSavedAt] = useState<number | null>(null);
  const [isAutoSaving, setIsAutoSaving] = useState<boolean>(false);

  const [workspaces, setWorkspaces] = useState<Workspace[]>(() => {
    const saved = localStorage.getItem('ranktica_workspaces');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.warn('Error parsing workspaces', e);
      }
    }
    return DEFAULT_WORKSPACES;
  });

  const [activeWorkspaceId, setActiveWorkspaceId] = useState<string>(() => {
    const savedId = localStorage.getItem('ranktica_active_workspace_id');
    if (savedId) {
      return savedId;
    }
    return DEFAULT_WORKSPACES[0].id;
  });

  useEffect(() => {
    localStorage.setItem('ranktica_workspaces', JSON.stringify(workspaces));
  }, [workspaces]);

  useEffect(() => {
    localStorage.setItem('ranktica_active_workspace_id', activeWorkspaceId);
  }, [activeWorkspaceId]);

  const createWorkspace = async (name: string, niche: string, audience: string, handle?: string, pipelineGoal?: string) => {
    const newWs: Workspace = {
      id: 'ws-' + Date.now(),
      name,
      niche,
      audience,
      handle: handle || `@${name.toLowerCase().replace(/\s+/g, '_')}`,
      pipelineGoal: pipelineGoal || 'Continuous content pipeline'
    };
    setWorkspaces(prev => [...prev, newWs]);
    setActiveWorkspaceId(newWs.id);
    toast.success(`New YouTube channel workspace "${name}" deployed successfully! 🚀`);
  };

  const deleteWorkspace = async (id: string) => {
    if (workspaces.length <= 1) {
      toast.error('Cannot delete the last workspace. Keep at least one pipeline active.');
      return;
    }
    const filtered = workspaces.filter(w => w.id !== id);
    setWorkspaces(filtered);
    if (activeWorkspaceId === id) {
      setActiveWorkspaceId(filtered[0].id);
    }
    toast.success('YouTube channel workspace retired.');
  };

  const { user } = useAuth();

  // Offline Sync and Service Worker Synchronization Coordination Loop
  useEffect(() => {
    // Register backgroundSyncService queue change callback to keep React states updated
    backgroundSyncService.registerQueueChangeCallback((queue) => {
      setOfflineQueue(queue);
      setOfflineQueueSize(queue.length);
    });

    // Load initial queue state from offlineCache IndexedDB
    const loadInitialQueue = async () => {
      const queue = await backgroundSyncService.getQueue();
      setOfflineQueue(queue);
      setOfflineQueueSize(queue.length);
      
      // Auto-trigger sync on load if device is currently online
      if (navigator.onLine && queue.length > 0) {
        await backgroundSyncService.syncPendingActionsToFirestore();
      }
    };
    loadInitialQueue();

    const handleOnline = () => {
      setIsOffline(false);
      toast.success('Connection restored! Synchronizing workspace edits with cloud database...', {
        id: 'sync-restored',
        icon: '☁️'
      });
      backgroundSyncService.syncPendingActionsToFirestore();
    };

    const handleOffline = () => {
      setIsOffline(true);
      toast.error('Working offline. All changes will be safely queued locally.', {
        id: 'sync-offline',
        icon: '🔌'
      });
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    const handleSWMessage = async (event: MessageEvent) => {
      if (!event.data) return;
      if (event.data.type === 'OFFLINE_QUEUE_UPDATED') {
        setOfflineQueueSize(event.data.queueSize || 0);
        setOfflineQueue(event.data.queue || []);
        // Save to offlineCache persistent state
        offlineCache.saveState('pending_sync_queue', event.data.queue || []).catch(() => {});
      } else if (event.data.type === 'SYNC_FLUSH_REQUEST') {
        setIsSyncing(true);
        try {
          await backgroundSyncService.syncPendingActionsToFirestore();
        } finally {
          setIsSyncing(false);
        }
      }
    };

    if (navigator.serviceWorker) {
      navigator.serviceWorker.addEventListener('message', handleSWMessage);
      // Initialize query on registration to fetch current queue elements
      if (navigator.serviceWorker.controller) {
        navigator.serviceWorker.controller.postMessage({ type: 'GET_SYNC_QUEUE' });
      }
    }

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      if (navigator.serviceWorker) {
        navigator.serviceWorker.removeEventListener('message', handleSWMessage);
      }
    };
  }, []);

  // Initial Load from local SQLite
  useEffect(() => {
    const load = async () => {
      try {
        const data = await db.getProjects();
        const mapped = data.map((p: any) => ({
          ...p,
          deadline: p.deadline || p.assets?.deadline || '',
          milestones: p.milestones || p.assets?.milestones || []
        }));
        setProjects(mapped);
        if (mapped.length > 0) {
          const activeOne = mapped.find(p => !p.archived) || mapped[0];
          setActiveProjectId(activeOne.id);
        }
      } catch (err) {
        console.error('[ProjectContext] Failed to load projects from DB:', err);
      }
    };
    load();

    const handleRecovery = () => {
      console.log('[ProjectContext] Graceful recovery triggered, re-loading projects...');
      load();
    };
    window.addEventListener('ranktica-graceful-recovery', handleRecovery);
    return () => {
      window.removeEventListener('ranktica-graceful-recovery', handleRecovery);
    };
  }, []);

  // Real-time Firestore document updates
  useEffect(() => {
    if (!user) return;
    const q = query(collection(firestoreDb, 'projects'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      snapshot.docChanges().forEach((change) => {
        const remotePrjRaw = change.doc.data() as Project;
        const remotePrj: Project = {
          ...remotePrjRaw,
          deadline: remotePrjRaw.deadline || remotePrjRaw.assets?.deadline || '',
          milestones: remotePrjRaw.milestones || remotePrjRaw.assets?.milestones || []
        };
        if (change.type === 'added' || change.type === 'modified') {
          setProjects(prevProjects => {
            const index = prevProjects.findIndex(p => p.id === remotePrj.id);
            if (index === -1) {
              // Store locally as well for offline fallback
              db.saveProject(remotePrj);
              return [remotePrj, ...prevProjects];
            } else {
              const localPrj = prevProjects[index];
              // Only overwrite if remote has newest updates
              if (remotePrj.lastUpdated > localPrj.lastUpdated) {
                db.saveProject(remotePrj);
                return prevProjects.map(p => p.id === remotePrj.id ? remotePrj : p);
              }
            }
            return prevProjects;
          });
        } else if (change.type === 'removed') {
          setProjects(prevProjects => {
            db.deleteProject(remotePrj.id);
            return prevProjects.filter(p => p.id !== remotePrj.id);
          });
        }
      });
    }, (error) => {
      console.warn('[Firestore Sync] Subscription bypassed or offline:', error);
    });

    return () => unsubscribe();
  }, [user]);

  // Active Project Real-Time Listener & Collaborative Edits Detector
  useEffect(() => {
    if (!activeProjectId || !user) return;

    const docRef = doc(firestoreDb, 'projects', activeProjectId);
    const unsubscribe = onSnapshot(docRef, (docSnap) => {
      if (!docSnap.exists()) return;
      
      const remotePrjRaw = docSnap.data() as Project;
      const remotePrj: Project = {
        ...remotePrjRaw,
        deadline: remotePrjRaw.deadline || remotePrjRaw.assets?.deadline || '',
        milestones: remotePrjRaw.milestones || remotePrjRaw.assets?.milestones || []
      };

      setProjects(prevProjects => {
        const localPrj = prevProjects.find(p => p.id === remotePrj.id);
        if (!localPrj) {
          db.saveProject(remotePrj);
          return [remotePrj, ...prevProjects];
        }

        const isNewer = remotePrj.lastUpdated > localPrj.lastUpdated;
        
        if (isNewer) {
          const currentStr = JSON.stringify(localPrj);
          const remoteStr = JSON.stringify(remotePrj);
          
          if (currentStr !== remoteStr && remoteStr !== lastSavedStateRef.current) {
            console.log('[Firestore Collab] Remote collaborative edit detected on project:', remotePrj.id);
            toast('Teammate Collaborative Edit synchronized! 👥', {
              id: `collab-edit-${remotePrj.id}`,
              icon: '👥',
              duration: 3000
            });
            
            db.saveProject(remotePrj);
            return prevProjects.map(p => p.id === remotePrj.id ? remotePrj : p);
          }
        }
        return prevProjects;
      });

      // Track user presence dynamically & emit real-time project document update event
      updateUserPresence();

      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('ranktica-active-project-document-updated', {
          detail: { 
            projectId: activeProjectId, 
            project: remotePrj,
            timestamp: Date.now()
          }
        }));
      }
    }, (error) => {
      console.warn('[Firestore Active Listener] Bypassed or offline:', error);
      try {
        handleFirestoreError(error, OperationType.GET, `projects/${activeProjectId}`);
      } catch (err) {
        console.error('[Secure Error Logged]', err);
      }
    });

    return () => unsubscribe();
  }, [activeProjectId, user]);

  // Presence Tracking
  const updateUserPresence = async (activeTool?: string) => {
    if (!activeProjectId || !user) return;
    try {
      const email = user.email || 'anonymous';
      const userIdSafe = email.replace(/[^a-zA-Z0-9]/g, '_');
      const presenceRef = doc(firestoreDb, 'projects', activeProjectId, 'presence', userIdSafe);
      await setDoc(presenceRef, {
        userId: email,
        name: user.name || 'Anonymous Creator',
        lastActive: Date.now(),
        activeTool: activeTool || 'Dashboard'
      }, { merge: true });
    } catch (e) {
      console.warn('[Presence] Failed to write presence:', e);
    }
  };

  useEffect(() => {
    if (!activeProjectId || !user) {
      setCollaborators([]);
      return;
    }

    const presenceCol = collection(firestoreDb, 'projects', activeProjectId, 'presence');
    const unsubscribe = onSnapshot(presenceCol, (snapshot) => {
      const list: any[] = [];
      const cutoff = Date.now() - 30 * 1000; // 30 seconds inactivity timeout
      snapshot.forEach(docDoc => {
        const data = docDoc.data();
        if (data.lastActive > cutoff) {
          list.push(data);
        }
      });
      setCollaborators(list);

      // Emit real-time presence update events to the UI layer
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('ranktica-presence-updated', {
          detail: { 
            collaborators: list, 
            activeProjectId,
            timestamp: Date.now()
          }
        }));
      }
    }, (err) => {
      console.warn('[Presence Snapshot Error]', err);
      try {
        handleFirestoreError(err, OperationType.GET, `projects/${activeProjectId}/presence`);
      } catch (error) {
        console.error('[Secure Presence Error Logged]', error);
      }
    });

    // Send initial presence
    updateUserPresence('Dashboard');

    // Regularly update presence to stay online
    const interval = setInterval(() => {
      updateUserPresence();
    }, 15000);

    return () => {
      clearInterval(interval);
      unsubscribe();
    };
  }, [activeProjectId, user]);

  const activeProject = projects.find(p => p.id === activeProjectId) || null;

  const setActiveProjectById = (id: string) => {
    setActiveProjectId(id);
    localStorage.setItem('ranktica_active_project_id', id);
  };

  const syncProjectToFirestore = async (project: Project) => {
    if (!navigator.onLine) {
      await backgroundSyncService.addPendingAction(project);
      toast('Workspace change saved locally and queued for cloud sync', {
        id: `sw-queue-${project.id}`,
        icon: '📥'
      });
      return;
    }

    try {
      const prjRef = doc(firestoreDb, 'projects', project.id);
      await setDoc(prjRef, project, { merge: true });
    } catch (e) {
      console.warn('[Firestore Sync] Offline fallback trigger:', e);
      await backgroundSyncService.addPendingAction(project);
      toast('Direct cloud save failed, queued locally for auto-sync', {
        id: `sw-queue-err-${project.id}`,
        icon: '📥'
      });
    }
  };

  const syncDeleteFromFirestore = async (id: string) => {
    try {
      const prjRef = doc(firestoreDb, 'projects', id);
      await deleteDoc(prjRef);
    } catch (e) {
      console.warn('[Firestore Sync] Deletion failed/offline:', e);
    }
  };

  const updateActiveProject = async (updates: Partial<Project>) => {
    if (!activeProjectId) return;
    setIsSyncing(true);
    
    const updatedProjects = projects.map(p => 
      p.id === activeProjectId ? { ...p, ...updates, lastUpdated: Date.now() } : p
    );
    
    setProjects(updatedProjects);
    const updatedProject = updatedProjects.find(p => p.id === activeProjectId);
    if (updatedProject) {
      await db.saveProject(updatedProject);
      await syncProjectToFirestore(updatedProject);
    }
    
    setIsSyncing(false);
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('ranktica-auto-save-operation', {
        detail: { timestamp: Date.now() }
      }));
    }
  };

  const createProject = async (title: string, niche: string, audience: string = 'General Audience', templateType?: string) => {
    setIsSyncing(true);
    
    // Generate pre-filled milestones/workflow stages if templateType is selected
    let initialMilestones: any[] = [];
    if (templateType) {
      const formatDate = (date: Date) => {
        const yyyy = date.getFullYear();
        const mm = String(date.getMonth() + 1).padStart(2, '0');
        const dd = String(date.getDate()).padStart(2, '0');
        return `${yyyy}-${mm}-${dd}`;
      };

      if (templateType === 'gaming') {
        const stages = [
          { title: 'Hardware Configuration Audit', offsetDays: 1 },
          { title: 'Lighting & Camera Positioning', offsetDays: 3 },
          { title: 'Audio Calibration & Noise Gate Setup', offsetDays: 5 },
          { title: 'B-Roll Production & Asset Import', offsetDays: 7 },
          { title: 'Fine-Tuning & Final Performance Benchmarks', offsetDays: 9 },
        ];
        initialMilestones = stages.map((st, idx) => {
          const d = new Date();
          d.setDate(d.getDate() + st.offsetDays);
          return {
            id: `ml-gaming-${idx}-${Date.now()}`,
            title: st.title,
            date: formatDate(d),
            completed: false
          };
        });
      } else if (templateType === 'educational') {
        const stages = [
          { title: 'Academic Literature Review & Outline', offsetDays: 1 },
          { title: 'Script Annotation & Key Concept Callouts', offsetDays: 3 },
          { title: 'Recording Slides & Software Screencast', offsetDays: 5 },
          { title: 'Visual Graphics & Animation Overlay', offsetDays: 7 },
          { title: 'Interactive Formats & Quiz Asset Sync', offsetDays: 9 },
        ];
        initialMilestones = stages.map((st, idx) => {
          const d = new Date();
          d.setDate(d.getDate() + st.offsetDays);
          return {
            id: `ml-edu-${idx}-${Date.now()}`,
            title: st.title,
            date: formatDate(d),
            completed: false
          };
        });
      } else if (templateType === 'vlogs') {
        const stages = [
          { title: 'Location Scouting & Audio/Wind Check', offsetDays: 1 },
          { title: 'Primary Vlog Assembly & A-Roll Selects', offsetDays: 3 },
          { title: 'Sound Design & Color Grade Grading', offsetDays: 5 },
          { title: 'Intro Sequence & Captions Generation', offsetDays: 7 },
          { title: 'High-Impact Thumbnail Concept Sync', offsetDays: 9 },
        ];
        initialMilestones = stages.map((st, idx) => {
          const d = new Date();
          d.setDate(d.getDate() + st.offsetDays);
          return {
            id: `ml-vlog-${idx}-${Date.now()}`,
            title: st.title,
            date: formatDate(d),
            completed: false
          };
        });
      }
    }

    const newProject: Project = {
      id: Date.now().toString(),
      title,
      niche,
      audience,
      status: 'idea',
      lastUpdated: Date.now(),
      assets: initialMilestones.length > 0 ? { milestones: initialMilestones } : {},
      milestones: initialMilestones.length > 0 ? initialMilestones : undefined,
      team: [user?.email || 'AI Swarm Owner'],
      workspaceId: activeWorkspaceId
    };
    
    const newList = [newProject, ...projects];
    setProjects(newList);
    setActiveProjectId(newProject.id);
    await db.saveProject(newProject);
    await syncProjectToFirestore(newProject);
    setIsSyncing(false);
  };

  const updateProject = async (id: string, updates: Partial<Project>) => {
    setIsSyncing(true);
    const updatedProjects = projects.map(p => {
      if (p.id === id) {
        const newAssets = { ...p.assets };
        if (updates.deadline !== undefined) {
          newAssets.deadline = updates.deadline;
        }
        if (updates.milestones !== undefined) {
          newAssets.milestones = updates.milestones;
        }
        return { 
          ...p, 
          ...updates, 
          assets: newAssets,
          lastUpdated: Date.now() 
        };
      }
      return p;
    });
    setProjects(updatedProjects);
    const updatedProject = updatedProjects.find(p => p.id === id);
    if (updatedProject) {
      await db.saveProject(updatedProject);
      await syncProjectToFirestore(updatedProject);
    }
    setIsSyncing(false);
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('ranktica-auto-save-operation', {
        detail: { timestamp: Date.now() }
      }));
    }
  };

  const toggleArchiveProject = async (id: string) => {
    setIsSyncing(true);
    const targetProj = projects.find(p => p.id === id);
    const isNowArchived = !targetProj?.archived;
    const updatedProjects = projects.map(p => {
      if (p.id === id) {
        const nextArchived = !p.archived;
        const nextStatus = nextArchived ? 'archive' : (p.status === 'archive' ? 'idea' : p.status);
        return { 
          ...p, 
          archived: nextArchived, 
          status: nextStatus as any,
          lastUpdated: Date.now() 
        };
      }
      return p;
    });
    setProjects(updatedProjects);

    if (isNowArchived && activeProjectId === id) {
      const remaining = updatedProjects.filter(p => !p.archived && p.status !== 'archive');
      setActiveProjectId(remaining.length > 0 ? remaining[0].id : (updatedProjects.length > 0 ? updatedProjects[0].id : null));
    } else if (!isNowArchived && !activeProjectId) {
      setActiveProjectId(id);
    }

    const updatedProject = updatedProjects.find(p => p.id === id);
    if (updatedProject) {
      await db.saveProject(updatedProject);
      await syncProjectToFirestore(updatedProject);
    }
    setIsSyncing(false);
  };

  const deleteProject = async (id: string) => {
    setIsSyncing(true);
    const newList = projects.filter(p => p.id !== id);
    setProjects(newList);
    if (activeProjectId === id) {
      const remaining = newList.filter(p => !p.archived && p.status !== 'archive');
      setActiveProjectId(remaining.length > 0 ? remaining[0].id : (newList.length > 0 ? newList[0].id : null));
    }
    await db.deleteProject(id);
    await syncDeleteFromFirestore(id);
    setIsSyncing(false);
  };

  const bulkDeleteProjects = async (ids: string[]) => {
    setIsSyncing(true);
    const newList = projects.filter(p => !ids.includes(p.id));
    setProjects(newList);
    if (activeProjectId && ids.includes(activeProjectId)) {
      const remaining = newList.filter(p => !p.archived && p.status !== 'archive');
      setActiveProjectId(remaining.length > 0 ? remaining[0].id : (newList.length > 0 ? newList[0].id : null));
    }
    for (const id of ids) {
      await db.deleteProject(id);
      await syncDeleteFromFirestore(id);
    }
    setIsSyncing(false);
  };

  const bulkArchiveProjects = async (ids: string[], archiveState?: boolean) => {
    setIsSyncing(true);
    const updatedProjects = projects.map(p => {
      if (ids.includes(p.id)) {
        const targetArchived = archiveState !== undefined ? archiveState : !p.archived;
        const nextStatus = targetArchived ? 'archive' : (p.status === 'archive' ? 'idea' : p.status);
        return { 
          ...p, 
          archived: targetArchived, 
          status: nextStatus as any,
          lastUpdated: Date.now() 
        };
      }
      return p;
    });
    setProjects(updatedProjects);

    if (activeProjectId && ids.includes(activeProjectId)) {
      const updatedActiveProj = updatedProjects.find(p => p.id === activeProjectId);
      if (updatedActiveProj?.archived || updatedActiveProj?.status === 'archive') {
        const remaining = updatedProjects.filter(p => !p.archived && p.status !== 'archive');
        setActiveProjectId(remaining.length > 0 ? remaining[0].id : (updatedProjects.length > 0 ? updatedProjects[0].id : null));
      }
    }

    for (const id of ids) {
      const updatedProject = updatedProjects.find(p => p.id === id);
      if (updatedProject) {
        await db.saveProject(updatedProject);
        await syncProjectToFirestore(updatedProject);
      }
    }
    setIsSyncing(false);
  };

  const addScriptVersion = async (projectId: string, content: string, label?: string) => {
    setIsSyncing(true);
    const updatedProjects = projects.map(p => {
      if (p.id !== projectId) return p;
      const history = p.assets.scriptHistory || [];
      const newVersion = {
        id: Date.now().toString() + Math.random().toString(36).substr(2, 4),
        content,
        timestamp: Date.now(),
        label: label || `Script v${history.length + 1}`
      };
      return {
        ...p,
        lastUpdated: Date.now(),
        assets: {
          ...p.assets,
          script: content,
          scriptHistory: [newVersion, ...history]
        }
      };
    });
    setProjects(updatedProjects);
    const updatedProject = updatedProjects.find(p => p.id === projectId);
    if (updatedProject) {
      await db.saveProject(updatedProject);
      await syncProjectToFirestore(updatedProject);
    }
    setIsSyncing(false);
  };

  const addTitleVersion = async (projectId: string, title: string, label?: string) => {
    setIsSyncing(true);
    const updatedProjects = projects.map(p => {
      if (p.id !== projectId) return p;
      const history = p.assets.titleHistory || [];
      const newVersion = {
        id: Date.now().toString() + Math.random().toString(36).substr(2, 4),
        title,
        timestamp: Date.now(),
        label: label || `Title v${history.length + 1}`
      };
      const existingSeo = p.assets.seo || { titles: [], description: '', tags: [], hashtags: [], semanticClusters: [] };
      const updatedTitles = [title, ...existingSeo.titles.filter((t: string) => t !== title)];
      return {
        ...p,
        title: title,
        lastUpdated: Date.now(),
        assets: {
          ...p.assets,
          seo: {
            ...existingSeo,
            titles: updatedTitles
          },
          titleHistory: [newVersion, ...history]
        }
      };
    });
    setProjects(updatedProjects);
    const updatedProject = updatedProjects.find(p => p.id === projectId);
    if (updatedProject) {
      await db.saveProject(updatedProject);
      await syncProjectToFirestore(updatedProject);
    }
    setIsSyncing(false);
  };

  const revertToScriptVersion = async (projectId: string, versionId: string) => {
    setIsSyncing(true);
    const updatedProjects = projects.map(p => {
      if (p.id !== projectId) return p;
      const history = p.assets.scriptHistory || [];
      const version = history.find(v => v.id === versionId);
      if (!version) return p;
      return {
        ...p,
        lastUpdated: Date.now(),
        assets: {
          ...p.assets,
          script: version.content
        }
      };
    });
    setProjects(updatedProjects);
    const updatedProject = updatedProjects.find(p => p.id === projectId);
    if (updatedProject) {
      await db.saveProject(updatedProject);
      await syncProjectToFirestore(updatedProject);
    }
    setIsSyncing(false);
  };

  const revertToTitleVersion = async (projectId: string, versionId: string) => {
    setIsSyncing(true);
    const updatedProjects = projects.map(p => {
      if (p.id !== projectId) return p;
      const history = p.assets.titleHistory || [];
      const version = history.find(v => v.id === versionId);
      if (!version) return p;
      const existingSeo = p.assets.seo || { titles: [], description: '', tags: [], hashtags: [], semanticClusters: [] };
      const updatedTitles = [version.title, ...existingSeo.titles.filter((t: string) => t !== version.title)];
      return {
        ...p,
        title: version.title,
        lastUpdated: Date.now(),
        assets: {
          ...p.assets,
          seo: {
            ...existingSeo,
            titles: updatedTitles
          }
        }
      };
    });
    setProjects(updatedProjects);
    const updatedProject = updatedProjects.find(p => p.id === projectId);
    if (updatedProject) {
      await db.saveProject(updatedProject);
      await syncProjectToFirestore(updatedProject);
    }
    setIsSyncing(false);
  };

  const addCustomProject = async (project: Project) => {
    setIsSyncing(true);
    const enrichedProject = {
      ...project,
      workspaceId: project.workspaceId || activeWorkspaceId
    };
    const newList = [enrichedProject, ...projects];
    setProjects(newList);
    setActiveProjectId(enrichedProject.id);
    await db.saveProject(enrichedProject);
    await syncProjectToFirestore(enrichedProject);
    setIsSyncing(false);
  };

  const backupProjectToCloud = async (projectId: string): Promise<void> => {
    const project = projects.find(p => p.id === projectId);
    if (!project) {
      throw new Error('Project not found');
    }

    if (!navigator.onLine) {
      throw new Error('You are currently offline. Cloud backup requires an active internet connection.');
    }

    const currentUser = auth.currentUser;
    if (!currentUser) {
      throw new Error('No authenticated user found. Please sign in with Google to use cloud backup.');
    }

    setIsSyncing(true);
    const updatedProject: Project = {
      ...project,
      ownerId: currentUser.uid,
      lastUpdated: Date.now()
    };

    // Update local state and sqlite
    setProjects(prev => prev.map(p => p.id === projectId ? updatedProject : p));
    await db.saveProject(updatedProject);

    try {
      const prjRef = doc(firestoreDb, 'projects', projectId);
      await setDoc(prjRef, updatedProject, { merge: true });
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, `projects/${projectId}`);
    } finally {
      setIsSyncing(false);
    }
  };

  // Keep track of the last saved state to avoid redundant Firestore writes
  const lastSavedStateRef = React.useRef<string>('');

  // Periodic Firestore Auto-Save Loop
  useEffect(() => {
    const timer = setInterval(async () => {
      if (!activeProject) return;
      const currentStr = JSON.stringify(activeProject);
      if (currentStr === lastSavedStateRef.current) {
        return; // No differences, skip
      }

      console.debug('[Firestore Auto-Save] Unsaved local modifications detected. Persisting project to Firestore...', activeProject.id);
      setIsSyncing(true);
      setIsAutoSaving(true);
      try {
        await db.saveProject(activeProject);
        await syncProjectToFirestore(activeProject);
        lastSavedStateRef.current = currentStr;
        setLastAutoSavedAt(Date.now());
        
        // Show a discrete success indicator
        toast.success(`Active manifest "${activeProject.title}" auto-saved to Firestore`, {
          id: 'cloud-autosave-success',
          duration: 2000,
          icon: '☁️'
        });
      } catch (err) {
        console.warn('[Firestore Auto-Save] Periodic save failed:', err);
      } finally {
        setIsSyncing(false);
        setIsAutoSaving(false);
      }
    }, 30000); // Check for modifications every 30 seconds

    return () => clearInterval(timer);
  }, [activeProject]);

  // Sync initial state when activeProject is loaded or changed manually
  useEffect(() => {
    if (activeProject) {
      lastSavedStateRef.current = JSON.stringify(activeProject);
    }
  }, [activeProjectId]);

  const estimateTaskCost = (
    taskType: 'script' | 'video',
    params: { wordCount?: number; durationSeconds?: number; model?: string }
  ): CostEstimation => {
    if (taskType === 'script') {
      const model = params.model || 'gemini-2.5-flash';
      const wordCount = params.wordCount || 1000;
      
      const inputTokens = 1500;
      const outputTokens = Math.ceil(wordCount * 1.33);
      
      const isProModel = model.includes('pro');
      const inputRate = isProModel ? 1.25 / 1000000 : 0.075 / 1000000;
      const outputRate = isProModel ? 5.00 / 1000000 : 0.30 / 1000000;
      
      const apiCostUSD = (inputTokens * inputRate) + (outputTokens * outputRate);
      const limitCostCredits = isProModel ? 5 : 1;
      
      return {
        inputTokens,
        outputTokens,
        apiCostUSD,
        limitCostCredits
      };
    } else {
      const model = params.model || 'veo-3.1-lite';
      const durationSeconds = params.durationSeconds || 6;
      
      const isProVideo = model.includes('pro') || model.includes('3.1-generate');
      const ratePerSec = isProVideo ? 0.15 : 0.05;
      const apiCostUSD = durationSeconds * ratePerSec;
      
      const inputTokens = durationSeconds * 200;
      const outputTokens = durationSeconds * 1000;
      const limitCostCredits = isProVideo ? 20 : 10;
      
      return {
        inputTokens,
        outputTokens,
        apiCostUSD,
        limitCostCredits
      };
    }
  };

  const exportCrossPlatformConfig = (projectId: string) => {
    const proj = projects.find(p => p.id === projectId) || activeProject;
    const title = proj?.title || 'Untitled Project';
    const niche = proj?.niche || 'General Niche';
    const scriptText = proj?.assets?.script || '';

    // Extrapolate timing segments from script. Convert sentences or paragraphs to dynamic vertical cues.
    const rawParagraphs = scriptText && typeof scriptText === 'string' 
      ? scriptText.split('\n').filter((p: string) => p.trim()) 
      : [];
    const segments: Array<{ time: string; cue: string; action: string }> = [];
    
    if (rawParagraphs.length > 0) {
      // Create beautiful structured timing blocks
      rawParagraphs.forEach((para: string, idx: number) => {
        const timeSec = idx * 15;
        const mm = Math.floor(timeSec / 60);
        const ss = timeSec % 60;
        const timeStr = `[${mm.toString().padStart(2, '0')}:${ss.toString().padStart(2, '0')}]`;
        
        let cue = para;
        let action = 'Narrator delivery with close-up focus.';
        // If it starts with a visual bracket, parse it out
        const match = para.match(/^\[Visual:\s*(.*?)\]\s*(.*)/i);
        if (match) {
          action = match[1];
          cue = match[2] || 'Speaking sequence';
        }
        segments.push({
          time: timeStr,
          cue: cue.substring(0, 160) + (cue.length > 160 ? '...' : ''),
          action
        });
      });
    } else {
      // Add default hook and call-to-action segments
      segments.push({ time: '[00:00]', cue: `Hook: Solve a major ${niche} pain point in under 3 seconds!`, action: 'Dynamic typography pattern interrupt on screen.' });
      segments.push({ time: '[00:10]', cue: `Value: Deliver a high-retention value bullet tailored to ${proj?.audience || 'audience'}.`, action: 'Zoomed focus visual presentation.' });
      segments.push({ time: '[00:25]', cue: "Call-To-Action: Drop a comment and subscribe for real-time hacks direct.", action: 'Animated subscribe widget overlay.' });
    }

    const cleanTitle = title.replace(/[^\w\s-]/gi, '').substring(0, 50);

    return {
      tiktok: {
        title: `${cleanTitle} (TikTok Fit)`,
        caption: `🚀 ${title} - Designed for high-velocity loops. #fyp #foryou #${niche.replace(/\s+/g, '')}`,
        maxLength: "60 seconds",
        aspectRatio: "9:16 vertical (1080x1920)",
        recommendedAudio: "Upbeat Synth Sound Link / Trending Audio Match",
        hashtags: ["fyp", "foryou", niche.toLowerCase().replace(/\s+/g, ''), "growth", "trending"],
        visualPacingAdvice: "Inject jump-cuts every 1.8-2.2 seconds; loop first 2 seconds of visual timeline into last segment.",
        segments: segments.slice(0, 4)
      },
      instagram: {
        title: `${cleanTitle} (Instagram Reel)`,
        caption: `✨ ${title}. Tap link in bio for full workspace access! #${niche.replace(/\s+/g, '')} #creator`,
        maxLength: "90 seconds (Best kept under 30s)",
        aspectRatio: "9:16 vertical (1080x1920)",
        recommendedAudio: "Aesthetic Lofi Beats / Instrumental Minimal Tech",
        hashtags: ["reels", "creators", "aesthetic", niche.toLowerCase().replace(/\s+/g, ''), "viral"],
        visualPacingAdvice: "Focus heavily on typography alignment. Use clean charcoal/off-white display banners, centering text guides.",
        segments: segments.slice(0, 4)
      },
      youtube: {
        title: `${title.substring(0, 80)} #Shorts`,
        description: `Optimize your creator channel indexing today. This short outlines: ${title}.\n\nTimestamps:\n${segments.map(s => `${s.time} ${s.cue.substring(0,60)}`).join('\n')}\n\n#shorts #youtubeshorts #${niche.toLowerCase().replace(/\s+/g, '')}`,
        maxLength: "60 seconds MAX limit",
        aspectRatio: "9:16 vertical (1080x1920)",
        recommendedAudio: "High impact voiceover emphasis with subtle retro synth backdrop",
        hashtags: ["shorts", "youtubeshorts", niche.toLowerCase().replace(/\s+/g, ''), "education"],
        visualPacingAdvice: "Make sure the core question or problem is highlighted as bright yellow text on screen in the first 1.5 seconds.",
        segments: segments.slice(0, 4)
      }
    };
  };

  const getDaysUntilDeadline = (project: Project): number | null => {
    if (!project.deadline) return null;
    const deadlineMs = new Date(project.deadline).getTime();
    if (isNaN(deadlineMs)) return null;
    const diffTime = deadlineMs - Date.now();
    const diffDays = diffTime / (1000 * 60 * 60 * 24);
    return parseFloat(diffDays.toFixed(1));
  };

  const getDaysUntilMilestone = (milestoneDate: string): number | null => {
    if (!milestoneDate) return null;
    const milestoneMs = new Date(milestoneDate).getTime();
    if (isNaN(milestoneMs)) return null;
    const diffTime = milestoneMs - Date.now();
    const diffDays = diffTime / (1000 * 60 * 60 * 24);
    return parseFloat(diffDays.toFixed(1));
  };

  const exportProjectsToCSV = () => {
    if (projects.length === 0) {
      toast.error("No projects to export.");
      return;
    }
    const headers = [
      'Project ID',
      'Title',
      'Niche',
      'Audience',
      'Description',
      'Status',
      'Deadline',
      'Archived',
      'Workspace ID',
      'Team Members',
      'Last Updated',
      'Has Script',
      'Has Thumbnail',
      'Has Video URL'
    ];

    const escapeCSVValue = (val: any) => {
      if (val === undefined || val === null) return '';
      const str = String(val);
      if (str.includes(',') || str.includes('"') || str.includes('\n') || str.includes('\r')) {
        return `"${str.replace(/"/g, '""')}"`;
      }
      return str;
    };

    const rows = projects.map(p => {
      const formattedDate = new Date(p.lastUpdated).toISOString();
      return [
        p.id,
        p.title,
        p.niche,
        p.audience || '',
        p.description || '',
        p.status,
        p.deadline || p.assets?.deadline || '',
        p.archived ? 'TRUE' : 'FALSE',
        p.workspaceId || '',
        p.team ? p.team.join('; ') : '',
        formattedDate,
        p.assets?.script ? 'TRUE' : 'FALSE',
        p.assets?.thumbnail ? 'TRUE' : 'FALSE',
        p.assets?.videoUri ? 'TRUE' : 'FALSE'
      ].map(escapeCSVValue).join(',');
    });

    const csvContent = [headers.join(','), ...rows].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `ranktica-projects-export-${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast.success("All projects exported to CSV successfully! 📊");
  };

  // Debounced 30-Second Auto-Save Mechanism to IndexedDB
  const moduleFormStatesRef = React.useRef<Record<string, { toolId: string; formState: any; timestamp: number }>>({});

  useEffect(() => {
    const loadSavedModuleStates = async () => {
      try {
        const masterIdx = await secureStorage.getItem('ranktica_autosave_all_modules');
        if (masterIdx) {
          const parsed = JSON.parse(masterIdx);
          moduleFormStatesRef.current = parsed;
          console.log('[AutoSave] Restored module form states from IndexedDB for recovery:', Object.keys(parsed));
        }
      } catch (err) {
        console.warn('[AutoSave] Failed loading IndexedDB autosave states:', err);
      }
    };
    loadSavedModuleStates();
  }, []);

  const saveActiveModuleState = React.useCallback((toolId: string, formState: any) => {
    if (!toolId) return;
    moduleFormStatesRef.current[toolId] = {
      toolId,
      formState,
      timestamp: Date.now()
    };
  }, []);

  const getActiveModuleState = React.useCallback(async (toolId: string) => {
    if (!toolId) return null;
    if (moduleFormStatesRef.current[toolId]) {
      return moduleFormStatesRef.current[toolId].formState;
    }
    try {
      const raw = await secureStorage.getItem(`ranktica_autosave_module_${toolId}`);
      if (raw) {
        const parsed = JSON.parse(raw);
        return parsed.formState;
      }
    } catch (err) {
      console.warn('[AutoSave] Error reading module state from IndexedDB:', err);
    }
    return null;
  }, []);

  const clearModuleState = React.useCallback(async (toolId: string) => {
    if (!toolId) return;
    delete moduleFormStatesRef.current[toolId];
    try {
      await secureStorage.setItem(`ranktica_autosave_module_${toolId}`, '');
      await secureStorage.setItem('ranktica_autosave_all_modules', JSON.stringify(moduleFormStatesRef.current));
    } catch (e) {}
  }, []);

  // Debounced 30-second Auto-Save Interval Loop
  useEffect(() => {
    const interval = setInterval(async () => {
      const activeKeys = Object.keys(moduleFormStatesRef.current);
      if (activeKeys.length === 0) return;

      setIsAutoSaving(true);
      try {
        await secureStorage.setItem(
          'ranktica_autosave_all_modules',
          JSON.stringify(moduleFormStatesRef.current)
        );

        for (const toolId of activeKeys) {
          await secureStorage.setItem(
            `ranktica_autosave_module_${toolId}`,
            JSON.stringify(moduleFormStatesRef.current[toolId])
          );
        }

        const now = Date.now();
        setLastAutoSavedAt(now);

        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('ranktica-autosave-completed', {
            detail: { savedModules: activeKeys, timestamp: now }
          }));
        }
      } catch (err) {
        console.warn('[AutoSave] Debounced 30s serialization to IndexedDB failed:', err);
      } finally {
        setIsAutoSaving(false);
      }
    }, 30000); // Debounced 30 seconds

    return () => clearInterval(interval);
  }, []);

  return (
    <ProjectContext.Provider value={{ 
      projects, 
      activeProject, 
      searchQuery,
      setSearchQuery,
      searchResults,
      workspaces,
      activeWorkspaceId,
      setActiveWorkspaceId,
      createWorkspace,
      deleteWorkspace,
      setActiveProjectById, 
      updateActiveProject, 
      updateProject,
      createProject,
      toggleArchiveProject,
      deleteProject,
      bulkDeleteProjects,
      bulkArchiveProjects,
      isSyncing,
      isOffline,
      offlineQueueSize,
      offlineQueue,
      lastAutoSavedAt,
      isAutoSaving,
      saveActiveModuleState,
      getActiveModuleState,
      clearModuleState,
      addCustomProject,
      backupProjectToCloud,
      addScriptVersion,
      addTitleVersion,
      revertToScriptVersion,
      revertToTitleVersion,
      collaborators,
      updateUserPresence,
      estimateTaskCost,
      exportCrossPlatformConfig,
      getDaysUntilDeadline,
      getDaysUntilMilestone,
      exportProjectsToCSV
    }}>
      {children}
    </ProjectContext.Provider>
  );
};

export const useProject = () => {
  const context = useContext(ProjectContext);
  if (context === undefined) throw new Error('useProject must be used within ProjectProvider');
  return context;
};
