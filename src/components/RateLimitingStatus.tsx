import React, { useState, useEffect } from 'react';
import { 
  ShieldAlert, 
  RefreshCw, 
  Zap, 
  HelpCircle, 
  CheckCircle, 
  AlertTriangle,
  Flame,
  Gauge
} from 'lucide-react';
import { toast } from 'react-hot-toast';

interface RadialProgressProps {
  percentage: number;
  size?: number;
  strokeWidth?: number;
  color: string;
  label: string;
  subLabel: string;
}

const RadialProgress: React.FC<RadialProgressProps> = ({
  percentage,
  size = 120,
  strokeWidth = 10,
  color,
  label,
  subLabel
}) => {
  const radius = size / 2;
  const normalizedRadius = radius - strokeWidth;
  const circumference = normalizedRadius * 2 * Math.PI;
  const strokeDashoffset = circumference - (Math.min(100, Math.max(0, percentage)) / 100) * circumference;

  return (
    <div className="flex flex-col items-center justify-center space-y-2 p-2">
      <div className="relative" style={{ width: size, height: size }}>
        <svg
          height={size}
          width={size}
          className="transform -rotate-90"
        >
          {/* Background circle track */}
          <circle
            stroke="#18181b" // zinc-900
            fill="transparent"
            strokeWidth={strokeWidth}
            r={normalizedRadius}
            cx={radius}
            cy={radius}
          />
          {/* Progress circle track */}
          <circle
            stroke={color}
            fill="transparent"
            strokeWidth={strokeWidth}
            strokeDasharray={`${circumference} ${circumference}`}
            style={{ strokeDashoffset }}
            strokeLinecap="round"
            r={normalizedRadius}
            cx={radius}
            cy={radius}
            className="transition-all duration-700 ease-out"
          />
        </svg>
        {/* Inner centered text */}
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
          <span className="text-xl font-black text-white font-mono leading-none">
            {Math.round(percentage)}%
          </span>
          <span className="text-[8px] font-mono font-bold text-zinc-500 uppercase tracking-wider mt-1">
            consumed
          </span>
        </div>
      </div>
      <div className="text-center">
        <h5 className="text-xs font-bold text-zinc-200 font-sans">{label}</h5>
        <p className="text-[9px] text-zinc-500 font-mono mt-0.5">{subLabel}</p>
      </div>
    </div>
  );
};

