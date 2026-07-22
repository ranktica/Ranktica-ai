export interface ActivityItem {
  id: string;
  action: string;
  tool: string;
  time: string;
  timestamp: number;
  type: string;
  category?: string;
  projectId?: string;
}

export const getCategoryFromTypeAndTool = (type?: string, tool?: string): string => {
  const t = (type || '').toLowerCase();
  const tl = (tool || '').toLowerCase();
  
  if (t.includes('billing') || t.includes('payment') || t.includes('invoice') || t.includes('customer') || tl.includes('stripe') || tl.includes('billing') || tl.includes('payment') || tl.includes('invoice') || tl.includes('subscription')) {
    return 'Billing';
  }
  if (t.includes('workflow') || t.includes('automation') || tl.includes('orchestrator') || tl.includes('agentbus') || tl.includes('queue') || tl.includes('scheduler') || t === 'ab_testing') {
    return 'Automation';
  }
  if (t === 'system' || t === 'system_pipeline' || tl.includes('pipeline') || tl.includes('audit') || tl.includes('system') || tl.includes('database')) {
    return 'System';
  }
  return 'User';
};

const DEFAULT_ACTIVITIES: ActivityItem[] = [
  {
    id: 'act-1',
    action: "Generated 5 viral concepts for 'Future of Generative Video AI'",
    tool: "Idea Lab",
    time: "15 mins ago",
    timestamp: Date.now() - 15 * 60 * 1000,
    type: "ideas",
    category: "User"
  },
  {
    id: 'act-2',
    action: "Synthesized cinematic cyberpunk thumbnail for Ranktica workspace",
    tool: "Thumbnail Studio",
    time: "2 hours ago",
    timestamp: Date.now() - 2 * 60 * 60 * 1000,
    type: "thumbnail",
    category: "User"
  },
  {
    id: 'act-3',
    action: "Optimized semantic semantic keyword clusters and tags",
    tool: "SEO Optimizer",
    time: "5 hours ago",
    timestamp: Date.now() - 5 * 60 * 60 * 1000,
    type: "seo",
    category: "Automation"
  },
  {
    id: 'act-4',
    action: "Drafted text-to-speech audio narration with Zephyr voice",
    tool: "Scripting Core",
    time: "Yesterday",
    timestamp: Date.now() - 24 * 60 * 60 * 1000,
    type: "script",
    category: "User"
  },
  {
    id: 'act-5',
    action: "Performed competitor intelligence and SWOT review",
    tool: "Competitor Spy",
    time: "2 days ago",
    timestamp: Date.now() - 48 * 60 * 60 * 1000,
    type: "competitor",
    category: "User"
  }
];

export const getActivities = (): ActivityItem[] => {
  try {
    const saved = localStorage.getItem('ranktica_activities');
    if (!saved) {
      localStorage.setItem('ranktica_activities', JSON.stringify(DEFAULT_ACTIVITIES));
      return DEFAULT_ACTIVITIES;
    }
    const parsed = JSON.parse(saved) as ActivityItem[];
    
    // Dynamic humanized times
    return parsed.map(item => {
      const diffMs = Date.now() - item.timestamp;
      const diffMins = Math.floor(diffMs / (60 * 1000));
      const diffSecs = Math.floor(diffMs / 1000);
      
      if (diffSecs < 60) {
        item.time = 'Just now';
      } else if (diffMins < 60) {
        item.time = `${diffMins} min${diffMins > 1 ? 's' : ''} ago`;
      } else {
        const diffHrs = Math.floor(diffMins / 60);
        if (diffHrs < 24) {
          item.time = `${diffHrs} hour${diffHrs > 1 ? 's' : ''} ago`;
        } else {
          const diffDays = Math.floor(diffHrs / 24);
          if (diffDays === 1) {
            item.time = 'Yesterday';
          } else {
            item.time = `${diffDays} days ago`;
          }
        }
      }
      
      // Auto-populate category if missing
      if (!item.category) {
        item.category = getCategoryFromTypeAndTool(item.type, item.tool);
      }
      
      return item;
    });
  } catch (e) {
    console.error('Failed to get activities', e);
    return DEFAULT_ACTIVITIES;
  }
};

export const logActivity = (action: string, tool: string, type: string = 'general', category?: string, customTimestamp?: number, projectId?: string) => {
  try {
    const saved = localStorage.getItem('ranktica_activities');
    const activities: ActivityItem[] = saved ? JSON.parse(saved) : DEFAULT_ACTIVITIES;
    
    const resolvedCategory = category || getCategoryFromTypeAndTool(type, tool);
    const ts = customTimestamp || Date.now();
    
    const newItem: ActivityItem = {
      id: ts.toString() + '-' + Math.floor(Math.random() * 1000).toString(),
      action,
      tool,
      time: 'Just now',
      timestamp: ts,
      type,
      category: resolvedCategory,
      projectId
    };
    
    // Clamp to 100 audit entries max for a complete history log
    const newActivities = [newItem, ...activities].slice(0, 100);
    localStorage.setItem('ranktica_activities', JSON.stringify(newActivities));
  } catch (e) {
    console.error('Failed to log activity', e);
  }
};
