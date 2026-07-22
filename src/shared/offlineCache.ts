const DB_NAME = 'ranktica_offline_modules_db';
const STORE_NAME = 'module_states';

let dbPromise: Promise<IDBDatabase> | null = null;

function getOfflineDB(): Promise<IDBDatabase> {
  if (dbPromise) return dbPromise;

  dbPromise = new Promise<IDBDatabase>((resolve, reject) => {
    try {
      if (typeof indexedDB === 'undefined') {
        reject(new Error('IndexedDB is not supported in this environment'));
        return;
      }
      const request = indexedDB.open(DB_NAME, 1);

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          db.createObjectStore(STORE_NAME);
        }
      };

      request.onsuccess = (event) => {
        resolve((event.target as IDBOpenDBRequest).result);
      };

      request.onerror = (event) => {
        reject(request.error || new Error('Failed to open Ranktica offline database'));
      };
    } catch (err) {
      reject(err instanceof Error ? err : new Error(String(err)));
    }
  });

  // Prevent browser-level unhandled rejection warnings for the stored promise, and reset on failure
  dbPromise.catch((err) => {
    console.debug('[OfflineCache] Offline database initialization rejected (sandboxed context):', err);
    dbPromise = null;
  });

  return dbPromise;
}

export interface CachedModuleState {
  moduleId: string;
  data: any;
  lastUpdated: number;
  sizeBytes: number;
  syncStatus: 'cached' | 'syncing' | 'synced';
}

export const offlineCache = {
  /**
   * Exposes the current client connectivity status dynamically
   */
  isOnline: (): boolean => {
    return typeof navigator !== 'undefined' ? navigator.onLine : true;
  },

  /**
   * Saves a critical tool/module state to the IndexedDB offline database
   */
  saveState: async (moduleId: string, data: any): Promise<CachedModuleState> => {
    try {
      const db = await getOfflineDB();
      const stateString = JSON.stringify(data);
      const sizeBytes = new Blob([stateString]).size;
      const cachedState: CachedModuleState = {
        moduleId,
        data,
        lastUpdated: Date.now(),
        sizeBytes,
        syncStatus: 'cached',
      };

      return await new Promise<CachedModuleState>((resolve, reject) => {
        const transaction = db.transaction([STORE_NAME], 'readwrite');
        const store = transaction.objectStore(STORE_NAME);
        const request = store.put(cachedState, moduleId);

        request.onsuccess = () => {
          console.debug(`[OfflineCache] Saved state for module "${moduleId}" (${sizeBytes} bytes)`);
          // Dispatch custom event to notify listeners (like dashboards or indicators)
          if (typeof window !== 'undefined') {
            window.dispatchEvent(new CustomEvent('ranktica-offline-cache-updated', {
              detail: { moduleId, sizeBytes, lastUpdated: cachedState.lastUpdated }
            }));
          }
          resolve(cachedState);
        };

        request.onerror = () => {
          reject(request.error || new Error(`Failed to write state for module: ${moduleId}`));
        };
      });
    } catch (err) {
      console.warn(`[OfflineCache] Save failed for "${moduleId}":`, err);
      // Fallback to localStorage
      const cachedState: CachedModuleState = {
        moduleId,
        data,
        lastUpdated: Date.now(),
        sizeBytes: 0,
        syncStatus: 'cached',
      };
      try {
        localStorage.setItem(`ranktica_offline_module_${moduleId}`, JSON.stringify(cachedState));
      } catch (lsErr) {
        console.error('[OfflineCache] LocalStorage fallback write failed:', lsErr);
      }
      return cachedState;
    }
  },

  /**
   * Retrieves a critical tool/module state from IndexedDB
   */
  getState: async (moduleId: string): Promise<any | null> => {
    try {
      const db = await getOfflineDB();
      return new Promise((resolve) => {
        const transaction = db.transaction([STORE_NAME], 'readonly');
        const store = transaction.objectStore(STORE_NAME);
        const request = store.get(moduleId);

        request.onsuccess = () => {
          const cached: CachedModuleState = request.result;
          if (cached) {
            resolve(cached.data);
          } else {
            // Check fallback to localStorage
            const localFallback = localStorage.getItem(`ranktica_offline_module_${moduleId}`);
            if (localFallback) {
              const cachedLS: CachedModuleState = JSON.parse(localFallback);
              resolve(cachedLS.data);
            } else {
              resolve(null);
            }
          }
        };

        request.onerror = () => {
          const localFallback = localStorage.getItem(`ranktica_offline_module_${moduleId}`);
          if (localFallback) {
            const cachedLS: CachedModuleState = JSON.parse(localFallback);
            resolve(cachedLS.data);
          } else {
            resolve(null);
          }
        };
      });
    } catch (err) {
      console.warn(`[OfflineCache] Fetch failed for "${moduleId}":`, err);
      const localFallback = localStorage.getItem(`ranktica_offline_module_${moduleId}`);
      if (localFallback) {
        const cachedLS: CachedModuleState = JSON.parse(localFallback);
        return cachedLS.data;
      }
      return null;
    }
  },

  /**
   * Retrieves all offline cache states for diagnostic dashboards
   */
  getAllStates: async (): Promise<CachedModuleState[]> => {
    try {
      const db = await getOfflineDB();
      return await new Promise<CachedModuleState[]>((resolve, reject) => {
        const transaction = db.transaction([STORE_NAME], 'readonly');
        const store = transaction.objectStore(STORE_NAME);
        const request = store.getAll();

        request.onsuccess = () => {
          resolve(request.result || []);
        };

        request.onerror = () => {
          reject(request.error || new Error('Failed to retrieve all cached modules info'));
        };
      });
    } catch (err) {
      console.warn('[OfflineCache] Get all failed:', err);
      return [];
    }
  },

  /**
   * Deletes a specific module's cached state
   */
  deleteState: async (moduleId: string): Promise<void> => {
    try {
      localStorage.removeItem(`ranktica_offline_module_${moduleId}`);
      const db = await getOfflineDB();
      return await new Promise<void>((resolve, reject) => {
        const transaction = db.transaction([STORE_NAME], 'readwrite');
        const store = transaction.objectStore(STORE_NAME);
        const request = store.delete(moduleId);

        request.onsuccess = () => {
          if (typeof window !== 'undefined') {
            window.dispatchEvent(new CustomEvent('ranktica-offline-cache-updated', {
              detail: { moduleId, deleted: true }
            }));
          }
          resolve();
        };
        request.onerror = () => reject(request.error);
      });
    } catch (err) {
      console.warn('[OfflineCache] Delete state failed:', err);
    }
  },

  /**
   * Clears all cached module states
   */
  clearAll: async (): Promise<void> => {
    try {
      // Clear localStorage cache keys
      for (let i = localStorage.length - 1; i >= 0; i--) {
        const key = localStorage.key(i);
        if (key && key.startsWith('ranktica_offline_module_')) {
          localStorage.removeItem(key);
        }
      }

      const db = await getOfflineDB();
      return await new Promise<void>((resolve, reject) => {
        const transaction = db.transaction([STORE_NAME], 'readwrite');
        const store = transaction.objectStore(STORE_NAME);
        const request = store.clear();

        request.onsuccess = () => {
          if (typeof window !== 'undefined') {
            window.dispatchEvent(new CustomEvent('ranktica-offline-cache-updated', {
              detail: { clearedAll: true }
            }));
          }
          resolve();
        };
        request.onerror = () => reject(request.error);
      });
    } catch (err) {
      console.warn('[OfflineCache] Clear all offline cache stores failed:', err);
    }
  }
};
