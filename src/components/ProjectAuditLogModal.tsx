import React, { useState } from 'react';
import { Project } from '@/shared/types';
import { X, Clock, Inbox, FileJson, FileText, Download, Loader2, Sparkles } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { ReportExporter } from '@/shared/ReportExporter';
import { ExecutiveSummaryGenerator } from '@/shared/ExecutiveSummaryGenerator';

interface ProjectAuditLogModalProps {
  project: Project;
  onClose: () => void;
  historyLogs: any[];
}

export const ProjectAuditLogModal: React.FC<ProjectAuditLogModalProps> = ({
  project,
  onClose,
  historyLogs
}) => {
  const [isGeneratingSummary, setIsGeneratingSummary] = useState(false);

  // Filter logs for this specific project
  const projectLogs = historyLogs.filter(log => {
    if (!project) return false;
    const pId = log.metadata?.projectId || log.metadata?.project_id;
    if (pId === project.id) return true;
    const metadataTitle = log.metadata?.title;
    if (metadataTitle && metadataTitle === project.title) return true;
    if (log.action && log.action.toLowerCase().includes(project.title.toLowerCase())) return true;
    return false;
  });

  // Calculate stats
  const autoSaveCount = projectLogs.filter(l => 
    l.action === 'auto_save' || 
    (l.action && typeof l.action === 'string' && l.action.includes('Auto-saved'))
  ).length;

  const statusCount = projectLogs.filter(l => 
    l.metadata?.newStatus || 
    (l.action && typeof l.action === 'string' && l.action.toLowerCase().includes('status'))
  ).length;

  const handleExportLogs = () => {
    ReportExporter.exportAsJson(project, historyLogs);
  };

  const handleExportPdf = () => {
    try {
      ReportExporter.exportAsPdf(project, historyLogs);
    } catch (err: any) {
      console.error(err);
      toast.error('Failed to compile PDF history report.');
    }
  };

  const handleGenerateExecutiveSummary = async () => {
    if (isGeneratingSummary) return;
    setIsGeneratingSummary(true);
    const toastId = toast.loading('Querying server-side Gemini to draft high-fidelity executive briefings...');
    try {
      await ExecutiveSummaryGenerator.buildAndDownloadPdf(project);
      toast.success('Executive Alignment Brief downloaded!', { id: toastId });
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || 'Failed to synthesize executive brief.', { id: toastId });
    } finally {
      setIsGeneratingSummary(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/95 backdrop-blur-md p-4 animate-fade-in font-sans">
      <div className="bg-zinc-900 border border-zinc-800 rounded-[2.5rem] p-8 w-full max-w-xl shadow-2xl relative flex flex-col max-h-[85vh]">
        <div className="absolute top-0 right-0 w-32 h-32 bg-red-650/5 rounded-full blur-2xl pointer-events-none" />
        
        <div className="flex justify-between items-start mb-6 shrink-0">
          <div>
            <span className="text-[9px] font-black tracking-widest text-red-500 uppercase flex items-center gap-1.5 mb-1 font-mono">
              <Clock size={10} className="text-red-500 animate-pulse" /> Project Audit Matrix
            </span>
            <h3 className="text-2xl font-black text-white tracking-tight">{project.title}</h3>
            <p className="text-[10px] text-zinc-550 font-mono font-bold uppercase mt-1">
              Workspace ID: <span className="text-zinc-400 font-semibold">{project.id}</span>
            </p>
          </div>
          
          <button 
            type="button" 
            onClick={onClose} 
            className="p-1.5 bg-zinc-950 border border-zinc-850 hover:bg-zinc-850 rounded-xl text-zinc-400 hover:text-white transition-all cursor-pointer"
          >
            <X size={16} />
          </button>
        </div>

        <div className="grid grid-cols-2 gap-3 mb-6 shrink-0">
          <div className="bg-zinc-950/60 border border-zinc-850 p-3.5 rounded-2xl">
            <span className="text-[8px] font-black text-zinc-500 uppercase tracking-wider block font-mono">Total Logged Interactions</span>
            <span className="text-lg font-extrabold text-white font-mono mt-1 block">{projectLogs.length}</span>
          </div>
          <div className="bg-zinc-950/60 border border-zinc-850 p-3.5 rounded-2xl">
            <span className="text-[8px] font-black text-zinc-500 uppercase tracking-wider block font-mono">Status Updates / Auto Saves</span>
            <span className="text-lg font-extrabold text-red-400 font-mono mt-1 block">{statusCount} / {autoSaveCount}</span>
          </div>
        </div>

        {/* Audit Trail List */}
        <div className="flex-1 overflow-y-auto pr-1 space-y-3.5 my-2 border-y border-zinc-850/50 py-4 no-scrollbar">
          {projectLogs.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center py-12 text-zinc-650 font-mono">
              <Inbox size={24} className="mb-2 opacity-25 text-red-500 animate-bounce" />
              <p className="text-[10px] font-black uppercase tracking-wider text-zinc-500">Historical Void Detected</p>
              <p className="text-[9px] text-zinc-500 mt-1 font-sans font-semibold leading-relaxed max-w-[280px]">
                No detailed log updates were saved yet. Try status sequence updates, tag modifications, or auto-save edits within Workspace Settings to populate this log ledger.
              </p>
            </div>
          ) : (
            <div className="relative border-l border-zinc-850 ml-2 pl-4 space-y-4">
              {projectLogs.map((log) => {
                const isAutoSave = log.action === 'auto_save' || 
                  (log.action && typeof log.action === 'string' && log.action.toLowerCase().includes('auto-saved') || log.action.toLowerCase().includes('auto save'));
                return (
                  <div key={log.id} className="relative group transition-all">
                    {/* Marker circle */}
                    <div className={`absolute -left-[21px] top-1 w-2.5 h-2.5 rounded-full border border-zinc-950 ring-4 ${
                      isAutoSave ? 'bg-emerald-500 ring-emerald-500/10' : 'bg-red-500 ring-red-500/10'
                    }`} />
                    
                    <div className="bg-zinc-950/40 border border-zinc-850/40 p-3 rounded-2xl hover:bg-zinc-950/70 transition-all border-zinc-850">
                      <div className="flex justify-between items-center text-[8px] font-mono mb-2">
                        <span className={`font-black uppercase px-1.5 py-0.5 rounded ${
                          isAutoSave ? 'bg-emerald-950/50 text-emerald-400 border border-emerald-500/10' : 'bg-red-955/20 text-red-400 border border-red-500/10'
                        }`}>
                          {isAutoSave ? 'Auto Save' : log.type || 'State Update'}
                        </span>
                        <span className="text-zinc-600 font-bold">
                          {new Date(log.timestamp).toLocaleDateString()} {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      <p className="text-xs text-zinc-300 font-semibold leading-relaxed">
                        {log.action}
                      </p>
                      {log.metadata && Object.keys(log.metadata).length > 0 && (
                        <div className="mt-2 text-[9px] font-mono text-zinc-500 bg-zinc-950 p-2 rounded-lg border border-zinc-900/40 space-y-0.5">
                          {Object.entries(log.metadata).map(([k, v]) => {
                            if (k === 'projectId' || k === 'project_id') return null;
                            return (
                              <div key={k} className="flex justify-between">
                                <span className="text-zinc-600 font-extrabold uppercase">{k}:</span>
                                <span className="text-zinc-400 font-semibold max-w-[120px] truncate">{String(v)}</span>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="pt-4 flex flex-col sm:flex-row gap-2 shrink-0">
          <button
            type="button"
            onClick={handleExportLogs}
            className="flex-1 bg-zinc-950 hover:bg-zinc-850 text-zinc-300 hover:text-white border border-zinc-850 p-3 rounded-2xl text-[10px] font-black uppercase tracking-wider transition-all flex items-center justify-center gap-2 cursor-pointer active-press"
          >
            <FileJson size={14} className="text-yellow-400" /> Export JSON
          </button>
          <button
            type="button"
            onClick={handleExportPdf}
            className="flex-1 bg-zinc-950 hover:bg-zinc-850 text-zinc-300 hover:text-white border border-zinc-850 p-3 rounded-2xl text-[10px] font-black uppercase tracking-wider transition-all flex items-center justify-center gap-2 cursor-pointer active-press"
          >
            <FileText size={14} className="text-red-500" /> Export PDF
          </button>
          <button
            type="button"
            onClick={handleGenerateExecutiveSummary}
            disabled={isGeneratingSummary}
            className={`flex-1 p-3 rounded-2xl text-[10px] font-black uppercase tracking-wider transition-all flex items-center justify-center gap-2 cursor-pointer active-press border ${
              isGeneratingSummary 
                ? 'bg-zinc-900 border-zinc-800 text-zinc-500 cursor-not-allowed'
                : 'bg-red-950/20 hover:bg-red-950/40 text-red-400 border-red-900/30'
            }`}
          >
            {isGeneratingSummary ? (
              <>
                <Loader2 size={14} className="animate-spin text-red-500" /> Compiling...
              </>
            ) : (
              <>
                <Sparkles size={14} className="text-red-500 animate-pulse" /> Gemini AI Briefing
              </>
            )}
          </button>
          <button
            type="button"
            onClick={onClose}
            className="flex-1 bg-red-650 hover:bg-red-600 text-white p-3 rounded-2xl text-[10px] font-black uppercase tracking-wider transition-all cursor-pointer shadow-lg shadow-red-950/20 active-press text-center"
          >
            Dismiss
          </button>
        </div>
      </div>
    </div>
  );
};
