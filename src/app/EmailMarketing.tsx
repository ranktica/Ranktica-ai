
import React, { useState, useEffect } from 'react';
import { generateEmailCampaignContent, generateEmailSubject } from '@/infrastructure/gemini';
import { EmailCampaign, EmailContact } from '@/shared/types';
import { Loader2, Mail, Users, BarChart3, Plus, Send, RefreshCw, Upload, CheckCircle2 } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';
import { useAuth } from '@/infrastructure/auth/AuthContext';

const TIER_LIMITS = {
  free: 100,
  pro: 1000
};

export const EmailMarketing: React.FC = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'dashboard' | 'campaigns' | 'audience'>('dashboard');
  const [loading, setLoading] = useState(false);
  const [campaigns, setCampaigns] = useState<EmailCampaign[]>([]);
  const [contacts, setContacts] = useState<EmailContact[]>([]);
  
  // Campaign Creation State
  const [isCreating, setIsCreating] = useState(false);
  const [newCampaignAudience, setNewCampaignAudience] = useState('');
  const [newCampaignGoal, setNewCampaignGoal] = useState('');
  const [generatedDraft, setGeneratedDraft] = useState<{ subject: string, body: string } | null>(null);
  const [regeneratingSubject, setRegeneratingSubject] = useState(false);
  
  // Simulated Sending State
  const [sendingId, setSendingId] = useState<string | null>(null);
  const [sendProgress, setSendProgress] = useState(0);

  // Initialize with dummy data if empty
  useEffect(() => {
    if (campaigns.length === 0) {
      setCampaigns([
        {
          id: '1',
          name: 'Welcome Series V1',
          subject: 'quick question about your video',
          body: 'Hey [Name],\n\nLoved your latest post...',
          targetAudience: 'Tech Creators',
          status: 'completed',
          totalRecipients: 85,
          sentCount: 85,
          stats: { openRate: 42, clickRate: 12, replyRate: 5, bounceRate: 2 },
          createdAt: Date.now() - 10000000
        }
      ]);
    }
  }, []);

  const limit = user?.plan === 'pro' ? TIER_LIMITS.pro : TIER_LIMITS.free;
  const used = campaigns.reduce((acc, c) => acc + c.sentCount, 0);

  // --- Actions ---

  const handleGenerateDraft = async () => {
    if (!newCampaignAudience || !newCampaignGoal) return;
    setLoading(true);
    try {
      const draft = await generateEmailCampaignContent(newCampaignAudience, newCampaignGoal);
      setGeneratedDraft(draft);
    } catch (e) {
      console.error(e);
      alert("Failed to generate email content");
    } finally {
      setLoading(false);
    }
  };

  const handleRegenerateSubject = async () => {
    if (!newCampaignAudience || !newCampaignGoal || !generatedDraft) return;
    setRegeneratingSubject(true);
    try {
      const newSubject = await generateEmailSubject(newCampaignAudience, newCampaignGoal);
      setGeneratedDraft(prev => prev ? { ...prev, subject: newSubject } : null);
    } catch (e) {
      console.error(e);
    } finally {
      setRegeneratingSubject(false);
    }
  };

  const handleCreateCampaign = () => {
    if (!generatedDraft) return;
    
    const newCamp: EmailCampaign = {
      id: Date.now().toString(),
      name: `${newCampaignGoal} - ${new Date().toLocaleDateString()}`,
      subject: generatedDraft.subject,
      body: generatedDraft.body,
      targetAudience: newCampaignAudience,
      status: 'draft',
      totalRecipients: Math.min(limit - used, 50), // Simulation cap
      sentCount: 0,
      stats: { openRate: 0, clickRate: 0, replyRate: 0, bounceRate: 0 },
      createdAt: Date.now()
    };

    setCampaigns([newCamp, ...campaigns]);
    setIsCreating(false);
    setGeneratedDraft(null);
    setNewCampaignAudience('');
    setNewCampaignGoal('');
    setActiveTab('campaigns');
  };

  const handleSendCampaign = (id: string) => {
    if (used >= limit) {
      alert("Monthly email limit reached. Please upgrade to send more.");
      return;
    }

    setSendingId(id);
    setSendProgress(0);
    
    // Simulate sending progress
    const interval = setInterval(() => {
      setSendProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          completeSending(id);
          return 100;
        }
        return prev + 10;
      });
    }, 300);
  };

  const completeSending = (id: string) => {
    setSendingId(null);
    setCampaigns(prev => prev.map(c => {
      if (c.id === id) {
        // Randomize success stats
        return {
          ...c,
          status: 'completed',
          sentCount: c.totalRecipients,
          stats: {
            openRate: Math.floor(Math.random() * 40) + 20, // 20-60%
            clickRate: Math.floor(Math.random() * 15) + 2, // 2-17%
            replyRate: Math.floor(Math.random() * 8) + 1, // 1-9%
            bounceRate: Math.floor(Math.random() * 5)
          }
        };
      }
      return c;
    }));
  };

  const handleUploadContacts = () => {
    // Simulate CSV upload
    const dummyContacts: EmailContact[] = Array.from({ length: 10 }).map((_, i) => ({
      id: i.toString(),
      email: `contact${i}@example.com`,
      name: `Contact ${i}`,
      company: `Company ${i}`
    }));
    setContacts(dummyContacts);
    alert("Simulated: 10 contacts uploaded successfully.");
  };

  // --- Renderers ---

  const renderDashboard = () => {
    const data = campaigns
      .filter(c => c.status === 'completed')
      .map(c => ({
        name: c.name.substring(0, 10) + '...',
        Opens: c.stats.openRate,
        Clicks: c.stats.clickRate,
        Replies: c.stats.replyRate
      }));

    return (
      <div className="space-y-6 animate-fade-in">
         <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-zinc-900 border border-zinc-800 p-6 rounded-2xl">
               <h4 className="text-zinc-500 text-sm font-medium">Emails Sent</h4>
               <p className="text-3xl font-bold text-white mt-2">{used} <span className="text-sm text-zinc-500 font-normal">/ {limit}</span></p>
               <div className="w-full bg-zinc-800 h-1.5 rounded-full mt-3 overflow-hidden">
                  <div className="bg-blue-600 h-full transition-all duration-500" style={{ width: `${(used/limit)*100}%` }}></div>
               </div>
            </div>
            <div className="bg-zinc-900 border border-zinc-800 p-6 rounded-2xl">
               <h4 className="text-zinc-500 text-sm font-medium">Avg. Open Rate</h4>
               <p className="text-3xl font-bold text-green-500 mt-2">
                 {Math.round(campaigns.reduce((acc, c) => acc + c.stats.openRate, 0) / (campaigns.filter(c=>c.status==='completed').length || 1))}%
               </p>
            </div>
            <div className="bg-zinc-900 border border-zinc-800 p-6 rounded-2xl">
               <h4 className="text-zinc-500 text-sm font-medium">Avg. Click Rate</h4>
               <p className="text-3xl font-bold text-blue-500 mt-2">
                 {Math.round(campaigns.reduce((acc, c) => acc + c.stats.clickRate, 0) / (campaigns.filter(c=>c.status==='completed').length || 1))}%
               </p>
            </div>
            <div className="bg-zinc-900 border border-zinc-800 p-6 rounded-2xl">
               <h4 className="text-zinc-500 text-sm font-medium">Avg. Reply Rate</h4>
               <p className="text-3xl font-bold text-purple-500 mt-2">
                 {Math.round(campaigns.reduce((acc, c) => acc + c.stats.replyRate, 0) / (campaigns.filter(c=>c.status==='completed').length || 1))}%
               </p>
            </div>
         </div>

         <div className="bg-zinc-900 border border-zinc-800 p-6 rounded-2xl h-80">
            <h3 className="text-lg font-bold text-white mb-6">Campaign Performance</h3>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data}>
                <XAxis dataKey="name" stroke="#52525b" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="#52525b" fontSize={12} tickLine={false} axisLine={false} />
                <Tooltip 
                  cursor={{ fill: '#27272a' }}
                  contentStyle={{ backgroundColor: '#18181b', border: '1px solid #27272a', borderRadius: '8px', color: '#fff' }} 
                />
                <Bar dataKey="Opens" fill="#22c55e" radius={[4,4,0,0]} />
                <Bar dataKey="Clicks" fill="#3b82f6" radius={[4,4,0,0]} />
                <Bar dataKey="Replies" fill="#a855f7" radius={[4,4,0,0]} />
              </BarChart>
            </ResponsiveContainer>
         </div>
      </div>
    );
  };

  const renderCampaigns = () => (
    <div className="space-y-4 animate-fade-in">
       {isCreating ? (
         <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 max-w-2xl mx-auto">
            <h3 className="text-xl font-bold text-white mb-6">Create New Campaign</h3>
            {!generatedDraft ? (
               <div className="space-y-4">
                  <div>
                    <label className="text-sm text-zinc-400 block mb-2">Target Audience</label>
                    <input 
                      value={newCampaignAudience}
                      onChange={e => setNewCampaignAudience(e.target.value)}
                      placeholder="e.g. Marketing Directors at SaaS companies"
                      className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-3 text-white focus:ring-2 focus:ring-blue-500/50 outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-sm text-zinc-400 block mb-2">Goal</label>
                    <textarea 
                      value={newCampaignGoal}
                      onChange={e => setNewCampaignGoal(e.target.value)}
                      placeholder="e.g. Get them to book a demo of my tool."
                      className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-3 text-white focus:ring-2 focus:ring-blue-500/50 outline-none h-24 resize-none"
                    />
                  </div>
                  <div className="flex gap-3">
                    <button onClick={() => setIsCreating(false)} className="px-4 py-2 rounded-lg hover:bg-zinc-800 text-zinc-400">Cancel</button>
                    <button 
                      onClick={handleGenerateDraft}
                      disabled={loading || !newCampaignGoal || !newCampaignAudience}
                      className="flex-1 bg-blue-600 hover:bg-blue-500 text-white py-2 rounded-lg font-medium flex items-center justify-center gap-2"
                    >
                       {loading ? <Loader2 className="animate-spin" size={16} /> : 'Generate with AI'}
                    </button>
                  </div>
               </div>
            ) : (
               <div className="space-y-4">
                  <div className="bg-zinc-950 p-4 rounded-xl border border-zinc-800">
                     <div className="flex justify-between items-center mb-1">
                        <p className="text-xs font-bold text-zinc-500 uppercase">Subject</p>
                        <button 
                           onClick={handleRegenerateSubject}
                           disabled={regeneratingSubject}
                           className="text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1 transition-colors"
                        >
                           <RefreshCw size={12} className={regeneratingSubject ? "animate-spin" : ""} />
                           {regeneratingSubject ? 'Rewriting...' : 'Rewrite'}
                        </button>
                     </div>
                     <p className="text-white font-medium mb-4 border-b border-zinc-800 pb-2">{generatedDraft.subject}</p>
                     <p className="text-xs font-bold text-zinc-500 uppercase mb-1">Body</p>
                     <p className="text-zinc-300 whitespace-pre-wrap">{generatedDraft.body}</p>
                  </div>
                  <div className="flex gap-3">
                    <button onClick={() => setGeneratedDraft(null)} className="px-4 py-2 rounded-lg hover:bg-zinc-800 text-zinc-400 flex items-center gap-2"><RefreshCw size={14}/> Regenerate All</button>
                    <button 
                      onClick={handleCreateCampaign}
                      className="flex-1 bg-green-600 hover:bg-green-500 text-white py-2 rounded-lg font-medium"
                    >
                       Save Campaign
                    </button>
                  </div>
               </div>
            )}
         </div>
       ) : (
         <div className="grid gap-4">
            <button 
              onClick={() => setIsCreating(true)}
              className="bg-blue-600 hover:bg-blue-500 text-white py-3 rounded-xl font-bold flex items-center justify-center gap-2 shadow-lg shadow-blue-600/20"
            >
               <Plus size={20} /> Create New Campaign
            </button>

            {campaigns.map(c => (
               <div key={c.id} className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 hover:border-zinc-700 transition-colors">
                  <div className="flex justify-between items-start mb-4">
                     <div>
                        <div className="flex items-center gap-2 mb-1">
                           <h4 className="font-bold text-white text-lg">{c.name}</h4>
                           <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded ${
                              c.status === 'completed' ? 'bg-green-500/20 text-green-500' :
                              c.status === 'sending' ? 'bg-blue-500/20 text-blue-500' :
                              'bg-zinc-700 text-zinc-400'
                           }`}>
                              {c.status}
                           </span>
                        </div>
                        <p className="text-sm text-zinc-400">Target: {c.targetAudience} • {c.totalRecipients} recipients</p>
                     </div>
                     {c.status === 'draft' && (
                        <button 
                           onClick={() => handleSendCampaign(c.id)}
                           className="bg-zinc-800 hover:bg-zinc-700 text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2"
                        >
                           <Send size={14} /> Send Now
                        </button>
                     )}
                     {c.status === 'sending' && sendingId === c.id && (
                        <div className="w-32">
                           <div className="flex justify-between text-xs text-blue-400 mb-1">
                              <span>Sending...</span>
                              <span>{sendProgress}%</span>
                           </div>
                           <div className="w-full bg-zinc-800 h-1.5 rounded-full overflow-hidden">
                              <div className="bg-blue-500 h-full transition-all duration-300" style={{ width: `${sendProgress}%` }}></div>
                           </div>
                        </div>
                     )}
                  </div>
                  
                  {c.status === 'completed' && (
                     <div className="grid grid-cols-4 gap-2 pt-4 border-t border-zinc-800">
                        <div className="text-center">
                           <p className="text-xs text-zinc-500 uppercase">Open Rate</p>
                           <p className="text-lg font-bold text-green-500">{c.stats.openRate}%</p>
                        </div>
                        <div className="text-center">
                           <p className="text-xs text-zinc-500 uppercase">Click Rate</p>
                           <p className="text-lg font-bold text-blue-500">{c.stats.clickRate}%</p>
                        </div>
                        <div className="text-center">
                           <p className="text-xs text-zinc-500 uppercase">Reply Rate</p>
                           <p className="text-lg font-bold text-purple-500">{c.stats.replyRate}%</p>
                        </div>
                        <div className="text-center">
                           <p className="text-xs text-zinc-500 uppercase">Bounce Rate</p>
                           <p className="text-lg font-bold text-zinc-500">{c.stats.bounceRate}%</p>
                        </div>
                     </div>
                  )}
               </div>
            ))}
         </div>
       )}
    </div>
  );

  const renderAudience = () => (
     <div className="space-y-6 animate-fade-in">
        <div className="flex justify-between items-center">
           <h3 className="text-xl font-bold text-white">Contact List</h3>
           <button 
             onClick={handleUploadContacts}
             className="bg-zinc-800 hover:bg-zinc-700 text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2"
           >
              <Upload size={16} /> Upload CSV
           </button>
        </div>

        {contacts.length === 0 ? (
           <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-12 text-center text-zinc-500 border-dashed">
              <Users size={48} className="mx-auto mb-4 opacity-50" />
              <p>No contacts uploaded yet.</p>
              <p className="text-xs mt-2">Upload a CSV to start sending campaigns.</p>
           </div>
        ) : (
           <div className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden">
              <table className="w-full text-left text-sm">
                 <thead className="bg-zinc-950 text-zinc-500 font-medium">
                    <tr>
                       <th className="px-6 py-3">Name</th>
                       <th className="px-6 py-3">Email</th>
                       <th className="px-6 py-3">Company</th>
                       <th className="px-6 py-3">Status</th>
                    </tr>
                 </thead>
                 <tbody className="divide-y divide-zinc-800 text-zinc-300">
                    {contacts.map(contact => (
                       <tr key={contact.id} className="hover:bg-zinc-800/50">
                          <td className="px-6 py-3">{contact.name}</td>
                          <td className="px-6 py-3">{contact.email}</td>
                          <td className="px-6 py-3">{contact.company || '-'}</td>
                          <td className="px-6 py-3 text-green-500 flex items-center gap-1"><CheckCircle2 size={12} /> Valid</td>
                       </tr>
                    ))}
                 </tbody>
              </table>
           </div>
        )}
     </div>
  );

  return (
    <div className="max-w-6xl mx-auto space-y-8 pb-10">
      <div className="flex items-end justify-between border-b border-zinc-800 pb-4">
        <div>
           <h2 className="text-3xl font-bold text-white">Email Blast Studio</h2>
           <p className="text-zinc-400">Cold email outreach with AI-powered copywriting and analytics.</p>
        </div>
        <div className="hidden md:block">
           <span className="text-xs px-3 py-1 bg-blue-900/30 text-blue-400 rounded-full border border-blue-500/30">
              {limit === 1000 ? 'Pro Plan: 1,000 emails/mo' : 'Free Plan: 100 emails/mo'}
           </span>
        </div>
      </div>

      <div className="flex gap-2 bg-zinc-900/50 p-1 rounded-xl w-fit">
         <button 
           onClick={() => setActiveTab('dashboard')}
           className={`px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2 ${activeTab === 'dashboard' ? 'bg-zinc-800 text-white shadow' : 'text-zinc-500 hover:text-white'}`}
         >
            <BarChart3 size={16} /> Dashboard
         </button>
         <button 
           onClick={() => setActiveTab('campaigns')}
           className={`px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2 ${activeTab === 'campaigns' ? 'bg-zinc-800 text-white shadow' : 'text-zinc-500 hover:text-white'}`}
         >
            <Mail size={16} /> Campaigns
         </button>
         <button 
           onClick={() => setActiveTab('audience')}
           className={`px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2 ${activeTab === 'audience' ? 'bg-zinc-800 text-white shadow' : 'text-zinc-500 hover:text-white'}`}
         >
            <Users size={16} /> Contacts
         </button>
      </div>

      {activeTab === 'dashboard' && renderDashboard()}
      {activeTab === 'campaigns' && renderCampaigns()}
      {activeTab === 'audience' && renderAudience()}
    </div>
  );
};
