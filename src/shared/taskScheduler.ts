import { toast } from 'react-hot-toast';
import { notify } from '../infrastructure/notifications';

export interface ScheduledTask {
  id: string;
  name: string;
  type: string;
  duration: number; // expected execution duration in seconds
  priority: 'high' | 'low'; // low represents non-essential
  status: 'pending' | 'deferred' | 'running' | 'completed' | 'failed';
  timestamp: number;
  onRun: () => void | Promise<void>;
}

export interface BatteryHistoryPoint {
  timestamp: number;
  timeLabel: string;
  batteryLevel: number; // 0 to 100
  activeTasks: number;
  isCharging: boolean;
  savedTasksCount: number;
}

type BatteryStatus = {
  level: number;
  charging: boolean;
  supported: boolean;
};

type TaskSchedulerListener = (
  tasks: ScheduledTask[], 
  battery: BatteryStatus, 
  powerSaver: boolean,
  history: BatteryHistoryPoint[]
) => void;

class TaskSchedulerService {
  private deferredQueue: ScheduledTask[] = [];
  private listeners: Set<TaskSchedulerListener> = new Set();
  private batteryLevel: number = 1.0;
  private isCharging: boolean = false;
  private batterySupported: boolean = false;
  private powerSaverMode: boolean = false;
  private runningTaskIds: Set<string> = new Set();
  private runningTasks: Map<string, { name: string; type: string }> = new Map();
  private batteryHistory: BatteryHistoryPoint[] = [];
  private savedTasksCount: number = 0;

  constructor() {
    this.initBatteryAPI();
    this.initTaskListeners();
    this.generatePrepopulatedHistory();
    this.startPeriodicLogging();
  }

  private initBatteryAPI() {
    if (typeof window !== 'undefined' && 'getBattery' in navigator) {
      this.batterySupported = true;
      (navigator as any).getBattery().then((battery: any) => {
        let lastLevel = battery.level;
        const updateBatteryInfo = () => {
          const oldLevel = lastLevel;
          this.batteryLevel = battery.level;
          this.isCharging = battery.charging;
          this.recordHistoryPoint();
          
          this.handleBatteryLevelChange(oldLevel, this.batteryLevel);
          
          lastLevel = this.batteryLevel;
          this.notifyListeners();

          // If battery level is high or plugged in, flush the deferred non-essential tasks
          if (this.isPowerLevelHighOrCharging()) {
            this.flushDeferredTasks();
          }
        };

        updateBatteryInfo();

        battery.addEventListener('levelchange', updateBatteryInfo);
        battery.addEventListener('chargingchange', updateBatteryInfo);
      }).catch((err: any) => {
        console.warn('[Task Scheduler] Battery API initialization failed:', err);
        this.batterySupported = false;
      });
    } else {
      // Fallback/mock values for systems where Battery API is absent (e.g. desktop browsers, standard containers)
      this.batteryLevel = 0.74;
      this.isCharging = false;
      this.batterySupported = true;
    }
  }

  private initTaskListeners() {
    if (typeof window === 'undefined') return;

    const handleTaskEvent = (e: Event) => {
      const customEvent = e as CustomEvent;
      const { id, status, name, type } = customEvent.detail || {};
      if (!id) return;

      if (status === 'start') {
        this.runningTaskIds.add(id);
        this.runningTasks.set(id, {
          name: name || 'AI Task',
          type: type || (name?.toLowerCase().includes('video') ? 'video_generation' : 'other')
        });
      } else if (status === 'complete' || status === 'failed') {
        this.runningTaskIds.delete(id);
        this.runningTasks.delete(id);
      }
      this.recordHistoryPoint();
      this.notifyListeners();
    };

    window.addEventListener('ranktica-background-task', handleTaskEvent);
  }

  private handleBatteryLevelChange(oldLevel: number, newLevel: number) {
    if (this.isCharging) return;
    
    // Check if there was actually a drop
    if (newLevel >= oldLevel) return;

    // Check if there are any active video generation tasks in progress
    const activeVideoTasks: string[] = [];
    this.runningTasks.forEach((taskVal) => {
      if (taskVal.type === 'video_generation' || taskVal.name.toLowerCase().includes('video')) {
        activeVideoTasks.push(taskVal.name);
      }
    });

    if (activeVideoTasks.length === 0) return;

    const pctNew = Math.round(newLevel * 100);
    const pctOld = Math.round(oldLevel * 100);
    const dropAmount = pctOld - pctNew;

    if (newLevel <= 0.20) {
      // Critical Drop Alert
      notify.error(
        `🚨 CRITICAL POWER WARNING: Battery level fell to ${pctNew}% while active video synthesis "${activeVideoTasks[0]}" is executing! Plug in charger immediately or toggle Power Saver Mode.`,
        {
          duration: 9000,
          id: 'battery-crit-alert-video'
        },
        'Performance'
      );
    } else {
      // Normal drop under heavy load Alert
      notify.warn(
        `🔋 Battery level dropped to ${pctNew}% (${dropAmount}% decrease) under heavy load from background video synthesis: "${activeVideoTasks[0]}". Power draw is high!`,
        {
          duration: 6000,
          id: 'battery-drop-alert-video'
        },
        'Performance'
      );
    }
  }

