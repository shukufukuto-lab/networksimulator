"use client";

import { NODE_W, NODE_H } from "@/components/NodeItem";

interface Props {
  link: Link;
  nodes: Map<NodeId, NetworkNode>;
  isActive: boolean;
  isSelected: boolean;
  onClick: () => void;
  onContextMenu: (e: React.MouseEvent<SVGLineElement>) => void;
  onEndpointMouseDown: (e: React.MouseEvent<SVGCircleElement>, isEndpointA: boolean) => void;
}

function nodeCenter(node: NetworkNode): { x: number; y: number } {
  return {
    x: node.position.x + NODE_W / 2,
    y: node.position.y + NODE_H / 2,
  };
}

export default function LinkItem({
  link,
  nodes,
  isActive,
  isSelected,
  onClick,
  onContextMenu,
  onEndpointMouseDown,
}: Props) {
  const nodeA = nodes.get(link.nodeA);
  const nodeB = nodes.get(link.nodeB);
  if (!nodeA || !nodeB) return null;

  const a = nodeCenter(nodeA);
  const b = nodeCenter(nodeB);

  const lineColor = isSelected ? "#f9e2af" : isActive ? "#89b4fa" : "#585b70";
  const lineWidth = isSelected ? 3 : isActive ? 3 : 2;
  const lineFilter = isSelected
    ? "drop-shadow(0 0 6px #f9e2af)"
    : isActive
      ? "drop-shadow(0 0 4px #89b4fa)"
      : undefined;

  return (
    <>
      {/* 太いヒット領域（クリック・右クリック検出用） */}
      <line
        x1={a.x}
        y1={a.y}
        x2={b.x}
        y2={b.y}
        stroke="transparent"
        strokeWidth={16}
        style={{ cursor: "pointer" }}
        onClick={onClick}
        onContextMenu={onContextMenu}
      />
      {/* 見た目のライン */}
      <line
        x1={a.x}
        y1={a.y}
        x2={b.x}
        y2={b.y}
        stroke={lineColor}
        strokeWidth={lineWidth}
        pointerEvents="none"
        style={lineFilter ? { filter: lineFilter } : undefined}
      />
      {/* 選択時: エンドポイント円（ドラッグで再接続） */}
      {isSelected && (
        <>
          <circle
            cx={a.x}
            cy={a.y}
            r={6}
            fill="#f9e2af"
            stroke="#1e1e2e"
            strokeWidth={2}
            style={{ cursor: "crosshair" }}
            onMouseDown={(e) => onEndpointMouseDown(e, true)}
          />
          <circle
            cx={b.x}
            cy={b.y}
            r={6}
            fill="#f9e2af"
            stroke="#1e1e2e"
            strokeWidth={2}
            style={{ cursor: "crosshair" }}
            onMouseDown={(e) => onEndpointMouseDown(e, false)}
          />
        </>
      )}
    </>
  );
}
