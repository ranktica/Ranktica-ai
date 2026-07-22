import React, { useState, useEffect, useMemo } from 'react';
import {
  Bell,
  X,
  Check,
  CheckCheck,
  Trash2,
  Activity,
  Coins,
  Users,
  AlertCircle,
  HelpCircle,
  Play,
  Settings,
  Sparkles,
  Clock,
  Layers,
  ChevronDown,
  Wrench,
  DollarSign
} from 'lucide-react';
import {
  NotificationItem,
  getNotifications,
  subscribeNotifications,
  markAllNotificationsAsRead,
  clearNotifications,
  removeNotification,
  addNotification
} from '@/infrastructure/notifications';
import { toast } from 'react-hot-toast';

interface NotificationCenterProps {
  onClose: () => void;
  userEmail?: string;
}

export const NotificationCenter: React.FC<NotificationCenterProps> = ({ onClose, userEmail }) => {
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [activeTab, setActiveTab] = useState<'All' | 'Task' | 'Budget' | 'Collaboration' | 'System' | 'Performance'>('All');
  const [runningTasks, setRunningTasks] = useState<Array<{ id: string; name: string; type: string; progress: number; etaSecs: number }>>([]);

  // Load and subscribe to notifications store
  useEffect(() => {
    setNotifications(getNotifications());
    const unsubscribe = subscribeNotifications(() => {
      setNotifications(getNotifications());
    });
    return unsubscribe;
  }, []);

  // Listen for System-Wide Event: Background Task Updates
  useEffect(() => {
    const handleTaskEvent = (e: Event) => {
      const customEvent = e as CustomEvent;
      const { id, name, type, duration, status, progress } = customEvent.detail || {};
      if (!id) return;

      if (status === 'start') {
        setRunningTasks(prev => {
          if (prev.some(t => t.id === id)) return prev;
          return [...prev, { id, name, type, progress: 0, etaSecs: duration || 15 }];
        });
        addNotification(`Background task initiated: ${name} [${type.toUpperCase()}]`, 'info', 'Task');
      } else if (status === 'complete') {
        setRunningTasks(prev => prev.filter(t => t.id !== id));
        addNotification(`Background task completed: ${name} (100% processed successfully)`, 'success', 'Task');
        toast.success(`Task completed: ${name} 🎉`);
      } else if (status === 'failed') {
        setRunningTasks(prev => prev.filter(t => t.id !== id));
        addNotification(`Background task failed: ${name}. Engine fallback triggered.`, 'error', 'Task');
        toast.error(`Task failed: ${name}`);
      } else if (status === 'update') {
        setRunningTasks(prev => prev.map(t => t.id === id ? { ...t, progress: progress ?? t.progress } : t));
      }
    };

    window.addEventListener('ranktica-background-task', handleTaskEvent);
    return () => window.removeEventListener('ranktica-background-task', handleTaskEvent);
  }, []);

  // Listen for System-Wide Event: Budget warnings
  useEffect(() => {
    const handleBudgetWarning = (e: Event) => {
      const customEvent = e as CustomEvent;
      const { message, severity, percentageSpent } = customEvent.detail || {};
      const finalMsg = message || `Budget alert: ${percentageSpent ?? 85}% of allocated cloud API budget credits consumed.`;
      
      addNotification(finalMsg, severity === 'critical' ? 'error' : 'warning', 'Budget');
      toast(finalMsg, {
        icon: severity === 'critical' ? '🚨' : '⚠️',
        duration: 5000
      });
    };

    window.addEventListener('ranktica-budget-warning', handleBudgetWarning);
    return () => window.removeEventListener('ranktica-budget-warning', handleBudgetWarning);
  }, []);

  // Listen for System-Wide Event: Team Collaboration
  useEffect(() => {
    const handleCollabEvent = (e: Event) => {
      const customEvent = e as CustomEvent;
      const { author, action, projectTitle } = customEvent.detail || {};
      const finalMsg = `${author || 'Collaborator'} ${action || 'synchronized workspace state'} inside project [${projectTitle || 'AI Revolution'}].`;

      addNotification(finalMsg, 'info', 'Collaboration');
      toast.success(`Collab: ${finalMsg}`);
    };

    window.addEventListener('ranktica-team-collab', handleCollabEvent);
    return () => window.removeEventListener('ranktica-team-collab', handleCollabEvent);
  }, []);

  // Task progress emulator interval
  useEffect(() => {
    if (runningTasks.length === 0) return;
    const interval = setInterval(() => {
      setRunningTasks(prev => {
        return prev.map(t => {
          if (t.progress >= 99) return t;
          const inc = Math.round(Math.random() * 8) + 3;
          const nextProgress = Math.min(99, t.progress + inc);
          
          // Trigger system update event
          if (nextProgress >= 99) {
            setTimeout(() => {
              window.dispatchEvent(new CustomEvent('ranktica-background-task', {
                detail: { id: t.id, name: t.name, type: t.type, status: 'complete' }
              }));
            }, 500);
          }
          return {
            ...t,
            progress: nextProgress,
            etaSecs: Math.max(0, t.etaSecs - 1)
          };
        });
      });
    }, 1500);
    return () => clearInterval(interval);
  }, [runningTasks.length]);

  // Filtering notifications
  const filteredNotifications = useMemo(() => {
    if (activeTab === 'All') return notifications;
    return notifications.filter(n => n.category === activeTab);
  }, [notifications, activeTab]);

  const unreadCount = useMemo(() => {
    return notifications.filter(n => !n.read).length;
  }, [notifications]);

  // Simulation triggers for testing and demonstration
  const simulateTaskStart = () => {
    const taskId = `task-${Date.now()}`;
    const taskNames = [
      'Render Viral Teaser Teaser',
      'Cognitive Script Interest Model Analysis',
      'Blue Ocean Competitive Keywords Evaluation',
      'YouTube Title High-CTR Alternative Synthesis',
      'Thumbnail A/B Split Confidence Prediction'
    ];
    const types = ['render', 'analytics', 'seo', 'generation', 'ab_test'];
    const rIdx = Math.floor(Math.random() * taskNames.length);

    window.dispatchEvent(new CustomEvent('ranktica-background-task', {
      detail: {
        id: taskId,
        name: taskNames[rIdx],
        type: types[rIdx],
        duration: 10,
        status: 'start'
      }
    }));
  };

  const simulateBudgetWarning = () => {
    const percentages = [80, 90, 98];
    const rPct = percentages[Math.floor(Math.random() * percentages.length)];
    window.dispatchEvent(new CustomEvent('ranktica-budget-warning', {
      detail: {
        message: `Budget Alert: ${rPct}% of SaaS outbound orchestration credits consumed. Threshold exceeded!`,
        severity: rPct >= 95 ? 'critical' : 'warning',
        percentageSpent: rPct
      }
    }));
  };

  const simulateCollabComment = () => {
    const users = ['Sarah Thorne', 'David K.', 'Alex Rivera', 'Marcus Young'];
    const actions = [
      'added a comment regarding visual density on frame 4',
      'edited competitor search ranking keywords tags',
      'uploaded high-fidelity video outline blueprints',
      'optimized metadata focus parameters'
    ];
    const rU = Math.floor(Math.random() * users.length);
    const rA = Math.floor(Math.random() * actions.length);

    window.dispatchEvent(new CustomEvent('ranktica-team-collab', {
      detail: {
        author: users[rU],
        action: actions[rA],
        projectTitle: 'AI Growth Engine'
      }
    }));
  };

  const formatTime = (isoString: string) => {
    try {
      const date = new Date(isoString);
      return date.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    } catch {
      return 'Recent';
    }
  };

  return (
    <div className="flex flex-col h-full text-zinc-300 font-sans text-left">
      {/* Header Banner */}
      <div className="p-4 border-b border-zinc-800 flex justify-between items-center bg-zinc-950/60 sticky top-0 z-10 backdrop-blur-md">
        <div className="flex items-center gap-2">
          <Bell size={16} className="text-red-500 animate-pulse shrink-0" />
          <div>
            <h4 className="text-xs font-black text-white uppercase tracking-wider">
              Unified Notification Command
            </h4>
            <p className="text-[9px] font-mono font-bold text-zinc-500 uppercase">
              System Telemetry • {notifications.length} Events Logged
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1.5">
          {unreadCount > 0 && (
            <button
              onClick={() => {
                markAllNotificationsAsRead();
                toast.success('Marked all alerts as read! ✔️');
              }}
              title="Mark all as read"
              className="p-1.5 bg-zinc-900 border border-zinc-800 hover:border-zinc-700 text-zinc-400 hover:text-white rounded-xl transition-all active:scale-95"
            >
              <CheckCheck size={12} />
            </button>
          )}
          <button
            onClick={() => {
              clearNotifications();
              toast.success('Purged event history ledger! 🗑️');
            }}
            title="Clear all ledger logs"
            className="p-1.5 bg-zinc-900 border border-zinc-800 hover:border-zinc-700 text-zinc-400 hover:text-red-400 rounded-xl transition-all active:scale-95"
          >
            <Trash2 size={12} />
          </button>
          <button
            onClick={onClose}
            className="p-1.5 bg-zinc-900 border border-zinc-850 hover:border-zinc-750 text-zinc-400 hover:text-white rounded-xl transition-all active:scale-90"
          >
            <X size={12} />
          </button>
        </div>
      </div>

      {/* Real-time Processing Engine Progress Monitor */}
      {runningTasks.length > 0 && (
        <div className="p-3.5 bg-zinc-950/80 border-b border-zinc-800 space-y-2">
          <span className="text-[8px] font-mono font-black text-zinc-500 uppercase tracking-widest block flex items-center gap-1">
            <Activity size={8} className="text-emerald-400 animate-spin" />
            Active Async Processes Queue ({runningTasks.length})
          </span>
          <div className="space-y-2">
            {runningTasks.map(task => (
              <div key={task.id} className="bg-zinc-900/60 border border-zinc-850 p-2 rounded-xl text-[9px] space-y-1">
                <div className="flex justify-between items-center">
                  <span className="font-extrabold text-zinc-200 truncate pr-2">{task.name}</span>
                  <span className="font-mono text-zinc-400 shrink-0">{task.progress}%</span>
                </div>
                <div className="w-full bg-zinc-950 h-1 rounded-full overflow-hidden border border-zinc-800/40">
                  <div
                    className="h-full bg-gradient-to-r from-red-650 to-red-500 rounded-full transition-all duration-300"
                    style={{ width: `${task.progress}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Filter Tabs */}
      <div className="p-2 border-b border-zinc-900 flex gap-1 bg-zinc-900/10 overflow-x-auto scrollbar-none shrink-0">
        {(['All', 'Task', 'Budget', 'Collaboration', 'System', 'Performance'] as const).map(tab => {
          const tabCount = tab === 'All' ? notifications.length : notifications.filter(n => n.category === tab).length;
          return (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-2.5 py-1 text-[8px] font-black uppercase tracking-wider rounded-lg transition-all border shrink-0 ${
                activeTab === tab
                  ? 'bg-red-650/10 border-red-500/20 text-red-400'
                  : 'bg-zinc-900/30 border-transparent text-zinc-500 hover:text-zinc-350 hover:bg-zinc-900'
              }`}
            >
              {tab} {tabCount > 0 && <span className="font-mono font-black text-[7px] ml-0.5">({tabCount})</span>}
            </button>
          );
        })}
      </div>

      {/* Main Notification Feed List */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2 custom-scrollbar max-h-[350px]">
        {filteredNotifications.length === 0 ? (
          <div className="py-12 text-center text-zinc-650 space-y-2">
            <Bell size={24} className="mx-auto text-zinc-800 animate-bounce" />
            <div>
              <p className="text-[10px] font-extrabold uppercase tracking-widest text-zinc-500">
                Ledger Workspace Empty
              </p>
              <p className="text-[8px] text-zinc-650 font-mono">
                No telemetry alerts currently matching {activeTab} profile.
              </p>
            </div>
          </div>
        ) : (
          filteredNotifications.map(n => {
            // Pick icon and colors based on category
            let IconComp = Bell;
            let themeClass = 'border-zinc-850 bg-zinc-900/20 hover:border-zinc-800';
            let iconColor = 'text-zinc-550';
            let categoryLabel = n.category || 'System';

            if (n.category === 'Task') {
              IconComp = Activity;
              iconColor = 'text-blue-400';
              themeClass = n.type === 'error' 
                ? 'border-red-900/50 bg-red-950/5 hover:border-red-900'
                : 'border-blue-950/60 bg-blue-950/5 hover:border-blue-900/40';
            } else if (n.category === 'Budget') {
              IconComp = Coins;
              iconColor = 'text-yellow-500';
              themeClass = n.type === 'error'
                ? 'border-red-900 bg-red-950/10 hover:border-red-850'
                : 'border-yellow-950 bg-yellow-950/5 hover:border-yellow-900/40';
            } else if (n.category === 'Collaboration') {
              IconComp = Users;
              iconColor = 'text-purple-400';
              themeClass = 'border-purple-950/40 bg-purple-950/5 hover:border-purple-900/30';
            } else if (n.category === 'Performance') {
              IconComp = Layers;
              iconColor = 'text-emerald-400';
              themeClass = 'border-emerald-950 bg-emerald-950/5 hover:border-emerald-900/30';
            } else if (n.type === 'error') {
              IconComp = AlertCircle;
              iconColor = 'text-red-500';
              themeClass = 'border-red-900/50 bg-red-950/5 hover:border-red-900';
            }

            return (
              <div
                key={n.id}
                className={`flex gap-3 p-2.5 rounded-xl border transition-all relative group overflow-hidden ${themeClass} ${
                  !n.read ? 'ring-1 ring-red-500/10' : ''
                }`}
              >
                {/* Visual Unread Bar Accent */}
                {!n.read && (
                  <div className="absolute left-0 top-0 bottom-0 w-0.5 bg-red-500" />
                )}

                <div className={`p-1.5 rounded-lg bg-zinc-950 border border-zinc-850 h-fit ${iconColor}`}>
                  <IconComp size={12} className={!n.read ? 'animate-pulse' : ''} />
                </div>

                <div className="space-y-1 min-w-0 flex-1">
                  <div className="flex justify-between items-start gap-1">
                    <span className="text-[8px] font-mono font-black text-zinc-550 uppercase tracking-widest block">
                      {categoryLabel}
                    </span>
                    <span className="text-[7.5px] font-mono font-bold text-zinc-500 shrink-0">
                      {formatTime(n.timestamp)}
                    </span>
                  </div>
                  <p className="text-[10px] leading-relaxed text-zinc-200">
                    {n.message}
                  </p>
                </div>

                <div className="flex flex-col gap-1 shrink-0 justify-center">
                  <button
                    onClick={() => {
                      removeNotification(n.id);
                      toast.success('Cleared alert item from sandbox memory.', { id: 'delete-alert-toast' });
                    }}
                    className="p-1 hover:bg-zinc-950 rounded text-zinc-650 hover:text-red-400 transition-colors cursor-pointer"
                    title="Dismiss alert"
                  >
                    <X size={10} />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Simulator Actions footer */}
      <div className="p-3 border-t border-zinc-900 bg-zinc-950/90 rounded-b-2xl space-y-2.5">
        <span className="text-[8px] font-mono font-black text-zinc-500 uppercase tracking-widest block flex items-center gap-1">
          <Wrench size={9} className="text-red-500 animate-pulse" />
          Event Simulation Bus Panel
        </span>
        <div className="grid grid-cols-3 gap-1.5">
          <button
            onClick={simulateTaskStart}
            className="py-1 px-1.5 bg-zinc-900 hover:bg-zinc-850 border border-zinc-800 hover:border-zinc-700 text-zinc-400 hover:text-white rounded-lg text-[8px] font-black uppercase tracking-wider flex items-center justify-center gap-1 transition-all active:scale-95 cursor-pointer"
          >
            <Activity size={8} className="text-blue-400 shrink-0" />
            Task Event
          </button>
          <button
            onClick={simulateBudgetWarning}
            className="py-1 px-1.5 bg-zinc-900 hover:bg-zinc-850 border border-zinc-800 hover:border-zinc-700 text-zinc-400 hover:text-white rounded-lg text-[8px] font-black uppercase tracking-wider flex items-center justify-center gap-1 transition-all active:scale-95 cursor-pointer"
          >
            <DollarSign size={8} className="text-yellow-500 shrink-0" />
            Budget warning
          </button>
          <button
            onClick={simulateCollabComment}
            className="py-1 px-1.5 bg-zinc-900 hover:bg-zinc-850 border border-zinc-800 hover:border-zinc-700 text-zinc-400 hover:text-white rounded-lg text-[8px] font-black uppercase tracking-wider flex items-center justify-center gap-1 transition-all active:scale-95 cursor-pointer"
          >
            <Users size={8} className="text-purple-400 shrink-0" />
            Collab Event
          </button>
        </div>
      </div>
    </div>
  );
};
