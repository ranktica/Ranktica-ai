import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Check, Cloud, RefreshCw, AlertCircle } from 'lucide-react';

export const AutoSaveStatus: React.FC = () => {
  const [saveState, setSaveState] = useState<'idle' | 'saving' | 'saved'>('idle');
  const [lastSavedTime, setLastSavedTime] = useState<string | null>(null);

  useEffect(() => {
    // Read initial last saved time if present in localStorage or default to current time
    const initialTime = localStorage.getItem('ranktica_last_saved_time');
    if (initialTime) {
      setLastSavedTime(initialTime);
      setSaveState('saved');
    }

    const handleSaveTrigger = (e: Event) => {
      const customEvent = e as CustomEvent<{ timestamp?: number; key?: string }>;
      const timestamp = customEvent.detail?.timestamp || Date.now();
      const date = new Date(timestamp);
      const timeString = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });

      // Trigger "Saving..." spinner phase, then resolve to "Saved" with timestamp
      setSaveState('saving');
      
      const timer = setTimeout(() => {
        setLastSavedTime(timeString);
        setSaveState('saved');
        try {
          localStorage.setItem('ranktica_last_saved_time', timeString);
        } catch (err) {
          console.warn('[AutoSaveStatus] Failed to cache save timestamp:', err);
        }
      }, 600); // 600ms micro-delay for realistic interactive rhythm

      return () => clearTimeout(timer);
    };

    // Listen to all possible persistence triggers
    window.addEventListener('local-storage-saved', handleSaveTrigger);
    window.addEventListener('ranktica-offline-cache-updated', handleSaveTrigger);
    window.addEventListener('ranktica-auto-save-operation', handleSaveTrigger);

    return () => {
      window.removeEventListener('local-storage-saved', handleSaveTrigger);
      window.removeEventListener('ranktica-offline-cache-updated', handleSaveTrigger);
      window.removeEventListener('ranktica-auto-save-operation', handleSaveTrigger);
    };
  }, []);

  return (
    <div 
      id="topbar-autosave-status"
      className="flex items-center"
    >
      <AnimatePresence mode="wait">
        {saveState === 'saving' && (
          <motion.div
            key="saving"
            initial={{ opacity: 0, y: -4, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 4, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            className="flex items-center gap-1.5 px-3 py-1 bg-blue-500/5 border border-blue-500/20 text-blue-400 rounded-xl text-[10px] font-black uppercase tracking-wider"
          >
            <RefreshCw size={11} className="animate-spin text-blue-500" />
            <span className="font-sans text-[9px] tracking-tight">Securing...</span>
          </motion.div>
        )}

        {saveState === 'saved' && (
          <motion.div
            key="saved"
            initial={{ opacity: 0, y: -4, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 4, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            className="flex items-center gap-1.5 px-3 py-1 bg-emerald-500/5 border border-emerald-500/20 text-emerald-400 rounded-xl text-[10px] font-black uppercase tracking-wider"
          >
            <motion.div
              animate={{ scale: [1, 1.2, 1] }}
              transition={{ duration: 0.3 }}
              className="flex items-center justify-center shrink-0"
            >
              <Check size={11} className="text-emerald-400" />
            </motion.div>
            <span className="font-sans text-[9px] tracking-tight">
              Auto-saved {lastSavedTime ? `@ ${lastSavedTime}` : ''}
            </span>
          </motion.div>
        )}

        {saveState === 'idle' && (
          <motion.div
            key="idle"
            initial={{ opacity: 0, y: -4, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 4, scale: 0.95 }}
            className="flex items-center gap-1.5 px-3 py-1 bg-zinc-950/40 border border-zinc-800/50 text-zinc-500 rounded-xl text-[10px] font-black uppercase tracking-wider"
          >
            <Cloud size={11} className="text-zinc-650" />
            <span className="font-sans text-[9px] tracking-tight">
              Auto-save active
            </span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
