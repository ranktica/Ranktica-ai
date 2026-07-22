
import React, { useState, useEffect } from 'react';
import { generateMarketingSchedule } from '@/infrastructure/gemini';
import { SocialPost } from '@/shared/types';
import { 
  Loader2, 
  Calendar, 
  Linkedin, 
  Instagram, 
  Facebook, 
  Twitter, 
  Youtube,
  CheckCircle2, 
  Copy, 
  Filter,
  Heart,
  MessageCircle,
  Repeat,
  Share2,
  MoreHorizontal,
  ThumbsUp,
  MessageSquare,
  Image as ImageIcon,
  Send,
  Sparkles,
  ChevronRight,
  Clock,
  FileText,
  Eye,
  Flame,
  Award,
  Zap,
  Briefcase,
  Trash2,
  RefreshCw
} from 'lucide-react';
import { useAuth } from '@/infrastructure/auth/AuthContext';
import { getCachedToken, loginWithGoogle } from '@/infrastructure/auth/firebase';
import { toast } from 'react-hot-toast';

const AVAILABLE_PLATFORMS = [
  { id: 'youtube', label: 'YouTube (API Direct)', icon: Youtube, color: 'text-red-500' },
  { id: 'linkedin', label: 'LinkedIn (API Direct)', icon: Linkedin, color: 'text-blue-500' },
  { id: 'twitter', label: 'Twitter', icon: Twitter, color: 'text-blue-400' },
  { id: 'instagram', label: 'Instagram', icon: Instagram, color: 'text-pink-500' },
  { id: 'facebook', label: 'Facebook', icon: Facebook, color: 'text-blue-600' }
];

const MARKETING_BLUEPRINTS = [
  {
    id: 'ai-marketing-2025',
    label: 'AI in Marketing (2025 Mastery)',
    topic: 'AI in Marketing: From Prompts to Autonomous Agents',
    schedule: [
      { day: 1, platform: 'twitter', time: '10:15 AM', content: "Agency owners are terrified of the shift to Agentic Marketing. I just dropped the full breakdown of how we're automating fulfillment for 2025. Your current stack is already obsolete. 🧵", hashtags: ['AI', 'Marketing', 'Automation'], visualPrompt: "A dark, cinematic visualization of a neural network overlaying a traditional office." },
      { day: 1, platform: 'linkedin', time: '9:00 AM', content: "The era of 'Prompt Engineering' is over. We've entered the era of 'Agentic Orchestration'. If your agency isn't building autonomous loops, you aren't scaling—you're just managing friction. New video breaks it all down.", hashtags: ['AIinMarketing', 'FutureOfWork', 'B2B'], visualPrompt: "A professional headshot of a creator looking into a holographic dashboard." },
      { day: 2, platform: 'twitter', time: '2:30 PM', content: "Most people use ChatGPT for copy. That's a mistake. In my latest video, I show you how to use Gemini 3 Pro to map semantic knowledge graphs before you write a single word. Results: +300% retention. 📈", hashtags: ['GeminiAI', 'SEO', 'MarketingTips'], visualPrompt: "A clean, high-contrast screenshot of complex AI logic flows." },
      { day: 3, platform: 'instagram', time: '6:00 PM', content: "Behind the scenes of how I built an autonomous marketing swarm for a local business. AI doesn't have to be complex to be effective. Check the link in bio for the framework! 🤖✨", hashtags: ['AIAesthetic', 'MarketingAgency', 'Automate'], visualPrompt: "A high-fidelity office aesthetic with a laptop showing Ranktica AI." },
      { day: 4, platform: 'linkedin', time: '11:45 AM', content: "Quick Poll: Will AI replace the 'Social Media Manager' role entirely by 2026? Or just augment it? I'm betting on 'The Agent Architect'—a new hybrid role. I explain why in my latest video.", hashtags: ['MarketingJobs', 'AITrends', 'Leadership'], visualPrompt: "A split-screen comparison: Manual Labor vs. Agentic Speed." },
      { day: 5, platform: 'twitter', time: '9:15 AM', content: "Case Study: I replaced my $5,000/mo freelancer with 5 specialized AI agents for 7 days. The cost? $0.84. The quality? Indistinguishable. Here is the architecture. 👇", hashtags: ['Solopreneur', 'Automation', 'ROI'], visualPrompt: "A 3D bar chart showing costs dropping and output rising." },
      { day: 6, platform: 'twitter', time: '4:00 PM', content: "Google Search is dying. AI Overviews are taking over. If your marketing isn't 'LLM Optimized,' you are effectively invisible. Tomorrow I'm dropping the 2025 AI SEO Blueprint. Get ready.", hashtags: ['SEO2025', 'GoogleSGE', 'AI'], visualPrompt: "A neon 'WARNING' sign in a futuristic digital landscape." },
      { day: 7, platform: 'linkedin', time: '10:00 AM', content: "Final recap of the 'Autonomous Agency' series. We've covered everything from persona mapping to automated outreach. The blueprint is now complete. Join the 1% who build instead of just prompt.", hashtags: ['MarketingStrategy', 'AIAgents', 'Success'], visualPrompt: "A celebratory, high-end visual of a robotic hand shaking a human hand." }
    ]
  }
];

