import React, { useState, useEffect } from 'react';
import { useProject } from '@/app/ProjectContext';
import { 
  CloudLightning, 
  Check, 
  AlertCircle, 
  Loader2, 
  ArrowRight, 
  Database, 
  Clock, 
  RefreshCw, 
  Wifi, 
  WifiOff, 
  List, 
  Trash2, 
  Cloud,
  Sparkles,
  Layers
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { toast } from 'react-hot-toast';

export const SyncStatus: React.FC = () => {
  const { 
    offlineQueue = [], 
    offlineQueueSize = 0, 
    isSyncing = false, 
    isOffline = false,
    lastAutoSavedAt = null,
    isAutoSaving = false,
    activeProject = null
  } = useProject() || {};

  const [wasOffline, setWasOffline] = useState<boolean>(false);
  const [showSyncBanner, setShowSyncBanner] = useState<boolean>(false);
  const [resyncSuccess, setResyncSuccess] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<'status' | 'pending'>('status');
  const [latency, setLatency] = useState<number | null>(null);
  const [isUnstable, setIsUnstable] = useState<boolean>(false);

  useEffect(() => {
    if (isOffline) {
      setLatency(null);
      setIsUnstable(false);
      return;
    }

    const checkLatency = async () => {
      const startTime = performance.now();
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 3500); // 3.5s timeout

        await fetch(`${window.location.origin}/index.html?cb=${Date.now()}`, {
          method: 'HEAD',
          signal: controller.signal,
          cache: 'no-store'
        });

        clearTimeout(timeoutId);
        const duration = Math.round(performance.now() - startTime);
        setLatency(duration);
        setIsUnstable(duration > 400); // Trigger instability visual if ping is > 400ms
      } catch (err) {
        setIsUnstable(true);
        setLatency(null);
      }
    };

    checkLatency();
    const interval = setInterval(checkLatency, 15000); // Check latency every 15 seconds
    return () => clearInterval(interval);
  }, [isOffline]);

  const formatTime = (ts: number | null) => {
    if (!ts) return '';
    return new Date(ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  };

  // Monitor network connection transitions
  useEffect(() => {
    if (isOffline) {
      setWasOffline(true);
    } else if (!isOffline && wasOffline && offlineQueueSize > 0) {
      // Transitioned offline -> online and we have pending actions
      setShowSyncBanner(true);
      setActiveTab('pending');
    }
  }, [isOffline, wasOffline, offlineQueueSize]);

  // Auto-open banner or transition state when queue updates
  useEffect(() => {
    if (!isOffline && offlineQueueSize > 0) {
      setShowSyncBanner(true);
      setResyncSuccess(false);
    } else if (offlineQueueSize === 0 && showSyncBanner && !isSyncing) {
      // Automatically show success briefly and then fade out
      setResyncSuccess(true);
      const timer = setTimeout(() => {
        setShowSyncBanner(false);
        setWasOffline(false);
        setResyncSuccess(false);
      }, 4000);
      return () => clearTimeout(timer);
    }
  }, [offlineQueueSize, isOffline, isSyncing]);

  const handleManualSync = () => {
    if (navigator.serviceWorker?.controller) {
      navigator.serviceWorker.controller.postMessage({ type: 'TRIGGER_SYNC_DRAIN' });
      toast.loading("Initiating server reconciliation...", { id: "manual-sync" });
      setTimeout(() => {
        toast.dismiss("manual-sync");
      }, 1500);
    } else {
      toast.error("Service worker not active. Please refresh.");
    }
  };

  const handleClearQueue = () => {
    if (window.confirm("Are you sure you want to clear the offline sync queue? Unsaved local changes since you went offline will not be pushed to the server.")) {
      if (navigator.serviceWorker?.controller) {
        navigator.serviceWorker.controller.postMessage({ type: 'CLEAR_SYNC_QUEUE' });
        toast.success("Offline synchronization queue cleared.", { id: "clear-queue-success" });
      }
    }
  };

  const handleDismiss = () => {
    setShowSyncBanner(false);
  };

  if (!showSyncBanner) {
    return (
      <div 
        id="autosave-status-pill"
        onClick={() => {
          setShowSyncBanner(true);
          // Default to pending if there are queued items, otherwise status monitor
          setActiveTab(offlineQueueSize > 0 ? 'pending' : 'status');
        }}
        className={`fixed bottom-6 right-6 z-40 bg-zinc-950/95 p-3.5 rounded-2xl flex items-center gap-2.5 text-[10px] font-bold cursor-pointer hover:text-zinc-200 transition-all shadow-xl select-none group border ${
          isOffline 
            ? 'border-amber-600/35 text-amber-400 hover:border-amber-500' 
            : isUnstable 
              ? 'border-red-500/35 text-red-400 hover:border-red-400 animate-pulse' 
              : 'border-zinc-800 text-zinc-400 hover:border-zinc-700'
        }`}
      >
        <span className="relative flex h-2 w-2">
          <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
            isOffline ? 'bg-amber-400' : isUnstable ? 'bg-red-400' : isAutoSaving ? 'bg-amber-400' : 'bg-emerald-400'
          }`} />
          <span className={`relative inline-flex rounded-full h-2 w-2 ${
            isOffline ? 'bg-amber-500' : isUnstable ? 'bg-red-500' : isAutoSaving ? 'bg-amber-500' : 'bg-emerald-500'
          }`} />
        </span>
        <span className="font-mono tracking-tight uppercase flex items-center gap-1.5">
          {isOffline ? (
            <>
              <WifiOff size={10} className="text-amber-500 shrink-0" />
              Offline: {offlineQueueSize} Queued
            </>
          ) : isUnstable ? (
            <>
              <CloudLightning size={10} className="text-red-500 animate-bounce shrink-0" />
              Sync Instability ({latency ? `${latency}ms` : 'Packet Loss'})
            </>
          ) : isAutoSaving ? (
            'Background saving...'
          ) : lastAutoSavedAt ? (
            `Auto-saved to Cloud: ${formatTime(lastAutoSavedAt)}`
          ) : (
            'Auto-save Active'
          )}
        </span>
        <span className="text-[9px] text-zinc-650 group-hover:text-zinc-400 border-l border-zinc-800/60 pl-2 transition-colors">
          DIAGNOSTIC
        </span>
      </div>
    );
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 30, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 30, scale: 0.95 }}
        transition={{ duration: 0.25, ease: "easeOut" }}
        id="reconciliation-sync-panel"
        className="fixed bottom-6 right-6 z-50 w-full max-w-sm bg-zinc-900/95 border border-zinc-800/90 shadow-2xl rounded-2xl p-5 backdrop-blur-xl pointer-events-auto text-left"
      >
        {/* Decorative dynamic ambient glow */}
        <div className={`absolute -inset-px rounded-2xl bg-gradient-to-tr opacity-25 pointer-events-none transition-all duration-300 ${
          isOffline 
            ? 'from-amber-500/10 to-red-500/10' 
            : 'from-teal-500/10 to-emerald-500/10'
        }`} />

        {/* Header containing status */}
        <div className="flex items-start justify-between relative mb-4 shrink-0">
          <div className="flex items-center space-x-3">
            <div className={`p-2 rounded-xl flex items-center justify-center ${
              resyncSuccess 
                ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' 
                : isOffline
                  ? 'bg-amber-500/10 text-amber-500 border border-amber-500/20'
                  : isUnstable
                    ? 'bg-red-500/10 text-red-400 border border-red-500/20'
                    : isSyncing 
                      ? 'bg-teal-500/10 text-teal-400 border border-teal-500/20' 
                      : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
            }`}>
              {resyncSuccess ? (
                <Check size={18} className="animate-bounce" />
              ) : isOffline ? (
                <WifiOff size={18} className="animate-pulse" />
              ) : isUnstable ? (
                <CloudLightning size={18} className="text-red-550 text-red-500 animate-bounce" />
              ) : isSyncing ? (
                <Loader2 size={18} className="animate-spin" />
              ) : (
                <CloudLightning size={18} className="animate-pulse" />
              )}
            </div>
            <div>
              <h3 className="font-semibold text-zinc-100 text-sm tracking-tight leading-none mb-1">
                {resyncSuccess 
                  ? 'Cloud Synced Successfully' 
                  : isOffline
                    ? 'Offline Control Hub'
                    : isUnstable
                      ? 'Connection Instability'
                      : isSyncing 
                        ? 'Synchronizing Workspace...' 
                        : 'Sync Status Monitor'}
              </h3>
              <p className="text-[11px] text-zinc-400 font-mono flex items-center gap-1">
                {isOffline ? (
                  <>
                    <WifiOff size={10} className="text-amber-500" />
                    <span>Disconnected from internet</span>
                  </>
                ) : isUnstable ? (
                  <>
                    <AlertCircle size={10} className="text-red-400 animate-pulse" />
                    <span>High Latency / Jitter Detected</span>
                  </>
                ) : (
                  <>
                    <Wifi size={10} className="text-emerald-500 animate-pulse" />
                    <span>Secure cloud link active</span>
                  </>
                )}
              </p>
            </div>
          </div>
          
          <button 
            type="button"
            onClick={handleDismiss}
            className="text-zinc-500 hover:text-zinc-300 text-xs transition duration-150 p-1 rounded-lg hover:bg-zinc-800 cursor-pointer"
            title="Dismiss panel"
          >
            ✕
          </button>
        </div>

        {/* Tab Switcher Segment */}
        <div className="bg-zinc-950 p-1 rounded-xl flex gap-1 mb-4 border border-zinc-900">
          <button
            type="button"
            onClick={() => setActiveTab('status')}
            className={`flex-1 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 ${
              activeTab === 'status'
                ? 'bg-zinc-900 text-white border border-zinc-850'
                : 'text-zinc-500 hover:text-zinc-300'
            }`}
          >
            <Cloud size={11} />
            Sync Monitor
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('pending')}
            className={`flex-1 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 relative ${
              activeTab === 'pending'
                ? 'bg-zinc-900 text-white border border-zinc-850'
                : 'text-zinc-500 hover:text-zinc-300'
            }`}
          >
            <List size={11} />
            Pending Sync
            {offlineQueueSize > 0 && (
              <span className="absolute -top-1 -right-1 flex h-4.5 w-4.5 items-center justify-center rounded-full bg-red-650 text-[8px] font-black text-white border border-zinc-950 animate-pulse">
                {offlineQueueSize}
              </span>
            )}
          </button>
        </div>

        {/* TAB 1: SYNC STATUS MONITOR */}
        {activeTab === 'status' && (
          <div className="space-y-4 mb-4">
            {/* Connection Information card */}
            <div className="bg-zinc-950/80 border border-zinc-850/50 rounded-xl p-3.5 space-y-3">
              <div className="flex justify-between items-center text-[10px] border-b border-zinc-900 pb-2">
                <span className="text-zinc-500 font-bold uppercase tracking-wider">Sync Engine</span>
                <span className="text-zinc-300 font-semibold font-mono flex items-center gap-1">
                  <Database size={10} className="text-red-500" />
                  SQLite + Firestore
                </span>
              </div>
              <div className="flex justify-between items-center text-[10px] border-b border-zinc-900 pb-2">
                <span className="text-zinc-500 font-bold uppercase tracking-wider">Connection Speed</span>
                <span className={`font-semibold font-mono flex items-center gap-1 ${isOffline ? 'text-amber-550' : isUnstable ? 'text-red-400 animate-pulse' : 'text-emerald-455 text-emerald-400'}`}>
                  {isOffline ? 'Offline Cache-First' : isUnstable ? `High Latency: ${latency ? `${latency}ms` : 'Slow Link'}` : latency ? `${latency}ms (Stable)` : 'Optimal (Stable)'}
                </span>
              </div>
              <div className="flex justify-between items-center text-[10px] border-b border-zinc-900 pb-2">
                <span className="text-zinc-500 font-bold uppercase tracking-wider">Storage State</span>
                <span className="text-emerald-455 text-emerald-400 font-semibold font-mono flex items-center gap-1">
                  <Check size={10} />
                  Locally Preserved
                </span>
              </div>
              <div className="flex justify-between items-center text-[10px]">
                <span className="text-zinc-500 font-bold uppercase tracking-wider">Last Cloud Save</span>
                <span className="text-zinc-300 font-semibold font-mono">
                  {lastAutoSavedAt ? formatTime(lastAutoSavedAt) : 'Ready'}
                </span>
              </div>
            </div>

            {/* Real-time active sync flow diagram */}
            <div className="bg-zinc-950/80 border border-zinc-850/50 rounded-xl p-3.5 space-y-3">
              <span className="text-[9px] font-black uppercase tracking-widest text-zinc-500 block font-sans">Active Sync Pipeline</span>
              <div className="flex items-center justify-between px-2 py-1 relative">
                {/* Local IndexedDB node */}
                <div className="flex flex-col items-center space-y-1 z-10">
                  <div className="p-2.5 bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 rounded-xl relative">
                    <Database size={16} />
                    <span className="absolute -top-1 -right-1 flex h-2 w-2">
                      <span className={`animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75 ${isSyncing || isAutoSaving ? 'block' : 'hidden'}`} />
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-indigo-500" />
                    </span>
                  </div>
                  <span className="text-[9px] font-mono font-bold uppercase tracking-wider text-zinc-400">IndexedDB</span>
                  <span className="text-[8px] text-zinc-600 font-mono">Local Client</span>
                </div>

                {/* Connection pipe with flow-arrows */}
                <div className="flex-1 h-[2px] bg-zinc-800 relative mx-4 flex items-center overflow-hidden">
                  {isSyncing || isAutoSaving ? (
                    <motion.div 
                      className="h-full bg-gradient-to-r from-indigo-500 via-red-500 to-emerald-500 rounded"
                      animate={{
                        x: ["-100%", "250%"],
                      }}
                      transition={{
                        repeat: Infinity,
                        duration: 1.5,
                        ease: "linear"
                      }}
                      style={{ width: '40%', position: 'absolute' }}
                    />
                  ) : (
                    <div className="absolute inset-0 bg-emerald-500/20 rounded" />
                  )}
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-zinc-900 border border-zinc-850 px-1.5 py-0.5 rounded text-[8px] font-mono text-zinc-400 uppercase tracking-widest leading-none z-10">
                    {isOffline ? 'OFFLINE' : isUnstable ? 'UNSTABLE' : isSyncing ? 'SYNCING...' : 'ONLINE'}
                  </div>
                </div>

                {/* Cloud Firebase node */}
                <div className="flex flex-col items-center space-y-1 z-10">
                  <div className="p-2.5 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-xl relative">
                    <Cloud size={16} />
                    <span className="absolute -top-1 -right-1 flex h-2 w-2">
                      <span className={`animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75 ${isSyncing || isAutoSaving ? 'block' : 'hidden'}`} />
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
                    </span>
                  </div>
                  <span className="text-[9px] font-mono font-bold uppercase tracking-wider text-zinc-400">Firebase</span>
                  <span className="text-[8px] text-zinc-600 font-mono">Remote Cloud</span>
                </div>
              </div>
            </div>

            {/* Offline/Instability Status Warning card */}
            {isOffline ? (
              <div className="bg-amber-500/5 border border-amber-500/15 rounded-xl p-3.5 space-y-1.5 animate-pulse">
                <div className="flex items-center gap-1.5 text-amber-500 text-xs font-bold">
                  <AlertCircle size={13} />
                  Offline Mode Active
                </div>
                <p className="text-[10px] text-zinc-400 leading-normal">
                  All changes are safely logged to your device's persistent cache buffer. They will instantly reconcile with our servers when network availability is restored.
                </p>
              </div>
            ) : isUnstable ? (
              <div className="bg-red-500/5 border border-red-500/15 rounded-xl p-3.5 space-y-1.5 animate-pulse">
                <div className="flex items-center gap-1.5 text-red-400 text-xs font-bold">
                  <AlertCircle size={13} />
                  Network Instability Detected
                </div>
                <p className="text-[10px] text-zinc-400 leading-normal">
                  Your connection is experiencing high latency. The workspace continues working seamlessly in **offline-first mode** using your local queue to shield you from sync delays.
                </p>
              </div>
            ) : (
              <div className="bg-emerald-500/5 border border-emerald-500/15 rounded-xl p-3.5 space-y-1.5">
                <div className="flex items-center gap-1.5 text-emerald-450 text-emerald-400 text-xs font-bold">
                  <Sparkles size={13} />
                  Workspace Synced & Protected
                </div>
                <p className="text-[10px] text-zinc-400 leading-normal">
                  Real-time database auto-saves are executing successfully. Your team workspace is fully synchronized and protected.
                </p>
              </div>
            )}
          </div>
        )}

        {/* TAB 2: PENDING SYNC QUEUE LIST */}
        {activeTab === 'pending' && (
          <div className="space-y-3 mb-4">
            <div className="flex justify-between items-center text-[10px] px-1">
              <span className="text-zinc-500 font-bold uppercase tracking-wider">Queue Contents ({offlineQueueSize})</span>
              {offlineQueueSize > 0 && (
                <button
                  type="button"
                  onClick={handleClearQueue}
                  className="text-zinc-500 hover:text-red-400 flex items-center gap-1 transition-colors uppercase font-black text-[9px] tracking-wider cursor-pointer"
                >
                  <Trash2 size={10} />
                  Clear Queue
                </button>
              )}
            </div>

            {offlineQueueSize === 0 ? (
              <div className="bg-zinc-950/80 border border-zinc-800/50 rounded-xl py-6 px-4 text-center flex flex-col items-center justify-center">
                <div className="p-2 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-full mb-2">
                  <Check size={14} />
                </div>
                <p className="text-xs text-zinc-200 font-bold mb-0.5">All Changes Synced</p>
                <p className="text-[10px] text-zinc-500">There are no offline changes currently waiting for the server.</p>
              </div>
            ) : (
              <div className="bg-zinc-950/80 border border-zinc-800/50 rounded-xl max-h-48 overflow-y-auto custom-scrollbar">
                <div className="py-1 px-1.5">
                  {offlineQueue.map((item, index) => (
                    <div 
                      key={item.id || index} 
                      className="flex items-center justify-between py-2 px-3 hover:bg-zinc-900/50 rounded-lg text-xs transition border-b border-zinc-900/50 last:border-b-0"
                    >
                      <div className="flex items-center space-x-2.5 min-w-0 flex-1 pr-2">
                        <Database size={12} className="text-amber-500 flex-shrink-0" />
                        <div className="min-w-0">
                          <p className="text-zinc-200 font-bold truncate">
                            {item.project?.title || 'Workspace Update'}
                          </p>
                          <span className="text-[9px] text-zinc-500 font-mono tracking-tight flex items-center gap-1 mt-0.5">
                            <Clock size={8} />
                            {new Date(item.timestamp || Date.now()).toLocaleTimeString()}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center space-x-1.5 flex-shrink-0">
                        <span className="text-[8px] font-black uppercase font-mono bg-amber-500/15 border border-amber-500/20 text-amber-500 px-1.5 py-0.5 rounded tracking-widest">
                          QUEUED
                        </span>
                        <ArrowRight size={10} className="text-zinc-700" />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Resync Success Summary indicator */}
        {resyncSuccess && (
          <div className="bg-emerald-500/5 border border-emerald-500/15 rounded-xl p-3 text-center mb-4 animate-fade-in">
            <p className="text-xs text-emerald-400 font-bold mb-0.5">
              Data Integrity Active
            </p>
            <p className="text-[10px] text-zinc-400 leading-normal">
              Your offline workspace changes have been successfully written and reconciled with the Cloud Firestore servers!
            </p>
          </div>
        )}

        {/* Action Button Segment */}
        {!resyncSuccess && (
          <div className="flex gap-2 shrink-0">
            <button
              type="button"
              onClick={handleManualSync}
              disabled={isSyncing || isOffline}
              className="flex-grow bg-red-650 hover:bg-red-600 disabled:opacity-40 disabled:hover:bg-red-650 text-white font-bold text-xs py-2.5 px-3 rounded-xl transition shadow-lg shadow-red-600/10 active:scale-[0.98] cursor-pointer flex items-center justify-center gap-1.5 border border-red-500"
            >
              {isSyncing ? (
                <>
                  <Loader2 size={13} className="animate-spin" />
                  <span>Pushing Sync Queue...</span>
                </>
              ) : (
                <>
                  <RefreshCw size={12} className={isSyncing ? "animate-spin" : ""} />
                  <span>Synchronize Firestore</span>
                </>
              )}
            </button>
            
            <button
              type="button"
              onClick={handleDismiss}
              className="bg-zinc-800 hover:bg-zinc-700 hover:text-zinc-200 text-zinc-300 font-bold text-xs py-2.5 px-4 rounded-xl transition cursor-pointer"
            >
              Later
            </button>
          </div>
        )}
      </motion.div>
    </AnimatePresence>
  );
};

export default SyncStatus;
