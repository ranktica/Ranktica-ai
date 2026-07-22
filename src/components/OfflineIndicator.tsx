import React, { useState, useEffect } from 'react';
import { useProject } from '@/app/ProjectContext';
import { WifiOff, AlertTriangle, RefreshCw, Radio, Database, Check, HardDrive, Trash2 } from 'lucide-react';
import { offlineCache, CachedModuleState } from '@/shared/offlineCache';
import { toast } from 'react-hot-toast';

export const OfflineIndicator: React.FC = () => {
  const { offlineQueueSize = 0, activeProject } = useProject() || {};
  const [isOnline, setIsOnline] = useState<boolean>(offlineCache.isOnline());
  const [isChecking, setIsChecking] = useState<boolean>(false);
  const [showNotification, setShowNotification] = useState<boolean>(false);
  const [cachedModules, setCachedModules] = useState<CachedModuleState[]>([]);
  const [showCacheDetails, setShowCacheDetails] = useState<boolean>(false);

  const fetchCacheMetrics = async () => {
    try {
      const states = await offlineCache.getAllStates();
      setCachedModules(states);
    } catch (err) {
      console.warn('[OfflineIndicator] Failed to read cache states:', err);
    }
  };

  useEffect(() => {
    fetchCacheMetrics();

    const handleCacheUpdate = () => {
      fetchCacheMetrics();
    };

    window.addEventListener('ranktica-offline-cache-updated', handleCacheUpdate);
    return () => {
      window.removeEventListener('ranktica-offline-cache-updated', handleCacheUpdate);
    };
  }, []);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      setShowNotification(true);
      // Automatically clear the success notice after 4 seconds
      const timer = setTimeout(() => {
        setShowNotification(false);
      }, 4000);
      return () => clearTimeout(timer);
    };

    const handleOffline = () => {
      setIsOnline(false);
      setShowNotification(true);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Initial check
    setIsOnline(offlineCache.isOnline());

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const triggerManualCheck = () => {
    setIsChecking(true);
    
    // Simulate active network pinging
    setTimeout(() => {
      const currentNetworkState = offlineCache.isOnline();
      setIsOnline(currentNetworkState);
      setIsChecking(false);
      
      if (currentNetworkState) {
        setShowNotification(true);
        setTimeout(() => setShowNotification(false), 3000);
      }
    }, 800);
  };

  const handleSyncReset = () => {
    if (navigator.serviceWorker?.controller) {
      navigator.serviceWorker.controller.postMessage({ type: 'TRIGGER_SYNC_DRAIN' });
    }
  };

  const handleClearCache = async () => {
    if (window.confirm('Wipe all local Ranktica offline IndexedDB backup cache? This cannot be undone.')) {
      await offlineCache.clearAll();
      toast.success('IndexedDB backup cache cleared');
      setShowCacheDetails(false);
    }
  };

  const formatSize = (bytes: number) => {
    if (!bytes) return '0 B';
    if (bytes < 1024) return `${bytes} B`;
    const kb = bytes / 1024;
    return `${kb.toFixed(1)} KB`;
  };

  const formatModuleName = (id: string) => {
    return id
      .replace(/_/g, ' ')
      .replace(/\b\w/g, char => char.toUpperCase());
  };

  const totalCacheSize = cachedModules.reduce((acc, curr) => acc + (curr.sizeBytes || 0), 0);

  return (
    <div 
      id="system-offline-indicator"
      className="flex items-center gap-2 relative"
    >
      {isOnline ? (
        // Premium Persistent Online Connection Status Pill
        <div 
          className="flex items-center gap-2 px-3 py-1 bg-zinc-950/90 border border-zinc-800/80 hover:border-emerald-500/30 text-zinc-300 rounded-xl text-[10px] transition-all shadow-lg relative group"
        >
          <div className="flex items-center gap-1.5 text-emerald-400 font-bold uppercase tracking-wider">
            <span className="relative flex h-1.5 w-1.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500"></span>
            </span>
            <span className="font-sans text-[9px] tracking-tight text-emerald-400">Online</span>
          </div>

          <div className="h-2 w-[1px] bg-zinc-800" />

          {/* IndexedDB Cache Trigger */}
          <button
            type="button"
            onClick={() => setShowCacheDetails(!showCacheDetails)}
            className="flex items-center gap-1 bg-zinc-900 hover:bg-zinc-850 text-zinc-400 hover:text-white px-2 py-0.5 rounded-lg font-mono transition-colors cursor-pointer"
            title="Inspect local module persistence size and structure"
          >
            <HardDrive size={10} className="text-zinc-550 group-hover:text-emerald-400 transition-colors" />
            <span>Vault: {formatSize(totalCacheSize)}</span>
          </button>

          <button
            type="button"
            onClick={triggerManualCheck}
            disabled={isChecking}
            className="text-zinc-500 hover:text-white p-0.5 rounded transition-all duration-150 cursor-pointer disabled:opacity-50"
            title="Perform diagnostic network connection probe"
          >
            <RefreshCw size={10} className={`${isChecking ? 'animate-spin text-emerald-400' : ''}`} />
          </button>

          {/* Interactive IndexedDB Cache Vault Details Overlay */}
          {showCacheDetails && (
            <div className="absolute right-0 bottom-full mb-2 w-72 bg-[#121217] border border-zinc-800 rounded-2xl p-4 shadow-2xl z-[150] select-none text-left">
              <div className="absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-emerald-500 to-teal-500 rounded-t-2xl" />
              
              <div className="flex items-center justify-between mb-3 pb-2 border-b border-zinc-800/60">
                <div className="flex items-center gap-1.5">
                  <Database size={13} className="text-emerald-400" />
                  <span className="text-[11px] font-black tracking-wider text-white uppercase">IndexedDB Offline Cache</span>
                </div>
                <button
                  type="button"
                  onClick={handleClearCache}
                  className="p-1 hover:bg-red-500/10 text-zinc-500 hover:text-red-400 rounded-lg transition-all"
                  title="Clear all local caches"
                >
                  <Trash2 size={12} />
                </button>
              </div>

              <p className="text-[10px] text-zinc-400 mb-3 leading-relaxed">
                Your tool data is fully protected. Core workspaces auto-backup to secure local IndexedDB vaults for fluid offline editing.
              </p>

              <div className="space-y-1.5 max-h-40 overflow-y-auto pr-0.5 scrollbar-thin">
                {cachedModules.length === 0 ? (
                  <div className="text-[10px] text-center text-zinc-650 py-3">
                    No active modules cached yet. Open modules to trigger auto-vaulting.
                  </div>
                ) : (
                  cachedModules.map((m) => (
                    <div key={m.moduleId} className="bg-zinc-950 p-2 rounded-xl border border-zinc-855 flex items-center justify-between gap-2">
                      <div className="space-y-0.5 min-w-0">
                        <span className="text-[10.5px] font-bold text-zinc-200 block truncate leading-none">
                          {formatModuleName(m.moduleId)}
                        </span>
                        <span className="text-[9px] font-mono text-zinc-500 leading-none">
                          Updated: {new Date(m.lastUpdated).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        <span className="text-[9px] font-mono bg-emerald-500/10 border border-emerald-550/20 text-emerald-400 px-1.5 py-0.5 rounded font-black">
                          {formatSize(m.sizeBytes)}
                        </span>
                        <Check size={10} className="text-emerald-400" />
                      </div>
                    </div>
                  ))
                )}
              </div>

              <div className="mt-3 pt-2 border-t border-zinc-800/40 flex justify-between items-center text-[9px] font-mono text-zinc-550">
                <span>Total Protected Modules:</span>
                <span className="text-white font-bold">{cachedModules.length}</span>
              </div>
            </div>
          )}
        </div>
      ) : (
        // Highly visible, detailed layout offline warning indicator
        <div 
          className="flex items-center gap-2 px-3 py-1 bg-zinc-950/90 border border-amber-500/20 text-zinc-300 rounded-xl text-[10px] transition-colors shadow-lg relative group"
        >
          <div className="flex items-center gap-1.5 animate-pulse text-amber-500 font-bold uppercase tracking-wider">
            <WifiOff size={11} className="shrink-0" />
            <span className="font-sans text-[9px] tracking-tight">Offline</span>
          </div>

          <div className="h-2 w-[1px] bg-zinc-800" />

          {/* IndexedDB Cache Trigger */}
          <button
            type="button"
            onClick={() => setShowCacheDetails(!showCacheDetails)}
            className="flex items-center gap-1 bg-zinc-900 hover:bg-zinc-850 text-zinc-400 hover:text-white px-2 py-0.5 rounded-lg font-mono transition-colors cursor-pointer"
            title="Inspect local module persistence size and structure"
          >
            <HardDrive size={10} className="text-blue-400" />
            <span>Vault: {formatSize(totalCacheSize)}</span>
          </button>

          {offlineQueueSize > 0 && (
            <button
              type="button"
              onClick={handleSyncReset}
              className="flex items-center gap-1 bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 text-[9px] px-1.5 py-0.5 rounded-md font-mono transition-all border border-amber-500/20 cursor-pointer active:scale-95"
              title="Click to manually broadcast local sync event"
            >
              <Radio size={9} className="animate-ping" />
              <span>{offlineQueueSize} queued</span>
            </button>
          )}

          <button
            type="button"
            onClick={triggerManualCheck}
            disabled={isChecking}
            className="text-zinc-500 hover:text-white p-0.5 rounded transition-all duration-150 cursor-pointer disabled:opacity-50"
            title="Perform diagnostic network connection probe"
          >
            <RefreshCw size={10} className={`${isChecking ? 'animate-spin text-amber-500' : ''}`} />
          </button>

          {/* Interactive IndexedDB Cache Vault Details Overlay */}
          {showCacheDetails && (
            <div className="absolute right-0 bottom-full mb-2 w-72 bg-[#121217] border border-zinc-800 rounded-2xl p-4 shadow-2xl z-[150] select-none text-left">
              <div className="absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-blue-500 to-indigo-500 rounded-t-2xl" />
              
              <div className="flex items-center justify-between mb-3 pb-2 border-b border-zinc-800/60">
                <div className="flex items-center gap-1.5">
                  <Database size={13} className="text-blue-400" />
                  <span className="text-[11px] font-black tracking-wider text-white uppercase">IndexedDB Offline Cache</span>
                </div>
                <button
                  type="button"
                  onClick={handleClearCache}
                  className="p-1 hover:bg-red-500/10 text-zinc-550 hover:text-red-400 rounded-lg transition-all"
                  title="Clear all local caches"
                >
                  <Trash2 size={12} />
                </button>
              </div>

              <p className="text-[10px] text-zinc-400 mb-3 leading-relaxed">
                Your tool data is fully protected. Core workspaces auto-backup to secure local IndexedDB vaults for fluid offline editing.
              </p>

              <div className="space-y-1.5 max-h-40 overflow-y-auto pr-0.5 scrollbar-thin">
                {cachedModules.length === 0 ? (
                  <div className="text-[10px] text-center text-zinc-650 py-3">
                    No active modules cached yet. Open modules to trigger auto-vaulting.
                  </div>
                ) : (
                  cachedModules.map((m) => (
                    <div key={m.moduleId} className="bg-zinc-950 p-2 rounded-xl border border-zinc-855 flex items-center justify-between gap-2">
                      <div className="space-y-0.5 min-w-0">
                        <span className="text-[10.5px] font-bold text-zinc-200 block truncate leading-none">
                          {formatModuleName(m.moduleId)}
                        </span>
                        <span className="text-[9px] font-mono text-zinc-500 leading-none">
                          Updated: {new Date(m.lastUpdated).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        <span className="text-[9px] font-mono bg-blue-500/10 border border-blue-550/20 text-blue-400 px-1.5 py-0.5 rounded font-black">
                          {formatSize(m.sizeBytes)}
                        </span>
                        <Check size={10} className="text-emerald-400" />
                      </div>
                    </div>
                  ))
                )}
              </div>

              <div className="mt-3 pt-2 border-t border-zinc-800/40 flex justify-between items-center text-[9px] font-mono text-zinc-550">
                <span>Total Protected Modules:</span>
                <span className="text-white font-bold">{cachedModules.length}</span>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default OfflineIndicator;
