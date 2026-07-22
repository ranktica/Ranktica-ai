import { 
  collection, 
  query, 
  where, 
  orderBy, 
  onSnapshot, 
  doc, 
  updateDoc, 
  setDoc,
  writeBatch
} from 'firebase/firestore';
import { firestoreDb } from '@/infrastructure/auth/firebase';

export interface AlertNotification {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: 'success' | 'info' | 'warning' | 'error';
  status: 'read' | 'unread';
  tool: string;
  createdAt: number;
  link?: string;
}

/**
 * Handle firestore error gracefully
 */
const handleFirestoreError = (operation: string, error: any) => {
  console.error(`Firestore Notification Error during [${operation}]:`, error);
  throw {
    success: false,
    message: error.message || "An unexpected Firestore transaction failure occurred.",
    code: error.code || "unknown",
    context: operation
  };
};

/**
 * Listen for users' notifications in real-time
 */
export const subscribeToNotifications = (
  userEmail: string, 
  onNext: (notifications: AlertNotification[]) => void,
  onError?: (err: any) => void
) => {
  if (!userEmail) return () => {};

  try {
    const q = query(
      collection(firestoreDb, 'notifications'),
      where('userId', 'in', [userEmail, 'all']),
      orderBy('createdAt', 'desc')
    );

    return onSnapshot(q, (snapshot) => {
      const items: AlertNotification[] = [];
      snapshot.forEach((doc) => {
        const data = doc.data();
        items.push({
          id: doc.id,
          userId: data.userId || '',
          title: data.title || '',
          message: data.message || '',
          type: data.type || 'info',
          status: data.status || 'unread',
          tool: data.tool || 'System Monitor',
          createdAt: data.createdAt || Date.now(),
          link: data.link
        });
      });
      onNext(items);
    }, (error) => {
      console.error("Real-time notification listener failed:", error);
      if (onError) onError(error);
    });
  } catch (error) {
    console.error("Failed to establish notifications listener sub:", error);
    return () => {};
  }
};

/**
 * Add a new notification document to Firestore
 */
export const addNotification = async (notification: Omit<AlertNotification, 'id' | 'createdAt' | 'status'> & { id?: string }) => {
  try {
    const id = notification.id || `notif-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`;
    const docRef = doc(firestoreDb, 'notifications', id);
    const data: AlertNotification = {
      ...notification,
      id,
      status: 'unread',
      createdAt: Date.now()
    };
    await setDoc(docRef, data);
    return id;
  } catch (error) {
    handleFirestoreError('addNotification', error);
  }
};

/**
 * Mark a single notification document as read
 */
export const markAsRead = async (notificationId: string) => {
  try {
    const docRef = doc(firestoreDb, 'notifications', notificationId);
    await updateDoc(docRef, { status: 'read' });
  } catch (error) {
    handleFirestoreError('markAsRead', error);
  }
};

/**
 * Mark all notifications as read in batch
 */
export const markAllAsReadBatch = async (notifications: AlertNotification[]) => {
  try {
    const unread = notifications.filter(n => n.status === 'unread');
    if (unread.length === 0) return;

    const batch = writeBatch(firestoreDb);
    unread.forEach((item) => {
      const docRef = doc(firestoreDb, 'notifications', item.id);
      batch.update(docRef, { status: 'read' });
    });
    await batch.commit();
  } catch (error) {
    handleFirestoreError('markAllAsReadBatch', error);
  }
};

/**
 * Simulate background asset completion triggers that write notifications to active user
 */
export const triggerBackgroundSimulation = (
  userEmail: string,
  projectTitle: string,
  taskType: 'video' | 'thumbnail' | 'seo' | 'script',
  toolName: string
) => {
  if (!userEmail) return;

  // 1. Instantly trigger a "started" state
  let iconPrefix = "⚡";
  let displayTask = "Processing and indexing";
  if (taskType === 'video') {
    iconPrefix = "🎬";
    displayTask = "Rendering cinematic video layer";
  } else if (taskType === 'thumbnail') {
    iconPrefix = "🎨";
    displayTask = "Composing HD graphic templates";
  } else if (taskType === 'seo') {
    iconPrefix = "🔍";
    displayTask = "Inferences for semantic tags";
  } else if (taskType === 'script') {
    iconPrefix = "✍️";
    displayTask = "Drafting automated speech logs";
  }

  addNotification({
    userId: userEmail,
    title: `AI Background Engine Initialized ${iconPrefix}`,
    message: `Started ${displayTask} for project '${projectTitle}'...`,
    type: 'info',
    tool: toolName,
    link: taskType === 'video' ? 'VIDEO' : taskType === 'thumbnail' ? 'THUMBNAIL' : taskType === 'seo' ? 'SEO' : 'SCRIPT'
  }).catch((err) => {
    console.warn('[Notification Service] Background Simulation info alert failed to persist to Firestore:', err);
  });

  // 2. Set realistic async timeout to write the "completed" notification state to firestore
  setTimeout(() => {
    let completeTitle = `AI Video Render Complete! 🎬`;
    let completeMsg = `The video manifest and voiceover track for '${projectTitle}' successfully rendered and compiled.`;
    let mood: 'success' | 'info' = 'success';

    if (taskType === 'thumbnail') {
      completeTitle = `HD Thumbnail Render Finished! 🎨`;
      completeMsg = `Deep-dream visual templates for '${projectTitle}' are generated with excellent CTR projections.`;
    } else if (taskType === 'seo') {
      completeTitle = `SEO Keyword Indexes Compiled! 🔍`;
      completeMsg = `Search ranking indexes and customized tags for '${projectTitle}' have successfully converged.`;
    } else if (taskType === 'script') {
      completeTitle = `Speech narration track optimized! ✍️`;
      completeMsg = `Voice profile matching was successful, and script speech synthesis ready for evaluation.`;
    }

    addNotification({
      userId: userEmail,
      title: completeTitle,
      message: completeMsg,
      type: 'success',
      tool: toolName,
      link: taskType === 'video' ? 'VIDEO' : taskType === 'thumbnail' ? 'THUMBNAIL' : taskType === 'seo' ? 'SEO' : 'SCRIPT'
    }).catch((err) => {
      console.warn('[Notification Service] Background Simulation complete alert failed to persist to Firestore:', err);
    });
  }, 7500); // 7.5 seconds simulated execution latency
};
