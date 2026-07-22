import React, { useState } from 'react';
import { useCommand } from '@/shared/CommandContext';
import { RotateCcw, RotateCw, History, Trash2, Sliders, ChevronDown, ChevronUp, Archive } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export const UndoRedoOverlay: React.FC = () => {
  const { 
    undoStack, 
    redoStack, 
    canUndo, 
    canRedo, 
    undo, 
    redo, 
    undoMultiple,
    redoMultiple,
    clearHistory 
  } = useCommand();

  const [isOpen, setIsOpen] = useState(false);
  const [batchCount, setBatchCount] = useState<number>(2);

  // If there are absolutely no actions recorded yet, keep the widget minimized or subtle
  const hasHistory = undoStack.length > 0 || redoStack.length > 0;

  if (!hasHistory) {
    return (
      <div 
        id="global-history-empty-trigger"
        className="fixed bottom-6 left-6 z-40 flex items-center gap-1.5 px-3 py-2 bg-zinc-900/40 border border-zinc-800/60 rounded-xl text-[10px] text-zinc-500 font-mono tracking-wide backdrop-blur"
      >
        <span className="h-1.5 w-1.5 rounded-full bg-zinc-700 animate-pulse" />
        <span>REVERSIBILITY ENGINE ACTIVE</span>
      </div>
    );
  }

  return (
    <div id="reversibility-control-container" className="fixed bottom-6 left-6 z-40 max-w-xs font-sans">
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 15, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 15, scale: 0.95 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            className="bg-zinc-950/95 border border-zinc-900 shadow-2xl rounded-2xl p-4 mb-3 backdrop-blur-md"
          >
            <div className="flex items-center justify-between border-b border-zinc-900 pb-2.5 mb-3">
              <div className="flex items-center gap-2">
                <History className="text-teal-400" size={13} />
                <span className="text-[11px] uppercase font-bold tracking-wider text-zinc-350 text-zinc-300">Action History Log</span>
              </div>
              <button
                type="button"
                onClick={clearHistory}
                className="text-[10px] text-red-500 hover:text-red-400 flex items-center gap-1 p-1 rounded hover:bg-red-500/10 transition cursor-pointer"
                title="Wipe action history"
              >
                <Trash2 size={11} />
                <span>Clear</span>
              </button>
            </div>

            {/* Batch Reversibility Engine Section */}
            {undoStack.length > 1 && (
              <div className="bg-zinc-900/40 border border-zinc-800/80 rounded-xl p-2.5 mb-3 text-[11px]">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="font-bold text-zinc-400 font-mono text-[9px] tracking-wider uppercase">BATCH SEQUENCE REVERT</span>
                  <Sliders size={11} className="text-zinc-500" />
                </div>
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center bg-zinc-950 border border-zinc-855 border-zinc-800 rounded-lg px-2 py-0.5 gap-2">
                    <button 
                      type="button"
                      disabled={batchCount <= 2}
                      onClick={() => setBatchCount(prev => Math.max(2, prev - 1))}
                      className="text-zinc-400 hover:text-white disabled:opacity-30 cursor-pointer text-[10px] font-bold"
                    >
                      -
                    </button>
                    <span className="font-mono text-zinc-200 min-w-[12px] text-center text-[10px]">{Math.min(batchCount, undoStack.length)}</span>
                    <button 
                      type="button"
                      disabled={batchCount >= undoStack.length}
                      onClick={() => setBatchCount(prev => Math.min(undoStack.length, prev + 1))}
                      className="text-zinc-400 hover:text-white disabled:opacity-30 cursor-pointer text-[10px] font-bold"
                    >
                      +
                    </button>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      const count = Math.min(batchCount, undoStack.length);
                      undoMultiple(count);
                    }}
                    className="flex-1 bg-red-600/10 hover:bg-red-600/20 border border-red-500/20 hover:border-red-500/40 text-red-400 font-semibold py-1 px-2 rounded-lg transition text-center cursor-pointer font-mono text-[9px] uppercase tracking-wider"
                  >
                    Revert {Math.min(batchCount, undoStack.length)} Actions
                  </button>
                </div>
              </div>
            )}

            {/* List layout */}
            <div className="space-y-1.5 max-h-48 overflow-y-auto mb-2 custom-scrollbar">
              {/* Redo Stack (Actions that were undone and can be re-done) */}
              {redoStack.map((cmd) => (
                <div 
                  key={cmd.id} 
                  className="flex items-center justify-between p-2 rounded-lg bg-zinc-900/30 border border-dashed border-zinc-800/40 text-[11px] opacity-50 hover:opacity-80 transition"
                  title="Undone state. Click Redo to restore."
                >
                  <div className="min-w-0 pr-1.5">
                    <span className="inline-block text-[8px] uppercase tracking-tighter px-1 py-0.2 rounded bg-zinc-800 text-zinc-400 border border-zinc-700/50 mb-0.5">
                      {cmd.tool}
                    </span>
                    <p className="text-zinc-400 font-mono line-through truncate">{cmd.label}</p>
                  </div>
                  <span className="text-[9px] font-bold text-amber-500/70 shrink-0 font-mono text-right">UNDONE</span>
                </div>
              ))}

              {/* Undo Stack (Recent active actions) */}
              {undoStack.length === 0 && redoStack.length > 0 && (
                <div className="text-[10px] text-center text-zinc-500 py-3 italic">
                  All active edits reversed.
                </div>
              )}

              {undoStack.map((cmd, i) => (
                <div 
                  key={cmd.id} 
                  className={`flex items-center justify-between p-2 rounded-lg border text-[11px] transition group ${
                    i === 0 
                      ? 'bg-teal-500/5 border-teal-500/20 text-zinc-200' 
                      : 'bg-zinc-900/60 border-zinc-800/80 text-zinc-300'
                  }`}
                >
                  <div className="min-w-0 pr-1.5 flex-1">
                    <span className={`inline-block text-[8px] uppercase tracking-tighter px-1 py-0.2 rounded mb-0.5 font-bold ${
                      cmd.tool === 'Script Writer' 
                        ? 'bg-purple-500/10 text-purple-400 border border-purple-500/20' 
                        : cmd.tool === 'Idea Generator'
                          ? 'bg-amber-500/15 text-amber-400 border border-amber-500/20'
                          : 'bg-teal-500/15 text-teal-400 border border-teal-500/20'
                    }`}>
                      {cmd.tool}
                    </span>
                    <p className="truncate font-mono font-medium">{cmd.label}</p>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      type="button"
                      onClick={() => {
                        undoMultiple(i + 1);
                      }}
                      className="text-[8px] uppercase tracking-tight bg-red-600/20 hover:bg-red-600/30 border border-red-500/30 text-red-400 font-mono font-bold px-1.5 py-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer duration-100"
                      title={`Batch revert up to here (${i + 1} actions)`}
                    >
                      Revert {i + 1}
                    </button>
                    <span className="text-[9px] text-zinc-500 shrink-0 font-mono text-right group-hover:hidden">
                      {i === 0 ? 'LATEST' : `#${undoStack.length - i}`}
                    </span>
                  </div>
                </div>
              ))}
            </div>

            <div className="text-[9px] text-zinc-500 font-mono text-center pt-1 border-t border-zinc-900">
              Total history deep space index: {undoStack.length + redoStack.length}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Floating control dock bar */}
      <div className="bg-zinc-900/90 border border-zinc-800 shadow-xl rounded-2xl flex items-center justify-between p-1.5 backdrop-blur-xl shrink-0">
        <button
          type="button"
          onClick={undo}
          disabled={!canUndo}
          className="flex items-center gap-1 bg-zinc-950/80 border border-zinc-800/60 hover:bg-zinc-800 disabled:opacity-40 disabled:hover:bg-transparent text-zinc-200 text-xs py-1.5 px-3 rounded-xl transition cursor-pointer active:scale-95 disabled:active:scale-100 disabled:cursor-not-allowed font-medium"
          title={canUndo ? `Undo: ${undoStack[0].label}` : 'No actions to undo'}
        >
          <RotateCcw size={12} />
          <span>Undo</span>
        </button>

        {/* History Log Toggle trigger */}
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className="hover:bg-zinc-800 hover:text-white p-1.5 rounded-lg text-zinc-400 transition cursor-pointer active:scale-95 flex items-center justify-center gap-1"
          title="Toggle Command History Registry Log"
        >
          <History size={13} className={isOpen ? 'text-teal-400' : ''} />
          <span className="text-[10px] font-mono select-none px-1 py-0.2 bg-zinc-950 rounded text-zinc-500 border border-zinc-850">
            {undoStack.length}
          </span>
          {isOpen ? <ChevronDown size={11} /> : <ChevronUp size={11} />}
        </button>

        <button
          type="button"
          onClick={redo}
          disabled={!canRedo}
          className="flex items-center gap-1 bg-zinc-950/80 border border-zinc-800/60 hover:bg-zinc-800 disabled:opacity-40 disabled:hover:bg-transparent text-zinc-200 text-xs py-1.5 px-3 rounded-xl transition cursor-pointer active:scale-95 disabled:active:scale-100 disabled:cursor-not-allowed font-medium"
          title={canRedo ? `Redo: ${redoStack[0].label}` : 'No actions to redo'}
        >
          <span>Redo</span>
          <RotateCw size={12} />
        </button>
      </div>
    </div>
  );
};

export default UndoRedoOverlay;