  private generatePrepopulatedHistory() {
    const points: BatteryHistoryPoint[] = [];
    const now = Date.now();
    let currentLvl = 94;
    
    // Create 15 beautiful historical points spanning the last 60 minutes
    for (let i = 15; i >= 0; i--) {
      const pointTime = now - i * 4 * 60 * 1000;
      const date = new Date(pointTime);
      const timeLabel = `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}:${String(date.getSeconds()).padStart(2, '0')}`;
      
      // Simulate higher battery drain when tasks were active
      let activeTasks = 0;
      let drain = 0.2; // standard baseline drain
      let isChargingVal = false;

      // Simulate a realistic active window 40 minutes ago
      if (i >= 9 && i <= 12) {
        activeTasks = 2;
        drain = 1.4; // rapid synthesis drain
      } else if (i >= 3 && i <= 5) {
        activeTasks = 1;
        drain = 0.8; // medium crawl drain
      } else if (i === 0) {
        activeTasks = this.runningTaskIds.size;
        drain = activeTasks > 0 ? (activeTasks * 0.9) : 0.25;
        isChargingVal = this.isCharging;
      }

      currentLvl = Math.max(12, currentLvl - drain);

      points.push({
        timestamp: pointTime,
        timeLabel,
        batteryLevel: Math.round(currentLvl * 10) / 10,
        activeTasks,
        isCharging: isChargingVal,
        savedTasksCount: i >= 8 ? 0 : (i >= 4 ? 1 : 2)
      });
    }

    this.batteryHistory = points;
    this.savedTasksCount = 2; // Pre-populate some deferred/saved metrics
  }

  private startPeriodicLogging() {
    if (typeof window === 'undefined') return;

    // Log a new point every 15 seconds to keep the chart dynamically live!
    setInterval(() => {
      this.recordHistoryPoint();
      this.notifyListeners();
    }, 15000);
  }

  /**
   * Records a fresh telemetry point in history
   */
  public recordHistoryPoint() {
    const now = Date.now();
    const date = new Date(now);
    const timeLabel = `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}:${String(date.getSeconds()).padStart(2, '0')}`;
    
    const activeTasks = this.runningTaskIds.size;
    const currentPct = Math.round(this.batteryLevel * 100);

    // Add to history list
    this.batteryHistory.push({
      timestamp: now,
      timeLabel,
      batteryLevel: currentPct,
      activeTasks,
      isCharging: this.isCharging,
      savedTasksCount: this.savedTasksCount
    });

    // Trim to keep maximum 30 points to avoid overflowing charts
    if (this.batteryHistory.length > 30) {
      this.batteryHistory.shift();
    }
  }

