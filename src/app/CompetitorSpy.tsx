import React, { useState, useEffect } from 'react';
import { analyzeCompetitor } from '@/infrastructure/gemini';
import { CompetitorAnalysis } from '@/shared/types';
import { Loader2, UserCheck, Target, Crosshair, BarChart3, Clock } from 'lucide-react';

export const CompetitorSpy: React.FC = () => {
  const [competitor, setCompetitor] = useState('');
  const [analysis, setAnalysis] = useState<CompetitorAnalysis | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const handleRankticaAction = (event: Event) => {
      const customEvent = event as CustomEvent;
      const { actionType } = customEvent.detail || {};
      if (actionType === 'analyze') {
        const query = competitor.trim() || 'MKBHD';
        setCompetitor(query);
        setTimeout(() => {
          const mockEvent = { preventDefault: () => {} } as React.FormEvent;
          handleAnalyze(mockEvent);
        }, 100);
      }
    };
    window.addEventListener('ranktica-action', handleRankticaAction);
    return () => window.removeEventListener('ranktica-action', handleRankticaAction);
  }, [competitor]);

  const handleAnalyze = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!competitor.trim()) return;
    setLoading(true);
    try {
      const result = await analyzeCompetitor(competitor);
      setAnalysis(result);
    } catch (e) {
      console.error(e);
      alert("Competitor analysis failed.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-fade-in">
       <div className="text-center space-y-4 py-4">
        <h2 className="text-3xl font-bold text-white">Competitor Spy</h2>
        <p className="text-zinc-400">Unlock your rivals' strategy with AI Market Research.</p>
      </div>

      <form onSubmit={handleAnalyze} className="max-w-2xl mx-auto flex gap-4">
        <input
          value={competitor}
          onChange={(e) => setCompetitor(e.target.value)}
          placeholder="Enter Channel Name (e.g. MKBHD) or URL"
          className="flex-1 bg-zinc-900 border border-zinc-800 rounded-xl px-5 py-3 text-white focus:ring-2 focus:ring-blue-500/50 outline-none"
        />
        <button
          type="submit"
          disabled={loading || !competitor}
          className="bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white px-8 py-3 rounded-xl font-bold transition-all flex items-center gap-2 shadow-[0_0_20px_rgba(37,99,235,0.3)]"
        >
          {loading ? <Loader2 className="animate-spin" /> : <><Target size={18} /> Analyze</>}
        </button>
      </form>

      {analysis && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Strategy & Overview */}
          <div className="col-span-1 md:col-span-2 bg-zinc-900 border border-zinc-800 rounded-2xl p-6">
             <div className="flex items-center gap-3 mb-4">
               <div className="p-2 bg-blue-500/10 rounded-lg"><UserCheck className="text-blue-500" /></div>
               <div>
                 <h3 className="text-xl font-bold text-white">{analysis.channelName}</h3>
                 <p className="text-sm text-zinc-500">Strategic Overview</p>
               </div>
             </div>
             <p className="text-zinc-300 leading-relaxed bg-zinc-950 p-4 rounded-xl border border-zinc-800">
               {analysis.strategy}
             </p>
             <div className="mt-4 flex items-center gap-2 text-sm text-zinc-400">
                <Clock size={16} /> 
                <span className="font-medium text-white">Upload Schedule:</span> {analysis.uploadSchedule}
             </div>
          </div>

          {/* SWOT Analysis */}
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6">
             <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2"><BarChart3 size={18} /> SWOT Analysis</h3>
             <div className="space-y-4">
               <div>
                 <h4 className="text-xs font-bold text-green-500 uppercase mb-1">Strengths</h4>
                 <ul className="text-sm text-zinc-300 list-disc pl-4">{analysis.swot?.strengths?.map((s,i) => <li key={i}>{s}</li>)}</ul>
               </div>
               <div>
                 <h4 className="text-xs font-bold text-red-500 uppercase mb-1">Weaknesses</h4>
                 <ul className="text-sm text-zinc-300 list-disc pl-4">{analysis.swot?.weaknesses?.map((s,i) => <li key={i}>{s}</li>)}</ul>
               </div>
               <div>
                 <h4 className="text-xs font-bold text-blue-500 uppercase mb-1">Opportunities</h4>
                 <ul className="text-sm text-zinc-300 list-disc pl-4">{analysis.swot?.opportunities?.map((s,i) => <li key={i}>{s}</li>)}</ul>
               </div>
             </div>
          </div>

          {/* Keywords */}
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6">
             <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2"><Crosshair size={18} /> Top Keywords</h3>
             <div className="flex flex-wrap gap-2">
               {analysis.topKeywords?.map((kw, i) => (
                 <span key={i} className="px-3 py-1 bg-zinc-800 text-zinc-200 rounded-full text-sm border border-zinc-700">
                   {kw}
                 </span>
               ))}
             </div>
          </div>
        </div>
      )}
    </div>
  );
};