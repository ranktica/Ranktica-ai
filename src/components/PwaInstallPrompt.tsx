import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Download, X, Monitor, Smartphone, Sparkles, CheckCircle2 } from 'lucide-react';

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{
    outcome: 'accepted' | 'dismissed';
    platform: string;
  }>;
  prompt(): Promise<void>;
}

export const PwaInstallPrompt: React.FC = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showPrompt, setShowPrompt] = useState<boolean>(false);
  const [installed, setInstalled] = useState<boolean>(false);

  useEffect(() => {
    // 1. Check if the app is already in standalone mode
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches 
      || (window.navigator as any).standalone 
      || document.referrer.includes('android-app://');

    if (isStandalone) {
      setInstalled(true);
      return;
    }

    // 2. Listen to beforeinstallprompt event
    const handleBeforeInstallPrompt = (e: Event) => {
      // Prevent the default browser mini-infobar prompt
      e.preventDefault();
      // Store the event so it can be triggered later
      setDeferredPrompt(e as BeforeInstallPromptEvent);

      // Check if the user previously dismissed the prompt during this session
      const dismissedTime = localStorage.getItem('ranktica_pwa_prompt_dismissed');
      const now = Date.now();
      
      // If never dismissed, or dismissed more than 24 hours ago, show the prompt
      if (!dismissedTime || now - parseInt(dismissedTime) > 24 * 60 * 60 * 1000) {
        // Delay showing the prompt slightly to let the user settle in
        const timer = setTimeout(() => {
          setShowPrompt(true);
        }, 5000);
        return () => clearTimeout(timer);
      }
    };

    // 3. Listen for appinstalled event
    const handleAppInstalled = () => {
      setInstalled(true);
      setShowPrompt(false);
      setDeferredPrompt(null);
      localStorage.setItem('ranktica_pwa_installed', 'true');
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;

    // Show the browser's native install prompt
    await deferredPrompt.prompt();

    // Wait for the user to respond to the prompt
    const choiceResult = await deferredPrompt.userChoice;
    
    if (choiceResult.outcome === 'accepted') {
      console.log('[PWA Install] User accepted the installation prompt');
      setInstalled(true);
      setShowPrompt(false);
    } else {
      console.log('[PWA Install] User dismissed the installation prompt');
      // Store current dismiss time so we don't nag them immediately
      localStorage.setItem('ranktica_pwa_prompt_dismissed', Date.now().toString());
      setShowPrompt(false);
    }

    // Reset the deferred prompt variable
    setDeferredPrompt(null);
  };

  const handleDismiss = () => {
    localStorage.setItem('ranktica_pwa_prompt_dismissed', Date.now().toString());
    setShowPrompt(false);
  };

  // If already installed or shouldn't show, render nothing
  if (installed || !showPrompt || !deferredPrompt) {
    return null;
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 30, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 30, scale: 0.95 }}
        transition={{ duration: 0.3, ease: 'easeOut' }}
        id="pwa-install-container"
        className="fixed bottom-6 left-6 z-50 w-full max-w-sm bg-zinc-900/95 border border-zinc-800/90 shadow-2xl rounded-2xl p-5 backdrop-blur-xl pointer-events-auto"
      >
        {/* Glowing visual backdrop */}
        <div className="absolute -inset-px rounded-2xl bg-gradient-to-tr from-red-500/10 to-orange-500/10 opacity-35 pointer-events-none" />

        {/* Header section with Close Button */}
        <div className="flex items-start justify-between relative mb-4">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-red-500/10 text-red-500 border border-red-500/20 rounded-xl flex items-center justify-center shrink-0">
              <Download size={18} className="animate-bounce" />
            </div>
            <div>
              <h3 className="font-semibold text-zinc-100 text-sm tracking-tight leading-none mb-1">
                Install Ranktica AI
              </h3>
              <p className="text-[11px] text-zinc-400 font-mono flex items-center gap-1.5">
                <Sparkles size={10} className="text-amber-500 animate-pulse" />
                Offline-Ready Progressive App
              </p>
            </div>
          </div>
          
          <button 
            type="button"
            onClick={handleDismiss}
            className="text-zinc-500 hover:text-zinc-300 text-xs transition duration-150 p-1 rounded-lg hover:bg-zinc-800 cursor-pointer"
            aria-label="Dismiss prompt"
          >
            <X size={14} />
          </button>
        </div>

        {/* Feature Highlights Body */}
        <div className="bg-zinc-950/80 border border-zinc-850/50 rounded-xl p-3.5 mb-4 space-y-2.5">
          <div className="flex items-start gap-2.5 text-xs text-zinc-300">
            <CheckCircle2 size={13} className="text-red-500 shrink-0 mt-0.5" />
            <span><strong>Persistent Offline Access:</strong> View project data, scripts, and logs even when disconnected.</span>
          </div>
          <div className="flex items-start gap-2.5 text-xs text-zinc-300">
            <CheckCircle2 size={13} className="text-red-500 shrink-0 mt-0.5" />
            <span><strong>Standalone Dock App:</strong> Pin to desktop taskbar or mobile home screen with a native icon.</span>
          </div>
          <div className="flex items-start gap-2.5 text-xs text-zinc-300">
            <CheckCircle2 size={13} className="text-red-500 shrink-0 mt-0.5" />
            <span><strong>Instant Loading Speeds:</strong> Bypasses network overhead utilizing advanced SW asset pre-caching.</span>
          </div>
        </div>

        {/* Action Button Segment */}
        <div className="flex gap-2.5">
          <button
            type="button"
            onClick={handleInstallClick}
            className="flex-grow bg-red-650 hover:bg-red-600 active:scale-[0.98] text-white font-bold text-xs py-2.5 px-3 rounded-xl transition duration-150 shadow-lg shadow-red-600/10 cursor-pointer flex items-center justify-center gap-1.5 border border-red-500"
          >
            <Monitor size={13} />
            <Smartphone size={13} />
            <span>Pin to Home Screen</span>
          </button>
          
          <button
            type="button"
            onClick={handleDismiss}
            className="bg-zinc-800 hover:bg-zinc-700 hover:text-white text-zinc-300 font-semibold text-xs py-2.5 px-4 rounded-xl transition cursor-pointer"
          >
            Later
          </button>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};

export default PwaInstallPrompt;
