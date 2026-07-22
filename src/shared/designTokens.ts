/**
 * Ranktica AI Design Tokens
 * Premium, clinical, high-contrast, data-driven design system.
 */
export const DESIGN_TOKENS = {
  // Color presets mapped to CSS variables / Tailwind utility aggregates
  colors: {
    bg: 'bg-zinc-950',
    panel: 'bg-zinc-900 border border-zinc-800',
    panelHeader: 'bg-zinc-950/50 backdrop-blur-md border-b border-zinc-800',
    
    // Action preset types
    primary: {
      text: 'text-red-500',
      bg: 'bg-red-600 hover:bg-red-500 text-white',
      badge: 'bg-red-500/10 text-red-500 border border-red-500/20',
    },
    ai: {
      text: 'text-purple-400 hover:text-purple-300',
      bg: 'bg-purple-600 hover:bg-purple-500 text-white',
      badge: 'bg-purple-500/10 text-purple-400 border border-purple-500/20',
    },
    success: {
      text: 'text-green-500',
      bg: 'bg-green-600 hover:bg-green-500 text-white',
      badge: 'bg-green-500/10 text-green-500 border border-green-500/20',
    },
    secondary: {
      text: 'text-zinc-400 hover:text-white',
      bg: 'bg-zinc-800 hover:bg-zinc-700 text-zinc-200',
      badge: 'bg-zinc-800/50 text-zinc-400 border border-zinc-700/30',
    }
  },

  // Spacing & Rhythm
  spacing: {
    section: 'p-6 md:p-8 lg:p-12 gap-8 md:gap-12',
    card: 'p-6 rounded-[1.5rem]',
    container: 'w-full max-w-7xl mx-auto',
    button: 'px-4 py-2 text-xs font-black uppercase tracking-wider rounded-xl transition-all cursor-pointer active-press',
    badge: 'px-2.5 py-1 rounded-full text-[9px] uppercase font-bold tracking-widest',
  },

  // Typography
  typography: {
    heading1: 'font-sans font-bold text-2xl md:text-3xl tracking-tight text-white',
    heading2: 'font-sans font-semibold text-xl md:text-2xl tracking-tight text-zinc-100',
    heading3: 'font-sans font-medium text-lg tracking-tight text-zinc-200',
    body: 'font-sans text-sm text-zinc-400 leading-relaxed',
    mono: 'font-mono text-xs text-zinc-500',
  },

  // Animation class presets
  animation: {
    fadeIn: 'animate-fade-in',
    scaleIn: 'animate-scale-in',
    hoverLift: 'hover-lift transition-all duration-300',
    activePress: 'active-press',
  }
};
