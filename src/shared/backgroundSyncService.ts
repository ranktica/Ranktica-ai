import { doc, setDoc } from 'firebase/firestore';
import { firestoreDb } from '@/infrastructure/auth/firebase';
import { offlineCache } from '@/shared/offlineCache';
import { toast } from 'react-hot-toast';

export interface PendingSyncAction {
  id: string;
  project: any;
  timestamp: number;
}

class BackgroundSyncService {
  private isSyncing = false;
  private onQueueChangeCallback: ((queue: PendingSyncAction[]) => void) | null = null;

  constructor() {
    if (typeof window !== 'undefined') {
      window.addEventListener('online', () => {
        console.log('[BackgroundSyncService] Network connectivity restored. Initiating sync reconciliation...');
        this.syncPendingActionsToFirestore();
      });
    }
  }

  /**
   * Registers a callback to inform the main UI/context when the sync queue changes
   */
  public registerQueueChangeCallback(callback: (queue: PendingSyncAction[]) => void) {
    this.onQueueChangeCallback = callback;
  }

  /**
   * Loads the current sync queue from offlineCache (IndexedDB)
   */
  public async getQueue(): Promise<PendingSyncAction[]> {
    try {
      const queue = await offlineCache.getState('pending_sync_queue');
      return Array.isArray(queue) ? queue : [];
    } catch (err) {
      console.warn('[BackgroundSyncService] Failed to fetch queue from offline cache:', err);
      return [];
    }
  }

  /**
   * Saves the queue to offlineCache (IndexedDB) and broadcasts the change
   */
  public async saveQueue(queue: PendingSyncAction[]): Promise<void> {
    try {
      await offlineCache.saveState('pending_sync_queue', queue);
      if (this.onQueueChangeCallback) {
        this.onQueueChangeCallback(queue);
      }
      this.syncWithServiceWorker(queue);
    } catch (err) {
      console.warn('[BackgroundSyncService] Failed to save queue to offline cache:', err);
    }
  }

  /**
   * Syncs the queue state with the Service Worker so that SW-driven triggers/UI match
   */
  private syncWithServiceWorker(queue: PendingSyncAction[]) {
    if (typeof navigator !== 'undefined' && navigator.serviceWorker?.controller) {
      // Clear the service worker's in-memory queue first
      navigator.serviceWorker.controller.postMessage({ type: 'CLEAR_SYNC_QUEUE' });
      // Queue each action again
      for (const item of queue) {
        navigator.serviceWorker.controller.postMessage({
          type: 'QUEUE_OFFLINE_CHANGE',
          payload: item
        });
      }
    }
  }

  /**
   * Adds a new project change to the pending sync queue
   */
  public async addPendingAction(project: any): Promise<void> {
    const queue = await this.getQueue();
    // Overwrite existing change if the same project already has a pending change in the queue
    const existingIndex = queue.findIndex(item => item.project?.id === project.id);
    const newAction: PendingSyncAction = {
      id: Date.now().toString() + Math.random().toString(36).substring(2, 6),
      project,
      timestamp: Date.now()
    };

    if (existingIndex !== -1) {
      queue[existingIndex] = newAction;
    } else {
      queue.push(newAction);
    }

    await this.saveQueue(queue);
    console.log(`[BackgroundSyncService] Persisted pending action for project "${project.title}" (${queue.length} items total)`);
  }

  /**
   * Clears all pending sync actions from persistent storage
   */
  public async clearQueue(): Promise<void> {
    await this.saveQueue([]);
    console.log('[BackgroundSyncService] Persistent sync queue cleared.');
  }

  /**
   * Reconciles and pushes all cached pending actions to the Firestore database
   */
  public async syncPendingActionsToFirestore(): Promise<boolean> {
    if (this.isSyncing) {
      console.debug('[BackgroundSyncService] Synchronization already in progress.');
      return false;
    }

    if (typeof navigator !== 'undefined' && !navigator.onLine) {
      console.debug('[BackgroundSyncService] Network offline. Sync skipped.');
      return false;
    }

    const queue = await this.getQueue();
    if (queue.length === 0) {
      console.debug('[BackgroundSyncService] No pending actions to reconcile.');
      return true;
    }

    this.isSyncing = true;
    let successCount = 0;
    const toastId = toast.loading('Reconciling offline workspace edits with the database...', {
      id: 'background-sync-reconciliation'
    });

    try {
      const remainingQueue: PendingSyncAction[] = [];
      
      for (const item of queue) {
        if (item && item.project) {
          try {
            const prjRef = doc(firestoreDb, 'projects', item.project.id);
            await setDoc(prjRef, item.project, { merge: true });
            successCount++;
            console.log(`[BackgroundSyncService] Reconciled project "${item.project.title}" with Firestore`);
          } catch (writeErr) {
            console.error(`[BackgroundSyncService] Firestore write failed for "${item.project.id}":`, writeErr);
            // Retain failed items in the queue to be retried
            remainingQueue.push(item);
          }
        }
      }

      await this.saveQueue(remainingQueue);

      if (successCount > 0) {
        toast.success(`Synchronized ${successCount} queued workspace edits with Firestore!`, {
          id: 'background-sync-reconciliation',
          icon: '☁️',
          duration: 4000
        });
      } else {
        toast.dismiss('background-sync-reconciliation');
      }

      return remainingQueue.length === 0;
    } catch (err) {
      console.error('[BackgroundSyncService] Critical error during queue reconciliation:', err);
      toast.error('Workspace reconciliation failed. Will retry when connection stabilizes.', {
        id: 'background-sync-reconciliation'
      });
      return false;
    } finally {
      this.isSyncing = false;
    }
  }
}

export const backgroundSyncService = new BackgroundSyncService();