export const RateLimitingStatus: React.FC = () => {
  // Quota usage metrics state
  const [geminiPercent, setGeminiPercent] = useState(68);
  const [veoPercent, setVeoPercent] = useState(42);
  const [activeTier, setActiveTier] = useState<'Enterprise X1' | 'Scale Limit X2'>('Enterprise X1');
  const [secondsToReset, setSecondsToReset] = useState(48);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isMockActive, setIsMockActive] = useState(false);

  // Fetch initial mock-mode state from the backend
  useEffect(() => {
    fetch('/api/dev/mock-mode')
      .then(res => res.json())
      .then(data => {
        if (data && typeof data.enabled === 'boolean') {
          setIsMockActive(data.enabled);
        }
      })
      .catch(err => console.error('[RateLimitingStatus] Error fetching mock mode:', err));
  }, []);

  // Fluctuations & live ticking of quota state
  useEffect(() => {
    const interval = setInterval(() => {
      setGeminiPercent(prev => {
        // Random drift -0.8% to +1.2%
        const drift = (Math.random() * 2) - 0.8;
        return Math.max(20, Math.min(99, Number((prev + drift).toFixed(1))));
      });

      setVeoPercent(prev => {
        // Random drift -0.5% to +0.8%
        const drift = (Math.random() * 1.3) - 0.5;
        return Math.max(10, Math.min(95, Number((prev + drift).toFixed(1))));
      });

      setSecondsToReset(prev => {
        if (prev <= 1) return 60;
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const handleSimulatePeakLoad = () => {
    if (isMockActive) {
      toast('⚠️ Cannot simulate peak load on live quota while Mock Mode is Active.', {
        icon: '🚫',
        style: {
          borderRadius: '12px',
          background: '#09090b',
          color: '#f4f4f5',
          border: '1px solid #f59e0b'
        }
      });
      return;
    }
    setGeminiPercent(prev => Math.min(98, prev + 15));
    setVeoPercent(prev => Math.min(92, prev + 25));
    toast('⚡ Simulating Peak Outbound Orchestration Pipeline Traffic. Quotas spike!', {
      icon: '🔥',
      style: {
        borderRadius: '12px',
        background: '#09090b',
        color: '#f4f4f5',
        border: '1px solid #e11d48'
      }
    });
  };

  const handleOptimizeRouting = () => {
    if (isMockActive) {
      toast('⚠️ Route optimization is automatically active during Mock Mode.', {
        icon: '💡',
        style: {
          borderRadius: '12px',
          background: '#09090b',
          color: '#f4f4f5',
          border: '1px solid #6366f1'
        }
      });
      return;
    }
    setIsRefreshing(true);
    setTimeout(() => {
      setGeminiPercent(prev => Math.max(30, prev - 20));
      setVeoPercent(prev => Math.max(20, prev - 15));
      setIsRefreshing(false);
      toast.success('🛡️ Switched routing to local Redis-cached tokens. Direct hit quota utilization minimized by 20%!');
    }, 1000);
  };

  const handleToggleMockMode = async () => {
    try {
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
          toast.success('🛡️ Developer Mock Mode Active. Gemini and Veo APIs are now intercepted and mocked locally!');
        } else {
          toast('⚡ Mock Mode Deactivated. Returning to Live Gemini and Veo API pipelines.', {
            icon: '🛰️',
            style: {
              borderRadius: '12px',
              background: '#09090b',
              color: '#f4f4f5',
              border: '1px solid #6366f1'
            }
          });
        }
      }
    } catch (err) {
      console.error('[RateLimitingStatus] Failed to toggle mock mode:', err);
      toast.error('Failed to update mock mode on the server.');
    }
  };

  const activeGeminiPercent = isMockActive ? 0 : geminiPercent;
  const activeVeoPercent = isMockActive ? 0 : veoPercent;

  const isGeminiWarning = activeGeminiPercent >= 85;
  const isVeoWarning = activeVeoPercent >= 85;

  return (
    <div id="rate-limiting-indicator-card" className="bg-[#121214] border border-zinc-800 rounded-2xl p-6 relative overflow-hidden h-full flex flex-col justify-between">
      {/* Background ambient lighting */}
      <div className="absolute top-0 right-0 w-48 h-48 bg-red-600/[0.02] rounded-full blur-3xl"></div>
      <div className="absolute bottom-0 left-0 w-48 h-48 bg-indigo-600/[0.02] rounded-full blur-3xl"></div>

      <div className="space-y-6 relative z-10">
        {/* Widget Header */}
        <div className="border-b border-zinc-850 pb-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-extrabold text-white flex items-center gap-2 font-sans">
              <Gauge className="text-red-500 animate-pulse" size={18} />
              API Rate Limiting Status
            </h3>
            <span className={`text-[8px] font-mono font-black uppercase border px-2.5 py-1 rounded-full ${
              isMockActive 
                ? 'bg-amber-500/20 text-amber-400 border-amber-500/30' 
                : 'bg-zinc-950 text-zinc-400 border-zinc-800'
            }`}>
              {isMockActive ? 'SANDBOX DEV' : activeTier}
            </span>
          </div>
          <p className="text-[10px] text-zinc-500 mt-1 font-sans">
            Real-time visual monitoring of transactional rate limiter quotas. Window updates automatically.
          </p>
        </div>

        {/* Mock Mode Simulation Switch */}
        <div className="bg-zinc-950/80 border border-zinc-850 rounded-xl p-4 flex items-center justify-between">
          <div className="space-y-0.5">
            <span className="text-[10px] font-mono font-bold text-zinc-400 uppercase tracking-wider flex items-center gap-1.5">
              <span className={`inline-block w-2 h-2 rounded-full ${isMockActive ? 'bg-amber-500 animate-pulse' : 'bg-green-500'}`}></span>
              Sandbox Quota Guard
            </span>
            <p className="text-[9px] text-zinc-500 leading-normal leading-tight">
              Redirects all standard requests to zero-cost local asset templates.
            </p>
          </div>
          <button
            onClick={handleToggleMockMode}
            className={`px-3 py-1.5 rounded-lg text-[9px] font-mono font-black tracking-wider uppercase border transition-all cursor-pointer ${
              isMockActive
                ? 'bg-amber-500/10 border-amber-500/30 text-amber-400 hover:bg-amber-500/20 shadow-[0_0_15px_rgba(245,158,11,0.15)]'
                : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-white hover:border-zinc-700'
            }`}
          >
            {isMockActive ? 'Mock Active' : 'Enable Mock'}
          </button>
        </div>

        {/* Dual Radial Progress Bars */}
        <div className="grid grid-cols-2 gap-4 bg-zinc-950/40 border border-zinc-850 p-4 rounded-xl">
          <div className="relative">
            {isGeminiWarning && (
              <div className="absolute -top-1 -right-1 z-10">
                <Flame className="text-red-500 animate-bounce" size={14} />
              </div>
            )}
            <RadialProgress
              percentage={activeGeminiPercent}
              color={isMockActive ? "#f59e0b" : "#ef4444"} // YouTube Crimson or Sandbox Amber
              label="Gemini API"
              subLabel={isMockActive ? "LOCAL MOCK" : "Text & Embeddings"}
            />
          </div>

          <div className="relative">
            {isVeoWarning && (
              <div className="absolute -top-1 -right-1 z-10">
                <ShieldAlert className="text-amber-500 animate-pulse" size={14} />
              </div>
            )}
            <RadialProgress
              percentage={activeVeoPercent}
              color={isMockActive ? "#f59e0b" : "#6366f1"} // AI Orchestration Indigo or Sandbox Amber
              label="Veo API"
              subLabel={isMockActive ? "LOCAL MOCK" : "Video Synthesis"}
            />
          </div>
        </div>

        {/* Diagnostic Metadata List */}
        <div className="space-y-2.5 font-mono text-[10px]">
          <div className="flex justify-between items-center text-zinc-500 pb-1.5 border-b border-zinc-900">
            <span>Diagnostics Metric</span>
            <span>Usage Value</span>
          </div>

          <div className="flex justify-between items-center">
            <span className="text-zinc-400">Gemini Request Window:</span>
            <span className="text-white font-bold">
              {isMockActive ? '0 (MOCK INTERCEPT)' : `${Math.round(geminiPercent * 1000)} / 100,000 RPD`}
            </span>
          </div>

          <div className="flex justify-between items-center">
            <span className="text-zinc-400">Veo Generation Limit:</span>
            <span className="text-white font-bold">
              {isMockActive ? '0 (MOCK INTERCEPT)' : `${Math.round(veoPercent * 10)} / 1,000 RPD`}
            </span>
          </div>

          <div className="flex justify-between items-center">
            <span className="text-zinc-400">Limiter Pool Strategy:</span>
            <span className="text-indigo-400 font-bold">{isMockActive ? 'Local Fallback Template' : 'Token Bucket (IP/OAuth)'}</span>
          </div>

          <div className="flex justify-between items-center">
            <span className="text-zinc-400">Refresh Cycle Reset:</span>
            <span className="text-emerald-400 font-bold">{isMockActive ? 'N/A' : `in ${secondsToReset} seconds`}</span>
          </div>
        </div>
      </div>

      {/* Interactive Controls Panel */}
      <div className="pt-4 border-t border-zinc-850 mt-6 grid grid-cols-2 gap-3 relative z-10">
        <button
          onClick={handleSimulatePeakLoad}
          className="bg-zinc-950 hover:bg-zinc-900 border border-zinc-800 hover:border-zinc-700 text-zinc-300 font-bold py-2 px-3 rounded-lg text-[9px] tracking-wider uppercase transition flex items-center justify-center gap-1.5 cursor-pointer"
        >
          <Zap size={11} className="text-amber-400" />
          <span>Simulate Peak</span>
        </button>

        <button
          onClick={handleOptimizeRouting}
          disabled={isRefreshing}
          className="bg-[#1e1414] hover:bg-[#2e1d1d] border border-red-950 hover:border-red-500 text-red-400 font-bold py-2 px-3 rounded-lg text-[9px] tracking-wider uppercase transition flex items-center justify-center gap-1.5 disabled:opacity-50 cursor-pointer"
        >
          {isRefreshing ? (
            <RefreshCw size={11} className="animate-spin text-red-500" />
          ) : (
            <ShieldAlert size={11} className="text-red-500" />
          )}
          <span>Optimize Route</span>
        </button>
      </div>
    </div>
  );
};
