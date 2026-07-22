import React, { useState, useEffect } from 'react';
import { 
  Palette, 
  RotateCcw, 
  Save, 
  Sparkles, 
  Sliders, 
  Eye, 
  Layout as LayoutIcon, 
  Layers, 
  Zap, 
  Copy, 
  Check, 
  Info,
  SlidersHorizontal,
  Flame,
  Wand2
} from 'lucide-react';
import { toast } from 'react-hot-toast';

interface ThemeVariables {
  color: string;
  colorHover: string;
  bg: string;
  bgPanel: string;
  border: string;
  textAccent: string;
}

interface ThemePreset {
  name: string;
  description: string;
  vars: ThemeVariables;
}

const THEME_PRESETS: ThemePreset[] = [
  {
    name: "Volcanic Ash",
    description: "The default elite Ranktica aesthetic with bright crimson highlights.",
    vars: {
      color: "#ef4444",
      colorHover: "#dc2626",
      bg: "#09090b",
      bgPanel: "#18181b",
      border: "#27272a",
      textAccent: "#ef4444"
    }
  },
  {
    name: "Neon Void",
    description: "High-voltage gold accents sitting on top of an ultra-dark navy chassis.",
    vars: {
      color: "#eab308",
      colorHover: "#ca8a04",
      bg: "#030306",
      bgPanel: "#0b0c16",
      border: "#1d2038",
      textAccent: "#facc15"
    }
  },
  {
    name: "Vaporwave Dream",
    description: "Cyberpunk pink and purple tones evoking nostalgic terminal aesthetics.",
    vars: {
      color: "#ec4899",
      colorHover: "#db2777",
      bg: "#0c051a",
      bgPanel: "#160a2b",
      border: "#33135c",
      textAccent: "#f472b6"
    }
  },
  {
    name: "Forest Zen",
    description: "Eco-friendly deep emerald colors optimized for clinical focus.",
    vars: {
      color: "#10b981",
      colorHover: "#059669",
      bg: "#02120b",
      bgPanel: "#052618",
      border: "#0f422b",
      textAccent: "#34d399"
    }
  },
  {
    name: "Obsidian Cobalt",
    description: "Modern deep space indigo paired with slate-blue background matrices.",
    vars: {
      color: "#6366f1",
      colorHover: "#4f46e5",
      bg: "#020617",
      bgPanel: "#0f172a",
      border: "#1e293b",
      textAccent: "#818cf8"
    }
  },
  {
    name: "Solar Wind",
    description: "Warm stone palettes combined with active amber-orange radiation fields.",
    vars: {
      color: "#f97316",
      colorHover: "#ea580c",
      bg: "#0c0a09",
      bgPanel: "#1c1917",
      border: "#292524",
      textAccent: "#fdba74"
    }
  }
];