const PostPreview = ({ post }: { post: SocialPost }) => {
  const hashtags = (post.hashtags || []).map(t => t.startsWith('#') ? t : `#${t}`).join(' ');
  const placeholderImg = `https://picsum.photos/seed/${post.platform + post.day}/800/450`;

  if (post.platform === 'twitter') {
    return (
      <div className="bg-black border border-zinc-800 rounded-xl p-4 text-sm font-sans w-full max-w-md mx-auto mt-4 animate-fade-in shadow-2xl">
        <div className="flex gap-3">
          <div className="w-10 h-10 rounded-full bg-zinc-700 flex-shrink-0"></div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1 text-zinc-400">
              <span className="font-bold text-white">Ranktica AI</span>
              <span className="text-zinc-500">@ranktica</span>
              <span>·</span>
              <span>{post.time}</span>
            </div>
            <p className="text-white whitespace-pre-wrap my-2 text-[15px] leading-normal">{post.content}</p>
            <p className="text-blue-400 text-sm mb-3">{hashtags}</p>
            <div className="rounded-2xl border border-zinc-800 overflow-hidden mb-4 bg-zinc-900/50">
               <img src={placeholderImg} alt="Preview" className="w-full aspect-video object-cover" />
            </div>
            <div className="flex justify-between text-zinc-500 max-w-xs pt-1">
              <MessageCircle size={18} className="hover:text-blue-400 cursor-pointer" />
              <Repeat size={18} className="hover:text-green-400 cursor-pointer" />
              <Heart size={18} className="hover:text-red-400 cursor-pointer" />
              <Share2 size={18} className="hover:text-blue-400 cursor-pointer" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (post.platform === 'linkedin') {
    return (
      <div className="bg-white text-black rounded-lg border border-zinc-300 w-full max-w-md mx-auto mt-4 overflow-hidden font-sans animate-fade-in shadow-2xl">
        <div className="p-3 flex gap-2 items-center">
          <div className="w-10 h-10 rounded bg-zinc-200"></div>
          <div className="leading-tight">
            <div className="font-bold text-sm">Ranktica AI Studio</div>
            <div className="text-xs text-zinc-500">Content Strategy • Creator</div>
            <div className="text-xs text-zinc-500 flex items-center gap-1">{post.time} • <span className="text-zinc-400">🌐</span></div>
          </div>
          <MoreHorizontal size={18} className="ml-auto text-zinc-500" />
        </div>
        <div className="px-3 pb-2 text-[14px]">
          <p className="whitespace-pre-wrap mb-2 leading-relaxed">{post.content}</p>
          <p className="text-blue-600 font-semibold">{hashtags}</p>
        </div>
        <img src={placeholderImg} alt="LinkedIn Post" className="w-full aspect-video object-cover" />
        <div className="px-3 py-2 border-t border-zinc-100 flex justify-between text-zinc-600 font-semibold">
           <div className="flex items-center gap-1 hover:bg-zinc-100 p-2 rounded cursor-pointer"><ThumbsUp size={20} /><span className="text-xs">Like</span></div>
           <div className="flex items-center gap-1 hover:bg-zinc-100 p-2 rounded cursor-pointer"><MessageSquare size={20} /><span className="text-xs">Comment</span></div>
           <div className="flex items-center gap-1 hover:bg-zinc-100 p-2 rounded cursor-pointer"><Repeat size={20} /><span className="text-xs">Repost</span></div>
        </div>
      </div>
    );
  }

  if (post.platform === 'instagram') {
    return (
      <div className="bg-black border border-zinc-800 rounded-2xl w-full max-w-xs mx-auto mt-4 overflow-hidden font-sans text-white animate-fade-in shadow-2xl">
        <div className="p-3 flex items-center justify-between">
           <div className="flex items-center gap-2">
             <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-yellow-400 to-purple-600 p-[2px]">
               <div className="w-full h-full rounded-full bg-black border border-black overflow-hidden flex items-center justify-center">
                  <ImageIcon size={14} />
               </div>
             </div>
             <span className="text-sm font-semibold">ranktica_ai</span>
           </div>
           <MoreHorizontal size={18} />
        </div>
        <img src={placeholderImg} alt="Instagram Post" className="w-full aspect-square object-cover" />
        <div className="p-3">
           <div className="flex justify-between mb-3">
              <div className="flex gap-4">
                 <Heart size={24} className="hover:text-red-500 cursor-pointer" />
                 <MessageCircle size={24} className="hover:text-zinc-400 cursor-pointer" />
                 <Send size={24} className="hover:text-zinc-400 cursor-pointer" />
              </div>
           </div>
           <p className="text-[14px] leading-tight mb-1">
             <span className="font-bold mr-2">ranktica_ai</span>
             {post.content}
           </p>
           <p className="text-blue-400 text-[13px]">{hashtags}</p>
        </div>
      </div>
    );
  }

  return null;
};

export const MarketingScheduler: React.FC = () => {
  const [topic, setTopic] = useState('');
  const [schedule, setSchedule] = useState<SocialPost[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeDay, setActiveDay] = useState<number>(1);
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>(['twitter', 'linkedin', 'instagram', 'facebook']);
  const { incrementStat } = useAuth();

  const [events, setEvents] = useState<any[]>([]);
  const [fetchingEvents, setFetchingEvents] = useState(false);

  const fetchEvents = async () => {
    try {
      const token = getCachedToken();
      if (!token) return;
      setFetchingEvents(true);
      const timeMin = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString(); // 14 days ago
      const url = `https://www.googleapis.com/calendar/v3/calendars/primary/events?timeMin=${encodeURIComponent(timeMin)}&maxResults=100&singleEvents=true&orderBy=startTime`;
      
      const res = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (!res.ok) throw new Error('Failed to fetch calendar events.');
      const data = await res.json();
      setEvents(data.items || []);
    } catch (err: any) {
      console.error('Fetch Events Error:', err);
    } finally {
      setFetchingEvents(false);
    }
  };

  useEffect(() => {
    fetchEvents();
  }, []);

  const handleDeleteEvent = async (eventId: string, summary: string) => {
    try {
      let token = getCachedToken();
      if (!token) {
        toast.loading('Google authorization needed. Spawning consent popup...', { id: 'gcal' });
        const authResult = await loginWithGoogle();
        token = authResult.token;
        toast.success('Successfully authorized Google Workspace!', { id: 'gcal' });
      }

      if (!window.confirm(`Are you sure you want to delete "${summary}" from your Google Calendar?`)) return;

      toast.loading('Removing event...', { id: 'gcal' });
      const delUrl = `https://www.googleapis.com/calendar/v3/calendars/primary/events/${eventId}`;
      const res = await fetch(delUrl, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (!res.ok) throw new Error('Failed to delete event from Google Calendar.');

      toast.success('Event successfully removed from Google Calendar! 🗑️', { id: 'gcal' });
      fetchEvents();
    } catch (err: any) {
      toast.error(`Deletion failed: ${err.message}`, { id: 'gcal' });
    }
  };

  const handleBatchRemoveStaleEvents = async () => {
    try {
      let token = getCachedToken();
      if (!token) {
        toast.loading('Google authorization needed. Spawning consent popup...', { id: 'gcal-batch' });
        const authResult = await loginWithGoogle();
        token = authResult.token;
        toast.success('Successfully authorized Google Workspace!', { id: 'gcal-batch' });
      }

      const now = new Date();
      const staleEvents = events.filter(evt => {
        const startStr = evt.start?.dateTime || evt.start?.date;
        if (!startStr) return false;
        const startDate = new Date(startStr);
        const isStale = startDate < now;
        // Match Ranktica created events
        const isRanktica = evt.summary && (evt.summary.includes('Ranktica') || evt.description?.includes('Ranktica') || evt.summary.includes('[Publish]') || evt.summary.includes('[Release]'));
        return isStale && isRanktica;
      });

      if (staleEvents.length === 0) {
        toast.success('No stale or expired Ranktica events found in your Google Calendar!', { id: 'gcal-batch' });
        return;
      }

      const confirmMsg = `Found ${staleEvents.length} expired campaign calendar events (started in past). Do you want to batch-delete them from your Google Calendar?`;
      if (!window.confirm(confirmMsg)) return;

      toast.loading(`Batch deleting ${staleEvents.length} stale events...`, { id: 'gcal-batch' });

      let deletedCount = 0;
      for (const evt of staleEvents) {
        const delUrl = `https://www.googleapis.com/calendar/v3/calendars/primary/events/${evt.id}`;
        const res = await fetch(delUrl, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        if (res.ok) {
          deletedCount++;
        }
      }

      toast.success(`Successfully batch-removed ${deletedCount} stale events from your calendar!`, { id: 'gcal-batch' });
      fetchEvents();
    } catch (err: any) {
      toast.error(`Batch removal failed: ${err.message}`, { id: 'gcal-batch' });
    }
  };

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!topic.trim()) return;
    if (selectedPlatforms.length === 0) {
      alert("Please select at least one platform.");
      return;
    }

    setLoading(true);
    setSchedule([]);
    try {
      const posts = await generateMarketingSchedule(topic, selectedPlatforms);
      setSchedule(posts);
      incrementStat('marketingPlans');
    } catch (err) {
      console.error(err);
      alert("Failed to generate plan. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const applyBlueprint = (bp: typeof MARKETING_BLUEPRINTS[0]) => {
    setTopic(bp.topic);
    setSchedule(bp.schedule as any);
  };

  const handleSchedulePost = (index: number) => {
    const updatedSchedule = [...schedule];
    updatedSchedule[index].status = 'scheduled';
    setSchedule(updatedSchedule);
  };

  const parseTime = (timeStr: string) => {
    const match = timeStr.match(/^(\d+):(\d+)\s*(AM|PM)$/i);
    let hours = 10;
    let minutes = 0;
    if (match) {
      hours = parseInt(match[1], 10);
      minutes = parseInt(match[2], 10);
      const ampm = match[3].toUpperCase();
      if (ampm === 'PM' && hours < 12) hours += 12;
      if (ampm === 'AM' && hours === 12) hours = 0;
    }
    return { hours, minutes };
  };

  const handleSyncToGoogleCalendar = async (post: SocialPost) => {
    try {
      let token = getCachedToken();
      if (!token) {
        toast.loading('Google authorization needed. Spawning consent popup...', { id: 'gcal' });
        const authResult = await loginWithGoogle();
        token = authResult.token;
        toast.success('Successfully authorized Google Workspace!', { id: 'gcal' });
      }

      // Explicit user confirmation before mutating/creating calendar event
      const isConfirmed = window.confirm(`Authorize Ranktica to add the "${post.platform.toUpperCase()} optimal deployment" to your Google Calendar?`);
      if (!isConfirmed) return;

      toast.loading('Synchronizing with Google Calendar API...', { id: 'gcal' });

      const eventDate = new Date();
      eventDate.setDate(eventDate.getDate() + (post.day - 1));
      const { hours, minutes } = parseTime(post.time);
      eventDate.setHours(hours, minutes, 0, 0);

      const endDate = new Date(eventDate.getTime() + 60 * 60 * 1000); // 1 hour slot

      const eventPayload = {
        summary: `📢 [${post.platform.toUpperCase()}] Ranktica Campaign Deployment: ${topic || 'Optimal Slot'}`,
        description: `Platform: ${post.platform.toUpperCase()}\nOptimal Slot: ${post.time}\n\nLinguistic Draft:\n"${post.content}"\n\nHashtags: ${post.hashtags?.join(', ')}\n\nVisual Prompt Suggestion:\n${post.visualPrompt || ''}`,
        start: {
          dateTime: eventDate.toISOString(),
          timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC'
        },
        end: {
          dateTime: endDate.toISOString(),
          timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC'
        },
        reminders: {
          useDefault: true
        }
      };

      const response = await fetch('https://www.googleapis.com/calendar/v3/calendars/primary/events', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(eventPayload)
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.error?.message || 'Google Calendar API rejected.');
      }

      toast.success(`Post successfully synced with Google Calendar on ${eventDate.toLocaleDateString()} at ${post.time}!`, { id: 'gcal' });
      
      const idx = schedule.findIndex(p => p.content === post.content && p.platform === post.platform);
      if (idx !== -1) {
        handleSchedulePost(idx);
      }
    } catch (err: any) {
      toast.error(`Sync Failed: ${err.message}`, { id: 'gcal' });
    }
  };

  const togglePlatform = (id: string) => {
    setSelectedPlatforms(prev => 
      prev.includes(id) 
        ? prev.filter(p => p !== id)
        : [...prev, id]
    );
  };

  const getPlatformIcon = (platform: string) => {
    switch (platform) {
      case 'linkedin': return <Linkedin size={18} className="text-blue-500" />;
      case 'instagram': return <Instagram size={18} className="text-pink-500" />;
      case 'facebook': return <Facebook size={18} className="text-blue-600" />;
      case 'twitter': return <Twitter size={18} className="text-blue-400" />;
      default: return <Calendar size={18} />;
    }
  };

  const filteredPosts = schedule.filter(post => post.day === activeDay);

  return (
    <div className="max-w-7xl mx-auto space-y-12 animate-fade-in pb-20 relative">
      <div className="text-center space-y-4 py-8">
        <div className="inline-flex items-center justify-center p-4 rounded-[2rem] bg-blue-500/10 text-blue-500 mb-2 border border-blue-500/20 shadow-2xl">
           <Zap size={40} strokeWidth={2.5} fill="currentColor" />
        </div>
        <h2 className="text-5xl font-black bg-gradient-to-br from-white to-zinc-600 bg-clip-text text-transparent tracking-tighter">
          Omni-Channel Engine
        </h2>
        <p className="text-zinc-400 text-lg font-medium max-w-2xl mx-auto">
          Deploy a 7-day multi-platform blitz engineered to capture the algorithm and maximize across-the-web retention.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Left Sidebar: Blueprints */}
        <div className="lg:col-span-1 space-y-6">
           <div className="bg-zinc-900 border border-zinc-800 rounded-[2.5rem] p-8 shadow-2xl space-y-8">
              <div className="flex items-center justify-between border-b border-zinc-800 pb-4">
                 <h3 className="text-xs font-black uppercase tracking-[0.2em] text-white">Viral Blueprints</h3>
                 <Award size={16} className="text-orange-500" />
              </div>
              
              <div className="space-y-3">
                 {MARKETING_BLUEPRINTS.map((bp) => (
                    <button 
                       key={bp.id} 
                       onClick={() => applyBlueprint(bp)}
                       className="w-full text-left p-4 bg-zinc-950/50 border border-zinc-800 rounded-2xl hover:border-blue-500/50 transition-all group"
                    >
                       <div className="flex justify-between items-center mb-1">
                          <span className="text-[10px] font-black text-blue-500 uppercase tracking-widest">Blitz Optimized</span>
                          <ChevronRight size={12} className="text-zinc-700 group-hover:translate-x-1 transition-transform" />
                       </div>
                       <p className="text-xs font-bold text-zinc-400 truncate">{bp.label}</p>
                    </button>
                 ))}
              </div>

              <div className="w-full h-px bg-zinc-800"></div>

              <div className="space-y-4">
                 <span className="text-[10px] font-black text-zinc-600 uppercase tracking-widest block ml-1">Target Platforms</span>
                 <div className="grid grid-cols-2 gap-2">
                    {AVAILABLE_PLATFORMS.map(platform => {
                      const isSelected = selectedPlatforms.includes(platform.id);
                      return (
                        <button
                          key={platform.id}
                          onClick={() => togglePlatform(platform.id)}
                          className={`flex items-center gap-2 p-2.5 rounded-xl text-[10px] font-black uppercase transition-all border ${isSelected ? 'bg-blue-600/10 border-blue-500 text-white' : 'bg-zinc-950 border-zinc-800 text-zinc-600 hover:border-zinc-700'}`}
                        >
                          <platform.icon size={14} className={isSelected ? platform.color : 'text-zinc-800'} />
                          {platform.label}
                        </button>
                      );
                    })}
                 </div>
              </div>
           </div>

           <div className="bg-zinc-900/50 border border-zinc-800 p-6 rounded-[2rem] flex items-start gap-4">
              <div className="p-3 bg-blue-500/10 rounded-2xl text-blue-400">
                 <Briefcase size={20} />
              </div>
              <div>
                 <h4 className="text-[10px] font-bold text-white uppercase tracking-widest mb-1">Blitz Strategy</h4>
                 <p className="text-[10px] text-zinc-500 leading-relaxed font-medium">
                   "A 7-day cycle maintains consistent mental real estate across platforms without triggering ad-fatigue."
                 </p>
              </div>
           </div>
        </div>

        {/* Right Content Area */}
        <div className="lg:col-span-3 space-y-8">
           <form onSubmit={handleGenerate} className="relative group">
             <div className="absolute inset-0 bg-blue-600 blur-2xl opacity-0 group-focus-within:opacity-10 transition-opacity"></div>
             <div className="relative flex gap-3 p-2 bg-zinc-900 border border-zinc-800 rounded-[2.5rem] shadow-2xl focus-within:border-blue-500/50 transition-all">
               <div className="flex items-center pl-6 text-zinc-600">
                  <Flame size={20} />
               </div>
               <input
                 type="text"
                 value={topic}
                 onChange={(e) => setTopic(e.target.value)}
                 placeholder="Enter video topic for blitz generation..."
                 className="flex-1 bg-transparent border-none py-6 outline-none text-white font-medium text-lg placeholder:text-zinc-800"
               />
               <button
                 type="submit"
                 disabled={loading || !topic}
                 className="bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white px-12 py-4 rounded-[2rem] font-black uppercase text-xs tracking-widest transition-all shadow-lg shadow-blue-600/20 flex items-center gap-2 active-press mr-1"
               >
                 {loading ? <Loader2 className="animate-spin" size={18} /> : <><Zap size={18} fill="currentColor" /> Generate Blitz</>}
               </button>
             </div>
           </form>

           {schedule.length > 0 && (() => {
              const totalCampaignsPlanned = schedule.length;
              const totalVideosPlanned = schedule.filter(p => {
                const plat = p.platform.toLowerCase();
                const contentLower = p.content.toLowerCase();
                const visualLower = (p.visualPrompt || '').toLowerCase();
                return plat.includes('shorts') || plat.includes('video') || plat.includes('instagram') ||
                       contentLower.includes('video') || contentLower.includes('reel') || contentLower.includes('shorts') ||
                       visualLower.includes('video') || visualLower.includes('clip') || visualLower.includes('camera') || visualLower.includes('frame');
              }).length;

              const totalSynced = schedule.filter(p => p.status === 'scheduled').length;
              const syncPercentage = totalCampaignsPlanned > 0 ? Math.round((totalSynced / totalCampaignsPlanned) * 100) : 0;

              // Platform counts
              const platformCounts = AVAILABLE_PLATFORMS.reduce((acc, plat) => {
                acc[plat.id] = schedule.filter(p => p.platform === plat.id).length;
                return acc;
              }, {} as Record<string, number>);

              return (
                <div className="space-y-12 animate-scale-in">
                  {/* High-Level Summary Analytics View */}
                  <div id="scheduler-analytics-panel" className="bg-zinc-900 border border-zinc-800 rounded-[2.5rem] p-8 shadow-2xl space-y-8 relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-blue-600/5 rounded-full blur-3xl pointer-events-none" />
                    <div className="absolute bottom-0 left-0 w-64 h-64 bg-red-650/5 rounded-full blur-3xl pointer-events-none" />
                    
                    <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-zinc-800/80 pb-6 gap-4">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="w-2.5 h-2.5 rounded-full bg-blue-500 animate-pulse" />
                          <h3 className="text-xl font-black text-white uppercase tracking-tighter">Blitz Pipeline Analytics</h3>
                        </div>
                        <p className="text-zinc-500 text-xs mt-1">
                          High-level synthesis summary and milestone diagnostics for topic: <span className="text-blue-400 font-bold">"{topic || 'Preset Blueprint'}"</span>
                        </p>
                      </div>
                      <div className="text-right">
                        <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest block">Active Phase</span>
                        <span className="px-3 py-1 bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-black uppercase rounded-full tracking-wider inline-block mt-1">
                          7-Day Multi-Channel Blitz
                        </span>
                      </div>
                    </div>

                    {/* Analytics Metric Cards Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      {/* Card 1: Total Posts Planned */}
                      <div id="stat-card-total-posts" className="bg-zinc-950 p-6 rounded-2xl border border-zinc-850 flex items-center justify-between hover:border-zinc-800 transition-all">
                        <div className="space-y-1">
                          <span className="text-[9px] font-black uppercase text-zinc-500 tracking-widest block">Total Campaign Posts</span>
                          <span className="text-4xl font-black text-white block tracking-tight">{totalCampaignsPlanned}</span>
                          <span className="text-[10px] text-zinc-400 font-medium block">7-day scheduled distributions</span>
                        </div>
                        <div className="p-4 bg-zinc-900 rounded-2xl border border-zinc-800 text-blue-500">
                          <Briefcase size={22} />
                        </div>
                      </div>

                      {/* Card 2: Total Videos Planned */}
                      <div id="stat-card-total-videos" className="bg-zinc-950 p-6 rounded-2xl border border-zinc-850 flex items-center justify-between hover:border-zinc-800 transition-all">
                        <div className="space-y-1">
                          <span className="text-[9px] font-black uppercase text-zinc-500 tracking-widest block">Video Content Assets</span>
                          <span className="text-4xl font-black text-white block tracking-tight">{totalVideosPlanned}</span>
                          <span className="text-[10px] text-zinc-400 font-medium block">TikTok, Shorts, and Reels ready</span>
                        </div>
                        <div className="p-4 bg-zinc-900 rounded-2xl border border-zinc-800 text-pink-500">
                          <Sparkles size={22} />
                        </div>
                      </div>

                      {/* Card 3: Google Calendar Sync Quote */}
                      <div id="stat-card-sync-progress" className="bg-zinc-950 p-6 rounded-2xl border border-zinc-850 flex items-center justify-between hover:border-zinc-800 transition-all">
                        <div className="space-y-1">
                          <span className="text-[9px] font-black uppercase text-zinc-500 tracking-widest block">Calendar Synchronization</span>
                          <span className="text-4xl font-black text-white block tracking-tight">{syncPercentage}%</span>
                          <span className="text-[10px] text-zinc-400 font-medium block">{totalSynced} of {totalCampaignsPlanned} slots active</span>
                        </div>
                        <div className="p-4 bg-zinc-900 rounded-2xl border border-zinc-800 text-emerald-500">
                          <CheckCircle2 size={22} />
                        </div>
                      </div>
                    </div>

                    {/* Distribution and Milestones Sub-Grid */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                      {/* Content Distribution Breakdown */}
                      <div id="content-distribution-breakdown" className="bg-zinc-950/40 p-6 rounded-3xl border border-zinc-850/80 space-y-5">
                        <div className="flex items-center justify-between border-b border-zinc-900 pb-3">
                          <h4 className="text-xs font-black uppercase tracking-widest text-zinc-300">Content Type Distribution</h4>
                          <span className="text-[9px] font-mono text-zinc-600">Cross-Platform Weights</span>
                        </div>
                        <div className="space-y-4.5">
                          {AVAILABLE_PLATFORMS.map(plat => {
                            const count = platformCounts[plat.id] || 0;
                            const pct = totalCampaignsPlanned > 0 ? Math.round((count / totalCampaignsPlanned) * 100) : 0;
                            return (
                              <div key={plat.id} className="space-y-1.5">
                                <div className="flex justify-between items-center text-[11px] font-bold">
                                  <span className="flex items-center gap-1.5 text-zinc-350">
                                    <plat.icon size={13} className={plat.color} />
                                    {plat.label}
                                  </span>
                                  <span className="text-zinc-400 font-mono">{count} Posts ({pct}%)</span>
                                </div>
                                <div className="h-2 w-full bg-zinc-900 rounded-full overflow-hidden border border-zinc-900">
                                  <div 
                                    className={`h-full rounded-full transition-all duration-500 ${
                                      plat.id === 'twitter' ? 'bg-blue-400' :
                                      plat.id === 'linkedin' ? 'bg-blue-500' :
                                      plat.id === 'instagram' ? 'bg-pink-500' : 'bg-blue-600'
                                    }`}
                                    style={{ width: `${pct}%` }}
                                  />
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>

                      {/* Upcoming Campaign Milestones */}
                      <div id="campaign-milestones-timeline" className="bg-zinc-950/40 p-6 rounded-3xl border border-zinc-850/80 space-y-5">
                        <div className="flex items-center justify-between border-b border-zinc-900 pb-3">
                          <h4 className="text-xs font-black uppercase tracking-widest text-zinc-300">Campaign Execution Roadmaps</h4>
                          <span className="text-[9px] font-mono text-emerald-500">Upcoming Milestones</span>
                        </div>
                        <div className="space-y-4">
                          {/* Milestone 1 */}
                          <div className="flex items-start gap-3 relative">
                            <div className="absolute top-6 bottom-[-16px] left-[11px] w-0.5 bg-zinc-850" />
                            <div className="w-6 h-6 rounded-full bg-blue-500/10 border border-blue-500/30 flex items-center justify-center text-[9px] font-black text-blue-400 mt-0.5 shrink-0">
                              1
                            </div>
                            <div className="space-y-0.5">
                              <div className="flex items-center gap-2">
                                <h5 className="text-[12px] font-black text-zinc-200">Authority Launch Kickoff (Day 1-2)</h5>
                                <span className="text-[8px] font-black uppercase bg-blue-500/10 text-blue-400 px-1.5 py-0.2 rounded">Initial Spark</span>
                              </div>
                              <p className="text-[10px] text-zinc-500 leading-snug">
                                Deliver core high-concept hooks and problem statements on LinkedIn and Twitter to build direct topic resonance.
                              </p>
                            </div>
                          </div>

                          {/* Milestone 2 */}
                          <div className="flex items-start gap-3 relative">
                            <div className="absolute top-6 bottom-[-16px] left-[11px] w-0.5 bg-zinc-850" />
                            <div className="w-6 h-6 rounded-full bg-pink-500/10 border border-pink-500/30 flex items-center justify-center text-[9px] font-black text-pink-400 mt-0.5 shrink-0">
                              2
                            </div>
                            <div className="space-y-0.5">
                              <div className="flex items-center gap-2">
                                <h5 className="text-[12px] font-black text-zinc-200">Visual Engagement Amplification (Day 3-5)</h5>
                                <span className="text-[8px] font-black uppercase bg-pink-500/10 text-pink-400 px-1.5 py-0.2 rounded">Peak Traffic</span>
                              </div>
                              <p className="text-[10px] text-zinc-500 leading-snug">
                                Unleash descriptive visual carousels, video reels, and interactive polls to maximize multi-touch algorithm weight.
                              </p>
                            </div>
                          </div>

                          {/* Milestone 3 */}
                          <div className="flex items-start gap-3">
                            <div className="w-6 h-6 rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-[9px] font-black text-emerald-400 mt-0.5 shrink-0">
                              3
                            </div>
                            <div className="space-y-0.5">
                              <div className="flex items-center gap-2">
                                <h5 className="text-[12px] font-black text-zinc-200">Conversion Catalyst & Recap (Day 6-7)</h5>
                                <span className="text-[8px] font-black uppercase bg-emerald-500/10 text-emerald-400 px-1.5 py-0.2 rounded">CTA Close</span>
                              </div>
                              <p className="text-[10px] text-zinc-500 leading-snug">
                                Consolidate overall metrics, share key findings and digests, and deliver clear, authoritative call-to-actions.
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col md:flex-row gap-8">
                {/* Day Selection Slider */}
                <div className="w-full md:w-20 flex flex-row md:flex-col gap-2 shrink-0">
                  {[1, 2, 3, 4, 5, 6, 7].map((day) => (
                    <button
                      key={day}
                      onClick={() => setActiveDay(day)}
                      className={`flex-1 md:flex-none py-4 rounded-2xl border transition-all text-sm font-black flex items-center justify-center ${activeDay === day ? 'bg-blue-600 border-blue-500 text-white shadow-xl' : 'bg-zinc-950 border-zinc-900 text-zinc-600 hover:border-zinc-800'}`}
                    >
                      D{day}
                    </button>
                  ))}
                </div>

                {/* Day Content Feed */}
                <div className="flex-1 space-y-6">
                   <div className="flex items-center justify-between border-b border-zinc-900 pb-4">
                      <h3 className="text-xl font-black text-white uppercase tracking-tighter flex items-center gap-3">
                         <Calendar className="text-blue-500" /> Day {activeDay} Deployment
                      </h3>
                      <span className="text-[10px] font-black text-zinc-600 uppercase bg-zinc-950 px-3 py-1 rounded-full border border-zinc-900">{filteredPosts.length} Assets</span>
                   </div>

                   {filteredPosts.map((post, idx) => (
                      <div key={idx} className="bg-zinc-900/50 border border-zinc-800 rounded-[2.5rem] p-8 space-y-8 hover:border-zinc-700 transition-all">
                         <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                            <div className="flex items-center gap-4">
                               <div className="p-3 bg-zinc-950 rounded-2xl border border-zinc-800 text-blue-500">
                                  {getPlatformIcon(post.platform)}
                               </div>
                               <div>
                                  <span className="block text-lg font-black text-white uppercase tracking-widest">{post.platform}</span>
                                  <span className="text-xs text-zinc-600 font-bold uppercase flex items-center gap-2 mt-1">
                                     <Clock size={12} /> {post.time} Optimal Slot
                                  </span>
                               </div>
                            </div>
                            <div className="flex gap-2">
                               <button 
                                 onClick={() => {navigator.clipboard.writeText(post.content); alert('Post copied!')}}
                                 className="flex items-center gap-2 px-6 py-2.5 bg-zinc-800 hover:bg-zinc-700 rounded-xl text-[10px] font-black uppercase tracking-widest border border-zinc-700 transition-all"
                               >
                                  <Copy size={14} /> Clone
                               </button>
                               <button 
                                 onClick={() => handleSyncToGoogleCalendar(post)}
                                 className="flex items-center gap-2 px-6 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg transition-all"
                               >
                                  <Send size={14} /> {post.status === 'scheduled' ? 'Synced ✓' : 'Schedule'}
                               </button>
                            </div>
                         </div>

                         <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
                            <div className="space-y-6">
                               <div className="space-y-3">
                                  <label className="text-[10px] font-black text-zinc-700 uppercase tracking-widest flex items-center gap-2">
                                     <FileText size={12} /> Linguistic Draft
                                  </label>
                                  <div className="bg-zinc-950 p-6 rounded-2xl border border-zinc-800/50 shadow-inner">
                                     <p className="text-zinc-400 text-base leading-relaxed font-medium italic">"{post.content}"</p>
                                  </div>
                               </div>
                               <div className="flex flex-wrap gap-2">
                                  {post.hashtags?.map(h => (
                                     <span key={h} className="text-[11px] font-black text-blue-500 bg-blue-500/5 px-3 py-1 rounded-lg border border-blue-500/10">#{h.replace(/^#/, '')}</span>
                                  ))}
                               </div>
                            </div>

                            <div className="space-y-3">
                               <label className="text-[10px] font-black text-zinc-700 uppercase tracking-widest flex items-center gap-2">
                                  <Eye size={12} /> Live Preview
                               </label>
                               <div className="bg-zinc-950 border border-zinc-900 rounded-[2rem] p-6 shadow-2xl relative overflow-hidden group/prev">
                                  <div className="absolute inset-0 bg-blue-600/5 opacity-0 group-hover/prev:opacity-100 transition-opacity"></div>
                                  <PostPreview post={post} />
                               </div>
                            </div>
                         </div>
                      </div>
                   ))}
                </div>
                  </div>
                </div>
              );
            })()}

           {!schedule.length && !loading && (
              <div className="flex flex-col items-center justify-center py-32 text-zinc-800 gap-8 opacity-40">
                 <div className="w-48 h-48 rounded-[3.5rem] border-4 border-dashed border-zinc-900 flex items-center justify-center">
                    <Calendar size={80} strokeWidth={1} />
                 </div>
                 <div className="text-center space-y-2">
                    <p className="font-black uppercase tracking-[0.4em] text-sm">Campaign Pipeline Dormant</p>
                    <p className="text-[10px] font-bold tracking-widest uppercase opacity-60">Define target topic to synthesize multi-platform manifest</p>
                 </div>
              </div>
           )}
        </div>
      </div>

      {/* Google Calendar Overview & Batch Cleanup Panel */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-[2.5rem] p-8 shadow-2xl space-y-8 mt-12">
        <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-zinc-800 pb-6 gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-blue-500 animate-pulse" />
              <h3 className="text-xl font-black text-white uppercase tracking-tighter">Google Calendar Workspace Overview</h3>
            </div>
            <p className="text-zinc-500 text-xs mt-1">
              Live scheduled campaign deployments and outreach events synced with your active Google Calendar.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <button
              onClick={fetchEvents}
              disabled={fetchingEvents}
              className="flex items-center gap-2 px-4 py-2 bg-zinc-800 hover:bg-zinc-700 disabled:opacity-50 rounded-xl text-xs font-black uppercase tracking-wider border border-zinc-700 transition-all cursor-pointer text-white font-extrabold"
            >
              <RefreshCw size={14} className={fetchingEvents ? 'animate-spin' : ''} />
              {fetchingEvents ? 'Refreshing...' : 'Refresh Feed'}
            </button>
            <button
              onClick={handleBatchRemoveStaleEvents}
              className="flex items-center gap-2 px-4 py-2 bg-red-650/20 hover:bg-red-600/30 text-red-500 rounded-xl text-xs font-black uppercase tracking-wider border border-red-500/20 transition-all cursor-pointer text-white font-extrabold"
              title="Batch remove stale or past campaign events created by Ranktica"
            >
              <Trash2 size={14} />
              Batch Clean Expired Events
            </button>
          </div>
        </div>

        {fetchingEvents ? (
          <div className="flex flex-col items-center justify-center py-16 text-zinc-500 gap-3">
            <Loader2 className="animate-spin text-blue-500" size={32} />
            <p className="text-xs font-bold tracking-widest uppercase animate-pulse">Syncing Google Calendar Live Feed...</p>
          </div>
        ) : events.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {events.map((evt) => {
              const startStr = evt.start?.dateTime || evt.start?.date;
              const endStr = evt.end?.dateTime || evt.end?.date;
              const startDate = startStr ? new Date(startStr) : null;
              const endDate = endStr ? new Date(endStr) : null;
              
              const isStale = startDate && startDate < new Date();
              const isRanktica = evt.summary && (evt.summary.includes('Ranktica') || evt.description?.includes('Ranktica') || evt.summary.includes('[Publish]') || evt.summary.includes('[Release]'));

              return (
                <div 
                  key={evt.id} 
                  className={`p-5 rounded-2xl border transition-all flex flex-col justify-between ${
                    isStale 
                      ? 'bg-zinc-950/40 border-zinc-900 opacity-60' 
                      : isRanktica 
                      ? 'bg-zinc-950 border-blue-500/20 hover:border-blue-500/40' 
                      : 'bg-zinc-950 border-zinc-850 hover:border-zinc-800'
                  }`}
                >
                  <div className="space-y-3">
                    <div className="flex justify-between items-start gap-2">
                      <span className={`px-2.5 py-0.5 rounded text-[8.5px] font-black uppercase tracking-wider ${
                        isStale 
                          ? 'bg-zinc-800 text-zinc-500' 
                          : isRanktica 
                          ? 'bg-blue-600/10 text-blue-400 border border-blue-500/20' 
                          : 'bg-zinc-850 text-zinc-400'
                      }`}>
                        {isStale ? 'Stale / Past' : isRanktica ? 'Ranktica Event' : 'Calendar Event'}
                      </span>
                      
                      <button
                        onClick={() => handleDeleteEvent(evt.id, evt.summary)}
                        className="text-zinc-600 hover:text-red-500 p-1 rounded-lg hover:bg-zinc-900 transition-colors cursor-pointer"
                        title="Delete event from Google Calendar"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>

                    <div>
                      <h4 className="text-sm font-bold text-zinc-100 line-clamp-1" title={evt.summary}>
                        {evt.summary || 'No Title'}
                      </h4>
                      <p className="text-[10px] text-zinc-500 font-mono mt-1">
                        {startDate ? startDate.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' }) : 'No Date'} · {startDate ? startDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                      </p>
                    </div>

                    {evt.description && (
                      <p className="text-[10.5px] text-zinc-400 line-clamp-2 leading-relaxed bg-zinc-900/30 p-2.5 rounded-xl border border-zinc-900">
                        {evt.description}
                      </p>
                    )}
                  </div>

                  <div className="border-t border-zinc-900/60 pt-3 mt-3 flex justify-between items-center text-[9px] text-zinc-600 font-mono">
                    <span>STATUS: {evt.status?.toUpperCase() || 'CONFIRMED'}</span>
                    <span>{isRanktica ? 'SYNCED ✓' : 'EXTERNAL'}</span>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-16 text-zinc-500 border border-dashed border-zinc-800 rounded-3xl gap-4">
            <div className="w-16 h-16 rounded-2xl bg-zinc-950 flex items-center justify-center border border-zinc-850">
              <Calendar size={28} className="text-zinc-600" />
            </div>
            <div className="text-center max-w-sm space-y-1">
              <p className="text-xs font-black uppercase tracking-wider text-zinc-350">Google Calendar connection inactive or empty</p>
              <p className="text-[10px] text-zinc-500 leading-normal">
                Authorize Google Calendar using the visual sync button in the navigation header to fetch and view your live schedule list here.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
