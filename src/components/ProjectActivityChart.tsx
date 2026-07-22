import React, { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';
import { Project } from '@/shared/types';
import { AreaChart, TrendingUp, Activity, HelpCircle } from 'lucide-react';

interface ProjectActivityChartProps {
  projects: Project[];
  logs: any[];
}

interface ChartDataPoint {
  date: Date;
  creations: number;
  activity: number;
}

export const ProjectActivityChart: React.FC<ProjectActivityChartProps> = ({ projects, logs }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const [dimensions, setDimensions] = useState({ width: 600, height: 260 });
  const [hoverData, setHoverData] = useState<ChartDataPoint | null>(null);

  // Resize Listener to ensure responsive scaling
  useEffect(() => {
    if (!containerRef.current) return;
    const resizeObserver = new ResizeObserver((entries) => {
      for (let entry of entries) {
        const { width } = entry.contentRect;
        setDimensions({
          width: Math.max(width, 280),
          height: 260
        });
      }
    });
    resizeObserver.observe(containerRef.current);
    return () => resizeObserver.disconnect();
  }, []);

  // Aggregate stats over last 30 days
  const data: ChartDataPoint[] = React.useMemo(() => {
    const list: ChartDataPoint[] = [];
    const today = new Date();
    
    // Generate dates for the last 30 days
    for (let i = 29; i >= 0; i--) {
      const d = new Date();
      d.setDate(today.getDate() - i);
      d.setHours(0, 0, 0, 0);
      list.push({
        date: d,
        creations: 0,
        activity: 0
      });
    }

    // Accumulate project creations
    projects.forEach(project => {
      let createdTime = project.lastUpdated; // fallback
      const parsedId = parseFloat(project.id);
      if (!isNaN(parsedId) && parsedId > 1000000000000) {
        createdTime = parsedId;
      } else {
        // Deterministic mock timestamp over the last 30 days based on ID string
        let sum = 0;
        for (let idx = 0; idx < project.id.length; idx++) {
          sum += project.id.charCodeAt(idx);
        }
        const daysAgo = sum % 28; // up to 28 days ago
        const pseudoDate = new Date();
        pseudoDate.setDate(today.getDate() - daysAgo);
        createdTime = pseudoDate.getTime();
      }

      const createdDate = new Date(createdTime);
      createdDate.setHours(0, 0, 0, 0);

      const target = list.find(item => item.date.getTime() === createdDate.getTime());
      if (target) {
        target.creations += 1;
      }
    });

    // Accumulate ledger logs/activities
    logs.forEach(log => {
      const logTime = typeof log.timestamp === 'number' ? log.timestamp : Date.parse(log.timestamp);
      if (isNaN(logTime)) return;

      const logDate = new Date(logTime);
      logDate.setHours(0, 0, 0, 0);

      const target = list.find(item => item.date.getTime() === logDate.getTime());
      if (target) {
        target.activity += 1;
      }
    });

    return list;
  }, [projects, logs]);

  // Total sums
  const totalCreations = data.reduce((acc, current) => acc + current.creations, 0);
  const totalActivity = data.reduce((acc, current) => acc + current.activity, 0);

  useEffect(() => {
    if (!svgRef.current || data.length === 0) return;

    // Clear previous drawing
    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();

    const margin = { top: 20, right: 30, bottom: 40, left: 45 };
    const chartWidth = dimensions.width - margin.left - margin.right;
    const chartHeight = dimensions.height - margin.top - margin.bottom;

    // Appending main g container
    const g = svg.append('g')
      .attr('transform', `translate(${margin.left}, ${margin.top})`);

    // Scales
    const xScale = d3.scaleTime()
      .domain(d3.extent(data, d => d.date) as [Date, Date])
      .range([0, chartWidth]);

    const maxCreations = d3.max(data, d => d.creations) || 0;
    const maxActivity = d3.max(data, d => d.activity) || 0;
    const maxY = Math.max(maxCreations, maxActivity, 5); // minimum height limit of 5 to avoid flat scale

    const yScale = d3.scaleLinear()
      .domain([0, maxY + 1])
      .nice()
      .range([chartHeight, 0]);

    // Create defs for high-end glowing gradients
    const defs = svg.append('defs');

    // Red Gradient for Creations
    const gradCreations = defs.append('linearGradient')
      .attr('id', 'grad-creations')
      .attr('x1', '0%').attr('y1', '0%')
      .attr('x2', '0%').attr('y2', '100%');
    gradCreations.append('stop')
      .attr('offset', '0%')
      .attr('stop-color', '#ef4444')
      .attr('stop-opacity', 0.25);
    gradCreations.append('stop')
      .attr('offset', '100%')
      .attr('stop-color', '#ef4444')
      .attr('stop-opacity', 0);

    // Blue Gradient for Activity Volume
    const gradActivity = defs.append('linearGradient')
      .attr('id', 'grad-activity')
      .attr('x1', '0%').attr('y1', '0%')
      .attr('x2', '0%').attr('y2', '100%');
    gradActivity.append('stop')
      .attr('offset', '0%')
      .attr('stop-color', '#3b82f6')
      .attr('stop-opacity', 0.25);
    gradActivity.append('stop')
      .attr('offset', '100%')
      .attr('stop-color', '#3b82f6')
      .attr('stop-opacity', 0);

    // Grid lines
    g.append('g')
      .attr('class', 'grid')
      .attr('opacity', 0.05)
      .call(d3.axisLeft(yScale)
        .ticks(5)
        .tickSize(-chartWidth)
        .tickFormat(() => '')
      )
      .selectAll('.domain').remove();

    // Axes
    const xAxis = d3.axisBottom(xScale)
      .ticks(Math.min(dimensions.width / 80, 8))
      .tickFormat(d3.timeFormat('%b %d') as any);

    const yAxis = d3.axisLeft(yScale)
      .ticks(5)
      .tickFormat(d3.format('d'));

    // Render X Axis
    g.append('g')
      .attr('transform', `translate(0, ${chartHeight})`)
      .call(xAxis)
      .attr('color', '#52525b')
      .selectAll('text')
      .attr('class', 'font-mono text-[9px] font-semibold text-zinc-500')
      .attr('dy', '10px');

    // Render Y Axis
    g.append('g')
      .call(yAxis)
      .attr('color', '#52525b')
      .selectAll('text')
      .attr('class', 'font-mono text-[9px] font-semibold text-zinc-500')
      .attr('dx', '-4px');

    // Remove axis lines outer borders to resemble visual minimalism
    g.selectAll('.domain').attr('stroke', '#27272a').attr('stroke-width', 0.5);
    g.selectAll('.tick line').attr('stroke', '#27272a');

    // Area Generator - Creations
    const areaCreations = d3.area<ChartDataPoint>()
      .x(d => xScale(d.date))
      .y0(chartHeight)
      .y1(d => yScale(d.creations))
      .curve(d3.curveMonotoneX);

    // Area Generator - Activity
    const areaActivity = d3.area<ChartDataPoint>()
      .x(d => xScale(d.date))
      .y0(chartHeight)
      .y1(d => yScale(d.activity))
      .curve(d3.curveMonotoneX);

    // Line Generator - Creations
    const lineCreations = d3.line<ChartDataPoint>()
      .x(d => xScale(d.date))
      .y(d => yScale(d.creations))
      .curve(d3.curveMonotoneX);

    // Line Generator - Activity
    const lineActivity = d3.line<ChartDataPoint>()
      .x(d => xScale(d.date))
      .y(d => yScale(d.activity))
      .curve(d3.curveMonotoneX);

    // Draw Activity Area & Line (draw first to sit behind creations)
    g.append('path')
      .datum(data)
      .attr('fill', 'url(#grad-activity)')
      .attr('d', areaActivity);

    g.append('path')
      .datum(data)
      .attr('fill', 'none')
      .attr('stroke', '#3b82f6')
      .attr('stroke-width', 2)
      .attr('d', lineActivity);

    // Draw Creations Area & Line
    g.append('path')
      .datum(data)
      .attr('fill', 'url(#grad-creations)')
      .attr('d', areaCreations);

    g.append('path')
      .datum(data)
      .attr('fill', 'none')
      .attr('stroke', '#ef4444')
      .attr('stroke-width', 2)
      .attr('d', lineCreations);

    // Interactive Overlay for tooltips
    const bisectDate = d3.bisector<ChartDataPoint, Date>(d => d.date).left;

    const hoverLine = g.append('line')
      .attr('y1', 0)
      .attr('y2', chartHeight)
      .attr('stroke', '#52525b')
      .attr('stroke-dasharray', '3,3')
      .attr('stroke-width', 1)
      .style('display', 'none');

    const focusCircleCreations = g.append('circle')
      .attr('r', 4.5)
      .attr('fill', '#ef4444')
      .attr('stroke', '#ffffff')
      .attr('stroke-width', 1.5)
      .style('display', 'none');

    const focusCircleActivity = g.append('circle')
      .attr('r', 4.5)
      .attr('fill', '#3b82f6')
      .attr('stroke', '#ffffff')
      .attr('stroke-width', 1.5)
      .style('display', 'none');

    svg.on('mousemove', (event) => {
      const mouseX = d3.pointer(event)[0] - margin.left;
      if (mouseX >= 0 && mouseX <= chartWidth) {
        const x0 = xScale.invert(mouseX);
        const i = bisectDate(data, x0, 1);
        const d0 = data[i - 1];
        const d1 = data[i];
        let d = d0;
        if (d1 && d0) {
          d = (x0.getTime() - d0.date.getTime() > d1.date.getTime() - x0.getTime()) ? d1 : d0;
        }

        if (d) {
          const xPos = xScale(d.date);
          hoverLine.attr('x1', xPos).attr('x2', xPos).style('display', null);
          focusCircleCreations.attr('cx', xPos).attr('cy', yScale(d.creations)).style('display', null);
          focusCircleActivity.attr('cx', xPos).attr('cy', yScale(d.activity)).style('display', null);
          setHoverData(d);
        }
      }
    });

    svg.on('mouseleave', () => {
      hoverLine.style('display', 'none');
      focusCircleCreations.style('display', 'none');
      focusCircleActivity.style('display', 'none');
      setHoverData(null);
    });

  }, [data, dimensions]);

  return (
    <div className="bg-zinc-950/65 rounded-[2.2rem] border border-zinc-850 p-6 md:p-8 flex flex-col gap-6 shadow-xl relative overflow-hidden backdrop-blur-md">
      {/* Background glow effects */}
      <div className="absolute top-0 right-0 w-44 h-44 bg-red-650/5 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-44 h-44 bg-blue-600/5 rounded-full blur-3xl pointer-events-none" />

      {/* Title & Metadata row */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <span className="text-[9px] font-black tracking-widest text-zinc-550 uppercase flex items-center gap-1.5 font-mono mb-1">
            <Activity size={10} className="text-red-500 animate-pulse" /> 30-Day Workspace Performance
          </span>
          <h3 className="text-sm font-black text-white uppercase tracking-wider flex items-center gap-2">
            Volume & Trend Analysis Ledger
          </h3>
        </div>

        {/* Legend block */}
        <div className="flex flex-wrap gap-4 items-center">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded bg-red-500" />
            <div className="flex flex-col leading-none">
              <span className="text-[9px] font-bold text-zinc-400 uppercase font-mono">Workspace Creations</span>
              <span className="text-xs text-white font-black mt-0.5">{totalCreations} TOTAL</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded bg-blue-500" />
            <div className="flex flex-col leading-none">
              <span className="text-[9px] font-bold text-zinc-400 uppercase font-mono">Workflow Actions</span>
              <span className="text-xs text-white font-black mt-0.5">{totalActivity} EVENTS</span>
            </div>
          </div>
        </div>
      </div>

      {/* SVG Canvas Area */}
      <div ref={containerRef} className="w-full relative flex items-center justify-center min-h-[170px]">
        <svg
          ref={svgRef}
          width={dimensions.width}
          height={dimensions.height}
          className="overflow-visible select-none cursor-crosshair max-w-full"
        />

        {/* Interactive Dynamic floating readout panel */}
        {hoverData && (
          <div className="absolute top-2 left-1/2 -translate-x-1/2 bg-zinc-900 border border-zinc-800 rounded-2xl px-4 py-2.5 shadow-2xl flex gap-4 text-[10px] items-center pointer-events-none animate-fade-in font-mono">
            <span className="text-zinc-400 font-extrabold whitespace-nowrap">
              {hoverData.date.toLocaleDateString([], { month: 'short', day: 'numeric' })}:
            </span>
            <div className="flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
              <span className="text-zinc-500 font-black">Creations:</span>
              <span className="text-white font-black">{hoverData.creations}</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
              <span className="text-zinc-500 font-black">Actions:</span>
              <span className="text-white font-black">{hoverData.activity}</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
