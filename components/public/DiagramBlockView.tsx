"use client";

import {
  Background,
  Controls,
  type Edge,
  type Node,
  ReactFlow,
  ReactFlowProvider,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import type { DiagramEdge, DiagramNode } from "@/lib/blocks/types";
import { useMemo } from "react";

function layoutNodes(nodes: DiagramNode[]): Node[] {
  // Simple horizontal-ish layout for read-only diagrams
  return nodes.map((n, i) => {
    const col = i % 3;
    const row = Math.floor(i / 3);
    const baseStyle: React.CSSProperties = {
      borderRadius: 8,
      border: "1px solid var(--border-strong)",
      background: "var(--surface-1)",
      color: "var(--text-primary)",
      fontSize: 12,
      padding: "8px 12px",
      fontWeight: 500,
      boxShadow: "none",
    };

    if (n.type === "decision") {
      baseStyle.borderColor = "var(--accent)";
      baseStyle.fontWeight = 600;
    }

    return {
      id: n.id,
      data: { label: n.label },
      position: { x: col * 180, y: row * 100 },
      style: baseStyle,
      type: "default",
      draggable: false,
      connectable: false,
    };
  });
}

function layoutEdges(edges: DiagramEdge[]): Edge[] {
  return edges.map((e) => ({
    id: e.id,
    source: e.source,
    target: e.target,
    label: e.label,
    style: { stroke: "var(--border-strong)" },
    labelStyle: { fill: "var(--text-muted)", fontSize: 11 },
    animated: false,
  }));
}

function Inner({
  nodes,
  edges,
}: {
  nodes: DiagramNode[];
  edges: DiagramEdge[];
}) {
  const flowNodes = useMemo(() => layoutNodes(nodes), [nodes]);
  const flowEdges = useMemo(() => layoutEdges(edges), [edges]);

  return (
    <div className="h-64 w-full rounded-lg border border-[var(--border)] bg-[var(--surface-1)] overflow-hidden">
      <ReactFlow
        nodes={flowNodes}
        edges={flowEdges}
        fitView
        nodesDraggable={false}
        nodesConnectable={false}
        elementsSelectable={false}
        panOnDrag
        zoomOnScroll
        proOptions={{ hideAttribution: true }}
      >
        <Background color="var(--border)" gap={16} size={1} />
        <Controls showInteractive={false} />
      </ReactFlow>
    </div>
  );
}

export function DiagramBlockView({
  nodes,
  edges,
}: {
  nodes: DiagramNode[];
  edges: DiagramEdge[];
}) {
  return (
    <ReactFlowProvider>
      <Inner nodes={nodes} edges={edges} />
    </ReactFlowProvider>
  );
}
