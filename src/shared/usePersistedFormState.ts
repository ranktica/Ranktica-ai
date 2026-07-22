import { useState, useEffect, useRef } from 'react';
import { toast } from 'react-hot-toast';
import { offlineCache } from '@/shared/offlineCache';

export function usePersistedFormState<T>(key: string, initialValue: T): [T, (val: T | ((prev: T) => T)) => void] {
  const [state, setState] = useState<T>(() => {
    try {
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch (error) {
      console.warn(`Error reading localStorage key "${key}":`, error);
      return initialValue;
    }
  });

  const isInitial = useRef(true);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Sync state from IndexedDB if localStorage was compromised or missing
  useEffect(() => {
    const syncFromIndexedDB = async () => {
      try {
        const cached = await offlineCache.getState(key);
        if (cached !== null && cached !== undefined) {
          // Check if it matches existing localStorage state; if not, restore from IndexedDB
          const existingLS = window.localStorage.getItem(key);
          if (!existingLS) {
            setState(cached);
          }
        }
      } catch (err) {
        console.warn(`[usePersistedFormState] Failed to sync from IndexedDB for "${key}":`, err);
      }
    };
    syncFromIndexedDB();
  }, [key]);

  useEffect(() => {
    try {
      window.localStorage.setItem(key, JSON.stringify(state));
      
      // Mirror to high-durability IndexedDB Offline Cache
      offlineCache.saveState(key, state).catch((err) => {
        console.warn(`[usePersistedFormState] Failed to write item "${key}" to IndexedDB:`, err);
      });
      
      // Dispatch a custom event to notify listeners of successful persistence in real-time
      window.dispatchEvent(new CustomEvent('local-storage-saved', { detail: { key, timestamp: Date.now() } }));
      
      // Skip showing toast on initial render mount
      if (isInitial.current) {
        isInitial.current = false;
        return;
      }

      // Detect if this is a Script Writer, Idea Generator, or Metadata Engineer state key
      const isScriptOrIdea = 
        key.startsWith('ranktica_ideas_') || 
        key.startsWith('ranktica_script_') || 
        key.startsWith('ranktica_metadata_') ||
        key.startsWith('ranktica-off-');
      if (isScriptOrIdea) {
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current);
        }
        timeoutRef.current = setTimeout(() => {
          toast.success('Auto-secured to IndexedDB Cloud Vault', {
            id: 'ranktica-autosave-toast', // Use single ID to seamlessly overwrite and prevent overlay fatigue
            duration: 2500,
            style: {
              background: '#09090b',
              color: '#38bdf8', // custom blue to indicate safe IndexedDB backup
              border: '1px solid #1a1a24',
              fontSize: '11.5px',
              fontFamily: 'monospace',
              fontWeight: 'bold',
              borderRadius: '12px'
            },
            iconTheme: {
              primary: '#0ea5e9',
              secondary: '#111827'
            }
          });
        }, 1200); // 1.2s typing-pause debounce delay
      }
    } catch (error) {
      console.warn(`Error setting localStorage key "${key}":`, error);
    }

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [key, state]);

  return [state, setState];
}

