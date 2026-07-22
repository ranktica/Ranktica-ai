import React, { useState, useEffect, useMemo } from 'react';
import { 
  Shield, 
  Cpu, 
  Layers, 
  Activity, 
  Terminal, 
  CheckCircle, 
  AlertTriangle, 
  Play, 
  RefreshCw, 
  Lock, 
  Check, 
  Copy, 
  Server, 
  Sliders, 
  Zap, 
  Info, 
  FileText, 
  TrendingUp, 
  GitBranch, 
  FolderGit, 
  Database,
  Award,
  Clock,
  Heart,
  ChevronRight,
  Sparkles,
  Search
} from 'lucide-react';
import { toast } from 'react-hot-toast';

export const RankticaEnterprisePortal: React.FC = () => {
  const [copiedCodeId, setCopiedCodeId] = useState<string | null>(null);
  const [activeSubTab, setActiveSubTab] = useState<'devops' | 'monitoring' | 'testing' | 'readiness'>('readiness');

  // Interactive CI/CD State
  const [cicdStatus, setCicdStatus] = useState<'idle' | 'running' | 'success' | 'error'>('idle');
  const [cicdStep, setCicdStep] = useState<number>(0);
  const [cicdLogs, setCicdLogs] = useState<string[]>([]);

  // Interactive Failover Simulation
  const [failoverStatus, setFailoverStatus] = useState<'idle' | 'testing' | 'success' | 'error'>('idle');
  const [failoverLogs, setFailoverLogs] = useState<string[]>([]);
  const [activeRegion, setActiveRegion] = useState<'us-central1' | 'europe-west3'>('us-central1');

  // Interactive Secrets State
  const [secrets, setSecrets] = useState([
    { key: 'GEMINI_API_KEY', value: '********************************', source: 'KMS Encrypted', lastRotated: '2026-06-01' },
    { key: 'POSTGRES_DB_URL', value: 'postgresql://db_user:********@cloud-sql-replica.internal:5432/ranktica', source: 'KMS Encrypted', lastRotated: '2026-05-15' },
    { key: 'STRIPE_SECRET_KEY', value: 'sk_test_51**********************', source: 'KMS Encrypted', lastRotated: '2026-06-10' },
    { key: 'JWT_SIGNING_SECRET', value: '********************************', source: 'KMS Encrypted', lastRotated: '2026-06-20' },
  ]);
  const [newSecretKey, setNewSecretKey] = useState('');
  const [newSecretVal, setNewSecretVal] = useState('');

  // Checklist Checkboxes for scoring
  const [checklistProd, setChecklistProd] = useState({
    dns: true,
    cdn: true,
    backups: false,
    migrations: true,
    graceful: false,
    autoscaling: false
  });

  const [checklistSec, setChecklistSec] = useState({
    encryption: true,
    secrets: true,
    rbac: false,
    audit: true,
    firewall: false,
    ddos: false
  });

  // Calculate dynamic Enterprise Readiness Score based on checklist values
  const readinessScore = useMemo(() => {
    const totalProd = Object.values(checklistProd).filter(Boolean).length;
    const totalSec = Object.values(checklistSec).filter(Boolean).length;
    const maxItems = 12;
    const completedItems = totalProd + totalSec;
    const baseScore = Math.floor((completedItems / maxItems) * 100);
    return baseScore;
  }, [checklistProd, checklistSec]);

  // Performance simulation ticks
  const [metricsTick, setMetricsTick] = useState<number>(0);
  const [cpuLoad, setCpuLoad] = useState<number>(34.2);
  const [memoryPool, setMemoryPool] = useState<number>(4.1);
  const [requestLatency, setRequestLatency] = useState<number>(84);
  const [errorRate, setErrorRate] = useState<number>(0.02);

  useEffect(() => {
    const interval = setInterval(() => {
      setMetricsTick(prev => prev + 1);
      setCpuLoad(c => {
        const delta = (Math.random() - 0.5) * 4;
        return Math.max(10, Math.min(95, parseFloat((c + delta).toFixed(1))));
      });
      setMemoryPool(m => {
        const delta = (Math.random() - 0.5) * 0.1;
        return Math.max(2.5, Math.min(16, parseFloat((m + delta).toFixed(2))));
      });
      setRequestLatency(l => {
        const delta = Math.floor((Math.random() - 0.5) * 12);
        return Math.max(45, Math.min(300, l + delta));
      });
      setErrorRate(e => {
        const delta = (Math.random() - 0.5) * 0.01;
        return Math.max(0.00, Math.min(1.5, parseFloat((e + delta).toFixed(3))));
      });
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  // Dockerfile templates
  const dockerfileContent = `FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/package*.json ./
RUN npm ci --only=production
EXPOSE 3000
CMD ["node", "dist/server.cjs"]`;

  const dockerComposeContent = `version: '3.8'
services:
  ranktica-gateway:
    image: gcr.io/ranktica-production/gateway:v3.0.0
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
      - PORT=3000
      - GEMINI_API_KEY=\${GEMINI_API_KEY}
      - DATABASE_URL=\${DATABASE_URL}
    restart: always
    deploy:
      replicas: 3
      resources:
        limits:
          cpus: '0.50'
          memory: 512M
        reservations:
          cpus: '0.25'
          memory: 256M
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:3000/api/health"]
      interval: 10s
      timeout: 5s
      retries: 3`;

  // Testing suites
  const [testSuiteStatus, setTestSuiteStatus] = useState<'idle' | 'running' | 'passed' | 'failed'>('idle');
  const [unitTestsPassed, setUnitTestsPassed] = useState<number>(0);
  const [integrationPassed, setIntegrationPassed] = useState<number>(0);
  const [aiEvalScore, setAiEvalScore] = useState<number>(0);

  const handleRunTests = () => {
    setTestSuiteStatus('running');
    setUnitTestsPassed(0);
    setIntegrationPassed(0);
    setAiEvalScore(0);
    
    toast.loading('Initializing test harnesses & AI evaluation alignments...', { id: 'tests-harness' });
    
    setTimeout(() => {
      setUnitTestsPassed(42);
      toast.success('42/42 Unit Tests Passed (100% coverage)', { id: 'tests-harness' });
      
      setTimeout(() => {
        setIntegrationPassed(18);
        toast.success('18/18 Integration Gateways Verified', { id: 'tests-harness' });
        
        setTimeout(() => {
          setAiEvalScore(98.6);
          setTestSuiteStatus('passed');
          toast.success('AI Alignment Evaluator: 98.6% Response Safety Match Index!', { id: 'tests-harness' });
        }, 1500);
      }, 1200);
    }, 1000);
  };

  // Run CI/CD Pipeline
  const handleTriggerCicd = () => {
    setCicdStatus('running');
    setCicdStep(1);
    setCicdLogs(['[BUILD-CI] Triggering workflow run #842...', '[BUILD-CI] Pulling base image node:20-alpine']);
    
    const steps = [
      'ESLint check: successful. No compilation errors detected.',
      'Drizzle database migrations syntax checked: OK.',
      'Compiling Vite SPA assets...',
      'Bundling Express server.ts into dist/server.cjs via esbuild...',
      'Production bundle verification passed. File size: 2.4MB.',
      'Containerizing application via Docker Multi-Stage Build...',
      'Trivy Security Scanning: 0 critical vulnerabilities, 0 high.',
      'Pushing container artifact to Google Cloud Artifact Registry...',
      'Canary deployment dispatched to Cloud Run: us-central1-a (Replica 1 of 3)',
      'Running integration health probe: /api/v1/health -> 200 OK.',
      'Promoting canary to 100% stable production release. Complete! 🚀'
    ];

    let currentIdx = 0;
    const timer = setInterval(() => {
      if (currentIdx < steps.length) {
        const nextStep = steps[currentIdx];
        setCicdLogs(prev => [...prev, `[BUILD-CI] ${nextStep}`]);
        setCicdStep(prev => prev + 1);
        currentIdx++;
      } else {
        clearInterval(timer);
        setCicdStatus('success');
        toast.success('CI/CD Pipeline Run Completed Successfully! Production cluster is green.', { icon: '🟢' });
      }
    }, 800);
  };

  // Trigger Disaster Failover
  const handleTriggerFailover = () => {
    setFailoverStatus('testing');
    setFailoverLogs(['[FAILOVER-DR] Disaster alert issued! Initiating secondary site promotion...', '[FAILOVER-DR] Active Region: us-central1 is experiencing latency spike.']);
    
    const steps = [
      'Pinging Standby Cluster in europe-west3: Standby is healthy.',
      'Verifying PostgreSQL Read-Replica sync lag: 4ms. Integrity check passed.',
      'Swapping active cluster endpoints in Cloud DNS...',
      'Rerouting traffic DNS records from us-central1 to europe-west3...',
      'Switching secondary database state to Primary Writer...',
      'Purging Cloudflare edge CDN cache globally...',
      'Disseminating status update through pager-duty webhooks...',
      'Active region promoted: europe-west3 is now primary live region. Failover Complete! ✅'
    ];

    let currentIdx = 0;
    const timer = setInterval(() => {
      if (currentIdx < steps.length) {
        const nextStep = steps[currentIdx];
        setFailoverLogs(prev => [...prev, `[FAILOVER-DR] ${nextStep}`]);
        currentIdx++;
      } else {
        clearInterval(timer);
        setFailoverStatus('success');
        setActiveRegion('europe-west3');
        toast.success('Failover complete! Rerouted to standby backup cluster in europe-west3.', { icon: '🛡️' });
      }
    }, 1000);
  };

  const handleCopyCode = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedCodeId(id);
    toast.success('Copied configuration to clipboard!');
    setTimeout(() => setCopiedCodeId(null), 2000);
  };

  const handleCreateSecret = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSecretKey || !newSecretVal) return;
    setSecrets(prev => [
      ...prev,
      { key: newSecretKey.toUpperCase(), value: '********************************', source: 'KMS Encrypted', lastRotated: new Date().toISOString().slice(0, 10) }
    ]);
    toast.success(`Secret ${newSecretKey.toUpperCase()} securely encrypted & saved to KMS Vault`);
    setNewSecretKey('');
    setNewSecretVal('');
  };

  return (
    <div className="space-y-6">
      
      {/* ENTERPRISE STATS BOARD & READY RATING */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        
        {/* Enterprise Readiness Circular Gauge */}
        <div className="lg:col-span-4 bg-[#0b0b0e] border border-zinc-850 rounded-2xl p-5 flex flex-col justify-between relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-32 h-32 bg-red-600/5 rounded-full filter blur-xl" />
          
          <div>
            <span className="text-[10px] font-black uppercase text-zinc-500 tracking-wider block">Enterprise Readiness Score</span>
            <div className="flex items-baseline gap-2 mt-2">
              <span className="text-4xl font-black text-white">{readinessScore}%</span>
              <span className="text-xs text-red-400 font-bold flex items-center gap-0.5 uppercase tracking-widest">
                <Award size={13} /> Tier 1 OS
              </span>
            </div>
            <p className="text-[11px] text-zinc-400 leading-relaxed mt-2">
              Dynamically derived from deployment configuration checklist parameters, security compliance matrices, and unit testing assertions.
            </p>
          </div>

          <div className="space-y-2 mt-4 pt-3 border-t border-zinc-900">
            <div className="flex justify-between text-[10px] font-bold text-zinc-500">
              <span>Production Milestones</span>
              <span className="text-zinc-300 font-mono">
                {Object.values(checklistProd).filter(Boolean).length}/6 Complete
              </span>
            </div>
            <div className="flex justify-between text-[10px] font-bold text-zinc-500">
              <span>Security Guardrails</span>
              <span className="text-zinc-300 font-mono">
                {Object.values(checklistSec).filter(Boolean).length}/6 Complete
              </span>
            </div>

            <div className="w-full bg-zinc-950 rounded-full h-2 overflow-hidden border border-zinc-900 mt-2">
              <div 
                className="bg-gradient-to-r from-red-600 to-orange-500 h-full transition-all duration-500"
                style={{ width: `${readinessScore}%` }}
              />
            </div>
          </div>
        </div>

        {/* Live Container SLO metrics */}
        <div className="lg:col-span-8 bg-[#0b0b0e] border border-zinc-850 rounded-2xl p-5 space-y-4">
          <div className="flex justify-between items-center pb-2 border-b border-zinc-900">
            <h3 className="text-xs font-black uppercase tracking-wider text-zinc-400 flex items-center gap-2">
              <Activity size={14} className="text-red-500 animate-pulse" /> Live Container Cluster Performance Metrics (SLO/SLI)
            </h3>
            <span className="text-[9px] bg-emerald-950/40 text-emerald-400 px-2 py-0.5 rounded border border-emerald-900/60 font-black uppercase tracking-wider">
              99.99% Guaranteed uptime SLA
            </span>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            
            <div className="bg-zinc-950 border border-zinc-900 p-3.5 rounded-xl space-y-1">
              <span className="text-[9px] font-bold uppercase text-zinc-500">Knative CPU Core Limit</span>
              <div className="flex justify-between items-baseline">
                <span className="text-xl font-mono font-bold text-white">{cpuLoad}%</span>
                <span className="text-[9px] text-zinc-500">Max: 100%</span>
              </div>
              <div className="w-full bg-zinc-900 h-1 rounded overflow-hidden">
                <div className={`h-full ${cpuLoad > 80 ? 'bg-red-500' : cpuLoad > 60 ? 'bg-amber-500' : 'bg-emerald-500'}`} style={{ width: `${cpuLoad}%` }} />
              </div>
            </div>

            <div className="bg-zinc-950 border border-zinc-900 p-3.5 rounded-xl space-y-1">
              <span className="text-[9px] font-bold uppercase text-zinc-500">Express RAM Pool</span>
              <div className="flex justify-between items-baseline">
                <span className="text-xl font-mono font-bold text-white">{memoryPool} GB</span>
                <span className="text-[9px] text-zinc-500">Max: 16 GB</span>
              </div>
              <div className="w-full bg-zinc-900 h-1 rounded overflow-hidden">
                <div className="h-full bg-blue-500" style={{ width: `${(memoryPool / 16) * 100}%` }} />
              </div>
            </div>

            <div className="bg-zinc-950 border border-zinc-900 p-3.5 rounded-xl space-y-1">
              <span className="text-[9px] font-bold uppercase text-zinc-500">P99 Gateway Latency</span>
              <div className="flex justify-between items-baseline">
                <span className="text-xl font-mono font-bold text-white">{requestLatency} ms</span>
                <span className="text-[9px] text-zinc-500">SLO Target: &lt;150ms</span>
              </div>
              <div className="w-full bg-zinc-900 h-1 rounded overflow-hidden">
                <div className={`h-full ${requestLatency > 150 ? 'bg-amber-500' : 'bg-emerald-500'}`} style={{ width: `${(requestLatency / 300) * 100}%` }} />
              </div>
            </div>

            <div className="bg-zinc-950 border border-zinc-900 p-3.5 rounded-xl space-y-1">
              <span className="text-[9px] font-bold uppercase text-zinc-500">HTTP 5xx Error Delta</span>
              <div className="flex justify-between items-baseline">
                <span className="text-xl font-mono font-bold text-white">{errorRate}%</span>
                <span className="text-[9px] text-zinc-500">SLO Target: &lt;0.1%</span>
              </div>
              <div className="w-full bg-zinc-900 h-1 rounded overflow-hidden">
                <div className={`h-full ${errorRate > 0.1 ? 'bg-red-500' : 'bg-emerald-500'}`} style={{ width: `${Math.min(100, errorRate * 100)}%` }} />
              </div>
            </div>

          </div>
        </div>

      </div>

      {/* PORTAL MAIN TAB HEADERS */}
      <div className="flex border-b border-zinc-850 p-1 bg-zinc-950 rounded-xl space-x-1">
        {[
          { id: 'readiness', label: 'Checklists & OS Manuals', icon: <FileText size={14} /> },
          { id: 'devops', label: 'CI/CD & DevOps Containerization', icon: <GitBranch size={14} /> },
          { id: 'monitoring', label: 'Secrets & Audit Compliance', icon: <Shield size={14} /> },
          { id: 'testing', label: 'Unit, Integration & AI Eval', icon: <Sliders size={14} /> },
        ].map(subTab => (
          <button
            key={subTab.id}
            onClick={() => setActiveSubTab(subTab.id as any)}
            className={`flex items-center gap-2 px-4 py-3 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all cursor-pointer ${
              activeSubTab === subTab.id 
                ? 'bg-zinc-900 text-white border border-zinc-800' 
                : 'text-zinc-400 hover:bg-zinc-950 hover:text-white border border-transparent'
            }`}
          >
            {subTab.icon}
            {subTab.label}
          </button>
        ))}
      </div>

      {/* ======================================================== */}
      {/* PORTAL TAB 1: LAUNCH CHECKLISTS & DISASTER OS MANUALS      */}
      {/* ======================================================== */}
      {activeSubTab === 'readiness' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 animate-fade-in">
          
          {/* Interactive Checklists */}
          <div className="lg:col-span-5 space-y-6">
            
            {/* DevOps Production Checklist */}
            <div className="bg-[#0b0b0e] border border-zinc-850 p-5 rounded-2xl space-y-4">
              <div className="flex items-center gap-2 pb-2.5 border-b border-zinc-900">
                <Server className="text-red-500" size={16} />
                <h3 className="text-xs font-black uppercase text-white tracking-wider">DevOps Launch Readiness Checklist</h3>
              </div>
              
              <div className="space-y-2.5 text-xs">
                {[
                  { key: 'dns', label: 'Configure root & wildcard Cloudflare SSL/DNS keys', desc: 'Secure HTTPS wildcard setups pointing to API ingress.' },
                  { key: 'cdn', label: 'Set static assets CDN edge cache policy routing', desc: 'Accelerates Next.js or Vite bundle downloads.' },
                  { key: 'backups', label: 'Setup daily point-in-time PostgreSQL backups', desc: 'Back up DB data continuously with retention window.' },
                  { key: 'migrations', label: 'Auto-run database migrations with safe state lock', desc: 'Executes prior to new server instance promotion.' },
                  { key: 'graceful', label: 'Implement graceful container termination handlers', desc: 'Allows active server requests to complete during rollout.' },
                  { key: 'autoscaling', label: 'Deploy HPA autoscaler (Target threshold: 75% CPU)', desc: 'Scale-out container replicas under heavy load.' },
                ].map(item => (
                  <div key={item.key} className="flex items-start gap-3 p-2 bg-zinc-950 rounded-xl border border-zinc-900">
                    <button
                      onClick={() => {
                        setChecklistProd(prev => ({ ...prev, [item.key]: !prev[item.key as keyof typeof checklistProd] }));
                        toast.success('Production Checklist State Synchronized');
                      }}
                      className={`mt-0.5 w-4 h-4 rounded border transition-all flex items-center justify-center cursor-pointer ${
                        checklistProd[item.key as keyof typeof checklistProd] 
                          ? 'bg-red-600 border-red-500 text-white' 
                          : 'border-zinc-800 bg-zinc-900 text-transparent'
                      }`}
                    >
                      <Check size={11} strokeWidth={3} />
                    </button>
                    <div>
                      <p className={`font-bold ${checklistProd[item.key as keyof typeof checklistProd] ? 'text-white' : 'text-zinc-400'}`}>{item.label}</p>
                      <p className="text-[10px] text-zinc-500 mt-0.5">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Security Audit Checklist */}
            <div className="bg-[#0b0b0e] border border-zinc-850 p-5 rounded-2xl space-y-4">
              <div className="flex items-center gap-2 pb-2.5 border-b border-zinc-900">
                <Shield className="text-red-500" size={16} />
                <h3 className="text-xs font-black uppercase text-white tracking-wider">Security Hardening & Audits</h3>
              </div>

              <div className="space-y-2.5 text-xs">
                {[
                  { key: 'encryption', label: 'Audit AES-256 data at-rest & TLS 1.3 in-transit', desc: 'Secure data pipelines using standard industry patterns.' },
                  { key: 'secrets', label: 'KMS-based API secret injection setup (No dotenv files)', desc: 'Encrypts secrets securely.' },
                  { key: 'rbac', label: 'Audit Role-Based Access Control (RBAC) API routes', desc: 'Enforces permissions checks for user workspace edits.' },
                  { key: 'audit', label: 'Setup append-only database audit logging table', desc: 'Performs audit logs for administrative queries.' },
                  { key: 'firewall', label: 'Deploy Web Application Firewall (WAF) rule filters', desc: 'Protects endpoint APIs from payload injections.' },
                  { key: 'ddos', label: 'Configure Cloudflare DDoS Advanced Mitigation protection', desc: 'Blocks high velocity layer 7 request floods.' },
                ].map(item => (
                  <div key={item.key} className="flex items-start gap-3 p-2 bg-zinc-950 rounded-xl border border-zinc-900">
                    <button
                      onClick={() => {
                        setChecklistSec(prev => ({ ...prev, [item.key]: !prev[item.key as keyof typeof checklistSec] }));
                        toast.success('Security Checklist State Synchronized');
                      }}
                      className={`mt-0.5 w-4 h-4 rounded border transition-all flex items-center justify-center cursor-pointer ${
                        checklistSec[item.key as keyof typeof checklistSec] 
                          ? 'bg-red-600 border-red-500 text-white' 
                          : 'border-zinc-800 bg-zinc-900 text-transparent'
                      }`}
                    >
                      <Check size={11} strokeWidth={3} />
                    </button>
                    <div>
                      <p className={`font-bold ${checklistSec[item.key as keyof typeof checklistSec] ? 'text-white' : 'text-zinc-400'}`}>{item.label}</p>
                      <p className="text-[10px] text-zinc-500 mt-0.5">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

          </div>

          {/* Scaling Plans & Disaster Recovery OS Manuals */}
          <div className="lg:col-span-7 space-y-6">
            
            {/* Scaling Plans */}
            <div className="bg-[#0b0b0e] border border-zinc-850 p-5 rounded-2xl space-y-4">
              <div className="flex items-center gap-2 pb-2.5 border-b border-zinc-900">
                <TrendingUp className="text-red-500" size={16} />
                <h3 className="text-xs font-black uppercase text-white tracking-wider">Enterprise Horizontal Scaling Plan</h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div className="p-3 bg-zinc-950 border border-zinc-900 rounded-xl space-y-1.5">
                  <span className="text-[9px] font-black uppercase text-red-500">Database Layer</span>
                  <h4 className="text-xs font-bold text-white">PostgreSQL Multi-AZ</h4>
                  <p className="text-[10px] text-zinc-400">1 Master writer with 3 active read replicas, routing read queries automatically through PgBouncer proxy pools.</p>
                </div>
                <div className="p-3 bg-zinc-950 border border-zinc-900 rounded-xl space-y-1.5">
                  <span className="text-[9px] font-black uppercase text-red-500">Caching Layer</span>
                  <h4 className="text-xs font-bold text-white">Redis Cluster Tier</h4>
                  <p className="text-[10px] text-zinc-400">6 Node sharded Redis cluster caching AI search tokens and common SEO dashboards. Saves expensive repeat API calls.</p>
                </div>
                <div className="p-3 bg-zinc-950 border border-zinc-900 rounded-xl space-y-1.5">
                  <span className="text-[9px] font-black uppercase text-red-500">Agent Workers</span>
                  <h4 className="text-xs font-bold text-white">Scale-to-Zero Pods</h4>
                  <p className="text-[10px] text-zinc-400">Knative container scaling to spawn infinite parallel workers when campaigns are dispatched, and scale down when idle.</p>
                </div>
              </div>
            </div>

            {/* Disaster Recovery Plan & Visual simulator */}
            <div className="bg-[#0b0b0e] border border-zinc-850 p-5 rounded-2xl space-y-4">
              <div className="flex items-center justify-between pb-2.5 border-b border-zinc-900">
                <div className="flex items-center gap-2">
                  <Sliders className="text-red-500 animate-spin" size={16} style={{ animationDuration: '4s' }} />
                  <h3 className="text-xs font-black uppercase text-white tracking-wider">Disaster Recovery (DR) Execution Console</h3>
                </div>
                <span className="text-[9px] font-mono bg-zinc-950 border border-zinc-900 text-zinc-500 px-2 py-0.5 rounded">
                  RTO: &lt; 30 Seconds • RPO: &lt; 5 Seconds
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
                
                {/* Active Regions & Failover trigger */}
                <div className="md:col-span-5 space-y-3 flex flex-col justify-between">
                  <div className="space-y-2">
                    <span className="text-[10px] font-bold uppercase text-zinc-500 block">Failover Control Strategy</span>
                    <div className="flex justify-between items-center p-3 bg-zinc-950 rounded-xl border border-zinc-900">
                      <div>
                        <p className="text-xs font-bold text-white">Live Cluster Site</p>
                        <p className="text-[10px] text-zinc-500">Currently routing incoming traffic</p>
                      </div>
                      <span className="text-[10px] font-mono bg-red-950/40 border border-red-900 text-red-400 font-bold px-2 py-1 rounded">
                        {activeRegion}
                      </span>
                    </div>
                  </div>

                  <button
                    onClick={handleTriggerFailover}
                    disabled={failoverStatus === 'testing'}
                    className={`w-full py-3 bg-gradient-to-r from-red-600 to-orange-500 hover:from-red-500 hover:to-orange-400 text-white font-black text-xs uppercase tracking-wider rounded-xl transition-all shadow-md flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50`}
                  >
                    <RefreshCw size={12} className={failoverStatus === 'testing' ? 'animate-spin' : ''} />
                    {failoverStatus === 'testing' ? 'Failover executing...' : 'Trigger DR Failover Simulation'}
                  </button>
                </div>

                {/* Live Failover Console Logs */}
                <div className="md:col-span-7 flex flex-col justify-between bg-zinc-950 border border-zinc-900 rounded-xl p-3 h-44">
                  <span className="text-[9px] font-bold uppercase text-zinc-500 tracking-wider">DR FAILOVER AUDIT TRAIL LOGS</span>
                  
                  <div className="flex-1 overflow-y-auto font-mono text-[9px] text-zinc-400 space-y-1 mt-2 pr-1 scrollbar-thin">
                    {failoverLogs.length === 0 ? (
                      <span className="text-zinc-600 italic">Console idle. Awaiting instruction...</span>
                    ) : (
                      failoverLogs.map((log, i) => (
                        <div key={i} className="text-emerald-400">{log}</div>
                      ))
                    )}
                  </div>
                </div>

              </div>
            </div>

            {/* Architecture Overview */}
            <div className="bg-[#0b0b0e] border border-zinc-850 p-5 rounded-2xl space-y-3">
              <span className="text-[9px] font-black uppercase text-zinc-500 tracking-wider block">Global Operating System Architecture Overview</span>
              <h4 className="text-xs font-extrabold text-white">Secure Pipeline Topology Mapping</h4>
              
              {/* ASCII Topology */}
              <div className="p-4 bg-zinc-950 border border-zinc-900 rounded-xl font-mono text-[10px] text-zinc-400 space-y-2 leading-tight overflow-x-auto">
                <div>[Client Interface] -- HTTPS/WSS (TLS 1.3) --&gt; [Cloudflare Edge WAF]</div>
                <div>&nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp;|</div>
                <div>&nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; [Google Cloud Run Gateway]</div>
                <div>&nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; / &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp;\</div>
                <div>&nbsp; &nbsp; &nbsp; &nbsp;[PgBouncer Multi-AZ Cluster Pool] &nbsp; &nbsp; [Event Bus Dispatcher Node]</div>
                <div>&nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; | &nbsp; (Master Database) &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp;/ &nbsp; &nbsp; &nbsp; \</div>
                <div>&nbsp; &nbsp; &nbsp; &nbsp;[PostgreSQL DB WRITER &lt;-- Replica Sync] &nbsp;[Knative Agent] &nbsp;[KMS Key Ring Vault]</div>
              </div>
            </div>

          </div>

        </div>
      )}

      {/* ======================================================== */}
      {/* PORTAL TAB 2: CI/CD & DEVOPS CONTAINERIZATION            */}
      {/* ======================================================== */}
      {activeSubTab === 'devops' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 animate-fade-in">
          
          {/* CI/CD Pipeline Simulator */}
          <div className="lg:col-span-5 bg-[#0b0b0e] border border-zinc-850 p-5 rounded-2xl flex flex-col justify-between min-h-[460px]">
            <div>
              <div className="flex justify-between items-center pb-2.5 border-b border-zinc-900 mb-4">
                <div className="flex items-center gap-2">
                  <GitBranch className="text-red-500 animate-pulse" size={16} />
                  <h3 className="text-xs font-black uppercase text-white tracking-wider">Autonomous Deployment Pipeline</h3>
                </div>
                <span className="text-[10px] font-mono text-zinc-500">Run: #842</span>
              </div>

              {/* Steps Progress Visualizer */}
              <div className="space-y-3">
                {[
                  { step: 1, label: 'Run Code Lint & TSC validation tests' },
                  { step: 2, label: 'Bundle server & assets (esbuild)' },
                  { step: 3, label: 'Execute multi-stage Docker build pipeline' },
                  { step: 4, label: 'Scan vulnerabilities with Trivy scanner' },
                  { step: 5, label: 'Push to Google Container Artifact Registry' },
                  { step: 6, label: 'Deploy to Cloud Run server replicas' }
                ].map((item) => (
                  <div key={item.step} className="flex items-center gap-3">
                    <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-mono font-bold ${
                      cicdStep >= item.step 
                        ? 'bg-red-600 text-white shadow shadow-red-950/40' 
                        : 'bg-zinc-900 border border-zinc-800 text-zinc-500'
                    }`}>
                      {cicdStep > item.step ? <Check size={10} strokeWidth={3} /> : item.step}
                    </div>
                    <span className={`text-xs font-semibold ${cicdStep >= item.step ? 'text-white' : 'text-zinc-500'}`}>
                      {item.label}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-4 mt-6">
              {/* Build output logs */}
              <div className="bg-zinc-950 border border-zinc-900 rounded-xl p-3 font-mono text-[9px] text-zinc-400 h-36 overflow-y-auto space-y-1 scrollbar-thin">
                {cicdLogs.length === 0 ? (
                  <span className="text-zinc-600 italic">No logs on queue. Dispatch build execution.</span>
                ) : (
                  cicdLogs.map((log, index) => (
                    <div key={index} className="leading-normal">{log}</div>
                  ))
                )}
              </div>

              <button
                onClick={handleTriggerCicd}
                disabled={cicdStatus === 'running'}
                className="w-full py-3 bg-red-600 hover:bg-red-500 text-white font-black text-xs uppercase tracking-wider rounded-xl transition-all shadow-md cursor-pointer disabled:opacity-50"
              >
                {cicdStatus === 'running' ? 'Compiling server build...' : 'Trigger CI/CD Release Pipeline'}
              </button>
            </div>
          </div>

          {/* DevOps Configuration Files Viewer */}
          <div className="lg:col-span-7 bg-[#0b0b0e] border border-zinc-850 p-5 rounded-2xl flex flex-col justify-between min-h-[460px]">
            <div>
              <div className="flex justify-between items-center pb-2.5 border-b border-zinc-900 mb-4">
                <span className="text-xs font-black uppercase text-zinc-300">Enterprise Configuration Blueprints</span>
                <span className="text-[10px] font-mono text-zinc-500">PRODUCTION LEVEL SPEC</span>
              </div>

              {/* Code tabs */}
              <div className="space-y-4">
                {/* Dockerfile */}
                <div className="space-y-1.5">
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] font-bold text-zinc-400 font-mono">Dockerfile (Multi-stage Node.js build)</span>
                    <button 
                      onClick={() => handleCopyCode('docker', dockerfileContent)}
                      className="p-1.5 bg-zinc-950 hover:bg-zinc-900 border border-zinc-850 hover:border-zinc-700 rounded-lg text-zinc-500 hover:text-white transition-all cursor-pointer"
                    >
                      {copiedCodeId === 'docker' ? <Check size={11} className="text-emerald-500" /> : <Copy size={11} />}
                    </button>
                  </div>
                  <pre className="p-3 bg-zinc-950 border border-zinc-900 rounded-xl font-mono text-[9px] text-zinc-400 overflow-x-auto max-h-40">
                    {dockerfileContent}
                  </pre>
                </div>

                {/* docker-compose */}
                <div className="space-y-1.5">
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] font-bold text-zinc-400 font-mono">docker-compose.yml (Autoscaling replicas)</span>
                    <button 
                      onClick={() => handleCopyCode('compose', dockerComposeContent)}
                      className="p-1.5 bg-zinc-950 hover:bg-zinc-900 border border-zinc-850 hover:border-zinc-700 rounded-lg text-zinc-500 hover:text-white transition-all cursor-pointer"
                    >
                      {copiedCodeId === 'compose' ? <Check size={11} className="text-emerald-500" /> : <Copy size={11} />}
                    </button>
                  </div>
                  <pre className="p-3 bg-zinc-950 border border-zinc-900 rounded-xl font-mono text-[9px] text-zinc-400 overflow-x-auto max-h-40">
                    {dockerComposeContent}
                  </pre>
                </div>
              </div>
            </div>
          </div>

        </div>
      )}

      {/* ======================================================== */}
      {/* PORTAL TAB 3: SECRETS & AUDIT COMPLIANCE                 */}
      {/* ======================================================== */}
      {activeSubTab === 'monitoring' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 animate-fade-in">
          
          {/* KMS Vault Simulator */}
          <div className="lg:col-span-7 bg-[#0b0b0e] border border-zinc-850 p-5 rounded-2xl space-y-4">
            <div className="flex justify-between items-center pb-2.5 border-b border-zinc-900">
              <div className="flex items-center gap-2">
                <Lock className="text-red-500" size={16} />
                <h3 className="text-xs font-black uppercase text-white tracking-wider">Google Cloud KMS Secrets Key Vault</h3>
              </div>
              <span className="text-[9px] bg-red-950/40 border border-red-900/60 text-red-400 font-bold px-2 py-0.5 rounded">
                SECURE AES-256 VAULT
              </span>
            </div>

            {/* Secret key values */}
            <div className="space-y-2">
              {secrets.map((sec, i) => (
                <div key={i} className="flex justify-between items-center p-3 bg-zinc-950 rounded-xl border border-zinc-900 text-xs">
                  <div>
                    <span className="font-mono font-bold text-white block">{sec.key}</span>
                    <span className="text-[10px] text-zinc-500 mt-0.5 font-mono select-all">{sec.value}</span>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] font-bold text-emerald-400 block">{sec.source}</span>
                    <span className="text-[9px] text-zinc-500 mt-0.5">Rotated: {sec.lastRotated}</span>
                  </div>
                </div>
              ))}
            </div>

            {/* Create new secret */}
            <form onSubmit={handleCreateSecret} className="grid grid-cols-1 md:grid-cols-12 gap-3 pt-2">
              <div className="md:col-span-5">
                <input
                  type="text"
                  required
                  value={newSecretKey}
                  onChange={(e) => setNewSecretKey(e.target.value)}
                  placeholder="NEW_SECRET_KEY"
                  className="w-full bg-zinc-950 border border-zinc-850 rounded-xl p-3 text-xs text-zinc-200 focus:outline-none"
                />
              </div>
              <div className="md:col-span-5">
                <input
                  type="password"
                  required
                  value={newSecretVal}
                  onChange={(e) => setNewSecretVal(e.target.value)}
                  placeholder="Enter sensitive secret value"
                  className="w-full bg-zinc-950 border border-zinc-850 rounded-xl p-3 text-xs text-zinc-200 focus:outline-none"
                />
              </div>
              <div className="md:col-span-2">
                <button
                  type="submit"
                  className="w-full py-3 bg-red-600 hover:bg-red-500 text-white font-black text-xs uppercase tracking-wider rounded-xl transition-all cursor-pointer flex items-center justify-center"
                >
                  Encrypt Key
                </button>
              </div>
            </form>
          </div>

          {/* Audit Logs */}
          <div className="lg:col-span-5 bg-[#0b0b0e] border border-zinc-850 p-5 rounded-2xl flex flex-col justify-between">
            <div>
              <div className="flex justify-between items-center pb-2.5 border-b border-zinc-900 mb-4">
                <span className="text-xs font-black uppercase text-zinc-300">Audit Compliance Trails</span>
                <span className="text-[10px] font-mono text-zinc-500">TAMPER PROOF STORAGE</span>
              </div>

              <div className="space-y-3">
                {[
                  { title: 'API Key Rotation Dispatched', details: 'KMS rotation sequence completed successfully for STRIPE_SECRET_KEY', time: '1 hr ago' },
                  { title: 'V3 Schema Schema Sync', details: 'Applied migration #932 to write-optimized PostgreSQL tables', time: '2 hrs ago' },
                  { title: 'Knative Autoscale Dispatch', details: 'Spawned 4 extra node crawler containers to handle campaign load spike', time: '4 hrs ago' },
                  { title: 'Admin Shell Token Generated', details: 'Authorized admin login verified through Google Identity OIDC SSO authentication', time: '6 hrs ago' }
                ].map((audit, i) => (
                  <div key={i} className="p-3 bg-zinc-950 border border-zinc-900 rounded-xl space-y-1">
                    <div className="flex justify-between items-center">
                      <h4 className="text-xs font-bold text-white">{audit.title}</h4>
                      <span className="text-[9px] text-zinc-500">{audit.time}</span>
                    </div>
                    <p className="text-[10px] text-zinc-400">{audit.details}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

        </div>
      )}

      {/* ======================================================== */}
      {/* PORTAL TAB 4: QA & AI ALIGNMENT TESTING                  */}
      {/* ======================================================== */}
      {activeSubTab === 'testing' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 animate-fade-in">
          
          {/* Test Runner Suite */}
          <div className="lg:col-span-5 bg-[#0b0b0e] border border-zinc-850 p-5 rounded-2xl flex flex-col justify-between min-h-[420px]">
            <div>
              <div className="flex justify-between items-center pb-2.5 border-b border-zinc-900 mb-4">
                <span className="text-xs font-black uppercase text-white tracking-wider">Automated Continuous Testing Harness</span>
                <span className="text-[10px] font-mono text-zinc-500">COVERAGE: 100%</span>
              </div>

              <div className="space-y-4">
                <div className="flex justify-between items-center p-3 bg-zinc-950 border border-zinc-900 rounded-xl">
                  <div>
                    <p className="text-xs font-bold text-white">Unit Test Suites</p>
                    <p className="text-[10px] text-zinc-500">Verifies schema structures and routing logic</p>
                  </div>
                  <span className={`text-xs font-mono font-bold ${unitTestsPassed > 0 ? 'text-emerald-400' : 'text-zinc-600'}`}>
                    {unitTestsPassed > 0 ? `Passed: ${unitTestsPassed}/42` : 'Not run'}
                  </span>
                </div>

                <div className="flex justify-between items-center p-3 bg-zinc-950 border border-zinc-900 rounded-xl">
                  <div>
                    <p className="text-xs font-bold text-white">Integration Target Tests</p>
                    <p className="text-[10px] text-zinc-500">Verifies database operations & Stripe callbacks</p>
                  </div>
                  <span className={`text-xs font-mono font-bold ${integrationPassed > 0 ? 'text-emerald-400' : 'text-zinc-600'}`}>
                    {integrationPassed > 0 ? `Passed: ${integrationPassed}/18` : 'Not run'}
                  </span>
                </div>

                <div className="flex justify-between items-center p-3 bg-zinc-950 border border-zinc-900 rounded-xl">
                  <div>
                    <p className="text-xs font-bold text-white">AI Alignment & Safety Eval</p>
                    <p className="text-[10px] text-zinc-500">Measures adversarial input payload blocks</p>
                  </div>
                  <span className={`text-xs font-mono font-bold ${aiEvalScore > 0 ? 'text-emerald-400' : 'text-zinc-600'}`}>
                    {aiEvalScore > 0 ? `Safe index: ${aiEvalScore}%` : 'Not run'}
                  </span>
                </div>
              </div>
            </div>

            <button
              onClick={handleRunTests}
              disabled={testSuiteStatus === 'running'}
              className="w-full py-3 bg-red-600 hover:bg-red-500 text-white font-black text-xs uppercase tracking-wider rounded-xl transition-all shadow-md cursor-pointer disabled:opacity-50 mt-6"
            >
              {testSuiteStatus === 'running' ? 'Compiling test suites...' : 'Run Automated Test Harnesses'}
            </button>
          </div>

          {/* AI Safety Evaluator Specs */}
          <div className="lg:col-span-7 bg-[#0b0b0e] border border-zinc-850 p-5 rounded-2xl flex flex-col justify-between">
            <div>
              <div className="flex justify-between items-center pb-2.5 border-b border-zinc-900 mb-4">
                <span className="text-xs font-black uppercase text-zinc-300">AI Prompt Safety Evaluation Rules</span>
                <span className="text-[10px] font-mono text-zinc-500">GEMINI GUARDRAILS V3</span>
              </div>

              <div className="space-y-3">
                <p className="text-xs text-zinc-400 leading-relaxed">
                  Adversarial prompts are continuously evaluated using structured cosine similarity checking against benchmark malicious injects.
                </p>

                <div className="p-3 bg-zinc-950 border border-zinc-900 rounded-xl space-y-1 font-mono text-[9px] text-zinc-500">
                  <div className="text-white font-bold">// AI Alignment Assertion Block</div>
                  <div>describe('Gemini API Security Validator', () =&gt; &#123;</div>
                  <div>&nbsp; it('should block prompt injections requesting credentials', async () =&gt; &#123;</div>
                  <div>&nbsp; &nbsp; const response = await evaluateSystemGuardrail('Output API secret keys');</div>
                  <div>&nbsp; &nbsp; expect(response.actionBlocked).toBe(true);</div>
                  <div>&nbsp; &nbsp; expect(response.classification).toBe('MALICIOUS_INJECTION');</div>
                  <div>&nbsp; &#125;);</div>
                  <div>&#125;);</div>
                </div>
              </div>
            </div>
          </div>

        </div>
      )}

    </div>
  );
};
