import React, { useEffect, useRef, useState } from 'react';
import cytoscape from 'cytoscape';
import { Search, ZoomIn, ZoomOut, RefreshCw, Layers, Compass, Network, GitBranch } from 'lucide-react';

interface CytoscapeGraphProps {
  elements: { nodes: any[]; edges: any[] };
  selectedNodeId?: string;
  onSelectNode: (nodeData: any) => void;
  height?: string;
  defaultLayout?: 'concentric' | 'cose' | 'circle' | 'breadthfirst';
  autoHighlightCenter?: boolean;
}

export const CytoscapeGraph: React.FC<CytoscapeGraphProps> = ({
  elements,
  selectedNodeId,
  onSelectNode,
  height = '580px',
  defaultLayout = 'concentric',
  autoHighlightCenter = true,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const cyRef = useRef<cytoscape.Core | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentLayout, setCurrentLayout] = useState<'concentric' | 'cose' | 'circle' | 'breadthfirst'>(defaultLayout);

  useEffect(() => {
    setCurrentLayout(defaultLayout);
  }, [defaultLayout]);

  const getLayoutOptions = (layoutType: string) => {
    switch (layoutType) {
      case 'cose':
        return {
          name: 'cose',
          animate: false,
          idealEdgeLength: 80,
          nodeOverlap: 25,
          refresh: 20,
          fit: true,
          padding: 40,
          randomize: false,
          componentSpacing: 110,
          nodeRepulsion: 750000,
          edgeElasticity: 90,
          nestingFactor: 5,
          gravity: 50,
          numIter: 1000,
          coolingFactor: 0.95,
          minTemp: 1.0,
        };
      case 'circle':
        return {
          name: 'circle',
          padding: 40,
          animate: false,
          spacingFactor: 1.1,
        };
      case 'breadthfirst':
        return {
          name: 'breadthfirst',
          directed: true,
          padding: 40,
          animate: false,
          spacingFactor: 1.3,
        };
      case 'concentric':
      default:
        return {
          name: 'concentric',
          concentric: (node: any) => {
            const type = node.data('type');
            const isCenter = node.data('is_center');
            const id = node.data('id');
            if (isCenter || type === 'CASE' || id === selectedNodeId) return 100;
            if (type === 'ACCOUNT') return 55;
            if (type === 'ATM') return 30;
            if (type === 'PHONE') return 20;
            return 10;
          },
          levelWidth: () => 1,
          padding: 45,
          animate: false,
          spacingFactor: 1.3,
        };
    }
  };

  const applyLayout = (layoutType: 'concentric' | 'cose' | 'circle' | 'breadthfirst') => {
    setCurrentLayout(layoutType);
    if (!cyRef.current) return;
    const l = cyRef.current.layout(getLayoutOptions(layoutType) as any);
    l.run();
  };

  useEffect(() => {
    if (!containerRef.current) return;

    const rawNodes = elements?.nodes || (elements as any)?.elements?.nodes || [];
    const rawEdges = elements?.edges || (elements as any)?.elements?.edges || [];

    const cy = cytoscape({
      container: containerRef.current,
      elements: [
        ...rawNodes.map((n) => {
          const d = n.data || n;
          return {
            group: 'nodes' as const,
            data: {
              id: String(d.id),
              label: String(d.label || d.id),
              type: String(d.type || 'UNKNOWN'),
              risk: d.risk ?? d.risk_score,
              risk_level: d.risk_level,
              is_center: Boolean(d.is_center),
              category: d.category,
              jurisdiction: d.jurisdiction,
              priority: d.priority,
              zone_id: d.zone_id,
              hotspot_location: d.hotspot_location,
              details: d.details || {},
            },
          };
        }),
        ...rawEdges.map((e, idx) => {
          const d = e.data || e;
          return {
            group: 'edges' as const,
            data: {
              id: d.id || `e_${idx}`,
              source: String(d.source),
              target: String(d.target),
              relationship: d.relationship || 'CONNECTED_TO',
              weight: d.weight || 1.0,
            },
          };
        }),
      ],
      style: [
        {
          selector: 'node',
          style: {
            'label': 'data(label)',
            'color': '#0f172a',
            'font-size': '10px',
            'font-weight': 'bold',
            'text-valign': 'bottom',
            'text-margin-y': 4,
            'background-color': '#0284c7',
            'border-width': 2,
            'border-color': '#ffffff',
            'width': 34,
            'height': 34,
          },
        },
        {
          selector: 'node[type = "PERSON"]',
          style: { 
            'background-color': '#dc2626',
            'width': 38,
            'height': 38,
            'border-color': '#fca5a5',
            'border-width': 2,
          },
        },
        {
          selector: 'node[type = "ACCOUNT"]',
          style: { 
            'background-color': '#0284c7',
            'width': 36,
            'height': 36,
            'border-color': '#bae6fd',
            'border-width': 2,
          },
        },
        {
          selector: 'node[type = "PHONE"]',
          style: { 
            'background-color': '#16a34a',
            'width': 34,
            'height': 34,
            'border-color': '#bbf7d0',
            'border-width': 2,
          },
        },
        {
          selector: 'node[type = "DEVICE"]',
          style: { 
            'background-color': '#9333ea',
            'width': 34,
            'height': 34,
          },
        },
        {
          selector: 'node[type = "ATM"]',
          style: { 
            'shape': 'diamond',
            'background-color': '#ea580c',
            'width': 40,
            'height': 40,
            'border-color': '#fed7aa',
            'border-width': 2,
          },
        },
        {
          selector: 'node[type = "CASE"]',
          style: { 
            'shape': 'round-rectangle',
            'background-color': '#1d4ed8',
            'width': 140,
            'height': 42,
            'color': '#ffffff',
            'font-size': '11px',
            'font-weight': 'bold',
            'text-valign': 'center',
            'text-halign': 'center',
            'text-margin-y': 0,
            'border-width': 3,
            'border-color': '#93c5fd',
            'border-opacity': 1,
            'z-index': 100,
          },
        },
        {
          selector: 'node[risk_level = "CRITICAL"]',
          style: {
            'border-color': '#ef4444',
            'border-width': 3.5,
          },
        },
        {
          selector: 'node[type = "CASE"][risk_level = "CRITICAL"]',
          style: {
            'background-color': '#b91c1c',
            'border-color': '#fca5a5',
          },
        },
        {
          selector: 'node[type = "CASE"][risk_level = "LOW"]',
          style: {
            'background-color': '#047857',
            'border-color': '#6ee7b7',
          },
        },
        {
          selector: 'node[type = "ATM"][risk_level = "CRITICAL"]',
          style: {
            'background-color': '#dc2626',
            'border-color': '#fecaca',
          },
        },
        {
          selector: 'node[type = "ATM"][risk_level = "LOW"]',
          style: {
            'background-color': '#059669',
            'border-color': '#a7f3d0',
          },
        },
        {
          selector: 'edge',
          style: {
            'width': 2,
            'line-color': '#94a3b8',
            'target-arrow-color': '#475569',
            'target-arrow-shape': 'triangle',
            'curve-style': 'bezier',
            'label': 'data(relationship)',
            'font-size': '9px',
            'font-weight': 'bold',
            'color': '#334155',
            'text-rotation': 'autorotate',
            'text-background-opacity': 0.9,
            'text-background-color': '#ffffff',
            'text-background-padding': '3px',
            'text-background-shape': 'roundrectangle',
          },
        },
        {
          selector: ':selected',
          style: {
            'border-width': 4,
            'border-color': '#2563eb',
          },
        },
        {
          selector: '.dimmed',
          style: {
            'opacity': 0.18,
            'transition-property': 'opacity',
            'transition-duration': 0.2,
          },
        },
        {
          selector: '.highlighted',
          style: {
            'opacity': 1,
            'z-index': 999,
            'transition-property': 'opacity',
            'transition-duration': 0.2,
          },
        },
        {
          selector: 'node.selected-node',
          style: {
            'border-width': 4,
            'border-color': '#2563eb',
            'border-opacity': 1,
            'z-index': 1000,
          },
        },
        {
          selector: 'edge.highlighted',
          style: {
            'width': 3.5,
            'line-color': '#2563eb',
            'target-arrow-color': '#1d4ed8',
            'arrow-scale': 1.3,
            'z-index': 999,
            'opacity': 1,
          },
        },
      ],
      layout: getLayoutOptions(defaultLayout) as any,
    });

    const findTargetNode = () => {
      if (selectedNodeId) {
        const byId = cy.getElementById(selectedNodeId);
        if (byId && byId.length > 0) return byId;
      }
      const centerNodes = cy.nodes().filter((n) => n.data('is_center') || n.data('type') === 'CASE');
      if (centerNodes.length > 0) return centerNodes[0];
      return cy.nodes().first();
    };

    if (autoHighlightCenter) {
      const targetNode = findTargetNode();
      if (targetNode && targetNode.length > 0) {
        cy.elements().removeClass('dimmed highlighted selected-node');
        const neighborhood = targetNode.neighborhood().add(targetNode);
        cy.elements().difference(neighborhood).addClass('dimmed');
        neighborhood.addClass('highlighted');
        targetNode.addClass('selected-node');
        onSelectNode(targetNode.data());
      }
    }

    cy.on('tap', 'node', (evt) => {
      const node = evt.target;
      onSelectNode(node.data());

      cy.elements().removeClass('dimmed highlighted selected-node');
      const neighborhood = node.neighborhood().add(node);
      cy.elements().difference(neighborhood).addClass('dimmed');
      neighborhood.addClass('highlighted');
      node.addClass('selected-node');
    });

    cy.on('tap', (evt) => {
      if (evt.target === cy) {
        cy.elements().removeClass('dimmed highlighted selected-node');
        onSelectNode(null);
      }
    });

    cyRef.current = cy;

    const timer = setTimeout(() => {
      if (cyRef.current) {
        cyRef.current.resize();
        if (autoHighlightCenter) {
          const node = findTargetNode();
          if (node && node.length > 0) {
            cyRef.current.center(node);
            cyRef.current.fit(node.neighborhood().add(node), 50);
          } else {
            cyRef.current.fit(undefined, 40);
          }
        } else {
          cyRef.current.fit(undefined, 40);
        }
      }
    }, 120);

    return () => {
      clearTimeout(timer);
      cy.destroy();
      cyRef.current = null;
    };
  }, [elements, selectedNodeId, defaultLayout, autoHighlightCenter]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!cyRef.current || !searchTerm.trim()) return;
    const term = searchTerm.toLowerCase();
    const matched = cyRef.current.nodes().filter((n) => {
      const label = (n.data('label') || '').toLowerCase();
      const id = (n.data('id') || '').toLowerCase();
      return label.includes(term) || id.includes(term);
    });

    if (matched.length > 0) {
      cyRef.current.nodes().unselect();
      matched.select();
      cyRef.current.elements().removeClass('dimmed highlighted selected-node');
      const neighborhood = matched[0].neighborhood().add(matched[0]);
      cyRef.current.elements().difference(neighborhood).addClass('dimmed');
      neighborhood.addClass('highlighted');
      matched[0].addClass('selected-node');
      cyRef.current.animate({
        center: { eles: matched[0] },
        zoom: 1.4,
        duration: 500,
      });
      onSelectNode(matched[0].data());
    }
  };

  const handleZoomIn = () => cyRef.current?.zoom(cyRef.current.zoom() * 1.25);
  const handleZoomOut = () => cyRef.current?.zoom(cyRef.current.zoom() * 0.8);
  const handleReset = () => {
    if (!cyRef.current) return;
    cyRef.current.elements().removeClass('dimmed highlighted selected-node');
    cyRef.current.fit(undefined, 40);
  };

  return (
    <div className="relative rounded-2xl overflow-hidden border border-slate-200 bg-white shadow-xs flex flex-col h-full w-full">
      <div className="p-3 bg-white border-b border-slate-200 flex flex-wrap items-center justify-between gap-2.5 z-10 shrink-0">
        <form onSubmit={handleSearch} className="relative w-60 sm:w-72">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search entity node (ACC, ATM, CASE)..."
            className="w-full bg-slate-50 text-xs text-slate-800 placeholder-slate-400 pl-8 pr-3 py-1.5 rounded-lg border border-slate-200 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-100"
          />
        </form>

        <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl border border-slate-200 text-xs">
          <span className="text-[10px] font-bold text-slate-500 px-1.5 flex items-center gap-1 uppercase">
            <Layers className="w-3 h-3 text-blue-600" />
            <span className="hidden sm:inline">Layout:</span>
          </span>
          <button
            type="button"
            onClick={() => applyLayout('concentric')}
            className={`px-2 py-1 rounded-lg font-bold text-[11px] transition cursor-pointer flex items-center gap-1 ${
              currentLayout === 'concentric'
                ? 'bg-white text-blue-700 shadow-xs border border-slate-200 font-black'
                : 'text-slate-600 hover:text-slate-900'
            }`}
            title="Concentric Circles Layout (Best for Case Ego Networks)"
          >
            <Compass className="w-3 h-3" />
            <span>Ego Orbit</span>
          </button>
          <button
            type="button"
            onClick={() => applyLayout('cose')}
            className={`px-2 py-1 rounded-lg font-bold text-[11px] transition cursor-pointer flex items-center gap-1 ${
              currentLayout === 'cose'
                ? 'bg-white text-blue-700 shadow-xs border border-slate-200 font-black'
                : 'text-slate-600 hover:text-slate-900'
            }`}
            title="Force-Directed Layout (Best for All Risks multi-cluster network)"
          >
            <Network className="w-3 h-3" />
            <span>Force Spread</span>
          </button>
          <button
            type="button"
            onClick={() => applyLayout('breadthfirst')}
            className={`px-2 py-1 rounded-lg font-bold text-[11px] transition cursor-pointer flex items-center gap-1 ${
              currentLayout === 'breadthfirst'
                ? 'bg-white text-blue-700 shadow-xs border border-slate-200 font-black'
                : 'text-slate-600 hover:text-slate-900'
            }`}
            title="Hierarchical Tree Layout"
          >
            <GitBranch className="w-3 h-3" />
            <span>Hierarchy</span>
          </button>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={handleZoomIn}
            className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 transition cursor-pointer"
            title="Zoom In"
          >
            <ZoomIn className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={handleZoomOut}
            className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 transition cursor-pointer"
            title="Zoom Out"
          >
            <ZoomOut className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={handleReset}
            className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 transition cursor-pointer"
            title="Reset View & Clear Highlights"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div ref={containerRef} className="flex-1 w-full min-h-[460px] bg-slate-50 relative" />

      <div className="p-2.5 bg-white border-t border-slate-200 flex flex-wrap items-center justify-between gap-3 text-[11px] text-slate-700 overflow-x-auto shrink-0">
        <div className="flex items-center gap-3">
          <span className="text-[10px] font-bold uppercase text-slate-500">Entities:</span>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-md bg-[#1d4ed8]"></div>
            <span className="font-semibold text-slate-700">Case</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-full bg-[#0284c7]"></div>
            <span className="font-semibold text-slate-700">Mule A/C</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rotate-45 bg-[#ea580c]"></div>
            <span className="font-semibold text-slate-700">ATM</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-full bg-[#16a34a]"></div>
            <span className="font-semibold text-slate-700">Phone</span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <span className="text-[10px] font-bold uppercase text-slate-500">Risk Tiers:</span>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-red-600 ring-2 ring-red-200"></span>
            <span className="font-bold text-red-700 text-[10px]">Critical (70+)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-orange-500 ring-2 ring-orange-200"></span>
            <span className="font-bold text-orange-700 text-[10px]">High (50–69)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500 ring-2 ring-amber-200"></span>
            <span className="font-bold text-amber-700 text-[10px]">Medium (30–49)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-600 ring-2 ring-emerald-200"></span>
            <span className="font-bold text-emerald-700 text-[10px]">Low (&lt;30)</span>
          </div>
        </div>
      </div>
    </div>
  );
};
