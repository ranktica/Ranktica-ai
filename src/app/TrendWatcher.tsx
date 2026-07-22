import React, { useState } from 'react';
import { findTrends } from '@/infrastructure/gemini';
import { TrendResult } from '@/shared/types';
import { Loader2, TrendingUp, Flame, Search, ExternalLink } from 'lucide-react';

export const TrendWatcher: React.FC = () => {
  const [niche, setNiche] = useState('');
  const [trends, setTrends] = useState<TrendResult[]>([]);
  const [loading, setLoading] = useState(false);

  const handleScan = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!niche.trim()) return;
    setLoading(true);
    try {
      const results = await findTrends(niche);
      setTrends(results);
    } catch (e) {
      console.error(e);
      alert("Trend scanning failed.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-fade-in">
       <div className="text-center space-y-4 py-4">
        <h2 className="text-3xl font-bold text-white">Trend Watcher</h2>
        <p className="text-zinc-400">Discover breakout topics before they go viral.</p>
      </div>

      <form onSubmit={handleScan} className="max-w-xl mx-auto flex gap-4">
        <input
          value={niche}
          onChange={(e) => setNiche(e.target.value)}
          placeholder="Enter your niche (e.g. Gaming, Tech, Beauty)"
          className="flex-1 bg-zinc-900 border border-zinc-800 rounded-xl px-5 py-3 text-white focus:ring-2 focus:ring-red-500/50 outline-none"
        />
        <button
          type="submit"
          disabled={loading || !niche}
          className="bg-red-600 hover:bg-red-500 disabled:opacity-50 text-white px-8 py-3 rounded-xl font-bold transition-all flex items-center gap-2 shadow-lg shadow-red-600/20"
        >
          {loading ? <Loader2 className="animate-spin" /> : <><Flame size={18} /> Scan</>}
        </button>
      </form>

      {trends.length > 0 && (
        <div className="space-y-4">
           {trends.map((trend, idx) => (
             <div key={idx} className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 hover:border-red-500/50 transition-colors group">
                <div className="flex justify-between items-start mb-2">
                   <h3 className="text-xl font-bold text-white group-hover:text-red-400 transition-colors">{trend.topic}</h3>
                   <span className={`px-3 py-1 rounded-full text-xs font-bold border ${
                      trend.searchVolumeTrend === 'Exploding' 
                        ? 'bg-red-500/20 text-red-500 border-red-500/30' 
                        : trend.searchVolumeTrend === 'Rising' 
                        ? 'bg-orange-500/20 text-orange-500 border-orange-500/30' 
                        : 'bg-zinc-800 text-zinc-400 border-zinc-700'
                   }`}>
                      {trend.searchVolumeTrend}
                   </span>
                </div>
                
                <p className="text-zinc-300 mb-4 leading-relaxed text-sm">
                   {trend.description}
                </p>

                <div className="bg-zinc-950 p-4 rounded-xl border border-zinc-800/50 flex gap-3 items-start">
                   <TrendingUp className="text-blue-500 shrink-0 mt-1" size={18} />
                   <div>
                      <span className="text-xs font-bold text-zinc-500 uppercase tracking-wider block mb-1">Why It's Trending</span>
                      <p className="text-sm text-zinc-400">{trend.whyTrending}</p>
                   </div>
                </div>

                <div className="mt-4 flex justify-end">
                   <a 
                     href={`https://www.youtube.com/results?search_query=${encodeURIComponent(trend.topic)}`} 
                     target="_blank" 
                     rel="noreferrer"
                     className="text-xs flex items-center gap-1 text-zinc-500 hover:text-white transition-colors"
                   >
                     View on YouTube <ExternalLink size={12} />
                   </a>
                </div>
             </div>
           ))}
        </div>
      )}
    </div>
  );
};