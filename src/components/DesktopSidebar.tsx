import React from 'react';
import { 
  Star, Trash2, Plus, Clock, ChevronRight, RotateCcw, LogOut
} from 'lucide-react';
import { ToolType, NavItem } from '@/shared/types';
import { toast } from 'react-hot-toast';

interface DesktopSidebarProps {
  currentTool: ToolType;
  onNavigate: (tool: ToolType) => void;
  favorites: ToolType[];
  toggleFavorite: (tool: ToolType) => void;
  user: any;
  theme: string;
  previewTheme: string | null;
  setPreviewTheme: (theme: string | null) => void;
  setTheme: (theme: string) => void;
  activeWorkspaceId: string;
  setActiveWorkspaceId: (id: string) => void;
  workspaces: any[];
  setShowWorkspaceCreator: (show: boolean) => void;
  deleteWorkspace: (id: string) => void;
  activeWorkspace: any;
  isExpiringSoon: boolean;
  daysLeft: number;
  isFree: boolean;
  plan: string;
  navItems: NavItem[];
  t: (key: string) => string;
  logout: () => void;
}

export const DesktopSidebar: React.FC<DesktopSidebarProps> = ({
  currentTool,
  onNavigate,
  favorites,
  toggleFavorite,
  user,
  theme,
  previewTheme,
  setPreviewTheme,
  setTheme,
  activeWorkspaceId,
  setActiveWorkspaceId,
  workspaces,
  setShowWorkspaceCreator,
  deleteWorkspace,
  activeWorkspace,
  isExpiringSoon,
  daysLeft,
  isFree,
  plan,
  navItems,
  t,
  logout,
}) => {
  return (
    <aside className="hidden md:flex w-64 flex-col border-r border-zinc-800 bg-[#0f0f12] shrink-0">
      <div className="p-6 pb-2">
        <h1 className="text-2xl font-black bg-gradient-to-r from-red-500 to-orange-500 bg-clip-text text-transparent">
          Ranktica AI
        </h1>
        <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest mt-1">
          Professional Cockpit
        </p>
      </div>

      {/* Workspace / YouTube Channel Switcher */}
      <div className="px-6 py-3 border-b border-zinc-850/60 space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-[9px] font-black uppercase text-zinc-500 tracking-[0.2em]">
            YouTube Workspace
          </span>
          <button
            onClick={() => setShowWorkspaceCreator(true)}
            className="p-1 hover:text-white text-zinc-500 rounded bg-zinc-950 border border-zinc-850 hover:bg-zinc-900 transition-all cursor-pointer"
            title="Deploy New Content Pipeline"
          >
            <Plus size={10} />
          </button>
        </div>

        <div className="relative">
          <select
            value={activeWorkspaceId}
            onChange={(e) => {
              setActiveWorkspaceId(e.target.value);
              const matched = workspaces.find(w => w.id === e.target.value);
              if (matched) {
                toast.success(`Pipeline switched to ${matched.name}! 🚀`, { id: 'switch-pipeline' });
              }
            }}
            className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-xs font-black text-zinc-200 focus:outline-none focus:border-red-500 transition-all cursor-pointer"
          >
            {workspaces.map((ws) => (
              <option key={ws.id} value={ws.id} className="bg-zinc-950 text-zinc-200">
                {ws.name} ({ws.handle})
              </option>
            ))}
          </select>
        </div>

        {/* Active Workspace Info Panel */}
        {activeWorkspace && (
          <div className="p-2.5 rounded-xl bg-zinc-950/40 border border-zinc-850 space-y-1">
            <div className="flex items-center justify-between text-[8px] font-black uppercase">
              <span className="text-red-500 tracking-wider">
                {activeWorkspace.niche}
              </span>
              <button
                onClick={() => {
                  if (workspaces.length <= 1) {
                    toast.error("Cannot delete the last workspace.", { id: 'delete-ws-err' });
                  } else {
                    if (confirm(`Are you sure you want to retire ${activeWorkspace.name}?`)) {
                      deleteWorkspace(activeWorkspace.id);
                    }
                  }
                }}
                className="text-zinc-600 hover:text-red-400 transition-colors cursor-pointer"
                title="Retire Channel Workspace"
              >
                <Trash2 size={9} />
              </button>
            </div>
            <p className="text-[10px] text-zinc-400 line-clamp-1">
              {activeWorkspace.audience}
            </p>
            <p className="text-[8px] text-zinc-500 leading-snug">
              Goal: {activeWorkspace.pipelineGoal}
            </p>
          </div>
        )}
      </div>

      <nav className="flex-1 px-3 space-y-4 overflow-y-auto pb-6 custom-scrollbar">
        {/* Starred Modules Section at the Top */}
        {favorites.length > 0 && (
          <div className="space-y-0.5 border-b border-zinc-850/60 pb-4 mb-2">
            <h3 className="px-4 text-[9px] font-black uppercase tracking-[0.2em] mb-2 mt-4 text-red-500 border-l border-red-500 ml-1 flex items-center gap-1.5">
              <Star size={10} className="fill-red-500 text-red-500 animate-pulse" />
              Starred Modules
            </h3>
            {navItems.filter((item) => favorites.includes(item.id)).map((item) => (
              <button
                key={`starred-${item.id}`}
                onClick={() => onNavigate(item.id)}
                className={`flex items-center justify-between w-full px-4 py-2 text-xs font-bold rounded-xl transition-all relative group/nav ${
                  currentTool === item.id
                    ? "bg-red-500/10 text-red-500 border border-red-500/20 shadow-lg shadow-red-500/5"
                    : "text-zinc-500 hover:bg-zinc-800/50 hover:text-zinc-200 border border-transparent"
                }`}
              >
                <div className="flex items-center">
                  <span
                    className={`mr-3 transition-colors ${currentTool === item.id ? "text-red-500" : "text-zinc-700 group-hover/nav:text-zinc-500"}`}
                  >
                    {item.icon}
                  </span>
                  <span className="truncate">
                    {(() => {
                      const keyMap: Record<string, string> = {
                        dashboard: 'creatorCommand',
                        projects: 'productionBoard',
                        team_members: 'teamMembers',
                        video_studio: 'videoStudio',
                        ai_employee_os: 'digitalEmployeeOS',
                        about: 'systemManifest',
                        cost_governance: 'aiCostGovernance',
                        security: 'securityAuditing',
                        activity_logs: 'auditCompliance'
                      };
                      return keyMap[item.id] ? t(keyMap[item.id]) : item.label;
                    })()}
                  </span>
                </div>

                {/* Unstar Toggle */}
                <span
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleFavorite(item.id);
                  }}
                  className="p-1 rounded hover:bg-zinc-850 text-yellow-500 transition-all shrink-0 ml-2"
                  title="Remove from Starred"
                >
                  <Star size={12} className="fill-yellow-500 text-yellow-500" />
                </span>

                {/* Tooltip Description */}
                {item.description && (
                  <div className="absolute left-full top-1/2 -translate-y-1/2 ml-3 hidden group-hover/nav:flex flex-col w-64 p-3.5 bg-zinc-950 border border-zinc-850 rounded-2xl shadow-2xl z-50 pointer-events-none animate-fade-in text-[10px] text-zinc-400 font-medium leading-relaxed">
                    <span className="text-white font-black uppercase tracking-wider text-[9px] block mb-1">{item.label}</span>
                    <p className="normal-case">{item.description}</p>
                  </div>
                )}
              </button>
            ))}
          </div>
        )}

        {/* Standard Navigation Categories */}
        {Array.from(new Set(navItems.map((i) => i.category || "Other"))).map(
          (cat) => (
            <div key={cat} className="space-y-0.5">
              <h3 className="px-4 text-[9px] font-black uppercase tracking-[0.2em] mb-2 mt-6 text-zinc-600 border-l border-zinc-800 ml-1">
                {cat}
              </h3>
              {navItems.filter((i) => i.category === cat).map((item) => (
                <button
                  key={item.id}
                  onClick={() => onNavigate(item.id)}
                  className={`flex items-center justify-between w-full px-4 py-2 text-xs font-bold rounded-xl transition-all relative group/nav ${
                    currentTool === item.id
                      ? "bg-red-500/10 text-red-500 border border-red-500/20 shadow-lg shadow-red-500/5"
                      : "text-zinc-500 hover:bg-zinc-800/50 hover:text-zinc-200 border border-transparent"
                  }`}
                >
                  <div className="flex items-center">
                    <span
                      className={`mr-3 transition-colors ${currentTool === item.id ? "text-red-500" : "text-zinc-700 group-hover/nav:text-zinc-500"}`}
                    >
                      {item.icon}
                    </span>
                    <span className="truncate">
                      {(() => {
                        const keyMap: Record<string, string> = {
                          dashboard: 'creatorCommand',
                          projects: 'productionBoard',
                          team_members: 'teamMembers',
                          video_studio: 'videoStudio',
                          ai_employee_os: 'digitalEmployeeOS',
                          about: 'systemManifest',
                          cost_governance: 'aiCostGovernance',
                          security: 'securityAuditing',
                          activity_logs: 'auditCompliance'
                        };
                        return keyMap[item.id] ? t(keyMap[item.id]) : item.label;
                      })()}
                    </span>
                  </div>

                  {/* Star Toggle */}
                  <span
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleFavorite(item.id);
                    }}
                    className={`p-1 rounded hover:bg-zinc-850 text-zinc-550 hover:text-yellow-500 transition-all shrink-0 ml-2 ${
                      favorites.includes(item.id) ? "opacity-100 text-yellow-500" : "opacity-0 group-hover/nav:opacity-100"
                    }`}
                    title={favorites.includes(item.id) ? "Remove from Favorites" : "Add to Favorites"}
                  >
                    <Star size={12} className={favorites.includes(item.id) ? "fill-yellow-500 text-yellow-500" : ""} />
                  </span>

                  {/* Tooltip Description */}
                  {item.description && (
                    <div className="absolute left-full top-1/2 -translate-y-1/2 ml-3 hidden group-hover/nav:flex flex-col w-64 p-3.5 bg-zinc-950 border border-zinc-850 rounded-2xl shadow-2xl z-50 pointer-events-none animate-fade-in text-[10px] text-zinc-400 font-medium leading-relaxed">
                      <span className="text-white font-black uppercase tracking-wider text-[9px] block mb-1">{item.label}</span>
                      <p className="normal-case">{item.description}</p>
                    </div>
                  )}
                </button>
              ))}
            </div>
          ),
        )}
      </nav>

      <div className="p-4 border-t border-zinc-800 space-y-4 bg-zinc-950/20">
        {isExpiringSoon && (
          <button
            onClick={() => onNavigate(ToolType.UPGRADE)}
            className="w-full flex flex-col items-center gap-2 p-4 bg-orange-600/10 border border-orange-500/30 rounded-2xl text-orange-500 hover:bg-orange-600/20 transition-all animate-pulse group"
          >
            <div className="flex items-center gap-2 font-black text-[9px] uppercase tracking-widest">
              <Clock size={12} /> Expiry Warning
            </div>
            <div className="text-[10px] font-bold">
              Renew manifest in {daysLeft}d
            </div>
            <div className="text-[8px] font-black uppercase text-zinc-500 flex items-center gap-1 group-hover:text-orange-400">
              Execute Renewal <ChevronRight size={10} />
            </div>
          </button>
        )}

        <div className="p-3 rounded-2xl bg-zinc-900 border border-zinc-800 relative group overflow-hidden">
          <div className="flex items-center gap-3 relative z-10">
            <div
              className={`w-9 h-9 rounded-xl flex items-center justify-center font-black text-[10px] ${isFree ? "bg-zinc-800 text-zinc-400" : "bg-red-600 text-white shadow-lg shadow-red-600/20"}`}
            >
              {plan.substring(0, 3).toUpperCase()}
            </div>
            <div className="flex-1 overflow-hidden">
              <p className="text-xs font-black truncate text-zinc-200">
                {user?.name}
              </p>
              <p className="text-[9px] font-bold text-zinc-600 uppercase tracking-tighter">
                {daysLeft}D REMAINING
              </p>
            </div>
            <button
              onClick={() => onNavigate(ToolType.UPGRADE)}
              className="p-1.5 text-zinc-600 hover:text-white bg-zinc-950 border border-zinc-800 rounded-lg transition-colors"
            >
              <RotateCcw size={12} />
            </button>
          </div>
        </div>

        {/* User-facing theme switcher toggle inside Layout Navigation */}
        <div className="p-3 rounded-2xl bg-zinc-950/40 border border-zinc-800 space-y-2">
          <div className="flex items-center justify-between pl-1">
            <span className="text-[8px] font-black uppercase text-zinc-500 tracking-[0.2em] block">
              {previewTheme ? "Theme Live Preview" : "Active Theme"}
            </span>
            {previewTheme && (
              <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-ping" />
            )}
          </div>
          <div className="grid grid-cols-4 gap-1">
            <button
              type="button"
              onClick={() => {
                setPreviewTheme('cyberpunk-red');
                toast("Previewing Cyberpunk Red! Click Apply below to save.", { id: 'preview-sidebar', icon: '🎨' });
              }}
              className={`flex flex-col items-center justify-center p-1.5 rounded-xl border text-[8px] font-black uppercase transition-all ${
                (previewTheme || theme) === 'cyberpunk-red'
                  ? "bg-red-500/10 border-red-500 text-red-500 shadow-md shadow-red-500/5 font-bold"
                  : "bg-zinc-900 border-zinc-850 text-zinc-500 hover:text-zinc-300 hover:bg-zinc-850"
              }`}
              title="Preview Cyberpunk Red Theme"
            >
              <span className="w-2 h-2 rounded-full bg-red-500 mb-1" />
              Red
            </button>
            <button
              type="button"
              onClick={() => {
                setPreviewTheme('midnight-blue');
                toast("Previewing Midnight Blue! Click Apply below to save.", { id: 'preview-sidebar', icon: '🎨' });
              }}
              className={`flex flex-col items-center justify-center p-1.5 rounded-xl border text-[8px] font-black uppercase transition-all ${
                (previewTheme || theme) === 'midnight-blue'
                  ? "bg-blue-500/10 border-blue-500 text-blue-500 shadow-md shadow-blue-500/5 font-bold"
                  : "bg-zinc-900 border-zinc-850 text-zinc-500 hover:text-zinc-300 hover:bg-zinc-850"
              }`}
              title="Preview Midnight Blue Theme"
            >
              <span className="w-2 h-2 rounded-full bg-blue-500 mb-1" />
              Blue
            </button>
            <button
              type="button"
              onClick={() => {
                setPreviewTheme('emerald-forest');
                toast("Previewing Emerald Forest! Click Apply below to save.", { id: 'preview-sidebar', icon: '🎨' });
              }}
              className={`flex flex-col items-center justify-center p-1.5 rounded-xl border text-[8px] font-black uppercase transition-all ${
                (previewTheme || theme) === 'emerald-forest'
                  ? "bg-emerald-500/10 border-emerald-500 text-emerald-500 shadow-md shadow-emerald-500/5 font-bold"
                  : "bg-zinc-900 border-zinc-850 text-zinc-500 hover:text-zinc-300 hover:bg-zinc-850"
              }`}
              title="Preview Emerald Forest Theme"
            >
              <span className="w-2 h-2 rounded-full bg-emerald-500 mb-1" />
              Forest
            </button>
            <button
              type="button"
              onClick={() => {
                setPreviewTheme('deep-work');
                toast("Previewing Deep Work! Click Apply below to save.", { id: 'preview-sidebar', icon: '🎨' });
              }}
              className={`flex flex-col items-center justify-center p-1.5 rounded-xl border text-[8px] font-black uppercase transition-all ${
                (previewTheme || theme) === 'deep-work'
                  ? "bg-zinc-100/10 border-zinc-100 text-zinc-100 shadow-md shadow-zinc-100/5 font-bold"
                  : "bg-zinc-900 border-zinc-850 text-zinc-500 hover:text-zinc-300 hover:bg-zinc-850"
              }`}
              title="Preview Deep Work Theme"
            >
              <span className="w-2 h-2 rounded-full bg-white mb-1" />
              Work
            </button>
          </div>

          {previewTheme && (
            <div className="pt-2 flex gap-1.5 border-t border-zinc-800/60 animate-fade-in">
              <button
                type="button"
                onClick={() => {
                  setTheme(previewTheme);
                  setPreviewTheme(null);
                  toast.success("Theme permanently applied! 🎉");
                }}
                className="flex-1 py-1 bg-red-650 hover:bg-red-600 text-[8px] font-black uppercase tracking-wider text-white rounded-lg transition-all text-center cursor-pointer"
              >
                Apply
              </button>
              <button
                type="button"
                onClick={() => {
                  setPreviewTheme(null);
                  toast("Preview discarded.", { icon: '🔄' });
                }}
                className="flex-1 py-1 bg-zinc-800 hover:bg-zinc-700 text-[8px] font-black uppercase tracking-wider text-zinc-400 rounded-lg transition-all text-center cursor-pointer"
              >
                Revert
              </button>
            </div>
          )}
        </div>

        <div className="pt-3 pb-1 border-t border-zinc-850/60 text-center">
          <a
            href="https://warsientrepreneurs.com/"
            target="_blank"
            rel="noopener noreferrer"
            className="group inline-flex flex-col items-center justify-center gap-0.5 text-[8px] font-mono tracking-widest text-zinc-650 hover:text-red-500 uppercase transition-all"
          >
            <span className="text-[7px] text-zinc-600 group-hover:text-zinc-500 transition-colors">Developed & Designed By</span>
            <span className="font-extrabold text-zinc-400 group-hover:text-red-500 tracking-[0.15em] transition-colors">Warsi Entrepreneurs</span>
          </a>
        </div>

        <button
          onClick={logout}
          className="w-full flex items-center justify-center gap-2 text-[10px] font-black uppercase tracking-widest text-zinc-600 hover:text-red-400 transition-all py-2 rounded-xl hover:bg-red-500/5 cursor-pointer"
        >
          <LogOut size={14} /> Sign Out
        </button>
      </div>
    </aside>
  );
};
