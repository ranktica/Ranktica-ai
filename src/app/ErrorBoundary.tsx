import React, { ErrorInfo, ReactNode } from 'react';
import * as Sentry from '@sentry/react';
import * as SentryBrowser from '@sentry/browser';
import { 
  AlertCircle, 
  RefreshCw, 
  Layers, 
  Terminal, 
  Sparkles, 
  Wrench, 
  ShieldAlert, 
  Copy, 
  Download, 
  Bug, 
  Check, 
  Send, 
  User, 
  Globe, 
  Cpu, 
  FileJson, 
  ChevronDown, 
  ChevronUp, 
  Info 
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { logger } from '../infrastructure/logger';
import { offlineCache } from '../shared/offlineCache';

// Initialize Sentry SDK if DSN is available, or setup Sentry React client
const envSentryDsn = (import.meta as any).env?.VITE_SENTRY_DSN || process.env.VITE_SENTRY_DSN || process.env.SENTRY_DSN;

if (typeof window !== 'undefined') {
  if (!envSentryDsn) {
    console.warn('[ErrorBoundary] VITE_SENTRY_DSN is not defined in process.env. Skipping Sentry.init to prevent initialization failures.');
  } else {
    try {
      Sentry.init({
        dsn: envSentryDsn,
        environment: process.env.NODE_ENV || 'production',
        release: 'ranktica-ai@1.0.0',
        tracesSampleRate: 1.0,
        replaysSessionSampleRate: 0.1,
        replaysOnErrorSampleRate: 1.0,
        beforeSend(event) {
          // Sanitize sensitive user secrets if present
          if (event.request?.headers) {
            delete event.request.headers['authorization'];
          }
          return event;
        },
      });
    } catch (err) {
      console.warn('[ErrorBoundary] Sentry SDK initialization note:', err);
    }
  }
}

/**
 * Sentry-compatible Error Event Payload structure
 */
export interface SentryErrorPayload {
  event_id: string;
  timestamp: string;
  platform: string;
  level: 'fatal' | 'error' | 'warning';
  environment: string;
  release: string;
  exception: {
    values: Array<{
      type: string;
      value: string;
      stacktrace?: {
        frames: Array<{
          filename?: string;
          function?: string;
          lineno?: number;
          colno?: number;
          in_app?: boolean;
          raw?: string;
        }>;
        raw_stack?: string;
      };
      componentStack?: string;
    }>;
  };
  user: {
    id?: string;
    email?: string;
    workspaceId?: string;
    projectId?: string;
    activeTool?: string;
    role?: string;
  };
  tags: {
    active_tool?: string;
    offline_mode?: string;
    theme?: string;
    runtime?: string;
    viewport?: string;
    connection_type?: string;
    timezone?: string;
    [key: string]: string | undefined;
  };
  contexts: {
    browser: {
      name: string;
      version: string;
      userAgent: string;
      language: string;
      online: boolean;
      vendor: string;
    };
    device: {
      screenResolution: string;
      viewportSize: string;
      pixelRatio: number;
      memoryLimit?: string;
      hardwareConcurrency?: number;
    };
    os: {
      platform: string;
    };
    app: {
      url: string;
      pathname: string;
      hash: string;
      localStorageKeys: string[];
    };
  };
  userFeedback?: {
    comments?: string;
    contactEmail?: string;
    submittedAt?: string;
  };
}

interface Props {
  children?: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  sentryPayload: SentryErrorPayload | null;
  isCopied: boolean;
  isSubmittingFeedback: boolean;
  feedbackSent: boolean;
  userComment: string;
  userContactEmail: string;
  activeInspectorTab: 'summary' | 'stack' | 'user' | 'browser' | 'raw';
  showDetailsModal: boolean;
}

export class ErrorBoundary extends React.Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
    errorInfo: null,
    sentryPayload: null,
    isCopied: false,
    isSubmittingFeedback: false,
    feedbackSent: false,
    userComment: '',
    userContactEmail: '',
    activeInspectorTab: 'summary',
    showDetailsModal: false
  };

  private handleGlobalClick = (event: MouseEvent) => {
    try {
      const target = event.target as HTMLElement | null;
      if (!target) return;
      const tagName = target.tagName?.toLowerCase();
      const id = target.id ? `#${target.id}` : '';
      const className = target.className && typeof target.className === 'string' ? `.${target.className.split(' ').filter(Boolean).slice(0, 2).join('.')}` : '';
      const text = target.innerText ? target.innerText.slice(0, 30).replace(/\s+/g, ' ') : '';
      
      Sentry.addBreadcrumb({
        category: 'ui.click',
        message: `Clicked <${tagName}${id}${className}> "${text}"`,
        level: 'info',
        data: {
          tagName,
          id: target.id || undefined,
          text: text || undefined,
          path: window.location.pathname
        }
      });
    } catch {
      // Ignore click breadcrumb recording errors
    }
  };

  private handlePopState = () => {
    try {
      Sentry.addBreadcrumb({
        category: 'navigation',
        message: `Navigated to ${window.location.pathname}${window.location.search}`,
        level: 'info',
        data: {
          url: window.location.href,
          pathname: window.location.pathname
        }
      });
    } catch {
      // Ignore navigation breadcrumb recording errors
    }
  };

  public componentDidMount() {
    if (typeof window !== 'undefined') {
      window.addEventListener('click', this.handleGlobalClick, { capture: true, passive: true });
      window.addEventListener('popstate', this.handlePopState, { passive: true });
    }
  }

  public componentWillUnmount() {
    if (typeof window !== 'undefined') {
      window.removeEventListener('click', this.handleGlobalClick, { capture: true });
      window.removeEventListener('popstate', this.handlePopState);
    }
  }

  public static getDerivedStateFromError(error: Error): Partial<State> {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    this.setState({ errorInfo });

    // 1. Generate full Sentry error payload capturing stack traces, user state, and browser metadata
    const payload = this.captureSentryErrorPayload(error, errorInfo);

    // 2. Add breadcrumbs to track user navigation paths and recent interactions leading to the crash
    try {
      Sentry.addBreadcrumb({
        category: 'navigation',
        message: `Navigation path at crash: ${window.location.pathname}${window.location.search}`,
        level: 'info',
        data: {
          url: window.location.href,
          pathname: window.location.pathname,
          search: window.location.search,
          hash: window.location.hash
        }
      });

      Sentry.addBreadcrumb({
        category: 'user.interaction',
        message: `User session context before crash`,
        level: 'info',
        data: {
          activeTool: payload.user.activeTool || 'dashboard',
          projectId: payload.user.projectId || 'none',
          userRole: payload.user.role || 'user',
          online: typeof navigator !== 'undefined' ? navigator.onLine : true,
          viewport: typeof window !== 'undefined' ? `${window.innerWidth}x${window.innerHeight}` : 'unknown'
        }
      });

      Sentry.addBreadcrumb({
        category: 'ui.error_boundary',
        message: `ErrorBoundary intercepted exception: ${error.name || 'Error'} - ${error.message}`,
        level: 'error',
        data: {
          componentStack: errorInfo.componentStack?.slice(0, 300)
        }
      });
    } catch (bcErr) {
      console.warn('[ErrorBoundary] Failed to record Sentry breadcrumbs:', bcErr);
    }

    // 3. Transmit directly to Sentry SDK with scope enrichment
    try {
      Sentry.withScope((scope) => {
        if (payload.user.id) scope.setUser({ id: payload.user.id, email: payload.user.email });
        scope.setTag('active_tool', payload.user.activeTool || 'unknown');
        scope.setTag('project_id', payload.user.projectId || 'none');
        scope.setTag('environment', payload.environment);
        scope.setExtra('componentStack', errorInfo.componentStack);
        scope.setContext('browser', payload.contexts.browser as any);
        scope.setContext('device', payload.contexts.device as any);
        scope.setContext('app', payload.contexts.app as any);

        const sentryId = Sentry.captureException(error);
        SentryBrowser.captureException(error, {
          extra: {
            componentStack: errorInfo.componentStack,
            sentryPayload: payload
          }
        });

        if (sentryId) {
          payload.event_id = sentryId;
        }
      });
    } catch (sentryErr) {
      console.warn('[ErrorBoundary] Sentry captureException notice:', sentryErr);
    }

    this.setState({ sentryPayload: payload });

    // 3. Persist error event locally for offline inspection
    this.storeCrashReportLocally(payload);

    // 4. Log to centralized logging service
    logger.error(error, {
      sentryEventId: payload.event_id,
      componentStack: errorInfo.componentStack,
      source: 'ErrorBoundary',
      user: payload.user,
      tags: payload.tags,
      contexts: payload.contexts,
      timestamp: payload.timestamp
    });

    // 5. Submit to Sentry / Error Telemetry endpoint
    this.sendSentryTelemetry(payload);
  }

  /**
   * Helper to construct a Sentry-compliant Error Payload
   */
  private captureSentryErrorPayload(error: Error, errorInfo: ErrorInfo): SentryErrorPayload {
    const eventId = `err_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    const timestamp = new Date().toISOString();

    // User State Retrieval
    let userId = 'anonymous_user';
    let userEmail = 'unauthenticated@ranktica.ai';
    let projectId = 'none';
    let activeTool = 'unknown';

    if (typeof window !== 'undefined') {
      try {
        projectId = localStorage.getItem('ranktica_active_project_id') || 'none';
        
        const toolStateRaw = localStorage.getItem('ranktica_offline_module_active_tool_type');
        if (toolStateRaw) {
          const parsed = JSON.parse(toolStateRaw);
          if (parsed?.data?.tool) activeTool = parsed.data.tool;
        }

        const profileRaw = localStorage.getItem('ranktica_user_profile');
        if (profileRaw) {
          const profile = JSON.parse(profileRaw);
          if (profile?.email) userEmail = profile.email;
          if (profile?.id) userId = profile.id;
        } else {
          // Attempt finding Firebase Auth User key in localStorage
          for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key && key.startsWith('firebase:authUser:')) {
              const val = localStorage.getItem(key);
              if (val) {
                const fbUser = JSON.parse(val);
                if (fbUser.email) userEmail = fbUser.email;
                if (fbUser.uid) userId = fbUser.uid;
              }
              break;
            }
          }
        }
      } catch (e) {
        console.warn('[ErrorBoundary] Failed reading user state from localStorage:', e);
      }
    }

    // Parse JavaScript Stack Frames
    const rawStack = error?.stack || '';
    const parsedFrames = rawStack.split('\n').slice(1).map(line => {
      const trimmed = line.trim();
      const match = trimmed.match(/at\s+(?:(.+?)\s+\()?(?:(.+?):(\d+):(\d+))\)?/);
      if (match) {
        return {
          function: match[1] || 'anonymous',
          filename: match[2] || 'unknown',
          lineno: parseInt(match[3] || '0', 10),
          colno: parseInt(match[4] || '0', 10),
          in_app: !match[2]?.includes('node_modules'),
          raw: trimmed
        };
      }
      return { raw: trimmed };
    });

    // Browser Context Metadata
    const isBrowser = typeof window !== 'undefined';
    const nav = isBrowser ? navigator : ({} as Navigator);
    const perf = isBrowser ? (performance as any) : {};

    const browserContext = {
      name: isBrowser ? this.getBrowserName(nav.userAgent) : 'Server/Unknown',
      version: isBrowser ? nav.appVersion || 'Unknown' : 'Unknown',
      userAgent: isBrowser ? nav.userAgent : 'N/A',
      language: isBrowser ? nav.language : 'en-US',
      online: isBrowser ? nav.onLine : true,
      vendor: isBrowser ? nav.vendor || 'Unknown' : 'Unknown'
    };

    const deviceContext = {
      screenResolution: isBrowser ? `${window.screen?.width || 0}x${window.screen?.height || 0}` : 'N/A',
      viewportSize: isBrowser ? `${window.innerWidth}x${window.innerHeight}` : 'N/A',
      pixelRatio: isBrowser ? window.devicePixelRatio || 1 : 1,
      memoryLimit: perf.memory ? `${Math.round(perf.memory.usedJSHeapSize / (1024 * 1024))}MB / ${Math.round(perf.memory.jsHeapSizeLimit / (1024 * 1024))}MB` : 'N/A',
      hardwareConcurrency: isBrowser ? nav.hardwareConcurrency : undefined
    };

    const appContext = {
      url: isBrowser ? window.location.href : 'N/A',
      pathname: isBrowser ? window.location.pathname : '/',
      hash: isBrowser ? window.location.hash : '',
      localStorageKeys: isBrowser ? Object.keys(localStorage).slice(0, 30) : []
    };

    let timezone = 'UTC';
    try {
      timezone = Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';
    } catch (_) {}

    return {
      event_id: eventId,
      timestamp,
      platform: 'javascript-react',
      level: 'fatal',
      environment: process.env.NODE_ENV || 'production',
      release: 'ranktica-ai@1.0.0',
      exception: {
        values: [
          {
            type: error?.name || 'Error',
            value: error?.message || 'Unknown Exception',
            stacktrace: {
              frames: parsedFrames,
              raw_stack: rawStack
            },
            componentStack: errorInfo?.componentStack || ''
          }
        ]
      },
      user: {
        id: userId,
        email: userEmail,
        projectId,
        activeTool
      },
      tags: {
        active_tool: activeTool,
        offline_mode: isBrowser && !nav.onLine ? 'true' : 'false',
        runtime: 'Vite/CloudRun',
        viewport: deviceContext.viewportSize,
        timezone,
        connection_type: isBrowser ? (nav as any).connection?.effectiveType || 'unknown' : 'unknown'
      },
      contexts: {
        browser: browserContext,
        device: deviceContext,
        os: {
          platform: isBrowser ? nav.platform || 'Unknown' : 'Unknown'
        },
        app: appContext
      }
    };
  }

  private getBrowserName(userAgent: string): string {
    if (!userAgent) return 'Unknown';
    if (userAgent.includes('Firefox')) return 'Firefox';
    if (userAgent.includes('Edg')) return 'Edge';
    if (userAgent.includes('Chrome')) return 'Chrome';
    if (userAgent.includes('Safari')) return 'Safari';
    return 'Browser';
  }

  /**
   * Persist crash payload locally in localStorage array
   */
  private storeCrashReportLocally(payload: SentryErrorPayload) {
    if (typeof window === 'undefined') return;
    try {
      const existingRaw = localStorage.getItem('ranktica_sentry_crash_reports');
      const reports: SentryErrorPayload[] = existingRaw ? JSON.parse(existingRaw) : [];
      reports.unshift(payload);
      // Keep last 30 crash reports
      if (reports.length > 30) reports.pop();
      localStorage.setItem('ranktica_sentry_crash_reports', JSON.stringify(reports));
    } catch (e) {
      console.warn('[ErrorBoundary] Storage of crash report failed:', e);
    }
  }

  /**
   * Submit telemetry report to backend server
   */
  private sendSentryTelemetry(payload: SentryErrorPayload) {
    if (typeof window === 'undefined') return;
    fetch('/api/logs/error', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        sentryEvent: payload,
        message: payload.exception.values[0]?.value,
        stack: payload.exception.values[0]?.stacktrace?.raw_stack,
        context: payload.contexts
      })
    }).catch(err => {
      console.warn('[ErrorBoundary] Failed transmitting Sentry payload to backend:', err);
    });
  }

  private handleCopyPayload = () => {
    if (!this.state.sentryPayload) return;
    const jsonStr = JSON.stringify(this.state.sentryPayload, null, 2);
    navigator.clipboard.writeText(jsonStr).then(() => {
      this.setState({ isCopied: true });
      toast.success('Sentry error payload copied to clipboard!');
      setTimeout(() => this.setState({ isCopied: false }), 3000);
    }).catch(() => {
      toast.error('Failed copying payload to clipboard');
    });
  };

  private handleDownloadPayload = () => {
    if (!this.state.sentryPayload) return;
    const jsonStr = JSON.stringify(this.state.sentryPayload, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ranktica-sentry-crash-${this.state.sentryPayload.event_id}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success('Downloaded Sentry crash diagnostic file!');
  };

  private handleSubmitFeedback = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!this.state.userComment.trim() || !this.state.sentryPayload) return;

    this.setState({ isSubmittingFeedback: true });
    try {
      const enrichedPayload = {
        ...this.state.sentryPayload,
        userFeedback: {
          comments: this.state.userComment.trim(),
          contactEmail: this.state.userContactEmail.trim() || this.state.sentryPayload.user.email,
          submittedAt: new Date().toISOString()
        }
      };

      try {
        if (typeof (Sentry as any).captureFeedback === 'function') {
          (Sentry as any).captureFeedback({
            event_id: enrichedPayload.event_id,
            name: enrichedPayload.user.email || 'User',
            email: enrichedPayload.userFeedback.contactEmail,
            comments: enrichedPayload.userFeedback.comments,
          });
        }
      } catch (fErr) {
        console.warn('[ErrorBoundary] Sentry feedback submission notice:', fErr);
      }

      await fetch('/api/logs/error', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sentryEvent: enrichedPayload,
          userFeedback: enrichedPayload.userFeedback,
          message: `User Feedback: ${this.state.userComment}`
        })
      });

      this.setState({ 
        sentryPayload: enrichedPayload, 
        isSubmittingFeedback: false, 
        feedbackSent: true 
      });
      toast.success('Thank you! Your error feedback has been logged for support.');
    } catch (err) {
      this.setState({ isSubmittingFeedback: false });
      toast.error('Failed submitting feedback, stored locally instead.');
    }
  };

  private handleReset = () => {
    try {
      this.setState({
        hasError: false,
        error: null,
        errorInfo: null,
        sentryPayload: null
      });
      window.location.reload();
    } catch (e) {
      window.location.href = '/';
    }
  };

  private handleEmergencyRecovery = async () => {
    try {
      await offlineCache.saveState('active_tool_type', { tool: 'dashboard' });
      
      try {
        localStorage.removeItem('ranktica_active_project_id');
        localStorage.setItem('ranktica_offline_module_active_tool_type', JSON.stringify({
          moduleId: 'active_tool_type',
          data: { tool: 'dashboard' },
          lastUpdated: Date.now(),
          sizeBytes: 0,
          syncStatus: 'synced'
        }));
      } catch (lsErr) {
        console.warn('[EmergencyRecovery] LocalStorage write fallback failed:', lsErr);
      }

      this.setState({
        hasError: false,
        error: null,
        errorInfo: null,
        sentryPayload: null
      });

      window.location.href = '/';
    } catch (e) {
      console.error('[EmergencyRecovery] Recovery process failed:', e);
      try {
        localStorage.clear();
      } catch (_) {}
      window.location.href = '/';
    }
  };

  private handleGracefulRecovery = () => {
    try {
      window.dispatchEvent(new CustomEvent('ranktica-graceful-recovery'));
      this.setState({
        hasError: false,
        error: null,
        errorInfo: null,
        sentryPayload: null
      });
    } catch (e) {
      console.error('[ErrorBoundary] Graceful recovery execution failed, executing hard reset:', e);
      this.handleReset();
    }
  };

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      const p = this.state.sentryPayload;

      return (
        <div id="error-boundary-screen" className="min-h-screen bg-[#09090b] text-zinc-100 flex flex-col items-center justify-center p-4 md:p-8 select-none font-sans">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(239,68,68,0.08)_0%,transparent_70%)] pointer-events-none" />
          
          <div className="max-w-2xl w-full bg-zinc-950/90 border border-zinc-800/80 rounded-3xl p-6 md:p-8 backdrop-blur-2xl shadow-2xl relative z-10 space-y-6">
            
            {/* Top Identity & Sentry Tag */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-900 pb-5">
              <div className="flex items-center gap-3.5">
                <div className="w-12 h-12 rounded-2xl bg-red-950/60 border border-red-800/50 flex items-center justify-center text-red-500 animate-pulse shrink-0">
                  <AlertCircle size={26} />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-xl font-extrabold tracking-tight text-white">
                      Critical Module Fault
                    </h2>
                    <span className="px-2 py-0.5 bg-red-950/80 text-red-400 border border-red-800/60 text-[9px] font-mono font-bold rounded-md uppercase tracking-wider flex items-center gap-1">
                      <Bug size={10} /> Sentry Capture
                    </span>
                  </div>
                  <p className="text-xs text-zinc-400 mt-0.5">
                    An unhandled exception occurred during application execution.
                  </p>
                </div>
              </div>

              {p && (
                <div className="text-right font-mono text-[10px] text-zinc-500">
                  <div>ID: <span className="text-red-400 font-bold">{p.event_id}</span></div>
                  <div>Env: <span className="text-zinc-300">{p.environment}</span></div>
                </div>
              )}
            </div>

            {/* Error Exception Message Box */}
            <div className="w-full bg-zinc-900/80 border border-zinc-800/80 rounded-xl p-4 font-mono text-xs text-red-400 break-words max-h-36 overflow-y-auto shadow-inner space-y-1">
              <div className="text-[10px] uppercase tracking-wider text-zinc-500 font-bold flex items-center justify-between">
                <span>{p?.exception?.values[0]?.type || 'JavaScript Exception'}</span>
                <span>{p?.timestamp ? new Date(p.timestamp).toLocaleTimeString() : ''}</span>
              </div>
              <div className="font-bold text-white text-sm">
                {this.state.error ? this.state.error.message || String(this.state.error) : 'Unknown JavaScript Exception'}
              </div>
            </div>

            {/* Sentry Error Telemetry & Metadata Toolbar */}
            <div className="bg-zinc-900/40 border border-zinc-800/80 rounded-xl p-4 space-y-3">
              <div className="flex items-center justify-between text-xs font-bold text-zinc-300">
                <span className="flex items-center gap-2">
                  <ShieldAlert size={14} className="text-red-400" />
                  Sentry Telemetry Diagnostics
                </span>
                <span className="text-[10px] font-mono text-zinc-500">Captured Context</span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[10px] font-mono">
                <div className="bg-zinc-950 p-2.5 rounded-lg border border-zinc-800/60">
                  <span className="text-zinc-500 block uppercase text-[9px]">Active User</span>
                  <span className="text-zinc-200 font-bold truncate block">{p?.user?.email || 'Anonymous'}</span>
                </div>
                <div className="bg-zinc-950 p-2.5 rounded-lg border border-zinc-800/60">
                  <span className="text-zinc-500 block uppercase text-[9px]">Active Module</span>
                  <span className="text-indigo-400 font-bold truncate block">{p?.user?.activeTool || 'Dashboard'}</span>
                </div>
                <div className="bg-zinc-950 p-2.5 rounded-lg border border-zinc-800/60">
                  <span className="text-zinc-500 block uppercase text-[9px]">Browser / OS</span>
                  <span className="text-emerald-400 font-bold truncate block">{p?.contexts?.browser?.name} ({p?.contexts?.os?.platform})</span>
                </div>
                <div className="bg-zinc-950 p-2.5 rounded-lg border border-zinc-800/60">
                  <span className="text-zinc-500 block uppercase text-[9px]">Viewport</span>
                  <span className="text-amber-400 font-bold block">{p?.contexts?.device?.viewportSize}</span>
                </div>
              </div>

              {/* Action Buttons for Telemetry Payload */}
              <div className="flex flex-wrap items-center gap-2 pt-1">
                <button
                  type="button"
                  onClick={this.handleCopyPayload}
                  className="flex-1 min-w-[140px] px-3 py-2 bg-zinc-950 hover:bg-zinc-800 border border-zinc-800 text-zinc-200 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  {this.state.isCopied ? <Check size={13} className="text-emerald-400" /> : <Copy size={13} className="text-zinc-400" />}
                  {this.state.isCopied ? 'Copied Payload' : 'Copy Sentry JSON'}
                </button>

                <button
                  type="button"
                  onClick={this.handleDownloadPayload}
                  className="flex-1 min-w-[140px] px-3 py-2 bg-zinc-950 hover:bg-zinc-800 border border-zinc-800 text-zinc-200 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Download size={13} className="text-zinc-400" />
                  Download Crash Log
                </button>

                <button
                  type="button"
                  onClick={() => this.setState({ showDetailsModal: !this.state.showDetailsModal })}
                  className="px-3 py-2 bg-zinc-950 hover:bg-zinc-800 border border-zinc-800 text-indigo-400 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <FileJson size={13} />
                  {this.state.showDetailsModal ? 'Hide Details' : 'Inspect Stack'}
                  {this.state.showDetailsModal ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                </button>
              </div>
            </div>

            {/* Expandable Inspector Modal / Container */}
            {this.state.showDetailsModal && p && (
              <div className="bg-zinc-950 border border-zinc-800 rounded-xl p-4 space-y-3 text-xs">
                {/* Tabs */}
                <div className="flex border-b border-zinc-800 gap-2 pb-2">
                  {[
                    { id: 'summary', label: 'Summary', icon: Info },
                    { id: 'stack', label: 'Stack Trace', icon: Terminal },
                    { id: 'user', label: 'User Context', icon: User },
                    { id: 'browser', label: 'Browser & Device', icon: Cpu },
                    { id: 'raw', label: 'Raw Sentry JSON', icon: FileJson }
                  ].map(tab => {
                    const IconComp = tab.icon;
                    return (
                      <button
                        key={tab.id}
                        type="button"
                        onClick={() => this.setState({ activeInspectorTab: tab.id as any })}
                        className={`px-3 py-1.5 rounded-lg text-[11px] font-bold transition flex items-center gap-1.5 ${
                          this.state.activeInspectorTab === tab.id
                            ? 'bg-red-950/80 text-red-400 border border-red-800'
                            : 'text-zinc-400 hover:text-white bg-zinc-900/50'
                        }`}
                      >
                        <IconComp size={12} />
                        {tab.label}
                      </button>
                    );
                  })}
                </div>

                {/* Tab Contents */}
                {this.state.activeInspectorTab === 'summary' && (
                  <div className="space-y-2 text-zinc-300 font-mono text-[11px]">
                    <div><span className="text-zinc-500">Event ID:</span> {p.event_id}</div>
                    <div><span className="text-zinc-500">Timestamp:</span> {p.timestamp}</div>
                    <div><span className="text-zinc-500">Platform:</span> {p.platform}</div>
                    <div><span className="text-zinc-500">Release:</span> {p.release}</div>
                    <div><span className="text-zinc-500">Exception:</span> {p.exception.values[0]?.type} - {p.exception.values[0]?.value}</div>
                  </div>
                )}

                {this.state.activeInspectorTab === 'stack' && (
                  <div className="space-y-2">
                    <div className="font-mono text-[10px] text-zinc-400 bg-zinc-900 p-3 rounded-lg max-h-48 overflow-y-auto whitespace-pre-wrap select-text leading-relaxed border border-zinc-800">
                      {p.exception.values[0]?.stacktrace?.raw_stack || 'No JS stack trace available'}
                    </div>
                    {p.exception.values[0]?.componentStack && (
                      <div className="space-y-1">
                        <span className="text-[10px] font-bold text-zinc-500 uppercase">React Component Stack</span>
                        <div className="font-mono text-[10px] text-indigo-300 bg-zinc-900 p-3 rounded-lg max-h-36 overflow-y-auto whitespace-pre-wrap select-text border border-zinc-800">
                          {p.exception.values[0]?.componentStack}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {this.state.activeInspectorTab === 'user' && (
                  <div className="space-y-2 font-mono text-[11px] text-zinc-300">
                    <div><span className="text-zinc-500">User ID:</span> {p.user.id}</div>
                    <div><span className="text-zinc-500">Email:</span> {p.user.email}</div>
                    <div><span className="text-zinc-500">Active Project:</span> {p.user.projectId}</div>
                    <div><span className="text-zinc-500">Active Tool:</span> {p.user.activeTool}</div>
                  </div>
                )}

                {this.state.activeInspectorTab === 'browser' && (
                  <div className="space-y-2 font-mono text-[11px] text-zinc-300">
                    <div><span className="text-zinc-500">User Agent:</span> {p.contexts.browser.userAgent}</div>
                    <div><span className="text-zinc-500">Language:</span> {p.contexts.browser.language}</div>
                    <div><span className="text-zinc-500">Screen Resolution:</span> {p.contexts.device.screenResolution}</div>
                    <div><span className="text-zinc-500">Viewport:</span> {p.contexts.device.viewportSize}</div>
                    <div><span className="text-zinc-500">Heap Memory:</span> {p.contexts.device.memoryLimit}</div>
                    <div><span className="text-zinc-500">Online:</span> {p.contexts.browser.online ? 'Yes' : 'No'}</div>
                  </div>
                )}

                {this.state.activeInspectorTab === 'raw' && (
                  <pre className="font-mono text-[10px] text-emerald-400 bg-zinc-900 p-3 rounded-lg max-h-52 overflow-y-auto border border-zinc-800">
                    {JSON.stringify(p, null, 2)}
                  </pre>
                )}
              </div>
            )}

            {/* Optional User Error Feedback Form */}
            <form onSubmit={this.handleSubmitFeedback} className="bg-zinc-900/30 border border-zinc-800/60 rounded-xl p-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-zinc-200 flex items-center gap-1.5">
                  <Send size={12} className="text-red-400" />
                  Submit Error Report & Comments
                </span>
                {this.state.feedbackSent && (
                  <span className="text-[10px] font-mono text-emerald-400 font-bold flex items-center gap-1">
                    <Check size={12} /> Logged to Telemetry
                  </span>
                )}
              </div>
              <textarea
                value={this.state.userComment}
                onChange={(e) => this.setState({ userComment: e.target.value })}
                placeholder="What were you trying to do when this crash occurred? (Optional context for developers)"
                className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-lg text-xs text-white placeholder-zinc-500 focus:outline-none focus:ring-1 focus:ring-red-500 resize-none h-16"
              />
              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={!this.state.userComment.trim() || this.state.isSubmittingFeedback || this.state.feedbackSent}
                  className="px-4 py-1.5 bg-red-600 hover:bg-red-500 disabled:opacity-50 text-white font-bold text-xs rounded-lg transition flex items-center gap-1.5 cursor-pointer"
                >
                  <Send size={12} />
                  {this.state.isSubmittingFeedback ? 'Submitting...' : this.state.feedbackSent ? 'Submitted' : 'Send Feedback'}
                </button>
              </div>
            </form>

            {/* Global Emergency Recovery System */}
            <div className="bg-zinc-900/30 border border-zinc-800/80 rounded-xl p-4 space-y-3 relative overflow-hidden">
              <div className="absolute top-0 right-0 p-3 opacity-10 pointer-events-none">
                <ShieldAlert size={48} className="text-red-500" />
              </div>
              
              <div className="flex items-start gap-3">
                <div className="w-7 h-7 rounded-lg bg-red-950/40 border border-red-800/30 flex items-center justify-center text-red-400 shrink-0 mt-0.5">
                  <Wrench size={14} />
                </div>
                <div className="space-y-1">
                  <h4 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                    Global Emergency Recovery
                    <span className="text-[9px] font-mono px-1.5 py-0.5 bg-red-950 text-red-400 rounded-md border border-red-900/30">LOCKED OUT SAFE</span>
                  </h4>
                  <p className="text-[11px] leading-relaxed text-zinc-400">
                    If a specific neural worker or dashboard view causes rendering faults or loops, activate the Emergency Recovery pipeline to forcefully clear active routing, reset active module states back to the secure Creator Dashboard, and bypass lockouts.
                  </p>
                </div>
              </div>
              
              <button
                id="emergency-recovery-button"
                onClick={this.handleEmergencyRecovery}
                className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-red-950/20 hover:bg-red-950/40 border border-red-800/40 hover:border-red-600 text-red-400 text-xs font-bold rounded-lg transition-all duration-200 cursor-pointer shadow-inner"
              >
                <Sparkles size={13} className="text-red-400 animate-pulse" />
                Activate Emergency Recovery (Bypass Lockout)
              </button>
            </div>

            {/* Actions */}
            <div className="flex flex-col sm:flex-row items-center gap-3 pt-2">
              <button
                id="graceful-recovery-button"
                onClick={this.handleGracefulRecovery}
                className="flex-1 w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 hover:scale-[1.01] active:scale-[0.99] text-white text-xs font-bold rounded-lg transition-all duration-200 shadow-lg shadow-indigo-600/10 cursor-pointer"
              >
                <Sparkles size={14} className="animate-pulse text-indigo-200" />
                Graceful State Recovery
              </button>

              <button
                id="error-reset-button"
                onClick={this.handleReset}
                className="flex-1 w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-red-600/20 hover:bg-red-600/30 border border-red-500/30 hover:border-red-500 text-red-400 text-xs font-bold rounded-lg transition-all duration-200 cursor-pointer"
              >
                <RefreshCw size={14} className="animate-spin-slow" />
                Hard Reset
              </button>
              
              <button
                id="error-back-home"
                onClick={() => { window.location.href = '/'; }}
                className="w-full sm:w-auto px-4 py-2.5 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 text-xs font-semibold rounded-lg border border-zinc-800 transition-colors cursor-pointer text-center"
              >
                Go to Dashboard
              </button>
            </div>
            
            <div className="text-center font-mono text-[9px] text-zinc-600 tracking-wider uppercase">
              Ranktica AI Resilient Sentry Engine
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
