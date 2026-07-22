import toast from 'react-hot-toast';

export interface NotificationItem {
  id: string;
  message: string;
  type: 'success' | 'error' | 'info' | 'warning';
  timestamp: string;
  read: boolean;
  category?: 'System' | 'Performance' | 'Action' | 'Task' | 'Budget' | 'Collaboration';
}

const STORAGE_KEY = 'ranktica_notifications';

// Subscribers for state changes
const subscribers = new Set<() => void>();

export const getNotifications = (): NotificationItem[] => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    return [];
  }
};

export const saveNotifications = (items: NotificationItem[]) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    subscribers.forEach(sub => sub());
  } catch (e) {
    // ignore
  }
};

export const subscribeNotifications = (callback: () => void) => {
  subscribers.add(callback);
  return () => {
    subscribers.delete(callback);
  };
};

export const addNotification = (
  message: string,
  type: 'success' | 'error' | 'info' | 'warning' = 'info',
  category?: 'System' | 'Performance' | 'Action' | 'Task' | 'Budget' | 'Collaboration'
) => {
  const items = getNotifications();

  // Dynamically determine category if not provided
  let finalCategory: 'System' | 'Performance' | 'Action' | 'Task' | 'Budget' | 'Collaboration' = 'System';
  if (category) {
    finalCategory = category;
  } else {
    const msg = message.toLowerCase();
    if (
      msg.includes('latency') ||
      msg.includes('timing') ||
      msg.includes('api') ||
      msg.includes('performance') ||
      msg.includes('ms') ||
      msg.includes('load time')
    ) {
      finalCategory = 'Performance';
    } else if (
      msg.includes('saved') ||
      msg.includes('cleared') ||
      msg.includes('workspace') ||
      msg.includes('executed') ||
      msg.includes('trigger') ||
      msg.includes('purge') ||
      msg.includes('generated') ||
      msg.includes('composed') ||
      msg.includes('erased')
    ) {
      finalCategory = 'Action';
    }
  }

  const newItem: NotificationItem = {
    id: `notif-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    message,
    type,
    timestamp: new Date().toISOString(),
    read: false,
    category: finalCategory
  };
  items.unshift(newItem);
  saveNotifications(items.slice(0, 100)); // Keep last 100
};

export const markAllNotificationsAsRead = () => {
  const items = getNotifications().map(item => ({ ...item, read: true }));
  saveNotifications(items);
};

export const clearNotifications = () => {
  saveNotifications([]);
};

// Explicit function to remove a single notification from storage manually
export const removeNotification = (id: string) => {
  const items = getNotifications().filter(item => item.id !== id);
  saveNotifications(items);
};

export const notify = {
  success: (message: string, options?: any, category?: 'System' | 'Performance' | 'Action' | 'Task' | 'Budget' | 'Collaboration') => {
    addNotification(message, 'success', category);
    return toast.success(message, options);
  },
  error: (message: string, options?: any, category?: 'System' | 'Performance' | 'Action' | 'Task' | 'Budget' | 'Collaboration') => {
    addNotification(message, 'error', category);
    return toast.error(message, options);
  },
  info: (message: string, options?: any, category?: 'System' | 'Performance' | 'Action' | 'Task' | 'Budget' | 'Collaboration') => {
    addNotification(message, 'info', category);
    return toast(message, options);
  },
  warn: (message: string, options?: any, category?: 'System' | 'Performance' | 'Action' | 'Task' | 'Budget' | 'Collaboration') => {
    addNotification(message, 'warning', category);
    return toast(message, {
      ...options,
      icon: '⚠️'
    });
  },
  dismiss: (toastId?: string) => {
    return toast.dismiss(toastId);
  }
};
