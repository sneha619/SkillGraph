import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { GraphOverviewData, GraphNode, GraphLink } from '../../types';
import { ZoomIn, ZoomOut, Maximize2, Layers, User, Code2, FolderGit2, Building2 } from 'lucide-react';

const TYPE_COLORS: Record<string, string> = {
  Developer: '#10B981',
  Skill: '#3B82F6',
  Project: '#8B5CF6',
  Company: '#F59E0B',
  Domain: '#EC4899',
};

const TYPE_ICONS: Record<string, React.ReactNode> = {
  Developer: <User className="w-3 h-3" />,
  Skill: <Code2 className="w-3 h-3" />,
  Project: <FolderGit2 className="w-3 h-3" />,
  Company: <Building2 className="w-3 h-3" />,
};

const LINK_STYLES: Record<string, { stroke: string; dash?: string; arrow?: string; directional?: boolean }> = {
  REQUIRES:   { stroke: '#F59E0B', dash: undefined, arrow: 'url(#arrow-requires)',  directional: true },
  RELATED_TO: { stroke: '#8B5CF6', dash: '4 3',     arrow: 'url(#arrow-related)',   directional: true },
  KNOWS_SKILL:{ stroke: '#10B981', dash: undefined, directional: false },
  WORKS_AT:   { stroke: '#F59E0B', dash: '3 2',     directional: false },
  WORKED_ON:  { stroke: '#A78BFA', dash: '2 3',     directional: false },
  USES_SKILL: { stroke: '#3B82F6', dash: undefined, directional: false },
};

const NODE_RADIUS = 20;

interface LayoutNode extends GraphNode {
  x: number;
  y: number;
  vx: number;
  vy: number;
  degree: number;
}

interface InteractiveGraphProps {
  data: GraphOverviewData;
  height?: number;
  onNodeClick?: (node: GraphNode) => void;
  showControls?: boolean;
  title?: string;
  /** When set, centers + focuses the graph around this entity id (detail pages). */
  focusNodeId?: string;
}

