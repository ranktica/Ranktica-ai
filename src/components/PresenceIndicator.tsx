import React, { useState, useEffect, useRef } from 'react';
import { useProject } from '@/app/ProjectContext';
import { useAuth } from '@/infrastructure/auth/AuthContext';
import { Users, ChevronDown, Check, Sparkles, UserCheck, Radio } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { toast } from 'react-hot-toast';

export const PresenceIndicator: React.FC = () => {
  const { 
    collaborators = [], 
    updateUserPresence,
    activeProject = null
  } = useProject() || {};
  const { user } = useAuth();
  
  const [showPresenceDropdown, setShowPresenceDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setShowPresenceDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleBroadcast = () => {
    if (updateUserPresence) {
      updateUserPresence('Dashboard');
      toast.success('Active presence payload broadcasted!', { 
        id: 'presence-force-broadcast',
        duration: 2000,
        icon: '📡'
      });
    }
  };

  // Listen to custom presence events for diagnostics or UI reactive sync
  useEffect(() => {
    const handlePresenceEvent = (e: Event) => {
      const customEvent = e as CustomEvent;
      console.debug('[Presence Event Emitted]', customEvent.detail);
    };

    window.addEventListener('ranktica-presence-updated', handlePresenceEvent);
    return () => window.removeEventListener('ranktica-presence-updated', handlePresenceEvent);
  }, []);

  return (
    <div ref={dropdownRef} className="relative z-40" id="ranktica-presence-indicator">
      <button
        type="button"
        onClick={() => setShowPresenceDropdown(!showPresenceDropdown)}
        className="flex items-center gap-2 bg-zinc-950 hover:bg-zinc-900 border border-zinc-850 px-3.5 py-1.5 rounded-2xl cursor-pointer transition-all active:scale-95"
      >
        <div className="relative flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
        </div>
        <div className="flex -space-x-1.5">
          {collaborators && collaborators.length > 0 ? (
            collaborators.slice(0, 4).map((c, idx) => {
              const initials = c.name ? c.name.substring(0, 1).toUpperCase() : 'A';
              const isMe = c.userId === user?.email;
              return (
                <div 
                  key={idx}
                  title={`${c.name || 'Anonymous Creator'} (${c.activeTool || 'Idle'})`}
                  className={`w-5 h-5 rounded-full border border-zinc-950 flex items-center justify-center text-[8px] font-black uppercase text-white ${
                    isMe ? 'bg-red-600' : 'bg-indigo-600'
                  }`}
                >
                  {initials}
                </div>
              );
            })
          ) : (
            <div className="w-5 h-5 rounded-full bg-zinc-800 border border-zinc-950 flex items-center justify-center text-[8px] font-black uppercase text-zinc-400">
              ?
            </div>
          )}
        </div>
        <span className="text-[9px] font-mono font-black text-zinc-400 uppercase tracking-widest hidden sm:inline">
          {collaborators ? collaborators.length : 0} ONLINE
        </span>
        <ChevronDown size={10} className="text-zinc-600 ml-0.5" />
      </button>

      <AnimatePresence>
        {showPresenceDropdown && (
          <motion.div 
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            transition={{ duration: 0.15, ease: 'easeOut' }}
            className="absolute right-0 mt-2.5 w-80 bg-[#0c0c0e]/95 backdrop-blur-md border border-zinc-800 rounded-2xl shadow-2xl p-4 space-y-3.5 text-left"
          >
            <div className="flex items-center justify-between border-b border-zinc-850 pb-2">
              <div className="space-y-0.5">
                <span className="text-[8px] font-mono font-black text-zinc-550 uppercase tracking-widest block">Active Session Hub</span>
                <h5 className="text-[10px] font-black text-zinc-200 uppercase tracking-wider flex items-center gap-1.5">
                  <Users size={11} className="text-emerald-400 animate-pulse" />
                  Workspace Presence ({collaborators?.length || 0})
                </h5>
              </div>
              <span className="text-[8px] font-mono font-black text-emerald-400 bg-emerald-950/30 border border-emerald-900/30 px-1.5 py-0.5 rounded-full uppercase flex items-center gap-1">
                <Radio size={8} className="animate-pulse" /> Live
              </span>
            </div>

            <div className="space-y-2.5 max-h-56 overflow-y-auto pr-0.5 custom-scrollbar">
              {collaborators && collaborators.length > 0 ? (
                collaborators.map((c, idx) => {
                  const isMe = c.userId === user?.email;
                  const initials = c.name ? c.name.substring(0, 1).toUpperCase() : 'A';
                  return (
                    <div 
                      key={idx} 
                      className="flex items-start gap-2.5 bg-zinc-900/20 border border-zinc-850/40 hover:border-zinc-800/85 p-2.5 rounded-xl transition-colors"
                    >
                      <div className="relative shrink-0">
                        <div className={`w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-black uppercase text-white ${
                          isMe ? 'bg-red-600' : 'bg-indigo-600'
                        }`}>
                          {initials}
                        </div>
                        <span className="absolute bottom-0 right-0 w-2 h-2 rounded-full bg-emerald-500 border border-zinc-950" />
                      </div>
                      <div className="space-y-1 min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-1.5">
                          <p className="text-[10px] font-extrabold text-zinc-200 uppercase truncate">
                            {c.name || 'Anonymous Creator'}
                            {isMe && <span className="text-red-500 ml-1 font-black text-[9px] lowercase">(you)</span>}
                          </p>
                          <span className="text-[7.5px] font-mono font-bold text-zinc-500 shrink-0">
                            {isMe ? 'Active' : 'Syncing'}
                          </span>
                        </div>
                        <p className="text-[8px] font-mono font-bold text-zinc-500 uppercase truncate">
                          {c.userId || 'anonymous'}
                        </p>
                        <div className="flex items-center gap-1.5 pt-0.5">
                          <span className="text-[7.5px] font-mono font-black uppercase text-zinc-400 bg-zinc-950 border border-zinc-850/80 px-1.5 py-0.5 rounded">
                            {c.activeTool || 'Dashboard'}
                          </span>
                          <span className="text-[7.5px] text-zinc-500 font-mono font-medium">
                            {activeProject ? `Context: ${activeProject.title.substring(0,12)}...` : 'Same project context'}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="text-center py-6">
                  <p className="text-[10px] text-zinc-500 font-extrabold uppercase">No Collaborators online</p>
                  <p className="text-[8px] text-zinc-650">Share your workspace URL to invite team members.</p>
                </div>
              )}
            </div>

            <div className="border-t border-zinc-850 pt-2 flex justify-between items-center">
              <span className="text-[7.5px] font-mono text-zinc-600 uppercase">
                Updated every 15s
              </span>
              <button
                type="button"
                onClick={handleBroadcast}
                className="text-[8px] font-black uppercase tracking-wider text-zinc-400 hover:text-white bg-zinc-900 border border-zinc-850 hover:border-zinc-750 px-2.5 py-1 rounded-lg transition-all active:scale-95 cursor-pointer"
              >
                Broadcast State
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
