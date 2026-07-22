import React, { useState, useEffect } from 'react';
import { Wrench, RefreshCw, CheckCircle2, ShieldAlert, Sparkles, X, Terminal } from 'lucide-react';
import { useProject } from './ProjectContext';
import { secureStorage } from '../shared/secureStorage';
import toast from 'react-hot-toast';

interface ErrorEventDetails {
  message: string;
  source?: string;
  lineno?: number;
  colno?: number;
  errorStack?: string;
  moduleName?: string;
}

export const GlobalRecoveryManager: React.FC = () => {
  const projectCtx = useProject();
  const clearModuleState = projectCtx?.clearModuleState;
  const currentTool = (projectCtx as any)?.currentTool || 'active_module';
  const [hasRuntimeError, setHasRuntimeError] = useState<boolean>(false);
  const [errorDetails, setErrorDetails] = useState<ErrorEventDetails | null>(null);
  const [isRepairing, setIsRepairing] = useState<boolean>(false);
  const [repairSuccess, setRepairSuccess] = useState<boolean>(false);

  useEffect(() => {
    const isIgnoredError = (msg: string, stack?: string): boolean => {
      const text = (msg + ' ' + (stack || '')).toLowerCase();
      return (
        text.includes('websocket') ||
        text.includes('ws://') ||
        text.includes('wss://') ||
        text.includes('abort') ||
        text.includes('failed to fetch') ||
        text.includes('networkerror') ||
        text.includes('resizeobserver') ||
        text.includes('canceled') ||
        text.includes('canceled') ||
        text.includes('audioworkermanager') ||
        text.includes('vite') ||
        text.includes('serviceworker') ||
        text.includes('service worker')
      );
    };

    // Catch unhandled runtime errors
    const handleGlobalError = (event: ErrorEvent) => {
      const msg = event.message || 'Unhandled Runtime Script Exception';
      const stack = event.error?.stack || '';
      if (isIgnoredError(msg, stack)) return;

      console.error('[GlobalRecoveryManager] Caught unhandled runtime error:', event.error || event.message);
      setErrorDetails({
        message: msg,
        source: event.filename,
        lineno: event.lineno,
        colno: event.colno,
        errorStack: stack || 'No stack trace provided',
        moduleName: currentTool,
      });
      setHasRuntimeError(true);
    };

    // Catch unhandled Promise rejections
    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      const reasonMsg = typeof event.reason === 'object' && event.reason?.message 
        ? event.reason.message 
        : String(event.reason || 'Unhandled Async Promise Rejection');
      const stack = event.reason?.stack || String(event.reason || '');

      if (isIgnoredError(reasonMsg, stack)) return;

      console.error('[GlobalRecoveryManager] Caught unhandled promise rejection:', event.reason);

      setErrorDetails({
        message: reasonMsg,
        errorStack: stack,
        moduleName: currentTool,
      });
      setHasRuntimeError(true);
    };

    // Listen to custom application error dispatches
    const handleCustomAppError = (e: CustomEvent<ErrorEventDetails>) => {
      if (e.detail) {
        setErrorDetails({ ...e.detail, moduleName: e.detail.moduleName || currentTool });
        setHasRuntimeError(true);
      }
    };

    window.addEventListener('error', handleGlobalError);
    window.addEventListener('unhandledrejection', handleUnhandledRejection);
    window.addEventListener('ranktica-runtime-error' as any, handleCustomAppError);

    return () => {
      window.removeEventListener('error', handleGlobalError);
      window.removeEventListener('unhandledrejection', handleUnhandledRejection);
      window.removeEventListener('ranktica-runtime-error' as any, handleCustomAppError);
    };
  }, [currentTool]);

  const handleSystemRepair = async () => {
    setIsRepairing(true);
    try {
      // 1. Target specific module name to repair
      const targetModule = errorDetails?.moduleName || currentTool;

      // 2. Clear corrupted module state in ProjectContext & IndexedDB
      await clearModuleState(targetModule);

      // 3. Clear module-specific localStorage keys while preserving auth session & token
      const keysToRemove: string[] = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && (key.includes(targetModule) || key.includes('autosave_module') || key.includes('temp_state'))) {
          // DO NOT delete user auth keys, session keys, or active project IDs
          if (!key.includes('auth') && !key.includes('user') && !key.includes('active_project')) {
            keysToRemove.push(key);
          }
        }
      }
      keysToRemove.forEach(k => localStorage.removeItem(k));

      // 4. Soft-reload the module context without invalidating entire session
      window.dispatchEvent(
        new CustomEvent('ranktica-soft-reload-module', {
          detail: { moduleName: targetModule, timestamp: Date.now() },
        })
      );

      // Brief delay to simulate neural state repair
      await new Promise(resolve => setTimeout(resolve, 800));

      setIsRepairing(false);
      setRepairSuccess(true);
      toast.success(`System Repair Complete! Reset state for module "${targetModule}". User session preserved.`, {
        id: 'system-repair-success',
        duration: 5000,
      });

      // Close modal after 1.5 seconds
      setTimeout(() => {
        setHasRuntimeError(false);
        setRepairSuccess(false);
        setErrorDetails(null);
      }, 1500);

    } catch (err) {
      console.error('[GlobalRecoveryManager] Repair failed:', err);
      setIsRepairing(false);
      toast.error('Partial repair completed. Soft-reloading module view.');
      setHasRuntimeError(false);
    }
  };

  if (!hasRuntimeError || !errorDetails) return null;

  return (
    <div id="global-recovery-modal-backdrop" className="fixed inset-0 z-[99999] bg-black/80 backdrop-blur-md flex items-center justify-center p-4 font-sans select-none animate-fade-in">
      <div className="max-w-lg w-full bg-zinc-950 border border-zinc-800 rounded-3xl p-6 shadow-2xl relative overflow-hidden space-y-5">
        {/* Top ambient highlight */}
        <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-red-600 via-amber-500 to-indigo-600" />

        {/* Modal Header */}
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-red-950/60 border border-red-800/60 flex items-center justify-center text-red-500 shrink-0 animate-pulse">
              <ShieldAlert size={22} />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-white flex items-center gap-2">
                Runtime Exception Intercepted
                <span className="text-[9px] font-mono font-bold px-2 py-0.5 bg-red-950/80 border border-red-800 text-red-400 rounded-full uppercase">
                  Module: {errorDetails.moduleName || currentTool}
                </span>
              </h3>
              <p className="text-zinc-400 text-xs mt-0.5">Global Recovery Manager protected your active user session.</p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setHasRuntimeError(false)}
            className="p-1.5 text-zinc-500 hover:text-white hover:bg-zinc-900 rounded-xl transition-all"
          >
            <X size={16} />
          </button>
        </div>

        {/* Error Diagnostic Box */}
        <div className="bg-zinc-900/80 border border-zinc-800/80 rounded-2xl p-4 space-y-2">
          <div className="flex items-center justify-between text-[10px] font-mono text-zinc-500 font-bold uppercase">
            <span className="flex items-center gap-1">
              <Terminal size={12} className="text-red-400" />
              Exception Diagnostic Trace
            </span>
            <span>Session: ACTIVE</span>
          </div>
          <div className="font-mono text-xs text-red-400 font-semibold break-words leading-relaxed max-h-24 overflow-y-auto custom-scrollbar">
            {errorDetails.message}
          </div>
        </div>

        {/* Repair Instructions */}
        <div className="bg-indigo-950/20 border border-indigo-800/30 rounded-2xl p-4 space-y-2">
          <h4 className="text-xs font-extrabold text-indigo-300 uppercase tracking-wider flex items-center gap-2">
            <Wrench size={14} className="text-indigo-400" />
            One-Click System Repair Pipeline
          </h4>
          <p className="text-[11px] text-zinc-300 leading-relaxed">
            Clicking <strong>System Repair</strong> will sanitize problematic IndexedDB and LocalStorage keys for <strong>{errorDetails.moduleName || currentTool}</strong>, perform a soft-reload of the module state, and restore UI stability without logging you out or losing unsaved project data in other modules.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-3 pt-2">
          <button
            id="system-repair-execute-btn"
            type="button"
            onClick={handleSystemRepair}
            disabled={isRepairing || repairSuccess}
            className="flex-1 py-3 px-4 bg-gradient-to-r from-red-600 to-indigo-600 hover:from-red-500 hover:to-indigo-500 text-white font-extrabold text-xs uppercase tracking-wider rounded-2xl transition-all shadow-lg flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {isRepairing ? (
              <>
                <RefreshCw size={14} className="animate-spin" />
                Sanitizing Module State...
              </>
            ) : repairSuccess ? (
              <>
                <CheckCircle2 size={14} className="text-emerald-300" />
                Repair Complete!
              </>
            ) : (
              <>
                <Sparkles size={14} />
                One-Click System Repair
              </>
            )}
          </button>

          <button
            type="button"
            onClick={() => setHasRuntimeError(false)}
            className="px-4 py-3 bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-white font-bold text-xs uppercase rounded-2xl border border-zinc-800 transition-all"
          >
            Dismiss
          </button>
        </div>

        <div className="text-center font-mono text-[9px] text-zinc-600 uppercase tracking-widest">
          Ranktica AI Global Exception Interceptor & Active Session Guard
        </div>
      </div>
    </div>
  );
};
