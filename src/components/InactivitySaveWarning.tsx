import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { AlertCircle, Save, Clock, HelpCircle, ShieldAlert, Sparkles } from 'lucide-react';
import { toast } from 'react-hot-toast';

export const InactivitySaveWarning: React.FC = () => {
  const [isWarningVisible, setIsWarningVisible] = useState(false);
  const [secondsRemaining, setSecondsRemaining] = useState(300); // 5 minutes (300s) countdown to timeout
  const [isDevMode, setIsDevMode] = useState(false); // Speed up inactivity to 3 seconds and countdown to 15s for visual validation
  const [lastActivity, setLastActivity] = useState<number>(Date.now());
  const [isSaving, setIsSaving] = useState(false);

  // Timeouts configuration
  const INACTIVITY_LIMIT = isDevMode ? 3 * 1000 : 10 * 60 * 1000; // 3 seconds in dev, 10 minutes in prod
  const COUNTDOWN_LIMIT = isDevMode ? 15 : 300; // 15 seconds in dev, 5 minutes (300s) in prod

  const activityTimerRef = useRef<NodeJS.Timeout | null>(null);
  const countdownIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Track user activity across the window to reset the idle timer
  useEffect(() => {
    const handleActivity = () => {
      setLastActivity(Date.now());
      if (!isWarningVisible) {
        resetInactivityTimer();
      }
    };

    const resetInactivityTimer = () => {
      if (activityTimerRef.current) {
        clearTimeout(activityTimerRef.current);
      }

      activityTimerRef.current = setTimeout(() => {
        // Trigger inactivity warning dialog
        setIsWarningVisible(true);
        setSecondsRemaining(COUNTDOWN_LIMIT);
      }, INACTIVITY_LIMIT);
    };

    // Listeners for comprehensive user interaction detection
    const events = ['mousemove', 'keydown', 'click', 'scroll', 'mousedown', 'touchstart'];
    events.forEach(event => {
      window.addEventListener(event, handleActivity);
    });

    // Initial start
    resetInactivityTimer();

    return () => {
      if (activityTimerRef.current) clearTimeout(activityTimerRef.current);
      events.forEach(event => {
        window.removeEventListener(event, handleActivity);
      });
    };
  }, [isWarningVisible, isDevMode]);

  // Handle countdown timer once warning is visible
  useEffect(() => {
    if (isWarningVisible) {
      if (countdownIntervalRef.current) {
        clearInterval(countdownIntervalRef.current);
      }

      countdownIntervalRef.current = setInterval(() => {
        setSecondsRemaining(prev => {
          if (prev <= 1) {
            clearInterval(countdownIntervalRef.current!);
            handleSessionTimeout();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      if (countdownIntervalRef.current) {
        clearInterval(countdownIntervalRef.current);
      }
    }

    return () => {
      if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);
    };
  }, [isWarningVisible]);

  // Handle the final timeout event (triggers auto-save and locks session or dismisses)
  const handleSessionTimeout = () => {
    setIsWarningVisible(false);
    
    // Dispatch auto-save event to secure all user inputs
    window.dispatchEvent(new CustomEvent('ranktica-auto-save-operation', { 
      detail: { timestamp: Date.now() } 
    }));
    
    toast.error('Session Timeout: Active workspace progress has been automatically secured! 🔒', {
      duration: 5000,
      id: 'inactivity-timeout-toast'
    });

    // Also trigger the default app session lock if it exists
    const lockBtn = document.getElementById('session-lock-trigger');
    if (lockBtn) {
      lockBtn.click();
    }
  };

  // Perform safe save operation and close warning modal
  const handleSaveAndContinue = () => {
    setIsSaving(true);
    
    // Simulate premium visual progression
    setTimeout(() => {
      // Dispatch auto-save event
      window.dispatchEvent(new CustomEvent('ranktica-auto-save-operation', { 
        detail: { timestamp: Date.now() } 
      }));

      // Set timestamp of last manual save
      try {
        const timeString = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
        localStorage.setItem('ranktica_last_saved_time', timeString);
      } catch (e) {
        console.warn(e);
      }

      setIsSaving(false);
      setIsWarningVisible(false);
      toast.success('Workspace securely auto-saved! Continuing session.', {
        id: 'manual-save-toast'
      });
    }, 800);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  return (
    <>
      {/* Dev helper badge to test inactivity easily */}
      <div 
        id="dev-inactivity-helper"
        className="fixed bottom-4 right-4 z-40 bg-zinc-950/90 border border-zinc-800/80 px-3 py-1.5 rounded-full flex items-center gap-2 backdrop-blur shadow-lg text-[10px] font-mono hover:border-red-600/40 transition-all cursor-pointer select-none"
        onClick={() => {
          setIsDevMode(!isDevMode);
          toast.success(isDevMode ? 'Inactivity test mode disabled (10m delay)' : 'Inactivity test mode enabled! Stop moving for 3s to trigger.', {
            id: 'dev-mode-toast'
          });
        }}
      >
        <span className={`w-1.5 h-1.5 rounded-full ${isDevMode ? 'bg-red-500 animate-pulse' : 'bg-zinc-650'}`} />
        <span className="text-zinc-400">Idle Alert: </span>
        <span className={isDevMode ? 'text-red-400 font-bold' : 'text-zinc-500'}>
          {isDevMode ? 'TEST MODE (3s)' : '10 MINUTES'}
        </span>
      </div>

      <AnimatePresence>
        {isWarningVisible && (
          <div 
            id="inactivity-warning-portal"
            className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-zinc-950/85 backdrop-blur-md"
          >
            {/* Backdrop click option is disabled to force attention, but user can dismiss via buttons */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              transition={{ type: 'spring', duration: 0.5 }}
              className="relative max-w-md w-full bg-zinc-900 border border-zinc-800 rounded-[2rem] p-8 shadow-2xl overflow-hidden"
            >
              {/* Top ambient accent glow */}
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-48 h-[1px] bg-gradient-to-r from-transparent via-red-500/50 to-transparent" />
              
              <div className="flex flex-col items-center text-center space-y-5">
                {/* Warning icon badge */}
                <div className="w-16 h-16 rounded-3xl bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-500">
                  <ShieldAlert size={32} className="animate-pulse" />
                </div>

                <div className="space-y-2">
                  <span className="font-mono text-[9px] uppercase tracking-widest font-black text-red-500 bg-red-500/5 px-2.5 py-1 rounded-full border border-red-500/10">
                    Session Inactivity Detected
                  </span>
                  <h3 className="text-xl font-bold text-white font-sans tracking-tight">
                    Are you still working?
                  </h3>
                  <p className="text-zinc-400 text-xs leading-relaxed max-w-sm">
                    You have been inactive in this tool for {isDevMode ? '3 seconds' : '10 minutes'}. Your unsaved changes will be safely secured and your session will lock shortly.
                  </p>
                </div>

                {/* Ticking countdown section */}
                <div className="w-full bg-zinc-950 border border-zinc-850 rounded-2xl p-4 flex items-center justify-between font-mono">
                  <div className="flex items-center gap-2">
                    <Clock size={14} className="text-zinc-550 shrink-0" />
                    <span className="text-zinc-400 text-[11px]">Auto-Saving & Locking In:</span>
                  </div>
                  <span className="text-lg font-black text-red-400 bg-red-950/20 border border-red-900/30 px-3 py-1 rounded-xl tracking-wider">
                    {formatTime(secondsRemaining)}
                  </span>
                </div>

                {/* Interaction CTA Actions */}
                <div className="w-full grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                  <button
                    id="inactivity-dismiss-btn"
                    onClick={() => {
                      setIsWarningVisible(false);
                      toast.success('Session extended. Keep up the high velocity!');
                    }}
                    disabled={isSaving}
                    className="w-full bg-zinc-800 hover:bg-zinc-750 text-zinc-300 font-bold px-5 py-3.5 rounded-xl text-xs transition-all border border-zinc-700/40 cursor-pointer disabled:opacity-50"
                  >
                    Keep Idle
                  </button>
                  <button
                    id="inactivity-save-btn"
                    onClick={handleSaveAndContinue}
                    disabled={isSaving}
                    className="w-full bg-red-600 hover:bg-red-700 text-white font-bold px-5 py-3.5 rounded-xl text-xs transition-all shadow-lg shadow-red-600/15 flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                  >
                    {isSaving ? (
                      <>
                        <Clock size={13} className="animate-spin" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <Save size={13} />
                        Save & Continue
                      </>
                    )}
                  </button>
                </div>

                {/* Brand Footnote */}
                <div className="flex items-center gap-1 text-[9px] font-mono text-zinc-600">
                  <Sparkles size={10} className="text-zinc-700" />
                  <span>Ranktica Autonomous Data Protection</span>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
};
