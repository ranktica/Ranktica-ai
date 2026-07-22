# Ranktica AI — Project Custom Instructions & Guidelines

This document contains persistent engineering guidelines, design systems, architectural boundaries, and industry-domain knowledge for the **Ranktica AI Enterprise Suite**. It is designed to keep AI coding agents and human developers aligned on building top-1% industry-grade web applications.

---

## 1. Persona & Tone of Voice
- **The Ranktica Aesthetic**: High-caliber, clinical, data-driven, and highly polished. It feels like an elite terminal designed for executive CMOs and SaaS growth hackers.
- **Copywriting**: Use concise, bold, professional terminology. Avoid generic SaaS hype or filler text.
  - *Bad*: "Generate awesome titles for your videos!"
  - *Good*: "Synthesize high-CTR title variations backed by cognitive interest modeling."
- **Nomenclature**: Keep labels descriptive and literal (e.g., "Retention Curve Sim", "Workspace Manifest"). Avoid over-the-top fantasy names.

---

## 2. Design System & UX Standards

### 🎨 Color Palette & Theming (Cosmic Dark Slate)
- **Backgrounds**: Slate-charcoal and deep zinc base layers:
  - Base Layout: `bg-[#09090b]` or `bg-zinc-950`
  - Cards & Content Containers: `bg-zinc-900 border border-zinc-800`
  - Floating Headers: `bg-zinc-950/50 backdrop-blur-md border-b border-zinc-800`
- **Accents**: 
  - YouTube-centric actions: Bright Crimson Red (`text-red-500`, `bg-red-600`, `bg-red-600/10`, `border-red-600/20`)
  - AI Orchestration actions: Electric Indigo (`text-indigo-400`, `bg-indigo-600`)
  - Analytics & Success indicators: Emerald Green (`text-green-500`, `bg-green-500/10`)
  - Secondary systems: Royal Blue or Deep Purple

### ✍️ Typography Guidelines
- **Import Location**: Google Fonts imports are declared in `src/index.css`.
- **Primary Sans**: **Inter** (`font-sans`) for general UI, body copy, and navigation controls.
- **Display (Headings)**: **Space Grotesk** or **Outfit** for crisp, structural headers.
- **Monospace Accent**: **JetBrains Mono** (`font-mono`) for numerical stats, system statuses, telemetry labels, and code blocks.
- *Rule*: Never mix more than two visual font classes on a single card.

### 📐 Spacing & Rhythm
- Avoid perfect symmetry everywhere. Create visual hierarchy through varied paddings:
  - Section Wrapper: `p-12 md:p-16` or `gap-12`
  - Primary Card Padding: `p-8` with custom rounded corners (`rounded-[2rem]` or `rounded-[3rem]`)
  - Floating Badges: `px-4 py-1.5 rounded-full text-[10px] uppercase font-black tracking-widest`
- Ensure touch targets are at least `44px` on interactive elements.

---

## 3. Core Architecture & Tech Stack Boundaries

### ⚛️ Frontend Environment (React 18 & Vite)
- **React version constraint**: Strictly pinned to **React 18.3.1** and **React DOM 18.3.1**. 
- **Vite Config Alias resolving**: Vite's `resolve.alias` is configured to resolve `react` and `react-dom` directly from `node_modules` to prevent dual-runtime issues:
  ```ts
  alias: {
    '@': path.resolve(__dirname, './src'),
    'react': path.resolve(__dirname, './node_modules/react'),
    'react-dom': path.resolve(__dirname, './node_modules/react-dom'),
  }
  ```
- **Animations**: Use only custom hardware-accelerated animations or `motion/react` (previously `framer-motion`).
- **Icons**: Always import icons from `lucide-react`. Custom SVGs are forbidden.

### 🔌 Backend (Full-Stack Express + Vite)
- **Dev mode**: Run on `0.0.0.0:3000` using `tsx server.ts`.
- **Production Bundling**: The server is compiled to a standalone CommonJS bundle:
  ```json
  "build": "vite build && esbuild server.ts --bundle --platform=node --format=cjs --packages=external --sourcemap --outfile=dist/server.cjs"
  ```
  This bypasses relative ESM file checks in production containers.
- **API Proxying**: All third-party secrets (Gemini, database, etc.) must remain server-side behind `/api/*` endpoints. Never expose raw API keys or client variables lacking the `VITE_` prefix to the browser.

---

## 4. Ranktica Industry & Domain Knowledge

Ranktica AI is a state-of-the-art content strategy engine. Any edits to core modules should respect these functional concepts:

### 🎙️ Real-time Multimodal Live Brainstorming
- Uses the **Gemini Multimodal Live API** via persistent WebSockets over `server.ts`.
- Configured to run with high-quality prebuilt voice presets (e.g., `"Zephyr"`, `"Charon"`).
- Always include `outputAudioTranscription` in the websocket configuration setup to enable real-time textual transcript backups:
  ```json
  "outputAudioTranscription": {}
  ```

### 🧠 AI Employee OS Orchestration
- Allows scaling virtual outbound networks, competitor monitors, and creative specialists (e.g., metadata engineers, thumbnail raters, scripts writers).
- Inter-agent communication runs via the shared `AgentBusView` and state managers.

### 📊 Content Virality Metrics
- **Retention Curve Sim**: High retention curves are modeled as a function of "Linguistic Velocity" vs "Visual Density" (frequency of visual cues).
- **Blue Ocean Gap Analysis**: Evaluates niches based on low competitor count, rising query trend, and underserved content clusters.
