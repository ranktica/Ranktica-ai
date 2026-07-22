import React, { useState, useEffect } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from "recharts";
import {
  Activity,
  Server,
  Cpu,
  Clock,
  ShieldCheck,
  AlertCircle,
  RefreshCw,
  TrendingUp,
  Zap
} from "lucide-react";

interface ApiMetricPoint {
  time: string;
  geminiLatency: number;
  veoLatency: number;
  geminiThroughput: number;
  veoThroughput: number;
  status200: number;
  status429: number;
  status500: number;
}

export const ApiHealthDashboard: React.FC = () => {
  const [serviceFilter, setServiceFilter] = useState<"ALL" | "GEMINI" | "VEO">("ALL");
  const [metricTab, setMetricTab] = useState<"LATENCY" | "THROUGHPUT" | "STATUS_CODES">("LATENCY");
  const [isLive, setIsLive] = useState(true);
  
  // Generating historical 24h mock dataset matching clinical telemetry aesthetic
  const generateInitialData = (): ApiMetricPoint[] => {
    const data: ApiMetricPoint[] = [];
    const now = new Date();
    for (let i = 24; i >= 0; i--) {
      const timeLabel = new Date(now.getTime() - i * 60 * 60 * 1000);
      const formattedTime = timeLabel.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      
      const isPeakHour = timeLabel.getHours() >= 9 && timeLabel.getHours() <= 17;
      const demandMultiplier = isPeakHour ? 1.4 : 0.75;
      
      const geminiLat = Math.round((320 + Math.random() * 80) * (isPeakHour ? 1.15 : 1.0));
      const veoLat = Math.round((4200 + Math.random() * 800) * (isPeakHour ? 1.25 : 1.0));
      
      const geminiThrough = Math.round((45 + Math.random() * 25) * demandMultiplier);
      const veoThrough = Math.round((5 + Math.random() * 4) * demandMultiplier);
      
      const totalRequests = geminiThrough + veoThrough;
      const status429 = Math.random() > 0.85 ? Math.round(totalRequests * 0.05) : 0;
      const status500 = Math.random() > 0.95 ? 1 : 0;
      const status200 = totalRequests - status429 - status500;

      data.push({
        time: formattedTime,
        geminiLatency: geminiLat,
        veoLatency: veoLat,
        geminiThroughput: geminiThrough,
        veoThroughput: veoThrough,
        status200,
        status429,
        status500,
      });
    }
    return data;
  };

  const [dataPoints, setDataPoints] = useState<ApiMetricPoint[]>(generateInitialData());

  // Dynamic live stream updates simulating real-time orchestration behavior
  useEffect(() => {
    if (!isLive) return;

    const timer = setInterval(() => {
      setDataPoints(prev => {
        const nextData = [...prev.slice(1)];
        const now = new Date();
        const formattedTime = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
        
        const isPeak = now.getHours() >= 9 && now.getHours() <= 17;
        const multiplier = isPeak ? 1.3 : 0.8;
        
        const geminiLat = Math.round((310 + Math.random() * 70) * (isPeak ? 1.1 : 1.0));
        const veoLat = Math.round((4100 + Math.random() * 600) * (isPeak ? 1.2 : 1.0));
        
        const geminiThrough = Math.round((40 + Math.random() * 20) * multiplier);
        const veoThrough = Math.round((4 + Math.random() * 3) * multiplier);
        
        const total = geminiThrough + veoThrough;
        const status429 = Math.random() > 0.9 ? Math.round(total * 0.06) : 0;
        const status500 = Math.random() > 0.98 ? 1 : 0;
        const status200 = total - status429 - status500;

        nextData.push({
          time: formattedTime,
          geminiLatency: geminiLat,
          veoLatency: veoLat,
          geminiThroughput: geminiThrough,
          veoThroughput: veoThrough,
          status200,
          status429,
          status500
        });

        return nextData;
      });
    }, 4000);

    return () => clearInterval(timer);
  }, [isLive]);

  // Telemetry Aggregates calculation
  const latest = dataPoints[dataPoints.length - 1] || {
    geminiLatency: 350,
    veoLatency: 4500,
    geminiThroughput: 50,
    veoThroughput: 6,
    status200: 54,
    status429: 1,
    status500: 0
  };

  const avgGeminiLatency = Math.round(dataPoints.reduce((sum, d) => sum + d.geminiLatency, 0) / dataPoints.length);
  const avgVeoLatency = Math.round(dataPoints.reduce((sum, d) => sum + d.veoLatency, 0) / dataPoints.length);
  const totalThroughput = dataPoints.reduce((sum, d) => sum + d.geminiThroughput + d.veoThroughput, 0);
  const totalErrors = dataPoints.reduce((sum, d) => sum + d.status429 + d.status500, 0);
  const errorRate = totalThroughput > 0 ? parseFloat(((totalErrors / (totalThroughput + totalErrors)) * 100).toFixed(2)) : 0.0;

  return (
    <div className="bg-[#121214] border border-zinc-800 rounded-2xl p-6 relative overflow-hidden" id="api-health-dashboard">
      <div className="absolute top-0 right-0 w-64 h-64 bg-red-600/5 rounded-full blur-3xl"></div>

      {/* Component Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-zinc-850 pb-4 mb-6 relative z-10">
        <div>
          <h3 className="text-base font-extrabold text-white flex items-center gap-2 font-sans">
            <Activity className="text-red-500 animate-pulse" size={18} />
            Core AI API Health Engine
          </h3>
          <p className="text-[10px] text-zinc-500 mt-1 font-sans">
            Live telemetry monitoring transaction throughput, system latencies, and output status matrices.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          {/* Live tracking indicator toggle */}
          <button
            onClick={() => setIsLive(!isLive)}
            className={`flex items-center gap-1.5 text-[9px] font-mono font-black uppercase px-3 py-1 rounded-full border transition-all cursor-pointer ${
              isLive
                ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400 animate-pulse"
                : "bg-zinc-900 border-zinc-800 text-zinc-500"
            }`}
          >
            <span className={`w-1.5 h-1.5 rounded-full ${isLive ? "bg-emerald-500" : "bg-zinc-600"}`}></span>
            {isLive ? "Live Streaming" : "Paused"}
          </button>
        </div>
      </div>

      {/* Aggregate Scorecards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6 relative z-10">
        <div className="bg-zinc-950/40 border border-zinc-850 p-4 rounded-xl space-y-1">
          <span className="text-[8px] font-mono font-black uppercase text-zinc-500 tracking-wider flex items-center gap-1">
            <Clock size={11} className="text-red-500" /> Gemini Avg Latency
          </span>
          <div className="flex justify-between items-baseline">
            <span className="text-xl font-black text-white font-mono">{latest.geminiLatency}ms</span>
            <span className="text-[8.5px] font-mono text-zinc-500">Avg {avgGeminiLatency}ms</span>
          </div>
          <div className="w-full bg-zinc-900 h-1 rounded-full overflow-hidden">
            <div
              className="h-full bg-red-600"
              style={{ width: `${Math.min(100, (latest.geminiLatency / 600) * 100)}%` }}
            />
          </div>
        </div>

        <div className="bg-zinc-950/40 border border-zinc-850 p-4 rounded-xl space-y-1">
          <span className="text-[8px] font-mono font-black uppercase text-zinc-500 tracking-wider flex items-center gap-1">
            <Cpu size={11} className="text-indigo-400" /> Veo Avg Latency
          </span>
          <div className="flex justify-between items-baseline">
            <span className="text-xl font-black text-white font-mono">{(latest.veoLatency / 1000).toFixed(2)}s</span>
            <span className="text-[8.5px] font-mono text-zinc-500">Avg {(avgVeoLatency / 1000).toFixed(2)}s</span>
          </div>
          <div className="w-full bg-zinc-900 h-1 rounded-full overflow-hidden">
            <div
              className="h-full bg-indigo-500"
              style={{ width: `${Math.min(100, (latest.veoLatency / 8000) * 100)}%` }}
            />
          </div>
        </div>

        <div className="bg-zinc-950/40 border border-zinc-850 p-4 rounded-xl space-y-1">
          <span className="text-[8px] font-mono font-black uppercase text-zinc-500 tracking-wider flex items-center gap-1">
            <TrendingUp size={11} className="text-green-400" /> Current Output RPM
          </span>
          <div className="flex justify-between items-baseline">
            <span className="text-xl font-black text-white font-mono">
              {latest.geminiThroughput + latest.veoThroughput} req/m
            </span>
            <span className="text-[8.5px] font-mono text-green-500">99.8% Capacity</span>
          </div>
          <div className="w-full bg-zinc-900 h-1 rounded-full overflow-hidden">
            <div
              className="h-full bg-green-500"
              style={{ width: `${Math.min(100, ((latest.geminiThroughput + latest.veoThroughput) / 100) * 100)}%` }}
            />
          </div>
        </div>

        <div className="bg-zinc-950/40 border border-zinc-850 p-4 rounded-xl space-y-1">
          <span className="text-[8px] font-mono font-black uppercase text-zinc-500 tracking-wider flex items-center gap-1">
            <ShieldCheck size={11} className="text-emerald-500" /> API Deflection & error rate
          </span>
          <div className="flex justify-between items-baseline">
            <span className={`text-xl font-black font-mono ${errorRate > 5 ? "text-orange-400" : "text-emerald-400"}`}>
              {errorRate}%
            </span>
            <span className="text-[8.5px] font-mono text-zinc-500">Threshold: &lt;2.0%</span>
          </div>
          <div className="w-full bg-zinc-900 h-1 rounded-full overflow-hidden">
            <div
              className={`h-full ${errorRate > 5 ? "bg-orange-400" : "bg-emerald-500"}`}
              style={{ width: `${Math.max(10, 100 - errorRate)}%` }}
            />
          </div>
        </div>
      </div>

      {/* Control Tabs */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4 bg-zinc-950/50 p-2 border border-zinc-850 rounded-xl relative z-10">
        {/* Metric Selector Tab */}
        <div className="flex gap-1 bg-zinc-900 p-1 rounded-lg border border-zinc-800">
          {(["LATENCY", "THROUGHPUT", "STATUS_CODES"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setMetricTab(tab)}
              className={`px-3 py-1 text-[9px] font-black uppercase tracking-wider rounded transition-all cursor-pointer ${
                metricTab === tab
                  ? "bg-red-600/10 border border-red-500/20 text-red-400 font-bold"
                  : "text-zinc-500 hover:text-zinc-300"
              }`}
            >
              {tab.replace("_", " ")}
            </button>
          ))}
        </div>

        {/* Core Service Filter Selection */}
        <div className="flex gap-1 bg-zinc-900 p-1 rounded-lg border border-zinc-800">
          {(["ALL", "GEMINI", "VEO"] as const).map((svc) => (
            <button
              key={svc}
              onClick={() => setServiceFilter(svc)}
              className={`px-3 py-1 text-[9px] font-black uppercase tracking-wider rounded transition-all cursor-pointer ${
                serviceFilter === svc
                  ? "bg-zinc-800 text-white font-bold"
                  : "text-zinc-500 hover:text-zinc-300"
              }`}
            >
              {svc}
            </button>
          ))}
        </div>
      </div>

      {/* Visual Chart Frame using Recharts LineChart */}
      <div className="h-64 my-4 relative z-10">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={dataPoints} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#1d1d21" vertical={false} />
            <XAxis
              dataKey="time"
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
              unit={metricTab === "LATENCY" ? "ms" : ""}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: "#09090b",
                border: "1px solid #27272a",
                borderRadius: "12px",
                fontSize: "10px",
                fontFamily: "var(--font-mono)",
                color: "#f4f4f5"
              }}
              labelStyle={{ color: "#a1a1aa", fontWeight: "bold", marginBottom: "4px" }}
            />
            <Legend
              verticalAlign="bottom"
              height={36}
              iconSize={8}
              wrapperStyle={{
                fontSize: "9px",
                fontFamily: "var(--font-mono)",
                paddingTop: "12px",
                textTransform: "uppercase",
                letterSpacing: "0.05em"
              }}
            />

            {/* Dynamic Lines rendering per user's Tab & filter state */}
            {metricTab === "LATENCY" && (
              <>
                {(serviceFilter === "ALL" || serviceFilter === "GEMINI") && (
                  <Line
                    type="monotone"
                    name="Gemini 3.5 Flash Latency"
                    dataKey="geminiLatency"
                    stroke="#ef4444"
                    strokeWidth={2}
                    dot={false}
                    activeDot={{ r: 4 }}
                  />
                )}
                {(serviceFilter === "ALL" || serviceFilter === "VEO") && (
                  <Line
                    type="monotone"
                    name="Veo Cinematic Latency"
                    dataKey="veoLatency"
                    stroke="#6366f1"
                    strokeWidth={2}
                    dot={false}
                    activeDot={{ r: 4 }}
                  />
                )}
              </>
            )}

            {metricTab === "THROUGHPUT" && (
              <>
                {(serviceFilter === "ALL" || serviceFilter === "GEMINI") && (
                  <Line
                    type="monotone"
                    name="Gemini Requests/Min"
                    dataKey="geminiThroughput"
                    stroke="#10b981"
                    strokeWidth={2}
                    dot={false}
                    activeDot={{ r: 4 }}
                  />
                )}
                {(serviceFilter === "ALL" || serviceFilter === "VEO") && (
                  <Line
                    type="monotone"
                    name="Veo Requests/Min"
                    dataKey="veoThroughput"
                    stroke="#3b82f6"
                    strokeWidth={2}
                    dot={false}
                    activeDot={{ r: 4 }}
                  />
                )}
              </>
            )}

            {metricTab === "STATUS_CODES" && (
              <>
                <Line
                  type="monotone"
                  name="Status 200 OK"
                  dataKey="status200"
                  stroke="#10b981"
                  strokeWidth={2}
                  dot={false}
                />
                <Line
                  type="monotone"
                  name="Status 429 Quota Rate Limit"
                  dataKey="status429"
                  stroke="#f59e0b"
                  strokeWidth={1.5}
                  dot={false}
                />
                <Line
                  type="monotone"
                  name="Status 500 Failure"
                  dataKey="status500"
                  stroke="#ef4444"
                  strokeWidth={1.5}
                  dot={false}
                />
              </>
            )}
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Real-time system console feed log related to status outputs */}
      <div className="bg-zinc-950 p-3 rounded-xl border border-zinc-850 font-mono text-[8px] text-zinc-500 space-y-1 relative z-10">
        <div className="flex justify-between items-center text-[7.5px] font-black uppercase text-zinc-400 tracking-wider mb-1 pb-1 border-b border-zinc-900">
          <span>Active Orchestrator Engine Logging Stream</span>
          <span className="text-red-500 flex items-center gap-1">
            <Zap size={8} className="animate-pulse" /> LIVE SYNCING
          </span>
        </div>
        <div className="truncate">
          <span className="text-zinc-600">[INFO]</span> Successfully verified credentials for API endpoint /api/gemini. Latency: {latest.geminiLatency}ms
        </div>
        <div className="truncate">
          <span className="text-zinc-600">[INFO]</span> Checked Cache status for query key. Deflected direct API hit, saving 0.0015 credits.
        </div>
        {latest.status429 > 0 && (
          <div className="truncate text-amber-500/80">
            <span className="text-amber-500 font-bold">[WARN]</span> Outbound rate limit reached. Auto-deferring tasks to background scheduler queue.
          </div>
        )}
      </div>
    </div>
  );
};
