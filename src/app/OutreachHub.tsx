import React, { useState } from 'react';
import { generateOutreachCampaign } from '@/infrastructure/gemini';
import { OutreachResult } from '@/shared/types';
import { 
  Loader2, 
  Linkedin, 
  MapPin, 
  Database,
  Globe,
  Sparkles,
  Calendar
} from 'lucide-react';
import { getCachedToken, loginWithGoogle } from '@/infrastructure/auth/firebase';
import { toast } from 'react-hot-toast';

const PLATFORMS = [
  { id: 'LinkedIn', icon: <Linkedin size={20} />, color: 'text-blue-500' },
  { id: 'Google Business', icon: <Globe size={20} />, color: 'text-yellow-500' }
];

export const OutreachHub: React.FC = () => {
  const [platform, setPlatform] = useState('LinkedIn');
  const [intent, setIntent] = useState('Lead Generation');
  const [duration, setDuration] = useState('14 Days');
  const [goal, setGoal] = useState('');
  const [customer, setCustomer] = useState('');
  const [city, setCity] = useState('');
  const [campaign, setCampaign] = useState<OutreachResult | null>(null);
  const [loading, setLoading] = useState(false);
  
  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!goal || !customer || !city) return;
    setLoading(true);
    try {
      const result = await generateOutreachCampaign(platform, intent, duration, goal, customer, city);
      setCampaign(result);
    } catch (e) {
      console.error(e);
      alert("Failed to generate outreach funnel.");
    } finally {
      setLoading(false);
    }
  };

  const handleSyncStepToCalendar = async (step: any) => {
    try {
      let token = getCachedToken();
      if (!token) {
        toast.loading('Google authorization needed. Spawning consent popup...', { id: 'outreach-gcal' });
        const authResult = await loginWithGoogle();
        token = authResult.token;
        toast.success('Successfully authorized Google Workspace!', { id: 'outreach-gcal' });
      }

      // Explicit user confirmation before mutating/creating calendar event
      const isConfirmed = window.confirm(`Authorize Ranktica to add outreach campaign step "${step.label}" to your Google Calendar?`);
      if (!isConfirmed) return;

      toast.loading('Synchronizing step with Google Calendar API...', { id: 'outreach-gcal' });

      // Calculate relative date based on step number
      const eventDate = new Date();
      eventDate.setDate(eventDate.getDate() + (parseInt(step.step, 10) || 1));
      eventDate.setHours(9, 0, 0, 0); // Default to 9:00 AM

      const endDate = new Date(eventDate.getTime() + 30 * 60 * 1000); // 30 mins later

      const eventPayload = {
        summary: `🎯 [Outreach] Ranktica: ${step.label}`,
        description: `Campaign Platform: ${platform}\nGoal: ${goal}\nTarget Client Profile: ${customer}\nTarget City: ${city}\n\nOutreach Step Message:\n"${step.message}"`,
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
        throw new Error(errData.error?.message || 'Google Calendar request rejected.');
      }

      toast.success(`Outreach step scheduled successfully on ${eventDate.toLocaleDateString()} at 9:00 AM!`, { id: 'outreach-gcal' });
    } catch (err: any) {
      toast.error(`Sync Failed: ${err.message}`, { id: 'outreach-gcal' });
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-12 animate-fade-in pb-20">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h2 className="text-4xl font-black text-white tracking-tighter">Outreach Hub</h2>
          <p className="text-zinc-400">Architect and execute hyper-targeted growth funnels.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-4 space-y-6">
           <div className="bg-zinc-900 border border-zinc-800 rounded-[2.5rem] p-8 shadow-2xl space-y-8">
              <div>
                <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest block mb-4 ml-1">Target Ecosystem</label>
                <div className="grid grid-cols-2 gap-2">
                   {PLATFORMS.map(p => (
                     <button
                       key={p.id}
                       onClick={() => setPlatform(p.id)}
                       className={`flex flex-col items-center justify-center p-4 rounded-2xl border transition-all ${platform === p.id ? 'bg-zinc-800 border-zinc-600 text-white' : 'bg-zinc-950 border-zinc-800 text-zinc-700'}`}
                     >
                        <div className="mb-2">{p.icon}</div>
                        <span className="text-[9px] font-black uppercase text-center">{p.id}</span>
                     </button>
                   ))}
                </div>
              </div>

              <div className="space-y-4 pt-4 border-t border-zinc-800">
                 <input value={goal} onChange={e => setGoal(e.target.value)} placeholder="Specific Goal (e.g. 20 Demos)" className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-3 text-white text-xs" />
                 <input value={customer} onChange={e => setCustomer(e.target.value)} placeholder="Target Customer Profile" className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-3 text-white text-xs" />
                 <div className="relative">
                    <MapPin size={14} className="absolute left-3 top-3 text-zinc-600" />
                    <input value={city} onChange={e => setCity(e.target.value)} placeholder="Target City" className="w-full bg-zinc-950 border border-zinc-800 rounded-xl pl-9 pr-3 py-3 text-white text-xs" />
                  </div>
                 <button onClick={handleGenerate} disabled={loading || !goal} className="w-full bg-red-600 hover:bg-red-500 text-white py-4 rounded-2xl font-black uppercase text-xs tracking-widest flex items-center justify-center gap-2">
                   {loading ? <Loader2 className="animate-spin" size={18} /> : <><Sparkles size={18} fill="currentColor" /> Generate Funnel</>}
                 </button>
              </div>
           </div>
        </div>

        <div className="lg:col-span-8">
           {campaign ? (
              <div className="space-y-6">
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {campaign.funnelSteps.map((step, i) => (
                       <div key={i} className="bg-zinc-900 border border-zinc-800 rounded-[2rem] p-6 hover:border-blue-500/30 transition-all animate-scale-in">
                          <div className="flex justify-between items-start mb-4">
                             <button 
                               onClick={() => handleSyncStepToCalendar(step)}
                               className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600/10 hover:bg-blue-600 hover:text-white text-blue-500 rounded-lg text-[9px] font-black uppercase tracking-widest border border-blue-500/20 transition-all ml-auto mr-2 order-last"
                               title="Sync Step to Google Calendar"
                             >
                                <Calendar size={12} /> Sync
                             </button>
                             <div className="w-10 h-10 bg-zinc-950 border border-zinc-800 rounded-2xl flex items-center justify-center font-black text-blue-500">
                                {step.step}
                             </div>
                          </div>
                          <h4 className="text-sm font-black text-white uppercase tracking-widest mb-2">{step.label}</h4>
                          <p className="text-xs text-zinc-400 font-medium leading-relaxed bg-zinc-950 p-4 rounded-xl border border-zinc-800">{step.message}</p>
                       </div>
                    ))}
                 </div>
              </div>
           ) : (
             <div className="bg-zinc-900 border border-zinc-800 rounded-[3rem] p-12 h-full flex flex-col items-center justify-center text-center opacity-30">
                 <Database size={64} className="mb-6" />
                 <p className="text-sm font-black uppercase tracking-[0.2em]">Workspace Ready</p>
              </div>
           )}
        </div>
      </div>
    </div>
  );
};