export const InteractiveGraph: React.FC<InteractiveGraphProps> = ({
  data,
  height = 480,
  onNodeClick,
  showControls = true,
  title,
  focusNodeId,
}) => {
  const navigate = useNavigate();
  const containerRef = useRef<HTMLDivElement>(null);
  const [containerSize, setContainerSize] = useState({ width: 800, height });

  const [viewBox, setViewBox] = useState({ x: -400, y: -240, w: 800, h: 480 });
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [hoveredNodeId, setHoveredNodeId] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const dragStart = useRef({ x: 0, y: 0, vx: 0, vy: 0 });
  const hasFitted = useRef(false);

  // --- Layout: dynamic force-directed + center/fit to viewport --------------------
  const layoutNodes = useMemo(() => {
    const nodes: LayoutNode[] = data.nodes.map((n) => ({
      ...n,
      x: (Math.random() - 0.5) * 40,
      y: (Math.random() - 0.5) * 40,
      vx: 0,
      vy: 0,
      degree: 0,
    }));

    const N = nodes.length;
    if (N === 0) return [];

    const nodeMap = new Map<string, LayoutNode>();
    nodes.forEach((n) => nodeMap.set(n.id, n));

    // Degree for centrality / radial seed
    const degreeMap = new Map<string, number>();
    for (const l of data.links) {
      const s = String(l.source);
      const t = String(l.target);
      degreeMap.set(s, (degreeMap.get(s) || 0) + 1);
      degreeMap.set(t, (degreeMap.get(t) || 0) + 1);
    }
    nodes.forEach((n) => (n.degree = degreeMap.get(n.id) || 0));

    // 1) Seed: radial layout ordered by type, avoids clumping
    const typeGroups = new Map<string, LayoutNode[]>();
    for (const n of nodes) {
      const t = n.type || 'Other';
      if (!typeGroups.has(t)) typeGroups.set(t, []);
      typeGroups.get(t)!.push(n);
    }
    const groups = Array.from(typeGroups.entries());
    const groupAngle = (2 * Math.PI) / Math.max(groups.length, 1);
    // Scale radius with node count so more nodes spread further naturally
    const baseRadius = Math.max(60, 40 + Math.sqrt(N) * 14);

    groups.forEach(([, gnodes], gi) => {
      const gcx = Math.cos(groupAngle * gi + Math.PI / groups.length) * baseRadius;
      const gcy = Math.sin(groupAngle * gi + Math.PI / groups.length) * baseRadius;
      const m = gnodes.length;
      const innerR = m <= 1 ? 0 : Math.max(26, Math.sqrt(m) * 14);
      gnodes.forEach((n, ni) => {
        const a = (2 * Math.PI * ni) / Math.max(m, 1);
        n.x = gcx + Math.cos(a) * innerR;
        n.y = gcy + Math.sin(a) * innerR;
      });
    });

    // 2) Force-directed simulation
    //    Tuned for small-to-medium graphs (10-80 nodes); scales with N.
    const adjacency: Map<string, Set<string>> = new Map();
    for (const l of data.links) {
      const s = String(l.source);
      const t = String(l.target);
      if (!adjacency.has(s)) adjacency.set(s, new Set());
      if (!adjacency.has(t)) adjacency.set(t, new Set());
      adjacency.get(s)!.add(t);
      adjacency.get(t)!.add(s);
    }

    const minDistance = NODE_RADIUS * 2.8;
    const preferredEdge = Math.max(minDistance + 14, 56 + Math.sqrt(N) * 3);
    const iterations = Math.max(120, 200 - N * 2); // fewer iters for huge graphs
    const coolingStart = 0.55;
    const coolingEnd = 0.02;

    for (let iter = 0; iter < iterations; iter++) {
      const t = coolingStart * Math.pow(coolingEnd / coolingStart, iter / Math.max(iterations - 1, 1));

      // Repulsion: all pairs (O(n^2) but n<=~80 for overview, good enough)
      for (let i = 0; i < N; i++) {
        for (let j = i + 1; j < N; j++) {
          const a = nodes[i];
          const b = nodes[j];
          let dx = b.x - a.x;
          let dy = b.y - a.y;
          let dist2 = dx * dx + dy * dy;
          if (dist2 < 0.01) {
            dx = (Math.random() - 0.5) * 0.1;
            dy = (Math.random() - 0.5) * 0.1;
            dist2 = dx * dx + dy * dy;
          }
          const dist = Math.sqrt(dist2);
          // Coulomb-like repulsion (stronger up close)
          const repulsion = (preferredEdge * preferredEdge) / dist2;
          const fx = (dx / dist) * repulsion;
          const fy = (dy / dist) * repulsion;
          a.vx -= fx * t;
          a.vy -= fy * t;
          b.vx += fx * t;
          b.vy += fy * t;
        }
      }

      // Attraction: linked nodes
      for (const l of data.links) {
        const s = nodeMap.get(String(l.source));
        const tNode = nodeMap.get(String(l.target));
        if (!s || !tNode) continue;
        const dx = tNode.x - s.x;
        const dy = tNode.y - s.y;
        const dist = Math.sqrt(dx * dx + dy * dy) || 0.001;
        const diff = dist - preferredEdge;
        // Spring force
        const k = 0.03;
        const fx = (dx / dist) * diff * k;
        const fy = (dy / dist) * diff * k;
        s.vx += fx * t;
        s.vy += fy * t;
        tNode.vx -= fx * t;
        tNode.vy -= fy * t;
      }

      // Gravity toward center (prevents drift)
      const gravity = 0.004 * t;
      for (let i = 0; i < N; i++) {
        const n = nodes[i];
        n.vx -= n.x * gravity;
        n.vy -= n.y * gravity;
      }

      // Integrate + clamp separation
      for (let i = 0; i < N; i++) {
        const n = nodes[i];
        // Velocity damping
        n.vx *= 0.82;
        n.vy *= 0.82;
        n.x += n.vx;
        n.y += n.vy;
      }

      // Hard pairwise min-distance enforcement (final polish, few iters -> cheap)
      for (let i = 0; i < N; i++) {
        for (let j = i + 1; j < N; j++) {
          const a = nodes[i];
          const b = nodes[j];
          const dx = b.x - a.x;
          const dy = b.y - a.y;
          const d2 = dx * dx + dy * dy;
          const min2 = minDistance * minDistance;
          if (d2 < min2 && d2 > 0) {
            const d = Math.sqrt(d2);
            const overlap = (minDistance - d) * 0.5;
            const ox = (dx / d) * overlap;
            const oy = (dy / d) * overlap;
            a.x -= ox;
            a.y -= oy;
            b.x += ox;
            b.y += oy;
          }
        }
      }
    }

    // 3) Focus: if a focus node is provided (detail pages), pull it to center and
    //    arrange neighbors concentrically around it.
    if (focusNodeId && nodeMap.has(focusNodeId)) {
      const focus = nodeMap.get(focusNodeId)!;
      const fx0 = focus.x;
      const fy0 = focus.y;

      // Translate entire graph so focus is origin
      for (const n of nodes) {
        n.x -= fx0;
        n.y -= fy0;
      }

      // Sort neighbors by type for a cleaner concentric layout
      const neighbors = new Set<string>();
      for (const l of data.links) {
        const s = String(l.source);
        const t = String(l.target);
        if (s === focusNodeId) neighbors.add(t);
        if (t === focusNodeId) neighbors.add(s);
      }
      const neighborNodes = nodes.filter((n) => neighbors.has(n.id));
      const otherNodes = nodes.filter((n) => n.id !== focusNodeId && !neighbors.has(n.id));

      // Place focus at exact center
      focus.x = 0;
      focus.y = 0;

      const nn = neighborNodes.length;
      const ringR = Math.max(90, NODE_RADIUS * 4 + nn * 2);
      neighborNodes.forEach((n, i) => {
        const a = (2 * Math.PI * i) / Math.max(nn, 1) - Math.PI / 2;
        n.x = Math.cos(a) * ringR + (Math.random() - 0.5) * 6;
        n.y = Math.sin(a) * ringR + (Math.random() - 0.5) * 6;
      });

      const on2 = otherNodes.length;
      const outerR = ringR + Math.max(80, on2 * 1.8 + 50);
      otherNodes.forEach((n, i) => {
        const a = (2 * Math.PI * i) / Math.max(on2, 1);
        n.x = Math.cos(a) * outerR;
        n.y = Math.sin(a) * outerR;
      });

      // Light polish pass on focused layout
      for (let iter = 0; iter < 40; iter++) {
        for (let i = 0; i < N; i++) {
          for (let j = i + 1; j < N; j++) {
            const a = nodes[i];
            const b = nodes[j];
            const dx = b.x - a.x;
            const dy = b.y - a.y;
            const d2 = dx * dx + dy * dy;
            const min2 = minDistance * minDistance;
            if (d2 < min2 && d2 > 0) {
              const d = Math.sqrt(d2);
              const overlap = (minDistance - d) * 0.5;
              const ox = (dx / d) * overlap;
              const oy = (dy / d) * overlap;
              if (a.id !== focusNodeId) {
                a.x -= ox;
                a.y -= oy;
              }
              if (b.id !== focusNodeId) {
                b.x += ox;
                b.y += oy;
              }
            }
          }
        }
      }
    }

    return nodes;
  }, [data.nodes, data.links, focusNodeId]);

  // Compute bounding box of layout and set viewBox to center + fit with padding
  const nodeMap = useMemo(() => {
    const m = new Map<string, LayoutNode>();
    for (const n of layoutNodes) m.set(n.id, n);
    return m;
  }, [layoutNodes]);

  // Fit viewbox once whenever layout changes
  useEffect(() => {
    if (layoutNodes.length === 0 || containerSize.width <= 0) return;
    hasFitted.current = false;
    // Fit in next microtask so sizes are settled
    const frame = requestAnimationFrame(() => {
      if (containerRef.current) {
        const w = containerRef.current.clientWidth || containerSize.width;
        setContainerSize((s) => ({ ...s, width: w }));
      }
      let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
      for (const n of layoutNodes) {
        if (n.x < minX) minX = n.x;
        if (n.y < minY) minY = n.y;
        if (n.x > maxX) maxX = n.x;
        if (n.y > maxY) maxY = n.y;
      }
      const pad = NODE_RADIUS * 3 + 40;
      minX -= pad; minY -= pad; maxX += pad; maxY += pad;
      const bw = Math.max(200, maxX - minX);
      const bh = Math.max(160, maxY - minY);
      const viewW = containerSize.width;
      const viewH = containerSize.height;
      const aspect = viewW / Math.max(viewH, 1);
      let h = bh;
      let w = bh * aspect;
      if (w < bw) {
        w = bw;
        h = bw / aspect;
      }
      const cx = (minX + maxX) / 2;
      const cy = (minY + maxY) / 2;
      setViewBox({ x: cx - w / 2, y: cy - h / 2, w, h });
      hasFitted.current = true;
    });
    return () => cancelAnimationFrame(frame);
  }, [layoutNodes, containerSize.height]); // eslint-disable-line react-hooks/exhaustive-deps

  // Container sizing + responsive
  useEffect(() => {
    if (!containerRef.current) return;
    const updateSize = () => {
      const w = containerRef.current?.clientWidth || 800;
      setContainerSize({ width: w, height });
    };
    updateSize();
    const ro = new ResizeObserver(updateSize);
    ro.observe(containerRef.current);
    window.addEventListener('resize', updateSize);
    return () => {
      ro.disconnect();
      window.removeEventListener('resize', updateSize);
    };
  }, [height]);

  const activeNodeId = selectedNodeId || hoveredNodeId;

  const connectedSet = useMemo(() => {
    if (!activeNodeId) return null;
    const set = new Set<string>([activeNodeId]);
    for (const link of data.links) {
      if (String(link.source) === activeNodeId) set.add(String(link.target));
      if (String(link.target) === activeNodeId) set.add(String(link.source));
    }
    return set;
  }, [activeNodeId, data.links]);

  const handleNodeClick = useCallback(
    (node: GraphNode, e: React.MouseEvent) => {
      e.stopPropagation();
      if (onNodeClick) {
        onNodeClick(node);
      } else {
        if (node.type === 'Developer') navigate(`/developers/${encodeURIComponent(node.name)}`);
        else if (node.type === 'Skill') navigate(`/skills/${encodeURIComponent(node.name)}`);
      }
      setSelectedNodeId((prev) => (prev === node.id ? null : node.id));
    },
    [navigate, onNodeClick]
  );

  const handleBackgroundMouseDown = (e: React.MouseEvent) => {
    const target = e.target as SVGElement;
    if (target.tagName === 'svg' || target.classList.contains('graph-bg')) {
      setIsDragging(true);
      dragStart.current = { x: e.clientX, y: e.clientY, vx: viewBox.x, vy: viewBox.y };
    }
  };
  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragging) {
      const dx = (e.clientX - dragStart.current.x) * (viewBox.w / containerSize.width);
      const dy = (e.clientY - dragStart.current.y) * (viewBox.h / containerSize.height);
      setViewBox((v) => ({ ...v, x: dragStart.current.vx - dx, y: dragStart.current.vy - dy }));
    }
  };
  const handleMouseUp = () => setIsDragging(false);

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const factor = e.deltaY > 0 ? 1.15 : 0.87;
    const newW = Math.max(200, Math.min(3000, viewBox.w * factor));
    const newH = Math.max(120, Math.min(1800, viewBox.h * factor));
    setViewBox((v) => ({
      x: v.x + (v.w - newW) / 2,
      y: v.y + (v.h - newH) / 2,
      w: newW,
      h: newH,
    }));
  };

  const zoom = (factor: number) => {
    const newW = Math.max(200, Math.min(3000, viewBox.w * factor));
    const newH = Math.max(120, Math.min(1800, viewBox.h * factor));
    setViewBox((v) => ({
      x: v.x + (v.w - newW) / 2,
      y: v.y + (v.h - newH) / 2,
      w: newW,
      h: newH,
    }));
  };

  const resetView = () => {
    setSelectedNodeId(null);
    if (layoutNodes.length === 0) {
      setViewBox({
        x: -containerSize.width / 2,
        y: -containerSize.height / 2,
        w: containerSize.width,
        h: containerSize.height,
      });
      return;
    }
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    for (const n of layoutNodes) {
      if (n.x < minX) minX = n.x;
      if (n.y < minY) minY = n.y;
      if (n.x > maxX) maxX = n.x;
      if (n.y > maxY) maxY = n.y;
    }
    const pad = NODE_RADIUS * 3 + 40;
    minX -= pad; minY -= pad; maxX += pad; maxY += pad;
    const bw = Math.max(200, maxX - minX);
    const bh = Math.max(160, maxY - minY);
    const aspect = containerSize.width / Math.max(containerSize.height, 1);
    let h = bh, w = bh * aspect;
    if (w < bw) { w = bw; h = bw / aspect; }
    const cx = (minX + maxX) / 2, cy = (minY + maxY) / 2;
    setViewBox({ x: cx - w / 2, y: cy - h / 2, w, h });
  };

  const typeLegend = useMemo(() => {
    const types = new Set(data.nodes.map((n) => n.type).filter(Boolean));
    return Array.from(types);
  }, [data.nodes]);

  if (layoutNodes.length === 0) {
    return (
      <div
        ref={containerRef}
        className="w-full rounded-2xl bg-slate-900/40 border border-slate-800 flex items-center justify-center"
        style={{ height }}
      >
        <div className="text-center text-slate-500 text-sm">
          <Layers className="w-8 h-8 mx-auto mb-2 opacity-50" />
          Loading graph data...
        </div>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className="w-full rounded-2xl bg-slate-900/40 border border-slate-800 overflow-hidden relative"
      style={{ height }}
    >
      {title && (
        <div className="absolute top-3 left-4 z-10 flex items-center gap-2 pointer-events-none">
          <span className="text-sm font-semibold text-slate-200">{title}</span>
          <span className="text-[10px] text-slate-500 bg-slate-800/80 px-2 py-0.5 rounded-full border border-slate-700/60">
            {data.nodes.length} nodes • {data.links.length} edges
          </span>
        </div>
      )}

      {showControls && (
        <div className="absolute top-3 right-3 z-10 flex items-center gap-1 bg-slate-900/85 backdrop-blur border border-slate-700/70 rounded-xl p-1 shadow-lg">
          <button
            onClick={() => zoom(0.8)}
            className="p-1.5 rounded-lg text-slate-400 hover:text-emerald-400 hover:bg-slate-800 transition"
            title="Zoom in"
            type="button"
          >
            <ZoomIn className="w-4 h-4" />
          </button>
          <button
            onClick={() => zoom(1.25)}
            className="p-1.5 rounded-lg text-slate-400 hover:text-emerald-400 hover:bg-slate-800 transition"
            title="Zoom out"
            type="button"
          >
            <ZoomOut className="w-4 h-4" />
          </button>
          <div className="w-px h-5 bg-slate-700 mx-0.5" />
          <button
            onClick={resetView}
            className="p-1.5 rounded-lg text-slate-400 hover:text-emerald-400 hover:bg-slate-800 transition"
            title="Reset view"
            type="button"
          >
            <Maximize2 className="w-4 h-4" />
          </button>
        </div>
      )}

      <div className="absolute bottom-3 left-3 z-10 flex items-center gap-2 flex-wrap bg-slate-900/80 backdrop-blur border border-slate-700/50 rounded-xl px-2.5 py-1.5 pointer-events-none">
        {typeLegend.map((t) => (
          <div key={t} className="flex items-center gap-1.5">
            <span
              className="w-2.5 h-2.5 rounded-full"
              style={{ backgroundColor: TYPE_COLORS[t] || '#64748B' }}
            />
            <span className="text-[10px] text-slate-400 font-medium">{t}</span>
          </div>
        ))}
      </div>

      <div className="absolute bottom-3 right-3 z-10 text-[10px] text-slate-500 bg-slate-900/70 px-2 py-1 rounded-lg border border-slate-800/50 pointer-events-none">
        Drag to pan • Scroll to zoom • Click node to explore
      </div>

      <svg
        width={containerSize.width}
        height={containerSize.height}
        className={`cursor-${isDragging ? 'grabbing' : 'grab'} select-none`}
        viewBox={`${viewBox.x} ${viewBox.y} ${viewBox.w} ${viewBox.h}`}
        onMouseDown={handleBackgroundMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onWheel={handleWheel}
      >
        <defs>
          <pattern id="graph-grid" width="40" height="40" patternUnits="userSpaceOnUse">
            <circle cx="20" cy="20" r="0.6" fill="rgba(148,163,184,0.07)" />
          </pattern>
          <radialGradient id="node-glow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="currentColor" stopOpacity="0.4" />
            <stop offset="100%" stopColor="currentColor" stopOpacity="0" />
          </radialGradient>
          <marker id="arrow-requires" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="3.5" markerHeight="3.5" orient="auto-start-reverse">
            <path d="M 0 0 L 10 5 L 0 10 z" fill="#F59E0B" opacity="0.75" />
          </marker>
          <marker id="arrow-related" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="3" markerHeight="3" orient="auto-start-reverse">
            <path d="M 0 0 L 10 5 L 0 10 z" fill="#8B5CF6" opacity="0.7" />
          </marker>
          <filter id="node-shadow" x="-50%" y="-50%" width="200%" height="200%">
            <feDropShadow dx="0" dy="1.5" stdDeviation="2" floodOpacity="0.35" />
          </filter>
        </defs>

        <rect className="graph-bg" x={viewBox.x - 1000} y={viewBox.y - 1000} width={viewBox.w + 2000} height={viewBox.h + 2000} fill="url(#graph-grid)" />

        <g className="links">
          {data.links.map((link, idx) => {
            const source = nodeMap.get(String(link.source));
            const target = nodeMap.get(String(link.target));
            if (!source || !target) return null;

            const isActive = !connectedSet || (connectedSet.has(source.id) && connectedSet.has(target.id));
            const style = LINK_STYLES[link.type || 'RELATED_TO'] || LINK_STYLES.RELATED_TO;
            const opacity = isActive ? 0.75 : 0.08;
            const strokeWidth = isActive ? 1.5 : 0.8;

            const dx = target.x - source.x;
            const dy = target.y - source.y;
            const dist = Math.sqrt(dx * dx + dy * dy) || 1;
            const sx = source.x + (dx / dist) * NODE_RADIUS;
            const sy = source.y + (dy / dist) * NODE_RADIUS;
            const tx = target.x - (dx / dist) * NODE_RADIUS;
            const ty = target.y - (dy / dist) * NODE_RADIUS;

            return (
              <line
                key={`link-${idx}`}
                x1={sx} y1={sy} x2={tx} y2={ty}
                stroke={style.stroke}
                strokeWidth={strokeWidth}
                opacity={opacity}
                strokeDasharray={style.dash}
                markerEnd={style.directional ? style.arrow : undefined}
                style={{ transition: 'opacity 160ms ease, stroke-width 160ms ease' }}
              />
            );
          })}
        </g>

        <g className="nodes">
          {layoutNodes.map((node) => {
            const color = TYPE_COLORS[node.type] || node.color || '#64748B';
            const isActive = !connectedSet || connectedSet.has(node.id);
            const isSelected = node.id === selectedNodeId;
            const isHovered = node.id === hoveredNodeId;
            const showPermanentLabel = !!focusNodeId && node.id === focusNodeId;
            const showLabel = isHovered || isSelected || showPermanentLabel;
            const scale = isSelected || isHovered ? 1.12 : 1;
            const opacity = isActive ? 1 : 0.3;

            const label = node.name.length > 24 ? node.name.slice(0, 23) + '…' : node.name;
            const labelW = Math.min(label.length * 7.2 + 16, 200);

            return (
              <g
                key={node.id}
                transform={`translate(${node.x}, ${node.y}) scale(${scale})`}
                style={{ cursor: 'pointer', transition: 'transform 150ms cubic-bezier(0.34,1.56,0.64,1)', opacity }}
                onClick={(e) => handleNodeClick(node, e)}
                onMouseEnter={() => setHoveredNodeId(node.id)}
                onMouseLeave={() => setHoveredNodeId(null)}
              >
                <circle r={NODE_RADIUS + 14} fill="url(#node-glow)" color={color} opacity={isSelected ? 0.95 : isHovered ? 0.7 : 0} />
                <circle
                  r={NODE_RADIUS}
                  fill={color}
                  stroke={isSelected ? '#ffffff' : 'rgba(255,255,255,0.22)'}
                  strokeWidth={isSelected ? 2.2 : 1}
                  filter="url(#node-shadow)"
                />
                <g fill="white" style={{ pointerEvents: 'none' }} transform="translate(-6, -6)">
                  {TYPE_ICONS[node.type] || <Code2 className="w-3 h-3" />}
                </g>

                {showLabel && (
                  <g transform={`translate(0, ${NODE_RADIUS + 12})`} style={{ pointerEvents: 'none' }}>
                    <rect
                      x={-labelW / 2}
                      y={-10}
                      width={labelW}
                      height={20}
                      rx={6}
                      fill="rgba(2,6,23,0.92)"
                      stroke="rgba(148,163,184,0.28)"
                    />
                    <text textAnchor="middle" y={4} fill="#F1F5F9" fontSize="10.5" fontWeight="600">
                      {label}
                    </text>
                  </g>
                )}
              </g>
            );
          })}
        </g>
      </svg>
    </div>
  );
};
