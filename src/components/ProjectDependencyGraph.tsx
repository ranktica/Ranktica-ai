import React, { useState, useEffect, useRef } from 'react';
import { Project } from '@/shared/types';
import { X, Plus, ChevronRight, Zap, Target, Trash2, Edit2, Link } from 'lucide-react';
import { toast } from 'react-hot-toast';

interface ProjectDependencyGraphProps {
  projects: Project[];
  updateProject: (id: string, updates: Partial<Project>) => Promise<void>;
  folders: { id: string; name: string; color?: string }[];
  onEditProject?: (p: Project) => void;
}

export const ProjectDependencyGraph: React.FC<ProjectDependencyGraphProps> = ({
  projects,
  updateProject,
  folders,
  onEditProject
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  
  // Local state for dragging nodes
  const [positions, setPositions] = useState<Record<string, { x: number; y: number }>>(() => {
    try {
      const saved = localStorage.getItem('ranktica-dependency-graph-positions-v1');
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });

  // Track dragging of a node
  const [draggingNodeId, setDraggingNodeId] = useState<string | null>(null);
  const dragStartOffset = useRef({ x: 0, y: 0 });

  // Track dragging of a new connection laser
  const [connectingSourceId, setConnectingSourceId] = useState<string | null>(null);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [hoveredTargetId, setHoveredTargetId] = useState<string | null>(null);

  // Selected node for info panel
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);

  // Sync positions to local storage
  useEffect(() => {
    if (Object.keys(positions).length > 0) {
      localStorage.setItem('ranktica-dependency-graph-positions-v1', JSON.stringify(positions));
    }
  }, [positions]);

  // Set default initial position layout (circular or staggered) for any projects without coordinates
  useEffect(() => {
    let changed = false;
    const newPositions = { ...positions };
    const width = containerRef.current?.clientWidth || 800;
    const height = containerRef.current?.clientHeight || 500;
    
    projects.forEach((proj, index) => {
      if (!newPositions[proj.id]) {
        // Circle layout
        const angle = (index / (projects.length || 1)) * 2 * Math.PI;
        const radius = Math.min(width, height) * 0.35;
        newPositions[proj.id] = {
          x: Math.round(width / 2 + radius * Math.cos(angle)),
          y: Math.round(height / 2 + radius * Math.sin(angle))
        };
        changed = true;
      }
    });

    if (changed) {
      setPositions(newPositions);
    }
  }, [projects]);

  // Handle dragging nodes
  const handleNodeMouseDown = (e: React.MouseEvent, id: string) => {
    // Left-click only
    if (e.button !== 0) return;
    const element = e.currentTarget.getBoundingClientRect();
    const container = containerRef.current?.getBoundingClientRect();
    if (!container) return;

    // Offsets are relative to the node coordinate
    const nodeX = positions[id]?.x || 100;
    const nodeY = positions[id]?.y || 100;
    const clickX = e.clientX - container.left;
    const clickY = e.clientY - container.top;

    dragStartOffset.current = {
      x: clickX - nodeX,
      y: clickY - nodeY
    };

    setDraggingNodeId(id);
    setSelectedNodeId(id);
    e.stopPropagation();
  };

  // Drag connector start
  const handleConnectorMouseDown = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    e.preventDefault();
    const container = containerRef.current?.getBoundingClientRect();
    if (!container) return;

    const clickX = e.clientX - container.left;
    const clickY = e.clientY - container.top;

    setConnectingSourceId(id);
    setMousePos({ x: clickX, y: clickY });
    setHoveredTargetId(null);
  };

  // Tracking mouse movements for drag/connect
  const handleMouseMove = (e: React.MouseEvent) => {
    const container = containerRef.current?.getBoundingClientRect();
    if (!container) return;

    const x = e.clientX - container.left;
    const y = e.clientY - container.top;

    if (draggingNodeId) {
      // Move Node
      setPositions(prev => ({
        ...prev,
        [draggingNodeId]: {
          x: Math.min(Math.max(x - dragStartOffset.current.x, 30), container.width - 30),
          y: Math.min(Math.max(y - dragStartOffset.current.y, 30), container.height - 30)
        }
      }));
    } else if (connectingSourceId) {
      // Update trace laser position
      setMousePos({ x, y });
    }
  };

  // Mouse up triggers connection drop or stops dragging
  const handleMouseUp = async (e: React.MouseEvent) => {
    if (draggingNodeId) {
      setDraggingNodeId(null);
    }

    if (connectingSourceId) {
      if (hoveredTargetId && hoveredTargetId !== connectingSourceId) {
        // Add dependency relation
        const sourceProj = projects.find(p => p.id === connectingSourceId);
        if (sourceProj) {
          const currentDeps = sourceProj.dependencies || [];
          if (currentDeps.includes(hoveredTargetId)) {
            toast.error("Relationship link already established.");
          } else {
            // Check that it doesn't cause a direct cycle for simplicity, or just set it
            const updatedDeps = [...currentDeps, hoveredTargetId];
            await updateProject(connectingSourceId, { dependencies: updatedDeps });
            toast.success(`Connected "${sourceProj.title}" -> "${projects.find(p => p.id === hoveredTargetId)?.title || ''}"`);
          }
        }
      }
      setConnectingSourceId(null);
      setHoveredTargetId(null);
    }
  };

  // Remove individual dependency link
  const handleRemoveDependency = async (sourceId: string, targetId: string) => {
    const sourceProj = projects.find(p => p.id === sourceId);
    if (sourceProj) {
      const updatedDeps = (sourceProj.dependencies || []).filter(id => id !== targetId);
      await updateProject(sourceId, { dependencies: updatedDeps });
      toast.success("Relationship link removed successfully.");
    }
  };

  // Helper to get collection/folder details
  const getFolderDetails = (p: Project) => {
    if (!p.folderId) return null;
    return folders.find(f => f.id === p.folderId) || null;
  };

  const selectedProj = projects.find(p => p.id === selectedNodeId);

  // Autolayout button triggers automatic force-like distribution
  const triggerAutoLayout = () => {
    const width = containerRef.current?.clientWidth || 800;
    const height = containerRef.current?.clientHeight || 500;
    const n = projects.length;
    if (n === 0) return;

    const newPositions: Record<string, { x: number; y: number }> = {};
    const cols = Math.ceil(Math.sqrt(n));
    const rows = Math.ceil(n / cols);
    const cellW = width / (cols + 1);
    const cellH = height / (rows + 1);

    projects.forEach((proj, idx) => {
      const r = Math.floor(idx / cols);
      const c = idx % cols;
      newPositions[proj.id] = {
        x: Math.round(cellW * (c + 1) + (Math.random() * 20 - 10)),
        y: Math.round(cellH * (r + 1) + (Math.random() * 20 - 10))
      };
    });

    setPositions(newPositions);
    toast.success("Recalculated force grid layout positions.");
  };

  return (
    <div className="flex flex-col xl:flex-row gap-6 h-full min-h-[550px] font-sans">
      {/* Dynamic Graph Canvas */}
      <div 
        ref={containerRef}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        className="flex-1 bg-zinc-950 rounded-[2.5rem] border border-zinc-850 relative overflow-hidden select-none"
        style={{ height: '550px' }}
      >
        {/* Subtle decorative dot backdrop */}
        <div className="absolute inset-0 bg-[#0c0c0e] pointer-events-none opacity-40">
          <svg className="w-full h-full">
            <defs>
              <pattern id="grid-pattern" width="24" height="24" patternUnits="userSpaceOnUse">
                <circle cx="2" cy="2" r="1.2" fill="#2d2d30" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#grid-pattern)" />
          </svg>
        </div>

        {/* Toolbar panel overlays */}
        <div className="absolute top-5 left-5 z-10 flex gap-2">
          <button
            type="button"
            onClick={triggerAutoLayout}
            className="bg-zinc-90 w bg-opacity-95 backdrop-blur-md hover:bg-zinc-800 text-zinc-300 hover:text-white px-3.5 py-2 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all border border-zinc-800 cursor-pointer"
          >
            Auto Space Nodes
          </button>
        </div>

        <div className="absolute top-5 right-5 z-10 bg-zinc-900/90 border border-zinc-850 px-3.5 py-2.5 rounded-2xl text-[9px] font-bold text-zinc-400 max-w-xs space-y-1 backdrop-blur pointer-events-none">
          <p className="text-zinc-300 font-extrabold uppercase tracking-widest flex items-center gap-1">
            <Zap size={10} className="text-yellow-500" /> Interactive Canvas Help
          </p>
          <p>• Move node: Drag the node bubble or tile</p>
          <p>• Establish link: Drag from the <span className="text-purple-400 font-black">+</span> anchor to target node</p>
          <p>• Delete relationship: Click the <span className="text-red-400 font-black">x</span> center dot on vector links</p>
        </div>

        {/* SVG Drawing Canvas - holds dependencies & connections */}
        <svg className="absolute inset-0 w-full h-full pointer-events-none">
          <defs>
            {/* Triangular arrow definition for links */}
            <marker
              id="arrow"
              viewBox="0 0 10 10"
              refX="18"
              refY="5"
              markerWidth="7"
              markerHeight="7"
              orient="auto-start-reverse"
            >
              <path d="M 0 1 L 10 5 L 0 9 z" fill="#71717a" />
            </marker>
            <marker
              id="active-arrow"
              viewBox="0 0 10 10"
              refX="18"
              refY="5"
              markerWidth="8"
              markerHeight="8"
              orient="auto-start-reverse"
            >
              <path d="M 0 1 L 10 5 L 0 9 z" fill="#a855f7" />
            </marker>
          </defs>

          {/* Render established dependency links */}
          {projects.map(proj => {
            const fromPos = positions[proj.id];
            if (!fromPos || !proj.dependencies) return null;

            return proj.dependencies.map(depId => {
              const toPos = positions[depId];
              if (!toPos) return null;

              // Check if currently selected or hovered to light up vector paths
              const isSelectedPath = selectedNodeId === proj.id || selectedNodeId === depId;
              const pathColor = isSelectedPath ? '#a855f7' : '#3f3f46';
              const strokeWidth = isSelectedPath ? 2.5 : 1.25;

              // Calculate middle point for hover control panel
              const midX = (fromPos.x + toPos.x) / 2;
              const midY = (fromPos.y + toPos.y) / 2;

              return (
                <g key={`${proj.id}-${depId}`} className="pointer-events-auto cursor-default">
                  {/* Real visual line with markers */}
                  <line
                    x1={fromPos.x}
                    y1={fromPos.y}
                    x2={toPos.x}
                    y2={toPos.y}
                    stroke={pathColor}
                    strokeWidth={strokeWidth}
                    strokeDasharray={isSelectedPath ? "none" : "3,3"}
                    markerEnd={`url(#${isSelectedPath ? 'active-arrow' : 'arrow'})`}
                    className="transition-all duration-300"
                  />
                  {/* Collision helper line (easier cursor grabbing) */}
                  <line
                    x1={fromPos.x}
                    y1={fromPos.y}
                    x2={toPos.x}
                    y2={toPos.y}
                    stroke="transparent"
                    strokeWidth={15}
                    className="hover:stroke-purple-500/10 cursor-pointer"
                  />
                  {/* Delete connection overlay bullet */}
                  <foreignObject
                    x={midX - 10}
                    y={midY - 10}
                    width={20}
                    height={20}
                    className="overflow-visible pointer-events-auto"
                  >
                    <button
                      type="button"
                      onClick={() => handleRemoveDependency(proj.id, depId)}
                      className="w-5 h-5 bg-zinc-900 border border-zinc-800 text-zinc-500 hover:text-red-400 hover:border-red-500/30 rounded-full flex items-center justify-center transition-all cursor-pointer shadow-lg"
                      title="Destroy relationship link"
                    >
                      <X size={10} />
                    </button>
                  </foreignObject>
                </g>
              );
            });
          })}

          {/* Active drawing laser tracing current dragging relation setup */}
          {connectingSourceId && positions[connectingSourceId] && (
            <line
              x1={positions[connectingSourceId].x}
              y1={positions[connectingSourceId].y}
              x2={mousePos.x}
              y2={mousePos.y}
              stroke="#c084fc"
              strokeWidth={2}
              strokeDasharray="4,4"
              className="animate-pulse"
            />
          )}
        </svg>

        {/* Project nodes positioned explicitly */}
        {projects.map(proj => {
          const pos = positions[proj.id];
          if (!pos) return null;

          const isSelected = selectedNodeId === proj.id;
          const isDrawingTarget = connectingSourceId !== null && connectingSourceId !== proj.id;
          const isDrawMatch = hoveredTargetId === proj.id;
          const folderObj = getFolderDetails(proj);

          // Resolve status colors
          let statusColors = 'border-zinc-800 bg-zinc-900/90 text-zinc-300';
          if (proj.status === 'scheduled') statusColors = 'border-purple-500 bg-purple-950/20 text-purple-200';
          else if (proj.status === 'production') statusColors = 'border-orange-500 bg-orange-950/20 text-orange-200';
          else if (proj.status === 'scripting') statusColors = 'border-blue-500 bg-blue-950/20 text-blue-200';
          else if (proj.status === 'published') statusColors = 'border-green-500 bg-green-950/20 text-green-200';

          return (
            <div
              key={proj.id}
              style={{
                position: 'absolute',
                left: `${pos.x}px`,
                top: `${pos.y}px`,
                transform: 'translate(-50%, -50%)',
              }}
              onMouseDown={(e) => handleNodeMouseDown(e, proj.id)}
              onMouseEnter={() => {
                if (connectingSourceId && connectingSourceId !== proj.id) {
                  setHoveredTargetId(proj.id);
                }
              }}
              onMouseLeave={() => {
                if (connectingSourceId && hoveredTargetId === proj.id) {
                  setHoveredTargetId(null);
                }
              }}
              className={`w-48 p-4 rounded-2xl border transition-all duration-200 cursor-grab active:cursor-grabbing z-20 ${
                isSelected 
                  ? 'border-purple-500 scale-105 shadow-2xl ring-2 ring-purple-500/20' 
                  : isDrawMatch 
                    ? 'border-yellow-500 ring-2 ring-yellow-500/40 scale-105 bg-zinc-900 animate-pulse'
                    : isDrawingTarget
                      ? 'border-zinc-700/60 opacity-60'
                      : 'hover:border-zinc-700'
              } ${statusColors}`}
            >
              <div className="flex justify-between items-start gap-1">
                {folderObj ? (
                  <span 
                    className="text-[8px] font-black uppercase px-2 py-0.5 rounded-md truncate max-w-[90px]"
                    style={{ backgroundColor: `${folderObj.color || '#ef4444'}15`, color: folderObj.color || '#ef4444', border: `1px solid ${folderObj.color || '#ef4444'}30` }}
                  >
                    {folderObj.name}
                  </span>
                ) : (
                  <span className="text-[7px] font-black uppercase text-zinc-650 bg-zinc-950 border border-zinc-800 px-1.5 py-0.5 rounded-md">
                    Unorganized
                  </span>
                )}
                
                {/* Drag Link handle node */}
                <button
                  type="button"
                  onMouseDown={(e) => handleConnectorMouseDown(e, proj.id)}
                  className="w-4 h-4 bg-zinc-950 hover:bg-purple-600 border border-zinc-800 hover:border-purple-400 rounded-full flex items-center justify-center text-zinc-500 hover:text-white transition-colors cursor-crosshair ml-auto shrink-0"
                  title="Drag and drop to associate dependencies"
                >
                  <Plus size={8} />
                </button>
              </div>

              <h5 className="text-xs font-black truncate text-white mt-1.5 leading-snug">{proj.title}</h5>
              <div className="flex justify-between items-center text-[9px] text-zinc-400 mt-2">
                <span className="capitalize font-mono opacity-80">{proj.status}</span>
                {proj.dependencies && proj.dependencies.length > 0 && (
                  <span className="text-zinc-500 font-mono text-[8px] uppercase">
                    🔗 {proj.dependencies.length} Dep(s)
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Right side inspect details panel */}
      <div className="w-full xl:w-72 bg-zinc-900/60 border border-zinc-850 rounded-[2.5rem] p-6 flex flex-col justify-between shrink-0">
        {selectedProj ? (
          <div className="space-y-6 flex-1 flex flex-col justify-between">
            <div>
              <span className="text-[9px] font-black tracking-widest text-purple-400 uppercase font-mono block mb-1">
                Workspace Inspect Matrix
              </span>
              <h4 className="text-xl font-extrabold text-white leading-tight tracking-tight mb-2">
                {selectedProj.title}
              </h4>
              
              <div className="flex flex-wrap gap-2 mb-4">
                <span className="text-[8px] font-mono font-black uppercase px-2 py-0.5 rounded bg-zinc-950 border border-zinc-800 text-zinc-400">
                  {selectedProj.status}
                </span>
                <span className="text-[8px] font-mono font-bold px-2 py-0.5 rounded bg-zinc-950 border border-zinc-800 text-zinc-400">
                  {selectedProj.niche}
                </span>
              </div>

              <div className="bg-zinc-950 p-4 rounded-2xl border border-zinc-850/60 text-xs text-zinc-400 leading-relaxed font-semibold h-24 overflow-y-auto no-scrollbar mb-4">
                {selectedProj.description || "No project detailed description notes written yet."}
              </div>

              {/* Dependencies listing section */}
              <div className="space-y-2">
                <span className="text-[9px] font-black tracking-wider text-zinc-550 uppercase font-mono block">
                  Dependencies (Blockers):
                </span>
                {selectedProj.dependencies && selectedProj.dependencies.length > 0 ? (
                  <div className="space-y-1.5 max-h-[120px] overflow-y-auto pr-1">
                    {selectedProj.dependencies.map(depId => {
                      const dep = projects.find(p => p.id === depId);
                      return (
                        <div key={depId} className="flex justify-between items-center text-xs bg-zinc-950/60 p-2 rounded-xl border border-zinc-850/50">
                          <span className="truncate text-white font-bold max-w-[160px]">
                            {dep ? dep.title : `Lost workspace: ${depId}`}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleRemoveDependency(selectedProj.id, depId)}
                            className="text-zinc-650 hover:text-red-400 transition-colors cursor-pointer"
                            title="Unlink dependency"
                          >
                            <X size={12} />
                          </button>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <p className="text-[10px] text-zinc-550 font-medium italic mt-1 font-mono">
                    No blockers. Runs independently!
                  </p>
                )}
              </div>
            </div>

            <div className="pt-4 border-t border-zinc-850 shrink-0">
              <div className="flex gap-2">
                {onEditProject && (
                  <button
                    type="button"
                    onClick={() => onEditProject(selectedProj)}
                    className="flex-1 bg-zinc-950 hover:bg-zinc-900 text-zinc-300 hover:text-white px-4 py-2.5 rounded-xl text-xs uppercase tracking-wider transition-all border border-zinc-850 flex items-center justify-center gap-1.5 font-bold cursor-pointer"
                  >
                    <Edit2 size={11} /> Settings
                  </button>
                )}
              </div>
            </div>
          </div>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-center py-10 text-zinc-600 font-mono">
            <Link size={20} className="mb-2 opacity-30 text-purple-400 animate-pulse" />
            <p className="text-[9px] font-black tracking-widest uppercase mb-1">Target Selection Void</p>
            <p className="text-[9px] text-zinc-500 font-sans font-semibold leading-relaxed max-w-[180px]">
              Click or drag any workspace node bubble to populate live inspection telemetry models.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
