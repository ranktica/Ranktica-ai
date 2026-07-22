import React, { useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { X, Keyboard, Command, Sparkles, Navigation, HelpCircle } from "lucide-react";

interface KeyboardShortcutCheatSheetProps {
  isOpen: boolean;
  onClose: () => void;
}

export const KeyboardShortcutCheatSheet: React.FC<KeyboardShortcutCheatSheetProps> = ({
  isOpen,
  onClose
}) => {
  // Listen to Escape key to close the overlay automatically
  useEffect(() => {
    if (!isOpen) return;
    
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        onClose();
      }
    };
    
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          {/* Backdrop Blur Layer */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/75 backdrop-blur-md"
            id="shortcut-backdrop"
          />

          {/* Centered Modal Content Card */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 15 }}
            transition={{ type: "spring", duration: 0.4 }}
            className="relative bg-zinc-900 border border-zinc-800 rounded-[2rem] p-8 max-w-lg w-full overflow-hidden shadow-2xl font-sans"
            id="shortcut-modal"
          >
            {/* Glowing Accent Ambient Riser */}
            <div className="absolute -top-12 -right-12 w-32 h-32 bg-red-600/10 rounded-full blur-2xl pointer-events-none" />
            <div className="absolute -bottom-12 -left-12 w-32 h-32 bg-indigo-600/10 rounded-full blur-2xl pointer-events-none" />

            {/* Modal Header */}
            <div className="flex justify-between items-center pb-4 border-b border-zinc-800 mb-6">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-red-600/10 border border-red-500/20 rounded-xl text-red-500">
                  <Keyboard size={18} />
                </div>
                <div>
                  <h4 className="text-sm font-black text-white uppercase tracking-wider">Keyboard Shortcut Cheat Sheet</h4>
                  <p className="text-[10px] text-zinc-500 font-mono">Ranktica AI Enterprise Workspace Hotkeys</p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-1.5 rounded-lg bg-zinc-950 border border-zinc-850 text-zinc-400 hover:text-white hover:border-zinc-700 transition-all cursor-pointer"
                aria-label="Close modal"
              >
                <X size={14} />
              </button>
            </div>

            {/* List of shortcuts categorized */}
            <div className="space-y-6 max-h-[60vh] overflow-y-auto pr-1 custom-scrollbar">
              
              {/* Category 1: Global Commands */}
              <div className="space-y-2.5">
                <span className="text-[9px] font-mono font-black uppercase text-zinc-500 tracking-widest flex items-center gap-1">
                  <Command size={10} className="text-red-500" /> Core Global Directives
                </span>
                
                <div className="space-y-1.5">
                  <div className="flex justify-between items-center py-1.5 border-b border-zinc-850/40 text-xs">
                    <span className="text-zinc-400 font-medium">Toggle Shortcut Cheat Sheet</span>
                    <kbd className="px-2 py-0.5 bg-zinc-950 border border-zinc-800 text-[10px] font-mono text-red-400 rounded-md font-bold shadow">
                      Ctrl + /
                    </kbd>
                  </div>
                  <div className="flex justify-between items-center py-1.5 border-b border-zinc-850/40 text-xs">
                    <span className="text-zinc-400 font-medium">Open Command Center Palette</span>
                    <kbd className="px-2 py-0.5 bg-zinc-950 border border-zinc-800 text-[10px] font-mono text-indigo-400 rounded-md font-bold shadow">
                      Ctrl + K
                    </kbd>
                  </div>
                  <div className="flex justify-between items-center py-1.5 border-b border-zinc-850/40 text-xs">
                    <span className="text-zinc-400 font-medium">Save Active Creator Workspace State</span>
                    <kbd className="px-2 py-0.5 bg-zinc-950 border border-zinc-800 text-[10px] font-mono text-green-400 rounded-md font-bold shadow">
                      Ctrl + S
                    </kbd>
                  </div>
                  <div className="flex justify-between items-center py-1.5 text-xs">
                    <span className="text-zinc-400 font-medium">Dismiss / Escape Overlay Modals</span>
                    <kbd className="px-2 py-0.5 bg-zinc-950 border border-zinc-800 text-[10px] font-mono text-zinc-400 rounded-md font-bold shadow">
                      Esc
                    </kbd>
                  </div>
                </div>
              </div>

              {/* Category 2: Module Navigation */}
              <div className="space-y-2.5">
                <span className="text-[9px] font-mono font-black uppercase text-zinc-500 tracking-widest flex items-center gap-1">
                  <Navigation size={10} className="text-indigo-400" /> Module Fast-Hop Hotkeys
                </span>
                
                <div className="space-y-1.5">
                  <div className="flex justify-between items-center py-1.5 border-b border-zinc-850/40 text-xs">
                    <span className="text-zinc-400 font-medium">Access Creator Dashboard</span>
                    <kbd className="px-2 py-0.5 bg-zinc-950 border border-zinc-800 text-[10px] font-mono text-zinc-350 rounded-md shadow">
                      Ctrl + Alt + D
                    </kbd>
                  </div>
                  <div className="flex justify-between items-center py-1.5 border-b border-zinc-850/40 text-xs">
                    <span className="text-zinc-400 font-medium">Access Projects Workspace</span>
                    <kbd className="px-2 py-0.5 bg-zinc-950 border border-zinc-800 text-[10px] font-mono text-zinc-350 rounded-md shadow">
                      Ctrl + Alt + P
                    </kbd>
                  </div>
                  <div className="flex justify-between items-center py-1.5 border-b border-zinc-850/40 text-xs">
                    <span className="text-zinc-400 font-medium">Access Script Writer Agent</span>
                    <kbd className="px-2 py-0.5 bg-zinc-950 border border-zinc-800 text-[10px] font-mono text-zinc-350 rounded-md shadow">
                      Ctrl + Alt + S
                    </kbd>
                  </div>
                  <div className="flex justify-between items-center py-1.5 border-b border-zinc-850/40 text-xs">
                    <span className="text-zinc-400 font-medium">Access Ideas Generator</span>
                    <kbd className="px-2 py-0.5 bg-zinc-950 border border-zinc-800 text-[10px] font-mono text-zinc-350 rounded-md shadow">
                      Ctrl + Alt + I
                    </kbd>
                  </div>
                  <div className="flex justify-between items-center py-1.5 border-b border-zinc-850/40 text-xs">
                    <span className="text-zinc-400 font-medium">Access Thumbnail Generator</span>
                    <kbd className="px-2 py-0.5 bg-zinc-950 border border-zinc-800 text-[10px] font-mono text-zinc-350 rounded-md shadow">
                      Ctrl + Alt + T
                    </kbd>
                  </div>
                  <div className="flex justify-between items-center py-1.5 text-xs">
                    <span className="text-zinc-400 font-medium">Access Video Generator Studio</span>
                    <kbd className="px-2 py-0.5 bg-zinc-950 border border-zinc-800 text-[10px] font-mono text-zinc-350 rounded-md shadow">
                      Ctrl + Alt + V
                    </kbd>
                  </div>
                </div>
              </div>

              {/* Category 3: Advanced Triggers */}
              <div className="space-y-2.5">
                <span className="text-[9px] font-mono font-black uppercase text-zinc-500 tracking-widest flex items-center gap-1">
                  <Sparkles size={10} className="text-green-500" /> Advanced Operations
                </span>
                
                <div className="space-y-1.5">
                  <div className="flex justify-between items-center py-1.5 border-b border-zinc-850/40 text-xs">
                    <span className="text-zinc-400 font-medium">Voice Navigator (Dictate Speech Command)</span>
                    <div className="flex items-center gap-1">
                      <span className="text-[9px] text-zinc-500 font-mono">Press & Hold</span>
                      <kbd className="px-2 py-0.5 bg-zinc-950 border border-zinc-800 text-[10px] font-mono text-zinc-350 rounded-md shadow">
                        Spacebar
                      </kbd>
                    </div>
                  </div>
                  <div className="flex justify-between items-center py-1.5 text-xs">
                    <span className="text-zinc-400 font-medium">Trigger Compiler / Execute Sandbox</span>
                    <kbd className="px-2 py-0.5 bg-zinc-950 border border-zinc-800 text-[10px] font-mono text-zinc-350 rounded-md shadow">
                      Ctrl + Enter
                    </kbd>
                  </div>
                </div>
              </div>
            </div>

            {/* Footer help tip */}
            <div className="mt-6 pt-4 border-t border-zinc-850 flex items-center gap-1.5 text-[10px] text-zinc-500 font-mono">
              <HelpCircle size={12} className="text-zinc-600" />
              <span>Tip: Press <span className="text-zinc-400 font-bold">Esc</span> or click backdrop blur to quickly exit this panel.</span>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
