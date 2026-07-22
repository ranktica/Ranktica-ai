import React, { useState, useEffect, useMemo } from 'react';
import { 
  ResponsiveContainer, 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  Tooltip, 
  CartesianGrid, 
  Legend, 
  Line, 
  LineChart 
} from 'recharts';
import { 
  Battery, 
  BatteryCharging, 
  BatteryWarning, 
  Zap, 
  TrendingDown, 
  ShieldAlert, 
  Sparkles, 
  History, 
  Cpu, 
  Layers, 
  Settings, 
  Play, 
  CheckCircle, 
  RefreshCw, 
  Info,
  Clock,
  Gauge,
  Lightbulb,
  AlertTriangle,
  Calendar,
  Sliders,
  Trash2,
  Plus,
  Video,
  Mic,
  Globe,
  Database,
  ZapOff,
  Filter,
  Activity,
  Flame,
  Pin,
  Coins,
  Terminal
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { useTaskScheduler } from '@/shared/useTaskScheduler';
import { logActivity } from '@/shared/activityLogger';

interface PowerProfile {
  id: string;
  name: string;
  basePrecision: 'FP32' | 'FP16' | 'Int8';
  baseParallelism: number; // 1 to 8
  batteryThreshold: number; // 10 to 90 %
  lowBatteryPrecision: 'FP16' | 'Int8';
  lowBatteryParallelism: number; // 1 to 4
  isDefault?: boolean;
}

const DEFAULT_PROFILES: PowerProfile[] = [
  {
    id: 'balanced-adapt',
    name: 'Balanced Creator Adaptive',
    basePrecision: 'FP16',
    baseParallelism: 4,
    batteryThreshold: 45,
    lowBatteryPrecision: 'Int8',
    lowBatteryParallelism: 1,
    isDefault: true,
  },
  {
    id: 'max-perf',
    name: 'Maximum Precision Render',
    basePrecision: 'FP32',
    baseParallelism: 8,
    batteryThreshold: 20,
    lowBatteryPrecision: 'FP16',
    lowBatteryParallelism: 2,
    isDefault: true,
  },
  {
    id: 'max-endurance',
    name: 'Maximum Endurance Reserve',
    basePrecision: 'Int8',
    baseParallelism: 1,
    batteryThreshold: 75,
    lowBatteryPrecision: 'Int8',
    lowBatteryParallelism: 1,
    isDefault: true,
  }
];

interface QuickActionTask {
  id: string;
  name: string;
  icon: 'video' | 'mic' | 'globe' | 'database';
  standardPower: string;
  saverPower: string;
  description: string;
  saverImpact: string;
}

const QUICK_ACTION_TASKS: QuickActionTask[] = [
  {
    id: 'video_generation',
    name: 'Video Diffusion & Interpolation',
    icon: 'video',
    standardPower: '120W',
    saverPower: '40W',
    description: 'High-fidelity frame synthesis, video structure expansion & upscale.',
    saverImpact: 'Forces Int8 precision, restricts threads to 2 cores.'
  },
  {
    id: 'voice_cloning',
    name: 'Multi-Agent Voice Cloning',
    icon: 'mic',
    standardPower: '85W',
    saverPower: '30W',
    description: 'Acoustic voice cloning & parallel neural phonetic synthesis.',
    saverImpact: 'Reduces synthesis sampling rates & audio model batch sizes.'
  },
  {
    id: 'web_crawling',
    name: 'Semantic Web Crawlers',
    icon: 'globe',
    standardPower: '55W',
    saverPower: '15W',
    description: 'Autonomous parallel scrapers & SEO keyword cluster indexing.',
    saverImpact: 'Pauses multi-threaded crawls, limits socket queues to 1.'
  },
  {
    id: 'chunk_embeddings',
    name: 'Parallel Vector Embeddings',
    icon: 'database',
    standardPower: '70W',
    saverPower: '20W',
    description: 'Heavy text tokenization & real-time vector DB synchronization.',
    saverImpact: 'Limits processing batch size, runs single core quantization.'
  }
];

interface HeatmapRow {
  id: string;
  name: string;
  basePower: number; // Watts
  maxThreads: number;
}

interface HeatmapCol {
  id: string;
  label: string;
  hours: string;
  timeMultiplier: number; // to scale intensity relative to human usage patterns
}

const HEATMAP_ROWS: HeatmapRow[] = [
  { id: 'video_diffusion', name: 'AI Video Diffusion (SVD)', basePower: 120, maxThreads: 8 },
  { id: 'llm_upscaling', name: 'LLM Sequence Upscaling', basePower: 95, maxThreads: 6 },
  { id: 'voice_cloning', name: 'Multi-Agent Voice Cloning', basePower: 75, maxThreads: 4 },
  { id: 'web_crawling', name: 'Semantic Web Crawling', basePower: 50, maxThreads: 4 },
  { id: 'vector_embeddings', name: 'Parallel Vector Embeddings', basePower: 40, maxThreads: 2 }
];

const HEATMAP_COLS: HeatmapCol[] = [
  { id: '00_04', label: 'Early Morning', hours: '00:00 - 04:00', timeMultiplier: 0.6 },
  { id: '04_08', label: 'Morning Sync', hours: '04:00 - 08:00', timeMultiplier: 0.8 },
  { id: '08_12', label: 'Mid-Day Load', hours: '08:00 - 12:00', timeMultiplier: 1.25 },
  { id: '12_16', label: 'Afternoon Peak', hours: '12:00 - 16:00', timeMultiplier: 1.45 },
  { id: '16_20', label: 'Evening Proc', hours: '16:00 - 20:00', timeMultiplier: 1.15 },
  { id: '20_00', label: 'Night Shift', hours: '20:00 - 24:00', timeMultiplier: 0.75 }
];

export function BatteryHealthDashboard() {
  const { 
    deferredTasks, 
    batteryStatus, 
    powerSaverMode, 
    batteryHistory, 
    savedTasksCount,
    setPowerSaverMode, 
    simulateBatteryStatus,
    forceRunTask,
    clearDeferredTasks 
  } = useTaskScheduler();

  // Smart Charging Usage Patterns definitions
  const USAGE_PATTERNS = [
    {
      id: 'overnight' as const,
      label: 'Overnight Batch Creator',
      description: 'Bulk rendering schedules executed typically during off-peak hours.',
      peakRenderHours: '23:00 - 04:00',
      drainIntensity: 'Peak workload drain (90W theoretical draw)',
      recommendedChargeStart: '21:00',
      recommendedChargeEnd: '23:00',
      batteryLimit: 85,
      lifeSpanIncrease: '18% retention bump',
      temperatureReduction: '-8.5°C threshold',
      batchTips: [
        'Pre-charge the device to exactly 85% by 23:00 to maximize lithium-ion cycle depth.',
        'Allow the rendering pipeline to start exactly at 23:00 under stable grid feed.',
        'Disconnect power automatically or limit maximum cell voltage via built-in system hooks.'
      ],
      timeline: [
        { hour: '00:00', activity: 'rendering', active: true, label: 'Deep Render Job' },
        { hour: '04:00', activity: 'idle', active: false, label: 'Cooldown' },
        { hour: '08:00', activity: 'active', active: true, label: 'Daytime Review' },
        { hour: '12:00', activity: 'idle', active: false, label: 'Passive Standby' },
        { hour: '16:00', activity: 'active', active: true, label: 'Script Writing' },
        { hour: '21:00', activity: 'charging', active: true, label: 'Pre-Render Charge' },
      ]
    },
    {
      id: 'office' as const,
      label: '9-to-5 Daytime Continuous',
      description: 'Intermittent video scripts, audio generation, and constant web crawlers.',
      peakRenderHours: '09:00 - 17:00',
      drainIntensity: 'Sustained medium-high load (45W average draw)',
      recommendedChargeStart: '12:00',
      recommendedChargeEnd: '13:00',
      batteryLimit: 80,
      lifeSpanIncrease: '24% retention bump',
      temperatureReduction: '-12°C threshold',
      batchTips: [
        'Activate Smart Adaptive trickle charging during the midday break (12:00 - 13:00).',
        'Stagger non-essential SEO cluster crawlers to execute only during charging periods.',
        'Maintain an 80% charge limit lock to prevent high-voltage stress during active generation.'
      ],
      timeline: [
        { hour: '00:00', activity: 'idle', active: false, label: 'Standby mode' },
        { hour: '09:00', activity: 'active', active: true, label: 'AI Writing & Video' },
        { hour: '12:00', activity: 'charging', active: true, label: 'Midday Charge' },
        { hour: '13:00', activity: 'active', active: true, label: 'Rendering Batches' },
        { hour: '17:00', activity: 'idle', active: false, label: 'Off-hours Passive' },
        { hour: '20:00', activity: 'idle', active: false, label: 'Off-hours Passive' },
      ]
    },
    {
      id: 'bursts' as const,
      label: 'Spur-of-the-moment Bursting',
      description: 'Ad-hoc high intensity renders followed by hours of passive text drafting.',
      peakRenderHours: 'Dynamic trigger patterns',
      drainIntensity: 'Fluctuating high-amplitude burst spikes (150W peaks)',
      recommendedChargeStart: 'Adaptive (On demand)',
      recommendedChargeEnd: 'Adaptive',
      batteryLimit: 90,
      lifeSpanIncrease: '12% retention bump',
      temperatureReduction: '-5.0°C threshold',
      batchTips: [
        'Enable Adaptive Charging which charges up to 90% and pauses based on machine learning predictions.',
        'Execute high-fidelity video rendering bursts only when connected to direct A/C power lines.',
        'Avoid continuous high-load bursts if cell level is currently lower than 35%.'
      ],
      timeline: [
        { hour: '00:00', activity: 'idle', active: false, label: 'Sleep state' },
        { hour: '08:00', activity: 'active', active: true, label: 'Prompt engineering' },
        { hour: '11:00', activity: 'rendering', active: true, label: 'Sudden high render' },
        { hour: '14:00', activity: 'charging', active: true, label: 'Burst Charge-Up' },
        { hour: '18:00', activity: 'active', active: true, label: 'Refining Outputs' },
        { hour: '21:00', activity: 'idle', active: false, label: 'Standby' },
      ]
    }
  ];

  type UsagePatternId = 'overnight' | 'office' | 'bursts';
  const [selectedPattern, setSelectedPattern] = useState<UsagePatternId>('overnight');

  // 'Performance vs. Endurance' profiles state
  const [profiles, setProfiles] = useState<PowerProfile[]>(() => {
    const saved = localStorage.getItem('ranktica-power-profiles');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error(e);
      }
    }
    return DEFAULT_PROFILES;
  });

  const [activeProfileId, setActiveProfileId] = useState<string>(() => {
    return localStorage.getItem('ranktica-active-profile-id') || 'balanced-adapt';
  });

  // Save profile state changes
  useEffect(() => {
    localStorage.setItem('ranktica-power-profiles', JSON.stringify(profiles));
  }, [profiles]);

  useEffect(() => {
    localStorage.setItem('ranktica-active-profile-id', activeProfileId);
  }, [activeProfileId]);

  // Form creation states
  const [isCreatingProfile, setIsCreatingProfile] = useState<boolean>(false);
  const [newProfileName, setNewProfileName] = useState<string>('');
  const [newBasePrecision, setNewBasePrecision] = useState<'FP32' | 'FP16' | 'Int8'>('FP16');
  const [newBaseParallelism, setNewBaseParallelism] = useState<number>(4);
  const [newBatteryThreshold, setNewBatteryThreshold] = useState<number>(45);
  const [newLowBatteryPrecision, setNewLowBatteryPrecision] = useState<'FP16' | 'Int8'>('Int8');
  const [newLowBatteryParallelism, setNewLowBatteryParallelism] = useState<number>(1);

  const activeProfile = profiles.find(p => p.id === activeProfileId) || profiles[0] || DEFAULT_PROFILES[0];
  const currentLevelPct = Math.round(batteryStatus.level * 100);
  const isUnderThreshold = currentLevelPct <= activeProfile.batteryThreshold && !batteryStatus.charging;

  const currentPrecision = isUnderThreshold ? activeProfile.lowBatteryPrecision : activeProfile.basePrecision;
  const currentParallelism = isUnderThreshold ? activeProfile.lowBatteryParallelism : activeProfile.baseParallelism;

  const [lastIsUnderThreshold, setLastIsUnderThreshold] = useState<boolean>(isUnderThreshold);

  useEffect(() => {
    if (isUnderThreshold !== lastIsUnderThreshold) {
      if (isUnderThreshold) {
        toast.error(
          `🔋 Profile "${activeProfile.name}" Triggered! Battery level (${currentLevelPct}%) fell below ${activeProfile.batteryThreshold}%. Downscaling precision to ${activeProfile.lowBatteryPrecision} and parallel threads to ${activeProfile.lowBatteryParallelism} to conserve power.`,
          { id: 'profile-triggered-warning', duration: 5000 }
        );
        logActivity(
          `Performance Profile "${activeProfile.name}" triggered low-battery adaptation: Precision set to ${activeProfile.lowBatteryPrecision}, Parallel threads restricted to ${activeProfile.lowBatteryParallelism}`,
          "Battery Dashboard",
          "system"
        );
      } else {
        toast.success(
          `⚡ Profile "${activeProfile.name}" Restored! Battery charging or level back above ${activeProfile.batteryThreshold}%. Running at full precision ${activeProfile.basePrecision} with ${activeProfile.baseParallelism} parallel threads.`,
          { id: 'profile-restored-success', duration: 5000 }
        );
        logActivity(
          `Performance Profile "${activeProfile.name}" restored normal operation: Precision set to ${activeProfile.basePrecision}, Parallel threads set to ${activeProfile.baseParallelism}`,
          "Battery Dashboard",
          "system"
        );
      }
      setLastIsUnderThreshold(isUnderThreshold);
    }
  }, [isUnderThreshold, lastIsUnderThreshold, activeProfile, currentLevelPct]);

  // Task-specific Power Saver toggle states
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

  useEffect(() => {
    localStorage.setItem('ranktica-task-power-savers', JSON.stringify(taskPowerSavers));
  }, [taskPowerSavers]);

  // Pinned Quick-Stats Cards state
  const [pinnedStats, setPinnedStats] = useState<string[]>(() => {
    try {
      const stored = localStorage.getItem('ranktica-pinned-battery-stats');
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  const togglePinStat = (taskId: string) => {
    let nextPinned;
    if (pinnedStats.includes(taskId)) {
      nextPinned = pinnedStats.filter(id => id !== taskId);
      toast.success(`Unpinned from main Creator Dashboard`);
    } else {
      nextPinned = [...pinnedStats, taskId];
      toast.success(`Pinned to main Creator Dashboard! 📌`);
    }
    setPinnedStats(nextPinned);
    localStorage.setItem('ranktica-pinned-battery-stats', JSON.stringify(nextPinned));
    logActivity(`Toggled pin state of battery quick-stats card: ${taskId}`, "Battery Dashboard", "system");
  };

  // Heatmap UI States
  const [heatmapFilter, setHeatmapFilter] = useState<'all' | 'eco' | 'unthrottled'>('all');
  const [heatmapMetric, setHeatmapMetric] = useState<'discharge_rate' | 'total_drain' | 'avg_threads'>('discharge_rate');

  // Predictive AI model state declarations
  const [predResolution, setPredResolution] = useState<'1080p' | '4K' | '8K'>('4K');
  const [predFramerate, setPredFramerate] = useState<24 | 30 | 60>(30);
  const [predDuration, setPredDuration] = useState<number>(15); // in minutes
  const [predPrecision, setPredPrecision] = useState<'FP32' | 'FP16' | 'Int8'>('FP16');
  const [predThreads, setPredThreads] = useState<number>(4); // cores
  const [predAmbientTemp, setPredAmbientTemp] = useState<number>(25); // Celsius
  const [predIsAnalyzing, setPredIsAnalyzing] = useState<boolean>(false);
  const [hasRunAnalysis, setHasRunAnalysis] = useState<boolean>(true);
  const [selectedHeatmapCell, setSelectedHeatmapCell] = useState<{ rowId: string; colId: string }>({
    rowId: 'video_diffusion',
    colId: '12_16' // Default selection pointing to high discharge afternoon block
  });

  // Helper calculations for predictive battery model
  const calculated = useMemo(() => {
    // Resolution factor
    let resMultiplier = 1.0;
    if (predResolution === '4K') resMultiplier = 2.4;
    if (predResolution === '8K') resMultiplier = 5.2;

    // Framerate factor
    let fpsMultiplier = 1.0;
    if (predFramerate === 24) fpsMultiplier = 0.85;
    if (predFramerate === 60) fpsMultiplier = 1.85;

    // Precision mode factor
    let precMultiplier = 1.0; // FP16
    if (predPrecision === 'FP32') precMultiplier = 1.6;
    if (predPrecision === 'Int8') precMultiplier = 0.45;

    // Concurrency threads factor
    const threadMultiplier = predThreads * 0.2 + 0.6; // e.g. 4 cores = 1.4

    // Ambient temperature factor (impacts cell thermal impedance and cooling workload power)
    let tempMultiplier = 1.0;
    if (predAmbientTemp > 30) {
      tempMultiplier = 1.0 + (predAmbientTemp - 30) * 0.025; // added fan speed / thermal losses
    } else if (predAmbientTemp < 15) {
      tempMultiplier = 1.0 + (15 - predAmbientTemp) * 0.015; // chemical loss at low temperatures
    }

    // Base video diffusion power is 120W (from HEATMAP_ROWS[0].basePower)
    const basePowerVal = 120;
    const predictedWatts = Math.min(180, Math.max(10, basePowerVal * resMultiplier * fpsMultiplier * precMultiplier * threadMultiplier * tempMultiplier));

    // Estimated rendering speed vs real-time
    // Faster precision + more threads = faster render
    const threadSpeedup = Math.pow(predThreads, 0.65); // 4 threads = 2.46 speedup
    const resolutionLoad = predResolution === '1080p' ? 1.0 : predResolution === '4K' ? 3.0 : 8.0;
    const precisionLoad = predPrecision === 'Int8' ? 0.5 : predPrecision === 'FP16' ? 1.0 : 1.5;
    
    // Duration render multiplier (seconds of rendering required per minute of source video)
    // 1 minute of video at 1080p, FP16, 4 threads takes ~45 seconds
    const renderRatio = (45 * resolutionLoad * precisionLoad) / (threadSpeedup * 2.46);
    const estimatedRenderSeconds = predDuration * renderRatio;
    const estimatedRenderMinutes = estimatedRenderSeconds / 60;

    // Calculate battery drain in %
    // System capacity is assumed to be 65 Watt-hours (Wh)
    const totalWattHoursConsumed = predictedWatts * (estimatedRenderMinutes / 60);
    const predictedDrainPercent = Math.min(100, Math.max(1, (totalWattHoursConsumed / 65) * 100));

    // Calculate comparative Eco mode values for advice panel
    // Eco Mode uses: Int8 precision, 2 threads max
    const ecoResMultiplier = resMultiplier;
    const ecoFpsMultiplier = fpsMultiplier;
    const ecoPrecMultiplier = 0.45; // Int8
    const ecoThreadMultiplier = 2 * 0.2 + 0.6; // 1.0
    const ecoTempMultiplier = Math.min(tempMultiplier, 1.1); // thermal limit applied in eco
    const ecoWatts = Math.min(180, Math.max(10, basePowerVal * ecoResMultiplier * ecoFpsMultiplier * ecoPrecMultiplier * ecoThreadMultiplier * ecoTempMultiplier));

    const ecoThreadSpeedup = Math.pow(2, 0.65); // 1.56
    const ecoRenderRatio = (45 * resolutionLoad * 0.5) / (ecoThreadSpeedup * 2.46);
    const ecoRenderSeconds = predDuration * ecoRenderRatio;
    const ecoRenderMinutes = ecoRenderSeconds / 60;

    const ecoWattHours = ecoWatts * (ecoRenderMinutes / 60);
    const ecoDrainPercent = Math.min(100, Math.max(1, (ecoWattHours / 65) * 100));

    return {
      watts: Math.round(predictedWatts),
      renderMinutes: Math.round(estimatedRenderMinutes * 10) / 10,
      renderSeconds: Math.round(estimatedRenderSeconds),
      drainPercent: Math.round(predictedDrainPercent),
      ecoWatts: Math.round(ecoWatts),
      ecoRenderMinutes: Math.round(ecoRenderMinutes * 10) / 10,
      ecoDrainPercent: Math.round(ecoDrainPercent),
      wattHours: Math.round(totalWattHoursConsumed * 100) / 100
    };
  }, [predResolution, predFramerate, predDuration, predPrecision, predThreads, predAmbientTemp]);

  const forecastChartData = useMemo(() => {
    const currentLvl = Math.round(batteryStatus.level * 100);
    const data = [];
    const stepMinutes = calculated.renderMinutes / 10;
    
    for (let i = 0; i <= 10; i++) {
      const minutesElapsed = Math.round((stepMinutes * i) * 10) / 10;
      const standardPct = Math.max(0, Math.round((currentLvl - (calculated.drainPercent * (i / 10))) * 10) / 10);
      const ecoPct = Math.max(0, Math.round((currentLvl - (calculated.ecoDrainPercent * (i / 10))) * 10) / 10);
      
      data.push({
        time: `${minutesElapsed}m`,
        'Full Power Drain': standardPct,
        'Eco Saver Drain': ecoPct,
      });
    }
    return data;
  }, [batteryStatus.level, calculated.drainPercent, calculated.ecoDrainPercent, calculated.renderMinutes]);

  // Helper to dynamically calculate any cell's values depending on current state filters
  const getCellData = (rowId: string, colId: string) => {
    const row = HEATMAP_ROWS.find(r => r.id === rowId)!;
    const col = HEATMAP_COLS.find(c => c.id === colId)!;
    
    // Base power draft depends on row power and time multiplier
    let power = row.basePower * col.timeMultiplier;
    let avgThreads = row.maxThreads;
    let runCount = Math.round(14 * col.timeMultiplier); // e.g. 10 runs
    
    // Adjust values if we have active filter
    if (heatmapFilter === 'eco') {
      // 65% reduction in discharge rates
      power = power * 0.35;
      avgThreads = Math.max(1, Math.round(row.maxThreads * 0.25));
    } else if (heatmapFilter === 'unthrottled') {
      // higher raw power
      power = power * 1.15;
      avgThreads = row.maxThreads;
    } else {
      // 'all' represents a weighted mix
      // If the user turned on the task power saver in the app, let's dynamic load it!
      const isQuickSaverActive = taskPowerSavers[rowId === 'video_diffusion' ? 'video_generation' : rowId === 'voice_cloning' ? 'voice_cloning' : rowId === 'web_crawling' ? 'web_crawling' : rowId === 'vector_embeddings' ? 'chunk_embeddings' : 'video_generation'];
      if (isQuickSaverActive) {
        power = power * 0.45;
        avgThreads = Math.max(1, Math.round(row.maxThreads * 0.35));
      }
    }

    // Convert power to discharge rate (%/hr) assuming a 100Wh battery
    // e.g. 120W is 120% drain per hr (if fully unthrottled)
    // Let's normalize it to reasonable real-world discharge rates (e.g. max 35%/hr)
    const dischargeRate = Number(((power / 100) * 20).toFixed(1)); 
    
    // Total battery drain over all historical runs (approximate duration)
    const avgDurationHours = rowId === 'video_diffusion' ? 0.4 : rowId === 'llm_upscaling' ? 0.3 : rowId === 'voice_cloning' ? 0.2 : rowId === 'web_crawling' ? 0.5 : 0.15;
    const totalDrain = Number((dischargeRate * avgDurationHours * runCount).toFixed(1));

    // Calculate visual heat scale (0 to 100)
    // Max discharge rate is around 40%/hr
    const heatIntensity = Math.min(100, Math.round((dischargeRate / 40) * 100));

    return {
      rowId,
      colId,
      rowName: row.name,
      colName: `${col.label} (${col.hours})`,
      dischargeRate,
      avgThreads,
      totalDrain,
      runCount,
      heatIntensity
    };
  };

  const getCellRuns = (rowId: string, colId: string) => {
    const cell = getCellData(rowId, colId);
    const row = HEATMAP_ROWS.find(r => r.id === rowId)!;

    // Generate 4 mock runs matching this context
    const runs = [];
    const baseHour = colId === '00_04' ? 1 : colId === '04_08' ? 5 : colId === '08_12' ? 9 : colId === '12_16' ? 13 : colId === '16_20' ? 17 : 21;
    
    const statuses = ['completed', 'completed', 'throttled', 'completed'] as const;
    const ecoStates = heatmapFilter === 'eco' ? [true, true, true, true] : heatmapFilter === 'unthrottled' ? [false, false, false, false] : [false, true, false, false];

    for (let i = 0; i < 4; i++) {
      const isEco = ecoStates[i];
      const jobDuration = Math.round((rowId === 'video_diffusion' ? 24 : rowId === 'llm_upscaling' ? 18 : rowId === 'voice_cloning' ? 12 : 30) * (isEco ? 1.3 : 1.0));
      const drain = Number(((cell.dischargeRate * (jobDuration / 60)) * (isEco ? 0.4 : 1.0)).toFixed(1));
      
      runs.push({
        id: `job-${colId}-${rowId.substring(0,3)}-${100 + i}`,
        time: `Today, ${String(baseHour + i).padStart(2, '0')}:${Math.floor(Math.random() * 5) * 10 + 12}`,
        ecoMode: isEco,
        discharge: drain,
        threads: isEco ? Math.max(1, Math.round(row.maxThreads * 0.25)) : row.maxThreads,
        durationMinutes: jobDuration,
        status: isEco ? 'throttled' : statuses[i]
      });
    }
    return runs;
  };

  const [simLevel, setSimLevel] = useState<number>(Math.round(batteryStatus.level * 100));
  const [simCharging, setSimCharging] = useState<boolean>(batteryStatus.charging);
  const [activeTab, setActiveTab] = useState<'chart' | 'analytics' | 'resource'>('chart');
  const [isSimulatingLoad, setIsSimulatingLoad] = useState<boolean>(false);

  // System Resource Monitor States
  const [sessionCost, setSessionCost] = useState<number>(() => {
    const saved = localStorage.getItem('ranktica_resource_cost');
    return saved ? parseFloat(saved) : 0.0345;
  });
  const [sessionTokens, setSessionTokens] = useState<number>(() => {
    const saved = localStorage.getItem('ranktica_resource_tokens');
    return saved ? parseInt(saved) : 245600;
  });
  const [sessionInputTokens, setSessionInputTokens] = useState<number>(() => {
    const saved = localStorage.getItem('ranktica_resource_input');
    return saved ? parseInt(saved) : 185200;
  });
  const [sessionOutputTokens, setSessionOutputTokens] = useState<number>(() => {
    const saved = localStorage.getItem('ranktica_resource_output');
    return saved ? parseInt(saved) : 60400;
  });
  const [dispatchLedger, setDispatchLedger] = useState<any[]>(() => {
    const saved = localStorage.getItem('ranktica_resource_ledger');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {}
    }
    return [
      { id: 'tx-1', type: 'Script Write', model: 'gemini-2.5-flash', timestamp: Date.now() - 3600000, inputTokens: 45000, outputTokens: 12000, cost: 0.00697, latency: 1820 },
      { id: 'tx-2', type: 'Competitor Analysis', model: 'gemini-2.5-pro', timestamp: Date.now() - 2400000, inputTokens: 80000, outputTokens: 4500, cost: 0.12250, latency: 4500 },
      { id: 'tx-3', type: 'Video Synthesis', model: 'veo-3.1-lite', timestamp: Date.now() - 1200000, inputTokens: 1200, outputTokens: 6000, cost: 0.30000, latency: 8200 },
      { id: 'tx-4', type: 'Thumbnail Layout', model: 'imagen-3-generate', timestamp: Date.now() - 300000, inputTokens: 500, outputTokens: 2000, cost: 0.01500, latency: 2900 }
    ];
  });

  // Persist session resource data
  useEffect(() => {
    localStorage.setItem('ranktica_resource_cost', sessionCost.toString());
    localStorage.setItem('ranktica_resource_tokens', sessionTokens.toString());
    localStorage.setItem('ranktica_resource_input', sessionInputTokens.toString());
    localStorage.setItem('ranktica_resource_output', sessionOutputTokens.toString());
    localStorage.setItem('ranktica_resource_ledger', JSON.stringify(dispatchLedger));
  }, [sessionCost, sessionTokens, sessionInputTokens, sessionOutputTokens, dispatchLedger]);

  // Listen to actual AI dispatch events triggered elsewhere in the app
  useEffect(() => {
    const handleAiEvent = (e: CustomEvent) => {
      const { type, model, cost, inputTokens, outputTokens } = e.detail || {};
      if (!type || !cost) return;

      const latencyVal = Math.floor(Math.random() * 2500) + 1100;
      setSessionCost(prev => prev + cost);
      setSessionTokens(prev => prev + inputTokens + outputTokens);
      setSessionInputTokens(prev => prev + inputTokens);
      setSessionOutputTokens(prev => prev + outputTokens);
      setDispatchLedger(prev => [
        {
          id: 'tx-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6),
          type,
          model: model || 'gemini-2.5-flash',
          timestamp: Date.now(),
          inputTokens: inputTokens || 0,
          outputTokens: outputTokens || 0,
          cost,
          latency: latencyVal
        },
        ...prev
      ]);
    };

    window.addEventListener('ranktica-ai-generation' as any, handleAiEvent as any);
    return () => window.removeEventListener('ranktica-ai-generation' as any, handleAiEvent as any);
  }, []);

  const handleSimulateAiDispatch = (type: string, model: string, cost: number, inTokens: number, outTokens: number) => {
    const latencyVal = Math.floor(Math.random() * 3200) + 800;
    setSessionCost(prev => prev + cost);
    setSessionTokens(prev => prev + inTokens + outTokens);
    setSessionInputTokens(prev => prev + inTokens);
    setSessionOutputTokens(prev => prev + outTokens);
    setDispatchLedger(prev => [
      {
        id: 'tx-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6),
        type,
        model,
        timestamp: Date.now(),
        inputTokens: inTokens,
        outputTokens: outTokens,
        cost,
        latency: latencyVal
      },
      ...prev
    ]);
    toast.success(`Synthesized AI Dispatch: ${type} via ${model} [+$${cost.toFixed(5)}]`, {
      id: 'sim-dispatch-success'
    });
    logActivity(`Simulated AI model generation cost: ${type} [Cost: $${cost.toFixed(5)}]`, "Battery Dashboard", "system");
  };

  const handleResetSessionData = () => {
    setSessionCost(0);
    setSessionTokens(0);
    setSessionInputTokens(0);
    setSessionOutputTokens(0);
    setDispatchLedger([]);
    toast.success("AI session Resource stats reset successfully!");
    logActivity(`Cleared real-time AI session cost logs`, "Battery Dashboard", "system");
  };

  // Sync internal sliders with actual values if they change elsewhere
  useEffect(() => {
    setSimLevel(Math.round(batteryStatus.level * 100));
    setSimCharging(batteryStatus.charging);
  }, [batteryStatus.level, batteryStatus.charging]);

  const handleSimulateUpdate = (lvl: number, chg: boolean) => {
    simulateBatteryStatus(lvl / 100, chg);
    toast.success(`Battery state simulated: ${lvl}% ${chg ? '(Charging) ⚡' : '(On Battery) 🔋'}`, {
      id: 'sim-battery-toast'
    });
    logActivity(`Simulated device battery status update: ${lvl}% [Charging: ${chg}]`, "Battery Dashboard", "system");
  };

  const triggerMockAILoad = () => {
    if (isSimulatingLoad) return;
    setIsSimulatingLoad(true);

    const loadTaskNames = [
      'Veo Deep Synthesis Simulation',
      'Cognitive Script Structure Expansion',
      'Semantic Multithreaded Crawler',
      'High-Fidelity Acoustic Voice Synthesis'
    ];
    const chosenName = loadTaskNames[Math.floor(Math.random() * loadTaskNames.length)];
    const simulatedTaskId = `task-sim-${Date.now()}`;

    let taskType = 'video_generation';
    if (chosenName.includes('Voice')) taskType = 'voice_cloning';
    else if (chosenName.includes('Crawler')) taskType = 'web_crawling';
    else if (chosenName.includes('Script')) taskType = 'chunk_embeddings';

    const isSaverActive = taskPowerSavers[taskType];

    if (isSaverActive) {
      toast.success(`Triggering Eco AI task simulation: ${chosenName} (Power Saver Active) 🍃`, { id: 'sim-load-toast' });
      logActivity(`Launched high-energy AI task simulation: "${chosenName}" running in eco low-power restricted mode.`, "Battery Dashboard", "system");
    } else {
      toast.success(`Triggering heavy AI task simulation: ${chosenName} 🚀`, { id: 'sim-load-toast' });
      logActivity(`Launched high-energy AI task simulation: "${chosenName}"`, "Battery Dashboard", "system");
    }

    // Dispatch custom start event
    window.dispatchEvent(new CustomEvent('ranktica-background-task', {
      detail: {
        id: simulatedTaskId,
        name: chosenName,
        type: taskType,
        duration: 15,
        status: 'start'
      }
    }));

    // Periodically drain battery a bit while task is active to simulate load
    const drainInterval = setInterval(() => {
      setSimLevel(prev => {
        // Reduced battery draw if power saver mode is active for this task
        const drainAmount = isSaverActive ? 1 : 3;
        const next = Math.max(5, prev - drainAmount);
        simulateBatteryStatus(next / 100, false);
        return next;
      });
    }, 4000);

    // Complete the task after 12 seconds
    setTimeout(() => {
      clearInterval(drainInterval);
      window.dispatchEvent(new CustomEvent('ranktica-background-task', {
        detail: {
          id: simulatedTaskId,
          name: chosenName,
          status: 'complete'
        }
      }));
      setIsSimulatingLoad(false);
      toast.success(`AI load task simulated successfully!`, { id: 'sim-load-success' });
      logActivity(`Completed high-energy AI task simulation: "${chosenName}"`, "Battery Dashboard", "system");
    }, 12000);
  };

  const getBatteryHealthState = () => {
    const level = batteryStatus.level * 100;
    if (batteryStatus.charging) return { label: 'Charging', color: 'text-green-400 border-green-500/30 bg-green-500/10' };
    if (powerSaverMode) return { label: 'Power Saver', color: 'text-amber-400 border-amber-500/30 bg-amber-500/10' };
    if (level <= 20) return { label: 'Low Battery', color: 'text-red-400 border-red-500/30 bg-red-500/10 animate-pulse' };
    if (level <= 45) return { label: 'Moderate', color: 'text-yellow-400 border-yellow-500/30 bg-yellow-500/10' };
    return { label: 'Optimal', color: 'text-emerald-400 border-emerald-500/30 bg-emerald-500/10' };
  };

  const healthState = getBatteryHealthState();

  // Custom tooltip for Recharts
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-zinc-950/95 border border-zinc-800 p-3 rounded-2xl shadow-xl text-left font-sans backdrop-blur-md">
          <p className="text-[10px] text-zinc-500 font-extrabold uppercase tracking-wider mb-1.5">{label}</p>
          <div className="space-y-1">
            <div className="flex justify-between gap-6 items-center">
              <span className="text-[10px] text-zinc-400 font-medium flex items-center gap-1">
                <Battery size={12} className="text-emerald-400" /> Battery Level:
              </span>
              <span className="text-xs font-black text-white">{data.batteryLevel}%</span>
            </div>
            <div className="flex justify-between gap-6 items-center">
              <span className="text-[10px] text-zinc-400 font-medium flex items-center gap-1">
                <Cpu size={12} className="text-red-400" /> Active Tasks:
              </span>
              <span className="text-xs font-black text-red-400">{data.activeTasks} active</span>
            </div>
            <div className="flex justify-between gap-6 items-center">
              <span className="text-[10px] text-zinc-400 font-medium flex items-center gap-1">
                <Clock size={12} className="text-amber-400" /> Power Saver:
              </span>
              <span className="text-[9px] font-black text-zinc-300 uppercase">
                {data.batteryLevel <= 25 || powerSaverMode ? "Active" : "Normal"}
              </span>
            </div>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto p-4 md:p-6" id="battery-health-dashboard-root">
      {/* Upper Module Info Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-zinc-900/40 border border-zinc-850 p-6 rounded-3xl backdrop-blur-sm">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-amber-500/10 border border-amber-500/20 text-amber-500 rounded-xl">
              <BatteryCharging size={20} className="animate-pulse" />
            </div>
            <h1 className="text-xl font-black text-white uppercase tracking-tight font-sans">
              Battery Health Dashboard
            </h1>
          </div>
          <p className="text-[11px] text-zinc-400 leading-relaxed font-medium">
            Visualizing background AI workload thermal/power dissipation patterns. Manage active processes and automatic Task Deferrals.
          </p>
        </div>
        
        {/* Toggle Panel */}
        <div className="flex items-center gap-3">
          <span className="text-[10px] font-black text-zinc-400 uppercase tracking-wider">
            {powerSaverMode ? 'Power Saver Mode Active' : 'Adaptive Power Management'}
          </span>
          <button
            type="button"
            onClick={() => {
              const next = !powerSaverMode;
              setPowerSaverMode(next);
              toast.success(next ? "Power Saver Enabled globally! 🔋" : "Power Saver Disabled.", {
                id: 'global-powersaver-toggle'
              });
              logActivity(`Manually toggled global Power Saver Mode to: ${next}`, "Battery Dashboard", "system");
            }}
            className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${powerSaverMode ? 'bg-amber-500' : 'bg-zinc-800'}`}
          >
            <span className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${powerSaverMode ? 'translate-x-5' : 'translate-x-0'}`} />
          </button>
        </div>
      </div>

      {/* Main Interactive Matrix */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Col 1: Real-time Indicator Widget */}
        <div className="bg-zinc-900/30 border border-zinc-850 p-6 rounded-3xl space-y-6 flex flex-col justify-between text-left">
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-[10px] font-black uppercase text-zinc-500 tracking-wider">Device Power Unit</span>
              <span className={`px-2 py-0.5 border rounded-full text-[8px] font-black uppercase tracking-wider ${healthState.color}`}>
                {healthState.label}
              </span>
            </div>

            {/* Glowing Circle Indicator */}
            <div className="flex flex-col items-center justify-center py-6 relative">
              <div className="relative w-40 h-40 flex items-center justify-center rounded-full border-4 border-zinc-800/80 shadow-2xl">
                {/* Visual Glow */}
                <div className={`absolute inset-0 rounded-full opacity-5 blur-xl transition-all ${batteryStatus.charging ? 'bg-green-500' : (batteryStatus.level <= 0.25 ? 'bg-amber-500' : 'bg-emerald-500')}`} />
                
                {/* Circular Percentage */}
                <div className="text-center space-y-1 z-10">
                  <span className="text-5xl font-black text-white tracking-tighter">
                    {Math.round(batteryStatus.level * 100)}<span className="text-lg font-bold text-zinc-500">%</span>
                  </span>
                  <p className="text-[9px] font-extrabold uppercase text-zinc-400 tracking-wider flex items-center justify-center gap-1">
                    {batteryStatus.charging ? (
                      <><BatteryCharging size={10} className="text-green-400 animate-bounce" /> Plugged In</>
                    ) : (
                      <><Battery size={10} className="text-zinc-500" /> Discharging</>
                    )}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Real-Time Metrics inside Card 1 */}
          <div className="bg-zinc-950/40 border border-zinc-850/50 p-4.5 rounded-2xl space-y-3 font-sans">
            <div className="flex justify-between items-center text-[10px] text-zinc-400">
              <span className="font-semibold">Energy Source:</span>
              <span className="font-extrabold text-zinc-200">{batteryStatus.charging ? 'A/C Adapter Line' : 'Internal Li-On Cell'}</span>
            </div>
            <div className="flex justify-between items-center text-[10px] text-zinc-400">
              <span className="font-semibold">Estimated Draw Rate:</span>
              <span className="font-extrabold text-zinc-200">
                {batteryStatus.charging ? '+12.4 W' : (batteryHistory[batteryHistory.length - 1]?.activeTasks > 0 ? '-22.8 W (Active AI)' : '-4.5 W (Idle)')}
              </span>
            </div>
            <div className="flex justify-between items-center text-[10px] text-zinc-400">
              <span className="font-semibold">Battery Temperature:</span>
              <span className="font-extrabold text-zinc-200">
                {batteryHistory[batteryHistory.length - 1]?.activeTasks > 1 ? '38.4 °C (Heavy Workload)' : '29.1 °C (Cool)'}
              </span>
            </div>
          </div>

          {/* Battery Quick-View Widget */}
          <div className="bg-zinc-950/40 border border-zinc-850/50 p-4.5 rounded-2xl space-y-3.5 font-sans relative overflow-hidden" id="battery-quick-view-widget">
            <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/5 rounded-full blur-xl pointer-events-none" />
            
            <div className="flex justify-between items-center relative z-10">
              <div className="flex items-center gap-1.5">
                <Video size={13} className="text-emerald-400" />
                <span className="text-[9.5px] font-black uppercase text-white tracking-widest">
                  AI Video Render Quick-View
                </span>
              </div>
              {taskPowerSavers.video_generation ? (
                <span className="px-1.5 py-0.5 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[7.5px] font-extrabold uppercase rounded tracking-wider flex items-center gap-1">
                  <span className="w-1 h-1 rounded-full bg-emerald-400 animate-pulse" /> Eco Active
                </span>
              ) : (
                <span className="px-1.5 py-0.5 bg-red-500/10 text-red-400 border border-red-500/20 text-[7.5px] font-extrabold uppercase rounded tracking-wider flex items-center gap-1">
                  <span className="w-1 h-1 rounded-full bg-red-400" /> Full Draw
                </span>
              )}
            </div>

            <div className="grid grid-cols-2 gap-3 pt-1.5">
              {/* Battery Health (SOH) */}
              <div className="bg-zinc-900/40 border border-zinc-850/40 p-3 rounded-xl space-y-1">
                <span className="text-[8px] font-black text-zinc-500 uppercase tracking-wider block">
                  Battery Health (SOH)
                </span>
                <p className="text-base font-black text-white">98.2%</p>
                <div className="flex items-center gap-1">
                  <div className="h-1 flex-1 bg-zinc-850 rounded-full overflow-hidden">
                    <div className="h-full bg-emerald-500 rounded-full" style={{ width: '98.2%' }} />
                  </div>
                  <span className="text-[7.5px] text-zinc-400 font-extrabold uppercase">Excellent</span>
                </div>
              </div>

              {/* Render Endurance */}
              <div className="bg-zinc-900/40 border border-zinc-850/40 p-3 rounded-xl space-y-1">
                <span className="text-[8px] font-black text-zinc-500 uppercase tracking-wider block">
                  Est. Render Endurance
                </span>
                <p className="text-base font-black text-amber-400 truncate">
                  {batteryStatus.charging ? (
                    <span className="text-emerald-400 font-black flex items-center gap-1 text-sm tracking-tight">
                      Unlimited ⚡
                    </span>
                  ) : (
                    (() => {
                      const videoDrawWatts = taskPowerSavers.video_generation ? 40 : 120;
                      const remainingWh = (batteryStatus.level) * 99.6;
                      const remainingHours = remainingWh / videoDrawWatts;
                      const remainingMinutes = Math.round(remainingHours * 60);
                      const hrs = Math.floor(remainingMinutes / 60);
                      const mns = remainingMinutes % 60;
                      return hrs > 0 ? `${hrs}h ${mns}m` : `${mns} mins`;
                    })()
                  )}
                </p>
                <span className="text-[7.5px] text-zinc-400 font-semibold block leading-tight">
                  {batteryStatus.charging ? "Direct A/C power line feed" : `Based on active ${taskPowerSavers.video_generation ? '40W' : '120W'} draw`}
                </span>
              </div>
            </div>

            {/* Quick Action Trigger Button */}
            <button
              onClick={() => {
                const nextVal = !taskPowerSavers.video_generation;
                setTaskPowerSavers(prev => ({
                  ...prev,
                  video_generation: nextVal
                }));
                if (nextVal) {
                  toast.success(`Eco Saver Mode engaged for AI Video Render! 🍃`);
                  logActivity(`Toggled AI Video Render saver to Eco Mode (40W budget) via Quick-View`, "Battery Dashboard", "system");
                } else {
                  toast.success(`Eco Saver Mode disengaged for AI Video Render.`);
                  logActivity(`Toggled AI Video Render saver to Standard Mode (120W budget) via Quick-View`, "Battery Dashboard", "system");
                }
              }}
              className={`w-full py-2 px-3 border rounded-xl text-[9px] font-black uppercase tracking-wider transition-all duration-200 flex items-center justify-center gap-1.5 active:scale-95 ${
                taskPowerSavers.video_generation
                  ? 'bg-emerald-500/10 border-emerald-500/25 text-emerald-400 hover:bg-emerald-500/20'
                  : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-white hover:bg-zinc-850'
              }`}
            >
              <ZapOff size={11} />
              {taskPowerSavers.video_generation ? "Disable Eco Renderer" : "Enable Eco Renderer (Save Power)"}
            </button>
          </div>
        </div>

        {/* Col 2 & 3: Recharts Trend Panel */}
        <div className="lg:col-span-2 bg-zinc-900/30 border border-zinc-850 p-6 rounded-3xl space-y-4 text-left">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <span className="text-[10px] font-black uppercase text-zinc-500 tracking-wider">Workload Power Telemetry</span>
              <h2 className="text-sm font-extrabold text-white uppercase tracking-tight">
                Battery Level vs. Active AI Tasks over Time
              </h2>
            </div>

            {/* Quick tab filters */}
            <div className="flex bg-zinc-950 p-1 rounded-xl border border-zinc-850">
              <button
                type="button"
                onClick={() => setActiveTab('chart')}
                className={`px-3 py-1 text-[9px] font-black uppercase tracking-wider rounded-lg transition-all ${activeTab === 'chart' ? 'bg-zinc-800 text-white border border-zinc-700/50' : 'text-zinc-500 hover:text-zinc-300'}`}
              >
                Telemetry Line
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('analytics')}
                className={`px-3 py-1 text-[9px] font-black uppercase tracking-wider rounded-lg transition-all ${activeTab === 'analytics' ? 'bg-zinc-800 text-white border border-zinc-700/50' : 'text-zinc-500 hover:text-zinc-300'}`}
              >
                Impact Analytics
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('resource')}
                className={`px-3 py-1 text-[9px] font-black uppercase tracking-wider rounded-lg transition-all ${activeTab === 'resource' ? 'bg-zinc-800 text-white border border-zinc-700/50' : 'text-zinc-500 hover:text-zinc-300'}`}
              >
                Resource Cost Monitor
              </button>
            </div>
          </div>

          <div className="h-[285px] w-full bg-zinc-950/25 border border-zinc-850/50 p-4 rounded-2xl flex items-center justify-center overflow-hidden">
            {activeTab === 'chart' ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                  data={batteryHistory}
                  margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                >
                  <defs>
                    <linearGradient id="batteryGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.2}/>
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="taskGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#ef4444" stopOpacity={0.25}/>
                      <stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#27272a" opacity={0.3} />
                  <XAxis 
                    dataKey="timeLabel" 
                    stroke="#52525b" 
                    fontSize={8} 
                    tickLine={false} 
                  />
                  <YAxis 
                    yAxisId="left" 
                    stroke="#10b981" 
                    fontSize={8} 
                    domain={[0, 100]} 
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis 
                    yAxisId="right" 
                    orientation="right" 
                    stroke="#ef4444" 
                    fontSize={8} 
                    domain={[0, 5]} 
                    tickLine={false}
                    axisLine={false}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend 
                    verticalAlign="top" 
                    height={36} 
                    iconSize={8}
                    wrapperStyle={{ fontSize: '8.5px', textTransform: 'uppercase', fontWeight: '900', letterSpacing: '0.1em' }} 
                  />
                  <Area 
                    yAxisId="left" 
                    type="monotone" 
                    dataKey="batteryLevel" 
                    name="Battery level (%)" 
                    stroke="#10b981" 
                    strokeWidth={2.5}
                    fillOpacity={1} 
                    fill="url(#batteryGrad)" 
                  />
                  <Area 
                    yAxisId="right" 
                    type="stepAfter" 
                    dataKey="activeTasks" 
                    name="AI Background Tasks" 
                    stroke="#ef4444" 
                    strokeWidth={2}
                    fillOpacity={1} 
                    fill="url(#taskGrad)" 
                  />
                </AreaChart>
              </ResponsiveContainer>
            ) : activeTab === 'analytics' ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full h-full text-left p-2">
                <div className="bg-zinc-900/40 p-4 rounded-xl border border-zinc-850/60 flex flex-col justify-between">
                  <div className="space-y-1">
                    <div className="flex items-center gap-1.5 text-zinc-500">
                      <TrendingDown size={14} className="text-red-400" />
                      <span className="text-[9px] font-black uppercase tracking-wider">AI Workload Drain Coefficient</span>
                    </div>
                    <p className="text-[11px] text-zinc-300 font-semibold leading-relaxed">
                      AI video synthesis and high-CTR model generation represent peak energy drain, accelerating cell discharge by up to <strong className="text-red-400">4.8x</strong> compared to baseline operations.
                    </p>
                  </div>
                  <div className="text-[9px] text-zinc-500 font-bold border-t border-zinc-850 pt-2 flex justify-between">
                    <span>Baseline: ~3.5% / hour</span>
                    <span className="text-red-400">Peak Synthesis: ~16.8% / hour</span>
                  </div>
                </div>

                <div className="bg-zinc-900/40 p-4 rounded-xl border border-zinc-850/60 flex flex-col justify-between">
                  <div className="space-y-1">
                    <div className="flex items-center gap-1.5 text-zinc-500">
                      <CheckCircle size={14} className="text-emerald-400" />
                      <span className="text-[9px] font-black uppercase tracking-wider">Power Mitigation Efficacy</span>
                    </div>
                    <p className="text-[11px] text-zinc-300 font-semibold leading-relaxed">
                      Deferring non-essential workloads like SEO crawls or scripts during battery deficit saves critical reserve cycles. It maintains device uptime by up to <strong className="text-emerald-400">32%</strong> on low-power battery cells.
                    </p>
                  </div>
                  <div className="text-[9px] text-zinc-500 font-bold border-t border-zinc-850 pt-2 flex justify-between">
                    <span>Deferral Saved: {savedTasksCount} Tasks</span>
                    <span className="text-emerald-400">Cell Life Extended: +45m Est</span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-12 gap-4 w-full h-full text-left p-1 overflow-hidden">
                {/* Left side: Totals */}
                <div className="md:col-span-5 bg-[#09090b]/80 p-4 rounded-xl border border-zinc-850/60 flex flex-col justify-between h-full">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5 text-zinc-400">
                        <Coins size={14} className="text-red-500 animate-pulse" />
                        <span className="text-[9px] font-black uppercase tracking-wider">Session AI Cost</span>
                      </div>
                      <span className="text-[8px] font-mono font-black text-emerald-400 bg-emerald-950/30 border border-emerald-900/30 px-1.5 py-0.5 rounded-full uppercase">
                        Live Tracking
                      </span>
                    </div>

                    <div className="space-y-1">
                      <p className="text-3xl font-mono font-black text-white tracking-tight">
                        ${sessionCost.toFixed(5)}
                      </p>
                      <p className="text-[9px] text-zinc-500 font-bold">
                        Calculated from real-time dynamic token usage indices.
                      </p>
                    </div>

                    {/* Token Breakdown Progress bar */}
                    <div className="space-y-1.5 pt-1">
                      <div className="flex justify-between text-[9px] font-mono font-bold text-zinc-400">
                        <span>Tokens: {sessionTokens.toLocaleString()}</span>
                        <span>{sessionTokens > 0 ? Math.round((sessionInputTokens / sessionTokens) * 100) : 0}% In</span>
                      </div>
                      <div className="w-full h-1.5 bg-zinc-950 rounded-full overflow-hidden flex">
                        <div 
                          className="h-full bg-red-500" 
                          style={{ width: `${sessionTokens > 0 ? (sessionInputTokens / sessionTokens) * 100 : 0}%` }} 
                        />
                        <div 
                          className="h-full bg-indigo-500" 
                          style={{ width: `${sessionTokens > 0 ? (sessionOutputTokens / sessionTokens) * 100 : 0}%` }} 
                        />
                      </div>
                      <div className="flex justify-between text-[8px] font-mono text-zinc-500">
                        <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-red-500" /> In: {sessionInputTokens.toLocaleString()}</span>
                        <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-indigo-500" /> Out: {sessionOutputTokens.toLocaleString()}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-2 border-t border-zinc-850 pt-3">
                    <button
                      type="button"
                      onClick={handleResetSessionData}
                      className="flex-1 bg-zinc-950 hover:bg-zinc-900 border border-zinc-850 text-zinc-400 hover:text-zinc-200 py-1.5 px-2 rounded-lg text-[9px] font-black uppercase tracking-wider transition-all"
                    >
                      Reset Session
                    </button>
                    <button
                      type="button"
                      onClick={() => handleSimulateAiDispatch("Metadata Refinement", "gemini-2.5-flash", 0.00125, 8500, 2400)}
                      className="flex-1 bg-red-650 hover:bg-red-600 text-white py-1.5 px-2 rounded-lg text-[9px] font-black uppercase tracking-wider transition-all"
                    >
                      Mock Dispatch
                    </button>
                  </div>
                </div>

                {/* Right side: Ledger dispatch log */}
                <div className="md:col-span-7 bg-[#09090b]/80 p-4 rounded-xl border border-zinc-850/60 flex flex-col justify-between h-full overflow-hidden">
                  <div className="flex items-center justify-between border-b border-zinc-850 pb-2">
                    <div className="flex items-center gap-1.5 text-zinc-400">
                      <Terminal size={14} className="text-zinc-550" />
                      <span className="text-[9px] font-black uppercase tracking-wider">Model Dispatch Ledger</span>
                    </div>
                    <span className="text-[8px] font-mono font-bold text-zinc-500">
                      {dispatchLedger.length} events logged
                    </span>
                  </div>

                  <div className="flex-1 overflow-y-auto my-2 pr-1 space-y-1.5 custom-scrollbar min-h-0 text-left">
                    {dispatchLedger.length > 0 ? (
                      dispatchLedger.map((tx) => (
                        <div key={tx.id} className="flex items-center justify-between p-2 bg-zinc-950/60 border border-zinc-900 rounded-lg">
                          <div className="space-y-0.5">
                            <span className="text-[9.5px] font-extrabold text-zinc-200 block uppercase tracking-tight truncate max-w-[150px]">
                              {tx.type}
                            </span>
                            <span className="text-[8px] font-mono font-bold text-zinc-500 uppercase">
                              {tx.model} • {tx.latency}ms
                            </span>
                          </div>
                          <div className="text-right">
                            <span className="font-mono text-[9px] font-black text-red-500 block">
                              ${tx.cost.toFixed(5)}
                            </span>
                            <span className="text-[7.5px] font-mono text-zinc-500 block uppercase">
                              {tx.inputTokens + tx.outputTokens} tkn
                            </span>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="flex flex-col items-center justify-center h-full py-4 text-center">
                        <span className="text-[10px] text-zinc-500 font-extrabold uppercase">Ledger Clear</span>
                        <span className="text-[8px] text-zinc-650">No AI transactions recorded in this window.</span>
                      </div>
                    )}
                  </div>

                  <div className="border-t border-zinc-850 pt-2 flex justify-between items-center text-[7.5px] font-mono text-zinc-650">
                    <span>Ledger state synced</span>
                    <span>Cost multiplier 1.0x</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Grid Row 2: Statistics Panels */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 text-left">
        <div className="bg-zinc-900/20 border border-zinc-850 p-4.5 rounded-3xl space-y-1.5">
          <div className="flex justify-between items-center text-zinc-500">
            <span className="text-[9px] font-black uppercase tracking-wider">Uptime Conservation</span>
            <Gauge size={14} className="text-amber-500" />
          </div>
          <p className="text-2xl font-black text-white">
            {savedTasksCount * 45} <span className="text-xs font-semibold text-zinc-500">Mins Saved</span>
          </p>
          <p className="text-[9.5px] text-zinc-400 font-semibold">
            By automatically deferring background AI cycles.
          </p>
        </div>

        <div className="bg-zinc-900/20 border border-zinc-850 p-4.5 rounded-3xl space-y-1.5">
          <div className="flex justify-between items-center text-zinc-500">
            <span className="text-[9px] font-black uppercase tracking-wider">Active Concurrency</span>
            <Cpu size={14} className="text-red-500" />
          </div>
          <p className="text-2xl font-black text-white">
            {batteryHistory[batteryHistory.length - 1]?.activeTasks || 0} <span className="text-xs font-semibold text-zinc-500">Processes</span>
          </p>
          <p className="text-[9.5px] text-zinc-400 font-semibold">
            Concurrent deep learning tasks drawing power right now.
          </p>
        </div>

        <div className="bg-zinc-900/20 border border-zinc-850 p-4.5 rounded-3xl space-y-1.5">
          <div className="flex justify-between items-center text-zinc-500">
            <span className="text-[9px] font-black uppercase tracking-wider">Postponed Pipeline</span>
            <Clock size={14} className="text-amber-500" />
          </div>
          <p className="text-2xl font-black text-white">
            {deferredTasks.length} <span className="text-xs font-semibold text-zinc-500">In Queue</span>
          </p>
          <p className="text-[9.5px] text-zinc-400 font-semibold">
            Tasks on stand-by waiting for high battery charge or A/C line.
          </p>
        </div>

        <div className="bg-zinc-900/20 border border-zinc-850 p-4.5 rounded-3xl space-y-1.5">
          <div className="flex justify-between items-center text-zinc-500">
            <span className="text-[9px] font-black uppercase tracking-wider">Battery Health Coefficient</span>
            <Sparkles size={14} className="text-emerald-500 animate-pulse" />
          </div>
          <p className="text-2xl font-black text-white">
            98% <span className="text-xs font-semibold text-zinc-500">Capacity</span>
          </p>
          <p className="text-[9.5px] text-zinc-400 font-semibold">
            Outstanding cellular retention rate.
          </p>
        </div>
      </div>

      {/* Summary section providing actionable tips based on current battery trends */}
      <div className="bg-zinc-900/30 border border-zinc-850 p-6 rounded-3xl space-y-6 text-left" id="battery-actionable-tips-section">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-zinc-850/60">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <div className="p-1 bg-amber-500/10 text-amber-500 rounded-lg">
                <Lightbulb size={18} className="text-amber-400" />
              </div>
              <h3 className="text-sm font-black uppercase text-white tracking-wider">
                Intelligent Energy Strategy & Scheduling Insights
              </h3>
            </div>
            <p className="text-[10px] text-zinc-400 font-medium">
              Real-time actionable guidelines mapped to your active power signature and workload profiles.
            </p>
          </div>
          <span className="text-[9px] font-mono font-bold bg-zinc-950/80 border border-zinc-800 text-amber-400 px-3 py-1.5 rounded-xl uppercase tracking-wider shrink-0">
            Current Status: {batteryStatus.charging ? "Optimal Grid Fed ⚡" : (batteryStatus.level <= 0.25 ? "Conservation Advisory ⚠️" : "Staggered Discharge Mode 🔋")}
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Tip Card 1: Scheduling Windows */}
          <div className="bg-zinc-950/40 border border-zinc-850/50 p-4.5 rounded-2xl space-y-3 flex flex-col justify-between">
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-amber-400">
                <Calendar size={14} />
                <span className="text-[10px] font-black uppercase tracking-wider">Optimal Rendering Windows</span>
              </div>
              <p className="text-[11px] text-zinc-300 font-semibold leading-relaxed">
                {batteryStatus.charging ? (
                  <>Your device is plugged into a dedicated power supply. **Execute deep synthesis workloads (like AI Video Generation) immediately** to benefit from unlimited peak system thermal capacity without cell exhaustion.</>
                ) : batteryStatus.level <= 0.25 ? (
                  <>Warning: Heavy rendering will trigger immediate thermal throttling. **Postpone high-CTR models or voice syntheses** until connected to A/C line or during low system usage periods.</>
                ) : (
                  <>To maximize longevity, **schedule intensive tasks between 10:00 PM and 6:00 AM** (low thermal interference) or when battery capacity is above 60% with power saver disabled.</>
                )}
              </p>
            </div>
            <div className="text-[9px] font-mono text-zinc-500 border-t border-zinc-850 pt-2.5">
              <span>Primary Window: {batteryStatus.charging ? "NOW (Unrestricted)" : "Connected to A/C Line"}</span>
            </div>
          </div>

          {/* Tip Card 2: Thermal & Load Balancing */}
          <div className="bg-zinc-950/40 border border-zinc-850/50 p-4.5 rounded-2xl space-y-3 flex flex-col justify-between">
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-red-400">
                <Cpu size={14} />
                <span className="text-[10px] font-black uppercase tracking-wider">Thermal & Concurrent Guarding</span>
              </div>
              <p className="text-[11px] text-zinc-300 font-semibold leading-relaxed">
                AI video tasks accelerate cell discharge up to **16.8% per hour** with temperatures rising above **38°C**. **Do not compile high-fidelity scripts or queue audio timeline rendering concurrently** while generating videos to avoid voltage sag.
              </p>
            </div>
            <div className="text-[9px] font-mono text-zinc-500 border-t border-zinc-850 pt-2.5 flex justify-between">
              <span>Coeff: {batteryStatus.charging ? "Stable" : "High Draw (-22W)"}</span>
              <span className="text-red-400 font-bold">Stagger Highly Advised</span>
            </div>
          </div>

          {/* Tip Card 3: Adaptive Action Steps */}
          <div className="bg-zinc-950/40 border border-zinc-850/50 p-4.5 rounded-2xl space-y-3 flex flex-col justify-between">
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-emerald-400">
                <Zap size={14} />
                <span className="text-[10px] font-black uppercase tracking-wider">Recommended Action Right Now</span>
              </div>
              <p className="text-[11px] text-zinc-300 font-semibold leading-relaxed">
                {batteryStatus.charging ? (
                  <>Take advantage of unrestricted flow: trigger a heavy AI workload simulation to verify the background-task scheduling integrity and automated priority channels.</>
                ) : batteryStatus.level <= 0.25 ? (
                  <>Activate **Power Saver Mode** below, defer all non-critical crawling operations, and plug your charger in. The system has automatically postponed {deferredTasks.length} queued tasks to protect hardware life.</>
                ) : (
                  <>Stagger rendering manually or let the automated scheduler queue tasks. **Keep Power Saver mode on standby** if you anticipate being away from external power lines for more than 2 hours.</>
                )}
              </p>
            </div>
            <div className="text-[9px] font-mono text-zinc-500 border-t border-zinc-850 pt-2.5 flex justify-between">
              <span>Active Deferrals: {deferredTasks.length}</span>
              <span className="text-emerald-400 font-bold">Uptime Secured</span>
            </div>
          </div>
        </div>
      </div>

      {/* Smart Charging & Batch Rendering Recommendation Engine */}
      <div className="bg-zinc-900/30 border border-zinc-850 p-6 rounded-3xl space-y-6 text-left" id="smart-charging-engine-section">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-zinc-850/60">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <div className="p-1 bg-emerald-500/10 text-emerald-500 rounded-lg">
                <BatteryCharging size={18} className="text-emerald-400" />
              </div>
              <h3 className="text-sm font-black uppercase text-white tracking-wider">
                Smart Charging & Batch Rendering Advisor
              </h3>
            </div>
            <p className="text-[10px] text-zinc-400 font-medium">
              Analyze battery state degradation, lock dynamic cell protection caps, and align AI workloads to low-carbon grid cycles.
            </p>
          </div>
          
          {/* Workload Profile Tabs */}
          <div className="flex bg-zinc-950/80 p-1 border border-zinc-850 rounded-xl max-w-fit shrink-0">
            {USAGE_PATTERNS.map((p) => (
              <button
                key={p.id}
                onClick={() => {
                  setSelectedPattern(p.id);
                  toast.success(`Loaded Smart Charging Profile: ${p.label}`);
                }}
                className={`text-[9.5px] font-black uppercase tracking-wider px-3.5 py-2 rounded-lg transition-all duration-200 ${
                  selectedPattern === p.id 
                    ? 'bg-emerald-500 text-black font-extrabold shadow-lg shadow-emerald-500/20' 
                    : 'text-zinc-400 hover:text-white hover:bg-zinc-900/40'
                }`}
              >
                {p.id === 'overnight' ? 'Overnight' : p.id === 'office' ? '9-to-5 Office' : 'Ad-Hoc Burst'}
              </button>
            ))}
          </div>
        </div>

        {/* Selected Pattern Detailed Insights */}
        {(() => {
          const pattern = USAGE_PATTERNS.find(p => p.id === selectedPattern) || USAGE_PATTERNS[0];
          return (
            <div className="space-y-6">
              {/* Top Stats Overview */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-zinc-950/40 border border-zinc-850/40 p-4 rounded-2xl space-y-1.5">
                  <div className="flex justify-between items-center text-zinc-500 text-[9px] font-black uppercase tracking-wider">
                    <span>Charge Limit Lock</span>
                    <ShieldAlert size={12} className="text-emerald-400" />
                  </div>
                  <p className="text-xl font-black text-white">{pattern.batteryLimit}% Cap</p>
                  <p className="text-[9.5px] text-zinc-400 font-medium leading-normal">Optimized limit to prevent high-stress voltage retention.</p>
                </div>

                <div className="bg-zinc-950/40 border border-zinc-850/40 p-4 rounded-2xl space-y-1.5">
                  <div className="flex justify-between items-center text-zinc-500 text-[9px] font-black uppercase tracking-wider">
                    <span>Peak Render Hours</span>
                    <Clock size={12} className="text-amber-400" />
                  </div>
                  <p className="text-xl font-black text-amber-400">{pattern.peakRenderHours}</p>
                  <p className="text-[9.5px] text-zinc-400 font-medium leading-normal">Safest recommended time window for massive cluster tasks.</p>
                </div>

                <div className="bg-zinc-950/40 border border-zinc-850/40 p-4 rounded-2xl space-y-1.5">
                  <div className="flex justify-between items-center text-zinc-500 text-[9px] font-black uppercase tracking-wider">
                    <span>Cell Degradation Delay</span>
                    <Sparkles size={12} className="text-emerald-400" />
                  </div>
                  <p className="text-xl font-black text-emerald-400">{pattern.lifeSpanIncrease}</p>
                  <p className="text-[9.5px] text-zinc-400 font-medium leading-normal">Estimated reduction in overall cycle-aging coefficients.</p>
                </div>

                <div className="bg-zinc-950/40 border border-zinc-850/40 p-4 rounded-2xl space-y-1.5">
                  <div className="flex justify-between items-center text-zinc-500 text-[9px] font-black uppercase tracking-wider">
                    <span>Thermal Load Guard</span>
                    <Cpu size={12} className="text-sky-400" />
                  </div>
                  <p className="text-xl font-black text-sky-400">{pattern.temperatureReduction}</p>
                  <p className="text-[9.5px] text-zinc-400 font-medium leading-normal">Prevents active throttling loops under heavy parallel draws.</p>
                </div>
              </div>

              {/* Middle Section: Timeline Visualization & Recommended Guidelines */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                
                {/* 24h Interactive Schedule Timeline */}
                <div className="lg:col-span-2 bg-zinc-950/30 border border-zinc-850/50 p-5 rounded-2xl space-y-4">
                  <div className="flex justify-between items-center">
                    <h4 className="text-[10px] font-black uppercase text-white tracking-wider flex items-center gap-1.5">
                      <Clock size={13} className="text-emerald-400" /> Recommended Daily Activity & Charging Flow
                    </h4>
                    <span className="text-[8px] font-mono text-zinc-500 uppercase">24-Hour Cycle</span>
                  </div>

                  <div className="relative pt-2 pb-1">
                    {/* Visual Segment Timeline Bar */}
                    <div className="h-2 w-full bg-zinc-900 rounded-full flex overflow-hidden">
                      {pattern.timeline.map((step, idx) => {
                        let colorClass = 'bg-zinc-800';
                        if (step.activity === 'rendering') colorClass = 'bg-amber-500';
                        else if (step.activity === 'charging') colorClass = 'bg-emerald-500';
                        else if (step.activity === 'active') colorClass = 'bg-blue-500';
                        
                        return (
                          <div 
                            key={idx} 
                            style={{ width: `${100 / pattern.timeline.length}%` }} 
                            className={`${colorClass} h-full border-r border-zinc-950/20 last:border-0 transition-all duration-300`}
                          />
                        );
                      })}
                    </div>

                    {/* Milestone Details */}
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3 pt-4">
                      {pattern.timeline.map((step, idx) => {
                        let badgeColor = 'bg-zinc-800/40 text-zinc-400 border-zinc-850';
                        if (step.activity === 'rendering') badgeColor = 'bg-amber-500/10 text-amber-400 border-amber-500/20';
                        else if (step.activity === 'charging') badgeColor = 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
                        else if (step.activity === 'active') badgeColor = 'bg-blue-500/10 text-blue-400 border-blue-500/20';

                        return (
                          <div 
                            key={idx} 
                            className="bg-zinc-950/60 border border-zinc-900 p-2.5 rounded-xl flex flex-col justify-between space-y-1.5 hover:border-zinc-800 transition-colors"
                          >
                            <div className="flex justify-between items-center">
                              <span className="text-[10px] font-bold text-white font-mono">{step.hour}</span>
                              <span className={`text-[7.5px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded-md border ${badgeColor}`}>
                                {step.activity}
                              </span>
                            </div>
                            <p className="text-[10px] text-zinc-300 font-semibold leading-normal truncate">{step.label}</p>
                            <button
                              onClick={() => {
                                toast.success(`Scheduled simulated render slot for ${step.hour}: "${step.label}"`);
                                logActivity(`Scheduled Smart Charging Job slot for ${step.hour} [${step.label}]`, "Battery Dashboard", "system");
                              }}
                              className="text-[8px] font-black uppercase tracking-wider text-left text-zinc-400 hover:text-emerald-400 mt-1 transition-colors flex items-center gap-0.5"
                            >
                              Schedule Slot →
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>

                {/* Practical Advice Guidelines Checklist */}
                <div className="bg-zinc-950/30 border border-zinc-850/50 p-5 rounded-2xl space-y-4">
                  <div className="flex items-center gap-1.5">
                    <Lightbulb size={13} className="text-amber-400" />
                    <h4 className="text-[10px] font-black uppercase text-white tracking-wider">
                      Batch Render Advice Checklist
                    </h4>
                  </div>

                  <ul className="space-y-3">
                    {pattern.batchTips.map((tip, idx) => (
                      <li key={idx} className="flex gap-2 text-left">
                        <span className="text-emerald-400 font-bold font-mono text-[11px] shrink-0 mt-0.5">0{idx + 1}.</span>
                        <p className="text-[10.5px] text-zinc-300 font-semibold leading-relaxed">
                          {tip}
                        </p>
                      </li>
                    ))}
                  </ul>

                  <div className="bg-zinc-950 p-3 rounded-xl border border-zinc-900 flex items-center justify-between">
                    <div className="space-y-0.5">
                      <p className="text-[9px] font-black uppercase text-zinc-500 tracking-wider">Auto-Lock Charging Port</p>
                      <p className="text-[10px] font-semibold text-zinc-300">Lock capacity at {pattern.batteryLimit}% limit</p>
                    </div>
                    <button 
                      onClick={() => {
                        toast.success(`Activated ${pattern.batteryLimit}% Charging Protection Lock!`);
                        logActivity(`Engaged hardware voltage cap simulation at ${pattern.batteryLimit}% for ${pattern.label}`, "Battery Dashboard", "system");
                      }}
                      className="px-3 py-1.5 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/20 hover:border-emerald-500/40 text-[9px] font-black uppercase tracking-wider rounded-lg transition-colors"
                    >
                      Lock Cap
                    </button>
                  </div>
                </div>

              </div>
            </div>
          );
        })()}
      </div>

      {/* Performance vs. Endurance Adaptive Profiles Section */}
      <div className="bg-zinc-900/30 border border-zinc-850 p-6 rounded-3xl space-y-6 text-left" id="performance-profiles-section">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-zinc-850/60">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <div className="p-1 bg-amber-500/10 text-amber-500 rounded-lg">
                <Sliders size={18} className="text-amber-400" />
              </div>
              <h3 className="text-sm font-black uppercase text-white tracking-wider">
                Performance vs. Endurance Profiles
              </h3>
            </div>
            <p className="text-[10px] text-zinc-400 font-medium">
              Create and manage automated adaptive profiles that adjust model precision and core parallelization to preserve battery integrity.
            </p>
          </div>

          <button
            onClick={() => setIsCreatingProfile(prev => !prev)}
            className="flex items-center gap-1.5 px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-zinc-950 text-[10px] font-black uppercase tracking-wider rounded-xl transition-all shadow-md hover:shadow-emerald-500/10 active:scale-95 shrink-0 self-start md:self-center font-sans"
          >
            <Plus size={12} className="stroke-[3px]" /> {isCreatingProfile ? 'Close Panel' : 'New Profile'}
          </button>
        </div>

        {/* Current Adaptive State Banner */}
        <div className="bg-zinc-950/50 border border-zinc-850/40 p-4 rounded-2xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
              <p className="text-[10px] font-black uppercase text-zinc-400 tracking-wider">Real-time Parameters Engine</p>
            </div>
            <p className="text-xs text-zinc-300 font-semibold leading-relaxed">
              Currently running under <strong className="text-white">"{activeProfile.name}"</strong>. 
              {isUnderThreshold ? (
                <span className="text-red-400 font-bold"> Low battery threshold breached ({currentLevelPct}%). Downscaling active.</span>
              ) : (
                <span className="text-emerald-400 font-bold"> Battery state optimal. Unthrottled operation.</span>
              )}
            </p>
          </div>

          <div className="flex gap-4 items-center bg-zinc-900/80 p-3.5 border border-zinc-850 rounded-xl">
            <div className="text-center">
              <p className="text-[8px] font-black text-zinc-500 uppercase tracking-wider">AI Precision</p>
              <span className={`text-sm font-black ${isUnderThreshold ? 'text-amber-400' : 'text-emerald-400'}`}>{currentPrecision}</span>
            </div>
            <div className="w-px h-8 bg-zinc-800" />
            <div className="text-center">
              <p className="text-[8px] font-black text-zinc-500 uppercase tracking-wider">Parallel Threads</p>
              <span className="text-sm font-black text-white">{currentParallelism} Cores</span>
            </div>
          </div>
        </div>

        {/* Profile Creation Form Panel */}
        {isCreatingProfile && (
          <div className="bg-zinc-950/40 border border-emerald-500/20 p-5 rounded-2xl space-y-4 transition-all duration-300">
            <h4 className="text-[10px] font-black uppercase text-white tracking-wider flex items-center gap-1.5 border-b border-zinc-850/60 pb-2">
              <Plus size={12} className="text-emerald-400" /> Design Custom Operating Profile
            </h4>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="space-y-4">
                {/* Profile Name */}
                <div className="space-y-1.5">
                  <label className="text-[9px] font-black uppercase text-zinc-400 tracking-wider">Profile Name</label>
                  <input
                    type="text"
                    placeholder="e.g. Ultra Battery Saver, High Performance Render"
                    value={newProfileName}
                    onChange={(e) => setNewProfileName(e.target.value)}
                    className="w-full bg-zinc-900 border border-zinc-800 focus:border-emerald-500/50 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-zinc-600 focus:outline-none transition-colors"
                  />
                </div>

                {/* Base Precision */}
                <div className="space-y-1.5">
                  <label className="text-[9px] font-black uppercase text-zinc-400 tracking-wider">Standard AI Model Precision</label>
                  <div className="flex gap-2 bg-zinc-900/60 p-1 border border-zinc-800 rounded-xl">
                    {(['FP32', 'FP16', 'Int8'] as const).map((prec) => (
                      <button
                        key={prec}
                        type="button"
                        onClick={() => setNewBasePrecision(prec)}
                        className={`flex-1 py-1.5 text-[9px] font-extrabold uppercase tracking-widest rounded-lg transition-all ${newBasePrecision === prec ? 'bg-emerald-500 text-black font-black' : 'text-zinc-400 hover:text-white'}`}
                      >
                        {prec}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Base Parallelism */}
                <div className="space-y-1.5">
                  <div className="flex justify-between text-[9px] font-black uppercase tracking-wider text-zinc-400">
                    <span>Standard Concurrency Depth</span>
                    <span className="text-white font-black">{newBaseParallelism} Threads</span>
                  </div>
                  <input
                    type="range"
                    min="1"
                    max="8"
                    value={newBaseParallelism}
                    onChange={(e) => setNewBaseParallelism(parseInt(e.target.value))}
                    className="w-full accent-emerald-500 h-1 bg-zinc-800 rounded-lg appearance-none cursor-pointer"
                  />
                </div>
              </div>

              <div className="space-y-4">
                {/* Trigger Threshold */}
                <div className="space-y-1.5">
                  <div className="flex justify-between text-[9px] font-black uppercase tracking-wider text-zinc-400">
                    <span>Battery Adaptation Threshold</span>
                    <span className="text-amber-400 font-black">{newBatteryThreshold}%</span>
                  </div>
                  <input
                    type="range"
                    min="10"
                    max="90"
                    value={newBatteryThreshold}
                    onChange={(e) => setNewBatteryThreshold(parseInt(e.target.value))}
                    className="w-full accent-amber-500 h-1 bg-zinc-800 rounded-lg appearance-none cursor-pointer"
                  />
                  <p className="text-[8px] text-zinc-500">Triggers the power conservation mode when discharging below this level.</p>
                </div>

                {/* Low Battery Precision */}
                <div className="space-y-1.5">
                  <label className="text-[9px] font-black uppercase text-zinc-400 tracking-wider">Adapted AI Precision (Low Battery)</label>
                  <div className="flex gap-2 bg-zinc-900/60 p-1 border border-zinc-800 rounded-xl">
                    {(['FP16', 'Int8'] as const).map((prec) => (
                      <button
                        key={prec}
                        type="button"
                        onClick={() => setNewLowBatteryPrecision(prec)}
                        className={`flex-1 py-1.5 text-[9px] font-extrabold uppercase tracking-widest rounded-lg transition-all ${newLowBatteryPrecision === prec ? 'bg-amber-500 text-black font-black' : 'text-zinc-400 hover:text-white'}`}
                      >
                        {prec}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Low Battery Parallelism */}
                <div className="space-y-1.5">
                  <div className="flex justify-between text-[9px] font-black uppercase tracking-wider text-zinc-400">
                    <span>Adapted Concurrency Limit</span>
                    <span className="text-amber-400 font-black">{newLowBatteryParallelism} Threads</span>
                  </div>
                  <input
                    type="range"
                    min="1"
                    max="4"
                    value={newLowBatteryParallelism}
                    onChange={(e) => setNewLowBatteryParallelism(parseInt(e.target.value))}
                    className="w-full accent-amber-500 h-1 bg-zinc-800 rounded-lg appearance-none cursor-pointer"
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => {
                  setIsCreatingProfile(false);
                  setNewProfileName('');
                }}
                className="px-4 py-2 text-[9px] font-black uppercase tracking-wider text-zinc-400 hover:text-white transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  if (!newProfileName.trim()) {
                    toast.error("Please enter a valid profile name.");
                    return;
                  }
                  const created: PowerProfile = {
                    id: `profile-${Date.now()}`,
                    name: newProfileName,
                    basePrecision: newBasePrecision,
                    baseParallelism: newBaseParallelism,
                    batteryThreshold: newBatteryThreshold,
                    lowBatteryPrecision: newLowBatteryPrecision,
                    lowBatteryParallelism: newLowBatteryParallelism
                  };
                  setProfiles(prev => [...prev, created]);
                  setActiveProfileId(created.id);
                  setIsCreatingProfile(false);
                  setNewProfileName('');
                  toast.success(`Saved and activated custom profile: ${created.name} ✨`);
                  logActivity(`Created and applied new custom Performance vs Endurance profile: "${created.name}"`, "Battery Dashboard", "system");
                }}
                className="px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-zinc-950 text-[10px] font-black uppercase tracking-wider rounded-xl transition-all font-sans"
              >
                Save Profile
              </button>
            </div>
          </div>
        )}

        {/* Profiles Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {profiles.map((p) => {
            const isCurrent = p.id === activeProfileId;
            return (
              <div
                key={p.id}
                onClick={() => {
                  setActiveProfileId(p.id);
                  toast.success(`Switched active profile to: ${p.name}`);
                  logActivity(`Set active Performance profile to: "${p.name}"`, "Battery Dashboard", "system");
                }}
                className={`border rounded-2xl p-4.5 space-y-4 flex flex-col justify-between cursor-pointer transition-all ${isCurrent ? 'bg-zinc-950/80 border-emerald-500/60 shadow-lg shadow-emerald-500/5' : 'bg-zinc-950/20 border-zinc-850/60 hover:border-zinc-800'}`}
              >
                <div className="space-y-1">
                  <div className="flex justify-between items-start gap-2">
                    <h4 className={`text-xs font-black ${isCurrent ? 'text-white' : 'text-zinc-300'}`}>{p.name}</h4>
                    {p.isDefault ? (
                      <span className="px-1.5 py-0.5 bg-zinc-900 border border-zinc-800 text-zinc-500 text-[7px] font-black uppercase tracking-wider rounded shrink-0">
                        Preset
                      </span>
                    ) : (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setProfiles(prev => prev.filter(item => item.id !== p.id));
                          if (isCurrent) {
                            setActiveProfileId('balanced-adapt');
                          }
                          toast.success(`Deleted profile: ${p.name}`);
                          logActivity(`Deleted custom profile: "${p.name}"`, "Battery Dashboard", "system");
                        }}
                        className="p-1 hover:bg-red-500/10 text-zinc-600 hover:text-red-400 rounded transition-colors"
                        title="Delete Profile"
                      >
                        <Trash2 size={12} />
                      </button>
                    )}
                  </div>
                  <p className="text-[9px] text-zinc-500 font-semibold leading-relaxed">
                    Downscales to {p.lowBatteryPrecision} & {p.lowBatteryParallelism} threads below {p.batteryThreshold}% battery.
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-3 pt-2 border-t border-zinc-900">
                  <div className="space-y-0.5">
                    <span className="text-[8px] font-black text-zinc-600 uppercase tracking-wider">Unthrottled Mode</span>
                    <p className="text-[9.5px] font-bold text-zinc-300">{p.basePrecision} @ {p.baseParallelism}C</p>
                  </div>
                  <div className="space-y-0.5">
                    <span className="text-[8px] font-black text-amber-600/70 uppercase tracking-wider">Throttled Mode</span>
                    <p className="text-[9.5px] font-bold text-amber-500">{p.lowBatteryPrecision} @ {p.lowBatteryParallelism}C</p>
                  </div>
                </div>

                {isCurrent && (
                  <div className="pt-1">
                    <span className="inline-flex items-center gap-1 text-[8.5px] font-black uppercase tracking-widest text-emerald-400">
                      <CheckCircle size={10} className="fill-emerald-400/10" /> Active Operating Profile
                    </span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Battery Quick-Stats Collection with Pinning Capabilities */}
      <div className="bg-zinc-900/30 border border-zinc-850 p-6 rounded-3xl space-y-6 text-left" id="battery-quick-stats-pinboard-section">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-zinc-850/60">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <div className="p-1 bg-amber-500/10 text-amber-500 rounded-lg">
                <Gauge size={18} className="text-amber-400" />
              </div>
              <h3 className="text-sm font-black uppercase text-white tracking-wider">
                Battery Quick-Stats Collection
              </h3>
            </div>
            <p className="text-[10px] text-zinc-400 font-medium">
              Pin real-time AI workload power impact scoreboards directly to your Creator Dashboard. Toggle Eco modes to balance device longevity with rendering speed.
            </p>
          </div>

          <div className="flex items-center gap-2 bg-zinc-950 px-3 py-1.5 rounded-xl border border-zinc-850 text-[10px] font-bold text-zinc-400">
            <Pin size={11} className="text-amber-500 fill-amber-500" />
            <span>Pinned scoreboards:</span>
            <span className="text-white font-black">{pinnedStats.length} / 4</span>
          </div>
        </div>

        {/* Scorecard Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {QUICK_ACTION_TASKS.map((task) => {
            const isEcoActive = taskPowerSavers[task.id];
            const isPinned = pinnedStats.includes(task.id);

            // Compute dynamic impact metric scores
            let impactScore = 0;
            let currentWatts = "";
            let efficiency = "";
            let thermalProfile = "Cool";
            let thermalColor = "text-emerald-400";

            if (task.id === 'video_generation') {
              impactScore = isEcoActive ? 32 : 92;
              currentWatts = isEcoActive ? '40W' : '120W';
              efficiency = isEcoActive ? '94%' : '48%';
              thermalProfile = isEcoActive ? 'Optimized' : 'Thermal Surge Warning';
              thermalColor = isEcoActive ? 'text-emerald-400' : 'text-red-400';
            } else if (task.id === 'voice_cloning') {
              impactScore = isEcoActive ? 24 : 68;
              currentWatts = isEcoActive ? '30W' : '85W';
              efficiency = isEcoActive ? '96%' : '62%';
              thermalProfile = isEcoActive ? 'Optimized' : 'Elevated Temp';
              thermalColor = isEcoActive ? 'text-emerald-400' : 'text-amber-400';
            } else if (task.id === 'web_crawling') {
              impactScore = isEcoActive ? 12 : 45;
              currentWatts = isEcoActive ? '15W' : '55W';
              efficiency = isEcoActive ? '98%' : '74%';
              thermalProfile = 'Optimal';
              thermalColor = 'text-emerald-400';
            } else if (task.id === 'chunk_embeddings') {
              impactScore = isEcoActive ? 16 : 56;
              currentWatts = isEcoActive ? '20W' : '70W';
              efficiency = isEcoActive ? '97%' : '68%';
              thermalProfile = isEcoActive ? 'Optimal' : 'Mild Heat';
              thermalColor = isEcoActive ? 'text-emerald-400' : 'text-yellow-400';
            }

            // Map icons
            let IconComponent = Video;
            if (task.icon === 'mic') IconComponent = Mic;
            else if (task.icon === 'globe') IconComponent = Globe;
            else if (task.icon === 'database') IconComponent = Database;

            return (
              <div 
                key={task.id}
                className={`group border rounded-2xl p-4 flex flex-col justify-between space-y-4 transition-all relative overflow-hidden ${
                  isPinned 
                    ? 'bg-zinc-950/80 border-amber-500/35 shadow-lg shadow-amber-500/5' 
                    : 'bg-zinc-950/30 border-zinc-850/60 hover:border-zinc-800'
                }`}
              >
                {/* Visual Accent Glow */}
                <div className={`absolute top-0 right-0 w-20 h-20 rounded-full blur-2xl pointer-events-none transition-opacity duration-300 ${
                  impactScore > 75 
                    ? 'bg-red-500/5 opacity-100' 
                    : impactScore > 40 
                      ? 'bg-amber-500/5 opacity-80' 
                      : 'bg-emerald-500/5 opacity-60'
                }`} />

                {/* Header info */}
                <div className="space-y-3 relative z-10">
                  <div className="flex justify-between items-start gap-2">
                    <div className={`p-2 rounded-xl border ${
                      isEcoActive 
                        ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' 
                        : 'bg-zinc-900 border-zinc-800 text-zinc-400'
                    }`}>
                      <IconComponent size={14} />
                    </div>

                    {/* Pin button */}
                    <button
                      type="button"
                      onClick={() => togglePinStat(task.id)}
                      className={`p-1.5 rounded-lg border transition-all active:scale-95 cursor-pointer ${
                        isPinned 
                          ? 'bg-amber-500/10 border-amber-500/30 text-amber-500 hover:bg-amber-500/20' 
                          : 'bg-zinc-900/60 border-zinc-850 text-zinc-500 hover:text-zinc-300 hover:border-zinc-800'
                      }`}
                      title={isPinned ? "Unpin from Creator Dashboard" : "Pin to Creator Dashboard"}
                    >
                      <Pin size={11} className={isPinned ? "fill-amber-500 text-amber-500" : "text-zinc-500"} />
                    </button>
                  </div>

                  <div className="space-y-0.5">
                    <h4 className="text-[11px] font-black text-white leading-tight uppercase tracking-wide group-hover:text-amber-400 transition-colors">
                      {task.name.split(' & ')[0]}
                    </h4>
                    <span className="text-[8px] text-zinc-500 font-extrabold uppercase tracking-widest block">
                      Active AI pipeline
                    </span>
                  </div>
                </div>

                {/* Score section */}
                <div className="space-y-2 relative z-10">
                  <div className="flex justify-between items-baseline">
                    <span className="text-[8px] font-black text-zinc-500 uppercase tracking-widest">
                      Power Impact Score
                    </span>
                    <span className={`text-base font-black ${
                      impactScore > 75 
                        ? 'text-red-500' 
                        : impactScore > 40 
                          ? 'text-amber-400' 
                          : 'text-emerald-400'
                    }`}>
                      {impactScore}<span className="text-[10px] text-zinc-500 font-bold">/100</span>
                    </span>
                  </div>

                  {/* Impact visual bar */}
                  <div className="h-1.5 bg-zinc-900 rounded-full overflow-hidden">
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

                  {/* Tiny statistics layout */}
                  <div className="grid grid-cols-2 gap-2 pt-1">
                    <div className="bg-zinc-950/40 p-1.5 rounded-lg border border-zinc-900">
                      <span className="text-[7px] font-black text-zinc-500 uppercase tracking-widest block">Draw rate</span>
                      <p className="text-[10px] font-black text-zinc-300 mt-0.5">{currentWatts}</p>
                    </div>
                    <div className="bg-zinc-950/40 p-1.5 rounded-lg border border-zinc-900">
                      <span className="text-[7px] font-black text-zinc-500 uppercase tracking-widest block">Efficiency</span>
                      <p className="text-[10px] font-black text-emerald-400 mt-0.5">{efficiency}</p>
                    </div>
                  </div>

                  <div className="flex justify-between items-center pt-1.5 text-[8px] border-t border-zinc-900">
                    <span className="text-zinc-500 font-bold">Temp Stress:</span>
                    <span className={`font-black uppercase tracking-wider ${thermalColor}`}>{thermalProfile}</span>
                  </div>
                </div>

                {/* Toggle Eco limit button inside card */}
                <button
                  type="button"
                  onClick={() => {
                    const nextVal = !isEcoActive;
                    setTaskPowerSavers(prev => ({
                      ...prev,
                      [task.id]: nextVal
                    }));
                    if (nextVal) {
                      toast.success(`Eco Saver Mode engaged for ${task.name.split(' & ')[0]}! 🍃`);
                      logActivity(`Toggled ${task.name.split(' & ')[0]} to Eco Saver Mode`, "Battery Dashboard", "system");
                    } else {
                      toast.success(`Eco Saver Mode disengaged for ${task.name.split(' & ')[0]}.`);
                      logActivity(`Toggled ${task.name.split(' & ')[0]} to Standard High Draw Mode`, "Battery Dashboard", "system");
                    }
                  }}
                  className={`w-full py-2 px-2 border rounded-xl text-[8.5px] font-black uppercase tracking-wider transition-all duration-200 flex items-center justify-center gap-1 cursor-pointer active:scale-95 relative z-10 ${
                    isEcoActive
                      ? 'bg-emerald-500/10 border-emerald-500/25 text-emerald-400 hover:bg-emerald-500/20'
                      : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-white hover:bg-zinc-850'
                  }`}
                >
                  <span className={`w-1 h-1 rounded-full ${isEcoActive ? 'bg-emerald-400 animate-pulse' : 'bg-zinc-500'}`} />
                  {isEcoActive ? "Eco Active (Limit W)" : "Set Eco-Throttling"}
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {/* Battery Quick-Action Component */}
      <div className="bg-zinc-900/30 border border-zinc-850 p-6 rounded-3xl space-y-6 text-left" id="battery-quick-actions-section">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-zinc-850/60">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <div className="p-1 bg-amber-500/10 text-amber-500 rounded-lg">
                <Zap size={18} className="text-amber-400 animate-pulse" />
              </div>
              <h3 className="text-sm font-black uppercase text-white tracking-wider">
                Battery Quick-Actions
              </h3>
            </div>
            <p className="text-[10px] text-zinc-400 font-medium">
              Toggle task-specific Power Saver limits on heavy AI pipelines instantly. Overrides default profile rules.
            </p>
          </div>

          <div className="flex bg-zinc-950 px-3.5 py-1.5 rounded-xl border border-zinc-850 text-[10px] text-zinc-500 font-bold uppercase tracking-wider flex-row gap-2 items-center shrink-0">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            <span>Eco Mode:</span>
            <span className="text-emerald-400 font-black">
              {Object.values(taskPowerSavers).filter(Boolean).length} Active overrides
            </span>
          </div>
        </div>

        {/* Task Toggles Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {QUICK_ACTION_TASKS.map((task) => {
            const isActive = taskPowerSavers[task.id];
            
            // Map icon string to actual Lucide component
            let IconComponent = Video;
            if (task.icon === 'mic') IconComponent = Mic;
            else if (task.icon === 'globe') IconComponent = Globe;
            else if (task.icon === 'database') IconComponent = Database;

            return (
              <div
                key={task.id}
                className={`border rounded-2xl p-4 flex flex-col justify-between space-y-4 transition-all ${
                  isActive 
                    ? 'bg-emerald-950/20 border-emerald-500/40 shadow-md shadow-emerald-500/5' 
                    : 'bg-zinc-950/20 border-zinc-850/60 hover:border-zinc-800'
                }`}
              >
                <div className="space-y-2.5">
                  <div className="flex justify-between items-start gap-2">
                    <div className={`p-2 rounded-xl border ${
                      isActive 
                        ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/20' 
                        : 'bg-zinc-900 border-zinc-800 text-zinc-400'
                    }`}>
                      <IconComponent size={16} />
                    </div>

                    {/* Styled Switch */}
                    <button
                      type="button"
                      onClick={() => {
                        const nextVal = !isActive;
                        setTaskPowerSavers(prev => ({
                          ...prev,
                          [task.id]: nextVal
                        }));
                        if (nextVal) {
                          toast.success(`Power Saver mode enabled for ${task.name}! 🍃`);
                          logActivity(`Manually enabled task-specific Power Saver override for: "${task.name}"`, "Battery Dashboard", "system");
                        } else {
                          toast.success(`Power Saver mode disabled for ${task.name}.`);
                          logActivity(`Manually disabled task-specific Power Saver override for: "${task.name}"`, "Battery Dashboard", "system");
                        }
                      }}
                      className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                        isActive ? 'bg-emerald-500' : 'bg-zinc-850'
                      }`}
                    >
                      <span className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                        isActive ? 'translate-x-4' : 'translate-x-0'
                      }`} />
                    </button>
                  </div>

                  <div className="space-y-1">
                    <h4 className={`text-xs font-black leading-tight ${isActive ? 'text-white' : 'text-zinc-200'}`}>{task.name}</h4>
                    <p className="text-[9.5px] text-zinc-400 font-semibold leading-relaxed">{task.description}</p>
                  </div>
                </div>

                <div className="pt-3 border-t border-zinc-900/60 space-y-2">
                  <div className="flex justify-between items-center text-[9px] font-black uppercase tracking-wider">
                    <span className="text-zinc-500">Peak draw:</span>
                    <span className={isActive ? 'text-emerald-400 font-black' : 'text-zinc-400'}>
                      {isActive ? `${task.saverPower} (Eco)` : `${task.standardPower} (Full)`}
                    </span>
                  </div>

                  <div className="bg-zinc-950/65 border border-zinc-900 p-2 rounded-lg">
                    <span className="text-[7.5px] font-extrabold text-zinc-500 uppercase tracking-widest block mb-0.5">Restriction Policy:</span>
                    <p className={`text-[8.5px] font-semibold leading-normal ${isActive ? 'text-emerald-400/90' : 'text-zinc-500'}`}>
                      {isActive ? task.saverImpact : 'No energy limits applied.'}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Historical Battery Drain Heatmap */}
      <div className="bg-zinc-900/30 border border-zinc-850 p-6 rounded-3xl space-y-6 text-left" id="battery-drain-heatmap-section">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-zinc-850/60">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <div className="p-1 bg-amber-500/10 text-amber-500 rounded-lg">
                <Flame size={18} className="text-amber-400 animate-pulse" />
              </div>
              <h3 className="text-sm font-black uppercase text-white tracking-wider">
                Historical Battery Discharge Heatmap
              </h3>
            </div>
            <p className="text-[10px] text-zinc-400 font-medium">
              Visually correlate specific AI model rendering workloads with historical cell discharge intensity across different times of the day.
            </p>
          </div>

          {/* Interactive controls */}
          <div className="flex flex-wrap gap-2.5 items-center">
            {/* Metric Dropdown */}
            <div className="flex items-center gap-1.5 bg-zinc-950 px-3 py-1.5 rounded-xl border border-zinc-850">
              <Filter size={11} className="text-zinc-500" />
              <span className="text-[8.5px] font-bold text-zinc-500 uppercase tracking-wider">Metric:</span>
              <select
                value={heatmapMetric}
                onChange={(e) => setHeatmapMetric(e.target.value as any)}
                className="bg-transparent border-none text-[9.5px] font-extrabold text-white uppercase tracking-wider focus:outline-none focus:ring-0 cursor-pointer"
              >
                <option value="discharge_rate" className="bg-zinc-900">Discharge (%/Hr)</option>
                <option value="total_drain" className="bg-zinc-900">Total Drain (%)</option>
                <option value="avg_threads" className="bg-zinc-900">Avg Threads (C)</option>
              </select>
            </div>

            {/* Execution Filter Button segments */}
            <div className="flex bg-zinc-950 p-1 rounded-xl border border-zinc-850">
              {(['all', 'eco', 'unthrottled'] as const).map((mode) => (
                <button
                  key={mode}
                  type="button"
                  onClick={() => {
                    setHeatmapFilter(mode);
                    toast.success(`Heatmap filtered by execution mode: ${mode.toUpperCase()}`);
                    logActivity(`Filtered historical battery drain heatmap by: ${mode.toUpperCase()} runs`, "Battery Dashboard", "system");
                  }}
                  className={`px-2.5 py-1 text-[8.5px] font-extrabold uppercase tracking-widest rounded-lg transition-all ${
                    heatmapFilter === mode
                      ? 'bg-amber-500 text-zinc-950 font-black'
                      : 'text-zinc-400 hover:text-white'
                  }`}
                >
                  {mode}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Heatmap Layout Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Heatmap Grid (70%) */}
          <div className="lg:col-span-3 space-y-4">
            <div className="overflow-x-auto pb-2 scrollbar-thin">
              <div className="min-w-[800px] space-y-3 pt-2">
                
                {/* Columns Header Row */}
                <div className="grid grid-cols-7 gap-3 pb-2 border-b border-zinc-850/50">
                  <div className="flex flex-col justify-end">
                    <span className="text-[8.5px] font-black text-zinc-500 uppercase tracking-widest">AI Workload Pipeline</span>
                  </div>
                  {HEATMAP_COLS.map((col) => (
                    <div key={col.id} className="text-center space-y-0.5">
                      <p className="text-[9.5px] font-black uppercase text-zinc-200 tracking-wider truncate">{col.label}</p>
                      <span className="text-[8px] text-zinc-500 font-bold block">{col.hours}</span>
                    </div>
                  ))}
                </div>

                {/* Heatmap Rows */}
                <div className="space-y-3">
                  {HEATMAP_ROWS.map((row) => (
                    <div key={row.id} className="grid grid-cols-7 gap-3 items-center">
                      
                      {/* Workload Row Label */}
                      <div className="space-y-0.5 pr-2 truncate">
                        <p className="text-xs font-black text-white leading-tight truncate" title={row.name}>
                          {row.name.replace(' (SVD)', '')}
                        </p>
                        <span className="text-[8px] text-zinc-500 font-extrabold uppercase tracking-widest block">
                          Base: {row.basePower}W peak
                        </span>
                      </div>

                      {/* Six Heatmap Columns */}
                      {HEATMAP_COLS.map((col) => {
                        const cell = getCellData(row.id, col.id);
                        const isSelected = selectedHeatmapCell.rowId === row.id && selectedHeatmapCell.colId === col.id;
                        
                        // Select colors depending on the heatIntensity score
                        let cellColors = "bg-zinc-950/20 border-zinc-900/60 text-zinc-500 hover:border-zinc-800";
                        if (cell.heatIntensity > 80) {
                          cellColors = "bg-red-500/15 border-red-500/30 text-red-400 hover:bg-red-500/25";
                        } else if (cell.heatIntensity > 55) {
                          cellColors = "bg-orange-500/12 border-orange-500/20 text-orange-400 hover:bg-orange-500/20";
                        } else if (cell.heatIntensity > 35) {
                          cellColors = "bg-amber-500/10 border-amber-500/15 text-amber-400 hover:bg-amber-500/15";
                        } else if (cell.heatIntensity > 15) {
                          cellColors = "bg-emerald-500/10 border-emerald-500/15 text-emerald-400 hover:bg-emerald-500/15";
                        }

                        return (
                          <button
                            key={col.id}
                            type="button"
                            onClick={() => setSelectedHeatmapCell({ rowId: row.id, colId: col.id })}
                            className={`h-14 rounded-xl border flex flex-col justify-center items-center p-2 transition-all relative cursor-pointer ${cellColors} ${
                              isSelected 
                                ? 'ring-2 ring-amber-400 border-transparent scale-[1.03] z-10 shadow-lg shadow-amber-400/10' 
                                : ''
                            }`}
                          >
                            <span className="text-xs font-black leading-none">
                              {heatmapMetric === 'discharge_rate' ? `${cell.dischargeRate}%` :
                               heatmapMetric === 'total_drain' ? `${cell.totalDrain}%` :
                               `${cell.avgThreads}C`}
                            </span>
                            <span className="text-[7.5px] font-extrabold tracking-widest opacity-60 mt-1 uppercase">
                              {heatmapMetric === 'discharge_rate' ? '/ hr' :
                               heatmapMetric === 'total_drain' ? 'drain' :
                               'cores'}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Grid Legend */}
            <div className="flex flex-wrap gap-5 justify-start items-center bg-zinc-950/30 border border-zinc-850/40 p-3 rounded-2xl text-[8.5px] font-black uppercase tracking-wider text-zinc-500">
              <span className="text-zinc-400 font-bold">Discharge Legend:</span>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded bg-zinc-950/50 border border-zinc-900" />
                <span>Minimal (&lt;5%/hr)</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded bg-emerald-500/15 border border-emerald-500/20" />
                <span>Green / Eco (5-12%/hr)</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded bg-amber-500/12 border border-amber-500/20" />
                <span>Moderate (12-20%/hr)</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded bg-orange-500/15 border border-orange-500/20" />
                <span>High (20-30%/hr)</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded bg-red-500/15 border border-red-500/20 animate-pulse" />
                <span>Extreme (30%+/hr)</span>
              </div>
            </div>
          </div>

          {/* Sidebar Correlation Panel (30%) */}
          <div className="lg:col-span-1">
            {(() => {
              const cellData = getCellData(selectedHeatmapCell.rowId, selectedHeatmapCell.colId);
              const cellRuns = getCellRuns(selectedHeatmapCell.rowId, selectedHeatmapCell.colId);
              
              // Map icon
              let IconComponent = Video;
              if (selectedHeatmapCell.rowId === 'voice_cloning') IconComponent = Mic;
              else if (selectedHeatmapCell.rowId === 'web_crawling') IconComponent = Globe;
              else if (selectedHeatmapCell.rowId === 'vector_embeddings') IconComponent = Database;
              
              // Policy advice
              let advice = "Operating under default guidelines. Power Saver mode is optional, but capping threads will guarantee linear cell discharge stability.";
              if (selectedHeatmapCell.rowId === 'video_diffusion' && selectedHeatmapCell.colId === '12_16') {
                advice = "Warning: Afternoon ambient thermal stress combined with peak SVD Diffusion draft causes rapid battery degradation. We highly recommend turning on Eco Video rendering.";
              } else if (selectedHeatmapCell.colId === '00_04') {
                advice = "Off-peak Early Morning: Device temperature is optimal. Running full-precision unthrottled jobs here is safe and carries negligible lifetime cell strain.";
              } else if (selectedHeatmapCell.rowId === 'vector_embeddings') {
                advice = "Vector database embeddings sync is highly energy efficient. No manual downscaling necessary during this time segment.";
              }

              return (
                <div className="bg-zinc-950/40 border border-zinc-850/50 p-4.5 rounded-2xl space-y-4 h-full flex flex-col justify-between">
                  <div className="space-y-4">
                    {/* Header */}
                    <div className="flex items-start gap-2.5 pb-3.5 border-b border-zinc-850">
                      <div className="p-2 bg-zinc-900 border border-zinc-800 text-amber-400 rounded-xl shrink-0">
                        <IconComponent size={15} />
                      </div>
                      <div className="space-y-0.5 truncate">
                        <h4 className="text-xs font-black text-white leading-tight truncate">
                          {cellData.rowName}
                        </h4>
                        <p className="text-[8.5px] text-zinc-500 font-extrabold uppercase tracking-wider truncate">
                          {cellData.colName}
                        </p>
                      </div>
                    </div>

                    {/* Stats overview */}
                    <div className="grid grid-cols-2 gap-2 text-left">
                      <div className="bg-zinc-900/60 p-2.5 rounded-xl border border-zinc-850/40">
                        <span className="text-[7px] text-zinc-500 font-black uppercase tracking-widest block">Discharge Rate</span>
                        <p className="text-sm font-black text-white">{cellData.dischargeRate}%<span className="text-[9px] text-zinc-500 font-normal">/hr</span></p>
                      </div>
                      <div className="bg-zinc-900/60 p-2.5 rounded-xl border border-zinc-850/40">
                        <span className="text-[7px] text-zinc-500 font-black uppercase tracking-widest block">Total Cell Loss</span>
                        <p className="text-sm font-black text-white">{cellData.totalDrain}%</p>
                      </div>
                      <div className="bg-zinc-900/60 p-2.5 rounded-xl border border-zinc-850/40">
                        <span className="text-[7px] text-zinc-500 font-black uppercase tracking-widest block">Concurrency</span>
                        <p className="text-sm font-black text-white">{cellData.avgThreads}<span className="text-[9px] text-zinc-500 font-normal"> Cores</span></p>
                      </div>
                      <div className="bg-zinc-900/60 p-2.5 rounded-xl border border-zinc-850/40">
                        <span className="text-[7px] text-zinc-500 font-black uppercase tracking-widest block">Job Counts</span>
                        <p className="text-sm font-black text-white">{cellData.runCount}<span className="text-[9px] text-zinc-500 font-normal"> runs</span></p>
                      </div>
                    </div>

                    {/* Heat Indicator Bar */}
                    <div className="space-y-1 text-left">
                      <div className="flex justify-between text-[7px] font-black text-zinc-500 uppercase tracking-widest">
                        <span>Energy / Thermal Density</span>
                        <span className={cellData.heatIntensity > 70 ? 'text-red-400' : 'text-emerald-400'}>
                          {cellData.heatIntensity > 70 ? 'HIGH SLUSH' : 'EFFICIENT'}
                        </span>
                      </div>
                      <div className="h-1.5 bg-zinc-900 rounded-full overflow-hidden">
                        <div 
                          className={`h-full rounded-full transition-all duration-300 ${
                            cellData.heatIntensity > 70 ? 'bg-red-500' :
                            cellData.heatIntensity > 40 ? 'bg-amber-500' :
                            'bg-emerald-500'
                          }`}
                          style={{ width: `${cellData.heatIntensity}%` }}
                        />
                      </div>
                    </div>

                    {/* Historical Runs List */}
                    <div className="space-y-2 text-left pt-1">
                      <span className="text-[7.5px] font-black text-zinc-400 uppercase tracking-widest block">Historical Jobs Correlation</span>
                      <div className="space-y-1.5 max-h-[140px] overflow-y-auto pr-1 scrollbar-thin">
                        {cellRuns.map((run) => (
                          <div key={run.id} className="bg-zinc-900/40 border border-zinc-850/60 p-2 rounded-lg flex justify-between items-center text-[9px]">
                            <div className="space-y-0.5">
                              <div className="flex items-center gap-1">
                                <span className="font-bold text-zinc-300">{run.id}</span>
                                {run.ecoMode && <span className="text-[7px] text-emerald-400 bg-emerald-500/10 px-1 rounded font-black">🍃 ECO</span>}
                              </div>
                              <span className="text-[8px] text-zinc-500 block">{run.time}</span>
                            </div>
                            <div className="text-right space-y-0.5 shrink-0">
                              <span className="font-black text-white">-{run.discharge}% cell</span>
                              <p className="text-[7.5px] text-zinc-500 font-semibold">{run.durationMinutes}m | {run.threads}C</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Preservation Policy Advice Box */}
                  <div className="mt-4 bg-amber-500/5 border border-amber-500/15 p-3 rounded-xl space-y-1 text-left">
                    <div className="flex items-center gap-1 text-[7.5px] font-black uppercase text-amber-400 tracking-wider">
                      <Sparkles size={10} /> Smart Preservation Policy
                    </div>
                    <p className="text-[9px] text-zinc-400 font-semibold leading-normal">
                      {advice}
                    </p>
                  </div>
                </div>
              );
            })()}
          </div>
        </div>
      </div>

      {/* Predictive AI Battery Drain Forecaster */}
      <div className="bg-zinc-900/30 border border-zinc-850 p-6 rounded-3xl space-y-6 text-left animate-fade-in" id="battery-predictive-forecaster-section">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-zinc-850/60">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <div className="p-1 bg-violet-500/10 text-violet-400 rounded-lg">
                <Cpu size={18} className="animate-pulse" />
              </div>
              <h3 className="text-sm font-black uppercase text-white tracking-wider">
                Predictive AI Model: Render-Drain Forecaster
              </h3>
            </div>
            <p className="text-[10px] text-zinc-400 font-medium">
              Runs a trained regression network to predict real-time power dissipation, thermal coefficients, and battery percentage depletion before launching a new large-scale video render.
            </p>
          </div>

          <div className="flex items-center gap-2 bg-zinc-950 px-3 py-1.5 rounded-xl border border-zinc-850 text-[10px] font-bold text-zinc-400">
            <Sparkles size={11} className="text-violet-400 animate-spin" style={{ animationDuration: '4s' }} />
            <span>Core Model:</span>
            <span className="text-white font-black">Multi-Layer Perceptron (MLP-V2)</span>
          </div>
        </div>

        {/* 2-Column Responsive Layout */}
        <div className="grid grid-cols-1 xl:grid-cols-5 gap-6">
          
          {/* Column 1: Config Sliders & Inputs (40%) */}
          <div className="xl:col-span-2 bg-zinc-950/30 border border-zinc-850/50 p-5 rounded-2xl space-y-4">
            <h4 className="text-[11px] font-black text-white uppercase tracking-wider flex items-center gap-1.5 border-b border-zinc-900 pb-2">
              <Sliders size={12} className="text-violet-400" /> Render Job Specifications
            </h4>

            {/* Resolution Row */}
            <div className="space-y-1.5">
              <label className="text-[9px] font-black uppercase text-zinc-400 tracking-wider block">Target Export Resolution</label>
              <div className="grid grid-cols-3 gap-2 bg-zinc-900/60 p-1 border border-zinc-800 rounded-xl">
                {(['1080p', '4K', '8K'] as const).map((res) => (
                  <button
                    key={res}
                    type="button"
                    onClick={() => setPredResolution(res)}
                    className={`py-1.5 text-[9px] font-extrabold uppercase tracking-widest rounded-lg transition-all cursor-pointer ${predResolution === res ? 'bg-violet-500 text-black font-black' : 'text-zinc-400 hover:text-white'}`}
                  >
                    {res}
                  </button>
                ))}
              </div>
            </div>

            {/* Framerate Row */}
            <div className="space-y-1.5">
              <label className="text-[9px] font-black uppercase text-zinc-400 tracking-wider block">Framerate / Interpolation</label>
              <div className="grid grid-cols-3 gap-2 bg-zinc-900/60 p-1 border border-zinc-800 rounded-xl">
                {([24, 30, 60] as const).map((fps) => (
                  <button
                    key={fps}
                    type="button"
                    onClick={() => setPredFramerate(fps)}
                    className={`py-1.5 text-[9px] font-extrabold uppercase tracking-widest rounded-lg transition-all cursor-pointer ${predFramerate === fps ? 'bg-violet-500 text-black font-black' : 'text-zinc-400 hover:text-white'}`}
                  >
                    {fps} FPS
                  </button>
                ))}
              </div>
            </div>

            {/* Precision Selector */}
            <div className="space-y-1.5">
              <label className="text-[9px] font-black uppercase text-zinc-400 tracking-wider block">NPU Execution Mode Precision</label>
              <div className="grid grid-cols-3 gap-2 bg-zinc-900/60 p-1 border border-zinc-800 rounded-xl">
                {(['FP32', 'FP16', 'Int8'] as const).map((prec) => (
                  <button
                    key={prec}
                    type="button"
                    onClick={() => setPredPrecision(prec)}
                    className={`py-1.5 text-[9px] font-extrabold uppercase tracking-widest rounded-lg transition-all cursor-pointer ${predPrecision === prec ? 'bg-violet-500 text-black font-black' : 'text-zinc-400 hover:text-white'}`}
                  >
                    {prec} {prec === 'Int8' ? '🍃' : prec === 'FP32' ? '⚡' : ''}
                  </button>
                ))}
              </div>
            </div>

            {/* Duration Slider */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-[9px] font-black uppercase tracking-wider text-zinc-400">
                <span>Output Video Duration</span>
                <span className="text-violet-400 font-black">{predDuration} Minutes</span>
              </div>
              <input
                type="range"
                min="1"
                max="120"
                value={predDuration}
                onChange={(e) => setPredDuration(parseInt(e.target.value))}
                className="w-full accent-violet-500 h-1 bg-zinc-800 rounded-lg appearance-none cursor-pointer"
              />
              <p className="text-[8px] text-zinc-500 font-medium">The physical runtime length of the output video render pipeline.</p>
            </div>

            {/* Concurrency Slider */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-[9px] font-black uppercase tracking-wider text-zinc-400">
                <span>Rendering Concurrency Threads</span>
                <span className="text-violet-400 font-black">{predThreads} Cores</span>
              </div>
              <input
                type="range"
                min="1"
                max="8"
                value={predThreads}
                onChange={(e) => setPredThreads(parseInt(e.target.value))}
                className="w-full accent-violet-500 h-1 bg-zinc-800 rounded-lg appearance-none cursor-pointer"
              />
            </div>

            {/* Ambient Temperature Slider */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-[9px] font-black uppercase tracking-wider text-zinc-400">
                <span>Ambient Device Temp</span>
                <span className={`font-black ${predAmbientTemp > 35 ? 'text-red-400' : 'text-violet-400'}`}>{predAmbientTemp}°C</span>
              </div>
              <input
                type="range"
                min="10"
                max="45"
                value={predAmbientTemp}
                onChange={(e) => setPredAmbientTemp(parseInt(e.target.value))}
                className="w-full accent-violet-500 h-1 bg-zinc-800 rounded-lg appearance-none cursor-pointer"
              />
              <p className="text-[8px] text-zinc-500 font-medium">Higher ambient values induce rapid battery degradation and thermal impedance losses.</p>
            </div>

            {/* Trigger neural verification button */}
            <button
              type="button"
              disabled={predIsAnalyzing}
              onClick={() => {
                setPredIsAnalyzing(true);
                const tid = toast.loading("Re-running neural regression gradient weights analysis... 🧠");
                setTimeout(() => {
                  toast.success("AI Model Forecast Updated: Coefficients successfully resolved! 🎯", { id: tid });
                  setPredIsAnalyzing(false);
                  logActivity(`Triggered predictive AI battery drain model analysis for video render: ${predResolution} @ ${predFramerate}fps, ${predDuration}m duration`, "Battery Dashboard", "system");
                }, 1000);
              }}
              className="w-full py-2.5 bg-violet-600 hover:bg-violet-500 disabled:opacity-50 text-white text-[9.5px] font-black uppercase tracking-widest rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5 active:scale-95 shadow-md font-sans"
            >
              {predIsAnalyzing ? (
                <>
                  <RefreshCw size={12} className="animate-spin" />
                  Resolving Network Gradients...
                </>
              ) : (
                <>
                  <Activity size={12} />
                  Compute Neural Drain Forecast
                </>
              )}
            </button>
          </div>

          {/* Column 2: Results & Comparative decay chart (60%) */}
          <div className="xl:col-span-3 space-y-4">
            {/* Bento Grid layout for metric results */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              
              {/* Card 1: Predicted drain */}
              {(() => {
                const currentPct = Math.round(batteryStatus.level * 100);
                const isDeficit = calculated.drainPercent > currentPct && !batteryStatus.charging;
                
                return (
                  <div className={`p-4 rounded-2xl border flex flex-col justify-between space-y-2 relative overflow-hidden ${
                    isDeficit 
                      ? 'bg-red-950/20 border-red-500/30' 
                      : calculated.drainPercent > 40 
                        ? 'bg-amber-950/20 border-amber-500/30' 
                        : 'bg-zinc-950/40 border-zinc-850/50'
                  }`}>
                    <div>
                      <span className="text-[7.5px] font-black text-zinc-500 uppercase tracking-widest block">Predicted Percentage Drain</span>
                      <p className="text-2xl font-black text-white mt-1">
                        -{calculated.drainPercent}%
                      </p>
                    </div>

                    <div className="space-y-1">
                      <div className="h-1 bg-zinc-900 rounded-full overflow-hidden">
                        <div 
                          className={`h-full rounded-full transition-all duration-300 ${
                            isDeficit ? 'bg-red-500 animate-pulse' : calculated.drainPercent > 40 ? 'bg-amber-500' : 'bg-emerald-500'
                          }`}
                          style={{ width: `${calculated.drainPercent}%` }}
                        />
                      </div>
                      <span className={`text-[7.5px] font-black uppercase tracking-wider block ${isDeficit ? 'text-red-400' : 'text-zinc-500'}`}>
                        {isDeficit ? '❌ Capacity Deficit!' : '✓ Safe Threshold'}
                      </span>
                    </div>
                  </div>
                );
              })()}

              {/* Card 2: Expected Watts & Energy */}
              <div className="bg-zinc-950/40 border border-zinc-850/50 p-4 rounded-2xl flex flex-col justify-between space-y-2">
                <div>
                  <span className="text-[7.5px] font-black text-zinc-500 uppercase tracking-widest block">Predicted Peak Power</span>
                  <p className="text-2xl font-black text-white mt-1">
                    {calculated.watts}W
                  </p>
                </div>
                <div className="flex justify-between items-center text-[7.5px] font-black text-zinc-500 uppercase tracking-wider">
                  <span>Total Work:</span>
                  <span className="text-zinc-300 font-bold">{calculated.wattHours} Wh</span>
                </div>
              </div>

              {/* Card 3: Expected render time */}
              <div className="bg-zinc-950/40 border border-zinc-850/50 p-4 rounded-2xl flex flex-col justify-between space-y-2">
                <div>
                  <span className="text-[7.5px] font-black text-zinc-500 uppercase tracking-widest block">Estimated Render Time</span>
                  <p className="text-2xl font-black text-white mt-1">
                    {calculated.renderMinutes}m
                  </p>
                </div>
                <div className="flex justify-between items-center text-[7.5px] font-black text-zinc-500 uppercase tracking-wider">
                  <span>Total Seconds:</span>
                  <span className="text-zinc-300 font-bold">{calculated.renderSeconds}s</span>
                </div>
              </div>

            </div>

            {/* Critical capacity deficit error notice */}
            {(() => {
              const currentPct = Math.round(batteryStatus.level * 100);
              const isDeficit = calculated.drainPercent > currentPct && !batteryStatus.charging;
              if (isDeficit) {
                return (
                  <div className="bg-red-500/10 border border-red-500/25 p-3.5 rounded-2xl space-y-1.5 animate-bounce">
                    <div className="flex items-center gap-1.5 text-[8px] font-black text-red-400 uppercase tracking-wider">
                      <AlertTriangle size={11} /> High Risk of Thermal Cutoff / Shutdown Detected
                    </div>
                    <p className="text-[9.5px] text-zinc-300 font-semibold leading-normal">
                      The predictive AI forecasts this export will consume <span className="text-red-400 font-bold">{calculated.drainPercent}%</span> of cell capacity, which exceeds your current charge level of <span className="text-white font-black">{currentPct}%</span>. The render job will abort prematurely unless you <span className="text-emerald-400 font-bold">plug in the charger</span> or switch execution to <span className="text-emerald-400 font-bold">Eco Saver (Int8) mode</span> immediately.
                    </p>
                  </div>
                );
              }
              return (
                <div className="bg-emerald-500/5 border border-emerald-500/15 p-3 rounded-2xl flex items-center gap-2">
                  <div className="p-1 bg-emerald-500/10 text-emerald-400 rounded-lg shrink-0">
                    <CheckCircle size={12} />
                  </div>
                  <p className="text-[9px] text-zinc-400 font-medium">
                    Predictive verification complete: Current device battery reserves ({Math.round(batteryStatus.level * 100)}%) are fully sufficient to withstand this export pipeline's peak discharge stress.
                  </p>
                </div>
              );
            })()}

            {/* Decay Trajectory Area Chart */}
            <div className="bg-zinc-950/40 border border-zinc-850/50 p-4.5 rounded-2xl space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-[9px] font-black text-zinc-400 uppercase tracking-wider">
                  Forecasted Battery Decay Trajectory Comparison
                </span>
                <span className="text-[8px] text-zinc-500 font-bold">
                  Linear MLP Model Estimate
                </span>
              </div>

              <div className="h-44 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart
                    data={forecastChartData}
                    margin={{ top: 5, right: 5, left: -25, bottom: 0 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#27272a" opacity={0.2} />
                    <XAxis 
                      dataKey="time" 
                      stroke="#52525b" 
                      fontSize={8} 
                      tickLine={false} 
                    />
                    <YAxis 
                      stroke="#71717a" 
                      fontSize={8} 
                      domain={[0, 100]} 
                      tickLine={false}
                      axisLine={false}
                    />
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#09090b', borderColor: '#27272a', borderRadius: '12px', fontSize: '9px' }} 
                      labelStyle={{ fontWeight: 'black', color: '#a1a1aa' }}
                    />
                    <Legend iconSize={8} wrapperStyle={{ fontSize: '8px', textTransform: 'uppercase', fontWeight: 'bold' }} />
                    <Line 
                      type="monotone" 
                      dataKey="Full Power Drain" 
                      stroke="#ef4444" 
                      strokeWidth={1.5}
                      dot={false}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="Eco Saver Drain" 
                      stroke="#10b981" 
                      strokeWidth={1.5}
                      strokeDasharray="4 4"
                      dot={false}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Dynamic Export Launcher Button */}
            <div className="flex flex-col sm:flex-row gap-3">
              <button
                type="button"
                onClick={() => {
                  toast.success("Eco-Saver limit parameters applied! Dispatching Video render pipeline... 🍃");
                  logActivity(`Initiated eco-saver video export: Resolution ${predResolution}, Precision: Int8, Cores capped to 2`, "Battery Dashboard", "system");
                }}
                className="flex-1 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-zinc-950 text-[10px] font-black uppercase tracking-wider rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1 active:scale-95"
              >
                <Sparkles size={11} /> Initiate Eco Render (-{calculated.ecoDrainPercent}% drain)
              </button>
              <button
                type="button"
                disabled={calculated.drainPercent > Math.round(batteryStatus.level * 100) && !batteryStatus.charging}
                onClick={() => {
                  toast.success("Standard high-precision export initiated! Keep an eye on battery thermals. ⚡");
                  logActivity(`Initiated full-power video export: Resolution ${predResolution}, Precision: ${predPrecision}, Cores: ${predThreads}`, "Battery Dashboard", "system");
                }}
                className="flex-1 py-2.5 bg-zinc-900 hover:bg-zinc-850 disabled:opacity-40 text-white text-[10px] font-black uppercase tracking-wider border border-zinc-800 rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1 active:scale-95"
              >
                <Zap size={11} /> Launch High-Precision Render
              </button>
            </div>

          </div>

        </div>
      </div>

      {/* Grid Row 3: Simulations & Deferred Tasks */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Sandbox Simulation Panel */}
        <div className="bg-zinc-900/30 border border-zinc-850 p-6 rounded-3xl space-y-4 text-left">
          <div className="flex items-center gap-2">
            <div className="p-1 bg-zinc-800 text-zinc-300 rounded-lg">
              <Settings size={16} />
            </div>
            <h3 className="text-xs font-black uppercase text-zinc-300 tracking-wider">
              Telemetry Sandbox Simulator
            </h3>
          </div>
          
          <p className="text-[10px] text-zinc-400 leading-relaxed font-semibold">
            Adjust the slider below to simulate extreme low-battery behavior. Test how the application automatically intercepts non-essential AI requests and queues them safely in real-time.
          </p>

          <div className="space-y-4 pt-2">
            <div className="space-y-1.5">
              <div className="flex justify-between text-[10px] font-extrabold uppercase tracking-wider text-zinc-500">
                <span>Simulated Cell Charge</span>
                <span className="text-white font-black">{simLevel}%</span>
              </div>
              <input
                type="range"
                min="5"
                max="100"
                value={simLevel}
                onChange={(e) => {
                  const val = parseInt(e.target.value);
                  setSimLevel(val);
                  handleSimulateUpdate(val, simCharging);
                }}
                className="w-full accent-emerald-500 h-1 bg-zinc-800 rounded-lg appearance-none cursor-pointer"
              />
            </div>

            <div className="flex items-center justify-between bg-zinc-950/40 p-4 rounded-2xl border border-zinc-850/50">
              <div className="space-y-0.5">
                <span className="text-[10px] font-black text-zinc-300 uppercase tracking-wide">A/C Wall Line Input</span>
                <p className="text-[9px] text-zinc-500 font-semibold">Simulate if the charger is active or disconnected.</p>
              </div>
              <button
                type="button"
                onClick={() => {
                  const next = !simCharging;
                  setSimCharging(next);
                  handleSimulateUpdate(simLevel, next);
                }}
                className={`text-[9px] px-4 py-2 font-black uppercase tracking-widest rounded-xl transition-all ${simCharging ? 'bg-green-500 text-zinc-950 hover:bg-green-400' : 'bg-zinc-850 text-zinc-400 hover:bg-zinc-800 border border-zinc-800'}`}
              >
                {simCharging ? 'Discharge cell' : 'Plug In Charger'}
              </button>
            </div>

            {/* Simulated Load trigger */}
            <div className="flex items-center justify-between bg-zinc-950/40 p-4 rounded-2xl border border-zinc-850/50">
              <div className="space-y-0.5">
                <span className="text-[10px] font-black text-zinc-300 uppercase tracking-wide">Launch Simulated AI Workload</span>
                <p className="text-[9px] text-zinc-500 font-semibold">Fires a mock 12-second high-intensity task on the thread.</p>
              </div>
              <button
                type="button"
                disabled={isSimulatingLoad}
                onClick={triggerMockAILoad}
                className="text-[9px] bg-red-600 hover:bg-red-500 disabled:opacity-50 text-white font-black uppercase tracking-widest px-4 py-2 rounded-xl transition-all flex items-center gap-1.5"
              >
                {isSimulatingLoad ? (
                  <><RefreshCw size={10} className="animate-spin" /> Heavy Load Active</>
                ) : (
                  <><Play size={10} fill="currentColor" /> Sim Load</>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Deferred Queue Panel */}
        <div className="bg-zinc-900/30 border border-zinc-850 p-6 rounded-3xl space-y-4 text-left flex flex-col justify-between">
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2">
                <div className="p-1 bg-amber-500/10 text-amber-500 rounded-lg">
                  <ShieldAlert size={16} />
                </div>
                <h3 className="text-xs font-black uppercase text-zinc-300 tracking-wider">
                  Postponed Task Pipeline ({deferredTasks.length})
                </h3>
              </div>
              {deferredTasks.length > 0 && (
                <button
                  type="button"
                  onClick={() => clearDeferredTasks()}
                  className="text-[8px] text-zinc-500 hover:text-zinc-300 font-black uppercase tracking-wider"
                >
                  Clear All
                </button>
              )}
            </div>

            <p className="text-[10px] text-zinc-400 leading-relaxed font-semibold">
              These non-essential background tasks were automatically deferred because your device battery is low ({Math.round(batteryStatus.level * 100)}%) and not charging. They will resume automatically when you plug in or charge above 25%.
            </p>

            {deferredTasks.length === 0 ? (
              <div className="py-8 bg-zinc-950/20 border border-dashed border-zinc-850 rounded-2xl flex flex-col items-center justify-center text-center space-y-2">
                <div className="p-3 bg-emerald-500/10 text-emerald-400 rounded-full border border-emerald-500/20">
                  <CheckCircle size={20} />
                </div>
                <div className="space-y-0.5">
                  <span className="text-[10px] font-black uppercase text-zinc-300 tracking-wide">Deferred Pipeline Clear</span>
                  <p className="text-[9px] text-zinc-500 font-semibold">No deferred tasks. All background operations are fully synchronized.</p>
                </div>
              </div>
            ) : (
              <div className="space-y-3.5 max-h-56 overflow-y-auto pr-1 scrollbar-thin">
                {deferredTasks.map(task => (
                  <div key={task.id} className="bg-zinc-950/60 border border-zinc-850/80 p-4 rounded-2xl flex justify-between items-start gap-4">
                    <div className="space-y-1">
                      <p className="text-[11px] font-bold text-white">{task.name}</p>
                      <div className="flex items-center gap-3">
                        <span className="px-1.5 py-0.5 bg-amber-500/10 border border-amber-500/20 text-amber-400 text-[7px] font-black uppercase tracking-wider rounded">
                          DEFERRED DUE TO ENERGY DEFICIT
                        </span>
                        <span className="text-[8.5px] text-zinc-500 font-bold uppercase tracking-wider">
                          Type: {task.type?.replace('_', ' ')}
                        </span>
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      <span className="text-[9px] text-zinc-500 font-extrabold uppercase">Est: {task.duration}s</span>
                      <button
                        type="button"
                        onClick={() => forceRunTask(task.id)}
                        className="text-[8.5px] bg-amber-500 hover:bg-amber-400 text-zinc-950 font-black px-2.5 py-1 rounded-xl uppercase tracking-wider transition-all cursor-pointer shadow-md active:scale-95"
                      >
                        Force Run
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Mini informational note */}
          <div className="bg-zinc-950/40 p-3 rounded-2xl border border-zinc-850/50 flex items-start gap-2 text-zinc-500">
            <Info size={12} className="shrink-0 text-zinc-400 mt-0.5" />
            <p className="text-[8.5px] leading-normal font-semibold">
              The application uses the W3C standard Battery Status API inside modern browsers. If permission is denied or unsupported, a robust mock virtual controller guarantees fluid background-task scheduling integrity.
            </p>
          </div>
        </div>

      </div>
    </div>
  );
}
