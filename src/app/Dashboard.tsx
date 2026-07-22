
import React from 'react';
import { ToolType } from '@/shared/types';
import { useAuth } from '@/infrastructure/auth/AuthContext';
import { 
  ArrowRight, 
  Lightbulb, 
  FileText, 
  Image as ImageIcon, 
  Search,
  BarChart2,
  TrendingUp,
  Video
} from 'lucide-react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  ResponsiveContainer, 
  Cell 
} from 'recharts';

interface DashboardProps {
  onNavigate: (tool: ToolType) => void;
}

export const Dashboard: React.FC<DashboardProps> = ({ onNavigate }) => {
  const { user } = useAuth();
  const stats = user?.stats || { 
    ideasGenerated: 0, 
    scriptsWritten: 0, 
    thumbnailsCreated: 0, 
    seoOptimized: 0, 
    marketingPlans: 0 
  };

  const chartData = [
    { name: 'Ideas', count: stats.ideasGenerated, color: '#ef4444' }, // Red
    { name: 'Scripts', count: stats.scriptsWritten, color: '#f97316' }, // Orange
    { name: 'Thumbnails', count: stats.thumbnailsCreated, color: '#eab308' }, // Yellow
    { name: 'SEO', count: stats.seoOptimized, color: '#3b82f6' }, // Blue
    { name: 'Marketing', count: stats.marketingPlans, color: '#a855f7' } // Purple
  ];

  const StatCard = ({ label, count, icon: Icon, colorClass, bgClass }: any) => (
    <div className={`p-6 rounded-2xl border ${bgClass} border-opacity-20`}>
      <div className="flex justify-between items-start mb-4">
        <div className={`p-2 rounded-lg ${bgClass} bg-opacity-30`}>
          <Icon className={colorClass} size={24} />
        </div>
        <span className="text-3xl font-bold text-white">{count}</span>
      </div>
      <h3 className="text-sm font-medium text-zinc-400">{label}</h3>
    </div>
  );

  return (
    <div className="space-y-8 animate-fade-in pb-10">
      <header className="flex justify-between items-end">
        <div className="space-y-2">
          <h2 className="text-3xl font-bold text-white">Dashboard</h2>
          <p className="text-zinc-400">Track your automation activity and create new content.</p>
        </div>
        <div className="hidden md:block">
           <span className="text-xs px-3 py-1 bg-zinc-800 rounded-full text-zinc-400 border border-zinc-700">
             Real-time Analytics
           </span>
        </div>
      </header>

      {/* Analytics Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard 
          label="Ideas Generated" 
          count={stats.ideasGenerated} 
          icon={Lightbulb} 
          colorClass="text-red-500" 
          bgClass="bg-red-500/10 border-red-500"
        />
        <StatCard 
          label="Scripts Written" 
          count={stats.scriptsWritten} 
          icon={FileText} 
          colorClass="text-orange-500" 
          bgClass="bg-orange-500/10 border-orange-500"
        />
        <StatCard 
          label="Thumbnails" 
          count={stats.thumbnailsCreated} 
          icon={ImageIcon} 
          colorClass="text-yellow-500" 
          bgClass="bg-yellow-500/10 border-yellow-500"
        />
        <StatCard 
          label="SEO Tasks" 
          count={stats.seoOptimized} 
          icon={Search} 
          colorClass="text-blue-500" 
          bgClass="bg-blue-500/10 border-blue-500"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Chart */}
        <div className="lg:col-span-2 bg-zinc-900 border border-zinc-800 rounded-2xl p-6 shadow-xl">
           <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <BarChart2 size={20} className="text-zinc-400" /> Usage Overview
              </h3>
           </div>
           <div className="h-64 w-full">
             <ResponsiveContainer width="100%" height="100%">
               <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                 <XAxis 
                    dataKey="name" 
                    stroke="#52525b" 
                    fontSize={12} 
                    tickLine={false} 
                    axisLine={false} 
                 />
                 <YAxis 
                    stroke="#52525b" 
                    fontSize={12} 
                    tickLine={false} 
                    axisLine={false}
                 />
                 <Tooltip 
                    cursor={{ fill: '#27272a' }}
                    contentStyle={{ backgroundColor: '#18181b', border: '1px solid #27272a', borderRadius: '8px', color: '#fff' }}
                    itemStyle={{ color: '#fff' }}
                 />
                 <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                    {chartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                 </Bar>
               </BarChart>
             </ResponsiveContainer>
           </div>
        </div>

        {/* Quick Start / Trending */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 shadow-xl flex flex-col justify-between">
            <div>
              <h3 className="text-lg font-bold text-white flex items-center gap-2 mb-4">
                <TrendingUp size={20} className="text-green-500" /> Recommended Actions
              </h3>
              <p className="text-sm text-zinc-400 mb-6">Based on your recent activity, here's what you should do next to grow your channel.</p>
              
              <div className="space-y-3">
                 <button 
                   onClick={() => onNavigate(ToolType.IDEAS)}
                   className="w-full text-left px-4 py-3 bg-zinc-950 hover:bg-zinc-800 border border-zinc-800 rounded-xl transition-colors text-sm text-zinc-300 hover:text-white flex items-center justify-between group"
                 >
                    <span>Brainstorm 5 new topics</span>
                    <ArrowRight size={14} className="opacity-0 group-hover:opacity-100 transition-opacity text-red-500" />
                 </button>
                 <button 
                   onClick={() => onNavigate(ToolType.THUMBNAIL)}
                   className="w-full text-left px-4 py-3 bg-zinc-950 hover:bg-zinc-800 border border-zinc-800 rounded-xl transition-colors text-sm text-zinc-300 hover:text-white flex items-center justify-between group"
                 >
                    <span>Create a 4K Thumbnail</span>
                    <ArrowRight size={14} className="opacity-0 group-hover:opacity-100 transition-opacity text-yellow-500" />
                 </button>
              </div>
            </div>
            
            <div className="mt-6 pt-6 border-t border-zinc-800">
               <div className="flex items-center justify-between text-xs text-zinc-500">
                  <span>Current Plan: {user?.plan === 'pro' ? 'Pro' : 'Free Trial'}</span>
                  <span>Reset Stats</span>
               </div>
            </div>
        </div>
      </div>

      {/* Main Tools Grid */}
      <div className="space-y-4">
        <h3 className="text-xl font-bold text-white">All Tools</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <button 
            onClick={() => onNavigate(ToolType.VIDEO)}
            className="group flex items-center justify-between p-5 bg-zinc-900 border border-zinc-800 rounded-xl hover:bg-zinc-800 transition-all text-left"
          >
             <div>
                <h4 className="font-semibold text-white group-hover:text-red-400 transition-colors">Video Studio</h4>
                <p className="text-sm text-zinc-500">Sequence & edit manifests</p>
             </div>
             <ArrowRight className="text-zinc-600 group-hover:text-red-400 group-hover:translate-x-1 transition-all" />
          </button>

          <button 
            onClick={() => onNavigate(ToolType.SCRIPT)}
            className="group flex items-center justify-between p-5 bg-zinc-900 border border-zinc-800 rounded-xl hover:bg-zinc-800 transition-all text-left"
          >
             <div>
                <h4 className="font-semibold text-white group-hover:text-orange-400 transition-colors">Script Writer</h4>
                <p className="text-sm text-zinc-500">Draft full scripts</p>
             </div>
             <ArrowRight className="text-zinc-600 group-hover:text-orange-400 group-hover:translate-x-1 transition-all" />
          </button>

          <button 
            onClick={() => onNavigate(ToolType.SEO)}
            className="group flex items-center justify-between p-5 bg-zinc-900 border border-zinc-800 rounded-xl hover:bg-zinc-800 transition-all text-left"
          >
             <div>
                <h4 className="font-semibold text-white group-hover:text-blue-400 transition-colors">SEO Optimizer</h4>
                <p className="text-sm text-zinc-500">Get tags & titles</p>
             </div>
             <ArrowRight className="text-zinc-600 group-hover:text-blue-400 group-hover:translate-x-1 transition-all" />
          </button>

          <button 
            onClick={() => onNavigate(ToolType.MARKETING)}
            className="group flex items-center justify-between p-5 bg-zinc-900 border border-zinc-800 rounded-xl hover:bg-zinc-800 transition-all text-left"
          >
             <div>
                <h4 className="font-semibold text-white group-hover:text-purple-400 transition-colors">Marketing</h4>
                <p className="text-sm text-zinc-500">Schedule posts</p>
             </div>
             <ArrowRight className="text-zinc-600 group-hover:text-purple-400 group-hover:translate-x-1 transition-all" />
          </button>
        </div>
      </div>
    </div>
  );
};
