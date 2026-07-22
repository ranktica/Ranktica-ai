import React, { useState, useEffect, useMemo } from 'react';
import { 
  Activity, 
  Server, 
  ShieldCheck, 
  Clock, 
  Wifi, 
  WifiOff, 
  RefreshCw, 
  TrendingDown, 
  TrendingUp, 
  Flame,
  Gauge,
  CheckCircle2,
  AlertTriangle,
  Download,
  Sliders,
  BellRing,
  BookOpen,
  X,
  Code,
  Key,
  Copy,
  Check
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { 
  ResponsiveContainer, 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend,
  ReferenceLine
} from 'recharts';

interface EndpointHealth {
  name: string;
  type: string;
  uptime: number;
  latency: number;
  status: 'operational' | 'degraded' | 'mocked' | 'offline';
  requests24h: number;
  successRate: number;
}

interface LatencyTrendPoint {
  minute: string;
  gemini: number;
  veo: number;
}

export const ApiHealthStatusWidget: React.FC = () => {
  const [isMockActive, setIsMockActive] = useState<boolean>(false);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [lastCheckTime, setLastCheckTime] = useState<string>('');
  
  // Auto-refresh real-time monitoring state
  const [isAutoRefreshEnabled, setIsAutoRefreshEnabled] = useState<boolean>(true);
  const [countdown, setCountdown] = useState<number>(30);

  // Configurable alert thresholds for latency (user-adjustable)
  const [geminiThreshold, setGeminiThreshold] = useState<number>(400);
  const [veoThreshold, setVeoThreshold] = useState<number>(5000);
  const [isThresholdConfigOpen, setIsThresholdConfigOpen] = useState<boolean>(false);
  const [selectedDocEndpoint, setSelectedDocEndpoint] = useState<'gemini' | 'veo' | null>(null);
  const [copiedTextType, setCopiedTextType] = useState<string | null>(null);
  const [playbookLang, setPlaybookLang] = useState<'curl' | 'node' | 'python'>('curl');

  // Real-time fluctuating latency metrics
  const [geminiLatency, setGeminiLatency] = useState<number>(320);
  const [veoLatency, setVeoLatency] = useState<number>(4500);

  // Sparkline history for visual flair
  const [geminiHistory, setGeminiHistory] = useState<number[]>([320, 310, 335, 318, 325, 340, 322, 330]);
  const [veoHistory, setVeoHistory] = useState<number[]>([4500, 4300, 4700, 4600, 4400, 4800, 4550, 4500]);

  // 60-minute historical latency trend dataset
  const [trendData, setTrendData] = useState<LatencyTrendPoint[]>([]);

  // Anomaly detection state
  const [isAnomalyDetectionEnabled, setIsAnomalyDetectionEnabled] = useState<boolean>(true);

  // We compute the sliding 10-minute moving average and standard deviation to detect anomalies (>2 std dev)
  const analyzedTrendData = useMemo(() => {
    const windowSize = 10;
    return trendData.map((point, index) => {
      // Find the slice of previous points (moving window)
      const start = Math.max(0, index - windowSize + 1);
      const windowPoints = trendData.slice(start, index + 1);
      const N = windowPoints.length;

      // Gemini Latency Calculations
      const geminiValues = windowPoints.map(p => p.gemini);
      const geminiSum = geminiValues.reduce((sum, val) => sum + val, 0);
      const geminiMean = geminiSum / N;
      const geminiVariance = geminiValues.reduce((sum, val) => sum + Math.pow(val - geminiMean, 2), 0) / N;
      const geminiStdDev = Math.sqrt(geminiVariance);
      // Determine if anomalous: difference from moving average exceeds 2 * standard deviation
      const isGeminiAnomalous = isAnomalyDetectionEnabled && N >= 3 && geminiStdDev > 1 && Math.abs(point.gemini - geminiMean) > 2 * geminiStdDev;

      // Veo Latency Calculations
      const veoValues = windowPoints.map(p => p.veo);
      const veoSum = veoValues.reduce((sum, val) => sum + val, 0);
      const veoMean = veoSum / N;
      const veoVariance = veoValues.reduce((sum, val) => sum + Math.pow(val - veoMean, 2), 0) / N;
      const veoStdDev = Math.sqrt(veoVariance);
      const isVeoAnomalous = isAnomalyDetectionEnabled && N >= 3 && veoStdDev > 1 && Math.abs(point.veo - veoMean) > 2 * veoStdDev;

      return {
        ...point,
        geminiMean,
        geminiStdDev,
        isGeminiAnomalous,
        veoMean,
        veoStdDev,
        isVeoAnomalous
      };
    });
  }, [trendData, isAnomalyDetectionEnabled]);

  const renderAnomalyDot = (isGemini: boolean) => {
    return (props: any) => {
      const { cx, cy, payload } = props;
      if (!payload) return null;
      
      const isAnomalous = isGemini ? payload.isGeminiAnomalous : payload.isVeoAnomalous;
      if (!isAnomalous) return null;

      const color = isGemini ? '#ef4444' : '#c084fc'; // Red for Gemini, Purple/Indigo for Veo
      return (
        <g key={`anomaly-${isGemini ? 'gemini' : 'veo'}-${cx}-${cy}`} className="cursor-pointer">
          <circle
            cx={cx}
            cy={cy}
            r={8}
            fill="none"
            stroke={color}
            strokeWidth={1.5}
            className="animate-ping"
            style={{ transformOrigin: `${cx}px ${cy}px` }}
          />
          <circle
            cx={cx}
            cy={cy}
            r={4.5}
            fill={color}
            stroke="#09090b"
            strokeWidth={1}
          />
          <circle
            cx={cx}
            cy={cy}
            r={1.5}
            fill="#ffffff"
          />
        </g>
      );
    };
  };

  // Function to generate rich historical data with simulated period-based degradation
  const generateHistoricalData = (mocked: boolean): LatencyTrendPoint[] => {
    const data: LatencyTrendPoint[] = [];
    const baseGemini = mocked ? 20 : 330;
    const baseVeo = mocked ? 180 : 4500;
    
    for (let i = 59; i >= 0; i--) {
      // Introduce an elegant period-based degradation around 15-30 minutes ago
      let degradationFactor = 1.0;
      if (i >= 15 && i <= 30) {
        // simulate a distinct period of performance degradation (e.g. standard queue congestion spike)
        degradationFactor = 1.6 + Math.sin((i - 15) * Math.PI / 15) * 0.4;
      } else {
        // normal healthy randomized jitter
        degradationFactor = 0.9 + Math.random() * 0.2;
      }

      data.push({
        minute: i === 0 ? 'Now' : `${i}m ago`,
        gemini: Math.round(baseGemini * degradationFactor),
        veo: Math.round(baseVeo * degradationFactor)
      });
    }
    return data;
  };

  // Fetch the mock mode state from backend
  const checkMockMode = async (silent: boolean = false) => {
    try {
      if (!silent) setIsRefreshing(true);
      const res = await fetch('/api/dev/mock-mode');
      
      const contentType = res.headers.get('content-type');
      if (!res.ok || !contentType || !contentType.includes('application/json')) {
        const text = await res.text();
        console.warn('[ApiHealthStatusWidget] Server returned non-JSON/error response for mock mode status check:', text);
        return;
      }

      const data = await res.json();
      if (data && typeof data.enabled === 'boolean') {
        setIsMockActive(data.enabled);
      }
      
      const now = new Date();
      setLastCheckTime(now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
      
      if (!silent) {
        toast.success('Successfully synchronized real-time API health states.');
      }
    } catch (err) {
      console.warn('[ApiHealthStatusWidget] Failed to sync mock mode state:', err);
    } finally {
      setIsRefreshing(false);
    }
  };

  // Export 60-minute trend data as CSV
  const exportTrendToCSV = () => {
    try {
      if (!analyzedTrendData || analyzedTrendData.length === 0) {
        toast.error('No trend data available to export.');
        return;
      }
      
      const headers = [
        'Timestamp', 
        'Gemini Latency (ms)', 
        'Gemini Moving Average (ms)', 
        'Gemini Std Dev (ms)', 
        'Gemini Is Anomalous', 
        'Veo Latency (ms)',
        'Veo Moving Average (ms)',
        'Veo Std Dev (ms)',
        'Veo Is Anomalous'
      ];
      
      const rows = analyzedTrendData.map(point => [
        point.minute,
        point.gemini,
        Math.round(point.geminiMean || 0),
        Math.round(point.geminiStdDev || 0),
        point.isGeminiAnomalous ? 'TRUE' : 'FALSE',
        point.veo,
        Math.round(point.veoMean || 0),
        Math.round(point.veoStdDev || 0),
        point.isVeoAnomalous ? 'TRUE' : 'FALSE'
      ]);
      
      const csvContent = [
        headers.join(','),
        ...rows.map(row => row.join(','))
      ].join('\n');
      
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.setAttribute('href', url);
      link.setAttribute('download', `ranktica_api_latency_trend_${isMockActive ? 'sandbox' : 'live'}_${new Date().toISOString().slice(0, 10)}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      toast.success('Successfully exported 60-minute historical telemetry data to CSV.');
    } catch (err) {
      console.error('[ApiHealthStatusWidget] CSV export failed:', err);
      toast.error('Failed to export latency telemetry data to CSV.');
    }
  };

  // Export list of triggered latency alerts as a JSON file
  const exportAlertsToJSON = () => {
    try {
      const incidents: any[] = [];
      
      // We will iterate through analyzedTrendData to extract any threshold violations or anomalies
      analyzedTrendData.forEach((point, index) => {
        const hasGeminiAlert = point.gemini > geminiThreshold || point.isGeminiAnomalous;
        const hasVeoAlert = point.veo > veoThreshold || point.isVeoAnomalous;

        if (hasGeminiAlert) {
          const type = point.isGeminiAnomalous 
            ? (point.gemini > geminiThreshold ? 'ANOMALOUS_THRESHOLD_BREACH' : 'ANOMALY_DETECTION')
            : 'THRESHOLD_BREACH';
          
          const sigma = point.geminiStdDev && point.geminiStdDev > 0 
            ? (Math.abs(point.gemini - (point.geminiMean || 0)) / point.geminiStdDev).toFixed(2)
            : '0.00';

          incidents.push({
            id: `INCIDENT-GEMINI-${point.minute.replace(/\s+/g, '')}-${index}`,
            timestamp: point.minute,
            service: 'Gemini Orchestration',
            type,
            metric: 'latency_ms',
            observedValue: point.gemini,
            thresholdValue: geminiThreshold,
            movingAverage: Math.round(point.geminiMean || 0),
            standardDeviation: Math.round(point.geminiStdDev || 0),
            sigmaDeviation: parseFloat(sigma),
            severity: point.gemini > geminiThreshold * 1.5 ? 'CRITICAL' : 'WARNING',
            status: 'unresolved',
            message: `Gemini Orchestration latency (${point.gemini} ms) exceeded warning levels. Deviation: ${sigma}σ from ${Math.round(point.geminiMean || 0)} ms MA.`
          });
        }

        if (hasVeoAlert) {
          const type = point.isVeoAnomalous 
            ? (point.veo > veoThreshold ? 'ANOMALOUS_THRESHOLD_BREACH' : 'ANOMALY_DETECTION')
            : 'THRESHOLD_BREACH';
            
          const sigma = point.veoStdDev && point.veoStdDev > 0 
            ? (Math.abs(point.veo - (point.veoMean || 0)) / point.veoStdDev).toFixed(2)
            : '0.00';

          incidents.push({
            id: `INCIDENT-VEO-${point.minute.replace(/\s+/g, '')}-${index}`,
            timestamp: point.minute,
            service: 'Veo Synthesis API',
            type,
            metric: 'latency_ms',
            observedValue: point.veo,
            thresholdValue: veoThreshold,
            movingAverage: Math.round(point.veoMean || 0),
            standardDeviation: Math.round(point.veoStdDev || 0),
            sigmaDeviation: parseFloat(sigma),
            severity: point.veo > veoThreshold * 1.5 ? 'CRITICAL' : 'WARNING',
            status: 'unresolved',
            message: `Veo Synthesis API latency (${point.veo} ms) exceeded warning levels. Deviation: ${sigma}σ from ${Math.round(point.veoMean || 0)} ms MA.`
          });
        }
      });

      // Sort incidents (keep reverse-chronological order for post-mortem analysis logs)
      const sortedIncidents = incidents.reverse();

      const alertPayload = {
        meta: {
          exporter: 'Ranktica AI Telemetry Orchestrator (v1.0.0-release)',
          exportedAt: new Date().toISOString(),
          environment: isMockActive ? 'DEVELOPER_SANDBOX_MOCKED' : 'PRODUCTION_LIVE_GATEWAY',
          scanPeriod: '60-minute sliding window',
          thresholdsConfig: {
            geminiMaxMs: geminiThreshold,
            veoMaxMs: veoThreshold,
            anomalyGuardEnabled: isAnomalyDetectionEnabled
          },
          summary: {
            totalIncidentsFlagged: sortedIncidents.length,
            criticalCount: sortedIncidents.filter(i => i.severity === 'CRITICAL').length,
            warningCount: sortedIncidents.filter(i => i.severity === 'WARNING').length
          }
        },
        incidents: sortedIncidents
      };

      const blob = new Blob([JSON.stringify(alertPayload, null, 2)], { type: 'application/json;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.setAttribute('href', url);
      link.setAttribute('download', `ranktica_incident_alerts_${isMockActive ? 'sandbox' : 'live'}_${new Date().toISOString().slice(0, 10)}.json`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      toast.success(`Successfully exported ${sortedIncidents.length} alert incidents to JSON.`);
    } catch (err) {
      console.error('[ApiHealthStatusWidget] JSON alert export failed:', err);
      toast.error('Failed to export incident alerts to JSON.');
    }
  };

  // Auto-refresh countdown effect
  useEffect(() => {
    if (!isAutoRefreshEnabled) {
      return;
    }

    const timer = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          // Trigger silent status pull
          checkMockMode(true);
          return 30;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isAutoRefreshEnabled]);

  // Handle manual sync and reset countdown
  const triggerManualRefresh = () => {
    checkMockMode(false);
    if (isAutoRefreshEnabled) {
      setCountdown(30);
    }
  };

  // Initial sync and poll intervals
  useEffect(() => {
    checkMockMode(true);
    
    // Poll the mock-mode endpoint every 30 seconds to keep sync in real-time
    const pollTimer = setInterval(() => {
      checkMockMode(true);
    }, 30000);

    return () => clearInterval(pollTimer);
  }, []);

  // Simulating live ticks of latency fluctuations
  useEffect(() => {
    const tickTimer = setInterval(() => {
      if (isMockActive) {
        // Mock mode: extremely fast, super stable latencies
        setGeminiLatency(prev => {
          const next = Math.max(10, Math.min(30, Math.round(15 + Math.random() * 8)));
          setGeminiHistory(h => [...h.slice(1), next]);
          // Update the current point in trendData live
          setTrendData(t => {
            if (t.length === 0) return t;
            const updated = [...t];
            updated[updated.length - 1] = {
              ...updated[updated.length - 1],
              gemini: next
            };
            return updated;
          });
          return next;
        });
        setVeoLatency(prev => {
          const next = Math.max(120, Math.min(220, Math.round(150 + Math.random() * 40)));
          setVeoHistory(h => [...h.slice(1), next]);
          // Update the current point in trendData live
          setTrendData(t => {
            if (t.length === 0) return t;
            const updated = [...t];
            updated[updated.length - 1] = {
              ...updated[updated.length - 1],
              veo: next
            };
            return updated;
          });
          return next;
        });
      } else {
        // Live mode: standard real-world API latencies with high variance
        setGeminiLatency(prev => {
          const next = Math.max(250, Math.min(480, Math.round(310 + Math.random() * 90 - 45)));
          setGeminiHistory(h => [...h.slice(1), next]);
          // Update the current point in trendData live
          setTrendData(t => {
            if (t.length === 0) return t;
            const updated = [...t];
            updated[updated.length - 1] = {
              ...updated[updated.length - 1],
              gemini: next
            };
            return updated;
          });
          return next;
        });
        setVeoLatency(prev => {
          const next = Math.max(3800, Math.min(5800, Math.round(4400 + Math.random() * 600 - 300)));
          setVeoHistory(h => [...h.slice(1), next]);
          // Update the current point in trendData live
          setTrendData(t => {
            if (t.length === 0) return t;
            const updated = [...t];
            updated[updated.length - 1] = {
              ...updated[updated.length - 1],
              veo: next
            };
            return updated;
          });
          return next;
        });
      }
    }, 2000);

    return () => clearInterval(tickTimer);
  }, [isMockActive]);

  // Adjust historical sparkline and 60-minute trend immediately on mode switch
  useEffect(() => {
    setTrendData(generateHistoricalData(isMockActive));
    if (isMockActive) {
      setGeminiHistory([18, 15, 22, 19, 14, 25, 17, 20]);
      setVeoHistory([160, 180, 150, 190, 140, 210, 175, 165]);
    } else {
      setGeminiHistory([310, 340, 290, 350, 320, 315, 330, 325]);
      setVeoHistory([4400, 4600, 4300, 4700, 4200, 4800, 4500, 4450]);
    }
  }, [isMockActive]);

  const toggleMockModeDirect = async () => {
    try {
      setIsRefreshing(true);
      const nextState = !isMockActive;
      const res = await fetch('/api/dev/mock-mode', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ enabled: nextState })
      });
      const data = await res.json();
      if (data && data.success) {
        setIsMockActive(data.enabled);
        if (data.enabled) {
          toast.success('🛡️ Activated Developer Sandbox. Standard APIs redirected locally.');
        } else {
          toast('🛰️ Returned to real-time production endpoints.', {
            icon: '⚡',
            style: {
              borderRadius: '12px',
              background: '#09090b',
              color: '#f4f4f5',
              border: '1px solid #dc2626'
            }
          });
        }
      }
    } catch (err) {
      console.error('[ApiHealthStatusWidget] Failed to toggle mock-mode:', err);
      toast.error('Failed to update mock-mode state.');
    } finally {
      setIsRefreshing(false);
    }
  };

  const getSparklinePoints = (history: number[], width: number, height: number): string => {
    const min = Math.min(...history);
    const max = Math.max(...history);
    const range = max - min || 1;
    
    return history.map((val, idx) => {
      const x = (idx / (history.length - 1)) * width;
      const y = height - ((val - min) / range) * (height - 4) - 2;
      return `${x},${y}`;
    }).join(' ');
  };

  const isGeminiWarning = geminiLatency > geminiThreshold;
  const isVeoWarning = veoLatency > veoThreshold;

  const geminiAnomalyCount = useMemo(() => analyzedTrendData.filter(p => p.isGeminiAnomalous).length, [analyzedTrendData]);
  const veoAnomalyCount = useMemo(() => analyzedTrendData.filter(p => p.isVeoAnomalous).length, [analyzedTrendData]);

  return (
    <div id="api-health-status-widget" className="bg-[#121214] border border-zinc-800 rounded-2xl p-6 relative overflow-hidden" style={{ contentVisibility: 'auto' }}>
      {/* Decorative top-right accent blur */}
      <div className={`absolute top-0 right-0 w-48 h-48 rounded-full blur-3xl transition-colors duration-500 ${
        isMockActive ? 'bg-amber-500/[0.03]' : 'bg-red-500/[0.03]'
      }`}></div>

      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-zinc-850 pb-5 mb-6 relative z-10">
        <div>
          <h3 className="text-base font-extrabold text-white flex items-center gap-2 font-sans">
            <Server className={isMockActive ? "text-amber-500" : "text-red-500 animate-pulse"} size={18} />
            API Router Health & Latency
          </h3>
          <p className="text-[10px] text-zinc-500 mt-1 font-sans">
            Real-time ping intervals, active gateway uptime metrics, and local sandbox simulation routing.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Last sync time */}
          {lastCheckTime && (
            <span className="text-[8px] font-mono text-zinc-600 hidden md:inline">
              Checked: {lastCheckTime}
            </span>
          )}

          {/* Auto-Refresh Toggle */}
          <button
            onClick={() => {
              const nextVal = !isAutoRefreshEnabled;
              setIsAutoRefreshEnabled(nextVal);
              if (nextVal) {
                setCountdown(30);
                toast.success('Auto-refresh enabled (30s intervals)');
              } else {
                toast('Auto-refresh disabled', { icon: '⏸️' });
              }
            }}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[9px] font-mono border uppercase tracking-wider transition-all cursor-pointer ${
              isAutoRefreshEnabled
                ? 'bg-green-500/5 border-green-500/20 text-green-400 hover:bg-green-500/10'
                : 'bg-zinc-950 border-zinc-850 text-zinc-500 hover:text-zinc-400 hover:border-zinc-800'
            }`}
            title={isAutoRefreshEnabled ? `Disable real-time polling (next update in ${countdown}s)` : 'Enable real-time polling (30s intervals)'}
          >
            <span className={`w-1.5 h-1.5 rounded-full ${isAutoRefreshEnabled ? 'bg-green-500 animate-pulse' : 'bg-zinc-650'}`}></span>
            <span>Auto-Refresh</span>
            {isAutoRefreshEnabled && (
              <span className="text-[8px] opacity-80 bg-green-500/10 px-1 rounded text-green-300 ml-0.5">{countdown}s</span>
            )}
          </button>

          {/* Threshold Alerts Button */}
          <button
            onClick={() => setIsThresholdConfigOpen(!isThresholdConfigOpen)}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[9px] font-mono border uppercase tracking-wider transition-all cursor-pointer ${
              isThresholdConfigOpen
                ? 'bg-red-500/10 border-red-500/30 text-red-400 hover:bg-red-500/20 shadow-[0_0_12px_rgba(239,68,68,0.1)]'
                : 'bg-zinc-950 border-zinc-850 text-zinc-400 hover:text-white hover:border-zinc-800'
            }`}
            title="Configure Custom Latency Alert Thresholds"
          >
            <Sliders size={11} className={isThresholdConfigOpen ? "text-red-500 animate-pulse" : "text-zinc-500"} />
            <span>Alert Thresholds</span>
          </button>

          {/* Anomaly Detection Toggle */}
          <button
            onClick={() => {
              const nextVal = !isAnomalyDetectionEnabled;
              setIsAnomalyDetectionEnabled(nextVal);
              if (nextVal) {
                toast.success('Real-time Latency Anomaly Guard active.');
              } else {
                toast('Anomaly Guard paused', { icon: '⏸️' });
              }
            }}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[9px] font-mono border uppercase tracking-wider transition-all cursor-pointer ${
              isAnomalyDetectionEnabled
                ? 'bg-purple-500/10 border-purple-500/30 text-purple-400 hover:bg-purple-500/20 shadow-[0_0_12px_rgba(168,85,247,0.1)]'
                : 'bg-zinc-950 border-zinc-850 text-zinc-500 hover:text-zinc-400 hover:border-zinc-800'
            }`}
            title="Toggle Real-time Latency Anomaly Guard (2 Std Dev)"
          >
            <Activity size={11} className={isAnomalyDetectionEnabled ? "text-purple-400 animate-pulse" : "text-zinc-500"} />
            <span>Anomaly Guard</span>
          </button>

          {/* Sync Trigger */}
          <button
            onClick={triggerManualRefresh}
            disabled={isRefreshing}
            className="p-1.5 rounded-lg border border-zinc-800 bg-zinc-950 text-zinc-400 hover:text-white transition cursor-pointer disabled:opacity-50"
            title="Force State Sync"
          >
            <RefreshCw size={12} className={isRefreshing ? "animate-spin text-red-500" : ""} />
          </button>

          {/* Direct Sandbox Simulation toggle */}
          <button
            onClick={toggleMockModeDirect}
            className={`px-3 py-1.5 rounded-lg text-[9px] font-mono font-black uppercase border tracking-wider transition-all cursor-pointer ${
              isMockActive
                ? 'bg-amber-500/10 border-amber-500/30 text-amber-400 hover:bg-amber-500/20 shadow-[0_0_15px_rgba(245,158,11,0.1)]'
                : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-white hover:border-zinc-700'
            }`}
          >
            {isMockActive ? 'Sandbox Active' : 'Go Sandbox'}
          </button>
        </div>
      </div>

      {/* Threshold alerts configuration panel */}
      {isThresholdConfigOpen && (
        <div className="mb-6 bg-zinc-950/90 border border-zinc-850 rounded-xl p-4.5 space-y-4 animate-in fade-in slide-in-from-top-2 duration-300 relative z-20">
          <div className="flex items-center justify-between border-b border-zinc-850 pb-2">
            <div className="flex items-center gap-1.5">
              <BellRing size={13} className="text-red-500 animate-bounce" />
              <h4 className="text-xs font-bold text-zinc-100 font-sans">Configure Custom Alert Thresholds</h4>
            </div>
            <span className="text-[8px] font-mono text-zinc-500">Live Telemetry Event Handlers</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            {/* Gemini Alert Limit slider/input */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-[9px] font-mono text-zinc-400 uppercase tracking-widest">
                  Gemini Alert Limit
                </label>
                <span className="text-[9.5px] font-mono font-black text-red-400 bg-red-500/5 px-2 py-0.5 rounded border border-red-500/10">
                  {geminiThreshold} ms
                </span>
              </div>
              <input
                type="range"
                min="10"
                max="1000"
                step="10"
                value={geminiThreshold}
                onChange={(e) => {
                  const val = Number(e.target.value);
                  setGeminiThreshold(val);
                }}
                className="w-full accent-red-500 h-1 bg-zinc-800 rounded-lg appearance-none cursor-pointer"
              />
              <div className="flex justify-between text-[7.5px] font-mono text-zinc-500">
                <span>10ms (Sandbox Dev)</span>
                <span>1000ms (Heavy Backpressure)</span>
              </div>
            </div>

            {/* Veo Alert Limit slider/input */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-[9px] font-mono text-zinc-400 uppercase tracking-widest">
                  Veo Synthesis Limit
                </label>
                <span className="text-[9.5px] font-mono font-black text-indigo-400 bg-indigo-500/5 px-2 py-0.5 rounded border border-indigo-500/10">
                  {(veoThreshold / 1000).toFixed(1)}s ({veoThreshold}ms)
                </span>
              </div>
              <input
                type="range"
                min="100"
                max="10000"
                step="100"
                value={veoThreshold}
                onChange={(e) => {
                  const val = Number(e.target.value);
                  setVeoThreshold(val);
                }}
                className="w-full accent-indigo-500 h-1 bg-zinc-800 rounded-lg appearance-none cursor-pointer"
              />
              <div className="flex justify-between text-[7.5px] font-mono text-zinc-500">
                <span>100ms (Sandbox)</span>
                <span>10.0s (Live timeout limits)</span>
              </div>
            </div>
          </div>
          
          <div className="text-[8px] font-mono text-zinc-500 bg-zinc-900/30 p-2.5 rounded-lg border border-zinc-850/60 leading-normal flex items-start gap-2">
            <span className="text-red-500 text-[10px]">💡</span>
            <span>
              Threshold-exceeded states trigger automatic visual alert frames, toggle background color shifts, illuminate red warning indicators, and project dynamic horizontal limit lines onto the telemetry graph below.
            </span>
          </div>
        </div>
      )}

      {/* Content Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5 relative z-10">
        
        {/* Gemini Service Card */}
        <div className={`bg-zinc-950/50 border rounded-xl p-4.5 space-y-4 transition-all duration-300 ${
          isGeminiWarning 
            ? 'border-red-500/80 bg-red-500/[0.02] shadow-[0_0_20px_rgba(239,68,68,0.07)] animate-[pulse_3s_infinite]' 
            : 'border-zinc-850/80 hover:border-zinc-800'
        }`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className={`w-2 h-2 rounded-full ${isGeminiWarning ? 'bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.8)] animate-pulse' : isMockActive ? 'bg-amber-400 shadow-[0_0_8px_rgba(245,158,11,0.4)] animate-pulse' : 'bg-green-500'}`}></div>
              <div>
                <span className="text-xs font-black text-white block">Gemini Orchestration</span>
                <span className="text-[8px] text-zinc-500 font-mono uppercase tracking-widest block mt-0.5">Cognitive Core Engine</span>
              </div>
            </div>
            
            <div className="flex items-center gap-1.5">
              {isGeminiWarning && (
                <span className="flex items-center gap-1 text-[8px] font-mono font-black text-red-400 bg-red-500/10 border border-red-500/20 px-2 py-0.5 rounded animate-pulse">
                  <AlertTriangle size={9} className="text-red-500 shrink-0" />
                  LATENCY CRITICAL
                </span>
              )}
              <span className={`text-[8.5px] font-mono font-bold px-2 py-0.5 rounded ${
                isMockActive ? 'bg-amber-500/10 text-amber-400' : 'bg-green-500/10 text-green-400'
              }`}>
                {isMockActive ? 'SANDBOX FALLBACK' : 'LIVE AGENT'}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 border-t border-b border-zinc-850/50 py-3.5">
            <div>
              <span className="text-[8.5px] font-mono text-zinc-500 uppercase block">Real-time Ping</span>
              <div className="flex items-baseline gap-1 mt-0.5">
                <span className={`text-xl font-extrabold font-mono tracking-tight ${
                  isGeminiWarning ? 'text-red-500 animate-pulse' : isMockActive ? 'text-amber-400' : 'text-white'
                }`}>
                  {geminiLatency}
                </span>
                <span className="text-[8px] text-zinc-500 font-mono">ms</span>
              </div>
            </div>

            <div>
              <span className="text-[8.5px] font-mono text-zinc-500 uppercase block">Active Uptime</span>
              <div className="flex items-baseline gap-1 mt-0.5">
                <span className={`text-xl font-extrabold font-mono tracking-tight ${
                  isMockActive ? 'text-emerald-400' : 'text-zinc-200'
                }`}>
                  {isMockActive ? '100.00' : '99.98'}
                </span>
                <span className="text-[8px] text-zinc-500 font-mono">%</span>
              </div>
            </div>
          </div>

          {/* Miniature Sparkline */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-[8px] font-mono text-zinc-500">
              <span>LATENCY TELEMETRY STRIP</span>
              <span className="text-zinc-400">{isMockActive ? 'Ideal Zero-Cost Frame' : 'Standard Web ingress'}</span>
            </div>
            <div className="bg-zinc-950/80 border border-zinc-900 rounded-lg p-2 h-10 flex items-center justify-center">
              <svg className="w-full h-full" viewBox="0 0 200 30" preserveAspectRatio="none">
                <polyline
                  fill="none"
                  stroke={isGeminiWarning ? "#ef4444" : isMockActive ? "#f59e0b" : "#ef4444"}
                  strokeWidth="1.5"
                  points={getSparklinePoints(geminiHistory, 200, 30)}
                />
              </svg>
            </div>
          </div>

          <div className="flex justify-between items-center text-[8.5px] font-mono text-zinc-500 border-t border-zinc-900/40 pt-2.5">
            <span className="flex items-center gap-1">
              {isGeminiWarning ? (
                <AlertTriangle size={11} className="text-red-500 animate-pulse" />
              ) : (
                <ShieldCheck size={11} className="text-green-500" />
              )}
              <span className={isGeminiWarning ? 'text-red-400 font-bold' : ''}>
                {isGeminiWarning ? `Exceeds ${geminiThreshold}ms limit` : 'Response Validation: Passed'}
              </span>
            </span>
            <div className="flex items-center gap-2">
              <span>24h: {isMockActive ? '100.0%' : '99.94%'}</span>
              <span className="text-zinc-800">|</span>
              <button
                onClick={() => setSelectedDocEndpoint('gemini')}
                className="text-red-500 hover:text-red-400 font-bold uppercase tracking-wider flex items-center gap-1 transition-all cursor-pointer hover:underline"
                title="View Technical Specifications for Gemini Orchestration"
              >
                <BookOpen size={10} />
                <span>API Docs</span>
              </button>
            </div>
          </div>
        </div>

        {/* Veo Service Card */}
        <div className={`bg-zinc-950/50 border rounded-xl p-4.5 space-y-4 transition-all duration-300 ${
          isVeoWarning 
            ? 'border-red-500/80 bg-red-500/[0.02] shadow-[0_0_20px_rgba(239,68,68,0.07)] animate-[pulse_3s_infinite]' 
            : 'border-zinc-850/80 hover:border-zinc-800'
        }`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className={`w-2 h-2 rounded-full ${isVeoWarning ? 'bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.8)] animate-pulse' : isMockActive ? 'bg-amber-400 shadow-[0_0_8px_rgba(245,158,11,0.4)] animate-pulse' : 'bg-green-500'}`}></div>
              <div>
                <span className="text-xs font-black text-white block">Veo Synthesis API</span>
                <span className="text-[8px] text-zinc-500 font-mono uppercase tracking-widest block mt-0.5">High Fidelity Frames</span>
              </div>
            </div>
            
            <div className="flex items-center gap-1.5">
              {isVeoWarning && (
                <span className="flex items-center gap-1 text-[8px] font-mono font-black text-red-400 bg-red-500/10 border border-red-500/20 px-2 py-0.5 rounded animate-pulse">
                  <AlertTriangle size={9} className="text-red-500 shrink-0" />
                  LATENCY CRITICAL
                </span>
              )}
              <span className={`text-[8.5px] font-mono font-bold px-2 py-0.5 rounded ${
                isMockActive ? 'bg-amber-500/10 text-amber-400' : 'bg-indigo-500/10 text-indigo-400'
              }`}>
                {isMockActive ? 'SANDBOX FALLBACK' : 'LIVE PIPELINE'}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 border-t border-b border-zinc-850/50 py-3.5">
            <div>
              <span className="text-[8.5px] font-mono text-zinc-500 uppercase block">Real-time Ping</span>
              <div className="flex items-baseline gap-1 mt-0.5">
                <span className={`text-xl font-extrabold font-mono tracking-tight ${
                  isVeoWarning ? 'text-red-500 animate-pulse' : isMockActive ? 'text-amber-400' : 'text-white'
                }`}>
                  {veoLatency}
                </span>
                <span className="text-[8px] text-zinc-500 font-mono">ms</span>
              </div>
            </div>

            <div>
              <span className="text-[8.5px] font-mono text-zinc-500 uppercase block">Active Uptime</span>
              <div className="flex items-baseline gap-1 mt-0.5">
                <span className={`text-xl font-extrabold font-mono tracking-tight ${
                  isMockActive ? 'text-emerald-400' : 'text-zinc-200'
                }`}>
                  {isMockActive ? '100.00' : '99.91'}
                </span>
                <span className="text-[8px] text-zinc-500 font-mono">%</span>
              </div>
            </div>
          </div>

          {/* Miniature Sparkline */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-[8px] font-mono text-zinc-500">
              <span>LATENCY TELEMETRY STRIP</span>
              <span className="text-zinc-400">{isMockActive ? 'Instant Mock Asset' : 'Heavy GPU processing'}</span>
            </div>
            <div className="bg-zinc-950/80 border border-zinc-900 rounded-lg p-2 h-10 flex items-center justify-center">
              <svg className="w-full h-full" viewBox="0 0 200 30" preserveAspectRatio="none">
                <polyline
                  fill="none"
                  stroke={isVeoWarning ? "#ef4444" : isMockActive ? "#f59e0b" : "#6366f1"}
                  strokeWidth="1.5"
                  points={getSparklinePoints(veoHistory, 200, 30)}
                />
              </svg>
            </div>
          </div>

          <div className="flex justify-between items-center text-[8.5px] font-mono text-zinc-500 border-t border-zinc-900/40 pt-2.5">
            <span className="flex items-center gap-1">
              {isVeoWarning ? (
                <AlertTriangle size={11} className="text-red-500 animate-pulse" />
              ) : (
                <ShieldCheck size={11} className="text-green-500" />
              )}
              <span className={isVeoWarning ? 'text-red-400 font-bold' : ''}>
                {isVeoWarning ? `Exceeds ${veoThreshold}ms limit` : 'Orchestration Load: Normal'}
              </span>
            </span>
            <div className="flex items-center gap-2">
              <span>24h: {isMockActive ? '100.0%' : '99.85%'}</span>
              <span className="text-zinc-800">|</span>
              <button
                onClick={() => setSelectedDocEndpoint('veo')}
                className="text-indigo-400 hover:text-indigo-300 font-bold uppercase tracking-wider flex items-center gap-1 transition-all cursor-pointer hover:underline"
                title="View Technical Specifications for Veo Synthesis API"
              >
                <BookOpen size={10} />
                <span>API Docs</span>
              </button>
            </div>
          </div>
        </div>

      </div>

      {/* 60-Minute Latency Trend Telemetry Chart */}
      <div className="mt-5 bg-zinc-950/60 border border-zinc-850/80 rounded-xl p-4.5 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <span className="text-[9px] font-mono font-black text-red-500 uppercase tracking-widest block">
              Historical Diagnostics Panel
            </span>
            <h4 className="text-xs font-bold text-zinc-100 mt-0.5">
              60-Minute Latency Trend Telemetry
            </h4>
          </div>
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex flex-wrap items-center gap-4 text-[9px] font-mono text-zinc-500">
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-red-500"></span>
                <span>Gemini Latency (L)</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-indigo-500"></span>
                <span>Veo Synthesis (R)</span>
              </div>
              
              {/* Anomaly Badge */}
              {isAnomalyDetectionEnabled ? (
                geminiAnomalyCount > 0 || veoAnomalyCount > 0 ? (
                  <div className="flex items-center gap-1.5 text-red-400 font-bold bg-red-500/10 border border-red-500/20 px-2 py-0.5 rounded-lg animate-pulse sm:ml-2">
                    <AlertTriangle size={10} className="text-red-500 shrink-0" />
                    <span>Spikes: {geminiAnomalyCount + veoAnomalyCount} flagged (&gt;2σ)</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-1.5 text-green-400 font-medium bg-green-500/5 border border-green-500/10 px-2 py-0.5 rounded-lg sm:ml-2">
                    <ShieldCheck size={10} className="text-green-500 shrink-0" />
                    <span>No Spikes Detected</span>
                  </div>
                )
              ) : (
                <div className="flex items-center gap-1.5 text-zinc-500 font-medium bg-zinc-950 border border-zinc-850 px-2 py-0.5 rounded-lg sm:ml-2">
                  <span>Guard Paused</span>
                </div>
              )}
            </div>
            
            <button
              onClick={exportTrendToCSV}
              className="flex items-center gap-1.5 px-2.5 py-1 border border-zinc-800 bg-zinc-900 hover:bg-zinc-850 text-zinc-350 hover:text-white rounded-lg text-[9.5px] font-mono font-bold uppercase transition-all shadow-sm cursor-pointer"
              title="Export trend dataset to CSV for external analytical modeling"
            >
              <Download size={11} className="text-red-500" />
              <span>Export CSV</span>
            </button>

            <button
              onClick={exportAlertsToJSON}
              className="flex items-center gap-1.5 px-2.5 py-1 border border-zinc-800 bg-zinc-900 hover:bg-zinc-850 text-zinc-350 hover:text-white rounded-lg text-[9.5px] font-mono font-bold uppercase transition-all shadow-sm cursor-pointer"
              title="Export triggered incident alert events log to JSON for automated reporting"
            >
              <BellRing size={11} className="text-indigo-400" />
              <span>Export Alerts JSON</span>
            </button>
          </div>
        </div>

        <div className="w-full h-44">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart
              data={analyzedTrendData}
              margin={{ top: 10, right: 5, left: -20, bottom: 0 }}
            >
              <defs>
                <linearGradient id="colorGemini" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={isMockActive ? "#f59e0b" : "#ef4444"} stopOpacity={0.2}/>
                  <stop offset="95%" stopColor={isMockActive ? "#f59e0b" : "#ef4444"} stopOpacity={0}/>
                </linearGradient>
                <linearGradient id="colorVeo" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={isMockActive ? "#f59e0b" : "#6366f1"} stopOpacity={0.2}/>
                  <stop offset="95%" stopColor={isMockActive ? "#f59e0b" : "#6366f1"} stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#1f1f23" vertical={false} />
              <XAxis 
                dataKey="minute" 
                stroke="#52525b" 
                fontSize={8} 
                fontFamily="JetBrains Mono" 
                tickLine={false} 
                axisLine={false}
                interval={9}
              />
              <YAxis 
                yAxisId="left"
                stroke={isMockActive ? "#f59e0b" : "#ef4444"} 
                fontSize={8} 
                fontFamily="JetBrains Mono" 
                tickLine={false} 
                axisLine={false}
                tickFormatter={(val) => `${val}ms`}
              />
              <YAxis 
                yAxisId="right"
                orientation="right"
                stroke={isMockActive ? "#f59e0b" : "#6366f1"} 
                fontSize={8} 
                fontFamily="JetBrains Mono" 
                tickLine={false} 
                axisLine={false}
                tickFormatter={(val) => `${(val / 1000).toFixed(1)}s`}
              />
              <Tooltip
                content={({ active, payload, label }) => {
                  if (active && payload && payload.length) {
                    const data = payload[0].payload;
                    return (
                      <div className="bg-zinc-950/95 border border-zinc-800 p-2.5 rounded-lg shadow-xl font-mono text-[9px] space-y-1.5 relative z-30 min-w-[160px]">
                        <p className="text-zinc-400 font-black tracking-wider border-b border-zinc-850 pb-1 mb-1">{label}</p>
                        
                        {/* Gemini Block */}
                        <div className="space-y-0.5">
                          <p className="text-red-400 flex items-center justify-between gap-4">
                            <span>Gemini:</span>
                            <span className="text-white font-black">{data.gemini} ms</span>
                          </p>
                          {isAnomalyDetectionEnabled && data.isGeminiAnomalous && (
                            <p className="text-[7.5px] text-red-400 font-bold bg-red-500/10 px-1 py-0.5 rounded border border-red-500/20 flex items-center gap-1">
                              <AlertTriangle size={8} className="shrink-0 text-red-500 animate-pulse" />
                              SPIKE DETECTED (&gt;2 σ)
                            </p>
                          )}
                        </div>

                        {/* Veo Block */}
                        {payload[1] && (
                          <div className="space-y-0.5 pt-1.5 border-t border-zinc-850">
                            <p className="text-indigo-400 flex items-center justify-between gap-4">
                              <span>Veo:</span>
                              <span className="text-white font-black">{data.veo} ms</span>
                            </p>
                            {isAnomalyDetectionEnabled && data.isVeoAnomalous && (
                              <p className="text-[7.5px] text-purple-400 font-bold bg-purple-500/10 px-1 py-0.5 rounded border border-purple-500/20 flex items-center gap-1">
                                <AlertTriangle size={8} className="shrink-0 text-purple-400 animate-pulse" />
                                SPIKE DETECTED (&gt;2 σ)
                              </p>
                            )}
                          </div>
                        )}
                        
                        {isAnomalyDetectionEnabled && (data.isGeminiAnomalous || data.isVeoAnomalous) && (
                          <div className="pt-1.5 border-t border-zinc-850 text-[7.5px] text-zinc-500 leading-normal space-y-0.5">
                            {data.isGeminiAnomalous && (
                              <div>
                                <span className="text-zinc-400">Gemini MA:</span> {Math.round(data.geminiMean)}ms
                                <span className="text-zinc-400 ml-1.5">σ:</span> {Math.round(data.geminiStdDev)}ms
                              </div>
                            )}
                            {data.isVeoAnomalous && (
                              <div>
                                <span className="text-zinc-400">Veo MA:</span> {Math.round(data.veoMean)}ms
                                <span className="text-zinc-400 ml-1.5">σ:</span> {Math.round(data.veoStdDev)}ms
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <ReferenceLine 
                yAxisId="left" 
                y={geminiThreshold} 
                stroke={isMockActive ? "#f59e0b" : "#ef4444"} 
                strokeWidth={1}
                strokeDasharray="4 4" 
                label={{ 
                  value: `Gemini Alert Limit: ${geminiThreshold}ms`, 
                  fill: isMockActive ? '#f59e0b' : '#ef4444', 
                  fontSize: 7, 
                  fontFamily: 'JetBrains Mono', 
                  position: 'insideTopLeft' 
                }} 
              />
              <ReferenceLine 
                yAxisId="right" 
                y={veoThreshold} 
                stroke={isMockActive ? "#f59e0b" : "#6366f1"} 
                strokeWidth={1}
                strokeDasharray="4 4" 
                label={{ 
                  value: `Veo Alert Limit: ${(veoThreshold / 1000).toFixed(1)}s`, 
                  fill: isMockActive ? '#f59e0b' : '#6366f1', 
                  fontSize: 7, 
                  fontFamily: 'JetBrains Mono', 
                  position: 'insideTopRight' 
                }} 
              />
              <Area 
                yAxisId="left"
                type="monotone" 
                dataKey="gemini" 
                stroke={isMockActive ? "#f59e0b" : "#ef4444"} 
                strokeWidth={1.5}
                fillOpacity={1} 
                fill="url(#colorGemini)" 
                dot={renderAnomalyDot(true)}
              />
              <Area 
                yAxisId="right"
                type="monotone" 
                dataKey="veo" 
                stroke={isMockActive ? "#f59e0b" : "#6366f1"} 
                strokeWidth={1.5}
                fillOpacity={1} 
                fill="url(#colorVeo)" 
                dot={renderAnomalyDot(false)}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
        <p className="text-[8px] font-mono text-zinc-500 leading-normal">
          * Notice the latency degradation wave visible between <span className="text-zinc-400">30m ago</span> and <span className="text-zinc-400">15m ago</span>, simulating realistic periodic backpressure in GCP gateway routing or heavy visual GPU queue wait states.
        </p>
      </div>

      {/* Footer warning helper */}
      <div className="mt-5 bg-zinc-950 border border-zinc-850 p-3.5 rounded-xl flex items-center gap-2.5">
        <div className={`p-1.5 rounded-lg shrink-0 ${isMockActive ? 'bg-amber-500/10 text-amber-400' : 'bg-red-500/10 text-red-400'}`}>
          {isMockActive ? <CheckCircle2 size={13} /> : <AlertTriangle size={13} />}
        </div>
        <p className="text-[9.5px] text-zinc-400 leading-relaxed">
          {isMockActive ? (
            <span><strong>Sandbox Routing Enabled.</strong> Standard API keys are protected and not charged. Standard template vectors are served in <span className="font-mono text-amber-400 text-[10px]">~15ms</span> latency.</span>
          ) : (
            <span><strong>Live Pipeline active.</strong> Outbound model requests will charge credentials directly and run through full GCP endpoints. Expect varying network queue latencies.</span>
          )}
        </p>
      </div>

      {/* API Documentation Modal */}
      {selectedDocEndpoint && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 md:p-6 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-[#09090b] border border-zinc-800 w-full max-w-2xl rounded-2xl overflow-hidden flex flex-col shadow-2xl animate-in zoom-in-95 duration-200 text-sans max-h-[90vh]">
            
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-zinc-850 bg-zinc-950/40 p-5">
              <div className="flex items-center gap-3">
                <div className={`w-2.5 h-2.5 rounded-full animate-pulse ${
                  selectedDocEndpoint === 'gemini' ? 'bg-red-500' : 'bg-indigo-500'
                }`}></div>
                <div>
                  <h4 className="text-sm font-black text-white uppercase tracking-wider font-sans">
                    {selectedDocEndpoint === 'gemini' ? 'Gemini Orchestration Docs' : 'Veo Synthesis API Docs'}
                  </h4>
                  <span className="text-[9px] font-mono text-zinc-500 block mt-0.5 uppercase tracking-widest">
                    {selectedDocEndpoint === 'gemini' ? 'Cognitive core integration schema' : 'High fidelity temporal render matrix'}
                  </span>
                </div>
              </div>
              <button
                onClick={() => setSelectedDocEndpoint(null)}
                className="p-1.5 rounded-lg border border-zinc-850 hover:border-zinc-750 bg-zinc-900 text-zinc-400 hover:text-white transition cursor-pointer"
                title="Close Documentation"
              >
                <X size={14} />
              </button>
            </div>

            {/* Modal Body (Scrollable) */}
            <div className="p-6 overflow-y-auto space-y-6 text-zinc-300">
              
              {/* Endpoint Address bar */}
              <div className="bg-zinc-950 border border-zinc-900 rounded-xl p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 font-mono text-[10px]">
                <div className="flex items-center gap-2">
                  <span className="bg-red-500/10 text-red-400 font-black px-2 py-0.5 rounded border border-red-500/20 text-[9px]">
                    POST
                  </span>
                  <span className="text-zinc-200 font-bold select-all">
                    {selectedDocEndpoint === 'gemini' 
                      ? 'https://api.ranktica.ai/v1/gemini/orchestration' 
                      : 'https://api.ranktica.ai/v1/veo/synthesis'
                    }
                  </span>
                </div>
                <button
                  onClick={() => {
                    const url = selectedDocEndpoint === 'gemini' 
                      ? 'https://api.ranktica.ai/v1/gemini/orchestration' 
                      : 'https://api.ranktica.ai/v1/veo/synthesis';
                    navigator.clipboard.writeText(url);
                    toast.success('Endpoint URL copied!');
                  }}
                  className="px-2.5 py-1 border border-zinc-800 hover:border-zinc-750 bg-zinc-900 hover:bg-zinc-850 text-zinc-400 hover:text-white rounded-md text-[9px] font-mono transition flex items-center gap-1.5 cursor-pointer"
                >
                  <Copy size={10} />
                  <span>Copy URL</span>
                </button>
              </div>

              {/* Description */}
              <div className="space-y-1.5">
                <span className="text-[9px] font-mono font-black text-red-500 uppercase tracking-widest block">
                  Service Overview
                </span>
                <p className="text-xs text-zinc-400 leading-relaxed font-sans font-medium">
                  {selectedDocEndpoint === 'gemini' 
                    ? 'Synthesize viral content concepts, optimize YouTube retention curves, and coordinate cross-agent workflows. The Gemini Orchestration service evaluates Blue Ocean gap trends to output CTR-optimized conceptual graphs dynamically.'
                    : 'Render high-fidelity video temporal segments, rate storyboard compositions, and generate dynamic frame sequences. The Veo Synthesis API is optimized for high-velocity visual cue density injection and advanced compositing pipelines.'
                  }
                </p>
              </div>

              {/* Request Headers */}
              <div className="space-y-2">
                <span className="text-[9px] font-mono font-black text-red-500 uppercase tracking-widest block">
                  Required Authentication & Headers
                </span>
                <div className="bg-zinc-950/80 border border-zinc-900 rounded-xl p-3.5 space-y-2 font-mono text-[9px]">
                  <div className="flex justify-between border-b border-zinc-900 pb-1.5 text-zinc-400">
                    <span>Header Key</span>
                    <span>Value / Format</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-zinc-500">Authorization</span>
                    <span className="text-zinc-200">Bearer &lt;YOUR_{selectedDocEndpoint === 'gemini' ? 'GEMINI' : 'VEO'}_API_KEY&gt;</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-zinc-500">Content-Type</span>
                    <span className="text-zinc-200">application/json</span>
                  </div>
                </div>
              </div>

              {/* Request Parameters Table */}
              <div className="space-y-2">
                <span className="text-[9px] font-mono font-black text-red-500 uppercase tracking-widest block">
                  Payload Parameter Specification
                </span>
                <div className="border border-zinc-900 rounded-xl overflow-hidden font-mono text-[9.5px]">
                  <div className="grid grid-cols-4 bg-zinc-950 text-zinc-400 font-bold p-3 border-b border-zinc-900">
                    <div>Parameter</div>
                    <div>Type</div>
                    <div>Required</div>
                    <div>Description</div>
                  </div>
                  
                  {selectedDocEndpoint === 'gemini' ? (
                    <div className="divide-y divide-zinc-900 bg-zinc-950/30">
                      <div className="grid grid-cols-4 p-3 items-start">
                        <div className="text-zinc-200 font-bold">prompt</div>
                        <div className="text-red-400">string</div>
                        <div className="text-red-500 font-black">REQUIRED</div>
                        <div className="text-zinc-400 leading-normal">Core brainstorm topic or viral thesis.</div>
                      </div>
                      <div className="grid grid-cols-4 p-3 items-start">
                        <div className="text-zinc-200 font-bold">voicePreset</div>
                        <div className="text-zinc-400">string</div>
                        <div className="text-zinc-500 font-medium">OPTIONAL</div>
                        <div className="text-zinc-400 leading-normal">Voice config preset: <span className="text-zinc-300">"Zephyr" | "Charon"</span>.</div>
                      </div>
                      <div className="grid grid-cols-4 p-3 items-start">
                        <div className="text-zinc-200">enableLinguisticVelocity</div>
                        <div className="text-zinc-400">boolean</div>
                        <div className="text-zinc-500 font-medium">OPTIONAL</div>
                        <div className="text-zinc-400 leading-normal">Optimizes cognitive interest pacing. Default true.</div>
                      </div>
                      <div className="grid grid-cols-4 p-3 items-start">
                        <div className="text-zinc-200">maxTokens</div>
                        <div className="text-zinc-400">integer</div>
                        <div className="text-zinc-500 font-medium">OPTIONAL</div>
                        <div className="text-zinc-400 leading-normal">Cap output size. Defaults to 2048.</div>
                      </div>
                    </div>
                  ) : (
                    <div className="divide-y divide-zinc-900 bg-zinc-950/30">
                      <div className="grid grid-cols-4 p-3 items-start">
                        <div className="text-zinc-200 font-bold">prompt</div>
                        <div className="text-indigo-400">string</div>
                        <div className="text-red-500 font-black">REQUIRED</div>
                        <div className="text-zinc-400 leading-normal">Storyboard scenario or frame composition query.</div>
                      </div>
                      <div className="grid grid-cols-4 p-3 items-start">
                        <div className="text-zinc-200 font-bold">aspectRatio</div>
                        <div className="text-zinc-400">string</div>
                        <div className="text-zinc-500 font-medium">OPTIONAL</div>
                        <div className="text-zinc-400 leading-normal">Ratio: <span className="text-zinc-300">"16:9" | "9:16" | "1:1"</span>. Default "16:9".</div>
                      </div>
                      <div className="grid grid-cols-4 p-3 items-start">
                        <div className="text-zinc-200">fidelityLevel</div>
                        <div className="text-zinc-400">string</div>
                        <div className="text-zinc-500 font-medium">OPTIONAL</div>
                        <div className="text-zinc-400 leading-normal">Preset details: <span className="text-zinc-300">"cinematic" | "ultra"</span>.</div>
                      </div>
                      <div className="grid grid-cols-4 p-3 items-start">
                        <div className="text-zinc-200">frameCount</div>
                        <div className="text-zinc-400">integer</div>
                        <div className="text-zinc-500 font-medium">OPTIONAL</div>
                        <div className="text-zinc-400 leading-normal">Number of frames. Default 1. Max 60.</div>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Playbook / Interactive Code Snippet Tabs */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[9px] font-mono font-black text-red-500 uppercase tracking-widest block">
                    Developer Playbook Code Snippets
                  </span>
                  
                  {/* Lang Selector Tabs */}
                  <div className="flex bg-zinc-950 p-0.5 rounded-lg border border-zinc-900 font-mono text-[8px]">
                    <button
                      onClick={() => setPlaybookLang('curl')}
                      className={`px-2 py-1 rounded-md transition cursor-pointer ${
                        playbookLang === 'curl' 
                          ? 'bg-zinc-800 text-white font-bold' 
                          : 'text-zinc-500 hover:text-zinc-300'
                      }`}
                    >
                      cURL
                    </button>
                    <button
                      onClick={() => setPlaybookLang('node')}
                      className={`px-2 py-1 rounded-md transition cursor-pointer ${
                        playbookLang === 'node' 
                          ? 'bg-zinc-800 text-white font-bold' 
                          : 'text-zinc-500 hover:text-zinc-300'
                      }`}
                    >
                      Node.js
                    </button>
                    <button
                      onClick={() => setPlaybookLang('python')}
                      className={`px-2 py-1 rounded-md transition cursor-pointer ${
                        playbookLang === 'python' 
                          ? 'bg-zinc-800 text-white font-bold' 
                          : 'text-zinc-500 hover:text-zinc-300'
                      }`}
                    >
                      Python
                    </button>
                  </div>
                </div>

                {/* Code Terminal Box */}
                <div className="bg-[#030303] border border-zinc-900 rounded-xl overflow-hidden font-mono text-[9px] relative group">
                  
                  {/* Top Bar */}
                  <div className="flex items-center justify-between px-4 py-2 border-b border-zinc-950 bg-zinc-950/60">
                    <span className="text-zinc-500 select-none">
                      {playbookLang === 'curl' ? 'Terminal (bash)' : playbookLang === 'node' ? 'javascript' : 'python'}
                    </span>
                    <button
                      onClick={() => {
                        const snippet = selectedDocEndpoint === 'gemini' 
                          ? (playbookLang === 'curl' 
                              ? `curl -X POST https://api.ranktica.ai/v1/gemini/orchestration \\\n  -H "Authorization: Bearer $GEMINI_API_KEY" \\\n  -H "Content-Type: application/json" \\\n  -d '{\n    "prompt": "Optimize retention curves for short-form visual content.",\n    "voicePreset": "Zephyr",\n    "enableLinguisticVelocity": true\n  }'`
                              : playbookLang === 'node'
                              ? `const response = await fetch('https://api.ranktica.ai/v1/gemini/orchestration', {\n  method: 'POST',\n  headers: {\n    'Authorization': \`Bearer \${process.env.GEMINI_API_KEY}\`,\n    'Content-Type': 'application/json'\n  },\n  body: JSON.stringify({\n    prompt: "Optimize retention curves for short-form visual content.",\n    voicePreset: "Zephyr",\n    enableLinguisticVelocity: true\n  })\n});\nconst data = await response.json();\nconsole.log(data);`
                              : `import os\nimport requests\n\nresponse = requests.post(\n    "https://api.ranktica.ai/v1/gemini/orchestration",\n    headers={\n        "Authorization": f"Bearer {os.environ.get('GEMINI_API_KEY')}",\n        "Content-Type": "application/json"\n    },\n    json={\n        "prompt": "Optimize retention curves for short-form visual content.",\n        "voicePreset": "Zephyr",\n        "enableLinguisticVelocity": True\n    }\n)\ndata = response.json()\nprint(data)`
                            )
                          : (playbookLang === 'curl' 
                              ? `curl -X POST https://api.ranktica.ai/v1/veo/synthesis \\\n  -H "Authorization: Bearer $VEO_API_KEY" \\\n  -H "Content-Type: application/json" \\\n  -d '{\n    "prompt": "Cinematic visual transition, 60fps high visual density.",\n    "aspectRatio": "16:9",\n    "frameCount": 24\n  }'`
                              : playbookLang === 'node'
                              ? `const response = await fetch('https://api.ranktica.ai/v1/veo/synthesis', {\n  method: 'POST',\n  headers: {\n    'Authorization': \`Bearer \${process.env.VEO_API_KEY}\`,\n    'Content-Type': 'application/json'\n  },\n  body: JSON.stringify({\n    prompt: "Cinematic visual transition, 60fps high visual density.",\n    aspectRatio: "16:9",\n    frameCount: 24\n  })\n});\nconst data = await response.json();\nconsole.log(data);`
                              : `import os\nimport requests\n\nresponse = requests.post(\n    "https://api.ranktica.ai/v1/veo/synthesis",\n    headers={\n        "Authorization": f"Bearer {os.environ.get('VEO_API_KEY')}",\n        "Content-Type": "application/json"\n    },\n    json={\n        "prompt": "Cinematic visual transition, 60fps high visual density.",\n        "aspectRatio": "16:9",\n        "frameCount": 24\n    }\n)\ndata = response.json()\nprint(data)`
                            );
                        navigator.clipboard.writeText(snippet);
                        toast.success('Snippet copied to clipboard!');
                      }}
                      className="text-zinc-500 hover:text-white transition flex items-center gap-1 cursor-pointer bg-zinc-900 border border-zinc-850 hover:border-zinc-700 px-2 py-0.5 rounded"
                    >
                      <Copy size={9} />
                      <span>Copy Code</span>
                    </button>
                  </div>

                  {/* Terminal Text */}
                  <pre className="p-4 overflow-x-auto text-zinc-300 leading-relaxed font-mono">
                    {selectedDocEndpoint === 'gemini' ? (
                      playbookLang === 'curl' ? (
                        <span>
                          <span className="text-zinc-500">$</span> curl -X POST https://api.ranktica.ai/v1/gemini/orchestration \<br />
                          {"  "}-H <span className="text-green-400">"Authorization: Bearer $GEMINI_API_KEY"</span> \<br />
                          {"  "}-H <span className="text-green-400">"Content-Type: application/json"</span> \<br />
                          {"  "}-d <span className="text-indigo-400">{"'{\n    \"prompt\": \"Optimize retention curves for short-form visual content.\",\n    \"voicePreset\": \"Zephyr\",\n    \"enableLinguisticVelocity\": true\n  }'"}</span>
                        </span>
                      ) : playbookLang === 'node' ? (
                        <span>
                          <span className="text-red-400">const</span> response = <span className="text-red-400">await</span> fetch(<span className="text-green-400">'https://api.ranktica.ai/v1/gemini/orchestration'</span>, {"{"}<br />
                          {"  "}method: <span className="text-green-400">'POST'</span>,<br />
                          {"  "}headers: {"{"}<br />
                          {"    "}<span className="text-green-400">'Authorization'</span>: <span className="text-green-400">`Bearer \${process.env.GEMINI_API_KEY}`</span>,<br />
                          {"    "}<span className="text-green-400">'Content-Type'</span>: <span className="text-green-400">'application/json'</span><br />
                          {"  "}{"}"},<br />
                          {"  "}body: JSON.stringify({"{"}<br />
                          {"    "}prompt: <span className="text-green-400">"Optimize retention curves for short-form visual content."</span>,<br />
                          {"    "}voicePreset: <span className="text-green-400">"Zephyr"</span>,<br />
                          {"    "}enableLinguisticVelocity: <span className="text-indigo-400">true</span><br />
                          {"  "}{"}"})<br />
                          {"}"});<br />
                          <span className="text-red-400">const</span> data = <span className="text-red-400">await</span> response.json();<br />
                          console.log(data);
                        </span>
                      ) : (
                        <span>
                          <span className="text-red-400">import</span> os<br />
                          <span className="text-red-400">import</span> requests<br /><br />
                          response = requests.post(<br />
                          {"    "}<span className="text-green-400">"https://api.ranktica.ai/v1/gemini/orchestration"</span>,<br />
                          {"    "}headers={"{"}<br />
                          {"        "}<span className="text-green-400">"Authorization"</span>: <span className="text-green-400">{"f\"Bearer {os.environ.get('GEMINI_API_KEY')}\""}</span>,<br />
                          {"        "}<span className="text-green-400">"Content-Type"</span>: <span className="text-green-400">"application/json"</span><br />
                          {"    "}{"}"},<br />
                          {"    "}json={"{"}<br />
                          {"        "}<span className="text-green-400">"prompt"</span>: <span className="text-green-400">"Optimize retention curves for short-form visual content."</span>,<br />
                          {"        "}<span className="text-green-400">"voicePreset"</span>: <span className="text-green-400">"Zephyr"</span>,<br />
                          {"        "}<span className="text-green-400">"enableLinguisticVelocity"</span>: <span className="text-indigo-400">True</span><br />
                          {"    "}{"}"}<br />
                          )<br />
                          data = response.json()<br />
                          print(data)
                        </span>
                      )
                    ) : (
                      playbookLang === 'curl' ? (
                        <span>
                          <span className="text-zinc-500">$</span> curl -X POST https://api.ranktica.ai/v1/veo/synthesis \<br />
                          {"  "}-H <span className="text-green-400">"Authorization: Bearer $VEO_API_KEY"</span> \<br />
                          {"  "}-H <span className="text-green-400">"Content-Type: application/json"</span> \<br />
                          {"  "}-d <span className="text-indigo-400">{"'{\n    \"prompt\": \"Cinematic visual transition, 60fps high visual density.\",\n    \"aspectRatio\": \"16:9\",\n    \"frameCount\": 24\n  }'"}</span>
                        </span>
                      ) : playbookLang === 'node' ? (
                        <span>
                          <span className="text-red-400">const</span> response = <span className="text-red-400">await</span> fetch(<span className="text-green-400">'https://api.ranktica.ai/v1/veo/synthesis'</span>, {"{"}<br />
                          {"  "}method: <span className="text-green-400">'POST'</span>,<br />
                          {"  "}headers: {"{"}<br />
                          {"    "}<span className="text-green-400">'Authorization'</span>: <span className="text-green-400">`Bearer \${process.env.VEO_API_KEY}`</span>,<br />
                          {"    "}<span className="text-green-400">'Content-Type'</span>: <span className="text-green-400">'application/json'</span><br />
                          {"  "}{"}"},<br />
                          {"  "}body: JSON.stringify({"{"}<br />
                          {"    "}prompt: <span className="text-green-400">"Cinematic visual transition, 60fps high visual density."</span>,<br />
                          {"    "}aspectRatio: <span className="text-green-400">"16:9"</span>,<br />
                          {"    "}frameCount: <span className="text-indigo-400">24</span><br />
                          {"  "}{"}"})<br />
                          {"}"});<br />
                          <span className="text-red-400">const</span> data = <span className="text-red-400">await</span> response.json();<br />
                          console.log(data);
                        </span>
                      ) : (
                        <span>
                          <span className="text-red-400">import</span> os<br />
                          <span className="text-red-400">import</span> requests<br /><br />
                          response = requests.post(<br />
                          {"    "}<span className="text-green-400">"https://api.ranktica.ai/v1/veo/synthesis"</span>,<br />
                          {"    "}headers={"{"}<br />
                          {"        "}<span className="text-green-400">"Authorization"</span>: <span className="text-green-400">{"f\"Bearer {os.environ.get('VEO_API_KEY')}\""}</span>,<br />
                          {"        "}<span className="text-green-400">"Content-Type"</span>: <span className="text-green-400">"application/json"</span><br />
                          {"    "}{"}"},<br />
                          {"    "}json={"{"}<br />
                          {"        "}<span className="text-green-400">"prompt"</span>: <span className="text-green-400">"Cinematic visual transition, 60fps high visual density."</span>,<br />
                          {"        "}<span className="text-green-400">"aspectRatio"</span>: <span className="text-green-400">"16:9"</span>,<br />
                          {"        "}<span className="text-green-400">"frameCount"</span>: <span className="text-indigo-400">24</span><br />
                          {"    "}{"}"}<br />
                          )<br />
                          data = response.json()<br />
                          print(data)
                        </span>
                      )
                    )}
                  </pre>
                </div>
              </div>

              {/* Response Block */}
              <div className="space-y-2">
                <span className="text-[9px] font-mono font-black text-red-500 uppercase tracking-widest block">
                  Example Response Payload (JSON 200 OK)
                </span>
                <div className="bg-[#030303] border border-zinc-900 rounded-xl p-4 overflow-x-auto font-mono text-[9px] leading-relaxed text-zinc-350">
                  {selectedDocEndpoint === 'gemini' ? (
                    <pre>{`{\n  "status": "success",\n  "latency_ms": 315,\n  "synthesis": {\n    "raw": "Optimized YouTube brainstorm schema successfully built.",\n    "linguisticVelocity": 4.82,\n    "estimatedCtr": "8.4%",\n    "blueOceanGapRank": 1\n  }\n}`}</pre>
                  ) : (
                    <pre>{`{\n  "status": "success",\n  "latency_ms": 4250,\n  "frames": [\n    {\n      "url": "https://cdn.ranktica.ai/frames/f_8d2f1s.png",\n      "fidelityScore": 0.96,\n      "visualDensity": 7.4\n    }\n  ]\n}`}</pre>
                  )}
                </div>
              </div>

            </div>

            {/* Modal Footer */}
            <div className="border-t border-zinc-850 bg-zinc-950/60 p-5 flex items-center justify-between font-mono text-[8px] text-zinc-500">
              <span className="uppercase tracking-widest">
                Ranktica telemetry sandbox integration
              </span>
              <button
                onClick={() => setSelectedDocEndpoint(null)}
                className="px-4 py-2 bg-zinc-900 border border-zinc-800 hover:border-zinc-700 text-zinc-300 hover:text-white rounded-lg text-[9.5px] font-bold uppercase transition cursor-pointer"
              >
                Close Portal
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};
