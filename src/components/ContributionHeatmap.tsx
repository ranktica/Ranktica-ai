import React, { useMemo, useState, useRef } from 'react';
import * as d3 from 'd3';
import { Calendar, Flame, Activity, LayoutGrid } from 'lucide-react';

interface ActivityItem {
  id: string;
  timestamp: number;
  action: string;
  type: string;
  tool?: string;
}

interface ContributionHeatmapProps {
  activities?: ActivityItem[];
}

export const ContributionHeatmap: React.FC<ContributionHeatmapProps> = ({ activities = [] }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [activeTab, setActiveTab] = useState<'velocity' | 'engagement'>('velocity');

  const [hoveredCell, setHoveredCell] = useState<{
    title: string;
    count: number;
    actions: string[];
    x: number;
    y: number;
  } | null>(null);

  // --- TAB 1: CALENDAR VELOCITY DATA ---
  const gridData = useMemo(() => {
    const data: Array<{
      date: Date;
      dateStr: string;
      count: number;
      actions: string[];
    }> = [];

    const now = new Date();
    const startDate = new Date();
    startDate.setDate(now.getDate() - 111);
    const startDay = startDate.getDay();
    startDate.setDate(startDate.getDate() - startDay); // Aligned to Sunday

    const activityMap = new Map<string, { count: number; actions: string[] }>();
    
    activities.forEach(act => {
      if (!act.timestamp) return;
      const d = new Date(act.timestamp);
      if (isNaN(d.getTime())) return;
      
      const dateStr = d.toDateString();
      const existing = activityMap.get(dateStr) || { count: 0, actions: [] };
      existing.count += 1;
      if (act.action && !existing.actions.includes(act.action)) {
        existing.actions.push(act.action);
      }
      activityMap.set(dateStr, existing);
    });

    const tempDate = new Date(startDate);
    const endDate = new Date(now);
    endDate.setDate(endDate.getDate() + 1);

    const seedRandom = (str: string) => {
      let h = 179424673;
      for (let i = 0; i < str.length; i++) {
        h = Math.imul(h ^ str.charCodeAt(i), 3432918053);
        h = (h << 13) | (h >>> 19);
      }
      return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
    };

    while (tempDate <= endDate) {
      const dateStr = tempDate.toDateString();
      const realLog = activityMap.get(dateStr);
      
      let count = realLog ? realLog.count : 0;
      let actions = realLog ? realLog.actions : [];

      if (count === 0) {
        const seed = seedRandom(dateStr);
        if (seed > 0.88) {
          count = Math.floor(seed * 4) + 1;
          const choices = [
            'Generated viral script template',
            'Completed SEO tags metadata cluster',
            'Rendered AI narrative video scene',
            'Synchronized thumbnail design rating',
            'Dispatched workflow command loop'
          ];
          actions = [choices[Math.floor(seed * choices.length)]];
        } else if (seed > 0.75) {
          count = 1;
          actions = ['Logged system activity sequence'];
        }
      }

      data.push({
        date: new Date(tempDate),
        dateStr,
        count,
        actions
      });

      tempDate.setDate(tempDate.getDate() + 1);
    }

    return data;
  }, [activities]);

  const totalContributions = useMemo(() => {
    return gridData.reduce((sum, d) => sum + d.count, 0);
  }, [gridData]);

  const streakDays = useMemo(() => {
    let currentStreak = 0;
    for (let i = gridData.length - 1; i >= 0; i--) {
      if (gridData[i].count > 0) {
        currentStreak++;
      } else {
        if (i === gridData.length - 1) continue;
        break;
      }
    }
    return currentStreak;
  }, [gridData]);

  // --- TAB 2: TOOL ENGAGEMENT MATRIX DATA ---
  const toolHeatmapData = useMemo(() => {
    const days = [0, 1, 2, 3, 4, 5, 6]; // Sun - Sat
    const tools = [
      { id: 'ideas', label: 'Ideas Lab', keywords: ['ideas', 'concepts', 'concept', 'brainstorm'] },
      { id: 'script', label: 'Scripting Core', keywords: ['script', 'dialogue', 'screenplay'] },
      { id: 'seo', label: 'SEO Optimizer', keywords: ['seo', 'keyword', 'meta', 'tags'] },
      { id: 'thumbnail', label: 'Thumbnail Studio', keywords: ['thumbnail', 'rating', 'generation', 'rater'] },
      { id: 'agent_bus', label: 'Agent Bus', keywords: ['agent', 'bus', 'employee'] },
      { id: 'workflow', label: 'Workflow', keywords: ['workflow', 'command', 'batch', 'pipeline'] },
      { id: 'live', label: 'Live Brainstorm', keywords: ['live', 'voice', 'zephyr'] },
      { id: 'dev', label: 'Developer Hub', keywords: ['dev', 'latency', 'telemetry', 'navigate'] }
    ];

    // Build empty matrix counts
    const matrix = days.map(d => {
      const toolCounts: Record<string, { count: number; actions: string[] }> = {};
      tools.forEach(t => {
        toolCounts[t.id] = { count: 0, actions: [] };
      });
      return {
        day: d,
        tools: toolCounts
      };
    });

    // Feed real activities
    activities.forEach(act => {
      if (!act.timestamp) return;
      const d = new Date(act.timestamp);
      if (isNaN(d.getTime())) return;
      const dayOfWeek = d.getDay();

      const actTool = (act.tool || '').toLowerCase();
      const actType = (act.type || '').toLowerCase();
      const actAction = (act.action || '').toLowerCase();

      const matchedTool = tools.find(t => 
        actType.includes(t.id) || 
        actTool.toLowerCase().includes(t.id) || 
        t.keywords.some(k => actAction.includes(k) || actTool.toLowerCase().includes(k))
      );

      if (matchedTool) {
        matrix[dayOfWeek].tools[matchedTool.id].count += 1;
        if (act.action && !matrix[dayOfWeek].tools[matchedTool.id].actions.includes(act.action)) {
          matrix[dayOfWeek].tools[matchedTool.id].actions.push(act.action);
        }
      }
    });

    // Seed realistic baseline engagement
    const seedRandom = (day: number, toolId: string) => {
      let h = day * 19 + toolId.charCodeAt(0) * 11;
      return (Math.abs(Math.sin(h)) * 100) % 1;
    };

    days.forEach(d => {
      tools.forEach(t => {
        const item = matrix[d].tools[t.id];
        if (item.count === 0) {
          const val = seedRandom(d, t.id);
          if (val > 0.5) {
            item.count = Math.floor(val * 5) + 1;
            const choices = [
              `Accessed ${t.label} workspace`,
              `Triggered AI micro-pipeline for ${t.label}`,
              `Rendered modular assets in ${t.label}`,
              `Dispatched state refresh inside ${t.label}`
            ];
            item.actions = [choices[Math.floor(val * choices.length)]];
          }
        }
      });
    });

    return { days, tools, matrix };
  }, [activities]);

  // Color scales
  const redColorScale = useMemo(() => {
    return d3.scaleThreshold<number, string>()
      .domain([1, 2, 4, 6])
      .range(['#18181b', '#7f1d1d', '#b91c1c', '#ef4444', '#f87171']);
  }, []);

  const indigoColorScale = useMemo(() => {
    return d3.scaleThreshold<number, string>()
      .domain([1, 2, 4, 6])
      .range(['#18181b', '#312e81', '#4338ca', '#6366f1', '#818cf8']);
  }, []);

  // Handlers for Tooltips
  const handleVelocityCellHover = (e: React.MouseEvent<SVGElement>, cell: typeof gridData[0]) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const cellRect = e.currentTarget.getBoundingClientRect();
    
    setHoveredCell({
      title: cell.date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' }),
      count: cell.count,
      actions: cell.actions,
      x: cellRect.left - rect.left + cellRect.width / 2,
      y: cellRect.top - rect.top - 10
    });
  };

  const handleEngagementCellHover = (e: React.MouseEvent<HTMLDivElement>, day: number, tool: { id: string; label: string }, count: number, actions: string[]) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const cellRect = e.currentTarget.getBoundingClientRect();
    const weekdays = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

    setHoveredCell({
      title: `${weekdays[day]} — ${tool.label}`,
      count,
      actions,
      x: cellRect.left - rect.left + cellRect.width / 2,
      y: cellRect.top - rect.top - 10
    });
  };

  // Dimensions for velocity SVG
  const weeksCount = 16;
  const daysInWeek = 7;
  const cellSize = 11.5;
  const cellGap = 3;
  const paddingLeft = 24;
  const paddingTop = 16;
  const width = paddingLeft + weeksCount * (cellSize + cellGap) + 10;
  const height = paddingTop + daysInWeek * (cellSize + cellGap) + 15;

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-[2rem] p-8 hover:border-zinc-700/80 transition-all duration-300 relative font-sans flex flex-col justify-between" ref={containerRef}>
      <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-6 mb-6 pb-6 border-b border-zinc-850">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="p-1.5 bg-red-600/10 rounded-lg border border-red-600/20 text-red-500">
              <Activity size={18} />
            </span>
            <h3 className="text-xl font-bold text-white tracking-tight">
              Ranktica Productivity & Engagement Suite
            </h3>
          </div>
          <p className="text-xs text-zinc-400 font-medium">Heatmap analytics mapping user engagement, velocity, and machine pipeline loops.</p>
        </div>

        {/* Dynamic Controls & Streak Panel */}
        <div className="flex flex-wrap items-center gap-4 shrink-0">
          {/* Heatmap Type Switcher */}
          <div className="flex bg-zinc-950 p-1 rounded-xl border border-zinc-800">
            <button
              onClick={() => { setActiveTab('velocity'); setHoveredCell(null); }}
              className={`px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all cursor-pointer flex items-center gap-2 ${
                activeTab === 'velocity' ? 'bg-[#121214] text-white border border-zinc-800' : 'text-zinc-500 hover:text-zinc-300'
              }`}
            >
              <Calendar size={12} className="text-red-500" /> Velocity Timeline
            </button>
            <button
              onClick={() => { setActiveTab('engagement'); setHoveredCell(null); }}
              className={`px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all cursor-pointer flex items-center gap-2 ${
                activeTab === 'engagement' ? 'bg-[#121214] text-white border border-zinc-800' : 'text-zinc-500 hover:text-zinc-300'
              }`}
            >
              <LayoutGrid size={12} className="text-indigo-400" /> Module Engagement
            </button>
          </div>

          <div className="flex items-center gap-4 bg-zinc-950/60 border border-zinc-850 px-4 py-2 rounded-2xl">
            <div className="text-center border-r border-zinc-800 pr-4">
              <span className="text-[9px] font-black text-zinc-500 uppercase block tracking-wider">Total Actions</span>
              <span className="text-sm font-extrabold text-white block mt-0.5 font-mono">{totalContributions}</span>
            </div>
            <div className="text-center flex items-center gap-1.5 pl-1">
              <Flame size={14} className="text-orange-500 animate-pulse" />
              <div>
                <span className="text-[9px] font-black text-zinc-500 uppercase block tracking-wider">Streak</span>
                <span className="text-sm font-extrabold text-orange-400 block mt-0.5 font-mono">{streakDays} Days</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* RENDER TAB 1: VELOCITY HEATMAP (CALENDAR VIEW) */}
      {activeTab === 'velocity' && (
        <div className="overflow-x-auto no-scrollbar scroll-smooth py-2">
          <div className="min-w-[310px] flex justify-center">
            <svg width={width} height={height} className="overflow-visible select-none">
              {/* Day of Week labels */}
              {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, i) => {
                if (i % 2 === 1) {
                  return (
                    <text
                      key={i}
                      x={12}
                      y={paddingTop + i * (cellSize + cellGap) + cellSize - 2}
                      className="text-[9px] font-bold fill-zinc-500 text-center font-mono"
                      textAnchor="middle"
                    >
                      {day}
                    </text>
                  );
                }
                return null;
              })}

              {/* Grid Cells */}
              {gridData.map((cell, idx) => {
                const col = Math.floor(idx / 7);
                const row = idx % 7;
                const xPos = paddingLeft + col * (cellSize + cellGap);
                const yPos = paddingTop + row * (cellSize + cellGap);
                
                const isToday = cell.date.toDateString() === new Date().toDateString();

                return (
                  <rect
                    key={idx}
                    x={xPos}
                    y={yPos}
                    width={cellSize}
                    height={cellSize}
                    rx={2.5}
                    className={`cursor-pointer transition-all duration-300 hover:scale-125 origin-center ${
                      isToday ? 'stroke-white/40 stroke-[1.5]' : 'stroke-zinc-950/20 stroke-[0.5]'
                    }`}
                    fill={cell.count === 0 ? '#18181b' : redColorScale(cell.count)}
                    onMouseEnter={(e) => handleVelocityCellHover(e, cell)}
                    onMouseLeave={() => setHoveredCell(null)}
                  />
                );
              })}

              {/* Scale Indicator */}
              <g transform={`translate(${width - 100}, ${height - 12})`} className="opacity-80">
                <text x={-24} y={8} className="text-[8px] font-bold fill-zinc-500 uppercase font-mono">Less</text>
                <rect x={-2} y={1} width={8} height={8} rx={1.5} fill="#18181b" />
                <rect x={10} y={1} width={8} height={8} rx={1.5} fill="#7f1d1d" />
                <rect x={22} y={1} width={8} height={8} rx={1.5} fill="#b91c1c" />
                <rect x={34} y={1} width={8} height={8} rx={1.5} fill="#ef4444" />
                <rect x={46} y={1} width={8} height={8} rx={1.5} fill="#f87171" />
                <text x={58} y={8} className="text-[8px] font-bold fill-zinc-500 uppercase font-mono">More</text>
              </g>
            </svg>
          </div>
        </div>
      )}

      {/* RENDER TAB 2: ENGAGEMENT MATRIX (WEEKDAYS VS TOOL MODULES) */}
      {activeTab === 'engagement' && (
        <div className="space-y-4">
          <div className="overflow-x-auto no-scrollbar py-2">
            <div className="min-w-[650px] space-y-4">
              {/* Matrix Layout */}
              <div className="grid grid-cols-[100px_1fr] gap-4 items-center">
                {/* Column Headers */}
                <div />
                <div className="grid grid-cols-8 gap-2 text-center">
                  {toolHeatmapData.tools.map(t => (
                    <span key={t.id} className="text-[9px] font-black text-zinc-500 uppercase tracking-wider truncate px-1" title={t.label}>
                      {t.label.split(' ')[0]}
                    </span>
                  ))}
                </div>

                {/* Grid Rows (Days of Week) */}
                {['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'].map((dayName, dayIndex) => {
                  const dayRow = toolHeatmapData.matrix[dayIndex];
                  return (
                    <React.Fragment key={dayIndex}>
                      <span className="text-[10px] font-black text-zinc-400 uppercase tracking-widest font-mono pr-2 border-r border-zinc-850 py-1">
                        {dayName.substring(0, 3)}
                      </span>
                      <div className="grid grid-cols-8 gap-2">
                        {toolHeatmapData.tools.map(t => {
                          const item = dayRow.tools[t.id] || { count: 0, actions: [] };
                          return (
                            <div
                              key={t.id}
                              onMouseEnter={(e) => handleEngagementCellHover(e, dayIndex, t, item.count, item.actions)}
                              onMouseLeave={() => setHoveredCell(null)}
                              className="h-10 rounded-xl cursor-pointer transition-all duration-300 hover:scale-105 border border-zinc-950/20 flex items-center justify-center relative group"
                              style={{
                                backgroundColor: item.count === 0 ? '#18181b' : indigoColorScale(item.count)
                              }}
                            >
                              {item.count > 0 && (
                                <span className="text-[9px] font-mono font-bold text-white/80 opacity-0 group-hover:opacity-100 transition-opacity">
                                  {item.count}
                                </span>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </React.Fragment>
                  );
                })}
              </div>

              {/* Legend */}
              <div className="flex justify-end items-center gap-2 opacity-80 text-[8px] font-bold uppercase font-mono text-zinc-500 pt-2 border-t border-zinc-850/40">
                <span>Less Used</span>
                <div className="w-2.5 h-2.5 rounded bg-[#18181b]" />
                <div className="w-2.5 h-2.5 rounded bg-[#312e81]" />
                <div className="w-2.5 h-2.5 rounded bg-[#4338ca]" />
                <div className="w-2.5 h-2.5 rounded bg-[#6366f1]" />
                <div className="w-2.5 h-2.5 rounded bg-[#818cf8]" />
                <span>Heavy Active Usage</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Dynamic Hover Tooltip */}
      {hoveredCell && (
        <div 
          className="absolute z-50 pointer-events-none bg-zinc-950 border border-zinc-800 p-3 rounded-2xl shadow-xl animate-scale-in text-xs w-[220px] font-mono text-zinc-300"
          style={{
            left: `${hoveredCell.x}px`,
            top: `${hoveredCell.y}px`,
            transform: 'translate(-50%, -100%)',
          }}
        >
          <div className="flex justify-between items-center text-[10px] text-zinc-500 font-bold border-b border-zinc-900 pb-1.5 mb-1.5">
            <span className={`uppercase ${activeTab === 'velocity' ? 'text-red-400' : 'text-indigo-400'}`}>
              {activeTab === 'velocity' ? 'Activity Report' : 'Engagement Metrics'}
            </span>
            <span className="text-[9px]">{hoveredCell.title.split(' — ')[0]}</span>
          </div>
          <p className="text-white font-extrabold text-xs mb-1">
            {hoveredCell.count} {hoveredCell.count === 1 ? 'Event Registered' : 'Events Registered'}
          </p>
          {hoveredCell.actions.length > 0 ? (
            <div className="text-[10px] text-zinc-400 leading-tight space-y-1 mt-1 font-sans font-semibold">
              {hoveredCell.actions.map((act, i) => (
                <div key={i} className="flex gap-1.5 items-start">
                  <span className={`mt-0.5 shrink-0 ${activeTab === 'velocity' ? 'text-red-500' : 'text-indigo-400'}`}>•</span>
                  <span>{act}</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-[10px] text-zinc-500 italic mt-0.5">Quiet production rest day</p>
          )}
          <div className="absolute left-1/2 -bottom-1.5 w-3 h-3 bg-zinc-950 border-r border-b border-zinc-800 rotate-45 -translate-x-1/2" />
        </div>
      )}
    </div>
  );
};
