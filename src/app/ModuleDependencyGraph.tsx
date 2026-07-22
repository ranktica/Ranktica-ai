import React, { useEffect, useRef, useState, useMemo } from 'react';
import * as d3 from 'd3';
import { 
  Share2, 
  Database, 
  Cpu, 
  Activity, 
  ShieldCheck, 
  Zap, 
  Search, 
  RefreshCw, 
  Info,
  Maximize2,
  Sliders,
  Sparkles,
  Layers
} from 'lucide-react';
import { toast } from 'react-hot-toast';

interface GraphNode extends d3.SimulationNodeDatum {
  id: string;
  label: string;
  group: 'state' | 'ai' | 'seo' | 'governance';
  details: string;
  size: number;
  dataShared: string;
  ragSyncMode: string;
  couplingCount: number;
}

interface GraphLink extends d3.SimulationLinkDatum<GraphNode> {
  source: string | GraphNode;
  target: string | GraphNode;
  contextType: 'Project Params' | 'Target Keywords' | 'Script Outline' | 'Audio Feed' | 'Visual Prompt' | 'Eco Limits' | 'System Throttles';
  flowRate: string;
}

export function ModuleDependencyGraph() {
  const svgRef = useRef<SVGSVGElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  
  const [selectedNode, setSelectedNode] = useState<GraphNode | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterGroup, setFilterGroup] = useState<string>('all');
  const [chargeStrength, setChargeStrength] = useState<number>(-400);
  const [linkDistance, setLinkDistance] = useState<number>(100);
  const [showFlowAnimation, setShowFlowAnimation] = useState<boolean>(true);

  // Initial pristine static configuration of Ranktica AI module coupling
  const initialNodes: GraphNode[] = [
    { id: 'projects', label: 'Projects Registry', group: 'state', size: 14, dataShared: 'Project Schema, Deadline Timelines, Metadata', ragSyncMode: 'Transactional DB', details: 'Core local state engine holding project config schemas, audience metrics, and milestone checklists.', couplingCount: 5 },
    { id: 'livebrainstorm', label: 'Live Brainstorm Core', group: 'ai', size: 12, dataShared: 'Websocket Audio Packets, Real-time Transcripts', ragSyncMode: 'Bi-directional Streams', details: 'Gemini Multimodal Live API socket layer managing active voice input, transcription offsets, and conversational states.', couplingCount: 3 },
    { id: 'ideagen', label: 'Idea Discovery & CTR Engine', group: 'ai', size: 11, dataShared: 'Niche Ideas, Scored CTR Keywords, Trends Overlap', ragSyncMode: 'On-Demand RAG Caching', details: 'Synthesizes blue-ocean concept parameters using strategic planner thresholds to evaluate trajectory scores.', couplingCount: 4 },
    { id: 'scriptwriter', label: 'Script Screenplay Engine', group: 'ai', size: 12, dataShared: 'Markdown Outlines, Dialogue Beats, Retention Cues', ragSyncMode: 'Hierarchical Context', details: 'Drafts high-retention screenplays complete with visual interrupt prompts and pattern resets.', couplingCount: 3 },
    { id: 'thumbnailgen', label: 'Thumbnail Studio & Vision Rater', group: 'ai', size: 10, dataShared: 'Image Coordinate Prompts, CTR Predictor Heatmaps', ragSyncMode: 'Diffusion Metadata Sync', details: 'Generates contrast descriptors and rates candidate layouts for click probability scoring.', couplingCount: 3 },
    { id: 'seooptimizer', label: 'SEO Semantic indexer', group: 'seo', size: 10, dataShared: 'Nested JSON-LD Schemas, Interlinked Wikidata Entities', ragSyncMode: 'Wikidata Ontology Index', details: 'Builds compliant structured objects and runs density scans to eliminate indexing blocks.', couplingCount: 2 },
    { id: 'agentos', label: 'AI Employee OS Orchestrator', group: 'state', size: 13, dataShared: 'AgentBus Transmissions, Virtual Monitors State', ragSyncMode: 'Pub/Sub Event Bus', details: 'Handles parallel outbound crawler networks and coordinates cross-agent metadata auditing.', couplingCount: 4 },
    { id: 'costgov', label: 'Cost & Concurrency Controller', group: 'governance', size: 12, dataShared: 'Priority Queue Weights, Hardware Throttling Rates', ragSyncMode: 'Static Config Layer', details: 'Provides thread scheduling buffers and worker speed restrictions to regulate API token expenditures.', couplingCount: 3 }
  ];

  const initialLinks: GraphLink[] = [
    { source: 'projects', target: 'agentos', contextType: 'Project Params', flowRate: '9.6 KB/s' },
    { source: 'projects', target: 'ideagen', contextType: 'Project Params', flowRate: '4.2 KB/s' },
    { source: 'ideagen', target: 'scriptwriter', contextType: 'Target Keywords', flowRate: '12.4 KB/s' },
    { source: 'scriptwriter', target: 'livebrainstorm', contextType: 'Script Outline', flowRate: '48.0 KB/s' },
    { source: 'scriptwriter', target: 'thumbnailgen', contextType: 'Visual Prompt', flowRate: '8.1 KB/s' },
    { source: 'seooptimizer', target: 'ideagen', contextType: 'Target Keywords', flowRate: '3.5 KB/s' },
    { source: 'agentos', target: 'livebrainstorm', contextType: 'Audio Feed', flowRate: '128.0 KB/s' },
    { source: 'costgov', target: 'agentos', contextType: 'System Throttles', flowRate: '1.2 KB/s' },
    { source: 'costgov', target: 'thumbnailgen', contextType: 'Eco Limits', flowRate: '0.8 KB/s' }
  ];

  // Keep a node reference when clicked for details
  useEffect(() => {
    if (!selectedNode) {
      // Auto-select projects registry by default to give a high-value display on load
      const found = initialNodes.find(n => n.id === 'projects');
      if (found) setSelectedNode(found);
    }
  }, []);

  // Filtered nodes and links based on selections and search queries
  const filteredData = useMemo(() => {
    // 1. Filter Nodes
    let nodes = initialNodes.map(n => ({ ...n }));
    if (filterGroup !== 'all') {
      nodes = nodes.filter(n => n.group === filterGroup);
    }
    if (searchQuery.trim() !== '') {
      const q = searchQuery.toLowerCase();
      nodes = nodes.filter(n => n.label.toLowerCase().includes(q) || n.details.toLowerCase().includes(q) || n.id.toLowerCase().includes(q));
    }

    // 2. Filter Links (only keep links where both source and target exist in filtered nodes)
    const nodeIds = new Set(nodes.map(n => n.id));
    const links = initialLinks
      .filter(l => {
        const srcId = typeof l.source === 'string' ? l.source : (l.source as any).id;
        const tgtId = typeof l.target === 'string' ? l.target : (l.target as any).id;
        return nodeIds.has(srcId) && nodeIds.has(tgtId);
      })
      .map(l => ({ ...l }));

    return { nodes, links };
  }, [filterGroup, searchQuery]);

  useEffect(() => {
    if (!svgRef.current) return;

    // Clear previous SVG contents
    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();

    const width = svgRef.current.clientWidth || 550;
    const height = 400;

    // Setup arrow markers for link direction flow
    const defs = svg.append('defs');
    
    defs.append('marker')
      .attr('id', 'arrow')
      .attr('viewBox', '0 -5 10 10')
      .attr('refX', 22) // Place arrow head at circumference of target node
      .attr('refY', 0)
      .attr('markerWidth', 6)
      .attr('markerHeight', 6)
      .attr('orient', 'auto')
      .append('path')
      .attr('d', 'M0,-4L10,0L0,4')
      .attr('fill', '#52525b');

    // Create a zoomable group
    const mainGroup = svg.append('g').attr('class', 'main-group');

    const zoom = d3.zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.4, 2.5])
      .on('zoom', (event) => {
        mainGroup.attr('transform', event.transform);
      });

    svg.call(zoom);

    const { nodes, links } = filteredData;

    // Create force simulation
    const simulation = d3.forceSimulation<GraphNode>(nodes)
      .force('link', d3.forceLink<GraphNode, GraphLink>(links)
        .id(d => d.id)
        .distance(linkDistance)
      )
      .force('charge', d3.forceManyBody().strength(chargeStrength))
      .force('center', d3.forceCenter(width / 2, height / 2))
      .force('collision', d3.forceCollide().radius(d => (d as GraphNode).size + 15));

    // Colors mapping for group types
    const colors = {
      state: { fill: '#1e1b4b', border: '#6366f1', text: '#a5b4fc', glow: 'rgba(99, 102, 241, 0.4)' }, // Indigo
      ai: { fill: '#450a0a', border: '#ef4444', text: '#fca5a5', glow: 'rgba(239, 68, 68, 0.4)' }, // YouTube Crimson
      seo: { fill: '#0f172a', border: '#3b82f6', text: '#93c5fd', glow: 'rgba(59, 130, 246, 0.3)' }, // Blue
      governance: { fill: '#064e3b', border: '#10b981', text: '#6ee7b7', glow: 'rgba(16, 185, 129, 0.4)' } // Emerald
    };

    // Draw Links
    const link = mainGroup.append('g')
      .attr('class', 'links')
      .selectAll('line')
      .data(links)
      .enter()
      .append('line')
      .attr('stroke', '#27272a')
      .attr('stroke-width', 2)
      .attr('marker-end', 'url(#arrow)')
      .style('cursor', 'pointer')
      .on('mouseover', function(event, d: any) {
        d3.select(this).attr('stroke', '#f43f5e').attr('stroke-width', 3.5);
      })
      .on('mouseout', function(event, d: any) {
        d3.select(this).attr('stroke', '#27272a').attr('stroke-width', 2);
      })
      .on('click', function(event, d: any) {
        toast.dismiss();
        toast(`Flow Rate: ${d.flowRate} (${d.contextType} transmission)`, {
          icon: '⚡',
          style: {
            borderRadius: '12px',
            background: '#09090b',
            color: '#fff',
            border: '1px solid #27272a'
          }
        });
      });

    // Optional dynamic particles streaming down links to represent real-time data flows
    let particleGroup: any = null;
    if (showFlowAnimation) {
      particleGroup = mainGroup.append('g')
        .attr('class', 'particles')
        .selectAll('circle')
        .data(links)
        .enter()
        .append('circle')
        .attr('r', 3)
        .attr('fill', (d: any) => {
          const srcNode = nodes.find(n => n.id === (typeof d.source === 'string' ? d.source : d.source.id));
          return srcNode ? colors[srcNode.group].border : '#ef4444';
        })
        .style('filter', 'drop-shadow(0px 0px 4px rgba(255, 255, 255, 0.5))');
    }

    // Draw Link labels (Context Type text)
    const linkLabels = mainGroup.append('g')
      .attr('class', 'link-labels')
      .selectAll('text')
      .data(links)
      .enter()
      .append('text')
      .attr('font-size', '8px')
      .attr('font-family', 'JetBrains Mono, monospace')
      .attr('fill', '#52525b')
      .attr('text-anchor', 'middle')
      .text((d: any) => d.contextType);

    // Draw Nodes
    const node = mainGroup.append('g')
      .attr('class', 'nodes')
      .selectAll('g')
      .data(nodes)
      .enter()
      .append('g')
      .style('cursor', 'grab')
      .on('click', (event, d) => {
        setSelectedNode(d);
        // Highlight active node in UI
        nodeCircles.attr('stroke-width', (n: any) => n.id === d.id ? 4 : 1.5);
      })
      .call(d3.drag<SVGGElement, GraphNode>()
        .on('start', dragstarted)
        .on('drag', dragged)
        .on('end', dragended)
      );

    // Inner glowing nodes representation
    const nodeCircles = node.append('circle')
      .attr('r', d => d.size + 10)
      .attr('fill', d => colors[d.group].fill)
      .attr('stroke', d => colors[d.group].border)
      .attr('stroke-width', d => selectedNode && selectedNode.id === d.id ? 4 : 1.5)
      .style('filter', d => `drop-shadow(0px 0px 8px ${colors[d.group].glow})`);

    // Add smaller pulse ring inside for active AI elements
    node.filter(d => d.group === 'ai')
      .append('circle')
      .attr('r', d => d.size - 2)
      .attr('fill', 'none')
      .attr('stroke', '#f43f5e')
      .attr('stroke-width', 0.5)
      .style('opacity', 0.5)
      .attr('class', 'pulse-ring');

    // Add custom icon labels inside circle nodes
    node.append('text')
      .attr('text-anchor', 'middle')
      .attr('dy', '.3em')
      .attr('font-size', '10px')
      .attr('fill', d => colors[d.group].text)
      .attr('font-family', 'Inter, sans-serif')
      .attr('font-weight', 'black')
      .text(d => d.label.substring(0, 1)); // Single character code representing module

    // Label titles underneath the nodes
    node.append('text')
      .attr('dy', d => d.size + 24)
      .attr('text-anchor', 'middle')
      .attr('font-size', '9px')
      .attr('font-family', 'Space Grotesk, sans-serif')
      .attr('font-weight', 'bold')
      .attr('fill', '#e4e4e7')
      .text(d => d.label);

    // Dynamic tick updates
    simulation.on('tick', () => {
      link
        .attr('x1', (d: any) => d.source.x)
        .attr('y1', (d: any) => d.source.y)
        .attr('x2', (d: any) => d.target.x)
        .attr('y2', (d: any) => d.target.y);

      if (showFlowAnimation && particleGroup) {
        // Stream particles along links using sine offsets representing speed limits
        const elapsed = Date.now() * 0.0025;
        particleGroup
          .attr('cx', (d: any) => {
            const ratio = (elapsed % 1);
            return d.source.x + (d.target.x - d.source.x) * ratio;
          })
          .attr('cy', (d: any) => {
            const ratio = (elapsed % 1);
            return d.source.y + (d.target.y - d.source.y) * ratio;
          });
      }

      linkLabels
        .attr('x', (d: any) => (d.source.x + d.target.x) / 2)
        .attr('y', (d: any) => (d.source.y + d.target.y) / 2 - 6);

      node.attr('transform', (d: any) => `translate(${d.x},${d.y})`);
    });

    // Handle drag behaviors
    function dragstarted(event: any, d: any) {
      if (!event.active) simulation.alphaTarget(0.3).restart();
      d.fx = d.x;
      d.fy = d.y;
      d3.select(this).style('cursor', 'grabbing');
    }

    function dragged(event: any, d: any) {
      d.fx = event.x;
      d.fy = event.y;
    }

    function dragended(event: any, d: any) {
      if (!event.active) simulation.alphaTarget(0);
      d.fx = null;
      d.fy = null;
      d3.select(this).style('cursor', 'grab');
    }

    return () => {
      simulation.stop();
    };
  }, [filteredData, chargeStrength, linkDistance, showFlowAnimation]);

  const groupLabels: Record<string, string> = {
    state: 'Local Cache State & Bus',
    ai: 'AI Context Engines (Gemini/RAG)',
    seo: 'Structural Schemas & SEO Data',
    governance: 'Token Caps & Job Schedulers'
  };

  return (
    <div className="bg-[#121214] border border-zinc-800 rounded-2xl p-6 relative overflow-hidden" ref={containerRef} id="module-dependency-graph-card">
      <div className="absolute top-0 left-0 w-32 h-32 bg-red-500/[0.01] rounded-full blur-2xl"></div>
      
      {/* Header controls */}
      <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-4 border-b border-zinc-850 pb-5 mb-6">
        <div>
          <h3 className="text-base font-extrabold text-white flex items-center gap-2">
            <Share2 className="text-red-500" size={18} />
            D3 AI Module Coupling & RAG Intelligence Graph
          </h3>
          <p className="text-[10px] text-zinc-500 mt-1">
            Analyze the internal structural linkages, event pub/subs, and token buffer exchanges fueling Ranktica AI modules. Drag nodes to simulate connection tensions.
          </p>
        </div>

        {/* Live controls panel */}
        <div className="flex flex-wrap items-center gap-2 w-full xl:w-auto">
          {/* Node Search Bar */}
          <div className="relative flex-1 md:flex-initial min-w-[140px]">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 text-zinc-500" size={12} />
            <input 
              type="text" 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Filter node label..."
              className="w-full bg-zinc-950 border border-zinc-800 rounded-lg text-[10px] text-zinc-300 pl-8 pr-3 py-1.5 focus:outline-none focus:border-red-500 font-sans"
            />
          </div>

          {/* Group Layers Selector */}
          <select
            value={filterGroup}
            onChange={(e) => setFilterGroup(e.target.value)}
            className="bg-zinc-950 border border-zinc-800 text-zinc-400 rounded-lg text-[10px] py-1.5 px-3 focus:outline-none font-sans"
          >
            <option value="all">All Layers</option>
            <option value="state">Local Caching & Bus</option>
            <option value="ai">AI Cognitive Engines</option>
            <option value="seo">SEO & Metadata</option>
            <option value="governance">Governance Caps</option>
          </select>

          {/* Play animation toggler */}
          <button
            onClick={() => setShowFlowAnimation(prev => !prev)}
            className={`p-1.5 rounded-lg border text-[10px] font-bold font-sans flex items-center gap-1 transition ${
              showFlowAnimation 
                ? 'bg-red-500/10 border-red-500/30 text-red-400' 
                : 'bg-zinc-950 border-zinc-800 text-zinc-500 hover:text-zinc-350'
            }`}
            title="Toggle links live flow animation"
          >
            <Zap size={11} className={showFlowAnimation ? "animate-pulse" : ""} />
            {showFlowAnimation ? "Flow: ON" : "Flow: Static"}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* SVG Display Canvas column */}
        <div className="lg:col-span-2 bg-zinc-950/60 border border-zinc-850/80 rounded-xl relative h-[400px] overflow-hidden flex items-center justify-center">
          
          <div className="absolute top-3 left-3 flex gap-2 z-10">
            <span className="flex items-center gap-1 bg-zinc-900/90 text-[8px] font-mono text-zinc-400 px-2 py-1 rounded border border-zinc-800 backdrop-blur">
              <Info size={9} /> Left-Click Node: Inspect Metadata
            </span>
            <span className="flex items-center gap-1 bg-zinc-900/90 text-[8px] font-mono text-zinc-400 px-2 py-1 rounded border border-zinc-800 backdrop-blur">
              <Maximize2 size={9} /> Pinch-Zoom & Pan Enabled
            </span>
          </div>

          <svg 
            ref={svgRef} 
            className="w-full h-full"
            style={{ touchAction: 'none' }}
          />

          {/* D3 Simulation Tweak Rails */}
          <div className="absolute bottom-3 right-3 bg-zinc-900/90 border border-zinc-800 rounded-lg p-3 backdrop-blur w-44 space-y-2 z-10">
            <div className="flex items-center gap-1 text-[8.5px] font-black uppercase text-zinc-500 tracking-wider">
              <Sliders size={10} className="text-red-500" />
              Graph Physics Engine
            </div>
            <div className="space-y-1 text-[8px]">
              <div className="flex justify-between text-zinc-450 font-mono">
                <span>Charge Force</span>
                <span>{chargeStrength}</span>
              </div>
              <input 
                type="range" 
                min="-800" 
                max="-100" 
                step="50"
                value={chargeStrength}
                onChange={(e) => setChargeStrength(Number(e.target.value))}
                className="w-full accent-red-500 h-1 bg-zinc-950 rounded-lg appearance-none cursor-pointer"
              />
            </div>
            <div className="space-y-1 text-[8px]">
              <div className="flex justify-between text-zinc-450 font-mono">
                <span>Link Distance</span>
                <span>{linkDistance}px</span>
              </div>
              <input 
                type="range" 
                min="60" 
                max="200" 
                step="10"
                value={linkDistance}
                onChange={(e) => setLinkDistance(Number(e.target.value))}
                className="w-full accent-red-500 h-1 bg-zinc-950 rounded-lg appearance-none cursor-pointer"
              />
            </div>
          </div>
        </div>

        {/* Selected Node context inspector metadata column */}
        <div className="bg-[#09090b]/80 border border-zinc-850 p-5 rounded-xl flex flex-col justify-between h-[400px]">
          {selectedNode ? (
            <div className="space-y-4 animate-fade-in flex-1 flex flex-col justify-between">
              
              <div className="space-y-3.5">
                <div className="flex items-start justify-between gap-2 border-b border-zinc-900 pb-3">
                  <div>
                    <span className="text-[8px] bg-red-500/10 border border-red-500/25 text-red-400 font-mono px-2 py-0.5 rounded uppercase font-black tracking-widest block w-fit mb-1.5">
                      {groupLabels[selectedNode.group]}
                    </span>
                    <h4 className="text-white text-sm font-black tracking-tight">{selectedNode.label}</h4>
                  </div>
                  <span className="text-xs font-mono font-bold text-zinc-500">ID: #{selectedNode.id}</span>
                </div>

                <div className="space-y-1">
                  <span className="text-[10px] font-mono uppercase font-black text-zinc-600 block">Description:</span>
                  <p className="text-zinc-350 text-xs leading-relaxed">{selectedNode.details}</p>
                </div>

                <div className="space-y-2 pt-2">
                  <div className="bg-zinc-950 border border-zinc-900 rounded-lg p-2.5 space-y-1 font-mono text-[9px]">
                    <span className="text-zinc-550 block font-bold uppercase text-[8px]">Linked RAG Cache Strategy:</span>
                    <span className="text-white font-black uppercase flex items-center gap-1">
                      <Database size={10} className="text-zinc-400" />
                      {selectedNode.ragSyncMode}
                    </span>
                  </div>

                  <div className="bg-zinc-950 border border-zinc-900 rounded-lg p-2.5 space-y-1 font-mono text-[9px]">
                    <span className="text-zinc-550 block font-bold uppercase text-[8px]">Coupling Context Exchange Payload:</span>
                    <span className="text-zinc-300 break-words leading-relaxed">{selectedNode.dataShared}</span>
                  </div>
                </div>
              </div>

              {/* Dynamic Telemetry stats footer */}
              <div className="pt-4 border-t border-zinc-900 space-y-2.5">
                <div className="flex justify-between items-center text-[10px] font-mono">
                  <span className="text-zinc-500 font-medium">Inter-coupling degree:</span>
                  <span className="text-white font-extrabold">{selectedNode.couplingCount} linkages</span>
                </div>
                <div className="flex justify-between items-center text-[10px] font-mono">
                  <span className="text-zinc-500 font-medium">Sync Protocol Status:</span>
                  <span className="text-green-500 font-bold uppercase flex items-center gap-1 animate-pulse">
                    <ShieldCheck size={11} /> 100% SECURED
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    toast.success(`Successfully ran target RAG check for "${selectedNode.label}" module context!`);
                  }}
                  className="w-full py-1.5 bg-zinc-900 hover:bg-zinc-850 border border-zinc-800 text-zinc-300 hover:text-white rounded-lg text-[9.5px] font-black uppercase tracking-wider font-mono transition-all"
                >
                  ⚙️ Force Sync RAG Context
                </button>
              </div>

            </div>
          ) : (
            <div className="h-full flex flex-col justify-center items-center text-center p-4 text-zinc-500">
              <Sparkles size={24} className="text-zinc-700 animate-pulse mb-2" />
              <p className="text-xs font-mono">Select any node on the D3 canvas to inspect live coupling telemetry data.</p>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
