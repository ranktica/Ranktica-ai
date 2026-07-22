
import React, { useState } from 'react';
import { VideoIdea, ToolType } from '@/shared/types';
import { Sparkles, Copy, Check, FileText, Bookmark, BookmarkCheck, BrainCircuit, ChevronDown, Search, BarChart3, TrendingUp } from 'lucide-react';

interface IdeaCardProps {
  idea: VideoIdea;
  onAction?: (tool: ToolType, payload: any) => void;
  isSaved?: boolean;
  onToggleSave?: (idea: VideoIdea) => void;
  isSelected?: boolean;
  onToggleSelect?: () => void;
}

export const IdeaCard: React.FC<IdeaCardProps> = ({ 
  idea, 
  onAction, 
  isSaved, 
  onToggleSave,
  isSelected = false,
  onToggleSelect
}) => {
  const [copied, setCopied] = useState(false);
  const [showLogic, setShowLogic] = useState(false);

  const handleCopy = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(`${idea.title}\n${idea.hook}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className={`group relative bg-zinc-900 border p-6 rounded-[2rem] transition-all duration-300 hover:shadow-2xl hover:shadow-red-500/5 animate-scale-in hover-lift flex flex-col ${
      isSelected 
        ? 'border-red-500 shadow-xl shadow-red-500/5 ring-1 ring-red-500/50' 
        : 'border-zinc-800 hover:border-red-500/40'
    }`}>
      <div className="flex justify-between items-start mb-4 shrink-0">
        <div className="flex flex-col gap-2">
           {onToggleSelect ? (
             <button
               type="button"
               onClick={(e) => {
                 e.stopPropagation();
                 onToggleSelect();
               }}
               className={`px-3 py-1.5 rounded-xl border text-[10px] font-black uppercase tracking-wider flex items-center gap-1.5 transition-all cursor-pointer active-press ${
                 isSelected
                   ? 'bg-red-600 border-red-500 text-white shadow-lg shadow-red-600/20'
                   : 'bg-zinc-950 border-zinc-800 text-zinc-500 hover:text-zinc-200 hover:border-zinc-700'
               }`}
             >
               <div className={`w-3.5 h-3.5 rounded-full border flex items-center justify-center transition-all ${
                 isSelected ? 'border-white bg-white text-red-600' : 'border-zinc-700 bg-transparent'
               }`}>
                 {isSelected && <Check size={10} strokeWidth={4} />}
               </div>
               <span>{isSelected ? 'Queued' : 'Queue'}</span>
             </button>
           ) : (
             <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest w-fit ${
               idea.score >= 8 ? 'bg-green-500/10 text-green-400 border border-green-500/20' : 
               idea.score >= 6 ? 'bg-yellow-500/10 text-yellow-400 border border-yellow-500/20' : 
               'bg-red-500/10 text-red-400 border border-red-500/20'
             }`}>
               Viral Potential: {idea.score}/10
             </span>
           )}
           
           <div className="flex gap-2">
              {idea.competition && (
                <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-lg bg-zinc-950 border border-zinc-800 text-[8px] font-black uppercase text-zinc-500 tracking-tighter">
                   <BarChart3 size={10} className={idea.competition === 'Low' ? 'text-green-500' : 'text-orange-500'} />
                   Supply: {idea.competition}
                </div>
              )}
              {idea.interest && (
                <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-lg bg-zinc-950 border border-zinc-800 text-[8px] font-black uppercase text-zinc-500 tracking-tighter">
                   <TrendingUp size={10} className={idea.interest === 'Exploding' ? 'text-red-500 animate-pulse' : 'text-blue-500'} />
                   Demand: {idea.interest}
                </div>
              )}
           </div>
        </div>
        <div className="flex gap-2">
          <button 
            onClick={() => onToggleSave?.(idea)}
            className={`p-2.5 rounded-xl transition-all active-press ${isSaved ? 'bg-red-600 text-white shadow-lg shadow-red-600/20' : 'bg-zinc-800 text-zinc-500 hover:text-white hover:bg-zinc-700'}`}
            title={isSaved ? "Remove from Library" : "Save to Gems"}
          >
            {isSaved ? <BookmarkCheck size={16} /> : <Bookmark size={16} />}
          </button>
          <button 
            onClick={() => onAction?.(ToolType.SEO, { title: idea.title, context: idea.hook })}
            className="p-2.5 rounded-xl bg-zinc-800 text-zinc-500 hover:text-white hover:bg-blue-600 transition-all active-press"
            title="Generate SEO Metadata"
          >
            <Search size={16} />
          </button>
          <button 
            onClick={() => onAction?.(ToolType.SCRIPT, { title: idea.title, instructions: `Hook: ${idea.hook}` })}
            className="p-2.5 rounded-xl bg-zinc-800 text-zinc-500 hover:text-white hover:bg-red-600 transition-all active-press"
            title="Draft Full Script"
          >
            <FileText size={16} />
          </button>
          <button 
            onClick={handleCopy}
            className={`p-2.5 rounded-xl transition-all active-press ${copied ? 'bg-green-500/10 text-green-500' : 'bg-zinc-800 text-zinc-500 hover:text-white hover:bg-zinc-700'}`}
            title="Copy Idea"
          >
            {copied ? <Check size={16} /> : <Copy size={16} />}
          </button>
        </div>
      </div>
      
      <h3 className="text-xl font-extrabold text-white mb-3 group-hover:text-red-500 transition-colors duration-300 leading-tight">
        {idea.title}
      </h3>
      
      <div className="flex-1 space-y-3">
        <div className="flex gap-3 items-start p-4 bg-zinc-950 border border-zinc-800 rounded-2xl group-hover:bg-zinc-900 transition-colors">
          <div className="p-2 bg-purple-500/10 rounded-lg shrink-0">
            <Sparkles size={16} className="text-purple-400" />
          </div>
          <p className="text-sm text-zinc-400 leading-relaxed">
            <span className="font-bold text-zinc-300 uppercase text-[10px] tracking-wider block mb-1">Viral Hook:</span> 
            {idea.hook}
          </p>
        </div>

        {idea.logic && (
          <div className="overflow-hidden">
            <button 
              onClick={() => setShowLogic(!showLogic)}
              className="w-full flex items-center justify-between text-[10px] font-black uppercase text-zinc-600 hover:text-zinc-400 py-1 transition-colors px-1"
            >
              <span className="flex items-center gap-1.5"><BrainCircuit size={12} className="text-blue-500" /> Psychological Logic</span>
              <ChevronDown size={14} className={`transition-transform duration-300 ${showLogic ? 'rotate-180' : ''}`} />
            </button>
            {showLogic && (
              <div className="mt-2 p-3 bg-blue-500/5 border border-blue-500/10 rounded-xl animate-fade-in">
                <p className="text-[11px] text-blue-300/80 leading-relaxed font-medium italic">
                  "{idea.logic}"
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