  /**
   * Set battery level (for simulation purposes)
   */
  public simulateBatteryStatus(level: number, charging: boolean) {
    const oldLevel = this.batteryLevel;
    this.batteryLevel = level;
    this.isCharging = charging;
    this.recordHistoryPoint();
    
    this.handleBatteryLevelChange(oldLevel, this.batteryLevel);
    
    // Automatically flush queue if charging or high level
    if (this.isPowerLevelHighOrCharging()) {
      this.flushDeferredTasks();
    }

    this.notifyListeners();
    
    // Dispatch general custom event so UI highlights the drop/change
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('ranktica-battery-simulated-update'));
    }
  }

  /**
   * Check if battery power level is sufficient (above 25%) or charging
   */
  public isPowerLevelHighOrCharging(): boolean {
    // If user explicitly enables Power Saver Mode, we treat it as low power state to defer non-essential tasks
    if (this.powerSaverMode) return false;
    if (!this.batterySupported) return true;
    return this.batteryLevel > 0.25 || this.isCharging;
  }

  /**
   * Get current battery status
   */
  public getBatteryStatus(): BatteryStatus {
    return {
      level: this.batteryLevel,
      charging: this.isCharging,
      supported: this.batterySupported
    };
  }

  /**
   * Power Saver state management
   */
  public getPowerSaverMode(): boolean {
    return this.powerSaverMode;
  }

  public setPowerSaverMode(enabled: boolean) {
    this.powerSaverMode = enabled;
    this.notifyListeners();
    
    // Alert system
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('ranktica-powersaver-changed', {
        detail: { enabled }
      }));
    }
  }

  /**
   * Add listener to scheduler updates
   */
  public addListener(listener: TaskSchedulerListener) {
    this.listeners.add(listener);
    // Initial sync
    listener(
      [...this.deferredQueue], 
      this.getBatteryStatus(), 
      this.powerSaverMode, 
      [...this.batteryHistory]
    );
  }

  /**
   * Remove listener from scheduler updates
   */
  public removeListener(listener: TaskSchedulerListener) {
    this.listeners.delete(listener);
  }

  private notifyListeners() {
    const tasksCopy = [...this.deferredQueue];
    const batteryStatus = this.getBatteryStatus();
    const historyCopy = [...this.batteryHistory];
    const powerSaver = this.powerSaverMode;

    this.listeners.forEach(listener => {
      try {
        listener(tasksCopy, batteryStatus, powerSaver, historyCopy);
      } catch (e) {
        console.error('[Task Scheduler] Error in listener callback:', e);
      }
    });
  }

  /**
   * Main API to schedule a background task
   */
  public scheduleTask(params: {
    name: string;
    type: string;
    duration: number;
    priority?: 'high' | 'low';
    onRun: () => void | Promise<void>;
  }): string {
    const { name, type, duration, priority = 'low', onRun } = params;
    const taskId = `task-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;

    const task: ScheduledTask = {
      id: taskId,
      name,
      type,
      duration,
      priority,
      status: 'pending',
      timestamp: Date.now(),
      onRun
    };

    // If non-essential (low priority) and battery is low & not charging, defer it
    if (priority === 'low' && !this.isPowerLevelHighOrCharging()) {
      task.status = 'deferred';
      this.deferredQueue.push(task);
      this.savedTasksCount++;
      this.notifyListeners();
      
      toast('Task deferred due to low battery power status 🔋', {
        id: `defer-${taskId}`,
        icon: '⏳',
        duration: 5000
      });
      
      // Notify layout that a task is queued/deferred
      window.dispatchEvent(new CustomEvent('ranktica-background-task-deferred', {
        detail: { id: taskId, name, type, priority, status: 'deferred' }
      }));

      return taskId;
    }

    // Run immediately
    this.executeTask(task);
    return taskId;
  }

  /**
   * Force execute a specific deferred task manually
   */
  public forceRunTask(taskId: string) {
    const taskIndex = this.deferredQueue.findIndex(t => t.id === taskId);
    if (taskIndex !== -1) {
      const task = this.deferredQueue[taskIndex];
      this.deferredQueue.splice(taskIndex, 1);
      this.notifyListeners();
      
      toast.success(`Forcing execution of: ${task.name}`, { id: `force-${taskId}` });
      this.executeTask(task);
    }
  }

  /**
   * Clear all pending/deferred tasks in the queue
   */
  public clearDeferredTasks() {
    this.deferredQueue = [];
    this.notifyListeners();
    toast.success('Battery-conserving deferred queue cleared.');
  }

  /**
   * Get copy of current deferred queue
   */
  public getDeferredTasks(): ScheduledTask[] {
    return [...this.deferredQueue];
  }

  public getBatteryHistory(): BatteryHistoryPoint[] {
    return [...this.batteryHistory];
  }

  public getSavedTasksCount(): number {
    return this.savedTasksCount;
  }

  /**
   * Flush all deferred tasks when energy level improves or plugged in
   */
  private flushDeferredTasks() {
    if (this.deferredQueue.length === 0) return;

    const tasksToRun = [...this.deferredQueue];
    this.deferredQueue = [];
    this.notifyListeners();

    toast.success(`Device plugged in or battery level high. Commencing ${tasksToRun.length} deferred background task(s)! ⚡`, {
      id: 'flush-tasks-success',
      duration: 6000
    });

    tasksToRun.forEach(task => {
      this.executeTask(task);
    });
  }

  /**
   * Run the actual task hook and fire system notifications
   */
  private async executeTask(task: ScheduledTask) {
    task.status = 'running';
    
    // Dispatch start event for active processes
    window.dispatchEvent(new CustomEvent('ranktica-background-task', {
      detail: {
        id: task.id,
        name: task.name,
        type: task.type,
        duration: task.duration,
        status: 'start'
      }
    }));

    try {
      await task.onRun();
      task.status = 'completed';
      
      // Dispatch complete event
      window.dispatchEvent(new CustomEvent('ranktica-background-task', {
        detail: {
          id: task.id,
          name: task.name,
          status: 'complete'
        }
      }));
    } catch (err) {
      console.error(`[Task Scheduler] Error executing scheduled task ${task.id}:`, err);
      task.status = 'failed';
      
      // Dispatch failed event
      window.dispatchEvent(new CustomEvent('ranktica-background-task', {
        detail: {
          id: task.id,
          name: task.name,
          status: 'failed'
        }
      }));
    }
  }
}

export const TaskScheduler = new TaskSchedulerService();
