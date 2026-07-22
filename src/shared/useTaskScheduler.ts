import { useState, useEffect } from 'react';
import { TaskScheduler, ScheduledTask, BatteryHistoryPoint } from './taskScheduler';

export function useTaskScheduler() {
  const [deferredTasks, setDeferredTasks] = useState<ScheduledTask[]>([]);
  const [batteryStatus, setBatteryStatus] = useState(() => TaskScheduler.getBatteryStatus());
  const [powerSaverMode, setPowerSaverMode] = useState(() => TaskScheduler.getPowerSaverMode());
  const [batteryHistory, setBatteryHistory] = useState<BatteryHistoryPoint[]>(() => TaskScheduler.getBatteryHistory());

  useEffect(() => {
    const handleUpdate = (
      tasks: ScheduledTask[], 
      battery: typeof batteryStatus, 
      powerSaver: boolean,
      history: BatteryHistoryPoint[]
    ) => {
      setDeferredTasks(tasks);
      setBatteryStatus(battery);
      setPowerSaverMode(powerSaver);
      setBatteryHistory(history);
    };

    TaskScheduler.addListener(handleUpdate);
    return () => {
      TaskScheduler.removeListener(handleUpdate);
    };
  }, []);

  return {
    deferredTasks,
    batteryStatus,
    powerSaverMode,
    batteryHistory,
    savedTasksCount: TaskScheduler.getSavedTasksCount(),
    setPowerSaverMode: TaskScheduler.setPowerSaverMode.bind(TaskScheduler),
    simulateBatteryStatus: TaskScheduler.simulateBatteryStatus.bind(TaskScheduler),
    scheduleTask: TaskScheduler.scheduleTask.bind(TaskScheduler),
    forceRunTask: TaskScheduler.forceRunTask.bind(TaskScheduler),
    clearDeferredTasks: TaskScheduler.clearDeferredTasks.bind(TaskScheduler),
    isPowerLevelHighOrCharging: TaskScheduler.isPowerLevelHighOrCharging.bind(TaskScheduler)
  };
}