function hexToRgba(hex: string, alpha: number): string {
  const cleanHex = hex.replace('#', '');
  let r = 0, g = 0, b = 0;
  if (cleanHex.length === 3) {
    r = parseInt(cleanHex[0] + cleanHex[0], 16);
    g = parseInt(cleanHex[1] + cleanHex[1], 16);
    b = parseInt(cleanHex[2] + cleanHex[2], 16);
  } else if (cleanHex.length === 6) {
    r = parseInt(cleanHex.substring(0, 2), 16);
    g = parseInt(cleanHex.substring(2, 4), 16);
    b = parseInt(cleanHex.substring(4, 6), 16);
  }
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

export const ThemeWorkshop: React.FC = () => {
  // Theme state
  const [themeVars, setThemeVars] = useState<ThemeVariables>(() => {
    const saved = localStorage.getItem('ranktica_custom_theme_vars');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        // Fallback to Volcanic Ash
      }
    }
    return { ...THEME_PRESETS[0].vars };
  });

  const [globalSyncActive, setGlobalSyncActive] = useState<boolean>(() => {
    return localStorage.getItem('ranktica_custom_theme_active') === 'true';
  });

  const [copiedIndex, setCopiedIndex] = useState<boolean>(false);
  const [selectedPreset, setSelectedPreset] = useState<string>("Volcanic Ash");

  // Inject styles dynamically into root element
  useEffect(() => {
    if (globalSyncActive) {
      // Direct CSS injection to document element
      const root = document.documentElement;
      
      root.style.setProperty('--theme-color', themeVars.color);
      root.style.setProperty('--theme-color-hover', themeVars.colorHover);
      root.style.setProperty('--theme-bg', themeVars.bg);
      root.style.setProperty('--theme-bg-panel', themeVars.bgPanel);
      root.style.setProperty('--theme-border', themeVars.border);
      root.style.setProperty('--theme-text-accent', themeVars.textAccent);
      
      // Calculate derived opacity variables
      root.style.setProperty('--theme-glow', hexToRgba(themeVars.color, 0.15));
      root.style.setProperty('--theme-glow-intense', hexToRgba(themeVars.color, 0.3));
      root.style.setProperty('--theme-badge-bg', hexToRgba(themeVars.color, 0.1));
      root.style.setProperty('--theme-badge-text', themeVars.color);
      root.style.setProperty('--theme-border-hover', hexToRgba(themeVars.color, 0.3));

      // Persist the custom variables
      localStorage.setItem('ranktica_custom_theme_vars', JSON.stringify(themeVars));
      localStorage.setItem('ranktica_custom_theme_active', 'true');
    } else {
      // Clear dynamic overrides to let Layout system default theme take over
      const root = document.documentElement;
      root.style.removeProperty('--theme-color');
      root.style.removeProperty('--theme-color-hover');
      root.style.removeProperty('--theme-bg');
      root.style.removeProperty('--theme-bg-panel');
      root.style.removeProperty('--theme-border');
      root.style.removeProperty('--theme-text-accent');
      root.style.removeProperty('--theme-glow');
      root.style.removeProperty('--theme-glow-intense');
      root.style.removeProperty('--theme-badge-bg');
      root.style.removeProperty('--theme-badge-text');
      root.style.removeProperty('--theme-border-hover');

      localStorage.removeItem('ranktica_custom_theme_active');
    }
  }, [themeVars, globalSyncActive]);

  const handleVariableChange = (key: keyof ThemeVariables, value: string) => {
    setThemeVars(prev => ({
      ...prev,
      [key]: value
    }));
    setSelectedPreset("Custom Palette");
  };

  const handleApplyPreset = (preset: ThemePreset) => {
    setThemeVars({ ...preset.vars });
    setSelectedPreset(preset.name);
    toast.success(`Applied "${preset.name}" preset colors!`);
  };

  const handleResetToSystemDefault = () => {
    setGlobalSyncActive(false);
    setThemeVars({ ...THEME_PRESETS[0].vars });
    setSelectedPreset("Volcanic Ash");
    toast('Returned root CSS custom variables to standard system themes.', {
      icon: '🔄',
      style: {
        borderRadius: '12px',
        background: '#09090b',
        color: '#f4f4f5',
        border: '1px solid #27272a'
      }
    });
  };

  const handleCopyToClipboard = () => {
    const cssCode = `/* Ranktica AI Enterprise - Custom Dynamic Theme variables */
:root {
  --theme-color: ${themeVars.color};
  --theme-color-hover: ${themeVars.colorHover};
  --theme-bg: ${themeVars.bg};
  --theme-bg-panel: ${themeVars.bgPanel};
  --theme-border: ${themeVars.border};
  --theme-text-accent: ${themeVars.textAccent};
  --theme-glow: ${hexToRgba(themeVars.color, 0.15)};
  --theme-glow-intense: ${hexToRgba(themeVars.color, 0.3)};
  --theme-badge-bg: ${hexToRgba(themeVars.color, 0.1)};
  --theme-badge-text: ${themeVars.color};
  --theme-border-hover: ${hexToRgba(themeVars.color, 0.3)};
}`;

    navigator.clipboard.writeText(cssCode);
    setCopiedIndex(true);
    toast.success("Theme variables copied as raw CSS declarations!");
    setTimeout(() => setCopiedIndex(false), 2000);
  };

  const handleRandomizeTheme = () => {
    const randomHex = () => '#' + Math.floor(Math.random() * 16777215).toString(16).padStart(6, '0');
    
    const randColor = randomHex();
    const randBg = '#' + ['03', '06', '0a', '0f', '11'].map(v => v + Math.floor(Math.random()*4).toString(16)).join('').substring(0, 6);
    const randBgPanel = '#' + ['14', '1c', '1a', '22', '1e'].map(v => v + Math.floor(Math.random()*4).toString(16)).join('').substring(0, 6);
    const randBorder = '#' + ['2a', '34', '2e', '38', '40'].map(v => v + Math.floor(Math.random()*4).toString(16)).join('').substring(0, 6);

    const randomized: ThemeVariables = {
      color: randColor,
      colorHover: hexToRgba(randColor, 0.8),
      bg: randBg,
      bgPanel: randBgPanel,
      border: randBorder,
      textAccent: randColor
    };

    setThemeVars(randomized);
    setSelectedPreset("Procedural Chaos");
    toast('Synthesized a randomized color balance!', {
      icon: '🎲',
      style: {
        borderRadius: '12px',
        background: '#09090b',
        color: '#f4f4f5',
        border: '1px solid #6366f1'
      }
    });
  };

  // Preview component inline variables styles for sandbox display
  const sandboxStyles = {
    '--theme-color': themeVars.color,
    '--theme-color-hover': themeVars.colorHover,
    '--theme-bg': themeVars.bg,
    '--theme-bg-panel': themeVars.bgPanel,
    '--theme-border': themeVars.border,
    '--theme-text-accent': themeVars.textAccent,
    '--theme-glow': hexToRgba(themeVars.color, 0.15),
    '--theme-badge-bg': hexToRgba(themeVars.color, 0.1),
    '--theme-badge-text': themeVars.color
  } as React.CSSProperties;

  return (
    <div id="theme-workshop-card" className="bg-[#121214] border border-zinc-800 rounded-2xl p-6 relative overflow-hidden" style={{ contentVisibility: 'auto' }}>
      {/* Visual Ambient Blur */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-red-600/[0.01] rounded-full blur-3xl"></div>
      <div className="absolute bottom-0 left-0 w-64 h-64 bg-indigo-600/[0.01] rounded-full blur-3xl"></div>

      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-zinc-850 pb-5 mb-6 relative z-10">
        <div>
          <h3 className="text-base font-extrabold text-white flex items-center gap-2 font-sans">
            <Palette className="text-red-500" size={18} />
            Theme Design Workshop
          </h3>
          <p className="text-[10px] text-zinc-500 mt-1 font-sans">
            Architect custom color matrices, select palettes, and inject root variables into the global design engine.
          </p>
        </div>

        {/* Sync Controls */}
        <div className="flex items-center gap-3">
          <button
            onClick={handleRandomizeTheme}
            className="p-1.5 rounded-lg border border-zinc-800 bg-zinc-950 text-zinc-400 hover:text-white transition cursor-pointer"
            title="Procedural Randomizer"
          >
            <Wand2 size={13} />
          </button>
          
          <button
            onClick={handleResetToSystemDefault}
            className="p-1.5 rounded-lg border border-zinc-800 bg-zinc-950 text-zinc-400 hover:text-white transition cursor-pointer"
            title="Reset Override Styles"
          >
            <RotateCcw size={13} />
          </button>

          <div className="h-5 w-[1px] bg-zinc-850"></div>

          <div className="flex items-center gap-2 bg-zinc-950 border border-zinc-850 px-3 py-1.5 rounded-xl">
            <span className="text-[9px] font-mono font-bold text-zinc-500 uppercase tracking-wider">
              Global Sync:
            </span>
            <button
              onClick={() => {
                setGlobalSyncActive(!globalSyncActive);
                toast.success(
                  !globalSyncActive 
                    ? "✨ Custom variables injected globally. Entire application UI updated!" 
                    : "🔒 Cleared overrides. Returned to default CSS classes."
                );
              }}
              className={`relative inline-flex h-4 w-9 items-center rounded-full transition-colors cursor-pointer ${
                globalSyncActive ? 'bg-red-600' : 'bg-zinc-800'
              }`}
            >
              <span
                className={`inline-block h-2.5 w-2.5 transform rounded-full bg-white transition-transform ${
                  globalSyncActive ? 'translate-x-5.5' : 'translate-x-1'
                }`}
              />
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 relative z-10">
        {/* Left Side: Parameters & Controls (8 cols) */}
        <div className="lg:col-span-7 space-y-6">
          {/* Preset templates selector */}
          <div className="space-y-2">
            <label className="text-[10px] font-mono font-bold text-zinc-400 uppercase tracking-wider flex items-center gap-1.5">
              <Sparkles size={11} className="text-red-500" />
              Elite Preset Templates
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {THEME_PRESETS.map((preset) => {
                const isActive = selectedPreset === preset.name;
                return (
                  <button
                    key={preset.name}
                    onClick={() => handleApplyPreset(preset)}
                    className={`p-2.5 text-left rounded-xl border transition-all text-xs cursor-pointer ${
                      isActive 
                        ? 'bg-zinc-900 border-red-500/50 shadow-[0_4px_12px_rgba(239,68,68,0.05)] text-white' 
                        : 'bg-zinc-950/60 border-zinc-850 text-zinc-400 hover:text-white hover:border-zinc-700'
                    }`}
                  >
                    <div className="flex items-center gap-1.5 font-bold text-[11px]">
                      <span 
                        className="w-2.5 h-2.5 rounded-full inline-block border border-black/20" 
                        style={{ backgroundColor: preset.vars.color }}
                      />
                      {preset.name}
                    </div>
                    <p className="text-[8px] text-zinc-500 leading-normal mt-0.5 font-sans">
                      {preset.description}
                    </p>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Color pickers matrix */}
          <div className="space-y-3">
            <label className="text-[10px] font-mono font-bold text-zinc-400 uppercase tracking-wider flex items-center gap-1.5">
              <SlidersHorizontal size={11} className="text-red-500" />
              Dynamic Variable Editor ({selectedPreset})
            </label>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-zinc-950/40 border border-zinc-850 p-4 rounded-xl">
              
              {/* Theme Primary Accent */}
              <div className="space-y-1.5">
                <span className="text-[9px] font-mono font-bold text-zinc-500 uppercase tracking-wide">
                  Accent Color (--theme-color)
                </span>
                <div className="flex items-center gap-2 bg-zinc-900 border border-zinc-800 rounded-lg p-1.5 px-2">
                  <div className="relative w-6 h-6 rounded-md overflow-hidden border border-zinc-700 shrink-0">
                    <input
                      type="color"
                      value={themeVars.color}
                      onChange={(e) => handleVariableChange('color', e.target.value)}
                      className="absolute -inset-1 cursor-pointer w-8 h-8 opacity-100 p-0 border-0"
                    />
                  </div>
                  <input
                    type="text"
                    value={themeVars.color}
                    onChange={(e) => handleVariableChange('color', e.target.value)}
                    className="bg-transparent text-[11px] font-mono text-zinc-200 outline-none w-full"
                  />
                </div>
              </div>

              {/* Theme Primary Hover */}
              <div className="space-y-1.5">
                <span className="text-[9px] font-mono font-bold text-zinc-500 uppercase tracking-wide">
                  Accent Hover (--theme-color-hover)
                </span>
                <div className="flex items-center gap-2 bg-zinc-900 border border-zinc-800 rounded-lg p-1.5 px-2">
                  <div className="relative w-6 h-6 rounded-md overflow-hidden border border-zinc-700 shrink-0">
                    <input
                      type="color"
                      value={themeVars.colorHover}
                      onChange={(e) => handleVariableChange('colorHover', e.target.value)}
                      className="absolute -inset-1 cursor-pointer w-8 h-8 opacity-100 p-0 border-0"
                    />
                  </div>
                  <input
                    type="text"
                    value={themeVars.colorHover}
                    onChange={(e) => handleVariableChange('colorHover', e.target.value)}
                    className="bg-transparent text-[11px] font-mono text-zinc-200 outline-none w-full"
                  />
                </div>
              </div>

              {/* Main Background */}
              <div className="space-y-1.5">
                <span className="text-[9px] font-mono font-bold text-zinc-500 uppercase tracking-wide">
                  Body Background (--theme-bg)
                </span>
                <div className="flex items-center gap-2 bg-zinc-900 border border-zinc-800 rounded-lg p-1.5 px-2">
                  <div className="relative w-6 h-6 rounded-md overflow-hidden border border-zinc-700 shrink-0">
                    <input
                      type="color"
                      value={themeVars.bg}
                      onChange={(e) => handleVariableChange('bg', e.target.value)}
                      className="absolute -inset-1 cursor-pointer w-8 h-8 opacity-100 p-0 border-0"
                    />
                  </div>
                  <input
                    type="text"
                    value={themeVars.bg}
                    onChange={(e) => handleVariableChange('bg', e.target.value)}
                    className="bg-transparent text-[11px] font-mono text-zinc-200 outline-none w-full"
                  />
                </div>
              </div>

              {/* Panel Background */}
              <div className="space-y-1.5">
                <span className="text-[9px] font-mono font-bold text-zinc-500 uppercase tracking-wide">
                  Container Panel (--theme-bg-panel)
                </span>
                <div className="flex items-center gap-2 bg-zinc-900 border border-zinc-800 rounded-lg p-1.5 px-2">
                  <div className="relative w-6 h-6 rounded-md overflow-hidden border border-zinc-700 shrink-0">
                    <input
                      type="color"
                      value={themeVars.bgPanel}
                      onChange={(e) => handleVariableChange('bgPanel', e.target.value)}
                      className="absolute -inset-1 cursor-pointer w-8 h-8 opacity-100 p-0 border-0"
                    />
                  </div>
                  <input
                    type="text"
                    value={themeVars.bgPanel}
                    onChange={(e) => handleVariableChange('bgPanel', e.target.value)}
                    className="bg-transparent text-[11px] font-mono text-zinc-200 outline-none w-full"
                  />
                </div>
              </div>

              {/* Border Color */}
              <div className="space-y-1.5">
                <span className="text-[9px] font-mono font-bold text-zinc-500 uppercase tracking-wide">
                  Border Matrix (--theme-border)
                </span>
                <div className="flex items-center gap-2 bg-zinc-900 border border-zinc-800 rounded-lg p-1.5 px-2">
                  <div className="relative w-6 h-6 rounded-md overflow-hidden border border-zinc-700 shrink-0">
                    <input
                      type="color"
                      value={themeVars.border}
                      onChange={(e) => handleVariableChange('border', e.target.value)}
                      className="absolute -inset-1 cursor-pointer w-8 h-8 opacity-100 p-0 border-0"
                    />
                  </div>
                  <input
                    type="text"
                    value={themeVars.border}
                    onChange={(e) => handleVariableChange('border', e.target.value)}
                    className="bg-transparent text-[11px] font-mono text-zinc-200 outline-none w-full"
                  />
                </div>
              </div>

              {/* Text Highlight Color */}
              <div className="space-y-1.5">
                <span className="text-[9px] font-mono font-bold text-zinc-500 uppercase tracking-wide">
                  Text Highlight Accent (--theme-text-accent)
                </span>
                <div className="flex items-center gap-2 bg-zinc-900 border border-zinc-800 rounded-lg p-1.5 px-2">
                  <div className="relative w-6 h-6 rounded-md overflow-hidden border border-zinc-700 shrink-0">
                    <input
                      type="color"
                      value={themeVars.textAccent}
                      onChange={(e) => handleVariableChange('textAccent', e.target.value)}
                      className="absolute -inset-1 cursor-pointer w-8 h-8 opacity-100 p-0 border-0"
                    />
                  </div>
                  <input
                    type="text"
                    value={themeVars.textAccent}
                    onChange={(e) => handleVariableChange('textAccent', e.target.value)}
                    className="bg-transparent text-[11px] font-mono text-zinc-200 outline-none w-full"
                  />
                </div>
              </div>

            </div>
          </div>
        </div>

        {/* Right Side: Real-time Live Sandbox Preview (5 cols) */}
        <div className="lg:col-span-5 flex flex-col justify-between">
          <div className="space-y-2 h-full flex flex-col justify-between">
            <label className="text-[10px] font-mono font-bold text-zinc-400 uppercase tracking-wider flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <Eye size={11} className="text-red-500" />
                Live Component Sandbox Preview
              </span>
              <span className="text-[8px] px-2 py-0.5 rounded-full bg-zinc-950 border border-zinc-850 text-zinc-500 animate-pulse uppercase">
                Sandbox scope
              </span>
            </label>

            {/* Simulated mini card rendering with the chosen colors */}
            <div 
              style={sandboxStyles} 
              className="bg-[var(--theme-bg)] border border-[var(--theme-border)] rounded-2xl p-5 space-y-4 shadow-xl transition-all duration-300 h-full flex flex-col justify-between"
            >
              {/* Header inside Sandbox */}
              <div className="flex items-center justify-between border-b border-[var(--theme-border)] pb-3">
                <div className="flex items-center gap-2">
                  <div 
                    className="w-5 h-5 rounded-md flex items-center justify-center text-white" 
                    style={{ backgroundColor: 'var(--theme-color)' }}
                  >
                    <Layers size={11} />
                  </div>
                  <div>
                    <span className="text-xs font-black text-white block leading-none">
                      Ranktica Portal
                    </span>
                    <span className="text-[7.5px] font-mono text-zinc-500 uppercase tracking-widest block mt-0.5">
                      Subsystem Sandbox
                    </span>
                  </div>
                </div>
                
                {/* Simulated Badge */}
                <span 
                  className="text-[8px] font-mono font-bold px-2 py-0.5 rounded-full"
                  style={{ 
                    backgroundColor: 'var(--theme-badge-bg)', 
                    color: 'var(--theme-badge-text)' 
                  }}
                >
                  Active
                </span>
              </div>

              {/* Center Panel in Sandbox */}
              <div className="bg-[var(--theme-bg-panel)] border border-[var(--theme-border)] p-3.5 rounded-xl space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[9px] font-mono text-zinc-400">Pipeline Status</span>
                  <span className="text-[9px] font-mono font-bold" style={{ color: 'var(--theme-text-accent)' }}>
                    98.6% Virality
                  </span>
                </div>
                <div className="w-full bg-zinc-900/55 rounded-full h-1.5 overflow-hidden">
                  <div 
                    className="h-full rounded-full transition-all duration-500" 
                    style={{ 
                      backgroundColor: 'var(--theme-color)',
                      width: '75%' 
                    }}
                  />
                </div>
                <p className="text-[8px] text-zinc-500 leading-normal">
                  Dynamic theme styling injected directly into parent container root elements. Accent colors glow beautifully.
                </p>
              </div>

              {/* Bottom Interactive elements inside Sandbox */}
              <div className="flex items-center gap-2.5 pt-2">
                <button 
                  className="flex-1 text-center py-2 px-2.5 rounded-lg text-[9px] font-bold text-white transition cursor-pointer"
                  style={{ 
                    backgroundColor: 'var(--theme-color)',
                  }}
                  onMouseOver={(e) => {
                    e.currentTarget.style.backgroundColor = 'var(--theme-color-hover)';
                  }}
                  onMouseOut={(e) => {
                    e.currentTarget.style.backgroundColor = 'var(--theme-color)';
                  }}
                >
                  Primary Action
                </button>
                <button 
                  className="py-2 px-2.5 rounded-lg text-[9px] font-bold text-zinc-400 border border-[var(--theme-border)] transition cursor-pointer hover:text-white"
                  style={{ backgroundColor: 'var(--theme-bg-panel)' }}
                >
                  Settings
                </button>
              </div>
            </div>

            {/* CSS Copy Panel */}
            <div className="pt-3 flex gap-2">
              <button
                onClick={handleCopyToClipboard}
                className="flex-1 bg-zinc-950 hover:bg-zinc-900 border border-zinc-800 hover:border-zinc-700 text-zinc-300 font-bold py-2 px-3 rounded-lg text-[9px] tracking-wider uppercase transition flex items-center justify-center gap-1.5 cursor-pointer"
              >
                {copiedIndex ? (
                  <>
                    <Check size={11} className="text-emerald-500 animate-pulse" />
                    <span>Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy size={11} className="text-zinc-500" />
                    <span>Copy CSS Variables</span>
                  </>
                )}
              </button>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
};
